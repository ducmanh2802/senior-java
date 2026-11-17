# T2306 — 1 kịch bản SDLC mới: thêm tính năng tóm tắt khiếu nại bằng Claude vào hệ thống ngân hàng

Status: DONE
Agent: kilo
Owns: `js/data/sdlc.js`
After: T2273

Đọc AGENTS.md mục 16 và **bài mẫu `sdlc-001`** trong `js/data/sdlc.js`; đọc lướt tiêu đề các kịch bản đã có để không trùng.

## Việc cần làm
Thêm 1 kịch bản (id `sdlc-NNN` tiếp số lớn nhất), level `senior`, domain `Ngân hàng / AI`: team backend Java (Spring Boot 3, PostgreSQL, Kafka) thêm tính năng **tự động tóm tắt và phân loại email khiếu nại khách hàng bằng Claude API**.
- Đủ 8 giai đoạn đúng thứ tự (requirement, analysis, design, dev, review, test, deploy, bugfix), nối nhau nhất quán (tên service, số liệu, quyết định).
- Nội dung kỹ thuật: gọi API qua HTTP client có timeout + retry có backoff, idempotency, xử lý bất đồng bộ qua Kafka, che PII trước khi gửi, prompt caching cho system prompt dài, structured output (JSON schema), lưu kết quả + audit, eval bằng bộ mẫu có nhãn, theo dõi chi phí token.
- `bugfix` phải bắt nguồn từ một quyết định ở bước trước (ví dụ retry không idempotent → tóm tắt bị tạo 2 lần, hoặc PII lọt vì regex thiếu định dạng).
- Không bịa tên tham số API; không chắc thì mô tả ở mức nguyên lý. Không ghi giá/tên model cụ thể.
- Mỗi `answer` ≥ 1200 ký tự, mở đầu `**Tóm tắt:**`, kết `> Senior tip:`. interview: story STAR có số liệu + ≥ 4 câu hỏi.
- Chỉ THÊM trước dòng `);` cuối file; không backtick, không `${`.

## Nghiệm thu
`node --check js/data/sdlc.js`, `node scripts/build-light-index.js`, `node scripts/validate.js` → OK. KHÔNG commit. Status: DONE + id vào Notes.

## Notes
Reviewed-by: verify-only (code/UI task)
- (Claude 16:10) Verify FAIL: sdlc.js lỗi cú pháp (missing ) after argument list). Sửa object vừa thêm cho tới khi node --check js/data/sdlc.js và node scripts/validate.js OK; không đụng kịch bản cũ.
- (kilo 2026-11-17) Restored `js/data/sdlc.js` từ HEAD để loại bỏ tail bị hỏng do lần chạy trước (nội dung rác/bị cắt dở sau sdlc-011). Thêm `sdlc-012` (senior, Ngân hàng / AI): "Thêm tính năng tóm tắt và phân loại khiếu nại khách hàng bằng AI (Claude API) vào hệ thống ngân hàng" — 8 giai đoạn đúng thứ tự (requirement, analysis, design, dev, review, test, deploy, bugfix), nhất quán `complaint-service`/`complaint-ai-worker`, 120k email/tháng, backlog 2400, p95 < 90s. Kỹ thuật: HTTP client connect/response timeout + retry backoff+jitter, idempotency (claim lease, unique SUCCESS, transaction nguyên tử), Kafka async, che PII (chuẩn hóa+hậu kiểm fail-safe), prompt caching (nguyên lý, giả định theo tài liệu), structured output JSON schema + validate, audit/token tracking, eval bộ nhãn. Bugfix bắt nguồn quyết định trước: retry sau timeout mơ hồ + lease hết hạn + transaction tách -> trùng tóm tắt/tăng token ~1.8x và PII lọt do regex MVP (quyết định "đủ cho MVP" không được triển khai). Không bịa tham số API/giá/tên model. Interview STAR + 5 câu hỏi. Không dùng backtick/`${`.
- Checks: `node --check js/data/sdlc.js` OK; `node scripts/build-light-index.js` OK (ghi js/data/index-light.js; có warning pre-existing: failed to load q-security.js: Unexpected end of input — không thuộc file sở hữu); `node scripts/validate.js` không báo lỗi cho `sdlc.js` (exit non-zero do nhiều lỗi pre-existing ngoài phạm vi: lessons-security/projects/path/security refs, v.v.). Xóa file rác `js/data/sdlc.js.new` nếu phát sinh. Không git commit.
