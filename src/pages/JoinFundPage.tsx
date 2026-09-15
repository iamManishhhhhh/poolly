import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';

export default function JoinFundPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [codeInput, setCodeInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleJoin = async () => {
    if (!user) {
      setError('Please log in to join a fund.');
      return;
    }
    const trimmed = codeInput.trim();
    if (!trimmed) {
      setError('Please enter a join code.');
      return;
    }
    setJoining(true);
    setError(null);
    const { data, error: rpcError } = await supabase.rpc('join_fund_by_code', {
      p_code: trimmed,
    });
    if (rpcError) {
      const msg = (rpcError.message || '').toLowerCase();
      if (msg.includes('duplicate') || msg.includes('already')) {
        setError('You are already a member of this fund.');
      } else if (msg.includes('expired') || msg.includes('invalid')) {
        setError('Invalid or expired join code.');
      } else if (msg.includes('auth') || msg.includes('unauthenticated')) {
        setError('Please log in to join a fund.');
      } else {
        setError('An unexpected error occurred. Please try again later.');
      }
      setJoining(false);
      return;
    }
    // Expect RPC to return the fund ID that was joined
    const fundId = data?.fund_id;
    if (!fundId) {
      setError('Unable to determine fund after joining.');
      setJoining(false);
      return;
    }
    setSuccess(true);
    setTimeout(() => navigate(`/funds/${fundId}`), 1500);
    setJoining(false);
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-[#171717] p-6">
      <div className="max-w-md mx-auto mt-12 p-6 bg-white rounded-xl shadow-md border border-gray-100">
        <h2 className="text-xl font-bold mb-2">Join a Fund</h2>
        <p className="text-gray-600 text-sm mb-6">
          Enter the shareable code provided by the fund owner.
        </p>
        {success ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <p className="text-green-700 font-medium">Successfully joined the fund!</p>
            <p className="text-green-600 text-sm mt-1">Redirecting to the fund dashboard…</p>
          </div>
        ) : (
          <>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="e.g. a1b2c3d4e5f6"
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#087F5B]/50 focus:border-[#087F5B]"
              />
              <button
                onClick={handleJoin}
                disabled={joining || !codeInput.trim()}
                className="bg-[#087F5B] hover:bg-[#087F5B]/90 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
              >
                {joining ? 'Joining…' : 'Join Fund'}
              </button>
            </div>
            {error && (
              <p className="text-red-500 text-sm mb-4">{error}</p>
            )}
          </>
        )}
        <Link to="/dashboard" className="block mt-4 text-sm text-[#087F5B] underline">
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  );
}

/*

  const { code: paramCode } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [codeInput, setCodeInput] = useState('');
  const [invite, setInvite] = useState<any>(null);
  const [fundPreview, setFundPreview] = useState<{ id: string; name: string; description: string | null } | null>(null);
  const [loading, setLoading] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // The active code is either the URL param or submitted input
  const activeCode = paramCode || null;

  // Fetch invite + minimal fund preview whenever activeCode changes
  useEffect(() => {
    if (!activeCode) return;

    const fetchInvite = async () => {
      setLoading(true);
      setError(null);
      setInvite(null);
      setFundPreview(null);

      // 1. Look up the invite by code
      const { data: inviteData, error: inviteError } = await supabase
        .from('fund_invites')
        .select('id, fund_id, code, expires_at')
        .eq('code', activeCode)
        .maybeSingle();

      if (inviteError) {
        setError(inviteError.message);
        setLoading(false);
        return;
      }

      if (!inviteData) {
        setError('Invalid or expired invite code. Please check the code and try again.');
        setLoading(false);
        return;
      }

      // 2. Client-side expiration check (server enforces this too via RLS)
      if (inviteData.expires_at && new Date(inviteData.expires_at) <= new Date()) {
        setError('This invite code has expired. Please ask the fund owner for a new one.');
        setLoading(false);
        return;
      }

      setInvite(inviteData);

      // 3. Fetch only the fund name and description — NOT contributions/expenses
      //    RLS on funds allows SELECT if the invite is valid and non-expired
      const { data: fundData, error: fundError } = await supabase
        .from('funds')
        .select('id, name, description')
        .eq('id', inviteData.fund_id)
        .maybeSingle();

      if (fundError) {
        setError(fundError.message);
        setLoading(false);
        return;
      }

      if (!fundData) {
        setError('Fund not found or the invitation is no longer active.');
        setLoading(false);
        return;
      }

      setFundPreview(fundData);
      setLoading(false);
    };

    fetchInvite();
  }, [activeCode]);

      // New join flow using server‑side RPC
    const handleJoin = async () => {
      // Guard against missing auth or invite
      if (!user) {
        setError('Please log in to join a fund.');
        return;
      }
      if (!invite) {
        setError('Invite data missing.');
        return;
      }

      setJoining(true);
      setError(null);

      // Call the secure RPC that validates the code and creates the membership
      const { data, error: rpcError } = await supabase.rpc('join_fund_by_code', {
        p_code: activeCode,
      });

      if (rpcError) {
        const msg = rpcError.message?.toLowerCase() || '';
        if (msg.includes('duplicate') || msg.includes('already')) {
          setError('You are already a member of this fund.');
        } else if (msg.includes('expired') || msg.includes('invalid')) {
          setError('Invalid or expired join code');
        } else if (msg.includes('auth') || msg.includes('unauthenticated')) {
          setError('Please log in to join a fund.');
        } else {
          setError('An unexpected error occurred. Please try again later.');
        }
        setJoining(false);
        return;
      }

      // RPC succeeded – it should return the fund UUID (or we can fall back to the invite)
      const fundId = (data && data.fund_id) || invite.fund_id;
      if (!fundId) {
        setError('Unable to determine fund ID after joining.');
        setJoining(false);
        return;
      }

      setSuccess(true);
      // Redirect to the fund dashboard after a short confirmation
      setTimeout(() => navigate(`/funds/${fundId}`), 1500);
      setJoining(false);
    };

  const handleCodeSubmit = () => {
    const trimmed = codeInput.trim();
    if (trimmed) {
      navigate(`/join/${trimmed}`);
    }
  };

  // ---------- RENDER ----------

  // No code in URL → show manual entry form
  if (!activeCode) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] text-[#171717] p-6">
        <div className="max-w-md mx-auto mt-12 p-6 bg-white rounded-xl shadow-md border border-gray-100">
          <h2 className="text-xl font-bold mb-2">Join a Fund</h2>
          <p className="text-gray-600 text-sm mb-6">Enter the invite code you received from the fund owner.</p>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. a1b2c3d4e5f6"
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCodeSubmit()}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#087F5B]/50 focus:border-[#087F5B]"
            />
            <button
              onClick={handleCodeSubmit}
              disabled={!codeInput.trim()}
              className="bg-[#087F5B] hover:bg-[#087F5B]/90 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
            >
              Submit
            </button>
          </div>
          <Link to="/dashboard" className="block mt-4 text-sm text-[#087F5B] underline">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] text-[#171717] p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#087F5B] mx-auto mb-3"></div>
          <p className="font-medium">Verifying invite code…</p>
        </div>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] text-[#171717] p-6">
        <div className="max-w-md mx-auto mt-12 p-6 bg-white rounded-xl shadow-md border border-gray-100 text-center">
          <p className="text-red-600 text-lg font-semibold mb-2">Unable to join fund</p>
          <p className="text-gray-700 text-sm mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <Link
              to="/join"
              className="inline-block bg-[#087F5B] text-white px-4 py-2 rounded-md hover:bg-[#087F5B]/90 font-medium text-sm transition-colors"
            >
              Try Another Code
            </Link>
            <Link
              to="/dashboard"
              className="inline-block bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md font-medium text-sm transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // No fund loaded
  if (!fundPreview) return null;

  // Fund preview + join button (does NOT show contributions, expenses, or balances)
  return (
    <div className="min-h-screen bg-[#FAFAF8] text-[#171717] p-6">
      <div className="max-w-md mx-auto mt-12 p-6 bg-white rounded-xl shadow-md border border-gray-100">
        <h2 className="text-xl font-bold mb-1">{fundPreview.name}</h2>
        {fundPreview.description && (
          <p className="text-gray-600 text-sm mb-6">{fundPreview.description}</p>
        )}

        {success ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <p className="text-green-700 font-medium">Successfully joined the fund!</p>
            <p className="text-green-600 text-sm mt-1">Redirecting to the fund dashboard…</p>
          </div>
        ) : (
          <>
            <p className="text-gray-600 text-sm mb-4">
              You've been invited to join this fund. Click below to become a member.
            </p>
            <button
              onClick={handleJoin}
              disabled={joining}
              className="w-full bg-[#087F5B] hover:bg-[#087F5B]/90 disabled:opacity-50 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors text-sm"
            >
              {joining ? 'Joining…' : 'Join Fund'}
            </button>
          </>
        )}

        {error && !success && (
          <p className="text-red-500 text-sm mt-3 text-center">{error}</p>
        )}

        <Link to="/dashboard" className="block mt-4 text-sm text-[#087F5B] underline text-center">
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
*/
