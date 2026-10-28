/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PenetrationStatus, WoodSpecimen, WOOD_PRESETS } from '../types/physics.ts';
import { Play, RotateCcw, Sliders, Layers, Activity, Info, CheckCircle2, AlertCircle } from 'lucide-react';

interface SidebarControlsProps {
  forceN: number;
  areaCm2: number;
  wood: WoodSpecimen;
  pressurePa: number;
  status: PenetrationStatus;
  onForceChange: (f: number) => void;
  onAreaChange: (a: number) => void;
  onWoodChange: (w: WoodSpecimen) => void;
  onPressNail: () => void;
  onResetNail: () => void;
}

export const SidebarControls: React.FC<SidebarControlsProps> = ({
  forceN,
  areaCm2,
  wood,
  pressurePa,
  status,
  onForceChange,
  onAreaChange,
  onWoodChange,
  onPressNail,
  onResetNail,
}) => {
  const pressureKPa = pressurePa / 1000;
  const isPenetrating = pressureKPa >= wood.thresholdKPa && forceN > 0;

  // Format numbers nicely
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 1 }).format(num);
  };

  // Dynamic slider gradient colors:
  // Red = high pressure, Green = low pressure
  const forceRatio = forceN / 100;
  const areaInvertedRatio = (5.0 - areaCm2) / (5.0 - 0.1);

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
    if (pressureKPa < 100) return 'text-emerald-400';
    if (pressureKPa < 350) return 'text-amber-400';
    return 'text-rose-400';
  };

  const getPressureBarPercent = () => {
    return Math.min(100, Math.max(3, (pressureKPa / 1000) * 100));
  };

  return (
    <aside className="w-full md:w-88 lg:w-96 shrink-0 h-auto md:h-full bg-slate-950 border-t md:border-t-0 md:border-l border-slate-800/90 flex flex-col justify-between overflow-y-auto p-4 sm:p-5 shadow-2xl z-20">
      <div className="space-y-4">
        {/* 1. Header */}
        <div className="pb-3 border-b border-slate-800/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-sky-400" />
              <h2 className="text-sm font-bold text-white tracking-tight">
                Panel Kontrol Fisika
              </h2>
            </div>
            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-sky-950/80 border border-sky-800/60 text-sky-300">
              P = F / A
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
            Atur parameter di bawah ini lalu uji daya tembus paku pada balok kayu.
          </p>
        </div>

        {/* 2. Slider Gaya Tekan (0 - 100 N) */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3">
          <div className="flex justify-between items-center mb-1.5">
            <div className="flex items-center gap-1.5">
              <label className="text-xs font-semibold text-slate-200">
                Gaya Tekan (F)
              </label>
              <span className="text-[10px] text-slate-400">(0 – 100 N)</span>
            </div>
            <span
              className={`font-mono text-xs font-bold px-2 py-0.5 rounded-md text-white transition-colors ${
                forceN > 70
                  ? 'bg-rose-500/80'
                  : forceN > 30
                  ? 'bg-amber-500/80'
                  : 'bg-emerald-500/80'
              }`}
            >
              {forceN} N
            </span>
          </div>

          <div className="relative flex items-center mt-1">
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={forceN}
              onChange={(e) => onForceChange(Number(e.target.value))}
              onInput={(e) => onForceChange(Number((e.target as HTMLInputElement).value))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer focus:outline-none accent-sky-400"
              style={{
                background: getGradientForValue(forceRatio),
              }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
            <span className="text-emerald-400">0 N (Tanpa Gaya)</span>
            <span className="text-amber-400">50 N</span>
            <span className="text-rose-400">100 N (Maks)</span>
          </div>
        </div>

        {/* 3. Slider Luas Ujung Paku (0.1 - 5.0 cm²) */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3">
          <div className="flex justify-between items-center mb-1.5">
            <div className="flex items-center gap-1.5">
              <label className="text-xs font-semibold text-slate-200">
                Luas Ujung Paku (A)
              </label>
              <span className="text-[10px] text-slate-400">(0.1 – 5 cm²)</span>
            </div>
            <span
              className={`font-mono text-xs font-bold px-2 py-0.5 rounded-md text-white transition-colors ${
                areaCm2 < 1.0
                  ? 'bg-rose-500/80'
                  : areaCm2 < 2.5
                  ? 'bg-amber-500/80'
                  : 'bg-emerald-500/80'
              }`}
            >
              {areaCm2.toFixed(1)} cm²
            </span>
          </div>

          <div className="relative flex items-center mt-1">
            <input
              type="range"
              min="0.1"
              max="5.0"
              step="0.1"
              value={areaCm2}
              onChange={(e) => onAreaChange(Number(e.target.value))}
              onInput={(e) => onAreaChange(Number((e.target as HTMLInputElement).value))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer focus:outline-none accent-sky-400"
              style={{
                background: getGradientForValue(areaInvertedRatio),
              }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
            <span className="text-rose-400">0.1 cm² (Runcing)</span>
            <span className="text-amber-400">2.5 cm²</span>
            <span className="text-emerald-400">5.0 cm² (Tumpul)</span>
          </div>
        </div>

        {/* 4. Pemilih Jenis Kayu Uji */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-300 font-semibold">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>Material Papan Kayu</span>
            </div>
            <span className="text-[10px] text-slate-400">Ketahanan:</span>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {WOOD_PRESETS.map((item) => (
              <button
                key={item.id}
                disabled={status === 'pressing'}
                onClick={() => onWoodChange(item)}
                className={`px-2 py-2 rounded-xl text-center text-xs transition-all ${
                  wood.id === item.id
                    ? 'bg-amber-500/20 border border-amber-500 text-amber-300 font-semibold shadow-sm'
                    : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <div className="truncate text-[11px] font-medium">{item.name}</div>
                <div className="text-[10px] opacity-80 font-mono mt-0.5">{item.thresholdKPa} kPa</div>
              </button>
            ))}
          </div>
        </div>

        {/* 5. Monitor Tekanan Real-time */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
              <Activity className="w-3.5 h-3.5 text-sky-400" />
              <span>Tekanan Real-Time (P):</span>
            </div>
            <span className={`font-mono font-bold text-sm tracking-tight ${getPressureColor()}`}>
              {formatNumber(pressurePa)} Pa
            </span>
          </div>

          <div className="flex justify-between items-center text-[11px] text-slate-400 font-mono">
            <span>Konversi:</span>
            <span className="font-semibold text-slate-200">{formatNumber(pressureKPa)} kPa</span>
          </div>

          {/* Bar Gauge */}
          <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
            <div
              className={`h-full transition-all duration-300 rounded-full ${
                pressureKPa < 100
                  ? 'bg-emerald-500'
                  : pressureKPa < 350
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              }`}
              style={{ width: `${getPressureBarPercent()}%` }}
            />
          </div>

          {/* Comparison Status */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-400 text-[11px]">Batas {wood.name}: {wood.thresholdKPa} kPa</span>
            {isPenetrating ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/70 border border-emerald-800/80 px-2 py-0.5 rounded-full">
                <CheckCircle2 className="w-3 h-3" />
                Dapat Menembus
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-950/70 border border-amber-800/80 px-2 py-0.5 rounded-full">
                <AlertCircle className="w-3 h-3" />
                Hanya Menempel
              </span>
            )}
          </div>
        </div>

        {/* 6. Action Buttons */}
        <div className="flex items-center gap-2 pt-1">
          <button
            disabled={status === 'pressing'}
            onClick={onPressNail}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-sky-950/60 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>{status === 'pressing' ? 'Menekan Paku...' : 'Tekan Paku'}</span>
          </button>

          <button
            disabled={status === 'pressing'}
            onClick={onResetNail}
            title="Kembalikan paku ke posisi atas"
            className="flex items-center justify-center gap-1.5 px-3.5 py-3 bg-slate-900 hover:bg-slate-850 border border-slate-700/80 text-slate-200 font-medium text-xs rounded-xl transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* 7. Bottom Educational Callout (Mandatory) */}
      <div className="mt-4 pt-3 border-t border-slate-800/80">
        <div className="bg-slate-900/80 border border-amber-500/30 rounded-xl p-3">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
                Konsep Pembelajaran
              </span>
              <p className="text-xs font-semibold text-slate-200 mt-0.5 leading-snug">
                "Tekanan berbanding lurus dengan Gaya, dan berbanding terbalik dengan Luas Permukaan"
              </p>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Paku yang runcing ($A$ kecil) menghasilkan tekanan jauh lebih besar daripada paku tumpul meskipun diberi gaya tekan ($F$) yang sama.
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
