# T1291 — Nâng cấp đáp án q-concurrency-jvm: concurrency-019 … jvm-004

Status: DONE
Agent: kilo
Owns: `js/data/q-concurrency-jvm.js`
After: T1273

Nâng cấp 6 đáp án (field `a`) dưới đây cho đủ chuẩn AGENTS.md mục 6. Người học tự ôn, không có ai giảng thêm, nên phần bổ sung phải **cụ thể, đúng kỹ thuật, dễ hiểu**.

- `concurrency-019` (7107 ký tự): thiếu Ví dụ đời thực
- `concurrency-020` (7903 ký tự): thiếu Ví dụ đời thực
- `jvm-001` (7102 ký tự): thiếu Ví dụ đời thực
- `jvm-002` (6429 ký tự): thiếu Ví dụ đời thực
- `jvm-003` (5856 ký tự): thiếu Ví dụ đời thực
- `jvm-004` (5734 ký tự): thiếu Ví dụ đời thực

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
Đã thêm cho 6 câu hỏi:
- concurrency-019: thêm `### Ví dụ đời thực` (service định giá chứng khoán, false sharing, perf c2c, @Contended, throughput +71%, p99 12→3ms) và `### Trả lời mẫu khi phỏng vấn`
- concurrency-020: thêm `### Ví dụ đời thực` (job đồng bộ tỷ giá, ScheduledExecutorService nuốt exception, alert sau 3 chu kỳ, fix 15 phút) và `### Trả lời mẫu khi phỏng vấn`
- jvm-001: thêm `### Ví dụ đời thực` (batch CSV 200MB, OOMKilled, NMT diff chỉ ra direct buffer 1.3GB do Netty, fix streaming parse + MaxDirectMemorySize) và `### Trả lời mẫu khi phỏng vấn`
- jvm-002: thêm `### Ví dụ đời thực` (e-commerce 16GB heap, thử ZGC pause 2-4ms nhưng CPU 55→85%, throughput -18%, quay lại G1 tune IHOP 35% + region 16MB → pause 60-80ms, CPU 58%, p99 280ms) và `### Trả lời mẫu khi phỏng vấn`
- jvm-003: thêm `### Ví dụ đời thực` (pod 1GB, Xmx 1g bị OOMKilled, NMT chỉ ra native 600MB, fix MaxRAMPercentage 65% + MaxMetaspaceSize 256MB + MaxDirectMemorySize 256MB) và `### Trả lời mẫu khi phỏng vấn` (đã có sẵn, chỉ thêm mục mới)
- jvm-004: thêm `### Ví dụ đời thực` (payment service Metaspace OOME sau redeploy, MAT Dominator Tree 3 WebappClassLoader 1.2GB, path qua ThreadLocal giữ JwtFilter, fix deregister driver + clear ThreadLocal) và `### Trả lời mẫu khi phỏng vấn`
- Cũng sửa lỗi backtick trong nội dung có sẵn của jvm-003, jvm-004 (thay bằng {{code}} / ~~~bash).
- `node scripts/build-light-index.js` và `node scripts/validate.js` chạy OK (chỉ còn lỗi pre-existing ở q-claude.js, lessons-testing.js).
Reviewed-by: kilo (T1291R)
