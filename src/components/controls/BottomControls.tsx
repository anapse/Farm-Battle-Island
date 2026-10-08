import React, { useState, useRef, useEffect } from 'react';
import { WindState } from '../../types/game';
import { Flame } from 'lucide-react';
import { getAssetUrl } from '../../utils/assets';

export type OfficialPowerUpId = 
  | 'bala_normal' 
  | 'bala_doble' 
  | 'bala_triple' 
  | 'bala_explosiva' 
  | 'granada' 
  | 'corazon';

// Official balas.png (2 rows x 3 cols):
// 0,0 = bala normal | 1,0 = bala doble | 2,0 = bala triple
// 0,1 = bala explosiva | 1,1 = granada | 2,1 = corazón
const POWERUP_BG_POSITIONS: Record<OfficialPowerUpId, string> = {
  bala_normal: '0% 0%',
  bala_doble: '50% 0%',
  bala_triple: '100% 0%',
  bala_explosiva: '0% 100%',
  granada: '50% 100%',
  corazon: '100% 100%'
};

interface BottomControlsProps {
  angle: number;
  power: number;
  wind: WindState;
  isMyTurn: boolean;
  isFiring?: boolean;
  powerUpSlots?: (OfficialPowerUpId | null)[];
  activeSlotIndex?: number | null;
  onSelectSlot?: (index: number) => void;
  onPowerChange: (newPower: number) => void;
  onFire: (overridePower?: number) => void;
  onMove?: (delta: number) => void;
}

export const BottomControls: React.FC<BottomControlsProps> = ({
  angle,
  power,
  wind,
  isMyTurn,
  isFiring = false,
  powerUpSlots = [null, null, null, null],
  activeSlotIndex = null,
  onSelectSlot,
  onPowerChange,
  onFire,
  onMove
}) => {
  const [isHoldingFire, setIsHoldingFire] = useState(false);

  // Oscillation state references for holding FIRE
  const animFrameRef = useRef<number | null>(null);
  const currentOscillatingPowerRef = useRef<number>(power);

  const stopOscillation = () => {
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    setIsHoldingFire(false);
  };

  useEffect(() => {
    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  // Pointer Down on FIRE: Start oscillating power continuously up and down
  const handleFirePointerDown = (e: React.PointerEvent) => {
    if (!isMyTurn || isFiring) return;
    e.preventDefault();

    setIsHoldingFire(true);
    currentOscillatingPowerRef.current = power;
    const startTime = performance.now();

    const loop = (time: number) => {
      const elapsed = (time - startTime) / 1000;
      // Continuous smooth sine oscillation between 15% and 100%
      const wave = (Math.sin(elapsed * 4.8) + 1) / 2;
      const calculated = Math.round(15 + wave * 85);
      currentOscillatingPowerRef.current = calculated;
      onPowerChange(calculated);

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
  };

  // Pointer Up on FIRE: Capture current oscillating power and execute shot
  const handleFirePointerUp = (e: React.PointerEvent) => {
    if (!isHoldingFire) return;
    e.preventDefault();

    const capturedPower = currentOscillatingPowerRef.current;
    stopOscillation();
    onFire(capturedPower);
  };

  const handleFirePointerLeave = (e: React.PointerEvent) => {
    if (isHoldingFire) {
      handleFirePointerUp(e);
    }
  };

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-30 select-none bg-gradient-to-t from-slate-950 via-slate-950/95 to-slate-900/90 border-t-2 border-amber-500/70 shadow-[0_-4px_24px_rgba(0,0,0,0.85)] backdrop-blur-md px-2.5 sm:px-4 py-1.5 text-slate-100">
      
      {/* Responsive unified HUD container - strictly contained inside viewport */}
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-2 sm:gap-4 w-full h-[64px] sm:h-[72px]">
        
        {/* 1. POWER-UP ZONE: Compact slots that start strictly EMPTY (VACÍOS) */}
        <div className="flex flex-col justify-center shrink-0">
          <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-amber-400 mb-0.5 font-['Fredoka',sans-serif]">
            POWER-UP
          </span>
          <div className="flex items-center gap-1 sm:gap-1.5 bg-black/50 p-1 rounded-lg border border-amber-600/40">
            {powerUpSlots.slice(0, 4).map((powerUpId, idx) => {
              const isSelected = activeSlotIndex === idx;
              const hasItem = powerUpId !== null;

              return (
                <button
                  key={idx}
                  onClick={() => {
                    if (hasItem && onSelectSlot && isMyTurn) {
                      onSelectSlot(idx);
                    }
                  }}
                  disabled={!isMyTurn || !hasItem}
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded flex items-center justify-center transition relative ${
                    isSelected
                      ? 'border-2 border-amber-300 ring-2 ring-amber-400 bg-amber-950/60 shadow-[0_0_8px_#f59e0b]'
                      : hasItem
                      ? 'border border-amber-500/60 bg-slate-900/90 hover:bg-slate-800'
                      : 'border border-slate-700/60 bg-slate-950/80 cursor-default opacity-40'
                  }`}
                  title={hasItem ? `Power-Up: ${powerUpId}` : 'Slot Vacío'}
                >
                  {hasItem ? (
                    // Strictly the official sliced transparent sprite from balas.png
                    <div
                      className="w-6 h-6 sm:w-7 sm:h-7 pointer-events-none drop-shadow"
                      style={{
                        backgroundImage: `url('${getAssetUrl('assets/sprites/balas.png')}')`,
                        backgroundSize: '300% 200%',
                        backgroundPosition: POWERUP_BG_POSITIONS[powerUpId] || '0% 0%',
                        backgroundRepeat: 'no-repeat'
                      }}
                    />
                  ) : (
                    // Clean Empty Slot: No emojis, no lucide icons
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-700/60" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. VIENTO & ÁNGULO ZONE (Pure visual readout - angle controlled by mouse) */}
        <div className="flex flex-col items-center justify-center shrink-0 px-1 sm:px-2 bg-black/40 py-1 rounded-lg border border-amber-600/30">
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Wind Readout */}
            <div className="flex items-center gap-1 text-[11px] sm:text-xs font-mono font-bold text-cyan-300">
              <span className="text-[10px] sm:text-xs text-slate-400 font-sans">VIENTO:</span>
              <span>{wind.speed} km/h</span>
              <span className="text-sm font-black text-cyan-400">
                {wind.direction > 0 ? '➡' : '⬅'}
              </span>
            </div>
            
            <div className="w-[1px] h-4 bg-slate-700/80" />

            {/* Aim Angle Readout (Follows mouse position relative to vehicle) */}
            <div className="flex items-center gap-1 text-[11px] sm:text-xs font-mono font-black text-emerald-300">
              <span className="text-[10px] sm:text-xs text-slate-400 font-sans">ÁNGULO:</span>
              <span className="text-sm sm:text-base font-black text-amber-300">{angle}°</span>
            </div>
          </div>

          {/* Discreet Move Vehicle Buttons */}
          {onMove && (
            <div className="flex items-center gap-1.5 mt-0.5">
              <button
                onClick={() => onMove(-14)}
                disabled={!isMyTurn}
                className="px-2 py-0.2 rounded bg-emerald-950/80 hover:bg-emerald-800 text-emerald-200 border border-emerald-600/60 disabled:opacity-30 text-[10px] font-black transition active:scale-95"
                title="Mover tanque izquierda (A / ◀)"
              >
                ◀
              </button>
              <span className="text-[8px] sm:text-[9px] uppercase text-emerald-300/80 font-bold tracking-wider">
                MOVER
              </span>
              <button
                onClick={() => onMove(14)}
                disabled={!isMyTurn}
                className="px-2 py-0.2 rounded bg-emerald-950/80 hover:bg-emerald-800 text-emerald-200 border border-emerald-600/60 disabled:opacity-30 text-[10px] font-black transition active:scale-95"
                title="Mover tanque derecha (D / ▶)"
              >
                ▶
              </button>
            </div>
          )}
        </div>

        {/* 3. FUERZA ZONE: Flexible Bar */}
        <div className="flex-1 min-w-[110px] max-w-[260px] flex flex-col justify-center px-1">
          <div className="flex items-center justify-between text-[9px] sm:text-[10px] font-black uppercase text-amber-300 mb-0.5 font-['Fredoka',sans-serif]">
            <span>{isHoldingFire ? 'CARGANDO...' : 'FUERZA'}</span>
            <span className={`font-mono font-bold ${isHoldingFire ? 'text-yellow-300 scale-110' : 'text-amber-200'}`}>
              {power}%
            </span>
          </div>

          <div className="relative w-full flex items-center">
            <input
              type="range"
              min="10"
              max="100"
              value={power}
              onChange={(e) => onPowerChange(Number(e.target.value))}
              disabled={!isMyTurn || isFiring}
              className={`w-full accent-amber-400 h-2 sm:h-2.5 bg-slate-900 rounded-lg appearance-none cursor-pointer border transition-all ${
                isHoldingFire 
                  ? 'border-yellow-300 shadow-[0_0_10px_#f59e0b]' 
                  : 'border-amber-600/70'
              }`}
            />
          </div>
        </div>

        {/* 4. FIRE BUTTON ZONE: Compact, prominent, with oscillating hold mechanic */}
        <div className="flex flex-col items-center justify-center shrink-0">
          <button
            onPointerDown={handleFirePointerDown}
            onPointerUp={handleFirePointerUp}
            onPointerLeave={handleFirePointerLeave}
            disabled={!isMyTurn || isFiring}
            className={`w-13 h-13 sm:w-15 sm:h-15 w-[52px] h-[52px] sm:w-[58px] sm:h-[58px] rounded-full border-3 shadow-[0_0_14px_rgba(239,68,68,0.7)] flex flex-col items-center justify-center transition-all select-none touch-none ${
              !isMyTurn || isFiring
                ? 'bg-slate-800 border-slate-600 opacity-40 cursor-not-allowed'
                : isHoldingFire
                ? 'bg-gradient-to-tr from-yellow-500 via-amber-400 to-red-500 border-white scale-105 shadow-[0_0_20px_#f59e0b] cursor-pointer'
                : 'bg-gradient-to-tr from-red-600 via-red-500 to-amber-500 hover:brightness-110 active:scale-95 border-amber-300 cursor-pointer animate-pulse'
            }`}
            title={
              !isMyTurn 
                ? 'Esperando turno' 
                : isFiring 
                ? 'Disparo en curso...' 
                : 'Mantén presionado para cargar fuerza, suelta para disparar'
            }
          >
            <Flame className={`w-4 h-4 sm:w-5 sm:h-5 text-amber-100 fill-amber-200 ${isHoldingFire ? 'scale-115 animate-bounce' : ''}`} />
            <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-tight text-white drop-shadow font-['Fredoka',sans-serif] leading-tight">
              {isHoldingFire ? '¡SUELTA!' : isFiring ? 'EN VUELO' : 'FIRE'}
            </span>
          </button>
        </div>

      </div>

    </footer>
  );
};
