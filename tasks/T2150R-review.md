# T2150R — Fact-check nội dung mới của T2150

Status: DONE
Agent: opencode
Owns: `js/data/lessons-jpa.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2150 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Sửa 1 lỗi kỹ thuật trong nội dung mới của T2150 (3 block `> Senior tip:` mới thêm):
- `lessons-jpa.js` block N+1: flag `hibernate.statistics` là giả (Hibernate không có property này) → đổi thành `hibernate.generate_statistics` (property đúng của Hibernate 6 để bật thống kê query).
- 2 block còn lại (persist/merge, unit of work): kiểm tra kỹ thuật (`hibernate.show_sql`, `@Modifying @Query`, `em.getReference()`, fetch join + Pageable gây OOM) đều đúng, không sửa.
- Markup: không có backtick/`${` trong các block mới, hợp lệ template literal.

validate.js → OK. test-lessons.js → 298/298 OK. Không thêm/xoá mục, không sửa nội dung đã có ở HEAD.
