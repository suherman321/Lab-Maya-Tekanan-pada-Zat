/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface GasSimulationState {
  volumeCm3: number;       // Volume silinder (20 - 100 cm³)
  initialVolume: number;   // V1 = 100 cm³
  initialPressure: number; // P1 = 101.3 kPa (1 atm)
  soundEnabled: boolean;
  cameraPreset: 'perspective' | 'front' | 'closeup';
}

export const GAS_INITIAL_V = 100; // cm³
export const GAS_INITIAL_P = 101.3; // kPa (1 atm)
export const GAS_CONSTANT_PV = GAS_INITIAL_V * GAS_INITIAL_P; // 10130 kPa·cm³
