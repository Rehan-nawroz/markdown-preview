import { FileText } from 'lucide-react';
import { cx } from '../lib/cx';

interface BrandProps {
  version?: string;
  className?: string;
}

export default function Brand({ version, className }: BrandProps) {
  return (
    <div className={cx('brand', className)} aria-label="Markform">
      <FileText className="brand__icon" strokeWidth={1.6} aria-hidden="true" />
      <span className="brand__name">Markform</span>
      {version ? <span className="brand__version">v{version}</span> : null}
    </div>
  );
}
