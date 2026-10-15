import * as THREE from 'three';

import { GameLoop } from './core/GameLoop.js';
import { InputManager } from './core/InputManager.js';
import { CameraRig } from './core/CameraRig.js';
import { AimController } from './core/AimController.js';
import { CourtBounds } from './physics/CourtBounds.js';
import { Shuttlecock } from './physics/Shuttlecock.js';
import { HitDetection, TimingGrade } from './physics/HitDetection.js';
import { Player } from './entities/Player.js';
import { CrowdManager } from './entities/CrowdManager.js';
import { SoundDirector } from './audio/SoundDirector.js';
import { SocketClient } from './network/SocketClient.js';
import { Reconciler } from './network/Reconciler.js';
import { StadiumLighting } from './graphics/StadiumLighting.js';
import { VictoryCelebration } from './graphics/VictoryCelebration.js';
import { MenuFlowController } from './ui/MenuFlowController.js';
import { GroqBadmintonAgent } from './ai/GroqBadmintonAgent.js';
import {
  AIDifficulty,
  DEFAULT_P1_CUSTOM,
  DEFAULT_P2_CUSTOM,
  GROQ_MODELS,
  GroqModelId,
  JERSEY_PRESETS,
  MatchSettings
} from './types/Customization.js';
import { MatchFormat, SlotIndex } from '../../server/src/types/packets.js';

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x070910);

const cameraRig = new CameraRig(window.innerWidth / window.innerHeight);
StadiumLighting.setup(scene);

// --- Core Entities ---
const court = new CourtBounds();
scene.add(court.group);

const crowd = new CrowdManager(scene);
const celebration = new VictoryCelebration(scene);
const sound = new SoundDirector();
const shuttle = new Shuttlecock(scene);
const input = new InputManager();
const aim = new AimController(scene);
const reconciler = new Reconciler();
const groqAgent = new GroqBadmintonAgent();

// 4 Players: Slot 0 & 2 = Near Team 0 | Slot 1 & 3 = Far Team 1
const p0 = new Player(0, 0x1d4ed8, scene);
const p1 = new Player(1, 0x7c3aed, scene);
const p2 = new Player(0, 0x10b981, scene); // Near Court Doubles Partner
const p3 = new Player(1, 0xeab308, scene); // Far Court Doubles Partner
p2.applyCustomization({
  ...DEFAULT_P1_CUSTOM,
  hatStyle: 'CAP',
  jerseyColor: JERSEY_PRESETS[1].primary,
  jerseyShadow: JERSEY_PRESETS[1].shadow
});
p3.applyCustomization({
  ...DEFAULT_P2_CUSTOM,
  hatStyle: 'SAFARI',
  jerseyColor: JERSEY_PRESETS[3].primary,
  jerseyShadow: JERSEY_PRESETS[3].shadow
});

const allPlayers: Player[] = [p0, p1, p2, p3];
p2.group.visible = false;
p3.group.visible = false;

let matchFormat: MatchFormat = '1V1';
let localSlot: SlotIndex = 0;
let localSide: 0 | 1 = 0;
let activeHumanSlots = new Set<SlotIndex>([0]);
let servingSide: 0 | 1 = 0;
let scores: [number, number] = [0, 0];
let targetPoints: 5 | 11 | 21 = 11;
let aiDifficulty: AIDifficulty = 'PRO';
let activeGroqModel: GroqModelId = 'openai/gpt-oss-120b';
let activeGroqKey = '';
let p0Name = DEFAULT_P1_CUSTOM.username;
let p1Name = DEFAULT_P2_CUSTOM.username;
let longestRally = 0;
let stateTimer = 0;
let isMenuOpen = false;
let matchPhase: 'HERO' | 'LOBBY' | 'PLAYING' | 'CELEBRATION' = 'HERO';

// --- DOM HUD Elements ---
const scoreEl0 = document.getElementById('score-p0')!;
const scoreEl1 = document.getElementById('score-p1')!;
const labelP0 = document.getElementById('label-p0')!;
const labelP1 = document.getElementById('label-p1')!;
const rallyEl = document.getElementById('rally-counter')!;
const shotEl = document.getElementById('shot-indicator')!;
const bannerEl = document.getElementById('banner')!;
const staminaEl = document.getElementById('stamina-readout')!;
const aimReadoutEl = document.getElementById('aim-readout')!;
const netStatusEl = document.getElementById('net-status')!;
const modeLabelEl = document.getElementById('mode-label')!;
const settingsModal = document.getElementById('settings-modal')!;
const btnAimMode = document.getElementById('btn-aim-mode') as HTMLButtonElement;
const btnReticle = document.getElementById('btn-reticle') as HTMLButtonElement;
const llmBoxEl = document.getElementById('llm-thought-box')!;
const llmHeaderEl = document.getElementById('llm-model-header')!;
const llmThoughtEl = document.getElementById('llm-thought-text')!;

function resetAllPlayerPositions(serverScore: number): void {
  const isDoubles = matchFormat === '2V2';
  p2.group.visible = isDoubles;
  p3.group.visible = isDoubles;

  p0.resetPosition(serverScore);
  p1.resetPosition(serverScore);

  if (isDoubles) {
    // Position partners on the opposite left/right service court box
    p2.resetPosition(serverScore + 1);
    p2.pos.z = 4.4;
    p2.syncMesh();

    p3.resetPosition(serverScore + 1);
    p3.pos.z = -4.4;
    p3.syncMesh();
  }
}

function syncAimReadout(): void {
  const modeTxt = aim.aimMode === 'MOUSE' ? 'MOUSE CURSOR' : 'KEYBOARD (WASD)';
  const retTxt = aim.showReticle ? 'GBA CROSSHAIR' : 'PRO BLIND';
  aimReadoutEl.textContent = 'AIM: ' + modeTxt + ' | RETICLE: ' + retTxt + ' [PRESS T]';
  if (btnAimMode) btnAimMode.textContent = 'Aim: ' + (aim.aimMode === 'MOUSE' ? 'Mouse Cursor' : 'Keyboard');
  if (btnReticle) btnReticle.textContent = 'Reticle: ' + (aim.showReticle ? 'GBA Crosshair' : 'Blind Pro');
}

function toggleSettingsModal(forceState?: boolean): void {
  if (matchPhase === 'HERO' || matchPhase === 'LOBBY') return;
  isMenuOpen = forceState !== undefined ? forceState : !isMenuOpen;
  settingsModal.classList.toggle('open', isMenuOpen);
}

function showBanner(text: string, duration = 1.6): void {
  bannerEl.textContent = text;
  bannerEl.style.opacity = '1';
  stateTimer = duration;
}

function updateHUD(): void {
  scoreEl0.textContent = String(scores[0]);
  scoreEl1.textContent = String(scores[1]);
  labelP0.textContent = p0Name;
  labelP1.textContent = p1Name;
  rallyEl.textContent = 'RALLY: ' + shuttle.rallyCount;
  const hype = crowd.excitement > 0.7 ? 'ROARING' : crowd.excitement > 0.4 ? 'RISING' : 'LOW';
  const myPlayer = allPlayers[localSlot];
  staminaEl.textContent = 'STAMINA: ' + Math.round(myPlayer.stamina) + '% | CROWD HYPE: ' + hype;
}

// --- Network PvP & Doubles Setup ---
const SERVER_URL =
  (import.meta as unknown as { env: { VITE_SERVER_URL?: string } }).env.VITE_SERVER_URL ||
  'http://localhost:4000';

let menuFlow: MenuFlowController;

const net = new SocketClient(SERVER_URL, {
  onLobbyUpdate: (lobby, mySlot) => {
    matchPhase = 'LOBBY';
    localSlot = mySlot;
    localSide = (mySlot % 2) as 0 | 1;
    matchFormat = lobby.matchFormat;
    targetPoints = lobby.targetPoints;
    menuFlow.renderLobbyState(lobby, mySlot, net.socket.id || '');
  },
  onMatchStart: ({ lobby, mySlot, mySide, servingSide: srv }) => {
    menuFlow.hideLobby();
    localSlot = mySlot;
    localSide = mySide;
    servingSide = srv;
    matchFormat = lobby.matchFormat;
    targetPoints = lobby.targetPoints;
    scores = [0, 0];
    longestRally = 0;

    activeHumanSlots.clear();
    lobby.slots.forEach((s) => {
      if (!s.isAI) activeHumanSlots.add(s.slotIndex);
    });

    const t0Names = lobby.slots
      .filter((s) => s.side === 0)
      .map((s) => s.nickname)
      .join(' & ');
    const t1Names = lobby.slots
      .filter((s) => s.side === 1)
      .map((s) => s.nickname)
      .join(' & ');
    p0Name = t0Names.slice(0, 14);
    p1Name = t1Names.slice(0, 14);

    celebration.stopCelebration();
    matchPhase = 'PLAYING';
    llmBoxEl.style.display = 'none';
    court.updateCourtsideScoreboard(0, 0, p0Name, p1Name);
    cameraRig.mode = 'BROADCAST_END';
    cameraRig.applyMode(localSide);
    resetAllPlayerPositions(0);
    modeLabelEl.textContent = lobby.matchFormat + ' ROOM ' + lobby.code + ' // ' + targetPoints + ' PTS';
    toggleSettingsModal(false);
    showBanner('MATCH STARTED! YOU ARE SLOT ' + (mySlot + 1), 2.5);
    updateHUD();
  },
  onOpponentState: (pkt) => {
    reconciler.applyOpponentPacket(pkt, allPlayers);
  },
  onShuttleSync: (pkt) => {
    reconciler.applyDeterministicHit(pkt, shuttle);
    longestRally = Math.max(longestRally, pkt.rallyCount);
    sound.playRacketHit(pkt.shotType, true);
    crowd.boostExcitement(pkt.shotType === 'JUMP_SMASH' ? 0.25 : 0.08);
    shotEl.textContent = 'SHOT: ' + pkt.shotType.replace('_', ' ');
    updateHUD();
  },
  onPointScored: (pkt) => {
    scores = pkt.scores;
    servingSide = pkt.servingSide;
    shuttle.inPlay = false;
    court.updateCourtsideScoreboard(scores[0], scores[1], p0Name, p1Name);

    const winner = checkMatchWin(scores[0], scores[1]);
    if (winner !== null) {
      triggerChampionshipCeremony(winner);
      return;
    }

    resetAllPlayerPositions(scores[servingSide]);
    sound.playCrowdCheer(crowd.excitement);
    crowd.boostExcitement(0.35);
    showBanner('POINT TEAM ' + (pkt.winnerSide + 1) + ' (' + pkt.reason.replace('_', ' ') + ')');
    updateHUD();
  },
  onStatusChange: (txt) => {
    netStatusEl.textContent = 'Status: ' + txt;
    showBanner(txt, 2.5);
  }
});

menuFlow = new MenuFlowController({
  onStartMatch: (custom, settings: MatchSettings) => {
    p0Name = custom.username;
    p0.applyCustomization(custom);
    matchFormat = settings.matchFormat;
    targetPoints = settings.targetPoints;
    aiDifficulty = settings.aiDifficulty;
    activeGroqModel = settings.groqModel;
    activeGroqKey = settings.groqApiKey;
    scores = [0, 0];
    servingSide = 0;
    longestRally = 0;
    celebration.stopCelebration();

    if (settings.mode === 'PVP_HOST') {
      net.createRoom(p0Name, settings.matchFormat, settings.targetPoints);
    } else if (settings.mode === 'PVP_JOIN' && settings.roomCode) {
      net.joinRoom(settings.roomCode, p0Name);
    } else {
      net.isOnline = false;
      localSlot = 0;
      localSide = 0;
      activeHumanSlots = new Set<SlotIndex>([0]);
      const modelMeta = GROQ_MODELS.find((m) => m.id === activeGroqModel) || GROQ_MODELS[0];
      p1Name = matchFormat === '2V2' ? modelMeta.shortName + ' DUO' : modelMeta.shortName;
      if (matchFormat === '2V2') {
        p0Name = custom.username + ' & AI';
      }
      matchPhase = 'PLAYING';
      llmBoxEl.style.display = 'flex';
      llmHeaderEl.textContent =
        activeGroqKey && activeGroqModel !== 'CLASSIC_BOT'
          ? '⚡ GROQ LIVE // ' + activeGroqModel.toUpperCase()
          : '🤖 LOCAL TACTICAL ENGINE';
      llmThoughtEl.textContent = '"Ready on the far court. Serve whenever you are ready!"';

      cameraRig.mode = 'BROADCAST_END';
      cameraRig.applyMode(0);
      resetAllPlayerPositions(0);
      modeLabelEl.textContent = matchFormat + ' // FIRST TO ' + targetPoints + ' PTS';
      court.updateCourtsideScoreboard(0, 0, p0Name, p1Name);
      showBanner(p0Name + ' VS ' + p1Name + ' — SERVE!', 2.2);
      updateHUD();
    }
  },
  onSwitchSlot: (slot) => {
    net.switchSlot(slot);
  },
  onHostLaunchLobby: () => {
    net.requestStartMatch();
  },
  onPlayAgain: () => {
    scores = [0, 0];
    servingSide = 0;
    longestRally = 0;
    celebration.stopCelebration();
    matchPhase = 'PLAYING';
    cameraRig.mode = 'BROADCAST_END';
    cameraRig.applyMode(localSide);
    resetAllPlayerPositions(0);
    court.updateCourtsideScoreboard(0, 0, p0Name, p1Name);
    showBanner('REMATCH STARTED — SERVE!', 2.0);
    updateHUD();
  },
  onReturnToHero: () => {
    celebration.stopCelebration();
    matchPhase = 'HERO';
    cameraRig.mode = 'HERO_ORBIT';
    resetAllPlayerPositions(0);
  }
});

document.getElementById('btn-settings-toggle')?.addEventListener('click', () => toggleSettingsModal());
document.getElementById('btn-close-modal')?.addEventListener('click', () => toggleSettingsModal(false));
document.getElementById('btn-open-hero')?.addEventListener('click', () => {
  toggleSettingsModal(false);
  celebration.stopCelebration();
  matchPhase = 'HERO';
  cameraRig.mode = 'HERO_ORBIT';
  menuFlow.showHero();
});

btnAimMode?.addEventListener('click', () => {
  aim.toggleAimMode();
  syncAimReadout();
});
btnReticle?.addEventListener('click', () => {
  aim.toggleReticle();
  syncAimReadout();
});
document.getElementById('btn-cam')?.addEventListener('click', (e) => {
  const mode = cameraRig.toggleMode(localSide);
  (e.target as HTMLButtonElement).textContent =
    mode === 'BROADCAST_END' ? 'Cam: Broadcast' : 'Cam: Side TV';
});

window.addEventListener('keydown', (e) => {
  if (e.code === 'Escape' && matchPhase === 'PLAYING') {
    toggleSettingsModal();
  } else if (e.code === 'KeyT' && matchPhase === 'PLAYING' && !isMenuOpen) {
    aim.toggleReticle();
    syncAimReadout();
  }
});

function checkMatchWin(s0: number, s1: number): 0 | 1 | null {
  const cap = targetPoints + 9;
  if ((s0 >= targetPoints && s0 - s1 >= 2) || s0 >= cap) return 0;
  if ((s1 >= targetPoints && s1 - s0 >= 2) || s1 >= cap) return 1;
  return null;
}

function triggerChampionshipCeremony(winnerSide: 0 | 1): void {
  matchPhase = 'CELEBRATION';
  shuttle.inPlay = false;

  const champ = winnerSide === 0 ? p0 : p1;
  const runnerUp = winnerSide === 0 ? p1 : p0;
  const winnerName = winnerSide === 0 ? p0Name : p1Name;

  champ.enterTrophyCelebration(1.4);
  if (matchFormat === '2V2') {
    const partner = winnerSide === 0 ? p2 : p3;
    partner.enterTrophyCelebration(1.4);
    partner.pos.x = -0.85;
    champ.pos.x = 0.65;
  }
  runnerUp.pos.set(2.4, 0, -2.5);
  runnerUp.syncMesh();

  celebration.startCelebration(1.4);
  cameraRig.mode = 'CHAMPION_ZOOM';
  cameraRig.applyMode(localSide);

  crowd.boostExcitement(1.0);
  sound.playVictoryFanfare();
  showBanner('🏆 ' + winnerName + ' WINS THE TOURNAMENT!', 4.0);
  menuFlow.showVictoryScreen(winnerName, scores, longestRally);
}

/**
 * Controls AI bots for any slot not occupied by a human player (Works in both 1v1 and 2v2 Doubles!)
 */
function updateAISlots(dt: number): void {
  const speedMult = aiDifficulty === 'LEGEND' ? 1.14 : aiDifficulty === 'PRO' ? 0.95 : 0.75;
  const maxSlot = matchFormat === '2V2' ? 4 : 2;

  for (let i = 0; i < maxSlot; i++) {
    const slot = i as SlotIndex;
    if (activeHumanSlots.has(slot)) continue;

    const bot = allPlayers[slot];
    const botSide = bot.side;

    // 1. AI Serving (if it's this side's serve and primary slot)
    if (!shuttle.inPlay) {
      if (servingSide === botSide && (slot === 1 || slot === 0) && stateTimer <= 0) {
        bot.triggerSwing();
        const serveCategory = Math.random() < 0.45 ? 'FINESSE' : 'ARC';
        const oppZ = botSide === 0 ? -1 : 1;
        const serveTarget = new THREE.Vector3(
          bot.pos.x >= 0 ? -1.2 : 1.2,
          0,
          oppZ * (serveCategory === 'FINESSE' ? 2.15 : 5.8)
        );
        const hit = HitDetection.tryStrike(bot, shuttle, serveCategory, serveTarget, 0.6);
        if (hit) executeStrike(bot, slot, hit.shotType, hit.velocity, hit.isSweetSpot, hit.timingGrade);
      }
      continue;
    }

    // 2. AI Court Coverage (In 2v2 Doubles, Partner covers Left/Front while Primary covers Right/Back)
    const shuttleHeadingToBotSide =
      (botSide === 0 && shuttle.vel.z > 0) || (botSide === 1 && shuttle.vel.z < 0);

    let homeX = matchFormat === '2V2' ? (slot >= 2 ? -1.35 : 1.35) : 0;
    let homeZ = botSide === 0 ? (slot === 2 ? 2.1 : 4.2) : slot === 3 ? -2.1 : -4.2;

    if (shuttleHeadingToBotSide) {
      // Closest AI on this team intercepts the shuttle
      homeX = shuttle.pos.x;
      homeZ = botSide === 0 ? Math.max(0.8, shuttle.pos.z) : Math.min(-0.8, shuttle.pos.z);
    }

    const dx = THREE.MathUtils.clamp(homeX - bot.pos.x, -1, 1);
    const dz = THREE.MathUtils.clamp(homeZ - bot.pos.z, -1, 1);
    bot.updateLocal(dt, dx * 0.9, dz * 0.9, false, () => {}, false, speedMult);

    // 3. AI Strike Execution
    const onBotHalf = botSide === 0 ? shuttle.pos.z > 0.25 : shuttle.pos.z < -0.25;
    if (onBotHalf && shuttle.lastHitterSide !== botSide) {
      const plan = groqAgent.currentPlan;
      const oppDirZ = botSide === 0 ? -1 : 1;
      const chosenCategory = plan ? plan.shotCategory : 'ATTACK';
      const chosenTarget = plan
        ? new THREE.Vector3(plan.targetX, 0, oppDirZ * Math.abs(plan.targetZ))
        : new THREE.Vector3((Math.random() - 0.5) * 3.8, 0, oppDirZ * 4.5);

      const hit = HitDetection.tryStrike(bot, shuttle, chosenCategory, chosenTarget, 0.75);
      if (hit) {
        bot.triggerSwing();
        executeStrike(bot, slot, hit.shotType, hit.velocity, hit.isSweetSpot, hit.timingGrade);
      }
    }
  }
}

function executeStrike(
  hitter: Player,
  hitterSlot: SlotIndex,
  shotType: ReturnType<typeof HitDetection.tryStrike> extends infer R
    ? R extends { shotType: infer S }
      ? S
      : never
    : never,
  velocity: THREE.Vector3,
  isSweetSpot: boolean,
  timingGrade: TimingGrade = 'GOOD'
): void {
  const nextRally = shuttle.inPlay ? shuttle.rallyCount + 1 : 1;
  longestRally = Math.max(longestRally, nextRally);
  shuttle.launch(shuttle.pos.clone(), velocity, hitter.side, shotType, nextRally);
  if (isSweetSpot) {
    shuttle.triggerSweetSpotFlash();
  }
  sound.playRacketHit(shotType, isSweetSpot);

  if (shotType === 'JUMP_SMASH') {
    cameraRig.triggerSmashShake(isSweetSpot ? 0.38 : 0.22);
    crowd.boostExcitement(0.28);
  } else {
    crowd.boostExcitement(0.08);
  }

  const kmh = Math.round(velocity.length() * 3.6 * (shotType === 'JUMP_SMASH' ? 2.1 : 1.35));
  const gradeBadge = timingGrade === 'PERFECT' ? '★ PERFECT ' : timingGrade === 'LATE' ? '⚠ LATE ' : '';
  shotEl.textContent = gradeBadge + shotType.replace('_', ' ') + ' (' + kmh + ' KM/H)';
  updateHUD();

  if (!net.isOnline && hitter.side === 0) {
    groqAgent.planNextShot(
      {
        model: activeGroqModel,
        apiKey: activeGroqKey,
        scores,
        rallyCount: nextRally,
        incomingShotType: shotType,
        shuttleStartPos: shuttle.pos.clone(),
        shuttleVel: velocity.clone(),
        humanPos: p0.pos.clone(),
        humanStamina: p0.stamina,
        botPos: p1.pos.clone(),
        botStamina: p1.stamina
      },
      (plan) => {
        const latencyBadge = plan.latencyMs > 0 ? ' (' + plan.latencyMs + 'ms)' : '';
        llmHeaderEl.textContent =
          '⚡ ' + plan.modelUsed.toUpperCase() + latencyBadge + ' → ' + plan.shotCategory;
        llmThoughtEl.textContent = '"' + plan.thought + '"';
      }
    );
  }

  net.sendShuttleHit({
    hitterSide: hitter.side,
    hitterSlot,
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
  } else if (!CourtBounds.isShuttleInBounds(x, z, receiver, matchFormat === '2V2')) {
    winnerSide = receiver;
    reason = 'OUT_OF_BOUNDS';
  }

  if (net.isOnline) {
    if (localSlot === 0) net.reportPoint(winnerSide, reason);
  } else {
    scores[winnerSide] += 1;
    servingSide = winnerSide;
    court.updateCourtsideScoreboard(scores[0], scores[1], p0Name, p1Name);
    updateHUD();

    const matchWinner = checkMatchWin(scores[0], scores[1]);
    if (matchWinner !== null) {
      triggerChampionshipCeremony(matchWinner);
      return;
    }

    resetAllPlayerPositions(scores[servingSide]);
    sound.playCrowdCheer(crowd.excitement);
    crowd.boostExcitement(0.35);
    const pointWinnerName = winnerSide === 0 ? p0Name : p1Name;
    showBanner('POINT ' + pointWinnerName + ' — ' + reason.replace('_', ' '), 1.8);
  }
}

let netTickCounter = 0;

const loop = new GameLoop(
  (dt) => {
    if (stateTimer > 0) {
      stateTimer -= dt;
      if (stateTimer <= 0) bannerEl.style.opacity = '0';
    }

    const myPlayer = allPlayers[localSlot];
    const inp = input.consumeState();

    if (matchPhase === 'CELEBRATION') {
      celebration.update(dt);
      allPlayers.forEach((p) => p.updateLocal(dt, 0, 0, false, () => {}));
      crowd.update(dt);
      cameraRig.update(dt, 0, shuttle.pos);
      return;
    }

    if (matchPhase === 'PLAYING' && !isMenuOpen) {
      const dirFactor = localSide === 0 ? 1 : -1;

      aim.update(
        dt,
        cameraRig.camera,
        localSide,
        inp.mouseNdc,
        inp.moveX * dirFactor,
        inp.moveZ * dirFactor,
        inp.chargeRatio
      );

      myPlayer.updateLocal(
        dt,
        inp.moveX * dirFactor,
        inp.moveZ * dirFactor,
        inp.jumpPressed,
        () => sound.playShoeSqueak(),
        inp.lungePressed
      );

      if (inp.strikeTriggered) {
        myPlayer.triggerSwing();
        const canHit =
          (!shuttle.inPlay && servingSide === localSide) ||
          (shuttle.inPlay && shuttle.lastHitterSide !== localSide);

        if (canHit) {
          const hit = HitDetection.tryStrike(
            myPlayer,
            shuttle,
            inp.strikeTriggered,
            aim.targetWorldPos,
            inp.chargeRatio
          );
          if (hit) {
            executeStrike(
              myPlayer,
              localSlot,
              hit.shotType,
              hit.velocity,
              hit.isSweetSpot,
              hit.timingGrade
            );
          }
        }
      }

      if (net.isOnline) {
        reconciler.interpolateRemotePlayers(dt, allPlayers, localSlot, activeHumanSlots);
        netTickCounter++;
        if (netTickCounter % 2 === 0) {
          net.sendPlayerState({
            id: net.socket.id || 'local',
            slotIndex: localSlot,
            side: localSide,
            x: myPlayer.pos.x,
            y: myPlayer.pos.y,
            z: myPlayer.pos.z,
            vx: myPlayer.vel.x,
            vz: myPlayer.vel.z,
            anim: myPlayer.animState === 'TROPHY' ? 'IDLE' : myPlayer.animState,
            stamina: myPlayer.stamina
          });
        }
      }

      // Update any AI-controlled partner/opponent slots
      updateAISlots(dt);

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

syncAimReadout();
loop.start();