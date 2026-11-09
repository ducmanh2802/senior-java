# T1293 — Nâng cấp đáp án q-sql: sql-019 … sql-024

Status: DONE
Agent: kilo
Owns: `js/data/q-sql.js`
After: T1275

Nâng cấp 6 đáp án (field `a`) dưới đây cho đủ chuẩn AGENTS.md mục 6. Người học tự ôn, không có ai giảng thêm, nên phần bổ sung phải **cụ thể, đúng kỹ thuật, dễ hiểu**.

- `sql-019` (7577 ký tự): thiếu Ví dụ đời thực
- `sql-020` (6693 ký tự): thiếu Ví dụ đời thực
- `sql-021` (7094 ký tự): thiếu Ví dụ đời thực
- `sql-022` (8361 ký tự): thiếu Ví dụ đời thực
- `sql-023` (5133 ký tự): thiếu Ví dụ đời thực
- `sql-024` (5081 ký tự): thiếu Ví dụ đời thực

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
- `sql-019`: thêm `### Ví dụ đời thực` (app 4M MAU, dashboard online 28-32h/ngày, cộng duration trùng + end_ts NULL + thiếu index; sửa bằng island marker + index `(user_id,start_ts,end_ts)`; job 42 phút → 6 phút, lệch < 1%). Giữ follow có sẵn.
- `sql-020`: thêm `### Ví dụ đời thực` (POS 220M dòng/năm, 4 UNION ALL 55-70s, frontend cộng gấp tổng do thiếu GROUPING; gộp GROUPING SETS 1 lần quét + cờ GROUPING + bảng tổng hợp ngày; truy vấn nóng ~9s, lịch sử < 300ms). Giữ follow có sẵn.
- `sql-021`: thêm `### Ví dụ đời thực` (50M orders, nâng cấp PG 11→13: tra cứu chậm 20-40x vs báo cáo nhanh hơn do fence→inline; EXPLAIN thấy CTE Scan vs Index Scan; chốt MATERIALIZED có chọn lọc; p95 về 12-18ms). Giữ follow có sẵn.
- `sql-022`: thêm `### Ví dụ đời thực` (420M sales, 8 vCPU, hàm PARALLEL UNSAFE + ép parallel toàn hệ gây oversubscription p99 API 180→750ms; đánh dấu SAFE, chỉ report_user workers=4, giới hạn đồng thời; báo cáo ~14-16s, p99 API ~190ms). Giữ follow có sẵn.
- `sql-023`: thêm `### Ví dụ đời thực` (1.2M khách, 8M đơn, 9.5M thanh toán, VIP 4.8 tỷ vs kế toán 1.5 tỷ; fan-out 1-n x 1-n; gộp CTE trước rồi LEFT JOIN; khớp 100%, 18s → 2.4s). Giữ follow có sẵn.
- `sql-024`: thêm `### Ví dụ đời thực` (6 pod, 37 cặp email trùng + 124 đơn mồ côi; race check-then-insert + thiếu FK; unique index CONCURRENTLY lower(email), FK NOT VALID/VALIDATE, bắt 23505/23503; 30 ngày 0 trùng/mồ côi, p99 không đổi). Giữ follow có sẵn.
- Mỗi câu đã có `follow` (2 câu) và mục "Trả lời miệng 1 phút" tương đương → không thêm trùng. Mọi mục mới chèn ngay trước `> Senior tip:`. Không dùng backtick/`${`. `node --check` OK; `node scripts/build-light-index.js` OK.
- `node scripts/validate.js` còn 7 LỖI nhưng **không thuộc `js/data/q-sql.js`** (đều ở `q-claude.js` claude-017 và `lessons-testing.js` lesson-testing-005, inline `{{...}}` lồng `{}`) — nằm ngoài phạm vi sở hữu của task, không sửa theo luật 3.
Reviewed-by: kilo (T1293R)
