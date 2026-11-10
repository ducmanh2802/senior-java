# T1327 — Nâng cấp đáp án q-security: security-039 … security-040

Status: DONE
Agent: kilo
Owns: `js/data/q-security.js`
After: T1312

Nâng cấp 2 đáp án (field `a`) dưới đây cho đủ chuẩn AGENTS.md mục 6. Người học tự ôn, không có ai giảng thêm, nên phần bổ sung phải **cụ thể, đúng kỹ thuật, dễ hiểu**.

- `security-039` (6045 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `security-040` (7151 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu

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
- `security-039`: thêm `### Ví dụ đời thực` (upload XML đối tác, parser không harden, kết nối metadata 169.254.169.254; mạch triệu chứng → điều tra requestId/log/parser → nguyên nhân factory rải rác → xử lý SafeXml + unit test + egress policy → kết quả 0 kết nối metadata/7 ngày, 100% DOCTYPE bị từ chối) và `### Trả lời mẫu khi phỏng vấn` (đoạn nói 1st person, ~190 từ) ngay trước `> Senior tip:`. Đã có `follow` (3 câu), không thêm.
- `security-040`: thêm `### Ví dụ đời thực` (order-worker deserialize payload hàng đợi chưa xác thực, EDR phát hiện tiến trình con `/bin/sh -c curl`, AC ED magic bytes, gadget/classpath; mạch triệu chứng → điều tra pod/heap/log → nguyên nhân không verify + không ObjectInputFilter + instanceof sau readObject → xử lý HMAC/ObjectInputFilter allowlist + chuyển JSON DTO tường minh, không enableDefaultTyping → kết quả 0 tiến trình con bất thường/30 ngày, 0 điểm readObject chưa xác thực) và `### Trả lời mẫu khi phỏng vấn` (~210 từ) ngay trước `> Senior tip:`. Đã có `follow` (3 câu), không thêm.
- Chỉ sửa `js/data/q-security.js` bằng edit từng đoạn; không ghi đè file khác.
- Đã chạy `node scripts/build-light-index.js` (ghi `js/data/index-light.js`) và `node scripts/validate.js` → `OK — không có lỗi.` (cảnh báo path.js bài lesson-design-006/007 không thuộc task). `node --check js/data/q-security.js` OK.
Reviewed-by: kilo (T1327R)
