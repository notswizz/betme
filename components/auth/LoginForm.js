import GoogleSignInButton from './GoogleSignInButton';

export default function LoginForm({ onSuccess }) {
  return (
    <div className="w-full">
      <GoogleSignInButton onSuccess={onSuccess} />
    </div>
  );
} 