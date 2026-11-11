# T1245 — Nâng cấp đáp án q-banking: banking-001 … banking-006

Status: DONE
Agent: kilo
Owns: `js/data/q-banking.js`

Nâng cấp 6 đáp án (field `a`) dưới đây cho đủ chuẩn AGENTS.md mục 6. Người học tự ôn, không có ai giảng thêm, nên phần bổ sung phải **cụ thể, đúng kỹ thuật, dễ hiểu**.

- `banking-001` (4499 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `banking-002` (4492 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `banking-003` (4471 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `banking-004` (4192 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `banking-005` (3949 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `banking-006` (3870 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu

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

Đã bổ sung cho 6 id banking-001…banking-006 trong js/data/q-banking.js (không đụng file khác):
- Thêm mục `### Ví dụ đời thực` (tình huống production có số liệu, mạch triệu chứng → điều tra → nguyên nhân gốc → xử lý → kết quả) và mục `### Trả lời mẫu khi phỏng vấn` (150–220 từ, ngôi thứ nhất, trong dấu ngoặc kép) ngay trước dòng `> Senior tip:` của mỗi id.
- Trường `follow` (2–3 câu) đã tồn tại sẵn cho tất cả 6 id, không cần thêm.
- Không sửa nội dung cũ, không thêm field mới, không dùng backtick/`${` trong đáp án.
- `node --check js/data/q-banking.js` OK; validate.js không báo lỗi nào liên quan banking.
- Ghi chú: `node scripts/build-light-index.js` bị crash tại `q-microservices.js:81` (lỗi cú pháp do backtick thô trong template literal) — file này do tác giả khác sửa (trong git status trước khi tôi bắt đầu), không thuộc task này nên tôi không được sửa; do đó `index-light.js` vẫn hiển thị "đã cũ" và validate.js không in OK toàn cục (các lỗi còn lại ở q-security, bugs, lessons-*, projects, path — không liên quan banking). Nhờ integrator xử lý q-microservices.js rồi chạy lại build-light-index + validate.
Reviewed-by: kilo (T1245R)
