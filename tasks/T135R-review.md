# T135R — Fact-check nội dung mới của T135

Status: DONE
Agent: opencode
Owns: `js/data/labs-gc.js`, `js/data/labs-thread.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T135 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

- Sửa lab-gc-011: allocation rate trong tóm tắt từ ~2 GB/s thành ~6 GB/s (khớp scenario/JFR).
- labs-thread.js không có diff mới; không thay đổi.
- validate.js → OK.
