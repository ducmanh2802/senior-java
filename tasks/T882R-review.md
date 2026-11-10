# T882R — Fact-check nội dung mới của T882

Status: DONE

## Notes
- Sửa remote-002: số liệu effective hourly rate mâu thuẫn (rate niêm yết 5 USD/giờ nhưng effective 9–10 USD/giờ) → điều chỉnh thành ~2–3 USD/giờ và kết quả tăng lên ~16–18 USD/giờ.
- node scripts/validate.js: q-remote.js không có lỗi riêng; các lỗi còn lại thuộc các file không thuộc task (q-security.js, q-microservices.js, liên quan) và index-light.js cũ (không thể rebuild do lỗi cú pháp file khác).
Agent: opencode
Owns: `js/data/q-remote.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T882 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
