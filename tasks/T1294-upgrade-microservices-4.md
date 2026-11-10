# T1294 — Nâng cấp đáp án q-microservices: microservices-019 … microservices-024

Status: DONE
Agent: kilo
Owns: `js/data/q-microservices.js`
After: T1276

Nâng cấp 6 đáp án (field `a`) dưới đây cho đủ chuẩn AGENTS.md mục 6. Người học tự ôn, không có ai giảng thêm, nên phần bổ sung phải **cụ thể, đúng kỹ thuật, dễ hiểu**.

- `microservices-019` (5833 ký tự): thiếu Ví dụ đời thực
- `microservices-020` (7189 ký tự): thiếu Ví dụ đời thực
- `microservices-021` (6688 ký tự): thiếu Ví dụ đời thực
- `microservices-022` (5669 ký tự): thiếu Ví dụ đời thực
- `microservices-023` (7517 ký tự): thiếu Ví dụ đời thực
- `microservices-024` (7738 ký tự): thiếu Ví dụ đời thực

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

Đã thêm cho 6 câu hỏi (microservices-019 đến microservices-024):
- **microservices-019** (Kafka partition & rebalance): thêm `### Ví dụ đời thực` (hệ thống logistics partition hot key, fix bằng tăng partition + đổi key + cooperative sticky), thêm `### Trả lời mẫu khi phỏng vấn`.
- **microservices-020** (Spring Kafka blocking vs non-blocking retry): thêm `### Ví dụ đời thực` (ngân hàng số non-blocking retry gây DLT phình do không exclude BusinessException, fix bằng exclude + alert theo loại exception), thêm `### Trả lời mẫu khi phỏng vấn`. Sửa lỗi nested braces trong inline code.
- **microservices-021** (Schema Registry Avro/Protobuf): thêm `### Ví dụ đời thực` (e-commerce Avro thêm field discountStrategy, consumer cũ crash do codegen chưa cập nhật, fix bằng CI enforce regenerate code trước deploy), thêm `### Trả lời mẫu khi phỏng vấn`. Sửa lỗi nested braces trong inline code.
- **microservices-022** (Inbox vs Outbox pattern): thêm `### Ví dụ đời thực` (fintech chỉ có Outbox thiếu Inbox dẫn double-entry 0.3%, fix bằng processed_message table + ON CONFLICT DO NOTHING), thêm `### Trả lời mẫu khi phỏng vấn`.
- **microservices-023** (Choreography vs Orchestration): thêm `### Ví dụ đời thực` (hệ thống tour booking 8 service choreography gây 15% booking kẹt, chuyển sang Temporal workflow giảm xuống 0.2%), thêm `### Trả lời mẫu khi phỏng vấn`.
- **microservices-024** (Spring Boot 3 Kubernetes probes): thêm `### Ví dụ đời thực` (ngân hàng thiếu startup probe cho Flyway migration gây CrashLoopBackOff + traffic route vào pod đang migrate, fix bằng startup probe + readiness check migration status), thêm `### Trả lời mẫu khi phỏng vấn`.

Chạy `node scripts/build-light-index.js` và `node scripts/validate.js` → OK (chỉ lỗi ở file khác không thuộc task).
Reviewed-by: kilo (T1294R)
