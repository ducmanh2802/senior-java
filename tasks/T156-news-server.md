# T156 — Bot tin tức 6h sáng: Vercel Cron + Supabase

Status: DONE
Agent: opencode
Owns: `api/cron-news.js`, `api/news.js`, `vercel.json`, `supabase/schema.sql`, `js/core/news.js`

Mỗi sáng 6h (giờ VN) server tự gom tin từ RSS/Atom công khai, lưu vào Supabase; trang `#/news` đọc ra. **Không dùng AI** (không gọi Claude). Đọc AGENTS.md mục 2, 9 và `api/_lib.js` (`send`, `supabase`, `supabaseConfigured`, `guard`), `api/status.js` làm mẫu handler (CommonJS, Node 20+, `fetch` có sẵn, không thêm npm dependency).

1. `vercel.json`: thêm `"crons": [{ "path": "/api/cron-news", "schedule": "0 23 * * *" }]` (23:00 UTC = 06:00 giờ VN), giữ nguyên field cũ.
2. `api/cron-news.js`: chỉ chạy khi header `authorization === 'Bearer ' + process.env.CRON_SECRET` (Vercel Cron tự gửi khi env có CRON_SECRET; thiếu env → 500 rõ ràng). Danh sách nguồn là mảng hằng `FEEDS = [{ id, name, category: 'tech'|'hiring'|'company', url }]`:
   - tech: Inside Java, Spring blog, JetBrains IntelliJ blog, Baeldung, Hacker News ≥ 200 điểm (hnrss), VnExpress Số hoá, AWS Architecture blog.
   - hiring: HN "Who is hiring" (hnrss), blog TopDev, blog ITviec (tin thị trường IT, lương, tuyển dụng VN).
   - company (engineering blog các công ty hay ho): Netflix Tech Blog, Grab Engineering, Cloudflare blog, Martin Fowler.
   **Kiểm tra từng URL feed** — chỉ giữ feed trả 200 và đúng RSS/Atom; feed chết thì bỏ. KHÔNG scrape trang review (Glassdoor/ITviec reviews…) — vi phạm điều khoản.
   - Fetch song song (timeout 10s/feed, lỗi 1 feed không làm hỏng cả lượt), parse RSS `<item>` và Atom `<entry>` bằng regex đơn giản (title, link/href, pubDate/updated/published, description/summary), bỏ tag HTML + decode entity cơ bản, summary ≤ 300 ký tự, tối đa 15 tin mới nhất/feed, chỉ lấy tin ≤ 7 ngày.
   - Upsert vào Supabase `news_items` (`on_conflict=url`, header `Prefer: resolution=ignore-duplicates`), rồi xoá tin `published` cũ hơn 30 ngày. Trả `{ ok, inserted, feeds: [{id, ok, count, error?}] }`.
3. `supabase/schema.sql`: THÊM (không sửa phần cũ) bảng `news_items (id bigint generated always as identity primary key, url text unique not null, category text not null check (category in ('tech','hiring','company')), source text not null, title text not null, summary text, published timestamptz not null, fetched_at timestamptz not null default now())`, index `(published desc)`, bật RLS + policy `select` cho `anon, authenticated` (tin công khai), không cho ghi từ trình duyệt.
4. `api/news.js` (GET, public, `guard(req, res, { auth: false, method: 'GET', maxPerMinute: 60 })`): query `?days=7&category=tech` (days 1–30) → đọc Supabase sắp `published desc`, limit 300 → `{ updatedAt: max(fetched_at), items: [{ id, category, source, title, url, summary, published }] }`, header `Cache-Control: public, s-maxage=1800, stale-while-revalidate=86400`. Supabase chưa cấu hình → `{ configured: false, items: [] }`.
5. `js/core/news.js` (thay stub, giữ chữ ký): `App.news.list({ days, category })` gọi `/api/news` bằng `fetch` (đây là core nên được phép), trả về như trên; chạy qua `file://` hoặc lỗi mạng → ném lỗi có `code: 'no_server'` để view hiện thông báo thân thiện. `App.news.configured` = kết quả lần gọi gần nhất.
6. `node --check` mọi file, `node scripts/validate.js` → OK, rồi `Status: DONE`. Ghi vào `## Notes` các bước người dùng phải làm: chạy SQL mới trong Supabase SQL Editor, đặt env `CRON_SECRET` trên Vercel, redeploy.

## Notes

**Feeds đã kiểm tra và hoạt động (200 + RSS/Atom):**
- tech (7): Inside Java (feed.xml), Spring Blog (blog.atom), JetBrains IntelliJ, Baeldung, HN ≥200 (hnrss), VnExpress Số hóa, AWS Architecture
- hiring (3): HN Who is hiring (hnrss), TopDev Blog, ITviec Blog
- company (4): Netflix Tech, Grab Engineering, Cloudflare Blog, Martin Fowler

**Feeds bị loại (lỗi 404/405/không phải RSS):**
- InfoQ Java (405) — không tìm được feed RSS/Atom công khai
- Uber Engineering (404)
- ITviec Blog trả HTML chứ không phải RSS — đã bỏ qua vì vi phạm điều khoản scrape review

**Các bước deploy cần làm:**
1. Chạy SQL mới trong Supabase SQL Editor (phần `news_items` trong `supabase/schema.sql`)
2. Đặt env `CRON_SECRET` trên Vercel (Project → Settings → Environment Variables) — chuỗi ngẫu nhiên bảo mật
3. Redeploy trên Vercel (hoặc push commit để trigger deploy tự động)
4. Cron sẽ chạy tự động lúc 23:00 UTC (06:00 giờ VN) mỗi ngày
Reviewed-by: verify-only (code/UI task)
