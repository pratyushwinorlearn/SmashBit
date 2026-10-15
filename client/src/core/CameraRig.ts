import * as THREE from 'three';

export type CameraMode = 'BROADCAST_END' | 'SIDE_TV' | 'HERO_ORBIT' | 'CHAMPION_ZOOM';

export class CameraRig {
  public camera: THREE.PerspectiveCamera;
  public mode: CameraMode = 'HERO_ORBIT';
  private shakeIntensity = 0;
  private basePos = new THREE.Vector3(0, 6.6, 13.2);
  private lookTarget = new THREE.Vector3(0, 0.85, -1.5);

  constructor(aspect: number) {
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 120);
    this.applyMode(0);
  }

  public toggleMode(localSide: 0 | 1): CameraMode {
    this.mode = this.mode === 'BROADCAST_END' ? 'SIDE_TV' : 'BROADCAST_END';
    this.applyMode(localSide);
    return this.mode;
  }

  public applyMode(localSide: 0 | 1): void {
    const dir = localSide === 0 ? 1 : -1;
    if (this.mode === 'BROADCAST_END') {
      this.basePos.set(0, 6.4, 13.0 * dir);
      this.lookTarget.set(0, 0.9, -1.6 * dir);
    } else if (this.mode === 'SIDE_TV') {
      this.basePos.set(13.5, 5.4, 0);
      this.lookTarget.set(0, 1.0, 0);
    } else if (this.mode === 'CHAMPION_ZOOM') {
      this.basePos.set(0, 2.5, 5.8);
      this.lookTarget.set(0, 1.35, 1.4);
    }
  }

  public triggerSmashShake(intensity = 0.32): void {
    this.shakeIntensity = intensity;
  }

  public update(dt: number, playerX: number, shuttlePos: THREE.Vector3): void {
    if (this.mode === 'HERO_ORBIT') {
      const t = performance.now() * 0.00035;
      this.camera.position.set(Math.sin(t) * 8.5, 6.8, 11.5 + Math.cos(t) * 2.2);
      this.camera.lookAt(0, 1.2, -2.5);
      return;
    }

    const targetPos = this.basePos.clone();
    if (this.mode === 'BROADCAST_END') {
      targetPos.x = playerX * 0.22;
    } else if (this.mode === 'SIDE_TV') {
      targetPos.z = shuttlePos.z * 0.2;
    }

    this.camera.position.lerp(targetPos, Math.min(1, dt * 6));

    if (this.shakeIntensity > 0.005) {
      this.camera.position.x += (Math.random() - 0.5) * this.shakeIntensity;
      this.camera.position.y += (Math.random() - 0.5) * this.shakeIntensity;
      this.shakeIntensity *= Math.pow(0.04, dt);
    } else {
      this.shakeIntensity = 0;
    }

    this.camera.lookAt(this.lookTarget);
  }

  public resize(aspect: number): void {
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }
}