import { useLayoutEffect, useRef } from 'react';
import type { MouseEvent } from 'react';
import { FileText } from 'lucide-react';

interface PreviewScreenProps {
  html: string;
  source: string;
  scrollRef: { current: number };
  onEdit(): void;
  onCopyCode(text: string): void;
}

export default function PreviewScreen({
  html,
  source,
  scrollRef,
  onEdit,
  onCopyCode,
}: PreviewScreenProps) {
  const mainRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    if (mainRef.current) mainRef.current.scrollTop = scrollRef.current;
  }, [scrollRef]);

  const handleClick = (event: MouseEvent<HTMLElement>) => {
    const target = event.target as HTMLElement;
    const button = target.closest<HTMLButtonElement>('[data-copy-code]');
    if (!button) return;

    const code = button.closest('.code-block')?.querySelector('code')?.textContent ?? '';
    if (code) onCopyCode(code);
  };

  if (!source.trim()) {
    return (
      <main
        className="preview-main"
        id="panel-preview"
        role="tabpanel"
        aria-labelledby="tab-preview"
        ref={mainRef}
      >
        <div className="preview-sheet">
          <div className="preview-empty">
            <div className="preview-empty__icon">
              <FileText strokeWidth={1.5} aria-hidden="true" />
            </div>
            <h2 className="preview-empty__title">Nothing to preview yet</h2>
            <p className="preview-empty__body">
              Switch to Edit and start writing, or open a Markdown file to see it rendered here.
            </p>
            <button type="button" className="btn btn--secondary" onClick={onEdit}>
              Go to Edit
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main
      className="preview-main"
      id="panel-preview"
      role="tabpanel"
      aria-labelledby="tab-preview"
      ref={mainRef}
      onScroll={(event) => {
        scrollRef.current = event.currentTarget.scrollTop;
      }}
    >
      <article
        className="preview-sheet markdown-body"
        onClick={handleClick}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </main>
  );
}
