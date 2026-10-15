import { MatchReferee } from './MatchReferee.js';
import {
  LobbyPlayerSlot,
  LobbyStatePacket,
  MatchFormat,
  SlotIndex
} from './types/packets.js';

export interface GameRoom {
  code: string;
  hostSocketId: string;
  matchFormat: MatchFormat;
  targetPoints: 5 | 11 | 21;
  slots: LobbyPlayerSlot[];
  referee: MatchReferee;
}

export class RoomManager {
  private rooms = new Map<string, GameRoom>();

  private createDefaultSlots(format: MatchFormat): LobbyPlayerSlot[] {
    const count = format === '2V2' ? 4 : 2;
    const slots: LobbyPlayerSlot[] = [];
    for (let i = 0; i < count; i++) {
      const slotIndex = i as SlotIndex;
      const side = (i % 2) as 0 | 1;
      slots.push({
        slotIndex,
        side,
        socketId: null,
        nickname: 'AI PARTNER ' + (i + 1),
        isAI: true
      });
    }
    return slots;
  }

  public createRoom(
    socketId: string,
    nickname: string,
    matchFormat: MatchFormat = '1V1',
    targetPoints: 5 | 11 | 21 = 11
  ): GameRoom {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    do {
      code = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    } while (this.rooms.has(code));

    const slots = this.createDefaultSlots(matchFormat);
    slots[0] = {
      slotIndex: 0,
      side: 0,
      socketId,
      nickname: nickname || 'PLAYER 1',
      isAI: false
    };

    const room: GameRoom = {
      code,
      hostSocketId: socketId,
      matchFormat,
      targetPoints,
      slots,
      referee: new MatchReferee()
    };
    this.rooms.set(code, room);
    return room;
  }

  public joinRoom(
    code: string,
    socketId: string,
    nickname: string
  ): { room: GameRoom; assignedSlot: SlotIndex } | null {
    const cleanCode = code.trim().toUpperCase();
    const room = this.rooms.get(cleanCode);
    if (!room) return null;

    // Check if already in room
    const existing = room.slots.find((s) => s.socketId === socketId);
    if (existing) {
      return { room, assignedSlot: existing.slotIndex };
    }

    // Find first open AI slot
    const openSlot = room.slots.find((s) => s.isAI);
    if (!openSlot) return null;

    openSlot.socketId = socketId;
    openSlot.nickname = nickname || 'PLAYER ' + (openSlot.slotIndex + 1);
    openSlot.isAI = false;

    return { room, assignedSlot: openSlot.slotIndex };
  }

  public switchPlayerSlot(code: string, socketId: string, targetSlot: SlotIndex): GameRoom | null {
    const room = this.rooms.get(code);
    if (!room) return null;

    const current = room.slots.find((s) => s.socketId === socketId);
    const dest = room.slots.find((s) => s.slotIndex === targetSlot);
    if (!current || !dest || !dest.isAI) return null;

    // Swap human into target slot and reset old slot to AI
    dest.socketId = current.socketId;
    dest.nickname = current.nickname;
    dest.isAI = false;

    current.socketId = null;
    current.nickname = 'AI BOT ' + (current.slotIndex + 1);
    current.isAI = true;

    return room;
  }

  public toLobbyPacket(room: GameRoom): LobbyStatePacket {
    return {
      code: room.code,
      hostSocketId: room.hostSocketId,
      matchFormat: room.matchFormat,
      targetPoints: room.targetPoints,
      slots: room.slots
    };
  }

  public getRoomBySocket(socketId: string): GameRoom | undefined {
    for (const room of this.rooms.values()) {
      if (room.slots.some((s) => s.socketId === socketId)) {
        return room;
      }
    }
    return undefined;
  }

  public removeSocket(socketId: string): GameRoom | null {
    for (const [code, room] of this.rooms.entries()) {
      const slot = room.slots.find((s) => s.socketId === socketId);
      if (slot) {
        slot.socketId = null;
        slot.nickname = 'AI BOT ' + (slot.slotIndex + 1);
        slot.isAI = true;

        const remainingHumans = room.slots.filter((s) => !s.isAI);
        if (remainingHumans.length === 0) {
          this.rooms.delete(code);
          return null;
        }
        if (room.hostSocketId === socketId) {
          room.hostSocketId = remainingHumans[0].socketId!;
        }
        return room;
      }
    }
    return null;
  }
}