import React from 'react';
import { Link } from 'react-router-dom';
import type { Fund } from '../types/models';

interface FundHeaderProps {
  fund: Fund;
  totalCollected: number;
  totalSpent: number;
  balance: number;
}

export const FundHeader: React.FC<FundHeaderProps> = ({ fund, totalCollected, totalSpent, balance }) => {
  const currencySymbol = fund.currency === 'USD' ? '$' : '₹';

  return (
    <div className="space-y-5">
      {/* Top Navigation Row: Back on left, Settings on right */}
      <div className="flex items-center justify-between">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-900 transition-colors"
        >
          <span>←</span>
          <span>Back to Dashboard</span>
        </Link>
        <Link
          to={`/funds/${fund.id}/settings`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200 bg-white text-xs font-semibold text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300 shadow-2xs transition-all"
        >
          <span>Settings</span>
        </Link>
      </div>

      {/* Fund Heading & Description */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#171717]">
          {fund.name}
        </h1>
        {fund.description ? (
          <p className="text-xs sm:text-sm text-neutral-500 mt-1 max-w-2xl">
            {fund.description}
          </p>
        ) : (
          <p className="text-xs text-neutral-400 mt-1 italic">
            No description provided
          </p>
        )}
      </div>

      {/* Refined Financial Summary Card */}
      <div className="bg-white rounded-2xl p-6 sm:p-7 border border-[#EAEAE6] shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
              Current Balance
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#171717] mt-1">
              {currencySymbol}{balance.toLocaleString('en-IN')}
            </div>
            {fund.targetAmount && (
              <div className="text-xs text-neutral-500 font-medium mt-1">
                Target: {currencySymbol}{fund.targetAmount.toLocaleString('en-IN')}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 sm:gap-4 pt-4 md:pt-0 border-t md:border-t-0 border-neutral-100">
            <div className="bg-neutral-50/80 rounded-xl px-4 py-3 border border-neutral-100/80 min-w-[130px]">
              <div className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
                Collected
              </div>
              <div className="text-base sm:text-lg font-bold text-neutral-800 mt-0.5">
                {currencySymbol}{totalCollected.toLocaleString('en-IN')}
              </div>
            </div>
            <div className="bg-neutral-50/80 rounded-xl px-4 py-3 border border-neutral-100/80 min-w-[130px]">
              <div className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
                Spent
              </div>
              <div className="text-base sm:text-lg font-bold text-neutral-800 mt-0.5">
                {currencySymbol}{totalSpent.toLocaleString('en-IN')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
