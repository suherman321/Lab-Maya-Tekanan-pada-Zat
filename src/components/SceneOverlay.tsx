/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CameraPreset, PenetrationStatus, WoodSpecimen } from '../types/physics.ts';
import { Camera, Volume2, VolumeX, Sparkles, AlertCircle } from 'lucide-react';

interface SceneOverlayProps {
  wood: WoodSpecimen;
  pressurePa: number;
  status: PenetrationStatus;
  soundEnabled: boolean;
  cameraPreset: CameraPreset;
  onToggleSound: () => void;
  onSetCameraPreset: (preset: CameraPreset) => void;
}

export const SceneOverlay: React.FC<SceneOverlayProps> = ({
  wood,
  pressurePa,
  status,
  soundEnabled,
  cameraPreset,
  onToggleSound,
  onSetCameraPreset,
}) => {
  const pressureKPa = pressurePa / 1000;

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 1 }).format(num);
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-4 sm:p-5 overflow-hidden">
      {/* Top Floating Bar: Scene Info & Camera Controls */}
      <div className="flex items-center justify-between gap-3 pointer-events-auto">
        {/* Subtle Title Badge */}
        <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl px-3.5 py-2 shadow-lg backdrop-blur-none flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-sky-400" />
          <span className="text-xs font-semibold text-slate-200">
            Laboratorium Fisika 3D
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-[11px] font-mono text-slate-400">{wood.name}</span>
        </div>

        {/* Camera Presets & Sound */}
        <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-800/80 rounded-xl p-1.5 shadow-lg backdrop-blur-none">
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
            onClick={() => onSetCameraPreset('side')}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
              cameraPreset === 'side'
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            Samping
          </button>
          <button
            onClick={() => onSetCameraPreset('closeup')}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
              cameraPreset === 'closeup'
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            Ujung Paku
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

      {/* Center 3D Space is 100% Completely Clear! */}

      {/* Bottom Floating Simulation Outcome Banner */}
      {status === 'penetrated' && (
        <div className="self-center mb-3 pointer-events-auto bg-emerald-950/90 border border-emerald-500/80 text-emerald-100 rounded-2xl px-5 py-3 shadow-2xl flex items-center gap-3 animate-fade-in max-w-md">
          <Sparkles className="w-5 h-5 text-emerald-300 shrink-0" />
          <div className="text-xs">
            <p className="font-semibold text-emerald-200">Paku Berhasil Menembus Kayu!</p>
            <p className="text-emerald-300/90 mt-0.5">
              Tekanan ({formatNumber(pressureKPa)} kPa) melebihi batas ketahanan {wood.name} ({wood.thresholdKPa} kPa).
            </p>
          </div>
        </div>
      )}

      {status === 'stopped_surface' && (
        <div className="self-center mb-3 pointer-events-auto bg-amber-950/90 border border-amber-500/80 text-amber-100 rounded-2xl px-5 py-3 shadow-2xl flex items-center gap-3 animate-fade-in max-w-md">
          <AlertCircle className="w-5 h-5 text-amber-300 shrink-0" />
          <div className="text-xs">
            <p className="font-semibold text-amber-200">Paku Hanya Menempel di Permukaan</p>
            <p className="text-amber-300/90 mt-0.5">
              Tekanan ({formatNumber(pressureKPa)} kPa) belum mencapai batas tembus {wood.name} ({wood.thresholdKPa} kPa).
            </p>
          </div>
        </div>
      )}

      {/* Empty spacer if no banner */}
      {status !== 'penetrated' && status !== 'stopped_surface' && <div />}
    </div>
  );
};
