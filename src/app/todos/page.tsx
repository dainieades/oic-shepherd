'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  MagnifyingGlass,
  Funnel,
  X,
  List,
  CalendarBlank,
  Plus,
} from '@phosphor-icons/react';
import { BACKDROP_COLOR, SHEET_MAX_WIDTH, SHEET_BORDER_RADIUS } from '@/lib/constants';
import { CheckRow } from '@/components/CheckRow';
import { TodoSection } from '@/components/TodoSection';
import { CalendarView } from '@/components/CalendarView';

type ViewMode = 'list' | 'calendar';

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

