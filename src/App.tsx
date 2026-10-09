import React, { useState, useEffect, useRef } from 'react';
import { GameContainer } from './components/layout/GameContainer';
import { TopHUD } from './components/hud/TopHUD';
import { BottomControls, OfficialPowerUpId } from './components/controls/BottomControls';
import { MainMenu } from './components/modals/MainMenu';
import { CreateRoomModal } from './components/modals/CreateRoomModal';
import { JoinRoomModal } from './components/modals/JoinRoomModal';
import { WaitingOpponentModal } from './components/modals/WaitingOpponentModal';
import { CharacterSelectModal } from './components/modals/CharacterSelectModal';
import { RankingModal } from './components/modals/RankingModal';
import { MatchResultModal } from './components/modals/MatchResultModal';
import { LeaveConfirmModal } from './components/modals/LeaveConfirmModal';
import { ContactModal } from './components/modals/ContactModal';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { GameCanvasEngine } from './game/canvasEngine';
import { spriteManager } from './game/spriteManager';
import { 
  GameRoom, 
  GameScreen, 
  CharacterId, 
  PowerUpType, 
  GameTimeOption, 
  GameLivesOption,
  OnlineMatch,
  OnlinePlayer,
  POWER_UP_LIST
} from './types/game';
import { 
  getPlayerIdentity,
  createOnlineMatch, 
  joinOnlineMatch, 
  selectCharacterOnline, 
  subscribeToOnlineMatch,
  sendShotOnline,
  registerImpactOnline,
  changeTurnOnline,
  concludeMatchOnline,
  surrenderMatchOnline,
  sendPresenceHeartbeat
} from './services/onlineMatchService';
import { getCharacterById } from './config/characters';

export default function App() {
  const [screen, setScreen] = useState<GameScreen>(() => {
    if (typeof window !== 'undefined' && window.location.pathname === '/admin') {
      return 'admin';
    }
    return 'menu';
  });

  const [playerName, setPlayerName] = useState<string>(() => {
    const savedName = localStorage.getItem('fbi_stored_player_name') || '';
    if (savedName.trim().toLowerCase() === 'comandante') {
      localStorage.removeItem('fbi_stored_player_name');
      return '';
    }
    return savedName;
  });

  const [myPlayerId] = useState<string>(() => {
    return getPlayerIdentity(playerName).playerId;
  });

  // Current active online match
  const [onlineMatch, setOnlineMatch] = useState<OnlineMatch | null>(null);
  const [pendingAiSettings, setPendingAiSettings] = useState(false);
  const [aiDifficulty, setAiDifficulty] = useState<'easy' | 'medium' | 'hard' | 'very_hard'>('medium');
  const [playerRole, setPlayerRole] = useState<'player1' | 'player2'>('player1');

  // Pending room settings during creation flow
  const [pendingCreation, setPendingCreation] = useState<{
    timeLimitSeconds: 300 | null;
    lives: GameLivesOption;
    islandId: string;
  } | null>(null);

  // Modals visibility
  const [showRanking, setShowRanking] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  // Background music: try autoplay on startup and resume on first user interaction if blocked.
  const backgroundMusicRef = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    const audio = new Audio(`${import.meta.env.BASE_URL}assets/sonido/fondosonido.mp3`);
    audio.loop = true;
    audio.volume = 0.28;
    backgroundMusicRef.current = audio;

    const tryPlay = () => {
      void audio.play().catch(() => {
        // Browsers may block autoplay until the player interacts with the page.
      });
    };

    tryPlay();
    const resumeOnInteraction = () => {
      tryPlay();
      if (!audio.paused) {
        window.removeEventListener('pointerdown', resumeOnInteraction);
        window.removeEventListener('keydown', resumeOnInteraction);
        window.removeEventListener('touchstart', resumeOnInteraction);
      }
    };

    window.addEventListener('pointerdown', resumeOnInteraction);
    window.addEventListener('keydown', resumeOnInteraction);
    window.addEventListener('touchstart', resumeOnInteraction, { passive: true });

    return () => {
      window.removeEventListener('pointerdown', resumeOnInteraction);
      window.removeEventListener('keydown', resumeOnInteraction);
      window.removeEventListener('touchstart', resumeOnInteraction);
      audio.pause();
      audio.src = '';
      backgroundMusicRef.current = null;
    };
  }, []);

  // Initialize official sprites on app startup
  useEffect(() => {
    spriteManager.loadAll().catch((err) => {
      console.warn('Official sprites initialization check:', err);
    });
  }, []);
  const [matchResult, setMatchResult] = useState<{
    isVictory: boolean;
    earnedPoints: number;
    winnerName: string;
    loserName: string;
    isSurrender?: boolean;
    surrenderMessage?: string;
    winnerCharacterId?: CharacterId | null;
  } | null>(null);

  // In-battle controls state
  const [angle, setAngle] = useState(35);
  const [power, setPower] = useState(62);
  const [lastShotPower, setLastShotPower] = useState<number | null>(null);
  const [activePowerUp, setActivePowerUp] = useState<PowerUpType | null>(null);
  const [powerUpSlots, setPowerUpSlots] = useState<(OfficialPowerUpId | null)[]>([null, null, null, null]);
  const [activeSlotIndex, setActiveSlotIndex] = useState<number | null>(null);
  const [tacticalToast, setTacticalToast] = useState<{ id: number; text: string; type: 'info' | 'success' | 'warn' } | null>(null);

  // Timers calculated from timestamps
  const [turnTimerRemaining, setTurnTimerRemaining] = useState(25);
  const [matchTimerRemaining, setMatchTimerRemaining] = useState(300);

  // Canvas Reference & Engine
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<GameCanvasEngine | null>(null);

  // Ref to always have latest match data inside engine event listeners
  const onlineMatchRef = useRef<OnlineMatch | null>(onlineMatch);
  useEffect(() => {
    onlineMatchRef.current = onlineMatch;
  }, [onlineMatch]);

  // Ref to avoid duplicate shot executions
  const lastProcessedShotTimeRef = useRef<number>(0);
  const lastExpiredTurnRef = useRef<string>('');
  const lastExpiredMatchRef = useRef<string>('');

  const showTacticalToast = (text: string, type: 'info' | 'success' | 'warn' = 'info') => {
    const id = Date.now();
    setTacticalToast({ id, text, type });
    setTimeout(() => {
      setTacticalToast(curr => (curr?.id === id ? null : curr));
    }, 2800);
  };

  // Sync player name changes
  const handlePlayerNameChange = (name: string) => {
    setPlayerName(name);
    try {
      localStorage.setItem('fbi_stored_player_name', name);
    } catch (e) {
      console.warn(e);
    }
  };

  // Listen to browser popstate for /admin route
  useEffect(() => {
    const handlePopState = () => {
      if (window.location.pathname === '/admin') {
        setScreen('admin');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // 1. Subscribe to online match state updates
  useEffect(() => {
    if (!onlineMatch) return;

    const unsubscribe = subscribeToOnlineMatch(onlineMatch.matchId, (updated) => {
      if (!updated) return;

      setOnlineMatch(prev => {
        if (!prev || prev.matchId !== updated.matchId || updated.status === 'waiting') {
          return updated;
        }
        return {
          ...updated,
          player1: {
            ...updated.player1,
            hp: prev.player1.hp,
            lives: prev.player1.lives,
            score: prev.player1.score
          },
          player2: updated.player2 && prev.player2 ? {
            ...updated.player2,
            hp: prev.player2.hp,
            lives: prev.player2.lives,
            score: prev.player2.score
          } : updated.player2
        };
      });

      // Handle match start transition from waiting or char_select
      if (updated.status === 'playing' && (screen === 'waiting_opponent' || screen === 'char_select')) {
        setScreen('battle');
        showTacticalToast('¡Combate iniciado! En posición.', 'success');
      }

      // Handle remote shot reproduction
      if (
        screen === 'battle' && 
        updated.gameState.lastShot && 
        updated.gameState.lastShot.timestamp > lastProcessedShotTimeRef.current
      ) {
        const shot = updated.gameState.lastShot;
        lastProcessedShotTimeRef.current = shot.timestamp;

        // If the shot was fired by the opponent, reproduce on local canvas!
        if (shot.shooterRole !== playerRole && engineRef.current) {
          engineRef.current.updateConfig({
            player1Angle: shot.shooterRole === 'player1' ? shot.angle : undefined,
            player1Power: shot.shooterRole === 'player1' ? shot.power : undefined,
            player2Angle: shot.shooterRole === 'player2' ? shot.angle : undefined,
            player2Power: shot.shooterRole === 'player2' ? shot.power : undefined,
            currentTurn: shot.shooterRole
          });
          engineRef.current.fireShot(shot.shooterRole, shot.powerUpType);
        }
      }

      // Handle match finish
      if (updated.status === 'finished' && !matchResult) {
        const isWinner = updated.gameState.winnerPlayerId === myPlayerId;
        const winnerPlayer = updated.player1.id === updated.gameState.winnerPlayerId ? updated.player1 : updated.player2;
        const loserPlayer = updated.player1.id === updated.gameState.loserPlayerId ? updated.player1 : updated.player2;

        let surrenderMsg = '';
        if (updated.gameState.finishReason === 'voluntary_surrender') {
          surrenderMsg = isWinner ? 'El rival se rindió. ¡Victoria concedida!' : 'Te rendiste de la partida. Derrota computada.';
        } else if (updated.gameState.finishReason === 'opponent_disconnected') {
          surrenderMsg = isWinner ? 'El oponente se desconectó. ¡Victoria concedida!' : 'Desconexión computada como derrota.';
        }

        setMatchResult({
          isVictory: isWinner,
          earnedPoints: isWinner ? (winnerPlayer?.score || 150) : (loserPlayer?.score || 50),
          winnerName: winnerPlayer?.name || 'Jugador',
          loserName: loserPlayer?.name || 'Rival',
          isSurrender: !!surrenderMsg,
          surrenderMessage: surrenderMsg,
          winnerCharacterId: winnerPlayer?.characterId
        });
      }
    });

    return () => unsubscribe();
  }, [onlineMatch?.matchId, screen, playerRole, myPlayerId, matchResult]);

  // 2. Presence Heartbeat every 8s during active match
  useEffect(() => {
    if (screen !== 'battle' || !onlineMatch || onlineMatch.status !== 'playing') return;

    sendPresenceHeartbeat(onlineMatch.matchId, myPlayerId);
    const interval = setInterval(() => {
      sendPresenceHeartbeat(onlineMatch.matchId, myPlayerId);
    }, 8000);

    return () => clearInterval(interval);
  }, [screen, onlineMatch?.matchId, onlineMatch?.status, myPlayerId]);

  // 3. Window unload / pagehide disconnect guard (Auto-defeat on tab close)
  useEffect(() => {
    const handleLeave = () => {
      if (screen === 'battle' && onlineMatch && onlineMatch.status === 'playing' && !matchResult) {
        surrenderMatchOnline(onlineMatch.matchId, myPlayerId);
      }
    };

    window.addEventListener('beforeunload', handleLeave);
    window.addEventListener('pagehide', handleLeave);
    return () => {
      window.removeEventListener('beforeunload', handleLeave);
      window.removeEventListener('pagehide', handleLeave);
    };
  }, [screen, onlineMatch?.matchId, onlineMatch?.status, myPlayerId, matchResult]);

  // 4. Timestamp-based Timers Countdown & Turn Expiry
  useEffect(() => {
    if (screen !== 'battle' || !onlineMatch || onlineMatch.status !== 'playing' || matchResult) {
      return;
    }

    const interval = setInterval(() => {
      // Match time has priority over the 25s turn timer. Once the match
      // deadline is reached, do not give another turn to either player.
      if (onlineMatch.gameState.matchEndAt) {
        const matchRem = Math.max(
          0,
          Math.ceil((onlineMatch.gameState.matchEndAt - Date.now()) / 1000)
        );
        setMatchTimerRemaining(matchRem);

        if (matchRem <= 0) {
          const matchKey = 'MATCH:' + onlineMatch.matchId;
          if (lastExpiredMatchRef.current !== matchKey) {
            lastExpiredMatchRef.current = matchKey;

            // Use the combat state currently hydrated in this client.
            const p1 = onlineMatch.player1;
            const p2 = onlineMatch.player2;
            if (!p2) return;

            let winnerId = p1.id;
            let loserId = p2.id;

            // More remaining lives wins. If tied, more HP wins. If still
            // tied, damage/score wins.
            if (p2.lives > p1.lives ||
                (p2.lives === p1.lives && p2.hp > p1.hp) ||
                (p2.lives === p1.lives && p2.hp === p1.hp && p2.score > p1.score)) {
              winnerId = p2.id;
              loserId = p1.id;
            }

            void concludeMatchOnline({
              matchId: onlineMatch.matchId,
              winnerPlayerId: winnerId,
              loserPlayerId: loserId,
              reason: 'time_expired'
            }).then((finished) => {
              if (!finished) return;

              setOnlineMatch(finished);

              const isWinner = finished.gameState.winnerPlayerId === myPlayerId;
              const winnerPlayer =
                finished.player1.id === finished.gameState.winnerPlayerId
                  ? finished.player1
                  : finished.player2;
              const loserPlayer =
                finished.player1.id === finished.gameState.loserPlayerId
                  ? finished.player1
                  : finished.player2;

              setMatchResult({
                isVictory: isWinner,
                earnedPoints: isWinner
                  ? (winnerPlayer?.score || 150)
                  : (loserPlayer?.score || 50),
                winnerName: winnerPlayer?.name || 'Jugador',
                loserName: loserPlayer?.name || 'Rival',
                isSurrender: false,
                surrenderMessage: '',
                winnerCharacterId: winnerPlayer?.characterId
              });

              showTacticalToast(
                isWinner ? '¡Tiempo agotado! ¡Ganaste!' : '¡Tiempo agotado! Perdiste.',
                isWinner ? 'success' : 'warn'
              );
            });

            return;
          }

          return;
        }
      } else {
        setMatchTimerRemaining(-1);
      }

      // Only process the 25s turn timer while the overall match is still alive.
      const elapsedTurnMs = Date.now() - onlineMatch.gameState.turnStartedAt;
      const turnRem = Math.max(0, Math.ceil((25000 - elapsedTurnMs) / 1000));
      setTurnTimerRemaining(turnRem);

      const turnKey =
        onlineMatch.matchId +
        ':' +
        onlineMatch.gameState.currentTurnPlayerId +
        ':' +
        onlineMatch.gameState.turnStartedAt;

      const currentPlayerIsP1 =
        onlineMatch.gameState.currentTurnPlayerId === onlineMatch.player1.id;

      const nextPlayerId = currentPlayerIsP1
        ? (onlineMatch.player2?.id || 'bot')
        : onlineMatch.player1.id;

      if (turnRem === 0 && nextPlayerId && lastExpiredTurnRef.current !== turnKey) {
        lastExpiredTurnRef.current = turnKey;
        const newSpeed = Math.floor(Math.random() * 10) + 3;
        const newDir = Math.random() > 0.5 ? 1 : -1;

        void changeTurnOnline(
          onlineMatch.matchId,
          nextPlayerId,
          newSpeed,
          newDir
        ).then((updated) => {
          if (updated && updated.status === 'playing') {
            setOnlineMatch(updated);
          }
        });

        showTacticalToast('Tiempo agotado. Turno cedido al rival.', 'warn');
      }
    }, 250);
    return () => clearInterval(interval);
  }, [screen, onlineMatch, myPlayerId, playerRole, matchResult]);

  // 5. AI Bot Automation during AI match
  const aiTurnKeyRef = useRef<string>('');
  useEffect(() => {
    if (
      screen === 'battle' && 
      onlineMatch && 
      onlineMatch.isAiMatch && 
      onlineMatch.gameState.currentTurnPlayerId !== myPlayerId && 
      !matchResult
    ) {
      const aiTurnKey = onlineMatch.matchId + ':' + onlineMatch.gameState.turnStartedAt;
      if (aiTurnKeyRef.current === aiTurnKey) return;
      aiTurnKeyRef.current = aiTurnKey;

      const aiTimer = setTimeout(() => {
        if (!engineRef.current || !onlineMatchRef.current) return;
        const match = onlineMatchRef.current;
        const game = engineRef.current.getEngine();
        const shooter = game.players.getPlayer('player2');
        const target = game.players.getPlayer('player1');

        // La IA también se reposiciona: no permanece clavada en su isla.
        const moveDirection = Math.random() > 0.5 ? 1 : -1;
        const moveAmount = 35 + Math.floor(Math.random() * 95);
        game.players.movePlayer('player2', moveDirection * moveAmount, game.terrain);

        // La IA busca una combinación ángulo/fuerza que acerque la parábola
        // al objetivo, teniendo en cuenta gravedad y viento.
        let best = { angle: 45, power: 80, error: Number.POSITIVE_INFINITY };
        for (let angle = 20; angle <= 80; angle += 2) {
          for (let power = 45; power <= 100; power += 5) {
            const rad = angle * Math.PI / 180;
            const speed = 1250 * (0.4 + 0.85 * (power / 100));
            let vx = Math.cos(rad) * speed * shooter.facing;
            let vy = -Math.sin(rad) * speed;
            let x = shooter.x;
            let y = shooter.y - 18;
            for (let step = 0; step < 140; step++) {
              vx += (match.gameState.wind.speed * 6 * match.gameState.wind.direction) * 0.04;
              vy += 720 * 0.04;
              if (Math.sign(vx) !== shooter.facing) vx = 0;
              x += vx * 0.04;
              y += vy * 0.04;
              const distance = Math.hypot(x - target.x, y - target.y);
              if (distance < best.error) best = { angle, power, error: distance };
              if (y > target.y + 80 || x < -100 || x > 2300) break;
            }
          }
        }

        // Dificultad configurable: fácil falla ~20%, medio ~10%, difícil casi nunca.
        const difficulty = aiDifficulty;
        const missChance = difficulty === 'easy' ? 0.20
          : difficulty === 'medium' ? 0.10
          : difficulty === 'hard' ? 0.02 : 0;
        const shouldMiss = Math.random() < missChance;
        const angleError = shouldMiss
          ? (Math.random() > 0.5 ? 1 : -1) * (10 + Math.random() * 16)
          : difficulty === 'hard' || difficulty === 'very_hard'
            ? (Math.random() - 0.5) * 0.8
            : (Math.random() - 0.5) * 2.5;
        const powerError = shouldMiss
          ? (Math.random() > 0.5 ? 1 : -1) * (10 + Math.random() * 18)
          : (Math.random() - 0.5) * (difficulty === 'easy' ? 5 : difficulty === 'medium' ? 3 : 1);

        const aiAngle = Math.round(Math.max(20, Math.min(80, best.angle + angleError)));
        const aiPower = Math.round(Math.max(45, Math.min(100, best.power + powerError)));

        engineRef.current.updateConfig({
          player2Angle: aiAngle,
          player2Power: aiPower
        });

        // Muy difícil aprovecha power-ups ofensivos de forma ocasional.
        const veryHardPowerUps: PowerUpType[] = ['mega_bomb', 'precision', 'power_boost', 'fire_shot', 'double_hit', 'triple_hit', 'grenade'];
        const aiPowerUp = difficulty === 'very_hard' && Math.random() < 0.65
          ? veryHardPowerUps[Math.floor(Math.random() * veryHardPowerUps.length)]
          : undefined;
        engineRef.current.fireShot('player2', aiPowerUp);
      }, 1500);

      return () => clearTimeout(aiTimer);
    }
  }, [screen, onlineMatch?.gameState.currentTurnPlayerId, onlineMatch?.isAiMatch, myPlayerId, matchResult, aiDifficulty]);

  // 6. Initialize Canvas Engine
  useEffect(() => {
    if (screen !== 'battle' || !canvasRef.current || !onlineMatch) return;

    const canvas = canvasRef.current;
    const container = canvasContainerRef.current;
    if (!container) return;

    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;

    const p1Char = onlineMatch.player1.characterId || 'mono';
    const p2Char = onlineMatch.player2?.characterId || 'tortuga';

    const engine = new GameCanvasEngine(canvas, {
      islandId: onlineMatch.settings.islandId,
      player1Name: onlineMatch.player1.name,
      player1CharacterId: p1Char,
      player2Name: onlineMatch.player2?.name,
      player2CharacterId: p2Char,
      player1Angle: angle,
      player1Power: power,
      player2Angle: 42,
      player2Power: 65,
      currentTurn: onlineMatch.gameState.currentTurnPlayerId === onlineMatch.player1.id ? 'player1' : 'player2',
      windSpeed: onlineMatch.gameState.wind.speed,
      windDirection: onlineMatch.gameState.wind.direction,
      maxLives: onlineMatch.settings.lives === 'INFINITE' ? 999999 : onlineMatch.settings.lives,
      onAngleChange: (newAngle) => {
        setAngle(newAngle);
      },
      onTurnComplete: async () => {
        // Change turn online
        const match = onlineMatchRef.current;
        if (!match) return;
        if (match.status === 'playing') {
          const isMyTurn = match.gameState.currentTurnPlayerId === myPlayerId;
          const isAiTurn = match.isAiMatch && !isMyTurn;
          if (isMyTurn || isAiTurn) {
            const nextPlayerId = isAiTurn
              ? myPlayerId
              : (playerRole === 'player1' ? (match.player2?.id || 'bot') : match.player1.id);
            const newSpeed = Math.floor(Math.random() * 10) + 3;
            const newDir = Math.random() > 0.5 ? 1 : -1;
            const updated = await changeTurnOnline(match.matchId, nextPlayerId, newSpeed, newDir);
            if (updated) setOnlineMatch(updated);
          }
        }
      },
      onHit: async (targetRole, damage) => {
        // Update the online state immediately so HP, lives and score change in the HUD
        // even if Firestore synchronization is temporarily unavailable.
        const match = onlineMatchRef.current;
        if (!match) return;

        const updated = await registerImpactOnline({
          matchId: match.matchId,
          targetRole,
          damage,
          hitX: 0,
          hitY: 0,
          isWater: false
        });

        if (updated) {
          setOnlineMatch(updated);
        }
      },
      onSupplyCrateCollected: (collector) => {
        if (collector === playerRole) {
          const availableList: OfficialPowerUpId[] = [
            'bala_doble',
            'bala_triple',
            'bala_explosiva',
            'granada',
            'corazon'
          ];
          // The rare double-heart supply appears periodically, not every time.
          const chosen: OfficialPowerUpId =
            Math.random() < 0.20 ? 'corazon_doble' : availableList[Math.floor(Math.random() * availableList.length)];
          setPowerUpSlots(prev => {
            const next = [...prev];
            const emptyIdx = next.findIndex(s => s === null);
            if (emptyIdx !== -1) {
              next[emptyIdx] = chosen;
            }
            return next;
          });
          showTacticalToast(`¡Suministro Recogido! Power-up añadido`, 'success');
        }
      },
      onPlayerDied: (targetRole) => {
        // If target lost all lives, finish match!
        const match = onlineMatchRef.current;
        if (!match) return;
        const deadPlayer = targetRole === 'player1' ? match.player1 : match.player2;
        if (deadPlayer && deadPlayer.lives <= 1) {
          const winnerPlayerId = targetRole === 'player1' ? (match.player2?.id || 'bot') : match.player1.id;
          void concludeMatchOnline({
            matchId: match.matchId,
            winnerPlayerId,
            loserPlayerId: deadPlayer.id,
            reason: 'lives_depleted'
          }).then((finished) => {
            if (finished) setOnlineMatch(finished);
          });
        }
      }
    });

    engineRef.current = engine;

    const handleResize = () => {
      if (container && engineRef.current) {
        engineRef.current.resize(container.clientWidth, container.clientHeight);
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      engine.destroy();
      engineRef.current = null;
    };
  }, [screen, onlineMatch?.matchId]);

  // 7. Update Canvas Engine on Aim/Power changes
  useEffect(() => {
    if (engineRef.current && onlineMatch) {
      const isP1Turn = onlineMatch.gameState.currentTurnPlayerId === onlineMatch.player1.id;
      if (playerRole === 'player1') {
        engineRef.current.updateConfig({
          player1Angle: angle,
          player1Power: power,
          currentTurn: isP1Turn ? 'player1' : 'player2',
          windSpeed: onlineMatch.gameState.wind.speed,
          windDirection: onlineMatch.gameState.wind.direction
        });
      } else {
        engineRef.current.updateConfig({
          player2Angle: angle,
          player2Power: power,
          currentTurn: isP1Turn ? 'player1' : 'player2',
          windSpeed: onlineMatch.gameState.wind.speed,
          windDirection: onlineMatch.gameState.wind.direction
        });
      }
    }
  }, [angle, power, onlineMatch?.gameState.currentTurnPlayerId, onlineMatch?.gameState.wind, playerRole]);

  // ACTION: JUGAR CONTRA IA — primero configurar tiempo, vidas e isla.
  const handleQuickPlay = async (requestedName?: string) => {
    const activePlayerName = (requestedName ?? playerName).trim();
    if (activePlayerName.length < 2) {
      alert('Escribe un alias de al menos 2 caracteres.');
      return;
    }
    handlePlayerNameChange(activePlayerName);
    setPendingAiSettings(true);
    setScreen('create_room');
  };

  const handleAiSettingsConfigured = async (timeLimit: GameTimeOption, lives: GameLivesOption, islandId: string, difficulty: 'easy' | 'medium' | 'hard' | 'very_hard' = 'medium') => {
    setAiDifficulty(difficulty);
    setPendingAiSettings(false);
    try {
      setOnlineMatch(null);
      setMatchResult(null);
      setPowerUpSlots([null, null, null, null]);
      setActivePowerUp(null);
      setActiveSlotIndex(null);
      setLastShotPower(null);
      setAngle(45);
      setPower(60);
      lastProcessedShotTimeRef.current = 0;
      lastExpiredTurnRef.current = '';
      lastExpiredMatchRef.current = '';

      const match = await createOnlineMatch({
        creatorPlayerName: playerName,
        timeLimitSeconds: timeLimit === '5_MIN' ? 300 : null,
        lives,
        islandId,
        isAiMatch: true
      });
      setOnlineMatch(match);
      setPlayerRole('player1');
      setPendingCreation(null);
      setScreen('char_select');
    } catch (e) {
      alert((e as Error).message);
      setScreen('menu');
    }
  };

  // ACTION: CREAR PARTIDA (Step 1: Settings Form)
  const handleOpenCreateRoom = () => {
    setScreen('create_room');
  };

  const handleSettingsConfigured = (timeLimit: GameTimeOption, lives: GameLivesOption, islandId: string) => {
    setPendingCreation({
      timeLimitSeconds: timeLimit === '5_MIN' ? 300 : null,
      lives,
      islandId
    });
    setPlayerRole('player1');
    setScreen('char_select');
  };

  // ACTION: UNIRSE A SALA
  const handleJoinSelectedMatch = async (matchId: string) => {
    try {
      const joined = await joinOnlineMatch(matchId, playerName);
      setOnlineMatch(joined);
      setPlayerRole('player2');
      setPendingCreation(null);
      setScreen('char_select');
    } catch (e) {
      alert((e as Error).message);
    }
  };

  // ACTION: SELECCIONAR PERSONAJE
  const handleCharacterSelected = async (characterId: CharacterId) => {
    try {
      // If we were creating a new match:
      if (pendingCreation) {
        const match = await createOnlineMatch({
          creatorPlayerName: playerName,
          timeLimitSeconds: pendingCreation.timeLimitSeconds,
          lives: pendingCreation.lives,
          islandId: pendingCreation.islandId,
          isAiMatch: false
        });

        // Pick character
        const updated = await selectCharacterOnline(match.matchId, myPlayerId, characterId);
        setOnlineMatch(updated);
        setPendingCreation(null);

        const charConfig = getCharacterById(characterId);
        setAngle(Math.round((charConfig.minAngle + charConfig.maxAngle) / 2));

        // Enter waiting room screen
        setScreen('waiting_opponent');
        return;
      }

      // If we are in an existing match (Joiner or AI match)
      if (onlineMatch) {
        const updated = await selectCharacterOnline(onlineMatch.matchId, myPlayerId, characterId);
        setOnlineMatch(updated);

        const charConfig = getCharacterById(characterId);
        setAngle(Math.round((charConfig.minAngle + charConfig.maxAngle) / 2));

        if (updated.status === 'playing') {
          setScreen('battle');
        } else if (playerRole === 'player1') {
          setScreen('waiting_opponent');
        }
      }
    } catch (e) {
      alert((e as Error).message);
    }
  };

  // ACTION: DISPARAR CAÑÓN
  const handleFire = (overridePower?: number) => {
    if (!engineRef.current || !onlineMatch) return;
    const isMyTurn = onlineMatch.gameState.currentTurnPlayerId === myPlayerId;
    if (!isMyTurn) return;

    const shotPower = overridePower !== undefined ? overridePower : power;
    setLastShotPower(shotPower);

    // Send shot event online to Firestore
    sendShotOnline({
      matchId: onlineMatch.matchId,
      playerId: myPlayerId,
      shooterRole: playerRole,
      angle,
      power: shotPower,
      powerUpType: activePowerUp,
      windSpeed: onlineMatch.gameState.wind.speed,
      windDirection: onlineMatch.gameState.wind.direction
    });

    // Fire immediately in local canvas
    engineRef.current.fireShot(playerRole, activePowerUp);

    // Consume official powerup slot after firing
    if (activeSlotIndex !== null) {
      setPowerUpSlots(prev => {
        const next = [...prev];
        next[activeSlotIndex] = null;
        return next;
      });
      setActiveSlotIndex(null);
    }
    setActivePowerUp(null);
  };

  // ACTION: OFFICIAL POWER-UP SLOT SELECTION
  const handleSelectSlot = (index: number) => {
    const item = powerUpSlots[index];
    if (!item) return;

    if (item === 'corazon' || item === 'corazon_doble') {
      const healType = item === 'corazon_doble' ? 'heal_20' : 'heal_10';
      const healed = engineRef.current?.applyPowerUp(playerRole, healType);
      showTacticalToast(
        item === 'corazon_doble' ? '+20% de vida restaurada ❤️❤️' : '+10% de vida restaurada ❤️',
        'success'
      );
      setPowerUpSlots(prev => {
        const next = [...prev];
        next[index] = null;
        return next;
      });
      if (activeSlotIndex === index) {
        setActiveSlotIndex(null);
        setActivePowerUp(null);
      }
      return;
    }

    if (activeSlotIndex === index) {
      setActiveSlotIndex(null);
      setActivePowerUp(null);
      showTacticalToast('Bala normal restaurada', 'info');
    } else {
      setActiveSlotIndex(index);
      // Map to game power-up type for physics
      let pt: PowerUpType = 'mega_bomb';
      if (item === 'corazon_doble') pt = 'heal_20';
       else if (item === 'bala_doble') pt = 'double_hit';
      else if (item === 'bala_triple') pt = 'triple_hit';
      else if (item === 'bala_explosiva') pt = 'mega_bomb';
      else if (item === 'granada') pt = 'grenade';
      setActivePowerUp(pt);
      showTacticalToast(`Power-up Activado para disparo`, 'warn');
    }
  };

  // Surrender Confirmation
  const handleConfirmSurrender = () => {
    setShowLeaveConfirm(false);
    if (!onlineMatch) {
      setScreen('menu');
      return;
    }

    surrenderMatchOnline(onlineMatch.matchId, myPlayerId);
  };

  // Camera focus jumps
  const handleCameraFocus = (mode: 'player1' | 'player2' | 'center') => {
    if (!engineRef.current) return;
    if (mode === 'player1') engineRef.current.focusPlayer('player1');
    else if (mode === 'player2') engineRef.current.focusPlayer('player2');
    else engineRef.current.focusCenter();
  };

  const handleBackToMenu = () => {
    setMatchResult(null);
    setOnlineMatch(null);
    setPendingCreation(null);
    setScreen('menu');
  };

  // Convert online player to PlayerState for existing HUD
  const p1HUD = onlineMatch ? {
    ...onlineMatch.player1,
    displayLobbyName: onlineMatch.player1.name,
    angle: 35,
    power: 60,
    activePowerUp: null
  } : {
    id: 'p1',
    name: playerName,
    displayLobbyName: playerName,
    characterId: 'mono' as CharacterId,
    hp: 100,
    maxHp: 100,
    lives: 3,
    maxLives: 3,
    score: 0,
    angle: 35,
    power: 60,
    activePowerUp: null,
    position: { x: 380, y: 440 },
    isReady: true
  };

  const p2HUD = onlineMatch?.player2 ? {
    ...onlineMatch.player2,
    displayLobbyName: onlineMatch.player2.name,
    angle: 42,
    power: 65,
    activePowerUp: null
  } : null;

  const currentTurnRole = onlineMatch?.gameState.currentTurnPlayerId === onlineMatch?.player1.id ? 'player1' : 'player2';
  const isMyTurn = onlineMatch ? onlineMatch.gameState.currentTurnPlayerId === myPlayerId : false;

  // Character locked by rival
  const lockedCharacterId = onlineMatch 
    ? (playerRole === 'player1' ? onlineMatch.player2?.characterId : onlineMatch.player1.characterId)
    : null;

  const myCharacterStats = onlineMatch
    ? (playerRole === 'player1' 
        ? (onlineMatch.player1.characterId ? getCharacterById(onlineMatch.player1.characterId) : null)
        : (onlineMatch.player2?.characterId ? getCharacterById(onlineMatch.player2.characterId) : null))
    : null;

  return (
    <GameContainer isBattle={screen === 'battle'}>
      
      {/* 1. ADMIN DASHBOARD ROUTE */}
      {screen === 'admin' && (
        <AdminDashboard onBackToGame={() => {
          window.history.pushState({}, '', '/');
          setScreen('menu');
        }} />
      )}

      {/* 2. MAIN MENU */}
      {screen === 'menu' && (
        <MainMenu
          onQuickPlay={handleQuickPlay}
          onJoinRoom={() => setScreen('join_room')}
          onRanking={() => setShowRanking(true)}
          onContact={() => setShowContact(true)}
          playerName={playerName}
          onPlayerNameChange={handlePlayerNameChange}
        />
      )}

      {/* 3. MODAL: CREAR PARTIDA (Settings Form) */}
      {screen === 'create_room' && (
        <CreateRoomModal
          creatorName={playerName}
          onClose={() => { setPendingAiSettings(false); setScreen('menu'); }}
          isAiMode={pendingAiSettings}
          onCreate={pendingAiSettings ? handleAiSettingsConfigured : handleSettingsConfigured}
        />
      )}

      {/* 4. MODAL: UNIRSE A PARTIDA (Lobby list) */}
      {screen === 'join_room' && (
        <JoinRoomModal
          joinerName={playerName}
          onClose={() => setScreen('menu')}
          onJoin={handleJoinSelectedMatch}
          onCreateRoom={handleOpenCreateRoom}
        />
      )}

      {/* 5. MODAL: ESPERANDO OPONENTE (Room code + Waiting indicator) */}
      {screen === 'waiting_opponent' && onlineMatch && (
        <WaitingOpponentModal
          match={onlineMatch}
          onCancel={() => {
            surrenderMatchOnline(onlineMatch.matchId, myPlayerId);
            setOnlineMatch(null);
            setScreen('menu');
          }}
        />
      )}

      {/* 6. MODAL: SELECCIÓN DE PERSONAJE (Carousel + Mutual Exclusion Rule) */}
      {screen === 'char_select' && (
        <CharacterSelectModal
          playerName={playerName}
          isPlayer1={playerRole === 'player1'}
          lockedCharacterId={lockedCharacterId}
          onSelectCharacter={handleCharacterSelected}
          onCancel={() => {
            if (onlineMatch?.isAiMatch || pendingCreation) {
              setPendingCreation(null);
              setOnlineMatch(null);
              setScreen('menu');
            } else {
              setShowLeaveConfirm(true);
            }
          }}
        />
      )}

      {/* 7. BATTLE SCREEN: Canvas Game World + Fixed Overlays */}
      {screen === 'battle' && onlineMatch && (
        <div className="relative w-full h-full flex flex-col overflow-hidden bg-slate-950">
          
          {/* Top HUD Fixed Overlay */}
          <TopHUD
            player1={p1HUD}
            player2={p2HUD}
            currentTurn={currentTurnRole}
            turnTimer={turnTimerRemaining}
            matchTimer={matchTimerRemaining}
            onSurrenderClick={() => setShowLeaveConfirm(true)}
          />

          {/* Active Turn Alert Banner */}
          <div className="absolute top-[104px] left-0 right-0 z-20 flex justify-center pointer-events-none">
            {isMyTurn ? (
              <div className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 text-white font-black text-xs uppercase px-4 py-1 rounded-full shadow-lg border-2 border-emerald-300 animate-pulse tracking-wider">
                ¡Tu Turno! Apunta y Dispara
              </div>
            ) : (
              <div className="bg-slate-900/80 text-slate-300 font-bold text-xs uppercase px-3 py-0.5 rounded-full border border-slate-700 tracking-wider">
                Turno del Rival... Espera
              </div>
            )}
          </div>

          {/* Tactical Notification Toast */}
          {tacticalToast && (
            <div className="absolute top-[132px] left-0 right-0 z-40 flex justify-center pointer-events-none px-4">
              <div className={`px-3 py-1.5 rounded-lg text-xs font-black shadow-xl border backdrop-blur-sm ${
                tacticalToast.type === 'success' 
                  ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500' 
                  : tacticalToast.type === 'warn'
                  ? 'bg-amber-950/90 text-amber-200 border-amber-500'
                  : 'bg-cyan-950/90 text-cyan-200 border-cyan-500'
              }`}>
                {tacticalToast.text}
              </div>
            </div>
          )}

          {/* Canvas Game World */}
          <div ref={canvasContainerRef} className="absolute inset-x-0 top-0 bottom-[clamp(164px,22dvh,210px)] z-10 w-full">
            <canvas ref={canvasRef} className="w-full h-full block cursor-grab active:cursor-grabbing" />
          </div>

          {/* Bottom Controls Fixed Overlay */}
          <BottomControls
            angle={angle}
            power={power}
            wind={onlineMatch.gameState.wind}
            isMyTurn={isMyTurn}
            isFiring={engineRef.current?.isFiring()}
            powerUpSlots={powerUpSlots}
            activeSlotIndex={activeSlotIndex}
            onSelectSlot={handleSelectSlot}
            onPowerChange={setPower}
            onFire={handleFire}
            lastShotPower={lastShotPower}
            onMarkLastShot={() => {
              if (lastShotPower !== null) {
                setPower(lastShotPower);
                showTacticalToast(`Fuerza del último tiro marcada: ${lastShotPower}%`, 'info');
              }
            }}
            onMove={(delta) => engineRef.current?.movePlayer(playerRole, delta)}
          />

        </div>
      )}

      {/* 8. TOP 50 RANKING MODAL */}
      {showRanking && (
        <RankingModal
          currentPlayerName={playerName}
          onClose={() => setShowRanking(false)}
        />
      )}

      {/* 9. CONTACTO MODAL */}
      {showContact && (
        <ContactModal onClose={() => setShowContact(false)} />
      )}

      {/* 10. LEAVE / SURRENDER CONFIRMATION MODAL */}
      {showLeaveConfirm && (
        <LeaveConfirmModal
          onCancel={() => setShowLeaveConfirm(false)}
          onConfirmLeave={handleConfirmSurrender}
        />
      )}

      {/* 11. MATCH RESULT MODAL */}
      {matchResult && (
        <MatchResultModal
          isVictory={matchResult.isVictory}
          earnedPoints={matchResult.earnedPoints}
          winnerName={matchResult.winnerName}
          loserName={matchResult.loserName}
          isSurrender={matchResult.isSurrender}
          surrenderMessage={matchResult.surrenderMessage}
          winnerCharacterId={matchResult.winnerCharacterId}
          onPlayAgain={() => {
            setMatchResult(null);
            setOnlineMatch(null);
            setPowerUpSlots([null, null, null, null]);
            setActivePowerUp(null);
            setActiveSlotIndex(null);
            setLastShotPower(null);
            setPendingCreation(null);
            setScreen('join_room');
          }}
          onBackToMenu={handleBackToMenu}
        />
      )}

    </GameContainer>
  );
}
