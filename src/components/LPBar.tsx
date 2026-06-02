import React from 'react';

interface LPBarProps {
  lp: number;
}

export default function LPBar({ lp }: LPBarProps) {
  // Determine color and status label based on health thresholds
  let barColor = 'bg-emerald-600';
  let textColor = 'text-emerald-400';
  let statusText = 'GESUND';

  if (lp < 20) {
    barColor = 'bg-rose-700 animate-pulse';
    textColor = 'text-rose-400 font-bold';
    statusText = 'KRITISCH';
  } else if (lp < 50) {
    barColor = 'bg-amber-600';
    textColor = 'text-amber-400';
    statusText = 'VERLETZT';
  } else if (lp < 75) {
    barColor = 'bg-yellow-600';
    textColor = 'text-yellow-400';
    statusText = 'BELASTET';
  }

  return (
    <div className="border border-stone-800 bg-stone-950 p-4 font-mono text-sm shadow-inner rounded-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-2 gap-1 text-stone-300">
        <div className="flex items-center gap-2">
          <span className="text-stone-500 font-semibold">[ STATUS: ]</span>
          <span className={`${textColor} uppercase tracking-widest`}>{statusText}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-stone-500">LP:</span>
          <span className="text-stone-100 font-bold">{lp}</span>
          <span className="text-stone-600">/ 100</span>
        </div>
      </div>
      
      {/* Gauge bar */}
      <div className="h-6 w-full bg-stone-900 border border-stone-800 overflow-hidden relative p-[2px] rounded-sm">
        <div 
          className={`h-full ${barColor} transition-all duration-500 ease-out shadow-[0_0_8px_rgba(255,255,255,0.05)]`}
          style={{ width: `${lp}%` }}
        />
        {/* Retro scanline grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_4px,3px_100%] pointer-events-none" />
      </div>
    </div>
  );
}
