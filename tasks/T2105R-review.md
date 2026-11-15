# T2105R — Fact-check nội dung mới của T2105

Status: DONE
Agent: opencode
Owns: `js/data/q-java.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2105 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- `collections-053`: sửa kích thước object `Long` trên JVM 64-bit (16 B → 24 B: header 12 B + long 8 B + padding), dẫn đến tổng ~61 B/phần tử (thay vì 53 B). Cập nhật lại: Tóm tắt (~61 GB), breakdown (24 B Long, tổng 61 B), bảng so sánh (`HashSet<Long>` ~61 GB, `HashSet<Integer>` giữ ~53 GB), `RoaringBitmap64` → `Roaring64Bitmap` (tên class đúng), ví dụ đời thực (83M × 61 B ≈ 5,1 GB), trả lời phỏng vấn (61 byte/phần tử, 61 GB, 5,1 GB heap). Các câu hỏi còn lại (`collections-052`, `054`, `055`, `056`) đã review: không có lỗi kỹ thuật, markup hợp lệ (không backtick/`${`).
- `node --check js/data/q-java.js` OK; `node scripts/validate.js` → `OK — không có lỗi.`
