/*
 * Learning path Java junior → Senior: ordered stages, each unlocks after the previous one (see tasks/T137).
 * Stage = { id: 'path-NN', order, phase: 'Nền tảng'|'Vững vàng'|'Senior', title, weeks: '1–2', goal: `markup`,
 *           lessons: [lesson ids], questions: [bank question ids, 4–8 "câu chốt chặng"], quizTopics: [topic ids],
 *           requires: [stage ids] }
 * A stage is done when every lesson is 'known' and >= 70% of its questions are 'known'.
 */
window.PATH = [
  {
    id: 'path-01', order: 1, phase: 'Nền tảng', title: 'Java core chắc tay', weeks: '1–2',
    goal: 'Hiểu exception, generics, String và immutability đủ để giải thích bằng lời, không chỉ dùng được.',
    lessons: ['lesson-core-001', 'lesson-core-002', 'lesson-core-003', 'lesson-core-004', 'lesson-core-005', 'lesson-core-006', 'lesson-core-007', 'lesson-core-008', 'lesson-core-009'],
    questions: ['core-001', 'core-002', 'core-003', 'core-004', 'core-005', 'core-006', 'core-007', 'core-008'],
    quizTopics: ['core'], requires: [],
  },
  {
    id: 'path-02', order: 2, phase: 'Nền tảng', title: 'Collections từ bên trong', weeks: '3–4',
    goal: 'Biết HashMap, ArrayList, TreeMap, PriorityQueue chạy thế nào bên trong và chọn đúng cấu trúc.',
    lessons: ['lesson-collections-001', 'lesson-collections-002', 'lesson-collections-003', 'lesson-collections-004', 'lesson-collections-005', 'lesson-collections-006', 'lesson-collections-007'],
    questions: ['collections-001', 'collections-002', 'collections-003', 'collections-004', 'collections-005', 'collections-006', 'collections-007', 'collections-008'],
    quizTopics: ['collections'], requires: ['path-01'],
  },
  {
    id: 'path-03', order: 3, phase: 'Nền tảng', title: 'SQL từ nền tảng đến nâng cao', weeks: '5–6',
    goal: 'Viết query đúng, đọc execution plan, hiểu index và tránh N+1 ngay từ tầng SQL.',
    lessons: ['lesson-sql-001', 'lesson-sql-002', 'lesson-sql-003', 'lesson-sql-004', 'lesson-sql-005', 'lesson-sql-006', 'lesson-sql-007'],
    questions: ['sql-001', 'sql-002', 'sql-003', 'sql-004', 'sql-005', 'sql-006', 'sql-007', 'sql-008'],
    quizTopics: ['sql'], requires: ['path-02'],
  },
  {
    id: 'path-04', order: 4, phase: 'Nền tảng', title: 'JVM & GC hiểu từ bên trong', weeks: '7–8',
    goal: 'Giải thích GC, heap, stack, classloader và tuning như một Senior khi production chậm.',
    lessons: ['lesson-jvm-001', 'lesson-jvm-002', 'lesson-jvm-003', 'lesson-jvm-004', 'lesson-jvm-005', 'lesson-jvm-006', 'lesson-jvm-007', 'lesson-jvm-008'],
    questions: ['jvm-001', 'jvm-002', 'jvm-003', 'jvm-004', 'jvm-005', 'jvm-006'],
    quizTopics: ['jvm'], requires: ['path-03'],
  },
  {
    id: 'path-05', order: 5, phase: 'Nền tảng', title: 'REST API & HTTP thực chiến', weeks: '9–10',
    goal: 'Thiết kế endpoint đúng quy ước HTTP, xử lý lỗi và bảo mật cơ bản từ tầng API.',
    lessons: ['lesson-api-001', 'lesson-api-002', 'lesson-api-003', 'lesson-api-004', 'lesson-api-005', 'lesson-api-006', 'lesson-api-007', 'lesson-api-008', 'lesson-api-009'],
    questions: ['api-001', 'api-002', 'api-003', 'api-004', 'api-005', 'api-006', 'api-007', 'api-008'],
    quizTopics: ['api'], requires: ['path-04'],
  },
  {
    id: 'path-06', order: 6, phase: 'Vững vàng', title: 'Concurrency & Modern Java', weeks: '11–13',
    goal: 'Dùng ExecutorService, CompletableFuture, Virtual Threads và Stream đúng ngữ cảnh, tránh deadlock.',
    lessons: ['lesson-concurrency-001', 'lesson-concurrency-002', 'lesson-concurrency-003', 'lesson-concurrency-004', 'lesson-concurrency-005', 'lesson-concurrency-006', 'lesson-concurrency-007', 'lesson-concurrency-008', 'lesson-concurrency-009', 'lesson-concurrency-010', 'lesson-concurrency-011',
              'lesson-modern-001', 'lesson-modern-002', 'lesson-modern-003', 'lesson-modern-004', 'lesson-modern-005', 'lesson-modern-006', 'lesson-modern-007'],
    questions: ['concurrency-001', 'concurrency-002', 'concurrency-003', 'concurrency-004', 'concurrency-005', 'modern-001', 'modern-002', 'modern-003'],
    quizTopics: ['concurrency', 'modern'], requires: ['path-05'],
  },
  {
    id: 'path-07', order: 7, phase: 'Vững vàng', title: 'Spring Boot & JPA thực chiến', weeks: '14–16',
    goal: 'Viết service đúng tầng, dùng JPA hiệu quả, tránh lazy load và hiểu cơ chế proxy.',
    lessons: ['lesson-spring-001', 'lesson-spring-002', 'lesson-spring-003', 'lesson-spring-004', 'lesson-spring-005',
              'lesson-spring-006', 'lesson-spring-007', 'lesson-spring-008', 'lesson-spring-009', 'lesson-spring-010', 'lesson-spring-011', 'lesson-spring-012', 'lesson-spring-013',
              'lesson-jpa-001', 'lesson-jpa-002', 'lesson-jpa-003', 'lesson-jpa-004', 'lesson-jpa-005', 'lesson-jpa-006', 'lesson-jpa-007', 'lesson-jpa-008', 'lesson-jpa-009'],
    questions: ['spring-001', 'spring-002', 'spring-003', 'spring-004', 'spring-005', 'jpa-001', 'jpa-002', 'jpa-003'],
    quizTopics: ['spring', 'jpa'], requires: ['path-06'],
  },
  {
    id: 'path-08', order: 8, phase: 'Vững vàng', title: 'DB nâng cao, Testing & Security', weeks: '17–19',
    goal: 'Tối ưu query, viết unit/integration test đáng tin và hiểu bảo mật ứng dụng từ cơ bản đến OWASP.',
    lessons: ['lesson-db-001', 'lesson-db-002', 'lesson-db-003', 'lesson-db-004', 'lesson-db-005', 'lesson-db-006', 'lesson-db-007', 'lesson-db-008', 'lesson-db-009', 'lesson-db-010', 'lesson-db-011',
              'lesson-testing-001', 'lesson-testing-002', 'lesson-testing-003', 'lesson-testing-004', 'lesson-testing-006', 'lesson-testing-007',
              'lesson-security-001', 'lesson-security-002', 'lesson-security-003', 'lesson-security-004', 'lesson-security-005', 'lesson-security-006', 'lesson-security-007', 'lesson-security-008', 'lesson-security-009', 'lesson-security-010', 'lesson-security-011'],
    questions: ['db-001', 'db-002', 'db-003', 'db-004', 'testing-001', 'testing-002', 'security-001', 'security-002'],
    quizTopics: ['db', 'testing', 'security'], requires: ['path-07'],
  },
  {
    id: 'path-09', order: 9, phase: 'Vững vàng', title: 'DevOps, Docker & CI/CD', weeks: '20–21',
    goal: 'Triển khai container, cấu hình pipeline và hiểu môi trường production từ góc nhìn Senior.',
    lessons: ['lesson-devops-001', 'lesson-devops-002', 'lesson-devops-003', 'lesson-devops-004', 'lesson-devops-005', 'lesson-devops-006', 'lesson-devops-007', 'lesson-devops-008', 'lesson-devops-009', 'lesson-devops-010', 'lesson-devops-011', 'lesson-devops-012', 'lesson-devops-013',
      'lesson-aws-001', 'lesson-aws-002', 'lesson-aws-003', 'lesson-aws-004', 'lesson-aws-005', 'lesson-aws-006'],
    questions: ['devops-001', 'devops-002', 'devops-003', 'devops-004', 'devops-005', 'devops-006'],
    quizTopics: ['devops'], requires: ['path-08'],
  },
  {
    id: 'path-10', order: 10, phase: 'Senior', title: 'System Design & Architecture', weeks: '22–24',
    goal: 'Phân tích yêu cầu, chọn kiến trúc phù hợp và trình bày trade-off rõ ràng như một Architect.',
    lessons: ['lesson-design-001', 'lesson-design-002', 'lesson-design-003', 'lesson-design-004', 'lesson-design-005'],
    questions: ['design-001', 'design-002', 'design-003', 'design-004', 'design-005', 'architecture-001', 'architecture-002', 'architecture-003'],
    quizTopics: ['design', 'architecture'], requires: ['path-09'],
  },
  {
    id: 'path-11', order: 11, phase: 'Senior', title: 'Microservices & Chuẩn bị phỏng vấn Senior', weeks: '25–26',
    goal: 'Hiểu microservices thực tế, chuẩn bị cho phỏng vấn Senior và tự đánh giá tiến độ tổng thể.',
    lessons: ['lesson-microservices-001', 'lesson-microservices-002', 'lesson-microservices-003', 'lesson-microservices-004', 'lesson-microservices-005',
              'lesson-microservices-006', 'lesson-microservices-007', 'lesson-microservices-008', 'lesson-microservices-009', 'lesson-microservices-010', 'lesson-microservices-011'],
    questions: ['microservices-001', 'microservices-002', 'microservices-003', 'microservices-004', 'microservices-005', 'design-006', 'design-007', 'microservices-006'],
    quizTopics: ['microservices', 'design'], requires: ['path-10'],
  },
  {
    id: 'path-12', order: 12, phase: 'Senior', title: 'Low-Level Design: OOP & design pattern', weeks: '27–28',
    goal: 'Tự thiết kế class cho bài LLD (Parking Lot, Elevator, Undo/Redo…) và giải thích vì sao chọn Strategy, State, Observer hay Command.',
    lessons: ['lesson-architecture-001', 'lesson-architecture-002', 'lesson-architecture-003', 'lesson-architecture-004',
              'lesson-architecture-005', 'lesson-architecture-006', 'lesson-architecture-007', 'lesson-architecture-008', 'lesson-architecture-009', 'lesson-architecture-010'],
    questions: ['architecture-009', 'architecture-010', 'architecture-013', 'architecture-015', 'architecture-016', 'architecture-020'],
    quizTopics: ['architecture'], requires: ['path-11'],
  },
  {
    id: 'path-13', order: 13, phase: 'Senior', title: 'AI Engineering với Claude', weeks: '29–30',
    goal: 'Gọi LLM API an toàn trong Java: vòng lặp agent với tool use, retry đúng cách, ngân sách context và prompt caching.',
    lessons: ['lesson-ai-001', 'lesson-ai-005', 'lesson-ai-006', 'lesson-claude-001', 'lesson-claude-002', 'lesson-claude-003'],
    questions: ['ai-001', 'ai-005', 'ai-008', 'claude-001', 'claude-002', 'claude-004', 'claude-006'],
    quizTopics: ['ai', 'claude'], requires: ['path-12'],
  },
  {
    id: 'path-14', order: 14, phase: 'Senior', title: 'Nghiệp vụ ngân hàng, AI doanh nghiệp & maintain hệ thống lớn', weeks: '31–32',
    goal: 'Nắm nghiệp vụ ngân hàng cốt lõi (core banking, NAPAS, sổ cái kép, idempotency, đối soát), vận hành hệ thống lớn (ITIL, hotfix, release/CAB, CVE, tech debt), áp dụng AI an toàn và bảo mật trong doanh nghiệp.',
    lessons: ['lesson-banking-001', 'lesson-banking-002', 'lesson-banking-003', 'lesson-banking-004', 'lesson-banking-005', 'lesson-banking-006', 'lesson-banking-007', 'lesson-banking-008', 'lesson-banking-009', 'lesson-ai-002', 'lesson-ai-003', 'lesson-ai-004', 'lesson-testing-005'],
    questions: ['banking-003', 'banking-004', 'banking-005', 'ai-026', 'ai-030', 'scenario-093', 'scenario-095', 'scenario-103'],
    quizTopics: ['banking', 'ai'], requires: ['path-13'],
  },
  {
    id: 'path-15', order: 15, phase: 'Senior', title: 'Automation Test với Playwright (tuỳ chọn)', weeks: '33–34',
    goal: 'Nắm nền tảng automation test: kim tự tháp test, locator/wait ổn định, Page Object Model, API automation, mock mạng, chạy song song/sharding, xử lý flaky và visual/contract test với Playwright và JUnit 5.',
    lessons: ['lesson-autotest-001', 'lesson-autotest-002', 'lesson-autotest-003', 'lesson-autotest-004', 'lesson-autotest-005', 'lesson-autotest-006', 'lesson-autotest-007', 'lesson-autotest-008', 'lesson-autotest-009', 'lesson-autotest-010', 'lesson-autotest-011', 'lesson-autotest-012', 'lesson-autotest-013', 'lesson-autotest-014', 'lesson-autotest-015'],
    questions: ['autotest-001', 'autotest-002', 'autotest-004', 'autotest-016', 'autotest-026', 'autotest-032', 'autotest-040', 'autotest-045'],
    quizTopics: ['autotest'], requires: ['path-14'],
  },
];

/*
 * Track 2: Java backend → Platform Engineer (48 tuần, khoảng 8–10 giờ/tuần). Same stage shape as PATH plus
 * `project` (markup: dự án thực hành để đưa vào CV). id 'pf-NN'; lessons may be empty (CI, golden path chưa có bài).
 */
window.PATH_PLATFORM = [
  {
    id: 'pf-01', order: 1, phase: 'Nền tảng', title: 'Linux, mạng và shell cho người làm platform', weeks: '1–4',
    goal: `Platform engineer làm việc hằng ngày với Linux và mạng. Mục tiêu: chẩn đoán được một server "chậm" bằng lệnh, hiểu đường đi của một request (DNS → TCP → TLS → reverse proxy → app), viết script không phá hỏng hệ thống.
- **Học:** process, signal, systemd, quyền và sudo, {{top}}/{{vmstat}}/{{iostat}}/{{ss}}/{{lsof}}, file descriptor, DNS, TCP handshake, TLS, Nginx reverse proxy, bash với {{set -euo pipefail}}.
- **Đạt được:** trả lời được "load average 12 trên máy 4 core nghĩa là gì", "vì sao Too many open files".`,
    lessons: ['lesson-devops-013'],
    questions: ['devops-007', 'devops-057', 'devops-058', 'devops-059', 'devops-060', 'devops-062', 'devops-066', 'devops-082'],
    quizTopics: ['devops'], requires: [],
    project: `**Server tự dựng:** một VM (hoặc WSL/VPS rẻ) chạy service Spring Boot của bạn bằng **systemd** (restart khi lỗi, giới hạn bộ nhớ), **Nginx** đứng trước với TLS (Let's Encrypt), log xoay vòng bằng logrotate, script deploy bash có kiểm tra lỗi và rollback về bản trước. Viết **runbook** cho 3 sự cố: đầy đĩa, CPU 100%, hết file descriptor — mỗi sự cố có lệnh chẩn đoán và cách xử lý. Đưa lên GitHub kèm README.`,
  },
  {
    id: 'pf-02', order: 2, phase: 'Nền tảng', title: 'Docker và JVM trong container', weeks: '5–8',
    goal: `Container là đơn vị cơ bản của mọi nền tảng. Mục tiêu: build image Java nhỏ, an toàn, khởi động nhanh, và hiểu vì sao JVM trong container hay bị OOMKilled.
- **Học:** layer và cache, multi-stage build, image nền (distroless, JRE slim), user không phải root, {{MaxRAMPercentage}}, CPU limit, network và volume, Docker Compose cho môi trường dev.
- **Đạt được:** giải thích được OOMKilled khác OutOfMemoryError, giảm image từ 600MB xuống dưới 200MB.`,
    lessons: ['lesson-devops-001', 'lesson-devops-012'],
    questions: ['devops-001', 'devops-002', 'devops-024', 'devops-026', 'devops-032', 'devops-100', 'devops-113', 'devops-114'],
    quizTopics: ['devops'], requires: ['pf-01'],
    project: `**Container hoá chuẩn:** Dockerfile multi-stage cho service Spring Boot (layered jar, chạy user không phải root, healthcheck), image dưới 200MB, có tag theo git SHA (không dùng latest). **Docker Compose** dựng môi trường dev một lệnh: app + PostgreSQL + Redis + Kafka, có dữ liệu mẫu. Đo và ghi lại: kích thước image trước/sau, thời gian khởi động, bộ nhớ khi chạy với giới hạn 512MB.`,
  },
  {
    id: 'pf-03', order: 3, phase: 'Nền tảng', title: 'CI/CD và cổng chất lượng', weeks: '9–12',
    goal: `Pipeline là "dây chuyền sản xuất" mà platform team cung cấp cho các đội. Mục tiêu: thiết kế pipeline nhanh, an toàn, không cần secret dài hạn.
- **Học:** GitHub Actions/GitLab CI, cache, artifact, test song song, quality gate (Sonar), quét lỗ hổng (Trivy, dependency check), SBOM, OIDC để lấy quyền cloud, trunk-based và versioning.
- **Đạt được:** pipeline PR dưới 10 phút, không có access key trong biến CI.`,
    lessons: [],
    questions: ['devops-010', 'devops-020', 'devops-027', 'devops-031', 'devops-072', 'devops-096', 'devops-099', 'devops-103'],
    quizTopics: ['devops'], requires: ['pf-02'],
    project: `**Pipeline mẫu:** GitHub Actions cho service của bạn: build + unit test + integration test (Testcontainers) + quality gate + quét image (Trivy) + sinh SBOM + push image lên registry, xác thực bằng **OIDC** (không lưu access key). Pipeline tái sử dụng được (reusable workflow) để service khác gọi lại chỉ bằng vài dòng. Ghi lại thời gian pipeline trước/sau khi bật cache và chạy song song.`,
  },
  {
    id: 'pf-04', order: 4, phase: 'Vững vàng', title: 'Kubernetes cốt lõi cho ứng dụng Java', weeks: '13–18',
    goal: `Kubernetes là nền của đa số internal platform. Mục tiêu: deploy service Java không downtime và tự scale, đọc được vì sao Pod Pending, CrashLoopBackOff, OOMKilled.
- **Học:** Pod, Deployment, Service, Ingress, ConfigMap/Secret, probe, requests/limits và QoS, rolling update, HPA, PodDisruptionBudget, graceful shutdown.
- **Đạt được:** rolling update dưới tải mà không có request lỗi; tự chẩn đoán được 5 trạng thái lỗi Pod phổ biến.`,
    lessons: ['lesson-devops-002', 'lesson-devops-006', 'lesson-devops-008', 'lesson-devops-010'],
    questions: ['devops-004', 'devops-005', 'devops-015', 'devops-016', 'devops-067', 'devops-088', 'devops-089', 'devops-091'],
    quizTopics: ['devops'], requires: ['pf-03'],
    project: `**Deploy không downtime:** chạy cluster local (kind hoặc k3d) hoặc EKS nhỏ. Viết manifest cho service: Deployment có probe đúng, requests/limits, preStop, HPA, PDB, Ingress. Chạy **k6** liên tục trong lúc rolling update và chứng minh 0 request lỗi; cố ý gây CrashLoopBackOff và OOMKilled rồi ghi lại cách chẩn đoán bằng {{kubectl describe}}, {{kubectl logs --previous}}, events.`,
  },
  {
    id: 'pf-05', order: 5, phase: 'Vững vàng', title: 'Infrastructure as Code và cloud (AWS)', weeks: '19–24',
    goal: `Platform engineer quản lý hạ tầng bằng code, không bằng click. Mục tiêu: dựng lại toàn bộ môi trường bằng Terraform, hiểu mạng và quyền trên AWS đủ để không mở nhầm cửa.
- **Học:** Terraform (module, state từ xa và khoá, workspace/môi trường, {{prevent_destroy}}), VPC đa AZ, IAM role cho ứng dụng (IRSA/Pod Identity), EKS, RDS, VPC endpoint, chi phí cơ bản.
- **Đạt được:** {{terraform plan}} đọc được và phát hiện "replace" nguy hiểm; không có access key trong ứng dụng.`,
    lessons: ['lesson-aws-001', 'lesson-aws-004', 'lesson-aws-005'],
    questions: ['devops-033', 'devops-049', 'devops-073', 'devops-040', 'aws-003', 'aws-037', 'aws-042', 'aws-047'],
    quizTopics: ['aws', 'devops'], requires: ['pf-04'],
    project: `**Hạ tầng bằng code:** Terraform module cho VPC 3 AZ + EKS + RDS PostgreSQL + ECR; state trên S3 có khoá; tách state theo lớp (mạng, dữ liệu, ứng dụng). Pod đọc S3 bằng IRSA/Pod Identity. Pipeline chạy {{terraform plan}} trên PR và **chặn tự động** nếu có destroy/replace trên tài nguyên quan trọng (Conftest/OPA). Ghi chi phí ước tính mỗi tháng và cách tắt môi trường khi không dùng.`,
  },
  {
    id: 'pf-06', order: 6, phase: 'Vững vàng', title: 'GitOps, Helm và release an toàn', weeks: '25–28',
    goal: `Platform tốt cho các đội deploy nhiều lần mỗi ngày mà vẫn an toàn. Mục tiêu: Git là nguồn sự thật, rollback bằng revert, canary tự động dừng khi lỗi.
- **Học:** Argo CD (app-of-apps, ApplicationSet, sync, drift), Helm chart chung và Kustomize overlay, quản lý secret trong GitOps (External Secrets), Argo Rollouts canary và phân tích tự động.
- **Đạt được:** một bản lỗi tự rollback trong canary mà không ai phải bấm gì.`,
    lessons: ['lesson-devops-003', 'lesson-devops-011'],
    questions: ['devops-041', 'devops-042', 'devops-045', 'devops-052', 'devops-054', 'devops-121', 'devops-133', 'devops-134'],
    quizTopics: ['devops'], requires: ['pf-05'],
    project: `**Đường release GitOps:** repo cấu hình riêng, Argo CD quản lý môi trường dev/prod; **một Helm chart chung** cho mọi service Spring Boot (probe Actuator, JVM options, PDB, ServiceMonitor); secret lấy từ AWS Secrets Manager qua External Secrets. Argo Rollouts canary 10% → 50% → 100% với phân tích tỉ lệ lỗi từ Prometheus: deploy một bản cố ý lỗi và quay video nó tự rollback.`,
  },
  {
    id: 'pf-07', order: 7, phase: 'Vững vàng', title: 'Observability và SLO', weeks: '29–32',
    goal: `Không đo được thì không vận hành được. Mục tiêu: mọi service mới tự có metric, log, trace và cảnh báo theo SLO mà đội không phải tự dựng.
- **Học:** Prometheus + Micrometer, histogram và p99, Grafana, log JSON và Loki, OpenTelemetry và trace context, SLI/SLO, error budget, cảnh báo burn rate đa cửa sổ, chống alert fatigue.
- **Đạt được:** từ biểu đồ p99 bấm sang trace của request chậm; cảnh báo chỉ gọi người khi người dùng bị ảnh hưởng.`,
    lessons: ['lesson-devops-009', 'lesson-devops-014', 'lesson-microservices-005'],
    questions: ['devops-022', 'devops-038', 'devops-104', 'devops-105', 'devops-106', 'devops-110', 'devops-111', 'devops-135'],
    quizTopics: ['devops'], requires: ['pf-06'],
    project: `**Gói observability mặc định:** Prometheus + Grafana + Loki + Tempo (kube-prometheus-stack hoặc Grafana Cloud free tier); service Spring Boot xuất metric, log JSON có traceId, trace qua OTLP. **Dashboard mẫu** dùng chung cho mọi service, **SLO** 99,9% cho một API với cảnh báo burn rate 1h/5m và 6h/30m. Gây lỗi giả lập và chứng minh cảnh báo bắn đúng, tắt đúng.`,
  },
  {
    id: 'pf-08', order: 8, phase: 'Senior', title: 'Bảo mật nền tảng', weeks: '33–36',
    goal: `Platform là nơi đặt các rào chắn bảo mật mặc định cho mọi đội. Mục tiêu: một service bị chiếm không lan sang service khác, và chỉ image đã ký mới chạy được.
- **Học:** RBAC theo namespace/đội, Pod Security Admission, NetworkPolicy mặc định chặn, mTLS và service mesh, quản lý secret và rotation, chuỗi cung ứng (SBOM, ký image, admission policy), phản ứng khi lộ credential.
- **Đạt được:** chứng minh được bằng test rằng pod của team A không gọi được DB của team B.`,
    lessons: ['lesson-devops-016'],
    questions: ['devops-030', 'devops-115', 'devops-118', 'devops-130', 'security-025', 'security-026', 'security-028', 'aws-061'],
    quizTopics: ['devops', 'security'], requires: ['pf-07'],
    project: `**Rào chắn mặc định:** mỗi đội một namespace với RBAC tối thiểu, Pod Security Admission mức restricted, NetworkPolicy default-deny + cho phép tường minh; image ký bằng **cosign** trong pipeline và **Kyverno** chặn image không có chữ ký; secret qua External Secrets với rotation. Viết một bài test tự động chứng minh các rào chắn hoạt động (pod không có quyền bị chặn, image chưa ký bị từ chối).`,
  },
  {
    id: 'pf-09', order: 9, phase: 'Senior', title: 'Độ tin cậy, sự cố và vận hành cluster', weeks: '37–42',
    goal: `Nền tảng phải sống sót qua lỗi node, nâng cấp cluster và sai lầm của con người. Mục tiêu: có runbook đã diễn tập, backup đã khôi phục thử, nâng cấp Kubernetes không làm gián đoạn.
- **Học:** drain node và PDB, nâng cấp phiên bản cluster, Velero backup/restore, HA cho thành phần dữ liệu, chaos engineering, chỉ huy sự cố, postmortem không đổ lỗi.
- **Đạt được:** một buổi game day có bấm giờ và báo cáo kết quả.`,
    lessons: ['lesson-devops-007', 'lesson-devops-015', 'lesson-devops-017'],
    questions: ['devops-029', 'devops-036', 'devops-047', 'devops-064', 'devops-095', 'devops-131', 'devops-142', 'scenario-127'],
    quizTopics: ['devops'], requires: ['pf-08'],
    project: `**Game day:** viết 5 runbook (node chết, pod OOM, DB failover, cert hết hạn, deploy lỗi) và diễn tập từng cái: drain node đang chạy service, xoá pod ngẫu nhiên (chaos), khôi phục namespace từ **Velero** sang cluster khác, nâng cấp cluster lên phiên bản minor tiếp theo trong lúc k6 chạy. Ghi lại thời gian phục hồi thực tế và viết một postmortem mẫu.`,
  },
  {
    id: 'pf-10', order: 10, phase: 'Senior', title: 'Platform như một sản phẩm: golden path và IDP', weeks: '43–48',
    goal: `Platform Engineering khác DevOps ở chỗ coi nền tảng là **sản phẩm cho developer**: đo trải nghiệm, giảm thời gian từ ý tưởng đến production. Mục tiêu: một developer tạo service mới chạy được trên production trong một buổi sáng.
- **Học:** golden path / paved road, Internal Developer Portal (Backstage: software template, catalog, TechDocs), chỉ số DORA, đo trải nghiệm dev (khảo sát, thời gian onboard), multi-tenant cluster, chi phí theo đội, viết tài liệu và thuyết phục các đội dùng nền tảng.
- **Đạt được:** hồ sơ đủ để ứng tuyển Platform Engineer / DevOps mid–senior, và một câu chuyện STAR có số liệu về nền tảng bạn dựng.`,
    lessons: [],
    questions: ['devops-011', 'devops-023', 'devops-048', 'devops-055', 'devops-075', 'devops-119', 'devops-126', 'devops-127'],
    quizTopics: ['devops'], requires: ['pf-09'],
    project: `**Mini IDP:** Backstage (hoặc một CLI/template repo nếu muốn gọn) với template "Spring Boot service mới": tạo repo có sẵn Dockerfile, pipeline từ chặng 3, Helm values dùng chart chung, Argo CD application, dashboard và SLO từ chặng 7, rào chắn từ chặng 8, tài liệu TechDocs. Đo **thời gian từ lúc bấm tạo tới lúc service chạy trên môi trường dev** (mục tiêu dưới 30 phút) và viết case study một trang cho CV: vấn đề, thiết kế, con số trước/sau.`,
  },
];
