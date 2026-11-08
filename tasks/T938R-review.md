# T938R — Fact-check nội dung mới của T938

Status: DONE
Agent: opencode
Owns: `js/data/q-devops.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T938 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Đã review toàn bộ nội dung T938 mới trong `js/data/q-devops.js` (diff HEAD -- file): mở rộng/viết lại `devops-049`, `devops-050`, `devops-051`, `devops-052`, `devops-053`, `devops-054`, `devops-055`, `devops-056`, `devops-073`; bổ sung mục Ví dụ đời thực/Trả lời mẫu cho `devops-076`–`devops-082` (đang được mở rộng), và phần Ví dụ đời thực/Trả lời mẫu cho `devops-086` (Patroni+etcd+HAProxy).
- Kiểm tra kỹ thuật: K8s (ReplicaSet/Deployment/StatefulSet/DaemonSet, headless `clusterIP: None`/PVC/volumeClaimTemplates, Service types ClusterIP/NodePort 30000-32767/LoadBalancer/ExternalName, Ingress vs Gateway API HTTPRoute/GRPCRoute, AWS LBC target-type ip/IRSA/subnet tags `kubernetes.io/role/elb`), observability (Prometheus scrape/Pushgateway/OTLP, Fluent Bit DaemonSet `/var/log/containers/*.log` tail/parse/enrich, traceId correlation, RED/USE), cardinality/retention, HPA desiredReplicas formula + requests dependency, KEDA scale-to-zero/lagThreshold, Karpenter vs Cluster Autoscaler, CI/CD (GitLab trigger include/multi-project variables, GitHub Actions workflow_call inputs/secrets + repository_dispatch client_payload, image tag SHA/semver không dùng latest, helm upgrade --install/rollback idempotent), Terraform plan/apply/state remote backend S3+DynamoDB lock/sensitive, Ansible agentless SSH modules/idempotency (changed=0), Patroni DCS leader key TTL/quorum 3-5/REST 8008 `/primary` + HAProxy checks, PostgreSQL 15 `maximum_lag_on_failover`/synchronous_mode/Hikari `connectionTimeout` — **không phát hiện API/flag bịa, mặc định sai, hay cơ chế nói ngược**; số liệu mang tính minh họa/hợp lý, đã ghi chú “(giả định)” ở các case.
- Kiểm tra markup/schema: không có backtick, không có `${` thô (chỉ `\${DEPLOY_ID...}` đã escape trong code block bash, an toàn theo AGENTS.md); dùng `{{...}}` cho inline code, `~~~...~~~` cho code block; cấu trúc câu đầy đủ (tóm tắt, cơ chế, ví dụ đời thực, pitfall, trả lời phỏng vấn, senior tip/follow). Không thêm/xoá mục, không đụng nội dung HEAD ngoài diff T938.
- **Không sửa nội dung kỹ thuật** (không có lỗi kỹ thuật/markup cần can thiệp). Không cần `node scripts/test-lessons.js` (chỉ `q-devops.js` câu hỏi, không phải bài học).
- Chạy `node scripts/build-light-index.js` → OK (189.3 KB). `node scripts/validate.js` → OK (1495 câu hỏi, 849 trắc nghiệm; chỉ cảnh báo có sẵn `modern-033` ngắn và `path.js` 2 bài học chưa trong PATH, không phải do T938).
