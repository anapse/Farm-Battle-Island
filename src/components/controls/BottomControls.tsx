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
    <footer className="absolute bottom-0 left-0 right-0 z-30 h-[clamp(164px,24dvh,218px)] pb-[env(safe-area-inset-bottom)] select-none box-border overflow-hidden bg-[radial-gradient(ellipse_at_top,rgba(203,135,66,0.17),transparent_58%),repeating-linear-gradient(115deg,rgba(255,255,255,0.018)_0px,rgba(255,255,255,0.018)_2px,transparent_2px,transparent_7px),linear-gradient(180deg,#343936_0%,#252a27_18%,#171b19_55%,#0d100f_100%)] border-t-2 border-[#bd8748] shadow-[0_-8px_24px_rgba(0,0,0,0.72),inset_0_1px_0_rgba(255,224,170,0.32)] px-3 sm:px-4 py-2 text-slate-100">
      
      {/* Tornillos decorativos y textura de metal envejecido; no interceptan los controles */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-2 top-1 flex justify-between opacity-80">
        <span className="h-2.5 w-2.5 rounded-full border border-[#f1c477] bg-[radial-gradient(circle_at_30%_25%,#fff0b2_0%,#8b5527_35%,#171b19_72%)] shadow-[0_1px_3px_#000]" />
        <span className="h-2.5 w-2.5 rounded-full border border-[#f1c477] bg-[radial-gradient(circle_at_30%_25%,#fff0b2_0%,#8b5527_35%,#171b19_72%)] shadow-[0_1px_3px_#000]" />
      </div>
      {/* Responsive unified HUD container - strictly contained inside viewport */}
      <div className="relative z-10 w-full h-full min-h-0 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] grid-rows-[auto_minmax(0,1fr)_auto] items-center gap-x-2 gap-y-1 px-0.5 sm:px-2">
        
        {/* 1. POWER-UP ZONE: Compact slots that start strictly EMPTY (VACÍOS) */}
        <div className="col-span-3 row-start-1 flex flex-col justify-center min-w-0 w-full">
          <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-[#f5c77d] mb-1 font-['Fredoka',sans-serif] drop-shadow-[0_1px_2px_#000]">
            POWER-UP
          </span>
          <div className="flex items-center justify-center gap-1 sm:gap-1.5 bg-[linear-gradient(180deg,#080c0a,#19221c_48%,#090c0a)] p-1.5 rounded-lg border border-[#9d7946] shadow-[inset_0_2px_8px_rgba(0,0,0,0.95),0_1px_0_rgba(255,207,115,0.2),0_2px_5px_rgba(0,0,0,0.35)]">
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
                  className={`flex-1 min-w-0 max-w-14 h-8 sm:h-9 rounded-md flex items-center justify-center transition relative border-2 ${
                    isSelected
                      ? 'border-[#ffe27a] ring-1 ring-amber-300 bg-gradient-to-b from-[#49d968] to-[#12642b] shadow-[0_0_10px_#f59e0b,inset_0_0_8px_rgba(255,255,190,0.22)]'
                      : hasItem
                      ? 'border-[#427b36] bg-gradient-to-b from-[#36b95c] via-[#17783a] to-[#092d19] hover:brightness-125 shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_0_5px_rgba(63,255,93,0.18)]'
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
        {/* 2. WIND COMPASS + AIM ANGLE */}
        <div className="col-start-2 row-start-2 flex flex-col items-center justify-center gap-1 min-w-0">
          <div className="flex flex-col items-center gap-0.5">
            <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-full border-[3px] border-[#171b1b] bg-[radial-gradient(circle_at_30%_22%,#8ceaff_0%,#168bd0_38%,#07518c_72%,#061c2c_100%)] shadow-[inset_0_2px_3px_rgba(255,255,255,0.55),inset_0_-4px_6px_rgba(0,0,0,0.4),0_0_0_2px_#a66b32,0_3px_6px_rgba(0,0,0,0.75)] flex items-center justify-center" title={`Brújula del viento: ${wind.speed} km/h`}>
              <span className="text-xl sm:text-2xl font-black text-red-600 drop-shadow" style={{ transform: wind.direction > 0 ? 'rotate(0deg)' : 'rotate(180deg)' }}>➜</span>
            </div>
            <span className="text-[8px] sm:text-[9px] font-black text-[#c4d7e8] whitespace-nowrap">{wind.speed} km/h</span>
          </div>
          <div className="min-w-[78px] sm:min-w-[94px] px-2 py-1 bg-[linear-gradient(180deg,#43e77a_0%,#148544_48%,#075329_100%)] border-[3px] border-[#171c18] shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_0_0_1px_#b87936,0_2px_5px_rgba(0,0,0,0.7)] text-center">
            <span className="text-lg sm:text-xl font-black text-black">{angle}°</span>
          </div>
        </div>

        {/* 3. FUERZA ZONE: Flexible Bar */}
        <div className="col-span-3 row-start-3 min-w-0 w-full flex flex-col justify-center px-1 pb-0.5">
          <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-black uppercase text-[#e4c28a] mb-1 font-['Fredoka',sans-serif]">
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
                className={`w-full accent-amber-400 h-2.5 sm:h-3 bg-slate-950 rounded-lg appearance-none cursor-pointer border transition-all ${
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
                className="shrink-0 rounded border border-[#d09a4b] bg-[linear-gradient(180deg,#5b5142,#292722_55%,#171916)] px-1.5 py-0.5 text-[8px] font-black text-[#f1d5a0] shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_2px_3px_rgba(0,0,0,0.6)] hover:brightness-125 disabled:opacity-30"
                title="Marcar la fuerza usada en el último tiro">
                MARCAR
              </button>
            )}
          </div>   </div>

        {/* 4. FIRE BUTTON ZONE */}
        <div className="col-start-3 row-start-2 flex items-center justify-end min-w-0">
          <button
            onPointerDown={handleFirePointerDown}
            onPointerUp={handleFirePointerUp}
            onPointerLeave={handleFirePointerLeave}
            disabled={!isMyTurn || isFiring}
            className={`w-[64px] h-[64px] sm:w-[76px] sm:h-[76px] rounded-full border-[3px] border-black shadow-[inset_0_3px_4px_rgba(255,255,255,0.35),inset_0_-6px_8px_rgba(0,0,0,0.25),0_2px_5px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center transition-all select-none touch-none ${
              !isMyTurn || isFiring
                ? 'bg-gradient-to-b from-slate-600 to-slate-900 opacity-40 cursor-not-allowed'
                : isHoldingFire
                ? 'bg-[#9f7b3f] border-white scale-105 shadow-[0_0_18px_rgba(194,154,82,0.25)] cursor-pointer'
                : 'bg-[radial-gradient(circle_at_32%_20%,#ffd47b_0%,#ff9a28_24%,#e6530d_68%,#782608_100%)] border-[#21160f] ring-2 ring-[#c18a4c] shadow-[0_0_0_4px_rgba(0,0,0,0.35),0_4px_8px_rgba(0,0,0,0.55)] hover:brightness-110 active:scale-95 cursor-pointer'
            }`}
            title={!isMyTurn ? 'Esperando turno' : isFiring ? 'Disparo en curso...' : 'Mantén presionado para cargar fuerza, suelta para disparar'}
          >
            <Flame className={`w-5 h-5 text-amber-100 fill-amber-200 ${isHoldingFire ? 'scale-115 animate-bounce' : ''}`} />
            <span className="text-[9px] font-black uppercase tracking-tight text-white drop-shadow font-['Fredoka',sans-serif] leading-tight">
              {isHoldingFire ? '¡SUELTA!' : isFiring ? 'EN VUELO' : 'FIRE'}
            </span>
          </button>
        </div>
      </div>

    </footer>
  );
};
