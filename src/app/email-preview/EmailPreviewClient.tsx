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
    <div className="min-h-screen p-8" style={{ background: '#e8e8e8', fontFamily: 'system-ui, sans-serif' }}>
      <h1 className="text-18 font-bold mb-8" style={{ color: '#111' }}>
        Email Previews
      </h1>
      <div className="flex flex-col" style={{ gap: '3rem' }}>
        {emails.map(({ label, subject, html }) => (
          <div key={label}>
            <div className="flex items-baseline gap-4 mb-2">
              <span
                className="text-11 font-bold uppercase tracking-wide-6"
                style={{ color: '#888' }}
              >
                {label}
              </span>
              <span className="text-13 flex-1" style={{ color: '#444' }}>
                Subject: <strong>{subject}</strong>
              </span>
              <button
                type="button"
                onClick={() => handleCopy(label, html)}
                className="text-12 font-semibold py-1.5 px-3 border cursor-pointer"
                style={{
                  border: '1px solid #ccc',
                  borderRadius: '0.375rem',
                  background: copiedLabel === label ? '#705a8c' : '#fff',
                  color: copiedLabel === label ? '#fff' : '#333',
                }}
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
