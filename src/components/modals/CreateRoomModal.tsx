import { getAssetUrl } from '../../utils/assets';
import React, { useState } from 'react';
import { GameTimeOption, GameLivesOption } from '../../types/game';
import { ISLANDS } from '../../config/islands';
import { X, Clock, ShieldCheck, MapPin, Check } from 'lucide-react';

interface CreateRoomModalProps {
  creatorName: string;
  onClose: () => void;
  onCreate: (timeLimit: GameTimeOption, lives: GameLivesOption, islandId: string, aiDifficulty?: 'easy' | 'medium' | 'hard' | 'very_hard') => void;
  isAiMode?: boolean;
}

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({
  onClose,
  onCreate,
  isAiMode = false
}) => {
  const [timeLimit, setTimeLimit] = useState<GameTimeOption>('5_MIN');
  const [lives, setLives] = useState<GameLivesOption>(3);
  const [islandId, setIslandId] = useState<string>('isla_1');
  const [aiDifficulty, setAiDifficulty] = useState<'easy' | 'medium' | 'hard' | 'very_hard'>('medium');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate(timeLimit, lives, islandId, aiDifficulty);
  };

  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-start gap-2 p-3 sm:p-4 select-none overflow-y-auto overscroll-contain bg-slate-950">
      
      {/* Official Menu Background (fondomenu.png) */}
      <img
        src={getAssetUrl('assets/sprites/fondomenu.png')}
        alt="Fondo Menú"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-100"
      />

      {/* Dark Vignette Overlay */}
      <div className="absolute inset-0 bg-black/5 pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between pt-1 shrink-0">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white font-['Fredoka',sans-serif] drop-shadow">
            {isAiMode ? 'CONFIGURAR PARTIDA CONTRA IA' : 'CREAR PARTIDA'}
          </h2>
        </div>
        <button
          onClick={onClose}
          className="text-white hover:brightness-125 p-2 rounded-xl bg-[linear-gradient(180deg,#526a7d,#243b4b_65%,#111f2a)] border-2 border-[#9cc9df] shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_3px_0_#101b22] transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Form Fields (Percentage / Flex layout) */}
      <form onSubmit={handleSubmit} className="relative z-10 flex-none flex flex-col justify-start gap-2.5 my-1 max-w-[340px] w-full mx-auto">
        
        {isAiMode && (
          <div className="bg-[#101b20]/92 backdrop-blur-md p-3 rounded-xl border border-[#bda56b]/60">
            <label className="flex items-center gap-1.5 text-xs font-black uppercase text-amber-500 mb-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
              <span>DIFICULTAD DE LA IA:</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {([
                ['easy', 'FÁCIL', 'Falla aprox. 10%'],
                ['medium', 'MEDIO', 'Falla aprox. 5%'],
                ['hard', 'DIFÍCIL', 'Casi siempre acierta'],
                ['very_hard', 'MUY DIFÍCIL', 'Usa power-ups']
              ] as const).map(([value, label, description]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setAiDifficulty(value)}
                  className={`p-3 rounded-xl text-left border-2 transition cursor-pointer shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_3px_0_rgba(0,0,0,0.35)] ${aiDifficulty === value ? 'bg-[linear-gradient(180deg,#ffce70,#d97706_55%,#7c2d12)] border-[#ffe2a0] text-white' : 'bg-[linear-gradient(180deg,#46534c,#202822_65%,#101713)] border-[#8e9d8d] text-slate-100 hover:brightness-125'}`}
                >
                  <span className="block text-xs font-black">{label}</span>
                  <span className="block text-[11px] leading-snug mt-1 opacity-95">{description}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* TIEMPO Selection */}
        <div className="bg-[#141713]/72 backdrop-blur-md p-2.5 rounded-xl border border-[#9a8351]/30">
          <label className="flex items-center gap-1.5 text-xs font-black uppercase text-amber-500 mb-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>TIEMPO:</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setTimeLimit('5_MIN')}
              className={`py-3 px-3 rounded-xl font-black text-sm uppercase tracking-wider border-2 transition cursor-pointer shadow-[inset_0_2px_0_rgba(255,255,255,0.3),inset_0_-3px_0_rgba(0,0,0,0.25),0_3px_0_rgba(0,0,0,0.35)] ${
                timeLimit === '5_MIN'
                  ? 'bg-amber-700 border-[#9a8351] text-white shadow-md'
                  : 'bg-[#1d211c]/82 border-[#555a4e] text-slate-300 hover:bg-slate-800'
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
              className={`py-3 px-3 rounded-xl font-black text-sm uppercase tracking-wider border-2 transition cursor-pointer shadow-[inset_0_2px_0_rgba(255,255,255,0.25),0_3px_0_rgba(0,0,0,0.35)] ${
                timeLimit === 'INFINITE'
                  ? 'bg-amber-700 border-[#9a8351] text-white shadow-md'
                  : 'bg-[#1d211c]/82 border-[#555a4e] text-slate-300 hover:bg-slate-800'
              }`}
            >
              ∞ INFINITO
            </button>
          </div>
        </div>

        {/* VIDAS Selection */}
        <div className="bg-[#141713]/72 backdrop-blur-md p-2.5 rounded-xl border border-[#9a8351]/30">
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
                    ? 'bg-[#8f4d43] border-[#9a5a4f] text-white shadow-md'
                    : 'bg-[#1d211c]/82 border-[#555a4e] text-slate-300 hover:bg-slate-800'
                }`}
              >
                {num === 'INFINITE' ? '∞ VIDAS' : `${num} ${num === 1 ? 'VIDA' : 'VIDAS'}`}
              </button>
            ))}
          </div>
        </div>

        {/* MAPA / ESCENARIO Selection */}
        <div className="bg-[#141713]/72 backdrop-blur-md p-2.5 rounded-xl border border-[#9a8351]/30">
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
                className={`p-2.5 rounded-xl text-left border-2 transition text-sm cursor-pointer ${
                  islandId === island.id
                    ? 'bg-[#293225]/92 border-[#82966c] text-white shadow-sm'
                    : 'bg-[#1d211c]/82 border-[#555a4e] text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="font-black text-[11px] text-amber-500">{island.title}</div>
                <div className="text-xs text-slate-200 truncate">{island.subtitle}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Submit Action */}
        <div className="pt-1">
          <button
            type="submit"
            className="w-full py-4 rounded-xl bg-[linear-gradient(180deg,#ffce70,#f28c16_48%,#9a3412_85%,#511b0a)] hover:brightness-110 text-white font-black text-base uppercase tracking-wider shadow-[inset_0_2px_0_rgba(255,255,255,0.6),inset_0_-4px_0_rgba(0,0,0,0.25),0_5px_0_#4a1b08,0_8px_12px_rgba(0,0,0,0.5)] border-2 border-[#ffe2a0] flex items-center justify-center gap-3 active:translate-y-1 transition cursor-pointer"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>CREAR PARTIDA</span>
          </button>
        </div>

      </form>

    </div>
  );
};
