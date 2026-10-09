import React from 'react';
import { getAssetUrl } from '../../utils/assets';

interface GameContainerProps {
  children: React.ReactNode;
  isBattle?: boolean;
}

export const GameContainer: React.FC<GameContainerProps> = ({ children, isBattle = false }) => {
  return (
    <div className="w-screen h-screen overflow-hidden bg-slate-950 flex items-center justify-center relative select-none bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url("${getAssetUrl('assets/sprites/fondo juego 1.png')}")` }}>

      {/* Neutral ambient backdrop outside the 9:16 game viewport on desktop. */}
      {!isBattle && (
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900/55 via-slate-950/75 to-black/85 pointer-events-none opacity-90" />
      )}

      {/*
        Game viewport:
        - Mobile/tablet portrait: use the full available viewport.
        - Desktop/wide screens: keep the game at exactly 9:16 and use the
          maximum possible height without overflowing horizontally.
        The same rule applies to battle and menu screens so the Canvas and
        fixed React HUD always share the same coordinate space.
      */}
      <main
        className="
          relative overflow-hidden flex flex-col select-none
          w-full h-full bg-slate-950
          md:w-[min(100vw,calc(100dvh*9/16))]
          md:h-[min(100dvh,calc(100vw*16/9))]
          md:shadow-[0_0_0_1px_rgba(148,163,184,0.28),0_10px_35px_rgba(0,0,0,0.55)]
          border border-slate-500/50
          rounded-md
        "
      >
        {children}
      </main>

    </div>
  );
};
