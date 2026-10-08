import React, { useState } from 'react';
import { PowerUpType, WindState, POWER_UP_LIST } from '../../types/game';
import { 
  ChevronUp, 
  ChevronDown,
  Compass,
  Eye,
  Crosshair,
  Flame,
  Package,
  X
} from 'lucide-react';

interface BottomControlsProps {
  angle: number;
  minAngle: number;
  maxAngle: number;
  power: number;
  wind: WindState;
  isMyTurn: boolean;
  isFiring?: boolean;
  activePowerUp: PowerUpType | null;
  onAngleChange: (newAngle: number) => void;
  onPowerChange: (newPower: number) => void;
  onPowerUpSelect: (type: PowerUpType) => void;
  onFire: (overridePower?: number) => void;
  onCameraFocus: (mode: 'player1' | 'player2' | 'center') => void;
  onMove?: (delta: number) => void;
}

export const BottomControls: React.FC<BottomControlsProps> = ({
  angle,
  minAngle,
  maxAngle,
  power,
  wind,
  isMyTurn,
  isFiring = false,
  activePowerUp,
  onAngleChange,
  onPowerChange,
  onPowerUpSelect,
  onFire,
  onCameraFocus,
  onMove
}) => {
  const [showPowerUpDrawer, setShowPowerUpDrawer] = useState(false);
  const [isHoldingFire, setIsHoldingFire] = useState(false);

  // Oscillation state references
  const animFrameRef = React.useRef<number | null>(null);
  const holdStartTimeRef = React.useRef<number>(0);
  const currentOscillatingPowerRef = React.useRef<number>(power);

  const handleAngleStep = (delta: number) => {
    const next = Math.max(minAngle, Math.min(maxAngle, angle + delta));
    onAngleChange(next);
  };

  const activeItem = POWER_UP_LIST.find(p => p.id === activePowerUp);
  const quickPowerUps = POWER_UP_LIST.slice(0, 4);

  // Stop oscillation helper
  const stopOscillation = () => {
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    setIsHoldingFire(false);
  };

  // Clean up animation frame on unmount
  React.useEffect(() => {
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

    holdStartTimeRef.current = performance.now();
    setIsHoldingFire(true);
    currentOscillatingPowerRef.current = power;

    const startVal = power;
    const startTime = performance.now();

    const loop = (time: number) => {
      const elapsed = (time - startTime) / 1000; // seconds
      // Continuous sine wave oscillating smoothly between 15% and 100% (2.2 radians/sec)
      const wave = (Math.sin(elapsed * 4.8) + 1) / 2; // 0 to 1
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

    // Execute shot with captured oscillating power
    onFire(capturedPower);
  };

  const handleFirePointerLeave = (e: React.PointerEvent) => {
    if (isHoldingFire) {
      handleFirePointerUp(e);
    }
  };

  return (
    <footer className="absolute bottom-0 left-0 right-0 z-30 select-none bg-gradient-to-t from-amber-950 via-amber-900/95 to-amber-950/90 border-t-4 border-amber-600 shadow-[0_-4px_16px_rgba(0,0,0,0.6)] px-2 sm:px-3 py-1.5 text-slate-100 flex flex-col justify-between h-[20vh] min-h-[145px] max-h-[185px]">
      
      {/* Top Strip: Quick Camera Navigation Bar & Vehicle Movement */}
      <div className="flex items-center justify-between text-[10px] font-bold text-amber-200/80 pb-1 mb-0.5 border-b border-amber-800/60">
        <div className="flex items-center gap-1">
          {onMove && (
            <div className="flex items-center gap-0.5 mr-1.5">
              <button
                onClick={() => onMove(-14)}
                disabled={!isMyTurn}
                className="px-2 py-0.5 rounded bg-emerald-800/90 hover:bg-emerald-700 text-emerald-100 border border-emerald-500 disabled:opacity-40 transition active:scale-95 text-[11px] font-black"
                title="Mover vehículo hacia la izquierda"
              >
                ◀
              </button>
              <span className="text-[9px] uppercase px-1 text-emerald-300 font-black tracking-wider">MOVER</span>
              <button
                onClick={() => onMove(14)}
                disabled={!isMyTurn}
                className="px-2 py-0.5 rounded bg-emerald-800/90 hover:bg-emerald-700 text-emerald-100 border border-emerald-500 disabled:opacity-40 transition active:scale-95 text-[11px] font-black"
                title="Mover vehículo hacia la derecha"
              >
                ▶
              </button>
            </div>
          )}
          <Eye className="w-3 h-3 text-amber-400" />
          <span className="uppercase tracking-wider">Cámara:</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onCameraFocus('player1')}
            className="px-2 py-0.5 rounded bg-amber-800/80 hover:bg-amber-700 text-amber-100 border border-amber-600 transition text-[10px] font-bold"
          >
            Mi Isla
          </button>
          <button
            onClick={() => onCameraFocus('center')}
            className="px-2 py-0.5 rounded bg-amber-800/80 hover:bg-amber-700 text-amber-100 border border-amber-600 transition text-[10px] font-bold"
          >
            Centro
          </button>
          <button
            onClick={() => onCameraFocus('player2')}
            className="px-2 py-0.5 rounded bg-amber-800/80 hover:bg-amber-700 text-amber-100 border border-amber-600 transition text-[10px] font-bold"
          >
            Rival
          </button>
        </div>
      </div>

      {/* Main Controls Grid */}
      <div className="flex items-center justify-between gap-1.5 sm:gap-2 flex-1">
        
        {/* Left Section: POWER UP Slots Grid */}
        <div className="flex flex-col shrink-0">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[9px] font-black uppercase tracking-wider text-amber-300">
              POWER UP
            </span>
            <button
              onClick={() => setShowPowerUpDrawer(true)}
              disabled={!isMyTurn}
              className="text-[9px] text-amber-400 underline font-bold hover:text-white px-1 disabled:opacity-40"
              title="Abrir arsenal completo de Power-ups"
            >
              Ver +
            </button>
          </div>

          <div className="flex items-center gap-1 bg-black/40 p-1 rounded-md border border-amber-700/60 shadow-inner">
            {quickPowerUps.map((pu) => {
              const isSelected = activePowerUp === pu.id;
              return (
                <button
                  key={pu.id}
                  onClick={() => onPowerUpSelect(pu.id)}
                  disabled={!isMyTurn}
                  title={`${pu.name}: ${pu.description}`}
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded flex items-center justify-center transition-all relative ${
                    isSelected 
                      ? 'bg-amber-500 scale-105 shadow-[0_0_8px_#f59e0b] border-2 border-white' 
                      : 'bg-slate-800 hover:bg-slate-700 border border-slate-600'
                  } ${!isMyTurn ? 'opacity-40 cursor-not-allowed' : 'active:scale-95'}`}
                >
                  <span className="text-sm select-none">{pu.symbol}</span>
                </button>
              );
            })}
            <button
              onClick={() => setShowPowerUpDrawer(true)}
              disabled={!isMyTurn}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded flex items-center justify-center bg-amber-900/60 hover:bg-amber-800 border border-amber-600/80 text-amber-200 active:scale-95 transition"
              title="Ver arsenal completo"
            >
              <Package className="w-4 h-4" />
            </button>
          </div>
          {activeItem && (
            <div className="text-[9px] text-amber-300 font-bold truncate max-w-[140px] mt-0.5 flex items-center gap-1">
              <span>{activeItem.symbol}</span>
              <span className="truncate">{activeItem.name}</span>
            </div>
          )}
        </div>

        {/* Center Section: VIENTO / ANGULO Dial */}
        <div className="flex flex-col items-center justify-center shrink-0">
          <span className="text-[9px] font-black uppercase tracking-wider text-amber-300 mb-0.5">
            VIENTO & ÁNGULO
          </span>
          <div className="flex items-center gap-1.5 bg-black/40 px-2 py-1 rounded-md border border-amber-700/60">
            {/* Wind Vector Compass */}
            <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-slate-900 border-2 border-amber-500 flex items-center justify-center shadow-inner">
              {/* Arrow indicating angle */}
              <div
                className="absolute w-1 h-5 bg-emerald-400 rounded-full origin-bottom transition-transform duration-150 shadow-[0_0_4px_#34d399]"
                style={{
                  transform: `rotate(${angle - 90}deg)`,
                  bottom: '50%'
                }}
              />
              <div className="w-2 h-2 rounded-full bg-amber-300 z-10" />
            </div>

            {/* Readout & Steppers */}
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1">
                <span className="text-sm sm:text-base font-black font-mono text-emerald-300">
                  {angle}°
                </span>
                <div className="flex flex-col">
                  <button
                    onClick={() => handleAngleStep(1)}
                    disabled={!isMyTurn}
                    className="p-0.5 text-amber-300 hover:text-white active:scale-125 disabled:opacity-40"
                    title="Aumentar ángulo"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleAngleStep(-1)}
                    disabled={!isMyTurn}
                    className="p-0.5 text-amber-300 hover:text-white active:scale-125 disabled:opacity-40"
                    title="Disminuir ángulo"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <span className="text-[9px] font-mono text-cyan-300 font-bold tracking-tight">
                {wind.speed} km/h {wind.direction > 0 ? '➡' : '⬅'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Section: DISPARAR Big Button with Oscillating Hold Mechanic */}
        <div className="flex flex-col items-center shrink-0">
          <button
            onPointerDown={handleFirePointerDown}
            onPointerUp={handleFirePointerUp}
            onPointerLeave={handleFirePointerLeave}
            disabled={!isMyTurn || isFiring}
            className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full border-4 shadow-[0_0_16px_rgba(239,68,68,0.8)] flex flex-col items-center justify-center transition-all select-none touch-none ${
              !isMyTurn || isFiring
                ? 'bg-slate-700 border-slate-500 opacity-40 cursor-not-allowed'
                : isHoldingFire
                ? 'bg-gradient-to-tr from-yellow-500 via-amber-400 to-red-500 border-white scale-110 shadow-[0_0_24px_#f59e0b] cursor-pointer'
                : 'bg-gradient-to-tr from-red-700 via-red-600 to-amber-500 hover:brightness-110 active:scale-95 border-amber-300 cursor-pointer animate-pulse'
            }`}
            title={
              !isMyTurn 
                ? 'Esperando turno' 
                : isFiring 
                ? 'Disparo en curso...' 
                : 'Mantén presionado para oscilar fuerza, suelta para disparar'
            }
          >
            <Flame className={`w-5 h-5 sm:w-6 sm:h-6 text-amber-100 fill-amber-200 transition-transform ${isHoldingFire ? 'scale-125 animate-bounce' : ''}`} />
            <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-tight text-white drop-shadow">
              {isHoldingFire ? '¡SUELTA!' : isFiring ? 'EN VUELO' : 'DISPARAR'}
            </span>
          </button>
        </div>

      </div>

      {/* Bottom Strip: FUERZA Bar (Oscillates automatically when holding FIRE) */}
      <div className="flex items-center gap-2 mt-1 pt-1 border-t border-amber-800/60">
        <span className="text-[9px] font-black uppercase text-amber-300 shrink-0">
          {isHoldingFire ? 'CARGANDO:' : 'FUERZA:'}
        </span>
        <div className="flex-1 relative flex items-center">
          <input
            type="range"
            min="10"
            max="100"
            value={power}
            onChange={(e) => onPowerChange(Number(e.target.value))}
            disabled={!isMyTurn || isFiring}
            className={`w-full accent-amber-400 h-2.5 bg-slate-900 rounded-lg appearance-none cursor-pointer border transition-all ${
              isHoldingFire 
                ? 'border-yellow-300 shadow-[0_0_10px_#f59e0b]' 
                : 'border-amber-600'
            }`}
          />
        </div>
        <span className={`font-mono text-xs font-black shrink-0 min-w-[36px] text-right transition-colors ${
          isHoldingFire ? 'text-yellow-300 scale-110 animate-pulse' : 'text-amber-200'
        }`}>
          {power}%
        </span>
      </div>

      {/* Full Tactical Arsenal Modal Drawer */}
      {showPowerUpDrawer && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 animate-in fade-in duration-200">
          <div className="bg-gradient-to-b from-amber-950 to-slate-950 border-2 border-amber-500 rounded-xl p-3 w-full max-w-sm max-h-[85vh] overflow-y-auto text-slate-100 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-amber-800 mb-2">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-400" />
                <h3 className="font-black text-amber-300 uppercase tracking-wider text-sm">
                  ARSENAL DE POWER-UPS
                </h3>
              </div>
              <button
                onClick={() => setShowPowerUpDrawer(false)}
                className="p-1 rounded-full bg-slate-800 text-slate-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[11px] text-slate-300 mb-2">
              Selecciona una mejora táctica para tu siguiente turno o disparo:
            </p>

            <div className="space-y-1.5 flex-1 overflow-y-auto pr-1">
              {POWER_UP_LIST.map((item) => {
                const isSelected = activePowerUp === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onPowerUpSelect(item.id);
                      setShowPowerUpDrawer(false);
                    }}
                    className={`w-full flex items-center gap-2 p-2 rounded-lg text-left transition border ${
                      isSelected 
                        ? 'bg-amber-600/40 border-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.4)]'
                        : 'bg-slate-900/80 hover:bg-slate-800 border-slate-700'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-md bg-slate-800 flex items-center justify-center text-lg shrink-0 border border-slate-600">
                      {item.symbol}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-amber-200 truncate">
                          {item.name}
                        </span>
                        <span className={`text-[9px] uppercase px-1.5 py-0.2 rounded font-mono ${
                          item.rarity === 'epic' ? 'bg-rose-900 text-rose-300' :
                          item.rarity === 'rare' ? 'bg-amber-900 text-amber-300' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {item.rarity}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-300 leading-tight mt-0.5">
                        {item.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setShowPowerUpDrawer(false)}
              className="mt-3 w-full py-1.5 rounded-lg bg-amber-700 hover:bg-amber-600 text-white font-bold text-xs uppercase"
            >
              Cerrar Arsenal
            </button>
          </div>
        </div>
      )}

    </footer>
  );
};

