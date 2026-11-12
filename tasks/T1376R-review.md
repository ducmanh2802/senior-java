# T1376R — Fact-check nội dung mới của T1376

Status: DONE
Agent: opencode
Owns: `js/data/q-devops.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1376 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- `devops-064`: sửa mô tả thread dump trong mục "Ví dụ đời thực" cho chính xác hơn — Tomcat thread đang chờ lấy connection từ Hikari pool (tránh ghi "BLOCKED chờ connection pool"), nguyên nhân gốc vẫn là truy vấn giữ lock/cạn pool. Các mục mới khác của T1376 (`devops-062`, `devops-063`, `devops-075`, `devops-080`, `devops-081`) không phát hiện lỗi kỹ thuật/markup.
- `node scripts/validate.js` → OK. (Không chạy `node scripts/test-lessons.js` vì task không sửa bài học.)
