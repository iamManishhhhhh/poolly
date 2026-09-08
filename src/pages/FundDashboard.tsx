import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import type { Fund } from '../types/models';
import { FundHeader } from '../components/FundHeader';
import { TransactionTimeline } from '../components/TransactionTimeline';
import { AddContributionModal } from '../components/AddContributionModal';
import { AddExpenseModal } from '../components/AddExpenseModal';


export default function FundDashboard() {
  const { fundId } = useParams<{ fundId: string }>();
  // const { user } = useAuth(); // not used currently
  const [fund, setFund] = useState<Fund | null>(null);
  const [loading, setLoading] = useState(true);
  const [showContributionModal, setShowContributionModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  const fetchFund = async () => {
    if (!fundId) return;
    const { data, error } = await supabase
      .from('funds')
      .select('*, members(*), contributions(*), expenses(*)')
      .eq('id', fundId)
      .single();
    if (error) {
      console.error('Error fetching fund:', error);
      setFund(null);
    } else {
      const f: Fund = {
        id: data.id,
        name: data.name,
        description: data.description,
        category: data.category,
        targetAmount: data.target_amount,
        suggestedContribution: data.suggested_contribution,
        startDate: data.start_date,
        endDate: data.end_date,
        currency: data.currency,
        members: data.members || [],
        contributions: data.contributions || [],
        expenses: data.expenses || [],
      };
      setFund(f);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchFund();
  }, [fundId]);

  if (loading) {
    return <div className="p-6 bg-background min-h-screen text-primary">Loading fund details…</div>;
  }

  if (!fund) {
    return (
      <div className="p-6 text-white bg-background min-h-screen">
        <p className="text-red-500">Fund not found.</p>
        <Link to="/dashboard" className="text-primary underline">Back to Dashboard</Link>
      </div>
    );
  }

  const totalCollected = fund.contributions?.reduce((sum, c) => sum + c.amount, 0) ?? 0;
  const totalSpent = fund.expenses?.reduce((sum, e) => sum + e.amount, 0) ?? 0;
  const balance = totalCollected - totalSpent;

  return (
    <div className="min-h-screen bg-background text-white p-6">
      <FundHeader fund={fund} totalCollected={totalCollected} totalSpent={totalSpent} balance={balance} />
      <div className="flex gap-4 mb-6">
        <button onClick={() => setShowContributionModal(true)} className="bg-emerald-600 text-white px-4 py-2 rounded">
          Add Contribution
        </button>
        <button onClick={() => setShowExpenseModal(true)} className="bg-red-600 text-white px-4 py-2 rounded">
          Add Expense
        </button>
      </div>
      <TransactionTimeline contributions={fund.contributions} expenses={fund.expenses} />
      <AddContributionModal fundId={fund.id} isOpen={showContributionModal} onClose={() => setShowContributionModal(false)} onAdded={fetchFund} />
      <AddExpenseModal fundId={fund.id} isOpen={showExpenseModal} onClose={() => setShowExpenseModal(false)} onAdded={fetchFund} />
    </div>
  );
}
