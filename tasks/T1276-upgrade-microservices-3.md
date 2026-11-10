# T1276 — Nâng cấp đáp án q-microservices: microservices-013 … microservices-018

Status: DONE
Agent: kilo
Owns: `js/data/q-microservices.js`
After: T1258

Nâng cấp 6 đáp án (field `a`) dưới đây cho đủ chuẩn AGENTS.md mục 6. Người học tự ôn, không có ai giảng thêm, nên phần bổ sung phải **cụ thể, đúng kỹ thuật, dễ hiểu**.

- `microservices-013` (7458 ký tự): thiếu Ví dụ đời thực
- `microservices-014` (7129 ký tự): thiếu Ví dụ đời thực
- `microservices-015` (6702 ký tự): thiếu Ví dụ đời thực
- `microservices-016` (6507 ký tự): thiếu Ví dụ đời thực
- `microservices-017` (6496 ký tự): thiếu Ví dụ đời thực
- `microservices-018` (6762 ký tự): thiếu Ví dụ đời thực

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
Đã thêm mục `### Ví dụ đời thực` cho 6 câu hỏi:
- microservices-013: ví dụ về OAuth2 client credentials cache + rotate secret gây cascade failure
- microservices-014: ví dụ về breaking change status field từ enum sang object, contract test Pact bắt lỗi
- microservices-015: ví dụ CQRS cho dashboard, projector không idempotent gây lệch read model, fix bằng inbox pattern
- microservices-016: ví dụ migration ADD COLUMN + backfill 50M dòng gây replica lag, fix bằng gh-ost online schema change
- microservices-017: ví dụ strangler fig ngân hàng 500k lines, tách Catalog/Notification/Order qua CDC + shadow traffic + canary
- microservices-018: ví dụ secret commit vào git + image layer + actuator lộ, fix bằng rotate + truffleHog CI + External Secrets

Tất cả 6 đáp án đã có sẵn `### Trả lời miệng 1 phút` (tương đương Trả lời mẫu) và field `follow`, nên chỉ bổ sung `### Ví dụ đời thực`.
`node scripts/validate.js` cho q-microservices.js OK. `build-light-index.js` fail do lỗi tiền tồn tại ở lessons-jpa.js (không thuộc task này).
Reviewed-by: kilo (T1276R)
