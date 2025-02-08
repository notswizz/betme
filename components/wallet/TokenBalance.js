import { useState, useEffect } from 'react';

export default function TokenBalance() {
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  const fetchBalance = async () => {
    try {
      const res = await fetch('/api/wallet/balance', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        setBalance(data.balance);
      }
    } catch (err) {
      console.error('Error fetching balance:', err);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, []);

  const handleAddTokens = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/wallet/balance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ amount: Number(amount) }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setBalance(data.balance);
        setAmount('');
        setError('');
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Error updating balance');
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
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              tokens
            </div>
          </div>
        </div>
        {error && <p className="text-red-500 bg-red-50 p-3 rounded-lg">{error}</p>}
        <button
          type="submit"
          className="w-full flex justify-center py-3 px-6 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transform transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md"
        >
          Add to Wallet
        </button>
      </form>
    </div>
  );
} 