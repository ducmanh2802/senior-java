# T1331 — Nâng cấp đáp án q-soft: behavioral-019 … behavioral-022

Status: DONE
Agent: kilo
Owns: `js/data/q-soft.js`
After: T1316

> **Tinh giản (2026-11-09):** web chỉ dùng để tự ôn. Ưu tiên số 1 là **kiến thức đúng**; không cần đạt đủ độ dài/số từ, viết ngắn gọn, dễ hiểu là được. Mục nào không chắc đúng thì bỏ.

Nâng cấp 6 đáp án (field `a`) dưới đây cho đủ chuẩn AGENTS.md mục 6. Người học tự ôn, không có ai giảng thêm, nên phần bổ sung phải **cụ thể, đúng kỹ thuật, dễ hiểu**.

- `behavioral-019` (5080 ký tự): thiếu Ví dụ đời thực
- `behavioral-020` (4101 ký tự): thiếu Ví dụ đời thực
- `testing-017` (4840 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `testing-024` (5064 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `behavioral-021` (3254 ký tự): thiếu Ví dụ đời thực
- `behavioral-022` (3106 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu

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
- `behavioral-019` (len 5080→7940): thêm `### Ví dụ đời thực` (tình huống tuyển dụng, rubric/scorecard, calibration, số liệu trước-sau); đã có `follow`.
- `behavioral-020` (len 4101→7119): thêm `### Ví dụ đời thực` (tự động hóa đối soát tồn kho sau flash sale, có báo trước/giới hạn/bàn giao, số liệu); đã có `follow`.
- `testing-017` (len 4840→8778): thêm `### Ví dụ đời thực` (flaky CI do @Transactional không rollback HTTP test, @DirtiesContext, flush/constraint) và `### Trả lời mẫu khi phỏng vấn`; đã có `follow`.
- `testing-024` (len 5064→9198): thêm `### Ví dụ đời thực` (Kafka consumer PaymentCaptured, retry/DLT/idempotency/schema, alert & runbook) và `### Trả lời mẫu khi phỏng vấn`; đã có `follow`.
- `behavioral-021` (len 3254→7038): thêm `### Ví dụ đời thực` (trả lời câu hỏi ZGC vs G1 khi chưa biết sâu, suy luận có cơ sở, kiểm chứng) và `### Trả lời mẫu khi phỏng vấn`; đã có `follow`.
- `behavioral-022` (len 3106→6919): thêm `### Ví dụ đời thực` (vòng system design 45 phút bị chậm, nén phạm vi, check-in, deep dive idempotency) và `### Trả lời mẫu khi phỏng vấn`; đã có `follow`.
- Kiểm tra: `node --check js/data/q-soft.js` OK.
- `node scripts/build-light-index.js` thất bại do lỗi cú pháp có sẵn ngoài phạm vi task tại `js/data/lessons-spring.js:131` (Unexpected token '{' trong dữ liệu check/explain), nên `js/data/index-light.js` chưa rebuild được từ lần chạy này.
- `node scripts/validate.js` chưa đạt "OK — không có lỗi." do (1) `index-light.js` cũ (hậu quả build fail ở trên) và (2) nhiều lỗi `path.js` tham chiếu lesson devops/microservices/testing không tồn tại — đều là vấn đề có sẵn, không thuộc `js/data/q-soft.js`. Không sửa file ngoài phạm vi theo luật task.
Reviewed-by: kilo (T1331R)
