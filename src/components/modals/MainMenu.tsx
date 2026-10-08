import React from 'react';
import { 
  Play, 
  PlusCircle, 
  Users, 
  Trophy, 
  Mail, 
  ShieldAlert, 
  Gamepad2,
  Anchor,
  Compass
} from 'lucide-react';

interface MainMenuProps {
  onQuickPlay: () => void;
  onCreateRoom: () => void;
  onJoinRoom: () => void;
  onRanking: () => void;
  onContact: () => void;
  onAdmin: () => void;
  playerName: string;
  onPlayerNameChange: (name: string) => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  onQuickPlay,
  onCreateRoom,
  onJoinRoom,
  onRanking,
  onContact,
  onAdmin,
  playerName,
  onPlayerNameChange
}) => {
  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-between p-4 sm:p-6 bg-gradient-to-b from-sky-900 via-sky-950 to-slate-950 select-none overflow-hidden">
      
      {/* Top Bar with independent CONTACTO at top-left and discrete ADMIN link at top-right */}
      <div className="flex items-center justify-between w-full">
        <button
          onClick={onContact}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-950/80 hover:bg-amber-900 text-amber-200 border border-amber-600/70 text-xs font-bold tracking-wider uppercase transition shadow-md active:scale-95 cursor-pointer"
        >
          <Mail className="w-3.5 h-3.5 text-amber-400" />
          <span>CONTACTO</span>
        </button>

        <button
          onClick={onAdmin}
          className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-600/50 text-[11px] font-mono transition cursor-pointer"
          title="Panel de Administración /admin"
        >
          <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" />
          <span>/admin</span>
        </button>
      </div>

      {/* Main Studio Brand & Title Lockup */}
      <div className="flex flex-col items-center text-center my-auto">
        <span className="text-xs sm:text-sm font-black tracking-[0.25em] text-amber-400 uppercase drop-shadow mb-1">
          ANAPSE VIDEO GAMES
        </span>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] font-['Fredoka',sans-serif]">
          FARM BATTLE <span className="text-amber-400">ISLAND</span>
        </h1>
        <p className="text-xs text-sky-200/80 font-medium mt-1 max-w-[260px]">
          Juego de artillería táctica por turnos
        </p>

        {/* Player Name Input */}
        <div className="mt-5 w-full max-w-[260px] bg-slate-900/80 p-2.5 rounded-xl border border-amber-600/60 shadow-lg">
          <label className="block text-[10px] font-black uppercase tracking-wider text-amber-300 text-left mb-1">
            Tu Nombre / Alias:
          </label>
          <input
            type="text"
            value={playerName}
            onChange={(e) => onPlayerNameChange(e.target.value)}
            placeholder="Escribe tu alias..."
            maxLength={18}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-sm font-bold text-white focus:outline-none focus:border-amber-400 transition"
          />
        </div>

        {/* Primary Action Buttons Menu */}
        <div className="flex flex-col gap-2.5 w-full max-w-[260px] mt-6">
          
          {/* JUGAR (Quick game vs AI) */}
          <button
            onClick={onQuickPlay}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white font-black text-sm tracking-wider uppercase border-2 border-emerald-300 shadow-[0_4px_12px_rgba(16,185,129,0.4)] flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>JUGAR</span>
          </button>

          {/* CREAR (Create Room Modal) */}
          <button
            onClick={onCreateRoom}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-black text-sm tracking-wider uppercase border-2 border-amber-300 shadow-[0_4px_12px_rgba(245,158,11,0.4)] flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>CREAR</span>
          </button>

          {/* UNIRSE (Join Available Room Modal) */}
          <button
            onClick={onJoinRoom}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-sky-600 to-blue-500 hover:from-sky-500 hover:to-blue-400 text-white font-black text-sm tracking-wider uppercase border-2 border-sky-300 shadow-[0_4px_12px_rgba(14,165,233,0.4)] flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
          >
            <Users className="w-4 h-4" />
            <span>UNIRSE</span>
          </button>

          {/* TOP 50 (Leaderboard) */}
          <button
            onClick={onRanking}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-600 hover:from-purple-600 hover:to-indigo-500 text-white font-black text-sm tracking-wider uppercase border-2 border-purple-300 shadow-[0_4px_12px_rgba(147,51,234,0.4)] flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
          >
            <Trophy className="w-4 h-4 text-yellow-300 fill-yellow-300" />
            <span>TOP 50</span>
          </button>

        </div>
      </div>

      {/* Footer Info */}
      <div className="text-center text-[10px] text-sky-300/60 font-medium">
        <span>© ANAPSE VIDEO GAMES · Mobile-First 9:16 Canvas Architecture</span>
      </div>

    </div>
  );
};
