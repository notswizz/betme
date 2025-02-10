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
    <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-4 w-full">
      <div className="flex flex-col space-y-3">
        {/* Balance Display */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{balance.toLocaleString()}</div>
              <div className="text-xs text-gray-400">Available Tokens</div>
            </div>
          </div>
          <button
            onClick={() => setShowAddTokens(!showAddTokens)}
            className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-medium rounded-lg 
            hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl
            flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add
          </button>
        </div>

        {/* Add Tokens Form - Only shown when showAddTokens is true */}
        {showAddTokens && (
          <form onSubmit={handleAddTokens} className="flex flex-col gap-2 pt-2">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Amount"
              className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-500 
              focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2 rounded-lg font-medium text-sm ${
                loading
                  ? 'bg-gray-700 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
              } text-white transition-all duration-200 shadow-lg hover:shadow-xl`}
            >
              {loading ? 'Adding...' : 'Confirm Add Tokens'}
            </button>
          </form>
        )}

        {/* Error Message */}
        {error && (
          <div className="text-red-400 text-sm mt-1">
            {error}
          </div>
        )}
      </div>
    </div>
  );
} 