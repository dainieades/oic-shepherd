'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { CaretLeft, Plus, Trash, EnvelopeSimple } from '@phosphor-icons/react';
import { useApp } from '@/lib/context';
import { createClient } from '@/utils/supabase/client';
import { BACKDROP_COLOR, Z_NESTED } from '@/lib/constants';
import { EmptyState } from '@/components/EmptyState';
import InviteSheet from '@/components/InviteSheet';
import { Button } from '@/components/Button';
import { deleteApprovedEmail } from './actions';

type ApprovedEmail = { email: string; label: string | null; created_at: string };

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
  const { currentPersona } = useApp();
  const router = useRouter();

  const [emails, setEmails] = React.useState<ApprovedEmail[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showInvite, setShowInvite] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState<string | null>(null);
  const [deleteError, setDeleteError] = React.useState('');
  const [deleting, setDeleting] = React.useState(false);
  const [titleVisible, setTitleVisible] = React.useState(true);
  const titleRef = React.useRef<HTMLHeadingElement>(null);

  React.useEffect(() => {
    const el = titleRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setTitleVisible(entry.isIntersecting),
      { threshold: 0 }
    );
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

  async function handleDelete(email: string) {
    setDeleting(true);
    const { error: err } = await deleteApprovedEmail(email);
    setDeleting(false);
    if (err) {
      setDeleteError(err);
      return;
    }
    setConfirmDelete(null);
    setDeleteError('');
    await load();
  }

  return (
    <div style={{ paddingBottom: 48 }}>
      {/* Nav bar */}
      <div style={navBarStyle}>
        <button onClick={() => router.push('/settings')} style={backBtnStyle}>
          <CaretLeft size={16} weight="bold" />
          Settings
        </button>
        <span style={{ ...navTitleStyle, opacity: titleVisible ? 0 : 1, transition: 'opacity 0.15s' }}>Access Management</span>
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
          {emails.map((e) => (
            <div
              key={e.email}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '0.75rem 1rem',
                borderBottom: '1px solid var(--border-light)',
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
              <button
                onClick={() => setConfirmDelete(e.email)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 4,
                  flexShrink: 0,
                }}
              >
                <Trash size={16} color="var(--red)" />
              </button>
            </div>
          ))}
        </div>
      )}

      {showInvite && (
        <InviteSheet
          onClose={() => setShowInvite(false)}
          onSuccess={() => load()}
        />
      )}

      {/* Delete confirm modal */}
      {confirmDelete && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: Z_NESTED,
            background: BACKDROP_COLOR,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 2rem',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) { setConfirmDelete(null); setDeleteError(''); }
          }}
        >
          <div
            style={{
              background: 'var(--surface)',
              borderRadius: 16,
              width: '100%',
              maxWidth: 320,
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '1.5rem 1.25rem 1rem', textAlign: 'center' }}>
              <p
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  margin: '0 0 0.375rem',
                }}
              >
                Remove access?
              </p>
              <p
                style={{
                  fontSize: 14,
                  color: 'var(--text-muted)',
                  margin: 0,
                  wordBreak: 'break-all',
                }}
              >
                {confirmDelete}
              </p>
            </div>
            {deleteError && (
              <div
                style={{
                  padding: '0.5rem 1.25rem',
                  fontSize: 13,
                  color: 'var(--red)',
                  textAlign: 'center',
                  borderTop: '1px solid var(--border-light)',
                }}
              >
                {deleteError}
              </div>
            )}
            <div style={{ borderTop: '1px solid var(--border-light)', display: 'flex' }}>
              <button
                onClick={() => { setConfirmDelete(null); setDeleteError(''); }}
                style={{
                  flex: 1,
                  height: 50,
                  background: 'none',
                  border: 'none',
                  borderRight: '1px solid var(--border-light)',
                  fontSize: 15,
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                disabled={deleting}
                style={{
                  flex: 1,
                  height: 50,
                  background: 'none',
                  border: 'none',
                  fontSize: 15,
                  color: 'var(--red)',
                  cursor: deleting ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                  opacity: deleting ? 0.5 : 1,
                }}
              >
                {deleting ? 'Removing…' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
