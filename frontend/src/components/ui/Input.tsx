import React, { forwardRef } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helpText?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helpText, id, className = '', ...rest }, ref) => {
    const inputId = id ?? `input-${label.toLowerCase().replace(/\s+/g, '-')}`;
    const errorId = `${inputId}-error`;
    const helpId = `${inputId}-help`;

    return (
      <div className={`form-group ${error ? 'form-group-error' : ''} ${className}`.trim()}>
        <label htmlFor={inputId} className="form-label">
          {label}
          {rest.required && <span className="form-required" aria-hidden="true"> *</span>}
        </label>
        <input
          ref={ref}
          id={inputId}
          className="form-input"
          aria-invalid={!!error || undefined}
          aria-describedby={
            [error ? errorId : '', helpText ? helpId : ''].filter(Boolean).join(' ') || undefined
          }
          {...rest}
        />
        {error && (
          <p id={errorId} className="form-error" role="alert">
            {error}
          </p>
        )}
        {helpText && !error && (
          <p id={helpId} className="form-help">
            {helpText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
