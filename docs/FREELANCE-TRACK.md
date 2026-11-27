# Freelance track (`#/freelance`): lộ trình 12 tuần AI-agent + Stripe + English

Mục tiêu người học: dev Java ~4 năm, ít tiếp xúc công nghệ mới (Kafka, Kubernetes, Redis, AWS,
observability…). Trong 12 tuần (26/11/2026 → 26/02/2027) đạt đủ năng lực và bằng chứng để apply job
Upwork **"Senior Software Engineer, AI Agent First (Java Spring Boot, TypeScript, Next.js, Stripe Connect)"**
giá 60–95 USD/giờ, làm theo giờ US Eastern.

Dự án bằng chứng xuyên suốt: repo public **club-payouts** (CLB thể thao thu phí thành viên, trả tiền HLV):
Spring Boot API + Next.js/TypeScript + Postgres + Stripe Connect test mode, code chủ yếu viết bằng Claude Code,
mỗi PR ghi "Agent wrote / I reviewed / I rewrote".

## Dữ liệu

### `js/data/freelance-plan.js` → `window.FREELANCE_PLAN`
```js
window.FREELANCE_PLAN = {
  goal: '…mục tiêu 12 tuần…',
  job: {
    title: '…', rate: '60–95 USD/giờ…',
    mustHaves: ['…'], niceToHaves: ['…'],
    trial: '…tuần thử việc có trả tiền…',
    screening: ['câu 1', 'câu 2', 'câu 3', 'câu 4', 'câu 5'],   // đúng 5 câu sàng lọc
  },
  timezoneNote: '…9:00–17:00 New York = 21:00–05:00 giờ VN…',
  project: { name: 'club-payouts', stack: ['…'], prRule: 'Agent wrote / I reviewed / I rewrote' },
  months: [{ id: 'm1', title: '…', focus: '…' }, …],            // đúng 3 tháng
  weeks: [
    { id: 'fw1', month: 'm1', title: '…',
      goals: ['…'],                          // ≥ 2 mục
      tasks: [{ id: 'fw1-t1', text: '…', minutes: 60 }, …],   // 4–7 task, id bắt đầu bằng '<week>-'
      deliverable: '…',                      // sản phẩm cuối tuần
      english: ['…'],                        // ≥ 1 hoạt động tiếng Anh
      links: [{ title: '…', url: 'https://…' }],   // chỉ tài liệu chính thức, https
      lessonIds: ['lesson-claude-010', …] }, // trỏ tới bài có thật trong js/data/lessons-*.js (có thể rỗng)
    …                                          // đủ 12 tuần fw1..fw12
  ],
};
```
- `id` tuần duy nhất, dạng `fw1`…`fw12`, đúng thứ tự; `month` phải là id có trong `months`.
- Mỗi task: `id` duy nhất toàn cục, bắt đầu bằng `<weekId>-`; `text` ≥ 30 ký tự; `minutes` số nguyên dương.
- `links` chỉ dùng URL tài liệu chính thức (docs.stripe.com, nextjs.org, docs.claude.com, postgresql.org,
  docs.github.com, testcontainers.org, vercel.com, fly.io, render.com…), luôn `https://`.
- `lessonIds` phải tồn tại trong `window.LESSONS`. Bài mới `lesson-pay-*` (T2763), `lesson-next-*` (T2764) chưa có
  thì để mảng rỗng.
- **Không** để secret thật: chỉ dùng placeholder `sk_test_...`, `whsec_...`.

### `js/data/freelance-english.js` → `window.FREELANCE_EN`
```js
window.FREELANCE_EN = { screening: [], standup: [], phrases: [], videoScript: null };
```
Hiện là **stub** đúng schema (T2765 điền nội dung). `videoScript` là `null` hoặc chuỗi.

### `js/core/data-manifest.js`
Khoá group `freelance: ['freelance-plan.js', 'freelance-english.js']` cạnh khoá `aws`.
Chưa thêm route/view (T2761 làm).

## Kiểm tra
- `node scripts/check-freelance.js` → kiểm 12 tuần, id duy nhất, đủ field bắt buộc, URL https, lessonIds tồn tại,
  không có chuỗi giống secret thật. In `OK` và exit 0.
- `node scripts/validate.js` → nạp mọi file trong manifest (gồm 2 file freelance); lỗi freestyle (nếu có) in ra.

## Màn hình `#/freelance` (T2761)
Hiển thị: tổng quan (ngày bắt đầu → tuần hiện tại, % hoàn thành), kế hoạch 12 tuần (mở goals/tasks/deliverable/
english/links, tick hoàn thành), 5 câu sàng lọc, timezone note, link repo club-payouts.
Lưu `App.store.data.freelance = { start, done: { '<weekId>': true } }`.