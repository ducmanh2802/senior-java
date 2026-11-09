# T1310 — Nâng cấp đáp án q-system-design: design-017 … architecture-009

Status: DONE
Agent: kilo
Owns: `js/data/q-system-design.js`
After: T1295

Nâng cấp 6 đáp án (field `a`) dưới đây cho đủ chuẩn AGENTS.md mục 6. Người học tự ôn, không có ai giảng thêm, nên phần bổ sung phải **cụ thể, đúng kỹ thuật, dễ hiểu**.

- `design-017` (5244 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `design-018` (4162 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `design-019` (4862 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `design-020` (5347 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `design-021` (5086 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `architecture-009` (4216 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu

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
- `design-017`: thêm `### Ví dụ đời thực` (matching engine, p99 ack tăng do fsync từng lệnh ở sequencer; điều tra HdrHistogram/iostat; group commit; kết quả p99 về 4–6 ms) + `### Trả lời mẫu khi phỏng vấn` (150–220 từ, ngôi thứ nhất). Giữ nguyên `follow` có sẵn.
- `design-018`: thêm `### Ví dụ đời thực` (autocomplete Redis sorted-set + không debounce gây p95 400 ms/Redis CPU 85%; sửa bằng debounce+CDN cache+trie snapshot; request giảm ~70%) + `### Trả lời mẫu khi phỏng vấn`. Giữ nguyên `follow`.
- `design-019`: thêm `### Ví dụ đời thực` (Prometheus OOM do cardinality tag `uri` chứa ID; điều tra `prometheus_tsdb_head_series`/`/tsdb-status`; sửa route template; thêm cảnh báo head series) + `### Trả lời mẫu khi phỏng vấn`. Sửa inline code có `{}` lồng nhau (`/payments/{id}` → `/payments/<id>`) để qua validate. Giữ nguyên `follow`, `refs`.
- `design-020`: thêm `### Ví dụ đời thực` (fraud check timeout do hot key velocity/Redis, fallback CHALLENGE tăng 22%; shard key+ngân sách thời gian+circuit breaker; p99 về 55–70 ms) + `### Trả lời mẫu khi phỏng vấn`. Giữ nguyên `follow`, `refs`.
- `design-021`: thêm `### Ví dụ đời thực` (OTP chậm/mất do DLR timeout + resend tạo mã mới; gửi lại cùng challenge/cooldown/rate limit/SMS pumping; delivery 30s >97%, chi phí giảm ~25%) + `### Trả lời mẫu khi phỏng vấn`. Giữ nguyên `follow`, `refs`.
- `architecture-009`: thêm `### Ví dụ đời thực` (Singleton GoF `PaymentConfig` mutable gây cấu hình sai trong test song song; chuyển bean `@ConfigurationProperties` immutable inject constructor; lỗi biến mất) + `### Trả lời mẫu khi phỏng vấn`. Giữ nguyên `follow`.
- Kiểm tra: `node --check js/data/q-system-design.js` OK; `node scripts/build-light-index.js` OK; `node scripts/validate.js` còn 1 lỗi ngoài phạm vi sở hữu: `q-microservices.js: microservices-025.a: tiêu đề ### bị thụt đầu dòng` (không sửa theo luật 3). Không commit.
Reviewed-by: kilo (T1310R)
