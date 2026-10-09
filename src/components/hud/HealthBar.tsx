import React from 'react';

interface HealthBarProps {
  playerName: string;
  hp: number;
  maxHp: number;
  lives: number;
  maxLives: number;
  isCurrentTurn: boolean;
  align: 'left' | 'right';
  hasShield?: boolean;
}

export const HealthBar: React.FC<HealthBarProps> = ({
  playerName,
  hp,
  maxHp,
  lives,
  maxLives,
  isCurrentTurn,
  align,
  hasShield
}) => {
  const hpPercent = Math.max(0, Math.min(100, (hp / maxHp) * 100));

  // Transition: Green (100-60%) -> Yellow (60-25%) -> Red (last 25% clearly red)
  const getHpColor = (percent: number) => {
    if (percent > 60) return 'from-emerald-500 via-green-400 to-lime-500';
    if (percent > 25) return 'from-amber-500 via-yellow-400 to-amber-600';
    return 'from-red-600 via-red-500 to-rose-600';
  };

  return (
    <div className={`w-[33%] max-w-[130px] sm:max-w-[170px] flex flex-col select-none transition-all duration-200 ${
      isCurrentTurn ? 'scale-[1.02] filter drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]' : 'opacity-90'
    }`}>
      
      {/* Top Header: HP % & Shield Status */}
      <div className={`flex items-center justify-between text-[9px] sm:text-xs font-mono font-black px-0.5 mb-0 ${
        align === 'right' ? 'flex-row-reverse' : ''
      }`}>
        <span className={`font-black tracking-tight ${
          hpPercent <= 25 ? 'text-red-400 animate-pulse' : hpPercent <= 60 ? 'text-amber-300' : 'text-emerald-300'
        }`}>
          {Math.round(hpPercent)}%
        </span>

        {hasShield && (
          <span className="text-[9px] bg-blue-900/90 text-cyan-300 px-1 py-0.2 rounded border border-cyan-400 font-bold uppercase animate-pulse">
            🛡 ESCUDO
          </span>
        )}
      </div>

      {/* Main Health Bar (100% full, smooth gradient) */}
      <div className="h-3 sm:h-4 bg-slate-950/95 rounded-md p-0.5 border border-amber-500 shadow-inner relative overflow-hidden">
        <div
          className={`h-full rounded transition-all duration-300 bg-gradient-to-r ${getHpColor(hpPercent)} ${
            align === 'right' ? 'float-right' : ''
          }`}
          style={{ width: `${hpPercent}%` }}
        />
      </div>

      {/* Underneath: Real Player Name & Lives */}
      <div className={`flex items-center justify-between mt-0.5 px-1 bg-slate-950/90 rounded py-0 border border-slate-700/60 ${
        align === 'right' ? 'flex-row-reverse' : ''
      }`}>
        {/* Real player name (NO "Juan 2", strictly real name) */}
        <span className="text-[10px] sm:text-[11px] font-black uppercase text-amber-200 tracking-wider truncate max-w-[58px] sm:max-w-[100px]">
          {playerName}
        </span>

        {/* Lives indicators */}
        <div className="flex items-center gap-1">
          {Array.from({ length: maxLives }).map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full transition-all ${
                i < lives 
                  ? 'bg-red-500 shadow-[0_0_5px_#ef4444]' 
                  : 'bg-slate-800 border border-slate-700'
              }`}
              title={`Vida ${i + 1}`}
            />
          ))}
        </div>
      </div>

    </div>
  );
};
