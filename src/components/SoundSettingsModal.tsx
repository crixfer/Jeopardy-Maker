import React, { useState } from 'react';
import { Volume2, VolumeX, Music, Sliders, CheckCircle2, XCircle, Bell, Radio, RotateCcw, X, Play, Square, Sparkles } from 'lucide-react';
import { soundManager, AudioSettings } from '../utils/soundEffects';

interface SoundSettingsModalProps {
  onClose: () => void;
}

export const SoundSettingsModal: React.FC<SoundSettingsModalProps> = ({ onClose }) => {
  const [settings, setSettings] = useState<AudioSettings>(soundManager.getSettings());
  const [isPlayingPreview, setIsPlayingPreview] = useState<boolean>(soundManager.isMusicPlaying());

  const handleUpdate = (partial: Partial<AudioSettings>) => {
    const next = { ...settings, ...partial };
    setSettings(next);
    soundManager.updateSettings(partial);
  };

  const handleTogglePreviewMusic = () => {
    if (isPlayingPreview) {
      soundManager.stopMusic();
      setIsPlayingPreview(false);
    } else {
      const trackToPlay = settings.musicTrack === 'auto' ? 'think_classic' : settings.musicTrack;
      soundManager.startMusic(trackToPlay);
      setIsPlayingPreview(true);
    }
  };

  const handleResetDefaults = () => {
    const defaults: Partial<AudioSettings> = {
      isMuted: false,
      masterVolume: 0.8,
      correctVolume: 0.9,
      wrongVolume: 0.8,
      timerVolume: 0.7,
      buzzerVolume: 0.9,
      musicVolume: 0.45,
      musicMode: 'during_questions',
      musicTrack: 'auto',
    };
    handleUpdate(defaults);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-xl bg-slate-900 border-2 border-indigo-600/80 rounded-3xl shadow-2xl shadow-indigo-950/90 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-6 py-4 border-b border-indigo-900/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600/30 text-amber-400 border border-indigo-500/40 shadow-sm">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-wide">
                Sound & Music Settings
              </h2>
              <p className="text-[11px] text-slate-400 font-medium">
                Customize individual volumes, game show music, and audio effects
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              if (isPlayingPreview) soundManager.stopMusic();
              onClose();
            }}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Master Volume Row */}
          <div className="bg-slate-950/80 border border-indigo-900/50 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {settings.isMuted ? (
                  <VolumeX className="w-5 h-5 text-rose-400" />
                ) : (
                  <Volume2 className="w-5 h-5 text-amber-400" />
                )}
                <span className="text-sm font-extrabold text-white">
                  Master Sound Volume
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-xs text-amber-400">
                  {settings.isMuted ? 'MUTED' : `${Math.round(settings.masterVolume * 100)}%`}
                </span>
                <button
                  onClick={() => handleUpdate({ isMuted: !settings.isMuted })}
                  className={`px-3 py-1 rounded-xl text-xs font-bold border transition-colors ${
                    settings.isMuted
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/30 hover:bg-rose-500/30'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                  }`}
                >
                  {settings.isMuted ? 'Unmute All' : 'Mute All'}
                </button>
              </div>
            </div>

            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.masterVolume}
              disabled={settings.isMuted}
              onChange={(e) => handleUpdate({ masterVolume: parseFloat(e.target.value) })}
              className="w-full accent-amber-500 h-2 bg-slate-800 rounded-lg cursor-pointer disabled:opacity-40"
            />
          </div>

          {/* Background Game Show Music Section */}
          <div className="bg-gradient-to-br from-indigo-950/60 to-slate-950 border border-indigo-800/60 rounded-2xl p-4 space-y-4 shadow-inner">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Music className="w-5 h-5 text-purple-400" />
                <span className="text-sm font-extrabold text-white">
                  Background Game Show Music
                </span>
              </div>

              <button
                type="button"
                onClick={handleTogglePreviewMusic}
                className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 text-xs font-bold transition-all"
              >
                {isPlayingPreview ? (
                  <>
                    <Square className="w-3 h-3 fill-current text-rose-400" />
                    <span>Stop Preview</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3 fill-current text-amber-300" />
                    <span>Preview Track</span>
                  </>
                )}
              </button>
            </div>

            {/* Music Volume Slider */}
            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1 font-semibold">
                <span>Music Volume</span>
                <span className="font-mono text-purple-300">{Math.round(settings.musicVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.musicVolume}
                disabled={settings.isMuted}
                onChange={(e) => handleUpdate({ musicVolume: parseFloat(e.target.value) })}
                className="w-full accent-purple-500 h-2 bg-slate-800 rounded-lg cursor-pointer disabled:opacity-40"
              />
            </div>

            {/* Track Selector & Mode */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Music Track
                </label>
                <select
                  value={settings.musicTrack}
                  onChange={(e) => {
                    const track = e.target.value as any;
                    handleUpdate({ musicTrack: track });
                    if (isPlayingPreview) {
                      soundManager.startMusic(track === 'auto' ? 'think_classic' : track);
                    }
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs font-bold text-white focus:outline-none focus:border-purple-500 cursor-pointer"
                >
                  <option value="auto">🌟 Auto (Different per Game)</option>
                  <option value="think_classic">🧠 Classic 'Think!' Theme</option>
                  <option value="arcade_groove">⚡ Electric Arcade Groove</option>
                  <option value="mystery_wonders">🏛️ Mystery & Wonders</option>
                  <option value="brassy_swing">🎺 TV Game Show Swing</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  When to Play
                </label>
                <select
                  value={settings.musicMode}
                  onChange={(e) => handleUpdate({ musicMode: e.target.value as any })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs font-bold text-white focus:outline-none focus:border-purple-500 cursor-pointer"
                >
                  <option value="during_questions">⏳ During Question Timer (Classic)</option>
                  <option value="always">🎶 Continuous Background</option>
                  <option value="off">🔇 Music Disabled</option>
                </select>
              </div>
            </div>
          </div>

          {/* Individual Sound Effects Levels */}
          <div className="space-y-3.5">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400 block">
              Individual Sound Effect Volumes
            </span>

            {/* Correct Chime */}
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white">Correct Answer Chime</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-emerald-400 font-bold">
                    {Math.round(settings.correctVolume * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={() => soundManager.playCorrect()}
                    className="px-2.5 py-0.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[11px] font-bold border border-emerald-500/30"
                  >
                    Test
                  </button>
                </div>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.correctVolume}
                disabled={settings.isMuted}
                onChange={(e) => handleUpdate({ correctVolume: parseFloat(e.target.value) })}
                className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer disabled:opacity-40"
              />
            </div>

            {/* Wrong Buzzer */}
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-rose-400" />
                  <span className="text-xs font-bold text-white">Wrong Answer Buzz</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-rose-400 font-bold">
                    {Math.round(settings.wrongVolume * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={() => soundManager.playWrong()}
                    className="px-2.5 py-0.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-[11px] font-bold border border-rose-500/30"
                  >
                    Test
                  </button>
                </div>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.wrongVolume}
                disabled={settings.isMuted}
                onChange={(e) => handleUpdate({ wrongVolume: parseFloat(e.target.value) })}
                className="w-full accent-rose-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer disabled:opacity-40"
              />
            </div>

            {/* Timer Ticking & Alarm */}
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-white">Timer Ticks & Alarm</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-amber-400 font-bold">
                    {Math.round(settings.timerVolume * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      soundManager.playTimeLowTick(true);
                      setTimeout(() => soundManager.playTimeUp(), 300);
                    }}
                    className="px-2.5 py-0.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[11px] font-bold border border-amber-500/30"
                  >
                    Test
                  </button>
                </div>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.timerVolume}
                disabled={settings.isMuted}
                onChange={(e) => handleUpdate({ timerVolume: parseFloat(e.target.value) })}
                className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer disabled:opacity-40"
              />
            </div>

            {/* Student Buzzer Tone */}
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold text-white">Student Buzzer Tone</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-cyan-400 font-bold">
                    {Math.round(settings.buzzerVolume * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={() => soundManager.playBuzzer()}
                    className="px-2.5 py-0.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-[11px] font-bold border border-cyan-500/30"
                  >
                    Test
                  </button>
                </div>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.buzzerVolume}
                disabled={settings.isMuted}
                onChange={(e) => handleUpdate({ buzzerVolume: parseFloat(e.target.value) })}
                className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer disabled:opacity-40"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-950 border-t border-slate-800 px-6 py-4 flex items-center justify-between">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors font-semibold"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Defaults</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (isPlayingPreview) soundManager.stopMusic();
              onClose();
            }}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-colors"
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
};
