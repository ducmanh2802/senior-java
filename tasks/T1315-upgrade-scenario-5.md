# T1315 — Nâng cấp đáp án q-scenario: scenario-064 … scenario-069

Status: DONE
Agent: kilo
Owns: `js/data/q-scenario.js`
After: T1300

> **Tinh giản (2026-11-09):** web chỉ dùng để tự ôn. Ưu tiên số 1 là **kiến thức đúng**; không cần đạt đủ độ dài/số từ, viết ngắn gọn, dễ hiểu là được. Mục nào không chắc đúng thì bỏ.

Nâng cấp 6 đáp án (field `a`) dưới đây cho đủ chuẩn AGENTS.md mục 6. Người học tự ôn, không có ai giảng thêm, nên phần bổ sung phải **cụ thể, đúng kỹ thuật, dễ hiểu**.

- `scenario-064` (4971 ký tự): thiếu Ví dụ đời thực
- `scenario-065` (5945 ký tự): thiếu Ví dụ đời thực
- `scenario-066` (5568 ký tự): thiếu Ví dụ đời thực
- `scenario-067` (5100 ký tự): thiếu Ví dụ đời thực
- `scenario-068` (5225 ký tự): thiếu Ví dụ đời thực
- `scenario-069` (5784 ký tự): thiếu Ví dụ đời thực

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
- Đã thêm mục `### Ví dụ đời thực` (700–1200 ký tự: triệu chứng → điều tra bằng lệnh/metric/log cụ thể → nguyên nhân gốc → cách xử lý → kết quả đo được) vào 6 đáp án: scenario-064 (CPU throttling/CFS quota trên K8s), scenario-065 (Kafka rebalance storm do max.poll.records/interval), scenario-066 (poison message/DLT trong Kafka), scenario-067 (capacity planning consumer lag), scenario-068 (nâng Java 8/11 → 21), scenario-069 (nâng Spring Boot 2.7 → 3). Mọi mục chèn ngay trước dòng `> Senior tip:`; không xóa hoặc viết lại nội dung cũ.
- Tất cả 6 đáp án đã có `follow` (2–3 câu) và mục "Trả lời miệng 1 phút" tương đương, nên không thêm mục `### Trả lời mẫu khi phỏng vấn` hay trường mới khác theo quy tắc task.
- `node --check js/data/q-scenario.js`: OK. `node scripts/validate.js`: q-scenario.js không lỗi. Lỗi còn lại là cú pháp cũ trong `q-aws.js` và `q-soft.js` (không thuộc quyền sở hữu T1315, đã bị hỏng trong working tree trước khi tác vụ bắt đầu, không được can thiệp theo quy tắc 3 AGENTS.md).
Reviewed-by: kilo (T1315R)
