import { useEffect } from 'react';
import { useSupabase } from './use-supabase';

export function useAuthChangeListener(
  callback: (event: string, session: any) => void
) {
  const client = useSupabase();

  useEffect(() => {
    // Check if client or auth is available during build/SSR
    if (!client?.auth?.onAuthStateChange) {
      return;
    }

    try {
      const {
        data: { subscription },
      } = client.auth.onAuthStateChange((event, session) => {
        callback(event, session);
      });

      return () => {
        subscription?.unsubscribe();
      };
    } catch {
      // Ignore errors during build time / SSR
    }
  }, [client, callback]);
}