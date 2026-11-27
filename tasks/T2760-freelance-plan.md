# T2760 — Track #/freelance: dữ liệu lộ trình 12 tuần AI-agent + Stripe + English (plan, schema, check script)

Status: DONE
Agent: kilo
Owns: `js/data/freelance-plan.js`, `js/data/freelance-english.js`, `docs/FREELANCE-TRACK.md`, `scripts/check-freelance.js`, `js/core/data-manifest.js`

Đọc AGENTS.md trước khi làm. Người dùng yêu cầu: "Tạo task làm lộ trình trên senior java" (lộ trình 3 tháng luyện AI-agent + tiếng Anh để nhận job freelance).

## Mục tiêu
Tạo dữ liệu cho track mới `#/freelance` (làm giống track AWS: xem `js/data/aws-plan.js`, `docs/AWS-TRACK.md`, `scripts/check-aws.js`, khoá `aws` trong `js/core/data-manifest.js`).

Lộ trình 12 tuần (26/11/2026 → 26/02/2027), mục tiêu: đủ năng lực và bằng chứng để apply job Upwork kiểu "Senior Software Engineer, AI Agent First (Java Spring Boot, TypeScript, Next.js, Stripe Connect)", giá $60–95/giờ.
Yêu cầu thật của job: GitHub link hoặc PR/video thể hiện làm việc cùng agent (Claude Code/Cursor); production Java Spring Boot + TypeScript/Next.js/Node; Postgres mạnh (schema, migration, index, transaction); Stripe Connect (onboarding, payouts/transfers, webhooks, retry, idempotency); guardrails cho agent (test trước, review mọi diff, không để secret trong prompt/repo, staging trước production, an toàn thanh toán); coach team dùng agent; làm theo giờ US Eastern. Tuần thử việc có trả tiền: 1 ticket Stripe Connect thật, ~20 giờ, lên staging trước thứ Sáu, có test, PR đã review, tóm tắt bằng chữ.
5 câu hỏi sàng lọc: (1) GitHub link/PR/video agent workflow; agent viết bao nhiêu phần, bạn review/viết lại gì? (2) Một hệ thống production bạn sở hữu end to end: vai trò, cái gì hỏng, sau đó bạn đổi gì? (3) Guardrails khi agent đụng code thanh toán: test, review, secret/key, staging; kể 1 bug quy trình bắt được trước production. (4) Một tích hợp Stripe Connect bạn đã làm: loại account, onboarding, payouts/transfers, xử lý webhook retry và idempotency. (5) Đã giúp một team thận trọng dùng agent chưa? Cái gì thay đổi, làm sao biết nó bền?
Dự án bằng chứng xuyên suốt: repo public "club-payouts" (CLB thể thao thu phí thành viên, trả tiền cho HLV): Spring Boot API + Next.js/TypeScript + Postgres + Stripe Connect test mode, code chủ yếu bằng Claude Code, mỗi PR ghi "Agent wrote / I reviewed / I rewrote".
Tháng 1 — T1: Claude Code cơ bản (CLAUDE.md, plan mode, chia task nhỏ; quy trình viết test trước → agent code → đọc từng dòng diff), 5 PR nhỏ trên senior-java-api. T2: guardrails (.env + .gitignore, gitleaks pre-commit, GitHub Actions chạy test, branch protection, không dán key vào prompt), PR template. T3: Postgres (schema, Flyway, index, EXPLAIN ANALYZE, isolation, SELECT … FOR UPDATE), khởi tạo club-payouts. T4: ledger/wallet ghi sổ kép, số dư không âm, test đồng thời bằng Testcontainers.
Tháng 2 — T5: khái niệm Connect (account Express, Account Links onboarding, destination charges vs separate charges and transfers, payouts, test mode, stripe listen). T6: webhook trong Spring (Webhook.constructEvent xác thực chữ ký, lưu event.id UNIQUE, Idempotency-Key khi gọi Stripe, retry, event đến sai thứ tự), test webhook trùng và sai thứ tự. T7: Next.js App Router + TypeScript (trang onboarding, dashboard thu nhập, gọi API Spring). T8: staging (Next.js lên Vercel, API lên Fly/Render), CI deploy staging trước production.
Tháng 3 — T9: rules file + checklist review agent cho team; bài viết "How I keep agents safe around payment code". T10: viết 5 câu trả lời sàng lọc bằng tiếng Anh; ghim repo lên GitHub profile. T11: diễn tập tuần thử việc (ticket "refund + reverse transfer", giới hạn 20 giờ, staging trước thứ Sáu, test + PR review + tóm tắt). T12: tìm job tương tự, apply 3–5 job $25–47/giờ trước để lấy review, rồi nhắm $60–95.
Tiếng Anh mỗi ngày 30 phút: standup 3 câu (yesterday/today/blocker), shadowing 10 phút, đọc to tài liệu Stripe 10 phút. Tháng 2: README + mô tả PR bằng tiếng Anh, video 3 phút giới thiệu agent workflow, mỗi tuần 1 buổi nói (mock interview giọng nói trên site hoặc gia sư). Lưu ý múi giờ: 9:00–17:00 New York mùa đông = 21:00–05:00 giờ Việt Nam.

## Việc cần làm
1. `docs/FREELANCE-TRACK.md`: mô tả schema `window.FREELANCE_PLAN` và `window.FREELANCE_EN`.
2. `js/data/freelance-plan.js`: `window.FREELANCE_PLAN = { goal, job: { title, rate, mustHaves[], niceToHaves[], trial, screening[5] }, timezoneNote, project: { name, stack[], prRule }, months[3] { id, title, focus }, weeks[12] { id: 'fw1'…'fw12', month, title, goals[], tasks[] { id, text, minutes }, deliverable, english[], links[] { title, url }, lessonIds[] } }`. Mỗi tuần 4–7 task cụ thể, làm được trong ~2 giờ tối ngày thường + 4 giờ cuối tuần, viết chi tiết từ gốc (người học là dev Java 4 năm, ít tiếp xúc công nghệ mới). `links` chỉ dùng URL tài liệu chính thức. `lessonIds` trỏ tới bài có thật trong `js/data/lessons-*.js` (grep id trước; bài mới `lesson-pay-*`, `lesson-next-*` sẽ do T2763/T2764 tạo — có thể để mảng rỗng).
3. `js/data/freelance-english.js`: stub đúng schema `window.FREELANCE_EN = { screening: [], standup: [], phrases: [], videoScript: null }` (T2765 điền nội dung).
4. `js/core/data-manifest.js`: thêm khoá `freelance: ['freelance-plan.js', 'freelance-english.js']` cạnh khoá `aws`, kèm comment. CHƯA thêm route/view (T2761 làm).
5. `scripts/check-freelance.js`: kiểm tra 12 tuần, id duy nhất, mọi field bắt buộc, URL https, lessonIds tồn tại, không có chuỗi giống key thật (`sk_live_`, `rk_live_`).

## Luật
- Chỉ sửa file trong Owns. Không commit, không `git add`, `git stash`, `git checkout`, `git reset`: autopilot tự review và commit.
- Vanilla JS, không thêm thư viện, không build step. Tiếng Việt có dấu đầy đủ; thuật ngữ kỹ thuật giữ tiếng Anh.
- Nội dung phải đúng sự thật: API Stripe, Next.js, Claude Code đối chiếu tài liệu chính thức (docs.stripe.com, nextjs.org/docs, docs.claude.com). Không bịa tên hàm, tham số, số liệu. Chỗ không chắc thì ghi rõ "kiểm tra lại tài liệu" thay vì đoán.
- Không bao giờ đưa secret/key thật vào ví dụ: dùng `sk_test_...`, `whsec_...` dạng placeholder.
- Dữ liệu chèn vào innerHTML phải escape bằng helper có sẵn.

## Nghiệm thu
- `node scripts/check-freelance.js` → OK; `node scripts/validate.js` → OK.
- Ghi vào Notes: file đã tạo, lệnh đã chạy và kết quả.

## Notes

Đã tạo (chỉ file trong Owns):
- `js/data/freelance-plan.js` — `window.FREELANCE_PLAN`: goal, job (title/rate/mustHaves/niceToHaves/trial/5 screening), timezoneNote, project club-payouts, 3 months, 12 tuần fw1..fw12 (72 task, mỗi tuần 6 task, 4–7 task hợp lệ), mỗi tuần có goals/deliverable/english/links (https, tài liệu chính thức)/lessonIds (trỏ bài có thật, tuần 7 & 12 để rỗng vì lesson-next/lesson-pay do T2763/T2764 tạo). Nội dung viết chi tiết từ gốc, giải thích thuật ngữ lần đầu.
- `js/data/freelance-english.js` — stub đúng schema `{ screening:[], standup:[], phrases:[], videoScript:null }` cho T2765.
- `js/core/data-manifest.js` — thêm group `freelance: ['freelance-plan.js','freelance-english.js']` cạnh `aws` (kèm comment). Chưa thêm route/view (T2761).
- `scripts/check-freelance.js` — kiểm 12 tuần, id tuần/task duy nhất & đúng thứ tự, đủ field, task 4–7 & id prefix, minutes nguyên dương, links https, lessonIds tồn tại (load lessons-*.js), FREELANCE_EN schema, không có secret thật (sk_live_/rk_live_/whsec_ + 20 ký tự). Export hàm check() để validate.js cắm sau.
- `docs/FREELANCE-TRACK.md` — mô tả schema 2 global + cách check + ghi chú view T2761.

Lệnh đã chạy & kết quả:
- `node scripts/check-freelance.js` → `Freelance track: 12 tuần, 72 task.` / `OK — dữ liệu freelance hợp lệ.`
- `node --check` cho cả 4 file JS → OK.
- `node scripts/validate.js` → KHÔNG có lỗi nào thuộc file của task này (grep "freelance" = rỗng). Validate vẫn exit 1 vì các lỗi CÓ SẴN ở file task khác đang dở trong cây chung (không thuộc Owns, không được sửa theo luật 3): quiz-ops.js (12), q-concurrency-jvm.js (6), q-soft.js (3), lessons-db.js (2), lessons-jpa.js (1), lessons-modern.js (1), q-spring-data.js (1), path.js (1). Các file này do agent khác đang sửa; khi họ xong, validate sẽ OK. Dữ liệu freelance nạp qua group `freelance` trong manifest nên validate đã đọc 2 file freelance mà không phát sinh lỗi.

Không commit, không git add/stash/checkout/reset (autopilot tự review + commit).
Reviewed-by: verify-only (code/UI task)
