import React from 'react';
import { AlertTriangle, Flag, X } from 'lucide-react';

interface LeaveConfirmModalProps {
  onCancel: () => void;
  onConfirmLeave: () => void;
}

export const LeaveConfirmModal: React.FC<LeaveConfirmModalProps> = ({
  onCancel,
  onConfirmLeave
}) => {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none">
      <div className="w-full max-w-sm bg-gradient-to-b from-red-950 via-slate-900 to-slate-950 border-2 border-red-500 rounded-3xl shadow-2xl p-5 text-slate-100 text-center">
        
        <div className="w-12 h-12 rounded-full bg-red-600/20 border-2 border-red-500 flex items-center justify-center mx-auto mb-3">
          <AlertTriangle className="w-6 h-6 text-red-400" />
        </div>

        <span className="text-[10px] font-black tracking-widest text-red-400 uppercase">
          REGLA ABSOLUTA DE COMBATE
        </span>
        <h2 className="text-xl font-black text-white font-['Fredoka',sans-serif] mt-1">
          ¿SALIR DE LA PARTIDA?
        </h2>

        <div className="bg-red-950/60 border border-red-600/40 rounded-xl p-3 my-3 text-xs text-red-200 text-left space-y-1">
          <p className="font-bold">⚠️ El juego no se puede pausar.</p>
          <p className="text-[11px] text-red-300">
            Si abandonas la partida ahora, se computará una <strong>DERROTA INMEDIATA</strong> en tu historial y el rival recibirá la <strong>VICTORIA</strong> con sus puntos de bonificación.
          </p>
        </div>

        <div className="flex gap-2 mt-4">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-white font-black text-xs uppercase tracking-wider transition"
          >
            Continuar Jugando
          </button>
          <button
            onClick={onConfirmLeave}
            className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider shadow-lg border border-red-400 flex items-center justify-center gap-1.5 transition active:scale-95"
          >
            <Flag className="w-4 h-4" />
            <span>Rendirse y Salir</span>
          </button>
        </div>

      </div>
    </div>
  );
};
