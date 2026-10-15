import * as THREE from 'three';
import { Player } from '../entities/Player.js';
import { Shuttlecock } from '../physics/Shuttlecock.js';
import {
  PlayerStatePacket,
  ShuttleHitPacket,
  SlotIndex
} from '../../../server/src/types/packets.js';

export class Reconciler {
  private targetPositions: Record<SlotIndex, THREE.Vector3> = {
    0: new THREE.Vector3(0, 0, 3.2),
    1: new THREE.Vector3(0, 0, -3.2),
    2: new THREE.Vector3(-1.2, 0, 3.2),
    3: new THREE.Vector3(1.2, 0, -3.2)
  };

  public applyOpponentPacket(pkt: PlayerStatePacket, players: Player[]): void {
    const targetPlayer = players[pkt.slotIndex];
    if (!targetPlayer) return;
    this.targetPositions[pkt.slotIndex].set(pkt.x, pkt.y, pkt.z);
    targetPlayer.animState = pkt.anim;
    if (pkt.anim === 'SWING') {
      targetPlayer.triggerSwing();
    }
  }

  public interpolateRemotePlayers(
    dt: number,
    players: Player[],
    localSlot: SlotIndex,
    activeRemoteSlots: Set<SlotIndex>
  ): void {
    activeRemoteSlots.forEach((slot) => {
      if (slot === localSlot) return;
      const p = players[slot];
      if (!p) return;
      p.pos.lerp(this.targetPositions[slot], Math.min(1, dt * 15));
      p.syncMesh();
    });
  }

  public applyDeterministicHit(pkt: ShuttleHitPacket, shuttle: Shuttlecock): void {
    const startPos = new THREE.Vector3(...pkt.pos);
    const vel = new THREE.Vector3(...pkt.vel);
    shuttle.launch(startPos, vel, pkt.hitterSide, pkt.shotType, pkt.rallyCount);
  }
}