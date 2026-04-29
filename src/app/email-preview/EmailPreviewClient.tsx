'use client';

import React from 'react';

interface EmailEntry {
  label: string;
  subject: string;
  html: string;
}

export default function EmailPreviewClient({ emails }: { emails: EmailEntry[] }) {
  return (
    <div style={{ background: '#e8e8e8', minHeight: '100vh', padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ margin: '0 0 2rem', fontSize: '1.125rem', fontWeight: 700, color: '#111' }}>
        Email Previews
      </h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
        {emails.map(({ label, subject, html }) => (
          <div key={label}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#888' }}>
                {label}
              </span>
              <span style={{ fontSize: '0.8125rem', color: '#444' }}>
                Subject: <strong>{subject}</strong>
              </span>
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
