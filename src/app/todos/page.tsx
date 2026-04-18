'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '@/lib/context';
import { categorizeTodos } from '@/lib/utils';
import { type Todo } from '@/lib/types';
import AddTodoModal from '@/components/AddTodoModal';
import AddLogModal from '@/components/AddLogModal';
import TodoLogPrompt from '@/components/TodoLogPrompt';
import { CaretLeft, CaretRight, CaretDown, Clock, ArrowsClockwise, Check, MagnifyingGlass, Funnel, X, List, CalendarBlank } from '@phosphor-icons/react';

type ViewMode = 'list' | 'calendar';

function fmtDue(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'numeric', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

export default function TodosPage() {
  const { data, currentPersona, toggleTodo, todosShepherdFilter: shepherdFilter, setTodosShepherdFilter: setShepherdFilter } = useApp();
  const [showAddTodo, setShowAddTodo] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [showAddLog, setShowAddLog] = useState(false);
  const [todoLogPrompt, setTodoLogPrompt] = useState<Todo | null>(null);
  const [pendingLogTodo, setPendingLogTodo] = useState<Todo | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const isAdmin = currentPersona.role === 'admin';

  // Search
  const [showSearch, setShowSearch] = useState(false);
  const [search, setSearch] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Shepherd filter (admin only)
  const [showFilter, setShowFilter] = useState(false);
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
        .filter((p) => (p.role === 'shepherd' || p.role === 'admin') && p.id !== currentPersona.id)
        .map((p) => ({ id: p.id, name: p.name })),
      ...data.people
        .filter((p) => p.isShepherd && !personaPersonIds.has(p.id) && p.id !== currentPersona.personId)
        .map((p) => ({ id: p.id, name: p.englishName })),
    ];
  })();

  const btnSize = scrolled ? 30 : 36;
  const btnFont = scrolled ? 13 : 14;
  const btnPad  = scrolled ? '0 12px' : '0 14px';

  const ActionButtons = () => (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      {/* View toggle */}
      <div style={{ display: 'flex', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
        <button
          onClick={() => setViewMode('list')}
          style={{
            width: btnSize, height: btnSize,
            background: viewMode === 'list' ? 'var(--sage-light)' : 'transparent',
            border: 'none', borderRight: '1px solid var(--border)',
            color: viewMode === 'list' ? 'var(--sage)' : 'var(--text-secondary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}
          aria-label="List view"
        >
          <List size={14} />
        </button>
        <button
          onClick={() => setViewMode('calendar')}
          style={{
            width: btnSize, height: btnSize,
            background: viewMode === 'calendar' ? 'var(--sage-light)' : 'transparent',
            border: 'none',
            color: viewMode === 'calendar' ? 'var(--sage)' : 'var(--text-secondary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}
          aria-label="Calendar view"
        >
          <CalendarBlank size={14} />
        </button>
      </div>
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
        <MagnifyingGlass size={14} />
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
            <Funnel size={14} />
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
        position: 'sticky', top: 0, zIndex: 20,
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
          <div style={{ paddingTop: 20, paddingBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h1 style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em', lineHeight: 1 }}>To-dos</h1>
            <ActionButtons />
          </div>
        )}
      </div>

      {/* Search bar */}
      {(showSearch || search) && (
        <div style={{ position: 'relative', marginBottom: 10, marginTop: 8 }}>
          <MagnifyingGlass size={14} color="var(--text-muted)" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
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
                <X size={9} />
              </button>
            );
          })}
        </div>
      )}

      {viewMode === 'calendar' ? (
        <CalendarView todos={myTodos} onToggle={handleToggle} onEdit={setEditingTodo} data={data} />
      ) : (
        <>
          {categorized.overdue.length > 0 && (
            <TodoSection label="Overdue" todos={categorized.overdue} onToggle={handleToggle} onEdit={setEditingTodo} data={data} labelColor="var(--red, #c0392b)" />
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
        </>
      )}

      {myTodos.length === 0 && (
        <div style={{ textAlign: 'center', padding: '64px 32px 32px' }}>
          <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>Nothing coming up</p>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: 260, margin: '0 auto' }}>
            To-dos are upcoming things to act on — a call to make, a visit to plan, or anything you want to follow up on.
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, maxWidth: 260, margin: '10px auto 0', fontWeight: 600 }}>
            Only assigned shepherds and pastors can see these.
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px 12px', flexShrink: 0, borderBottom: '1px solid var(--border-light)' }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Filter</h2>
              <button
                onClick={() => setShowFilter(false)}
                style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--bg)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}
              >
                <X size={12} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
              <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Shepherd by</p>
              <div style={{ position: 'relative', marginBottom: 10 }}>
                <MagnifyingGlass size={13} color="var(--text-muted)" style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
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

function CalendarView({ todos, onToggle, onEdit, data }: {
  todos: Todo[];
  onToggle: (id: string) => void;
  onEdit: (todo: Todo) => void;
  data: import('@/lib/types').AppData;
}) {
  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth()); // 0-indexed
  const [selectedDate, setSelectedDate] = useState<string | null>(null); // 'YYYY-MM-DD'

  const monthLabel = new Date(calYear, calMonth, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });

  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDow = new Date(calYear, calMonth, 1).getDay(); // 0=Sun

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

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear((y) => y - 1); }
    else setCalMonth((m) => m - 1);
    setSelectedDate(null);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear((y) => y + 1); }
    else setCalMonth((m) => m + 1);
    setSelectedDate(null);
  };

  const cells: (number | null)[] = [...Array(firstDow).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  const selectedTodos = selectedDate ? (todosByDate[selectedDate] ?? []) : [];

  return (
    <div>
      {/* Month nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <button
          onClick={prevMonth}
          style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <CaretLeft size={14} />
        </button>
        <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{monthLabel}</span>
        <button
          onClick={nextMonth}
          style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <CaretRight size={14} />
        </button>
      </div>

      {/* Day-of-week headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 4 }}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} style={{ textAlign: 'center', fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', paddingBottom: 4 }}>{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
        {cells.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} />;
          const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const dayTodos = todosByDate[dateStr] ?? [];
          const isToday = dateStr === todayStr;
          const isSelected = dateStr === selectedDate;
          const hasIncomplete = dayTodos.some((t) => !t.completed);
          const allComplete = dayTodos.length > 0 && dayTodos.every((t) => t.completed);

          return (
            <button
              key={dateStr}
              onClick={() => setSelectedDate(isSelected ? null : dateStr)}
              style={{
                aspectRatio: '1', borderRadius: 8,
                background: isSelected ? 'var(--sage)' : isToday ? 'var(--sage-light)' : 'transparent',
                border: isToday && !isSelected ? '1.5px solid var(--sage-mid)' : isSelected ? 'none' : '1px solid transparent',
                cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
                padding: 2,
              }}
            >
              <span style={{ fontSize: 13, fontWeight: isToday || isSelected ? 700 : 400, color: isSelected ? '#fff' : isToday ? 'var(--sage)' : 'var(--text-primary)', lineHeight: 1 }}>
                {day}
              </span>
              {dayTodos.length > 0 && (
                <div style={{ display: 'flex', gap: 2 }}>
                  {dayTodos.slice(0, 3).map((_, di) => (
                    <div key={di} style={{ width: 4, height: 4, borderRadius: '50%', background: isSelected ? 'rgba(255,255,255,0.8)' : allComplete ? 'var(--text-muted)' : hasIncomplete ? 'var(--sage)' : 'var(--text-muted)' }} />
                  ))}
                  {dayTodos.length > 3 && <div style={{ width: 4, height: 4, borderRadius: '50%', background: isSelected ? 'rgba(255,255,255,0.6)' : 'var(--border)' }} />}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected day todos */}
      {selectedDate && (
        <div style={{ marginTop: 16 }}>
          <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
            {new Date(`${selectedDate  }T00:00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} · {selectedTodos.length}
          </p>
          {selectedTodos.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text-muted)', padding: '12px 0' }}>No to-dos on this day.</p>
          ) : (
            <div className="no-last-border" style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
              {selectedTodos.map((t) => {
                const person = t.personId ? data.people.find((p) => p.id === t.personId) : null;
                const family = t.familyId ? data.families.find((f) => f.id === t.familyId) : null;
                const targetChips = [family?.label, person?.englishName].filter(Boolean) as string[];
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
                      {t.completed && <Check size={11} color="#fff" weight="bold" />}
                    </button>
                    <button
                      onClick={() => onEdit(t)}
                      style={{ flex: 1, minWidth: 0, background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', padding: 0 }}
                    >
                      <p style={{ fontSize: 14, color: t.completed ? 'var(--text-muted)' : 'var(--text-primary)', lineHeight: 1.4, marginBottom: 4, textDecoration: t.completed ? 'line-through' : 'none' }}>
                        {t.title}
                      </p>
                      {targetChips.length > 0 && (
                        <span style={{ fontSize: 10, color: 'var(--blue)', padding: '1px 6px', borderRadius: '999px', background: 'var(--blue-light)', fontWeight: 500 }}>
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
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 16 }}>
          {todos.filter((t) => !t.dueDate && !t.completed).length} to-do{todos.filter((t) => !t.dueDate && !t.completed).length !== 1 ? 's' : ''} with no due date — switch to list view to see them.
        </p>
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
        {checked && <Check size={10} color="#fff" weight="bold" />}
      </div>
      <span style={{ fontSize: 14, color: 'var(--text-primary)' }}>{children}</span>
    </button>
  );
}

function TodoSection({ label, todos, onToggle, onEdit, data, defaultOpen = true, labelColor }: {
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
    <div style={{ marginBottom: 16 }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '4px 0', marginBottom: open ? 8 : 0,
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 10, fontWeight: 600, color: labelColor ?? 'var(--text-muted)',
          textTransform: 'uppercase', letterSpacing: '0.06em',
        }}
      >
        {label} · {todos.length}
        <CaretDown size={10} style={{ transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }} />
      </button>
      {open && (
        <div className="no-last-border" style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
          {todos.map((t) => {
            const person = t.personId ? data.people.find((p) => p.id === t.personId) : null;
            const family = t.familyId ? data.families.find((f) => f.id === t.familyId) : null;
            const targetChips = [family?.label, person?.englishName].filter(Boolean) as string[];
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
                  {t.completed && <Check size={11} color="#fff" weight="bold" />}
                </button>
                <button
                  onClick={() => onEdit(t)}
                  style={{ flex: 1, minWidth: 0, background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', padding: 0 }}
                >
                  <p style={{ fontSize: 14, color: t.completed ? 'var(--text-muted)' : 'var(--text-primary)', lineHeight: 1.4, marginBottom: 4, textDecoration: t.completed ? 'line-through' : 'none' }}>
                    {t.title}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'nowrap', overflow: 'hidden' }}>
                    {t.dueDate && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)' }}>
                        <Clock size={12} />
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{fmtDue(t.dueDate)}</span>
                      </div>
                    )}
                    {hasRepeat && (
                      <ArrowsClockwise size={12} color="var(--text-muted)" />
                    )}
                    {targetChips.length > 0 && (
                      <span style={{ fontSize: 10, color: 'var(--blue)', padding: '1px 6px', borderRadius: '999px', background: 'var(--blue-light)', fontWeight: 500, flexShrink: 0 }}>
                        {targetChips[0]}
                      </span>
                    )}
                    {targetChips.length > 1 && (
                      <span style={{ fontSize: 10, color: 'var(--blue)', padding: '1px 6px', borderRadius: '999px', background: 'var(--blue-light)', fontWeight: 500, flexShrink: 0 }}>
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
