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
        className="bg-surface border-border-light block w-full cursor-pointer rounded border px-4 py-3.5 text-left"
      >
        <div className="flex items-center gap-3.5">
          <span className="shrink-0">
            <AppleLogo size={20} color="var(--text-primary)" weight="fill" />
          </span>
          <span className="text-15 text-text-primary flex-1">Apple Calendar</span>
          <CaretRight size={16} weight="bold" color="var(--text-muted)" />
        </div>
        <p className="text-13 text-text-muted mt-1.5 pl-[2.125rem] leading-normal">
          Subscribes automatically. Updates as often as every 5 min on Mac, or once daily on iPhone.
        </p>
      </button>

      <div className="bg-surface border-border-light overflow-hidden rounded border">
        <button
          onClick={() => setShowOther((v) => !v)}
          className="block w-full cursor-pointer border-none bg-transparent px-4 py-3.5 text-left"
          aria-expanded={showOther}
        >
          <div className="flex items-center gap-3.5">
            <span className="shrink-0">
              <GoogleLogo size={20} color="var(--text-primary)" />
            </span>
            <span className="text-15 text-text-primary flex-1">Google Calendar & others</span>
            <CaretRight
              size={16}
              weight="bold"
              color="var(--text-muted)"
              style={{
                transform: showOther ? 'rotate(90deg)' : 'none',
                transition: 'transform 0.15s',
              }}
            />
          </div>
          <p className="text-13 text-text-muted mt-1.5 pl-[2.125rem] leading-normal">
            Copy the feed URL and add it as a subscribed calendar in your app.
          </p>
        </button>

        {showOther && (
          <div className="border-border-light flex flex-col gap-2 border-t px-4 pt-3 pb-4">
            <div className="bg-bg border-border-light text-12 text-text-secondary rounded border p-3 font-mono leading-normal break-all">
              {feedUrl || 'Generating…'}
            </div>
            <button
              onClick={onCopy}
              className="bg-bg border-border-light text-14 text-text-primary flex w-full cursor-pointer items-center gap-2.5 rounded-sm border px-3.5 py-2.5"
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
