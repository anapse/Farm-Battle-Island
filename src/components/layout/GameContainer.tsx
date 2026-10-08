import React from 'react';

interface GameContainerProps {
  children: React.ReactNode;
}

export const GameContainer: React.FC<GameContainerProps> = ({ children }) => {
  return (
    <div className="w-screen h-screen overflow-hidden bg-slate-950 flex items-center justify-center relative select-none">
      
      {/* Neutral Ambient Backdrop for PC / Wide screens */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black pointer-events-none opacity-80" />

      {/* Decorative desktop edge guides */}
      <div className="hidden lg:flex absolute left-8 top-1/2 -translate-y-1/2 flex-col gap-2 text-slate-700 text-xs font-mono select-none pointer-events-none">
        <span className="text-amber-500/70 font-bold">FARM BATTLE ISLAND</span>
        <span>VERTICAL 9:16 COMPOSITION</span>
        <span>MOBILE-FIRST ARCHITECTURE</span>
      </div>

      <div className="hidden lg:flex absolute right-8 top-1/2 -translate-y-1/2 flex-col gap-2 text-slate-700 text-xs font-mono text-right select-none pointer-events-none">
        <span>TACTICAL ARTILLERY ENGINE</span>
        <span>HTML5 CANVAS WORLD</span>
        <span>ANAPSE VIDEO GAMES</span>
      </div>

      {/* 
        Game Viewport:
        Mobile: 100% width, 100% height.
        PC: 9:16 aspect ratio, 100% available height, exactly 9/16 width.
      */}
      <main className="relative h-full w-full max-w-[100vw] sm:max-h-screen sm:aspect-[9/16] sm:w-auto bg-slate-950 shadow-[0_0_50px_rgba(0,0,0,0.8)] sm:border-x-2 sm:border-slate-800/80 overflow-hidden flex flex-col">
        {children}
      </main>

    </div>
  );
};
