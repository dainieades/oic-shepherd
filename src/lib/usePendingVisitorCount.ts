'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useApp } from '@/lib/context';
import { createClient } from '@/utils/supabase/client';

export function usePendingVisitorCount(): number {
  const { currentPersona } = useApp();
  const pathname = usePathname();
  const canSee =
    currentPersona.role === 'admin' || currentPersona.canTriageVisitors === true;
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    if (!canSee) {
      setCount(0);
      return;
    }
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const { count: c } = await supabase
        .from('visitor_submissions')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending');
      if (!cancelled) setCount(c ?? 0);
    })();
    return () => {
      cancelled = true;
    };
  }, [canSee, pathname]);

  return count;
}
