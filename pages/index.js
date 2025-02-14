import { useEffect, useState } from 'react';
import Head from 'next/head';
import ChatContainer from '../components/chat/ChatContainer';
import LoginForm from '../components/auth/LoginForm';
import SignupForm from '../components/auth/SignupForm';
import Scoreboard from '../components/scoreboard/Scoreboard';

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLogin, setShowLogin] = useState(true);
  
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://betshot.app';
  const title = 'BetChat - AI-Powered Sports Betting Assistant';
  const description = 'Experience the future of sports betting with BetChat. Get real-time AI analysis, smart bet recommendations, and manage your bets with our intuitive chat interface.';

  return (
    <>
      <Head>
        {/* Primary Meta Tags */}
        <title>{title}</title>
        <meta name="title" content={title} />
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#111827" />
        
        {/* Favicon */}
        <link rel="icon" type="image/png" href="/logo.png" />
        <link rel="apple-touch-icon" href="/logo.png" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={siteUrl} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={`${siteUrl}/logo.png`} />
        
        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content={siteUrl} />
        <meta property="twitter:title" content={title} />
        <meta property="twitter:description" content={description} />
        <meta property="twitter:image" content={`${siteUrl}/logo.png`} />
        
        {/* Additional Meta */}
        <meta name="application-name" content="BetChat" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="BetChat" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        
        {/* Manifest */}
        <link rel="manifest" href="/manifest.json" />
      </Head>

      {!isAuthenticated ? (
        <div className="h-[100dvh] bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center relative overflow-hidden">
          {/* Animated Background Elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full">
              <div className="absolute -top-[30%] -left-[20%] w-[800px] h-[800px] bg-blue-500/10 rounded-full blur-[150px] animate-pulse"></div>
              <div className="absolute -bottom-[30%] -right-[20%] w-[800px] h-[800px] bg-indigo-500/10 rounded-full blur-[150px] animate-pulse delay-1000"></div>
            </div>
          </div>

          {/* Header Navigation */}
          <nav className="absolute top-0 left-0 right-0 bg-gray-900/50 backdrop-blur-lg border-b border-gray-800/50 z-50">
            <div className="max-w-7xl mx-auto px-4">
              <div className="flex items-center justify-between h-16">
                <div className="flex items-center">
                  <img src="/logo.png" alt="BetChat Logo" className="h-8 w-8" />
                  <span className="ml-2 text-xl font-semibold text-white">BetChat</span>
                </div>
                <div className="flex items-center space-x-4">
                  <button onClick={() => setShowLogin(true)} className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
                    Sign In
                  </button>
                  <button onClick={() => setShowLogin(false)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                    Sign Up
                  </button>
                </div>
              </div>
            </div>
          </nav>

          <div className="relative w-full max-w-md px-4">
            {/* Auth Forms with Enhanced Styling */}
            <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-8 shadow-2xl">
              <div className="flex justify-center mb-6">
                <div className="relative w-16 h-16">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/30 to-indigo-500/30 rounded-full blur-xl transform scale-110 animate-pulse"></div>
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-800/90 to-gray-900/90 rounded-full flex items-center justify-center backdrop-blur-sm border border-gray-700/50 shadow-xl">
                    <img 
                      src="/logo.png" 
                      alt="BetChat Logo" 
                      className="w-12 h-12 object-contain transform hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                </div>
              </div>
              
              {showLogin ? (
                <div className="space-y-6">
                  <LoginForm onSuccess={() => setIsAuthenticated(true)} />
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-700"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-gray-800/50 text-gray-400">or</span>
                    </div>
                  </div>
                  <p className="text-center text-gray-400">
                    New to BetChat?{' '}
                    <button
                      onClick={() => setShowLogin(false)}
                      className="text-blue-400 hover:text-blue-300 transition-colors font-medium"
                    >
                      Create an account
                    </button>
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  <SignupForm onSuccess={() => setIsAuthenticated(true)} />
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-700"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-gray-800/50 text-gray-400">or</span>
                    </div>
                  </div>
                  <p className="text-center text-gray-400">
                    Already have an account?{' '}
                    <button
                      onClick={() => setShowLogin(true)}
                      className="text-blue-400 hover:text-blue-300 transition-colors font-medium"
                    >
                      Sign in
                    </button>
                  </p>
                </div>
              )}
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
