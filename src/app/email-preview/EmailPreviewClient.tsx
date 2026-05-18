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
    <div className="min-h-screen p-8 font-sans bg-[#e8e8e8]">
      <h1 className="text-18 font-bold mb-8 text-text-primary">
        Email Previews
      </h1>
      <div className="flex flex-col gap-12">
        {emails.map(({ label, subject, html }) => (
          <div key={label}>
            <div className="flex items-baseline gap-4 mb-2">
              <span
                className="text-11 font-bold uppercase tracking-wide-6 text-text-muted"
              >
                {label}
              </span>
              <span className="text-13 flex-1 text-text-secondary">
                Subject: <strong>{subject}</strong>
              </span>
              <button
                type="button"
                onClick={() => handleCopy(label, html)}
                className={`text-12 font-semibold py-1.5 px-3 border border-border rounded-[0.375rem] cursor-pointer ${copiedLabel === label ? 'bg-sage text-on-sage' : 'bg-surface text-text-primary'}`}
              >
                {copiedLabel === label ? 'Copied' : 'Copy HTML'}
              </button>
            </div>
            <iframe
              srcDoc={html}
              className="w-full block rounded-xs"
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
