# T1351 — Nâng cấp đáp án q-scenario: scenario-082 … scenario-103

Status: DONE
Agent: kilo
Owns: `js/data/q-scenario.js`
After: T1341

> **Tinh giản (2026-11-09):** web chỉ dùng để tự ôn. Ưu tiên số 1 là **kiến thức đúng**; không cần đạt đủ độ dài/số từ, viết ngắn gọn, dễ hiểu là được. Mục nào không chắc đúng thì bỏ.

Nâng cấp 6 đáp án (field `a`) dưới đây cho đủ chuẩn AGENTS.md mục 6. Người học tự ôn, không có ai giảng thêm, nên phần bổ sung phải **cụ thể, đúng kỹ thuật, dễ hiểu**.

- `scenario-082` (4580 ký tự): thiếu Ví dụ đời thực
- `scenario-083` (4509 ký tự): thiếu Ví dụ đời thực
- `scenario-084` (4104 ký tự): thiếu Ví dụ đời thực
- `scenario-085` (4388 ký tự): thiếu Ví dụ đời thực
- `scenario-086` (4234 ký tự): thiếu Ví dụ đời thực
- `scenario-103` (3714 ký tự): thiếu Ví dụ đời thực

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
- `scenario-082`: đã có `### Ví dụ đời thực`, `### Trả lời miệng 1 phút`, `follow`; giữ nguyên (đủ theo yêu cầu, Senior tip ở cuối).
- `scenario-083`: đã có `### Ví dụ đời thực`, `### Trả lời miệng 1 phút`, `follow`; giữ nguyên.
- `scenario-084`: **đã thêm** `### Ví dụ đời thực` (triệu chứng → điều tra → nguyên nhân gốc → cách xử lý → kết quả đo được, có số liệu) ngay trước `> Senior tip:`; giữ nguyên nội dung cũ và `follow`.
- `scenario-085`: đã có `### Ví dụ đời thực`, `### Trả lời miệng 1 phút`, `follow`; giữ nguyên.
- `scenario-086`: đã có `### Ví dụ đời thực`, `### Trả lời miệng 1 phút`, `follow`; giữ nguyên.
- `scenario-103`: đã có `### Ví dụ đời thực`, `### Trả lời mẫu khi phỏng vấn` (và phần trả lời tiếng Anh), `follow`; giữ nguyên (không thêm mục trả lời mẫu trùng).
- Kiểm tra: `node --check js/data/q-scenario.js` → SYNTAX_OK.
- `node scripts/build-light-index.js` và `node scripts/validate.js` **không thể hoàn tất tới OK trong workspace hiện tại** do lỗi cú pháp/tham chiếu ở các file ngoài phạm vi sở hữu (vd. `js/data/q-devops.js`, `js/data/lessons-jpa.js`, `js/data/lessons-microservices.js`, `js/data/lessons-db.js`, `js/data/lessons-sql.js`, `js/data/lessons-testing.js`, `js/data/projects.js`, và các lỗi `lessons-devops.js`/`path.js`/`index-light.js` cũ đã tồn tại). Không sửa file ngoài scope theo luật task/AGENTS. Cần integrator hoặc task sở hữu các file trên xử lý trước khi chạy lại validate toàn cục.
Reviewed-by: kilo (T1351R)
