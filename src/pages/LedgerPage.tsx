import type { Fund } from '../types/models';
import { useParams, Link } from 'react-router-dom';
import { useMockDataContext } from '../contexts/MockDataContext';

export default function LedgerPage() {
  const { fundId } = useParams();
  const { funds } = useMockDataContext();
  const fund = funds.find((f: Fund) => f.id === fundId);

  if (!fund) {
    return (
      <div className="p-6 bg-background text-white min-h-screen">
        <p className="text-red-500">Fund not found.</p>
        <Link to="/dashboard" className="text-primary underline">Back to Dashboard</Link>
      </div>
    );
  }

  // Simple ledger merges contributions and expenses chronologically
  const transactions = [] as any[];
  fund.contributions?.forEach(c => {
    transactions.push({
      date: new Date(c.date),
      type: 'Contribution',
      party: c.contributorId,
      amount: c.amount,
      note: c.note ?? ''
    });
  });
  fund.expenses?.forEach(e => {
    transactions.push({
      date: new Date(e.date),
      type: 'Expense',
      party: e.addedById,
      amount: -e.amount,
      note: e.name
    });
  });
  transactions.sort((a, b) => a.date.getTime() - b.date.getTime());

  return (
    <div className="min-h-screen bg-background text-white p-6">
      <h1 className="text-2xl font-bold mb-4 text-primary">Ledger for {fund.name}</h1>
      <table className="w-full table-auto bg-surface-light rounded-md overflow-hidden">
        <thead className="bg-background">
          <tr className="text-left">
            <th className="px-4 py-2">Date</th>
            <th className="px-4 py-2">Type</th>
            <th className="px-4 py-2">Party</th>
            <th className="px-4 py-2">Amount</th>
            <th className="px-4 py-2">Note</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx, idx) => (
            <tr key={idx} className="border-t border-background">
              <td className="px-4 py-2">{tx.date.toLocaleDateString()}</td>
              <td className="px-4 py-2">{tx.type}</td>
              <td className="px-4 py-2">{tx.party}</td>
              <td className={`px-4 py-2 ${tx.amount >= 0 ? 'text-primary' : 'text-red-400'}`}>₹{Math.abs(tx.amount)}</td>
              <td className="px-4 py-2">{tx.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-6">
        <Link to={`/funds/${fund.id}`} className="text-primary underline">Back to Fund</Link>
      </div>
    </div>
  );
}
