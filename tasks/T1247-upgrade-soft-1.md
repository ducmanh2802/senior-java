# T1247 — Nâng cấp đáp án q-soft: testing-001 … testing-009

Status: DONE
Agent: kilo
Owns: `js/data/q-soft.js`

Nâng cấp 6 đáp án (field `a`) dưới đây cho đủ chuẩn AGENTS.md mục 6. Người học tự ôn, không có ai giảng thêm, nên phần bổ sung phải **cụ thể, đúng kỹ thuật, dễ hiểu**.

- `testing-001` (3067 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `testing-002` (3073 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `testing-004` (3185 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `testing-005` (3647 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `testing-007` (3353 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `testing-009` (3322 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu

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
- `testing-004`: thêm `### Ví dụ đời thực` (order-service/payment-service, trường {{amount}} đổi tên thành {{totalAmount}} gây HTTP 500, Pact Broker chặn 3 breaking change) và `### Trả lời mẫu khi phỏng vấn` (ngôi thứ nhất, ~180 từ) trước `> Senior tip:`. Đã có `follow`.
- `testing-007`: thêm `### Ví dụ đời thực` (flash sale 800 đơn/s, k6 {{ramping-arrival-rate}}, p99 3.2s→420ms do index+pool+cache) và `### Trả lời mẫu khi phỏng vấn` (ngôi thứ nhất, ~180 từ) trước `> Senior tip:`. Đã có `follow`.
- `testing-009`: thêm `### Ví dụ đời thực` (19% đỏ ngẫu nhiên trên main, quy trình 5 bước cô lập flaky, flake 19%→1.5%, CFR 14%→7%) và `### Trả lời mẫu khi phỏng vấn` (ngôi thứ nhất, ~190 từ) trước `> Senior tip:`. Đã có `follow`.
- `testing-001`, `testing-002`, `testing-005`: đã có đầy đủ `### Ví dụ đời thực`, `### Trả lời mẫu khi phỏng vấn` và `follow`, không cần thêm.
- Kiểm tra: `node --check js/data/q-soft.js` OK; `node scripts/validate.js` không còn lỗi nào thuộc `q-soft.js` (lỗi còn lại là pre-existing ở file khác: `q-claude.js` syntax, `lessons-claude.js`/`projects.js`/`path.js` refs claude-XXX, `index-light.js` cũ). `node scripts/build-light-index.js` thất bại do lỗi cú pháp pre-existing tại `q-claude.js:63` (không thuộc task, chỉ index [id,topic,level] nên không ảnh hưởng bởi sửa field `a`). Không sửa file ngoài phạm vi, không commit.
