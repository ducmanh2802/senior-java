# T2049R — Fact-check nội dung mới của T2049

Status: DONE
Agent: opencode
Owns: `js/data/q-concurrency-jvm.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2049 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- **concurrency-076**: Sửa phiên bản ScopedValue từ "JDK 25" → "JDK 24 (JEP 481)". ScopedValue được finalized ở JDK 24 (tháng 9/2024), không phải JDK 25. Đã sửa 2 chỗ: dòng mô tả "Hướng tương lai" và bảng so sánh.
- Các câu hỏi concurrency-073, 074, 075, 077, 078: Không có lỗi kỹ thuật, markup hợp lệ.
