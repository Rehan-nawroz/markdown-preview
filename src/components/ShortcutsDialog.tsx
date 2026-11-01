import { Keyboard } from 'lucide-react';
import Dialog from './Dialog';
import Kbd from './Kbd';
import { APP_VERSION } from '../lib/constants';
import { shortcutLabel } from '../lib/platform';

interface ShortcutsDialogProps {
  onClose(): void;
}

interface ShortcutRowProps {
  label: string;
  keys: string;
}

function ShortcutRow({ label, keys }: ShortcutRowProps) {
  return (
    <div className="shortcut-row">
      <span>{label}</span>
      <Kbd>{keys}</Kbd>
    </div>
  );
}

export default function ShortcutsDialog({ onClose }: ShortcutsDialogProps) {
  return (
    <Dialog
      title="Help & shortcuts"
      wide
      icon={
        <Keyboard className="dialog__title-icon" strokeWidth={1.8} aria-hidden="true" />
      }
      onClose={onClose}
      footer={
        <button type="button" className="btn btn--primary" onClick={onClose} data-autofocus>
          Got it
        </button>
      }
    >
      <div className="shortcuts">
        <section className="shortcut-group" aria-labelledby="shortcuts-file">
          <h3 className="shortcut-group__title" id="shortcuts-file">
            File
          </h3>
          <ShortcutRow label="Open a file" keys={shortcutLabel('Mod+O')} />
          <ShortcutRow label="Save" keys={shortcutLabel('Mod+S')} />
          <ShortcutRow label="New document" keys={shortcutLabel('Mod+N')} />
          <ShortcutRow label="Close document" keys={shortcutLabel('Mod+W')} />
          <ShortcutRow label="Print / PDF" keys={shortcutLabel('Mod+P')} />
        </section>

        <section className="shortcut-group" aria-labelledby="shortcuts-formatting">
          <h3 className="shortcut-group__title" id="shortcuts-formatting">
            Formatting
          </h3>
          <ShortcutRow label="Bold" keys={shortcutLabel('Mod+B')} />
          <ShortcutRow label="Italic" keys={shortcutLabel('Mod+I')} />
          <ShortcutRow label="Insert link" keys={shortcutLabel('Mod+K')} />
          <ShortcutRow label="Find" keys={shortcutLabel('Mod+F')} />
          <ShortcutRow
            label="Indent / outdent"
            keys={`${shortcutLabel('Mod+]')} / ${shortcutLabel('Mod+[')}`}
          />
        </section>

        <section className="shortcut-group" aria-labelledby="shortcuts-view">
          <h3 className="shortcut-group__title" id="shortcuts-view">
            View
          </h3>
          <ShortcutRow
            label="Toggle Edit / Preview"
            keys={shortcutLabel('Mod+E')}
          />
          <ShortcutRow label="Open this dialog" keys="?" />
          <ShortcutRow label="Close a dialog or menu" keys="Esc" />
        </section>
      </div>

      <div className="help-note">
        <strong>How saving works.</strong> In Chrome and Edge on a computer, Save writes back to
        the file you opened. In Firefox, Safari, and on mobile, Save downloads a copy. New documents
        open a save dialog where the browser supports it. A toast always says which happened.
      </div>

      <div className="help-note">
        <strong>Privacy.</strong> Your document never leaves this device. Remote images referenced
        by a file are loaded from their hosts when previewed, which reveals your IP to those hosts.
        Markform stores no draft: a refresh discards unsaved work, so use the beforeunload prompt.
      </div>

      <p className="help-version">
        Markform v{APP_VERSION} · Client-only sandbox
      </p>
    </Dialog>
  );
}
