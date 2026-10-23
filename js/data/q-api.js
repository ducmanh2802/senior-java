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
  }
);
