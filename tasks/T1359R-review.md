# T1359R — Fact-check nội dung mới của T1359

Status: DONE
Agent: opencode
Owns: `js/data/q-devops.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1359 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Đã review diff HEAD vs working tree của `js/data/q-devops.js`: 6 bổ sung mới (mỗi mục thêm "Ví dụ đời thực" + "Trả lời mẫu khi phỏng vấn") cho `devops-134`, `devops-051`, `devops-052`, `devops-053`, `devops-054`, `devops-055`.
- Kiểm tra kỹ thuật: Terraform (`moved` block, `state mv/rm/pull`, `terraform_remote_state`, backup/versioning), OTel Collector pipeline/tail sampling (loadbalancing theo `traceID`, `memory_limiter` đầu pipeline, filter/metric cardinality), secrets/GitOps (Sealed Secrets, SOPS, ESO/IRSA/refreshInterval, Reloader, HikariCP `maxLifetime`/overlap khi rotate), HPA cho Java (stabilization, custom metrics qua Prometheus Adapter, startup/readiness/warm-up, preStop/PDB), Argo Rollouts canary analysis (baseline comparison, warm-up/sample/false positive-negative), IDP/golden path — không phát hiện API/flag bịa, mặc định sai, cơ chế ngược hay số liệu vô căn cứ rõ ràng.
- Kiểm tra markup: không có backtick hoặc `${` trong các đoạn thêm; dùng `{{...}}`/`~~~` đúng quy ước.
- `node --check js/data/q-devops.js` OK. `node scripts/validate.js` vẫn FAIL do lỗi có sẵn ngoài phạm vi file sở hữu (q-soft.js syntax, lessons-testing/projects/path related refs, index-light cũ) — không sửa theo luật sở hữu task.
- Kết luận: **không có lỗi kiến thức cần sửa** trong nội dung mới của T1359.
