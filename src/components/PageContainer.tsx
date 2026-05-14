import React from 'react';

interface PageContainerProps {
  children: React.ReactNode;
  /** Content width tier at md+. Defaults to 'xl' (suits tables and lists). */
  width?: 'xl' | '3xl' | '2xl';
  className?: string;
}

const WIDTH_CLASS: Record<NonNullable<PageContainerProps['width']>, string> = {
  xl: 'lg:max-w-screen-xl',
  '3xl': 'lg:max-w-3xl',
  '2xl': 'lg:max-w-2xl',
};

export default function PageContainer({
  children,
  width = 'xl',
  className = '',
}: PageContainerProps) {
  return (
    <div className={`mx-auto w-full lg:px-4 lg:py-6 xl:px-8 ${WIDTH_CLASS[width]} ${className}`}>
      {children}
    </div>
  );
}
