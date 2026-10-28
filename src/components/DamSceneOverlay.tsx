/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Camera, Waves } from 'lucide-react';
import { WATER_DENSITY, GRAVITY } from '../types/dam.ts';

interface DamSceneOverlayProps {
  waterHeightM: number;
  cameraPreset: 'perspective' | 'cross_section' | 'water_face';
  onSetCameraPreset: (preset: 'perspective' | 'cross_section' | 'water_face') => void;
}

export const DamSceneOverlay: React.FC<DamSceneOverlayProps> = ({
  waterHeightM,
  cameraPreset,
  onSetCameraPreset,
}) => {
  const pressureBottomKPa = (WATER_DENSITY * GRAVITY * waterHeightM) / 1000;

  return (
    <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-4 sm:p-5 overflow-hidden">
      {/* Top Floating Bar */}
      <div className="flex items-center justify-between gap-3 pointer-events-auto">
        <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl px-3.5 py-2 shadow-lg flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-sky-400" />
          <span className="text-xs font-semibold text-slate-200">
            Struktur Bendungan 3D (Trapesium)
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-[11px] font-mono text-emerald-400">
            Kedalaman: {waterHeightM} m
          </span>
        </div>

        {/* Camera Presets */}
        <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-800/80 rounded-xl p-1.5 shadow-lg">
          <Camera className="w-3.5 h-3.5 text-slate-400 ml-1" />
          <button
            onClick={() => onSetCameraPreset('perspective')}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
              cameraPreset === 'perspective'
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            Perspektif
          </button>
          <button
            onClick={() => onSetCameraPreset('cross_section')}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
              cameraPreset === 'cross_section'
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            Penampang Samping
          </button>
          <button
            onClick={() => onSetCameraPreset('water_face')}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
              cameraPreset === 'water_face'
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            Dinding Air
          </button>
        </div>
      </div>

      {/* Floating Callout at Bottom Center */}
      <div className="self-center mb-3 pointer-events-auto bg-slate-950/90 border border-slate-800/90 rounded-2xl px-4 py-2.5 shadow-2xl flex items-center gap-2.5 text-xs text-slate-300 max-w-md">
        <Waves className="w-4 h-4 text-sky-400 shrink-0" />
        <div>
          <span className="font-semibold text-white">Prinsip Konstruksi:</span> Bagian dasar bendungan dibuat jauh lebih tebal untuk menahan tekanan air maksimum di dasar ({pressureBottomKPa.toFixed(0)} kPa).
        </div>
      </div>
    </div>
  );
};
