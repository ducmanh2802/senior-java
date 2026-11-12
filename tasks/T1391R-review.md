# T1391R — Fact-check nội dung mới của T1391

Status: DONE
Agent: opencode
Owns: `js/data/q-soft.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1391 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Đã review 2 file bị thay đổi bởi T1391:
- `js/data/q-soft.js`: Thêm "Trả lời mẫu khi phỏng vấn" cho behavioral-052 (dẫn dắt team đổi công nghệ Kafka). Nội dung kỹ thuật đúng: feature flag, monitoring lag, runbook, producer/consumer/partition/offset/idempotency/retry/DLQ, pair programming, PoC metrics (P95 1800→420ms, DLQ+replay test 0 message lost).
- `js/data/q-devops.js`: Thêm 6 sections cho devops-101 đến devops-114 (CD/rollback, SemVer/release/hotfix, security pipeline, Docker network, volume/bind mount permissions, container hardening). Tất cả cơ chế kỹ thuật chính xác: expand/contract migration, kubectl rollout undo/helm rollback, backward-compatible migration, contract testing (Pact), gitleaks/trivy/Semgrep/ZAP/OPA/Kyverno, Docker Compose user-defined bridge + DNS tên service, named volume vs bind mount + UID/GID permission denied fix, non-root/read-only rootfs/cap-drop/no-new-privileges/seccomp + Kubernetes securityContext mapping.

`node scripts/validate.js` → OK — không có lỗi. Không phát hiện lỗi kiến thức, markup, hoặc chữ nước ngoài lẫn vào. Không cần sửa gì thêm.
