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
  fullName,
  fmtDue,
  fmtShortDate,
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
import ConfirmActionSheet from '@/components/ConfirmActionSheet';
import {
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
  UsersThree,
  PencilSimpleIcon,
  CaretLeft,
  CaretRight,
  DotsThreeVertical,
  Trash,
  Archive,
  CaretDown,
  Plus,
  Users,
} from '@phosphor-icons/react';
import {
  SHEPHERD_AVATAR_PALETTE,
  Z_SUBHEADER,
  archiveConfirmCopy,
  deletePersonConfirmCopy,
} from '@/lib/constants';
import { InfoRow } from '@/components/InfoRow';
import { VisitorCardPanel } from '@/components/VisitorCardPanel';
import { AvatarBadge } from '@/components/AvatarBadge';
import { TabIcon } from '@/components/TabIcon';
import { LogSection } from '@/components/LogSection';
import { InfoSection } from '@/components/InfoSection';
import { TodoSection } from '@/components/TodoSection';

type Tab = 'logs' | 'todos' | 'notices' | 'info';

const TAB_LABELS: Record<Tab, string> = {
  logs: 'Logs',
  todos: 'To-dos',
  notices: 'Notices',
  info: 'Info',
};

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
    mapProvider,
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
  const fromParam = searchParams.get('from');
  const [tab, setTabState] = React.useState<Tab>(initialTab);

  const setTab = (t: Tab) => {
    setTabState(t);
    const qs = new URLSearchParams({ tab: t });
    if (fromParam) qs.set('from', fromParam);
    router.replace(`/person/${id}?${qs.toString()}`, { scroll: false });
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
  const [viewingLinkedTodo, setViewingLinkedTodo] = React.useState<Todo | null>(null);
  const [linkedTodoReturnNote, setLinkedTodoReturnNote] = React.useState<Note | null>(null);
  const [showEditPerson, setShowEditPerson] = React.useState(false);
  const [previewGroupId, setPreviewGroupId] = React.useState<string | null>(null);
  const [showKebab, setShowKebab] = React.useState(false);
  const [confirmAction, setConfirmAction] = React.useState<'archive' | 'delete' | null>(null);
  const [scrolled, setScrolled] = React.useState(false);
  const kebabRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
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
      <div className="pt-16 text-center text-text-muted">
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
      .map((p) => ({ id: p.id, name: fullName(p), personId: p.id })),
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

  // Notices are visible to all shepherds and admins, not just assigned shepherds.
  const canSeeNotices = canEdit || currentPersona.role === 'shepherd';

  // Build the visible tabs — non-managers see Info + Notices (if shepherd/admin); managers see all
  const visibleTabs: Tab[] = !canManage
    ? canSeeNotices
      ? ['notices', 'info']
      : ['info']
    : ['logs', 'todos', 'notices', 'info'];

  // If the active tab isn't in the visible set (e.g. persona switched), clamp to info
  const activeTab = visibleTabs.includes(tab) ? tab : 'info';

  const firstName = person.preferredName;
  const initials = fullName(person)
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
    if (person.churchAttendance !== 'archived') router.push('/');
  };

  const handleDelete = () => {
    deletePerson(person.id);
    setConfirmAction(null);
    router.push('/');
  };

  return (
    <div className="person-page-shell">
      <div className="person-content-wrapper pb-8">
      {/* ── Nav bar ── */}
      <div
        className="sticky top-0 bg-bg flex items-center justify-between h-[3.375rem] z-header"
      >
        <button
          onClick={() => router.push(fromParam ?? '/')}
          className="inline-flex items-center gap-1 text-13 text-sage bg-transparent border-none cursor-pointer shrink-0"
        >
          <CaretLeft size={16} />
          Back
        </button>

        <span
          className="person-nav-title text-14 font-medium text-text-secondary flex-1 text-center px-2 overflow-hidden text-ellipsis whitespace-nowrap"
        >
          {firstName}
        </span>

        <div className="flex items-center gap-2 shrink-0">
          {activeTab === 'info' ? (
            canEdit && (
              <button
                onClick={() => setShowEditPerson(true)}
                className="rounded-xs bg-sage text-on-sage border-none cursor-pointer flex items-center gap-[0.3125rem] font-semibold whitespace-nowrap transition-[height,padding,font-size] duration-[250ms] ease-in-out"
                style={{
                  height: scrolled ? 30 : 36,
                  padding: scrolled ? '0 0.625rem' : '0 0.75rem',
                  fontSize: scrolled ? 'var(--text-13)' : 'var(--text-14)',
                }}
              >
                <PencilSimpleIcon size={scrolled ? 13 : 15} weight="bold" />
                Info
              </button>
            )
          ) : activeTab === 'notices' ? (
            canManage && (
              <button
                onClick={() => setShowAddNotice(true)}
                className="rounded-xs bg-sage text-on-sage font-semibold border-none cursor-pointer whitespace-nowrap flex items-center gap-1 transition-[height,padding,font-size] duration-[250ms] ease-in-out"
                style={{
                  height: scrolled ? 30 : 36,
                  padding: scrolled ? '0 0.75rem' : '0 0.875rem',
                  fontSize: scrolled ? 'var(--text-13)' : 'var(--text-14)',
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
              className="rounded-xs bg-sage text-on-sage font-semibold border-none cursor-pointer whitespace-nowrap flex items-center gap-1 transition-[height,padding,font-size] duration-[250ms] ease-in-out"
              style={{
                height: scrolled ? 30 : 36,
                padding: scrolled ? '0 0.75rem' : '0 0.875rem',
                fontSize: scrolled ? 'var(--text-13)' : 'var(--text-14)',
              }}
            >
              <Plus size={14} weight="bold" />
              {activeTab === 'logs' ? 'Log' : 'To-do'}
            </button>
          )}

          {canEdit && (
            <div ref={kebabRef} className="relative">
              <button
                aria-label="More options"
                onClick={() => setShowKebab((v) => !v)}
                className="rounded-full bg-surface border border-border text-text-muted flex items-center justify-center cursor-pointer transition-[width,height] duration-[250ms] ease-in-out"
                style={{
                  width: scrolled ? 30 : 36,
                  height: scrolled ? 30 : 36,
                }}
              >
                <DotsThreeVertical size={16} />
              </button>
              {showKebab && (
                <div
                  className="absolute right-0 bg-surface border border-border rounded-md overflow-hidden min-w-[11.25rem] z-dropdown shadow-elevated"
                  style={{
                    top: 'calc(100% + 0.375rem)',
                  }}
                >
                  {activeTab !== 'info' && (
                    <button
                      onClick={() => {
                        setShowKebab(false);
                        setShowEditPerson(true);
                      }}
                      className="w-full flex items-center gap-2.5 py-[0.8125rem] px-4 bg-transparent border-none border-b border-border-light cursor-pointer text-14 text-text-primary text-left"
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
                    className="w-full flex items-center gap-2.5 py-[0.8125rem] px-4 bg-transparent border-none border-b border-border-light cursor-pointer text-14 text-text-primary text-left"
                  >
                    <Archive size={16} />
                    {person.churchAttendance === 'archived' ? 'Unarchive' : 'Archive'}
                  </button>
                  <button
                    onClick={() => {
                      setShowKebab(false);
                      setConfirmAction('delete');
                    }}
                    className="w-full flex items-center gap-2.5 py-[0.8125rem] px-4 bg-transparent border-none cursor-pointer text-14 text-red text-left"
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

      <div className="person-body">
      <div className="person-sidebar-col">
      {/* ── Large title — scrolls away ── */}
      <div className="person-header-block pt-7 pb-5 flex gap-4">
        {/* Avatar */}
        <PhotoAvatar
          photo={person.photo}
          originalPhoto={person.originalPhoto}
          name={fullName(person)}
          entityPath={`people/${person.id}`}
          onPhotoChange={(photoUrl, originalUrl) =>
            updatePerson(person.id, { photo: photoUrl, originalPhoto: originalUrl })
          }
          onPhotoRemove={() =>
            updatePerson(person.id, { photo: undefined, originalPhoto: undefined })
          }
        />

        {/* Name + meta */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-[0.4375rem] mb-[0.3125rem]">
            <div className="person-name-row min-w-0">
              <h1
                className="person-name-h1 text-26 font-extrabold text-text-primary leading-tight tracking-tight-2"
              >
                {fullName(person)}
              </h1>
              {person.alternativeName && (
                <span
                  className="person-alt-name text-14 font-normal text-text-muted"
                >
                  {person.alternativeName}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-[0.3125rem] flex-wrap">
            <span className="text-13 text-text-secondary">
              {getMembershipLabel(person.membershipStatus)}
            </span>
            {groups.map((g) => (
              <>
                <span key={`dot-${g.id}`} className="text-13 text-text-muted">
                  ·
                </span>
                <button
                  key={g.id}
                  onClick={() => setPreviewGroupId(g.id)}
                  className="text-11 py-0.5 px-[0.4375rem] rounded-pill bg-blue-light text-blue font-semibold border-none cursor-pointer"
                >
                  {g.name}
                </button>
              </>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tabs (desktop sidebar variant) ── */}
      {visibleTabs.length > 1 && (
        <nav className="person-tabs-desktop">
          {visibleTabs.map((t) => {
            const active = activeTab === t;
            const count =
              t === 'todos' ? incompleteTodosCount : t === 'notices' ? notices.length : 0;

            let onAction: (() => void) | null = null;
            let actionIcon: React.ReactNode = null;
            let actionLabel = '';
            if (t === 'logs' && canManage) {
              onAction = () => setShowAddLog(true);
              actionIcon = <Plus size={13} weight="bold" />;
              actionLabel = 'Add log';
            } else if (t === 'todos' && canManage) {
              onAction = () => setShowAddTodo(true);
              actionIcon = <Plus size={13} weight="bold" />;
              actionLabel = 'Add to-do';
            } else if (t === 'notices' && canManage) {
              onAction = () => setShowAddNotice(true);
              actionIcon = <Plus size={13} weight="bold" />;
              actionLabel = 'Add notice';
            } else if (t === 'info' && canEdit) {
              onAction = () => setShowEditPerson(true);
              actionIcon = <PencilSimpleIcon size={12} weight="bold" />;
              actionLabel = 'Edit info';
            }

            return (
              <div key={t} className="person-tab-row" data-active={active}>
                <button
                  onClick={() => setTab(t as Tab)}
                  className="person-tab-item"
                  data-active={active}
                >
                  <TabIcon tab={t as Tab} active={active} />
                  <span className="person-tab-label-group">
                    <span>{TAB_LABELS[t as Tab]}</span>
                    {count > 0 && <span className="person-tab-badge">{count}</span>}
                  </span>
                </button>
                {onAction && (
                  <button
                    type="button"
                    onClick={onAction}
                    className="person-tab-action"
                    aria-label={actionLabel}
                  >
                    {actionIcon}
                  </button>
                )}
              </div>
            );
          })}
        </nav>
      )}
      </div>
      <div className="person-main-col">
      {/* ── Tabs — sticky below nav bar (mobile) ── */}
      {visibleTabs.length > 1 && (
        <div
          className="person-tabs-mobile sticky top-[3.375rem] bg-bg flex border-b-2 border-border-light mb-5 z-subheader"
        >
          {visibleTabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t as Tab)}
              className="flex-1 py-[0.625rem] text-13 bg-transparent border-none cursor-pointer -mb-0.5 flex items-center justify-center gap-[0.3125rem] transition-[color,border-bottom-color] duration-[180ms] ease-in-out"
              style={{
                fontWeight: activeTab === t ? 'var(--font-bold)' : 'var(--font-normal)',
                color: activeTab === t ? 'var(--sage)' : 'var(--text-muted)',
                borderBottom:
                  activeTab === t ? '0.125rem solid var(--sage)' : '0.125rem solid transparent',
              }}
            >
              <TabIcon tab={t as Tab} active={activeTab === t} />
              {TAB_LABELS[t as Tab]}
              {t === 'todos' && incompleteTodosCount > 0 && (
                <span className="text-11 font-semibold bg-sage text-on-sage rounded-sm py-[0.0625rem] px-1.5 leading-normal">
                  {incompleteTodosCount}
                </span>
              )}
              {t === 'notices' && notices.length > 0 && (
                <span className="text-11 font-semibold bg-sage text-on-sage rounded-sm py-[0.0625rem] px-1.5 leading-normal">
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
                  linkedTodoTitle={
                    note.todoId ? data.todos.find((t) => t.id === note.todoId)?.title : undefined
                  }
                />
              );
            });
            return (
              <LogSection key={group.label} label={group.label} count={group.items.length}>
                <div className="no-last-border bg-surface rounded overflow-hidden p-0">
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
          {categorized.overdue.length > 0 && (
            <TodoSection
              label="Overdue"
              todos={categorized.overdue}
              onToggle={handleTodoToggle}
              onEdit={setEditingTodo}
              data={data}
              labelColor="var(--red, #c0392b)"
            />
          )}
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
            <div className="flex flex-col gap-2.5">
              {/* Sort: urgent first, then moderate, then ongoing */}
              {(['urgent', 'moderate', 'ongoing'] as const).flatMap((level) => {
                const group = notices.filter((n) => n.urgency === level);
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

      {/* Sheep tab — only for shepherds */}
      {/* Info tab */}
      {activeTab === 'info' && (
        <div className="tab-fade flex flex-col gap-6">
          <VisitorCardPanel person={person} />
          {/* ACCESS */}
          {(() => {
            const role = (person.appRole ?? 'no-access') as AppRole;
            const roleLabel: Record<AppRole, string> = {
              admin: 'Admin',
              shepherd: 'User',
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
            (person.lifeStage && person.lifeStage.length > 0) ||
            (person.language && person.language.length > 0) ||
            family) && (
            <InfoSection title="Personal">
              {person.language && person.language.length > 0 && (
                <InfoRow
                  icon={<Globe size={15} />}
                  label="Language"
                  value={person.language.join(', ')}
                />
              )}
              {person.lifeStage && person.lifeStage.length > 0 && (
                <InfoRow
                  icon={<Users size={15} />}
                  label="Life stage"
                  value={person.lifeStage.join(', ')}
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
              {family && (
                <InfoRow
                  icon={<UsersThree size={15} />}
                  label="Family"
                  value={
                    <Link
                      href={`/family/${family.id}`}
                      className="text-blue no-underline inline-flex items-center gap-1"
                    >
                      {family.label}
                      <CaretRight size={13} />
                    </Link>
                  }
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
                  <div className="flex flex-col gap-1.5 items-end">
                    {shepherds.map((s) => {
                      const sp = s.personId ? data.people.find((p) => p.id === s.personId) : null;
                      const inner = (
                        <div className="flex items-center gap-1.5">
                          <AvatarBadge name={s.name} photo={sp?.photo} size={24} />
                          <span
                            className="text-13 font-medium"
                            style={{ color: sp ? 'var(--blue)' : 'var(--text-primary)' }}
                          >
                            {s.name}
                          </span>
                          {sp && <CaretRight size={11} color="var(--blue)" />}
                        </div>
                      );
                      return sp ? (
                        <Link
                          key={s.id}
                          href={`/person/${sp.id}?from=/person/${id}`}
                          className="no-underline"
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
                <div className="flex items-center justify-between py-[0.6875rem] px-4 border-b border-border-light gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-text-muted flex">
                      <HandHeart size={15} />
                    </span>
                    <span className="text-13 text-text-muted">Sheep</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {sheep.length > 2 && (
                      <button
                        onClick={() => setSheepExpanded((v) => !v)}
                        className="flex items-center gap-1 text-12 font-medium text-text-secondary bg-transparent border-none cursor-pointer p-0"
                      >
                        {sheepExpanded ? 'Hide' : 'Show all'}
                        {!sheepExpanded && (
                          <span className="text-11 font-semibold py-[0.0625rem] px-[0.4375rem] rounded-pill bg-sage-light text-sage">
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
                      <span className="text-11 font-semibold py-[0.0625rem] px-[0.4375rem] rounded-pill bg-sage-light text-sage">
                        {sheep.length}
                      </span>
                    )}
                  </div>
                </div>
                {/* Inline sheep list — always shown for ≤2; shown when expanded for >2 */}
                {sheep.length > 0 && (sheep.length <= 2 || sheepExpanded) && (
                  <div
                    className="pt-2 px-4 pb-3 flex flex-col gap-2 border-b border-border-light"
                  >
                    {sheep.map((s) => {
                      return (
                        <Link
                          key={s.id}
                          href={`/person/${s.id}?from=/person/${id}`}
                          className="flex items-center gap-2 no-underline"
                        >
                          <AvatarBadge name={fullName(s)} photo={s.photo} size={24} />
                          <span className="text-13 font-medium text-blue">
                            {fullName(s)}
                          </span>
                          {s.alternativeName && (
                            <span className="text-12 text-text-muted">
                              {s.alternativeName}
                            </span>
                          )}
                          <CaretRight
                            size={11}
                            color="var(--blue)"
                            className="ml-auto"
                          />
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
                  <div className="flex gap-[0.3125rem] flex-wrap justify-end">
                    {groups.map((g) => (
                      <button
                        key={g.id}
                        onClick={() => setPreviewGroupId(g.id)}
                        className="text-11 py-[0.1875rem] px-[0.5625rem] rounded-pill bg-blue-light text-blue font-medium border-none cursor-pointer"
                      >
                        {g.name}
                      </button>
                    ))}
                  </div>
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
                      className="text-blue no-underline"
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
                      className="text-blue no-underline"
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
                      className="text-blue no-underline"
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
                      className="text-blue no-underline text-right leading-normal block whitespace-pre-wrap"
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
                return creator ? <InfoRow label="Added by" value={creator.name} muted /> : null;
              })()}
            <InfoRow
              label="Last edited"
              muted
              value={
                person.lastEditedAt ? (
                  currentPersona.role === 'admin' ? (
                    <Link
                      href={`/person/${person.id}/audit`}
                      className="text-sage underline underline-offset-[0.2em]"
                    >
                      {format(parseISO(person.lastEditedAt), 'MMM d, yyyy')}
                    </Link>
                  ) : (
                    format(parseISO(person.lastEditedAt), 'MMM d, yyyy')
                  )
                ) : (
                  '—'
                )
              }
            />
          </InfoSection>
        </div>
      )}
      </div>
      </div>

      {showAddLog && !viewingLinkedTodo && (
        <AddLogModal
          onClose={() => {
            setShowAddLog(false);
            setPendingLogTodo(null);
          }}
          prefillPersonId={person.id}
          prefillContent={pendingLogTodo?.title}
          prefillType="check-in"
          prefillTodoId={pendingLogTodo?.id}
          prefillDate={pendingLogTodo?.completedAt}
          onOpenTodo={(todoId) => {
            const t = data.todos.find((x) => x.id === todoId);
            if (t) setViewingLinkedTodo(t);
          }}
        />
      )}
      {showAddTodo && (
        <AddTodoModal onClose={() => setShowAddTodo(false)} prefillPersonId={person.id} />
      )}
      {editingNote && !viewingLinkedTodo && (
        <AddLogModal
          onClose={() => setEditingNote(null)}
          note={editingNote}
          onOpenTodo={(todoId) => {
            const t = data.todos.find((x) => x.id === todoId);
            if (t) {
              setLinkedTodoReturnNote(editingNote);
              setViewingLinkedTodo(t);
            }
          }}
        />
      )}
      {viewingLinkedTodo && (
        <AddTodoModal
          todo={viewingLinkedTodo}
          onClose={() => {
            setViewingLinkedTodo(null);
            setLinkedTodoReturnNote(null);
            setPendingLogTodo(null);
            setShowAddLog(false);
            setEditingNote(null);
          }}
          onBack={() => {
            setViewingLinkedTodo(null);
            if (linkedTodoReturnNote) {
              setEditingNote(linkedTodoReturnNote);
              setLinkedTodoReturnNote(null);
            }
          }}
        />
      )}
      {editingTodo && <AddTodoModal onClose={() => setEditingTodo(null)} todo={editingTodo} />}
      {showAddNotice && (
        <AddNoticeModal onClose={() => setShowAddNotice(false)} prefillPersonId={person.id} />
      )}
      {editingNotice && (
        <AddNoticeModal
          onClose={() => setEditingNotice(null)}
          notice={editingNotice}
          readOnly={!canManage}
        />
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

      {confirmAction === 'archive' && (
        <ConfirmActionSheet
          {...archiveConfirmCopy(firstName, person.churchAttendance === 'archived')}
          tone="neutral"
          onConfirm={handleArchive}
          onCancel={() => setConfirmAction(null)}
        />
      )}
      {confirmAction === 'delete' && (
        <ConfirmActionSheet
          {...deletePersonConfirmCopy(firstName)}
          tone="danger"
          onConfirm={handleDelete}
          onCancel={() => setConfirmAction(null)}
        />
      )}
      </div>
    </div>
  );
}

