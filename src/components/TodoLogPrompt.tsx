'use client';

import { type Todo } from '@/lib/types';

interface TodoLogPromptProps {
  todo: Todo;
  onAddLog: () => void;
  onSkip: () => void;
}

export default function TodoLogPrompt({ todo, onAddLog, onSkip }: TodoLogPromptProps) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 65,
        background: 'rgba(30,26,24,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '0 24px',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onSkip(); }}
    >
      <div
        className="animate-slide-up"
        style={{
          background: 'var(--surface)', borderRadius: 20,
          width: '100%', maxWidth: 360,
          padding: '24px 20px 20px',
          boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
        }}
      >
        <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6, lineHeight: 1.4 }}>
          Add a log?
        </p>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20, lineHeight: 1.5 }}>
          You completed &ldquo;{todo.title}&rdquo;. Want to log what happened?
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onAddLog}
            style={{
              flex: 1, padding: '10px 0', background: 'var(--sage)', color: '#fff',
              border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}
          >
            Add log
          </button>
          <button
            onClick={onSkip}
            style={{
              flex: 1, padding: '10px 0', background: 'var(--bg)',
              border: '1px solid var(--border)', color: 'var(--text-secondary)',
              borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: 'pointer',
            }}
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}
