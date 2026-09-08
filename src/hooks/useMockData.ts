import { useState, useEffect } from 'react';
import type { User, Fund, Contribution, Expense } from '../types/models';

// Helper to generate IDs
const uid = () => Math.random().toString(36).substr(2, 9);

export function useMockData() {
  const [user] = useState<User>({
    id: 'u1',
    name: 'Manish Kumar',
    email: 'manish@example.com',
    avatarUrl: '',
  });

  const [funds, setFunds] = useState<Fund[]>([]);

  // Populate initial mock fund with contributions & expenses
  useEffect(() => {
    const initialFund: Fund = {
      id: 'f1',
      name: 'Manali Camping',
      description: 'Trip to Manali with friends',
      category: 'Travel',
      targetAmount: 20000,
      suggestedContribution: undefined,
      startDate: '2024-01-01',
      endDate: undefined,
      currency: 'INR',
      members: [],
      contributions: [],
      expenses: [],
    };

    const contributions: Contribution[] = [
      { id: uid(), fundId: 'f1', contributorId: 'u2', amount: 3000, date: '2024-01-02T10:00:00Z', status: 'completed', note: '' },
      { id: uid(), fundId: 'f1', contributorId: 'u3', amount: 2000, date: '2024-01-03T12:00:00Z', status: 'completed', note: '' },
      { id: uid(), fundId: 'f1', contributorId: 'u4', amount: 1500, date: '2024-01-04T09:30:00Z', status: 'completed', note: '' },
      { id: uid(), fundId: 'f1', contributorId: 'u5', amount: 4000, date: '2024-01-05T14:20:00Z', status: 'completed', note: '' },
    ];

    const expenses: Expense[] = [
      { id: uid(), fundId: 'f1', addedById: 'u2', name: 'Campsite', amount: 6200, vendor: 'Campsite Ltd', category: 'Accommodation', date: '2024-01-06', receiptUrl: '', status: 'approved' },
      { id: uid(), fundId: 'f1', addedById: 'u3', name: 'Transport', amount: 7500, vendor: 'TravelCo', category: 'Travel', date: '2024-01-07', receiptUrl: '', status: 'approved' },
      { id: uid(), fundId: 'f1', addedById: 'u4', name: 'Food', amount: 3700, vendor: 'Foodies', category: 'Food', date: '2024-01-08', receiptUrl: '', status: 'approved' },
      { id: uid(), fundId: 'f1', addedById: 'u5', name: 'Activities', amount: 2300, vendor: 'Adventure Ltd', category: 'Activities', date: '2024-01-09', receiptUrl: '', status: 'approved' },
    ];

    const memberIds = new Set(contributions.map(c => c.contributorId).concat(expenses.map(e => e.addedById)));
    const members = Array.from(memberIds).map(id => ({
      userId: id,
      role: 'member' as const,
      joinedAt: new Date().toISOString(),
      totalContributed: contributions.filter(c => c.contributorId === id).reduce((a, c) => a + c.amount, 0)
    } as import('../types/models').FundMember));

    initialFund.contributions = contributions;
    initialFund.expenses = expenses;
    initialFund.members = members;

    setFunds([initialFund]);
  }, []);

  // Helper to add a new fund (used by Create Fund page)
  const addFund = (fund: Omit<Fund, 'id' | 'members' | 'contributions' | 'expenses'>) => {
    const newFund: Fund = { ...fund, id: uid(), members: [], contributions: [], expenses: [] };
    setFunds(prev => [...prev, newFund]);
    return newFund.id;
  };

  return { user, funds, addFund };
}
