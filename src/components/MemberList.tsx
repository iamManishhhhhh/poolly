import React from 'react';
import type { FundMember } from '../types/models';

interface MemberListProps {
  members: FundMember[];
  ownerId?: string;
  currentUserId?: string;
}

export const MemberList: React.FC<MemberListProps> = ({ members, ownerId, currentUserId }) => {
  // Ensure the owner is at the top, then sort by joined date or ID
  const sortedMembers = [...members].sort((a, b) => {
    if (a.userId === ownerId) return -1;
    if (b.userId === ownerId) return 1;
    return a.joinedAt > b.joinedAt ? 1 : -1;
  });

  return (
    <div className="space-y-3 mt-4">
      <h2 className="text-xl font-semibold text-[#171717]">Members ({members.length})</h2>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100">
        {sortedMembers.map((member) => {
          const isOwner = member.userId === ownerId;
          const isMe = member.userId === currentUserId;
          const shortId = member.userId ? `${member.userId.substring(0, 8)}...` : 'Unknown';
          const joinedDate = member.joinedAt ? new Date(member.joinedAt).toLocaleDateString() : 'Unknown date';

          return (
            <div key={member.userId} className="flex items-center justify-between p-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-[#171717]">
                    User {shortId}
                  </span>
                  {isMe && (
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                      You
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  Joined: {joinedDate}
                </div>
              </div>
              <div>
                {isOwner ? (
                  <span className="px-2.5 py-1 bg-[#087F5B] text-white rounded-full text-xs font-semibold">
                    Owner
                  </span>
                ) : (
                  <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                    Member
                  </span>
                )}
              </div>
            </div>
          );
        })}
        {members.length === 0 && (
          <div className="p-4 text-gray-500 italic text-sm text-center">
            No members found.
          </div>
        )}
      </div>
    </div>
  );
};
