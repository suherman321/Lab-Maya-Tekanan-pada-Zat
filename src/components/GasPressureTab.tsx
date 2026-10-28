/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Gas3DSimulation } from './Gas3DSimulation.tsx';
import { GasSidebar } from './GasSidebar.tsx';
import { GasSceneOverlay } from './GasSceneOverlay.tsx';
import { GAS_INITIAL_V } from '../types/gas.ts';

interface GasPressureTabProps {
  isActive: boolean;
}

export const GasPressureTab: React.FC<GasPressureTabProps> = ({ isActive }) => {
  const [volumeCm3, setVolumeCm3] = useState<number>(GAS_INITIAL_V); // 20 - 100 cm³
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [cameraPreset, setCameraPreset] = useState<'perspective' | 'front' | 'closeup'>('perspective');

  const handleReset = () => {
    setVolumeCm3(GAS_INITIAL_V);
  };

  return (
    <div className="w-full h-full flex flex-col md:flex-row overflow-hidden bg-slate-950 select-none">
      {/* Left Stage: 3D Gas Cylinder Simulation Viewport */}
      <main className="flex-1 h-[55vh] md:h-full relative overflow-hidden bg-slate-950">
        <Gas3DSimulation
          volumeCm3={volumeCm3}
          soundEnabled={soundEnabled}
          cameraPreset={cameraPreset}
          isActive={isActive}
        />

        {/* 3D Scene Overlay (Controls & Kinetic Alerts) */}
        <GasSceneOverlay
          volumeCm3={volumeCm3}
          soundEnabled={soundEnabled}
          cameraPreset={cameraPreset}
          onToggleSound={() => setSoundEnabled((prev) => !prev)}
          onSetCameraPreset={setCameraPreset}
        />
      </main>

      {/* Right Stage: Dedicated Gas Sidebar Controls */}
      <GasSidebar
        volumeCm3={volumeCm3}
        onVolumeChange={setVolumeCm3}
        onReset={handleReset}
      />
    </div>
  );
};
