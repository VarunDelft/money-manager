import React, { forwardRef } from 'react';

export interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  helpText?: string;
}

const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, error, helpText, id, className = '', ...rest }, ref) => {
    const textareaId = id ?? `textarea-${label.toLowerCase().replace(/\s+/g, '-')}`;
    const errorId = `${textareaId}-error`;
    const helpId = `${textareaId}-help`;

    return (
      <div className={`form-group ${error ? 'form-group-error' : ''} ${className}`.trim()}>
        <label htmlFor={textareaId} className="form-label">
          {label}
          {rest.required && <span className="form-required" aria-hidden="true"> *</span>}
        </label>
        <textarea
          ref={ref}
          id={textareaId}
          className="form-textarea"
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

TextArea.displayName = 'TextArea';

export default TextArea;
