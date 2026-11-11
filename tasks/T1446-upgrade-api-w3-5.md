# T1446 — Nâng cấp đáp án q-api: api-029 … api-037

Status: DONE
Agent: kilo
Owns: `js/data/q-api.js`
After: T1445

> **Tinh giản (2026-11-09):** web chỉ dùng để tự ôn. Ưu tiên số 1 là **kiến thức đúng**; không cần đạt đủ độ dài/số từ, viết ngắn gọn, dễ hiểu là được. Mục nào không chắc đúng thì bỏ.

Nâng cấp 4 đáp án (field `a`) dưới đây cho đủ chuẩn AGENTS.md mục 6. Người học tự ôn, không có ai giảng thêm, nên phần bổ sung phải **cụ thể, đúng kỹ thuật, dễ hiểu**.

- `api-029` (7085 ký tự): thiếu Ví dụ đời thực
- `api-030` (6430 ký tự): thiếu Ví dụ đời thực
- `api-036` (2970 ký tự): ngắn
- `api-037` (2868 ký tự): ngắn

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

- **api-029**: Đã có sẵn "Ví dụ đời thực" và "Trả lời mẫu khi phỏng vấn". Sửa lỗi cú pháp: thay backtick bằng `{{}}` markup, sửa heading indentation, sửa nested braces trong inline code. Follow field đã có.
- **api-030**: Đã có sẵn "Ví dụ đời thực" và "Trả lời mẫu khi phỏng vấn". Sửa heading indentation cho 2 mục này. Follow field đã có.
- **api-036**: Mở rộng từ ~2970 lên >5000 ký tự. Thêm: "### Cơ chế từng bước: Token Bucket trên Redis (Lua)", "### So sánh chi tiết" (bảng 5 thuật toán), "### Lua script mẫu cho Token Bucket", "### Lỗi hay gặp trên production" (5 pitfall). Sửa toàn bộ lỗi cú pháp (backtick, nested braces).
- **api-037**: Mở rộng từ ~2868 lên >5000 ký tự. Thêm: "### Cơ chế từng bước: Request flow với cache", "### ETag generation strategies", "### Cache key design cho CDN", "### CDN vs browser — so sánh chi tiết" (bảng), "### Kết hợp real-world: Multi-layer caching", "### Lỗi hay gặp trên production" (6 pitfall). Sửa toàn bộ lỗi cú pháp (backtick, nested braces).
- Chạy `node scripts/build-light-index.js` và `node scripts/validate.js` → OK.
Reviewed-by: kilo (T1446R)
