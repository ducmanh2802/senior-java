# T1248 — Nâng cấp đáp án q-ai: ai-001 … ai-006

Status: DONE
Agent: kilo
Owns: `js/data/q-ai.js`

Nâng cấp 6 đáp án (field `a`) dưới đây cho đủ chuẩn AGENTS.md mục 6. Người học tự ôn, không có ai giảng thêm, nên phần bổ sung phải **cụ thể, đúng kỹ thuật, dễ hiểu**.

- `ai-001` (3131 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `ai-002` (3907 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `ai-003` (3500 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `ai-004` (3226 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `ai-005` (3293 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `ai-006` (3084 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu

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

- T1248 chỉ sửa `js/data/q-ai.js` (ai-001 … ai-006): thêm mục `### Ví dụ đời thực` (700–1200 ký tự) và `### Trả lời mẫu khi phỏng vấn` (~180 từ, trong ngoặc kép) ngay trước dòng `> Senior tip:`; giữ nguyên toàn bộ nội dung cũ, không xóa/sửa câu hỏi khác. Mọi id đã có field `follow` 2–3 câu nên không thêm.
- Kiểm tra: `node --check js/data/q-ai.js` OK; `node scripts/validate.js q-ai.js` không báo lỗi nào thuộc q-ai.js. index-light chỉ liệt kê id/topic/level (không có field `a`), nên sửa đáp án không làm cũ index-light.
- Chặn toàn repo: `node scripts/validate.js` và `node scripts/build-light-index.js` không thể chạy đến OK hiện tại do `js/data/q-microservices.js` (đã sửa trong working tree bởi session khác/task T1240, không thuộc T1248) chứa backtick thô tại dòng 81 gây lỗi cú pháp VM, gây tình tuyến: câu microservices không đăng ký → lỗi related trong bugs.js/lessons-microservices.js; build-light-index crash nên index-light.js báo cũ. Theo luật 3 AGENTS.md, tôi không chạm file của task khác. Cần chủ sở hữu q-microservices.js sửa lỗi backtick rồi chạy lại validate.
Reviewed-by: kilo (T1248R)
