import { useState, useCallback } from 'react';

export interface ValidationRule {
  required?: boolean;
  maxLength?: number;
  minLength?: number;
  min?: number;
  max?: number;
  maxDecimals?: number;
  pattern?: { value: RegExp; message: string };
  custom?: (value: unknown, values: Record<string, unknown>) => string | undefined;
}

export type ValidationRules<T extends Record<string, unknown>> = {
  [K in keyof T]?: ValidationRule;
};

export interface UseFormValidationReturn<T extends Record<string, unknown>> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  setValue: (field: keyof T, value: unknown) => void;
  setValues: (values: Partial<T>) => void;
  handleBlur: (field: keyof T) => void;
  validate: () => boolean;
  reset: (initial?: T) => void;
  isValid: boolean;
}

function validateField(
  value: unknown,
  rule: ValidationRule,
  allValues: Record<string, unknown>
): string | undefined {
  if (rule.required) {
    if (value === undefined || value === null || value === '') {
      return 'This field is required.';
    }
    if (Array.isArray(value) && value.length === 0) {
      return 'This field is required.';
    }
  }

  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const strValue = String(value);

  if (rule.maxLength !== undefined && strValue.length > rule.maxLength) {
    return `Must be at most ${rule.maxLength} characters.`;
  }

  if (rule.minLength !== undefined && strValue.length < rule.minLength) {
    return `Must be at least ${rule.minLength} characters.`;
  }

  if (rule.min !== undefined || rule.max !== undefined || rule.maxDecimals !== undefined) {
    const numValue = Number(value);
    if (isNaN(numValue)) {
      return 'Must be a valid number.';
    }
    if (rule.min !== undefined && numValue < rule.min) {
      return `Must be at least ${rule.min}.`;
    }
    if (rule.max !== undefined && numValue > rule.max) {
      return `Must be at most ${rule.max}.`;
    }
    if (rule.maxDecimals !== undefined) {
      const parts = strValue.split('.');
      if (parts[1] && parts[1].length > rule.maxDecimals) {
        return `Must have at most ${rule.maxDecimals} decimal places.`;
      }
    }
  }

  if (rule.pattern && !rule.pattern.value.test(strValue)) {
    return rule.pattern.message;
  }

  if (rule.custom) {
    return rule.custom(value, allValues);
  }

  return undefined;
}

export function useFormValidation<T extends Record<string, unknown>>(
  initialValues: T,
  rules: ValidationRules<T>
): UseFormValidationReturn<T> {
  const [values, setValuesState] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});

  const setValue = useCallback(
    (field: keyof T, value: unknown) => {
      setValuesState((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const setValues = useCallback((partial: Partial<T>) => {
    setValuesState((prev) => ({ ...prev, ...partial }));
  }, []);

  const validateSingleField = useCallback(
    (field: keyof T, currentValues: T): string | undefined => {
      const rule = rules[field];
      if (!rule) return undefined;
      return validateField(
        currentValues[field],
        rule,
        currentValues as Record<string, unknown>
      );
    },
    [rules]
  );

  const handleBlur = useCallback(
    (field: keyof T) => {
      setTouched((prev) => ({ ...prev, [field]: true }));
      setValuesState((currentValues) => {
        const error = validateSingleField(field, currentValues);
        setErrors((prev) => {
          if (error) {
            return { ...prev, [field]: error };
          }
          const next = { ...prev };
          delete next[field];
          return next;
        });
        return currentValues;
      });
    },
    [validateSingleField]
  );

  const validate = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof T, string>> = {};
    const allTouched: Partial<Record<keyof T, boolean>> = {};
    let valid = true;

    for (const field of Object.keys(rules) as Array<keyof T>) {
      allTouched[field] = true;
      const error = validateSingleField(field, values);
      if (error) {
        newErrors[field] = error;
        valid = false;
      }
    }

    setErrors(newErrors);
    setTouched(allTouched);
    return valid;
  }, [rules, values, validateSingleField]);

  const reset = useCallback(
    (initial?: T) => {
      setValuesState(initial ?? initialValues);
      setErrors({});
      setTouched({});
    },
    [initialValues]
  );

  const isValid = Object.keys(errors).length === 0;

  return { values, errors, touched, setValue, setValues, handleBlur, validate, reset, isValid };
}
