# T1275 — Nâng cấp đáp án q-sql: sql-013 … sql-018

Status: DONE
Agent: kilo
Owns: `js/data/q-sql.js`
After: T1257

Nâng cấp 6 đáp án (field `a`) dưới đây cho đủ chuẩn AGENTS.md mục 6. Người học tự ôn, không có ai giảng thêm, nên phần bổ sung phải **cụ thể, đúng kỹ thuật, dễ hiểu**.

- `sql-013` (8468 ký tự): thiếu Ví dụ đời thực
- `sql-014` (8748 ký tự): thiếu Ví dụ đời thực
- `sql-015` (7488 ký tự): thiếu Ví dụ đời thực
- `sql-016` (6983 ký tự): thiếu Ví dụ đời thực
- `sql-017` (8110 ký tự): thiếu Ví dụ đời thực
- `sql-018` (8126 ký tự): thiếu Ví dụ đời thực

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

Đã thêm mục `### Ví dụ đời thực` (700-1200 ký tự) cho 6 câu hỏi:
- sql-013: job phát hiện gian lận dùng window AVG RANGE, false positive 85% → 12%, p95 38s → 2.1s
- sql-014: báo cáo doanh thu lệch 1.8 tỷ do EXTRACT(MONTH) + múi giờ, sửa half-open interval → khớp 100%, query 8.4s → 0.18s
- sql-015: API tìm đơn hàng timeout 28s do Seq Scan, Rows Removed by Filter 21.9M, thêm partial index → p95 45ms
- sql-016: đối soát staging order mismatch 18.4k do trùng khóa + lệch múi giờ, dedupe + unique index + chuẩn hoá UTC → mismatch 127, query 6.8s → 1.4s
- sql-017: planner ước sai 600 lần do giá trị hiếm ngoài MCV + cột tương quan, CREATE STATISTICS + force_custom_plan → estimate 12M → 22k, p95 28s → 85ms
- sql-018: inbox tin nhắn chậm 8.2s do index full + bind parameter bỏ qua partial index, tạo partial/covering index + viết cứng predicate → p95 12ms, index size 42GB → 600MB

Tất cả 6 câu đã có sẵn `Trả lời miệng 1 phút` và `follow` field, không cần thêm. `node scripts/validate.js` chạy OK cho q-sql.js.
Reviewed-by: kilo (T1275R)
