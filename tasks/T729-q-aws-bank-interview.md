# T729 — 10 câu AWS hỏi thật ở ngân hàng chuyển lên cloud: mạng, DNS, S3 replication, DX/VPN, TGW, EFS, ALB 400

Status: DONE
Agent: kilo
Owns: `js/data/q-aws.js`

Nguồn: danh sách câu hỏi phỏng vấn **DevOps / SA / Infra ở một ngân hàng Việt Nam đang chuyển lên cloud (AWS)**, do người đã đi phỏng vấn kể lại (2025). Interviewer hỏi rất sâu K8s và **case thực tế**. Viết theo đúng kiểu câu hỏi đó, trả lời như ứng viên DevOps/backend 4–6 năm.
Topic **aws** đã có 30 câu (đọc hết: aws-003 VPC + SG vs NACL, aws-009 HA/DR, aws-021 multi-account, aws-026 Route 53 + ACM, aws-030 migration on-prem — KHÔNG lặp lại, chỉ đào sâu góc khác). Thêm 10 câu, level 2 mid / 6 senior / 2 lead:
1. Bản ghi DNS A, AAAA, CNAME, Alias (Route 53), MX/TXT; vì sao không đặt CNAME ở apex; TTL ảnh hưởng thế nào khi cutover.
2. Request qua ALB trả về **400** trong khi backend vẫn sống và traffic đang lớn: các nguyên nhân (request/header lỗi hoặc quá lớn, HTTP desync mitigation, client gửi sai, Host header, ALB tự trả lỗi vs target trả lỗi — phân biệt bằng metric HTTPCode_ELB_4XX_Count vs HTTPCode_Target_4XX_Count và access log), cách điều tra từng bước.
3. Chuyển dữ liệu giữa các region: S3 Cross-Region Replication (versioning, IAM role, chỉ object mới; S3 Batch Replication cho object cũ; Replication Time Control), chi phí data transfer, các lựa chọn cho DB (cross-region read replica, Aurora Global Database, DMS).
4. Kết nối private từ on-premise lên AWS: Site-to-Site VPN vs Direct Connect (private/transit VIF, DX + VPN backup), thời gian triển khai, băng thông, độ trễ, chi phí.
5. Kết nối nhiều VPC trong môi trường private: VPC peering (không transitive) vs Transit Gateway (route table, phân vùng) vs PrivateLink; CIDR trùng nhau thì làm gì.
6. Nhiều EC2/ECS cần share chung storage: EFS (mount target theo AZ, throughput mode, ECS EFS volume), FSx, S3 (không phải file system), khi nào dùng cái nào.
7. Dựng môi trường cho một app đáp ứng HA và có backup: từ VPC, subnet đa AZ, ALB, ASG/ECS/EKS, RDS Multi-AZ, AWS Backup, secrets, logging — liệt kê theo thứ tự triển khai và vì sao.
8. Security Group stateful vs NACL stateless trong **sự cố thực tế**: ephemeral port bị NACL chặn chiều về, cách debug bằng VPC Flow Logs và Reachability Analyzer (không giải thích lại khái niệm cơ bản đã có ở aws-003).
9. (lead) Landing zone cho ngân hàng chuyển lên cloud: Control Tower, account vending, SCP guardrail, log archive/audit account, network account tập trung (liên kết aws-021, không lặp lại).
10. (lead) Migrate database từ on-prem lên AWS với downtime tối thiểu: DMS full load + CDC, SCT khi đổi engine, kiểm tra dữ liệu, kế hoạch cutover và rollback.

> **CẢNH BÁO GHI ĐÈ:** file này có thể đang chứa nội dung chưa commit của task khác. **Chỉ THÊM** bằng cách chèn object mới ngay trước dòng `);` cuối file, KHÔNG viết lại cả file, KHÔNG xoá/sửa object có sẵn. Trước khi đánh DONE: đếm số id trước và sau (`grep -c "id: '"`), số sau = số trước + số mục bạn thêm. Id luôn dùng nháy đơn.
> Đánh DONE bằng cách **sửa dòng `Status:` ở đầu file** (không thêm dòng Status mới ở cuối).
> Sơ đồ luồng nhiều bên (≥ 3 hệ thống): dùng khối `~~~seq` (cú pháp trong AGENTS.md mục 5).

## Quy tắc chung (bắt buộc)
- Đọc AGENTS.md mục 4, 5, 6. Người đọc: dev Java 4 năm, ít va chạm doanh nghiệp lớn, cần giải thích **từ gốc, rất chi tiết, có ví dụ đời thực**.
- **Chỉ THÊM** câu mới vào cuối mảng trong `js/data/q-aws.js`; id tiếp nối số lớn nhất hiện có của topic (kiểm tra trùng id trước khi ghi). Không sửa câu cũ.
- TRƯỚC khi viết, đọc hết câu cùng topic để **không trùng ý**.
- Mỗi đáp án: `**Tóm tắt:**` → các mục ### (bối cảnh thật, cách làm từng bước, ví dụ số liệu/artifact, bảng trade-off, pitfall) → `> Senior tip:`. 2500–4500 ký tự. `follow` 2–3 câu.
- Không backtick, không `${` trong template literal. Không chạy file .js trực tiếp, luôn dùng `node`. Đúng kỹ thuật với Java 17/21, Spring Boot 3.x; không bịa API/flag; không chắc thì bỏ.

## Nghiệm thu
`node --check js/data/q-aws.js`, `node scripts/build-light-index.js` rồi `node scripts/validate.js` → OK. KHÔNG commit. Ghi Status: DONE + danh sách id mới vào Notes.

## Notes
Reviewed-by: kilo (T729R)
