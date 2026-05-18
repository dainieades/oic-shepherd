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
      <div className="flex flex-col gap-3">
        <AppRow
          icon={<AppleLogo size={20} color="var(--text-primary)" weight="fill" />}
          label="Apple Calendar"
          hint="Subscribes automatically. Refresh frequency set in Apple Calendar (as often as every 5 min on Mac)."
          onOpen={onSubscribeApple}
        />
        <AppRow
          icon={<GoogleLogo size={20} color="var(--text-primary)" />}
          label="Google Calendar"
          hint="Opens Google Calendar settings — paste the copied URL to subscribe. Updates appear within 24 h."
          onOpen={onSubscribeGoogle}
        />
      </div>

      <button
        onClick={() => setShowAdvanced((v) => !v)}
        className="inline-flex items-center gap-1.5 bg-none border-none cursor-pointer py-3 mt-2 text-13 text-text-secondary"
        aria-expanded={showAdvanced}
      >
        {showAdvanced ? (
          <CaretDown size={14} weight="bold" color="var(--text-muted)" />
        ) : (
          <CaretRight size={14} weight="bold" color="var(--text-muted)" />
        )}
        <span>Use a different calendar app</span>
      </button>

      {showAdvanced && (
        <div className="mt-2">
          <p className="text-13 text-text-muted leading-normal mb-2" style={{ marginTop: '0.125rem' }}>
            Copy this URL and add it as a subscribed calendar inside your app (Outlook, Fantastical,
            etc.).
          </p>
          <div className="bg-surface border border-border-light rounded p-3 font-mono text-12 text-text-secondary mb-2" style={{ wordBreak: 'break-all' }}>{feedUrl || 'Generating…'}</div>
          <button onClick={onCopy} className="flex items-center gap-2.5 py-2.5 px-3.5 bg-surface border border-border-light rounded-sm cursor-pointer w-full text-14 text-text-primary">
            <Copy size={16} color="var(--text-muted)" />
            <span className="flex-1 text-left">Copy feed URL</span>
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
      className="bg-surface border border-border-light rounded py-3.5 px-4 w-full text-left cursor-pointer block"
    >
      <div className="flex items-center gap-3.5">
        <span className="shrink-0">{icon}</span>
        <span className="flex-1 text-15 text-text-primary">
          {label}
        </span>
        <CaretRight size={16} weight="bold" color="var(--text-muted)" />
      </div>
      <p className="text-13 text-text-muted leading-normal mt-1.5" style={{ paddingLeft: 'calc(20px + 0.875rem)' }}>{hint}</p>
    </button>
  );
}

