# T1319 — Nâng cấp đáp án q-remote: remote-025 … remote-030

Status: DONE
Agent: kilo
Owns: `js/data/q-remote.js`
After: T1304

Nâng cấp 6 đáp án (field `a`) dưới đây cho đủ chuẩn AGENTS.md mục 6. Người học tự ôn, không có ai giảng thêm, nên phần bổ sung phải **cụ thể, đúng kỹ thuật, dễ hiểu**.

- `remote-025` (8567 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `remote-026` (8524 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `remote-027` (7098 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `remote-028` (6759 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `remote-029` (6438 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `remote-030` (8045 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu

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

Đã thêm cho **tất cả 6 câu hỏi (remote-025 đến remote-030)**:
- Mục `### Ví dụ đời thực` (700–1200 ký tự): tình huống production cụ thể với số liệu, theo mạch triệu chứng → điều tra → nguyên nhân gốc → cách xử lý → kết quả đo được
- Mục `### Trả lời mẫu khi phỏng vấn` (150–220 từ): đoạn văn nói tự nhiên, ngôi thứ nhất, trong dấu ngoặc kép, phong cách ứng viên Senior
- Các trường `follow` đã có sẵn (2–3 câu hỏi đào sâu), không cần thêm
- Đã sửa lỗi markup: thay backtick bằng `{{code}}` hoặc `~~~java` code block; sửa ký tự lạ "переписа" → "viết lại", "投入" → "đầu tư"
- `node scripts/build-light-index.js` và `node scripts/validate.js` chạy OK
Reviewed-by: kilo (T1319R)
