/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Submarine3DSimulation } from './Submarine3DSimulation.tsx';
import { SubmarineSidebar } from './SubmarineSidebar.tsx';
import { SubmarineSceneOverlay } from './SubmarineSceneOverlay.tsx';

interface SubmarineTabProps {
  isActive: boolean;
}

export const SubmarineTab: React.FC<SubmarineTabProps> = ({ isActive }) => {
  const [ballastPercent, setBallastPercent] = useState<number>(0); // 0% (Terapung), 50% (Melayang), 100% (Tenggelam)
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [cameraPreset, setCameraPreset] = useState<'perspective' | 'side' | 'closeup'>('perspective');

  return (
    <div className="w-full h-full flex flex-col md:flex-row overflow-hidden bg-slate-950 select-none">
      {/* Left Stage: 3D Submarine Simulation Viewport */}
      <main className="flex-1 h-[55vh] md:h-full relative overflow-hidden bg-slate-950">
        <Submarine3DSimulation
          ballastPercent={ballastPercent}
          soundEnabled={soundEnabled}
          cameraPreset={cameraPreset}
          isActive={isActive}
        />

        {/* 3D Scene Overlay (Title, Big Status Badge, Camera Presets, Sound Toggle) */}
        <SubmarineSceneOverlay
          ballastPercent={ballastPercent}
          cameraPreset={cameraPreset}
          onSetCameraPreset={setCameraPreset}
          soundEnabled={soundEnabled}
          onToggleSound={() => setSoundEnabled((prev) => !prev)}
        />
      </main>

      {/* Right Stage: Dedicated Submarine Sidebar Controls */}
      <SubmarineSidebar
        ballastPercent={ballastPercent}
        onBallastChange={setBallastPercent}
      />
    </div>
  );
};
