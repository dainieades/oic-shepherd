'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash, EnvelopeSimple } from '@phosphor-icons/react';
import { useApp } from '@/lib/context';
import { createClient } from '@/utils/supabase/client';
import { BACKDROP_COLOR, Z_NESTED } from '@/lib/constants';
import { EmptyState } from '@/components/EmptyState';

type ApprovedEmail = { email: string; label: string | null; created_at: string };

export default function AccessManagementPage() {
  const { currentPersona } = useApp();
  const router = useRouter();

  const [emails, setEmails] = React.useState<ApprovedEmail[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [newEmail, setNewEmail] = React.useState('');
  const [newLabel, setNewLabel] = React.useState('');
  const [adding, setAdding] = React.useState(false);
  const [error, setError] = React.useState('');
  const [confirmDelete, setConfirmDelete] = React.useState<string | null>(null);

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
      <div style={{ padding: '40px 0', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: 15 }}>Admin access required.</p>
      </div>
    );
  }

  async function handleAdd() {
    const email = newEmail.trim().toLowerCase();
    if (!email) {
      setError('Enter an email address.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Enter a valid email address.');
      return;
    }
    setAdding(true);
    setError('');
    const supabase = createClient();
    const { error: err } = await supabase
      .from('approved_emails')
      .insert({ email, label: newLabel.trim() || null });
    if (err) {
      setError(err.message.includes('duplicate') ? 'That email is already approved.' : err.message);
    } else {
      setNewEmail('');
      setNewLabel('');
      await load();
    }
    setAdding(false);
  }

  async function handleDelete(email: string) {
    const supabase = createClient();
    await supabase.from('approved_emails').delete().eq('email', email);
    setConfirmDelete(null);
    await load();
  }

  return (
    <div style={{ paddingBottom: 48 }}>
      {/* Header */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 'var(--z-sticky)',
          background: 'var(--bg)',
          marginLeft: -16,
          marginRight: -16,
          paddingLeft: 16,
          paddingRight: 16,
          borderBottom: '1px solid var(--border-light)',
          height: 44,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <button
          onClick={() => router.back()}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <ArrowLeft size={20} color="var(--text-primary)" />
        </button>
        <span
          style={{
            fontSize: 17,
            fontWeight: 600,
            color: 'var(--text-primary)',
            letterSpacing: '-0.01em',
          }}
        >
          Access Management
        </span>
      </div>

      <p
        style={{
          fontSize: 13,
          color: 'var(--text-muted)',
          marginTop: 20,
          marginBottom: 20,
          lineHeight: 1.5,
        }}
      >
        Only people on this list can sign in. Add someone&apos;s email before they try to log in.
      </p>

      {/* Add form */}
      <div
        style={{
          background: 'var(--surface)',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--border-light)',
          padding: 16,
          marginBottom: 24,
        }}
      >
        <p
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: 12,
          }}
        >
          Add access
        </p>

        {error && (
          <div
            style={{
              background: 'var(--red-light)',
              border: '1px solid var(--red-border)',
              borderRadius: 'var(--radius-xs)',
              padding: '8px 12px',
              marginBottom: 12,
              fontSize: 13,
              color: 'var(--red)',
            }}
          >
            {error}
          </div>
        )}

        <input
          type="email"
          placeholder="Email address"
          value={newEmail}
          onChange={(e) => {
            setNewEmail(e.target.value);
            setError('');
          }}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: 'var(--radius-sm)',
            border: '1.5px solid var(--border)',
            fontSize: 15,
            color: 'var(--text-primary)',
            background: 'var(--bg)',
            outline: 'none',
            marginBottom: 8,
            boxSizing: 'border-box',
          }}
        />
        <input
          type="text"
          placeholder="Name (optional)"
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: 'var(--radius-sm)',
            border: '1.5px solid var(--border)',
            fontSize: 15,
            color: 'var(--text-primary)',
            background: 'var(--bg)',
            outline: 'none',
            marginBottom: 12,
            boxSizing: 'border-box',
          }}
        />
        <button
          onClick={handleAdd}
          disabled={adding}
          style={{
            width: '100%',
            padding: '11px 16px',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            background: 'var(--sage)',
            color: 'var(--on-sage)',
            fontSize: 15,
            fontWeight: 600,
            cursor: adding ? 'not-allowed' : 'pointer',
            opacity: adding ? 0.6 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <Plus size={16} weight="bold" />
          {adding ? 'Adding…' : 'Add email'}
        </button>
      </div>

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
            padding: '24px 0',
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
                padding: '12px 16px',
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
            padding: '0 32px',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setConfirmDelete(null);
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
            <div style={{ padding: '24px 20px 16px', textAlign: 'center' }}>
              <p
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  margin: '0 0 6px',
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
            <div style={{ borderTop: '1px solid var(--border-light)', display: 'flex' }}>
              <button
                onClick={() => setConfirmDelete(null)}
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
                style={{
                  flex: 1,
                  height: 50,
                  background: 'none',
                  border: 'none',
                  fontSize: 15,
                  color: 'var(--red)',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
