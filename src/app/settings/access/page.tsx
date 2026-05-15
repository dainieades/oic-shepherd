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
  shepherd: 'Shepherd',
  'no-access': 'No Access',
};

const navBarStyle: React.CSSProperties = {
  position: 'sticky',
  top: 0,
  zIndex: 'var(--z-page)',
  background: 'var(--bg)',
  marginLeft: -16,
  marginRight: -16,
  paddingLeft: 16,
  paddingRight: 16,
  borderBottom: '1px solid var(--border-light)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  height: 54,
};

const backBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  fontSize: 13,
  color: 'var(--sage)',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: 0,
};

const navTitleStyle: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 600,
  color: 'var(--text-primary)',
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
      <div style={{ padding: '2.5rem 0', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: 15 }}>Admin access required.</p>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: 48 }}>
      {/* Nav bar */}
      <div className="settings-subpage-navbar" style={navBarStyle}>
        <button onClick={() => router.push('/settings')} style={backBtnStyle}>
          <CaretLeft size={16} weight="bold" />
          Settings
        </button>
        <span
          style={{ ...navTitleStyle, opacity: titleVisible ? 0 : 1, transition: 'opacity 0.15s' }}
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
        style={{
          fontSize: 28,
          fontWeight: 700,
          color: 'var(--text-primary)',
          letterSpacing: '-0.02em',
          margin: '1.5rem 0 0.5rem',
        }}
      >
        Access Management
      </h1>

      <p
        style={{
          fontSize: 13,
          color: 'var(--text-muted)',
          marginTop: 0,
          marginBottom: 20,
          lineHeight: 1.5,
        }}
      >
        Only people on this list can sign in. Add someone&apos;s email before they try to log in.
      </p>

      {/* Email list */}
      <p
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          marginBottom: 8,
        }}
      >
        Approved ({emails.length})
      </p>

      {loading ? (
        <p
          style={{
            fontSize: 14,
            color: 'var(--text-muted)',
            textAlign: 'center',
            padding: '1.5rem 0',
          }}
        >
          Loading…
        </p>
      ) : emails.length === 0 ? (
        <div
          style={{
            background: 'var(--surface)',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border-light)',
          }}
        >
          <EmptyState
            title="No approved emails yet."
            icon={<EnvelopeSimple size={28} color="var(--text-muted)" />}
          />
        </div>
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
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '0.875rem 1rem',
                  background: 'none',
                  border: 'none',
                  borderBottom: '1px solid var(--border-light)',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <EnvelopeSimple size={16} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontSize: 14,
                      fontWeight: 500,
                      color: 'var(--text-primary)',
                      margin: 0,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {e.label ?? e.email}
                  </p>
                  {e.label && (
                    <p
                      style={{
                        fontSize: 12,
                        color: 'var(--text-muted)',
                        margin: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {e.email}
                    </p>
                  )}
                </div>
                <span
                  style={{
                    fontSize: 13,
                    color: linkedPerson ? 'var(--text-secondary)' : 'var(--text-muted)',
                    flexShrink: 0,
                  }}
                >
                  {linkedPerson
                    ? role === 'shepherd' && linkedPerson.canTriageVisitors
                      ? 'Shepherd · Reviews newcomers'
                      : ROLE_LABEL[role]
                    : 'Not linked'}
                </span>
                <CaretRight size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />
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
              canTriageVisitors={linkedPerson?.canTriageVisitors ?? false}
              noPersonLinked={!linkedPerson}
              currentEmail={roleEditEmail}
              onSelect={async (newRole) => {
                if (!linkedPerson) return;
                const patch: { appRole: AppRole; canTriageVisitors?: boolean } = {
                  appRole: newRole,
                };
                if (newRole !== 'shepherd' && linkedPerson.canTriageVisitors) {
                  patch.canTriageVisitors = false;
                }
                await updatePerson(linkedPerson.id, patch);
                if (newRole !== 'shepherd') setRoleEditEmail(null);
              }}
              onToggleTriage={async (next) => {
                if (!linkedPerson) return;
                await updatePerson(linkedPerson.id, { canTriageVisitors: next });
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
