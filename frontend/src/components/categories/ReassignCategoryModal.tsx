import React, { useState } from 'react';
import { Modal, Select, Button } from '../ui';
import { CategoryWithSubcategories } from '../../types';

interface ReassignCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reassignToCategoryId: number) => Promise<void>;
  categories: CategoryWithSubcategories[];
  deletingCategoryId: number | null;
}

const ReassignCategoryModal: React.FC<ReassignCategoryModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  categories,
  deletingCategoryId,
}) => {
  const [targetCategoryId, setTargetCategoryId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const availableCategories = categories
    .filter((c) => c.id !== deletingCategoryId)
    .flatMap((c) => {
      const opts = [{ value: String(c.id), label: c.name }];
      if (c.subcategories) {
        for (const sub of c.subcategories) {
          if (sub.id !== deletingCategoryId) {
            opts.push({ value: String(sub.id), label: `  ${c.name} > ${sub.name}` });
          }
        }
      }
      return opts;
    });

  const handleConfirm = async () => {
    if (!targetCategoryId) return;
    setSubmitting(true);
    try {
      await onConfirm(parseInt(targetCategoryId, 10));
    } finally {
      setSubmitting(false);
      setTargetCategoryId('');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Reassign Transactions"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button
            variant="danger"
            onClick={handleConfirm}
            loading={submitting}
            disabled={!targetCategoryId}
          >
            Delete & Reassign
          </Button>
        </>
      }
    >
      <p>
        This category may have transactions. Select a category to reassign them to before deletion.
      </p>
      <Select
        label="Reassign to"
        options={availableCategories}
        placeholder="Select target category"
        value={targetCategoryId}
        onChange={(e) => setTargetCategoryId(e.target.value)}
        required
      />
    </Modal>
  );
};

export default ReassignCategoryModal;
