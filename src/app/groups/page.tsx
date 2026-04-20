'use client';

import React from 'react';
import Link from 'next/link';
import { useApp } from '@/lib/context';
import { Crown, HandHeart, Plus } from '@phosphor-icons/react';
import { BACKDROP_COLOR, SHEET_MAX_WIDTH, SHEET_BORDER_RADIUS } from '@/lib/constants';

export default function GroupsPage() {
  const { data, currentPersona, addGroup } = useApp();
  const [scrolled, setScrolled] = React.useState(false);
  const [showAdd, setShowAdd] = React.useState(false);
  const [newName, setNewName] = React.useState('');
  const [newDesc, setNewDesc] = React.useState('');

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleAdd = () => {
    if (!newName.trim()) return;
    addGroup(newName.trim(), newDesc.trim() || undefined);
    setNewName('');
    setNewDesc('');
    setShowAdd(false);
  };

  const myPersonId = currentPersona.personId;

  // Sort: groups where I'm a shepherd or leader come first
  const sortedGroups = [...data.groups].sort((a, b) => {
    const aMe =
      myPersonId && (a.leaderIds.includes(myPersonId) || a.shepherdIds.includes(myPersonId))
        ? 0
        : 1;
    const bMe =
      myPersonId && (b.leaderIds.includes(myPersonId) || b.shepherdIds.includes(myPersonId))
        ? 0
        : 1;
    return aMe - bMe;
  });

  return (
    <div style={{ paddingBottom: 32 }}>
      {/* Sticky collapsing header */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 20,
          background: 'var(--bg)',
          marginLeft: -16,
          marginRight: -16,
          paddingLeft: 16,
          paddingRight: 16,
          borderBottom: scrolled ? '1px solid var(--border-light)' : 'none',
        }}
      >
        {scrolled ? (
          <div
            style={{
              height: 44,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span
              style={{
                fontSize: 17,
                fontWeight: 600,
                color: 'var(--text-primary)',
                letterSpacing: '-0.01em',
              }}
            >
              Fellowship Groups
            </span>
            <button
              onClick={() => setShowAdd(true)}
              style={{
                height: 32,
                padding: '0 14px',
                borderRadius: 8,
                background: 'var(--sage)',
                color: 'var(--on-sage)',
                border: 'none',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Plus size={14} weight="bold" />
              Add
            </button>
          </div>
        ) : (
          <div
            style={{
              paddingTop: 20,
              paddingBottom: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <h1
              style={{
                fontSize: 32,
                fontWeight: 800,
                color: 'var(--text-primary)',
                letterSpacing: '-0.03em',
                lineHeight: 1,
              }}
            >
              Fellowship Groups
            </h1>
            <button
              onClick={() => setShowAdd(true)}
              style={{
                height: 36,
                padding: '0 16px',
                borderRadius: 8,
                background: 'var(--sage)',
                color: 'var(--on-sage)',
                border: 'none',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Plus size={15} weight="bold" />
              Add
            </button>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 8 }}>
        {sortedGroups.map((group) => {
          const members = data.people.filter((p) => group.memberIds.includes(p.id));
          const leaders = data.people.filter((p) => group.leaderIds.includes(p.id));
          const shepherds = data.people.filter((p) => group.shepherdIds.includes(p.id));

          const iAmLeader = myPersonId ? group.leaderIds.includes(myPersonId) : false;
          const iAmShepherd = myPersonId ? group.shepherdIds.includes(myPersonId) : false;
          const iAmInvolved = iAmLeader || iAmShepherd;

          return (
            <Link key={group.id} href={`/groups/${group.id}`} style={{ textDecoration: 'none' }}>
              <div
                className="row-card-hover"
                style={{
                  background: 'var(--surface)',
                  borderRadius: 'var(--radius)',
                  border: iAmInvolved
                    ? '1.5px solid var(--sage-mid)'
                    : '1px solid var(--border-light)',
                  padding: '14px 16px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 8,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
                      {group.name}
                    </h3>
                  </div>
                  {iAmInvolved && (
                    <span style={{ fontSize: 11, color: 'var(--sage)', fontWeight: 500 }}>
                      {iAmLeader && iAmShepherd
                        ? "You're a leader & shepherd"
                        : iAmLeader
                          ? "You're a leader"
                          : "You're a shepherd"}
                    </span>
                  )}
                </div>

                {/* Chips row */}
                <div style={{ display: 'flex', gap: 6, marginBottom: group.description ? 8 : 10 }}>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 500,
                      padding: '2px 8px',
                      borderRadius: '999px',
                      background: 'var(--sage-light)',
                      color: 'var(--sage)',
                    }}
                  >
                    {members.length} {members.length === 1 ? 'member' : 'members'}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 500,
                      padding: '2px 8px',
                      borderRadius: '999px',
                      background: '#EBF1F7',
                      color: '#6B8EAE',
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
                      padding: '2px 8px',
                      borderRadius: '999px',
                      background: 'var(--avatar-s1-bg)',
                      color: 'var(--avatar-s1-text)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <HandHeart size={11} />
                    {shepherds.length} {shepherds.length === 1 ? 'shepherd' : 'shepherds'}
                  </span>
                </div>

                {group.description && (
                  <p
                    style={{
                      fontSize: 12,
                      color: 'var(--text-secondary)',
                      lineHeight: 1.5,
                      marginBottom: 10,
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {group.description}
                  </p>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {/* Add Group Modal */}
      {showAdd && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
          }}
        >
          <div
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }}
            onClick={() => setShowAdd(false)}
          />
          <div
            className="animate-slide-up"
            style={{
              position: 'relative',
              background: 'var(--surface)',
              borderRadius: SHEET_BORDER_RADIUS,
              padding: '20px 20px 40px',
              zIndex: 1,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 20,
              }}
            >
              <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>
                New Fellowship Group
              </h2>
              <button
                onClick={() => setShowAdd(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 22,
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    display: 'block',
                    marginBottom: 6,
                  }}
                >
                  Name *
                </label>
                <input
                  autoFocus
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Group name"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: '1px solid var(--border)',
                    fontSize: 15,
                    background: 'var(--bg)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                />
              </div>
              <div>
                <label
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    display: 'block',
                    marginBottom: 6,
                  }}
                >
                  Description
                </label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Optional description…"
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: '1px solid var(--border)',
                    fontSize: 14,
                    background: 'var(--bg)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    resize: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <button
              onClick={handleAdd}
              disabled={!newName.trim()}
              style={{
                marginTop: 20,
                width: '100%',
                padding: '14px',
                borderRadius: 12,
                background: newName.trim() ? 'var(--sage)' : 'var(--border)',
                color: newName.trim() ? '#fff' : 'var(--text-muted)',
                border: 'none',
                fontSize: 15,
                fontWeight: 700,
                cursor: newName.trim() ? 'pointer' : 'default',
              }}
            >
              Create Group
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
