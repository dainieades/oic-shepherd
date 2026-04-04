'use client';

import { use, useState, useRef, useEffect } from 'react';
import { Baby, Notepad, CheckCircle, Info, UsersFour, User, HandHeart, PencilSimple } from '@phosphor-icons/react';
import Link from 'next/link';
import { useApp } from '@/lib/context';
import { getTimeAgo, getMembershipLabel, getFamilyNotes, getFamilyTodos, getNoteTypeLabel, groupByMonth, categorizeTodos } from '@/lib/utils';
import { Todo, Note, AppData, TodoAlert, NoteType } from '@/lib/types';
import AddLogModal from '@/components/AddLogModal';
import AddTodoModal from '@/components/AddTodoModal';
import TodoLogPrompt from '@/components/TodoLogPrompt';
import EditFamilyDrawer from '@/components/EditFamilyDrawer';
import GroupPreviewModal from '@/components/GroupPreviewModal';

type Tab = 'logs' | 'todos' | 'info';

const TAB_LABELS: Record<Tab, string> = { logs: 'Logs', todos: 'To-dos', info: 'Family Info' };

function TabIcon({ tab, active }: { tab: Tab; active: boolean }) {
  const weight = active ? 'fill' : 'regular';
  if (tab === 'logs') return <Notepad size={16} weight={weight} />;
  if (tab === 'todos') return <CheckCircle size={16} weight={weight} />;
  return <Info size={16} weight={weight} />;
}

const ALERT_LABELS: Record<TodoAlert, string> = {
  'none': '', 'on-time': 'On time', '5min': '5 min before', '15min': '15 min before',
  '30min': '30 min before', '1hour': '1 hr before', '1day': '1 day before', '2days': '2 days before',
};

function fmtDue(iso: string) {
  return new Date(iso).toLocaleString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

const avatarPalette = [
  { bg: '#EAF2EE', color: '#5B8A72' },
  { bg: '#EBF1F7', color: '#6B8EAE' },
  { bg: '#F5F0EB', color: '#8C7055' },
  { bg: '#F0EBF5', color: '#7A6A8C' },
];


const noteTypeColors: Record<string, { bg: string; color: string }> = {
  'check-in':       { bg: 'var(--sage-light)', color: 'var(--sage)' },
  'prayer-request': { bg: '#F0EBF5', color: '#7A6A8C' },
  'event':          { bg: 'var(--blue-light)', color: 'var(--blue)' },
  'general':        { bg: 'var(--border-light)', color: 'var(--text-secondary)' },
};

export default function FamilyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, toggleTodo, canViewNote, updateFamily, updateFamilyMembers, assignGroupsToFamily, assignShepherdsToFamily } = useApp();
  const [tab, setTab] = useState<Tab>('logs');
  const [showAddLog, setShowAddLog] = useState(false);
  const [showAddTodo, setShowAddTodo] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [todoLogPrompt, setTodoLogPrompt] = useState<Todo | null>(null);
  const [pendingLogTodo, setPendingLogTodo] = useState<Todo | null>(null);
  const [showEditFamily, setShowEditFamily] = useState(false);
  const [previewGroupId, setPreviewGroupId] = useState<string | null>(null);
  const [showKebab, setShowKebab] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const kebabRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    function outside(e: MouseEvent) {
      if (kebabRef.current && !kebabRef.current.contains(e.target as Node)) setShowKebab(false);
    }
    document.addEventListener('mousedown', outside);
    return () => document.removeEventListener('mousedown', outside);
  }, []);

  const family = data.families.find((f) => f.id === id);
  if (!family) {
    return <div style={{ paddingTop: 64, textAlign: 'center', color: 'var(--text-muted)' }}>Family not found</div>;
  }

  const members = data.people.filter((p) => family.memberIds.includes(p.id));
  const notes = getFamilyNotes(id, data.people, data.notes).filter((n) => canViewNote(n));
  const todos = getFamilyTodos(id, data.people, data.todos);
  const categorized = categorizeTodos(todos);
  const familyShepherds = data.personas.filter((p) => members.some((m) => m.assignedShepherdIds.includes(p.id)));
  const familyGroups = data.groups.filter((g) => members.some((m) => m.groupIds.includes(g.id)));

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
    if (tab === 'logs') setShowAddLog(true);
    else if (tab === 'todos') setShowAddTodo(true);
  };

  const handlePhotoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      updateFamily(family.id, { photo: reader.result as string });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const memberCountText = (() => {
    const adultCount = members.length;
    const parts = [`${adultCount} adult${adultCount !== 1 ? 's' : ''}`];
    if (family.childCount && family.childCount > 0) parts.push(`${family.childCount} kid${family.childCount !== 1 ? 's' : ''}`);
    return parts.join(' · ');
  })();

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase();

  return (
    <div style={{ paddingBottom: 40 }}>

      {/* ── Nav bar — sticky below persona switcher (36px) ── */}
      <div style={{
        position: 'sticky', top: 36, zIndex: 40,
        background: 'var(--bg)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: 54,
      }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 13, color: 'var(--sage)', textDecoration: 'none', fontWeight: 500 }}>
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back
        </Link>

        <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)' }}>
          {family.label.split(' ')[0]}
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {tab === 'info' ? (
            <button
              onClick={() => setShowEditFamily(true)}
              style={{ height: scrolled ? 30 : 36, padding: scrolled ? '0 10px' : '0 12px', borderRadius: 8, background: 'var(--sage)', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: scrolled ? 13 : 14, fontWeight: 600, whiteSpace: 'nowrap' }}
            >
              <PencilSimple size={scrolled ? 13 : 15} weight="bold" />
              Info
            </button>
          ) : (
            <button
              onClick={tab === 'logs' ? () => setShowAddLog(true) : () => setShowAddTodo(true)}
              style={{ height: scrolled ? 30 : 36, padding: scrolled ? '0 12px' : '0 14px', borderRadius: 8, background: 'var(--sage)', color: '#fff', fontSize: scrolled ? 13 : 14, fontWeight: 600, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              {tab === 'logs' ? '+ Log' : '+ To-do'}
            </button>
          )}
          <div ref={kebabRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setShowKebab(!showKebab)}
              style={{ width: scrolled ? 30 : 36, height: scrolled ? 30 : 36, borderRadius: '50%', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
              </svg>
            </button>
            {showKebab && (
              <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 6px)', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, boxShadow: '0 8px 28px rgba(0,0,0,0.12)', zIndex: 50, minWidth: 180, overflow: 'hidden' }}>
                <button
                  onClick={() => { setShowKebab(false); setShowEditFamily(true); }}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '13px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--text-primary)', textAlign: 'left' }}
                >
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                  </svg>
                  Edit info
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Page header — scrolls away ── */}
      <div style={{ padding: '28px 0 20px', display: 'flex', alignItems: 'center', gap: 16 }}>

        {/* Avatar / Photo */}
        <button
          onClick={() => fileInputRef.current?.click()}
          style={{ flexShrink: 0, width: 72, height: 72, borderRadius: '50%', padding: 0, border: 'none', cursor: 'pointer', position: 'relative', background: 'none' }}
        >
          {family.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={family.photo} alt={family.label} style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', display: 'block' }} />
          ) : (
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'var(--sage-light)', border: '2px dashed var(--sage)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="30" height="30" fill="none" viewBox="0 0 24 24" stroke="var(--sage)" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
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
          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.15, letterSpacing: '-0.02em', marginBottom: 5 }}>
            {family.label}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{memberCountText}</span>
            {familyGroups.map((g) => (
              <button key={g.id} onClick={() => setPreviewGroupId(g.id)} style={{ fontSize: 11, padding: '2px 7px', borderRadius: '999px', background: 'var(--blue-light)', color: 'var(--blue)', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
                {g.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoFile} />

      {/* ── Tabs — sticky below nav bar (36 + 44 = 80px) ── */}
      <div style={{
        position: 'sticky', top: 90, zIndex: 39,
        background: 'var(--bg)',
        display: 'flex', borderBottom: '2px solid var(--border-light)', marginBottom: 20,
      }}>
        {(['logs', 'todos', 'info'] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: '10px 0', fontSize: 13, fontWeight: tab === t ? 600 : 400,
            color: tab === t ? 'var(--sage)' : 'var(--text-muted)',
            background: 'none', border: 'none', borderBottom: tab === t ? '2px solid var(--sage)' : '2px solid transparent',
            cursor: 'pointer', marginBottom: -2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
          }}>
            <TabIcon tab={t} active={tab === t} />
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {/* ── Logs tab ── */}
      {tab === 'logs' && (
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

      {/* ── Todos tab ── */}
      {tab === 'todos' && (
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

      {/* ── Family Info tab ── */}
      {tab === 'info' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Members */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Members</p>
            <div className="no-last-border" style={{ background: 'var(--surface)', borderRadius: 14, overflow: 'hidden', padding: 0 }}>
              {members.map((m, i) => {
                const palette = avatarPalette[i % avatarPalette.length];
                const inits = m.englishName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
                return (
                  <Link key={m.id} href={`/person/${m.id}`} className="row-card-hover" style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 12, paddingBottom: 12, borderBottom: '1px solid var(--border-light)' }}>
                    <div style={{ width: 38, height: 38, borderRadius: '50%', background: palette.bg, color: palette.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                      {inits}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
                        {m.englishName}
                        {m.chineseName && <span style={{ fontWeight: 400, fontSize: 12, color: 'var(--text-muted)', marginLeft: 6 }}>{m.chineseName}</span>}
                      </p>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {getMembershipLabel(m.membershipStatus)}
                        {m.lastContactDate && <span> · Logged {new Date(m.lastContactDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
                      </p>
                    </div>
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="var(--text-muted)" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </Link>
                );
              })}
              {family.childCount && family.childCount > 0 && (
                <div style={{ paddingTop: 11, paddingBottom: 11, borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--sage-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Baby size={20} color="var(--sage)" /></div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>Children</p>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{family.childCount} {family.childCount === 1 ? 'child' : 'children'}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Details */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Details</p>
            <div className="no-last-border" style={{ background: 'var(--surface)', borderRadius: 14, overflow: 'hidden', padding: 0 }}>
              {family.primaryContactId && (() => { const pc = members.find(m => m.id === family.primaryContactId); return pc ? <InfoRow icon={<User size={15} />} label="Primary" value={pc.englishName} /> : null; })()}
              {familyGroups.length > 0 && (
                <InfoRow icon={<UsersFour size={15} />} label="Groups" value={
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {familyGroups.map((g) => (
                      <button key={g.id} onClick={() => setPreviewGroupId(g.id)} style={{ fontSize: 11, padding: '2px 8px', borderRadius: '999px', background: 'var(--blue-light)', color: 'var(--blue)', fontWeight: 500, border: 'none', cursor: 'pointer' }}>
                        {g.name}
                      </button>
                    ))}
                  </div>
                } />
              )}
              {familyShepherds.length > 0 && (
                <InfoRow icon={<HandHeart size={15} />} label="Shepherd" value={
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                    {familyShepherds.map((s) => {
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
            </div>
          </div>

          {/* Meta */}
          {(family.createdAt || family.createdBy) && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Meta</p>
              <div className="no-last-border" style={{ background: 'var(--surface)', borderRadius: 14, overflow: 'hidden', padding: 0 }}>
                {family.createdAt && (
                  <InfoRow label="Added" value={new Date(family.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} />
                )}
                {family.createdBy && (() => { const creator = data.personas.find((p) => p.id === family.createdBy); return creator ? <InfoRow label="Created by" value={creator.name} /> : null; })()}
              </div>
            </div>
          )}

        </div>
      )}

      {showAddLog && <AddLogModal onClose={() => { setShowAddLog(false); setPendingLogTodo(null); }} prefillFamilyId={pendingLogTodo?.familyId ?? id} prefillPersonId={pendingLogTodo?.personId} prefillContent={pendingLogTodo?.title} prefillType="check-in" />}
      {showAddTodo && <AddTodoModal onClose={() => setShowAddTodo(false)} prefillFamilyId={id} />}
      {editingNote && <AddLogModal onClose={() => setEditingNote(null)} note={editingNote} />}
      {editingTodo && <AddTodoModal onClose={() => setEditingTodo(null)} todo={editingTodo} />}
      {showEditFamily && <EditFamilyDrawer family={family} onClose={() => setShowEditFamily(false)} />}
      {previewGroupId && <GroupPreviewModal groupId={previewGroupId} onClose={() => setPreviewGroupId(null)} />}
      {todoLogPrompt && (
        <TodoLogPrompt
          todo={todoLogPrompt}
          onAddLog={() => { setPendingLogTodo(todoLogPrompt); setTodoLogPrompt(null); setShowAddLog(true); }}
          onSkip={() => setTodoLogPrompt(null)}
        />
      )}
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
            const tag = person?.englishName || family?.label || '';
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

function InfoRow({ icon, label, value }: { icon?: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '11px 16px', borderBottom: '1px solid var(--border-light)', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, paddingTop: 1 }}>
        {icon && <span style={{ color: 'var(--text-muted)', display: 'flex', flexShrink: 0 }}>{icon}</span>}
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{label}</span>
      </div>
      <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500, textAlign: 'right', lineHeight: 1.5 }}>{value}</span>
    </div>
  );
}
