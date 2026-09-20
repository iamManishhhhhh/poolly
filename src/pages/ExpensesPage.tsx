import type { Fund, Expense } from '../types/models';
import { useParams, Link } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { AddExpenseModal } from '../components/AddExpenseModal';
import { useAuth } from '../contexts/AuthContext';

export default function ExpensesPage() {
  const { fundId } = useParams<{ fundId: string }>();
  const [fund, setFund] = useState<Fund | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const { user } = useAuth();

  const fetchData = useCallback(async () => {
    if (!fundId) return;
    setLoading(true);
    try {
      // Load fund record (select needed columns)
      const { data: fundData, error: fundError } = await supabase
        .from('funds')
        .select('id, name, description, target_amount, suggested_contribution, start_date, end_date, currency, owner_id')
        .eq('id', fundId)
        .maybeSingle();
      if (fundError || !fundData) {
        setError('Failed to load fund');
        setLoading(false);
        return;
      }

      // Load members for permission check
      const { data: membersData, error: membersError } = await supabase
        .from('fund_members')
        .select('user_id, role, joined_at, total_contributed')
        .eq('fund_id', fundId);

      if (membersError) {
        setError('Failed to load members');
        setLoading(false);
        return;
      }

      // Load expenses
      const { data: expenseData, error: expenseError } = await supabase
        .from('expenses')
        .select('id, fund_id, added_by_id, name, amount, vendor, category, date, receipt_url, status')
        .eq('fund_id', fundId)
        .order('date', { ascending: false });

      if (expenseError) {
        setError('Failed to load expenses');
        setLoading(false);
        return;
      }

      const mappedExpenses: Expense[] = (expenseData || []).map((e: any) => ({
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
        members: (membersData || []).map((m: any) => ({
          userId: m.user_id,
          role: m.role,
          joinedAt: m.joined_at,
          totalContributed: Number(m.total_contributed),
        })),
        contributions: [],
        expenses: mappedExpenses,
      };
      setFund(f);
    } catch (e) {
      setError('Unexpected error');
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [fundId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return <div className="p-6 bg-background text-[#171717] min-h-screen">Loading...</div>;
  }

  if (error) {
    return (
      <div className="p-6 bg-background text-[#171717] min-h-screen">
        <p className="text-red-500">{error}</p>
        <Link to="/dashboard" className="text-primary underline">Back to Dashboard</Link>
      </div>
    );
  }

  if (!fund) {
    return (
      <div className="p-6 bg-background text-[#171717] min-h-screen">
        <p className="text-red-500">Fund not found.</p>
        <Link to="/dashboard" className="text-primary underline">Back to Dashboard</Link>
      </div>
    );
  }

  const isMember = fund && (fund.members?.some(m => m.userId === user?.id) || fund.ownerId === user?.id);

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-[#171717] p-6">
      <h1 className="text-2xl font-bold mb-4 text-[#171717]">Expenses for {fund.name}</h1>
      <div className="space-y-4">
        {fund.expenses && fund.expenses.length > 0 ? (
          fund.expenses.map(e => (
            <div key={e.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <p className="font-semibold text-[#171717] text-lg">{e.name}</p>
              <div className="text-sm text-gray-600 mt-1">
                <p>Amount: <span className="font-medium text-[#171717]">{fund.currency === 'USD' ? '$' : '₹'}{e.amount}</span></p>
                {e.category && <p>Category: {e.category}</p>}
                {e.vendor && <p>Vendor: {e.vendor}</p>}
                <p>Date: {new Date(e.date).toLocaleDateString()}</p>
                <p>Added by: <span className="font-mono text-xs">{e.addedById}</span></p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500 italic">No expenses recorded.</p>
        )}
      </div>
      {isMember && (
        <div className="mt-6 flex items-center">
          <button
            className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md transition-colors text-sm"
            onClick={() => setShowModal(true)}
          >
            Add Expense
          </button>
          <Link to={`/funds/${fund.id}`} className="text-[#087F5B] underline ml-4 text-sm font-medium">
            Back to Fund
          </Link>
        </div>
      )}
      <AddExpenseModal
        fundId={fund.id}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onAdded={fetchData}
      />
    </div>
  );
}
