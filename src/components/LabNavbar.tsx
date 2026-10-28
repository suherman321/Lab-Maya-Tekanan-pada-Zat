/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { LabTabId, LAB_TABS } from '../types/physics.ts';
import { Box, Droplets, Wind, Sparkles, FlaskConical, Anchor } from 'lucide-react';

interface LabNavbarProps {
  activeTab: LabTabId;
  onTabChange: (tab: LabTabId) => void;
}

export const LabNavbar: React.FC<LabNavbarProps> = ({ activeTab, onTabChange }) => {
  const getTabIcon = (id: LabTabId) => {
    switch (id) {
      case 'solid':
        return <Box className="w-4 h-4" />;
      case 'liquid':
        return <Droplets className="w-4 h-4" />;
      case 'gas':
        return <Wind className="w-4 h-4" />;
      case 'applications':
        return <Sparkles className="w-4 h-4" />;
      case 'submarine':
        return <Anchor className="w-4 h-4" />;
    }
  };

  return (
    <header className="w-full bg-slate-950/95 border-b border-slate-800/80 px-4 sm:px-6 py-2.5 z-30 shrink-0 backdrop-blur-none">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Brand Zone */}
        <div className="flex items-center gap-2.5 self-start sm:self-center">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-md shadow-sky-500/20">
            <FlaskConical className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              Lab Maya Fisika
              <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-sky-950 border border-sky-800 text-sky-400">
                Tekanan
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 hidden md:block">
              Simulasi interaktif konsep tekanan zat padat, zat cair, dan zat gas
            </p>
          </div>
        </div>

        {/* Tab Navigation Menu (Modern Dark Mode Segmented Tabs) */}
        <nav className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto max-w-full">
          {LAB_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                  isActive
                    ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
                }`}
              >
                <span className={isActive ? 'text-white' : 'text-slate-400'}>
                  {getTabIcon(tab.id)}
                </span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
