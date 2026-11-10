# T1386 — Nâng cấp đáp án q-java: modern-045 … modern-046

Status: DONE
Agent: kilo
Owns: `js/data/q-java.js`
After: T1380

> **Tinh giản (2026-11-09):** web chỉ dùng để tự ôn. Ưu tiên số 1 là **kiến thức đúng**; không cần đạt đủ độ dài/số từ, viết ngắn gọn, dễ hiểu là được. Mục nào không chắc đúng thì bỏ.

Nâng cấp 2 đáp án (field `a`) dưới đây cho đủ chuẩn AGENTS.md mục 6. Người học tự ôn, không có ai giảng thêm, nên phần bổ sung phải **cụ thể, đúng kỹ thuật, dễ hiểu**.

- `modern-045` (4352 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `modern-046` (4321 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu

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
- `modern-045`: thêm `### Ví dụ đời thực` (triệu chứng → điều tra grep/log/CI → nguyên nhân nhánh else im lặng khi thêm subtype → xử lý switch exhaustive + case null → kết quả) và `### Trả lời mẫu khi phỏng vấn` (150–220 từ), chèn ngay trước `> Senior tip:`; giữ nguyên `follow` có sẵn.
- `modern-046`: thêm `### Ví dụ đời thực` (migrate Java 8→21 cho hệ thống thanh toán, baseline/CI/canary, lỗi InaccessibleObjectException/NoClassDefFoundError, lộ trình LTS và kết quả đo được) và `### Trả lời mẫu khi phỏng vấn`, chèn ngay trước `> Senior tip:`; giữ nguyên `follow` có sẵn.
- Đã chạy `node scripts/build-light-index.js` (OK) và `node scripts/validate.js`: còn 3 lỗi pre-existing ngoài phạm vi sở hữu tại `q-spring-data.js` (db-036/037/038 tiêu đề ### bị thụt đầu dòng); không phát sinh lỗi mới từ `q-java.js` hay `index-light.js`. Không sửa file ngoài task, không commit.
Reviewed-by: kilo (T1386R)
