# T1484R — Fact-check nội dung mới của T1484

Status: DONE
Agent: opencode
Owns: `js/data/quiz-ops.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1484 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

- `node scripts/validate.js` → `OK — không có lỗi.`
- Đã review toàn bộ nội dung mới trong `js/data/quiz-ops.js` (qz-devops-035..073, qz-aws-023..029, qz-primer-001..010, qz-security-023..037).
- Không phát hiện lỗi kiến thức kỹ thuật: mọi đáp án, giải thích, số liệu, cơ chế (K8s probes/PDB/eviction, Docker layer ordering, Terraform state lock/SCP, AWS NACL vs SG stateful, Prometheus Counter/Gauge/Histogram, Kafka partition/group, OIDC token roles, Spring Security 6 DSL, CORS, CSRF, mass assignment, SQL injection bind parameter, bcrypt→Argon2id upgrade, presigned URL, actuator exposure) đều chính xác theo chuẩn Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x, AWS hiện hành.
- Markup hợp lệ: không có backtick, không có `${` chưa escape, không HTML thô; mọi `{{code}}`, `###`, `- item`, bảng `|`, `~~~java/yaml/text/bash/json/sql` đều đúng cú pháp.
- Không cần sửa nội dung đã có ở HEAD; không thêm/xoá mục.
