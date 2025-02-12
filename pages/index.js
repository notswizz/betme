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
        <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
          {/* Background Gradients */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-[40%] -left-[20%] w-[600px] h-[600px] bg-blue-500/20 rounded-full blur-[120px]"></div>
            <div className="absolute -bottom-[40%] -right-[20%] w-[600px] h-[600px] bg-indigo-500/20 rounded-full blur-[120px]"></div>
          </div>

          <div className="relative w-full max-w-md">
            {/* Logo and Title */}
            <div className="text-center mb-8">
              <div className="inline-block mb-4">
                <div className="relative w-24 h-24 mx-auto">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/50 to-blue-600/50 rounded-full blur-xl transform scale-110 animate-pulse"></div>
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-800/80 to-gray-900/80 rounded-full flex items-center justify-center backdrop-blur-sm border border-gray-700/50">
                    <div className="relative w-20 h-20 transform hover:scale-105 transition-transform duration-300">
                      <img 
                        src="/logo.png" 
                        alt="BetChat Logo" 
                        className="w-full h-full object-contain"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-400/0 via-blue-400/10 to-blue-400/0 animate-gradient-x rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-100 via-blue-300 to-blue-100 text-transparent bg-clip-text mb-3 animate-gradient-x">
                BetChat
              </h1>
              <p className="text-gray-400 text-lg">Your AI-Powered Sports Betting Assistant</p>
            </div>
            
            {/* Auth Forms */}
            {showLogin ? (
              <div className="space-y-4">
                <LoginForm onSuccess={() => setIsAuthenticated(true)} />
                <p className="text-center text-gray-400">
                  New to BetChat?{' '}
                  <button
                    onClick={() => setShowLogin(false)}
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Create an account
                  </button>
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <SignupForm onSuccess={() => setIsAuthenticated(true)} />
                <p className="text-center text-gray-400">
                  Already have an account?{' '}
                  <button
                    onClick={() => setShowLogin(true)}
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Sign in
                  </button>
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="h-[100dvh] overflow-hidden bg-gray-900">
          <div className="flex flex-col h-full">
            <ChatContainer />
          </div>
        </div>
      )}
    </>
  );
}
