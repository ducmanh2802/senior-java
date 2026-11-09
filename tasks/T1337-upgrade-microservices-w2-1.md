# T1337 — Nâng cấp đáp án q-microservices: microservices-037 … microservices-042

Status: DONE
Agent: kilo
Owns: `js/data/q-microservices.js`
After: T1324

> **Tinh giản (2026-11-09):** web chỉ dùng để tự ôn. Ưu tiên số 1 là **kiến thức đúng**; không cần đạt đủ độ dài/số từ, viết ngắn gọn, dễ hiểu là được. Mục nào không chắc đúng thì bỏ.

Nâng cấp 6 đáp án (field `a`) dưới đây cho đủ chuẩn AGENTS.md mục 6. Người học tự ôn, không có ai giảng thêm, nên phần bổ sung phải **cụ thể, đúng kỹ thuật, dễ hiểu**.

- `microservices-037` (5599 ký tự): thiếu Ví dụ đời thực
- `microservices-038` (6039 ký tự): thiếu Ví dụ đời thực
- `microservices-039` (7034 ký tự): thiếu Ví dụ đời thực
- `microservices-040` (6473 ký tự): thiếu Ví dụ đời thực
- `microservices-041` (5865 ký tự): thiếu Ví dụ đời thực
- `microservices-042` (7048 ký tự): thiếu Ví dụ đời thực

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

Hoàn tất: chèn mục `### Ví dụ đời thực` (700–1200 ký tự, tình huống production có số liệu, mạch triệu chứng → điều tra → nguyên nhân gốc → xử lý → kết quả) vào 6 đáp án `microservices-037` … `microservices-042` trong `js/data/q-microservices.js`, đặt ngay trước dòng `> Senior tip:` của mỗi id.
- Không thêm `### Trả lời mẫu khi phỏng vấn`: cả 6 đã có mục tương đương là `### Trả lời miệng 1 phút`.
- Không thêm field `follow`: cả 6 đã có `follow` 2–4 câu.
- Không cần dài hơn: 6 đáp án đều đã >3000 ký tự (5599–7048), thỏa chuẩn độ dài.
- Không xoá/sửa nội dung cũ, không đụng câu hỏi khác, không động file khác.
- Đã chạy `node scripts/build-light-index.js` rồi `node scripts/validate.js` → `OK — không có lỗi.`; `node --check js/data/q-microservices.js` OK. Không commit.
Reviewed-by: kilo (T1337R)
