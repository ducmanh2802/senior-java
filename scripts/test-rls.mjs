#!/usr/bin/env node
/*
 * Row Level Security attack tests for supabase/schema.sql, run on PGlite (real Postgres in WASM).
 * Emulates Supabase defaults (anon/authenticated get ALL on public tables) so only RLS + REVOKEs protect data.
 *   npm run test-rls
 */
import { PGlite } from '@electric-sql/pglite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const SCHEMA = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'supabase', 'schema.sql');
const db = new PGlite();
const A = '11111111-1111-1111-1111-111111111111', B = '22222222-2222-2222-2222-222222222222';
// --- emulate Supabase environment ---
await db.exec(`
  create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
  create schema auth;
  create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb default '{}');
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant usage on schema auth to anon, authenticated; grant execute on function auth.uid() to anon, authenticated;
  grant usage on schema public to anon, authenticated, service_role;
  alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
  alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
`);
await db.exec(fs.readFileSync(SCHEMA, "utf8"));
await db.exec(`grant all on all tables in schema public to service_role; grant execute on function public.consume_ai_quota(uuid,text) to service_role;`);
await db.exec(`insert into auth.users (id, email, raw_user_meta_data) values ('${A}', 'a@x.com', '{"full_name":"An"}'), ('${B}', 'b@x.com', '{}');`);

const results = [];
async function as(role, sub, sql, expect, label) {
  let outcome;
  try {
    await db.exec(`reset role; set request.jwt.claim.sub = '${sub || ''}'; set role ${role};`);
    const r = await db.query(sql);
    outcome = { ok: true, rows: r.rows, affected: r.affectedRows };
  } catch (e) { outcome = { ok: false, err: e.message }; }
  await db.exec('reset role;');
  const pass = expect(outcome);
  results.push(pass);
  console.log((pass ? 'PASS ' : 'FAIL ') + label + (pass ? '' : '  → ' + JSON.stringify(outcome)));
}
const denied = o => !o.ok || o.affected === 0 || (o.rows && o.rows.length === 0);

await as('postgres', '', `select count(*)::int n from public.profiles`, o => o.rows[0].n === 2, 'trigger created 2 profiles');
await as('authenticated', A, `select id, display_name from public.profiles`, o => o.ok && o.rows.length === 1 && o.rows[0].id === A, 'user reads only own profile');
await as('authenticated', A, `update public.profiles set role = 'admin' where id = '${A}'`, o => !o.ok, 'user cannot make self admin');
await as('authenticated', A, `update public.profiles set ai_daily_limit = 9999 where id = '${A}'`, o => !o.ok, 'user cannot raise own AI quota');
await as('authenticated', A, `update public.profiles set display_name = 'An Nguyen' where id = '${A}'`, o => o.ok && o.affected === 1, 'user can rename self');
await as('authenticated', A, `update public.profiles set display_name = 'hacked' where id = '${B}'`, denied, 'user cannot rename others');
await as('authenticated', A, `insert into public.user_state (user_id, data) values ('${A}', '{"progress":{}}')`, o => o.ok, 'user writes own state');
await as('authenticated', A, `insert into public.user_state (user_id, data) values ('${B}', '{}')`, o => !o.ok, 'user cannot write state for others');
await as('authenticated', B, `select * from public.user_state`, o => o.ok && o.rows.length === 0, "user B cannot read A's state");
await as('anon', '', `select * from public.user_state`, o => o.ok && o.rows.length === 0, 'anonymous reads nothing');
await as('authenticated', A, `insert into public.ai_usage (user_id, kind, count) values ('${A}', 'grade', -100)`, o => !o.ok, 'user cannot write usage counters');
await as('authenticated', A, `select public.consume_ai_quota('${A}', 'grade')`, o => !o.ok, 'user cannot call quota function');
await as('authenticated', A, `delete from public.profiles where id = '${A}'`, denied, 'user cannot delete profile row');

// server path: 10 allowed, 11th refused
let last;
await db.exec('set role service_role;');
for (let i = 0; i < 11; i++) last = (await db.query(`select public.consume_ai_quota('${A}', 'grade') v`)).rows[0].v;
await db.exec('reset role;');
const v = (await db.query(`select sum(count)::int n from public.ai_usage where user_id = '${A}'`)).rows[0].n;
results.push(last === -1 && v === 10); console.log((last === -1 && v === 10 ? 'PASS ' : 'FAIL ') + `quota: 10 consumed then refused (last=${last}, used=${v})`);
await as('authenticated', A, `select * from public.my_ai_usage_today`, o => o.ok && o.rows.length === 1 && o.rows[0].count === 10, 'user sees own usage today');
await as('authenticated', B, `select * from public.my_ai_usage_today`, o => o.ok && o.rows.length === 0, "user B doesn't see A's usage");
await db.exec(fs.readFileSync(SCHEMA, "utf8"));
console.log('re-run schema: OK (idempotent)');
console.log(results.every(Boolean) ? `\nALL ${results.length} PASS` : `\n${results.filter(x => !x).length} FAILED`);
