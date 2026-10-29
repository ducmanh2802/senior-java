# Bản tin hôm nay (daily digest)

Mỗi sáng một biên tập viên (Claude trong một phiên làm việc, hoặc người) chọn 5–10 tin đáng đọc cho dev Java,
đọc bài gốc, viết tóm tắt tiếng Việt và đăng lên trang `#/news`. **Server không tự sinh nội dung bằng AI**: cron
(`api/cron-news.js`) chỉ gom link từ RSS vào `news_items`; bản tin được viết tay và đăng bằng script.

| Thành phần | Vai trò |
|---|---|
| `api/_feeds.js` | danh sách feed (category `tech`, `devops`, `cloud`, `company`) + parser RSS/Atom, dùng chung |
| `api/cron-news.js` | cron 6h sáng: gom tin 7 ngày vào `news_items` |
| `api/digest.js` | `GET /api/digest[?date=YYYY-MM-DD]` → `{configured, digest, dates}` (public, cache CDN 10 phút) |
| `scripts/news-candidates.js` | lấy feed trực tiếp, chấm điểm, in top 25 ứng viên + ghi `logs/news-candidates.json` |
| `scripts/publish-digest.js` | kiểm tra schema chặt rồi upsert vào `news_digest` |
| `js/views/news.js` | hiển thị "Bản tin hôm nay" trên đầu trang tin tức, có chọn ngày cũ |

## 1. Cài đặt một lần (người quản trị)

### 1.1 Chạy SQL trong Supabase → SQL Editor

```sql
-- news_items: thêm category devops / cloud (feed mới)
alter table public.news_items drop constraint if exists news_items_category_check;
alter table public.news_items add constraint news_items_category_check
  check (category in ('tech','hiring','company','devops','cloud'));

-- news_digest: bản tin biên tập mỗi ngày
create table if not exists public.news_digest (
  date          date primary key,
  items         jsonb not null check (jsonb_typeof(items) = 'array'),
  intro         text,
  published_at  timestamptz not null default now(),
  editor        text
);

alter table public.news_digest enable row level security;

drop policy if exists "news_digest: public read" on public.news_digest;
create policy "news_digest: public read" on public.news_digest
  for select using (true);
-- no insert/update/delete policy for anon/authenticated: only the secret (service role) key writes
```

(Giống hệt phần tương ứng trong `supabase/schema.sql`. Chạy lại nhiều lần không sao.)
Trước khi chạy SQL, cron vẫn hoạt động: tin `devops`/`cloud` bị bỏ qua và log cảnh báo, tin cũ vẫn vào bình thường.

### 1.2 Khoá cho máy biên tập

Tạo file `.env.local` ở thư mục gốc repo (đã nằm trong `.gitignore`, **không bao giờ commit**):

```bash
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SECRET_KEY=sb_secret_...
```

Lấy ở Supabase → Project Settings → API Keys (secret key, cùng giá trị đang đặt trên Vercel). Script không in key ra màn hình.
Có thể dùng biến môi trường thay cho file.

## 2. Quy trình mỗi sáng (biên tập viên)

1. **Lấy ứng viên**
   ```bash
   node scripts/news-candidates.js          # 36 giờ gần nhất; node scripts/news-candidates.js 72 sau ngày nghỉ
   ```
   Kết quả ở `logs/news-candidates.json` (điểm = độ uy tín nguồn + từ khoá Java/Spring/JVM/Kafka/Postgres/K8s/AWS/
   DevOps/security… + độ mới). Điểm chỉ để gợi ý, người biên tập quyết định.
2. **Chọn 5–10 tin** đa dạng chủ đề (Java/Spring, dữ liệu, DevOps/cloud, kiến trúc, bảo mật). Bỏ tin quảng cáo,
   webinar, tin không có giá trị kỹ thuật, và tin đã đăng hôm trước.
3. **Đọc bài gốc** của từng tin (mở URL, đọc toàn bài, không chỉ đoạn trích RSS).
4. **Viết** `digests/YYYY-MM-DD.json` theo schema ở mục 3.
5. **Kiểm tra**: `node scripts/publish-digest.js digests/YYYY-MM-DD.json --dry` cho tới khi in `✔ … hợp lệ`.
6. **Đăng**:
   - Routine tự động (cloud): commit file vào nhánh `claude/digest` và push; GitHub Action
     `.github/workflows/publish-digest.yml` đăng lên Supabase bằng repo secrets `SUPABASE_URL`, `SUPABASE_SECRET_KEY`
     (GitHub → Settings → Secrets and variables → Actions). Đăng lại tay: Actions → Publish news digest → Run workflow.
   - Trên máy có `.env.local`: `node scripts/publish-digest.js digests/YYYY-MM-DD.json`. Đăng lại cùng ngày sẽ ghi đè.
   Trang `#/news` thấy bản mới sau tối đa ~10 phút (cache CDN).

## 3. Schema file JSON

```json
{
  "date": "2026-10-29",
  "intro": "1–3 câu mở đầu: hôm nay có gì đáng chú ý (≤ 800 ký tự, tiếng Việt).",
  "editor": "claude",
  "items": [
    {
      "title_vi": "Tiêu đề tiếng Việt (≤ 160)",
      "title": "Original English title",
      "url": "https://… (bắt buộc https, link bài gốc)",
      "source": "Inside Java",
      "category": "tech | devops | cloud | company | hiring",
      "summary": "Tóm tắt tiếng Việt 120–600 ký tự",
      "why": "Vì sao dev Java nên quan tâm (≤ 500)",
      "interview_q": "Một câu hỏi phỏng vấn gợi ra từ tin này (≤ 300)",
      "related": ["security-001"],
      "tags": ["security"]
    }
  ]
}
```

- `related` (tuỳ chọn, ≤ 4): id câu hỏi **có thật** trong ngân hàng (`js/data/q-*.js`); script kiểm tra. Trang tin hiện
  các câu này để ôn ngay.
- `tags` (tuỳ chọn, ≤ 6, mỗi tag ≤ 30 ký tự).
- Văn bản dùng markup của app (`**đậm**`, `{{code}}`, `- list`); **không HTML, không backtick**. Được viết
  `{{List<String>}}` vì nội dung trong `{{ }}` không bị coi là HTML.
- Không thêm field khác. 5–10 tin (`--min=N` / `--max=N` chỉ để thử nghiệm).

## 4. Quy tắc biên tập

1. **Chỉ tóm tắt, không chép**: viết lại bằng lời của mình; không dán nguyên đoạn văn, không dịch nguyên bài. Trích dẫn
   trực tiếp tối đa một câu ngắn, có ngoặc kép.
2. **Mọi khẳng định phải kiểm lại với bài gốc**: số liệu, tên phiên bản, ngày phát hành, tên API. Không chắc thì bỏ.
   Không suy diễn quá những gì bài viết nói; ý kiến riêng chỉ đặt trong `why`.
3. **Luôn có link bài gốc** (`url` https) và đúng tên nguồn; người đọc phải tự kiểm chứng được.
4. **Tóm tắt tối đa ~600 ký tự**: 2–4 câu, trả lời "có gì mới / thay đổi gì / ảnh hưởng ai".
5. `why` gắn tin với công việc của dev Java backend (Spring, JVM, DB, Kafka, K8s, AWS…), không chung chung.
6. `interview_q` theo phong cách phỏng vấn thật ("Bạn sẽ … thế nào?", "So sánh … khi nào chọn cái nào?").
7. Ưu tiên nguồn chính thức (release notes, blog dự án) hơn bài tổng hợp lại; tin đồn và bài chưa xác thực thì bỏ.
