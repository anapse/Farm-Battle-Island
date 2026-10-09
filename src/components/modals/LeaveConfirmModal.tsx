import { getAssetUrl } from '../../utils/assets';
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
      <div className="relative z-10 text-center pt-2 shrink-0">
        <h2 className="text-lg sm:text-2xl font-black text-white font-['Fredoka',sans-serif] leading-tight bg-slate-950/65 rounded-lg px-2 py-1 drop-shadow-[0_2px_3px_rgba(0,0,0,1)]">
          ¿ABANDONAR PARTIDA?
        </h2>
      </div>

      {/* Warning Box */}
      <div className="relative z-10 my-auto max-w-[320px] w-full mx-auto bg-[#101b20]/95 backdrop-blur-md border border-red-700/50 rounded-xl p-4 text-center shadow-2xl">
        <div className="w-10 h-10 rounded-full bg-red-700/15 border border-red-700 flex items-center justify-center mx-auto mb-2">
          <AlertTriangle className="w-5 h-5 text-red-500" />
        </div>

        <p className="text-sm text-red-100 font-black mb-2">
          El juego no se puede pausar
        </p>
        <p className="text-sm leading-relaxed text-slate-200">
          Si sales ahora, se computará una derrota y la victoria se otorgará a tu rival.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="relative z-10 flex gap-2 max-w-[320px] w-full mx-auto pb-1 shrink-0">
        <button
          onClick={onCancel}
          className="flex-1 min-h-11 py-2.5 rounded-lg bg-[linear-gradient(180deg,#36515a,#1b3038_65%,#101b20)] border-2 border-[#8aa0a5] shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_3px_0_#0b1519,0_5px_8px_rgba(0,0,0,0.4)] text-white font-black text-sm uppercase transition cursor-pointer"
        >
          Continuar
        </button>
        <button
          onClick={onConfirmLeave}
          className="flex-1 min-h-11 py-2.5 rounded-lg bg-[linear-gradient(180deg,#b85b50,#7f2929_65%,#421818)] border-2 border-[#e79a8c] shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_3px_0_#351313,0_5px_8px_rgba(0,0,0,0.4)] text-white font-black text-sm uppercase flex items-center justify-center gap-1.5 transition active:translate-y-0.5 cursor-pointer"
        >
          <Flag className="w-3.5 h-3.5" />
          <span>SALIR</span>
        </button>
      </div>

    </div>
  );
};
