import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
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
  const [success, setSuccess] = useState(false);

  // Reset form state when modal opens
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSuccess(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent double submission
    if (loading) return;

    if (!user) {
      setError('You must be logged in to add a contribution.');
      return;
    }

    // ── Validate amount ──────────────────────────────────────────────
    const trimmed = amount.trim();
    if (!trimmed) {
      setError('Please enter an amount.');
      return;
    }

    const amountNum = Number(trimmed);

    if (!Number.isFinite(amountNum)) {
      setError('Please enter a valid numeric amount.');
      return;
    }

    if (amountNum <= 0) {
      setError('Amount must be greater than zero.');
      return;
    }

    // Guard against absurdly large values (100 crore limit)
    if (amountNum > 1_000_000_000) {
      setError('Amount exceeds the maximum allowed value.');
      return;
    }

    // ── Insert ───────────────────────────────────────────────────────
    setLoading(true);
    setError(null);

    const { error: dbError } = await supabase.from('contributions').insert([
      {
        fund_id: fundId,
        contributor_id: user.id, // always auth.uid()
        amount: amountNum,
        date: new Date().toISOString(),
        status: 'completed',
        note: note.trim() || null,
      },
    ]);

    setLoading(false);

    if (dbError) {
      // Surface user-friendly messages for known RLS/constraint errors
      const msg = (dbError.message || '').toLowerCase();
      if (msg.includes('policy') || msg.includes('permission') || msg.includes('rls')) {
        setError('You do not have permission to contribute to this fund.');
      } else if (msg.includes('check') || msg.includes('constraint')) {
        setError('Invalid contribution data. Please check your input.');
      } else {
        setError(dbError.message || 'Failed to save contribution. Please try again.');
      }
    } else {
      setSuccess(true);
      setAmount('');
      setNote('');
      // Auto-close after brief success feedback
      setTimeout(() => {
        setSuccess(false);
        onClose();
        onAdded();
      }, 1200);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl border border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-[#171717]">Add Contribution</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {success ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <p className="text-green-700 font-medium">Contribution saved!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-[#171717] mb-1" htmlFor="contrib-amount">
                Amount
              </label>
              <input
                id="contrib-amount"
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 500"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#087F5B]/50 focus:border-[#087F5B]"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#171717] mb-1" htmlFor="contrib-note">
                Note <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                id="contrib-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. January share"
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#087F5B]/50 focus:border-[#087F5B] resize-none"
              />
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}
            <div className="flex gap-3 pt-1">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-[#087F5B] hover:bg-[#087F5B]/90 disabled:opacity-50 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors text-sm"
              >
                {loading ? 'Saving…' : 'Save Contribution'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 px-4 rounded-lg transition-colors text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

