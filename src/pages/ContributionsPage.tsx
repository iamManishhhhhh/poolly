import type { Fund, Contribution } from '../types/models';
import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Button } from '../components/Button';

export default function ContributionsPage() {
  const { fundId } = useParams();
  const [fund, setFund] = useState<Fund | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!fundId) return;
      setLoading(true);
      try {
        // Fetch fund details
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
        // Fetch contributions for this fund
        const { data: contribData, error: contribError } = await supabase
          .from('contributions')
          .select('*')
          .eq('fund_id', fundId);
        if (contribError) {
          setError('Failed to load contributions');
          setLoading(false);
          return;
        }
        const mappedContribs: Contribution[] = (contribData || []).map((c: any) => ({
          id: c.id,
          fundId: c.fund_id,
          contributorId: c.contributor_id,
          amount: Number(c.amount),
          date: c.date,
          status: c.status,
          note: c.note,
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
          members: [], // members are not needed here
          contributions: mappedContribs,
          expenses: [],
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
      <h1 className="text-2xl font-bold mb-4 text-primary">Contributions for {fund.name}</h1>
      <div className="space-y-4">
        {fund.contributions && fund.contributions.length > 0 ? (
          fund.contributions.map(c => (
            <div key={c.id} className="bg-surface-light p-3 rounded-md shadow">
              <p>Contributor: {c.contributorId}</p>
              <p>Amount: ₹{c.amount}</p>
              <p>Date: {new Date(c.date).toLocaleDateString()}</p>
              <p>Status: {c.status}</p>
            </div>
          ))
        ) : (
          <p>No contributions yet.</p>
        )}
      </div>
      <div className="mt-6">
        <Button variant="primary" className="mr-2" onClick={() => { /* open modal logic can be added later */ }}>
          Add Contribution
        </Button>
        <Link to={`/funds/${fund.id}`} className="text-primary underline ml-4">
          Back to Fund
        </Link>
      </div>
    </div>
  );
}
