/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Camera, Volume2, VolumeX, Sparkles, Wind } from 'lucide-react';
import { GAS_CONSTANT_PV } from '../types/gas.ts';

interface GasSceneOverlayProps {
  volumeCm3: number;
  soundEnabled: boolean;
  cameraPreset: 'perspective' | 'front' | 'closeup';
  onToggleSound: () => void;
  onSetCameraPreset: (preset: 'perspective' | 'front' | 'closeup') => void;
}

export const GasSceneOverlay: React.FC<GasSceneOverlayProps> = ({
  volumeCm3,
  soundEnabled,
  cameraPreset,
  onToggleSound,
  onSetCameraPreset,
}) => {
  const pressureKPa = GAS_CONSTANT_PV / volumeCm3;
  const pressureAtm = pressureKPa / 101.3;

  return (
    <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-4 sm:p-5 overflow-hidden">
      {/* Top Floating Bar */}
      <div className="flex items-center justify-between gap-3 pointer-events-auto">
        <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl px-3.5 py-2 shadow-lg flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-sky-400" />
          <span className="text-xs font-semibold text-slate-200">
            Silinder Gas Kinetik 3D
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-[11px] font-mono text-emerald-400">
            {pressureAtm.toFixed(1)} atm
          </span>
        </div>

        {/* Camera Presets & Sound */}
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
            onClick={() => onSetCameraPreset('front')}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
              cameraPreset === 'front'
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            Depan
          </button>
          <button
            onClick={() => onSetCameraPreset('closeup')}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
              cameraPreset === 'closeup'
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            Dekat
          </button>

          <div className="w-px h-4 bg-slate-800 mx-1" />

          <button
            onClick={onToggleSound}
            title={soundEnabled ? 'Matikan Suara' : 'Nyalakan Suara'}
            className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-500" />
            )}
          </button>
        </div>
      </div>

      {/* Floating Info Pill at Bottom Center */}
      <div className="self-center mb-3 pointer-events-auto bg-slate-950/85 border border-slate-800/90 rounded-2xl px-4 py-2.5 shadow-2xl flex items-center gap-2.5 text-xs text-slate-300 max-w-sm">
        <Wind className="w-4 h-4 text-emerald-400 shrink-0" />
        <div>
          <span className="font-semibold text-white">Partikel Gas Kinetik</span>: Tumbukan partikel ke dinding silinder bertambah sering saat volume dikompresi.
        </div>
      </div>
    </div>
  );
};
