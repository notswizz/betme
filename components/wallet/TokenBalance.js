import { useState, useEffect } from 'react';
import { isAuthenticated } from '@/utils/auth';

export default function TokenBalance() {
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAddTokens, setShowAddTokens] = useState(false);

  const fetchBalance = async () => {
    try {
      if (!isAuthenticated()) {
        setError('Please login to view your balance');
        return;
      }

      const token = localStorage.getItem('token');
      const res = await fetch('/api/actions/balance', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const data = await res.json();
        if (res.status === 401) {
          localStorage.removeItem('token'); // Clear invalid token
          setError('Session expired. Please login again.');
        } else {
          setError(data.error || 'Error fetching balance');
        }
        return;
      }

      const data = await res.json();
      setBalance(data.balance);
      setError('');
    } catch (err) {
      console.error('Error fetching balance:', err);
      setError('Error connecting to server');
    }
  };

  useEffect(() => {
    fetchBalance();
  }, []);

  const handleAddTokens = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!isAuthenticated()) {
        setError('Please login to add tokens');
        return;
      }

      if (!amount || isNaN(amount) || Number(amount) <= 0) {
        setError('Please enter a valid amount');
        return;
      }

      const token = localStorage.getItem('token');
      const res = await fetch('/api/actions/balance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ amount: Number(amount) }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem('token');
          setError('Session expired. Please login again.');
        } else {
          setError(data.error || 'Error adding tokens');
        }
        return;
      }

      setBalance(data.balance);
      setAmount('');
      setError('');
    } catch (err) {
      console.error('Error adding tokens:', err);
      setError('Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl rounded-xl sm:rounded-2xl p-3 sm:p-4 w-full mt-6 sm:mt-12 border border-gray-800/50 shadow-xl">
      <div className="flex flex-col space-y-2 sm:space-y-3">
        {/* Balance Display */}
        <div className="flex items-center justify-between py-1 sm:py-2">
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Enhanced Token Icon */}
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 flex items-center justify-center shadow-lg relative group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400/0 via-blue-400/30 to-blue-400/0 opacity-0 group-hover:opacity-100 animate-gradient-x transition-opacity duration-700"></div>
              <div className="absolute inset-0 bg-blue-500/20 rounded-xl animate-pulse-slow"></div>
              <div className="relative flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" className="opacity-50"/>
                  <path d="M12 6v12M8 12h8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="opacity-90"/>
                  <path d="M12 2v4M12 18v4M6 12H2M22 12h-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="opacity-70"/>
                </svg>
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-100 via-blue-300 to-blue-100 text-transparent bg-clip-text animate-gradient-x">{balance.toLocaleString()}</div>
              <div className="text-xs sm:text-sm text-gray-400 mt-0.5">Available Tokens</div>
            </div>
          </div>
          {/* Enhanced Add Button */}
          <div className="flex-shrink-0 -mr-1">
            <button
              onClick={() => setShowAddTokens(!showAddTokens)}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl relative group overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 opacity-90 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400/0 via-blue-400/30 to-blue-400/0 opacity-0 group-hover:opacity-100 animate-gradient-x"></div>
              <div className="absolute inset-[1px] rounded-[8px] sm:rounded-[10px] bg-gray-900/90 flex items-center justify-center">
                <div className="relative transform group-hover:scale-110 transition-transform duration-300">
                  <div className="absolute inset-0 w-3 h-3 sm:w-4 sm:h-4 bg-blue-400/20 rounded-lg animate-ping"></div>
                  <svg className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400 relative" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Add Tokens Form - Only shown when showAddTokens is true */}
        {showAddTokens && (
          <form onSubmit={handleAddTokens} className="flex flex-col gap-2 pt-1 sm:pt-2">
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Amount"
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-gray-800/50 border border-gray-700/50 rounded-lg sm:rounded-xl text-sm sm:text-base text-white placeholder-gray-500 
                focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-200"
              />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-blue-500/0 animate-gradient-x pointer-events-none"></div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="relative w-full py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-medium text-xs sm:text-sm overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-green-500 via-green-600 to-green-500 opacity-90 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-green-400/0 via-green-400/30 to-green-400/0 opacity-0 group-hover:opacity-100 animate-gradient-x"></div>
              <span className="relative text-white transform group-hover:scale-105 transition-transform duration-300">
                {loading ? 'Adding...' : 'Add Tokens'}
              </span>
            </button>
          </form>
        )}

        {/* Error Message */}
        {error && (
          <div className="text-red-400 text-xs sm:text-sm mt-1 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-red-500/10 border border-red-500/20">
            {error}
          </div>
        )}
      </div>
    </div>
  );
} 