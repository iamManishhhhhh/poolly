import React, { useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { useAuth } from '../contexts/AuthContext';

function LoginForm() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12 p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-semibold mb-4 text-[#171717]">Login</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
        <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <Button type="submit" variant="primary" className="w-full" disabled={loading}>
          {loading ? 'Logging in…' : 'Login'}
        </Button>
      </form>
      <p className="mt-4 text-sm">
        Don’t have an account?{' '}<a href="/auth/signup" className="text-[#087F5B] hover:underline">Sign Up</a>
      </p>
    </div>
  );
}

function SignUpForm() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    const { error } = await signUp(email, password);
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setMessage('Check your email for a confirmation link.');
      // If a session is already established, navigate to dashboard
      navigate('/dashboard');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12 p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-semibold mb-4 text-[#171717]">Sign Up</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
        <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        <Input label="Confirm Password" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        {message && <p className="text-green-600 text-sm">{message}</p>}
        <Button type="submit" variant="primary" className="w-full" disabled={loading}>
          {loading ? 'Signing up…' : 'Sign Up'}
        </Button>
      </form>
      <p className="mt-4 text-sm">
        Already have an account?{' '}<a href="/auth/login" className="text-[#087F5B] hover:underline">Login</a>
      </p>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Routes>
      <Route path="login" element={<LoginForm />} />
      <Route path="signup" element={<SignUpForm />} />
      <Route path="*" element={<Navigate to="login" replace />} />
    </Routes>
  );
}
