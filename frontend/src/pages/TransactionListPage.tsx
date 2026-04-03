import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TransactionList from '../components/transactions/TransactionList';
import { get, del } from '../services/api';
import { Transaction, PaginatedResponse, TransactionFilters } from '../types';
import { Input, Select, Button, Modal, useToast, ToastContainer } from '../components/ui';

const TransactionListPage: React.FC = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<TransactionFilters>({});
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const { toasts, addToast, dismissToast } = useToast();

  const fetchTransactions = useCallback(async (append = false) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.type) params.set('type', filters.type);
      if (filters.categoryId) params.set('categoryId', String(filters.categoryId));
      if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.set('dateTo', filters.dateTo);
      if (filters.search) params.set('search', filters.search);
      if (append && cursor) params.set('cursor', cursor);

      const qs = params.toString();
      const result = await get<PaginatedResponse<Transaction>>(
        `/transactions${qs ? `?${qs}` : ''}`
      );

      setTransactions((prev) => (append ? [...prev, ...result.data] : result.data));
      setHasMore(result.pagination.hasMore);
      setCursor(result.pagination.nextCursor);
    } finally {
      setLoading(false);
    }
  }, [filters, cursor]);

  useEffect(() => {
    fetchTransactions(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const handleLoadMore = () => {
    fetchTransactions(true);
  };

  const handleEdit = (id: number) => {
    navigate(`/transactions/${id}/edit`);
  };

  const handleDeleteConfirm = async () => {
    if (deleteTarget === null) return;
    try {
      await del(`/transactions/${deleteTarget}`);
      setTransactions((prev) => prev.filter((t) => t.id !== deleteTarget));
      addToast('success', 'Transaction deleted.');
    } catch {
      addToast('error', 'Failed to delete transaction.');
    }
    setDeleteTarget(null);
  };

  return (
    <div className="page transaction-list-page">
      <h2>Transactions</h2>

      <div className="transaction-filters">
        <Select
          label="Type"
          options={[
            { value: '', label: 'All' },
            { value: 'expense', label: 'Expense' },
            { value: 'income', label: 'Income' },
          ]}
          value={filters.type ?? ''}
          onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value as TransactionFilters['type'] || undefined }))}
        />
        <Input
          label="From"
          type="date"
          value={filters.dateFrom ?? ''}
          onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value || undefined }))}
        />
        <Input
          label="To"
          type="date"
          value={filters.dateTo ?? ''}
          onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value || undefined }))}
        />
        <Input
          label="Search"
          value={filters.search ?? ''}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value || undefined }))}
        />
        <Button variant="secondary" onClick={() => setFilters({})}>Clear</Button>
      </div>

      <TransactionList
        transactions={transactions}
        hasMore={hasMore}
        onLoadMore={handleLoadMore}
        loading={loading}
        onEdit={handleEdit}
        onDelete={(id) => setDeleteTarget(id)}
      />

      <Modal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Confirm Deletion"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDeleteConfirm}>Delete</Button>
          </>
        }
      >
        <p>Are you sure you want to permanently delete this transaction?</p>
      </Modal>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
};

export default TransactionListPage;
