import React, { useState } from 'react';
import { getAssetUrl } from '../../utils/assets';
import { 
  Play, 
  PlusCircle, 
  Users, 
  Trophy, 
  Mail, 
  UserCheck, 
  X
} from 'lucide-react';

interface MainMenuProps {
  onQuickPlay: () => void;
  onCreateRoom: () => void;
  onJoinRoom: () => void;
  onRanking: () => void;
  onContact: () => void;
  playerName: string;
  onPlayerNameChange: (name: string) => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  onQuickPlay,
  onCreateRoom,
  onJoinRoom,
  onRanking,
  onContact,
  playerName,
  onPlayerNameChange
}) => {
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [bgLoaded, setBgLoaded] = useState(false);

  // Modal to prompt for player name before proceeding to action
  const [pendingAction, setPendingAction] = useState<'quick_play' | 'create_room' | 'join_room' | null>(null);
  const [tempPlayerName, setTempPlayerName] = useState(playerName || 'Comandante');

  const handleActionClick = (action: 'quick_play' | 'create_room' | 'join_room') => {
    setTempPlayerName(playerName || 'Comandante');
    setPendingAction(action);
  };

  const handleConfirmName = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const finalName = tempPlayerName.trim() || 'Comandante';
    onPlayerNameChange(finalName);
    const actionToRun = pendingAction;
    setPendingAction(null);

    if (actionToRun === 'quick_play') {
      onQuickPlay();
    } else if (actionToRun === 'create_room') {
      onCreateRoom();
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
      <div className="relative z-10 flex items-center justify-start w-full pt-1">
        <button
          onClick={onContact}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950/90 hover:bg-slate-900 text-white border border-amber-600/70 text-sm font-black tracking-wider uppercase transition shadow-[0_3px_10px_rgba(0,0,0,0.55)] active:scale-95 cursor-pointer backdrop-blur-sm"
        >
          <Mail className="w-4 h-4 text-amber-500" />
          <span>CONTACTO</span>
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
            <span className="text-xs sm:text-sm font-black tracking-[0.25em] text-amber-500 uppercase drop-shadow mb-1">
              ANAPSE VIDEO GAMES
            </span>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] font-['Fredoka',sans-serif]">
              FARM BATTLE <span className="text-amber-500">ISLAND</span>
            </h1>
          </div>
        )}

        {/* Action Buttons Menu - Slim, refined design */}
        <div className="flex flex-col gap-2.5 w-full max-w-[240px] mt-3">
          
          {/* JUGAR (Quick game vs AI) */}
          <button
            onClick={() => handleActionClick('quick_play')}
            className="w-full py-2.5 px-4 rounded-lg bg-slate-950/90 hover:bg-slate-900 text-white font-black text-sm sm:text-base tracking-wider uppercase border-2 border-emerald-400/90 shadow-[0_4px_12px_rgba(0,0,0,0.6)] flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>JUGAR</span>
          </button>

          {/* CREAR (Create Room Modal) */}
          <button
            onClick={() => handleActionClick('create_room')}
            className="w-full py-2.5 px-4 rounded-lg bg-slate-950/90 hover:bg-slate-900 text-white font-black text-sm sm:text-base tracking-wider uppercase border-2 border-amber-600/70 shadow-[0_4px_12px_rgba(0,0,0,0.6)] flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>CREAR</span>
          </button>

          {/* UNIRSE (Join Available Room Modal) */}
          <button
            onClick={() => handleActionClick('join_room')}
            className="w-full py-2.5 px-4 rounded-lg bg-slate-950/90 hover:bg-slate-900 text-white font-black text-sm sm:text-base tracking-wider uppercase border-2 border-sky-700/70 shadow-[0_4px_12px_rgba(0,0,0,0.6)] flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
          >
            <Users className="w-4 h-4" />
            <span>UNIRSE</span>
          </button>

          {/* TOP 50 (Leaderboard) */}
          <button
            onClick={onRanking}
            className="w-full py-2.5 px-4 rounded-lg bg-slate-950/90 hover:bg-slate-900 text-white font-black text-sm sm:text-base tracking-wider uppercase border-2 border-purple-700/70 shadow-[0_4px_12px_rgba(0,0,0,0.6)] flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
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

      {/* Modal: Pedir Nombre de Jugador al presionar JUGAR, CREAR o UNIRSE */}
      {pendingAction !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-[280px] bg-slate-950/90 border border-amber-600/50 rounded-2xl shadow-2xl p-4 text-center relative overflow-hidden backdrop-blur-md">
            
            <button
              onClick={() => setPendingAction(null)}
              className="absolute top-2.5 right-2.5 text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-9 h-9 rounded-full bg-amber-700/15 border border-amber-600/40 flex items-center justify-center mx-auto mb-2">
              <UserCheck className="w-4 h-4 text-amber-500" />
            </div>

            <h3 className="text-sm font-black text-white uppercase tracking-wider mb-2">
              Ingresa tu Alias
            </h3>

            <form onSubmit={handleConfirmName} className="space-y-3">
              <input
                type="text"
                autoFocus
                value={tempPlayerName}
                onChange={(e) => setTempPlayerName(e.target.value)}
                placeholder="Escribe tu alias..."
                maxLength={18}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm font-bold text-white text-center focus:outline-none focus:border-amber-600 transition"
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPendingAction(null)}
                  className="flex-1 py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-1.5 px-3 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs uppercase border border-emerald-600/70 shadow-md transition active:scale-95 cursor-pointer"
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
