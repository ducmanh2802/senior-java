# T1239 — Nâng cấp đáp án q-sql: sql-001 … sql-006

Status: DONE
Agent: kilo
Owns: `js/data/q-sql.js`

Nâng cấp 6 đáp án (field `a`) dưới đây cho đủ chuẩn AGENTS.md mục 6. Người học tự ôn, không có ai giảng thêm, nên phần bổ sung phải **cụ thể, đúng kỹ thuật, dễ hiểu**.

- `sql-001` (7002 ký tự): thiếu Ví dụ đời thực
- `sql-002` (7472 ký tự): thiếu Ví dụ đời thực
- `sql-003` (7468 ký tự): thiếu Ví dụ đời thực
- `sql-004` (7242 ký tự): thiếu Ví dụ đời thực
- `sql-005` (6162 ký tự): thiếu Ví dụ đời thực
- `sql-006` (7359 ký tự): thiếu Ví dụ đời thực

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
- `sql-001`–`sql-006`: thêm mục `### Ví dụ đời thực` (triệu chứng → điều tra/lệnh EXPLAIN & metric → nguyên nhân gốc → xử lý → kết quả đo được) ngay trước `> Senior tip:`. Không thêm "Trả lời miệng 1 phút"/"Trả lời mẫu" vì cả 6 câu đã có mục tương đương; `follow` đã có sẵn (2 câu mỗi id). Không xoá/sửa nội dung cũ, không đụng câu khác.
- Kiểm tra: `node --check js/data/q-sql.js` OK. `node scripts/validate.js` chạy xong, phần LỖI **không có** lỗi nào thuộc `q-sql.js` (sql vẫn nạp 38 câu); các lỗi còn lại là pre-existing ở file khác (q-spring-data.js syntax, q-system-design.js, q-concurrency-jvm.js inline-code, related refs bugs/lessons/projects/path/index-light) — không thuộc phạm vi task, không sửa.
- `node scripts/build-light-index.js` hiện thất bại do lỗi cú pháp pre-existing tại `js/data/q-spring-data.js:123` (Unexpected token '}'), không do thay đổi `q-sql.js`. Cần sửa `q-spring-data.js` (file không thuộc task) rồi chạy lại build-light-index theo luật nghiệm thu.
Reviewed-by: kilo (T1239R)
