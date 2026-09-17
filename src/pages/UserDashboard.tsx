import { useAuth } from '../contexts/AuthContext';
import { StatCard } from '../components/StatCard';
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
      // Fetch funds owned by user or where user is a member
      const { data: ownedData, error: ownedErr } = await supabase.from('funds').select('*').eq('owner_id', user.id);
      const { data: memberRows } = await supabase.from('fund_members').select('fund_id').eq('user_id', user.id);

      const fundIds = new Set<string>();
      (ownedData || []).forEach(f => fundIds.add(f.id));
      (memberRows || []).forEach(m => fundIds.add(m.fund_id));

      if (fundIds.size === 0) {
        setFunds([]);
        setLoading(false);
        return;
      }

      const idArray = Array.from(fundIds);
      const { data: allFundsData, error: fundsErr } = await supabase
        .from('funds')
        .select('*')
        .in('id', idArray);

      if (fundsErr || ownedErr) {
        setError(fundsErr?.message || ownedErr?.message || 'Error fetching funds');
        setLoading(false);
        return;
      }

      const { data: contribsData } = await supabase.from('contributions').select('*').in('fund_id', idArray);
      const { data: expensesData } = await supabase.from('expenses').select('*').in('fund_id', idArray);

      const mappedFunds: Fund[] = (allFundsData || []).map((f: any) => {
        const fundContribs = (contribsData || []).filter((c: any) => c.fund_id === f.id).map((c: any) => ({
          id: c.id,
          fundId: c.fund_id,
          contributorId: c.contributor_id,
          amount: Number(c.amount),
          date: c.date,
          status: c.status,
          note: c.note,
        }));
        const fundExpenses = (expensesData || []).filter((e: any) => e.fund_id === f.id).map((e: any) => ({
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
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background text-[#171717] p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-primary">Your Dashboard</h1>
      </div>
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <StatCard label="Total Collected" value={`₹${totalCollected}`} />
        <StatCard label="Total Spent" value={`₹${totalSpent}`} />
        <StatCard label="Balance" value={`₹${balance}`} />
      </div>
      <h2 className="text-2xl font-semibold mb-4 text-primary">Your Funds</h2>
      {error && <p className="text-red-600">{error}</p>}
      <div className="grid md:grid-cols-2 gap-4">
        {funds.map(fund => (
          <FundCard key={fund.id} fund={fund} />
        ))}
      </div>
      <div className="mt-8 flex gap-4">
        <Link to="/funds/create" className="text-primary hover:underline">
          + Create a new fund
        </Link>
        <Link to="/join" className="text-primary hover:underline">
          Join a Fund
        </Link>
      </div>
    </div>
  );
}

