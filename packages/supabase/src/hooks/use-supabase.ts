import { useMemo } from 'react';
import { createBrowserClient } from '../clients/browser-client';

export function useSupabase() {
  return useMemo(() => createBrowserClient(), []);
}