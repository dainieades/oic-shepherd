'use client';

import React from 'react';

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100svh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          padding: '1.5rem',
          textAlign: 'center',
          fontFamily: 'system-ui, sans-serif',
          backgroundColor: '#fff',
          color: '#111',
        }}
      >
        <p style={{ fontSize: '1.0625rem', fontWeight: 600, margin: 0 }}>Something went wrong</p>
        <p style={{ fontSize: '0.875rem', color: '#666', margin: 0 }}>
          A critical error occurred. Please refresh the page.
        </p>
        <button
          onClick={reset}
          style={{
            fontSize: '0.875rem',
            fontWeight: 500,
            padding: '0.5rem 1.25rem',
            borderRadius: '0.5rem',
            border: 'none',
            background: '#4f46e5',
            color: '#fff',
            cursor: 'pointer',
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
