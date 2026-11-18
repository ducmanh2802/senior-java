# T2409 — Thêm 2 công ty: VPBank Securities (VPBankS) và VinSmart Future

Status: DONE
Agent: kilo
Owns: `js/data/companies.js`
After: T1455

Người dùng sắp phỏng vấn 2 JD dưới đây (sau ~5 tháng). Thêm ĐÚNG 2 object mới vào `window.COMPANIES`, cùng schema với `vpbank` (id, name, type, icon, summary, stack, process, focus, algoWeight, englishRequired, questions, tips, pay, sources, confidence). KHÔNG đọc cả file: xem object `vpbank` (quanh dòng 57) làm mẫu, rồi thêm trước dòng `);`/`]` cuối.

## JD 1 — id `vpbank-securities`, "Chứng khoán VPBank (VPBankS)", type bank/securities
Backend Developer (Java, Spring Boot, PostgreSQL), Hà Nội, onsite, T2–T6. Kỹ năng: Java, Oracle, Kafka, CI/CD, PostgreSQL, Spring Boot.
Yêu cầu: ≥5 năm Java backend (Chuyên viên cao cấp); CTDL & giải thuật; design pattern, SOLID; JDK 8+, Spring Boot 2.x+, Spring 5+; PostgreSQL, Oracle; ưu tiên CI/CD, Docker, K8s, Kafka; đọc tài liệu tiếng Anh tốt.
Nguồn: https://itviec.com/viec-lam-it/backend-developer-java-spring-boot-postgresql-cong-ty-co-phan-chung-khoan-vpbank-4104
Trọng tâm câu hỏi nên gắn: hệ thống giao dịch chứng khoán (đặt lệnh, khớp lệnh, T+2, sổ lệnh), idempotency, transaction/isolation & locking (Oracle vs PostgreSQL), Kafka ordering, CTDL/thuật toán, SOLID/pattern, Spring internals.

## JD 2 — id `vinsmart-future`, "VinSmart Future", type product/AI
Senior Software Developer (Java/Python), Hà Nội (Ocean Park), onsite, T2–T7 (T7 WFH).
Trách nhiệm: event processing, workflow orchestration, task lifecycle (routing, prioritization, assignment, escalation); API data contract; ingestion pipeline, async processing, message queue, retry, fault-tolerant error handling; webhook/push notification/3rd-party; logging, audit trail, distributed tracing, monitoring/alerting; tối ưu latency/throughput; data model, caching, transaction; incident response + RCA; security (authn/authz, audit); tích hợp kết quả AI/ML inference; mentor junior.
Yêu cầu: ≥4 năm; REST, async; Kafka/RabbitMQ; RDBMS + 1 NoSQL/distributed cache; microservices, distributed systems, concurrency; Docker, CI/CD, monitoring; troubleshooting/performance.
Nguồn: https://itviec.com/viec-lam-it/senior-software-developer-java-python-vinsmart-future-2527

## Cách làm
- `questions`: mỗi công ty 12–15 id câu hỏi CÓ THẬT trong ngân hàng, chọn bằng `node scripts/qtool.js list <topic>` / grep id (không bịa id). validate sẽ báo id không tồn tại.
- `process`: chỉ ghi điều có trong JD; phần còn lại ghi rõ "chưa có review công khai, mẫu chung" (confidence thấp). KHÔNG bịa quy trình, lương, review.
- `sources`: chỉ 2 link ITviec ở trên (+ trang công ty trên itviec nếu chắc chắn tồn tại).

## Luật
AGENTS.md. Chỉ THÊM, không sửa/xoá công ty cũ, không backtick, không ký hiệu đô-la + ngoặc nhọn. Không commit. KHÔNG sửa đặc tả file task này.

## Nghiệm thu
`node --check js/data/companies.js`, `node scripts/build-light-index.js`, `node scripts/validate.js` → OK. Status: DONE + ghi số công ty trước/sau vào Notes.

## Notes
Đã thêm 2 công ty mới: `vpbank-securities` (VPBank Securities) và `vinsmart-future` (VinSmart Future). Số công ty trước: 41, sau: 43. Mỗi công ty có 14 câu hỏi tham chiếu từ ngân hàng câu hỏi hiện có (banking, concurrency, microservices, scenario, security, ai, spring, db). Validate không báo lỗi cho 2 công ty mới (lỗi validate hiện tại là lỗi có sẵn trong quiz-ccap-2.js và labs-incident.js, không liên quan đến thay đổi này).
Reviewed-by: verify-only (code/UI task)
