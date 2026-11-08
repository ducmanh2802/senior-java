# T729R — Fact-check nội dung mới của T729

Status: DONE
Agent: opencode
Owns: `js/data/q-aws.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T729 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

Status: DONE

## Notes
- aws-057: Lambda scale rate "1.000 concurrency mỗi 10 giây" → "1.000–2.000 concurrency mỗi 10 giây" (AWS docs: Lambda adds ~1.000–2.000 concurrency/10s).
- aws-048: Sửa mâu thuẫn keep-alive: AWS docs yêu cầu target keep-alive timeout **dài hơn** idle timeout của ALB (không phải ngắn hơn). Cập nhật Tóm tắt, phần Fix (quy tắc "target keep-alive > ALB idle timeout") và Senior tip. Đồng thời thay backtick bằng {{code}} ở 3 chỗ (`server.tomcat.keep-alive-timeout=1`, `keep-alive-timeout`, và phần fix).
- Đã thay thế các backtick lẻ trong template literal bằng {{code}} (theo quy tắc markup AGENTS.md mục 5).
- `node scripts/validate.js` → OK — không có lỗi.
