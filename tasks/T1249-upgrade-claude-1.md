# T1249 — Nâng cấp đáp án q-claude: claude-001 … claude-006

Status: DONE
Agent: kilo
Owns: `js/data/q-claude.js`

Nâng cấp 6 đáp án (field `a`) dưới đây cho đủ chuẩn AGENTS.md mục 6. Người học tự ôn, không có ai giảng thêm, nên phần bổ sung phải **cụ thể, đúng kỹ thuật, dễ hiểu**.

- `claude-001` (3750 ký tự): thiếu Ví dụ đời thực
- `claude-002` (3404 ký tự): thiếu Ví dụ đời thực
- `claude-003` (4469 ký tự): thiếu Ví dụ đời thực
- `claude-004` (3978 ký tự): thiếu Ví dụ đời thực
- `claude-005` (3817 ký tự): thiếu Ví dụ đời thực
- `claude-006` (3747 ký tự): thiếu Ví dụ đời thực

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
- `claude-001`–`claude-006`: mỗi id thêm mục `### Ví dụ đời thực` (triệu chứng → điều tra → nguyên nhân gốc → cách xử lý → kết quả đo được, có số liệu/lệnh/metric cụ thể) chèn ngay trước `> Senior tip:`; giữ nguyên nội dung cũ (đã có `### Trả lời miệng 1 phút` nên không thêm mục trả lời mẫu trùng). Tất cả dùng tiếng Việt có dấu, `{{code}}` inline, không backtick/`${`.
- Fix nhỏ trong phần thêm của `claude-006`: bỏ inline code lồng ngoặc nhọn (`{{cache_control: {{"type":"ephemeral"}}}}` → chữ thường) và sửa ký tự lạ "维护" → "bảo trì" để qua validate.
- Kiểm tra: `node --check js/data/q-claude.js` OK. `node scripts/validate.js` không báo lỗi nào cho `q-claude.js`.
- Lưu ý môi trường (không thuộc file sở hữu): `node scripts/build-light-index.js` và `node scripts/validate.js` vẫn FAIL do lỗi có sẵn ngoài phạm vi task — `q-microservices.js` lỗi cú pháp (Unexpected identifier 'kubectl' tại dòng ~81, chặn build-light-index), `q-security.js` có inline code lồng ngoặc nhọn, và nhiều file (`bugs.js`, `lessons-microservices.js`, `lessons-devops.js`, `projects.js`, `path.js`) tham chiếu `microservices-*` không tồn tại. Cần integrator/owner các file đó xử lý trước khi toàn repo đạt `OK — không có lỗi.`
- 2026-11-09 05:10 (Claude): đặt lại TODO — phần đã làm bị guard bản lỗi hoàn tác (đêm 8/11). Làm lại; giữ phần đã có nếu còn trong file.
- 2026-11-09 22:15 (Kilo): Hoàn thành 6 id. Mỗi id đã thêm `### Ví dụ đời thực` (~700-1200 ký tự) với kịch hình production thực tế: claude-001 (deploy sai làm mất history), claude-002 (max_tokens cắt JSON), claude-003 (Nginx buffer SSE), claude-004 (thundering herd 429), claude-005 (traffic gấp 12, ITPM vượt limit), claude-006 (timestamp trong system prompt vỡ cache). `node --check` OK, `node scripts/build-light-index.js` OK, `node scripts/validate.js` → `OK — không có lỗi.` (cảnh báo path.js là lỗi có sẵn ngoài phạm vi).
Reviewed-by: kilo (T1249R)
