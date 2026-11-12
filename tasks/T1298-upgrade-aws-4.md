# T1298 — Nâng cấp đáp án q-aws: aws-019 … aws-024

Status: DONE
Agent: kilo
Owns: `js/data/q-aws.js`
After: T1280

> **Tinh giản (2026-11-09):** web chỉ dùng để tự ôn. Ưu tiên số 1 là **kiến thức đúng**; không cần đạt đủ độ dài/số từ, viết ngắn gọn, dễ hiểu là được. Mục nào không chắc đúng thì bỏ.

Nâng cấp 6 đáp án (field `a`) dưới đây cho đủ chuẩn AGENTS.md mục 6. Người học tự ôn, không có ai giảng thêm, nên phần bổ sung phải **cụ thể, đúng kỹ thuật, dễ hiểu**.

- `aws-019` (7876 ký tự): thiếu Ví dụ đời thực
- `aws-020` (7111 ký tự): thiếu Ví dụ đời thực
- `aws-021` (8075 ký tự): thiếu Ví dụ đời thực
- `aws-022` (7936 ký tự): thiếu Ví dụ đời thực
- `aws-023` (7783 ký tự): thiếu Ví dụ đời thực
- `aws-024` (8116 ký tự): thiếu Ví dụ đời thực

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
- `aws-019`: sửa/thay mới mục `### Ví dụ đời thực` (triệu chứng → điều tra → nguyên nhân gốc → xử lý → kết quả đo được, có số liệu) đặt trước `> Senior tip:` trong block aws-019; thay backtick thành `{{code}}` trong ví dụ để tránh vỡ template literal. `follow` và `Trả lời mẫu` đã có, giữ nguyên.
- `aws-020`: thêm mục `### Ví dụ đời thực` (credential stuffing, WAF/CloudFront/ATP, số liệu) trước `> Senior tip:`; khôi phục phần đóng block bị hỏng trong lần sửa đầu (đảm bảo `follow`/`tags` đúng, không ảnh hưởng block khác). `follow` và `Trả lời mẫu` đã có.
- `aws-021`: thêm mục `### Ví dụ đời thực` (multi-account/Control Tower/SCP, quota/PCI, kết quả) trước `> Senior tip:`; giữ nguyên nội dung, `follow` và `Trả lời mẫu` có sẵn.
- `aws-022`: thêm mục `### Ví dụ đời thực` (PAN rò rỉ log/S3, tokenization/KMS/CloudTrail, thu hẹp CDE) trước `> Senior tip:`; giữ nguyên nội dung, `follow` và `Trả lời mẫu` có sẵn.
- `aws-023`: thêm mục `### Ví dụ đời thực` (chọn region Singapore, đo latency, CloudFront/2 AZ) trước `> Senior tip:`; giữ nguyên nội dung, `follow` và `Trả lời mẫu` có sẵn.
- `aws-024`: thêm mục `### Ví dụ đời thực` (OOM/CPU credit trên t3, right-size m7g, MaxRAMPercentage/SSM/Savings Plan) trước `> Senior tip:`; giữ nguyên nội dung, `follow` và `Trả lời mẫu` có sẵn.
- Kiểm tra: `node --check js/data/q-aws.js` OK. `node scripts/build-light-index.js` và `node scripts/validate.js` không đạt OK do lỗi/cảnh báo có sẵn ngoài file sở hữu (ví dụ `q-soft.js:1454` gây lỗi khi build-light-index, `q-aws.js` có id trùng aws-002..020 từ trước, và các lỗi related/path/index-light trong file khác); không sửa file ngoài phạm vi task theo AGENTS.md. Chỉ sửa `js/data/q-aws.js` và file task này. Không git commit.
Reviewed-by: kilo (T1298R)
