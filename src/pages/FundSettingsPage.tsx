
import { useParams, Link } from 'react-router-dom';
import { useMockDataContext } from '../contexts/MockDataContext';

export default function FundSettingsPage() {
  const { fundId } = useParams();
  const { funds } = useMockDataContext();
  const fund = funds.find((f) => f.id === fundId);

  if (!fund) {
    return (
      <div className="p-6 bg-background text-white min-h-screen">
        <p className="text-red-500">Fund not found.</p>
        <Link to="/dashboard" className="text-primary underline">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-white p-6">
      <h1 className="text-2xl font-bold mb-4 text-primary">
        Settings for {fund.name}
      </h1>
      <p className="mb-4">
        {/* Placeholder settings UI – can be expanded later */}
        This is where fund configuration (e.g., name, target amount, members) would be edited.
      </p>
      <Link to={`/funds/${fund.id}`} className="text-primary underline">
        Back to Fund
      </Link>
    </div>
  );
}
