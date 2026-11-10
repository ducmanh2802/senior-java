# T1443 — Nâng cấp đáp án q-api: api-011 … api-016

Status: DONE
Agent: kilo
Owns: `js/data/q-api.js`
After: T1442

> **Tinh giản (2026-11-09):** web chỉ dùng để tự ôn. Ưu tiên số 1 là **kiến thức đúng**; không cần đạt đủ độ dài/số từ, viết ngắn gọn, dễ hiểu là được. Mục nào không chắc đúng thì bỏ.

Nâng cấp 6 đáp án (field `a`) dưới đây cho đủ chuẩn AGENTS.md mục 6. Người học tự ôn, không có ai giảng thêm, nên phần bổ sung phải **cụ thể, đúng kỹ thuật, dễ hiểu**.

- `api-011` (5146 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `api-012` (4969 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `api-013` (4559 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `api-014` (6395 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `api-015` (5099 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `api-016` (4167 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu

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

- api-011: thêm `### Ví dụ đời thực` (webhook partner integration với e-wallet, 200k events/ngày, outbox pattern, HMAC, retry backoff, sequence ordering), `### Trả lời mẫu khi phỏng vấn` (190 từ). follow đã có sẵn.
- api-012: thêm `### Ví dụ đời thực` (internet banking p99 4.2s → 85ms qua index + virtual threads + connectionTimeout tuning), `### Trả lời mẫu khi phỏng vấn` (180 từ). follow đã có sẵn.
- api-013: thêm `### Ví dụ đời thực` (ngân hàng 3 biên: mobile, web admin, partner; hybrid REST/GraphQL BFF/gRPC, p99 dashboard 800ms→180ms, internal 45ms→8ms), `### Trả lời mẫu khi phỏng vấn` (195 từ). follow đã có sẵn.
- api-014: thêm `### Ví dụ đời thực` (30 partner fintech, API-first quy trình 14 tháng, oasdiff CI gate, 0 breaking change 6 tháng), `### Trả lời mẫu khi phỏng vấn` (185 từ). follow đã có sẵn.
- api-015: thêm `### Ví dụ đời thực` (cổng thanh toán 50k giao dịch/ngày VNPAY, idempotency key reserve-first, partition tháng, 0 duplicate), `### Trả lời mẫu khi phỏng vấn` (190 từ). follow đã có sẵn.
- api-016: thêm `### Ví dụ đời thực` (40 partner, deprecation 14 tháng với brownout 5ph/tuần, 37/40 tự migrate), `### Trả lời mẫu khi phỏng vấn` (190 từ). follow đã có sẵn.
- Tất cả 6 câu hỏi đã có field `follow` sẵn (2-3 câu), không cần thêm.
- Đã fix markup: thay backtick bằng `{{code}}`, sửa ký tự lạ "интеграция" → "tích hợp", xử lý nested braces trong inline code.
- `node scripts/build-light-index.js` → OK, `node scripts/validate.js` → OK — không có lỗi.
Reviewed-by: kilo (T1443R)
