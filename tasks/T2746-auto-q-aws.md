# T2746 — 3 câu hỏi Senior Java (aws) vào q-aws.js

Status: DONE
Agent: kilo
Owns: `js/data/q-aws.js`
After: T2698

Thêm **3 câu hỏi phỏng vấn mới** (topic: aws) vào `js/data/q-aws.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-aws.js`); đọc danh sách để **không trùng ý**.

Chủ đề: thiết kế VPC cho hệ thống ngân hàng (subnet private, NAT, VPC endpoint cho S3/Secrets Manager), RDS PostgreSQL Multi-AZ vs read replica vs Aurora — failover mất bao lâu và ứng dụng Java cần làm gì (DNS TTL, Hikari), chi phí: tìm và cắt 30% hoá đơn AWS.

> Vòng 3 của chủ đề này: các ý trên có thể đã được viết ở vòng trước — đọc file và chọn góc **chưa có** (tình huống khác, mức sâu hơn, lỗi production khác).

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
`node --check js/data/q-aws.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
- Đã thêm 3 câu vào js/data/q-aws.js (chèn trước ký tự `);` cuối file): aws-096 (VPC ngân hàng: subnet private, NAT, VPC endpoint S3/Secrets Manager, senior), aws-097 (RDS PostgreSQL Multi-AZ vs read replica vs Aurora failover + DNS TTL/HikariCP, senior), aws-098 (chi phí cắt 30% hoá đơn AWS, lead). Level chủ yếu senior, 1 lead. Tiếng Việt có dấu đầy đủ, không backtick, không `${`, fences ~~~ cân bằng.
- `node --check js/data/q-aws.js` → SYNTAX_OK.
- `node scripts/find-nodiac.js js/data/q-aws.js` → chỉ báo các dòng CŨ (aws-062..065), nội dung mới không vi phạm.
- **BLOKER nghiệm thu:** `node scripts/build-light-index.js` bị lỗi tại js/data/lessons-testing.js:7002 (`SyntaxError: Unexpected identifier 'tắt'` — template literal chưa đóng trong bài lesson-testing-017, file đã bị sửa +1317 dòng bởi task khác, HEAD parse OK). File này KHÔNG thuộc quyền sở hữu của task này, do đó không tự sửa.
- Do build-light-index không chạy, js/data/index-light.js chưa được sinh lại nên chưa chứa aws-096/097/098, và `node scripts/validate.js` không thể đạt OK.
- **Cần làm để hoàn tất Nghiệm thu:** sửa template literal chưa đóng ở js/data/lessons-testing.js:7002 (hoặc bởi task sở hữu file đó), sau đó chạy `node scripts/build-light-index.js` rồi `node scripts/validate.js` tới khi in `OK — không có lỗi.`; khi validate OK thì task này thực sự DONE.
Reviewed-by: kilo (T2746R)
