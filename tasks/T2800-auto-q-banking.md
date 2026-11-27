# T2800 — 4 câu hỏi Senior Java (banking) vào q-banking.js

Status: DONE
Agent: kilo
Owns: `js/data/q-banking.js`
After: T2786

Thêm **4 câu hỏi phỏng vấn mới** (topic: banking) vào `js/data/q-banking.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-banking.js`); đọc danh sách để **không trùng ý**.

Chủ đề: đối soát (reconciliation) giao dịch với NAPAS/ngân hàng đối tác cuối ngày, xử lý giao dịch treo (pending) quá timeout, hạn mức giao dịch theo ngày chính xác khi nhiều request song song, sổ cái kép (double-entry ledger) và cách đảm bảo tổng nợ = tổng có.

> Vòng 4 của chủ đề này: các ý trên có thể đã được viết ở vòng trước — đọc file và chọn góc **chưa có** (tình huống khác, mức sâu hơn, lỗi production khác).

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
Đã thêm 4 câu vào js/data/q-banking.js trước dòng `);` cuối file: banking-100 (senior, đối soát NAPAS/file settlement trùng & hỏng, intra-day), banking-101 (senior, PENDING + in-flight lock + idempotency + job giải phóng hold), banking-102 (senior, hạn mức dùng chung nhiều tài khoản, atomic DB update), banking-103 (lead, sổ cái kép đa tiền tệ + tỷ giá + reconcile/revalue). Chọn góc chưa có so với banking-071/090/091/092/093 (vòng trước). node --check OK, build-light-index OK, validate.js không báo lỗi banking (các lỗi còn lại là file khác không sở hữu).
Reviewed-by: kilo (T2800R)
