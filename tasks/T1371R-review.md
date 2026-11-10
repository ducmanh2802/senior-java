# T1371R — Fact-check nội dung mới của T1371

Status: DONE
Agent: opencode
Owns: `js/data/q-remote.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1371 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Đã kiểm tra diff mới của T1371 (remote-055..remote-060): IDOR/RLS/N+1/EXPLAIN ANALYZE/pg_tables.rowsecurity đúng (PostgreSQL/Supabase); migration javax→jakarta + JDK 17 đúng cho Spring Boot 3.x; không có backtick/`${` trong phần thêm; markup hợp lệ; số liệu đều ghi rõ giả định/thực tế hợp lý.
- `remote-056`: sửa cấu hình mẫu `{{spring.mvc.pathmatch}}` (không đầy đủ/dễ hiểu sai) thành `{{spring.mvc.pathmatch.matching-strategy}}` và diễn giải "khi cần tương thích" để tránh khẳng định thiếu ngữ cảnh.
- `node --check js/data/q-remote.js` OK; `node scripts/validate.js` → OK (cảnh báo `path.js` 2 bài học không trong PATH là có sẵn, ngoài phạm vi). Không chạy test-lessons (không sửa bài học). Chỉ sửa `js/data/q-remote.js` và file task này. Không commit.

