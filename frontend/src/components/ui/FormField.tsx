import React from 'react';

export interface FormFieldProps {
  label: string;
  htmlFor?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  htmlFor,
  error,
  required,
  children,
  className = '',
}) => {
  const errorId = htmlFor ? `${htmlFor}-error` : undefined;

  return (
    <div className={`form-field ${error ? 'form-field-error' : ''} ${className}`.trim()}>
      <label htmlFor={htmlFor} className="form-label">
        {label}
        {required && <span className="form-required" aria-hidden="true"> *</span>}
      </label>
      {children}
      {error && (
        <p id={errorId} className="form-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

export default FormField;
