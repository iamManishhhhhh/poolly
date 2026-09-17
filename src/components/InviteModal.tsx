import React, { useState } from 'react';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  inviteCode: string;
  fundName: string;
  /** ISO string for when this invite expires */
  expiresAt?: string;
  /** Error message if invite generation failed */
  generateError?: string | null;
}

export const InviteModal: React.FC<InviteModalProps> = ({
  isOpen,
  onClose,
  inviteCode,
  fundName,
  expiresAt,
  generateError,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen) return null;

  const inviteLink = `${window.location.origin}/join/${inviteCode}`;

  const copyToClipboard = async (text: string, which: 'link' | 'code') => {
    try {
      await navigator.clipboard.writeText(text);
      if (which === 'link') {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      } else {
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
      }
    } catch (e) {
      console.error('Failed to copy', e);
    }
  };

  const canShare =
    typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const handleShare = async () => {
    if (!canShare) return;
    try {
      await navigator.share({
        title: `Join ${fundName} on Poolly`,
        text: `Use this link to join the fund "${fundName}" on Poolly.`,
        url: inviteLink,
      });
    } catch {
      // User cancelled or share failed – silently ignore
    }
  };

  const formatExpiry = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = d.getTime() - now.getTime();
    if (diffMs <= 0) return 'Expired';
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 1) return 'Expires in 1 day';
    return `Expires in ${diffDays} days`;
  };

  const isExpired = expiresAt && new Date(expiresAt) <= new Date();

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl border border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-[#171717]">Invite to {fundName}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {generateError ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-700 text-sm font-medium">Failed to generate invite</p>
            <p className="text-red-600 text-sm mt-1">{generateError}</p>
          </div>
        ) : isExpired ? (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
            <p className="text-amber-700 text-sm font-medium">This invite has expired.</p>
            <p className="text-amber-600 text-sm mt-1">Generate a new one to invite members.</p>
          </div>
        ) : (
          <>
            {/* Raw join code */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-[#171717] mb-1">
                Join Code
              </label>
              <div className="flex gap-2">
                <div className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-lg font-mono text-sm text-gray-800 select-all tracking-widest">
                  {inviteCode}
                </div>
                <button
                  onClick={() => copyToClipboard(inviteCode, 'code')}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
                >
                  {copiedCode ? '✓ Copied' : 'Copy Code'}
                </button>
              </div>
            </div>

            {/* Full shareable link */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-[#171717] mb-1">
                Shareable Link
              </label>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg break-all font-mono text-xs text-gray-700 select-all">
                {inviteLink}
              </div>
            </div>

            {/* Expiry badge */}
            {expiresAt && !isExpired && (
              <p className="text-xs text-gray-500 mb-4 flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
                {formatExpiry(expiresAt)}
              </p>
            )}

            {/* Action buttons */}
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={() => copyToClipboard(inviteLink, 'link')}
                className="flex-1 bg-[#087F5B] hover:bg-[#087F5B]/90 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors text-sm"
              >
                {copiedLink ? '✓ Copied!' : 'Copy Link'}
              </button>
              {canShare && (
                <button
                  onClick={handleShare}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors text-sm"
                >
                  Share…
                </button>
              )}
              <button
                onClick={onClose}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 px-4 rounded-lg transition-colors text-sm"
              >
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

