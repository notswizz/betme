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
        <title>BetBot</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="icon" type="image/png" href="/betbot.png" />
      </Head>

      {!isAuthenticated ? (
        <div className="h-[100dvh] bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
          <div className="w-full max-w-sm px-4 space-y-6">
            <h1 className="text-4xl font-bold text-center bg-gradient-to-r from-blue-400 via-blue-500 to-blue-400 text-transparent bg-clip-text animate-gradient-x">
              BetBot
            </h1>
            <LoginForm onSuccess={() => setIsAuthenticated(true)} />
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
