import { Damage, DamageSeverity, DamageType, Gear, GearDie, PlayerState, RaceLeg, RaceState, Weather } from './types';

export function createInitialPlayer(id: string, username: string): PlayerState {
  return {
    id,
    username,
    currentGear: Gear.FIRST,
    totalDistance: 0,
    rollHistory: [],
    isHeld: false,
    hasOvershot: false,
    points: 0,
    rollsRemaining: 7,
    maxRollsAllowed: 7,
    damage: [],
    shiftsThisLeg: 0,
    mustShift: false,
  };
}

export function maxGearAllowed(player: PlayerState): Gear {
  const eng = player.damage.find(d => d.type === DamageType.ENGINE);
  if (!eng) return Gear.FIFTH;
  switch (eng.severity) {
    case DamageSeverity.SEVERE: return Gear.FIRST;
    case DamageSeverity.MAJOR: return Gear.SECOND;
    case DamageSeverity.MODERATE: return Gear.THIRD;
    case DamageSeverity.MINOR: return Gear.FOURTH;
  }
}

export function canShiftUp(player: PlayerState): boolean {
  if (player.currentGear === Gear.FIFTH || player.isHeld || player.hasOvershot) return false;
  if (player.rollHistory.length === 0) return false;
  return player.currentGear.valueOf() < maxGearAllowed(player).valueOf();
}

export function canShiftDown(player: PlayerState): boolean {
  if (player.currentGear === Gear.FIRST || player.isHeld || player.hasOvershot) return false;
  if (player.rollHistory.length === 0) return false;
  return true;
}

export function shiftUp(player: PlayerState): PlayerState {
  if (!canShiftUp(player)) return player;
  const next = (player.currentGear.valueOf() + 1) as Gear;
  return { ...player, currentGear: next, shiftsThisLeg: player.shiftsThisLeg + 1, mustShift: false };
}

export function shiftDown(player: PlayerState): PlayerState {
  if (!canShiftDown(player)) return player;
  const next = (player.currentGear.valueOf() - 1) as Gear;
  return { ...player, currentGear: next, shiftsThisLeg: player.shiftsThisLeg + 1, mustShift: false };
}

export function determineWeatherRoll(weather: Weather, die: number, rng: () => number): { rolls: number[]; value: number } {
  const r1 = 1 + Math.floor(rng() * die);
  if (weather === Weather.RAIN || weather === Weather.FOG) {
    const r2 = 1 + Math.floor(rng() * die);
    return { rolls: [r1, r2], value: weather === Weather.RAIN ? Math.max(r1, r2) : Math.min(r1, r2) };
  }
  return { rolls: [r1], value: r1 };
}

export function applyTractionCap(value: number, player: PlayerState): number {
  const tc = player.damage.find(d => d.type === DamageType.TRACTION_CONTROL);
  if (!tc) return value;
  const thresholds: Record<DamageSeverity, number> = {
    [DamageSeverity.MINOR]: 18,
    [DamageSeverity.MODERATE]: 15,
    [DamageSeverity.MAJOR]: 12,
    [DamageSeverity.SEVERE]: 9,
  };
  const t = thresholds[tc.severity];
  return value > t ? 20 : value;
}

export function forcedGearFromFuel(player: PlayerState): Gear | null {
  const fuel = player.damage.find(d => d.type === DamageType.FUEL);
  if (!fuel) return null;
  const forcedCounts: Record<DamageSeverity, number> = {
    [DamageSeverity.MINOR]: 1,
    [DamageSeverity.MODERATE]: 2,
    [DamageSeverity.MAJOR]: 3,
    [DamageSeverity.SEVERE]: 4,
  };
  const rollsLeft = player.maxRollsAllowed - player.rollHistory.length;
  return rollsLeft <= forcedCounts[fuel.severity] ? Gear.FIFTH : null;
}

export function performRoll(player: PlayerState, leg: RaceLeg, rng: () => number): { player: PlayerState; value: number; immediateOvershoot: boolean; requiresShiftAfter: boolean } {
  if (player.rollsRemaining <= 0 || player.isHeld || player.hasOvershot) return { player, value: 0, immediateOvershoot: false, requiresShiftAfter: false };
  if (player.mustShift) return { player, value: 0, immediateOvershoot: false, requiresShiftAfter: true };

  const forced = forcedGearFromFuel(player);
  let gearToRoll = forced ?? player.currentGear;
  const maxAllowed = maxGearAllowed(player);
  if (!forced || forced !== Gear.FIFTH) {
    if (gearToRoll.valueOf() > maxAllowed.valueOf()) gearToRoll = maxAllowed;
  }

  const die = GearDie[gearToRoll];
  const { rolls, value: weatherValue } = determineWeatherRoll(leg.weather, die, rng);

  let value = applyTractionCap(weatherValue, player);
  if (leg.isPoliceRaid) value *= 2;

  const updated: PlayerState = {
    ...player,
    currentGear: forced ? forced : player.currentGear,
    totalDistance: player.totalDistance + value,
    rollsRemaining: player.rollsRemaining - 1,
    rollHistory: [...player.rollHistory, { gear: gearToRoll, rolls, final: value }],
  };

  const immediateOvershoot = leg.weather === Weather.BLACK_ICE && gearToRoll === Gear.FIFTH && rolls[0] > 15;
  const requiresShiftAfter = leg.weather === Weather.SWELTERING && !forced;
  updated.mustShift = requiresShiftAfter;
  return { player: updated, value, immediateOvershoot, requiresShiftAfter };
}

export function applyOvershootDamage(player: PlayerState, overshootAmount: number, rng: () => number): { player: PlayerState; damage: Damage } {
  const severities: [DamageSeverity, number][] = [
    [DamageSeverity.MINOR, 5],
    [DamageSeverity.MODERATE, 10],
    [DamageSeverity.MAJOR, 15],
    [DamageSeverity.SEVERE, Infinity],
  ];
  const severity = severities.find(([_, max]) => overshootAmount <= max)?.[0] ?? DamageSeverity.MINOR;
  const types = [
    DamageType.ENGINE,
    DamageType.FUEL,
    DamageType.NAVIGATION,
    DamageType.WINDSHIELD,
    DamageType.MUFFLER,
    DamageType.TRACTION_CONTROL,
  ];
  const t = types[Math.floor(rng() * types.length)];

  // Upgrade existing or add new
  const idx = player.damage.findIndex(d => d.type === t);
  let newDamage: Damage;
  if (idx >= 0) {
    const order = [DamageSeverity.MINOR, DamageSeverity.MODERATE, DamageSeverity.MAJOR, DamageSeverity.SEVERE];
    const cur = player.damage[idx];
    const curIdx = order.indexOf(cur.severity);
    const inc = severity === DamageSeverity.MINOR ? 1 : severity === DamageSeverity.MODERATE ? 2 : severity === DamageSeverity.MAJOR ? 3 : 4;
    const next = order[Math.min(curIdx + inc, order.length - 1)];
    newDamage = { type: t, severity: next };
    const newList = [...player.damage];
    newList[idx] = newDamage;
    return { player: { ...player, hasOvershot: true, damage: newList }, damage: newDamage };
  } else {
    newDamage = { type: t, severity };
    return { player: { ...player, hasOvershot: true, damage: [...player.damage, newDamage] }, damage: newDamage };
  }
}


