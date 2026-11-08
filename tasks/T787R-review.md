# T787R — Fact-check nội dung mới của T787

Status: DONE
Agent: opencode
Owns: `js/data/q-aws.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T787 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Đã review diff `git diff HEAD -- js/data/q-aws.js` (T787 mới sửa): `aws-031, aws-032, aws-034, aws-036, aws-047`. Không thêm/xoá mục; không sửa phần đã có ở HEAD.

- **aws-031 (Route 53/DNS, TTL)**: Nội dung kỹ thuật đúng (RFC 1034/1912 apex+CNAME xung đột NS/SOA, Alias hỗ trợ apex/AWS targets, cơ chế TTL/cutover, lưu ý ISP TTL tối thiểu). Markup `~~~seq` hợp lệ (actors/title/`->`/`note`). Không phát hiện API bịa hay cơ chế ngược.
- **aws-032 (ALB 400, metric/access log)**: Phân biệt ELB-side/target-side đúng; metric `HTTPCode_ELB_4XX_Count`/`HTTPCode_Target_4XX_Count` và `elb_status_code`/`target_status_code` (dấu `-` khi không forward) đúng. Giới hạn header/URI ~16KB và HTTP desync mitigation nêu đúng hướng, có kèm lưu ý "kiểm tra giới hạn hiện hành". Ví dụ JWT/cookie phình header hợp lý (số liệu minh họa). Markup hợp lệ.
- **aws-034 (VPN vs Direct Connect)**: So sánh triển khai/băng thông/độ trễ/mã hóa/chi phí đúng hướng (IPsec mặc định cho VPN, DX không mã hóa mặc định; MACsec/IPsec over DX; ~1.25 Gbps/tunnel VPN; DX dedicated/hosted; Transit VIF + TGW). **Sửa fact**: Private VIF không gắn trực tiếp TGW — đổi thành "qua VGW hoặc Direct Connect Gateway gắn VGW"; Transit VIF gắn Direct Connect Gateway tới TGW. Số liệu thời gian/độ trễ/chi phí ghi là tham khảo/cần kiểm tra bảng giá hiện hành.
- **aws-036 (EFS/FSx/S3/EBS Multi-Attach)**: Phân loại use case đúng (NFS Linux/EFS, SMB+AD/FSx Windows, Lustre ML+S3, NetApp ONTAP, S3 object, EBS Multi-Attach chỉ io1/io2 + cluster-aware FS). EFS throughput modes (Elastic/Bursting/Provisioned), access point, latency/nhỏ-file caveat đúng.
- **aws-047 (VPC route/NAT/Endpoint, chi phí NAT-S3)**: Cơ chế route table/NAT/Gateway Endpoint (S3+DynamoDB, route `pl-*`, miễn phí data processed NAT) và Interface Endpoint (PrivateLink ENI, có phí) đúng. Ví dụ bill minh họa (90TB, $4200) là hợp lý như case study; S3 transfer cùng region miễn phí nêu đúng ngữ cảnh.

`node scripts/validate.js` → OK (không lỗi; còn cảnh báo cũ `modern-033` ngắn, `lesson-design-006/007` không trong PATH — không thuộc phạm vi T787R).
