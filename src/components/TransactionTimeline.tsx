import React from 'react';
import type { Contribution, Expense } from '../types/models';

interface TransactionItem {
  type: 'contribution' | 'expense';
  amount: number;
  description: string;
  date: string;
}

interface TransactionTimelineProps {
  contributions: Contribution[];
  expenses: Expense[];
}

export const TransactionTimeline: React.FC<TransactionTimelineProps> = ({ contributions, expenses }) => {
  const transactions: TransactionItem[] = [];

  contributions.forEach((c) => {
    transactions.push({
      type: 'contribution',
      amount: c.amount,
      description: `Contribution by ${c.contributorId}`,
      date: c.date,
    });
  });

  expenses.forEach((e) => {
    transactions.push({
      type: 'expense',
      amount: e.amount,
      description: e.name,
      date: e.date,
    });
  });

  // Sort by date descending
  transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-primary mb-2">Transaction History</h2>
      <ul className="border-l-2 border-primary pl-4">
        {transactions.map((t, idx) => (
          <li key={idx} className="mb-2 flex items-start">
            <div className={`flex-shrink-0 w-3 h-3 rounded-full mt-1 ${t.type === 'contribution' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
            <div className="ml-3">
              <p className="text-sm font-medium">
                {t.type === 'contribution' ? '🟢 Contribution' : '🔴 Expense'} – ₹{t.amount}
              </p>
              <p className="text-xs text-gray-600">{t.description}</p>
              <p className="text-xs text-gray-500">{new Date(t.date).toLocaleDateString()}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
