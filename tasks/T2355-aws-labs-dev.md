# T2355 — 12 thẻ lab AWS thực hành: Developer & CI/CD

Status: DONE
Agent: kilo
Owns: `js/data/aws-labs.js`
After: T2354

## Bối cảnh
Người học (Java dev 4 năm, ít kinh nghiệm cloud) ôn SAP-C02 + DOP-C02. Tab "Lab thực hành" trong `#/aws` hiển thị `window.AWS_LABS` (schema ở comment đầu `js/data/aws-labs.js`; domain id lấy trong `js/data/aws-plan.js`).
Danh mục tham khảo: `docs/ref/labaws-index.tsv` (631 lab của labaws.site: category, slug, title). **Chỉ dùng title/slug làm tham chiếu link; KHÔNG chép nội dung của họ** — mọi chữ trong thẻ do bạn tự viết từ kiến thức AWS chính thức.

## Việc cần làm
Thêm **12 thẻ** category `dev` (id `awslab-dev-NNN` tiếp số lớn nhất), chèn trước dòng `);` cuối file. Chủ đề: CodePipeline/CodeBuild/CodeDeploy cho Java, CDK/CloudFormation, SAM, API Gateway + Lambda, SQS/SNS fan-out, Step Functions, Secrets Manager rotation, X-Ray tracing, Cognito — chọn 12 chủ đề **hay ra đề SAP/DOP nhất**, gom nhiều lab nhỏ của labaws thành 1 thẻ.
- `goal`: 2–3 câu "sau lab này bạn hiểu/làm được gì" + vì sao quan trọng khi đi thi / đi làm.
- `steps`: 5–9 bước ngắn ở mức console/CLI (tự viết; không cần đủ từng click), có lệnh AWS CLI chính xác nếu chắc chắn.
- `verify`: cách kiểm tra đã đúng (lệnh, kết quả mong đợi).
- `cost`: chi phí có thể phát sinh + **bước dọn dẹp bắt buộc** (NAT Gateway, RDS, EKS… tính tiền theo giờ).
- `examTip`: 2–4 gạch đầu dòng bẫy đề thi liên quan (so sánh dịch vụ, giới hạn).
- `ref`: 1–4 slug CÓ THẬT trong docs/ref/labaws-index.tsv (kiểm bằng grep), đúng chủ đề.
- `exams`, `domains`, `services`, `level`, `minutes` hợp lý.
Số liệu/giới hạn AWS phải đúng hiện hành; không chắc thì bỏ. Không backtick, không ký hiệu đô-la + ngoặc nhọn.

## Nghiệm thu
`node --check js/data/aws-labs.js`; script Node nhỏ kiểm: id duy nhất, mọi `ref` có trong tsv, domain id có trong aws-plan.js; `node scripts/validate.js` → OK. Đếm thẻ trước/sau (+12) vào Notes. Không commit. Status: DONE.

## Notes
Status: DONE

- Số thẻ trước: 60 (network 12, rds 12, storage 12, compute 12, ops 12). Sau: 72 (+12 dev).
- Chủ đề: CodePipeline Java, CodeBuild buildspec, CodeDeploy blue/green & canary, CloudFormation change set/drift/rollback, CDK, SAM, API Gateway + Lambda, SQS/SNS fan-out, Step Functions, Secrets Manager rotation, X-Ray, Cognito.
- Kiểm tra: `node --check js/data/aws-labs.js` OK; script Node kiểm id duy nhất, 36 slug `ref` đều có trong `docs/ref/labaws-index.tsv`, mọi domain id có trong `aws-plan.js` → OK; `node scripts/validate.js` → `OK — không có lỗi.`
- Không commit.Reviewed-by: verify-only (code/UI task)
