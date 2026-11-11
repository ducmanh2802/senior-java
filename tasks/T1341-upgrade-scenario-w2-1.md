# T1341 — Nâng cấp đáp án q-scenario: scenario-076 … scenario-081

Status: DONE
Agent: kilo
Owns: `js/data/q-scenario.js`
After: T1330

> **Tinh giản (2026-11-09):** web chỉ dùng để tự ôn. Ưu tiên số 1 là **kiến thức đúng**; không cần đạt đủ độ dài/số từ, viết ngắn gọn, dễ hiểu là được. Mục nào không chắc đúng thì bỏ.

Nâng cấp 6 đáp án (field `a`) dưới đây cho đủ chuẩn AGENTS.md mục 6. Người học tự ôn, không có ai giảng thêm, nên phần bổ sung phải **cụ thể, đúng kỹ thuật, dễ hiểu**.

- `scenario-076` (4398 ký tự): thiếu Ví dụ đời thực
- `scenario-077` (4348 ký tự): thiếu Ví dụ đời thực
- `scenario-078` (4249 ký tự): thiếu Ví dụ đời thực
- `scenario-079` (4876 ký tự): thiếu Ví dụ đời thực
- `scenario-080` (4740 ký tự): thiếu Ví dụ đời thực
- `scenario-081` (4996 ký tự): thiếu Ví dụ đời thực

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
- `scenario-076`: thêm `### Ví dụ đời thực` (Cost Explorer khoanh vùng ngày 8, NAT Gateway/S3 endpoint, CloudWatch ingestion, kết quả giảm chi phí).
- `scenario-077`: thêm `### Ví dụ đời thực` (flaky CI 25%, tái hiện bằng rerun/random order, Clock/Awaitility/dọn DB/quarantine, kết quả giảm xuống ~2%).
- `scenario-078`: thêm `### Ví dụ đời thực` (300 alert/tuần, burn rate SLO, group/inhibit/runbook, page giảm còn ~18/tuần, tỉ lệ hành động ~92%).
- `scenario-079`: thêm `### Ví dụ đời thực` (df 100% sau rm, lsof +L1/truncate fd, retry log DB + total-size-cap 0, fix Logback/alert predict_linear).
- `scenario-080`: thêm `### Ví dụ đời thực` (SEV1 điều phối IC, khoá thay đổi, rollback/chuyển đối tác, cập nhật 30 phút, ổn định 98,8%).
- `scenario-081`: thêm `### Ví dụ đời thực` (CREATE INDEX khoá orders 40 phút, timeline/điều tra, CI lint + lock_timeout + tách migration, kết quả tránh lặp).
- Kiểm tra: `node --check js/data/q-scenario.js` OK; `node scripts/validate.js` → OK (chỉ cảnh báo path.js như trước). `node scripts/build-light-index.js` thất bại do lỗi cú pháp có sẵn ngoài phạm vi task tại `js/data/lessons-spring.js` (Unexpected token '{' tại check block), nên chưa thể sinh lại `index-light.js`; không sửa file ngoài owns.
Reviewed-by: kilo (T1341R)
