import { getAssetUrl } from '../../utils/assets';
import React, { useState, useEffect } from 'react';
import { subscribeToAvailableMatches } from '../../services/onlineMatchService';
import { OnlineMatch } from '../../types/game';
import { getIslandById } from '../../config/islands';
import { X, Users, RefreshCw, Clock, Shield, ArrowRight, PlusCircle, Volume2, Volume1, VolumeX } from 'lucide-react';

interface JoinRoomModalProps {
  joinerName: string;
  onClose: () => void;
  onJoin: (matchId: string) => void;
  onCreateRoom: () => void;
  soundLevel: 'high' | 'medium' | 'low' | 'off';
  onCycleSound: () => void;
}

export const JoinRoomModal: React.FC<JoinRoomModalProps> = ({
  onClose,
  onJoin,
  onCreateRoom,
  soundLevel,
  onCycleSound
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
      <div className="relative z-10 flex items-center justify-between pt-1 shrink-0">
        <div>
          <h2 className="max-w-[150px] sm:max-w-none text-base sm:text-2xl font-black text-white leading-tight font-['Fredoka',sans-serif] bg-slate-950/65 rounded-lg px-2 py-1 drop-shadow-[0_2px_3px_rgba(0,0,0,1)]">
            LOBBY MULTIJUGADOR
          </h2>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={onCycleSound}
            title={`Sonido: ${soundLevel === 'high' ? 'Alto' : soundLevel === 'medium' ? 'Medio' : soundLevel === 'low' ? 'Bajo' : 'Apagado'}. Pulsa para cambiar`}
            aria-label="Cambiar volumen"
            className="text-white hover:brightness-110 px-3 py-2 rounded-xl bg-[linear-gradient(180deg,#36515a,#1b3038_65%,#101b20)] border-2 border-[#8aa0a5] shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_3px_0_#0b1519,0_5px_8px_rgba(0,0,0,0.4)] transition cursor-pointer flex items-center gap-2"
          >
            {soundLevel === 'off' ? <VolumeX className="w-4 h-4" /> : soundLevel === 'low' ? <Volume1 className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            <span className="text-[9px] font-black">{soundLevel === 'high' ? 'ALTO' : soundLevel === 'medium' ? 'MEDIO' : soundLevel === 'low' ? 'BAJO' : 'OFF'}</span>
          </button>
          <button
            onClick={() => {
              setIsRefreshing(true);
              setTimeout(() => setIsRefreshing(false), 500);
            }}
            className="text-white hover:brightness-125 p-2 rounded-xl bg-[linear-gradient(180deg,#36515a,#1b3038_65%,#101b20)] border-2 border-[#8aa0a5] shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_3px_0_#0b1519,0_5px_8px_rgba(0,0,0,0.4)] transition cursor-pointer"
            title="Actualizar"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onClose}
            className="text-white hover:brightness-125 p-2 rounded-xl bg-[linear-gradient(180deg,#36515a,#1b3038_65%,#101b20)] border-2 border-[#8aa0a5] shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_3px_0_#0b1519,0_5px_8px_rgba(0,0,0,0.4)] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Room List Container */}
      <div className="relative z-10 flex-1 min-h-0 overflow-hidden space-y-1.5 my-1 max-w-[360px] w-full mx-auto pr-0">
        {disambiguatedMatches.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 p-4">
            <div className="w-12 h-12 rounded-full bg-[#1d211c]/82 border border-[#555a4e] flex items-center justify-center mb-2">
              <Users className="w-6 h-6 text-slate-500" />
            </div>
            <p className="text-sm font-bold text-slate-300">No hay salas disponibles</p>
            <p className="text-xs text-slate-400 mt-1">
              Sé el primero en crear una sala y espera a tu rival.
            </p>
          </div>
        ) : (
          disambiguatedMatches.map(({ match, displayCreatorName }) => (
            <div
              key={match.matchId}
              className="bg-[#102b35]/95 backdrop-blur-md border border-[#bda56b]/60 hover:border-[#ffe8b4] rounded-lg p-2.5 flex items-center justify-between transition shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_4px_10px_rgba(0,0,0,0.45)]"
            >
              <div className="flex flex-col">
                <div className="font-black text-sm text-white flex items-center gap-1.5">
                  <span className="text-amber-500">👑</span>
                  <span>{displayCreatorName}</span>
                </div>

                <div className="mt-1 text-xs text-emerald-200 font-black uppercase tracking-wide">
                  🏝️ {getIslandById(match.settings.islandId).title} · {getIslandById(match.settings.islandId).name}
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs text-slate-100">
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
                className="px-4 py-2.5 rounded-xl bg-[linear-gradient(180deg,#ffe3a0,#c99a4a_48%,#81551e_85%,#35230e)] border-2 border-[#ffe8b4] shadow-[inset_0_2px_0_rgba(255,255,255,0.5),0_3px_0_#35230e,0_5px_8px_rgba(0,0,0,0.4)] hover:brightness-110 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 active:translate-y-1 transition cursor-pointer"
              >
                <span>UNIR</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Footer: one clear action to create a room */}
      <div className="relative z-10 text-center pb-1 shrink-0">
        <button
          onClick={onCreateRoom}
          className="w-full max-w-[340px] min-h-11 py-2 rounded-lg bg-[linear-gradient(180deg,#ffe3a0,#c99a4a_48%,#81551e_85%,#35230e)] border-2 border-[#ffe8b4] shadow-[inset_0_2px_0_rgba(255,255,255,0.5),0_3px_0_#35230e,0_5px_8px_rgba(0,0,0,0.4)] hover:brightness-110 text-white font-black text-sm uppercase tracking-wider flex items-center justify-center gap-3 transition active:translate-y-1 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          CREAR SALA
        </button>
      </div>

    </div>
  );
};
