import React from 'react';

interface ProgressBarProps {
  progress: number; // 0-100
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  className?: string;
  progressColor?: string;
  trackColor?: string;
  height?: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  onClick,
  className = '',
  progressColor = 'bg-primary',
  trackColor = 'bg-gray-200 dark:bg-gray-700',
  height = 4
}) => {
  // 确保进度在0-100之间
  const safeProgress = Math.min(Math.max(0, progress), 100);
  
  return (
    <div 
      className={`w-full rounded-full overflow-hidden cursor-pointer ${trackColor} ${className}`}
      style={{ height: `${height}px` }}
      onClick={onClick}
    >
      <div 
        className={`h-full ${progressColor} transition-all duration-100`}
        style={{ width: `${safeProgress}%` }}
      />
    </div>
  );
};

export default ProgressBar; 