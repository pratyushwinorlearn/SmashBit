import * as THREE from 'three';
import { COURT } from '../physics/CourtBounds.js';

export type AimMode = 'MOUSE' | 'KEYBOARD';

export class AimController {
  public aimMode: AimMode = 'MOUSE';
  public showReticle = true;
  public targetWorldPos = new THREE.Vector3(0, 0.02, -3.5);

  private raycaster = new THREE.Raycaster();
  private floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  private reticleGroup = new THREE.Group();
  private outerRing: THREE.Mesh;
  private innerDot: THREE.Mesh;

  constructor(scene: THREE.Scene) {
    // Crisp GBA Pixel Target Crosshair on the court floor
    const tex = this.createReticleTexture();
    const mat = new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      alphaTest: 0.05,
      side: THREE.DoubleSide,
      depthWrite: false
    });

    this.outerRing = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 0.95), mat);
    this.outerRing.rotation.x = -Math.PI / 2;
    this.outerRing.position.y = 0.018;

    this.innerDot = new THREE.Mesh(
      new THREE.PlaneGeometry(0.16, 0.16),
      new THREE.MeshBasicMaterial({ color: 0xfacc15, side: THREE.DoubleSide })
    );
    this.innerDot.rotation.x = -Math.PI / 2;
    this.innerDot.position.y = 0.022;

    this.reticleGroup.add(this.outerRing, this.innerDot);
    scene.add(this.reticleGroup);
  }

  private createReticleTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;

    // GBA Corner Brackets + Crosshair Ticks
    ctx.fillStyle = '#14121d';
    ctx.fillRect(2, 2, 9, 4);
    ctx.fillRect(2, 2, 4, 9);
    ctx.fillRect(21, 2, 9, 4);
    ctx.fillRect(26, 2, 4, 9);
    ctx.fillRect(2, 26, 9, 4);
    ctx.fillRect(2, 21, 4, 9);
    ctx.fillRect(21, 26, 9, 4);
    ctx.fillRect(26, 21, 4, 9);

    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(3, 3, 7, 2);
    ctx.fillRect(3, 3, 2, 7);
    ctx.fillRect(22, 3, 7, 2);
    ctx.fillRect(27, 3, 2, 7);
    ctx.fillRect(3, 27, 7, 2);
    ctx.fillRect(3, 22, 2, 7);
    ctx.fillRect(22, 27, 7, 2);
    ctx.fillRect(27, 22, 2, 7);

    const tex = new THREE.CanvasTexture(canvas);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    return tex;
  }

  public toggleAimMode(): AimMode {
    this.aimMode = this.aimMode === 'MOUSE' ? 'KEYBOARD' : 'MOUSE';
    return this.aimMode;
  }

  public toggleReticle(): boolean {
    this.showReticle = !this.showReticle;
    this.reticleGroup.visible = this.showReticle;
    return this.showReticle;
  }

  public update(
    dt: number,
    camera: THREE.Camera,
    localSide: 0 | 1,
    mouseNdc: THREE.Vector2,
    moveX: number,
    moveZ: number,
    chargeRatio: number
  ): void {
    const oppDirZ = localSide === 0 ? -1 : 1;

    if (this.aimMode === 'MOUSE') {
      this.raycaster.setFromCamera(mouseNdc, camera);
      const hitPoint = new THREE.Vector3();
      if (this.raycaster.ray.intersectPlane(this.floorPlane, hitPoint)) {
        // Clamp slightly outside singles lines so player can risk aiming right on the line
        const clampedX = THREE.MathUtils.clamp(
          hitPoint.x,
          -COURT.HALF_WIDTH - 0.35,
          COURT.HALF_WIDTH + 0.35
        );
        const minZ = localSide === 0 ? -COURT.HALF_LENGTH - 0.45 : 0.45;
        const maxZ = localSide === 0 ? -0.45 : COURT.HALF_LENGTH + 0.45;
        const clampedZ = THREE.MathUtils.clamp(hitPoint.z, minZ, maxZ);

        this.targetWorldPos.x = THREE.MathUtils.lerp(this.targetWorldPos.x, clampedX, Math.min(1, dt * 24));
        this.targetWorldPos.z = THREE.MathUtils.lerp(this.targetWorldPos.z, clampedZ, Math.min(1, dt * 24));
      }
    } else {
      // KEYBOARD AIM FALLBACK
      const targetX = moveX * (COURT.HALF_WIDTH - 0.15);
      const baseDepth = 3.6;
      const depthOffset = -moveZ * 2.5;
      const targetZ = oppDirZ * THREE.MathUtils.clamp(baseDepth + depthOffset, 1.1, COURT.HALF_LENGTH);

      this.targetWorldPos.x = THREE.MathUtils.lerp(this.targetWorldPos.x, targetX, Math.min(1, dt * 14));
      this.targetWorldPos.z = THREE.MathUtils.lerp(this.targetWorldPos.z, targetZ, Math.min(1, dt * 14));
    }

    // Update Reticle Visuals (Tightens and turns gold as shot charge builds)
    this.reticleGroup.visible = this.showReticle;
    this.reticleGroup.position.set(this.targetWorldPos.x, 0, this.targetWorldPos.z);

    const pulse = 1.0 - chargeRatio * 0.38 + Math.sin(performance.now() * 0.01) * 0.04;
    this.outerRing.scale.set(pulse, pulse, 1);
    this.outerRing.rotation.z += dt * (0.8 + chargeRatio * 3.5);
  }
}