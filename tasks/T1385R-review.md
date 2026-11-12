# T1385R — Fact-check nội dung mới của T1385

Status: DONE
Agent: opencode
Owns: `js/data/q-soft.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1385 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Đã review toàn bộ 8 câu hỏi mới (behavioral-047 đến behavioral-054) trong q-soft.js. Không phát hiện lỗi kỹ thuật, lỗi markup, hay chữ nước ngoài lẫn vào. Các khái niệm kỹ thuật (ADR, idempotency, rollback, blameless postmortem, observability, feature flag, canary release, Kafka producer/consumer/partition/offset/DLQ, runbook, signing bonus, runway) đều được giải thích đúng và có ví dụ đời thường. Template literal không chứa backtick hay `${`. Sequence diagram cú pháp đúng. Validation pass sau rebuild index-light.js.
