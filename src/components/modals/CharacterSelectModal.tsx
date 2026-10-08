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
  Lock, 
  Sparkles,
  Info
} from 'lucide-react';

interface CharacterSelectModalProps {
  playerName: string;
  isPlayer1: boolean;
  lockedCharacterId?: CharacterId | null; // The character chosen by opponent
  onSelectCharacter: (characterId: CharacterId) => void;
  onCancel?: () => void;
}

export const CharacterSelectModal: React.FC<CharacterSelectModalProps> = ({
  playerName,
  isPlayer1,
  lockedCharacterId,
  onSelectCharacter,
  onCancel
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const characterCount = CHARACTERS.length;

  // Infinite carousel navigation
  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + characterCount) % characterCount);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % characterCount);
  };

  const character: CharacterStats = CHARACTERS[currentIndex];
  const isLockedByRival = lockedCharacterId === character.id;

  const handleConfirm = () => {
    if (isLockedByRival) return;
    onSelectCharacter(character.id);
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md select-none overflow-y-auto">
      <div className="w-full max-w-sm bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-2 border-amber-500 rounded-3xl shadow-2xl p-4 sm:p-5 text-slate-100 flex flex-col justify-between my-auto">
        
        {/* Header */}
        <div className="text-center mb-2">
          <span className="text-[10px] font-black tracking-widest text-amber-400 uppercase">
            {isPlayer1 ? 'JUGADOR 1' : 'JUGADOR 2'} · DESPLIEGUE TÁCTICO
          </span>
          <h2 className="text-2xl font-black text-white font-['Fredoka',sans-serif]">
            ELIGE TU PERSONAJE
          </h2>
          <p className="text-[11px] text-slate-400">
            Comandante: <span className="text-amber-300 font-bold">{playerName}</span>
          </p>
        </div>

        {/* Mutual Exclusion Alert Banner if opponent picked a character */}
        {lockedCharacterId && (
          <div className="bg-red-950/80 border border-red-500/80 rounded-xl px-2.5 py-1.5 mb-2.5 flex items-center gap-2 text-[10px] text-red-200">
            <Lock className="w-3.5 h-3.5 text-red-400 shrink-0" />
            <span>
              El rival ya seleccionó a <strong className="text-white uppercase font-black">{lockedCharacterId}</strong>. Ese personaje está bloqueado.
            </span>
          </div>
        )}

        {/* Infinite Carousel Controls & Technical Preview */}
        <div className="relative flex items-center justify-between gap-1 my-1">
          {/* ◀ Left Carousel Button */}
          <button
            onClick={handlePrev}
            className="w-10 h-10 rounded-full bg-slate-800 hover:bg-amber-600 text-white flex items-center justify-center shadow-lg border border-slate-600 transition active:scale-90 shrink-0 z-10"
            title="Personaje anterior"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Central Character Card */}
          <div className="flex-1 flex flex-col items-center px-1">
            
            {/* Technical Placeholder Frame (NO AI IMAGES RULE APPLIED) */}
            <div className="relative w-44 h-36 sm:w-48 sm:h-40 rounded-2xl bg-gradient-to-b from-slate-800 to-slate-950 border-2 border-amber-500/70 p-2 flex flex-col items-center justify-center shadow-inner overflow-hidden">
              
              {/* Locked Watermark Overlay */}
              {isLockedByRival && (
                <div className="absolute inset-0 bg-red-950/85 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center p-3 text-center">
                  <Lock className="w-8 h-8 text-red-400 mb-1 animate-bounce" />
                  <span className="text-xs font-black uppercase text-red-200 tracking-wider">
                    BLOQUEADO
                  </span>
                  <span className="text-[10px] text-red-300 font-semibold mt-0.5">
                    Ocupado por el rival
                  </span>
                </div>
              )}

              {/* Technical Blueprint Placeholder Graphic */}
              <div 
                className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl shadow-lg border-2 border-white/20 mb-1 transition-transform"
                style={{ backgroundColor: character.themeColor }}
              >
                <span>{character.badgeSymbol}</span>
              </div>

              {/* Technical Model Blueprint Label */}
              <div className="text-[10px] font-mono text-amber-300 font-bold tracking-wider">
                TANK-CHASSIS #{currentIndex + 1}
              </div>
              <div className="text-[9px] text-slate-400 text-center px-2 line-clamp-1">
                {character.specialTrait}
              </div>

              {/* Color Accent Pill */}
              <div 
                className="absolute top-2 right-2 w-3 h-3 rounded-full border border-white"
                style={{ backgroundColor: character.tankColor }}
                title="Color táctico de chasis"
              />
            </div>

            {/* Character Name */}
            <h3 className="text-xl font-black text-amber-300 uppercase tracking-wider mt-2 font-['Fredoka',sans-serif]">
              {character.name}
            </h3>

          </div>

          {/* ▶ Right Carousel Button */}
          <button
            onClick={handleNext}
            className="w-10 h-10 rounded-full bg-slate-800 hover:bg-amber-600 text-white flex items-center justify-center shadow-lg border border-slate-600 transition active:scale-90 shrink-0 z-10"
            title="Personaje siguiente"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        {/* Carousel Dots Indicator */}
        <div className="flex items-center justify-center gap-1.5 my-2">
          {CHARACTERS.map((c, i) => (
            <button
              key={c.id}
              onClick={() => setCurrentIndex(i)}
              className={`w-2 h-2 rounded-full transition-all ${
                i === currentIndex
                  ? 'w-5 bg-amber-400'
                  : lockedCharacterId === c.id
                  ? 'bg-red-500/50'
                  : 'bg-slate-700'
              }`}
            />
          ))}
        </div>

        {/* Balanced Attributes Panel */}
        <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800 space-y-2">
          
          {/* Fuerza Meter */}
          <div>
            <div className="flex justify-between text-[11px] font-black uppercase text-slate-300 mb-0.5">
              <span className="flex items-center gap-1 text-red-400">
                <Zap className="w-3 h-3" />
                FUERZA
              </span>
              <span className="font-mono text-white">{character.fuerza}/100</span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-red-600 to-amber-500 transition-all duration-300"
                style={{ width: `${character.fuerza}%` }}
              />
            </div>
          </div>

          {/* Resistencia Meter */}
          <div>
            <div className="flex justify-between text-[11px] font-black uppercase text-slate-300 mb-0.5">
              <span className="flex items-center gap-1 text-emerald-400">
                <ShieldAlert className="w-3 h-3" />
                RESISTENCIA
              </span>
              <span className="font-mono text-white">{character.resistencia}/100</span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-teal-400 transition-all duration-300"
                style={{ width: `${character.resistencia}%` }}
              />
            </div>
          </div>

          {/* Rango de Ángulo */}
          <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[11px]">
            <span className="flex items-center gap-1 text-sky-400 font-bold uppercase">
              <Crosshair className="w-3 h-3" />
              RANGO DE ÁNGULO:
            </span>
            <span className="font-mono font-black text-amber-300">
              {character.minAngle}° — {character.maxAngle}°
            </span>
          </div>

        </div>

        {/* Select Action Button */}
        <div className="mt-3 flex gap-2">
          {onCancel && (
            <button
              onClick={onCancel}
              className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase transition"
            >
              Atrás
            </button>
          )}

          <button
            onClick={handleConfirm}
            disabled={isLockedByRival}
            className={`flex-1 py-3 px-4 rounded-xl font-black text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition ${
              isLockedByRival
                ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                : 'bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white border-2 border-emerald-300 active:scale-95 cursor-pointer'
            }`}
          >
            {isLockedByRival ? (
              <>
                <Lock className="w-4 h-4" />
                <span>PERSONAJE NO DISPONIBLE</span>
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
    </div>
  );
};
