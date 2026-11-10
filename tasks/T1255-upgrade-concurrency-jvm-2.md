# T1255 — Nâng cấp đáp án q-concurrency-jvm: concurrency-007 … concurrency-012

Status: DONE
Agent: kilo
Owns: `js/data/q-concurrency-jvm.js`
After: T1237

Nâng cấp 6 đáp án (field `a`) dưới đây cho đủ chuẩn AGENTS.md mục 6. Người học tự ôn, không có ai giảng thêm, nên phần bổ sung phải **cụ thể, đúng kỹ thuật, dễ hiểu**.

- `concurrency-007` (7295 ký tự): thiếu Ví dụ đời thực
- `concurrency-008` (5705 ký tự): thiếu Ví dụ đời thực
- `concurrency-009` (6512 ký tự): thiếu Ví dụ đời thực
- `concurrency-010` (5513 ký tự): thiếu Ví dụ đời thực
- `concurrency-011` (6024 ký tự): thiếu Ví dụ đời thực
- `concurrency-012` (6125 ký tự): thiếu Ví dụ đời thực

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

- 2026-11-09 (kilo): Xác minh `js/data/q-concurrency-jvm.js` — concurrency-007..012 đều có `### Ví dụ đời thực` (trước `> Senior tip:`), đã có `### Trả lời miệng 1 phút` (tương đương trả lời mẫu, không thêm trùng), `follow` đầy đủ, không có backtick/`${` trong `a` (007 a=7894, 008 a=6483, 009 a=6954, 010 a=6194, 011 a=6274, 012 a=6875). `node --check js/data/q-concurrency-jvm.js` OK; load bằng shim Node OK.
- Không chạy được `node scripts/build-light-index.js`/`node scripts/validate.js` end-to-end do lỗi cú pháp **sẵn có** ngoài phạm vi task: `js/data/lessons-ai.js` (`LinkedHashMap` gây `SyntaxError` khi build-light-index eval) và các lỗi/cảnh báo khác trong `q-remote.js`, `projects.js`, `path.js`, `index-light.js` — không thuộc quyền sở hữu T1255, không sửa. Cần integrator sửa `lessons-ai.js` rồi chạy lại validate/build-light-index.
Reviewed-by: kilo (T1255R)
