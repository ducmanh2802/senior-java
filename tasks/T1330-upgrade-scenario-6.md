# T1330 — Nâng cấp đáp án q-scenario: scenario-070 … scenario-075

Status: DONE
Agent: kilo
Owns: `js/data/q-scenario.js`
After: T1315

> **Tinh giản (2026-11-09):** web chỉ dùng để tự ôn. Ưu tiên số 1 là **kiến thức đúng**; không cần đạt đủ độ dài/số từ, viết ngắn gọn, dễ hiểu là được. Mục nào không chắc đúng thì bỏ.

Nâng cấp 6 đáp án (field `a`) dưới đây cho đủ chuẩn AGENTS.md mục 6. Người học tự ôn, không có ai giảng thêm, nên phần bổ sung phải **cụ thể, đúng kỹ thuật, dễ hiểu**.

- `scenario-070` (5437 ký tự): thiếu Ví dụ đời thực
- `scenario-071` (5823 ký tự): thiếu Ví dụ đời thực
- `scenario-072` (5044 ký tự): thiếu Ví dụ đời thực
- `scenario-073` (5332 ký tự): thiếu Ví dụ đời thực
- `scenario-074` (4524 ký tự): thiếu Ví dụ đời thực
- `scenario-075` (4945 ký tự): thiếu Ví dụ đời thực

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

Hoàn chỉnh 6 câu scenario-070..075:
- scenario-075: bổ sung `### Ví dụ đời thực` (796 ký tự: triệu chứng → điều tra → nguyên nhân → xử lý → kết quả); `follow` (3 câu) và `Trả lời miệng 1 phút` (tương đương Trả lời mẫu, theo luật task không thêm trùng) đã có.
- Sửa lỗi cú pháp template literal (backtick trong nội dung) do lần chạy trước bỏ sót: Ví dụ đời thực của scenario-070, 071, 072, 073, 074; Trả lời mẫu của scenario-070, 074; thay chữ số Trung Quốc (第一…第四) trong Trả lời mẫu scenario-074 bằng "Bước 1…4".
- Chạy `node scripts/build-light-index.js` rồi `node scripts/validate.js` → OK. Không commit.
Reviewed-by: kilo (T1330R)
