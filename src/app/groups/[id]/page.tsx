'use client';

import React from 'react';
import { SectionLabel } from '@/components/SectionLabel';
import { AvatarBadge } from '@/components/AvatarBadge';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/context';
import { getTimeAgo, getDueLabel, getMembershipLabel } from '@/lib/utils';
import {
  PencilSimpleIcon,
  TextT,
  AlignLeft,
  UserList,
  CaretRight,
  Crown,
  HandHeart,
  CaretLeft,
  Check,
} from '@phosphor-icons/react';
import { BACKDROP_COLOR, SHEET_MAX_WIDTH, SHEET_BORDER_RADIUS, SHEPHERD_AVATAR_PALETTE, Z_SHEET } from '@/lib/constants';

export default function GroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const router = useRouter();
  const { data, currentPersona, updateGroup, updateGroupMembers } = useApp();

  const [scrolled, setScrolled] = React.useState(false);
  const [showEdit, setShowEdit] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const group = data.groups.find((g) => g.id === id);
  if (!group) {
    return (
      <div style={{ paddingTop: 64, textAlign: 'center', color: 'var(--text-muted)' }}>
        Group not found
      </div>
    );
  }

  const myPersonId = currentPersona.personId;
  const iAmLeader = myPersonId ? group.leaderIds.includes(myPersonId) : false;
  const iAmShepherd = myPersonId ? group.shepherdIds.includes(myPersonId) : false;

  const leaders = data.people.filter((p) => group.leaderIds.includes(p.id));
  const shepherds = data.people.filter(
    (p) => group.shepherdIds.includes(p.id) && !group.leaderIds.includes(p.id)
  );
  const members = data.people.filter(
    (p) =>
      group.memberIds.includes(p.id) &&
      !group.leaderIds.includes(p.id) &&
      !group.shepherdIds.includes(p.id)
  );

  return (
    <div style={{ paddingBottom: 32 }}>
      {/* ── Sticky nav bar ── */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 'var(--z-header)',
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
          {scrolled ? group.name : ''}
        </span>

        <button
          onClick={() => setShowEdit(true)}
          style={{
            height: scrolled ? 30 : 36,
            padding: scrolled ? '0 10px' : '0 12px',
            borderRadius: 'var(--radius-xs)',
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
            flexShrink: 0,
          }}
        >
          <PencilSimpleIcon size={scrolled ? 13 : 15} weight="bold" />
          Edit
        </button>
      </div>

      {/* ── Group header card ── */}
      <div
        style={{
          background: 'var(--surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-light)',
          padding: '20px',
          marginBottom: 14,
        }}
      >
        <div style={{ marginBottom: 10 }}>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              marginBottom: iAmLeader || iAmShepherd ? 4 : 0,
            }}
          >
            {group.name}
          </h1>
          {(iAmLeader || iAmShepherd) && (
            <span style={{ fontSize: 12, color: 'var(--sage)', fontWeight: 500 }}>
              {iAmLeader && iAmShepherd
                ? "You're a leader & shepherd"
                : iAmLeader
                  ? "You're a leader"
                  : "You're a shepherd"}
            </span>
          )}
        </div>

        {/* Consistent chip row: always show all three */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            marginBottom: group.description ? 14 : 0,
            flexWrap: 'wrap',
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 500,
              padding: '3px 10px',
              borderRadius: 'var(--radius-pill)',
              background: 'var(--sage-light)',
              color: 'var(--sage)',
            }}
          >
            {group.memberIds.length} {group.memberIds.length === 1 ? 'member' : 'members'}
          </span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 500,
              padding: '3px 10px',
              borderRadius: 'var(--radius-pill)',
              background: 'var(--blue-light)',
              color: 'var(--blue)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Crown size={11} />
            {leaders.length} {leaders.length === 1 ? 'leader' : 'leaders'}
          </span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 500,
              padding: '3px 10px',
              borderRadius: 'var(--radius-pill)',
              background: 'var(--avatar-s1-bg)',
              color: 'var(--avatar-s1-text)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <HandHeart size={11} />
            {group.shepherdIds.length} {group.shepherdIds.length === 1 ? 'shepherd' : 'shepherds'}
          </span>
        </div>

        {group.description && (
          <p
            style={{
              fontSize: 13,
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
              paddingLeft: 12,
              borderLeft: '2px solid var(--sage-mid)',
              marginTop: 14,
            }}
          >
            {group.description}
          </p>
        )}
      </div>

      {/* ── Leaders ── */}
      {leaders.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <SectionLabel>Leaders</SectionLabel>
          <div
            className="no-last-border"
            style={{
              background: 'var(--surface)',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--border-light)',
              overflow: 'hidden',
            }}
          >
            {leaders.map((leader, i) => {
              const palette = SHEPHERD_AVATAR_PALETTE[i % SHEPHERD_AVATAR_PALETTE.length];
              const isAlsoShepherd = group.shepherdIds.includes(leader.id);
              return (
                <Link
                  key={leader.id}
                  href={`/person/${leader.id}`}
                  className="row-card-hover"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    paddingTop: 12,
                    paddingBottom: 12,
                    borderBottom: '1px solid var(--border-light)',
                    textDecoration: 'none',
                  }}
                >
                  <AvatarBadge
                    name={leader.englishName}
                    photo={leader.photo}
                    size={40}
                    bg={palette.bg}
                    color={palette.color}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}
                    >
                      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                        {leader.englishName}
                      </span>
                      {leader.chineseName && (
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {leader.chineseName}
                        </span>
                      )}
                      {isAlsoShepherd && (
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 600,
                            padding: '1px 6px',
                            borderRadius: 'var(--radius-pill)',
                            background: 'var(--avatar-s1-bg)',
                            color: 'var(--avatar-s1-text)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 3,
                          }}
                        >
                          <HandHeart size={10} />
                          Shepherd
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {getMembershipLabel(leader.membershipStatus)}
                    </span>
                  </div>
                  <CaretRight size={14} color="var(--text-muted)" />
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Shepherds (those who are shepherds but not leaders) ── */}
      {shepherds.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <SectionLabel>Shepherds</SectionLabel>
          <div
            className="no-last-border"
            style={{
              background: 'var(--surface)',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--border-light)',
              overflow: 'hidden',
            }}
          >
            {shepherds.map((shepherd) => {
              return (
                <Link
                  key={shepherd.id}
                  href={`/person/${shepherd.id}`}
                  className="row-card-hover"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    paddingTop: 12,
                    paddingBottom: 12,
                    borderBottom: '1px solid var(--border-light)',
                    textDecoration: 'none',
                  }}
                >
                  <AvatarBadge
                    name={shepherd.englishName}
                    photo={shepherd.photo}
                    size={40}
                    bg="var(--avatar-s1-bg)"
                    color="var(--avatar-s1-text)"
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}
                    >
                      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                        {shepherd.englishName}
                      </span>
                      {shepherd.chineseName && (
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {shepherd.chineseName}
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {getMembershipLabel(shepherd.membershipStatus)}
                    </span>
                  </div>
                  <CaretRight size={14} color="var(--text-muted)" />
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Members ── */}
      <div>
        <SectionLabel>Members · {members.length}</SectionLabel>
        {members.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>
            No members yet. Tap Edit to add members.
          </p>
        ) : (
          <div
            className="no-last-border"
            style={{
              background: 'var(--surface)',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--border-light)',
              overflow: 'hidden',
            }}
          >
            {members.map((m, i) => {
              const palette = SHEPHERD_AVATAR_PALETTE[i % SHEPHERD_AVATAR_PALETTE.length];
              const due = getDueLabel(m.nextFollowUpDate);

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
                    textDecoration: 'none',
                  }}
                >
                  <AvatarBadge
                    name={m.englishName}
                    photo={m.photo}
                    size={40}
                    bg={palette.bg}
                    color={palette.color}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}
                    >
                      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                        {m.englishName}
                      </span>
                      {m.chineseName && (
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {m.chineseName}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {getMembershipLabel(m.membershipStatus)}
                      </span>
                      {m.lastContactDate && (
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          &nbsp;· {getTimeAgo(m.lastContactDate)}
                        </span>
                      )}
                      {due.status !== 'ok' && due.status !== 'none' && (
                        <span
                          style={{
                            fontSize: 12,
                            color: due.status === 'overdue' ? 'var(--red)' : 'var(--amber)',
                            fontWeight: 500,
                          }}
                        >
                          &nbsp;· {due.label}
                        </span>
                      )}
                    </div>
                  </div>
                  <CaretRight size={14} color="var(--text-muted)" />
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Edit Drawer ── */}
      {showEdit && (
        <EditGroupDrawer
          group={group}
          onClose={() => setShowEdit(false)}
          onSave={(updates, newMemberIds) => {
            updateGroup(group.id, updates);
            updateGroupMembers(group.id, newMemberIds);
            setShowEdit(false);
          }}
        />
      )}
    </div>
  );
}

// ── Edit Drawer ───────────────────────────────────────────────────────────────

function EditGroupDrawer({
  group,
  onClose,
  onSave,
}: {
  group: import('@/lib/types').Group;
  onClose: () => void;
  onSave: (
    updates: Partial<
      Pick<import('@/lib/types').Group, 'name' | 'description' | 'leaderIds' | 'shepherdIds'>
    >,
    memberIds: string[]
  ) => void;
}) {
  const { data } = useApp();

  const [name, setName] = React.useState(group.name);
  const [description, setDesc] = React.useState(group.description ?? '');
  const [leaderIds, setLeaderIds] = React.useState<string[]>(group.leaderIds);
  const [shepherdIds, setShepherdIds] = React.useState<string[]>(group.shepherdIds);
  const [memberIds, setMemberIds] = React.useState<string[]>(group.memberIds);

  const [showLeaderPicker, setShowLeaderPicker] = React.useState(false);
  const [showShepherdPicker, setShowShepherdPicker] = React.useState(false);
  const [showMemberPicker, setShowMemberPicker] = React.useState(false);

  const nameRef = React.useRef<HTMLInputElement>(null);
  const descRef = React.useRef<HTMLTextAreaElement>(null);

  const selectedLeaders = data.people.filter((p) => leaderIds.includes(p.id));
  const selectedShepherds = data.people.filter((p) => shepherdIds.includes(p.id));

  const handleSave = () => {
    if (!name.trim()) return;
    onSave(
      { name: name.trim(), description: description.trim() || undefined, leaderIds, shepherdIds },
      memberIds
    );
  };

  return (
    <>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: BACKDROP_COLOR,
          zIndex: 'var(--z-modal)',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div
          className="animate-slide-up"
          style={{
            background: 'var(--surface)',
            borderRadius: SHEET_BORDER_RADIUS,
            width: '100%',
            maxWidth: SHEET_MAX_WIDTH,
            height: 'calc(100dvh - 48px)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Drag handle */}
          <div
            style={{
              width: 36,
              height: 4,
              background: 'var(--border)',
              borderRadius: 2,
              margin: '14px auto 0',
              flexShrink: 0,
            }}
          />

          {/* Fixed header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 20px 12px',
              flexShrink: 0,
              borderBottom: '1px solid var(--border-light)',
            }}
          >
            <button
              onClick={onClose}
              style={{
                fontSize: 14,
                color: 'var(--text-secondary)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
              Edit group
            </span>
            <button
              onClick={handleSave}
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: 'var(--sage)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Save
            </button>
          </div>

          {/* Scrollable body */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '20px 20px 48px',
              background: 'var(--bg)',
            }}
          >
            {/* ── DETAILS ── */}
            <DrawerSection label="Details">
              <div
                className="field-row-hover"
                style={textRowStyle}
                onClick={() => nameRef.current?.focus()}
              >
                <span style={asteriskStyle}>*</span>
                <TextT size={16} color="var(--text-muted)" />
                <span style={labelStyle}>Name</span>
                <input
                  ref={nameRef}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Group name"
                  style={inputStyle}
                />
              </div>
              <div
                className="field-row-hover"
                style={{ ...textRowStyle, alignItems: 'flex-start' }}
                onClick={() => descRef.current?.focus()}
              >
                <span style={spacerStyle} />
                <span style={{ paddingTop: 2 }}>
                  <AlignLeft size={16} color="var(--text-muted)" />
                </span>
                <span style={{ ...labelStyle, paddingTop: 2 }}>About</span>
                <textarea
                  ref={descRef}
                  value={description}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="Description…"
                  rows={3}
                  style={{ ...inputStyle, resize: 'none', lineHeight: 1.5 }}
                />
              </div>
            </DrawerSection>

            {/* ── LEADERS ── */}
            <DrawerSection label="Leaders">
              <button
                className="field-row-hover"
                onClick={() => setShowLeaderPicker(true)}
                style={pickerRowStyle}
              >
                <span style={spacerStyle} />
                <Crown size={16} color="var(--blue)" />
                <span style={labelStyle}>Leaders</span>
                <span
                  style={{
                    flex: 1,
                    fontSize: 14,
                    color: selectedLeaders.length ? 'var(--text-primary)' : 'var(--text-muted)',
                    textAlign: 'left',
                  }}
                >
                  {selectedLeaders.length === 0
                    ? 'None'
                    : selectedLeaders.map((p) => p.englishName.split(' ')[0]).join(', ')}
                </span>
                <CaretRight size={14} color="var(--text-muted)" />
              </button>
            </DrawerSection>

            {/* ── SHEPHERDS ── */}
            <DrawerSection label="Shepherds">
              <button
                className="field-row-hover"
                onClick={() => setShowShepherdPicker(true)}
                style={pickerRowStyle}
              >
                <span style={spacerStyle} />
                <HandHeart size={16} color="var(--sage)" />
                <span style={labelStyle}>Shepherds</span>
                <span
                  style={{
                    flex: 1,
                    fontSize: 14,
                    color: selectedShepherds.length ? 'var(--text-primary)' : 'var(--text-muted)',
                    textAlign: 'left',
                  }}
                >
                  {selectedShepherds.length === 0
                    ? 'None'
                    : selectedShepherds.map((p) => p.englishName.split(' ')[0]).join(', ')}
                </span>
                <CaretRight size={14} color="var(--text-muted)" />
              </button>
            </DrawerSection>

            {/* ── MEMBERS ── */}
            <DrawerSection label="Members">
              <button
                className="field-row-hover"
                onClick={() => setShowMemberPicker(true)}
                style={pickerRowStyle}
              >
                <span style={spacerStyle} />
                <UserList size={16} color="var(--text-muted)" />
                <span style={labelStyle}>Members</span>
                <span
                  style={{ flex: 1, fontSize: 14, color: 'var(--text-primary)', textAlign: 'left' }}
                >
                  {memberIds.length} {memberIds.length === 1 ? 'person' : 'people'}
                </span>
                <CaretRight size={14} color="var(--text-muted)" />
              </button>
            </DrawerSection>
          </div>
        </div>
      </div>

      {/* Leader picker sheet */}
      {showLeaderPicker && (
        <PeoplePickerSheet
          title="Leaders"
          people={data.people}
          selected={leaderIds}
          onToggle={(pid) =>
            setLeaderIds((prev) =>
              prev.includes(pid) ? prev.filter((x) => x !== pid) : [...prev, pid]
            )
          }
          onDone={() => setShowLeaderPicker(false)}
        />
      )}

      {/* Shepherd picker sheet */}
      {showShepherdPicker && (
        <PeoplePickerSheet
          title="Shepherds"
          people={data.people}
          selected={shepherdIds}
          onToggle={(pid) =>
            setShepherdIds((prev) =>
              prev.includes(pid) ? prev.filter((x) => x !== pid) : [...prev, pid]
            )
          }
          onDone={() => setShowShepherdPicker(false)}
        />
      )}

      {/* Member picker sheet */}
      {showMemberPicker && (
        <PeoplePickerSheet
          people={data.people}
          selected={memberIds}
          onToggle={(pid) =>
            setMemberIds((prev) =>
              prev.includes(pid) ? prev.filter((x) => x !== pid) : [...prev, pid]
            )
          }
          onDone={() => setShowMemberPicker(false)}
        />
      )}
    </>
  );
}

// ── Picker sheets ─────────────────────────────────────────────────────────────

function PeoplePickerSheet({
  title,
  people,
  selected,
  onToggle,
  onDone,
}: {
  title?: string;
  people: import('@/lib/types').Person[];
  selected: string[];
  onToggle: (id: string) => void;
  onDone: () => void;
}) {
  const [search, setSearch] = React.useState('');
  const filtered = people.filter(
    (p) =>
      search === '' ||
      p.englishName.toLowerCase().includes(search.toLowerCase()) ||
      (p.chineseName ?? '').includes(search)
  );

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: Z_SHEET,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <div
        className="animate-slide-in-right"
        style={{
          background: 'var(--surface)',
          borderRadius: SHEET_BORDER_RADIUS,
          width: '100%',
          maxWidth: SHEET_MAX_WIDTH,
          height: 'calc(100dvh - 48px)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header with back button */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '14px 20px 12px',
            flexShrink: 0,
            borderBottom: '1px solid var(--border-light)',
          }}
        >
          <button
            onClick={onDone}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 14,
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
              flex: 1,
              textAlign: 'center',
              fontSize: 15,
              fontWeight: 600,
              color: 'var(--text-primary)',
            }}
          >
            {title ?? 'Members'}
            {selected.length > 0 && (
              <span
                style={{ fontSize: 13, fontWeight: 400, color: 'var(--text-muted)', marginLeft: 6 }}
              >
                · {selected.length}
              </span>
            )}
          </span>
          {/* Spacer to visually center the title */}
          <span style={{ width: 52, flexShrink: 0 }} />
        </div>

        {/* Search */}
        <div
          style={{
            padding: '10px 16px',
            borderBottom: '1px solid var(--border-light)',
            flexShrink: 0,
          }}
        >
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search…"
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: 'var(--radius-xs)',
              border: '1px solid var(--border)',
              fontSize: 14,
              background: 'var(--bg)',
              color: 'var(--text-primary)',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* People list */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filtered.map((p) => {
            const isSel = selected.includes(p.id);
            const initials = p.englishName
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2);
            return (
              <button
                key={p.id}
                onClick={() => onToggle(p.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 20px',
                  background: isSel ? 'var(--sage-light)' : 'none',
                  border: 'none',
                  borderBottom: '1px solid var(--border-light)',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: isSel ? 'var(--sage)' : 'var(--sage-light)',
                    color: isSel ? 'var(--on-sage)' : 'var(--sage)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {initials}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: isSel ? 600 : 400,
                      color: isSel ? 'var(--sage)' : 'var(--text-primary)',
                    }}
                  >
                    {p.englishName}
                  </span>
                  {p.chineseName && (
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 6 }}>
                      {p.chineseName}
                    </span>
                  )}
                </div>
                {isSel && <Check size={16} color="var(--sage)" weight="bold" />}
              </button>
            );
          })}
        </div>

        {/* Done button */}
        <div style={{ padding: '16px 20px', flexShrink: 0 }}>
          <button
            onClick={onDone}
            style={{
              width: '100%',
              height: 44,
              borderRadius: 'var(--radius-md)',
              background: 'var(--sage)',
              color: 'var(--on-sage)',
              fontSize: 15,
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Shared drawer styles ──────────────────────────────────────────────────────

const textRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  paddingTop: 12,
  paddingBottom: 12,
  borderBottom: '1px solid var(--border-light)',
  cursor: 'text',
};

const pickerRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  paddingTop: 12,
  paddingBottom: 12,
  border: 'none',
  borderBottom: '1px solid var(--border-light)',
  background: 'none',
  cursor: 'pointer',
  textAlign: 'left' as const,
  width: '100%',
};

const asteriskStyle: React.CSSProperties = {
  width: 10,
  fontSize: 14,
  color: 'var(--red)',
  flexShrink: 0,
  lineHeight: 1,
};
const spacerStyle: React.CSSProperties = { width: 10, flexShrink: 0 };
const labelStyle: React.CSSProperties = {
  fontSize: 12,
  color: 'var(--text-muted)',
  width: 60,
  flexShrink: 0,
};
const inputStyle: React.CSSProperties = {
  flex: 1,
  background: 'none',
  border: 'none',
  outline: 'none',
  fontSize: 14,
  color: 'var(--text-primary)',
};

function DrawerSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <p
        style={{
          fontSize: 10,
          fontWeight: 600,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          marginBottom: 4,
        }}
      >
        {label}
      </p>
      <div
        className="no-last-border"
        style={{
          background: 'var(--surface)',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--border-light)',
          overflow: 'hidden',
          padding: '0 16px',
        }}
      >
        {children}
      </div>
    </div>
  );
}

