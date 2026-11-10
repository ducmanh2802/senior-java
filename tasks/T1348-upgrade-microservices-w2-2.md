# T1348 — Nâng cấp đáp án q-microservices: microservices-043 … microservices-048

Status: DONE
Agent: kilo
Owns: `js/data/q-microservices.js`
After: T1337

> **Tinh giản (2026-11-09):** web chỉ dùng để tự ôn. Ưu tiên số 1 là **kiến thức đúng**; không cần đạt đủ độ dài/số từ, viết ngắn gọn, dễ hiểu là được. Mục nào không chắc đúng thì bỏ.

Nâng cấp 6 đáp án (field `a`) dưới đây cho đủ chuẩn AGENTS.md mục 6. Người học tự ôn, không có ai giảng thêm, nên phần bổ sung phải **cụ thể, đúng kỹ thuật, dễ hiểu**.

- `microservices-043` (6030 ký tự): thiếu Ví dụ đời thực
- `microservices-044` (5657 ký tự): thiếu Ví dụ đời thực
- `microservices-045` (6242 ký tự): thiếu Ví dụ đời thực
- `microservices-046` (6196 ký tự): thiếu Ví dụ đời thực
- `microservices-047` (6294 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `microservices-048` (5354 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu

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

- microservices-043: thêm `### Ví dụ đời thực` (HIPAA, 5.000 hồ sơ, S3 + Elasticsearch + PostgreSQL, mark-for-delete, 207 Multi-Status, 0 orphan).
- microservices-044: thêm `### Ví dụ đời thực` (SaaS nhân sự 500 công ty, batch-delete trả 200 che giấu partial failure → refactor 207 + envelope ProblemDetail RFC 9457).
- microservices-045: thêm `### Ví dụ đời thực` (300 merchant, Redis bottleneck, noisy neighbor → shard Redis + fail-open local bucket + alert).
- microservices-046: thêm `### Ví dụ đời thực` (150 bệnh viện, hybrid tenancy, migration 2.15 Flyway lock/OOM → lô + retry + audit).
- microservices-047: thêm `### Ví dụ đời thực` (Black Friday disk full, ISR co, NotEnoughReplicasException → giảm heap, alert UnderMinIsrPartitions, capacity planning) và `### Trả lời mẫu khi phỏng vấn`.
- microservices-048: thêm `### Ví dụ đời thực` (20.000 event/s, linger.ms=0 → tune linger/batch/zstd, request-rate từ 18.000 xuống 1.200/s) và `### Trả lời mẫu khi phỏng vấn`.
- Sửa lỗi cú pháp: thay backtick bằng `{{code}}` trong 4 dòng template literal (3857, 3942, 4032, 4108, 4198, 4282) để file biên dịch được.
- Đã chạy `node scripts/build-light-index.js` và `node scripts/validate.js` → `OK — không có lỗi.` (microservices: 57 câu hỏi).
Reviewed-by: kilo (T1348R)
