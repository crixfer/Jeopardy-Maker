import React from 'react';
import { Flame, Zap, Sparkles } from 'lucide-react';

interface StreakNameProps {
  name: string;
  streak?: number;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showFlameIcon?: boolean;
}

export const StreakName: React.FC<StreakNameProps> = ({
  name,
  streak = 0,
  className = '',
  size = 'md',
  showFlameIcon = true,
}) => {
  const isGodlike = streak >= 5;
  const isSuperHot = streak >= 3 && streak < 5;
  const isOnFire = streak === 2;
  const hasStreak = streak >= 2;

  // Text sizes
  const sizeClasses = {
    xs: 'text-xs',
    sm: 'text-xs sm:text-sm',
    md: 'text-sm sm:text-base',
    lg: 'text-base sm:text-lg md:text-xl',
    xl: 'text-xl sm:text-2xl md:text-3xl',
  }[size];

  if (!hasStreak) {
    return <span className={`${sizeClasses} font-extrabold text-white truncate ${className}`}>{name}</span>;
  }

  return (
    <span className={`inline-flex items-center gap-1.5 font-black tracking-wide relative group ${className}`}>
      {/* Sizzling Flame Icon */}
      {showFlameIcon && (
        <span className="relative flex items-center justify-center shrink-0">
          <Flame
            className={`animate-flame fill-amber-400 ${
              isGodlike
                ? 'w-5 h-5 text-red-500 fill-amber-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.9)]'
                : isSuperHot
                ? 'w-4 h-4 text-orange-500 fill-amber-400 drop-shadow-[0_0_6px_rgba(249,115,22,0.8)]'
                : 'w-3.5 h-3.5 text-amber-500 fill-yellow-400 drop-shadow-[0_0_4px_rgba(245,158,11,0.7)]'
            }`}
          />
          {isGodlike && (
            <Zap className="w-2.5 h-2.5 text-yellow-200 fill-current absolute -top-1 -right-1 animate-pulse" />
          )}
        </span>
      )}

      {/* Fiery Gradient Text with Shimmer and Drop Shadows */}
      <span
        className={`truncate ${sizeClasses} font-black ${
          isGodlike
            ? 'bg-gradient-to-r from-yellow-200 via-amber-400 to-rose-500 bg-clip-text text-transparent animate-fire-text drop-shadow-[0_0_12px_rgba(249,115,22,0.9)]'
            : isSuperHot
            ? 'bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500 bg-clip-text text-transparent animate-fire-text drop-shadow-[0_0_8px_rgba(249,115,22,0.75)]'
            : 'bg-gradient-to-r from-amber-200 via-amber-400 to-orange-400 bg-clip-text text-transparent drop-shadow-[0_0_6px_rgba(251,191,36,0.65)]'
        }`}
        title={`${name} (🔥 ${streak} Streak)`}
      >
        {name}
      </span>

      {/* Subtle Ember Sparkles */}
      {isGodlike && (
        <span className="text-[10px] text-amber-300 animate-pulse font-mono tracking-tighter shrink-0">
          ⚡
        </span>
      )}
    </span>
  );
};

interface StreakBadgeProps {
  streak?: number;
  size?: 'xs' | 'sm' | 'md';
  pulse?: boolean;
}

export const StreakBadge: React.FC<StreakBadgeProps> = ({
  streak = 0,
  size = 'sm',
  pulse = true,
}) => {
  if (streak < 2) return null;

  const isGodlike = streak >= 5;
  const isSuperHot = streak >= 3 && streak < 5;

  const badgeSize = {
    xs: 'text-[9px] px-1.5 py-0.5 gap-1',
    sm: 'text-[11px] px-2.5 py-0.5 gap-1',
    md: 'text-xs px-3 py-1 gap-1.5',
  }[size];

  return (
    <div
      className={`inline-flex items-center rounded-full font-black uppercase tracking-wider select-none shrink-0 ${badgeSize} ${
        isGodlike
          ? 'bg-gradient-to-r from-red-600 via-orange-600 to-amber-500 text-white border border-yellow-300/80 shadow-[0_0_15px_rgba(239,68,68,0.7)]'
          : isSuperHot
          ? 'bg-gradient-to-r from-orange-600 to-amber-500 text-white border border-orange-400/70 shadow-[0_0_10px_rgba(249,115,22,0.6)]'
          : 'bg-gradient-to-r from-amber-600/90 to-yellow-600/90 text-amber-100 border border-amber-400/60 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
      } ${pulse ? 'animate-bounce-subtle' : ''}`}
    >
      <Flame className="w-3 h-3 fill-amber-200 text-yellow-300 animate-flame" />
      <span>{streak}x {isGodlike ? 'UNSTOPPABLE' : isSuperHot ? 'ON FIRE' : 'STREAK'}</span>
    </div>
  );
};

interface StreakCelebrationBannerProps {
  streak: number;
  teamName: string;
}

export const StreakCelebrationBanner: React.FC<StreakCelebrationBannerProps> = ({
  streak,
  teamName,
}) => {
  if (streak < 2) return null;

  const isGodlike = streak >= 5;
  const isSuperHot = streak >= 3 && streak < 5;

  const subtitle = isGodlike
    ? '🔥 GODLIKE STREAK! Absolutely dominating the competition!'
    : isSuperHot
    ? '⚡ UNSTOPPABLE RUN! 3+ correct in a row!'
    : '🔥 ON FIRE! 2 correct in a row, keep it burning!';

  return (
    <div className="w-full relative overflow-hidden rounded-2xl bg-gradient-to-r from-rose-950/80 via-orange-950/90 to-amber-950/80 border-2 border-orange-500/80 p-3 sm:p-4 text-center shadow-xl shadow-orange-950/60 animate-fire-glow">
      {/* Floating Ember Particles in Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <span className="absolute left-[15%] bottom-1 w-1.5 h-1.5 rounded-full bg-amber-400 animate-ember opacity-80" />
        <span className="absolute left-[35%] bottom-2 w-2 h-2 rounded-full bg-orange-500 animate-ember opacity-90 [animation-delay:0.4s]" />
        <span className="absolute right-[25%] bottom-1 w-1.5 h-1.5 rounded-full bg-yellow-300 animate-ember opacity-70 [animation-delay:0.8s]" />
        <span className="absolute right-[10%] bottom-2 w-2 h-2 rounded-full bg-red-500 animate-ember opacity-80 [animation-delay:1.1s]" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-1.5">
        <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-orange-500/20 border border-orange-400/50 text-amber-300 text-xs font-black uppercase tracking-widest">
          <Flame className="w-4 h-4 fill-amber-400 text-red-500 animate-flame" />
          <span>{streak} QUESTION STREAK</span>
          <Flame className="w-4 h-4 fill-amber-400 text-red-500 animate-flame" />
        </div>

        <h3 className="text-base sm:text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-orange-400 to-red-400 tracking-wide drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]">
          {teamName} IS ON FIRE!
        </h3>

        <p className="text-xs text-amber-200/90 font-bold max-w-sm">
          {subtitle}
        </p>
      </div>
    </div>
  );
};

interface StreakAvatarAuraProps {
  children: React.ReactNode;
  streak?: number;
}

export const StreakAvatarAura: React.FC<StreakAvatarAuraProps> = ({
  children,
  streak = 0,
}) => {
  if (streak < 2) return <>{children}</>;

  const isGodlike = streak >= 5;
  const isSuperHot = streak >= 3;

  return (
    <div className="relative inline-flex items-center justify-center">
      {/* Outer Fiery Ring */}
      <div
        className={`absolute -inset-1.5 rounded-2xl opacity-90 filter blur-xs animate-fire-glow ${
          isGodlike
            ? 'bg-gradient-to-tr from-red-600 via-amber-500 to-yellow-400'
            : isSuperHot
            ? 'bg-gradient-to-tr from-orange-600 via-amber-500 to-yellow-300'
            : 'bg-gradient-to-tr from-amber-600 to-yellow-500'
        }`}
      />
      {/* Flame Crest on Avatar */}
      <span className="absolute -top-2 -right-2 z-10 bg-slate-950 rounded-full p-0.5 border border-amber-400 shadow-md">
        <Flame
          className={`w-4 h-4 fill-amber-400 animate-flame ${
            isGodlike ? 'text-red-500' : 'text-orange-500'
          }`}
        />
      </span>
      <div className="relative z-10">{children}</div>
    </div>
  );
};
