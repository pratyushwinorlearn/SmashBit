import * as THREE from 'three';

export type StrikeCategory = 'ATTACK' | 'ARC' | 'FINESSE';

export interface InputState {
  moveX: number;
  moveZ: number;
  jumpPressed: boolean;
  lungePressed: boolean;
  strikeTriggered: StrikeCategory | null;
  chargeRatio: number; // 0.0 to 1.0 based on hold time
  isCharging: boolean;
  mouseNdc: THREE.Vector2;
}

export class InputManager {
  private keys = new Set<string>();
  private jumpQueued = false;
  private lungeQueued = false;

  private activeChargeCategory: StrikeCategory | null = null;
  private chargeStartTime = 0;
  private releasedStrike: { category: StrikeCategory; ratio: number } | null = null;

  public mouseNdc = new THREE.Vector2(0, 0.25);

  constructor() {
    window.addEventListener('mousemove', (e) => {
      this.mouseNdc.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouseNdc.y = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    window.addEventListener('keydown', (e) => {
      const code = e.code;
      if (!this.keys.has(code)) {
        if (code === 'Space') this.jumpQueued = true;
        if (code === 'ShiftLeft' || code === 'ShiftRight') this.lungeQueued = true;

        if (code === 'KeyJ') this.beginCharge('ATTACK');
        if (code === 'KeyK' || code === 'KeyE') this.beginCharge('ARC');
        if (code === 'KeyL') this.beginCharge('FINESSE');
      }
      this.keys.add(code);
    });

    window.addEventListener('keyup', (e) => {
      const code = e.code;
      this.keys.delete(code);

      if (code === 'KeyJ' && this.activeChargeCategory === 'ATTACK') this.releaseCharge();
      if ((code === 'KeyK' || code === 'KeyE') && this.activeChargeCategory === 'ARC') this.releaseCharge();
      if (code === 'KeyL' && this.activeChargeCategory === 'FINESSE') this.releaseCharge();
    });

    window.addEventListener('mousedown', (e) => {
      if ((e.target as HTMLElement).tagName !== 'CANVAS') return;
      if (e.button === 0) this.beginCharge('ATTACK');
      if (e.button === 1) {
        e.preventDefault();
        this.beginCharge('ARC');
      }
      if (e.button === 2) this.beginCharge('FINESSE');
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0 && this.activeChargeCategory === 'ATTACK') this.releaseCharge();
      if (e.button === 1 && this.activeChargeCategory === 'ARC') this.releaseCharge();
      if (e.button === 2 && this.activeChargeCategory === 'FINESSE') this.releaseCharge();
    });

    window.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  private beginCharge(category: StrikeCategory): void {
    if (!this.activeChargeCategory) {
      this.activeChargeCategory = category;
      this.chargeStartTime = performance.now();
    }
  }

  private releaseCharge(): void {
    if (!this.activeChargeCategory) return;
    const heldMs = performance.now() - this.chargeStartTime;
    const ratio = Math.min(1.0, heldMs / 320);
    this.releasedStrike = { category: this.activeChargeCategory, ratio };
    this.activeChargeCategory = null;
  }

  public consumeState(): InputState {
    let moveX = 0;
    let moveZ = 0;

    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) moveX -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) moveX += 1;
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) moveZ -= 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) moveZ += 1;

    const len = Math.hypot(moveX, moveZ);
    if (len > 1) {
      moveX /= len;
      moveZ /= len;
    }

    const currentChargeRatio = this.activeChargeCategory
      ? Math.min(1.0, (performance.now() - this.chargeStartTime) / 320)
      : this.releasedStrike
      ? this.releasedStrike.ratio
      : 0;

    const state: InputState = {
      moveX,
      moveZ,
      jumpPressed: this.jumpQueued,
      lungePressed: this.lungeQueued,
      strikeTriggered: this.releasedStrike ? this.releasedStrike.category : null,
      chargeRatio: currentChargeRatio,
      isCharging: this.activeChargeCategory !== null,
      mouseNdc: this.mouseNdc
    };

    this.jumpQueued = false;
    this.lungeQueued = false;
    this.releasedStrike = null;
    return state;
  }
}