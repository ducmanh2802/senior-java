# T2384R — Fact-check nội dung mới của T2384

Status: DONE
Agent: opencode
Owns: `js/data/q-aws.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2384 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Fact-check nội dung MỚI của T2384 (aws-079..aws-083) trong `js/data/q-aws.js`. Đọc kỹ từng câu, đối chiếu cơ chế AWS hiện hành (EC2/RDS cost, NAT Gateway, S3, CloudWatch, Organizations).

### Lỗi đã sửa
- **aws-083 (cơ chế nói ngược — Tag Policies):** Bản gốc ghi "Tag Policies trong Organizations bắt buộc tag khi tạo resource (enforce)" và "Tagging bắt buộc qua Tag Policies và SCP (deny nếu thiếu tag)". SAI: Tag Policies (basic compliance rules với `enforced_for`) chỉ **chuẩn hoá giá trị + cách viết hoa của tag KHI tag đã được cung cấp**, **không** bắt buộc phải có tag (tài liệu AWS: "does not enforce missing tag keys"; re:Post/Tagging whitepaper xác nhận). Việc **chặn tạo resource thiếu tag** phải dùng **SCP** với điều kiện `aws:RequestTag` (Null = true). Đã sửa:
  - Dòng "Tag Policies: chuẩn hoá giá trị và cách viết hoa của tag (allowed values) khi tag đã được cung cấp — **không** tự bắt buộc phải có tag."
  - Dòng SCP: "chặn tạo resource không có tag bắt buộc (deny if missing tag, dùng điều kiện aws:RequestTag)."
  - Câu "Trả lời mẫu": "Tagging bắt buộc lúc tạo qua SCP (deny nếu thiếu tag), còn Tag Policies chuẩn hoá giá trị tag; propagate tag."

### Các câu còn lại — không có lỗi kiến thức
- **aws-079 (chi phí EC2/RDS):** Quy trình đo → rightsizing → kiến trúc → cam kết đúng; Compute Optimizer (miễn phí, metric 14 ngày), gp3, Aurora Serverless v2, Graviton c7g/r7g, Compute Savings Plans linh hoạt nhất, Savings Plans 1yr No/Partial Upfront, RI cho RDS/Redshift/ElastiCache — tất cả chính xác. Số liệu ví dụ hợp lý (giảm ~45%).
- **aws-080 (NAT Gateway):** Phí giờ + phí GB + cross-AZ đúng; Gateway endpoint (miễn phí) cho S3/DynamoDB, Interface endpoint (PrivateLink) cho dịch vụ khác; private DNS là bước hay quên (đúng — không bật thì SDK resolve public IP, đi qua NAT); ECR api+dkr, CloudWatch Logs — chính xác. Bảng chi phí và ví dụ EKS nhất quán.
- **aws-081 (S3 lifecycle/Intelligent-Tiering):** Thứ tự storage class, thời gian tối thiểu (Standard-IA 30 ngày, Glacier IR 90 ngày, Deep Archive 180 ngày), Intelligent-Tiering các tier (Frequent/Infrequent/Archive Instant/Archive/Deep Archive), ngưỡng 128KB, incomplete multipart + AbortIncompleteMultipartUpload — đúng.
- **aws-082 (CloudWatch Logs):** Tính tiền ingest + storage + query (Logs Insights), retention mặc định "Never expire", export S3 + Athena, subscription filter Kinesis/Firehose, structured JSON, EMF, ALB/NLB access log + VPC Flow Logs nên gửi thẳng S3 — chính xác.

### Markup / foreign text
- Không có backtick nội bộ (chỉ dùng làm delimiter template literal), không có `${`, không có ký tự CJK/Cyrillic/Thai lẫn vào. Bảng dùng đúng cú pháp `| … |` + `|---|`.

### Nghiệm thu
- `node --check js/data/q-aws.js` → OK. Load thử: 83 câu aws, id cuối aws-083.
- Kiểm tra schema riêng 5 câu mới: đủ field hợp lệ, độ dài a 2404–3087 ký tự, follow ≥ 2, có tags, không field lạ → 0 vấn đề.
- `node scripts/validate.js`: **q-aws.js KHÔNG có lỗi nào**. Các lỗi còn lại đều từ file của task KHÁC đang dở (không thuộc quyền sở hữu): q-banking.js lỗi cú pháp dòng 421 (`String pan = ...`) → kéo theo banking/path/projects/lessons-banking; lessons-security.js lỗi cú pháp; labs-gc.js markup. `build-light-index.js` không chạy được vì q-banking.js lỗi cú pháp. index-light.js đã có sẵn aws-079..083 (đã thêm từ trước). Không sửa file ngoài quyền sở hữu (mục 3 AGENTS.md).
