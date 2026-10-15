import * as THREE from 'three';
import { COURT } from '../physics/CourtBounds.js';
import { GbaSpriteFactory, PlayerSpriteSet } from '../graphics/GbaSpriteFactory.js';
import { PlayerCustomization } from '../types/Customization.js';

export class Player {
  public group = new THREE.Group();
  public pos = new THREE.Vector3();
  public vel = new THREE.Vector3();
  public stamina = 100;
  public isAirborne = false;
  public isLunging = false;
  public swingTimer = 0;
  public animState: 'IDLE' | 'RUN' | 'JUMP' | 'LUNGE' | 'SWING' | 'TROPHY' = 'IDLE';

  private spriteMesh: THREE.Mesh;
  private spriteMat: THREE.MeshBasicMaterial;
  private sprites: PlayerSpriteSet;
  private facingRight = true;
  private lungeTimer = 0;

  private readonly maxRunSpeed = 6.8;
  private readonly accel = 36.0;
  private readonly friction = 18.0;
  private readonly jumpImpulse = 7.2;
  private readonly gravity = -17.5;

  constructor(
    public readonly side: 0 | 1,
    _jerseyColor: number,
    scene: THREE.Scene
  ) {
    this.sprites = GbaSpriteFactory.createPlayerSprites(side === 0);

    const geo = new THREE.PlaneGeometry(1.52, 1.62);
    this.spriteMat = new THREE.MeshBasicMaterial({
      map: this.sprites.idle,
      transparent: true,
      alphaTest: 0.1,
      side: THREE.DoubleSide
    });

    this.spriteMesh = new THREE.Mesh(geo, this.spriteMat);
    this.spriteMesh.position.y = 0.78;

    const shadowGeo = new THREE.CircleGeometry(0.38, 12);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x051a10,
      transparent: true,
      opacity: 0.65
    });
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.01;

    this.group.add(shadow, this.spriteMesh);
    this.resetPosition(0);
    scene.add(this.group);
  }

  public applyCustomization(custom: PlayerCustomization): void {
    this.sprites = GbaSpriteFactory.createPlayerSprites(this.side === 0, custom);
    this.spriteMat.map = this.sprites.idle;
    this.spriteMat.needsUpdate = true;
  }

  public enterTrophyCelebration(podiumZ = 1.4): void {
    this.animState = 'TROPHY';
    this.swingTimer = 0;
    this.isAirborne = false;
    this.isLunging = false;
    this.facingRight = true;
    this.pos.set(0, 0.42, podiumZ);
    this.vel.set(0, 0, 0);
    this.syncMesh();
  }

  public resetPosition(serverScore = 0): void {
    const isEven = serverScore % 2 === 0;
    const zStart = this.side === 0 ? 3.15 : -3.15;
    const boxSign = isEven ? 1 : -1;
    const xStart = (this.side === 0 ? 0.95 : -0.95) * boxSign;

    this.pos.set(xStart, 0, zStart);
    this.vel.set(0, 0, 0);
    this.isAirborne = false;
    this.isLunging = false;
    this.lungeTimer = 0;
    this.animState = 'IDLE';
    this.syncMesh();
  }

  public getStrikeCenter(): THREE.Vector3 {
    return new THREE.Vector3(this.pos.x, this.pos.y + 1.28, this.pos.z);
  }

  public triggerSwing(): void {
    this.swingTimer = 0.24;
    this.animState = 'SWING';
  }

  public updateLocal(
    dt: number,
    moveX: number,
    moveZ: number,
    jumpPressed: boolean,
    onFootSqueak: () => void,
    lungePressed = false,
    speedMultiplier = 1.0
  ): void {
    if (this.animState === 'TROPHY') {
      // Joyful championship bounce on the podium
      this.pos.y = 0.42 + Math.abs(Math.sin(performance.now() * 0.006)) * 0.22;
      this.syncMesh();
      return;
    }

    const prevVx = this.vel.x;

    if (lungePressed && !this.isAirborne && this.lungeTimer <= 0 && this.stamina >= 18) {
      this.lungeTimer = 0.28;
      this.isLunging = true;
      this.stamina = Math.max(0, this.stamina - 18);
      const lungeDirX = Math.abs(moveX) > 0.1 ? moveX : this.facingRight ? 1 : -1;
      const lungeDirZ = Math.abs(moveZ) > 0.1 ? moveZ : this.side === 0 ? -0.5 : 0.5;
      const len = Math.max(0.1, Math.hypot(lungeDirX, lungeDirZ));
      this.vel.x = (lungeDirX / len) * 12.2;
      this.vel.z = (lungeDirZ / len) * 12.2;
      onFootSqueak();
    }

    if (this.lungeTimer > 0) {
      this.lungeTimer -= dt;
      this.vel.x *= Math.pow(0.08, dt);
      this.vel.z *= Math.pow(0.08, dt);
      if (this.lungeTimer <= 0) {
        this.isLunging = false;
      }
    } else {
      const targetVx = moveX * this.maxRunSpeed * speedMultiplier;
      const targetVz = moveZ * this.maxRunSpeed * speedMultiplier;
      const rate = Math.hypot(moveX, moveZ) > 0.1 ? this.accel : this.friction;

      this.vel.x = THREE.MathUtils.lerp(this.vel.x, targetVx, Math.min(1, dt * rate));
      this.vel.z = THREE.MathUtils.lerp(this.vel.z, targetVz, Math.min(1, dt * rate));
    }

    if (Math.abs(moveX) > 0.1) {
      this.facingRight = moveX > 0;
    }

    if (!this.isAirborne && Math.abs(this.vel.x - prevVx) > 6.5 && Math.random() < 0.35) {
      onFootSqueak();
    }

    if (jumpPressed && !this.isAirborne && this.stamina >= 15) {
      this.vel.y = this.jumpImpulse;
      this.isAirborne = true;
      this.stamina = Math.max(0, this.stamina - 15);
      this.animState = 'JUMP';
    }

    if (this.isAirborne) {
      this.vel.y += this.gravity * dt;
    }

    this.pos.addScaledVector(this.vel, dt);

    if (this.pos.y <= 0) {
      this.pos.y = 0;
      this.vel.y = 0;
      this.isAirborne = false;
    }

    this.pos.x = THREE.MathUtils.clamp(this.pos.x, -COURT.HALF_WIDTH - 0.65, COURT.HALF_WIDTH + 0.65);
    if (this.side === 0) {
      this.pos.z = THREE.MathUtils.clamp(this.pos.z, 0.38, COURT.HALF_LENGTH + 0.85);
    } else {
      this.pos.z = THREE.MathUtils.clamp(this.pos.z, -COURT.HALF_LENGTH - 0.85, -0.38);
    }

    this.stamina = Math.min(100, this.stamina + dt * 10);

    if (this.swingTimer > 0) {
      this.swingTimer = Math.max(0, this.swingTimer - dt);
    } else if (this.isAirborne) {
      this.animState = 'JUMP';
    } else if (this.isLunging) {
      this.animState = 'LUNGE';
    } else if (Math.hypot(this.vel.x, this.vel.z) > 0.45) {
      this.animState = 'RUN';
    } else {
      this.animState = 'IDLE';
    }

    this.syncMesh();
  }

  public syncMesh(): void {
    this.group.position.copy(this.pos);

    if (this.animState === 'TROPHY') {
      this.spriteMat.map = this.sprites.trophy;
      this.spriteMesh.scale.x = 1;
      this.spriteMesh.rotation.z = Math.sin(performance.now() * 0.005) * 0.06;
      this.spriteMesh.rotation.x = -0.18;
      return;
    }

    if (this.swingTimer > 0 || this.animState === 'SWING') {
      this.spriteMat.map = this.sprites.swing;
    } else if (this.isAirborne || this.animState === 'JUMP') {
      this.spriteMat.map = this.sprites.jump;
    } else if (this.animState === 'LUNGE') {
      this.spriteMat.map = this.sprites.run1;
    } else if (this.animState === 'RUN') {
      const stepFrame = Math.floor(performance.now() / 105) % 2;
      this.spriteMat.map = stepFrame === 0 ? this.sprites.run1 : this.sprites.run2;
    } else {
      this.spriteMat.map = this.sprites.idle;
    }

    const leanZ = this.isLunging ? (this.facingRight ? -0.18 : 0.18) : 0;
    this.spriteMesh.rotation.z = leanZ;
    this.spriteMesh.scale.x = this.facingRight ? 1 : -1;
    this.spriteMesh.rotation.x = -0.22;
  }
}