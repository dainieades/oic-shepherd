'use client';

import { format, parseISO } from 'date-fns';
import React from 'react';
import {
  Baby,
  UsersFour,
  User,
  HandHeart,
  PencilSimpleIcon,
  CaretLeft,
  CaretRight,
  DotsThreeVertical,
  House,
  Plus,
} from '@phosphor-icons/react';
import Link from 'next/link';
import { useApp } from '@/lib/context';
import {
  getMembershipLabel,
  getFamilyNotes,
  getFamilyTodos,
  getFamilyNotices,
  groupByMonth,
  categorizeTodos,
  fullName,
} from '@/lib/utils';
import { type Todo, type Note, type AppData, type Notice } from '@/lib/types';
import AddLogModal from '@/components/AddLogModal';
import { EmptyState } from '@/components/EmptyState';
import { LogItem } from '@/components/LogItem';
import AddTodoModal from '@/components/AddTodoModal';
import AddNoticeModal from '@/components/AddNoticeModal';
import { NoticeCard } from '@/components/NoticeCard';
import TodoLogPrompt from '@/components/TodoLogPrompt';
import EditFamilyDrawer from '@/components/EditFamilyDrawer';
import GroupPreviewModal from '@/components/GroupPreviewModal';
import PhotoAvatar from '@/components/PhotoAvatar';
import { SHEPHERD_AVATAR_PALETTE, Z_SUBHEADER } from '@/lib/constants';
import { InfoRow } from '@/components/InfoRow';
import { AvatarBadge } from '@/components/AvatarBadge';
import { TabIcon } from '@/components/TabIcon';
import { LogSection } from '@/components/LogSection';
import { InfoSection } from '@/components/InfoSection';
import { TodoSection } from '@/components/TodoSection';
import { RecordInfoSection } from '@/components/RecordInfoSection';

type Tab = 'logs' | 'todos' | 'notices' | 'info';

const TAB_LABELS: Record<Tab, string> = {
  logs: 'Logs',
  todos: 'To-dos',
  notices: 'Notices',
  info: 'Family Info',
};

export default function FamilyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const { data, toggleTodo, canViewNote, updateFamily, currentPersona } = useApp();
  const canSeeNotices =
    currentPersona.role === 'admin' || currentPersona.role === 'shepherd';
  const _familyCheck = data.families.find((f) => f.id === id);
  const _membersCheck = _familyCheck
    ? data.people.filter((p) => _familyCheck.memberIds.includes(p.id))
    : [];
  const _canManageCheck =
    currentPersona.role === 'admin' ||
    _membersCheck.some(
      (m) => currentPersona.personId === m.id || currentPersona.assignedPeopleIds.includes(m.id)
    );
  const [tab, setTab] = React.useState<Tab>(_canManageCheck ? 'logs' : 'info');
  const [showAddLog, setShowAddLog] = React.useState(false);
  const [showAddTodo, setShowAddTodo] = React.useState(false);
  const [showAddNotice, setShowAddNotice] = React.useState(false);
  const [editingNote, setEditingNote] = React.useState<Note | null>(null);
  const [editingTodo, setEditingTodo] = React.useState<Todo | null>(null);
  const [editingNotice, setEditingNotice] = React.useState<Notice | null>(null);
  const [todoLogPrompt, setTodoLogPrompt] = React.useState<Todo | null>(null);
  const [pendingLogTodo, setPendingLogTodo] = React.useState<Todo | null>(null);
  const [viewingLinkedTodo, setViewingLinkedTodo] = React.useState<Todo | null>(null);
  const [linkedTodoReturnNote, setLinkedTodoReturnNote] = React.useState<Note | null>(null);
  const [showEditFamily, setShowEditFamily] = React.useState(false);
  const [previewGroupId, setPreviewGroupId] = React.useState<string | null>(null);
  const [showKebab, setShowKebab] = React.useState(false);
  const [kebabDropdownPos, setKebabDropdownPos] = React.useState<{ top: number; right: number } | null>(null);
  const [scrolled, setScrolled] = React.useState(false);
  const kebabRef = React.useRef<HTMLDivElement>(null);

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

  React.useEffect(() => {
    if (!showKebab) return;
    const close = () => setShowKebab(false);
    window.addEventListener('scroll', close, { passive: true, capture: true });
    return () => window.removeEventListener('scroll', close, { capture: true });
  }, [showKebab]);

  const family = data.families.find((f) => f.id === id);
  if (!family) {
    return (
      <div className="pt-16 text-center text-text-muted">
        Family not found
      </div>
    );
  }

  const members = data.people.filter((p) => family.memberIds.includes(p.id));
  const canManageFamily =
    currentPersona.role === 'admin' ||
    members.some(
      (m) => currentPersona.personId === m.id || currentPersona.assignedPeopleIds.includes(m.id)
    );
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

  const memberCountText = (() => {
    const adultCount = members.length;
    const parts = [`${adultCount} adult${adultCount !== 1 ? 's' : ''}`];
    if (family.childCount && family.childCount > 0)
      parts.push(`${family.childCount} kid${family.childCount !== 1 ? 's' : ''}`);
    return parts.join(' · ');
  })();

  const visibleTabs: Tab[] = [
    ...(canManageFamily ? (['logs', 'todos'] as Tab[]) : []),
    ...(canSeeNotices ? (['notices'] as Tab[]) : []),
    'info',
  ];

  return (
    <div className="family-page-shell">
    <div className="pb-10">
      {/* ── Nav bar ── */}
      <div
        className="sticky top-0 bg-bg flex items-center justify-between h-[3.375rem] z-header"
      >
        <Link
          href="/"
          className="inline-flex items-center gap-[0.1875rem] text-13 text-sage no-underline font-medium"
        >
          <CaretLeft size={16} />
          Back
        </Link>

        <span className="text-14 font-medium text-text-secondary">
          {family.label.split(' ')[0]}
        </span>

        <div className="flex items-center gap-2">
          {tab === 'info' ? (
            <button
              onClick={() => setShowEditFamily(true)}
              className="rounded-xs bg-sage text-on-sage border-none cursor-pointer flex items-center gap-[0.3125rem] font-semibold whitespace-nowrap"
              style={{
                height: scrolled ? 30 : 36,
                padding: scrolled ? '0 0.625rem' : '0 0.75rem',
                fontSize: scrolled ? 'var(--text-13)' : 'var(--text-14)',
                transition: 'height 0.25s ease, padding 0.25s ease, font-size 0.25s ease',
              }}
            >
              <PencilSimpleIcon size={scrolled ? 13 : 15} weight="bold" />
              Info
            </button>
          ) : tab === 'notices' && !canManageFamily ? null : (
            <button
              onClick={
                tab === 'logs'
                  ? () => setShowAddLog(true)
                  : tab === 'todos'
                    ? () => setShowAddTodo(true)
                    : () => setShowAddNotice(true)
              }
              className="rounded-xs bg-sage text-on-sage font-semibold border-none cursor-pointer whitespace-nowrap flex items-center gap-1"
              style={{
                height: scrolled ? 30 : 36,
                padding: scrolled ? '0 0.75rem' : '0 0.875rem',
                fontSize: scrolled ? 'var(--text-13)' : 'var(--text-14)',
                transition: 'height 0.25s ease, padding 0.25s ease, font-size 0.25s ease',
              }}
            >
              <Plus size={14} weight="bold" />
              {tab === 'logs' ? 'Log' : tab === 'todos' ? 'To-do' : 'Notice'}
            </button>
          )}
          <div ref={kebabRef} className="relative">
            <button
              aria-label="More options"
              onClick={() => {
                if (!showKebab && kebabRef.current) {
                  const rect = kebabRef.current.getBoundingClientRect();
                  setKebabDropdownPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right });
                }
                setShowKebab((v) => !v);
              }}
              className="rounded-full bg-surface border border-border text-text-muted flex items-center justify-center cursor-pointer"
              style={{
                width: scrolled ? 30 : 36,
                height: scrolled ? 30 : 36,
                transition: 'width 0.25s ease, height 0.25s ease',
              }}
            >
              <DotsThreeVertical size={16} />
            </button>
            {showKebab && kebabDropdownPos && (
              <div
                className="bg-surface border border-border rounded-md overflow-hidden min-w-[11.25rem] z-dropdown shadow-elevated"
                style={{
                  position: 'fixed',
                  top: kebabDropdownPos.top,
                  right: kebabDropdownPos.right,
                }}
              >
                <button
                  onClick={() => {
                    setShowKebab(false);
                    setShowEditFamily(true);
                  }}
                  className="w-full flex items-center gap-2.5 py-[0.8125rem] px-4 bg-none border-none cursor-pointer text-14 text-text-primary text-left"
                >
                  <PencilSimpleIcon size={16} />
                  Edit info
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="family-body">
      <div className="family-sidebar-col">
      {/* ── Page header — scrolls away ── */}
      <div className="pt-[1.75rem] pb-5 flex items-center gap-4">
        {/* Avatar / Photo */}
        <PhotoAvatar
          photo={family.photo}
          originalPhoto={family.originalPhoto}
          name={family.label}
          entityPath={`families/${family.id}`}
          placeholder={<House size={30} color="var(--sage)" />}
          onPhotoChange={(photoUrl, originalUrl) =>
            updateFamily(family.id, { photo: photoUrl, originalPhoto: originalUrl })
          }
          onPhotoRemove={() =>
            updateFamily(family.id, { photo: undefined, originalPhoto: undefined })
          }
        />

        {/* Name + meta */}
        <div className="flex-1 min-w-0">
          <h1
            className="text-26 font-extrabold text-text-primary leading-tight tracking-tight-2 mb-[0.3125rem]"
          >
            {family.label}
          </h1>
          <div className="flex items-center gap-[0.3125rem] flex-wrap">
            <span className="text-13 text-text-secondary">{memberCountText}</span>
            {familyGroups.map((g) => (
              <React.Fragment key={g.id}>
                <span className="text-13 text-text-muted">·</span>
                <button
                  onClick={() => setPreviewGroupId(g.id)}
                  className="text-11 py-[0.125rem] px-[0.4375rem] rounded-pill bg-blue-light text-blue font-semibold border-none cursor-pointer"
                >
                  {g.name}
                </button>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tabs (desktop sidebar variant) ── */}
      {visibleTabs.length > 1 && (
        <nav className="family-tabs-desktop">
          {visibleTabs.map((t) => {
            const active = tab === t;
            const count =
              t === 'todos' ? incompleteTodosCount : t === 'notices' ? notices.length : 0;

            let onAction: (() => void) | null = null;
            let actionIcon: React.ReactNode = null;
            let actionLabel = '';
            if (t === 'logs') {
              onAction = () => setShowAddLog(true);
              actionIcon = <Plus size={13} weight="bold" />;
              actionLabel = 'Add log';
            } else if (t === 'todos') {
              onAction = () => setShowAddTodo(true);
              actionIcon = <Plus size={13} weight="bold" />;
              actionLabel = 'Add to-do';
            } else if (t === 'notices' && canManageFamily) {
              onAction = () => setShowAddNotice(true);
              actionIcon = <Plus size={13} weight="bold" />;
              actionLabel = 'Add notice';
            } else if (t === 'info') {
              onAction = () => setShowEditFamily(true);
              actionIcon = <PencilSimpleIcon size={12} weight="bold" />;
              actionLabel = 'Edit info';
            }

            return (
              <div key={t} className="family-tab-row" data-active={active}>
                <button
                  onClick={() => setTab(t)}
                  className="family-tab-item"
                  data-active={active}
                >
                  <TabIcon tab={t} active={active} />
                  <span className="family-tab-label-group">
                    <span>{TAB_LABELS[t]}</span>
                    {count > 0 && <span className="family-tab-badge">{count}</span>}
                  </span>
                </button>
                {onAction && (
                  <button
                    type="button"
                    onClick={onAction}
                    className="family-tab-action"
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
      <div className="family-main-col">
      {/* ── Tabs — sticky below nav bar (mobile) ── */}
      <div
        className="family-tabs-mobile sticky top-[3.375rem] bg-bg flex border-b-[0.125rem] border-border-light mb-5 z-subheader"
      >
        {visibleTabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 flex items-center justify-center gap-[0.3125rem] text-13 border-none cursor-pointer bg-none py-[0.625rem] px-0 -mb-[0.125rem]"
            style={{
              fontWeight: tab === t ? 'var(--font-semibold)' : 'var(--font-normal)',
              color: tab === t ? 'var(--sage)' : 'var(--text-muted)',
              borderBottom: tab === t ? '0.125rem solid var(--sage)' : '0.125rem solid transparent',
            }}
          >
            <TabIcon tab={t} active={tab === t} />
            {TAB_LABELS[t]}
            {t === 'todos' && incompleteTodosCount > 0 && (
              <span className="text-11 font-semibold bg-sage text-on-sage rounded-sm py-[0.0625rem] px-[0.375rem] leading-normal">
                {incompleteTodosCount}
              </span>
            )}
            {t === 'notices' && notices.length > 0 && (
              <span className="text-11 font-semibold bg-sage text-on-sage rounded-sm py-[0.0625rem] px-[0.375rem] leading-normal">
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
                <div
                  className="no-last-border bg-surface rounded overflow-hidden p-0"
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
            <EmptyState
              title="No to-dos yet"
              description="To-dos are upcoming things to act on — a call to make, a visit to plan, or anything you want to follow up on."
              subtext="Only assigned shepherds and pastors can see these."
            />
          )}
        </div>
      )}

      {/* ── Notices tab ── */}
      {tab === 'notices' && (
        <div>
          {notices.length === 0 && (
            <EmptyState
              title="No notices yet"
              description="Notices are things worth flagging for your shepherds or pastor — a health condition, a difficult season, or anything that calls for collective awareness."
            />
          )}
          {notices.length > 0 && (
            <div className="flex flex-col gap-2.5">
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
        <div className="flex flex-col gap-6">
          {/* Members */}
          <div>
            <p className="text-11 font-semibold text-text-muted uppercase tracking-wide-6 mb-2">
              Members
            </p>
            <div
              className="no-last-border bg-surface rounded overflow-hidden p-0"
            >
              {members.map((m, i) => {
                const palette = SHEPHERD_AVATAR_PALETTE[i % SHEPHERD_AVATAR_PALETTE.length];
                return (
                  <Link
                    key={m.id}
                    href={`/person/${m.id}?from=/family/${id}`}
                    className="row-card-hover flex items-center gap-3 pt-3 pb-3 border-b border-border-light"
                  >
                    <AvatarBadge
                      name={fullName(m)}
                      photo={m.photo}
                      size={38}
                      bg={palette.bg}
                      color={palette.color}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-14 font-semibold text-text-primary mb-[0.125rem]">
                        {fullName(m)}
                        {m.alternativeName && (
                          <span className="font-normal text-12 text-text-muted ml-[0.375rem]">
                            {m.alternativeName}
                          </span>
                        )}
                      </p>
                      <p className="text-12 text-text-muted">
                        {getMembershipLabel(m.membershipStatus)}
                        {m.lastContactDate && (
                          <span> · Logged {format(parseISO(m.lastContactDate), 'MMM d')}</span>
                        )}
                      </p>
                    </div>
                    <CaretRight size={14} color="var(--text-muted)" />
                  </Link>
                );
              })}
              {family.childCount && family.childCount > 0 && (
                <div className="pt-[0.6875rem] pb-[0.6875rem] border-b border-border-light flex items-center gap-3">
                  <div className="w-[2.375rem] h-[2.375rem] rounded-full bg-sage-light flex items-center justify-center shrink-0">
                    <Baby size={20} color="var(--sage)" />
                  </div>
                  <div>
                    <p className="text-14 font-semibold text-text-primary mb-[0.125rem]">
                      Children
                    </p>
                    <p className="text-12 text-text-muted">
                      {family.childCount} {family.childCount === 1 ? 'child' : 'children'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Details */}
          <div>
            <p className="text-11 font-semibold text-text-muted uppercase tracking-wide-6 mb-2">
              Details
            </p>
            <div
              className="no-last-border bg-surface rounded overflow-hidden p-0"
            >
              {family.primaryContactId &&
                (() => {
                  const pc = members.find((m) => m.id === family.primaryContactId);
                  return pc ? (
                    <InfoRow icon={<User size={15} />} label="Primary" value={fullName(pc)} />
                  ) : null;
                })()}
              {familyGroups.length > 0 && (
                <InfoRow
                  icon={<UsersFour size={15} />}
                  label="Groups"
                  value={
                    <div className="flex gap-[0.3125rem] flex-wrap justify-end">
                      {familyGroups.map((g) => (
                        <button
                          key={g.id}
                          onClick={() => setPreviewGroupId(g.id)}
                          className="text-11 py-[0.125rem] px-2 rounded-pill bg-blue-light text-blue font-medium border-none cursor-pointer"
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
                    <div className="flex flex-col gap-1.5 items-end">
                      {familyShepherds.map((s) => {
                        const sp = s.personId ? data.people.find((p) => p.id === s.personId) : null;
                        const inner = (
                          <div className="flex items-center gap-1.5">
                            <AvatarBadge name={s.name} photo={sp?.photo} size={24} />
                            <span
                              className="text-13 font-medium"
                              style={{
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
                            href={`/person/${sp.id}?from=/family/${id}`}
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
            </div>
          </div>

          {/* Record info */}
          <RecordInfoSection family={family} notes={notes} />
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
          prefillFamilyId={pendingLogTodo?.familyId ?? id}
          prefillPersonId={pendingLogTodo?.personId}
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
      {showAddTodo && <AddTodoModal onClose={() => setShowAddTodo(false)} prefillFamilyId={id} />}
      {showAddNotice && (
        <AddNoticeModal onClose={() => setShowAddNotice(false)} prefillFamilyId={id} />
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
      {editingNotice && (
        <AddNoticeModal
          onClose={() => setEditingNotice(null)}
          notice={editingNotice}
          readOnly={!canManageFamily}
        />
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
    </div>
  );
}

