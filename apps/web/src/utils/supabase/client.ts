import { createBrowserClient } from '@supabase/ssr'

/**
 * Creates a client-side Supabase client.
 * This client uses the browser's local storage/cookies for session management.
 *
 * @returns A Supabase client instance.
 */
export function createClient() {
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
}
