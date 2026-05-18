'use client';

import { format, getDaysInMonth, getDay, parseISO } from 'date-fns';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '@/lib/context';
import { categorizeTodos, fullName } from '@/lib/utils';
import { filterTodos } from '@/lib/todo-utils';
import { type Todo } from '@/lib/types';
import AddTodoModal from '@/components/AddTodoModal';
import AddLogModal from '@/components/AddLogModal';
import PageContainer from '@/components/PageContainer';
import TodoLogPrompt from '@/components/TodoLogPrompt';
import HeaderInlineSearch from '@/components/HeaderInlineSearch';
import {
  CaretLeft,
  CaretRight,
  CaretDown,
  Clock,
  ArrowsClockwise,
  Check,
  MagnifyingGlass,
  Funnel,
  X,
  List,
  CalendarBlank,
  Plus,
} from '@phosphor-icons/react';
import { BACKDROP_COLOR, SHEET_MAX_WIDTH, SHEET_BORDER_RADIUS } from '@/lib/constants';
import { CheckRow } from '@/components/CheckRow';

type ViewMode = 'list' | 'calendar';

function fmtDue(iso: string) {
  return format(parseISO(iso), 'M/d/yyyy h:mm a');
}

export default function TodosPage() {
  const {
    data,
    currentPersona,
    toggleTodo,
    todosShepherdFilter: shepherdFilter,
    setTodosShepherdFilter: setShepherdFilter,
    setFullPageModalOpen,
  } = useApp();
  const [showAddTodo, setShowAddTodo] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [showAddLog, setShowAddLog] = useState(false);
  const [todoLogPrompt, setTodoLogPrompt] = useState<Todo | null>(null);
  const [pendingLogTodo, setPendingLogTodo] = useState<Todo | null>(null);
  const [viewingLinkedTodo, setViewingLinkedTodo] = useState<Todo | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const isAdmin = currentPersona.role === 'admin';

  // Search
  const [showSearch, setShowSearch] = useState(false);
  const [search, setSearch] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const desktopSearchInputRef = useRef<HTMLInputElement>(null);

  // Shepherd filter (admin only)
  const [showFilter, setShowFilter] = useState(false);

  React.useEffect(() => {
    setFullPageModalOpen(
      !!(
        showAddTodo ||
        editingTodo ||
        showFilter ||
        showAddLog ||
        todoLogPrompt ||
        viewingLinkedTodo
      )
    );
    return () => setFullPageModalOpen(false);
  }, [
    showAddTodo,
    editingTodo,
    showFilter,
    showAddLog,
    todoLogPrompt,
    viewingLinkedTodo,
    setFullPageModalOpen,
  ]);
  const [draftFilter, setDraftFilter] = useState<string[]>(['mine']);
  const [shepherdSearch, setShepherdSearch] = useState('');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setSearch('');
    setShowSearch(false);
  }, [currentPersona.id]);

  useEffect(() => {
    if (!showFilter) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [showFilter]);

  const openFilter = () => {
    setDraftFilter(shepherdFilter);
    setShepherdSearch('');
    setShowFilter(true);
  };
  const applyFilter = () => {
    setShepherdFilter(draftFilter);
    setShowFilter(false);
  };
  const clearFilter = () => {
    setDraftFilter([]);
  };

  const myTodos = filterTodos(data.todos, {
    isAdmin,
    currentPersona,
    shepherdFilter,
    search,
    data,
  });

  const categorized = categorizeTodos(myTodos);

  const handleToggle = (todoId: string) => {
    const todo = data.todos.find((t) => t.id === todoId);
    if (todo && !todo.completed) {
      toggleTodo(todoId);
      setTodoLogPrompt(todo);
    } else {
      toggleTodo(todoId);
    }
  };

  const activeFilterCount = shepherdFilter.length;
  const filterActive = isAdmin && activeFilterCount > 0;

  const shepherdEntries = (() => {
    const personaPersonIds = new Set(data.personas.map((p) => p.personId).filter(Boolean));
    return [
      ...data.personas
        .filter((p) => (p.role === 'shepherd' || p.role === 'admin') && p.id !== currentPersona.id)
        .map((p) => ({ id: p.id, name: p.name })),
      ...data.people
        .filter(
          (p) => p.isShepherd && !personaPersonIds.has(p.id) && p.id !== currentPersona.personId
        )
        .map((p) => ({ id: p.id, name: fullName(p) })),
    ];
  })();

  const btnSize = scrolled ? 30 : 36;
  const btnFont = scrolled ? 'var(--text-13)' : 'var(--text-14)';
  const btnPad = scrolled ? '0 0.75rem' : '0 0.875rem';

  const actionButtons = (
    <div className="flex gap-2 items-center">
      {/* Search — hidden on desktop when expanded */}
      <div className={showSearch ? 'lg:hidden' : undefined}>
        <button
          type="button"
          aria-label={showSearch ? 'Close search' : 'Search'}
          onClick={() => {
            if (showSearch) {
              setShowSearch(false);
              setSearch('');
            } else {
              setShowSearch(true);
              window.scrollTo({ top: 0, behavior: 'smooth' });
              setTimeout(() => {
                searchInputRef.current?.focus();
                desktopSearchInputRef.current?.focus();
              }, 50);
            }
          }}
          className="rounded-xs flex items-center justify-center cursor-pointer shrink-0"
          style={{
            width: btnSize,
            height: btnSize,
            background: showSearch || search ? 'var(--sage-light)' : 'transparent',
            border: showSearch || search ? '1px solid var(--sage-mid)' : '1px solid var(--border)',
            color: showSearch || search ? 'var(--sage)' : 'var(--text-secondary)',
          }}
        >
          <MagnifyingGlass size={14} />
        </button>
      </div>
      <HeaderInlineSearch
        search={search}
        setSearch={setSearch}
        show={showSearch}
        inputRef={desktopSearchInputRef}
        placeholder="Search to-dos…"
        ariaLabel="Search to-dos"
        height={btnSize}
        onClose={() => setShowSearch(false)}
      />
      {/* Filter (admin only) */}
      {isAdmin && (
        <div className="relative shrink-0">
          <button
            onClick={openFilter}
            className="rounded-xs flex items-center justify-center cursor-pointer"
            style={{
              width: btnSize,
              height: btnSize,
              background: filterActive ? 'var(--sage-light)' : 'transparent',
              border: filterActive ? '1px solid var(--sage-mid)' : '1px solid var(--border)',
              color: filterActive ? 'var(--sage)' : 'var(--text-secondary)',
            }}
          >
            <Funnel size={14} />
          </button>
          {filterActive && (
            <span
              className="absolute -top-[0.3125rem] -right-[0.3125rem] w-[0.9375rem] h-[0.9375rem] bg-sage text-on-sage text-9 font-bold flex items-center justify-center pointer-events-none rounded-full"
            >
              {activeFilterCount}
            </span>
          )}
        </div>
      )}
      {/* Add to-do */}
      <button
        onClick={() => setShowAddTodo(true)}
        className="rounded-xs bg-sage text-on-sage font-semibold border-none cursor-pointer flex items-center gap-1"
        style={{
          height: btnSize,
          padding: btnPad,
          fontSize: btnFont,
        }}
      >
        <Plus size={15} weight="bold" />
        To-do
      </button>
    </div>
  );

  return (
    <PageContainer>
    <div className="pb-8">
      {/* Sticky collapsing header */}
      <div
        className="-mx-4 px-4 lg:mx-0 lg:px-0 sticky top-0 bg-bg z-sticky"
        style={{
          borderBottom: scrolled ? '1px solid var(--border-light)' : 'none',
        }}
      >
        {scrolled ? (
          <div className="h-11 flex items-center justify-between">
            <span className="text-17 font-semibold text-text-primary tracking-tight-1">
              To-dos
            </span>
            {actionButtons}
          </div>
        ) : (
          <div className="pt-5 pb-3.5 flex items-center justify-between">
            <h1 className="text-32 font-extrabold text-text-primary tracking-tight-3 leading-none">
              To-dos
            </h1>
            {actionButtons}
          </div>
        )}
      </div>

      {/* Search bar */}
      {(showSearch || search) && (
        <div
          className="lg:hidden relative mb-2.5 mt-2"
        >
          <MagnifyingGlass
            size={14}
            color="var(--text-muted)"
            style={{
              position: 'absolute',
              left: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
            }}
          />
          <input
            ref={searchInputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search to-dos…"
            className="w-full pl-8 pr-3 py-2 bg-surface border border-border rounded-sm text-14 text-text-primary outline-none"
          />
        </div>
      )}

      {/* Filter chips + view toggle row */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex gap-1.5 flex-wrap items-center">
          {isAdmin &&
            shepherdFilter.map((sid) => {
              const label =
                sid === 'mine'
                  ? 'My Sheep'
                  : (data.personas.find((p) => p.id === sid)?.name ?? sid);
              return (
                <button
                  key={sid}
                  onClick={() => setShepherdFilter((f) => f.filter((s) => s !== sid))}
                  className="flex items-center gap-1 rounded-pill bg-sage-light border border-sage-mid text-sage-dark text-11 font-medium cursor-pointer py-[0.1875rem] px-[0.5625rem]"
                >
                  {label}
                  <X size={9} />
                </button>
              );
            })}
        </div>
        <div
          className="flex bg-surface border border-border rounded-xs overflow-hidden shrink-0"
        >
          <button
            onClick={() => setViewMode('list')}
            className="border-none border-r border-border flex items-center justify-center cursor-pointer"
            style={{
              width: 30,
              height: 30,
              background: viewMode === 'list' ? 'var(--sage-light)' : 'transparent',
              color: viewMode === 'list' ? 'var(--sage)' : 'var(--text-secondary)',
            }}
            aria-label="List view"
          >
            <List size={14} />
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className="border-none flex items-center justify-center cursor-pointer"
            style={{
              width: 30,
              height: 30,
              background: viewMode === 'calendar' ? 'var(--sage-light)' : 'transparent',
              color: viewMode === 'calendar' ? 'var(--sage)' : 'var(--text-secondary)',
            }}
            aria-label="Calendar view"
          >
            <CalendarBlank size={14} />
          </button>
        </div>
      </div>

      {viewMode === 'calendar' ? (
        <CalendarView todos={myTodos} onToggle={handleToggle} onEdit={setEditingTodo} data={data} />
      ) : (
        <>
          {categorized.overdue.length > 0 && (
            <TodoSection
              label="Overdue"
              todos={categorized.overdue}
              onToggle={handleToggle}
              onEdit={setEditingTodo}
              data={data}
              labelColor="var(--red, #c0392b)"
            />
          )}
          {categorized.today.length > 0 && (
            <TodoSection
              label="Today"
              todos={categorized.today}
              onToggle={handleToggle}
              onEdit={setEditingTodo}
              data={data}
            />
          )}
          {categorized.upcoming.length > 0 && (
            <TodoSection
              label="Upcoming"
              todos={categorized.upcoming}
              onToggle={handleToggle}
              onEdit={setEditingTodo}
              data={data}
            />
          )}
          {categorized.noDueDate.length > 0 && (
            <TodoSection
              label="No due date"
              todos={categorized.noDueDate}
              onToggle={handleToggle}
              onEdit={setEditingTodo}
              data={data}
            />
          )}
          {categorized.completed.length > 0 && (
            <TodoSection
              label="Completed"
              todos={categorized.completed}
              onToggle={handleToggle}
              onEdit={setEditingTodo}
              data={data}
              defaultOpen={false}
            />
          )}
        </>
      )}

      {myTodos.length === 0 && (
        <div className="text-center pt-16 px-8 pb-8">
          <p className="text-15 font-semibold text-text-secondary mb-2">
            Nothing coming up
          </p>
          <p
            className="text-13 text-text-muted leading-loose mx-auto max-w-[16.25rem]"
          >
            To-dos are upcoming things to act on — a call to make, a visit to plan, or anything you
            want to follow up on.
          </p>
          <p
            className="text-12 text-text-muted leading-normal font-semibold mx-auto mt-2.5 max-w-[16.25rem]"
          >
            Only assigned shepherds and pastors can see these.
          </p>
        </div>
      )}

      {showAddTodo && <AddTodoModal onClose={() => setShowAddTodo(false)} />}
      {editingTodo && <AddTodoModal onClose={() => setEditingTodo(null)} todo={editingTodo} />}
      {showAddLog && (
        <AddLogModal
          onClose={() => {
            setShowAddLog(false);
            setPendingLogTodo(null);
          }}
          prefillFamilyId={pendingLogTodo?.familyId}
          prefillPersonId={pendingLogTodo?.personId}
          prefillContent={pendingLogTodo?.title}
          prefillType="check-in"
          prefillTodoId={pendingLogTodo?.id}
          prefillDate={pendingLogTodo?.completedAt}
          onOpenTodo={(todoId) => {
            const t = data.todos.find((x) => x.id === todoId);
            if (t) {
              setViewingLinkedTodo(t);
              setShowAddLog(false);
            }
          }}
        />
      )}
      {viewingLinkedTodo && (
        <AddTodoModal
          todo={viewingLinkedTodo}
          onClose={() => {
            setViewingLinkedTodo(null);
            setPendingLogTodo(null);
          }}
          onBack={() => {
            setViewingLinkedTodo(null);
            setShowAddLog(true);
          }}
        />
      )}
      {todoLogPrompt && (
        <TodoLogPrompt
          todo={todoLogPrompt}
          onAddLog={() => {
            setPendingLogTodo(todoLogPrompt);
            setTodoLogPrompt(null);
            setShowAddLog(true);
          }}
          onSkip={() => setTodoLogPrompt(null)}
        />
      )}

      {/* Filter bottom sheet (admin only) */}
      {showFilter && (
        <div
          className="fixed inset-0 flex items-end justify-center z-dropdown bg-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowFilter(false);
          }}
        >
          <div
            className="animate-slide-up bg-surface w-full flex flex-col overflow-hidden"
            style={{
              borderRadius: SHEET_BORDER_RADIUS,
              maxWidth: SHEET_MAX_WIDTH,
              maxHeight: 'calc(100dvh - 5rem)',
            }}
          >
            <div
              className="flex items-center justify-between pt-3.5 px-5 pb-3 shrink-0 border-b border-border-light"
            >
              <h2 className="text-16 font-bold text-text-primary">
                Filter
              </h2>
              <button
                onClick={() => setShowFilter(false)}
                className="w-7 h-7 rounded-full bg-bg border-none cursor-pointer flex items-center justify-center text-text-muted"
              >
                <X size={12} />
              </button>
            </div>

            <div className="grow overflow-y-auto py-4 px-5">
              <p className="text-10 font-semibold text-text-muted uppercase tracking-wide-6 mb-2.5">
                Shepherd by
              </p>
              <div className="relative mb-2.5">
                <MagnifyingGlass
                  size={13}
                  color="var(--text-muted)"
                  style={{
                    position: 'absolute',
                    left: 9,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none',
                  }}
                />
                <input
                  type="text"
                  value={shepherdSearch}
                  onChange={(e) => setShepherdSearch(e.target.value)}
                  placeholder="Search…"
                  className="w-full pl-7 pr-2.5 py-[0.4375rem] bg-bg border border-border rounded-xs text-13 text-text-primary outline-none box-border"
                />
              </div>
              {('my sheep'.includes(shepherdSearch.toLowerCase()) ||
                currentPersona.name.toLowerCase().includes(shepherdSearch.toLowerCase())) && (
                <CheckRow
                  checked={draftFilter.includes('mine')}
                  onToggle={() =>
                    setDraftFilter((d) =>
                      d.includes('mine') ? d.filter((s) => s !== 'mine') : [...d, 'mine']
                    )
                  }
                >
                  My Sheep ({currentPersona.name})
                </CheckRow>
              )}
              {shepherdEntries
                .filter(
                  (e) =>
                    shepherdSearch === '' ||
                    e.name.toLowerCase().includes(shepherdSearch.toLowerCase())
                )
                .map((e) => (
                  <CheckRow
                    key={e.id}
                    checked={draftFilter.includes(e.id)}
                    onToggle={() =>
                      setDraftFilter((d) =>
                        d.includes(e.id) ? d.filter((s) => s !== e.id) : [...d, e.id]
                      )
                    }
                  >
                    {e.name}
                  </CheckRow>
                ))}
            </div>

            <div
              className="pt-2.5 px-5 pb-4 shrink-0 border-t border-border-light flex gap-3"
            >
              <button
                onClick={clearFilter}
                className="flex-1 bg-transparent border-none text-14 font-semibold text-text-secondary cursor-pointer py-3 px-0"
              >
                Clear
              </button>
              <button
                onClick={applyFilter}
                className="flex-[2] bg-sage text-on-sage border-none rounded text-15 font-semibold cursor-pointer py-3 px-0"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </PageContainer>
  );
}

function CalendarView({
  todos,
  onToggle,
  onEdit,
  data,
}: {
  todos: Todo[];
  onToggle: (id: string) => void;
  onEdit: (todo: Todo) => void;
  data: import('@/lib/types').AppData;
}) {
  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth()); // 0-indexed
  const [selectedDate, setSelectedDate] = useState<string | null>(null); // 'YYYY-MM-DD'

  const daysInMonth = getDaysInMonth(new Date(calYear, calMonth));
  const firstDow = getDay(new Date(calYear, calMonth, 1)); // 0=Sun

  // Map 'YYYY-MM-DD' -> todos with that due date
  const todosByDate = useMemo(() => {
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
  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  const selectedTodos = selectedDate ? (todosByDate[selectedDate] ?? []) : [];

  return (
    <div>
      {/* Month nav */}
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

      {/* Day-of-week headers */}
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

      {/* Calendar grid */}
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

      {/* Selected day todos */}
      {selectedDate && (
        <div className="mt-4">
          <p className="text-10 font-semibold text-text-muted uppercase tracking-wide-6 mb-2">
            {format(parseISO(`${selectedDate}T00:00:00`), 'EEEE, MMMM d')} · {selectedTodos.length}
          </p>
          {selectedTodos.length === 0 ? (
            <p className="text-13 text-text-muted py-3">
              No to-dos on this day.
            </p>
          ) : (
            <div
              className="no-last-border bg-surface rounded overflow-hidden"
            >
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
                      onClick={() => onToggle(t.id)}
                      className="rounded-full shrink-0 mt-0.5 flex items-center justify-center cursor-pointer"
                      style={{
                        width: 20,
                        height: 20,
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
                        <span
                          className="text-10 text-blue rounded-pill bg-blue-light font-medium py-[0.0625rem] px-1.5"
                        >
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

      {/* No-date todos note */}
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

function TodoSection({
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
  data: import('@/lib/types').AppData;
  defaultOpen?: boolean;
  labelColor?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="mb-4">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 py-1 px-0 bg-transparent border-none cursor-pointer text-10 font-semibold uppercase tracking-wide-6"
        style={{
          marginBottom: open ? 8 : 0,
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
        <div
          className="no-last-border bg-surface rounded overflow-hidden"
        >
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
                className="row-card-hover flex items-start gap-2.5 pt-2.5 pb-2.5 border-b border-border-light"
              >
                <button
                  onClick={() => onToggle(t.id)}
                  className="rounded-full shrink-0 mt-0.5 flex items-center justify-center cursor-pointer"
                  style={{
                    width: 20,
                    height: 20,
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
                  <div className="flex items-center gap-2.5 flex-nowrap overflow-hidden">
                    {t.dueDate && (
                      <div className="flex items-center gap-1 text-text-muted">
                        <Clock size={12} />
                        <span className="text-11 text-text-muted">
                          {fmtDue(t.dueDate)}
                        </span>
                      </div>
                    )}
                    {hasRepeat && <ArrowsClockwise size={12} color="var(--text-muted)" />}
                    {targetChips.length > 0 && (
                      <span
                        className="text-10 text-blue rounded-pill bg-blue-light font-medium shrink-0 py-[0.0625rem] px-1.5"
                      >
                        {targetChips[0]}
                      </span>
                    )}
                    {targetChips.length > 1 && (
                      <span
                        className="text-10 text-blue rounded-pill bg-blue-light font-medium shrink-0 py-[0.0625rem] px-1.5"
                      >
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
