'use client';

import React from 'react';
import { CheckCircle } from '@phosphor-icons/react';

interface Toast {
  id: string;
  message: string;
  exiting: boolean;
}

interface ToastContextType {
  showToast: (message: string) => void;
}

const ToastContext = React.createContext<ToastContextType | null>(null);

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const showToast = React.useCallback((message: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, exiting: false }]);
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
        style={{
          position: 'fixed',
          bottom: 84,
          left: 0,
          right: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
          zIndex: 200,
          pointerEvents: 'none',
        }}
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={toast.exiting ? 'toast-exit' : 'toast-enter'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(31, 37, 51, 0.92)',
              color: '#fff',
              padding: '10px 18px',
              borderRadius: 'var(--radius-pill)',
              fontSize: 14,
              fontWeight: 500,
              boxShadow: 'var(--shadow-elevated)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              whiteSpace: 'nowrap',
            }}
          >
            <CheckCircle size={17} weight="fill" color="#7EC8A4" />
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
