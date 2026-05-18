import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 px-6 text-center">
      <p
        style={{ fontSize: 'var(--text-32)', fontWeight: 'var(--font-bold)' }}
        className="text-text-tertiary"
      >
        404
      </p>
      <div className="flex flex-col gap-1">
        <p
          style={{ fontSize: 'var(--text-17)', fontWeight: 'var(--font-semibold)' }}
          className="text-text-primary"
        >
          Page not found
        </p>
        <p style={{ fontSize: 'var(--text-14)' }} className="text-text-secondary">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
      </div>
      <Link
        href="/"
        className="rounded-lg bg-accent px-5 py-2 text-white"
        style={{ fontSize: 'var(--text-14)', fontWeight: 'var(--font-medium)' }}
      >
        Go home
      </Link>
    </div>
  );
}
