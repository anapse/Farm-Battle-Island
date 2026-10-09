import React from 'react';
import { Users, Copy, Check, Clock, Shield } from 'lucide-react';
import { OnlineMatch } from '../../types/game';

interface WaitingOpponentModalProps {
  match: OnlineMatch;
  onCancel: () => void;
}

export const WaitingOpponentModal: React.FC<WaitingOpponentModalProps> = ({ match, onCancel }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(match.matchId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-between p-4 select-none overflow-hidden bg-slate-950">
      
      {/* Official Menu Background (fondomenu.png) */}
      <img
        src="/assets/sprites/fondomenu.png"
        alt="Fondo Menú"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-85"
      />

      {/* Dark Vignette Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-slate-950/80 pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 text-center pt-2">
        <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-amber-500 font-['Fredoka',sans-serif] drop-shadow">
          ESPERANDO RIVAL...
        </h2>
      </div>

      {/* Radar Center Stage */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center my-2 max-w-[280px] w-full mx-auto">
        <div className="relative w-20 h-20 mb-4 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-amber-700/10 animate-ping" />
          <div className="absolute inset-1 rounded-full border-2 border-dashed border-amber-600 animate-spin" />
          <div className="w-12 h-12 rounded-full bg-amber-700/20 border border-amber-600 flex items-center justify-center shadow-lg">
            <Users className="w-6 h-6 text-amber-500 animate-pulse" />
          </div>
        </div>

        {/* Room Code Badge */}
        <div className="w-full bg-slate-950/85 backdrop-blur-md rounded-xl p-3 border border-amber-600/30 mb-3 flex flex-col items-center shadow-xl">
          <span className="text-[10px] font-bold uppercase text-amber-500 tracking-wider mb-1">
            CÓDIGO DE SALA
          </span>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black font-mono tracking-widest text-white">
              {match.matchId}
            </span>
            <button
              onClick={handleCopyCode}
              className="p-1.5 rounded-lg bg-amber-800 hover:bg-amber-700 text-amber-200 transition active:scale-95 cursor-pointer"
              title="Copiar código"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          {copied && (
            <span className="text-[10px] text-emerald-500 font-bold mt-1">
              ¡Copiado!
            </span>
          )}
        </div>

        {/* Match Rules summary */}
        <div className="flex items-center gap-3 text-xs text-slate-300 bg-slate-950/70 px-3 py-1.5 rounded-lg border border-slate-800">
          <span className="flex items-center gap-1 font-bold text-amber-500">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            {match.settings.timeLimit ? '5 Min' : '∞'}
          </span>
          <span>·</span>
          <span className="flex items-center gap-1 font-bold text-red-300">
            <Shield className="w-3.5 h-3.5 text-red-400" />
            {match.settings.lives} {match.settings.lives === 1 ? 'Vida' : 'Vidas'}
          </span>
        </div>
      </div>

      {/* Cancel Button */}
      <div className="relative z-10 text-center pb-1">
        <button
          onClick={onCancel}
          className="w-full max-w-[280px] py-2 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-300 font-bold text-xs uppercase border border-slate-700 transition cursor-pointer"
        >
          Cancelar Sala
        </button>
      </div>

    </div>
  );
};
