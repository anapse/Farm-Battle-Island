import React from 'react';

interface TurnTimerProps {
  seconds: number;
}

export const TurnTimer: React.FC<TurnTimerProps> = ({ seconds }) => {
  // Pure number: 45, 44, 43 ... 0
  const isUrgent = seconds <= 10;

  return (
    <div
      className={`mt-0.5 px-2 py-0.5 rounded text-xs sm:text-sm font-black font-mono leading-none transition-all ${
        isUrgent
          ? 'bg-red-600 text-white animate-pulse shadow-[0_0_8px_#ef4444]'
          : 'bg-slate-950 text-amber-300'
      }`}
    >
      {seconds}
    </div>
  );
};
