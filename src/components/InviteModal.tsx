import React, { useState } from 'react';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  inviteCode: string;
  fundName: string;
}

export const InviteModal: React.FC<InviteModalProps> = ({ isOpen, onClose, inviteCode, fundName }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;
  const inviteLink = `${window.location.origin}/join/${inviteCode}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy', e);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl border border-gray-100" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-4 text-[#171717]">Invite to {fundName}</h2>
        <div className="mb-4">
          <label className="block text-sm font-semibold text-[#171717] mb-1">
            Link:
          </label>
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg break-all font-mono text-xs text-gray-800 select-all">
            {inviteLink}
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={copyToClipboard}
            className="flex-1 bg-[#087F5B] hover:bg-[#087F5B]/90 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors text-sm"
          >
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 px-4 rounded-lg transition-colors text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
