import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';

interface AccessibleFund {
  id: string;
  name: string;
  currency: string;
  totalCollected: number;
}

export default function JoinFundPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { code } = useParams<{ code?: string }>();

  // ── Join-by-code state ───────────────────────────────────────────────────
  const [codeInput, setCodeInput] = useState(code || '');
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (code) setCodeInput(code);
  }, [code]);

  const handleJoin = async () => {
    if (!user) { setError('Please log in to join a fund.'); return; }
    const trimmed = codeInput.trim().toLowerCase();
    if (!trimmed) { setError('Please enter a join code.'); return; }
    setJoining(true);
    setError(null);
    const { data, error: rpcError } = await supabase.rpc('join_fund_by_code', {
      p_code: trimmed,
    });
    if (rpcError) {
      const msg = (rpcError.message || '').toLowerCase();
      if (msg.includes('duplicate') || msg.includes('already')) {
        setError('You are already a member of this fund.');
      } else if (msg.includes('expired') || msg.includes('invalid') || msg.includes('not found')) {
        setError('Invalid or expired join code.');
      } else if (msg.includes('auth') || msg.includes('unauthenticated')) {
        setError('Please log in to join a fund.');
      } else {
        setError('An unexpected error occurred. Please try again later.');
      }
      setJoining(false);
      return;
    }
    
    // The RPC might return a scalar UUID string or a JSON object with a fund_id property.
    let fundId: string | undefined;
    if (typeof data === 'string') {
      fundId = data;
    } else if (data && typeof data === 'object') {
      fundId = (data as any).fund_id;
    }

    if (!fundId) {
      console.error('Unexpected RPC response format:', data);
      setError('Unable to determine fund after joining.');
      setJoining(false);
      return;
    }
    setSuccess(true);
    setTimeout(() => navigate(`/funds/${fundId}`), 1500);
    setJoining(false);
  };

  // ── Existing accessible funds ────────────────────────────────────────────
  const [funds, setFunds] = useState<AccessibleFund[]>([]);
  const [fundsLoading, setFundsLoading] = useState(false);

  const fetchMyFunds = useCallback(async () => {
    if (!user) return;
    setFundsLoading(true);

    // Same pattern as UserDashboard: owned + member union, then contributions
    const [{ data: ownedData }, { data: memberRows }] = await Promise.all([
      supabase.from('funds').select('id, name, currency').eq('owner_id', user.id),
      supabase.from('fund_members').select('fund_id').eq('user_id', user.id),
    ]);

    const fundIds = new Set<string>();
    (ownedData || []).forEach((f: any) => fundIds.add(f.id));
    (memberRows || []).forEach((m: any) => fundIds.add(m.fund_id));

    if (fundIds.size === 0) {
      setFunds([]);
      setFundsLoading(false);
      return;
    }

    const idArray = Array.from(fundIds);

    const [{ data: allFundsData }, { data: contribsData }] = await Promise.all([
      supabase.from('funds').select('id, name, currency').in('id', idArray),
      supabase.from('contributions').select('fund_id, amount').in('fund_id', idArray),
    ]);

    const result: AccessibleFund[] = (allFundsData || []).map((f: any) => {
      const collected = (contribsData || [])
        .filter((c: any) => c.fund_id === f.id)
        .reduce((sum: number, c: any) => sum + Number(c.amount), 0);
      return { id: f.id, name: f.name, currency: f.currency, totalCollected: collected };
    });

    setFunds(result);
    setFundsLoading(false);
  }, [user]);

  useEffect(() => {
    fetchMyFunds();
  }, [fetchMyFunds]);

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-[#171717] p-6">
      <div className="max-w-xl mx-auto mt-10">

        {/* ── Section 1: Join by code ──────────────────────────────────── */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 mb-6">
          <h1 className="text-xl font-bold mb-1">Join a Fund</h1>
          <p className="text-gray-600 text-sm mb-5">
            Enter the shareable code provided by the fund owner.
          </p>

          {success ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <p className="text-green-700 font-medium">Successfully joined the fund!</p>
              <p className="text-green-600 text-sm mt-1">Redirecting to the fund dashboard…</p>
            </div>
          ) : (
            <>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  id="join-code-input"
                  placeholder="e.g. a1b2c3d4e5f6"
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#087F5B]/50 focus:border-[#087F5B]"
                />
                <button
                  id="join-fund-btn"
                  onClick={handleJoin}
                  disabled={joining || !codeInput.trim()}
                  className="bg-[#087F5B] hover:bg-[#087F5B]/90 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                >
                  {joining ? 'Joining…' : 'Join Fund'}
                </button>
              </div>
              {error && <p className="text-red-500 text-sm mb-1">{error}</p>}
            </>
          )}

          <Link to="/dashboard" className="block mt-4 text-sm text-[#087F5B] underline">
            ← Back to Dashboard
          </Link>
        </div>

        {/* ── Divider ──────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">or</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* ── Section 2: Existing accessible funds ─────────────────────── */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
          <h2 className="text-lg font-bold mb-1">Your Existing Funds</h2>
          <p className="text-gray-500 text-sm mb-5">
            Funds you own or are already a member of.
          </p>

          {fundsLoading ? (
            <div className="flex items-center gap-2 text-gray-500 text-sm py-4">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#087F5B]" />
              Loading your funds…
            </div>
          ) : funds.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-gray-400 text-sm">You don't have any funds yet.</p>
              <Link
                to="/funds/create"
                className="inline-block mt-3 text-sm text-[#087F5B] underline"
              >
                Create your first fund →
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {funds.map((fund) => (
                <li
                  key={fund.id}
                  className="flex items-center justify-between py-3 gap-4"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-[#171717] truncate">{fund.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Collected:{' '}
                      <span className="font-medium text-[#171717]">
                        {fund.currency}&nbsp;
                        {fund.totalCollected.toLocaleString()}
                      </span>
                    </p>
                  </div>
                  <Link
                    to={`/funds/${fund.id}`}
                    className="flex-shrink-0 bg-[#087F5B] hover:bg-[#087F5B]/90 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Open Fund
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

      </div>
    </div>
  );
}

