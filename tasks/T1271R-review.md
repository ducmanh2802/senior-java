# T1271R — Fact-check nội dung mới của T1271

Status: DONE
Agent: opencode
Owns: `js/data/q-autotest.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1271 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Đã review toàn bộ 45 câu hỏi trong `js/data/q-autotest.js` (autotest-001 đến autotest-045), bao gồm:
- 15 câu hỏi gốc (autotest-001..015) được bổ sung thêm section "Ví dụ đời thực", "Trả lời mẫu khi phỏng vấn", cập nhật "Senior tip"
- 30 câu hỏi mới (autotest-016..045) bao trùm: thiết kế framework, song song Playwright, flaky test, tối ưu thời gian suite, visual regression, contract testing, performance testing (k6/JMeter/Gatling), APIRequestContext + network interception, shift-left/pipeline, test phụ thuộc bên 3 (WireMock/sandbox/test hook), bảo mật OWASP ZAP, đo chất lượng automation (defect leakage/flaky rate/coverage requirement), AI trong testing (self-healing/LLM), chiến lược QA fintech, tuyển SDET, kiến trúc Playwright for Java, auto-wait/actionability/web-first assertions, tổ chức JUnit 5 + POM + storageState, xử lý iframe/popup/download/upload/dialog/route, debug CI với Trace Viewer/codegen/triage, microservices testing + ephemeral environment, PII/masking/synthetic data, component/API/E2E testing + mock backend, accessibility testing (axe-core), i18n/timezone/currency testing, tối ưu suite API (parallel/token reuse/data), code review test chất lượng, versioning test (monorepo vs repo riêng), chia trách nhiệm dev/QA, lộ trình 6 tháng nâng regression automation.

Kết quả review:
- Không phát hiện lỗi kỹ thuật (API/flag sai, cơ chế nói ngược, số liệu vô căn cứ) trong file q-autotest.js
- Không phát hiện lỗi markup (backtick, `${` không escape, syntax sai) trong file q-autotest.js
- Không phát hiện từ tiếng Anh lẫn vào không phải thuật ngữ kỹ thuật
- Cú pháp file hợp lệ: `node --check js/data/q-autotest.js` pass
- Validator không báo lỗi cho topic autotest (chỉ báo lỗi cho các file khác: q-english.js, lessons-testing.js, q-claude.js, projects.js, path.js, index-light.js — không thuộc sở hữu task này)

Lưu ý: `node scripts/build-light-index.js` không chạy được do lỗi cú pháp có sẵn trong `q-english.js` (file không thuộc task này). `index-light.js` do đó chưa cập nhật mới, validator cảnh báo file cũ. Khi các file kia được sửa bởi owner tương ứng, build-light-index sẽ pass.
