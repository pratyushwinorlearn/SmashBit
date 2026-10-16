import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server } from 'socket.io';
import { RoomManager } from './RoomManager.js';
import {
  MatchFormat,
  PlayerStatePacket,
  ShuttleHitPacket,
  SlotIndex
} from './types/packets.js';

const app = express();
app.use(cors());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', game: 'SmashBit Low-Latency Relay' });
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
  transports: ['websocket', 'polling'],
  pingInterval: 5000,
  pingTimeout: 10000
});

const roomManager = new RoomManager();

io.on('connection', (socket) => {
  socket.on('PING_CLOCK', (clientSentTime: number, ack) => {
    if (typeof ack === 'function') {
      ack({ clientSentTime, serverTime: Date.now() });
    }
  });

  socket.on(
    'CREATE_ROOM',
    (
      {
        nickname,
        matchFormat,
        targetPoints
      }: { nickname: string; matchFormat: MatchFormat; targetPoints: 5 | 11 | 21 },
      ack
    ) => {
      const room = roomManager.createRoom(
        socket.id,
        nickname,
        matchFormat || '1V1',
        targetPoints || 11
      );
      socket.join(room.code);
      const lobby = roomManager.toLobbyPacket(room);
      ack({ success: true, code: room.code, slotIndex: 0, lobby });
      io.to(room.code).emit('LOBBY_UPDATE', lobby);
    }
  );

  socket.on('JOIN_ROOM', ({ code, nickname }: { code: string; nickname: string }, ack) => {
    const joined = roomManager.joinRoom(code, socket.id, nickname);
    if (!joined) {
      ack({ success: false, error: 'Room not found or all slots are full!' });
      return;
    }
    const { room, assignedSlot } = joined;
    socket.join(room.code);
    const lobby = roomManager.toLobbyPacket(room);
    ack({ success: true, code: room.code, slotIndex: assignedSlot, lobby });
    io.to(room.code).emit('LOBBY_UPDATE', lobby);
  });

  socket.on('SWITCH_SLOT', ({ code, targetSlot }: { code: string; targetSlot: SlotIndex }) => {
    const room = roomManager.switchPlayerSlot(code, socket.id, targetSlot);
    if (room) {
      io.to(room.code).emit('LOBBY_UPDATE', roomManager.toLobbyPacket(room));
    }
  });

  socket.on('REQUEST_START_MATCH', () => {
    const room = roomManager.getRoomBySocket(socket.id);
    if (!room) return;
    room.referee.resetMatch();
    io.to(room.code).emit('MATCH_START', {
      lobby: roomManager.toLobbyPacket(room),
      servingSide: room.referee.servingSide,
      scores: room.referee.scores
    });
  });

  // Unreliable/volatile 60Hz player movement relay (never queues behind old packets)
  socket.on('PLAYER_STATE', (packet: PlayerStatePacket) => {
    const room = roomManager.getRoomBySocket(socket.id);
    if (!room) return;
    socket.volatile.to(room.code).emit('OPPONENT_STATE', packet);
  });

  // CRITICAL FIX: Use socket.to() so we DO NOT echo the hit back to the player who just hit it!
  socket.on('SHUTTLE_HIT', (packet: ShuttleHitPacket) => {
    const room = roomManager.getRoomBySocket(socket.id);
    if (!room) return;
    room.referee.isPointActive = true;
    room.referee.rallyCount = packet.rallyCount;
    socket.to(room.code).emit('SHUTTLE_SYNC', packet);
  });

  socket.on(
    'REPORT_POINT',
    ({
      winnerSide,
      reason
    }: {
      winnerSide: 0 | 1;
      reason: 'IN_BOUNDS' | 'OUT_OF_BOUNDS' | 'INTO_NET';
    }) => {
      const room = roomManager.getRoomBySocket(socket.id);
      if (!room || !room.referee.isPointActive) return;
      const result = roomManager.getRoomBySocket(socket.id)!.referee.registerPoint(winnerSide, reason);
      io.to(room.code).emit('POINT_SCORED', result);
    }
  );

  socket.on('disconnect', () => {
    const updatedRoom = roomManager.removeSocket(socket.id);
    if (updatedRoom) {
      io.to(updatedRoom.code).emit('LOBBY_UPDATE', roomManager.toLobbyPacket(updatedRoom));
    }
  });
});

const PORT = Number(process.env.PORT) || 4000;
server.listen(PORT, () => {
  console.log('[SmashBit Relay] Listening on http://localhost:' + PORT);
});