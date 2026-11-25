# T2678 — 3 câu hỏi Senior Java (aws) vào q-aws.js

Status: DONE
Agent: kilo
Owns: `js/data/q-aws.js`
After: T2626

Thêm **3 câu hỏi phỏng vấn mới** (topic: aws) vào `js/data/q-aws.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-aws.js`); đọc danh sách để **không trùng ý**.

Chủ đề: thiết kế VPC cho hệ thống ngân hàng (subnet private, NAT, VPC endpoint cho S3/Secrets Manager), RDS PostgreSQL Multi-AZ vs read replica vs Aurora — failover mất bao lâu và ứng dụng Java cần làm gì (DNS TTL, Hikari), chi phí: tìm và cắt 30% hoá đơn AWS.

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
- Đã thêm 3 câu mới (id nối tiếp aws-086): **aws-087** (senior, VPC ngân hàng: public/private/isolated subnet, NAT, VPC endpoint S3/Secrets Manager, app lấy secret qua IAM task role), **aws-088** (lead, RDS Multi-AZ vs Read Replica vs Aurora failover + cấu hình Java: JVM DNS TTL, HikariCP keepalive/connection-timeout/socketTimeout, retry idempotent, RDS Proxy), **aws-089** (senior, cắt 30% hoá đơn AWS trong 8 tuần: đo lường → dọn tài nguyên → rightsizing → endpoint/Graviton/Spot → Savings Plans).
- Vòng trước (chạy bị gián đoạn) đã tạo sẵn 3 mục nhưng lỗi: `follow` viết sai cú pháp (dùng `-` thay vì mảng `[ ]` → bị parse thành phép phủ định, qtool báo follow=0) và có từ rác "llamada"/"l ocult". Đã sửa: chuyển `follow` về mảng đúng chuẩn (follow=3 cả 3 câu), sửa từ rác thành "lời gọi"/"lẩn khuất trở lại". Giữ nguyên phần nội dung tốt.
- Nghiệm thu: `node --check js/data/q-aws.js` OK; `node scripts/build-light-index.js` chạy xong; `node scripts/validate.js` không còn lỗi/cảnh báo nào thuộc q-aws.js (aws: 89 câu hỏi). LỖI còn lại `lessons-jvm.js: lesson-jvm-004` thuộc file của agent khác (không sở hữu, không sửa theo luật 3). Không commit.
- Chủ đề chọn góc: aws-087/088/089 đã có sẵn ở vòng trước; vòng này tập trung sửa lỗi cú pháp/từ và hoàn thiện, không thêm trùng ý. Các câu aws-003/019/044/047/049/075/079/080... đã đề cập VPC/failover/cost ở góc khác nên 3 câu mới đi sâu vào tình huống ngân hàng cụ thể + cấu hình Java chi tiết + kế hoạch 8 tuần có số liệu.
Reviewed-by: kilo (T2678R)
