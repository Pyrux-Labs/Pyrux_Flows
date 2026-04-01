import { createClient } from "@supabase/supabase-js";

// Service role client — bypasses RLS.
// Only use in server-side cron routes and trusted server actions.
// Never expose to the client.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}
