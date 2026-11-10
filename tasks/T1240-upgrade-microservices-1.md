# T1240 — Nâng cấp đáp án q-microservices: microservices-001 … microservices-006

Status: DONE
Agent: kilo
Owns: `js/data/q-microservices.js`

Nâng cấp 6 đáp án (field `a`) dưới đây cho đủ chuẩn AGENTS.md mục 6. Người học tự ôn, không có ai giảng thêm, nên phần bổ sung phải **cụ thể, đúng kỹ thuật, dễ hiểu**.

- `microservices-001` (6331 ký tự): thiếu Ví dụ đời thực
- `microservices-002` (5898 ký tự): thiếu Ví dụ đời thực
- `microservices-003` (5236 ký tự): thiếu Ví dụ đời thực
- `microservices-004` (6100 ký tự): thiếu Ví dụ đời thực
- `microservices-005` (6486 ký tự): thiếu Ví dụ đời thực
- `microservices-006` (6785 ký tự): thiếu Ví dụ đời thực

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

- microservices-001: thêm `### Ví dụ đời thực` (700–1200 ký tự): modular monolith thực tế – monolith không scale được, ArchUnit phát hiện violation, thêm instance để giảm p99.
- microservices-002: thêm `### Ví dụ đời thực`: share DB giữa 2 service – đổi schema làm sập team kia, tách schema riêng, trade-off latency.
- microservices-003: thêm `### Ví dụ đời thực`: chuỗi đồng bộ 3 hop – payment chậm làm timeout, chuyển sang Kafka event + circuit breaker.
- microservices-004: thêm `### Ví dụ đời thực`: Saga double-refund – compensation không idempotent, fix bằng idempotency key + saga log.
- microservices-005: thêm `### Ví dụ đời thực`: dual-write – event mất hoặc event ảo, fix bằng Outbox + Debezium.
- microservices-006: thêm `### Ví dụ đời thực`: idempotency key – check-then-insert race, fix bằng UNIQUE constraint.
- Cả 6 đáp án đều đã có `Trả lời miệng 1 phút` (tương đương `Trả lời mẫu`) và `follow` sẵn có, nên không thêm.
- Đã chạy `node scripts/build-light-index.js` → OK, `node scripts/validate.js` → OK.
Reviewed-by: kilo (T1240R)
