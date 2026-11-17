# T2350 — 12 thẻ lab AWS thực hành: Network (VPC)

Status: TODO
Agent: kilo
Owns: `js/data/aws-labs.js`


## Bối cảnh
Người học (Java dev 4 năm, ít kinh nghiệm cloud) ôn SAP-C02 + DOP-C02. Tab "Lab thực hành" trong `#/aws` hiển thị `window.AWS_LABS` (schema ở comment đầu `js/data/aws-labs.js`; domain id lấy trong `js/data/aws-plan.js`).
Danh mục tham khảo: `docs/ref/labaws-index.tsv` (631 lab của labaws.site: category, slug, title). **Chỉ dùng title/slug làm tham chiếu link; KHÔNG chép nội dung của họ** — mọi chữ trong thẻ do bạn tự viết từ kiến thức AWS chính thức.

## Việc cần làm
Thêm **12 thẻ** category `network` (id `awslab-network-NNN` tiếp số lớn nhất), chèn trước dòng `);` cuối file. Chủ đề: VPC/CIDR, subnet public/private, NAT, route table, security group vs NACL, VPC endpoint (gateway/interface), PrivateLink, peering vs Transit Gateway, VPN/Direct Connect, Route 53 routing policy, CloudFront, flow logs — chọn 12 chủ đề **hay ra đề SAP/DOP nhất**, gom nhiều lab nhỏ của labaws thành 1 thẻ.
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
