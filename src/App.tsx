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
    return localStorage.getItem('fbi_stored_player_name') || 'Comandante';
  });

  const [myPlayerId] = useState<string>(() => {
    return getPlayerIdentity(playerName).playerId;
  });

  // Current active online match
  const [onlineMatch, setOnlineMatch] = useState<OnlineMatch | null>(null);
  const [playerRole, setPlayerRole] = useState<'player1' | 'player2'>('player1');

  // Pending room settings during creation flow
  const [pendingCreation, setPendingCreation] = useState<{
    timeLimitSeconds: 300 | null;
    lives: 1 | 3 | 5;
    islandId: string;
  } | null>(null);

  // Modals visibility
  const [showRanking, setShowRanking] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

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
  const [activePowerUp, setActivePowerUp] = useState<PowerUpType | null>(null);
  const [powerUpSlots, setPowerUpSlots] = useState<(OfficialPowerUpId | null)[]>([null, null, null, null]);
  const [activeSlotIndex, setActiveSlotIndex] = useState<number | null>(null);
  const [tacticalToast, setTacticalToast] = useState<{ id: number; text: string; type: 'info' | 'success' | 'warn' } | null>(null);

  // Timers calculated from timestamps
  const [turnTimerRemaining, setTurnTimerRemaining] = useState(45);
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

      setOnlineMatch(updated);

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
          winnerName: winnerPlayer?.name || 'Comandante',
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
      // Calculate remaining turn seconds based on turnStartedAt
      const elapsedTurnMs = Date.now() - onlineMatch.gameState.turnStartedAt;
      const turnRem = Math.max(0, Math.ceil((45000 - elapsedTurnMs) / 1000));
      setTurnTimerRemaining(turnRem);

      // If turn timer expired and it was MY turn, pass turn automatically!
      if (turnRem === 0 && onlineMatch.gameState.currentTurnPlayerId === myPlayerId) {
        const nextPlayerId = playerRole === 'player1' ? (onlineMatch.player2?.id || 'bot') : onlineMatch.player1.id;
        const newSpeed = Math.floor(Math.random() * 22) + 2;
        const newDir = Math.random() > 0.5 ? 1 : -1;
        changeTurnOnline(onlineMatch.matchId, nextPlayerId, newSpeed, newDir);
        showTacticalToast('Tiempo agotado. Turno cedido al rival.', 'warn');
      }

      // Calculate remaining match seconds if 5-minute limit is enabled
      if (onlineMatch.gameState.matchEndAt) {
        const matchRem = Math.max(0, Math.ceil((onlineMatch.gameState.matchEndAt - Date.now()) / 1000));
        setMatchTimerRemaining(matchRem);

        // If match time reached 0: conclude match
        if (matchRem === 0 && onlineMatch.gameState.currentTurnPlayerId === myPlayerId) {
          // Compare lives, then points
          const p1Lives = onlineMatch.player1.lives;
          const p2Lives = onlineMatch.player2?.lives || 0;
          let winnerId = onlineMatch.player1.id;
          let loserId = onlineMatch.player2?.id || 'p2';

          if (p2Lives > p1Lives) {
            winnerId = onlineMatch.player2?.id || 'p2';
            loserId = onlineMatch.player1.id;
          } else if (p1Lives === p2Lives) {
            // Compare score
            const p1Score = onlineMatch.player1.score;
            const p2Score = onlineMatch.player2?.score || 0;
            if (p2Score > p1Score) {
              winnerId = onlineMatch.player2?.id || 'p2';
              loserId = onlineMatch.player1.id;
            }
          }

          concludeMatchOnline({
            matchId: onlineMatch.matchId,
            winnerPlayerId: winnerId,
            loserPlayerId: loserId,
            reason: 'time_expired'
          });
        }
      } else {
        setMatchTimerRemaining(-1);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [screen, onlineMatch, myPlayerId, playerRole, matchResult]);

  // 5. AI Bot Automation during AI match
  useEffect(() => {
    if (
      screen === 'battle' && 
      onlineMatch && 
      onlineMatch.isAiMatch && 
      onlineMatch.gameState.currentTurnPlayerId !== myPlayerId && 
      !matchResult
    ) {
      const aiTimer = setTimeout(() => {
        const aiAngle = Math.floor(Math.random() * 25) + 32;
        const aiPower = Math.floor(Math.random() * 25) + 55;
        if (engineRef.current) {
          engineRef.current.updateConfig({
            player2Angle: aiAngle,
            player2Power: aiPower
          });
          engineRef.current.fireShot('player2');
        }
      }, 1500);

      return () => clearTimeout(aiTimer);
    }
  }, [screen, onlineMatch?.gameState.currentTurnPlayerId, onlineMatch?.isAiMatch, myPlayerId, matchResult]);

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
      maxLives: onlineMatch.settings.lives,
      onAngleChange: (newAngle) => {
        setAngle(newAngle);
      },
      onTurnComplete: () => {
        // Change turn online
        const match = onlineMatchRef.current;
        if (!match) return;
        if (match.status === 'playing' && match.gameState.currentTurnPlayerId === myPlayerId) {
          const nextPlayerId = playerRole === 'player1' ? (match.player2?.id || 'bot') : match.player1.id;
          const newSpeed = Math.floor(Math.random() * 22) + 2;
          const newDir = Math.random() > 0.5 ? 1 : -1;
          changeTurnOnline(match.matchId, nextPlayerId, newSpeed, newDir);
        }
      },
      onHit: (targetRole, damage) => {
        // Register impact damage online
        const match = onlineMatchRef.current;
        if (!match) return;
        registerImpactOnline({
          matchId: match.matchId,
          targetRole,
          damage,
          hitX: 0,
          hitY: 0,
          isWater: false
        });
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
          const chosen = availableList[Math.floor(Math.random() * availableList.length)];
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
          concludeMatchOnline({
            matchId: match.matchId,
            winnerPlayerId,
            loserPlayerId: deadPlayer.id,
            reason: 'lives_depleted'
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

  // ACTION: JUGAR (Quick Play vs AI)
  const handleQuickPlay = async () => {
    try {
      const match = await createOnlineMatch({
        creatorPlayerName: playerName,
        timeLimitSeconds: 300,
        lives: 3,
        islandId: 'isla_1',
        isAiMatch: true
      });
      setOnlineMatch(match);
      setPlayerRole('player1');
      setPendingCreation(null);
      setScreen('char_select');
    } catch (e) {
      alert((e as Error).message);
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

    if (item === 'corazon') {
      engineRef.current?.applyPowerUp(playerRole, 'heal_20');
      showTacticalToast('+20 Salud Restaurada ❤️', 'success');
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
      if (item === 'bala_doble') pt = 'double_hit';
      else if (item === 'bala_triple') pt = 'double_hit';
      else if (item === 'bala_explosiva') pt = 'mega_bomb';
      else if (item === 'granada') pt = 'bounce';
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
          onCreateRoom={handleOpenCreateRoom}
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
          onClose={() => setScreen('menu')}
          onCreate={handleSettingsConfigured}
        />
      )}

      {/* 4. MODAL: UNIRSE A PARTIDA (Lobby list) */}
      {screen === 'join_room' && (
        <JoinRoomModal
          joinerName={playerName}
          onClose={() => setScreen('menu')}
          onJoin={handleJoinSelectedMatch}
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
          <div className="absolute top-16 left-0 right-0 z-20 flex justify-center pointer-events-none">
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
            <div className="absolute top-24 left-0 right-0 z-40 flex justify-center pointer-events-none px-4">
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
          <div ref={canvasContainerRef} className="absolute inset-0 z-10 w-full h-full">
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
            handleQuickPlay();
          }}
          onBackToMenu={handleBackToMenu}
        />
      )}

    </GameContainer>
  );
}
