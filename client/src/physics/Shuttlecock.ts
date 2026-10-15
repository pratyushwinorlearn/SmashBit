import * as THREE from 'three';
import { COURT } from './CourtBounds.js';
import { ShotType } from '../../../server/src/types/packets.js';
import { GbaSpriteFactory } from '../graphics/GbaSpriteFactory.js';

export class Shuttlecock {
  public mesh = new THREE.Group();
  public shadowRing: THREE.Mesh;
  public pos = new THREE.Vector3(0, 1.2, 3.2);
  public vel = new THREE.Vector3(0, 0, 0);
  public inPlay = false;
  public lastHitterSide: 0 | 1 = 0;
  public currentShotType: ShotType = 'SERVE';
  public rallyCount = 0;

  // Authentic BWF Feather Shuttle Aerodynamic Constants
  public static readonly GRAVITY = -12.8;
  public static readonly HORIZ_DRAG = 0.068; // Feather skirt air-brake in X/Z
  public static readonly VERT_DRAG = 0.042;  // Terminal vertical parachute drag

  private trailPositions: THREE.Vector3[] = [];
  private trailLine: THREE.Line;
  private trailMat: THREE.LineBasicMaterial;
  private sparkRing: THREE.Mesh;
  private sparkTimer = 0;

  constructor(scene: THREE.Scene) {
    const shuttleTex = GbaSpriteFactory.createShuttleSprite();
    const spriteGeo = new THREE.PlaneGeometry(0.36, 0.28);
    const spriteMat = new THREE.MeshBasicMaterial({
      map: shuttleTex,
      transparent: true,
      alphaTest: 0.1,
      side: THREE.DoubleSide
    });
    const spriteQuad = new THREE.Mesh(spriteGeo, spriteMat);
    this.mesh.add(spriteQuad);
    scene.add(this.mesh);

    // Golden Sweet-Spot Impact Flash Ring
    this.sparkRing = new THREE.Mesh(
      new THREE.RingGeometry(0.08, 0.42, 8),
      new THREE.MeshBasicMaterial({
        color: 0xfacc15,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide
      })
    );
    scene.add(this.sparkRing);

    // Floor Shadow Target Ring
    const ringGeo = new THREE.RingGeometry(0.12, 0.24, 16);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xfacc15,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9
    });
    this.shadowRing = new THREE.Mesh(ringGeo, ringMat);
    this.shadowRing.rotation.x = -Math.PI / 2;
    this.shadowRing.position.y = 0.012;
    scene.add(this.shadowRing);

    const trailGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(),
      new THREE.Vector3()
    ]);
    this.trailMat = new THREE.LineBasicMaterial({
      color: 0xf8fafc,
      transparent: true,
      opacity: 0.7
    });
    this.trailLine = new THREE.Line(trailGeo, this.trailMat);
    scene.add(this.trailLine);
  }

  public triggerSweetSpotFlash(): void {
    this.sparkTimer = 0.18;
    this.sparkRing.position.copy(this.pos);
    this.sparkRing.scale.set(0.4, 0.4, 1);
    (this.sparkRing.material as THREE.MeshBasicMaterial).opacity = 1.0;
  }

  public launch(
    startPos: THREE.Vector3,
    velocity: THREE.Vector3,
    hitterSide: 0 | 1,
    shotType: ShotType,
    rallyCount: number
  ): void {
    this.pos.copy(startPos);
    this.vel.copy(velocity);
    this.lastHitterSide = hitterSide;
    this.currentShotType = shotType;
    this.rallyCount = rallyCount;
    this.inPlay = true;
    this.trailPositions = [this.pos.clone()];

    // Color-code the flight trail by shot intensity
    if (shotType === 'JUMP_SMASH') {
      this.trailMat.color.setHex(0xfacc15);
    } else if (shotType === 'DROP_SHOT' || shotType === 'NET_SHOT') {
      this.trailMat.color.setHex(0x38bdf8);
    } else {
      this.trailMat.color.setHex(0xf8fafc);
    }
  }

  public resetToServer(servingSide: 0 | 1, serverPos: THREE.Vector3): void {
    this.inPlay = false;
    this.vel.set(0, 0, 0);
    const zOffset = servingSide === 0 ? -0.32 : 0.32;
    this.pos.set(serverPos.x + 0.22, 1.12, serverPos.z + zOffset);
    this.syncVisuals();
  }

  /**
   * Pure deterministic step function used by both real-time flight and HitDetection ballistic solver.
   */
  public static stepAerodynamics(pos: THREE.Vector3, vel: THREE.Vector3, subDt: number): void {
    const speed = vel.length();
    // Anisotropic feather drag: strong horizontal air-brake so clears drop nearly 90 deg at baseline
    const ax = -Shuttlecock.HORIZ_DRAG * speed * vel.x * 1.15;
    const az = -Shuttlecock.HORIZ_DRAG * speed * vel.z * 1.15;
    const ay = Shuttlecock.GRAVITY - Shuttlecock.VERT_DRAG * speed * vel.y;

    vel.x += ax * subDt;
    vel.y += ay * subDt;
    vel.z += az * subDt;

    pos.addScaledVector(vel, subDt);
  }

  public update(
    dt: number,
    onNetCord: () => void,
    onFloorHit: (x: number, z: number) => void
  ): void {
    if (this.sparkTimer > 0) {
      this.sparkTimer = Math.max(0, this.sparkTimer - dt);
      const s = 0.4 + (0.18 - this.sparkTimer) * 6.5;
      this.sparkRing.scale.set(s, s, 1);
      (this.sparkRing.material as THREE.MeshBasicMaterial).opacity = this.sparkTimer / 0.18;
    }

    if (!this.inPlay) {
      this.syncVisuals();
      return;
    }

    const subSteps = 4;
    const subDt = dt / subSteps;

    for (let i = 0; i < subSteps; i++) {
      const prevZ = this.pos.z;
      Shuttlecock.stepAerodynamics(this.pos, this.vel, subDt);

      // Net Tape & Mesh Collision
      if ((prevZ > 0 && this.pos.z <= 0) || (prevZ < 0 && this.pos.z >= 0)) {
        if (this.pos.y < COURT.NET_HEIGHT && Math.abs(this.pos.x) <= COURT.DOUBLES_WIDTH / 2) {
          if (this.pos.y >= COURT.NET_HEIGHT - 0.12) {
            // Realistic Net-Cord Tape Dribble!
            this.vel.x *= 0.28;
            this.vel.z *= 0.22;
            this.vel.y = Math.max(1.8, Math.abs(this.vel.y) * 0.35);
            this.pos.y = COURT.NET_HEIGHT + 0.02;
            onNetCord();
          } else {
            // Caught in the net mesh
            this.vel.set(this.vel.x * 0.15, -1.6, -this.vel.z * 0.06);
            this.pos.z = prevZ > 0 ? 0.08 : -0.08;
            onNetCord();
          }
        }
      }

      if (this.pos.y <= 0.08) {
        this.pos.y = 0.08;
        this.inPlay = false;
        onFloorHit(this.pos.x, this.pos.z);
        break;
      }
    }

    this.trailPositions.push(this.pos.clone());
    if (this.trailPositions.length > 16) this.trailPositions.shift();
    this.syncVisuals();
  }

  private syncVisuals(): void {
    this.mesh.position.copy(this.pos);
    this.shadowRing.position.x = this.pos.x;
    this.shadowRing.position.z = this.pos.z;
    const scale = Math.max(0.42, 1.35 - this.pos.y * 0.18);
    this.shadowRing.scale.set(scale, scale, 1);

    if (this.trailPositions.length >= 2) {
      this.trailLine.geometry.setFromPoints(this.trailPositions);
    }
  }
}