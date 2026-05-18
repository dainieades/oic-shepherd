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
      <div className="flex items-center justify-between mb-3">
        <span className="text-15 font-semibold text-text-primary">
          <span className="text-text-primary">{format(new Date(calYear, calMonth, 1), 'MMMM')}</span>
          {' '}
          <span className="text-text-muted font-normal">{calYear}</span>
        </span>
        <div className="flex gap-1 items-center">
          <button
            onClick={prevMonth}
            className="w-8 h-8 rounded-xs border border-border bg-transparent text-text-secondary cursor-pointer flex items-center justify-center"
          >
            <CaretLeft size={14} />
          </button>
          <button
            onClick={() => {
              setCalMonth(today.getMonth());
              setCalYear(today.getFullYear());
              setSelectedDate(null);
            }}
            className="h-8 px-3 rounded-xs border border-border bg-transparent text-text-secondary text-13 font-medium cursor-pointer"
          >
            Today
          </button>
          <button
            onClick={nextMonth}
            className="w-8 h-8 rounded-xs border border-border bg-transparent text-text-secondary cursor-pointer flex items-center justify-center"
          >
            <CaretRight size={14} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 mb-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div
            key={d}
            className="text-center text-10 font-semibold text-text-muted uppercase tracking-wide-4 pb-1"
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
                      className="w-1 h-1 rounded-full shrink-0"
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
                      className="w-1 h-1 rounded-full shrink-0"
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
                      style={isSelected ? { background: 'rgba(255,255,255,0.2)', color: 'var(--on-sage)', textDecoration: t.completed ? 'line-through' : 'none' } : {}}
                      onClick={(e) => { e.stopPropagation(); onEdit(t); }}
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
          <p className="text-10 font-semibold text-text-muted uppercase tracking-wide-6 mb-2">
            {format(parseISO(`${selectedDate}T00:00:00`), 'EEEE, MMMM d')} · {selectedTodos.length}
          </p>
          {selectedTodos.length === 0 ? (
            <p className="text-13 text-text-muted py-3">No to-dos on this day.</p>
          ) : (
            <div className="no-last-border bg-surface rounded overflow-hidden">
              {selectedTodos.map((t) => {
                const person = t.personId ? data.people.find((p) => p.id === t.personId) : null;
                const family = t.familyId ? data.families.find((f) => f.id === t.familyId) : null;
                const targetChips = [family?.label, person ? fullName(person) : undefined].filter(
                  Boolean
                ) as string[];
                return (
                  <div
                    key={t.id}
                    className="row-card-hover flex items-start gap-2.5 pt-2.5 pb-2.5 border-b border-border-light"
                  >
                    <button
                      aria-label={t.completed ? 'Mark as incomplete' : 'Mark as complete'}
                      onClick={() => onToggle(t.id)}
                      className="w-5 h-5 rounded-full shrink-0 mt-0.5 flex items-center justify-center cursor-pointer"
                      style={{
                        border: t.completed ? 'none' : '0.125rem solid var(--border)',
                        background: t.completed ? 'var(--sage)' : 'transparent',
                      }}
                    >
                      {t.completed && <Check size={11} color="var(--on-sage)" weight="bold" />}
                    </button>
                    <button
                      onClick={() => onEdit(t)}
                      className="flex-1 min-w-0 bg-transparent border-none text-left cursor-pointer p-0"
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
                        <span className="text-10 text-blue rounded-pill bg-blue-light font-medium py-[0.0625rem] px-1.5">
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
