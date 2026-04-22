'use client';

import { format, parseISO } from 'date-fns';
import React from 'react';
import {
  Baby,
  Notepad,
  CheckCircle,
  Info,
  UsersFour,
  User,
  HandHeart,
  PencilSimpleIcon,
  CaretLeft,
  CaretRight,
  DotsThreeVertical,
  DotsThree,
  Camera,
  Check,
  Clock,
  ArrowsClockwise,
  CaretDown,
  House,
  Plus,
  Bell,
  FirstAid,
  HandsPraying,
  UsersThree,
  Brain,
  Eye,
} from '@phosphor-icons/react';
import Link from 'next/link';
import { useApp } from '@/lib/context';
import {
  getTimeAgo,
  getMembershipLabel,
  getFamilyNotes,
  getFamilyTodos,
  getFamilyNotices,
  getNoteTypeLabel,
  groupByMonth,
  categorizeTodos,
} from '@/lib/utils';
import { type Todo, type Note, type AppData, type Notice } from '@/lib/types';
import AddLogModal from '@/components/AddLogModal';
import AddTodoModal from '@/components/AddTodoModal';
import AddNoticeModal, { URGENCY_STYLE } from '@/components/AddNoticeModal';
import TodoLogPrompt from '@/components/TodoLogPrompt';
import EditFamilyDrawer from '@/components/EditFamilyDrawer';
import GroupPreviewModal from '@/components/GroupPreviewModal';
import ImageCropModal from '@/components/ImageCropModal';
import { SHEPHERD_AVATAR_PALETTE } from '@/lib/constants';

type Tab = 'logs' | 'todos' | 'notices' | 'info';

const TAB_LABELS: Record<Tab, string> = {
  logs: 'Logs',
  todos: 'To-dos',
  notices: 'Notices',
  info: 'Family Info',
};

function TabIcon({ tab, active }: { tab: Tab; active: boolean }) {
  const weight = active ? 'fill' : 'regular';
  if (tab === 'logs') return <Notepad size={16} weight={weight} />;
  if (tab === 'todos') return <CheckCircle size={16} weight={weight} />;
  if (tab === 'notices') return <Bell size={16} weight={weight} />;
  return <Info size={16} weight={weight} />;
}

const URGENCY_LABEL: Record<string, string> = {
  urgent: 'Urgent',
  moderate: 'Moderate',
  ongoing: 'Ongoing',
};
const CATEGORY_LABEL: Record<string, string> = {
  'physical-need': 'Physical Need',
  'spiritual-need': 'Spiritual Need',
  'social-need': 'Social Need',
  'psychological-need': 'Psychological Need',
  other: 'Other',
};
const CATEGORY_STYLE: Record<string, { bg: string; color: string }> = {
  'physical-need': { bg: 'var(--sage-light)', color: 'var(--sage)' },
  'spiritual-need': { bg: 'var(--sage-light)', color: 'var(--sage)' },
  'social-need': { bg: 'var(--sage-light)', color: 'var(--sage)' },
  'psychological-need': { bg: 'var(--sage-light)', color: 'var(--sage)' },
  other: { bg: 'var(--sage-light)', color: 'var(--sage)' },
};
const CATEGORY_ICON: Record<string, React.ReactNode> = {
  'physical-need': <FirstAid size={11} />,
  'spiritual-need': <HandsPraying size={11} />,
  'social-need': <UsersThree size={11} />,
  'psychological-need': <Brain size={11} />,
  other: <DotsThree size={11} />,
};
const PRIVACY_LABEL: Record<string, string> = {
  'pastor-only': 'Pastor only',
  'pastor-and-shepherds': 'Shepherds & pastor',
  everyone: 'Everyone',
};

function fmtDue(iso: string) {
  return format(parseISO(iso), 'M/d/yyyy h:mm a');
}

const noteTypeColors: Record<string, { bg: string; color: string }> = {
  'check-in': { bg: 'var(--sage-light)', color: 'var(--sage)' },
  'prayer-request': { bg: 'var(--sage-light)', color: 'var(--sage)' },
  event: { bg: 'var(--sage-light)', color: 'var(--sage)' },
  general: { bg: 'var(--sage-light)', color: 'var(--sage)' },
};

export default function FamilyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const { data, toggleTodo, canViewNote, updateFamily, currentPersona } = useApp();
  const canSeeNotices = currentPersona.role === 'admin' || currentPersona.role === 'shepherd';
  const [tab, setTab] = React.useState<Tab>('logs');
  const [showAddLog, setShowAddLog] = React.useState(false);
  const [showAddTodo, setShowAddTodo] = React.useState(false);
  const [showAddNotice, setShowAddNotice] = React.useState(false);
  const [editingNote, setEditingNote] = React.useState<Note | null>(null);
  const [editingTodo, setEditingTodo] = React.useState<Todo | null>(null);
  const [editingNotice, setEditingNotice] = React.useState<Notice | null>(null);
  const [todoLogPrompt, setTodoLogPrompt] = React.useState<Todo | null>(null);
  const [pendingLogTodo, setPendingLogTodo] = React.useState<Todo | null>(null);
  const [showEditFamily, setShowEditFamily] = React.useState(false);
  const [previewGroupId, setPreviewGroupId] = React.useState<string | null>(null);
  const [showKebab, setShowKebab] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);
  const [cropSrc, setCropSrc] = React.useState<string | null>(null);
  const kebabRef = React.useRef<HTMLDivElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  React.useEffect(() => {
    function outside(e: MouseEvent) {
      if (kebabRef.current && !kebabRef.current.contains(e.target as Node)) setShowKebab(false);
    }
    document.addEventListener('mousedown', outside);
    return () => document.removeEventListener('mousedown', outside);
  }, []);

  const family = data.families.find((f) => f.id === id);
  if (!family) {
    return (
      <div style={{ paddingTop: 64, textAlign: 'center', color: 'var(--text-muted)' }}>
        Family not found
      </div>
    );
  }

  const members = data.people.filter((p) => family.memberIds.includes(p.id));
  const notes = getFamilyNotes(id, data.people, data.notes).filter((n) => canViewNote(n));
  const todos = getFamilyTodos(id, data.people, data.todos);
  const notices = canSeeNotices ? getFamilyNotices(id, data.people, data.notices) : [];
  const categorized = categorizeTodos(todos);
  const incompleteTodosCount = todos.filter((t) => !t.completed).length;
  const familyShepherds = data.personas.filter((p) =>
    members.some((m) => m.assignedShepherdIds.includes(p.id))
  );
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

  const handlePhotoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCropSrc(reader.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const memberCountText = (() => {
    const adultCount = members.length;
    const parts = [`${adultCount} adult${adultCount !== 1 ? 's' : ''}`];
    if (family.childCount && family.childCount > 0)
      parts.push(`${family.childCount} kid${family.childCount !== 1 ? 's' : ''}`);
    return parts.join(' · ');
  })();

  return (
    <div style={{ paddingBottom: 40 }}>
      {cropSrc && (
        <ImageCropModal
          imageSrc={cropSrc}
          onConfirm={(croppedUrl) => {
            updateFamily(family.id, { photo: croppedUrl });
            setCropSrc(null);
          }}
          onCancel={() => setCropSrc(null)}
        />
      )}
      {/* ── Nav bar ── */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          background: 'var(--bg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 54,
        }}
      >
        <Link
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 3,
            fontSize: 13,
            color: 'var(--sage)',
            textDecoration: 'none',
            fontWeight: 500,
          }}
        >
          <CaretLeft size={16} />
          Back
        </Link>

        <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)' }}>
          {family.label.split(' ')[0]}
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {tab === 'info' ? (
            <button
              onClick={() => setShowEditFamily(true)}
              style={{
                height: scrolled ? 30 : 36,
                padding: scrolled ? '0 10px' : '0 12px',
                borderRadius: 8,
                background: 'var(--sage)',
                color: 'var(--on-sage)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                fontSize: scrolled ? 13 : 14,
                fontWeight: 600,
                whiteSpace: 'nowrap',
              }}
            >
              <PencilSimpleIcon size={scrolled ? 13 : 15} weight="bold" />
              Info
            </button>
          ) : (
            <button
              onClick={
                tab === 'logs'
                  ? () => setShowAddLog(true)
                  : tab === 'todos'
                    ? () => setShowAddTodo(true)
                    : () => setShowAddNotice(true)
              }
              style={{
                height: scrolled ? 30 : 36,
                padding: scrolled ? '0 12px' : '0 14px',
                borderRadius: 8,
                background: 'var(--sage)',
                color: 'var(--on-sage)',
                fontSize: scrolled ? 13 : 14,
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Plus size={14} weight="bold" />
              {tab === 'logs' ? 'Log' : tab === 'todos' ? 'To-do' : 'Notice'}
            </button>
          )}
          <div ref={kebabRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setShowKebab(!showKebab)}
              style={{
                width: scrolled ? 30 : 36,
                height: scrolled ? 30 : 36,
                borderRadius: '50%',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <DotsThreeVertical size={16} />
            </button>
            {showKebab && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 'calc(100% + 6px)',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  boxShadow: '0 8px 28px rgba(0,0,0,0.12)',
                  zIndex: 50,
                  minWidth: 180,
                  overflow: 'hidden',
                }}
              >
                <button
                  onClick={() => {
                    setShowKebab(false);
                    setShowEditFamily(true);
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '13px 16px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 14,
                    color: 'var(--text-primary)',
                    textAlign: 'left',
                  }}
                >
                  <PencilSimpleIcon size={16} />
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
          style={{
            flexShrink: 0,
            width: 72,
            height: 72,
            borderRadius: '50%',
            padding: 0,
            border: 'none',
            cursor: 'pointer',
            position: 'relative',
            background: 'none',
          }}
        >
          {family.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={family.photo}
              alt={family.label}
              style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                objectFit: 'cover',
                display: 'block',
              }}
            />
          ) : (
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                background: 'var(--sage-light)',
                border: '2px dashed var(--sage)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <House size={30} color="var(--sage)" />
            </div>
          )}
          {/* Camera badge */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: 22,
              height: 22,
              borderRadius: '50%',
              background: 'var(--sage)',
              border: '2px solid var(--bg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Camera size={11} color="#fff" weight="fill" />
          </div>
        </button>

        {/* Name + meta */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1
            style={{
              fontSize: 26,
              fontWeight: 800,
              color: 'var(--text-primary)',
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
              marginBottom: 5,
            }}
          >
            {family.label}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{memberCountText}</span>
            {familyGroups.map((g) => (
              <React.Fragment key={g.id}>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>·</span>
                <button
                  onClick={() => setPreviewGroupId(g.id)}
                  style={{
                    fontSize: 11,
                    padding: '2px 7px',
                    borderRadius: '999px',
                    background: 'var(--blue-light)',
                    color: 'var(--blue)',
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {g.name}
                </button>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handlePhotoFile}
      />

      {/* ── Tabs — sticky below nav bar ── */}
      <div
        style={{
          position: 'sticky',
          top: 54,
          zIndex: 39,
          background: 'var(--bg)',
          display: 'flex',
          borderBottom: '2px solid var(--border-light)',
          marginBottom: 20,
        }}
      >
        {(['logs', 'todos', ...(canSeeNotices ? ['notices'] : []), 'info'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1,
              padding: '10px 0',
              fontSize: 13,
              fontWeight: tab === t ? 600 : 400,
              color: tab === t ? 'var(--sage)' : 'var(--text-muted)',
              background: 'none',
              border: 'none',
              borderBottom: tab === t ? '2px solid var(--sage)' : '2px solid transparent',
              cursor: 'pointer',
              marginBottom: -2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5,
            }}
          >
            <TabIcon tab={t} active={tab === t} />
            {TAB_LABELS[t]}
            {t === 'todos' && incompleteTodosCount > 0 && (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  background: 'var(--sage)',
                  color: 'var(--on-sage)',
                  borderRadius: 10,
                  padding: '1px 6px',
                  lineHeight: 1.5,
                }}
              >
                {incompleteTodosCount}
              </span>
            )}
            {t === 'notices' && notices.length > 0 && (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  background: 'var(--sage)',
                  color: 'var(--on-sage)',
                  borderRadius: 10,
                  padding: '1px 6px',
                  lineHeight: 1.5,
                }}
              >
                {notices.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Logs tab ── */}
      {tab === 'logs' && (
        <div>
          {notes.length === 0 && (
            <div style={{ textAlign: 'center', padding: '32px 20px' }}>
              <p
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  marginBottom: 6,
                }}
              >
                No logs yet
              </p>
              <p
                style={{
                  fontSize: 13,
                  color: 'var(--text-muted)',
                  lineHeight: 1.6,
                  maxWidth: 240,
                  margin: '0 auto',
                }}
              >
                Logs capture past interactions — a conversation, a check-in, a prayer request, or a
                moment you shared together.
              </p>
              <p
                style={{
                  fontSize: 12,
                  color: 'var(--text-muted)',
                  lineHeight: 1.5,
                  maxWidth: 240,
                  margin: '10px auto 0',
                  fontWeight: 600,
                }}
              >
                Only assigned shepherds and pastors can see these.
              </p>
            </div>
          )}
          {groupByMonth(notes).map((group) => {
            const rows = group.items.map((note) => {
              const typeStyle = noteTypeColors[note.type] || noteTypeColors.general;
              const creator = data.personas.find((p) => p.id === note.createdBy);
              return (
                <button
                  key={note.id}
                  onClick={() => setEditingNote(note)}
                  className="row-card-hover"
                  style={{
                    textAlign: 'left',
                    cursor: 'pointer',
                    border: 'none',
                    paddingTop: 10,
                    paddingBottom: 10,
                    borderBottom: '1px solid var(--border-light)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 4,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          padding: '2px 7px',
                          borderRadius: '999px',
                          background: typeStyle.bg,
                          color: typeStyle.color,
                        }}
                      >
                        {getNoteTypeLabel(note.type).toUpperCase()}
                      </span>
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {getTimeAgo(note.createdAt)}
                    </span>
                  </div>
                  {note.content && (
                    <p
                      style={{
                        fontSize: 13,
                        color: 'var(--text-primary)',
                        lineHeight: 1.5,
                        marginBottom: 4,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {note.content}
                    </p>
                  )}
                  <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    by {creator?.name ?? 'Unknown'}
                  </p>
                </button>
              );
            });
            return (
              <LogSection key={group.label} label={group.label} count={group.items.length}>
                <div
                  className="no-last-border"
                  style={{
                    background: 'var(--surface)',
                    borderRadius: 'var(--radius)',
                    overflow: 'hidden',
                    padding: 0,
                  }}
                >
                  {rows}
                </div>
              </LogSection>
            );
          })}
        </div>
      )}

      {/* ── Todos tab ── */}
      {tab === 'todos' && (
        <div>
          {categorized.today.length > 0 && (
            <TodoSection
              label="Today"
              todos={categorized.today}
              onToggle={handleTodoToggle}
              onEdit={setEditingTodo}
              data={data}
            />
          )}
          {categorized.upcoming.length > 0 && (
            <TodoSection
              label="Upcoming"
              todos={categorized.upcoming}
              onToggle={handleTodoToggle}
              onEdit={setEditingTodo}
              data={data}
            />
          )}
          {categorized.noDueDate.length > 0 && (
            <TodoSection
              label="No due date"
              todos={categorized.noDueDate}
              onToggle={handleTodoToggle}
              onEdit={setEditingTodo}
              data={data}
            />
          )}
          {categorized.completed.length > 0 && (
            <TodoSection
              label="Completed"
              todos={categorized.completed}
              onToggle={handleTodoToggle}
              onEdit={setEditingTodo}
              data={data}
              defaultOpen={false}
            />
          )}
          {todos.length === 0 && (
            <div style={{ textAlign: 'center', padding: '32px 20px' }}>
              <p
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  marginBottom: 6,
                }}
              >
                No to-dos yet
              </p>
              <p
                style={{
                  fontSize: 13,
                  color: 'var(--text-muted)',
                  lineHeight: 1.6,
                  maxWidth: 240,
                  margin: '0 auto',
                }}
              >
                To-dos are upcoming things to act on — a call to make, a visit to plan, or anything
                you want to follow up on.
              </p>
              <p
                style={{
                  fontSize: 12,
                  color: 'var(--text-muted)',
                  lineHeight: 1.5,
                  maxWidth: 240,
                  margin: '10px auto 0',
                  fontWeight: 600,
                }}
              >
                Only assigned shepherds and pastors can see these.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Notices tab ── */}
      {tab === 'notices' && (
        <div>
          {notices.length === 0 && (
            <div style={{ textAlign: 'center', padding: '32px 20px' }}>
              <p
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  marginBottom: 6,
                }}
              >
                No notices yet
              </p>
              <p
                style={{
                  fontSize: 13,
                  color: 'var(--text-muted)',
                  lineHeight: 1.6,
                  maxWidth: 260,
                  margin: '0 auto',
                }}
              >
                Notices are things worth flagging for your shepherds or pastor — a health condition,
                a difficult season, or anything that calls for collective awareness.
              </p>
            </div>
          )}
          {notices.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(['urgent', 'moderate', 'ongoing'] as const).map((level) => {
                const group = notices.filter((n) => n.urgency === level);
                if (group.length === 0) return null;
                return group.map((notice) => (
                  <NoticeCard
                    key={notice.id}
                    notice={notice}
                    onClick={() => setEditingNotice(notice)}
                  />
                ));
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Family Info tab ── */}
      {tab === 'info' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Members */}
          <div>
            <p
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: 8,
              }}
            >
              Members
            </p>
            <div
              className="no-last-border"
              style={{
                background: 'var(--surface)',
                borderRadius: 14,
                overflow: 'hidden',
                padding: 0,
              }}
            >
              {members.map((m, i) => {
                const palette = SHEPHERD_AVATAR_PALETTE[i % SHEPHERD_AVATAR_PALETTE.length];
                const inits = m.englishName
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2);
                return (
                  <Link
                    key={m.id}
                    href={`/person/${m.id}`}
                    className="row-card-hover"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      paddingTop: 12,
                      paddingBottom: 12,
                      borderBottom: '1px solid var(--border-light)',
                    }}
                  >
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: '50%',
                        background: palette.bg,
                        color: palette.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 13,
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {inits}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                          marginBottom: 2,
                        }}
                      >
                        {m.englishName}
                        {m.chineseName && (
                          <span
                            style={{
                              fontWeight: 400,
                              fontSize: 12,
                              color: 'var(--text-muted)',
                              marginLeft: 6,
                            }}
                          >
                            {m.chineseName}
                          </span>
                        )}
                      </p>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {getMembershipLabel(m.membershipStatus)}
                        {m.lastContactDate && (
                          <span>
                            {' '}
                            · Logged{' '}
                            {format(parseISO(m.lastContactDate), 'MMM d')}
                          </span>
                        )}
                      </p>
                    </div>
                    <CaretRight size={14} color="var(--text-muted)" />
                  </Link>
                );
              })}
              {family.childCount && family.childCount > 0 && (
                <div
                  style={{
                    paddingTop: 11,
                    paddingBottom: 11,
                    borderBottom: '1px solid var(--border-light)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: '50%',
                      background: 'var(--sage-light)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Baby size={20} color="var(--sage)" />
                  </div>
                  <div>
                    <p
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        marginBottom: 2,
                      }}
                    >
                      Children
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {family.childCount} {family.childCount === 1 ? 'child' : 'children'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Details */}
          <div>
            <p
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: 8,
              }}
            >
              Details
            </p>
            <div
              className="no-last-border"
              style={{
                background: 'var(--surface)',
                borderRadius: 14,
                overflow: 'hidden',
                padding: 0,
              }}
            >
              {family.primaryContactId &&
                (() => {
                  const pc = members.find((m) => m.id === family.primaryContactId);
                  return pc ? (
                    <InfoRow icon={<User size={15} />} label="Primary" value={pc.englishName} />
                  ) : null;
                })()}
              {familyGroups.length > 0 && (
                <InfoRow
                  icon={<UsersFour size={15} />}
                  label="Groups"
                  value={
                    <div
                      style={{
                        display: 'flex',
                        gap: 5,
                        flexWrap: 'wrap',
                        justifyContent: 'flex-end',
                      }}
                    >
                      {familyGroups.map((g) => (
                        <button
                          key={g.id}
                          onClick={() => setPreviewGroupId(g.id)}
                          style={{
                            fontSize: 11,
                            padding: '2px 8px',
                            borderRadius: '999px',
                            background: 'var(--blue-light)',
                            color: 'var(--blue)',
                            fontWeight: 500,
                            border: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          {g.name}
                        </button>
                      ))}
                    </div>
                  }
                />
              )}
              {familyShepherds.length > 0 && (
                <InfoRow
                  icon={<HandHeart size={15} />}
                  label="Shepherd"
                  value={
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6,
                        alignItems: 'flex-end',
                      }}
                    >
                      {familyShepherds.map((s) => {
                        const sp = s.personId ? data.people.find((p) => p.id === s.personId) : null;
                        const initials = s.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .toUpperCase()
                          .slice(0, 2);
                        const inner = (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            {sp?.photo ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={sp.photo}
                                alt={s.name}
                                style={{
                                  width: 24,
                                  height: 24,
                                  borderRadius: '50%',
                                  objectFit: 'cover',
                                  flexShrink: 0,
                                }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: 24,
                                  height: 24,
                                  borderRadius: '50%',
                                  background: 'var(--sage-light)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: 9,
                                  fontWeight: 700,
                                  color: 'var(--sage)',
                                  flexShrink: 0,
                                }}
                              >
                                {initials}
                              </div>
                            )}
                            <span
                              style={{
                                fontSize: 13,
                                fontWeight: 500,
                                color: sp ? 'var(--blue)' : 'var(--text-primary)',
                              }}
                            >
                              {s.name}
                            </span>
                            {sp && <CaretRight size={11} color="var(--blue)" />}
                          </div>
                        );
                        return sp ? (
                          <Link
                            key={s.id}
                            href={`/person/${sp.id}`}
                            style={{ textDecoration: 'none' }}
                          >
                            {inner}
                          </Link>
                        ) : (
                          <div key={s.id}>{inner}</div>
                        );
                      })}
                    </div>
                  }
                />
              )}
            </div>
          </div>

          {/* Meta */}
          {(family.createdAt || family.createdBy) && (
            <div>
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: 8,
                }}
              >
                Meta
              </p>
              <div
                className="no-last-border"
                style={{
                  background: 'var(--surface)',
                  borderRadius: 14,
                  overflow: 'hidden',
                  padding: 0,
                }}
              >
                {family.createdAt && (
                  <InfoRow
                    label="Added"
                    value={format(parseISO(family.createdAt), 'MMM d, yyyy')}
                  />
                )}
                {family.createdBy &&
                  (() => {
                    const creator = data.personas.find((p) => p.id === family.createdBy);
                    return creator ? <InfoRow label="Created by" value={creator.name} /> : null;
                  })()}
              </div>
            </div>
          )}
        </div>
      )}

      {showAddLog && (
        <AddLogModal
          onClose={() => {
            setShowAddLog(false);
            setPendingLogTodo(null);
          }}
          prefillFamilyId={pendingLogTodo?.familyId ?? id}
          prefillPersonId={pendingLogTodo?.personId}
          prefillContent={pendingLogTodo?.title}
          prefillType="check-in"
        />
      )}
      {showAddTodo && <AddTodoModal onClose={() => setShowAddTodo(false)} prefillFamilyId={id} />}
      {showAddNotice && (
        <AddNoticeModal onClose={() => setShowAddNotice(false)} prefillFamilyId={id} />
      )}
      {editingNote && <AddLogModal onClose={() => setEditingNote(null)} note={editingNote} />}
      {editingTodo && <AddTodoModal onClose={() => setEditingTodo(null)} todo={editingTodo} />}
      {editingNotice && (
        <AddNoticeModal onClose={() => setEditingNotice(null)} notice={editingNotice} />
      )}
      {showEditFamily && (
        <EditFamilyDrawer family={family} onClose={() => setShowEditFamily(false)} />
      )}
      {previewGroupId && (
        <GroupPreviewModal groupId={previewGroupId} onClose={() => setPreviewGroupId(null)} />
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
    </div>
  );
}

function NoticeCard({
  notice,
  onClick,
}: {
  notice: Notice;
  onClick: () => void;
}) {
  const style = URGENCY_STYLE[notice.urgency as import('@/lib/types').NoticeUrgency];
  return (
    <button
      onClick={onClick}
      className="row-card-hover"
      style={{
        textAlign: 'left',
        cursor: 'pointer',
        border: '1px solid var(--border-light)',
        borderRadius: 12,
        padding: '12px 14px',
        background: style.bg,
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: '999px',
            background: style.pillBg,
            color: style.color,
            letterSpacing: '0.03em',
          }}
        >
          {URGENCY_LABEL[notice.urgency]}
        </span>
        {notice.categories.map((cat) => (
          <span
            key={cat}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 3,
              fontSize: 11,
              fontWeight: 500,
              padding: '2px 8px',
              borderRadius: '999px',
              background: CATEGORY_STYLE[cat]?.bg,
              color: CATEGORY_STYLE[cat]?.color,
            }}
          >
            {CATEGORY_ICON[cat]}
            {CATEGORY_LABEL[cat]}
          </span>
        ))}
      </div>
      <p
        style={{
          fontSize: 14,
          color: 'var(--text-primary)',
          lineHeight: 1.5,
          margin: 0,
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
        }}
      >
        {notice.content}
      </p>
      <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
        <Eye size={11} />
        {PRIVACY_LABEL[notice.privacy] ?? notice.privacy}
      </p>
    </button>
  );
}

function LogSection({
  label,
  count,
  children,
}: {
  label: string;
  count: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(true);
  return (
    <div style={{ marginBottom: 16 }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 0',
          marginBottom: open ? 8 : 0,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: 10,
          fontWeight: 600,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}
      >
        {label} · {count}
        <CaretDown
          size={10}
          style={{
            transition: 'transform 0.2s',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </button>
      {open && children}
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
}: {
  label: string;
  todos: Todo[];
  onToggle: (id: string) => void;
  onEdit: (todo: Todo) => void;
  data: AppData;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <div style={{ marginBottom: 16 }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 0',
          marginBottom: open ? 8 : 0,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: 10,
          fontWeight: 600,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
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
          className="no-last-border"
          style={{
            background: 'var(--surface)',
            borderRadius: 'var(--radius)',
            overflow: 'hidden',
            padding: 0,
          }}
        >
          {todos.map((t) => {
            const person = t.personId ? data.people.find((p) => p.id === t.personId) : null;
            const family = t.familyId ? data.families.find((f) => f.id === t.familyId) : null;
            const tag = person?.englishName || family?.label || '';
            const hasRepeat = t.repeat && t.repeat !== 'none';
            return (
              <div
                key={t.id}
                className="row-card-hover"
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  paddingTop: 10,
                  paddingBottom: 10,
                  borderBottom: '1px solid var(--border-light)',
                }}
              >
                <button
                  onClick={() => onToggle(t.id)}
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    flexShrink: 0,
                    marginTop: 2,
                    border: t.completed ? 'none' : '2px solid var(--border)',
                    background: t.completed ? 'var(--sage)' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  {t.completed && <Check size={11} color="#fff" weight="bold" />}
                </button>
                <button
                  onClick={() => onEdit(t)}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    background: 'none',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  <p
                    style={{
                      fontSize: 14,
                      color: t.completed ? 'var(--text-muted)' : 'var(--text-primary)',
                      lineHeight: 1.4,
                      marginBottom: 4,
                      textDecoration: t.completed ? 'line-through' : 'none',
                    }}
                  >
                    {t.title}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {t.dueDate && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          color: 'var(--text-muted)',
                        }}
                      >
                        <Clock size={12} />
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {fmtDue(t.dueDate)}
                        </span>
                      </div>
                    )}
                    {hasRepeat && <ArrowsClockwise size={12} color="var(--text-muted)" />}
                    {tag && (
                      <span
                        style={{
                          fontSize: 10,
                          color: 'var(--blue)',
                          padding: '1px 6px',
                          borderRadius: '999px',
                          background: 'var(--blue-light)',
                          fontWeight: 500,
                        }}
                      >
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

function InfoRow({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        padding: '11px 16px',
        borderBottom: '1px solid var(--border-light)',
        gap: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, paddingTop: 1 }}>
        {icon && (
          <span style={{ color: 'var(--text-muted)', display: 'flex', flexShrink: 0 }}>{icon}</span>
        )}
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{label}</span>
      </div>
      <span
        style={{
          fontSize: 13,
          color: 'var(--text-primary)',
          fontWeight: 500,
          textAlign: 'right',
          lineHeight: 1.5,
        }}
      >
        {value}
      </span>
    </div>
  );
}
