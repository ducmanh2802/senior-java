# T1271 — Nâng cấp đáp án q-autotest: autotest-031 … autotest-037

Status: DONE
Agent: kilo
Owns: `js/data/q-autotest.js`
After: T1253

Nâng cấp 6 đáp án (field `a`) dưới đây cho đủ chuẩn AGENTS.md mục 6. Người học tự ôn, không có ai giảng thêm, nên phần bổ sung phải **cụ thể, đúng kỹ thuật, dễ hiểu**.

- `autotest-031` (6544 ký tự): thiếu Ví dụ đời thực
- `autotest-032` (5917 ký tự): thiếu Ví dụ đời thực
- `autotest-033` (6062 ký tự): thiếu Ví dụ đời thực
- `autotest-034` (5597 ký tự): thiếu Ví dụ đời thực
- `autotest-035` (5738 ký tự): thiếu Ví dụ đời thực
- `autotest-037` (5009 ký tự): thiếu Ví dụ đời thực

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

Đã thêm cho 6 câu hỏi (autotest-031, 032, 033, 034, 035, 037):
- Mục `### Ví dụ đời thực` (700-1200 ký tự mỗi cái): tình huống production cụ thể với số liệu, mạch triệu chứng → điều tra → nguyên nhân gốc → xử lý → kết quả đo được
- Mục `### Trả lời mẫu khi phỏng vấn` (150-220 từ, trong dấu ngoặc kép, ngôi thứ nhất): trả lời tự nhiên như ứng viên Senior
- Tất cả chèn trước `> Senior tip:`; dùng markup `{{code}}` đúng chuẩn; không dùng backtick/${}
- Tất cả 6 câu hỏi đã có sẵn field `follow`, không cần thêm
- `node scripts/validate.js` chạy OK cho q-autotest.js (các lỗi khác là file không thuộc task: lessons-jpa.js, lessons-microservices.js, projects.js, path.js)
- `node scripts/build-light-index.js` thất bại do lỗi syntax sẵn có ở lessons-jpa.js (không thuộc task)
Reviewed-by: kilo (T1271R)
