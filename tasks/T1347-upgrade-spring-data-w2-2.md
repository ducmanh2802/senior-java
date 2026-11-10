# T1347 — Nâng cấp đáp án q-spring-data: db-016 … spring-025

Status: DONE
Agent: kilo
Owns: `js/data/q-spring-data.js`
After: T1336

> **Tinh giản (2026-11-09):** web chỉ dùng để tự ôn. Ưu tiên số 1 là **kiến thức đúng**; không cần đạt đủ độ dài/số từ, viết ngắn gọn, dễ hiểu là được. Mục nào không chắc đúng thì bỏ.

Nâng cấp 6 đáp án (field `a`) dưới đây cho đủ chuẩn AGENTS.md mục 6. Người học tự ôn, không có ai giảng thêm, nên phần bổ sung phải **cụ thể, đúng kỹ thuật, dễ hiểu**.

- `db-016` (8756 ký tự): thiếu Ví dụ đời thực
- `db-017` (7365 ký tự): thiếu Ví dụ đời thực
- `db-018` (8168 ký tự): thiếu Ví dụ đời thực
- `db-019` (9451 ký tự): thiếu Ví dụ đời thực
- `spring-024` (3140 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `spring-025` (3454 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu

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
- db-016: thêm `### Ví dụ đời thực` (sự cố read replica lag gây khách không thấy giao dịch vừa chuyển tiền, có metric LSN, job đối soát, sticky read, replica chuyên báo cáo, kết quả đo được lag 2.5s→300ms).
- db-017: thêm `### Ví dụ đời thực` (sao kê 500k tài khoản, window function sort spill 12GB, thiếu index/tie-breaker/frame, fix index + opening_balance snapshot, query 18p→2.5p).
- db-018: thêm `### Ví dụ đời thực` (biểu phí phức tạp thay đổi 4 lần/năm, stored procedure gây 12k giao dịch sai phí, chuyển sang Java FeeCalculator + SQL set-based, deploy 3 ngày→2h, 0 sự cố).
- db-019: thêm `### Ví dụ đời thực` (core banking 2TB, DELETE sai xoá 45M dòng, PITR khôi phục qua pgBackRest + pg_waldump xid, restore 22p + replay 38p + extract 18p, RPO=0 RTO=1h25p, bài học restore_point/standby chuyên dụng/diễn tập quý).
- spring-024: thêm `### Cơ chế resolution chi tiết: @Priority và fallback theo tên`, `### Inject collection và array`, `### Ví dụ đời thực` (4 cổng thanh toán, NoUniqueBeanDefinitionException khi thêm cổng thứ 4, fix bằng Primary + List + Qualifier + registry), `### Trả lời mẫu khi phỏng vấn`.
- spring-025: thêm `### Cơ chế auto-configuration chi tiết`, `### Fat JAR và embedded server`, `### Ví dụ đời thực` (chuyển Spring thuần WAR→Boot fat JAR, javax.servlet→jakarta.servlet conflict, Docker fat JAR, build 40% nhanh hơn startup 12s→3.2s), `### Trả lời mẫu khi phỏng vấn`.
- Tất cả 6 câu hỏi: đã sửa backtick trong template literal thành `{{code}}` để tránh lỗi validate.
Reviewed-by: kilo (T1347R)
