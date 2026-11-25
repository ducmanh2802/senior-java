# T2729R — Fact-check nội dung mới của T2729

Status: DONE
Agent: opencode
Owns: `js/data/q-devops.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2729 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK (q-devops.js sạch). Các lỗi còn lại là của task khác, không sở hữu.

## Notes
Lỗi đã sửa (theo từng id):
- devops-210: Bài ví dụ Gradle trước đây dùng `--tests "*" -Dorg.gradle.parallel=true -Dorg.gradle.workers.max=4` và nhãn "4 shard song song trên nhiều runner" — thực ra `--max-workers=4` chỉ chạy 4 worker trên 1 runner, không phải sharding qua nhiều runner. Sửa nhãn thành "# 4 test worker song song trên 1 runner" và lệnh thành "./gradlew test --max-workers=4"; phần chia module giữ nguyên `:module-a:test ...`.
- devops-211: Lệnh `docker buildx build --provenance=true --sbom=true -t registry/img:v1 .` chứa cờ `--sbom=true` không tồn tại cho `docker buildx build` (SBOM đã sinh riêng bằng `syft` ở dòng tiếp theo). Xóa cờ `--sbom=true`, giữ `--provenance=true`.
- devops-212: không có lỗi.

Lỗi validate còn lại (không sở hữu, không sửa):
- quiz-ops.js: qz-ai-051..060 (tiêu đề ### thụt đầu dòng, {{}}/}} không khớp, dấu { } lồng nhau trong inline code)
- q-concurrency-jvm.js: concurrency-081/083/084, jvm-070/071/072 (đáp án ngắn < 1500 ký tự)
- q-spring-data.js: db-069 (đáp án ngắn < 1500 ký tự)
- lessons-jpa.js: lesson-jpa-020 (body < 2500 ký tự)
- path.js: 193 bài học không nằm trong PATH
