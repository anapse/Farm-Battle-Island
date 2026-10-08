import React, { useState } from 'react';
import { CharacterId, CharacterStats } from '../../types/game';
import { CHARACTERS } from '../../config/characters';
import { 
  CheckCircle2, 
  Lock,
  Zap,
  ShieldAlert,
  Crosshair,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { getAssetUrl } from '../../utils/assets';

interface CharacterSelectModalProps {
  playerName: string;
  isPlayer1: boolean;
  lockedCharacterId?: CharacterId | null;
  onSelectCharacter: (characterId: CharacterId) => void;
  onCancel?: () => void;
}

// 6 characters in official personajes.png (3 cols x 2 rows):
// Row 1: mono (0,0), tortuga (1,0), gallina (2,0)
// Row 2: panda (0,1), conejo (1,1), mapache (2,1)
const CHARACTER_SPRITE_COORDS: Record<CharacterId, { bgPos: string }> = {
  mono: { bgPos: '0% 0%' },
  tortuga: { bgPos: '50% 0%' },
  gallina: { bgPos: '100% 0%' },
  panda: { bgPos: '0% 100%' },
  conejo: { bgPos: '50% 100%' },
  mapache: { bgPos: '100% 100%' }
};

export const CharacterSelectModal: React.FC<CharacterSelectModalProps> = ({
  lockedCharacterId,
  onSelectCharacter,
  onCancel
}) => {
  const initialIndex = Math.max(0, CHARACTERS.findIndex(c => c.id === (lockedCharacterId === 'mono' ? 'tortuga' : 'mono')));
  const [carouselIndex, setCarouselIndex] = useState(initialIndex);
  const selectedId = CHARACTERS[carouselIndex]?.id || CHARACTERS[0].id;
  const selectedChar = CHARACTERS[carouselIndex] || CHARACTERS[0];

  const isLockedByRival = lockedCharacterId === selectedChar.id;

  const moveCarousel = (direction: number) => {
    const total = CHARACTERS.length;
    for (let step = 1; step <= total; step++) {
      const nextIndex = (carouselIndex + direction * step + total) % total;
      if (CHARACTERS[nextIndex].id !== lockedCharacterId) {
        setCarouselIndex(nextIndex);
        return;
      }
    }
  };

  const handleConfirm = () => {
    if (isLockedByRival) return;
    onSelectCharacter(selectedChar.id);
  };

  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-between p-3 sm:p-4 select-none overflow-hidden bg-slate-950">
      
      {/* Official Menu Background (fondomenu.png) */}
      <img
        src={getAssetUrl('assets/sprites/fondomenu.png')}
        alt="Fondo Menú"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-85"
      />

      {/* Dark Vignette Overlay for maximum readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/65 to-slate-950/80 pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 text-center pt-1">
        <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide font-['Fredoka',sans-serif] drop-shadow-md">
          ELIGE TU PERSONAJE
        </h2>
      </div>

      {/* Locked Alert if Rival selected this character */}
      {lockedCharacterId && (
        <div className="relative z-10 mx-auto max-w-[280px] w-full bg-red-950/90 border border-red-500 rounded-lg px-2 py-0.5 flex items-center justify-center gap-1.5 text-[11px] text-red-200 shadow-md">
          <Lock className="w-3.5 h-3.5 text-red-400 shrink-0" />
          <span>Rival eligió a <strong className="text-white uppercase font-black">{lockedCharacterId}</strong></span>
        </div>
      )}

      {/* Character carousel: one large official sprite at a time */}
      <div className="relative z-10 flex-1 min-h-0 flex items-center justify-center max-w-[340px] mx-auto w-full my-1">
        <button
          type="button"
          onClick={() => moveCarousel(-1)}
          className="absolute left-0 z-20 w-10 h-10 rounded-full bg-slate-950/85 border-2 border-amber-500/70 text-amber-300 flex items-center justify-center shadow-lg hover:bg-slate-900"
          aria-label="Personaje anterior"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <div className={`w-[210px] h-[230px] rounded-2xl border-2 flex flex-col items-center justify-center p-3 backdrop-blur-sm shadow-xl ${
          isLockedByRival ? 'border-red-700 bg-red-950/70 opacity-60' : 'border-amber-400 bg-slate-950/75'
        }`}>
          <div
            className="w-[150px] h-[150px] transition-transform hover:scale-105"
            style={{
              backgroundImage: `url('${getAssetUrl('assets/sprites/personajes.png')}')`,
              backgroundSize: '300% 200%',
              backgroundPosition: CHARACTER_SPRITE_COORDS[selectedId]?.bgPos || '0% 0%',
              backgroundRepeat: 'no-repeat'
            }}
          />
          <span className="text-base font-black uppercase tracking-wider text-amber-300 font-['Fredoka',sans-serif]">
            {selectedChar.name}
          </span>
          <span className="text-[10px] text-slate-300 mt-1">PERSONAJE {carouselIndex + 1} / {CHARACTERS.length}</span>
          {isLockedByRival && <span className="text-[10px] text-red-300 font-bold mt-1">BLOQUEADO POR EL RIVAL</span>}
        </div>

        <button
          type="button"
          onClick={() => moveCarousel(1)}
          className="absolute right-0 z-20 w-10 h-10 rounded-full bg-slate-950/85 border-2 border-amber-500/70 text-amber-300 flex items-center justify-center shadow-lg hover:bg-slate-900"
          aria-label="Siguiente personaje"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Balanced Attributes Panel */}
      <div className="relative z-10 bg-slate-950/85 backdrop-blur-md p-2 rounded-xl border border-amber-500/40 space-y-1 max-w-[300px] w-full mx-auto">
        {/* Fuerza */}
        <div>
          <div className="flex justify-between text-[10px] font-black uppercase text-slate-300 mb-0.5">
            <span className="flex items-center gap-1 text-red-400">
              <Zap className="w-3 h-3" />
              FUERZA
            </span>
            <span className="font-mono text-white">{selectedChar.fuerza}/100</span>
          </div>
          <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-red-600 to-amber-500 transition-all duration-300"
              style={{ width: `${selectedChar.fuerza}%` }}
            />
          </div>
        </div>

        {/* Resistencia */}
        <div>
          <div className="flex justify-between text-[10px] font-black uppercase text-slate-300 mb-0.5">
            <span className="flex items-center gap-1 text-emerald-400">
              <ShieldAlert className="w-3 h-3" />
              RESISTENCIA
            </span>
            <span className="font-mono text-white">{selectedChar.resistencia}/100</span>
          </div>
          <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-600 to-teal-400 transition-all duration-300"
              style={{ width: `${selectedChar.resistencia}%` }}
            />
          </div>
        </div>

        {/* Rango de Ángulo */}
        <div className="flex items-center justify-between pt-0.5 border-t border-slate-800 text-[10px]">
          <span className="flex items-center gap-1 text-sky-400 font-bold uppercase">
            <Crosshair className="w-3 h-3" />
            ÁNGULO
          </span>
          <span className="font-mono font-black text-amber-300">
            {selectedChar.minAngle}° — {selectedChar.maxAngle}°
          </span>
        </div>
      </div>

      {/* Select Action Buttons */}
      <div className="relative z-10 flex gap-2 max-w-[300px] w-full mx-auto pb-1 mt-1">
        {onCancel && (
          <button
            onClick={onCancel}
            className="py-2 px-3.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-300 font-bold text-xs uppercase border border-slate-700 transition cursor-pointer backdrop-blur-sm"
          >
            Atrás
          </button>
        )}

        <button
          onClick={handleConfirm}
          disabled={isLockedByRival}
          className={`flex-1 py-2 px-4 rounded-lg font-black text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition cursor-pointer ${
            isLockedByRival
              ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
              : 'bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white border border-emerald-300 active:scale-95 shadow-[0_4px_14px_rgba(16,185,129,0.4)]'
          }`}
        >
          {isLockedByRival ? (
            <>
              <Lock className="w-4 h-4" />
              <span>NO DISPONIBLE</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>CONFIRMAR {selectedChar.name}</span>
            </>
          )}
        </button>
      </div>

    </div>
  );
};
