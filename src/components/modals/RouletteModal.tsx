import React, { useState, useEffect } from 'react';
import { PowerUpType, POWER_UP_LIST, PowerUpItem } from '../../types/game';
import { Gift, Sparkles, CheckCircle2 } from 'lucide-react';

interface RouletteModalProps {
  awardedPowerUp: PowerUpType;
  onComplete: () => void;
}

export const RouletteModal: React.FC<RouletteModalProps> = ({
  awardedPowerUp,
  onComplete
}) => {
  const [displayIndex, setDisplayIndex] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  // Pre-determined winning item
  const finalItem: PowerUpItem = POWER_UP_LIST.find(p => p.id === awardedPowerUp) || POWER_UP_LIST[0];

  useEffect(() => {
    let speed = 60; // ms per tick
    let elapsed = 0;
    const duration = 1300; // 1.3 seconds animation
    let timeoutId: NodeJS.Timeout;

    const tick = () => {
      elapsed += speed;
      setDisplayIndex((prev) => (prev + 1) % POWER_UP_LIST.length);

      // Gradually decelerate towards the end
      if (elapsed > duration * 0.7) {
        speed += 30;
      } else if (elapsed > duration * 0.4) {
        speed += 12;
      }

      if (elapsed < duration) {
        timeoutId = setTimeout(tick, speed);
      } else {
        // Lock strictly on the pre-determined result
        const targetIdx = POWER_UP_LIST.findIndex(p => p.id === awardedPowerUp);
        setDisplayIndex(targetIdx >= 0 ? targetIdx : 0);
        setIsFinished(true);

        // Auto close after showing result for 1.2 seconds
        setTimeout(() => {
          onComplete();
        }, 1200);
      }
    };

    timeoutId = setTimeout(tick, speed);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [awardedPowerUp, onComplete]);

  const currentItem = isFinished ? finalItem : POWER_UP_LIST[displayIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none pointer-events-auto">
      <div className={`w-full max-w-xs rounded-3xl p-5 text-center shadow-2xl border-4 transition-all duration-300 ${
        isFinished 
          ? 'bg-gradient-to-b from-amber-950 via-slate-900 to-slate-950 border-amber-400 scale-105 shadow-[0_0_32px_rgba(245,158,11,0.6)]' 
          : 'bg-gradient-to-b from-slate-900 to-slate-950 border-amber-600'
      }`}>
        
        {/* Header Icon */}
        <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center mx-auto mb-2">
          {isFinished ? (
            <Sparkles className="w-7 h-7 text-amber-300 animate-spin" />
          ) : (
            <Gift className="w-7 h-7 text-amber-400 animate-bounce" />
          )}
        </div>

        <span className="text-[10px] font-black tracking-widest text-amber-400 uppercase">
          {isFinished ? '¡SUMINISTRO OBTENIDO!' : 'RULETA DE CAJA TÁCTICA'}
        </span>
        <h2 className="text-xl font-black text-white font-['Fredoka',sans-serif] mt-0.5">
          {isFinished ? '¡MEJORA DESBLOQUEADA!' : 'SORTEANDO POWER-UP...'}
        </h2>

        {/* Roulette Spinning Window */}
        <div className="relative my-4 p-4 rounded-2xl bg-slate-950/90 border-2 border-slate-700 overflow-hidden flex flex-col items-center justify-center min-h-[120px]">
          {/* Badge & Symbol */}
          <div 
            className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-lg border-2 mb-2 transition-transform duration-150 ${
              isFinished ? 'scale-110 border-amber-300 animate-pulse' : 'scale-95 border-slate-600'
            }`}
            style={{ backgroundColor: currentItem.color + '33' }}
          >
            <span>{currentItem.symbol}</span>
          </div>

          <h3 className="text-base font-black text-white uppercase tracking-wider">
            {currentItem.name}
          </h3>
          <p className="text-[11px] text-amber-200 mt-0.5 line-clamp-2 px-1">
            {currentItem.description}
          </p>
        </div>

        {isFinished ? (
          <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-400 font-black animate-pulse">
            <CheckCircle2 className="w-4 h-4" />
            <span>EQUIPADO AUTOMÁTICAMENTE</span>
          </div>
        ) : (
          <div className="text-[10px] font-mono text-slate-400">
            Girando ruleta de suministros...
          </div>
        )}

      </div>
    </div>
  );
};
