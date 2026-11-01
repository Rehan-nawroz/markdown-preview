import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import {
  EditorState,
  type Extension,
} from '@codemirror/state';
import {
  EditorView,
  drawSelection,
  dropCursor,
  highlightActiveLineGutter,
  highlightSpecialChars,
  keymap,
  lineNumbers,
  placeholder as placeholderExtension,
} from '@codemirror/view';
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentLess,
  indentMore,
} from '@codemirror/commands';
import {
  deleteMarkupBackward,
  insertNewlineContinueMarkup,
  markdown,
} from '@codemirror/lang-markdown';
import { search, searchKeymap } from '@codemirror/search';
import { bold, italic, link } from './commands';
import { markformEditorTheme, markformSyntax } from './theme';
import { prefersFinePointer } from '../lib/platform';
import type { Cursor } from '../state/types';

interface MarkdownEditorProps {
  value: string;
  onChange(value: string): void;
  onCursor(cursor: Cursor): void;
  onSave(): void;
  editorRef: RefObject<EditorView | null>;
  autoFocus?: boolean;
}

function cursorFromState(state: EditorState): Cursor {
  const head = state.selection.main.head;
  const line = state.doc.lineAt(head);
  return {
    line: line.number,
    col: head - line.from + 1,
  };
}

export default function MarkdownEditor({
  value,
  onChange,
  onCursor,
  onSave,
  editorRef,
  autoFocus = false,
}: MarkdownEditorProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  const callbacksRef = useRef({ onChange, onCursor, onSave });

  useEffect(() => {
    callbacksRef.current = { onChange, onCursor, onSave };
  }, [onChange, onCursor, onSave]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const extensions: Extension[] = [
      lineNumbers(),
      highlightActiveLineGutter(),
      highlightSpecialChars(),
      history(),
      drawSelection(),
      dropCursor(),
      EditorState.tabSize.of(2),
      EditorView.lineWrapping,
      markdown(),
      markformSyntax,
      markformEditorTheme,
      placeholderExtension('Write Markdown, or drop a .md file.'),
      search({ top: true }),
      EditorView.contentAttributes.of({
        'aria-label': 'Markdown editor',
        spellcheck: 'true',
        autocapitalize: 'off',
        autocorrect: 'off',
        autocomplete: 'off',
      }),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          callbacksRef.current.onChange(update.state.doc.toString());
        }
        if (update.docChanged || update.selectionSet) {
          callbacksRef.current.onCursor(cursorFromState(update.state));
        }
      }),
      keymap.of([
        { key: 'Mod-s', preventDefault: true, run: () => {
          callbacksRef.current.onSave();
          return true;
        } },
        { key: 'Mod-b', preventDefault: true, run: bold },
        { key: 'Mod-i', preventDefault: true, run: italic },
        { key: 'Mod-k', preventDefault: true, run: link },
        { key: 'Mod-]', preventDefault: true, run: indentMore },
        { key: 'Mod-[', preventDefault: true, run: indentLess },
        { key: 'Enter', run: insertNewlineContinueMarkup },
        { key: 'Backspace', run: deleteMarkupBackward },
        ...defaultKeymap,
        ...historyKeymap,
        ...searchKeymap,
      ]),
    ];

    const view = new EditorView({
      state: EditorState.create({
        doc: value,
        extensions,
      }),
      parent: host,
    });

    viewRef.current = view;
    editorRef.current = view;

    if (autoFocus && prefersFinePointer()) {
      window.requestAnimationFrame(() => view.focus());
    }

    return () => {
      view.destroy();
      viewRef.current = null;
      editorRef.current = null;
    };
    // The editor is intentionally mounted once; external values are synced below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    const current = view.state.doc.toString();
    if (current === value) return;

    view.dispatch({
      changes: { from: 0, to: current.length, insert: value },
      selection: { anchor: 0 },
    });
  }, [value]);

  return <div className="editor-host" ref={hostRef} />;
}
