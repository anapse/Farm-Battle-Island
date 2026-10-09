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
    <div className="absolute inset-0 z-40 flex flex-col justify-between p-4 bg-slate-950 select-none overflow-hidden">
      
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
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#171a16]/86 hover:bg-[#262b23] text-white border border-amber-600/70 text-sm font-black tracking-wider uppercase transition shadow-[0_3px_10px_rgba(0,0,0,0.55)] active:scale-95 cursor-pointer backdrop-blur-sm"
        >
          <Mail className="w-4 h-4 text-[#d0b56f]" />
          <span>CONTACTO</span>
        </button>
        <button
          onClick={onCycleSound}
          title={`Sonido: ${soundLevel === 'high' ? 'Alto' : soundLevel === 'medium' ? 'Medio' : soundLevel === 'low' ? 'Bajo' : 'Apagado'}. Pulsa para cambiar`}
          aria-label="Cambiar volumen"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#171a16]/86 hover:bg-[#262b23] text-white border border-amber-600/70 text-xs font-black uppercase transition shadow-[0_3px_10px_rgba(0,0,0,0.55)] active:scale-95 cursor-pointer backdrop-blur-sm"
        >
          {soundLevel === 'off' ? <VolumeX className="w-4 h-4 text-[#d0b56f]" /> : soundLevel === 'low' ? <Volume1 className="w-4 h-4 text-[#d0b56f]" /> : <Volume2 className="w-4 h-4 text-[#d0b56f]" />}
          <span>{soundLevel === 'high' ? 'ALTO' : soundLevel === 'medium' ? 'MEDIO' : soundLevel === 'low' ? 'BAJO' : 'OFF'}</span>
        </button>
      </div>

      {/* Main Studio Brand & Title Lockup */}
      <div className="relative z-10 flex flex-col items-center text-center my-auto">
        
        {/* Official 3D Logo (logo.png) */}
        <div className="max-w-[280px] w-full flex justify-center mb-1">
          <img
            src={getAssetUrl('assets/sprites/logo.png')}
            alt="Farm Battle Island Logo"
            className={`max-h-[20vh] sm:max-h-[22vh] object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)] transition-all duration-500 ${
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
        <div className="flex flex-col gap-2.5 w-full max-w-[240px] mt-3">
          
          {/* JUGAR (Quick game vs AI) */}
          <button
            onClick={() => handleActionClick('quick_play')}
            className="w-full py-3.5 px-4 rounded-xl bg-[linear-gradient(180deg,#ff9a7d_0%,#ed3e2e_42%,#a91819_78%,#5c1118_100%)] hover:brightness-110 text-white font-black text-base sm:text-lg tracking-wider uppercase border-2 border-[#ffc0a2] shadow-[inset_0_2px_0_rgba(255,255,255,0.65),inset_0_-5px_0_rgba(70,0,0,0.3),0_5px_0_#511015,0_9px_14px_rgba(0,0,0,0.55)] flex items-center justify-center gap-3 transition active:translate-y-1 active:shadow-[inset_0_2px_0_rgba(255,255,255,0.4),0_2px_0_#511015] cursor-pointer"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>JUGAR</span>
          </button>

          {/* MULTIJUGADOR: lobby con salas y creación en una sola pantalla */}
          <button
            onClick={() => handleActionClick('join_room')}
            className="w-full py-3.5 px-4 rounded-xl bg-[linear-gradient(180deg,#f3a3ff_0%,#b92be0_42%,#7412a8_78%,#3c075e_100%)] hover:brightness-110 text-white font-black text-base sm:text-lg tracking-wider uppercase border-2 border-[#f0b8ff] shadow-[inset_0_2px_0_rgba(255,255,255,0.7),inset_0_-5px_0_rgba(30,0,60,0.35),0_5px_0_#35084d,0_9px_14px_rgba(0,0,0,0.55)] flex items-center justify-center gap-3 transition active:translate-y-1 cursor-pointer"
          >
            <Users className="w-4 h-4" />
            <span>MULTIJUGADOR</span>
          </button>

          {/* TOP 50 (Leaderboard) */}
          <button
            onClick={onRanking}
            className="w-full py-2.5 px-4 rounded-lg bg-[#171a16]/86 hover:bg-[#262b23] text-white font-black text-sm sm:text-base tracking-wider uppercase border border-[#9a8351] shadow-[0_4px_12px_rgba(0,0,0,0.6)] flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
          >
            <Trophy className="w-4 h-4 text-yellow-600 fill-yellow-600" />
            <span>TOP 50</span>
          </button>

        </div>
      </div>

      {/* Footer Info */}
      <div className="relative z-10 text-center text-[11px] text-white/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] font-semibold drop-shadow pb-1">
        <span>© ANAPSE VIDEO GAMES</span>
      </div>

      {/* Modal: Pedir Nombre de Jugador al presionar JUGAR o MULTIJUGADOR */}
      {pendingAction !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-[280px] bg-[#141713]/88 border border-amber-600/50 rounded-2xl shadow-2xl p-4 text-center relative overflow-hidden backdrop-blur-md">
            
            <button
              onClick={() => setPendingAction(null)}
              className="absolute top-2.5 right-2.5 text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
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
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm font-bold text-white text-center focus:outline-none focus:border-amber-600 transition"
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPendingAction(null)}
                  className="flex-1 py-1.5 px-3 rounded-lg bg-[#2b3028] hover:bg-[#3a4034] text-slate-300 font-bold text-xs uppercase transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-1.5 px-3 rounded-lg bg-[#687b58] hover:bg-[#789064] text-white font-bold text-xs uppercase border border-[#82966c] shadow-md transition active:scale-95 cursor-pointer"
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
