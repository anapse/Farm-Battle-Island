import React from 'react';

interface GameContainerProps {
  children: React.ReactNode;
}

export const GameContainer: React.FC<GameContainerProps> = ({ children }) => {
  return (
    <div className="w-screen h-screen overflow-hidden bg-slate-950 flex items-center justify-center relative select-none">
      
      {/* Neutral Ambient Backdrop for PC / Wide screens */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black pointer-events-none opacity-90" />

      {/* 
        Game Viewport:
        Height: Total viewport height (100dvh).
        Width: Exact viewport height * (9 / 16) on PC/desktop, capped by screen width on mobile (max-w-full).
        Completely overflow-hidden (zero horizontal or vertical scrollbars).
      */}
      <main className="relative h-[100dvh] w-[calc(100dvh*9/16)] max-w-full mx-auto bg-slate-950 shadow-[0_0_60px_rgba(0,0,0,0.95)] overflow-hidden flex flex-col select-none">
        {children}
      </main>

    </div>
  );
};
