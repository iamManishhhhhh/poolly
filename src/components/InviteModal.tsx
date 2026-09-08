import React from 'react';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  inviteCode: string;
  fundName: string;
}

export const InviteModal: React.FC<InviteModalProps> = ({ isOpen, onClose, inviteCode, fundName }) => {
  if (!isOpen) return null;
  const inviteLink = `${window.location.origin}/join/${inviteCode}`;
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
    } catch (e) {
      console.error('Failed to copy', e);
    }
  };
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50" onClick={onClose}>
      <div className="bg-background rounded-lg p-6 w-96 text-white" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-medium mb-4">Invite to {fundName}</h2>
        <p className="mb-2 break-all">
          <span className="font-medium">Link:</span> {inviteLink}
        </p>
        <div className="flex gap-2 mt-4">
          <button
            onClick={copyToClipboard}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
          >
            Copy Link
          </button>
          <button onClick={onClose} className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
