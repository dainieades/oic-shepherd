'use client';

import React from 'react';
import { AppleLogo, GoogleLogo, CaretRight, Copy } from '@phosphor-icons/react';

interface Props {
  feedUrl: string;
  onSubscribeApple: () => void;
  onCopy: () => void;
}

export function CalendarSubscribeOptions({ feedUrl, onSubscribeApple, onCopy }: Props) {
  const [showOther, setShowOther] = React.useState(false);

  return (
    <div className="flex flex-col gap-3">
      <button
        onClick={onSubscribeApple}
        className="bg-surface border border-border-light rounded py-3.5 px-4 w-full text-left cursor-pointer block"
      >
        <div className="flex items-center gap-3.5">
          <span className="shrink-0">
            <AppleLogo size={20} color="var(--text-primary)" weight="fill" />
          </span>
          <span className="flex-1 text-15 text-text-primary">Apple Calendar</span>
          <CaretRight size={16} weight="bold" color="var(--text-muted)" />
        </div>
        <p className="text-13 text-text-muted leading-normal mt-1.5 pl-[2.125rem]">
          Subscribes automatically. Updates as often as every 5 min on Mac, or once daily on iPhone.
        </p>
      </button>

      <div className="bg-surface border border-border-light rounded overflow-hidden">
        <button
          onClick={() => setShowOther((v) => !v)}
          className="py-3.5 px-4 w-full text-left cursor-pointer block bg-transparent border-none"
          aria-expanded={showOther}
        >
          <div className="flex items-center gap-3.5">
            <span className="shrink-0">
              <GoogleLogo size={20} color="var(--text-primary)" />
            </span>
            <span className="flex-1 text-15 text-text-primary">Google Calendar & others</span>
            <CaretRight
              size={16}
              weight="bold"
              color="var(--text-muted)"
              style={{ transform: showOther ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}
            />
          </div>
          <p className="text-13 text-text-muted leading-normal mt-1.5 pl-[2.125rem]">
            Copy the feed URL and add it as a subscribed calendar in your app.
          </p>
        </button>

        {showOther && (
          <div className="px-4 pb-4 flex flex-col gap-2 border-t border-border-light pt-3">
            <div className="bg-bg border border-border-light rounded p-3 font-mono text-12 text-text-secondary break-all leading-normal">
              {feedUrl || 'Generating…'}
            </div>
            <button
              onClick={onCopy}
              className="flex items-center gap-2.5 py-2.5 px-3.5 bg-bg border border-border-light rounded-sm cursor-pointer w-full text-14 text-text-primary"
            >
              <Copy size={16} color="var(--text-muted)" />
              <span className="flex-1 text-left">Copy feed URL</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
