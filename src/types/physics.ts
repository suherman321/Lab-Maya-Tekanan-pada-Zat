/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type LabTabId = 'solid' | 'liquid' | 'gas' | 'applications' | 'submarine';

export interface LabTab {
  id: LabTabId;
  label: string;
  topic: string;
  formula: string;
}

export const LAB_TABS: LabTab[] = [
  { id: 'solid', label: 'Zat Padat', topic: 'Paku & Luas Penampang', formula: 'P = F / A' },
  { id: 'liquid', label: 'Zat Cair', topic: 'Tekanan Hidrostatis & Pascal', formula: 'P = ρ · g · h' },
  { id: 'gas', label: 'Zat Gas', topic: 'Tekanan Udara & Hukum Boyle', formula: 'P · V = k' },
  { id: 'applications', label: 'Penerapan', topic: 'Teknologi & Bendungan', formula: 'P = ρ · g · h' },
  { id: 'submarine', label: 'Kapal Selam', topic: 'Hukum Archimedes', formula: 'Fa = ρ · g · V' },
];

export interface WoodSpecimen {
  id: string;
  name: string;
  hardnessName: string;
  thresholdKPa: number; // in kPa (e.g., 300 kPa)
  colorHex: string;
  grainColorHex: string;
  description: string;
}

export type CameraPreset = 'perspective' | 'side' | 'closeup' | 'top';

export type PenetrationStatus = 'idle' | 'pressing' | 'penetrated' | 'stopped_surface' | 'resetting';

export interface SimulationState {
  forceN: number; // Gaya tekan (0 - 100 N)
  areaCm2: number; // Luas ujung paku (0.1 - 5.0 cm²)
  woodId: string;
  status: PenetrationStatus;
  soundEnabled: boolean;
  cameraPreset: CameraPreset;
  zenMode: boolean;
}

export const WOOD_PRESETS: WoodSpecimen[] = [
  {
    id: 'balsa',
    name: 'Kayu Balsa',
    hardnessName: 'Lunak',
    thresholdKPa: 150,
    colorHex: '#e8d8b8',
    grainColorHex: '#cbb387',
    description: 'Serat sangat ringan dan empuk, mudah ditembus bahkan dengan tekanan sedang.',
  },
  {
    id: 'pinus',
    name: 'Kayu Pinus',
    hardnessName: 'Sedang (Standar)',
    thresholdKPa: 300,
    colorHex: '#d4a373',
    grainColorHex: '#aa7842',
    description: 'Kayu konstruksi standar dengan serat berkerapatan menengah.',
  },
  {
    id: 'jati',
    name: 'Kayu Jati (Teak)',
    hardnessName: 'Keras & Padat',
    thresholdKPa: 600,
    colorHex: '#8b5a2b',
    grainColorHex: '#5c3814',
    description: 'Kayu keras tahan benturan tinggi; butuh paku tajam & gaya besar untuk menembus.',
  },
];
