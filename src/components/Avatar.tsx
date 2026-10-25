import React from 'react';

export interface AvatarOption {
  id: string;
  name: string;
  primaryColor: string;
  accentColor: string;
}

export const AVATAR_OPTIONS: AvatarOption[] = [
  { id: 'robo', name: 'Robo-Byte', primaryColor: '#3b82f6', accentColor: '#60a5fa' },
  { id: 'dino', name: 'Dino-Spark', primaryColor: '#10b981', accentColor: '#34d399' },
  { id: 'cat', name: 'Astro-Cat', primaryColor: '#f59e0b', accentColor: '#fbbf24' },
  { id: 'wizard', name: 'Wizard-Wiz', primaryColor: '#8b5cf6', accentColor: '#a78bfa' },
  { id: 'fox', name: 'Pixel-Fox', primaryColor: '#f97316', accentColor: '#fb923c' },
  { id: 'alien', name: 'Cosmic-Alien', primaryColor: '#06b6d4', accentColor: '#22d3ee' },
  { id: 'bear', name: 'Rocket-Bear', primaryColor: '#ec4899', accentColor: '#f472b6' },
  { id: 'owl', name: 'Cyber-Owl', primaryColor: '#6366f1', accentColor: '#818cf8' },
  { id: 'octo', name: 'Super-Octo', primaryColor: '#14b8a6', accentColor: '#2dd4bf' },
  { id: 'ninja', name: 'Shadow-Ninja', primaryColor: '#64748b', accentColor: '#94a3b8' },
  { id: 'dragon', name: 'Blaze-Dragon', primaryColor: '#ef4444', accentColor: '#f87171' },
  { id: 'penguin', name: 'Frosty-Puff', primaryColor: '#0284c7', accentColor: '#38bdf8' },
  { id: 'tiger', name: 'Thunder-Tiger', primaryColor: '#eab308', accentColor: '#facc15' },
  { id: 'shark', name: 'Aqua-Shark', primaryColor: '#0284c7', accentColor: '#38bdf8' },
  { id: 'koala', name: 'Zen-Koala', primaryColor: '#94a3b8', accentColor: '#cbd5e1' },
  { id: 'phoenix', name: 'Solar-Phoenix', primaryColor: '#f43f5e', accentColor: '#fb7185' },
];

export const TEAM_NAME_PREFIXES = [
  'Quantum', 'Galactic', 'Atomic', 'Curious', 'Cyber',
  'Cosmic', 'Hyper', 'Sonic', 'Trivia', 'Brainy',
  'Golden', 'Electric', 'Super', 'Clever', 'Infinite'
];

export const TEAM_NAME_NOUNS = [
  'Titans', 'Comets', 'Wizards', 'Challengers', 'Hawks',
  'Knights', 'Scholars', 'Voyagers', 'Ninjas', 'Dragons',
  'Quizzers', 'Pioneers', 'Sparks', 'Champions', 'Rockets'
];

export function getRandomTeam(): { name: string; avatarId: string; color: string } {
  const prefix = TEAM_NAME_PREFIXES[Math.floor(Math.random() * TEAM_NAME_PREFIXES.length)];
  const noun = TEAM_NAME_NOUNS[Math.floor(Math.random() * TEAM_NAME_NOUNS.length)];
  const avatar = AVATAR_OPTIONS[Math.floor(Math.random() * AVATAR_OPTIONS.length)];
  return {
    name: `${prefix} ${noun}`,
    avatarId: avatar.id,
    color: avatar.primaryColor,
  };
}

interface AvatarProps {
  avatarId?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animated?: boolean;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  avatarId = 'robo',
  size = 'md',
  animated = true,
  className = '',
}) => {
  const sizeMap = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  const animClass = animated ? 'animate-bounce-subtle hover:scale-110 transition-transform' : '';

  const renderSvg = () => {
    switch (avatarId) {
      case 'dino':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            <circle cx="50" cy="50" r="46" fill="#10b981" />
            <path d="M42 22 L50 14 L58 22" fill="#047857" />
            <path d="M54 18 L62 10 L70 18" fill="#047857" />
            <path d="M25 50 Q25 28 50 28 Q75 28 75 52 Q75 75 50 75 Q25 75 25 50 Z" fill="#34d399" />
            <ellipse cx="42" cy="45" rx="5" ry="6" fill="#0f172a" />
            <circle cx="44" cy="43" r="2" fill="#ffffff" />
            <ellipse cx="62" cy="45" rx="5" ry="6" fill="#0f172a" />
            <circle cx="64" cy="43" r="2" fill="#ffffff" />
            <path d="M44 60 Q52 68 60 60" stroke="#047857" strokeWidth="3" strokeLinecap="round" fill="none" />
            <circle cx="34" cy="56" r="4" fill="#f87171" opacity="0.6" />
            <circle cx="70" cy="56" r="4" fill="#f87171" opacity="0.6" />
          </svg>
        );
      case 'cat':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            <circle cx="50" cy="50" r="46" fill="#f59e0b" />
            {/* Ears */}
            <polygon points="26,38 34,16 48,30" fill="#d97706" />
            <polygon points="74,38 66,16 52,30" fill="#d97706" />
            <polygon points="30,34 36,22 44,30" fill="#fef3c7" />
            <polygon points="70,34 64,22 56,30" fill="#fef3c7" />
            {/* Space Helmet */}
            <circle cx="50" cy="52" r="32" fill="#e0f2fe" opacity="0.9" stroke="#94a3b8" strokeWidth="3" />
            {/* Face */}
            <ellipse cx="40" cy="50" rx="4.5" ry="5.5" fill="#1e293b" />
            <circle cx="42" cy="48" r="1.5" fill="#fff" />
            <ellipse cx="60" cy="50" rx="4.5" ry="5.5" fill="#1e293b" />
            <circle cx="62" cy="48" r="1.5" fill="#fff" />
            <polygon points="50,57 47,60 53,60" fill="#f43f5e" />
            <path d="M45 64 Q50 67 55 64" stroke="#475569" strokeWidth="2" fill="none" strokeLinecap="round" />
            {/* Helmet reflection */}
            <path d="M30 40 Q40 32 58 32" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.8" />
          </svg>
        );
      case 'wizard':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            <circle cx="50" cy="50" r="46" fill="#8b5cf6" />
            {/* Hat */}
            <path d="M22 45 L50 10 L78 45 Z" fill="#4c1d95" />
            <ellipse cx="50" cy="45" rx="36" ry="6" fill="#6d28d9" />
            <polygon points="50,22 52,26 56,26 53,29 54,33 50,31 46,33 47,29 44,26 48,26" fill="#fde047" />
            {/* Face */}
            <circle cx="50" cy="60" r="22" fill="#fed7aa" />
            <circle cx="42" cy="57" r="3" fill="#1e1b4b" />
            <circle cx="58" cy="57" r="3" fill="#1e1b4b" />
            {/* Beard */}
            <path d="M36 64 Q50 90 64 64 Q50 74 36 64 Z" fill="#ffffff" />
            {/* Glasses */}
            <circle cx="42" cy="57" r="6" stroke="#fbbf24" strokeWidth="2" fill="none" />
            <circle cx="58" cy="57" r="6" stroke="#fbbf24" strokeWidth="2" fill="none" />
            <line x1="48" y1="57" x2="52" y2="57" stroke="#fbbf24" strokeWidth="2" />
          </svg>
        );
      case 'fox':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            <circle cx="50" cy="50" r="46" fill="#f97316" />
            {/* Ears */}
            <polygon points="22,40 28,15 45,35" fill="#c2410c" />
            <polygon points="78,40 72,15 55,35" fill="#c2410c" />
            <polygon points="26,36 30,22 40,34" fill="#fed7aa" />
            <polygon points="74,36 70,22 60,34" fill="#fed7aa" />
            {/* Face & Cheeks */}
            <path d="M26 48 Q50 78 74 48 Q78 68 50 82 Q22 68 26 48 Z" fill="#fff7ed" />
            <circle cx="40" cy="48" r="4" fill="#0f172a" />
            <circle cx="60" cy="48" r="4" fill="#0f172a" />
            <ellipse cx="50" cy="62" rx="4.5" ry="3.5" fill="#0f172a" />
          </svg>
        );
      case 'alien':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            <circle cx="50" cy="50" r="46" fill="#06b6d4" />
            {/* Antennae */}
            <line x1="50" y1="30" x2="50" y2="15" stroke="#0891b2" strokeWidth="4" />
            <circle cx="50" cy="13" r="6" fill="#a7f3d0" />
            {/* Head */}
            <ellipse cx="50" cy="54" rx="30" ry="24" fill="#67e8f9" />
            {/* Three Eyes */}
            <circle cx="36" cy="48" r="6" fill="#ffffff" />
            <circle cx="36" cy="48" r="3" fill="#0e7490" />
            <circle cx="50" cy="44" r="7" fill="#ffffff" />
            <circle cx="50" cy="44" r="3.5" fill="#0e7490" />
            <circle cx="64" cy="48" r="6" fill="#ffffff" />
            <circle cx="64" cy="48" r="3" fill="#0e7490" />
            {/* Smile */}
            <path d="M42 63 Q50 70 58 63" stroke="#0e7490" strokeWidth="3" strokeLinecap="round" fill="none" />
          </svg>
        );
      case 'bear':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            <circle cx="50" cy="50" r="46" fill="#ec4899" />
            {/* Ears */}
            <circle cx="30" cy="30" r="12" fill="#be185d" />
            <circle cx="30" cy="30" r="6" fill="#fbcfe8" />
            <circle cx="70" cy="30" r="12" fill="#be185d" />
            <circle cx="70" cy="30" r="6" fill="#fbcfe8" />
            {/* Head */}
            <circle cx="50" cy="55" r="28" fill="#f472b6" />
            {/* Snout */}
            <ellipse cx="50" cy="62" rx="14" ry="10" fill="#fdf2f8" />
            <circle cx="42" cy="50" r="3.5" fill="#0f172a" />
            <circle cx="58" cy="50" r="3.5" fill="#0f172a" />
            <ellipse cx="50" cy="59" rx="4" ry="3" fill="#0f172a" />
            <path d="M47 64 Q50 67 53 64" stroke="#0f172a" strokeWidth="2" fill="none" strokeLinecap="round" />
          </svg>
        );
      case 'owl':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            <circle cx="50" cy="50" r="46" fill="#6366f1" />
            {/* Ear tufts */}
            <polygon points="30,35 24,18 42,30" fill="#4338ca" />
            <polygon points="70,35 76,18 58,30" fill="#4338ca" />
            {/* Body */}
            <ellipse cx="50" cy="54" rx="28" ry="26" fill="#818cf8" />
            {/* Big glasses eyes */}
            <circle cx="40" cy="48" r="11" fill="#ffffff" stroke="#fbbf24" strokeWidth="2" />
            <circle cx="60" cy="48" r="11" fill="#ffffff" stroke="#fbbf24" strokeWidth="2" />
            <circle cx="40" cy="48" r="5" fill="#1e1b4b" />
            <circle cx="60" cy="48" r="5" fill="#1e1b4b" />
            <polygon points="50,56 46,63 54,63" fill="#f59e0b" />
            <path d="M40 70 Q50 78 60 70" stroke="#4338ca" strokeWidth="2" fill="none" />
          </svg>
        );
      case 'dragon':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            <circle cx="50" cy="50" r="46" fill="#ef4444" />
            {/* Horns */}
            <polygon points="34,35 26,16 42,28" fill="#fbbf24" />
            <polygon points="66,35 74,16 58,28" fill="#fbbf24" />
            {/* Head */}
            <ellipse cx="50" cy="55" rx="28" ry="25" fill="#f87171" />
            <circle cx="40" cy="48" r="5" fill="#fef08a" />
            <ellipse cx="40" cy="48" rx="2" ry="4" fill="#0f172a" />
            <circle cx="60" cy="48" r="5" fill="#fef08a" />
            <ellipse cx="60" cy="48" rx="2" ry="4" fill="#0f172a" />
            {/* Snout */}
            <circle cx="46" cy="62" r="2" fill="#7f1d1d" />
            <circle cx="54" cy="62" r="2" fill="#7f1d1d" />
            {/* Little fire puff */}
            <path d="M48 68 Q50 76 54 72 Q50 78 46 72 Z" fill="#fbbf24" />
          </svg>
        );
      case 'ninja':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            <circle cx="50" cy="50" r="46" fill="#475569" />
            {/* Headband */}
            <circle cx="50" cy="50" r="30" fill="#1e293b" />
            <rect x="22" y="32" width="56" height="12" rx="4" fill="#ef4444" />
            {/* Eye slit */}
            <rect x="30" y="44" width="40" height="14" rx="4" fill="#fcd34d" />
            <circle cx="42" cy="51" r="3" fill="#0f172a" />
            <circle cx="58" cy="51" r="3" fill="#0f172a" />
            {/* Fierce eyebrows */}
            <line x1="38" y1="46" x2="45" y2="48" stroke="#78350f" strokeWidth="2" />
            <line x1="62" y1="46" x2="55" y2="48" stroke="#78350f" strokeWidth="2" />
          </svg>
        );
      case 'octo':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            <circle cx="50" cy="50" r="46" fill="#14b8a6" />
            {/* Head */}
            <ellipse cx="50" cy="45" rx="28" ry="24" fill="#2dd4bf" />
            {/* Tentacles */}
            <circle cx="28" cy="68" r="6" fill="#0d9488" />
            <circle cx="42" cy="72" r="6" fill="#0d9488" />
            <circle cx="58" cy="72" r="6" fill="#0d9488" />
            <circle cx="72" cy="68" r="6" fill="#0d9488" />
            {/* Cute eyes */}
            <circle cx="40" cy="44" r="5" fill="#0f172a" />
            <circle cx="42" cy="42" r="2" fill="#ffffff" />
            <circle cx="60" cy="44" r="5" fill="#0f172a" />
            <circle cx="62" cy="42" r="2" fill="#ffffff" />
            {/* Tiny bubble mouth */}
            <circle cx="50" cy="54" r="3.5" fill="#0f172a" />
          </svg>
        );
      case 'penguin':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            <circle cx="50" cy="50" r="46" fill="#0284c7" />
            {/* Body */}
            <ellipse cx="50" cy="54" rx="26" ry="28" fill="#0f172a" />
            <ellipse cx="50" cy="58" rx="18" ry="20" fill="#ffffff" />
            {/* Scarf */}
            <rect x="30" y="52" width="40" height="8" rx="4" fill="#f43f5e" />
            {/* Eyes */}
            <circle cx="42" cy="44" r="3" fill="#ffffff" />
            <circle cx="42" cy="44" r="1.5" fill="#0f172a" />
            <circle cx="58" cy="44" r="3" fill="#ffffff" />
            <circle cx="58" cy="44" r="1.5" fill="#0f172a" />
            {/* Beak */}
            <polygon points="50,47 46,52 54,52" fill="#f59e0b" />
          </svg>
        );
      case 'tiger':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            <circle cx="50" cy="50" r="46" fill="#eab308" />
            <circle cx="28" cy="28" r="10" fill="#ca8a04" />
            <circle cx="72" cy="28" r="10" fill="#ca8a04" />
            <circle cx="50" cy="54" r="28" fill="#facc15" />
            {/* Tiger stripes */}
            <path d="M50 26 L50 36 M38 32 L46 38 M62 32 L54 38 M26 50 L34 52 M74 50 L66 52" stroke="#713f12" strokeWidth="3" strokeLinecap="round" />
            <circle cx="40" cy="50" r="4" fill="#0f172a" />
            <circle cx="60" cy="50" r="4" fill="#0f172a" />
            <ellipse cx="50" cy="62" rx="10" ry="7" fill="#fef08a" />
            <polygon points="50,60 46,57 54,57" fill="#713f12" />
          </svg>
        );
      case 'shark':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            <circle cx="50" cy="50" r="46" fill="#0284c7" />
            {/* Fin */}
            <polygon points="50,14 42,32 58,32" fill="#0369a1" />
            <ellipse cx="50" cy="54" rx="28" ry="24" fill="#38bdf8" />
            <ellipse cx="50" cy="62" rx="20" ry="14" fill="#f0f9ff" />
            <circle cx="38" cy="48" r="4" fill="#0f172a" />
            <circle cx="62" cy="48" r="4" fill="#0f172a" />
            {/* Friendly sharp smile */}
            <path d="M40 64 Q50 72 60 64" stroke="#0369a1" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          </svg>
        );
      case 'koala':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            <circle cx="50" cy="50" r="46" fill="#94a3b8" />
            {/* Fluffy ears */}
            <circle cx="26" cy="32" r="14" fill="#64748b" />
            <circle cx="26" cy="32" r="8" fill="#f1f5f9" />
            <circle cx="74" cy="32" r="14" fill="#64748b" />
            <circle cx="74" cy="32" r="8" fill="#f1f5f9" />
            <ellipse cx="50" cy="55" rx="26" ry="24" fill="#cbd5e1" />
            <circle cx="40" cy="48" r="3.5" fill="#0f172a" />
            <circle cx="60" cy="48" r="3.5" fill="#0f172a" />
            {/* Big koala nose */}
            <ellipse cx="50" cy="58" rx="7" ry="10" fill="#1e293b" />
          </svg>
        );
      case 'phoenix':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            <circle cx="50" cy="50" r="46" fill="#f43f5e" />
            {/* Fire crest */}
            <path d="M50 14 Q44 26 50 34 Q56 26 50 14 Z" fill="#fbbf24" />
            <path d="M38 22 Q40 32 46 36 Q38 32 38 22 Z" fill="#f97316" />
            <path d="M62 22 Q60 32 54 36 Q62 32 62 22 Z" fill="#f97316" />
            <ellipse cx="50" cy="55" rx="26" ry="24" fill="#fb7185" />
            <circle cx="42" cy="50" r="4" fill="#450a0a" />
            <circle cx="58" cy="50" r="4" fill="#450a0a" />
            <polygon points="50,54 44,62 56,62" fill="#fbbf24" />
          </svg>
        );
      case 'robo':
      default:
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            <circle cx="50" cy="50" r="46" fill="#3b82f6" />
            {/* Antenna */}
            <line x1="50" y1="28" x2="50" y2="16" stroke="#93c5fd" strokeWidth="4" />
            <circle cx="50" cy="14" r="5" fill="#fbbf24" />
            {/* Head Box */}
            <rect x="25" y="28" width="50" height="42" rx="8" fill="#60a5fa" stroke="#1d4ed8" strokeWidth="3" />
            {/* Ears */}
            <rect x="18" y="42" width="7" height="14" rx="2" fill="#93c5fd" />
            <rect x="75" y="42" width="7" height="14" rx="2" fill="#93c5fd" />
            {/* Screen */}
            <rect x="31" y="35" width="38" height="26" rx="4" fill="#1e293b" />
            {/* Glowing Eyes */}
            <rect x="36" y="40" width="8" height="8" rx="2" fill="#34d399" />
            <rect x="56" y="40" width="8" height="8" rx="2" fill="#34d399" />
            {/* LED smile */}
            <line x1="42" y1="54" x2="58" y2="54" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        );
    }
  };

  return (
    <div className={`relative flex items-center justify-center shrink-0 ${sizeMap[size]} ${animClass} ${className}`}>
      {renderSvg()}
    </div>
  );
};
