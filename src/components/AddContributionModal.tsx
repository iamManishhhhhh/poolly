import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import type { Contribution } from '../types/models';
import { useAuth } from '../contexts/AuthContext';

type AddContributionModalProps = {
  fundId: string;
  isOpen: boolean;
  onClose: () => void;
  onAdded: () => void; // callback to refresh fund data
};

export const AddContributionModal: React.FC<AddContributionModalProps> = ({ fundId, isOpen, onClose, onAdded }) => {
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('You must be logged in to add a contribution.');
      return;
    }
    const amountNum = Number(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid amount.');
      return;
    }
    setLoading(true);
    const { error: dbError } = await supabase.from('contributions').insert([
      {
        fund_id: fundId,
        contributor_id: user.id,
        amount: amountNum,
        date: new Date().toISOString(),
        status: 'completed',
        note: note || null,
      } as unknown as Contribution,
    ]);
    setLoading(false);
    if (dbError) {
      setError(dbError.message);
    } else {
      setAmount('');
      setNote('');
      setError(null);
      onClose();
      onAdded();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg p-6 w-96 shadow-lg">
        <h2 className="text-xl font-semibold mb-4 text-primary">Add Contribution</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="amount">
              Amount
            </label>
            <input
              id="amount"
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full border rounded px-2 py-1"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="note">
              Note (optional)
            </label>
            <textarea
              id="note"
              value={note}
              onChange={e => setNote(e.target.value)}
              className="w-full border rounded px-2 py-1"
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex justify-end space-x-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded border">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="px-4 py-2 rounded bg-emerald-600 text-white">
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
