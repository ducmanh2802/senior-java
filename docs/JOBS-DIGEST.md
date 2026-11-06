# Việc làm hôm nay (job digest)

Mỗi sáng biên tập viên (routine Claude 7h, cùng lượt với bản tin tin tức) chọn **3–12 tin tuyển dụng Java Backend
từ Middle trở lên** đang mở ở Việt Nam (ưu tiên Hà Nội, TP.HCM, remote), đọc tin gốc và tóm tắt để hiển thị ở
trang `#/jobs`. Không cào dữ liệu: chỉ tìm qua web search, mở tin gốc như người đọc bình thường, tóm tắt bằng lời
của mình và **luôn dẫn link về tin gốc**.

| Thành phần | Vai trò |
|---|---|
| `jobs/YYYY-MM-DD.json` | file bản tin việc làm, commit vào nhánh `claude/digest` |
| `scripts/publish-digest.js` | file nằm trong `jobs/` (hoặc `--kind=jobs`) → kiểm tra schema việc làm, upsert vào `job_digest` |
| `.github/workflows/publish-digest.yml` | push `jobs/*.json` lên `claude/digest` → tự đăng (secret `SUPABASE_SECRET_KEY`) |
| `api/digest.js?kind=jobs[&date=…]` | `{configured, digest, dates, setup?}` giống bản tin tin tức (cache CDN 10 phút) |
| `js/views/jobs.js` | phần "Việc làm hôm nay" + danh sách việc người dùng đang theo dõi |

## 1. Cài đặt một lần: chạy SQL trong Supabase → SQL Editor

```sql
create table if not exists public.job_digest (
  date          date primary key,
  items         jsonb not null check (jsonb_typeof(items) = 'array'),
  intro         text,
  published_at  timestamptz not null default now(),
  editor        text
);
alter table public.job_digest enable row level security;
drop policy if exists "job_digest: public read" on public.job_digest;
create policy "job_digest: public read" on public.job_digest for select using (true);
```

Chưa chạy SQL thì API trả `setup: 'missing_table'` và trang `#/jobs` chỉ hiện phần việc của người dùng.

## 2. Quy trình mỗi sáng

1. **Tìm** bằng web search, ví dụ: `Senior Java developer Hà Nội tuyển dụng`, `Java backend senior HCM`, `Java tech lead
   Vietnam`, `site:itviec.com java senior`, `site:topcv.vn java senior`, trang careers của ngân hàng / công ty product.
2. **Lọc**: tin còn hạn, đăng trong khoảng 14 ngày gần nhất, Java/Kotlin backend, level mid/senior/lead.
   Bỏ tin không rõ công ty, tin trùng (cùng công ty + vị trí), tin đã đăng ở các ngày trước (xem 3 file gần nhất trong `jobs/`).
3. **Mở tin gốc** để đọc yêu cầu thật; không suy ra từ đoạn trích của trang tìm kiếm. Không mở được thì bỏ.
4. **Viết** `jobs/YYYY-MM-DD.json` (schema mục 3), chạy
   `node scripts/publish-digest.js jobs/YYYY-MM-DD.json --dry` tới khi in `✔ … hợp lệ`.
5. Commit cùng file `digests/YYYY-MM-DD.json` của bản tin tin tức rồi push nhánh `claude/digest`.

## 3. Schema

```json
{
  "date": "2026-11-07",
  "intro": "1–3 câu: thị trường hôm nay có gì đáng chú ý (tiếng Việt, ≤ 800 ký tự).",
  "editor": "claude",
  "items": [
    {
      "title": "Senior Java Developer (Payment)",
      "company": "Tên công ty như trong tin",
      "url": "https://… link tin gốc",
      "source": "ITviec | TopCV | LinkedIn | Careers page …",
      "location": "Hà Nội (onsite) | TP.HCM (hybrid) | Remote",
      "level": "junior | mid | senior | lead",
      "salary": "26–30 triệu | Up to $3000 | Thoả thuận  (tuỳ chọn, chỉ ghi nếu tin có công bố)",
      "posted": "2026-11-05  (tuỳ chọn)",
      "skills": ["Java", "Spring Boot", "Kafka", "Oracle"],
      "summary": "Tóm tắt tiếng Việt 80–600 ký tự: sản phẩm/dự án, yêu cầu chính, điểm đặc biệt.",
      "prep": "Cần ôn gì để ứng tuyển (tiếng Việt, ≤ 500): kiến thức trọng tâm, nghiệp vụ, câu nên hỏi lại.",
      "topics": ["spring", "banking"],
      "tags": ["fintech"]
    }
  ]
}
```

- `topics` (≤ 6): id có trong `js/data/topics.js` (script kiểm tra). Trang `#/jobs` dùng để mở câu hỏi ôn đúng chủ đề.
- Văn bản dùng markup của app (`**đậm**`, `{{code}}`), không HTML, không backtick. Không thêm field khác.

## 4. Quy tắc

1. **Không chép nguyên văn** tin tuyển dụng; tóm tắt bằng lời của mình. Không ghi tên/số điện thoại/email người liên hệ.
2. **Không bịa**: lương, địa điểm, yêu cầu phải có trong tin gốc. Không công bố lương thì bỏ field `salary`.
3. Chỉ đăng tin có link gốc mở được (https). Không đăng tin từ nguồn yêu cầu đăng nhập mới xem được.
4. Ưu tiên đa dạng: product / outsource / ngân hàng / startup; không quá 2 tin của cùng một công ty.
