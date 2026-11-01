import { FileText, Navigation } from 'lucide-react';
import type { Cursor, MarkdownDocument, Tab } from '../state/types';
import { countChars, countWords, formatNumber, readMinutes } from '../lib/file';
import { cx } from '../lib/cx';

interface StatusBarProps {
  mode: Tab;
  doc: MarkdownDocument;
  cursor: Cursor;
}

export default function StatusBar({ mode, doc, cursor }: StatusBarProps) {
  const words = countWords(doc.source);
  const characters = countChars(doc.source);
  const minutes = readMinutes(words);
  const isSaved = doc.hasSaved || Boolean(doc.handle);
  const tone = doc.dirty ? 'unsaved' : isSaved ? 'saved' : 'neutral';
  const compact = mode === 'edit';
  const label = doc.dirty
    ? compact
      ? 'Unsaved'
      : 'Unsaved changes'
    : isSaved
      ? compact
        ? 'Saved'
        : 'Saved to disk'
      : doc.origin === 'sample'
        ? compact
          ? 'Sample'
          : 'Sample document'
        : compact
          ? 'New'
          : 'New document';

  return (
    <footer className="status-bar">
      <div className="status-bar__group">
        <div className="status-chip">
          <FileText strokeWidth={1.8} aria-hidden="true" />
          <span>{formatNumber(words)} words</span>
          <span className="status-bar__text--chars">
            <span className="status-bar__dim">·</span> {formatNumber(characters)} characters
          </span>
        </div>
        {mode === 'preview' ? (
          <span className="status-bar__text status-bar__text--read">{minutes} min read</span>
        ) : null}
        <span className="status-bar__text status-bar__text--encoding">UTF-8</span>
        {mode === 'preview' ? (
          <span className="status-bar__text status-bar__text--encoding">
            {doc.eol === '\r\n' ? 'CRLF' : 'LF'}
          </span>
        ) : null}
      </div>

      <div className="status-bar__group status-bar__group--center">
        {mode === 'edit' ? (
          <span className="status-bar__cursor">
            <Navigation strokeWidth={1.8} aria-hidden="true" />
            Ln {cursor.line}, Col {cursor.col}
          </span>
        ) : null}
      </div>

      <div className="status-bar__group status-bar__group--right">
        <span
          className={cx('status-bar__save', `status-bar__save--${tone}`)}
          aria-live="polite"
        >
          <span className="status-bar__dot" aria-hidden="true" />
          {label}
        </span>
        {mode === 'preview' ? (
          <>
            <span className="status-bar__dim">|</span>
            <span className="status-bar__text">Rendered locally</span>
          </>
        ) : null}
      </div>
    </footer>
  );
}
