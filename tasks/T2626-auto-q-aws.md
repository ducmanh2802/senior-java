# T2626 — 3 câu hỏi Senior Java (aws) vào q-aws.js

Status: DONE
Agent: kilo
Owns: `js/data/q-aws.js`
After: T2589

Thêm **3 câu hỏi phỏng vấn mới** (topic: aws) vào `js/data/q-aws.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-aws.js`); đọc danh sách để **không trùng ý**.

Chủ đề: chạy Spring Boot trên ECS Fargate vs EKS vs Lambda: chi phí và vận hành cho team 6 người, DynamoDB thiết kế partition key cho bảng giao dịch tránh hot partition, multi-region active-passive cho hệ thống thanh toán: RPO/RTO và chi phí.

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
- Đã thêm 3 câu mới (id nối tiếp aws-083):
  - **aws-084** (senior) — Chọn ECS Fargate vs EKS vs Lambda theo chi phí thật + gánh nặng vận hành cho team 6 người (kèm bảng so sánh, task def Fargate, ví dụ fintech chuyển 12 service từ EC2 sang Fargate).
  - **aws-085** (senior) — Thiết kế partition key/sort key cho bảng giao dịch trên DynamoDB tránh hot partition; vì sao không dùng transactionId làm PK; write sharding; ví dụ ví điện tử (code Java + số liệu p99).
  - **aws-086** (lead) — Multi-region active-passive cho hệ thống thanh toán thẻ: RPO < 5s / RTO < 10 phút, Aurora Global Database + Route 53 ARC, sơ đồ ~~~seq failover, bảng chi phí tăng ~45%.
- Góc nhìn khác các câu đã có: aws-074 (chọn theo traffic/p99) → aws-084 (theo team-size/ops); aws-064/051 (DynamoDB tổng quát) → aws-085 (trọng tâm bảng giao dịch + write sharding); aws-058 (DR strategy tổng quát, budget 25%) → aws-086 (active-passive cụ thể, RPO/RTO + chi phí định lượng).
- Nghiệm thu: `node --check js/data/q-aws.js` OK; `node scripts/build-light-index.js` OK; `node scripts/validate.js` chỉ còn 2 lỗi ở `js/data/bugs.js` (bug-050 dính ký tự Trung "客服") — KHÔNG phải file sở hữu (task khác), đã ghi chú theo luật 3; `node scripts/qtool.js check js/data/q-aws.js aws-084 aws-085 aws-086` → OK.
Reviewed-by: kilo (T2626R)
