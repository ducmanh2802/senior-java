# T2502R — Fact-check nội dung mới của T2502

Status: DONE
Agent: opencode
Owns: `js/data/q-spring-data.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2502 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Đã sửa lỗi kiến thức trong nội dung mới của T2502 (`db-064`..`db-067`, MyBatis, topic `db`):

- **db-067** (MyBatis resultMap, association/collection và N+1): đáp án gốc trộn API JPA/Hibernate vào MyBatis:
  - `@FetchType lazy` → không có trong MyBatis; MyBatis khai báo `fetchType="lazy"` trên `<association>`/`<collection>` trong resultMap. Đã sửa.
  - `session` → MyBatis dùng `SqlSession` (không phải JPA `Session`). Đã sửa thành `SqlSession`.
  - `LazyInitializationException (MyBatis cũng có)` → sai: đây là exception của Hibernate/JPA, MyBatis không có. Đã sửa thành "MyBatis ném lỗi hoặc trả dữ liệu rỗng (MyBatis không có LazyInitializationException như JPA/Hibernate)".

- `db-064`, `db-065`, `db-066`: đã đọc kỹ, không phát hiện lỗi kiến thức (MyBatis XML/annotation, `#{}` vs `${}` prepared statement, dynamic SQL if/where/foreach đều đúng).

## Nghiệm thu
`node --check js/data/q-spring-data.js` → OK. `node scripts/validate.js` → file `q-spring-data.js` không còn lỗi. Các LỖI còn lại của validator thuộc file khác, không thuộc quyền sở hữu task này (`q-frontend.js` topic `frontend` chưa có trong `topics.js`; `q-sql-extra.txt` chưa khai báo trong `data-manifest.js`) — không tự sửa theo luật 3 AGENTS.md.
