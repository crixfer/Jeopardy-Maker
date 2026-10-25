import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Medal, Star, Sparkles, RotateCcw, Award, ArrowRight, Zap } from 'lucide-react';
import { Team } from '../types/game';
import { Avatar } from './Avatar';
import { soundManager } from '../utils/soundEffects';
import { StreakName, StreakBadge, StreakAvatarAura } from './StreakFireEffect';


interface VictoryModalProps {
  teams: Record<string, Team>;
  onPlayAgain: () => void;
  onViewLeaderboard: () => void;
  onClose: () => void;
  onStartTieBreaker?: () => void;
  designatedWinnerId?: string | null;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  teams,
  onPlayAgain,
  onViewLeaderboard,
  onClose,
  onStartTieBreaker,
  designatedWinnerId,
}) => {
  const sortedTeams = Object.values(teams).sort((a, b) => {
    if (designatedWinnerId) {
      if (a.id === designatedWinnerId) return -1;
      if (b.id === designatedWinnerId) return 1;
    }
    return b.score - a.score;
  });
  const winner = sortedTeams[0];
  const runnerUp = sortedTeams[1];
  const thirdPlace = sortedTeams[2];

  const isTieForFirst = !designatedWinnerId && winner && runnerUp && winner.score === runnerUp.score;

  useEffect(() => {
    soundManager.playVictory();

    // Trigger celebratory confetti cannon
    const duration = 3.5 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#ec4899'],
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#ec4899'],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-2xl bg-slate-900 border-2 border-amber-500/70 rounded-3xl shadow-2xl shadow-amber-500/20 overflow-hidden flex flex-col text-center p-6 sm:p-8 space-y-6">
        {/* Banner */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-black uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Game Show Champions</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Victory Celebration!
          </h2>
        </div>

        {/* Tie Breaker Option Banner (if tied for 1st) */}
        {isTieForFirst && onStartTieBreaker && (
          <div className="bg-amber-500/15 border-2 border-amber-400/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 animate-bounce-subtle">
            <div className="text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-1.5 text-amber-300 font-black text-sm">
                <Zap className="w-4 h-4 fill-current text-amber-400" />
                <span>Tie for 1st Place! ({winner?.score} PTS)</span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Break the tie with an optional sudden death playoff without affecting total board score!
              </p>
            </div>
            <button
              onClick={onStartTieBreaker}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5 shrink-0"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>Play Sudden Death</span>
            </button>
          </div>
        )}

        {/* Podium */}
        <div className="grid grid-cols-3 gap-3 items-end pt-4 pb-2">
          {/* 2nd Place */}
          {runnerUp && (
            <div className={`border rounded-2xl p-3 flex flex-col items-center ${
              (runnerUp.streak || 0) >= 2
                ? 'bg-gradient-to-b from-orange-950/40 to-slate-950/80 border-orange-500/70 shadow-[0_0_12px_rgba(249,115,22,0.3)] animate-fire-glow'
                : 'bg-slate-950/70 border-slate-700'
            }`}>
              <span className="w-7 h-7 rounded-full bg-slate-300 text-slate-950 font-black text-xs flex items-center justify-center mb-1">
                2
              </span>
              <StreakAvatarAura streak={runnerUp.streak || 0}>
                <Avatar avatarId={runnerUp.avatarId} size="lg" />
              </StreakAvatarAura>
              <div className="mt-1.5 w-full flex items-center justify-center">
                <StreakName name={runnerUp.name} streak={runnerUp.streak || 0} size="sm" className="max-w-[100px]" />
              </div>
              {(runnerUp.streak || 0) >= 2 && (
                <div className="mt-0.5">
                  <StreakBadge streak={runnerUp.streak || 0} size="xs" />
                </div>
              )}
              <span className="font-mono font-bold text-slate-300 text-xs mt-0.5">
                {runnerUp.score} PTS
              </span>
            </div>
          )}

          {/* 1st Place */}
          {winner && (
            <div className={`border-2 rounded-2xl p-4 flex flex-col items-center relative shadow-lg ${
              (winner.streak || 0) >= 2
                ? 'bg-gradient-to-b from-orange-950/60 via-amber-950/40 to-slate-950 border-amber-400 shadow-[0_0_25px_rgba(249,115,22,0.5)] animate-fire-glow'
                : 'bg-gradient-to-b from-amber-500/20 to-slate-950 border-amber-400 shadow-amber-500/20'
            }`}>
              <span className="w-9 h-9 rounded-full bg-amber-400 text-slate-950 font-black text-sm flex items-center justify-center mb-1 shadow-md">
                👑
              </span>
              <StreakAvatarAura streak={winner.streak || 0}>
                <Avatar avatarId={winner.avatarId} size="xl" />
              </StreakAvatarAura>
              <div className="mt-2 w-full flex items-center justify-center">
                <StreakName name={winner.name} streak={winner.streak || 0} size="md" className="max-w-[140px]" />
              </div>
              {(winner.streak || 0) >= 2 && (
                <div className="mt-1">
                  <StreakBadge streak={winner.streak || 0} size="xs" />
                </div>
              )}
              <span className="font-mono font-black text-white text-base sm:text-lg mt-0.5">
                {winner.score} PTS
              </span>
            </div>
          )}

          {/* 3rd Place */}
          {thirdPlace && (
            <div className={`border rounded-2xl p-3 flex flex-col items-center ${
              (thirdPlace.streak || 0) >= 2
                ? 'bg-gradient-to-b from-orange-950/40 to-slate-950/80 border-orange-500/70 shadow-[0_0_12px_rgba(249,115,22,0.3)] animate-fire-glow'
                : 'bg-slate-950/70 border-slate-700'
            }`}>
              <span className="w-7 h-7 rounded-full bg-amber-700 text-amber-100 font-black text-xs flex items-center justify-center mb-1">
                3
              </span>
              <StreakAvatarAura streak={thirdPlace.streak || 0}>
                <Avatar avatarId={thirdPlace.avatarId} size="lg" />
              </StreakAvatarAura>
              <div className="mt-1.5 w-full flex items-center justify-center">
                <StreakName name={thirdPlace.name} streak={thirdPlace.streak || 0} size="sm" className="max-w-[100px]" />
              </div>
              {(thirdPlace.streak || 0) >= 2 && (
                <div className="mt-0.5">
                  <StreakBadge streak={thirdPlace.streak || 0} size="xs" />
                </div>
              )}
              <span className="font-mono font-bold text-slate-300 text-xs mt-0.5">
                {thirdPlace.score} PTS
              </span>
            </div>
          )}

        </div>

        {/* Notice */}
        <p className="text-xs text-slate-400">
          Scores have been automatically recorded to the classroom all-time leaderboard!
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={onPlayAgain}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/20 transition-all hover:scale-105 active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Play Again</span>
          </button>

          <button
            onClick={onViewLeaderboard}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-md transition-all hover:scale-105 active:scale-95"
          >
            <Trophy className="w-4 h-4 text-amber-300" />
            <span>View Hall of Fame</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm transition-colors"
          >
            Review Board
          </button>
        </div>
      </div>
    </div>
  );
};
