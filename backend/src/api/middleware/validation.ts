import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../../models';
import { ApiErrorDetail } from '../../models';

type FieldRule = {
  required?: boolean;
  maxLength?: number;
  type?: 'string' | 'number' | 'integer' | 'boolean' | 'array';
  min?: number;
  max?: number;
  maxDecimals?: number;
  enum?: string[];
  pattern?: RegExp;
  patternMessage?: string;
};

type ValidationSchema = Record<string, FieldRule>;

export function validate(schema: ValidationSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const errors: ApiErrorDetail[] = [];
    const body = req.body as Record<string, unknown>;

    for (const [field, rules] of Object.entries(schema)) {
      const value = body[field];

      if (rules.required && (value === undefined || value === null || value === '')) {
        errors.push({ field, message: `${field} is required.` });
        continue;
      }

      if (value === undefined || value === null) continue;

      if (rules.type === 'string' && typeof value !== 'string') {
        errors.push({ field, message: `${field} must be a string.` });
        continue;
      }

      if (rules.type === 'number' && typeof value !== 'number') {
        errors.push({ field, message: `${field} must be a number.` });
        continue;
      }

      if (rules.type === 'integer' && (typeof value !== 'number' || !Number.isInteger(value))) {
        errors.push({ field, message: `${field} must be an integer.` });
        continue;
      }

      if (rules.type === 'boolean' && typeof value !== 'boolean') {
        errors.push({ field, message: `${field} must be a boolean.` });
        continue;
      }

      if (rules.type === 'array' && !Array.isArray(value)) {
        errors.push({ field, message: `${field} must be an array.` });
        continue;
      }

      if (typeof value === 'string') {
        if (rules.maxLength && value.length > rules.maxLength) {
          errors.push({ field, message: `${field} must be at most ${rules.maxLength} characters.` });
        }
        if (rules.pattern && !rules.pattern.test(value)) {
          errors.push({ field, message: rules.patternMessage ?? `${field} has an invalid format.` });
        }
      }

      if (typeof value === 'number') {
        if (rules.min !== undefined && value < rules.min) {
          errors.push({ field, message: `${field} must be at least ${rules.min}.` });
        }
        if (rules.max !== undefined && value > rules.max) {
          errors.push({ field, message: `${field} must be at most ${rules.max}.` });
        }
        if (rules.maxDecimals !== undefined) {
          const decimalPart = value.toString().split('.')[1];
          if (decimalPart && decimalPart.length > rules.maxDecimals) {
            errors.push({ field, message: `${field} must have at most ${rules.maxDecimals} decimal places.` });
          }
        }
      }

      if (rules.enum && typeof value === 'string' && !rules.enum.includes(value)) {
        errors.push({ field, message: `${field} must be one of: ${rules.enum.join(', ')}.` });
      }
    }

    if (errors.length > 0) {
      throw new ValidationError('Validation failed.', errors);
    }

    next();
  };
}
