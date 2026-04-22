'use client';

import React from 'react';

interface AvatarBadgeProps {
  name: string;
  photo?: string;
  size?: number;
  bg?: string;
  color?: string;
  border?: string;
  icon?: React.ReactNode;
}

export function AvatarBadge({
  name,
  photo,
  size = 44,
  bg = 'var(--sage-light)',
  color = 'var(--sage)',
  border,
  icon,
}: AvatarBadgeProps) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: bg,
        border,
        color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: Math.round(size * 0.3),
        fontWeight: 700,
        flexShrink: 0,
        overflow: 'hidden',
      }}
    >
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photo} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : icon ? (
        icon
      ) : (
        initials
      )}
    </div>
  );
}
