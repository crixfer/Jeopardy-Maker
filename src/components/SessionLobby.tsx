import React, { useState } from 'react';
import { Play, Users, Sparkles, Plus, Trash2, Smartphone, Monitor, BookOpen, Shuffle } from 'lucide-react';
import { Game, Team } from '../types/game';
import { DEFAULT_GAMES } from '../utils/defaultGames';
import { Avatar, AVATAR_OPTIONS, getRandomTeam } from './Avatar';

interface SessionLobbyProps {
  gamesList: Game[];
  onStartSession: (selectedGame: Game, teams: Record<string, Team>, isMultiplayer: boolean) => void;
  onEditGame: (game: Game) => void;
  onCreateNewGame: () => void;
}

export const SessionLobby: React.FC<SessionLobbyProps> = ({
  gamesList,
  onStartSession,
  onEditGame,
  onCreateNewGame,
}) => {
  const [selectedGameId, setSelectedGameId] = useState<string>(gamesList[0]?.id || DEFAULT_GAMES[0].id);
  const [isMultiplayer, setIsMultiplayer] = useState<boolean>(true);

  // Default initial teams
  const [teams, setTeams] = useState<Team[]>([
    { id: 'team-1', name: 'Quantum Quizzers', avatarId: 'robo', color: '#3b82f6', score: 0, streak: 0 },
    { id: 'team-2', name: 'Galactic Comets', avatarId: 'cat', color: '#f59e0b', score: 0, streak: 0 },
    { id: 'team-3', name: 'Atomic Wizards', avatarId: 'wizard', color: '#8b5cf6', score: 0, streak: 0 },
  ]);

  const selectedGame = gamesList.find((g) => g.id === selectedGameId) || DEFAULT_GAMES[0];

  const handleAddTeam = () => {
    if (teams.length >= 15) return;
    const random = getRandomTeam();
    const newTeam: Team = {
      id: `team-${Date.now()}`,
      name: random.name,
      avatarId: random.avatarId,
      color: random.color,
      score: 0,
      streak: 0,
    };
    setTeams([...teams, newTeam]);
  };

  const handleRandomizeAllTeams = () => {
    setTeams(
      teams.map((t) => {
        const r = getRandomTeam();
        return {
          ...t,
          name: r.name,
          avatarId: r.avatarId,
          color: r.color,
        };
      })
    );
  };

  const handleDeleteTeam = (id: string) => {
    if (teams.length <= 1) return;
    setTeams(teams.filter((t) => t.id !== id));
  };

  const handleUpdateTeamName = (id: string, name: string) => {
    setTeams(teams.map((t) => (t.id === id ? { ...t, name } : t)));
  };

  const handleUpdateTeamAvatar = (id: string, avatarId: string) => {
    const avatar = AVATAR_OPTIONS.find((a) => a.id === avatarId);
    setTeams(
      teams.map((t) =>
        t.id === id
          ? { ...t, avatarId, color: avatar?.primaryColor || t.color }
          : t
      )
    );
  };

  const handleLaunch = () => {
    const teamsMap: Record<string, Team> = {};
    teams.forEach((t) => {
      teamsMap[t.id] = t;
    });
    onStartSession(selectedGame, teamsMap, isMultiplayer);
  };

  return (
    <div className="flex-1 p-4 sm:p-6 max-w-5xl mx-auto w-full space-y-6">
      {/* Hero Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-900/90 via-slate-900 to-indigo-950 border-2 border-indigo-700/60 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-black uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Classroom Jeopardy Battle</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Ready to Host a Game?
          </h1>
          <p className="text-xs sm:text-sm text-slate-300">
            Pick a Jeopardy game board, configure classroom teams with animated avatars, and project on screen or let students buzz from their phones!
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Step 1: Select Game Board */}
        <div className="lg:col-span-2 bg-slate-900 border border-indigo-900/60 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-200">
                1. Select Game Board
              </h2>
            </div>

            <button
              onClick={onCreateNewGame}
              className="text-xs text-amber-400 hover:text-amber-300 font-bold"
            >
              + Create New Board
            </button>
          </div>

          {/* Games Card Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {gamesList.map((g) => {
              const isSelected = g.id === selectedGameId;
              const catCount = g.categories?.length || 0;
              const qCount = g.categories?.reduce((acc, c) => acc + (c.questions?.length || 0), 0) || 0;

              return (
                <div
                  key={g.id}
                  onClick={() => setSelectedGameId(g.id)}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer select-none flex flex-col justify-between ${
                    isSelected
                      ? 'bg-gradient-to-br from-indigo-950 to-slate-900 border-amber-400 shadow-lg shadow-amber-500/10'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {catCount} Categories • {qCount} Tiles
                      </span>
                      {isSelected && (
                        <span className="text-amber-400 font-bold text-xs">✓ Active</span>
                      )}
                    </div>

                    <h3 className="font-black text-sm sm:text-base text-white line-clamp-1 mt-1">
                      {g.title}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                      {g.description || 'Pre-made classroom trivia board.'}
                    </p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditGame(g);
                      }}
                      className="text-[11px] text-slate-400 hover:text-white font-semibold"
                    >
                      Customize Questions →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Mode Selector */}
          <div className="pt-3 border-t border-slate-800">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Gameplay Mode
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setIsMultiplayer(true)}
                className={`p-3 rounded-2xl border flex items-center gap-3 transition-all ${
                  isMultiplayer
                    ? 'bg-indigo-600/30 border-amber-400 text-white shadow-md'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-5 h-5 text-amber-400" />
                <div className="text-left">
                  <p className="text-xs font-black">Live Student Buzzer</p>
                  <span className="text-[10px] text-slate-400">Students join with PIN on phones</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setIsMultiplayer(false)}
                className={`p-3 rounded-2xl border flex items-center gap-3 transition-all ${
                  !isMultiplayer
                    ? 'bg-indigo-600/30 border-amber-400 text-white shadow-md'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Monitor className="w-5 h-5 text-emerald-400" />
                <div className="text-left">
                  <p className="text-xs font-black">Single Screen / Projector</p>
                  <span className="text-[10px] text-slate-400">Teacher controls buzzers directly</span>
                </div>
              </button>
            </div>

            {isMultiplayer && (
              <div className="mt-2.5 p-2.5 rounded-xl bg-indigo-950/60 border border-indigo-500/30 text-[11px] text-indigo-300 flex items-center gap-2">
                <span className="text-amber-400 font-bold">★ Note:</span>
                <span>A scannable QR Code and Room PIN will appear on screen for students to scan with phone cameras!</span>
              </div>
            )}
          </div>
        </div>

        {/* Step 2: Classroom Teams */}
        <div className="bg-slate-900 border border-indigo-900/60 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-200">
                  2. Teams ({teams.length})
                </h2>
              </div>

              <button
                type="button"
                onClick={handleRandomizeAllTeams}
                title="Randomize all team names and avatars"
                className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1"
              >
                <Shuffle className="w-3.5 h-3.5" />
                <span>Shuffle</span>
              </button>
            </div>

            {/* Teams List */}
            <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
              {teams.map((t) => (
                <div
                  key={t.id}
                  className="bg-slate-950 border border-slate-800 rounded-2xl p-2.5 flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    {/* Avatar picker popover toggle */}
                    <div className="relative group shrink-0">
                      <button
                        type="button"
                        className="cursor-pointer hover:opacity-80 transition-opacity"
                        title="Click to cycle avatar"
                        onClick={() => {
                          const currentIndex = AVATAR_OPTIONS.findIndex((a) => a.id === t.avatarId);
                          const nextAvatar = AVATAR_OPTIONS[(currentIndex + 1) % AVATAR_OPTIONS.length];
                          handleUpdateTeamAvatar(t.id, nextAvatar.id);
                        }}
                      >
                        <Avatar avatarId={t.avatarId} size="sm" />
                      </button>
                    </div>

                    <input
                      type="text"
                      value={t.name}
                      maxLength={30}
                      onChange={(e) => handleUpdateTeamName(t.id, e.target.value)}
                      className="bg-transparent text-white font-extrabold text-xs sm:text-sm focus:outline-none w-full border-b border-transparent focus:border-indigo-500"
                    />
                  </div>

                  {teams.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleDeleteTeam(t.id)}
                      className="text-slate-600 hover:text-rose-400 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {teams.length < 15 && (
              <button
                type="button"
                onClick={handleAddTeam}
                className="mt-3 w-full py-2.5 rounded-xl border border-dashed border-slate-700 hover:border-emerald-500 text-slate-400 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Plus className="w-4 h-4 text-emerald-400" />
                <span>Add Classroom Team ({teams.length}/15)</span>
              </button>
            )}
          </div>

          {/* Launch Big Action Button */}
          <div className="pt-4 border-t border-slate-800">
            <button
              onClick={handleLaunch}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-base shadow-xl shadow-amber-500/25 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>Launch Jeopardy Game</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
