import { CircleAlert, CircleCheck, Info, X } from 'lucide-react';
import type { Toast } from '../state/types';
import { cx } from '../lib/cx';

interface ToastStackProps {
  toasts: Toast[];
  onDismiss(id: number): void;
}

export default function ToastStack({ toasts, onDismiss }: ToastStackProps) {
  return (
    <div className="toast-stack" aria-live="polite" aria-atomic="false">
      {toasts.map((toast) => {
        const Icon =
          toast.tone === 'success' ? CircleCheck : toast.tone === 'error' ? CircleAlert : Info;

        return (
          <div
            key={toast.id}
            className={cx('toast', `toast--${toast.tone}`)}
            role={toast.tone === 'error' ? 'alert' : 'status'}
          >
            <Icon className="toast__icon" strokeWidth={1.8} aria-hidden="true" />
            <span className="toast__message">{toast.message}</span>
            <button
              type="button"
              className="toast__close"
              onClick={() => onDismiss(toast.id)}
              aria-label="Dismiss notification"
            >
              <X strokeWidth={1.8} aria-hidden="true" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
