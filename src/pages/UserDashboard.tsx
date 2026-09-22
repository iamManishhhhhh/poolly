import { useAuth } from '../contexts/AuthContext';
import { FundCard } from '../components/FundCard';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import type { Fund } from '../types/models';

export default function UserDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [funds, setFunds] = useState<Fund[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetchFunds = async () => {
      setLoading(true);
      // Fetch owned funds and member fund ids in parallel (independent)
      const [{ data: ownedData, error: ownedErr }, { data: memberRows, error: memberRowsErr }] = await Promise.all([
        supabase.from('funds').select('*').eq('owner_id', user.id),
        supabase.from('fund_members').select('fund_id').eq('user_id', user.id)
      ]);
      if (ownedErr) { setError(ownedErr.message); setLoading(false); return; }
      if (memberRowsErr) { setError(memberRowsErr.message); setLoading(false); return; }
      // Build set of fund IDs
      const fundIdsSet = new Set<string>();
      (ownedData || []).forEach(f => fundIdsSet.add(f.id));
      (memberRows || []).forEach(m => fundIdsSet.add(m.fund_id));
      const fundIds = Array.from(fundIdsSet);
      if (fundIds.length === 0) { setFunds([]); setLoading(false); return; }
      // Refetch all funds with full data
      const { data: allFundsData, error: fundsErr } = await supabase.from('funds').select('*').in('id', fundIds);
      if (fundsErr) { setError(fundsErr.message); setLoading(false); return; }
      // Refetch contributions and expenses for these funds
      const [{ data: contributions }, { data: expenses }] = await Promise.all([
        supabase.from('contributions').select('*').in('fund_id', fundIds),
        supabase.from('expenses').select('*').in('fund_id', fundIds)
      ]);
      const mappedFunds: Fund[] = (allFundsData || []).map((f: any) => {
        const fundContribs = (contributions || []).filter((c: any) => c.fund_id === f.id).map((c: any) => ({
          id: c.id,
          fundId: c.fund_id,
          contributorId: c.contributor_id,
          amount: Number(c.amount),
          date: c.date,
          status: c.status,
          note: c.note,
        }));
        const fundExpenses = (expenses || []).filter((e: any) => e.fund_id === f.id).map((e: any) => ({
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
        }));
        return {
          id: f.id,
          name: f.name,
          description: f.description,
          category: f.category,
          targetAmount: f.target_amount,
          suggestedContribution: f.suggested_contribution,
          startDate: f.start_date,
          endDate: f.end_date,
          currency: f.currency,
          ownerId: f.owner_id,
          members: [],
          contributions: fundContribs,
          expenses: fundExpenses,
        };
      });
    setFunds(mappedFunds);
    setLoading(false);
  };
    fetchFunds();
  }, [user]);

  const totalCollected = funds.reduce(
    (sum, f) => sum + (f.contributions?.reduce((s, c) => s + c.amount, 0) ?? 0),
    0
  );
  const totalSpent = funds.reduce(
    (sum, f) => sum + (f.expenses?.reduce((s, e) => s + e.amount, 0) ?? 0),
    0
  );
  const balance = totalCollected - totalSpent;

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#F8FAF9] flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-neutral-200 border-t-[#087F5B] animate-spin" />
          <p className="text-xs text-neutral-500 font-medium">Loading your dashboard...</p>
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

      {/* Main Dashboard Content */}
      <div className="relative z-10 px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8">
          {/* Dashboard Hero Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#171717]">
                Your money, together.
              </h1>
              <p className="text-xs sm:text-sm text-neutral-500 mt-1">
                Track, contribute, and manage your shared funds in one place.
              </p>
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              <Link
                to="/funds/create"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#087F5B] text-white text-xs sm:text-sm font-semibold shadow-sm hover:bg-[#066c4d] active:scale-[0.98] transition-all duration-150"
              >
                <span>+</span>
                <span>Create Fund</span>
              </Link>
              <Link
                to="/join"
                className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-white border border-neutral-200 text-neutral-800 text-xs sm:text-sm font-semibold shadow-2xs hover:bg-neutral-50 hover:border-neutral-300 active:scale-[0.98] transition-all duration-150"
              >
                Join Fund
              </Link>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* Refined Financial Summary */}
          <div className="bg-white rounded-2xl p-6 sm:p-7 border border-[#EAEAE6] shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                  Total Balance
                </div>
                <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#171717] mt-1">
                  ₹{balance.toLocaleString('en-IN')}
                </div>
                <div className="text-xs text-neutral-500 font-medium mt-1">
                  Across {funds.length} {funds.length === 1 ? 'fund' : 'funds'}
                </div>
              </div>

              <div className="flex items-center gap-3 sm:gap-4 pt-4 md:pt-0 border-t md:border-t-0 border-neutral-100">
                <div className="bg-neutral-50/80 rounded-xl px-4 py-3 border border-neutral-100/80 min-w-[130px]">
                  <div className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
                    Collected
                  </div>
                  <div className="text-base sm:text-lg font-bold text-neutral-800 mt-0.5">
                    ₹{totalCollected.toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="bg-neutral-50/80 rounded-xl px-4 py-3 border border-neutral-100/80 min-w-[130px]">
                  <div className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
                    Spent
                  </div>
                  <div className="text-base sm:text-lg font-bold text-neutral-800 mt-0.5">
                    ₹{totalSpent.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Funds Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Your Funds ({funds.length})
              </h2>
            </div>

            {funds.length === 0 ? (
              <div className="bg-white rounded-2xl border border-[#EAEAE6] p-8 sm:p-12 text-center max-w-md mx-auto shadow-2xs">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#087F5B] flex items-center justify-center mx-auto mb-4 border border-emerald-100/60">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.75" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-[#171717]">No shared funds yet.</h3>
                <p className="text-xs sm:text-sm text-neutral-500 mt-1 max-w-xs mx-auto">
                  Create a fund for your next trip, event, or shared expense.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
                  <Link
                    to="/funds/create"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#087F5B] text-white text-xs sm:text-sm font-semibold shadow-sm hover:bg-[#066c4d] active:scale-[0.98] transition-all"
                  >
                    <span>+</span>
                    <span>Create Fund</span>
                  </Link>
                  <Link
                    to="/join"
                    className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-white border border-neutral-200 text-neutral-800 text-xs sm:text-sm font-semibold hover:bg-neutral-50 active:scale-[0.98] transition-all"
                  >
                    Join Fund
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                {funds.map((fund) => (
                  <FundCard key={fund.id} fund={fund} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

