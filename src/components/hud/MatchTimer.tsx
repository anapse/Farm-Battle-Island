import React from 'react';

interface MatchTimerProps {
  secondsRemaining: number; // -1 for infinite, otherwise e.g. 600
}

export const MatchTimer: React.FC<MatchTimerProps> = ({ secondsRemaining }) => {
  // Exact rule: Show pure number like "600" or "∞". Do NOT show "600 s", "600 seg", or "5:00".
  const displayText = secondsRemaining < 0 ? '∞' : String(secondsRemaining);

  return (
    <div className="flex flex-col items-center justify-center">
      <span className="text-base sm:text-lg font-black font-mono text-amber-100 tracking-tight leading-none drop-shadow">
        {displayText}
      </span>
    </div>
  );
};
