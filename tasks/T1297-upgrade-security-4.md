# T1297 — Nâng cấp đáp án q-security: security-019 … security-024

Status: DONE
Agent: kilo
Owns: `js/data/q-security.js`
After: T1279

Nâng cấp 6 đáp án (field `a`) dưới đây cho đủ chuẩn AGENTS.md mục 6. Người học tự ôn, không có ai giảng thêm, nên phần bổ sung phải **cụ thể, đúng kỹ thuật, dễ hiểu**.

- `security-019` (5367 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `security-020` (4437 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `security-021` (4733 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `security-022` (3973 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `security-023` (6652 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `security-024` (5133 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu

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
- security-019: thêm **Ví dụ đời thực** (rotation secret AWS Secrets Manager → HikariCP giữ credential cũ) + **Trả lời mẫu khi phỏng vấn**
- security-020: thêm **Ví dụ đời thực** (multi-tenant SaaS bypass tenant check qua query param) + **Trả lời mẫu khi phỏng vấn**
- security-021: thêm **Ví dụ đời thực** (audit log mất 1.200 event do worker OOM, hash chain mismatch) + **Trả lời mẫu khi phỏng vấn**
- security-022: thêm **Ví dụ đời thực** (double-spend do idempotency key TTL ngắn hơn core banking timeout) + **Trả lời mẫu khi phỏng vấn**
- security-023: thêm **Ví dụ đời thực** (đổi mật khẩu không tăng token version, access token rò rỉ qua log analytics) + **Trả lời mẫu khi phỏng vấn**
- security-024: thêm **Ví dụ đời thực** (BOLA 8 endpoint order/invoice, enumeration 10k hóa đơn, fix 3 lớp) + **Trả lời mẫu khi phỏng vấn**
- Tất cả 6 câu hỏi đã có `follow` field sẵn, không cần thêm.
- Validation pass (chỉ lỗi cũ ở lessons-testing.js không thuộc task này).
Reviewed-by: kilo (T1297R)
