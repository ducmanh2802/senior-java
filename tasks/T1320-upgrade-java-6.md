# T1320 — Nâng cấp đáp án q-java: modern-013 … collections-020

Status: DONE
Agent: kilo
Owns: `js/data/q-java.js`
After: T1305

> **Tinh giản (2026-11-09):** web chỉ dùng để tự ôn. Ưu tiên số 1 là **kiến thức đúng**; không cần đạt đủ độ dài/số từ, viết ngắn gọn, dễ hiểu là được. Mục nào không chắc đúng thì bỏ.

Nâng cấp 6 đáp án (field `a`) dưới đây cho đủ chuẩn AGENTS.md mục 6. Người học tự ôn, không có ai giảng thêm, nên phần bổ sung phải **cụ thể, đúng kỹ thuật, dễ hiểu**.

- `modern-013` (3734 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `modern-014` (3968 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `modern-015` (4003 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `modern-016` (3965 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `collections-019` (4022 ký tự): thiếu Ví dụ đời thực
- `collections-020` (3630 ký tự): thiếu Ví dụ đời thực

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
- `modern-013`: thêm `### Ví dụ đời thực` (NPE do getAddress null, helpful NPE chỉ rõ nguyên nhân, xử lý bằng validate/pattern matching) và `### Trả lời mẫu khi phỏng vấn` trước Senior tip.
- `modern-014`: thêm `### Ví dụ đời thực` (API tổng hợp 3 service, CompletableFuture + executor IO + timeout, p99 giảm) và `### Trả lời mẫu khi phỏng vấn`.
- `modern-015`: thêm `### Ví dụ đời thực` (peek side-effect bị bỏ qua khi count tối ưu, đơn hàng sót cập nhật) và `### Trả lời mẫu khi phỏng vấn`.
- `modern-016`: thêm `### Ví dụ đời thực` (parallelStream + IO làm nghẽn commonPool, chuyển sang for + executor IO, đo JMH) và `### Trả lời mẫu khi phỏng vấn`.
- `collections-019`: thêm `### Ví dụ đời thực` (putIfAbsent tạo ArrayList thừa, đổi sang computeIfAbsent/merge/EnumMap, job nhanh hơn, GC giảm) trước Senior tip; giữ nguyên mục "Trả lời miệng 1 phút" có sẵn.
- `collections-020`: thêm `### Ví dụ đời thực` (TreeSet + comparator trả 0 làm mất phần tử, phép trừ/ép kiểu sai, sửa bằng Comparator chaining và List) trước Senior tip; giữ nguyên mục "Trả lời miệng 1 phút" có sẵn.
- Đã chạy `node --check js/data/q-java.js`, `node scripts/build-light-index.js`, `node scripts/validate.js` → OK (chỉ còn cảnh báo sẵn có: `path.js` có 1 bài học không nằm trong PATH). Không sửa file ngoài phạm vi, không commit.
Reviewed-by: kilo (T1320R)
