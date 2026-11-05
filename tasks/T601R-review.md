# T601R — Fact-check nội dung mới của T601

Status: DONE
Agent: opencode
Owns: `js/data/lessons-devops.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T601 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- lessons-devops.js: Thêm lesson-devops-008 (Rolling update K8s: maxSurge/maxUnavailable, probes, graceful shutdown) và lesson-devops-009 (Prometheus metrics, SLO, error budget) với bài tập tự chấm; sửa exercise tests/reference để phù hợp validator/schema.
- lessons-devops.js: Đảm bảo body ≥ 2500 ký tự, exercise tests biên dịch/pass đúng, dùng đúng markup {{code}}.
- q-devops.js: Sửa markup trong devops-040 (đóng {{}} cho địa chỉ IMDS) để tránh lỗi số {{}} không khớp.
- path.js: Thêm lesson-devops-008, lesson-devops-009 vào đường dẫn devops.
- Chạy node scripts/test-lessons.js → OK (113/113). Chạy node scripts/validate.js → OK.
