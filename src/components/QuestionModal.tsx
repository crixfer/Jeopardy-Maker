import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Plus, Eye, Lightbulb, CheckCircle2, XCircle, Bell, Sparkles, Radio, Users, Check, X } from 'lucide-react';
import { ActiveQuestionState, Team, BuzzerQueueItem } from '../types/game';
import { Avatar } from './Avatar';
import { soundManager } from '../utils/soundEffects';
import { StreakName, StreakBadge, StreakAvatarAura } from './StreakFireEffect';

interface QuestionModalProps {
  questionState: ActiveQuestionState;
  teams: Record<string, Team>;
  buzzedTeam?: BuzzerQueueItem | null;
  buzzerQueue?: BuzzerQueueItem[];
  attemptedTeamIds?: string[];
  onClose: () => void;
  onAwardPoints: (teamId: string, isCorrect: boolean, customPoints?: number) => void;
  onTogglePause: () => void;
  onExtendTimer: (seconds: number) => void;
  onResetTimer: () => void;
  onReopenBuzzer: () => void;
  penaltyForWrong: boolean;
  onToggleAnswerReveal?: (revealed: boolean) => void;
  onTimerTickDown?: () => void;
}

export const QuestionModal: React.FC<QuestionModalProps> = ({
  questionState,
  teams,
  buzzedTeam,
  buzzerQueue = [],
  attemptedTeamIds = [],
  onClose,
  onAwardPoints,
  onTogglePause,
  onExtendTimer,
  onResetTimer,
  onReopenBuzzer,
  penaltyForWrong,
  onToggleAnswerReveal,
}) => {
  const [showHint, setShowHint] = useState<boolean>(false);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState<boolean>(questionState.revealedAnswer || false);

  // Compute effective queue (fallback to single buzzedTeam if queue not yet populated)
  const effectiveQueue: BuzzerQueueItem[] = React.useMemo(() => {
    if (buzzerQueue && buzzerQueue.length > 0) {
      return buzzerQueue;
    }
    if (buzzedTeam) {
      return [buzzedTeam];
    }
    return [];
  }, [buzzerQueue, buzzedTeam]);

  // Default selected team to the 1st responder in queue, or first team available
  const [selectedTeamId, setSelectedTeamId] = useState<string>(
    effectiveQueue[0]?.teamId || buzzedTeam?.teamId || Object.keys(teams)[0] || ''
  );

  // Automatically sync selected team whenever the buzzer queue updates (1st in line is selected)
  useEffect(() => {
    if (effectiveQueue.length > 0) {
      setSelectedTeamId(effectiveQueue[0].teamId);
    } else if (buzzedTeam?.teamId) {
      setSelectedTeamId(buzzedTeam.teamId);
    }
  }, [effectiveQueue, buzzedTeam]);

  // Keep internal answer reveal synced
  useEffect(() => {
    if (questionState.revealedAnswer !== undefined) {
      setIsAnswerRevealed(questionState.revealedAnswer);
    }
  }, [questionState.revealedAnswer]);

  // Handle Close safely stopping timer music
  const handleModalClose = () => {
    soundManager.stopMusic();
    onClose();
  };

  // Keyboard shortcut: Spacebar to toggle Pause/Resume, Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.code === 'Space') {
        e.preventDefault();
        onTogglePause();
      } else if (e.code === 'Escape') {
        handleModalClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onTogglePause, onClose]);

  const toggleReveal = () => {
    const nextVal = !isAnswerRevealed;
    setIsAnswerRevealed(nextVal);
    if (onToggleAnswerReveal) {
      onToggleAnswerReveal(nextVal);
    }
  };

  // Score Correct: STOP MUSIC IMMEDIATELY and award points
  const handleCorrect = (teamId: string) => {
    soundManager.stopMusic();
    soundManager.playCorrect();
    onAwardPoints(teamId, true, questionState.points);
  };

  // Score Wrong: STOP MUSIC IMMEDIATELY and penalize (giving others opportunities to buzz)
  const handleWrong = (teamId: string) => {
    soundManager.stopMusic();
    soundManager.playWrong();
    onAwardPoints(teamId, false, penaltyForWrong ? questionState.points : 0);
  };

  const teamsList = Object.values(teams);
  const timePercent = Math.max(0, Math.min(100, (questionState.remainingSeconds / (questionState.timerDuration || 30)) * 100));

  const isTimeCritical = questionState.remainingSeconds <= 5 && questionState.remainingSeconds > 0;
  const isTimeUp = questionState.remainingSeconds <= 0;

  const activeResponder = effectiveQueue[0] || (buzzedTeam ? buzzedTeam : null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-4xl bg-slate-900 border-2 border-indigo-600/70 rounded-3xl shadow-2xl shadow-indigo-950/80 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header Bar */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-6 py-4 border-b border-indigo-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 font-bold text-xs uppercase tracking-wider border border-indigo-500/30">
              {questionState.categoryTitle}
            </span>
            <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 font-black text-sm tracking-wide border border-amber-500/40 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              {questionState.points} PTS
            </span>
            {questionState.isDailyDouble && (
              <span className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 font-black text-xs uppercase tracking-widest animate-pulse">
                ★ DAILY DOUBLE ★
              </span>
            )}
          </div>

          {/* Close Question */}
          <button
            onClick={handleModalClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors text-sm font-semibold cursor-pointer"
          >
            ✕ Close Question
          </button>
        </div>

        {/* Timer Progress Bar */}
        <div className="w-full bg-slate-800 h-2.5 overflow-hidden relative">
          <div
            className={`h-full transition-all duration-300 ease-linear ${
              isTimeUp
                ? 'bg-rose-600'
                : isTimeCritical
                ? 'bg-rose-500 animate-pulse'
                : questionState.remainingSeconds <= 10
                ? 'bg-amber-500'
                : 'bg-emerald-500'
            }`}
            style={{ width: `${timePercent}%` }}
          />
        </div>

        {/* Modal Main Content */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col items-center justify-start text-center space-y-5">
          {/* Question Text Tile */}
          <div className="w-full max-w-3xl bg-slate-950/70 p-6 sm:p-8 rounded-2xl border border-indigo-900/40 shadow-inner">
            <p className="text-xl sm:text-3xl font-extrabold text-white leading-relaxed tracking-wide select-none">
              "{questionState.question}"
            </p>

            {/* Optional Teacher Hint */}
            {questionState.hint && (
              <div className="mt-4 flex flex-col items-center">
                {!showHint ? (
                  <button
                    onClick={() => setShowHint(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 text-xs font-semibold border border-amber-500/20 transition-colors"
                  >
                    <Lightbulb className="w-3.5 h-3.5" />
                    <span>Show Teacher Hint</span>
                  </button>
                ) : (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-200 text-sm max-w-xl animate-fadeIn">
                    <span className="font-bold">💡 Hint: </span>
                    {questionState.hint}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Answer Reveal Section */}
          <div className="w-full max-w-xl">
            {isAnswerRevealed ? (
              <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-emerald-950/60 border-2 border-emerald-500/60 rounded-2xl p-4 sm:p-5 shadow-lg shadow-emerald-950/50 animate-scaleUp">
                <span className="text-xs uppercase font-extrabold tracking-wider text-emerald-400 block mb-1">
                  Correct Answer
                </span>
                <p className="text-lg sm:text-2xl font-black text-white">
                  {questionState.answer}
                </p>
              </div>
            ) : (
              <button
                onClick={toggleReveal}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 font-bold text-sm transition-all shadow-md active:scale-95 cursor-pointer"
              >
                <Eye className="w-4 h-4 text-emerald-400" />
                <span>Reveal Answer</span>
              </button>
            )}
          </div>

          {/* BUZZER QUEUE & AVATAR ORDER SECTION (CRITICAL USER REQUIREMENT) */}
          {effectiveQueue.length > 0 ? (
            <div className="w-full max-w-2xl bg-slate-950/80 border-2 border-indigo-500/50 rounded-2xl p-4 space-y-4 shadow-xl animate-fadeIn">
              {/* Header with Queue Count */}
              <div className="flex items-center justify-between border-b border-indigo-900/60 pb-2">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-rose-400 animate-pulse" />
                  <span className="text-xs font-black uppercase tracking-wider text-white">
                    Buzzer Order ({effectiveQueue.length} {effectiveQueue.length === 1 ? 'Team' : 'Teams'} in Queue)
                  </span>
                </div>
                <button
                  onClick={onReopenBuzzer}
                  className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold border border-slate-700 transition-colors"
                  title="Clear buzzer and reopen for all remaining teams"
                >
                  Pass / Re-open Buzzer
                </button>
              </div>

              {/* Horizontal Avatar Order Row (In the exact order buzzed) */}
              <div className="flex items-center gap-3 overflow-x-auto py-2 px-1 justify-center">
                {effectiveQueue.map((item, idx) => {
                  const teamObj = teams[item.teamId];
                  const streak = teamObj?.streak || 0;
                  const isFirst = idx === 0;
                  const isSelected = item.teamId === selectedTeamId;

                  return (
                    <button
                      key={item.teamId}
                      onClick={() => setSelectedTeamId(item.teamId)}
                      type="button"
                      className={`relative flex flex-col items-center p-3 rounded-2xl transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-gradient-to-b from-indigo-900/70 to-slate-900 border-2 border-amber-400 shadow-lg shadow-amber-400/20 scale-105'
                          : 'bg-slate-900/80 border border-slate-800 hover:border-slate-700 opacity-80 hover:opacity-100'
                      }`}
                    >
                      {/* Order Position Badge */}
                      <span
                        className={`absolute -top-2.5 px-2 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase shadow-md ${
                          isFirst
                            ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 ring-2 ring-amber-300 animate-pulse'
                            : 'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}
                      >
                        {isFirst ? '👑 1st (Active)' : `#${idx + 1}`}
                      </span>

                      <div className="mt-1">
                        <StreakAvatarAura streak={streak}>
                          <Avatar avatarId={item.avatarId} size="md" />
                        </StreakAvatarAura>
                      </div>

                      <span className="text-xs font-black text-white mt-2 max-w-[90px] truncate">
                        {item.teamName}
                      </span>

                      {streak >= 2 && (
                        <div className="mt-1">
                          <StreakBadge streak={streak} size="xs" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Active Responder Highlight Card with Quick Grade Buttons */}
              {activeResponder && (
                <div className="bg-gradient-to-r from-amber-500/10 via-slate-900 to-amber-500/10 border border-amber-500/40 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-left">
                    <span className="text-xs text-slate-300 font-medium">Selected to grade:</span>
                    <strong className="text-amber-400 font-black text-sm">
                      {teams[selectedTeamId]?.name || activeResponder.teamName}
                    </strong>
                    {teams[selectedTeamId] && (teams[selectedTeamId].streak || 0) >= 2 && (
                      <StreakBadge streak={teams[selectedTeamId].streak || 0} size="xs" />
                    )}
                  </div>

                  {/* Direct Grade Buttons for the Selected / First Team */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCorrect(selectedTeamId)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md transition-all active:scale-95 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>Correct (+{questionState.points})</span>
                    </button>
                    <button
                      onClick={() => handleWrong(selectedTeamId)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs shadow-md transition-all active:scale-95 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                      <span>Wrong {penaltyForWrong ? `(-${questionState.points})` : '(0)'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* When No One Has Buzzed In Yet */
            <div className="w-full max-w-xl p-4 rounded-2xl bg-slate-950/50 border border-indigo-900/30 flex items-center justify-center gap-3 text-slate-400">
              <Radio className="w-5 h-5 text-indigo-400 animate-pulse" />
              <span className="text-xs font-semibold">
                Listening for student buzzers on mobile... First team to tap will appear here in real-time.
              </span>
            </div>
          )}

          {/* Attempted / Disqualified Teams Indicator */}
          {attemptedTeamIds.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="text-rose-400 font-bold">Already attempted:</span>
              <div className="flex flex-wrap gap-1.5">
                {attemptedTeamIds.map((tId) => {
                  const team = teams[tId];
                  return (
                    <span
                      key={tId}
                      className="px-2 py-0.5 rounded-lg bg-rose-500/10 text-rose-300 border border-rose-500/20 line-through text-[11px]"
                    >
                      {team?.name || tId}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Control Dock for Instructor */}
        <div className="bg-slate-950 border-t border-indigo-900/50 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
          {/* Round Timer & Pace Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Countdown Badge */}
            <div
              className={`px-4 py-2 rounded-xl flex items-center gap-2 border font-mono font-black text-lg ${
                isTimeUp
                  ? 'bg-rose-500/20 border-rose-500/50 text-rose-400 animate-pulse'
                  : isTimeCritical
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                  : 'bg-slate-800 border-slate-700 text-white'
              }`}
            >
              <Bell className="w-4 h-4" />
              <span>{Math.max(0, questionState.remainingSeconds)}s</span>
            </div>

            {/* Play/Pause Button */}
            <button
              onClick={onTogglePause}
              title="Pause/Resume Timer (Shortcut: Space)"
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold border transition-all cursor-pointer ${
                questionState.isPaused
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-600/30'
                  : 'bg-amber-600 hover:bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-600/30'
              }`}
            >
              {questionState.isPaused ? (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Resume</span>
                </>
              ) : (
                <>
                  <Pause className="w-4 h-4 fill-current" />
                  <span>Pause</span>
                </>
              )}
            </button>

            {/* +10s Button */}
            <button
              onClick={() => onExtendTimer(10)}
              title="Add 10 seconds"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>10s</span>
            </button>

            {/* Reset Timer */}
            <button
              onClick={onResetTimer}
              title="Reset Timer"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Scoring Controls for Teams */}
          <div className="flex items-center gap-3">
            {/* Team Picker dropdown (in case teacher wants to override and score any team manually) */}
            {teamsList.length > 0 && (
              <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5">
                <span className="text-xs text-slate-400 font-semibold hidden md:inline">
                  Select Team:
                </span>
                <select
                  value={selectedTeamId}
                  onChange={(e) => setSelectedTeamId(e.target.value)}
                  className="bg-transparent text-white font-bold text-xs sm:text-sm focus:outline-none cursor-pointer"
                >
                  {teamsList.map((t) => {
                    const streakCount = t.streak || 0;
                    const streakIcon = streakCount >= 5 ? '⚡🔥 ' : streakCount >= 2 ? '🔥 ' : '';
                    const isAttempted = attemptedTeamIds.includes(t.id);
                    return (
                      <option key={t.id} value={t.id} className="bg-slate-900 text-white">
                        {streakIcon}{t.name} ({t.score} pts{streakCount >= 2 ? ` • ${streakCount} streak` : ''}){isAttempted ? ' [Missed]' : ''}
                      </option>
                    );
                  })}
                </select>
                {selectedTeamId && teams[selectedTeamId] && (teams[selectedTeamId].streak || 0) >= 2 && (
                  <StreakBadge streak={teams[selectedTeamId].streak || 0} size="xs" />
                )}
              </div>
            )}

            {/* Correct Button (+Pts) */}
            <button
              onClick={() => handleCorrect(selectedTeamId)}
              disabled={!selectedTeamId}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-emerald-600/30 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Correct (+{questionState.points})</span>
            </button>

            {/* Wrong Button (-Pts or 0) */}
            <button
              onClick={() => handleWrong(selectedTeamId)}
              disabled={!selectedTeamId}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-rose-600/30 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <XCircle className="w-4 h-4" />
              <span>
                Wrong {penaltyForWrong ? `(-${questionState.points})` : '(0)'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
