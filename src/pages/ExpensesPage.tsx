import type { Fund, Expense } from '../types/models';
import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Button } from '../components/Button';

export default function ExpensesPage() {
  const { fundId } = useParams();
  const [fund, setFund] = useState<Fund | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!fundId) return;
      setLoading(true);
      try {
        const { data: fundData, error: fundError } = await supabase
          .from('funds')
          .select('*')
          .eq('id', fundId)
          .maybeSingle();
        if (fundError || !fundData) {
          setError('Failed to load fund');
          setLoading(false);
          return;
        }
        const { data: expenseData, error: expenseError } = await supabase
          .from('expenses')
          .select('*')
          .eq('fund_id', fundId);
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
          category: fundData.category,
          targetAmount: fundData.target_amount,
          suggestedContribution: fundData.suggested_contribution,
          startDate: fundData.start_date,
          endDate: fundData.end_date,
          currency: fundData.currency,
          ownerId: fundData.owner_id,
          members: [],
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
    };
    fetchData();
  }, [fundId]);

  if (loading) {
    return <div className="p-6 bg-background text-white min-h-screen">Loading...</div>;
  }

  if (error) {
    return (
      <div className="p-6 bg-background text-white min-h-screen">
        <p className="text-red-500">{error}</p>
        <Link to="/dashboard" className="text-primary underline">Back to Dashboard</Link>
      </div>
    );
  }

  if (!fund) {
    return (
      <div className="p-6 bg-background text-white min-h-screen">
        <p className="text-red-500">Fund not found.</p>
        <Link to="/dashboard" className="text-primary underline">Back to Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-white p-6">
      <h1 className="text-2xl font-bold mb-4 text-primary">Expenses for {fund.name}</h1>
      <div className="space-y-4">
        {fund.expenses && fund.expenses.length > 0 ? (
          fund.expenses.map(e => (
            <div key={e.id} className="bg-surface-light p-3 rounded-md shadow">
              <p>Name: {e.name}</p>
              <p>Amount: ₹{e.amount}</p>
              <p>Category: {e.category}</p>
              <p>Date: {e.date}</p>
              <p>Status: {e.status}</p>
            </div>
          ))
        ) : (
          <p>No expenses recorded.</p>
        )}
      </div>
      <div className="mt-6">
        <Button variant="primary" className="mr-2" onClick={() => { /* open modal logic */ }}>
          Add Expense
        </Button>
        <Link to={`/funds/${fund.id}`} className="text-primary underline ml-4">
          Back to Fund
        </Link>
      </div>
    </div>
  );
}
