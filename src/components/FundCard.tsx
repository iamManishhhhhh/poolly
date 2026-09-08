import type { Fund } from '../types/models';
import { Link } from 'react-router-dom';

interface FundCardProps {
  fund: Fund;
}

export const FundCard: React.FC<FundCardProps> = ({ fund }) => {
  const totalContributed = fund.contributions?.reduce((sum, c) => sum + c.amount, 0) ?? 0;
  const totalSpent = fund.expenses?.reduce((sum, e) => sum + e.amount, 0) ?? 0;
  const balance = totalContributed - totalSpent;
  return (
    <Link to={`/funds/${fund.id}`} className="block bg-surface-light text-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
      <h3 className="text-lg font-medium mb-2">{fund.name}</h3>
      <p className="text-sm text-gray-400 mb-2">{fund.description}</p>
      <div className="flex justify-between text-sm">
        <span>Collected: ₹{totalContributed}</span>
        <span>Spent: ₹{totalSpent}</span>
        <span>Balance: ₹{balance}</span>
      </div>
    </Link>
  );
};
