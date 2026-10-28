/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Anchor, Gauge, ArrowDownUp, Info, Wind, Droplets } from 'lucide-react';
import {
  WATER_DENSITY,
  getSubmarineDensity,
  getSubmarineState,
} from '../types/submarine.ts';

interface SubmarineSidebarProps {
  ballastPercent: number;
  onBallastChange: (value: number) => void;
}

export const SubmarineSidebar: React.FC<SubmarineSidebarProps> = ({
  ballastPercent,
  onBallastChange,
}) => {
  const currentDensity = getSubmarineDensity(ballastPercent);
  const currentState = getSubmarineState(ballastPercent);

  const formatNumber = (num: number, decimals = 1) => {
    return new Intl.NumberFormat('id-ID', { maximumFractionDigits: decimals }).format(num);
  };

  const getStateColor = () => {
    if (currentState === 'TERAPUNG') return 'text-emerald-400 bg-emerald-950/80 border-emerald-700/60';
    if (currentState === 'MELAYANG') return 'text-amber-300 bg-amber-950/80 border-amber-700/60';
    return 'text-rose-400 bg-rose-950/80 border-rose-700/60';
  };

  const getDensityComparisonText = () => {
    if (currentState === 'TERAPUNG') {
      return 'ρ_kapal < ρ_air (Gaya Apung Fa > Berat W)';
    }
    if (currentState === 'MELAYANG') {
      return 'ρ_kapal ≈ ρ_air (Gaya Apung Fa = Berat W)';
    }
    return 'ρ_kapal > ρ_air (Gaya Apung Fa < Berat W)';
  };

  return (
    <aside className="w-full md:w-88 lg:w-96 shrink-0 h-auto md:h-full bg-slate-950 border-t md:border-t-0 md:border-l border-slate-800/90 flex flex-col justify-between overflow-y-auto p-4 sm:p-5 shadow-2xl z-20">
      <div className="space-y-4">
        {/* Header */}
        <div className="pb-3 border-b border-slate-800/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Anchor className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-bold text-white tracking-tight">
                Hukum Archimedes: Kapal Selam
              </h2>
            </div>
            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-cyan-950/80 border border-cyan-800/60 text-cyan-300">
              Fa = ρ · g · V
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
            Eksplorasi prinsip terapung, melayang, dan tenggelam dengan mengatur isi tangki pemberat (ballast tank).
          </p>
        </div>

        {/* 1. Status Utama & Perbandingan Massa Jenis */}
        <div className={`p-3.5 rounded-xl border transition-all duration-300 ${getStateColor()}`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-wider uppercase opacity-80">
              Kondisi Kapal
            </span>
            <span className="text-[10px] font-mono opacity-80">
              Archimedes
            </span>
          </div>
          <div className="text-2xl font-black tracking-wider mt-0.5">
            {currentState}
          </div>
          <div className="text-[11px] font-medium mt-1 opacity-90">
            {getDensityComparisonText()}
          </div>
        </div>

        {/* 2. Slider Isi Tangki Pemberat (0% - 100%) */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3">
          <div className="flex justify-between items-center mb-1.5">
            <div className="flex items-center gap-1.5">
              <Droplets className="w-3.5 h-3.5 text-cyan-400" />
              <label className="text-xs font-semibold text-slate-200">
                Isi Tangki Pemberat (Ballast)
              </label>
            </div>
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-cyan-500/80 text-white">
              {ballastPercent}% Air
            </span>
          </div>

          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={ballastPercent}
            onChange={(e) => onBallastChange(Number(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-700/60 rounded-lg"
          />

          {/* Visual Tangki (Air vs Udara) */}
          <div className="mt-2.5">
            <div className="flex justify-between text-[10px] text-slate-400 font-mono mb-1">
              <span className="flex items-center gap-1">
                <Wind className="w-3 h-3 text-emerald-400" /> Udara: {100 - ballastPercent}%
              </span>
              <span className="flex items-center gap-1">
                <Droplets className="w-3 h-3 text-cyan-400" /> Air: {ballastPercent}%
              </span>
            </div>
            <div className="w-full h-2.5 bg-emerald-950 rounded-full overflow-hidden flex border border-slate-700/50">
              <div
                className="h-full bg-emerald-500 transition-all duration-150"
                style={{ width: `${100 - ballastPercent}%` }}
                title="Udara dalam tangki"
              />
              <div
                className="h-full bg-cyan-500 transition-all duration-150"
                style={{ width: `${ballastPercent}%` }}
                title="Air dalam tangki"
              />
            </div>
          </div>

          {/* Preset Buttons */}
          <div className="grid grid-cols-3 gap-1.5 mt-3 pt-2 border-t border-slate-800/60">
            <button
              onClick={() => onBallastChange(0)}
              className={`px-2 py-1.5 text-[11px] rounded-lg font-medium transition-all ${
                ballastPercent === 0
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              Terapung (0%)
            </button>
            <button
              onClick={() => onBallastChange(50)}
              className={`px-2 py-1.5 text-[11px] rounded-lg font-medium transition-all ${
                ballastPercent === 50
                  ? 'bg-amber-400 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              Melayang (50%)
            </button>
            <button
              onClick={() => onBallastChange(100)}
              className={`px-2 py-1.5 text-[11px] rounded-lg font-medium transition-all ${
                ballastPercent === 100
                  ? 'bg-rose-500 text-slate-950 font-bold shadow-md shadow-rose-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              Tenggelam (100%)
            </button>
          </div>
        </div>

        {/* 3. Panel Komparasi Nilai Massa Jenis Real-Time */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3">
          <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-800/60">
            <span className="text-[11px] font-semibold text-slate-200 flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-cyan-400" />
              Perbandingan Massa Jenis (ρ)
            </span>
            <span className="text-[10px] text-slate-400 font-mono">kg/m³</span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-300">Massa Jenis Kapal (ρ_kapal):</span>
              <span className="font-mono font-bold text-white bg-slate-800/80 px-2 py-0.5 rounded">
                {formatNumber(currentDensity, 1)} kg/m³
              </span>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-300">Massa Jenis Air Laut (ρ_air):</span>
              <span className="font-mono font-bold text-cyan-400 bg-cyan-950/60 border border-cyan-900/60 px-2 py-0.5 rounded">
                {formatNumber(WATER_DENSITY, 0)} kg/m³
              </span>
            </div>

            <div className="flex justify-between items-center text-xs pt-1.5 border-t border-slate-800/50">
              <span className="text-slate-400">Selisih (Δρ = ρ_k - ρ_a):</span>
              <span
                className={`font-mono font-bold px-2 py-0.5 rounded ${
                  currentDensity < WATER_DENSITY
                    ? 'text-emerald-400 bg-emerald-950/40'
                    : currentDensity === WATER_DENSITY
                    ? 'text-amber-300 bg-amber-950/40'
                    : 'text-rose-400 bg-rose-950/40'
                }`}
              >
                {currentDensity - WATER_DENSITY > 0 ? '+' : ''}
                {formatNumber(currentDensity - WATER_DENSITY, 1)} kg/m³
              </span>
            </div>
          </div>
        </div>

        {/* 4. Analisis Gaya Archimedes vs Berat */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-2 pb-1.5 border-b border-slate-800/60">
            <ArrowDownUp className="w-3.5 h-3.5 text-cyan-400" />
            <h3 className="text-xs font-semibold text-slate-200">
              Keseimbangan Gaya Vertikal
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center text-xs">
            <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800">
              <div className="text-[10px] text-slate-400">Gaya Apung (Fa ↑)</div>
              <div className="font-mono font-bold text-cyan-300 mt-0.5">
                {currentState === 'TERAPUNG' ? 'Fa > W' : currentState === 'MELAYANG' ? 'Fa = W' : 'Fa < W'}
              </div>
              <div className="text-[9px] text-slate-500 mt-0.5">Mendorong ke atas</div>
            </div>
            <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800">
              <div className="text-[10px] text-slate-400">Gaya Gravitasi (W ↓)</div>
              <div className="font-mono font-bold text-amber-300 mt-0.5">
                W = m_total · g
              </div>
              <div className="text-[9px] text-slate-500 mt-0.5">Menarik ke dasar</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info Box */}
      <div className="mt-4 pt-3 border-t border-slate-800/80">
        <div className="flex items-start gap-2 bg-cyan-950/40 border border-cyan-800/40 p-2.5 rounded-lg text-slate-300">
          <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed">
            <strong className="text-white">Prinsip Kerja Tangki Pemberat:</strong> Memompa udara ke dalam tangki menyingkirkan air laut (blowing ballast) sehingga rata-rata massa jenis kapal mengecil dan menghasilkan gelembung udara ke permukaan laut!
          </p>
        </div>
      </div>
    </aside>
  );
};
