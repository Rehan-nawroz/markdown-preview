import type { RefObject } from 'react';
import type { EditorView } from '@codemirror/view';
import MarkdownEditor from '../editor/MarkdownEditor';
import Toolbar from '../components/Toolbar';
import type { Cursor } from '../state/types';
import { cx } from '../lib/cx';

interface EditorScreenProps {
  hidden: boolean;
  value: string;
  onChange(value: string): void;
  onCursor(cursor: Cursor): void;
  onSave(): void;
  editorRef: RefObject<EditorView | null>;
}

export default function EditorScreen({
  hidden,
  value,
  onChange,
  onCursor,
  onSave,
  editorRef,
}: EditorScreenProps) {
  return (
    <section
      className={cx('editor-screen', hidden && 'editor-screen--hidden')}
      id="panel-edit"
      role="tabpanel"
      aria-labelledby="tab-edit"
      aria-hidden={hidden}
    >
      <Toolbar editorRef={editorRef} />
      <main className="editor-main">
        <div className="editor-sheet">
          <MarkdownEditor
            value={value}
            onChange={onChange}
            onCursor={onCursor}
            onSave={onSave}
            editorRef={editorRef}
            autoFocus
          />
        </div>
      </main>
    </section>
  );
}
