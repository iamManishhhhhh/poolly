
import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import UserDashboard from './pages/UserDashboard';
import FundDashboard from './pages/FundDashboard';
import CreateFundPage from './pages/CreateFundPage';
import ContributionsPage from './pages/ContributionsPage';
import ExpensesPage from './pages/ExpensesPage';
import LedgerPage from './pages/LedgerPage';
import MembersPage from './pages/MembersPage';
import FundSettingsPage from './pages/FundSettingsPage';
import { Navbar } from './components/Navbar';
import { PrivateRoute } from './components/PrivateRoute';

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth/*" element={<AuthPage />} />
        <Route path="/dashboard" element={<PrivateRoute><UserDashboard /></PrivateRoute>} />
        <Route path="/funds/create" element={<CreateFundPage />} />
        <Route path="/funds/:fundId" element={<FundDashboard />} />
        <Route path="/funds/:fundId/contributions" element={<ContributionsPage />} />
        <Route path="/funds/:fundId/expenses" element={<ExpensesPage />} />
        <Route path="/funds/:fundId/ledger" element={<LedgerPage />} />
        <Route path="/funds/:fundId/members" element={<MembersPage />} />
        <Route path="/funds/:fundId/settings" element={<FundSettingsPage />} />
      </Routes>
    </>
  );
}
