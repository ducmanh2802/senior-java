# T102 — Pet project cho Senior Java: dữ liệu + view `#/projects`

Status: DONE
Agent: opencode
Owns: `js/data/projects.js`, `js/views/projects.js`, `css/views/projects.css`, `index.html`, `scripts/validate.js`

Mục tiêu: giúp người học (Java/Spring Boot, nhắm Senior ở ngân hàng/fintech/big tech VN) làm **pet project để đưa vào CV và kể khi phỏng vấn**. Đọc AGENTS.md mục 5–7 (markup, quy ước view), `docs/market-jd-trends.md` (kỹ năng JD yêu cầu), và các view có sẵn (ví dụ `js/views/learn.js`) để theo cùng phong cách.

## 1. Dữ liệu `window.PROJECTS` (`js/data/projects.js`)
6 dự án, từ dễ đến khó, ưu tiên domain ngân hàng/fintech/e-commerce VN, phủ: Spring Boot 3 + PostgreSQL, REST API + security (OAuth2/JWT), Redis cache/rate limit, Kafka/outbox, Docker + Kubernetes, AWS, observability, testing (Testcontainers). Gợi ý (được đổi nếu hợp lý hơn): ví điện tử + ledger kế toán kép; rút gọn URL có rate limit; flash sale chống oversell; hệ thống thông báo đa kênh qua Kafka; đối soát giao dịch cuối ngày (batch + CSV lớn); API gateway + BFF cho mobile banking.
```js
{ id: 'proj-wallet', title, level: 'mid'|'senior'|'lead', weeks: 4, skills: ['Spring Boot', 'PostgreSQL', …],
  pitch: `markup: 2–3 câu, vì sao dự án này gây ấn tượng với interviewer`,
  requirements: `markup: chức năng + phi chức năng (số liệu: QPS, độ trễ, dữ liệu)`,
  architecture: `markup: sơ đồ ~~~text + giải thích lựa chọn`,
  milestones: [{ title, tasks: `markup`, done: `markup: tiêu chí hoàn thành kiểm chứng được` }],   // 4–7 mốc
  challenges: [`markup: chỗ khó thật (race condition, idempotency…) + hướng xử lý`],               // 3–5
  readme: `markup: mẫu README (giới thiệu, kiến trúc, chạy local bằng docker compose, benchmark, quyết định thiết kế)`,
  interview: { story: `markup: kể theo STAR trong 2 phút`, questions: ['câu interviewer hay hỏi về dự án này', …] },   // ≥ 5 câu
  related: ['id câu hỏi/bài học có thật'] }
```
Markup giống câu hỏi (AGENTS mục 5): không backtick, không `${`, `{{code}}` không chứa `{ }`, `###` sát lề, không chữ Trung/Nga. Kiến thức phải đúng (Java 17/21, Spring Boot 3.x).

## 2. Validator (`scripts/validate.js`)
Thêm khối kiểm tra PROJECTS theo mẫu khối LABS/LESSONS có sẵn: id `proj-[a-z0-9-]+` duy nhất, đủ field, milestones 4–7, challenges ≥ 3, interview.questions ≥ 5, `related` phải là id câu hỏi (`QUESTIONS`) hoặc bài học (`LESSONS`) có thật, checkMarkup cho mọi field markup; in dòng tổng kết "Pet project: n dự án". Không đổi các kiểm tra khác.

## 3. View `#/projects` và `#/projects/<id>`
- Danh sách: card mỗi dự án (title, level, số tuần, chips skills, % mốc đã xong), lọc theo skill.
- Trang dự án: pitch, requirements, architecture, **milestones dạng checklist** (tick lưu bằng `App.store.setStatus(id + '#m' + i, 'known')`, bỏ tick dùng `App.store.setStatus(…, 'unknown')`; hiển thị % hoàn thành), challenges (mở/thu gọn), readme (nút "Copy README" chép text gốc), interview story + questions, link `related` (`#/bank/<topic>` hoặc `#/learn/<id>`).
- `index.html`: thêm `<link>` css, `<script src="js/data/projects.js">` cùng nhóm data, `<script src="js/views/projects.js">` cùng nhóm views, và mục menu `<a href="#/projects" data-route="projects">🛠️ Pet project</a>` trong nhóm **Luyện tập**. Không sửa phần khác của index.html.
- Escape mọi dữ liệu bằng `App.esc`/`App.md`; responsive 360px; chỉ dùng biến CSS; cleanup listener.

## Nghiệm thu
`node --check` các file JS, `node scripts/validate.js` → OK (in "Pet project: 6 dự án").

## Notes
Đã thêm 6 blueprint dự án, view danh sách/chi tiết với lọc skill, checklist lưu tiến độ, challenges thu gọn, copy README và liên kết ôn tập. Đã khai báo asset/route trong index, bổ sung validator cho schema và related IDs. `node --check` cho các file JS và `node scripts/validate.js` đều đạt; validator in `Pet project: 6 dự án` và `OK — không có lỗi.`
Reviewed-by: codex (T102R)
