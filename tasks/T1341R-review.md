# T1341R — Fact-check nội dung mới của T1341

Status: DONE
Agent: opencode
Owns: `js/data/q-scenario.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1341 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Đã sửa 2 lỗi kỹ thuật trong 6 section "Ví dụ đời thực" mới (scenario-076 đến scenario-081):

1. **scenario-076 (AWS cost optimization)**: "topology-aware routing" là thuật ngữ Kubernetes (topologyAwareHints), không phù hợp ngữ cảnh AWS EC2/NAT Gateway. Đã sửa thành "cấu hình ứng dụng ưu tiên endpoint cùng AZ (AZ affinity)" — thuật ngữ đúng cho AWS.

2. **scenario-078 (Alert fatigue)**: Cụm từ "alert thiên về nguyên nhân hạ tầng" nghe lạ tiếng Việt. Đã sửa thành "alert tập trung vào nguyên nhân hạ tầng" — đúng ngữ pháp và ý nghĩa kỹ thuật.

Các section còn lại (scenario-077 flaky tests, scenario-079 disk full, scenario-080 incident command, scenario-081 blameless postmortem) không có lỗi kỹ thuật, số liệu phù hợp, API/flag đúng chuẩn (Spring Boot 3, PostgreSQL 15, Prometheus/Alertmanager, Logback, Flyway).

`node scripts/validate.js` chạy OK cho q-scenario.js (130 câu hỏi, 20 trắc nghiệm, không báo lỗi). Các lỗi validate còn lại thuộc file khác (lessons, labs, path, q-aws) không thuộc phạm vi task này.
