import useSWR from 'swr'
import { apiRequest } from '@/lib/api'

interface UncategorizedResponse {
  data: unknown[];
  meta?: {
    total: number;
  };
}

export const useUncategorizedCount = () => {
  const { data, error, mutate } = useSWR<UncategorizedResponse>(
    '/things/items?uncategorized=true&own=true',
    apiRequest
  );

  return {
    count: data?.meta?.total || 0,
    loading: !error && !data,
    error,
    refresh: mutate
  };
}; 