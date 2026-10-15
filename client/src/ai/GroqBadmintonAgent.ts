import * as THREE from 'three';
import { StrikeCategory } from '../core/InputManager.js';
import { Shuttlecock } from '../physics/Shuttlecock.js';
import { GroqModelId } from '../types/Customization.js';

export interface LLMShotPlan {
  shotCategory: StrikeCategory;
  targetX: number;
  targetZ: number;
  useJump: boolean;
  thought: string;
  latencyMs: number;
  modelUsed: string;
}

export interface CourtSnapshot {
  model: GroqModelId;
  apiKey: string;
  scores: [number, number];
  rallyCount: number;
  incomingShotType: string;
  shuttleStartPos: THREE.Vector3;
  shuttleVel: THREE.Vector3;
  humanPos: THREE.Vector3;
  humanStamina: number;
  botPos: THREE.Vector3;
  botStamina: number;
}

export class GroqBadmintonAgent {
  public currentPlan: LLMShotPlan | null = null;
  public predictedLanding = new THREE.Vector3(0, 0, -3.2);
  public isThinking = false;

  /**
   * Simulates the incoming shuttle trajectory to find where on the bot's court (-Z)
   * it will arrive, so the 60Hz footwork controller can run there while Groq thinks.
   */
  public predictInterceptPoint(startPos: THREE.Vector3, startVel: THREE.Vector3): THREE.Vector3 {
    const simPos = startPos.clone();
    const simVel = startVel.clone();
    const dt = 1 / 60;

    for (let i = 0; i < 180; i++) {
      Shuttlecock.stepAerodynamics(simPos, simVel, dt);
      if (simPos.z < -0.4 && simPos.y <= 1.45) {
        break;
      }
      if (simPos.y <= 0.1) break;
    }

    this.predictedLanding.set(
      THREE.MathUtils.clamp(simPos.x, -2.4, 2.4),
      Math.max(0.2, simPos.y),
      THREE.MathUtils.clamp(simPos.z, -6.4, -0.55)
    );
    return this.predictedLanding;
  }

  /**
   * Fired asynchronously the instant the human player hits the shuttle.
   * Queries Groq (`openai/gpt-oss-120b` or `qwen/qwen3.8-27b`) while the shuttle is in mid-air.
   */
  public async planNextShot(
    snap: CourtSnapshot,
    onPlanReady: (plan: LLMShotPlan) => void
  ): Promise<void> {
    const intercept = this.predictInterceptPoint(snap.shuttleStartPos, snap.shuttleVel);

    // Immediate smart fallback plan in case the shot is a point-blank drive (<120ms) or no API key
    this.currentPlan = this.createSmartFallbackPlan(snap, intercept, 'LOCAL TACTICS');

    if (!snap.apiKey || snap.model === 'CLASSIC_BOT') {
      onPlanReady(this.currentPlan);
      return;
    }

    this.isThinking = true;
    const t0 = performance.now();

    const systemPrompt =
      'You are a World-Class BWF Badminton AI playing on the Far Court (-Z). ' +
      'The human opponent is on the Near Court (+Z, where Z=0.5 is net, Z=6.6 is back baseline, X=-2.5 is left sideline, X=+2.5 is right sideline). ' +
      'Choose a tactical return shot to exploit open space on the human court. ' +
      'Respond ONLY with valid JSON matching: ' +
      '{"shotCategory":"ATTACK"|"ARC"|"FINESSE","targetX":number,"targetZ":number,"useJump":boolean,"thought":string}. ' +
      'Rules: ATTACK=Smash/Drive (targetZ 2.0 to 5.2), ARC=Deep High Clear (targetZ 5.2 to 6.4), FINESSE=Tight Drop/Net Shot (targetZ 0.9 to 2.2). ' +
      'Keep "thought" under 9 words (witty badminton tactic/taunt).';

    const userPrompt = JSON.stringify({
      score: { human: snap.scores[0], ai: snap.scores[1] },
      rally: snap.rallyCount,
      incomingShot: snap.incomingShotType,
      shuttleInterceptAtBotCourt: {
        x: Number(intercept.x.toFixed(2)),
        y: Number(intercept.y.toFixed(2)),
        z: Number(intercept.z.toFixed(2))
      },
      humanPosition: {
        x: Number(snap.humanPos.x.toFixed(2)),
        z: Number(snap.humanPos.z.toFixed(2)),
        stamina: Math.round(snap.humanStamina)
      }
    });

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + snap.apiKey.trim()
        },
        body: JSON.stringify({
          model: snap.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.35,
          max_completion_tokens: 130,
          response_format: { type: 'json_object' }
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        console.warn('[Groq API Error]:', errText);
        this.isThinking = false;
        return;
      }

      const data = await response.json();
      const rawContent = data?.choices?.[0]?.message?.content || '{}';
      const parsed = JSON.parse(rawContent);
      const latencyMs = Math.round(performance.now() - t0);

      const category: StrikeCategory =
        parsed.shotCategory === 'ATTACK' ||
        parsed.shotCategory === 'ARC' ||
        parsed.shotCategory === 'FINESSE'
          ? parsed.shotCategory
          : 'ATTACK';

      const llmPlan: LLMShotPlan = {
        shotCategory: category,
        targetX: THREE.MathUtils.clamp(Number(parsed.targetX) || 0, -2.35, 2.35),
        targetZ: THREE.MathUtils.clamp(Number(parsed.targetZ) || 3.8, 0.9, 6.45),
        useJump: Boolean(parsed.useJump) && intercept.y > 1.75,
        thought: String(parsed.thought || 'Exploiting open court!').slice(0, 68),
        latencyMs,
        modelUsed: snap.model
      };

      this.currentPlan = llmPlan;
      this.isThinking = false;
      onPlanReady(llmPlan);
    } catch (err) {
      console.warn('[Groq Agent Fallback]:', err);
      this.isThinking = false;
    }
  }

  private createSmartFallbackPlan(
    snap: CourtSnapshot,
    intercept: THREE.Vector3,
    label: string
  ): LLMShotPlan {
    // Aim away from the human player's current X and Z position
    const openX = snap.humanPos.x > 0 ? -1.85 : 1.85;
    const humanIsDeep = snap.humanPos.z > 3.6;
    const humanIsNearNet = snap.humanPos.z < 2.2;

    let shotCategory: StrikeCategory = 'ATTACK';
    let targetZ = 4.2;
    let thought = 'Punishing the open cross-court!';

    if (humanIsDeep) {
      shotCategory = 'FINESSE';
      targetZ = 1.45;
      thought = 'You are pinned deep—tight drop shot!';
    } else if (humanIsNearNet) {
      shotCategory = 'ARC';
      targetZ = 6.1;
      thought = 'Crowd the net? High clear over your head!';
    } else if (intercept.y > 1.8) {
      shotCategory = 'ATTACK';
      targetZ = 3.5;
      thought = 'High lift detected—unleashing Smash!';
    }

    return {
      shotCategory,
      targetX: openX + (Math.random() - 0.5) * 0.4,
      targetZ,
      useJump: shotCategory === 'ATTACK' && intercept.y > 1.85,
      thought,
      latencyMs: 0,
      modelUsed: label
    };
  }
}