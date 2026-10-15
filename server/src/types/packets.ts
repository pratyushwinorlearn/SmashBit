export type ShotType =
  | 'SERVE'
  | 'JUMP_SMASH'
  | 'HIGH_CLEAR'
  | 'DROP_SHOT'
  | 'FLAT_DRIVE'
  | 'DEFENSIVE_LIFT'
  | 'NET_SHOT';

export type MatchFormat = '1V1' | '2V2';
export type SlotIndex = 0 | 1 | 2 | 3; // 0,2 = Team 0 (Near) | 1,3 = Team 1 (Far)

export interface LobbyPlayerSlot {
  slotIndex: SlotIndex;
  side: 0 | 1;
  socketId: string | null; // null = Filled by AI Bot
  nickname: string;
  isAI: boolean;
}

export interface LobbyStatePacket {
  code: string;
  hostSocketId: string;
  matchFormat: MatchFormat;
  targetPoints: 5 | 11 | 21;
  slots: LobbyPlayerSlot[];
}

export interface PlayerStatePacket {
  id: string;
  slotIndex: SlotIndex;
  side: 0 | 1;
  x: number;
  y: number;
  z: number;
  vx: number;
  vz: number;
  anim: 'IDLE' | 'RUN' | 'JUMP' | 'LUNGE' | 'SWING';
  stamina: number;
}

export interface ShuttleHitPacket {
  hitterSide: 0 | 1;
  hitterSlot: SlotIndex;
  pos: [number, number, number];
  vel: [number, number, number];
  shotType: ShotType;
  rallyCount: number;
  timestamp: number;
}

export interface PointScoredPacket {
  winnerSide: 0 | 1;
  reason: 'IN_BOUNDS' | 'OUT_OF_BOUNDS' | 'INTO_NET' | 'DOUBLE_BOUNCE';
  scores: [number, number];
  servingSide: 0 | 1;
  matchWinner: 0 | 1 | null;
}