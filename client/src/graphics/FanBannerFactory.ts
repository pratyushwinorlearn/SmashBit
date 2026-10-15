import * as THREE from 'three';

export interface BannerVariant {
  texture: THREE.CanvasTexture;
  width: number;
  height: number;
  isWideCloth: boolean;
}

interface BannerTemplate {
  lines: string[];
  bg: string;
  fg: string;
  accent: string;
  borderStyle: 'SOLID' | 'DOUBLE' | 'DASHED' | 'TAPE' | 'PENNANT' | 'TRICOLOR';
  fontFamily: string;
  shape: 'LONG_STRIP' | 'TALL_POSTER' | 'MEDIUM_BOARD' | 'COMPACT_CARD' | 'PENNANT_FLAG';
}

/**
 * Generates 24 unique, high-clarity fan banners with randomized world lengths,
 * heights, aspect ratios, font families, and 1/2/3-line text layouts.
 */
export class FanBannerFactory {
  private static makeHighClarityTexture(
    w: number,
    h: number,
    draw: (ctx: CanvasRenderingContext2D) => void
  ): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    draw(ctx);

    const tex = new THREE.CanvasTexture(canvas);
    tex.magFilter = THREE.LinearFilter;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    return tex;
  }

  public static createAllBannerVariants(): BannerVariant[] {
    const templates: BannerTemplate[] = [
      // Long horizontal stadium cloth banners (wide & short)
      {
        lines: ["LET'S GO INDIA!"],
        bg: '#16a34a',
        fg: '#ffffff',
        accent: '#facc15',
        borderStyle: 'DOUBLE',
        fontFamily: 'Impact, Arial Black, sans-serif',
        shape: 'LONG_STRIP'
      },
      {
        lines: ['WELCOME TO SMASH CITY'],
        bg: '#0f172a',
        fg: '#38bdf8',
        accent: '#f43f5e',
        borderStyle: 'SOLID',
        fontFamily: '"Courier New", monospace',
        shape: 'LONG_STRIP'
      },
      {
        lines: ['400 KM/H JUMP SMASH!'],
        bg: '#dc2626',
        fg: '#fef08a',
        accent: '#ffffff',
        borderStyle: 'DASHED',
        fontFamily: 'Arial Black, sans-serif',
        shape: 'LONG_STRIP'
      },
      {
        lines: ['BWF WORLD TOUR FINALS'],
        bg: '#1e3a8a',
        fg: '#ffffff',
        accent: '#4ade80',
        borderStyle: 'DOUBLE',
        fontFamily: 'Georgia, serif',
        shape: 'LONG_STRIP'
      },

      // Tall 2-line and 3-line vertical poster boards
      {
        lines: ['EAT.', 'SLEEP.', 'SMASH!'],
        bg: '#fef08a',
        fg: '#0f172a',
        accent: '#ef4444',
        borderStyle: 'TAPE',
        fontFamily: 'Impact, sans-serif',
        shape: 'TALL_POSTER'
      },
      {
        lines: ['KING OF', 'THE COURT'],
        bg: '#7c3aed',
        fg: '#ffffff',
        accent: '#facc15',
        borderStyle: 'DOUBLE',
        fontFamily: 'Georgia, serif',
        shape: 'TALL_POSTER'
      },
      {
        lines: ['DROP SHOT', 'WIZARD'],
        bg: '#090d16',
        fg: '#4ade80',
        accent: '#38bdf8',
        borderStyle: 'SOLID',
        fontFamily: '"Courier New", monospace',
        shape: 'TALL_POSTER'
      },
      {
        lines: ['WE CAME', 'FOR DEUCE', 'DRAMA!'],
        bg: '#d97706',
        fg: '#fffbeb',
        accent: '#14121d',
        borderStyle: 'TAPE',
        fontFamily: '"Trebuchet MS", sans-serif',
        shape: 'TALL_POSTER'
      },

      // Medium rectangular signs
      {
        lines: ['21 - 0', 'CLEAN SWEEP'],
        bg: '#be123c',
        fg: '#ffffff',
        accent: '#fde047',
        borderStyle: 'SOLID',
        fontFamily: 'Arial Black, sans-serif',
        shape: 'MEDIUM_BOARD'
      },
      {
        lines: ['DEFENSE', 'WINS GOLD'],
        bg: '#0284c7',
        fg: '#ffffff',
        accent: '#facc15',
        borderStyle: 'DOUBLE',
        fontFamily: 'Impact, sans-serif',
        shape: 'MEDIUM_BOARD'
      },
      {
        lines: ['NET CORD', 'LUCK!!'],
        bg: '#facc15',
        fg: '#0f172a',
        accent: '#dc2626',
        borderStyle: 'DASHED',
        fontFamily: '"Courier New", monospace',
        shape: 'MEDIUM_BOARD'
      },
      {
        lines: ['PLAYER 1', 'FAN CLUB'],
        bg: '#059669',
        fg: '#ffffff',
        accent: '#a7f3d0',
        borderStyle: 'SOLID',
        fontFamily: '"Trebuchet MS", sans-serif',
        shape: 'MEDIUM_BOARD'
      },

      // Compact punchy 1-word / score cards
      {
        lines: ['MVP!'],
        bg: '#ef4444',
        fg: '#ffffff',
        accent: '#facc15',
        borderStyle: 'SOLID',
        fontFamily: 'Impact, sans-serif',
        shape: 'COMPACT_CARD'
      },
      {
        lines: ['BOOM!'],
        bg: '#f97316',
        fg: '#0f172a',
        accent: '#ffffff',
        borderStyle: 'DOUBLE',
        fontFamily: 'Arial Black, sans-serif',
        shape: 'COMPACT_CARD'
      },
      {
        lines: ['INDIA'],
        bg: '#ffffff',
        fg: '#1d4ed8',
        accent: '#f97316',
        borderStyle: 'TRICOLOR',
        fontFamily: 'Arial Black, sans-serif',
        shape: 'COMPACT_CARD'
      },
      {
        lines: ['UNSTOPPABLE'],
        bg: '#db2777',
        fg: '#ffffff',
        accent: '#fef08a',
        borderStyle: 'SOLID',
        fontFamily: 'Impact, sans-serif',
        shape: 'MEDIUM_BOARD'
      },

      // Triangular Pennants
      {
        lines: ['CHAMPION'],
        bg: '#2563eb',
        fg: '#facc15',
        accent: '#ffffff',
        borderStyle: 'PENNANT',
        fontFamily: 'Arial Black, sans-serif',
        shape: 'PENNANT_FLAG'
      },
      {
        lines: ['GO P1!'],
        bg: '#10b981',
        fg: '#ffffff',
        accent: '#0f172a',
        borderStyle: 'PENNANT',
        fontFamily: 'Impact, sans-serif',
        shape: 'PENNANT_FLAG'
      }
    ];

    return templates.map((tpl, i) => {
      // Deterministic jitter so every single sign has a slightly different length & height
      const sizeJitter = 0.92 + ((i * 37) % 10) * 0.022;

      let worldW = 1.3;
      let worldH = 0.72;
      let texW = 280;
      let texH = 150;

      if (tpl.shape === 'LONG_STRIP') {
        worldW = (2.15 + (i % 3) * 0.35) * sizeJitter; // Long 2.1m - 2.8m horizontal banner
        worldH = 0.56 * sizeJitter;
        texW = 440;
        texH = 115;
      } else if (tpl.shape === 'TALL_POSTER') {
        worldW = 1.15 * sizeJitter;
        worldH = (0.98 + (i % 2) * 0.16) * sizeJitter;
        texW = 250;
        texH = 220;
      } else if (tpl.shape === 'MEDIUM_BOARD') {
        worldW = (1.42 + (i % 3) * 0.18) * sizeJitter;
        worldH = 0.76 * sizeJitter;
        texW = 300;
        texH = 160;
      } else if (tpl.shape === 'COMPACT_CARD') {
        worldW = 0.96 * sizeJitter;
        worldH = 0.62 * sizeJitter;
        texW = 210;
        texH = 135;
      } else if (tpl.shape === 'PENNANT_FLAG') {
        worldW = 1.48 * sizeJitter;
        worldH = 0.68 * sizeJitter;
        texW = 300;
        texH = 140;
      }

      const texture = this.makeHighClarityTexture(texW, texH, (ctx) => {
        ctx.clearRect(0, 0, texW, texH);

        if (tpl.borderStyle === 'PENNANT') {
          // Wooden flagpole on left + triangular pennant
          ctx.fillStyle = '#78350f';
          ctx.fillRect(6, 4, 10, texH - 8);

          ctx.fillStyle = tpl.bg;
          ctx.beginPath();
          ctx.moveTo(16, 10);
          ctx.lineTo(texW - 8, texH / 2);
          ctx.lineTo(16, texH - 10);
          ctx.closePath();
          ctx.fill();

          ctx.lineWidth = 6;
          ctx.strokeStyle = tpl.accent;
          ctx.stroke();

          ctx.font = '900 34px ' + tpl.fontFamily;
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          ctx.lineWidth = 6;
          ctx.strokeStyle = '#090d16';
          ctx.strokeText(tpl.lines[0], 30, texH / 2 + 2);
          ctx.fillStyle = tpl.fg;
          ctx.fillText(tpl.lines[0], 30, texH / 2 + 2);
          return;
        }

        // Standard rectangular/poster sign with wooden holding sticks at bottom
        ctx.fillStyle = '#090d16';
        ctx.fillRect(4, 4, texW - 8, texH - 8);

        ctx.fillStyle = tpl.bg;
        ctx.fillRect(10, 10, texW - 20, texH - 20);

        // Border Variations
        if (tpl.borderStyle === 'TRICOLOR') {
          const stripH = (texH - 20) / 3;
          ctx.fillStyle = '#f97316';
          ctx.fillRect(10, 10, texW - 20, stripH);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(10, 10 + stripH, texW - 20, stripH);
          ctx.fillStyle = '#16a34a';
          ctx.fillRect(10, 10 + stripH * 2, texW - 20, stripH);
        } else if (tpl.borderStyle === 'DOUBLE') {
          ctx.strokeStyle = tpl.accent;
          ctx.lineWidth = 5;
          ctx.strokeRect(16, 16, texW - 32, texH - 32);
        } else if (tpl.borderStyle === 'DASHED') {
          ctx.strokeStyle = tpl.accent;
          ctx.lineWidth = 5;
          ctx.setLineDash([14, 8]);
          ctx.strokeRect(15, 15, texW - 30, texH - 30);
          ctx.setLineDash([]);
        } else if (tpl.borderStyle === 'TAPE') {
          // Corner duct-tape strips on cardboard/poster signs
          ctx.fillStyle = '#e2e8f0';
          ctx.fillRect(6, 6, 28, 12);
          ctx.fillRect(texW - 34, 6, 28, 12);
          ctx.fillRect(6, texH - 18, 28, 12);
          ctx.fillRect(texW - 34, texH - 18, 28, 12);
        }

        // Render Multi-Line High-Contrast Outlined Text
        const numLines = tpl.lines.length;
        const baseFontSize =
          tpl.shape === 'LONG_STRIP'
            ? 44
            : numLines === 1
            ? 50
            : numLines === 2
            ? 42
            : 36;

        ctx.font = '900 ' + baseFontSize + 'px ' + tpl.fontFamily;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const lineSpacing = baseFontSize * 1.15;
        const totalTextH = (numLines - 1) * lineSpacing;
        const startY = texH / 2 - totalTextH / 2;

        for (let l = 0; l < numLines; l++) {
          const ly = startY + l * lineSpacing;
          const lineText = tpl.lines[l];

          // Heavy dark drop-outline so text is 100% legible from any distance
          ctx.lineWidth = 8;
          ctx.lineJoin = 'round';
          ctx.strokeStyle = '#090d16';
          ctx.strokeText(lineText, texW / 2, ly);

          // Alternate highlight color on the last line of multi-line posters
          ctx.fillStyle = numLines > 1 && l === numLines - 1 && tpl.bg !== '#fef08a' ? tpl.accent : tpl.fg;
          ctx.fillText(lineText, texW / 2, ly);
        }
      });

      return {
        texture,
        width: worldW,
        height: worldH,
        isWideCloth: tpl.shape === 'LONG_STRIP'
      };
    });
  }
}