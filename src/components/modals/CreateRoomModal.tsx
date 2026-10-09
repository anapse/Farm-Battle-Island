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
    <div className="absolute inset-0 z-50 flex flex-col justify-between gap-1 p-2 sm:p-3 select-none overflow-hidden bg-slate-950">
      
      {/* Official Menu Background (fondomenu.png) */}
      <img
        src={getAssetUrl('assets/sprites/fondomenu.png')}
        alt="Fondo Menú"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-100"
      />

      {/* Dark Vignette Overlay */}
      <div className="absolute inset-0 bg-black/5 pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between gap-2 pt-0 shrink-0">
        <div>
          <h2 className="max-w-[250px] text-lg sm:text-2xl leading-tight font-black text-white font-['Fredoka',sans-serif] bg-slate-950/65 rounded-lg px-2 py-1 drop-shadow-[0_2px_3px_rgba(0,0,0,1)]">
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
      <form onSubmit={handleSubmit} className="relative z-10 flex-1 min-h-0 flex flex-col justify-between gap-1 my-0 max-w-[340px] w-full mx-auto overflow-hidden">
        
        {isAiMode && (
          <div className="bg-[#102b35]/95 backdrop-blur-md p-1.5 rounded-lg border border-[#bda56b]/70">
            <label className="flex items-center gap-1.5 text-xs font-black uppercase text-amber-500 mb-1">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
              <span>DIFICULTAD DE LA IA:</span>
            </label>
            <div className="grid grid-cols-2 gap-1.5">
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
                  className={`p-1.5 rounded-lg text-left border-2 transition cursor-pointer shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_2px_0_rgba(0,0,0,0.35)] ${aiDifficulty === value ? 'bg-[linear-gradient(180deg,#ffce70,#d97706_55%,#7c2d12)] border-[#ffe2a0] text-white' : 'bg-[linear-gradient(180deg,#46534c,#202822_65%,#101713)] border-[#8e9d8d] text-slate-100 hover:brightness-125'}`}
                >
                  <span className="block text-[11px] font-black">{label}</span>
                  <span className="block text-[10px] leading-tight mt-0.5 opacity-95">{description}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* TIEMPO Selection */}
        <div className="bg-[#102b35]/95 backdrop-blur-md p-1.5 rounded-lg border border-[#bda56b]/60">
          <label className="flex items-center gap-1.5 text-xs font-black uppercase text-amber-500 mb-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>TIEMPO:</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setTimeLimit('5_MIN')}
              className={`py-2 px-2 rounded-lg font-black text-xs uppercase tracking-wide border-2 transition cursor-pointer shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_2px_0_rgba(0,0,0,0.35)] ${
                timeLimit === '5_MIN'
                  ? 'bg-[linear-gradient(180deg,#ffe3a0,#c99a4a_48%,#81551e_85%,#35230e)] border-2 border-[#ffe8b4] shadow-[inset_0_2px_0_rgba(255,255,255,0.5),0_3px_0_#35230e,0_5px_8px_rgba(0,0,0,0.4)] text-white'
                  : 'bg-[linear-gradient(180deg,#36515a,#1b3038_65%,#101b20)] border-2 border-[#8aa0a5] shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_3px_0_#0b1519,0_5px_8px_rgba(0,0,0,0.4)] text-white hover:brightness-110'
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
              className={`py-1.5 px-2 rounded-lg font-black text-xs uppercase tracking-wide border-2 transition cursor-pointer shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_2px_0_rgba(0,0,0,0.35)] ${
                timeLimit === 'INFINITE'
                  ? 'bg-[linear-gradient(180deg,#ffe3a0,#c99a4a_48%,#81551e_85%,#35230e)] border-2 border-[#ffe8b4] shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_2px_0_#35230e] text-white'
                  : 'bg-[linear-gradient(180deg,#36515a,#1b3038_65%,#101b20)] border-2 border-[#8aa0a5] shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_3px_0_#0b1519,0_5px_8px_rgba(0,0,0,0.4)] text-white hover:brightness-110'
              }`}
            >
              ∞ INFINITO
            </button>
          </div>
        </div>

        {/* VIDAS Selection */}
        <div className="bg-[#102b35]/95 backdrop-blur-md p-2 rounded-xl border border-[#bda56b]/60">
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
                className={`py-1.5 px-2 rounded-lg font-bold text-[11px] uppercase tracking-wide border-2 transition cursor-pointer ${
                  lives === num
                    ? 'bg-[linear-gradient(180deg,#ffe3a0,#c99a4a_48%,#81551e_85%,#35230e)] border-2 border-[#ffe8b4] shadow-[inset_0_2px_0_rgba(255,255,255,0.5),0_3px_0_#35230e,0_5px_8px_rgba(0,0,0,0.4)] text-white'
                    : 'bg-[linear-gradient(180deg,#36515a,#1b3038_65%,#101b20)] border-2 border-[#8aa0a5] shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_2px_0_#0b1519] text-white hover:brightness-110'
                }`}
              >
                {num === 'INFINITE' ? '∞ VIDAS' : `${num} ${num === 1 ? 'VIDA' : 'VIDAS'}`}
              </button>
            ))}
          </div>
        </div>

        {/* MAPA / ESCENARIO Selection */}
        <div className="bg-[#102b35]/95 backdrop-blur-md p-1.5 rounded-lg border border-[#bda56b]/60">
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
                className={`p-1.5 rounded-lg text-left border-2 transition text-[11px] cursor-pointer ${
                  islandId === island.id
                    ? 'bg-[linear-gradient(180deg,#ffe3a0,#c99a4a_48%,#81551e_85%,#35230e)] border-2 border-[#ffe8b4] shadow-[inset_0_2px_0_rgba(255,255,255,0.5),0_3px_0_#35230e,0_5px_8px_rgba(0,0,0,0.4)] text-white'
                    : 'bg-[#1d211c]/82 border-[#555a4e] text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="font-black text-[10px] text-amber-300">{island.title}</div>
                <div className="text-[10px] text-slate-100 truncate">{island.subtitle}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Submit Action */}
        <div className="pt-0 shrink-0">
          <button
            type="submit"
            className="w-full min-h-10 py-2 rounded-lg bg-[linear-gradient(180deg,#ffe3a0,#c99a4a_48%,#81551e_85%,#35230e)] hover:brightness-110 text-white font-black text-sm uppercase tracking-wider shadow-[inset_0_2px_0_rgba(255,255,255,0.6),inset_0_-3px_0_rgba(0,0,0,0.25),0_3px_0_#35230e,0_5px_8px_rgba(0,0,0,0.45)] border-2 border-[#ffe8b4] flex items-center justify-center gap-2 active:translate-y-0.5 transition cursor-pointer"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>CREAR PARTIDA</span>
          </button>
        </div>

      </form>

    </div>
  );
};
