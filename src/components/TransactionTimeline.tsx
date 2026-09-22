import React from 'react';
import type { Contribution, Expense } from '../types/models';

interface TransactionItem {
  id: string;
  type: 'contribution' | 'expense';
  amount: number;
  description: string;
  contributorOrVendor?: string;
  date: string;
}

interface TransactionTimelineProps {
  contributions: Contribution[];
  expenses: Expense[];
  currencySymbol?: string;
  onAddContribution?: () => void;
}

export const TransactionTimeline: React.FC<TransactionTimelineProps> = ({
  contributions = [],
  expenses = [],
  currencySymbol = '₹',
  onAddContribution,
}) => {
  const transactions: TransactionItem[] = [];

  contributions.forEach((c) => {
    const who = c.contributorId ? `${c.contributorId.substring(0, 8)}...` : 'member';
    transactions.push({
      id: `contrib-${c.id}`,
      type: 'contribution',
      amount: c.amount,
      description: c.note || `Contribution by ${who}`,
      contributorOrVendor: `Contribution by ${who}`,
      date: c.date,
    });
  });

  expenses.forEach((e) => {
    transactions.push({
      id: `expense-${e.id}`,
      type: 'expense',
      amount: e.amount,
      description: e.name,
      contributorOrVendor: e.vendor || (e.addedById ? `Added by ${e.addedById.substring(0, 8)}...` : undefined),
      date: e.date,
    });
  });

  // Sort by date descending
  transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#EAEAE6] shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
          Activity ({transactions.length})
        </h2>
      </div>

      {transactions.length === 0 ? (
        <div className="p-8 sm:p-10 text-center">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#087F5B] flex items-center justify-center mx-auto mb-3 border border-emerald-100/60">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.75" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <h4 className="text-sm font-bold text-[#171717]">No transactions yet</h4>
          <p className="text-xs text-neutral-500 mt-1 max-w-xs mx-auto">
            Add a contribution or expense to start tracking this fund.
          </p>
          {onAddContribution && (
            <button
              onClick={onAddContribution}
              className="mt-4 inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-[#087F5B] text-white text-xs font-semibold shadow-sm hover:bg-[#066c4d] active:scale-[0.98] transition-all"
            >
              <span>+</span>
              <span>Add Contribution</span>
            </button>
          )}
        </div>
      ) : (
        <div className="divide-y divide-neutral-100 max-h-[560px] overflow-y-auto pr-1">
          {transactions.map((t) => {
            const isContrib = t.type === 'contribution';
            return (
              <div
                key={t.id}
                className="py-3.5 first:pt-0 last:pb-0 flex items-start justify-between gap-3 group hover:bg-neutral-50/50 px-2 rounded-xl transition-colors duration-150"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`w-2 h-2 rounded-full mt-2 shrink-0 ${
                      isContrib ? 'bg-emerald-500' : 'bg-rose-500'
                    }`}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-bold tracking-wide uppercase ${
                          isContrib ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {isContrib ? 'Contribution' : 'Expense'}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-neutral-800 mt-0.5 truncate">
                      {t.description}
                    </p>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      {formatDate(t.date)}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div
                    className={`text-sm sm:text-base font-extrabold tracking-tight ${
                      isContrib ? 'text-emerald-700' : 'text-neutral-800'
                    }`}
                  >
                    {isContrib ? `+${currencySymbol}` : `−${currencySymbol}`}
                    {t.amount.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
