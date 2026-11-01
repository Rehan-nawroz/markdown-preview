import { CloudUpload } from 'lucide-react';

export default function DropOverlay() {
  return (
    <div className="drop-overlay" aria-hidden="true">
      <div className="drop-card">
        <CloudUpload className="drop-card__icon" strokeWidth={1.4} aria-hidden="true" />
        <p className="drop-card__title">Drop to open</p>
        <p className="drop-card__types">.md · .markdown · .txt</p>
        <p className="drop-card__hint">One file at a time · Your file never leaves this device</p>
      </div>
    </div>
  );
}
