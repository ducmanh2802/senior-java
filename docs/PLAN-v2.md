# Kế hoạch v2 — Nền tảng học Java & ôn phỏng vấn (mở công khai)

Quyết định: **mở công khai ngay**. Thứ tự ưu tiên do người dùng chọn:
P1 nền tảng → P2 Debug lab → P3 phỏng vấn AI bằng giọng nói → P4 bài học + bài tập tự chấm → P5 phần còn lại.

Nguyên tắc chia việc:
- **Integrator (Claude Code)** giữ phần bảo mật và hạ tầng: schema DB + RLS, xác thực ở API, hạn mức AI, contract dữ liệu.
  Sai ở đây là lộ dữ liệu người dùng hoặc mất tiền.
- **Agent (opencode/Cline)** nhận task nhỏ: **1–2 file mỗi task**, có cổng nghiệm thu tự động (`npm run check` = validate + test-algos + smoke).
- Mọi nội dung kỹ thuật do agent viết đều qua **review fact-check** trước khi push.
- CI (`.github/workflows/ci.yml`) chạy trên mọi push và PR.

## Kiến trúc nền tảng

```
Trình duyệt (site tĩnh, Vercel)
  ├─ Supabase Auth (Google / email magic link)       → session JWT
  ├─ Supabase DB (RLS: mỗi user chỉ đọc/ghi dòng của mình)
  │    user_state(user_id, data jsonb, updated_at)   ← đồng bộ tiến độ (merge, không ghi đè)
  └─ /api/* (Vercel functions)
       ├─ xác thực JWT Supabase → user_id
       ├─ hạn mức AI theo ngày: bảng ai_usage (service role, user không ghi được)
       └─ Claude / Judge0
Admin: profiles.role = 'admin' → /api/admin/* (cấp hạn mức, xem usage)
Nội dung: vẫn nằm trong repo (có review + CI); trang admin tạo Pull Request qua GitHub API
```

## P1 — Nền tảng công khai

| Task | Nội dung | Ai | File |
|---|---|---|---|
| T30 | Schema SQL: profiles, user_state, ai_usage, ai_quota + RLS + trigger tạo profile | Integrator | `supabase/schema.sql` |
| T31 | `App.auth` (đăng nhập, session) + `App.sync` (merge tiến độ local và cloud) + unit test merge | Integrator | `js/core/auth.js`, `js/core/sync.js`, `scripts/test-sync.js` |
| T32 | API xác thực JWT + hạn mức theo user (giữ passcode làm cửa admin) | Integrator | `api/_lib.js`, `api/me.js` |
| T33 | View Tài khoản: đăng nhập, trạng thái đồng bộ, hạn mức AI, **xuất / xoá dữ liệu của tôi** | Agent | `js/views/account.js`, css |
| T34 | Trang Quyền riêng tư, Điều khoản, Giới thiệu (nội dung tiếng Việt, integrator review) | Agent | `js/views/legal.js`, css |
| T35 | `/api/admin/*` (integrator) + view Admin: danh sách usage, cấp hạn mức | Integrator + agent | `api/admin.js`, `js/views/admin.js` |
| T36 | Trang soạn nội dung → tạo Pull Request qua GitHub API | Agent (sau T35) | `js/views/editor.js`, `api/content-pr.js` |

**Người dùng cần làm:** tạo project Supabase, bật Google provider, chạy `supabase/schema.sql`, đặt biến môi trường trên Vercel.

## P2 — Debug lab
Bài tập chẩn đoán: cho dữ liệu thật như log hoặc dump, người học tìm nguyên nhân và đề xuất cách sửa, AI chấm theo đáp án mẫu.

| Task | Nội dung | Ai |
|---|---|---|
| T40 | Schema `window.LABS` + validator + contract view | Integrator |
| T41 | 5 lab thread dump (deadlock, pool cạn, lock contention, virtual-thread pinning, CPU loop) | Agent |
| T42 | 5 lab GC log / heap histogram / OOM | Agent |
| T43 | 5 lab SQL: EXPLAIN ANALYZE, lock wait, deadlock log | Agent |
| T44 | 5 lab sự cố production: log + metric + trace (timeout chain, retry storm, Kafka lag…) | Agent |
| T45 | View Debug lab: đọc artifact (dạng terminal), trả lời, AI chấm | Agent |

## P3 — Phỏng vấn với AI bằng giọng nói
| Task | Nội dung | Ai |
|---|---|---|
| T50 | `/api/interview`: hội thoại nhiều lượt, Claude đóng vai interviewer, tính hạn mức theo phiên | Integrator |
| T51 | View: TTS đọc câu hỏi (speechSynthesis), STT trả lời, hội thoại liên tục, bản ghi và chấm cuối phiên | Agent |

## P4 — Bài học + bài tập Java tự chấm
| Task | Nội dung | Ai |
|---|---|---|
| T60 | Schema `LESSONS` / `EXERCISES` (dùng lại harness + Judge0) + validator | Integrator |
| T61–T66 | Bài học theo chủ đề (mỗi task 1 chủ đề, 4–6 bài, mỗi bài có bài tập harness) | Agent |
| T67 | View bài học: lý thuyết, ví dụ, bài tập Run, tiến độ | Agent |

## P5 — Phần còn lại
Bảng trắng system design + AI nhận xét · Bài tập review code (PR có bug cài sẵn) · AI review CV + kho câu chuyện STAR · Nhật ký phỏng vấn thật (đưa vào lịch ôn).
Mỗi mục là một cặp task: integrator làm API/schema, agent làm view và nội dung.
