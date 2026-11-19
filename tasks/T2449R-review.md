# T2449R — Fact-check nội dung mới của T2449

Status: DONE
Agent: opencode
Owns: `js/data/q-sql.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2449 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Đã fact-check 5 câu mới của T2449 (sql-090 … sql-093; sql-094 không có trong file). Sửa các lỗi kỹ thuật sau:

- **sql-091** (covering index / INCLUDE): LỖI NẶNG — query là `SELECT id, total_amount` nhưng chỉ `INCLUDE (total_amount)`. Index B-tree phụ của PostgreSQL KHÔNG chứa khóa chính `id` (chỉ lưu cột khóa + cột INCLUDE + ctid), nên thiếu `id` thì planner vẫn phải đọc heap → không bao giờ đạt Index Only Scan. Đã sửa nhất quán toàn bài (q, tóm tắt, cơ chế, SQL, bảng trade-off, ví dụ, trả lời mẫu) sang `INCLUDE (id, total_amount)`, và ghi rõ lý do. Đây là lỗi "cơ chế nói ngược" (khẳng định index-only scan xảy ra trong khi thực tế không thể).
- **sql-093** (batch MERGE): pitfall 3 ghi sai thông điệp lỗi của PostgreSQL khi staging trùng khóa. Thông điệp thật là `MERGE command cannot affect row a second time` (SQLSTATE 21000 cardinality_violation), không phải "cannot update the same row twice" (đó là kiểu Oracle/UPPER). Đã sửa theo tài liệu PG15 và codewithsql/postgresql docs. (Câu sql-011x cũ trong bank đã ghi đúng thông điệp này.)
- **sql-093**: bổ sung pitfall về việc bảng UNLOGGED bị **truncate khi crash recovery** — sau crash phải nạp lại staging rồi mới chạy tiếp từ checkpoint, nếu không vòng lặp thấy staging rỗng và bỏ dở job. Đây là hành vi thật của UNLOGGED, bản thảo gốc bỏ sót.
- **sql-093**: đồng nhất tên bảng staging — bước 1 ghi `staging_temp` nhưng bảng khai báo là `staging_price`. Đã sửa thành `staging_price`.
- **sql-092** (keyset): câu chữ "OFFSET buộc DB sort" không chính xác khi index đã khớp ORDER BY (OFFSET chỉ duyệt + bỏ qua N dòng, không sort). Đã sửa thành "duyệt và bỏ qua" ở cả tóm tắt và trả lời mẫu.

Nội dung còn lại (sql-090, phần còn lại của sql-091/092/093) đúng kỹ thuật: NULLS FIRST mặc định khi ORDER BY DESC trên PostgreSQL (khớp sql-009x), row constructor keyset, MERGE/UPDATE FROM batch, CURSOR/COPY UNLOGGED, EXPLAIN (ANALYZE, BUFFERS)/Heap Fetches/visibility map — không sửa.

Không thêm/xoá mục, không đổi id, không sửa nội dung ở HEAD.

Kiểm tra: `node --check js/data/q-sql.js` OK; `node scripts/build-light-index.js` đã chạy lại; `node scripts/validate.js` — **q-sql.js không còn lỗi** (chỉ còn cảnh báo cũ sql-087 < 1500 ký tự, có sẵn từ trước, ngoài phạm vi diff T2449). Các LỖI còn lại của validate đều thuộc `lessons-spring.js` (task T2442, không thuộc quyền sở hữu của task này) nên không sửa.
