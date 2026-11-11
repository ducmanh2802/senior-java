# T1301 — Nâng cấp đáp án q-soft: testing-011 … testing-016

Status: DONE
Agent: kilo
Owns: `js/data/q-soft.js`
After: T1283

> **Tinh giản (2026-11-09):** web chỉ dùng để tự ôn. Ưu tiên số 1 là **kiến thức đúng**; không cần đạt đủ độ dài/số từ, viết ngắn gọn, dễ hiểu là được. Mục nào không chắc đúng thì bỏ.

Nâng cấp 6 đáp án (field `a`) dưới đây cho đủ chuẩn AGENTS.md mục 6. Người học tự ôn, không có ai giảng thêm, nên phần bổ sung phải **cụ thể, đúng kỹ thuật, dễ hiểu**.

- `testing-011` (4328 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `testing-012` (4253 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `testing-013` (4503 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `testing-014` (4639 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `testing-015` (4491 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `testing-016` (5195 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu

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
- testing-011: mở rộng Trả lời mẫu (thêm trade-off embedded Kafka vs Testcontainers), sửa ký tự "兼容" thành "backward compatible"
- testing-012: mở rộng Trả lời mẫu (thêm nhắc đo p95 thời gian test và tỷ lệ flaky)
- testing-013: mở rộng Trả lời mẫu (thêm trade-off test tích hợp chậm hơn nhưng bắt được lỗi filter chain), sửa nested braces trong inline code (`/orders/{id}`, `/orders/{orderId}`)
- testing-014: mở rộng Trả lời mẫu (thêm trade-off expand-contract tốn nhiều migration hơn)
- testing-015: mở rộng Trả lời mẫu (thêm trade-off jqwik chậm hơn, chạy tries ít ở PR nhiều ở nightly)
- testing-016: thêm mới cả hai mục Ví dụ đời thực (sự cố circuit breaker default config) và Trả lời mẫu (tóm tắt 3 tầng test + trade-off)
- Tất cả 6 câu hỏi đã có sẵn field `follow` nên không cần thêm
- `node scripts/build-light-index.js` và `node scripts/validate.js` chạy OK (chỉ còn lỗi pre-existing ở q-aws.js và path.js warning)
Reviewed-by: kilo (T1301R)
