/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Hydraulic3DSimulation } from './Hydraulic3DSimulation.tsx';
import { HydraulicSidebar } from './HydraulicSidebar.tsx';
import { HydraulicSceneOverlay } from './HydraulicSceneOverlay.tsx';

interface LiquidPressureTabProps {
  isActive: boolean;
}

export const LiquidPressureTab: React.FC<LiquidPressureTabProps> = ({ isActive }) => {
  const [force1, setForce1] = useState<number>(50); // Gaya tekan F1 (N)
  const [areaRatio, setAreaRatio] = useState<number>(10); // Rasio A2 / A1
  const [loadWeight, setLoadWeight] = useState<number>(400); // Beban W (N)
  const [isPumped, setIsPumped] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [cameraPreset, setCameraPreset] = useState<'perspective' | 'front' | 'piston'>('perspective');

  const handleTogglePump = () => {
    setIsPumped((prev) => !prev);
  };

  const handleReset = () => {
    setIsPumped(false);
  };

  return (
    <div className="w-full h-full flex flex-col md:flex-row overflow-hidden bg-slate-950 select-none">
      {/* Left Stage: 3D Hydraulic Jack Simulation Viewport */}
      <main className="flex-1 h-[55vh] md:h-full relative overflow-hidden bg-slate-950">
        <Hydraulic3DSimulation
          force1={force1}
          areaRatio={areaRatio}
          loadWeight={loadWeight}
          isPumped={isPumped}
          soundEnabled={soundEnabled}
          cameraPreset={cameraPreset}
          isActive={isActive}
        />

        {/* 3D Scene Overlay (Controls & Outcome Alerts) */}
        <HydraulicSceneOverlay
          force1={force1}
          areaRatio={areaRatio}
          loadWeight={loadWeight}
          isPumped={isPumped}
          soundEnabled={soundEnabled}
          cameraPreset={cameraPreset}
          onToggleSound={() => setSoundEnabled((prev) => !prev)}
          onSetCameraPreset={setCameraPreset}
        />
      </main>

      {/* Right Stage: Dedicated Hydraulic Sidebar Controls */}
      <HydraulicSidebar
        force1={force1}
        areaRatio={areaRatio}
        loadWeight={loadWeight}
        isPumped={isPumped}
        onForce1Change={setForce1}
        onAreaRatioChange={setAreaRatio}
        onLoadWeightChange={setLoadWeight}
        onTogglePump={handleTogglePump}
        onReset={handleReset}
      />
    </div>
  );
};
