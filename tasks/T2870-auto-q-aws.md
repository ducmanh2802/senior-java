# T2870 — 3 câu hỏi Senior Java (aws) vào q-aws.js

Status: DONE
Agent: kilo
Owns: `js/data/q-aws.js`
After: T2746

Thêm **3 câu hỏi phỏng vấn mới** (topic: aws) vào `js/data/q-aws.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-aws.js`); đọc danh sách để **không trùng ý**.

Chủ đề: thiết kế VPC cho hệ thống ngân hàng (subnet private, NAT, VPC endpoint cho S3/Secrets Manager), RDS PostgreSQL Multi-AZ vs read replica vs Aurora — failover mất bao lâu và ứng dụng Java cần làm gì (DNS TTL, Hikari), chi phí: tìm và cắt 30% hoá đơn AWS.

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
- Vòng 4. File đã có 98 câu (aws-001..aws-098) với rất nhiều câu trùng chủ đề (VPC ngân hàng aws-003/087/096, RDS failover aws-066/075/088/097, cost 30% aws-089/098). Đã chọn 3 góc CHƯA có:
  - **aws-099 (lead)** — Phòng thủ rò rỉ dữ liệu khi task ECS bị chiếm (RCE): VPC endpoint policy + bucket policy + KMS key policy + điều kiện aws:SourceVpce/aws:PrincipalOrgID + private subnet không NAT + CloudTrail/GuardDuty. Khác các câu "chia subnet" trước (đi sâu defense-in-depth + exfiltration).
  - **aws-100 (senior)** — Read replica: replica lag và lỗi read-after-write (số dư cũ), định tuyến writer vs reader, read-your-writes. Khác các câu failover (đây là stale read khi dùng replica để scale đọc).
  - **aws-101 (senior)** — Cắt 30% từ HÀNH VI ứng dụng Java: ghi N+1/batch làm Aurora I/O, pool HikariCP quá lớn, thiếu cache, gọi đồng bộ. Khác các câu cost thiên về hạ tầng (rightsizing/Spot/endpoint).
- Mỗi câu đủ cấu trúc AGENTS.md mục 4/6: Tóm tắt → Hiểu nhanh → Thuật ngữ → Cơ chế từng bước → code/seq → bảng → lỗi hay gặp → Ví dụ đời thực có số liệu → Trả lời mẫu → Senior tip; follow 2–3 câu. Tiếng Việt có dấu, không backtick, không ${.
- Nghiệm thu: `node --check js/data/q-aws.js` OK; `node scripts/build-light-index.js` OK; `node scripts/validate.js` — aws 101 câu, KHÔNG có lỗi/cảnh báo nào thuộc q-aws.js (các LỖI còn lại thuộc file của task khác: q-frontend, quiz-ops, quiz-ckad-1, lessons-*, toeic — không được sửa theo luật 3). Không commit.
Reviewed-by: kilo (T2870R)
