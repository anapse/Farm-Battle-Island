import React, { useState } from 'react';
import { CharacterId, CharacterStats } from '../../types/game';
import { CHARACTERS } from '../../config/characters';
import { 
  ChevronLeft, 
  ChevronRight, 
  ShieldAlert, 
  Crosshair, 
  Zap, 
  CheckCircle2, 
  Lock 
} from 'lucide-react';

interface CharacterSelectModalProps {
  playerName: string;
  isPlayer1: boolean;
  lockedCharacterId?: CharacterId | null;
  onSelectCharacter: (characterId: CharacterId) => void;
  onCancel?: () => void;
}

// 6 characters in official personajes.png (3 cols x 2 rows)
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
  const [currentIndex, setCurrentIndex] = useState(0);

  const characterCount = CHARACTERS.length;

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + characterCount) % characterCount);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % characterCount);
  };

  const character: CharacterStats = CHARACTERS[currentIndex];
  const isLockedByRival = lockedCharacterId === character.id;
  const spriteCoords = CHARACTER_SPRITE_COORDS[character.id] || { bgPos: '0% 0%' };

  const handleConfirm = () => {
    if (isLockedByRival) return;
    onSelectCharacter(character.id);
  };

  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-between p-3 sm:p-4 select-none overflow-hidden bg-slate-950">
      
      {/* Official Menu Background (fondomenu.png) */}
      <img
        src="/assets/sprites/fondomenu.png"
        alt="Fondo Menú"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-85"
      />

      {/* Dark Vignette Overlay for maximum readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-slate-950/80 pointer-events-none" />

      {/* 1. Header (clean, without unnecessary texts) - ~7% */}
      <div className="relative z-10 text-center pt-1">
        <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide font-['Fredoka',sans-serif] drop-shadow-md">
          ELIGE TU PERSONAJE
        </h2>
      </div>

      {/* Locked Alert if Rival selected this character - ~5% */}
      {lockedCharacterId && (
        <div className="relative z-10 mx-auto max-w-[280px] w-full bg-red-950/90 border border-red-500 rounded-lg px-2.5 py-1 flex items-center justify-center gap-1.5 text-[11px] text-red-200 shadow-md">
          <Lock className="w-3.5 h-3.5 text-red-400 shrink-0" />
          <span>Rival eligió a <strong className="text-white uppercase font-black">{lockedCharacterId}</strong></span>
        </div>
      )}

      {/* 2. Character Showcase with Official Sprite & Idle Animation - ~46% */}
      <div className="relative z-10 flex-1 min-h-0 flex items-center justify-between gap-1 my-1">
        
        {/* Left Arrow */}
        <button
          onClick={handlePrev}
          className="w-9 h-9 rounded-full bg-slate-900/90 hover:bg-amber-600 text-white flex items-center justify-center shadow-lg border border-amber-500/50 transition active:scale-90 shrink-0 z-10 cursor-pointer backdrop-blur-sm"
          title="Anterior"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Center Stage */}
        <div className="flex-1 h-full min-h-0 flex flex-col items-center justify-center px-1">
          <div className="relative w-full max-w-[220px] h-[85%] max-h-[220px] rounded-2xl bg-slate-950/80 border-2 border-amber-500/70 p-2 flex flex-col items-center justify-center shadow-2xl backdrop-blur-md overflow-hidden">
            
            {/* Radial Accent Glow */}
            <div 
              className="absolute inset-0 opacity-25 pointer-events-none transition-colors duration-500"
              style={{
                background: `radial-gradient(circle at 50% 50%, ${character.themeColor} 0%, transparent 70%)`
              }}
            />

            {/* Locked Watermark */}
            {isLockedByRival && (
              <div className="absolute inset-0 bg-red-950/85 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center p-2 text-center">
                <Lock className="w-8 h-8 text-red-400 mb-1 animate-bounce" />
                <span className="text-xs font-black uppercase text-red-200 tracking-wider">
                  BLOQUEADO
                </span>
              </div>
            )}

            {/* Animated Sprite using personajes.png directly */}
            <div key={character.id} className="relative z-10 flex flex-col items-center justify-center h-full w-full animate-character-pop">
              <div className="animate-character-bob flex items-center justify-center">
                <div
                  className="w-24 h-24 sm:w-28 sm:h-28 drop-shadow-[0_10px_16px_rgba(0,0,0,0.9)] transition-transform"
                  style={{
                    backgroundImage: `url('/assets/sprites/personajes.png')`,
                    backgroundSize: '300% 200%',
                    backgroundPosition: spriteCoords.bgPos,
                    backgroundRepeat: 'no-repeat'
                  }}
                />
              </div>
              <div className="w-20 h-2.5 rounded-full bg-black/60 blur-[2px] mx-auto animate-shadow-pulse mt-[-4px]" />
            </div>

            {/* Chassis Accent Dot */}
            <div 
              className="absolute top-2 right-2 w-3 h-3 rounded-full border border-white/80 shadow"
              style={{ backgroundColor: character.tankColor }}
              title="Color de Chasis"
            />
          </div>

          {/* Character Name */}
          <h3 className="text-lg sm:text-xl font-black text-amber-300 uppercase tracking-wider mt-1 font-['Fredoka',sans-serif] drop-shadow">
            {character.name}
          </h3>
        </div>

        {/* Right Arrow */}
        <button
          onClick={handleNext}
          className="w-9 h-9 rounded-full bg-slate-900/90 hover:bg-amber-600 text-white flex items-center justify-center shadow-lg border border-amber-500/50 transition active:scale-90 shrink-0 z-10 cursor-pointer backdrop-blur-sm"
          title="Siguiente"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

      </div>

      {/* 3. 6 Characters Thumbnail Strip - ~8% */}
      <div className="relative z-10 flex items-center justify-center gap-1.5 my-1">
        {CHARACTERS.map((c, i) => {
          const isSelected = i === currentIndex;
          const isTaken = lockedCharacterId === c.id;
          const thumbCoords = CHARACTER_SPRITE_COORDS[c.id] || { bgPos: '0% 0%' };

          return (
            <button
              key={c.id}
              onClick={() => setCurrentIndex(i)}
              className={`relative w-9 h-9 rounded-xl overflow-hidden border-2 transition-all p-0.5 cursor-pointer backdrop-blur-sm ${
                isSelected
                  ? 'border-amber-400 bg-amber-500/30 scale-110 shadow-lg ring-1 ring-amber-400'
                  : isTaken
                  ? 'border-red-600/60 bg-red-950/60 opacity-60'
                  : 'border-slate-700/80 bg-slate-900/80 hover:border-slate-500'
              }`}
              title={c.name}
            >
              <div
                className="w-full h-full"
                style={{
                  backgroundImage: `url('/assets/sprites/personajes.png')`,
                  backgroundSize: '300% 200%',
                  backgroundPosition: thumbCoords.bgPos,
                  backgroundRepeat: 'no-repeat'
                }}
              />
              {isTaken && (
                <div className="absolute inset-0 bg-red-950/80 flex items-center justify-center">
                  <Lock className="w-3 h-3 text-red-400" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* 4. Balanced Attributes Panel - ~20% */}
      <div className="relative z-10 bg-slate-950/80 backdrop-blur-md p-2.5 rounded-xl border border-amber-500/40 space-y-1.5 max-w-[280px] w-full mx-auto">
        
        {/* Fuerza */}
        <div>
          <div className="flex justify-between text-[10px] font-black uppercase text-slate-300 mb-0.5">
            <span className="flex items-center gap-1 text-red-400">
              <Zap className="w-3 h-3" />
              FUERZA
            </span>
            <span className="font-mono text-white">{character.fuerza}/100</span>
          </div>
          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-red-600 to-amber-500 transition-all duration-300"
              style={{ width: `${character.fuerza}%` }}
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
            <span className="font-mono text-white">{character.resistencia}/100</span>
          </div>
          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-teal-400 transition-all duration-300"
              style={{ width: `${character.resistencia}%` }}
            />
          </div>
        </div>

        {/* Rango de Ángulo */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[10px]">
          <span className="flex items-center gap-1 text-sky-400 font-bold uppercase">
            <Crosshair className="w-3 h-3" />
            ÁNGULO:
          </span>
          <span className="font-mono font-black text-amber-300">
            {character.minAngle}° — {character.maxAngle}°
          </span>
        </div>

      </div>

      {/* 5. Select Action Buttons - ~8% */}
      <div className="relative z-10 flex gap-2 max-w-[280px] w-full mx-auto pb-1">
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
              <span>CONFIRMAR {character.name}</span>
            </>
          )}
        </button>
      </div>

    </div>
  );
};
