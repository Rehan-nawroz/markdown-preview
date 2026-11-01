import { TriangleAlert } from 'lucide-react';
import Dialog from './Dialog';

interface UnsavedDialogProps {
  name: string;
  onChoose(choice: 'save' | 'discard' | 'cancel'): void;
}

export default function UnsavedDialog({ name, onChoose }: UnsavedDialogProps) {
  return (
    <Dialog
      title="Save changes before continuing?"
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
          <button type="button" className="btn btn--ghost" onClick={() => onChoose('cancel')}>
            Cancel
          </button>
          <button type="button" className="btn btn--danger" onClick={() => onChoose('discard')}>
            Discard
          </button>
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => onChoose('save')}
            data-autofocus
          >
            Save and continue
          </button>
        </>
      }
    >
      <p>
        <strong>{name}</strong> has unsaved changes.
      </p>
      <p>Save before you open another file, start a new one, or close this document.</p>
      <p className="dialog__warning">If you discard, the edits in this tab will be lost.</p>
    </Dialog>
  );
}
