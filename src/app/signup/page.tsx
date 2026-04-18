'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

export default function SignUpPage() {
  const router = useRouter();
  React.useEffect(() => {
    router.replace('/signin');
  }, [router]);
  return null;
}
