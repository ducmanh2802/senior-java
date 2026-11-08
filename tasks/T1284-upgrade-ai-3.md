# T1284 — Nâng cấp đáp án q-ai: ai-014 … ai-019

Status: DONE
Agent: kilo
Owns: `js/data/q-ai.js`
After: T1266

Nâng cấp 6 đáp án (field `a`) dưới đây cho đủ chuẩn AGENTS.md mục 6. Người học tự ôn, không có ai giảng thêm, nên phần bổ sung phải **cụ thể, đúng kỹ thuật, dễ hiểu**.

- `ai-014` (3996 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `ai-015` (3396 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `ai-016` (4055 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `ai-017` (3611 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `ai-018` (4208 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `ai-019` (3687 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu

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
- Đã nâng cấp 6 đáp án trong `js/data/q-ai.js` (chỉ thêm nội dung, đặt ngay trước `> Senior tip:` của từng id): `ai-014`, `ai-015`, `ai-016`, `ai-017`, `ai-018`, `ai-019` — mỗi câu thêm `### Ví dụ đời thực` (triệu chứng → điều tra (lệnh/metric/log cụ thể) → nguyên nhân gốc → cách xử lý → kết quả đo được, có số liệu) và `### Trả lời mẫu khi phỏng vấn` (ngôi thứ nhất, 150–220 từ, trong ngoặc kép). Không xoá/sửa nội dung cũ, không đụng câu khác, không dùng backtick/`${`, dùng `{{code}}`/`~~~` đúng chuẩn.
- Kiểm tra: `node --check js/data/q-ai.js` OK. Độ dài phần `a` (ước lượng): ai-014=7147, ai-015=6628, ai-016=7634, ai-017=7118, ai-018=7859, ai-019=7124; tất cả có Ví dụ đời thực, Trả lời mẫu, follow.
- `node scripts/validate.js`: không có lỗi liên quan `q-ai` (các lỗi còn lại là pre-existing ở `lessons-*`, `projects.js`, `path.js` và `index-light.js` cũ — ngoài phạm vi task).
- `node scripts/build-light-index.js` **không chạy được** do lỗi pre-existing ngoài file sở hữu: `js/data/q-microservices.js:81` gây `SyntaxError: Unexpected identifier 'kubectl'` trong loader của script (không thuộc task này, tôi không sửa). Cần integrator xử lý `q-microservices.js` rồi chạy lại `node scripts/build-light-index.js`.
Reviewed-by: kilo (T1284R)
