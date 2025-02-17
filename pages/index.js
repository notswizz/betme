import { useEffect, useState } from 'react';
import Head from 'next/head';
import ChatContainer from '../components/chat/ChatContainer';
import LoginForm from '../components/auth/LoginForm';

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  return (
    <>
      <Head>
        <title>BetBot - Your AI-Powered Sports Betting Assistant</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="description" content="BetBot - Your intelligent sports betting companion powered by AI" />
        <link rel="icon" type="image/png" href="/betbot.png" />
      </Head>

      {!isAuthenticated ? (
        <div className="min-h-[100dvh] bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-16">
            {/* Hero Section */}
            <div className="text-center mb-8 sm:mb-20">
              <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-3 sm:mb-6 bg-gradient-to-r from-blue-400 via-blue-500 to-blue-400 text-transparent bg-clip-text animate-gradient-x px-2">
                BetBot
              </h1>
              <p className="text-base sm:text-lg md:text-2xl text-gray-300 max-w-2xl mx-auto mb-6 sm:mb-12 px-3 leading-relaxed">
                Experience the future of sports betting with AI-powered insights and peer-to-peer wagering
              </p>
              <div className="w-full max-w-[280px] sm:max-w-sm mx-auto px-2">
                <LoginForm onSuccess={() => setIsAuthenticated(true)} />
              </div>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:gap-8 mt-8 px-2 sm:px-4">
              <div className="bg-gray-800/50 p-5 sm:p-6 rounded-xl border border-gray-700 hover:border-blue-500 transition-all duration-300 active:scale-[0.98] touch-manipulation">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="text-2xl sm:text-3xl">👥</div>
                  <h3 className="text-lg sm:text-xl font-semibold text-white">Peer-to-Peer Betting</h3>
                </div>
                <p className="text-gray-400 text-sm sm:text-base leading-relaxed">Connect directly with other bettors, create custom wagers, and enjoy lower fees with our P2P betting marketplace</p>
              </div>

              <div className="bg-gray-800/50 p-5 sm:p-6 rounded-xl border border-gray-700 hover:border-blue-500 transition-all duration-300 active:scale-[0.98] touch-manipulation">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="text-2xl sm:text-3xl">🤖</div>
                  <h3 className="text-lg sm:text-xl font-semibold text-white">AI Chat Interface</h3>
                </div>
                <p className="text-gray-400 text-sm sm:text-base leading-relaxed">Get instant betting insights, odds analysis, and personalized recommendations through our intuitive AI chat interface</p>
              </div>

              <div className="bg-gray-800/50 p-5 sm:p-6 rounded-xl border border-gray-700 hover:border-blue-500 transition-all duration-300 active:scale-[0.98] touch-manipulation">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="text-2xl sm:text-3xl">🔒</div>
                  <h3 className="text-lg sm:text-xl font-semibold text-white">Secure & Transparent</h3>
                </div>
                <p className="text-gray-400 text-sm sm:text-base leading-relaxed">Your bets and funds are protected with bank-level security, smart contracts, and transparent transaction records</p>
              </div>
            </div>

            {/* Social Proof Section */}
            <div className="mt-10 sm:mt-16 text-center">
              <div className="inline-flex items-center space-x-2 bg-gray-800/50 rounded-full px-4 py-2.5 text-sm text-gray-300">
                <span className="text-lg">⚡</span>
                <span>Join thousands of smart bettors using BetBot</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="h-[100dvh] overflow-hidden bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
          <div className="flex flex-col h-full">
            <ChatContainer />
          </div>
        </div>
      )}
    </>
  );
}
