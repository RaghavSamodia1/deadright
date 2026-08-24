// DeadRight · Push edge function
//
// Turns a row in `notifications` into an actual notification on somebody's
// phone. Invoked by the notifications_push trigger (00043), which posts the new
// row's id and a shared secret.
//
// Deploy:  supabase functions deploy push --no-verify-jwt
// Secrets: supabase secrets set PUSH_HOOK_SECRET=<same value as the Vault secret>
//
// --no-verify-jwt because the caller is Postgres, not a signed-in user. The
// x-push-secret header is what authorises it instead, so that secret is the
// only thing standing between the internet and the ability to send a push to
// any user — it must be long and random.

const EXPO_ENDPOINT = "https://exp.host/--/api/v2/push/send";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const HOOK_SECRET = Deno.env.get("PUSH_HOOK_SECRET") ?? "";

/**
 * Which preference silences which notification.
 *
 * user_settings has carried these six toggles since 00007 and the settings
 * screen has always written them, but nothing read them — there was no delivery
 * to suppress. A push that ignores the switch the user flipped is worse than no
 * push, so the mapping lives here and anything unmapped is always sent.
 */
const MUTED_BY: Record<string, string> = {
  bet_invite: "notify_new_bets",
  bet_joined: "notify_new_bets",
  resolution_request: "notify_resolutions",
  outcome_proposed: "notify_resolutions",
  bet_won: "notify_resolutions",
  bet_lost: "notify_resolutions",
  bet_cancelled: "notify_resolutions",
  bet_deleted: "notify_resolutions",
  dispute_raised: "notify_disputes",
  dispute_resolved: "notify_disputes",
  jar_violation: "notify_jar",
  jar_cap_reached: "notify_jar",
  jar_violation_removed: "notify_jar",
  form_change: "notify_form",
};

async function rest(path: string): Promise<any[]> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
    },
  });
  if (!res.ok) throw new Error(`${path}: ${res.status} ${await res.text()}`);
  return await res.json();
}

Deno.serve(async (req) => {
  // Constant-ish comparison is not the point here; a wrong secret gets nothing.
  if (!HOOK_SECRET || req.headers.get("x-push-secret") !== HOOK_SECRET) {
    return new Response("no", { status: 401 });
  }

  let notificationId: string | undefined;
  try {
    notificationId = (await req.json())?.notification_id;
  } catch {
    return new Response("bad body", { status: 400 });
  }
  if (!notificationId) return new Response("bad body", { status: 400 });

  try {
    const [n] = await rest(
      `notifications?id=eq.${notificationId}&select=id,user_id,type,title,body,bet_id,group_id`,
    );
    if (!n) return new Response("gone", { status: 200 });

    // Respect the switch, when there is one for this kind.
    const pref = MUTED_BY[n.type];
    if (pref) {
      const [settings] = await rest(
        `user_settings?user_id=eq.${n.user_id}&select=${pref}`,
      );
      if (settings && settings[pref] === false) {
        return new Response("muted", { status: 200 });
      }
    }

    const tokens = await rest(
      `push_tokens?user_id=eq.${n.user_id}&select=token`,
    );
    if (!tokens.length) return new Response("no devices", { status: 200 });

    const messages = tokens.map((t: { token: string }) => ({
      to: t.token,
      title: n.title,
      body: n.body ?? undefined,
      sound: "default",
      // What the app opens when it is tapped.
      data: { notificationId: n.id, betId: n.bet_id, groupId: n.group_id, type: n.type },
    }));

    const res = await fetch(EXPO_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(messages),
    });
    const out = await res.json();

    // Expo reports a dead install per-message. Those tokens will never work
    // again, so drop them rather than retrying them forever.
    const dead: string[] = [];
    (out?.data ?? []).forEach((r: any, i: number) => {
      if (r?.status === "error" && r?.details?.error === "DeviceNotRegistered") {
        dead.push(messages[i].to);
      }
    });
    if (dead.length) {
      await fetch(
        `${SUPABASE_URL}/rest/v1/push_tokens?token=in.(${dead.map((t) => `"${t}"`).join(",")})`,
        {
          method: "DELETE",
          headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
        },
      );
    }

    return new Response(JSON.stringify({ sent: messages.length, dropped: dead.length }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    // The notification row is already written and the alerts screen will show
    // it; a delivery failure is not worth a 500 that makes Postgres retry.
    console.error("push failed", e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 200 });
  }
});
