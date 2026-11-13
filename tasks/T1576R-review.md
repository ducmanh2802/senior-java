# T1576R — Fact-check nội dung mới của T1576

Status: DONE
Agent: opencode
Owns: `js/data/q-devops.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1576 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Không có lỗi kỹ thuật. Đã review toàn bộ nội dung mới trong js/data/q-devops.js (devops-141 MongoDB replica set, devops-142 HA/quorum/fencing, devops-143 PostgreSQL vs MariaDB Galera vs MongoDB, devops-144 Docker layered JAR, devops-145 JVM memory/cgroup/OOMKilled, devops-146 K8s requests/limits, devops-147 probes, devops-148 rolling/blue-green/canary, devops-149 Secret rotation, devops-150 Micrometer/OpenTelemetry observability, devops-151 graceful shutdown). Tất cả `${` đã escape đúng, không có backtick trong nội dung, markup hợp lệ. node scripts/validate.js → OK, node scripts/test-lessons.js → 233/233 OK.
