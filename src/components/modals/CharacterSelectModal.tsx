import React, { useState } from 'react';
import { CharacterId, CharacterStats } from '../../types/game';
import { CHARACTERS } from '../../config/characters';
import { 
  CheckCircle2, 
  Lock,
  Zap,
  ShieldAlert,
  Crosshair
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
  const [selectedId, setSelectedId] = useState<CharacterId>(
    lockedCharacterId === 'mono' ? 'tortuga' : 'mono'
  );

  const selectedChar = CHARACTERS.find(c => c.id === selectedId) || CHARACTERS[0];
  const isLockedByRival = lockedCharacterId === selectedChar.id;

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

      {/* 2 Lines of 3 Characters (6 characters in 2 rows x 3 cols grid) */}
      <div className="relative z-10 flex-1 min-h-0 flex flex-col justify-center max-w-[340px] mx-auto w-full my-1">
        <div className="grid grid-cols-3 grid-rows-2 gap-2 w-full h-[220px] sm:h-[240px]">
          {CHARACTERS.map((char) => {
            const isSelected = char.id === selectedId;
            const isLocked = lockedCharacterId === char.id;
            const coords = CHARACTER_SPRITE_COORDS[char.id] || { bgPos: '0% 0%' };

            return (
              <button
                key={char.id}
                onClick={() => {
                  if (!isLocked) setSelectedId(char.id);
                }}
                disabled={isLocked}
                className={`relative rounded-xl border-2 transition-all p-1 flex flex-col items-center justify-between overflow-hidden cursor-pointer backdrop-blur-sm ${
                  isSelected
                    ? 'border-amber-400 bg-amber-500/25 scale-105 shadow-[0_0_12px_#f59e0b] ring-2 ring-amber-400'
                    : isLocked
                    ? 'border-red-900/60 bg-red-950/60 opacity-50 cursor-not-allowed'
                    : 'border-slate-700/80 bg-slate-900/80 hover:border-amber-500/60 hover:bg-slate-800'
                }`}
                title={char.name}
              >
                {/* Character Sprite with idle animation */}
                <div className="w-full flex-1 min-h-0 flex items-center justify-center relative">
                  <div
                    className={`w-14 h-14 sm:w-16 sm:h-16 transition-transform ${
                      isSelected ? 'animate-bounce' : 'hover:scale-110'
                    }`}
                    style={{
                      backgroundImage: `url('${getAssetUrl('assets/sprites/personajes.png')}')`,
                      backgroundSize: '300% 200%',
                      backgroundPosition: coords.bgPos,
                      backgroundRepeat: 'no-repeat'
                    }}
                  />
                  {isLocked && (
                    <div className="absolute inset-0 bg-red-950/85 flex items-center justify-center rounded">
                      <Lock className="w-4 h-4 text-red-400" />
                    </div>
                  )}
                </div>

                {/* Name */}
                <span className={`text-[10px] sm:text-[11px] font-black uppercase tracking-wider font-['Fredoka',sans-serif] ${
                  isSelected ? 'text-amber-300' : 'text-slate-300'
                }`}>
                  {char.name}
                </span>
              </button>
            );
          })}
        </div>
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
