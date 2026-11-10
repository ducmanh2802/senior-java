# T1274 — Nâng cấp đáp án q-spring-data: db-002 … db-007

Status: DONE
Agent: kilo
Owns: `js/data/q-spring-data.js`
After: T1256

> **Tinh giản (2026-11-09):** web chỉ dùng để tự ôn. Ưu tiên số 1 là **kiến thức đúng**; không cần đạt đủ độ dài/số từ, viết ngắn gọn, dễ hiểu là được. Mục nào không chắc đúng thì bỏ.

Nâng cấp 6 đáp án (field `a`) dưới đây cho đủ chuẩn AGENTS.md mục 6. Người học tự ôn, không có ai giảng thêm, nên phần bổ sung phải **cụ thể, đúng kỹ thuật, dễ hiểu**.

- `db-002` (7995 ký tự): thiếu Ví dụ đời thực
- `db-003` (6667 ký tự): thiếu Ví dụ đời thực
- `db-004` (7397 ký tự): thiếu Ví dụ đời thực
- `db-005` (6094 ký tự): thiếu Ví dụ đời thực
- `db-006` (7427 ký tự): thiếu Ví dụ đời thực
- `db-007` (7312 ký tự): thiếu Ví dụ đời thực

Với MỖI id ở trên:
1. **Thiếu Ví dụ đời thực** → thêm mục `### Ví dụ đời thực` (700–1200 ký tự): một tình huống production cụ thể, có số liệu, đi theo mạch **triệu chứng → điều tra (lệnh/metric/log cụ thể) → nguyên nhân gốc → cách xử lý → kết quả đo được**. Phải khớp với cơ chế mà đáp án đã giải thích; không bịa API, flag, tham số cấu hình hay tên metric. Không chắc thì viết ít lại nhưng đúng.
2. **Thiếu Trả lời mẫu** → thêm mục `### Trả lời mẫu khi phỏng vấn`: một đoạn văn nói tự nhiên 150–220 từ, ngôi thứ nhất, đặt trong dấu ngoặc kép, như ứng viên Senior trả lời thật (ý chính → cơ chế → trade-off → kinh nghiệm thực tế). Nếu đáp án đã có mục tương đương (ví dụ "Trả lời miệng 1 phút") thì KHÔNG thêm.
3. **Ngắn** (< 3000 ký tự) → bổ sung thêm phần giải thích cơ chế (`### Cơ chế từng bước` hoặc bảng so sánh, pitfall production) để đáp án đạt 3000–5000 ký tự.
4. Chèn các mục mới **ngay trước** dòng `> Senior tip:` (Senior tip luôn ở cuối). Viết tiếng Việt **có dấu đầy đủ**; thuật ngữ kỹ thuật giữ tiếng Anh.
5. **Thiếu follow** → thêm field `follow: [...]` gồm 2–3 câu hỏi đào sâu mà interviewer hay hỏi tiếp.

Luật:
- **Chỉ thêm**, không xoá/viết lại nội dung đã có, không đụng câu hỏi khác ngoài danh sách.
- File rất lớn: **sửa bằng công cụ edit theo từng đoạn nhỏ** (tìm đúng dòng `> Senior tip:` của id đó). **TUYỆT ĐỐI KHÔNG ghi lại toàn bộ file**, không sửa file nào khác (có cơ chế tự khôi phục file không thuộc task).
- Markup: dùng `{{code}}` cho inline code (không lồng dấu ngoặc nhọn bên trong), `~~~java` cho code block. KHÔNG dùng backtick và `${` trong đáp án.

Nghiệm thu:
- `node scripts/build-light-index.js` rồi `node scripts/validate.js` → OK. KHÔNG commit.
- Ghi `Status: DONE` (sửa dòng Status ở đầu file) + Notes ngắn: id nào thêm mục gì.

## Notes
- `db-002`: thêm `### Ví dụ đời thực` (lost update số dư ví, PostgreSQL READ COMMITTED, nguyên tử + FOR UPDATE + CHECK). Đã có `follow` và `Trả lời miệng 1 phút`.
- `db-003`: thêm `### Ví dụ đời thực` (query orders chậm, EXPLAIN ANALYZE/pg_stat_statements, thống kê lệch + thiếu index, ANALYZE + index composite). Đã có `follow` và `Trả lời miệng 1 phút`.
- `db-004`: thêm `### Ví dụ đời thực` (deadlock chuyển tiền MySQL/InnoDB, SHOW ENGINE INNODB STATUS, thứ tự khoá + retry). Đã có `follow` và `Trả lời miệng 1 phút`.
- `db-005`: thêm `### Ví dụ đời thực` (phân trang sâu OFFSET trên bảng transactions, slow query/EXPLAIN, chuyển keyset + bỏ COUNT). Đã có `follow` và `Trả lời miệng 1 phút`.
- `db-006`: thêm `### Ví dụ đời thực` (SaaS events lớn, partition theo tháng + read-your-writes, chuẩn bị shard tenant). Đã có `follow` và `Trả lời miệng 1 phút`.
- `db-007`: thêm `### Ví dụ đời thực` (HikariCP pool cạn do HTTP trong @Transactional, leak-detection-threshold, tách transaction + tắt open-in-view). Đã có `follow` và `Trả lời miệng 1 phút`.
- Chạy `node scripts/build-light-index.js` và `node scripts/validate.js` → OK (cảnh báo sẵn có: `lesson-design-007` không nằm trong PATH).
Reviewed-by: kilo (T1274R)
