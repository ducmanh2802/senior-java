# T2144R — Fact-check nội dung mới của T2144

Status: DONE
Agent: opencode
Owns: `js/data/q-security.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2144 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Nội dung mới (diff vs HEAD) đã review, tất cả đúng kỹ thuật sau khi sửa:
- security-057: "Rezeption" (từ ngoài) → "tân"; "tường chỉ" → "tường minh".
- security-058: follow-up bổ sung `show-details=when-authorized`; prometheus include ghi rõ "tuỳ chọn, không để trùng key".
- security-059: "đãserialize" → "đã serialize".
- security-060: "lets" (tiếng Anh) → "cho phép".
- security-061: số ALB (single header 16 KB, toàn bộ request header 64 KB) và CloudFront (request+query ≤ 32.768 bytes) đã trích lại theo tài liệu chính thức AWS.
- security-062: logic `nbf` (`{{now + skew > nbf}}` → `{{now + skew < nbf}}`).
- security-064: bổ sung khởi tạo `JdbcRegisteredClientRepository`, `repo.save(spa/svc)`, `return repo` (trước đó client không được lưu).
Không thêm/xoá mục, không sửa nội dung đã có ở HEAD. `node --check` OK; `node scripts/validate.js` → OK.
