import {
  AIDifficulty,
  DEFAULT_P1_CUSTOM,
  GROQ_MODELS,
  HatStyleOption,
  JERSEY_PRESETS,
  MatchSettings,
  PlayerCustomization,
  RACKET_PRESETS,
  SKIN_PRESETS
} from '../types/Customization.js';
import { GbaSpriteFactory } from '../graphics/GbaSpriteFactory.js';
import { LobbyStatePacket, MatchFormat, SlotIndex } from '../../../server/src/types/packets.js';

export class MenuFlowController {
  public custom: PlayerCustomization = { ...DEFAULT_P1_CUSTOM };
  public settings: MatchSettings;

  private kitIdx = 2;
  private skinIdx = 2;
  private racketIdx = 1;
  private modelIdx = 0;
  private hatStyles: HatStyleOption[] = [
    'HEADBAND',
    'VISOR_GOGGLES',
    'SPIKY',
    'CAP',
    'SAFARI',
    'BEANIE'
  ];
  private hatIdx = 0;

  private heroOverlay = document.getElementById('hero-overlay')!;
  private lobbyOverlay = document.getElementById('lobby-overlay')!;
  private victoryOverlay = document.getElementById('victory-overlay')!;
  private previewCanvas = document.getElementById('char-preview-canvas') as HTMLCanvasElement;

  constructor(
    private callbacks: {
      onStartMatch: (custom: PlayerCustomization, settings: MatchSettings) => void;
      onSwitchSlot: (slot: SlotIndex) => void;
      onHostLaunchLobby: () => void;
      onPlayAgain: () => void;
      onReturnToHero: () => void;
    }
  ) {
    const envKey =
      (import.meta as unknown as { env: { VITE_GROQ_API_KEY?: string } }).env.VITE_GROQ_API_KEY ||
      '';
    const savedKey = localStorage.getItem('SMASHBIT_GROQ_KEY') || envKey;

    this.settings = {
      mode: 'AI',
      matchFormat: '1V1',
      targetPoints: 11,
      aiDifficulty: 'PRO',
      groqModel: GROQ_MODELS[0].id,
      groqApiKey: savedKey
    };

    this.bindUIEvents();
    this.renderCharacterPreview();
    this.checkUrlInviteCode();
  }

  /**
   * If a friend opens `?room=94PD`, prefill the room code so they can join in 1 click!
   */
  private checkUrlInviteCode(): void {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      const codeInput = document.getElementById('hero-input-code') as HTMLInputElement;
      if (codeInput) {
        codeInput.value = roomParam.trim().toUpperCase().slice(0, 4);
      }
    }
  }

  private bindUIEvents(): void {
    const nameInput = document.getElementById('input-username') as HTMLInputElement;
    nameInput?.addEventListener('input', () => {
      const val = nameInput.value.trim().toUpperCase();
      this.custom.username = val || 'PLAYER 1';
    });

    const apiKeyInput = document.getElementById('input-groq-key') as HTMLInputElement;
    if (apiKeyInput && this.settings.groqApiKey) {
      apiKeyInput.value = this.settings.groqApiKey;
    }
    apiKeyInput?.addEventListener('input', () => {
      this.settings.groqApiKey = apiKeyInput.value.trim();
      localStorage.setItem('SMASHBIT_GROQ_KEY', this.settings.groqApiKey);
    });

    document.getElementById('btn-cycle-llm')?.addEventListener('click', (e) => {
      this.modelIdx = (this.modelIdx + 1) % GROQ_MODELS.length;
      const m = GROQ_MODELS[this.modelIdx];
      this.settings.groqModel = m.id;
      (e.target as HTMLButtonElement).textContent = 'LLM BRAIN: ' + m.shortName;
    });

    document.getElementById('btn-cycle-hat')?.addEventListener('click', (e) => {
      this.hatIdx = (this.hatIdx + 1) % this.hatStyles.length;
      this.custom.hatStyle = this.hatStyles[this.hatIdx];
      (e.target as HTMLButtonElement).textContent =
        'Headgear: ' + this.custom.hatStyle.replace('_', ' ');
      this.renderCharacterPreview();
    });

    document.getElementById('btn-cycle-kit')?.addEventListener('click', (e) => {
      this.kitIdx = (this.kitIdx + 1) % JERSEY_PRESETS.length;
      const kit = JERSEY_PRESETS[this.kitIdx];
      this.custom.jerseyColor = kit.primary;
      this.custom.jerseyShadow = kit.shadow;
      this.custom.stripeColor = kit.stripe;
      this.custom.hatColor = kit.hat;
      (e.target as HTMLButtonElement).textContent = 'Jersey: ' + kit.name;
      this.renderCharacterPreview();
    });

    document.getElementById('btn-cycle-skin')?.addEventListener('click', (e) => {
      this.skinIdx = (this.skinIdx + 1) % SKIN_PRESETS.length;
      const sk = SKIN_PRESETS[this.skinIdx];
      this.custom.skinColor = sk.skin;
      this.custom.skinShadow = sk.shadow;
      (e.target as HTMLButtonElement).textContent = 'Skin: ' + sk.name;
      this.renderCharacterPreview();
    });

    document.getElementById('btn-cycle-racket')?.addEventListener('click', (e) => {
      this.racketIdx = (this.racketIdx + 1) % RACKET_PRESETS.length;
      const rk = RACKET_PRESETS[this.racketIdx];
      this.custom.racketColor = rk.color;
      (e.target as HTMLButtonElement).textContent = 'Racket: ' + rk.name;
      this.renderCharacterPreview();
    });

    // 1V1 Singles vs 2V2 Doubles Mode Selector
    document.querySelectorAll('[data-format]').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-format]').forEach((b) => b.classList.remove('active-opt'));
        btn.classList.add('active-opt');
        this.settings.matchFormat = btn.getAttribute('data-format') as MatchFormat;
      });
    });

    // Points Target (5 / 11 / 21)
    document.querySelectorAll('[data-pts]').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-pts]').forEach((b) => b.classList.remove('active-opt'));
        btn.classList.add('active-opt');
        this.settings.targetPoints = Number(btn.getAttribute('data-pts')) as 5 | 11 | 21;
      });
    });

    document.querySelectorAll('[data-diff]').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-diff]').forEach((b) => b.classList.remove('active-opt'));
        btn.classList.add('active-opt');
        this.settings.aiDifficulty = btn.getAttribute('data-diff') as AIDifficulty;
      });
    });

    document.getElementById('btn-start-ai')?.addEventListener('click', () => {
      this.settings.mode = 'AI';
      this.hideHero();
      this.callbacks.onStartMatch({ ...this.custom }, { ...this.settings });
    });

    document.getElementById('btn-hero-create')?.addEventListener('click', () => {
      this.settings.mode = 'PVP_HOST';
      this.hideHero();
      this.callbacks.onStartMatch({ ...this.custom }, { ...this.settings });
    });

    document.getElementById('btn-hero-join')?.addEventListener('click', () => {
      const codeInput = document.getElementById('hero-input-code') as HTMLInputElement;
      const code = codeInput?.value.trim().toUpperCase();
      if (!code) return;
      this.settings.mode = 'PVP_JOIN';
      this.settings.roomCode = code;
      this.hideHero();
      this.callbacks.onStartMatch({ ...this.custom }, { ...this.settings });
    });

    // Copy Shareable Friend Invite Link
    document.getElementById('btn-copy-invite')?.addEventListener('click', (e) => {
      const code = document.getElementById('lobby-room-code')?.textContent || '';
      const inviteUrl = window.location.origin + window.location.pathname + '?room=' + code;
      navigator.clipboard.writeText(inviteUrl);
      (e.target as HTMLButtonElement).textContent = '✓ LINK COPIED!';
      setTimeout(() => {
        (e.target as HTMLButtonElement).textContent = '📋 COPY FRIEND INVITE LINK';
      }, 2000);
    });

    document.getElementById('btn-lobby-start')?.addEventListener('click', () => {
      this.callbacks.onHostLaunchLobby();
    });

    document.getElementById('btn-lobby-leave')?.addEventListener('click', () => {
      this.lobbyOverlay.classList.remove('open');
      this.showHero();
      this.callbacks.onReturnToHero();
    });

    document.getElementById('btn-play-again')?.addEventListener('click', () => {
      this.victoryOverlay.classList.remove('open');
      this.callbacks.onPlayAgain();
    });

    document.getElementById('btn-main-menu')?.addEventListener('click', () => {
      this.victoryOverlay.classList.remove('open');
      this.showHero();
      this.callbacks.onReturnToHero();
    });
  }

  public renderLobbyState(lobby: LobbyStatePacket, mySlot: SlotIndex, mySocketId: string): void {
    this.lobbyOverlay.classList.add('open');
    document.getElementById('lobby-room-code')!.textContent = lobby.code;
    document.getElementById('lobby-format-badge')!.textContent =
      lobby.matchFormat + ' (' + lobby.targetPoints + ' PTS)';

    const slotsContainer = document.getElementById('lobby-slots-grid')!;
    slotsContainer.innerHTML = '';

    lobby.slots.forEach((slot) => {
      const card = document.createElement('div');
      card.className = 'card-box';
      card.style.borderColor = slot.side === 0 ? '#38bdf8' : '#f43f5e';

      const teamName = slot.side === 0 ? 'TEAM 1 (NEAR COURT)' : 'TEAM 2 (FAR COURT)';
      const isMe = slot.slotIndex === mySlot;

      card.innerHTML =
        '<div style="font-size:10px;color:' +
        (slot.side === 0 ? '#38bdf8' : '#f43f5e') +
        ';font-weight:bold;">' +
        teamName +
        ' // SLOT ' +
        (slot.slotIndex + 1) +
        '</div>' +
        '<div style="font-size:15px;font-weight:900;color:' +
        (slot.isAI ? '#a1a1aa' : '#4ade80') +
        ';">' +
        slot.nickname +
        (isMe ? ' (YOU)' : '') +
        '</div>';

      if (slot.isAI) {
        const switchBtn = document.createElement('button');
        switchBtn.textContent = '⇄ TAKE THIS SLOT';
        switchBtn.onclick = () => this.callbacks.onSwitchSlot(slot.slotIndex);
        card.appendChild(switchBtn);
      }

      slotsContainer.appendChild(card);
    });

    const startBtn = document.getElementById('btn-lobby-start') as HTMLButtonElement;
    const isHost = lobby.hostSocketId === mySocketId;
    startBtn.style.display = isHost ? 'block' : 'none';
  }

  public hideLobby(): void {
    this.lobbyOverlay.classList.remove('open');
  }

  public renderCharacterPreview(showTrophyPose = false): void {
    if (!this.previewCanvas) return;
    const ctx = this.previewCanvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);

    const spriteSet = GbaSpriteFactory.createPlayerSprites(true, this.custom);
    const sourceTex = showTrophyPose ? spriteSet.trophy : spriteSet.idle;
    const sourceImg = sourceTex.image as HTMLCanvasElement;

    ctx.drawImage(
      sourceImg,
      0,
      0,
      sourceImg.width,
      sourceImg.height,
      8,
      8,
      this.previewCanvas.width - 16,
      this.previewCanvas.height - 16
    );
  }

  public showHero(): void {
    this.heroOverlay.classList.add('open');
    this.renderCharacterPreview(false);
  }

  public hideHero(): void {
    this.heroOverlay.classList.remove('open');
  }

  public showVictoryScreen(winnerName: string, scores: [number, number], maxRally: number): void {
    const titleEl = document.getElementById('victory-title')!;
    const subEl = document.getElementById('victory-stats')!;
    titleEl.textContent = '🏆 ' + winnerName + ' WINS THE CHAMPIONSHIP!';
    subEl.textContent =
      'FINAL SCORE: ' + scores[0] + ' - ' + scores[1] + '  |  LONGEST RALLY: ' + maxRally + ' SHOTS';
    this.victoryOverlay.classList.add('open');
  }
}