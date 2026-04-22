'use client';

import { format, parseISO } from 'date-fns';
import React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApp } from '@/lib/context';
import {
  getMembershipLabel,
  getChurchAttendanceLabel,
  getPersonNotes,
  groupByMonth,
  categorizeTodos,
  getMapUrl,
  type MapProvider,
  MAP_PROVIDERS_STORAGE_KEY,
} from '@/lib/utils';
import { type Todo, type Note, type AppData, type AppRole, type Notice } from '@/lib/types';
import AddLogModal from '@/components/AddLogModal';
import { EmptyState } from '@/components/EmptyState';
import { LogItem } from '@/components/LogItem';
import AddTodoModal from '@/components/AddTodoModal';
import AddNoticeModal from '@/components/AddNoticeModal';
import { NoticeCard } from '@/components/NoticeCard';
import TodoLogPrompt from '@/components/TodoLogPrompt';
import EditPersonDrawer from '@/components/EditPersonDrawer';
import GroupPreviewModal from '@/components/GroupPreviewModal';
import PhotoAvatar from '@/components/PhotoAvatar';
import {
  Notepad,
  CheckCircle,
  Info,
  Globe,
  Pulse,
  GenderIntersex,
  Cake,
  Heart,
  Sparkle,
  IdentificationCard,
  CalendarCheck,
  Drop,
  Compass,
  Buildings,
  Phone,
  PhoneCall,
  Envelope,
  House,
  HandHeart,
  UsersFour,
  PencilSimpleIcon,
  Bell,
  CaretLeft,
  CaretRight,
  DotsThreeVertical,
  Trash,
  Archive,
  Check,
  Clock,
  ArrowsClockwise,
  CaretDown,
  Plus,
} from '@phosphor-icons/react';
import { BACKDROP_COLOR, SHEET_MAX_WIDTH, SHEET_BORDER_RADIUS, SHEPHERD_AVATAR_PALETTE } from '@/lib/constants';
import { InfoRow } from '@/components/InfoRow';
import { AvatarBadge } from '@/components/AvatarBadge';

type Tab = 'logs' | 'todos' | 'notices' | 'info';

const TAB_LABELS: Record<Tab, string> = {
  logs: 'Logs',
  todos: 'To-dos',
  notices: 'Notices',
  info: 'Info',
};

function TabIcon({ tab, active }: { tab: Tab; active: boolean }) {
  const weight = active ? 'fill' : 'regular';
  if (tab === 'logs') return <Notepad size={16} weight={weight} />;
  if (tab === 'todos') return <CheckCircle size={16} weight={weight} />;
  if (tab === 'notices') return <Bell size={16} weight={weight} />;
  return <Info size={16} weight={weight} />;
}

function fmtDue(iso: string) {
  return format(parseISO(iso), 'M/d/yyyy h:mm a');
}

export default function PersonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    data,
    currentPersona,
    toggleTodo,
    canViewNote,
    updatePerson,
    deletePerson,
    assignShepherds,
  } = useApp();
  // Compute permission early so we can pick the correct initial tab
  const _personCheck = data.people.find((p) => p.id === id);
  const _canManageCheck = _personCheck
    ? currentPersona.role === 'admin' ||
      currentPersona.personId === _personCheck.id ||
      currentPersona.assignedPeopleIds.includes(_personCheck.id)
    : true;
  const initialTab: Tab = _canManageCheck
    ? ((searchParams.get('tab') as Tab | null) ?? 'logs')
    : 'info';
  const [tab, setTabState] = React.useState<Tab>(initialTab);

  const setTab = (t: Tab) => {
    setTabState(t);
    router.replace(`/person/${id}?tab=${t}`, { scroll: false });
  };
  const [showAddLog, setShowAddLog] = React.useState(false);
  const [showAddTodo, setShowAddTodo] = React.useState(false);
  const [showAddNotice, setShowAddNotice] = React.useState(false);
  const [editingNotice, setEditingNotice] = React.useState<Notice | null>(null);
  const [sheepExpanded, setSheepExpanded] = React.useState(false);
  const [editingNote, setEditingNote] = React.useState<Note | null>(null);
  const [editingTodo, setEditingTodo] = React.useState<Todo | null>(null);
  const [todoLogPrompt, setTodoLogPrompt] = React.useState<Todo | null>(null);
  const [pendingLogTodo, setPendingLogTodo] = React.useState<Todo | null>(null);
  const [showEditPerson, setShowEditPerson] = React.useState(false);
  const [previewGroupId, setPreviewGroupId] = React.useState<string | null>(null);
  const [showKebab, setShowKebab] = React.useState(false);
  const [confirmAction, setConfirmAction] = React.useState<'archive' | 'delete' | null>(null);
  const [scrolled, setScrolled] = React.useState(false);
  const [mapProvider, setMapProvider] = React.useState<MapProvider>('apple');
  const kebabRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  React.useEffect(() => {
    const stored = localStorage.getItem(MAP_PROVIDERS_STORAGE_KEY) as MapProvider | null;
    if (stored) setMapProvider(stored);
  }, []);

  React.useEffect(() => {
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
    return (
      <div style={{ paddingTop: 64, textAlign: 'center', color: 'var(--text-muted)' }}>
        Person not found
      </div>
    );
  }

  // Permission: can manage this person if admin, or they are in my assigned people, or it's myself
  const canManage = (() => {
    if (currentPersona.role === 'admin') return true;
    if (currentPersona.personId === person.id) return true;
    return currentPersona.assignedPeopleIds.includes(person.id);
  })();

  // Any shepherd or admin can edit info (canManage is stricter — only for tabs/logs)
  const canEdit = currentPersona.role === 'admin' || currentPersona.role === 'shepherd';

  const family = person.familyId ? data.families.find((f) => f.id === person.familyId) : null;
  const groups = data.groups.filter((g) => person.groupIds.includes(g.id));
  const personaPersonIds = new Set(data.personas.map((p) => p.personId).filter(Boolean));
  const shepherds: { id: string; name: string; personId?: string }[] = [
    ...data.personas.filter((p) => person.assignedShepherdIds.includes(p.id)),
    ...data.people
      .filter(
        (p) =>
          p.isShepherd && !personaPersonIds.has(p.id) && person.assignedShepherdIds.includes(p.id)
      )
      .map((p) => ({ id: p.id, name: p.englishName, personId: p.id })),
  ];
  const notes = getPersonNotes(person.id, data.notes).filter((n) => canViewNote(n));
  const todos = data.todos.filter((t) => t.personId === person.id);
  const notices = (data.notices ?? []).filter((n) => n.personId === person.id);
  const categorized = categorizeTodos(todos);
  const incompleteTodosCount = todos.filter((t) => !t.completed).length;

  // Shepherd → Sheep relationship
  const shepherdPersona = person.isShepherd
    ? data.personas.find((p) => p.personId === person.id)
    : null;
  // For isShepherd people without a persona, their shepherd ID is their own person ID
  const shepherdId = shepherdPersona?.id ?? (person.isShepherd ? person.id : null);
  const sheep = shepherdId
    ? data.people.filter((p) => p.assignedShepherdIds.includes(shepherdId))
    : [];

  // Notices are visible to all shepherds/admins, not just assigned shepherds
  const canSeeNotices = canEdit; // admin or shepherd role

  // Build the visible tabs — non-managers see Info + Notices (if shepherd/admin); managers see all
  const visibleTabs: Tab[] = !canManage
    ? canSeeNotices
      ? ['notices', 'info']
      : ['info']
    : ['logs', 'todos', 'notices', 'info'];

  // If the active tab isn't in the visible set (e.g. persona switched), clamp to info
  const activeTab = visibleTabs.includes(tab) ? tab : 'info';

  const firstName = person.englishName.split(' ')[0];
  const initials = person.englishName
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();


  const handleTodoToggle = (todoId: string) => {
    const todo = data.todos.find((t) => t.id === todoId);
    if (todo && !todo.completed) {
      toggleTodo(todoId);
      setTodoLogPrompt(todo);
    } else {
      toggleTodo(todoId);
    }
  };

  const handleArchive = () => {
    updatePerson(person.id, {
      churchAttendance: person.churchAttendance === 'archived' ? 'regular' : 'archived',
    });
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
        <button
          onClick={() => router.back()}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 13,
            color: 'var(--sage)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <CaretLeft size={16} />
          Back
        </button>

        <span
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: 'var(--text-secondary)',
            flex: 1,
            textAlign: 'center',
            padding: '0 8px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {firstName}
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {activeTab === 'info' ? (
            canEdit && (
              <button
                onClick={() => setShowEditPerson(true)}
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
            )
          ) : activeTab === 'notices' ? (
            canSeeNotices && (
              <button
                onClick={() => setShowAddNotice(true)}
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
                Notice
              </button>
            )
          ) : (
            <button
              onClick={
                activeTab === 'logs' ? () => setShowAddLog(true) : () => setShowAddTodo(true)
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
              {activeTab === 'logs' ? 'Log' : 'To-do'}
            </button>
          )}

          {canEdit && (
            <div ref={kebabRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setShowKebab((v) => !v)}
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
                    top: 'calc(100% + 6px)',
                    right: 0,
                    zIndex: 50,
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 12,
                    boxShadow: '0 8px 28px rgba(0,0,0,0.12)',
                    minWidth: 180,
                    overflow: 'hidden',
                  }}
                >
                  {activeTab !== 'info' && (
                    <button
                      onClick={() => {
                        setShowKebab(false);
                        setShowEditPerson(true);
                      }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '13px 16px',
                        background: 'none',
                        border: 'none',
                        borderBottom: '1px solid var(--border-light)',
                        cursor: 'pointer',
                        fontSize: 14,
                        color: 'var(--text-primary)',
                        textAlign: 'left',
                      }}
                    >
                      <PencilSimpleIcon size={16} />
                      Edit info
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setShowKebab(false);
                      setConfirmAction('archive');
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '13px 16px',
                      background: 'none',
                      border: 'none',
                      borderBottom: '1px solid var(--border-light)',
                      cursor: 'pointer',
                      fontSize: 14,
                      color: 'var(--text-primary)',
                      textAlign: 'left',
                    }}
                  >
                    <Archive size={16} />
                    {person.churchAttendance === 'archived' ? 'Unarchive' : 'Archive'}
                  </button>
                  <button
                    onClick={() => {
                      setShowKebab(false);
                      setConfirmAction('delete');
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
                      color: 'var(--red)',
                      textAlign: 'left',
                    }}
                  >
                    <Trash size={16} />
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
        <PhotoAvatar
          photo={person.photo}
          name={person.englishName}
          onPhotoChange={(url) => updatePerson(person.id, { photo: url })}
          onPhotoRemove={() => updatePerson(person.id, { photo: undefined })}
        />

        {/* Name + meta */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 7,
              marginBottom: 5,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 7,
                minWidth: 0,
                overflow: 'hidden',
              }}
            >
              <h1
                style={{
                  fontSize: 26,
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  lineHeight: 1.15,
                  letterSpacing: '-0.02em',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {person.englishName}
              </h1>
              {person.chineseName && (
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 400,
                    color: 'var(--text-muted)',
                    flexShrink: 0,
                  }}
                >
                  {person.chineseName}
                </span>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              {getMembershipLabel(person.membershipStatus)}
            </span>
            {groups.map((g) => (
              <>
                <span key={`dot-${g.id}`} style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  ·
                </span>
                <button
                  key={g.id}
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
              </>
            ))}
          </div>
        </div>
      </div>


      {/* ── Tabs — sticky below nav bar ── */}
      {visibleTabs.length > 1 && (
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
          {visibleTabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t as Tab)}
              style={{
                flex: 1,
                padding: '10px 0',
                fontSize: 13,
                fontWeight: activeTab === t ? 700 : 400,
                color: activeTab === t ? 'var(--sage)' : 'var(--text-muted)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                borderBottom: activeTab === t ? '2px solid var(--sage)' : '2px solid transparent',
                marginBottom: -2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
                transition: 'color 0.18s ease, border-bottom-color 0.18s ease',
              }}
            >
              <TabIcon tab={t as Tab} active={activeTab === t} />
              {TAB_LABELS[t as Tab]}
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
                    background: 'var(--red)',
                    color: 'var(--on-red)',
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
      )}

      {/* Logs tab */}
      {activeTab === 'logs' && (
        <div className="tab-fade">
          {notes.length === 0 && (
            <EmptyState
              title="No logs yet"
              description="Logs capture past interactions — a conversation, a check-in, a prayer request, or a moment you shared together."
              subtext="Only assigned shepherds and pastors can see these."
            />
          )}
          {groupByMonth(notes).map((group) => {
            const rows = group.items.map((note) => {
              const creator = data.personas.find((p) => p.id === note.createdBy);
              return (
                <LogItem
                  key={note.id}
                  note={note}
                  onClick={() => setEditingNote(note)}
                  creatorName={creator?.name}
                />
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

      {/* Todos tab */}
      {activeTab === 'todos' && (
        <div className="tab-fade">
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
            <EmptyState
              title="No to-dos yet"
              description="To-dos are upcoming things to act on — a call to make, a visit to plan, or anything you want to follow up on."
              subtext="Only assigned shepherds and pastors can see these."
            />
          )}
        </div>
      )}

      {/* Notices tab */}
      {activeTab === 'notices' && (
        <div className="tab-fade">
          {notices.length === 0 && (
            <EmptyState
              title="No notices yet"
              description="Notices are things worth flagging for your shepherds or pastor — a health condition, a difficult season, or anything that calls for collective awareness."
            />
          )}
          {notices.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* Sort: urgent first, then moderate, then ongoing */}
              {(['urgent', 'moderate', 'ongoing'] as const).map((level) => {
                const group = notices.filter((n) => n.urgency === level);
                if (group.length === 0) return null;
                return group.map((notice) => (
                  <NoticeCard
                    key={notice.id}
                    notice={notice}
                    onClick={() => {
                      if (canSeeNotices) setEditingNotice(notice);
                    }}
                  />
                ));
              })}
            </div>
          )}
        </div>
      )}

      {/* Sheep tab — only for shepherds */}
      {/* Info tab */}
      {activeTab === 'info' && (
        <div className="tab-fade" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* ACCESS */}
          {(() => {
            const role = (person.appRole ?? 'no-access') as AppRole;
            const roleLabel: Record<AppRole, string> = {
              admin: 'Admin',
              shepherd: 'Shepherd',
              'welcome-team': 'Welcome Team',
              'no-access': 'No Access',
            };
            return (
              <InfoSection title="Access">
                <InfoRow
                  icon={<IdentificationCard size={15} />}
                  label="App Role"
                  value={roleLabel[role]}
                />
              </InfoSection>
            );
          })()}

          {/* PERSONAL */}
          {(person.gender ||
            person.birthday ||
            person.maritalStatus ||
            (person.language && person.language.length > 0)) && (
            <InfoSection title="Personal">
              {person.language && person.language.length > 0 && (
                <InfoRow
                  icon={<Globe size={15} />}
                  label="Language"
                  value={person.language.join(', ')}
                />
              )}
              {person.gender && (
                <InfoRow
                  icon={<GenderIntersex size={15} />}
                  label="Gender"
                  value={person.gender.charAt(0).toUpperCase() + person.gender.slice(1)}
                />
              )}
              {person.birthday && (
                <InfoRow
                  icon={<Cake size={15} />}
                  label="Birthday"
                  value={fmtShortDate(person.birthday)}
                />
              )}
              {person.maritalStatus && (
                <InfoRow
                  icon={<Heart size={15} />}
                  label="Marital Status"
                  value={
                    person.maritalStatus.charAt(0).toUpperCase() + person.maritalStatus.slice(1)
                  }
                />
              )}
              {person.maritalStatus === 'married' && person.anniversary && (
                <InfoRow
                  icon={<Sparkle size={15} />}
                  label="Anniversary"
                  value={fmtShortDate(person.anniversary)}
                />
              )}
            </InfoSection>
          )}

          {/* CHURCH */}
          <InfoSection title="Church">
            <InfoRow
              icon={<IdentificationCard size={15} />}
              label="Status"
              value={getMembershipLabel(person.membershipStatus)}
            />
            <InfoRow
              icon={<Pulse size={15} />}
              label="Attendance"
              value={getChurchAttendanceLabel(person.churchAttendance)}
            />
            {person.membershipStatus === 'member' && person.membershipDate && (
              <InfoRow
                icon={<CalendarCheck size={15} />}
                label="Member Since"
                value={fmtShortDate(person.membershipDate)}
              />
            )}
            {person.baptismDate && (
              <InfoRow
                icon={<Drop size={15} />}
                label="Baptism Date"
                value={fmtShortDate(person.baptismDate)}
              />
            )}
            {shepherds.length > 0 && (
              <InfoRow
                icon={<HandHeart size={15} />}
                label="Shepherd by"
                value={
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                      alignItems: 'flex-end',
                    }}
                  >
                    {shepherds.map((s) => {
                      const sp = s.personId ? data.people.find((p) => p.id === s.personId) : null;
                      const inner = (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <AvatarBadge name={s.name} photo={sp?.photo} size={24} />
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
            {person.isShepherd && (
              <>
                {/* Sheep row — visible to all; edit only for admin/shepherd */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '11px 16px',
                    borderBottom: '1px solid var(--border-light)',
                    gap: 12,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: 'var(--text-muted)', display: 'flex' }}>
                      <HandHeart size={15} />
                    </span>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Sheep</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {sheep.length > 2 && (
                      <button
                        onClick={() => setSheepExpanded((v) => !v)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: 12,
                          fontWeight: 500,
                          color: 'var(--text-secondary)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 0,
                        }}
                      >
                        {sheepExpanded ? 'Hide' : 'Show all'}
                        {!sheepExpanded && (
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 600,
                              padding: '1px 7px',
                              borderRadius: 999,
                              background: 'var(--sage-light)',
                              color: 'var(--sage)',
                            }}
                          >
                            {sheep.length}
                          </span>
                        )}
                        <CaretDown
                          size={12}
                          style={{
                            transition: 'transform 0.2s',
                            transform: sheepExpanded ? 'rotate(180deg)' : 'none',
                          }}
                        />
                      </button>
                    )}
                    {sheep.length <= 2 && sheep.length > 0 && (
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          padding: '1px 7px',
                          borderRadius: 999,
                          background: 'var(--sage-light)',
                          color: 'var(--sage)',
                        }}
                      >
                        {sheep.length}
                      </span>
                    )}
                  </div>
                </div>
                {/* Inline sheep list — always shown for ≤2; shown when expanded for >2 */}
                {sheep.length > 0 && (sheep.length <= 2 || sheepExpanded) && (
                  <div
                    style={{
                      padding: '8px 16px 12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                      borderBottom: '1px solid var(--border-light)',
                    }}
                  >
                    {sheep.map((s) => {
                      return (
                        <Link
                          key={s.id}
                          href={`/person/${s.id}`}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            textDecoration: 'none',
                          }}
                        >
                          <AvatarBadge name={s.englishName} photo={s.photo} size={24} />
                          <span
                            style={{ fontSize: 13, fontWeight: 500, color: 'var(--blue)' }}
                          >
                            {s.englishName}
                          </span>
                          {s.chineseName && (
                            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                              {s.chineseName}
                            </span>
                          )}
                          <CaretRight size={11} color="var(--blue)" style={{ marginLeft: 'auto' }} />
                        </Link>
                      );
                    })}
                  </div>
                )}
              </>
            )}
            {person.isBeingDiscipled && (
              <InfoRow icon={<Compass size={15} />} label="Being discipled?" value="Yes" />
            )}
            {person.churchPositions && person.churchPositions.length > 0 && (
              <InfoRow
                icon={<Buildings size={15} />}
                label="Position"
                value={person.churchPositions.join(', ')}
              />
            )}
            {groups.length > 0 && (
              <InfoRow
                icon={<UsersFour size={15} />}
                label="Group"
                value={
                  <div
                    style={{
                      display: 'flex',
                      gap: 5,
                      flexWrap: 'wrap',
                      justifyContent: 'flex-end',
                    }}
                  >
                    {groups.map((g) => (
                      <button
                        key={g.id}
                        onClick={() => setPreviewGroupId(g.id)}
                        style={{
                          fontSize: 11,
                          padding: '3px 9px',
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
            {family && (
              <InfoRow
                label="Family"
                value={
                  <Link
                    href={`/family/${family.id}`}
                    style={{
                      color: 'var(--blue)',
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    {family.label}
                    <CaretRight size={13} />
                  </Link>
                }
              />
            )}
          </InfoSection>

          {/* CONTACT */}
          {(person.phone || person.homePhone || person.email || person.homeAddress) && (
            <InfoSection title="Contact">
              {person.phone && (
                <InfoRow
                  icon={<Phone size={15} />}
                  label="Phone"
                  value={
                    <a
                      href={`tel:${person.phone}`}
                      style={{ color: 'var(--blue)', textDecoration: 'none' }}
                    >
                      {person.phone}
                    </a>
                  }
                />
              )}
              {person.homePhone && (
                <InfoRow
                  icon={<PhoneCall size={15} />}
                  label="Home Phone"
                  value={
                    <a
                      href={`tel:${person.homePhone}`}
                      style={{ color: 'var(--blue)', textDecoration: 'none' }}
                    >
                      {person.homePhone}
                    </a>
                  }
                />
              )}
              {person.email && (
                <InfoRow
                  icon={<Envelope size={15} />}
                  label="Email"
                  value={
                    <a
                      href={`mailto:${person.email}`}
                      style={{ color: 'var(--blue)', textDecoration: 'none' }}
                    >
                      {person.email}
                    </a>
                  }
                />
              )}
              {person.homeAddress && (
                <InfoRow
                  icon={<House size={15} />}
                  label="Address"
                  value={
                    <a
                      href={getMapUrl(person.homeAddress, mapProvider)}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: 'var(--blue)',
                        textDecoration: 'none',
                        textAlign: 'right',
                        lineHeight: 1.5,
                        display: 'block',
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {person.homeAddress}
                    </a>
                  }
                />
              )}
            </InfoSection>
          )}

          {/* META */}
          <InfoSection title="Record info">
            <InfoRow
              label="Last logged"
              value={
                person.lastContactDate
                  ? format(parseISO(person.lastContactDate), 'MMM d, yyyy')
                  : 'Never'
              }
              muted
            />
            <InfoRow label="Added" value={fmtShortDate(person.createdAt)} muted />
            {person.createdBy &&
              (() => {
                const creator = data.personas.find((p) => p.id === person.createdBy);
                return creator ? <InfoRow label="Created by" value={creator.name} muted /> : null;
              })()}
          </InfoSection>
        </div>
      )}

      {showAddLog && (
        <AddLogModal
          onClose={() => {
            setShowAddLog(false);
            setPendingLogTodo(null);
          }}
          prefillPersonId={person.id}
          prefillContent={pendingLogTodo?.title}
          prefillType="check-in"
        />
      )}
      {showAddTodo && (
        <AddTodoModal onClose={() => setShowAddTodo(false)} prefillPersonId={person.id} />
      )}
      {editingNote && <AddLogModal onClose={() => setEditingNote(null)} note={editingNote} />}
      {editingTodo && <AddTodoModal onClose={() => setEditingTodo(null)} todo={editingTodo} />}
      {showAddNotice && (
        <AddNoticeModal onClose={() => setShowAddNotice(false)} prefillPersonId={person.id} />
      )}
      {editingNotice && (
        <AddNoticeModal onClose={() => setEditingNotice(null)} notice={editingNotice} />
      )}
      {showEditPerson && (
        <EditPersonDrawer person={person} onClose={() => setShowEditPerson(false)} />
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

      {/* ── Archive / Delete confirmation sheet ── */}
      {confirmAction && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: BACKDROP_COLOR,
            zIndex: 70,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
          }}
          onClick={() => setConfirmAction(null)}
        >
          <div
            className="animate-slide-up"
            style={{
              background: 'var(--surface)',
              borderRadius: SHEET_BORDER_RADIUS,
              width: '100%',
              maxWidth: SHEET_MAX_WIDTH,
              padding: '0 20px 36px',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                width: 36,
                height: 4,
                background: 'var(--border)',
                borderRadius: 2,
                margin: '14px auto 20px',
              }}
            />
            {confirmAction === 'archive' ? (
              <>
                <p
                  style={{
                    fontSize: 17,
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    textAlign: 'center',
                    marginBottom: 6,
                  }}
                >
                  {person.churchAttendance === 'archived' ? 'Unarchive' : 'Archive'} {firstName}?
                </p>
                <p
                  style={{
                    fontSize: 13,
                    color: 'var(--text-muted)',
                    textAlign: 'center',
                    marginBottom: 24,
                  }}
                >
                  {person.churchAttendance === 'archived'
                    ? 'They will be visible in the directory again.'
                    : 'They will be hidden from the main directory but their history will be preserved.'}
                </p>
                <button
                  onClick={handleArchive}
                  style={{
                    width: '100%',
                    height: 50,
                    borderRadius: 14,
                    background: 'var(--sage)',
                    color: 'var(--on-sage)',
                    fontSize: 16,
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                    marginBottom: 10,
                  }}
                >
                  {person.churchAttendance === 'archived' ? 'Unarchive' : 'Archive'}
                </button>
                <button
                  onClick={() => setConfirmAction(null)}
                  style={{
                    width: '100%',
                    height: 50,
                    borderRadius: 14,
                    background: 'var(--bg)',
                    color: 'var(--text-secondary)',
                    fontSize: 16,
                    fontWeight: 500,
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <p
                  style={{
                    fontSize: 17,
                    fontWeight: 700,
                    color: 'var(--red)',
                    textAlign: 'center',
                    marginBottom: 6,
                  }}
                >
                  Delete {firstName}?
                </p>
                <p
                  style={{
                    fontSize: 13,
                    color: 'var(--text-muted)',
                    textAlign: 'center',
                    marginBottom: 24,
                  }}
                >
                  This will permanently remove {firstName} and all their logs and to-dos. This
                  cannot be undone.
                </p>
                <button
                  onClick={handleDelete}
                  style={{
                    width: '100%',
                    height: 50,
                    borderRadius: 14,
                    background: 'var(--red)',
                    color: '#fff',
                    fontSize: 16,
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                    marginBottom: 10,
                  }}
                >
                  Delete permanently
                </button>
                <button
                  onClick={() => setConfirmAction(null)}
                  style={{
                    width: '100%',
                    height: 50,
                    borderRadius: 14,
                    background: 'var(--bg)',
                    color: 'var(--text-secondary)',
                    fontSize: 16,
                    fontWeight: 500,
                    border: 'none',
                    cursor: 'pointer',
                  }}
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
            const tag = family?.label || person?.englishName || '';
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

function InfoSection({
  title,
  children,
  muted: _muted,
}: {
  title: string;
  children: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <div>
      <p
        style={{
          fontSize: 10,
          fontWeight: 600,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          marginBottom: 8,
        }}
      >
        {title}
      </p>
      <div
        className="no-last-border"
        style={{ background: 'var(--surface)', borderRadius: 14, overflow: 'hidden', padding: 0 }}
      >
        {children}
      </div>
    </div>
  );
}

function fmtShortDate(iso: string) {
  const dateStr = iso.includes('T') ? iso.split('T')[0] : iso;
  const [year, month, day] = dateStr.split('-').map(Number);
  return format(new Date(year, month - 1, day), 'MMM d, yyyy');
}
