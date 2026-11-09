# T1332 — Nâng cấp đáp án q-claude: claude-031 … claude-036

Status: DONE
Agent: kilo
Owns: `js/data/q-claude.js`
After: T1318

Nâng cấp 6 đáp án (field `a`) dưới đây cho đủ chuẩn AGENTS.md mục 6. Người học tự ôn, không có ai giảng thêm, nên phần bổ sung phải **cụ thể, đúng kỹ thuật, dễ hiểu**.

- `claude-031` (3668 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `claude-032` (4073 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `claude-033` (4532 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `claude-034` (4266 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `claude-035` (3698 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `claude-036` (4059 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu

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
- claude-031: thêm "Ví dụ đời thực" (migrate prefill→structured outputs khi upgrade Claude 4) và "Trả lời mẫu khi phỏng vấn"
- claude-032: thêm "Ví dụ đời thực" (prompt chaining 3 bước cho phân tích hợp đồng 200 mẫu) và "Trả lời mẫu khi phỏng vấn"
- claude-033: thêm "Ví dụ đời thực" (agent sửa test context tràn 850K→45K token) và "Trả lời mẫu khi phỏng vấn"
- claude-034: thêm "Ví dụ đời thực" (indirect prompt injection rò rỉ 2000 khách hàng qua email) và "Trả lời mẫu khi phỏng vấn"
- claude-035: thêm "Ví dụ đời thực" (least privilege: agent truy cập vượt quyền vùng + tạo ticket xóa DB) và "Trả lời mẫu khi phỏng vấn"
- claude-036: thêm "Ví dụ đời thực" (chatbot lộ CCCD/lương qua tool_result, log debug) và "Trả lời mẫu khi phỏng vấn"
- Tất cả 6 câu hỏi đã có sẵn field `follow` (2-3 câu), không cần thêm.
- Sửa lỗi nested braces trong inline code (dùng code block `~~~json` thay thế) để pass validation.
Reviewed-by: kilo (T1332R)
