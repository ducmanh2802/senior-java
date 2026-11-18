# T2412 — 5 câu hỏi Senior Java (banking) vào q-banking.js

Status: DONE
Agent: kilo
Owns: `js/data/q-banking.js`
After: T2390

Thêm **5 câu hỏi phỏng vấn mới** (topic: banking) vào `js/data/q-banking.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-banking.js`); đọc danh sách để **không trùng ý** (góc nào đã có thì chọn góc khác).

Chủ đề: nghiệp vụ CHỨNG KHOÁN cho backend: OMS đặt/huỷ/sửa lệnh, sổ lệnh và khớp lệnh (price-time priority), phiên ATO/ATC/khớp liên tục, chặn tiền/chứng khoán (hold) khi đặt lệnh, chu kỳ thanh toán T+2, ký quỹ margin và call margin, idempotency khi client gửi lại lệnh.

Mỗi câu theo AGENTS.md mục 4 và 6: `**Tóm tắt:**` → cơ chế bên trong từng bước và VÌ SAO → code Java ngắn (≤ 30 dòng) có comment → bảng trade-off / khi nào dùng → pitfall production → `### Ví dụ đời thực` có số liệu → `### Trả lời mẫu khi phỏng vấn` (150–220 từ) → `> Senior tip:`; `follow` 2–3 câu. Level: chủ yếu senior, 1–2 câu lead.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/q-banking.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes

Đã thêm 5 câu vào `js/data/q-banking.js` (id nối tiếp, trước/sau đều 81 -> 86, không mất mục nào):
- `banking-082` (senior, 9.1k ký tự): OMS đặt/huỷ/sửa lệnh — máy trạng thái, hold, idempotency clientOrderId, cancel-replace.
- `banking-083` (lead, 7.4k): order book + matching engine price-time priority, single-writer/mã, replay tất định, lỗi double cho giá.
- `banking-084` (senior, 7.8k): phiên ATO/khớp liên tục/ATC, ma trận loại lệnh LO/MP/ATO/ATC, chuyển phiên nguyên tử, trần/sàn + bước giá.
- `banking-085` (senior, 7.4k): hold tiền/CP, available vs balance, vòng đời hold ACTIVE/CONSUMED/RELEASED, chu kỳ thanh toán T+2.
- `banking-086` (lead, 8.6k): margin, initial/maintenance ratio, call margin, force sell, bảng số liệu equity, chống rung ngưỡng.

Mỗi câu có **Tóm tắt:**, giải thích thuật ngữ ở lần đầu xuất hiện, đi từng bước + vì sao, code Java ≤ 30 dòng có comment, bảng trade-off, pitfall production, `### Ví dụ đời thực` có số liệu, `### Trả lời mẫu khi phỏng vấn` 150–220 từ, `> Senior tip:`, `follow` 3 câu, `tags`.
Không có backtick / `${` trong template literal (đã thay bằng {{...}}).
Kiểm tra: `node --check js/data/q-banking.js` OK; `node scripts/build-light-index.js` OK; `node scripts/validate.js` → `OK — không có lỗi.` (các cảnh báo còn lại thuộc file khác). Chỉ sửa `js/data/q-banking.js` + file task. Không commit.

Reviewed-by: kilo (T2412R)
