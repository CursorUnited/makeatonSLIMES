import { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Textarea } from './Textarea';

/**
 * `open`, `onClose`, `onConfirm(note?)`, `title`, `message` (plain-words consequence), `destructive`.
 * Pass `withNote` to collect an optional reason (e.g. Close subscription).
 */
export function ConfirmDialog({ open, onClose, onConfirm, title, message, destructive, confirmLabel = 'Confirm', withNote, loading }) {
  const [note, setNote] = useState('');

  if (!open) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Stay
          </Button>
          <Button variant={destructive ? 'destructive' : 'primary'} loading={loading} onClick={() => onConfirm(withNote ? note : undefined)}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm text-gray-700">{message}</p>
      {withNote && (
        <div className="mt-4">
          <label htmlFor="confirm-note" className="text-sm font-medium text-gray-600">
            Reason <span className="font-normal text-gray-400">(optional)</span>
          </label>
          <Textarea id="confirm-note" className="mt-1.5" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
      )}
    </Modal>
  );
}

/** Convenience wrapper for the "Discard unsaved changes?" guard (S13). */
export function DiscardChangesDialog({ open, onStay, onDiscard }) {
  return (
    <Modal
      open={open}
      onClose={onStay}
      title="Discard unsaved changes?"
      footer={
        <>
          <Button variant="secondary" onClick={onStay}>
            Stay
          </Button>
          <Button variant="destructive" onClick={onDiscard}>
            Discard
          </Button>
        </>
      }
    >
      <p className="text-sm text-gray-700">You have unsaved changes. If you leave now, they'll be lost.</p>
    </Modal>
  );
}
