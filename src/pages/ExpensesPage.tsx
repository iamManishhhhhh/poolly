import type { Fund } from '../types/models';
import { useParams, Link } from 'react-router-dom';
import { useMockDataContext } from '../contexts/MockDataContext';
import { Button } from '../components/Button';

export default function ExpensesPage() {
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

  return (
    <div className="min-h-screen bg-background text-white p-6">
      <h1 className="text-2xl font-bold mb-4 text-primary">Expenses for {fund.name}</h1>
      <div className="space-y-4">
        {fund.expenses && fund.expenses.length > 0 ? (
          fund.expenses.map(e => (
            <div key={e.id} className="bg-surface-light p-3 rounded-md shadow">
              <p>Name: {e.name}</p>
              <p>Amount: ₹{e.amount}</p>
              <p>Category: {e.category}</p>
              <p>Date: {e.date}</p>
              <p>Status: {e.status}</p>
            </div>
          ))
        ) : (
          <p>No expenses recorded.</p>
        )}
      </div>
      <div className="mt-6">
        <Button variant="primary" className="mr-2" onClick={() => { /* mock add */ }}>
          Add Expense
        </Button>
        <Link to={`/funds/${fund.id}`} className="text-primary underline ml-4">
          Back to Fund
        </Link>
      </div>
    </div>
  );
}
