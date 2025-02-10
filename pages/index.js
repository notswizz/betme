import { useEffect, useState } from 'react';
import ChatContainer from '../components/chat/ChatContainer';
import LoginForm from '../components/auth/LoginForm';
import SignupForm from '../components/auth/SignupForm';

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLogin, setShowLogin] = useState(true);
  
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  if (!isAuthenticated) {
    return (
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
              <div className="relative w-16 h-16 mx-auto">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl transform rotate-6 scale-105"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl flex items-center justify-center">
                  <span className="text-2xl">🎯</span>
                </div>
              </div>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-blue-300 text-transparent bg-clip-text mb-2">
              BetChat
            </h1>
            <p className="text-gray-400">Your AI-Powered Sports Betting Assistant</p>
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
    );
  }

  return (
    <div className="h-[100dvh] overflow-hidden bg-gray-900">
      <ChatContainer />
    </div>
  );
}
