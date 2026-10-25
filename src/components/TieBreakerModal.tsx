import React, { useState, useEffect } from 'react';
import { Zap, Trophy, Bell, RotateCcw, CheckCircle2, XCircle, ArrowRight, X, Sparkles, HelpCircle, ShieldAlert } from 'lucide-react';
import { Team, TieBreakerQuestion } from '../types/game';
import { Avatar } from './Avatar';
import { soundManager } from '../utils/soundEffects';
import { StreakName, StreakBadge, StreakAvatarAura } from './StreakFireEffect';


const DEFAULT_TIE_BREAKER_QUESTIONS: TieBreakerQuestion[] = [
  {
    id: 'tb-1',
    question: 'What is the only mammal capable of true, sustained flight?',
    answer: 'The Bat',
    hint: 'Belongs to the order Chiroptera.',
  },
  {
    id: 'tb-2',
    question: 'How many confirmed chemical elements are currently on the periodic table?',
    answer: '118 Elements',
    hint: 'Ends with Oganesson.',
  },
  {
    id: 'tb-3',
    question: 'In which ocean is the fabled Bermuda Triangle located?',
    answer: 'The Atlantic Ocean',
    hint: 'Between Miami, Bermuda, and Puerto Rico.',
  },
  {
    id: 'tb-4',
    question: 'Which planet in our solar system has the most confirmed natural moons (over 140)?',
    answer: 'Saturn',
    hint: 'Famous for its prominent rings.',
  },
  {
    id: 'tb-5',
    question: 'What is the only letter in the English alphabet that does not appear in any of the 50 US state names?',
    answer: 'The Letter Q',
    hint: 'Follows P in the alphabet.',
  },
  {
    id: 'tb-6',
    question: 'How many hearts does an octopus possess to pump blue blood?',
    answer: '3 Hearts',
    hint: 'Two pump blood to the gills, one to the body.',
  },
  {
    id: 'tb-7',
    question: 'What ancient wonder was located in Alexandria, Egypt and guided sailors across the Mediterranean?',
    answer: 'The Lighthouse of Alexandria (Pharos)',
    hint: 'One of the Seven Wonders of the Ancient World.',
  },
];

interface TieBreakerModalProps {
  teams: Record<string, Team>;
  onClose: () => void;
  onConfirmWinner: (winnerTeamId: string) => void;
  buzzedTeamId?: string | null;
  onClearBuzz?: () => void;
}

export const TieBreakerModal: React.FC<TieBreakerModalProps> = ({
  teams,
  onClose,
  onConfirmWinner,
  buzzedTeamId,
  onClearBuzz,
}) => {
  const teamsList = Object.values(teams);

  // Automatically find teams that tied for highest score
  const highestScore = Math.max(...teamsList.map((t) => t.score));
  const autoTiedTeams = teamsList.filter((t) => t.score === highestScore);

  // Allow selecting which teams participate if user wants custom tie breaker
  const [competingTeamIds, setCompetingTeamIds] = useState<string[]>(
    autoTiedTeams.length > 1
      ? autoTiedTeams.map((t) => t.id)
      : teamsList.slice(0, 2).map((t) => t.id)
  );

  const [questionIndex, setQuestionIndex] = useState<number>(0);
  const [customQuestion, setCustomQuestion] = useState<string>('');
  const [customAnswer, setCustomAnswer] = useState<string>('');
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState<boolean>(false);
  const [tieBreakerScores, setTieBreakerScores] = useState<Record<string, number>>({});
  const [winnerTeamId, setWinnerTeamId] = useState<string | null>(null);
  const [timerSeconds, setTimerSeconds] = useState<number>(15);
  const [isTimerPaused, setIsTimerPaused] = useState<boolean>(false);
  const [activeBuzzedId, setActiveBuzzedId] = useState<string | null>(buzzedTeamId || null);

  const currentQ = DEFAULT_TIE_BREAKER_QUESTIONS[questionIndex % DEFAULT_TIE_BREAKER_QUESTIONS.length];

  // Sync prop buzz
  useEffect(() => {
    if (buzzedTeamId) {
      setActiveBuzzedId(buzzedTeamId);
    }
  }, [buzzedTeamId]);

  // Sudden death timer
  useEffect(() => {
    if (isTimerPaused || timerSeconds <= 0 || winnerTeamId) return;
    const interval = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          soundManager.playTimeUp();
          return 0;
        }
        if (prev <= 5) {
          soundManager.playTimeLowTick(true);
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimerPaused, timerSeconds, winnerTeamId]);

  const handleCorrect = (teamId: string) => {
    soundManager.playCorrect();
    const newScores = {
      ...tieBreakerScores,
      [teamId]: (tieBreakerScores[teamId] || 0) + 1,
    };
    setTieBreakerScores(newScores);
    setWinnerTeamId(teamId);
    setIsAnswerRevealed(true);
  };

  const handleWrong = (teamId: string) => {
    soundManager.playWrong();
    setActiveBuzzedId(null);
    if (onClearBuzz) onClearBuzz();
  };

  const handleNextQuestion = () => {
    setQuestionIndex((prev) => prev + 1);
    setIsAnswerRevealed(false);
    setActiveBuzzedId(null);
    setTimerSeconds(15);
    setIsTimerPaused(false);
    if (onClearBuzz) onClearBuzz();
  };

  const handleFinalizeWinner = () => {
    if (winnerTeamId) {
      onConfirmWinner(winnerTeamId);
    }
  };

  const toggleTeamParticipation = (id: string) => {
    if (competingTeamIds.includes(id)) {
      if (competingTeamIds.length > 2) {
        setCompetingTeamIds(competingTeamIds.filter((t) => t !== id));
      }
    } else {
      setCompetingTeamIds([...competingTeamIds, id]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/90 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-3xl bg-slate-900 border-2 border-amber-500 rounded-3xl shadow-2xl shadow-amber-500/20 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-amber-600/30 via-slate-900 to-amber-600/30 px-6 py-4 border-b border-amber-500/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500 text-slate-950 font-black shadow-md">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white tracking-wide">
                  Sudden Death Tie Breaker
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-extrabold text-[10px] uppercase border border-amber-500/40">
                  Optional Playoff
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                Resolves 1st place champion without altering classroom leaderboard total points
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notice Banner */}
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-2.5 flex items-center gap-2 text-xs text-amber-300">
          <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400" />
          <span>
            <strong>Isolated Scoring:</strong> Points earned in this tie breaker session decide the winner of this match only and will NOT inflate normal board points.
          </span>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 flex flex-col items-center text-center">
          {/* Competing Teams Selector & Scoreboard */}
          <div className="w-full">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Competing Teams in Tie Breaker
            </span>
            <div className="flex flex-wrap justify-center gap-3">
              {teamsList.map((team) => {
                const isSelected = competingTeamIds.includes(team.id);
                const tbScore = tieBreakerScores[team.id] || 0;
                const isBuzzed = activeBuzzedId === team.id;
                const isWinner = winnerTeamId === team.id;

                return (
                  <button
                    key={team.id}
                    type="button"
                    onClick={() => toggleTeamParticipation(team.id)}
                    className={`p-3 rounded-2xl border-2 transition-all flex items-center gap-3 select-none ${
                      isWinner
                        ? 'bg-amber-500/20 border-amber-400 shadow-lg shadow-amber-500/30 ring-2 ring-amber-400'
                        : isBuzzed
                        ? 'bg-rose-500/20 border-rose-400 animate-pulse'
                        : isSelected
                        ? 'bg-slate-950 border-amber-500/60'
                        : 'bg-slate-950/40 border-slate-800 opacity-50'
                    }`}
                  >
                    <StreakAvatarAura streak={team.streak || 0}>
                      <Avatar avatarId={team.avatarId} size="sm" />
                    </StreakAvatarAura>
                    <div className="text-left">
                      <div className="text-xs font-black text-white flex items-center gap-1.5">
                        <StreakName name={team.name} streak={team.streak || 0} size="xs" />
                        {isWinner && <span>👑</span>}
                        {(team.streak || 0) >= 2 && <StreakBadge streak={team.streak || 0} size="xs" />}
                      </div>
                      <div className="text-[11px] font-mono font-bold text-amber-400">
                        Board: {team.score} PTS • <span className="text-emerald-400">TB: {tbScore}</span>
                      </div>
                    </div>
                  </button>

                );
              })}
            </div>
          </div>

          {/* Sudden Death Question Arena */}
          {!winnerTeamId ? (
            <div className="w-full max-w-2xl bg-slate-950/80 border-2 border-indigo-900/60 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-amber-400">
                  Question #{questionIndex + 1}
                </span>

                {/* Blitz Countdown Badge */}
                <div
                  className={`px-3 py-1 rounded-xl flex items-center gap-1.5 font-mono font-black text-sm border ${
                    timerSeconds <= 5
                      ? 'bg-rose-500/20 border-rose-500 text-rose-400 animate-pulse'
                      : 'bg-slate-800 border-slate-700 text-white'
                  }`}
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>{timerSeconds}s</span>
                </div>
              </div>

              {/* Question Text */}
              <p className="text-lg sm:text-2xl font-black text-white leading-relaxed">
                "{isCustomMode && customQuestion ? customQuestion : currentQ.question}"
              </p>

              {/* Answer Box */}
              {isAnswerRevealed ? (
                <div className="p-4 bg-emerald-950/50 border border-emerald-500/60 rounded-2xl animate-scaleUp">
                  <span className="text-[10px] font-extrabold uppercase text-emerald-400 tracking-wider block mb-0.5">
                    Answer
                  </span>
                  <p className="text-base sm:text-xl font-black text-white">
                    {isCustomMode && customAnswer ? customAnswer : currentQ.answer}
                  </p>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsAnswerRevealed(true)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs border border-slate-700 transition-colors"
                >
                  Reveal Answer
                </button>
              )}

              {/* Buzzer Alert */}
              {activeBuzzedId && (() => {
                const bStreak = teams[activeBuzzedId]?.streak || 0;
                return (
                  <div className={`p-3 rounded-2xl flex items-center justify-between animate-bounce-subtle border ${
                    bStreak >= 2
                      ? 'bg-gradient-to-r from-orange-950/70 to-slate-900 border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.4)] animate-fire-glow'
                      : 'bg-amber-500/20 border-amber-400'
                  }`}>
                    <div className="flex items-center gap-2">
                      <StreakAvatarAura streak={bStreak}>
                        <Avatar avatarId={teams[activeBuzzedId]?.avatarId} size="sm" />
                      </StreakAvatarAura>
                      <div className="flex items-center gap-1.5">
                        <StreakName name={teams[activeBuzzedId]?.name || ''} streak={bStreak} size="sm" />
                        <span className="text-xs text-amber-300 font-bold">Buzzed In!</span>
                        {bStreak >= 2 && <StreakBadge streak={bStreak} size="xs" />}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleCorrect(activeBuzzedId)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shadow"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Correct (Wins Tie!)</span>
                      </button>
                      <button
                        onClick={() => handleWrong(activeBuzzedId)}
                        className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1 shadow"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Wrong</span>
                      </button>
                    </div>
                  </div>
                );
              })()}

            </div>
          ) : (
            /* Tie Resolved Celebration Box */
            <div className="w-full max-w-lg bg-gradient-to-b from-amber-500/20 via-slate-900 to-slate-900 border-2 border-amber-400 rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xl animate-scaleUp">
              <span className="w-12 h-12 rounded-full bg-amber-400 text-slate-950 font-black text-xl flex items-center justify-center mx-auto shadow-lg">
                👑
              </span>
              <Avatar avatarId={teams[winnerTeamId]?.avatarId} size="xl" className="mx-auto" />
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-amber-400">
                  Sudden Death Winner
                </span>
                <h3 className="text-2xl font-black text-white mt-1">
                  {teams[winnerTeamId]?.name}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Successfully broke the tie to secure 1st Place!
                </p>
              </div>

              <button
                type="button"
                onClick={handleFinalizeWinner}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/20 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
              >
                <span>Crown Champion & View Podium</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Quick Manual Award (if students answered verbally without buzzer) */}
          {!winnerTeamId && (
            <div className="w-full max-w-2xl bg-slate-950/60 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="text-left">
                <span className="text-xs font-bold text-slate-300">
                  Manual Award (Verbal Classroom Answer):
                </span>
                <p className="text-[11px] text-slate-500">
                  Click a team to award the tie breaker victory immediately.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {competingTeamIds.map((id) => (
                  <button
                    key={`award-${id}`}
                    type="button"
                    onClick={() => handleCorrect(id)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-emerald-600 text-slate-200 hover:text-white font-bold text-xs border border-slate-700 transition-colors flex items-center gap-1.5"
                  >
                    <span>{teams[id]?.name} Wins</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Controls */}
        <div className="bg-slate-950 border-t border-slate-800 px-6 py-4 flex items-center justify-between">
          <button
            type="button"
            onClick={handleNextQuestion}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs border border-slate-700 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Next Tie Breaker Question</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
          >
            Return to Normal Board
          </button>
        </div>
      </div>
    </div>
  );
};
