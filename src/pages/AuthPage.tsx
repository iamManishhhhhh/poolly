import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Input } from '../components/Input';
import { Button } from '../components/Button';

export default function AuthPage() {
  const {
    user,
    loading: authLoading,
    signIn,
    signUp,
    signInWithGoogle,
    signInWithPhone,
    verifyPhoneOtp,
    resetPassword,
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Mode: 'login' or 'signup'
  const isSignUpMode = location.pathname.includes('/auth/signup');

  // Secondary email/password & phone states
  const [showEmailOption, setShowEmailOption] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [phoneMode, setPhoneMode] = useState(false);
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
  const [phone, setPhone] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  // Status states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Parse OAuth redirect errors or notifications from query/hash
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const hashParams = new URLSearchParams(location.hash.startsWith('#') ? location.hash.substring(1) : location.hash);

    const errDesc = searchParams.get('error_description') || hashParams.get('error_description');
    const errMsg = searchParams.get('error') || hashParams.get('error');

    if (errDesc) {
      setError(decodeURIComponent(errDesc.replace(/\+/g, ' ')));
    } else if (errMsg) {
      setError(`Authentication error: ${decodeURIComponent(errMsg)}`);
    }
  }, [location]);

  // Redirect if already authenticated
  useEffect(() => {
    if (user && !authLoading) {
      const from = (location.state as any)?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [user, authLoading, navigate, location]);

  const resetStatus = () => {
    setError(null);
    setMessage(null);
  };

  const handleGoogleSignIn = async () => {
    resetStatus();
    setLoading(true);
    const from = (location.state as any)?.from?.pathname || '/dashboard';
    const { error } = await signInWithGoogle(`${window.location.origin}${from}`);
    setLoading(false);
    if (error) {
      setError(error.message);
    }
  };

  const handleSendPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    resetStatus();
    if (!phone.trim()) {
      setError('Please enter a valid phone number with country code (e.g. +1234567890).');
      return;
    }
    setLoading(true);
    const { error } = await signInWithPhone(phone.trim());
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setOtpSent(true);
      setMessage(`Verification code sent to ${phone.trim()}`);
    }
  };

  const handleVerifyPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    resetStatus();
    if (!otpToken.trim()) {
      setError('Please enter the verification code.');
      return;
    }
    setLoading(true);
    const { error } = await verifyPhoneOtp(phone.trim(), otpToken.trim());
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      const from = (location.state as any)?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetStatus();

    if (isSignUpMode) {
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      setLoading(true);
      const { error, data } = await signUp(email, password) as any;
      setLoading(false);
      if (error) {
        setError(error.message);
      } else if (data?.user && !data?.session) {
        setMessage('Check your email for a confirmation link to verify your account.');
      }
    } else {
      setLoading(true);
      const { error } = await signIn(email, password);
      setLoading(false);
      if (error) {
        setError(error.message);
      }
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetStatus();
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    setLoading(true);
    const { error } = await resetPassword(email.trim(), `${window.location.origin}/auth/login`);
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setMessage('If an account exists, a password reset link has been sent to your email.');
      setForgotPasswordMode(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8]">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#087F5B] mx-auto"></div>
          <p className="mt-4 text-[#171717] font-medium">Loading session...</p>
        </div>
      </div>
    );
  }

  if (user) {
    const from = (location.state as any)?.from?.pathname || '/dashboard';
    return <Navigate to={from} replace />;
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#FAFAF8] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center text-3xl font-extrabold text-[#171717]">
          Welcome to Poolly
        </h1>
        <p className="mt-2 text-center text-sm text-gray-600">
          {isSignUpMode
            ? 'Create your account to start managing shared funds'
            : 'Sign in to access your shared funds and transactions'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-md rounded-xl border border-gray-100 sm:px-10">
          {/* Notifications */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-start justify-between">
              <span>{error}</span>
              <button onClick={() => setError(null)} className="ml-2 font-bold text-red-700">×</button>
            </div>
          )}
          {message && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
              {message}
            </div>
          )}

          {!phoneMode && !forgotPasswordMode ? (
            <>
              {/* PRIMARY HERO AUTH ACTION: Google OAuth */}
              <div className="space-y-4">
                <Button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white border-2 border-gray-200 text-gray-700 font-semibold text-base rounded-lg shadow-sm hover:bg-gray-50 hover:border-gray-300 transition-all focus:outline-none focus:ring-2 focus:ring-[#087F5B]"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>{loading ? 'Connecting to Google...' : 'Continue with Google'}</span>
                </Button>
              </div>

              {/* Divider & Secondary Options */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-3 text-gray-400 font-medium">or standard options</span>
                </div>
              </div>

              {!showEmailOption ? (
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => setShowEmailOption(true)}
                    className="w-full text-center text-sm font-medium text-gray-600 hover:text-[#087F5B] py-2 border border-dashed border-gray-300 rounded-lg hover:border-[#087F5B] transition-colors"
                  >
                    ✉️ Sign in with Email / Password
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      resetStatus();
                      setPhoneMode(true);
                    }}
                    className="w-full text-center text-sm font-medium text-gray-600 hover:text-[#087F5B] py-2 border border-dashed border-gray-300 rounded-lg hover:border-[#087F5B] transition-colors"
                  >
                    📱 Sign in with Phone OTP
                  </button>
                </div>
              ) : (
                /* Email / Password Form */
                <form onSubmit={handleEmailSubmit} className="space-y-4">
                  <Input
                    label="Email address"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                  />

                  <Input
                    label="Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />

                  {isSignUpMode && (
                    <Input
                      label="Confirm Password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                  )}

                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full py-2.5 text-base font-semibold"
                    disabled={loading}
                  >
                    {loading
                      ? isSignUpMode
                        ? 'Creating account...'
                        : 'Logging in...'
                      : isSignUpMode
                      ? 'Sign Up'
                      : 'Login'}
                  </Button>

                  <button
                    type="button"
                    onClick={() => { setShowEmailOption(false); setForgotPasswordMode(false); }}
                    className="w-full text-center text-xs text-gray-500 hover:underline pt-1"
                  >
                    Hide Email Form
                  </button>
                  {!isSignUpMode && (
                    <button
                      type="button"
                      onClick={() => {
                        resetStatus();
                        setForgotPasswordMode(true);
                      }}
                      className="w-full text-center text-xs text-[#087F5B] hover:underline pt-1"
                    >
                      Forgot Password?
                    </button>
                  )}
                </form>
              )}

              {/* Mode Toggle Link */}
              <div className="mt-6 text-center text-sm">
                {isSignUpMode ? (
                  <p className="text-gray-600">
                    Already have an account?{' '}
                    <Link
                      to="/auth/login"
                      onClick={resetStatus}
                      className="font-semibold text-[#087F5B] hover:underline"
                    >
                      Login
                    </Link>
                  </p>
                ) : (
                  <p className="text-gray-600">
                    Don't have an account?{' '}
                    <Link
                      to="/auth/signup"
                      onClick={resetStatus}
                      className="font-semibold text-[#087F5B] hover:underline"
                    >
                      Sign Up
                    </Link>
                  </p>
                )}
              </div>
            </>
          ) : forgotPasswordMode ? (
            <div>
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                <Input
                  label="Email address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full py-2.5 font-semibold"
                  disabled={loading}
                >
                  {loading ? 'Sending link...' : 'Send Reset Link'}
                </Button>
              </form>
              <div className="mt-6 text-center text-sm">
                <button
                  type="button"
                  onClick={() => {
                    resetStatus();
                    setForgotPasswordMode(false);
                  }}
                  className="font-medium text-[#087F5B] hover:underline"
                >
                  ← Back to Login
                </button>
              </div>
            </div>
          ) : (
            /* Phone OTP Flow */
            <div>
              {!otpSent ? (
                <form onSubmit={handleSendPhoneOtp} className="space-y-4">
                  <Input
                    label="Phone Number"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1234567890"
                    required
                  />

                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full py-2.5 font-semibold"
                    disabled={loading}
                  >
                    {loading ? 'Sending code...' : 'Send Verification Code'}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleVerifyPhoneOtp} className="space-y-4">
                  <Input
                    label="Verification Code (OTP)"
                    type="text"
                    value={otpToken}
                    onChange={(e) => setOtpToken(e.target.value)}
                    placeholder="123456"
                    required
                  />

                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full py-2.5 font-semibold"
                    disabled={loading}
                  >
                    {loading ? 'Verifying...' : 'Verify Code & Sign In'}
                  </Button>
                </form>
              )}

              <div className="mt-6 text-center text-sm">
                <button
                  type="button"
                  onClick={() => {
                    resetStatus();
                    setPhoneMode(false);
                    setOtpSent(false);
                  }}
                  className="font-medium text-[#087F5B] hover:underline"
                >
                  ← Back to Primary Options
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
