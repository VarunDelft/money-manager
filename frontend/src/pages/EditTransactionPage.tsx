import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import TransactionForm from '../components/transactions/TransactionForm';
import { get, put } from '../services/api';
import { useToast, ToastContainer, LoadingSpinner } from '../components/ui';
import { CreateTransactionInput, Transaction } from '../types';

const EditTransactionPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toasts, addToast, dismissToast } = useToast();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    get<{ data: Transaction }>(`/transactions/${id}`)
      .then((res) => setTransaction(res.data))
      .catch(() => addToast('error', 'Failed to load transaction.'))
      .finally(() => setLoading(false));
  }, [id, addToast]);

  const handleSubmit = async (data: CreateTransactionInput) => {
    try {
      await put<{ data: Transaction }>(`/transactions/${id}`, data);
      addToast('success', 'Transaction updated successfully!');
      setTimeout(() => navigate('/transactions'), 500);
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Failed to update transaction.');
    }
  };

  if (loading) return <LoadingSpinner label="Loading transaction..." />;

  if (!transaction) {
    return <div className="page"><p>Transaction not found.</p></div>;
  }

  return (
    <div className="page edit-transaction-page">
      <h2>Edit Transaction</h2>
      <TransactionForm
        onSubmit={handleSubmit}
        initialValues={{
          type: transaction.type,
          title: transaction.title,
          date: transaction.date,
          time: transaction.time ?? undefined,
          amount: transaction.amount,
          currency: transaction.currency,
          shortDescription: transaction.shortDescription,
          detailedDescription: transaction.detailedDescription ?? undefined,
          categoryId: transaction.category.id,
          tags: transaction.tags,
        }}
        submitLabel="Save Changes"
      />
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
};

export default EditTransactionPage;
