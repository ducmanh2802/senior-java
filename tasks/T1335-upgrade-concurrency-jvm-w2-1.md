# T1335 — Nâng cấp đáp án q-concurrency-jvm: jvm-017 … concurrency-024

Status: DONE
Agent: kilo
Owns: `js/data/q-concurrency-jvm.js`
After: T1321

> **Tinh giản (2026-11-09):** web chỉ dùng để tự ôn. Ưu tiên số 1 là **kiến thức đúng**; không cần đạt đủ độ dài/số từ, viết ngắn gọn, dễ hiểu là được. Mục nào không chắc đúng thì bỏ.

Nâng cấp 6 đáp án (field `a`) dưới đây cho đủ chuẩn AGENTS.md mục 6. Người học tự ôn, không có ai giảng thêm, nên phần bổ sung phải **cụ thể, đúng kỹ thuật, dễ hiểu**.

- `jvm-017` (8825 ký tự): thiếu Ví dụ đời thực
- `jvm-018` (7202 ký tự): thiếu Ví dụ đời thực
- `concurrency-021` (6641 ký tự): thiếu Ví dụ đời thực
- `concurrency-022` (7250 ký tự): thiếu Ví dụ đời thực
- `concurrency-023` (6582 ký tự): thiếu Ví dụ đời thực
- `concurrency-024` (7476 ký tự): thiếu Ví dụ đời thực

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
- jvm-017: thêm `### Ví dụ đời thực` (Startup: Spring Boot EKS rolling update p99 spike, fix AppCDS + warm-up), `### Trả lời mẫu khi phỏng vấn`
- jvm-018: thêm `### Ví dụ đời thực` (async-profiler wall mode debug p99 spike 2AM do batch chiếm connection pool), `### Trả lời mẫu khi phỏng vấn`
- concurrency-021: thêm `### Ví dụ đời thực` (Spring Cloud Gateway p99 spike do upstream payment chậm cạn connection pool), `### Trả lời mẫu khi phỏng vấn`
- concurrency-022: thêm `### Ví dụ đời thực` (PDF generation burst 500 req, CPU-bound task, tách executor + Semaphore + CallerRunsPolicy), `### Trả lời mẫu khi phỏng vấn`
- concurrency-023: thêm `### Ví dụ đời thực` (ReentrantLock+Condition bug if vs while gây NoSuchElementException; sleep trong synchronized block throughput 0.5→200 txn/s), `### Trả lời mẫu khi phỏng vấn`
- concurrency-024: thêm `### Ví dụ đời thực` (SequenceService instance synchronized bảo vệ static field → trùng ID khi new instance; deadlock chuyển tiền ngược chiều fix lock ordering), `### Trả lời mẫu khi phỏng vấn`
- Tất cả 6 câu hỏi đã có field `follow` sẵn, không cần thêm.
- `node scripts/build-light-index.js` → OK, `node scripts/validate.js` → OK (chỉ warning HTML thô ở q-claude.js và lesson-design không liên quan).
Reviewed-by: kilo (T1335R)
