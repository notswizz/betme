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
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-blue-400">BetChat</h1>
            <p className="text-gray-400 mt-2">Your AI-Powered Sports Betting Assistant</p>
          </div>
          
          {showLogin ? (
            <div>
              <LoginForm onSuccess={() => setIsAuthenticated(true)} />
              <p className="text-center mt-4 text-gray-400">
                New to BetChat?{' '}
                <button
                  onClick={() => setShowLogin(false)}
                  className="text-blue-400 hover:text-blue-300 hover:underline"
                >
                  Sign up now
                </button>
              </p>
            </div>
          ) : (
            <div>
              <SignupForm onSuccess={() => setIsAuthenticated(true)} />
              <p className="text-center mt-4 text-gray-400">
                Already have an account?{' '}
                <button
                  onClick={() => setShowLogin(true)}
                  className="text-blue-400 hover:text-blue-300 hover:underline"
                >
                  Login
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
