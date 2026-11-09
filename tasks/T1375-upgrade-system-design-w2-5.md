# T1375 — Nâng cấp đáp án q-system-design: design-031 … architecture-031

Status: DONE
Agent: kilo
Owns: `js/data/q-system-design.js`
After: T1367

> **Tinh giản (2026-11-09):** web chỉ dùng để tự ôn. Ưu tiên số 1 là **kiến thức đúng**; không cần đạt đủ độ dài/số từ, viết ngắn gọn, dễ hiểu là được. Mục nào không chắc đúng thì bỏ.

Nâng cấp 6 đáp án (field `a`) dưới đây cho đủ chuẩn AGENTS.md mục 6. Người học tự ôn, không có ai giảng thêm, nên phần bổ sung phải **cụ thể, đúng kỹ thuật, dễ hiểu**.

- `design-031` (1384 ký tự): ngắn, thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `design-032` (1088 ký tự): ngắn, thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `design-033` (1166 ký tự): ngắn, thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `design-034` (1224 ký tự): ngắn, thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `design-035` (1032 ký tự): ngắn, thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `architecture-031` (7946 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu

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

Đã nâng cấp 6 đáp án (design-031, design-032, design-033, design-034, design-035, architecture-031):
- Thêm mục `### Ví dụ đời thực` (tình huống production có số liệu: triệu chứng → điều tra → nguyên nhân gốc → xử lý → kết quả đo được) cho cả 6 id.
- Thêm mục `### Trả lời mẫu khi phỏng vấn` (150–220 từ, ngôi thứ nhất) cho cả 6 id.
- Bổ sung giải thích cơ chế chi tiết (ZSET internals, idempotent update, tie-break composite, sharding, monitoring; fan-out hybrid, presence/reconnect, ordering/idempotency; chunking CDC, manifest, salt, GC; hold phase, expiry worker, waitlist, pessimistic/optimistic; fencing token, GC pause kịch bản) để mỗi đáp án đạt 3000–5000 ký tự (architecture-031 đã dài, chỉ thêm 2 mục).
- Chèn các mục ngay trước dòng `> Senior tip:`; field `follow` đã có (2–3 câu) nên giữ nguyên.
- Không dùng backtick/`${` trong đáp án (dùng {{code}} hoặc plain text), không xoá nội dung cũ.
- Chỉ sửa file `js/data/q-system-design.js` (file sở hữu của task).
Reviewed-by: kilo (T1375R)
