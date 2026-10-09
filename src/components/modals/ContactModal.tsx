import { getAssetUrl } from '../../utils/assets';
import React from 'react';
import { X, Mail, Globe, Gamepad2 } from 'lucide-react';

interface ContactModalProps {
  onClose: () => void;
}

export const ContactModal: React.FC<ContactModalProps> = ({ onClose }) => {
  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-between p-4 select-none overflow-hidden bg-slate-950">
      
      {/* Official Menu Background (fondomenu.png) */}
      <img
        src={getAssetUrl('assets/sprites/fondomenu.png')}
        alt="Fondo Menú"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-85"
      />

      {/* Dark Vignette Overlay */}
      <div className="absolute inset-0 bg-black/20 pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <Mail className="w-5 h-5 text-amber-500" />
          <h2 className="text-xl sm:text-2xl font-black text-white font-['Fredoka',sans-serif] drop-shadow">
            CONTACTO
          </h2>
        </div>
        <button
          onClick={onClose}
          className="text-slate-300 hover:text-white p-1.5 rounded-lg bg-[#1d211c]/82 border border-[#555a4e] transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Studio Info Card */}
      <div className="relative z-10 my-auto max-w-[320px] w-full mx-auto space-y-3">
        <div className="bg-[#141713]/72 backdrop-blur-md p-4 rounded-xl border border-[#9a8351]/30 text-center space-y-3 shadow-xl">
          <h3 className="text-base font-black text-amber-500 font-['Fredoka',sans-serif]">
            ANAPSE VIDEO GAMES
          </h3>

          <div className="space-y-2 text-left pt-1">
            <div className="flex items-center gap-2 text-slate-300 text-xs">
              <Mail className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="font-mono text-[11px]">contacto@anapsevideogames.com</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300 text-xs">
              <Globe className="w-4 h-4 text-[#9b8b62] shrink-0" />
              <span className="font-mono text-[11px]">anapsevideogames.com</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300 text-xs">
              <Gamepad2 className="w-4 h-4 text-[#8fa878] shrink-0" />
              <span className="text-[11px]">Soporte y Torneos Oficiales</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 text-center pb-1">
        <button
          onClick={onClose}
          className="w-full max-w-[320px] py-2 rounded-lg bg-[#1d211c]/88 hover:bg-slate-800 text-slate-300 font-bold text-xs uppercase border border-[#555a4e] transition cursor-pointer"
        >
          Cerrar
        </button>
      </div>

    </div>
  );
};
