# T2887R — Fact-check nội dung mới của T2887

Status: DONE
Agent: opencode
Owns: `js/data/q-system-design.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2887 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- design-084: Sửa "Parse SAX" → "Parse streaming (Apache POI event-based)" (SAX là API cho XML, không dùng cho Excel)
- design-085: Sửa "query từng invoice status từ thuế" → "query batch/date-range invoice status từ thuế" (50k invoice/ngày không thể query từng; phải batch/date-range)
- design-085: Cập nhật trả lời phỏng vấn và follow-up question cho nhất quán
- design-083, design-084: Thêm markup `{{...}}` cho các statement SQL/keyword kỹ thuật (UPDATE, CREATE INDEX, INSERT ON CONFLICT DO UPDATE, các field JWT, error code)
