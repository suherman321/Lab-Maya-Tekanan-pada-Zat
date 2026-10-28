/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { CameraPreset, PenetrationStatus, WoodSpecimen, WOOD_PRESETS, LabTabId } from './types/physics.ts';
import { LabNavbar } from './components/LabNavbar.tsx';
import { ThreeSimulation } from './components/ThreeSimulation.tsx';
import { SceneOverlay } from './components/SceneOverlay.tsx';
import { SidebarControls } from './components/SidebarControls.tsx';
import { LiquidPressureTab } from './components/LiquidPressureTab.tsx';
import { GasPressureTab } from './components/GasPressureTab.tsx';
import { ApplicationsTab } from './components/ApplicationsTab.tsx';
import { SubmarineTab } from './components/SubmarineTab.tsx';

export default function App() {
  const [activeTab, setActiveTab] = useState<LabTabId>('solid');

  // Solid Pressure Simulation State
  const [forceN, setForceN] = useState<number>(50);
  const [areaCm2, setAreaCm2] = useState<number>(1.0);
  const [wood, setWood] = useState<WoodSpecimen>(WOOD_PRESETS[1]); // Default Pinus
  const [status, setStatus] = useState<PenetrationStatus>('idle');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('perspective');

  // Pressure Formula: P = F / A (in SI units: N / m²)
  // 1 cm² = 1e-4 m²
  const pressurePa = useMemo(() => {
    const areaM2 = areaCm2 * 1e-4;
    return forceN / areaM2;
  }, [forceN, areaCm2]);

  const handleForceChange = (f: number) => {
    setForceN(f);
    if (status === 'penetrated' || status === 'stopped_surface') {
      setStatus('resetting');
    }
  };

  const handleAreaChange = (a: number) => {
    setAreaCm2(a);
    if (status === 'penetrated' || status === 'stopped_surface') {
      setStatus('resetting');
    }
  };

  const handleWoodChange = (w: WoodSpecimen) => {
    setWood(w);
    if (status === 'penetrated' || status === 'stopped_surface') {
      setStatus('resetting');
    }
  };

  const handlePressNail = () => {
    if (status === 'pressing') return;
    if (status === 'penetrated' || status === 'stopped_surface') {
      // Jika paku sedang menancap/menempel, naikkan terlebih dahulu lalu tekan ulang
      setStatus('resetting');
      setTimeout(() => {
        setStatus('pressing');
      }, 220);
      return;
    }
    setStatus('pressing');
  };

  const handleResetNail = () => {
    setStatus('resetting');
  };

  const handleAnimationComplete = (result: 'penetrated' | 'stopped_surface' | 'idle') => {
    setStatus(result);
  };

  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none">
      {/* Top Navigation Bar with Tabs */}
      <LabNavbar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Tab Viewport */}
      <div className="flex-1 w-full h-[calc(100vh-61px)] overflow-hidden relative">
        {/* TAB 1: ZAT PADAT (Paku 3D Simulation) */}
        {/* When not active: visually hidden & 3D render loop is paused to save GPU/CPU memory */}
        <div
          className={`w-full h-full flex flex-col md:flex-row overflow-hidden ${
            activeTab === 'solid' ? 'flex' : 'hidden'
          }`}
        >
          {/* Left Stage: Unobstructed 3D WebGL Simulation Viewport */}
          <main className="flex-1 h-[55vh] md:h-full relative overflow-hidden bg-slate-950">
            <ThreeSimulation
              forceN={forceN}
              areaCm2={areaCm2}
              wood={wood}
              status={status}
              soundEnabled={soundEnabled}
              cameraPreset={cameraPreset}
              isActive={activeTab === 'solid'}
              onAnimationComplete={handleAnimationComplete}
            />

            {/* Non-Obstructing Scene Overlay for Camera & Alerts */}
            <SceneOverlay
              wood={wood}
              pressurePa={pressurePa}
              status={status}
              soundEnabled={soundEnabled}
              cameraPreset={cameraPreset}
              onToggleSound={() => setSoundEnabled((prev) => !prev)}
              onSetCameraPreset={setCameraPreset}
            />
          </main>

          {/* Right Stage: Dedicated Sidebar Control Panel */}
          <SidebarControls
            forceN={forceN}
            areaCm2={areaCm2}
            wood={wood}
            pressurePa={pressurePa}
            status={status}
            onForceChange={handleForceChange}
            onAreaChange={handleAreaChange}
            onWoodChange={handleWoodChange}
            onPressNail={handlePressNail}
            onResetNail={handleResetNail}
          />
        </div>

        {/* TAB 2: ZAT CAIR (Dongkrak Hidrolik 3D) */}
        <div className={`w-full h-full ${activeTab === 'liquid' ? 'block' : 'hidden'}`}>
          <LiquidPressureTab isActive={activeTab === 'liquid'} />
        </div>

        {/* TAB 3: ZAT GAS (Hukum Boyle 3D) */}
        <div className={`w-full h-full ${activeTab === 'gas' ? 'block' : 'hidden'}`}>
          <GasPressureTab isActive={activeTab === 'gas'} />
        </div>

        {/* TAB 4: PENERAPAN (Bendungan Air 3D) */}
        <div className={`w-full h-full ${activeTab === 'applications' ? 'block' : 'hidden'}`}>
          <ApplicationsTab isActive={activeTab === 'applications'} />
        </div>

        {/* TAB 5: KAPAL SELAM (Hukum Archimedes 3D) */}
        <div className={`w-full h-full ${activeTab === 'submarine' ? 'block' : 'hidden'}`}>
          <SubmarineTab isActive={activeTab === 'submarine'} />
        </div>
      </div>
    </div>
  );
}
