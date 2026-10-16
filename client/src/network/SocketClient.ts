import { io, Socket } from 'socket.io-client';
import {
  LobbyStatePacket,
  MatchFormat,
  PlayerStatePacket,
  PointScoredPacket,
  ShuttleHitPacket,
  SlotIndex
} from '../../../server/src/types/packets.js';

export class SocketClient {
  public socket: Socket;
  public isOnline = false;
  public localSlot: SlotIndex = 0;
  public localSide: 0 | 1 = 0;
  public roomCode = '';
  public clockOffset = 0;
  public pingMs = 0;
  public currentLobby: LobbyStatePacket | null = null;

  constructor(
    serverUrl: string,
    private handlers: {
      onLobbyUpdate: (lobby: LobbyStatePacket, mySlot: SlotIndex) => void;
      onMatchStart: (info: {
        lobby: LobbyStatePacket;
        mySlot: SlotIndex;
        mySide: 0 | 1;
        servingSide: 0 | 1;
      }) => void;
      onOpponentState: (pkt: PlayerStatePacket) => void;
      onShuttleSync: (pkt: ShuttleHitPacket) => void;
      onPointScored: (pkt: PointScoredPacket) => void;
      onStatusChange: (text: string) => void;
    }
  ) {
    // Force pure WebSocket transport to eliminate HTTP polling lag
    this.socket = io(serverUrl, {
      autoConnect: false,
      transports: ['websocket'],
      upgrade: false
    });

    this.socket.on('connect', () => {
      this.syncClock();
      setInterval(() => {
        if (this.socket.connected) this.syncClock();
      }, 3000);
    });

    this.socket.on('LOBBY_UPDATE', (lobby: LobbyStatePacket) => {
      this.currentLobby = lobby;
      const me = lobby.slots.find((s) => s.socketId === this.socket.id);
      if (me) {
        this.localSlot = me.slotIndex;
        this.localSide = me.side;
      }
      this.handlers.onLobbyUpdate(lobby, this.localSlot);
    });

    this.socket.on(
      'MATCH_START',
      (data: { lobby: LobbyStatePacket; servingSide: 0 | 1 }) => {
        this.isOnline = true;
        this.currentLobby = data.lobby;
        const me = data.lobby.slots.find((s) => s.socketId === this.socket.id);
        if (me) {
          this.localSlot = me.slotIndex;
          this.localSide = me.side;
        }
        this.handlers.onStatusChange('Room ' + data.lobby.code + ' — LIVE');
        this.handlers.onMatchStart({
          lobby: data.lobby,
          mySlot: this.localSlot,
          mySide: this.localSide,
          servingSide: data.servingSide
        });
      }
    );

    this.socket.on('OPPONENT_STATE', (pkt: PlayerStatePacket) => {
      this.handlers.onOpponentState(pkt);
    });

    this.socket.on('SHUTTLE_SYNC', (pkt: ShuttleHitPacket) => {
      this.handlers.onShuttleSync(pkt);
    });

    this.socket.on('POINT_SCORED', (pkt: PointScoredPacket) => {
      this.handlers.onPointScored(pkt);
    });
  }

  /**
   * Returns current synchronized server timestamp in ms
   */
  public getServerNow(): number {
    return Date.now() + this.clockOffset;
  }

  public createRoom(
    nickname: string,
    matchFormat: MatchFormat = '1V1',
    targetPoints: 5 | 11 | 21 = 11
  ): void {
    if (!this.socket.connected) this.socket.connect();
    this.socket.emit(
      'CREATE_ROOM',
      { nickname, matchFormat, targetPoints },
      (res: {
        success: boolean;
        code: string;
        slotIndex: SlotIndex;
        lobby: LobbyStatePacket;
      }) => {
        if (res.success) {
          this.localSlot = res.slotIndex;
          this.localSide = (res.slotIndex % 2) as 0 | 1;
          this.roomCode = res.code;
          this.currentLobby = res.lobby;
          this.handlers.onLobbyUpdate(res.lobby, this.localSlot);
        }
      }
    );
  }

  public joinRoom(code: string, nickname: string): void {
    if (!this.socket.connected) this.socket.connect();
    this.socket.emit(
      'JOIN_ROOM',
      { code, nickname },
      (res: {
        success: boolean;
        code?: string;
        slotIndex?: SlotIndex;
        lobby?: LobbyStatePacket;
        error?: string;
      }) => {
        if (res.success && res.code && res.slotIndex !== undefined && res.lobby) {
          this.localSlot = res.slotIndex;
          this.localSide = (res.slotIndex % 2) as 0 | 1;
          this.roomCode = res.code;
          this.currentLobby = res.lobby;
          this.handlers.onLobbyUpdate(res.lobby, this.localSlot);
        } else {
          this.handlers.onStatusChange(res.error || 'Join failed');
        }
      }
    );
  }

  public switchSlot(targetSlot: SlotIndex): void {
    if (this.roomCode) {
      this.socket.emit('SWITCH_SLOT', { code: this.roomCode, targetSlot });
    }
  }

  public requestStartMatch(): void {
    this.socket.emit('REQUEST_START_MATCH');
  }

  public sendPlayerState(pkt: PlayerStatePacket): void {
    if (this.isOnline) {
      this.socket.volatile.emit('PLAYER_STATE', pkt);
    }
  }

  public sendShuttleHit(pkt: ShuttleHitPacket): void {
    if (this.isOnline) {
      this.socket.emit('SHUTTLE_HIT', pkt);
    }
  }

  public reportPoint(
    winnerSide: 0 | 1,
    reason: 'IN_BOUNDS' | 'OUT_OF_BOUNDS' | 'INTO_NET'
  ): void {
    if (this.isOnline) {
      this.socket.emit('REPORT_POINT', { winnerSide, reason });
    }
  }

  private syncClock(): void {
    const sent = Date.now();
    this.socket.emit(
      'PING_CLOCK',
      sent,
      (res: { clientSentTime: number; serverTime: number }) => {
        const now = Date.now();
        const rtt = now - res.clientSentTime;
        this.pingMs = Math.round(rtt);
        const estimatedOffset = res.serverTime - (now - rtt / 2);
        this.clockOffset =
          this.clockOffset === 0
            ? estimatedOffset
            : this.clockOffset * 0.7 + estimatedOffset * 0.3;
      }
    );
  }
}