import { getAssetUrl } from '../../utils/assets';
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
    <div className="absolute inset-0 z-50 flex flex-col justify-between gap-2 p-2 sm:p-3 select-none overflow-hidden bg-slate-950">
      
      {/* Official Menu Background (fondomenu.png) */}
      <img
        src={getAssetUrl('assets/sprites/fondomenu.png')}
        alt="Fondo Menú"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-100"
      />

      {/* Dark Vignette Overlay */}
      <div className="absolute inset-0 bg-black/5 pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-700 fill-amber-600" />
          <h2 className="text-xl sm:text-2xl font-black text-white font-['Fredoka',sans-serif] drop-shadow">
            TOP 50
          </h2>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={loadData}
            className="text-white hover:brightness-125 p-2.5 rounded-lg bg-[linear-gradient(180deg,#36515a,#1b3038_65%,#101b20)] border-2 border-[#8aa0a5] shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_3px_0_#0b1519,0_5px_8px_rgba(0,0,0,0.4)] transition cursor-pointer"
            title="Recargar"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onClose}
            className="text-white hover:brightness-125 p-2.5 rounded-lg bg-[linear-gradient(180deg,#36515a,#1b3038_65%,#101b20)] border-2 border-[#8aa0a5] shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_3px_0_#0b1519,0_5px_8px_rgba(0,0,0,0.4)] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Table Column Headers */}
      <div className="relative z-10 grid grid-cols-12 gap-1 py-1.5 px-3 text-[11px] sm:text-xs font-black uppercase text-amber-200 border-b border-slate-800 mt-2 bg-[#141713]/72 rounded-t-lg backdrop-blur-sm">
        <span className="col-span-1 text-center">#</span>
        <span className="col-span-3">JUGADOR</span>
        <span className="col-span-2 text-right">PUNTOS</span>
        <span className="col-span-2 text-right">PJ</span>
        <span className="col-span-2 text-right text-[#8fa878]">VIC</span>
        <span className="col-span-2 text-right text-red-500">DER</span>
      </div>

      {/* Ranking List */}
      <div className="relative z-10 flex-1 overflow-y-auto space-y-1 py-1 pr-0.5 bg-slate-950/60 rounded-b-lg backdrop-blur-sm">
        {rankings.map((player, index) => {
          const isTop3 = index < 3;
          const isCurrent = currentPlayerName && player.playerName.toLowerCase() === currentPlayerName.toLowerCase();

          return (
            <div
              key={player.playerName + index}
              className={`grid grid-cols-12 gap-1 items-center px-2 py-2.5 rounded-lg text-sm transition border ${
                isCurrent
                  ? 'bg-amber-950/80 border-[#9a8351] text-amber-200 font-bold shadow-sm'
                  : isTop3
                  ? 'bg-[#1d211c]/88 border-[#555a4e] text-white font-semibold'
                  : 'bg-slate-950/60 border-slate-800 text-slate-300'
              }`}
            >
              {/* Posición */}
              <div className="col-span-1 flex items-center justify-center font-mono font-black">
                {index === 0 ? (
                  <span className="text-yellow-600 text-sm">🥇 1</span>
                ) : index === 1 ? (
                  <span className="text-slate-300 text-sm">🥈 2</span>
                ) : index === 2 ? (
                  <span className="text-amber-700 text-sm">🥉 3</span>
                ) : (
                  <span className="text-slate-500 font-mono text-[11px]">{index + 1}</span>
                )}
              </div>

              {/* Jugador */}
              <div className="col-span-3 truncate font-bold text-slate-100">
                {player.playerName}
                {isCurrent && <span className="ml-1 text-[9px] text-amber-500 font-black">(TÚ)</span>}
              </div>

              {/* Puntos */}
              <div className="col-span-2 text-right font-mono font-black text-amber-500">
                {player.score.toLocaleString()}
              </div>

              {/* Partidas jugadas */}
              <div className="col-span-2 text-right font-mono font-bold text-slate-300">
                {player.matchesPlayed ?? (player.victories + player.defeats)}
              </div>

              {/* Victorias */}
              <div className="col-span-2 text-right font-mono font-bold text-[#8fa878]">
                {player.victories}
              </div>

              {/* Derrotas */}
              <div className="col-span-2 text-right font-mono font-bold text-red-500">
                {player.defeats}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="relative z-10 text-center pt-2">
        <button
          onClick={onClose}
          className="w-full min-h-11 py-3 rounded-xl bg-[#1d211c]/95 hover:bg-slate-800 text-slate-300 font-bold text-xs uppercase border border-[#555a4e] transition cursor-pointer"
        >
          Cerrar
        </button>
      </div>

    </div>
  );
};
