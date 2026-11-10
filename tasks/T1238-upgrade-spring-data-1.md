# T1238 — Nâng cấp đáp án q-spring-data: spring-002 … spring-013

Status: DONE
Agent: kilo
Owns: `js/data/q-spring-data.js`

Nâng cấp 6 đáp án (field `a`) dưới đây cho đủ chuẩn AGENTS.md mục 6. Người học tự ôn, không có ai giảng thêm, nên phần bổ sung phải **cụ thể, đúng kỹ thuật, dễ hiểu**.

- `spring-002` (3047 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `spring-007` (3337 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `spring-008` (3605 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `spring-009` (3350 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `spring-010` (3432 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `spring-013` (3434 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu

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
- Kiểm tra hiện trạng (2026-11-08): cả 6 id (`spring-002/007/008/009/010/013`) đều đã có `### Ví dụ đời thực`, `### Trả lời mẫu khi phỏng vấn` (đặt trước `> Senior tip:`) và `follow` (2–3 câu); độ dài đáp án ~5250–8297 ký tự (đạt ≥3000). `node --check js/data/q-spring-data.js` OK; `validate.js` không báo lỗi nào thuộc `q-spring-data.js`.
- spring-002: giữ nguyên nội dung tốt từ lần trước; đã có fix `${...}` → `\${...}`.
- spring-007–010: giữ nguyên nội dung tốt; đã có fix ký tự lạ (mặc định / từng bước).
- spring-013: có Ví dụ đời thực (lộ stack trace/SQL → @RestControllerAdvice + ProblemDetail + tắt stack trace → quét lỗi = 0) và Trả lời mẫu phỏng vấn (ngôi thứ nhất, trong ngoặc kép).
- Chỉ kiểm tra/chỉnh phạm vi task; không ghi lại file, không sửa file khác.
- BLOCKER ngoài phạm vi T1238 (AGENTS.md luật 3): `node scripts/build-light-index.js` crash do lỗi cú pháp `q-microservices.js` (T1240, backtick trong template literal ~dòng 81/150) → `index-light.js` cũ → `validate.js` không in OK tổng. Cần owner `q-microservices.js` sửa; sau đó chạy `node scripts/build-light-index.js && node scripts/validate.js`.
Reviewed-by: kilo (T1238R)
