import React from 'react';
import type { FundMember } from '../types/models';

interface MemberListProps {
  members: FundMember[];
  ownerId?: string;
  currentUserId?: string;
}

export const MemberList: React.FC<MemberListProps> = ({ members = [], ownerId, currentUserId }) => {
  // Ensure the owner is at the top, then sort by joined date or ID
  const sortedMembers = [...members].sort((a, b) => {
    if (a.userId === ownerId) return -1;
    if (b.userId === ownerId) return 1;
    return (a.joinedAt || '') > (b.joinedAt || '') ? 1 : -1;
  });

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return null;
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return null;
    }
  };

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#EAEAE6] shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
          Members ({members.length})
        </h2>
      </div>

      <div className="divide-y divide-neutral-100 max-h-[560px] overflow-y-auto">
        {sortedMembers.map((member) => {
          const isOwner = member.userId === ownerId;
          const isMe = member.userId === currentUserId;
          const shortId = member.userId ? `${member.userId.substring(0, 6)}...` : 'Unknown';
          const joinedFormatted = formatDate(member.joinedAt);

          return (
            <div
              key={member.userId}
              className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3 group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-emerald-50 text-[#087F5B] text-xs font-bold flex items-center justify-center shrink-0 border border-emerald-100/60">
                  {shortId.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-neutral-800 truncate">
                      User {shortId}
                    </span>
                    {isMe && (
                      <span className="px-1.5 py-0.2 rounded-md bg-neutral-100 text-neutral-600 text-[10px] font-semibold">
                        You
                      </span>
                    )}
                  </div>
                  {joinedFormatted && (
                    <p className="text-[11px] text-neutral-400 mt-0.5 truncate">
                      Joined {joinedFormatted}
                    </p>
                  )}
                </div>
              </div>

              <div className="shrink-0">
                {isOwner ? (
                  <span className="px-2 py-0.5 bg-emerald-50 text-[#087F5B] border border-emerald-200/60 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    Owner
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-neutral-50 text-neutral-500 border border-neutral-200/60 rounded-full text-[10px] font-medium uppercase tracking-wider">
                    Member
                  </span>
                )}
              </div>
            </div>
          );
        })}
        {members.length === 0 && (
          <div className="py-6 text-neutral-400 italic text-xs text-center">
            No members found.
          </div>
        )}
      </div>
    </div>
  );
};
