# T2163R — Fact-check nội dung mới của T2163

Status: DONE
Agent: opencode
Owns: `js/data/q-autotest.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2163 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Đã rà soát 15 câu mới (autotest-031 → autotest-045) về Playwright for Java, microservices testing, PII, component/API/E2E testing, accessibility, i18n/timezone/currency, API suite optimization, test code review, version control strategy, dev/QA responsibility, regression automation roadmap.

Kết quả:
- Kỹ thuật: đúng (Playwright architecture, auto-wait/actionability, BrowserContext isolation, storageState, frameLocator/waitForPopup/waitForDownload/setInputFiles/onceDialog/page.route, tracing/codegen, contract test/ephemeral env, masking/synthetic data, page.route mock, axe-core integration, locale/timezoneId, BigDecimal currency, parallel/JUnit 5, token reuse, data isolation, monorepo vs separate repo, RACI dev/QA, phased roadmap with metrics).
- Markup: hợp lệ ({{code}}, ###, ~~~java, ~~~seq, > Senior tip:, follow, refs ≤5).
- Không lỗi cú pháp template literal (không backtick, không `${`), không chữ nước ngoài lẫn vào.
- Working tree đã chứa fix từ T2163: autotest-032 dòng 2008 bỏ ngoặc thừa; autotest-041 authOnce nhận `Playwright pw` tự tạo `APIRequestContext` và `dispose()`.

Chạy: `node --check js/data/q-autotest.js` → OK; `node scripts/build-light-index.js` → OK; `node scripts/validate.js` → OK.
