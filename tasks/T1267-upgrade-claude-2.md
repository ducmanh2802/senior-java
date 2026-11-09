# T1267 — Nâng cấp đáp án q-claude: claude-007 … claude-012

Status: DONE
Agent: kilo
Owns: `js/data/q-claude.js`
After: T1249

Nâng cấp 6 đáp án (field `a`) dưới đây cho đủ chuẩn AGENTS.md mục 6. Người học tự ôn, không có ai giảng thêm, nên phần bổ sung phải **cụ thể, đúng kỹ thuật, dễ hiểu**.

- `claude-007` (3425 ký tự): thiếu Ví dụ đời thực
- `claude-008` (3004 ký tự): thiếu Ví dụ đời thực
- `claude-009` (3512 ký tự): thiếu Ví dụ đời thực
- `claude-010` (3259 ký tự): thiếu Ví dụ đời thực
- `claude-011` (3312 ký tự): thiếu Ví dụ đời thực
- `claude-012` (3427 ký tự): thiếu Ví dụ đời thực

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

Đã bổ sung mục `### Ví dụ đời thực` (700–1200 ký tự, mạch triệu chứng → điều tra → nguyên nhân gốc → xử lý → kết quả đo được, kèm số liệu) cho 6 id claude-007, claude-008, claude-009, claude-010, claude-011, claude-012, chèn ngay trước dòng `> Senior tip:`; mở rộng thêm cho 3 mục gốc ngắn dưới 700 ký tự (claude-008: 618→1096, claude-009: 699→903, claude-011: 695→862). Mục `### Trả lời mẫu khi phỏng vấn` đã có tương đương là `### Trả lời miệng 1 phút` nên không thêm theo quy tắc task. Trường `follow` đã có 2 câu (đủ yêu cầu 2–3) cho tất cả 6 id. Không xóa/sửa nội dung cũ, không dùng backtick hay `${`, chỉ sửa file q-claude.js. Đã chạy `node scripts/build-light-index.js` rồi `node scripts/validate.js` → OK — không có lỗi. Không commit.
Reviewed-by: kilo (T1267R)
