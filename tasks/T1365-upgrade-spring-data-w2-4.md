# T1365 — Nâng cấp đáp án q-spring-data: db-025 … db-030

Status: DONE
Agent: kilo
Owns: `js/data/q-spring-data.js`
After: T1356

> **Tinh giản (2026-11-09):** web chỉ dùng để tự ôn. Ưu tiên số 1 là **kiến thức đúng**; không cần đạt đủ độ dài/số từ, viết ngắn gọn, dễ hiểu là được. Mục nào không chắc đúng thì bỏ.

Nâng cấp 6 đáp án (field `a`) dưới đây cho đủ chuẩn AGENTS.md mục 6. Người học tự ôn, không có ai giảng thêm, nên phần bổ sung phải **cụ thể, đúng kỹ thuật, dễ hiểu**.

- `db-025` (5740 ký tự): thiếu Ví dụ đời thực
- `db-026` (6437 ký tự): thiếu Ví dụ đời thực
- `db-027` (6392 ký tự): thiếu Ví dụ đời thực
- `db-028` (6474 ký tự): thiếu Ví dụ đời thực
- `db-029` (6108 ký tự): thiếu Ví dụ đời thực
- `db-030` (6182 ký tự): thiếu Ví dụ đời thực

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

Đã thêm mục `### Ví dụ đời thực` (700–1200 ký tự, mạch triệu chứng → điều tra → nguyên nhân gốc → xử lý → kết quả) vào 6 đáp án: db-025 (Redis persistence), db-026 (Oracle REF CURSOR qua Spring JDBC), db-027 (fetch size/BULK COLLECT), db-028 (sequence/identity sau migrate), db-029 (execution plan/hint), db-030 (migrate Oracle sang PostgreSQL đối soát). Mỗi mục chèn ngay trước dòng `> Senior tip:` của id tương ứng. Các đáp án đã có `Trả lời miệng 1 phút` (đương với `### Trả lời mẫu khi phỏng vấn`) và field `follow` nên không thêm lại; độ dài đã >3000 ký tự nên không bổ sung cơ chế. Chỉ thêm, không xoá/viết lại nội dung cũ.Reviewed-by: kilo (T1365R)
