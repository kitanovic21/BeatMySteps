import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { AppState } from 'react-native';

import { health } from '@/health';

export const SOURCE_DAYS = 7;

/**
 * Apps and devices that sent steps this past week. Refreshes when the user comes
 * back to the app, since connecting a watch happens in its companion app.
 */
export function useStepSources() {
  const query = useQuery({
    queryKey: ['stepSources'],
    queryFn: () => health.getStepSources(SOURCE_DAYS),
    retry: false,
  });
  const { refetch } = query;

  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => s === 'active' && refetch());
    return () => sub.remove();
  }, [refetch]);

  return query;
}
