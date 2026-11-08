# T1252 — Nâng cấp đáp án q-primer: primer-001 … primer-006

Status: DONE
Agent: kilo
Owns: `js/data/q-primer.js`

Nâng cấp 6 đáp án (field `a`) dưới đây cho đủ chuẩn AGENTS.md mục 6. Người học tự ôn, không có ai giảng thêm, nên phần bổ sung phải **cụ thể, đúng kỹ thuật, dễ hiểu**.

- `primer-001` (4744 ký tự): thiếu Ví dụ đời thực
- `primer-002` (5540 ký tự): thiếu Ví dụ đời thực
- `primer-003` (5219 ký tự): thiếu Ví dụ đời thực
- `primer-004` (4319 ký tự): thiếu Ví dụ đời thực
- `primer-005` (4671 ký tự): thiếu Ví dụ đời thực
- `primer-006` (4675 ký tự): thiếu Ví dụ đời thực

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
- primer-001 (6657 ký tự): thêm `### Ví dụ đời thực` (Docker build chậm/caching, multi-stage, Trivy) ngay trước `> Senior tip:`; đã có `follow` và mục "Trả lời miệng 1 phút" (không thêm Trả lời mẫu trùng). `node --check` OK.
- primer-002 (7695 ký tự): thêm `### Ví dụ đời thực` (pod OOMKilled, MaxRAMPercentage, probes/readiness-liveness, graceful shutdown). Đã có follow/Trả lời miệng.
- primer-003 (7249 ký tự): thêm `### Ví dụ đời thực` (consumer lag/rebalance Kafka, max.poll.interval.ms, idempotency, DLQ). Đã có follow/Trả lời miệng.
- primer-004 (6152 ký tự): thêm `### Ví dụ đời thực` (Redis cache stampede/thundering herd, mutex/jitter TTL, hit rate). Đã có follow/Trả lời miệng.
- primer-005 (6268 ký tự): thêm `### Ví dụ đời thực` (AWS AZ failure, ECS/RDS Multi-AZ, Security Group least privilege). Đã có follow/Trả lời miệng.
- primer-006 (6236 ký tự): thêm `### Ví dụ đời thực` (observability điều tra 5xx/p99 tăng, Hikari pending, thiếu index, EXPLAIN/trace). Đã có follow/Trả lời miệng.
- Kiểm tra: `node --check js/data/q-primer.js` OK; load qua browser-shim xác nhận cả 6 id có "Ví dụ đời thực", có mục trả lời miệng, có follow.
- `node scripts/build-light-index.js` thất bại do lỗi cú pháp có sẵn trong `js/data/q-microservices.js` (Unexpected identifier 'kubectl') — file ngoài phạm vi task, không sửa. `node scripts/validate.js` báo nhiều lỗi/cảnh báo ở file khác (q-microservices.js, q-security.js, bugs.js, lessons-microservices.js, lessons-devops.js, projects.js, path.js, index-light cũ) — đều không thuộc `js/data/q-primer.js`. Không có lỗi do thay đổi q-primer.js.
Reviewed-by: kilo (T1252R)
