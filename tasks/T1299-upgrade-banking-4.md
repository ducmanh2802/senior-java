# T1299 — Nâng cấp đáp án q-banking: banking-019 … banking-024

Status: DONE
Agent: kilo
Owns: `js/data/q-banking.js`
After: T1281

> **Tinh giản (2026-11-09):** web chỉ dùng để tự ôn. Ưu tiên số 1 là **kiến thức đúng**; không cần đạt đủ độ dài/số từ, viết ngắn gọn, dễ hiểu là được. Mục nào không chắc đúng thì bỏ.

Nâng cấp 6 đáp án (field `a`) dưới đây cho đủ chuẩn AGENTS.md mục 6. Người học tự ôn, không có ai giảng thêm, nên phần bổ sung phải **cụ thể, đúng kỹ thuật, dễ hiểu**.

- `banking-019` (6792 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `banking-020` (6917 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `banking-021` (7185 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `banking-022` (7215 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `banking-023` (5411 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `banking-024` (4293 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu

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
- banking-019: thêm `### Ví dụ đời thực` (triệu chứng lệch báo cáo tỷ giá/doanh thu, điều tra, xử lý snapshot & làm tròn, kết quả) và `### Trả lời mẫu khi phỏng vấn` trước `> Senior tip:`.
- banking-020: thêm `### Ví dụ đời thực` (dry run phát hiện hold/lãi treo bị sót nhờ đối soát từng tài khoản, xử lý, kết quả) và `### Trả lời mẫu khi phỏng vấn`.
- banking-021: thêm `### Ví dụ đời thực` (dual write mất event, consumer trùng, lệch số dư do payment giữ balance; xử lý bằng outbox/idempotent/ledger làm nguồn sự thật) và `### Trả lời mẫu khi phỏng vấn`.
- banking-022: thêm `### Ví dụ đời thực` (diễn tập failover: async replication, DNS TTL cao, quyết định thủ công; xử lý và kết quả đo RTO/RPO) và `### Trả lời mẫu khi phỏng vấn`.
- banking-023: thêm `### Ví dụ đời thực` (race condition rút tiền do đọc-ghi tách rời, chuyển sang double-entry + khóa/version, truy vết tx_id) và `### Trả lời mẫu khi phỏng vấn`.
- banking-024: thêm `### Ví dụ đời thực` (break EOD với Napas: lệch trạng thái/thiếu bản ghi/lệch múi giờ, chuẩn hóa, pipeline tra soát, điều chỉnh append-only) và `### Trả lời mẫu khi phỏng vấn`.
- Đã chạy `node scripts/build-light-index.js` và `node scripts/validate.js` → OK. Chỉ sửa `js/data/q-banking.js` và file task này. Không commit.
Reviewed-by: kilo (T1299R)
