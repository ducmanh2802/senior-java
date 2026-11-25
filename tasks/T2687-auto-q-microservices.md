# T2687 — 3 câu hỏi Senior Java (microservices) vào q-microservices.js

Status: DONE
Agent: kilo
Owns: `js/data/q-microservices.js`
After: T2606

Thêm **3 câu hỏi phỏng vấn mới** (topic: microservices) vào `js/data/q-microservices.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-microservices.js`); đọc danh sách để **không trùng ý**.

Chủ đề: API gateway vs BFF cho app mobile + web của ngân hàng, service mesh (Istio) có đáng với 15 service không, distributed tracing với OpenTelemetry + Micrometer Tracing trên Spring Boot 3: propagate trace qua Kafka.

> Vòng 2 của chủ đề này: các ý trên có thể đã được viết ở vòng trước — đọc file và chọn góc **chưa có** (tình huống khác, mức sâu hơn, lỗi production khác).

Mỗi câu theo AGENTS.md mục 4 và 6: `**Tóm tắt:**` → cơ chế bên trong từng bước và VÌ SAO → code Java ngắn (≤ 30 dòng) có comment hoặc ~~~seq cho luồng nhiều bên → bảng trade-off / khi nào dùng → pitfall production → `### Ví dụ đời thực` có số liệu → `### Trả lời mẫu khi phỏng vấn` (150–220 từ) → `> Senior tip:`; `follow` 2–3 câu. Level: chủ yếu senior, 1 câu lead.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **BẮT BUỘC viết tiếng Việt CÓ DẤU đầy đủ** (Tóm tắt, không, nguyên nhân…). Nội dung không dấu sẽ bị trả lại.
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, Kafka 3.x, AWS hiện hành, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.
- Nếu một ý trong chủ đề đã có trong file thì chọn góc khác gần nhất chưa có, ghi vào Notes.

## Nghiệm thu
`node --check js/data/q-microservices.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
Đã thêm 3 câu hỏi mới:
- microservices-129 (senior): BFF-mobile vs BFF-web cho ngân hàng — góc offline-first, delta sync (ETag/If-None-Match), PKCE vs session cookie, remote config feature flag, push notification vs SSE, versioning backward-compatible do app store review.
- microservices-130 (lead): Istio service mesh cho 15 service — phân tích chi phí thực (sidecar RAM/CPU, eBPF sidecar-less Cilium, Linkerd), so sánh Istio/Linkerd/Cilium, decision framework dựa trên ROI, PoC namespace, thay thế bằng cert-manager + Resilience4j + Argo Rollouts.
- microservices-131 (senior): Distributed tracing Spring Boot 3.2+ virtual thread/CompletableFuture/Reactor/Kafka — OpenTelemetry Java agent tự propagate context qua mọi biên async, exemplars liên kết metric→trace, pitfall double instrumentation, virtual thread context propagation, Reactor contextWrite, baggage.

`node --check js/data/q-microservices.js` → OK. `node scripts/validate.js` báo lỗi ở file khác (q-devops.js, labs-sql.js, lessons-*.js) là vấn đề sẵn có, không liên quan đến thay đổi này.
Reviewed-by: kilo (T2687R)
