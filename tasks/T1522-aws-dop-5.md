# T1522 — AWS dop-c02: thêm 40 câu luyện thi (dop-159..dop-198)

Status: DONE
Agent: kilo
Owns: `js/data/aws-dop-5.js`

Đọc docs/AWS-TRACK.md (schema window.AWS_QUESTIONS), js/data/aws-plan.js (id domain), AGENTS.md mục 5 (không backtick, không `${`). Đọc các file js/data/aws-dop-*.js đã có để KHÔNG trùng tình huống (xem cả danh sách chủ đề trong Notes của tasks/T573-aws-sap-4.md, T574-aws-dop-4.md).

Thêm vào `js/data/aws-dop-5.js` (đang rỗng) 40 câu, id dop-159..dop-198, exam 'dop-c02': ưu tiên dop-d3, dop-d4, dop-d5 (mỗi domain 9 câu), dop-d2 (7), dop-d6 (6).
- q và options bằng TIẾNG ANH, giống đề thật (bối cảnh công ty, ràng buộc LEAST operational overhead / MOST cost-effective); 4 options; khoảng 8 câu multi (5 options, "(Choose two.)").
- explain bằng TIẾNG VIỆT 600–1500 ký tự: từ khoá trong đề, vì sao đúng, vì sao TỪNG phương án sai, kết thúc "> Exam tip: …".
- Chỉ dùng tính năng AWS hiện hành, KHÔNG bịa (tên dịch vụ, tính năng, giới hạn). Không chắc thì chọn tình huống khác. Không thêm refs.
- Thêm bằng `node scripts/qtool.js append js/data/aws-dop-5.js logs/tmp-T1522.js`.

## Nghiệm thu
`node scripts/check-aws.js` → OK; `node scripts/build-light-index.js`; `node scripts/validate.js` → OK. KHÔNG commit. Xong: `Status: DONE`, Notes ghi phân bổ domain và chủ đề.

## Notes

- Đã viết 40 câu `dop-159`..`dop-198` vào `js/data/aws-dop-5.js` (file trước đó rỗng), exam `dop-c02`, đúng schema `window.AWS_QUESTIONS`, không refs.
- Phân bổ theo domain: dop-d3 = 9 (159–167), dop-d4 = 9 (168–176), dop-d5 = 9 (177–185), dop-d2 = 7 (186–192), dop-d6 = 6 (193–198); tổng 40.
- 8 câu multi (5 options, "(Choose two.)"): 162, 165, 170, 174, 179, 189, 191, 193; còn lại 4 options.
- q/options tiếng Anh văn phong đề thật (LEAST operational overhead / MOST cost-effective); explain tiếng Việt 600–1500 ký tự, có từ khoá, giải thích từng phương án sai, kết thúc "> Exam tip:"; services 1–6 mục; không backtick, không `${`, không refs.
- Chủ đề đã đối chiếu để không trùng dop-001..158: Global Accelerator multi-Region, DynamoDB PITR, S3 Batch Operations replicate đối tượng cũ, RDS Multi-AZ+read replica, Lambda provisioned concurrency, ASG mixed instances Spot+capacity rebalancing, Route53 ARC zonal shift/autoshift, S3 versioning+MFA Delete, Aurora Global Database; CloudWatch Logs Insights+alarm, Synthetics canary, CloudTrail data events+S3 access logging, VPC Flow Logs→Athena, subscription filter→Lambda, cross-account observability, EventBridge archive+replay, Contributor Insights, SSM Inventory instance state; AWS Health→EventBridge→SSM Automation, CloudWatch alarm→Lambda dừng EC2+SNS, EventBridge DLQ+retry policy, Lambda async destination→SQS, CodeBuild thất bại→EventBridge→Lambda→SNS+sự cố, AWS Chatbot+Incident Manager từ Slack, CloudWatch composite alarm, alarm→EventBridge→Incident Manager, Incident Manager response plan; CloudFormation StackSets service-managed auto-deployment OU, registry modules+drift detection, CDK construct L2/L3, SSM State Manager+Inventory agent, AppConfig deployment strategy+rollback, EC2 Image Builder tạo+phân phối AMI, Service Catalog portfolio tự phục vụ; SCP+permissions boundary Deny, KMS multi-Region key replica, Control Tower landing zone+Account Factory, S3 Object Lock compliance+legal hold, AWS Network Firewall stateful, AWS WAF managed rules SQL injection.
- `node scripts/qtool.js append` không được trên file rỗng (dấu phẩy dẫn đầu), nên viết trực tiếp toàn bộ `js/data/aws-dop-5.js` (file do task này sở hữu).
- `node scripts/check-aws.js` → OK (394 câu AWS); `node scripts/build-light-index.js` ghi `js/data/index-light.js`; `node scripts/validate.js` lỗi chỉ còn lại trước đây trong `quiz-cca-5.js` (không thuộc task này, không sửa) và cảnh báo `path.js` cũ. Không commit.
Reviewed-by: verify-only (code/UI task)
