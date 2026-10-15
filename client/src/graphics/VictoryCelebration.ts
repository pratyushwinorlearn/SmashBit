import * as THREE from 'three';

interface ConfettiPiece {
  mesh: THREE.Mesh;
  velY: number;
  driftX: number;
  driftZ: number;
  spinSpeed: number;
}

/**
 * Manages the post-match Championship Podium at center court and 240 falling
 * pixel confetti particles when a player wins the match.
 */
export class VictoryCelebration {
  public active = false;
  private podiumGroup = new THREE.Group();
  private confettiGroup = new THREE.Group();
  private confetti: ConfettiPiece[] = [];

  constructor(scene: THREE.Scene) {
    this.buildPodium();
    this.buildConfetti();
    this.podiumGroup.visible = false;
    this.confettiGroup.visible = false;
    scene.add(this.podiumGroup, this.confettiGroup);
  }

  private buildPodium(): void {
    // Golden & Crimson BWF Championship Center Podium
    const base = new THREE.Mesh(
      new THREE.BoxGeometry(1.9, 0.36, 1.4),
      new THREE.MeshBasicMaterial({ color: 0x1e293b })
    );
    base.position.y = 0.18;

    const goldTrim = new THREE.Mesh(
      new THREE.BoxGeometry(1.96, 0.08, 1.46),
      new THREE.MeshBasicMaterial({ color: 0xfacc15 })
    );
    goldTrim.position.y = 0.36;

    const topMat = new THREE.Mesh(
      new THREE.BoxGeometry(1.82, 0.04, 1.32),
      new THREE.MeshBasicMaterial({ color: 0xe11d48 })
    );
    topMat.position.y = 0.41;

    const frontPlaque = new THREE.Mesh(
      new THREE.PlaneGeometry(1.4, 0.22),
      new THREE.MeshBasicMaterial({ color: 0xfacc15, side: THREE.DoubleSide })
    );
    frontPlaque.position.set(0, 0.18, 0.71);

    this.podiumGroup.add(base, goldTrim, topMat, frontPlaque);
    this.podiumGroup.position.set(0, 0, 1.4);
  }

  private buildConfetti(): void {
    const colors = [0xfacc15, 0x4ade80, 0x38bdf8, 0xf43f5e, 0xa855f7, 0xffffff];
    const geo = new THREE.PlaneGeometry(0.11, 0.11);

    for (let i = 0; i < 240; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: colors[i % colors.length],
        side: THREE.DoubleSide
      });
      const mesh = new THREE.Mesh(geo, mat);
      this.resetParticle(mesh, true);
      this.confettiGroup.add(mesh);

      this.confetti.push({
        mesh,
        velY: 1.4 + Math.random() * 1.8,
        driftX: (Math.random() - 0.5) * 1.2,
        driftZ: (Math.random() - 0.5) * 1.2,
        spinSpeed: 2 + Math.random() * 6
      });
    }
  }

  private resetParticle(mesh: THREE.Mesh, randomHeight = false): void {
    mesh.position.set(
      (Math.random() - 0.5) * 8.5,
      randomHeight ? 1.0 + Math.random() * 7.5 : 7.5 + Math.random() * 2.0,
      1.4 + (Math.random() - 0.5) * 6.5
    );
  }

  public startCelebration(podiumZ = 1.4): void {
    this.active = true;
    this.podiumGroup.position.set(0, 0, podiumZ);
    this.podiumGroup.visible = true;
    this.confettiGroup.visible = true;
    this.confetti.forEach((c) => this.resetParticle(c.mesh, true));
  }

  public stopCelebration(): void {
    this.active = false;
    this.podiumGroup.visible = false;
    this.confettiGroup.visible = false;
  }

  public update(dt: number): void {
    if (!this.active) return;
    const t = performance.now() * 0.001;

    for (let i = 0; i < this.confetti.length; i++) {
      const c = this.confetti[i];
      c.mesh.position.y -= c.velY * dt;
      c.mesh.position.x += Math.sin(t * 2.5 + i) * c.driftX * dt;
      c.mesh.position.z += Math.cos(t * 2.1 + i) * c.driftZ * dt;
      c.mesh.rotation.x += c.spinSpeed * dt;
      c.mesh.rotation.y += c.spinSpeed * 0.8 * dt;

      if (c.mesh.position.y <= 0.05) {
        this.resetParticle(c.mesh, false);
      }
    }
  }
}