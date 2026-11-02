import { WeightUnit } from '../types';

const KG_TO_LBS = 2.20462;

export function displayWeight(weightKg: number, unit: WeightUnit): number {
  if (unit === 'kg') {
    return Math.round(weightKg * 10) / 10;
  }
  // Round to nearest 0.5 lbs for clean gym numbers
  return Math.round(weightKg * KG_TO_LBS * 2) / 2;
}

export function toInternalKg(enteredValue: number, unit: WeightUnit): number {
  if (unit === 'kg') {
    return Math.round(enteredValue * 100) / 100;
  }
  return Math.round((enteredValue / KG_TO_LBS) * 100) / 100;
}

export function formatWeight(weightKg: number, unit: WeightUnit): string {
  const val = displayWeight(weightKg, unit);
  return `${val} ${unit}`;
}

export function getStepIncrement(defaultIncrementKg: number, unit: WeightUnit): number {
  if (defaultIncrementKg === 0) return unit === 'kg' ? 1 : 2.5;
  if (unit === 'kg') return defaultIncrementKg;
  // Convert typical increments cleanly in lbs
  if (defaultIncrementKg <= 1.25) return 2.5;
  if (defaultIncrementKg <= 2.5) return 5;
  return 10;
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  if (mins < 60) {
    return secs > 0 ? `${mins} min ${secs}s` : `${mins} min`;
  }
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;
  return `${hours}h${remMins.toString().padStart(2, '0')}`;
}
