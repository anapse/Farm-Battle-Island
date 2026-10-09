import React from 'react';
import { HealthBar } from './HealthBar';
import { MatchTimer } from './MatchTimer';
import { TurnTimer } from './TurnTimer';
import { PlayerState } from '../../types/game';
import { Flag } from 'lucide-react';

interface GameHUDProps {
  player1: PlayerState;
  player2: PlayerState | null;
  currentTurn: 'player1' | 'player2';
  turnTimer: number;
  matchTimer: number;
  onSurrenderClick: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  player1,
  player2,
  currentTurn,
  turnTimer,
  matchTimer,
  onSurrenderClick
}) => {
  return (
    <header className="absolute top-0 left-0 right-0 z-30 pointer-events-none select-none p-1.5 sm:p-2 pt-[max(0.35rem,env(safe-area-inset-top))]">
      
      {/* 3-Column Top HUD: ~33% HealthBar P1, Center Timers, ~33% HealthBar P2 */}
      <div className="flex items-start justify-between gap-1 sm:gap-2 max-w-full">
        
        {/* Player 1 Health Bar (~33% width) */}
        <div className="pointer-events-auto">
          <HealthBar
            playerName={player1.name}
            hp={player1.hp}
            maxHp={player1.maxHp}
            lives={player1.lives}
            maxLives={player1.maxLives}
            isCurrentTurn={currentTurn === 'player1'}
            align="left"
            hasShield={player1.activePowerUp === 'shield'}
          />
        </div>

        {/* Center Frame: Match Timer (e.g. 600 / ∞) + Turn Timer (45 -> 0) */}
        <div className="flex flex-col items-center justify-center shrink-0 mx-1 pointer-events-auto">
          <div className="bg-gradient-to-b from-amber-600 via-amber-700 to-amber-900 border border-amber-300 rounded-lg px-2 sm:px-2.5 py-0.5 shadow-lg flex flex-col items-center min-w-[66px] sm:min-w-[80px]">
            {/* Match Timer: purely numeric (600 / ∞) */}
            <MatchTimer secondsRemaining={matchTimer} />
            
            {/* Turn Timer: 45 counting down */}
            <TurnTimer seconds={turnTimer} />
          </div>

          <span className="text-[8px] font-black uppercase tracking-wide text-amber-100 mt-0.5 bg-black/70 px-1 py-0 rounded border border-amber-500/30">
            {currentTurn === 'player1' ? '◀ TURNO P1' : 'TURNO P2 ▶'}
          </span>
        </div>

        {/* Player 2 Health Bar (~33% width) */}
        <div className="pointer-events-auto">
          <HealthBar
            playerName={player2 ? player2.name : 'ESPERANDO...'}
            hp={player2 ? player2.hp : 100}
            maxHp={player2 ? player2.maxHp : 100}
            lives={player2 ? player2.lives : 3}
            maxLives={player2 ? player2.maxLives : 3}
            isCurrentTurn={currentTurn === 'player2'}
            align="right"
            hasShield={player2?.activePowerUp === 'shield'}
          />
        </div>

      </div>

      {/* Discrete Surrender Button */}
      <div className="flex justify-end mt-1 pointer-events-auto">
        <button
          onClick={onSurrenderClick}
          className="bg-red-950/95 hover:bg-red-900 text-white border border-red-500 text-[9px] font-black px-2 py-1 rounded-md transition flex items-center gap-1 shadow"
          title="Salir de la partida (se computa derrota)"
        >
          <Flag className="w-3 h-3 text-red-400" />
          SALIR
        </button>
      </div>

    </header>
  );
};
