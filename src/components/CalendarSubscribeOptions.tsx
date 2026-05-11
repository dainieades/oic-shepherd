'use client';

import React from 'react';
import { AppleLogo, GoogleLogo, CaretRight, CaretDown, Copy } from '@phosphor-icons/react';

interface Props {
  feedUrl: string;
  onSubscribeApple: () => void;
  onSubscribeGoogle: () => void;
  onCopy: () => void;
}

export function CalendarSubscribeOptions({
  feedUrl,
  onSubscribeApple,
  onSubscribeGoogle,
  onCopy,
}: Props) {
  const [showAdvanced, setShowAdvanced] = React.useState(false);

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <AppRow
          icon={<AppleLogo size={20} color="var(--text-primary)" weight="fill" />}
          label="Apple Calendar"
          hint="Pick refresh frequency in Apple Calendar settings."
          onOpen={onSubscribeApple}
        />
        <AppRow
          icon={<GoogleLogo size={20} color="var(--text-primary)" />}
          label="Google Calendar"
          hint="Google refreshes the subscription roughly once a day."
          onOpen={onSubscribeGoogle}
        />
      </div>

      <button
        onClick={() => setShowAdvanced((v) => !v)}
        style={disclosureBtnStyle}
        aria-expanded={showAdvanced}
      >
        {showAdvanced
          ? <CaretDown size={14} weight="bold" color="var(--text-muted)" />
          : <CaretRight size={14} weight="bold" color="var(--text-muted)" />}
        <span>Use a different calendar app</span>
      </button>

      {showAdvanced && (
        <div style={{ marginTop: '0.5rem' }}>
          <p style={advancedHintStyle}>
            Copy this URL and add it as a subscribed calendar inside your app (Outlook,
            Fantastical, etc.).
          </p>
          <div style={feedUrlBoxStyle}>
            {feedUrl || 'Generating…'}
          </div>
          <button onClick={onCopy} style={copyBtnStyle}>
            <Copy size={16} color="var(--text-muted)" />
            <span style={{ flex: 1, textAlign: 'left' }}>Copy feed URL</span>
          </button>
        </div>
      )}
    </>
  );
}

function AppRow({
  icon,
  label,
  hint,
  onOpen,
}: {
  icon: React.ReactNode;
  label: string;
  hint: string;
  onOpen: () => void;
}) {
  return (
    <button
      onClick={onOpen}
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border-light)',
        borderRadius: 'var(--radius)',
        padding: '0.875rem 1rem',
        width: '100%',
        textAlign: 'left',
        cursor: 'pointer',
        display: 'block',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
        <span style={{ flexShrink: 0 }}>{icon}</span>
        <span style={{ flex: 1, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>{label}</span>
        <CaretRight size={16} weight="bold" color="var(--text-muted)" />
      </div>
      <p style={hintStyle}>{hint}</p>
    </button>
  );
}

const disclosureBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.375rem',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: '0.75rem 0',
  marginTop: '0.5rem',
  fontSize: '0.8125rem',
  color: 'var(--text-secondary)',
};

const hintStyle: React.CSSProperties = {
  fontSize: '0.8125rem',
  color: 'var(--text-muted)',
  margin: '0.375rem 0 0',
  paddingLeft: 'calc(20px + 0.875rem)',
  lineHeight: 1.5,
};

const advancedHintStyle: React.CSSProperties = {
  fontSize: '0.8125rem',
  color: 'var(--text-muted)',
  marginTop: '0.125rem',
  marginBottom: '0.5rem',
  lineHeight: 1.5,
};

const feedUrlBoxStyle: React.CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--border-light)',
  borderRadius: 'var(--radius)',
  padding: '0.75rem',
  fontFamily: 'ui-monospace, SFMono-Regular, monospace',
  fontSize: '0.75rem',
  color: 'var(--text-secondary)',
  wordBreak: 'break-all',
  marginBottom: '0.5rem',
};

const copyBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.625rem',
  padding: '0.625rem 0.875rem',
  background: 'var(--surface)',
  border: '1px solid var(--border-light)',
  borderRadius: 'var(--radius-sm)',
  cursor: 'pointer',
  width: '100%',
  fontSize: '0.875rem',
  color: 'var(--text-primary)',
};
