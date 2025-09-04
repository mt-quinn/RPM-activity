import { RaceLeg, Weather } from './types';

const LEG_FIRST_WORDS = [
  'Wooded', 'City', 'Suburban', 'Highway', 'Mountainside', 'Desert', 'Canyon', 'Train', 'Country'
];
const LEG_SECOND_WORDS = [
  'Way', 'Streets', 'Sprawl', 'Sprint', 'Climb', 'Flats', 'Run', 'Tracks', 'Backroads'
];

export function randomLegName(rng: () => number): string {
  const f = LEG_FIRST_WORDS[Math.floor(rng() * LEG_FIRST_WORDS.length)];
  const s = LEG_SECOND_WORDS[Math.floor(rng() * LEG_SECOND_WORDS.length)];
  return `${f} ${s}`;
}

export function determineWeather(rng: () => number): Weather {
  const roll = rng();
  // Probabilities: Clear 0.5, Rain 0.125, Fog 0.125, Sweltering 0.125, Black Ice 0.125
  if (roll < 0.5) return Weather.CLEAR_SKIES;
  if (roll < 0.625) return Weather.RAIN;
  if (roll < 0.75) return Weather.FOG;
  if (roll < 0.875) return Weather.SWELTERING;
  return Weather.BLACK_ICE;
}

export function generateLeg(index: number, rng: () => number): RaceLeg {
  const name = randomLegName(rng);
  const targetDistance = 20 + Math.floor(rng() * 21); // 20..40
  const weather = index === 0 ? Weather.CLEAR_SKIES : determineWeather(rng);
  const isPoliceRaid = false; // Not used in single-leg demo
  const heatAtStart = 0;
  return { name, targetDistance, weather, isPoliceRaid, heatAtStart };
}


