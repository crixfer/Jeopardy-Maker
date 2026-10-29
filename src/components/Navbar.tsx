import React from 'react';
import { Volume2, VolumeX, PlusCircle, Trophy, Users, MonitorPlay, Edit3, Sliders, Radio } from 'lucide-react';
import { soundManager } from '../utils/soundEffects';

interface NavbarProps {
  currentTab: 'play' | 'editor' | 'buzzer' | 'leaderboard';
  setCurrentTab: (tab: 'play' | 'editor' | 'buzzer' | 'leaderboard') => void;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
  onOpenSoundSettings: () => void;
  onNewGameClick: () => void;
  onLogoClick?: () => void;
  isStudentJoined?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  isMuted,
  setIsMuted,
  onOpenSoundSettings,
  onNewGameClick,
  onLogoClick,
  isStudentJoined = false,
}) => {
  const toggleMute = () => {
    const nextState = !isMuted;
    setIsMuted(nextState);
    soundManager.setIsMuted(nextState);
  };

  const handleLogoClick = () => {
    if (isStudentJoined) {
      setCurrentTab('buzzer');
    } else if (onLogoClick) {
      onLogoClick();
    } else {
      onNewGameClick();
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-indigo-900/60 shadow-lg text-white w-full">
      {/* Top Header Row */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 flex items-center justify-between h-14 sm:h-16">
        {/* Brand Logo - JOYPARDY (Click to return to Main Page) */}
        <div 
          onClick={handleLogoClick}
          className="flex items-center gap-2 sm:gap-3 cursor-pointer group select-none shrink-0"
          title="JOYPARDY - Click to return to Main Page"
        >
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-indigo-600 to-purple-600 p-[2px] shadow-lg shadow-indigo-500/25 group-hover:scale-105 active:scale-95 transition-transform">
            <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center">
              <span className="text-base sm:text-xl font-black bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-500 bg-clip-text text-transparent">
                J!
              </span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-base sm:text-lg tracking-wider text-white">
                JOY<span className="text-amber-400">PARDY</span>
              </span>
              {isStudentJoined ? (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5" title="Live Connected" />
              ) : (
                <span className="text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hidden xs:inline-block">
                  Free
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
              Interactive Classroom Battle & Trivia Show
            </p>
          </div>
        </div>

        {/* Desktop Navigation Tabs (Teacher Mode: md: and up) */}
        {!isStudentJoined ? (
          <nav className="hidden md:flex items-center gap-1.5 lg:gap-2">
            <button
              onClick={() => setCurrentTab('play')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                currentTab === 'play'
                  ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <MonitorPlay className="w-4 h-4 text-amber-400" />
              <span>Host Game</span>
            </button>

            <button
              onClick={() => setCurrentTab('editor')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                currentTab === 'editor'
                  ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <Edit3 className="w-4 h-4 text-emerald-400" />
              <span>Board Editor</span>
            </button>

            <button
              onClick={() => setCurrentTab('buzzer')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                currentTab === 'buzzer'
                  ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <Users className="w-4 h-4 text-rose-400" />
              <span>Student Buzzer</span>
            </button>

            <button
              onClick={() => setCurrentTab('leaderboard')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                currentTab === 'leaderboard'
                  ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <Trophy className="w-4 h-4 text-yellow-400" />
              <span>Leaderboard</span>
            </button>
          </nav>
        ) : (
          /* Student View Segmented Switcher (Fits perfectly on iPhone 12 Pro & smaller) */
          <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-indigo-900/60 shadow-inner">
            <button
              onClick={() => setCurrentTab('buzzer')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                currentTab === 'buzzer'
                  ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-md shadow-rose-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Radio className="w-3.5 h-3.5 text-rose-300" />
              <span>Buzzer</span>
            </button>

            <button
              onClick={() => setCurrentTab('leaderboard')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                currentTab === 'leaderboard'
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-md shadow-amber-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Trophy className="w-3.5 h-3.5 text-yellow-400" />
              <span>Scores</span>
            </button>
          </div>
        )}

        {/* Right Action Controls (Teacher only) */}
        {!isStudentJoined && (
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Audio Settings Menu Trigger */}
            <button
              onClick={onOpenSoundSettings}
              title="Sound & Music Levels Settings"
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-amber-400 border border-slate-700/60 transition-colors flex items-center gap-1.5"
            >
              <Sliders className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-bold hidden lg:inline">Audio Levels</span>
            </button>

            {/* Quick Mute Toggle */}
            <button
              onClick={toggleMute}
              title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-amber-400 border border-slate-700/60 transition-colors"
            >
              {isMuted ? <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 text-rose-400" /> : <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />}
            </button>

            {/* New Game Shortcut */}
            <button
              onClick={onNewGameClick}
              title="Create or Launch New Game"
              className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all hover:scale-105 active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden xs:inline">New Game</span>
            </button>
          </div>
        )}
      </div>

      {/* Mobile-Only Segmented Navigation Bar (Teacher mode on screens < md) */}
      {!isStudentJoined && (
        <div className="md:hidden px-3 pb-2.5 pt-0.5 border-t border-indigo-950/60">
          <div className="grid grid-cols-4 gap-1 p-1 bg-slate-950/90 rounded-xl border border-indigo-900/50 shadow-inner">
            <button
              onClick={() => setCurrentTab('play')}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-1 rounded-lg text-xs font-bold transition-all ${
                currentTab === 'play'
                  ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <MonitorPlay className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="truncate">Host</span>
            </button>

            <button
              onClick={() => setCurrentTab('editor')}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-1 rounded-lg text-xs font-bold transition-all ${
                currentTab === 'editor'
                  ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate">Editor</span>
            </button>

            <button
              onClick={() => setCurrentTab('buzzer')}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-1 rounded-lg text-xs font-bold transition-all ${
                currentTab === 'buzzer'
                  ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span className="truncate">Buzzer</span>
            </button>

            <button
              onClick={() => setCurrentTab('leaderboard')}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-1 rounded-lg text-xs font-bold transition-all ${
                currentTab === 'leaderboard'
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Trophy className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
              <span className="truncate">Scores</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
