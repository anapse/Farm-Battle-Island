import React from 'react';
import { AlertTriangle, Flag } from 'lucide-react';

interface LeaveConfirmModalProps {
  onCancel: () => void;
  onConfirmLeave: () => void;
}

export const LeaveConfirmModal: React.FC<LeaveConfirmModalProps> = ({
  onCancel,
  onConfirmLeave
}) => {
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
        <h2 className="text-xl sm:text-2xl font-black text-white font-['Fredoka',sans-serif] drop-shadow">
          ¿ABANDONAR PARTIDA?
        </h2>
      </div>

      {/* Warning Box */}
      <div className="relative z-10 my-auto max-w-[280px] w-full mx-auto bg-slate-950/85 backdrop-blur-md border border-red-700/50 rounded-xl p-4 text-center shadow-2xl">
        <div className="w-10 h-10 rounded-full bg-red-700/15 border border-red-700 flex items-center justify-center mx-auto mb-2">
          <AlertTriangle className="w-5 h-5 text-red-500" />
        </div>

        <p className="text-xs text-red-200 font-bold mb-1">
          El juego no se puede pausar
        </p>
        <p className="text-[11px] text-slate-400">
          Si sales ahora, se computará una derrota y la victoria se otorgará a tu rival.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="relative z-10 flex gap-2 max-w-[280px] w-full mx-auto pb-1">
        <button
          onClick={onCancel}
          className="flex-1 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase transition cursor-pointer"
        >
          Continuar
        </button>
        <button
          onClick={onConfirmLeave}
          className="flex-1 py-2 rounded-lg bg-red-700 hover:bg-red-600 text-white font-bold text-xs uppercase shadow-md border border-red-700 flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
        >
          <Flag className="w-3.5 h-3.5" />
          <span>Rendirse</span>
        </button>
      </div>

    </div>
  );
};
