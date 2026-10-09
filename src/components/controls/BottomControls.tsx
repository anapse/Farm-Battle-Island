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
  | 'corazon'
  | 'corazon_doble';

// Official balas.png (2 rows x 3 cols):
// 0,0 = bala normal | 1,0 = bala doble | 2,0 = bala triple
// 0,1 = bala explosiva | 1,1 = granada | 2,1 = corazón
const POWERUP_BG_POSITIONS: Record<OfficialPowerUpId, string> = {
  bala_normal: '0% 0%',
  bala_doble: '50% 0%',
  bala_triple: '100% 0%',
  bala_explosiva: '0% 100%',
  granada: '50% 100%',
  corazon: '100% 100%',
  corazon_doble: '100% 100%'
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
  lastShotPower?: number | null;
  onMarkLastShot?: () => void;
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
  onMove,
  lastShotPower = null,
  onMarkLastShot
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
      const wave = (Math.sin(elapsed * 2.8) + 1) / 2;
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
    <footer className="absolute bottom-0 left-0 right-0 z-30 h-[clamp(164px,22dvh,210px)] pb-[env(safe-area-inset-bottom)] select-none box-border overflow-hidden bg-gradient-to-b from-[#20291d] via-[#111912] to-[#090e0b] border-t-2 border-[#8f7a4e]/80 shadow-[0_-5px_24px_rgba(0,0,0,0.85)] px-2.5 sm:px-4 py-2 text-slate-100">
      
      {/* Responsive unified HUD container - strictly contained inside viewport */}
      <div className="w-full h-full min-h-0 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] grid-rows-[auto_minmax(0,1fr)_auto] items-center gap-x-2 gap-y-1 px-0.5 sm:px-2">
        
        {/* 1. POWER-UP ZONE: Compact slots that start strictly EMPTY (VACÍOS) */}
        <div className="col-span-3 row-start-1 flex flex-col justify-center min-w-0 w-full">
          <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-[#d6c17c] mb-0.5 font-['Fredoka',sans-serif]">
            POWER-UP
          </span>
          <div className="flex items-center justify-center gap-1 sm:gap-1.5 bg-[#080d09]/90 p-1 rounded-md border border-[#79934b]/80 shadow-[inset_0_2px_5px_rgba(0,0,0,0.8)]">
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
                  className={`flex-1 min-w-0 max-w-14 h-7 sm:h-8 rounded-sm flex items-center justify-center transition relative border-2 ${
                    isSelected
                      ? 'border-[#ffe27a] ring-1 ring-amber-300 bg-gradient-to-b from-[#3cae54] to-[#16733a] shadow-[0_0_8px_#f59e0b]'
                      : hasItem
                      ? 'border-[#1c1208] bg-gradient-to-b from-[#36b95c] to-[#15813e] hover:brightness-110 shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]'
                      : 'border-[#1b2415] bg-gradient-to-b from-[#1d6b36] to-[#0d3e24] cursor-default opacity-65'
                  }`}
                  title={hasItem ? `Power-Up: ${powerUpId}` : 'Slot Vacío'}
                >
                  {hasItem ? (
                    powerUpId === 'corazon_doble' ? (
                      <div className="flex items-center gap-0.5 pointer-events-none drop-shadow">
                        <div
                          className="w-4 h-4 sm:w-5 sm:h-5"
                          style={{
                            backgroundImage: `url('${getAssetUrl('assets/sprites/balas.png')}')`,
                            backgroundSize: '300% 200%',
                            backgroundPosition: '100% 100%',
                            backgroundRepeat: 'no-repeat'
                          }}
                        />
                        <div
                          className="w-4 h-4 sm:w-5 sm:h-5"
                          style={{
                            backgroundImage: `url('${getAssetUrl('assets/sprites/balas.png')}')`,
                            backgroundSize: '300% 200%',
                            backgroundPosition: '100% 100%',
                            backgroundRepeat: 'no-repeat'
                          }}
                        />
                      </div>
                    ) : (
                      // Official sliced transparent sprite from balas.png
                      <div
                        className="w-6 h-6 sm:w-7 sm:h-7 pointer-events-none drop-shadow"
                        style={{
                          backgroundImage: `url('${getAssetUrl('assets/sprites/balas.png')}')`,
                          backgroundSize: '300% 200%',
                          backgroundPosition: POWERUP_BG_POSITIONS[powerUpId] || '0% 0%',
                          backgroundRepeat: 'no-repeat'
                        }}
                      />
                    )
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
        <div className="col-start-2 row-start-2 min-w-[92px] flex flex-col items-center justify-center px-2 py-1 bg-gradient-to-b from-[#20a85b] to-[#16783c] border-[3px] border-[#0a160d] shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]">
          <div className="flex flex-col items-center justify-center gap-0.5 min-w-0">
            {/* Wind Readout */}
            <div className="flex items-center gap-0.5 text-[8px] sm:text-xs font-mono font-bold text-[#c4b88f] min-w-0">
              <span className="hidden">🧭</span>
              <span className="text-[8px] sm:text-[10px]">{wind.speed} km/h {wind.direction > 0 ? '➡' : '⬅'}</span>
              
            </div>
            
            <div className="hidden" />

            {/* Aim Angle Readout (Follows mouse position relative to vehicle) */}
            <div className="flex items-center gap-0.5 text-[8px] sm:text-xs font-mono font-black text-[#9aaa7a] min-w-0">
              <span className="hidden">ÁNG.</span>
              <span className="text-lg sm:text-xl font-black text-[#06130a]">{angle}°</span>
            </div>
          </div>

          {/* Circular movement controls matching the reference design */}
          {onMove && (
            <div className="flex items-center gap-1">
              <button onClick={() => onMove(-14)} disabled={!isMyTurn}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-[3px] border-black bg-gradient-to-b from-sky-400 to-sky-600 text-red-600 shadow-[inset_0_2px_2px_rgba(255,255,255,0.35),0_2px_4px_rgba(0,0,0,0.5)] disabled:opacity-35 flex items-center justify-center text-xl font-black active:scale-95"
                title="Mover tanque a la izquierda">◀</button>
              <button onClick={() => onMove(14)} disabled={!isMyTurn}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-[3px] border-black bg-gradient-to-b from-sky-400 to-sky-600 text-red-600 shadow-[inset_0_2px_2px_rgba(255,255,255,0.35),0_2px_4px_rgba(0,0,0,0.5)] disabled:opacity-35 flex items-center justify-center text-xl font-black active:scale-95"
                title="Mover tanque a la derecha">▶</button>
            </div>
          )}
        </div>

        {/* 3. FUERZA ZONE: Flexible Bar */}
        <div className="col-span-3 row-start-3 min-w-0 w-full flex flex-col justify-center px-1 pb-0.5">
          <div className="flex items-center justify-between text-[9px] sm:text-[10px] font-black uppercase text-[#c4ad73] mb-0.5 font-['Fredoka',sans-serif]">
            <span>{isHoldingFire ? 'CARGANDO...' : 'FUERZA'}</span>
            <span className={`font-mono font-bold ${isHoldingFire ? 'text-yellow-300 scale-110' : 'text-amber-200'}`}>
              {power}%
            </span>
          </div>

          <div className="relative w-full flex items-center gap-1.5">
            <div className="relative flex-1">
              <input
                type="range"
                min="10"
                max="100"
                value={power}
                onChange={(e) => onPowerChange(Number(e.target.value))}
                disabled={!isMyTurn || isFiring}
                className={`w-full accent-amber-400 h-2 sm:h-2.5 bg-slate-900 rounded-lg appearance-none cursor-pointer border transition-all ${
                  isHoldingFire ? 'border-yellow-300 shadow-[0_0_10px_#f59e0b]' : 'border-amber-600/70'
                }`}
              />
              {lastShotPower !== null && (
                <div className="absolute -top-1.5 pointer-events-none" style={{ left: `calc(${lastShotPower}% - 1px)` }}>
                  <div className="h-5 w-0.5 bg-cyan-300 shadow-[0_0_5px_#22d3ee]" />
                  <div className="absolute -top-4 -translate-x-1/2 whitespace-nowrap text-[7px] font-black text-[#d8cfb2]">
                    ÚLTIMO {lastShotPower}%
                  </div>
                </div>
              )}
            </div>
            {onMarkLastShot && (
              <button type="button" onClick={onMarkLastShot} disabled={!isMyTurn || lastShotPower === null || isFiring}
                className="shrink-0 rounded border border-[#8f7a4e]/60 bg-[#4b412b]/55 px-1.5 py-0.5 text-[8px] font-black text-[#d8cfb2] disabled:opacity-30"
                title="Marcar la fuerza usada en el último tiro">
                MARCAR
              </button>
            )}
          </div>   </div>

        {/* 4. FIRE BUTTON ZONE: Compact, prominent, with oscillating hold mechanic */}
        <div className="col-start-3 row-start-2 flex items-center justify-end gap-1 min-w-0">
          <button
            onPointerDown={handleFirePointerDown}
            onPointerUp={handleFirePointerUp}
            onPointerLeave={handleFirePointerLeave}
            disabled={!isMyTurn || isFiring}
            className={`w-[68px] h-[68px] sm:w-[76px] sm:h-[76px] rounded-full border-[4px] border-[#111] shadow-[inset_0_3px_4px_rgba(255,255,255,0.35),inset_0_-6px_8px_rgba(0,0,0,0.25),0_2px_5px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center transition-all select-none touch-none ${
              !isMyTurn || isFiring
                ? 'bg-gradient-to-b from-slate-600 to-slate-900 border-[#111] opacity-40 cursor-not-allowed'
                : isHoldingFire
                ? 'bg-[#9f7b3f] border-white scale-105 shadow-[0_0_18px_rgba(194,154,82,0.25)] cursor-pointer'
                : 'bg-gradient-to-b from-[#ff9b32] via-[#ff8124] to-[#f36a18] hover:brightness-110 active:scale-95 cursor-pointer'
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
