import * as THREE from 'three';
import { Player } from '../entities/Player.js';
import { Shuttlecock } from './Shuttlecock.js';
import { ShotType } from '../../../server/src/types/packets.js';
import { StrikeCategory } from '../core/InputManager.js';

export type TimingGrade = 'PERFECT' | 'GOOD' | 'LATE';

export interface ResolvedHit {
  shotType: ShotType;
  velocity: THREE.Vector3;
  isSweetSpot: boolean;
  timingGrade: TimingGrade;
  isBackhand: boolean;
}

export class HitDetection {
  /**
   * Evaluates strike reach, Sweet-Spot timing window, Forehand/Backhand side,
   * and computes a drag-compensated launch velocity vector to the aimed court target.
   */
  public static tryStrike(
    player: Player,
    shuttle: Shuttlecock,
    category: StrikeCategory,
    aimTarget: THREE.Vector3,
    chargeRatio = 0.5
  ): ResolvedHit | null {
    const racketCenter = player.getStrikeCenter();

    // Lunge ('Shift') extends horizontal reach radius by +45%
    const maxHorizReach = player.isLunging ? 2.25 : 1.62;
    const horizDist = Math.hypot(player.pos.x - shuttle.pos.x, player.pos.z - shuttle.pos.z);
    const heightDiff = Math.abs(racketCenter.y - shuttle.pos.y);

    if (horizDist > maxHorizReach || heightDiff > 1.45) {
      return null;
    }

    // Determine Forehand vs Backhand (Right-handed player: +X is forehand on Side 0, -X on Side 1)
    const relX = shuttle.pos.x - player.pos.x;
    const isBackhand = player.side === 0 ? relX < -0.25 : relX > 0.25;

    // Determine Sweet-Spot Timing Grade based on whether shuttle is struck in front of body
    const forwardSign = player.side === 0 ? -1 : 1;
    const relZ = (shuttle.pos.z - player.pos.z) * forwardSign;
    let timingGrade: TimingGrade = 'GOOD';

    if (!shuttle.inPlay) {
      timingGrade = 'PERFECT';
    } else if (relZ >= -0.05 && horizDist < 1.05 && heightDiff < 0.75) {
      timingGrade = 'PERFECT';
    } else if (relZ < -0.35 || horizDist > 1.42) {
      timingGrade = 'LATE';
    }

    const isSweetSpot = timingGrade === 'PERFECT';
    const oppDirZ = player.side === 0 ? -1 : 1;
    const contactY = shuttle.pos.y;

    let shotType: ShotType = 'FLAT_DRIVE';
    let desiredPeakY = 2.4;
    let targetX = aimTarget.x;
    let targetZ = aimTarget.z;

    // 1. SERVE LOGIC (Short Low Serve vs High Deep Flick Serve)
    if (!shuttle.inPlay) {
      shotType = 'SERVE';
      // Diagonal service court enforcement
      const serviceRightCourt = player.pos.x >= 0;
      const diagSignX = serviceRightCourt ? -1 : 1;
      targetX = THREE.MathUtils.clamp(
        aimTarget.x,
        diagSignX > 0 ? 0.2 : -2.4,
        diagSignX > 0 ? 2.4 : -0.2
      );

      if (category === 'FINESSE') {
        // Short Low Serve skimming the net tape
        targetZ = oppDirZ * 2.15;
        desiredPeakY = 1.72;
      } else {
        // High Deep Flick Serve to back boundary
        targetZ = oppDirZ * 5.85;
        desiredPeakY = 4.8;
      }
    } else if (category === 'ATTACK') {
      // 2. ATTACK BUTTON ('J' / Left-Click): Jump Smash, Full Smash, or Flat Drive
      if (player.isAirborne && contactY > 1.85) {
        shotType = 'JUMP_SMASH';
        targetZ = THREE.MathUtils.clamp(targetZ, oppDirZ > 0 ? 1.8 : -5.4, oppDirZ > 0 ? 5.4 : -1.8);
        desiredPeakY = Math.max(1.64, contactY + 0.06); // Steep downward trajectory
      } else if (contactY > 1.65) {
        shotType = 'JUMP_SMASH';
        desiredPeakY = Math.max(1.72, contactY + 0.18);
      } else {
        shotType = 'FLAT_DRIVE';
        desiredPeakY = 1.92;
      }
    } else if (category === 'ARC') {
      // 3. HIGH ARC BUTTON ('K' / 'E' / Middle-Click): High Clear or Defensive Lift
      targetZ = oppDirZ * THREE.MathUtils.clamp(Math.abs(targetZ), 4.6, 6.55);
      if (contactY > 1.55) {
        shotType = 'HIGH_CLEAR';
        desiredPeakY = 5.6;
      } else {
        shotType = 'DEFENSIVE_LIFT';
        desiredPeakY = 5.9;
      }
    } else {
      // 4. FINESSE BUTTON ('L' / Right-Click): Sliced Drop Shot or Tight Hairpin Net Shot
      targetZ = oppDirZ * THREE.MathUtils.clamp(Math.abs(targetZ), 0.85, 2.35);
      if (contactY > 1.55) {
        shotType = 'DROP_SHOT';
        desiredPeakY = Math.max(1.76, contactY + 0.15);
      } else {
        shotType = 'NET_SHOT';
        desiredPeakY = 1.74;
      }
    }

    // Apply Timing Grade & Backhand accuracy dispersion
    if (timingGrade === 'LATE') {
      // Frame hit drifts wider (risk of going OUT!) and pops up higher
      targetX += (Math.random() - 0.5) * 0.95;
      targetZ += oppDirZ * (chargeRatio > 0.7 ? 0.65 : -0.45);
      desiredPeakY += 0.65;
    } else if (timingGrade === 'GOOD') {
      targetX += (Math.random() - 0.5) * 0.22;
    }

    const velocity = this.solveDragCompensatedVelocity(
      shuttle.pos,
      new THREE.Vector3(targetX, 0.08, targetZ),
      desiredPeakY,
      shotType,
      isSweetSpot,
      isBackhand,
      chargeRatio
    );

    return {
      shotType,
      velocity,
      isSweetSpot,
      timingGrade,
      isBackhand
    };
  }

  /**
   * Computes the initial 3D launch velocity vector (vx, vy, vz) accounting for
   * Shuttlecock feather skirt drag so the shuttle lands accurately at targetPos.
   */
  private static solveDragCompensatedVelocity(
    startPos: THREE.Vector3,
    targetPos: THREE.Vector3,
    peakY: number,
    shotType: ShotType,
    isSweetSpot: boolean,
    isBackhand: boolean,
    chargeRatio: number
  ): THREE.Vector3 {
    const dx = targetPos.x - startPos.x;
    const dz = targetPos.z - startPos.z;
    const horizDist = Math.max(0.5, Math.hypot(dx, dz));
    const dirX = dx / horizDist;
    const dirZ = dz / horizDist;

    // Vertical launch velocity needed to clear net / reach peakY under drag
    let vy = 4.5;
    if (shotType === 'JUMP_SMASH') {
      // Direct steep downward angle if contact is high above the net
      vy = startPos.y > 2.15 ? -2.8 : -0.6;
    } else {
      const rise = Math.max(0.25, peakY - startPos.y);
      vy = Math.sqrt(2 * Math.abs(Shuttlecock.GRAVITY) * rise) * 1.28;
    }

    // Binary search horizontal launch speed so simulated drag trajectory lands at horizDist
    let lowS = 6.0;
    let highS = shotType === 'JUMP_SMASH' ? 54.0 : 42.0;

    for (let iter = 0; iter < 12; iter++) {
      const midS = (lowS + highS) * 0.5;
      const simPos = new THREE.Vector3(0, startPos.y, 0);
      const simVel = new THREE.Vector3(0, vy, midS);
      const dt = 1 / 60;

      for (let step = 0; step < 180; step++) {
        Shuttlecock.stepAerodynamics(simPos, simVel, dt);
        if (simPos.y <= 0.08) break;
      }

      if (simPos.z < horizDist) {
        lowS = midS;
      } else {
        highS = midS;
      }
    }

    let finalHorizSpeed = (lowS + highS) * 0.5;

    // Sweet-Spot & Charge Speed Modifiers on Attacking Shots
    if (shotType === 'JUMP_SMASH' || shotType === 'FLAT_DRIVE') {
      const boost = (isSweetSpot ? 1.16 : 1.0) * (0.94 + chargeRatio * 0.14) * (isBackhand ? 0.88 : 1.0);
      finalHorizSpeed *= boost;
    }

    return new THREE.Vector3(dirX * finalHorizSpeed, vy, dirZ * finalHorizSpeed);
  }
}