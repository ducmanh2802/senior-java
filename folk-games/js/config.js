/*
 * Cấu hình công khai cho chế độ chơi online (Supabase Realtime: kênh broadcast + presence, không cần bảng).
 * Publishable key được phép công khai. KHÔNG bao giờ đặt secret / service_role key ở đây.
 * Khi tách Sân Đình sang repo riêng, có thể thay bằng một project Supabase riêng.
 * Để trống supabaseUrl thì chế độ online sẽ bị ẩn.
 */
window.SANDINH_CONFIG = {
  supabaseUrl: 'https://nmzqgokntdkikfussphh.supabase.co',
  supabaseKey: 'sb_publishable_Ji8fpZBS_fOlN2GihXXYbw_TTscTnAx',
  supabaseJs: 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.3/dist/umd/supabase.js',
  supabaseJsIntegrity: 'sha384-BWcjm9OdFth9TbhCxZPdm+gAOUMAzQy9nmTs12ioXdCcbVnJaPMn+fMUoQCLt60R',
};
