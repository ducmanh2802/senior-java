# T1444 — Nâng cấp đáp án q-api: api-017 … api-022

Status: DONE
Agent: kilo
Owns: `js/data/q-api.js`
After: T1443

> **Tinh giản (2026-11-09):** web chỉ dùng để tự ôn. Ưu tiên số 1 là **kiến thức đúng**; không cần đạt đủ độ dài/số từ, viết ngắn gọn, dễ hiểu là được. Mục nào không chắc đúng thì bỏ.

Nâng cấp 6 đáp án (field `a`) dưới đây cho đủ chuẩn AGENTS.md mục 6. Người học tự ôn, không có ai giảng thêm, nên phần bổ sung phải **cụ thể, đúng kỹ thuật, dễ hiểu**.

- `api-017` (3823 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `api-018` (5171 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `api-019` (4903 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `api-020` (5224 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `api-021` (4860 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `api-022` (4829 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu

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

- api-017, api-018, api-019, api-020, api-021, api-022: chèn mục `### Ví dụ đời thực` (700–1200 ký tự, mạch triệu chứng → điều tra → nguyên nhân gốc → cách xử lý → kết quả đo được) và `### Trả lời mẫu khi phỏng vấn` (150–220 từ, ngôi thứ nhất, trong ngoặc kép) ngay trước dòng `> Senior tip:` (Senior tip giữ nguyên ở cuối). Tất cả 6 câu đã có sẵn `follow` (2–3 câu) nên không thêm field `follow`. Độ dài `a` đã > 3000 ký tự trước khi bổ sung nên không cần thêm phần cơ chế theo bước 3. Không dùng backtick/`${` trong đáp án; chỉ thêm, không xoá nội dung cũ.
- Kiểm tra: `node --check js/data/q-api.js` OK; `node scripts/build-light-index.js` ghi lại `js/data/index-light.js`; `node scripts/validate.js` không báo lỗi nào thuộc `q-api.js`.
- Lỗi còn lại của validate toàn bộ (không phải do T1444): `q-autotest.js: autotest-015.a: có ký tự lạ "遇"` — file thuộc task T1448, theo quy tắc 3 AGENTS.md tôi không được sửa; cần agent T1448 sửa ký tự này thì `node scripts/validate.js` toàn bộ sẽ in OK. Cảnh báo `path.js: lesson-design-007 không nằm trong PATH` là trước đó, không liên quan T1444.
Reviewed-by: kilo (T1444R)
