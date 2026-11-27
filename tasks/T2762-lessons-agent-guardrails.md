# T2762 — Bài học: làm việc agent-first an toàn với Claude Code (guardrails, review diff, secrets, coach team)

Status: DONE
Agent: kilo
Owns: `js/data/lessons-claude.js`

Đọc AGENTS.md trước khi làm. Người dùng yêu cầu: "Tạo task làm lộ trình trên senior java" (lộ trình 3 tháng luyện AI-agent + tiếng Anh để nhận job freelance).

## Mục tiêu
Thêm 6 bài vào `js/data/lessons-claude.js` (track `claude`, order nối tiếp bài cuối, id `lesson-claude-0NN` tiếp theo; đọc format bài có sẵn và AGENTS.md). Phục vụ tuần 1, 2, 9 của lộ trình:

Lộ trình 12 tuần (26/11/2026 → 26/02/2027), mục tiêu: đủ năng lực và bằng chứng để apply job Upwork kiểu "Senior Software Engineer, AI Agent First (Java Spring Boot, TypeScript, Next.js, Stripe Connect)", giá $60–95/giờ.
Yêu cầu thật của job: GitHub link hoặc PR/video thể hiện làm việc cùng agent (Claude Code/Cursor); production Java Spring Boot + TypeScript/Next.js/Node; Postgres mạnh (schema, migration, index, transaction); Stripe Connect (onboarding, payouts/transfers, webhooks, retry, idempotency); guardrails cho agent (test trước, review mọi diff, không để secret trong prompt/repo, staging trước production, an toàn thanh toán); coach team dùng agent; làm theo giờ US Eastern. Tuần thử việc có trả tiền: 1 ticket Stripe Connect thật, ~20 giờ, lên staging trước thứ Sáu, có test, PR đã review, tóm tắt bằng chữ.
5 câu hỏi sàng lọc: (1) GitHub link/PR/video agent workflow; agent viết bao nhiêu phần, bạn review/viết lại gì? (2) Một hệ thống production bạn sở hữu end to end: vai trò, cái gì hỏng, sau đó bạn đổi gì? (3) Guardrails khi agent đụng code thanh toán: test, review, secret/key, staging; kể 1 bug quy trình bắt được trước production. (4) Một tích hợp Stripe Connect bạn đã làm: loại account, onboarding, payouts/transfers, xử lý webhook retry và idempotency. (5) Đã giúp một team thận trọng dùng agent chưa? Cái gì thay đổi, làm sao biết nó bền?
Dự án bằng chứng xuyên suốt: repo public "club-payouts" (CLB thể thao thu phí thành viên, trả tiền cho HLV): Spring Boot API + Next.js/TypeScript + Postgres + Stripe Connect test mode, code chủ yếu bằng Claude Code, mỗi PR ghi "Agent wrote / I reviewed / I rewrote".
Tháng 1 — T1: Claude Code cơ bản (CLAUDE.md, plan mode, chia task nhỏ; quy trình viết test trước → agent code → đọc từng dòng diff), 5 PR nhỏ trên senior-java-api. T2: guardrails (.env + .gitignore, gitleaks pre-commit, GitHub Actions chạy test, branch protection, không dán key vào prompt), PR template. T3: Postgres (schema, Flyway, index, EXPLAIN ANALYZE, isolation, SELECT … FOR UPDATE), khởi tạo club-payouts. T4: ledger/wallet ghi sổ kép, số dư không âm, test đồng thời bằng Testcontainers.
Tháng 2 — T5: khái niệm Connect (account Express, Account Links onboarding, destination charges vs separate charges and transfers, payouts, test mode, stripe listen). T6: webhook trong Spring (Webhook.constructEvent xác thực chữ ký, lưu event.id UNIQUE, Idempotency-Key khi gọi Stripe, retry, event đến sai thứ tự), test webhook trùng và sai thứ tự. T7: Next.js App Router + TypeScript (trang onboarding, dashboard thu nhập, gọi API Spring). T8: staging (Next.js lên Vercel, API lên Fly/Render), CI deploy staging trước production.
Tháng 3 — T9: rules file + checklist review agent cho team; bài viết "How I keep agents safe around payment code". T10: viết 5 câu trả lời sàng lọc bằng tiếng Anh; ghim repo lên GitHub profile. T11: diễn tập tuần thử việc (ticket "refund + reverse transfer", giới hạn 20 giờ, staging trước thứ Sáu, test + PR review + tóm tắt). T12: tìm job tương tự, apply 3–5 job $25–47/giờ trước để lấy review, rồi nhắm $60–95.
Tiếng Anh mỗi ngày 30 phút: standup 3 câu (yesterday/today/blocker), shadowing 10 phút, đọc to tài liệu Stripe 10 phút. Tháng 2: README + mô tả PR bằng tiếng Anh, video 3 phút giới thiệu agent workflow, mỗi tuần 1 buổi nói (mock interview giọng nói trên site hoặc gia sư). Lưu ý múi giờ: 9:00–17:00 New York mùa đông = 21:00–05:00 giờ Việt Nam.

## Các bài
1. Claude Code hằng ngày: CLAUDE.md (viết gì, ví dụ cho dự án Spring Boot), plan mode, chia ticket thành bước nhỏ, khi nào để agent làm và khi nào tự làm.
2. Test trước, agent code sau: viết test JUnit/Testcontainers làm "hợp đồng", cho agent implement, chạy test; ví dụ cụ thể.
3. Review diff của agent: checklist (logic, edge case, transaction, N+1, exception, log lộ dữ liệu, test có thật sự kiểm tra không), các lỗi agent hay mắc, cách ghi "Agent wrote / I reviewed / I rewrote" trong PR.
4. Secrets và an toàn: .env, .gitignore, gitleaks pre-commit, GitHub secret scanning, không dán key vào prompt, key test vs live, quyền hạn tối thiểu cho tool của agent.
5. Agent đụng code thanh toán: staging trước production, test mode Stripe, idempotency, xác thực chữ ký webhook, feature flag, review hai người; kể một ví dụ bug quy trình bắt được.
6. Coach một team thận trọng: pairing, demo workflow thật, rules file + review checklist chung, đo bằng số (thời gian ra PR, bug lọt, tỷ lệ PR bị trả lại), cách kể chuyện này khi trả lời câu hỏi sàng lọc 5.
Mỗi bài có goals, body chi tiết từ gốc, ví dụ code/config, bài tập thực hành trên repo club-payouts, và câu hỏi tự kiểm tra theo format file.

## Luật
- Chỉ sửa file trong Owns. Không commit, không `git add`, `git stash`, `git checkout`, `git reset`: autopilot tự review và commit.
- Vanilla JS, không thêm thư viện, không build step. Tiếng Việt có dấu đầy đủ; thuật ngữ kỹ thuật giữ tiếng Anh.
- Nội dung phải đúng sự thật: API Stripe, Next.js, Claude Code đối chiếu tài liệu chính thức (docs.stripe.com, nextjs.org/docs, docs.claude.com). Không bịa tên hàm, tham số, số liệu. Chỗ không chắc thì ghi rõ "kiểm tra lại tài liệu" thay vì đoán.
- Không bao giờ đưa secret/key thật vào ví dụ: dùng `sk_test_...`, `whsec_...` dạng placeholder.
- Dữ liệu chèn vào innerHTML phải escape bằng helper có sẵn.

## Nghiệm thu
- `node --check js/data/lessons-claude.js`; `node scripts/validate.js` → OK.
- Ghi vào Notes: id các bài đã thêm, lệnh đã chạy và kết quả.

## Notes

Added lesson-claude-015..020 (6 bài). node --check OK. validate has pre-existing errors in other files.Reviewed-by: kilo (T2762R)
