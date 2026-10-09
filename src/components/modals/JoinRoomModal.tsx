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
            LOBBY MULTIJUGADOR
          </h2>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={onCycleSound}
            title={`Sonido: ${soundLevel === 'high' ? 'Alto' : soundLevel === 'medium' ? 'Medio' : soundLevel === 'low' ? 'Bajo' : 'Apagado'}. Pulsa para cambiar`}
            aria-label="Cambiar volumen"
            className="text-white hover:brightness-110 px-3 py-2 rounded-xl bg-[linear-gradient(180deg,#ffe08a,#d68a18_52%,#76400b)] border-2 border-[#fff0b5] shadow-[inset_0_2px_0_rgba(255,255,255,0.5),0_3px_0_#512b08] transition cursor-pointer flex items-center gap-2"
          >
            {soundLevel === 'off' ? <VolumeX className="w-4 h-4" /> : soundLevel === 'low' ? <Volume1 className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            <span className="text-[9px] font-black">{soundLevel === 'high' ? 'ALTO' : soundLevel === 'medium' ? 'MEDIO' : soundLevel === 'low' ? 'BAJO' : 'OFF'}</span>
          </button>
          <button
            onClick={() => {
              setIsRefreshing(true);
              setTimeout(() => setIsRefreshing(false), 500);
            }}
            className="text-white hover:brightness-125 p-2 rounded-xl bg-[linear-gradient(180deg,#526a7d,#243b4b_65%,#111f2a)] border-2 border-[#9cc9df] shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_3px_0_#101b22] transition cursor-pointer"
            title="Actualizar"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onClose}
            className="text-white hover:brightness-125 p-2 rounded-xl bg-[linear-gradient(180deg,#526a7d,#243b4b_65%,#111f2a)] border-2 border-[#9cc9df] shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_3px_0_#101b22] transition cursor-pointer"
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
              Sé el primero en crear una sala y espera a tu rival.
            </p>
          </div>
        ) : (
          disambiguatedMatches.map(({ match, displayCreatorName }) => (
            <div
              key={match.matchId}
              className="bg-[linear-gradient(135deg,rgba(56,67,62,0.96),rgba(15,22,20,0.96))] backdrop-blur-md border border-[#c19a59]/80 hover:border-[#f5d28a] rounded-xl p-4 flex items-center justify-between transition shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_4px_10px_rgba(0,0,0,0.45)]"
            >
              <div className="flex flex-col">
                <div className="font-black text-sm text-white flex items-center gap-1.5">
                  <span className="text-amber-500">👑</span>
                  <span>{displayCreatorName}</span>
                </div>

                <div className="mt-1 text-[10px] text-emerald-300 font-black uppercase tracking-wide">
                  🏝️ {getIslandById(match.settings.islandId).title} · {getIslandById(match.settings.islandId).name}
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
                className="px-4 py-2.5 rounded-xl bg-[linear-gradient(180deg,#9ce8ff_0%,#1599ec_45%,#07519c_82%,#06294f_100%)] hover:brightness-110 text-white font-black text-sm uppercase tracking-wider border-2 border-[#b8f1ff] shadow-[inset_0_2px_0_rgba(255,255,255,0.65),inset_0_-4px_0_rgba(0,0,0,0.28),0_4px_0_#06254b,0_7px_10px_rgba(0,0,0,0.5)] flex items-center gap-2 active:translate-y-1 transition cursor-pointer"
              >
                <span>UNIR</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Footer: one clear action to create a room */}
      <div className="relative z-10 text-center pb-1">
        <button
          onClick={onCreateRoom}
          className="w-full max-w-[340px] py-4 rounded-xl bg-[linear-gradient(180deg,#ffcf75_0%,#ff8a1d_45%,#bd4709_82%,#6d2608_100%)] hover:brightness-110 text-white font-black text-base uppercase tracking-wider border-2 border-[#ffe0a4] shadow-[inset_0_2px_0_rgba(255,255,255,0.7),inset_0_-4px_0_rgba(70,20,0,0.3),0_5px_0_#612305,0_8px_12px_rgba(0,0,0,0.55)] flex items-center justify-center gap-3 transition active:translate-y-1 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          CREAR SALA
        </button>
      </div>

    </div>
  );
};
