/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface DamSimulationState {
  waterHeightM: number;    // Ketinggian air dalam meter (5 - 50 m)
  soundEnabled: boolean;
  cameraPreset: 'perspective' | 'cross_section' | 'water_face';
}

export const WATER_DENSITY = 1000; // kg/m³
export const GRAVITY = 9.8;        // m/s²
export const MAX_WATER_HEIGHT = 50; // meter
export const DAM_CREST_HEIGHT = 52; // meter
