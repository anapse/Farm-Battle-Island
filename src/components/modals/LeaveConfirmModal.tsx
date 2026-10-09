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
    <div className="absolute inset-0 z-50 flex flex-col justify-start gap-3 p-3 sm:p-4 select-none overflow-y-auto overscroll-contain bg-slate-950">
      
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
        <h2 className="text-xl sm:text-2xl font-black text-white font-['Fredoka',sans-serif] drop-shadow">
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
          className="flex-1 min-h-12 py-3 rounded-xl bg-[#2b3028] hover:bg-[#3a4034] text-white font-bold text-xs uppercase transition cursor-pointer"
        >
          Continuar
        </button>
        <button
          onClick={onConfirmLeave}
          className="flex-1 min-h-12 py-3 rounded-xl bg-[#8f4d43] hover:bg-[#a45b50] text-white font-bold text-xs uppercase shadow-md border border-red-700 flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
        >
          <Flag className="w-3.5 h-3.5" />
          <span>Rendirse</span>
        </button>
      </div>

    </div>
  );
};
