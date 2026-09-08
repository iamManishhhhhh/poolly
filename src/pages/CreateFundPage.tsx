import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';

export default function CreateFundPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!user) {
      navigate('/auth/login');
    }
  }, [user, navigate]);
  if (!user) return null;
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Basic validation
    if (!name.trim() || !startDate || !currency.trim()) {
      setError('Fund name, start date and currency are required');
      return;
    }
    if (targetAmount && isNaN(Number(targetAmount))) {
      setError('Target amount must be a valid number');
      return;
    }
    setLoading(true);
    setError(null);
    const { error: dbError, data } = await supabase.from('funds').insert([
      {
        name,
        description: description || null,
        target_amount: targetAmount ? Number(targetAmount) : null,
        start_date: startDate,
        end_date: endDate || null,
        currency,
        owner_id: user?.id,
      },
    ]).select('id');
    setLoading(false);
    if (dbError) {
      setError(dbError.message);
      return;
    }
    const fundId = data?.[0]?.id;
    if (fundId) {
      navigate(`/funds/${fundId}`);
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-12 p-6 bg-surface-light rounded-lg rounded-lg shadow">
      <h2 className="text-2xl font-semibold mb-4 text-primary">Create a New Fund</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Fund Name" value={name} onChange={e => setName(e.target.value)} required />
        <Input label="Description" value={description} onChange={e => setDescription(e.target.value)} />
        <Input label="Target Amount (₹)" type="number" value={targetAmount} onChange={e => setTargetAmount(e.target.value)} />
        <Input label="Start Date" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
        <Input label="End Date (optional)" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
        <Input label="Currency" value={currency} onChange={e => setCurrency(e.target.value)} />
        {error && <p className="text-red-600">{error}</p>}
        <Button type="submit" variant="primary" className="w-full" disabled={loading}>
          {loading ? 'Creating...' : 'Create Fund'}
        </Button>
      </form>
    </div>
  );
}
