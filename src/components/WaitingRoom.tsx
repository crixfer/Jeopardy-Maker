import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Users,
  Play,
  Copy,
  Check,
  Smartphone,
  Sparkles,
  Plus,
  Trash2,
  ArrowRight,
  Maximize2,
  Minimize2,
  ExternalLink,
  ShieldCheck,
  Radio,
} from 'lucide-react';
import { Game, Team, GameSession } from '../types/game';
import { Avatar } from './Avatar';
import { soundManager } from '../utils/soundEffects';
import { StreakName, StreakBadge, StreakAvatarAura } from './StreakFireEffect';


interface WaitingRoomProps {
  session: GameSession;
  game: Game;
  teams: Record<string, Team>;
  onStartBoard: () => void;
  onAddTeam: () => void;
  onRemoveTeam: (teamId: string) => void;
}

export const WaitingRoom: React.FC<WaitingRoomProps> = ({
  session,
  game,
  teams,
  onStartBoard,
  onAddTeam,
  onRemoveTeam,
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [isQrMaximized, setIsQrMaximized] = useState<boolean>(false);
  const prevTeamsCountRef = useRef<number>(Object.keys(teams).length);

  // Generate dynamic join URL directly embedding the current session PIN
  const getJoinUrl = () => {
    if (typeof window === 'undefined') return '';
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    return `${origin}${pathname}?pin=${encodeURIComponent(session.pin)}`;
  };

  const joinUrl = getJoinUrl();
  const teamsList = Object.values(teams);

  // Play subtle chime when a new team connects
  useEffect(() => {
    if (teamsList.length > prevTeamsCountRef.current) {
      soundManager.playTeamJoinedChime();
    }
    prevTeamsCountRef.current = teamsList.length;
  }, [teamsList.length]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(joinUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleOpenStudentTab = () => {
    window.open(joinUrl, '_blank');
  };

  return (
    <div className="flex-1 flex flex-col justify-between p-4 sm:p-6 max-w-6xl mx-auto w-full space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-indigo-900/90 via-slate-900 to-indigo-950 border-2 border-indigo-700/60 p-4 sm:p-6 rounded-3xl shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 text-xs font-black uppercase tracking-wider">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>Live Classroom Waiting Room</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wide">
            {game.title}
          </h1>
          <p className="text-xs text-slate-300">
            Display this screen on your projector. Students scan the QR code to connect their phone buzzers in seconds!
          </p>
        </div>

        {/* Start Game Action */}
        <button
          onClick={onStartBoard}
          className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-base shadow-xl shadow-emerald-500/25 transition-all hover:scale-105 active:scale-95 cursor-pointer"
        >
          <Play className="w-5 h-5 fill-current" />
          <span>Start Game Board ({teamsList.length} Ready)</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Main Grid: Left = QR & PIN, Right = Live Checked-in Teams */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column: QR Code & Connection Info (5 Cols) */}
        <div className="lg:col-span-5 bg-slate-900 border-2 border-indigo-600/70 rounded-3xl p-6 sm:p-8 flex flex-col items-center justify-between text-center space-y-5 shadow-2xl">
          <div className="space-y-1 w-full">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-widest text-amber-400">
                Any Smartphone Camera
              </span>
              <button
                type="button"
                onClick={() => setIsQrMaximized(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-bold border border-slate-700 transition-colors"
                title="Enlarge QR code for large classroom / auditorium"
              >
                <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Enlarge</span>
              </button>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white">
              Scan to Join Instantly
            </h3>
          </div>

          {/* High-Contrast Large QR Code Container */}
          <div
            onClick={() => setIsQrMaximized(true)}
            className="p-4 bg-white rounded-3xl shadow-2xl border-4 border-amber-400/80 flex flex-col items-center justify-center cursor-pointer group transition-transform hover:scale-102"
            title="Click to enlarge QR code"
          >
            <QRCodeSVG
              value={joinUrl}
              size={220}
              level="H"
              includeMargin={true}
              imageSettings={{
                src: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="%234f46e5"/><text x="50" y="66" font-size="48" font-family="sans-serif" font-weight="900" text-anchor="middle" fill="%23fbbf24">J!</text></svg>',
                x: undefined,
                y: undefined,
                height: 44,
                width: 44,
                excavate: true,
              }}
            />
            <div className="mt-1 flex items-center gap-1 text-[11px] font-extrabold uppercase text-slate-600 group-hover:text-indigo-600 transition-colors">
              <Smartphone className="w-3.5 h-3.5" />
              <span>Point phone camera here</span>
            </div>
          </div>

          {/* Room PIN Card */}
          <div className="w-full bg-slate-950 border-2 border-indigo-500/50 rounded-2xl p-4 shadow-inner">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Or Enter Game PIN Manually
            </span>
            <div className="font-mono text-4xl sm:text-5xl font-black text-amber-400 tracking-widest my-1 select-all">
              {session.pin}
            </div>
            <p className="text-[11px] text-slate-400">
              Open site & tap <strong className="text-white">Student Buzzer</strong>
            </p>
          </div>

          {/* Actions: Copy Link & Open in New Tab for Local Testing */}
          <div className="w-full space-y-2">
            <button
              onClick={handleCopyLink}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 transition-colors shadow-sm active:scale-98"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Direct Link Copied to Clipboard!' : 'Copy Direct Student Link'}</span>
            </button>

            <button
              onClick={handleOpenStudentTab}
              className="w-full py-2 px-3 rounded-xl bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-300 hover:text-indigo-100 font-bold text-[11px] flex items-center justify-center gap-1.5 border border-indigo-800/60 transition-colors"
              title="Open student buzzer remote in a new browser tab to test without a phone"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open Student Buzzer in New Tab (Test)</span>
            </button>
          </div>
        </div>

        {/* Right Column: Live Connected Classroom Teams (7 Cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-indigo-900/60 rounded-3xl p-6 flex flex-col justify-between shadow-xl space-y-4">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-400" />
                <h2 className="text-base font-black uppercase tracking-wider text-white">
                  Connected Teams ({teamsList.length}/15)
                </h2>
              </div>

              {teamsList.length < 15 && (
                <button
                  type="button"
                  onClick={onAddTeam}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold border border-slate-700 transition-colors shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Add Team Manually</span>
                </button>
              )}
            </div>

            {/* Teams Grid Showcase */}
            {teamsList.length === 0 ? (
              <div className="min-h-[280px] rounded-2xl border-2 border-dashed border-slate-800 flex flex-col items-center justify-center p-6 text-center space-y-3">
                <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
                  <Smartphone className="w-8 h-8 text-cyan-400 animate-bounce" />
                </div>
                <h4 className="text-sm font-bold text-slate-300">
                  Waiting for teams to scan in...
                </h4>
                <p className="text-xs text-slate-500 max-w-sm">
                  Students point their cellphone camera at the QR code on the left to select their animated avatar and appear here live!
                </p>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 text-[11px] font-semibold text-slate-400 border border-slate-700">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Supports up to 15 teams simultaneously</span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[380px] overflow-y-auto pr-1">
                {teamsList.map((team) => {
                  const hasStreak = (team.streak || 0) >= 2;
                  return (
                    <div
                      key={team.id}
                      className={`border rounded-2xl p-3 flex flex-col items-center text-center relative group transition-all animate-scaleUp shadow-sm ${
                        hasStreak
                          ? 'bg-gradient-to-b from-orange-950/40 to-slate-950 border-orange-500/70 shadow-[0_0_15px_rgba(249,115,22,0.3)] animate-fire-glow'
                          : 'bg-slate-950 border-slate-800 hover:border-emerald-500/50'
                      }`}
                    >
                      <span
                        className="absolute top-2.5 right-2.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-4 ring-emerald-400/20 animate-pulse"
                        title="Ready to play"
                      />

                      <StreakAvatarAura streak={team.streak || 0}>
                        <Avatar avatarId={team.avatarId} size="lg" />
                      </StreakAvatarAura>

                      <div className="mt-2 w-full flex items-center justify-center">
                        <StreakName
                          name={team.name}
                          streak={team.streak || 0}
                          size="sm"
                          className="max-w-[130px]"
                        />
                      </div>

                      {hasStreak ? (
                        <div className="mt-1">
                          <StreakBadge streak={team.streak || 0} size="xs" />
                        </div>
                      ) : (
                        <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider mt-0.5">
                          ✓ Connected
                        </span>
                      )}


                    {/* Delete Team Button */}
                    {teamsList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => onRemoveTeam(team.id)}
                        title="Remove team"
                        className="absolute bottom-2 right-2 p-1 text-slate-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
              </div>

            )}
          </div>

          {/* Quick FAQ Helper for Teachers */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5 text-xs text-slate-300 space-y-1">
            <div className="flex items-center gap-1.5 text-amber-400 font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Teacher Pro Tip:</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              You can start now with whichever teams are ready. Late students can scan the QR code from the top of the board anytime during the game to join without interrupting!
            </p>
          </div>
        </div>
      </div>

      {/* Auditorium / Fullscreen QR Code Modal */}
      {isQrMaximized && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border-2 border-indigo-500 rounded-3xl p-6 sm:p-10 max-w-xl w-full flex flex-col items-center text-center space-y-6 shadow-2xl relative">
            <button
              onClick={() => setIsQrMaximized(false)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Close Fullscreen QR"
            >
              <Minimize2 className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <span className="text-xs font-black uppercase tracking-widest text-amber-400">
                Auditorium Projection View
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                Scan with Phone Camera
              </h2>
            </div>

            {/* Giant QR Code */}
            <div className="p-6 bg-white rounded-3xl shadow-2xl border-4 border-amber-400 flex flex-col items-center justify-center">
              <QRCodeSVG
                value={joinUrl}
                size={300}
                level="H"
                includeMargin={true}
                imageSettings={{
                  src: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="%234f46e5"/><text x="50" y="66" font-size="48" font-family="sans-serif" font-weight="900" text-anchor="middle" fill="%23fbbf24">J!</text></svg>',
                  x: undefined,
                  y: undefined,
                  height: 60,
                  width: 60,
                  excavate: true,
                }}
              />
              <span className="text-xs font-black uppercase text-slate-700 mt-2">
                Point Phone Camera Here
              </span>
            </div>

            {/* Big Game PIN */}
            <div className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Or Enter PIN:
              </span>
              <div className="font-mono text-5xl font-black text-amber-400 tracking-widest my-1 select-all">
                {session.pin}
              </div>
            </div>

            <button
              onClick={() => setIsQrMaximized(false)}
              className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-sm transition-colors shadow-lg"
            >
              Back to Waiting Room
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
