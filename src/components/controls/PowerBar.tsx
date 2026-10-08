import React from 'react';

interface PowerBarProps {
  power: number; // 10 to 100
  isOscillating: boolean;
}

export const PowerBar: React.FC<PowerBarProps> = ({ power, isOscillating }) => {
  return (
    <div className="flex items-center gap-2 w-full select-none">
      <span className="text-[9px] sm:text-[10px] font-black uppercase text-amber-300 tracking-wider shrink-0 flex items-center gap-1">
        <span>FUERZA:</span>
        {isOscillating && (
          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
        )}
      </span>

      {/* Segmented Power Gauge Frame */}
      <div className="flex-1 h-4 sm:h-5 bg-slate-950 rounded-lg p-0.5 border-2 border-amber-600 shadow-inner relative overflow-hidden flex items-center">
        {/* Background LED Scale Track */}
        <div className="w-full h-full rounded flex gap-0.5 overflow-hidden bg-slate-900">
          {Array.from({ length: 20 }).map((_, i) => {
            const segmentPower = (i + 1) * 5;
            const isFilled = power >= segmentPower;
            const isRed = i >= 15;
            const isYellow = i >= 9 && i < 15;

            return (
              <div
                key={i}
                className={`flex-1 h-full rounded-xs transition-colors duration-75 ${
                  isFilled
                    ? isRed
                      ? 'bg-red-500 shadow-[0_0_4px_#ef4444]'
                      : isYellow
                      ? 'bg-amber-400 shadow-[0_0_4px_#f59e0b]'
                      : 'bg-emerald-400 shadow-[0_0_4px_#10b981]'
                    : 'bg-slate-800/80'
                }`}
              />
            );
          })}
        </div>

        {/* Sliding Target Indicator / Cursor */}
        <div
          className="absolute top-0 bottom-0 w-2 bg-white rounded shadow-[0_0_6px_#ffffff] transition-all duration-75 pointer-events-none"
          style={{
            left: `calc(${Math.min(96, Math.max(2, power))}% - 4px)`
          }}
        />
      </div>

      {/* Numeric Power % Readout */}
      <div className="font-mono text-xs sm:text-sm font-black text-amber-200 shrink-0 min-w-[38px] text-right">
        {Math.round(power)}%
      </div>
    </div>
  );
};
