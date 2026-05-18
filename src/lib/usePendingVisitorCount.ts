'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export function usePendingVisitorCount(): number {
  const pathname = usePathname();
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
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
  }, [pathname]);

  return count;
}
