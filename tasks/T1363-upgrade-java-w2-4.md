# T1363 — Nâng cấp đáp án q-java: modern-032 … modern-038

Status: DONE
Agent: kilo
Owns: `js/data/q-java.js`
After: T1354

> **Tinh giản (2026-11-09):** web chỉ dùng để tự ôn. Ưu tiên số 1 là **kiến thức đúng**; không cần đạt đủ độ dài/số từ, viết ngắn gọn, dễ hiểu là được. Mục nào không chắc đúng thì bỏ.

Nâng cấp 6 đáp án (field `a`) dưới đây cho đủ chuẩn AGENTS.md mục 6. Người học tự ôn, không có ai giảng thêm, nên phần bổ sung phải **cụ thể, đúng kỹ thuật, dễ hiểu**.

- `modern-032` (1508 ký tự): ngắn, thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `modern-033` (1073 ký tự): ngắn, thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `modern-034` (1550 ký tự): ngắn, thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `modern-035` (1444 ký tự): ngắn, thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `modern-037` (1108 ký tự): ngắn, thiếu Ví dụ đời thực, thiếu Trả lời mẫu, thiếu follow
- `modern-038` (4594 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu

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
- modern-032: thêm `### Ví dụ đời thực`, `### Trả lời mẫu khi phỏng vấn` (trước `> Senior tip:`), bổ sung cơ chế/bảng so sánh; giữ nội dung cũ, có follow (2 câu).
- modern-033: thêm `### Ví dụ đời thực`, `### Trả lời mẫu khi phỏng vấn`, bổ sung so sánh lựa chọn thay thế/mẹo thực tế; có follow (2 câu).
- modern-034: thêm `### Ví dụ đời thực`, `### Trả lời mẫu khi phỏng vấn`, bổ sung giải thích cơ chế/so sánh; có follow (2 câu).
- modern-035: thêm `### Ví dụ đời thực`, `### Trả lời mẫu khi phỏng vấn`; có follow (2 câu).
- modern-037: thêm `### Ví dụ đời thực`, `### Trả lời mẫu khi phỏng vấn`, bổ sung so sánh/lưu ý test; mở rộng `follow` lên 3 câu.
- modern-038: thêm `### Ví dụ đời thực`, `### Trả lời mẫu khi phỏng vấn` (trước `> Senior tip:`); giữ nội dung và follow hiện có.
- Đã chạy `node scripts/build-light-index.js` và `node scripts/validate.js`. `q-java.js` syntax OK; `validate.js` vẫn còn lỗi/cảnh báo có sẵn ngoài phạm vi task (ví dụ `q-spring-data.js` syntax, nhiều related refs hỏng ở bugs/lessons/projects/path, warning path). Không sửa file ngoài sở hữu, không commit.
Reviewed-by: kilo (T1363R)
