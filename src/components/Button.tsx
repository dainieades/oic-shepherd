'use client';

import React from 'react';

interface ButtonProps {
  variant?: 'primary' | 'ghost' | 'text' | 'danger';
  size?: 'sm' | 'md';
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  style?: React.CSSProperties;
  className?: string;
  'aria-label'?: string;
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  disabled = false,
  onClick,
  type = 'button',
  style: styleProp,
  className,
  'aria-label': ariaLabel,
  children,
}: ButtonProps) {
  const height = size === 'sm' ? 32 : 40;
  const padding = size === 'sm' ? '0 0.875rem' : '0 1.25rem';
  const fontSize = size === 'sm' ? 'var(--text-14)' : 'var(--text-15)';

  const base: React.CSSProperties = {
    height,
    padding,
    fontSize,
    fontWeight: 'var(--font-semibold)',
    border: 'none',
    cursor: disabled ? 'default' : 'pointer',
    transition: 'background 0.15s',
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
      className={`inline-flex items-center justify-center gap-1.5 ${className ?? ''}`}
      aria-label={ariaLabel}
      style={{ ...base, ...variants[variant], ...styleProp }}
    >
      {children}
    </button>
  );
}
