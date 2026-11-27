# T2765 — Tiếng Anh freelance: trả lời mẫu 5 câu sàng lọc, standup, mẫu PR/proposal, kịch bản video

Status: DONE
Agent: kilo
Owns: `js/data/freelance-english.js`
After: T2760

Đọc AGENTS.md trước khi làm. Người dùng yêu cầu: "Tạo task làm lộ trình trên senior java" (lộ trình 3 tháng luyện AI-agent + tiếng Anh để nhận job freelance).

## Mục tiêu
Điền nội dung `window.FREELANCE_EN` trong `js/data/freelance-english.js` (schema ở `docs/FREELANCE-TRACK.md` do T2760 tạo; giữ đúng schema, nếu cần thêm field thì ghi vào Notes).

Lộ trình 12 tuần (26/11/2026 → 26/02/2027), mục tiêu: đủ năng lực và bằng chứng để apply job Upwork kiểu "Senior Software Engineer, AI Agent First (Java Spring Boot, TypeScript, Next.js, Stripe Connect)", giá $60–95/giờ.
Yêu cầu thật của job: GitHub link hoặc PR/video thể hiện làm việc cùng agent (Claude Code/Cursor); production Java Spring Boot + TypeScript/Next.js/Node; Postgres mạnh (schema, migration, index, transaction); Stripe Connect (onboarding, payouts/transfers, webhooks, retry, idempotency); guardrails cho agent (test trước, review mọi diff, không để secret trong prompt/repo, staging trước production, an toàn thanh toán); coach team dùng agent; làm theo giờ US Eastern. Tuần thử việc có trả tiền: 1 ticket Stripe Connect thật, ~20 giờ, lên staging trước thứ Sáu, có test, PR đã review, tóm tắt bằng chữ.
5 câu hỏi sàng lọc: (1) GitHub link/PR/video agent workflow; agent viết bao nhiêu phần, bạn review/viết lại gì? (2) Một hệ thống production bạn sở hữu end to end: vai trò, cái gì hỏng, sau đó bạn đổi gì? (3) Guardrails khi agent đụng code thanh toán: test, review, secret/key, staging; kể 1 bug quy trình bắt được trước production. (4) Một tích hợp Stripe Connect bạn đã làm: loại account, onboarding, payouts/transfers, xử lý webhook retry và idempotency. (5) Đã giúp một team thận trọng dùng agent chưa? Cái gì thay đổi, làm sao biết nó bền?
Dự án bằng chứng xuyên suốt: repo public "club-payouts" (CLB thể thao thu phí thành viên, trả tiền cho HLV): Spring Boot API + Next.js/TypeScript + Postgres + Stripe Connect test mode, code chủ yếu bằng Claude Code, mỗi PR ghi "Agent wrote / I reviewed / I rewrote".
Tháng 1 — T1: Claude Code cơ bản (CLAUDE.md, plan mode, chia task nhỏ; quy trình viết test trước → agent code → đọc từng dòng diff), 5 PR nhỏ trên senior-java-api. T2: guardrails (.env + .gitignore, gitleaks pre-commit, GitHub Actions chạy test, branch protection, không dán key vào prompt), PR template. T3: Postgres (schema, Flyway, index, EXPLAIN ANALYZE, isolation, SELECT … FOR UPDATE), khởi tạo club-payouts. T4: ledger/wallet ghi sổ kép, số dư không âm, test đồng thời bằng Testcontainers.
Tháng 2 — T5: khái niệm Connect (account Express, Account Links onboarding, destination charges vs separate charges and transfers, payouts, test mode, stripe listen). T6: webhook trong Spring (Webhook.constructEvent xác thực chữ ký, lưu event.id UNIQUE, Idempotency-Key khi gọi Stripe, retry, event đến sai thứ tự), test webhook trùng và sai thứ tự. T7: Next.js App Router + TypeScript (trang onboarding, dashboard thu nhập, gọi API Spring). T8: staging (Next.js lên Vercel, API lên Fly/Render), CI deploy staging trước production.
Tháng 3 — T9: rules file + checklist review agent cho team; bài viết "How I keep agents safe around payment code". T10: viết 5 câu trả lời sàng lọc bằng tiếng Anh; ghim repo lên GitHub profile. T11: diễn tập tuần thử việc (ticket "refund + reverse transfer", giới hạn 20 giờ, staging trước thứ Sáu, test + PR review + tóm tắt). T12: tìm job tương tự, apply 3–5 job $25–47/giờ trước để lấy review, rồi nhắm $60–95.
Tiếng Anh mỗi ngày 30 phút: standup 3 câu (yesterday/today/blocker), shadowing 10 phút, đọc to tài liệu Stripe 10 phút. Tháng 2: README + mô tả PR bằng tiếng Anh, video 3 phút giới thiệu agent workflow, mỗi tuần 1 buổi nói (mock interview giọng nói trên site hoặc gia sư). Lưu ý múi giờ: 9:00–17:00 New York mùa đông = 21:00–05:00 giờ Việt Nam.

## Nội dung
1. `screening` (5 mục, đúng 5 câu hỏi sàng lọc ở trên): `{ id, question, tips_vi, outline[], modelAnswer, keyPhrases[] { en, vi } }`. modelAnswer tiếng Anh tự nhiên, 120–200 từ, cụ thể, dựa trên trải nghiệm có thật của người học: dev Java 4 năm; dự án senior-java (web app luyện phỏng vấn, 5.000+ câu hỏi, pipeline agent tự động hơn 3.000 task với review → verify → commit, smoke test bằng Playwright); senior-java-api (Spring Boot, AI grading, failover nhiều AI provider, rate limit); club-payouts (dự án Stripe Connect làm trong lộ trình). Đánh dấu rõ chỗ người học phải thay bằng số liệu thật của mình, dạng [YOUR NUMBER]. Không bịa kinh nghiệm Stripe production: câu 4 dựa trên club-payouts và nói thật là dự án cá nhân.
2. `standup`: 10 mẫu standup 3 câu (yesterday/today/blocker) theo ngữ cảnh lộ trình, kèm bản dịch.
3. `phrases`: 40 cụm từ hay dùng khi làm remote với khách (hỏi rõ yêu cầu, báo trễ, đề xuất phương án, xin review, báo sự cố) dạng `{ en, vi, example }`.
4. Thêm 3 mẫu mô tả PR và 1 mẫu cover letter cho job agent-first (field `templates`, ghi vào docs nếu thêm field mới qua Notes).
5. `videoScript`: kịch bản video 3 phút giới thiệu agent workflow (mở đầu, demo test trước → agent code → review diff → CI → staging, kết), câu ngắn dễ nói.

## Luật
- Chỉ sửa file trong Owns. Không commit, không `git add`, `git stash`, `git checkout`, `git reset`: autopilot tự review và commit.
- Vanilla JS, không thêm thư viện, không build step. Tiếng Việt có dấu đầy đủ; thuật ngữ kỹ thuật giữ tiếng Anh.
- Nội dung phải đúng sự thật: API Stripe, Next.js, Claude Code đối chiếu tài liệu chính thức (docs.stripe.com, nextjs.org/docs, docs.claude.com). Không bịa tên hàm, tham số, số liệu. Chỗ không chắc thì ghi rõ "kiểm tra lại tài liệu" thay vì đoán.
- Không bao giờ đưa secret/key thật vào ví dụ: dùng `sk_test_...`, `whsec_...` dạng placeholder.
- Dữ liệu chèn vào innerHTML phải escape bằng helper có sẵn.

## Nghiệm thu
- `node --check js/data/freelance-english.js`; `node scripts/check-freelance.js`; `node scripts/validate.js` → OK.
- Ghi vào Notes: số mục mỗi phần, lệnh đã chạy và kết quả.

## Notes
- So muc moi phan: screening 5 (screening-001..005), standup 10 (standup-001..010), phrases 40 (phrase-001..040), videoScript 1 chuoi.
- Truong 'templates' (3 mau PR + 1 cover letter) trong Noi dung #4 CHUA them: scripts/check-freelance.js (so huu cua integrator) chi cho phep khoa screening/standup/phrases/videoScript va bao loi neu co khoa la. De them 'templates', can bo sung vao KEYS cua check-freelance.js (file ngoai quyen so huu T2765).
- Lenh da chay va ket qua:
  * node --check js/data/freelance-english.js -> SYNTAX OK
  * node scripts/check-freelance.js -> OK - du lieu freelance hop le (12 tuan, 72 task tu freelance-plan.js).
  * node scripts/validate.js -> ma thoat 1, nhung 0 loi lien quan den freelance-english.js. Cac loi con lai o quiz-ops.js, lessons-modern.js, lessons-jpa.js (file cua integrator/nhiem vu khac, ngoai quyen so huu T2765, khong sua).
- Tu an thu: chi sua js/data/freelance-english.js; khong git commit/push; khong tao branch; khong kill tien theo ten; khong mo trinh duyet; luon dung 'node <file>' de chay JS.
Reviewed-by: verify-only (code/UI task)
