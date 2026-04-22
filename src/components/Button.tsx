'use client';

import React from 'react';

interface ButtonProps {
  variant?: 'primary' | 'ghost' | 'text' | 'danger';
  size?: 'sm' | 'md';
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  style?: React.CSSProperties;
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  disabled = false,
  onClick,
  type = 'button',
  style: styleProp,
  children,
}: ButtonProps) {
  const height = size === 'sm' ? 32 : 40;
  const padding = size === 'sm' ? '0 0.875rem' : '0 1.25rem';
  const fontSize = size === 'sm' ? 14 : 15;

  const base: React.CSSProperties = {
    height,
    padding,
    fontSize,
    fontWeight: 600,
    border: 'none',
    cursor: disabled ? 'default' : 'pointer',
    transition: 'background 0.15s',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  };

  const variants: Record<string, React.CSSProperties> = {
    primary: {
      borderRadius: 'var(--radius-xs)',
      background: disabled ? 'var(--border)' : 'var(--sage)',
      color: disabled ? 'var(--text-muted)' : 'var(--on-sage)',
    },
    ghost: {
      borderRadius: 'var(--radius-xs)',
      background: 'none',
      color: disabled ? 'var(--text-muted)' : 'var(--text-secondary)',
    },
    text: {
      borderRadius: 'var(--radius-xs)',
      background: 'none',
      color: disabled ? 'var(--text-muted)' : 'var(--sage)',
    },
    danger: {
      borderRadius: 'var(--radius-xs)',
      background: disabled ? 'var(--border)' : 'var(--red-light)',
      color: disabled ? 'var(--text-muted)' : 'var(--red)',
      border: disabled ? 'none' : '1px solid var(--red-border)',
    },
  };

  return (
    <button
      type={type}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{ ...base, ...variants[variant], ...styleProp }}
    >
      {children}
    </button>
  );
}
