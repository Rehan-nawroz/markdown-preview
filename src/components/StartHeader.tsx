import { Keyboard } from 'lucide-react';
import Brand from './Brand';
import Kbd from './Kbd';

interface StartHeaderProps {
  version: string;
  onHelp(): void;
}

export default function StartHeader({ version, onHelp }: StartHeaderProps) {
  return (
    <header className="start-header">
      <div className="start-header__brand">
        <Brand version={version} />
      </div>
      <button
        type="button"
        className="help-button"
        onClick={onHelp}
        aria-label="Help and shortcuts"
      >
        <Keyboard className="help-button__icon" strokeWidth={1.7} aria-hidden="true" />
        <span className="help-button__label">Help &amp; shortcuts</span>
        <Kbd>?</Kbd>
      </button>
    </header>
  );
}
