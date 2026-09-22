import React, { useState, useEffect, useCallback } from 'react';

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

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 sm:p-6"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="bg-white rounded-2xl p-6 sm:p-7 w-full max-w-md shadow-xl border border-[#EAEAE6] relative max-h-full overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-2">
          <div>
            <h2 id="modal-title" className="text-lg sm:text-xl font-bold text-[#171717]">
              Invite to this fund
            </h2>
            <p className="text-sm text-neutral-500 mt-1">
              Share the invite with friends or family to let them join this fund.
            </p>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors text-lg leading-none shrink-0 ml-4"
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        {/* Trust Context Banner */}
        <div className="mt-5 mb-6 p-4 rounded-xl bg-[#087F5B]/5 border border-[#087F5B]/10">
          <p className="text-xs uppercase tracking-wider font-bold text-[#087F5B]/70 mb-0.5">
            Invite to
          </p>
          <p className="text-base font-bold text-[#087F5B] truncate">
            {fundName}
          </p>
          <p className="text-xs text-neutral-600 mt-2">
            Anyone with this invite can join this shared fund.
          </p>
        </div>

        {generateError ? (
          <div className="flex items-start gap-2 bg-rose-50 border border-rose-200/80 rounded-xl p-3 text-sm text-rose-700 mb-6">
            <span className="font-bold text-rose-500 shrink-0">!</span>
            <div>
              <p className="font-medium">Failed to generate invite</p>
              <p className="text-xs mt-0.5">{generateError}</p>
            </div>
          </div>
        ) : isExpired ? (
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200/80 rounded-xl p-3 text-sm text-amber-800 mb-6">
            <span className="font-bold text-amber-500 shrink-0">!</span>
            <div>
              <p className="font-medium">This invite has expired.</p>
              <p className="text-xs mt-0.5">Generate a new one to invite members.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Shareable Link */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-2">
                Shareable Link
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 px-3.5 py-3 bg-neutral-50/80 border border-neutral-200/80 rounded-xl text-sm font-mono text-[#171717] truncate select-all">
                  {inviteLink}
                </div>
                <button
                  onClick={() => copyToClipboard(inviteLink, 'link')}
                  className={`shrink-0 flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all active:scale-95 ${
                    copiedLink
                      ? 'bg-[#087F5B] text-white shadow-sm'
                      : 'bg-neutral-100 hover:bg-neutral-200/80 text-neutral-700'
                  }`}
                >
                  {copiedLink ? (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                      <span>Copied</span>
                    </>
                  ) : (
                    <span>Copy</span>
                  )}
                </button>
              </div>
            </div>

            {/* Join Code */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-2">
                Join Code
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 px-3.5 py-3 bg-neutral-50/80 border border-neutral-200/80 rounded-xl text-lg font-mono font-bold text-[#171717] tracking-widest text-center select-all">
                  {inviteCode}
                </div>
                <button
                  onClick={() => copyToClipboard(inviteCode, 'code')}
                  className={`shrink-0 flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all active:scale-95 ${
                    copiedCode
                      ? 'bg-[#087F5B] text-white shadow-sm'
                      : 'bg-neutral-100 hover:bg-neutral-200/80 text-neutral-700'
                  }`}
                >
                  {copiedCode ? (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                      <span>Copied</span>
                    </>
                  ) : (
                    <span>Copy</span>
                  )}
                </button>
              </div>
            </div>

            {/* Expiry badge */}
            {expiresAt && !isExpired && (
              <p className="flex items-center justify-center gap-1.5 text-xs font-medium text-neutral-500 bg-neutral-50 py-2 rounded-lg border border-neutral-100">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                {formatExpiry(expiresAt)}
              </p>
            )}

            {/* Primary Actions */}
            <div className="pt-2 flex gap-3">
              {canShare ? (
                <button
                  onClick={handleShare}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#087F5B] hover:bg-[#066c4d] text-white text-sm font-semibold shadow-sm transition-all active:scale-[0.98]"
                >
                  Share Invite
                </button>
              ) : (
                <button
                  onClick={handleClose}
                  className="flex-1 py-3 px-4 rounded-xl bg-[#087F5B] hover:bg-[#066c4d] text-white text-sm font-semibold shadow-sm transition-all active:scale-[0.98]"
                >
                  Done
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

