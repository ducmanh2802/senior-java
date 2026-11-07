# T822R — Fact-check nội dung mới của T822

Status: DONE
Agent: opencode
Owns: `js/data/quiz-ops.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T822 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Đã review toàn bộ nội dung MỚI do model free viết (qz-devops-051–058, qz-aws-023–029).
- Kiểm tra kỹ thuật: đúng (K8s workload, Linux permission, bash set -euo pipefail, Terraform/Ansible, canary deploy, Prometheus metric types, Service selector, Route 53 Alias, SG/NACL stateful vs stateless, S3 Replication, VPN/Direct Connect, Transit Gateway, EFS, SQS visibility timeout, etc.).
- Markup: không có backtick lồng, không có `${` chưa escape, các block ~~~ đều cân đối.
- Không phát hiện lỗi kỹ thuật, markup hay chữ nước ngoài lẫn vào cần sửa → nội dung giữ nguyên.
- Chạy `node scripts/validate.js` → `OK — không có lỗi.`; `node --check js/data/quiz-ops.js` → SYNTAX OK.
