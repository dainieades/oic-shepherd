'use client';

import React from 'react';
import { format, getDaysInMonth, getDay, parseISO } from 'date-fns';
import { CaretLeft, CaretRight, Check } from '@phosphor-icons/react';
import { type Todo, type AppData } from '@/lib/types';
import { fullName } from '@/lib/utils';

export function CalendarView({
  todos,
  onToggle,
  onEdit,
  data,
}: {
  todos: Todo[];
  onToggle: (id: string) => void;
  onEdit: (todo: Todo) => void;
  data: AppData;
}) {
  const today = new Date();
  const [calYear, setCalYear] = React.useState(today.getFullYear());
  const [calMonth, setCalMonth] = React.useState(today.getMonth());
  const [selectedDate, setSelectedDate] = React.useState<string | null>(null);

  const daysInMonth = getDaysInMonth(new Date(calYear, calMonth));
  const firstDow = getDay(new Date(calYear, calMonth, 1));

  const todosByDate = React.useMemo(() => {
    const map: Record<string, Todo[]> = {};
    for (const t of todos) {
      if (!t.dueDate) continue;
      const d = t.dueDate.slice(0, 10);
      if (!map[d]) map[d] = [];
      map[d].push(t);
    }
    return map;
  }, [todos]);

  const todayStr = format(today, 'yyyy-MM-dd');

  const prevMonth = () => {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear((y) => y - 1);
    } else setCalMonth((m) => m - 1);
    setSelectedDate(null);
  };
  const nextMonth = () => {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear((y) => y + 1);
    } else setCalMonth((m) => m + 1);
    setSelectedDate(null);
  };

  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const selectedTodos = selectedDate ? (todosByDate[selectedDate] ?? []) : [];

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-15 text-text-primary font-semibold">
          <span className="text-text-primary">
            {format(new Date(calYear, calMonth, 1), 'MMMM')}
          </span>{' '}
          <span className="text-text-muted font-normal">{calYear}</span>
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={prevMonth}
            className="border-border text-text-secondary flex h-8 w-8 cursor-pointer items-center justify-center rounded-xs border bg-transparent"
          >
            <CaretLeft size={14} />
          </button>
          <button
            onClick={() => {
              setCalMonth(today.getMonth());
              setCalYear(today.getFullYear());
              setSelectedDate(null);
            }}
            className="border-border text-text-secondary text-13 h-8 cursor-pointer rounded-xs border bg-transparent px-3 font-medium"
          >
            Today
          </button>
          <button
            onClick={nextMonth}
            className="border-border text-text-secondary flex h-8 w-8 cursor-pointer items-center justify-center rounded-xs border bg-transparent"
          >
            <CaretRight size={14} />
          </button>
        </div>
      </div>

      <div className="mb-1 grid grid-cols-7">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div
            key={d}
            className="text-10 text-text-muted tracking-wide-4 pb-1 text-center font-semibold uppercase"
          >
            {d}
          </div>
        ))}
      </div>

      <div className="calendar-grid grid grid-cols-7 gap-[0.1875rem]">
        {cells.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} className="calendar-tile-empty" />;
          const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const dayTodos = todosByDate[dateStr] ?? [];
          const isToday = dateStr === todayStr;
          const isSelected = dateStr === selectedDate;
          const hasIncomplete = dayTodos.some((t) => !t.completed);
          const allComplete = dayTodos.length > 0 && dayTodos.every((t) => t.completed);

          return (
            <button
              key={dateStr}
              className="calendar-tile cursor-pointer"
              onClick={() => setSelectedDate(isSelected ? null : dateStr)}
              style={{
                background: isSelected
                  ? 'var(--sage)'
                  : isToday
                    ? 'var(--sage-light)'
                    : 'var(--surface)',
                border:
                  isToday && !isSelected
                    ? '0.09375rem solid var(--sage-mid)'
                    : isSelected
                      ? 'none'
                      : '0.0625rem solid transparent',
              }}
            >
              <span
                className="text-10 leading-none"
                style={{
                  fontWeight: isToday || isSelected ? 'var(--font-bold)' : 'var(--font-normal)',
                  color: isSelected
                    ? 'var(--on-sage)'
                    : isToday
                      ? 'var(--sage)'
                      : 'var(--text-secondary, var(--text-muted))',
                }}
              >
                {day}
              </span>
              {dayTodos.length > 0 && (
                <span className="calendar-dots flex gap-0.5">
                  {dayTodos.slice(0, 3).map((_, di) => (
                    <span
                      key={di}
                      className="h-1 w-1 shrink-0 rounded-full"
                      style={{
                        background: isSelected
                          ? 'rgba(255,255,255,0.8)'
                          : allComplete
                            ? 'var(--text-muted)'
                            : hasIncomplete
                              ? 'var(--sage)'
                              : 'var(--text-muted)',
                      }}
                    />
                  ))}
                  {dayTodos.length > 3 && (
                    <span
                      className="h-1 w-1 shrink-0 rounded-full"
                      style={{
                        background: isSelected ? 'rgba(255,255,255,0.6)' : 'var(--border)',
                      }}
                    />
                  )}
                </span>
              )}
              {dayTodos.length > 0 && (
                <ul className="calendar-todo-list">
                  {dayTodos.slice(0, 2).map((t) => (
                    <li
                      key={t.id}
                      className={`calendar-todo-item ${t.completed ? 'calendar-todo-item--done' : 'calendar-todo-item--pending'}`}
                      style={
                        isSelected
                          ? {
                              background: 'rgba(255,255,255,0.2)',
                              color: 'var(--on-sage)',
                              textDecoration: t.completed ? 'line-through' : 'none',
                            }
                          : {}
                      }
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(t);
                      }}
                    >
                      {t.title}
                    </li>
                  ))}
                  {dayTodos.length > 2 && (
                    <li
                      className="calendar-todo-item calendar-todo-item--more"
                      style={isSelected ? { color: 'rgba(255,255,255,0.7)' } : {}}
                    >
                      +{dayTodos.length - 2} more
                    </li>
                  )}
                </ul>
              )}
            </button>
          );
        })}
      </div>

      {selectedDate && (
        <div className="mt-4">
          <p className="text-10 text-text-muted tracking-wide-6 mb-2 font-semibold uppercase">
            {format(parseISO(`${selectedDate}T00:00:00`), 'EEEE, MMMM d')} · {selectedTodos.length}
          </p>
          {selectedTodos.length === 0 ? (
            <p className="text-13 text-text-muted py-3">No to-dos on this day.</p>
          ) : (
            <div className="no-last-border bg-surface overflow-hidden rounded">
              {selectedTodos.map((t) => {
                const person = t.personId ? data.people.find((p) => p.id === t.personId) : null;
                const family = t.familyId ? data.families.find((f) => f.id === t.familyId) : null;
                const targetChips = [family?.label, person ? fullName(person) : undefined].filter(
                  Boolean
                ) as string[];
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
                      {targetChips.length > 0 && (
                        <span className="text-10 text-blue rounded-pill bg-blue-light px-1.5 py-[0.0625rem] font-medium">
                          {targetChips[0]}
                        </span>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {todos.filter((t) => !t.dueDate && !t.completed).length > 0 && (
        <p className="text-12 text-text-muted mt-4">
          {todos.filter((t) => !t.dueDate && !t.completed).length} to-do
          {todos.filter((t) => !t.dueDate && !t.completed).length !== 1 ? 's' : ''} with no due date
          — switch to list view to see them.
        </p>
      )}
    </div>
  );
}
