import { useEffect, useRef, useState } from 'react';
import {
  CircleQuestionMark,
  CodeXml,
  Copy,
  EllipsisVertical,
  FilePlus,
  FileText,
  FolderOpen,
  Pencil,
  Printer,
  Save,
  X,
} from 'lucide-react';
import type { MarkdownDocument, Tab } from '../state/types';
import { cx } from '../lib/cx';
import { shortcutLabel } from '../lib/platform';
import Kbd from './Kbd';
import ScreenTabs from './ScreenTabs';

interface DocumentHeaderProps {
  doc: MarkdownDocument;
  tab: Tab;
  onTabChange(tab: Tab): void;
  onOpen(): void;
  onSave(): void;
  onNew(): void;
  onClose(): void;
  onRename(name: string): void;
  onExportHtml(): void;
  onPrint(): void;
  onCopyHtml(): void;
  onHelp(): void;
}

export default function DocumentHeader({
  doc,
  tab,
  onTabChange,
  onOpen,
  onSave,
  onNew,
  onClose,
  onRename,
  onExportHtml,
  onPrint,
  onCopyHtml,
  onHelp,
}: DocumentHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(doc.name);
  const menuRef = useRef<HTMLDivElement>(null);
  const canRename = !doc.handle;
  const isSaved = doc.hasSaved || Boolean(doc.handle);

  useEffect(() => {
    setDraft(doc.name);
    setEditing(false);
  }, [doc.name]);

  useEffect(() => {
    if (!menuOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen]);

  const commitName = () => {
    const next = draft.trim();
    if (next && next !== doc.name) onRename(next);
    setEditing(false);
  };

  const run = (action: () => void) => {
    setMenuOpen(false);
    action();
  };

  return (
    <header className="doc-header">
      <div className="doc-header__left">
        <div className="doc-brand" aria-label="Markform">
          <FileText className="doc-brand__icon" strokeWidth={1.6} aria-hidden="true" />
          <span className="doc-brand__name">Markform</span>
        </div>
        <span className="doc-brand__divider" aria-hidden="true" />
        <div className="doc-file">
          <FileText className="doc-file__icon" strokeWidth={1.8} aria-hidden="true" />
          {editing ? (
            <input
              className="doc-file__input"
              value={draft}
              aria-label="Document name"
              autoFocus
              onChange={(event) => setDraft(event.target.value)}
              onBlur={commitName}
              onFocus={(event) => event.currentTarget.select()}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  commitName();
                } else if (event.key === 'Escape') {
                  event.preventDefault();
                  setDraft(doc.name);
                  setEditing(false);
                }
              }}
            />
          ) : canRename ? (
            <button
              type="button"
              className="doc-file__button"
              onClick={() => setEditing(true)}
              title="Rename document"
              aria-label={`Rename ${doc.name}`}
            >
              <span className="doc-file__name">{doc.name}</span>
              <Pencil className="doc-file__edit" strokeWidth={1.8} aria-hidden="true" />
            </button>
          ) : (
            <span className="doc-file__name" title={doc.name}>
              {doc.name}
            </span>
          )}
          {doc.dirty ? (
            <span className="chip chip--unsaved">
              <span className="chip__dot" aria-hidden="true" />
              Unsaved
            </span>
          ) : isSaved ? (
            <span className="chip chip--saved">
              <span className="chip__dot" aria-hidden="true" />
              Saved
            </span>
          ) : doc.origin === 'sample' ? (
            <span className="chip chip--sample">Sample</span>
          ) : (
            <span className="chip">New</span>
          )}
        </div>
      </div>

      <div className="doc-header__tabs">
        <ScreenTabs tab={tab} onChange={onTabChange} />
      </div>

      <div className="doc-header__actions">
        {tab === 'preview' ? (
          <div className="quick-actions" aria-label="Export actions">
            <button type="button" className="quick-actions__button" onClick={onCopyHtml}>
              Copy HTML
            </button>
            <button type="button" className="quick-actions__button" onClick={onExportHtml}>
              Export HTML
            </button>
            <button type="button" className="quick-actions__button" onClick={onPrint}>
              Print / PDF
            </button>
          </div>
        ) : null}

        <button type="button" className="btn btn--ghost" onClick={onOpen} aria-label="Open a file">
          <FolderOpen className="btn__icon" strokeWidth={1.7} aria-hidden="true" />
          <span className="btn__label">Open</span>
        </button>

        <button type="button" className="btn btn--primary" onClick={onSave}>
          <Save className="btn__icon" strokeWidth={1.7} aria-hidden="true" />
          <span className="btn__label">Save</span>
          <Kbd className="btn__kbd">{shortcutLabel('Mod+S')}</Kbd>
        </button>

        <div className="menu-anchor" ref={menuRef}>
          <button
            type="button"
            className={cx('btn', 'btn--secondary', 'btn--icon')}
            aria-label="More actions"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <EllipsisVertical className="btn__icon" strokeWidth={1.8} aria-hidden="true" />
          </button>

          {menuOpen ? (
            <div className="menu" role="menu" aria-label="Document actions">
              <button type="button" className="menu__item" role="menuitem" onClick={() => run(onNew)}>
                <span className="menu__item-main">
                  <FilePlus strokeWidth={1.7} aria-hidden="true" />
                  <span>New document</span>
                </span>
                <span className="menu__shortcut">{shortcutLabel('Mod+N')}</span>
              </button>
              <button
                type="button"
                className="menu__item"
                role="menuitem"
                onClick={() => run(onClose)}
              >
                <span className="menu__item-main">
                  <X strokeWidth={1.7} aria-hidden="true" />
                  <span>Close document</span>
                </span>
                <span className="menu__shortcut">{shortcutLabel('Mod+W')}</span>
              </button>

              <div className="menu__divider" role="separator" />

              <button
                type="button"
                className="menu__item"
                role="menuitem"
                onClick={() => run(onExportHtml)}
              >
                <span className="menu__item-main">
                  <CodeXml strokeWidth={1.7} aria-hidden="true" />
                  <span>Export HTML</span>
                </span>
              </button>
              <button
                type="button"
                className="menu__item"
                role="menuitem"
                onClick={() => run(onPrint)}
              >
                <span className="menu__item-main">
                  <Printer strokeWidth={1.7} aria-hidden="true" />
                  <span>Print / PDF</span>
                </span>
                <span className="menu__shortcut">{shortcutLabel('Mod+P')}</span>
              </button>
              {tab === 'preview' ? (
                <button
                  type="button"
                  className="menu__item"
                  role="menuitem"
                  onClick={() => run(onCopyHtml)}
                >
                  <span className="menu__item-main">
                    <Copy strokeWidth={1.7} aria-hidden="true" />
                    <span>Copy HTML</span>
                  </span>
                </button>
              ) : null}

              <div className="menu__divider" role="separator" />

              <button
                type="button"
                className="menu__item"
                role="menuitem"
                onClick={() => run(onHelp)}
              >
                <span className="menu__item-main">
                  <CircleQuestionMark strokeWidth={1.7} aria-hidden="true" />
                  <span>Help &amp; shortcuts</span>
                </span>
                <span className="menu__shortcut">?</span>
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
