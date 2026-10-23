# T55 — Nội dung: REST API & Web

Status: DONE
Agent: opencode
Owns: `js/data/q-api.js`

> **Ghi theo lô nhỏ:** thêm **2 câu mỗi lần edit** (đáp án dài). Sau mỗi lô chạy `node --check <file>` và `node scripts/validate.js <file>`.


> **Đợt 3 — câu HAY GẶP NHẤT** khi phỏng vấn ngân hàng (Techcombank, VPBank, MB, BIDV, VIB…) và big tech VN (Shopee, Grab, MoMo, ZaloPay, VNG…). Nhiều câu ở mức cơ bản/kinh điển: đáp án phải giúp người học **trả lời gọn, đúng trọng tâm như ứng viên giỏi** (mở bằng câu trả lời 30 giây), sau đó mới đào sâu những gì interviewer Senior hay vặn tiếp. Ghi rõ các **câu trả lời sai phổ biến** của ứng viên.

Đọc kỹ `AGENTS.md` mục 4–6 (schema, markup, **chuẩn chất lượng**) trước khi viết.

## Mục tiêu
Ngân hàng câu hỏi đã có sẵn câu ở các topic dưới đây. **Chỉ THÊM câu mới vào cuối mảng**, không sửa/xoá câu cũ.
File đang rỗng: ID bắt đầu từ `api-001`.
**Đọc lướt câu hỏi đã có trong file trước** để không viết trùng ý.

### topic `api`: thêm 14 câu (đang có ~0 → mục tiêu ≥ 14)
- HTTP method: safe vs idempotent; PUT vs PATCH vs POST — khi nào dùng cái nào, ví dụ API tài khoản
- Chọn HTTP status code đúng: 200/201/202/204, 400 vs 422, 401 vs 403, 404, 409, 429, 500 vs 502 vs 503 vs 504
- Thiết kế resource REST: đặt tên, nested resource, filter/sort/pagination param, response phân trang (page vs cursor)
- Luồng một request trong Spring MVC: DispatcherServlet, HandlerMapping, HandlerAdapter, HttpMessageConverter, exception resolver
- Filter vs HandlerInterceptor vs AOP: thứ tự chạy, mỗi cái hợp với việc gì (log, auth, MDC traceId, đo thời gian)
- {{@RequestParam}} vs {{@PathVariable}} vs {{@RequestBody}} vs {{@ModelAttribute}}; validate input và trả lỗi chuẩn
- CORS: preflight hoạt động thế nào, vì sao chỉ trình duyệt chặn, cấu hình đúng trong Spring Security
- Session/cookie vs token: lưu token ở cookie HttpOnly hay localStorage; stateless có thật sự stateless
- ETag và conditional request ({{If-None-Match}}, {{If-Match}}): cache và chống lost update qua API
- Tác vụ chạy lâu qua API: 202 Accepted + polling/callback/webhook thay vì giữ request
- Thiết kế webhook gửi cho đối tác: ký HMAC, retry với backoff, idempotency, thứ tự
- Tomcat embedded trong Spring Boot: max threads, accept-count, connection timeout; vì sao request treo ở tầng này
- REST vs gRPC vs GraphQL: chọn cái nào cho mobile app, cho service nội bộ, cho đối tác ngoài
- API-first với OpenAPI (springdoc, generator): contract trước code, review thay đổi API

## Yêu cầu chất lượng (quan trọng nhất)
- Mỗi đáp án **1500–4000 ký tự**: `**Tóm tắt:**` trả lời miệng 30 giây, rồi các mục `###` giải thích cơ chế **và vì sao**, ví dụ code ngắn có comment, bảng trade-off, pitfall production, kết bằng `> Senior tip:`.
- Câu hỏi theo kiểu phỏng vấn thật (tình huống, so sánh, "bạn sẽ làm gì"), không hỏi định nghĩa suông. Bối cảnh ưu tiên ngân hàng, fintech, e-commerce Việt Nam.
- Đúng kỹ thuật với Java 17/21, Spring Boot 3.x, Hibernate 6. **Không bịa API, flag hay số liệu**; không chắc thì viết ít lại nhưng đúng.
- `follow`: 2–3 câu hỏi đào sâu. Level xen kẽ: khoảng 25% mid, 55% senior, 20% lead.

## Nghiệm thu
`node scripts/validate.js` → OK và số câu mỗi topic đạt mục tiêu. Integrator sẽ fact-check sau.

## Notes
Đã thêm 14 câu hỏi cho topic `api` (api-001 đến api-014), bao gồm:
1. Safe vs Idempotent method, PUT vs PATCH vs POST trong banking
2. HTTP status code selection (201, 202, 400, 422, 401, 403, 409, 429, 502/503/504)
3. REST resource design: naming, nested, filter/sort/pagination (page vs cursor)
4. Spring MVC request flow: DispatcherServlet, HandlerMapping, HandlerAdapter, HttpMessageConverter, ExceptionResolver
5. Filter vs HandlerInterceptor vs AOP: execution order, use cases (MDC, auth, timing)
6. @RequestParam vs @PathVariable vs @RequestBody vs @ModelAttribute, validation & RFC 7807 ProblemDetail
7. CORS preflight, browser enforcement, Spring Security 6 config
8. Session/cookie vs JWT, HttpOnly cookie, refresh token rotation, stateless myth
9. ETag & conditional requests (If-None-Match, If-Match) cho cache & optimistic locking
10. Long-running tasks: 202 Accepted + polling vs webhook, Spring Boot @Async implementation
11. Partner webhook design: HMAC, exponential backoff retry, idempotency, ordering, outbox pattern
12. Tomcat embedded config: maxThreads, acceptCount, connectionTimeout, virtual threads, troubleshooting
13. REST vs gRPC vs GraphQL: khi nào dùng cái nào cho mobile, internal service, partner
14. API-first với OpenAPI: springdoc, generator, contract test, CI breaking change detection

Tất cả đáp án ≥1500 ký tự, có **Tóm tắt**, các mục `###` giải thích cơ chế, code ví dụ, bảng trade-off, `> Senior tip:`. Level xen kẽ: 3 mid, 8 senior, 3 lead. `node scripts/validate.js` → OK.
Reviewed-by: codex (T55R)
Verify-failed: legacy — đã commit từ trước, autopilot bỏ qua
