# T1397 — Nâng cấp đáp án q-spring-data: jpa-048 … db-043

Status: DONE
Agent: kilo
Owns: `js/data/q-spring-data.js`
After: T1395

> **Tinh giản (2026-11-09):** web chỉ dùng để tự ôn. Ưu tiên số 1 là **kiến thức đúng**; không cần đạt đủ độ dài/số từ, viết ngắn gọn, dễ hiểu là được. Mục nào không chắc đúng thì bỏ.

Nâng cấp 6 đáp án (field `a`) dưới đây cho đủ chuẩn AGENTS.md mục 6. Người học tự ôn, không có ai giảng thêm, nên phần bổ sung phải **cụ thể, đúng kỹ thuật, dễ hiểu**.

- `jpa-048` (5716 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `jpa-040` (3875 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `db-040` (5012 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `db-041` (5216 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `db-042` (5166 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `db-043` (4530 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu

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
- `jpa-048`: thêm `### Ví dụ đời thực` (orphanRemoval/unique conflict, ActionQueue insert trước delete, điều tra log SQL + Testcontainers, sửa bằng update-in-place/flush) và `### Trả lời mẫu khi phỏng vấn` (150–220 từ) ngay trước Senior tip. `follow` đã có sẵn.
- `jpa-040`: thêm `### Ví dụ đời thực` (N+1 101 query → 3-5 với default_batch_fetch_size, MultipleBagFetchException khi join fetch 2 bag) và `### Trả lời mẫu khi phỏng vấn` ngay trước Senior tip. `follow` đã có sẵn.
- `db-040`: thêm `### Ví dụ đời thực` (UUID v4 gây page split/bloat trên bảng events, đo pgstattuple/EXPLAIN BUFFERS, chuyển BIGINT/UUID v7) và `### Trả lời mẫu khi phỏng vấn` ngay trước Senior tip. `follow` đã có sẵn.
- `db-041`: thêm `### Ví dụ đời thực` (checkpoint spike, checkpoints_req cao, tăng max_wal_size/chia batch, p99 ổn định) và `### Trả lời mẫu khi phỏng vấn` ngay trước Senior tip. `follow` đã có sẵn.
- `db-042`: thêm `### Ví dụ đời thực` (deadlock 1213 do insert trùng unique/gap-next-key, đọc SHOW ENGINE INNODB STATUS, retry + sắp xếp khóa) và `### Trả lời mẫu khi phỏng vấn` ngay trước Senior tip. `follow` đã có sẵn.
- `db-043`: thêm `### Ví dụ đời thực` (HikariCP oversize + OSIV giữ kết nối, pending/timeout, giảm pool/tắt OSIV/leak detection) và `### Trả lời mẫu khi phỏng vấn` ngay trước Senior tip. `follow` đã có sẵn.
- Kiểm tra: `node --check js/data/q-spring-data.js` OK, `node scripts/build-light-index.js` OK, `node scripts/validate.js` → "OK — không có lỗi." (chỉ còn cảnh báo sẵn có `path.js: có 1 bài học không nằm trong PATH: lesson-design-007`). Không commit, không sửa file ngoài quyền sở hữu (git status còn nhiều thay đổi có sẵn từ trước).
Reviewed-by: kilo (T1397R)
