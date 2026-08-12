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
import { MagnifyingGlass, Funnel, X, List, CalendarBlank, Plus } from '@phosphor-icons/react';
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
    <div className="flex items-center gap-2">
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
          className="flex shrink-0 cursor-pointer items-center justify-center rounded-xs"
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
            className="flex cursor-pointer items-center justify-center rounded-xs"
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
            <span className="bg-sage text-on-sage text-9 pointer-events-none absolute -top-[0.3125rem] -right-[0.3125rem] flex h-[0.9375rem] w-[0.9375rem] items-center justify-center rounded-full font-bold">
              {activeFilterCount}
            </span>
          )}
        </div>
      )}
      {/* Add to-do */}
      <button
        onClick={() => setShowAddTodo(true)}
        className="bg-sage text-on-sage flex cursor-pointer items-center gap-1 rounded-xs border-none font-semibold"
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
          className="bg-bg z-sticky sticky top-0 -mx-4 px-4 lg:mx-0 lg:px-0"
          style={{
            borderBottom: scrolled ? '1px solid var(--border-light)' : 'none',
          }}
        >
          {scrolled ? (
            <div className="flex h-11 items-center justify-between">
              <span className="text-17 text-text-primary tracking-tight-1 font-semibold">
                To-dos
              </span>
              {actionButtons}
            </div>
          ) : (
            <div className="flex items-center justify-between pt-5 pb-3.5">
              <h1 className="text-32 text-text-primary tracking-tight-3 leading-none font-extrabold">
                To-dos
              </h1>
              {actionButtons}
            </div>
          )}
        </div>

        {/* Search bar */}
        {(showSearch || search) && (
          <div className="relative mt-2 mb-2.5 lg:hidden">
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
              className="bg-surface border-border text-14 text-text-primary w-full rounded-sm border py-2 pr-3 pl-8 outline-none"
            />
          </div>
        )}

        {/* Filter chips + view toggle row */}
        <div className="mb-2.5 flex items-center justify-between">
          <div className="flex flex-wrap items-center gap-1.5">
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
                    className="rounded-pill bg-sage-light border-sage-mid text-sage-dark text-11 flex cursor-pointer items-center gap-1 border px-[0.5625rem] py-[0.1875rem] font-medium"
                  >
                    {label}
                    <X size={9} />
                  </button>
                );
              })}
          </div>
          <div className="bg-surface border-border flex shrink-0 overflow-hidden rounded-xs border">
            <button
              onClick={() => setViewMode('list')}
              className="border-border flex cursor-pointer items-center justify-center border-r border-none"
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
              className="flex cursor-pointer items-center justify-center border-none"
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
          <CalendarView
            todos={myTodos}
            onToggle={handleToggle}
            onEdit={setEditingTodo}
            data={data}
          />
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
          <div className="px-8 pt-16 pb-8 text-center">
            <p className="text-15 text-text-secondary mb-2 font-semibold">Nothing coming up</p>
            <p className="text-13 text-text-muted mx-auto max-w-[16.25rem] leading-loose">
              To-dos are upcoming things to act on — a call to make, a visit to plan, or anything
              you want to follow up on.
            </p>
            <p className="text-12 text-text-muted mx-auto mt-2.5 max-w-[16.25rem] leading-normal font-semibold">
              Only assigned shepherds and admins can see these.
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
            className="z-dropdown bg-backdrop fixed inset-0 flex items-end justify-center"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowFilter(false);
            }}
          >
            <div
              className="animate-slide-up bg-surface flex w-full flex-col overflow-hidden"
              style={{
                borderRadius: SHEET_BORDER_RADIUS,
                maxWidth: SHEET_MAX_WIDTH,
                maxHeight: 'calc(100dvh - 5rem)',
              }}
            >
              <div className="border-border-light flex shrink-0 items-center justify-between border-b px-5 pt-3.5 pb-3">
                <h2 className="text-16 text-text-primary font-bold">Filter</h2>
                <button
                  onClick={() => setShowFilter(false)}
                  className="bg-bg text-text-muted flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border-none"
                >
                  <X size={12} />
                </button>
              </div>

              <div className="grow overflow-y-auto px-5 py-4">
                <p className="text-10 text-text-muted tracking-wide-6 mb-2.5 font-semibold uppercase">
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
                    className="bg-bg border-border text-13 text-text-primary box-border w-full rounded-xs border py-[0.4375rem] pr-2.5 pl-7 outline-none"
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

              <div className="border-border-light flex shrink-0 gap-3 border-t px-5 pt-2.5 pb-4">
                <button
                  onClick={clearFilter}
                  className="text-14 text-text-secondary flex-1 cursor-pointer border-none bg-transparent px-0 py-3 font-semibold"
                >
                  Clear
                </button>
                <button
                  onClick={applyFilter}
                  className="bg-sage text-on-sage text-15 flex-[2] cursor-pointer rounded border-none px-0 py-3 font-semibold"
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
