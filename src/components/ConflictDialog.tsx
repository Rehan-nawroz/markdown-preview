import { TriangleAlert } from 'lucide-react';
import Dialog from './Dialog';

interface ConflictDialogProps {
  onChoose(choice: 'overwrite' | 'reload' | 'cancel'): void;
}

export default function ConflictDialog({ onChoose }: ConflictDialogProps) {
  return (
    <Dialog
      title="This file changed on disk"
      icon={
        <TriangleAlert
          className="dialog__title-icon dialog__title-icon--warning"
          strokeWidth={1.8}
          aria-hidden="true"
        />
      }
      onClose={() => onChoose('cancel')}
      footer={
        <>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => onChoose('cancel')}
            data-autofocus
          >
            Cancel
          </button>
          <button type="button" className="btn btn--danger" onClick={() => onChoose('overwrite')}>
            Overwrite
          </button>
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => onChoose('reload')}
          >
            Reload from disk
          </button>
        </>
      }
    >
      <p>
        This file was modified outside Markform since you opened it. Saving now would overwrite
        those external changes.
      </p>
      <p>Overwrite the file with your edits, or reload it from disk.</p>
      <p className="dialog__warning">Reloading discards the edits in this tab.</p>
    </Dialog>
  );
}
