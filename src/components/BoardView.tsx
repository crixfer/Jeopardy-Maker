import React, { useState } from 'react';
import { Maximize2, Minimize2, Share2, Copy, Check, Users, Trophy, Settings, Plus, Sparkles, RefreshCw, QrCode, Zap, Sliders, Music } from 'lucide-react';
import { Game, Category, Question, Team } from '../types/game';
import { Avatar } from './Avatar';
import { soundManager } from '../utils/soundEffects';
import { JoinQRCode } from './JoinQRCode';
import { StreakName, StreakBadge, StreakAvatarAura } from './StreakFireEffect';


interface BoardViewProps {
  game: Game;
  teams: Record<string, Team>;
  answeredQuestionIds: string[];
  onSelectQuestion: (category: Category, question: Question, questionIndex: number) => void;
  onEndGame: () => void;
  onStartTieBreaker?: () => void;
  onOpenSoundSettings?: () => void;
  sessionPin?: string;
  onAdjustTeamScore: (teamId: string, delta: number) => void;
  onAddTeam: () => void;
  penaltyForWrong: boolean;
  setPenaltyForWrong: (val: boolean) => void;
  defaultTimerSeconds: number;
  setDefaultTimerSeconds: (sec: number) => void;
}

export const BoardView: React.FC<BoardViewProps> = ({
  game,
  teams,
  answeredQuestionIds,
  onSelectQuestion,
  onEndGame,
  onStartTieBreaker,
  onOpenSoundSettings,
  sessionPin,
  onAdjustTeamScore,
  onAddTeam,
  penaltyForWrong,
  setPenaltyForWrong,
  defaultTimerSeconds,
  setDefaultTimerSeconds,
}) => {
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleCopyPin = () => {
    if (!sessionPin) return;
    navigator.clipboard.writeText(sessionPin).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    });
  };

  const teamsList = Object.values(teams);
  const categories = game.categories || [];

  // Determine max questions count across categories for uniform rows
  const maxRows = Math.max(...categories.map((c) => c.questions?.length || 0), 5);

  const isQuestionAnswered = (questionId: string) => {
    return answeredQuestionIds.includes(questionId);
  };

  return (
    <div className="flex-1 flex flex-col justify-between p-3 sm:p-6 max-w-7xl mx-auto w-full">
      {/* Top Controls & Game Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 bg-slate-900/90 border border-indigo-900/50 p-3 sm:p-4 rounded-2xl shadow-md">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide flex items-center gap-2">
            <span className="bg-gradient-to-r from-amber-400 to-yellow-300 bg-clip-text text-transparent">
              {game.title}
            </span>
          </h1>
          <p className="text-xs text-slate-400 font-medium hidden sm:block">
            {game.description || 'Select a card from any category to start the question timer'}
          </p>
        </div>

        {/* Action Badges */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Live Session PIN & QR Code trigger */}
          {sessionPin && (
            <button
              onClick={() => setShowShareModal(true)}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600/30 via-purple-600/30 to-indigo-600/30 border-2 border-indigo-400/60 hover:border-amber-400 text-indigo-200 hover:text-white transition-all font-mono font-bold text-xs sm:text-sm shadow-md shadow-indigo-950/50 hover:scale-105 active:scale-95"
              title="Click to display QR code for students to join with phones"
            >
              <QrCode className="w-4 h-4 text-amber-400" />
              <span>Join PIN: <strong className="text-amber-300 tracking-wider">{sessionPin}</strong></span>
              <span className="hidden md:inline px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase tracking-wider border border-emerald-500/30">
                Scan QR
              </span>
            </button>
          )}

          {/* Settings Button */}
          <div className="relative">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
              title="Game Rules & Timer Settings"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Settings Dropdown */}
            {showSettings && (
              <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-4 z-30 text-xs text-slate-200 space-y-3">
                <div className="font-bold text-white border-b border-slate-800 pb-2">
                  Game Settings
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">
                    Round Timer (seconds):
                  </label>
                  <select
                    value={defaultTimerSeconds}
                    onChange={(e) => setDefaultTimerSeconds(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-bold"
                  >
                    <option value={15}>15 Seconds (Blitz)</option>
                    <option value={30}>30 Seconds (Standard)</option>
                    <option value={45}>45 Seconds (Thoughtful)</option>
                    <option value={60}>60 Seconds (Complex)</option>
                  </select>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="font-semibold text-slate-300">Penalty for Wrong:</span>
                  <input
                    type="checkbox"
                    checked={penaltyForWrong}
                    onChange={(e) => setPenaltyForWrong(e.target.checked)}
                    className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                  />
                </div>

                {onOpenSoundSettings && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowSettings(false);
                      onOpenSoundSettings();
                    }}
                    className="w-full mt-2 py-2 px-3 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Sliders className="w-3.5 h-3.5 text-purple-400" />
                    <span>Sound & Music Levels</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen (Classroom Projector)'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Optional Sudden Death Tie Breaker Button */}
          {onStartTieBreaker && (
            <button
              onClick={onStartTieBreaker}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-600/30 to-yellow-600/30 hover:from-amber-600/50 hover:to-yellow-600/50 border border-amber-500/50 text-amber-300 font-bold text-xs sm:text-sm shadow-sm transition-all hover:scale-105 active:scale-95"
              title="Start an optional sudden-death playoff to break ties"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>Tie Breaker</span>
            </button>
          )}

          {/* End Game Button */}
          <button
            onClick={onEndGame}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs sm:text-sm shadow-md shadow-amber-500/20 transition-all hover:scale-105 active:scale-95"
          >
            <Trophy className="w-4 h-4" />
            <span>Finish Game</span>
          </button>
        </div>
      </div>

      {/* Main Jeopardy Board Grid */}
      <div className="flex-1 bg-slate-950/80 border-2 border-indigo-900/60 rounded-3xl p-3 sm:p-5 shadow-2xl overflow-x-auto min-h-[420px] flex flex-col justify-center">
        <div
          className="grid gap-2 sm:gap-4 min-w-[700px] sm:min-w-0"
          style={{ gridTemplateColumns: `repeat(${categories.length || 1}, minmax(0, 1fr))` }}
        >
          {/* Category Headers Row */}
          {categories.map((category) => (
            <div
              key={category.id}
              className="bg-gradient-to-b from-indigo-900 to-indigo-950 border border-indigo-500/50 rounded-2xl p-3 sm:p-4 text-center shadow-md flex items-center justify-center min-h-[70px] sm:min-h-[85px]"
            >
              <h2 className="text-xs sm:text-sm md:text-base font-black text-amber-300 uppercase tracking-wider line-clamp-2">
                {category.title}
              </h2>
            </div>
          ))}

          {/* Questions Rows */}
          {Array.from({ length: maxRows }).map((_, rowIndex) => (
            <React.Fragment key={`row-${rowIndex}`}>
              {categories.map((category) => {
                const question = category.questions?.[rowIndex];
                if (!question) {
                  return (
                    <div
                      key={`empty-${category.id}-${rowIndex}`}
                      className="bg-slate-900/30 rounded-2xl border border-slate-800/40 min-h-[65px] sm:min-h-[80px]"
                    />
                  );
                }

                const answered = isQuestionAnswered(question.id);

                return (
                  <button
                    key={question.id}
                    disabled={answered}
                    onClick={() => {
                      soundManager.playFlip();
                      onSelectQuestion(category, question, rowIndex);
                    }}
                    className={`relative rounded-2xl p-2 sm:p-4 font-black transition-all duration-200 select-none flex items-center justify-center min-h-[65px] sm:min-h-[80px] ${
                      answered
                        ? 'bg-slate-900/40 border border-slate-800/60 text-slate-700 cursor-not-allowed shadow-inner'
                        : 'bg-gradient-to-b from-blue-700 via-indigo-700 to-indigo-800 hover:from-blue-600 hover:to-indigo-700 border-2 border-indigo-400/50 hover:border-amber-400 text-amber-300 hover:text-white shadow-lg hover:shadow-indigo-500/30 hover:scale-[1.03] active:scale-95 cursor-pointer'
                    }`}
                  >
                    {answered ? (
                      <span className="text-xs sm:text-sm font-bold text-slate-600 tracking-wider">
                        ✓ DONE
                      </span>
                    ) : (
                      <div className="flex flex-col items-center">
                        <span className="text-lg sm:text-2xl md:text-3xl font-black drop-shadow tracking-tight">
                          {question.points}
                        </span>
                        {question.isDailyDouble && (
                          <span className="text-[10px] text-amber-200 font-bold uppercase tracking-widest mt-0.5">
                            ★ Double
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Bottom Live Team Score Dock */}
      <div className="mt-5 bg-slate-900/90 border border-indigo-900/60 rounded-2xl p-3 sm:p-4 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-300">
              Classroom Teams ({teamsList.length}/15)
            </h3>
          </div>

          {teamsList.length < 15 && (
            <button
              onClick={onAddTeam}
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold border border-slate-700 transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              <span>Add Team</span>
            </button>
          )}
        </div>

        {/* Teams List Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-8 gap-2.5">
          {teamsList.map((team) => {
            const hasStreak = (team.streak || 0) >= 2;
            return (
              <div
                key={team.id}
                className={`relative rounded-2xl p-3 flex flex-col items-center text-center transition-all group ${
                  hasStreak
                    ? 'bg-gradient-to-b from-orange-950/40 via-slate-950/90 to-slate-950 border-2 border-orange-500/80 shadow-[0_0_16px_rgba(249,115,22,0.35)] animate-fire-glow'
                    : 'bg-slate-950/70 border border-slate-800 hover:border-indigo-600/50'
                }`}
              >
                {/* Avatar with fiery aura if on fire */}
                <StreakAvatarAura streak={team.streak || 0}>
                  <Avatar avatarId={team.avatarId} size="md" />
                </StreakAvatarAura>

                {/* Team Name with flame effect if on fire */}
                <div className="mt-2 w-full flex items-center justify-center">
                  <StreakName
                    name={team.name}
                    streak={team.streak || 0}
                    size="sm"
                    className="max-w-[130px]"
                  />
                </div>

                {/* Streak Pill Badge */}
                {hasStreak && (
                  <div className="mt-1">
                    <StreakBadge streak={team.streak || 0} size="xs" />
                  </div>
                )}

                {/* Score with animated flair */}
                <div className={`mt-1.5 px-3 py-1 rounded-lg border font-mono font-black text-sm sm:text-base ${
                  hasStreak
                    ? 'bg-orange-950/70 border-orange-700/80 text-yellow-300 shadow-inner'
                    : 'bg-indigo-950/80 border-indigo-800/60 text-amber-300'
                }`}>
                  {team.score} PTS
                </div>

                {/* Quick score buttons for instructor convenience */}
                <div className="mt-2 flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onAdjustTeamScore(team.id, -50)}
                    title="Deduct 50 pts"
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-rose-900/60 text-rose-300 text-[11px] font-bold border border-slate-700"
                  >
                    -50
                  </button>
                  <button
                    onClick={() => onAdjustTeamScore(team.id, 50)}
                    title="Add 50 pts"
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-emerald-900/60 text-emerald-300 text-[11px] font-bold border border-slate-700"
                  >
                    +50
                  </button>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* Scannable Phone QR Code Modal */}
      {showShareModal && sessionPin && (
        <JoinQRCode
          pin={sessionPin}
          gameTitle={game.title}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
};
