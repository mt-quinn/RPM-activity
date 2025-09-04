export enum Gear {
  FIRST = 1,
  SECOND = 2,
  THIRD = 3,
  FOURTH = 4,
  FIFTH = 5,
}

export const GearDie: Record<Gear, number> = {
  [Gear.FIRST]: 4,
  [Gear.SECOND]: 6,
  [Gear.THIRD]: 8,
  [Gear.FOURTH]: 10,
  [Gear.FIFTH]: 20,
};

export enum Weather {
  CLEAR_SKIES = 'Clear Skies',
  RAIN = 'Rain',
  FOG = 'Fog',
  SWELTERING = 'Sweltering',
  BLACK_ICE = 'Black Ice',
}

export enum DamageType {
  ENGINE = 'Engine Damage',
  FUEL = 'Fuel System Damage',
  NAVIGATION = 'Navigation System Damage',
  WINDSHIELD = 'Windshield Damage',
  MUFFLER = 'Muffler Damage',
  TRACTION_CONTROL = 'Traction Control Damage',
}

export enum DamageSeverity {
  MINOR = 'Minor',
  MODERATE = 'Moderate',
  MAJOR = 'Major',
  SEVERE = 'Severe',
}

export interface Damage {
  type: DamageType;
  severity: DamageSeverity;
}

export interface PlayerState {
  id: string;
  username: string;
  currentGear: Gear;
  totalDistance: number;
  rollHistory: Array<{ gear: Gear; rolls: number[]; final: number }>;
  isHeld: boolean;
  hasOvershot: boolean;
  points: number;
  rollsRemaining: number;
  maxRollsAllowed: number;
  damage: Damage[];
  shiftsThisLeg: number;
  mustShift: boolean;
}

export interface RaceLeg {
  name: string;
  targetDistance: number;
  weather: Weather;
  isPoliceRaid: boolean;
  heatAtStart: number;
}

export interface RaceState {
  players: Record<string, PlayerState>;
  currentLegIndex: number;
  legs: RaceLeg[];
  raceHeat: number;
  maxLegs: number;
}


