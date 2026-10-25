/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { BoardView } from './components/BoardView';
import { QuestionModal } from './components/QuestionModal';
import { BuzzerRemote } from './components/BuzzerRemote';
import { BoardEditor } from './components/BoardEditor';
import { LeaderboardView } from './components/LeaderboardView';
import { SessionLobby } from './components/SessionLobby';
import { VictoryModal } from './components/VictoryModal';
import { TieBreakerModal } from './components/TieBreakerModal';
import { SoundSettingsModal } from './components/SoundSettingsModal';
import { WaitingRoom } from './components/WaitingRoom';
import { Game, Category, Question, Team, ActiveQuestionState, GameSession, LeaderboardEntry, BuzzerQueueItem } from './types/game';
import { DEFAULT_GAMES } from './utils/defaultGames';
import { soundManager } from './utils/soundEffects';
import { db, handleFirestoreError, OperationType, testConnection } from './firebase';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  onSnapshot,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'play' | 'editor' | 'buzzer' | 'leaderboard'>('play');
  const [isMuted, setIsMuted] = useState<boolean>(soundManager.getIsMuted());

  // Saved Games Library
  const [gamesList, setGamesList] = useState<Game[]>(() => {
    try {
      const saved = localStorage.getItem('edujeopardy_custom_games');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return [...parsed, ...DEFAULT_GAMES];
        }
      }
    } catch {}
    return DEFAULT_GAMES;
  });

  // Current Active Game & Session
  const [activeGame, setActiveGame] = useState<Game | null>(null);
  const [activeSession, setActiveSession] = useState<GameSession | null>(null);
  const [teams, setTeams] = useState<Record<string, Team>>({});
  const [answeredQuestionIds, setAnsweredQuestionIds] = useState<string[]>([]);
  const [activeQuestion, setActiveQuestion] = useState<ActiveQuestionState | null>(null);
  const [buzzedTeam, setBuzzedTeam] = useState<GameSession['buzzedTeam']>(null);

  // Settings
  const [penaltyForWrong, setPenaltyForWrong] = useState<boolean>(true);
  const [defaultTimerSeconds, setDefaultTimerSeconds] = useState<number>(30);
  const [showVictory, setShowVictory] = useState<boolean>(false);
  const [showTieBreaker, setShowTieBreaker] = useState<boolean>(false);
  const [tieBreakerWinnerId, setTieBreakerWinnerId] = useState<string | null>(null);
  const [showSoundSettings, setShowSoundSettings] = useState<boolean>(false);
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [studentJoinedTeamId, setStudentJoinedTeamId] = useState<string | null>(null);
  const [isWaitingRoomActive, setIsWaitingRoomActive] = useState<boolean>(false);

  // Timer reference to avoid sound duplications
  const lastTickSecondRef = useRef<number>(-1);
  const timeUpSoundFiredRef = useRef<boolean>(false);

  // Initialize sound, test connection, and check for QR code join parameter
  useEffect(() => {
    soundManager.initSound();
    testConnection().catch(() => {});

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('pin') || params.get('join')) {
        setCurrentTab('buzzer');
      }
    }
  }, []);

  // Timer interval for active question
  useEffect(() => {
    if (!activeQuestion || activeQuestion.isPaused || activeQuestion.remainingSeconds <= 0) {
      return;
    }

    const interval = setInterval(() => {
      setActiveQuestion((prev) => {
        if (!prev || prev.isPaused || prev.remainingSeconds <= 0) {
          return prev;
        }

        const nextSec = prev.remainingSeconds - 1;

        // Play ticking sound in the last 5 seconds
        if (nextSec <= 5 && nextSec > 0 && nextSec !== lastTickSecondRef.current) {
          lastTickSecondRef.current = nextSec;
          soundManager.playTimeLowTick(true);
        }

        // Play alarm buzzer when time expires
        if (nextSec === 0 && !timeUpSoundFiredRef.current) {
          timeUpSoundFiredRef.current = true;
          soundManager.playTimeUp();
        }

        return {
          ...prev,
          remainingSeconds: nextSec,
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeQuestion?.isPaused, activeQuestion?.remainingSeconds]);

  // Sync activeSession changes in real-time from Firestore (if in multiplayer mode)
  useEffect(() => {
    if (!activeSession?.id) return;

    const path = `game_sessions/${activeSession.id}`;
    const sessionRef = doc(db, 'game_sessions', activeSession.id);

    const unsubscribe = onSnapshot(
      sessionRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as GameSession;
          // Synchronize complete session state for both host and remote student devices
          setActiveSession(data);

          // Synchronize teams
          if (data.teams) {
            setTeams(data.teams);
          }

          // Synchronize activeQuestion so students see question and buzzer immediately!
          setActiveQuestion(data.activeQuestion || null);

          // Synchronize buzzed team
          setBuzzedTeam(data.buzzedTeam || null);

          // Synchronize answered questions
          if (Array.isArray(data.answeredQuestionIds)) {
            setAnsweredQuestionIds(data.answeredQuestionIds);
          }

          // Trigger remote audio if requested
          if (data.lastAction && data.lastActionTimestamp) {
            const timeDiff = Date.now() - data.lastActionTimestamp;
            if (timeDiff < 2000) {
              if (data.lastAction === 'buzz') soundManager.playBuzzer();
              else if (data.lastAction === 'streak') soundManager.playStreakFire();
              else if (data.lastAction === 'correct') {
                soundManager.stopMusic();
                soundManager.playCorrect();
              }
              else if (data.lastAction === 'wrong') {
                soundManager.stopMusic();
                soundManager.playWrong();
              }
            }
          }
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, path);
      }
    );

    return () => unsubscribe();
  }, [activeSession?.id]);

  // Launch a new session
  const handleStartSession = async (
    selectedGame: Game,
    initialTeams: Record<string, Team>,
    isMultiplayer: boolean
  ) => {
    setActiveGame(selectedGame);
    setTeams(initialTeams);
    setAnsweredQuestionIds([]);
    setActiveQuestion(null);
    setBuzzedTeam(null);
    setShowVictory(false);

    if (isMultiplayer) {
      setIsWaitingRoomActive(true);
      // Generate memorable 6-digit PIN
      const pin = Math.floor(100000 + Math.random() * 900000).toString();
      const sessionId = `session-${pin}`;
      const newSession: GameSession = {
        id: sessionId,
        pin,
        gameId: selectedGame.id,
        gameTitle: selectedGame.title,
        hostId: `host-${Date.now()}`,
        status: 'active',
        categories: selectedGame.categories,
        teams: initialTeams,
        activeQuestion: null,
        buzzedTeam: null,
        answeredQuestionIds: [],
        tieBreakerQuestions: selectedGame.tieBreakerQuestions || [],
        defaultTimerSeconds,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const path = `game_sessions/${sessionId}`;
      try {
        await setDoc(doc(db, 'game_sessions', sessionId), newSession);
        setActiveSession(newSession);
      } catch (err) {
        console.error('Session creation note:', err);
        setActiveSession(newSession);
      }
    } else {
      setIsWaitingRoomActive(false);
      setActiveSession(null);
    }

    setCurrentTab('play');
  };

  // Instructor opens a question tile
  const handleSelectQuestion = async (
    category: Category,
    question: Question,
    questionIndex: number
  ) => {
    lastTickSecondRef.current = -1;
    timeUpSoundFiredRef.current = false;

    const qState: ActiveQuestionState = {
      categoryId: category.id,
      categoryTitle: category.title,
      questionId: question.id,
      questionIndex,
      points: question.points,
      question: question.question,
      answer: question.answer,
      hint: question.hint,
      isDailyDouble: !!question.isDailyDouble,
      revealedAnswer: false,
      timerDuration: defaultTimerSeconds,
      remainingSeconds: defaultTimerSeconds,
      isPaused: false,
      openedAt: Date.now(),
    };

    setActiveQuestion(qState);
    setBuzzedTeam(null);

    // If daily double, play fanfare
    if (question.isDailyDouble) {
      soundManager.playDailyDouble();
    }

    // Start background game show music for this game theme
    const audioConf = soundManager.getSettings();
    if (audioConf.musicMode !== 'off') {
      const track = soundManager.selectTrackForGame(activeGame?.title || category.title);
      soundManager.startMusic(track);
    }

    // Sync to Firestore session
    if (activeSession?.id) {
      const path = `game_sessions/${activeSession.id}`;
      try {
        await updateDoc(doc(db, 'game_sessions', activeSession.id), {
          status: 'question_open',
          activeQuestion: qState,
          buzzedTeam: null,
          buzzerQueue: [],
          attemptedTeamIds: [],
          updatedAt: new Date().toISOString(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, path);
      }
    }
  };

  // Timer Pause / Resume
  const handleTogglePause = async () => {
    if (!activeQuestion) return;
    const nextPaused = !activeQuestion.isPaused;
    setActiveQuestion({
      ...activeQuestion,
      isPaused: nextPaused,
    });

    // Control music with pause state
    if (nextPaused) {
      soundManager.stopMusic();
    } else {
      const audioConf = soundManager.getSettings();
      if (audioConf.musicMode !== 'off') {
        const track = soundManager.selectTrackForGame(activeGame?.title || '');
        soundManager.startMusic(track);
      }
    }

    if (activeSession?.id) {
      try {
        await updateDoc(doc(db, 'game_sessions', activeSession.id), {
          'activeQuestion.isPaused': nextPaused,
          updatedAt: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('Update session pause note:', err);
      }
    }
  };

  // Extend Timer
  const handleExtendTimer = (seconds: number) => {
    if (!activeQuestion) return;
    timeUpSoundFiredRef.current = false;
    setActiveQuestion({
      ...activeQuestion,
      remainingSeconds: activeQuestion.remainingSeconds + seconds,
    });
  };

  // Reset Timer
  const handleResetTimer = () => {
    if (!activeQuestion) return;
    timeUpSoundFiredRef.current = false;
    lastTickSecondRef.current = -1;
    setActiveQuestion({
      ...activeQuestion,
      remainingSeconds: activeQuestion.timerDuration,
      isPaused: false,
    });
  };

  // Pass / Reopen buzzer
  const handleReopenBuzzer = async () => {
    setBuzzedTeam(null);
    if (activeSession?.id) {
      try {
        await updateDoc(doc(db, 'game_sessions', activeSession.id), {
          buzzedTeam: null,
          buzzerQueue: [],
          status: 'question_open',
          updatedAt: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('Reopen buzzer note:', err);
      }
    }
  };

  // Award Points
  const handleAwardPoints = async (teamId: string, isCorrect: boolean, customPoints?: number) => {
    if (!activeQuestion) return;

    // Immediately stop timer thinking music on grading
    soundManager.stopMusic();

    const delta = customPoints ?? activeQuestion.points;
    const scoreDelta = isCorrect ? delta : -delta;

    // Update local team scores
    const updatedTeams = { ...teams };
    let finalStreak = 0;
    if (updatedTeams[teamId]) {
      const currentScore = updatedTeams[teamId].score;
      const currentStreak = updatedTeams[teamId].streak || 0;
      finalStreak = isCorrect ? currentStreak + 1 : 0;
      updatedTeams[teamId] = {
        ...updatedTeams[teamId],
        score: currentScore + scoreDelta,
        streak: finalStreak,
      };
    }
    setTeams(updatedTeams);

    // If correct, mark question answered and close modal
    if (isCorrect) {
      if (finalStreak >= 2) {
        soundManager.playStreakFire(finalStreak);
      }

      const newAnswered = [...answeredQuestionIds, activeQuestion.questionId];
      setAnsweredQuestionIds(newAnswered);
      setActiveQuestion(null);
      setBuzzedTeam(null);

      // Sync to Firestore
      if (activeSession?.id) {
        const path = `game_sessions/${activeSession.id}`;
        try {
          await updateDoc(doc(db, 'game_sessions', activeSession.id), {
            teams: updatedTeams,
            answeredQuestionIds: newAnswered,
            activeQuestion: null,
            buzzedTeam: null,
            buzzerQueue: [],
            attemptedTeamIds: [],
            status: 'active',
            lastAction: finalStreak >= 2 ? 'streak' : 'correct',
            lastActionTimestamp: Date.now(),
            updatedAt: new Date().toISOString(),
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, path);
        }
      }
    } else {
      // Wrong answer: deduct points and give next queued team an opportunity to answer
      const currentQueue = activeSession?.buzzerQueue || [];
      const remainingQueue = currentQueue.filter((item) => item.teamId !== teamId);
      const newAttempted = Array.from(new Set([...(activeSession?.attemptedTeamIds || []), teamId]));

      const nextBuzzedTeam = remainingQueue.length > 0 ? remainingQueue[0] : null;
      const nextStatus = remainingQueue.length > 0 ? 'question_buzzed' : 'question_open';

      setBuzzedTeam(nextBuzzedTeam);

      if (activeSession?.id) {
        const path = `game_sessions/${activeSession.id}`;
        try {
          await updateDoc(doc(db, 'game_sessions', activeSession.id), {
            teams: updatedTeams,
            buzzerQueue: remainingQueue,
            buzzedTeam: nextBuzzedTeam,
            attemptedTeamIds: newAttempted,
            status: nextStatus,
            lastAction: 'wrong',
            lastActionTimestamp: Date.now(),
            updatedAt: new Date().toISOString(),
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, path);
        }
      }
    }
  };

  // Adjust score manually
  const handleAdjustTeamScore = async (teamId: string, delta: number) => {
    const updated = { ...teams };
    if (updated[teamId]) {
      updated[teamId] = {
        ...updated[teamId],
        score: updated[teamId].score + delta,
      };
      setTeams(updated);

      if (activeSession?.id) {
        try {
          await updateDoc(doc(db, 'game_sessions', activeSession.id), {
            [`teams.${teamId}.score`]: updated[teamId].score,
            updatedAt: new Date().toISOString(),
          });
        } catch (err) {
          console.warn('Score adjustment note:', err);
        }
      }
    }
  };

  // Add team on the fly (up to 15 teams)
  const handleAddTeamOnTheFly = async () => {
    if (Object.keys(teams).length >= 15) return;
    const newTeamId = `team-${Date.now()}`;
    const newTeam: Team = {
      id: newTeamId,
      name: `Team ${Object.keys(teams).length + 1}`,
      avatarId: 'alien',
      color: '#06b6d4',
      score: 0,
      streak: 0,
    };

    const updated = { ...teams, [newTeamId]: newTeam };
    setTeams(updated);

    if (activeSession?.id) {
      try {
        await updateDoc(doc(db, 'game_sessions', activeSession.id), {
          [`teams.${newTeamId}`]: newTeam,
          updatedAt: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('Add team note:', err);
      }
    }
  };

  // Finish Game & Record Leaderboard (supports tie-breaker winner without altering normal board score)
  const handleEndGame = async (overrideWinnerId?: string) => {
    setShowVictory(true);

    const winnerIdToAward = overrideWinnerId || tieBreakerWinnerId;
    const sortedTeams = Object.values(teams).sort((a, b) => b.score - a.score);
    const resolvedWinnerId = winnerIdToAward || sortedTeams[0]?.id;

    // Automatically sync teams to multi-session leaderboard in Firestore
    for (const team of sortedTeams) {
      const docKey = team.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const docRef = doc(db, 'leaderboards', docKey);

      try {
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const old = snap.data() as LeaderboardEntry;
          await setDoc(docRef, {
            id: docKey,
            teamName: team.name,
            avatarId: team.avatarId,
            // CRITICAL: Only normal board score is accumulated, tie-breaker points do not inflate totals
            totalScore: (old.totalScore || 0) + team.score,
            gamesPlayed: (old.gamesPlayed || 0) + 1,
            gamesWon: (old.gamesWon || 0) + (team.id === resolvedWinnerId ? 1 : 0),
            highestScore: Math.max(old.highestScore || 0, team.score),
            lastPlayedAt: new Date().toISOString(),
          });
        } else {
          await setDoc(docRef, {
            id: docKey,
            teamName: team.name,
            avatarId: team.avatarId,
            totalScore: team.score,
            gamesPlayed: 1,
            gamesWon: team.id === resolvedWinnerId ? 1 : 0,
            highestScore: team.score,
            lastPlayedAt: new Date().toISOString(),
          });
        }
      } catch (err) {
        console.warn('Leaderboard save note:', err);
      }
    }
  };

  // Student Buzzer Join Flow (Restricts duplicate joins)
  const handleJoinSessionByPin = async (
    pin: string,
    teamInfo: { name: string; avatarId: string; color: string }
  ): Promise<{ success: boolean; teamId?: string; error?: string }> => {
    const cleanPin = pin.trim().toUpperCase();
    const sessionsRef = collection(db, 'game_sessions');
    const q = query(sessionsRef, where('pin', '==', cleanPin));

    try {
      const querySnap = await getDocs(q);
      if (querySnap.empty) {
        return { success: false, error: 'No active game session found for that PIN.' };
      }

      const sessionDoc = querySnap.docs[0];
      const sessionData = sessionDoc.data() as GameSession;

      // Check if student already joined as this team (reconnect them rather than duplicate)
      if (sessionData.teams) {
        const existingTeam = Object.values(sessionData.teams).find(
          (t) => t.name.toLowerCase() === teamInfo.name.toLowerCase().trim()
        );
        if (existingTeam) {
          setActiveSession(sessionData);
          setStudentJoinedTeamId(existingTeam.id);
          return { success: true, teamId: existingTeam.id };
        }
      }

      const teamId = `team-${Date.now()}`;

      const newTeam: Team = {
        id: teamId,
        name: teamInfo.name,
        avatarId: teamInfo.avatarId,
        color: teamInfo.color,
        score: 0,
        streak: 0,
        isConnected: true,
      };

      const updatedTeams = {
        ...sessionData.teams,
        [teamId]: newTeam,
      };

      await updateDoc(doc(db, 'game_sessions', sessionDoc.id), {
        teams: updatedTeams,
        updatedAt: new Date().toISOString(),
      });

      setActiveSession({
        ...sessionData,
        teams: updatedTeams,
      });
      setStudentJoinedTeamId(teamId);
      return { success: true, teamId };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Error connecting to room',
      };
    }
  };

  // Student Buzzes In (Supports first-to-buzz priority queue and second chances)
  const handleStudentBuzzIn = async (sessionId: string, teamId: string) => {
    const team = activeSession?.teams?.[teamId] || teams[teamId];
    if (!team) return;

    // Disallow buzz if team already attempted and missed this question
    if (activeSession?.attemptedTeamIds?.includes(teamId)) return;

    const currentQueue = activeSession?.buzzerQueue || [];
    // Disallow duplicate queueing
    if (currentQueue.some((item) => item.teamId === teamId)) return;

    const buzzPayload: BuzzerQueueItem = {
      teamId,
      teamName: team.name,
      avatarId: team.avatarId,
      buzzedAt: Date.now(),
    };

    const updatedQueue = [...currentQueue, buzzPayload];
    const firstInQueue = updatedQueue[0];

    setBuzzedTeam(firstInQueue);

    const path = `game_sessions/${sessionId}`;
    try {
      await updateDoc(doc(db, 'game_sessions', sessionId), {
        buzzedTeam: firstInQueue,
        buzzerQueue: updatedQueue,
        status: 'question_buzzed',
        lastAction: 'buzz',
        lastActionTimestamp: Date.now(),
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  // Save Game from Editor
  const handleSaveGame = (savedGame: Game) => {
    const updated = gamesList.filter((g) => g.id !== savedGame.id);
    const newList = [savedGame, ...updated];
    setGamesList(newList);

    try {
      // Persist custom games locally
      const customOnly = newList.filter((g) => !DEFAULT_GAMES.some((dg) => dg.id === g.id));
      localStorage.setItem('edujeopardy_custom_games', JSON.stringify(customOnly));
    } catch {}
  };

  // Restart / Reset
  const handleResetToLobby = () => {
    setActiveGame(null);
    setActiveSession(null);
    setIsWaitingRoomActive(false);
    setActiveQuestion(null);
    setBuzzedTeam(null);
    setShowVictory(false);
    setShowTieBreaker(false);
    setTieBreakerWinnerId(null);
    setCurrentTab('play');
  };

  // Determine if current user is acting in student mode (joined a team, or on buzzer tab, or entered with ?pin=)
  const isStudentMode = Boolean(
    studentJoinedTeamId ||
    currentTab === 'buzzer' ||
    (typeof window !== 'undefined' && (new URLSearchParams(window.location.search).get('pin') || new URLSearchParams(window.location.search).get('join')))
  );

  return (
    <div className="min-h-screen min-h-[100dvh] w-full bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Top Navigation */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={(tab) => {
          setCurrentTab(tab);
          if (tab === 'editor') {
            setEditingGame(activeGame || DEFAULT_GAMES[0]);
          }
        }}
        isMuted={isMuted}
        setIsMuted={setIsMuted}
        onOpenSoundSettings={() => {
          if (!isStudentMode) setShowSoundSettings(true);
        }}
        onNewGameClick={() => {
          soundManager.stopMusic();
          setActiveGame(null);
          setIsWaitingRoomActive(false);
          setCurrentTab('play');
        }}
        isStudentJoined={isStudentMode}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col w-full">
        {/* Play Tab: Shows SessionLobby, WaitingRoom, or Active BoardView */}
        {currentTab === 'play' && (
          <>
            {!activeGame ? (
              <SessionLobby
                gamesList={gamesList}
                onStartSession={handleStartSession}
                onEditGame={(g) => {
                  setEditingGame(g);
                  setCurrentTab('editor');
                }}
                onCreateNewGame={() => {
                  setEditingGame(null);
                  setCurrentTab('editor');
                }}
              />
            ) : isWaitingRoomActive && activeSession ? (
              <WaitingRoom
                session={activeSession}
                game={activeGame}
                teams={teams}
                onStartBoard={() => setIsWaitingRoomActive(false)}
                onAddTeam={handleAddTeamOnTheFly}
                onRemoveTeam={(teamId) => {
                  const updated = { ...teams };
                  delete updated[teamId];
                  setTeams(updated);
                  if (activeSession?.id) {
                    updateDoc(doc(db, 'game_sessions', activeSession.id), {
                      teams: updated,
                      updatedAt: new Date().toISOString(),
                    }).catch(() => {});
                  }
                }}
              />
            ) : (
              <BoardView
                game={activeGame}
                teams={teams}
                answeredQuestionIds={answeredQuestionIds}
                onSelectQuestion={handleSelectQuestion}
                onEndGame={handleEndGame}
                onStartTieBreaker={() => setShowTieBreaker(true)}
                onOpenSoundSettings={() => setShowSoundSettings(true)}
                sessionPin={activeSession?.pin}
                onAdjustTeamScore={handleAdjustTeamScore}
                onAddTeam={handleAddTeamOnTheFly}
                penaltyForWrong={penaltyForWrong}
                setPenaltyForWrong={setPenaltyForWrong}
                defaultTimerSeconds={defaultTimerSeconds}
                setDefaultTimerSeconds={setDefaultTimerSeconds}
              />
            )}
          </>
        )}

        {/* Board Editor Tab */}
        {currentTab === 'editor' && (
          <BoardEditor
            initialGame={editingGame}
            onSaveGame={handleSaveGame}
            onLaunchGame={(gameToLaunch) => {
              handleSaveGame(gameToLaunch);
              setActiveGame(gameToLaunch);
              setCurrentTab('play');
            }}
          />
        )}

        {/* Student Buzzer Tab */}
        {currentTab === 'buzzer' && (
          <BuzzerRemote
            currentSession={activeSession}
            onJoinSession={handleJoinSessionByPin}
            onBuzzIn={handleStudentBuzzIn}
            onLeaveSession={() => {
              setStudentJoinedTeamId(null);
            }}
            joinedTeamId={studentJoinedTeamId}
          />
        )}

        {/* Multi-Session Leaderboard Tab */}
        {currentTab === 'leaderboard' && <LeaderboardView />}
      </main>

      {/* Question Arena Modal (Teacher / Host Only: Students NEVER receive teacher grading/timer controls) */}
      {!isStudentMode && currentTab === 'play' && activeQuestion && (
        <QuestionModal
          questionState={activeQuestion}
          teams={teams}
          buzzedTeam={buzzedTeam}
          buzzerQueue={activeSession?.buzzerQueue || (buzzedTeam ? [buzzedTeam] : [])}
          attemptedTeamIds={activeSession?.attemptedTeamIds || []}
          onClose={() => {
            soundManager.stopMusic();
            setActiveQuestion(null);
            setBuzzedTeam(null);
            if (activeSession?.id) {
              updateDoc(doc(db, 'game_sessions', activeSession.id), {
                activeQuestion: null,
                buzzedTeam: null,
                buzzerQueue: [],
                status: 'active',
                updatedAt: new Date().toISOString(),
              }).catch(() => {});
            }
          }}
          onAwardPoints={handleAwardPoints}
          onTogglePause={handleTogglePause}
          onExtendTimer={handleExtendTimer}
          onResetTimer={handleResetTimer}
          onReopenBuzzer={handleReopenBuzzer}
          penaltyForWrong={penaltyForWrong}
        />
      )}

      {/* Sudden Death Tie Breaker Modal (Host only) */}
      {!isStudentMode && currentTab === 'play' && showTieBreaker && (
        <TieBreakerModal
          teams={teams}
          buzzedTeamId={buzzedTeam?.teamId}
          onClearBuzz={() => setBuzzedTeam(null)}
          onClose={() => setShowTieBreaker(false)}
          onConfirmWinner={(winnerId) => {
            setTieBreakerWinnerId(winnerId);
            setShowTieBreaker(false);
            handleEndGame(winnerId);
          }}
          boardTieBreakerQuestions={activeGame?.tieBreakerQuestions}
          boardTitle={activeGame?.title}
          onSaveBoardTieBreakers={(newTBQuestions) => {
            if (activeGame) {
              const updatedGame: Game = {
                ...activeGame,
                tieBreakerQuestions: newTBQuestions,
                updatedAt: new Date().toISOString(),
              };
              setActiveGame(updatedGame);
              handleSaveGame(updatedGame);
              if (activeSession?.id) {
                updateDoc(doc(db, 'game_sessions', activeSession.id), {
                  tieBreakerQuestions: newTBQuestions,
                  updatedAt: new Date().toISOString(),
                }).catch(() => {});
              }
            }
          }}
        />
      )}

      {/* End Game Victory Modal */}
      {showVictory && (
        <VictoryModal
          teams={teams}
          designatedWinnerId={tieBreakerWinnerId}
          onStartTieBreaker={() => {
            setShowVictory(false);
            setShowTieBreaker(true);
          }}
          onPlayAgain={() => {
            setTieBreakerWinnerId(null);
            if (activeGame) {
              // Reset board scores
              const resetTeams: Record<string, Team> = {};
              Object.values(teams).forEach((t) => {
                resetTeams[t.id] = { ...t, score: 0, streak: 0 };
              });
              setTeams(resetTeams);
              setAnsweredQuestionIds([]);
              setShowVictory(false);
            } else {
              handleResetToLobby();
            }
          }}
          onViewLeaderboard={() => {
            setShowVictory(false);
            setCurrentTab('leaderboard');
          }}
          onClose={() => setShowVictory(false)}
        />
      )}

      {/* Global Sound & Music Settings Modal (Host / Teacher only: Not accessible to students) */}
      {!isStudentMode && showSoundSettings && (
        <SoundSettingsModal onClose={() => setShowSoundSettings(false)} />
      )}
    </div>
  );
}
