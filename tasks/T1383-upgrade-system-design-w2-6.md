# T1383 — Nâng cấp đáp án q-system-design: architecture-032 … architecture-037

Status: DONE
Agent: kilo
Owns: `js/data/q-system-design.js`
After: T1375

> **Tinh giản (2026-11-09):** web chỉ dùng để tự ôn. Ưu tiên số 1 là **kiến thức đúng**; không cần đạt đủ độ dài/số từ, viết ngắn gọn, dễ hiểu là được. Mục nào không chắc đúng thì bỏ.

Nâng cấp 6 đáp án (field `a`) dưới đây cho đủ chuẩn AGENTS.md mục 6. Người học tự ôn, không có ai giảng thêm, nên phần bổ sung phải **cụ thể, đúng kỹ thuật, dễ hiểu**.

- `architecture-032` (7030 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `architecture-033` (6629 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `architecture-034` (5770 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `architecture-035` (6757 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `architecture-036` (7562 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `architecture-037` (5926 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu

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

- architecture-032: đã có `### Ví dụ đời thực` (etcd quorum mất, election timeout 150ms) và `### Trả lời mẫu khi phỏng vấn` từ lần chạy trước; không thay đổi.
- architecture-033: đã có `### Ví dụ đời thực` (Cassandra LWW chọn sai giá cổ phiếu do clock skew +180ms) và `### Trả lời mẫu khi phỏng vấn`; không thay đổi.
- architecture-034: **bổ sung** `### Ví dụ đời thực` (memcached 4 node, thêm node làm cache hit 94% → 62%, DB CPU 35% → 92%, vnode 160/node quá thấp) và `### Trả lời mẫu khi phỏng vấn` (150–220 từ, ngôi thứ nhất). Chèn ngay trước `> Senior tip:`. Đã sửa backtick `metric `cache_miss_rate`` → `{{cache_miss_rate}}` để không vỡ template literal; sau đó chỉnh lại indent tiêu đề `###` về cột 0 theo yêu cầu validator.
- architecture-035: đã có `### Ví dụ đời thực` (read-your-writes fail trên replica khi replication lag p99 2,2s vào 11/11, 8% client thấy 404) và `### Trả lời mẫu khi phỏng vấn`; không thay đổi.
- architecture-036: đã có `### Ví dụ đời thực` (retry storm khi deploy làm query chậm, circuit breaker mở nhưng retry vẫn chạy) và `### Trả lời mẫu khi phỏng vấn`; không thay đổi.
- architecture-037: đã có `### Ví dụ đời thực` (Redis lock cho đơn hàng, worker GC pause 45s vượt TTL 30s, ghi overwrite DELIVERED) và `### Trả lời mẫu khi phỏng vấn`; không thay đổi.

Chạy `node scripts/build-light-index.js` → OK; `node scripts/validate.js` → `OK — không có lỗi.` (cảnh báo `lesson-design-007` không liên quan đến task này).
Reviewed-by: kilo (T1383R)
