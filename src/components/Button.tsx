'use client';

import React from 'react';

interface ButtonProps {
  variant?: 'primary' | 'ghost' | 'text' | 'danger';
  size?: 'sm' | 'md';
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  disabled = false,
  onClick,
  type = 'button',
  children,
}: ButtonProps) {
  const height = size === 'sm' ? 32 : 40;
  const padding = size === 'sm' ? '0 14px' : '0 20px';
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
      borderRadius: 8,
      background: disabled ? 'var(--border)' : 'var(--sage)',
      color: disabled ? 'var(--text-muted)' : 'var(--on-sage)',
    },
    ghost: {
      borderRadius: 8,
      background: 'none',
      color: disabled ? 'var(--text-muted)' : 'var(--text-secondary)',
    },
    text: {
      borderRadius: 8,
      background: 'none',
      color: disabled ? 'var(--text-muted)' : 'var(--sage)',
    },
    danger: {
      borderRadius: 8,
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
      style={{ ...base, ...variants[variant] }}
    >
      {children}
    </button>
  );
}
