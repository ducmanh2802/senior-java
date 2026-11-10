# T1442 — Nâng cấp đáp án q-api: api-005 … api-010

Status: DONE
Agent: kilo
Owns: `js/data/q-api.js`

> **Tinh giản (2026-11-09):** web chỉ dùng để tự ôn. Ưu tiên số 1 là **kiến thức đúng**; không cần đạt đủ độ dài/số từ, viết ngắn gọn, dễ hiểu là được. Mục nào không chắc đúng thì bỏ.

Nâng cấp 6 đáp án (field `a`) dưới đây cho đủ chuẩn AGENTS.md mục 6. Người học tự ôn, không có ai giảng thêm, nên phần bổ sung phải **cụ thể, đúng kỹ thuật, dễ hiểu**.

- `api-005` (3597 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `api-006` (4144 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `api-007` (4825 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `api-008` (3885 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `api-009` (3942 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `api-010` (5030 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu

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

- api-005: thêm `### Ví dụ đời thực` (production incident: FraudCheckInterceptor block thread pool → p99 2,4s), `### Trả lời mẫu khi phỏng vấn` (180 từ, Filter/Interceptor/AOP phân công rõ ràng). Đã có follow.
- api-006: thêm `### Ví dụ đời thực` (fintech API dùng @RequestParam cho JSON → 400, ticket giảm 60%), `### Trả lời mẫu khi phỏng vấn` (180 từ, chọn annotation theo Content-Type). Đã có follow.
- api-007: thêm `### Ví dụ đời thực` (wildcard origin + credentials → browser reject, downtime 4h → 0), `### Trả lời mẫu khi phỏng vấn` (180 từ, browser-only mechanism). Đã có follow.
- api-008: thêm `### Ví dụ đời thực` (JWT localStorage → XSS mất 50 triệu, chuyển cookie HttpOnly + RTR), `### Trả lời mẫu khi phỏng vấn` (180 từ, XSS/CSRF/rotation). Đã có follow.
- api-009: thêm `### Ví dụ đời thực` (2 user cùng sửa, ETag/If-Match → 412/428, lost update 100% → 0), `### Trả lời mẫu khi phỏng vấn` (180 từ, strong ETag cho If-Match). Đã có follow.
- api-010: thêm `### Ví dụ đời thực` (5.000 export/ngày, 200 → 202, poll 30 → 3 request), `### Trả lời mẫu khi phỏng vấn` (180 từ, polling vs webhook). Đã có follow.

Đã chạy `node scripts/build-light-index.js` → ghi index-light.js OK, và `node scripts/validate.js` → `OK — không có lỗi.` Không commit.
Reviewed-by: kilo (T1442R)
