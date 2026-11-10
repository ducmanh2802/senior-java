# T1259 — Nâng cấp đáp án q-system-design: design-007 … design-012

Status: DONE
Agent: kilo
Owns: `js/data/q-system-design.js`
After: T1241

Nâng cấp 6 đáp án (field `a`) dưới đây cho đủ chuẩn AGENTS.md mục 6. Người học tự ôn, không có ai giảng thêm, nên phần bổ sung phải **cụ thể, đúng kỹ thuật, dễ hiểu**.

- `design-007` (4757 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `design-008` (5585 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `design-009` (4511 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `design-010` (4959 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `design-011` (4911 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `design-012` (5117 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu

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
- 2026-11-09 05:10 (Claude): đặt lại TODO — phần đã làm bị guard bản lỗi hoàn tác (đêm 8/11). Làm lại; giữ phần đã có nếu còn trong file.
- 2026-11-09 (kilo): DONE cho 6 id trong scope file sở hữu `js/data/q-system-design.js`.
  - `design-007`: thêm `### Ví dụ đời thực` (production, feed chậm khi celebrity, queue lag 800k, hot key, nguyên nhân ngưỡng push; xử lý ngưỡng động/pull/batch/pipeline; kết quả p99 280 ms) + `### Trả lời mẫu khi phỏng vấn` (150–220 từ). `follow` đã có sẵn.
  - `design-008`: thêm `### Ví dụ đời thực` (gateway restart, mất tin, session registry/TTL, reconnect lastSeq; điều tra HGET session/lastSeq; xử lý client gửi lastSeq, TTL 5 phút, retry) + `### Trả lời mẫu khi phỏng vấn`. `follow` đã có.
  - `design-009`: thêm `### Ví dụ đời thực` (cache-aside catalog, giá stale sau deploy, TTL 600s, delayed double delete, CDC/Debezium; kết quả stale <1s) + `### Trả lời mẫu khi phỏng vấn`. `follow` đã có.
  - `design-010`: thêm `### Ví dụ đời thực` (Redis lock job recalc tồn kho, Full GC 38s > TTL 30s, oversell logic/tồn kho âm; điều tra GC log/jcmd/metric lock; xử lý fencing version/conditional update, Lua token, tách worker, GC tuning; kết quả no negative stock, p99 GC 180 ms) + `### Trả lời mẫu khi phỏng vấn`. `follow` đã có.
  - `design-011`: thêm `### Ví dụ đời thực` (ví điện tử, eventual cho số dư gây insufficient balance sai, replication lag 400ms–2.8s; tách số dư sang Postgres transaction/PC-EC, read-after-write primary, leaderboard eventual async) + `### Trả lời mẫu khi phỏng vấn`. `follow` đã có.
  - `design-012`: thêm `### Ví dụ đời thực` (SaaS 1.2k→40k DAU, p99 280ms→3.2s, pg_stat_statements/index thiếu/connection slot; xử lý theo mốc: index, PgBouncer, read replica, Redis, CDN, stateless prep; kết quả p99 350ms, chi phí +2.2x) + `### Trả lời mẫu khi phỏng vấn`. `follow` đã có.
  - Sửa markup: thay backtick inline thành `{{...}}` trong phạm vi `design-007`–`design-012` (tránh vi phạm validator/AGENTS); bỏ thụt đầu dòng các tiêu đề `###` mới thêm.
  - Kiểm tra: `node --check js/data/q-system-design.js` OK. `node scripts/validate.js q-system-design.js` OK (không lỗi cho file sở hữu). `node scripts/build-light-index.js` thất bại do lỗi cú pháp có sẵn ở `js/data/lessons-ai.js` (ngoài scope), nên `index-light.js` chưa rebuild được từ môi trường hiện tại. `node scripts/validate.js` (full) còn lỗi ở `lessons-ai.js`, `lessons-banking.js`, `projects.js`, `path.js` — đều không thuộc file sở hữu task này; không sửa. Cần integrator/chủ file tương ứng xử lý trước khi full validate/index OK.
Reviewed-by: kilo (T1259R)
