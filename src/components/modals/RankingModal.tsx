import React, { useState, useEffect } from 'react';
import { getRankings, fetchOnlineTop50 } from '../../services/rankingService';
import { PlayerRanking } from '../../types/game';
import { Trophy, X, RefreshCw } from 'lucide-react';

interface RankingModalProps {
  onClose: () => void;
  currentPlayerName?: string;
}

export const RankingModal: React.FC<RankingModalProps> = ({
  onClose,
  currentPlayerName
}) => {
  const [rankings, setRankings] = useState<PlayerRanking[]>(() => getRankings());
  const [isLoading, setIsLoading] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    const list = await fetchOnlineTop50();
    setRankings(list);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm select-none">
      <div className="w-full max-w-sm bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-amber-500 rounded-3xl shadow-2xl p-4 sm:p-5 text-slate-100 flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-400 flex items-center justify-center">
              <Trophy className="w-4 h-4 text-amber-400 fill-amber-400" />
            </div>
            <div>
              <span className="text-[10px] font-black tracking-widest text-amber-400 uppercase">
                CLASIFICACIÓN GLOBAL FIRESTORE
              </span>
              <h2 className="text-xl font-black text-white">
                TOP 50 ISLA
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={loadData}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              title="Recargar clasificación"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Table Column Titles */}
        <div className="grid grid-cols-12 gap-1 py-2 px-3 text-[10px] font-black uppercase text-amber-300/90 border-b border-slate-800 mt-1">
          <span className="col-span-2 text-center">POSICIÓN</span>
          <span className="col-span-4">JUGADOR</span>
          <span className="col-span-2 text-right">PUNTOS</span>
          <span className="col-span-2 text-right text-emerald-400">VICTORIAS</span>
          <span className="col-span-2 text-right text-red-400">DERROTAS</span>
        </div>

        {/* Ranking List */}
        <div className="flex-1 overflow-y-auto space-y-1.5 py-2 pr-1">
          {rankings.map((player, index) => {
            const isTop3 = index < 3;
            const isCurrent = currentPlayerName && player.playerName.toLowerCase() === currentPlayerName.toLowerCase();

            return (
              <div
                key={player.playerName + index}
                className={`grid grid-cols-12 gap-1 items-center px-3 py-2 rounded-xl text-xs transition border ${
                  isCurrent
                    ? 'bg-amber-950/70 border-amber-400 text-amber-100 font-bold shadow-sm'
                    : isTop3
                    ? 'bg-slate-800/90 border-slate-700 text-white font-semibold'
                    : 'bg-slate-900/60 border-slate-800/80 text-slate-300'
                }`}
              >
                {/* Posición */}
                <div className="col-span-2 flex items-center justify-center font-mono font-black">
                  {index === 0 ? (
                    <span className="text-yellow-400 text-sm">🥇 1</span>
                  ) : index === 1 ? (
                    <span className="text-slate-300 text-sm">🥈 2</span>
                  ) : index === 2 ? (
                    <span className="text-amber-600 text-sm">🥉 3</span>
                  ) : (
                    <span className="text-slate-500 font-mono text-[11px]">{index + 1}</span>
                  )}
                </div>

                {/* Jugador */}
                <div className="col-span-4 truncate font-bold text-slate-100">
                  {player.playerName}
                  {isCurrent && <span className="ml-1 text-[9px] text-amber-400 font-black">(TÚ)</span>}
                </div>

                {/* Puntos */}
                <div className="col-span-2 text-right font-mono font-black text-amber-300">
                  {player.score.toLocaleString()}
                </div>

                {/* Victorias */}
                <div className="col-span-2 text-right font-mono font-bold text-emerald-400">
                  {player.victories}
                </div>

                {/* Derrotas */}
                <div className="col-span-2 text-right font-mono font-bold text-red-400">
                  {player.defeats}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-slate-800 text-center text-[10px] text-slate-500">
          Criterios: 1° Score · 2° Victorias · 3° Menor número de derrotas.
        </div>

      </div>
    </div>
  );
};
