# T2410 — Dữ liệu lộ trình 20 tuần theo JD (window.JD_PLAN)

Status: DONE
Agent: kilo
Owns: `js/data/roadmap.js`

Người dùng phỏng vấn 2 JD sau ~5 tháng (giữa 04/2027): **VPBankS** Backend Java (Spring Boot, PostgreSQL/Oracle, Kafka, SOLID, CTDL&GT, CI/CD/Docker/K8s) và **VinSmart Future** Senior (event processing, workflow orchestration/task lifecycle, retry/DLQ, Kafka/RabbitMQ, NoSQL/cache, tracing/monitoring, incident RCA, security, tích hợp AI inference). Xem `tasks/T2409-companies-vpbanks-vinsmart.md` để biết chi tiết JD.

**Chỉ THÊM ở CUỐI file** `js/data/roadmap.js` một object mới `window.JD_PLAN = { … };` — KHÔNG sửa `window.ROADMAP`. Schema GIỐNG HỆT ROADMAP (đọc 60 dòng đầu file): `goal`, `targets` (2 mục: VPBankS, VinSmart Future với `examples`, `focus[]`), `project` (`name`, `desc`: dự án portfolio "Task/Order workflow service": Spring Boot 3 + PostgreSQL + Kafka + Redis, state machine, outbox, retry/DLQ, OpenTelemetry), `phases[]` → `weeks[]` với `id` **'j01'..'j20'** (KHÁC 'w..' để không đụng tiến độ cũ), `title`, `topics[]` (id có thật trong js/data/topics.js), `algo`, `tasks[]` (3–5 việc cụ thể, đo được, có gắn route app: #/bank, #/learn, #/algo, #/labs, #/bugs, #/sdlc, #/mock, #/interview, #/companies).

Khung 20 tuần (bắt buộc theo):
- Tuần 1–3: Java core, collections, concurrency, JVM/GC.
- Tuần 4–5: Spring internals (IoC, AOP/proxy, @Transactional), Spring Security/JWT.
- Tuần 6–8: SQL & DB: index, EXPLAIN, isolation, MVCC, locking, deadlock, N+1, Oracle vs PostgreSQL, partitioning.
- Tuần 9–10: Kafka/RabbitMQ: ordering, consumer group, retry/DLQ, idempotent consumer, outbox.
- Tuần 11–12: Microservices: saga, circuit breaker, API contract, workflow orchestration, task lifecycle/escalation.
- Tuần 13–14: System design: đặt lệnh chứng khoán, notification/webhook, task routing (nguồn thêm: https://designed-to-scale.vercel.app/#/hld-lld/1).
- Tuần 15: DevOps & observability: Docker, K8s, CI/CD, OpenTelemetry, metrics/alert, incident RCA.
- Tuần 16–17: ôn SRS, 5 câu chuyện STAR, CV theo 2 JD, nghiệp vụ chứng khoán.
- Tuần 18–20: mock theo công ty 2–3 buổi/tuần + phỏng vấn tiếng Anh; tuần 20 = tuần phỏng vấn.
- Thuật toán song song mọi tuần (field `algo`, 3–4 bài/tuần, pattern tăng dần).

## Luật
AGENTS.md. Không backtick, không ký hiệu đô-la + ngoặc nhọn. Tiếng Việt, thuật ngữ giữ tiếng Anh. Không commit. KHÔNG sửa đặc tả file task này.

## Nghiệm thu
`node --check js/data/roadmap.js`; `node -e "global.window={};require('./js/data/roadmap.js');const p=window.JD_PLAN;const w=p.phases.flatMap(x=>x.weeks);if(w.length!==20)throw w.length;console.log('ok',w.map(x=>x.id).join(','))"`; `node scripts/validate.js` → OK. Status: DONE + Notes.

## Notes
Đã thêm `window.JD_PLAN` vào cuối `js/data/roadmap.js` theo schema giống `window.ROADMAP`. Cấu trúc: `goal`, `targets` (2 mục: VPBankS, VinSmart Future), `project` (Task/Order Workflow Service), `phases` 6 giai đoạn chứa 20 tuần (`j01`–`j20`). Mỗi tuần có `title`, `topics[]` (id có thật trong topics.js), `algo` (3–4 bài/tuần, pattern tăng dần), `tasks[]` (3–5 việc cụ thể gắn route app). Kiểm tra: `node --check js/data/roadmap.js` OK; `node -e "..."` xác nhận 20 tuần id đúng. `validate.js` báo lỗi `quiz-ccap-2.js` (lỗi cú pháp có sẵn, không liên quan) và `index-light.js` cũ (build bị chặn bởi lỗi quiz-ccap-2.js).
Reviewed-by: verify-only (code/UI task)
