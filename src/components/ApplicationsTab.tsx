/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Dam3DSimulation } from './Dam3DSimulation.tsx';
import { DamSidebar } from './DamSidebar.tsx';
import { DamSceneOverlay } from './DamSceneOverlay.tsx';

interface ApplicationsTabProps {
  isActive: boolean;
}

export const ApplicationsTab: React.FC<ApplicationsTabProps> = ({ isActive }) => {
  const [waterHeightM, setWaterHeightM] = useState<number>(30); // 5 - 50 m
  const [cameraPreset, setCameraPreset] = useState<'perspective' | 'cross_section' | 'water_face'>('perspective');

  return (
    <div className="w-full h-full flex flex-col md:flex-row overflow-hidden bg-slate-950 select-none">
      {/* Left Stage: 3D Dam Simulation Viewport */}
      <main className="flex-1 h-[55vh] md:h-full relative overflow-hidden bg-slate-950">
        <Dam3DSimulation
          waterHeightM={waterHeightM}
          cameraPreset={cameraPreset}
          isActive={isActive}
        />

        {/* 3D Scene Overlay (Camera Presets & Anotations) */}
        <DamSceneOverlay
          waterHeightM={waterHeightM}
          cameraPreset={cameraPreset}
          onSetCameraPreset={setCameraPreset}
        />
      </main>

      {/* Right Stage: Dedicated Dam Sidebar Controls */}
      <DamSidebar
        waterHeightM={waterHeightM}
        onWaterHeightChange={setWaterHeightM}
      />
    </div>
  );
};
