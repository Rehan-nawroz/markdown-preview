import { useRef } from 'react';
import type { KeyboardEvent } from 'react';
import { Eye, Pencil } from 'lucide-react';
import type { Tab } from '../state/types';
import { cx } from '../lib/cx';

interface ScreenTabsProps {
  tab: Tab;
  onChange(tab: Tab): void;
}

export default function ScreenTabs({ tab, onChange }: ScreenTabsProps) {
  const editRef = useRef<HTMLButtonElement>(null);
  const previewRef = useRef<HTMLButtonElement>(null);

  const select = (next: Tab) => {
    onChange(next);
    const target = next === 'edit' ? editRef.current : previewRef.current;
    target?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      select(tab === 'edit' ? 'preview' : 'edit');
      return;
    }
    if (event.key === 'Home') {
      event.preventDefault();
      select('edit');
      return;
    }
    if (event.key === 'End') {
      event.preventDefault();
      select('preview');
    }
  };

  return (
    <div className="screen-tabs" role="tablist" aria-label="Editor view">
      <button
        ref={editRef}
        type="button"
        role="tab"
        id="tab-edit"
        aria-selected={tab === 'edit'}
        aria-controls="panel-edit"
        tabIndex={tab === 'edit' ? 0 : -1}
        className={cx('screen-tabs__tab', 'screen-tabs__tab--edit')}
        onClick={() => onChange('edit')}
        onKeyDown={handleKeyDown}
      >
        <Pencil strokeWidth={1.8} aria-hidden="true" />
        <span>Edit</span>
      </button>
      <button
        ref={previewRef}
        type="button"
        role="tab"
        id="tab-preview"
        aria-selected={tab === 'preview'}
        aria-controls="panel-preview"
        tabIndex={tab === 'preview' ? 0 : -1}
        className={cx('screen-tabs__tab', 'screen-tabs__tab--preview')}
        onClick={() => onChange('preview')}
        onKeyDown={handleKeyDown}
      >
        <Eye strokeWidth={1.8} aria-hidden="true" />
        <span>Preview</span>
      </button>
    </div>
  );
}
