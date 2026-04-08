'use client';

import { use, useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApp } from '@/lib/context';
import { getTimeAgo, getMembershipLabel, getChurchAttendanceLabel, getPersonNotes, getNoteTypeLabel, groupByMonth, categorizeTodos } from '@/lib/utils';
import { Todo, Note, AppData, TodoAlert, NoteType, AppRole } from '@/lib/types';
import AddLogModal from '@/components/AddLogModal';
import AddTodoModal from '@/components/AddTodoModal';
import TodoLogPrompt from '@/components/TodoLogPrompt';
import EditPersonDrawer from '@/components/EditPersonDrawer';
import GroupPreviewModal from '@/components/GroupPreviewModal';
import { Notepad, CheckCircle, Info, Globe, Pulse, GenderIntersex, Cake, Heart, Sparkle, Church, IdentificationCard, CalendarCheck, Drop, Compass, Buildings, Phone, PhoneCall, Envelope, House, FirstAid, HandHeart, UsersFour, PencilSimple } from '@phosphor-icons/react';

type Tab = 'logs' | 'todos' | 'info' | 'sheep';

const TAB_LABELS: Record<Tab, string> = { logs: 'Logs', todos: 'To-dos', info: 'Info', sheep: 'Sheep' };

function TabIcon({ tab, active }: { tab: Tab; active: boolean }) {
  const weight = active ? 'fill' : 'regular';
  if (tab === 'logs') return <Notepad size={16} weight={weight} />;
  if (tab === 'todos') return <CheckCircle size={16} weight={weight} />;
  if (tab === 'sheep') return <HandHeart size={16} weight={weight} />;
  return <Info size={16} weight={weight} />;
}

const ALERT_LABELS: Record<TodoAlert, string> = {
  'none': '', 'on-time': 'On time', '5min': '5 min before', '15min': '15 min before',
  '30min': '30 min before', '1hour': '1 hr before', '1day': '1 day before', '2days': '2 days before',
};

function fmtDue(iso: string) {
  return new Date(iso).toLocaleString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

const noteTypeColors: Record<string, { bg: string; color: string }> = {
  'check-in':       { bg: 'var(--sage-light)', color: 'var(--sage)' },
  'prayer-request': { bg: '#F0EBF5', color: '#7A6A8C' },
  'event':          { bg: 'var(--blue-light)', color: 'var(--blue)' },
  'general':        { bg: 'var(--border-light)', color: 'var(--text-secondary)' },
};

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase();
}


export default function PersonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data, currentPersona, toggleTodo, canViewNote, updatePerson, deletePerson, assignShepherds } = useApp();
  // Compute permission early so we can pick the correct initial tab
  const _personCheck = data.people.find((p) => p.id === id);
  const _canManageCheck = _personCheck
    ? (currentPersona.role === 'admin' || currentPersona.personId === _personCheck.id || currentPersona.assignedPeopleIds.includes(_personCheck.id))
    : true;
  const initialTab: Tab = _canManageCheck ? ((searchParams.get('tab') as Tab | null) ?? 'logs') : 'info';
  const [tab, setTabState] = useState<Tab>(initialTab);

  const setTab = (t: Tab) => {
    setTabState(t);
    router.replace(`/person/${id}?tab=${t}`, { scroll: false });
  };
  const [showAddLog, setShowAddLog] = useState(false);
  const [showAddTodo, setShowAddTodo] = useState(false);
  const [showSheepPicker, setShowSheepPicker] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [todoLogPrompt, setTodoLogPrompt] = useState<Todo | null>(null);
  const [pendingLogTodo, setPendingLogTodo] = useState<Todo | null>(null);
  const [showEditPerson, setShowEditPerson] = useState(false);
  const [previewGroupId, setPreviewGroupId] = useState<string | null>(null);
  const [showKebab, setShowKebab] = useState(false);
  const [showPhotoMenu, setShowPhotoMenu] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'archive' | 'delete' | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const kebabRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!showKebab) return;
    const handler = (e: MouseEvent) => {
      if (kebabRef.current && !kebabRef.current.contains(e.target as Node)) {
        setShowKebab(false);
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [showKebab]);

  const person = data.people.find((p) => p.id === id);
  if (!person) {
    return <div style={{ paddingTop: 64, textAlign: 'center', color: 'var(--text-muted)' }}>Person not found</div>;
  }

  // Permission: can manage this person if admin, or they are in my assigned people, or it's myself
  const canManage = (() => {
    if (currentPersona.role === 'admin') return true;
    if (currentPersona.personId === person.id) return true;
    return currentPersona.assignedPeopleIds.includes(person.id);
  })();

  // Any shepherd or admin can edit info (canManage is stricter — only for tabs/logs)
  const canEdit = currentPersona.role === 'admin' || currentPersona.role === 'shepherd';

  const family    = person.familyId ? data.families.find((f) => f.id === person.familyId) : null;
  const groups    = data.groups.filter((g) => person.groupIds.includes(g.id));
  const shepherds = data.personas.filter((p) => person.assignedShepherdIds.includes(p.id));
  const notes     = getPersonNotes(person.id, data.notes).filter((n) => canViewNote(n));
  const todos     = data.todos.filter((t) => t.personId === person.id);
  const categorized = categorizeTodos(todos);

  // Shepherd → Sheep relationship
  const shepherdPersona = person.isShepherd ? data.personas.find((p) => p.personId === person.id) : null;
  // For isShepherd people without a persona, their shepherd ID is their own person ID
  const shepherdId = shepherdPersona?.id ?? (person.isShepherd ? person.id : null);
  const sheep = shepherdId
    ? data.people.filter((p) => p.assignedShepherdIds.includes(shepherdId))
    : [];

  // Build the visible tabs — non-managers see only Info; shepherds also see Sheep
  const visibleTabs: Tab[] = !canManage
    ? ['info']
    : person.isShepherd
    ? ['logs', 'todos', 'sheep', 'info']
    : ['logs', 'todos', 'info'];

  // If the active tab isn't in the visible set (e.g. persona switched), clamp to info
  const activeTab = visibleTabs.includes(tab) ? tab : 'info';

  const firstName = person.englishName.split(' ')[0];
  const initials = person.englishName.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();

  const handlePhotoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      updatePerson(person.id, { photo: reader.result as string });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleTodoToggle = (todoId: string) => {
    const todo = data.todos.find((t) => t.id === todoId);
    if (todo && !todo.completed) {
      toggleTodo(todoId);
      setTodoLogPrompt(todo);
    } else {
      toggleTodo(todoId);
    }
  };

  const addAction = () => {
    if (activeTab === 'logs') setShowAddLog(true);
    else if (activeTab === 'todos') setShowAddTodo(true);
  };

  const handleArchive = () => {
    updatePerson(person.id, { churchAttendance: person.churchAttendance === 'archived' ? 'regular' : 'archived' });
    setConfirmAction(null);
    if (person.churchAttendance !== 'archived') router.back();
  };

  const handleDelete = () => {
    deletePerson(person.id);
    setConfirmAction(null);
    router.back();
  };

  return (
    <div style={{ paddingBottom: 32 }}>

      {/* ── Nav bar ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 40,
        background: 'var(--bg)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: 54,
      }}>
        <button
          onClick={() => router.back()}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--sage)', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back
        </button>

        <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)', flex: 1, textAlign: 'center', padding: '0 8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {firstName}
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {activeTab === 'sheep' ? (
            <button
              onClick={() => setShowSheepPicker(true)}
              style={{ height: scrolled ? 30 : 36, padding: scrolled ? '0 10px' : '0 12px', borderRadius: 8, background: 'var(--sage)', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: scrolled ? 13 : 14, fontWeight: 600, whiteSpace: 'nowrap' }}
            >
              <PencilSimple size={scrolled ? 13 : 15} weight="bold" />
              Sheep
            </button>
          ) : activeTab === 'info' ? (
            canEdit && (
              <button
                onClick={() => setShowEditPerson(true)}
                style={{ height: scrolled ? 30 : 36, padding: scrolled ? '0 10px' : '0 12px', borderRadius: 8, background: 'var(--sage)', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: scrolled ? 13 : 14, fontWeight: 600, whiteSpace: 'nowrap' }}
              >
                <PencilSimple size={scrolled ? 13 : 15} weight="bold" />
                Info
              </button>
            )
          ) : (
            <button
              onClick={activeTab === 'logs' ? () => setShowAddLog(true) : () => setShowAddTodo(true)}
              style={{ height: scrolled ? 30 : 36, padding: scrolled ? '0 12px' : '0 14px', borderRadius: 8, background: 'var(--sage)', color: '#fff', fontSize: scrolled ? 13 : 14, fontWeight: 600, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              {activeTab === 'logs' ? '+ Log' : '+ To-do'}
            </button>
          )}

          {canEdit && (
            <div ref={kebabRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setShowKebab((v) => !v)}
                style={{ width: scrolled ? 30 : 36, height: scrolled ? 30 : 36, borderRadius: '50%', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="5" r="1.5" />
                  <circle cx="12" cy="12" r="1.5" />
                  <circle cx="12" cy="19" r="1.5" />
                </svg>
              </button>
              {showKebab && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 50,
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 12, boxShadow: '0 8px 28px rgba(0,0,0,0.12)',
                  minWidth: 180, overflow: 'hidden',
                }}>
                  <button
                    onClick={() => { setShowKebab(false); setShowEditPerson(true); }}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '13px 16px', background: 'none', border: 'none', borderBottom: '1px solid var(--border-light)', cursor: 'pointer', fontSize: 14, color: 'var(--text-primary)', textAlign: 'left' }}
                  >
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                    </svg>
                    Edit info
                  </button>
                  <button
                    onClick={() => { setShowKebab(false); setConfirmAction('archive'); }}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '13px 16px', background: 'none', border: 'none', borderBottom: '1px solid var(--border-light)', cursor: 'pointer', fontSize: 14, color: 'var(--text-primary)', textAlign: 'left' }}
                  >
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-.375c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v.375c0 .621.504 1.125 1.125 1.125z" />
                    </svg>
                    {person.churchAttendance === 'archived' ? 'Unarchive' : 'Archive'}
                  </button>
                  <button
                    onClick={() => { setShowKebab(false); setConfirmAction('delete'); }}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '13px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--red)', textAlign: 'left' }}
                  >
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                    Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Large title — scrolls away ── */}
      <div style={{ padding: '28px 0 20px', display: 'flex', alignItems: 'center', gap: 16 }}>

        {/* Avatar */}
        <button
          onClick={() => setShowPhotoMenu(true)}
          style={{ flexShrink: 0, width: 72, height: 72, borderRadius: '50%', padding: 0, border: 'none', cursor: 'pointer', position: 'relative', background: 'none' }}
        >
          {person.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={person.photo} alt={person.englishName} style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', display: 'block' }} />
          ) : (
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'var(--sage-light)', border: '2px dashed var(--sage)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, fontWeight: 700, color: 'var(--sage)',
            }}>
              {initials}
            </div>
          )}
          {/* Camera badge */}
          <div style={{
            position: 'absolute', bottom: 0, right: 0,
            width: 22, height: 22, borderRadius: '50%',
            background: 'var(--sage)', border: '2px solid var(--bg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
            </svg>
          </div>
        </button>

        {/* Name + meta */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 7, flexWrap: 'wrap', marginBottom: 5 }}>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.15, letterSpacing: '-0.02em' }}>
              {person.englishName}
            </h1>
            {person.chineseName && (
              <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--text-muted)' }}>{person.chineseName}</span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              {getMembershipLabel(person.membershipStatus)}
            </span>
            {person.lastContactDate && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>·</span>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  Logged {new Date(person.lastContactDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </span>
            )}
            {groups.map((g) => (
              <button key={g.id} onClick={() => setPreviewGroupId(g.id)} style={{
                fontSize: 11, padding: '2px 7px', borderRadius: '999px',
                background: 'var(--blue-light)', color: 'var(--blue)', fontWeight: 600,
                border: 'none', cursor: 'pointer',
              }}>
                {g.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoFile} />

      {/* ── Tabs — sticky below nav bar (36 + 44 = 80px) ── */}
      {visibleTabs.length > 1 && <div style={{
        position: 'sticky', top: 90, zIndex: 39,
        background: 'var(--bg)',
        display: 'flex', borderBottom: '2px solid var(--border-light)', marginBottom: 20,
      }}>
        {visibleTabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t as Tab)}
            style={{
              flex: 1, padding: '10px 0', fontSize: 13, fontWeight: activeTab === t ? 700 : 400,
              color: activeTab === t ? 'var(--sage)' : 'var(--text-muted)',
              background: 'none', border: 'none', cursor: 'pointer',
              borderBottom: activeTab === t ? '2px solid var(--sage)' : '2px solid transparent',
              marginBottom: -2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            }}
          >
            <TabIcon tab={t as Tab} active={activeTab === t} />
            {TAB_LABELS[t as Tab]}
          </button>
        ))}
      </div>}

      {/* Logs tab */}
      {activeTab === 'logs' && (
        <div>
          {notes.length === 0 && (
            <div style={{ textAlign: 'center', padding: '32px 20px' }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>No logs yet</p>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: 240, margin: '0 auto' }}>
                Logs capture past interactions — a conversation, a check-in, a prayer request, or a moment you shared together.
              </p>
            </div>
          )}
          {groupByMonth(notes).map((group) => {
            const rows = group.items.map((note) => {
              const typeStyle = noteTypeColors[note.type] || noteTypeColors.general;
              const creator = data.personas.find((p) => p.id === note.createdBy);
              return (
                <button key={note.id} onClick={() => setEditingNote(note)} className="row-card-hover" style={{ textAlign: 'left', cursor: 'pointer', border: 'none', paddingTop: 10, paddingBottom: 10, borderBottom: '1px solid var(--border-light)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: '999px', background: typeStyle.bg, color: typeStyle.color }}>{getNoteTypeLabel(note.type).toUpperCase()}</span>
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{getTimeAgo(note.createdAt)}</span>
                  </div>
                  {note.content && <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{note.content}</p>}
                  <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>by {creator?.name ?? 'Unknown'}</p>
                </button>
              );
            });
            return (
              <LogSection key={group.label} label={group.label} count={group.items.length}>
                <div className="no-last-border" style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', overflow: 'hidden', padding: 0 }}>{rows}</div>
              </LogSection>
            );
          })}
        </div>
      )}

      {/* Todos tab */}
      {activeTab === 'todos' && (
        <div>
          {categorized.today.length > 0 && <TodoSection label="Today" todos={categorized.today} onToggle={handleTodoToggle} onEdit={setEditingTodo} data={data} />}
          {categorized.upcoming.length > 0 && <TodoSection label="Upcoming" todos={categorized.upcoming} onToggle={handleTodoToggle} onEdit={setEditingTodo} data={data} />}
          {categorized.noDueDate.length > 0 && <TodoSection label="No due date" todos={categorized.noDueDate} onToggle={handleTodoToggle} onEdit={setEditingTodo} data={data} />}
          {categorized.completed.length > 0 && <TodoSection label="Completed" todos={categorized.completed} onToggle={handleTodoToggle} onEdit={setEditingTodo} data={data} defaultOpen={false} />}
          {todos.length === 0 && (
            <div style={{ textAlign: 'center', padding: '32px 20px' }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Nothing scheduled yet</p>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: 240, margin: '0 auto' }}>
                To-dos are upcoming things to act on — a call to make, a visit to plan, or anything you want to follow up on.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Sheep tab — only for shepherds */}
      {activeTab === 'sheep' && person.isShepherd && (
        <div>
          {sheep.length === 0 && (
            <p style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic', paddingTop: 24, textAlign: 'center' }}>No sheep assigned yet.</p>
          )}
          {sheep.length > 0 && (
            <div className="no-last-border" style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
              {sheep.map((s) => {
                const sFamily = s.familyId ? data.families.find((f) => f.id === s.familyId) : null;
                const sInitials = s.englishName.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
                return (
                  <Link key={s.id} href={`/person/${s.id}`} className="row-card-hover" style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 10, paddingBottom: 10, borderBottom: '1px solid var(--border-light)', textDecoration: 'none' }}>
                    {s.photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={s.photo} alt={s.englishName} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--sage-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'var(--sage)', flexShrink: 0 }}>
                        {sInitials}
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{s.englishName}</span>
                        {s.chineseName && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.chineseName}</span>}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {getMembershipLabel(s.membershipStatus)}
                        {sFamily && <span> · {sFamily.label}</span>}
                        {s.lastContactDate && <span> · Logged {new Date(s.lastContactDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
                      </div>
                    </div>
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="var(--text-muted)" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Info tab */}
      {activeTab === 'info' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* ACCESS */}
          {(() => {
            const role = (person.appRole ?? 'no-access') as AppRole;
            const roleLabel: Record<AppRole, string> = { admin: 'Admin', shepherd: 'Shepherd', 'welcome-team': 'Welcome Team', 'no-access': 'No Access' };
            const roleColor: Record<AppRole, { bg: string; color: string }> = {
              admin: { bg: '#EDE9FE', color: '#6D28D9' },
              shepherd: { bg: 'var(--sage-light)', color: 'var(--sage)' },
              'welcome-team': { bg: 'var(--blue-light)', color: 'var(--blue)' },
              'no-access': { bg: 'var(--border-light)', color: 'var(--text-muted)' },
            };
            return (
              <InfoSection title="Access">
                <InfoRow icon={<IdentificationCard size={15} />} label="App Role" value={
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: '999px', background: roleColor[role].bg, color: roleColor[role].color }}>
                    {roleLabel[role]}
                  </span>
                } />
              </InfoSection>
            );
          })()}

          {/* PERSONAL */}
          {(person.gender || person.birthday || person.maritalStatus) && (
            <InfoSection title="Personal">
              {person.gender && <InfoRow icon={<GenderIntersex size={15} />} label="Gender" value={person.gender.charAt(0).toUpperCase() + person.gender.slice(1)} />}
              {person.birthday && <InfoRow icon={<Cake size={15} />} label="Birthday" value={fmtShortDate(person.birthday)} />}
              {person.maritalStatus && <InfoRow icon={<Heart size={15} />} label="Marital Status" value={person.maritalStatus.charAt(0).toUpperCase() + person.maritalStatus.slice(1)} />}
              {person.maritalStatus === 'married' && person.anniversary && <InfoRow icon={<Sparkle size={15} />} label="Anniversary" value={fmtShortDate(person.anniversary)} />}
            </InfoSection>
          )}

          {/* CHURCH */}
          <InfoSection title="Church">
            <InfoRow icon={<IdentificationCard size={15} />} label="Status" value={
              <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: '999px', background: 'var(--sage-light)', color: 'var(--sage)' }}>
                {getMembershipLabel(person.membershipStatus)}
              </span>
            } />
            <InfoRow icon={<Pulse size={15} />} label="Attendance" value={
              <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: '999px', background: 'var(--blue-light)', color: 'var(--blue)' }}>
                {getChurchAttendanceLabel(person.churchAttendance)}
              </span>
            } />
            {person.membershipStatus === 'member' && person.membershipDate && (
              <InfoRow icon={<CalendarCheck size={15} />} label="Member Since" value={fmtShortDate(person.membershipDate)} />
            )}
            {person.baptismDate && <InfoRow icon={<Drop size={15} />} label="Baptism Date" value={fmtShortDate(person.baptismDate)} />}
            {shepherds.length > 0 && (
              <InfoRow icon={<HandHeart size={15} />} label="Shepherd by" value={
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                  {shepherds.map((s) => {
                    const sp = s.personId ? data.people.find((p) => p.id === s.personId) : null;
                    const initials = s.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
                    const inner = (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {sp?.photo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={sp.photo} alt={s.name} style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                        ) : (
                          <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--sage-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: 'var(--sage)', flexShrink: 0 }}>
                            {initials}
                          </div>
                        )}
                        <span style={{ fontSize: 13, fontWeight: 500, color: sp ? 'var(--blue)' : 'var(--text-primary)' }}>{s.name}</span>
                        {sp && <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="var(--blue)" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>}
                      </div>
                    );
                    return sp ? (
                      <Link key={s.id} href={`/person/${sp.id}`} style={{ textDecoration: 'none' }}>{inner}</Link>
                    ) : (
                      <div key={s.id}>{inner}</div>
                    );
                  })}
                </div>
              } />
            )}
            {person.isShepherd && <InfoRow icon={<Compass size={15} />} label="Is Shepherd?" value="Yes" />}
            {person.isBeingDiscipled && <InfoRow icon={<Compass size={15} />} label="Being discipled?" value="Yes" />}
            {person.churchPositions && person.churchPositions.length > 0 && (
              <InfoRow icon={<Buildings size={15} />} label="Position" value={
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  {person.churchPositions.map((pos) => (
                    <span key={pos} style={{ fontSize: 11, padding: '3px 9px', borderRadius: '999px', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontWeight: 500 }}>
                      {pos}
                    </span>
                  ))}
                </div>
              } />
            )}
            {groups.length > 0 && (
              <InfoRow icon={<UsersFour size={15} />} label="Group" value={
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  {groups.map((g) => (
                    <button key={g.id} onClick={() => setPreviewGroupId(g.id)} style={{ fontSize: 11, padding: '3px 9px', borderRadius: '999px', background: 'var(--blue-light)', color: 'var(--blue)', fontWeight: 500, border: 'none', cursor: 'pointer' }}>
                      {g.name}
                    </button>
                  ))}
                </div>
              } />
            )}
            {family && (
              <InfoRow label="Family" value={
                <Link href={`/family/${family.id}`} style={{ color: 'var(--blue)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  {family.label}
                  <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
                </Link>
              } />
            )}
          </InfoSection>

          {/* CONTACT */}
          {(person.phone || person.homePhone || person.email || person.homeAddress) && (
            <InfoSection title="Contact">
              {person.phone && (
                <InfoRow icon={<Phone size={15} />} label="Phone" value={<a href={`tel:${person.phone}`} style={{ color: 'var(--blue)', textDecoration: 'none' }}>{person.phone}</a>} />
              )}
              {person.homePhone && (
                <InfoRow icon={<PhoneCall size={15} />} label="Home Phone" value={<a href={`tel:${person.homePhone}`} style={{ color: 'var(--blue)', textDecoration: 'none' }}>{person.homePhone}</a>} />
              )}
              {person.email && (
                <InfoRow icon={<Envelope size={15} />} label="Email" value={<a href={`mailto:${person.email}`} style={{ color: 'var(--blue)', textDecoration: 'none' }}>{person.email}</a>} />
              )}
              {person.homeAddress && (
                <InfoRow icon={<House size={15} />} label="Address" value={
                  <a
                    href={`https://maps.apple.com/?q=${encodeURIComponent(person.homeAddress)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'var(--blue)', textDecoration: 'none', textAlign: 'right', lineHeight: 1.5, display: 'block', whiteSpace: 'pre-wrap' }}
                  >{person.homeAddress}</a>
                } />
              )}
            </InfoSection>
          )}

          {/* NEEDS */}
          {(person.spiritualNeeds || person.physicalNeeds) && (
            <InfoSection title="Needs">
              {person.spiritualNeeds && (
                <InfoRow icon={<Church size={15} />} label="Spiritual" value={
                  <span style={{ textAlign: 'right', lineHeight: 1.5 }}>{person.spiritualNeeds}</span>
                } />
              )}
              {person.physicalNeeds && (
                <InfoRow icon={<FirstAid size={15} />} label="Physical" value={
                  <span style={{ textAlign: 'right', lineHeight: 1.5 }}>{person.physicalNeeds}</span>
                } />
              )}
            </InfoSection>
          )}

          {/* META */}
          <InfoSection title="Meta">
            <InfoRow label="Last logged" value={person.lastContactDate ? new Date(person.lastContactDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Never'} muted />
            <InfoRow label="Added" value={fmtShortDate(person.createdAt)} muted />
            {person.createdBy && (() => { const creator = data.personas.find((p) => p.id === person.createdBy); return creator ? <InfoRow label="Created by" value={creator.name} muted /> : null; })()}
          </InfoSection>

        </div>
      )}

      {showAddLog && (
        <AddLogModal
          onClose={() => { setShowAddLog(false); setPendingLogTodo(null); }}
          prefillPersonId={person.id}
          prefillContent={pendingLogTodo?.title}
          prefillType="check-in"
        />
      )}
      {showAddTodo && <AddTodoModal onClose={() => setShowAddTodo(false)} prefillPersonId={person.id} />}
      {editingNote && <AddLogModal onClose={() => setEditingNote(null)} note={editingNote} />}
      {editingTodo && <AddTodoModal onClose={() => setEditingTodo(null)} todo={editingTodo} />}
      {showEditPerson && <EditPersonDrawer person={person} onClose={() => setShowEditPerson(false)} />}
      {previewGroupId && <GroupPreviewModal groupId={previewGroupId} onClose={() => setPreviewGroupId(null)} />}

      {/* Edit sheep picker */}
      {showSheepPicker && shepherdId && (
        <SheepPickerModal
          data={data}
          shepherdPersonaId={shepherdId}
          currentSheepIds={sheep.map((s) => s.id)}
          excludePersonId={person.id}
          onToggle={(personId, isCurrentSheep) => {
            const target = data.people.find((p) => p.id === personId);
            if (!target) return;
            if (isCurrentSheep) {
              assignShepherds(personId, target.assignedShepherdIds.filter((sid) => sid !== shepherdId));
            } else {
              assignShepherds(personId, [...target.assignedShepherdIds, shepherdId]);
            }
          }}
          onClose={() => setShowSheepPicker(false)}
        />
      )}

      {/* Photo action menu */}
      {showPhotoMenu && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(30,26,24,0.45)', zIndex: 60, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
          onClick={() => setShowPhotoMenu(false)}
        >
          <div
            className="animate-slide-up"
            style={{ background: 'var(--surface)', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 430, padding: '0 20px 36px', overflow: 'hidden' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ width: 36, height: 4, background: 'var(--border)', borderRadius: 2, margin: '14px auto 20px' }} />
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'center', marginBottom: 16 }}>
              Profile Photo
            </p>

            {/* Choose / replace photo */}
            <button
              onClick={() => { setShowPhotoMenu(false); fileInputRef.current?.click(); }}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '14px 4px', background: 'none', border: 'none', borderBottom: '1px solid var(--border-light)', cursor: 'pointer', textAlign: 'left' }}
            >
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--sage-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="var(--sage)" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                </svg>
              </div>
              <span style={{ fontSize: 16, color: 'var(--text-primary)', fontWeight: 500 }}>
                {person.photo ? 'Replace photo' : 'Upload photo'}
              </span>
            </button>

            {/* Remove photo — only shown if one exists */}
            {person.photo && (
              <button
                onClick={() => { updatePerson(person.id, { photo: undefined }); setShowPhotoMenu(false); }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '14px 4px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
              >
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="var(--red)" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                </div>
                <span style={{ fontSize: 16, color: 'var(--red)', fontWeight: 500 }}>Remove photo</span>
              </button>
            )}
          </div>
        </div>
      )}
      {todoLogPrompt && (
        <TodoLogPrompt
          todo={todoLogPrompt}
          onAddLog={() => { setPendingLogTodo(todoLogPrompt); setTodoLogPrompt(null); setShowAddLog(true); }}
          onSkip={() => setTodoLogPrompt(null)}
        />
      )}

      {/* ── Archive / Delete confirmation sheet ── */}
      {confirmAction && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(30,26,24,0.5)', zIndex: 70, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
          onClick={() => setConfirmAction(null)}
        >
          <div
            className="animate-slide-up"
            style={{ background: 'var(--surface)', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 430, padding: '0 20px 36px', overflow: 'hidden' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ width: 36, height: 4, background: 'var(--border)', borderRadius: 2, margin: '14px auto 20px' }} />
            {confirmAction === 'archive' ? (
              <>
                <p style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', textAlign: 'center', marginBottom: 6 }}>
                  {person.churchAttendance === 'archived' ? 'Unarchive' : 'Archive'} {firstName}?
                </p>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', marginBottom: 24 }}>
                  {person.churchAttendance === 'archived'
                    ? 'They will be visible in the directory again.'
                    : 'They will be hidden from the main directory but their history will be preserved.'}
                </p>
                <button
                  onClick={handleArchive}
                  style={{ width: '100%', height: 50, borderRadius: 14, background: 'var(--sage)', color: '#fff', fontSize: 16, fontWeight: 600, border: 'none', cursor: 'pointer', marginBottom: 10 }}
                >
                  {person.churchAttendance === 'archived' ? 'Unarchive' : 'Archive'}
                </button>
                <button
                  onClick={() => setConfirmAction(null)}
                  style={{ width: '100%', height: 50, borderRadius: 14, background: 'var(--bg)', color: 'var(--text-secondary)', fontSize: 16, fontWeight: 500, border: 'none', cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <p style={{ fontSize: 17, fontWeight: 700, color: 'var(--red)', textAlign: 'center', marginBottom: 6 }}>
                  Delete {firstName}?
                </p>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', marginBottom: 24 }}>
                  This will permanently remove {firstName} and all their logs and to-dos. This cannot be undone.
                </p>
                <button
                  onClick={handleDelete}
                  style={{ width: '100%', height: 50, borderRadius: 14, background: 'var(--red)', color: '#fff', fontSize: 16, fontWeight: 600, border: 'none', cursor: 'pointer', marginBottom: 10 }}
                >
                  Delete permanently
                </button>
                <button
                  onClick={() => setConfirmAction(null)}
                  style={{ width: '100%', height: 50, borderRadius: 14, background: 'var(--bg)', color: 'var(--text-secondary)', fontSize: 16, fontWeight: 500, border: 'none', cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function TodoSection({ label, todos, onToggle, onEdit, data, defaultOpen = true }: {
  label: string; todos: Todo[]; onToggle: (id: string) => void; onEdit: (todo: Todo) => void; data: AppData; defaultOpen?: boolean;
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
        <div className="no-last-border" style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', overflow: 'hidden', padding: 0 }}>
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
                <button onClick={() => onEdit(t)} style={{ flex: 1, minWidth: 0, background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', padding: 0 }}>
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

function InfoRow({ icon, label, value, muted }: { icon?: React.ReactNode; label: string; value: React.ReactNode; muted?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '11px 16px', borderBottom: '1px solid var(--border-light)', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, paddingTop: 1 }}>
        {icon && <span style={{ color: 'var(--text-muted)', display: 'flex', flexShrink: 0 }}>{icon}</span>}
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{label}</span>
      </div>
      <span style={{ fontSize: 13, color: muted ? 'var(--text-muted)' : 'var(--text-primary)', fontWeight: muted ? 400 : 500, textAlign: 'right', lineHeight: 1.5 }}>{value}</span>
    </div>
  );
}

function LogSection({ label, count, children }: { label: string; count: number; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
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
        {label} · {count}
        <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} style={{ transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      {open && children}
    </div>
  );
}

function InfoSection({ title, children, muted }: { title: string; children: React.ReactNode; muted?: boolean }) {
  return (
    <div>
      <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{title}</p>
      <div className="no-last-border" style={{ background: 'var(--surface)', borderRadius: 14, overflow: 'hidden', padding: 0 }}>{children}</div>
    </div>
  );
}

function fmtShortDate(iso: string) {
  // Handles both YYYY-MM-DD and full ISO datetime strings
  const dateStr = iso.includes('T') ? iso.split('T')[0] : iso;
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const sheepPickerPalette = [
  { bg: '#EAF2EE', color: '#5B8A72' },
  { bg: '#EBF1F7', color: '#6B8EAE' },
  { bg: '#F5F0EB', color: '#8C7055' },
  { bg: '#F0EBF5', color: '#7A6A8C' },
];

function SheepPickerModal({ data, shepherdPersonaId, currentSheepIds, excludePersonId, onToggle, onClose }: {
  data: AppData;
  shepherdPersonaId: string;
  currentSheepIds: string[];
  excludePersonId: string;
  onToggle: (personId: string, isCurrentSheep: boolean) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState('');
  const q = search.toLowerCase();

  const people = data.people.filter((p) =>
    p.id !== excludePersonId &&
    (q === '' || p.englishName.toLowerCase().includes(q) || (p.chineseName && p.chineseName.toLowerCase().includes(q)))
  );

  // Sort: current sheep first, then the rest alphabetically
  const sorted = [
    ...people.filter((p) => currentSheepIds.includes(p.id)),
    ...people.filter((p) => !currentSheepIds.includes(p.id)),
  ];

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(30,26,24,0.45)', zIndex: 60, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="animate-slide-up"
        style={{
          background: 'var(--surface)', borderRadius: '20px 20px 0 0',
          width: '100%', maxWidth: 430,
          height: 'calc(100dvh - 48px)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}
      >
        {/* Drag handle */}
        <div style={{ width: 36, height: 4, background: 'var(--border)', borderRadius: 2, margin: '14px auto 0', flexShrink: 0 }} />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px 12px', flexShrink: 0, borderBottom: '1px solid var(--border-light)' }}>
          <button onClick={onClose} style={{ fontSize: 14, color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer' }}>Cancel</button>
          <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>Edit Sheep</span>
          <button onClick={onClose} style={{ fontSize: 14, fontWeight: 600, color: 'var(--sage)', background: 'none', border: 'none', cursor: 'pointer' }}>Done</button>
        </div>

        {/* Search */}
        <div style={{ padding: '12px 20px' }}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search people…"
            autoFocus
            style={{
              width: '100%', padding: '10px 14px',
              background: 'var(--bg)', border: '1px solid var(--border)',
              borderRadius: 10, fontSize: 14, color: 'var(--text-primary)',
              outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 40px' }}>
          {sorted.length === 0 && (
            <p style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic', paddingTop: 24, textAlign: 'center' }}>No matching people.</p>
          )}
          {sorted.map((p) => {
            const isSheep = currentSheepIds.includes(p.id);
            const initials = p.englishName.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
            const palette = sheepPickerPalette[p.englishName.charCodeAt(0) % sheepPickerPalette.length];
            return (
              <button
                key={p.id}
                className="picker-row"
                onClick={() => onToggle(p.id, isSheep)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  width: '100%', padding: '10px 8px',
                  background: isSheep ? 'var(--sage-light)' : 'none',
                  border: 'none', cursor: 'pointer', textAlign: 'left',
                  borderRadius: 10, marginBottom: 2,
                }}
              >
                {p.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.photo} alt={p.englishName} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                ) : (
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: isSheep ? 'var(--sage)' : palette.bg, color: isSheep ? '#fff' : palette.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                    {initials}
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
                    <span style={{ fontSize: 14, fontWeight: isSheep ? 600 : 500, color: isSheep ? 'var(--sage)' : 'var(--text-primary)' }}>{p.englishName}</span>
                    {p.chineseName && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.chineseName}</span>}
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{getMembershipLabel(p.membershipStatus)}</span>
                </div>
                {isSheep ? (
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="var(--sage)" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                ) : (
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="var(--text-muted)" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
