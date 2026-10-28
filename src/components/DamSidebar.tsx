/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Sliders, Activity, Info, Droplets, Waves } from 'lucide-react';
import { WATER_DENSITY, GRAVITY, MAX_WATER_HEIGHT } from '../types/dam.ts';

interface DamSidebarProps {
  waterHeightM: number;
  onWaterHeightChange: (h: number) => void;
}

export const DamSidebar: React.FC<DamSidebarProps> = ({
  waterHeightM,
  onWaterHeightChange,
}) => {
  // P = rho * g * h
  const pressureBottomPa = WATER_DENSITY * GRAVITY * waterHeightM;
  const pressureBottomKPa = pressureBottomPa / 1000;
  const pressureBottomAtm = pressureBottomKPa / 101.3;

  // Total hydrostatic thrust force per meter width: F = 0.5 * rho * g * h^2
  const totalThrustKN = (0.5 * WATER_DENSITY * GRAVITY * Math.pow(waterHeightM, 2)) / 1000;

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 1 }).format(num);
  };

  const getPressureColor = () => {
    if (waterHeightM <= 20) return 'text-emerald-400';
    if (waterHeightM <= 35) return 'text-amber-400';
    return 'text-rose-400';
  };

  const getWaterBarPercent = () => {
    return (waterHeightM / MAX_WATER_HEIGHT) * 100;
  };

  return (
    <aside className="w-full md:w-88 lg:w-96 shrink-0 h-auto md:h-full bg-slate-950 border-t md:border-t-0 md:border-l border-slate-800/90 flex flex-col justify-between overflow-y-auto p-4 sm:p-5 shadow-2xl z-20">
      <div className="space-y-4">
        {/* Header */}
        <div className="pb-3 border-b border-slate-800/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Waves className="w-4 h-4 text-sky-400" />
              <h2 className="text-sm font-bold text-white tracking-tight">
                Tekanan Air pada Bendungan
              </h2>
            </div>
            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-sky-950/80 border border-sky-800/60 text-sky-300">
              P = ρ · g · h
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
            Studi rekayasa sipil: distribusi tekanan hidrostatis air waduk terhadap dinding bendungan.
          </p>
        </div>

        {/* 1. Slider Ketinggian Air (5 - 50 m) */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3">
          <div className="flex justify-between items-center mb-1.5">
            <div className="flex items-center gap-1.5">
              <label className="text-xs font-semibold text-slate-200">
                Ketinggian Air Waduk (h)
              </label>
              <span className="text-[10px] text-slate-400">(5 – 50 m)</span>
            </div>
            <span
              className={`font-mono text-xs font-bold px-2 py-0.5 rounded-md text-white transition-colors ${
                waterHeightM > 38
                  ? 'bg-rose-500/80'
                  : waterHeightM > 22
                  ? 'bg-amber-500/80'
                  : 'bg-emerald-500/80'
              }`}
            >
              {waterHeightM} meter
            </span>
          </div>

          <div className="relative flex items-center mt-1">
            <input
              type="range"
              min="5"
              max="50"
              step="1"
              value={waterHeightM}
              onChange={(e) => onWaterHeightChange(Number(e.target.value))}
              onInput={(e) => onWaterHeightChange(Number((e.target as HTMLInputElement).value))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer focus:outline-none accent-sky-400 bg-slate-800"
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
            <span className="text-emerald-400">5 m (Rendah)</span>
            <span className="text-amber-400">25 m</span>
            <span className="text-rose-400">50 m (Penuh)</span>
          </div>

          {/* Quick Preset Buttons */}
          <div className="grid grid-cols-4 gap-1.5 mt-3 pt-2.5 border-t border-slate-800/80">
            {[10, 25, 40, 50].map((h) => (
              <button
                key={h}
                onClick={() => onWaterHeightChange(h)}
                className={`px-2 py-1.5 rounded-lg text-center text-[11px] font-mono transition-colors ${
                  waterHeightM === h
                    ? 'bg-sky-500/20 border border-sky-500 text-sky-300 font-semibold'
                    : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                {h} m
              </button>
            ))}
          </div>
        </div>

        {/* 2. Real-time Hydrostatic Pressure Display */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
              <Activity className="w-3.5 h-3.5 text-rose-400" />
              <span>Tekanan Maksimum di Dasar:</span>
            </div>
            <span className={`font-mono font-bold text-base tracking-tight ${getPressureColor()}`}>
              {formatNumber(pressureBottomKPa)} kPa
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono bg-slate-950/70 p-2.5 rounded-lg border border-slate-800">
            <div>
              <span className="text-slate-400 block text-[10px]">Tekanan Permukaan:</span>
              <span className="text-emerald-400 font-semibold">0 kPa (h = 0)</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Setara Atmosfer:</span>
              <span className="text-slate-100 font-bold">{pressureBottomAtm.toFixed(1)} atm</span>
            </div>
          </div>

          {/* Depth vs Pressure Gradient Bar */}
          <div>
            <div className="flex justify-between text-[10px] text-slate-400 mb-1">
              <span>Rasio Ketinggian Waduk</span>
              <span className="font-mono text-slate-300">{waterHeightM} / 50 meter</span>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
              <div
                className={`h-full transition-all duration-200 rounded-full ${
                  waterHeightM < 20
                    ? 'bg-emerald-500'
                    : waterHeightM < 38
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
                }`}
                style={{ width: `${getWaterBarPercent()}%` }}
              />
            </div>
          </div>

          {/* Formula calculation breakdown */}
          <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 font-mono space-y-1">
            <div className="flex justify-between">
              <span>P = 1.000 × 9,8 × {waterHeightM}</span>
              <span className="text-sky-300 font-bold">{formatNumber(pressureBottomPa)} Pa</span>
            </div>
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>Total Gaya Dorong Air:</span>
              <span className="text-slate-300">~{formatNumber(totalThrustKN)} kN/m</span>
            </div>
          </div>
        </div>

        {/* 3. Visual Vector Explanation Pill */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3 flex items-start gap-2.5">
          <Droplets className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-300">
            <span className="font-semibold text-white block">Vektor Tekanan Berbentuk Segitiga</span>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
              Panah hijau di dekat permukaan air berukuran pendek, sedangkan panah merah di dasar sangat panjang, membuktikan tekanan bertambah seiring kedalaman.
            </p>
          </div>
        </div>
      </div>

      {/* 4. Educational Callout Card: Mengapa Dasar Lebih Tebal? */}
      <div className="mt-4 pt-3 border-t border-slate-800/80">
        <div className="bg-slate-900/80 border border-amber-500/30 rounded-xl p-3">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
                Penerapan Rekayasa Sipil
              </span>
              <p className="text-xs font-semibold text-slate-200 mt-0.5 leading-snug">
                "Mengapa Dinding Dasar Bendungan Harus Jauh Lebih Tebal?"
              </p>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Karena tekanan air berbanding lurus dengan kedalaman (P = ρ · g · h), tekanan terbesar berada tepat di dasar bendungan. Bentuk penampang trapesium dengan dasar tebal memberikan ketahanan gravitasi maksimal untuk menahan gaya dorong air tanpa risiko retak atau roboh.
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
