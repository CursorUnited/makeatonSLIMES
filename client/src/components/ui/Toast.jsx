import { createContext, useCallback, useContext, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import clsx from 'clsx';

const ToastContext = createContext(null);
let uid = 0;

const TONES = {
  success: { bg: 'bg-success-50 text-success-700', icon: CheckCircle2 },
  danger: { bg: 'bg-danger-50 text-danger-700', icon: AlertTriangle },
  warning: { bg: 'bg-warning-50 text-warning-700', icon: AlertTriangle },
  info: { bg: 'bg-info-50 text-info-700', icon: Info },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const toast = useCallback(
    (message, tone = 'success', duration = 3000) => {
      const id = ++uid;
      setToasts((t) => [...t, { id, message, tone }]);
      if (duration) setTimeout(() => dismiss(id), duration);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {createPortal(
        <div aria-live="polite" className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
          {toasts.map(({ id, message, tone }) => {
            const { bg, icon: Icon } = TONES[tone] ?? TONES.info;
            return (
              <div key={id} className={clsx('flex items-center gap-2 rounded-md px-4 py-3 text-sm shadow-lg', bg)}>
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{message}</span>
                <button onClick={() => dismiss(id)} aria-label="Dismiss" className="ml-2 opacity-70 hover:opacity-100">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}
