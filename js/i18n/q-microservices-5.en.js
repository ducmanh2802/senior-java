/*
 * English translation of js/data/q-microservices.js — task T384. Format: js/core/i18n.js (content overlay).
 * ids: microservices-039 microservices-040 microservices-041 microservices-042 microservices-043
 */
App.i18n.content({
  'microservices-039': {
    q: 'You are operating a multi-tenant SaaS. Compare schema-per-tenant, shared-schema + tenant_id, and PostgreSQL RLS: how do you choose based on scale, cost, and compliance? What about the pitfall of leaking data across tenants due to forgotten tenant filters, and how do you detect it (audit query log + composite index tenant_id, ...)? Also, for schema-per-tenant, how do you handle migrations that cannot be run sequentially (N tenants x M migrations)?',
    a: `**Summary:** There is no one-size-fits-all model: **schema-per-tenant** offers strong isolation, easier compliance, but is expensive and has an N×M migration problem; **shared-schema + tenant_id** is cheap, scales to thousands of tenants, but relies on query discipline; **PostgreSQL RLS** adds a DB-level safety layer to shared-schema, blocking queries that forget filters. Choose based on tenant count, per-tenant scale, compliance needs, and operational budget. Cross-tenant leaks are P0 incidents, so use multiple layers: ORM filters, RLS, indexes starting with tenant_id, audit logs, and automated tests.

### Quick Understanding
**Schema-per-tenant** is like renting **a separate apartment** for each company: total privacy, but you have to go into each one to fix the pipes. **Shared-schema** is like **a shared office with labeled filing cabinets for each company**: cheap, fix once and it's done for everyone, but if an employee grabs the wrong cabinet, you have a leak. **RLS** is like **fingerprint locks on each cabinet**: even if an employee forgets to check the label, the cabinet won't open if it's not their company's.

### Terms
- **Multi-tenant SaaS**: A system serving multiple customers (tenants), where data isolation is mandatory.
- **Schema-per-tenant / DB-per-tenant**: Each tenant gets their own schema (or database).
- **Shared-schema + tenant_id**: Tenants share tables, distinguished by a tenant_id column.
- **RLS (Row-Level Security)**: PostgreSQL feature attaching filter policies to tables, applied to all queries.
- **current_setting / SET LOCAL**: Read / set session configuration; SET LOCAL only lasts for the current transaction.
- **pgaudit**: PostgreSQL extension for auditing SQL statements.
- **Hibernate @TenantId**: Hibernate 6 annotation to automatically add tenant conditions to entities.
- **Noisy neighbor**: A large tenant consuming excessive resources, impacting others.

### The Three Models
| Criteria | Schema-per-tenant | Shared-schema + tenant_id | Shared-schema + RLS |
|---|---|---|---|
| Isolation | Strong (separate schema/DB) | Logical (tenant_id column) | Logical + DB-level policy |
| Infrastructure cost | High (N sets of tables, many connections) | Low | Low–Medium |
| Migration | N × M (Painful) | Once | Once + policy |
| Compliance (SOC 2, HIPAA) | Easy to prove | Must prove via audit logs | DB-level policy, easier to prove |
| Onboard tenant | Create schema + migration | Insert a row | Insert a row |
| Delete tenant | Drop schema | Delete by tenant_id (Heavy) | Same as shared |

### How to Choose
1. **Under ~50 tenants, large enterprise customers, high compliance needs**: schema-per-tenant (or DB-per-tenant): easier backup/restore, delete tenant = drop schema, fulfills "right to be forgotten".
2. **Thousands of small tenants (SMBs)**: shared-schema + tenant_id: single set of tables, single migration pipeline, low cost.
3. **Want shared-schema but need more safety**: enable RLS. Can **combine**: regular tenants on shared-schema, enterprise tenants on separate ones (tiering).

### How RLS Works (Step-by-step)
1. Enable RLS and create a policy on the table.
2. Every transaction, the app sets the current tenant with {{SET LOCAL app.tenant_id = '...'}} (or {{set_config('app.tenant_id', ?, true)}}). Why LOCAL: SET persists for the session in connection pools and would leak into the next request.
3. Every SELECT/UPDATE/DELETE on the table automatically gets the policy's condition added.
4. App must connect using a **role other than the owner** (or enable FORCE), because owners and superusers default to bypassing RLS.

~~~sql
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders FORCE ROW LEVEL SECURITY;          -- Also apply to owner
CREATE POLICY tenant_isolation ON orders
  USING (tenant_id = current_setting('app.tenant_id')::uuid);
-- Forgotten filter query: SELECT * FROM orders WHERE status = 'PENDING'
-- => DB still only returns orders of the current tenant
~~~

### Cross-tenant Leaks: Common Paths
- Query {{SELECT * FROM orders WHERE status = 'PENDING'}} missing {{AND tenant_id = ?}} returns orders of another tenant: the #1 SaaS vulnerability.
- JOINing multiple tables but only filtering by tenant on one of them.
- **Cache key missing tenant**: key {{order:123}} shared, tenant B reads tenant A's cache.
- **Async/Background jobs**: tenant context in ThreadLocal lost when switching threads, query runs with default tenant.

### Detection and Prevention
- PostgreSQL audit logs ({{pgaudit}} or {{log_statement}} in test) + CI scripts to find queries on tenant-scoped tables missing tenant_id.
- **Composite indexes starting with tenant_id**: {{CREATE INDEX idx_orders_tenant_status ON orders(tenant_id, status)}}: faster, and acts as a "leak detector": queries missing tenant_id usually become full scans and show up on slow query dashboards.
- ORM: Hibernate 6 {{@TenantId}} or {{@Filter}} enabled for every session; native queries still need manual checks.
- **Automated tests**: Login as tenant A, call all endpoints, assert no data from tenant B is visible.

### Schema-per-tenant Migrations: The N × M Problem
~~~text
500 tenants × 50 migrations = 25,000 runs; sequential runs take hours,
one failed tenant blocks the entire pipeline
~~~
1. **Track schema_version per tenant** in a tenant table; run migrations in parallel in batches, failed tenants marked for separate handling without blocking others.
2. **Version-compatible code** (expand–contract), so the app works while tenants are on different versions.
3. **Online migration**: {{CREATE INDEX CONCURRENTLY}}; {{ADD COLUMN ... DEFAULT}} (constant) is an instant operation since PostgreSQL 11; avoid long locks.
4. **Tiering**: enterprise tenants run in scheduled maintenance windows; SMBs run in batches. New tenants are always created at the latest version.

### Common Pitfalls
1. **App connects as table owner**. Symptom: RLS is enabled but data from all tenants is still visible. Prevention: separate role for the app or FORCE ROW LEVEL SECURITY.
2. **SET instead of SET LOCAL with connection pools**. Symptom: subsequent requests use the tenant from the previous request. Prevention: SET LOCAL in transaction, or reset when returning to pool.
3. **Policy {{USING (true)}} or fail-open when tenant is missing**. Symptom: leaks all data when tenant variable isn't set. Prevention: error if tenant is missing, don't return anything.
4. **Backup/restore a tenant on shared-schema**. Symptom: want to restore data for one customer, must restore the entire DB. Prevention: have procedures for export/import by tenant_id.

### 1-Minute Interview Answer
"I choose based on scale and compliance. A few dozen enterprise customers requiring strong isolation get separate schema/DB: easy to backup, delete, and prove compliance, but migrations are N×M, so I track version per tenant and run migrations in batches. Thousands of small tenants go on shared-schema with tenant_id, plus PostgreSQL RLS to block queries forgetting filters; the app sets tenant via SET LOCAL and connects as a non-owner role. I use multiple layers: composite indexes starting with tenant_id, Hibernate TenantId, tenant-scoped cache keys, audit logs, and automated 'tenant A doesn't see tenant B' tests for all endpoints."

> Senior tip: Regardless of the model, have automated tests for "tenant A doesn't see tenant B data" running in CI for all endpoints. A cross-tenant leak is a P0 incident and is usually why large customers leave.`,
    follow: [
      'What is the overhead of PostgreSQL RLS compared to app-level filters, and how do you measure it?',
      'When tenant is deleted (right to be forgotten), how do schema-per-tenant vs shared-schema handle it?',
      'How do you enforce tenant filters at the ORM layer (Hibernate @Filter) to ensure they cannot be bypassed?'
    ]
  },
  'microservices-040': {
    q: 'The tenant is disabled/suspended while a request is being processed. Why return 401/403 and not 500? How do you hook this at the filter/gateway, cache tenant config with TTL to avoid exceptions leaking into 500s?',
    a: `**Summary:** A suspended tenant is a **foreseen business state**, not a server error, so return a meaningful code (usually **403**, with an error code like TENANT_SUSPENDED), and do not let exceptions bubble up into **500**. 500 triggers useless client retries, pollutes on-call alerts, and hides real errors. Check tenant status at the **gateway or filter** before entering the controller; cache tenant config with **short TTL + invalidation via events**, and **fail-closed** when status cannot be read.

### Quick Understanding
A company office building has many tenant companies. Company X is **temporarily locked** due to unpaid rent. When an employee of X swipes their card, security must clearly say "**Your company is temporarily locked, contact management**" (403), not scream "**The building is crashing!**" (500) causing panic and calling engineers. Security stands **at the door** (gateway/filter) to block immediately, not letting people into the elevator before discovering the issue. The list of locked companies is **memorized** (cached) by security, but updated immediately when management notifies them (event).

### Terms
- **Tenant**: A customer (company) using the shared SaaS system.
- **401 Unauthorized**: Unauthenticated (missing token, invalid/expired token).
- **403 Forbidden**: Authenticated, but not permitted (tenant suspended, user not in tenant).
- **OncePerRequestFilter**: Spring filter running exactly once per request, even on forward/include.
- **@RestControllerAdvice / ProblemDetail**: Place to map exceptions to HTTP responses; ProblemDetail is the standard RFC 9457 error format, supported by Spring 6.
- **TTL**: Time-to-live for data in cache.
- **Fail-closed / fail-open**: Block / let through if status cannot be checked.
- **Negative cache**: Cache "does not exist" results to prevent DB flooding.

### Why 4xx, not 500
1. **Semantics**: 5xx means "server error, retry might work"; clients, SDKs, and gateways will **retry**, increasing unnecessary load.
2. **Alerting**: 5xx counts towards error SLOs; a suspended tenant could trigger middle-of-the-night false alarms.
3. **UX**: Client receives 403 + clear error code, displaying the right "account temporarily suspended" message.
4. **Security**: 500 stack traces can leak internal information.

### Status Mapping Table
| Scenario | HTTP |
|---|---|
| Missing/invalid/expired token | 401 |
| Tenant SUSPENDED/DISABLED, user not in tenant | 403 (error code TENANT_SUSPENDED) |
| Tenant does not exist | 404 (or 403 to prevent tenant probing, depends on policy) |
| Cannot read tenant status (config service error) | 503 (fail-closed, with Retry-After) |
| Bug, unexpected error | 500 |

### Hooking at Gateway/Filter (Step-by-step)
1. **Resolve tenantId** from subdomain, header, or JWT claim.
2. **Check status** in cache (Caffeine locally or Redis), miss? Ask tenant service.
3. **If not ACTIVE, return 403 immediately**, don't call downstream, don't retry. Why here: block early so no request touches business logic.
4. **Store tenant in context** for the request, and **clear context in finally** so reused threads don't carry old tenant data.

~~~java
@Component
class TenantStatusFilter extends OncePerRequestFilter {
    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {
        String tenantId = resolver.resolve(req);
        TenantStatus st = cache.statusOf(tenantId);        // Short TTL, fail-closed if error
        if (st != TenantStatus.ACTIVE) {
            res.setStatus(HttpStatus.FORBIDDEN.value());     // 403, not 500
            res.setContentType("application/problem+json");
            res.getWriter().write("{\\"code\\":\\"TENANT_SUSPENDED\\"}");
            return;                                          // Don't call rest of chain
        }
        try { TenantContext.set(tenantId); chain.doFilter(req, res); }
        finally { TenantContext.clear(); }                   // Prevent leaking tenant to next request
    }
}
~~~

### Tenant Config Cache
- Status changes rarely but needs fast reflection: TTL 30–60s, key {{tenant:status:<id>}}.
- Admin suspends → publish {{tenant.suspended}} event → instances clear cache immediately (TTL is just a safety net).
- **Fail-closed**: if status cannot be loaded, return 503/403, **don't** default to ACTIVE.
- Negative cache for non-existent tenants, short TTL, to prevent DB flooding from probing.

### Requests In-flight and Service Layer
- Request already in the controller before suspension: usually allowed to finish (short duration); sensitive operations (payments, exports) should re-check status right before execution.
- Service detects suspension mid-request: throw {{TenantSuspendedException}}; {{@RestControllerAdvice}} maps to 403 using ProblemDetail, log at WARN level, not ERROR.
- Metrics: count 403s by tenant to detect abuse or mass mis-suspensions.

### Common Pitfalls
1. **No exception handler for business errors**. Symptom: all exceptions become 500, dashboard lit up red. Prevention: mapping table for exception → status in @RestControllerAdvice.
2. **TTL cache too long, no invalidation**. Symptom: suspended tenant can still be used for 10 minutes. Prevention: short TTL + events.
3. **ThreadLocal tenant not cleared**. Symptom: tenant B's request runs with tenant A's context. Prevention: remove in finally, test with 1-thread pool.
4. **Fail-open when tenant service fails**. Symptom: configuration issue becomes a security vulnerability. Prevention: fail-closed with 503.

### 1-Minute Interview Answer
"A suspended tenant is a business state, not a server error, so I return 403 with a clear error code. 500 triggers useless client retries and false on-call alerts. I block early at the gateway or a OncePerRequestFilter: resolve tenant, check status in cache, if not ACTIVE return 403 immediately and always clear tenant context in finally. The cache uses short TTL plus invalidation events, and fails-closed (503) if status cannot be read. Finally, I map exceptions to 403 in RestControllerAdvice using ProblemDetail. I test suspension mid-request to ensure no 500s occur."

> Senior tip: Write a test for "suspend tenant mid-request" by mocking the tenant service to return ACTIVE then SUSPENDED in the same test, assert the response is 403 and no 500s occur. This is the most commonly missed test case.`,
    follow: [
      'Should tenant status cache be invalidated by events or polling, and why?',
      'When a tenant is suspended, how should in-flight requests (already in the controller) be handled?',
      'Fail-closed vs fail-open for tenant status: what do you choose and why?'
    ]
  },
  'microservices-041': {
    q: 'The idempotency contract for write operations: client-sent idempotency key, TTL, store (Redis + DB fallback), scope based on {tenantId, endpoint, key}. What happens when 2 requests with the same key are concurrent (what to set in-flight to); return 409 vs wait/serialize; pitfall when setting "PENDING" state silently -> double-process.',
    a: `**Summary:** The idempotency contract consists of: client generating an **Idempotency-Key** for each write command; server storing it based on scope {{(tenantId, endpoint, key)}} along with **payload hash**, status, and response, with a **TTL** (e.g., 24h); the store is Redis (fast) with a DB as a durable source. The key point is **atomic claim** (Redis SET NX or unique constraint in DB): when 2 requests arrive simultaneously with the same key, only one is processed; the other receives **409 + Retry-After** (or waits with a limit), while requests arriving after completion receive the **original response**. The classic pitfall: "check then set" the PENDING state; two requests see "none exists" and both run, causing double charging.

### Quick Understanding
You submit documents at a counter, each file has a **ticket number** you write yourself. The counter has a **ticket hook**: whoever hangs ticket #123 on the hook first gets processed; the second person bringing #123 sees the hook already has a ticket and is told "this file is being processed, come back later" (409). When done, the result is attached to the ticket; anyone bringing #123 again receives a **copy of the result**, not re-processing. If someone brings #123 but the content is different, they are refused (422), because the ticket number is being misused.

### Terms
- **Idempotency key**: Unique code generated by the client for a command, sent unchanged upon retry.
- **Scope**: Range for key uniqueness, usually (tenantId, endpoint, key).
- **Atomic claim**: Operation "occupying" a key succeeding for only one request, like Redis {{SET key val NX EX 30}} or INSERT with unique constraint.
- **IN_FLIGHT / COMPLETED / FAILED**: Status of a key: processing / has response / failed but retryable.
- **Lease**: Duration of IN_FLIGHT status; if expired, assume the request died.
- **Payload hash**: Hash of request content to detect same key but different content.
- **409 Conflict / 422 Unprocessable Content**: Request with same key is processing / same key but different payload.
- **Write-through**: Writing to both cache and durable store in the same flow.

### Idempotency Contract
1. **Client** generates UUID for each write command, sends in header {{Idempotency-Key}}; retry sends **the same key**. Why client generates: only client knows two submissions are the "same intent".
2. **Scope** {{(tenantId, endpoint, key)}}: same key at different endpoints or different tenants is a different command, and this tenant cannot "guess keys" to read another tenant's response.
3. **TTL** 24h (or per business logic, longer than client retry window); beyond TTL treat as a new command.
4. **Store**: Redis for speed and TTL; for money-related commands, write durable record to DB **in the same transaction** as business write, so Redis data loss doesn't lose the idempotency track.

### Processing Flow and Concurrency (Step-by-step)
1. **Claim**: {{SET idem:<tenant>:<endpoint>:<key> IN_FLIGHT NX EX 30}} or {{INSERT ... ON CONFLICT DO NOTHING}}. Success means this request "owns" the key.
2. **Claim fails**, read current status:
   (a) IN_FLIGHT → return **409** with {{Retry-After}}, or wait (poll) for a few seconds and return result if finished.
   (b) COMPLETED → hash payload: if match return **correct status + body saved**; if mismatch return **422**.
   (c) FAILED (retryable error) → allow re-claiming.
3. **Perform side effect** (only key owner).
4. **Save response**, switch COMPLETED, set long TTL.
5. **Lease expires** (process died while IN_FLIGHT): next request can re-claim; therefore downstream side effect must also be idempotent (e.g., pass key to payment gateway).

~~~text
t=0ms   req A key=K ── SET NX ──► OK (IN_FLIGHT)  ──► charge ──► COMPLETED + response
t=5ms   req B key=K ── SET NX ──► FAIL, see IN_FLIGHT ──► 409, Retry-After: 1
t=900ms req C key=K ── SET NX ──► FAIL, see COMPLETED ──► return response of A
WRONG:  A: GET K → null; B: GET K → null; A: SET PENDING; B: SET PENDING → both charge!
~~~

### Payload Mismatch and Errors
- Same key, different payload → 422; never silently run or return old response.
- Validation errors (4xx) can be saved as COMPLETED (subsequent retries return same error); temporary errors (5xx, downstream timeout) should be marked FAILED to allow client retries.

### Consumer Idempotency (Events)
- Consumer uses table {{processed_msg(msg_id PK)}} insert in same transaction as business write.
- msg_id is **event ID** generated by producer (do not use Kafka offset, because replay/topic recovery changes offsets).

### Common Pitfalls
1. **Check-then-set** instead of atomic claim. Symptom: occasionally double-charged when user double-clicks. Prevention: SET NX or unique constraint.
2. **TTL shorter than retry window**. Symptom: client retries after 2 hours, key expired, command runs a second time. Prevention: TTL longer than max retry duration.
3. **Retry at multiple layers** (client + framework + broker). Symptom: amplification of duplicates, dedup table bloats. Prevention: one primary retry layer, all layers use same key.
4. **Side effects outside DB** (calling 3rd party API) before dedup flag commits. Symptom: crash between steps, retry causes double-charge in reality. Prevention: pass idempotency key to 3rd party, or set PENDING before calling, reconcile later.

### 1-Minute Interview Answer
"The idempotency contract: client generates Idempotency-Key for each write; server stores by scope tenant, endpoint, key, plus payload hash, status, and response, with a 24-hour TTL. The critical part is atomic claim via Redis SET NX or unique constraint: only one request is processed. Concurrent requests with same key while IN_FLIGHT receive 409 with Retry-After; when COMPLETED, they receive the original response; mismatched payloads receive 422. For money commands, I record durable state in DB in the same transaction and pass the key to the payment gateway. The classic error is 'check then set' PENDING, where both requests see empty state and both proceed."

> Senior tip: The idempotency key is a "contract" between client and server: clearly document scope, TTL, behavior when IN_FLIGHT, and when payloads mismatch. Without documentation, clients won't know how to retry correctly.`,
    follow: [
      'Should idempotency key be stored in Redis or DB, and why?',
      'If the side effect is calling a 3rd party REST API without idempotency support, what do you do?',
      'Offset commit before or after processing? What are the trade-offs of each choice?'
    ]
  },
  'microservices-042': {
    q: 'Partial success on deletion: API deleting records dependent on multiple sources (DB + object store + downstream), user wants to "delete in batch"; orchestration strategy: mark-for-delete + saga compensating; return 207 Multi-Status with individual status per id; auditable; differentiate 409 when locked; avoid "silent partial deletion" then cron cleanup orphan duties.',
    a: `**Summary:** Deleting a record with data in multiple places (DB + object store like S3 + downstream services) **cannot be atomic**. The approach: **mark-for-delete** (soft delete, status PENDING_DELETE) in the DB first, then an orchestrator/saga deletes each source with retry, idempotency, DLQ, and audit; only **hard delete** when all sources are gone. For batch deletion, return **207 Multi-Status** with individual status **per id** (or 202 if async), use **409** for ids still locked/constrained. Avoid "silent partial deletion" hoping for cron cleanup.

### Quick Understanding
You check out of a hotel: you must return the key (DB), clear the safe (object store), and notify the kitchen to cancel breakfast (downstream). You cannot do all three **at the same time**. The correct way: the receptionist **marks "checking out"** immediately (mark-for-delete) to prevent new bookings, then performs each task sequentially; if any task fails, retry, and every step is recorded in the ledger. Only when all are done is the room removed from the system. If you check out 5 rooms at once, the receptionist must provide **an itemized list for each room**: which finished, which is still locked due to unpaid minibar (409).

### Terms
- **Soft delete / mark-for-delete**: Mark record as deleted (deleted_at, status) instead of immediate physical deletion.
- **Hard delete**: Physically remove data from storage.
- **Saga / orchestrator**: Chain of steps with state tracking, retry, and compensating actions on failure.
- **207 Multi-Status**: HTTP status code (from WebDAV, RFC 4918) reporting response contains individual results for multiple elements.
- **202 Accepted**: Request received, will process asynchronously.
- **409 Conflict**: Request conflicts with current state (locked, business constraint).
- **Orphan**: Data orphaned, e.g., file on S3 no longer referenced by any DB record.
- **Audit trail**: Ledger of who did what, when, and result, immutable.

### Orchestration Strategy (Step-by-step)
1. **Validate**: does the id exist, is it deletable, are there business constraints (e.g., order not yet shipped)? If constrained, 409 for that id, do nothing else. Why validate first: 409 is a business error, retrying doesn't help.
2. **Mark-for-delete** in DB: {{status = 'PENDING_DELETE', deleted_at = now()}}, with audit log and create "delete job" in the same transaction (outbox). User sees "deleted" immediately; regular queries filter this out.
3. **Delete each source**: object store (delete by key, idempotent: deleting an already-gone object is success), then call downstream with idempotency key. Each step's status is tracked.
4. **Retry with backoff** for transient errors; exceed limit? DLQ + alert, record remains DELETE_FAILED for manual intervention.
5. **Hard delete** row in DB (or after a recovery window, e.g., 30 days) when all sources are confirmed gone.
6. **Compensation**: only reversible steps can be compensated (unmark if no source deleted yet); deleting a file isn't "recoverable", so the main strategy is **continue by retry**, not rollback.

~~~text
DELETE /files (batch a1..a4)
a1: validate ✓ → PENDING_DELETE → S3 ✓ → search-index ✓ → hard delete   => 200
a2: validate ✓ → PENDING_DELETE → S3 ✓ → search-index ✗ (background retry) => 202
a3: validate ✗ locked by order #123                                       => 409
a4: not found                                                             => 404
Total: 207 Multi-Status
~~~

### 207 Multi-Status for batch
~~~json
{
  "results": [
    {"id": "a1", "status": 200, "message": "deleted"},
    {"id": "a2", "status": 202, "message": "db marked, search index pending"},
    {"id": "a3", "status": 409, "message": "locked by order #123"},
    {"id": "a4", "status": 404, "message": "not found"}
  ]
}
~~~
- 207 means "see individual results"; client **must** process each entry, do not assume all-or-nothing.
- If the entire batch processes asynchronously, return **202** + link to track job.

### HTTP Status per Result
| Result | Status | When |
|---|---|---|
| All sources deleted | 200/204 | synchronous success for all |
| Received, background deletion | 202 | background steps remain |
| Mixed results in batch | 207 | mixed success/fail ids |
| Constraint/locked | 409 | business error, don't retry |
| Not found | 404 (or 204 if API treats delete as idempotent) | varies by API convention |
| Downstream unavailable | 503 | transient error, with Retry-After |

### Auditable
- Audit log: who deleted, when, which id, result per source; required for financial/medical data and GDPR.
- Hard delete only after all sources are done (and recovery window if any); audit log itself doesn't contain already-deleted personal data.

### Common Pitfalls
1. **Silent partial deletion**. Symptom: DB deleted, file still on S3 costing money and violating deletion requests. Prevention: mark-for-delete + track each step + alerts.
2. **Cron cleanup as primary strategy**. Symptom: audit trail broken, orphan data piles up, not knowing who deleted what. Prevention: cron is safety net, not orchestration replacement.
3. **Return 200 with failed ids**. Symptom: UI says "deleted 5 items" but 2 still exist. Prevention: 207 + per-id detail.
4. **Retry for 409**. Symptom: job loops endlessly on constrained records. Prevention: differentiate business vs transient errors.

### 1-Minute Interview Answer
"Deletion in DB, S3, and downstream cannot be atomic, so I use a saga-like pattern. First, validate; if constrained, return 409 for that id. Then mark PENDING_DELETE and write audit/delete-job in one transaction—user sees 'deleted' immediately. Orchestrator deletes each source with idempotency, retry-backoff, and DLQ/alert; once all confirmed, hard delete occurs. Since file deletion isn't 'undoable', the strategy is retry-to-success, not rollback. For batches, I return 207 with status per id, or 202 if async. Cron cleanup is just a safety net, not the primary strategy."

> Senior tip: For batch delete, always return 207 with individual results instead of 200 'OK' if there's any error. The client (and user) must know exactly what was deleted and what wasn't: "silent success" is the most serious bug of a delete API.`,
    follow: [
      'Mark-for-delete vs hard delete: when to switch from soft to hard?',
      'Saga compensating for delete: if compensation (restore) also fails, what do you do?',
      'Should cron cleanup orphans be the main strategy, why?'
    ]
  },
  'microservices-043': {
    q: 'The decision topic represents "server has authority": user calls delete n-fail but server returns 200 when only 1 fails is a bug; provide HTTP status table for individual results (207/200/409/500), unified envelope error code with detail[].',
    a: `**Summary:** "Server has authority" means **the server decides and returns a status code reflecting the truth**, the client should not guess from the body. Deleting N items where one fails but returning **200** is a bug. Convention: all successful → 200/204; mixed results → **207** with individual results; business constraint violation → **409**; transient server/downstream error → **503/500**. All errors use **a unified envelope** (e.g., following ProblemDetail, RFC 9457) with an array {{detail[]}} listing each id, status, and reason.

### Quick Understanding
You ask the post office to send 5 parcels. The clerk says "**OK, done!**" (200) but actually 1 parcel was returned due to an invalid address. You go home relieved, only discovering the issue days later. A civilized post office gives **a receipt for each parcel** (207 + detail): 4 parcels sent, 1 rejected due to address (409), and if the entire delivery system is crashing, they say straight up "we can't send anything today, come back tomorrow" (503). Status code is **the line printed in big letters on the receipt**: the client's software reads this line first to decide whether to retry.

### Terms
- **Status code**: 3-digit HTTP response code, grouping 2xx success, 4xx client errors, 5xx server errors.
- **207 Multi-Status**: Response containing individual results for elements of a batch request.
- **409 Conflict**: Request conflicts with current state (locked, dependent).
- **503 Service Unavailable**: Temporarily unable to serve, usually with Retry-After.
- **Error envelope**: Unified JSON structure for all API errors.
- **ProblemDetail (RFC 9457)**: Standard JSON for HTTP errors (type, title, status, detail, instance + extension fields); natively supported by Spring 6.
- **Retryable**: Error where retrying might succeed (usually 429, 503); 4xx business errors should not be retried.

### "Server has Authority" Principles
1. **Status code is the contract**: HTTP client, gateway, retry policies, and monitoring rely on status codes, not the body. Returning 200 with {{"errors": [...]}} makes components think it was a success. Why dangerous: no retry, no alert, data silently deviates.
2. **200 only if all operations succeed.** If any item fails, it cannot be 200.
3. **Differentiate business vs transient errors**: 409 (don't retry) is different from 503 (retry later). Returning 500 for business conflicts causes clients to retry uselessly, increasing load.
4. **Always include per-item details** so the client doesn't need to re-query everything.

### Status Mapping for Delete Batch
| Scenario | HTTP | Body |
|---|---|---|
| All deleted successfully | 200 (with body) / 204 (no body) | {"deleted": N} or empty |
| Mixed success/failure | 207 | {"results": [...]} per id |
| Request constrained (e.g., all ids locked) | 409 | envelope + detail[] |
| All ids not found | 404 (or 204 if API treats delete as idempotent) | envelope |
| Downstream unavailable, nothing deleted | 503 | envelope + Retry-After |
| Unexpected error (bug) | 500 | envelope, no stack trace |

Rule of thumb: **everyone shares same result → use status of that result; mixed results → 207**, and the true status of each item is inside detail.

### Unified Error Envelope
~~~json
{
  "type": "https://api.example.com/errors/partial-failure",
  "title": "Partial failure",
  "status": 207,
  "detail": "3/5 deleted",
  "items": [
    {"id": "a1", "status": 200, "message": "ok"},
    {"id": "a2", "status": 409, "code": "LOCKED", "message": "locked by order #123"},
    {"id": "a3", "status": 503, "code": "DOWNSTREAM_UNAVAILABLE", "retryable": true}
  ]
}
~~~
- Detail array (here {{items}}, many teams name it {{detail[]}}) is present in all batch error responses.
- Each item has a **machine-readable error code** and a retryable flag, so the client doesn't have to parse strings.

### Implementation in Spring (Step-by-step)
1. Service returns results per id (record {{ItemResult(id, status, code, message)}}).
2. Controller calculates total status by the rules above and returns {{ResponseEntity.status(...)}}.
3. Unexpected exceptions are mapped to ProblemDetail 500 by {{@RestControllerAdvice}}, logged as ERROR; business errors map to 4xx, logged as WARN.

~~~text
5 ids: a1 ok, a2 locked, a3 ok, a4 ok, a5 downstream timeout
status per item: 200, 409, 200, 200, 503  → mixed → HTTP 207
client: delete a1,a3,a4 from UI; report a2 locked; auto-retry a5 after Retry-After
~~~

### Common Pitfalls
1. **Return 200 with error list in body**. Symptom: monitoring green but users complain items not deleted. Prevention: 207 or actual error status.
2. **500 for business conflicts**. Symptom: client continuously retries, 5xx alerts false positive. Prevention: 409 with clear code.
3. **No per-item detail**. Symptom: client has to re-query to guess what remained. Prevention: always return detail by id.
4. **Different error body format per endpoint**. Symptom: frontend needs a custom parser per API. Prevention: unified envelope per ProblemDetail.

### 1-Minute Interview Answer
"Server has authority means the status code reflects the truth, because HTTP client, retry policy, and monitoring rely on it. Returning 200 when 1 of 5 items fails is a bug: no retry, no alert, silent failure. Convention: all successful → 200/204; mixed → 207 with details; business conflict → 409, no retry; downstream temporary error → 503 with Retry-After. I use a unified envelope following ProblemDetail, containing a details array with id, status, machine code, and retryable flag. I lock this convention with contract tests for status codes."

> Senior tip: Write contract tests for status codes, e.g., "5 ids, 1 locked, 1 not found, 3 valid → expect 207 with 5 detail items". Test this is cheap but catches huge regressions.`,
    follow: [
      'When to return 202 Accepted instead of 207 for delete batch?',
      'How should the client process 207 for best UX?',
      'Should error envelope be used for success responses?'
    ]
  }
});