import React, { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import type { User, Fund } from '../types/models';
import { useMockData } from '../hooks/useMockData';

interface MockDataContextProps {
  user: User;
  funds: Fund[];
  addFund: (fund: Omit<Fund, 'id' | 'members' | 'contributions' | 'expenses'>) => string;
}

const MockDataContext = createContext<MockDataContextProps | undefined>(undefined);

export const MockDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, funds, addFund } = useMockData();
  return (
    <MockDataContext.Provider value={{ user, funds, addFund }}>
      {children}
    </MockDataContext.Provider>
  );
};

export const useMockDataContext = () => {
  const ctx = useContext(MockDataContext);
  if (!ctx) {
    throw new Error('useMockDataContext must be used within MockDataProvider');
  }
  return ctx;
};
