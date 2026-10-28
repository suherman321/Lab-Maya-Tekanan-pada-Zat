/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Camera, Volume2, VolumeX, Anchor, Sparkles } from 'lucide-react';
import { getSubmarineState, getSubmarineDensity } from '../types/submarine.ts';

interface SubmarineSceneOverlayProps {
  ballastPercent: number;
  cameraPreset: 'perspective' | 'side' | 'closeup';
  onSetCameraPreset: (preset: 'perspective' | 'side' | 'closeup') => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const SubmarineSceneOverlay: React.FC<SubmarineSceneOverlayProps> = ({
  ballastPercent,
  cameraPreset,
  onSetCameraPreset,
  soundEnabled,
  onToggleSound,
}) => {
  const state = getSubmarineState(ballastPercent);
  const density = getSubmarineDensity(ballastPercent);

  const getBadgeStyle = () => {
    switch (state) {
      case 'TERAPUNG':
        return 'border-emerald-500/80 bg-emerald-950/85 text-emerald-300 shadow-emerald-500/20';
      case 'MELAYANG':
        return 'border-amber-500/80 bg-amber-950/85 text-amber-300 shadow-amber-500/20';
      case 'TENGGELAM':
        return 'border-rose-500/80 bg-rose-950/85 text-rose-300 shadow-rose-500/20';
    }
  };

  const getDepthDescription = () => {
    if (state === 'TERAPUNG') return 'Kapal berada di permukaan lautan (Gaya apung Fa > W)';
    if (state === 'MELAYANG') return 'Kapal melayang seimbang di tengah kedalaman lautan (Fa = W)';
    return 'Kapal bertumpu di dasar lautan karena lebih padat dari air (Fa < W)';
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-4 sm:p-5 overflow-hidden">
      {/* Top Floating Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pointer-events-auto">
        <div className="bg-slate-950/85 border border-slate-800/80 rounded-xl px-3.5 py-2 shadow-lg flex items-center gap-2.5 backdrop-blur-sm">
          <Anchor className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-semibold text-slate-200">
            Simulasi Archimedes: Kapal Selam 3D
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-[11px] font-mono text-cyan-300">
            Tangki: {ballastPercent}% Air
          </span>
        </div>

        {/* Controls: Sound & Camera */}
        <div className="flex items-center gap-2">
          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            className={`p-2 rounded-xl border transition-colors shadow-lg pointer-events-auto backdrop-blur-sm ${
              soundEnabled
                ? 'bg-slate-900/90 border-slate-700 text-cyan-400 hover:text-cyan-300'
                : 'bg-slate-950/90 border-slate-800 text-slate-500 hover:text-slate-400'
            }`}
            title={soundEnabled ? 'Matikan Suara' : 'Aktifkan Suara'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Camera Presets */}
          <div className="flex items-center gap-1.5 bg-slate-950/85 border border-slate-800/80 rounded-xl p-1.5 shadow-lg backdrop-blur-sm pointer-events-auto">
            <Camera className="w-3.5 h-3.5 text-slate-400 ml-1" />
            <button
              onClick={() => onSetCameraPreset('perspective')}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                cameraPreset === 'perspective'
                  ? 'bg-cyan-500 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              Perspektif
            </button>
            <button
              onClick={() => onSetCameraPreset('side')}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                cameraPreset === 'side'
                  ? 'bg-cyan-500 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              Samping
            </button>
            <button
              onClick={() => onSetCameraPreset('closeup')}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                cameraPreset === 'closeup'
                  ? 'bg-cyan-500 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              Dekat
            </button>
          </div>
        </div>
      </div>

      {/* Center/Top-Right Status Badge (Requirement: "Tampilkan teks status besar di layar: 'TERAPUNG', 'MELAYANG', atau 'TENGGELAM'") */}
      <div className="flex flex-col items-start self-start mt-3 pointer-events-none">
        <div
          className={`border-2 rounded-2xl px-5 py-3 shadow-2xl backdrop-blur-md transition-all duration-300 ${getBadgeStyle()}`}
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            <span className="text-[11px] font-bold uppercase tracking-widest opacity-80">
              Kondisi Kapal Selam
            </span>
          </div>
          <div className="text-3xl font-black tracking-wider my-0.5 font-mono drop-shadow-md">
            {state}
          </div>
          <p className="text-xs font-medium opacity-90 max-w-xs leading-relaxed">
            {getDepthDescription()}
          </p>
          <div className="mt-2 pt-2 border-t border-current/20 flex items-center justify-between text-[11px] font-mono">
            <span>ρ_kapal: {density.toFixed(0)} kg/m³</span>
            <span className="mx-1">vs</span>
            <span>ρ_air: 1000 kg/m³</span>
          </div>
        </div>
      </div>

      {/* Bottom Hint */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 pointer-events-auto">
        <div className="bg-slate-950/80 border border-slate-800/80 rounded-lg px-3 py-1.5 backdrop-blur-sm">
          💡 Drag mouse / sentuh untuk putar kamera 360°, scroll untuk zoom.
        </div>
      </div>
    </div>
  );
};
