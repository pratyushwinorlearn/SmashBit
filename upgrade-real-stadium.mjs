#!/usr/bin/env node
/**
 * Upgrades SmashBit Arena to a full GBA-style BWF / Commonwealth Games Broadcast Stadium:
 * - Vibrant Magenta/Pink outer stadium carpet & perimeter barrier wall
 * - Green BWF court mat with neon-green trim & pixel-art YONEX / SMASH 2026 baseline logos
 * - Right side: Tall Black Umpire High-Chair, GBA Umpire sprite, and mounted PC/Laptop + yellow gear box
 * - Left side: Orange Service Judge desk, GBA Service Judge, and shuttlecock dispenser tubes
 * - Back/Sides: Yellow sponsor toblerone boards, seated Line Judges, live 3D LED scoreboard, & back concrete grandstand
 *
 * Run inside pixel-badminton-pvp/: node upgrade-real-stadium.mjs
 */
import fs from 'fs';
import path from 'path';

const CLIENT_SRC = fs.existsSync(path.join(process.cwd(), 'client/src'))
  ? path.join(process.cwd(), 'client/src')
  : path.join(process.cwd(), 'pixel-badminton-pvp/client/src');

const files = {
  // =========================================================================
  // 1. GBA Sprite & Stadium Texture Factory
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

export class GbaSpriteFactory {
  private static makePixelTexture(
    width: number,
    height: number,
    drawFn: (ctx: CanvasRenderingContext2D) => void
  ): THREE.CanvasTexture {
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
   * 5-frame GBA Pokémon Trainer-style badminton player sprite set (36x36)
   */
  public static createPlayerSprites(isPlayerOne: boolean): PlayerSpriteSet {
    const palette: Record<string, string> = {
      K: '#14141f',
      H: isPlayerOne ? '#1e293b' : '#3b2314',
      h: isPlayerOne ? '#475569' : '#6b4423',
      W: '#f8fafc',
      S: '#e5a97c',
      s: '#c68659',
      E: '#0f172a',
      M: '#be123c',
      J: isPlayerOne ? '#1d4ed8' : '#2563eb', // Classic India/Commonwealth Blue kit
      j: isPlayerOne ? '#1e3a8a' : '#1d4ed8',
      A: isPlayerOne ? '#f97316' : '#38bdf8', // Tricolor/accent chest stripe
      P: '#0f172a',
      p: '#020617',
      B: '#f8fafc', // White court shoes
      R: '#f97316',
      Y: '#facc15',
      G: '#e2e8f0'
    };

    const headGrid = [
      '....KKKKKKKK....',
      '..KKHHHHHHHHKK..',
      '.KHHhHHHHHHhHHK.',
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

        const bodyGrid =
          pose === 'SWING'
            ? [
                '....KKKKKKKK....',
                '..KKJJWWWWJJKK..',
                '.KSSKJJAAJJJKSSK',
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
                '.KJJJJAAAAJJJJK.',
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
          legsGrid = [
            '..KSSK....KSSK..',
            '..KWWK....KWWK..',
            '.KBBBK....KBBBK.',
            '.KKKKK....KKKKK.'
          ];
        }
        this.drawGrid(ctx, legsGrid, palette, 8, headY + 23);

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
   * GBA Umpire Seated Sprite (Facing Left toward the Net & Laptop PC)
   */
  public static createUmpireSprite(): THREE.CanvasTexture {
    const palette: Record<string, string> = {
      K: '#14141f',
      H: '#4b2e1e', // Brown hair
      S: '#ffdbb5', // Skin
      E: '#0f172a', // Eyes
      W: '#ffffff', // Collar
      U: '#60a5fa', // Official sky-blue umpire polo
      u: '#3b82f6', // Polo shadow
      P: '#334155', // Slate trousers
      B: '#0f172a'  // Shoes
    };

    const grid = [
      '.......KKKKKKKK.....',
      '.....KKHHHHHHHHKK...',
      '....KHHHHHHHHHHHHK..',
      '....KKKKSSSSSSKKKK..',
      '....KSSEWSSSSSSKHK..',
      '....KSSSSSSSSSSKHK..',
      '.....KSSSSSSSSKK....',
      '......KKKKKKKK......',
      '.....KKUUUUWWUUK....',
      '...KKUUUUUUUUUUUK...',
      '..KSSKUUUUUUUUUUK...',
      '..KKKKUUUUuuuuuUK...',
      '.....KKKKKKKKKKKK...',
      '...KKPPPPPPPPPPPK...',
      '..KPPPPPPKKKKKKK....',
      '..KPPPPPK...........',
      '..KPPPPK............',
      '.KBBBBBK............',
      '.KKKKKKK............'
    ];

    return this.makePixelTexture(24, 24, (ctx) => {
      this.drawGrid(ctx, grid, palette, 2, 2);
    });
  }

  /**
   * GBA Service Judge / Line Judge Official Sprite (Sky-blue official shirt + white cap)
   */
  public static createOfficialSprite(): THREE.CanvasTexture {
    const palette: Record<string, string> = {
      K: '#14141f',
      C: '#f8fafc', // White official cap
      S: '#ffdbb5',
      E: '#0f172a',
      U: '#38bdf8', // Light blue official shirt
      P: '#1e293b', // Dark pants
      B: '#f8fafc'
    };

    const grid = [
      '....KKKKKKKK....',
      '..KKCCCCCCCCKK..',
      '.KCCCCCCCCCCCCK.',
      '.KCCKKKKKKKKCCK.',
      '.KCKSSSSSSSSKCK.',
      '.KSSSWESSSWESSK.',
      '..KSSSSSSSSSSK..',
      '...KKKKKKKKKK...',
      '..KKUUUUUUUUUKK.',
      '.KUUUUUUUUUUUUUK',
      '.KSSKUUUUUUUKSSK',
      '.KKKKUUUUUUUKKKK',
      '...KKKKKKKKKKK..',
      '...KPPPPPPPPPK..',
      '...KPPPK.KPPPK..',
      '...KBBBK.KBBBK..',
      '...KKKKK.KKKKK..'
    ];

    return this.makePixelTexture(20, 22, (ctx) => {
      this.drawGrid(ctx, grid, palette, 2, 2);
    });
  }

  /**
   * Full BWF Tournament Green Court Mat Texture with Neon-Green Border,
   * Crisp White Lines, and Pixel-Art "YONEX" + "SMASH 2026" Logos
   */
  public static createTournamentCourtMatTexture(): THREE.CanvasTexture {
    return this.makePixelTexture(256, 512, (ctx) => {
      // 1. Bright Neon-Green outer safety border (like Birmingham 2022 mat edge)
      ctx.fillStyle = '#4ade80';
      ctx.fillRect(0, 0, 256, 512);

      // 2. Main BWF Tournament Teal-Green PVC Mat Surface
      ctx.fillStyle = '#2e8555';
      ctx.fillRect(6, 6, 244, 500);

      // Subtle GBA pixel weave texture on mat
      ctx.fillStyle = '#29794c';
      for (let y = 8; y < 504; y += 4) {
        for (let x = 8 + (y % 8 === 0 ? 2 : 0); x < 248; x += 4) {
          ctx.fillRect(x, y, 2, 2);
        }
      }

      // 3. Draw Pixel-Art YONEX & SMASH 2026 Baseline Logos (Top & Bottom)
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 15px monospace';
      ctx.textAlign = 'center';

      // Near baseline logos (facing camera)
      ctx.fillText('SMASH 2026', 68, 498);
      // YONEX Double-Circle + Triangles Icon
      ctx.beginPath();
      ctx.arc(146, 493, 4, 0, Math.PI * 2);
      ctx.arc(156, 493, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillText('YONEX', 194, 498);

      // Far baseline logos
      ctx.fillText('YONEX', 64, 21);
      ctx.fillText('SMASH 2026', 188, 21);
    });
  }

  /**
   * Yellow A-Frame Toblerone Sponsor Banner Texture (LONGINES / YONEX / e.on)
   */
  public static createSponsorBannerTexture(text: string, bgHex = '#facc15', fgHex = '#0f172a'): THREE.CanvasTexture {
    return this.makePixelTexture(128, 32, (ctx) => {
      ctx.fillStyle = '#14141f';
      ctx.fillRect(0, 0, 128, 32);
      ctx.fillStyle = bgHex;
      ctx.fillRect(2, 2, 124, 28);

      ctx.fillStyle = fgHex;
      ctx.font = 'bold 16px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, 64, 17);
    });
  }

  /**
   * Courtside Digital LED Scoreboard Texture (Matches the black IND vs SRI board on right)
   */
  public static createScoreboardTexture(p0Score = 0, p1Score = 0): THREE.CanvasTexture {
    return this.makePixelTexture(128, 64, (ctx) => {
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, 128, 64);
      ctx.strokeStyle = '#3f3f46';
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, 126, 62);

      // Top Header
      ctx.fillStyle = '#18181b';
      ctx.fillRect(3, 3, 122, 14);
      ctx.fillStyle = '#facc15';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('LONGINES LIVE', 64, 13);

      // Flags & Player Codes
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(10, 22, 14, 10);
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('IND', 28, 31);

      ctx.fillStyle = '#f43f5e';
      ctx.fillRect(72, 22, 14, 10);
      ctx.fillStyle = '#f8fafc';
      ctx.fillText('RIV', 90, 31);

      // Digital Score Readout
      ctx.fillStyle = '#4ade80';
      ctx.font = 'bold 20px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(\`\${p0Score} - \${p1Score}\`, 64, 54);
    });
  }

  /**
   * 6 distinct GBA Crowd NPCs
   */
  public static createCrowdNpcPresets(): CrowdNpcSpriteSet[] {
    const outfits = [
      { hair: '#3b2314', shirt: '#22c55e', skin: '#ffdbb5', pants: '#1e3a8a' },
      { hair: '#f97316', shirt: '#facc15', skin: '#ffedd5', pants: '#0284c7' },
      { hair: '#e11d48', shirt: '#3b82f6', skin: '#ffdbb5', pants: '#334155' },
      { hair: '#eab308', shirt: '#a855f7', skin: '#fef3c7', pants: '#1e293b' },
      { hair: '#06b6d4', shirt: '#ec4899', skin: '#ffdbb5', pants: '#0f172a' },
      { hair: '#18181b', shirt: '#f97316', skin: '#e0a97b', pants: '#1e293b' }
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

  public static createPixelNetTexture(): THREE.CanvasTexture {
    const tex = this.makePixelTexture(64, 16, (ctx) => {
      ctx.clearRect(0, 0, 64, 16);
      ctx.fillStyle = '#14141f';
      ctx.fillRect(0, 0, 64, 3);
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 1, 64, 2);

      // Fine dark-maroon/cord nylon mesh with white Yonex side-tape look
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
  // 2. CourtBounds.ts (Full Commonwealth Games / BWF Broadcast Stadium)
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
  private scoreboardMat!: THREE.MeshBasicMaterial;

  constructor() {
    this.buildCourtMesh();
    this.buildArenaWallsAndSponsors();
    this.buildUmpireHighChairAndPc();
    this.buildServiceJudgeAndLineJudges();
  }

  public updateCourtsideScoreboard(p0: number, p1: number): void {
    if (this.scoreboardMat) {
      this.scoreboardMat.map = GbaSpriteFactory.createScoreboardTexture(p0, p1);
      this.scoreboardMat.needsUpdate = true;
    }
  }

  private buildCourtMesh(): void {
    // 1. Vibrant Hot-Pink / Magenta Outer Arena Carpet (Replaces black floor!)
    const arenaGeo = new THREE.PlaneGeometry(46, 36);
    const arenaMat = new THREE.MeshBasicMaterial({ color: 0xe11d74 });
    const arenaFloor = new THREE.Mesh(arenaGeo, arenaMat);
    arenaFloor.rotation.x = -Math.PI / 2;
    arenaFloor.position.y = -0.02;
    this.group.add(arenaFloor);

    // 2. BWF Tournament Green Mat with Neon-Green Trim & YONEX / SMASH 2026 Floor Logos
    const matTex = GbaSpriteFactory.createTournamentCourtMatTexture();
    const matGeo = new THREE.PlaneGeometry(COURT.DOUBLES_WIDTH + 1.5, COURT.LENGTH + 1.9);
    const matMaterial = new THREE.MeshBasicMaterial({ map: matTex });
    const courtMat = new THREE.Mesh(matGeo, matMaterial);
    courtMat.rotation.x = -Math.PI / 2;
    courtMat.position.y = 0.001;
    this.group.add(courtMat);

    // 3. Crisp White Regulation Court Lines
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc });
    const addLine = (w: number, l: number, x: number, z: number) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, l), lineMat);
      m.rotation.x = -Math.PI / 2;
      m.position.set(x, 0.006, z);
      this.group.add(m);
    };

    const lw = 0.055;
    addLine(lw, COURT.LENGTH, -COURT.HALF_WIDTH, 0);
    addLine(lw, COURT.LENGTH, COURT.HALF_WIDTH, 0);
    addLine(lw, COURT.LENGTH, -COURT.DOUBLES_WIDTH / 2, 0);
    addLine(lw, COURT.LENGTH, COURT.DOUBLES_WIDTH / 2, 0);

    addLine(COURT.DOUBLES_WIDTH, lw, 0, -COURT.HALF_LENGTH);
    addLine(COURT.DOUBLES_WIDTH, lw, 0, COURT.HALF_LENGTH);
    addLine(COURT.DOUBLES_WIDTH, lw, 0, -COURT.SHORT_SERVICE_LINE);
    addLine(COURT.DOUBLES_WIDTH, lw, 0, COURT.SHORT_SERVICE_LINE);

    // Long service line for doubles (authentic BWF court detail)
    addLine(COURT.DOUBLES_WIDTH, lw, 0, -(COURT.HALF_LENGTH - 0.76));
    addLine(COURT.DOUBLES_WIDTH, lw, 0, COURT.HALF_LENGTH - 0.76);

    const centerLen = COURT.HALF_LENGTH - COURT.SHORT_SERVICE_LINE;
    addLine(lw, centerLen, 0, -(COURT.SHORT_SERVICE_LINE + centerLen / 2));
    addLine(lw, centerLen, 0, COURT.SHORT_SERVICE_LINE + centerLen / 2);

    // 4. Orange Net Posts + Orange Triangular YONEX Base Weights
    const postGeo = new THREE.BoxGeometry(0.08, COURT.NET_HEIGHT, 0.08);
    const orangeMat = new THREE.MeshBasicMaterial({ color: 0xf97316 });
    const darkBorderMat = new THREE.MeshBasicMaterial({ color: 0x18181b });

    [-COURT.DOUBLES_WIDTH / 2, COURT.DOUBLES_WIDTH / 2].forEach((x) => {
      const dir = Math.sign(x);
      const post = new THREE.Mesh(postGeo, orangeMat);
      post.position.set(x, COURT.NET_HEIGHT / 2, 0);
      this.group.add(post);

      // Iconic Orange YONEX Post Base Weight Box extending outward
      const baseWeight = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.24, 0.32), orangeMat);
      baseWeight.position.set(x + dir * 0.32, 0.12, 0);
      this.group.add(baseWeight);

      const baseTrim = new THREE.Mesh(new THREE.BoxGeometry(0.67, 0.04, 0.34), darkBorderMat);
      baseTrim.position.set(x + dir * 0.32, 0.02, 0);
      this.group.add(baseTrim);
    });

    // 5. Crisp GBA Pixel Net
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

  /**
   * Builds the Magenta Stadium Perimeter Barrier Walls, Yellow A-Frame Sponsor Toblerones,
   * and the Live Digital LED Scoreboard on the back-right of the court.
   */
  private buildArenaWallsAndSponsors(): void {
    const wallMat = new THREE.MeshBasicMaterial({ color: 0xd61f69 });
    const wallTrimMat = new THREE.MeshBasicMaterial({ color: 0xf472b6 });

    // Back Magenta Barrier Wall (separating court floor from elevated grandstand)
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(36, 2.2, 0.3), wallMat);
    backWall.position.set(0, 1.1, -9.8);
    this.group.add(backWall);

    const topTrim = new THREE.Mesh(new THREE.BoxGeometry(36, 0.08, 0.34), wallTrimMat);
    topTrim.position.set(0, 2.2, -9.8);
    this.group.add(topTrim);

    // Left & Right Side Magenta Barrier Walls
    [-12.5, 12.5].forEach((x) => {
      const sideWall = new THREE.Mesh(new THREE.BoxGeometry(0.3, 2.2, 24), wallMat);
      sideWall.position.set(x, 1.1, -1.0);
      this.group.add(sideWall);
    });

    // Yellow Angled A-Frame Sponsor Toblerones along the back & sides
    const makeToblerone = (text: string, x: number, z: number, rotY = 0) => {
      const bannerTex = GbaSpriteFactory.createSponsorBannerTexture(text);
      const group = new THREE.Group();

      const body = new THREE.Mesh(
        new THREE.BoxGeometry(2.5, 0.62, 0.45),
        new THREE.MeshBasicMaterial({ color: 0xfacc15 })
      );
      body.position.y = 0.31;

      const face = new THREE.Mesh(
        new THREE.PlaneGeometry(2.45, 0.58),
        new THREE.MeshBasicMaterial({ map: bannerTex })
      );
      face.position.set(0, 0.31, 0.23);

      group.add(body, face);
      group.position.set(x, 0, z);
      group.rotation.y = rotY;
      this.group.add(group);
    };

    // Back sponsor boards (LONGINES & e.on like the reference photo)
    makeToblerone('LONGINES', -2.1, -8.3, 0);
    makeToblerone('e.on  YONEX', 2.1, -8.3, 0);

    // Left & Right angled perimeter sponsor boards
    makeToblerone('SMASH 2026', -6.8, -3.5, Math.PI / 2.3);
    makeToblerone('YONEX', -6.8, 2.8, Math.PI / 2.3);
    makeToblerone('SMASH 2026', 6.8, -3.5, -Math.PI / 2.3);
    makeToblerone('LONGINES', 6.8, 2.8, -Math.PI / 2.3);

    // Courtside Digital LED Scoreboard on Back-Right (IND vs RIV)
    this.scoreboardMat = new THREE.MeshBasicMaterial({
      map: GbaSpriteFactory.createScoreboardTexture(0, 0)
    });
    const boardStand = new THREE.Mesh(
      new THREE.BoxGeometry(1.75, 0.92, 0.18),
      new THREE.MeshBasicMaterial({ color: 0x09090b })
    );
    boardStand.position.set(4.8, 0.48, -7.8);
    boardStand.rotation.y = -0.22;

    const boardScreen = new THREE.Mesh(new THREE.PlaneGeometry(1.68, 0.84), this.scoreboardMat);
    boardScreen.position.set(0, 0, 0.1);
    boardStand.add(boardScreen);
    this.group.add(boardStand);
  }

  /**
   * RIGHT SIDE OF NET (+X): Tall Black Umpire High-Chair, Seated GBA Umpire Sprite,
   * Open Laptop/PC Terminal on Armrest Desk, and Yellow Equipment Bin.
   */
  private buildUmpireHighChairAndPc(): void {
    const chairGroup = new THREE.Group();
    chairGroup.position.set(4.45, 0, 0);

    const blackMetal = new THREE.MeshBasicMaterial({ color: 0x18181b });
    const seatMat = new THREE.MeshBasicMaterial({ color: 0x27272a });

    // 4 Tall A-Frame Ladder Legs
    const legCoords = [
      [-0.35, -0.35],
      [0.35, -0.35],
      [-0.35, 0.35],
      [0.35, 0.35]
    ];
    legCoords.forEach(([lx, lz]) => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.07, 1.85, 0.07), blackMetal);
      leg.position.set(lx, 0.92, lz);
      chairGroup.add(leg);
    });

    // Horizontal Ladder Steps leading up to the high seat
    for (let s = 1; s <= 4; s++) {
      const step = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.05, 0.72), blackMetal);
      step.position.set(-0.35, s * 0.36, 0);
      chairGroup.add(step);
    }

    // High-Chair Seat Platform & Backrest
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.08, 0.75), seatMat);
    seat.position.set(0, 1.65, 0);
    const backrest = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.65, 0.75), seatMat);
    backrest.position.set(0.35, 1.98, 0);
    chairGroup.add(seat, backrest);

    // Desk Tray & Open PC / Laptop in front of the Umpire!
    const deskTray = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.05, 0.78), blackMetal);
    deskTray.position.set(-0.42, 1.95, 0);
    chairGroup.add(deskTray);

    // PC Keyboard Base
    const pcBase = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 0.03, 0.38),
      new THREE.MeshBasicMaterial({ color: 0x334155 })
    );
    pcBase.position.set(-0.42, 1.99, 0);
    chairGroup.add(pcBase);

    // Raised Laptop / PC Monitor Screen with Glowing Cyan Score Interface
    const pcMonitor = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.28, 0.38),
      new THREE.MeshBasicMaterial({ color: 0x0f172a })
    );
    pcMonitor.position.set(-0.54, 2.12, 0);
    pcMonitor.rotation.z = -0.25;

    const pcGlowScreen = new THREE.Mesh(
      new THREE.PlaneGeometry(0.24, 0.32),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide })
    );
    pcGlowScreen.rotation.y = Math.PI / 2;
    pcGlowScreen.position.set(0.025, 0, 0);
    pcMonitor.add(pcGlowScreen);
    chairGroup.add(pcMonitor);

    // GBA Pixel-Art Umpire Sprite Sitting on the High Chair!
    const umpireTex = GbaSpriteFactory.createUmpireSprite();
    const umpireSprite = new THREE.Mesh(
      new THREE.PlaneGeometry(1.15, 1.15),
      new THREE.MeshBasicMaterial({
        map: umpireTex,
        transparent: true,
        alphaTest: 0.1,
        side: THREE.DoubleSide
      })
    );
    umpireSprite.position.set(0.02, 2.15, 0.05);
    umpireSprite.rotation.x = -0.15;
    chairGroup.add(umpireSprite);

    // Yellow Courtside Gear Box next to the Umpire Chair (like photo)
    const yellowBox = new THREE.Mesh(
      new THREE.BoxGeometry(0.85, 0.65, 1.35),
      new THREE.MeshBasicMaterial({ color: 0xfacc15 })
    );
    yellowBox.position.set(1.25, 0.325, 0.9);
    chairGroup.add(yellowBox);

    this.group.add(chairGroup);
  }

  /**
   * LEFT SIDE OF NET (-X) & BASELINES: Service Judge behind Orange Desk,
   * Shuttlecock Dispenser Tubes, and Seated Line Judges in Light-Blue Shirts.
   */
  private buildServiceJudgeAndLineJudges(): void {
    const officialTex = GbaSpriteFactory.createOfficialSprite();

    const createSeatedOfficial = (x: number, z: number, rotY = 0) => {
      const g = new THREE.Group();
      // Folding Chair
      const chair = new THREE.Mesh(
        new THREE.BoxGeometry(0.48, 0.45, 0.48),
        new THREE.MeshBasicMaterial({ color: 0x1e293b })
      );
      chair.position.y = 0.225;

      // GBA Official Sprite
      const sprite = new THREE.Mesh(
        new THREE.PlaneGeometry(0.95, 1.05),
        new THREE.MeshBasicMaterial({
          map: officialTex,
          transparent: true,
          alphaTest: 0.1,
          side: THREE.DoubleSide
        })
      );
      sprite.position.set(0, 0.72, 0);
      sprite.rotation.y = rotY;
      sprite.rotation.x = -0.15;

      g.add(chair, sprite);
      g.position.set(x, 0, z);
      this.group.add(g);
    };

    // 1. Left-Side Service Judge + Orange Box + Shuttlecock Dispenser Stand
    createSeatedOfficial(-4.55, 0.35, 0.25);

    const orangeDesk = new THREE.Mesh(
      new THREE.BoxGeometry(0.82, 0.62, 0.95),
      new THREE.MeshBasicMaterial({ color: 0xf97316 })
    );
    orangeDesk.position.set(-4.35, 0.31, 1.15);
    this.group.add(orangeDesk);

    // Shuttlecock Tube Dispenser Poles (left of net)
    [-0.18, 0.18].forEach((zOff) => {
      const pole = new THREE.Mesh(
        new THREE.BoxGeometry(0.05, 1.15, 0.05),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
      );
      pole.position.set(-3.85, 0.575, zOff);
      this.group.add(pole);
    });

    // 2. Back & Side Line Judges (just like the two blue-shirted line judges at the back in photo)
    createSeatedOfficial(-2.8, -8.8, 0);
    createSeatedOfficial(2.8, -8.8, 0);
    createSeatedOfficial(-6.2, -1.8, 0.35);
    createSeatedOfficial(5.8, -0.4, -0.35);
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
  // 3. CrowdManager.ts (Elevated Concrete Grandstand Behind the Magenta Wall)
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

    const concreteMat = new THREE.MeshBasicMaterial({ color: 0x27272a });
    const stepMat = new THREE.MeshBasicMaterial({ color: 0x3f3f46 });
    const railMat = new THREE.MeshBasicMaterial({ color: 0x71717a });

    // 1. Main Back Broadcast Grandstand (Behind the Magenta Wall at z = -10.2 to -14.8)
    for (let row = 0; row < 6; row++) {
      const y = 2.2 + row * 0.55;
      const z = -10.3 - row * 0.72;

      const tier = new THREE.Mesh(new THREE.BoxGeometry(28, 0.55, 0.75), concreteMat);
      tier.position.set(0, y - 0.25, z);
      scene.add(tier);

      // Grey Concrete Stairway Aisles (left & right aisles like the reference photo!)
      [-6.5, 6.5].forEach((aisleX) => {
        const stair = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.57, 0.77), stepMat);
        stair.position.set(aisleX, y - 0.24, z);
        scene.add(stair);
      });
    }

    // Grandstand Handrails around the entrance tunnels
    [-6.5, 6.5].forEach((aisleX) => {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.45, 0.06), railMat);
      rail.position.set(aisleX, 2.55, -10.0);
      scene.add(rail);
    });

    // 2. Populate the Back Grandstand with GBA Spectators Facing the Court!
    const specGeo = new THREE.PlaneGeometry(0.76, 0.92);
    let idx = 0;

    for (let row = 0; row < 6; row++) {
      const baseY = 2.58 + row * 0.55;
      const z = -10.25 - row * 0.72;

      for (let col = -18; col <= 18; col++) {
        const x = col * 0.68;
        // Leave concrete stairway aisles clear
        if (Math.abs(x - -6.5) < 0.75 || Math.abs(x - 6.5) < 0.75) continue;

        const preset = presets[idx % presets.length];
        const mat = new THREE.MeshBasicMaterial({
          map: preset.calm,
          transparent: true,
          alphaTest: 0.1,
          side: THREE.DoubleSide
        });

        const mesh = new THREE.Mesh(specGeo, mat);
        mesh.position.set(x + (Math.random() - 0.5) * 0.1, baseY, z);
        mesh.rotation.x = -0.15;

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
  // 4. CameraRig.ts (Broadcast TV Framing showing Umpire, Pink Floor, & Grandstand)
  // =========================================================================
  'core/CameraRig.ts': `import * as THREE from 'three';

export type CameraMode = 'BROADCAST_END' | 'SIDE_TV';

export class CameraRig {
  public camera: THREE.PerspectiveCamera;
  public mode: CameraMode = 'BROADCAST_END';
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
    } else {
      this.basePos.set(13.5, 5.4, 0);
      this.lookTarget.set(0, 1.0, 0);
    }
  }

  public triggerSmashShake(intensity = 0.32): void {
    this.shakeIntensity = intensity;
  }

  public update(dt: number, playerX: number, shuttlePos: THREE.Vector3): void {
    const targetPos = this.basePos.clone();
    if (this.mode === 'BROADCAST_END') {
      targetPos.x = playerX * 0.22;
    } else {
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
`,

  // =========================================================================
  // 5. main.ts (Updates 3D Courtside LED Scoreboard on Every Point)
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

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const scene = new THREE.Scene();
// Deep upper-arena rafters backdrop above the grandstand
scene.background = new THREE.Color(0x090a10);

const cameraRig = new CameraRig(window.innerWidth / window.innerHeight);

const ambient = new THREE.AmbientLight(0xffffff, 1.35);
const dirLight = new THREE.DirectionalLight(0xffffff, 0.85);
dirLight.position.set(4, 14, 6);
scene.add(ambient, dirLight);

// --- Core Entities ---
const court = new CourtBounds();
scene.add(court.group);

const crowd = new CrowdManager(scene);
const sound = new SoundDirector();
const shuttle = new Shuttlecock(scene);
const input = new InputManager();
const reconciler = new Reconciler();

const p0 = new Player(0, 0x1d4ed8, scene);
const p1 = new Player(1, 0x2563eb, scene);

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
    court.updateCourtsideScoreboard(0, 0);
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
    court.updateCourtsideScoreboard(scores[0], scores[1]);
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
    court.updateCourtsideScoreboard(scores[0], scores[1]);
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

console.log('\\n[DONE] Commonwealth Games / BWF GBA Broadcast Stadium applied! Check your browser.');