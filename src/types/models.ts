export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export interface Fund {
  id: string;
  name: string;
  description?: string;
  category?: string;
  targetAmount?: number;
  suggestedContribution?: number;
  startDate: string;
  endDate?: string;
  currency: string;
  ownerId?: string;
  members: FundMember[];
  contributions: Contribution[];
  expenses: Expense[];
}

export interface FundMember {
  userId: string;
  role: 'admin' | 'member';
  joinedAt: string;
  totalContributed: number;
}

export interface Contribution {
  id: string;
  fundId: string;
  contributorId: string;
  amount: number;
  date: string;
  status: 'pending' | 'completed';
  note?: string;
}

export interface Expense {
  id: string;
  fundId: string;
  addedById: string;
  name: string;
  amount: number;
  vendor?: string;
  category?: string;
  date: string;
  receiptUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface Transaction {
  id: string;
  fundId: string;
  type: 'contribution' | 'expense';
  amount: number;
  party: string;
  date: string;
  status: string;
  referenceId: string;
}

export interface Invite {
  id: string;
  fund_id: string;
  code: string;
  created_at: string;
  created_by: string;
}

