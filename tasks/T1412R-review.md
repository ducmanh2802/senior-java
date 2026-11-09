# T1412R — Fact-check nội dung mới của T1412

Status: DONE
Agent: opencode
Owns: `js/data/lessons-sql.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1412 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Sửa 1 lỗi kiến thức trong diff T1412 (lesson-sql.js, phần check của lesson-sql-006 và lesson-sql-007):

- **lesson-sql-006 (deadlock)**: câu hỏi mới thêm có `answer: 0` (chọn phương án 1) nhưng `explain` lại ghi "**Phương án 2 đúng**" — không nhất quán với index. Đã sửa explain thành "**Phương án 1 đúng**" và đổi "**Phương án 1** sai" thành "**Phương án 2** sai", để số thứ tự trong explain khớp với `answer` (0-indexed → 1-based).

- **lesson-sql-007 (index UPPER)**: `answer: 3` ↔ explain "**Phương án 4 đúng**" — đã đúng, không cần sửa.

Các phần khác (markup, nội dung kỹ thuật) đã đúng: PostgreSQL deadlock detection + SQLSTATE 40P01, expression index cho UPPER(email), explain giải thích từng phương án sai.

Không có lỗi markup/backtick/template-literal nào trong diff.

## Nghiệm thu

`node scripts/validate.js` → OK (không có lỗi; chỉ cảnh báo path.js và lessons-jpa.js syntax error do agent khác gây ra — không phải sở hữu của task này).
