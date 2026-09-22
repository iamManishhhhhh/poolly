import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LandingPage from './LandingPage';

/**
 * HomeRedirect renders the public LandingPage for unauthenticated users, but
 * automatically redirects authenticated users to the Dashboard.
 *
 * It waits for the AuthContext `loading` flag to become false to ensure the
 * Supabase session restoration has completed before deciding.
 */
export default function HomeRedirect() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      // Authenticated – navigate to dashboard, replace history so back button
      // does not return to the landing page.
      navigate('/dashboard', { replace: true });
    }
  }, [loading, user, navigate]);

  // While loading, show a minimal spinner to avoid flash of LandingPage.
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FAFAF8] text-[#171717]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#087F5B] mx-auto mb-3" />
          <p className="font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // Unauthenticated – show the public landing page.
  return <LandingPage />;
}
