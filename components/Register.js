import React, { useState } from 'react';

const Register = ({ onRegisterSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Save JWT token to localStorage
        localStorage.setItem('jwtToken', data.token);
        onRegisterSuccess();
      } else {
        console.error('Registration failed:', data.error);
        // Handle error (e.g., show notification)
      }
    } catch (error) {
      console.error('Registration error:', error);
      // Handle error (e.g., show notification)
    }
  };

  return (
    <form onSubmit={handleSubmit} className="register-form">
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="input-field"
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="input-field"
        required
      />
      <button type="submit" className="submit-button">
        Register
      </button>
    </form>
  );
};

export default Register; 