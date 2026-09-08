import React from 'react';
interface ProgressBarProps {
  progress: number; // 0-100
  target?: number;
}
export const ProgressBar: React.FC<ProgressBarProps> = ({ progress }) => (
  <div className="w-full bg-surface-light rounded-full h-3 overflow-hidden">
    <div className="bg-primary h-3" style={{ width: `${progress}%` }} />
  </div>
);
