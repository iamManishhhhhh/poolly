import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';

export default function CreateFundPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth/login', { replace: true });
    }
  }, [user, authLoading, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8]">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#087F5B] mx-auto"></div>
          <p className="mt-4 text-[#171717] font-medium">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic validation
    if (!name.trim() || !startDate || !currency.trim()) {
      setError('Fund name, start date and currency are required.');
      return;
    }
    if (targetAmount && (isNaN(Number(targetAmount)) || Number(targetAmount) <= 0)) {
      setError('Target amount must be a positive number.');
      return;
    }

    setLoading(true);

    // Verify active Supabase session and fetch authenticated user
    const {
      data: { user: currentUser },
      error: sessionError,
    } = await supabase.auth.getUser();

    if (sessionError || !currentUser) {
      setError('Authenticated session invalid or expired. Please log in again.');
      setLoading(false);
      return;
    }

    const ownerId = currentUser.id;

    // Insert into public.funds with owner_id = currentUser.id (matching auth.uid())
    const { error: dbError } = await supabase
      .from('funds')
      .insert([
        {
          name: name.trim(),
          description: description.trim() || null,
          target_amount: targetAmount ? Number(targetAmount) : null,
          start_date: startDate,
          end_date: endDate || null,
          currency: currency.trim(),
          owner_id: ownerId,
        },
      ])
      .select('id');

    if (dbError) {
      console.error('Error creating fund:', dbError);
      setError(dbError.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    navigate('/dashboard', { replace: true });
  };

  return (
    <div className="max-w-xl mx-auto mt-12 p-6 bg-white rounded-xl shadow-md border border-gray-100">
      <h2 className="text-2xl font-bold mb-6 text-[#171717]">Create a New Fund</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Fund Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Goa Trip 2026"
          required
        />
        <Input
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the purpose of this fund"
        />
        <Input
          label="Target Amount (₹)"
          type="number"
          value={targetAmount}
          onChange={(e) => setTargetAmount(e.target.value)}
          placeholder="50000"
        />
        <Input
          label="Start Date"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          required
        />
        <Input
          label="End Date (optional)"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
        <Input
          label="Currency"
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          required
        />
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}
        <Button
          type="submit"
          variant="primary"
          className="w-full py-2.5 font-semibold"
          disabled={loading}
        >
          {loading ? 'Creating Fund...' : 'Create Fund'}
        </Button>
      </form>
    </div>
  );
}

