'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { CaretLeft, Plus, EnvelopeSimple, CaretRight } from '@phosphor-icons/react';
import { useApp } from '@/lib/context';
import { createClient } from '@/utils/supabase/client';
import { EmptyState } from '@/components/EmptyState';
import InviteSheet from '@/components/InviteSheet';
import { Button } from '@/components/Button';
import AppRolePickerSheet from '@/components/AppRolePickerSheet';
import { type AppRole } from '@/lib/types';
import { deleteApprovedEmail, updateApprovedEmail } from './actions';

type ApprovedEmail = { email: string; label: string | null; created_at: string };

const ROLE_LABEL: Record<AppRole, string> = {
  admin: 'Admin',
  shepherd: 'User',
  'no-access': 'No Access',
};


export default function AccessManagementPage() {
  const { data, currentPersona, updatePerson } = useApp();
  const router = useRouter();

  const [emails, setEmails] = React.useState<ApprovedEmail[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showInvite, setShowInvite] = React.useState(false);
  const [roleEditEmail, setRoleEditEmail] = React.useState<string | null>(null);
  const [titleVisible, setTitleVisible] = React.useState(true);
  const titleRef = React.useRef<HTMLHeadingElement>(null);

  const personByEmail = React.useMemo(() => {
    const map = new Map<string, (typeof data.people)[number]>();
    for (const p of data.people) {
      if (p.email) map.set(p.email.toLowerCase(), p);
    }
    return map;
  }, [data.people]);

  const roleByPersonId = React.useMemo(() => {
    const map = new Map<string, AppRole>();
    for (const p of data.personas) {
      if (p.personId) map.set(p.personId, p.role);
    }
    return map;
  }, [data.personas]);

  React.useEffect(() => {
    const el = titleRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setTitleVisible(entry.isIntersecting), {
      threshold: 0,
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const isAdmin = currentPersona.role === 'admin';

  const load = React.useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('approved_emails')
      .select('*')
      .order('created_at', { ascending: true });
    setEmails((data as ApprovedEmail[]) ?? []);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    if (!isAdmin) return;
    load();
  }, [isAdmin, load]);

  if (!isAdmin) {
    return (
      <div className="py-10 text-center">
        <p className="text-text-muted text-15">Admin access required.</p>
      </div>
    );
  }

  return (
    <div className="pb-12">
      {/* Nav bar */}
      <div className="settings-subpage-navbar sticky top-0 bg-bg -mx-4 px-4 border-b border-border-light flex items-center justify-between h-[3.375rem] z-page">
        <button onClick={() => router.push('/settings')} className="inline-flex items-center gap-1 text-13 text-sage bg-transparent border-0 cursor-pointer p-0">
          <CaretLeft size={16} weight="bold" />
          Settings
        </button>
        <span
          className="text-15 font-semibold text-text-primary"
          style={{ opacity: titleVisible ? 0 : 1, transition: 'opacity 0.15s' }}
        >
          Access Management
        </span>
        <Button variant="primary" size="sm" onClick={() => setShowInvite(true)}>
          <Plus size={16} weight="bold" />
          Invite
        </Button>
      </div>

      <h1
        ref={titleRef}
        className="text-28 font-bold text-text-primary tracking-tight-2 mt-6 mb-2"
      >
        Access Management
      </h1>

      <p className="text-13 text-text-muted mt-0 mb-5 leading-normal">
        Only people on this list can sign in. Add someone&apos;s email before they try to log in.
      </p>

      {/* Email list */}
      <p className="text-12 font-semibold text-text-muted uppercase tracking-wide-6 mb-2">
        Approved ({emails.length})
      </p>

      {loading ? (
        <p className="text-14 text-text-muted text-center py-6">
          Loading…
        </p>
      ) : emails.length === 0 ? (
        <div className="bg-surface rounded border border-border-light">
          <EmptyState
            title="No approved emails yet."
            icon={<EnvelopeSimple size={28} color="var(--text-muted)" />}
          />
        </div>
      ) : (
        <div className="no-last-border bg-surface rounded border border-border-light overflow-hidden">
          {emails.map((e) => {
            const linkedPerson = personByEmail.get(e.email.toLowerCase());
            const role: AppRole =
              linkedPerson?.appRole && linkedPerson.appRole !== 'no-access'
                ? linkedPerson.appRole
                : ((linkedPerson ? roleByPersonId.get(linkedPerson.id) : undefined) ?? 'no-access');
            return (
              <button
                key={e.email}
                onClick={() => setRoleEditEmail(e.email)}
                className="w-full flex items-center gap-3 py-3.5 px-4 bg-transparent border-0 border-b border-border-light cursor-pointer text-left"
              >
                <EnvelopeSimple size={16} color="var(--text-muted)" className="shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-14 font-medium text-text-primary m-0 overflow-hidden text-ellipsis whitespace-nowrap">
                    {e.label ?? e.email}
                  </p>
                  {e.label && (
                    <p className="text-12 text-text-muted m-0 overflow-hidden text-ellipsis whitespace-nowrap">
                      {e.email}
                    </p>
                  )}
                </div>
                <span
                  className="text-13 shrink-0"
                  style={{ color: linkedPerson ? 'var(--text-secondary)' : 'var(--text-muted)' }}
                >
                  {linkedPerson ? ROLE_LABEL[role] : 'Not linked'}
                </span>
                <CaretRight size={14} color="var(--text-muted)" className="shrink-0" />
              </button>
            );
          })}
        </div>
      )}

      {showInvite && <InviteSheet onClose={() => setShowInvite(false)} onSuccess={() => load()} />}

      {roleEditEmail &&
        (() => {
          const linkedPerson = personByEmail.get(roleEditEmail.toLowerCase());
          const role: AppRole =
            linkedPerson?.appRole && linkedPerson.appRole !== 'no-access'
              ? linkedPerson.appRole
              : ((linkedPerson ? roleByPersonId.get(linkedPerson.id) : undefined) ?? 'no-access');
          const emailEntry = emails.find((e) => e.email === roleEditEmail);
          return (
            <AppRolePickerSheet
              currentRole={linkedPerson ? role : undefined}
              noPersonLinked={!linkedPerson}
              currentEmail={roleEditEmail}
              onSelect={async (newRole) => {
                if (!linkedPerson) return;
                await updatePerson(linkedPerson.id, { appRole: newRole });
                if (newRole !== 'shepherd') setRoleEditEmail(null);
              }}
              onRemove={async () => {
                await deleteApprovedEmail(roleEditEmail);
                if (linkedPerson) {
                  await updatePerson(linkedPerson.id, { appRole: 'no-access' });
                }
                await load();
              }}
              onUpdateEmail={async (newEmail) => {
                const result = await updateApprovedEmail(roleEditEmail, newEmail);
                if (result.error) return result;
                if (linkedPerson) {
                  await updatePerson(linkedPerson.id, { email: newEmail });
                }
                await load();
                return {};
              }}
              onClose={() => setRoleEditEmail(null)}
              isAdmin
              personName={linkedPerson?.preferredName ?? emailEntry?.label ?? roleEditEmail}
            />
          );
        })()}
    </div>
  );
}
