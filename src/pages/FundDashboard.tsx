import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import type { Fund } from '../types/models';
import { FundHeader } from '../components/FundHeader';
import { TransactionTimeline } from '../components/TransactionTimeline';
import { AddContributionModal } from '../components/AddContributionModal';
import { AddExpenseModal } from '../components/AddExpenseModal';
import { InviteModal } from '../components/InviteModal';
import { MemberList } from '../components/MemberList';
import { useAuth } from '../contexts/AuthContext';

export default function FundDashboard() {
  const { fundId } = useParams<{ fundId: string }>();
  const { user, loading: authLoading } = useAuth();
  const [fund, setFund] = useState<Fund | null>(null);
  const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
  const [showContributionModal, setShowContributionModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteCode, setInviteCode] = useState<string>('');
  const [inviteExpiresAt, setInviteExpiresAt] = useState<string | undefined>(undefined);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  // Derived memoized values for fund statistics and membership
  const totalCollected = useMemo(() => fund?.contributions?.reduce((sum, c) => sum + c.amount, 0) ?? 0, [fund?.contributions]);
  const totalSpent = useMemo(() => fund?.expenses?.reduce((sum, e) => sum + e.amount, 0) ?? 0, [fund?.expenses]);
  const balance = useMemo(() => totalCollected - totalSpent, [totalCollected, totalSpent]);
  const isMember = useMemo(() => fund && (fund.members?.some(m => m.userId === user?.id) || fund.ownerId === user?.id), [fund, user?.id]);
  const fetchFund = useCallback(async () => {
  if (!fundId || !user) return;
  setLoading(true);
  setError(null);

  // 1. Fetch fund record (only needed columns)
  const { data: fundData, error: fundError } = await supabase
    .from('funds')
    .select('id, name, description, target_amount, suggested_contribution, start_date, end_date, currency, owner_id, created_at')
    .eq('id', fundId)
    .maybeSingle();
  if (fundError || !fundData) {
    console.error('Error fetching fund details:', fundError);
    setError('Failed to load fund data.');
    setFund(null);
    setLoading(false);
    return;
  }

  // 2-4. Fetch members, contributions, expenses in parallel with needed columns
  const [{ data: membersData, error: membersError }, { data: contribsData, error: contribsError }, { data: expensesData, error: expensesError }] = await Promise.all([
    supabase.from('fund_members').select('user_id, role, joined_at, total_contributed').eq('fund_id', fundId),
    supabase.from('contributions').select('id, fund_id, contributor_id, amount, date, status, note').eq('fund_id', fundId).order('date', { ascending: false }),
    supabase.from('expenses').select('id, fund_id, added_by_id, name, amount, vendor, category, date, receipt_url, status').eq('fund_id', fundId).order('date', { ascending: false })
  ]);

  if (membersError) { setError('Failed to load members.'); setLoading(false); return; }
  if (contribsError) { setError('Failed to load contributions.'); setLoading(false); return; }
  if (expensesError) { setError('Failed to load expenses.'); setLoading(false); return; }

  // Map members, ensuring the owner is included as a member with admin role
  const mappedMembers = (membersData || []).map((m: any) => ({
    userId: m.user_id,
    role: m.role,
    joinedAt: m.joined_at,
    totalContributed: Number(m.total_contributed),
  }));
  if (fundData.owner_id) {
    const ownerExists = mappedMembers.some((m) => m.userId === fundData.owner_id);
    if (!ownerExists) {
      mappedMembers.unshift({
        userId: fundData.owner_id,
        role: 'admin',
        joinedAt: fundData.created_at || new Date().toISOString(),
        totalContributed: 0,
      });
    }
  }

  const f: Fund = {
    id: fundData.id,
    name: fundData.name,
    description: fundData.description,
    targetAmount: fundData.target_amount,
    suggestedContribution: fundData.suggested_contribution,
    startDate: fundData.start_date,
    endDate: fundData.end_date,
    currency: fundData.currency,
    ownerId: fundData.owner_id,
    members: mappedMembers,
    contributions: (contribsData || []).map((c: any) => ({
      id: c.id,
      fundId: c.fund_id,
      contributorId: c.contributor_id,
      amount: Number(c.amount),
      date: c.date,
      status: c.status,
      note: c.note,
    })),
    expenses: (expensesData || []).map((e: any) => ({
      id: e.id,
      fundId: e.fund_id,
      addedById: e.added_by_id,
      name: e.name,
      amount: Number(e.amount),
      vendor: e.vendor,
      category: e.category,
      date: e.date,
      receiptUrl: e.receipt_url,
      status: e.status,
    })),
  };

  setFund(f);
  setLoading(false);
}, [fundId, user]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchFund();
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [authLoading, user, fetchFund]);

  const createInvite = async () => {
    if (!fund || !user) return;
    setInviteLoading(true);
    setInviteError(null);

    // 1. First check if an active invite already exists for this fund
    const { data: existingInvites } = await supabase
      .from('fund_invites')
      .select('code, expires_at')
      .eq('fund_id', fund.id)
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      .order('created_at', { ascending: false })
      .limit(1);

    if (existingInvites && existingInvites.length > 0) {
      setInviteCode(existingInvites[0].code);
      setInviteExpiresAt(existingInvites[0].expires_at || undefined);
      setInviteLoading(false);
      setShowInviteModal(true);
      return;
    }

    // 2. Generate a 12-char cryptographically random hex code
    const bytes = new Uint8Array(8);
    crypto.getRandomValues(bytes);
    const code = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
      .slice(0, 12);

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

    const { error } = await supabase.from('fund_invites').insert([
      {
        fund_id: fund.id,
        code,
        created_by: user.id,
        expires_at: expiresAt,
      },
    ]);

    if (error) {
      console.error('Invite creation failed:', error.message);
      setInviteError(
        error.message.includes('duplicate') || error.code === '23505'
          ? 'A code with this value already exists. Please try again.'
          : error.message || 'Failed to create invite. Please try again.'
      );
      setInviteCode('');
      setInviteExpiresAt(undefined);
    } else {
      setInviteCode(code);
      setInviteExpiresAt(expiresAt);
    }
    setInviteLoading(false);
    setShowInviteModal(true);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#F8FAF9] flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-neutral-200 border-t-[#087F5B] animate-spin" />
          <p className="text-xs text-neutral-500 font-medium">Loading fund details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F8FAF9] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-neutral-200/80 p-6 text-center">
          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-3 border border-red-100 font-bold">
            !
          </div>
          <p className="text-sm font-semibold text-red-600 mb-1">Failed to load fund</p>
          <p className="text-xs text-neutral-500 mb-5">{error}</p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={fetchFund}
              className="px-4 py-2 bg-[#087F5B] text-white rounded-xl text-xs font-semibold hover:bg-[#066c4d] transition-colors"
            >
              Retry
            </button>
            <Link
              to="/dashboard"
              className="px-4 py-2 bg-white border border-neutral-200 text-neutral-700 rounded-xl text-xs font-semibold hover:bg-neutral-50 transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!fund) {
    return (
      <div className="min-h-screen bg-[#F8FAF9] text-[#171717] flex items-center justify-center p-6">
        <div className="max-w-md w-full p-8 bg-white rounded-2xl shadow-sm border border-[#EAEAE6] text-center">
          <h2 className="text-base font-bold text-[#171717] mb-1">Fund not found</h2>
          <p className="text-xs text-neutral-500 mb-6">
            You may not have permission to access this fund or it does not exist.
          </p>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#087F5B] text-white text-xs font-semibold hover:bg-[#066c4d] transition-colors"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#F8FAF9] text-[#171717] overflow-x-hidden">
      {/* Ambient Background Atmosphere */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {/* Primary Ambient Glow: Top-Right (Poolly green #087F5B, ~6% opacity, heavily blurred) */}
        <div 
          className="absolute -top-32 -right-32 w-[36rem] h-[36rem] sm:w-[46rem] sm:h-[46rem] rounded-full bg-[#087F5B] opacity-[0.06] blur-[120px] sm:blur-[140px]" 
        />
        
        {/* Secondary Ambient Glow: Bottom-Left (Significantly weaker ~2.5% opacity, heavily blurred) */}
        <div 
          className="absolute -bottom-40 -left-40 w-[24rem] h-[24rem] sm:w-[32rem] sm:h-[32rem] rounded-full bg-[#087F5B] opacity-[0.025] blur-[130px] sm:blur-[150px]" 
        />

        {/* Ultra-subtle Fine Grain Texture (~1.5% opacity) */}
        <div
          className="absolute inset-0 opacity-[0.015] mix-blend-multiply"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat',
          }}
        />
      </div>

      {/* Main Fund Detail Content */}
      <div className="relative z-10 px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8">
          <FundHeader
            fund={fund}
            totalCollected={totalCollected}
            totalSpent={totalSpent}
            balance={balance}
          />

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            {isMember && (
              <button
                onClick={() => setShowContributionModal(true)}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#087F5B] text-white text-xs sm:text-sm font-semibold shadow-sm hover:bg-[#066c4d] active:scale-[0.98] transition-all duration-150"
              >
                <span>+</span>
                <span>Add Contribution</span>
              </button>
            )}
            {isMember && (
              <button
                onClick={() => setShowExpenseModal(true)}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200/80 hover:bg-rose-100/80 text-xs sm:text-sm font-semibold active:scale-[0.98] transition-all duration-150"
              >
                <span>+</span>
                <span>Add Expense</span>
              </button>
            )}
            <button
              onClick={createInvite}
              disabled={inviteLoading}
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-white border border-neutral-200 text-neutral-800 text-xs sm:text-sm font-semibold shadow-2xs hover:bg-neutral-50 hover:border-neutral-300 active:scale-[0.98] transition-all duration-150 disabled:opacity-50"
            >
              {inviteLoading ? 'Generating...' : 'Invite / Share'}
            </button>
          </div>

          {/* Grid Layout: Transactions (2 cols) & Members (1 col) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-start">
            <div className="lg:col-span-2">
              <TransactionTimeline
                contributions={fund.contributions}
                expenses={fund.expenses}
                currencySymbol={fund.currency === 'USD' ? '$' : '₹'}
                onAddContribution={isMember ? () => setShowContributionModal(true) : undefined}
              />
            </div>
            <div className="lg:col-span-1">
              <MemberList
                members={fund.members}
                ownerId={fund.ownerId}
                currentUserId={user?.id}
              />
            </div>
          </div>

          <AddContributionModal
            fundId={fund.id}
            isOpen={showContributionModal}
            onClose={() => setShowContributionModal(false)}
            onAdded={fetchFund}
          />
          <AddExpenseModal
            fundId={fund.id}
            isOpen={showExpenseModal}
            onClose={() => setShowExpenseModal(false)}
            onAdded={fetchFund}
          />
          <InviteModal
            isOpen={showInviteModal}
            onClose={() => setShowInviteModal(false)}
            inviteCode={inviteCode}
            fundName={fund.name}
            expiresAt={inviteExpiresAt}
            generateError={inviteError}
          />
        </div>
      </div>
    </div>
  );
}
