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
  },
  {
    id: 'api-023',
    topic: 'api',
    level: 'mid',
    q: 'API ngân hàng cho khách hàng upload sao kê, ảnh CCCD (tối đa 100 MB). Bạn thiết kế endpoint upload như thế nào: multipart/form-data hoạt động ra sao, giới hạn kích thước phải đặt ở những tầng nào, và khi nào nên để client tải thẳng lên object storage bằng presigned URL thay vì đi qua server?',
    a: `**Tóm tắt:** File nhỏ (dưới vài MB) nhận bằng {{multipart/form-data}} ngay tại server: body được cắt thành nhiều phần ngăn nhau bằng chuỗi boundary, Spring trả {{MultipartFile}} để validate rồi **stream** từng phần lên kho file — tuyệt đối không đọc hết vào RAM. File lớn thì tách hai bước: server chỉ cấp **presigned URL** (URL có chữ ký, có hạn, cho phép client PUT thẳng tới S3), xong client báo lại để server ghi metadata.

### Hiểu nhanh
Upload file giống gửi bưu kiện. **multipart/form-data** là cái "hộp có nhiều ngăn": ngăn một là thông tin kèm theo (mã khách, loại tài liệu), ngăn hai là chính file; các ngăn ngăn cách bằng một chuỗi ngẫu nhiên gọi là **boundary** (giống màng bọc hộp). **presigned URL** giống bưu cục cấp phiếu gửi có chữ ký và hạn dùng: bạn dán phiếu lên bưu kiện bỏ vào thùng, bên kho (S3) tin phiếu chữ ký nên nhận file mà không cần biết bạn là ai. **Giới hạn kích thước** giống quy định "tối đa 10 kg" — phải dán ở cả quầy tiếp nhận lẫn cửa kho, thiếu tầng nào cũng hỏng.

### Thuật ngữ
- **multipart/form-data**: định dạng body HTTP chia nhiều phần, mỗi phần có header riêng ({{Content-Disposition}}, {{Content-Type}}); chuẩn RFC 7578.
- **boundary**: chuỗi phân cách các phần trong body; client sinh ra, server tự biết khi đọc.
- **MultipartFile**: interface của Spring bọc một phần file trong request — có {{getSize()}}, {{getContentType()}}, {{getInputStream()}}.
- **Object storage (S3)**: kho lưu object của AWS — lưu byte + metadata chứ không phải bảng quan hệ; tính tiền theo dung lượng và số request.
- **presigned URL**: URL mang chữ ký khoá sẵn (method, đường dẫn, hạn) do server ký; ai cầm URL cũng làm được đúng một thao tác đó trong thời gian hiệu lực.
- **413 Payload Too Large**: HTTP status báo body vượt giới hạn cho phép.

### Cơ chế từng bước (upload qua server)
1. Client {{POST /api/documents}} với {{Content-Type: multipart/form-data; boundary=----Bd123}}, gồm phần metadata và phần file.
2. Tầng chặn trước (nginx {{client_max_body_size}}, API gateway) đo kích thước. Vì sao phải chặn sớm: tránh mất công parse body xong mới từ chối; vượt thì trả **413**.
3. {{StandardServletMultipartResolver}} của Spring cho servlet đọc multipart; vượt {{max-file-size}} ném {{MaxUploadSizeExceededException}}. Tuỳ phiên bản Spring và cấu hình, khách có thể nhận 413 hoặc 500 khó hiểu — nên tự bắt trong @ControllerAdvice để luôn trả 413 kèm ProblemDetail rõ ràng.
4. Controller nhận {{MultipartFile}} và **validate lại**: kích thước, phần mở rộng, và **đoạn đầu file** (magic bytes) thay vì tin header — kẻ xấu có thể đổi {{Content-Type}} thành image/jpeg cho file HTML.
5. {{file.getInputStream()}} rồi ghi tiếp: {{transferTo(...)}} xuống đĩa tạm, hoặc truyền thẳng {{InputStream}} vào SDK S3 — byte chảy từng buffer, không cộng dồn trong heap.
6. Trả **201 Created** + {{Location: /api/documents/8821}}; nếu còn bước quét virus thì để trạng thái PROCESSING.

~~~text
Upload 5 MB qua server:
client ──POST multipart──► nginx ──► Spring(MultipartFile) ──stream──► S3
                             │              │
                      chặn 413 nếu to    validate + ghi metadata
~~~

### Code
~~~java
static final long MAX = 100L * 1024 * 1024;              // 100 MB, trùng với cấu hình 3 tầng

@PostMapping("/api/documents")
ResponseEntity<DocumentDto> upload(@RequestPart("meta") CreateDocument meta,   // phần JSON đi kèm
        @RequestPart("file") MultipartFile file,
        @RequestHeader(value = "X-Upload-Id", required = false) String uploadId) throws IOException {
    if (file.getSize() > MAX)
        throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "File quá lớn");  // 413
    if (!allowedMagic(file))                                                     // soi đầu file
        throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "Sai định dạng"); // 422
    String key = "docs/" + userId() + "/"                           // tiền tố user: không ghi đè được file của người khác
            + (uploadId != null ? requireUuid(uploadId) : UUID.randomUUID()); // chỉ nhận UUID hợp lệ
    try (InputStream in = file.getInputStream()) {                                // stream, KHÔNG getBytes()
        storage.put(key, in);
    }
    DocumentDto saved = docs.save(meta, key);                                     // lưu metadata, DB sinh id
    return ResponseEntity.created(URI.create("/api/documents/" + saved.id())).body(saved);
}
~~~

### Giới hạn phải đặt ở ba tầng
| Tầng | Cấu hình | Nếu thiếu |
|---|---|---|
| Proxy (nginx) | {{client_max_body_size 100m}} | nginx trả 413 trước khi chạm app, log app không có gì |
| Spring Boot | {{spring.servlet.multipart.max-file-size: 100MB}} và {{max-request-size: 105MB}} (mặc định chỉ 1MB và 10MB) | {{MaxUploadSizeExceededException}}; nếu không tự bắt, khách dễ nhận 500 hoặc thông báo khó hiểu |
| Nghiệp vụ | quota upload theo khách, giới hạn số file đồng thời | một client gửi 200 file một lúc làm đầy đĩa |

### Presigned URL cho file lớn
~~~text
1. client  POST /api/documents {name,size,contentType}  → 202 + {uploadUrl, expiresAt}
2. server  ký URL PUT cho obj-8821, hết hạn 5 phút
           (presigned PUT không có policy giới hạn khoảng kích thước)
3. client  PUT uploadUrl với chính file                  → 200 (S3 trả, không qua app)
4. client  POST /api/documents/8821/complete → server headObject dò size/ETag → 200
~~~
Server **không nhìn thấy byte nào**: không tốn RAM, không tốn băng thông, không bị proxy cắt kết nối.
> Muốn chặn cứng dung lượng **ngay lúc upload** thì phải dùng presigned **POST** kèm policy có {{content-length-range}} (trình duyệt gửi form thẳng lên S3). Với presigned **PUT**, chữ ký ràng buộc method + khoá + hạn (và các header được ký kèm) nhưng không có điều kiện kiểu "tối đa 100 MB", nên server vẫn phải {{headObject}} ở bước complete rồi xoá file quá cỡ.

| Tiêu chí | Qua server (multipart) | Presigned URL |
|---|---|---|
| RAM/băng thông app | Trọn file đi qua app | Không qua app |
| Ép giới hạn kích thước | Ngay tại chỗ | Presigned POST: policy {{content-length-range}}; presigned PUT: chỉ kiểm tra sau ở bước complete |
| Quét virus, kiểm tra nghiệp vụ | Làm ngay lúc nhận | Phải làm ở bước complete (PROCESSING) |
| Retry | Tự nghĩ idempotency | {{POST /documents}} idempotent bằng khoá client |
| Chi phí code | Ít | Ký URL, kiểm tra sau, dọn file mồ côi |

### Lỗi hay gặp
- **Đọc hết file vào RAM** bằng {{file.getBytes()}}: 100 MB × 20 người cùng upload = 2 GB heap → OOM và full GC liên tục. Cách tránh: luôn {{getInputStream()}} hoặc {{transferTo}}.
- **Chỉ siết giới hạn ở một tầng**: sửa Spring quên nginx → khách gặp 413 mà log app trống trơn.
- **Tin header Content-Type**: file HTML giả danh .jpg lưu vào bucket cho phép mở web → XSS. Cách tránh: soi magic bytes, không serve trực tiếp từ bucket, luôn buộc {{Content-Disposition: attachment}}.
- **Làm tên file từ client thành đường dẫn**: {{filename=../../config/app.yml}}. Tên hiển thị phải lược bỏ dấu chấm gạch chéo; khoá object thì do server ghép (tiền tố user + UUID), không lấy nguyên tên file.
- **Retry tạo bản sao**: client timeout rồi gửi lại multipart → 2 file trùng. Cách tránh: client sinh {{X-Upload-Id}} dạng UUID, server kiểm tra định dạng rồi ghép khoá {{docs/<userId>/<uploadId>}} để lần gửi lại ghi đè đúng chỗ — nhớ có tiền tố user, nếu không client A có thể ghi đè file của client B bằng cách gửi id của B.

### Trả lời miệng 1 phút
"Tôi tách upload theo kích thước. Dưới khoảng 10 MB thì nhận multipart tại server: body chia phần bằng boundary, Spring ra {{MultipartFile}}, tôi kiểm tra kích thước, phần mở rộng và magic bytes rồi stream {{InputStream}} lên S3, không bao giờ {{getBytes()}}. Bắt buộc siết ở cả nginx lẫn {{spring.servlet.multipart}} vì mặc định Spring chỉ cho 1 MB — thiếu tầng nào khách cũng gặp 413 hoặc 500. Trên 10 MB tôi chuyển sang presigned URL: client xin URL ký sẵn, PUT thẳng lên S3 rồi báo {{complete}} để server đối chiếu kích thước và ETag; server không đi qua byte nào nên vừa không tốn RAM vừa không bị proxy cắt. Mọi đường upload đều idempotent theo mã upload do client sinh để retry không tạo file trùng."

> Senior tip: mặc định cho hệ ngân hàng là **presigned PUT cho file trên 10 MB**, kèm khoá object do server sinh (không tin filename), URL hết hạn sau 3–5 phút, bucket khoá toàn bộ chỉ đọc qua chữ ký, và trạng thái PROCESSING cho tới khi quét virus xong. Nếu cần chặn cứng dung lượng ngay lúc upload thì dùng presigned **POST** kèm policy {{content-length-range}}; còn presigned PUT thì luôn {{headObject}} ở bước complete để phát hiện file quá cỡ rồi xoá. Phân loại lỗi upload theo tầng (413 ở nginx hay timeout ở app) trong log — nó cho biết đúng tầng nào đang siết sai.`,
    follow: [
      'Quét virus cho file upload nên đặt ở bước nào để không chặn trải nghiệm người dùng?',
      'Nếu S3 ghi dở dang rồi timeout thì làm sao không để lại file mồ côi và metadata nửa vời?',
      'Client cần upload 20 file trong một lần gọi thì endpoint nên thiết kế ra sao?'
    ],
    tags: ['File Upload', 'multipart', 'presigned URL', 'S3', 'REST Design']
  },
  {
    id: 'api-024',
    topic: 'api',
    level: 'mid',
    q: 'API trả sao kê PDF 50 MB cho khách hàng. Bạn sẽ stream file xuống client thế nào để JVM không bị nuốt RAM, cho phép tải tiếp khi đứt mạng (HTTP Range), và không bị proxy cắt giữa chừng?',
    a: `**Tóm tắt:** Trả file bằng {{ResponseEntity<Resource>}} để byte chảy từng buffer 8–64 KB ra socket thay vì gom hết vào {{byte[]}}. Nhớ kỹ: Spring MVC **không** xử lý {{Range}} cho {{InputStreamResource}} (stream chỉ đọc được một lần) — muốn tải tiếp khi đứt mạng phải dùng {{Resource}} đọc lại được như {{FileSystemResource}}/{{PathResource}} để Spring tự trả **206 Partial Content**, hoặc tự đọc {{Range}} rồi trả {{ResourceRegion}}, hoặc đẩy sang **presigned GET** của S3 (S3 hỗ trợ Range sẵn). File trên khoảng 20 MB thì tốt nhất là cấp presigned GET để client tải thẳng từ S3/CDN, server chẳng tốn băng thông.

### Hiểu nhanh
Stream file giống **vòi nước**: nước (byte) chảy thẳng ra chậu, không cần một cái xô lớn bằng 50 MB chứa sẵn trong nhà. Đọc hết vào bộ nhớ là rót 50 lít vào xô rồi bê ra cửa — tốn chỗ và nếu 20 người cùng làm thì sập nhà. **HTTP Range** giống tua băng: biết bạn đã xem tới giây 60 nên băng mới nối tiếp từ giây 60 chứ không phát lại từ đầu — nhờ đó đứt mạng giữa chừng vẫn tải tiếp được.

### Thuật ngữ
- **Streaming**: đọc/ghi dữ liệu từng phần, không giữ toàn bộ trong bộ nhớ.
- **InputStreamResource**: bản bọc InputStream kiểu Spring, nói "hãy copy dần ra response"; nó **chỉ đọc được một lần** nên Spring loại nó khỏi cơ chế Range tự động.
- **Content-Length**: độ dài byte của body; biết trước thì trình duyệt hiện % tải và tải tiếp được.
- **Range / If-Range**: header client yêu cầu "cho tôi từ byte X tới Y"; If-Range mang ETag để chắc bản tin vẫn là bản mình đang tải.
- **206 Partial Content** + **Content-Range**: server trả một phần, kèm dải byte đã trả và tổng kích thước.
- **Accept-Ranges: bytes**: server báo "tôi hỗ trợ Range".
- **Idle timeout của proxy**: ngưỡng thời gian không có byte nào đi qua mà nginx/gateway cắt kết nối (nginx: {{proxy_read_timeout}} chờ app, {{send_timeout}} chờ client, mặc định đều 60 giây).

### Cơ chế từng bước
1. Client {{GET /api/statements/8821/pdf}}. Server đọc **metadata** trước (kích thước, khoá object) — vì sao: phải set {{Content-Length}} được thì trình duyệt mới hiện %.
2. Mở {{Resource}} từ nguồn (đĩa, S3, hoặc cột bytea trong DB) — **không đọc hết**, chỉ đọc khi container hỏi; muốn Spring tự trả Range thì Resource phải đọc lại được.
3. Set header: {{Content-Type}}, {{Content-Length}}, {{Content-Disposition: attachment}} để trình duyệt tải về thay vì mở trong tab.
4. Container Servlet copy từ Resource/stream ra socket theo từng buffer. Lưu ý: **thread bị giữ suốt thời gian tải** (một request một thread trong Servlet truyền thống) nên download 50 MB ở mạng chậm có thể giữ thread hàng chục giây.
5. Client đứt mạng → kết nối hỏng; client mở lại và gửi {{Range: bytes=<đã nhận>}} + {{If-Range: <etag>}}. Với {{Resource}} đọc lại được ({{FileSystemResource}}, {{PathResource}}…) Spring MVC tự parse Range và trả 206; với {{InputStreamResource}} thì **không** — phải tự xử lý (đọc đúng khoảng byte, trả {{ResourceRegion}}/206) hoặc chuyển sang presigned GET.

~~~text
So sánh bộ nhớ với 20 người tải cùng lúc (file 50 MB):
byte[]          : [=========== 50 MB ===========] trong heap  × 20 = 1 GB   → OOM
InputStream     : [64 KB][64 KB][64 KB]...        trong heap  × 20 ≈ 1,3 MB → ổn

Range yêu cầu:  Range: bytes=1048576-            If-Range: "v7"
Server trả:     206 Partial Content
                Content-Range: bytes 1048576-52428799/52428800
                Accept-Ranges: bytes
~~~

### Code
~~~java
@GetMapping("/api/statements/{id}/pdf")
ResponseEntity<Resource> download(@PathVariable long id) {
    StatementMeta meta = service.meta(id);              // chỉ đọc metadata, KHÔNG đọc blob
    Resource body = storage.resource(meta.objectKey());  // FileSystemResource/PathResource: đọc lại được
    return ResponseEntity.ok()                          // status 200 là điều kiện để Spring xử lý Range
            .contentType(MediaType.APPLICATION_PDF)
            .header(HttpHeaders.CONTENT_DISPOSITION,
                    ContentDisposition.attachment()     // tạo header an toàn cho tên tiếng Việt
                        .filename("sao-ke-" + id + ".pdf", StandardCharsets.UTF_8).build())
            .contentLength(meta.size())                 // biết trước kích thước → trình duyệt hiện %
            .body(body);                                // Spring tự cắt Range và trả 206
}
~~~
> Nếu nguồn chỉ cho đọc **một lần** (S3 {{GetObject}} trả {{InputStream}}), đừng bọc {{InputStreamResource}} rồi tưởng Range tự chạy. Hoặc đọc header {{Range}} của request, truyền đúng khoảng byte xuống lời gọi S3 ({{GetObjectRequest.range(...)}}) rồi trả 206 + {{Content-Range}}, hoặc đơn giản nhất là cấp presigned GET để S3/CDN lo Range.

### Bốn cách tải file
| Cách | Ưu điểm | Nhược điểm | Dùng khi |
|---|---|---|---|
| {{ResponseEntity<byte[]>}} | Đơn giản nhất | 50 MB nằm trong heap, dễ OOM/full GC | File dưới 1 MB |
| {{FileSystemResource}} / {{PathResource}} (stream) | Gần như không tốn RAM; Spring tự lo Range → 206 | Giữ thread suốt download; nguồn phải đọc lại được nhiều lần | File 1–20 MB trên đĩa/network share, tải qua server |
| {{InputStreamResource}} | Gần như không tốn RAM, dùng được với stream một lần (S3) | **Không** hỗ trợ Range, giữ thread suốt download | File nhỏ hoặc khi không cần tải tiếp |
| presigned GET + CDN | Không tốn băng thông app, CDN có Range sẵn, tải song song | Phải quản lý hạn URL, kiểm tra quyền trước khi cấp | File trên 20 MB, ảnh, video |

### Lỗi hay gặp
- **Đọc toàn bộ bằng {{Files.readAllBytes}} hay {{getBytes()}}**: 50 MB × vài chục request = heap đầy, GC dừng cả giây. Cách tránh: truyền {{InputStream}} đi tới cùng.
- **Không set {{Content-Length}}**: body chuyển sang dạng chunked, trình duyệt không hiện phần trăm và không chắc hỗ trợ tải tiếp. Cách tránh: luôn đọc kích thước từ metadata trước.
- **Tên file tiếng Việt không có {{filename*=UTF-8''...}}** trong Content-Disposition: khách tải về thành {{sao-ke-????.pdf}}. Dùng {{ContentDisposition.filename(name, StandardCharsets.UTF_8)}} của Spring.
- **Kiểm tra quyền/tồn tại file quá muộn**: nếu lỗi (file mất, không có quyền) chỉ lộ ra khi đang ghi body thì header 200 đã gửi đi, không đổi sang 404/403 được nữa → client nhận file hỏng. Cách tránh: kiểm tra quyền và metadata (kích thước, tồn tại) **trước** khi trả response.
- **Tưởng {{InputStreamResource}} tự hỗ trợ Range**: Spring chỉ tự xử lý Range cho {{Resource}} **không phải** InputStreamResource (stream loại này không đọc lại được), nên client không bao giờ nhận 206. Cách tránh: dùng Resource đọc lại được, tự xử lý Range, hoặc presigned GET.
- **Proxy cắt kết nối**: nếu app mất hơn 60 giây mới gửi byte đầu (ví dụ chờ lấy file từ kho chậm) thì nginx trả 504 ({{proxy_read_timeout}}); nếu client đọc quá chậm thì {{send_timeout}} của nginx cắt kết nối giữa chừng. Cách tránh: gửi byte đầu sớm, chỉnh hai timeout này cho route download, hoặc đẩy sang presigned URL.
- **Nén gzip cho PDF**: PDF đã nén sẵn, bật thêm chỉ tốn CPU và tăng độ trễ. Chỉ nén JSON/text.

### Trả lời miệng 1 phút
"Trước hết tôi không bao giờ đọc cả file vào bộ nhớ: response trả {{Resource}} với {{contentLength}} lấy từ metadata, nên 50 MB không nằm trong heap mà chỉ có buffer 64 KB; đổi lại tải chậm thì thread bị giữ, vì thế tôi giới hạn số download đồng thời. Để khách tải tiếp được khi đứt mạng, tôi dùng {{Resource}} đọc lại được để Spring tự xử lý {{Range}}/{{If-Range}} và trả 206 — lưu ý {{InputStreamResource}} **không** được Spring hỗ trợ Range, nếu nguồn chỉ cho stream một lần thì tôi truyền khoảng byte xuống S3 hoặc cấp presigned GET. Tên file tiếng Việt dùng {{ContentDisposition.filename(..., UTF_8)}} tránh thành dấu chấm hỏi. Thực tế với file trên 20 MB tôi cấp presigned GET có hạn để client tải thẳng từ S3/CDN: server không tốn băng thông, CDN lo Range và timeout, tôi chỉ kiểm tra quyền trước khi ký URL."

> Senior tip: ngưỡng tôi dùng là 20 MB — dưới thì stream qua server, trên thì presigned GET + CDN. Đo bằng hai chỉ số: dung lượng trung bình mỗi lần tải và tỉ lệ request tải lại (resume) — tải lại nhiều nghĩa là timeout/Range đang hỏng. Và đừng bao giờ cấp presigned URL cho tài liệu nhạy cảm mà không kiểm tra quyền ngay tại thời điểm ký: URL đã ký là bearer token có hạn, cấp một lần là ai cũng tải được trong vài phút.`,
    follow: [
      'Nếu file nằm trong PostgreSQL (bytea) thì stream ra sao mà không load cả blob?',
      'Giữ thread suốt thời gian download thì làm sao tránh cạn thread pool khi nhiều người tải?',
      'Khi nào nên dùng HEAD trước khi GET để kiểm tra kích thước và ETag?'
    ],
    tags: ['File Download', 'Streaming', 'HTTP Range', '206', 'S3']
  },
  {
    id: 'api-025',
    topic: 'api',
    level: 'mid',
    q: 'Bạn kiểm tra dữ liệu ở tầng service với Bean Validation như thế nào: tạo custom annotation kiểu @ValidVietnamPhone, dùng validation nhóm cho Create vs Update, validate object lồng, và phân biệt lỗi "sai định dạng" với lỗi nghiệp vụ "email đã tồn tại"?',
    a: `**Tóm tắt:** Bean Validation (chuẩn Jakarta, Spring Boot 3 dùng bản thực hiện Hibernate Validator) kiểm tra **định dạng/sai lệch** ngay trên DTO bằng annotation — custom annotation = annotation mới + class {{ConstraintValidator}}; **nhóm** (groups) là các interface rỗng dùng để bỏ qua một ràng buộc khi sửa bản ghi; object lồng phải đánh dấu {{@Valid}} (cascade) mới kiểm tra tiếp. Còn lỗi **nghiệp vụ với dữ liệu trong DB** (email trùng, số dư không đủ) **không viết trong validator** — validator phải nhanh, không được gọi DB và dễ có race — làm ở service rồi trả 409/422.

### Hiểu nhanh
Giống quầy tiếp nhận ở bệnh viện: **kiểm tra form** (đủ chữ ký, có ảnh, chọn đúng mẫu đơn) làm ngay tại quầy bằng cách nhìn giấy — đó là Bean Validation, nhanh và không cần máy tính. **Tra cứu nghiệp vụ** (bệnh nhân này đã hẹn lần trước chưa, còn nợ tiền không?) phải hỏi hệ thống phía sau — đó là service layer, chậm hơn, có thể thay đổi giữa chừng và cần mã lỗi riêng. Cố dồn cả hai vào quầy giấy thì vừa chậm vừa sai.

### Thuật ngữ
- **Bean Validation / Jakarta Validation**: chuẩn {{jakarta.validation.*}} (trước là javax) — khai báo ràng buộc bằng annotation như {{@NotNull}}, {{@Email}}, {{@Size}}.
- **Hibernate Validator (HV)**: bản thực hiện (implementation) tham chiếu của chuẩn; {{spring-boot-starter-validation}} mang theo HV và Spring Boot tự dùng làm bản mặc định khi có trong classpath.
- **Constraint**: một ràng buộc; gồm annotation + class kiểm tra {{ConstraintValidator<A, T>}}.
- **Groups**: interface rỗng (vd {{Create}}, {{Update}}) để bật/tắt tập ràng buộc theo ngữ cảnh, tránh phải tách 2 DTO.
- **Cascading**: {{@Valid}} nói "kiểm tra luôn object bên trong"; với list viết {{List<@Valid Item>}}.
- **Method validation**: validate **tham số của method** — với service cần {{@Validated}} trên class (Spring tự cấu hình {{MethodValidationPostProcessor}}), lỗi là {{ConstraintViolationException}}; riêng controller từ Spring Framework 6.1 (Boot 3.2+) đã được validate sẵn, không cần {{@Validated}}.

### Cơ chế từng bước
1. Dev đặt annotation trên DTO. Vì sao: ràng buộc nằm cạnh dữ liệu, ai đọc DTO cũng thấy ngay.
2. Controller nhận {{@Valid @RequestBody CreateAccountRequest req}}. Spring chạy HV **trước khi vào method**; nếu sai thì ném {{MethodArgumentNotValidException}}, gom tất cả lỗi field chứ không dừng ở lỗi đầu.
3. Với {{@PathVariable}}/{{@RequestParam}} trên controller: từ Spring Framework 6.1 (Boot 3.2+) Spring MVC tự validate tham số và ném {{HandlerMethodValidationException}} (thường trả 400), không cần {{@Validated}}. Ở tầng **service** thì {{@Validated}} trên class bật proxy method validation, lỗi là {{ConstraintViolationException}}.
4. Lỗi được @ControllerAdvice chuyển thành ProblemDetail kèm danh sách {{field, message}}.
5. Kiểm tra nghiệp vụ (email trùng) nằm ở service: ưu tiên để **DB chặn cuối** bằng unique constraint, bắt {{DataIntegrityViolationException}} rồi trả 409.

~~~text
Hai request cùng gửi email moi@x.vn (cách nhau 1 ms):
t=0ms  A: SELECT ... WHERE email='moi@x.vn'  → chưa có  → hợp lệ
t=1ms  B: SELECT ... WHERE email='moi@x.vn'  → chưa có  → hợp lệ
t=2ms  A: INSERT ok                            B: INSERT bị unique chặn → trả 409
Kiểm tra trong service không thấy gì sai ở t=1ms — đó là race, chỉ DB chặn được.
~~~

### Code: custom annotation
~~~java
// 1. Annotation mới: chạy được trên field/param, có class kiểm tra kèm theo
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = VietnamPhoneValidator.class)
public @interface ValidVietnamPhone {
    String message() default "{phone.invalid}";   // khoá trong ngoặc nhọn → tra ValidationMessages.properties
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}

// 2. Logic kiểm tra — CHỈ kiểm tra chuỗi, không gọi DB trong đây
class VietnamPhoneValidator implements ConstraintValidator<ValidVietnamPhone, String> {
    @Override public boolean isValid(String v, ConstraintValidatorContext ctx) {
        if (v == null) return true;                 // để @NotNull lo phần null
        return v.length() >= 10 && v.length() <= 11
            && v.charAt(0) == '0'
            && v.chars().allMatch(Character::isDigit);
    }
}
~~~

### Code: nhóm (Create vs Update) và object lồng
~~~java
public interface Create {}                 // interface rỗng — chỉ là cờ
public interface Update {}

public record BeneficiaryReq(
        @Null(groups = Create.class)          // tạo mới thì id phải null
        @NotNull(groups = Update.class)       // cập nhật thì bắt buộc có id
        Long id,
        @NotBlank String name,
        @Valid AccountRef account,             // cascade xuống object lồng
        List<@Positive Long> amounts) {}       // ràng buộc áp lên TỪNG phần tử (container element)
~~~
Lúc validate phải chỉ rõ nhóm: ở controller dùng {{@Validated(Create.class) @RequestBody BeneficiaryReq req}} ({{@Valid}} không nhận tham số nhóm), gọi tay thì {{validator.validate(req, Create.class)}}. Nếu gọi validate ở nhóm mặc định (Default) thì các ràng buộc đã gán nhóm **không chạy**; ngược lại khi gọi {{Create.class}}, các ràng buộc **không gán nhóm** (như {{@NotBlank name}} ở trên, thuộc Default) cũng bị bỏ qua. Vì vậy hoặc gán nhóm cho mọi ràng buộc, hoặc truyền cả hai: {{validator.validate(req, Create.class, Default.class)}} — đây là lỗi im lặng hay gặp nhất của groups.

### Lỗi format hay nghiệp vụ? Đặt status đúng
| Loại | Ai bắt | Ví dụ | Status |
|---|---|---|---|
| Sai định dạng (thiếu field, sai kiểu, sai pattern) | Bean Validation | email thiếu @, số điện thoại 8 số | 400 hoặc 422 |
| Đúng format nhưng sai nghiệp vụ | Service | số dư không đủ, ngày sinh tương lai | 422 |
| Xung đột dữ liệu đã tồn tại | DB unique + service | email đã đăng ký | 409 |
| Thiếu quyền | Security | sửa tài khoản người khác | 403 |

### Lỗi hay gặp
- **Gọi DB trong {{isValid()}}**: mỗi lần validate là một câu SELECT tiềm ẩn, service chậm khó hiểu và ẩn trong annotation. Cách tránh: validator chỉ check format; check DB ở service.
- **Check "email chưa tồn tại" rồi mới insert vẫn race**: hai request cùng thấy "chưa có". Cách tránh: unique constraint trong DB — DB là trọng tài, bắt lỗi trùng và trả 409.
- **Nhầm {{@Valid}} với {{@Validated}}**: {{@Valid}} để cascade object và validate body; {{@Validated}} bật method validation (kèm nhóm) cho service. Với controller, từ Spring 6.1 ràng buộc trên {{@PathVariable}}/{{@RequestParam}} đã chạy sẵn nên đặt {{@Validated}} lên controller class chỉ tạo proxy không cần thiết. Đặt sai chỗ thì ràng buộc im lặng không chạy — lỗi nguy hiểm vì code vẫn xanh.
- **Nhóm không đặt khi dùng chung DTO**: bản Update gửi thiếu id bị chặn vì {{@NotNull}} của Create. Cách tránh: gán {{groups}} ngay từ đầu cho mọi ràng buộc bắt buộc.
- **Thông báo mặc định tiếng Anh**: khách không hiểu. Dùng {{ValidationMessages.properties}} (hoặc {{messages_vi.properties}}) và đọc theo {{LocaleContextHolder.getLocale()}}.

### Trả lời miệng 1 phút
"Bean Validation là lưới kiểm tra thứ nhất, dành cho định dạng: annotation trên DTO, Spring chạy Hibernate Validator trước khi vào controller, gom hết lỗi field rồi trả 400/422 kèm danh sách lỗi. Custom annotation như @ValidVietnamPhone gồm hai phần: annotation khai báo {{Constraint}} và class {{ConstraintValidator}} — phần kiểm tra chỉ được động tới chuỗi, không được gọi DB. Nhóm Create/Update dùng interface rỗng để cùng một DTO áp đúng bộ ràng buộc theo ngữ cảnh, còn object lồng phải có {{@Valid}} nếu không ràng buộc bên trong không chạy. Lưới thứ hai là nghiệp vụ ở service: email trùng, số dư không đủ thì trả 409/422, và cuối cùng unique constraint của DB là trọng tài vì check trước insert bao giờ cũng có race."

> Senior tip: hãy chốt một quy ước chung cho cả team: **400/422 = client sai ngay (sửa input), 409 = client đúng nhưng dữ liệu đã thay đổi (bấm lại hoặc reload), 403 = không đủ quyền**. Và đừng bao giờ tin unique check viết trong service — tôi đã thấy cảnh "đăng ký email" vẫn trùng khi hai request vào cùng 10 ms; thêm unique index là xong, code validator giữ nguyên.`,
    follow: [
      'Validate ở tầng service với {{@Validated}} thì exception khác gì so với validate ở controller?',
      'Làm sao hiển thị lỗi theo field cho front-end highlight đúng ô nhập?',
      'Kiểm tra nghiệp vụ nhiều bước (trùng email, kiểm tra hạn mức) nên đặt ở service hay domain model?'
    ],
    tags: ['Bean Validation', 'Hibernate Validator', 'Custom Constraint', 'Groups', 'Validation']
  },
  {
    id: 'api-026',
    topic: 'api',
    level: 'mid',
    q: 'Số dư tài khoản là dữ liệu cá nhân nhưng client gọi GET /api/accounts/{id} liên tục. Bạn cấu hình caching cho API thế nào ở ba tầng trình duyệt, proxy/CDN và ứng dụng: directive nào của Cache-Control, khi nào no-cache khác no-store, và làm sao không bao giờ hiển thị số dư cũ?',
    a: `**Tóm tắt:** Phân biệt **no-store** (không được lưu ở bất kỳ đâu — dùng cho số dư, số thẻ), **no-cache** (được lưu nhưng trước khi dùng phải hỏi lại server qua ETag nên trả 304 không có body), **private** (chỉ trình duyệt được lưu, proxy/CDN cấm). Dữ liệu công khai thì đổi thành {{public}} + {{max-age}} + {{Vary}}. Mọi response cache được đều nên kèm ETag để lần gọi sau chỉ tốn một request 304 nhẹ.

### Hiểu nhanh
**Cache** là sổ tay ghi chép tạm: thay vì mỗi lần cần là chạy sang nhà kho lấy, ta ghi lại một bản sao để lần sau xem nhanh. Ba quy tắc giống hệt thói quen ghi chép: **no-store** là "đừng ghi gì ra giấy cả" (số dư không được để ở đâu cả); **no-cache** là "có ghi nhưng mỗi lần mở phải đối chiếu sổ gốc trước khi dùng"; **private** là "chỉ mình tôi được giữ bản sao, nhân viên kho (CDN) không được sao chép". Sai một chữ trong ba chữ này là số dư cũ hiện ra cho khách, hoặc dữ liệu cá nhân bị lưu ở nơi công cộng.

### Thuật ngữ
- **Cache-Control**: header quyết định ai được lưu response và trong bao lâu.
- **no-store**: cấm lưu tại mọi tầng (RAM, đĩa, service worker).
- **no-cache**: được lưu, nhưng trước khi dùng **bắt buộc revalidate** (hỏi lại server) — nếu server nói "vẫn còn đúng" thì trả **304 Not Modified** không kèm body.
- **private / public**: private = chỉ trình duyệt của người dùng; public = proxy/CDN được phép lưu chung.
- **max-age / must-revalidate / stale-while-revalidate**: sống bao lâu, quá hạn phải hỏi lại, hay được dùng bản cũ trong lúc tải bản mới (RFC 5861).
- **ETag / If-None-Match**: mã định danh phiên bản của body; client gửi lại mã cũ, server đối chiếu.
- **Vary**: danh sách header mà cache dùng làm **một phần của khoá cache** — thiếu nó cache sẽ trộn response của người khác.

### Cơ chế từng bước
~~~text
lần 1: GET /api/accounts/1
       ← 200 + ETag: "v7" + Cache-Control: private, no-cache
         (trình duyệt LƯU body và ETag)
lần 2: GET /api/accounts/1  với If-None-Match: "v7"
       ← 304 Not Modified, không có body   (tiết kiệm băng thông, đúng số dư)
lần 3 (số dư đã đổi, ETag là v8): If-None-Match: "v7"
       ← 200 + body mới + ETag: "v8"
~~~
1. Server sinh ETag gắn với **phiên bản dữ liệu** ({{version}} hoặc {{updated_at}}), không gắn timestamp của request. Vì sao: ETag đổi theo request thì không bao giờ khớp, không khác gì không có.
2. Client lưu response kèm Cache-Control và ETag.
3. Lần sau client tự thêm {{If-None-Match}}; server so và trả 304 nếu khớp.
4. Server đổi dữ liệu → ETag đổi → 304 trở thành 200 với bản mới. Nhờ đó "không bao giờ hiện số dư cũ" mà vẫn gọi ít request.

### Chọn directive theo loại dữ liệu
| Loại dữ liệu | Cache-Control | Vì sao |
|---|---|---|
| Số dư, số thẻ, thông tin cá nhân | {{no-store}} | Không được để bản sao ở RAM/đĩa của bất kỳ tầng nào |
| Dữ liệu cá nhân nhưng cần rẻ | {{private, no-cache}} kèm ETag | Lưu được ở máy người dùng, mỗi lần dùng phải đối chiếu |
| Danh mục, biểu phí, cấu hình public | {{public, max-age=300, stale-while-revalidate=60}} | CDN trả lời gần như tức thời, cũ vài phút chấp nhận được |
| Response có Cookie cá nhân mà để {{public}} | **Cấm** | CDN trả số dư của người này cho người khác |

~~~java
@GetMapping("/api/accounts/{id}")
ResponseEntity<AccountDto> get(@PathVariable long id, WebRequest req) { // WebRequest mới có checkNotModified
    AccountDto dto = service.get(id);                    // luôn đọc bản mới nhất từ DB, không tin bản sao cũ
    char q = '"';                                        // ETag chuẩn phải bọc nháy kép
    String etag = q + "v" + dto.version() + q;
    if (req.checkNotModified(etag)) return null;         // khớp If-None-Match → Spring tự trả 304
    return ResponseEntity.ok()                           // không khớp → trả body + ETag
            .header(HttpHeaders.ETAG, etag)
            .cacheControl(CacheControl.noCache().cachePrivate()) // private, no-cache: chỉ trình duyệt lưu, dùng phải hỏi lại
            .body(dto);
}
~~~
Nếu quy định bảo mật cấm lưu số dư ở máy người dùng thì dùng {{CacheControl.noStore()}} và **bỏ luôn ETag/304**: không có bản lưu thì trình duyệt cũng không bao giờ gửi {{If-None-Match}}, mỗi lần gọi đều nhận body đầy đủ.

### Ba tầng nghĩ khác nhau
| Tầng | Ai quyết định | Cái hay sai |
|---|---|---|
| Trình duyệt | Tôn trọng Cache-Control của response | Service worker lưu đè cả {{no-store}} nếu code không kiểm tra |
| Proxy/CDN | Chỉ cache được {{public}}; khoá theo URL + {{Vary}} | Bật cache cho response sau đăng nhập (thay vì {{private}}/{{no-store}}) → trộn dữ liệu giữa các user |
| Ứng dụng (Spring/HTTP client) | Đọc header và cache hoặc revalidate | Giữ cache nội bộ quá hạn rồi hiển thị số dư cũ |

### Lỗi hay gặp
- **Nhầm no-cache với no-store**: {{no-cache}} vẫn cho lưu — đúng ý khi bạn muốn tiết kiệm bằng 304. Muốn "không để ở đâu cả" phải là {{no-store}}.
- **CDN cache response có thông tin cá nhân**: triệu chứng là người này thấy số dư người kia. Cách tránh: {{private}} hoặc {{no-store}} cho mọi endpoint cần đăng nhập. Đừng dựa vào {{Vary: Authorization}} để "chia khoá theo user": phần lớn CDN không cache response có Authorization (đúng theo RFC), còn nếu có cache thì giá trị token khác nhau từng user làm hit ratio gần bằng 0.
- **ETag sinh từ thời điểm request**: luôn đổi → 304 không bao giờ xảy ra, tốn băng thông y như không cache.
- **GET có side effect** (tăng số lượt xem, sinh log nghiệp vụ): proxy cache nuốt mất lượt gọi. Cách tránh: việc ghi phải nằm ở POST hoặc xử lý riêng.
- **Chỉ bật cache ở server mà quên client**: fetch của trình duyệt mặc định vẫn dùng cache HTTP; muốn luôn lấy mới thì client phải {{cache: "no-store"}} — nhưng nhớ lý do thật sự là gì.

### Trả lời miệng 1 phút
"Tôi bắt đầu bằng việc phân loại dữ liệu. Số dư và thông tin cá nhân thì {{no-store}} — không tầng nào được giữ bản sao; nếu muốn rẻ hơn thì {{private, no-cache}} kèm ETag để trình duyệt chỉ tốn một request 304. Dữ liệu công khai như biểu phí thì {{public, max-age}} để CDN trả lời, kèm {{Vary}} để cache không trộn bản theo header. ETag phải sinh từ phiên bản dữ liệu, không sinh từ thời điểm request, nếu không sẽ không bao giờ khớp. Điều tôi luôn kiểm tra là response sau đăng nhập không bao giờ được để {{public}}: khoá cache mặc định chỉ là URL, nên nếu CDN bị cấu hình cache bừa thì nó có thể trả số dư của người này cho người kia — đó là sự cố bảo mật chứ không phải lỗi hiệu năng."

> Senior tip: đo **cache hit ratio** theo từng endpoint trước khi tinh chỉnh — đa số team đếm được nó ở CDN. Quy tắc của tôi: mọi endpoint sau khi đăng nhập mặc định {{private, no-cache}} + ETag; đổi sang {{public}} là quyết định cần bản ghi (data classification), không phải flag bật cho nhanh. Và luôn nhớ {{max-age=0, must-revalidate}} hoạt động giống {{no-cache}} — đây là hai chữ ký hay gặp nhất trong log của proxy.`,
    follow: [
      'CDN cache theo URL thì làm sao phân biệt response của từng người dùng?',
      'stale-while-revalidate hữu ích ở đâu và có rủi ro hiển thị dữ liệu cũ không?',
      'Nếu dữ liệu đổi ở service khác thì làm sao invalidate cache của API này?'
    ],
    tags: ['HTTP Caching', 'Cache-Control', 'ETag', 'CDN', 'Vary']
  },
  {
    id: 'api-027',
    topic: 'api',
    level: 'mid',
    q: 'Client gửi Accept: application/json, Accept-Language: vi/en, Accept-Encoding: gzip. Server xử lý "thương lượng nội dung" (content negotiation) trong Spring như thế nào? Khi nào trả 406 Not Acceptable, và vì sao có cache thì bắt buộc phải có header Vary?',
    a: `**Tóm tắt:** Content negotiation là việc server chọn **bản đại diện (representation)** hợp ý client: Spring so {{Accept}} với danh sách {{HttpMessageConverter}} và chọn media type match tốt nhất (theo trọng số q) — không khớp thì trả **406**; {{Accept-Language}} chọn ngôn ngữ thông báo qua {{MessageSource}}; {{Accept-Encoding}} quyết định có nén (gzip) hay không, và khi nén thì **bắt buộc** {{Vary: Accept-Encoding}} để cache không trộn bản nén với bản thường.

### Hiểu nhanh
Giống một nhà hàng hỏi trước: "anh ăn chay hay mặn, nói tiếng Anh hay Việt, lấy bản in hay bản số?" — tuỳ câu trả lời mà nhà hàng dọn đúng món, đúng ngôn ngữ, đúng định dạng. **Accept** nói muốn định dạng gì, **Accept-Language** nói muốn ngôn ngữ nào, **Accept-Encoding** nói "tôi hiểu nén kiểu này". Nếu nhà hàng không làm được món khách yêu cầu thì phải nói thẳng "không có" (**406**) thay vì im lặng bưng ra một món khác.

### Thuật ngữ
- **Representation**: một bản thể hiện của resource (JSON, CSV, HTML) tuỳ theo header client.
- **Media type**: định dạng body, ví dụ {{application/json}}, {{text/csv}}, {{application/problem+json}} cho lỗi RFC 9457.
- **q (quality value)**: độ ưu tiên trong Accept, ví dụ {{application/json;q=0.9, */*;q=0.8}} — q cao hơn thì được chọn trước.
- **HttpMessageConverter**: lớp của Spring đọc/ghi body theo media type (Jackson cho JSON, Jackson XML cho {{application/xml}} nếu có {{jackson-dataformat-xml}}…).
- **406 Not Acceptable**: không có converter nào khớp Accept.
- **MessageSource**: bảng thông báo đa ngôn ngữ của Spring, đọc theo {{LocaleContextHolder.getLocale()}}.
- **Vary**: header nói "khóa cache còn phụ thuộc vào các header này nữa".
- **Content-Encoding**: kiểu nén thật sự đã áp lên body ({{gzip}}, {{br}}).

### Cơ chế từng bước
1. Client gửi {{Accept: application/problem+json, application/json;q=0.5, */*;q=0.1}}. Vì sao phải có q: khi client cần JSON chung cho data nhưng **lỗi** phải là problem+json thì nhờ trọng số mà server chọn đúng.
2. Spring so với các converter đã đăng ký; chọn match có q cao nhất. {{*/*}} khớp mọi thứ nên converter đầu tiên thắng (thường là JSON).
3. Không converter nào khớp → **406**. Không có header Accept (coi như {{*/*}}) → lấy mặc định.
4. {{Accept-Language: en}} → đọc {{messages_en.properties}}; không có ngôn ngữ đó thì dùng ngôn ngữ mặc định.
5. {{Accept-Encoding: gzip}} → tầng nén (Tomcat nhúng khi bật {{server.compression.enabled}}, hoặc nginx) nén body, thêm {{Content-Encoding: gzip}} và **{{Vary: Accept-Encoding}}**.

~~~text
Accept: application/json            ─┐
Accept-Language: en                 ─┼─► Spring chọn converter + locale + nén ─► response
Accept-Encoding: gzip, deflate      ─┘         │
                                       không khớp Accept → 406 Not Acceptable
~~~

### Cấu hình Spring
~~~java
@GetMapping(value = "/api/reports/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
ReportDto report(@PathVariable long id) { ... }   // ép JSON, không phụ thuộc Accept

@GetMapping(value = "/api/transactions.csv", produces = "text/csv")
ResponseEntity<String> csv() { ... }              // trả CSV cho client yêu cầu text/csv
~~~

~~~yaml
spring:
  messages:
    basename: messages          # messages_vi.properties, messages_en.properties
    encoding: UTF-8             # tránh lỗi dấu tiếng Việt khi dịch thông báo lỗi
~~~

~~~java
// Đọc thông báo lỗi theo ngôn ngữ của client; field type (mã lỗi cho máy đọc) giữ nguyên
String detail = messageSource.getMessage(
        "error.insufficient-funds", null, LocaleContextHolder.getLocale());
~~~

### Bảng header → việc server làm
| Header | Server làm gì | Cấu hình/lỗi hay gặp |
|---|---|---|
| {{Accept}} | Chọn converter, {{produces}} | Thiếu converter → 406; {{@RestController}} trả {{String}} sẽ là {{text/plain}} — bọc trong DTO nếu client cần JSON |
| {{Accept-Language}} | Chọn bundle thông báo | Thiếu {{Vary: Accept-Language}} khi có cache → người này thấy ngôn ngữ người kia |
| {{Accept-Encoding}} | Nén gzip/br | Bật nén ở cả app lẫn nginx → khó biết tầng nào nén, dễ nén lặp ở proxy không kiểm tra {{Content-Encoding}}; thiếu {{Vary: Accept-Encoding}} → cache trả gzip cho client không hiểu |
| {{Accept-Charset}} | Hầu như bỏ qua | Spring Boot 3 mặc định UTF-8; đừng ép ISO-8859-1 |

### Lỗi hay gặp
- **406 do client gửi Accept lạ** ({{application/xml}} nhưng không đăng ký converter): triệu chứng client báo "không có dữ liệu". Cách tránh: thống nhất JSON cho mọi client, hoặc đăng ký thêm converter, hoặc trả rõ 406 kèm danh sách type hỗ trợ.
- **Cấu hình nén chồng nhau**: app và nginx cùng bật nén thì rất khó biết body do tầng nào nén; proxy tự viết lại (hoặc CDN không kiểm tra {{Content-Encoding}}) có thể nén thêm lần nữa → CPU phung phí, đôi khi body hỏng. Chọn **một nơi** nén (thường là proxy) và để nén ở app tắt ({{server.compression.enabled}} mặc định là false).
- **Thiếu {{Vary}}**: cache có một ô khoá duy nhất là URL → bản gzip và bản thường, bản vi và bản en cùng một khoá → lỗi ngẫu nhiên rất khó debug. Khi có nén hoặc đa ngôn ngữ, {{Vary}} là bắt buộc chứ không phải lựa chọn.
- **Trả thẳng {{String}} từ controller**: client kỳ vọng JSON nhận được {{text/plain}}. Trả object hoặc set {{produces}}.

### Trả lời miệng 1 phút
"Content negotiation gồm ba trục. Trục định dạng: Spring so {{Accept}} với danh sách {{HttpMessageConverter}}, chọn theo trọng số q, không khớp thì 406 — vì vậy tôi luôn khai {{produces}} rõ ràng cho từng endpoint. Trục ngôn ngữ: {{Accept-Language}} quyết định bundle trong {{MessageSource}}, tôi dùng nó cho thông báo lỗi nhưng giữ nguyên {{type}} cho máy đọc. Trục nén: {{Accept-Encoding}} cho phép gzip, và đây là chỗ hay sai nhất — phải kèm {{Vary: Accept-Encoding}} nếu không cache sẽ trộn bản nén với bản thường, cũng như thiếu {{Vary: Accept-Language}} sẽ làm người dùng thấy sai ngôn ngữ. Nén thì tôi chỉ bật ở một tầng, thường là proxy, để tránh nén kép."

> Senior tip: hãy mặc định JSON thống nhất và chỉ mở CSV/PDF cho endpoint thật sự cần — càng nhiều representation thì càng nhiều đường test. Khi bật cache/CDN, tôi luôn kiểm tra hai header {{Vary}} ({{Accept-Encoding}}, {{Accept-Language}}) trong phản hồi thật bằng curl trước khi giao: cache trả sai bản là loại bug chỉ xuất hiện ở môi trường có traffic thật, không bao giờ thấy trên máy dev.`,
    follow: [
      'Làm sao cho client tự biết server hỗ trợ định dạng nào thay vì đoán đến khi gặp 406?',
      'Nén nên bật ở Spring hay ở nginx? Tiêu chí chọn là gì?',
      'Thiết kế thông báo lỗi đa ngôn ngữ sao cho client vẫn phân loại được lỗi bằng máy?'
    ],
    tags: ['Content Negotiation', 'Accept', '406', 'Vary', 'Spring MVC']
  },
  {
    id: 'api-028',
    topic: 'api',
    level: 'senior',
    q: 'Khách hàng muốn sửa một phần hồ sơ: người thì chỉ đổi số điện thoại, người thì dời nhà và đổi email cùng lúc. So sánh JSON Merge Patch (RFC 7396) và JSON Patch (RFC 6902) cho REST API: cú pháp, idempotency, cách Spring/Jackson nhận và áp dụng, và khi nào chọn cách nào?',
    a: `**Tóm tắt:** **JSON Merge Patch** là một object nêu phần muốn đổi, field để {{null}} là xoá — ngắn gọn, áp kiểu gộp, thường idempotent; **JSON Patch** là mảng thao tác có thứ tự ({{add}}, {{remove}}, {{replace}}, {{move}}, {{copy}}, {{test}}) kèm **JSON Pointer** — mạnh hơn (chèn vào mảng, so sánh điều kiện trước khi sửa) nhưng dễ sai khi thao tác chồng lên trạng thái cũ. Hai định dạng có media type riêng: {{application/merge-patch+json}} và {{application/json-patch+json}}; sai Content-Type thì Spring trả **415**.

### Hiểu nhanh
**Merge Patch** giống tờ ghi "số điện thoại mới: 0912…" — bạn chỉ viết ra điều mình muốn thay, phần còn lại giữ nguyên. **JSON Patch** giống biên bản sửa điều lệ: từng dòng có số hiệu và hành động ("điều 3: thay thế", "điều 5: xoá", "điều 7: thêm cuối mục tags"), kèm cả điều kiện "chỉ sửa khi bản hiện tại đúng là bản 7". Tờ ghi thì ai cũng viết được; biên bản thì phải đúng luật — nên đúng hơn nhưng dễ hỏng khi viết tay.

### Thuật ngữ
- **PATCH (RFC 5789)**: method cập nhật **một phần** resource, khác PUT (thay thế toàn bộ).
- **Delta**: phần chênh lệch giữa trạng thái cũ và mới, chỉ chứa thay đổi.
- **JSON Pointer (RFC 6901)**: chuỗi trỏ tới một chỗ trong JSON, ví dụ {{/addresses/1/city}}; {{/tags/-}} nghĩa là "cuối mảng tags".
- **Media type**: định dạng khai báo trong {{Content-Type}}; server dùng nó để chọn cách đọc body.
- **Idempotency**: áp lại cùng input cho cùng kết quả; rất quan trọng khi client retry.
- **415 Unsupported Media Type**: {{Content-Type}} không hợp lệ với endpoint đó.
- **If-Match / 412**: điều kiện trước, cho phép từ chối ghi đè khi bản đã bị người khác đổi (lost update).

### Cú pháp hai bên
~~~json
{ "phone": "0912345678", "email": null, "city": "Ha Noi" }
~~~
Merge Patch trên: đổi phone, **xoá** email (null = xoá, không phải "đặt thành null"), giữ nguyên mọi field khác.

~~~json
[
  { "op": "replace", "path": "/phone", "value": "0912345678" },
  { "op": "remove",  "path": "/email" },
  { "op": "add",     "path": "/tags/-", "value": "priority" },
  { "op": "test",    "path": "/version", "value": 7 }
]
~~~
JSON Patch trên: cùng kết quả, nhưng thêm được phần tử vào cuối mảng và có {{test}} — "chỉ áp khi version đúng bằng 7"; nếu không khớp thì **cả patch** bị huỷ (RFC 6902 yêu cầu áp nguyên tử) và server trả **409 Conflict** như RFC 5789 gợi ý cho trạng thái xung đột.

### Bảng so sánh
| Tiêu chí | JSON Merge Patch | JSON Patch |
|---|---|---|
| Cú pháp | Object delta | Mảng thao tác có thứ tự |
| Media type | {{application/merge-patch+json}} | {{application/json-patch+json}} |
| Xoá field | Để {{null}} | {{op: remove}} |
| Chèn/cuối mảng | Không làm được | {{path: /tags/-}} |
| So sánh điều kiện | Không | {{op: test}} |
| Idempotent | Có | Gần như có, trừ {{add}} vào {{/-}} (áp lại thêm lần nữa) |
| Client dễ viết | Rất dễ | Phải hiểu JSON Pointer |
| Dùng khi | Đổi vài field phổ biến (90% trường hợp) | Thao tác cấu trúc, cần nguyên tử/điều kiện |

### Spring: nhận body và áp delta
~~~java
@PatchMapping(value = "/api/profiles/{id}", consumes = "application/merge-patch+json")
ResponseEntity<ProfileDto> patch(@PathVariable long id, @RequestBody JsonNode patch,   // om: ObjectMapper inject qua constructor
        @RequestHeader(value = "If-Match", required = false) String ifMatch) {
    Profile cur = repo.find(id);                        // 1. luôn đọc trạng thái MỚI NHẤT ở server
    if (ifMatch != null && !ifMatch.equals(etagOf(cur)))
        return ResponseEntity.status(HttpStatus.PRECONDITION_FAILED).build();  // 412
    JsonNode next = merge(om.valueToTree(cur), patch);   // 2. áp delta theo RFC 7396
    Profile saved = repo.save(om.treeToValue(next, Profile.class));            // 3. validate rồi ghi
    return ResponseEntity.ok(dto(saved));
}
~~~

~~~java
// Toàn bộ RFC 7396: null = xoá, object = gộp đệ quy, giá trị khác = thay thế cả giá trị
static JsonNode merge(JsonNode base, JsonNode patch) {
    if (!patch.isObject()) return patch;                 // scalar/mảng/null: thay nguyên giá trị
    ObjectNode out = base != null && base.isObject()
            ? ((ObjectNode) base).deepCopy()             // gộp vào bản cũ
            : JsonNodeFactory.instance.objectNode();     // base không phải object → coi như {}
    Iterator<Map.Entry<String, JsonNode>> it = patch.fields();
    while (it.hasNext()) {
        Map.Entry<String, JsonNode> e = it.next();
        if (e.getValue().isNull()) out.remove(e.getKey());                        // null → xoá
        else out.set(e.getKey(), merge(out.get(e.getKey()), e.getValue()));       // gộp đệ quy
    }
    return out;
}
~~~
Với JSON Patch, Jackson (jackson-core) chỉ có {{JsonPointer}} và {{JsonNode.at(...)}} để trỏ đường dẫn, **không** có sẵn class áp patch trong {{jackson-databind}}. Muốn nhận {{application/json-patch+json}} phải thêm thư viện như {{com.github.java-json-tools:json-patch}} (API {{JsonPatch.fromJson(node).apply(target)}}) hoặc {{com.flipkart.zjsonpatch:zjsonpatch}}; trỏ sai đường dẫn hay {{test}} không khớp sẽ ném {{JsonPatchException}} → trả 400 (patch sai cú pháp), 422 (patch không áp được lên tài liệu) hoặc 409 (test/trạng thái xung đột) kèm chi tiết.

### Lỗi hay gặp
- **Gửi sai Content-Type** ({{application/json}} thay vì {{application/merge-patch+json}}) → 415. Đây là lỗi phía client, nhưng phải ghi rõ trong tài liệu và trả ProblemDetail dễ hiểu.
- **PATCH dựa trên trạng thái client đang giữ**: client soạn patch sau khi mở form 5 phút, giữa chừng có người khác sửa → ghi đè mất thay đổi. Cách tránh: kèm {{If-Match}} với ETag; 412 báo client đọc lại.
- **Dùng PUT với body thiếu field**: PUT nghĩa là "thay thế toàn bộ", field không gửi sẽ bị mất. Đây là lý do form sửa một phần nên chọn PATCH.
- **JSON Patch {{test}} fail**: trả **409 Conflict** (RFC 5789), không phải 400 — vì cú pháp đúng, chỉ trạng thái hiện tại không khớp. Dành **412** cho header điều kiện {{If-Match}}.
- **Mạng/WAF chặn PATCH**: một số proxy, WAF hoặc gateway mặc định không cho {{PATCH}} qua (405). Kiểm tra tầng ngoài trước khi đổ lỗi cho code.

### Trả lời miệng 1 phút
"PATCH là cập nhật một phần, và tôi chia hai định dạng theo mức độ phức tạp của client. Merge Patch là một object nêu phần muốn đổi, null nghĩa là xoá, phần còn lại giữ nguyên — idempotent, dễ sinh, nên tôi dùng làm mặc định cho các form sửa thông tin. JSON Patch là mảng thao tác kèm JSON Pointer, mạnh hơn với chèn vào mảng và phép {{test}} điều kiện, nhưng client phải hiểu cấu trúc và có chỗ áp lại là không idempotent, vì vậy tôi chỉ dùng khi cần thao tác cấu trúc. Điểm quan trọng nhất không phải chọn định dạng mà là đọc trạng thái mới nhất ở server rồi mới áp delta, kèm If-Match để trả 412 nếu dữ liệu đã đổi — nếu không thì patch chính xác đến đâu cũng mất thay đổi của người khác."

> Senior tip: hãy chọn **một** định dạng cho cả hệ thống (gần như luôn là Merge Patch) và quy định trong OpenAPI — để hai định dạng sống song song nghĩa là mọi SDK, mọi test, mọi trang tài liệu phải nhân đôi. Luôn kèm {{If-Match}} cho PATCH của dữ liệu nhiều người cùng sửa: tôi đã thấy báo cáo của khách "địa chỉ bị người khác ghi đè" đúng vào lúc hàng trăm user cập nhật hạn mức trong ngày cao điểm.`,
    follow: [
      'Merge Patch dùng null để xoá field, vậy nếu client thật sự muốn đặt một field thành null tường minh thì xử lý thế nào?',
      'JSON Patch có đảm bảo nguyên tử (toàn bộ mảng thao tác hay không phần nào) không?',
      'PATCH nên trả 200 kèm body mới hay 204? Vì sao?'
    ],
    tags: ['PATCH', 'JSON Merge Patch', 'JSON Patch', 'RFC 7396', 'Idempotency']
  },
  {
    id: 'api-029',
    topic: 'api',
    level: 'senior',
    q: 'Màn hình "Giao dịch mới nhất" phải hiện ngay khi khách chuyển tiền thành công. So sánh polling (kèm conditional request), SSE và WebSocket cho REST API: độ trễ, chi phí kết nối, vận hành sau load balancer nhiều instance, và hành xử trên mobile — khi nào chọn cách nào?',
    a: `**Tóm tắt:** **Polling** là client hỏi lại theo lịch — đơn giản nhất, độ trễ bằng chu kỳ hỏi, tốn request; **SSE** là client mở một HTTP request, server giữ kết nối mở và đẩy event dạng {{text/event-stream}} — một chiều, tự nối lại, đi qua được proxy/load balancer cũ; **WebSocket** là kết nối hai chiều sau khi bắt tay {{Upgrade: websocket}} — cần trạng thái kết nối và pub-sub giữa các instance. Nên bắt đầu bằng polling + ETag, thêm SSE khi cần độ trễ dưới khoảng 1 giây, WebSocket chỉ khi client thật sự phải **gửi** dữ liệu real-time.

### Hiểu nhanh
**Polling** giống hỏi mẹ "cơm chưa?" mỗi phút: chắc chắn biết được, nhưng vừa tốn công vừa phải đợi tới câu hỏi kế tiếp. **SSE** giống mẹ bấm chuông khi cơm chín: bạn chỉ cần đứng đó, không phải hỏi lại. **WebSocket** giống điện thoại hai chiều: vừa nghe vừa nói được, nhưng phải giữ máy (giữ kết nối) và đổi máy (mạng) là mất cuộc gọi.

### Thuật ngữ
- **Polling**: gửi request lặp lại theo lịch; **conditional poll** là kèm {{If-None-Match}} để server trả 304 nhẹ thay vì cả body.
- **SSE (Server-Sent Events)**: chuẩn HTTP/HTML cho server đẩy sự kiện một chiều; trình duyệt có API {{EventSource}} tự nghe và tự nối lại.
- **text/event-stream**: định dạng body của SSE — các dòng {{event:}}, {{data:}}, {{id:}}, ngăn cách bằng dòng trống.
- **Last-Event-ID**: header trình duyệt tự gửi khi nối lại để xin các event từ chỗ đứt.
- **WebSocket**: giao thức riêng, thường chạy qua cổng 80/443, bắt đầu bằng một HTTP request {{Upgrade: websocket}}, sau đó trao đổi **frame** hai chiều.
- **Sticky session**: load balancer ghim cùng client vào một instance (bằng cookie/IP) để kết nối dài không bị đá sang máy khác.
- **Pub/Sub (Redis)**: "kênh phát tin chung" giữa các instance — instance nào sinh event thì phát lên kênh, instance đang giữ kết nối của client nhận và đẩy xuống. Redis ở đây là một máy chủ key-value chạy riêng, được dùng làm kênh tin nhanh giữa các service.
- **Heartbeat**: byte gửi định kỳ để tầng trung gian không cắt kết nối đang im lặng.

### Cơ chế và chi phí
~~~text
polling : client ──GET──► server   mỗi 5 giây    độ trễ TB ~2,5 giây, 12 request/phút/người
SSE     : client ──GET──► server GIỮ MỞ ◄────── server đẩy:
                                                   event: transaction
                                                   id: 918273
                                                   data: {"id":918273,"amount":500000}

                                                   (dòng trống = kết thúc một event)
WebSocket: client ══HTTP Upgrade: websocket══► sau bắt tay: hai chiều, có nhịp (ping/pong)
~~~

### Bảng so sánh
| Tiêu chí | Polling + ETag | SSE | WebSocket |
|---|---|---|---|
| Độ trễ | Bằng chu kỳ (1–30 giây) | Gần như tức thì | Tức thì |
| Số kết nối | Nhiều request lặp | 1 kết nối mở mỗi client | 1 kết nối mỗi client |
| Qua proxy/CDN cũ | Rất tốt | Tốt nếu proxy tắt buffering | Cần proxy hiểu Upgrade |
| Nhiều instance | Không cần trạng thái | Cần sticky hoặc pub-sub | Cần sticky hoặc pub-sub |
| Hai chiều | Không | Không (client vẫn gọi API bình thường) | Có |
| Tự nối lại | Không cần (cứ hỏi lại đều) | {{EventSource}} tự, kèm {{Last-Event-ID}} | Tự viết (mất kết nối thì gọi lại handshake) |
| Phức tạp | Rất thấp | Thấp | Cao nhất (kết nối, khung hình, nhịp, thứ tự) |

### SSE trong Spring Boot
~~~java
private final Map<Long, SseEmitter> clients = new ConcurrentHashMap<>();

@GetMapping(value = "/api/events", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
SseEmitter stream() throws IOException {
    SseEmitter em = new SseEmitter(30 * 60 * 1000L);  // timeout 30 phút: lớn hơn async timeout mặc định,
                                                      // chặn kết nối "mồ côi" (client chết mà không đóng)
    clients.put(userId(), em);                   // lưu theo user để event tới đúng người
    em.onCompletion(() -> clients.remove(userId()));
    em.onError(e -> clients.remove(userId()));
    em.send(SseEmitter.event().id("" + lastSeq).name("connected").data("ok")); // gửi sớm để header và byte đầu tới client ngay
    return em;                                   // trả về NGAY: Spring chạy async, luồng container được thả
}

// Ở nơi sinh event (sau khi commit transaction): phát cho đúng người
void onTransferDone(Transfer t) throws IOException {   // send lỗi (client đã đi) → bắt và remove emitter
    SseEmitter em = clients.get(t.customerId());
    if (em != null) em.send(SseEmitter.event().id("" + t.seq()).name("transaction").data(toJson(t)));
}
~~~

### Nhiều instance: chỗ hay vỡ nhất
~~~text
                    ┌──► instance A ──► DB     (client X đang nối ở đây)
client ──LB giao───┤
                    └──► instance B ──► DB     (giao dịch sinh ra Ở ĐÂY)
Muốn client X thấy event thì B phải phát lên kênh chung (Redis Pub/Sub),
A đang giữ kết nối của X nhận được rồi đẩy xuống.
~~~
Không có pub-sub thì triệu chứng là **"một nửa số client thấy giao dịch mới, một nửa không"**, và còn tệ hơn sau mỗi lần có instance khởi động lại — rất khó tái hiện vì trên máy dev chỉ có một instance.

### Lỗi hay gặp
- **Proxy giữ buffer**: nginx gom response rồi mới gửi → client thấy event đến trễ hàng giây hoặc không thấy. Cách tránh: {{proxy_buffering off}} cho endpoint SSE (hoặc header {{X-Accel-Buffering: no}}), không bật gzip cho {{text/event-stream}}.
- **Không heartbeat**: 60 giây không có byte nào là tầng trung gian cắt; client tưởng mất server. Gửi ping mỗi 15–30 giây.
- **Nhiều instance mà không pub-sub/sticky**: event chỉ tới client của đúng instance sinh ra.
- **Giữ thread cho từng kết nối**: nếu tự đọc kết nối kiểu synchronous thì 10.000 client = 10.000 thread. Dùng {{SseEmitter}}/WebFlux (async, không giữ thread sau khi trả về).
- **Sự kiện trùng hoặc lệch khi nối lại**: gửi kèm {{id}} (sequence); client bỏ qua id đã thấy.
- **Mobile**: app vào nền thì hệ điều hành cắt kết nối; ngoài SSE còn cần push notification (FCM) làm lưới an toàn.

### Trả lời miệng 1 phút
"Tôi chọn theo yêu cầu độ trễ và trạng thái phía server. Polling kèm ETag là nền: mỗi lượt chỉ tốn một request 304, độ trễ bằng chu kỳ hỏi, không cần giữ trạng thái nên chạy sau bao nhiêu instance cũng được. Khi nghiệp vụ yêu cầu dưới một giây thì tôi thêm SSE: client mở một request, server giữ kết nối và đẩy text/event-stream, EventSource tự nối lại và gửi Last-Event-ID để lấy phần bị đứt — điều kiện là proxy phải tắt buffering, có heartbeat, và đa instance phải có pub-sub để event sinh bên này tới được client đang nối bên kia. WebSocket tôi chỉ dùng khi client thật sự phải gửi dữ liệu real-time cùng lúc, vì giá của nó là trạng thái kết nối, sticky session và rất nhiều ca lỗi chỉ xuất hiện khi có hàng nghìn kết nối."

> Senior tip: bắt đầu bằng polling + ETag cho mọi màn hình, nâng lên SSE đúng một chỗ cần thật sự tức thì — tôi đã thấy đội trả giá rất đắt cho WebSocket khi chỉ cần push một chiều. Trước khi mở SSE cho production, test bằng curl giữ kết nối qua đúng dải proxy/ingress thật và đo thời gian từ lúc sinh event tới lúc client nhận; nếu con số không dưới ngưỡng mục tiêu thì vấn đề nằm ở buffer/heartbeat, không nằm ở code Java.`,
    follow: [
      'Nếu dùng SSE thì quyền truy cập kiểm tra lúc nào, khi EventSource không gửi được header Authorization tùy ý?',
      'Điều phối pub-sub giữa nhiều instance với Redis có mất event khi Redis restart không?',
      'Polling với chu kỳ bao nhiêu là hợp lý cho màn hình tài khoản, vì sao càng ngắn càng nguy hiểm?'
    ],
    tags: ['SSE', 'WebSocket', 'Polling', 'Real-time', 'Load Balancer']
  },
  {
    id: 'api-030',
    topic: 'api',
    level: 'lead',
    q: 'App mobile v2.3 đã phát hành từ năm ngoái và bạn không thể ép người dùng nâng cấp. Bạn phải đổi response của API (thêm, đổi tên, bỏ field, thêm giá trị enum) mà không làm app cũ crash. Quy tắc dung thứ (tolerant reader) cụ thể là gì, cấu hình nằm ở đâu, và kiểm chứng bằng cách nào trước khi deploy?',
    a: `**Tóm tắt:** Trong cùng một major version, server chỉ được **cộng thêm** field optional — không đổi tên, không bỏ, không đổi kiểu; muốn đổi thì thêm field mới, giữ field cũ đọc-được và ghi dấu deprecated. Client phải là **tolerant reader**: bỏ qua field lạ, có nhánh mặc định cho enum lạ, không giả định mọi field đều có mặt. Kiểm chứng trước khi deploy bằng **contract test**: kéo response mẫu của app cũ qua đúng parser của app cũ trong CI, cộng staging chạy APK cũ chạm server mới.

### Hiểu nhanh
App đã lên store giống sách in đã phát hành: **không thu hồi được**, người ta còn cầm trên tay bản in năm ngoái. Thêm một chương mới thì sách cũ vẫn đọc được (bỏ qua chương lạ); còn **đổi tên chương** là mục lục sách cũ trỏ vào chỗ không tồn tại. Tolerant reader chính là quy ước "sách mới in vẫn mở được bằng mục lục cũ": người đọc bỏ qua phần mình không biết, người viết không xoá thứ người đọc đang dựa vào.

### Thuật ngữ
- **Tolerant reader / tolerant writer**: bên đọc bỏ qua dữ liệu không nhận ra; bên ghi không ghi gì ngoài phạm vi hợp đồng đã hứa.
- **Additive-only change**: chỉ thêm, không sửa/bỏ trong cùng major version.
- **Unknown properties**: field JSON mà class không khai báo. {{ObjectMapper}} của Jackson **mặc định báo lỗi** với field lạ (cờ {{FAIL_ON_UNKNOWN_PROPERTIES}} đang bật); Spring Boot đã tắt cờ này nên app đọc được, còn SDK viết tay hay app Kotlin/Swift dùng parser strict thì phải tự bật thái độ dung thứ.
- **Enum evolution**: thêm giá trị mới vào enum; client viết {{switch}} không có {{default}} thì vỡ.
- **Support window (N-2)**: cam kết đọc được response cho 2 phiên bản app trở lại.
- **Deprecation field**: field vẫn trả về nhiều tháng sau khi có phương án thay thế.

### Bảng quyết định: đổi gì thì an toàn
| Thay đổi response | An toàn? | Rủi ro với app cũ | Cách an toàn |
|---|---|---|---|
| Thêm field optional | Có | Thường không | Chỉ thêm, đánh dấu trong OpenAPI |
| Đổi tên field | **Không** | Field cũ thành null → trắng UI, NPE | Thêm field mới, vẫn trả field cũ, deprecated |
| Bỏ field | **Không** | app cũ đọc ra null | Giữ trả về thêm nhiều tháng, đo lượt đọc trước |
| Đổi kiểu (int → string) | **Không** | Lỗi parse ngay | Tạo field mới kiểu mới |
| Thêm giá trị enum | **Có điều kiện** | switch thiếu default → hiện sai hoặc crash | Client có nhánh mặc định, server tài liệu hoá |
| Thêm field **bắt buộc** vào request | **Không** | Request cũ bị 400 | Server tự điền default khi thiếu |
| Đổi định dạng/ngày/giờ/mặc định | **Không** | Parse được nhưng **sai hiển thị** | Giữ nguyên format, thêm tham số nếu muốn đổi |
| Thêm endpoint / thêm header | Có | Không | Yêu cầu client không chặt header lạ |

### Cấu hình dung thứ
~~~yaml
spring:
  jackson:
    deserialization:
      fail-on-unknown-properties: false   # đọc request lạ không nổ (mặc định của Spring Boot)
~~~
Vị trí quan trọng: cấu hình dung thứ này phải có ở **client** (app mobile, SDK Java của đối tác) — nơi đọc response của bạn; ở server thì cần khi bạn đọc JSON của đối tác bên thứ ba. Riêng phần enum lạ thì bật bằng {{ObjectMapper}} như dưới đây:

~~~java
public enum TxStatus {
    PENDING, SUCCESS, FAILED,
    @JsonEnumDefaultValue
    UNKNOWN;                    // giá trị rơi xuống khi gặp giá trị lạ trong tương lai
}
// client: mapper.enable(DeserializationFeature.READ_UNKNOWN_ENUM_VALUES_USING_DEFAULT_VALUE);
// UI viết theo UNKNOWN thay vì giả định hết mọi nhánh đã liệt kê
~~~

### Vòng đời một field
~~~text
T0     thêm receiptUrl (optional); VẪN trả url cũ      → cả hai field cùng xuất hiện
T+3    log tỉ lệ request còn đọc field cũ (nhóm theo X-Client-Version)
T+6    còn dưới 1% lượt đọc → đưa vào danh sách bỏ
major  ngừng trả field cũ (đây là lúc cần version mới, xem chính sách deprecation)
~~~

### Kiểm chứng trước khi deploy
1. **Golden response test**: lưu đúng JSON mà app v2.3 từng nhận làm file mẫu; CI của repo app deserialize lại bằng code app — server đổi là test đỏ ngay.
2. **Consumer-driven contract (Pact)**: app cũ là consumer, mỗi lần server sửa spec phải chạy verify với consumer cũ trước.
3. **E2E staging**: dựng server mới, chạy APK cũ trên emulator/thiết bị thật — lỗi decode chỉ lộ ra khi chạy đủ luồng thật.
4. **Đo trên production**: theo tỉ lệ crash theo phiên bản app (Crashlytics/Firebase) **theo từng version**; bump server vào giờ thấp điểm và so tỉ lệ lỗi trong 1 giờ kế tiếp.

### Lỗi hay gặp
- **"Chắc không ai dùng field đó" rồi xoá**: triệu chứng là app cũ trắng màn hình sau deploy. Cách tránh: đo lượt đọc trước bằng log/metric theo phiên bản client.
- **Client Kotlin/Swift ép kiểu non-null**: server ngừng trả field = null → crash ngay dòng khởi tạo. Cách tránh: field optional có default, không bao giờ bỏ bắt buộc giữa chừng.
- **Đổi định dạng ngày (2024-01-05 → 05/01/2024)**: cùng tên field, parse vẫn qua nhưng hiển thị sai — lặng lẽ và nguy hiểm hơn crash vì người dùng tin vào dữ liệu sai.
- **Trả field mới dạng chuỗi rỗng**: client hiện ô trống hoặc chữ "null". Tốt hơn là **không trả field đó** khi không có giá trị.
- **Tin vào "đợt này ép cập nhật app"**: tỉ lệ tắt cập nhật tự động rất cao và store duyệt mất vài ngày; ngay trong ngày đầu, người dùng cũ vẫn chạm API của bạn.

### Trả lời miệng 1 phút
"Nguyên tắc của tôi là trong cùng major version chỉ cộng thêm, không sửa xoá: thêm field optional thì an toàn, còn đổi tên hay bỏ field thì phải thêm field mới và giữ field cũ đọc được thêm vài tháng, sau đó đo xem còn ai dùng mới bỏ ở lần nâng cấp version. Ở phía đọc, client luôn là tolerant reader: bỏ qua field lạ, có nhánh mặc định cho enum lạ bằng JsonEnumDefaultValue, và không giả định mọi field đều có mặt — vì app đã lên store thì không sửa được. Để chắc chắn, tôi dựng contract test: JSON mẫu của app cũ phải parse được bằng đúng parser của app cũ ngay trong CI, rồi chạy staging với APK cũ trước khi lên production. Thay đổi format ngày giờ hay default cũng coi là breaking, vì nó làm hiển thị sai thay vì crash nên càng khó phát hiện."

> Senior tip: hãy xem **"broke được bao nhiêu version client"** là chỉ số của mỗi lần deploy API, ngang bằng với tỉ lệ lỗi 5xx. Công cụ rẻ nhất là contract test với JSON golden file của N-2 phiên bản; thứ hai là telemetry theo {{X-Client-Version}} để biết field nào sắp hết người dùng trước khi xoá. Và khi buộc phải breaking thì nâng major version đúng nghĩa (giữ song song, có {{Sunset}}), đừng "nói nội bộ thôi rồi đổi luôn" — mọi tích hợp bên thứ ba đều coi đó là sự cố.`,
    follow: [
      'Nếu cả hai version cũ và mới phải chạy song song một thời gian thì code và database sắp xếp thế nào?',
      'Làm sao đo được "còn bao nhiêu client đọc field này" nếu client không gửi phiên bản app?',
      'Khi nào thì nên tạo major version mới thay vì vẫn cố cộng thêm?'
    ],
    tags: ['Backward Compatibility', 'Tolerant Reader', 'API Evolution', 'Jackson', 'Contract Test']
  }
);
