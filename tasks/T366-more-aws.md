# T366 — AWS: thêm 8 câu nền tảng

Status: DONE
Agent: kilo
Owns: `js/data/q-aws.js`

Thêm **8 câu** topic aws, ưu tiên level **mid** (khoảng 60% mid, 30% senior, 10% lead), phong cách câu hỏi phỏng vấn thật ("Bạn sẽ… thế nào?", "So sánh… khi nào chọn cái nào?"). Gợi ý chủ đề (kiểm tra trùng trước, thay bằng chủ đề tương đương nếu đã có):
- EC2 vs ECS vs EKS vs Lambda: chọn thế nào cho service Spring Boot
- VPC cho người mới: subnet public/private, NAT, security group
- S3: storage class, presigned URL, versioning
- RDS vs Aurora, Multi-AZ vs read replica
- IAM: user, role, policy, least privilege cho ứng dụng
- SQS vs SNS vs EventBridge
- CloudWatch: log, metric, alarm cơ bản
- Ước lượng và giảm chi phí AWS cho team nhỏ

### Chuẩn chung (bắt buộc)
- Đọc AGENTS.md mục 2, 4, 5, 6, 13 trước khi viết. Người học là dev Java ~4 năm, **hổng nền tảng**: giải thích từ gốc, ví dụ đời thường, cơ chế từng bước có "vì sao", sơ đồ ASCII hoặc số liệu, code ngắn có comment, bảng trade-off, ### Lỗi hay gặp, ### Trả lời miệng 1 phút ngay trước > Senior tip:.
- Chống trùng: đọc hết câu cùng topic trong file của bạn và grep các file js/data/q-*.js khác; chủ đề đã có thì chọn góc khác hoặc bỏ.
- Đúng kỹ thuật với Java 17/21, Spring Boot 3.x, Hibernate 6, Kubernetes/AWS hiện hành. Không chắc thì viết ít lại nhưng đúng. refs chỉ dùng link chắc chắn tồn tại; chạy node scripts/check-links.mjs <tên-file.js> (chỉ tên file) và bỏ link hỏng.
- Chỉ **thêm**, id tiếp số lớn nhất của topic/category trong file. Không sửa nội dung đã có.
- Trong template literal: không có ký tự backtick, không có ${ chưa escape, dấu \ phải viết \\; inline code dùng {{code}}.
- **Không bao giờ để file hỏng cú pháp**: sau mỗi lần sửa chạy node --check <file>; nếu hỏng mà không sửa được thì khôi phục bằng git checkout -- <file> rồi làm lại từng mục một.
- Không chạy trực tiếp file .js như lệnh (luôn node <file>). Không commit/push, không kill tiến trình, không mở trình duyệt.
- Xong: node scripts/validate.js → OK — không có lỗi.; ghi Notes (id đã thêm) và đổi dòng trạng thái thành đúng Status: DONE (chỉ dùng TODO hoặc DONE, không dùng giá trị khác).

## Notes

- Thêm 8 câu aws-023 … aws-030 (mid 5: 023 region/AZ, 024 EC2 sizing/EBS/mua/SSM, 025 ECS Fargate + ALB + circuit breaker, 026 Route 53 + ACM, 027 RDS PITR sau DELETE nhầm; senior 2: 028 Lambda + SQS partial batch/DLQ, 029 job định kỳ: ShedLock vs EventBridge Scheduler; lead 1: 030 migration on-prem → AWS, 7R, DMS full load + CDC, cutover/rollback).
- 023–024 do kilo viết, claude review/sửa (ALB cross-zone, SDK v2 Region, ví dụ bộ nhớ JVM, t3 unlimited, mức giảm Savings Plans/RI, SSM endpoint); 025–030 claude viết mới. Chủ đề gợi ý trùng aws-001…022 nên chọn góc mới.
- Mỗi câu có refs docs.aws.amazon.com; check-links q-aws.js: 15 link, hỏng 0. node --check + validate OK.

Reviewed-by: claude (subagent; validate OK)
