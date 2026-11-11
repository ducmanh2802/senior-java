# T1360 — Nâng cấp đáp án q-scenario: scenario-104 … scenario-110

Status: DONE
Agent: kilo
Owns: `js/data/q-scenario.js`
After: T1351

> **Tinh giản (2026-11-09):** web chỉ dùng để tự ôn. Ưu tiên số 1 là **kiến thức đúng**; không cần đạt đủ độ dài/số từ, viết ngắn gọn, dễ hiểu là được. Mục nào không chắc đúng thì bỏ.

Nâng cấp 6 đáp án (field `a`) dưới đây cho đủ chuẩn AGENTS.md mục 6. Người học tự ôn, không có ai giảng thêm, nên phần bổ sung phải **cụ thể, đúng kỹ thuật, dễ hiểu**.

- `scenario-104` (3380 ký tự): thiếu Ví dụ đời thực
- `scenario-105` (3488 ký tự): thiếu Ví dụ đời thực
- `scenario-107` (2930 ký tự): ngắn, thiếu Trả lời mẫu
- `scenario-108` (2961 ký tự): ngắn
- `scenario-109` (3725 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `scenario-110` (3419 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu

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
- scenario-108: bổ sung mục "### Ví dụ đời thực" (hạn mức vip ví điện tử: triệu chứng → điều tra log/mã lỗi → nguyên nhân gốc → xử lý → kết quả) ngay trước "Senior tip"; độ dài 2961 → 4115 ký tự. follow (2 câu) đã có.
- scenario-109: bổ sung "### Ví dụ đời thực" (rollout feature flag 5%→100%, kill switch khi p99 tăng) và "### Trả lời mẫu khi phỏng vấn" trước "Senior tip"; 3567 → 4880 ký tự. follow (2 câu) đã có.
- scenario-110: bổ sung "### Ví dụ đời thực" (bot spam /login, /otp; giới hạn ở gateway qua Redis/Lua, 429 + Retry-After) và "### Trả lời mẫu khi phỏng vấn"; 3419 → 5341 ký tự. follow (2 câu) đã có.
- scenario-104, 105, 107: đã có đủ "Ví dụ đời thực", "Trả lời mẫu", follow từ trước → giữ nguyên, không sửa.
- Sửa lỗi cú pháp cũ: 6 dòng trong scenario-104/105/107 chứa dấu backtick trong template literal (làm hỏng build-light-index/validate) → chuyển sang {{code}}.
- Kết quả: node --check js/data/q-scenario.js OK; node scripts/validate.js q-scenario.js không báo lỗi nào cho file này. Full validate.js không đạt OK do lỗi cú pháp cũ trong 7 file của các task khác (lessons-db/devops/jpa/microservices/sql/testing.js, projects.js) và index-light.js cũ do nội dung task khác — không thuộc quyền sở hữu T1360, do đó không sửa (AGENTS.md mục 3).
Reviewed-by: kilo (T1360R)
