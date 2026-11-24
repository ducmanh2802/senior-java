# T2627R — Fact-check nội dung mới của T2627

Status: DONE
Agent: opencode
Owns: `js/data/quiz-ops.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2627 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Đã fact-check 10 câu mới của T2627 (Docker/Helm/K8s/Terraform/Prometheus/Argo CD/GitHub Actions).

Lỗi đã sửa:
- **Trùng id toàn bộ 10 câu mới**: T2627 đặt `qz-devops-094`..`qz-devops-103` trong `quiz-ops.js`, nhưng dải id này đã thuộc `quiz-gaps.js` ở HEAD → validate báo "quiz id thiếu hoặc trùng". Vì task chỉ sở hữu `quiz-ops.js`, đã đổi id 10 câu mới sang dải trống `qz-devops-114`..`qz-devops-123` (094→114, 095→115, … 103→123). Nội dung câu hỏi giữ nguyên.

Không có lỗi kiến thức khác: đáp án, cờ/flag (`-XX:ActiveProcessorCount`, `-Djarmode=layertools`, `mvn dependency:go-offline`), cơ chế (CFS quota, 3 loại probe, Helm merge order, Terraform `~`, EndpointSlice chỉ chứa Pod Ready, Argo CD selfHeal/prune, Prometheus counter/gauge/histogram, cache key hashFiles) đều đúng với Java 17/21, Spring Boot 3.x, K8s, Helm, Terraform, Prometheus hiện hành. Markup và escape `\${` hợp lệ; `node --check` OK.

Lỗi còn lại trong validate KHÔNG thuộc `quiz-ops.js` (file khác, agent khác đang làm dở): `lessons-design.js` lỗi cú pháp, `lessons-jvm.js` (related jvm-032), `path.js` (suy ra từ lessons-design hỏng), và `index-light.js` cũ — không build lại được `index-light.js` vì `build-light-index.js` dừng ở lỗi cú pháp `lessons-design.js`. Khi task của `lessons-design.js` xong và chạy lại `node scripts/build-light-index.js`, index-light sẽ tự cập nhật (gồm cả 10 id mới 114–123).
