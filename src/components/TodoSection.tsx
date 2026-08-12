'use client';

import React from 'react';
import { CaretDown, Clock, ArrowsClockwise, Check } from '@phosphor-icons/react';
import { type Todo, type AppData } from '@/lib/types';
import { fullName, fmtDue } from '@/lib/utils';

export function TodoSection({
  label,
  todos,
  onToggle,
  onEdit,
  data,
  defaultOpen = true,
  labelColor,
}: {
  label: string;
  todos: Todo[];
  onToggle: (id: string) => void;
  onEdit: (todo: Todo) => void;
  data: AppData;
  defaultOpen?: boolean;
  labelColor?: string;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <div className="mb-4">
      <button
        onClick={() => setOpen(!open)}
        className="text-10 tracking-wide-6 flex cursor-pointer items-center gap-1.5 border-none bg-transparent px-0 py-1 font-semibold uppercase"
        style={{
          marginBottom: open ? '0.5rem' : 0,
          color: labelColor ?? 'var(--text-muted)',
        }}
      >
        {label} · {todos.length}
        <CaretDown
          size={10}
          style={{
            transition: 'transform 0.2s',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </button>
      {open && (
        <div className="no-last-border bg-surface overflow-hidden rounded p-0">
          {todos.map((t) => {
            const person = t.personId ? data.people.find((p) => p.id === t.personId) : null;
            const family = t.familyId ? data.families.find((f) => f.id === t.familyId) : null;
            const targetChips = [family?.label, person ? fullName(person) : undefined].filter(
              Boolean
            ) as string[];
            const hasRepeat = t.repeat && t.repeat !== 'none';
            return (
              <div
                key={t.id}
                className="row-card-hover border-border-light flex items-start gap-2.5 border-b pt-2.5 pb-2.5"
              >
                <button
                  aria-label={t.completed ? 'Mark as incomplete' : 'Mark as complete'}
                  onClick={() => onToggle(t.id)}
                  className="mt-0.5 flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-full"
                  style={{
                    border: t.completed ? 'none' : '0.125rem solid var(--border)',
                    background: t.completed ? 'var(--sage)' : 'transparent',
                  }}
                >
                  {t.completed && <Check size={11} color="var(--on-sage)" weight="bold" />}
                </button>
                <button
                  onClick={() => onEdit(t)}
                  className="min-w-0 flex-1 cursor-pointer border-none bg-transparent p-0 text-left"
                >
                  <p
                    className="text-14 leading-comfortable mb-1"
                    style={{
                      color: t.completed ? 'var(--text-muted)' : 'var(--text-primary)',
                      textDecoration: t.completed ? 'line-through' : 'none',
                    }}
                  >
                    {t.title}
                  </p>
                  <div className="flex flex-nowrap items-center gap-2.5 overflow-hidden">
                    {t.dueDate && (
                      <div className="text-text-muted flex items-center gap-1">
                        <Clock size={12} />
                        <span className="text-11 text-text-muted">{fmtDue(t.dueDate)}</span>
                      </div>
                    )}
                    {hasRepeat && <ArrowsClockwise size={12} color="var(--text-muted)" />}
                    {targetChips.length > 0 && (
                      <span className="text-10 text-blue rounded-pill bg-blue-light shrink-0 px-1.5 py-[0.0625rem] font-medium">
                        {targetChips[0]}
                      </span>
                    )}
                    {targetChips.length > 1 && (
                      <span className="text-10 text-blue rounded-pill bg-blue-light shrink-0 px-1.5 py-[0.0625rem] font-medium">
                        +{targetChips.length - 1}
                      </span>
                    )}
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
