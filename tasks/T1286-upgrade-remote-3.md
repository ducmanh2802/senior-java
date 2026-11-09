# T1286 — Nâng cấp đáp án q-remote: remote-013 … remote-018

Status: DONE
Agent: kilo
Owns: `js/data/q-remote.js`
After: T1268

Nâng cấp 6 đáp án (field `a`) dưới đây cho đủ chuẩn AGENTS.md mục 6. Người học tự ôn, không có ai giảng thêm, nên phần bổ sung phải **cụ thể, đúng kỹ thuật, dễ hiểu**.

- `remote-013` (6917 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `remote-014` (6799 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `remote-015` (7169 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `remote-016` (7250 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `remote-017` (9069 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `remote-018` (9017 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu

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

Đã thêm cho từng id remote-013, remote-014, remote-015, remote-016, remote-017, remote-018 (file js/data/q-remote.js):
- Mục `### Ví dụ đời thực` (700–1200 ký tự): tình huống → triệu chứng → điều tra → nguyên nhân gốc → cách xử lý → kết quả đo được, khớp cơ chế đáp án, không bịa con số/API.
- Mục `### Trả lời mẫu khi phỏng vấn` (150–220 từ, người đầu, trong ngoặc kép), chèn ngay trước `> Senior tip:`.
- Trường `follow` đã có sẵn (2–3 câu) nên không thêm lại.
- Không sửa nội dung đã có, không đụng câu hỏi khác, không sửa file khác.
- Chạy `node scripts/build-light-index.js` (OK) rồi `node scripts/validate.js`: file q-remote.js không báo lỗi, cú pháp OK (`node --check`). Các LỖI còn lại của validate nằm ở q-kotlin.js, q-claude.js, q-english.js, lessons-testing.js, path.js — file không sở hữu, do agent khác sửa trước đó.
Reviewed-by: kilo (T1286R)
