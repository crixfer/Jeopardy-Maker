import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Star, Flame, Search, ArrowUpDown, Calendar, Award, RotateCcw } from 'lucide-react';
import { LeaderboardEntry } from '../types/game';
import { Avatar } from './Avatar';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, getDocs, setDoc, doc } from 'firebase/firestore';

interface LeaderboardViewProps {
  onRefresh?: () => void;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = () => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'totalScore' | 'gamesWon' | 'highestScore'>('totalScore');

  const fetchLeaderboards = async () => {
    setLoading(true);
    const path = 'leaderboards';
    try {
      const snap = await getDocs(collection(db, path));
      const list: LeaderboardEntry[] = [];
      snap.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as LeaderboardEntry);
      });

      if (list.length === 0) {
        // Populate default classroom demo data for instant out-of-the-box enjoyment
        const seedData: LeaderboardEntry[] = [
          {
            id: 'quantum-quizzers',
            teamName: 'Quantum Quizzers',
            avatarId: 'robo',
            totalScore: 4200,
            gamesPlayed: 5,
            gamesWon: 3,
            highestScore: 1600,
            lastPlayedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
          },
          {
            id: 'galactic-wizards',
            teamName: 'Galactic Wizards',
            avatarId: 'wizard',
            totalScore: 3800,
            gamesPlayed: 5,
            gamesWon: 2,
            highestScore: 1400,
            lastPlayedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
          },
          {
            id: 'cosmic-comets',
            teamName: 'Cosmic Comets',
            avatarId: 'cat',
            totalScore: 3100,
            gamesPlayed: 4,
            gamesWon: 1,
            highestScore: 1200,
            lastPlayedAt: new Date(Date.now() - 3600000 * 48).toISOString(),
          },
          {
            id: 'atomic-sparks',
            teamName: 'Atomic Sparks',
            avatarId: 'dino',
            totalScore: 2450,
            gamesPlayed: 3,
            gamesWon: 1,
            highestScore: 1100,
            lastPlayedAt: new Date(Date.now() - 3600000 * 72).toISOString(),
          },
          {
            id: 'shadow-ninjas',
            teamName: 'Shadow Ninjas',
            avatarId: 'ninja',
            totalScore: 1900,
            gamesPlayed: 3,
            gamesWon: 0,
            highestScore: 900,
            lastPlayedAt: new Date(Date.now() - 3600000 * 96).toISOString(),
          },
        ];

        for (const item of seedData) {
          try {
            await setDoc(doc(db, 'leaderboards', item.id), item);
          } catch (e) {
            console.error('Seed error:', e);
          }
        }
        setEntries(seedData);
      } else {
        setEntries(list);
      }
    } catch (err) {
      console.warn('Leaderboard fetch note:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboards();
  }, []);

  const filteredEntries = entries
    .filter((e) => e.teamName.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => b[sortBy] - a[sortBy]);

  const topTeam = filteredEntries[0];
  const totalPointsAwarded = entries.reduce((sum, e) => sum + e.totalScore, 0);
  const totalGamesPlayed = entries.reduce((sum, e) => sum + e.gamesPlayed, 0);

  return (
    <div className="flex-1 p-4 sm:p-6 max-w-5xl mx-auto w-full space-y-6">
      {/* Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-2 border-indigo-900/60 p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-bold uppercase tracking-wider">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>Classroom Hall of Fame</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Multi-Session Leaderboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-lg">
            Track points, victories, and stats across all classroom game sessions automatically.
          </p>
        </div>

        {/* Highlight Stats Pill */}
        <div className="grid grid-cols-2 gap-3 w-full md:w-auto">
          <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-2xl text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Total Points
            </span>
            <p className="text-lg font-mono font-black text-amber-400">
              {totalPointsAwarded.toLocaleString()}
            </p>
          </div>
          <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-2xl text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Active Teams
            </span>
            <p className="text-lg font-mono font-black text-emerald-400">
              {entries.length}
            </p>
          </div>
        </div>
      </div>

      {/* Podium Showcase for Top 3 */}
      {filteredEntries.length >= 3 && !searchQuery && (
        <div className="grid grid-cols-3 gap-3 sm:gap-4 items-end pt-4 pb-2">
          {/* 2nd Place */}
          <div className="bg-slate-900/90 border border-slate-700 rounded-3xl p-4 flex flex-col items-center text-center shadow-lg transform translate-y-3">
            <div className="w-8 h-8 rounded-full bg-slate-300 text-slate-950 font-black text-xs flex items-center justify-center mb-2 shadow">
              2
            </div>
            <Avatar avatarId={filteredEntries[1]?.avatarId} size="lg" />
            <h4 className="font-extrabold text-xs sm:text-sm text-white mt-2 truncate w-full">
              {filteredEntries[1]?.teamName}
            </h4>
            <span className="text-xs sm:text-sm font-mono font-bold text-slate-300 mt-0.5">
              {filteredEntries[1]?.totalScore} PTS
            </span>
          </div>

          {/* 1st Place Champion */}
          <div className="bg-gradient-to-b from-amber-500/20 via-slate-900 to-slate-900 border-2 border-amber-400 rounded-3xl p-5 flex flex-col items-center text-center shadow-2xl shadow-amber-500/20 relative">
            <div className="absolute -top-3 px-3 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] uppercase tracking-wider shadow">
              👑 Champion
            </div>
            <div className="w-10 h-10 rounded-full bg-amber-400 text-slate-950 font-black text-sm flex items-center justify-center mb-2 shadow-lg">
              1
            </div>
            <Avatar avatarId={filteredEntries[0]?.avatarId} size="xl" />
            <h4 className="font-black text-sm sm:text-base text-amber-300 mt-2 truncate w-full">
              {filteredEntries[0]?.teamName}
            </h4>
            <span className="text-sm sm:text-base font-mono font-black text-white mt-0.5">
              {filteredEntries[0]?.totalScore} PTS
            </span>
            <div className="text-[10px] text-amber-400/90 font-bold mt-1">
              {filteredEntries[0]?.gamesWon} Wins ({Math.round(((filteredEntries[0]?.gamesWon || 0) / (filteredEntries[0]?.gamesPlayed || 1)) * 100)}% Win Rate)
            </div>
          </div>

          {/* 3rd Place */}
          <div className="bg-slate-900/90 border border-slate-700 rounded-3xl p-4 flex flex-col items-center text-center shadow-lg transform translate-y-6">
            <div className="w-8 h-8 rounded-full bg-amber-700 text-amber-100 font-black text-xs flex items-center justify-center mb-2 shadow">
              3
            </div>
            <Avatar avatarId={filteredEntries[2]?.avatarId} size="lg" />
            <h4 className="font-extrabold text-xs sm:text-sm text-white mt-2 truncate w-full">
              {filteredEntries[2]?.teamName}
            </h4>
            <span className="text-xs sm:text-sm font-mono font-bold text-slate-300 mt-0.5">
              {filteredEntries[2]?.totalScore} PTS
            </span>
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-slate-900/90 border border-indigo-900/60 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search teams by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400">Sort By:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-slate-800 text-xs font-bold text-white border border-slate-700 rounded-xl px-3 py-2 cursor-pointer focus:outline-none"
          >
            <option value="totalScore">Total Points</option>
            <option value="gamesWon">Most Wins</option>
            <option value="highestScore">Single Game High</option>
          </select>

          <button
            onClick={fetchLeaderboards}
            title="Refresh Leaderboard"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Leaderboard Table List */}
      <div className="bg-slate-900 border border-indigo-900/60 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm text-slate-300">
            <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800 font-extrabold">
              <tr>
                <th className="py-3 px-4 text-center">Rank</th>
                <th className="py-3 px-4">Team</th>
                <th className="py-3 px-4 text-right">Total Score</th>
                <th className="py-3 px-4 text-center">Wins / Games</th>
                <th className="py-3 px-4 text-right">Win Rate</th>
                <th className="py-3 px-4 text-right">High Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredEntries.map((entry, index) => {
                const winRate = Math.round(((entry.gamesWon || 0) / (entry.gamesPlayed || 1)) * 100);

                return (
                  <tr
                    key={entry.id}
                    className="hover:bg-slate-800/50 transition-colors group"
                  >
                    {/* Rank */}
                    <td className="py-3.5 px-4 text-center font-black">
                      {index === 0 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-400 text-slate-950 text-xs font-black">
                          1
                        </span>
                      ) : index === 1 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-300 text-slate-950 text-xs font-black">
                          2
                        </span>
                      ) : index === 2 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-700 text-white text-xs font-black">
                          3
                        </span>
                      ) : (
                        <span className="text-slate-500 font-bold">#{index + 1}</span>
                      )}
                    </td>

                    {/* Team with animated avatar */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <Avatar avatarId={entry.avatarId} size="sm" />
                        <div>
                          <div className="font-extrabold text-white text-sm">
                            {entry.teamName}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Last played {new Date(entry.lastPlayedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Total Score */}
                    <td className="py-3.5 px-4 text-right font-mono font-black text-amber-400 text-sm sm:text-base">
                      {entry.totalScore.toLocaleString()} PTS
                    </td>

                    {/* Wins / Games */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="font-bold text-white">{entry.gamesWon}</span>
                      <span className="text-slate-500"> / {entry.gamesPlayed}</span>
                    </td>

                    {/* Win Rate */}
                    <td className="py-3.5 px-4 text-right">
                      <span className={`font-bold ${winRate >= 50 ? 'text-emerald-400' : 'text-slate-400'}`}>
                        {winRate}%
                      </span>
                    </td>

                    {/* Highest Single Game Score */}
                    <td className="py-3.5 px-4 text-right font-mono text-slate-300">
                      {entry.highestScore.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
