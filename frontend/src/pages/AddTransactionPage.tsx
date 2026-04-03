import React from 'react';
import { useNavigate } from 'react-router-dom';
import TransactionForm from '../components/transactions/TransactionForm';
import { post } from '../services/api';
import { useToast, ToastContainer } from '../components/ui';
import { CreateTransactionInput, Transaction } from '../types';

const AddTransactionPage: React.FC = () => {
  const navigate = useNavigate();
  const { toasts, addToast, dismissToast } = useToast();

  const handleSubmit = async (data: CreateTransactionInput) => {
    try {
      await post<{ data: Transaction }>('/transactions', data);
      addToast('success', 'Transaction created successfully!');
      setTimeout(() => navigate('/transactions'), 500);
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Failed to create transaction.');
    }
  };

  return (
    <div className="page add-transaction-page">
      <h2>Add Transaction</h2>
      <TransactionForm onSubmit={handleSubmit} />
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
};

export default AddTransactionPage;
