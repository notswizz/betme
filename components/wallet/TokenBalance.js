import { useState, useEffect } from 'react';
import { isAuthenticated } from '@/utils/auth';

export default function TokenBalance() {
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
    <div className="p-6 bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg border border-gray-100">
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
        <div className="flex items-baseline">
          <p className="text-3xl font-bold text-blue-600">{balance}</p>
          <p className="ml-2 text-gray-500 font-medium">tokens</p>
        </div>
      </div>
      
      <form onSubmit={handleAddTokens} className="space-y-4">
        <div>
          <label htmlFor="amount" className="block text-sm font-semibold text-gray-700 mb-2">
            Add Tokens to Wallet
          </label>
          <div className="relative">
            <input
              id="amount"
              type="number"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="block w-full rounded-xl border-2 border-gray-200 p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder=""
              disabled={loading}
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              tokens
            </div>
          </div>
        </div>
        {error && <p className="text-red-500 bg-red-50 p-3 rounded-lg">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className={`w-full flex justify-center py-3 px-6 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transform transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {loading ? 'Processing...' : 'Add to Wallet'}
        </button>
      </form>
    </div>
  );
} 