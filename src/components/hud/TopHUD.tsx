import React from 'react';
import { PlayerState } from '../../types/game';
import { getCharacterById } from '../../config/characters';
import { Shield, Heart, Flag } from 'lucide-react';

interface TopHUDProps {
  player1: PlayerState;
  player2: PlayerState | null;
  currentTurn: 'player1' | 'player2';
  turnTimer: number;
  matchTimer: number;
  onSurrenderClick: () => void;
}

export const TopHUD: React.FC<TopHUDProps> = ({
  player1,
  player2,
  currentTurn,
  turnTimer,
  matchTimer,
  onSurrenderClick
}) => {
  const p1Char = player1.characterId ? getCharacterById(player1.characterId) : null;
  const p2Char = player2?.characterId ? getCharacterById(player2.characterId) : null;

  const formatMatchTime = (secs: number) => {
    if (secs < 0) return '∞';
    return String(secs);
  };

  const p1HpPercent = Math.max(0, Math.min(100, (player1.hp / player1.maxHp) * 100));
  const p2HpPercent = player2 ? Math.max(0, Math.min(100, (player2.hp / player2.maxHp) * 100)) : 100;

  const getHpBarGradient = (percent: number) => {
    if (percent > 60) return 'bg-emerald-500';
    if (percent > 25) return 'bg-amber-400';
    return 'bg-red-600 animate-pulse';
  };

  return (
    <header className="absolute top-0 left-0 right-0 z-30 pointer-events-none select-none p-2 sm:p-3 box-border overflow-hidden">
      {/* Top Banner Row */}
      <div className="flex items-start justify-between gap-1 sm:gap-2 max-w-5xl mx-auto">
        
        {/* Player 1 HUD Box (~33% width) */}
        <div className={`w-[33%] max-w-[130px] sm:max-w-[180px] flex flex-col pointer-events-auto transition-all duration-300 ${
          currentTurn === 'player1' ? 'scale-[1.02] filter drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'opacity-85'
        }`}>
          {/* Label: PLAYER 1 and HP % */}
          <div className="flex items-center justify-between text-[10px] sm:text-xs font-black tracking-wider text-slate-200 px-1 mb-0.5">
            <span className="text-amber-400 uppercase font-black">PLAYER 1</span>
            <span className={`font-mono font-bold ${
              p1HpPercent <= 25 ? 'text-red-400' : p1HpPercent <= 60 ? 'text-amber-300' : 'text-emerald-300'
            }`}>
              {Math.round(p1HpPercent)}%
            </span>
          </div>

          {/* P1 HP Bar (Dynamic: Verde -> Amarillo -> Rojo en último 25%) */}
          <div className="h-3.5 sm:h-4 bg-slate-950/95 rounded-md p-0.5 border-2 border-amber-600 shadow-inner relative overflow-hidden">
            <div
              className={`h-full rounded transition-all duration-300 ${getHpBarGradient(p1HpPercent)}`}
              style={{ width: `${p1HpPercent}%` }}
            />
          </div>

          {/* Debajo: Nombre del jugador */}
          <div className="text-[11px] sm:text-xs font-black text-white truncate px-1 mt-0.5">
            {player1.name}
          </div>

          {/* P1 Character Badge & Lives */}
          <div className="flex items-center justify-between mt-0.5 px-1 bg-slate-950/70 backdrop-blur-sm rounded py-0.5 border border-slate-700/60">
            <div className="flex items-center gap-1">
              <span className="text-xs">{p1Char?.badgeSymbol || '🎮'}</span>
              <span className="text-[9px] sm:text-[10px] font-black uppercase text-amber-300 tracking-wider">
                {p1Char?.name || 'MONO'}
              </span>
            </div>
            {/* Lives Indicators */}
            <div className="flex items-center gap-0.5">
              {player1.maxLives > 100 ? (
                <span className="text-[11px] font-black text-cyan-300">∞</span>
              ) : Array.from({ length: player1.maxLives }).map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${
                    i < player1.lives ? 'bg-red-500 shadow-[0_0_4px_#ef4444]' : 'bg-slate-700'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Center Timer & Turn Box */}
        <div className="flex flex-col items-center justify-center shrink-0 mx-1 pointer-events-auto">
          <div className="bg-gradient-to-b from-amber-600 to-amber-900 border-2 border-amber-400 rounded-xl px-2 sm:px-3 py-1 shadow-lg flex flex-col items-center min-w-[62px] sm:min-w-[76px]">
            {/* Match Total Countdown: pure number (e.g. 600 o ∞) */}
            <span className="text-sm sm:text-base font-black font-mono text-amber-100 tracking-tight leading-none drop-shadow">
              {formatMatchTime(matchTimer)}
            </span>
            {/* Turn Timer Dial: pure number (e.g. 45 -> 0) */}
            <div className={`mt-0.5 px-1.5 py-0.2 rounded text-xs sm:text-sm font-black font-mono leading-none ${
              turnTimer <= 10 ? 'bg-red-600 text-white animate-pulse' : 'bg-slate-950 text-amber-300'
            }`}>
              {turnTimer}
            </div>
          </div>
          <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-amber-200/90 mt-0.5 bg-black/60 px-1.5 py-0.2 rounded border border-amber-500/30">
            {currentTurn === 'player1' ? '◀ TURNO P1' : 'TURNO P2 ▶'}
          </span>
        </div>

        {/* Player 2 HUD Box (~33% width) */}
        <div className={`w-[33%] max-w-[130px] sm:max-w-[180px] flex flex-col pointer-events-auto transition-all duration-300 ${
          currentTurn === 'player2' ? 'scale-[1.02] filter drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'opacity-85'
        }`}>
          {/* Label: PLAYER 2 and HP % */}
          <div className="flex items-center justify-between text-[10px] sm:text-xs font-black tracking-wider text-slate-200 px-1 mb-0.5">
            <span className={`font-mono font-bold ${
              p2HpPercent <= 25 ? 'text-red-400' : p2HpPercent <= 60 ? 'text-amber-300' : 'text-emerald-300'
            }`}>
              {Math.round(p2HpPercent)}%
            </span>
            <span className="text-amber-400 uppercase font-black">PLAYER 2</span>
          </div>

          {/* P2 HP Bar (Dynamic: Verde -> Amarillo -> Rojo en último 25%) */}
          <div className="h-3.5 sm:h-4 bg-slate-950/95 rounded-md p-0.5 border-2 border-amber-600 shadow-inner relative overflow-hidden">
            <div
              className={`h-full rounded transition-all duration-300 ${getHpBarGradient(p2HpPercent)} float-right`}
              style={{ width: `${p2HpPercent}%` }}
            />
          </div>

          {/* Debajo: Nombre del jugador */}
          <div className="text-[11px] sm:text-xs font-black text-white truncate px-1 mt-0.5 text-right">
            {player2 ? player2.name : 'ESPERANDO...'}
          </div>

          {/* P2 Character Badge & Lives */}
          <div className="flex items-center justify-between mt-0.5 px-1 bg-slate-950/70 backdrop-blur-sm rounded py-0.5 border border-slate-700/60">
            {/* Lives Indicators */}
            <div className="flex items-center gap-0.5">
              {player2 && (player2.maxLives > 100 ? (
                <span className="text-[11px] font-black text-cyan-300">∞</span>
              ) : Array.from({ length: player2.maxLives }).map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${
                    i < player2.lives ? 'bg-red-500 shadow-[0_0_4px_#ef4444]' : 'bg-slate-700'
                  }`}
                />
              ))) : null}
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[9px] sm:text-[10px] font-black uppercase text-amber-300 tracking-wider">
                {p2Char?.name || 'TORTUGA'}
              </span>
              <span className="text-xs">{p2Char?.badgeSymbol || '🛡️'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Discrete Surrender Button (Warning: Defeat applies!) */}
      <div className="flex justify-end mt-1 pointer-events-auto">
        <button
          onClick={onSurrenderClick}
          className="bg-red-950/80 hover:bg-red-900 text-red-300 hover:text-white border border-red-700/60 text-[10px] font-bold px-2 py-0.5 rounded transition flex items-center gap-1 shadow"
          title="Salir de la partida (se computa derrota)"
        >
          <Flag className="w-3 h-3 text-red-400" />
          Rendirse / Salir
        </button>
      </div>
    </header>
  );
};
