'use client';

import React from 'react';
import Link from 'next/link';
import { useApp } from '@/lib/context';
import { Crown, Plus } from '@phosphor-icons/react';
import { BACKDROP_COLOR, SHEET_MAX_WIDTH, SHEET_BORDER_RADIUS } from '@/lib/constants';
import { Button } from '@/components/Button';
import PageContainer from '@/components/PageContainer';
import GroupSidePreview from '@/components/GroupSidePreview';

export default function GroupsPage() {
  const { data, currentPersona, addGroup } = useApp();
  const [scrolled, setScrolled] = React.useState(false);
  const [showAdd, setShowAdd] = React.useState(false);
  const [newName, setNewName] = React.useState('');
  const [newDesc, setNewDesc] = React.useState('');
  const [previewId, setPreviewId] = React.useState<string | null>(null);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  React.useEffect(() => {
    if (showAdd) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showAdd]);

  const handleAdd = () => {
    if (!newName.trim()) return;
    addGroup(newName.trim(), newDesc.trim() || undefined);
    setNewName('');
    setNewDesc('');
    setShowAdd(false);
  };

  const myPersonId = currentPersona.personId;

  const sortedGroups = [...data.groups].sort((a, b) => {
    const aMe = myPersonId && a.leaderIds.includes(myPersonId) ? 0 : 1;
    const bMe = myPersonId && b.leaderIds.includes(myPersonId) ? 0 : 1;
    return aMe - bMe;
  });

  return (
    <PageContainer>
    <div className="pb-8">
      {/* Sticky collapsing header */}
      <div
        className="-mx-4 px-4 lg:mx-0 lg:px-0 sticky top-0 bg-bg z-sticky"
        style={{
          borderBottom: scrolled ? '1px solid var(--border-light)' : 'none',
        }}
      >
        {scrolled ? (
          <div className="h-11 flex items-center justify-between">
            <span className="text-17 font-semibold text-text-primary tracking-tight-1">
              Fellowship Groups
            </span>
            <button
              onClick={() => setShowAdd(true)}
              className="h-8 px-3.5 rounded-xs bg-sage text-on-sage border-none cursor-pointer text-13 font-semibold flex items-center gap-1"
            >
              <Plus size={14} weight="bold" />
              Add
            </button>
          </div>
        ) : (
          <div className="pt-5 pb-3.5 flex items-center justify-between">
            <h1 className="text-32 font-extrabold text-text-primary tracking-tight-3 leading-none">
              Fellowship Groups
            </h1>
            <button
              onClick={() => setShowAdd(true)}
              className="h-9 px-4 rounded-xs bg-sage text-on-sage border-none cursor-pointer text-14 font-semibold flex items-center gap-1"
            >
              <Plus size={15} weight="bold" />
              Add
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 pt-2">
        {sortedGroups.map((group) => {
          const members = data.people.filter((p) => group.memberIds.includes(p.id));
          const leaders = data.people.filter((p) => group.leaderIds.includes(p.id));

          const iAmLeader = myPersonId ? group.leaderIds.includes(myPersonId) : false;
          const iAmInvolved = iAmLeader;

          return (
            <Link
              key={group.id}
              href={`/groups/${group.id}`}
              className="no-underline"
              onClick={(e) => {
                if (
                  typeof window !== 'undefined' &&
                  window.matchMedia('(min-width: 64rem)').matches &&
                  !e.metaKey &&
                  !e.ctrlKey &&
                  !e.shiftKey &&
                  e.button === 0
                ) {
                  e.preventDefault();
                  setPreviewId(group.id);
                }
              }}
            >
              <div
                className="row-card-hover bg-surface rounded"
                style={{
                  border: iAmInvolved
                    ? '0.09375rem solid var(--sage-mid)'
                    : '0.0625rem solid var(--border-light)',
                  padding: '0.875rem 1rem',
                  outline:
                    previewId === group.id ? '0.125rem solid var(--sage)' : undefined,
                  outlineOffset: previewId === group.id ? '-0.125rem' : undefined,
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-15 font-semibold text-text-primary">
                      {group.name}
                    </h3>
                  </div>
                  {iAmInvolved && (
                    <span className="text-11 text-sage font-medium">
                      You&apos;re a leader
                    </span>
                  )}
                </div>

                {/* Chips row */}
                <div
                  className="flex gap-1.5"
                  style={{ marginBottom: group.description ? 8 : 10 }}
                >
                  <span className="text-11 font-medium py-0.5 px-2 rounded-pill bg-sage-light text-sage">
                    {members.length} {members.length === 1 ? 'member' : 'members'}
                  </span>
                  <span className="text-11 font-medium py-0.5 px-2 rounded-pill bg-blue-light text-blue inline-flex items-center gap-1">
                    <Crown size={11} />
                    {leaders.length} {leaders.length === 1 ? 'leader' : 'leaders'}
                  </span>
                </div>

                {group.description && (
                  <p
                    className="text-12 text-text-secondary leading-normal mb-2.5 overflow-hidden"
                    style={{
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
          className="fixed inset-0 flex items-center justify-center px-4 z-modal"
          style={{
            background: 'rgba(0,0,0,0.4)',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAdd(false);
          }}
        >
          <div
            className="bg-surface rounded-lg w-full shadow-[var(--shadow-elevated)]"
            style={{ padding: '1.25rem 1.25rem 1.5rem', maxWidth: 480 }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-17 font-bold text-text-primary">
                New Fellowship Group
              </h2>
              <button
                onClick={() => setShowAdd(false)}
                className="bg-transparent border-none text-22 text-text-muted cursor-pointer leading-none"
              >
                ×
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <label className="text-12 font-semibold text-text-muted uppercase tracking-wide-5 block mb-1.5">
                  Name *
                </label>
                <input
                  autoFocus
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Group name"
                  className="w-full rounded-sm border border-border text-15 bg-bg text-text-primary outline-none box-border"
                  style={{ padding: '0.625rem 0.75rem' }}
                  onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                />
              </div>
              <div>
                <label className="text-12 font-semibold text-text-muted uppercase tracking-wide-5 block mb-1.5">
                  Description
                </label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Optional description…"
                  rows={3}
                  className="w-full rounded-sm border border-border text-14 bg-bg text-text-primary outline-none resize-none box-border"
                  style={{ padding: '0.625rem 0.75rem' }}
                />
              </div>
            </div>

            <Button
              onClick={handleAdd}
              disabled={!newName.trim()}
              style={{ marginTop: 20, width: '100%' }}
            >
              Create Group
            </Button>
          </div>
        </div>
      )}
    </div>
    {previewId && (
      <GroupSidePreview groupId={previewId} onClose={() => setPreviewId(null)} />
    )}
    </PageContainer>
  );
}
