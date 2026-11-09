# T1250 — Nâng cấp đáp án q-remote: remote-001 … remote-006

Status: DONE
Agent: kilo
Owns: `js/data/q-remote.js`

Nâng cấp 6 đáp án (field `a`) dưới đây cho đủ chuẩn AGENTS.md mục 6. Người học tự ôn, không có ai giảng thêm, nên phần bổ sung phải **cụ thể, đúng kỹ thuật, dễ hiểu**.

- `remote-001` (3887 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `remote-002` (6457 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `remote-003` (5730 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `remote-004` (6770 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `remote-005` (6843 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `remote-006` (5842 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu

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
- `remote-001`–`remote-006`: đã có sẵn (từ lần chạy trước) các mục `### Ví dụ đời thực`, `### Trả lời mẫu khi phỏng vấn` và field `follow` (2–3 câu). Độ dài `a` ~6623–10317 ký tự (đều >3000). Kiểm tra cú pháp: `q-remote.js` parse OK (vm sandbox, không backtick/`${` lỗi). Không chỉnh sửa nội dung thêm để tránh ghi đè phần tốt.
- `node scripts/validate.js` (sau kiểm tra): không báo lỗi thuộc `q-remote.js`/topic remote; chỉ còn lỗi sẵn có ngoài phạm vi task: `path.js` tham chiếu question/lesson không tồn tại (design/architecture/ai/banking lessons) và `index-light.js` đã cũ.
- `node scripts/build-light-index.js`: **không chạy được** do lỗi cú pháp có sẵn trong file ngoài quyền sở hữu `js/data/q-system-design.js:666` (`Unexpected identifier 'post'`). Theo luật 3, không sửa file đó; index-light chưa rebuild được từ phía task này. Integrator cần sửa `q-system-design.js` rồi chạy `node scripts/build-light-index.js` + `node scripts/validate.js`.
Reviewed-by: kilo (T1250R)
