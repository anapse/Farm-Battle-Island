import React from 'react';
import { Loader2, Users, Copy, Check, X, Shield, Clock } from 'lucide-react';
import { OnlineMatch } from '../../types/game';
import { getCharacterById } from '../../config/characters';

interface WaitingOpponentModalProps {
  match: OnlineMatch;
  onCancel: () => void;
}

export const WaitingOpponentModal: React.FC<WaitingOpponentModalProps> = ({ match, onCancel }) => {
  const [copied, setCopied] = React.useState(false);
  const myCharacter = match.player1.characterId ? getCharacterById(match.player1.characterId) : null;

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(match.matchId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-sm rounded-2xl bg-gradient-to-b from-amber-950 via-slate-900 to-slate-950 border-4 border-amber-500 shadow-2xl p-6 text-slate-100 flex flex-col items-center text-center">
        
        {/* Animated Radar Pulse */}
        <div className="relative w-20 h-20 mb-4 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-amber-500/20 animate-ping" />
          <div className="absolute inset-2 rounded-full border-2 border-dashed border-amber-400 animate-spin" />
          <div className="w-12 h-12 rounded-full bg-amber-500/30 border border-amber-300 flex items-center justify-center shadow-lg">
            <Users className="w-6 h-6 text-amber-300 animate-pulse" />
          </div>
        </div>

        <h2 className="text-xl font-black uppercase tracking-wider text-amber-300 mb-1">
          ESPERANDO OPONENTE...
        </h2>
        
        <p className="text-xs text-slate-300 mb-4 max-w-[240px]">
          La partida está visible en el lobby online. El combate comenzará automáticamente cuando se una un rival.
        </p>

        {/* Room Code Badge */}
        <div className="w-full bg-black/60 rounded-xl p-3 border border-amber-700/80 mb-4 flex flex-col items-center">
          <span className="text-[10px] font-bold uppercase text-amber-400 tracking-wider mb-1">
            CÓDIGO DE PARTIDA
          </span>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black font-mono tracking-widest text-white">
              {match.matchId}
            </span>
            <button
              onClick={handleCopyCode}
              className="p-1.5 rounded-lg bg-amber-700/80 hover:bg-amber-600 text-amber-100 transition active:scale-95"
              title="Copiar código"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          {copied && (
            <span className="text-[10px] text-emerald-400 font-bold mt-1">
              ¡Código copiado al portapapeles!
            </span>
          )}
        </div>

        {/* Selected Settings Summary */}
        <div className="w-full grid grid-cols-3 gap-2 text-center text-xs bg-slate-900/80 rounded-xl p-2.5 border border-slate-700 mb-5">
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
              <Clock className="w-3 h-3 text-cyan-400" /> TIEMPO
            </span>
            <span className="font-bold text-slate-200 mt-0.5">
              {match.settings.timeLimit ? '5 Min' : '∞'}
            </span>
          </div>

          <div className="flex flex-col items-center border-x border-slate-700 px-1">
            <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
              <Shield className="w-3 h-3 text-red-400" /> VIDAS
            </span>
            <span className="font-bold text-slate-200 mt-0.5">
              {match.settings.lives}
            </span>
          </div>

          <div className="flex flex-col items-center">
            <span className="text-[10px] text-slate-400 font-bold">
              PERSONAJE
            </span>
            <span className="font-bold text-amber-300 mt-0.5 truncate">
              {myCharacter ? myCharacter.name : 'MONO'}
            </span>
          </div>
        </div>

        {/* Cancel Button */}
        <button
          onClick={onCancel}
          className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 hover:text-white font-bold text-xs uppercase transition active:scale-95"
        >
          Cancelar y Volver al Menú
        </button>

      </div>
    </div>
  );
};
