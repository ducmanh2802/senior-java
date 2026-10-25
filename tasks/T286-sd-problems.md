# T286 — Đề system design bấm giờ (ngân hàng + big tech)

Status: TODO
Agent: opencode
Owns: `js/data/sd-problems.js`

Đọc comment schema đầu `js/data/sd-problems.js`, AGENTS.md mục 5–6, và các câu topic `design` trong `js/data/q-system-design.js` (không chép nguyên đáp án; có thể `related`). Viết **10 đề** vào `window.SD_PROBLEMS`:
- **bank (5):** chuyển tiền liên ngân hàng qua Napas (idempotency, trạng thái treo, đối soát); sổ cái double-entry + số dư thời gian thực; OTP/xác thực giao dịch; sao kê & báo cáo cuối ngày cho hàng triệu tài khoản; phát hiện gian lận theo luật thời gian thực.
- **bigtech (5):** URL shortener; rate limiter phân tán; news feed; chat 1-1 + nhóm; notification đa kênh quy mô lớn.
Mỗi đề: `prompt` như interviewer nói, có con số quy mô cụ thể; 5 pha đúng schema (Requirements 5' / Estimation 5' / API & data model 5' / High-level design 15' / Deep dive 15'), `guide` từng pha nói rõ phải hỏi/chốt/tính gì; `rubric` 6–10 ý chấm được; `reference` ≥ 3000 ký tự có sơ đồ ASCII, phép tính ước lượng, trade-off, failure mode; `followups` 3–5 câu đổi ràng buộc (x10 traffic, mất một region…). Đúng kỹ thuật (Java 17/21, Spring Boot 3, PostgreSQL, Kafka, Redis, AWS). `node scripts/validate.js` → OK, rồi `Status: DONE`.

## Notes
