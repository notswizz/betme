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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {showLogin ? (
            <div>
              <LoginForm onSuccess={() => setIsAuthenticated(true)} />
              <p className="text-center mt-4">
                Don't have an account?{' '}
                <button
                  onClick={() => setShowLogin(false)}
                  className="text-blue-600 hover:underline"
                >
                  Sign up
                </button>
              </p>
            </div>
          ) : (
            <div>
              <SignupForm onSuccess={() => setIsAuthenticated(true)} />
              <p className="text-center mt-4">
                Already have an account?{' '}
                <button
                  onClick={() => setShowLogin(true)}
                  className="text-blue-600 hover:underline"
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
    <div className="h-[100dvh] overflow-hidden">
      <ChatContainer />
    </div>
  );
}
