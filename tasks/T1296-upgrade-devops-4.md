# T1296 — Nâng cấp đáp án q-devops: devops-019 … devops-024

Status: DONE
Agent: kilo
Owns: `js/data/q-devops.js`
After: T1278

> **Tinh giản (2026-11-09):** web chỉ dùng để tự ôn. Ưu tiên số 1 là **kiến thức đúng**; không cần đạt đủ độ dài/số từ, viết ngắn gọn, dễ hiểu là được. Mục nào không chắc đúng thì bỏ.

Nâng cấp 6 đáp án (field `a`) dưới đây cho đủ chuẩn AGENTS.md mục 6. Người học tự ôn, không có ai giảng thêm, nên phần bổ sung phải **cụ thể, đúng kỹ thuật, dễ hiểu**.

- `devops-019` (5970 ký tự): thiếu Ví dụ đời thực
- `devops-020` (6024 ký tự): thiếu Ví dụ đời thực
- `devops-021` (6241 ký tự): thiếu Ví dụ đời thực
- `devops-022` (6201 ký tự): thiếu Ví dụ đời thực
- `devops-023` (6340 ký tự): thiếu Ví dụ đời thực
- `devops-024` (5784 ký tự): thiếu Ví dụ đời thực

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

- Đã thêm mục `### Ví dụ đời thực` (700–1200 ký tự, mạch triệu chứng → điều tra → nguyên nhân gốc → cách xử lý → kết quả đo được) vào 6 đáp án devops-019, devops-020, devops-021, devops-022, devops-023, devops-024, chèn ngay trước dòng `> Senior tip:` của từng id.
- Mỗi đáp án đã có `### Trả lời miệng 1 phút` nên KHÔNG thêm `### Trả lời mẫu khi phỏng vấn` (theo quy tắc task). Mỗi id đã có `follow` (2–3 câu) nên không bổ sung. Tất cả đáp án đều > 3000 ký tự nên không cần thêm phần Cơ chế.
- `node --check js/data/q-devops.js` → OK. `node scripts/validate.js q-devops.js` → không báo lỗi nào cho devops.
- Chưa đạt `node scripts/build-light-index.js` + `node scripts/validate.js` → OK toàn diện do lỗi cú pháp trước đó trong `js/data/q-aws.js` (dấu backtick trong template literal khiến topic aws nạp 0 câu, index-light bị báo cũ). File `q-aws.js` KHÔNG thuộc quyền sở hữu T1296 (`Owns: js/data/q-devops.js`), tuân theo luật 3 AGENTS.md đã không sửa. Khi `q-aws.js` được chủ sở hữu sửa xong, chạy lại build-light-index.js + validate.js sẽ OK vì sửa của task chỉ động vào trường `a` (không lưu trong index-light).
Reviewed-by: kilo (T1296R)
