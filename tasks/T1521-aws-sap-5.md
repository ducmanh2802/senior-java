# T1521 — AWS sap-c02: thêm 40 câu luyện thi (sap-157..sap-196)

Status: DONE
Agent: kilo
Owns: `js/data/aws-sap-5.js`

Đọc docs/AWS-TRACK.md (schema window.AWS_QUESTIONS), js/data/aws-plan.js (id domain), AGENTS.md mục 5 (không backtick, không `${`). Đọc các file js/data/aws-sap-*.js đã có để KHÔNG trùng tình huống (xem cả danh sách chủ đề trong Notes của tasks/T573-aws-sap-4.md, T574-aws-dop-4.md).

Thêm vào `js/data/aws-sap-5.js` (đang rỗng) 40 câu, id sap-157..sap-196, exam 'sap-c02': ưu tiên sap-d4 (12 câu) và sap-d3 (10), còn lại sap-d1 (9) và sap-d2 (9).
- q và options bằng TIẾNG ANH, giống đề thật (bối cảnh công ty, ràng buộc LEAST operational overhead / MOST cost-effective); 4 options; khoảng 8 câu multi (5 options, "(Choose two.)").
- explain bằng TIẾNG VIỆT 600–1500 ký tự: từ khoá trong đề, vì sao đúng, vì sao TỪNG phương án sai, kết thúc "> Exam tip: …".
- Chỉ dùng tính năng AWS hiện hành, KHÔNG bịa (tên dịch vụ, tính năng, giới hạn). Không chắc thì chọn tình huống khác. Không thêm refs.
- Thêm bằng `node scripts/qtool.js append js/data/aws-sap-5.js logs/tmp-T1521.js`.

## Nghiệm thu
`node scripts/check-aws.js` → OK; `node scripts/build-light-index.js`; `node scripts/validate.js` → OK. KHÔNG commit. Xong: `Status: DONE`, Notes ghi phân bổ domain và chủ đề.

## Notes
- Đã thêm 40 câu sap-157..sap-196, exam `sap-c02`, không thêm refs; q/options tiếng Anh, explain tiếng Việt 600–1500 ký tự, kết thúc bằng `> Exam tip:`.
- Phân bổ đúng yêu cầu: sap-d4 = 12 (157–168), sap-d3 = 10 (169–178), sap-d1 = 9 (179–187), sap-d2 = 9 (188–196). Có 8 câu multi, mỗi câu 5 options và ghi `(Choose two.)`: 162, 174, 181, 188, 189, 190, 191, 196.
- Chủ đề d4: Outposts, Local Zones, Storage Gateway File/Volume, DataSync, DMS full load + CDC, Migration Hub Strategy Recommendations, ECS Anywhere, replatforming và Wavelength. d3: Fault Injection Service, S3 Storage Lens/Inventory/Batch Operations, AWS Backup restore testing, CloudFormation drift/StackSets, Synthetics, Intelligent-Tiering. d1: centralized root access, Marketplace private marketplace, RAM Capacity Reservations, tag policies, account contacts, delegated administration, Billing Conductor, Account Factory, IAM Identity Center. d2: private API Gateway, S3 Object Lock, Kinesis enhanced fan-out, EventBridge Pipes, MemoryDB, S3 Express One Zone, AppConfig, Lambda SnapStart, DynamoDB global tables.
- Đã đối chiếu tình huống với SAP-C02 data trước đó để tránh trùng; không dùng VMware Cloud on AWS hay Snowball Edge do tính hiện hành/khả dụng cần thận trọng.
- `node scripts/check-aws.js` → OK (354 câu AWS); `node scripts/build-light-index.js` đã chạy; `node --check js/data/aws-sap-5.js` → OK; `node scripts/validate.js` → `OK — không có lỗi.` (có cảnh báo sẵn về `lesson-design-007` không nằm trong PATH).
Reviewed-by: verify-only (code/UI task)
