import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';

export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  description = 'This action cannot be undone. Please confirm to proceed.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  loading = false
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-md">
      <div className="flex items-start gap-4">
        <div
          className={`
            p-3 rounded-2xl shrink-0
            ${variant === 'danger'
              ? 'bg-terracotta-50 text-terracotta-600'
              : 'bg-amber-50 text-amber-600'
            }
          `}
        >
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div>
          <h4 className="text-base font-serif font-bold text-neutral-900">{title}</h4>
          <p className="mt-1 text-sm text-neutral-600 leading-relaxed">{description}</p>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-end gap-3">
        <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>
          {cancelText}
        </Button>
        <Button
          variant={variant === 'danger' ? 'danger' : 'primary'}
          size="sm"
          loading={loading}
          onClick={onConfirm}
        >
          {confirmText}
        </Button>
      </div>
    </Modal>
  );
};

