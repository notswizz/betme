import { useState, useEffect } from 'react';
import { isAuthenticated } from '@/utils/auth';

export default function BetStats() {
  // Using dummy data directly
  const [stats] = useState({
    total: 156,
    pending: 23,
    won: 89,
    reputation: {
      totalJudged: 45,
      accuracyRate: 92,
      rank: 7
    }
  });

  return (
    <div className="space-y-4">
      {/* Betting Stats Card */}
      <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-4 w-full">
        <div className="flex flex-col space-y-4">
          {/* Total Bets */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{stats.total}</div>
                <div className="text-sm text-gray-400 mt-0.5">Total Bets</div>
              </div>
            </div>
          </div>

          {/* Pending and Won Stats */}
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-400/0 via-amber-400/20 to-amber-400/0 animate-gradient-x"></div>
                <div className="w-5 h-5 bg-white/20 rounded-lg absolute animate-pulse"></div>
                <div className="w-1.5 h-5 bg-white rounded relative rotate-12 transform-gpu"></div>
              </div>
              <div>
                <div className="text-xl font-bold text-white">{stats.pending}</div>
                <div className="text-sm text-gray-400">Pending</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-green-400/0 via-green-400/20 to-green-400/0 animate-gradient-x"></div>
                <div className="w-5 h-5 bg-white/20 rounded-lg absolute animate-pulse"></div>
                <svg className="w-5 h-5 text-white relative" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <div className="text-xl font-bold text-white">{stats.won}</div>
                <div className="text-sm text-gray-400">Won</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Judging Stats Card */}
      <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 w-full">
        <div className="flex flex-col space-y-4">
          {/* Total Judged */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{stats.reputation.totalJudged}</div>
                <div className="text-sm text-gray-400 mt-0.5">Total Judged</div>
              </div>
            </div>
          </div>

          {/* Accuracy and Rank */}
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400/0 via-blue-400/20 to-blue-400/0 animate-gradient-x"></div>
                <div className="w-5 h-5 bg-white/20 rounded-lg absolute animate-pulse"></div>
                <svg className="w-5 h-5 text-white relative" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div>
                <div className="text-xl font-bold text-white">{stats.reputation.accuracyRate}%</div>
                <div className="text-sm text-gray-400">Accuracy</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center shadow-lg relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-pink-400/0 via-pink-400/20 to-pink-400/0 animate-gradient-x"></div>
                <div className="w-5 h-5 bg-white/20 rounded-lg absolute animate-pulse"></div>
                <svg className="w-5 h-5 text-white relative" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <div>
                <div className="text-xl font-bold text-white">#{stats.reputation.rank}</div>
                <div className="text-sm text-gray-400">Rank</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 