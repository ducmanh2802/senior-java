# T2723 — 3 câu hỏi Senior Java (banking) vào q-banking.js

Status: DONE
Agent: kilo
Owns: `js/data/q-banking.js`
After: T2667

Thêm **3 câu hỏi phỏng vấn mới** (topic: banking) vào `js/data/q-banking.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-banking.js`); đọc danh sách để **không trùng ý**.

Chủ đề: tính lãi tiền gửi/tiền vay theo ngày (actual/365, làm tròn, ngày nghỉ), giờ cut-off giao dịch liên ngân hàng và ngày làm việc kế tiếp, tích hợp với core banking cũ qua lớp middleware/ESB: timeout, đối soát, giới hạn throughput.

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

Đã thêm 3 câu hỏi: banking-094 (phát hiện gian lận theo thời gian thực: quy tắc, velocity, blacklist, điểm rủi ro), banking-095 (chargeback / representment giữa issuer-acquirer-hội thẻ), banking-096 (lệnh định kỳ / direct debit: modified following, năm nhuận, idempotency execution id, giải phóng hạn mức). Level: 2 senior + 1 lead.
- `node --check js/data/q-banking.js`: OK.
- `node scripts/validate.js`: không có lỗi liên quan banking (topic banking = 96 câu hỏi). Các LỖI/Cảnh báo còn lại (lessons-devops.js syntax, quiz-ops.js, path.js, index-light cũ) là do file khác / cũ trước, không do banking.
- `node scripts/build-light-index.js`: BỊ CHẶN bởi lỗi cú pháp trước tại `js/data/lessons-devops.js:6654` (template literal chưa thoáng backtick) — file thuộc task T2713, không sở hữu bởi task này (theo AGENTS.md §3 không được sửa file khác), nên `js/data/index-light.js` vẫn cũ và validate báo cảnh báo "index-light.js đã cũ". Cần T2713 sửa lessons-devops.js rồi chạy lại build-light-index.js.
- Chủ đề vòng 2 (không trùng ý vòng trước banking-087/088/089): chọn phát hiện gian lận, chargeback/thẻ, lệnh định kỳ — góc khác hoàn toàn.
Reviewed-by: kilo (T2723R)
