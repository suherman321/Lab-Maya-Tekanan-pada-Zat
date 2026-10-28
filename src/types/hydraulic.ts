/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface HydraulicState {
  force1: number;       // Gaya tekan piston kecil (0 - 200 N)
  areaRatio: number;    // Rasio A2 / A1 (2x - 20x)
  loadWeight: number;   // Berat beban di piston besar (100 - 1000 N)
  isPumped: boolean;    // Status apakah tuas/piston ditekan
  soundEnabled: boolean;
  cameraPreset: 'perspective' | 'front' | 'piston';
}

export interface HydraulicSpecs {
  radius1: number;      // Radius silinder 1 (tetap, misal 0.35)
  radius2: number;      // Radius silinder 2 (berubah dinamis: r2 = r1 * sqrt(ratio))
  height: number;       // Tinggi silinder
  f2: number;           // Gaya angkat F2 = F1 * ratio
  isLifted: boolean;    // f2 >= loadWeight
  liftHeight: number;   // Ketinggian angkat piston 2
}
