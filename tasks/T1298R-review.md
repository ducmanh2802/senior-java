# T1298R — Fact-check nội dung mới của T1298

Status: DONE
Agent: opencode
Owns: `js/data/q-aws.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1298 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Đã review diff T1298 trong `js/data/q-aws.js` (bổ sung "### Ví dụ đời thực" cho aws-054/055/056/057/058 và thêm mới aws-060, aws-061).
- Không phát hiện lỗi kiến thức AWS, API/flag bịa, cơ chế sai, số liệu vô căn cứ, hay lỗi markup (không backtick, không `${` chưa escape) trong phần nội dung mới.
- Không sửa nội dung. `node --check js/data/q-aws.js` OK. `node scripts/validate.js` vẫn báo các lỗi/cảnh báo sẵn có ngoài phạm vi file sở hữu (q-scenario.js, bugs/projects/path refs scenario, index-light.js cũ) — không liên quan T1298R.
