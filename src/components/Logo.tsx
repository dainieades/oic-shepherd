import React from 'react';

interface LogoProps {
  height?: number;
  style?: React.CSSProperties;
  ariaLabel?: string;
}

export function Logo({ height = 88, style, ariaLabel = 'One In Christ Church' }: LogoProps) {
  return (
    <div
      role="img"
      aria-label={ariaLabel}
      style={{
        height,
        aspectRatio: '114 / 84',
        background: 'var(--logo-color)',
        WebkitMaskImage: 'url(/OIC_logo-with_name_below.svg)',
        maskImage: 'url(/OIC_logo-with_name_below.svg)',
        WebkitMaskRepeat: 'no-repeat',
        maskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center',
        maskPosition: 'center',
        WebkitMaskSize: 'contain',
        maskSize: 'contain',
        ...style,
      }}
    />
  );
}
