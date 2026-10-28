/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Sliders, Activity, Play, RotateCcw, Info, CheckCircle2, AlertCircle, Scale, Gauge } from 'lucide-react';

interface HydraulicSidebarProps {
  force1: number;
  areaRatio: number;
  loadWeight: number;
  isPumped: boolean;
  onForce1Change: (f1: number) => void;
  onAreaRatioChange: (r: number) => void;
  onLoadWeightChange: (w: number) => void;
  onTogglePump: () => void;
  onReset: () => void;
}

export const HydraulicSidebar: React.FC<HydraulicSidebarProps> = ({
  force1,
  areaRatio,
  loadWeight,
  isPumped,
  onForce1Change,
  onAreaRatioChange,
  onLoadWeightChange,
  onTogglePump,
  onReset,
}) => {
  const force2 = force1 * areaRatio;
  const canLift = force2 >= loadWeight && force1 > 0;

  // Formatting helper
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 1 }).format(num);
  };

  return (
    <aside className="w-full md:w-88 lg:w-96 shrink-0 h-auto md:h-full bg-slate-950 border-t md:border-t-0 md:border-l border-slate-800/90 flex flex-col justify-between overflow-y-auto p-4 sm:p-5 shadow-2xl z-20">
      <div className="space-y-4">
        {/* Header */}
        <div className="pb-3 border-b border-slate-800/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-sky-400" />
              <h2 className="text-sm font-bold text-white tracking-tight">
                Kontrol Dongkrak Hidrolik
              </h2>
            </div>
            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-sky-950/80 border border-sky-800/60 text-sky-300">
              Hukum Pascal
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
            Eksperimen melipatgandakan gaya tekan melalui perbandingan luas penampang silinder fluida.
          </p>
        </div>

        {/* 1. Slider Gaya Tekan F1 (Piston Kecil) */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3">
          <div className="flex justify-between items-center mb-1.5">
            <div className="flex items-center gap-1.5">
              <label className="text-xs font-semibold text-slate-200">
                Gaya Tekan Input (F₁)
              </label>
              <span className="text-[10px] text-slate-400">(0 – 200 N)</span>
            </div>
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-rose-500/80 text-white">
              {force1} N
            </span>
          </div>

          <div className="relative flex items-center mt-1">
            <input
              type="range"
              min="0"
              max="200"
              step="5"
              value={force1}
              onChange={(e) => onForce1Change(Number(e.target.value))}
              onInput={(e) => onForce1Change(Number((e.target as HTMLInputElement).value))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer focus:outline-none accent-rose-400 bg-slate-800"
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
            <span>0 N (Tanpa Gaya)</span>
            <span>100 N</span>
            <span>200 N (Kuat)</span>
          </div>
        </div>

        {/* 2. Slider Rasio Luas Penampang (A2 / A1) */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3">
          <div className="flex justify-between items-center mb-1.5">
            <div className="flex items-center gap-1.5">
              <label className="text-xs font-semibold text-slate-200">
                Rasio Luas (A₂ / A₁)
              </label>
              <span className="text-[10px] text-slate-400">(2× – 20×)</span>
            </div>
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-sky-500/80 text-white">
              {areaRatio}× Lipat
            </span>
          </div>

          <div className="relative flex items-center mt-1">
            <input
              type="range"
              min="2"
              max="20"
              step="1"
              value={areaRatio}
              onChange={(e) => onAreaRatioChange(Number(e.target.value))}
              onInput={(e) => onAreaRatioChange(Number((e.target as HTMLInputElement).value))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer focus:outline-none accent-sky-400 bg-slate-800"
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
            <span>2× (Silinder Sedang)</span>
            <span>10×</span>
            <span>20× (Silinder Sangat Besar)</span>
          </div>
        </div>

        {/* 3. Slider Berat Beban W (Silinder Besar) */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3">
          <div className="flex justify-between items-center mb-1.5">
            <div className="flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-amber-400" />
              <label className="text-xs font-semibold text-slate-200">
                Berat Beban Kotak (W)
              </label>
            </div>
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-amber-500/80 text-slate-950">
              {loadWeight} N
            </span>
          </div>

          <div className="relative flex items-center mt-1">
            <input
              type="range"
              min="100"
              max="1000"
              step="50"
              value={loadWeight}
              onChange={(e) => onLoadWeightChange(Number(e.target.value))}
              onInput={(e) => onLoadWeightChange(Number((e.target as HTMLInputElement).value))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer focus:outline-none accent-amber-400 bg-slate-800"
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
            <span>100 N (Ringan)</span>
            <span>500 N</span>
            <span>1000 N (Sangat Berat)</span>
          </div>
        </div>

        {/* 4. Real-time Calculation & Output Display */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>Gaya Angkat Output (F₂):</span>
            </div>
            <span className="font-mono font-bold text-base text-emerald-400 tracking-tight">
              {formatNumber(force2)} N
            </span>
          </div>

          <div className="text-[11px] text-slate-400 font-mono bg-slate-950/70 p-2 rounded-lg border border-slate-800 flex justify-between items-center">
            <span>Rumus: F₂ = F₁ × (A₂/A₁)</span>
            <span className="text-slate-200 font-semibold">
              {force1} × {areaRatio} = {force2} N
            </span>
          </div>

          {/* Lifting Status Assessment */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-400 text-[11px]">Beban Kotak: {loadWeight} N</span>
            {canLift ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded-full">
                <CheckCircle2 className="w-3 h-3" />
                Dapat Mengangkat (F₂ ≥ W)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-950/80 border border-amber-800 px-2 py-0.5 rounded-full">
                <AlertCircle className="w-3 h-3" />
                Beban Diam (F₂ &lt; W)
              </span>
            )}
          </div>
        </div>

        {/* 5. Action Buttons: Tekan Piston & Reset */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={onTogglePump}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 font-semibold text-xs rounded-xl shadow-lg transition-all active:scale-[0.98] ${
              isPumped
                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-950/50'
                : 'bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white shadow-sky-950/60'
            }`}
          >
            <Play className={`w-4 h-4 fill-white ${isPumped ? 'rotate-90' : ''}`} />
            <span>{isPumped ? 'Tahan / Lepas Piston' : 'Tekan Piston 1 (Pompa)'}</span>
          </button>

          <button
            onClick={onReset}
            title="Kembalikan piston dan fluida ke posisi awal"
            className="flex items-center justify-center gap-1.5 px-3.5 py-3 bg-slate-900 hover:bg-slate-850 border border-slate-700/80 text-slate-200 font-medium text-xs rounded-xl transition-all active:scale-[0.98]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* 6. Educational Callout Card */}
      <div className="mt-4 pt-3 border-t border-slate-800/80">
        <div className="bg-slate-900/80 border border-sky-500/30 rounded-xl p-3">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400 block">
                Prinsip Hukum Pascal
              </span>
              <p className="text-xs font-semibold text-slate-200 mt-0.5 leading-snug">
                "Tekanan pada zat cair dalam ruang tertutup diteruskan ke segala arah sama besar."
              </p>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Karena P₁ = P₂, maka F₁ / A₁ = F₂ / A₂. Silinder besar berpenampang A₂ menghasilkan gaya angkat F₂ yang berlipat ganda, sehingga gaya dorong kecil mampu mengangkat beban berat.
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
