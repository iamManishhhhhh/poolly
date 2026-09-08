
import { useParams, Link } from 'react-router-dom';
import { useMockDataContext } from '../contexts/MockDataContext';

export default function MembersPage() {
  const { fundId } = useParams();
  const { funds } = useMockDataContext();
  const fund = funds.find(f => f.id === fundId);

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
      <h1 className="text-2xl font-bold mb-4 text-primary">Members of {fund.name}</h1>
      <ul className="space-y-3">
        {fund.members && fund.members.length > 0 ? (
          fund.members.map(m => (
            <li key={m.userId} className="bg-surface-light p-3 rounded-md shadow">
              <p>User ID: {m.userId}</p>
              <p>Role: {m.role}</p>
              <p>Total Contributed: ₹{m.totalContributed}</p>
            </li>
          ))
        ) : (
          <p>No members yet.</p>
        )}
      </ul>
      <div className="mt-6">
        <Link to={`/funds/${fund.id}`} className="text-primary underline">Back to Fund</Link>
      </div>
    </div>
  );
}
