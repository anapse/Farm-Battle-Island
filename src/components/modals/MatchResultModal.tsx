import React from 'react';
import { Trophy, Skull, Flag, RotateCcw, Home } from 'lucide-react';
import { CharacterId } from '../../types/game';

interface MatchResultModalProps {
  isVictory: boolean;
  earnedPoints: number;
  winnerName: string;
  loserName: string;
  isSurrender?: boolean;
  surrenderMessage?: string;
  winnerCharacterId?: CharacterId | null;
  onPlayAgain: () => void;
  onBackToMenu: () => void;
}

export const MatchResultModal: React.FC<MatchResultModalProps> = ({
  isVictory,
  earnedPoints,
  winnerName,
  loserName,
  isSurrender,
  surrenderMessage,
  onPlayAgain,
  onBackToMenu
}) => {
  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-between p-4 select-none overflow-hidden bg-slate-950">
      
      {/* Official Menu Background (fondomenu.png) */}
      <img
        src="/assets/sprites/fondomenu.png"
        alt="Fondo Menú"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-85"
      />

      {/* Dark Vignette Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-slate-950/80 pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 text-center pt-2">
        <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-1 border-2 shadow-lg ${
          isVictory 
            ? 'bg-amber-500/20 border-amber-400 text-amber-300' 
            : 'bg-red-500/20 border-red-400 text-red-400'
        }`}>
          {isVictory ? (
            <Trophy className="w-8 h-8 fill-amber-400" />
          ) : (
            <Skull className="w-8 h-8" />
          )}
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-white font-['Fredoka',sans-serif] tracking-wide drop-shadow">
          {isVictory ? '¡VICTORIA!' : '¡DERROTA!'}
        </h2>

        {isSurrender && (
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-red-950/80 border border-red-600/60 rounded-full text-[10px] font-bold text-red-200 mt-1">
            <Flag className="w-3 h-3 text-red-400" />
            <span>{surrenderMessage || 'Por abandono'}</span>
          </div>
        )}
      </div>

      {/* Outcome Stats Box */}
      <div className="relative z-10 my-auto max-w-[280px] w-full mx-auto bg-slate-950/85 backdrop-blur-md border border-slate-700/80 rounded-xl p-3 text-left space-y-2 shadow-2xl">
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-400 font-bold">Vencedor:</span>
          <span className="text-emerald-400 font-black">{winnerName}</span>
        </div>
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-400 font-bold">Derrotado:</span>
          <span className="text-red-400 font-black">{loserName}</span>
        </div>

        <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
          <span className="text-xs text-amber-300 font-bold">Puntos Obtenidos:</span>
          <span className="text-sm font-mono font-black text-amber-400">+{earnedPoints} pts</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="relative z-10 flex flex-col gap-2 max-w-[280px] w-full mx-auto pb-1">
        <button
          onClick={onPlayAgain}
          className="w-full py-2.5 rounded-lg bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white font-bold text-xs uppercase tracking-wider shadow-md border border-emerald-300 flex items-center justify-center gap-2 active:scale-95 transition cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>JUGAR DE NUEVO</span>
        </button>

        <button
          onClick={onBackToMenu}
          className="w-full py-2 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-300 font-bold text-xs uppercase border border-slate-700 flex items-center justify-center gap-2 transition cursor-pointer"
        >
          <Home className="w-3.5 h-3.5" />
          <span>MENÚ PRINCIPAL</span>
        </button>
      </div>

    </div>
  );
};
