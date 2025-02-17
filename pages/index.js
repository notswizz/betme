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
        <title>BetBot - AI Powered Peer-to-Peer Sports Betting Chatbot</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, viewport-fit=cover" />
        <meta name="description" content="BetBot is your AI peer-to-peer sports betting chatbot. Create custom wagers, get real-time insights, and connect with other bettors in a secure environment." />
        <meta name="keywords" content="BetBot, sports betting, AI chatbot, peer-to-peer betting, P2P betting, sports wagering, betting assistant" />
        <meta property="og:title" content="BetBot - AI Peer-to-Peer Sports Betting Chatbot" />
        <meta property="og:description" content="Experience the future of sports betting with BetBot - your AI-powered peer-to-peer betting assistant. Create custom wagers and get real-time insights." />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="BetBot - AI Sports Betting Chatbot" />
        <meta name="twitter:description" content="Your AI peer-to-peer sports betting companion. Create wagers, get insights, connect with bettors." />
        <link rel="icon" type="image/png" href="/betbot.png" />
      </Head>

      {!isAuthenticated ? (
        <div className="min-h-[100dvh] bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 w-full overflow-hidden">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-16">
            {/* Hero Section */}
            <div className="text-center mb-8 sm:mb-20">
              <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-3 sm:mb-6 bg-gradient-to-r from-blue-400 via-blue-500 to-blue-400 text-transparent bg-clip-text animate-gradient-x px-2">
                BetBot
              </h1>
              <p className="text-base sm:text-lg md:text-2xl text-gray-300 max-w-2xl mx-auto mb-6 sm:mb-12 px-3 leading-relaxed">
                The First AI Peer-to-Peer Sports Betting Platform
              </p>
              <p className="text-sm sm:text-base text-gray-400 max-w-xl mx-auto mb-8 px-3">
                Create custom wagers, get AI insights, and connect with other bettors - all in one secure platform
              </p>
              <div className="w-full max-w-[280px] sm:max-w-sm mx-auto px-2">
                <LoginForm onSuccess={() => setIsAuthenticated(true)} />
              </div>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mt-8 px-2 sm:px-4">
              <div className="bg-gray-800/50 p-5 sm:p-6 rounded-xl border border-gray-700 hover:border-blue-500 transition-all duration-300 active:scale-[0.98] touch-manipulation">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="text-2xl sm:text-3xl">🤖</div>
                  <h3 className="text-lg sm:text-xl font-semibold text-white">AI Insights</h3>
                </div>
                <p className="text-gray-400 text-sm sm:text-base leading-relaxed">Get real-time betting analysis, odds comparisons, and personalized recommendations from our advanced AI chatbot</p>
              </div>

              <div className="bg-gray-800/50 p-5 sm:p-6 rounded-xl border border-gray-700 hover:border-blue-500 transition-all duration-300 active:scale-[0.98] touch-manipulation">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="text-2xl sm:text-3xl">👥</div>
                  <h3 className="text-lg sm:text-xl font-semibold text-white">P2P Betting Network</h3>
                </div>
                <p className="text-gray-400 text-sm sm:text-base leading-relaxed">Create and accept custom wagers directly with other bettors. No bookmaker fees, just pure peer-to-peer action</p>
              </div>

              <div className="bg-gray-800/50 p-5 sm:p-6 rounded-xl border border-gray-700 hover:border-blue-500 transition-all duration-300 active:scale-[0.98] touch-manipulation">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="text-2xl sm:text-3xl">🔒</div>
                  <h3 className="text-lg sm:text-xl font-semibold text-white">Secure & Fair</h3>
                </div>
                <p className="text-gray-400 text-sm sm:text-base leading-relaxed">Bank-level security, transparent smart contracts, and automated fair play systems protect every transaction</p>
              </div>
            </div>

            {/* Social Proof Section */}
            <div className="mt-10 sm:mt-16 text-center space-y-4">
              <div className="inline-flex items-center space-x-2 bg-gray-800/50 rounded-full px-4 py-2.5 text-sm text-gray-300">
                <span className="text-lg">⚡</span>
                <span>Join thousands of smart bettors on BetBot</span>
              </div>
              <div className="flex justify-center gap-4 flex-wrap">
                <div className="bg-gray-800/30 rounded-full px-4 py-2 text-sm text-gray-400">
                  24/7 AI Support
                </div>
                <div className="bg-gray-800/30 rounded-full px-4 py-2 text-sm text-gray-400">
                  Zero Platform Fees
                </div>
                <div className="bg-gray-800/30 rounded-full px-4 py-2 text-sm text-gray-400">
                  Instant Settlements
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="h-[100dvh] w-full overflow-hidden bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
          <div className="flex flex-col h-full w-full">
            <ChatContainer />
          </div>
        </div>
      )}
    </>
  );
}
