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
  creatorName,
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
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm select-none">
      <div className="w-full max-w-sm bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-amber-500 rounded-2xl shadow-2xl p-5 text-slate-100 relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="mb-4">
          <span className="text-[10px] font-black tracking-widest text-amber-400 uppercase">
            SALA PRIVADA
          </span>
          <h2 className="text-xl font-black text-white font-['Fredoka',sans-serif]">
            CREAR PARTIDA
          </h2>
          <p className="text-xs text-slate-400">
            Creador: <span className="text-amber-300 font-bold">{creatorName}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* TIEMPO Selection */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-black uppercase text-amber-300 mb-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>TIEMPO DE PARTIDA:</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTimeLimit('5_MIN')}
                className={`py-2 px-3 rounded-xl font-black text-xs uppercase tracking-wider border-2 transition ${
                  timeLimit === '5_MIN'
                    ? 'bg-amber-600 border-amber-300 text-white shadow-md'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
              >
                5 MIN
              </button>
              <button
                type="button"
                onClick={() => setTimeLimit('INFINITE')}
                className={`py-2 px-3 rounded-xl font-black text-xs uppercase tracking-wider border-2 transition ${
                  timeLimit === 'INFINITE'
                    ? 'bg-amber-600 border-amber-300 text-white shadow-md'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
              >
                ∞ (SIN LÍMITE)
              </button>
            </div>
          </div>

          {/* VIDAS Selection */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-black uppercase text-amber-300 mb-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>VIDAS POR JUGADOR:</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {([1, 3, 5] as GameLivesOption[]).map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setLives(num)}
                  className={`py-2 px-3 rounded-xl font-black text-xs uppercase tracking-wider border-2 transition ${
                    lives === num
                      ? 'bg-red-600 border-red-300 text-white shadow-md'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {num} {num === 1 ? 'VIDA' : 'VIDAS'}
                </button>
              ))}
            </div>
          </div>

          {/* MAPA / ISLA Selection */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-black uppercase text-amber-300 mb-1.5">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              <span>MAPA DE ISLA:</span>
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {ISLANDS.map((island) => (
                <button
                  key={island.id}
                  type="button"
                  onClick={() => setIslandId(island.id)}
                  className={`p-2 rounded-lg text-left border transition text-xs ${
                    islandId === island.id
                      ? 'bg-emerald-950/80 border-emerald-400 text-white shadow-sm'
                      : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-750'
                  }`}
                >
                  <div className="font-black text-[11px] text-amber-300">{island.title}</div>
                  <div className="text-[10px] text-slate-300 truncate">{island.subtitle}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg border-2 border-amber-300 flex items-center justify-center gap-2 active:scale-95 transition"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>CREAR PARTIDA</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
