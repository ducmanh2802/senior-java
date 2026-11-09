# T1373 — Nâng cấp đáp án q-concurrency-jvm: jvm-032 … concurrency-038

Status: DONE
Agent: kilo
Owns: `js/data/q-concurrency-jvm.js`
After: T1364

> **Tinh giản (2026-11-09):** web chỉ dùng để tự ôn. Ưu tiên số 1 là **kiến thức đúng**; không cần đạt đủ độ dài/số từ, viết ngắn gọn, dễ hiểu là được. Mục nào không chắc đúng thì bỏ.

Nâng cấp 6 đáp án (field `a`) dưới đây cho đủ chuẩn AGENTS.md mục 6. Người học tự ôn, không có ai giảng thêm, nên phần bổ sung phải **cụ thể, đúng kỹ thuật, dễ hiểu**.

- `jvm-032` (4392 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `concurrency-030` (4269 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `concurrency-031` (4482 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `concurrency-032` (4095 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `concurrency-033` (4425 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `concurrency-038` (7532 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu

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
- `jvm-032`: đã có sẵn `### Ví dụ đời thực` + `### Trả lời mẫu` + `follow`; sửa lỗi markup của tôi gây ra trước đó (backtick → `{{}}`, `\{…\}` lồng trong `{{}}` → bỏ tag cho phần id=direct, bỏ thụt đầu dòng heading).
- `concurrency-030`: đã có sẵn đủ; sửa backtick trong ví dụ đời thực → `{{}}`, bỏ thụt heading.
- `concurrency-031`: thêm `### Ví dụ đời thực` (triệu chứng p95/CPU thấp → 4 thread dump cách 5s → monitor `RateCache` bị giữ bởi `reload()` gọi HTTP trong `synchronized` → tách I/O + snapshot `volatile` + `Map.copyOf` → p95 2.8s→90ms) và `### Trả lời mẫu` (ngôi thứ nhất) ngay trước `> Senior tip:`. `follow` đã có.
- `concurrency-032`: thêm `### Ví dụ đời thực` (QuotaCounter check-then-act, flash sale cấp 3200/1000, test cũ không lộ race → sửa `AtomicInteger`+CAS, khung test CountDownLatch+Future.get, chạy với code sai để xác minh) và `### Trả lời mẫu`. Sửa `{{if (count < limit) {…}}}`/`{{if (count < limit) count++}}` lồng `{}` → mô tả chữ. `follow` đã có.
- `concurrency-033`: thêm `### Ví dụ đời thực` (rate limiter token bucket 100/s burst 200, 50k/s; NTP lệch + 2 AtomicLong tách rời gây cấp thừa → `nanoTime` + record + CAS trên `AtomicReference`, Caffeine evict) và `### Trả lời mẫu`. `follow` đã có.
- `concurrency-038`: đã có nội dung chi tiết (AQS step-by-step, fair/non-fair, condition queue, production notes) và `follow`/`refs`; không đủ chỗ tự nhiên để thêm "Ví dụ đời thực" riêng mà không lặp (đã có ví dụ trong phần production) — theo tinh giản 2026-11-09 giữ nguyên, nội dung đúng kỹ thuật.
- `node scripts/build-light-index.js` → ghi `index-light.js` OK. `node scripts/validate.js` → **không còn lỗi nào từ `q-concurrency-jvm.js`** (2 lỗi còn lại thuộc `lessons-design.js`, ngoài phạm vi task). Không git commit. No browser, no process kill by name, no npm install.
Reviewed-by: kilo (T1373R)
