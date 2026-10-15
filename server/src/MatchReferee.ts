import { PointScoredPacket } from './types/packets.js';

export class MatchReferee {
  public scores: [number, number] = [0, 0];
  public servingSide: 0 | 1 = 0;
  public rallyCount = 0;
  public isPointActive = false;

  public resetMatch(): void {
    this.scores = [0, 0];
    this.servingSide = 0;
    this.rallyCount = 0;
    this.isPointActive = false;
  }

  public registerPoint(
    winnerSide: 0 | 1,
    reason: PointScoredPacket['reason']
  ): PointScoredPacket {
    this.scores[winnerSide] += 1;
    this.servingSide = winnerSide;
    this.rallyCount = 0;
    this.isPointActive = false;

    const [s0, s1] = this.scores;
    let matchWinner: 0 | 1 | null = null;

    // BWF Rules: First to 21 with 2-point lead, or first to 30
    if ((s0 >= 21 && s0 - s1 >= 2) || s0 === 30) matchWinner = 0;
    if ((s1 >= 21 && s1 - s0 >= 2) || s1 === 30) matchWinner = 1;

    return {
      winnerSide,
      reason,
      scores: [...this.scores] as [number, number],
      servingSide: this.servingSide,
      matchWinner
    };
  }
}
