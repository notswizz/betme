import React, { useEffect, useRef } from 'react';

export default function GoogleSignInButton({ onSuccess }) {
  const buttonRef = useRef(null);

  useEffect(() => {
    if (window.google && buttonRef.current) {
      window.google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        callback: async (response) => {
          // response.credential contains the Google ID token
          try {
            const res = await fetch('/api/auth/google', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ idToken: response.credential })
            });
            const data = await res.json();
            if (res.ok) {
              localStorage.setItem('token', data.token);
              onSuccess();
            } else {
              console.error('Google login failed:', data.error);
            }
          } catch (error) {
            console.error('Error during Google sign-in:', error);
          }
        },
      });

      window.google.accounts.id.renderButton(buttonRef.current, {
        type: 'standard',
        theme: 'filled_black',
        size: 'large',
        text: 'continue_with',
        shape: 'pill',
        logo_alignment: 'center',
        width: '100%'
      });
    }
  }, [onSuccess]);

  return (
    <div className="relative group">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl blur opacity-50 group-hover:opacity-100 transition duration-200"></div>
      <div className="relative w-full h-14 flex items-center justify-center bg-gray-900 rounded-xl">
        <div ref={buttonRef} className="w-full" />
      </div>
    </div>
  );
} 