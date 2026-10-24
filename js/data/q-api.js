/* Câu hỏi topic `api`. Schema & markup: AGENTS.md mục 4–6. */
(window.QUESTIONS = window.QUESTIONS || []).push(
  {
    id: 'api-001',
    topic: 'api',
    level: 'mid',
    q: 'Safe method và idempotent method khác nhau như thế nào? Cho ví dụ PUT vs PATCH vs POST trong API chuyển tiền ngân hàng.',
    a: `**Tóm tắt:** Safe method (GET, HEAD, OPTIONS) không thay đổi trạng thái server; idempotent method (GET, PUT, DELETE, HEAD, OPTIONS) cho kết quả giống nhau khi gọi nhiều lần. POST không safe cũng không idempotent; PUT idempotent thay thế toàn bộ resource; PATCH không idempotent (thường) vì cập nhật một phần.

### Safe vs Idempotent
- **Safe**: Không làm thay đổi representation của resource trên server. GET /accounts/123 an toàn, có thể cache, pre-fetch.
- **Idempotent**: Gọi n lần (n≥1) cho hiệu ứng giống gọi 1 lần. PUT /accounts/123 {balance: 1000} gọi 10 lần vẫn balance = 1000. DELETE idempotent: xóa rồi xóa lại vẫn 404/204.

### PUT vs PATCH vs POST trong chuyển tiền
| Method | Idempotent? | Dùng khi nào | Ví dụ ngân hàng |
|--------|-------------|--------------|-----------------|
| POST | Không | Tạo resource mới, hoặc action không idempotent | POST /transfers {from: A, to: B, amount: 500} — gọi 2 lần = chuyển 2 lần |
| PUT | Có | Thay thế toàn bộ resource (client nắm full state) | PUT /accounts/A {balance: 5000, currency: VND} — gọi nhiều lần vẫn 5000 |
| PATCH | Thường không | Cập nhật một phần, delta | PATCH /accounts/A {balance: -500} (trừ tiền) — gọi 2 lần trừ 2 lần |

### Pitfall production
- POST cho action cần chống trùng (ví dụ "đặt hàng") mà không có cơ chế dedup → user bấm nút 2 lần = 2 đơn hàng. Giải pháp: client gửi **Idempotency-Key** header, server deduplicate.
- JSON Merge Patch (RFC 7396) thay **nguyên** giá trị (kể cả array) nên thường idempotent. JSON Patch (RFC 6902) thì không chắc: op "add" với path kết thúc bằng "/-" (append vào array) gọi 2 lần sẽ thêm 2 phần tử. Dùng op "test" làm điều kiện trước khi sửa nếu cần an toàn.

> Senior tip: Trong ngân hàng, mọi giao dịch tài chính **bắt buộc** idempotent. Thiết kế API chuyển tiền dùng POST + Idempotency-Key (UUID do client sinh), server lưu key + kết quả trong Redis TTL 24h. Trả 409 nếu key trùng với request đang xử lý.`,
    follow: [
      'Làm sao để đảm bảo idempotency cho POST /transfers khi client timeout và retry?',
      'Tại sao PUT thay thế toàn bộ resource thay vì merge? Trade-off gì so với PATCH?'
    ],
    tags: ['HTTP', 'Idempotency', 'Banking']
  },
  {
    id: 'api-002',
    topic: 'api',
    level: 'senior',
    q: 'Chọn HTTP status code phù hợp cho các trường hợp: tạo thành công, chấp nhận xử lý bất đồng bộ, validation lỗi, unauthorized vs forbidden, conflict, rate limit, gateway timeout.',
    a: `**Tóm tắt:** 201 Created (tạo thành công, có Location header), 202 Accepted (bất đồng bộ), 400 (cú pháp sai), 422 (cú pháp đúng mà semantic sai), 401 (chưa auth), 403 (đã auth nhưng thiếu quyền), 409 (conflict state), 429 (rate limit), 502/503/504 (lỗi upstream/gateway).

### Chi tiết từng mã
| Mã | Tên | Khi nào dùng | Header quan trọng |
|----|-----|--------------|-------------------|
| 201 | Created | POST tạo resource mới | Location: /resource/{id} |
| 202 | Accepted | Nhận request, xử lý nền (batch, webhook) | Retry-After, hoặc Link: status endpoint |
| 204 | No Content | Thành công nhưng không body (DELETE, PUT cập nhật) | — |
| 400 | Bad Request | JSON malformed, missing required field, type mismatch | — |
| 422 | Unprocessable Content (tên cũ: Unprocessable Entity) | Cú pháp OK nhưng business rule fail (số dư không đủ, email trùng) | Content-Type: application/problem+json (RFC 9457, thay RFC 7807) |
| 401 | Unauthorized | Thiếu/invalid token, session hết hạn | WWW-Authenticate: Bearer realm="api" |
| 403 | Forbidden | Token hợp lệ nhưng role/permission không đủ | — |
| 404 | Not Found | Resource không tồn tại (cũng dùng che giấu 403) | — |
| 409 | Conflict | Version conflict (optimistic lock), duplicate unique key | ETag, Retry-After |
| 429 | Too Many Requests | Vượt quota, rate limit | Retry-After, X-RateLimit-* |
| 500 | Internal Server Error | Bug code, DB down, unhandled exception | — |
| 502 | Bad Gateway | Proxy nhận response invalid từ upstream | — |
| 503 | Service Unavailable | Overload, maintenance, circuit breaker open | Retry-After |
| 504 | Gateway Timeout | Upstream không kịp phản hồi trong timeout | — |

### Sai phổ biến
- Dùng 400 cho validation business logic → client không phân biệt được lỗi format vs logic. Dùng **422** (RFC 7807 ProblemDetail).
- Dùng 401 cho "không đủ quyền" → client nhầm tưởng token hết hạn mà refresh mãi. Phân biệt rõ 401 vs 403.
- Trả 500 cho downstream timeout → monitoring không phân biệt lỗi mình hay đối tác. Dùng 504.

> Senior tip: Spring Boot 3.x có **ProblemDetail** (RFC 7807) sẵn: {{throw new ErrorResponseException(HttpStatus.UNPROCESSABLE_ENTITY, ProblemDetail.forStatusAndDetail(HttpStatus.UNPROCESSABLE_ENTITY, "Số dư không đủ"), null)}}. Bật {{spring.mvc.problemdetails.enabled=true}} để cả exception mặc định của Spring MVC cũng trả ProblemDetail. Client parse {{type}}, {{title}}, {{detail}}, {{instance}} thống nhất.`,
    follow: [
      'Khi nào trả 202 thay vì 201? Client poll status như thế nào?',
      'Thiết kế response error thống nhất cho toàn hệ thống microservice?'
    ],
    tags: ['HTTP Status', 'Error Handling', 'RFC 7807']
  },
  {
    id: 'api-003',
    topic: 'api',
    level: 'mid',
    q: 'Thiết kế REST resource cho API tài khoản ngân hàng: đặt tên resource, nested resource, filter/sort/pagination params, và response phân trang (page-based vs cursor-based).',
    a: `**Tóm tắt:** Resource dùng danh từ số nhiều (/accounts, /transactions), nested cho quan hệ chặt (/accounts/{id}/transactions), query param cho filter/sort/page. Page-based (page, size) đơn giản nhưng không ổn định khi data thay đổi; cursor-based (after, limit) ổn định, phù hợp feed real-time.

### Quy tắc đặt tên
- **Collection**: {{/accounts}}, {{/customers}}, {{/transactions}} (số nhiều, kebab-case)
- **Single**: /accounts/{accountId}
- **Nested**: /accounts/{accountId}/transactions (chỉ khi transaction không tồn tại độc lập). Tránh nesting > 2 cấp.
- **Action/Non-CRUD**: Dùng sub-resource hoặc custom endpoint: {{POST /transfers}}, POST /accounts/{id}/freeze

### Query parameters chuẩn
| Loại | Param | Ví dụ |
|------|-------|-------|
| Filter | {{field=value}}, {{field[op]=value}} | {{status=ACTIVE}}, {{amount[gte]=1000}}, {{createdAt[between]=2024-01-01,2024-12-31}} |
| Sort | {{sort=field,-field}} | {{sort=-createdAt,amount}} |
| Page-based | {{page}}, {{size}} | {{page=0&size=20}} (0-indexed) |
| Cursor-based | {{after}}, {{before}}, {{limit}} | {{after=eyJpZCI6MTIzfQ==&limit=20}} (opaque cursor) |

### Response phân trang
~~~json
// Page-based (Spring Data Page)
{
  "content": [...],
  "pageable": {"pageNumber":0,"pageSize":20,"sort":{"sorted":true}},
  "totalElements": 1500,
  "totalPages": 75,
  "first": true,
  "last": false
}

// Cursor-based (GitHub/Stripe style)
{
  "data": [...],
  "pagination": {"next_cursor": "eyJpZCI6MTIzfQ==", "has_more": true}
}
~~~

### Trade-off
| Tiêu chí | Page-based | Cursor-based |
|----------|------------|--------------|
| Implementation | Đơn giản (OFFSET/LIMIT) | Cần index + encoding cursor |
| Stable khi insert/delete | Không (item shift) | Có (cursor trỏ đến record) |
| Random access | Có (nhảy trang) | Không (chỉ next/prev) |
| Total count | Có | Tốn query COUNT(*) |
| Phù hợp | Admin, dashboard | Feed, mobile infinite scroll |

> Senior tip: Ngân hàng dùng **cursor-based cho statement/transaction history** (hàng triệu dòng, insert liên tục). Page-based cho admin quản lý user (cần total count, nhảy trang). Luôn set {{max page size ≤ 100}} chống DoS.`,
    follow: [
      'Làm sao filter theo khoảng ngày hiệu quả trên bảng transaction 100M rows?',
      'Cursor opaque vs transparent: ưu nhược điểm bảo mật?'
    ],
    tags: ['REST Design', 'Pagination', 'Banking']
  },
  {
    id: 'api-004',
    topic: 'api',
    level: 'senior',
    q: 'Mô tả luồng một HTTP request trong Spring MVC: DispatcherServlet, HandlerMapping, HandlerAdapter, HttpMessageConverter, ExceptionResolver. Điểm nào thường gây bottleneck?',
    a: `**Tóm tắt:** Request → DispatcherServlet → HandlerMapping (tìm controller + interceptor) → HandlerAdapter (resolve argument – dùng HttpMessageConverter đọc body, gọi method, ghi return value – lại qua HttpMessageConverter cho @ResponseBody) → View (nếu có) → HandlerExceptionResolver (nếu lỗi). HttpMessageConverter được gọi **bên trong** bước HandlerAdapter, không phải một bước riêng sau đó. Bottleneck thường ở: message converter (JSON lớn), synchronous DB call, thread pool exhausted.

### Chi tiết luồng
~~~text
HTTP Request
    │
    ▼
DispatcherServlet (Front Controller)
    │
    ├──► HandlerMapping (RequestMappingHandlerMapping)
    │      └─ Tìm @RequestMapping match → HandlerExecutionChain (controller + interceptors)
    │
    ├──► HandlerAdapter (RequestMappingHandlerAdapter)
    │      ├─ Resolve @RequestParam, @PathVariable, @RequestBody, @ModelAttribute
    │      ├─ Gọi Controller method
    │      └─ Xử lý return value → ModelAndView / ResponseBody
    │
    ├──► HttpMessageConverter (MappingJackson2HttpMessageConverter)
    │      ├─ Request: JSON → Java object (read)
    │      └─ Response: Java object → JSON (write)
    │
    ├──► ViewResolver (nếu trả view) / ResponseBodyEmitter (streaming)
    │
    └──► ExceptionResolver (HandlerExceptionResolver)
           └─ @ExceptionHandler, @ControllerAdvice, DefaultHandlerExceptionResolver
~~~

### Các thành phần then chốt
| Component | Interface | Implement chính | Vai trò |
|-----------|-----------|-----------------|---------|
| HandlerMapping | {{HandlerMapping}} | {{RequestMappingHandlerMapping}} | Map URL → controller method |
| HandlerAdapter | {{HandlerAdapter}} | {{RequestMappingHandlerAdapter}} | Invoke controller, resolve args |
| MessageConverter | {{HttpMessageConverter}} | {{MappingJackson2HttpMessageConverter}} | Serialize/deserialize body |
| ExceptionResolver | {{HandlerExceptionResolver}} | {{ExceptionHandlerExceptionResolver}} | Map exception → response |

### Bottleneck phổ biến & fix
1. **Jackson serialization lớn**: Response 10MB+ block thread. Fix: Streaming ({{ResponseBodyEmitter}}, {{SseEmitter}}), pagination, projection (DTO).
2. **Sync DB call trong controller**: Block Tomcat thread. Fix: Reactive (WebFlux), @Async + CompletableFuture, virtual thread (Java 21).
3. **HandlerInterceptor chain dài**: Pre-handle lặp. Fix: Gom log, MDC vào 1 interceptor; tránh logic nặng.
4. **ArgumentResolver custom nhiều**: Mỗi request resolve lại. Fix: Cache resolution, dùng @ModelAttribute binding sẵn.

> Senior tip: Spring Boot 3.2+ trên Java 21 bật **virtual threads** ({{spring.threads.virtual.enabled=true}}) — Tomcat thread không còn bottleneck cho I/O blocking. Nhưng JSON serialization là việc CPU-bound: virtual thread không làm nó nhanh hơn và vẫn chiếm carrier thread trong lúc chạy, nên vẫn cần projection/streaming cho payload lớn.`,
    follow: [
      'HandlerInterceptor vs Filter: thứ tự chạy, khi nào dùng cái nào?',
      'Cách custom HttpMessageConverter để hỗ trợ format riêng (protobuf, CBOR)?'
    ],
    tags: ['Spring MVC', 'DispatcherServlet', 'Performance']
  },
  {
    id: 'api-005',
    topic: 'api',
    level: 'senior',
    q: 'So sánh Filter vs HandlerInterceptor vs AOP trong Spring Boot: thứ tự chạy, mỗi cái phù hợp việc gì (log request/response, auth, MDC traceId, đo thời gian)?',
    a: `**Tóm tắt:** Filter (Servlet container) chạy đầu tiên, bao trùm toàn bộ request/response; HandlerInterceptor (Spring MVC) chạy sau HandlerMapping, có truy cập handler/controller; AOP (Spring proxy) chạy trong bean, gần business logic nhất. Dùng Filter cho cross-cutting ở tầng thấp (CORS, encoding, MDC init), Interceptor cho logic MVC (auth check, timing), AOP cho business logic (transaction, retry, audit).

### Thứ tự thực thi (inbound → outbound)
~~~text
Request
  │
  ▼
┌─ Filter Chain (web.xml / FilterRegistrationBean)
│    ├─ Filter#doFilter PRE  (CharacterEncodingFilter, CorsFilter, OncePerRequestFilter)
│    │
│    ▼
│  DispatcherServlet
│    │
│    ▼
│  HandlerMapping → HandlerExecutionChain
│    │
│    ▼
┌─ HandlerInterceptor Chain (mvcInterceptor)
│    ├─ preHandle()          ← có thể return false để dừng chain
│    │
│    ▼
│  HandlerAdapter → Controller (AOP proxy wraps bean)
│    │                         ├─ @Before advice
│    │                         ├─ Controller method
│    │                         └─ @After/@AfterReturning/@Around
│    │
│    ▼
│  postHandle()              ← ModelAndView available
│    │
│    ▼
│  View rendering / ResponseBody
│    │
│    ▼
│  afterCompletion()         ← exception available, cleanup
│    │
└─ Filter#doFilter POST      ← response committed
  │
  ▼
Response
~~~

### So sánh chi tiết
| Tiêu chí | Filter | HandlerInterceptor | AOP (@Aspect) |
|----------|--------|-------------------|---------------|
| Phạm vi | Toàn bộ web app (static, error, actuator) | Chỉ request qua DispatcherServlet | Chỉ Spring bean được proxy |
| Truy cập | ServletRequest/Response | HttpServletRequest/Response, Handler, ModelAndView | Method args, return value, target object |
| Thứ tự | Order/ @Order / FilterRegistrationBean | Order / addInterceptors(order) | @Order / @DeclarePrecedence |
| Exception handling | try-catch trong doFilter | afterCompletion(ex) | @AfterThrowing / @Around try-catch |
| Async support | AsyncListener / Servlet 3.0+ | AsyncHandlerInterceptor | @Async method / CompletableFuture |
| Performance | Rất nhẹ, ít overhead | Nhẹ, có handler context | Overhead proxy (CGLIB/JDK) |

### Use case mapping
| Việc cần làm | Lựa chọn tốt nhất | Lý do |
|--------------|-------------------|-------|
| **MDC traceId** (logging correlation) | Filter (OncePerRequestFilter) | Chạy đầu, set MDC trước log đầu tiên; clear trong finally |
| **Request/Response body logging** | Filter (ContentCachingRequestWrapper) | Interceptor không đọc được body sau khi controller consumed |
| **CORS** | CorsFilter / CorsConfigurationSource | Phải handle OPTIONS preflight trước DispatcherServlet |
| **Authentication/Authorization** | Filter (Spring Security Filter Chain) | Chặn request trước DispatcherServlet, bảo vệ cả endpoint không đi qua MVC; SecurityContext được populate sớm cho mọi tầng sau (Interceptor, Controller vẫn đọc được) |
| **Đo thời gian request (latency)** | Interceptor (preHandle/postHandle) | Có timestamp chính xác controller; Filter bao qua view rendering |
| **Business audit log** | AOP (@AfterReturning trên @Service) | Có domain object, method args, return value tự nhiên |
| **Retry/Idempotency check** | AOP / Interceptor | Cần business context (idempotency key, entity) |

> Senior tip: **Đừng lạm dụng AOP cho logging request/response** — overhead proxy + khó debug stack trace. Dùng **Filter** cho MDC, CORS, body logging; **Interceptor** cho timing, rate limit, API key check; **AOP** cho @Transactional, @Retryable, audit domain event. Spring Boot 3.x: {{@Order(Ordered.HIGHEST_PRECEDENCE)}} cho Filter MDC.`,
    follow: [
      'Làm sao log request/response body trong Filter mà không làm hỏng stream cho controller?',
      'Spring Security filter chain chạy ở đâu so với Filter/Interceptor tùy chỉnh?'
    ],
    tags: ['Filter', 'Interceptor', 'AOP', 'Spring Boot', 'MDC']
  },
  {
    id: 'api-006',
    topic: 'api',
    level: 'mid',
    q: 'Phân biệt @RequestParam, @PathVariable, @RequestBody, @ModelAttribute: khi nào dùng cái nào, validate input và trả lỗi chuẩn RFC 7807?',
    a: `**Tóm tắt:** @RequestParam lấy query param (GET /search?q=java), @PathVariable lấy URI template variable (GET /accounts/{id}), @RequestBody deserialize JSON body (POST /transfers), @ModelAttribute bind form/query vào object (GET /search?page=0&size=20). Validate dùng @Valid + BindingResult hoặc @Validated trên method, trả ProblemDetail (RFC 7807).

### So sánh nhanh
| Annotation | Nguồn dữ liệu | Content-Type | Dùng cho | Ví dụ |
|------------|---------------|--------------|----------|-------|
| @RequestParam | Query string | application/x-www-form-urlencoded | Filter, pagination, simple search | {{q}}, {{page}}, {{size}}, {{sort}} |
| @PathVariable | URI path | — | Resource identifier | {accountId}, {transactionId} |
| @RequestBody | HTTP body | application/json, application/xml | Complex input, create/update | TransferRequest, AccountDTO |
| @ModelAttribute | Query + Form + Path | application/x-www-form-urlencoded, multipart/form-data | Form binding, search criteria DTO | AccountSearchCriteria |

### Validate & trả lỗi chuẩn
~~~java
@RestController
@RequestMapping("/api/accounts")
@Validated  // enable method-level validation
public class AccountController {

    @PostMapping
    public ResponseEntity<AccountResponse> create(
            @Valid @RequestBody CreateAccountRequest req) { // jakarta.validation (Boot 3)
        // Không khai báo BindingResult: body sai -> Spring tự ném
        // MethodArgumentNotValidException, @ControllerAdvice bên dưới xử lý
        return ResponseEntity.created(uri).body(service.create(req));
    }

    @GetMapping("/{id}")
    public AccountResponse get(@PathVariable @NotNull @Positive Long id) {
        return service.get(id);  // 400 nếu id null/<=0 (ConstraintViolationException)
    }

    @GetMapping
    public Page<AccountResponse> search(@Valid AccountSearchCriteria criteria) {
        return service.search(criteria);  // criteria bind từ query params
    }
}

@ControllerAdvice
class GlobalExceptionHandler {
    @ExceptionHandler(MethodArgumentNotValidException.class)
    ProblemDetail handleValid(MethodArgumentNotValidException ex) {
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.UNPROCESSABLE_ENTITY, "Validation failed");
        pd.setProperty("errors", ex.getBindingResult().getFieldErrors().stream()
            .collect(Collectors.toMap(
                FieldError::getField,
                FieldError::getDefaultMessage,
                (a, b) -> a
            )));
        return pd;
    }

    @ExceptionHandler(ConstraintViolationException.class)
    ProblemDetail handleConstraint(ConstraintViolationException ex) {
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "Invalid parameter");
        pd.setProperty("violations", ex.getConstraintViolations().stream()
            .collect(Collectors.toMap(
                v -> v.getPropertyPath().toString(),
                ConstraintViolation::getMessage,
                (a, b) -> a
            )));
        return pd;
    }
}
~~~

### Response lỗi RFC 7807 (ProblemDetail)
~~~json
{
  "type": "about:blank",
  "title": "Unprocessable Entity",
  "status": 422,
  "detail": "Validation failed",
  "instance": "/api/accounts",
  "errors": {
    "email": "Email đã tồn tại",
    "initialBalance": "Số dư phải >= 0"
  }
}
~~~

### Sai phổ biến
- Dùng @RequestBody cho GET → violation HTTP spec (GET không nên có body), một số proxy/gateway drop body.
- {{@PathVariable Long id}} nhận "abc" → Spring ném MethodArgumentTypeMismatchException → **400** nhưng body mặc định không theo format chung ⇒ thêm handler trong @ControllerAdvice. Còn giá trị sai nghĩa (0, số âm) thì cần {{@Positive}} + {{@Validated}} trên class.
- @ModelAttribute không @Valid → binding thành công nhưng data rác. Luôn {{@Valid @ModelAttribute}}.

> Senior tip: dùng **record** làm DTO request (Java 17+): public record CreateAccountRequest(@Email String email, @Positive BigDecimal initialBalance) {} – constraint đặt trên record component, kích hoạt bằng {{@Valid}} ở tham số controller. Record immutable, ít code boilerplate. Dùng {{@JsonProperty}} map tên field JSON ↔ Java.`,
    follow: [
      'Validate nested object trong @RequestBody (List<@Valid Item>) như thế nào?',
      'Cách custom validator annotation (ví dụ @ValidVietnamPhone) dùng chung cho Param/Body?'
    ],
    tags: ['Validation', 'RFC 7807', 'Spring MVC', 'ProblemDetail']
  },
  {
    id: 'api-007',
    topic: 'api',
    level: 'mid',
    q: 'CORS preflight hoạt động như thế nào? Vì sao chỉ trình duyệt chặn CORS, còn Postman/curl không? Cấu hình CORS đúng trong Spring Security 6 cho ứng dụng ngân hàng (multiple origin, credentials, custom header).',
    a: `**Tóm tắt:** Preflight là request OPTIONS tự động gửi bởi trình duyệt trước request "không đơn giản" (method ngoài GET/HEAD/POST, header không nằm trong safelist, Content-Type như application/json). Gửi kèm cookie/credentials **không** tự nó gây preflight. CORS là cơ chế nới lỏng Same-Origin Policy **do trình duyệt thực thi** để bảo vệ người dùng khỏi JS của trang khác; Postman/curl không chạy JS của origin lạ nên không áp SOP. Với simple request, request vẫn tới server – trình duyệt chỉ chặn JS đọc response. Spring Security 6 dùng CorsConfigurationSource + CorsFilter, bật credentials cho cookie HttpOnly.

### Preflight flow
~~~text
Browser                              Server
   │                                     │
   ├─ OPTIONS /api/transfers             │
   │  Origin: https://app.bank.vn        │
   │  Access-Control-Request-Method: POST│
   │  Access-Control-Request-Headers:    │
   │    Content-Type, X-Request-ID       │
   ▼                                     ▼
   │                          200 OK
   │                          Access-Control-Allow-Origin: https://app.bank.vn
   │                          Access-Control-Allow-Methods: POST, OPTIONS
   │                          Access-Control-Allow-Headers: Content-Type, X-Request-ID
   │                          Access-Control-Allow-Credentials: true
   │                          Access-Control-Max-Age: 3600
   │                                     │
   ├─ POST /api/transfers (actual)       │
   │  Origin: https://app.bank.vn        │
   │  Cookie: JSESSIONID=...             │
   ▼                                     ▼
   │                          201 Created
   │                          Access-Control-Allow-Origin: https://app.bank.vn
   │                          Access-Control-Allow-Credentials: true
   │                                     │
~~~

### Simple request (không preflight) vs Non-simple
| Loại | Điều kiện | Preflight? |
|------|-----------|------------|
| Simple | Method: GET/HEAD/POST + Header chỉ trong safelist: Accept, Accept-Language, Content-Language, Range, Content-Type (application/x-www-form-urlencoded, multipart/form-data, text/plain) | Không |
| Non-simple | Method: PUT/PATCH/DELETE, hoặc custom header (Authorization, X-*), hoặc Content-Type: application/json | Có |

### Cấu hình Spring Security 6 (programmatic)
~~~java
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())  // CHỈ khi auth bằng header Authorization; nếu auth bằng cookie thì phải bật CSRF
            .authorizeHttpRequests(auth -> auth.anyRequest().authenticated())
            .sessionManagement(sess -> sess.sessionCreationPolicy(SessionCreationPolicy.STATELESS));
        return http.build();
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of(
            "https://app.bank.vn",
            "https://admin.bank.vn",
            "https://partner.bank.vn"
        ));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("Authorization", "Content-Type", "X-Request-ID", "Idempotency-Key"));
        config.setExposedHeaders(List.of("X-Total-Count", "X-Request-ID", "Retry-After"));
        config.setAllowCredentials(true);  // cần nếu browser gửi cookie/credentials cross-origin
        config.setMaxAge(3600L);           // cache preflight 1h

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", config);
        return source;
    }
}
~~~

### Sai phổ biến
- {{allowedOrigins("*")}} + {{allowCredentials(true)}} → CORS spec cấm wildcard khi credentials=true (browser từ chối response); Spring ném IllegalArgumentException khi xử lý request. Đừng "sửa" bằng cách phản chiếu mọi Origin – đó mới là lỗ hổng.
- Quên {{exposedHeaders}} → client JS không đọc được header custom (X-Total-Count, Retry-After).
- Không set {{maxAge}} → không có header Access-Control-Max-Age, browser chỉ cache preflight rất ngắn (mặc định 5s) → gần như mỗi request thêm một OPTIONS. Browser cũng tự giới hạn trần (Chrome tối đa 2h).

> Senior tip: Ngân hàng thường có **multiple subdomain** (app, admin, partner). Dùng **pattern matching** thay vì list cứng: {{config.setAllowedOriginPatterns(List.of("https://*.bank.vn"))}} (Spring 5.3+). Với mobile app (không có origin), config riêng endpoint {{/api/mobile/**}} không require credentials. Luôn test CORS bằng {{curl -H "Origin: https://evil.com\" -v}} để xác minh chặn đúng.`,
    follow: [
      'CORS với WebSocket (STOMP over SockJS) cấu hình khác như thế nào?',
      'Làm sao handle CORS cho API gateway (Spring Cloud Gateway) tập trung?'
    ],
    tags: ['CORS', 'Spring Security', 'Preflight', 'Banking']
  },
  {
    id: 'api-008',
    topic: 'api',
    level: 'senior',
    q: 'Session/cookie vs JWT token: lưu token ở cookie HttpOnly hay localStorage? Stateless có thật sự stateless? So sánh bảo mật, scalability, UX cho app ngân hàng.',
    a: `**Tóm tắt:** Cookie HttpOnly + SameSite=Strict/Lax chống XSS tốt hơn localStorage, nhưng mở CSRF risk (cần CSRF token/Double Submit). JWT trong localStorage dễ bị XSS đánh cắp. "Stateless" JWT vẫn có state ở DB (revocation list, key rotation). Ngân hàng ưu tiên **cookie HttpOnly + short-lived access token + refresh token rotation** cho web; mobile dùng secure storage + short JWT.

### So sánh chi tiết
| Tiêu chí | Cookie HttpOnly (Secure, SameSite) | localStorage + JWT |
|----------|------------------------------------|-------------------|
| **XSS theft** | Không (JS không đọc được) | Dễ (XSS → localStorage.getItem) |
| **CSRF** | Có risk (SameSite=Lax giảm, Strict chặn cross-site) | Không (token trong header, không auto-send) |
| **Mobile/native** | Khó (cookie jar phức tạp) | Dễ (lưu secure storage, gửi header) |
| **Subdomain sharing** | Dễ (Domain=.bank.vn) | Phải sync manual |
| **Logout/Revocation** | Huỷ session trong session store (nếu cookie chứa session id); cookie chứa JWT thì vẫn cần revocation như JWT | Cần blocklist/short expiry |
| **Stateless claim** | Server cần session store (Redis) | JWT self-contained, nhưng revocation cần DB |

### Kiến trúc khuyến nghị cho ngân hàng (Web)
~~~text
┌─────────────┐     1. Login (user/pass + device fingerprint)      ┌─────────────┐
│   Browser   │ ─────────────────────────────────────────────────► │  Auth API   │
│             │ ◄──── 2. Set-Cookie: access=eyJ...; HttpOnly;      │             │
│             │      Secure; SameSite=Strict; Path=/; Max-Age=900  │             │
│             │      Set-Cookie: refresh=rotating...; HttpOnly;    │             │
│             │      Secure; SameSite=Strict; Path=/auth/refresh   │             │
└─────────────┘                                                     └─────────────┘
       │
       │ 3. Request API (cookie auto-sent)
       ▼
┌─────────────┐     4. Validate access token (signature, expiry)   ┌─────────────┐
│  Resource   │ ─────────────────────────────────────────────────► │  Auth/Intros│
│   Server    │ ◄──── 5. User info / 401 nếu expired              │  /Resource  │
└─────────────┘                                                     └─────────────┘
       │
       │ 6. Access token hết hạn (900s)
       ▼
┌─────────────┐     7. POST /auth/refresh (refresh cookie auto-sent)┌─────────────┐
│   Browser   │ ─────────────────────────────────────────────────► │  Auth API   │
│             │ ◄──── 8. Rotate: new access + new refresh cookie   │             │
└─────────────┘     (old refresh revoked, detect reuse = theft)    └─────────────┘
~~~

### Refresh Token Rotation (RTR) - bắt buộc cho ngân hàng
- Mỗi lần refresh → **issue mới cặp (access, refresh)**, **revoke refresh cũ**.
- Nếu refresh token bị replay (kẻ tấn công và user hợp pháp đều dùng) → **revoke toàn bộ session**, force re-login.
- Lưu **hash** của refresh token trong DB, không lưu plaintext. Token là chuỗi random entropy cao nên SHA-256 là đủ (tra cứu được theo index); bcrypt/argon2 có salt ngẫu nhiên nên không tra cứu trực tiếp theo hash được – dành cho password.

### "Stateless" JWT myth
- JWT chứa claims (userId, roles, exp) → server không cần lookup session.
- **Nhưng**: logout, password change, role update, token compromise → cần **revocation**.
- Giải pháp: **Short expiry (5-15min) + refresh rotation** → window tấn công nhỏ. Không cần blocklist phức tạp.

> Senior tip: **Đừng lưu JWT trong localStorage** cho app ngân hàng web. Dùng **cookie HttpOnly + SameSite=Strict + CSRF token (Double Submit Cookie pattern)**. Spring Security 6: {{CookieCsrfTokenRepository.withHttpOnlyFalse()}} cho SPA (JS đọc cookie XSRF-TOKEN rồi gửi lại trong header X-XSRF-TOKEN; Spring Security 6 còn cần cấu hình CsrfTokenRequestHandler phù hợp cho SPA). Mobile app: lưu access/refresh trong **iOS Keychain / Android Keystore**, dùng **certificate pinning** cho API call.`,
    follow: [
      'Implement refresh token rotation với reuse detection (OAuth 2.0 Security BCP, RFC 9700) như thế nào?',
      'So sánh JWT opaque token vs self-contained JWT cho microservice internal call?'
    ],
    tags: ['Authentication', 'JWT', 'Cookie', 'Session', 'Security', 'Banking']
  },
  {
    id: 'api-009',
    topic: 'api',
    level: 'senior',
    q: 'ETag và conditional request (If-None-Match, If-Match) hoạt động thế nào? Áp dụng cho cache GET và chống lost update khi PUT/PATCH tài khoản ngân hàng.',
    a: `**Tóm tắt:** ETag là fingerprint của resource version (hash/content-version). GET dùng {{If-None-Match}} → 304 Not Modified nếu chưa đổi (cache). PUT/PATCH dùng {{If-Match}} → 412 Precondition Failed nếu version đã thay đổi (optimistic lock). Spring hỗ trợ {{ShallowEtagHeaderFilter}}, {{WebRequest.checkNotModified(etag)}} hoặc manual ETag qua {{ResponseEntity.eTag()}}.

### ETag là gì?
- **Strong ETag**: {{ETag: "abc123"}} — byte-for-byte identical (MD5/SHA256 content hash, hoặc version counter).
- **Weak ETag**: {{ETag: W/"abc123"}} — semantic equivalent (có thể khác bytes nhưng ý nghĩa giống nhau). Chỉ dùng cho GET cache, **không dùng cho If-Match**.

### Conditional headers
| Header | Method | Ý nghĩa | Response nếu match | Response nếu không match |
|--------|--------|---------|-------------------|-------------------------|
| {{If-None-Match}} | GET/HEAD | "Chỉ trả nếu ETag **khác**" | 304 Not Modified (no body) | 200 OK + body mới |
| {{If-Match}} | PUT/PATCH/DELETE | "Chỉ ghi nếu ETag **giống**" | 200/204 | 412 Precondition Failed |
| {{If-Modified-Since}} | GET | Timestamp-based (kém chính xác hơn ETag) | 304 | 200 |
| {{If-Unmodified-Since}} | PUT/PATCH/DELETE | Timestamp-based lock | 200/204 | 412 |

### Cache GET với ETag
~~~java
@GetMapping("/accounts/{id}")
public ResponseEntity<AccountResponse> get(
        @PathVariable Long id,
        @RequestHeader(value = "If-None-Match", required = false) String ifNoneMatch) {
    Account account = service.findById(id);
    String etag = "\"" + account.getVersion() + "\"";  // version từ @Version JPA
    
    if (etag.equals(ifNoneMatch)) {
        return ResponseEntity.status(HttpStatus.NOT_MODIFIED).eTag(etag).build();
    }
    return ResponseEntity.ok().eTag(etag).body(toResponse(account));
}
~~~

### Chống lost update (Optimistic Locking) với If-Match
~~~java
@PutMapping("/accounts/{id}")
public ResponseEntity<AccountResponse> update(
        @PathVariable Long id,
        @Valid @RequestBody UpdateAccountRequest req,
        @RequestHeader(value = "If-Match", required = false) String ifMatch) {
    
    // Client phải gửi If-Match: "v5" (ETag từ GET trước đó)
    if (ifMatch == null) {
        return ResponseEntity.status(HttpStatus.PRECONDITION_REQUIRED).build(); // 428 (RFC 6585)
    }
    
    try {
        Account updated = service.updateWithVersion(id, req, extractVersion(ifMatch));
        return ResponseEntity.ok().eTag("\"" + updated.getVersion() + "\"").body(toResponse(updated));
    } catch (OptimisticLockingFailureException e) {
        return ResponseEntity.status(HttpStatus.PRECONDITION_FAILED).build(); // 412: client GET lại bản mới
    }
}
~~~

JPA entity:
~~~java
@Entity
class Account {
    @Version Long version;  // tự tăng mỗi update
    BigDecimal balance;
    // ...
}
~~~

### Spring built-in support
- {{ShallowEtagHeaderFilter}}: Tự tính ETag từ response body (hash body), trả 304 cho GET/HEAD. Chỉ tiết kiệm **băng thông** – server vẫn chạy controller và serialize đầy đủ; không hỗ trợ If-Match cho write.
- {{WebMvcConfigurer.addInterceptors(registry)}}: {{registry.addInterceptor(new WebContentInterceptor())}} cho Cache-Control.
- Manual ETag (như trên) linh hoạt hơn cho write conditional.

### Sai phổ biến
- Dùng weak ETag ({{W/"..."}}) cho {{If-Match}} → If-Match dùng **strong comparison**, ETag weak không bao giờ khớp → luôn 412.
- Không trả {{ETag}} header trong response PUT/POST → client không có version để gửi If-Match lần sau.
- Quên handle {{If-None-Match: *}} (tạo mới, fail nếu tồn tại) → dùng cho idempotent create.

> Senior tip: Ngân hàng **bắt buộc** optimistic locking cho tài khoản (balance, status). Kết hợp {{@Version}} JPA + {{If-Match}} header. Client mobile/web: GET → cache ETag → PUT kèm If-Match. Nếu 412 → re-fetch GET → merge local change → retry. Không dùng {{Last-Modified}} cho việc này vì HTTP-date chỉ chính xác tới **giây** – hai update trong cùng giây không phân biệt được.`,
    follow: [
      'So sánh ETag vs Last-Modified cho cache: ưu nhược điểm?',
      'Làm sao generate ETag cho collection resource (GET /accounts?page=1)?'
    ],
    tags: ['ETag', 'Conditional Request', 'Optimistic Locking', 'Cache', 'Banking']
  },
  {
    id: 'api-010',
    topic: 'api',
    level: 'senior',
    q: 'Thiết kế API tác vụ chạy lâu (báo cáo, batch, export): 202 Accepted + polling vs callback/webhook. Khi nào chọn cách nào? Triển khai với Spring Boot.',
    a: `**Tóm tắt:** Tác vụ > 5-10s không nên hold HTTP connection. Trả 202 Accepted + {{Location}} (status endpoint) hoặc {{Link}} header. Client polling (đơn giản) hoặc webhook/callback (server push). Polling phù hợp UI đơn giản, webhook cho integration/high-volume. Spring Boot dùng {{@Async}} + {{TaskExecutor}} + persistence trạng thái.

### 202 Accepted response
~~~http
HTTP/1.1 202 Accepted
Location: /api/jobs/export-abc123
Link: <https://api.bank.vn/api/jobs/export-abc123>; rel="status"
Retry-After: 30
Content-Type: application/json

{
  "jobId": "export-abc123",
  "status": "PENDING",
  "createdAt": "2024-01-15T10:30:00Z",
  "estimatedCompletion": "2024-01-15T10:35:00Z"
}
~~~

### Polling vs Webhook/Callback
| Tiêu chí | Polling (Client pull) | Webhook/Callback (Server push) |
|----------|----------------------|--------------------------------|
| **Complexity** | Thấp (client tự loop) | Cao (cần endpoint, retry, security) |
| **Latency** | Tùy interval (thường 5-30s) | Near real-time |
| **Server load** | Nhiều request rác (404/200 pending) | Chỉ 1 call khi done |
| **Reliability** | Client control retry | Cần retry + dead letter queue |
| **Firewall/NAT** | Không vấn đề | Cần public endpoint, verify signature |
| **Phù hợp** | UI dashboard, mobile app | Partner integration, async workflow |

### Triển khai Spring Boot
~~~java
@Entity
class AsyncJob {
    @Id String id;           // UUID
    String type;             // EXPORT_TRANSACTION, GENERATE_REPORT
    @Enumerated(EnumType.STRING) Status status; // PENDING, RUNNING, COMPLETED, FAILED
    String payload;          // JSON input params
    String resultUrl;        // pre-signed S3 URL khi done
    String error;
    Instant createdAt, startedAt, completedAt;
    int retryCount;
}

@RestController
@RequestMapping("/api/jobs")
class JobController {
    
    @PostMapping("/export/transactions")
    ResponseEntity<JobResponse> startExport(@Valid @RequestBody ExportRequest req) {
        String jobId = UUID.randomUUID().toString();
        jobRepo.save(new AsyncJob(jobId, "EXPORT_TRANSACTION", PENDING, toJson(req)));
        jobService.run(jobId);  // @Async: trả về ngay, job chạy trên pool "jobExecutor"
        return ResponseEntity.accepted()
            .location(URI.create("/api/jobs/" + jobId))
            .header("Retry-After", "30")
            .body(new JobResponse(jobId, "PENDING"));
    }
    
    @GetMapping("/{jobId}")
    ResponseEntity<JobResponse> status(@PathVariable String jobId) {
        AsyncJob job = jobRepo.findById(jobId).orElseThrow(NotFound::new);
        return ResponseEntity.ok(new JobResponse(job));
    }
}

@Service
@RequiredArgsConstructor
class JobService {
    final JobRepository repo;
    final S3Service s3;
    
    @Async("jobExecutor")  // dedicated thread pool; gọi từ bean khác (qua proxy) mới có hiệu lực
    public void run(String jobId) {
        AsyncJob job = repo.findById(jobId).orElseThrow();
        job.setStatus(RUNNING); job.setStartedAt(Instant.now()); repo.save(job);
        try {
            String s3Url = generateReport(job.getPayload());  // long work
            job.setResultUrl(s3Url);
            job.setStatus(COMPLETED);
        } catch (Exception e) {
            job.setStatus(FAILED); job.setError(e.getMessage());
            // retry logic: if (job.retryCount < 3) schedule retry with backoff
        } finally {
            job.setCompletedAt(Instant.now()); repo.save(job);
        }
    }
}
~~~

### Webhook implementation (cho partner)
~~~java
@PostMapping("/api/jobs/{jobId}/webhook")
void registerWebhook(@PathVariable String jobId, @Valid @RequestBody WebhookRequest req) {
    // Validate URL, save webhook config with HMAC secret
    jobRepo.updateWebhook(jobId, req.getUrl(), req.getSecret());
}

// Khi job done:
void notifyWebhook(AsyncJob job) {
    if (job.getWebhookUrl() == null) return;
    String payload = toJson(job);
    String signature = HmacSHA256(payload, job.getWebhookSecret());
    webClient.post().uri(job.getWebhookUrl())
        .header("X-Signature", signature)
        .header("X-Job-ID", job.getId())
        .bodyValue(payload)
        .retrieve()
        .toBodilessEntity()                                   // 4xx/5xx -> lỗi -> retry
        .retryWhen(Retry.backoff(3, Duration.ofSeconds(10)))
        .subscribe();  // production: nên dùng outbox/queue để không mất khi app restart
}
~~~

### Idempotency cho webhook
- Partner phải handle duplicate delivery (network retry).
- Gửi {{X-Delivery-ID}} (UUID) + {{X-Timestamp}}. Partner deduplicate theo ID.

> Senior tip: **Polling interval nên exponential backoff** (5s, 10s, 20s, max 60s) + jitter ±10% tránh thundering herd. UI hiển thị progress bar từ {{estimatedCompletion}}. Với export lớn (>100MB), dùng **pre-signed S3 URL** (TTL 1h) trong {{resultUrl}} thay vì trả file qua API. Spring Boot 3.2+: job I/O-bound có thể chạy trên virtual thread ({{SimpleAsyncTaskExecutor}} với virtual threads) – không pool virtual thread, giới hạn số job đồng thời bằng concurrency limit.`,
    follow: [
      'Thiết kế retry với exponential backoff + jitter cho webhook delivery?',
      'Làm sao cleanup job cũ (TTL) và handle job bị treo (stuck RUNNING)?'
    ],
    tags: ['Async API', '202 Accepted', 'Polling', 'Webhook', 'Spring Boot']
  },
  {
    id: 'api-011',
    topic: 'api',
    level: 'lead',
    q: 'Thiết kế webhook gửi cho đối tác (partner integration): ký HMAC, retry với exponential backoff, idempotency key, đảm bảo thứ tự event. Ví dụ: ngân hàng gửi thông báo giao dịch cho e-wallet partner.',
    a: `**Tóm tắt:** Webhook = HTTP callback từ server → partner khi event xảy ra. Bảo mật: HMAC-SHA256 signature + timestamp. Reliability: retry exponential backoff + dead letter queue. Idempotency: partner deduplicate theo {{X-Delivery-ID}}. Ordering: sequence number per resource + partition by account.

### Kiến trúc webhook production-grade
~~~text
Bank Core System          Webhook Dispatcher          Partner (E-wallet)
     │                          │                          │
     ├─ Event: TXN_CREATED ───►│                          │
     │                          ├─ Persist Outbox (DB)    │
     │                          │   (event_id, payload,   │
     │                          │    target_url, hmac_key,│
     │                          │    retry_count, status) │
     │                          ▼                          │
     │                     Dispatcher Pool                │
     │                          │                          │
     │                          ├─ POST /webhook/txn      │
     │                          │  X-Delivery-ID: uuid    │
     │                          │  X-Timestamp: unix-ms   │
     │                          │  X-Signature: HMAC      │
     │                          │  X-Sequence: 1001       │
     │                          │  {event: TXN_CREATED...}│
     │                          ▼                          │
     │                     Partner validates               │
     │                          │                          │
     │                          ◄── 200 OK (processed)    │
     │                          │                          │
     │                          ├─ Mark delivered         │
     │                          │                          │
     │                     (nếu fail)                      │
     │                          ├─ Schedule retry         │
     │                          │  backoff: 10s, 30s, 1m, │
     │                          │  5m, 15m, 1h... (max 72h)│
     │                          ▼                          │
~~~

### Payload & Signature
~~~json
// Request body
{
  "eventId": "evt_abc123",
  "eventType": "TRANSACTION_COMPLETED",
  "timestamp": "2024-01-15T10:30:00.123Z",
  "sequence": 1001,
  "data": {
    "transactionId": "txn_001",
    "accountId": "acc_123",
    "amount": 500000,
    "currency": "VND",
    "status": "SUCCESS"
  }
}

// Headers
X-Delivery-ID: dlv_xyz789          // GIỮ NGUYÊN qua mọi lần retry của cùng event (để partner dedup)
X-Timestamp: 1705315800123         // Unix ms, prevent replay > 5min
X-Signature: sha256=abcdef...      // HMAC-SHA256(timestamp + "." + payload, secret)
X-Sequence: 1001                   // ordering per account
~~~

### HMAC verification (partner side)
~~~java
@PostMapping("/webhook/transactions")
ResponseEntity<String> receive(
        @RequestHeader("X-Signature") String signature,
        @RequestHeader("X-Timestamp") long timestamp,
        @RequestHeader("X-Delivery-ID") String deliveryId,
        @RequestBody String payload) {
    
    // 1. Check timestamp (replay protection)
    if (Math.abs(System.currentTimeMillis() - timestamp) > 5 * 60 * 1000) {
        return ResponseEntity.status(400).body("Timestamp too old");
    }
    
    // 2. Verify HMAC (ký cả timestamp để kẻ tấn công không thay timestamp mới cho payload cũ)
    String expected = "sha256=" + HmacSHA256(timestamp + "." + payload, webhookSecret);
    if (!MessageDigest.isEqual(expected.getBytes(StandardCharsets.UTF_8),
                               signature.getBytes(StandardCharsets.UTF_8))) {  // so sánh constant-time
        return ResponseEntity.status(401).body("Invalid signature");
    }
    
    // 3. Idempotency check (production: unique constraint trên delivery_id để chống race 2 request song song)
    if (deliveryLogRepo.existsByDeliveryId(deliveryId)) {
        return ResponseEntity.ok().build();  // already processed
    }
    
    // 4. Process event (async)
    eventProcessor.process(payload);
    deliveryLogRepo.save(new DeliveryLog(deliveryId, "SUCCESS"));
    return ResponseEntity.ok().build();
}
~~~

### Retry & Ordering
| Chiến lược | Mô tả |
|------------|-------|
| **Exponential backoff + jitter** | {{delay = min(base * 2^attempt, max) * (0.9 + 0.2 * random())}} |
| **Max retry** | 10-12 lần trong 72h, sau đó DLQ |
| **Per-account ordering** | Partition dispatcher theo {{accountId}} → single-threaded per partition |
| **Sequence gap detection** | Partner track {{lastSequence}} per account; gap → request replay |

### Outbox Pattern (đảm bảo event không mất)
- Ghi event vào **outbox table** cùng transaction với business logic.
- Dispatcher poll outbox (CDC hoặc scheduler) → publish.
- Tránh dual-write problem (DB commit OK nhưng publish fail).

> Senior tip: Ngân hàng dùng **Kafka/EventHub** làm backbone, webhook dispatcher là consumer. Partner chỉ nhận HTTPS callback. **Luôn version webhook API** ({{/webhook/v1/}}, {{/webhook/v2/}}) — partner migrate dần. Test webhook với **ngrok** local + **signature verification** tự động trong CI.`,
    follow: [
      'Outbox relay: polling publisher vs CDC (Debezium) khác nhau như thế nào?',
      'Làm sao handle partner down lâu (circuit breaker cho webhook dispatcher)?'
    ],
    tags: ['Webhook', 'Partner Integration', 'HMAC', 'Retry', 'Outbox', 'Banking'],
    refs: [
      { type: 'doc', title: 'RFC 9110: HTTP Semantics', url: 'https://www.rfc-editor.org/rfc/rfc9110' },
      { type: 'doc', title: 'OWASP API Security Project', url: 'https://owasp.org/API-Security/' },
    ],
  },
  {
    id: 'api-012',
    topic: 'api',
    level: 'senior',
    q: 'Tomcat embedded trong Spring Boot: cấu hình maxThreads, acceptCount, connectionTimeout. Vì sao request bị treo ở tầng Tomcat (thread pool exhausted, slow client, connection leak)?',
    a: `**Tóm tắt:** Tomcat embedded dùng thread pool (maxThreads mặc định 200) xử lý request. maxConnections (NIO) mặc định 8192; acceptCount (TCP backlog của OS khi đã đủ maxConnections) mặc định 100. connectionTimeout mặc định của connector là 60s (file server.xml mẫu của Tomcat standalone đặt 20s). Request treo khi: thread pool exhausted (sync blocking I/O), slow client (read/write timeout), connection leak (pool không trả connection). Fix: virtual threads (Java 21), async processing, tuning pool, monitoring.

### Cấu hình quan trọng (application.yml)
~~~yaml
server:
  tomcat:
    threads:
      max: 200           # max worker threads (default 200)
      min-spare: 10      # core pool size
    accept-count: 100    # TCP backlog khi đã đủ max-connections (default 100)
    connection-timeout: 20s    # chờ request line sau khi accept / read timeout (connector default 60s)
    max-connections: 8192      # max connection Tomcat giữ đồng thời (default 8192 với NIO)
    keep-alive-timeout: 20s    # idle giữa 2 request keep-alive (default = connection-timeout)
    max-http-form-post-size: 2MB  # limit form post
    accesslog:
      enabled: true
      pattern: "%h %l %u %t \"%r\" %s %b %{ms}T %{X-Request-ID}i"  # %{ms}T = thời gian xử lý (ms); Tomcat 10+: %D là micro-giây
~~~

### Thread pool model (Tomcat 10 / Spring Boot 3)
~~~text
                    ┌─────────────────────┐
                    │  Acceptor Thread    │  (1 thread, accept() socket)
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   Poller (NIO)      │  (selector: socket có data thì giao cho worker)
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │  Worker Thread Pool │  (maxThreads, parse request + chạy servlet)
                    │  [T1, T2, ..., T200]│
                    └─────────────────────┘
~~~
- Khi 200 worker đều bận, connection đã accept vẫn được giữ (tới max-connections) và request **xếp hàng trong executor** chờ thread rảnh – đây là chỗ request "treo". accept-count chỉ có tác dụng khi số connection đã chạm max-connections.

### Tại sao request treo (hàng)?
| Nguyên nhân | Triệu chứng | Chẩn đoán | Fix |
|-------------|-------------|-----------|-----|
| **Sync blocking I/O** (JDBC, HTTP client sync) | Thread pool full, CPU thấp, latency tăng | Thread dump: nhiều thread RUNNABLE ở {{SocketInputStream.read}}, {{JDBC}} | Virtual threads (Java 21), @Async, WebFlux, async HTTP client |
| **Slow client / Slowloris** | Connection count cao, thread ít, read timeout | Access log: %D lớn, connection count > thread count | {{connection-timeout}}, {{max-connections}}, WAF/rate limit |
| **Connection leak (HikariCP)** | Pool exhausted, "Connection not available" | HikariCP metrics: {{active}} = {{max}}, {{idle}} = 0 | {{connection-timeout}}, {{max-lifetime}}, {{leak-detection-threshold}} |
| **Large request body** | Thread block đọc body | {{max-http-form-post-size}}, {{max-swallow-size}} | Stream processing, limit body size |
| **Synchronous external call** | Thread chờ downstream | Thread dump: {{RestTemplate.exchange}}, {{WebClient.block}} | WebClient reactive, Resilience4j timeout/bulkhead |

### Virtual Threads (Java 21 + Spring Boot 3.2+)
~~~yaml
spring:
  threads:
    virtual:
      enabled: true  # bật virtual threads cho Tomcat
# server.tomcat.threads.max không còn tác dụng: Tomcat dùng executor virtual thread
~~~
- Mỗi request = 1 virtual thread (carrier thread pool nhỏ ~CPU cores).
- Blocking I/O (JDBC, RestTemplate) **không block carrier thread** → throughput cao. Giới hạn thật chuyển sang tài nguyên phía sau (Hikari pool, downstream) ⇒ cần bulkhead/semaphore.
- **Lưu ý**: blocking bên trong {{synchronized}} (JDK 21–23, đã sửa ở JDK 24 – JEP 491) và native call sẽ **pin** carrier thread. ThreadLocal không pin nhưng tốn bộ nhớ khi có hàng triệu virtual thread. Việc CPU-bound (Jackson serialize) vẫn chiếm carrier trong lúc chạy.

### Monitoring & Alerting
~~~promql
# Cần server.tomcat.mbeanregistry.enabled=true để Micrometer có metric tomcat_threads_* / tomcat_connections_*
# Thread pool usage
tomcat_threads_busy_threads / tomcat_threads_config_max_threads > 0.8

# Connection usage
tomcat_connections_current_connections / tomcat_connections_config_max_connections > 0.8

# Request latency (P99)
histogram_quantile(0.99, rate(http_server_requests_seconds_bucket[5m])) > 5
~~~

> Senior tip: **Luôn bật access log có thời gian xử lý request** (%{ms}T hoặc %D micro-giây) — debug production không có log request time là mù. Spring Boot 3.2+: {{spring.threads.virtual.enabled=true}} là game-changer cho blocking I/O. Nhưng **không phải silver bullet**: CPU-bound workload không nhanh hơn, synchronized (trước JDK 24) vẫn pin carrier. Profile bằng {{jcmd <pid> Thread.print}} hoặc {{async-profiler}} trước khi tune.`,
    follow: [
      'Cấu hình Tomcat cho gRPC (h2c) khác HTTP/1.1 như thế nào?',
      'Làm sao detect connection leak HikariCP trong production không restart app?'
    ],
    tags: ['Tomcat', 'Thread Pool', 'Performance', 'Virtual Threads', 'Spring Boot', 'Troubleshooting']
  },
  {
    id: 'api-013',
    topic: 'api',
    level: 'lead',
    q: 'So sánh REST vs gRPC vs GraphQL: chọn cái nào cho mobile app, cho service nội bộ (microservice), cho đối tác ngoài? Trade-off latency, payload, tooling, evolution.',
    a: `**Tóm tắt:** REST (HTTP/JSON) — universal, cacheable, tooling tốt, phù hợp public API, mobile, partner. gRPC (HTTP/2 + Protobuf) — latency thấp, contract-first, streaming, phù hợp service-to-service nội bộ. GraphQL — flexible query, single endpoint, phù hợp BFF (Backend for Frontend), mobile complex UI. Không có "silver bullet", thường kết hợp.

### So sánh chi tiết
| Tiêu chí | REST (HTTP/1.1/2 + JSON) | gRPC (HTTP/2 + Protobuf) | GraphQL (HTTP + JSON) |
|----------|--------------------------|-------------------------|----------------------|
| **Protocol** | HTTP/1.1, HTTP/2 | HTTP/2 (required) | HTTP/1.1, HTTP/2 |
| **Serialization** | JSON (text, verbose) | Protobuf (binary, compact) | JSON (response shape do client định) |
| **Schema/Contract** | OpenAPI (optional) | .proto (required, codegen) | SDL (Schema Definition Language) |
| **Latency** | Trung bình | **Thấp nhất** (binary, multiplexing) | Cao hơn (N+1 resolver, parsing) |
| **Payload size** | Lớn | **Nhỏ nhất** (binary, thường nhỏ hơn JSON đáng kể – đo với payload thật) | Tùy query (có thể over-fetch nếu client kém) |
| **Streaming** | SSE, WebSocket | **Native** (unary, server/client/bidi stream) | Subscription (WebSocket) |
| **Caching** | **Native** (HTTP cache, ETag, CDN) | Khó (custom) | Khó (POST body, persisted query) |
| **Browser support** | **Native** (fetch, axios) | Cần grpc-web / Envoy proxy | Native (fetch) |
| **Tooling** | Rất phong phú | Tốt (protoc, buf, grpcurl) | Tốt (Apollo, Relay, GraphiQL) |
| **Evolution** | Versioning URL/header | Field number, backward compat | Deprecation directive, schema stitching |
| **Learning curve** | Thấp | Trung bình (Protobuf, HTTP/2) | Cao (resolver, dataloader, security) |

### Khi nào chọn gì?

**Mobile App (Public API)**
→ **REST** (hoặc GraphQL cho BFF)
- Cache CDN, ETag, conditional request tiết kiệm bandwidth 3G/4G.
- Tooling đơn giản (Retrofit, Dio, Alamofire).
- GraphQL: Dùng **BFF pattern** — mobile gọi BFF (GraphQL), BFF aggregate từ REST/gRPC internal.

**Service nội bộ (Microservice sync call)**
→ **gRPC**
- Latency critical (P99 thấp cho payment, ledger).
- Contract-first: .proto shared qua buf schema registry, breaking change detect CI.
- Streaming: server push real-time (balance update, fraud alert).
- Load balancing: gRPC giữ connection HTTP/2 lâu dài nên L4 load balancer (K8s Service thường) dồn traffic vào ít pod ⇒ cần client-side LB (round_robin) hoặc L7 proxy (Envoy, service mesh).

**Đối tác ngoài (Partner Integration)**
→ **REST + OpenAPI** (hoặc gRPC nếu partner technical mạnh)
- Partner dễ test (Postman, curl), không cần protobuf toolchain.
- OpenAPI spec publish → partner generate SDK tự động.
- Versioning rõ ràng: {{/v1/}}, {{/v2/}}, deprecation policy 12 tháng.

### Kết hợp thực tế (Polyglot API)
~~~text
┌─────────────┐     REST/OpenAPI      ┌─────────────┐
│  Mobile App │ ◄───────────────────► │   BFF/      │
│  (React     │                       │   API GW    │
│   Native)   │                       │  (Spring    │
└─────────────┘                       │   Cloud     │
                                      │   Gateway)  │
                                      └──────┬──────┘
                                             │
                    ┌────────────────────────┼────────────────────────┐
                    ▼                        ▼                        ▼
             ┌─────────────┐          ┌─────────────┐          ┌─────────────┐
             │  Account    │          │ Transaction │          │  Ledger     │
             │  Service    │          │  Service    │          │  Service    │
             │  (gRPC)     │◄────────►│  (gRPC)     │◄────────►│  (gRPC)     │
             └─────────────┘          └─────────────┘          └─────────────┘
~~~

### Anti-patterns
- **gRPC cho public API** → partner kêu khổ vì tooling, firewall block HTTP/2.
- **GraphQL cho service-to-service** → tight coupling, N+1 death spiral, khó trace.
- **REST cho high-frequency internal call** → JSON serialization overhead, no streaming.

> Senior tip: Mô hình phổ biến ở ngân hàng: **REST cho public/open banking**, **gRPC cho core banking internal** (transfer, ledger, limit check), **GraphQL cho BFF mobile/web**. Spring Boot 3.x: Spring gRPC (dự án chính thức, còn mới), {{spring-graphql}} (official). Luôn có **API Gateway** (Spring Cloud Gateway / Kong / Apigee) terminate TLS, auth, rate limit, route REST↔gRPC translation.`,
    follow: [
      'GraphQL N+1 problem: DataLoader hoạt động như thế nào, khi nào không đủ?',
      'gRPC error handling: rich error model (google.rpc.Status) vs HTTP status code?'
    ],
    tags: ['REST', 'gRPC', 'GraphQL', 'Architecture', 'Microservices', 'Mobile', 'Banking'],
    refs: [
      { type: 'doc', title: 'RFC 9110: HTTP Semantics', url: 'https://www.rfc-editor.org/rfc/rfc9110' },
      { type: 'doc', title: 'gRPC Core Concepts', url: 'https://grpc.io/docs/what-is-grpc/core-concepts/' },
      { type: 'doc', title: 'GraphQL: Learn', url: 'https://graphql.org/learn/' },
    ],
  },
  {
    id: 'api-014',
    topic: 'api',
    level: 'senior',
    q: 'API-first với OpenAPI (springdoc, generator): contract trước code, review thay đổi API, generate client/server stub. Quy trình CI/CD đảm bảo không breaking change.',
    a: `**Tóm tắt:** API-first = viết OpenAPI spec **trước** implement. springdoc-openapi generate spec từ code (code-first) – dùng để so sánh với spec đã duyệt; việc kiểm tra response khớp spec cần thư viện validator riêng (contract test). Generator (openapi-generator) sinh client/server stub. CI gate: {{oasdiff}} (hoặc openapi-diff) so sánh spec mới vs baseline, fail build nếu breaking.

### Quy trình API-first
~~~text
1. Design: Viết API spec (YAML) ──► Review (Arch, Security, Partner)
                                  │
2. Baseline: Commit spec vào \`main\` branch (git tag v1.0.0)
                                  │
3. Implement: Dev generate server stub (interface + DTO)
                                  │
4. Contract Test: MockMvc + validator (ví dụ swagger-request-validator) kiểm tra request/response khớp spec
                                  │
5. CI Gate: \`oasdiff\` / openapi-diff compare HEAD vs baseline
                                  │
6. Release: Tag version, publish spec to portal (Stoplight, Redocly, SwaggerHub)
                                  │
7. Client: Partner generate SDK từ spec (Java, Kotlin, TypeScript, Go, Python)
~~~

### springdoc-openapi 2.x (Spring Boot 3)
~~~yaml
dependencies:
  - org.springdoc:springdoc-openapi-starter-webmvc-ui:2.6.0
  - org.springdoc:springdoc-openapi-starter-webmvc-api:2.6.0
~~~

~~~java
@RestController
@RequestMapping("/api/v1/accounts")
@Tag(name = "Account", description = "Quản lý tài khoản khách hàng")
@SecurityRequirement(name = "bearerAuth")
class AccountController {

    @Operation(summary = "Tạo tài khoản mới", 
               responses = {
                   @ApiResponse(responseCode = "201", description = "Created",
                       content = @Content(schema = @Schema(implementation = AccountResponse.class))),
                   @ApiResponse(responseCode = "422", description = "Validation error",
                       content = @Content(schema = @Schema(implementation = ProblemDetail.class)))
               })
    @PostMapping
    ResponseEntity<AccountResponse> create(
            @Valid @RequestBody @Parameter(description = "Thông tin mở tài khoản") CreateAccountRequest req) {
        return ResponseEntity.created(uri).body(service.create(req));
    }
}
~~~

### Generate server stub (interface-first)
~~~xml
<!-- pom.xml: openapi-generator-maven-plugin -->
<plugin>
  <groupId>org.openapitools</groupId>
  <artifactId>openapi-generator-maven-plugin</artifactId>
  <version>7.10.0</version>
  <executions>
    <execution>
      <goals><goal>generate</goal></goals>
      <configuration>
        <inputSpec>\${project.basedir}/src/main/resources/openapi/account-api.yaml</inputSpec>
        <generatorName>spring</generatorName>  <!-- library mặc định: spring-boot -->
        <configOptions>
          <delegatePattern>true</delegatePattern>  <!-- generate interface + delegate -->
          <useSpringBoot3>true</useSpringBoot3>
          <interfaceOnly>false</interfaceOnly>
          <implFolder>generated</implFolder>
        </configOptions>
      </configuration>
    </execution>
  </executions>
</plugin>
~~~
- Dev implement {{AccountApiDelegate}} (interface generated), không sửa code generated.

### Contract test (validate implementation match spec)
~~~java
@SpringBootTest
@AutoConfigureMockMvc
class AccountContractTest {
    
    @Autowired MockMvc mvc;
    
    @Test
    void createAccount_specCompliant() throws Exception {
        String spec = mvc.perform(get("/v3/api-docs"))
            .andExpect(status().isOk())
            .andReturn().getResponse().getContentAsString();
        
        // Validate với openapi-validator (optional)
        // Hoặc dùng Pact/Spring Cloud Contract cho consumer-driven contract
    }
    
    @Test
    void createAccount_responseMatchesSchema() throws Exception {
        mvc.perform(post("/api/v1/accounts")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"test@bank.vn\",\"initialBalance\":1000}"))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.email").value("test@bank.vn"))
            .andExpect(jsonPath("$.id").exists());
    }
}
~~~

### CI Breaking change detection
~~~yaml
# .github/workflows/api-contract.yml
name: API Contract Check
on: [pull_request]
jobs:
  breaking-changes:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }  # need history for baseline
      
      - name: Download baseline spec (from main)
        run: |
          git show origin/main:src/main/resources/openapi/account-api.yaml > baseline.yaml
      
      - name: Current spec (file trong PR)
        run: cp src/main/resources/openapi/account-api.yaml current.yaml
        # code-first: chạy app rồi curl localhost:8080/v3/api-docs.yaml > current.yaml
      
      - name: Check breaking changes
        uses: oasdiff/oasdiff-action/breaking@main   # nên pin theo tag/commit
        with:
          base: baseline.yaml
          revision: current.yaml
          fail-on: ERR  # fail build nếu có breaking change
~~~

### Breaking vs Non-breaking changes
| Loại | Breaking? | Ví dụ |
|------|-----------|-------|
| Thêm optional field response | Không | Thêm {{metadata}} object |
| Thêm required field request | **Có** | {{required: [newField]}} |
| Xóa field | **Có** | Bỏ {{phone}} |
| Đổi type field | **Có** | {{int}} → {{string}} |
| Đổi enum value | **Có** | Thêm/bỏ value |
| Thêm endpoint mới | Không | GET /v1/accounts/{id}/cards |
| Đổi status code | **Có** | 200 → 201 |
| Thêm header response | Không | {{X-Request-ID}} |

### Versioning strategy
- **URL versioning**: {{/api/v1/}}, {{/api/v2/}} (khuyên dùng, rõ ràng).
- **Header versioning**: {{Accept: application/vnd.bank.v2+json}} (clean URL, khó test).
- **Deprecation policy**: Hỗ trợ phiên bản cũ tối thiểu 12 tháng, header {{Sunset}}, {{Deprecation}}.

> Senior tip: **Đừng generate client SDK cho partner từ code** — generate từ **spec đã review & baseline**. Dùng {{buf}} (Protobuf) hoặc {{oasdiff}} (OpenAPI) trong CI để catch breaking change sớm. Khai báo response lỗi kiểu {{ProblemDetail}} (springdoc đọc được @ExceptionHandler trong @ControllerAdvice) để spec có schema lỗi thống nhất. Doc portal (Redocly/Stoplight) deploy tự động từ {{main}} branch — partner luôn thấy spec mới nhất.`,
    follow: [
      'Consumer-driven contract (Pact) vs Provider-driven (OpenAPI) khác nhau như thế nào?',
      'Làm sao version API khi có multiple team deploy độc lập (monorepo vs polyrepo)?'
    ],
    tags: ['OpenAPI', 'API First', 'Contract Test', 'springdoc', 'CI/CD', 'Breaking Change']
  },
  {
    id: 'api-015',
    topic: 'api',
    level: 'mid',
    q: 'POST /payments không idempotent: khách bấm "Thanh toán" hai lần hoặc mobile retry sau timeout. Thiết kế Idempotency-Key để không trừ tiền hai lần — lưu ở đâu, xử lý request song song, TTL bao lâu?',
    a: `**Tóm tắt:** Client sinh một {{Idempotency-Key}} (UUID) cho mỗi lần thanh toán và **giữ nguyên** key khi retry. Server lưu key + fingerprint của request + response đã trả; request thứ hai cùng key được **replay response cũ**, không gọi lại PSP/lõi thẻ. Unique index trên {{(merchant_id, idempotency_key)}} trong PostgreSQL là cơ chế chống race, TTL thường 24 giờ.

### Vì sao không thể dựa vào HTTP
- POST **không idempotent** theo RFC 9110: gửi lại nghĩa là tạo thêm giao dịch.
- Timeout không cho biết server đã xử lý hay chưa: client thấy lỗi mạng, PSP đã trừ tiền, retry mù = trừ hai lần.
- {{Idempotency-Key}} đang được chuẩn hóa (IETF draft) và đã được Stripe, PayPal, Adyen dùng. Key do **client** sinh vì chỉ client biết hai request là cùng một ý định.

### Bảng trạng thái
| Trạng thái record | Request mới cùng key | Trả về |
|---|---|---|
| IN_PROGRESS | Đến khi request đầu chưa xong | 409 Conflict kèm Retry-After ngắn |
| COMPLETED | Bất kỳ lúc nào trong TTL | Replay đúng status + body cũ |
| FAILED (lỗi nghiệp vụ đã chốt) | Trong TTL | Replay lỗi cũ, không thử lại |
| Không có | Request đầu tiên | 200/201 + lưu kết quả |

> Chỉ **lỗi hệ thống** (5xx, timeout khi gọi PSP) mới nên cho phép thử lại cùng key; lỗi nghiệp vụ đã chốt thì replay nguyên trạng.

### Lưu ở đâu
~~~sql
create table payment_idempotency (
  merchant_id      varchar(32)  not null,
  idem_key         varchar(64)  not null,
  request_hash     char(64)     not null,   -- SHA-256 của method + path + body
  status           varchar(16)  not null,   -- IN_PROGRESS | COMPLETED | FAILED
  response_status  int,
  response_body    jsonb,
  created_at       timestamptz  not null default now(),
  primary key (merchant_id, idem_key)
);
create index on payment_idempotency (created_at);  -- job dọn dữ liệu cũ
~~~

### Luồng xử lý (insert-first)
1. **Reserve**: {{insert ... on conflict do nothing}}. Nếu insert được 0 dòng, đọc record cũ và so {{request_hash}}.
2. Hash khác → 422: client dùng lại key cho payload khác, không được replay nhầm.
3. Record đang IN_PROGRESS → 409 để client backoff, hoặc chờ ngắn rồi đọc lại.
4. Record COMPLETED → trả lại đúng status/body cũ, thêm header {{Idempotent-Replayed: true}}.
5. Nếu là request đầu: gọi PSP (truyền **cùng key** xuống PSP nếu họ hỗ trợ), ghi kết quả, đổi status.

~~~java
// reserve/complete là 2 transaction ngắn; KHÔNG giữ transaction trong lúc gọi PSP
public ResponseEntity<String> pay(String key, PayRequest req) {
    String hash = sha256(canonicalJson(req));
    int inserted = repo.reserve(merchantId, key, hash);   // INSERT ... ON CONFLICT DO NOTHING
    if (inserted == 0) {
        IdemRow row = repo.find(merchantId, key);
        if (!row.requestHash.equals(hash)) {
            return ResponseEntity.unprocessableEntity().body("key reused with different payload");
        }
        if ("IN_PROGRESS".equals(row.status)) {
            return ResponseEntity.status(409).header("Retry-After", "1").build();
        }
        return ResponseEntity.status(row.responseStatus)
                .header("Idempotent-Replayed", "true").body(row.responseBody);
    }
    try {
        PspResult r = psp.charge(req, key);               // idempotent ở cả phía PSP
        repo.complete(merchantId, key, r.status(), r.body());
        return ResponseEntity.status(r.status()).body(r.body());
    } catch (PspTimeout e) {
        repo.fail(merchantId, key);                        // cho phép retry cùng key
        throw e;
    }
}
~~~

### Pitfall production
- **Ghi key sau khi gọi PSP**: process chết giữa hai bước → tiền đã trừ, key chưa có, retry trừ lần nữa. Luôn reserve trước.
- **Key scope sai**: dùng key toàn cục thay vì theo merchant/API key → hai merchant trùng UUID là hiếm nhưng vẫn có, và một merchant có thể đọc response của merchant khác.
- **Không hash body**: client dùng lại key cho đơn khác, server replay đơn cũ → trừ tiền oan và rất khó truy vết.
- **TTL quá ngắn**: đối tác có thể retry tới 24 giờ; đặt TTL 7 ngày an toàn hơn, dọn bằng job theo batch để không khóa bảng.
- **Retry tự động bên trong**: không được tự retry 5xx khi chưa chắc PSP đã xử lý; retry phải đi qua cùng key.
- **Record IN_PROGRESS bị treo**: process chết sau reserve nhưng trước khi ghi kết quả. Dùng lease ngắn và job đối soát trạng thái với PSP; không tự động gọi lại PSP cho record đang treo.

> Senior tip: Ở cổng thanh toán lớn, bảng idempotency tăng vài triệu dòng/ngày — partition theo tháng và drop partition cũ thay vì DELETE. Theo dõi tỉ lệ {{Idempotent-Replayed}}: tăng vọt thường là dấu hiệu client timeout hàng loạt hoặc PSP chậm, không phải bug idempotency. Với chuyển tiền nội bộ, dùng thêm **reference id do hệ thống sinh** và đối soát cuối ngày để bắt các ca "đã trừ nhưng response mất".`,
    follow: [
      'Nếu PSP không hỗ trợ idempotency key thì xử lý thế nào?',
      'Idempotency-Key nên gắn với user session hay với ý định thanh toán? Vì sao?'
    ],
    tags: ['Idempotency', 'Payment', 'POST', 'Distributed', 'PostgreSQL']
  },
  {
    id: 'api-016',
    topic: 'api',
    level: 'mid',
    q: 'API công khai cho đối tác cần đổi schema. Chọn versioning URI hay header? Quy trình deprecation và sunset một version sao cho không làm sập tích hợp của khách hàng?',
    a: `**Tóm tắt:** Chỉ tăng **major version** khi có breaking change. Với API public cho đối tác, URI versioning ({{/v1/}}, {{/v2/}}) thường thắng vì dễ route ở gateway, dễ đọc trong log/metric, dễ test bằng curl; header/media-type versioning "sạch" hơn về REST nhưng đòi hỏi {{Vary}}, gateway predicate và dễ bị proxy/cache bỏ qua. Deprecation là một quy trình có **telemetry, thông báo, thời gian chờ và brownout**, không phải một ngày tắt endpoint.

### URI vs header
| Tiêu chí | URI ({{/v2/accounts}}) | Header / media type |
|---|---|---|
| Debug, log, metric | Rất rõ, tách series theo path | Phải parse header, dễ mất khi qua proxy |
| Cache/CDN | Key tự nhiên theo URL | Cần {{Vary: Accept}} hoặc custom header, dễ cache sai |
| Gateway routing | Prefix match đơn giản | Predicate theo header, cấu hình phức tạp hơn |
| "REST purity" | Bị coi là lẫn version vào resource | Resource ổn định, version nằm ở representation |
| Client SDK | Sinh theo path, dễ hiểu | SDK phải set header mặc định |
| Rủi ro | URL phình version | Client quên header → rơi về version mặc định |

Với API nội bộ giữa các service, tốt nhất là **không version hóa URL**: thêm field optional, giữ tolerant reader (Spring Boot mặc định bỏ qua field lạ), chỉ tạo endpoint mới khi ngữ nghĩa đổi.

### Breaking hay không?
- **Breaking**: xóa/đổi tên field, đổi type, thêm field **bắt buộc** trong request, đổi status code, siết validation, đổi ý nghĩa đơn vị (VND → USD), đổi cách phân trang.
- **Không breaking**: thêm field optional vào response, thêm endpoint, thêm enum value **nếu client đã được dặn chịu được giá trị lạ** (nhiều client switch-case cứng nên thực tế vẫn phải thông báo trước).
- Đổi default (page size, timezone, cách làm tròn) cũng là breaking dù schema không đổi — đây là loại hay bị bỏ sót nhất.

### Vòng đời deprecation
~~~text
T0  thông báo + ghi tài liệu + email/portal cho đối tác
T0  response của /v1 thêm header Deprecation + Sunset + Link tới migration guide
T1  (song song) /v2 chạy ổn định, có parity test giữa hai version
T2  brownout: /v1 trả 503/410 theo cửa sổ ngắn (ví dụ 5 phút mỗi giờ) để buộc client lộ ra
T3  đo usage theo consumer; chỉ sunset khi không còn traffic quan trọng
T4  tắt hẳn, giữ 410 Gone + Link migration ít nhất một chu kỳ
~~~

- Header gợi ý: {{Deprecation}} (RFC 9745), {{Sunset}} (RFC 8594, HTTP-date), {{Link: <https://api.bank.vn/migrate/v2>; rel="deprecation"}}.
- Đừng trả 404 ngay: 404 khiến client tưởng endpoint chưa từng tồn tại (URL sai, lệnh gọi vào môi trường chưa có route) và không biết phải làm tiếp thế nào; 410 Gone nói rõ "đã bỏ vĩnh viễn", kèm Link dẫn tới migration guide.

~~~java
// Spring MVC: cùng logic, hai mặt tiền version
@RestController
@RequestMapping({"/v1/accounts", "/v2/accounts"})
class AccountController {
    @GetMapping("/{id}")
    AccountDtoV2 get(@PathVariable long id,
                     @RequestHeader(value = "X-Api-Version", required = false) String v) {
        AccountDtoV2 dto = service.get(id);                    // v2 là canonical
        return "1".equals(v) ? dto.withoutNewFields() : dto;  // facade giữ shape cũ
    }
}
~~~

Trong thực tế nên tách controller/facade theo version và dùng chung service; đừng rải điều kiện {{if v1}} khắp code.

### Đo lường trước khi tắt
- Đếm request theo {{api_key}} + version trong access log/Micrometer; dashboard "consumer còn gọi v1".
- Với đối tác lớn: thỏa thuận ngày sunset bằng văn bản; giữ ngoại lệ có thời hạn thay vì trì hoãn cả hệ thống.
- Theo dõi 4xx tăng sau khi đổi default — dấu hiệu client phụ thuộc hành vi cũ.

> Senior tip: Ngân hàng thường cam kết hỗ trợ 12–24 tháng cho API đối tác, nhưng chi phí thật nằm ở **hai bộ test và hai bug surface**. Cách giảm: giữ version cũ như một **adapter mỏng** trên model mới (map field, không copy business logic), và bật brownout sớm — đội đối tác sẽ migrate nhanh hơn nhiều so với email nhắc nhở. Đừng để client không gửi version rơi vào "latest" một cách âm thầm; hãy ghim về một version mặc định đã công bố.`,
    follow: [
      'Versioning bằng media type có thật sự "sạch" hơn URI khi vận hành không?',
      'Làm sao phát hiện breaking change tự động trong CI?'
    ],
    tags: ['API Versioning', 'Deprecation', 'Sunset', 'Gateway', 'Compatibility']
  },
  {
    id: 'api-017',
    topic: 'api',
    level: 'senior',
    q: 'Bảng transactions có 80 triệu dòng, API lịch sử giao dịch cần phân trang ổn định khi có insert liên tục. Thiết kế cursor (keyset) pagination: SQL, index, định dạng cursor, và các cạm bẫy khiến client thấy trùng hoặc mất dòng?',
    a: `**Tóm tắt:** Cursor pagination nghĩa là "lấy tiếp sau bản ghi cuối cùng đã thấy", dùng keyset {{WHERE (created_at, id) < (?, ?) ORDER BY created_at DESC, id DESC LIMIT ?}}. Không có OFFSET nên chi phí mỗi trang là O(log n + page size) và kết quả ổn định khi có insert. Cursor phải **opaque + ký**, mang đúng độ chính xác của cột sắp xếp, và gắn với bộ lọc/sort đã dùng.

### Vì sao OFFSET chết ở trang sâu
~~~sql
-- Trang 5000: PostgreSQL vẫn phải đi qua 100.000 dòng index rồi bỏ
select id, created_at, amount, status
from transactions
where account_id = 42
order by created_at desc, id desc
offset 100000 limit 20;
~~~
- Chi phí tăng tuyến tính theo offset, p99 nổ ở trang sâu.
- Insert/delete giữa hai lần gọi làm dòng **dịch chỗ**: client thấy trùng hoặc mất dòng.
- UI infinite scroll chỉ cần next, không cần nhảy trang, nên OFFSET không đem lại gì.

### Keyset SQL
~~~sql
create index idx_txn_acct_created_id
  on transactions (account_id, created_at desc, id desc);

-- Trang đầu
select id, created_at, amount, status
from transactions
where account_id = :acct
order by created_at desc, id desc
limit :size + 1;              -- lấy dư 1 để biết has_more

-- Trang tiếp: row-wise comparison, dùng đúng composite index
select id, created_at, amount, status
from transactions
where account_id = :acct
  and (created_at, id) < (:cursorTs, :cursorId)
order by created_at desc, id desc
limit :size + 1;
~~~

PostgreSQL so sánh row-wise theo đúng thứ tự cột và dùng được composite index. {{id}} là tie-breaker bắt buộc: nhiều giao dịch cùng {{created_at}} (batch import) sẽ bị nhảy hoặc lặp nếu cursor chỉ có timestamp.

### Định dạng cursor
~~~java
record Cursor(Instant createdAt, long id, String filterHash) {}

String encode(Cursor c) throws Exception {
    String json = mapper.writeValueAsString(c);
    String body = Base64.getUrlEncoder().withoutPadding()
                        .encodeToString(json.getBytes(StandardCharsets.UTF_8));
    return body + "." + hmacSha256(body, cursorSecret);   // chống sửa cursor
}
~~~
- **Opaque**: client không được tự dựng cursor; để lộ base64 của id là mở đường cho client dò dữ liệu tài khoản khác.
- **Ký HMAC**: nếu không ký, client có thể sửa timestamp/id để đọc vượt phạm vi.
- **filterHash**: hash của (accountId, from, to, status, sort). Cursor của bộ lọc A dùng cho bộ lọc B sẽ trả kết quả vô nghĩa; server phải từ chối bằng 400.
- Trả {{next_cursor}} và {{has_more}}; không trả {{total}} trừ khi có yêu cầu thật.

### Những cạm bẫy làm trùng hoặc mất dòng
| Cạm bẫy | Hậu quả | Cách tránh |
|---|---|---|
| Cursor chỉ có timestamp | Mất dòng cùng giây/microsecond | Thêm id làm tie-breaker |
| Mất độ chính xác thời gian | Postgres lưu microsecond, JS Date chỉ milli → lệch | Serialize epoch micro hoặc chuỗi ISO đầy đủ |
| Sort theo cột bị update | Dòng nhảy sang trang khác | Sort theo cột immutable, hoặc ghi rõ hệ quả |
| Trộn OFFSET với cursor | Trang sâu vẫn chậm, vẫn lệch | Chọn một cơ chế |
| Page size không giới hạn | {{size=100000}} gây OOM/DoS | Cap 100, validate input |
| Cursor sống quá lâu | Dữ liệu đã đổi nhiều | TTL 24h, trả 400 kèm hướng dẫn |

### Đếm tổng và prev page
- Đừng chạy {{count(*)}} mỗi trang. Nếu UI cần, dùng ước lượng ({{reltuples}} sau ANALYZE) hoặc job count chạy nền.
- Prev page: đảo điều kiện và đảo thứ tự rồi reverse kết quả; hoặc trả cả {{prev_cursor}}.
- Với export toàn bộ: chạy trong transaction {{repeatable read}} hoặc snapshot để các trang nhất quán.

> Senior tip: Hãy test phân trang bằng cách chèn dữ liệu **trong lúc** client đang lật trang — đó là lúc bug lộ ra. Spring Data 3.1+ có {{Window}} và {{ScrollPosition}} để bớt phải tự viết SQL, nhưng phần ký cursor và filterHash vẫn phải tự lo. Đừng đưa cursor vào query string rồi log nguyên văn nếu nó chứa dữ liệu nhạy cảm; hãy ký và mã hóa đủ để lộ cũng vô hại.`,
    follow: [
      'Keyset pagination hỗ trợ sắp xếp theo nhiều cột động như thế nào?',
      'Làm sao phân trang ổn định khi sort theo cột có thể NULL?'
    ],
    tags: ['Pagination', 'Cursor', 'Keyset', 'PostgreSQL', 'Index']
  },
  {
    id: 'api-018',
    topic: 'api',
    level: 'senior',
    q: 'Thiết kế error model cho API ngân hàng trên Spring Boot 3 theo RFC 9457 Problem Details: type/title/detail/instance, lỗi validation nhiều field, lỗi nghiệp vụ và 5xx — làm sao để client xử lý bằng máy mà không phải parse chuỗi?',
    a: `**Tóm tắt:** RFC 9457 (thay RFC 7807) định nghĩa body lỗi chuẩn {{application/problem+json}} với {{type}} (URI định danh loại lỗi), {{title}}, {{status}}, {{detail}}, {{instance}}, cộng các field mở rộng. Spring Boot 3 có sẵn class {{ProblemDetail}}; bật {{spring.mvc.problemdetails.enabled=true}} để exception của framework cũng trả cùng format. Client nên switch trên {{type}} + {{status}}, không bao giờ parse {{detail}}.

### Vì sao cần chuẩn
- Mỗi team tự định nghĩa {{code}}/{{message}}/{{errorCode}} → SDK đối tác phải xử lý N format.
- {{detail}} là văn bản cho người, có thể đổi ngôn ngữ, không phải hợp đồng.
- {{type}} là **mã lỗi máy đọc được**, ổn định, có thể trỏ tới trang tài liệu giải thích cách sửa.

~~~json
HTTP/1.1 422 Unprocessable Content
Content-Type: application/problem+json

{
  "type": "https://api.bank.vn/problems/insufficient-funds",
  "title": "Số dư không đủ",
  "status": 422,
  "detail": "Tài khoản 0123456 cần 5.200.000 VND nhưng chỉ còn 5.000.000 VND.",
  "instance": "/v1/transfers/9f2c",
  "traceId": "4bf92f3577b34da6",
  "balance": 5000000,
  "required": 5200000
}
~~~

### Spring Boot 3: cấu hình và handler
~~~yaml
spring:
  mvc:
    problemdetails:
      enabled: true   # framework exception (404, 405, lỗi binding) -> problem+json
~~~

~~~java
@RestControllerAdvice
class ApiExceptionHandler extends ResponseEntityExceptionHandler {

    @ExceptionHandler(InsufficientFundsException.class)
    ProblemDetail insufficient(InsufficientFundsException e) {
        ProblemDetail p = ProblemDetail.forStatusAndDetail(
                HttpStatus.UNPROCESSABLE_ENTITY, e.getMessage());
        p.setType(URI.create("https://api.bank.vn/problems/insufficient-funds"));
        p.setTitle("Số dư không đủ");
        p.setInstance(URI.create("/v1/transfers/" + e.transferId()));
        p.setProperty("balance", e.balance());      // extension member
        p.setProperty("required", e.required());
        p.setProperty("traceId", MDC.get("traceId"));
        return p;                                    // Spring tự set status + content-type
    }

    @Override   // lỗi @Valid: gom theo field
    protected ResponseEntity<Object> handleMethodArgumentNotValid(
            MethodArgumentNotValidException ex, HttpHeaders h,
            HttpStatusCode code, WebRequest req) {
        ProblemDetail p = ProblemDetail.forStatusAndDetail(
                HttpStatus.BAD_REQUEST, "Dữ liệu không hợp lệ");
        p.setType(URI.create("https://api.bank.vn/problems/validation-failed"));
        p.setProperty("errors", ex.getBindingResult().getFieldErrors().stream()
                .map(f -> Map.of("field", f.getField(), "message", f.getDefaultMessage()))
                .toList());
        return ResponseEntity.badRequest()
                .contentType(MediaType.APPLICATION_PROBLEM_JSON).body(p);
    }
}
~~~

### Phân loại lỗi
| Nhóm | Status | type ví dụ | Ghi chú |
|---|---|---|---|
| Validation | 400 | validation-failed | Kèm mảng {{errors}} theo field |
| Authn | 401 | unauthenticated | Kèm {{WWW-Authenticate}}, không tiết lộ chi tiết token |
| Authz | 403 | forbidden | Không nói tài nguyên có tồn tại hay không |
| Không tìm thấy | 404 | not-found | |
| Xung đột nghiệp vụ | 409/422 | duplicate-transfer, insufficient-funds | Mỗi case một type riêng |
| Quá tải | 429 | rate-limited | Kèm {{Retry-After}} |
| Hệ thống | 500 | internal-error | detail chung chung, không lộ stack/SQL |

### Quy tắc nội dung
- {{detail}} nói **người dùng cần làm gì**, không lộ tên bảng, câu SQL, stack trace, hostname.
- 5xx: log đầy đủ ở server, trả {{traceId}} để support tra cứu; không trả exception message.
- 401 phải kèm header {{WWW-Authenticate}}; 405 kèm {{Allow}}; 429 kèm {{Retry-After}}.
- Đa ngôn ngữ: giữ {{type}} cố định, dịch {{title}}/{{detail}} bằng MessageSource theo {{Accept-Language}}.
- Trang tài liệu cho từng {{type}} URL: đối tác đọc được cách xử lý, giảm ticket support.

### Pitfall
- **Trộn hai format**: endpoint mới trả problem+json, endpoint cũ trả {{error/message}} → SDK phải parse hai kiểu. Chuyển đổi có version, công bố rõ.
- **Status trong body khác HTTP status** (body 500 nhưng HTTP 200, hoặc ngược lại) → client tin cái nào? Luôn khớp.
- **type là URL chết** (404) → mất giá trị tài liệu; host tĩnh trên docs portal.
- **Trả {{errors}} dạng chuỗi nối** → client không highlight được field.
- **Lộ thông tin qua 404/409**: kẻ tấn công dò được mã giao dịch có tồn tại hay không.

> Senior tip: Hãy chốt bộ {{type}} như một **enum trong OpenAPI** và review như public API — thêm type mới là thay đổi hợp đồng cần thông báo. Đặt tên theo **nguyên nhân/hành động** (insufficient-funds, card-expired) chứ không theo tầng (db-error, service-exception): client cần biết phải làm gì, không cần biết lỗi phát sinh ở đâu. Và luôn có một contract test kiểm tra mọi lỗi 4xx/5xx đều là problem+json.`,
    follow: [
      'Làm sao để Spring Security cũng trả problem+json thay vì body mặc định?',
      'Có nên đưa danh sách lỗi validation vào type hay vào extension member?'
    ],
    tags: ['RFC 9457', 'Problem Details', 'Error Handling', 'Spring Boot 3', 'API Design']
  },
  {
    id: 'api-019',
    topic: 'api',
    level: 'senior',
    q: 'Rate limiting cho API công khai chạy nhiều instance sau load balancer: chọn thuật toán nào, đếm ở đâu để không bị "mỗi instance một hạn mức", và trả 429 thế nào cho client đúng chuẩn?',
    a: `**Tóm tắt:** Dùng **token bucket** (cho phép burst có kiểm soát) hoặc sliding-window counter, đếm tập trung trong **Redis bằng Lua script nguyên tử**; mỗi instance chỉ giữ cache cục bộ để chặn sớm. Trả 429 Too Many Requests kèm {{Retry-After}} và các header {{RateLimit-*}}; key theo API key/consumer, không theo IP đơn thuần.

### Chọn thuật toán
| Thuật toán | Burst | Bộ nhớ | Nhược điểm |
|---|---|---|---|
| Fixed window | Cho burst gấp đôi ở ranh giới cửa sổ | 1 counter | 2x limit tại giây chuyển |
| Sliding window log | Chính xác | 1 entry mỗi request trong cửa sổ | Tốn RAM với limit lớn |
| Sliding window counter | Gần đúng, mượt | 2 counter | Sai số nhỏ ở ranh giới |
| **Token bucket** | Đúng bằng capacity | 2 số mỗi key | Cần refill theo thời gian |
| Leaky bucket | Làm phẳng hoàn toàn | 1 hàng đợi | Tăng latency, không hợp API |

Token bucket hợp API nhất: mỗi consumer có {{capacity}} token, nạp {{rate}} token/giây; request tiêu 1 (hoặc nhiều theo "cost"). Nó cho phép client dồn 100 request trong 1 giây rồi nghỉ — đúng hành vi thực tế của batch job.

### Vì sao phải đếm tập trung
Nếu mỗi pod giữ bucket riêng với limit 100/phút và có 10 pod, client thực tế được 1000/phút — hạn mức thành vô nghĩa và phụ thuộc autoscaling. Redis (hoặc gateway dùng Redis) là nguồn sự thật; local bucket chỉ là bộ lọc thô (ví dụ 10% limit) để giảm tải Redis khi bị flood.

### Lua script nguyên tử
~~~lua
-- KEYS[1] = rl:{consumerId}:{endpoint}
-- ARGV = capacity, refillPerSec, nowMs, cost
local cap  = tonumber(ARGV[1])
local rate = tonumber(ARGV[2])
local now  = tonumber(ARGV[3])
local cost = tonumber(ARGV[4])
local d = redis.call('HMGET', KEYS[1], 'tokens', 'ts')
local tokens = tonumber(d[1])
local ts = tonumber(d[2])
if tokens == nil then tokens = cap; ts = now end
local delta = math.max(0, now - ts) / 1000.0
tokens = math.min(cap, tokens + delta * rate)
local allowed = 0
if tokens >= cost then
  tokens = tokens - cost
  allowed = 1
end
redis.call('HSET', KEYS[1], 'tokens', tokens, 'ts', now)
redis.call('PEXPIRE', KEYS[1], math.ceil(cap / rate * 1000) + 60000)
return { allowed, math.floor(tokens) }
~~~
- Toàn bộ read-modify-write nằm trong một lần chạy Lua; Redis đơn luồng nên không có race.
- Đừng làm GET rồi SET từ Java: hai request chen nhau sẽ cùng thấy token còn và cùng cho qua.
- Script chỉ chạm một key nên an toàn trên Redis Cluster.

~~~java
public Decision check(String consumer, String endpoint, int cost) {
    List<?> r = redis.execute(SCRIPT, List.of("rl:" + consumer + ":" + endpoint),
            String.valueOf(capacity), String.valueOf(refillPerSec),
            String.valueOf(clock.millis()), String.valueOf(cost));
    long allowed   = ((Number) r.get(0)).longValue();
    long remaining = ((Number) r.get(1)).longValue();
    return new Decision(allowed == 1, remaining);
}
~~~

### Trả lỗi đúng chuẩn
~~~http
HTTP/1.1 429 Too Many Requests
Retry-After: 7
RateLimit-Limit: 100
RateLimit-Remaining: 0
RateLimit-Reset: 7
Content-Type: application/problem+json

{"type":"https://api.bank.vn/problems/rate-limited","title":"Quá nhiều yêu cầu","status":429}
~~~
- {{Retry-After}} tính bằng giây (hoặc HTTP-date) — client biết chờ bao lâu thay vì retry ngay.
- {{RateLimit-*}} theo IETF draft; nhiều client cũ chỉ đọc {{X-RateLimit-*}}, có thể phát cả hai trong giai đoạn chuyển.
- Client retry phải thêm **jitter**, nếu không toàn bộ client cùng quay lại đúng một giây và tạo sóng thứ hai.

### Key và chính sách
- Key theo **consumer/API key** là chính; thêm chiều theo endpoint và theo user để chặn một tài khoản phá hoại.
- IP chỉ là fallback: NAT công ty, IPv6 /64 khiến nhiều người chung một "IP".
- Cost-based: endpoint nặng (báo cáo, export) tiêu 10 token; endpoint nhẹ tiêu 1.
- Hạn mức khác nhau theo gói dịch vụ; lưu cấu hình theo consumer, không hard-code.

### Khi Redis chết
- API đọc/tra cứu: **fail-open** với local bucket giới hạn chặt — ưu tiên availability.
- Thanh toán/đăng nhập: **fail-closed** hoặc hạn mức local rất thấp — ưu tiên an toàn.
- Ghi rõ quyết định này vào runbook; đừng để on-call tự đoán lúc 2 giờ sáng.

> Senior tip: Rate limit không thay thế **bulkhead** và timeout. Một consumer hợp lệ vẫn có thể đốt hết connection pool; hãy giới hạn đồng thời (semaphore) cho từng loại tài nguyên. Đặt alert trên tỉ lệ 429 theo consumer: tăng đột biến thường là client retry loop hoặc key bị lộ, không phải "hệ thống chậm". Và hãy đo bằng một con số: nếu limit 100/phút thì 1% traffic bị 429 là bình thường, 30% là sự cố cần gọi cho đối tác.`,
    follow: [
      'Rate limit theo user và theo IP nên kết hợp thế nào để chống cả bot lẫn lạm dụng tài khoản?',
      'Có nên đặt rate limit ở gateway hay trong từng service?'
    ],
    tags: ['Rate Limiting', 'Token Bucket', 'Redis', '429', 'Retry-After']
  },
  {
    id: 'api-020',
    topic: 'api',
    level: 'senior',
    q: 'Hai thiết bị cùng sửa một beneficiary: A lưu trước, B ghi đè làm mất thay đổi của A. Thiết kế optimistic concurrency bằng If-Match/@Version trong Spring Boot 3 + JPA, và trả 412/409/428 thế nào để client xử lý đúng?',
    a: `**Tóm tắt:** Mỗi resource có **version tăng đơn điệu** (cột {{@Version}} hoặc service quản lý) và trả về qua {{ETag}}. Client gửi {{If-Match}} khi PUT/PATCH; server chỉ ghi nếu version hiện tại vẫn khớp, ngược lại 412 Precondition Failed. Thiếu If-Match ở endpoint bắt buộc → 428; xung đột ngữ nghĩa nghiệp vụ (trùng mã, sai trạng thái) → 409. Check-and-update phải nằm trong **một câu UPDATE có điều kiện** hoặc transaction có {{@Version}}, không phải "đọc version rồi so sánh trong Java".

### Lost update xảy ra thế nào
~~~text
t0  A GET beneficiary  -> version 7, dailyLimit 10tr
t1  B GET beneficiary  -> version 7, dailyLimit 10tr
t2  A PUT {limit: 20tr} If-Match 7 -> OK, version 8
t3  B PUT {limit: 15tr} If-Match 7 -> phải 412; nếu server bỏ qua If-Match
                                      thì thay đổi 20tr của A biến mất
~~~
Đây là lost update kinh điển; không có version thì "last write wins" một cách âm thầm — với hạn mức chuyển tiền, đó là lỗi nghiệp vụ.

### Ba status code, ba ý nghĩa
| Code | Khi nào | Client làm gì |
|---|---|---|
| 428 Precondition Required | Endpoint yêu cầu If-Match nhưng request không có | Thêm If-Match rồi gọi lại |
| 412 Precondition Failed | If-Match không khớp version hiện tại | GET lại, merge, hỏi người dùng nếu xung đột thật |
| 409 Conflict | Xung đột nghiệp vụ: trùng số beneficiary, sai state machine | Hiển thị lỗi nghiệp vụ, không retry mù |

Đừng dùng 409 cho version mismatch: client không phân biệt được "thử lại sau khi GET" với "nghiệp vụ từ chối".

### Spring Boot 3 + JPA
~~~java
@Entity
class Beneficiary {
    @Id Long id;
    @Version Long version;        // JPA tự tăng, kiểm tra ở flush
    String name;
    BigDecimal dailyLimit;
}
~~~

~~~java
@PutMapping("/beneficiaries/{id}")
public ResponseEntity<?> update(@PathVariable long id,
        @RequestHeader(value = "If-Match", required = false) String ifMatch,
        @Valid @RequestBody BeneficiaryRequest req) {
    if (ifMatch == null) {
        return ResponseEntity.status(428).header("ETag", currentEtag(id))
            .body(problem("precondition-required", 428, "Gửi If-Match với version hiện tại"));
    }
    long expected = parseEtag(ifMatch);          // bỏ W/ và 2 dấu nháy, parse số
    try {
        Beneficiary saved = service.update(id, expected, req);
        String etag = '"' + String.valueOf(saved.getVersion()) + '"';
        return ResponseEntity.ok().eTag(etag).body(saved);
    } catch (OptimisticLockingFailureException e) {
        return ResponseEntity.status(412).eTag(currentEtag(id))
            .body(problem("version-conflict", 412, "Dữ liệu đã thay đổi, hãy tải lại"));
    }
}
~~~

Cách service dùng version mong đợi:
- **Cách A (khuyến nghị)**: câu UPDATE có điều kiện, kiểm tra số dòng:
~~~java
@Modifying(clearAutomatically = true)   // bulk update bỏ qua persistence context
@Query("update Beneficiary b set b.name = :name, b.dailyLimit = :limit, " +
       "b.version = b.version + 1 where b.id = :id and b.version = :expected")
int updateIfVersion(long id, long expected, String name, BigDecimal limit);
~~~
  Trả 0 dòng → ném {{OptimisticLockingFailureException}}. Một câu lệnh, atomic, không có cửa sổ race.
- **Cách B**: load entity trong transaction, set field, để {{@Version}} kiểm tra lúc flush/commit. Gọn hơn nhưng entity phải được load **trong cùng transaction** với lần ghi, và exception chỉ ném ở commit.

### Pitfall
- **Đọc version ở controller rồi so sánh**: hai request vẫn có thể chen giữa lúc so và lúc ghi. Phải để DB làm trọng tài.
- **ETag sinh từ {{hashCode()}} hoặc serialize JSON**: thứ tự field/map thay đổi giữa các lần chạy → 412 giả. Dùng version số hoặc hash **ổn định** của nội dung.
- **ETag lấy từ cột updated_at độ chính xác giây**: hai update trong cùng giây dùng chung ETag → mất một thay đổi. Dùng microsecond hoặc version counter.
- **Quên trả ETag sau khi ghi**: client không có version mới, lần sau chắc chắn 412.
- **{{If-Match: *}}**: nghĩa là "resource phải tồn tại", không phải "khớp mọi version"; đừng dùng cho update.
- **Multi-instance**: version trong DB hoạt động cluster-wide; cache version trong memory thì không.

### Client xử lý 412 cho tử tế
- GET lại, so với bản local; nếu hai bên sửa **field khác nhau** thì merge tự động rồi PUT với version mới.
- Nếu cùng field → hiện diff cho người dùng chọn, không tự ghi đè.
- Retry có backoff + giới hạn số lần; mỗi lần retry phải GET lại, không giữ If-Match cũ.
- Với PATCH từng phần, cân nhắc JSON Merge Patch và vẫn giữ If-Match; JSON Patch có op "test" nhưng không thay thế được version check ở DB.

> Senior tip: Với dữ liệu tiền, tôi thường **không** cho client chọn "ghi đè" khi 412 — bắt buộc tải lại và xác nhận. Đo tỉ lệ 412 theo endpoint: cao bất thường nghĩa là UI cache quá lâu hoặc nhiều tab cùng sửa. Và đừng dùng pessimistic lock cho form người dùng: giữ row lock qua một request HTTP là cách nhanh nhất để cạn connection pool.`,
    follow: [
      'Khi nào optimistic locking không đủ và phải dùng pessimistic lock?',
      'Làm sao trả 412 kèm đủ thông tin để client tự merge?'
    ],
    tags: ['Optimistic Locking', 'ETag', 'If-Match', 'JPA', 'Concurrency']
  },
  {
    id: 'api-021',
    topic: 'api',
    level: 'lead',
    q: 'Với hệ thống gồm app mobile, web admin, đối tác ngân hàng và 30 microservice nội bộ: khi nào chọn REST, gRPC, GraphQL cho từng biên? Vẽ kiến trúc protocol và nêu chi phí vận hành của việc nuôi nhiều protocol cùng lúc.',
    a: `**Tóm tắt:** Chọn protocol theo **biên**, không theo sở thích: đối tác/public dùng REST + JSON + OpenAPI (tương thích firewall, cache, debug, SDK rộng); service nội bộ đồng bộ dùng gRPC (schema chặt, payload nhỏ, streaming, deadline lan truyền); client đa dạng cần tổng hợp dữ liệu dùng GraphQL ở tầng BFF. Kiến trúc thực tế là **hybrid**: mobile/web → BFF → gRPC nội bộ → Kafka cho bất đồng bộ. Cái giá là ba bộ tooling, ba cách version và ba cách quan sát — chỉ đáng khi mỗi biên có lý do rõ ràng.

### Bảng chọn theo biên
| Biên | Chọn | Vì sao | Không chọn gì |
|---|---|---|---|
| Đối tác ngân hàng | REST/JSON, OpenAPI | Firewall mở 443, curl được, SDK mọi ngôn ngữ, dễ cache | gRPC (nhiều đối tác không có HTTP/2 client), GraphQL (khó giới hạn chi phí) |
| Mobile app | REST hoặc GraphQL BFF | GraphQL giảm over-fetching cho màn hình phức tạp | gRPC trực tiếp (cần gRPC-Web + proxy) |
| Web admin | REST | CRUD đơn giản, cache HTTP, ít query đa dạng | GraphQL nếu màn hình thật sự phức tạp |
| Service nội bộ sync | gRPC | Protobuf nhỏ, HTTP/2 multiplex, deadline, codegen | REST/JSON cho high-throughput |
| Service nội bộ async | Kafka (event) | Decouple, replay, backpressure | Gọi sync dây chuyền |
| Tích hợp đối tác realtime | Webhook hoặc SSE | Đơn giản, qua được proxy | GraphQL subscription |

### Kiến trúc tham chiếu
~~~text
Android/iOS ──┐
              ├─► API Gateway ──► GraphQL BFF ──┐
Web admin ────┘        │                        ├─► account-svc (gRPC)
                       └─► REST /v1 (admin) ────┤
Partner ──► API Gateway ──► REST /partner/v1 ───┤─► transfer-svc (gRPC)
                                                └─► ledger-svc (gRPC)
                                                          │
                                                    Kafka (events)
~~~
- BFF (Backend for Frontend) giữ **schema theo màn hình**, gọi nhiều service gRPC phía sau, gộp và cắt field.
- Gateway làm authn, rate limit, routing; có thể transcoding gRPC-JSON cho vài client đặc biệt nhưng đừng biến nó thành lớp dịch phức tạp.

### gRPC: được gì, mất gì
- Được: file {{.proto}} là hợp đồng và sinh code; payload nhỏ hơn JSON đáng kể; multiplexing trên một connection; streaming hai chiều; deadline tự lan truyền qua metadata.
- Mất: debug bằng mắt khó (cần grpcurl), browser phải qua gRPC-Web proxy, load balancing cần L7 hiểu HTTP/2 (mesh hoặc client-side LB), CDN/cache gần như không dùng được, lỗi trả về là status code số + detail nhị phân.
- Tiến hóa schema: chỉ thêm field với number mới, **reserve** number/name đã xóa, không đổi type; đây là kỷ luật bắt buộc, không phải tùy chọn.

### GraphQL: được gì, mất gì
- Được: client tự chọn field, một request cho nhiều resource, giảm kiểu versioning "v2 vì mobile cần thêm field".
- Mất: N+1 nếu resolver ngây thơ (phải batch/DataLoader), query độc hại có thể đắt gấp nghìn lần (phải giới hạn depth/complexity, timeout, persisted query), cache HTTP khó (chỉ cache được persisted GET), authorization phải kiểm ở **từng field**, observability phải theo field.
- Federation hợp cho nhiều team sở hữu schema, nhưng gateway federation là một hệ thống riêng cần người trực.

### REST: đừng bỏ khi chưa cần
- REST thắng ở tính phổ quát: cache, CDN, HTTP semantics, tooling, người mới đọc hiểu ngay.
- Nhược điểm thật: chatty khi một màn hình cần 8 resource, over-fetching, streaming phải bọc bằng SSE/WebSocket riêng chứ không native như gRPC.
- Nếu chỉ có một client và CRUD, REST là lựa chọn rẻ nhất để vận hành đúng.

### Chi phí vận hành nhiều protocol (lead phải nói)
1. **Quan sát**: trace phải xuyên qua HTTP/JSON, gRPC (metadata) và GraphQL (field-level) — chuẩn hóa W3C traceparent + OpenTelemetry, không tự chế.
2. **Định danh và phân quyền**: cùng một danh tính nhưng ba cách truyền (Bearer header, gRPC metadata, GraphQL context) → một thư viện dùng chung.
3. **Versioning**: REST dùng URI/header, gRPC dùng field number, GraphQL dùng deprecation field — viết guideline riêng cho từng cái.
4. **Test**: contract test cho REST (OpenAPI), buf breaking cho proto, persisted query cho GraphQL.
5. **Con người**: đội trực phải debug được cả ba; nếu không, sự cố sẽ kéo dài.

### Cách migrate không big-bang
- Đặt gateway trước, chuyển từng route (strangler), chạy song song, so sánh kết quả (shadow traffic) trước khi cắt.
- Bắt đầu bằng **một** protocol mới ở một biên có pain rõ ràng; đừng chuyển toàn bộ chỉ vì "gRPC nhanh hơn".

> Senior tip: Trong ngân hàng, ràng buộc lớn nhất thường không phải hiệu năng mà là **khả năng chứng minh tuân thủ và debug khi có sự cố**. REST/JSON để lại access log đọc được, đó là lý do nó vẫn là mặc định ở biên đối tác. gRPC tiết kiệm payload thật (thường thấy 30–60% với DTO lớn) nhưng chỉ đáng ở nội bộ nơi bạn kiểm soát toàn bộ client. GraphQL chỉ nên xuất hiện khi số màn hình và biến thể client đủ lớn để chi phí N+1/complexity được bù lại.`,
    follow: [
      'GraphQL BFF nên gọi REST hay gRPC phía sau? Vì sao?',
      'Làm sao giữ trace xuyên suốt khi client dùng GraphQL và backend dùng gRPC?'
    ],
    tags: ['REST', 'gRPC', 'GraphQL', 'Architecture', 'BFF', 'Protocol']
  },
  {
    id: 'api-022',
    topic: 'api',
    level: 'lead',
    q: 'Bạn là bên **nhận** webhook từ ngân hàng đối tác: họ giao at-least-once, có thể gửi trùng, gửi sai thứ tự, retry trong 72 giờ. Thiết kế endpoint nhận đảm bảo không xử lý trùng, không mất event, và không bị retry storm làm sập hệ thống.',
    a: `**Tóm tắt:** Nhận webhook phải **ack nhanh, xử lý sau**: xác thực chữ ký trên raw body, ghi event vào bảng có unique {{(provider, event_id)}} (insert-first để chặn trùng), trả 2xx trong khoảng 1 giây, rồi xử lý bất đồng bộ. Mọi xử lý phải idempotent; lỗi tạm thời đẩy vào DLQ nội bộ và retry theo lịch của mình, không phụ thuộc vào việc để đối tác retry. Đừng tin thứ tự event — hãy dùng version/sequence hoặc gọi lại API đối tác để lấy trạng thái chuẩn.

### Vì sao at-least-once là bài toán của **bạn**
Bên gửi chỉ cam kết "giao ít nhất một lần": timeout, mất ACK, deploy giữa lúc gửi đều tạo bản trùng. Nếu endpoint xử lý đồng bộ 5 giây, đối tác timeout sau 3 giây và retry → hai worker cùng cộng tiền. Vì vậy kiến trúc đúng là:

~~~text
POST /webhooks/bank
  │
  ├─ 1. verify HMAC + timestamp + key id        (rẻ, đồng bộ)
  ├─ 2. INSERT event (unique provider+event_id) ← chặn trùng ở DB
  ├─ 3. trả 200/202 ngay (chưa xử lý nghiệp vụ)
  │
  └─ worker (async, retry riêng)
        ├─ xử lý idempotent theo event_id
        ├─ lỗi tạm thời → retry backoff
        └─ lỗi vĩnh viễn → DLQ + alert
~~~

### Xác thực chữ ký đúng cách
- Ký trên **raw body bytes** nhận được, không phải object đã parse rồi serialize lại (thứ tự field/khoảng trắng đổi là chữ ký sai).
- So sánh **constant-time** ({{MessageDigest.isEqual}}), không dùng {{equals}} chuỗi.
- Kiểm tra timestamp trong cửa sổ ±5 phút để chặn replay; kết hợp lưu {{event_id}} đã thấy.
- Hỗ trợ **key rotation**: header chứa key id, server giữ hai secret cùng lúc; nếu chỉ một secret, ngày đối tác xoay key là ngày bạn mất event.
- Trả 401 khi chữ ký sai, và **không** log raw body chứa dữ liệu khách hàng.

~~~java
@PostMapping("/webhooks/bank")
public ResponseEntity<Void> receive(
        @RequestHeader("X-Signature") String sig,
        @RequestHeader("X-Timestamp") long ts,
        @RequestHeader("X-Key-Id") String keyId,
        @RequestBody byte[] raw) {

    if (Math.abs(clock.millis() - ts) > Duration.ofMinutes(5).toMillis()) {
        return ResponseEntity.badRequest().build();
    }
    if (!verifier.valid(keyId, ts, raw, sig)) {            // HMAC-SHA256, constant-time
        return ResponseEntity.status(401).build();
    }
    try {
        inbox.insertIfAbsent(provider, eventIdOf(raw), raw);   // unique constraint
    } catch (DuplicateKeyException dup) {
        return ResponseEntity.ok().build();                // đã nhận trước đó, ack lại
    }
    worker.wakeUp();                                       // xử lý async
    return ResponseEntity.accepted().build();
}
~~~

### Chống trùng ở tầng DB, không ở tầng code
- {{existsBy... rồi save}} có race: hai request song song cùng thấy chưa tồn tại.
- Dùng unique index {{(provider_id, event_id)}} và bắt {{DuplicateKeyException}} — DB là trọng tài.
- Bảng inbox lưu cả trạng thái: RECEIVED, PROCESSING, DONE, FAILED, kèm số lần thử và lỗi cuối.
- Nếu payload đến trước khi bản ghi nghiệp vụ tồn tại (event về nhanh hơn transaction tạo đơn), worker retry có backoff thay vì đánh FAILED ngay.

### Thứ tự event
- Không giả định event tới đúng thứ tự. Dùng {{sequence}}/{{version}} của đối tác: chỉ áp dụng nếu lớn hơn version đang lưu, bỏ qua bản cũ.
- Với state machine (PENDING → PAID → REFUNDED), kiểm tra transition hợp lệ; transition lùi là dấu hiệu out-of-order, cần đối soát.
- Cách chắc nhất: khi nghi ngờ, gọi API đối tác lấy trạng thái hiện tại (source of truth) thay vì suy luận từ chuỗi event.

### 2xx, 4xx hay 5xx?
| Tình huống | Trả | Lý do |
|---|---|---|
| Đã ghi inbox thành công | 200/202 | Đối tác dừng retry |
| Trùng event | 200 | Vẫn là "đã nhận", tránh retry vô ích |
| Chữ ký sai / thiếu header | 401/400 | Lỗi cấu hình, cần lộ ra |
| Payload sai schema | 400 | Đối tác cần sửa, retry không giúp |
| DB/Redis tạm thời lỗi | 5xx | Để đối tác retry theo lịch của họ |
| Nghiệp vụ từ chối (đơn không tồn tại) | 200 + DLQ nội bộ | Tránh retry storm 72 giờ vô nghĩa |

### Vận hành
- Alert trên: độ sâu DLQ, tuổi event lâu nhất chưa DONE, tỉ lệ chữ ký sai, tỉ lệ trùng.
- Rate limit riêng cho endpoint webhook theo provider — retry storm là chuyện sẽ xảy ra, phải có van.
- Đối soát cuối ngày với sao kê/ledger đối tác để bắt event bị mất hoàn toàn (at-least-once không bảo đảm không mất nếu bên gửi bỏ cuộc).
- Load test bằng cách replay 10.000 event trùng trong 1 phút: hệ thống đúng phải ack hết mà không tạo bút toán trùng.

> Senior tip: Đừng bao giờ để endpoint webhook gọi thẳng service nghiệp vụ nặng. Tôi đã thấy một đợt retry của đối tác biến 3.000 event thành 40.000 request trong 10 phút và làm nghẽn luôn API người dùng — vì endpoint vừa xử lý đồng bộ vừa không có rate limit. Inbox + worker + DLQ là mô hình tối thiểu; phần khó nhất không phải code mà là **đối soát**: phải có job so khớp với đối tác, nếu không bạn chỉ biết mất event khi khách hàng gọi lên.`,
    follow: [
      'Nếu đối tác không gửi sequence thì làm sao xử lý out-of-order?',
      'Webhook receiver nên dùng chung hàng đợi với event nội bộ hay tách riêng?'
    ],
    tags: ['Webhook', 'At-least-once', 'Idempotency', 'HMAC', 'Reliability']
  }
);
