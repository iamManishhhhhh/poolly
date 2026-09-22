import React from 'react';
import type { Fund } from '../types/models';
import { Link } from 'react-router-dom';

interface FundCardProps {
  fund: Fund;
}

export const FundCard: React.FC<FundCardProps> = ({ fund }) => {
  const totalContributed = fund.contributions?.reduce((sum, c) => sum + c.amount, 0) ?? 0;
  const totalSpent = fund.expenses?.reduce((sum, e) => sum + e.amount, 0) ?? 0;
  const balance = totalContributed - totalSpent;
  const currencySymbol = fund.currency === 'USD' ? '$' : '₹';

  // Derive participant/member count from members array or unique contributors & owner
  const participantIds = new Set<string>();
  if (fund.ownerId) participantIds.add(fund.ownerId);
  (fund.members || []).forEach((m) => participantIds.add(m.userId));
  (fund.contributions || []).forEach((c) => participantIds.add(c.contributorId));
  (fund.expenses || []).forEach((e) => participantIds.add(e.addedById));
  const memberCount = Math.max(fund.members?.length || 0, participantIds.size, 1);

  return (
    <Link
      to={`/funds/${fund.id}`}
      className="group relative flex flex-col justify-between bg-white rounded-2xl p-5 sm:p-6 border border-[#EAEAE6] shadow-[0_2px_8px_rgba(0,0,0,0.025)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.04)] hover:-translate-y-[2px] hover:border-[#087F5B]/35 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#087F5B] focus-visible:ring-offset-2 transition-all duration-200 ease-out"
    >
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold tracking-wider uppercase text-[#171717] truncate group-hover:text-[#087F5B] transition-colors">
              {fund.name}
            </h3>
            {fund.description ? (
              <p className="text-xs text-neutral-500 mt-0.5 line-clamp-1">
                {fund.description}
              </p>
            ) : (
              <p className="text-xs text-neutral-400 mt-0.5 italic">
                Shared fund
              </p>
            )}
          </div>
          <span className="shrink-0 text-neutral-400 group-hover:text-[#087F5B] group-hover:translate-x-0.5 transition-all text-sm font-medium mt-0.5">
            →
          </span>
        </div>

        <div className="my-5">
          <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#171717]">
            {currencySymbol}{balance.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] font-medium uppercase tracking-wider text-neutral-400 mt-0.5">
            current balance
          </div>
        </div>
      </div>

      <div className="pt-3.5 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500 font-medium">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <span>
            Collected <span className="text-neutral-800 font-semibold">{currencySymbol}{totalContributed.toLocaleString('en-IN')}</span>
          </span>
          <span className="text-neutral-300">•</span>
          <span>
            Spent <span className="text-neutral-800 font-semibold">{currencySymbol}{totalSpent.toLocaleString('en-IN')}</span>
          </span>
        </div>
        <span className="text-neutral-400 font-medium text-[11px] shrink-0">
          {memberCount} {memberCount === 1 ? 'member' : 'members'}
        </span>
      </div>
    </Link>
  );
};
