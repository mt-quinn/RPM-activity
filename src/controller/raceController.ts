import { createInitialPlayer, performRoll } from '../game/logic';
import { Gear, PlayerState, RaceLeg, Weather } from '../game/types';
import { Phase, ParticipantMeta } from './types';
import { generateLeg } from '../game/race';

export interface RaceSnapshot {
  phase: Phase;
  participants: ParticipantMeta[];
  legIndex: number;
  maxLegs: number;
  leg?: RaceLeg;
  players: Record<string, PlayerState>;
  timeRemainingSec: number;
  scoreboard: { id: string; points: number }[];
}

export class RaceController {
  private hostId: string;
  private rng: () => number;
  private maxLegs: number = 3;
  private legTimeSec: number = 60;
  private checkpointSec: number = 20;
  private phase: Phase = Phase.Lobby;
  private legIndex = -1;
  private leg: RaceLeg | undefined;
  private timeRemainingSec = 0;
  private participants: Map<string, ParticipantMeta> = new Map();
  private players: Map<string, PlayerState> = new Map();
  private interval: number | undefined;

  constructor(hostId: string, rng: () => number) {
    this.hostId = hostId;
    this.rng = rng;
  }

  addParticipant(id: string, name: string) {
    if (!this.participants.has(id)) {
      this.participants.set(id, { id, name, ready: false });
      this.players.set(id, createInitialPlayer(id, name));
    }
  }

  setReady(id: string, ready: boolean) {
    const p = this.participants.get(id);
    if (!p) return;
    p.ready = ready;
  }

  startIfAllReady() {
    if (this.phase !== Phase.Lobby) return;
    const list = [...this.participants.values()];
    if (list.length === 0) return;
    if (list.every(p => p.ready)) {
      this.nextLeg();
    }
  }

  private nextLeg() {
    this.legIndex += 1;
    if (this.legIndex >= this.maxLegs) {
      this.phase = Phase.End;
      this.leg = undefined;
      this.timeRemainingSec = 0;
      return;
    }
    this.leg = generateLeg(this.legIndex, this.rng);
    this.phase = Phase.Leg;
    this.timeRemainingSec = this.legTimeSec;
    // Reset per-leg state
    for (const [id, player] of this.players) {
      this.players.set(id, {
        ...player,
        currentGear: Gear.FIRST,
        totalDistance: 0,
        rollHistory: [],
        isHeld: false,
        hasOvershot: false,
        shiftsThisLeg: 0,
        rollsRemaining: player.maxRollsAllowed,
      });
    }
  }

  tickOneSecond() {
    if (this.phase === Phase.Leg || this.phase === Phase.Checkpoint) {
      if (this.timeRemainingSec > 0) this.timeRemainingSec -= 1;
      if (this.timeRemainingSec <= 0) {
        if (this.phase === Phase.Leg) this.endLeg(); else this.nextLeg();
      }
    }
  }

  endLeg() {
    this.phase = Phase.Checkpoint;
    this.timeRemainingSec = this.checkpointSec;
    // Basic scoring: rank by proximity without going over; overshot = 0
    const leg = this.leg!;
    const valid = [...this.players.values()].filter(p => !p.hasOvershot);
    valid.sort((a, b) => Math.abs(a.totalDistance - leg.targetDistance) - Math.abs(b.totalDistance - leg.targetDistance));
    const basePoints = [10, 8, 7, 6, 5];
    valid.forEach((p, i) => {
      const points = basePoints[i] ?? 4;
      this.players.set(p.id, { ...p, points: p.points + points });
    });
  }

  roll(id: string) {
    if (this.phase !== Phase.Leg || !this.leg) return;
    const player = this.players.get(id);
    if (!player) return;
    const res = performRoll(player, this.leg, this.rng);
    const updated = res.player;
    if (updated.totalDistance > this.leg.targetDistance || res.immediateOvershoot) {
      updated.hasOvershot = true;
    }
    this.players.set(id, updated);
    // Early end if all are resolved
    const allDone = [...this.players.values()].every(p => p.isHeld || p.hasOvershot || p.rollsRemaining === 0);
    if (allDone) this.endLeg();
  }

  hold(id: string) {
    if (this.phase !== Phase.Leg) return;
    const p = this.players.get(id);
    if (!p) return;
    this.players.set(id, { ...p, isHeld: true });
  }

  shift(id: string, dir: -1 | 1) {
    const p = this.players.get(id);
    if (!p || this.phase !== Phase.Leg) return;
    const next = Math.min(5, Math.max(1, p.currentGear + dir)) as Gear;
    if (p.rollHistory.length === 0) return; // must roll before shifting
    if (p.isHeld || p.hasOvershot) return;
    this.players.set(id, { ...p, currentGear: next, shiftsThisLeg: p.shiftsThisLeg + 1 });
  }

  getSnapshot(): RaceSnapshot {
    const scoreboard = [...this.players.values()].map(p => ({ id: p.id, points: p.points }))
      .sort((a, b) => b.points - a.points);
    return {
      phase: this.phase,
      participants: [...this.participants.values()],
      legIndex: this.legIndex,
      maxLegs: this.maxLegs,
      leg: this.leg,
      players: Object.fromEntries([...this.players.entries()]),
      timeRemainingSec: this.timeRemainingSec,
      scoreboard
    };
  }
}


