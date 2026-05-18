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
      className="fixed inset-0 flex items-center justify-center px-6 z-sheet bg-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onSkip();
      }}
    >
      <div
        className="animate-slide-up bg-surface rounded-xl w-full pt-6 px-5 pb-5 shadow-elevated"
        style={{ maxWidth: 360 }}
      >
        <p className="text-15 font-semibold text-text-primary mb-1.5 leading-comfortable">
          Add a log?
        </p>
        <p className="text-13 text-text-muted mb-5 leading-normal">
          You completed &ldquo;{todo.title}&rdquo;. Want to log what happened?
        </p>
        <div className="flex gap-2.5">
          <button
            onClick={onAddLog}
            className="flex-1 py-2.5 bg-sage text-on-sage border-none rounded-sm text-14 font-semibold cursor-pointer"
          >
            Add log
          </button>
          <button
            onClick={onSkip}
            className="flex-1 py-2.5 bg-bg border border-border text-text-secondary rounded-sm text-14 font-medium cursor-pointer"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}
