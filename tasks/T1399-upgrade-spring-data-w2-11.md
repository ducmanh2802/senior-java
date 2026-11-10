# T1399 — Nâng cấp đáp án q-spring-data: db-044 … db-047

Status: DONE
Agent: kilo
Owns: `js/data/q-spring-data.js`
After: T1397

> **Tinh giản (2026-11-09):** web chỉ dùng để tự ôn. Ưu tiên số 1 là **kiến thức đúng**; không cần đạt đủ độ dài/số từ, viết ngắn gọn, dễ hiểu là được. Mục nào không chắc đúng thì bỏ.

Nâng cấp 4 đáp án (field `a`) dưới đây cho đủ chuẩn AGENTS.md mục 6. Người học tự ôn, không có ai giảng thêm, nên phần bổ sung phải **cụ thể, đúng kỹ thuật, dễ hiểu**.

- `db-044` (4447 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `db-045` (4390 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `db-046` (4112 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `db-047` (4530 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu

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

Đã bổ sung cho 4 đáp án:
- `db-044` (Replication lag): thêm **Ví dụ đời thực** (hệ thống thanh toán 2 replica, lag 2.5GB WAL do query báo cáo dài conflict recovery), **Trả lời mẫu** (read-your-writes, LSN routing, AbstractRoutingDataSource). Đã có `follow` 3 câu.
- `db-045` (Range partitioning): thêm **Ví dụ đời thực** (sàn TMĐT 800M dòng, job DELETE 3h → DETACH PARTITION 200ms, báo cáo 45s→2s, replica lag 30p→<10s), **Trả lời mẫu** (partition pruning, DETACH/DROP, PK chứa cột partition, DEFAULT partition trap). Đã có `follow` 3 câu.
- `db-046` (Index-only scan & bloat): thêm **Ví dụ đời thực** (hệ thống đơn hàng 50M dòng, Heap Fetches 18k do transaction BI idle 6h chặn vacuum), **Trả lời mẫu** (visibility map, VACUUM FULL/pg_repack, fillfactor, HOT update). Đã có `follow` 3 câu.
- `db-047` (XID wraparound): thêm **Ví dụ đời thực** (ngân hàng core banking, age 1.58B do ETL job quên commit 72h, VACUUM FREEZE 45 phút), **Trả lời mẫu** (freeze mechanism, oldest_xid, MySQL purge lag, idle timeout). Đã có `follow` 3 câu.

Tất cả 4 đáp án: chèn trước `> Senior tip:`, dùng markup `{{...}}` cho inline code (không backtick), tiếng Việt có dấu. `node scripts/validate.js` → OK.
Reviewed-by: kilo (T1399R)
