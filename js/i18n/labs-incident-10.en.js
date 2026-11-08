/*
 * English translation of js/data/labs-incident.js — task T1012. Format: js/core/i18n.js (content overlay).
 * ids: lab-incident-025 lab-incident-026
 */
App.i18n.content({
  'lab-incident-025': {
    title: `AI-built startup app: user A sees user B's orders`,
    scenario: `**Context (terminology explained):**
- **Small startup** (a small early-stage company) builds its own sales app using AI code-generation tools. The app consists of: **Next.js** (a React web framework — runs both the user interface in the browser and server-side code), **Supabase** (a "backend-as-a-service" platform providing **PostgreSQL** — a relational database that stores tables — plus login/authentication), deployed on **Vercel** (a cloud platform that runs web apps — servers outside the Internet).
- The app has about **4.800 real users**. You are a **freelancer** (an independent contractor hired short-term) to investigate.

**Symptoms:** On the morning of 03/11/2026, support received 19 complaint tickets: some users opening "My Orders" see **another user's orders, address, and phone number**. After the user changes the {{order_id}} in the browser address bar (e.g. from {{/orders/18421}} to {{/orders/18422}}), the server still returns the order data (HTTP 200) instead of rejecting it.

**Data collected:** Server HTTP logs, the route handler (server-side code, written in **TypeScript** — JavaScript with type declarations), and the result of a query checking table security configuration in PostgreSQL.`,
    questions: [
      'What is the root cause — the real underlying cause, not just surface symptoms — behind users seeing other users\' orders? Cite evidence point by point from the artifacts.',
      'Why is combining "using the service role key" + "RLS off" + "no ownership check in code" dangerous? Explain each component for beginners.',
      'How would you handle it: short term (stop the leak immediately), long term (redesign for safety), how to verify with 2 accounts, and how should the incident be communicated?'
    ],
    hints: [
      'Look at the logs: requests already identify the user_id (logged in) but changing order_id still returns 200. Compare with code: which column does the query filter by, and which condition is missing?',
      'RLS (Row Level Security) is a "barrier" at the database layer: if turned on with a policy "only view your own rows", then even if the code forgets to filter, the DB still blocks. The service role key goes through the back door to bypass that barrier. All three defense layers are broken — what happens?',
      'Verification: use account A to create/get an order_id, then use account B\'s login session to call GET with the same order_id — before the fix it must return 200 (the hole), after the fix it must return 403 or 404. Personal data leaks (address, phone number) usually require an incident notification process.'
    ],
    answer: `**Summary:** The data leak is caused by **all three defense layers broken at once**: (1) the route handler queries orders only by {{id}} from the URL **without checking whether the order belongs to the logged-in user** (this is the **IDOR — Insecure Direct Object Reference** vulnerability, roughly: guessing/changing the identifier in the URL lets you view someone else's resource); (2) **RLS** (Row Level Security — a PostgreSQL mechanism that limits each row to users meeting a condition) is **off** with no policy at all; (3) the code uses the **service role key** (Supabase's highest-privilege key, bypasses RLS). So any logged-in user only needs to change {{order_id}} to read another user's order, address, and phone number. The fix: block immediately with an ownership check + enable RLS/policy, verify with 2 accounts, and communicate the data-leak incident.

### Terminology explained (for beginners)
- **IDOR (Insecure Direct Object Reference):** the application uses a code directly provided by the user (here {{order_id}} in the URL) to fetch data **without checking ownership**. Real-life example: a hotel front desk hands you a key just because you read the room number, without asking whether you are the guest of that room — reading another room number lets you open another room.
- **RLS (Row Level Security):** a PostgreSQL feature. When enabled, you write a "policy" such as "each row in table {{orders}} is returned only if the row's {{user_id}} equals the logged-in user's id". The DB filters automatically, so even if the code forgets to check, data does not leak.
- **Service role key:** Supabase's "master key", **bypasses every RLS**. Used when you need server-side admin tasks, but extremely dangerous if relied upon for queries on behalf of end users.
- **Anon key:** restricted key, respects RLS — suitable for queries tied to a logged-in user.

### Inner mechanism — why the leak occurs
Request processing flow:
1. The user (logged in, valid session) calls {{GET /api/orders/18422}}. The server knows this is {{user_id = U-102}} (alice) — the log clearly records {{user_id=U-102}}.
2. The route handler takes {{orderId = "18422"}} from the URL and runs the query: {{select ... from orders where id = 18422}}. **No condition {{and user_id = U-102}}**.
3. The query runs via a client created from {{SUPABASE_SERVICE_ROLE_KEY}} (high privilege, bypasses RLS). Table {{orders}} has {{relrowsecurity = f}} (RLS off) and no policy. So the DB returns row id 18422 (actually belonging to {{U-205}}) without being blocked at any layer.
4. The handler returns {{200}} with all data (name, phone number, address, items). The attacker just needs to loop over other {{order_id}} values (sequential enumeration) to collect data in bulk.

### Evidence (quoted from artifacts)
- {{access-log-2026-11-03.txt}}: {{req=8f2a2 user_id=U-102 GET /api/orders/18422 200}} with comment "order 18422 belongs to U-205"; {{req=8f2b1 user_id=U-205 GET /api/orders/18421 200}} (U-102's order). No 401/403 when swapping.
- {{app-api-orders-[id]-route.ts}}: creates client with {{SUPABASE_SERVICE_ROLE_KEY}} (comment "BYPASS every Row Level Security"); query {{.eq('id', orderId).single()}} — **missing** {{.eq('user_id', currentUserId)}}. Returns {{200}} with raw {{data}}.
- {{postgres-rls-check.sql.txt}}: tables {{orders}}, {{order_items}}, {{customers}} all have {{relrowsecurity = f}} (RLS off). Query {{pg_policies}} returns {{(0 rows)}} — no policy.
- {{vercel-env-config.txt}}: confirms {{SUPABASE_SERVICE_ROLE_KEY}} exists (high privilege). Using it on the server is acceptable by location, but **must not replace** ownership checks and RLS.

### How to fix

**Short term (stop the leak immediately, do within the first hours):**
1. Add ownership check in the route handler: get the current user from the login session (session/JWT), then filter {{.eq('id', orderId).eq('user_id', currentUser.id)}}. If it doesn't match, return **403 Forbidden** (logged in but no permission) or **404 Not Found** (does not reveal whether the order exists — usually safer).
~~~text
// illustration logic (TypeScript, runs on the server)
const user = await getUserFromSession(req);        // determine the logged-in user
if (!user) return Response.json({ error: 'unauthorized' }, { status: 401 });
const { data } = await supabase
  .from('orders').select('id, user_id, ...')
  .eq('id', orderId).eq('user_id', user.id).single();  // must match owner
if (!data) return Response.json({ error: 'not found' }, { status: 404 });
~~~
2. Review **every** endpoint that fetches data by id ({{/api/orders/[id]}}, {{/api/order-items/[id]}}, {{/api/customers/[id]}}) — the same mistake often repeats across routes (AI-generated code often skips the permission check step).
3. Revoke abnormal sessions if bulk enumeration is detected; check logs to estimate the scope of data viewed.

**Long term (multi-layer defense — "defence in depth"):**
1. **Enable RLS and create policies** on tables containing user data, so the DB itself becomes the last line of defense:
~~~sql
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY orders_owner_select ON orders
  FOR SELECT USING (user_id = auth.uid());  -- only returns rows of the logged-in user
~~~
   Do the same for {{order_items}}, {{customers}}. Enable {{relforcerowsecurity}} too if the table owner also needs to be bound.
2. For queries on behalf of end users, prefer **anon key + user session JWT** (so RLS recognizes {{auth.uid()}}). Use the service role key only for separate background admin tasks (cron, migration), not in routes serving users.
3. **Automated authorization testing:** write a test "account B accessing account A's resource must be rejected" for every endpoint; add to CI (runs automatically on every code change).
4. Avoid easily guessable sequential identifiers ({{18421, 18422}}) for sensitive resources if possible; consider UUID — but **UUID does not replace authorization checks**, it only makes enumeration harder.
5. Code review process: every query by user-supplied id must have an ownership condition or be protected by RLS.

**Verification with 2 accounts (mandatory before closing the incident):**
- Prepare account A (having {{order_id = X}}) and account B.
- Before fix: use session B to call {{GET /api/orders/X}} → observe **200** with A's data (confirms the hole).
- After fix: use session B to call {{GET /api/orders/X}} → must return **403** or **404**; use session A to call {{X}} itself → still **200** (does not wrongly block the owner). Repeat with other endpoints.

**Incident notification:**
- This is a **personal data** leak (name, phone number, address). Activate the incident response process: determine the **scope** (logs show how many {{order_id}} values were accessed across users, during what time period), the **level** (which data fields were exposed), preserve evidence (read-only logs), coordinate with legal/security to notify per applicable regulations and transparently inform affected users. (The exact level depends on applicable law; do not speculate beyond available data.)

> Senior tip: IDOR + RLS-off holes are very common in "AI-built fast" apps: code runs the happy path but forgets authorization checks. Remember the **multi-layer defense** principle — (1) code always checks ownership, (2) DB enables RLS as the final lock, (3) high-privilege keys (service role) are not used for queries on behalf of users — and write automated authorization tests so the bug does not return.`,
    rubric: [
      'Correctly state the root cause: IDOR (querying by id from URL without checking ownership) combined with RLS off and service role key use; evidence from logs (changing order_id still 200), code (missing user_id condition, uses service role), and RLS query (relrowsecurity = f, 0 policies).',
      'Can explain the role of each component (IDOR, RLS/policy, service role key/anon key) and why data leaks when all multi-layer defenses are broken.',
      'Propose short-term fixes (ownership check, return 403/404) and long-term ones (enable RLS + policy, restrict service role use, automated authorization testing/CI).',
      'Can state 2-account verification (B cannot view A\'s resources) and mention notification/response to personal data leaks with scope based on logs.'
    ]
  },
  'lab-incident-026': {
    title: `AI-built startup app: LLM API bill jumps ~40x in 3 days`,
    scenario: `**Context (terminology explained):**
- The same startup as the previous item has a customer support chat feature using an **LLM** (Large Language Model — a large language model, e.g. ChatGPT-style, receives text and generates a text response). The app calls the **LLM API** (LLM service over the network, charged by usage — usually by the number of **tokens**, roughly a "word unit" the model reads/writes).
- Architecture: **Next.js** on **Vercel**. The LLM-calling code was originally AI-generated and placed on the **client** (running in the user's browser).

**Symptoms:** Over 3 days (01–03/11/2026) the LLM API bill jumped **~40x** compared to the previous week (from ~22 USD/day to ~890 USD/day). Real users did not increase correspondingly. No budget alert (budget alert — notification when spend exceeds a threshold) was configured.

**Data collected:** Hourly usage statistics table, request log to endpoint {{/api/chat}}, client code revealing how the API is called, and current limit configuration.`,
    questions: [
      'What is the root cause behind the LLM API bill jumping ~40x? Cite evidence from each artifact (time of increase, request pattern, API key location, missing controls).',
      'Why is putting the API key in variable {{NEXT_PUBLIC_*}} and calling LLM directly from the browser dangerous? Explain for beginners how the key gets exposed and abused.',
      'How would you handle it: immediate blocking action in the first hours, redesign for safety (call via server, authentication, rate limit per user/IP, token/prompt caps, budget & alerts), and how to prevent recurrence?'
    ],
    hints: [
      'Look at usage: from 01/11, peak hours have ~500 requests/hour but only 5-7 IPs and authed_requests = 0. The log shows the same IP calling every ~2 seconds, anonymous, completion_tokens always 2048. Is this real user traffic or automated abuse traffic?',
      'Variable {{NEXT_PUBLIC_*}} in Next.js is bundled into the JavaScript sent down to the browser: open the Network/Source tab and you see it. Anyone with the key calls the LLM API with your key, and you pay. Calling from the browser also means you cannot control speed, identity, or token count.',
      'Block immediately: revoke (rotate) the exposed key and issue a new key placed only on the server. Long term: move the LLM call into a server-side route handler (check login), add rate limit per user and per IP, set {{max_tokens}} and prompt length caps on the server, configure budget + cost alerts.'
    ],
    answer: `**Summary:** The bill spiked because the **LLM API key was exposed on the client side** (placed in variable {{NEXT_PUBLIC_*}} and LLM called directly from the browser), so anyone who gets the key can call the LLM and **you get charged**; at the same time the endpoint **does not require login** and has **no rate limit/token cap/budget alert**, so a small group of IPs (5-7) sent automated traffic (bot/script) continuously (~every 2 seconds, always hitting the 2048 token cap) and drove cost from ~22 USD/day up to ~890 USD/day. Handling: **rotate (revoke) the key immediately**, move the LLM call to the server, require authentication, add rate limits and token/prompt caps, set budget + alerts.

### Terminology explained (for beginners)
- **LLM (Large Language Model):** a large language model, receives input text (prompt) and generates a text response.
- **LLM API & token:** you call the LLM over the network (API) and pay by usage, usually by **token** (a word unit; 1 English word ~1-1.5 tokens, Vietnamese usually costs more). Long prompt + long response (large {{max_tokens}}) = costs more money.
- **API key:** a secret string used like a "key" to call the service; whoever holds the key can call, and the key owner gets charged.
- **{{NEXT_PUBLIC_*}} (Next.js):** environment variables with this prefix are **embedded into the JavaScript code sent down to the browser** — the user opens Developer Tools (Network/Source tab) and can read them. So **never** put secrets (paid API key, service role key) in {{NEXT_PUBLIC_*}}.
- **Client vs server:** client = code running on the user's browser (not controllable by you); server = code running on your server (you control it, can keep secrets and set rules).
- **Rate limit:** speed cap, e.g. "each account max 20 requests/minute, each IP max 30 requests/minute" to block abuse.
- **Rotate key:** revoke the old key (disable it) and issue a new one, so someone who leaked the old key can no longer use it.

### Inner mechanism — why money gets "burned"
1. **Key exposed:** {{NEXT_PUBLIC_LLM_API_KEY}} is embedded in the bundle sent down to the browser ({{src-app-chat-page.tsx}} calls {{https://api.llm-provider.example/...}} directly with header {{Authorization: Bearer ...}}). Anyone opening the page, viewing source/Network can get the key (or an attacker has already extracted it).
2. **No barriers:** {{/api/chat}} for {{anonymous}} (not logged in), no rate limit per user/IP, client sets {{max_tokens: 2048}} itself, no prompt limit, no budget/alert ({{config-and-guardrails.txt}} all NO).
3. **Automated abuse:** someone uses a key/script from a few IPs (5-7) sending requests continuously ~every 2 seconds, nearly identical long prompts, always taking the max 2048 token output. Each request costs many tokens → cost multiplies. Evidence: {{llm-usage-by-hour.csv}} from 01/11 peak hours ~380-560 req/hour, {{unique_ips}} 5-7, {{authed_requests = 0}}; {{vercel-function-log-api-chat.txt}} shows {{203.0.113.77}} repeating densely, {{user=anonymous}}, {{completion_tokens=2048}}.
4. Since there is no budget alert, the 40x increase was only detected when looking at the bill.

### Evidence (quoted from artifacts)
- {{llm-usage-by-hour.csv}}: 31/10 ~50 req/hour, ~1.1 USD, 31 IPs, all authed. From 01/11: 410-560 req/hour, 25-38 USD/hour, only 5-7 IPs, {{authed_requests = 0}}. Total 01–03/11 ~890 USD/day vs ~22 USD/day before (~40x).
- {{vercel-function-log-api-chat.txt}}: {{ip=203.0.113.77}} (and several other IPs) calls {{POST /api/chat}} every ~2 seconds, {{user=anonymous}}, {{prompt_chars ~4200}}, {{completion_tokens=2048}} fixed.
- {{src-app-chat-page.tsx}}: runs {{'use client'}} (browser), calls the LLM provider directly with {{process.env.NEXT_PUBLIC_LLM_API_KEY}} and {{max_tokens: 2048}} — key exposed on client.
- {{config-and-guardrails.txt}}: authentication NO, IP/user rate limit NO, server-side max_tokens/prompt cap NO, budget/alert NO, key located in {{NEXT_PUBLIC_LLM_API_KEY}}.

### How to fix

**Short term (block immediately, within the first hours — goal: stop the "money bleed"):**
1. **Rotate the LLM key immediately:** on the LLM provider's management page, **revoke/disable** key {{sk-test-REDACTED...}} (the exposed key) and create a new one. The new key is **placed only in server-side environment variables** (WITHOUT the {{NEXT_PUBLIC_}} prefix), e.g. {{LLM_API_KEY}} on Vercel (server-only).
2. **Turn off the direct client call:** remove the direct LLM-provider call block in {{page.tsx}}. If there's no time to rewrite yet, temporarily disable/limit the chat endpoint to block abuse.
3. **Temporarily** enable emergency blocking: block abusive IPs (per the log) at the Vercel/firewall layer; if the provider supports it, set a hard spend limit immediately.
4. Check that the old key no longer exists in public source code, commit history, or already-built bundles; re-scan other {{NEXT_PUBLIC_*}} secrets.

**Long term (redesign for safety):**
1. **Move the LLM call to the server (mandatory):** the browser only calls your own route handler (e.g. {{POST /api/chat}} on the server). The route handler keeps {{LLM_API_KEY}} on the server, then calls the LLM provider. The key never leaves the server.
2. **Authentication:** require users to log in to use chat ({{user}} attached with an identity), or at least an anti-abuse mechanism for guests.
3. **Rate limit:** apply **per user/account** (e.g. 20 req/minute, 200 req/day) and **per IP** (block bots). Return code **429 Too Many Requests** (too many requests) when exceeding the threshold.
4. **Token and prompt caps on the server (do not trust the client):** set a {{max_tokens}} cap (e.g. 512 instead of 2048 for short support), limit prompt length, reject abnormal content. Cost is proportional to tokens, so a token cap is a direct cost-reduction lever.
5. **Budget and alerts:** configure cost alert/budget at the LLM provider and monitoring system (e.g. alert when exceeding 50 USD/day, 150 USD/day); set a hard spend limit if available. Alert on "abnormal growth rate" (N times the baseline) for early detection.
6. **Observability:** logs tagged with {{user_id}}, IP, token count, time; dashboard tracking cost/requests/tokens per hour to spot anomalies.

**Prevention:**
- Rule: **every paid secret** (LLM API key, service role key, payment secret) only on the server, **never** {{NEXT_PUBLIC_*}}, never committed to source code. Use automatic checks (secret scanning) in CI.
- Review design before production: a money-spending endpoint must have authentication + rate limit + cost cap.
- Test: simulate sending many requests to confirm rate limit and 429 work.

~~~seq
title: Before (unsafe) vs After (safe)
actors: Browser | Server | LLM
Browser -> LLM: (BEFORE) direct call with API key exposed in NEXT_PUBLIC_*
note Browser..LLM: key exposed, no rate limit, anyone can call
Browser -> Server: (AFTER) POST /api/chat (logged in)
Server -> Server: check user + rate limit + token cap
Server -> LLM: call with LLM_API_KEY on server only
LLM --> Server: response (token limited)
Server --> Browser: return result
~~~

> Senior tip: For features using pay-per-call/token APIs, treat "who is called, how many times, how much it costs" as a security requirement from day one — key on the server-side, mandatory authentication, rate limit and token cap on the server, plus budget and alerts. AI-built fast apps often paste the key into {{NEXT_PUBLIC_*}} to "make it work", and that's how the bill jumps tens of times in just one night.`,
    rubric: [
      'Correctly state the root cause: LLM API key exposed on client (NEXT_PUBLIC_*, called directly from browser) leading to abuse, combined with missing authentication, missing rate limit, and missing token cap/budget; evidenced by usage (increase from 01/11, few IPs, authed_requests=0, ~40x), log (repeating IP, anonymous, completion_tokens=2048) and code/config (NEXT_PUBLIC_LLM_API_KEY, guardrails all NO).',
      'Clearly explain why {{NEXT_PUBLIC_*}} is exposed in the browser and why calling LLM from the client lets the key be taken and used to charge the key owner (suitable for beginners).',
      'Propose immediate blocking actions: revoke/rotate the exposed key, move key to server-only, turn off direct call/block IP/temporarily limit endpoint.',
      'Propose long-term design/prevention: call LLM via server, authentication, rate limit per user/IP (429), {{max_tokens}}/prompt length cap on server, budget + cost alerts, and never put paid secrets in {{NEXT_PUBLIC_*}} / secret scanning.'
    ]
  }
});
