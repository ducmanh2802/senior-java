# T1279 — Nâng cấp đáp án q-security: security-013 … security-018

Status: DONE
Agent: kilo
Owns: `js/data/q-security.js`
After: T1261

Nâng cấp 6 đáp án (field `a`) dưới đây cho đủ chuẩn AGENTS.md mục 6. Người học tự ôn, không có ai giảng thêm, nên phần bổ sung phải **cụ thể, đúng kỹ thuật, dễ hiểu**.

- `security-013` (4309 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `security-014` (4729 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `security-015` (4245 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `security-016` (3836 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `security-017` (4055 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `security-018` (4598 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu

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
- security-013 (Log4Shell/SCA/SBOM): thêm `### Ví dụ đời thực` (1188 ký tự) và `### Trả lời mẫu khi phỏng vấn` (162 từ) trước `> Senior tip:`.
- security-014 (brute force/rate limit/CAPTCHA/PwnedPasswords): thêm cả hai mục (1184 ký tự / 167 từ).
- security-015 (Spring Security 6 SecurityFilterChain lambda DSL): thêm cả hai mục (1166 ký tự / 174 từ).
- security-016 (mass assignment/DTO allowlist): thêm cả hai mục (1169 ký tự / 163 từ).
- security-017 (JWT vs opaque token, thu hồi JWT): thêm cả hai mục (1164 ký tự / 182 từ).
- security-018 (OAuth2 Resource Server: audience, issuer, JWKS): thêm cả hai mục (1177 ký tự / 189 từ).
- Các id đã có `follow` và đáp án >3000 ký tự nên không thêm follow, không bổ sung phần cơ chế (theo quy tắc 3, 5 task).
- Chỉ sửa `js/data/q-security.js`; không commit. Đã chạy `node scripts/build-light-index.js` và `node scripts/validate.js` → OK — không có lỗi.
Reviewed-by: kilo (T1279R)
