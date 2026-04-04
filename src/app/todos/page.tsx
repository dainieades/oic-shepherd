'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '@/lib/context';
import { categorizeTodos } from '@/lib/utils';
import { Todo, TodoAlert, TodoRepeat } from '@/lib/types';
import AddTodoModal from '@/components/AddTodoModal';
import AddLogModal from '@/components/AddLogModal';
import TodoLogPrompt from '@/components/TodoLogPrompt';

const ALERT_LABELS: Record<TodoAlert, string> = {
  'none': '',
  'on-time': 'On time',
  '5min': '5 min before',
  '15min': '15 min before',
  '30min': '30 min before',
  '1hour': '1 hr before',
  '1day': '1 day before',
  '2days': '2 days before',
};

function fmtDue(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'numeric', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

export default function TodosPage() {
  const { data, currentPersona, toggleTodo } = useApp();
  const [showAddTodo, setShowAddTodo] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [showAddLog, setShowAddLog] = useState(false);
  const [todoLogPrompt, setTodoLogPrompt] = useState<Todo | null>(null);
  const [pendingLogTodo, setPendingLogTodo] = useState<Todo | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const isAdmin = currentPersona.role === 'admin';

  // Search
  const [showSearch, setShowSearch] = useState(false);
  const [search, setSearch] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Shepherd filter (admin only)
  const [shepherdFilter, setShepherdFilter] = useState<string[]>(['mine']);
  const [showFilter, setShowFilter] = useState(false);
  const [draftFilter, setDraftFilter] = useState<string[]>(['mine']);
  const [shepherdSearch, setShepherdSearch] = useState('');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setShepherdFilter(['mine']);
    setDraftFilter(['mine']);
    setSearch('');
    setShowSearch(false);
  }, [currentPersona.id]);

  const openFilter = () => { setDraftFilter(shepherdFilter); setShepherdSearch(''); setShowFilter(true); };
  const applyFilter = () => { setShepherdFilter(draftFilter); setShowFilter(false); };
  const clearFilter = () => { setDraftFilter([]); };

  const shepherdPeopleIds = (shepherdId: string): string[] => {
    const persona = data.personas.find((p) => p.id === shepherdId);
    return persona?.assignedPeopleIds ?? [];
  };

  const todoMatchesShepherdFilter = (t: Todo): boolean => {
    if (shepherdFilter.length === 0) return true;
    return shepherdFilter.some((sid) => {
      const ids = sid === 'mine' ? currentPersona.assignedPeopleIds : shepherdPeopleIds(sid);
      if (t.personId) return ids.includes(t.personId);
      if (t.familyId) {
        const family = data.families.find((f) => f.id === t.familyId);
        return family ? family.memberIds.some((mid) => ids.includes(mid)) : false;
      }
      return t.createdBy === currentPersona.id;
    });
  };

  const todoMatchesSearch = (t: Todo): boolean => {
    if (!search) return true;
    const q = search.toLowerCase();
    if (t.title.toLowerCase().includes(q)) return true;
    if (t.personId) {
      const p = data.people.find((p) => p.id === t.personId);
      if (p?.englishName.toLowerCase().includes(q) || p?.chineseName?.toLowerCase().includes(q)) return true;
    }
    if (t.familyId) {
      const f = data.families.find((f) => f.id === t.familyId);
      if (f?.label.toLowerCase().includes(q)) return true;
    }
    return false;
  };

  const myTodos = data.todos.filter((t) => {
    if (isAdmin) return todoMatchesShepherdFilter(t) && todoMatchesSearch(t);
    // Shepherds: only their scope
    const inScope = (() => {
      if (t.createdBy === currentPersona.id) return true;
      if (t.personId && currentPersona.assignedPeopleIds.includes(t.personId)) return true;
      if (t.familyId) {
        const family = data.families.find((f) => f.id === t.familyId);
        if (family && family.memberIds.some((mid) => currentPersona.assignedPeopleIds.includes(mid))) return true;
      }
      return false;
    })();
    return inScope && todoMatchesSearch(t);
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
        .filter((p) => p.role === 'shepherd' || p.role === 'admin')
        .map((p) => ({ id: p.id, name: p.name })),
      ...data.people
        .filter((p) => p.isShepherd && !personaPersonIds.has(p.id))
        .map((p) => ({ id: p.id, name: p.englishName })),
    ];
  })();

  const btnSize = scrolled ? 30 : 36;
  const btnFont = scrolled ? 13 : 14;
  const btnPad  = scrolled ? '0 12px' : '0 14px';

  const ActionButtons = () => (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      {/* Search */}
      <button
        onClick={() => {
          if (showSearch) { setShowSearch(false); setSearch(''); }
          else { setShowSearch(true); setTimeout(() => searchInputRef.current?.focus(), 50); }
        }}
        style={{
          width: btnSize, height: btnSize, borderRadius: 8,
          background: (showSearch || search) ? 'var(--sage-light)' : 'transparent',
          border: (showSearch || search) ? '1px solid var(--sage-mid)' : '1px solid var(--border)',
          color: (showSearch || search) ? 'var(--sage)' : 'var(--text-secondary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
        }}
      >
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
      </button>
      {/* Filter (admin only) */}
      {isAdmin && (
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <button
            onClick={openFilter}
            style={{
              width: btnSize, height: btnSize, borderRadius: 8,
              background: filterActive ? 'var(--sage-light)' : 'transparent',
              border: filterActive ? '1px solid var(--sage-mid)' : '1px solid var(--border)',
              color: filterActive ? 'var(--sage)' : 'var(--text-secondary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            }}
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
            </svg>
          </button>
          {filterActive && (
            <span style={{
              position: 'absolute', top: -5, right: -5,
              width: 15, height: 15, borderRadius: '50%',
              background: 'var(--sage)', color: '#fff',
              fontSize: 9, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              pointerEvents: 'none',
            }}>{activeFilterCount}</span>
          )}
        </div>
      )}
      {/* Add to-do */}
      <button
        onClick={() => setShowAddTodo(true)}
        style={{ height: btnSize, padding: btnPad, borderRadius: 8, background: 'var(--sage)', color: '#fff', fontSize: btnFont, fontWeight: 600, border: 'none', cursor: 'pointer' }}
      >
        + To-do
      </button>
    </div>
  );

  return (
    <div style={{ paddingBottom: 32 }}>
      {/* Sticky collapsing header */}
      <div style={{
        position: 'sticky', top: 36, zIndex: 20,
        background: 'var(--bg)',
        marginLeft: -16, marginRight: -16,
        paddingLeft: 16, paddingRight: 16,
        borderBottom: scrolled ? '1px solid var(--border-light)' : 'none',
      }}>
        {scrolled ? (
          <div style={{ height: 44, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 17, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>To-dos</span>
            <ActionButtons />
          </div>
        ) : (
          <div style={{ paddingTop: 20, paddingBottom: 14, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <h1 style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em', lineHeight: 1 }}>To-dos</h1>
            <ActionButtons />
          </div>
        )}
      </div>

      {/* Search bar */}
      {(showSearch || search) && (
        <div style={{ position: 'relative', marginBottom: 10, marginTop: 8 }}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="var(--text-muted)" strokeWidth={1.8}
            style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            ref={searchInputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search to-dos…"
            style={{
              width: '100%', paddingLeft: 32, paddingRight: 12, paddingTop: 8, paddingBottom: 8,
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 10, fontSize: 14, color: 'var(--text-primary)', outline: 'none',
            }}
          />
        </div>
      )}

      {/* Active filter chips (admin only) */}
      {isAdmin && shepherdFilter.length > 0 && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
          {shepherdFilter.map((sid) => {
            const label = sid === 'mine' ? 'My Sheep' : (data.personas.find((p) => p.id === sid)?.name ?? sid);
            return (
              <button
                key={sid}
                onClick={() => setShepherdFilter((f) => f.filter((s) => s !== sid))}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  padding: '3px 9px', borderRadius: '999px',
                  background: 'var(--sage-light)', border: '1px solid var(--sage-mid)',
                  color: 'var(--sage-dark)', fontSize: 11, fontWeight: 500, cursor: 'pointer',
                }}
              >
                {label}
                <svg width="9" height="9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            );
          })}
        </div>
      )}

      {categorized.today.length > 0 && (
        <TodoSection label="Today" todos={categorized.today} onToggle={handleToggle} onEdit={setEditingTodo} data={data} />
      )}
      {categorized.upcoming.length > 0 && (
        <TodoSection label="Upcoming" todos={categorized.upcoming} onToggle={handleToggle} onEdit={setEditingTodo} data={data} />
      )}
      {categorized.noDueDate.length > 0 && (
        <TodoSection label="No due date" todos={categorized.noDueDate} onToggle={handleToggle} onEdit={setEditingTodo} data={data} />
      )}
      {categorized.completed.length > 0 && (
        <TodoSection label="Completed" todos={categorized.completed} onToggle={handleToggle} onEdit={setEditingTodo} data={data} defaultOpen={false} />
      )}

      {myTodos.length === 0 && (
        <div style={{ textAlign: 'center', padding: '64px 32px 32px' }}>
          <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>Nothing coming up</p>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: 260, margin: '0 auto' }}>
            To-dos are for future follow-ups — a call to make, a visit to plan, a birthday coming up, or anything you want to remember to do.
          </p>
        </div>
      )}

      {showAddTodo && <AddTodoModal onClose={() => setShowAddTodo(false)} />}
      {editingTodo && <AddTodoModal onClose={() => setEditingTodo(null)} todo={editingTodo} />}
      {showAddLog && (
        <AddLogModal
          onClose={() => { setShowAddLog(false); setPendingLogTodo(null); }}
          prefillFamilyId={pendingLogTodo?.familyId}
          prefillPersonId={pendingLogTodo?.personId}
          prefillContent={pendingLogTodo?.title}
          prefillType="check-in"
        />
      )}
      {todoLogPrompt && (
        <TodoLogPrompt
          todo={todoLogPrompt}
          onAddLog={() => { setPendingLogTodo(todoLogPrompt); setTodoLogPrompt(null); setShowAddLog(true); }}
          onSkip={() => setTodoLogPrompt(null)}
        />
      )}

      {/* Filter bottom sheet (admin only) */}
      {showFilter && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(30,26,24,0.45)', zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowFilter(false); }}
        >
          <div
            className="animate-slide-up"
            style={{
              background: 'var(--surface)', borderRadius: '20px 20px 0 0',
              width: '100%', maxWidth: 430,
              maxHeight: 'calc(100dvh - 80px)',
              display: 'flex', flexDirection: 'column', overflow: 'hidden',
            }}
          >
            <div style={{ width: 36, height: 4, background: 'var(--border)', borderRadius: 2, margin: '14px auto 0', flexShrink: 0 }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px 12px', flexShrink: 0, borderBottom: '1px solid var(--border-light)' }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Filter</h2>
              <button
                onClick={() => setShowFilter(false)}
                style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--bg)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}
              >
                <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
              <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Shepherd by</p>
              <div style={{ position: 'relative', marginBottom: 10 }}>
                <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="var(--text-muted)" strokeWidth={2}
                  style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
                <input
                  type="text"
                  value={shepherdSearch}
                  onChange={(e) => setShepherdSearch(e.target.value)}
                  placeholder="Search…"
                  style={{
                    width: '100%', paddingLeft: 28, paddingRight: 10, paddingTop: 7, paddingBottom: 7,
                    background: 'var(--bg)', border: '1px solid var(--border)',
                    borderRadius: 8, fontSize: 13, color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' as const,
                  }}
                />
              </div>
              {'my sheep'.includes(shepherdSearch.toLowerCase()) && (
                <CheckRow
                  checked={draftFilter.includes('mine')}
                  onToggle={() => setDraftFilter((d) => d.includes('mine') ? d.filter((s) => s !== 'mine') : [...d, 'mine'])}
                >My Sheep</CheckRow>
              )}
              {shepherdEntries
                .filter((e) => shepherdSearch === '' || e.name.toLowerCase().includes(shepherdSearch.toLowerCase()))
                .map((e) => (
                  <CheckRow
                    key={e.id}
                    checked={draftFilter.includes(e.id)}
                    onToggle={() => setDraftFilter((d) => d.includes(e.id) ? d.filter((s) => s !== e.id) : [...d, e.id])}
                  >{e.name}</CheckRow>
                ))}
            </div>

            <div style={{ padding: '10px 20px 16px', flexShrink: 0, borderTop: '1px solid var(--border-light)', display: 'flex', gap: 12 }}>
              <button onClick={clearFilter} style={{ flex: 1, background: 'none', border: 'none', fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer', padding: '12px 0' }}>
                Clear
              </button>
              <button onClick={applyFilter} style={{ flex: 2, background: 'var(--sage)', color: '#fff', border: 'none', borderRadius: 'var(--radius)', padding: '12px 0', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CheckRow({ checked, onToggle, children }: { checked: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onToggle}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
        padding: '9px 0', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
      }}
    >
      <div style={{
        width: 18, height: 18, borderRadius: 4, flexShrink: 0,
        border: checked ? 'none' : '1.5px solid var(--border)',
        background: checked ? 'var(--sage)' : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {checked && (
          <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        )}
      </div>
      <span style={{ fontSize: 14, color: 'var(--text-primary)' }}>{children}</span>
    </button>
  );
}

function TodoSection({ label, todos, onToggle, onEdit, data, defaultOpen = true }: {
  label: string;
  todos: Todo[];
  onToggle: (id: string) => void;
  onEdit: (todo: Todo) => void;
  data: import('@/lib/types').AppData;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: 16 }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '4px 0', marginBottom: open ? 8 : 0,
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 10, fontWeight: 600, color: 'var(--text-muted)',
          textTransform: 'uppercase', letterSpacing: '0.06em',
        }}
      >
        {label} · {todos.length}
        <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} style={{ transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      {open && (
        <div className="no-last-border" style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
          {todos.map((t) => {
            const person = t.personId ? data.people.find((p) => p.id === t.personId) : null;
            const family = t.familyId ? data.families.find((f) => f.id === t.familyId) : null;
            const tag = family?.label || person?.englishName || '';
            const hasAlert = t.alert && t.alert !== 'none';
            const hasRepeat = t.repeat && t.repeat !== 'none';
            return (
              <div key={t.id} className="row-card-hover" style={{ display: 'flex', alignItems: 'flex-start', gap: 10, paddingTop: 10, paddingBottom: 10, borderBottom: '1px solid var(--border-light)' }}>
                <button
                  onClick={() => onToggle(t.id)}
                  style={{
                    width: 20, height: 20, borderRadius: '50%', flexShrink: 0, marginTop: 2,
                    border: t.completed ? 'none' : '2px solid var(--border)',
                    background: t.completed ? 'var(--sage)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  }}
                >
                  {t.completed && (
                    <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  )}
                </button>
                <button
                  onClick={() => onEdit(t)}
                  style={{ flex: 1, minWidth: 0, background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', padding: 0 }}
                >
                  <p style={{ fontSize: 14, color: t.completed ? 'var(--text-muted)' : 'var(--text-primary)', lineHeight: 1.4, marginBottom: 4, textDecoration: t.completed ? 'line-through' : 'none' }}>
                    {t.title}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {t.dueDate && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)' }}>
                        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                          <circle cx="12" cy="12" r="9" /><path strokeLinecap="round" d="M12 7v5l3 3" />
                        </svg>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{fmtDue(t.dueDate)}</span>
                      </div>
                    )}
                    {hasAlert && (
                      <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="var(--text-muted)" strokeWidth={1.8} aria-label={ALERT_LABELS[t.alert!]}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                      </svg>
                    )}
                    {hasRepeat && (
                      <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="var(--text-muted)" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                      </svg>
                    )}
                    {tag && (
                      <span style={{ fontSize: 10, color: 'var(--blue)', padding: '1px 6px', borderRadius: '999px', background: 'var(--blue-light)', fontWeight: 500 }}>
                        {tag}
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
