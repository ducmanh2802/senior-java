# T2352 — 12 thẻ lab AWS thực hành: Storage (S3, EBS, EFS)

Status: DONE
Agent: kilo
Owns: `js/data/aws-labs.js`
After: T2351

## Bối cảnh
Người học (Java dev 4 năm, ít kinh nghiệm cloud) ôn SAP-C02 + DOP-C02. Tab "Lab thực hành" trong `#/aws` hiển thị `window.AWS_LABS` (schema ở comment đầu `js/data/aws-labs.js`; domain id lấy trong `js/data/aws-plan.js`).
Danh mục tham khảo: `docs/ref/labaws-index.tsv` (631 lab của labaws.site: category, slug, title). **Chỉ dùng title/slug làm tham chiếu link; KHÔNG chép nội dung của họ** — mọi chữ trong thẻ do bạn tự viết từ kiến thức AWS chính thức.

## Việc cần làm
Thêm **12 thẻ** category `storage` (id `awslab-storage-NNN` tiếp số lớn nhất), chèn trước dòng `);` cuối file. Chủ đề: S3 storage class + lifecycle, versioning/Object Lock, replication CRR/SRR, bucket policy vs ACL, presigned URL, S3 event → Lambda, EBS snapshot/gp3, EFS, FSx, Storage Gateway, Backup — chọn 12 chủ đề **hay ra đề SAP/DOP nhất**, gom nhiều lab nhỏ của labaws thành 1 thẻ.
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

Đã thêm **12 thẻ** category `storage` (id `awslab-storage-001` … `awslab-storage-012`), chèn trước `);` cuối file. Số thẻ: **24 → 36 (+12)**.

Chủ đề 12 thẻ (chọn theo mức hay ra SAP-C02/DOP-C02, mỗi thẻ gom nhiều lab nhỏ của labaws):
1. S3 Storage Class + Lifecycle (storage class, lifecycle, Storage Lens)
2. Versioning + Object Lock (WORM) + mã hoá SSE (SSE-S3/KMS/DSSE-KMS)
3. S3 Replication CRR/SRR + Replication Time Control + Multi-Region Access Point
4. Bucket policy vs ACL vs IAM + Block Public Access + Object Ownership
5. Presigned URL (download/upload, giới hạn 7 ngày, so sánh CloudFront signed)
6. S3 Event Notifications → Lambda / SQS / EventBridge
7. EBS gp3/io2/st1/sc1 + mở rộng online + snapshot/copy/KMS
8. Amazon EFS (regional multi-AZ, mount target, lifecycle→IA, throughput mode, access point)
9. Amazon FSx (Windows File Server / Lustre / NetApp ONTAP)
10. AWS Storage Gateway (File / Volume cached-stored / Tape VTL)
11. AWS Backup (vault, plan, lifecycle, cross-region/account, Vault Lock)
12. Di trú dữ liệu: DataSync / Transfer Family / Snowball

Kiểm tra đã chạy:
- `node --check js/data/aws-labs.js` → OK (SYNTAX OK).
- Script Node tự viết: id duy nhất, mọi `ref` có trong `docs/ref/labaws-index.tsv`, domain id có trong `js/data/aws-plan.js`, đủ field, không backtick, không `${` → **0 lỗi**. Steps mỗi thẻ 5–9 bước (7,8,8,8,7,7,9,8,7,7,9,7). `level`: 11 senior + 1 mid (storage-005). `ref` mỗi thẻ 3–4 slug có thật.
- `node scripts/validate.js aws-labs.js` → không có lỗi nào thuộc `aws-labs.js`.

Lưu ý cho integrator (không thuộc phạm vi T2352, KHÔNG tự sửa theo luật 3): `node scripts/validate.js` (chạy toàn bộ) hiện còn đỏ vì các file của task/agent khác đang dở dang:
- `js/data/new_questions.js`: file untracked, chưa khai báo trong `js/core/data-manifest.js`.
- `js/data/quiz-ccao-2.js`, `js/data/quiz-ccdv-1.js`: lỗi cú pháp ở working tree (bản HEAD của 2 file này OK; đây là chỉnh sửa đang dở của agent khác).
- `js/data/index-light.js`: cũ so với dữ liệu do agent khác thêm/sửa câu hỏi (build-light-index KHÔNG index AWS_LABS — grep xác nhận 0 tham chiếu — nên thay đổi của T2352 không gây staleness).

Không commit, không tạo branch.
Reviewed-by: verify-only (code/UI task)
