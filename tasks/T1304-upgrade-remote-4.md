# T1304 — Nâng cấp đáp án q-remote: remote-019 … remote-024

Status: DONE
Agent: kilo
Owns: `js/data/q-remote.js`
After: T1286

Nâng cấp 6 đáp án (field `a`) dưới đây cho đủ chuẩn AGENTS.md mục 6. Người học tự ôn, không có ai giảng thêm, nên phần bổ sung phải **cụ thể, đúng kỹ thuật, dễ hiểu**.

- `remote-019` (8753 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `remote-020` (6608 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `remote-021` (6181 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `remote-022` (6212 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `remote-023` (6744 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `remote-024` (6733 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu

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
- `remote-019`: thêm `### Ví dụ đời thực` (contractor vs EOR, dòng tiền/điều khoản thực tế, mạch triệu chứng→điều tra→nguyên nhân→xử lý→kết quả) và `### Trả lời mẫu khi phỏng vấn` ngay trước `> Senior tip:`. Đã có `follow`.
- `remote-020`: thêm `### Ví dụ đời thực` (live coding remote, think aloud, số liệu thời gian/độ phức tạp) và `### Trả lời mẫu khi phỏng vấn`.
- `remote-021`: thêm `### Ví dụ đời thực` (CV/LinkedIn quốc tế, metric p95, phản hồi recruiter) và `### Trả lời mẫu khi phỏng vấn`.
- `remote-022`: thêm `### Ví dụ đời thực` (neo lương thấp, đàm phán tổng gói/rate) và `### Trả lời mẫu khi phỏng vấn`.
- `remote-023`: thêm `### Ví dụ đời thực` (blocked async, retry/payment, giảm thời gian chờ quyết định) và `### Trả lời mẫu khi phỏng vấn`.
- `remote-024`: thêm `### Ví dụ đời thực` (visibility team quốc tế, paraphrase/pushback, kết quả sprint) và `### Trả lời mẫu khi phỏng vấn`.
- Kiểm tra: `node --check js/data/q-remote.js` OK. `node scripts/build-light-index.js` OK (index-light cập nhật). `node scripts/validate.js` báo 4 lỗi ở `lessons-testing.js` (`lesson-testing-005.body`, inline `{{}}` lồng ngoặc) — **file không thuộc quyền sở hữu T1304**, không sửa; `js/data/q-remote.js` không có lỗi mới từ thay đổi này. Không commit.
Reviewed-by: kilo (T1304R)
