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
      className="z-sheet bg-backdrop fixed inset-0 flex items-center justify-center px-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) onSkip();
      }}
    >
      <div
        className="animate-slide-up bg-surface shadow-elevated w-full rounded-xl px-5 pt-6 pb-5"
        style={{ maxWidth: 360 }}
      >
        <p className="text-15 text-text-primary leading-comfortable mb-1.5 font-semibold">
          Add a log?
        </p>
        <p className="text-13 text-text-muted mb-5 leading-normal">
          You completed &ldquo;{todo.title}&rdquo;. Want to log what happened?
        </p>
        <div className="flex gap-2.5">
          <button
            onClick={onAddLog}
            className="bg-sage text-on-sage text-14 flex-1 cursor-pointer rounded-sm border-none py-2.5 font-semibold"
          >
            Add log
          </button>
          <button
            onClick={onSkip}
            className="bg-bg border-border text-text-secondary text-14 flex-1 cursor-pointer rounded-sm border py-2.5 font-medium"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}
