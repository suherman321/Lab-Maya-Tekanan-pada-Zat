/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Sliders, Activity, Info, Gauge, Wind, RotateCcw } from 'lucide-react';
import { GAS_INITIAL_V, GAS_INITIAL_P, GAS_CONSTANT_PV } from '../types/gas.ts';

interface GasSidebarProps {
  volumeCm3: number;
  onVolumeChange: (v: number) => void;
  onReset: () => void;
}

export const GasSidebar: React.FC<GasSidebarProps> = ({
  volumeCm3,
  onVolumeChange,
  onReset,
}) => {
  // P2 = (P1 * V1) / V2
  const pressureKPa = GAS_CONSTANT_PV / volumeCm3;
  const pressureAtm = pressureKPa / GAS_INITIAL_P;
  const pressurePa = pressureKPa * 1000;

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 1 }).format(num);
  };

  // Color gradient for volume slider (inverted: low volume = high pressure = red)
  const volumeInvertedRatio = (100 - volumeCm3) / (100 - 20);

  const getGradientForValue = (ratio: number) => {
    if (ratio < 0.5) {
      const p = ratio / 0.5;
      return `linear-gradient(to right, #10b981 0%, #f59e0b ${p * 100}%, #334155 ${p * 100}%)`;
    } else {
      const p = (ratio - 0.5) / 0.5;
      return `linear-gradient(to right, #10b981 0%, #f59e0b 50%, #ef4444 ${50 + p * 50}%, #334155 ${50 + p * 50}%)`;
    }
  };

  const getPressureColor = () => {
    if (pressureKPa < 150) return 'text-emerald-400';
    if (pressureKPa < 300) return 'text-amber-400';
    return 'text-rose-400';
  };

  const getPressureBarPercent = () => {
    // Map 101.3 to 506.5 kPa to 0 - 100%
    return Math.min(100, Math.max(5, ((pressureKPa - 100) / 400) * 100));
  };

  return (
    <aside className="w-full md:w-88 lg:w-96 shrink-0 h-auto md:h-full bg-slate-950 border-t md:border-t-0 md:border-l border-slate-800/90 flex flex-col justify-between overflow-y-auto p-4 sm:p-5 shadow-2xl z-20">
      <div className="space-y-4">
        {/* Header */}
        <div className="pb-3 border-b border-slate-800/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-bold text-white tracking-tight">
                Kontrol Tekanan Gas
              </h2>
            </div>
            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-800/60 text-emerald-300">
              P₁ · V₁ = P₂ · V₂
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
            Eksperimen kompresi gas dalam ruang tertutup sesuai Hukum Boyle.
          </p>
        </div>

        {/* 1. Slider Volume Gas (20 - 100 cm³) */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3">
          <div className="flex justify-between items-center mb-1.5">
            <div className="flex items-center gap-1.5">
              <label className="text-xs font-semibold text-slate-200">
                Volume Ruang Gas (V)
              </label>
              <span className="text-[10px] text-slate-400">(20 – 100 cm³)</span>
            </div>
            <span
              className={`font-mono text-xs font-bold px-2 py-0.5 rounded-md text-white transition-colors ${
                volumeCm3 < 35
                  ? 'bg-rose-500/80'
                  : volumeCm3 < 70
                  ? 'bg-amber-500/80'
                  : 'bg-emerald-500/80'
              }`}
            >
              {volumeCm3} cm³
            </span>
          </div>

          <div className="relative flex items-center mt-1">
            <input
              type="range"
              min="20"
              max="100"
              step="1"
              value={volumeCm3}
              onChange={(e) => onVolumeChange(Number(e.target.value))}
              onInput={(e) => onVolumeChange(Number((e.target as HTMLInputElement).value))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer focus:outline-none accent-sky-400"
              style={{
                background: getGradientForValue(volumeInvertedRatio),
              }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
            <span className="text-rose-400">20 cm³ (Mampat/Padat)</span>
            <span className="text-amber-400">60 cm³</span>
            <span className="text-emerald-400">100 cm³ (Mengembang)</span>
          </div>

          {/* Quick Preset Buttons */}
          <div className="grid grid-cols-4 gap-1.5 mt-3 pt-2.5 border-t border-slate-800/80">
            {[100, 50, 33, 20].map((v) => (
              <button
                key={v}
                onClick={() => onVolumeChange(v)}
                className={`px-2 py-1.5 rounded-lg text-center text-[11px] font-mono transition-colors ${
                  volumeCm3 === v
                    ? 'bg-sky-500/20 border border-sky-500 text-sky-300 font-semibold'
                    : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                {v} cm³
              </button>
            ))}
          </div>
        </div>

        {/* 2. Real-time Pressure Measurement Output */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>Tekanan Gas Terukur (P):</span>
            </div>
            <span className={`font-mono font-bold text-base tracking-tight ${getPressureColor()}`}>
              {formatNumber(pressureKPa)} kPa
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono bg-slate-950/70 p-2.5 rounded-lg border border-slate-800">
            <div>
              <span className="text-slate-400 block text-[10px]">Satuan Atmosfer:</span>
              <span className="text-slate-100 font-bold">{pressureAtm.toFixed(2)} atm</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Satuan Pascal:</span>
              <span className="text-slate-100 font-bold">{formatNumber(pressurePa)} Pa</span>
            </div>
          </div>

          {/* Pressure Bar Meter */}
          <div>
            <div className="flex justify-between text-[10px] text-slate-400 mb-1">
              <span>Meteran Tekanan Silinder</span>
              <span className="font-mono text-slate-300">{pressureKPa.toFixed(0)} / 506 kPa</span>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
              <div
                className={`h-full transition-all duration-200 rounded-full ${
                  pressureKPa < 150
                    ? 'bg-emerald-500'
                    : pressureKPa < 300
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
                }`}
                style={{ width: `${getPressureBarPercent()}%` }}
              />
            </div>
          </div>

          {/* Boyle's Law Constant Proof */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>P · V = Konstan:</span>
            <span className="text-sky-300 font-semibold">
              {pressureKPa.toFixed(1)} × {volumeCm3} ≈ {GAS_CONSTANT_PV}
            </span>
          </div>
        </div>

        {/* 3. Reset Button */}
        <button
          onClick={onReset}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-700/80 text-slate-200 font-medium text-xs rounded-xl transition-all active:scale-[0.98]"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Kembalikan ke Kondisi Normal (100 cm³, 1 atm)</span>
        </button>
      </div>

      {/* 4. Educational Callout Card */}
      <div className="mt-4 pt-3 border-t border-slate-800/80">
        <div className="bg-slate-900/80 border border-emerald-500/30 rounded-xl p-3">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
                Konsep Hukum Boyle
              </span>
              <p className="text-xs font-semibold text-slate-200 mt-0.5 leading-snug">
                "Pada suhu konstan, volume gas berbanding terbalik dengan tekanannya."
              </p>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Saat piston menekan ruang hingga volume mengecil, partikel-partikel gas menjadi semakin rapat dan lebih sering bertumbukan dengan dinding silinder, melipatgandakan tekanan.
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
