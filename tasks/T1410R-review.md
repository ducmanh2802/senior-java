# T1410R — Fact-check nội dung mới của T1410

Status: DONE
Agent: opencode
Owns: `js/data/lessons-security.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1410 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Review toàn bộ nội dung mới của T1410 trong js/data/lessons-security.js (viết lại body + check của lesson-security-010 JWT và lesson-security-011 PKCE; bài tập Java không đổi so với HEAD). Không tìm thấy lỗi kiến thức: JWT/PKCE đúng RFC 7519/7636 và OAuth 2.1 (cấu trúc token, HMAC-SHA256, alg=none confusion, now<exp/now>=nbf, so sánh constant-time, xoay khoá với kid + grace period, S256 = base64url(SHA-256(verifier)), 32 byte→43 ký tự, mã dùng một lần, state vs PKCE). Không lỗi markup (không backtick, không ${, seq/table hợp lệ), không chữ nước ngoài lẫn ngoài quy ước {{term}}. node scripts/validate.js → OK. node scripts/test-lessons.js → 220/220 pass (lesson-security-010, 011: RESULT 4/4).
