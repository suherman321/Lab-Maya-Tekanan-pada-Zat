/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type SubmarineState = 'TERAPUNG' | 'MELAYANG' | 'TENGGELAM';

export interface SubmarineSimulationParams {
  ballastPercent: number; // 0% - 100%
  soundEnabled: boolean;
  cameraPreset: 'perspective' | 'side' | 'closeup';
}

export const WATER_DENSITY = 1000; // kg/m³
export const SUB_BASE_DENSITY_EMPTY = 860; // kg/m³ (tangki kosong/udara penuh)
export const SUB_BASE_DENSITY_FULL = 1140; // kg/m³ (tangki penuh air)

export function getSubmarineDensity(ballastPercent: number): number {
  return SUB_BASE_DENSITY_EMPTY + (ballastPercent / 100) * (SUB_BASE_DENSITY_FULL - SUB_BASE_DENSITY_EMPTY);
}

export function getSubmarineState(ballastPercent: number): SubmarineState {
  if (ballastPercent < 45) return 'TERAPUNG';
  if (ballastPercent <= 55) return 'MELAYANG';
  return 'TENGGELAM';
}
