import React, { useEffect, useState } from 'react';
import { Input, Select, TextArea, Button } from '../ui';
import { useFormValidation, ValidationRules } from '../../hooks/useFormValidation';
import { get } from '../../services/api';
import { CategoryWithSubcategories, CreateTransactionInput } from '../../types';

interface TransactionFormValues extends Record<string, unknown> {
  type: string;
  title: string;
  date: string;
  time: string;
  amount: string;
  currency: string;
  shortDescription: string;
  detailedDescription: string;
  categoryId: string;
  tags: string;
}

const validationRules: ValidationRules<TransactionFormValues> = {
  type: { required: true },
  title: { required: true, maxLength: 100 },
  date: { required: true, pattern: { value: /^\d{4}-\d{2}-\d{2}$/, message: 'Date must be YYYY-MM-DD format.' } },
  amount: {
    required: true,
    custom: (value) => {
      const num = Number(value);
      if (isNaN(num) || num <= 0) return 'Amount must be greater than 0.';
      if (num > 999999999.99) return 'Amount must be at most 999,999,999.99.';
      const parts = String(value).split('.');
      if (parts[1] && parts[1].length > 2) return 'Amount must have at most 2 decimal places.';
      return undefined;
    },
  },
  currency: { required: true, pattern: { value: /^[A-Z]{3}$/, message: 'Currency must be a 3-letter code (e.g. USD).' } },
  shortDescription: { required: true, maxLength: 250 },
  categoryId: { required: true },
};

interface TransactionFormProps {
  onSubmit: (data: CreateTransactionInput) => Promise<void>;
  initialValues?: Partial<CreateTransactionInput>;
  submitLabel?: string;
}

const TransactionForm: React.FC<TransactionFormProps> = ({
  onSubmit,
  initialValues,
  submitLabel = 'Save Transaction',
}) => {
  const [categories, setCategories] = useState<CategoryWithSubcategories[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const defaultValues: TransactionFormValues = {
    type: initialValues?.type ?? 'expense',
    title: initialValues?.title ?? '',
    date: initialValues?.date ?? new Date().toISOString().slice(0, 10),
    time: initialValues?.time ?? '',
    amount: initialValues?.amount?.toString() ?? '',
    currency: initialValues?.currency ?? 'USD',
    shortDescription: initialValues?.shortDescription ?? '',
    detailedDescription: initialValues?.detailedDescription ?? '',
    categoryId: initialValues?.categoryId?.toString() ?? '',
    tags: initialValues?.tags?.join(', ') ?? '',
  };

  const { values, errors, touched, setValue, handleBlur, validate } =
    useFormValidation(defaultValues, validationRules);

  useEffect(() => {
    get<{ data: CategoryWithSubcategories[] }>('/categories')
      .then((res) => setCategories(res.data))
      .catch(() => { /* toast handled by caller */ });
  }, []);

  const categoryOptions = categories.flatMap((cat) => {
    const opts = [{ value: String(cat.id), label: cat.name }];
    if (cat.subcategories) {
      for (const sub of cat.subcategories) {
        opts.push({ value: String(sub.id), label: `  ${cat.name} > ${sub.name}` });
      }
    }
    return opts;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const data: CreateTransactionInput = {
      type: values.type as 'expense' | 'income',
      title: values.title as string,
      date: values.date as string,
      amount: parseFloat(values.amount as string),
      currency: values.currency as string,
      shortDescription: values.shortDescription as string,
      categoryId: parseInt(values.categoryId as string, 10),
    };

    if (values.time) data.time = values.time as string;
    if (values.detailedDescription) data.detailedDescription = values.detailedDescription as string;
    if (values.tags) {
      data.tags = (values.tags as string)
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
    }

    setSubmitting(true);
    try {
      await onSubmit(data);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Select
        label="Type"
        options={[
          { value: 'expense', label: 'Expense' },
          { value: 'income', label: 'Income' },
        ]}
        value={values.type as string}
        onChange={(e) => setValue('type', e.target.value)}
        onBlur={() => handleBlur('type')}
        error={touched.type ? (errors.type as string) : undefined}
        required
      />

      <Input
        label="Title"
        value={values.title as string}
        onChange={(e) => setValue('title', e.target.value)}
        onBlur={() => handleBlur('title')}
        error={touched.title ? (errors.title as string) : undefined}
        maxLength={100}
        required
      />

      <Input
        label="Date"
        type="date"
        value={values.date as string}
        onChange={(e) => setValue('date', e.target.value)}
        onBlur={() => handleBlur('date')}
        error={touched.date ? (errors.date as string) : undefined}
        required
      />

      <Input
        label="Time"
        type="time"
        value={values.time as string}
        onChange={(e) => setValue('time', e.target.value)}
      />

      <Input
        label="Amount"
        type="number"
        step="0.01"
        min="0.01"
        value={values.amount as string}
        onChange={(e) => setValue('amount', e.target.value)}
        onBlur={() => handleBlur('amount')}
        error={touched.amount ? (errors.amount as string) : undefined}
        required
      />

      <Input
        label="Currency"
        value={values.currency as string}
        onChange={(e) => setValue('currency', e.target.value.toUpperCase())}
        onBlur={() => handleBlur('currency')}
        error={touched.currency ? (errors.currency as string) : undefined}
        maxLength={3}
        required
      />

      <Select
        label="Category"
        options={categoryOptions}
        placeholder="Select a category"
        value={values.categoryId as string}
        onChange={(e) => setValue('categoryId', e.target.value)}
        onBlur={() => handleBlur('categoryId')}
        error={touched.categoryId ? (errors.categoryId as string) : undefined}
        required
      />

      <Input
        label="Short Description"
        value={values.shortDescription as string}
        onChange={(e) => setValue('shortDescription', e.target.value)}
        onBlur={() => handleBlur('shortDescription')}
        error={touched.shortDescription ? (errors.shortDescription as string) : undefined}
        maxLength={250}
        required
      />

      <TextArea
        label="Detailed Description"
        value={values.detailedDescription as string}
        onChange={(e) => setValue('detailedDescription', e.target.value)}
      />

      <Input
        label="Tags"
        value={values.tags as string}
        onChange={(e) => setValue('tags', e.target.value)}
        helpText="Comma-separated tag names"
      />

      <Button type="submit" loading={submitting}>
        {submitLabel}
      </Button>
    </form>
  );
};

export default TransactionForm;
