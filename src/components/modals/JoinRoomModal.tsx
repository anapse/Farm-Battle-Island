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
  joinerName,
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

  // Disambiguate creator names if identical in lobby (Juan, Juan 2, Juan 3)
  const nameCounts: Record<string, number> = {};
  const disambiguatedMatches = availableMatches.map((match) => {
    const rawName = match.creatorPlayerName || match.player1.name || 'Comandante';
    const lower = rawName.toLowerCase();
    nameCounts[lower] = (nameCounts[lower] || 0) + 1;
    const count = nameCounts[lower];
    const displayCreatorName = count > 1 ? `${rawName} ${count}` : rawName;
    return { match, displayCreatorName };
  });

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm select-none">
      <div className="w-full max-w-sm bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-sky-500 rounded-2xl shadow-2xl p-5 text-slate-100 relative max-h-[85vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <span className="text-[10px] font-black tracking-widest text-sky-400 uppercase">
              LOBBY ONLINE FIRESTORE
            </span>
            <h2 className="text-xl font-black text-white">
              PARTIDAS DISPONIBLES
            </h2>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                setIsRefreshing(true);
                setTimeout(() => setIsRefreshing(false), 500);
              }}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              title="Actualizar lista"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Player info notice */}
        <div className="text-[11px] text-slate-400 my-2 px-1">
          Te unirás como: <span className="text-sky-300 font-bold">{joinerName}</span>
        </div>

        {/* Room List Container */}
        <div className="flex-1 overflow-y-auto space-y-2 py-2 pr-1">
          {disambiguatedMatches.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center text-slate-400">
              <Users className="w-10 h-10 text-slate-600 mb-2" />
              <p className="text-sm font-bold text-slate-300">No hay salas esperando jugadores</p>
              <p className="text-xs text-slate-500 mt-1 max-w-[200px]">
                Crea una sala nueva con el botón CREAR para que otro jugador se una.
              </p>
            </div>
          ) : (
            disambiguatedMatches.map(({ match, displayCreatorName }) => (
              <div
                key={match.matchId}
                className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-sky-500 rounded-xl p-3 flex items-center justify-between transition shadow"
              >
                <div className="flex flex-col">
                  {/* Creator name with disambiguation (Juan, Juan 2, Juan 3) in lobby */}
                  <div className="font-black text-sm text-white flex items-center gap-1.5">
                    <span className="text-amber-400">👑</span>
                    <span>{displayCreatorName}</span>
                  </div>

                  {/* Rules summary tags */}
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-300">
                    <span className="flex items-center gap-0.5 text-amber-300 font-bold">
                      <Clock className="w-3 h-3 text-cyan-400" />
                      {match.settings.timeLimit ? '5 MIN' : '∞'}
                    </span>
                    <span className="text-slate-500">·</span>
                    <span className="flex items-center gap-0.5 text-red-300 font-bold">
                      <Shield className="w-3 h-3 text-red-400" />
                      {match.settings.lives} {match.settings.lives === 1 ? 'vida' : 'vidas'}
                    </span>
                    <span className="text-slate-500">·</span>
                    <span className="text-slate-400 font-mono">
                      #{match.matchId}
                    </span>
                  </div>
                </div>

                {/* UNIR Button */}
                <button
                  onClick={() => onJoin(match.matchId)}
                  className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-black text-xs uppercase tracking-wider shadow border border-sky-300 flex items-center gap-1 active:scale-95 transition"
                >
                  <span>UNIR</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-slate-800 text-center text-[10px] text-slate-500">
          Las salas con 2 jugadores se inician automáticamente y se ocultan del lobby.
        </div>

      </div>
    </div>
  );
};
