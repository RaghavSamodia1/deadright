import { createClient } from 'jsr:@supabase/supabase-js@2';

/**
 * Account deletion.
 *
 * Deleting an auth user requires the service role, which must never reach the
 * client — so it happens here. The caller proves who they are with their own
 * JWT; this function only ever deletes *that* user, never an id supplied in the
 * request body.
 *
 * profiles.id references auth.users on delete cascade, and everything else
 * cascades from profiles, so removing the auth user removes the lot.
 */

const admin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, apikey',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') {
    return json({ error: 'method_not_allowed' }, 405);
  }

  const authHeader = req.headers.get('Authorization') ?? '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token) return json({ error: 'unauthorized' }, 401);

  // Identify the caller from their token — this is the only id we trust.
  const { data: userData, error: userError } = await admin.auth.getUser(token);
  if (userError || !userData.user) return json({ error: 'unauthorized' }, 401);

  const userId = userData.user.id;

  // Groups this user solely administers would be orphaned; hand them over to
  // the longest-standing remaining member rather than stranding the group.
  const { data: adminGroups } = await admin
    .from('group_members')
    .select('group_id')
    .eq('user_id', userId)
    .eq('role', 'admin');

  for (const g of adminGroups ?? []) {
    const { data: others } = await admin
      .from('group_members')
      .select('user_id, joined_at')
      .eq('group_id', g.group_id)
      .neq('user_id', userId)
      .order('joined_at', { ascending: true })
      .limit(1);

    if (others?.length) {
      await admin
        .from('group_members')
        .update({ role: 'admin' })
        .eq('group_id', g.group_id)
        .eq('user_id', others[0].user_id);
    }
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
  if (deleteError) {
    console.error('delete-account failed:', deleteError);
    return json({ error: 'delete_failed', detail: deleteError.message }, 500);
  }

  return json({ ok: true });
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'content-type': 'application/json' },
  });
}
