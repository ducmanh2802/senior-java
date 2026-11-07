# T862 — View `#/jobs`: Việc làm hôm nay + việc tôi theo dõi

Status: TODO
Agent: qoder
Owns: `js/views/jobs.js`, `css/views/jobs.css`

Đọc AGENTS.md (mục 2, 7, 9, 14, 15) và `docs/JOBS-DIGEST.md`. Tham khảo cách làm của `js/views/news.js` (phần bản tin, chọn ngày, xử lý lỗi) và `js/views/career.js` (danh sách người dùng tự nhập có `id`/`updatedAt`/`deleted`, i18n, AI coach). Integrator đã nối sẵn: route `jobs` trong `js/core/data-manifest.js` (views), link nav `#/jobs` trong `index.html`, `App.store.data.jobs = []` (đồng bộ tài khoản giống `stories`), `App.news.digest({ kind: 'jobs', date })`. **Không sửa file core.**

## Màn hình gồm 2 tab (`?` hash phụ: `#/jobs` = tab 1, `#/jobs/mine` = tab 2)

### Tab 1 — Việc làm hôm nay
- Gọi `await App.news.digest({ kind: 'jobs', date })` → `{configured, digest: {date, intro, items, published_at} | null, dates, setup}`. Item: `{title, company, url, source, location, level, salary?, posted?, skills[], summary, prep, topics?[], tags?[]}`.
- Hiện `intro` (App.md), chọn ngày trong `dates` (select), bộ lọc nhanh: level (chip), địa điểm (Hà Nội / HCM / Remote / tất cả — so khớp chuỗi `location`), ô tìm kiếm (title/company/skills).
- Mỗi tin là một `.card`: tiêu đề + công ty, badge level, địa điểm, lương (nếu có), ngày đăng, chips kỹ năng, `summary` (App.md), mục "Cần chuẩn bị" (`prep`, App.md), các topic thành link `#/bank/<topicId>` (tên lấy từ `App.topic(id)`), link "Xem tin gốc ↗" (`target="_blank" rel="noopener noreferrer"`, ghi rõ nguồn).
- Nút **＋ Theo dõi**: thêm vào tab 2 (copy các field, `status: 'watch'`, `from: 'digest'`); nếu `url` đã có trong danh sách (chưa xoá) thì nút thành "✓ Đang theo dõi" và disable.
- Trạng thái lỗi (dùng `App.news` → `NewsError.code`): `no_server` (mở file:// hoặc chưa deploy), `configured === false`, `setup === 'missing_table'`, `digest === null` → thông báo thân thiện trong `.empty`; tab 2 vẫn dùng được.

### Tab 2 — Việc tôi theo dõi
- Dữ liệu: `App.store.data.jobs` — mảng `{ id, updatedAt, deleted?, title, company, url?, location?, level?, salary?, deadline? ('YYYY-MM-DD'), status, notes?, jd?, analysis?, topics?[], from? }`. `status` ∈ `watch | applied | interview | offer | rejected` (nhãn: Đang xem / Đã nộp / Phỏng vấn / Offer / Trượt).
- `id` = `'job-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)`. Mọi lần sửa: cập nhật `updatedAt = Date.now()` rồi `App.store.save()`. Xoá = đặt `deleted: true` (không splice), có confirm. Ẩn mục `deleted`.
- Form thêm/sửa: tiêu đề, công ty, link, địa điểm, level, lương, hạn nộp, trạng thái, ghi chú, ô dán JD.
- Nút **🤖 Phân tích JD** (chỉ khi bấm, JD ≥ 200 ký tự, nếu ngắn hơn thì báo): `await App.ai.jd(jd)` → lưu vào `analysis`, hiện `summary`, `must_have` (skill + topic + weight), `likely_questions`, `prep_tips`, `questions_to_ask`. Trong lúc chờ: `<span class="ai-loading">AI đang phân tích…</span>` + disable nút; lỗi → `App.ui.error(e)`. Ghi chú "Mỗi lần phân tích tốn 1 lượt AI".
- Sau khi có `analysis`: khối **Ôn cho việc này** gồm link `#/bank/<topic>` cho các topic trong `must_have` (bỏ topic rỗng, sắp theo weight), số câu "đến hạn/chưa thuộc" của topic lấy từ `App.stats(topic)`.
- Đầu tab: thống kê theo trạng thái (chips có đếm, bấm để lọc), sắp xếp theo hạn nộp gần nhất rồi `updatedAt`. Hạn nộp đã qua hiện badge cảnh báo.

## Yêu cầu chung
- i18n: toàn bộ chuỗi qua `App.i18n.add({ vi: {...}, en: {...} })` với key `jobs.*`, dùng `App.t(key, params)`; tiêu đề view theo ngôn ngữ (xem news.js / career.js làm thế nào).
- Escape mọi dữ liệu bằng `App.esc`, nội dung markup qua `App.md`. Không `fetch` trực tiếp. Không gọi AI tự động.
- Phím tắt qua `App.onKey` (có `<kbd>` gợi ý): `1`/`2` chuyển tab, `n` mở form thêm việc, `/` focus ô tìm kiếm. Cleanup khi rời view.
- CSS trong `css/views/jobs.css`, mọi selector bắt đầu bằng `.view-jobs`, chỉ dùng biến màu, responsive 360px, dark mode.
- Dùng class sẵn có: `.card .btn .chip .chips .badge .input .select .textarea .empty .md .page-head .grid .row`.

## Nghiệm thu
`node --check js/views/jobs.js`, `node scripts/check-budget.js` (nếu có), `node scripts/validate.js` → OK. Không mở trình duyệt. KHÔNG commit. Ghi `Status: DONE` + ghi chú ngắn vào Notes.

## Notes
