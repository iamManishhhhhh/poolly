import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { StatCard } from '../components/StatCard';
import { FundCard } from '../components/FundCard';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import type { Fund } from '../types/models';

export default function UserDashboard() {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [funds, setFunds] = useState<Fund[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetchFunds = async () => {
      setLoading(true);
      const { data, error } = await supabase.from('funds').select('*').eq('owner_id', user.id);
      if (error) {
        setError(error.message);
        console.error('Error fetching funds:', error);
      } else {
        setFunds(data as Fund[]);
      }
      setLoading(false);
    };
    fetchFunds();
  }, [user]);

  const handleLogout = async () => {
    const { error } = await signOut();
    if (!error) {
      navigate('/');
    } else {
      console.error('Logout error:', error);
    }
  };

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
        <Button variant="secondary" onClick={handleLogout}>Logout</Button>
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
      <div className="mt-8">
        <Link to="/funds/create" className="text-primary hover:underline">
          + Create a new fund
        </Link>
      </div>
    </div>
  );
}
