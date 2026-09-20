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
    .select('id, name, description, category, target_amount, suggested_contribution, start_date, end_date, currency, owner_id, created_at')
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
    category: fundData.category,
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

    // Generate a 12-char cryptographically random hex code
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
      <div className="p-6 bg-[#FAFAF8] min-h-screen text-[#171717] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#087F5B] mx-auto mb-3"></div>
          <p className="font-medium">Loading fund details...</p>
        </div>
      </div>
    );
  }

  if (!fund) {
    return (
      <div className="p-6 text-[#171717] bg-[#FAFAF8] min-h-screen">
        <div className="max-w-md mx-auto mt-12 p-6 bg-white rounded-xl shadow-md border border-gray-100 text-center">
          <p className="text-red-600 text-lg font-semibold mb-2">Fund not found</p>
          <p className="text-gray-600 text-sm mb-6">
            You may not have permission to access this fund or it does not exist.
          </p>
          <Link
            to="/dashboard"
            className="inline-block bg-[#087F5B] text-white px-4 py-2 rounded-md hover:bg-[#087F5B]/90 font-medium text-sm transition-colors"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-[#FAFAF8] min-h-screen text-[#171717] flex items-center justify-center">
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-md p-6 text-center border border-gray-200">
          <p className="text-red-600 font-medium mb-4">{error}</p>
          <button
            onClick={fetchFund}
            className="bg-[#087F5B] text-white px-4 py-2 rounded-md hover:bg-[#087F5B]/90 font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }



  return (
    <div className="min-h-screen bg-[#FAFAF8] text-[#171717] p-6">
      <div className="max-w-5xl mx-auto">
        <FundHeader fund={fund} totalCollected={totalCollected} totalSpent={totalSpent} balance={balance} />
        <div className="flex flex-wrap gap-4 mb-6 mt-4">
          {isMember && (
            <button
              onClick={() => setShowContributionModal(true)}
              className="bg-[#087F5B] text-white px-4 py-2 rounded-md hover:bg-[#087F5B]/90 font-medium text-sm transition-colors"
            >
              Add Contribution
            </button>
          )}
          {isMember && (
            <button
              onClick={() => setShowExpenseModal(true)}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 font-medium text-sm transition-colors"
            >
              Add Expense
            </button>
          )}
          {user?.id === fund.ownerId && (
            <button
              onClick={createInvite}
              disabled={inviteLoading}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium text-sm transition-colors"
            >
              {inviteLoading ? 'Generating...' : 'Invite / Share'}
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <TransactionTimeline contributions={fund.contributions} expenses={fund.expenses} />
          </div>
          <div className="md:col-span-1">
            <MemberList members={fund.members} ownerId={fund.ownerId} currentUserId={user?.id} />
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
  );
}
