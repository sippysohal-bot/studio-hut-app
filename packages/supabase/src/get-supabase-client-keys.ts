import { z } from 'zod';

/**
 * Returns and validates the Supabase client keys from the environment.
 */
export function getSupabaseClientKeys() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy-anon-key-for-build';

  return z
    .object({
      url: z.string().min(1),
      anonKey: z.string().min(1),
    })
    .parse({
      url,
      anonKey,
    });
}