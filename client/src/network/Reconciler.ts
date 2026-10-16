import * as THREE from 'three';
import { Player } from '../entities/Player.js';
import { Shuttlecock } from '../physics/Shuttlecock.js';
import { COURT } from '../physics/CourtBounds.js';
import {
  PlayerStatePacket,
  ShuttleHitPacket,
  SlotIndex
} from '../../../server/src/types/packets.js';

export class Reconciler {
  private targetPositions: Record<SlotIndex, THREE.Vector3> = {
    0: new THREE.Vector3(0, 0, 3.2),
    1: new THREE.Vector3(0, 0, -3.2),
    2: new THREE.Vector3(-1.2, 0, 3.2),
    3: new THREE.Vector3(1.2, 0, -3.2)
  };

  private targetVelocities: Record<SlotIndex, THREE.Vector2> = {
    0: new THREE.Vector2(0, 0),
    1: new THREE.Vector2(0, 0),
    2: new THREE.Vector2(0, 0),
    3: new THREE.Vector2(0, 0)
  };

  public applyOpponentPacket(pkt: PlayerStatePacket, players: Player[]): void {
    const targetPlayer = players[pkt.slotIndex];
    if (!targetPlayer) return;
    this.targetPositions[pkt.slotIndex].set(pkt.x, pkt.y, pkt.z);
    this.targetVelocities[pkt.slotIndex].set(pkt.vx, pkt.vz);
    targetPlayer.animState = pkt.anim;
    if (pkt.anim === 'SWING') {
      targetPlayer.triggerSwing();
    }
  }

  /**
   * Extrapolates remote player position using their current velocity vector (Dead Reckoning)
   * and smoothly snaps to the latest packet coordinate.
   */
  public interpolateRemotePlayers(
    dt: number,
    players: Player[],
    localSlot: SlotIndex,
    activeRemoteSlots: Set<SlotIndex>
  ): void {
    activeRemoteSlots.forEach((slot) => {
      if (slot === localSlot) return;
      const p = players[slot];
      if (!p) return;

      const vel = this.targetVelocities[slot];
      const target = this.targetPositions[slot];

      // Advance predicted position by velocity between network packets
      target.x = THREE.MathUtils.clamp(
        target.x + vel.x * dt * 0.65,
        -COURT.HALF_WIDTH - 0.65,
        COURT.HALF_WIDTH + 0.65
      );
      target.z += vel.y * dt * 0.65;

      p.pos.lerp(target, Math.min(1, dt * 22));
      p.syncMesh();
    });
  }

  /**
   * Fast-forwards the incoming shuttlecock trajectory by the exact one-way network transit time
   * so the shuttle appears at the exact same real-time position on both players' screens!
   */
  public applyDeterministicHit(
    pkt: ShuttleHitPacket,
    shuttle: Shuttlecock,
    currentServerTimeMs: number
  ): void {
    const startPos = new THREE.Vector3(...pkt.pos);
    const vel = new THREE.Vector3(...pkt.vel);

    // Calculate one-way packet transit time (clamped between 0s and 0.35s)
    const transitSec = THREE.MathUtils.clamp(
      (currentServerTimeMs - pkt.timestamp) / 1000,
      0,
      0.35
    );

    // Fast-forward aerodynamic drag physics in 4ms sub-steps to catch up to real time
    const stepDt = 0.004;
    let remaining = transitSec;
    while (remaining > 0) {
      const dt = Math.min(stepDt, remaining);
      Shuttlecock.stepAerodynamics(startPos, vel, dt);
      if (startPos.y <= 0.12) {
        startPos.y = 0.12;
        break;
      }
      remaining -= dt;
    }

    shuttle.launch(startPos, vel, pkt.hitterSide, pkt.shotType, pkt.rallyCount);
  }
}