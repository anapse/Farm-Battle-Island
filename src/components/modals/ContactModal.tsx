import React from 'react';
import { X, Mail, Globe, MessageSquare, Gamepad2, Send } from 'lucide-react';

interface ContactModalProps {
  onClose: () => void;
}

export const ContactModal: React.FC<ContactModalProps> = ({ onClose }) => {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none">
      <div className="w-full max-w-sm bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-amber-500 rounded-3xl shadow-2xl p-5 text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-400 flex items-center justify-center">
              <Mail className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <span className="text-[10px] font-black tracking-widest text-amber-400 uppercase">
                ESTUDIO DE DESARROLLO
              </span>
              <h2 className="text-xl font-black text-white font-['Fredoka',sans-serif]">
                ANAPSE VIDEO GAMES
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Studio Info */}
        <div className="my-4 space-y-3 text-xs">
          <p className="text-slate-300 leading-relaxed">
            <strong>Farm Battle Island</strong> es un título de artillería táctica por turnos desarrollado por <strong>ANAPSE Video Games</strong>.
          </p>

          <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center gap-2.5 text-slate-300">
              <Mail className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="font-mono text-[11px]">contacto@anapsevideogames.com</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-300">
              <Globe className="w-4 h-4 text-sky-400 shrink-0" />
              <span className="font-mono text-[11px]">https://anapsevideogames.com</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-300">
              <Gamepad2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-[11px]">Soporte Técnico y Torneos Oficiales</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 text-center">
            Para sugerencias de balance táctico, nuevos mapas de isla o reporte de incidencias en salas multijugador, comunícate con nuestro equipo.
          </p>
        </div>

        {/* Close action */}
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider transition"
        >
          Cerrar
        </button>

      </div>
    </div>
  );
};
