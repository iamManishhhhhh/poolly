import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, icon }) => (
  <div className="bg-surface-light text-[#171717] p-4 rounded-lg flex items-center space-x-3">
    {icon && <div className="text-primary text-2xl">{icon}</div>}
    <div>
      <div className="text-sm text-gray-400">{label}</div>
      <div className="text-xl font-semibold">{value}</div>
    </div>
  </div>
);
