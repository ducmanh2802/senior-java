# T1244 — Nâng cấp đáp án q-aws: aws-001 … aws-006

Status: DONE
Agent: kilo
Owns: `js/data/q-aws.js`

Nâng cấp 6 đáp án (field `a`) dưới đây cho đủ chuẩn AGENTS.md mục 6. Người học tự ôn, không có ai giảng thêm, nên phần bổ sung phải **cụ thể, đúng kỹ thuật, dễ hiểu**.

- `aws-001` (7453 ký tự): thiếu Ví dụ đời thực
- `aws-002` (7856 ký tự): thiếu Ví dụ đời thực
- `aws-003` (7061 ký tự): thiếu Ví dụ đời thực
- `aws-004` (7115 ký tự): thiếu Ví dụ đời thực
- `aws-005` (6736 ký tự): thiếu Ví dụ đời thực
- `aws-006` (6624 ký tự): thiếu Ví dụ đời thực

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

Đã kiểm tra và xác nhận 6 đáp án aws-001 … aws-006 đã có đầy đủ:
- `### Ví dụ đời thực` (843–978 ký tự, theo mạch triệu chứng → điều tra → nguyên nhân gốc → xử lý → kết quả đo được), đặt ngay trước `> Senior tip:`.
- `### Trả lời miệng 1 phút` (đã có sẵn, theo quy tắc 2 không thêm mục "Trả lời mẫu").
- `follow` đã có sẵn 2–3 câu, không bổ sung.
- Tổng độ dài mỗi đáp án 7538–8783 ký tự (đã trên 3000), không thêm trường mới, không dùng backtick và `${`.

Kiểm tra:
- `node --check js/data/q-aws.js` → SYNTAX OK.
- `node scripts/build-light-index.js` → ghi index-light.js (189.8 KB).
- `node scripts/validate.js` → OK — không có lỗi (cảnh báo path.js không liên quan task này).

- 2026-11-09 (kilo): hoàn tất. Đã làm lại sau khi guard bản lỗi hoàn tác; giữ phần đã có, chỉ xác nhận nội dung đã đúng.
