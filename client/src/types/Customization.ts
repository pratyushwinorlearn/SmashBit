import { MatchFormat } from '../../../server/src/types/packets.js';

export type HatStyleOption =
  | 'VISOR_GOGGLES'
  | 'HEADBAND'
  | 'SPIKY'
  | 'CAP'
  | 'SAFARI'
  | 'BEANIE';

export type AIDifficulty = 'ROOKIE' | 'PRO' | 'LEGEND';

export type GroqModelId =
  | 'openai/gpt-oss-120b'
  | 'qwen/qwen3.8-27b'
  | 'openai/gpt-oss-20b'
  | 'llama-3.3-70b-versatile'
  | 'CLASSIC_BOT';

export const GROQ_MODELS: { id: GroqModelId; shortName: string; badge: string }[] = [
  { id: 'openai/gpt-oss-120b', shortName: 'GPT-OSS 120B', badge: 'OPENAI 120B' },
  { id: 'qwen/qwen3.8-27b', shortName: 'QWEN 3.8 27B', badge: 'QWEN 3.8' },
  { id: 'openai/gpt-oss-20b', shortName: 'GPT-OSS 20B', badge: 'GPT-OSS 20B (1000 TPS)' },
  { id: 'llama-3.3-70b-versatile', shortName: 'LLAMA 3.3 70B', badge: 'LLAMA 70B' },
  { id: 'CLASSIC_BOT', shortName: 'LOCAL BOT (NO API)', badge: 'CLASSIC BOT' }
];

export interface PlayerCustomization {
  username: string;
  hatStyle: HatStyleOption;
  hatColor: string;
  jerseyColor: string;
  jerseyShadow: string;
  stripeColor: string;
  skinColor: string;
  skinShadow: string;
  racketColor: string;
}

export interface MatchSettings {
  mode: 'AI' | 'PVP_HOST' | 'PVP_JOIN';
  matchFormat: MatchFormat;
  targetPoints: 5 | 11 | 21;
  aiDifficulty: AIDifficulty;
  groqModel: GroqModelId;
  groqApiKey: string;
  roomCode?: string;
}

export const JERSEY_PRESETS: {
  name: string;
  primary: string;
  shadow: string;
  stripe: string;
  hat: string;
}[] = [
  { name: 'India Blue', primary: '#1d4ed8', shadow: '#1e3a8a', stripe: '#f97316', hat: '#ef4444' },
  { name: 'Emerald Pro', primary: '#10b981', shadow: '#047857', stripe: '#facc15', hat: '#059669' },
  { name: 'Crimson Fire', primary: '#e11d48', shadow: '#9f1239', stripe: '#fde047', hat: '#be123c' },
  { name: 'Imperial Gold', primary: '#eab308', shadow: '#a16207', stripe: '#0f172a', hat: '#1e293b' },
  { name: 'Cyber Violet', primary: '#7c3aed', shadow: '#4c1d95', stripe: '#38bdf8', hat: '#6d28d9' },
  { name: 'Stealth Onyx', primary: '#1e293b', shadow: '#090d16', stripe: '#4ade80', hat: '#334155' }
];

export const SKIN_PRESETS: { name: string; skin: string; shadow: string }[] = [
  { name: 'Light Peach', skin: '#ffdbb5', shadow: '#e0a97b' },
  { name: 'Warm Olive', skin: '#f3c69f', shadow: '#cfa17a' },
  { name: 'Golden Tan', skin: '#d69e72', shadow: '#b07b52' },
  { name: 'Deep Bronze', skin: '#8d5524', shadow: '#6b3e17' }
];

export const RACKET_PRESETS: { name: string; color: string }[] = [
  { name: 'Yonex Orange', color: '#f97316' },
  { name: 'Volt Cyan', color: '#38bdf8' },
  { name: 'Champion Gold', color: '#facc15' },
  { name: 'Laser Magenta', color: '#ec4899' }
];

export const DEFAULT_P1_CUSTOM: PlayerCustomization = {
  username: 'SHEKHAR',
  hatStyle: 'HEADBAND',
  hatColor: JERSEY_PRESETS[2].hat,
  jerseyColor: JERSEY_PRESETS[2].primary,
  jerseyShadow: JERSEY_PRESETS[2].shadow,
  stripeColor: JERSEY_PRESETS[2].stripe,
  skinColor: SKIN_PRESETS[2].skin,
  skinShadow: SKIN_PRESETS[2].shadow,
  racketColor: RACKET_PRESETS[1].color
};

export const DEFAULT_P2_CUSTOM: PlayerCustomization = {
  username: 'GPT-OSS 120B',
  hatStyle: 'VISOR_GOGGLES',
  hatColor: '#7c3aed',
  jerseyColor: JERSEY_PRESETS[4].primary,
  jerseyShadow: JERSEY_PRESETS[4].shadow,
  stripeColor: JERSEY_PRESETS[4].stripe,
  skinColor: SKIN_PRESETS[0].skin,
  skinShadow: SKIN_PRESETS[0].shadow,
  racketColor: RACKET_PRESETS[2].color
};