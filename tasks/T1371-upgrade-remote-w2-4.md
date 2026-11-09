# T1371 — Nâng cấp đáp án q-remote: remote-055 … remote-060

Status: DONE
Agent: kilo
Owns: `js/data/q-remote.js`
After: T1362

> **Tinh giản (2026-11-09):** web chỉ dùng để tự ôn. Ưu tiên số 1 là **kiến thức đúng**; không cần đạt đủ độ dài/số từ, viết ngắn gọn, dễ hiểu là được. Mục nào không chắc đúng thì bỏ.

Nâng cấp 6 đáp án (field `a`) dưới đây cho đủ chuẩn AGENTS.md mục 6. Người học tự ôn, không có ai giảng thêm, nên phần bổ sung phải **cụ thể, đúng kỹ thuật, dễ hiểu**.

- `remote-055` (4181 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `remote-056` (3904 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `remote-057` (3984 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `remote-058` (4159 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `remote-059` (1878 ký tự): ngắn, thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `remote-060` (4720 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu

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
- `remote-055`: thêm `### Ví dụ đời thực` (invite/tối ưu proposal, GMT+7, số liệu trước/sau) và `### Trả lời mẫu khi phỏng vấn` (đoạn nói ngôi thứ nhất); chèn trước `> Senior tip:`. Đã có `follow` (3 câu), giữ nguyên.
- `remote-056`: thêm `### Ví dụ đời thực` (case migration Java 8/Spring Boot 2→3, javax→jakarta, số liệu test/startup/dependency) và `### Trả lời mẫu khi phỏng vấn`; chèn trước `> Senior tip:`. Đã có `follow`, giữ nguyên.
- `remote-057`: thêm `### Ví dụ đời thực` (dùng AI sai cách → lộ thông tin tiềm ẩn/proposal chung; xử lý ẩn danh hoá + tự viết lại, số liệu) và `### Trả lời mẫu khi phỏng vấn`; chèn trước `> Senior tip:`. Đã có `follow`, giữ nguyên.
- `remote-058` (lead): thêm `### Ví dụ đời thực` (roadmap 12 tháng, retainer/referral, số liệu thu nhập/effective hourly rate) và `### Trả lời mẫu khi phỏng vấn`; chèn trước `> Senior tip:`. Đã có `follow`, giữ nguyên.
- `remote-059`: bổ sung `### Cơ chế từng bước` (IDOR/RLS/N+1/secret, thuật ngữ giải thích), thêm `### Ví dụ đời thực` (SaaS Next.js+Supabase, triệu chứng→điều tra lệnh/metric→nguyên nhân→xử lý→kết quả đo được) và `### Trả lời mẫu khi phỏng vấn`; chèn trước `> Senior tip:`. Đã có `follow` (3 câu), giữ nguyên.
- `remote-060`: thêm `### Ví dụ đời thực` (audit MVP 16h, secret lộ/IDOR/index/transaction, roadmap M1–M3, số liệu) và `### Trả lời mẫu khi phỏng vấn`; chèn trước `> Senior tip:`. Đã có `follow` (3 câu), giữ nguyên.
- Chỉ thêm nội dung, không xoá/viết lại phần cũ; chỉ sửa `js/data/q-remote.js` (edit theo từng đoạn tại `> Senior tip:`) và file task này. Không backtick/`${`. Chạy `node scripts/build-light-index.js` và `node scripts/validate.js` → OK (cảnh báo `path.js` 2 bài học không nằm trong PATH là có sẵn, ngoài phạm vi). Không commit.
Reviewed-by: kilo (T1371R)
