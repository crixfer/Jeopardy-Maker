import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Maximize2, Minimize2, Share2, Copy, Check, Users, Trophy, Settings, Plus, Sparkles, RefreshCw, QrCode, Zap, Sliders, Music, Dices } from 'lucide-react';
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

  // Mystery Roulette Random Question Picker State
  const [isRouletteActive, setIsRouletteActive] = useState<boolean>(false);
  const [rouletteHighlightedId, setRouletteHighlightedId] = useState<string | null>(null);
  const [rouletteWinnerInfo, setRouletteWinnerInfo] = useState<{
    categoryTitle: string;
    points: number;
  } | null>(null);
  const rouletteTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up any timeouts if component unmounts
  useEffect(() => {
    return () => {
      if (rouletteTimeoutRef.current) {
        clearTimeout(rouletteTimeoutRef.current);
      }
    };
  }, []);

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

  // Compile list of all currently unanswered questions on the board
  const unansweredQuestions = useMemo(() => {
    const list: {
      category: Category;
      question: Question;
      rowIndex: number;
    }[] = [];

    categories.forEach((cat) => {
      cat.questions?.forEach((q, rIdx) => {
        if (!isQuestionAnswered(q.id)) {
          list.push({
            category: cat,
            question: q,
            rowIndex: rIdx,
          });
        }
      });
    });

    return list;
  }, [categories, answeredQuestionIds]);

  // Mystery Question Roulette with thrilling fast-to-slow deceleration
  const handleStartRoulette = () => {
    if (isRouletteActive || unansweredQuestions.length === 0) return;

    setIsRouletteActive(true);
    setRouletteWinnerInfo(null);

    // Pick target winner question in advance
    const targetIndex = Math.floor(Math.random() * unansweredQuestions.length);
    const target = unansweredQuestions[targetIndex];

    // Deceleration schedule (milliseconds): starts blazing fast and progressively decelerates
    const DELAYS = [
      40, 40, 45, 45, 50, 50, 55, 60, 70, 80,
      95, 115, 140, 175, 220, 275, 345, 430, 530, 650, 800
    ];

    // Build the hopping journey across the board
    const sequence: typeof unansweredQuestions[0][] = [];
    let lastChosenId = '';

    for (let i = 0; i < DELAYS.length - 1; i++) {
      const pool = unansweredQuestions.filter((q) => q.question.id !== lastChosenId);
      const chosen = pool.length > 0
        ? pool[Math.floor(Math.random() * pool.length)]
        : unansweredQuestions[Math.floor(Math.random() * unansweredQuestions.length)];
      sequence.push(chosen);
      lastChosenId = chosen.question.id;
    }
    // Final destination: the winning target question
    sequence.push(target);

    // Recursive execution with dynamic decelerating delays
    const runStep = (stepIndex: number) => {
      if (stepIndex >= sequence.length) return;

      const currentItem = sequence[stepIndex];
      const isFinal = stepIndex === sequence.length - 1;

      setRouletteHighlightedId(currentItem.question.id);

      if (!isFinal) {
        // Sound pitch ascends slightly as anticipation peaks
        const progress = stepIndex / sequence.length;
        soundManager.playRouletteTick(0.85 + progress * 0.45);

        rouletteTimeoutRef.current = setTimeout(() => {
          runStep(stepIndex + 1);
        }, DELAYS[stepIndex]);
      } else {
        // Grand finale landing!
        soundManager.playRouletteWin();
        setRouletteWinnerInfo({
          categoryTitle: currentItem.category.title,
          points: currentItem.question.points,
        });

        // Hold winning card highlighted for dramatic suspense before launching
        rouletteTimeoutRef.current = setTimeout(() => {
          setIsRouletteActive(false);
          setRouletteHighlightedId(null);
          setRouletteWinnerInfo(null);
          onSelectQuestion(currentItem.category, currentItem.question, currentItem.rowIndex);
        }, 950);
      }
    };

    runStep(0);
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
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Mystery Roulette Random Picker Button */}
          <button
            type="button"
            onClick={handleStartRoulette}
            disabled={isRouletteActive || unansweredQuestions.length === 0}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl font-black text-xs sm:text-sm transition-all shadow-md select-none ${
              isRouletteActive
                ? 'bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 text-white animate-pulse shadow-purple-500/50 scale-105 ring-2 ring-amber-300'
                : unansweredQuestions.length === 0
                ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
                : 'bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-600/30 hover:shadow-purple-500/50 hover:scale-105 active:scale-95 border-2 border-purple-400/50 cursor-pointer'
            }`}
            title={
              unansweredQuestions.length === 0
                ? 'All questions on the board have already been answered!'
                : isRouletteActive
                ? 'Spinning Mystery Roulette...'
                : 'Random Mystery Question: Click for a dramatic fast-to-slow roulette pick!'
            }
          >
            <Dices className={`w-4 h-4 ${isRouletteActive ? 'animate-spin text-amber-300' : 'text-amber-300'}`} />
            <span>{isRouletteActive ? 'Choosing...' : 'Mystery Pick 🎲'}</span>
          </button>

          {/* Live Session PIN & QR Code trigger */}
          {sessionPin && (
            <button
              onClick={() => setShowShareModal(true)}
              disabled={isRouletteActive}
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
              title={`Start sudden-death playoff (${game.tieBreakerQuestions?.length || 0} contextual questions for ${game.title})`}
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>Tie Breaker</span>
              {Boolean(game.tieBreakerQuestions?.length) && (
                <span className="px-1.5 py-0.5 rounded-full bg-amber-500/30 text-[10px] text-amber-200 font-black border border-amber-400/40 leading-none">
                  {game.tieBreakerQuestions?.length}
                </span>
              )}
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

      {/* Thrill Roulette Indicator Banner */}
      {isRouletteActive && (
        <div className="mb-3 py-2.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-yellow-500/30 to-amber-500/20 border-2 border-amber-400 text-amber-200 text-center font-black flex items-center justify-center gap-2.5 shadow-xl shadow-amber-500/20 animate-pulse">
          <Sparkles className="w-5 h-5 text-amber-300 animate-spin" />
          <span className="text-xs sm:text-sm md:text-base uppercase tracking-wider text-amber-300 font-black">
            {rouletteWinnerInfo
              ? `🎯 Landed On: ${rouletteWinnerInfo.categoryTitle} for ${rouletteWinnerInfo.points} Points!`
              : '🎲 Mystery Question Roulette: Selecting a surprise card...'}
          </span>
          <Sparkles className="w-5 h-5 text-amber-300 animate-spin" />
        </div>
      )}

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
                const isRouletteTarget = rouletteHighlightedId === question.id;
                const isFinalWinner = !!rouletteWinnerInfo && isRouletteTarget;

                return (
                  <button
                    key={question.id}
                    disabled={answered || isRouletteActive}
                    onClick={() => {
                      soundManager.playFlip();
                      onSelectQuestion(category, question, rowIndex);
                    }}
                    className={`relative rounded-2xl p-2 sm:p-4 font-black transition-all duration-150 select-none flex items-center justify-center min-h-[65px] sm:min-h-[80px] ${
                      answered
                        ? 'bg-slate-900/40 border border-slate-800/60 text-slate-700 cursor-not-allowed shadow-inner'
                        : isFinalWinner
                        ? 'bg-gradient-to-br from-amber-400 via-yellow-300 to-amber-500 text-slate-950 ring-4 ring-amber-300 ring-offset-4 ring-offset-slate-950 scale-110 z-30 shadow-[0_0_40px_rgba(251,191,36,1)] animate-bounce font-black'
                        : isRouletteTarget
                        ? 'bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 text-white ring-4 ring-cyan-300 ring-offset-2 ring-offset-slate-950 scale-105 z-20 shadow-[0_0_35px_rgba(6,182,212,0.95)]'
                        : isRouletteActive
                        ? 'bg-gradient-to-b from-blue-900/30 via-indigo-950/30 to-indigo-950/30 border border-indigo-900/40 text-indigo-400/40 opacity-40 grayscale-[30%] cursor-not-allowed'
                        : 'bg-gradient-to-b from-blue-700 via-indigo-700 to-indigo-800 hover:from-blue-600 hover:to-indigo-700 border-2 border-indigo-400/50 hover:border-amber-400 text-amber-300 hover:text-white shadow-lg hover:shadow-indigo-500/30 hover:scale-[1.03] active:scale-95 cursor-pointer'
                    }`}
                  >
                    {answered ? (
                      <span className="text-xs sm:text-sm font-bold text-slate-600 tracking-wider">
                        ✓ DONE
                      </span>
                    ) : isFinalWinner ? (
                      <div className="flex flex-col items-center">
                        <span className="text-xl sm:text-3xl font-black tracking-tight text-slate-950 drop-shadow-sm">
                          {question.points}
                        </span>
                        <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-amber-950 bg-amber-200/90 px-1.5 py-0.5 rounded-full mt-0.5 shadow-sm">
                          ★ CHOSEN! ★
                        </span>
                      </div>
                    ) : isRouletteTarget ? (
                      <div className="flex flex-col items-center">
                        <span className="text-xl sm:text-3xl font-black drop-shadow tracking-tight text-white">
                          {question.points}
                        </span>
                        <span className="text-[9px] font-bold uppercase tracking-widest text-cyan-200 animate-pulse">
                          🎯 FOCUS
                        </span>
                      </div>
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
