import type { ReactNode } from 'react';
import { cx } from '../lib/cx';

interface KbdProps {
  children: ReactNode;
  className?: string;
}

export default function Kbd({ children, className }: KbdProps) {
  return <kbd className={cx('kbd', className)}>{children}</kbd>;
}
