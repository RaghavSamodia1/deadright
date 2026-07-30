import { createClient } from 'jsr:@supabase/supabase-js@2';

/**
 * Party Pools — the guest side.
 *
 * Serves a self-contained web page for a pool and accepts entries, addressed
 * only by the share token in the URL. Guests need no account and no app, so
 * this function holds the service key and is the only thing that touches the
 * pool tables on their behalf.
 *
 *   GET  /pool/<token>        → HTML page
 *   POST /pool/<token>        → { name, optionId } enters the pool
 *   GET  /pool/<token>/results→ JSON tally (page polls this)
 */

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

// Overridable so a custom domain can take over later without a code change.
const GUEST_BASE =
  Deno.env.get('POOL_GUEST_BASE') ??
  'https://raghavsamodia1.github.io/deadright/pool/';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  const url = new URL(req.url);
  // /functions/v1/pool/<token>[/results]
  const parts = url.pathname.split('/').filter(Boolean);
  const idx = parts.indexOf('pool');
  const token = parts[idx + 1] ?? url.searchParams.get('t') ?? '';
  const wantsResults = parts[idx + 2] === 'results';
  const wantsData = parts[idx + 2] === 'data';

  if (!token) return html(notFoundPage(), 404);

  const { data: pool } = await supabase
    .from('pools')
    .select('id, title, question, status, closes_at, winning_option')
    .eq('share_token', token)
    .maybeSingle();

  if (!pool) return html(notFoundPage(), 404);

  // The guest page itself is served from GUEST_BASE (GitHub Pages), because
  // Supabase rewrites text/html to text/plain with nosniff on the shared
  // *.supabase.co domain — for Storage as well as Functions — so anything
  // HTML-shaped returned from here renders as source in a browser.
  //
  // Redirecting rather than changing the share link keeps every QR code and
  // link already handed out working. A 302 is not HTML, so it is not rewritten.
  // /data, /results and the POST join stay on this origin as JSON.
  if (req.method === 'GET' && !wantsResults && !wantsData) {
    return new Response(null, {
      status: 302,
      headers: { ...CORS, location: `${GUEST_BASE}?t=${encodeURIComponent(token)}` },
    });
  }

  // Supabase rewrites text/html to text/plain with nosniff on the shared
  // *.supabase.co functions domain (anti-phishing), so the embedded page below
  // renders as source in a browser and cannot be fixed from in here. This
  // endpoint exposes the same data as JSON so the guest page can be served from
  // any static host while this function stays the API — the service-role key
  // never leaves the server either way.
  if (wantsData) {
    const { data: opts } = await supabase
      .from('pool_options')
      .select('id, label')
      .eq('pool_id', pool.id)
      .order('sort');
    return json({
      title: pool.title,
      question: pool.question,
      status: pool.status,
      closesAt: pool.closes_at,
      winningOption: pool.winning_option,
      options: opts ?? [],
    });
  }

  if (wantsResults) {
    const { data } = await supabase.rpc('pool_results', { p_pool: pool.id });
    return json({ status: pool.status, results: data ?? [] });
  }

  if (req.method === 'POST') {
    let body: { name?: string; optionId?: string };
    try {
      body = await req.json();
    } catch {
      return json({ error: 'bad_request' }, 400);
    }
    const name = (body.name ?? '').trim().slice(0, 24);
    if (!name || !body.optionId) return json({ error: 'name_and_option_required' }, 400);
    if (pool.status !== 'open') return json({ error: 'This pool is closed.' }, 409);

    // The option has to belong to this pool — never trust the posted id.
    const { data: option } = await supabase
      .from('pool_options')
      .select('id')
      .eq('id', body.optionId)
      .eq('pool_id', pool.id)
      .maybeSingle();
    if (!option) return json({ error: 'unknown_option' }, 400);

    const { error } = await supabase
      .from('pool_entries')
      .insert({ pool_id: pool.id, option_id: option.id, display_name: name });

    if (error) {
      // 23505 = the one-entry-per-name index
      const taken = (error as { code?: string }).code === '23505';
      return json(
        { error: taken ? 'That name already picked — try another.' : 'Could not join.' },
        taken ? 409 : 500,
      );
    }
    return json({ ok: true });
  }

  const { data: options } = await supabase
    .from('pool_options')
    .select('id, label')
    .eq('pool_id', pool.id)
    .order('sort');

  return html(poolPage(pool, options ?? [], token));
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'content-type': 'application/json' },
  });
}

function html(body: string, status = 200) {
  return new Response(body, {
    status,
    headers: { ...CORS, 'content-type': 'text/html; charset=utf-8' },
  });
}

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!),
  );

// Brand tokens mirrored from src/tokens so the guest page feels like the app.
const CSS = `
  :root{--bg:#0E121A;--s1:#151B26;--s2:#1C2534;--line:#283447;
        --amber:#F7C846;--mint:#8AE98D;--flame:#FF5500;--text:#F0F0F0;--dim:#96A5B9}
  *{box-sizing:border-box}
  body{margin:0;background:var(--bg);color:var(--text);
       font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
       display:flex;justify-content:center;padding:24px 16px 48px}
  .wrap{width:100%;max-width:420px}
  .brand{font-weight:900;font-size:22px;color:var(--flame);letter-spacing:-.5px;margin-bottom:24px}
  h1{font-size:26px;line-height:1.25;margin:0 0 8px;letter-spacing:-.4px}
  .sub{color:var(--dim);font-size:14px;margin:0 0 24px}
  .opt{display:block;width:100%;text-align:left;background:var(--s1);color:var(--text);
       border:1.5px solid var(--line);border-radius:16px;padding:16px;font-size:16px;
       margin-bottom:10px;cursor:pointer}
  .opt[aria-pressed=true]{border-color:var(--amber);background:rgba(247,200,70,.12)}
  input{width:100%;background:var(--s2);border:1px solid var(--line);border-radius:14px;
        padding:15px;color:var(--text);font-size:16px;margin:18px 0}
  button.go{width:100%;background:var(--amber);color:#0E121A;border:0;border-radius:999px;
            padding:17px;font-size:16px;font-weight:800;cursor:pointer}
  button.go:disabled{background:var(--line);color:var(--dim);cursor:not-allowed}
  .err{color:#FC574E;font-size:14px;margin-top:12px;min-height:20px}
  .bar{height:10px;background:var(--s2);border-radius:99px;overflow:hidden;margin:6px 0 14px}
  .bar>i{display:block;height:100%;background:var(--mint)}
  .row{display:flex;justify-content:space-between;font-size:14px;margin-bottom:2px}
  .foot{color:var(--dim);font-size:12px;margin-top:32px;text-align:center;line-height:1.6}
  .tag{display:inline-block;background:rgba(247,200,70,.15);color:var(--amber);
       border-radius:99px;padding:5px 12px;font-size:12px;font-weight:700;margin-bottom:16px}
`;

function poolPage(
  pool: { id: string; title: string; question: string; status: string },
  options: { id: string; label: string }[],
  token: string,
) {
  const closed = pool.status !== 'open';
  return `<!doctype html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(pool.title)} — DeadRight</title>
<meta name="description" content="${esc(pool.question)}">
<meta property="og:title" content="${esc(pool.title)}">
<meta property="og:description" content="${esc(pool.question)}">
<style>${CSS}</style></head><body><div class="wrap">
  <div class="brand">DeadRight 🔥</div>
  <div class="tag">${closed ? 'POOL CLOSED' : 'PARTY POOL'}</div>
  <h1>${esc(pool.question)}</h1>
  <p class="sub">${esc(pool.title)} · pick one, no signup needed</p>

  <div id="vote" ${closed ? 'hidden' : ''}>
    <div id="opts">
      ${options
        .map(
          (o) =>
            `<button class="opt" data-id="${o.id}" aria-pressed="false">${esc(o.label)}</button>`,
        )
        .join('')}
    </div>
    <input id="name" placeholder="Your name" maxlength="24" autocomplete="name">
    <button class="go" id="go" disabled>Lock it in</button>
    <div class="err" id="err"></div>
  </div>

  <div id="results" ${closed ? '' : 'hidden'}></div>

  <p class="foot">No account, no download — your pick is tracked by name only.<br>
  Powered by DeadRight · no real money, bragging rights only.</p>
</div>
<script>
  var base = location.pathname.replace(/\\/results$/, '');
  var picked = null;
  var opts = document.getElementById('opts');
  var nameEl = document.getElementById('name');
  var go = document.getElementById('go');
  var err = document.getElementById('err');

  function sync(){ go.disabled = !(picked && nameEl.value.trim()); }

  if (opts) opts.addEventListener('click', function(e){
    var b = e.target.closest('.opt'); if(!b) return;
    picked = b.dataset.id;
    [].forEach.call(opts.children, function(c){ c.setAttribute('aria-pressed', String(c === b)); });
    sync();
  });
  if (nameEl) nameEl.addEventListener('input', sync);

  if (go) go.addEventListener('click', async function(){
    go.disabled = true; err.textContent = '';
    try {
      var r = await fetch(base, {
        method: 'POST', headers: {'content-type':'application/json'},
        body: JSON.stringify({ name: nameEl.value, optionId: picked })
      });
      var d = await r.json();
      if (!r.ok) { err.textContent = d.error || 'Something went wrong.'; go.disabled = false; return; }
      document.getElementById('vote').hidden = true;
      showResults();
    } catch (e) { err.textContent = 'Network error — try again.'; go.disabled = false; }
  });

  async function showResults(){
    var box = document.getElementById('results');
    box.hidden = false;
    box.innerHTML = '<p class="sub">Loading results…</p>';
    var r = await fetch(base + '/results');
    var d = await r.json();
    box.innerHTML = '<h1 style="font-size:20px">Where everyone landed</h1>' +
      d.results.map(function(x){
        return '<div class="row"><span>' + x.label + '</span><span>' + x.entries +
               ' · ' + x.pct + '%</span></div><div class="bar"><i style="width:' + x.pct + '%"></i></div>';
      }).join('');
  }

  if (${closed ? 'true' : 'false'}) showResults();
</script>
</body></html>`;
}

function notFoundPage() {
  return `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Pool not found — DeadRight</title><style>${CSS}</style></head>
<body><div class="wrap"><div class="brand">DeadRight 🔥</div>
<h1>This pool doesn’t exist</h1>
<p class="sub">The link may be mistyped, or the host deleted the pool.</p>
</div></body></html>`;
}
