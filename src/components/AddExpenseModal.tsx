import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import type { Expense } from '../types/models';
import { useAuth } from '../contexts/AuthContext';

type AddExpenseModalProps = {
  fundId: string;
  isOpen: boolean;
  onClose: () => void;
  onAdded: () => void; // callback to refresh fund data
};

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({ fundId, isOpen, onClose, onAdded }) => {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [vendor, setVendor] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('You must be logged in to add an expense.');
      return;
    }
    const amountNum = Number(amount);
    if (!name || isNaN(amountNum) || amountNum <= 0) {
      setError('Please provide a valid name and amount.');
      return;
    }
    setLoading(true);
    const { error: dbError } = await supabase.from('expenses').insert([
      {
        fund_id: fundId,
        added_by_id: user.id,
        name,
        amount: amountNum,
        vendor: vendor || null,
        category: category || null,
        date: new Date().toISOString(),
        status: 'pending',
      } as unknown as Expense,
    ]);
    setLoading(false);
    if (dbError) {
      setError(dbError.message);
    } else {
      setName('');
      setAmount('');
      setCategory('');
      setVendor('');
      setError(null);
      onClose();
      onAdded();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg p-6 w-96 shadow-lg">
        <h2 className="text-xl font-semibold mb-4 text-primary">Add Expense</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="name">
              Expense Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full border rounded px-2 py-1"
              required
            />
          </div>
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
            <label className="block text-sm font-medium mb-1" htmlFor="category">
              Category (optional)
            </label>
            <input
              id="category"
              type="text"
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full border rounded px-2 py-1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="vendor">
              Vendor (optional)
            </label>
            <input
              id="vendor"
              type="text"
              value={vendor}
              onChange={e => setVendor(e.target.value)}
              className="w-full border rounded px-2 py-1"
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex justify-end space-x-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded border">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="px-4 py-2 rounded bg-red-600 text-white">
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
