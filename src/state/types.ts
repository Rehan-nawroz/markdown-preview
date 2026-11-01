export type Tab = 'edit' | 'preview';
export type DocumentOrigin = 'file' | 'new' | 'sample';
export type SaveResult = 'saved' | 'conflict' | 'failed' | 'canceled';
export type ToastTone = 'success' | 'error' | 'info';

export type DialogState =
  | { kind: 'unsaved' }
  | { kind: 'conflict' }
  | { kind: 'shortcuts' }
  | null;

export interface MarkdownDocument {
  name: string;
  source: string;
  handle: FileSystemFileHandle | null;
  lastModified: number;
  eol: '\n' | '\r\n';
  bom: boolean;
  dirty: boolean;
  hasSaved: boolean;
  origin: DocumentOrigin;
}

export interface Cursor {
  line: number;
  col: number;
}

export interface Toast {
  id: number;
  message: string;
  tone: ToastTone;
}
