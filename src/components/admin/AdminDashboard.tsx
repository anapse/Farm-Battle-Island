import React, { useState, useEffect } from 'react';
import { getAdminMetrics } from '../../services/adminService';
import { getRankings } from '../../services/rankingService';
import { AdminMetrics, CharacterId, PlayerRanking } from '../../types/game';
import { CHARACTERS } from '../../config/characters';
import { 
  ShieldAlert, 
  ArrowLeft, 
  Activity, 
  Users, 
  Award, 
  Flag, 
  BarChart3, 
  PieChart, 
  RefreshCw,
  Clock,
  Layers,
  Crosshair
} from 'lucide-react';

interface AdminDashboardProps {
  onBackToGame: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBackToGame }) => {
  const [metrics, setMetrics] = useState<AdminMetrics>(getAdminMetrics());
  const [rankings, setRankings] = useState<PlayerRanking[]>(getRankings());
  const [activeTab, setActiveTab] = useState<'metrics' | 'characters' | 'activity' | 'players'>('metrics');

  const refreshData = () => {
    setMetrics(getAdminMetrics());
    setRankings(getRankings());
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 5000);
    return () => clearInterval(interval);
  }, []);

  const totalPicks = Object.values(metrics.characterPicks).reduce((a, b) => a + b, 0) || 1;

  return (
    <div className="absolute inset-0 z-50 bg-slate-950 text-slate-100 flex flex-col overflow-hidden select-none">
      
      {/* Top Admin Header Bar */}
      <header className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToGame}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1.5 text-xs font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al Juego</span>
          </button>
          <div className="h-4 w-px bg-slate-700" />
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            <h1 className="text-sm sm:text-base font-black uppercase tracking-wider text-white">
              PANEL ADMINISTRATIVO <span className="text-amber-400 font-mono text-xs">/admin</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={refreshData}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            title="Recargar datos"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
            SISTEMA ONLINE
          </span>
        </div>
      </header>

      {/* Admin Navigation Tabs */}
      <div className="flex items-center gap-2 px-4 py-2 bg-slate-900/60 border-b border-slate-800/80 text-xs font-bold shrink-0 overflow-x-auto">
        <button
          onClick={() => setActiveTab('metrics')}
          className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
            activeTab === 'metrics'
              ? 'bg-amber-600 text-white'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          Resumen General
        </button>
        <button
          onClick={() => setActiveTab('characters')}
          className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
            activeTab === 'characters'
              ? 'bg-amber-600 text-white'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          Personajes & Winrate
        </button>
        <button
          onClick={() => setActiveTab('activity')}
          className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
            activeTab === 'activity'
              ? 'bg-amber-600 text-white'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          Actividad Reciente
        </button>
        <button
          onClick={() => setActiveTab('players')}
          className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
            activeTab === 'players'
              ? 'bg-amber-600 text-white'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          Jugadores Registrados
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-4xl mx-auto w-full">
        
        {/* Tab 1: METRICS OVERVIEW */}
        {activeTab === 'metrics' && (
          <div className="space-y-4">
            
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-900 p-3.5 rounded-2xl border border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Salas Creadas
                </span>
                <span className="text-2xl font-black font-mono text-white mt-1 block">
                  {metrics.totalRoomsCreated}
                </span>
                <span className="text-[10px] text-amber-400 font-semibold mt-1 block">
                  Total acumulado
                </span>
              </div>

              <div className="bg-slate-900 p-3.5 rounded-2xl border border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Partidas Completadas
                </span>
                <span className="text-2xl font-black font-mono text-emerald-400 mt-1 block">
                  {metrics.totalRoomsCompleted}
                </span>
                <span className="text-[10px] text-emerald-300/80 font-semibold mt-1 block">
                  {Math.round((metrics.totalRoomsCompleted / (metrics.totalMatches || 1)) * 100)}% tasa de éxito
                </span>
              </div>

              <div className="bg-slate-900 p-3.5 rounded-2xl border border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Partidas Abandonadas
                </span>
                <span className="text-2xl font-black font-mono text-red-400 mt-1 block">
                  {metrics.totalRoomsAbandoned}
                </span>
                <span className="text-[10px] text-red-300/80 font-semibold mt-1 block">
                  Derrotas automáticas
                </span>
              </div>

              <div className="bg-slate-900 p-3.5 rounded-2xl border border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Jugadores Únicos
                </span>
                <span className="text-2xl font-black font-mono text-sky-400 mt-1 block">
                  {rankings.length}
                </span>
                <span className="text-[10px] text-sky-300/80 font-semibold mt-1 block">
                  Con score activo
                </span>
              </div>
            </div>

            {/* Architecture Status Card */}
            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
              <h3 className="text-xs font-black uppercase text-amber-400 mb-2 flex items-center gap-1.5">
                <Layers className="w-4 h-4" />
                <span>Estado Arquitectónico del Juego</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Motor de Render:</span>
                    <span className="text-emerald-400 font-bold">HTML5 Canvas 2D + 9:16</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Overlays de UI:</span>
                    <span className="text-emerald-400 font-bold">React 19 + Tailwind v4</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Cámara Dinámica:</span>
                    <span className="text-emerald-400 font-bold">Lerp desacoplado de controles</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Pausa permitida:</span>
                    <span className="text-red-400 font-bold">PROHIBIDA (Derrota por salida)</span>
                  </div>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Esquema Firestore:</span>
                    <span className="text-amber-400 font-bold">firebase-blueprint.json</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Reglas de Seguridad:</span>
                    <span className="text-amber-400 font-bold">firestore.rules (Pillars 1-8)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Sincronización Salas:</span>
                    <span className="text-sky-400 font-bold">BroadcastChannel + Firestore</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Exclusión Personajes:</span>
                    <span className="text-emerald-400 font-bold">Activa (Mutual Lock)</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Tab 2: CHARACTERS & WINRATE */}
        {activeTab === 'characters' && (
          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
            <h3 className="text-xs font-black uppercase text-amber-400 mb-3 flex items-center gap-1.5">
              <Crosshair className="w-4 h-4" />
              <span>Estadísticas por Personaje (Pickrate & Winrate)</span>
            </h3>

            <div className="space-y-3">
              {CHARACTERS.map((char) => {
                const picks = metrics.characterPicks[char.id] || 0;
                const wins = metrics.characterWins[char.id] || 0;
                const pickPercent = Math.round((picks / totalPicks) * 100);
                const winrate = picks > 0 ? Math.round((wins / picks) * 100) : 50;

                return (
                  <div key={char.id} className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{char.badgeSymbol}</span>
                        <div>
                          <span className="text-xs font-black uppercase text-white">{char.name}</span>
                          <span className="text-[10px] text-slate-400 ml-2">Fza: {char.fuerza} · Res: {char.resistencia}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-mono font-black text-amber-300">{picks} partidas</span>
                        <span className="text-[10px] text-emerald-400 font-mono ml-2 font-bold">{winrate}% WR</span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${pickPercent}%`,
                          backgroundColor: char.themeColor
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 3: RECENT ACTIVITY */}
        {activeTab === 'activity' && (
          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
            <h3 className="text-xs font-black uppercase text-amber-400 mb-3 flex items-center gap-1.5">
              <Activity className="w-4 h-4" />
              <span>Registro de Eventos de Partidas</span>
            </h3>

            <div className="space-y-2">
              {metrics.recentActivity.map((act) => (
                <div key={act.id} className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${
                      act.type === 'completed' ? 'bg-emerald-400' :
                      act.type === 'abandoned' ? 'bg-red-400' : 'bg-sky-400'
                    }`} />
                    <span className="text-slate-200">{act.detail}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">
                    {new Date(act.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: REGISTERED PLAYERS */}
        {activeTab === 'players' && (
          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
            <h3 className="text-xs font-black uppercase text-amber-400 mb-3 flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              <span>Jugadores & Historial de Combate</span>
            </h3>

            <div className="divide-y divide-slate-800">
              {rankings.map((p, idx) => (
                <div key={p.playerName} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-500 w-5 text-center">#{idx + 1}</span>
                    <span className="font-bold text-white">{p.playerName}</span>
                  </div>
                  <div className="flex items-center gap-3 font-mono">
                    <span className="text-amber-300 font-black">{p.score} pts</span>
                    <span className="text-emerald-400">{p.victories}V</span>
                    <span className="text-red-400">{p.defeats}D</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
