# T1295 — Nâng cấp đáp án q-system-design: architecture-006 … design-016

Status: DONE
Agent: kilo
Owns: `js/data/q-system-design.js`
After: T1277

Nâng cấp 6 đáp án (field `a`) dưới đây cho đủ chuẩn AGENTS.md mục 6. Người học tự ôn, không có ai giảng thêm, nên phần bổ sung phải **cụ thể, đúng kỹ thuật, dễ hiểu**.

- `architecture-006` (4813 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `architecture-007` (4694 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `architecture-008` (5831 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `design-014` (6127 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `design-015` (5534 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `design-016` (5022 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu

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

Đã thêm vào `js/data/q-system-design.js` (chỉ thêm, không xoá nội dung cũ):

- **architecture-006**: thêm `### Ví dụ đời thực` (monolith 800k LOC, PricingEngine 3.200 dòng, deploy lỗi pricing; characterization test + branch by abstraction + feature flag; p99 từ 2,5s xuống 480ms) và `### Trả lời mẫu khi phỏng vấn` (150–220 từ).
- **architecture-007**: thêm `### Ví dụ đời thực` (RabbitMQ cluster reconnect, billing chậm 2s; ADR-001 chọn Kafka, migration outbox + relay; p99 về 18ms) và `### Trả lời mẫu khi phỏng vấn`.
- **architecture-008**: thêm `### Ví dụ đời thực` (12 service shared database; Payment thêm cột làm 6 service phải deploy cùng; DB per service + event + contract test) và `### Trả lời mẫu khi phỏng vấn`.
- **design-014**: thêm `### Ví dụ đời thực` (1.200 UNKNOWN, job tự động hoàn tiền làm mất 847 giao dịch đã thành công; inquiry + metric tuổi UNKNOWN + runbook) và `### Trả lời mẫu khi phỏng vấn`.
- **design-015**: thêm `### Ví dụ đời thực` (30 pod Snowflake trùng worker IP → duplicate key, 12 đơn từ chối; etcd lease + UUIDv7) và `### Trả lời mẫu khi phỏng vấn`.
- **design-016**: thêm `### Ví dụ đời thực` (40.000 ghế, 500k người, bot giữ chỗ, callback trễ → bán twice; virtual waiting room + job dọn dẹp + callback idempotent) và `### Trả lời mẫu khi phỏng vấn`.

Mỗi id đều đã có `follow` sẵn. Đã chạy `node scripts/build-light-index.js` và `node scripts/validate.js` → không còn lỗi liên quan `q-system-design.js` (lỗi `lessons-testing.js` đã tồn tại từ trước, không phải sở hữu của task này).
Reviewed-by: kilo (T1295R)
