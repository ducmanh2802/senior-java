# T2351 — 12 thẻ lab AWS thực hành: RDS & Aurora

Status: DONE
Agent: kilo
Owns: `js/data/aws-labs.js`
After: T2350

## Bối cảnh
Người học (Java dev 4 năm, ít kinh nghiệm cloud) ôn SAP-C02 + DOP-C02. Tab "Lab thực hành" trong `#/aws` hiển thị `window.AWS_LABS` (schema ở comment đầu `js/data/aws-labs.js`; domain id lấy trong `js/data/aws-plan.js`).
Danh mục tham khảo: `docs/ref/labaws-index.tsv` (631 lab của labaws.site: category, slug, title). **Chỉ dùng title/slug làm tham chiếu link; KHÔNG chép nội dung của họ** — mọi chữ trong thẻ do bạn tự viết từ kiến thức AWS chính thức.

## Việc cần làm
Thêm **12 thẻ** category `rds` (id `awslab-rds-NNN` tiếp số lớn nhất), chèn trước dòng `);` cuối file. Chủ đề: Multi-AZ vs read replica, Aurora cluster/global database, backup/PITR, snapshot cross-region, RDS Proxy, parameter group, encryption, failover test, Performance Insights, DynamoDB vs RDS khi nào, migration DMS — chọn 12 chủ đề **hay ra đề SAP/DOP nhất**, gom nhiều lab nhỏ của labaws thành 1 thẻ.
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
- Đếm thẻ trước/sau: 12 → 24 (thêm 12 thẻ category `rds`, id `awslab-rds-001`..`awslab-rds-012`).
- Chủ đề: Multi-AZ vs Read Replica; Aurora cluster writer/reader/custom endpoint; Aurora Global Database DR & switchover/failover; Automated backup & PITR; Manual snapshot copy cross-Region & share cross-account; RDS Proxy connection pooling; Parameter/Option Group; Encryption KMS/TLS & IAM DB Auth; Failover test & retry; Performance Insights/Enhanced Monitoring; RDS/Aurora vs DynamoDB; DMS full load & CDC.
- `node --check js/data/aws-labs.js`: OK (không lỗi cú pháp).
- Script Node (vm) kiểm tra: tổng 24, RDS 12, id duy nhất (DUP_IDS []), mọi ref tồn tại trong `docs/ref/labaws-index.tsv` (BAD_REFS []), domain id đều thuộc `sap-d1..d4, dop-d1..d6` trong `js/data/aws-plan.js` (BAD_DOM []).
- `node scripts/validate.js`: file `js/data/aws-labs.js` không có lỗi mới; validator vẫn báo các lỗi/cảnh báo **sẵn có** ở file KHÔNG thuộc sở hữu task (không sửa theo luật 3): `quiz-ccao-2.js` lỗi cú pháp; `q-devops.js` devops-171 inline code lồng `{ }`, devops-173 code fence chưa đóng; `quiz-ccdv-1.js` qz-ccdv-105 multi answer; `index-light.js` cũ; cảnh báo PATH lessons. Do đó validate chưa đạt trạng thái "OK — không có lỗi" toàn cục vì các lỗi ngoại biên tiền tồn tại.
- Mọi `ref` đã đối chiếu bằng grep/slug set trong tsv (đã sửa `lab-041-tao-dynamodb-table...` → `lab-41-...` cho đúng slug SOA trong index). Nội dung tự viết, không backtick, không `${` trong template literal.
