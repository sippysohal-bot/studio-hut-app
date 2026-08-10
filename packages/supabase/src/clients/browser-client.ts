import { createBrowserClient as createSupabaseBrowserClient } from '@supabase/ssr';

export function createBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy-anon-key-for-build';

  try {
    return createSupabaseBrowserClient(url, anonKey);
  } catch (error) {
    return {} as ReturnType<typeof createSupabaseBrowserClient>;
  }
}