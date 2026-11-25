import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { CloseIcon } from './icons';

type Kind = 'info' | 'error';
interface Toast {
  id: number;
  kind: Kind;
  message: string;
}

interface ToastApi {
  show: (message: string, kind?: Kind) => void;
}

const ToastContext = createContext<ToastApi>({ show: () => {} });
const LIFETIME = 4000;

export function useToast() {
  return useContext(ToastContext);
}

let nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const show = useCallback((message: string, kind: Kind = 'info') => {
    setToasts((current) => [...current, { id: nextId++, kind, message }]);
  }, []);

  const api = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toasts">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: number) => void }) {
  useEffect(() => {
    if (toast.kind === 'error') return;
    const timer = setTimeout(() => onDismiss(toast.id), LIFETIME);
    return () => clearTimeout(timer);
  }, [toast.kind, toast.id, onDismiss]);

  return (
    <div className={`toast toast-${toast.kind}`} role={toast.kind === 'error' ? 'alert' : 'status'}>
      <span>{toast.message}</span>
      {toast.kind === 'error' && (
        <button className="icon-btn icon-btn-sm" aria-label="Dismiss" onClick={() => onDismiss(toast.id)}>
          <CloseIcon size={14} />
        </button>
      )}
    </div>
  );
}
