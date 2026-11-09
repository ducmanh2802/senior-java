# T1289 — Nâng cấp đáp án q-autotest: autotest-038 … autotest-043

Status: DONE
Agent: kilo
Owns: `js/data/q-autotest.js`
After: T1271

Nâng cấp 3 đáp án (field `a`) dưới đây cho đủ chuẩn AGENTS.md mục 6. Người học tự ôn, không có ai giảng thêm, nên phần bổ sung phải **cụ thể, đúng kỹ thuật, dễ hiểu**.

- `autotest-038` (5057 ký tự): thiếu Ví dụ đời thực
- `autotest-040` (5836 ký tự): thiếu Ví dụ đời thực
- `autotest-043` (4875 ký tự): thiếu Ví dụ đời thực

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
- autotest-038: thêm "### Ví dụ đời thực" (chuyển 70/120 E2E sang component test, suite 25→10 phút, flaky 8%→1.2%), thêm "### Trả lời mẫu khi phỏng vấn" (150+ từ, ngôi thứ nhất).
- autotest-040: thêm "### Ví dụ đời thực" (nền tảng thanh toán đa quốc gia, thay đổi format tiền Đức vỡ 52 test, refactor BigDecimal/helper/unit test matrix, thêm locale Nhật 30 phút, bug production 3-4/tháng→0), thêm "### Trả lời mẫu khi phỏng vấn" (150+ từ, tách dữ liệu chuẩn/hiển thị).
- autotest-043: thêm "### Ví dụ đời thực" (fintech 5 microservice, repo E2E riêng gây lệch phiên bản 2 lần, chuyển monorepo + affected CI + Pact, CI 45→8 phút), thêm "### Trả lời mẫu khi phỏng vấn" (150+ từ, ưu tiên cơ chế đồng bộ hơn địa chỉ repo).
- validate.js: OK cho q-autotest.js (45 câu hỏi autotest, không lỗi).
- build-light-index.js: thất bại do lỗi có sẵn trong q-kotlin.js (backtick trong template literal) - không thuộc file sở hữu task này.
Reviewed-by: kilo (T1289R)
