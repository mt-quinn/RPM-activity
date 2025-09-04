import { createInitialPlayer, performRoll, applyOvershootDamage } from '../game/logic';
import { DamageSeverity, DamageType, Gear, PlayerState, RaceLeg } from '../game/types';
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
  private raceHeat = 0;
  private legUnderdogId: string | null = null;
  private legLeaderId: string | null = null;
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
    // Police raid check at leg start
    const raidRoll = 1 + Math.floor(this.rng() * 20);
    const isRaid = raidRoll <= this.raceHeat;
    if (this.leg) {
      this.leg.isPoliceRaid = isRaid;
      this.leg.heatAtStart = this.raceHeat;
    }
    if (isRaid) this.raceHeat = Math.max(0, this.raceHeat - 10);
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
    // Determine underdog/leader by total points at start of leg
    const arr = [...this.players.values()];
    if (arr.length) {
      arr.sort((a, b) => a.points - b.points);
      this.legUnderdogId = arr[0].id;
      this.legLeaderId = arr[arr.length - 1].id;
    } else {
      this.legUnderdogId = null;
      this.legLeaderId = null;
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
    valid.sort((a, b) => {
      const da = Math.abs(a.totalDistance - leg.targetDistance);
      const db = Math.abs(b.totalDistance - leg.targetDistance);
      if (da !== db) return da - db;
      return b.totalDistance - a.totalDistance; // tie-breaker by higher total
    });
    const basePoints = [10, 8, 7, 6, 5];
    const legNum = this.legIndex + 1;
    const firstThirdEnd = Math.ceil(this.maxLegs / 3);
    const secondThirdEnd = Math.ceil((this.maxLegs * 2) / 3);
    const multiplier = legNum <= firstThirdEnd ? 1.0 : legNum <= secondThirdEnd ? 1.5 : 2.0;

    // Determine leader rank for underdog comparison
    const leaderIndex = this.legLeaderId ? valid.findIndex(p => p.id === this.legLeaderId) : -1;

    valid.forEach((p, i) => {
      const distanceDiff = Math.abs(p.totalDistance - leg.targetDistance);
      let precision = 0;
      if (distanceDiff === 0) precision = 5;
      else if (distanceDiff <= 2) precision = 3;
      else if (distanceDiff <= 5) precision = 2;

      let underdog = 0;
      if (this.legUnderdogId && p.id === this.legUnderdogId) {
        const leaderOvershot = this.legLeaderId ? (this.players.get(this.legLeaderId)?.hasOvershot ?? false) : false;
        if (leaderOvershot || (leaderIndex >= 0 && i < leaderIndex)) underdog = 8;
      }

      const subtotal = (basePoints[i] ?? 4) + precision + underdog;
      const finalPts = Math.ceil(subtotal * multiplier);
      this.players.set(p.id, { ...p, points: p.points + finalPts });
    });
  }

  roll(id: string) {
    if (this.phase !== Phase.Leg || !this.leg) return;
    const player = this.players.get(id);
    if (!player) return;
    const res = performRoll(player, this.leg, this.rng);
    let updated = res.player;
    const overshootAmount = updated.totalDistance - this.leg.targetDistance;
    if (overshootAmount > 0 || res.immediateOvershoot) {
      // Heat: base 1 + muffler bonus from existing damage
      const existingMuffler = updated.damage.find(d => d.type === DamageType.MUFFLER);
      const mufflerBonus = existingMuffler ? (existingMuffler.severity === DamageSeverity.MINOR ? 1 : existingMuffler.severity === DamageSeverity.MODERATE ? 2 : existingMuffler.severity === DamageSeverity.MAJOR ? 3 : 4) : 0;
      this.raceHeat += 1 + mufflerBonus;
      // Apply damage
      const dmg = applyOvershootDamage(updated, Math.max(1, overshootAmount), this.rng);
      updated = dmg.player;
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

  repair(id: string) {
    if (this.phase !== Phase.Checkpoint) return false;
    const p = this.players.get(id);
    if (!p || p.maxRollsAllowed <= 1 || p.damage.length === 0) return false;
    this.players.set(id, { ...p, damage: [], maxRollsAllowed: p.maxRollsAllowed - 1, rollsRemaining: Math.min(p.rollsRemaining, p.maxRollsAllowed - 1) });
    return true;
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


