import React from 'react';
import { Transaction } from '../../types';
import { Button } from '../ui';

interface TransactionListProps {
  transactions: Transaction[];
  hasMore: boolean;
  onLoadMore: () => void;
  loading?: boolean;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
}

const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  hasMore,
  onLoadMore,
  loading = false,
  onEdit,
  onDelete,
}) => {
  if (transactions.length === 0 && !loading) {
    return (
      <div className="transaction-list-empty" role="status">
        <p>No transactions found. Add your first transaction to get started.</p>
      </div>
    );
  }

  return (
    <div className="transaction-list">
      <ul className="transaction-list-items">
        {transactions.map((txn) => (
          <li key={txn.id} className={`transaction-item transaction-item-${txn.type}`}>
            <div className="transaction-item-header">
              <span className="transaction-title">{txn.title}</span>
              <span className="transaction-amount">
                {txn.type === 'expense' ? '-' : '+'}
                {txn.amount.toFixed(2)} {txn.currency}
              </span>
            </div>
            <div className="transaction-item-details">
              <span className="transaction-date">{txn.date}</span>
              <span className="transaction-category">{txn.category.name}</span>
              <span className="transaction-description">{txn.shortDescription}</span>
            </div>
            {txn.tags.length > 0 && (
              <div className="transaction-tags">
                {txn.tags.map((tag) => (
                  <span key={tag} className="transaction-tag">{tag}</span>
                ))}
              </div>
            )}
            {(onEdit || onDelete) && (
              <div className="transaction-item-actions">
                {onEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(txn.id)}
                    aria-label={`Edit ${txn.title}`}
                  >
                    Edit
                  </Button>
                )}
                {onDelete && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => onDelete(txn.id)}
                    aria-label={`Delete ${txn.title}`}
                  >
                    Delete
                  </Button>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
      {hasMore && (
        <div className="transaction-list-pagination">
          <Button
            variant="secondary"
            onClick={onLoadMore}
            loading={loading}
          >
            Load More
          </Button>
        </div>
      )}
    </div>
  );
};

export default TransactionList;
