import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { FundHeader } from '../components/FundHeader';

export default function JoinFundPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [invite, setInvite] = useState<any>(null);
  const [fund, setFund] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      if (!code) return;
      const { data: inviteData, error: inviteError } = await supabase
        .from('fund_invites')
        .select('*, fund_id')
        .eq('code', code)
        .single();
      if (inviteError || !inviteData) {
        setError('Invalid or expired invite code');
        setLoading(false);
        return;
      }
      setInvite(inviteData);
      const { data: fundData, error: fundError } = await supabase
        .from('funds')
        .select('*, members(*), contributions(*), expenses(*)')
        .eq('id', inviteData.fund_id)
        .single();
      if (fundError || !fundData) {
        setError('Unable to load fund');
        setLoading(false);
        return;
      }
      setFund(fundData);
      setLoading(false);
    };
    fetch();
  }, [code]);

  const handleJoin = async () => {
    if (!user || !invite) return;
    setJoining(true);
    setError(null);
    const { error: insertError } = await supabase.from('fund_members').insert([
      {
        fund_id: invite.fund_id,
        user_id: user.id,
        role: 'member',
        joined_at: new Date().toISOString(),
      },
    ]);
    if (insertError) {
      if (insertError.message.includes('duplicate') || insertError.code === '23505') {
        setError('You are already a member of this fund');
      } else {
        setError(insertError.message);
      }
    } else {
      setSuccess(true);
      setTimeout(() => navigate(`/funds/${invite.fund_id}`), 1500);
    }
    setJoining(false);
  };

  if (loading) {
    return <div className="p-6 bg-background min-h-screen text-primary">Loading invite...</div>;
  }

  if (error) {
    return (
      <div className="p-6 bg-background min-h-screen text-white">
        <p className="text-red-500 mb-4">{error}</p>
        <Link to="/dashboard" className="text-primary underline">Back to Dashboard</Link>
      </div>
    );
  }

  if (!fund) return null;

  const totalCollected = fund.contributions?.reduce((sum: number, c: any) => sum + c.amount, 0) ?? 0;
  const totalSpent = fund.expenses?.reduce((sum: number, e: any) => sum + e.amount, 0) ?? 0;
  const balance = totalCollected - totalSpent;

  return (
    <div className="min-h-screen bg-background text-white p-6">
      <FundHeader fund={fund} totalCollected={totalCollected} totalSpent={totalSpent} balance={balance} />
      {success ? (
        <p className="text-green-500 mt-4">Successfully joined the fund! Redirecting...</p>
      ) : (
        <button
          onClick={handleJoin}
          disabled={joining}
          className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded"
        >
          {joining ? 'Joining...' : 'Join Fund'}
        </button>
      )}
      {error && !success && <p className="text-red-500 mt-2">{error}</p>}
    </div>
  );
}
