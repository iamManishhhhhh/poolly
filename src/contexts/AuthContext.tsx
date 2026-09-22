import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '../supabaseClient';
import type { AuthError, User } from '@supabase/supabase-js';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  signInWithGoogle: (redirectTo?: string) => Promise<{ error: AuthError | null }>;
  signInWithPhone: (phone: string) => Promise<{ error: AuthError | null }>;
  verifyPhoneOtp: (phone: string, token: string) => Promise<{ error: AuthError | null }>;
  resetPassword: (email: string, redirectTo?: string) => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        setUser(data.session?.user ?? null);
      } catch (err) {
        console.error('Session initialization error:', err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string) => {
    const { error, data } = await supabase.auth.signUp({ email, password });
    // Set user only if a session was created (i.e., email confirmed without additional verification)
    if (!error && data.session?.user) {
      setUser(data.session.user);
    }
    return { error, data };
  };

  const signIn = async (email: string, password: string) => {
    const { error, data } = await supabase.auth.signInWithPassword({ email, password });
    if (!error && data?.user) {
      setUser(data.user);
    }
    return { error };
  };

  const signInWithGoogle = async (redirectTo?: string) => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectTo || `${window.location.origin}/dashboard`,
        queryParams: {
          prompt: 'select_account',
        },
      },
    });
    return { error };
  };

  const signInWithPhone = async (phone: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      phone,
    });
    return { error };
  };

  const verifyPhoneOtp = async (phone: string, token: string) => {
    const { error, data } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms',
    });
    if (!error && data?.user) {
      setUser(data.user);
    }
    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) setUser(null);
    return { error };
  };

  const resetPassword = async (email: string, redirectTo?: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectTo || window.location.origin,
    });
    return { error };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signUp,
        signIn,
        signOut,
        signInWithGoogle,
        signInWithPhone,
        verifyPhoneOtp,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

