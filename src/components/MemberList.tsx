import React from 'react';
import type { FundMember } from '../types/models';


interface MemberListProps {
  members: FundMember[];
}

export const MemberList: React.FC<MemberListProps> = ({ members }) => {

  return (
    <div className="space-y-2">
      {members.map((member) => (
        <div key={member.userId} className="flex items-center justify-between p-2 bg-surface-light rounded">
          <span className="font-medium text-primary">{member.userId}</span>
          <span className="text-sm">
            {member.role === 'admin' ? (
              <span className="px-2 py-1 bg-primary text-white rounded-full text-xs">Owner</span>
            ) : (
              <span className="px-2 py-1 bg-gray-200 text-gray-800 rounded-full text-xs">Member</span>
            )}
          </span>
        </div>
      ))}
    </div>
  );
};
