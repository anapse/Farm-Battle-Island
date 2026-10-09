import { getAssetUrl } from '../../utils/assets';
import React, { useState } from 'react';
import { GameTimeOption, GameLivesOption } from '../../types/game';
import { ISLANDS } from '../../config/islands';
import { X, Clock, ShieldCheck, MapPin, Check } from 'lucide-react';

interface CreateRoomModalProps {
  creatorName: string;
  onClose: () => void;
  onCreate: (timeLimit: GameTimeOption, lives: GameLivesOption, islandId: string) => void;
}

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({
  onClose,
  onCreate
}) => {
  const [timeLimit, setTimeLimit] = useState<GameTimeOption>('5_MIN');
  const [lives, setLives] = useState<GameLivesOption>(3);
  const [islandId, setIslandId] = useState<string>('isla_1');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate(timeLimit, lives, islandId);
  };

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
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white font-['Fredoka',sans-serif] drop-shadow">
            CREAR PARTIDA
          </h2>
        </div>
        <button
          onClick={onClose}
          className="text-slate-300 hover:text-white p-1.5 rounded-lg bg-[#1d211c]/82 border border-slate-700 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Form Fields (Percentage / Flex layout) */}
      <form onSubmit={handleSubmit} className="relative z-10 flex-1 flex flex-col justify-center gap-3 my-2 max-w-[320px] w-full mx-auto">
        
        {/* TIEMPO Selection */}
        <div className="bg-[#141713]/72 backdrop-blur-md p-2.5 rounded-xl border border-amber-600/30">
          <label className="flex items-center gap-1.5 text-xs font-black uppercase text-amber-500 mb-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>TIEMPO:</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setTimeLimit('5_MIN')}
              className={`py-2 px-3 rounded-lg font-bold text-xs uppercase tracking-wider border transition cursor-pointer ${
                timeLimit === '5_MIN'
                  ? 'bg-amber-700 border-amber-600 text-white shadow-md'
                  : 'bg-[#1d211c]/82 border-slate-700 text-slate-300 hover:bg-slate-800'
              }`}
            >
              5 MINUTOS
            </button>
            <button
              type="button"
              onClick={() => {
                if (lives === 'INFINITE') return;
                setTimeLimit('INFINITE');
              }}
              className={`py-2 px-3 rounded-lg font-bold text-xs uppercase tracking-wider border transition cursor-pointer ${
                timeLimit === 'INFINITE'
                  ? 'bg-amber-700 border-amber-600 text-white shadow-md'
                  : 'bg-[#1d211c]/82 border-slate-700 text-slate-300 hover:bg-slate-800'
              }`}
            >
              ∞ INFINITO
            </button>
          </div>
        </div>

        {/* VIDAS Selection */}
        <div className="bg-[#141713]/72 backdrop-blur-md p-2.5 rounded-xl border border-amber-600/30">
          <label className="flex items-center gap-1.5 text-xs font-black uppercase text-amber-500 mb-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
            <span>VIDAS:</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {([1, 3, 5] as GameLivesOption[]).map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => {
                  if (num === 'INFINITE' && timeLimit === 'INFINITE') {
                    setTimeLimit('5_MIN');
                  }
                  setLives(num);
                }}
                className={`py-2 px-3 rounded-lg font-bold text-xs uppercase tracking-wider border transition cursor-pointer ${
                  lives === num
                    ? 'bg-red-700 border-red-600 text-white shadow-md'
                    : 'bg-[#1d211c]/82 border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                {num === 'INFINITE' ? '∞ VIDAS' : `${num} ${num === 1 ? 'VIDA' : 'VIDAS'}`}
              </button>
            ))}
          </div>
        </div>

        {/* MAPA / ESCENARIO Selection */}
        <div className="bg-[#141713]/72 backdrop-blur-md p-2.5 rounded-xl border border-amber-600/30">
          <label className="flex items-center gap-1.5 text-xs font-black uppercase text-amber-500 mb-1.5">
            <MapPin className="w-3.5 h-3.5 text-amber-500" />
            <span>ESCENARIO:</span>
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {ISLANDS.map((island) => (
              <button
                key={island.id}
                type="button"
                onClick={() => setIslandId(island.id)}
                className={`p-2 rounded-lg text-left border transition text-xs cursor-pointer ${
                  islandId === island.id
                    ? 'bg-emerald-950/90 border-emerald-400 text-white shadow-sm'
                    : 'bg-[#1d211c]/82 border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="font-black text-[11px] text-amber-500">{island.title}</div>
                <div className="text-[10px] text-slate-400 truncate">{island.subtitle}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Submit Action */}
        <div className="pt-1">
          <button
            type="submit"
            className="w-full py-2.5 rounded-lg bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-600 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg border border-amber-600 flex items-center justify-center gap-2 active:scale-95 transition cursor-pointer"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>CREAR PARTIDA</span>
          </button>
        </div>

      </form>

    </div>
  );
};
