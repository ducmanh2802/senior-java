# T2888 — 3 câu hỏi Senior Java (aws) vào q-aws.js

Status: DONE
Agent: kilo
Owns: `js/data/q-aws.js`
After: T2870

Thêm **3 câu hỏi phỏng vấn mới** (topic: aws) vào `js/data/q-aws.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-aws.js`); đọc danh sách để **không trùng ý**.

Chủ đề: chạy Spring Boot trên ECS Fargate vs EKS vs Lambda: chi phí và vận hành cho team 6 người, DynamoDB thiết kế partition key cho bảng giao dịch tránh hot partition, multi-region active-passive cho hệ thống thanh toán: RPO/RTO và chi phí.

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
`node --check js/data/q-aws.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
- Đã thêm 3 câu hỏi vào js/data/q-aws.js (id nối tiếp sau aws-101):
  - aws-102 (senior): ECS Fargate vs EKS vs Lambda, team 6 người, chi phí và vận hành — góc đánh giá lại sau khuyến mãi (hoá đơn tăng gấp ba), phân tích chi phí theo dịch vụ, ma trận quyết định, không trùng với aws-084/aws-090/aws-093.
  - aws-103 (senior): DynamoDB bảng giao dịch thanh toán, merchant flash sale gây hot partition — write sharding + đọc scatter-gather, khi KHÔNG nên shard (tách bảng riêng/cache/on-demand), không trùng với aws-085/aws-091/aws-094.
  - aws-104 (lead): Multi-region active-passive thanh toán, RPO/RTO, chi phí vùng phụ theo từng thành phần, so sánh pilot light / warm standby / active-active, quy trình failback có kiểm soát — không trùng với aws-086/aws-092/aws-095.
- Kiểm tra: `node --check js/data/q-aws.js` → SYNTAX OK; `node scripts/build-light-index.js` → OK (aws: 104 câu hỏi); `node scripts/validate.js` → không báo lỗi nào về q-aws.js / aws-102/103/104.
- Các lỗi còn lại của validate.js nằm trong file không sở hữu (q-frontend.js, quiz-ops.js, lessons-*.js, toeic-lr) — đã tồn tại trước, không được sửa theo quy tắc chỉ sửa file sở hữu.
Reviewed-by: kilo (T2888R)
