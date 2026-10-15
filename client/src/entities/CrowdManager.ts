import * as THREE from 'three';
import { GbaSpriteFactory, CrowdNpcSpriteSet } from '../graphics/GbaSpriteFactory.js';
import { FanBannerFactory, BannerVariant } from '../graphics/FanBannerFactory.js';

interface SpectatorInstance {
  group: THREE.Group;
  charMesh: THREE.Mesh;
  mat: THREE.MeshBasicMaterial;
  preset: CrowdNpcSpriteSet;
  bannerMesh?: THREE.Mesh;
  baseX: number;
  baseY: number;
  phase: number;
  breathSpeed: number;
  cheerThreshold: number;
}

export class CrowdManager {
  public excitement = 0.15;
  private spectators: SpectatorInstance[] = [];

  constructor(scene: THREE.Scene) {
    const presets = GbaSpriteFactory.createCrowdNpcPresets();
    const banners = FanBannerFactory.createAllBannerVariants();

    this.buildStadiumBowlAndSeats(scene, presets, banners);
  }

  private buildStadiumBowlAndSeats(
    scene: THREE.Scene,
    presets: CrowdNpcSpriteSet[],
    banners: BannerVariant[]
  ): void {
    const concreteMat = new THREE.MeshLambertMaterial({ color: 0x1e2230 });
    const stepMat = new THREE.MeshLambertMaterial({ color: 0x334155 });
    const railMat = new THREE.MeshLambertMaterial({ color: 0x64748b });
    const upperWallMat = new THREE.MeshLambertMaterial({ color: 0x111522 });
    const pillarMat = new THREE.MeshLambertMaterial({ color: 0x1e293b });

    const seatMaterials = [
      new THREE.MeshLambertMaterial({ color: 0x1d4ed8 }),
      new THREE.MeshLambertMaterial({ color: 0x0d9488 }),
      new THREE.MeshLambertMaterial({ color: 0xbe123c }),
      new THREE.MeshLambertMaterial({ color: 0xd97706 })
    ];

    const seatBaseGeo = new THREE.BoxGeometry(0.52, 0.1, 0.44);
    const seatBackGeo = new THREE.BoxGeometry(0.52, 0.46, 0.1);
    const specGeo = new THREE.PlaneGeometry(0.92, 1.08);

    const createGrandstand = (
      parent: THREE.Object3D,
      widthSpan: number,
      numCols: number,
      aisleCols: number[],
      standSeed: number
    ) => {
      for (let row = 0; row < 8; row++) {
        const y = 2.2 + row * 0.58;
        const z = -10.3 - row * 0.78;

        const tier = new THREE.Mesh(new THREE.BoxGeometry(widthSpan, 0.58, 0.8), concreteMat);
        tier.position.set(0, y - 0.28, z);
        parent.add(tier);

        // Track last column that had a banner so banners never overlap each other
        let lastBannerCol = -10;

        for (let c = 0; c < numCols; c++) {
          const x = (c - (numCols - 1) / 2) * 0.78;

          const isAisle = aisleCols.some((ac) => Math.abs(c - ac) <= 1);
          if (isAisle) {
            const stair = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.6, 0.82), stepMat);
            stair.position.set(x, y - 0.27, z);
            parent.add(stair);
            continue;
          }

          // 1. Physical 3D Stadium Seat
          const secIdx = Math.floor((c / numCols) * seatMaterials.length);
          const sMat = seatMaterials[secIdx % seatMaterials.length];

          const cushion = new THREE.Mesh(seatBaseGeo, sMat);
          cushion.position.set(x, y + 0.05, z + 0.1);
          const backrest = new THREE.Mesh(seatBackGeo, sMat);
          backrest.position.set(x, y + 0.28, z - 0.12);
          parent.add(cushion, backrest);

          // 2. Random Empty Seats (~33% empty so seats are clearly visible)
          const hash = Math.sin((row * 41 + c * 23 + standSeed * 97) * 12.9898) * 43758.5453;
          const rand = hash - Math.floor(hash);
          const emptyThreshold = row >= 6 ? 0.44 : 0.32;
          if (rand < emptyThreshold) {
            continue;
          }

          // 3. Place GBA Spectator
          const preset = presets[Math.floor(rand * 997) % presets.length];
          const mat = new THREE.MeshBasicMaterial({
            map: preset.calm,
            transparent: true,
            alphaTest: 0.1,
            side: THREE.DoubleSide
          });
          mat.color.setHex(0xdbe4f0);

          const fanGroup = new THREE.Group();
          const baseX = x + (rand - 0.5) * 0.14;
          const baseY = y + 0.56;
          fanGroup.position.set(baseX, baseY, z + 0.06);

          const charMesh = new THREE.Mesh(specGeo, mat);
          charMesh.rotation.x = -0.14;
          if (Math.floor(rand * 100) % 2 === 0) {
            charMesh.scale.x = -1;
          }
          fanGroup.add(charMesh);

          // 4. Spaced-out, High-Clarity Random Banners (~11% of fans, never overlapping)
          let bannerMesh: THREE.Mesh | undefined;
          const bannerRoll = (rand * 1000) % 1;
          if (bannerRoll < 0.12 && c - lastBannerCol >= 4) {
            lastBannerCol = c;
            const bIdx = Math.floor((row * 13 + c * 7 + standSeed * 5) % banners.length);
            const bVar = banners[bIdx];

            const bMat = new THREE.MeshBasicMaterial({
              map: bVar.texture,
              transparent: true,
              alphaTest: 0.05,
              side: THREE.DoubleSide
            });

            bannerMesh = new THREE.Mesh(new THREE.PlaneGeometry(bVar.width, bVar.height), bMat);
            // Position wide cloth banners on the front railing or overhead so they are 100% readable
            const bannerY = bVar.isWideCloth ? 0.72 : 0.78 + bVar.height * 0.25;
            bannerMesh.position.set(0, bannerY, 0.14);
            bannerMesh.rotation.x = -0.1;
            fanGroup.add(bannerMesh);
          }

          parent.add(fanGroup);

          // Individualized breathing speed & cheer threshold so the crowd never moves in robotic unison
          const breathSpeed = 1.3 + (rand * 100 % 1) * 0.9;
          const cheerThreshold = 0.28 + ((rand * 313) % 1) * 0.55;

          this.spectators.push({
            group: fanGroup,
            charMesh,
            mat,
            preset,
            bannerMesh,
            baseX,
            baseY,
            phase: rand * Math.PI * 2,
            breathSpeed,
            cheerThreshold
          });
        }
      }
    };

    // Back Grandstand
    const backStand = new THREE.Group();
    createGrandstand(backStand, 36, 44, [11, 32], 1);
    scene.add(backStand);

    // Vomitory Tunnels
    [-8.5, 8.5].forEach((aisleX) => {
      const tunnelPortal = new THREE.Mesh(
        new THREE.BoxGeometry(1.9, 1.4, 0.8),
        new THREE.MeshBasicMaterial({ color: 0x070a12 })
      );
      tunnelPortal.position.set(aisleX, 2.8, -10.3);
      scene.add(tunnelPortal);

      const exitSign = new THREE.Mesh(
        new THREE.PlaneGeometry(0.65, 0.22),
        new THREE.MeshBasicMaterial({ color: 0x22c55e })
      );
      exitSign.position.set(aisleX, 3.35, -9.88);
      scene.add(exitSign);

      const rail = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.45, 0.06), railMat);
      rail.position.set(aisleX, 2.55, -9.9);
      scene.add(rail);
    });

    // Left Side Grandstand (+90 deg)
    const leftStand = new THREE.Group();
    createGrandstand(leftStand, 22, 26, [8, 18], 2);
    leftStand.rotation.y = Math.PI / 2;
    leftStand.position.set(-2.8, 0, -1.5);
    scene.add(leftStand);

    // Right Side Grandstand (-90 deg)
    const rightStand = new THREE.Group();
    createGrandstand(rightStand, 22, 26, [8, 18], 3);
    rightStand.rotation.y = -Math.PI / 2;
    rightStand.position.set(2.8, 0, -1.5);
    scene.add(rightStand);

    // Upper Concourse Walls & VIP Booths
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(46, 9.5, 0.6), upperWallMat);
    backWall.position.set(0, 8.8, -16.8);
    scene.add(backWall);

    [-19.5, 19.5].forEach((wx) => {
      const sideUpperWall = new THREE.Mesh(new THREE.BoxGeometry(0.6, 9.5, 28), upperWallMat);
      sideUpperWall.position.set(wx, 8.8, -2.5);
      scene.add(sideUpperWall);
    });

    for (let px = -20; px <= 20; px += 5) {
      const col = new THREE.Mesh(new THREE.BoxGeometry(0.55, 9.5, 0.75), pillarMat);
      col.position.set(px, 8.8, -16.5);
      scene.add(col);
    }

    const vipTex = GbaSpriteFactory.createVipSkyboxTexture();
    [-10, 0, 10].forEach((bx) => {
      const booth = new THREE.Mesh(
        new THREE.PlaneGeometry(6.8, 2.2),
        new THREE.MeshBasicMaterial({ map: vipTex, color: 0x94a3b8 })
      );
      booth.position.set(bx, 8.4, -16.4);
      scene.add(booth);
    });

    const bannersInfo = [
      { x: -14, text: 'BWF WORLD TOUR', bg: '#ef4444', fg: '#ffffff' },
      { x: -4.5, text: 'BIRMINGHAM', bg: '#2563eb', fg: '#facc15' },
      { x: 4.5, text: 'SMASH 2026', bg: '#10b981', fg: '#0f172a' },
      { x: 14, text: 'YONEX OPEN', bg: '#facc15', fg: '#0f172a' }
    ];
    bannersInfo.forEach((b) => {
      const tex = GbaSpriteFactory.createSponsorBannerTexture(b.text, b.bg, b.fg);
      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(4.2, 1.15),
        new THREE.MeshBasicMaterial({ map: tex, color: 0xcbd5e1 })
      );
      mesh.position.set(b.x, 10.8, -16.2);
      scene.add(mesh);
    });
  }

  public boostExcitement(amount: number): void {
    this.excitement = Math.min(1.0, this.excitement + amount);
  }

  /**
   * Subtle, lifelike breathing & posture shifts during rallies.
   * Even when roaring after a smash or point, fans raise their arms with a gentle sway
   * rather than bouncing up and down rapidly.
   */
  public update(dt: number): void {
    this.excitement = Math.max(0.15, this.excitement - dt * 0.08);
    const time = performance.now() * 0.001;

    for (let i = 0; i < this.spectators.length; i++) {
      const s = this.spectators[i];

      // 1. Slow, natural breathing wave (one cycle every ~3.5 seconds)
      const breathWave = Math.sin(time * s.breathSpeed + s.phase);
      const isFanCheering = this.excitement > s.cheerThreshold;

      // Subtle chest expansion (2% calm breathing, 4% when cheering)
      const scaleAmplitude = isFanCheering ? 0.038 : 0.018;
      s.charMesh.scale.y = 1.0 + breathWave * scaleAmplitude;

      // Tiny vertical seat shift (less than 1cm when calm, ~3cm gentle rise when cheering)
      const liftOffset = isFanCheering
        ? 0.025 + Math.max(0, breathWave) * 0.022
        : breathWave * 0.007;
      s.group.position.y = s.baseY + liftOffset;

      // Very slow lateral posture lean
      s.group.position.x = s.baseX + Math.sin(time * 0.65 + s.phase) * 0.01;

      // 2. Keep fan banners steady with a slow, readable wave
      if (s.bannerMesh) {
        const bannerSwaySpeed = isFanCheering ? 2.0 : 0.9;
        const bannerTilt = isFanCheering ? 0.055 : 0.02;
        s.bannerMesh.rotation.z = Math.sin(time * bannerSwaySpeed + s.phase) * bannerTilt;
      }

      // 3. Switch to raised-arms sprite only for fans whose threshold is exceeded
      const targetMap = isFanCheering ? s.preset.cheer : s.preset.calm;
      if (s.mat.map !== targetMap) {
        s.mat.map = targetMap;
      }
    }
  }
}