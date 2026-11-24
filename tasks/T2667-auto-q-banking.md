# T2667 — 4 câu hỏi Senior Java (banking) vào q-banking.js

Status: DONE
Agent: kilo
Owns: `js/data/q-banking.js`
After: T2649

Thêm **4 câu hỏi phỏng vấn mới** (topic: banking) vào `js/data/q-banking.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-banking.js`); đọc danh sách để **không trùng ý**.

Chủ đề: đối soát (reconciliation) giao dịch với NAPAS/ngân hàng đối tác cuối ngày, xử lý giao dịch treo (pending) quá timeout, hạn mức giao dịch theo ngày chính xác khi nhiều request song song, sổ cái kép (double-entry ledger) và cách đảm bảo tổng nợ = tổng có.

> Vòng 2 của chủ đề này: các ý trên có thể đã được viết ở vòng trước — đọc file và chọn góc **chưa có** (tình huống khác, mức sâu hơn, lỗi production khác).

Mỗi câu theo AGENTS.md mục 4 và 6: `**Tóm tắt:**` → cơ chế bên trong từng bước và VÌ SAO → code Java ngắn (≤ 30 dòng) có comment hoặc ~~~seq cho luồng nhiều bên → bảng trade-off / khi nào dùng → pitfall production → `### Ví dụ đời thực` có số liệu → `### Trả lời mẫu khi phỏng vấn` (150–220 từ) → `> Senior tip:`; `follow` 2–3 câu. Level: chủ yếu senior, 1 câu lead.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **BẮT BUỘC viết tiếng Việt CÓ DẤU đầy đủ** (Tóm tắt, không, nguyên nhân…). Nội dung không dấu sẽ bị trả lại.
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, Kafka 3.x, AWS hiện hành, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.
- Nếu một ý trong chủ đề đã có trong file thì chọn góc khác gần nhất chưa có, ghi vào Notes.

## Nghiệm thu
`node --check js/data/q-banking.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
Đã thêm 4 câu hỏi vào js/data/q-banking.js: banking-090 (senior, đối soát cuối ngày với NAPAS/đối tác, góc xử lý phí/service charge khác kỳ vọng), banking-091 (senior, giao dịch treo PENDING do lỗi phía hệ thống, outbox + job quét + reversal), banking-092 (lead, hạn mức ngày nhiều loại cộng dồn, atomic DB update + idempotency), banking-093 (senior, sổ cái kép, job reconcile tổng nợ = tổng có toàn hệ thống). Id nối tiếp sau banking-089 (max cũ), không trùng id, không sửa mục cũ, không sửa file khác.

Validate: node scripts/qtool.js check js/data/q-banking.js → OK (không lỗi/cảnh báo cho q-banking.js). node scripts/build-light-index.js đã sinh lại index-light.js. node scripts/validate.js toàn repo vẫn báo LỖI ở lessons-collections.js (lesson-collections-011/012 body, nội dung không dấu/lồng {{}}) — file này không thuộc task này (rule 3), đã để nguyên, không sửa được. Các lỗi đó tồn tại trước khi bắt đầu task này và không liên quan đến banking.
Reviewed-by: kilo (T2667R)
