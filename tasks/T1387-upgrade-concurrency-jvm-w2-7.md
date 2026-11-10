# T1387 — Nâng cấp đáp án q-concurrency-jvm: concurrency-045 … concurrency-050

Status: DONE
Agent: kilo
Owns: `js/data/q-concurrency-jvm.js`
After: T1381

> **Tinh giản (2026-11-09):** web chỉ dùng để tự ôn. Ưu tiên số 1 là **kiến thức đúng**; không cần đạt đủ độ dài/số từ, viết ngắn gọn, dễ hiểu là được. Mục nào không chắc đúng thì bỏ.

Nâng cấp 6 đáp án (field `a`) dưới đây cho đủ chuẩn AGENTS.md mục 6. Người học tự ôn, không có ai giảng thêm, nên phần bổ sung phải **cụ thể, đúng kỹ thuật, dễ hiểu**.

- `concurrency-045` (9490 ký tự): thiếu Ví dụ đời thực
- `concurrency-046` (7321 ký tự): thiếu Ví dụ đời thực
- `concurrency-047` (5427 ký tự): thiếu Ví dụ đời thực
- `concurrency-048` (5571 ký tự): thiếu Ví dụ đời thực
- `concurrency-049` (5677 ký tự): thiếu Ví dụ đời thực
- `concurrency-050` (5697 ký tự): thiếu Ví dụ đời thực

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
Đã thêm mục `### Ví dụ đời thực` cho 6 câu hỏi:
- concurrency-045: vụ log DEBUG in object.toString() gây identityHashCode ép inflate lock → contention nhảy vọt trên ARM Graviton2
- concurrency-046: game server dùng VarHandle release/acquire thay AtomicLong giảm 30% CPU CAS, nhưng cần volatile cho thuật toán Dekker-style
- concurrency-047: hệ thống định giá chứng khoán 500k mã, dùng ConcurrentSkipListMap cho range query O(log n+k), iterator yếu cần snapshot
- concurrency-048: Spring Boot event-driven 200 listener, config reload ghi dồn gây GC spike, sửa bằng batch addAll
- concurrency-049: batch job dùng newCachedThreadPool (SynchronousQueue) burst 50k task → OOM native thread, sửa bằng ThreadPoolExecutor bounded queue + CallerRunsPolicy
- concurrency-050: API tìm kiếm khách sạn 3 provider, chuyển từ CompletableFuture.allOf sang ExecutorCompletionService cho progressive UI + fail-fast, p99 first-result 95ms vs 320ms

Tất cả 6 đáp án đã có sẵn `### Trả lời phỏng vấn 1 phút` và field `follow`, nên không cần thêm. Validation q-concurrency-jvm.js pass.
Reviewed-by: kilo (T1387R)
