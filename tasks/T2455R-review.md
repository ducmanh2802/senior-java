# T2455R — Fact-check nội dung mới của T2455

Status: DONE
Agent: opencode
Owns: `js/data/quiz.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2455 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Reviewed 10 câu trắc nghiệm mới của T2455 trong js/data/quiz.js (qz-devops-104 → qz-devops-113): graceful shutdown K8s/Spring Boot, image latest/digest, readiness/liveness probe, OOM eviction QoS, SLO burn rate, distributed tracing Kafka, rollout undo, Docker image best practices, tracing p99, canary promotion.
Không tìm thấy lỗi kỹ thuật (cờ/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), không lỗi markup (backtick, ${, {{}} khớp, fence ~~~, ### không thụt), không có chữ nước ngoài. Đáp án đúng rải đều vị trí, multi có "(Chọn 2)" khớp answer.length.
node scripts/build-light-index.js đã chạy (index-light.js đồng bộ với quiz.js); node scripts/validate.js quiz.js → OK.
Các lỗi còn lại của validate.js toàn nằm ở file khác (lessons-spring.js, q-concurrency-jvm.js, q-sql.js, path.js, newlessons.txt) — không thuộc quyền sở hữu task này, chưa sửa.
