# T2698 — 3 câu hỏi Senior Java (aws) vào q-aws.js

Status: DONE
Agent: kilo
Owns: `js/data/q-aws.js`
After: T2678

Thêm **3 câu hỏi phỏng vấn mới** (topic: aws) vào `js/data/q-aws.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-aws.js`); đọc danh sách để **không trùng ý**.

Chủ đề: chạy Spring Boot trên ECS Fargate vs EKS vs Lambda: chi phí và vận hành cho team 6 người, DynamoDB thiết kế partition key cho bảng giao dịch tránh hot partition, multi-region active-passive cho hệ thống thanh toán: RPO/RTO và chi phí.

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
`node --check js/data/q-aws.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes

- Đã thêm 3 câu hỏi mới vào `js/data/q-aws.js` (id nối tiếp max id aws-092): `aws-093` (senior), `aws-094` (senior), `aws-095` (lead).
- Chủ đề trùng với vòng trước (aws-084 ECS/EKS/Lambda team 6 người; aws-064/085 DynamoDB partition key/hot partition bảng giao dịch; aws-086/092 active-passive RPO/RTO thanh toán) nên chọn góc chưa có:
  - aws-093: workload hỗn hợp API 24/7 + job đêm 1–2 giờ, team 6 không có K8s SRE → Fargate cả hai, không qua Lambda (hạn 15 phút/lần gọi); so sánh chi phí thật và gánh nặng vận hành.
  - aws-094: bảng sự kiện thanh toán kiểm toán (pk merchantId + shard suffix merchantId#0..9, sk eventTime#eventId, GSI eventType, TTL 90 ngày, Streams) thay vì sổ cái giao dịch của aws-064/085.
  - aws-095 (lead): active-passive hai vùng gói vào giao dịch đang triển khai (in-flight), idempotency key + fencing, RPO/RTO cụ thể, failback có kiểm soát, chi phí vùng phụ (warm standby vs pilot light).
- Mỗi câu: **Tóm tắt:** → cơ chế từng bước/Vì sao → ~~~seq hoặc ~~~java (≤ 30 dòng) → bảng trade-off → pitfall → ### Ví dụ đời thực có số liệu → ### Trả lời mẫu (150–220 từ) → > Senior tip: → follow 2–3 câu. Tiếng Việt có dấu đầy đủ, không backtick, không ${ trong template literal.
- Kiểm tra: `node --check js/data/q-aws.js` OK; `node scripts/build-light-index.js` OK (aws: 95 câu); `node scripts/validate.js` không báo lỗi/cảnh báo nào cho aws (các LỖI còn lại của validate nằm ở file khác do người khác sở hữu, tồn tại trước và không phải task này sửa).Reviewed-by: kilo (T2698R)
