import { Link } from 'react-router-dom';
import { Button } from '../components/Button';



export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#FAFAF8] text-[#171717]">
      {/* Main content wrapper */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 max-w-3xl mx-auto text-center space-y-8">
        {/* Hero */}
        <h1 className="text-4xl md:text-5xl font-bold leading-tight">
          Shared money.<br />Simple. Transparent. Together.
        </h1>
        <p className="text-lg md:text-xl text-[#6B7280] max-w-xl mx-auto">
          Create a shared fund, collect contributions, track expenses, and always know where the money goes.
        </p>
        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/funds/create">
            <Button variant="primary">Create a Fund</Button>
          </Link>
          <Link to="/auth/login">
            <Button variant="secondary">Join a Fund</Button>
          </Link>
        </div>
        {/* Feature section */}
        <div className="flex flex-col md:flex-row md:justify-center md:divide-x md:divide-[#E7E7E3] w-full">
          <div className="px-4 py-8 text-center md:px-8">
            <h3 className="font-medium mb-2 text-[#171717]">Collect</h3>
            <p className="text-sm text-[#6B7280]">Invite members and collect contributions</p>
          </div>
          <div className="px-4 py-8 text-center md:px-8">
            <h3 className="font-medium mb-2 text-[#171717]">Spend</h3>
            <p className="text-sm text-[#6B7280]">Record expenses and receipts</p>
          </div>
          <div className="px-4 py-8 text-center md:px-8">
            <h3 className="font-medium mb-2 text-[#171717]">Track</h3>
            <p className="text-sm text-[#6B7280]">See the live balance and transaction history</p>
          </div>
        </div>
      </div>
    </div>
  );
}
