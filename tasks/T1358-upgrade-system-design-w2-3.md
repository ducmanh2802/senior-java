# T1358 — Nâng cấp đáp án q-system-design: design-027 … architecture-025

Status: DONE
Agent: kilo
Owns: `js/data/q-system-design.js`
After: T1349

> **Tinh giản (2026-11-09):** web chỉ dùng để tự ôn. Ưu tiên số 1 là **kiến thức đúng**; không cần đạt đủ độ dài/số từ, viết ngắn gọn, dễ hiểu là được. Mục nào không chắc đúng thì bỏ.

Nâng cấp 6 đáp án (field `a`) dưới đây cho đủ chuẩn AGENTS.md mục 6. Người học tự ôn, không có ai giảng thêm, nên phần bổ sung phải **cụ thể, đúng kỹ thuật, dễ hiểu**.

- `design-027` (3527 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `design-028` (5649 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `design-029` (5526 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `architecture-023` (5952 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `architecture-024` (6076 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `architecture-025` (5829 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu

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
- `design-027`: thêm `### Ví dụ đời thực` (webhook trùng/settlement trễ/refund sau redemption) và `### Trả lời mẫu khi phỏng vấn` (150–220 từ, ngôi thứ nhất) ngay trước `> Senior tip:`; giữ nguyên nội dung cũ; `follow` đã có.
- `design-028`: thêm `### Ví dụ đời thực` (báo cáo 2–5 phút, 504/Idempotency-Key/lease-reaper) và `### Trả lời mẫu khi phỏng vấn` trước Senior tip; giữ follow/refs.
- `design-029`: thêm `### Ví dụ đời thực` (chọn DB queue/SQS/outbox, giảm trễ email và CPU DB) và `### Trả lời mẫu khi phỏng vấn` trước Senior tip; giữ follow/refs.
- `architecture-023`: thêm `### Ví dụ đời thực` (ADR-0007 Kafka vs RabbitMQ/SNS+SQS, số liệu throughput/replay/team) và `### Trả lời mẫu khi phỏng vấn` trước Senior tip; giữ follow/refs.
- `architecture-024`: thêm `### Ví dụ đời thực` (ArchUnit phát hiện 63 vi phạm module boundary, FreezingArchRule, giảm hồi quy) và `### Trả lời mẫu khi phỏng vấn` trước Senior tip; giữ follow/refs.
- `architecture-025`: thêm `### Ví dụ đời thực` (Strangler Fig facade+CDC+shadow cho GET /orders, 42% traffic, <0,2% diff) và `### Trả lời mẫu khi phỏng vấn` trước Senior tip; giữ follow/refs.
- Kiểm tra: `node scripts/build-light-index.js` → OK, `node scripts/validate.js` → OK (1497 câu hỏi, 849 trắc nghiệm). Không sửa file khác, không git commit.
Reviewed-by: kilo (T1358R)
