# T1257 — Nâng cấp đáp án q-sql: sql-007 … sql-012

Status: DONE
Agent: kilo
Owns: `js/data/q-sql.js`
After: T1239

Nâng cấp 6 đáp án (field `a`) dưới đây cho đủ chuẩn AGENTS.md mục 6. Người học tự ôn, không có ai giảng thêm, nên phần bổ sung phải **cụ thể, đúng kỹ thuật, dễ hiểu**.

- `sql-007` (6591 ký tự): thiếu Ví dụ đời thực
- `sql-008` (7945 ký tự): thiếu Ví dụ đời thực
- `sql-009` (7643 ký tự): thiếu Ví dụ đời thực
- `sql-010` (9520 ký tự): thiếu Ví dụ đời thực
- `sql-011` (7150 ký tự): thiếu Ví dụ đời thực
- `sql-012` (8437 ký tự): thiếu Ví dụ đời thực

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
- sql-007: thêm `### Ví dụ đời thực` (login streak sai do không DISTINCT ngày + lệch múi giờ UTC; điều tra login_history/ROW_NUMBER; xử lý DISTINCT + AT TIME ZONE + CTE; kết quả 2,8%→0%, 3–8 ms). Chèn ngay trước Senior tip.
- sql-008: thêm `### Ví dụ đời thực` (pivot động báo cáo trạng thái×tháng lỗi khi thêm CHARGEBACK; xử lý pivot tĩnh CASE WHEN + truy vấn long đối chiếu; 6,5s→1,9s, khớp 100%).
- sql-009: thêm `### Ví dụ đời thực` (cây danh mục N+1 ~430 query, timeout; có self-ref/cycle, thiếu index parent_id; xử lý Recursive CTE + path/ANY + depth + index; 22s→180ms, 430→1 query).
- sql-010: thêm `### Ví dụ đời thực` (upsert check-then-act race, 20–60 duplicate key/ngày, mất updated_at; xử lý INSERT ON CONFLICT + WHERE updated_at < EXCLUDED, JdbcTemplate; 0 lỗi/14 ngày, p95 -18ms).
- sql-011: thêm `### Ví dụ đời thực` (dashboard "đơn chưa gán kho" sai do NULL với <>; 320 đơn bị bỏ sót; xử lý IS NULL/IS DISTINCT FROM/COALESCE + quy ước review; khớp 320 đơn, phát hiện thêm 2 lỗi).
- sql-012: thêm `### Ví dụ đời thực` (DELETE staging 18M dòng, 47 phút, ~12GB WAL, dead tuple; xử lý TRUNCATE RESTART IDENTITY trong transaction PostgreSQL, nêu khác biệt Oracle/MySQL DDL implicit commit; <1s, WAL ~0, p95 90s→4s).
- Tất cả giữ nguyên nội dung cũ và `follow`; đã có mục trả lời miệng tương đương nên không thêm trùng. Không dùng backtick/`${`, dùng `{{code}}`.
- `node --check js/data/q-sql.js` OK. `node scripts/validate.js`: không còn lỗi thuộc `js/data/q-sql.js` (các lỗi còn lại là pre-existing ở file không thuộc task: q-microservices.js cú pháp, q-security.js inline code lồng, related-id ở bugs/lessons/projects/path, index-light cũ do build-light-index thất bại trên q-microservices.js). `node scripts/build-light-index.js` không chạy hết do lỗi cú pháp pre-existing ở `q-microservices.js` (không sở hữu, không sửa).
- 2026-11-09 05:10 (Claude): đặt lại TODO — phần đã làm bị guard bản lỗi hoàn tác (đêm 8/11). Làm lại; giữ phần đã có nếu còn trong file.
Reviewed-by: kilo (T1257R)
