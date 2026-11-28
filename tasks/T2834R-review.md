# T2834R — Fact-check nội dung mới của T2834

Status: DONE
Agent: opencode
Owns: `js/data/quiz-ckad-1.js`, `js/data/quiz-ckad-2.js`, `js/data/exams.js`, `js/core/data-manifest.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2834 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Không có lỗi kiến thức trong nội dung mới của T2834. Đã fact-check toàn bộ 40 câu `qz-ckad-001..040` (quiz-ckad-1.js), placeholder quiz-ckad-2.js, entry `ckad` trong exams.js và dòng manifest — đều đúng Kubernetes 1.30+.
- Xác nhận các điểm dễ sai đều chính xác: native sidecar qua init container `restartPolicy: Always` (beta 1.29+), `extensions/v1beta1` Ingress đã remove (phải dùng networking.k8s.io/v1), `kind load docker-image ... --name`, Kustomize `images: [{name,newTag}]`, `targetPort` = port container còn `port` = port Service, readiness fail → remove khỏi endpoints, NodePort truy cập `<NodeIP>:30080`, `--from-env-file`, `automountServiceAccountToken: false`, `concurrencyPolicy: Forbid`, Job `completions`/`parallelism`/`backoffLimit`.
- `exams.js`: field `passPct: 66` đúng schema (passPct cho mốc %; passScore cho thang 1000). `topics`/`domains`/`count`/`minutes` khớp.
- Không sửa văn phong/độ dài/bố cục (theo yêu cầu review). Nội dung tiếng Việt không dấu là vấn đề văn phong, ngoài phạm vi fact-check.
- `node scripts/validate.js`: KHÔNG có lỗi thuộc file sở hữu (quiz-ckad-1/2, exams, data-manifest). Các lỗi còn lại thuộc file của task khác (quiz-ops, lessons-payments, toeic-lr, lessons-jpa, frontend…) — không sửa theo luật 3.
- Không có lỗi → không sửa file nội dung nào.
