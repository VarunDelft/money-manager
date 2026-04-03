import React from 'react';

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  label = 'Loading...',
}) => {
  return (
    <div className={`spinner spinner-${size}`} role="status" aria-label={label}>
      <span className="spinner-visual" aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </div>
  );
};

export default LoadingSpinner;
