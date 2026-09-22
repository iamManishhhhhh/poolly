import React, { useState, useEffect, useCallback } from 'react';
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

  const handleClose = useCallback(() => {
    if (loading) return;
    setError(null);
    setSuccess(false);
    setAmount('');
    setNote('');
    onClose();
  }, [loading, onClose]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, loading, handleClose]);

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
      }, 1000);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 sm:p-6"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="bg-white rounded-2xl p-6 sm:p-7 w-full max-w-md shadow-xl border border-[#EAEAE6] relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 id="modal-title" className="text-lg sm:text-xl font-bold text-[#171717]">
            Add Contribution
          </h2>
          <button
            onClick={handleClose}
            disabled={loading}
            className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors text-lg leading-none"
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        {success ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-[#087F5B] flex items-center justify-center mx-auto border border-emerald-100/80">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-[#171717]">Contribution added!</h3>
            <p className="text-xs text-neutral-500">
              Your contribution has been recorded in the fund.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Amount Input */}
            <div>
              <label htmlFor="contrib-amount" className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-2">
                Contribution Amount
              </label>
              <div className="relative flex items-center bg-neutral-50/80 border border-neutral-200/90 rounded-2xl p-4 sm:p-5 focus-within:ring-2 focus-within:ring-[#087F5B]/30 focus-within:border-[#087F5B] focus-within:bg-white transition-all duration-200">
                <span className="text-2xl sm:text-3xl font-bold text-neutral-400 select-none mr-2">
                  ₹
                </span>
                <input
                  id="contrib-amount"
                  type="text"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (/^\d*\.?\d*$/.test(val)) {
                      setAmount(val);
                      if (error) setError(null);
                    }
                  }}
                  placeholder="0"
                  autoFocus
                  className="w-full bg-transparent text-2xl sm:text-3xl font-extrabold text-[#171717] tracking-tight placeholder:text-neutral-300 focus:outline-none"
                />
              </div>

              {/* Quick Amount Suggestion Chips */}
              <div className="flex items-center gap-2 mt-2.5">
                {[100, 500, 1000, 2000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      setAmount(preset.toString());
                      if (error) setError(null);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-neutral-100/80 hover:bg-[#087F5B]/10 hover:text-[#087F5B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#087F5B]/30 focus-visible:ring-offset-2 text-neutral-700 text-xs font-semibold transition-colors duration-150 active:bg-[#087F5B]/20 active:text-white active:scale-95"
                  >
                    +₹{preset.toLocaleString('en-IN')}
                  </button>
                ))}
              </div>
            </div>

            {/* Note Input */}
            <div>
              <label htmlFor="contrib-note" className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                Note <span className="text-neutral-400 font-normal lowercase">(optional)</span>
              </label>
              <input
                id="contrib-note"
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. For dinner, January share"
                maxLength={140}
                className="w-full px-3.5 py-2.5 bg-neutral-50/80 border border-neutral-200/80 rounded-xl text-sm text-[#171717] placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#087F5B]/30 focus:border-[#087F5B] focus:bg-white transition-all duration-200"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-start gap-2 bg-rose-50 border border-rose-200/80 rounded-xl p-3 text-xs sm:text-sm text-rose-700">
                <span className="font-bold text-rose-500 shrink-0">!</span>
                <span className="font-medium">{error}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="flex-1 py-2.5 sm:py-3 px-4 rounded-xl bg-neutral-100 hover:bg-neutral-200/80 text-neutral-700 text-xs sm:text-sm font-semibold transition-colors active:scale-[0.98] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 sm:py-3 px-4 rounded-xl bg-[#087F5B] hover:bg-[#066c4d] text-white text-xs sm:text-sm font-semibold shadow-sm transition-all active:scale-[0.98] disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Saving…</span>
                  </>
                ) : (
                  <span>Confirm Contribution</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

