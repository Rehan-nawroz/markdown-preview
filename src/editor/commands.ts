import type { EditorView } from '@codemirror/view';
import {
  cycleHeading,
  diffChange,
  insertCodeBlock,
  insertLink,
  insertRule,
  insertTable,
  toggleLinePrefix,
  toggleWrap,
  type TextRange,
  type TransformResult,
} from './transforms';

export type EditorCommand = (view: EditorView) => boolean;

type Transform = (text: string, range: TextRange) => TransformResult;

export function runTransform(view: EditorView, transform: Transform): boolean {
  const text = view.state.doc.toString();
  const range = {
    from: view.state.selection.main.from,
    to: view.state.selection.main.to,
  };
  const result = transform(text, range);
  const change = diffChange(text, result.text);

  if (!change) return false;

  view.dispatch({
    changes: change,
    selection: { anchor: result.from, head: result.to },
    scrollIntoView: true,
    userEvent: 'input.format',
  });
  view.focus();
  return true;
}

export const bold: EditorCommand = (view) =>
  runTransform(view, (text, range) => toggleWrap(text, range, '**'));

export const italic: EditorCommand = (view) =>
  runTransform(view, (text, range) => toggleWrap(text, range, '*'));

export const strike: EditorCommand = (view) =>
  runTransform(view, (text, range) => toggleWrap(text, range, '~~'));

export const inlineCode: EditorCommand = (view) =>
  runTransform(view, (text, range) => toggleWrap(text, range, '`'));

export const heading: EditorCommand = (view) => runTransform(view, cycleHeading);

export const quote: EditorCommand = (view) =>
  runTransform(view, (text, range) => toggleLinePrefix(text, range, 'quote'));

export const bulletList: EditorCommand = (view) =>
  runTransform(view, (text, range) => toggleLinePrefix(text, range, 'bullet'));

export const orderedList: EditorCommand = (view) =>
  runTransform(view, (text, range) => toggleLinePrefix(text, range, 'ordered'));

export const taskList: EditorCommand = (view) =>
  runTransform(view, (text, range) => toggleLinePrefix(text, range, 'task'));

export const codeBlock: EditorCommand = (view) => runTransform(view, insertCodeBlock);

export const link: EditorCommand = (view) =>
  runTransform(view, (text, range) => insertLink(text, range, false));

export const image: EditorCommand = (view) =>
  runTransform(view, (text, range) => insertLink(text, range, true));

export const table: EditorCommand = (view) => runTransform(view, insertTable);

export const rule: EditorCommand = (view) => runTransform(view, insertRule);
