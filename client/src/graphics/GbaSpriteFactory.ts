import * as THREE from 'three';
import {
  DEFAULT_P1_CUSTOM,
  DEFAULT_P2_CUSTOM,
  PlayerCustomization
} from '../types/Customization.js';

export interface PlayerSpriteSet {
  idle: THREE.CanvasTexture;
  run1: THREE.CanvasTexture;
  run2: THREE.CanvasTexture;
  jump: THREE.CanvasTexture;
  swing: THREE.CanvasTexture;
  trophy: THREE.CanvasTexture;
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

  private static px(
    ctx: CanvasRenderingContext2D,
    color: string,
    x: number,
    y: number,
    w = 1,
    h = 1
  ): void {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }

  private static drawGbaHead(
    ctx: CanvasRenderingContext2D,
    cx: number,
    topY: number,
    opts: {
      skin: string;
      skinShadow: string;
      hairColor: string;
      hairHighlight: string;
      hatColor?: string;
      hatTrim?: string;
      hatStyle:
        | 'CAP'
        | 'VISOR_GOGGLES'
        | 'SAFARI'
        | 'BEANIE'
        | 'HEADBAND'
        | 'SPIKY'
        | 'PONYTAIL'
        | 'BALD';
      eyeColor?: string;
      glasses?: 'NONE' | 'ROUND' | 'SHADES';
      beard?: boolean;
      cheeringMouth?: boolean;
    }
  ): void {
    const K = '#14121d';
    const W = '#ffffff';
    const eye = opts.eyeColor || '#1e293b';

    if (opts.hatStyle === 'PONYTAIL') {
      this.px(ctx, K, cx + 6, topY + 3, 5, 7);
      this.px(ctx, opts.hairColor, cx + 7, topY + 4, 3, 5);
    }

    this.px(ctx, K, cx - 6, topY + 4, 12, 11);
    this.px(ctx, K, cx - 8, topY + 7, 16, 5);
    this.px(ctx, opts.skinShadow, cx - 7, topY + 8, 2, 3);
    this.px(ctx, opts.skinShadow, cx + 5, topY + 8, 2, 3);

    this.px(ctx, opts.skin, cx - 5, topY + 5, 10, 9);
    this.px(ctx, opts.skinShadow, cx - 5, topY + 12, 10, 2);
    this.px(ctx, '#f4978e', cx - 5, topY + 10, 2, 1);
    this.px(ctx, '#f4978e', cx + 3, topY + 10, 2, 1);

    if (opts.glasses === 'SHADES') {
      this.px(ctx, K, cx - 5, topY + 7, 10, 1);
      this.px(ctx, '#090d16', cx - 4, topY + 8, 4, 2);
      this.px(ctx, '#090d16', cx + 1, topY + 8, 4, 2);
      this.px(ctx, '#38bdf8', cx - 3, topY + 8, 1, 1);
      this.px(ctx, '#38bdf8', cx + 2, topY + 8, 1, 1);
    } else {
      this.px(ctx, K, cx - 4, topY + 6, 3, 1);
      this.px(ctx, K, cx + 1, topY + 6, 3, 1);

      this.px(ctx, W, cx - 4, topY + 7, 3, 3);
      this.px(ctx, eye, cx - 3, topY + 7, 2, 3);
      this.px(ctx, W, cx - 3, topY + 7, 1, 1);

      this.px(ctx, W, cx + 1, topY + 7, 3, 3);
      this.px(ctx, eye, cx + 1, topY + 7, 2, 3);
      this.px(ctx, W, cx + 1, topY + 7, 1, 1);

      if (opts.glasses === 'ROUND') {
        this.px(ctx, '#f59e0b', cx - 5, topY + 7, 1, 3);
        this.px(ctx, '#f59e0b', cx, topY + 8, 1, 1);
        this.px(ctx, '#f59e0b', cx + 4, topY + 7, 1, 3);
      }
    }

    if (opts.beard) {
      this.px(ctx, opts.hairColor, cx - 5, topY + 11, 10, 3);
      this.px(ctx, K, cx - 5, topY + 14, 10, 1);
      this.px(ctx, '#f8fafc', cx - 1, topY + 12, 2, 1);
    } else if (opts.cheeringMouth) {
      this.px(ctx, '#991b1b', cx - 2, topY + 11, 4, 2);
      this.px(ctx, '#fb7185', cx - 1, topY + 12, 2, 1);
    } else {
      this.px(ctx, opts.skinShadow, cx, topY + 10, 1, 1);
      this.px(ctx, '#7c2d12', cx - 1, topY + 12, 3, 1);
    }

    const hat = opts.hatColor || '#ef4444';
    const trim = opts.hatTrim || '#f8fafc';

    if (opts.hatStyle === 'VISOR_GOGGLES' || opts.hatStyle === 'CAP') {
      this.px(ctx, K, cx - 6, topY + 5, 2, 3);
      this.px(ctx, K, cx + 4, topY + 5, 2, 3);
      this.px(ctx, K, cx - 6, topY, 12, 5);
      this.px(ctx, hat, cx - 5, topY + 1, 10, 4);
      this.px(ctx, trim, cx - 4, topY + 1, 8, 1);
      this.px(ctx, K, cx - 7, topY + 4, 14, 2);
      if (opts.hatStyle === 'VISOR_GOGGLES') {
        this.px(ctx, '#38bdf8', cx - 4, topY + 3, 3, 2);
        this.px(ctx, '#38bdf8', cx + 1, topY + 3, 3, 2);
        this.px(ctx, W, cx - 3, topY + 3, 1, 1);
        this.px(ctx, W, cx + 2, topY + 3, 1, 1);
      } else {
        this.px(ctx, trim, cx - 2, topY + 3, 4, 2);
      }
    } else if (opts.hatStyle === 'SAFARI') {
      this.px(ctx, K, cx - 6, topY, 12, 4);
      this.px(ctx, '#d97706', cx - 5, topY + 1, 10, 3);
      this.px(ctx, '#78350f', cx - 5, topY + 3, 10, 1);
      this.px(ctx, K, cx - 9, topY + 4, 18, 2);
      this.px(ctx, '#f59e0b', cx - 8, topY + 4, 16, 1);
    } else if (opts.hatStyle === 'HEADBAND') {
      this.px(ctx, K, cx - 7, topY - 1, 14, 6);
      this.px(ctx, opts.hairColor, cx - 6, topY, 12, 4);
      this.px(ctx, opts.hairHighlight, cx - 4, topY, 6, 2);
      this.px(ctx, K, cx - 6, topY + 4, 12, 2);
      this.px(ctx, hat, cx - 5, topY + 4, 10, 2);
      this.px(ctx, trim, cx - 2, topY + 4, 4, 1);
    } else if (opts.hatStyle === 'BEANIE') {
      this.px(ctx, K, cx - 2, topY - 2, 4, 2);
      this.px(ctx, W, cx - 1, topY - 1, 2, 1);
      this.px(ctx, K, cx - 6, topY, 12, 6);
      this.px(ctx, hat, cx - 5, topY + 1, 10, 3);
      this.px(ctx, trim, cx - 5, topY + 4, 10, 2);
    } else if (opts.hatStyle === 'BALD') {
      this.px(ctx, K, cx - 5, topY + 2, 10, 2);
      this.px(ctx, opts.skin, cx - 5, topY + 3, 10, 2);
      this.px(ctx, W, cx - 3, topY + 3, 2, 1);
    } else {
      this.px(ctx, K, cx - 7, topY, 14, 6);
      this.px(ctx, opts.hairColor, cx - 6, topY + 1, 12, 4);
      this.px(ctx, opts.hairHighlight, cx - 4, topY + 1, 7, 2);
      this.px(ctx, opts.hairColor, cx - 5, topY + 5, 2, 1);
      this.px(ctx, opts.hairColor, cx, topY + 5, 2, 1);
      this.px(ctx, opts.hairColor, cx + 3, topY + 5, 2, 1);
    }
  }

  /**
   * 6-Frame Customizable GBA Player Sprites (Including Golden Trophy Hoist Pose!)
   */
  public static createPlayerSprites(
    isPlayerOne: boolean,
    custom?: PlayerCustomization
  ): PlayerSpriteSet {
    const cfg = custom || (isPlayerOne ? DEFAULT_P1_CUSTOM : DEFAULT_P2_CUSTOM);
    const K = '#14121d';
    const skin = cfg.skinColor;
    const skinSh = cfg.skinShadow;
    const jersey = cfg.jerseyColor;
    const jerseySh = cfg.jerseyShadow;
    const stripe = cfg.stripeColor;
    const shorts = '#0f172a';
    const shoe = cfg.racketColor;

    const buildPose = (
      pose: 'IDLE' | 'RUN1' | 'RUN2' | 'JUMP' | 'SWING' | 'TROPHY'
    ): THREE.CanvasTexture =>
      this.makePixelTexture(48, 56, (ctx) => {
        const cx = 24;
        const headY =
          pose === 'TROPHY' ? 14 : pose === 'JUMP' ? 5 : pose === 'RUN1' || pose === 'RUN2' ? 7 : 8;

        // 0. If TROPHY Pose, Draw Gleaming Golden BWF Championship Cup Overhead!
        if (pose === 'TROPHY') {
          // Trophy Base & Stem
          this.px(ctx, K, cx - 4, 10, 8, 4);
          this.px(ctx, '#b45309', cx - 3, 11, 6, 2);
          // Golden Cup Bowl
          this.px(ctx, K, cx - 7, 1, 14, 10);
          this.px(ctx, '#facc15', cx - 6, 2, 12, 8);
          this.px(ctx, '#fef08a', cx - 4, 2, 3, 6); // Cup shine highlight
          this.px(ctx, '#f59e0b', cx + 2, 3, 3, 6);
          // Side Handles
          this.px(ctx, K, cx - 10, 3, 3, 6);
          this.px(ctx, '#facc15', cx - 9, 4, 2, 4);
          this.px(ctx, K, cx + 7, 3, 3, 6);
          this.px(ctx, '#facc15', cx + 7, 4, 2, 4);
        }

        this.drawGbaHead(ctx, cx, headY, {
          skin,
          skinShadow: skinSh,
          hairColor: isPlayerOne ? '#1e293b' : '#451a03',
          hairHighlight: isPlayerOne ? '#475569' : '#78350f',
          hatColor: cfg.hatColor,
          hatTrim: '#ffffff',
          hatStyle: cfg.hatStyle,
          eyeColor: '#0f172a',
          cheeringMouth: pose === 'SWING' || pose === 'TROPHY'
        });

        const torsoY = headY + 15;
        this.px(ctx, K, cx - 6, torsoY, 12, 13);
        this.px(ctx, jersey, cx - 5, torsoY + 1, 10, 11);
        this.px(ctx, jerseySh, cx - 5, torsoY + 8, 10, 4);
        this.px(ctx, '#ffffff', cx - 3, torsoY + 1, 6, 2);
        this.px(ctx, stripe, cx - 5, torsoY + 4, 10, 2);

        if (pose === 'TROPHY') {
          // Both Arms Raised High Holding the Golden Trophy!
          this.px(ctx, K, cx - 10, headY + 2, 4, 15);
          this.px(ctx, skin, cx - 9, headY + 3, 2, 10);
          this.px(ctx, jersey, cx - 9, headY + 12, 2, 4);

          this.px(ctx, K, cx + 6, headY + 2, 4, 15);
          this.px(ctx, skin, cx + 7, headY + 3, 2, 10);
          this.px(ctx, jersey, cx + 7, headY + 12, 2, 4);
        } else if (pose === 'SWING') {
          this.px(ctx, K, cx - 10, torsoY + 1, 4, 8);
          this.px(ctx, skin, cx - 9, torsoY + 2, 2, 6);
          this.px(ctx, '#ffffff', cx - 9, torsoY + 6, 2, 1);

          this.px(ctx, K, cx + 6, torsoY - 6, 4, 10);
          this.px(ctx, skin, cx + 7, torsoY - 5, 2, 8);
          this.px(ctx, '#ffffff', cx + 7, torsoY - 3, 2, 2);
        } else {
          this.px(ctx, K, cx - 9, torsoY + 1, 4, 10);
          this.px(ctx, jersey, cx - 8, torsoY + 2, 2, 3);
          this.px(ctx, skin, cx - 8, torsoY + 5, 2, 5);
          this.px(ctx, '#ffffff', cx - 8, torsoY + 7, 2, 1);

          this.px(ctx, K, cx + 5, torsoY + 1, 4, 10);
          this.px(ctx, jersey, cx + 6, torsoY + 2, 2, 3);
          this.px(ctx, skin, cx + 6, torsoY + 5, 2, 5);
          this.px(ctx, '#ffffff', cx + 6, torsoY + 7, 2, 1);
        }

        const legY = torsoY + 12;
        this.px(ctx, K, cx - 6, legY, 12, 6);
        this.px(ctx, shorts, cx - 5, legY + 1, 10, 4);
        this.px(ctx, '#ffffff', cx - 5, legY + 2, 1, 3);
        this.px(ctx, '#ffffff', cx + 4, legY + 2, 1, 3);

        const lOffset = pose === 'RUN1' ? -2 : pose === 'RUN2' ? 1 : 0;
        const rOffset = pose === 'RUN1' ? 2 : pose === 'RUN2' ? -1 : 0;
        const tuck = pose === 'JUMP' ? -2 : 0;

        this.px(ctx, K, cx - 5 + lOffset, legY + 6 + tuck, 4, 8);
        this.px(ctx, skin, cx - 4 + lOffset, legY + 6 + tuck, 2, 3);
        this.px(ctx, '#ffffff', cx - 4 + lOffset, legY + 9 + tuck, 2, 2);
        this.px(ctx, shoe, cx - 5 + lOffset, legY + 11 + tuck, 4, 2);

        this.px(ctx, K, cx + 1 + rOffset, legY + 6 + tuck, 4, 8);
        this.px(ctx, skin, cx + 2 + rOffset, legY + 6 + tuck, 2, 3);
        this.px(ctx, '#ffffff', cx + 2 + rOffset, legY + 9 + tuck, 2, 2);
        this.px(ctx, shoe, cx + 1 + rOffset, legY + 11 + tuck, 4, 2);

        if (pose !== 'TROPHY') {
          const rx = cx + 9;
          const ry = pose === 'SWING' ? headY - 3 : torsoY - 4;
          this.px(ctx, K, rx - 1, ry + 11, 3, 6);
          this.px(ctx, '#facc15', rx, ry + 12, 1, 4);
          this.px(ctx, '#94a3b8', rx, ry + 9, 1, 3);

          this.px(ctx, K, rx - 4, ry, 9, 10);
          this.px(ctx, cfg.racketColor, rx - 3, ry + 1, 7, 8);
          this.px(ctx, '#14121d', rx - 2, ry + 2, 5, 6);
          for (let sy = ry + 2; sy < ry + 8; sy++) {
            for (let sx = rx - 2; sx < rx + 3; sx++) {
              if ((sx + sy) % 2 === 0) this.px(ctx, '#e2e8f0', sx, sy, 1, 1);
            }
          }
        }
      });

    return {
      idle: buildPose('IDLE'),
      run1: buildPose('RUN1'),
      run2: buildPose('RUN2'),
      jump: buildPose('JUMP'),
      swing: buildPose('SWING'),
      trophy: buildPose('TROPHY')
    };
  }

  public static createCrowdNpcPresets(): CrowdNpcSpriteSet[] {
    const configs = [
      { hat: 'CAP' as const, hatCol: '#ef4444', hair: '#1e293b', shirt: '#22c55e', scarf: '#facc15', glasses: 'NONE' as const, beard: false },
      { hat: 'SAFARI' as const, hatCol: '#d97706', hair: '#451a03', shirt: '#f97316', scarf: '', glasses: 'NONE' as const, beard: true },
      { hat: 'PONYTAIL' as const, hatCol: '#f43f5e', hair: '#ea580c', shirt: '#fde047', scarf: '#38bdf8', glasses: 'ROUND' as const, beard: false },
      { hat: 'VISOR_GOGGLES' as const, hatCol: '#dc2626', hair: '#0f172a', shirt: '#3b82f6', scarf: '', glasses: 'NONE' as const, beard: false },
      { hat: 'BEANIE' as const, hatCol: '#a855f7', hair: '#eab308', shirt: '#ec4899', scarf: '#ffffff', glasses: 'NONE' as const, beard: false },
      { hat: 'SPIKY' as const, hatCol: '', hair: '#06b6d4', shirt: '#10b981', scarf: '', glasses: 'SHADES' as const, beard: false },
      { hat: 'HEADBAND' as const, hatCol: '#facc15', hair: '#3b2314', shirt: '#ef4444', scarf: '#fef08a', glasses: 'NONE' as const, beard: true },
      { hat: 'CAP' as const, hatCol: '#3b82f6', hair: '#78350f', shirt: '#f8fafc', scarf: '#ef4444', glasses: 'ROUND' as const, beard: false },
      { hat: 'PONYTAIL' as const, hatCol: '', hair: '#1e1b4b', shirt: '#8b5cf6', scarf: '', glasses: 'NONE' as const, beard: false },
      { hat: 'BEANIE' as const, hatCol: '#14b8a6', hair: '#451a03', shirt: '#f59e0b', scarf: '#1e293b', glasses: 'SHADES' as const, beard: true },
      { hat: 'SPIKY' as const, hatCol: '', hair: '#facc15', shirt: '#2563eb', scarf: '#f97316', glasses: 'NONE' as const, beard: false },
      { hat: 'BALD' as const, hatCol: '', hair: '#1c1917', shirt: '#84cc16', scarf: '', glasses: 'ROUND' as const, beard: true },
      { hat: 'CAP' as const, hatCol: '#10b981', hair: '#1e293b', shirt: '#f43f5e', scarf: '', glasses: 'NONE' as const, beard: false },
      { hat: 'HEADBAND' as const, hatCol: '#38bdf8', hair: '#0f172a', shirt: '#a855f7', scarf: '#fde047', glasses: 'SHADES' as const, beard: false }
    ];

    const skins = [
      ['#ffdbb5', '#e0a97b'],
      ['#f3c69f', '#cfa17a'],
      ['#d69e72', '#b07b52'],
      ['#8d5524', '#6b3e17']
    ];

    return configs.map((cfg, idx) => {
      const [skin, skinSh] = skins[idx % skins.length];
      const K = '#14121d';

      const buildNpc = (cheering: boolean) =>
        this.makePixelTexture(36, 42, (ctx) => {
          const cx = 18;
          const headY = cheering ? 3 : 5;

          this.drawGbaHead(ctx, cx, headY, {
            skin,
            skinShadow: skinSh,
            hairColor: cfg.hair,
            hairHighlight: '#94a3b8',
            hatColor: cfg.hatCol || '#ef4444',
            hatTrim: '#ffffff',
            hatStyle: cfg.hat,
            glasses: cfg.glasses,
            beard: cfg.beard,
            cheeringMouth: cheering
          });

          const ty = headY + 15;
          this.px(ctx, K, cx - 6, ty, 12, 11);
          this.px(ctx, cfg.shirt, cx - 5, ty + 1, 10, 9);

          if (cfg.scarf) {
            this.px(ctx, K, cx - 6, ty, 12, 4);
            this.px(ctx, cfg.scarf, cx - 5, ty + 1, 10, 2);
            this.px(ctx, '#ffffff', cx - 3, ty + 1, 2, 2);
            this.px(ctx, '#ffffff', cx + 1, ty + 1, 2, 2);
            this.px(ctx, cfg.scarf, cx + 2, ty + 3, 3, 5);
          }

          if (cheering) {
            this.px(ctx, K, cx - 10, ty - 6, 4, 10);
            this.px(ctx, cfg.shirt, cx - 9, ty - 2, 2, 5);
            this.px(ctx, skin, cx - 9, ty - 5, 2, 3);

            this.px(ctx, K, cx + 6, ty - 6, 4, 10);
            this.px(ctx, cfg.shirt, cx + 7, ty - 2, 2, 5);
            this.px(ctx, skin, cx + 7, ty - 5, 2, 3);
          } else {
            this.px(ctx, K, cx - 9, ty + 1, 3, 8);
            this.px(ctx, skin, cx - 8, ty + 5, 2, 3);
            this.px(ctx, K, cx + 6, ty + 1, 3, 8);
            this.px(ctx, skin, cx + 6, ty + 5, 2, 3);
          }

          this.px(ctx, K, cx - 6, ty + 10, 12, 5);
          this.px(ctx, '#1e293b', cx - 5, ty + 11, 4, 4);
          this.px(ctx, '#1e293b', cx + 1, ty + 11, 4, 4);
          this.px(ctx, '#f8fafc', cx - 5, ty + 15, 4, 2);
          this.px(ctx, '#f8fafc', cx + 1, ty + 15, 4, 2);
        });

      return {
        calm: buildNpc(false),
        cheer: buildNpc(true)
      };
    });
  }

  public static createUmpireSprite(): THREE.CanvasTexture {
    return this.makePixelTexture(40, 44, (ctx) => {
      const K = '#14121d';
      this.drawGbaHead(ctx, 20, 4, {
        skin: '#ffdbb5',
        skinShadow: '#e0a97b',
        hairColor: '#3b2314',
        hairHighlight: '#6b4423',
        hatStyle: 'SPIKY',
        glasses: 'ROUND'
      });
      this.px(ctx, K, 13, 19, 14, 11);
      this.px(ctx, '#38bdf8', 14, 20, 12, 9);
      this.px(ctx, '#ffffff', 17, 20, 6, 2);
      this.px(ctx, '#facc15', 22, 23, 2, 2);
      this.px(ctx, K, 8, 22, 6, 4);
      this.px(ctx, '#ffdbb5', 9, 23, 4, 2);
      this.px(ctx, K, 10, 29, 14, 10);
      this.px(ctx, '#334155', 11, 30, 12, 7);
      this.px(ctx, '#0f172a', 9, 37, 6, 3);
    });
  }

  public static createOfficialSprite(): THREE.CanvasTexture {
    return this.makePixelTexture(36, 42, (ctx) => {
      const K = '#14121d';
      this.drawGbaHead(ctx, 18, 3, {
        skin: '#f3c69f',
        skinShadow: '#cfa17a',
        hairColor: '#1e293b',
        hairHighlight: '#475569',
        hatColor: '#f8fafc',
        hatTrim: '#0284c7',
        hatStyle: 'CAP'
      });
      this.px(ctx, K, 11, 18, 14, 11);
      this.px(ctx, '#0ea5e9', 12, 19, 12, 9);
      this.px(ctx, '#ffffff', 15, 19, 6, 2);
      this.px(ctx, '#f3c69f', 10, 25, 2, 3);
      this.px(ctx, '#f3c69f', 24, 25, 2, 3);
      this.px(ctx, K, 12, 29, 12, 9);
      this.px(ctx, '#1e293b', 13, 30, 4, 6);
      this.px(ctx, '#1e293b', 19, 30, 4, 6);
      this.px(ctx, '#f8fafc', 12, 36, 5, 3);
      this.px(ctx, '#f8fafc', 19, 36, 5, 3);
    });
  }

  public static createCameramanSprite(): THREE.CanvasTexture {
    return this.makePixelTexture(48, 48, (ctx) => {
      const K = '#14121d';
      this.drawGbaHead(ctx, 16, 5, {
        skin: '#ffdbb5',
        skinShadow: '#e0a97b',
        hairColor: '#1e293b',
        hairHighlight: '#475569',
        hatColor: '#2563eb',
        hatTrim: '#facc15',
        hatStyle: 'CAP'
      });
      this.px(ctx, '#0f172a', 10, 11, 3, 5);
      this.px(ctx, K, 10, 20, 12, 12);
      this.px(ctx, '#334155', 11, 21, 10, 10);
      this.px(ctx, '#f97316', 14, 21, 4, 8);
      this.px(ctx, K, 11, 32, 10, 12);
      this.px(ctx, '#1e3a8a', 12, 33, 4, 9);
      this.px(ctx, '#1e3a8a', 17, 33, 4, 9);

      this.px(ctx, K, 25, 11, 16, 10);
      this.px(ctx, '#1e293b', 26, 12, 11, 8);
      this.px(ctx, '#090d16', 37, 11, 5, 10);
      this.px(ctx, '#38bdf8', 39, 13, 2, 6);
      this.px(ctx, '#ef4444', 28, 10, 3, 2);
      this.px(ctx, K, 30, 21, 3, 23);
      this.px(ctx, K, 25, 30, 3, 14);
      this.px(ctx, K, 35, 30, 3, 14);
    });
  }

  public static createPhotographerSprite(): THREE.CanvasTexture {
    return this.makePixelTexture(44, 44, (ctx) => {
      const K = '#14121d';
      this.drawGbaHead(ctx, 20, 4, {
        skin: '#eab68c',
        skinShadow: '#c68b59',
        hairColor: '#451a03',
        hairHighlight: '#78350f',
        hatStyle: 'SAFARI',
        beard: true
      });
      this.px(ctx, K, 13, 19, 14, 12);
      this.px(ctx, '#a16207', 14, 20, 12, 10);
      this.px(ctx, '#22c55e', 17, 22, 4, 5);
      this.px(ctx, K, 22, 15, 15, 7);
      this.px(ctx, '#f8fafc', 25, 16, 10, 5);
      this.px(ctx, '#ef4444', 32, 16, 1, 5);
      this.px(ctx, '#38bdf8', 35, 16, 2, 5);
      this.px(ctx, K, 13, 31, 14, 10);
      this.px(ctx, '#1e293b', 14, 32, 12, 7);
    });
  }

  public static createCourtsideStaffSprite(role: 'MOP_KID' | 'STEWARD' | 'COACH'): THREE.CanvasTexture {
    return this.makePixelTexture(42, 46, (ctx) => {
      const K = '#14121d';
      this.drawGbaHead(ctx, 19, 4, {
        skin: '#ffdbb5',
        skinShadow: '#e0a97b',
        hairColor: '#1e293b',
        hairHighlight: '#475569',
        hatColor: role === 'STEWARD' ? '#1e293b' : role === 'MOP_KID' ? '#38bdf8' : '#ef4444',
        hatStyle: role === 'COACH' ? 'HEADBAND' : 'CAP',
        glasses: role === 'STEWARD' ? 'SHADES' : 'NONE'
      });

      const shirt = role === 'STEWARD' ? '#84cc16' : role === 'COACH' ? '#1d4ed8' : '#0284c7';
      this.px(ctx, K, 12, 19, 14, 12);
      this.px(ctx, shirt, 13, 20, 12, 10);

      if (role === 'STEWARD') {
        this.px(ctx, '#f8fafc', 13, 23, 12, 2);
        this.px(ctx, '#f8fafc', 13, 27, 12, 2);
      } else if (role === 'COACH') {
        this.px(ctx, K, 24, 21, 7, 9);
        this.px(ctx, '#f8fafc', 25, 22, 5, 7);
      } else if (role === 'MOP_KID') {
        this.px(ctx, '#cbd5e1', 29, 8, 2, 34);
        this.px(ctx, K, 23, 40, 14, 5);
        this.px(ctx, '#38bdf8', 24, 41, 12, 3);
      }

      this.px(ctx, K, 13, 31, 12, 12);
      this.px(ctx, '#0f172a', 14, 32, 4, 9);
      this.px(ctx, '#0f172a', 20, 32, 4, 9);
      this.px(ctx, '#f8fafc', 13, 41, 5, 2);
      this.px(ctx, '#f8fafc', 20, 41, 5, 2);
    });
  }

  public static createVipSkyboxTexture(): THREE.CanvasTexture {
    return this.makePixelTexture(128, 48, (ctx) => {
      this.px(ctx, '#0f172a', 0, 0, 128, 48);
      this.px(ctx, '#1e3a8a', 4, 4, 120, 40);
      this.px(ctx, '#38bdf8', 6, 6, 116, 4);

      for (let bx = 22; bx <= 98; bx += 36) {
        this.px(ctx, '#0f172a', bx, 20, 10, 10);
        this.px(ctx, '#1e293b', bx - 3, 30, 16, 14);
        this.px(ctx, '#4ade80', bx + 12, 28, 10, 7);
      }

      this.px(ctx, '#0f172a', 42, 0, 3, 48);
      this.px(ctx, '#0f172a', 84, 0, 3, 48);
    });
  }

  public static createTournamentCourtMatTexture(): THREE.CanvasTexture {
    return this.makePixelTexture(256, 512, (ctx) => {
      ctx.fillStyle = '#4ade80';
      ctx.fillRect(0, 0, 256, 512);

      ctx.fillStyle = '#2e8555';
      ctx.fillRect(6, 6, 244, 500);

      ctx.fillStyle = '#29794c';
      for (let y = 8; y < 504; y += 4) {
        for (let x = 8 + (y % 8 === 0 ? 2 : 0); x < 248; x += 4) {
          ctx.fillRect(x, y, 2, 2);
        }
      }

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 15px monospace';
      ctx.textAlign = 'center';

      ctx.fillText('SMASH 2026', 68, 498);
      ctx.beginPath();
      ctx.arc(146, 493, 4, 0, Math.PI * 2);
      ctx.arc(156, 493, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillText('YONEX', 194, 498);

      ctx.fillText('YONEX', 64, 21);
      ctx.fillText('SMASH 2026', 188, 21);
    });
  }

  public static createSponsorBannerTexture(
    text: string,
    bgHex = '#facc15',
    fgHex = '#0f172a'
  ): THREE.CanvasTexture {
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

  public static createScoreboardTexture(
    p0Score = 0,
    p1Score = 0,
    p0Name = 'P1',
    p1Name = 'BOT'
  ): THREE.CanvasTexture {
    return this.makePixelTexture(128, 64, (ctx) => {
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, 128, 64);
      ctx.strokeStyle = '#3f3f46';
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, 126, 62);

      ctx.fillStyle = '#18181b';
      ctx.fillRect(3, 3, 122, 14);
      ctx.fillStyle = '#facc15';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('LONGINES LIVE', 64, 13);

      ctx.fillStyle = '#22c55e';
      ctx.fillRect(8, 22, 10, 10);
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(p0Name.slice(0, 5), 22, 31);

      ctx.fillStyle = '#f43f5e';
      ctx.fillRect(68, 22, 10, 10);
      ctx.fillStyle = '#f8fafc';
      ctx.fillText(p1Name.slice(0, 5), 82, 31);

      ctx.fillStyle = '#4ade80';
      ctx.font = 'bold 20px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(p0Score + ' - ' + p1Score, 64, 54);
    });
  }

  public static createPixelNetTexture(): THREE.CanvasTexture {
    const tex = this.makePixelTexture(64, 16, (ctx) => {
      ctx.clearRect(0, 0, 64, 16);
      ctx.fillStyle = '#14141f';
      ctx.fillRect(0, 0, 64, 3);
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 1, 64, 2);

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
      for (let y = 0; y < grid.length; y++) {
        for (let x = 0; x < grid[y].length; x++) {
          const ch = grid[y][x];
          if (ch !== '.' && palette[ch]) {
            this.px(ctx, palette[ch], x, y, 1, 1);
          }
        }
      }
    });
  }
}