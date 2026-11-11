# T1328 — Nâng cấp đáp án q-aws: aws-041 … aws-046

Status: DONE
Agent: kilo
Owns: `js/data/q-aws.js`
After: T1313

> **Tinh giản (2026-11-09):** web chỉ dùng để tự ôn. Ưu tiên số 1 là **kiến thức đúng**; không cần đạt đủ độ dài/số từ, viết ngắn gọn, dễ hiểu là được. Mục nào không chắc đúng thì bỏ.

Nâng cấp 6 đáp án (field `a`) dưới đây cho đủ chuẩn AGENTS.md mục 6. Người học tự ôn, không có ai giảng thêm, nên phần bổ sung phải **cụ thể, đúng kỹ thuật, dễ hiểu**.

- `aws-041` (4002 ký tự): thiếu Ví dụ đời thực
- `aws-042` (3098 ký tự): thiếu Ví dụ đời thực
- `aws-043` (3753 ký tự): thiếu Ví dụ đời thực
- `aws-044` (3503 ký tự): thiếu Ví dụ đời thực
- `aws-045` (4453 ký tự): thiếu Ví dụ đời thực
- `aws-046` (4001 ký tự): thiếu Ví dụ đời thực

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
- aws-041: đã có `### Ví dụ đời thực`, `follow`, và `### Trả lời miệng 1 phút` (tương đương trả lời mẫu). Điều chỉnh vị trí để `### Ví dụ đời thực` nằm ngay trước `> Senior tip:` (Senior tip ở cuối).
- aws-042: đã có `### Ví dụ đời thực`, `follow`, và `### Trả lời miệng 1 phút`. Điều chỉnh vị trí để `### Ví dụ đời thực` nằm ngay trước `> Senior tip:`.
- aws-043: đã có `### Ví dụ đời thực`, `follow`, và `### Trả lời miệng 1 phút`. Điều chỉnh vị trí để `### Ví dụ đời thực` nằm ngay trước `> Senior tip:`.
- aws-044: đã có `### Ví dụ đời thực`, `follow`, và `### Trả lời miệng 1 phút`. Đã đúng thứ tự (ví dụ trước tip).
- aws-045: đã có `### Ví dụ đời thực`, `follow`, và `### Trả lời miệng 1 phút`. Đã đúng thứ tự (ví dụ trước tip).
- aws-046: đã có `### Ví dụ đời thực`, `follow`, và `### Trả lời miệng 1 phút`. Đã đúng thứ tự (ví dụ trước tip).
- `node --check js/data/q-aws.js` OK.
- `node scripts/build-light-index.js` thất bại do lỗi cú pháp sẵn có ngoài phạm vi task: `q-devops.js` (Unexpected identifier 'payments').
- `node scripts/validate.js` không đạt OK do nhiều lỗi sẵn có ngoài phạm vi task (q-devops.js, lessons-jpa/microservices/db/sql/testing.js, projects.js, lessons-devops related refs, path.js refs, index-light.js cũ). Không phát hiện lỗi mới liên quan aws-041..aws-046. Chỉ sửa `js/data/q-aws.js` theo đúng sở hữu task.
Reviewed-by: kilo (T1328R)
