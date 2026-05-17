'use client';

import { type Todo } from '@/lib/types';
import { BACKDROP_COLOR, Z_SHEET } from '@/lib/constants';

interface TodoLogPromptProps {
  todo: Todo;
  onAddLog: () => void;
  onSkip: () => void;
}

export default function TodoLogPrompt({ todo, onAddLog, onSkip }: TodoLogPromptProps) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: Z_SHEET,
        background: BACKDROP_COLOR,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 1.5rem',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onSkip();
      }}
    >
      <div
        className="animate-slide-up"
        style={{
          background: 'var(--surface)',
          borderRadius: 'var(--radius-xl)',
          width: '100%',
          maxWidth: 360,
          padding: '1.5rem 1.25rem 1.25rem',
          boxShadow: 'var(--shadow-elevated)',
        }}
      >
        <p
          style={{
            fontSize: 'var(--text-15)',
            fontWeight: 'var(--font-semibold)',
            color: 'var(--text-primary)',
            marginBottom: 6,
            lineHeight: 'var(--leading-comfortable)',
          }}
        >
          Add a log?
        </p>
        <p style={{ fontSize: 'var(--text-13)', color: 'var(--text-muted)', marginBottom: 20, lineHeight: 'var(--leading-normal)' }}>
          You completed &ldquo;{todo.title}&rdquo;. Want to log what happened?
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onAddLog}
            style={{
              flex: 1,
              padding: '0.625rem 0',
              background: 'var(--sage)',
              color: 'var(--on-sage)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              fontSize: 'var(--text-14)',
              fontWeight: 'var(--font-semibold)',
              cursor: 'pointer',
            }}
          >
            Add log
          </button>
          <button
            onClick={onSkip}
            style={{
              flex: 1,
              padding: '0.625rem 0',
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)',
              borderRadius: 'var(--radius-sm)',
              fontSize: 'var(--text-14)',
              fontWeight: 'var(--font-medium)',
              cursor: 'pointer',
            }}
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}
