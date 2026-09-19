import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
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
  const [success, setSuccess] = useState(false);

  // Reset form state when modal opens
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSuccess(false);
      setName('');
      setAmount('');
      setCategory('');
      setVendor('');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return; // prevent double submit
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Expense name is required and cannot be empty.');
      return;
    }
    if (!amount) {
      setError('Amount is required.');
      return;
    }
    const amountNum = Number(amount);
    if (!isFinite(amountNum) || Number.isNaN(amountNum)) {
      setError('Amount must be a valid number.');
      return;
    }
    if (amountNum <= 0) {
      setError('Amount must be greater than zero.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { error: insertError } = await supabase.from('expenses').insert({
        fund_id: fundId,
        added_by_id: user?.id,
        name: trimmedName,
        amount: amountNum,
        category: category || null,
        vendor: vendor || null,
        date: new Date().toISOString(),
        status: 'pending',
      });
      if (insertError) {
        setError(insertError.message || 'Failed to save expense.');
      } else {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          onClose();
          onAdded();
        }, 1200);
      }
    } catch (err) {
      setError('Unexpected error while saving expense.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl border border-gray-100" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-[#171717]">Add Expense</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none" aria-label="Close">×</button>
        </div>
        {success ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <p className="text-green-700 font-medium">Expense saved!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-[#171717] mb-1" htmlFor="expense-name">Expense Name</label>
              <input id="expense-name" type="text" value={name} onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Venue Booking"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#087F5B]/50 focus:border-[#087F5B]"
                autoFocus required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#171717] mb-1" htmlFor="expense-amount">Amount</label>
              <input id="expense-amount" type="text" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 1500"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#087F5B]/50 focus:border-[#087F5B]"
                required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#171717] mb-1" htmlFor="expense-category">Category <span className="text-gray-400 font-normal">(optional)</span></label>
              <input id="expense-category" type="text" value={category} onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Event, Supplies"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#087F5B]/50 focus:border-[#087F5B]" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#171717] mb-1" htmlFor="expense-vendor">Vendor <span className="text-gray-400 font-normal">(optional)</span></label>
              <input id="expense-vendor" type="text" value={vendor} onChange={(e) => setVendor(e.target.value)}
                placeholder="e.g. Amazon, Local Store"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#087F5B]/50 focus:border-[#087F5B]" />
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3"><p className="text-red-600 text-sm">{error}</p></div>
            )}
            <div className="flex gap-3 pt-1">
              <button type="submit" disabled={loading}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors text-sm">
                {loading ? 'Saving…' : 'Save Expense'}
              </button>
              <button type="button" onClick={onClose}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 px-4 rounded-lg transition-colors text-sm">
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
