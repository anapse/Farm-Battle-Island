import React from 'react';
import { Trophy, Skull, Flag, ArrowRight, RotateCcw, Home } from 'lucide-react';
import { CharacterId } from '../../types/game';
import { getCharacterById } from '../../config/characters';

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
  winnerCharacterId,
  onPlayAgain,
  onBackToMenu
}) => {
  const winnerChar = winnerCharacterId ? getCharacterById(winnerCharacterId) : null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none">
      <div className={`w-full max-w-sm rounded-3xl shadow-2xl p-5 text-slate-100 text-center border-4 ${
        isVictory 
          ? 'bg-gradient-to-b from-amber-950 via-slate-900 to-slate-950 border-amber-400' 
          : 'bg-gradient-to-b from-red-950 via-slate-900 to-slate-950 border-red-500'
      }`}>
        
        {/* Result Icon */}
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-2 border-2 shadow-lg ${
          isVictory 
            ? 'bg-amber-500/20 border-amber-400 text-amber-300' 
            : 'bg-red-500/20 border-red-400 text-red-400'
        }`}>
          {isVictory ? (
            <Trophy className="w-9 h-9 fill-amber-400" />
          ) : (
            <Skull className="w-9 h-9" />
          )}
        </div>

        {/* Title */}
        <span className={`text-[10px] font-black tracking-widest uppercase ${
          isVictory ? 'text-amber-400' : 'text-red-400'
        }`}>
          FIN DE LA BATALLA
        </span>
        <h2 className="text-3xl font-black text-white font-['Fredoka',sans-serif] mt-0.5 tracking-wide">
          {isVictory ? '¡VICTORIA!' : '¡DERROTA!'}
        </h2>

        {/* Surrender / Abandonment Tag */}
        {isSurrender && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-950/80 border border-red-600/60 rounded-full text-[10px] font-bold text-red-200 my-2">
            <Flag className="w-3 h-3 text-red-400" />
            <span>{surrenderMessage || 'Partida finalizada por abandono'}</span>
          </div>
        )}

        {/* Outcome Stats Box */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3 my-3 text-left space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400 font-bold">Vencedor:</span>
            <span className="text-emerald-400 font-black">{winnerName}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400 font-bold">Derrotado:</span>
            <span className="text-red-400 font-black">{loserName}</span>
          </div>

          <div className="pt-2 border-t border-slate-800 space-y-1">
            <div className="flex justify-between items-center text-[11px] text-slate-300">
              <span>Daño infligido (1 pt / daño):</span>
              <span className="font-mono font-bold text-amber-200">
                +{isVictory ? Math.max(0, earnedPoints - 50) : earnedPoints} pts
              </span>
            </div>

            {isVictory && (
              <div className="flex justify-between items-center text-[11px] text-emerald-300">
                <span>Bono Victoria (50% HP máx):</span>
                <span className="font-mono font-bold text-emerald-400">+50 pts</span>
              </div>
            )}

            <div className="pt-1 border-t border-slate-800/80 flex justify-between items-center">
              <span className="text-xs text-amber-300 font-black">Total Puntos Clasificación:</span>
              <span className="text-sm font-mono font-black text-amber-400">+{earnedPoints} pts</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 mt-4">
          <button
            onClick={onPlayAgain}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white font-black text-xs uppercase tracking-wider shadow-lg border-2 border-emerald-300 flex items-center justify-center gap-2 active:scale-95 transition"
          >
            <RotateCcw className="w-4 h-4" />
            <span>JUGAR DE NUEVO</span>
          </button>

          <button
            onClick={onBackToMenu}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 font-bold text-xs uppercase tracking-wider border border-slate-700 flex items-center justify-center gap-2 transition"
          >
            <Home className="w-4 h-4" />
            <span>MENÚ PRINCIPAL</span>
          </button>
        </div>

      </div>
    </div>
  );
};
