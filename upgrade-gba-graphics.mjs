#!/usr/bin/env node
/**
 * Upgrades SmashBit from blocky 3D primitives to crisp Nintendo GBA Pokémon-style 2D Pixel Art Sprites
 * Run inside pixel-badminton-pvp/: node upgrade-gba-graphics.mjs
 */
import fs from 'fs';
import path from 'path';

const CLIENT_SRC = fs.existsSync(path.join(process.cwd(), 'client/src'))
  ? path.join(process.cwd(), 'client/src')
  : path.join(process.cwd(), 'pixel-badminton-pvp/client/src');

const files = {
  // =========================================================================
  // 1. NEW FILE: GBA Pixel-Art Sprite & Texture Factory
  // =========================================================================
  'graphics/GbaSpriteFactory.ts': `import * as THREE from 'three';

export interface PlayerSpriteSet {
  idle: THREE.CanvasTexture;
  run1: THREE.CanvasTexture;
  run2: THREE.CanvasTexture;
  jump: THREE.CanvasTexture;
  swing: THREE.CanvasTexture;
}

export interface CrowdNpcSpriteSet {
  calm: THREE.CanvasTexture;
  cheer: THREE.CanvasTexture;
}

/**
 * Generates razor-sharp 16-bit GBA style pixel art textures with dark outlines,
 * chibi heads, visible eyes/faces, spiky hair/caps, hands, legs, and rackets.
 */
export class GbaSpriteFactory {
  private static makePixelTexture(width: number, height: number, drawFn: (ctx: CanvasRenderingContext2D) => void): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    drawFn(ctx);

    const tex = new THREE.CanvasTexture(canvas);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    return tex;
  }

  private static drawGrid(
    ctx: CanvasRenderingContext2D,
    grid: string[],
    palette: Record<string, string>,
    offsetX = 0,
    offsetY = 0
  ): void {
    for (let y = 0; y < grid.length; y++) {
      const row = grid[y];
      for (let x = 0; x < row.length; x++) {
        const ch = row[x];
        if (ch !== '.' && palette[ch]) {
          ctx.fillStyle = palette[ch];
          ctx.fillRect(offsetX + x, offsetY + y, 1, 1);
        }
      }
    }
  }

  /**
   * Builds a 5-frame GBA Pokémon Trainer-style badminton player sprite set (32x36 pixels)
   */
  public static createPlayerSprites(isPlayerOne: boolean): PlayerSpriteSet {
    const palette: Record<string, string> = {
      K: '#14141f', // GBA 1px Black/Charcoal Outline
      H: isPlayerOne ? '#ef4444' : '#3b2314', // P1 Red Trainer Cap / P2 Spiky Brown Hair
      h: isPlayerOne ? '#fca5a5' : '#6b4423', // Cap/Hair Highlight
      W: '#f8fafc', // White emblem / sclera / socks / shuttle
      S: '#ffdbb5', // Light peach skin
      s: '#e0a97b', // Warm skin shadow
      E: '#111827', // Expressive GBA eye pupil
      M: '#be123c', // Mouth / determination grin
      J: isPlayerOne ? '#10b981' : '#f43f5e', // Jersey primary
      j: isPlayerOne ? '#047857' : '#be123c', // Jersey shadow
      P: '#1e293b', // Athletic shorts
      p: '#0f172a', // Shorts shadow
      B: isPlayerOne ? '#38bdf8' : '#facc15', // Sneakers
      R: '#38bdf8', // Racket frame
      Y: '#facc15', // Racket grip/shaft
      G: '#cbd5e1'  // Racket strings
    };

    // Chibi GBA Head (16px wide, with cap/spiky hair, large eyes, nose/mouth, dark outline)
    const headGrid = [
      '....KKKKKKKK....',
      '..KKHHHHHHHHKK..',
      '.KHHhWWWWWhHHHK.',
      '.KHHHHHHHHHHHHK.',
      'KHHKKKKKKKKKKHHK',
      'KHKSSSSSSSSSSKHK',
      'KKSSSSWWWWSSSSKK',
      '.KSSEWSSSSWESSSK',
      '.KSSEWSSSSWESsSK',
      '.KSSSSSSSSSSssSK',
      '..KSSSSMMSSSSsK.',
      '...KKKKKKKKKKK..'
    ];

    const buildFrame = (pose: 'IDLE' | 'RUN1' | 'RUN2' | 'JUMP' | 'SWING'): THREE.CanvasTexture => {
      return this.makePixelTexture(36, 36, (ctx) => {
        const headY = pose === 'JUMP' ? 2 : pose === 'RUN1' || pose === 'RUN2' ? 3 : 4;
        this.drawGrid(ctx, headGrid, palette, 8, headY);

        // Torso + Jersey + Collar + Both Arms & Distinct Hands (skin 'S' outlined with 'K')
        const bodyGrid =
          pose === 'SWING'
            ? [
                '....KKKKKKKK....',
                '..KKJJWWWWJJKK..',
                '.KSSKJJJJJJJKSSK',
                'KSSSKJJJJJJJKSSK',
                'KKKKKJJjjjjJKKKK',
                '....KJJjjjjJK...',
                '....KKKKKKKKK...',
                '....KPPPPPPPK...',
                '....KPPPpPPPK...',
                '....KKKK.KKKK...'
              ]
            : [
                '....KKKKKKKK....',
                '..KKJJWWWWJJKK..',
                '.KJJJJJJJJJJJJK.',
                'KSsKJJJJJJJJKSsK',
                'KSSKJJJJjjjJKSSK',
                'KKKKJJjjjjjjKKKK',
                '...KJJjjjjjjK...',
                '...KKKKKKKKKK...',
                '...KPPPPPPPPK...',
                '...KPPPppPPPK...',
                '...KKKK..KKKK...'
              ];

        this.drawGrid(ctx, bodyGrid, palette, 8, headY + 12);

        // Legs & Sneakers (Animated per state!)
        let legsGrid: string[] = [];
        if (pose === 'IDLE') {
          legsGrid = [
            '...KSSK..KSSK...',
            '...KssK..KssK...',
            '...KWWK..KWWK...',
            '..KBBBK..KBBBK..',
            '..KKKKK..KKKKK..'
          ];
        } else if (pose === 'RUN1') {
          legsGrid = [
            '..KSSK....KSSK..',
            '.KssK......KssK.',
            '.KWWK......KWWK.',
            'KBBBK......KBBBK',
            'KKKKK......KKKKK'
          ];
        } else if (pose === 'RUN2') {
          legsGrid = [
            '....KSSKKSSK....',
            '...KssK..KssK...',
            '...KWWK..KWWK...',
            '..KBBBK..KBBBK..',
            '..KKKKK..KKKKK..'
          ];
        } else {
          // JUMP / TUCKED LEGS
          legsGrid = [
            '..KSSK....KSSK..',
            '..KWWK....KWWK..',
            '.KBBBK....KBBBK.',
            '.KKKKK....KKKKK.'
          ];
        }
        this.drawGrid(ctx, legsGrid, palette, 8, headY + 23);

        // Pixel-Art Badminton Racket held in the right hand (No 3D rings/cylinders!)
        const racketGrid =
          pose === 'SWING'
            ? [
                '..KKKKKK..',
                '.KRRRRRRK.',
                'KRGWGWGWRK',
                'KRWGWGWGRK',
                'KRGWGWGWRK',
                '.KRRRRRRK.',
                '..KKYYKK..',
                '...KYYK...',
                '..KYYK....',
                '.KYYK.....'
              ]
            : [
                '....KKKKKK',
                '...KRRRRRR',
                '..KRGWGWGW',
                '..KRWGWGWG',
                '..KRGWGWGW',
                '...KRRRRRR',
                '...KYYKKKK',
                '..KYYK....',
                '.KYYK.....',
                'KYYK......'
              ];

        const racketX = pose === 'SWING' ? 23 : 22;
        const racketY = pose === 'SWING' ? headY - 2 : headY + 6;
        this.drawGrid(ctx, racketGrid, palette, racketX, racketY);
      });
    };

    return {
      idle: buildFrame('IDLE'),
      run1: buildFrame('RUN1'),
      run2: buildFrame('RUN2'),
      jump: buildFrame('JUMP'),
      swing: buildFrame('SWING')
    };
  }

  /**
   * Builds 6 distinct GBA Pokémon NPC spectators (Ash-cap, Brock-spiky, Misty-ponytail, etc.)
   * with visible faces, eyes, shirts, hands, and seated legs!
   */
  public static createCrowdNpcPresets(): CrowdNpcSpriteSet[] {
    const outfits = [
      { hair: '#3b2314', shirt: '#22c55e', skin: '#ffdbb5', pants: '#1e3a8a' }, // Brock style
      { hair: '#f97316', shirt: '#facc15', skin: '#ffedd5', pants: '#0284c7' }, // Misty style
      { hair: '#e11d48', shirt: '#3b82f6', skin: '#ffdbb5', pants: '#334155' }, // Red Cap trainer
      { hair: '#eab308', shirt: '#a855f7', skin: '#fef3c7', pants: '#1e293b' }, // Blonde trainer
      { hair: '#06b6d4', shirt: '#ec4899', skin: '#ffdbb5', pants: '#0f172a' }, // Cyan anime hair
      { hair: '#18181b', shirt: '#f97316', skin: '#e0a97b', pants: '#1e293b' }  // Dark spiky hair
    ];

    return outfits.map((cfg) => {
      const palette: Record<string, string> = {
        K: '#14141f',
        H: cfg.hair,
        S: cfg.skin,
        W: '#ffffff',
        E: '#111827',
        J: cfg.shirt,
        P: cfg.pants,
        B: '#e2e8f0'
      };

      const makeNpc = (cheering: boolean) =>
        this.makePixelTexture(20, 26, (ctx) => {
          const grid = cheering
            ? [
                '....KKKKKKKK....',
                '..KKHHHHHHHHKK..',
                '.KHHHHHHHHHHHHK.',
                '.KHKKKKKKKKKKHK.',
                '.KHKSSSSSSSSKHK.',
                '.KSSSWESSSWESSK.',
                '.KSSSSEWSSSEWSK.',
                '..KSSSSSSSSSSK..',
                '.KKKSSSSSSSSKKK.',
                'KSSKKKKKKKKKKSSK',
                'KSSKJJJJJJJJJKSK',
                '.KKKJJJJJJJJJKK.',
                '...KJJJJJJJJJK..',
                '...KKKKKKKKKKK..',
                '...KPPPPPPPPPK..',
                '...KPPPK.KPPPK..',
                '...KBBBK.KBBBK..',
                '...KKKKK.KKKKK..'
              ]
            : [
                '....KKKKKKKK....',
                '..KKHHHHHHHHKK..',
                '.KHHHHHHHHHHHHK.',
                '.KHKKKKKKKKKKHK.',
                '.KHKSSSSSSSSKHK.',
                '.KSSSWESSSWESSK.',
                '.KSSSSEWSSSEWSK.',
                '..KSSSSSSSSSSK..',
                '...KKKKKKKKKK...',
                '..KKJJJJJJJJKK..',
                '.KJJJJJJJJJJJJK.',
                '.KSSKJJJJJJJKSSK',
                '.KKKKJJJJJJJKKKK',
                '...KKKKKKKKKKK..',
                '...KPPPPPPPPPK..',
                '...KPPPK.KPPPK..',
                '...KBBBK.KBBBK..',
                '...KKKKK.KKKKK..'
              ];
          this.drawGrid(ctx, grid, palette, 2, cheering ? 2 : 4);
        });

      return {
        calm: makeNpc(false),
        cheer: makeNpc(true)
      };
    });
  }

  /**
   * Crisp GBA Pixel-Woven Badminton Net Texture (Replaces noisy wireframe triangles)
   */
  public static createPixelNetTexture(): THREE.CanvasTexture {
    const tex = this.makePixelTexture(64, 16, (ctx) => {
      ctx.clearRect(0, 0, 64, 16);
      // Top white net canvas tape with dark GBA border
      ctx.fillStyle = '#14141f';
      ctx.fillRect(0, 0, 64, 3);
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 1, 64, 2);

      // Crisp 2px pixel mesh grid
      ctx.fillStyle = '#cbd5e1';
      for (let y = 3; y < 16; y += 2) {
        ctx.fillRect(0, y, 64, 1);
      }
      for (let x = 0; x < 64; x += 2) {
        ctx.fillRect(x, 3, 1, 13);
      }
    });
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.repeat.set(8, 1);
    return tex;
  }

  /**
   * Crisp 16x16 GBA Feathered Shuttlecock Sprite
   */
  public static createShuttleSprite(): THREE.CanvasTexture {
    const palette: Record<string, string> = {
      K: '#14141f',
      W: '#ffffff',
      G: '#cbd5e1',
      R: '#ef4444',
      C: '#fef08a'
    };
    const grid = [
      '..KK..KK..KK..',
      '.KWK.KWWK.KWK.',
      '.KWWKKWWKKWWK.',
      '..KWWWWWWWWK..',
      '..KWGWWWWGWK..',
      '...KWWWWWWK...',
      '...KRRRRRRK...',
      '....KCCCCK....',
      '....KCCCCK....',
      '.....KKKK.....'
    ];
    return this.makePixelTexture(14, 10, (ctx) => {
      this.drawGrid(ctx, grid, palette, 0, 0);
    });
  }
}
`,

  // =========================================================================
  // 2. UPDATED: Player.ts (No Cylinders/Boxes -> Animated GBA Sprite Character)
  // =========================================================================
  'entities/Player.ts': `import * as THREE from 'three';
import { COURT } from '../physics/CourtBounds.js';
import { GbaSpriteFactory, PlayerSpriteSet } from '../graphics/GbaSpriteFactory.js';

export class Player {
  public group = new THREE.Group();
  public pos = new THREE.Vector3();
  public vel = new THREE.Vector3();
  public stamina = 100;
  public isAirborne = false;
  public swingTimer = 0;
  public animState: 'IDLE' | 'RUN' | 'JUMP' | 'LUNGE' | 'SWING' = 'IDLE';

  private spriteMesh: THREE.Mesh;
  private spriteMat: THREE.MeshBasicMaterial;
  private sprites: PlayerSpriteSet;
  private facingRight = true;
  private readonly moveSpeed = 6.4;
  private readonly jumpImpulse = 6.6;
  private readonly gravity = -16.5;

  constructor(
    public readonly side: 0 | 1,
    _jerseyColor: number,
    scene: THREE.Scene
  ) {
    this.sprites = GbaSpriteFactory.createPlayerSprites(side === 0);

    // Crisp GBA 2D billboard quad with alpha cutout
    const geo = new THREE.PlaneGeometry(1.45, 1.45);
    this.spriteMat = new THREE.MeshBasicMaterial({
      map: this.sprites.idle,
      transparent: true,
      alphaTest: 0.1,
      side: THREE.DoubleSide
    });

    this.spriteMesh = new THREE.Mesh(geo, this.spriteMat);
    this.spriteMesh.position.y = 0.72;

    // Crisp GBA oval ground shadow under the player's shoes
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
    this.resetPosition();
    scene.add(this.group);
  }

  public resetPosition(): void {
    const zStart = this.side === 0 ? 3.4 : -3.4;
    this.pos.set(0, 0, zStart);
    this.vel.set(0, 0, 0);
    this.isAirborne = false;
    this.syncMesh();
  }

  public getStrikeCenter(): THREE.Vector3 {
    return new THREE.Vector3(this.pos.x, this.pos.y + 1.25, this.pos.z);
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
    onFootSqueak: () => void
  ): void {
    const prevVx = this.vel.x;
    this.vel.x = moveX * this.moveSpeed;
    this.vel.z = moveZ * this.moveSpeed;

    if (Math.abs(moveX) > 0.1) {
      this.facingRight = moveX > 0;
    }

    if (!this.isAirborne && Math.abs(this.vel.x - prevVx) > 8.5 && Math.random() < 0.35) {
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

    this.pos.x = THREE.MathUtils.clamp(this.pos.x, -COURT.HALF_WIDTH - 0.6, COURT.HALF_WIDTH + 0.6);
    if (this.side === 0) {
      this.pos.z = THREE.MathUtils.clamp(this.pos.z, 0.38, COURT.HALF_LENGTH + 0.8);
    } else {
      this.pos.z = THREE.MathUtils.clamp(this.pos.z, -COURT.HALF_LENGTH - 0.8, -0.38);
    }

    this.stamina = Math.min(100, this.stamina + dt * 9);

    if (this.swingTimer > 0) {
      this.swingTimer = Math.max(0, this.swingTimer - dt);
    } else if (this.isAirborne) {
      this.animState = 'JUMP';
    } else if (Math.hypot(this.vel.x, this.vel.z) > 0.35) {
      this.animState = 'RUN';
    } else {
      this.animState = 'IDLE';
    }

    this.syncMesh();
  }

  public syncMesh(): void {
    this.group.position.copy(this.pos);

    // Select GBA Sprite Animation Frame
    if (this.swingTimer > 0 || this.animState === 'SWING') {
      this.spriteMat.map = this.sprites.swing;
    } else if (this.isAirborne || this.animState === 'JUMP') {
      this.spriteMat.map = this.sprites.jump;
    } else if (this.animState === 'RUN') {
      const stepFrame = Math.floor(performance.now() / 110) % 2;
      this.spriteMat.map = stepFrame === 0 ? this.sprites.run1 : this.sprites.run2;
    } else {
      this.spriteMat.map = this.sprites.idle;
    }

    // Flip sprite horizontally when moving left/right
    this.spriteMesh.scale.x = this.facingRight ? 1 : -1;
    // Slight GBA tilt toward camera for 2.5D readability
    this.spriteMesh.rotation.x = -0.22;
  }
}
`,

  // =========================================================================
  // 3. UPDATED: CrowdManager.ts (Replaces Cubes with GBA Character Spectators)
  // =========================================================================
  'entities/CrowdManager.ts': `import * as THREE from 'three';
import { GbaSpriteFactory, CrowdNpcSpriteSet } from '../graphics/GbaSpriteFactory.js';

interface SpectatorInstance {
  mesh: THREE.Mesh;
  mat: THREE.MeshBasicMaterial;
  preset: CrowdNpcSpriteSet;
  baseY: number;
  phase: number;
}

export class CrowdManager {
  public excitement = 0.15;
  private spectators: SpectatorInstance[] = [];

  constructor(scene: THREE.Scene) {
    const presets = GbaSpriteFactory.createCrowdNpcPresets();

    // Styled GBA dark-slate stadium bleachers on left and right
    const bleacherMat = new THREE.MeshLambertMaterial({ color: 0x161925 });
    const trimMat = new THREE.MeshBasicMaterial({ color: 0x2e344e });

    [-1, 1].forEach((dir) => {
      for (let tier = 0; tier < 4; tier++) {
        const step = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.45 + tier * 0.48, 15.6), bleacherMat);
        step.position.set(dir * (5.1 + tier * 1.0), (0.45 + tier * 0.48) / 2, 0);
        scene.add(step);

        const rail = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 15.6), trimMat);
        rail.position.set(dir * (4.65 + tier * 1.0), 0.48 + tier * 0.48, 0);
        scene.add(rail);
      }
    });

    // Populate bleachers with GBA Character Sprites (visible heads, eyes, hair, hands, legs)
    const specGeo = new THREE.PlaneGeometry(0.78, 0.95);
    let idx = 0;

    [-1, 1].forEach((dir) => {
      for (let tier = 0; tier < 4; tier++) {
        for (let slot = 0; slot < 22; slot++) {
          const preset = presets[idx % presets.length];
          const mat = new THREE.MeshBasicMaterial({
            map: preset.calm,
            transparent: true,
            alphaTest: 0.1,
            side: THREE.DoubleSide
          });

          const mesh = new THREE.Mesh(specGeo, mat);
          const x = dir * (5.05 + tier * 1.0);
          const baseY = 0.85 + tier * 0.48;
          const z = -6.6 + slot * 0.62 + (Math.random() - 0.5) * 0.12;

          mesh.position.set(x, baseY, z);
          // Angle slightly toward court center while staying readable to broadcast camera
          mesh.rotation.y = dir === -1 ? 0.35 : -0.35;
          mesh.rotation.x = -0.18;

          scene.add(mesh);
          this.spectators.push({
            mesh,
            mat,
            preset,
            baseY,
            phase: Math.random() * Math.PI * 2
          });
          idx++;
        }
      }
    });
  }

  public boostExcitement(amount: number): void {
    this.excitement = Math.min(1.0, this.excitement + amount);
  }

  public update(dt: number): void {
    this.excitement = Math.max(0.12, this.excitement - dt * 0.06);
    const time = performance.now() * 0.001;
    const bounceSpeed = 4.5 + this.excitement * 11;
    const bounceHeight = 0.02 + this.excitement * 0.18;

    for (let i = 0; i < this.spectators.length; i++) {
      const s = this.spectators[i];
      const wave = Math.sin(time * bounceSpeed + s.phase);
      const jump = Math.max(0, wave) * bounceHeight;
      s.mesh.position.y = s.baseY + jump;

      // Switch NPC sprite to hands-in-the-air CHEER pose when crowd hype is high!
      const isCheering = this.excitement > 0.36 && wave > 0.1;
      const targetMap = isCheering ? s.preset.cheer : s.preset.calm;
      if (s.mat.map !== targetMap) {
        s.mat.map = targetMap;
      }
    }
  }
}
`,

  // =========================================================================
  // 4. UPDATED: CourtBounds.ts (GBA Pixel Net & Square Pixel Posts, No Cylinders)
  // =========================================================================
  'physics/CourtBounds.ts': `import * as THREE from 'three';
import { GbaSpriteFactory } from '../graphics/GbaSpriteFactory.js';

export const COURT = {
  LENGTH: 13.4,
  HALF_LENGTH: 6.7,
  SINGLES_WIDTH: 5.18,
  HALF_WIDTH: 2.59,
  DOUBLES_WIDTH: 6.1,
  NET_HEIGHT: 1.55,
  SHORT_SERVICE_LINE: 1.98
} as const;

export class CourtBounds {
  public group = new THREE.Group();

  constructor() {
    this.buildCourtMesh();
  }

  private buildCourtMesh(): void {
    // Pitch-black outer arena floor
    const arenaGeo = new THREE.PlaneGeometry(50, 50);
    const arenaMat = new THREE.MeshBasicMaterial({ color: 0x050508 });
    const arenaFloor = new THREE.Mesh(arenaGeo, arenaMat);
    arenaFloor.rotation.x = -Math.PI / 2;
    arenaFloor.position.y = -0.02;
    this.group.add(arenaFloor);

    // Outer GBA Stadium Mat Border
    const outerMat = new THREE.Mesh(
      new THREE.PlaneGeometry(COURT.DOUBLES_WIDTH + 2.0, COURT.LENGTH + 2.2),
      new THREE.MeshBasicMaterial({ color: 0x0b3b24 })
    );
    outerMat.rotation.x = -Math.PI / 2;
    outerMat.position.y = -0.005;
    this.group.add(outerMat);

    // Main BWF GBA Emerald Court Surface
    const matGeo = new THREE.PlaneGeometry(COURT.DOUBLES_WIDTH + 0.8, COURT.LENGTH + 0.8);
    const matMaterial = new THREE.MeshBasicMaterial({ color: 0x15803d });
    const courtMat = new THREE.Mesh(matGeo, matMaterial);
    courtMat.rotation.x = -Math.PI / 2;
    this.group.add(courtMat);

    // Crisp White Court Lines
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc });
    const addLine = (w: number, l: number, x: number, z: number) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, l), lineMat);
      m.rotation.x = -Math.PI / 2;
      m.position.set(x, 0.005, z);
      this.group.add(m);
    };

    const lw = 0.06;
    addLine(lw, COURT.LENGTH, -COURT.HALF_WIDTH, 0);
    addLine(lw, COURT.LENGTH, COURT.HALF_WIDTH, 0);
    addLine(lw, COURT.LENGTH, -COURT.DOUBLES_WIDTH / 2, 0);
    addLine(lw, COURT.LENGTH, COURT.DOUBLES_WIDTH / 2, 0);

    addLine(COURT.DOUBLES_WIDTH, lw, 0, -COURT.HALF_LENGTH);
    addLine(COURT.DOUBLES_WIDTH, lw, 0, COURT.HALF_LENGTH);
    addLine(COURT.DOUBLES_WIDTH, lw, 0, -COURT.SHORT_SERVICE_LINE);
    addLine(COURT.DOUBLES_WIDTH, lw, 0, COURT.SHORT_SERVICE_LINE);

    const centerLen = COURT.HALF_LENGTH - COURT.SHORT_SERVICE_LINE;
    addLine(lw, centerLen, 0, -(COURT.SHORT_SERVICE_LINE + centerLen / 2));
    addLine(lw, centerLen, 0, COURT.SHORT_SERVICE_LINE + centerLen / 2);

    // Square Pixel-Art Net Posts (NO Cylinders!)
    const postGeo = new THREE.BoxGeometry(0.1, COURT.NET_HEIGHT, 0.1);
    const postMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    [-COURT.DOUBLES_WIDTH / 2, COURT.DOUBLES_WIDTH / 2].forEach((x) => {
      const post = new THREE.Mesh(postGeo, postMat);
      post.position.set(x, COURT.NET_HEIGHT / 2, 0);
      this.group.add(post);
    });

    // Crisp GBA Pixel-Woven Net Texture (NO Wireframe Triangles!)
    const netTex = GbaSpriteFactory.createPixelNetTexture();
    const netGeo = new THREE.PlaneGeometry(COURT.DOUBLES_WIDTH, 0.78);
    const netMat = new THREE.MeshBasicMaterial({
      map: netTex,
      transparent: true,
      alphaTest: 0.1,
      side: THREE.DoubleSide
    });
    const netMesh = new THREE.Mesh(netGeo, netMat);
    netMesh.position.set(0, COURT.NET_HEIGHT - 0.39, 0);
    this.group.add(netMesh);
  }

  public static isShuttleInBounds(x: number, z: number, targetSide: 0 | 1): boolean {
    const inWidth = Math.abs(x) <= COURT.HALF_WIDTH + 0.06;
    const inLength =
      targetSide === 0
        ? z >= 0 && z <= COURT.HALF_LENGTH + 0.06
        : z <= 0 && z >= -COURT.HALF_LENGTH - 0.06;
    return inWidth && inLength;
  }
}
`,

  // =========================================================================
  // 5. UPDATED: Shuttlecock.ts (GBA Pixel Shuttlecock Sprite)
  // =========================================================================
  'physics/Shuttlecock.ts': `import * as THREE from 'three';
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

  private readonly gravity = -9.81;
  private readonly dragCoeff = 0.082;
  private trailPositions: THREE.Vector3[] = [];
  private trailLine: THREE.Line;

  constructor(scene: THREE.Scene) {
    // Crisp GBA Pixel Feathered Shuttlecock Quad
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

    // Crisp Flight Arc Ribbon
    const trailGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(),
      new THREE.Vector3()
    ]);
    const trailMat = new THREE.LineBasicMaterial({ color: 0xf8fafc, transparent: true, opacity: 0.65 });
    this.trailLine = new THREE.Line(trailGeo, trailMat);
    scene.add(this.trailLine);
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
  }

  public resetToServer(servingSide: 0 | 1, serverPos: THREE.Vector3): void {
    this.inPlay = false;
    this.vel.set(0, 0, 0);
    const zOffset = servingSide === 0 ? -0.35 : 0.35;
    this.pos.set(serverPos.x + 0.25, 1.15, serverPos.z + zOffset);
    this.syncVisuals();
  }

  public update(
    dt: number,
    onNetCord: () => void,
    onFloorHit: (x: number, z: number) => void
  ): void {
    if (!this.inPlay) {
      this.syncVisuals();
      return;
    }

    const subSteps = 4;
    const subDt = dt / subSteps;

    for (let i = 0; i < subSteps; i++) {
      const prevZ = this.pos.z;
      const speed = this.vel.length();

      const ax = -this.dragCoeff * speed * this.vel.x;
      const ay = this.gravity - this.dragCoeff * speed * this.vel.y;
      const az = -this.dragCoeff * speed * this.vel.z;

      this.vel.x += ax * subDt;
      this.vel.y += ay * subDt;
      this.vel.z += az * subDt;

      this.pos.addScaledVector(this.vel, subDt);

      if ((prevZ > 0 && this.pos.z <= 0) || (prevZ < 0 && this.pos.z >= 0)) {
        if (this.pos.y < COURT.NET_HEIGHT && Math.abs(this.pos.x) <= COURT.DOUBLES_WIDTH / 2) {
          if (this.pos.y >= COURT.NET_HEIGHT - 0.13) {
            this.vel.x *= 0.25;
            this.vel.z *= 0.18;
            this.vel.y = Math.max(1.6, Math.abs(this.vel.y) * 0.35);
            this.pos.y = COURT.NET_HEIGHT + 0.02;
            onNetCord();
          } else {
            this.vel.set(0, -1.5, -this.vel.z * 0.08);
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
    if (this.trailPositions.length > 14) this.trailPositions.shift();
    this.syncVisuals();
  }

  private syncVisuals(): void {
    this.mesh.position.copy(this.pos);
    this.shadowRing.position.x = this.pos.x;
    this.shadowRing.position.z = this.pos.z;
    const scale = Math.max(0.45, 1.3 - this.pos.y * 0.18);
    this.shadowRing.scale.set(scale, scale, 1);

    if (this.trailPositions.length >= 2) {
      this.trailLine.geometry.setFromPoints(this.trailPositions);
    }
  }
}
`,

  // =========================================================================
  // 6. UPDATED: main.ts (Removes Blurry RenderPixelatedPass for Crisp GBA Sprites)
  // =========================================================================
  'main.ts': `import * as THREE from 'three';

import { GameLoop } from './core/GameLoop.js';
import { InputManager } from './core/InputManager.js';
import { CameraRig } from './core/CameraRig.js';
import { CourtBounds } from './physics/CourtBounds.js';
import { Shuttlecock } from './physics/Shuttlecock.js';
import { HitDetection } from './physics/HitDetection.js';
import { Player } from './entities/Player.js';
import { CrowdManager } from './entities/CrowdManager.js';
import { SoundDirector } from './audio/SoundDirector.js';
import { SocketClient } from './network/SocketClient.js';
import { Reconciler } from './network/Reconciler.js';

// --- Crisp GBA Renderer Setup (No Full-Screen Downscale Blur!) ---
const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050508);

const cameraRig = new CameraRig(window.innerWidth / window.innerHeight);

const ambient = new THREE.AmbientLight(0xffffff, 1.3);
const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(4, 12, 6);
scene.add(ambient, dirLight);

// --- Core Entities ---
const court = new CourtBounds();
scene.add(court.group);

const crowd = new CrowdManager(scene);
const sound = new SoundDirector();
const shuttle = new Shuttlecock(scene);
const input = new InputManager();
const reconciler = new Reconciler();

const p0 = new Player(0, 0x10b981, scene); // P1 Trainer (Near Court)
const p1 = new Player(1, 0xf43f5e, scene); // P2 Rival (Far Court)

let localSide: 0 | 1 = 0;
let servingSide: 0 | 1 = 0;
let scores: [number, number] = [0, 0];
let stateTimer = 0;

// --- DOM HUD Elements ---
const scoreEl0 = document.getElementById('score-p0')!;
const scoreEl1 = document.getElementById('score-p1')!;
const rallyEl = document.getElementById('rally-counter')!;
const shotEl = document.getElementById('shot-indicator')!;
const bannerEl = document.getElementById('banner')!;
const staminaEl = document.getElementById('stamina-readout')!;
const netStatusEl = document.getElementById('net-status')!;
const modeLabelEl = document.getElementById('mode-label')!;

function showBanner(text: string, duration = 1.6): void {
  bannerEl.textContent = text;
  bannerEl.style.opacity = '1';
  stateTimer = duration;
}

function updateHUD(): void {
  scoreEl0.textContent = String(scores[0]);
  scoreEl1.textContent = String(scores[1]);
  rallyEl.textContent = \`RALLY: \${shuttle.rallyCount}\`;
  const hype = crowd.excitement > 0.7 ? 'ROARING' : crowd.excitement > 0.4 ? 'RISING' : 'LOW';
  const myPlayer = localSide === 0 ? p0 : p1;
  staminaEl.textContent = \`STAMINA: \${Math.round(myPlayer.stamina)}% | CROWD HYPE: \${hype}\`;
}

// --- Network PvP Setup ---
const SERVER_URL = (import.meta as unknown as { env: { VITE_SERVER_URL?: string } }).env.VITE_SERVER_URL || 'http://localhost:4000';
const net = new SocketClient(SERVER_URL, {
  onMatchStart: ({ code, side, servingSide: srv }) => {
    localSide = side;
    servingSide = srv;
    scores = [0, 0];
    cameraRig.applyMode(localSide);
    p0.resetPosition();
    p1.resetPosition();
    modeLabelEl.textContent = \`PVP ROOM: \${code}\`;
    showBanner(\`PVP MATCH STARTED (YOU ARE P\${side + 1})\`, 2.5);
    updateHUD();
  },
  onOpponentState: (pkt) => {
    const opp = localSide === 0 ? p1 : p0;
    reconciler.applyOpponentPacket(pkt, opp);
  },
  onShuttleSync: (pkt) => {
    reconciler.applyDeterministicHit(pkt, shuttle);
    sound.playRacketHit(pkt.shotType, true);
    crowd.boostExcitement(pkt.shotType === 'JUMP_SMASH' ? 0.25 : 0.08);
    shotEl.textContent = \`SHOT: \${pkt.shotType.replace('_', ' ')}\`;
    updateHUD();
  },
  onPointScored: (pkt) => {
    scores = pkt.scores;
    servingSide = pkt.servingSide;
    shuttle.inPlay = false;
    sound.playCrowdCheer(crowd.excitement);
    crowd.boostExcitement(0.35);
    showBanner(
      pkt.matchWinner !== null
        ? \`PLAYER \${pkt.matchWinner + 1} WINS THE MATCH!\`
        : \`POINT P\${pkt.winnerSide + 1} (\${pkt.reason.replace('_', ' ')})\`
    );
    updateHUD();
  },
  onStatusChange: (txt) => {
    netStatusEl.textContent = txt;
  }
});

document.getElementById('btn-create')?.addEventListener('click', () => net.createRoom('P1'));
document.getElementById('btn-join')?.addEventListener('click', () => {
  const code = (document.getElementById('input-code') as HTMLInputElement).value;
  if (code) net.joinRoom(code, 'P2');
});
document.getElementById('btn-cam')?.addEventListener('click', (e) => {
  const mode = cameraRig.toggleMode(localSide);
  (e.target as HTMLButtonElement).textContent =
    mode === 'BROADCAST_END' ? 'Cam: Broadcast' : 'Cam: Side TV';
});

// --- AI Sparring Bot ---
function updateAIBot(dt: number): void {
  const bot = p1;
  if (!shuttle.inPlay) {
    if (servingSide === 1 && stateTimer <= 0) {
      bot.triggerSwing();
      const hit = HitDetection.tryStrike(bot, shuttle, 'POWER', 0, 1);
      if (hit) executeStrike(bot, hit.shotType, hit.velocity, hit.isSweetSpot);
    }
    return;
  }

  const targetX = shuttle.vel.z < 0 ? shuttle.pos.x : 0;
  const targetZ = shuttle.vel.z < 0 ? Math.min(-0.8, shuttle.pos.z) : -3.4;

  const dx = THREE.MathUtils.clamp(targetX - bot.pos.x, -1, 1);
  const dz = THREE.MathUtils.clamp(targetZ - bot.pos.z, -1, 1);
  bot.updateLocal(dt, dx * 0.85, dz * 0.85, false, () => {});

  if (shuttle.pos.z < -0.25 && shuttle.lastHitterSide === 0) {
    const mode = Math.random() < 0.3 ? 'FINESSE' : 'POWER';
    const aimX = (Math.random() - 0.5) * 1.8;
    const hit = HitDetection.tryStrike(bot, shuttle, mode, aimX, 0.5);
    if (hit) {
      bot.triggerSwing();
      executeStrike(bot, hit.shotType, hit.velocity, hit.isSweetSpot);
    }
  }
}

function executeStrike(
  hitter: Player,
  shotType: ReturnType<typeof HitDetection.tryStrike> extends infer R
    ? R extends { shotType: infer S }
      ? S
      : never
    : never,
  velocity: THREE.Vector3,
  isSweetSpot: boolean
): void {
  const nextRally = shuttle.inPlay ? shuttle.rallyCount + 1 : 1;
  shuttle.launch(shuttle.pos.clone(), velocity, hitter.side, shotType, nextRally);
  sound.playRacketHit(shotType, isSweetSpot);

  if (shotType === 'JUMP_SMASH') {
    cameraRig.triggerSmashShake(0.35);
    crowd.boostExcitement(0.28);
  } else {
    crowd.boostExcitement(0.08);
  }

  shotEl.textContent = \`\${shotType.replace('_', ' ')} (\${Math.round(velocity.length() * 3.6)} KM/H)\`;
  updateHUD();

  net.sendShuttleHit({
    hitterSide: hitter.side,
    pos: [shuttle.pos.x, shuttle.pos.y, shuttle.pos.z],
    vel: [velocity.x, velocity.y, velocity.z],
    shotType,
    rallyCount: nextRally,
    timestamp: Date.now()
  });
}

function handleFloorHit(x: number, z: number): void {
  const hitter = shuttle.lastHitterSide;
  const receiver: 0 | 1 = hitter === 0 ? 1 : 0;
  const crossedNet = (hitter === 0 && z < 0) || (hitter === 1 && z > 0);
  let winnerSide: 0 | 1 = hitter;
  let reason: 'IN_BOUNDS' | 'OUT_OF_BOUNDS' | 'INTO_NET' = 'IN_BOUNDS';

  if (!crossedNet) {
    winnerSide = receiver;
    reason = 'INTO_NET';
  } else if (!CourtBounds.isShuttleInBounds(x, z, receiver)) {
    winnerSide = receiver;
    reason = 'OUT_OF_BOUNDS';
  }

  if (net.isOnline) {
    if (localSide === 0) net.reportPoint(winnerSide, reason);
  } else {
    scores[winnerSide] += 1;
    servingSide = winnerSide;
    sound.playCrowdCheer(crowd.excitement);
    crowd.boostExcitement(0.35);
    showBanner(\`POINT P\${winnerSide + 1} — \${reason.replace('_', ' ')}\`, 1.8);
    updateHUD();
  }
}

let netTickCounter = 0;

const loop = new GameLoop(
  (dt) => {
    if (stateTimer > 0) {
      stateTimer -= dt;
      if (stateTimer <= 0) bannerEl.style.opacity = '0';
    }

    const myPlayer = localSide === 0 ? p0 : p1;
    const oppPlayer = localSide === 0 ? p1 : p0;
    const inp = input.consumeState();

    const dirFactor = localSide === 0 ? 1 : -1;
    myPlayer.updateLocal(
      dt,
      inp.moveX * dirFactor,
      inp.moveZ * dirFactor,
      inp.jumpPressed,
      () => sound.playShoeSqueak()
    );

    if (inp.powerPressed || inp.finessePressed) {
      myPlayer.triggerSwing();
      const canHit =
        (!shuttle.inPlay && servingSide === localSide) ||
        (shuttle.inPlay && shuttle.lastHitterSide !== localSide);

      if (canHit) {
        const mode = inp.powerPressed ? 'POWER' : 'FINESSE';
        const hit = HitDetection.tryStrike(myPlayer, shuttle, mode, inp.moveX * dirFactor, inp.moveZ * dirFactor);
        if (hit) {
          executeStrike(myPlayer, hit.shotType, hit.velocity, hit.isSweetSpot);
        }
      }
    }

    if (net.isOnline) {
      reconciler.interpolateOpponent(dt, oppPlayer);
      netTickCounter++;
      if (netTickCounter % 2 === 0) {
        net.sendPlayerState({
          id: net.socket.id || 'local',
          side: localSide,
          x: myPlayer.pos.x,
          y: myPlayer.pos.y,
          z: myPlayer.pos.z,
          vx: myPlayer.vel.x,
          vz: myPlayer.vel.z,
          anim: myPlayer.animState,
          stamina: myPlayer.stamina
        });
      }
    } else {
      updateAIBot(dt);
    }

    if (!shuttle.inPlay) {
      const server = servingSide === 0 ? p0 : p1;
      shuttle.resetToServer(servingSide, server.pos);
    } else {
      shuttle.update(
        dt,
        () => sound.playNetCord(),
        (x, z) => handleFloorHit(x, z)
      );
    }

    crowd.update(dt);
    cameraRig.update(dt, myPlayer.pos.x, shuttle.pos);
    updateHUD();
  },
  () => {
    renderer.render(scene, cameraRig.camera);
  }
);

window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  cameraRig.resize(window.innerWidth / window.innerHeight);
});

loop.start();
`
};

for (const [relPath, content] of Object.entries(files)) {
  const fullPath = path.join(CLIENT_SRC, relPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log('✓ Updated:', relPath);
}

console.log('\\n[DONE] GBA Pokémon-style character & crowd sprites applied! Check your browser.');