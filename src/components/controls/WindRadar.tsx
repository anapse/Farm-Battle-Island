import React from 'react';
import { WindState } from '../../types/game';

interface WindRadarProps {
  wind: WindState;
}

export const WindRadar: React.FC<WindRadarProps> = ({ wind }) => {
  const isRight = wind.direction > 0;
  // Intensity bars calculation (e.g. 1 to 4 bars)
  const intensityLevel = Math.min(4, Math.max(1, Math.round(wind.speed / 6)));
  const intensityArrows = isRight ? '→'.repeat(intensityLevel) : '←'.repeat(intensityLevel);

  return (
    <div className="flex flex-col items-center justify-center select-none bg-black/40 px-2 py-1 rounded-xl border border-amber-700/60 shadow-inner">
      <span className="text-[9px] font-black uppercase tracking-wider text-amber-300 leading-none mb-1">
        VIENTO
      </span>

      <div className="flex items-center gap-1.5">
        {/* Cartoon Adventure Circular Compass Radar */}
        <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-900 border-2 border-amber-500 shadow-inner flex items-center justify-center overflow-hidden">
          {/* Radar scan grid rings */}
          <div className="absolute inset-1 rounded-full border border-amber-500/30" />
          <div className="absolute w-full h-[1px] bg-amber-500/20" />
          <div className="absolute h-full w-[1px] bg-amber-500/20" />

          {/* Dynamic directional wind arrow */}
          <div
            className="w-1.5 h-6 bg-gradient-to-t from-emerald-400 to-cyan-300 rounded-full transition-transform duration-300 shadow-[0_0_6px_#34d399] flex items-start justify-center"
            style={{
              transform: `rotate(${isRight ? 90 : -90}deg)`
            }}
          >
            <div className="w-2.5 h-2.5 border-t-2 border-r-2 border-emerald-300 rotate-45 -mt-1" />
          </div>

          {/* Center compass hub */}
          <div className="absolute w-2 h-2 rounded-full bg-amber-300 z-10 shadow" />
        </div>

        {/* Readout & Arrow indicators */}
        <div className="flex flex-col items-start leading-tight">
          <span className="font-mono text-xs sm:text-sm font-black text-cyan-300">
            {wind.speed} <span className="text-[9px] text-slate-300">km/h</span>
          </span>
          <span className="text-[10px] font-mono font-black text-emerald-400 tracking-tighter">
            {intensityArrows}
          </span>
        </div>
      </div>
    </div>
  );
};
