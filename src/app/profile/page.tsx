'use client';

import { useApp } from '@/lib/context';
import { CaretRight } from '@phosphor-icons/react';

const roleLabel: Record<string, string> = {
  admin: 'Admin · Pastor',
  shepherd: 'Shepherd',
  'welcome-team': 'Welcome Team',
};

const roleColor: Record<string, { bg: string; color: string }> = {
  admin: { bg: 'var(--amber-light)', color: 'var(--amber)' },
  shepherd: { bg: 'var(--sage-light)', color: 'var(--sage)' },
  'welcome-team': { bg: 'var(--blue-light)', color: 'var(--blue)' },
};

const settingRows = [
  { label: 'Default follow-up frequency', value: '14 days', active: true },
  { label: 'Language', value: 'English / 中文', active: true },
  { label: 'Notifications', value: 'Coming soon', active: false },
  { label: 'Privacy settings', value: 'Future', active: false },
  { label: 'Data import / export', value: 'Future', active: false },
];

const adminRows = [
  { label: 'Manage assignments', value: 'Assign shepherds to people' },
  { label: 'Archive management', value: 'View and restore archived records' },
  { label: 'Group management', value: 'Create and manage groups' },
];

export default function ProfilePage() {
  const { data, currentPersona } = useApp();
  const role = roleColor[currentPersona.role] ?? roleColor.shepherd;

  const initials = currentPersona.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const assignedCount =
    currentPersona.role === 'admin' ? data.people.length : currentPersona.assignedPeopleIds.length;

  return (
    <div style={{ paddingTop: 24, paddingBottom: 40 }}>
      <h1
        style={{
          fontSize: 22,
          fontWeight: 700,
          color: 'var(--text-primary)',
          marginBottom: 20,
          letterSpacing: '-0.02em',
        }}
      >
        Profile
      </h1>

      {/* ── My Profile ───────────────────────────── */}
      <div
        style={{
          background: 'var(--surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-light)',
          boxShadow: 'var(--shadow-card)',
          padding: '1.25rem',
          marginBottom: 14,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: role.bg,
              color: role.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {initials}
          </div>
          <div>
            <p
              style={{
                fontSize: 17,
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: 4,
              }}
            >
              {currentPersona.name}
            </p>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                padding: '0.1875rem 0.625rem',
                borderRadius: 'var(--radius-pill)',
                background: role.bg,
                color: role.color,
              }}
            >
              {roleLabel[currentPersona.role] ?? currentPersona.role}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 1,
            background: 'var(--border-light)',
            borderRadius: 'var(--radius)',
            overflow: 'hidden',
            border: '1px solid var(--border-light)',
          }}
        >
          <StatCell label="Assigned" value={String(assignedCount)} />
          <StatCell
            label="Role"
            value={
              currentPersona.role === 'welcome-team'
                ? 'Welcome'
                : currentPersona.role.charAt(0).toUpperCase() + currentPersona.role.slice(1)
            }
          />
        </div>
      </div>

      {/* ── Settings ─────────────────────────────── */}
      <Card label="Settings" style={{ marginBottom: 14 }}>
        {settingRows.map((row, i) => (
          <SettingsRow
            key={row.label}
            label={row.label}
            value={row.value}
            active={row.active}
            showDivider={i > 0}
          />
        ))}
      </Card>

      {/* ── Admin section ────────────────────────── */}
      {currentPersona.role === 'admin' && (
        <div
          style={{
            background: 'var(--amber-light)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--amber-border)',
            boxShadow: 'var(--shadow-card)',
            padding: '0.875rem 1rem',
            marginBottom: 14,
          }}
        >
          <p
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: 'var(--amber)',
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
              marginBottom: 12,
            }}
          >
            Admin
          </p>
          {adminRows.map((row, i) => (
            <div key={row.label}>
              {i > 0 && (
                <div style={{ height: 1, background: 'rgba(200,170,100,0.2)', margin: '0.125rem 0' }} />
              )}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.5625rem 0',
                }}
              >
                <div>
                  <p style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 500 }}>
                    {row.label}
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{row.value}</p>
                </div>
                <CaretRight size={16} color="var(--amber)" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reset */}
      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <button
          onClick={() => {
            localStorage.clear();
            window.location.reload();
          }}
          style={{
            fontSize: 12,
            color: 'var(--text-muted)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            textDecoration: 'underline',
          }}
        >
          Reset all data to defaults
        </button>
      </div>
    </div>
  );
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: 'var(--bg)', padding: '0.75rem 1rem' }}>
      <p
        style={{
          fontSize: 10,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: 2,
        }}
      >
        {label}
      </p>
      <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{value}</p>
    </div>
  );
}

function Card({
  label,
  children,
  style,
}: {
  label: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        background: 'var(--surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-light)',
        boxShadow: 'var(--shadow-card)',
        padding: '0.875rem 1rem',
        ...style,
      }}
    >
      <p
        style={{
          fontSize: 10,
          fontWeight: 600,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.07em',
          marginBottom: 12,
        }}
      >
        {label}
      </p>
      {children}
    </div>
  );
}

function SettingsRow({
  label,
  value,
  active,
  showDivider,
}: {
  label: string;
  value: string;
  active: boolean;
  showDivider: boolean;
}) {
  return (
    <>
      {showDivider && (
        <div style={{ height: 1, background: 'var(--border-light)', margin: '0.125rem 0' }} />
      )}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.5625rem 0',
          opacity: active ? 1 : 0.45,
        }}
      >
        <div>
          <p style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 500 }}>{label}</p>
          <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{value}</p>
        </div>
        <CaretRight size={16} color="var(--text-muted)" />
      </div>
    </>
  );
}
