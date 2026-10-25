import React, { useState, useEffect } from 'react';
import { Radio, Users, Sparkles, AlertCircle, Zap, Trophy, Flame, CheckCircle, ShieldAlert, Clock, ChevronRight, Eye, EyeOff, HelpCircle } from 'lucide-react';
import { GameSession, Team, BuzzerQueueItem } from '../types/game';
import { Avatar, AVATAR_OPTIONS, getRandomTeam } from './Avatar';
import { soundManager } from '../utils/soundEffects';
import { StreakName, StreakBadge, StreakCelebrationBanner, StreakAvatarAura } from './StreakFireEffect';

interface BuzzerRemoteProps {
  currentSession: GameSession | null;
  onJoinSession: (pin: string, team: { name: string; avatarId: string; color: string }) => Promise<{ success: boolean; teamId?: string; error?: string }>;
  onBuzzIn: (sessionId: string, teamId: string) => Promise<void>;
  onLeaveSession: () => void;
  joinedTeamId?: string | null;
}

export const BuzzerRemote: React.FC<BuzzerRemoteProps> = ({
  currentSession,
  onJoinSession,
  onBuzzIn,
  onLeaveSession,
  joinedTeamId: propTeamId,
}) => {
  const [pinInput, setPinInput] = useState<string>('');
  const [teamName, setTeamName] = useState<string>('');
  const [selectedAvatarId, setSelectedAvatarId] = useState<string>('robo');
  const [isJoining, setIsJoining] = useState<boolean>(false);
  const [joinError, setJoinError] = useState<string>('');
  const [myTeamId, setMyTeamId] = useState<string | null>(propTeamId || null);
  const [isQuestionHidden, setIsQuestionHidden] = useState<boolean>(false);

  // When a new question is opened by the teacher, show the question to the student by default
  useEffect(() => {
    if (currentSession?.activeQuestion) {
      setIsQuestionHidden(false);
    }
  }, [currentSession?.activeQuestion?.questionId]);

  // Auto-detect PIN from URL query param (e.g. when scanned via QR code)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlPin = params.get('pin') || params.get('join');
      if (urlPin) {
        const clean = urlPin.toUpperCase();
        setPinInput(clean);
        // Check if student already joined this session previously on this device
        try {
          const stored = localStorage.getItem(`edujeopardy_student_team_${clean}`);
          if (stored) {
            setMyTeamId(stored);
          }
        } catch {}
      }
    }
  }, []);

  // Check stored team id when pinInput changes
  useEffect(() => {
    const cleanPin = pinInput.trim().toUpperCase();
    if (cleanPin) {
      try {
        const stored = localStorage.getItem(`edujeopardy_student_team_${cleanPin}`);
        if (stored && !myTeamId) {
          setMyTeamId(stored);
        }
      } catch {}
    }
  }, [pinInput, myTeamId]);

  // Sync prop team id
  useEffect(() => {
    if (propTeamId) {
      setMyTeamId(propTeamId);
    }
  }, [propTeamId]);

  // Initialize random team details
  useEffect(() => {
    if (!teamName) {
      const random = getRandomTeam();
      setTeamName(random.name);
      setSelectedAvatarId(random.avatarId);
    }
  }, [teamName]);

  const handleRandomize = () => {
    const random = getRandomTeam();
    setTeamName(random.name);
    setSelectedAvatarId(random.avatarId);
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isJoining) return;
    setJoinError('');

    const cleanPin = pinInput.trim().toUpperCase();
    if (!cleanPin) {
      setJoinError('Please enter a Game PIN');
      return;
    }
    if (!teamName.trim()) {
      setJoinError('Please enter a team name');
      return;
    }

    // Check if device already joined this room
    try {
      const existingTeamId = localStorage.getItem(`edujeopardy_student_team_${cleanPin}`);
      if (existingTeamId && currentSession?.teams?.[existingTeamId]) {
        setMyTeamId(existingTeamId);
        return;
      }
    } catch {}

    // Prevent duplicate team name if currentSession data is present
    if (currentSession?.teams) {
      const isDuplicateName = Object.values(currentSession.teams).some(
        (t) => t.name.toLowerCase() === teamName.trim().toLowerCase()
      );
      if (isDuplicateName) {
        setJoinError('A team with this name already joined the room. Please choose another name.');
        return;
      }
    }

    setIsJoining(true);
    try {
      const selectedAvatar = AVATAR_OPTIONS.find((a) => a.id === selectedAvatarId) || AVATAR_OPTIONS[0];
      const res = await onJoinSession(cleanPin, {
        name: teamName.trim(),
        avatarId: selectedAvatarId,
        color: selectedAvatar.primaryColor,
      });

      if (res.success && res.teamId) {
        setMyTeamId(res.teamId);
        // Persist join so same student does not join repeatedly
        try {
          localStorage.setItem(`edujeopardy_student_team_${cleanPin}`, res.teamId);
        } catch {}
      } else {
        setJoinError(res.error || 'Game session not found. Please check the PIN.');
      }
    } catch (err: unknown) {
      setJoinError(err instanceof Error ? err.message : 'Failed to join game');
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeave = () => {
    if (currentSession?.pin) {
      try {
        localStorage.removeItem(`edujeopardy_student_team_${currentSession.pin}`);
      } catch {}
    }
    setMyTeamId(null);
    onLeaveSession();
  };

  const handleBuzzerClick = async () => {
    if (!currentSession || !myTeamId) return;

    // Check if team already attempted this question and missed
    if (currentSession.attemptedTeamIds?.includes(myTeamId)) {
      return;
    }

    // Check if team already in buzzer queue
    const inQueue = currentSession.buzzerQueue?.some((item) => item.teamId === myTeamId);
    if (inQueue) return;

    soundManager.playBuzzer();

    // Haptic vibration feedback on phones
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([120, 60, 120]);
      } catch {}
    }

    try {
      await onBuzzIn(currentSession.id, myTeamId);
    } catch (err) {
      console.error('Buzzer error:', err);
    }
  };

  // If not joined to any session, show the Join form
  if (!currentSession || !myTeamId || !currentSession.teams?.[myTeamId]) {
    return (
      <div className="flex-1 flex items-center justify-center p-3 sm:p-4">
        <div className="w-full max-w-md bg-slate-900 border-2 border-indigo-700/60 rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-2xl space-y-4 sm:space-y-6">
          <div className="text-center space-y-1.5 sm:space-y-2">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center mx-auto shadow-lg shadow-cyan-500/25">
              <Zap className="w-7 h-7 sm:w-9 sm:h-9 text-white fill-current" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">Join Classroom Game</h2>
            <p className="text-xs text-slate-300">
              Enter your room PIN and pick your avatar to buzz in!
            </p>
          </div>

          {joinError && (
            <div className="p-2.5 sm:p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{joinError}</span>
            </div>
          )}

          <form onSubmit={handleJoin} className="space-y-3.5 sm:space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Game PIN
                </label>
                {pinInput && (
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    PIN Detected
                  </span>
                )}
              </div>
              <input
                type="text"
                placeholder="e.g. 748219"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                maxLength={10}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-950 border-2 border-indigo-500/50 focus:border-amber-400 rounded-xl font-mono text-center text-2xl sm:text-3xl font-black text-amber-400 tracking-widest placeholder:text-slate-600 focus:outline-none transition-colors"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Your Team Name
                </label>
                <button
                  type="button"
                  onClick={handleRandomize}
                  className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Randomize</span>
                </button>
              </div>
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                maxLength={35}
                placeholder="Team Name"
                className="w-full px-3.5 sm:px-4 py-2.5 bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-xl font-extrabold text-sm sm:text-base text-white placeholder:text-slate-600 focus:outline-none"
                required
              />
            </div>

            {/* Avatar Selector - 4 columns on narrow mobile, 6 on wider */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Choose Animated Avatar
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 sm:gap-2 bg-slate-950/60 p-2 sm:p-2.5 rounded-2xl border border-slate-800">
                {AVATAR_OPTIONS.map((avatar) => (
                  <button
                    key={avatar.id}
                    type="button"
                    onClick={() => setSelectedAvatarId(avatar.id)}
                    className={`p-1 sm:p-1.5 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                      selectedAvatarId === avatar.id
                        ? 'bg-indigo-600/40 ring-2 ring-amber-400 scale-105 shadow-md'
                        : 'hover:bg-slate-800 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <Avatar avatarId={avatar.id} size="sm" />
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isJoining}
              className="w-full py-3.5 sm:py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-sm sm:text-base shadow-xl shadow-teal-500/25 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isJoining ? 'Connecting to Room...' : 'Enter Game (Join Once)'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Active Buzzer Screen
  const myTeam = currentSession.teams[myTeamId];
  const activeQ = currentSession.activeQuestion;
  const isQuestionActive = !!activeQ;

  // Buzzer Queue Data
  const queue: BuzzerQueueItem[] = currentSession.buzzerQueue || (currentSession.buzzedTeam ? [currentSession.buzzedTeam] : []);
  const myQueueIndex = queue.findIndex((item) => item.teamId === myTeamId);
  const isMyTeamInQueue = myQueueIndex !== -1;
  const isMyTeamFirstInQueue = myQueueIndex === 0;
  const firstTeamInQueue = queue[0];
  const isBuzzedByOther = !!firstTeamInQueue && firstTeamInQueue.teamId !== myTeamId;
  const hasAttemptedAndMissed = currentSession.attemptedTeamIds?.includes(myTeamId) || false;

  const myStreak = myTeam.streak || 0;
  const hasStreak = myStreak >= 2;
  const firstTeamStreak = currentSession?.teams?.[firstTeamInQueue?.teamId || '']?.streak || 0;

  return (
    <div className="flex-1 flex flex-col justify-between p-3 sm:p-4 max-w-md mx-auto w-full select-none min-h-full">
      {/* Top Team Header on Phone */}
      <div className={`w-full rounded-2xl p-2.5 sm:p-3.5 flex items-center justify-between shadow-lg transition-all shrink-0 ${
        hasStreak
          ? 'bg-gradient-to-r from-orange-950/70 via-slate-900 to-amber-950/70 border-2 border-orange-500/80 shadow-[0_0_20px_rgba(249,115,22,0.35)] animate-fire-glow'
          : 'bg-slate-900 border border-indigo-900/60'
      }`}>
        <div className="flex items-center gap-2.5 sm:gap-3">
          <StreakAvatarAura streak={myStreak}>
            <Avatar avatarId={myTeam.avatarId} size="md" />
          </StreakAvatarAura>
          <div className="text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Your Team
              </span>
              {hasStreak && <StreakBadge streak={myStreak} size="xs" />}
            </div>
            <StreakName
              name={myTeam.name}
              streak={myStreak}
              size="md"
              className="max-w-[130px] sm:max-w-[170px]"
            />
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Total Score
          </span>
          <div className={`text-base sm:text-lg font-mono font-black ${hasStreak ? 'text-yellow-300' : 'text-amber-400'}`}>
            {myTeam.score} PTS
          </div>
        </div>
      </div>

      {/* Prominent On-Fire Celebration Banner for Student Phone */}
      {hasStreak && (
        <div className="my-1.5 sm:my-2 shrink-0">
          <StreakCelebrationBanner streak={myStreak} teamName={myTeam.name} />
        </div>
      )}

      {/* MAIN GAMEPLAY ARENA ON STUDENT PHONE */}
      {isQuestionActive && activeQ ? (
        !isQuestionHidden ? (
          /* =======================================================
             STATE A: QUESTION DISPLAY VIEW
             Students see the active question, point value, and category.
             They have an explicit button to hide the question to reveal
             the full-screen arcade buzzer, or can buzz right here.
             ======================================================= */
          <div className="my-auto py-2 flex flex-col items-center justify-center w-full space-y-3 animate-fadeIn">
            {/* Live Active Question Header Pill */}
            <div className="w-full p-2 rounded-xl bg-indigo-950/90 border border-indigo-800 text-center shadow-md">
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <span className="text-[11px] font-black uppercase text-indigo-300 truncate max-w-[180px]">
                  {activeQ.categoryTitle}
                </span>
                <span className="text-[11px] font-black text-amber-400 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 font-mono">
                  {activeQ.points} PTS
                </span>
                {activeQ.isDailyDouble && (
                  <span className="text-[10px] font-black text-rose-400 px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/30 animate-pulse">
                    ★ DAILY DOUBLE
                  </span>
                )}
              </div>
            </div>

            {/* Question Text Card */}
            <div className="w-full bg-slate-900/95 border-2 border-indigo-600/70 rounded-2xl p-4 sm:p-5 shadow-2xl space-y-3 text-left">
              <div className="flex items-center justify-between text-xs font-black uppercase text-indigo-300 border-b border-indigo-800/60 pb-2">
                <span>Question</span>
                <span className="text-emerald-400 flex items-center gap-1 font-bold lowercase text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  live on board
                </span>
              </div>

              <div className="text-base sm:text-xl font-black text-white leading-snug max-h-[30vh] overflow-y-auto pr-1">
                {activeQ.question}
              </div>

              {/* Multiple Choice Options (if present) */}
              {Array.isArray(activeQ.options) && activeQ.options.length > 0 && (
                <div className="grid grid-cols-1 gap-1.5 pt-1 max-h-[22vh] overflow-y-auto">
                  {activeQ.options.map((opt, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-2 rounded-xl bg-slate-950/70 border border-indigo-900/80 text-xs sm:text-sm font-bold text-slate-200"
                    >
                      <span className="w-5 h-5 rounded-md bg-indigo-600/50 flex items-center justify-center text-[10px] font-black text-white shrink-0">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="leading-snug">{opt}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Button to Hide Question & Reveal Buzzer Button */}
              <button
                type="button"
                onClick={() => setIsQuestionHidden(true)}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-indigo-200 hover:text-white border border-indigo-500/40 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95"
              >
                <EyeOff className="w-4 h-4 text-indigo-400" />
                <span>Hide Question to Reveal Buzzer Button</span>
              </button>
            </div>

            {/* Quick Buzz Action directly on Question Screen */}
            <div className="w-full pt-1">
              {hasAttemptedAndMissed ? (
                <div className="p-3 bg-rose-500/10 border border-rose-500/40 rounded-xl text-center">
                  <span className="text-xs font-black text-rose-300">
                    Attempt Used for This Question
                  </span>
                </div>
              ) : isMyTeamFirstInQueue ? (
                <div className="p-3 bg-amber-500/20 border-2 border-amber-400 rounded-xl text-center animate-pulse">
                  <span className="text-sm font-black text-amber-300">
                    👑 YOU'RE UP! Answer out loud now!
                  </span>
                </div>
              ) : isMyTeamInQueue ? (
                <div className="p-3 bg-indigo-500/20 border border-indigo-500/40 rounded-xl text-center">
                  <span className="text-xs font-black text-indigo-200">
                    Queue Rank #{myQueueIndex + 1} — In line to steal if 1st team is wrong!
                  </span>
                </div>
              ) : isBuzzedByOther ? (
                <div className="space-y-2 w-full">
                  <div className="p-2 bg-slate-900 border border-amber-500/40 rounded-xl flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-bold">1st to Buzz:</span>
                    <span className="text-amber-400 font-black">{firstTeamInQueue.teamName}</span>
                  </div>
                  <button
                    onClick={handleBuzzerClick}
                    className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-extrabold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/30 transition-all"
                  >
                    <Radio className="w-4 h-4" />
                    <span>Queue Buzz (Steal Opportunity)</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleBuzzerClick}
                  className="w-full py-3.5 sm:py-4 rounded-2xl bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 hover:from-rose-500 hover:to-red-500 active:scale-95 text-white font-black text-lg sm:text-xl tracking-wider shadow-xl shadow-red-600/40 border-2 border-red-400/50 flex items-center justify-center gap-2.5 cursor-pointer transition-all"
                >
                  <Radio className="w-6 h-6 animate-pulse" />
                  <span>BUZZ IN NOW!</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          /* =======================================================
             STATE B: BUZZER REVEALED VIEW (Question is Hidden)
             Full tactile buzzer button with sticky Show Question button
             ======================================================= */
          <div className="my-auto py-2 flex flex-col items-center justify-center text-center space-y-3 w-full animate-fadeIn">
            {/* Sticky Top Bar: Points, Category & "Show Question" Button */}
            <div className="w-full p-2 sm:p-2.5 rounded-xl bg-indigo-950/90 border border-indigo-800 flex items-center justify-between shadow-md">
              <div className="flex items-center gap-2 truncate mr-2">
                <span className="text-amber-400 font-mono text-xs font-black">{activeQ.points} PTS</span>
                <span className="text-xs font-bold text-indigo-200 truncate">{activeQ.categoryTitle}</span>
              </div>
              <button
                type="button"
                onClick={() => setIsQuestionHidden(false)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow transition-all shrink-0 cursor-pointer active:scale-95"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Show Question</span>
              </button>
            </div>

            {/* Central Tactile Buzzer & Queue States */}
            {hasAttemptedAndMissed ? (
              /* When THIS team already attempted this question and missed */
              <div className="space-y-3 w-full flex flex-col items-center py-4">
                <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-full bg-slate-900 border-4 border-rose-500/50 flex flex-col items-center justify-center p-4 shadow-xl">
                  <ShieldAlert className="w-10 h-10 sm:w-12 sm:h-12 text-rose-400 mb-2" />
                  <span className="text-sm sm:text-base font-black text-white">
                    Attempt Used
                  </span>
                  <span className="text-xs text-rose-300 font-bold mt-1">
                    Opportunity Passed
                  </span>
                </div>
                <p className="text-xs text-slate-400 max-w-xs">
                  Your team already took a guess on this question. Keep your buzzer ready for the next round!
                </p>
              </div>
            ) : isMyTeamFirstInQueue ? (
              /* When THIS Team Buzzed In FIRST (#1 in Queue) */
              <div className="space-y-3 w-full flex flex-col items-center py-2 animate-scaleUp">
                <div className={`w-52 h-52 sm:w-60 sm:h-60 rounded-full p-3 shadow-2xl flex items-center justify-center animate-pulse ${
                  hasStreak
                    ? 'bg-gradient-to-br from-red-500 via-orange-400 to-amber-400 shadow-orange-500/60'
                    : 'bg-gradient-to-br from-amber-400 via-yellow-400 to-amber-500 shadow-amber-500/50'
                }`}>
                  <div className="w-full h-full rounded-full bg-slate-950 flex flex-col items-center justify-center p-3 sm:p-4">
                    {hasStreak ? (
                      <Flame className="w-12 h-12 text-orange-500 fill-amber-400 mb-1.5 animate-flame" />
                    ) : (
                      <Trophy className="w-12 h-12 text-amber-400 mb-1.5 animate-bounce-subtle" />
                    )}
                    <span className="text-xl sm:text-2xl font-black text-white tracking-wider">
                      YOU'RE UP!
                    </span>
                    <span className="text-xs text-amber-300 font-extrabold mt-1">
                      {hasStreak ? `Answer to keep your ${myStreak}-streak burning!` : 'You buzzed in FIRST! Answer now!'}
                    </span>
                  </div>
                </div>

                <div className="px-3.5 py-1.5 rounded-xl text-xs font-bold border bg-amber-500/20 border-amber-500/50 text-amber-200">
                  👑 Your buzzer locked in 1st place!
                </div>
              </div>
            ) : isMyTeamInQueue ? (
              /* When THIS Team is #2, #3, etc. in Queue */
              <div className="space-y-3 w-full flex flex-col items-center py-2 animate-scaleUp">
                <div className="w-48 h-48 sm:w-52 sm:h-52 rounded-full bg-slate-900 border-4 border-indigo-500 flex flex-col items-center justify-center p-4 shadow-xl">
                  <Clock className="w-10 h-10 text-indigo-400 animate-pulse mb-2" />
                  <span className="text-lg sm:text-xl font-black text-white">
                    Queue Rank #{myQueueIndex + 1}
                  </span>
                  <span className="text-xs text-indigo-300 font-extrabold mt-1">
                    You're in line to steal!
                  </span>
                </div>

                <div className="px-3.5 py-1.5 rounded-xl text-xs font-bold border bg-indigo-500/20 border-indigo-500/40 text-indigo-200 max-w-xs">
                  If Team #{myQueueIndex} answers wrong, you automatically step up to answer!
                </div>
              </div>
            ) : isBuzzedByOther ? (
              /* Another team buzzed first, but THIS team can still buzz to get in line! */
              <div className="space-y-3 w-full flex flex-col items-center animate-fadeIn">
                {/* Notification of who buzzed in first */}
                <div className="w-full bg-slate-900 border-2 border-amber-500/60 rounded-2xl p-2.5 sm:p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <StreakAvatarAura streak={firstTeamStreak}>
                      <Avatar avatarId={firstTeamInQueue.avatarId} size="sm" />
                    </StreakAvatarAura>
                    <div className="text-left">
                      <span className="text-[10px] font-black uppercase text-amber-400">
                        👑 Buzzed in 1st:
                      </span>
                      <div className="text-xs font-black text-white truncate max-w-[150px]">
                        {firstTeamInQueue.teamName}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-lg border border-amber-500/30 font-bold shrink-0">
                    Answering Now
                  </span>
                </div>

                {/* Queue Buzz Button */}
                <div className="space-y-2 flex flex-col items-center py-2">
                  <span className="text-xs text-slate-300 font-bold">
                    Want to steal if they are wrong? Tap to queue!
                  </span>
                  <button
                    onClick={handleBuzzerClick}
                    className="w-48 h-48 sm:w-52 sm:h-52 rounded-full bg-gradient-to-b from-indigo-600 via-indigo-700 to-indigo-900 hover:from-indigo-500 hover:to-indigo-800 p-3 shadow-xl border-4 border-indigo-400/40 hover:scale-105 active:scale-95 transition-all flex items-center justify-center cursor-pointer group"
                  >
                    <div className="w-full h-full rounded-full bg-slate-950 flex flex-col items-center justify-center p-3">
                      <Radio className="w-9 h-9 text-indigo-400 group-hover:scale-110 transition-transform mb-1" />
                      <span className="text-xl sm:text-2xl font-black text-white">
                        QUEUE BUZZ
                      </span>
                      <span className="text-[10px] font-bold text-indigo-300 uppercase mt-1">
                        Tap to be next in line
                      </span>
                    </div>
                  </button>
                </div>
              </div>
            ) : (
              /* Question is Active & No One Has Buzzed Yet - GIANT TACTILE BUZZER BUTTON */
              <div className="space-y-3 sm:space-y-4 flex flex-col items-center w-full py-2">
                <div className="text-center animate-bounce-subtle">
                  <span className="px-3.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border-2 border-emerald-500/50 text-[11px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20">
                    ● BUZZER LIVE — HIT NOW!
                  </span>
                </div>

                <button
                  onClick={handleBuzzerClick}
                  className="w-56 h-56 sm:w-64 sm:h-64 rounded-full bg-gradient-to-b from-rose-500 via-red-600 to-rose-700 active:from-red-700 active:to-red-800 p-3.5 sm:p-4 shadow-2xl shadow-red-500/60 border-4 border-red-300/50 hover:scale-105 active:scale-95 transition-all flex items-center justify-center cursor-pointer group"
                >
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-red-600 via-rose-600 to-red-800 border-4 border-red-400/80 flex flex-col items-center justify-center shadow-inner">
                    <Radio className="w-12 h-12 text-white group-hover:scale-110 transition-transform mb-1.5 animate-pulse" />
                    <span className="text-3xl sm:text-4xl font-black text-white tracking-widest drop-shadow-lg">
                      BUZZ!
                    </span>
                    <span className="text-[10px] sm:text-[11px] font-black text-amber-200 uppercase tracking-widest mt-1">
                      TAP TO ANSWER
                    </span>
                  </div>
                </button>
              </div>
            )}
          </div>
        )
      ) : (
        /* Waiting for Host to Open Question Tile */
        <div className="my-auto py-6 flex flex-col items-center justify-center text-center space-y-3 sm:space-y-4 w-full">
          <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-slate-900 border-2 border-indigo-700/60 flex flex-col items-center justify-center shadow-xl">
            <Radio className="w-10 h-10 sm:w-12 sm:h-12 text-indigo-400 animate-pulse mb-2" />
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
              Radar Active
            </span>
          </div>

          <div className="space-y-1">
            <h4 className="text-base font-black text-white">
              Eyes on the Board!
            </h4>
            <p className="text-xs text-slate-400 max-w-xs">
              Your teacher is picking a question. Your buzzer button will activate automatically!
            </p>
          </div>
        </div>
      )}

      {/* Bottom Info & Exit Bar on Phone */}
      <div className="w-full flex items-center justify-between text-xs text-slate-400 pt-2.5 sm:pt-3 border-t border-slate-800/80 shrink-0">
        <div className="flex items-center gap-1.5 font-mono">
          <span className="text-slate-500">Room PIN:</span>
          <strong className="text-amber-400 font-black">{currentSession.pin}</strong>
        </div>
        <button
          onClick={handleLeave}
          className="text-rose-400 hover:text-rose-300 font-bold transition-colors cursor-pointer py-1 px-2"
        >
          Exit Room
        </button>
      </div>
    </div>
  );
};
