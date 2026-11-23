# T2589 — 3 câu hỏi Senior Java (aws) vào q-aws.js

Status: DONE
Agent: kilo
Owns: `js/data/q-aws.js`
After: T2467

Thêm **3 câu hỏi phỏng vấn mới** (topic: aws) vào `js/data/q-aws.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-aws.js`); đọc danh sách để **không trùng ý**.

Chủ đề: thiết kế VPC cho hệ thống ngân hàng (subnet private, NAT, VPC endpoint cho S3/Secrets Manager), RDS PostgreSQL Multi-AZ vs read replica vs Aurora — failover mất bao lâu và ứng dụng Java cần làm gì (DNS TTL, Hikari), chi phí: tìm và cắt 30% hoá đơn AWS.

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
Đã thêm 3 câu vào js/data/q-aws.js (id aws-084, aws-085, aws-086; id lớn nhất trước là aws-083):
- aws-084 (senior): VPC ngân hàng — private subnet, NAT Gateway mỗi AZ, VPC endpoint S3/Secrets Manager, private DNS, SG vs NACL, kèm ~~~seq.
- aws-085 (lead): RDS PostgreSQL Multi-AZ (failover 60–120s) vs read replica vs Aurora (failover dưới 1 phút), Java xử lý failover qua networkaddress.cache.ttl + HikariCP (validation query, timeout, max-lifetime, retry giao dịch), kèm code HikariConfig.
- aws-086 (senior): kiểm toán và cắt 30% hoá đơn AWS trong 90 ngày — tag, Cost Explorer, quick wins, rightsize, Savings Plans/Spot/Graviton, guardrail, bẫy.
Ghi ý: aws-003 đã có VPC chung, aws-005 đã có RDS/Aurora/DynamoDB, aws-080 đã có tối ưu chi phí chung, nên ba câu này lấy góc riêng (ngân hàng, failover + Java, chương trình cắt 30%/90 ngày) để không trùng ý. `node --check`, `node scripts/build-light-index.js`, `node scripts/validate.js q-aws.js` đều OK.
