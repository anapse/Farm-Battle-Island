import React, { useState } from 'react';
import { getAssetUrl } from '../../utils/assets';
import { 
  Play, 
  Users, 
  Trophy, 
  Mail, 
  UserCheck, 
  X,
  Volume2,
  Volume1,
  VolumeX
} from 'lucide-react';

interface MainMenuProps {
  onQuickPlay: (playerName: string) => void;
  onJoinRoom: () => void;
  onRanking: () => void;
  onContact: () => void;
  playerName: string;
  onPlayerNameChange: (name: string) => void;
  soundLevel: 'high' | 'medium' | 'low' | 'off';
  onCycleSound: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  onQuickPlay,
  onJoinRoom,
  onRanking,
  onContact,
  playerName,
  onPlayerNameChange,
  soundLevel,
  onCycleSound
}) => {
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [bgLoaded, setBgLoaded] = useState(false);

  // Modal to prompt for player name before proceeding to action
  const [pendingAction, setPendingAction] = useState<'quick_play' | 'join_room' | null>(null);
  const [tempPlayerName, setTempPlayerName] = useState(playerName || '');

  const handleActionClick = (action: 'quick_play' | 'join_room') => {
    setTempPlayerName(playerName || '');
    setPendingAction(action);
  };

  const handleConfirmName = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const finalName = tempPlayerName.trim();
    if (finalName.length < 2) return;
    onPlayerNameChange(finalName);
    const actionToRun = pendingAction;
    setPendingAction(null);

    if (actionToRun === 'quick_play') {
      onQuickPlay(finalName);
    } else if (actionToRun === 'join_room') {
      onJoinRoom();
    }
  };

  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-between gap-1 p-2 sm:p-3 bg-slate-950 select-none overflow-hidden">
      
      {/* Official 9:16 Menu Background Image (fondomenu.png) */}
      <img
        src={getAssetUrl('assets/sprites/fondomenu.png')}
        alt="Fondo Menú"
        className={`absolute inset-0 w-full h-full object-cover pointer-events-none transition-opacity duration-700 ${
          bgLoaded ? 'opacity-90' : 'opacity-0'
        }`}
        onLoad={() => setBgLoaded(true)}
        onError={() => setBgLoaded(false)}
      />

      {/* Sin sombra sobre el fondo oficial del menú. */}
      {/* Top Bar with CONTACTO located independently at top-left */}
      <div className="relative z-10 flex items-center justify-between w-full pt-1">
        <button
          onClick={onContact}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[linear-gradient(180deg,#ffe08a,#d68a18_52%,#76400b)] hover:brightness-110 text-white border-2 border-[#fff0b5] text-sm font-black tracking-wider uppercase transition shadow-[inset_0_2px_0_rgba(255,255,255,0.55),0_4px_0_#512b08,0_7px_10px_rgba(0,0,0,0.45)] active:translate-y-1 cursor-pointer backdrop-blur-sm"
        >
          <Mail className="w-4 h-4 text-[#d0b56f]" />
          <span>CONTACTO</span>
        </button>
        <button
          onClick={onCycleSound}
          title={`Sonido: ${soundLevel === 'high' ? 'Alto' : soundLevel === 'medium' ? 'Medio' : soundLevel === 'low' ? 'Bajo' : 'Apagado'}. Pulsa para cambiar`}
          aria-label="Cambiar volumen"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[linear-gradient(180deg,#9ce8ff,#1599ec_52%,#062f66)] hover:brightness-110 text-white border-2 border-[#b8f1ff] text-sm font-black uppercase transition shadow-[inset_0_2px_0_rgba(255,255,255,0.55),0_4px_0_#06254b,0_7px_10px_rgba(0,0,0,0.45)] active:translate-y-1 cursor-pointer backdrop-blur-sm"
        >
          {soundLevel === 'off' ? <VolumeX className="w-4 h-4 text-[#d0b56f]" /> : soundLevel === 'low' ? <Volume1 className="w-4 h-4 text-[#d0b56f]" /> : <Volume2 className="w-4 h-4 text-[#d0b56f]" />}
          <span>{soundLevel === 'high' ? 'ALTO' : soundLevel === 'medium' ? 'MEDIO' : soundLevel === 'low' ? 'BAJO' : 'OFF'}</span>
        </button>
      </div>

      {/* Main Studio Brand & Title Lockup */}
      <div className="relative z-10 flex flex-col items-center text-center flex-1 min-h-0 justify-center gap-0">
        
        {/* Official 3D Logo (logo.png) */}
        <div className="w-full max-w-[360px] flex flex-1 min-h-0 items-center justify-center mb-0">
          <img
            src={getAssetUrl('assets/sprites/logo.png')}
            alt="Farm Battle Island Logo"
            className={`max-h-[38vh] sm:max-h-[42vh] max-w-full w-full object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)] transition-all duration-500 ${
              logoLoaded ? 'block scale-100' : 'hidden scale-95'
            }`}
            onLoad={() => setLogoLoaded(true)}
            onError={() => setLogoLoaded(false)}
          />
        </div>

        {/* Fallback typography when logo.png is not loaded yet */}
        {!logoLoaded && (
          <div className="flex flex-col items-center mb-1">
            <span className="text-xs sm:text-sm font-black tracking-[0.25em] text-[#d0b56f] uppercase drop-shadow mb-1">
              ANAPSE VIDEO GAMES
            </span>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] font-['Fredoka',sans-serif]">
              FARM BATTLE <span className="text-[#d0b56f]">ISLAND</span>
            </h1>
          </div>
        )}

        {/* Action Buttons Menu - Slim, refined design */}
        <div className="flex flex-col gap-1.5 w-full max-w-[280px] mt-0 shrink-0">
          
          {/* JUGAR (Quick game vs AI) */}
          <button
            onClick={() => handleActionClick('quick_play')}
            className="w-full min-h-9 py-1.5 px-4 rounded-lg bg-[linear-gradient(180deg,#ffe3a0,#c99a4a_48%,#81551e_85%,#35230e)] border-2 border-[#ffe8b4] shadow-[inset_0_2px_0_rgba(255,255,255,0.5),0_3px_0_#35230e,0_5px_8px_rgba(0,0,0,0.4)] hover:brightness-110 text-white font-black text-sm sm:text-base tracking-wider uppercase flex items-center justify-center gap-3 transition active:translate-y-0.5 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>JUGAR</span>
          </button>

          {/* MULTIJUGADOR: lobby con salas y creación en una sola pantalla */}
          <button
            onClick={() => handleActionClick('join_room')}
            className="w-full min-h-9 py-1.5 px-4 rounded-lg bg-[linear-gradient(180deg,#ffe3a0,#c99a4a_48%,#81551e_85%,#35230e)] border-2 border-[#ffe8b4] shadow-[inset_0_2px_0_rgba(255,255,255,0.5),0_3px_0_#35230e,0_5px_8px_rgba(0,0,0,0.4)] hover:brightness-110 text-white font-black text-sm sm:text-base tracking-wider uppercase flex items-center justify-center gap-3 transition active:translate-y-0.5 cursor-pointer"
          >
            <Users className="w-4 h-4" />
            <span>MULTIJUGADOR</span>
          </button>

          {/* TOP 50 (Leaderboard) */}
          <button
            onClick={onRanking}
            className="w-full min-h-12 py-3 px-4 rounded-lg bg-[linear-gradient(180deg,#ffe3a0,#c99a4a_48%,#81551e_85%,#35230e)] border-2 border-[#ffe8b4] shadow-[inset_0_2px_0_rgba(255,255,255,0.5),0_3px_0_#35230e,0_5px_8px_rgba(0,0,0,0.4)] hover:brightness-110 text-white font-black text-sm sm:text-base tracking-wider uppercase flex items-center justify-center gap-3 transition active:translate-y-0.5 cursor-pointer"
          >
            <Trophy className="w-4 h-4 text-yellow-600 fill-yellow-600" />
            <span>TOP 50</span>
          </button>

        </div>
      </div>

      {/* Footer Info */}
      <div className="relative z-10 text-center text-[10px] text-white/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] font-semibold drop-shadow pb-1">
        <span>© ANAPSE VIDEO GAMES</span>
      </div>

      {/* Modal: Pedir Nombre de Jugador al presionar JUGAR o MULTIJUGADOR */}
      {pendingAction !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-[320px] bg-[#101b20]/96 border border-amber-600/50 rounded-2xl shadow-2xl p-4 text-center relative overflow-hidden backdrop-blur-md">
            
            <button
              onClick={() => setPendingAction(null)}
              className="absolute top-2 right-2 text-white p-2 rounded-lg bg-[linear-gradient(180deg,#36515a,#1b3038_65%,#101b20)] border-2 border-[#8aa0a5] shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_3px_0_#0b1519,0_5px_8px_rgba(0,0,0,0.4)] transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-9 h-9 rounded-full bg-[#806c42]/15 border border-[#9a8351]/40 flex items-center justify-center mx-auto mb-2">
              <UserCheck className="w-4 h-4 text-[#d0b56f]" />
            </div>

            <h3 className="text-sm font-black text-white uppercase tracking-wider mb-2">
              Ingresa tu Alias
            </h3>

            <form onSubmit={handleConfirmName} className="space-y-3">
              <input
                type="text"
                required
                minLength={2}
                autoFocus
                value={tempPlayerName}
                onChange={(e) => setTempPlayerName(e.target.value)}
                placeholder="Escribe tu alias (mín. 2 caracteres)..."
                maxLength={18}
                className="w-full min-h-11 bg-slate-950 border-2 border-amber-500 rounded-xl px-3 py-2 text-base font-bold text-white text-center focus:outline-none focus:border-amber-600 transition"
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPendingAction(null)}
                  className="flex-1 min-h-10 py-2 px-3 rounded-lg bg-[linear-gradient(180deg,#36515a,#1b3038_65%,#101b20)] border-2 border-[#8aa0a5] shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_3px_0_#0b1519,0_5px_8px_rgba(0,0,0,0.4)] text-white font-black text-sm uppercase transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 min-h-10 py-2 px-3 rounded-lg bg-[linear-gradient(180deg,#ffe3a0,#c99a4a_48%,#81551e_85%,#35230e)] border-2 border-[#ffe8b4] shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_3px_0_#35230e,0_5px_8px_rgba(0,0,0,0.4)] text-white font-black text-sm uppercase transition active:translate-y-0.5 cursor-pointer"
                >
                  Continuar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
