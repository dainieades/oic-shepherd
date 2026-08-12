'use client';

import React from 'react';

interface EmailEntry {
  label: string;
  subject: string;
  html: string;
}

export default function EmailPreviewClient({ emails }: { emails: EmailEntry[] }) {
  const [copiedLabel, setCopiedLabel] = React.useState<string | null>(null);

  const handleCopy = async (label: string, html: string) => {
    await navigator.clipboard.writeText(html);
    setCopiedLabel(label);
    setTimeout(() => setCopiedLabel((current) => (current === label ? null : current)), 1500);
  };

  return (
    <div className="min-h-screen bg-[#e8e8e8] p-8 font-sans">
      <h1 className="text-18 text-text-primary mb-8 font-bold">Email Previews</h1>
      <div className="flex flex-col gap-12">
        {emails.map(({ label, subject, html }) => (
          <div key={label}>
            <div className="mb-2 flex items-baseline gap-4">
              <span className="text-11 tracking-wide-6 text-text-muted font-bold uppercase">
                {label}
              </span>
              <span className="text-13 text-text-secondary flex-1">
                Subject: <strong>{subject}</strong>
              </span>
              <button
                type="button"
                onClick={() => handleCopy(label, html)}
                className={`text-12 border-border cursor-pointer rounded-[0.375rem] border px-3 py-1.5 font-semibold ${copiedLabel === label ? 'bg-sage text-on-sage' : 'bg-surface text-text-primary'}`}
              >
                {copiedLabel === label ? 'Copied' : 'Copy HTML'}
              </button>
            </div>
            <iframe
              srcDoc={html}
              className="block w-full rounded-xs"
              style={{ border: 'none' }}
              onLoad={(e) => {
                const iframe = e.currentTarget;
                const doc = iframe.contentDocument;
                if (doc) {
                  iframe.style.height = doc.documentElement.scrollHeight + 'px';
                }
              }}
              title={label}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
