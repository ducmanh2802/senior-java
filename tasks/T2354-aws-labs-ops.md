# T2354 — 12 thẻ lab AWS thực hành: Vận hành (SysOps/DevOps)

Status: DONE
Agent: kilo
Owns: `js/data/aws-labs.js`
After: T2353

## Bối cảnh
Người học (Java dev 4 năm, ít kinh nghiệm cloud) ôn SAP-C02 + DOP-C02. Tab "Lab thực hành" trong `#/aws` hiển thị `window.AWS_LABS` (schema ở comment đầu `js/data/aws-labs.js`; domain id lấy trong `js/data/aws-plan.js`).
Danh mục tham khảo: `docs/ref/labaws-index.tsv` (631 lab của labaws.site: category, slug, title). **Chỉ dùng title/slug làm tham chiếu link; KHÔNG chép nội dung của họ** — mọi chữ trong thẻ do bạn tự viết từ kiến thức AWS chính thức.

## Việc cần làm
Thêm **12 thẻ** category `ops` (id `awslab-ops-NNN` tiếp số lớn nhất), chèn trước dòng `);` cuối file. Chủ đề: CloudWatch metrics/alarm/logs insights, EventBridge, Systems Manager (Session Manager, Patch, Parameter Store), Config rules, CloudTrail, Organizations + SCP, IAM Identity Center, CloudFormation StackSets, incident runbook — chọn 12 chủ đề **hay ra đề SAP/DOP nhất**, gom nhiều lab nhỏ của labaws thành 1 thẻ.
Mỗi thẻ:
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

File `js/data/aws-labs.js` đã có 12 thẻ `ops` (awslab-ops-001..012) từ lần chạy trước bị gián đoạn — đã đọc lại, giữ nguyên nội dung tốt, chỉ sửa 1 lỗi: card awslab-ops-010 thiếu bước dọn dẹp bắt buộc trong `cost` (đã thêm ghi rõ xoá tài nguyên lab trong member account, gỡ SCP, xoá permission set/user trong Identity Center).

Kiểm tra đã thực hiện:
- `node --check js/data/aws-labs.js` → OK
- Script Node kiểm tra: 60 thẻ tổng, 12 thẻ `ops`, id duy nhất, mọi `ref` có trong docs/ref/labaws-index.tsv, domain id có trong aws-plan.js, exams ∈ {sap-c02, dop-c02} → không có lỗi.
- Đếm thẻ trước/sau: +12 (12 thẻ ops mới, tổng 60 thẻ AWS_LABS).
- `node scripts/check-aws.js` → OK — 474 câu AWS.

Lưu ý: `node scripts/validate.js` hiện tại exit=1 nhưng **không liên quan đến file này** — các lỗi còn lại nằm ở file của các agent khác (q-microservices.js, q-system-design.js, q-ai.js cú pháp; path.js, projects.js, bugs.js tham chiếu câu không tồn tại; index-light.js cũ). File aws-labs.js không xuất hiện trong danh sách lỗi. Không chạy `build-light-index.js` vì aws-labs không nằm trong SOURCE_GROUPS của script đó (chỉ questions/algos/lessons/sd/drills/companies/quiz).
