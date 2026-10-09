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
    <div className="absolute inset-0 z-50 flex flex-col justify-between gap-2 p-2 sm:p-3 select-none overflow-hidden bg-slate-950">
      
      {/* Official Menu Background (fondomenu.png) */}
      <img
        src={getAssetUrl('assets/sprites/fondomenu.png')}
        alt="Fondo Menú"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-100"
      />

      {/* Dark Vignette Overlay for maximum readability */}
      <div className="absolute inset-0 bg-black/5 pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 text-center pt-1 shrink-0">
        <h2 className="text-lg sm:text-2xl font-black text-white tracking-wide leading-tight font-['Fredoka',sans-serif] bg-slate-950/65 rounded-lg px-2 py-1 drop-shadow-[0_2px_3px_rgba(0,0,0,1)]">
          ELIGE TU PERSONAJE
        </h2>
      </div>

      {/* Locked Alert if Rival selected this character */}
      {lockedCharacterId && (
        <div className="relative z-10 mx-auto max-w-[320px] w-full shrink-0 bg-[#4b2924]/95 border border-[#9a5a4f] rounded-lg px-2 py-0.5 flex items-center justify-center gap-1.5 text-[11px] text-[#e6c6bf] shadow-md">
          <Lock className="w-3.5 h-3.5 text-[#b87869] shrink-0" />
          <span>Rival eligió a <strong className="text-white uppercase font-black">{lockedCharacterId}</strong></span>
        </div>
      )}

      {/* Character carousel: one large official sprite at a time */}
      <div className="relative z-10 flex-none h-[min(34dvh,230px)] min-h-[190px] flex items-center justify-center max-w-[340px] mx-auto w-full my-0">
        <button
          type="button"
          onClick={() => moveCarousel(-1)}
          className="absolute left-0 z-20 w-10 h-10 rounded-full bg-[linear-gradient(180deg,#36515a,#1b3038_65%,#101b20)] border-2 border-[#8aa0a5] shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_3px_0_#0b1519,0_5px_8px_rgba(0,0,0,0.4)] text-white flex items-center justify-center shadow-lg hover:bg-[#30352b]"
          aria-label="Personaje anterior"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <div className={`w-[min(58vw,210px)] h-full max-h-[220px] rounded-2xl border-2 flex flex-col items-center justify-center p-3 backdrop-blur-sm shadow-xl ${
          isLockedByRival ? 'border-red-700 bg-red-950/70 opacity-60' : 'border-[#9a8351] bg-[#141713]/72'
        }`}>
          <div
            className="w-[min(34vw,135px)] h-[min(19dvh,135px)] transition-transform hover:scale-105"
            style={{
              backgroundImage: `url('${getAssetUrl('assets/sprites/personajes.png')}')`,
              backgroundSize: '300% 200%',
              backgroundPosition: CHARACTER_SPRITE_COORDS[selectedId]?.bgPos || '0% 0%',
              backgroundRepeat: 'no-repeat'
            }}
          />
          <span className="text-base font-black uppercase tracking-wider text-[#d0b56f] font-['Fredoka',sans-serif]">
            {selectedChar.name}
          </span>
          <span className="text-[10px] text-slate-300 mt-1">PERSONAJE {carouselIndex + 1} / {CHARACTERS.length}</span>
          {isLockedByRival && <span className="text-[10px] text-red-300 font-bold mt-1">BLOQUEADO POR EL RIVAL</span>}
        </div>

        <button
          type="button"
          onClick={() => moveCarousel(1)}
          className="absolute right-0 z-20 w-10 h-10 rounded-full bg-[#242820]/82 border border-[#9a8351] text-[#d0b56f] flex items-center justify-center shadow-lg hover:bg-[#30352b]"
          aria-label="Siguiente personaje"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Balanced Attributes Panel */}
      <div className="relative z-10 shrink-0 bg-[#141713]/90 backdrop-blur-md p-3 rounded-xl border border-[#9a8351]/40 space-y-1 max-w-[300px] w-full mx-auto">
        {/* Fuerza */}
        <div>
          <div className="flex justify-between text-xs font-black uppercase text-slate-100 mb-0.5">
            <span className="flex items-center gap-1 text-[#b87869]">
              <Zap className="w-3 h-3" />
              FUERZA
            </span>
            <span className="font-mono text-white">{selectedChar.fuerza}/100</span>
          </div>
          <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#a15a43] transition-all duration-300"
              style={{ width: `${selectedChar.fuerza}%` }}
            />
          </div>
        </div>

        {/* Resistencia */}
        <div>
          <div className="flex justify-between text-[10px] font-black uppercase text-slate-300 mb-0.5">
            <span className="flex items-center gap-1 text-[#8fa878]">
              <ShieldAlert className="w-3 h-3" />
              RESISTENCIA
            </span>
            <span className="font-mono text-white">{selectedChar.resistencia}/100</span>
          </div>
          <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#687b58] transition-all duration-300"
              style={{ width: `${selectedChar.resistencia}%` }}
            />
          </div>
        </div>

        {/* Rango de Ángulo */}
        <div className="flex items-center justify-between pt-0.5 border-t border-slate-700 text-xs">
          <span className="flex items-center gap-1 text-[#9b8b62] font-bold uppercase">
            <Crosshair className="w-3 h-3" />
            ÁNGULO
          </span>
          <span className="font-mono font-black text-[#d0b56f]">
            {selectedChar.minAngle}° — {selectedChar.maxAngle}°
          </span>
        </div>
      </div>

      {/* Select Action Buttons */}
      <div className="relative z-10 flex gap-2 max-w-[340px] w-full mx-auto pb-1 mt-0 shrink-0">
        {onCancel && (
          <button
            onClick={onCancel}
            className="min-h-11 py-2.5 px-4 rounded-xl bg-[#292d27]/95 hover:bg-[#353a31] text-[#ddd8c9] font-bold text-xs uppercase border border-slate-700 transition cursor-pointer backdrop-blur-sm"
          >
            Atrás
          </button>
        )}

        <button
          onClick={handleConfirm}
          disabled={isLockedByRival}
          className={`flex-1 min-h-11 py-2.5 px-3 rounded-xl font-black text-sm uppercase tracking-wide shadow-lg flex items-center justify-center gap-2 transition cursor-pointer ${
            isLockedByRival
              ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
              : 'bg-[linear-gradient(180deg,#ffe3a0,#c99a4a_48%,#81551e_85%,#35230e)] border-2 border-[#ffe8b4] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_3px_0_#35230e] active:translate-y-0.5'
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
