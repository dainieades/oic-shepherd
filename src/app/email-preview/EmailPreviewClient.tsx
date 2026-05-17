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
    <div
      style={{
        background: '#e8e8e8',
        minHeight: '100vh',
        padding: '2rem',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <h1 style={{ margin: '0 0 2rem', fontSize: 'var(--text-18)', fontWeight: 'var(--font-bold)', color: '#111' }}>
        Email Previews
      </h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
        {emails.map(({ label, subject, html }) => (
          <div key={label}>
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: '1rem',
                marginBottom: '0.5rem',
              }}
            >
              <span
                style={{
                  fontSize: 'var(--text-11)',
                  fontWeight: 'var(--font-bold)',
                  textTransform: 'uppercase',
                  letterSpacing: 'var(--tracking-wide-6)',
                  color: '#888',
                }}
              >
                {label}
              </span>
              <span style={{ fontSize: 'var(--text-13)', color: '#444', flex: 1 }}>
                Subject: <strong>{subject}</strong>
              </span>
              <button
                type="button"
                onClick={() => handleCopy(label, html)}
                style={{
                  fontSize: 'var(--text-12)',
                  fontWeight: 'var(--font-semibold)',
                  padding: '0.375rem 0.75rem',
                  border: '1px solid #ccc',
                  borderRadius: '0.375rem',
                  background: copiedLabel === label ? '#705a8c' : '#fff',
                  color: copiedLabel === label ? '#fff' : '#333',
                  cursor: 'pointer',
                }}
              >
                {copiedLabel === label ? 'Copied' : 'Copy HTML'}
              </button>
            </div>
            <iframe
              srcDoc={html}
              style={{ width: '100%', border: 'none', borderRadius: '0.5rem', display: 'block' }}
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
