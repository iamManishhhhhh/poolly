import React from 'react';
import { Link } from 'react-router-dom';
import { StatCard } from './StatCard';
import type { Fund } from '../types/models';

interface FundHeaderProps {
  fund: Fund;
  totalCollected: number;
  totalSpent: number;
  balance: number;
}

export const FundHeader: React.FC<FundHeaderProps> = ({ fund, totalCollected, totalSpent, balance }) => {
  const memberCount = fund.members?.length ?? 0;
  const currencySymbol = fund.currency === 'USD' ? '$' : '₹';
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold text-primary">{fund.name}</h1>
        <Link to="/dashboard" className="text-sm text-primary underline">Back to Dashboard</Link>
      </div>
      <p className="mb-4 text-gray-700">{fund.description}</p>
      <div className="grid md:grid-cols-4 gap-4">
        <StatCard label="Collected" value={`${currencySymbol}${totalCollected}`} />
        <StatCard label="Spent" value={`${currencySymbol}${totalSpent}`} />
        <StatCard label="Balance" value={`${currencySymbol}${balance}`} />
        <StatCard label="Members" value={memberCount.toString()} />
      </div>
    </div>
  );
};
