# T1269 — Nâng cấp đáp án q-kotlin: kotlin-014 … kotlin-020

Status: DONE
Agent: kilo
Owns: `js/data/q-kotlin.js`
After: T1251

Nâng cấp 6 đáp án (field `a`) dưới đây cho đủ chuẩn AGENTS.md mục 6. Người học tự ôn, không có ai giảng thêm, nên phần bổ sung phải **cụ thể, đúng kỹ thuật, dễ hiểu**.

- `kotlin-014` (4025 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `kotlin-015` (3396 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `kotlin-017` (3577 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `kotlin-018` (4091 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `kotlin-019` (3124 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `kotlin-020` (3107 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu

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
- kotlin-014: thêm `### Ví dụ đời thực` (trùng đơn hàng do hashCode thay đổi, N+1 từ toString), `### Trả lời mẫu khi phỏng vấn`
- kotlin-015: thêm `### Ví dụ đời thực` (sealed error làm crash client cũ, map sang DTO ErrorResponse), `### Trả lời mẫu khi phỏng vấn`
- kotlin-017: thêm `### Ví dụ đời thực` (Flow buffer vô hạn làm chậm toàn bộ SSE, fix bằng conflate/collectLatest), `### Trả lời mẫu khi phỏng vấn`
- kotlin-018: thêm `### Ví dụ đời thực` (chuyển dần 12 module Java sang Kotlin, pilot notification → order → payment, đo build time/defect/lead time), `### Trả lời mẫu khi phỏng vấn`
- kotlin-019: thêm `### Ví dụ đời thực` (Virtual Thread pin carrier thread do synchronized, fix ReentrantLock, so sánh rewrite coroutine), `### Trả lời mẫu khi phỏng vấn`
- kotlin-020: thêm `### Ví dụ đời thực` (coroutineScope hủy toàn bộ dashboard khi một widget lỗi, đổi supervisorScope + bulkhead), đã có Trả lời mẫu
- Chạy `node scripts/build-light-index.js` và `node scripts/validate.js` → OK
Reviewed-by: kilo (T1269R)
