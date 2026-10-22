/*
 * Public client configuration. Both values are safe to publish: the publishable key only grants what
 * Row Level Security allows (see supabase/schema.sql). NEVER put the secret / service_role key here —
 * that one lives only in Vercel environment variables (SUPABASE_SECRET_KEY).
 * Leave supabaseUrl empty to run the site without accounts (progress stays in localStorage).
 */
window.APP_CONFIG = {
  supabaseUrl: 'https://nmzqgokntdkikfussphh.supabase.co',
  supabaseKey: 'sb_publishable_Ji8fpZBS_fOlN2GihXXYbw_TTscTnAx',
};
