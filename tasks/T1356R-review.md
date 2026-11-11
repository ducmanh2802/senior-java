# T1356R — Fact-check nội dung mới của T1356

Status: DONE
Agent: opencode
Owns: `js/data/q-spring-data.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1356 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

- Fact-check 6 mục `### Ví dụ đời thực` mới (spring-027, db-020, db-021, db-022, db-023, db-024) + `### Trả lời mẫu khi phỏng vấn` mới (spring-027): không tìm thấy lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ) theo chuẩn Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15. Markup (`{{code}}`, không backtick/`${`) OK.
- Sửa 1 lỗi ký tự: db-023, Senior tip kết thúc bằng dấu chấm toàn_width `。` (U+3002) → `.`.
- Không sửa nội dung đã có ở HEAD, không thêm/xoá mục, không đụng file khác. Chỉ sửa `js/data/q-spring-data.js`.
- `node scripts/build-light-index.js` rồi `node scripts/validate.js` → OK — không có lỗi. Không commit.
