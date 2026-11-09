# T1364 — Nâng cấp đáp án q-concurrency-jvm: jvm-026 … jvm-031

Status: DONE
Agent: kilo
Owns: `js/data/q-concurrency-jvm.js`
After: T1355

> **Tinh giản (2026-11-09):** web chỉ dùng để tự ôn. Ưu tiên số 1 là **kiến thức đúng**; không cần đạt đủ độ dài/số từ, viết ngắn gọn, dễ hiểu là được. Mục nào không chắc đúng thì bỏ.

Nâng cấp 6 đáp án (field `a`) dưới đây cho đủ chuẩn AGENTS.md mục 6. Người học tự ôn, không có ai giảng thêm, nên phần bổ sung phải **cụ thể, đúng kỹ thuật, dễ hiểu**.

- `jvm-026` (5803 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `jvm-027` (5402 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `jvm-028` (4396 ký tự): thiếu Trả lời mẫu
- `jvm-029` (4044 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `jvm-030` (3869 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `jvm-031` (4577 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu

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
- `jvm-026`: thêm `### Ví dụ đời thực` (spike OOM upload log 1.5 GB, MAT/heap dump, streaming `Files.lines`, giới hạn upload, kết quả heap đỉnh ~120 MB) + `### Trả lời mẫu khi phỏng vấn`. Có follow sẵn. Đã chuyển đoạn code try-with-resources vào block `~~~java` để tránh `{{}}` lồng `{}`.
- `jvm-027`: thêm `### Ví dụ đời thực` (OOMKilled exit 137 trên K8s, heap 60% nhưng thread/direct buffer tăng, NMT/metric, vá executor/buffer pool/cờ JVM) + `### Trả lời mẫu khi phỏng vấn`. Có follow sẵn.
- `jvm-028`: thêm `### Ví dụ đời thực` (RSS giữ đỉnh sau export, used thấp nhưng committed cao, `G1PeriodicGCInterval`/trade-off Xms=Xmx+PreTouch) + `### Trả lời mẫu khi phỏng vấn`. Có follow sẵn.
- `jvm-029`: thêm `### Ví dụ đời thực` (NPE trơn sau C2 fast throw, tìm log sớm, `-XX:-OmitStackTraceInFastThrow`, sửa null/control flow) + `### Trả lời mẫu khi phỏng vấn`. Có follow sẵn.
- `jvm-030`: thêm `### Ví dụ đời thực` (PR tối ưu sai do `nanoTime`/dead-code elimination, JMH `@Fork/@Warmup/-prof gc`, load test/p99) + `### Trả lời mẫu khi phỏng vấn`. Có follow sẵn.
- `jvm-031`: thêm `### Ví dụ đời thực` (OpenTelemetry agent: startup chậm, `VerifyError` khi nâng JDK 17→21 do agent cũ, canary/sampling/công tắc `-javaagent`) + `### Trả lời mẫu khi phỏng vấn`. Có follow sẵn.
- Kiểm tra: `node --check js/data/q-concurrency-jvm.js` OK. `node scripts/build-light-index.js` OK (ghi `js/data/index-light.js`). `node scripts/validate.js` không báo lỗi nào thuộc `js/data/q-concurrency-jvm.js` (các lỗi/cảnh báo còn lại là pre-existing ngoài file sở hữu: `lessons-jpa.js` ký tự lạ + PATH `lesson-design-006/007`). Không sửa file ngoài phạm vi, không commit.
Reviewed-by: kilo (T1364R)
