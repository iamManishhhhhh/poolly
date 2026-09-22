import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { Input } from '../components/Input';
import { Button } from '../components/Button';

export default function FundSettingsPage() {
  const { fundId } = useParams<{ fundId: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fund data
  const [isOwner, setIsOwner] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [fundName, setFundName] = useState('');
  
  // Form fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currency, setCurrency] = useState('INR');
  
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [leaveLoading, setLeaveLoading] = useState(false);
  const [hasTransactions, setHasTransactions] = useState(false);

  const fetchFund = useCallback(async () => {
    if (!fundId || !user) return;
    setLoading(true);
    setError(null);

    const { data: fundData, error: fundError } = await supabase
      .from('funds')
      .select('id, name, description, target_amount, start_date, end_date, currency, owner_id')
      .eq('id', fundId)
      .maybeSingle();

    if (fundError || !fundData) {
      setError('Fund not found or you do not have permission.');
      setLoading(false);
      return;
    }

    const isFundOwner = fundData.owner_id === user.id;
    setIsOwner(isFundOwner);
    setFundName(fundData.name);
    
    setName(fundData.name || '');
    setDescription(fundData.description || '');
    setTargetAmount(fundData.target_amount ? fundData.target_amount.toString() : '');
    setStartDate(fundData.start_date || '');
    setEndDate(fundData.end_date || '');
    setCurrency(fundData.currency || 'INR');

    // Check if the fund has any contributions or expenses (transaction history)
    const [{ count: contribCount }, { count: expenseCount }] = await Promise.all([
      supabase
        .from('contributions')
        .select('id', { count: 'exact', head: true })
        .eq('fund_id', fundId),
      supabase
        .from('expenses')
        .select('id', { count: 'exact', head: true })
        .eq('fund_id', fundId),
    ]);
    setHasTransactions((contribCount ?? 0) > 0 || (expenseCount ?? 0) > 0);

    if (!isFundOwner) {
      const { data: memberData } = await supabase
        .from('fund_members')
        .select('user_id')
        .eq('fund_id', fundId)
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (memberData) {
        setIsMember(true);
      } else {
        setError('Fund not found or you do not have permission.');
      }
    }
    
    setLoading(false);
  }, [fundId, user]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchFund();
    } else if (!authLoading && !user) {
      navigate('/auth/login', { replace: true });
    }
  }, [authLoading, user, fetchFund, navigate]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwner || !fundId) return;
    
    setError(null);
    setSaveSuccess(false);
    
    if (!name.trim() || !startDate || !currency.trim()) {
      setError('Fund name, start date and currency are required.');
      return;
    }
    
    if (targetAmount && (isNaN(Number(targetAmount)) || Number(targetAmount) <= 0)) {
      setError('Target amount must be a positive number.');
      return;
    }

    setSaveLoading(true);
    
    const { error: updateError } = await supabase
      .from('funds')
      .update({
        name: name.trim(),
        description: description.trim() || null,
        target_amount: targetAmount ? Number(targetAmount) : null,
        start_date: startDate,
        end_date: endDate || null,
        currency: currency.trim()
      })
      .eq('id', fundId);

    setSaveLoading(false);
    
    if (updateError) {
      setError(updateError.message);
    } else {
      setSaveSuccess(true);
      setFundName(name.trim());
    }
  };

  const handleDelete = async () => {
    if (!isOwner || !fundId) return;
    if (hasTransactions) {
      setError("This fund can't be deleted because it has transaction history.");
      return;
    }
    const confirmed = window.confirm('Delete this unused fund?\nThis fund has no contributions or expenses. Deleting it will permanently remove the fund and its related members/invites.');
    if (!confirmed) return;
    
    setDeleteLoading(true);
    const { error: deleteError } = await supabase
      .from('funds')
      .delete()
      .eq('id', fundId);
    
    if (deleteError) {
      setError(deleteError.message);
      setDeleteLoading(false);
    } else {
      navigate('/dashboard', { replace: true });
    }
  };

  const handleLeave = async () => {
    if (isOwner || !isMember || !fundId || !user) return;
    const confirmed = window.confirm('Are you sure you want to leave this fund?');
    if (!confirmed) return;
    
    setLeaveLoading(true);
    const { error: leaveError } = await supabase
      .from('fund_members')
      .delete()
      .eq('fund_id', fundId)
      .eq('user_id', user.id);
      
    if (leaveError) {
      setError(leaveError.message);
      setLeaveLoading(false);
    } else {
      navigate('/dashboard', { replace: true });
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8]">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#087F5B] mx-auto"></div>
        </div>
      </div>
    );
  }

  if (error && !isOwner && !isMember) {
    return (
      <div className="p-6 bg-[#FAFAF8] text-[#171717] min-h-screen max-w-3xl mx-auto mt-8">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center">
          <p className="text-red-600 mb-4 font-medium">{error}</p>
          <Link to="/dashboard" className="text-[#087F5B] hover:underline font-medium">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto mt-8 p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#171717]">Settings: {fundName}</h1>
        <Link to={`/funds/${fundId}`} className="text-[#087F5B] hover:underline font-medium">
          ← Back to Fund
        </Link>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {isOwner && (
        <>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
            <h2 className="text-xl font-semibold mb-6 text-[#171717]">Edit Fund Details</h2>
            <form onSubmit={handleUpdate} className="space-y-4">
              <Input
                label="Fund Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <Input
                label="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Target Amount"
                  type="number"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                />
                <Input
                  label="Currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Start Date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
                <Input
                  label="End Date (optional)"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              
              <div className="pt-4 flex items-center justify-end space-x-4">
                {saveSuccess && <span className="text-[#087F5B] text-sm font-medium">Settings saved successfully!</span>}
                <Button type="submit" variant="primary" disabled={saveLoading}>
                  {saveLoading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>

          <div className="bg-red-50 rounded-xl shadow-sm border border-red-100 p-6">
            <h2 className="text-xl font-semibold mb-2 text-red-700">Danger Zone</h2>
            {hasTransactions ? (
              <p className="text-sm text-red-600 mb-6">
                This fund can't be deleted because it has transaction history.
              </p>
            ) : (
              <p className="text-sm text-red-600 mb-6">
                This fund has no contributions or expenses. Deleting it will permanently remove the fund and its related members/invites. This action cannot be undone.
              </p>
            )}
            <Button 
              variant="secondary" 
              onClick={handleDelete}
              disabled={deleteLoading || hasTransactions}
              className="border-red-600 text-red-600 hover:bg-red-50"
            >
              {deleteLoading ? 'Deleting...' : 'Delete Fund'}
            </Button>
          </div>
        </>
      )}

      {isMember && !isOwner && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold mb-2 text-[#171717]">Leave Fund</h2>
          <p className="text-sm text-gray-600 mb-6">
            Are you sure you want to leave this fund? You will lose access to its details and transactions.
          </p>
          <Button 
            variant="secondary" 
            onClick={handleLeave}
            disabled={leaveLoading}
            className="border-red-600 text-red-600 hover:bg-red-50"
          >
            {leaveLoading ? 'Leaving...' : 'Leave Fund'}
          </Button>
        </div>
      )}
    </div>
  );
}
