# T2720R — Fact-check nội dung mới của T2720

Status: DONE
Agent: opencode
Owns: `js/data/lessons-api.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2720 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- lesson-api-017: Sửa test case "nhieu client doc lap, dang ky sai nem ngoai le" — gọi `rl.tryAcquire("free", 0, 1.0)` thay vì `rl.tryAcquire("free", 0)` (method yêu cầu 3 tham số: clientId, nowMillis, cost). Test và reference đã khớp, `node scripts/test-lessons.js` pass 418/418.
- lesson-api-018: Không có lỗi kỹ thuật, markup hợp lệ, test pass.
- validate.js không báo lỗi nào cho lessons-api.js.
