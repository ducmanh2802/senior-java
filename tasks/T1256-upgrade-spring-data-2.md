# T1256 — Nâng cấp đáp án q-spring-data: spring-014 … db-001

Status: DONE
Agent: kilo
Owns: `js/data/q-spring-data.js`
After: T1238

> **Tinh giản (2026-11-09):** web chỉ dùng để tự ôn. Ưu tiên số 1 là **kiến thức đúng**; không cần đạt đủ độ dài/số từ, viết ngắn gọn, dễ hiểu là được. Mục nào không chắc đúng thì bỏ.

Nâng cấp 6 đáp án (field `a`) dưới đây cho đủ chuẩn AGENTS.md mục 6. Người học tự ôn, không có ai giảng thêm, nên phần bổ sung phải **cụ thể, đúng kỹ thuật, dễ hiểu**.

- `spring-014` (3254 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `spring-015` (3494 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `jpa-001` (3280 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `jpa-005` (3146 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `jpa-007` (3313 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `db-001` (7878 ký tự): thiếu Ví dụ đời thực

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

- `spring-014`: đã có cả hai mục, nhưng sửa backticks trong template literal thành `{{code}}` markup và fix indentation tiêu đề.
- `spring-015`: đã có cả hai mục, nhưng fix indentation tiêu đề và xoá dấu phẩy thừa ở Senior tip.
- `jpa-001`: thêm `### Ví dụ đời thực` (import 150k đơn N+1 → 2.8s→45ms) và `### Trả lời mẫu khi phỏng vấn`.
- `jpa-005`: thêm `### Ví dụ đời thực` (IDENTITY chặn batching, 150k dòng 22ph→3.5ph) và `### Trả lời mẫu khi phỏng vấn`.
- `jpa-007`: thêm `### Ví dụ đời thực` (L2 cache chung region gây invalidation lan, hit rate 98%→85%) và `### Trả lời mẫu khi phỏng vấn`.
- `db-001`: thêm `### Ví dụ đời thực` (covering index + expression index, 1.2s→45ms, Seq Scan 8s→12ms). Đã có `### Trả lời miệng 1 phút` (tương đương Trả lời mẫu).
- `node scripts/validate.js q-spring-data.js` chỉ báo lỗi `index-light.js` cũ do `build-light-index.js` fail ở `q-banking.js` (lỗi cú pháp có sẵn, không thuộc task này). File `q-spring-data.js` validate sạch.
Reviewed-by: kilo (T1256R)
