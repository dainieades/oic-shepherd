'use client';

import React from 'react';
import { CheckCircle, XCircle } from '@phosphor-icons/react';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error';
  exiting: boolean;
}

interface ToastContextType {
  showToast: (message: string, type?: 'success' | 'error') => void;
}

const ToastContext = React.createContext<ToastContextType | null>(null);

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const showToast = React.useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type, exiting: false }]);
    setTimeout(() => {
      setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)));
    }, 2200);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2500);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        className="z-toast pointer-events-none fixed right-0 left-0 flex flex-col items-center gap-2"
        style={{ bottom: 84 }}
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`${toast.exiting ? 'toast-exit' : 'toast-enter'} text-14 rounded-pill shadow-elevated flex items-center gap-2 font-medium whitespace-nowrap text-white`}
            style={{
              background:
                toast.type === 'error' ? 'rgba(180, 40, 40, 0.92)' : 'rgba(31, 37, 51, 0.92)',
              padding: '0.625rem 1.125rem',
              backdropFilter: 'blur(0.5rem)',
              WebkitBackdropFilter: 'blur(0.5rem)',
            }}
          >
            {toast.type === 'error' ? (
              <XCircle size={17} weight="fill" color="#FFB3B3" />
            ) : (
              <CheckCircle size={17} weight="fill" color="#7EC8A4" />
            )}
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
