# T1253 — Nâng cấp đáp án q-autotest: autotest-001 … autotest-023

Status: DONE
Agent: kilo
Owns: `js/data/q-autotest.js`

Nâng cấp 6 đáp án (field `a`) dưới đây cho đủ chuẩn AGENTS.md mục 6. Người học tự ôn, không có ai giảng thêm, nên phần bổ sung phải **cụ thể, đúng kỹ thuật, dễ hiểu**.

- `autotest-001` (4369 ký tự): thiếu Ví dụ đời thực
- `autotest-002` (5509 ký tự): thiếu Ví dụ đời thực
- `autotest-016` (3684 ký tự): thiếu Ví dụ đời thực
- `autotest-017` (3494 ký tự): thiếu Ví dụ đời thực
- `autotest-019` (3284 ký tự): thiếu Ví dụ đời thực
- `autotest-023` (3368 ký tự): thiếu Ví dụ đời thực

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

Đã thêm mục `### Ví dụ đời thực` (700–1200 ký tự, theo mạch triệu chứng → điều tra → nguyên nhân gốc → xử lý → kết quả) vào 6 đáp án, chèn ngay trước dòng `> Senior tip:` của từng id:
- autotest-001 (823 ký tự): suite UI quá chậm/flaky, chuyển phần xuống API, giữ ít UI quan trọng.
- autotest-002 (801 ký tự): lỗi phiên bản chromedriver trên CI không có mạng, hạn chế của Selenium Manager.
- autotest-016 (939 ký tự): 10 QA dùng BrowserContext static gây flaky chạy song song, sửa bằng DriverFactory + ThreadLocal.
- autotest-017 (790 ký tự): tài khoản cố định "qa_user" gây va chạm dữ liệu khi chạy 4 worker, sửa bằng user duy nhất mỗi test.
- autotest-019 (866 ký tự): 120 test UI 120 phút, chuyển 20 test xuống REST Assured + headless + 4 worker, xuống 18 phút.
- autotest-023 (762 ký tự): tạo đơn qua UI 45 giây, đổi sang APIRequestContext + verify UI, 60 test xuống 5 phút.

Không sửa mục nào khác, không thêm field, không dùng backtick và `${` trong đáp án. follow và "Trả lời phỏng vấn" mục tương đương đã có sẵn ở mọi id, độ dài đáp án đều > 3000 ký tự nên không bổ sung thêm phần cơ chế theo luật 3.

Lưu ý: `node scripts/validate.js` vẫn báo lỗi cũ từ file KHÔNG sở hữu task (q-microservices.js: backtick thô ở dòng 81; q-security.js: {{...}} lồng nhau) nên build-light-index bị dừng trước khi tới q-autotest.js; không liên quan đến thay đổi của task này (validate không báo lỗi nào về autotest, `node --check js/data/q-autotest.js` OK).- 2026-11-09 05:10 (Claude): đặt lại TODO — phần đã làm bị guard bản lỗi hoàn tác (đêm 8/11). Làm lại; giữ phần đã có nếu còn trong file.
Reviewed-by: kilo (T1253R)
