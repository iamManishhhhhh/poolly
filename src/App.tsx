
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
import JoinFundPage from './pages/JoinFundPage';
import { Navbar } from './components/Navbar';
import { PrivateRoute } from './components/PrivateRoute';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth/*" element={<AuthPage />} />
        <Route path="/dashboard" element={<PrivateRoute><UserDashboard /></PrivateRoute>} />
        <Route path="/funds/create" element={<PrivateRoute><CreateFundPage /></PrivateRoute>} />
        <Route path="/funds/:fundId" element={<PrivateRoute><FundDashboard /></PrivateRoute>} />
        <Route path="/funds/:fundId/contributions" element={<PrivateRoute><ContributionsPage /></PrivateRoute>} />
        <Route path="/funds/:fundId/expenses" element={<PrivateRoute><ExpensesPage /></PrivateRoute>} />
        <Route path="/funds/:fundId/ledger" element={<PrivateRoute><LedgerPage /></PrivateRoute>} />
        <Route path="/funds/:fundId/members" element={<PrivateRoute><MembersPage /></PrivateRoute>} />
        <Route path="/funds/:fundId/settings" element={<PrivateRoute><FundSettingsPage /></PrivateRoute>} />
        <Route path="/join" element={<PrivateRoute><JoinFundPage /></PrivateRoute>} />
        <Route path="/join/:code" element={<PrivateRoute><JoinFundPage /></PrivateRoute>} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}
