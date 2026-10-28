/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Camera, Volume2, VolumeX, Sparkles, AlertCircle } from 'lucide-react';

interface HydraulicSceneOverlayProps {
  force1: number;
  areaRatio: number;
  loadWeight: number;
  isPumped: boolean;
  soundEnabled: boolean;
  cameraPreset: 'perspective' | 'front' | 'piston';
  onToggleSound: () => void;
  onSetCameraPreset: (preset: 'perspective' | 'front' | 'piston') => void;
}

export const HydraulicSceneOverlay: React.FC<HydraulicSceneOverlayProps> = ({
  force1,
  areaRatio,
  loadWeight,
  isPumped,
  soundEnabled,
  cameraPreset,
  onToggleSound,
  onSetCameraPreset,
}) => {
  const force2 = force1 * areaRatio;
  const canLift = force2 >= loadWeight && force1 > 0;

  return (
    <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-4 sm:p-5 overflow-hidden">
      {/* Top Floating Bar */}
      <div className="flex items-center justify-between gap-3 pointer-events-auto">
        <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl px-3.5 py-2 shadow-lg flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-xs font-semibold text-slate-200">
            Dongkrak Hidrolik 3D
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-[11px] font-mono text-sky-400">Fluida Hidrolik Biru</span>
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
            onClick={() => onSetCameraPreset('piston')}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
              cameraPreset === 'piston'
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            Piston 1
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

      {/* Floating 3D Labels identifying components */}
      <div className="hidden sm:flex justify-between items-center px-12 pb-4 text-xs font-mono pointer-events-none">
        <div className="bg-slate-950/75 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-300">
          Silinder 1 (Input): <span className="text-rose-400 font-bold">F₁ = {force1} N</span>
        </div>
        <div className="bg-slate-950/75 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-300">
          Silinder 2 (Output): <span className="text-emerald-400 font-bold">F₂ = {force2} N</span> | Beban: <span className="text-amber-400 font-bold">W = {loadWeight} N</span>
        </div>
      </div>

      {/* Bottom Floating Outcome Banner */}
      {isPumped && canLift && (
        <div className="self-center mb-3 pointer-events-auto bg-emerald-950/90 border border-emerald-500/80 text-emerald-100 rounded-2xl px-5 py-3 shadow-2xl flex items-center gap-3 animate-fade-in max-w-md">
          <Sparkles className="w-5 h-5 text-emerald-300 shrink-0" />
          <div className="text-xs">
            <p className="font-semibold text-emerald-200">Beban Berhasil Terangkat Naik!</p>
            <p className="text-emerald-300/90 mt-0.5">
              Gaya angkat output ({force2} N) lebih besar dari berat beban ({loadWeight} N). Fluida meneruskan tekanan secara merata.
            </p>
          </div>
        </div>
      )}

      {isPumped && !canLift && (
        <div className="self-center mb-3 pointer-events-auto bg-amber-950/90 border border-amber-500/80 text-amber-100 rounded-2xl px-5 py-3 shadow-2xl flex items-center gap-3 animate-fade-in max-w-md">
          <AlertCircle className="w-5 h-5 text-amber-300 shrink-0" />
          <div className="text-xs">
            <p className="font-semibold text-amber-200">Gaya Angkat Kurang, Beban Tetap Diam!</p>
            <p className="text-amber-300/90 mt-0.5">
              Gaya output ({force2} N) masih lebih kecil dari berat beban ({loadWeight} N). Perbesar gaya tekan F₁ atau perbesar rasio A₂/A₁.
            </p>
          </div>
        </div>
      )}

      {/* Spacer if no banner */}
      {!isPumped && <div />}
    </div>
  );
};
