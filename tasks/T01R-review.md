# T01R — Fact-check nội dung mới của T01

Status: DONE
Agent: opencode
Owns: `js/data/q-java.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T01 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

- Đã rà soát toàn bộ diff mới của `q-java.js`: không có thay đổi đáp án/câu hỏi so với HEAD; các thay đổi chỉ thêm cùng một cặp refs chung vào 8 câu (`core-011`, `collections-002`, `collections-008`, `collections-014`, `modern-005`, `core-026`, `modern-012`, `modern-016`).
- Đã bỏ refs lặp lại khỏi các ID trên vì Java Language/JVM Specifications không phải nguồn chuyên biệt cho các chủ đề library/API đó, còn đường dẫn sách O'Reilly không được xác minh. Không sửa nội dung câu hỏi/đáp án đã có trong HEAD và không thêm/xóa mục.
- `node scripts/validate.js` → **OK — không có lỗi.**
