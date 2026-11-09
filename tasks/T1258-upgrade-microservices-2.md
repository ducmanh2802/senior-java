# T1258 — Nâng cấp đáp án q-microservices: microservices-007 … microservices-012

Status: DONE
Agent: kilo
Owns: `js/data/q-microservices.js`
After: T1240

Nâng cấp 6 đáp án (field `a`) dưới đây cho đủ chuẩn AGENTS.md mục 6. Người học tự ôn, không có ai giảng thêm, nên phần bổ sung phải **cụ thể, đúng kỹ thuật, dễ hiểu**.

- `microservices-007` (7804 ký tự): thiếu Ví dụ đời thực
- `microservices-008` (6471 ký tự): thiếu Ví dụ đời thực
- `microservices-009` (8076 ký tự): thiếu Ví dụ đời thực
- `microservices-010` (5933 ký tự): thiếu Ví dụ đời thực
- `microservices-011` (7310 ký tự): thiếu Ví dụ đời thực
- `microservices-012` (7686 ký tự): thiếu Ví dụ đời thực

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

- microservices-007: thêm `### Ví dụ đời thực` (Resilience4j: payment-service latency 5s, timeout×retry > deadline, bulkhead cạn thread pool → giảm timeout/maxAttempts, jitter, circuit breaker, fallback → p99 từ 5s xuống 600ms).
- microservices-008: thêm `### Ví dụ đời thực` (retry storm: 2 layers retry × 3 attempts → 16 call vào payment-service, thread pool cạn, restart storm → retry ở 1 layer, timeout 1s, circuit breaker, 429+Retry-After → tự hồi phục trong 2h).
- microservices-009: thêm `### Ví dụ đời thực` (Kafka: schema thay đổi không tương thích + listener chậm > max.poll.interval → lag 5 triệu, rebalance liên tục → fix schema, tăng max.poll.interval, DLQ + DeserializationException → lag về 0 trong 10 phút).
- microservices-010: thêm `### Ví dụ đời thực` (SQS: visibility timeout 10s < xử lý 5s → job chạy 2 lần → set 60s, change visibility, idempotent DynamoDB, DLQ → không còn duplicate).
- microservices-011: thêm `### Ví dụ đời thực` (BFF mobile: 3 endpoint → 1 response, payload 80KB→12KB, load 2,5s→800ms; gateway vẫn lo JWT/TLS).
- microservices-012: thêm `### Ví dụ đời thực` (observability: mỗi service tự đặt metric name → không dashboard chung, incident mất 20 phút → OTel semantic conventions, traceparent header, cardinality alert → tìm incident trong 5 phút).

Tất cả đáp án đã có `### Trả lời miệng 1 phút` nên không thêm mục Trả lời mẫu. `node scripts/build-light-index.js` và `node scripts/validate.js` đều OK.
Reviewed-by: kilo (T1258R)
