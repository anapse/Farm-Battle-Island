import React from 'react';

interface GameContainerProps {
  children: React.ReactNode;
  isBattle?: boolean;
}

export const GameContainer: React.FC<GameContainerProps> = ({ children, isBattle = false }) => {
  return (
    <div className="w-screen h-screen overflow-hidden bg-slate-950 flex items-center justify-center relative select-none">
      
      {/* Neutral Ambient Backdrop for PC / Wide screens */}
      {!isBattle && (
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black pointer-events-none opacity-90" />
      )}

      {/* 
        Game Viewport:
        If battle: Full viewport width and height with zero overflow.
        If menus: Height 100dvh, Width 100dvh * 9/16, centered on PC.
      */}
      <main className={`relative h-[100dvh] overflow-hidden flex flex-col select-none ${
        isBattle 
          ? 'w-full bg-slate-950' 
          : 'w-[calc(100dvh*9/16)] max-w-full mx-auto bg-slate-950 shadow-[0_0_60px_rgba(0,0,0,0.95)]'
      }`}>
        {children}
      </main>

    </div>
  );
};
