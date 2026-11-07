# T785R — Fact-check nội dung mới của T785

Status: DONE
Agent: kilo
Owns: `js/data/q-english.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T785 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

- **Đã fact-check nội dung mới english-129..141** (13 câu, model free viết, từ task T785). Đọc kỹ AGENTS.md mục 4–6 trước khi review.
- **Kết luận: KHÔNG phát hiện lỗi kỹ thuật cần sửa.** Dưới đây là các điểm đã kiểm tra và nhận xét theo từng id:
  - **english-129** (AWS architecture, senior): đúng về các thành phần (ALB, ECS/EKS/EC2, RDS Multi-AZ, ElastiCache, S3, SQS/SNS, Route 53, CloudFront, VPC, security groups). `~~~seq` "Typical request path on AWS" hợp lệ. Shared responsibility (AWS secured infrastructure; you secure config/IAM/data) đã nêu đúng. Không bịa API.
  - **english-130** (production incident, senior): timeline table (19:05/19:10/19:18) + root cause + action items đầy đủ; dùng đúng từ "root cause" (không phải "root reason"), "mitigation" tách biệt "resolution". Blameless tone.
  - **english-131** (blue-green/canary, mid): giải thích đúng cơ chế, bảng trade-off chính xác. `~~~seq` "Blue-green traffic switch" hợp lệ (4 actor: Users | Router | Blue | Green).
  - **english-132** (CI/CD pipeline, senior): trigger → build → scans → artifact → staging → controlled rollout → post-deploy; đúng với GitHub Actions/Maven/Docker/ECR/Argo canary. `~~~seq` "CI/CD flow (simplified)" hợp lệ (5 actor).
  - **english-133** (AWS cloud architecture, senior): request flow, bảng Decision/Why/Trade-off, `~~~seq` "Request flow (Java service on AWS)" hợp lệ (5 actor). Không nhầm region/AZ.
  - **english-134** (incident timeline/root cause/action items, senior): timeline table + bảng action item (Type/Owner/Deadline/Verify) + phân biệt "root cause" vs "contributing factor". Kỹ thuật đúng (connection pool exhaustion).
  - **english-135** (blue-green vs canary, senior): lặp lại chủ đề 131 nhưng ở góc so sánh trực tiếp + chọn phương án — không trùng ý, thêm blast radius/health signal/ramp-up. Không có `~~~seq` (chỉ mô tả bằng list/bảng), không vi phạm.
  - **english-136** (monitor service, senior): 3 layer (metrics/logs/traces), golden signals (traffic/errors/latency/saturation), SLO, alert fatigue. Bảng Layer/Question/Example chính xác.
  - **english-137** (on-call, senior): rotation/triage/runbook/page đúng nghĩa; sample answer có số liệu (8→2 escalations/week). Không hero culture.
  - **english-138** (Terraform/IaC, senior): declarative/drift/provisioning đúng; `~~~seq` "IaC change flow (simplified)" hợp lệ (4 actor). Bảng Manual vs IaC chính xác.
  - **english-139** (xin làm rõ, mid): polite phrases + situation table; không dùng "Can you repeat again?" (đã dùng đúng "Could you repeat that?").
  - **english-140** (thừa nhận không biết, mid): cấu trúc direct/anchor/method/assumption đúng; ví dụ eBPF/Cilium hợp lý.
  - **english-141** (hỏi interviewer về DevOps culture, mid): bảng Question/What it reveals + 6 câu hỏi cụ thể, không hỏi về perks. Phrasing lịch sự.
- **Markup/validator:** file vẫn đúng cấu trúc `(window.QUESTIONS = window.QUESTIONS || []).push(...)`; không có backtick `` ` `` lồng trong template literal, không có `${` chưa escape; tất cả 5 khối `~~~seq` (129, 132, 133, 134, 138) đều có đóng `~~~` và actors ≥ 2, text mỗi bước ≤ 60 ký tự.
- **Đồng bộ:** đã chạy `node scripts/build-light-index.js` (sinh lại `js/data/index-light.js`) rồi `node scripts/validate.js` → `OK — không có lỗi.` (các cảnh báo ở file khác là có sẵn từ trước, không phải do mình). `node --check js/data/q-english.js` OK.
- **Luật:** không commit, không mở trình duyệt, không kill tiến trình theo tên. Chỉ sửa `js/data/q-english.js` và file task này.
