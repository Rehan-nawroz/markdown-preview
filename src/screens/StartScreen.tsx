import {
  ArrowRight,
  FileText,
  FolderOpen,
  Plus,
  ShieldCheck,
  Upload,
} from 'lucide-react';
import StartHeader from '../components/StartHeader';
import Kbd from '../components/Kbd';
import { shortcutLabel } from '../lib/platform';

interface StartScreenProps {
  version: string;
  onOpen(): void;
  onNew(): void;
  onSample(): void;
  onHelp(): void;
}

export default function StartScreen({
  version,
  onOpen,
  onNew,
  onSample,
  onHelp,
}: StartScreenProps) {
  return (
    <div className="start-shell">
      <StartHeader version={version} onHelp={onHelp} />

      <main className="start-main">
        <div className="start-column">
          <div className="start-hero">
            <div className="start-logo">
              <FileText strokeWidth={1.5} aria-hidden="true" />
            </div>
            <h1 className="start-title">Markform</h1>
            <p className="start-subtitle">
              Open a Markdown file, write, and preview it — all in your browser.
            </p>
          </div>

          <div
            className="dropzone"
            role="button"
            tabIndex={0}
            aria-label="Open a Markdown file"
            onClick={onOpen}
            onKeyDown={(event) => {
              if (event.target !== event.currentTarget) return;
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onOpen();
              }
            }}
          >
            <div className="dropzone__icon">
              <Upload strokeWidth={1.5} aria-hidden="true" />
            </div>
            <h2 className="dropzone__title">Drop a .md file here</h2>
            <p className="dropzone__types">Supports .md, .markdown, .txt</p>

            <div className="dropzone__actions">
              <button
                type="button"
                className="btn btn--primary"
                onClick={(event) => {
                  event.stopPropagation();
                  onOpen();
                }}
              >
                <FolderOpen className="btn__icon" strokeWidth={1.7} aria-hidden="true" />
                <span>Open file</span>
                <Kbd className="btn__kbd">{shortcutLabel('Mod+O')}</Kbd>
              </button>
              <button
                type="button"
                className="btn btn--secondary"
                onClick={(event) => {
                  event.stopPropagation();
                  onNew();
                }}
              >
                <Plus className="btn__icon" strokeWidth={1.8} aria-hidden="true" />
                <span>New document</span>
                <Kbd>{shortcutLabel('Mod+N')}</Kbd>
              </button>
            </div>

            <div className="dropzone__divider">
              <button
                type="button"
                className="dropzone__sample"
                onClick={(event) => {
                  event.stopPropagation();
                  onSample();
                }}
              >
                <span>Load sample document</span>
                <ArrowRight strokeWidth={1.8} aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="start-privacy">
            <ShieldCheck strokeWidth={1.7} aria-hidden="true" />
            <span>Your file stays on this device. Nothing is uploaded.</span>
          </div>

          <div className="start-hints" aria-label="Keyboard shortcuts">
            <span className="start-hint">
              <Kbd>{shortcutLabel('Mod+O')}</Kbd>
              <span>to open</span>
            </span>
            <span className="start-hints__dot" aria-hidden="true">
              •
            </span>
            <span className="start-hint">
              <Kbd>{shortcutLabel('Mod+N')}</Kbd>
              <span>for new</span>
            </span>
            <span className="start-hints__dot" aria-hidden="true">
              •
            </span>
            <span className="start-hint">
              <Kbd>?</Kbd>
              <span>for help</span>
            </span>
          </div>
        </div>
      </main>

      <footer className="start-footer">
        <div className="sandbox">
          <span className="sandbox__dot" aria-hidden="true" />
          <span>Client-only sandbox active</span>
        </div>
        <button type="button" className="start-footer__help" onClick={onHelp}>
          <span>Help &amp; shortcuts</span>
          <span className="start-footer__help-key">(Press ?)</span>
        </button>
      </footer>
    </div>
  );
}
