import { getAssetUrl } from '../../utils/assets';
import React, { useState, useEffect } from 'react';
import { subscribeToAvailableMatches } from '../../services/onlineMatchService';
import { OnlineMatch } from '../../types/game';
import { X, Users, RefreshCw, Clock, Shield, ArrowRight } from 'lucide-react';

interface JoinRoomModalProps {
  joinerName: string;
  onClose: () => void;
  onJoin: (matchId: string) => void;
}

export const JoinRoomModal: React.FC<JoinRoomModalProps> = ({
  onClose,
  onJoin
}) => {
  const [availableMatches, setAvailableMatches] = useState<OnlineMatch[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    setIsRefreshing(true);
    const unsubscribe = subscribeToAvailableMatches((matches) => {
      setAvailableMatches(matches);
      setIsRefreshing(false);
    });
    return () => unsubscribe();
  }, []);

  const nameCounts: Record<string, number> = {};
  const disambiguatedMatches = availableMatches.map((match) => {
    const rawName = match.creatorPlayerName || match.player1.name || 'Jugador';
    const lower = rawName.toLowerCase();
    nameCounts[lower] = (nameCounts[lower] || 0) + 1;
    const count = nameCounts[lower];
    const displayCreatorName = count > 1 ? `${rawName} ${count}` : rawName;
    return { match, displayCreatorName };
  });

  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-between p-4 select-none overflow-hidden bg-slate-950">
      
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
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white font-['Fredoka',sans-serif] drop-shadow">
            PARTIDAS DISPONIBLES
          </h2>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              setIsRefreshing(true);
              setTimeout(() => setIsRefreshing(false), 500);
            }}
            className="text-slate-300 hover:text-white p-1.5 rounded-lg bg-[#1d211c]/82 border border-[#555a4e] transition cursor-pointer"
            title="Actualizar"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white p-1.5 rounded-lg bg-[#1d211c]/82 border border-[#555a4e] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Room List Container */}
      <div className="relative z-10 flex-1 overflow-y-auto space-y-2 my-3 max-w-[340px] w-full mx-auto pr-1">
        {disambiguatedMatches.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 p-4">
            <div className="w-12 h-12 rounded-full bg-[#1d211c]/82 border border-[#555a4e] flex items-center justify-center mb-2">
              <Users className="w-6 h-6 text-slate-500" />
            </div>
            <p className="text-sm font-bold text-slate-300">No hay salas disponibles</p>
            <p className="text-xs text-slate-400 mt-1">
              Crea una sala nueva con el botón CREAR.
            </p>
          </div>
        ) : (
          disambiguatedMatches.map(({ match, displayCreatorName }) => (
            <div
              key={match.matchId}
              className="bg-[#141713]/72 backdrop-blur-md border border-[#555a4e]/80 hover:border-[#8f7a4e] rounded-xl p-3 flex items-center justify-between transition shadow-md"
            >
              <div className="flex flex-col">
                <div className="font-black text-sm text-white flex items-center gap-1.5">
                  <span className="text-amber-500">👑</span>
                  <span>{displayCreatorName}</span>
                </div>

                <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-300">
                  <span className="flex items-center gap-0.5 text-amber-500 font-bold">
                    <Clock className="w-3 h-3 text-[#9b8b62]" />
                    {match.settings.timeLimit ? '5 MIN' : '∞'}
                  </span>
                  <span className="text-slate-500">·</span>
                  <span className="flex items-center gap-0.5 text-red-500 font-bold">
                    <Shield className="w-3 h-3 text-red-500" />
                    {match.settings.lives} {match.settings.lives === 1 ? 'vida' : 'vidas'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => onJoin(match.matchId)}
                className="px-3 py-1.5 rounded-lg bg-[#806c42] hover:bg-[#927b4d] text-white font-black text-xs uppercase tracking-wider shadow border border-[#8f7a4e] flex items-center gap-1 active:scale-95 transition cursor-pointer"
              >
                <span>UNIR</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="relative z-10 text-center pb-1">
        <button
          onClick={onClose}
          className="w-full max-w-[340px] py-2 rounded-lg bg-[#1d211c]/88 hover:bg-slate-800 text-slate-300 font-bold text-xs uppercase border border-[#555a4e] transition cursor-pointer"
        >
          Atrás
        </button>
      </div>

    </div>
  );
};
