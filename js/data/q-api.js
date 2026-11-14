/* Câu hỏi topic `api`. Schema & markup: AGENTS.md mục 4–6. */
(window.QUESTIONS = window.QUESTIONS || []).push(
  {
    id: 'api-001',
    topic: 'api',
    level: 'mid',
    q: 'Safe method và idempotent method khác nhau như thế nào? Cho ví dụ PUT vs PATCH vs POST trong API chuyển tiền ngân hàng.',
    a: `**Tóm tắt:** Safe method (phương thức "an toàn", ví dụ GET, HEAD, OPTIONS) là phương thức không làm thay đổi trạng thái trên server — gọi bao nhiêu lần cũng không tạo ra tác dụng phụ. Idempotent method (phương thức "lũy đẳng", ví dụ GET, PUT, DELETE, HEAD, OPTIONS) là phương thức mà gọi 1 lần hay gọi N lần cho **kết quả cuối cùng trên server giống nhau**. POST vừa không safe vừa không idempotent; PUT idempotent vì thay thế toàn bộ tài nguyên; PATCH thường không idempotent vì cập nhật một phần theo delta. Trong API chuyển tiền ngân hàng, mọi thao tác tài chính phải được thiết kế idempotent (thường dùng POST + Idempotency-Key) để tránh chuyển tiền hai lần khi client retry.

### Bối cảnh: vì sao cần phân biệt safe và idempotent
Khi bạn gọi một API qua mạng, có ba thứ hay xảy ra ngoài ý muốn: (1) request đến server nhưng response bị mất trên đường về (timeout), (2) client bấm nút hai lần, (3) proxy/gateway tự retry. Nếu method không idempotent, mỗi lần retry có thể tạo ra một giao dịch thật — ví dụ chuyển tiền hai lần. HTTP spec định nghĩa tính chất của từng method để client, proxy, cache biết cách xử lý an toàn:
- **Safe**: không thay đổi representation của resource. GET /accounts/123 chỉ đọc, có thể cache, prefetch, crawler gọi thoải mái.
- **Idempotent**: gọi lặp cho cùng hiệu ứng cuối. PUT /accounts/123 {balance: 1000} gọi 10 lần thì balance vẫn 1000. DELETE xóa xong rồi xóa lại vẫn cho kết quả "không còn" (204 hoặc 404), hiệu ứng cuối như nhau.

### PUT vs PATCH vs POST — cơ chế từng bước
| Method | Safe? | Idempotent? | Ngữ nghĩa | Ví dụ chuyển tiền ngân hàng |
|---|---|---|---|---|
| GET | Có | Có | Đọc resource | GET /transfers/tx-789 — xem chi tiết giao dịch |
| POST | Không | Không | Tạo resource mới hoặc thực hiện action | POST /transfers {from:A,to:B,amount:500000} — mỗi lần gọi tạo 1 giao dịch mới |
| PUT | Không | Có | Thay thế **toàn bộ** resource (client gửi full state) | PUT /transfers/tx-789 {status:"CANCELLED",reason:"USER"} — gọi nhiều lần vẫn CANCELLED |
| PATCH | Không | Thường không | Cập nhật **một phần** (delta) | PATCH /accounts/A {balanceDelta:-500000} — gọi 2 lần trừ 2 lần |
| DELETE | Không | Có | Xóa resource | DELETE /draft-transfers/tx-789 — xóa rồi xóa lại vẫn "không còn" |

Lưu ý về PATCH: JSON Merge Patch (RFC 7396) thay giá trị tại từng field nên thường idempotent. JSON Patch (RFC 6902) có thao tác {{add}} với path kết thúc bằng {{/-}} (thêm vào cuối mảng) — gọi 2 lần sẽ thêm 2 phần tử, nên không idempotent. Muốn an toàn, thêm thao tác {{test}} để kiểm tra điều kiện trước khi sửa.

~~~seq
title: Chuyển tiền với POST + Idempotency-Key
actors: Client | API | DB
Client -> API: POST /transfers (Idempotency-Key: k1)
API -> DB: Kiểm tra key k1 đã tồn tại?
DB --> API: Chưa có
API -> DB: Ghi key k1 + tạo giao dịch (atomic)
DB --> API: OK
API --> Client: 201 Created (tx-789)
note Client..API: Timeout, client không nhận response
Client -> API: POST /transfers (Idempotency-Key: k1)
API -> DB: Kiểm tra key k1 đã tồn tại?
DB --> API: Đã có, trả kết quả cũ
API --> Client: 201 Created (tx-789) — không trừ tiền lần 2
~~~

### Ví dụ đời thực
Giả định hệ thống thanh toán nội bộ ngân hàng: 2.000 QPS giờ cao điểm, p99 latency 120ms, trung bình 0,3% request bị timeout ở client (mạng di động). Mỗi ngày ~1,7 triệu giao dịch. Trước đây API chuyển tiền dùng POST thuần, không có cơ chế chống trùng. Khi timeout, app mobile tự retry sau 2 giây → khoảng 5.000 giao dịch/ngày bị nhân đôi, trung bình 800.000 VND/giao dịch, thiệt hại tiềm năng ~4 tỷ VND/ngày phải hoàn tiền thủ công.

Cách xử lý: (1) Client sinh UUID v4 làm {{Idempotency-Key}} cho mỗi thao tác chuyển tiền (giữ nguyên key khi retry cùng thao tác). (2) Server lưu {{(key, request_hash, status, response)}} trong bảng DB có unique constraint trên {{key}} (hoặc Redis SETNX) với TTL 24h. (3) Request trùng key → trả lại response cũ nguyên vẹn, không gọi business logic. (4) Cùng key nhưng body khác → trả 422 Unprocessable Entity.

Kết quả sau 2 tuần: giao dịch nhân đôi giảm về 0, khiếu nại hoàn tiền giảm 98%, p99 latency tăng thêm ~3ms (do lookup key), chi phí lưu trữ key ~2GB/ngày (chấp nhận được).

### Lỗi hay gặp trên production
- **Dùng POST cho action nhưng không có Idempotency-Key**: user bấm "Thanh toán" 2 lần hoặc app retry → 2 đơn hàng/2 lần trừ tiền. Luôn yêu cầu client gửi key cho mọi POST tài chính.
- **Dùng PATCH với JSON Patch {{add /-}}** cho thao tác cộng/trừ số dư: tưởng idempotent nhưng thực ra append/lặp tác dụng phụ. Với tiền, dùng PUT thay toàn bộ trạng thái hoặc POST + Idempotency-Key.
- **Scope của Idempotency-Key quá rộng hoặc quá hẹp**: key nên unique theo (user, endpoint, operation), không dùng global; nếu quá hẹp (per request attempt) thì retry với key mới vẫn tạo duplicate.
- **Cache GET sai khi resource thay đổi**: GET là safe nên CDN/proxy cache mạnh; nếu quên {{Cache-Control: no-store}} cho dữ liệu nhạy cảm (số dư), user thấy dữ liệu cũ.

### Trả lời mẫu khi phỏng vấn
"Em phân biệt hai khái niệm này như sau: safe method như GET không làm thay đổi trạng thái server, nên có thể cache hoặc gọi lại thoải mái. Idempotent method là method gọi một lần hay nhiều lần cho cùng kết quả cuối trên server — PUT, DELETE, GET, HEAD, OPTIONS đều idempotent; POST thì không. Trong API chuyển tiền ngân hàng, POST /transfers tạo giao dịch mới nên không idempotent: nếu client timeout và retry, có thể chuyển tiền hai lần. Cách em xử lý là bắt buộc client gửi header Idempotency-Key là một UUID cho mỗi thao tác; server lưu key kèm hash request và response vào DB với unique constraint. Request đến với key đã xử lý thì trả lại response cũ nguyên vẹn, không chạy lại business logic. Với PUT, em dùng khi thay thế toàn bộ trạng thái resource — ví dụ cập nhật trạng thái giao dịch sang CANCELLED — vì gọi lặp vẫn ra CANCELLED. PATCH em dùng cẩn thận: JSON Merge Patch thường an toàn, nhưng JSON Patch có thao tác append vào mảng thì không idempotent. Với mọi API tài chính, nguyên tắc của em là thiết kế để retry an toàn, vì mạng thì luôn không đáng tin."

> Senior tip: Với hệ thống tiền, coi mọi POST mutating là "nguy hiểm cho đến khi có Idempotency-Key". Hãy lưu key + request hash + response ở tầng durable (DB có unique constraint) thay vì chỉ Redis, để crash giữa chừng không làm mất bằng chứng đã xử lý; Redis TTL phù hợp cho cache nhưng không phải nguồn sự thật cho giao dịch tài chính.`,
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

### Ví dụ đời thực
API thanh toán của một ví trả **200 kèm {{"success": false}}** cho mọi lỗi. Hệ quả: (1) API gateway và client SDK coi mọi response là thành công nên **retry không bao giờ xảy ra** khi lỗi tạm thời; (2) dashboard tỉ lệ lỗi 5xx luôn bằng 0 dù 3% giao dịch thất bại; (3) đối tác tích hợp phải parse body để biết lỗi. Chuẩn hoá lại: 201 + header {{Location}} khi tạo giao dịch; 202 + link trạng thái khi chuyển sang xử lý bất đồng bộ với ngân hàng; 400 cho JSON sai định dạng; 422 cho vi phạm nghiệp vụ (số tiền vượt hạn mức); 401 khi thiếu hoặc sai token; 403 khi đúng người nhưng không có quyền; 409 khi trùng {{Idempotency-Key}} với nội dung khác; 429 kèm {{Retry-After}}; 503/504 cho lỗi phía sau. Body lỗi theo **RFC 9457 Problem Details** ({{type}}, {{title}}, {{status}}, {{detail}}, kèm {{code}} riêng của hệ thống). Sau khi đổi, tỉ lệ retry thành công của SDK tăng và cảnh báo 5xx bắt được một sự cố DB sớm 20 phút.

### Trả lời mẫu khi phỏng vấn
"Tôi chọn status code để máy hiểu được kết quả mà không cần đọc body, vì gateway, client SDK, cache và monitoring đều dựa vào nó. Tạo thành công là 201 kèm Location; chấp nhận để xử lý bất đồng bộ là 202 kèm đường dẫn kiểm tra trạng thái; xoá hoặc cập nhật không có nội dung trả về là 204. Lỗi phía client: 400 khi request sai cú pháp, 422 khi đúng cú pháp nhưng vi phạm quy tắc nghiệp vụ, 401 khi chưa xác thực hoặc token sai, 403 khi đã xác thực nhưng không có quyền, 404, 409 khi xung đột trạng thái hoặc trùng idempotency key, 429 kèm Retry-After khi vượt rate limit. Lỗi phía server: 500, 502 và 504 khi upstream lỗi hoặc timeout, 503 khi tạm thời quá tải. Body lỗi tôi theo Problem Details RFC 9457, có mã lỗi ổn định cho client xử lý."

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

### Ví dụ đời thực
API sao kê ban đầu là {{GET /getTransactionsByAccount?accId=...&page=...}} trả về **mảng thuần**. Ba vấn đề: không thể thêm thông tin phân trang mà không phá client; tham số page-based với dữ liệu giao dịch liên tục chèn mới làm khách thấy **trùng hoặc mất** giao dịch khi kéo trang; trang sâu chậm (OFFSET). Thiết kế lại:
~~~text
GET /accounts/{accountId}/transactions?from=2026-10-01&to=2026-10-31&type=DEBIT&sort=-bookedAt&limit=50&cursor=eyJ0Ijo...
200 OK
{ "items": [ ... ],
  "nextCursor": "eyJ0IjoiMjAyNi0xMC0xNVQwOToxMjowMFoiLCJpZCI6ODgxMn0",
  "hasMore": true }
~~~
Cursor là base64 của {{(bookedAt, id)}} cuối trang, server giải mã để làm keyset. Kiểm tra quyền: {{accountId}} trong path phải thuộc về người dùng trong token (chống IDOR). Màn hình quản trị cần "tổng số" và nhảy trang thì dùng endpoint riêng có page-based, giới hạn bộ lọc theo khoảng thời gian.

### Trả lời mẫu khi phỏng vấn
"Tôi đặt tên resource là danh từ số nhiều và để HTTP method thể hiện hành động, ví dụ accounts và accounts/{id}/transactions, chỉ lồng một cấp khi quan hệ sở hữu rõ ràng. Lọc, sắp xếp, phân trang đi qua query parameter với quy ước thống nhất, như sort có dấu trừ cho giảm dần, limit có giới hạn tối đa. Response luôn là object chứa items và thông tin phân trang, không trả mảng thuần, để còn mở rộng. Với dữ liệu giao dịch liên tục thêm mới, tôi dùng cursor-based: cursor mã hoá giá trị sắp xếp và id của phần tử cuối, server dùng làm keyset, nên không trùng, không mất và trang nào cũng nhanh; đổi lại không nhảy tới trang bất kỳ và không có tổng số. Page-based chỉ dùng cho màn hình quản trị cần tổng số. Và luôn kiểm tra tài nguyên trong path thuộc về người gọi để tránh IDOR."

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
    │      │    └─ HttpMessageConverter đọc body JSON → object (read)
    │      ├─ Gọi Controller method
    │      └─ Xử lý return value → ModelsAndView / ResponseBody
    │              └─ HttpMessageConverter ghi object → JSON (write, cho @ResponseBody)
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

### Ví dụ đời thực
API trả danh sách sản phẩm có p99 800ms dù truy vấn DB chỉ 40ms. Profiler (async-profiler) chỉ ra 60% thời gian nằm ở **HttpMessageConverter**: Jackson serialize entity JPA thay vì DTO — chạm vào quan hệ lazy (kích hoạt query thêm), serialize cả cột mô tả HTML lớn và dùng một {{ObjectMapper}} được tạo mới mỗi request trong một {{@Bean}} khai báo sai scope. Thêm vào đó, một {{HandlerInterceptor}} ghi log toàn bộ body response (đọc lại và copy chuỗi lớn). Sửa: trả DTO record chỉ có trường cần thiết, dùng ObjectMapper singleton do Spring Boot cấu hình, bỏ log body (chỉ log kích thước và status), bật nén gzip ở gateway. p99 còn 90ms.

### Trả lời mẫu khi phỏng vấn
"Request vào Tomcat, qua chuỗi Filter, gồm cả Spring Security, rồi tới DispatcherServlet. DispatcherServlet hỏi các HandlerMapping để tìm handler phù hợp, thường là method controller theo RequestMapping, kèm các HandlerInterceptor. HandlerAdapter gọi method đó: trước khi gọi, các argument resolver và HttpMessageConverter đọc body JSON thành object, chạy validation; sau khi gọi, return value handler và message converter ghi kết quả ra JSON. Nếu có exception, HandlerExceptionResolver xử lý, trong đó có ControllerAdvice. Điểm nghẽn hay gặp: serialize entity thay vì DTO làm lazy loading và payload lớn, logic nặng hoặc log body trong filter và interceptor, thread Tomcat bị giữ bởi lời gọi chậm phía sau, và validation hay mapping tốn kém. Tôi đo bằng profiler hoặc trace trước khi tối ưu."

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

### Ví dụ đời thực
Hệ thống chuyển tiền của một ngân hàng thương mại: vào giờ cao điểm (9h–11h), p99 latency của API /transfers tăng vọt từ 180ms lên 2,4s, và tỉ lệ timeout client tăng từ 0,2% lên 4%. Team điều tra bằng thread dump và thấy hơn 65% thread đang block trong một HandlerInterceptor tên FraudCheckInterceptor — nó gọi đồng bộ service kiểm tra rủi ro qua HTTP sang một hệ thống bên thứ ba (trung bình 850ms), và làm như vậy **trong preHandle()**, tức là trước khi controller chạy. Vì preHandle() trả false thì request bị từ chối, interceptor này đã trở thành cổng bảo vệ nhưng lại là điểm nghẽn: mỗi request giữ một thread của Tomcat, và với 200 thread max, throughput giảm xuống còn ~250 req/s thay vì 2.000 req/s.

Nguyên nhân gốc: interceptor được viết để kiểm tra fraud cho mọi request, nhưng gọi external service đồng bộ trong interceptor là anti-pattern — interceptor nằm trên chuỗi request chính, và khi interceptor block 850ms, toàn bộ thread pool bị giữ cho đến khi response về.

Cách xử lý: (1) Di chuyển logic kiểm tra rủi ro sang một @Aspect với @Around advice trên method TransferService.execute(), cho phép cache kết quả 30s và fallback async khi downstream chậm. (2) Trong interceptor, chỉ giữ lại việc kiểm tra rate limit nhẹ (nhìn local counter, không gọi external). (3) Filter tiếp tục chỉ làm MDC traceId và logging — không làm gì nặng. (4) Thêm bulkhead: giới hạn số request đồng thời đi đến fraud service bằng semaphore 50, các request vượt hàng đợi nhận 429 thay vì làm chậm cả hệ thống.

Kết quả sau 2 tuần: p99 latency giảm từ 2,4s xuống 310ms, throughput tăng từ 250 lên 1.900 req/s, và không có request nào bị từ chối do interceptor quá tải. Filter/Interceptor/AOP được phân công rõ ràng: Filter làm MDC, Interceptor làm rate limit, AOP làm fraud check có thể cache — mỗi lớp làm một việc và không làm việc của lớp khác.

### Trả lời mẫu khi phỏng vấn
"Ba thứ này nằm ở ba tầng khác nhau và tôi chọn dựa trên trách nhiệm, không phải tùy ngẫu nhiên. Filter là lớp đầu tiên, chạy trên Servlet container, bao trùm cả static files và error pages — tôi dùng Filter cho mọi thứ cần chạy trước DispatcherServlet: set MDC traceId để correlate logs, character encoding, CORS preflight, và caching response body bằng ContentCachingRequestWrapper. HandlerInterceptor chạy sau HandlerMapping, có access đến controller và interceptors khác — tôi dùng để rate limit theo endpoint, API key validation, và đo latency request. AOP là thứ gần business logic nhất, chạy qua proxy của Spring bean — tôi dùng cho @Transactional, retry, audit log, và các logic cần method args hoặc return value. Bài học lớn nhất từ một production incident: một interceptor gọi external service đồng bộ trong preHandle đã làm p99 tăng từ 200ms lên 2,4s vì nó block thread pool — interceptor chỉ nên làm việc nhẹ, logic nặng phải chuyển sang AOP hoặc async."

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
    a: `**Tóm tắt:** @RequestParam lấy query param (GET /search?q=java), @PathVariable lấy URI template variable (GET /accounts/{id}), @RequestBody deserialize JSON body (POST /transfers), @ModelAttribute bind form/query vào object (GET /search?page=0&size=20). Validate dùng @Valid + BindingResult hoặc @Validated trên service (method-level validation), trả ProblemDetail (RFC 9457).

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
        return service.get(id);  // 400 nếu id null/<=0 (HandlerMethodValidationException)
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
- {{@PathVariable Long id}} nhận "abc" → Spring ném MethodArgumentTypeMismatchException → **400** nhưng body mặc định không theo format chung ⇒ thêm handler trong @ControllerAdvice. Còn giá trị sai nghĩa (0, số âm) thì cần {{@Positive}} trên tham số (Spring Framework 6.1 / Boot 3.2+ tự validate tham số, không cần {{@Validated}}).
- @ModelAttribute không @Valid → binding thành công nhưng data rác. Luôn {{@Valid @ModelAttribute}}.

### Ví dụ đời thực
Một công ty fintech cung cấp API cho đối tác tích hợp: API dùng @RequestParam cho tất cả tham số, kể cả body JSON phức tạp. Khi đối tác gửi POST /transfers với Content-Type application/json và body {...}, server trả về 400 vì @RequestParam không thể deserialize JSON — team phải viết adapter chuyển body JSON thành map tham số. Sau khi đổi sang @RequestBody cho POST, mọi request bắt đầu thành công. Nhưng một đối tác lớn gửi GET /accounts/{id} với body JSON (họ tưởng GET cũng có thể có body) — API gateway tự động drop body theo HTTP spec, đối tác không hiểu tại sao luôn nhận 400. Sau khi thêm @ControllerAdvice trả ProblemDetail (RFC 9457) với field errors chi tiết từng field, đối tác có thể tự debug thay vì gọi support. Kết quả: tỉ lệ ticket support giảm 60% trong 3 tháng.

### Trả lời mẫu khi phỏng vấn
"Em dùng bốn annotation này để phân biệt nguồn dữ liệu: @RequestParam lấy từ query string, dùng cho filter, phân trang, tìm đơn giản — ví dụ ?status=ACTIVE&page=0&size=20. @PathVariable lấy từ URI path, dùng cho resource identifier — ví dụ /accounts/{id}. @RequestBody deserialize JSON body, dùng cho create/update với input phức tạp — ví dụ POST /transfers với TransferRequest. @ModelAttribute bind form/query vào một object, dùng cho form submission hoặc search criteria DTO. Validate thì dùng @Valid trên tham số controller (Spring Framework 6.1/Boot 3.2+ tự validate @PathVariable/@RequestParam, không cần @Validated), kết hợp @Validated trên service cho method-level validation; lỗi validation được gom trong @ControllerAdvice trả ProblemDetail theo RFC 9457 với mảng errors theo field. Bài học lớn nhất: team cũ dùng @RequestParam cho body JSON nên đối tác luôn nhận 400 — phải chọn annotation phù hợp Content-Type, và luôn trả error chuẩn để client tự debug."

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

### Trả lời mẫu khi phỏng vấn
"CORS là cơ chế browser thực thi Same-Origin Policy — chỉ trình duyệt mới bị constrain, Postman/curl không chạy JS của origin khác nên không bị ảnh hưởng. Preflight là request OPTIONS tự động gửi bởi browser trước request "không đơn giản" (method ngoài GET/HEAD/POST, hoặc custom header, hoặc Content-Type application/json). Gửi cookie hay credentials không tự gây preflight — preflight chỉ do method/header/content-type. Trên Spring Security 6, tôi dùng CorsConfigurationSource với setAllowedOriginPatterns cho multiple subdomain, setAllowCredentials(true) cho cookie, và setMaxAge(3600) để cache preflight 1 giờ. Spring Security 6: http.cors(cors -> cors.configurationSource(corsConfigurationSource())). Bài học lớn nhất: team cũ dùng wildcard origin với credentials=true — browser từ chối và Spring throw exception; phải list origin cụ thể hoặc dùng pattern matching, và luôn test bằng curl -H 'Origin: https://evil.com' -v để xác minh bị chắn."

### Ví dụ đời thực
Hệ thống internet banking của một ngân hàng: ban đầu chỉ có origin https://app.bank.vn, nhưng sau khi phát triển, thêm web admin (https://admin.bank.vn), app mobile API (https://api.bank.vn), và đối tác fintech (https://partner.bank.vn). Ban đầu team dùng setAllowedOrigins(List.of("*")) với setAllowCredentials(true) — browser từ chối response vì CORS spec cấm wildcard khi credentials=true, và Spring ném IllegalArgumentException khi xử lý request. Khách hàng báo "không thể kết nối" nhưng không biết nguyên nhân. Sau khi đổi sang setAllowedOriginPatterns(List.of("https://*.bank.vn")) và cấu hình setExposedHeaders(List.of("X-Total-Count", "Retry-After")), mọi request thành công. Một sự cố khác: đối tác fintech gửi request với custom header X-Partner-Key nhưng không gửi preflight OPTIONS — server trả 403 vì header không được allow. Sau khi thêm header vào setAllowedHeaders, hệ thống hoạt động ổn định. Kết quả: thời gian downtime do CORS giảm từ 4 tiếng xuống 0, và đối tác có thể tích hợp trong vòng 1 ngày thay vì 1 tuần.

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

### Ví dụ đời thực
Một app internet banking dùng JWT trong localStorage cho authentication. Một ngày nọ, khách hàng nhấp vào link quảng cáo trong email → mở trang lừa đảo có script malicious → script này đọc localStorage và gửi token về server attacker. Attacker có token truy cập tài khoản khách hàng trong 15 phút (access token expiry) và không thể logout vì không có session server-side. Attacker chuyển tiền 50 triệu từ tài khoản này sang tài khoản của mình. Khách hàng khiếu nại, hệ thống không có log logout hay revocation — vì JWT stateless. Sau khi chuyển sang cookie HttpOnly + SameSite=Strict + Refresh Token Rotation, cùng một script malicious không thể đọc cookie (HttpOnly) và không thể gửi request cross-origin (SameSite=Strict). Kết quả: 0 trường hợp đánh cắp token sau 3 tháng, và thời gian phát hiện compromise giảm từ 15 phút xuống còn 0 (vì refresh rotation phát hiện reuse).

### Trả lời mẫu khi phỏng vấn
"Với app ngân hàng, tôi luôn chọn cookie HttpOnly thay vì localStorage. Lý do đầu tiên là XSS: localStorage có thể đọc bởi bất kỳ script nào chạy trên trang, trong khi HttpOnly cookie không thể đọc bởi JavaScript — chỉ trình duyệt tự gửi. Lý do thứ hai là SameSite: với SameSite=Strict, browser không gửi cookie khi request đến từ origin khác, điều này ngăn CSRF. Với refresh token rotation, mỗi lần refresh tạo cặp token mới và revoke token cũ; nếu attacker reuse token cũ, hệ thống phát hiện và revoke toàn bộ session. Mobile app thì khác — lưu token trong iOS Keychain hoặc Android Keystore, không để trong SharedPreferences hay UserDefaults. Bài học lớn nhất: team cũ dùng localStorage cho JWT và mất 50 triệu trong một đợt XSS — chuyển sang cookie HttpOnly + refresh rotation đã khắc phục ngay lập tức."

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

### Ví dụ đời thực
Hệ thống quản lý tài khoản của một ngân hàng: khách hàng A và B cùng truy cập trang sửa thông tin cá nhân. A xem trang, browser cache ETag "7". Sau đó, admin đổi số điện thoại của A (version lên 8). A nhập địa chỉ mới và submit — browser gửi If-Match: "7" nhưng server đã có version 8, trả 412. A reload trang, thấy version 8, nhập lại địa chỉ mới — thành công. Một trường hợp khác: khách hàng C không dùng If-Match (client cũ), server trả 428 yêu cầu thêm If-Match. Sau khi hướng dẫn client gửi If-Match, tỉ lệ lost update giảm từ 100% xuống 0. Kết quả: sau 1 tháng, không còn khiếu nại "thông tin của tôi bị mất khi người khác cùng sửa".

### Trả lời mẫu khi phỏng vấn
"ETag là fingerprint của resource version — thường là version counter từ @Version JPA. GET request có If-None-Match → server so sánh ETag, nếu giống trả 304 Not Modified (client dùng cache). PUT/PATCH request có If-Match → server chỉ ghi nếu version hiện tại khớp, nếu không trả 412 Precondition Failed. Spring hỗ trợ ShallowEtagHeaderFilter cho GET cache, và manual ETag qua ResponseEntity.eTag() cho write conditional. Với ngân hàng, tôi dùng strong ETag (version số) cho If-Match — weak ETag (W/...) không bao giờ khớp vì If-Match dùng strong comparison. Bài học lớn nhất: team cũ không trả ETag sau khi PUT, client không có version mới, lần sau chắc chắn 412 — luôn trả ETag trong response write."

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

### Ví dụ đời thực
Hệ thống báo cáo của một ngân hàng: mỗi ngày có 5.000 yêu cầu export danh sách giao dịch, mỗi export mất 3-5 phút. Ban đầu API trả 200 OK sau khi xong — client phải poll mỗi 10 giây, tạo 30-50 request rác mỗi export. Sau khi đổi sang 202 Accepted + Location header, client nhận job ID và poll /api/jobs/{jobId}. Kết quả: số request poll giảm từ 30 xuống 3-5 mỗi export, và server không còn block thread trong 5 phút. Một đối tác khác dùng webhook: khi job xong, server POST kết quả về URL của đối tác — đối tác nhận ngay lập tức không cần poll. Kết quả: thời gian từ job xong đến đối tác nhận được giảm từ 5-10 phút (poll) xuống dưới 1 giây (webhook).

### Trả lời mẫu khi phỏng vấn
"Với tác vụ chạy lâu hơn 5-10 giây, tôi không bao giờ giữ HTTP connection — trả 202 Accepted ngay với Location header để client poll, hoặc webhook để server push. Polling đơn giản và phù hợp UI dashboard; webhook gần real-time và phù hợp partner integration. Spring Boot: dùng @Async với dedicated TaskExecutor, lưu job status trong DB (PENDING → RUNNING → COMPLETED/FAILED), và client poll /api/jobs/{jobId}. Với webhook, ký HMAC trên payload, retry exponential backoff, và partner deduplicate theo X-Delivery-ID. Bài học lớn nhất: team cũ trả 200 sau 5 phút — client poll mỗi 10 giây tạo 30 request rác; đổi sang 202 + polling/backoff giảm xuống 3 request và cải thiện trải nghiệm."

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
    
    // 3. Idempotency: INSERT trước, unique constraint trên delivery_id là trọng tài
    //    (existsBy... rồi save có race khi 2 request trùng đến song song)
    try {
        inboxRepo.insert(deliveryId, payload);          // trạng thái RECEIVED
    } catch (DuplicateKeyException dup) {
        return ResponseEntity.ok().build();             // đã nhận rồi, ack lại
    }

    // 4. Xử lý nghiệp vụ ở worker async đọc bảng inbox; trả 2xx thật nhanh
    return ResponseEntity.accepted().build();
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

### Ví dụ đời thực
Một ngân hàng thương mại tích hợp với ví điện tử đối tác (e-wallet) để gửi thông báo giao dịch hoàn thành real-time. Hệ thống ngân hàng mỗi ngày phát sinh ~200.000 sự kiện TXN_COMPLETED. Ban đầu dùng HTTP POST đơn giản không có chữ ký, không retry, không idempotency. Khi ví điện tử bảo trì 30 phút, ngân hàng mất toàn bộ event trong khoảng đó — khách hàng ví không thấy tiền về, phải đối soát thủ công 2 ngày. Sau khi áp dụng kiến trúc production-grade: (1) Ngân hàng lưu event vào outbox table trong cùng transaction ghi ledger, không bao giờ mất event. (2) Dispatcher đọc outbox, ký HMAC-SHA256 payload + timestamp, gửi kèm X-Delivery-ID (UUID) và X-Sequence theo account. (3) Với partner down, dispatcher retry exponential backoff: 10s, 30s, 1m, 5m, 15m, 1h… tối đa 72h, sau đó chuyển DLQ. (4) Partner verify HMAC constant-time, INSERT inbox unique trên (provider, event_id) để chặn trùng, trả 202 ngay, xử lý async. (5) Partner theo dõi sequence per account; phát hiện gap thì gọi lại API ngân hàng lấy trạng thái chuẩn. Kết quả: sau 3 tháng, 0 event mất, 0 giao dịch trùng, tỷ lệ retry do partner down giảm từ 15% xuống 0.2% nhờ circuit breaker ở dispatcher. Chi phí vận hành: 3 DB table (outbox, inbox, dlq), 2 dispatcher pod, 1 cron job đối soát hàng ngày.

### Trả lời mẫu khi phỏng vấn
"Tôi thiết kế webhook theo mô hình outbox + dispatcher: event ghi vào outbox table cùng transaction nghiệp vụ, dispatcher poll và gửi HTTPS callback kèm HMAC-SHA256 signature trên raw body, X-Delivery-ID để partner deduplicate, X-Sequence cho ordering per account. Partner verify chữ ký constant-time, INSERT inbox với unique constraint (provider, event_id) — DB là trọng tài chặn trùng — rồi trả 202 accepted, xử lý async. Retry dùng exponential backoff + jitter, max 72h rồi DLQ. Với ordering, tôi partition dispatcher theo accountId để single-threaded per partition, partner track lastSequence. Bài học lớn: team cũ gửi POST đơn giản, partner bảo trì 30 phút làm mất 200k event — phải đối soát thủ công 2 ngày. Chuyển sang outbox + HMAC + idempotency key đã khắc phục triệt để."

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

### Ví dụ đời thực
Hệ thống internet banking của một ngân hàng: vào giờ cao điểm (9h–11h sáng), p99 latency của API /accounts/{id}/transactions tăng vọt từ 120ms lên 4,2s, và tỷ lệ timeout client tăng từ 0,1% lên 3,5%. Team điều tra bằng thread dump ({{jcmd <pid> Thread.print}}) và thấy hơn 180/200 thread Tomcat đang ở trạng thái RUNNABLE trong {{SocketInputStream.read}} — dấu hiệu điển hình của blocking I/O đồng bộ. Profiler (async-profiler) xác nhận 70% thời gian CPU nằm ở JDBC driver chờ response từ PostgreSQL. Cấu hình ban đầu: {{maxThreads=200}}, {{maxConnections=8192}}, {{connectionTimeout=60s}}, không bật virtual threads. HikariCP pool size 50, nhưng query chậm (thiếu index trên account_id + created_at) khiến connection giữ 3-5 giây, pool nhanh hết. Cách xử lý: (1) Thêm composite index {{(account_id, created_at DESC, id DESC)}} — query từ 3.200ms xuống 15ms. (2) Bật {{spring.threads.virtual.enabled=true}} (Spring Boot 3.2+, Java 21) — mỗi request chạy trên virtual thread, blocking JDBC không còn cạn thread Tomcat. (3) Giảm {{connectionTimeout}} xuống 20s, set {{maxConnections=2000}} phù hợp tải thực. (4) Bật HikariCP {{leakDetectionThreshold=30000}} và {{maxLifetime=1800000}}. (5) Cấu hình access log có pattern %{ms}T để đo request time. Kết quả: p99 latency giảm từ 4,2s xuống 85ms, throughput tăng từ 180 lên 3.500 req/s, thread Tomcat idle > 80% ngay cả lúc peak. Chi phí: 0 code change ngoài config và index.

### Trả lời mẫu khi phỏng vấn
"Tomcat embedded dùng thread pool (maxThreads mặc định 200) xử lý request. Request treo khi thread pool exhausted — thường do sync blocking I/O (JDBC, HTTP client sync) giữ thread quá lâu. Cấu hình then chốt: maxThreads, acceptCount (TCP backlog khi đủ maxConnections), connectionTimeout (read timeout), maxConnections. Với Java 21 + Spring Boot 3.2+, bật virtual threads ({{spring.threads.virtual.enabled=true}}) là game-changer: mỗi request = 1 virtual thread, blocking I/O không block carrier thread, throughput tăng gấp 10-20 lần. Nhưng virtual thread không phải silver bullet: CPU-bound workload (Jackson serialize) vẫn chiếm carrier, synchronized (trước JDK 24) pin carrier. Bài học lớn: team cũ maxThreads=200, query thiếu index 3s, thread pool cạn, p99 4s. Thêm index + bật virtual threads + giảm connectionTimeout, p99 về 85ms. Luôn bật access log có pattern %{ms}T để có dữ liệu debug production."

> Senior tip: **Luôn bật access log có thời gian xử lý request** (pattern %{ms}T hoặc %D micro-giây) — debug production không có log request time là mù. Spring Boot 3.2+: {{spring.threads.virtual.enabled=true}} là game-changer cho blocking I/O. Nhưng **không phải silver bullet**: CPU-bound workload không nhanh hơn, synchronized (trước JDK 24) vẫn pin carrier. Profile bằng {{jcmd <pid> Thread.print}} hoặc {{async-profiler}} trước khi tune.`,
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
| **Caching** | **Native** (HTTP cache, ETag, CDN) | Khó (custom) | Khó (query thường đi bằng POST; muốn cache CDN phải dùng persisted query + GET) |
| **Browser support** | **Native** (fetch, axios) | Cần grpc-web / Envoy proxy | Native (fetch) |
| **Tooling** | Rất phong phú | Tốt (protoc, buf, grpcurl) | Tốt (Apollo, Relay, GraphiQL) |
| **Evolution** | Versioning URL/header | Field number, backward compat | Thêm field + directive {{@deprecated}}, thường không version |
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
- **gRPC cho public API** → partner kêu khổ vì tooling; nhiều proxy/WAF doanh nghiệp không chuyển tiếp HTTP/2 end-to-end hoặc làm rơi trailer.
- **GraphQL cho service-to-service** → tight coupling, N+1 death spiral, khó trace.
- **REST cho high-frequency internal call** → JSON serialization overhead, no streaming.

### Ví dụ đời thực
Một ngân hàng có 3 biên: mobile app (5 triệu user), web admin (200 nhân viên), đối tác fintech (50 công ty). Ban đầu toàn bộ dùng REST/JSON. Vấn đề: (1) Mobile app màn hình dashboard cần gọi 8 API khác nhau (accounts, cards, loans, transactions, limits, notifications, settings, profile) — over-fetching, chatty, p99 800ms trên 4G. (2) Service nội bộ transfer-svc gọi ledger-svc 50.000 lần/giây qua REST — JSON serialization tốn 40% CPU, latency P99 45ms. (3) Đối tác fintech tích hợp dùng Postman test REST dễ, nhưng versioning lủng củng. Giải pháp hybrid: (1) Mobile app → GraphQL BFF (Spring GraphQL): một request duy nhất, client chọn field, BFF aggregate từ 3 service gRPC phía sau — p99 dashboard xuống 180ms, bandwidth giảm 60%. (2) Internal sync: transfer-svc ↔ ledger-svc ↔ limit-svc dùng gRPC (Protobuf, HTTP/2 multiplexing, deadline propagation) — payload giảm 65%, P99 latency 8ms, CPU serialization giảm 40%. (3) Đối tác: REST + OpenAPI 3.1, versioning {{/v1/}}, {{/v2/}}, deprecation 12 tháng, generate SDK cho partner. Kết quả: mobile app rating tăng từ 4.2 lên 4.6, internal throughput tăng 3x, partner onboarding từ 2 tuần xuống 3 ngày. Chi phí vận hành: 3 bộ tooling (springdoc, buf, graphql-codegen), 3 cách versioning, 3 dashboards observability — đội platform 3 người maintain.

### Trả lời mẫu khi phỏng vấn
"Tôi chọn protocol theo biên, không theo sở thích. Đối tác/public: REST + JSON + OpenAPI — firewall mở 443, curl được, SDK mọi ngôn ngữ, cache HTTP native. Service nội bộ sync: gRPC — Protobuf nhỏ, contract-first, HTTP/2 multiplexing, deadline propagation, streaming native. Mobile app/UI phức tạp: GraphQL ở tầng BFF — client tự chọn field, giảm over-fetching, một request thay 8. Kiến trúc thực tế hybrid: mobile → BFF (GraphQL) → internal services (gRPC) → Kafka cho async. Bài học lớn: team cũ toàn bộ REST, mobile gọi 8 API (p99 800ms), internal JSON serialization tốn 40% CPU. Chuyển sang hybrid: BFF GraphQL cho mobile (p99 180ms), gRPC cho internal (P99 8ms), REST cho partner. Chi phí là 3 bộ tooling, 3 cách versioning, 3 dashboards — chỉ đáng khi mỗi biên có lý do rõ ràng."

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
2. Baseline: Commit spec vào branch main (git tag v1.0.0)
                                  │
3. Implement: Dev generate server stub (interface + DTO)
                                  │
4. Contract Test: MockMvc + validator (ví dụ swagger-request-validator) kiểm tra request/response khớp spec
                                  │
5. CI Gate: oasdiff / openapi-diff compare HEAD vs baseline
                                  │
6. Release: Tag version, publish spec to portal (Stoplight, Redocly, SwaggerHub)
                                  │
7. Client: Partner generate SDK từ spec (Java, Kotlin, TypeScript, Go, Python)
~~~

### springdoc-openapi 2.x (Spring Boot 3)
~~~text
org.springdoc:springdoc-openapi-starter-webmvc-ui:2.6.0
  -> gồm cả webmvc-api (endpoint /v3/api-docs) + Swagger UI (/swagger-ui.html)
  -> chỉ cần spec, không cần UI: dùng springdoc-openapi-starter-webmvc-api
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
    void createAccount_responseMatchesSchema() throws Exception {
        mvc.perform(post("/api/v1/accounts")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"test@bank.vn\",\"initialBalance\":1000}"))
            .andExpect(status().isCreated())
            // swagger-request-validator-mockmvc: so request + response
            // với file account-api.yaml đã duyệt (sai field/type -> test fail)
            .andExpect(openApi().isValid("openapi/account-api.yaml"));
    }
    // jsonPath chỉ kiểm vài field bạn nhớ ra; validator kiểm TOÀN BỘ schema.
    // Consumer-driven (Pact / Spring Cloud Contract) bổ sung góc nhìn của client.
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
| Bỏ enum value / thêm enum value vào response | **Có** (thêm vào request thì thường không) | Client switch-case cứng gặp giá trị lạ |
| Thêm endpoint mới | Không | GET /v1/accounts/{id}/cards |
| Đổi status code | **Có** | 200 → 201 |
| Thêm header response | Không | {{X-Request-ID}} |

### Versioning strategy
- **URL versioning**: {{/api/v1/}}, {{/api/v2/}} (khuyên dùng, rõ ràng).
- **Header versioning**: {{Accept: application/vnd.bank.v2+json}} (clean URL, khó test).
- **Deprecation policy**: Hỗ trợ phiên bản cũ tối thiểu 12 tháng, header {{Sunset}}, {{Deprecation}}.

### Ví dụ đời thực
Một ngân hàng phát hành API mở cho 30 đối tác fintech. Ban đầu dev dùng code-first (springdoc generate spec từ annotation), không có baseline, không có CI gate. Kết quả: một PR thêm field {{phone}} vào response {{/v1/accounts/<id>}} (optional) khiến 5 đối tác bị crash vì code generator của họ sinh class không có field này — họ dùng {{strict}} mode deserialization. Một PR khác đổi status code 200 thành 201 cho endpoint tạo beneficiary — monitoring của đối tác alert sai vì kỳ vọng 200. Team triển khai quy trình API-first: (1) Viết spec YAML trước, review bởi Arch + Security + 2 partner lớn. (2) Baseline commit vào main với git tag {{v1.0.0}}. (3) Dev generate server stub (openapi-generator-maven-plugin, delegatePattern=true) implement {{AccountApiDelegate}}. (4) Contract test: MockMvc + swagger-request-validator kiểm tra request/response khớp spec baseline. (5) CI gate: {{oasdiff}} so sánh spec PR với baseline, fail build nếu breaking change (xóa field, đổi type, thêm required). (6) Release: tag version, publish spec lên Stoplight portal. (7) Partner generate SDK từ spec portal. Kết quả: 6 tháng sau, 0 breaking change lọt production, partner onboarding từ 3 ngày xuống 4 giờ (generate SDK + test contract). Chi phí: 2 tiếng review spec mỗi thay đổi, 5 phút CI gate.

### Trả lời mẫu khi phỏng vấn
"API-first nghĩa là viết OpenAPI spec trước khi code. Quy trình: Design spec YAML → Review (Arch, Security, Partner) → Baseline (git tag) → Generate server stub (openapi-generator, delegate pattern) → Contract test (MockMvc + swagger-request-validator) → CI gate (oasdiff so sánh với baseline, fail nếu breaking) → Publish spec portal → Partner generate SDK. Breaking change: xóa field, đổi type, thêm required field request, đổi status code. Non-breaking: thêm optional field response, thêm endpoint. Spring Boot 3: springdoc-openapi-starter-webmvc-ui, bật {{spring.mvc.problemdetails.enabled=true}} cho lỗi chuẩn RFC 9457. Bài học lớn: team cũ code-first, thêm optional field {{phone}} làm crash 5 partner dùng strict deserialization, đổi 200→201 làm sai monitoring. Triển khai API-first + oasdiff CI gate, 6 tháng 0 breaking change lọt production."

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
    a: `**Tóm tắt:** Client sinh một {{Idempotency-Key}} (UUID) cho mỗi lần thanh toán và **giữ nguyên** key khi retry. Server lưu key + fingerprint của request + response đã trả; request thứ hai cùng key được **replay response cũ**, không gọi lại PSP/lõi thẻ. Unique index trên {{(merchant_id, idempotency_key)}} trong PostgreSQL là cơ chế chống race; TTL tối thiểu 24 giờ (nhiều hệ thống giữ 7 ngày).

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
        // r có thể là thành công HOẶC lỗi nghiệp vụ đã chốt (thẻ bị từ chối):
        // cả hai đều lưu lại để replay, status COMPLETED/FAILED
        repo.complete(merchantId, key, r.status(), r.body());
        return ResponseEntity.status(r.status()).body(r.body());
    } catch (PspTimeout e) {
        // Không biết PSP đã trừ tiền chưa -> xoá bản ghi reserve để client retry
        // CÙNG key; an toàn vì PSP nhận lại đúng key đó nên không trừ 2 lần
        repo.release(merchantId, key);
        throw e;                                           // client nhận 5xx/504
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

### Ví dụ đời thực
Cổng thanh toán của một ngân hàng xử lý 50.000 giao dịch/ngày qua PSP (Payment Service Provider) VNPAY. Khách hàng bấm "Thanh toán" trên app, app gửi POST /payments với Idempotency-Key (UUID v4). Trước khi có idempotency: khi mạng chậm, app timeout 10s và tự retry — PSP đã trừ tiền thành công nhưng app không nhận response, retry lần 2 khiến PSP trừ tiền lần nữa. Hàng ngày ~200 giao dịch bị nhân đôi, tổng ~150 triệu VND phải hoàn thủ công. Triển khai idempotency: (1) Client sinh UUID, gửi header {{Idempotency-Key}}. (2) Server {{INSERT ... ON CONFLICT DO NOTHING}} vào bảng {{payment_idempotency}} (PK: merchant_id, idem_key) với {{request_hash}} = SHA-256(body). Insert thành công → status {{IN_PROGRESS}}. (3) Gọi PSP (truyền cùng key nếu PSP hỗ trợ). (4) PSP trả kết quả → update status {{COMPLETED}}/{{FAILED}}, lưu {{response_status}}, {{response_body}}. (5) Request retry cùng key: đọc record, hash khớp, status {{COMPLETED}} → replay response cũ, header {{Idempotent-Replayed: true}}. (6) PSP timeout: xoá record reserve, client retry cùng key an toàn vì PSP nhận lại key cũ. TTL 7 ngày, job hàng tuần drop partition cũ. Kết quả: giao dịch nhân đôi giảm từ 200/ngày xuống 0, tỷ lệ {{Idempotent-Replayed}} ~0,3% (chỉ do retry hợp lệ), không còn khiếu nại hoàn tiền do trùng. Chi phí: bảng 50k rows/ngày, partition tháng, 2 index.

### Trả lời mẫu khi phỏng vấn
"POST /payments không idempotent — client timeout retry có thể trừ tiền 2 lần. Tôi thiết kế Idempotency-Key: client sinh UUID cho mỗi ý định thanh toán, giữ nguyên khi retry. Server reserve trước: {{INSERT ... ON CONFLICT DO NOTHING}} vào bảng có PK (merchant_id, idem_key) + request_hash. Insert OK → status IN_PROGRESS → gọi PSP. PSP xong → update COMPLETED/FAILED, lưu response. Retry cùng key: hash khớp → replay response cũ, header Idempotent-Replayed. PSP timeout: xoá reserve, client retry an toàn. TTL 7 ngày, partition tháng. Bài học lớn: team cũ ghi key SAU khi gọi PSP, process chết giữa chừng → tiền đã trừ, key chưa có, retry trừ lại. Luôn reserve TRƯỚC, unique constraint ở DB là trọng tài, không check-exists-then-insert trong code."

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
// Spring MVC: hai controller mỏng theo version, dùng chung một service
@RestController
@RequestMapping("/v2/accounts")
class AccountControllerV2 {
    @GetMapping("/{id}")
    AccountDtoV2 get(@PathVariable long id) {
        return AccountDtoV2.from(service.get(id));   // v2 là model chuẩn (canonical)
    }
}

@RestController
@RequestMapping("/v1/accounts")
class AccountControllerV1 {
    @GetMapping("/{id}")
    AccountDtoV1 get(@PathVariable long id) {
        return AccountDtoV1.from(service.get(id));   // adapter: map về shape cũ
    }
}
~~~

Business logic chỉ nằm ở service; controller v1 chỉ map dữ liệu. Đừng rải điều kiện {{if v1}} khắp code. (Spring Framework 7 / Spring Boot 4 có thêm hỗ trợ API versioning sẵn, nhưng nguyên tắc tách adapter vẫn vậy.)

### Đo lường trước khi tắt
- Đếm request theo {{api_key}} + version trong access log/Micrometer; dashboard "consumer còn gọi v1".
- Với đối tác lớn: thỏa thuận ngày sunset bằng văn bản; giữ ngoại lệ có thời hạn thay vì trì hoãn cả hệ thống.
- Theo dõi 4xx tăng sau khi đổi default — dấu hiệu client phụ thuộc hành vi cũ.

### Ví dụ đời thực
Một ngân hàng cung cấp API mở cho 40 đối tác (e-wallet, BNPL, ERP). API {{/v1/transfers}} cần đổi schema: thêm field bắt buộc {{purpose_code}} (theo quy định mới của NHNN), đổi tên {{amount}} → {{amount_vnd}}, bổ sung {{currency}} mặc định VND. Đây là breaking change (thêm required, đổi tên field, đổi ý nghĩa). Quy trình deprecation 14 tháng: (T0) Thông báo qua portal + email, xuất bản migration guide, spec {{/v2}} trên Stoplight. (T0) Response {{/v1}} thêm header {{Deprecation: true}}, {{Sunset: Sat, 01 Mar 2025 00:00:00 GMT}}, {{Link: <https://api.bank.vn/migrate/v2>; rel="deprecation"}}. (T1) {{/v2}} chạy song song 6 tháng, parity test hàng ngày so sánh response {{/v1}} vs {{/v2}} (adapter map field). (T2) Brownout: thứ 2 hàng tuần 09h–09h05 {{/v1}} trả 503 Retry-After=300 — log ghi consumer nào bị ảnh hưởng. (T3) Đo usage: dashboard Micrometer theo dõi {{api_key}} + version, còn 3 đối tác nhỏ gọi {{/v1}} — hỗ trợ trực tiếp migrate. (T4) Sunset: tắt {{/v1}}, trả 410 Gone + Link migration guide. Kết quả: 37/40 đối tác tự migrate trước T2, 3 đối tác nhỏ hỗ trợ 1 tuần, 0 incident production. Chi phí: 2 controller mỏng (adapter), 1 parity test job, 1 brownout schedule.

### Trả lời mẫu khi phỏng vấn
"Với API public cho đối tác, tôi chọn URI versioning ({{/v1/}}, {{/v2/}}) vì dễ route gateway, dễ đọc log/metric, dễ test curl. Deprecation là quy trình có telemetry, thông báo, thời gian chờ, brownout — không phải tắt một ngày. T0: thông báo + migration guide + header Deprecation/Sunset/Link. T1: {{v2}} chạy song song, parity test. T2: brownout ({{v1}} trả 503 cửa sổ ngắn) ép client lộ ra. T3: đo usage theo {{api_key}}, chỉ sunset khi không còn traffic quan trọng. T4: tắt hẳn, 410 Gone + Link migration. Breaking change: xóa/đổi field, thêm required, đổi status code, đổi default. Bài học lớn: team cũ tắt {{v1}} ngay khi ra {{v2}} — 10 đối tác sập, rollback mất 2 ngày. Triển khai brownout 5 phút/tuần, đối tác migrate chủ động, sunset êm ru."

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

### Ví dụ đời thực

Ngân hàng có bảng transactions 80 triệu dòng, API lịch sử giao dịch dùng OFFSET. Triệu chứng: p99 lúc lật trang sâu khoảng 8 giây; khách báo thấy giao dịch trùng hoặc biến mất sau khi hệ thống import batch vào đêm hôm trước. Điều tra: slow query log cho thấy truy vấn OFFSET 100000 LIMIT 20 quét hơn 100.000 dòng index rồi bỏ; cursor chỉ chứa created_at, thiếu id nên nhiều giao dịch cùng microsecond bị nhảy trang. Xử lý: tạo composite index (account_id, created_at DESC, id DESC), đổi sang keyset WHERE (created_at, id) < (?, ?), cursor mã hóa base64 JSON + ký HMAC, kèm filterHash của (accountId, từ, đến, trạng thái). Kết quả: p99 giảm từ 8 giây xuống dưới 60 miligiây mỗi trang, không còn trùng/mất dòng kể cả khi insert liên tục, và không trả count(*) nên tránh OOM.

### Trả lời mẫu khi phỏng vấn

"Tôi sẽ không dùng OFFSET cho lịch sử giao dịch. Với 80 triệu dòng, OFFSET khiến PostgreSQL phải quét toàn bộ index từ đầu cho mỗi trang, nên p99 tăng theo thứ tự trang và bị nổ ở trang sâu. Tôi dùng cursor pagination: WHERE (created_at, id) < (cursor_ts, cursor_id) ORDER BY created_at DESC, id DESC. Cursor chứa timestamp và id; id là tie-breaker bắt buộc, tránh mất hoặc trùng dòng khi nhiều giao dịch cùng giây (ví dụ batch import). Cursor được mã hóa base64, ký HMAC để chống sửa, và kèm hash của bộ lọc (accountId, khoảng thời gian, trạng thái) để khách hàng không dùng cursor của bộ lọc này cho bộ lọc khác. Mỗi trang lấy LIMIT size + 1 để biết has_more, không trả total vì count(*) chậm. Chi phí mỗi trang O(log n + page size), ổn định ngay cả khi có insert liên tục giữa các lần gọi. Nếu UI cần prev page, tôi đảo điều kiện và đảo thứ tự rồi reverse kết quả, không chạy count(*) mỗi trang."

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

~~~text
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

> Property này chỉ đăng ký một {{ResponseEntityExceptionHandler}} mặc định **khi bạn chưa có** bean cùng loại. Nếu bạn tự viết advice {{extends ResponseEntityExceptionHandler}} như dưới đây thì advice của bạn thay thế nó (vẫn trả ProblemDetail cho exception của framework), property lúc đó không còn tác dụng.

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

### Ví dụ đời thực

API ngân hàng có hai team tự định nghĩa lỗi: team A trả {code: 4001, message: ...}, team B trả problem+json. SDK đối tác phải parse hai kiểu và hay bị lỗi khi team A đổi khóa message. Triệu chứng: số ticket hỗ trợ đối tác tăng, integration test thất bại ngẫu nhiên. Điều tra: ghi log response của cả hai endpoint, thấy type và status không nhất quán, detail đôi khi lộ tên bảng SQL. Xử lý: chốt danh sách type như enum trong OpenAPI, tất cả endpoint dùng ProblemDetail, type trỏ tới trang tài liệu giải thích cách sửa; viết contract test kiểm tra mọi lỗi 4xx/5xx đều là application/problem+json, detail nói người dùng cần làm gì không lộ stack. Kết quả: SDK đối tác chỉ xử lý một format, ticket hỗ trợ giảm hơn 70% trong tháng đầu.

### Trả lời mẫu khi phỏng vấn

"Tôi sẽ áp dụng RFC 9457 cho toàn bộ API ngân hàng. Mỗi lỗi trả body application/problem+json có type, title, status, detail, instance, và các extension như balance hoặc traceId. Client switch trên type và status, không bao giờ parse detail vì detail là văn bản dành cho người, có thể đổi ngôn ngữ. Lỗi validation gom theo field vào extension errors, mỗi field một entry để client highlight được. 5xx trả traceId để support tra cứu, không lộ stack trace. Tôi sẽ chốt type như enum trong OpenAPI và viết contract test cho mọi lỗi 4xx/5xx. Type đặt theo nguyên nhân (insufficient-funds) chứ không theo tầng (db-error), vì khách hàng cần biết phải làm gì, không cần biết lỗi phát sinh ở đâu. Với Spring Boot 3, tôi bật spring.mvc.problemdetails.enabled=true và viết @RestControllerAdvice extends ResponseEntityExceptionHandler để cả lỗi framework và lỗi nghiệp vụ đều trả cùng format. Type là URL trỏ tới trang tài liệu, đối tác đọc được cách xử lý, giảm ticket support."

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
- {{nowMs}} lấy từ đồng hồ của pod: nếu các pod lệch giờ vài trăm ms, bucket refill sai. Có thể gọi {{redis.call('TIME')}} trong script (Redis 5+ cho phép) để mọi pod dùng chung đồng hồ của Redis.

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
- {{RateLimit-Limit/-Remaining/-Reset}} là dạng của các bản IETF draft cũ (nhiều gateway vẫn phát); bản draft mới (draft-ietf-httpapi-ratelimit-headers) gộp thành hai header structured {{RateLimit}} và {{RateLimit-Policy}}. Chưa là RFC, nên ghi rõ format trong tài liệu API; nhiều client cũ chỉ đọc {{X-RateLimit-*}}.
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

### Ví dụ đời thực

API công khai chạy 10 pod sau load balancer, giới hạn 100 yêu cầu/phút mỗi consumer. Ban đầu mỗi pod đếm bucket riêng → client thực tế nhận 1000/phút, hạn mức vô nghĩa, và thêm pod qua autoscaling làm tình trạng tồi hơn. Triệu chứng: latency tăng, lưu lượng request đến Redis bùng đột ngột. Điều tra: log mỗi pod thấy bucket cục bộ cạn kiệt khác nhau, tổng lượng quét vượt hạn mức phép. Xử lý: chuyển sang Redis Lua script nguyên tử đọc-modify-ghi token trong một lần chạy, key theo consumerId plus endpoint; mỗi pod chỉ giữ cache cục bộ khoảng 10% limit để lọc thô khi bị flood. Trả 429 kèm Retry-After, client retry phải có jitter nếu không toàn bộ quay lại cùng một giây tạo sóng thứ hai. Kết quả: hạn mức chuẩn xác 100/phút bất kể số pod, tải Redis giảm 90%, không còn sóng retry đồng thời.

### Trả lời mẫu khi phỏng vấn

"Tôi sẽ dùng token bucket đếm tập trung trong Redis bằng Lua script nguyên tử. Tại sao Redis: nếu mỗi pod đếm riêng với 10 pod và limit 100/phút, client thực tế nhận 1000/phút, hạn mức mất ý nghĩa và phụ thuộc autoscaling. Lua script đọc-modify-ghi trong một lần chạy, Redis đơn luồng nên không có race; đừng lấy GET rồi SET từ Java vì hai request sẽ cùng thấy còn token và cùng cho qua. Trả 429 kèm Retry-After để client biết chờ bao lâu, plus RateLimit headers, và client retry phải có jitter nếu không toàn bộ quay lại cùng một giây tạo sóng thứ hai. Key theo API key/consumer chứ không chỉ IP, vì NAT và IPv6 làm nhiều người chung IP. Redis chết: fail-open cho API tra cứu, fail-closed cho thanh toán."

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
    // If-Match dùng so sánh STRONG (RFC 9110): ETag yếu W/"7" không bao giờ khớp
    // -> parseEtag trả -1 cho dạng W/, service không khớp version nào -> 412
    long expected = parseEtag(ifMatch);
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
- **Cách B**: trong transaction, load entity, **so {{entity.getVersion()}} với {{expected}} và ném {{OptimisticLockingFailureException}} nếu khác**, rồi set field; {{@Version}} lo nốt race giữa lúc load và lúc flush. Lưu ý: gán {{setVersion(expected)}} lên entity đang managed **không** có tác dụng, Hibernate dùng version nó đã load, nên bắt buộc phải tự so. Exception của @Version chỉ ném ở flush/commit.

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

### Ví dụ đời thực

Hai thiết bị cùng sửa hạn mức người hưởng: A lưu trước 20 triệu, B ghi đè sau 15 triệu, thay đổi của A biến mất. Triệu chứng: khách khiếu niệu hạn mức sai, giao dịch bị chặn do vượt hạn mức thực tế. Điều tra: log thấy hai request cùng đọc version 7, server không kiểm tra If-Match nên "last write wins" âm thầm. Xử lý: thêm cột @Version, trả ETag sau mỗi ghi, endpoint PUT bắt buộc If-Match; nếu không có → 428, nếu version không khớp → 412 kèm ETag hiện tại. Câu UPDATE có điều kiện where id = ? and version = ? atomic trong DB. Kết quả: không còn mất cập nhật, tỉ lệ 412 dưới 1% và được alert để phát hiện UI cache quá lâu.

### Trả lời mẫu khi phỏng vấn

"Tôi sẽ dùng optimistic locking bằng cột @Version và ETag. Mỗi resource có version tăng đơn điệu, trả qua ETag; client gửi If-Match khi PUT/PATCH. Server chỉ ghi nếu version hiện tại khớp, ngược lại trả 412 Precondition Failed. Thiếu If-Match ở endpoint bắt buộc trả 428; xung đột nghiệp vụ như trùng mã trả 409. Quan trọng: check-and-update phải là một câu UPDATE có điều kiện trong DB, không phải đọc version rồi so sánh trong Java, nếu không hai request vẫn chen giữa lúc so và lúc ghi. Khi 412, client GET lại, merge nếu sửa field khác nhau, hoặc hiện diff cho người dùng chọn. Tôi không cho client tự ghi đè khi 412 với dữ liệu tiền, và đo tỉ lệ 412 để phát hiện UI cache quá lâu."

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

### Ví dụ đời thực

Ngân hàng có app mobile, web admin, đối tác và 30 microservice. Ban đầu toàn bộ dùng REST, màn hình lịch sử giao dịch trên mobile phải gọi 8 endpoint liên tiếp, chậm và tiêu nhiều dữ liệu di động. Điều tra: APM thấy 8 round trip cho một màn hình, nhiều field không dùng. Xử lý: GraphQL BFF cho mobile/web (tổng hợp dữ liệu theo màn hình), gRPC giữa các service nội bộ (payload nhỏ, deadline lan truyền qua metadata), REST + OpenAPI cho đối tác (firewall mở 443, SDK mọi ngôn ngữ, curl được). Gateway làm authn và rate limit. Kết quả: mobile giảm từ 8 request xuống 1-2, nội bộ giảm payload 30-60%, đối tác vẫn tích hợp dễ dàng.

### Trả lời mẫu khi phỏng vấn

"Tôi chọn protocol theo biên, không theo sở thích. Đối tác và public dùng REST + JSON + OpenAPI vì firewall mở 443, curl được và SDK mọi ngôn ngữ. Service nội bộ đồng bộ dùng gRPC vì protobuf nhỏ, HTTP/2 multiplex, deadline lan truyền qua metadata. Client đa dạng cần tổng hợp dữ liệu dùng GraphQL ở tầng BFF, giảm over-fetching cho màn hình phức tạp. Cái giá là ba bộ tooling, ba cách version và ba cách quan sát: trace phải chuẩn W3C traceparent, định danh dùng một thư viện chung, test contract riêng cho từng protocol. Tôi không chuyển toàn bộ chỉ vì gRPC nhanh hơn; bắt đầu bằng một protocol mới ở biên có pain rõ ràng, chạy song song rồi cắt dần."

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

### Ví dụ đời thực

Ngân hàng đối tác gửi webhook at-least-once, có thể trùng và sai thứ tự, retry trong 72 giờ. Ban đầu endpoint xử lý đồng bộ 5 giây, đối tác timeout sau 3 giây và retry → hai worker cộng tiền hai lần. Triệu chứng: số dư khách sai, khách khiếu niệu bị cộng trùng. Điều tra: log thấy cùng event_id được xử lý hai lần trong khoảng vài giây. Xử lý: xác thực chữ ký HMAC trên raw body (không parse lại vì thứ tự field thay đổi làm chữ ký sai), ghi event vào bảng inbox có unique (provider, event_id) — DB là trọng tài, trả 200/202 ngay, sau đó worker xử lý idempotent theo event_id; lỗi tạm thời vào DLQ và retry theo lịch của mình, không để đối tác retry 72 giờ gây storm. Không tin thứ tự event; nếu nghi ngờ, gọi API đối tác lấy trạng thái chuẩn. Cuối ngày có job đối soát với sao kê để phát hiện event bị mất hoàn toàn.

### Trả lời mẫu khi phỏng vấn

"Tôi thiết kế endpoint webhook theo nguyên tắc ack nhanh, xử lý sau. Nhận request, xác thực chữ ký HMAC trên raw body, kiểm tra timestamp trong cửa sổ 5 phút để chặn replay. Ghi event vào bảng inbox có unique (provider, event_id) — DB là trọng tài, không dùng exists rồi save vì có race. Trả 200/202 ngay, sau đó worker xử lý idempotent theo event_id; lỗi tạm thời vào DLQ và retry theo lịch của mình, không để đối tác retry 72 giờ gây storm. Không tin thứ tự event; nếu nghi ngờ, gọi API đối tác lấy trạng thái chuẩn. Cuối ngày có job đối soát với sao kê để phát hiện event bị mất hoàn toàn."

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

### Ví dụ đời thực
Hệ thống internet banking của một ngân hàng cho khách tải lên ảnh CCCD và sao kê (tối đa 100 MB/file). Triệu chứng: vào giờ cao điểm (17h–19h), khách khiếu nại upload thất bại sau 60–90 giây, log app hiện {{MaxUploadSizeExceededException}} nhưng file thực tế chỉ 15 MB, đồng thời heap usage tăng vọt từ 2 GB lên 10 GB gây full GC 15 giây. Điều tra: (1) access log nginx cho thấy request lên tới 120 giây mới đến app — vì {{client_max_body_size}} mặc định 1 MB, file 15 MB bị nginx chặn nhưng cấu hình app {{spring.servlet.multipart.max-file-size: 100MB}} nên log app báo sai nguyên nhân; (2) thread dump thấy 40 thread đang ở {{file.getBytes()}} — code cũ đọc toàn bộ file vào RAM trước khi ghi S3, 20 request song song × 15 MB = 300 MB heap, nhưng GC không kịp dọn. Nguyên nhân gốc: thiếu cấu hình nginx, code dùng {{getBytes()}} thay vì stream, và không có presigned URL cho file lớn. Cách xử lý: (1) set {{client_max_body_size 100m}} ở nginx; (2) đổi code sang {{file.getInputStream()}} stream thẳng S3; (3) file > 20 MB chuyển sang presigned PUT (URL hết hạn 5 phút). Kết quả sau 1 tuần: tỷ lệ upload thất bại giảm từ 12% xuống 0,3%, heap ổn định ở 2.5 GB, p99 latency upload 50 MB giảm từ 85 giây xuống 12 giây, không còn full GC khi upload.

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

### Ví dụ đời thực
Hệ thống ngân hàng cung cấp API tải sao kê PDF (30–60 MB) cho 200.000 khách hàng/ngày. Triệu chứng: (1) khách báo tải 90% rồi đứt, tải lại từ đầu mất 10 phút; (2) p99 latency download tăng từ 8 giây lên 45 giây vào cuối tháng; (3) thread pool Tomcat cạn kiệt (200/200), health check lỗi 503. Điều tra: (1) access log nginx ghi {{proxy_read_timeout}} 60s — app stream từ S3 mất 70s byte đầu do cold start, nginx cắt kết nối trả 504; (2) code dùng {{InputStreamResource}} nên Spring không hỗ trợ Range, client không resume được; (3) heap dump thấy 150 thread giữ {{byte[]}} 50 MB do code cũ dùng {{Files.readAllBytes}} cho file nhỏ. Nguyên nhân gốc: thiếu {{Content-Length}} và Range support, proxy timeout quá thấp, code đọc hết file vào RAM. Cách xử lý: (1) đổi sang {{FileSystemResource}} (đĩa tạm) hoặc presigned GET S3 cho file > 20 MB; (2) set {{proxy_read_timeout 300s}} và {{send_timeout 300s}} cho route download; (3) bật {{Content-Length}} từ metadata S3 trước khi stream. Kết quả: p99 latency 30 MB giảm từ 45 giây xuống 9 giây, tỷ lệ resume thành công từ 15% lên 98%, thread Tomcat idle > 70% ngay cả lúc peak, không còn 503 do cạn thread.

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
3. Với {{@PathVariable}}/{{@RequestParam}} trên controller: từ Spring Framework 6.1 (Boot 3.2+) Spring MVC tự validate tham số và ném {{HandlerMethodValidationException}} (thường trả 400), **không cần {{@Validated}}** — lưu ý: đặt {{@Validated}} lên controller class sẽ chuyển sang proxy AOP và_throw {{ConstraintViolationException}} (thường là 500), nên hãy bỏ nó ở controller. Ở tầng **service** thì {{@Validated}} trên class vẫn đúng (proxy method validation, lỗi là {{ConstraintViolationException}}).
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
Lúc validate phải chỉ rõ nhóm: ở controller chỉ cần {{@Valid @RequestBody BeneficiaryReq req}} ({{@Valid}} là nested constraint, không nhận tham số nhóm; đặt {{@Validated}} trên controller class sẽ chuyển sang proxy AOP và throw {{ConstraintViolationException}} → 500, nên controller không cần {{@Validated}}). Nhóm chỉ dùng khi validate tay bằng {{validator.validate(req, Create.class)}}. Nếu gọi validate ở nhóm mặc định (Default) thì các ràng buộc đã gán nhóm **không chạy**; ngược lại khi gọi {{Create.class}}, các ràng buộc **không gán nhóm** (như {{@NotBlank name}} ở trên, thuộc Default) cũng bị bỏ qua. Vì vậy hoặc gán nhóm cho mọi ràng buộc, hoặc truyền cả hai: {{validator.validate(req, Create.class, Default.class)}} — đây là lỗi im lặng hay gặp nhất của groups.

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

### Ví dụ đời thực
Hệ thống mở tài khoản online của một ngân hàng xử lý 5.000 request/ngày. Triệu chứng: (1) log hiện {{ConstraintViolationException}} từ validator custom @ValidVietnamPhone gọi DB kiểm tra "số điện thoại đã đăng ký" — p99 validator tăng từ 5 ms lên 120 ms; (2) một ca race condition: hai request cùng số điện thoại mới, validator SELECT thấy "chưa có", cả hai INSERT, unique constraint chặn cái sau nhưng cái trước đã commit — khách khiếu nại số điện thoại trùng; (3) DTO BeneficiaryReq dùng chung cho Create/Update nhưng quên gán {{groups}} cho {{@NotBlank name}} → bản Update gửi thiếu name vẫn pass validator. Điều tra: (1) thread dump thấy validator block ở {{jdbcTemplate.query}}; (2) slow query log xác nhận SELECT phone chạy 80 ms do thiếu index; (3) test integration xác định lỗi groups. Nguyên nhân gốc: validator làm việc DB, thiếu unique constraint là hàng rào cuối, groups config không đầy đủ. Cách xử lý: (1) xóa DB call khỏi validator, chỉ check format regex; (2) thêm unique index {{phone}} ở DB, service bắt {{DataIntegrityViolationException}} trả 409; (3) gán groups cho mọi constraint, validate tay bằng {{validator.validate(req, Create.class, Default.class)}}. Kết quả: validator p99 từ 120 ms xuống 3 ms, 0 ca trùng số điện thoại sau deploy, 0 lỗi validation im lặng.

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

### Ví dụ đời thực
Hệ thống ngân hàng mobile 1,2 triệu user gọi GET /api/accounts/{id}/balance mỗi 30 giây. Triệu chứng: (1) khách khiếu nại thấy số dư cũ 2–3 phút sau khi chuyển tiền thành công; (2) CDN metrics hit ratio 95% nhưng log ứng dụng thấy số dư trả về không khớp DB; (3) security audit phát hiện response có {{Cache-Control: public, max-age=60}} cho endpoint cần Bearer token. Điều tra: (1) code dùng {{CacheControl.maxAge(60)}} thay vì {{noCache()}} cho endpoint balance; (2) CDN cache theo URL, bỏ qua Authorization header nên cache key trùng giữa user A và B; (3) ETag sinh từ {{System.currentTimeMillis()}} thay vì {{account.version}} → mỗi request ETag khác, 304 không bao giờ xảy ra. Nguyên nhân gốc: nhầm {{public}} cho {{private}}, ETag sai ngữ nghĩa, thiếu {{Vary: Authorization}}. Cách xử lý: (1) đổi sang {{CacheControl.noCache().cachePrivate()}} + ETag từ {{@Version}}; (2) thêm {{Vary: Authorization, Cookie}}; (3) test bằng {{curl -H "Authorization: Bearer ..." -I}} kiểm tra header. Kết quả: 0 khiếu nại số dư sai, hit ratio CDN giảm về 12% (mong đợi cho private data), p99 latency balance 45 ms (304 cache hit), audit security pass.

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

### Ví dụ đời thực
Hệ thống API ngân hàng cung cấp endpoint báo cáo cho đối tác fintech. Triệu chứng: (1) đối tác báo lỗi 406 khi gọi GET /api/reports/123 với {{Accept: application/xml}} — trước đây chạy bình thường; (2) log nginx thấy 200 OK nhưng body là gzip, client không nén được báo "corrupted"; (3) khách hàng Việt Nam thấy thông báo lỗi tiếng Anh thay vì tiếng Việt. Điều tra: (1) deploy mới thêm Jackson XML converter nhưng không đăng ký {{MediaType.APPLICATION_XML}} trong {{produces}} → Spring match */* trước, chọn JSON converter, client nhận JSON mà parser XML fail; (2) nginx bật {{gzip on}} và Spring Boot bật {{server.compression.enabled=true}} — double compression, client nhận body gzip của gzip; (3) {{Accept-Language: vi-VN}} nhưng {{messages_vi.properties}} thiếu key {{error.insufficient-funds}} → fallback default locale en. Nguyên nhân gốc: content negotiation config không nhất quán, double compression, i18n resource thiếu. Cách xử lý: (1) khai báo {{produces = "application/json"}} tường minh cho mọi endpoint, không phụ thuộc Accept; (2) tắt nén ở Spring ({{server.compression.enabled=false}}), chỉ bật ở nginx; (3) audit i18n key, thêm {{messages_vi.properties}} đầy đủ, set {{LocaleContextHolder.setLocale()}} từ {{Accept-Language}} header. Kết quả: 0 lỗi 406, 0 double compression, 100% thông báo lỗi đúng ngôn ngữ, partner onboarding từ 2 tuần xuống 3 ngày.

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
Với JSON Patch, Jackson trong jackson-databind chỉ có {{JsonPointer}} và {{JsonNode.at(...)}} để trỏ đường dẫn, **không** có sẵn class áp patch. Muốn nhận {{application/json-patch+json}} phải thêm thư viện như {{com.github.java-json-tools:json-patch}} (API {{JsonPatch.fromJson(node).apply(target)}}) hoặc {{com.flipkart.zjsonpatch:zjsonpatch}}; trỏ sai đường dẫn hay {{test}} không khớp sẽ ném {{JsonPatchException}} → trả 400 (patch sai cú pháp), 422 (patch không áp được lên tài liệu) hoặc 409 (test/trạng thái xung đột) kèm chi tiết.

### Lỗi hay gặp
- **Gửi sai Content-Type** ({{application/json}} thay vì {{application/merge-patch+json}}) → 415. Đây là lỗi phía client, nhưng phải ghi rõ trong tài liệu và trả ProblemDetail dễ hiểu.
- **PATCH dựa trên trạng thái client đang giữ**: client soạn patch sau khi mở form 5 phút, giữa chừng có người khác sửa → ghi đè mất thay đổi. Cách tránh: kèm {{If-Match}} với ETag; 412 báo client đọc lại.
- **Dùng PUT với body thiếu field**: PUT nghĩa là "thay thế toàn bộ", field không gửi sẽ bị mất. Đây là lý do form sửa một phần nên chọn PATCH.
- **JSON Patch {{test}} fail**: trả **409 Conflict** (RFC 5789), không phải 400 — vì cú pháp đúng, chỉ trạng thái hiện tại không khớp. Dành **412** cho header điều kiện {{If-Match}}.
- **Mạng/WAF chặn PATCH**: một số proxy, WAF hoặc gateway mặc định không cho {{PATCH}} qua (405). Kiểm tra tầng ngoài trước khi đổ lỗi cho code.

### Ví dụ đời thực
Hệ thống cập nhật hồ sơ khách hàng ngân hàng cho phép sửa một phần thông tin (điện thoại, email, địa chỉ). Triệu chứng: (1) khách khiếu nại "địa chỉ bị reset về cũ" sau khi cùng lúc cập nhật với nhân viên CSKH; (2) log thấy 415 Unsupported Media Type cho request PATCH từ app mobile v2.1; (3) WAF trả 405 Method Not Allowed cho PATCH /api/profiles. Điều tra: (1) form sửa dùng Merge Patch nhưng không kèm {{If-Match}} — client A và B cùng đọc version 5, A sửa phone, B sửa email, B ghi sau ghi đè mất phone của A; (2) app v2.1 gửi {{Content-Type: application/json}} thay vì {{application/merge-patch+json}} → Spring trả 415; (3) API Gateway rule chặn PATCH method, chỉ cho GET/POST/PUT. Nguyên nhân gốc: thiếu optimistic locking (If-Match), client dùng sai media type, infra chặn PATCH. Cách xử lý: (1) bắt buộc {{If-Match}} cho PATCH, trả 412 kèm ETag hiện tại; (2) cập nhật app mobile gửi đúng {{application/merge-patch+json}}, version cũ fallback sang PUT full body; (3) cấu hình API Gateway cho phép PATCH. Kết quả: 0 ca lost update, 415 giảm từ 200/ngày xuống 0, WAF pass rate 100%, p99 PATCH latency 35 ms.

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
"Tôi chọn theo yêu cầu độ trễ và trạng thái phía server. Polling kèm ETag là nền: mỗi lượt chỉ tốn một request 304, độ trễ bằng chu kỳ hỏi, không cần giữ trạng thái nên chạy sau bao nhiêu instance cũng được. Khi nghiệp vụ yêu cầu dưới một giây thì tôi thêm SSE: client mở một request, server giữ kết nối và đẩy {{text/event-stream}}, {{EventSource}} tự nối lại và gửi {{Last-Event-ID}} để lấy phần bị đứt — điều kiện là proxy phải tắt buffering, có heartbeat, và đa instance phải có pub-sub để event sinh bên này tới được client đang nối bên kia. WebSocket tôi chỉ dùng khi client thật sự phải gửi dữ liệu real-time cùng lúc, vì giá của nó là trạng thái kết nối, sticky session và rất nhiều ca lỗi chỉ xuất hiện khi có hàng nghìn kết nối."

### Ví dụ đời thực
App internet banking của một ngân hàng thương mại: màn hình "Giao dịch mới nhất" trên mobile phải hiện ngay sau khi khách chuyển tiền xong, nhưng team đầu tiên dùng **polling mỗi 30 giây**. Triệu chứng: khách chuyển tiền xong rồi quay lại màn hình, phải chờ 25–30 giây mới thấy giao dịch — tỉ lệ gọi support "Tại sao giao dịch chưa hiện?" là 1.200 ticket/ngày, và vào giờ cao điểm (12h–13h) độ trễ thực tế lên đến 45 giây do server quá tải. Điều tra bằng metric: rate request polling tăng từ 200 req/s lên 2.500 req/s (12 client × chu kỳ 30s × 7.000 client đang online), CPU instance đạt 85%, và log server cho thấy 94% request polling trả về 304 (không có data mới) — tức là 94% công suất đi vào không có giá trị.

Cách xử lý: (1) Thay polling 30s bằng **SSE** trên endpoint /api/accounts/{id}/events với {{SseEmitter}} timeout 30 phút, heartbeat ping mỗi 20 giây, và {{proxy_buffering off}} ở nginx ingress. (2) Khi chuyển tiền thành công, service phát event lên **Redis Pub/Sub** kênh transfer.done.{accountId}; instance nào giữ kết nối của client nhận được rồi push xuống. (3) Client dùng {{EventSource}} với {{withCredentials: true}}, gửi {{Last-Event-ID}} khi reconnect để lấy event bị miss. (4) Giữ polling mỗi 5 phút làm lưới an toàn khi SSE mất kết nối (app vào nền, mạng di động chuyển 4G↔WiFi).

Kết quả sau 4 tuần: độ trễ từ lúc khách chuyển tiền tới lúc màn hình cập nhật giảm từ 25–45 giây xuống **trung bình 800ms (p99 1,2s)**; ticket support giảm 91%; CPU instance giảm từ 85% xuống 42% vì polling request giảm 98%; và khi có 2 instance, pub-sub đảm bảo event sinh ở instance nào cũng tới được client đang nối ở instance kia — không còn hiện tượng "một nửa client thấy, một nửa không".

### Trả lời mẫu khi phỏng vấn
"Về bản chất, tôi chọn công nghệ dựa trên hai câu hỏi: client có cần **nhận** dữ liệu tức thì không, và client có cần **gửi** dữ liệu real-time không. Nếu chỉ cần nhận, đầu tiên là polling kèm ETag: đơn giản, không cần giữ trạng thái, chạy được sau bao nhiêu instance, và mỗi lượt chỉ tốn một request 304 khi không có data mới. Khi nghiệp vụ yêu cầu độ trễ dưới một giây, tôi nâng lên SSE: client mở một HTTP request, server giữ kết nối và đẩy event dạng {{text/event-stream}}; trình duyệt tự nối lại và gửi {{Last-Event-ID}} để lấy phần bị miss. Điều kiện bắt buộc là proxy phải tắt buffering, có heartbeat định kỳ, và đa instance phải dùng Redis Pub/Sub để event sinh ở instance nào tới được client đang nối ở instance kia. Cuối cùng, WebSocket tôi chỉ chọn khi client thật sự phải gửi dữ liệu real-time cùng lúc — ví dụ chat hoặc multiplayer game — vì giá của nó là trạng thái kết nối, sticky session, và rất nhiều ca lỗi chỉ lộ ra khi có hàng nghìn kết nối. Trên mobile, ngoài SSE tôi vẫn giữ polling làm lưới an toàn khi app vào nền hoặc mất mạng, vì hệ điều hành sẽ cắt kết nối TCP và không có gì thay thế push notification."

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

### Ví dụ đời thực
App mobile v2.3 của một ví điện tử đã có 3 triệu người dùng hoạt động, và team backend muốn đổi response: thêm field {{balanceVnd}} (số dư bằng VND), đổi tên field {{amount}} thành {{amountMinor}} (đổi sang đơn vị cent/minor để chuẩn hóa), và thêm giá trị enum {{SETTLED}} vào {{TxStatus}} (hiện tại chỉ có PENDING, SUCCESS, FAILED). App v2.3 không thể ép nâng cấp vì store đã duyệt và người dùng không thể chờ. Triệu chứng đầu tiên nếu deploy thô: app cũ parse {{amount}} thành null → màn hình lịch sử hiện trống, và switch trên enum thiếu {{SETTLED}} → crash ngay khi có giao dịch mới.

Cách xử lý: (1) Giữ field {{amount}} trả về thêm 3 tháng, đồng thời thêm {{amountMinor}} — cả hai cùng có giá trị. (2) Log metric theo {{X-Client-Version}}: sau 1 tuần, {{amount}} vẫn được 94% client đọc, {{amountMinor}} chỉ 6% — chưa thể bỏ. (3) Enum: thêm {{SETTLED}} và đánh dấu {{@JsonEnumDefaultValue UNKNOWN}} trên enum; client phải có nhánh default. (4) Contract test: lưu JSON response mẫu của app v2.3 làm golden file, CI deserialize bằng parser của app v2.3 — test đỏ ngay khi server đổi field. (5) Staging chạy APK v2.3 trên emulator trước khi deploy.

Kết quả: deploy không làm crash một app nào; sau 3 tháng {{amount}} còn 0,8% lượt đọc → đưa vào danh sách bỏ; và telemetry theo {{X-Client-Version}} giúp team biết chính xác field nào sắp hết người dùng trước khi xoá.

### Trả lời mẫu khi phỏng vấn
"Khi app đã phát hành và không thể ép người dùng nâng cấp, nguyên tắc của tôi là trong cùng major version chỉ cộng thêm, không sửa xoá: thêm field optional thì an toàn, còn đổi tên hay bỏ field thì phải thêm field mới và giữ field cũ đọc được thêm vài tháng, sau đó đo xem còn ai dùng mới bỏ ở lần nâng cấp version. Ở phía đọc, client luôn là tolerant reader: bỏ qua field lạ, có nhánh mặc định cho enum lạ bằng JsonEnumDefaultValue, và không giả định mọi field đều có mặt — vì app đã lên store thì không sửa được. Để chắc chắn, tôi dựng contract test: JSON mẫu của app cũ phải parse được bằng đúng parser của app cũ ngay trong CI, rồi chạy staging với APK cũ trước khi lên production. Thay đổi format ngày giờ hay default cũng coi là breaking, vì nó làm hiển thị sai thay vì crash nên càng khó phát hiện."

  > Senior tip: hãy xem **"broke được bao nhiêu version client"** là chỉ số của mỗi lần deploy API, ngang bằng với tỉ lệ lỗi 5xx. Công cụ rẻ nhất là contract test với JSON golden file của N-2 phiên bản; thứ hai là telemetry theo {{X-Client-Version}} để biết field nào sắp hết người dùng trước khi xoá. Và khi buộc phải breaking thì nâng major version đúng nghĩa (giữ song song, có {{Sunset}}), đừng "nói nội bộ thôi rồi đổi luôn" — mọi tích hợp bên thứ ba đều coi đó là sự cố.`,
    follow: [
      'Nếu cả hai version cũ và mới phải chạy song song một thời gian thì code và database sắp xếp thế nào?',
      'Làm sao đo được "còn bao nhiêu client đọc field này" nếu client không gửi phiên bản app?',
      'Khi nào thì nên tạo major version mới thay vì vẫn cố cộng thêm?'
    ],
    tags: ['Backward Compatibility', 'Tolerant Reader', 'API Evolution', 'Jackson', 'Contract Test']
    },
  {
    id: 'api-031',
    topic: 'api',
    level: 'senior',
    q: 'HTTP/1.1, HTTP/2, HTTP/3 khác nhau ở multiplexing, head-of-line blocking và HPACK thế nào? Ảnh hưởng tới connection pool của client Java (HttpClient, RestClient) ra sao?',
    a: `**Tóm tắt:** HTTP/1.1 xử lý tuần tự trên mỗi kết nối TCP nên buộc client mở nhiều connection song song; HTTP/2 ghép nhiều luồng (multiplexing — gửi xen kẽ nhiều request/response trên cùng một kết nối) bằng framing nhị phân và nén header bằng HPACK, nhưng vẫn bị head-of-line blocking (HOL blocking — một gói tin mất làm tắc toàn bộ các luồng phía sau) ở tầng TCP; HTTP/3 chuyển xuống QUIC (giao thức trên UDP, tích hợp TLS 1.3) để mỗi luồng độc lập, tránh HOL blocking ở tầng vận chuyển. Với Java {{HttpClient}} (Java 11+), khi server hỗ trợ HTTP/2 qua ALPN, client tự động gộp về gần như 1 connection/host, nên việc "tăng connection pool" theo kiểu HTTP/1.1 không còn ý nghĩa như trước.

### Bối cảnh: vì sao HTTP phải tiến hóa
Hãy tưởng tượng bạn gọi điện thoại đặt nhiều món ăn, nhưng mỗi cuộc gọi chỉ đặt được 1 món và phải đợi món đó xác nhận xong mới gọi món tiếp. Đó là HTTP/1.1 trên một kết nối. Để nhanh hơn, người ta mở nhiều cuộc gọi song song (nhiều TCP connection) — tốn tài nguyên cả hai phía. HTTP/2 ra đời để đặt nhiều món trên **cùng một cuộc gọi** (multiplexing). HTTP/3 đi xa hơn: nếu một gói tin bị mất, các món khác vẫn tiếp tục, không phải chờ gói đó gửi lại.

### So sánh cơ chế từng bước
| Tiêu chí | HTTP/1.1 | HTTP/2 | HTTP/3 |
|---|---|---|---|
| Tầng vận chuyển | TCP | TCP + TLS (thường) | QUIC trên UDP + TLS 1.3 tích hợp |
| Multiplexing | Không (1 request/response tại 1 thời điểm/connection) | Có: nhiều stream đánh số, chia thành frame xen kẽ trên 1 TCP connection | Có: mỗi QUIC stream độc lập |
| Head-of-line blocking | Có ở cả HTTP và TCP | Không ở HTTP, **vẫn có ở TCP** (1 packet mất → tất cả stream chờ retransmit) | Không ở tầng vận chuyển (packet mất chỉ ảnh hưởng stream đó) |
| Nén header | Không (gửi lặp {{Cookie}}, {{User-Agent}} mỗi request) | HPACK: bảng tĩnh + bảng động, mã hóa Huffman | QPACK (biến thể HPACK phù hợp QUIC, tránh HOL do tham chiếu bảng) |
| Số connection/host điển hình | 6 (trình duyệt) hoặc pool N (Java client) | Thường 1 | Thường 1 |
| Thiết lập kết nối | TCP handshake + TLS handshake | Như HTTP/1.1 + ALPN negotiate h2 | 1-RTT hoặc 0-RTT (nhanh hơn, hỗ trợ di chuyển mạng) |

### HPACK hoạt động thế nào (HTTP/2)
Header HTTP thường lặp lại ({{:method}}, {{:path}}, {{cookie}}, {{authorization}}). HPACK nén bằng hai bảng:
1. **Bảng tĩnh**: 61 header phổ biến có sẵn ở cả client và server (ví dụ {{:method GET}} là index 2).
2. **Bảng động**: header mới gặp được thêm vào bảng dùng chung cho connection đó; lần sau chỉ gửi index.
3. Giá trị chuỗi có thể mã hóa Huffman để giảm thêm kích thước.
Ví dụ: 10 request liên tiếp với cùng {{Authorization}} dài 500 byte — HTTP/1.1 gửi 5.000 byte header; HTTP/2 sau request đầu chỉ gửi vài byte index.

### Ảnh hưởng tới connection pool của Java client
- **{{java.net.http.HttpClient}} (Java 11+)**: mặc định cố negotiate HTTP/2 qua ALPN (Application-Layer Protocol Negotiation — bước trong TLS handshake để hai bên chọn giao thức). Khi server hỗ trợ {{h2}}, HttpClient dùng **một connection** cho nhiều request đồng thời tới cùng host. Vì vậy tăng "pool size" kiểu HTTP/1.1 (mở nhiều connection) không giúp; thay vào đó, giới hạn số stream đồng thời và timeout.
- **{{RestClient}} / {{WebClient}} (Spring, dùng Reactor Netty)**: cũng hỗ trợ HTTP/2; pool {{ConnectionProvider}} quản lý connection, nhưng khi HTTP/2 bật thì 1 connection chịu nhiều stream.
- **Fallback**: nếu server/proxy không hỗ trợ h2, HttpClient tự rơi về HTTP/1.1 (pool connection như cũ). Cần kiểm tra ALPN thực tế, không giả định.
- **Lưu ý HTTP/3**: Java HttpClient (đến Java 21) chưa hỗ trợ HTTP/3 chính thức; cần thư viện bên ngoài (Jetty, Netty incubator) nếu muốn dùng QUIC.

~~~seq
title: Multiplexing HTTP/2 trên một TCP connection
actors: Java Client | TCP Conn | API Server
Java Client -> TCP Conn: Stream 1: GET /orders/1
Java Client -> TCP Conn: Stream 3: GET /orders/2
Java Client -> TCP Conn: Stream 5: POST /payments
TCP Conn -> API Server: Frame xen kẽ (S1, S3, S5)
API Server --> TCP Conn: Frame phản hồi S3 (nhanh xong trước)
TCP Conn --> Java Client: Response Stream 3
API Server --> TCP Conn: Frame phản hồi S1, S5
TCP Conn --> Java Client: Response Stream 1, Stream 5
~~~

### Ví dụ đời thực
Giả định một service Java (Spring Boot 3, Java 21) gọi downstream {{catalog-service}}: 1.500 QPS, mỗi request trả ~2KB JSON, p99 latency mục tiêu 80ms. Ban đầu dùng HTTP/1.1 với {{HttpClient}} mặc định; dưới tải, client mở ~120 TCP connection đồng thời tới cùng host, p99 tăng lên 220ms do HOL blocking và chi phí tạo connection/TLS handshake. CPU ở phía downstream tăng vì xử lý nhiều connection.

Cách xử lý: (1) Bật HTTP/2 ở reverse proxy (Nginx/Envoy) và đảm bảo ALPN {{h2}} trong TLS terminator. (2) Nâng {{HttpClient}} dùng mặc định (tự negotiate h2). (3) Giảm cấu hình pool kiểu cũ (không cần 120 connection), đặt timeout per-request hợp lý. (4) Đo bằng metrics: số connection thực tế/host, tỉ lệ h2 vs h1.

Kết quả: connection tới catalog giảm từ ~120 xuống ~6 (mỗi instance client giữ 1 connection h2/host, 6 instance), p99 giảm còn 65ms, memory phía client giảm ~40MB do ít socket buffer, CPU downstream giảm 12%. Khi mạng có packet loss 0,5%, p99 vẫn nhỉnh hơn kỳ vọng vì HOL ở TCP (HTTP/2) — nếu bài toán nhạy latency hơn, cân nhắc HTTP/3 ở edge.

### Lỗi hay gặp trên production
- **Tăng connection pool khi đã dùng HTTP/2**: không cải thiện throughput, chỉ tốn resource; hãy kiểm tra ALPN negotiation bằng log hoặc {{HttpClient.newBuilder().version(...)}} và metric connection count.
- **Load balancer/proxy "nói" HTTP/1.1 về backend**: client thấy h2 tới LB nhưng LB nối h1 tới app → không tận dụng multiplexing end-to-end. Kiểm tra từng chặng.
- **Timeout nhầm tầng**: HTTP/2 có connection timeout và stream timeout; đặt chỉ connection timeout có thể khiến một stream chậm treo lâu mà không cắt.
- **HPACK dynamic table và bảo mật**: tấn công CRIME/BREACH biến thể (HPACK bomb) có thể xảy ra nếu server không giới hạn kích thước bảng; dùng cấu hình mặc định an toàn của server/proxy uy tín.

### Trả lời mẫu khi phỏng vấn
"Em nhìn sự khác nhau theo ba trục: multiplexing, head-of-line blocking và nén header. HTTP/1.1 xử lý tuần tự trên mỗi kết nối, nên client phải mở nhiều TCP connection song song — tốn tài nguyên và vẫn bị HOL blocking. HTTP/2 cho phép multiplex: nhiều request/response chia thành frame và xen kẽ trên cùng một kết nối TCP, đồng thời dùng HPACK nén header bằng bảng tĩnh và bảng động nên giảm đáng kể overhead khi header lặp lại. Tuy nhiên HTTP/2 vẫn chạy trên TCP, nên nếu một packet mất thì toàn bộ stream trên connection đó phải chờ retransmit — đó là HOL blocking ở tầng vận chuyển. HTTP/3 giải quyết bằng QUIC trên UDP: mỗi stream độc lập, mất packet chỉ ảnh hưởng stream liên quan, và tích hợp TLS 1.3 nên thiết lập kết nối nhanh hơn. Với Java, {{HttpClient}} từ Java 11 tự negotiate HTTP/2 qua ALPN; khi thành công, nó dùng gần như một connection cho nhiều request đồng thời tới cùng host, nên tư duy 'tăng connection pool' kiểu HTTP/1.1 không còn phù hợp. Em sẽ đo số connection thực tế và p99 trước/sau, đồng thời kiểm tra ALPN end-to-end vì đôi khi proxy giữa chặng vẫn hạ về HTTP/1.1."

> Senior tip: Trước khi "tune pool", hãy xác minh protocol thực tế bằng metric (connection count/host, tỉ lệ h2). Bật HTTP/2 end-to-end (hoặc ít nhất tới hop quan trọng) thường cho lợi ích lớn hơn mọi chỉnh pool; với môi trường packet loss cao (mobile, cross-region), cân nhắc HTTP/3 ở edge để cắt HOL blocking tận gốc.`,
    follow: [
      'ALPN negotiation diễn ra như thế nào và khi nào HttpClient fallback về HTTP/1.1?',
      'HPACK dynamic table có thể bị poisoning không và mitigation là gì?',
      'Khi nào nên tắt HTTP/2 (load balancer không hỗ trợ, packet loss lớn)?'
    ],
    tags: ['HTTP/2', 'HTTP/3', 'QUIC', 'HPACK', 'HttpClient', 'Connection Pool']
  },
  {
    id: 'api-032',
    topic: 'api',
    level: 'senior',
    q: 'gRPC bên trong: stream HTTP/2, protobuf encoding (varint, field number), deadline propagation. Khi nào không nên dùng gRPC?',
    a: `**Tóm tắt:** gRPC là RPC trên HTTP/2: mỗi call là một stream, message serialize bằng Protocol Buffers (binary, field number + varint). Deadline lan truyền từ client xuống server và downstream. Không dùng khi client là browser trực tiếp, payload rất lớn/media, hoặc cần debug dễ bằng curl.

### Hiểu nhanh
gRPC như gọi hàm từ xa qua mạng: định nghĩa hàm trong proto, sinh code, gọi như method local. Protobuf đóng hàng vào thùng nhỏ có nhãn số → nhỏ và nhanh. Deadline như hẹn giờ: quá giờ tự hủy toàn bộ chuỗi gọi.

### Protobuf encoding
- Message = sequence các field, mỗi field = (field_number << 3) | wire_type.
- Varint: số nguyên mã hóa base-128, byte cao nhất bit continuation → số nhỏ tốn 1 byte.
- Field number là danh tính field; thêm field mới không phá client cũ.
- So với JSON: nhỏ hơn 3–10 lần, parse nhanh hơn, nhưng không đọc được bằng mắt.

### Stream HTTP/2
- Unary, server streaming, client streaming, bidirectional.
- Metadata qua header; trailer mang status code + message.

### Deadline propagation
- Client đặt deadline (Context.withDeadlineAfter).
- Server nhận qua header grpc-timeout; khi gọi downstream phải propagate deadline còn lại.
- Downstream hết thời gian → CANCELLED, tránh work vô ích.
- Cần propagate cả cancellation.

### Khi không nên dùng gRPC
- Browser trực tiếp (cần gRPC-Web + proxy).
- Payload rất lớn / media streaming.
- Team cần debug bằng curl/Postman dễ dàng.
- Public API cho third-party.
- Load balancer/proxy không hỗ trợ HTTP/2 hoặc trailer.

### Trên production
- Triệu chứng: deadline exceeded cascade → kiểm tra propagation và timeout từng hop.
- Đo: latency per hop, cancellation rate, message size.
- Tuning: deadline hợp lý, keepalive, max message size, retry chỉ idempotent.

### Trả lời miệng 1 phút
"gRPC là RPC trên HTTP/2 với protobuf binary: field number + varint; mỗi call là stream HTTP/2; deadline lan truyền. Tôi không dùng khi client là browser trực tiếp, payload lớn/media, hoặc cần debug dễ và public API."

### Bên trong: một message protobuf trên dây
Với message {{Payment}} gồm {{int64 amount = 1}} và {{string currency = 2}}, giá trị amount = 150, currency = "VND": mỗi trường ghi **tag** = (số thứ tự trường × 8 + wire type) rồi giá trị. {{amount}}: tag {{08}} (trường 1, varint), giá trị 150 dạng varint 2 byte {{96 01}}; {{currency}}: tag {{12}} (trường 2, length-delimited), độ dài {{03}}, rồi 3 byte "VND". Tổng **9 byte**, trong khi JSON tương ứng khoảng 33 byte. Tên trường **không** nằm trên dây — vì vậy đổi tên trường an toàn, nhưng **đổi số thứ tự hoặc kiểu** của trường đã dùng là phá vỡ tương thích; trường bỏ đi phải {{reserved}} số của nó.

### Ví dụ đời thực
Hai service nội bộ (tính giá ↔ đặt hàng) gọi nhau 12.000 lần/giây bằng REST JSON, CPU serialize chiếm 25%. Chuyển sang gRPC: payload nhỏ hơn khoảng 70%, p99 giảm từ 35ms còn 11ms. Nhưng sự cố đầu tiên: một dev đổi số thứ tự trường {{discount}} từ 5 sang 6 khi "sắp xếp lại file proto" → service cũ đọc giá trị sai kiểu, áp sai giảm giá cho 40 phút. Sau đó thêm **buf breaking** vào CI để chặn thay đổi phá tương thích. Deadline: service đặt hàng đặt deadline 300ms; gRPC truyền deadline còn lại qua header {{grpc-timeout}} sang service tiếp theo, nên service tính giá tự huỷ khi client đã bỏ đi thay vì làm việc vô ích.

> Senior tip: deadline propagation là lợi thế lớn nhất — đặt deadline ở edge và propagate xuống; đừng set timeout từng service độc lập vì tổng vượt deadline edge.`,
    follow: [
      'gRPC load balancing hoạt động thế nào khi client giữ một connection dài?',
      'Proto field evolution: reserved field number và reserved name dùng để làm gì?',
      'So sánh gRPC với REST cho internal microservice: latency, throughput, debugging.'
    ],
    tags: ['gRPC', 'Protobuf', 'HTTP/2', 'Deadline', 'RPC']
  },
  {
    id: 'api-033',
    topic: 'api',
    level: 'lead',
    q: 'Idempotency key phía server: lưu ở đâu, race khi 2 request cùng key đến song song, trả lại response cũ thế nào?',
    a: `**Tóm tắt:** Idempotency key phía server là cơ chế để một thao tác (thường là POST) chỉ có hiệu lực **một lần** dù client gửi lại nhiều lần. Client gửi header {{Idempotency-Key}} (thường là UUID). Server lưu key cùng hash của request và response vào một kho bền vững (DB có unique constraint hoặc Redis với SETNX) kèm TTL; request trùng key trả lại response cũ nguyên vẹn. Khi hai request cùng key đến song song, server dùng thao tác chèn nguyên tử (atomic insert) để chỉ một request được xử lý, request còn lại chờ hoặc nhận trạng thái "đang xử lý"; nếu cùng key nhưng body khác thì trả 422.

### Bối cảnh: vì sao server phải tự bảo vệ
Idempotency key (khóa lũy đẳng — một mã định danh để đánh dấu "đây là cùng một thao tác") sinh ra vì mạng không tin cậy: client gửi POST tạo đơn hàng, server xử lý xong nhưng response mất, client timeout và retry. Nếu server xử lý lại từ đầu, đơn hàng bị tạo hai lần. Client có thể hứa "tôi sẽ không gửi trùng", nhưng server không được tin lời hứa đó — server phải tự kiểm chứng.

### Thiết kế lưu trữ — lưu ở đâu, lưu gì
- **Lưu gì**: một bản ghi gồm {{key}}, {{scope}} (ví dụ user_id + endpoint), {{request_hash}} (SHA-256 của body để phát hiện client dùng lại key cho body khác), {{status}} (processing/completed/failed), {{response_status}}, {{response_body}}, {{created_at}}, {{expires_at}}.
- **Lưu ở đâu**:
  - **DB quan hệ (PostgreSQL/MySQL)**: bền vững, có unique constraint trên {{(scope, key)}} để chèn nguyên tử. Phù hợp giao dịch tài chính vì cần nguồn sự thật durable.
  - **Redis**: nhanh, dùng {{SETNX}} (set-if-not-exists) với TTL. Phù hợp throughput cao, nhưng cần cân nhắc persistence (RDB/AOF) và rủi ro mất dữ liệu khi crash — không nên là nguồn sự thật duy nhất cho tiền.
  - **Thực tế hay dùng**: DB là nguồn sự thật, Redis là lớp chặn nhanh (cache/check) nếu cần tối ưu latency.
- **TTL**: thường 24 giờ; đủ dài để client retry trong cửa sổ hợp lý, đủ ngắn để không phình kho.

### Race khi 2 request cùng key đến song song — xử lý từng bước
Giả sử do retry song song hoặc bug client, hai request R1 và R2 cùng {{Idempotency-Key: k1}} đến gần như cùng lúc:

~~~seq
title: Race hai request cùng Idempotency-Key
actors: Client R1 | Client R2 | API | DB
Client R1 -> API: POST /orders (key k1)
Client R2 -> API: POST /orders (key k1)
API -> DB: INSERT key k1, status=processing (atomic)
DB --> API: R1 OK (inserted)
API -> DB: INSERT key k1 (atomic)
DB --> API: R2 FAIL (unique conflict)
API -> DB: R1 xử lý business, lưu response
DB --> API: R1 completed
API --> Client R1: 201 + response
API -> DB: R2 đọc lại key k1
DB --> API: status=completed + response cũ
API --> Client R2: 201 + response cũ (giống R1)
~~~

Các trường hợp cần xử lý:
1. **Key chưa tồn tại**: thực hiện atomic insert với {{status=processing}}. Chỉ bên insert thành công mới được chạy business logic.
2. **Insert thất bại (đụng unique constraint)**: đọc bản ghi hiện có. Nếu {{request_hash}} khác → trả **422 Unprocessable Entity** (client dùng sai key cho body khác). Nếu {{status=processing}} → trả **409 Conflict** kèm {{Retry-After}} hoặc chờ ngắn (poll) tùy thiết kế. Nếu {{completed}} → trả lại **response cũ nguyên vẹn** (cùng status code, cùng body) để client thấy như request đầu thành công.
3. **Chỉ áp dụng cho method ghi**: POST/PATCH; GET không cần.

### Ví dụ đời thực
Giả định hệ thống đặt vé: 800 QPS giờ mở bán, p99 latency 150ms, tỉ lệ timeout client 0,4%. Không có idempotency key, mỗi đợt mở bán ghi nhận ~1.200 đơn trùng/ngày (user bấm lại khi spinner quay lâu), trung bình xử lý hoàn tiền/tháo chỗ mất 6 phút/đơn cho CS.

Triển khai: (1) App client sinh UUID per lần bấm "Đặt vé", giữ nguyên khi retry. (2) Bảng {{idempotency_records}} (PostgreSQL) với unique index {{(user_id, endpoint, idem_key)}}, TTL 24h dọn bằng job. (3) Transaction: {{INSERT ... ON CONFLICT DO NOTHING RETURNING}}; nếu không insert được thì {{SELECT}} bản ghi. (4) Trả response cũ với header {{Idempotent-Replayed: true}} để dễ debug.

Kết quả sau 1 tháng: đơn trùng giảm về < 5/ngày (chỉ còn trường hợp client sinh key mới mỗi lần — được fix ở app), p99 tăng ~4ms, tải CS liên quan đơn trùng giảm ~90%.

### Lỗi hay gặp trên production
- **Không hash body**: client vô tình tái dùng key cho request khác nội dung → server trả response cũ sai ngữ cảnh. Luôn lưu và so sánh {{request_hash}}.
- **Lưu response ở Redis không durable cho giao dịch tiền**: Redis restart mất bản ghi → retry sau restart tạo duplicate. Giao dịch tài chính phải dùng DB durable làm nguồn sự thật.
- **Trả response khác với lần đầu**: client dựa vào response (ví dụ {{order_id}}) để hiển thị; nếu lần replay trả body khác, client rối. Phải trả **nguyên vẹn** response đã lưu.
- **Scope key sai**: key global cho mọi user có thể bị va chạm; key quá hẹp (per attempt) làm mất tác dụng chống trùng. Dùng scope {{(user_id, endpoint, key)}}.

### Trả lời mẫu khi phỏng vấn
"Em thiết kế idempotency key phía server như một lớp chặn ở đầu request ghi. Client gửi header Idempotency-Key là UUID cho mỗi thao tác nghiệp vụ và giữ nguyên key khi retry. Server tính hash của body, rồi cố gắng chèn một bản ghi {{(scope, key, request_hash, status=processing)}} vào DB với unique constraint — thao tác này nguyên tử nên khi hai request cùng key đến song song, chỉ một request insert thành công và được chạy business logic. Request còn lại gặp unique conflict: nếu body hash khác em trả 422 vì client dùng sai key; nếu đang processing em trả 409 hoặc cho chờ; nếu đã completed em trả lại response cũ nguyên vẹn, cùng status code và body. Em lưu ở PostgreSQL làm nguồn sự thật vì durable; Redis chỉ dùng nếu cần chặn nhanh nhưng không phải nơi duy nhất cho giao dịch tiền. TTL thường 24 giờ. Điểm em hay nhấn mạnh là phải hash body và trả đúng response cũ, nếu không cơ chế này sẽ gây lỗi ngữ cảnh khó debug hơn cả duplicate."

> Senior tip: Với giao dịch tài chính, hãy chọn DB có unique constraint làm "hàng rào" nguyên tử và coi response đã lưu là immutable. Đừng tối ưu bằng cách bỏ qua lưu response body — client cần response ổn định khi replay, và bạn cần bằng chứng đã xử lý khi điều tra sự cố.`,
    follow: [
      'Làm sao xử lý partial failure: request xử lý xong nhưng response mất?',
      'Idempotency key scope nên global hay per (user, endpoint)?',
      'So sánh idempotency key với natural idempotency qua PUT với resource id.'
    ],
    tags: ['Idempotency', 'Redis', 'Concurrency', 'API Design']
  },
  {
    id: 'api-034',
    topic: 'api',
    level: 'senior',
    q: 'ETag và If-Match: optimistic concurrency qua HTTP, khác nhau giữa 412 Precondition Failed và 409 Conflict thế nào?',
    a: `**Tóm tắt:** ETag (Entity Tag — một "dấu vân tay"/phiên bản của tài nguyên) và {{If-Match}} cho phép optimistic concurrency control (kiểm soát đồng thời lạc quan: giả định xung đột hiếm, chỉ kiểm tra khi ghi) qua HTTP. Client GET nhận ETag, khi cập nhật gửi {{If-Match: <etag>}}; server so sánh với phiên bản hiện tại, nếu khác thì trả **412 Precondition Failed** (điều kiện tiên quyết không thỏa — phiên bản lệch, client cần lấy lại và thử lại). **409 Conflict** khác bản chất: dùng khi request xung đột với **trạng thái nghiệp vụ** hiện tại (ví dụ hủy đơn đã giao), không phải lệch phiên bản; client thường không thể chỉ retry máy móc mà phải xử lý theo nghiệp vụ.

### Bối cảnh: vì sao cần optimistic concurrency
Hãy tưởng tượng hai người cùng sửa một tài liệu Google Docs nhưng không có cơ chế hợp nhất: người sửa sau ghi đè người sửa trước. Với API, hai client cùng GET một đơn hàng (version 5), cùng sửa, cùng PUT — nếu không kiểm tra phiên bản, bản ghi sau sẽ âm thầm ghi đè bản ghi trước (lost update). Optimistic concurrency giải quyết bằng cách: "chỉ ghi nếu phiên bản vẫn là version bạn đã đọc".

### ETag và If-Match hoạt động từng bước
- **ETag** là giá trị do server sinh, gắn với representation hiện tại của resource. Có thể là hash nội dung ({{"a1b2c3"}}) hoặc số phiên bản ({{"v5"}}). Strong ETag nghĩa là giống byte-for-byte; weak ETag ({{W/"v5"}}) nghĩa là tương đương ngữ nghĩa.
- **If-Match**: header client gửi kèm request ghi (PUT/PATCH/DELETE) để nói "chỉ thực hiện nếu ETag hiện tại khớp giá trị này". {{If-Match: *}} nghĩa là "chỉ thực hiện nếu resource tồn tại".
- **If-None-Match**: ngược lại, thường dùng cho GET có điều kiện (trả 304 Not Modified nếu chưa đổi) hoặc tạo mới chỉ khi chưa tồn tại.

~~~seq
title: Optimistic concurrency với ETag và If-Match
actors: Client A | Client B | API | DB
Client A -> API: GET /orders/42
API -> DB: Đọc order version 5
API --> Client A: 200 + ETag: "v5"
Client B -> API: GET /orders/42
API --> Client B: 200 + ETag: "v5"
Client B -> API: PUT /orders/42 (If-Match: "v5")
API -> DB: Kiểm tra version == 5? OK, cập nhật
API --> Client B: 200 + ETag: "v6"
Client A -> API: PUT /orders/42 (If-Match: "v5")
API -> DB: Kiểm tra version == 5? KHÔNG (đã là 6)
API --> Client A: 412 Precondition Failed
Client A -> API: GET /orders/42 (lấy lại version mới)
~~~

### 412 Precondition Failed vs 409 Conflict
| Tiêu chí | 412 Precondition Failed | 409 Conflict |
|---|---|---|
| Nguyên nhân | Điều kiện tiên quyết ({{If-Match}}, {{If-None-Match}}, {{If-Unmodified-Since}}) không thỏa | Request xung đột với **trạng thái nghiệp vụ** hiện tại của resource |
| Ví dụ | PUT với {{If-Match: "v5"}} nhưng resource đã là "v6" | Hủy đơn hàng nhưng đơn đã ở trạng thái DELIVERED; tạo user trùng email (unique nghiệp vụ) |
| Client nên làm gì | GET lại resource + ETag mới, merge thay đổi, retry | Đọc lỗi, xử lý theo nghiệp vụ (thông báo user, chọn hướng khác); **không** retry máy móc |
| Bản chất | Lệch phiên bản (kỹ thuật đồng thời) | Xung đột trạng thái/quy tắc (nghiệp vụ) |

Phân biệt rõ giúp client (và người debug) biết có nên retry tự động hay không: 412 thường retry được sau khi làm mới dữ liệu; 409 retry mù thường vô ích hoặc gây vòng lặp.

### Ví dụ đời thực
Giả định hệ thống quản lý kho: 300 QPS cập nhật tồn kho từ nhiều kênh (web, app, đối tác), mỗi bản ghi sản phẩm được đọc/ghi bởi trung bình 4 client đồng thời trong giờ sale. Trước đây dùng "last write wins" (ghi đè im lặng) → khoảng 0,8% cập nhật bị mất (lost update), gây oversell ~120 đơn/ngày, mỗi đơn xử lý hậu quả tốn ~15 phút.

Triển khai: (1) Mỗi response GET {{/inventory/:sku}} trả {{ETag}} là số phiên bản (cột {{version}} trong DB). (2) Client gửi {{If-Match}} khi PUT/PATCH. (3) Server dùng câu lệnh {{UPDATE ... WHERE sku=? AND version=?}}; nếu số dòng ảnh hưởng = 0 thì trả 412. (4) Client nhận 412 thì GET lại, tính toán lại delta, retry (tối đa 3 lần với backoff).

Kết quả: lost update giảm về 0, tỉ lệ 412 khoảng 2,1% trong giờ sale (xung đột thật được phát hiện), retry thành công 97% trong 2 lần thử, oversell do race giảm xuống < 5 đơn/tháng.

### Lỗi hay gặp trên production
- **Nhầm 409 cho lỗi version**: API trả 409 khi ETag lệch khiến client không biết nên refresh và retry; hãy dùng đúng 412 cho precondition failure.
- **Dùng weak ETag cho cập nhật toàn phần**: weak ETag chỉ đảm bảo tương đương ngữ nghĩa, có thể bỏ sót khác biệt byte quan trọng; với PUT thay thế toàn bộ, ưu tiên strong ETag.
- **Không trả ETag trong response GET**: client không có giá trị để gửi {{If-Match}} → mất khả năng kiểm soát đồng thời. Mọi GET resource mutable nên cân nhắc trả ETag.
- **ETag không ổn định qua nhiều instance/cache**: nếu ETag tính từ timestamp hoặc instance-local state, cùng nội dung có thể ra ETag khác sau khi qua load balancer → 412 giả. Tính ETag từ nội dung hoặc version trong DB.

### Trả lời mẫu khi phỏng vấn
"Em dùng ETag và If-Match để làm optimistic concurrency control qua HTTP. Luồng là: client GET một resource và nhận header ETag đại diện cho phiên bản hiện tại; khi cập nhật, client gửi PUT hoặc PATCH kèm {{If-Match}} với ETag đó. Server so sánh với phiên bản đang lưu — nếu khớp thì cập nhật và trả ETag mới, nếu không khớp thì trả 412 Precondition Failed để báo phiên bản đã thay đổi. Khi nhận 412, client nên GET lại dữ liệu mới, hợp nhất thay đổi rồi retry, chứ không ghi đè mù. Em phân biệt rõ 412 với 409: 412 là điều kiện tiên quyết không thỏa, tức lệch phiên bản kỹ thuật và thường retry được; còn 409 Conflict là xung đột trạng thái nghiệp vụ, ví dụ hủy một đơn đã giao — trường hợp này retry máy móc không giải quyết được, client phải xử lý theo quy tắc nghiệp vụ. Trong thực tế, em hay kết hợp ETag với cột {{version}} trong DB và câu {{UPDATE ... WHERE id=? AND version=?}} để kiểm tra nguyên tử ở tầng dữ liệu."

> Senior tip: Hãy chuẩn hóa semantics lỗi trong API contract: 412 = "hãy refresh rồi thử lại", 409 = "hãy đọc lỗi nghiệp vụ rồi quyết định". Sự rõ ràng này giúp client implement retry đúng và giảm rất nhiều bug "retry vô hạn" hoặc "mất cập nhật" khi tích hợp.`,
    follow: [
      'Khi nào dùng If-None-Match (GET có điều kiện) thay vì If-Match?',
      'ETag với distributed cache và load balancer: consistency thế nào?',
      'Conditional request trong HTTP caching (304 Not Modified) khác gì với concurrency control?'
    ],
    tags: ['ETag', 'If-Match', 'Optimistic Concurrency', 'HTTP']
  },
  {
    id: 'api-035',
    topic: 'api',
    level: 'lead',
    q: 'Webhook: giao ít nhất một lần, chữ ký HMAC + timestamp chống replay, retry và thứ tự thế nào?',
    a: `**Tóm tắt:** Webhook là cơ chế HTTP callback (máy chủ A chủ động POST sự kiện tới URL của máy chủ B) thường hoạt động theo mô hình **at-least-once** (gửi ít nhất một lần — có thể trùng, không được mất). Để chống giả mạo và replay (gửi lại request cũ), provider ký payload bằng HMAC-SHA256 trên {{timestamp + "." + body}} và receiver kiểm tra chữ ký với so sánh constant-time, đồng thời từ chối nếu timestamp quá cũ. Provider retry bằng exponential backoff khi nhận lỗi; receiver phải trả 2xx nhanh, xử lý bất đồng bộ (đẩy vào queue), **idempotent** theo event id, và tự xử lý trường hợp sự kiện đến sai thứ tự.

### Bối cảnh: vì sao webhook "khó" hơn gọi API thông thường
Webhook đảo chiều: thay vì bạn gọi provider, provider gọi bạn. Bạn không kiểm soát thời điểm, số lần, thứ tự, cũng không kiểm soát mạng trung gian. Ba vấn đề luôn xuất hiện: (1) request có thể bị gửi lại → bạn xử lý trùng; (2) kẻ tấn công có thể giả request → bạn thực thi lệnh giả; (3) sự kiện đến lệch thứ tự → bạn cập nhật trạng thái sai. Thiết kế tốt phải chấp nhận at-least-once và bảo vệ ở phía receiver.

### Chữ ký HMAC + timestamp chống giả mạo và replay
- **HMAC** (Hash-based Message Authentication Code — mã xác thực dùng hàm băm và khóa bí mật): provider và receiver chia sẻ một {{secret}}. Provider tính {{signature = HMAC-SHA256(secret, timestamp + "." + raw_body)}} và gửi trong header (ví dụ {{X-Signature}}, {{X-Timestamp}}).
- **Receiver kiểm tra từng bước**:
  1. Lấy {{timestamp}} từ header, tính {{|now - timestamp|}}; nếu lớn hơn ngưỡng (ví dụ 300 giây) thì từ chối — chống replay (kẻ tấn công bắt được request cũ và gửi lại).
  2. Tính lại HMAC từ {{raw_body}} gốc (không parse JSON rồi serialize lại, vì format có thể đổi).
  3. So sánh chữ ký bằng hàm **constant-time** (so sánh mất cùng thời gian dù khác ở ký tự nào) để tránh timing attack (đo thời gian so sánh để đoán dần chữ ký).
  4. Hỗ trợ xoay secret: cho phép 2 secret hợp lệ trong giai đoạn chuyển tiếp.

~~~seq
title: Webhook: ký, giao, retry và xử lý idempotent
actors: Provider | Receiver API | Queue | Worker | DB
Provider -> Receiver API: POST event (X-Timestamp, X-Signature)
Receiver API -> Receiver API: Kiểm tra timestamp + HMAC
Receiver API -> DB: Lưu event_id nếu chưa có (dedup)
Receiver API -> Queue: Đẩy event để xử lý async
Receiver API --> Provider: 200 OK (nhanh)
Worker -> Queue: Lấy event
Worker -> Worker: Xử lý nghiệp vụ (idempotent)
note Provider..Receiver API: Nếu timeout/5xx, Provider retry backoff
Provider -> Receiver API: POST lại cùng event
Receiver API -> DB: event_id đã có -> bỏ qua
Receiver API --> Provider: 200 OK
~~~

### At-least-once, retry và thứ tự
- **At-least-once**: provider chỉ coi là thành công khi nhận 2xx. Nếu timeout, lỗi mạng, 5xx → retry. Vì vậy cùng một event có thể đến nhiều lần.
- **Retry strategy**: exponential backoff (khoảng cách tăng dần: 1s, 2s, 4s, 8s...) + jitter (nhiễu ngẫu nhiên) để tránh "thundering herd"; giới hạn số lần và có dead-letter/cảnh báo sau cùng.
- **Receiver trả lời nhanh**: xác minh chữ ký, lưu/dedup event, đẩy vào queue, trả 2xx — **không** làm nghiệp vụ nặng trong request handler, vì chậm sẽ bị provider coi là lỗi và retry.
- **Thứ tự không đảm bảo**: retry có thể làm event B (mới, gửi lại sau) đến sau event A (cũ) hoặc xen kẽ. Receiver cần: gắn {{event_id}} và {{occurred_at/sequence}}; dedup theo {{event_id}}; nếu cần thứ tự nghiêm ngặt, lưu trạng thái và bỏ qua event cũ hơn (so sánh version/sequence) hoặc fetch lại trạng thái mới nhất từ provider.

### Ví dụ đời thực
Giả định tích hợp cổng thanh toán gửi webhook {{payment.succeeded}} về hệ thống thương mại điện tử: 120 event/phút giờ bình thường, 1.200 event/phút flash sale, p99 xử lý nghiệp vụ (cập nhật đơn, gửi email) ~900ms. Ban đầu receiver xử lý đồng bộ trong handler và không verify chữ ký chặt.

Sự cố: (1) Một đợt mạng chập chờn làm 3% request timeout → provider retry tạo ~2.500 xử lý trùng/tuần, một số đơn được cộng điểm loyalty hai lần. (2) Một request giả mạo (không có chữ ký hợp lệ) từng lọt vào môi trường staging do thiếu kiểm tra.

Cách xử lý: (1) Verify HMAC-SHA256 + timestamp (ngưỡng 5 phút), so sánh constant-time; từ chối request sai chữ ký với 401. (2) Bảng {{webhook_events}} có unique {{event_id}} để dedup. (3) Handler chỉ verify + persist + enqueue, trả 200 trong < 50ms; worker xử lý nghiệp vụ idempotent. (4) Provider retry tối đa 8 lần với exponential backoff + jitter.

Kết quả: xử lý trùng giảm về 0 (mọi duplicate bị dedup), không còn request giả mạo được chấp nhận, tỉ lệ provider retry giảm rõ vì receiver trả 200 nhanh; trong flash sale queue absorb burst, độ trễ cập nhật đơn tăng nhẹ (p95 ~3 giây) nhưng chấp nhận được theo nghiệp vụ.

### Lỗi hay gặp trên production
- **Xử lý nghiệp vụ đồng bộ trong webhook handler**: chậm → provider timeout → retry storm → tải tăng gấp bội. Luôn tách nhận (nhanh) và xử lý (async).
- **Parse JSON rồi ký lại để verify**: thay đổi khoảng trắng/thứ tự field làm lệch chữ ký. Phải verify trên **raw body bytes**.
- **So sánh chữ ký bằng {{==}} thông thường**: có thể bị timing attack. Dùng {{MessageDigest.isEqual}} (Java) hoặc hàm constant-time tương đương.
- **Không dedup theo {{event_id}}**: coi at-least-once như at-most-once → duplicate nghiệp vụ. Idempotency là bắt buộc ở receiver.
- **Tin thứ tự đến**: cập nhật trạng thái theo thứ tự nhận được có thể ghi đè trạng thái mới bằng event cũ (retry trễ). Dùng {{occurred_at/sequence}} để bỏ qua event lỗi thời.

### Trả lời mẫu khi phỏng vấn
"Khi thiết kế nhận webhook, em giả định mô hình at-least-once: provider sẽ retry khi không nhận 2xx, nên cùng event có thể đến nhiều lần và thứ tự không đảm bảo. Về bảo mật, em yêu cầu provider ký payload bằng HMAC-SHA256 trên chuỗi gồm timestamp và raw body; phía receiver kiểm tra timestamp trong cửa sổ cho phép, ví dụ 5 phút, để chống replay, rồi tính lại HMAC và so sánh bằng hàm constant-time để tránh timing attack — và em luôn verify trên raw body, không phải JSON đã parse lại. Về độ tin cậy, handler của em chỉ làm ba việc nhanh: verify chữ ký, dedup theo event id bằng unique constraint, đẩy vào queue, rồi trả 200. Business logic chạy ở worker và phải idempotent. Với thứ tự, em không tin thứ tự đến: mỗi event có occurred_at hoặc sequence, worker sẽ bỏ qua event cũ hơn trạng thái hiện có hoặc fetch lại trạng thái mới nhất từ provider nếu cần. Cách này giúp hệ thống chịu được retry storm, request giả mạo và out-of-order mà vẫn giữ tính đúng của nghiệp vụ."

> Senior tip: Hãy coi webhook endpoint là "public input không đáng tin": verify chữ ký + timestamp trước tiên, trả 2xx chỉ sau khi đã persist/dedup bền vững (để crash sau đó không làm mất event), và giám sát tỉ lệ retry/duplicate/invalid-signature — các chỉ số này phát hiện sớm cả lỗi tích hợp lẫn tấn công.`,
    follow: [
      'Làm sao verify HMAC constant-time để tránh timing attack?',
      'Webhook ordering guarantees: có provider nào đảm bảo in-order không?',
      'So sánh webhook với polling và SSE cho event delivery.'
    ],
    tags: ['Webhook', 'HMAC', 'At-least-once', 'Retry', 'Security']
  },
  {
    id: 'api-036',
    topic: 'api',
    level: 'senior',
    q: 'Rate limiting phân tán: fixed window vs sliding window log/counter vs token bucket trên Redis (Lua script atomic) — chọn thế nào?',
    a: `**Tóm tắt:** Fixed window đơn giản nhưng spike ở boundary; sliding window log chính xác nhưng tốn memory; sliding window counter cân bằng; token bucket cho phép burst và refill liên tục. Trên Redis, dùng Lua script để atomic check-and-increment, tránh race giữa nhiều instance.

### Hiểu nhanh
Rate limit như quota nước: fixed window là "mỗi giờ 100 lít" — phút 59 và phút 0 có thể rút 200 lít trong 2 phút (boundary spike). Sliding window là "100 lít trong bất kỳ 60 phút liên tiếp". Token bucket là "thùng 100 token, mỗi giây thêm 1 token, rút tối đa 100 cùng lúc".

### Các thuật toán
- Fixed window: counter per (key, window); reset mỗi window. Đơn giản, O(1) memory. Boundary spike.
- Sliding window log: lưu timestamp mỗi request; đếm trong [now-W, now]. Chính xác, O(N) memory.
- Sliding window counter: weighted average của window hiện tại và trước. Cân bằng.
- Token bucket: bucket capacity + refill rate; consume token per request; cho burst up to capacity.
- Leaky bucket: queue FIFO với rate cố định; smoothing, không burst.

### Cơ chế từng bước: Token Bucket trên Redis (Lua)
Dưới đây là quy trình chi tiết khi một request đến và được kiểm tra bởi token bucket:

1. **Client gửi request** kèm key định danh (user_id, IP, API key).
2. **Redis nhận key**, Lua script được thực thi nguyên tử (atomic) trên single-threaded Redis:
   - Lấy hash hiện tại: {{tokens, last_refill_ts}} từ key ratelimit:{key}.
   - Tính {{elapsed = now - last_refill_ts}} (ms).
   - Tính {{new_tokens = min(capacity, tokens + elapsed * refill_rate / 1000)}}.
   - Nếu {{new_tokens >= 1}}: trừ 1 token, cập nhật hash với {{tokens = new_tokens - 1}}, {{last_refill_ts = now}}, đặt TTL = window_size * 2. Trả về {{allowed: true, remaining: new_tokens - 1}}.
   - Nếu {{new_tokens < 1}}: không trừ token, trả về {{allowed: false, remaining: 0, retry_after_ms: (1 - new_tokens) / refill_rate * 1000}}.
3. **Application nhận kết quả**: nếu allowed → xử lý request; nếu không → trả 429 với header {{Retry-After}} và {{X-RateLimit-Remaining: 0}}.
4. **Cleanup**: key tự hết hạn sau TTL, không cần job dọn dẹp riêng.

### So sánh chi tiết
| Tiêu chí | Fixed Window | Sliding Window Log | Sliding Window Counter | Token Bucket | Leaky Bucket |
|---|---|---|---|---|---|
| Độ chính xác | Thấp (boundary spike) | Cao | Trung bình (xấp xỉ) | Cao | Cao |
| Memory | O(1) | O(N requests) | O(1) | O(1) | O(1) |
| Burst handling | Không | Không | Một phần | Có (tới capacity) | Không |
| Latency impact | Thấp | Cao (duyệt sorted set) | Thấp | Thấp | Thấp |
| Implementation | Đơn giản | Phức tạp | Trung bình | Trung bình | Trung bình |
| Phù hợp | Brute-force protection | Billing, quota chính xác | General purpose | Public API, burst-friendly | Strict fairness, smoothing |

### Redis Lua atomic
- INCR + EXPIRE không atomic qua nhiều instance → race.
- Lua script chạy atomic trên Redis single-threaded.
- Sliding window counter: cần 2 key (prev, curr) + Lua compute weighted.
- Token bucket: lưu {{tokens, last_refill}} hash; Lua compute refill và consume.

### Lua script mẫu cho Token Bucket
~~~lua
-- KEYS[1] = ratelimit:{key}, ARGV[1] = capacity, ARGV[2] = refill_rate (tokens/sec), ARGV[3] = now_ms, ARGV[4] = ttl_ms
local bucket = redis.call('HMGET', KEYS[1], 'tokens', 'last_refill')
local tokens = tonumber(bucket[1]) or tonumber(ARGV[1])
local last_refill = tonumber(bucket[2]) or tonumber(ARGV[3])
local elapsed = tonumber(ARGV[3]) - last_refill
local new_tokens = math.min(tonumber(ARGV[1]), tokens + elapsed * tonumber(ARGV[2]) / 1000)
if new_tokens >= 1 then
  new_tokens = new_tokens - 1
  redis.call('HMSET', KEYS[1], 'tokens', new_tokens, 'last_refill', ARGV[3])
  redis.call('PEXPIRE', KEYS[1], ARGV[4])
  return {1, new_tokens}
else
  local retry_after = math.ceil((1 - new_tokens) / tonumber(ARGV[2]) * 1000)
  return {0, 0, retry_after}
end
~~~

### Chọn thế nào
- Public API: token bucket (burst friendly).
- Login/password reset: fixed window nhỏ (chống brute force).
- Billing/quota: sliding window counter.
- Strict fairness: leaky bucket.

### Trên production
- Triệu chứng: 429 storm khi traffic burst → token bucket capacity tuning.
- Đo: 429 rate, latency Redis, key cardinality.
- Tuning: per-user/per-IP/per-endpoint keys; Redis Cluster hash tag để cùng slot.

### Lỗi hay gặp trên production
- **Dùng INCR + EXPIRE riêng biệt**: pod crash giữa hai lệnh → key không bao giờ hết hạn, user bị chặn vĩnh viễn. Luôn dùng Lua atomic hoặc {{SET key value EX NX}} (Redis 2.6.12+).
- **Không dùng hash tag trong Redis Cluster**: key {{ratelimit:user:123}} và {{ratelimit:user:456}} rơi vào slot khác → Lua script báo lỗi {{CROSSSLOT}}. Dùng ratelimit:{user}:123 để cùng slot.
- **Refill rate tính sai đơn vị**: refill_rate là tokens/giây nhưng {{elapsed}} tính bằng ms → phải chia 1000. Sai lệch này làm bucket refill quá nhanh hoặc quá chậm.
- **Không set TTL hợp lý**: TTL quá ngắn → key bị xóa khi user vẫn đang request; TTL quá dài → memory leak. TTL = window_size * 2 là an toàn.
- **Burst capacity quá lớn**: cho phép burst 1000 request đồng thời có thể làm downstream sập. Capacity nên dựa trên throughput thực tế của downstream.

### Trả lời miệng 1 phút
"Fixed window đơn giản nhưng boundary spike; sliding window counter cân bằng chính xác và memory; token bucket cho burst + refill. Trên Redis dùng Lua script atomic để tránh race giữa instance."

### Ví dụ đời thực
API gửi OTP dùng **fixed window** 5 lần/phút theo số điện thoại bằng {{INCR}} + {{EXPIRE}} trên Redis. Kẻ tấn công gửi 5 lần ở giây 59 và 5 lần ở giây 61 → 10 OTP trong 2 giây (hiệu ứng biên cửa sổ), chi phí SMS tăng vọt khoảng 18 triệu đồng một đêm. Một lỗi khác: {{INCR}} rồi mới {{EXPIRE}} bằng hai lệnh riêng; pod crash giữa hai lệnh → khoá không bao giờ hết hạn, số điện thoại bị chặn vĩnh viễn. Chuyển sang **token bucket** viết bằng **một script Lua** (Redis chạy script nguyên tử): đọc số token và thời điểm nạp cuối, nạp thêm theo thời gian đã trôi qua, trừ token nếu đủ, đặt TTL — tất cả trong một lần gọi. Thêm giới hạn thứ hai theo IP và theo thiết bị. Chi phí SMS bất thường biến mất; người dùng bình thường không bị ảnh hưởng nhờ cho phép "bùng nổ" ngắn (dung lượng bucket 3).

> Senior tip: key design quyết định hơn thuật toán — per-user cho authenticated, per-IP cho anonymous, per-endpoint cho expensive ops; dùng Redis Cluster hash tag để atomic Lua chạy đúng slot.`,
    follow: [
      'Fixed window boundary spike cụ thể là bao nhiêu request trong 2 phút?',
      'Token bucket vs leaky bucket: khi nào burst là mong muốn vs nguy hiểm?',
      'Rate limit response header (X-RateLimit-*) nên trả gì và client retry thế nào?'
    ],
    tags: ['Rate Limiting', 'Redis', 'Token Bucket', 'Sliding Window', 'Lua']
  },
  {
    id: 'api-037',
    topic: 'api',
    level: 'senior',
    q: 'HTTP caching: Cache-Control, ETag, Vary, stale-while-revalidate hoạt động thế nào và khi nào dùng CDN vs browser cache?',
    a: `**Tóm tắt:** Cache-Control điều khiển ai được cache và bao lâu (max-age, s-maxage, no-store). ETag/Last-Modified cho conditional request → 304. Vary phân biệt response theo header (Accept, Accept-Encoding). stale-while-revalidate cho phép trả stale trong khi revalidate nền. CDN cache ở edge (s-maxage), browser cache ở client (max-age).

### Hiểu nhanh
Cache như tủ lạnh: max-age là hạn sử dụng, ETag là tem kiểm tra còn nguyên, Vary là "phiên bản theo khẩu vị" (Accept-Language), stale-while-revalidate là "dùng hàng cũ trong khi đi mua hàng mới".

### Cache-Control directives
- public/private: ai được lưu.
- max-age: TTL ở client.
- s-maxage: TTL ở shared cache (CDN).
- no-store: không lưu (dữ liệu nhạy cảm).
- no-cache: phải revalidate trước khi dùng.
- must-revalidate: không được dùng stale khi hết hạn.
- stale-while-revalidate=N: trả stale trong N giây trong khi revalidate nền.
- stale-if-error=N: trả stale khi origin lỗi.

### Conditional request
- Client gửi If-None-Match (ETag) hoặc If-Modified-Since.
- Server trả 304 Not Modified (không body) nếu không đổi → tiết kiệm bandwidth.
- Strong vs weak ETag.

### Vary
- Vary: Accept, Accept-Encoding, Accept-Language → cache key gồm các header đó.
- Vary: * → disable caching hiệu quả.

### Cơ chế từng bước: Request flow với cache
1. **Client gửi request** kèm header If-None-Match: "etag-value" (nếu có cached response) và Accept-Encoding: gzip, br.
2. **CDN nhận request**, kiểm tra cache key (URL + Vary headers). Nếu cache hit:
   - Kiểm tra max-age/s-maxage còn hạn không.
   - Nếu còn hạn → trả cached response ngay (hit).
   - Nếu hết hạn nhưng có stale-while-revalidate → trả stale response ngay, **bật async revalidate** ngầm.
3. **Async revalidate** (nếu stale-while-revalidate): CDN gửi request lên origin kèm If-None-Match. Origin so sánh ETag:
   - Giống → trả 304, CDN cập nhật cache, gia hạn TTL.
   - Khác → trả 200 với body mới, CDN thay thế cache.
4. **Cache miss** hoặc **stale-if-error** (khi origin lỗi 5xx): CDN forward request lên origin, cache response mới (nếu 2xx), trả về client.
5. **Client nhận response**: nếu 304 → dùng cached body; nếu 200 → cache body mới với ETag mới.

### ETag generation strategies
- **Strong ETag**: hash nội dung response (MD5/SHA256 của body). Đảm bảo byte-for-byte identical. Dùng cho PUT/PATCH response và resource mutable.
- **Weak ETag** (W/"..."): semantic equivalence, không đảm bảo byte-for-byte. Ví dụ: version number, timestamp, hash của field quan trọng. Dùng khi strong ETag tốn kém (response lớn, streaming).
- **Generation point**: tại application layer (Spring: ShallowEtagHeaderFilter tính hash body) hoặc reverse proxy (Nginx etag on tính từ file static).
- **Pitfall**: Weak ETag không dùng được cho If-Match (chỉ dùng cho If-None-Match). Nếu dùng weak ETag cho conditional PUT → server có thể chấp nhận ghi đè sai dữ liệu.

### Cache key design cho CDN
Cache key = scheme + host + path + query params (có filter) + Vary headers.
- **Query params**: chỉ include params ảnh hưởng response (filter, sort, page). Loại bỏ tracking params (utm_*, fbclid).
- **Vary headers**: Accept-Encoding (gzip/br), Accept-Language (i18n), Accept (JSON/XML). Không Vary theo User-Agent (quá nhiều variant).
- **Cookie**: **không** include cookie vào cache key trừ khi cache personalized content ở CDN (thường không làm). Dùng private directive để chặn CDN cache.

### CDN vs browser — so sánh chi tiết
| Tiêu chí | Browser Cache | CDN (Shared Cache) |
|---|---|---|
| Phạm vi | Per-user, per-device | Shared across users |
| Directive | max-age, no-store, private | s-maxage, public |
| Invalidation | Hard (phải clear browser cache hoặc versioned URL) | Easy (purge API, cache tag) |
| Phù hợp | Personalized data, auth pages | Static assets, public API, HTML public |
| Kích thước | Nhỏ (hàng trăm MB) | Lớn (GB-TB) |
| Latency | 0 ms (local) | 1-50 ms (edge) |

### Kết hợp real-world: Multi-layer caching
~~~text
Response headers:
Cache-Control: public, max-age=60, s-maxage=3600, stale-while-revalidate=86400
ETag: "sha256-abc123..."
Vary: Accept-Encoding, Accept-Language

Flow:
Browser (max-age=60s) → CDN (s-maxage=1h, SWR=24h) → Origin
- 0-60s: Browser cache hit (0 ms)
- 60s-1h: Browser miss → CDN hit (edge, ~5 ms)
- 1h-24h: CDN stale → trả stale + async revalidate (user không thấy độ trễ)
- >24h: CDN miss → Origin (full latency)
~~~

### Trên production
- Triệu chứng: stale data sau deploy → purge CDN hoặc versioned URL.
- Đo: hit ratio, origin load, bandwidth.
- Tuning: cache key design, purge API, versioned assets.

### Lỗi hay gặp trên production
- **Cache authenticated response ở shared cache**: quên private directive → CDN cache response có Set-Cookie hoặc body user-specific → user A thấy data của user B. Luôn dùng Cache-Control: private, no-store cho endpoint cần auth.
- **Vary: User-Agent** → nghìn variant cache cho cùng một URL (mỗi browser version một cache entry) → hit ratio gần 0. Chỉ Vary theo header thực sự ảnh hưởng response (Accept-Encoding, Accept-Language).
- **Không purge CDN sau deploy static asset**: user vẫn tải JS/CSS cũ → UI broken. Dùng versioned URL (/app.v20240115.js) hoặc purge API trong CI/CD.
- **ETag weak cho conditional PUT**: server chấp nhận ghi đè dựa trên weak ETag → lost update. Chỉ dùng strong ETag cho If-Match.
- **stale-while-revalidate quá dài** (ví dụ 1 năm): client thấy data cũ quá lâu sau khi data thay đổi. SWR nên ≤ 24h cho API dynamic.
- **Query param không ổn định trong cache key**: ?timestamp=12345 hoặc ?request_id=uuid làm cache key unique mỗi request → hit ratio = 0. Strip tracking params ở CDN layer.

### Trả lời miệng 1 phút
"Cache-Control với max-age/s-maxage điều khiển TTL client/CDN; ETag cho conditional 304; Vary phân biệt theo header; stale-while-revalidate trả stale trong khi revalidate. CDN cho public/shared, browser cho personalized."

### Ví dụ đời thực
API danh mục sản phẩm (thay đổi vài lần mỗi giờ) nhận 6.000 request/giây, gần như toàn bộ đi thẳng vào service. Thêm {{Cache-Control: public, max-age=60, stale-while-revalidate=300}} và {{ETag}} (hash nội dung): CDN phục vụ 94% request, service chỉ còn khoảng 350 request/giây; khi cache hết hạn, CDN vẫn trả bản cũ ngay trong lúc làm mới ở nền nên người dùng không thấy độ trễ. Sự cố đi kèm: API "giỏ hàng của tôi" được cấu hình nhầm cùng rule CDN với {{public}} → một người dùng thấy giỏ hàng của người khác (CDN cache theo URL, không theo người). Sửa: dữ liệu cá nhân luôn {{Cache-Control: private, no-store}}; với phản hồi khác nhau theo ngôn ngữ thì đặt {{Vary: Accept-Language}} để CDN lưu bản riêng; kiểm tra header cache trong test tự động cho mọi endpoint có dữ liệu người dùng.

> Senior tip: dùng versioned URL cho static assets (immutable, max-age=1y) và short TTL cho API dynamic; đừng cache authenticated response ở shared cache.`,
    follow: [
      'stale-while-revalidate khác gì stale-if-error và khi nào dùng cả hai?',
      'Cache poisoning qua Vary header sai thế nào?',
      'CDN purge vs versioned URL: trade-off operational.'
    ],
    tags: ['HTTP Caching', 'Cache-Control', 'CDN', 'ETag', 'Vary']
  },
  {
    id: 'api-038',
    topic: 'api',
    level: 'lead',
    q: 'API gateway pattern: routing, auth, rate limit, circuit breaker, request/response transform ở gateway thế nào? Khi nào nên dùng gateway vs service mesh?',
    a: `**Tóm tắt:** API gateway là entry point duy nhất: routing theo path/host, terminating TLS, auth (JWT/API key), rate limiting, circuit breaker, transform request/response, aggregation. Service mesh (Istio/Linkerd) xử lý east-west traffic giữa service với mTLS, retry, circuit breaker ở sidecar. Gateway cho north-south (client → cluster), mesh cho east-west (service ↔ service).

### Hiểu nhanh
Gateway như lễ tân tòa nhà: kiểm tra giấy tờ, điều hướng khách, giới hạn số khách. Service mesh như hệ thống an ninh nội bộ giữa các phòng ban: mỗi phòng có bảo vệ riêng (sidecar) kiểm tra người ra vào giữa các phòng.

### Gateway responsibilities
- Routing: path/host → upstream service.
- TLS termination.
- Authn/authz: JWT validation, API key, OAuth2.
- Rate limiting per consumer.
- Circuit breaker, timeout, retry.
- Request/response transform: header injection, body rewrite.
- Aggregation: BFF pattern, compose nhiều service.
- Observability: access log, metrics, tracing.

### Gateway options
- Spring Cloud Gateway (reactive, Java).
- Kong, Envoy, AWS API Gateway, Apigee.
- Trade-off: managed (AWS) vs self-hosted (Kong/Envoy).

### Gateway vs Service Mesh
- Gateway: north-south, client-facing, coarse-grained policy.
- Mesh: east-west, service-to-service, fine-grained, mTLS, traffic splitting.
- Có thể kết hợp: gateway ở edge + mesh trong cluster.
- Mesh overhead: sidecar memory/CPU, complexity; không cần nếu chỉ có ít service.

### Trên production
- Triệu chứng: gateway bottleneck (single point of failure) → scale horizontally, health check.
- Đo: latency added, error rate, throughput.
- Tuning: connection pool, timeout, caching response.

### Trả lời miệng 1 phút
"API gateway là entry point: routing, TLS, auth, rate limit, circuit breaker, transform, aggregation. Service mesh xử lý east-west với mTLS ở sidecar. Gateway cho north-south, mesh cho east-west; kết hợp khi cần cả hai."

### Ví dụ đời thực
Một hệ thống 25 microservice, mỗi service tự kiểm tra JWT, tự rate limit, tự cấu hình CORS — mỗi service một kiểu, có service quên kiểm tra hạn token. Đưa **Spring Cloud Gateway** (hoặc Kong) vào: xác thực token và rate limit tập trung ở gateway, định tuyến theo path, gắn {{X-Request-Id}}/traceparent, thống nhất CORS và body lỗi. Bài học sau 3 tháng: (1) một dev đưa **logic nghiệp vụ** vào filter gateway (tính phí vận chuyển) → mỗi thay đổi nghiệp vụ phải deploy gateway, rủi ro cho toàn hệ thống — chuyển lại về service; (2) service phía sau vẫn phải kiểm tra **quyền** (authorization) vì gateway chỉ biết "ai", không biết "được làm gì với tài nguyên nào"; (3) gateway chạy tối thiểu 3 replica, có circuit breaker theo route để một service chậm không làm cạn tài nguyên của gateway. Service mesh (Istio, Linkerd) được cân nhắc sau cho mTLS và retry giữa các service nội bộ — vấn đề **đông–tây**, khác với gateway xử lý traffic **bắc–nam**.

> Senior tip: đừng nhét business logic vào gateway; giữ gateway stateless và thin; BFF cho mobile/web riêng biệt để tránh coupling client với backend evolution.`,
    follow: [
      'Spring Cloud Gateway filter chain hoạt động thế nào và khi nào dùng custom filter?',
      'Service mesh sidecar (Envoy) intercept traffic bằng iptables thế nào?',
      'Gateway aggregation vs client-side composition: trade-off latency và coupling.'
    ],
    tags: ['API Gateway', 'Service Mesh', 'Spring Cloud Gateway', 'Envoy', 'mTLS']
  },
{
    id: 'api-039',
    topic: 'api',
    level: 'senior',
    q: 'HATEOAS (Hypermedia as the Engine of Application State) có thực sự cần thiết cho API ngân hàng hiện đại không? So sánh với OpenAPI client generation, GraphQL, và gRPC reflection: trade-off phát triển, bảo trì, và trải nghiệm client.',
    a: `**Tóm tắt:** HATEOAS đưa link điều hướng vào response (next, prev, related actions) để client khám phá API tại runtime mà không cần documentation. Thực tế: API ngân hàng **hiếm khi dùng HATEOAS thuần túy** vì (1) OpenAPI generate SDK cho phép client biết hết endpoint tại build time, (2) GraphQL client tự chọn field, (3) gRPC reflection/cần schema registry. Chi phí thêm link vào mọi response, version link khi đổi endpoint, và client vẫn phải hard-code logic nghiệp vụ. Dùng khi: public API cực kỳ động, client không thể update thường xuyên (IoT, smart TV).
### HATEOAS cơ bản
~~~json
GET /accounts/123
{
  "id": 123,
  "balance": 5000000,
  "_links": {
    "self": { "href": "/accounts/123" },
    "transactions": { "href": "/accounts/123/transactions" },
    "transfer": { "href": "/transfers", "method": "POST" },
    "close": { "href": "/accounts/123", "method": "DELETE" }
  }
}
~~~
Client đọc {{_links.transfer.href}} để POST thay vì hard-code URL.
### So sánh thực tế
| Tiêu chí | HATEOAS | OpenAPI + SDK | GraphQL | gRPC |
|---|---|---|---|---|
| **Khám phá runtime** | Có (link trong response) | Không (build-time) | Có (introspection) | Có (reflection) |
| **Client coupling** | Thấp (chỉ biết entry point) | Cao (SDK gắn endpoint) | Trung bình (query tự viết) | Cao (proto gắn method) |
| **Phát triển server** | Phức tạp (sinh link, version) | Đơn giản (annotation) | Trung bình (resolver) | Trung bình (proto) |
| **Breaking change** | An toàn hơn (client follow link) | Phải version SDK | An toàn (thêm field) | An toàn (field number) |
| **Tooling** | Yếu (HAL, JSON:API, Siren) | Rất mạnh (springdoc, openapi-generator) | Mạnh (Apollo, Relay) | Mạnh (buf, protoc) |
| **Cache/CDN** | Khó (link động) | Dễ (URL cố định) | Khó (POST query) | Không áp dụng |
### Khi nào HATEOAS giá trị
- API public cho thiết bị nhúng (IoT, POS, ATM) không thể update firmware thường xuyên — server đổi URL, client vẫn chạy nhờ follow link.
- Workflow phức tạp nhiều trạng thái (đơn xin vay: draft → submitted → approved → disbursed → closed) — link {{nextAction}} thay đổi theo state.
- Client generic (API explorer, dashboard tự động) cần render UI từ metadata.
### Khi nào KHÔNG dùng
- Mobile app, web app, partner integration: team client và server cùng công ty hoặc có quy trình release đồng bộ → OpenAPI generate SDK nhanh hơn, type-safe, IDE autocomplete.
- Microservice nội bộ: gRPC + protobuf reflection/schema registry hiệu quả hơn.
- Performance critical: thêm {{_links}} làm payload to 10-30%, serialize tốn CPU.
### Ví dụ đời thực
Một ngân hàng thiết kế API public theo HATEOAS (HAL+JSON) cho 50 đối tác fintech. Triệu chứng: (1) payload tăng 25% do {{_links}} lặp lại cho mỗi item trong danh sách 100 tài khoản; (2) đổi endpoint {{/v1/transfers}} → {{/v1/payments}} phải cập nhật link generator ở 12 controller, test regression 3 ngày; (3) đối tác vẫn hard-code URL vì SDK của họ không parse {{_links}} — HATEOAS trở thành "dead code". Sau 6 tháng, team bỏ HATEOAS, chuyển sang OpenAPI 3.1 + springdoc, generate TypeScript/Java/Kotlin SDK cho partner. Kết quả: payload giảm 25%, onboard partner từ 2 tuần xuống 3 ngày (generate SDK + test), breaking change bắt được ở CI bằng oasdiff.
### Trả lời mẫu khi phỏng vấn
"HATEOAS ý tưởng đẹp: client chỉ biết entry point, follow link để khám phá API, server đổi URL client không hỏng. Nhưng thực tế ngân hàng: (1) OpenAPI generate SDK cho type-safe client, IDE autocomplete, breaking change bắt ở CI — nhanh và an toàn hơn. (2) GraphQL client tự chọn field, introspection tại runtime. (3) gRPC reflection/schema registry cho nội bộ. Chi phí HATEOAS: sinh link mọi response, version link khi đổi route, payload to 30%, tooling yếu (HAL/JSON:API/Siren không chuẩn hóa hẳn). Tôi chỉ dùng HATEOAS khi client không thể update (IoT firmware, POS offline) hoặc workflow state machine phức tạp cần {{nextAction}} động. Còn mobile/web/partner: OpenAPI + SDK là lựa chọn thực dụng."
> Senior tip: Đừng ép HATEOAS chỉ vì "REST level 3 Richardson Maturity Model". Hãy đo: bao nhiêu % client thực sự dùng link động? Nếu < 5%, chi phí không đáng. Spring HATEOAS (spring-boot-starter-hateoas) sinh link dùng Link.of(...).withRel(...) — dùng khi cần, không ép toàn hệ thống.`,
    follow: [
      'Spring HATEOAS sinh link như thế nào cho pagination (first, next, last)?',
      'HAL vs JSON:API vs Siren: format nào phổ biến và tooling thế nào?'
    ],
    tags: ['HATEOAS', 'Hypermedia', 'REST', 'OpenAPI', 'GraphQL', 'API Design']
  },
  {
    id: 'api-040',
    topic: 'api',
    level: 'lead',
    q: 'Thiết kế chiến lược versioning API cho hệ sinh thái ngân hàng: 30 microservice, 5 đội phát triển, mobile app (iOS/Android), web admin, 40 đối tác fintech. So sánh URI versioning, header versioning, media type versioning, và composite approach. Làm sao quản lý deprecation, sunset, và migration mà không làm vỡ tích hợp?',
    a: `**Tóm tắt:** Không có "silver bullet". Chiến lược thực tế: **URI versioning cho public/partner** ({{/v1/}}, {{/v2/}}) vì gateway route dễ, log/metric tách biệt, partner test curl được; **header versioning cho internal sync** ({{Accept: application/vnd.bank.v2+json}}) để URL sạch, tránh version leak vào resource; **media type versioning cho GraphQL** (persisted query + {{@deprecated}} directive). Composite: URI major + header minor. Deprecation pipeline: telemetry → communication → brownout → sunset → 410 Gone.
### Ba chiến lược chính
| Chiến lược | Ví dụ | Ưu | Nhược | Phù hợp |
|---|---|---|---|---|
| **URI** | {{/v1/accounts}}, {{/v2/accounts}} | Rõ ràng, gateway route prefix, log tách series, curl test | URL "bẩn", client thấy version | Public API, partner, mobile app |
| **Header** | {{Accept: application/vnd.bank.v2+json}} | Resource URL ổn định, cache key tự nhiên | Proxy/CDN dễ bỏ header, khó debug log | Internal sync, service mesh |
| **Media type param** | {{Accept: application/json; version=2}} | Tách version khỏi media type | Tương tự header, thêm complexity | GraphQL persisted query |
### Composite approach (khuyến nghị ngân hàng)
~~~text
Public/Partner:     /v1/... , /v2/...           (major version trong URI)
Internal sync:      /accounts + Accept: vnd.bank.v2+json  (minor trong header)
GraphQL:            persisted query ID + schema directive @deprecated
Mobile app:         Gateway rewrite /app/v2/... → internal /v2/... + header
~~~
### Vòng đời deprecation có telemetry
1. **Design**: Viết spec v2, review Arch+Security+Partner, baseline git tag {{api/v2.0.0}}.
2. **Announce (T0)**: Email, portal, changelog. Response v1 thêm header:
   {{Deprecation: true}}, {{Sunset: Sat, 01 Mar 2026 00:00:00 GMT}},
   {{Link: <https://api.bank.vn/docs/migrate-v2>; rel="deprecation"}}
3. **Parity (T0+30d)**: v2 chạy song song, parity test hàng ngày so sánh response v1↔v2 (adapter map field).
4. **Brownout (T0+90d)**: v1 trả {{503 Service Unavailable}} + {{Retry-After: 300}} theo cửa sổ (Thứ 2 09:00-09:05). Log consumer bị ảnh hưởng, alert team partner.
5. **Measure (T0+180d)**: Dashboard Micrometer
~~~text
api_requests_total{version="v1", consumer="..."}
~~~
. Chỉ sunset khi < 1% traffic quan trọng.
6. **Sunset (T0+365d)**: Tắt v1, trả {{410 Gone}} + {{Link: <https://api.bank.vn/docs/migrate-v2>; rel="successor-version"}}.
### Quản lý đa đội (polyrepo/monorepo)
- **Contract repo**: Chứa OpenAPI spec + Protobuf + GraphQL SDL. Mỗi service là một package. CI gate: {{oasdiff}} (REST), {{buf breaking}} (gRPC), {{graphql-inspector}} (GraphQL).
- **Version policy**: Major = breaking (xóa field, đổi type, thêm required). Minor = non-breaking (thêm optional field, thêm endpoint). Patch = bugfix/internal.
- **Release train**: Mỗi quý một major release window. Service không breaking thì không bắt buộc bump major.
- **Gateway as version router**: Spring Cloud Gateway / Kong route {{/v1/*}} → service v1, {{/v2/*}} → service v2. Canary deploy v2, so sánh error rate/latency trước khi cắt traffic.
### Ví dụ đời thực
Ngân hàng 30 service, 5 team, 40 partner. Ban đầu mỗi team version tuỳ hứng: team A dùng URI, team B header, team C không version — partner tích hợp 3 cách khác nhau, breaking change lọt production 4 lần/năm. Triển khai composite: (1) Contract repo tập trung, CI gate bắt breaking change. (2) Gateway rewrite: partner {{/partner/v1/}} → internal header {{vnd.bank.v1+json}}. (3) Deprecation pipeline 12 tháng với brownout tuần. (4) Parity test job so sánh v1/v2 adapter. Kết quả: 18 tháng 0 breaking change lọt production, partner onboarding 3 ngày (generate SDK từ contract repo), team deploy độc lập mà không lo version conflict. Chi phí: 2 FTE platform maintain contract repo + gateway, 1 parity test job/ngày.
### Trả lời mẫu khi phỏng vấn
"Tôi chọn composite: URI major cho public/partner (gateway route dễ, log tách), header minor cho internal (URL sạch), GraphQL dùng persisted query + {{@deprecated}}. Deprecation không phải tắt một ngày: T0 announce + header Deprecation/Sunset/Link, T+30d parity test, T+90d brownout 5 phút/tuần ép client lộ ra, T+180d đo usage theo consumer, T+365d sunset {{410 Gone}}. Contract repo tập trung + CI gate (oasdiff/buf/graphql-inspector) bắt breaking change ở PR. Gateway làm version router, canary deploy so sánh error rate trước khi cắt. Bài học: team cũ mỗi người version một kiểu, partner đau khổ, breaking change lọt production. Chuẩn hóa composite + contract repo + deprecation pipeline đã khắc phục triệt để."
> Senior tip: Chi phí thật của versioning không phải code mà là **hai bộ test, hai bug surface, hai docs**. Giảm thiểu bằng: adapter mỏng (controller v1 map từ model v2), brownout sớm (đội partner migrate nhanh hơn email nhắc), và **không bao giờ** để client không gửi version rơi vào "latest" âm thầm — hãy ghim mặc định một version đã công bố.`,
    follow: [
      'Làm sao handle breaking change trong gRPC (field number) so với REST (URL/header)?',
      'Khi nào nên dùng "tolerant reader" (bỏ qua field lạ) thay vì versioning?'
    ],
    tags: ['API Versioning', 'Deprecation', 'Sunset', 'Gateway', 'Contract Testing', 'Architecture']
  },
  {
    id: 'api-041',
    topic: 'api',
    level: 'senior',
    q: 'Thiết kế xác thực và phân quyền cho API ngân hàng: OAuth 2.0 Authorization Code + PKCE cho mobile/web, Client Credentials cho service-to-service, mTLS cho internal mesh. So sánh JWT opaque vs self-contained, token exchange, và cách xử lý revocation real-time.',
    a: `**Tóm tắt:** Biên công khai (mobile, web, partner) dùng **OAuth 2.0 Authorization Code + PKCE** (RFC 7636) cấp **short-lived access token (JWT, 5-15 min)** + **refresh token rotation (RTR)**. Biên nội bộ service-to-service dùng **Client Credentials Grant** hoặc **mTLS** (certificate-based). Access token nên là **opaque reference token** (introspection) cho revocation real-time; self-contained JWT chỉ dùng khi latency introspection không chấp nhận được. Token exchange (RFC 8693) cho delegation (user → service A → service B).
### OAuth 2.0 flows cho ngân hàng
| Flow | Dùng cho | Token type | Revocation |
|---|---|---|---|
| Auth Code + PKCE | Mobile app, SPA, Web | Access (JWT 5-15m) + Refresh (RTR) | Refresh revoke = logout toàn bộ |
| Client Credentials | Service-to-service sync | Access (JWT 10-30m) hoặc opaque | Introspection endpoint |
| Device Authorization | TV, IoT, CLI | Access + Refresh | Refresh revoke |
| mTLS (Certificate) | Service mesh internal | Không token (cert = identity) | Cert revocation (CRL/OCSP) |
### JWT opaque vs self-contained
| Tiêu chí | Opaque (reference) | Self-contained JWT |
|---|---|---|
| **Payload** | Random string (UUID) | Claims (sub, roles, exp, custom) |
| **Validate** | Gọi **introspection endpoint** (Redis/DB) | Verify chữ ký local (JWKS), không gọi network |
| **Latency** | +1-2ms network call | 0ms (chỉ CPU verify) |
| **Revocation** | **Real-time** (xoá entry Redis/DB) | Chờ exp hoặc dùng blocklist/short expiry |
| **Payload size** | Nhỏ (36 chars) | Lớn (500-2000 bytes) |
| **Phù hợp** | Payment, high-security, cần revoke ngay | Internal low-latency, read-heavy, revoke 5-15m sau được chấp nhận |
### Refresh Token Rotation (RTR) - bắt buộc
~~~text
1. Client login → nhận access_token (JWT, 5m) + refresh_token (opaque, 30d)
2. Access hết hạn → client POST /token {{grant_type=refresh_token, refresh_token=...}}
3. Server: KHÁM refresh_token trong DB → nếu hợp lệ:
   - Xoá refresh_token cũ (revoke)
   - Cấp access_token MỚI + refresh_token MỚI (rotation)
   - Lưu refresh_token mới (hash SHA-256)
4. Nếu refresh_token bị replay (cũ và mới cùng dùng) → phát hiện reuse → **revoke TOÀN BỘ session**, force re-login.
~~~
### Token Exchange (RFC 8693) - delegation
User login → mobile có access_token_user. Mobile gọi Service A (API Gateway) → Service A cần gọi Service B thay mặt user.
~~~http
POST /token
grant_type=urn:ietf:params:oauth:grant-type:token-exchange
subject_token=<access_token_user>
subject_token_type=urn:ietf:params:oauth:token-type:access_token
requested_token_type=urn:ietf:params:oauth:token-type:access_token
audience=service-b
~~~
Service B nhận token có {{act}} (actor) = service-a, {{sub}} = user. Service B authorize dựa trên cả hai.
### Revocation real-time
- **Opaque token**: Redis {{DEL token:<jti>}} → introspection trả {{active: false}} ngay.
- **Self-contained JWT**: Short expiry (5m) + **JWKS rotation** (kid thay đổi). Không blocklist phức tạp — cửa sổ 5m là rủi ro chấp nhận được. Nếu bắt buộc revoke ngay: Redis blocklist {{jti}} + TTL = remaining expiry, introspection check blocklist.
### mTLS cho internal mesh
- Mỗi service có cert X.509 (SPIFFE/SPIRE hoặc cert-manager). Identity = {{spiffe://bank.vn/ns/prod/sa/transfer-svc}}.
- Sidecar (Envoy) hoặc application (Spring Boot 3 + Netty) terminate mTLS.
- Authorization: OPA/Rego policy đọc {{spiffe_id}} từ cert, map với policy.
- Cert rotation: 24h TTL, auto-rotate, không downtime.
### Ví dụ đời thực
Ngân hàng chuyển từ session cookie sang OAuth 2.0 + PKCE cho mobile/web, Client Credentials cho 30 service nội bộ. Ban đầu dùng self-contained JWT 30m cho mọi nơi — khi user đổi mật khẩu, token cũ vẫn hợp lệ đến hết hạn (30m), attacker dùng token cũ truy cập được. Triển khai: (1) Mobile/web: Auth Code + PKCE, access 5m, refresh RTR 30d. (2) Internal: Client Credentials cấp opaque token, introspection Redis (sub-ms). (3) Critical path (ledger, limit check): mTLS + SPIFFE, không token. (4) Token exchange cho API Gateway → service B thay mặt user. Kết quả: revoke real-time khi đổi mật khẩu/lock tài khoản, 0 incident token leak sau 6 tháng. Chi phí: 1 Auth Server (Keycloak/custom), 1 introspection Redis cluster, cert-manager cho mTLS.
### Trả lời mẫu khi phỏng vấn
"Tôi tách xác thực theo biên: mobile/web dùng Auth Code + PKCE (access 5m JWT + refresh RTR 30d), service-to-service dùng Client Credentials (opaque token + introspection Redis) hoặc mTLS cho critical path. Self-contained JWT chỉ dùng khi latency introspection không chấp nhận được, và phải short expiry (5m) vì revoke không real-time. RTR bắt buộc: mỗi refresh xoá token cũ, cấp mới, phát hiện reuse thì revoke toàn bộ session. Token exchange (RFC 8693) cho delegation user→service A→service B. mTLS với SPIFFE cho service mesh internal — cert = identity, không quản lý token. Bài học: team cũ dùng JWT 30m cho tất cả, đổi mật khẩu vẫn truy cập được 30 phút. Chuyển sang opaque + introspection + RTR đã khắc phục revoke real-time."
> Senior tip: **Đừng tự implement OAuth server** — dùng Keycloak, Auth0, hoặc Spring Authorization Server (chuẩn hóa). Tự viết dễ bỏ sót PKCE, RTR, token exchange, JWKS rotation. Với ngân hàng, compliance (PCI-DSS, NHNN) yêu cầu audit trail mọi cấp/refresh/revoke token — commercial/serverless Auth server có sẵn log này.`,
    follow: [
      'Làm sao implement PKCE đúng chuẩn (code_verifier, code_challenge_method=S256)?',
      'mTLS với SPIFFE/SPIRE: sidecar Envoy vs application-native (Netty) trade-off gì?'
    ],
    tags: ['OAuth 2.0', 'PKCE', 'Client Credentials', 'mTLS', 'Token Exchange', 'Revocation', 'Security']
  },
  {
    id: 'api-042',
    topic: 'api',
    level: 'lead',
    q: 'Consumer-driven contract testing (Pact) vs Provider-driven (OpenAPI): khi nào dùng cái nào, cách tích hợp vào CI/CD đa team, và làm sao xử lý breaking change detection khi consumer và provider deploy độc lập (polyrepo)?',
    a: `**Tóm tắt:** **Provider-driven (OpenAPI)**: provider viết spec, publish, consumer generate SDK — phù hợp public API, partner nhiều, provider kiểm soát. **Consumer-driven (Pact)**: consumer viết contract (expected request/response), provider verify — phù hợp internal microservice, consumer ít, provider muốn đảm bảo không vỡ consumer cụ thể. Thực tế ngân hàng: **kết hợp** — OpenAPI cho public/partner, Pact cho internal service-to-service. Polyrepo: dùng **Pact Broker** (hoặc Specmatic) làm contract registry, CI gate {{can-i-deploy}} trước khi deploy bất kỳ service nào.
### So sánh hai tư duy
| Tiêu chí | Provider-driven (OpenAPI) | Consumer-driven (Pact) |
|---|---|---|
| **Ai viết contract** | Provider (Arch/API team) | Consumer (team dùng API) |
| **Scope** | Toàn bộ API surface | Chỉ field/consumer cần |
| **Breaking change detection** | CI gate so sánh spec mới vs baseline | Provider CI chạy {{pact verify}} contre consumer contract |
| **Phù hợp** | Public API, partner nhiều, SDK generation | Internal microservice, ít consumer, deploy độc lập |
| **Tooling** | springdoc, oasdiff, openapi-generator | Pact (JVM, JS, Go, .NET), Pact Broker |
| **Versioning** | Spec version (v1, v2) | Consumer version tag (prod, staging) |
### Kết hợp thực tế (Hybrid)
~~~text
Public/Partner API:
  Provider-driven: OpenAPI spec → springdoc → oasdiff CI gate → publish Stoplight/Redocly
  Consumer: generate SDK (TypeScript, Kotlin, Java, Go) từ spec portal

Internal Service-to-Service:
  Consumer-driven: Team A (consumer) viết Pact test → publish Pact Broker tag "prod"
  Provider (Team B): CI {{pact verify}} against "prod" tag trước khi merge/deploy
  Pact Broker: {{can-i-deploy}} check version matrix trước khi release
~~~
### Pact flow chi tiết
1. **Consumer test** (JUnit/Pact JVM):
   ~~~java
   @ExtendWith(PactConsumerTestExt.class)
   class AccountConsumerTest {
       @Pact(consumer = "mobile-bff", provider = "account-svc")
       V4Pact getAccount(PactDslWithProvider builder) {
           return builder
               .given("account 123 exists")
               .uponReceiving("request for account 123")
               .path("/accounts/123")
               .method("GET")
               .willRespondWith()
               .status(200)
               .body(newJsonBody(o -> {
                   o.stringType("id", "123");
                   o.stringType("name", "Nguyen Van A");
                   o.numberType("balance", 5000000);
               }).build())
               .toPact(V4Pact.class);
       }
       @Test
       @PactTestFor(pactMethod = "getAccount")
       void testGetAccount(MockServer mockServer) {
           AccountClient client = new AccountClient(mockServer.getUrl());
           Account acc = client.get("123");
           assertEquals(5000000, acc.getBalance());
       }
   }
   ~~~
2. **Publish**: {{mvn pact:publish}} → Pact Broker, tag {{prod}}/{{staging}} theo branch.
3. **Provider verify** (JUnit/Pact JVM + Spring):
   ~~~java
   @Provider("account-svc")
   @PactBroker(url = "http://pact-broker", tags = "prod")
   class AccountProviderTest {
       @TestTemplate
       @ExtendWith(PactVerificationInvocationContextProvider.class)
       void verify(PactVerificationContext ctx) {
           ctx.verifyInteraction();  // chạy request thật contre controller, so khớp response
       }
       @State("account 123 exists")
       void setup() { testData.setupAccount123(); }
   }
   ~~~
4. **Can-i-deploy**: Trước khi deploy service bất kỳ, chạy {{pact-broker can-i-deploy --pacticipant=account-svc --version=1.2.3 --to=prod}}. Nếu consumer {{mobile-bff}} ở prod có contract chưa verified bởi version này → **chặn deploy**.
### Polyrepo CI/CD
- Mỗi service một repo, một pipeline.
- **Contract repo** (hoặc Pact Broker) là nguồn sự thật chia sẻ.
- Provider CI: {{pact verify}} (chạy provider verify against consumer contracts).
- Consumer CI: {{pact publish}} (chạy consumer test, publish pact).
- **Release gate**: {{pact-broker can-i-deploy}} trong pipeline deploy của **cả consumer và provider**.
- **Webhook**: Pact Broker webhook trigger provider CI khi consumer publish pact mới.
### Xử lý breaking change
- Consumer thêm field mới trong expectation → provider verify pass (provider trả thêm field không sao).
- Consumer đổi type/expectation → provider verify **fail** → CI chặn merge.
- Provider muốn đổi breaking: phải coordinate consumer (tạo pact mới, deploy consumer trước, sau đó provider).
- **Tolerant reader**: Provider trả thêm field, consumer bỏ qua — Pact hỗ trợ {{matchingRules}} (type, min/max, regex) thay vì exact match.
### Ví dụ đời thực
Ngân hàng 30 service, 5 team, polyrepo. Ban đầu chỉ dùng OpenAPI, team A đổi field {{phone}} → {{phoneNumber}} trong account-svc, team B (mobile-bff) không biết, deploy sau 2 ngày → crash runtime. Triển khai Pact: (1) Mỗi consumer team viết Pact test cho field họ dùng. (2) Pact Broker tập trung, tag {{prod}}/{{staging}}. (3) Provider CI chạy {{pact verify}} against {{prod}} tag. (4) Deploy gate {{can-i-deploy}}. (5) Webhook trigger provider CI khi consumer publish pact. Kết quả: 12 tháng 0 breaking change lọt production, team deploy độc lập (account-svc deploy 5 lần/ngày, mobile-bff 2 lần/ngày) mà không coordinate thủ công. Chi phí: 1 Pact Broker cluster, 2 FTE platform, consumer test maintenance (~10% test code).
### Trả lời mẫu khi phỏng viên
"Tôi dùng hybrid: OpenAPI cho public/partner (provider-driven, generate SDK), Pact cho internal service-to-service (consumer-driven, đảm bảo không vỡ consumer cụ thể). Polyrepo: Pact Broker làm registry, consumer publish pact tag {{prod}}, provider verify against {{prod}} trong CI, deploy gate {{can-i-deploy}} chặn nếu contract chưa verified. Breaking change: consumer đổi expectation → provider verify fail ở CI; provider muốn breaking → coordinate consumer tạo pact mới, deploy consumer trước. Tolerant reader: dùng matchingRules (type, regex) thay vì exact value. Bài học: team cũ chỉ OpenAPI, đổi field {{phone}}→{{phoneNumber}} làm crash mobile-bff 2 ngày sau. Pact Broker + can-i-deploy đã khắc phục, deploy độc lập an toàn."
> Senior tip: **Pact không thay thế OpenAPI** — chúng giải quyết bài toán khác. OpenAPI = documentation + SDK generation + public contract. Pact = safety net cho internal deploy độc lập. Đừng viết Pact cho public API (partner không viết Pact test). Và hãy dùng **matchingRules** (type, regex, min/max) thay vì exact value — provider trả thêm field hoặc giá trị khác format nhưng cùng type vẫn pass.`,
    follow: [
      'Pact vs Spring Cloud Contract: khác nhau ở đâu, khi nào chọn cái nào?',
      'Làm sao handle contract evolution khi consumer thêm field bắt buộc (required) mới?'
    ],
    tags: ['Pact', 'Consumer Driven Contract', 'OpenAPI', 'Contract Testing', 'CI/CD', 'Polyrepo', 'Microservices']
  },
  {
    id: 'api-043',
    topic: 'api',
    level: 'senior',
    q: 'GraphQL N+1 problem: DataLoader hoạt động như thế nào, batching và caching per-request, khi nào DataLoader không đủ (nested list, authorization per-field), và giải pháp thay thế (join trong resolver, @defer/@stream, persisted query)?',
    a: `**Tóm tắt:** N+1 xảy ra khi resolver lồng nhau gọi DB lần lượt cho mỗi item cha (1 query lấy 10 user → 10 query lấy address của từng user). **DataLoader** gom các key trong cùng tick event-loop, batch thành một query:
~~~text
WHERE id IN (...)
~~~
, cache kết quả per-request. DataLoader **không giải quyết** được: (1) nested list (user → posts → comments → author), (2) authorization per-field (kiểm tra quyền từng field), (3) field phụ thuộc context động. Giải pháp: join ở resolver, {{@defer}}/{{@stream}} cho field chậm, persisted query + complexity analysis.
### N+1 minh họa
~~~graphql
query {
  users(limit: 10) {
    id
    name
    address { city }   # N+1: 1 query users + 10 query address
  }
}
~~~
Resolver {{address}} chạy 10 lần, mỗi lần {{SELECT * FROM address WHERE user_id = ?}}.
### DataLoader cơ chế
~~~java
// Spring GraphQL DataLoader
@DataLoader
public class AddressDataLoader implements MappedBatchLoader<Long, Address> {
    private final AddressRepository repo;
    
    @Override
    public CompletionStage<Map<Long, Address>> load(Set<Long> userIds) {
        // Gọi 1 lần: SELECT * FROM address WHERE user_id IN (...)
        List<Address> list = repo.findByUserIdIn(userIds);
        Map<Long, Address> map = list.stream()
            .collect(Collectors.toMap(Address::getUserId, a -> a, (a,b) -> a));
        // Key không có data → put null hoặc absent (DataLoader xử lý)
        return CompletableFuture.completedFuture(map);
    }
}
~~~
- **Batching**: Tất cả {{address}} resolver calls trong cùng request context được gom, chờ tick tiếp theo (microtask), batch một lần.
- **Caching per-request**: Map {{userId → Address}} lưu trong {{DataLoaderRegistry}} của request. Gọi lại cùng key trong cùng request → lấy cache, không query DB.
- **Key point**: DataLoader **chỉ cache trong một request** (request-scoped), không cache cross-request (đó là việc của Redis/Caffeine).
### Khi nào DataLoader KHÔNG đủ
| Trường hợp | Vì sao DataLoader fail | Giải pháp |
|---|---|---|
| **Nested list** {{users → posts → comments → author}} | DataLoader batch được 1 level, nhưng {{comments}} là list của list, key không phẳng | Join trong resolver gốc hoặc {{@defer}} tách field chậm |
| **Authorization per-field** | {{email}} chỉ hiện cho admin, {{balance}} chỉ chủ tài khoản — DataLoader batch không biết context từng field | Đưa auth vào resolver, hoặc dùng {{@defer}} cho field nhạy cảm |
| **Field phụ thuộc argument động** | {{transactions(limit: $limit, from: $from)}} — mỗi user args khác nhau, không batch gọn | Tách resolver: batch lấy transaction IDs, rồi fetch chi tiết riêng |
| **Circular reference** | {{user.friends → user.friends.friends}} — DataLoader cache gây deadlock hoặc lặp vô tận | {{maxDepth}} directive, hoặc {{@skip}}/{{@include}} client-side |
### Giải pháp thay thế / bổ sung
1. **Join trong resolver (fetch gốc)**: Resolver {{users}} join sẵn {{address}} (JPA {{@EntityGraph}}, {{@BatchSize}}, hoặc query custom). Trả {{UserWithAddress}} DTO, GraphQL map field. DataLoader chỉ dùng cho quan hệ không join được (service khác, REST call).
2. **{{@defer}} / {{@stream}} (GraphQL spec)**:
   ~~~graphql
   query {
     users(limit: 10) {
       id
       name
       address @defer { city }  # Trả users trước, address stream sau
     }
   }
   ~~~
   Client nhận partial response ngay, field chậm đến sau. Spring GraphQL 1.2+ hỗ trợ {{@defer}} qua {{DeferredResult}}/{{Flux}}.
3. **Persisted Query + Complexity Analysis**: Client đăng ký query hash, server chỉ cho phép query đã đăng ký. Tính complexity (depth, node count, field cost) từ AST — từ chối query > ngưỡng (ví dụ 1000 points). Chặn N+1 ở mức query shape chứ không phải runtime.
4. **Batch loading cho service khác (REST/gRPC)**: DataLoader không chỉ cho DB — dùng cho bất kỳ key→value lookup nào (REST call sang user-service, gRPC call sang limit-service). Key = composite (service, id), batch = gọi batch endpoint của service đó.
### Ví dụ đời thực
Mobile BFF GraphQL query màn hình dashboard: {{users → accounts → transactions → merchant}}. N+1: 10 users → 10 accounts → 100 transactions → 100 merchants = 221 query. p99 2.3s. DataLoader batch {{accounts}}, {{transactions}}, {{merchants}} giảm xuống 4 query (1 users + 1 accounts + 1 transactions + 1 merchants). p99 380ms. Vẫn chậm do {{transactions}} có filter động ({{from}}, {{to}}, {{type}}) mỗi user khác nhau. Giải pháp cuối: resolver {{users}} join {{accounts}}, {{transactions}} dùng batch endpoint {{/transactions/batch?userIds=...}} của transaction-service (gRPC), {{merchants}} batch endpoint của merchant-service. p99 95ms. Complexity analysis chặn query:
~~~graphql
query {
  users(limit: 1000) {
    transactions {
      merchant { ... }
    }
  }
}
~~~
(10.000 points > ngưỡng 1000).
### Trả lời mẫu khi phỏng vấn
"N+1 là bệnh điển hình GraphQL: resolver lồng nhau gọi DB từng item. DataLoader gom key trong cùng tick, batch:
~~~text
WHERE id IN (...)
~~~
, cache per-request. Nhưng DataLoader không xử lý được nested list (list của list), authorization per-field, hay argument động. Tôi dùng mix: join ở resolver gốc cho quan hệ cục bộ, DataLoader cho service-call batch, {{@defer}} cho field chậm/nhạy cảm, persisted query + complexity analysis chặn query shape độc hại ở gateway. Bài học: team cũ chỉ dùng DataLoader, nested list {{posts.comments.author}} vẫn N+1. Thêm join ở resolver gốc + batch endpoint gRPC cho service khác đã giảm p99 từ 2.3s xuống 95ms."
> Senior tip: **Đừng tin DataLoader là Silver bullet**. Hãy đo: bao nhiêu % query bị N+1 sau DataLoader? Nếu > 20%, cần join/batch endpoint. Spring GraphQL: {{@DataLoader}} annotation tự register, {{MappedBatchLoader}} cho map key→value, {{BatchLoader}} cho list. Và luôn có **complexity limit** ở gateway — query độc hại tốn tài nguyên gấp 1000 lần query bình thường.`,
    follow: [
      'Spring GraphQL {{@BatchMapping}} vs {{@DataLoader}} khác nhau như thế nào?',
      'Làm sao implement complexity analysis cho persisted query (AST visitor, cost map)?'
    ],
    tags: ['GraphQL', 'N+1', 'DataLoader', 'Batching', 'Caching', '@defer', 'Persisted Query']
  },
  {
    id: 'api-044',
    topic: 'api',
    level: 'senior',
    q: 'Thiết kế observability cho API ngân hàng: distributed tracing (W3C traceparent), metrics (RED/USE), logging (structured JSON, correlation ID), và alerting. Làm sao correlate trace-log-metric trong một request, và debug production incident từ dashboard đến root cause?',
    a: `**Tóm tắt:** Ba trụ cột: **Trace** (W3C traceparent, OpenTelemetry, Jaeger/Tempo) — xem luồng request xuyên service; **Metrics** (RED: Rate, Errors, Duration; USE: Utilization, Saturation, Errors) — Prometheus + Grafana dashboard; **Log** (structured JSON, {{trace_id}}, {{span_id}}, {{level}}, {{message}}) — Loki/Elasticsearch. Correlation: mọi log line trong request phải có {{trace_id}} và {{span_id}} (MDC), metric có label {{trace_id}} (exemplar). Debug incident: alert → dashboard → trace → log.
### Ba trụ cột chi tiết
| Trụ | Công nghệ | Nội dung quan trọng |
|---|---|---|
| **Trace** | OpenTelemetry Java Agent, Jaeger/Tempo/Zipkin | {{trace_id}}, {{span_id}}, {{parent_span_id}}, service name, operation, duration, status, attributes (http.method, url, status_code, db.statement) |
| **Metrics** | Micrometer + Prometheus, Grafana | **RED**: {{http_server_requests_seconds_count/sum}} (rate, latency p50/p95/p99),
~~~text
http_server_requests_seconds_count{status=~"5.."}
~~~
 (error rate). **USE**: {{tomcat_threads_busy}}, {{hikaricp_connections_active}}, {{jvm_memory_used_bytes}} |
| **Log** | Logback + Logstash encoder, Loki/Elastic | JSON:
~~~json
{"timestamp":..., "level":"INFO", "trace_id":"4bf9...", "span_id":"a1b2...", "logger":"c.b.a.AccountController", "message":"GET /accounts/123", "http.status":200, "duration_ms":45}
~~~
### Correlation: trace_id xuyên suốt
1. **Ingress**: API Gateway / Filter đầu tiên đọc header {{traceparent}} (W3C) hoặc sinh mới. Set vào **MDC** ({{MDC.put("trace_id", traceId)}}).
2. **Propagation**: OpenTelemetry Java Agent tự propagate {{traceparent}}/{{tracestate}} qua HTTP header, gRPC metadata, Kafka header, JMS header. Không cần code thủ công.
3. **Log**: Logback pattern:
~~~text
%X{trace_id} %X{span_id}
~~~
→ mọi line có ID. Structured JSON encoder (LogstashEncoder) xuất field riêng.
4. **Metric exemplar**: Micrometer + OpenTelemetry Exemplar gắn {{trace_id}} vào histogram bucket → từ Grafana p99 click vào exemplar → mở trace Jaeger/Tempo.
5. **Span attribute**: {{@WithSpan}} / {{Span.current().setAttribute("user.id", userId)}} — thêm business context vào trace.
### Debug production incident (runbook)
~~~text
1. ALERT: P99 latency /api/transfers > 2s (Prometheus rule)
2. DASHBOARD: Grafana panel RED cho transfer-svc — thấy error rate 0, latency p99 tăng, throughput bình thường
3. TRACE: Click exemplar (trace_id) từ metric panel → mở Jaeger
   - Trace: API Gateway (5ms) → transfer-svc (1800ms) → ledger-svc (5ms) → DB (1750ms)
   - Span DB: {{db.statement}} = "SELECT * FROM accounts WHERE id = ? FOR UPDATE" — lock contention
4. LOG: Loki query {{trace_id="4bf9..."}} — thấy 50 dòng "Lock wait timeout exceeded" cùng trace
5. ROOT CAUSE: Thiếu index trên {{accounts(version)}} → SELECT FOR UPDATE quét full table → lock hàng chục ngàn row
6. FIX: Thêm index, deploy canary, verify P99 về 50ms
~~~
### Structured logging best practice
- **Không** log PII (số thẻ, CCCD, OTP) — mask: {{card: ****1234}}.
- **Không** log full request/response body (payload lớn, PII) — log size, hash, hoặc sample 1%.
- **Luôn** có {{trace_id}}, {{span_id}}, {{service_name}}, {{environment}}.
- **Level**: ERROR/WARN có stack trace; INFO chỉ business milestone; DEBUG chỉ bật tạm khi debug.
### Metrics naming & labeling
- **Dùng** suffix {{_total}} cho counter, {{_seconds}} cho histogram (Prometheus convention).
- **Label** cardinality thấp: {{service}}, {{endpoint}}, {{method}}, {{status}} (không label {{user_id}}, {{request_id}}).
- **Histogram buckets** tùy chỉnh cho latency ngân hàng: {{[0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]}} (giây).
### Alerting philosophy
- **Alert trên symptom (latency, error rate, saturation)**, không alert trên cause (CPU, memory) — cause thay đổi, symptom không.
- **Multi-window, multi-burn-rate** (Google SRE): alert nếu 5% request lỗi trong 5m VÀ 2% trong 1h.
- **Runbook link** trong annotation alert: {{runbook: https://wiki.bank.vn/runbook/transfer-latency}}.
### Ví dụ đời thực
Ngân hàng 30 service, trước đây log plain text, metric cơ bản, không trace. Sự cố: transfer-svc p99 5s, team debug 2 giờ mới tìm ra ledger-svc deadlock. Triển khai: (1) OpenTelemetry Java Agent tất cả service (0 code change). (2) Logback LogstashEncoder + MDC filter set {{trace_id}}/{{span_id}}. (3) Micrometer + Prometheus + Grafana RED dashboard. (4) Jaeger/Tempo cho trace, Loki cho log. (5) Exemplar gắn {{trace_id}} vào metric. Sự cố sau: alert P99 > 2s → click exemplar → trace thấy DB lock → log xác nhận → thêm index → xong 15 phút. MTTD từ 2h xuống 5m, MTTR từ 4h xuống 30m.
### Trả lời mẫu khi phỏng vấn
"Tôi thiết kế observability theo ba trụ: Trace (OpenTelemetry, W3C traceparent, Jaeger/Tempo), Metrics (Prometheus RED/USE, Grafana), Log (structured JSON, Loki). Correlation quan trọng: Filter đầu tiên set {{trace_id}} vào MDC, OpenTelemetry agent propagate tự động qua HTTP/gRPC/Kafka, logback pattern:
~~~text
%X{trace_id}
~~~
, metric exemplar gắn {{trace_id}} vào histogram. Debug incident: alert → dashboard RED → click exemplar mở trace → trace chỉ service/span chậm → log cùng trace_id xác nhận root cause. Structured log không PII, label cardinality thấp, alert trên symptom (latency/error) không phải cause. Bài học: team cũ log plain text, không trace, debug 2h tìm deadlock. Triển khai correlation trace-log-metric, MTTD 2h→5m, MTTR 4h→30m."
> Senior tip: **OpenTelemetry Java Agent ({{-javaagent:otel-javaagent.jar}})** cho trace/metric auto-instrumentation — 0 code change, upgrade agent là nâng cấp instrumentation. Đừng tự thêm span thủ công khắp nơi. Và hãy đầu tư **runbook** cho mỗi alert: alert không có runbook = noise.`,
    follow: [
      'Làm sao correlate trace qua async boundary (Kafka, @Async, CompletableFuture)?',
      'OpenTelemetry Exemplar: cấu hình Micrometer + Prometheus + Grafana để click exemplar mở trace?'
    ],
    tags: ['Observability', 'Distributed Tracing', 'OpenTelemetry', 'W3C traceparent', 'Metrics', 'Logging', 'Alerting']
  },
  {
    id: 'api-045',
    topic: 'api',
    level: 'lead',
    q: 'mTLS (mutual TLS) cho service-to-service trong Kubernetes: SPIFFE/SPIRE identity, cert rotation, sidecar Envoy vs application-native (Netty), authorization với OPA/Rego, và debug khi handshake fail.',
    a: `**Tóm tắt:** mTLS = cả client và server đều trình chứng chỉ X.509, verify lẫn nhau. Identity = **SPIFFE ID** ({{spiffe://bank.vn/ns/prod/sa/transfer-svc}}). **SPIRE** (SPIFFE Runtime Environment) cấp cert ngắn hạn (24h), auto-rotate, không downtime. Triển khai: **sidecar Envoy** (service mesh Istio/Linkerd/Cilium) hoặc **application-native** (Spring Boot 3 + Netty, gRPC Java). Authorization: OPA/Rego policy đọc {{spiffe_id}} từ cert. Debug: {{openssl s_client}}, {{kubectl exec}} check cert, SPIRE server log.
### Tại sao mTLS thay vì token
| Tiêu chí | mTLS (cert) | OAuth Client Credentials (token) |
|---|---|---|
| **Identity** | Cert = identity (SPIFFE ID) | Token reference → introspection |
| **Rotation** | Auto 24h (SPIRE) | Manual/refresh token |
| **Revocation** | CRL/OCSP (chậm) hoặc short TTL | Real-time (introspection) |
| **Latency** | Handshake 1 lần, session resumption | Mỗi request (hoặc cache token) |
| **Operational** | Cần PKI, SPIRE, cert-manager | Cần Auth Server, Redis |
| **Phù hợp** | High-throughput internal, zero-trust network | Cross-cluster, partner, legacy |
### SPIFFE/SPIRE kiến trúc
~~~text
SPIRE Server (control plane)          SPIRE Agent (node daemon)
      │                                      │
      ├─ CA root cert                        ├─ Workload API (Unix socket)
      ├─ Signing cert (intermediate)         │     │
      │                                      ▼     ▼
      │                                 Envoy    App (native)
      │                                  │        │
      └───────── SVID (X.509-SVID) ──────┘        └─ X.509-SVID + key
            (TTL 24h, auto-rotate 12h trước hết hạn)
~~~
- **SVID** (SPIFFE Verifiable Identity Document) = cert + key + SPIFFE ID ({{spiffe://bank.vn/ns/prod/sa/transfer-svc}}).
- Agent attest workload (K8s SA, pod label) → Server sign SVID → Agent cấp cho workload qua Workload API.
- Rotation: TTL 24h, agent renew trước 12h, **không restart pod**, workload reload cert từ Workload API.
### Triển khai hai cách
**1. Sidecar Envoy (Service Mesh - Istio/Linkerd/Cilium):**
- Envoy terminate mTLS, app nói HTTP/gRPC plaintext với localhost.
- Lợi: 0 code change, mesh quản lý cert, policy L7 (rate limit, retry), telemetry tự động.
- Hại: Resource overhead (Envoy ~50-100MB RAM/pod), complexity (Istio control plane), debug khó (cert trong Envoy).
**2. Application-native (Spring Boot 3 + Netty / gRPC Java):**
~~~yaml
# application.yml (Spring Boot 3.2+ Netty SSL)
server:
  ssl:
    enabled: true
    key-store: file:\${SPIFFE_SVID_PATH}/svid.pem
    key-store-password: ""
    key-store-type: PEM
    trust-store: file:\${SPIFFE_BUNDLE_PATH}/bundle.pem
    trust-store-type: PEM
    client-auth: need  # mTLS: yêu cầu client cert
~~~
- gRPC Java: {{NettyChannelBuilder.forAddress(...).sslContext(GrpcSslContexts.forClient().trustManager(bundle).keyManager(svid).build())}}
- Lợi: Không sidecar, kiểm soát code, debug dễ (cert trong app), latency thấp hơn.
- Hại: Tự reload cert (watch file/SPIFFE Workload API), tự implement health check cert expiry.
### Authorization với OPA/Rego
- Sidecar: Envoy ext_authz gọi OPA, OPA đọc {{x-spiffe-id}} header (Envoy set từ cert).
- Native: Spring {{WebFilter}} / gRPC {{Metadata}} đọc {{X-Forwarded-Client-Cert}} hoặc custom header từ reverse proxy, gửi OPA.
~~~rego
package bank.authz

default allow = false

allow {
  input.method == "POST"
  input.path == "/api/v1/transfers"
  input.spiffe_id == "spiffe://bank.vn/ns/prod/sa/account-svc"
  input.claims.roles contains "transfer.initiate"
}
~~~
### Cert rotation zero-downtime
- SPIRE Agent renew SVID trước 12h, ghi file mới ({{svid.pem.new}} → atomic rename {{svid.pem}}).
- Workload **phải reload** cert/key mới: Spring Boot 3.2+ Netty hỗ trợ {{SslBundles}} reload qua {{SslBundleRegistry}}; gRPC Java {{SslContextBuilder}} không reload động → cần tái tạo channel hoặc dùng {{FileBasedSslContext}} watch file.
- Health check: endpoint {{/actuator/health}} kiểm tra {{svid.pem}} expiry > 1h.
### Debug handshake fail
| Lỗi | Nguyên nhân | Cách xác minh |
|---|---|---|
| {{certificate verify failed}} | Trust bundle thiếu CA root | {{openssl s_client -connect svc:port -CAfile bundle.pem -cert svid.pem -key key.pem}} |
| {{certificate expired}} | SVID hết hạn, agent không renew | {{kubectl exec pod -- cat /spiffe/svid.pem | openssl x509 -noout -dates}} |
| {{SPIFFE ID mismatch}} | Workload attest sai (pod label, SA) | {{spire-server entry show -spiffeID spiffe://...}} |
| {{no shared cipher}} | TLS version/cipher không khớp | {{openssl s_client -connect ... -tls1_2 -cipher 'ECDHE+AESGCM'}} |
| {{handshake timeout}} | Network policy chặn port, mTLS port sai | {{kubectl exec netshoot -- nc -zv svc.port}} |
### Ví dụ đời thực
Ngân hàng 30 service trên K8s, ban đầu dùng OAuth Client Credentials cho service-to-service. Vấn đề: (1) Auth Server thành SPOF, (2) token introspection thêm 2ms latency, (3) token leak khi pod bị compromise. Triển khai mTLS với SPIRE + sidecar Envoy (Istio ambient mode, không sidecar full): (1) SPIRE Server 3 replica, Agent DaemonSet. (2) Istio ambient: ztunnel (node daemon) terminate mTLS, waypoint proxy cho L7 policy. (3) OPA Gatekeeper policy đọc {{spiffe_id}} từ cert. (4) Cert rotation 24h TTL, auto-renew 12h trước. Kết quả: 0 dependency Auth Server cho internal call, latency intra-service giảm 2ms, zero-trust network thực sự. Sự cố một lần: cert expiry monitor thiếu → 3 service hết hạn SVID cùng lúc, handshake fail. Thêm health check expiry > 1h + alert, không tái diễn.
### Trả lời mẫu khi phỏng vấn
"mTLS dùng SPIFFE/SPIRE: identity = SPIFFE ID ({{spiffe://bank.vn/ns/prod/sa/transfer-svc}}), SPIRE cấp X.509-SVID 24h TTL, auto-rotate. Triển khai hai cách: sidecar Envoy (Istio/Linkerd/Cilium) — 0 code change, mesh quản lý; hoặc application-native (Spring Boot 3 Netty, gRPC Java) — kiểm soát code, debug dễ. Authorization: OPA/Rego đọc {{spiffe_id}} từ cert. Rotation zero-downtime: agent renew trước 12h, workload reload cert (Spring {{SslBundleRegistry}}, gRPC watch file). Debug: {{openssl s_client}} với bundle, check expiry, SPIFFE ID mismatch. Bài học: team cũ dùng OAuth token cho internal, Auth Server down làm toàn bộ internal call fail. mTLS + SPIRE loại bỏ SPOF, latency giảm 2ms, nhưng phải invest PKI, SPIRE, cert rotation monitoring."
> Senior tip: **Istio ambient mode (ztunnel + waypoint)** là sweet spot 2024: không sidecar full (tiết kiệm 50% RAM), vẫn có mTLS + L7 policy. Nếu team nhỏ, không muốn vận hành Istio: **Cilium** (eBPF-based) hoặc **Linkerd** (nhẹ, đơn giản) hoặc **application-native** với Spring Boot 3 Netty + SPIRE Workload API client. Đừng tự implement cert rotation — dùng SPIRE agent.`,
    follow: [
      'SPIFFE trust domain federation: hai cluster K8S khác trust domain làm sao mTLS cho nhau?',
      'Spring Boot 3 Netty {{SslBundles}} reload cert động như thế nào không restart?'
    ],
    tags: ['mTLS', 'SPIFFE', 'SPIRE', 'Service Mesh', 'Zero Trust', 'Cert Rotation', 'OPA', 'Authorization']
  },
  {
    id: 'api-046',
    topic: 'api',
    level: 'senior',
    q: 'Chiến lược test API cho ngân hàng: contract test (OpenAPI/Pact), integration test (Testcontainers), load test (k6/Gatling), chaos test (Litmus/Chaos Mesh), và canary analysis (Kayenta/Flagger). Làm sao gom thành pipeline "deploy với niềm tin"?',
    a: `**Tóm tắt:** Không có một loại test nào đủ. Pipeline tin cậy: **Contract test** (PR gate) → **Integration test** (Testcontainers, PR/nightly) → **Load test** (nightly/release branch) → **Chaos test** (staging, scheduled) → **Canary analysis** (production deploy). Mỗi tầng bắt loại lỗi khác nhau, cùng gom vào "quality gate" trước khi traffic production.
### Ma trận test
| Loại | Bắt lỗi gì | Khi nào chạy | Tool | Thời gian |
|---|---|---|---|---|
| **Contract (OpenAPI)** | Breaking change spec, response không khớp spec | Mỗi PR (provider) | springdoc + oasdiff / Pact + can-i-deploy | < 2 min |
| **Contract (Pact)** | Provider vỡ consumer cụ thể | Mỗi PR (provider) | Pact JVM + Pact Broker | < 3 min |
| **Integration** | Logic sai, DB schema, transaction, external mock | Mỗi PR + nightly | Testcontainers (PostgreSQL, Kafka, LocalStack), WireMock | 5-15 min |
| **Load (k6/Gatling)** | P99 latency, throughput, resource saturation, memory leak | Nightly + release branch | k6 (JS/TS), Gatling (Scala) | 30-60 min |
| **Chaos (Litmus)** | Pod kill, network partition, latency injection, disk full | Staging, scheduled (tuần) | LitmusChaos, Chaos Mesh | 15-30 min |
| **Canary (Kayenta/Flagger)** | Regression production (error rate, latency, business metric) | Mỗi deploy production | Flagger (progressive delivery), Kayenta (automated analysis) | 10-30 min |
### Contract test chi tiết
**OpenAPI (provider-driven)**: {{springdoc}} generate spec từ code → {{oasdiff}} so sánh với baseline (git tag) → fail nếu breaking change (xóa field, đổi type, thêm required). Chạy trong PR provider.
**Pact (consumer-driven)**: Consumer viết test định nghĩa expectation → publish Pact Broker tag {{prod}} → Provider CI {{pact verify}} against {{prod}} tag → fail nếu response không khớp expectation. {{pact-broker can-i-deploy}} gate trước deploy.
### Integration test với Testcontainers
~~~java
@SpringBootTest
@Testcontainers
class TransferIntegrationTest {
    @Container static PostgreSQLContainer<?> pg = new PostgreSQLContainer<>("postgres:16")
        .withDatabaseName("bank")
        .withUsername("test")
        .withPassword("test");
    
    @Container static KafkaContainer kafka = new KafkaContainer("confluentinc/cp-kafka:7.6.0");
    
    @DynamicPropertySource
    static void props(DynamicPropertyRegistry r) {
        r.add("spring.datasource.url", pg::getJdbcUrl);
        r.add("spring.kafka.bootstrap-servers", kafka::getBootstrapServers);
    }
    
    @Test
    void transfer_idempotent() {
        // Given: account A 10tr, B 0
        // When: POST /transfers idempotency-key=k1 (gửi 2 lần)
        // Then: chỉ trừ 1 lần, balance A=5tr, B=5tr
    }
}
~~~
- **Testcontainers** khởi container thật (PostgreSQL, Kafka, Redis, LocalStack AWS) — không mock, confidence cao.
- **WireMock** cho external dependency (PSP, core banking) — record/playback, fault injection.
- Chạy trong PR (fast subset) và nightly (full suite).
### Load test với k6
~~~javascript
// k6 script: transfer-load.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '2m', target: 100 },   // ramp up
    { duration: '10m', target: 500 },  // sustained
    { duration: '2m', target: 1000 },  // stress
    { duration: '5m', target: 0 },     // ramp down
  ],
  thresholds: {
    'http_req_duration{p99}': ['p(99)<500'],      // p99 < 500ms
    'http_req_failed': ['rate<0.01'],             // error rate < 1%
    'errors': ['rate<0.05'],                      // business error < 5%
  },
};

export default function () {
  const payload = JSON.stringify({ from: 'A', to: 'B', amount: 100000, idempotencyKey: 'k1-' + __VU + '-' + __ITER });
  const params = { headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + __ENV.TOKEN } };
  const res = http.post('https://staging-api.bank.vn/api/transfers', payload, params);
  const ok = check(res, { 'status 201': (r) => r.status === 201 });
  errorRate.add(!ok);
  sleep(Math.random() * 2);
}
~~~
- Chạy nightly trên staging, so sánh với baseline (p99, error rate, throughput).
- **Smoke test** (1-2 VU, 30s) trong PR gate cho critical path.
### Chaos test (Litmus/Chaos Mesh)
~~~yaml
# litmus-pod-kill.yaml
apiVersion: litmuschaos.io/v1alpha1
kind: ChaosEngine
metadata:
  name: transfer-svc-pod-kill
spec:
  appinfo:
    appns: banking
    applabel: "app=transfer-svc"
  chaosServiceAccount: litmus-admin
  experiments:
    - name: pod-delete
      spec:
        components:
          env:
            - name: TOTAL_CHAOS_DURATION
              value: '60'
            - name: CHAOS_INTERVAL
              value: '10'
            - name: FORCE
              value: 'false'
~~~
- **Pod kill**: K8s reschedule, kiểm tra readiness/liveness probe, graceful shutdown.
- **Network partition**: {{tc}} netem inject latency 500ms, packet loss 1% giữa service.
- **CPU/Memory stress**: {{stress-ng}} trong container, kiểm tra HPA scale, circuit breaker.
- **Disk full**: {{dd if=/dev/zero of=/tmp/fill bs=1M count=90%}}, kiểm tra log rotation, alert.
- Chạy tuần một lần trên staging, có runbook rollback.
### Canary analysis (Flagger + Kayenta)
~~~yaml
# Flagger Canary resource
apiVersion: flagger.app/v1beta1
kind: Canary
metadata:
  name: transfer-svc
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: transfer-svc
  progressDeadlineSeconds: 600
  service:
    port: 8080
    targetPort: 8080
    portName: http
  analysis:
    interval: 1m
    threshold: 5
    maxWeight: 50
    stepWeight: 10
    metrics:
      - name: request-success-rate
        thresholdRange:
          min: 99
        interval: 1m
      - name: request-duration-p99
        thresholdRange:
          max: 500
        interval: 1m
      - name: business-error-rate
        thresholdRange:
          max: 1
        interval: 1m
    webhooks:
      - name: kayenta-analysis
        url: http://kayenta/canary
        metadata:
          account: staging
          judge: netflix
~~~
- Flagger: progressive delivery (10% → 20% → ... → 100%), rollback tự động nếu metric vượt ngưỡng.
- Kayenta: statistical analysis (Mann-Whitney U test) so sánh canary vs baseline — phát hiện regression tinh vi (p99 tăng 50ms mà threshold 500ms vẫn pass).
### Pipeline "Deploy với niềm tin"
~~~text
PR opened
  │
  ├─ Unit test (parallel)          < 2 min
  ├─ Contract test (OpenAPI/Pact)  < 3 min
  ├─ Integration test (Testcontainers subset)  < 10 min
  ├─ Build & Scan (SAST, SCA, container scan)  < 5 min
  │
  └─ PR Gate: ALL PASS → merge
       │
       ▼
Nightly (main branch)
  │
  ├─ Full integration test       < 30 min
  ├─ Load test (k6)              < 60 min
  ├─ Security scan (DAST)        < 30 min
  │
  └─ Nightly Gate: PASS → tag release candidate
       │
       ▼
Release branch
  │
  ├─ Full test suite             < 45 min
  ├─ Load test (extended)        < 90 min
  ├─ Chaos test (staging)        < 30 min
  │
  └─ Release Gate: PASS → promote to production
       │
       ▼
Production Deploy (Flagger Canary)
  │
  ├─ 10% traffic → metrics check (1m interval)
  ├─ 20% → check
  ├─ ...
  ├─ 100% → Kayenta statistical analysis
  │
  └─ PASS → full traffic, FAIL → auto rollback
~~~
### Ví dụ đời thực
Ngân hàng 30 service, deploy 20 lần/ngày. Ban chỉ có unit test, deploy thủ công. Sự cố: team A đổi validation {{phone}} → {{phoneNumber}}, team B mobile-bff crash runtime (không có contract test). Triển khai pipeline: (1) PR gate: unit + contract (OpenAPI oasdiff + Pact can-i-deploy) + integration subset (Testcontainers). (2) Nightly: full integration + load test k6 (p99 < 500ms, error < 1%). (3) Staging tuần: chaos test (pod kill, network latency). (4) Production: Flagger canary 10%→100% 30 phút, Kayenta analysis. Kết quả: 6 tháng 0 regression production, MTTD từ 30p xuống 2p (canary detect), deploy frequency 20→50 lần/ngày. Chi phí: 1 platform team 4 người, CI runner GPU cho k6, staging cluster 30% production size.
### Trả lời mẫu khi phỏng vấn
"Tôi xây dựng pipeline đa tầng: PR gate (unit + contract OpenAPI/Pact + integration Testcontainers subset) → Nightly (full integration + load test k6 + security) → Staging tuần (chaos Litmus: pod kill, network partition) → Production (Flagger canary 10%→100% + Kayenta statistical analysis). Contract test bắt breaking change spec (oasdiff) và consumer-specific (Pact can-i-deploy). Integration test dùng Testcontainers container thật (PostgreSQL, Kafka) không mock. Load test k6 chạy nightly trên staging, threshold p99/error rate. Chaos test tuần kiểm tra resilience. Canary Flagger + Kayenta detect regression tinh vi trước khi full traffic. Bài học: team cũ chỉ unit test, deploy thủ công, breaking change lọt production. Pipeline đa tầng + quality gate tự động đã giảm regression production về 0, deploy frequency từ 20 lên 50 lần/ngày."
> Senior tip: **Đừng chạy full test suite trong PR** — chậm, developer chán, bypass gate. Chia: PR gate = fast subset (<10 min), Nightly = full. Và hãy đầu tư **test data management**: Testcontainers + Flyway migration + snapshot restore (PostgreSQL {{pg_dump}}/{{pg_restore}} hoặc ZFS snapshot) để integration test không bị flaky do data bẩn.`,
    follow: [
      'Làm sao manage test data cho Testcontainers (Flyway, snapshot, parallel test isolation)?',
      'k6 vs Gatling: khi nào chọn cái nào cho team Java?'
    ],
    tags: ['Testing', 'Contract Test', 'Pact', 'OpenAPI', 'Testcontainers', 'Load Test', 'k6', 'Chaos Test', 'Canary', 'Flagger', 'Kayenta', 'CI/CD']
  },
{
  id: 'api-047',
  topic: 'api',
  level: 'mid',
  q: 'Một client có thể tự tạo ID cho tài nguyên trước khi gửi request. Bạn chọn PUT vào URI đã biết hay POST vào collection, và dùng status code nào để phân biệt tạo mới, gửi lặp và xung đột?',
  a: `**Tóm tắt:** Nếu client biết trước URI của tài nguyên và việc đặt trạng thái tại URI đó có ngữ nghĩa rõ ràng, {{PUT /resources/id}} phù hợp: request tạo mới thường trả 201, lần gửi lại trả trạng thái hiện tại mà không nhân đôi hiệu ứng. {{POST /resources}} phù hợp hơn khi server chọn ID hoặc mỗi lần gọi là một lệnh tạo mới; không thể chỉ dựa vào status code để chống gửi lặp nếu POST chưa có cơ chế idempotency.

### Chọn danh tính trước khi chọn method
**Resource (tài nguyên)** là một thứ API có thể định danh và đọc lại, như một yêu cầu thanh toán. Hỏi trước: ai quyết định ID?
- Server quyết định ID sau khi nhận lệnh: thường dùng POST lên collection.
- Client đã có ID ổn định cho cùng một ý định: PUT lên URI cụ thể có thể diễn đạt “hãy để tài nguyên ở URI này có trạng thái như body”.

Ví dụ client tạo UUID khi người dùng bắt đầu lập yêu cầu chuyển tiền. Nó phải giữ nguyên UUID nếu gửi lại cùng ý định sau timeout; tạo UUID mới cho mỗi lần retry sẽ phá tính idempotent.

~~~http
PUT /api/transfer-requests/8d21
If-None-Match: *
Content-Type: application/json

{"from":"A12","to":"B34","amount":250000}
~~~

{{If-None-Match: *}} nghĩa là chỉ thực hiện nếu resource chưa tồn tại. Nếu tạo thành công, trả {{201 Created}} và {{Location}}. Nếu client retry nguyên request có điều kiện sau khi response bị mất, server trả {{412 Precondition Failed}} vì URI đã tồn tại; client GET resource và so sánh với ý định ban đầu để xác nhận lần tạo trước thành công. Nếu cần replay nguyên response, lưu kết quả theo operation ID. Nếu không dùng precondition, PUT lặp cùng body vẫn phải giữ cùng trạng thái cuối và không được tạo side effect mới mỗi lần gọi.

### PUT không tự động làm nghiệp vụ an toàn
Idempotent là cùng request lặp lại có cùng hiệu ứng cuối trên server. Nó không có nghĩa mọi thứ phụ trợ chỉ chạy một lần: gửi email, phát event hoặc gọi cổng thanh toán thêm lần nữa vẫn là tác dụng phụ trùng.
- Tạo **bản mô tả yêu cầu** ở URI cố định có thể là PUT idempotent.
- Thực thi giao dịch tiền là một command có hiệu ứng không đảo ngược; cần trạng thái chuyển tiếp rõ ràng và khóa duy nhất theo ID ý định để chỉ một worker được thực hiện.
- Nếu cùng URI nhưng body khác, không âm thầm coi như retry. Trả lỗi xung đột theo contract (thường 409) hoặc yêu cầu client đọc tài nguyên hiện có; không thay dữ liệu của một giao dịch đã chạy.

### Bảng chọn nhanh
| Tình huống | Cách gọi thường hợp lý | Ý nghĩa thành công |
|---|---|---|
| Server cấp ID cho mỗi lần tạo mới | POST collection | 201 + Location mới |
| Client có ID ổn định, muốn tạo trạng thái tại URI đó | PUT item | 201 nếu mới; 200/204 nếu đã tồn tại và được thay thế |
| Chỉ được tạo nếu chưa có | PUT + If-None-Match: * | 201 hoặc 412 |
| Thực hiện command tài chính | POST command + khóa idempotency | Replay kết quả đã lưu khi cùng ý định retry |

### Pitfall production
- Không dùng PUT cho “cộng 250.000 vào số dư”: request lặp vẫn cộng hai lần; PUT phải đặt một representation/trạng thái, không phải lặp delta.
- Không giả định client giữ ID đúng: scope ID theo tenant/người dùng và kiểm tra quyền trên tài nguyên, nếu không có thể lộ hoặc ghi đè tài nguyên khác.
- Không trả 201 ở mọi lần PUT retry nếu contract cần phân biệt tạo mới với tài nguyên đã có; 201 nghĩa là resource được tạo trong lần xử lý đó.
- Race giữa hai lần tạo phải được quyết định bằng unique constraint hoặc kiểm tra nguyên tử trong DB; “SELECT rồi INSERT” có thể để cả hai request cùng thấy chưa tồn tại.

### Ví dụ đời thực
Một ứng dụng di động tạo yêu cầu upload sao kê, nhưng mạng thường ngắt sau khi server đã ghi nhận. Trước đây server luôn nhận POST và tự sinh ID, nên app retry sau timeout tạo hai yêu cầu, hai lần quét tệp và hai khoản phí xử lý. Nhóm chuyển sang client tạo UUID một lần cho mỗi lần upload, PUT vào URI chứa UUID, đặt unique key theo (customer_id, request_id), và chỉ enqueue xử lý khi insert đầu tiên thành công. Retry cùng body nhận 412 do precondition rồi GET để xác nhận resource đã tạo; cùng ID nhưng body khác bị từ chối. Trong thử tải 10.000 request lặp, DB chỉ có một yêu cầu cho mỗi ID và queue không phát sinh job trùng.

### Trả lời mẫu khi phỏng vấn
“Em chọn method theo danh tính và ngữ nghĩa, không theo việc endpoint trông giống CRUD. Nếu server chọn ID và mỗi request là một lần tạo độc lập, em dùng POST lên collection và trả 201 cùng Location; muốn retry an toàn thì POST phải có idempotency key. Nếu client đã có ID ổn định và muốn tạo tài nguyên tại URI đó, PUT phù hợp hơn. Em có thể thêm If-None-Match: * để chỉ tạo khi chưa tồn tại; tạo mới trả 201, còn điều kiện sai trả 412. Nhưng với giao dịch tiền, PUT không tự biến side effect thành an toàn: em lưu ý định và trạng thái bằng khóa duy nhất, chỉ một lần chuyển trạng thái mới được gọi hệ thống thanh toán. Cùng ID nhưng body khác không được âm thầm ghi đè; API phải trả xung đột theo contract. Cuối cùng, race được xử lý bằng ràng buộc duy nhất ở DB, không phải bằng kiểm tra tồn tại trước rồi mới insert.”

> Senior tip: Hãy tách “tạo yêu cầu” khỏi “thực thi giao dịch” nếu thao tác có side effect. ID ổn định giúp retry tạo resource, còn một transition nguyên tử và idempotency ở hệ thống thanh toán mới bảo vệ tiền.`,
  follow: [
    'PUT trả 201 ở lần đầu và 200 ở lần retry có làm mất tính idempotent không? Vì sao?',
    'Nếu hai request PUT cùng URI nhưng body khác đến đồng thời, hệ thống cần đảm bảo điều gì?',
    'Khi nào If-None-Match: * hữu ích hơn idempotency key trong POST?'
  ],
  tags: ['REST', 'PUT', 'POST', 'HTTP Status', 'Idempotency']
},
{
  id: 'api-048',
  topic: 'api',
  level: 'senior',
  q: 'Một workflow xét duyệt khoản vay có hành động khác nhau theo trạng thái và quyền của từng người dùng. HATEOAS link nên thể hiện điều gì, và làm sao tránh biến link thành lời hứa bảo mật hoặc hợp đồng khó nâng cấp?',
  a: `**Tóm tắt:** HATEOAS (Hypermedia as the Engine of Application State) là cách response trả các link/affordance mô tả bước tiếp theo mà client có thể khám phá. Trong workflow, link như {{submit}} hay {{approve}} có thể giúp UI biết hành động phù hợp với trạng thái hiện tại; nhưng link chỉ là gợi ý điều hướng, không thay thế authorization ở server, và không nên chứa quyền hạn như một bí mật.

### Từ dữ liệu sang affordance
**Affordance** là một hành động khả dụng được biểu diễn cùng representation, ví dụ link đến thao tác “nộp hồ sơ”. Nếu khoản vay đang ở {{DRAFT}}, response có thể có link submit; sau khi nộp, link đó mất và có link xem trạng thái. Client theo link thay vì tự ghép URL hoặc đoán transition.

~~~json
{
  "id": "loan-82",
  "status": "DRAFT",
  "_links": {
    "self": {"href": "/loans/loan-82"},
    "submit": {"href": "/loans/loan-82/submissions", "method": "POST"}
  }
}
~~~

Server tạo representation sau khi biết trạng thái workflow và principal (người gọi đã xác thực). Vì vậy hai người dùng có thể nhận cùng thông tin khoản vay nhưng danh sách hành động khác nhau. Mỗi request action vẫn phải kiểm tra lại quyền và trạng thái trong transaction: client có thể giữ response cũ, sửa URL, hoặc gửi lại request sau khi quyền đã bị thu hồi.

### Link không phải cơ chế bảo mật
- Ẩn link approve khỏi người không có quyền làm UI dễ dùng, nhưng API vẫn phải trả 403 hoặc che tài nguyên theo chính sách khi họ gọi trực tiếp.
- Link không nên là capability chứa token bí mật; URL thường xuất hiện trong log, lịch sử trình duyệt và hệ thống quan sát.
- Thao tác ghi có thể dùng action resource hoặc link có method/media type, nhưng method, body và lỗi vẫn cần được mô tả trong OpenAPI để client/tooling biết cách gọi.

### Trade-off khi triển khai
| Cách | Điểm mạnh | Chi phí / giới hạn |
|---|---|---|
| URL cố định + OpenAPI/SDK | Dễ codegen, cache, test, phổ biến | Client thường giữ logic trạng thái |
| Link động theo state | Server dẫn đường theo workflow | Client cần hiểu format/link relation; test và cache phức tạp |
| Kết hợp | Dùng link cho điều hướng, OpenAPI cho schema/action | Cần giữ quan hệ link ổn định |

Đừng đổi relation {{approve}} thành tên riêng theo từng phiên bản mà không có kế hoạch tương thích. Coi rel (tên quan hệ của link) là một phần hợp đồng; có thể bổ sung rel mới, giữ cũ trong thời gian chuyển đổi, và đo client còn dùng relation cũ.

### Pitfall production
- Link tồn tại rồi client tưởng thao tác chắc chắn thành công; giữa lúc GET và POST trạng thái có thể đổi. Server phải validate transition nguyên tử và trả 409 nếu workflow không còn cho phép.
- Cache representation theo URL nhưng quên quyền người dùng; response của reviewer có link approve bị cache và đưa cho người xem khác. Không dùng cache công khai cho dữ liệu cá nhân hoặc representation thay đổi theo quyền.
- Gắn toàn bộ schema request vào link khiến client không biết validation, code generation và tài liệu khó dùng; link discovery không thay thế contract.
- Trả quá nhiều link cho từng hàng trong collection làm payload phình và tạo nhiều logic link không được client sử dụng.

### Ví dụ đời thực
Portal khoản vay có 120.000 hồ sơ đang xử lý. Trước đó web client tự suy luận “DRAFT thì hiện Submit, PENDING thì hiện Approve”; sau khi workflow thêm trạng thái NEEDS_DOCUMENT, 3 phiên bản UI xử lý không đồng nhất, trong 2 tuần có 420 lần người dùng bấm hành động không hợp lệ. Nhóm trả affordance theo trạng thái và role, UI chỉ render hành động được cung cấp; API vẫn kiểm tra quyền và version khi POST. Hợp đồng OpenAPI mô tả các endpoint và schema, còn link relation được giữ ổn định. Lỗi 409 được hiển thị như “hồ sơ đã thay đổi, tải lại”; số request sai transition giảm 93%, nhưng quyền truy cập vẫn được kiểm thử ở server.

### Trả lời mẫu khi phỏng vấn
“Với workflow nhiều trạng thái, HATEOAS có giá trị khi server muốn hướng dẫn client về hành động kế tiếp mà không buộc client tự nhân bản toàn bộ state machine. Ví dụ hồ sơ DRAFT có link submit; sau khi chuyển sang PENDING, response chỉ đưa link hợp lệ cho reviewer. Tuy nhiên link chỉ là affordance, không phải quyền: client có thể giữ response cũ hoặc gọi URL trực tiếp, nên server luôn authorize và kiểm tra transition trong transaction, trả 409 nếu trạng thái đã đổi. Em cũng chú ý cache vì representation có thể khác theo role; không được chia sẻ response có link nhạy cảm qua cache công khai. Với tích hợp đối tác, OpenAPI vẫn cần mô tả endpoint, schema và lỗi để sinh client; HATEOAS bổ sung điều hướng chứ không thay thế contract. Em chỉ triển khai khi client thực sự hưởng lợi từ link động, rồi đo mức sử dụng từng relation trước khi duy trì.”

> Senior tip: Phân biệt “UI có nên hiện nút” với “server có cho phép hành động”. Link động giải quyết phần đầu; authorization và kiểm tra state/version ở server mới bảo vệ phần sau.`,
  follow: [
    'Representation có link khác nhau theo role thì cache HTTP cần được cấu hình thế nào?',
    'Làm sao xử lý client POST một affordance được lấy từ response đã cũ?',
    'OpenAPI và HATEOAS bổ sung cho nhau như thế nào thay vì chọn một trong hai?'
  ],
  tags: ['HATEOAS', 'REST', 'Workflow', 'Authorization', 'Caching']
},
{
  id: 'api-049',
  topic: 'api',
  level: 'senior',
  q: 'API tìm giao dịch cho phép lọc, sort và phân trang tùy ý. Làm thế nào thiết kế query parameter dễ dùng nhưng không cho client tạo SQL nguy hiểm hoặc truy vấn làm quá tải database?',
  a: `**Tóm tắt:** Filter, sort và pagination nên có cú pháp nhỏ, được validate và ánh xạ qua allowlist (danh sách field/operator cho phép), không nối trực tiếp tên cột từ query string vào SQL. Giới hạn số điều kiện, kích thước trang và khoảng thời gian; đặt thứ tự sort xác định có tie-breaker. Cursor giúp đi tiếp trên tập đã sắp xếp, nhưng không thay thế kiểm soát chi phí truy vấn.

### Từ URL đến câu SQL an toàn
Client có thể gọi:
~~~http
GET /transactions?status=SETTLED&from=2026-10-01&to=2026-10-31&sort=-createdAt,id&limit=50
~~~

Server không nên xây SQL kiểu {{ORDER BY }} + chuỗi sort tùy ý. Giá trị bind parameter bảo vệ **giá trị** (ví dụ ngày, status), nhưng tên cột SQL không phải value parameter; tên field phải tra trong allowlist:
~~~java
Map<String, String> columns = Map.of(
    "createdAt", "created_at",
    "amount", "amount",
    "id", "id");
String column = columns.get(requestedField);
if (column == null) throw new BadRequestException("sort field is not supported");
// Direction cũng chỉ nhận ASC hoặc DESC; values vẫn bind parameter.
~~~
Đây là minh họa ánh xạ, không phải bộ query hoàn chỉnh. Trong Spring, bind các giá trị qua repository/Criteria thay vì ghép chúng vào SQL.

### Cú pháp API nên giới hạn
- Chọn một quy ước: ví dụ {{status=SETTLED}}, {{from}}, {{to}}, {{sort=-createdAt,id}}, {{limit}}. Tránh nhiều cú pháp tương đương.
- Cho phép các operator cụ thể; không để client gửi tên property lồng nhau tùy ý.
- Validate khoảng ngày ({{from <= to}}), timezone và giá trị enum; trả 400/Problem Details có tên parameter sai.
- Mặc định thứ tự ổn định: {{created_at DESC, id DESC}}. Nếu chỉ sort timestamp, hai dòng cùng timestamp có thể bị lặp/mất giữa trang.
- Giới hạn {{limit}} (ví dụ tối đa 100) và khoảng thời gian tối đa phù hợp nghiệp vụ. Client cần export hàng năm nên dùng job/export API thay vì giữ query tương tác không giới hạn.

### Filter có thể đúng nhưng vẫn tốn kém
Index cần khớp điều kiện thường dùng. Với truy vấn theo account và thời gian, index bắt đầu bằng account_id rồi created_at có thể hữu ích; một truy vấn tùy tiện trên JSON field hoặc nhiều wildcard không có index có thể quét bảng lớn. Không tạo index cho mọi bộ lọc tưởng tượng: mỗi index tiêu tốn storage và làm ghi chậm hơn.

| Quyết định | Lợi ích | Đánh đổi |
|---|---|---|
| Allowlist filter/sort | Chi phí và hành vi dự đoán được | Cần version hóa khi thêm field |
| Giới hạn page size / date range | Chặn truy vấn quá lớn | Client phải chia nhỏ |
| Cursor + sort bất biến | Trang sâu ổn định | Không nhảy tùy ý đến trang số N |
| Total count | UI biết tổng số | COUNT có thể đắt trên tập lớn |

### Pitfall production
- Field hợp lệ ở API nhưng không có index gây full scan; theo dõi query plan và p95/p99 theo filter shape, không chỉ latency chung.
- Sort theo cột thay đổi được làm bản ghi “nhảy” qua cursor khi cập nhật; ưu tiên sort theo khóa bất biến hoặc chấp nhận snapshot/export riêng.
- Cho client sort theo mọi cột rồi tạo index từng cột sẽ tăng write amplification (chi phí ghi thêm do cập nhật index).
- Trả lỗi 500 khi query string sai khiến client không biết sửa; invalid field/operator phải là 4xx.

### Ví dụ đời thực
API lịch sử giao dịch nhận 700 request/giây. Một client gửi {{sort=description}} trên cột text không có index cùng {{limit=5000}}; database CPU tăng từ 42% lên 94%, p99 tăng từ 180ms lên 4,6 giây. Nhóm giới hạn trang tối đa 100, chỉ cho sort {{createdAt}} và {{amount}}, giới hạn khoảng ngày 90 ngày cho truy vấn tương tác, đồng thời thêm index cho account_id/created_at. Truy vấn sort không hợp lệ nhận 400 thay vì chạy scan. Sau triển khai, p99 giảm còn 210ms, CPU đỉnh còn 55%, client export dài được chuyển sang job bất đồng bộ.

### Trả lời mẫu khi phỏng vấn
“Em coi filter và sort là một ngôn ngữ truy vấn nhỏ của API, không phải SQL tùy ý. Em công bố allowlist field và operator, bind mọi giá trị qua repository, còn tên cột được ánh xạ từ enum nội bộ chứ không nối chuỗi do client gửi. Em giới hạn số điều kiện, page size và khoảng ngày; truy vấn export lớn đi qua job riêng. Sort mặc định phải ổn định và có tie-breaker, ví dụ createdAt rồi id, để cursor không lặp hoặc bỏ dòng. Sau đó em xem query plan với các filter phổ biến và thiết kế index theo truy vấn thực tế, vì index cũng làm tăng chi phí ghi. Một lần API cho phép sort bất kỳ đã làm CPU DB tăng từ 42% lên 94%; giới hạn allowlist và page size kéo p99 từ 4,6 giây về 210ms. Em cũng trả 4xx rõ ràng cho parameter sai thay vì để database báo lỗi thành 500.”

> Senior tip: Theo dõi latency và tỷ lệ full scan theo “query shape” đã chuẩn hóa, không log nguyên văn giá trị lọc nhạy cảm. Số tổ hợp filter hữu ích thường ít hơn rất nhiều số tổ hợp mà API có thể cho phép.`,
  follow: [
    'Vì sao bind parameter không đủ để bảo vệ tên cột trong ORDER BY?',
    'Khi nào cần snapshot nhất quán thay vì cursor trên dữ liệu đang thay đổi?',
    'Bạn chọn index dựa trên metric và query plan nào trong PostgreSQL?'
  ],
  tags: ['REST', 'Filtering', 'Sorting', 'Pagination', 'PostgreSQL', 'Performance']
},
{
  id: 'api-050',
  topic: 'api',
  level: 'lead',
  q: 'Bạn cần đổi field response và constraint database trong khi app mobile cũ vẫn hoạt động. Hãy lập kế hoạch backward-compatible theo expand-and-contract, telemetry và deprecation thay vì chỉ phát hành /v2.',
  a: `**Tóm tắt:** Backward-compatible migration cần đảm bảo mọi phiên bản server đang chạy đều hiểu dữ liệu trong lúc deploy cuốn chiếu và client cũ vẫn đọc được response. Dùng expand-and-contract: bổ sung field/cột mới trước, ghi song song hoặc chuyển đổi có kiểm soát, migrate client, đo mức dùng field cũ rồi mới ngừng nó ở một mốc đã thông báo. Deprecation phải dựa trên telemetry theo consumer/version, không dựa vào giả định “chắc không ai dùng”.

### Vì sao rollout nhiều bước
Trong deploy rolling, một lúc có thể tồn tại server cũ và mới. App mobile cũ có thể còn gọi API nhiều tháng. Nếu deploy cùng lúc “đổi tên field + xóa cột”, request có thể đi qua instance khác phiên bản và thất bại.

Ví dụ đổi {{amount}} thành {{amountMinor}}:
1. **Expand DB:** thêm cột mới nullable, migration tương thích với code cũ; không xóa cột cũ.
2. **Expand application:** bản mới đọc cột mới nếu có, fallback cột cũ; khi ghi, cập nhật cả hai trong cùng transaction hoặc dùng một nguồn chuẩn đã xác định.
3. **Backfill:** job theo batch điền giá trị mới, có checkpoint và metric tiến độ; tránh transaction khổng lồ khóa bảng.
4. **Chuyển API:** trả cả field cũ và mới, đánh dấu cũ deprecated trong OpenAPI và tài liệu.
5. **Đo consumer:** metric theo client version/API key cho biết ai còn gọi hoặc dùng field cũ; với field response, server thường chỉ quan sát được request/version chứ không biết client có đọc field nào, nên cần telemetry phía client hoặc contract test.
6. **Contract:** khi usage đạt điều kiện và support window kết thúc, ngừng field cũ theo lịch; xóa cột cũ ở migration sau cùng.

### Ma trận tương thích
| Client / server | Server cũ | Server mới (expand) |
|---|---|---|
| Client cũ | Hoạt động | Vẫn đọc field cũ |
| Client mới | Phải fallback nếu field mới chưa có | Ưu tiên field mới |

Tolerant reader là client bỏ qua field JSON không biết; nhưng không phải mọi client đều tolerant. Enum mới, field bắt buộc, đơn vị đo thay đổi, timezone hoặc default mới đều có thể phá client dù schema JSON “trông vẫn hợp lệ”.

### Deprecation có thể kiểm chứng
Thông báo endpoint/field deprecated trong tài liệu và header phù hợp nếu API hỗ trợ; nêu migration guide, ngày sunset và kênh liên hệ. Dashboard cần tách traffic theo consumer/version. Làm canary/brownout có kiểm soát để phát hiện client còn phụ thuộc, nhưng không dùng 503 định kỳ tùy tiện cho API tài chính nếu chưa thống nhất SLA. Sau sunset, 410 có thể nói resource/endpoint đã bị loại bỏ; route cũ không nên âm thầm chuyển sang semantics mới.

### Pitfall production
- Dual-write có thể lệch nếu một đường ghi cập nhật cột mới còn đường khác chỉ ghi cột cũ; tập trung logic ghi và có job kiểm tra mismatch.
- Backfill dùng giá trị quy đổi sai hoặc chạy không giới hạn gây lock/I/O; chia batch, giới hạn tốc độ, theo dõi replication lag.
- Metric request theo app version không chứng minh app đã ngừng đọc field cũ; bổ sung client instrumentation hoặc contract test.
- Xóa API field và DB column trong cùng release khiến rollback không còn dữ liệu cũ để phục hồi.

### Ví dụ đời thực
Một ví điện tử đổi đơn vị lưu tiền từ số thập phân sang minor unit (số nguyên của đơn vị nhỏ nhất). API đang có 2,4 triệu thiết bị hoạt động và ba phiên bản server deploy luân phiên. Thay đổi trực tiếp khiến app cũ parse sai số tiền và rollback không khôi phục được cột đã xóa. Nhóm thêm cột mới, triển khai dual-read có fallback, backfill mỗi batch 5.000 dòng với giới hạn tải, rồi phát response gồm cả hai field. Trong 8 tuần, telemetry cho thấy 99,7% traffic đã chuyển; nhóm liên hệ 4 đối tác còn lại, hoàn thành migration sau 12 tuần rồi mới dừng field cũ. Checksum theo account phát hiện 17 dòng sai quy đổi trong staging trước khi chuyển đọc. Không phát sinh lỗi số tiền sau rollout.

### Trả lời mẫu khi phỏng vấn
“Em không đổi API và schema database trong một bước vì mobile client cũ và server rolling deployment cùng tồn tại. Em làm expand-and-contract: thêm cột mới tương thích, triển khai code có thể đọc cũ/mới, backfill theo batch, sau đó trả cả field cũ lẫn mới. Client mới ưu tiên field mới nhưng vẫn fallback trong giai đoạn chuyển tiếp. Em đo traffic theo consumer/version; với response field, server không thể tự biết client có thực sự đọc nó nên cần telemetry hoặc contract test. Khi mức dùng field cũ bằng 0 trong support window đã cam kết, em thông báo sunset, bỏ field ở API trước, rồi mới xóa cột trong migration riêng. Em có checksum, cảnh báo mismatch và rollback plan. Trong một lần đổi đơn vị tiền, bước backfill theo batch phát hiện 17 dòng sai ở staging; nếu xóa cột cũ ngay thì không còn đường đối chiếu. Mục tiêu là tương thích ở từng bước deploy, không chỉ ở trạng thái cuối.”

> Senior tip: Một migration an toàn phải rollback được trong từng bước. Giữ cột cũ đến sau khi code mới ổn định và dữ liệu được đối soát; “deploy thành công” không chứng minh dữ liệu đã chuyển đúng.`,
  follow: [
    'Làm sao thực hiện dual-write mà tránh code path ghi hai nơi bị lệch?',
    'Bạn đo được client còn dùng field response cũ bằng cách nào nếu client không gửi telemetry?',
    'Backfill bảng lớn cần kiểm soát lock, replication lag và rollback ra sao?'
  ],
  tags: ['Backward Compatibility', 'Deprecation', 'Expand Contract', 'Database Migration', 'Mobile API']
},
{
  id: 'api-051',
  topic: 'api',
  level: 'senior',
  q: 'Khi viết OpenAPI contract trước implementation, bạn mô tả field optional, nullable, enum mở rộng và lỗi validation ra sao để generated client không hiểu sai hành vi?',
  a: `**Tóm tắt:** OpenAPI contract-first có ích khi schema diễn đạt đúng sự khác nhau giữa “field không gửi”, “field gửi null” và “field có giá trị”, đồng thời mô tả response/error thực tế mà server cam kết. Optional và nullable không đồng nghĩa: optional là field có thể vắng mặt; nullable là field có thể mang giá trị null. Generated SDK chỉ đáng tin khi contract được review, test với implementation và giữ tương thích với client cũ.

### Ba trạng thái của một field
Giả sử request cập nhật địa chỉ:
- Field {{phone}} bị bỏ qua: client không yêu cầu thay đổi số điện thoại.
- {{phone}} có giá trị chuỗi: thay số điện thoại.
- {{phone=null}}: có thể có nghĩa xóa số điện thoại, nếu contract quy định như vậy.

Nếu DTO Java chỉ dùng {{String phone}}, binding thông thường khó phân biệt “vắng mặt” với “null” sau khi deserialize. Với PATCH, cần biểu diễn trạng thái presence rõ ràng (ví dụ JSON tree hoặc kiểu wrapper có trạng thái missing/null/value) và test từng trường hợp; không suy luận rằng OpenAPI tự giải quyết ngữ nghĩa này.

OpenAPI 3.0 và 3.1 biểu diễn nullability khác nhau. Trong 3.0 dùng {{nullable: true}}; trong 3.1 schema theo JSON Schema có thể dùng union type cho null. Chọn version spec phù hợp với generator và toolchain của consumer, rồi kiểm tra schema được sinh thực tế, không chỉ YAML nhìn có vẻ đúng.

### Contract cần mô tả behavior, không chỉ shape
- Request required fields, format, giới hạn (min/max), enum và semantics của null.
- Response thành công theo status code (201, 202, 204…) cùng header quan trọng như Location hoặc Retry-After.
- Error response ổn định, ví dụ Problem Details: status, title, detail và mã lỗi máy đọc được.
- Enum response nên có chiến lược cho giá trị tương lai; client generator có thể tạo enum đóng và ném lỗi parse khi server thêm giá trị.
- Security scheme, pagination/filter limits và version/deprecation policy cần thể hiện rõ.

### Contract-first workflow
1. Product, API consumer và backend thống nhất ví dụ request/response trước khi code.
2. Review spec: required/optional/null, status/error, auth, limits và ví dụ.
3. Sinh interface/model/client nếu có ích; không chỉnh trực tiếp file generated.
4. Implement server và kiểm tra request/response thực tế khớp contract bằng contract test.
5. So spec của pull request với baseline để bắt field bị xóa, type/status đổi hoặc request mới trở nên bắt buộc.
6. Publish đúng artifact đã review; không để tài liệu live tự sinh từ code lệch với spec được duyệt.

### Pitfall production
- Thêm enum response mới có thể làm SDK client crash dù thay đổi nhìn như additive.
- Ghi “optional” nhưng server thực tế yêu cầu field sẽ khiến client sinh hợp lệ theo spec nhưng nhận 400.
- Schema cho phép null nhưng implementation coi null là “giữ nguyên” thay vì “xóa”, dẫn đến dữ liệu cũ còn tồn tại ngoài ý muốn.
- Dùng {{additionalProperties: false}} quá chặt ở response có thể làm client cũ từ chối field mới; dùng quá lỏng ở request lại có thể che lỗi chính tả. Chọn khác nhau theo hướng đọc/ghi.
- Chỉ so sánh schema không bắt được đổi semantics/default; cần review con người và behavior test.

### Ví dụ đời thực
Một đối tác sinh Java SDK từ OpenAPI cho endpoint cập nhật người thụ hưởng. Spec đánh dấu phone nullable nhưng không mô tả sự khác nhau giữa missing và null; server hiểu cả hai là “xóa”. Sau release, app web chỉ gửi city và vô tình xóa 18.000 số điện thoại. Điều tra cho thấy generated DTO deserialization tạo null cho field không gửi; contract test trước đó chỉ kiểm tra field có giá trị. Nhóm định nghĩa PATCH presence semantics, thêm test cho ba payload (missing/null/value), cập nhật spec, chạy generator phiên bản consumer thực dùng và kiểm tra lại SDK trước publish. Sau deploy, không còn xóa nhầm; contract test cũng bắt một enum mới mà SDK đối tác không hỗ trợ.

### Trả lời mẫu khi phỏng vấn
“Em xem OpenAPI là hợp đồng về behavior chứ không chỉ danh sách field. Với mỗi field em phân biệt rõ required, optional và nullable; trong PATCH, missing, null và value có thể mang ba ý nghĩa khác nhau nên implementation phải giữ được presence thay vì để DTO gộp tất cả thành null. Em xác nhận phiên bản OpenAPI và generator của consumer hiểu schema giống nhau, vì nullability ở 3.0 và 3.1 được biểu diễn khác. Contract cần cả status code, header, lỗi, giới hạn, enum và security. Sau khi viết spec, em generate model/client nếu hữu ích, implement và chạy contract test trên response thật; CI so sánh với baseline để phát hiện breaking change. Một thay đổi thêm enum response có thể làm SDK strict crash dù schema diff coi là additive, nên em chạy generator và compatibility test của client quan trọng. Khi API đổi, publish spec đúng bản đã review, không để docs lệch với code.”

> Senior tip: Với mỗi field có thể null, ghi một bảng semantics “missing / null / value” vào review. Đây là vài phút làm rõ contract nhưng tránh được những lần xóa dữ liệu âm thầm rất khó phục hồi.`,
  follow: [
    'OpenAPI 3.0 và 3.1 mô tả nullable khác nhau thế nào, và bạn chọn dựa trên điều gì?',
    'Khi nào thêm enum response được xem là breaking change với generated SDK?',
    'Làm sao contract test phát hiện response implementation lệch OpenAPI?'
  ],
  tags: ['OpenAPI', 'Contract-first', 'Schema Evolution', 'Jackson', 'Generated Client']
},
{
  id: 'api-052',
  topic: 'api',
  level: 'lead',
  q: 'Webhook sender nhận 429, 5xx, timeout và 410 từ nhiều partner khác nhau. Bạn xây retry policy, backpressure và quy trình replay như thế nào để vừa không làm mất event vừa không tạo retry storm?',
  a: `**Tóm tắt:** Webhook sender nên ghi event bền vững trước khi gửi, dùng retry có giới hạn tốc độ và phân loại response; retry không thể đảm bảo “exactly once” vì timeout không cho biết receiver đã xử lý hay chưa. Giữ ổn định delivery ID qua mọi lần gửi, ký payload, tôn trọng {{Retry-After}} khi có, áp exponential backoff với jitter, cô lập partner chậm và đưa event hết hạn vào hàng chờ điều tra/replay thay vì bỏ âm thầm.

### Retry là một chính sách, không phải vòng lặp
Webhook là HTTP callback: hệ thống của bạn chủ động gửi event tới endpoint đối tác. Nếu response mất sau khi đối tác đã xử lý, sender không biết kết quả; gửi lại có thể tạo duplicate, không gửi lại có thể mất event. Do đó mô hình thực tế là at-least-once delivery và receiver phải deduplicate theo delivery/event ID.

### Phân loại response
| Kết quả gửi | Hành vi gợi ý |
|---|---|
| 2xx | Đánh dấu delivered; chỉ sau khi nhận response hợp lệ |
| Timeout / lỗi mạng / 5xx | Lỗi có thể tạm thời; backoff và retry cùng delivery ID |
| 429 | Tôn trọng Retry-After nếu hợp lệ; giảm tốc độ cho partner |
| 400 / 401 / 403 | Thường là payload/cấu hình/auth sai; không retry dồn dập, cảnh báo và giữ trạng thái cần can thiệp |
| 410 Gone | Có thể endpoint đã bị gỡ; disable subscription theo contract và báo owner |

Không có quy tắc chung nào bắt mọi provider dùng cùng mapping; thỏa thuận retry/ack phải được công bố. Retry count tối đa, tuổi event tối đa, retention và quy trình replay là quyết định sản phẩm/vận hành.

### Hàng đợi và giới hạn tải
Persist event vào outbox trong cùng transaction nghiệp vụ trước khi dispatcher gửi. Worker lấy event đến hạn, claim bằng lease để hai instance không gửi đồng thời quá mức, cập nhật next_attempt_at theo backoff có jitter. Giới hạn concurrency và requests-per-second theo subscription/partner; circuit breaker chỉ tạm ngưng gọi endpoint đang lỗi, không xóa delivery. Partner A chậm không được chiếm toàn bộ worker của partner B.

~~~text
event committed
  -> outbox pending
  -> attempt with stable delivery_id
  -> 2xx: delivered
  -> transient failure: scheduled retry
  -> attempts/age exceeded: DLQ + alert + controlled replay
~~~

Dead-letter queue (DLQ) là nơi giữ bản ghi không thể giao tự động để con người hoặc quy trình kiểm soát quyết định tiếp. Replay phải giữ event ID, payload/version và audit trail; nếu payload đã lỗi thì replay nguyên xi chỉ lặp lỗi. Không log secret hoặc dữ liệu cá nhân trong dashboard delivery.

### Pitfall production
- Tạo delivery ID mới mỗi retry làm dedup phía receiver vô hiệu.
- Retry tất cả 4xx biến lỗi cấu hình lâu dài thành storm.
- Backoff giống hệt nhau không có jitter khiến hàng nghìn event cùng thức dậy một lúc sau sự cố.
- Xóa event sau N lần retry mà không DLQ/alert tạo mất dữ liệu “êm”.
- Replay song song với dòng event mới có thể phá ordering; nếu ordering theo aggregate là bắt buộc, tuần tự hóa theo key hoặc gửi sequence và yêu cầu consumer xử lý gap.

### Ví dụ đời thực
Nền tảng ngân hàng gửi 600.000 webhook/ngày tới 80 đối tác. Khi một partner trả 429 trong 10 phút, dispatcher cũ retry ngay mọi event, tạo 18.000 request/phút; partner còn lại bị chậm vì dùng chung worker. Nhóm lưu lịch giao trong outbox, tôn trọng Retry-After, thêm exponential backoff với jitter và giới hạn concurrency riêng từng subscription. Event quá 24 giờ chuyển DLQ có cảnh báo, không bị xóa; replay cần quyền vận hành và giữ nguyên delivery ID. Trong lần thử lỗi kế tiếp, retry giảm còn dưới 900 request/phút, 79 partner khác giữ p99 ổn định, không event nào mất và duplicate được receiver loại theo ID.

### Trả lời mẫu khi phỏng vấn
“Em giả định webhook at-least-once: timeout không chứng minh đối tác chưa xử lý, nên mọi lần gửi lại giữ nguyên delivery ID và receiver cần idempotent. Event được ghi outbox cùng transaction nghiệp vụ; dispatcher lưu trạng thái, lần thử kế tiếp và lỗi cuối. 2xx là delivered, timeout/5xx retry có giới hạn với exponential backoff và jitter, 429 tôn trọng Retry-After; 4xx cấu hình như 401 hoặc 410 cần cảnh báo/disable có kiểm soát thay vì retry vô hạn. Em cô lập concurrency theo partner để một endpoint chậm không làm nghẽn toàn hệ thống. Hết retry hoặc tuổi lưu trữ thì đưa vào DLQ, đo oldest pending và cho replay có audit, giữ nguyên ID. Trong một sự cố, retry ngay đã tạo 18.000 request mỗi phút; backoff và quota riêng kéo xuống dưới 900 mà không mất event. Em cũng không tuyên bố exactly-once vì phía sender không thể biết kết quả khi response bị mất.”

> Senior tip: Theo dõi ít nhất oldest pending age, delivery success rate, retry rate và DLQ depth theo partner. Số lần retry trung bình có thể đẹp trong khi một subscription quan trọng đã bị kẹt hàng giờ.`,
  follow: [
    'Tại sao timeout sau khi gửi webhook không cho biết có nên retry hay không?',
    'Làm sao tách hàng đợi để partner lỗi không gây head-of-line blocking cho partner khác?',
    'Khi replay DLQ, bạn bảo toàn ordering và audit như thế nào?'
  ],
  tags: ['Webhook', 'Retry', 'Backpressure', 'DLQ', 'Outbox', 'Idempotency']
},
{
  id: 'api-053',
  topic: 'api',
  level: 'senior',
  q: 'Một API PATCH được client retry sau timeout và có thể nhận cùng request đồng thời. Làm sao đánh giá idempotency của từng phép cập nhật và ngăn side effect chạy hai lần?',
  a: `**Tóm tắt:** PATCH chỉ có nghĩa là cập nhật một phần; bản thân method không đảm bảo phép cập nhật idempotent. Gán giá trị cụ thể như {{status=PAUSED}} thường có cùng trạng thái cuối khi lặp, còn phép delta như “tăng số lượng thêm 1” hoặc append phần tử có thể lặp tác dụng. Hãy định nghĩa semantics của patch, kiểm soát phiên bản khi ghi, và dùng khóa idempotency/outbox cho side effect không nằm trong phép cập nhật DB.

### Nhìn vào phép toán, không nhìn tên method
Idempotent có nghĩa áp dụng cùng một request nhiều lần tạo cùng hiệu ứng cuối lên resource. So sánh:
- {{nickname = "Lan"}}: đặt field về một giá trị cụ thể; lặp lại vẫn là Lan.
- {{balanceDelta = -50000}}: trừ thêm 50.000 mỗi lần; không idempotent.
- JSON Patch {{add /tags/-}}: mỗi lần có thể thêm một tag nữa.

Vì vậy PATCH có thể idempotent hoặc không tùy media type và semantics. Với tài chính, không biểu diễn giao dịch bằng delta PATCH có thể retry mù; tạo command/giao dịch có ID riêng và deduplicate.

### Bảo vệ ghi đồng thời
Hai client cùng GET version 4, rồi PATCH khác field. Nếu server đọc-sửa-ghi toàn object, request đến sau có thể ghi đè field của request trước (lost update). Dùng {{ETag}}/{{If-Match}} hoặc cột version trong DB:
~~~sql
update profiles
set phone = :phone, version = version + 1
where id = :id and version = :expected_version;
~~~
Nếu số dòng cập nhật bằng 0, version đã đổi; trả 412 cho precondition sai và yêu cầu client đọc lại/merge. Không kiểm tra version rồi update trong hai bước tách rời vì race vẫn xảy ra; điều kiện và update phải atomic ở DB.

### Side effect tách khỏi request retry
Ghi DB rồi gửi email trực tiếp có thể bị timeout sau khi DB commit; retry PATCH có thể gửi email lần nữa. Ghi một outbox record cùng transaction khi trạng thái chuyển thật sự; worker gửi email/event, dùng event ID ổn định và consumer idempotent. Không phát event mỗi lần request lặp nếu không có transition mới.

| Kiểu patch | Thường idempotent? | Kiểm soát cần thiết |
|---|---|---|
| Set field bằng giá trị | Có về trạng thái resource | If-Match nếu cần chống ghi đè |
| Tăng/giảm theo delta | Không | Command ID/idempotency record |
| Add vào cuối collection | Không | ID phần tử duy nhất hoặc dedup |
| Conditional transition | Có nếu chỉ chuyển một lần | Update có điều kiện + outbox khi transition thành công |

### Pitfall production
- Tin rằng “PATCH = idempotent” hoặc “PATCH = non-idempotent” là sai; xét operation cụ thể.
- ETag được tạo nhưng update không dùng version predicate ở DB thì concurrent write vẫn bị mất.
- Dedupe event sau khi side effect đã xảy ra quá muộn; dedup marker và mutation cần cùng transaction hoặc downstream idempotency.
- Client retry với key mới mỗi lần bấm lại; ID phải đại diện cho cùng một ý định nghiệp vụ và giữ nguyên qua retry.

### Ví dụ đời thực
API quản lý hạn mức cho phép PATCH {{limitDelta}} để tăng hạn mức. Mobile timeout sau khi DB commit rồi retry; 4.000 user bị tăng hạn mức hai lần trong một tuần. Nhóm đổi request thành command {{POST /limit-changes}} với client-generated operation ID, unique constraint theo customer/operation ID và lưu kết quả; cùng ID replay kết quả cũ, body khác bị từ chối. Với sửa thông tin hồ sơ bằng PATCH set-value, server dùng If-Match và update có điều kiện. Event thông báo được ghi vào outbox chỉ khi DB thực sự chuyển trạng thái. Sau một tháng, duplicate mutation giảm về 0 và conflict bị trả 412 có thể được client xử lý rõ ràng.

### Trả lời mẫu khi phỏng vấn
“Em không suy ra tính idempotent từ chữ PATCH. Nếu patch đặt một field thành giá trị xác định thì áp lại có thể cho cùng trạng thái; nếu là delta, append hoặc cộng tiền thì lặp lại tạo thêm hiệu ứng. Em chọn contract phù hợp: cập nhật hồ sơ dùng set-value kèm If-Match; thao tác tài chính dùng command có operation ID và khóa duy nhất, không dùng delta PATCH để retry mù. Kiểm tra version phải nằm trong câu update nguyên tử ở DB, nếu không hai request vẫn có thể lost update. Các side effect như phát event hoặc gửi email được ghi vào outbox cùng transaction, và chỉ phát khi transition thành công. Một API tăng hạn mức theo delta đã tăng gấp đôi sau timeout; operation ID cùng unique constraint đã loại duplicate, còn PATCH profile trả 412 khi client đang sửa bản cũ. Cuối cùng, response và lỗi cần hướng dẫn client khi nào đọc lại, khi nào retry cùng ID.”

> Senior tip: Hãy lập danh sách phép cập nhật theo tính chất toán học: set, increment, append, remove, transition. Cách phân loại này thường phát hiện endpoint retry-unsafe nhanh hơn việc chỉ audit HTTP verb.`,
  follow: [
    'Một phép set field idempotent nhưng vẫn có thể gây side effect trùng trong trường hợp nào?',
    'Tại sao kiểm tra ETag rồi update trong hai câu SQL riêng lại không đủ?',
    'Nếu client timeout sau khi DB commit nhưng trước khi nhận response, API nên replay thế nào?'
  ],
  tags: ['PATCH', 'Idempotency', 'If-Match', 'Concurrency', 'Outbox']
},
{
  id: 'api-054',
  topic: 'api',
  level: 'lead',
  q: 'Bạn nhận webhook từ partner dùng chung secret lâu năm và có thể xoay khóa bất cứ lúc nào. Thiết kế xác thực, replay protection, idempotency và rollout key rotation sao cho không làm mất sự kiện hợp lệ.',
  a: `**Tóm tắt:** Receiver cần xác thực chữ ký trên raw body và timestamp trước khi tin payload, sau đó lưu event bền vững với unique key rồi mới ACK. Key rotation cần định danh key (key ID), cho phép secret hiện tại và secret kế tiếp cùng hợp lệ trong cửa sổ chuyển tiếp, ghi nhận key đã xác thực và có quy trình thu hồi; không xoay bằng cách đổi một secret duy nhất tức thời khi hai bên chưa đồng bộ.

### Thứ tự xử lý request
1. Giới hạn kích thước body và kiểm tra header bắt buộc; không parse/log dữ liệu lớn trước khi xác thực.
2. Đọc timestamp và key ID; lấy secret tương ứng từ kho quản lý bí mật, không từ request body.
3. Tính HMAC trên timestamp và **raw bytes** body; so sánh chữ ký constant-time. Nếu serialize JSON lại, khác khoảng trắng/thứ tự field có thể làm chữ ký sai.
4. Kiểm tra timestamp trong cửa sổ cho phép để giảm replay từ request bị đánh cắp.
5. Parse event, kiểm tra schema và lưu inbox bằng unique constraint (provider_id, event_id). Chỉ trả 2xx sau khi lưu bền vững; worker xử lý sau.

Timestamp không thay thế deduplication: kẻ gửi hợp lệ có thể retry trong cửa sổ, và cùng event có thể đến từ nhiều lần gửi mới với timestamp khác. Event ID là khóa idempotency của nghiệp vụ.

### Quy trình xoay secret
~~~text
1. Receiver cài secret K2, vẫn chấp nhận K1 và K2 qua key_id.
2. Provider bắt đầu ký bằng K2 và gửi key_id=K2.
3. Receiver đo delivery xác thực bằng K2, theo dõi K1 còn xuất hiện không.
4. Sau cửa sổ retry tối đa + thời gian dự phòng, ngừng K1.
5. Thu hồi K1, xác nhận không còn traffic, lưu audit.
~~~

Giữ secret trong secret manager/keystore với quyền tối thiểu; log key ID và kết quả xác thực, không log secret, signature đầy đủ hoặc raw payload nhạy cảm. Nếu provider không hỗ trợ key ID, thỏa thuận cụ thể cách thử một số ít secret đang hoạt động và giới hạn thời gian/chính sách; tránh thử mọi khóa không giới hạn.

### Status code và độ tin cậy
| Tình huống | Response gợi ý |
|---|---|
| Chữ ký sai/không có key hợp lệ | 401 hoặc 400 theo contract; không đưa chi tiết giúp đoán secret |
| Timestamp ngoài cửa sổ | Từ chối; ghi metric an toàn |
| Event đã lưu trước đó | 2xx, vì provider không cần gửi lại |
| DB/inbox tạm thời không ghi được | 5xx để provider retry |
| Payload hợp lệ nhưng nghiệp vụ không áp dụng được | Persist, ACK, xử lý/reconcile nội bộ thay vì retry vô hạn |

### Pitfall production
- Thay secret đột ngột làm mọi callback trong lúc deploy trả 401; partner retry dồn hoặc bỏ cuộc.
- Kiểm tra timestamp nhưng không dedup event ID khiến callback hợp lệ lặp vẫn chạy nghiệp vụ nhiều lần.
- ACK trước khi lưu inbox: process crash sau ACK làm event mất vì provider đã dừng retry.
- Timestamp kiểm tra theo đồng hồ lệch; đồng bộ clock, chọn cửa sổ theo SLA mạng và đo drift.
- Không có quy trình revoke khi secret bị lộ; key rotation cần người chịu trách nhiệm, audit và đường emergency revoke.

### Ví dụ đời thực
Ngân hàng nhận 90.000 callback/ngày từ 12 partner. Một partner xoay secret ngay lập tức trong đợt deploy; 8 phút sau mới cập nhật cấu hình sender. Trong khoảng đó 640 callback nhận 401 và một phần partner đã hết retry. Nhóm triển khai key ID và dual-key window: receiver chấp nhận K1/K2, provider gửi K2, dashboard đo tỷ lệ xác thực theo key; chỉ thu hồi K1 sau khi qua thời gian retry tối đa cộng 48 giờ dự phòng. Receiver ghi inbox với unique (partner,event_id) rồi mới trả 202; job đối soát phục hồi 11 event partner đã bỏ retry. Lần xoay sau không có event mất; metric invalid-signature phát hiện một cấu hình K1 chưa được cập nhật trước khi tắt khóa.

### Trả lời mẫu khi phỏng vấn
“Ở receiver, em xác thực chữ ký trên raw body trước khi tin payload, dùng timestamp để giới hạn replay và so sánh HMAC constant-time. Sau xác thực, em deduplicate bằng event ID trong inbox có unique constraint; timestamp không thay thế dedup vì retry có thể có timestamp mới. Em chỉ trả 2xx sau khi event đã persist bền vững, còn nghiệp vụ chạy async. Với rotation, em dùng key ID: receiver triển khai secret mới trước và tạm chấp nhận cả khóa cũ lẫn mới, provider chuyển sang khóa mới, dashboard đo traffic theo key ID. Chỉ thu hồi khóa cũ sau retry window và thời gian dự phòng đã thỏa thuận; có audit và đường khẩn cấp nếu khóa bị lộ. Một lần đổi secret đột ngột đã làm 640 callback bị 401, trong đó 11 event không được retry; dual-key window và reconciliation giải quyết được cả downtime lẫn khoảng trống dữ liệu. Secret không bao giờ xuất hiện trong log.”

> Senior tip: Rotation hoàn tất khi telemetry chứng minh khóa cũ không còn được dùng trong toàn bộ retry window, không phải khi cấu hình provider báo “đã cập nhật”. Luôn có reconciliation để tìm event bị bỏ sau khi retry hết hạn.`,
  follow: [
    'Vì sao timestamp hợp lệ không đủ để loại webhook trùng?',
    'Khi nào nên trả 2xx nếu payload hợp lệ nhưng bước xử lý nghiệp vụ thất bại?',
    'Nếu partner không hỗ trợ key ID, bạn giảm rủi ro khi chuyển secret như thế nào?'
  ],
  tags: ['Webhook', 'HMAC', 'Key Rotation', 'Replay Protection', 'Idempotency']
},
{
  id: 'api-055',
  topic: 'api',
  level: 'senior',
  q: 'App mobile thường xuyên mất mạng: người dùng bấm Chuyển tiền khi đang ở thang máy, request timeout, họ bấm lại. Bạn thiết kế retry và idempotency thế nào để không chuyển tiền hai lần, và client xử lý trạng thái offline ra sao?',
  a: `**Tóm tắt:** Không retry mù. Client phân loại request theo tính idempotent; mỗi ý định nghiệp vụ sinh một {{Idempotency-Key}} (UUID) và lưu xuống đĩa **trước khi** gửi; chỉ retry khi lỗi thuộc loại "không biết server đã xử lý chưa" (timeout, mất kết nối, 502/503/504, 429 có {{Retry-After}}) với backoff lũy tiến cộng jitter. Server lưu (key, fingerprint, trạng thái, response) trong bảng có unique constraint: request đã xong thì replay response cũ, đang xử lý thì trả 409, khác payload thì 422.

### Vì sao mobile khó hơn server-to-server
Một request giữa hai service trong cùng data center thường xong trong 50–200ms; trên 4G, p95 (ngưỡng mà 95% request nhanh hơn mức đó) có thể là 2–5 giây và đứt bất cứ lúc nào. Khi client không nhận được response, có ba khả năng: server chưa nhận, server đang xử lý, server đã commit nhưng response mất. Client không phân biệt được, nên mọi quyết định retry phải dựa trên **hợp đồng idempotent** chứ không phải may mắn.

Thêm ba đặc thù mobile:
- Người dùng bấm lại theo phản xạ; nếu chỉ disable nút 300ms thì vẫn kịp gửi hai request.
- Hệ điều hành có thể suspend app khi vào nền, hoặc kill hẳn; hàng đợi offline phải nằm trên đĩa.
- Retry có thể xảy ra sau nhiều giờ (mở app lại ở nơi có mạng), nên key phải ổn định và server phải giữ đủ lâu.

### Thuật ngữ
- **Idempotent**: áp dụng một lần hay N lần cũng cho cùng trạng thái cuối. {{GET}}, {{PUT}}, {{DELETE}}, {{HEAD}} idempotent về mặt HTTP; {{POST}} thì không. Nhưng idempotent không có nghĩa là response giống nhau: một lần có thể trả 201, lần sau 200 kèm body đã lưu.
- **Idempotency key**: một chuỗi client sinh ra đại diện cho "một ý định nghiệp vụ", giữ nguyên qua mọi lần retry.
- **Fingerprint**: mã băm của payload, dùng để phát hiện cùng key nhưng nội dung khác.
- **Exponential backoff + jitter**: delay tăng dần 1s, 2s, 4s... và cộng ngẫu nhiên ±20% để nhiều client không retry cùng một lúc.
- **Retry budget**: trần số lần hoặc tổng thời gian retry cho mỗi request.
- **Circuit breaker**: sau N lỗi liên tiếp thì tạm dừng gọi, tránh dồn request vào server đang chết.

### Bảng quyết định retry
| Tình huống | Có retry? | Vì sao |
|---|---|---|
| 2xx | Không | Đã xong |
| 400, 401, 403, 404, 422 | Không | Lỗi dữ liệu hoặc quyền; retry vô ích, cần sửa request |
| 408, 429 | Có, sau {{Retry-After}} | Server nói "chưa phải lỗi của bạn" |
| 409 từ tầng idempotency | Có, sau khi chờ | Request trước cùng key chưa xong; chờ rồi gửi lại đúng key đó |
| 502, 503, 504 | Có, có giới hạn | Server tạm quá tải hoặc mạng đứt |
| Timeout, mất kết nối | Có nếu request idempotent hoặc có key | Không biết server đã xử lý chưa |

### Client: hàng đợi offline và key
~~~java
// Mỗi ý định nghiệp vụ: sinh key MỘT LẦN, lưu cùng bản ghi trước khi gọi mạng (write-ahead)
public final class Outbox {
    private final OutboxDao dao;                  // SQLite/Room: (id, key, payload, attempts, next_at)
    public String enqueue(String payload) {
        String key = UUID.randomUUID().toString(); // key ổn định qua mọi lần retry
        dao.insert(key, payload, now());           // lưu TRƯỚC khi có mạng
        return key;
    }
    public void flush(ApiClient api) {
        for (OutboxRow r : dao.due(now())) {
            try {
                api.transfer(r.key, r.payload);    // header Idempotency-Key: r.key
                dao.delete(r.id);
            } catch (RetryableException e) {       // timeout, 502/503/504, 429
                dao.backoff(r.id, nextDelay(r.attempts++)); // 1s, 2s, 4s... + jitter
            } catch (NonRetryableException e) {
                dao.markFailed(r.id, e.getMessage()); // 4xx: báo người dùng, không tự thử
            }
        }
    }
}
~~~
Điểm quan trọng: {{enqueue}} phải chạy **trước** khi gọi API; nếu không, app bị kill giữa request thì không còn dấu vết để retry. Và {{key}} không được sinh lại trong {{flush}}.

### Server: hợp đồng Idempotency-Key
Bảng tối thiểu:
~~~sql
create table idempotency (
  user_id       uuid not null,
  key           uuid not null,
  endpoint      text not null,
  fingerprint   text not null,          -- sha-256 của payload
  status        text not null,          -- IN_PROGRESS | DONE
  response_code int,
  response_body jsonb,
  created_at    timestamptz not null default now(),
  expires_at    timestamptz not null default now() + interval '24 hours',
  primary key (user_id, key)            -- unique: chặn race khi 2 request cùng key
);
~~~
Luồng xử lý:
1. Tính fingerprint, thử {{INSERT ... ON CONFLICT DO NOTHING}} với trạng thái {{IN_PROGRESS}}.
2. Nếu insert thành công: xử lý nghiệp vụ, cập nhật {{DONE}} cộng response, trả response thật.
3. Nếu conflict: đọc bản ghi.
   - Khác fingerprint thì trả 422 (key bị dùng cho việc khác).
   - Đang {{IN_PROGRESS}} thì trả 409 (request trước chưa xong; client chờ rồi retry).
   - Đã {{DONE}} thì replay đúng status và body cũ, **không** chạy lại side effect.

~~~java
@PostMapping("/transfers")
ResponseEntity<?> transfer(@RequestHeader("Idempotency-Key") UUID key,
                           @RequestBody TransferRequest req) {
    var fp = sha256(req);
    var claimed = repo.insertIfAbsent(userId(), key, "transfers", fp, "IN_PROGRESS");
    if (claimed.isEmpty()) {                       // key đã tồn tại
        var old = repo.get(userId(), key);
        if (!old.fingerprint().equals(fp)) throw new KeyReused();        // 422
        if ("IN_PROGRESS".equals(old.status())) throw new InProgress();  // 409: lần trước chưa xong
        return ResponseEntity.status(old.responseCode()).body(old.responseBody()); // DONE -> replay
    }
    try {
        var result = service.transfer(req);        // side effect thật
        repo.finish(userId(), key, 200, result);
        return ResponseEntity.ok(result);
    } catch (RuntimeException e) {
        // chỉ xoá khi transaction nghiệp vụ đã rollback (lỗi ném ra trước khi commit);
        // nếu side effect đã commit, giữ bản ghi DONE để lần retry sau replay
        repo.delete(userId(), key);
        throw e;
    }
}
~~~

### Sơ đồ
~~~seq
title: Timeout nhưng server đã commit
actors: App | API | DB
App -> API: POST /transfers, key K
API -> DB: INSERT (user,K) IN_PROGRESS
API -> DB: UPDATE balance, INSERT transfer
DB --> API: commit
API --> App: response bị mất trên đường
note App..API: App không biết đã commit hay chưa
App -> API: POST lại, cùng key K
API -> DB: conflict rồi đọc bản ghi
DB --> API: DONE và response cũ
API --> App: 200 replay, không trừ tiền lần 2
~~~

### Pitfall production
- Sinh key mới ở mỗi lần retry (thường do tạo key trong hàm gửi thay vì khi người dùng bấm).
- Giữ key trong RAM: app bị kill là mất, retry sau đó không có key, dẫn tới duplicate.
- Dùng chung key cho hai hành động khác nhau (chuyển tiền và nạp tiền).
- Check key ở controller nhưng side effect nằm ở service khác (Kafka, email) nên dedup không trọn.
- Không có TTL thì bảng phình to; TTL quá ngắn thì retry sau hai ngày bị xử lý lần hai.
- Chỉ áp dụng cho {{POST}}, quên {{PATCH}} (PATCH có thể không idempotent, xem câu api-053).
- Trả 200 cho request đã timeout kiểu fire-and-forget, người dùng tưởng đã chuyển tiền.
- Xoá bản ghi idempotency khi side effect đã commit nhưng transaction vẫn lỗi: retry sẽ chạy lại side effect. Chỉ xoá khi transaction nghiệp vụ thật sự rollback.

### Ví dụ đời thực
Một ngân hàng số có 8.000 giao dịch chuyển tiền mỗi ngày. Trên mạng 4G, 1,2% request timeout (khoảng 96 request/ngày). Trước khi có idempotency, nhóm ghi nhận 37 giao dịch trùng trên 1.000 giao dịch (3,7%), tức khoảng 300 khách bị trừ tiền hai lần mỗi ngày và phải xử lý thủ công. Nhóm thêm bảng {{idempotency}} với unique {{user_id, key}}, client sinh key khi bấm nút và lưu vào Room, server replay response cũ. Sau 3 tháng: 0 giao dịch trùng; 0,3% request trả 409 do người dùng bấm lại khi request đầu đang chạy; p95 của API là 240ms nên cửa sổ 409 rất hẹp. Bảng idempotency khoảng 8.000 dòng/ngày, TTL 24 giờ nên luôn dưới 10.000 dòng.

### Trả lời mẫu khi phỏng vấn
"Tôi không retry mù. Đầu tiên tôi phân loại request: GET/PUT/DELETE có thể retry theo cách truyền thống, còn POST/PATCH thì phải có idempotency key. Trên mobile, key được sinh một lần khi người dùng bấm và lưu xuống đĩa cùng với bản ghi việc cần làm, trước khi gọi mạng; như vậy app bị kill thì worker nền vẫn retry đúng key đó. Client chỉ retry khi lỗi thuộc nhóm 'không biết server đã xử lý chưa' — timeout, mất kết nối, 502/503/504, 429 — với exponential backoff cộng jitter và một retry budget; còn 4xx thì báo người dùng chứ không tự thử. Server lưu (key, fingerprint, trạng thái, response) trong một bảng có unique (user, key): nếu đã DONE thì replay response cũ, nếu đang IN_PROGRESS thì trả 409, nếu khác payload thì trả 422. Tôi cũng đặt TTL 24 giờ và có job dọn bảng. Kết quả thực tế: từ 3,7% giao dịch trùng xuống 0, và 409 chỉ chiếm 0,3% vì p95 chỉ 240ms."

> Senior tip: **Đừng đặt timeout client ngắn hơn p99 của server.** Nếu p99 là 4 giây mà timeout là 3 giây, mỗi request chậm sẽ tạo thêm một retry, và đúng lúc server đang chậm nhất thì tải tăng gấp đôi. Tôi thường lấy timeout bằng 2–3 lần p99, cộng một retry budget toàn cục (ví dụ 3 lần, tổng 30 giây) và circuit breaker ở tầng HTTP client; khi breaker mở thì hàng đợi offline giữ việc lại thay vì bắn request vào chỗ đã biết là đang chết.
`,
  follow: [
    'Idempotency key nên do client hay server sinh? Nếu client không hợp tác (đối tác cũ) thì bạn làm gì?',
    'Nếu side effect là một event Kafka thì dedup nên đặt ở producer, broker hay consumer?',
    'Làm sao kiểm thử tự động hành vi mất mạng và retry trên CI mà không cần máy thật?'
  ],
  tags: ['Idempotency', 'Mobile', 'Retry', 'Outbox', 'Offline']
},
{
  id: 'api-056',
  topic: 'api',
  level: 'lead',
  q: 'Một team đề xuất thay toàn bộ REST API bằng một GraphQL endpoint duy nhất cho web và mobile. Bạn đánh giá thế nào? Khi nào GraphQL thắng, khi nào REST vẫn tốt hơn, và chi phí vận hành thật sự nằm ở đâu?',
  a: `**Tóm tắt:** GraphQL thắng khi nhiều client cần "cắt" dữ liệu khác nhau từ một đồ thị quan hệ sâu và schema thay đổi thường xuyên; nó không thắng ở caching HTTP/CDN, rate limit theo request, upload file hay hệ thống đơn giản. Mua sự linh hoạt bằng chi phí thật: không cache được ở tầng HTTP, phải phân tích và giới hạn độ phức tạp query, N+1, auth/audit theo field khó hơn, và versioning/deprecation phải tự làm.

### GraphQL chạy thế nào, từng bước
1. Client gửi một query string cộng variables tới một endpoint duy nhất, thường là {{POST /graphql}}.
2. Server parse thành AST (cây cú pháp trừu tượng — cấu trúc cây mô tả các field được yêu cầu), validate với schema viết bằng SDL (Schema Definition Language — ngôn ngữ mô tả kiểu dữ liệu và quan hệ).
3. Executor đi qua AST, gọi resolver cho từng field; field lồng nhau thì resolver lồng nhau.
4. Kết quả là JSON đúng hình dạng client yêu cầu, không thừa field.
5. Nếu mỗi item lại gọi DB một lần thì thành N+1; dùng DataLoader để gom nhiều key thành một query.

Ví dụ REST trả về 20 field nhưng mobile chỉ cần 3: hoặc mobile nhận thừa, hoặc server phải thêm tham số {{?fields=}} rồi tự bảo trì. GraphQL để client viết:
~~~text
query {
  account(id: "A1") {
    fullName
    cards { last4, expiry }
  }
}
~~~

### Khi nào GraphQL thắng
- **BFF cho nhiều client**: màn hình mobile, web admin và landing page cần tổ hợp field khác nhau; không phải tạo endpoint riêng cho từng màn hình.
- **Quan hệ sâu**: user → orders → items → product; REST dễ thành 5 round-trip hoặc một endpoint "khổng lồ".
- **Schema tiến hoá nhanh**: thêm field không phá client cũ; xoá field thì đánh dấu {{@deprecated}} kèm lý do và thời hạn.
- **Client tự khám phá**: introspection cho phép công cụ sinh code, nhưng nên tắt ở production.

### Khi nào REST vẫn tốt hơn
- **Cần HTTP cache và CDN**: {{GET}} có URL ổn định, {{ETag}}, {{Cache-Control}}; GraphQL thường dùng {{POST}} nên không được cache mặc định. Có thể dùng persisted query (hash) cộng {{GET}} để lấy lại cache, nhưng đó là thêm hạ tầng.
- **Rate limit theo request**: một REST endpoint có chi phí tương đối cố định; một GraphQL query có thể nặng gấp trăm lần query khác.
- **CRUD đơn giản, ít quan hệ**: thêm GraphQL chỉ tăng độ phức tạp.
- **Upload và download file, streaming**: multipart và byte range thuộc về HTTP, không phải GraphQL.
- **Audit, logging, observability theo endpoint**: một endpoint duy nhất làm mọi metric trở nên khó đọc.
- **Đội nhỏ, chưa có người giữ schema**: schema registry, CI kiểm tra breaking change và deprecation là chi phí con người thật.

### Chi phí vận hành thật sự
- **Query cost và DoS**: cần giới hạn depth (độ sâu), complexity (tổng "điểm" của các field), số lượng phần tử trả về, và timeout. Nên dùng persisted query hoặc allowlist để client không gửi SQL tùy ý.
- **N+1**: DataLoader gom theo request, có cache per-request; nếu quên thì một query danh sách có thể tạo hàng nghìn câu SQL.
- **Auth**: không chỉ middleware "đã đăng nhập"; nhiều field cần phân quyền riêng, dễ sót.
- **Error model**: GraphQL trả HTTP 200 kèm mảng {{errors}}; muốn theo RFC 9457 thì phải tự map.
- **Caching**: HTTP cache gần như vô dụng; phải cache ở resolver hoặc dùng persisted query cộng CDN.
- **Versioning**: không có {{/v2}}; thay đổi schema phải theo tiến hoá, kiểm tra breaking change trong CI và theo dõi client nào còn dùng field cũ.

### Code Spring for GraphQL
~~~java
@Controller
class AccountGraph {
    @QueryMapping                                   // query { account(id: "...") { ... } }
    Account account(@Argument String id) { return service.find(id); }

    @SchemaMapping(typeName = "Account", field = "orders")
    List<Order> orders(Account account, DataLoader<Long, List<Order>> loader) {
        return loader.load(account.id()).join();     // N account -> 1 query, tránh N+1
    }
}
// loader = DataLoaderFactory.newDataLoader(keys -> orderService.byAccounts(keys));
// đặt vào DataLoaderRegistry để cache theo đúng phạm vi request
// build.gradle: implementation 'org.springframework.boot:spring-boot-starter-graphql'
// application.yml production: spring.graphql.graphiql.enabled và spring.graphql.schema.introspection.enabled để false
~~~

### Bảng so sánh
| Tiêu chí | REST | GraphQL |
|---|---|---|
| Hình dạng response | Server quyết định | Client quyết định |
| HTTP cache, CDN | Tốt | Kém (trừ persisted query cộng GET) |
| Rate limit | Dễ theo endpoint | Khó, cần cost analysis |
| N+1 | Ít gặp hơn | Thường gặp, cần DataLoader |
| Auth | Middleware theo route | Theo field/resolver, dễ sót |
| Versioning | URL hoặc header | Tiến hoá schema, không có v2 |
| File upload | Tự nhiên | Phải dùng REST riêng |
| Độ phức tạp vận hành | Thấp | Cao |

### Pitfall production
- Query sâu 50 tầng hoặc chọn list 100.000 phần tử làm server và DB quá tải; cần depth/complexity limit trước khi deploy.
- Bật introspection ở production, lộ toàn bộ schema cho đối tượng xấu.
- Cho phép mutation qua {{GET}} để "cho dễ", làm mất cache và an toàn.
- Trả 200 cho mọi lỗi, client không phân biệt được lỗi mạng và lỗi nghiệp vụ.
- Không có schema registry, hai team deploy hai phiên bản schema khác nhau.
- Dùng DataLoader sai phạm vi (cache toàn cục thay vì per-request) làm trả dữ liệu của user khác.

### Ví dụ đời thực
Một app bảo hiểm có 6 client (iOS, Android, web agent, web khách hàng, đối tác, dashboard nội bộ). Trước GraphQL, mỗi màn hình gọi 12–18 request, gộp thành 8–12 round-trip, payload thừa 40–60%. Nhóm chuyển sang một GraphQL BFF: một màn hình còn 1 request, payload giảm 62%. Nhưng tuần đầu p95 tăng từ 420ms lên 1,9 giây vì N+1 (mỗi account gọi orders riêng, khoảng 900 câu SQL/request). Thêm DataLoader gom theo account và cache per-request, p95 về 380ms. Một đối tác gửi query chọn 5.000 order một lần làm DB tăng 300%; nhóm thêm complexity limit 1.000 điểm và max page size 100, sau đó không còn sự cố. Kết luận: GraphQL không tự nhanh hơn, nó chỉ chuyển chi phí từ network sang resolver.

### Trả lời mẫu khi phỏng vấn
"Tôi không thay toàn bộ REST bằng GraphQL. Tôi chọn theo câu hỏi: client có cần cắt dữ liệu khác nhau từ một đồ thị sâu không? Nếu có, một BFF GraphQL cho mobile và web là hợp lý, vì mỗi màn hình tự chọn field, thêm field mới không cần deploy client, và quan hệ sâu chỉ còn một round-trip. Nhưng tôi luôn nói rõ cái giá: GraphQL dùng POST nên mất HTTP cache và CDN, một query có thể nặng gấp trăm lần, nên phải có depth limit, complexity limit, persisted query, và DataLoader để chặn N+1; auth phải làm theo field, error phải tự chuẩn hoá. Với CRUD đơn giản, upload file, hoặc hệ thống cần cache mạnh, REST vẫn tốt hơn. Thực tế tôi đã làm: một màn hình giảm từ 10 round-trip xuống 1 và payload giảm 62%, nhưng p95 ban đầu tăng vì N+1, phải thêm DataLoader mới về 380ms. Tôi cũng tắt introspection ở production và đặt complexity limit sau khi một đối tác làm DB tăng 300%."

> Senior tip: **Đừng so sánh GraphQL với REST bằng "số request".** So sánh bằng tổng bytes, tổng thời gian resolver, số câu SQL và chi phí cache. Tôi thường bắt đầu bằng một BFF GraphQL chỉ cho 1–2 màn hình nặng nhất, giữ REST cho phần còn lại; nếu sau ba tháng không đo được cải thiện p95 hoặc giảm payload ít nhất 30% thì quay lại REST. Và luôn có một "circuit breaker" cho query: complexity limit, timeout, và kill switch tắt GraphQL khi DB quá tải.
`,
  follow: [
    'GraphQL có cache được ở CDN không? Nếu có thì bằng cách nào?',
    'Làm sao chặn một query GraphQL quá nặng trước khi nó chạm DB?',
    'Khi nào bạn từ chối GraphQL dù cả team muốn dùng?'
  ],
  tags: ['GraphQL', 'REST', 'API Design', 'BFF', 'Caching']
},
{
  id: 'api-057',
  topic: 'api',
  level: 'senior',
  q: 'API của bạn trả 429 khi khách vượt hạn mức. Ngoài status code, bạn trả những header nào để client tự điều chỉnh? Thiết kế contract này theo chuẩn nào và những lỗi triển khai nào hay gặp?',
  a: `**Tóm tắt:** Ít nhất phải có {{Retry-After}} (số giây hoặc HTTP-date) trên 429. Nếu theo chuẩn hoá mới thì thêm {{RateLimit-Policy}} (chính sách: q là quota, w là cửa sổ tính bằng giây) và {{RateLimit}} (r là số request còn lại, t là số giây còn lại của cửa sổ) từ draft IETF; legacy {{X-RateLimit-Limit/Remaining/Reset}} vẫn phổ biến nhưng không có semantics thống nhất. Mọi response, kể cả 200, nên trả {{RateLimit}} để client biết còn bao nhiêu, không chỉ khi bị chặn.

### Các header cần biết
- {{Retry-After}}: delay-seconds (ví dụ {{30}}) hoặc HTTP-date. RFC 9110 định nghĩa cho 503 và mọi 3xx; RFC 6585 thêm 429.
- {{RateLimit-Policy: "peruser";q=100;w=60}}: công bố quota 100 request trong 60 giây cho partition "peruser". Tham số {{qu}} là đơn vị (mặc định requests), {{pk}} là partition key.
- {{RateLimit: "peruser";r=37;t=42}}: còn 37 request, cửa sổ hiện tại còn 42 giây.
- {{RateLimit: "peruser";r=0;t=12}}: hết quota; 12 là cửa sổ hiệu lực, không phải mốc "được cấp lại đủ 100 request".
- Legacy: {{X-RateLimit-Limit}}, {{X-RateLimit-Remaining}}, {{X-RateLimit-Reset}}. Vấn đề là {{Reset}} có thể là số giây còn lại, unix timestamp, hoặc mili-giây tùy nhà cung cấp; nếu dùng thì phải ghi rõ đơn vị trong tài liệu.
- **Token bucket**: mỗi request lấy một token từ "xô", xô được nạp lại theo thời gian; hết token thì bị chặn.
- **Redis**: máy chủ key-value chạy riêng, các instance cùng đọc/ghi để chia sẻ trạng thái đếm.

### Ví dụ response
~~~http
HTTP/1.1 200 OK
RateLimit-Policy: "peruser";q=100;w=60
RateLimit: "peruser";r=37;t=42
Content-Type: application/json
~~~

~~~http
HTTP/1.1 429 Too Many Requests
RateLimit-Policy: "peruser";q=100;w=60
RateLimit: "peruser";r=0;t=12
Retry-After: 12
Content-Type: application/problem+json

{
  "type": "https://iana.org/assignments/http-problem-types#quota-exceeded",
  "title": "Request cannot be satisfied as assigned quota has been exceeded",
  "status": 429,
  "violated-policies": ["peruser"]
}
~~~

### Code: filter gắn header
~~~java
@Component
class RateLimitHeaders implements Filter {
    private final RateLimiter limiter;               // token bucket, trạng thái ở Redis (incr có TTL trên key user)
    @Override public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
            throws IOException, ServletException {
        var bucket = limiter.check(userId(req));     // {limit, remaining, resetAt}
        var h = (HttpServletResponse) res;
        // item value là chuỗi: partition key PHẢI nằm trong dấu ngoặc kép (Structured Fields)
        h.setHeader("RateLimit-Policy", "\"peruser\";q=" + bucket.limit() + ";w=60");
        h.setHeader("RateLimit", "\"peruser\";r=" + bucket.remaining() + ";t=" + bucket.windowSeconds());
        if (bucket.remaining() == 0) {
            h.setHeader("Retry-After", String.valueOf(bucket.windowSeconds()));
            h.setStatus(429);
            h.setContentType("application/problem+json");
            h.getWriter().write("""
                {"type":"https://iana.org/assignments/http-problem-types#quota-exceeded",
                 "title":"Quota exceeded","status":429}""");
            return;
        }
        chain.doFilter(req, res);
    }
}
~~~

### Client nên đọc gì
1. Nếu có {{Retry-After}} thì dùng nó; draft quy định {{Retry-After}} được ưu tiên hơn {{RateLimit}} và cửa sổ hiệu lực {{t}} có thể bỏ qua.
2. Nếu không có, dùng {{t}} (số giây còn lại của cửa sổ) cộng jitter.
3. Khi {{r}} thấp (ví dụ dưới 10% quota), chủ động giảm tốc trước khi bị 429.
4. Không dùng {{X-RateLimit-Reset}} như timestamp nếu không biết đơn vị; đây là lỗi phổ biến khi tích hợp nhiều nhà cung cấp.

### Bảng header
| Header | Xuất hiện | Ý nghĩa | Bẫy thường gặp |
|---|---|---|---|
| {{Retry-After}} | 429, 503, 3xx | Chờ bao lâu | Dạng HTTP-date phụ thuộc clock, lệch giờ với client |
| {{RateLimit-Policy}} | Mọi response | Quota và cửa sổ | Quên đơn vị {{qu}} |
| {{RateLimit}} | Mọi response | Còn lại bao nhiêu | Tính trên từng instance nên khác nhau |
| {{X-RateLimit-Limit}} | Legacy | Tổng quota | Không nói cửa sổ |
| {{X-RateLimit-Remaining}} | Legacy | Còn lại | Có thể là giây, ms hoặc timestamp |
| {{X-RateLimit-Reset}} | Legacy | Khi nào reset | Ba định dạng khác nhau trên thị trường |

### Pitfall production
- Trả 429 mà không có {{Retry-After}}: client retry ngay, tạo retry storm, server càng quá tải.
- {{X-RateLimit-Reset}} là timestamp tuyệt đối cộng clock skew giữa các instance, client nhận thời điểm đã qua.
- Tính rate limit trên từng instance sau load balancer: 4 instance cho quota 100/phút thực tế thành 400/phút.
- Chỉ gắn header trên response 200, quên response lỗi — đúng lúc client cần nhất.
- Response được cache (CDN, proxy) kèm {{RateLimit}} cũ; draft khuyến nghị bỏ qua giá trị này trên response từ cache.
- Trả 429 cho request đọc ({{GET}}) khi người dùng chỉ đang xem, làm UI đứng.
- Công bố {{r}} rất lớn nhưng không nói đơn vị, client hiểu nhầm thành "vô hạn".

### Ví dụ đời thực
Một API công khai có 300 đối tác, 2 triệu request/ngày, giới hạn 100 request/phút/key. Trước đây khi vượt hạn mức, server trả 429 trơn; đối tác retry ngay với 5 luồng, làm 429 tăng gấp 8 lần và p95 của endpoint tăng từ 180ms lên 1,2 giây. Nhóm thêm {{RateLimit-Policy}} và {{RateLimit}} trên mọi response, {{Retry-After}} trên 429, và trả {{429}} kèm problem+json có {{violated-policies}}. Sau hai tuần: số request retry trong 1 giây sau 429 giảm 70%, 429 còn 0,4% tổng request, p95 về 210ms. Một đối tác lớn còn dùng {{RateLimit}} để tự điều chỉnh, giảm 429 từ 12.000 xuống 300 mỗi ngày.

### Trả lời mẫu khi phỏng vấn
"Tôi trả 429 kèm {{Retry-After}} — đây là phần bắt buộc, vì thiếu nó thì client retry ngay và tạo bão. Nếu muốn chuẩn hoá, tôi dùng bộ {{RateLimit-Policy}} và {{RateLimit}} của draft IETF: {{RateLimit-Policy}} công bố quota và cửa sổ, {{RateLimit}} cho biết còn lại bao nhiêu và cửa sổ hiệu lực dài bao nhiêu giây. Tôi gắn cả hai trên mọi response, kể cả 200, để client biết mà tự chậm lại trước khi bị chặn; chỉ khi đó rate limit mới thực sự bảo vệ được server. Tôi cũng trả body problem+json với {{violated-policies}} để đối tác biết chính sách nào bị vượt. Nếu phải giữ {{X-RateLimit-*}} cho tương thích, tôi ghi rõ {{Reset}} là số giây còn lại, không phải timestamp. Về triển khai, tôi đếm bằng token bucket trên Redis để nhiều instance dùng chung một quota, và luôn kiểm thử bằng cách vượt quota có chủ đích để xem header và 429 có đúng không."

> Senior tip: **Rate limit không phải để phạt client, mà để client biết đường mà tránh.** Nếu chỉ trả 429, bạn đã đẩy toàn bộ chi phí điều tiết sang phía client và biến một chính sách bảo vệ thành một cuộc đấu retry. Đo lường bằng ba con số: tỉ lệ 429, số request retry trong 1 giây sau 429, và p95 của endpoint; nếu retry sau 429 không giảm khi bạn thêm header, vấn đề nằm ở client chứ không phải ở thuật toán đếm.
`,
  follow: [
    'Retry-After nên là số giây hay ngày giờ? Khi nào mỗi loại phù hợp hơn?',
    'Nếu nhiều instance thì RateLimit tính thế nào cho đúng, và Redis có phải điểm chết không?',
    'Bạn có nên cho client biết giới hạn thật không? Điều này có gây rủi ro bảo mật hay bị khai thác không?'
  ],
  tags: ['Rate Limit', '429', 'Retry-After', 'RateLimit headers', 'API Design']
},
{
  id: 'api-058',
  topic: 'api',
  level: 'lead',
  q: 'API tạo báo cáo trả 202 và giao cho worker chạy nền. Worker có thể bị kill giữa chừng, job có thể được retry, và message queue giao at-least-once. Thiết kế thế nào để job không bị chạy hai lần, không kẹt trạng thái RUNNING, và client biết kết quả?',
  a: `**Tóm tắt:** Tách {{job}} (ý định) khỏi {{attempt}} (một lần chạy). Worker claim job bằng một câu UPDATE atomic, cấp lease có hạn và heartbeat; worker chết thì reaper thu hồi lease và job trở về PENDING để chạy attempt mới. Mỗi lần chạy phải idempotent: side effect bên ngoài (file, email) dùng idempotency key ổn định theo job; kết quả và outbox ghi cùng transaction; chỉ chuyển SUCCEEDED khi thật sự xong. Client theo dõi bằng GET /jobs/{id} hoặc webhook.

### Vì sao at-least-once luôn đi kèm chạy hai lần
Message queue (hàng đợi trung gian: producer đẩy message vào, consumer lấy ra xử lý) như Kafka, RabbitMQ hay SQS thường giao ít nhất một lần: consumer xử lý xong nhưng chưa ack mà bị kill thì message được giao lại. Vì vậy consumer phải idempotent theo khóa nghiệp vụ. Nếu không, một job tạo PDF có thể tạo hai file, một job gửi email có thể gửi hai lần.

### Mô hình dữ liệu
- {{jobs}}: id, type, payload, status (PENDING, RUNNING, SUCCEEDED, FAILED, CANCELLED), attempt, max_attempt, lease_until, worker_id, result_key, error, created_at, updated_at.
- {{job_attempts}}: job_id, attempt, worker_id, started_at, finished_at, error để audit và biết attempt nào đã chạy.
- {{outbox}}: job_id, kind, payload, created_at; side effect sẽ gửi sau, cùng transaction với thay đổi trạng thái.

### Claim atomic
~~~sql
with next as (
  select id from jobs
  where status = 'PENDING' and attempt < max_attempt
  order by created_at
  limit 1
  for update skip locked
)
update jobs j
   set status = 'RUNNING',
       attempt = attempt + 1,
       lease_until = now() + interval '30 seconds',
       worker_id = :worker
  from next
 where j.id = next.id
returning j.*;
~~~
{{FOR UPDATE SKIP LOCKED}} giúp nhiều worker cùng chạm bảng mà không chọi nhau: mỗi worker lấy row chưa bị ai khoá rồi khoá luôn row đó trong cùng transaction. Nếu dùng {{FOR UPDATE}} thường, worker thứ hai phải chờ worker đầu commit nên các worker chạy gần như tuần tự.

### Idempotency khi chạy lại
- {{job.type + payload hash}} là khóa nghiệp vụ; client tạo job trùng sẽ nhận job cũ thay vì job mới.
- Worker trước khi chạy kiểm tra {{status}}: nếu đã SUCCEEDED thì không chạy lại.
- Side effect bên ngoài: {{outbox}} với key {{job_id + ':' + kind}}, worker gửi sau; consumer đầu cuối dedup theo key này.
- File PDF: ghi vào key S3 cố định theo job, ví dụ {{jobs/ID/report.pdf}}; ghi đè vẫn ra cùng kết quả, không sinh UUID mới mỗi attempt.
- Nếu side effect không thể idempotent (gửi SMS), phải có bảng {{sent}} unique {{job_id, kind}} và kiểm tra trước khi gửi.

### Lease và reaper
~~~java
@Scheduled(fixedDelay = 5000)
void reap() {
    // job RUNNING quá lease cộng grace 10s -> PENDING nếu còn attempt, ngược lại FAILED
    int n = jobs.reapExpiredLeases(Instant.now());
    log.info("reclaimed {} jobs", n);
}

public void run(String jobId) {
    var job = jobs.claim(jobId, workerId(), Duration.ofSeconds(30)); // atomic
    if (job.isEmpty()) return;                                      // worker khác đang chạy
    try {
        var result = executor.execute(job.get().payload());          // I/O: S3, PDF, DB
        jobs.finishWithOutbox(jobId, workerId(), result,           // MỘT transaction: UPDATE có điều kiện + INSERT outbox
                            "REPORT_READY", result.url());             // chỉ worker còn giữ lease mới ghi
    } catch (Exception e) {
        jobs.failOrRetryIfOwner(jobId, workerId(), e.getMessage()); // attempt < max -> PENDING
    }
}
~~~
{{finishWithOutbox}} chạy trong đúng một transaction và phải so {{worker_id}} với {{lease_until}} trong câu UPDATE có điều kiện (kiểm worker_id thôi là chưa đủ: id worker cũ có thể được tái dùng cho attempt khác): nếu không, một worker sống lại sau khi lease bị thu hồi có thể ghi đè kết quả của attempt mới, hoặc outbox báo xong trong khi job chưa chuyển SUCCEEDED.

### Client biết kết quả
| Cách | Độ trễ | Khi nào chọn |
|---|---|---|
| Polling GET /jobs/{id} | Theo chu kỳ 2–10 giây | Mobile, UI đơn giản |
| Webhook | Gần tức thì | Đối tác server-to-server |
| SSE | Tức thì | Dashboard đang mở |

Polling nên backoff 2s, 4s, 8s, tối đa 30s và dừng khi SUCCEEDED hoặc FAILED; đừng poll 200ms.

### Sơ đồ
~~~seq
title: Worker chết giữa chừng, job chạy lại
actors: API | DB | Worker | S3
API -> DB: INSERT job PENDING
Worker -> DB: claim SKIP LOCKED, RUNNING
Worker -> S3: tạo file báo cáo
note Worker..S3: process bị kill, chưa kịp update
DB --> Worker: mất kết nối
Worker -> DB: reaper: RUNNING quá lease, PENDING
Worker -> DB: claim lại, attempt 2
Worker -> S3: ghi đè đúng key jobs/id/report.pdf
Worker -> DB: SUCCEEDED và outbox
~~~

### Pitfall production
- Không có lease: job kẹt RUNNING vĩnh viễn; người dùng bấm lại tạo job mới, job cũ vẫn chạy.
- Queue giao lại job đã SUCCEEDED: tạo file hoặc email lần hai.
- Outbox ghi ở transaction khác: job báo SUCCEEDED nhưng email không bao giờ gửi.
- Không giới hạn max_attempt: job lỗi dữ liệu retry vô hạn, tốn tiền LLM hoặc SMS.
- Kết quả để trong DB dạng base64 PDF: bảng phình, backup chậm.
- Poll quá dày hoặc poll cả khi job đã xong.
- Không có metric: không biết bao nhiêu job kẹt, p95 hoàn thành, số attempt trung bình.

### Ví dụ đời thực
Một hệ thống sao kê có 1.200 export mỗi ngày, mỗi job 3–5 phút, 6 worker. Worker bị OOM kill 12 lần/tuần; 3% job kẹt RUNNING (36 job/ngày), người dùng bấm lại tạo job trùng, tổng 180 job rác mỗi ngày. Nhóm thêm lease 30 giây cộng heartbeat 10 giây, reaper 5 giây, {{FOR UPDATE SKIP LOCKED}}, và key S3 cố định theo job. Sau 4 tuần: job kẹt còn 0; job trùng còn 0 vì client nhận lại job cũ; p95 hoàn thành giảm từ 6,5 phút xuống 4,2 phút do 6 worker chạy song song thay vì xếp hàng; job rác giảm 100%. Một lần queue giao lại đã tạo email thứ hai, nhóm thêm bảng {{sent}} unique {{job_id, kind}} và chấm dứt.

### Trả lời mẫu khi phỏng vấn
"Tôi tách job khỏi attempt. Job là ý định, attempt là một lần chạy; job có lease 30 giây và worker heartbeat mỗi 10 giây. Khi worker chết, lease hết hạn, reaper đưa job về PENDING và attempt tăng; worker khác claim bằng một câu UPDATE có {{FOR UPDATE SKIP LOCKED}} nên không chọi nhau. Để không chạy hai lần, tôi kiểm tra trạng thái trước khi chạy, ghi file vào key S3 cố định theo job, và đưa mọi side effect bên ngoài vào outbox cùng transaction với việc chuyển trạng thái; consumer đầu cuối dedup theo cặp job và kind. Kết quả chỉ được ghi bởi worker còn giữ lease, tránh worker cũ sống lại ghi đè. Client theo dõi bằng GET /jobs/{id} với polling backoff, hoặc webhook nếu là đối tác. Thực tế: 3% job kẹt RUNNING về 0, job trùng về 0, và p95 giảm từ 6,5 xuống 4,2 phút khi đủ 6 worker chạy song song."

> Senior tip: **Đừng coi message queue là nơi lưu trạng thái job.** Queue chỉ là phương tiện giao việc; sự thật về job phải nằm trong DB, có lease và attempt. Tôi luôn đo ba metric: số job RUNNING quá lease, số job có attempt lớn hơn 1, và số side effect bị dedup ở consumer; nếu attempt nhiều hơn 1 tăng vọt mà job không xong, vấn đề là lỗi dữ liệu chứ không phải worker chậm, và retry chỉ làm tốn tiền.
`,
  follow: [
    'Lease bao lâu là hợp lý? Nếu job chạy 10 phút thì heartbeat và lease nên đặt thế nào?',
    'Làm sao phân biệt job FAILED vĩnh viễn do dữ liệu sai với lỗi tạm thời cần retry?',
    'Nếu client tạo job trùng nhưng payload khác nhau thì server nên trả gì?'
  ],
  tags: ['Job', 'Worker', 'Idempotency', 'Outbox', 'Queue']
},
{
  id: 'api-059',
  topic: 'api',
  level: 'senior',
  q: 'Khách hàng upload sao kê PDF 2 GB từ app mobile, mạng 4G chập chờn, cứ 30 giây lại mất kết nối. Bạn thiết kế API upload thế nào để không mất byte nào, có thể resume, và không làm nghẽn service Java?',
  a: `**Tóm tắt:** Không nhận file 2 GB qua API Spring; base64 trong JSON còn tệ hơn (tăng 33% kích thước và giữ trong RAM). Dùng presigned URL để client upload thẳng lên S3, chia multipart 8–16 MB và cho phép resume: client nhớ uploadId, part number và ETag, mất mạng thì gửi tiếp part còn thiếu. Với file dưới 10 MB, {{multipart/form-data}} qua API là đủ.

### Vì sao không đẩy qua API
- {{Base64}}: 2 GB thành khoảng 2,7 GB text; JSON parser và JVM heap không chịu nổi.
- {{MultipartFile}}: Spring ghi tạm xuống đĩa (mặc định chỉ 1 MB/file và 10 MB/request, vượt thì phải tăng cấu hình), nhưng file vẫn đi qua service, dễ timeout, không resume, và tốn băng thông hai lần (client → API → S3).
- Upload một lần: mất kết nối ở byte 1,9 GB là phải làm lại từ đầu.

### Thuật ngữ
- **Presigned URL**: URL đã kèm chữ ký tạm thời, ai có URL cũng upload được vào đúng key trong thời hạn; client không cần AWS access key.
- **Multipart upload**: chia file thành các part, upload song song, S3 ghép lại; mỗi part trừ part cuối tối thiểu 5 MiB và tối đa 5 GiB, nhiều nhất 10.000 part (nên object tối đa khoảng 48,8 TiB).
- **ETag**: định danh của một part sau khi upload, cần khi gọi complete. Với multipart, ETag của cả file không phải MD5 của cả file.
- **Resumable**: client lưu trạng thái, mất mạng thì hỏi "đã có bao nhiêu byte" rồi gửi tiếp.
- **tus**: chuẩn HTTP cho upload có thể resume ({{POST}} tạo, {{PATCH}} gửi byte, {{HEAD}} hỏi offset).

### Luồng S3 multipart cộng presigned
~~~seq
title: Upload 2GB có resume qua S3
actors: App | API | S3
App -> API: POST /uploads, name và size
API -> S3: CreateMultipartUpload
S3 --> API: uploadId
API --> App: 201 uploadId, partSize, presigned URLs
App -> S3: PUT part 1
App -> S3: PUT part 2
note App..S3: mất mạng, chỉ gửi lại part dở
App -> API: POST complete, danh sách part
API -> S3: CompleteMultipartUpload
S3 --> API: 200 OK
API --> App: 201 fileId, status SCANNING
~~~

### Code
~~~java
@PostMapping("/uploads")
Map<String, Object> create(@RequestBody CreateUpload req) {
    var mpu = s3.createMultipartUpload(CreateMultipartUploadRequest.builder()
        .bucket(bucket).key("statements/" + UUID.randomUUID() + ".pdf").build());
    int partSize = 16 * 1024 * 1024;                       // 16 MiB
    int parts = (int) Math.ceil(req.size() / (double) partSize);
    var urls = IntStream.rangeClosed(1, parts).mapToObj(n -> Map.of(
        "part", n,
        "url", s3Presigner.presignUploadPart(UploadPartPresignRequest.builder()
            .signatureDuration(Duration.ofMinutes(15))      // URL chỉ sống 15 phút
            .uploadPartRequest(UploadPartRequest.builder()
                .bucket(bucket).key(mpu.key()).uploadId(mpu.uploadId())
                .partNumber(n).build())
            .build()).url().toString()))
        .toList();
    return Map.of("uploadId", mpu.uploadId(), "partSize", partSize, "parts", urls);
}

@PostMapping("/uploads/{uploadId}/complete")
Map<String, Object> complete(@PathVariable String uploadId, @RequestBody CompleteRequest req) {
    var completed = req.parts().stream()
        .map(p -> CompletedPart.builder().partNumber(p.part()).eTag(p.etag()).build()).toList();
    s3.completeMultipartUpload(CompleteMultipartUploadRequest.builder()
        .bucket(bucket).key(req.key()).uploadId(uploadId)
        .multipartUpload(CompletedMultipartUpload.builder().parts(completed).build()).build());
    return Map.of("fileId", req.key(), "status", "SCANNING");  // quét virus bất đồng bộ
}
~~~

### Nếu không dùng S3: tus
~~~http
POST /files HTTP/1.1
Tus-Resumable: 1.0.0
Upload-Length: 2147483648
Upload-Metadata: filename aGVsbG8ucGRm,filetype YXBwbGljYXRpb24vcGRm

HTTP/1.1 201 Created
Location: /files/24e533e0
Tus-Resumable: 1.0.0
~~~
~~~http
HEAD /files/24e533e0 HTTP/1.1
Tus-Resumable: 1.0.0

HTTP/1.1 200 OK
Upload-Offset: 1073741824
Upload-Length: 2147483648
~~~
~~~http
PATCH /files/24e533e0 HTTP/1.1
Tus-Resumable: 1.0.0
Content-Type: application/offset+octet-stream
Upload-Offset: 1073741824

[1 MiB tiếp theo]

HTTP/1.1 204 No Content
Upload-Offset: 1074790400
~~~
Giải thích: {{Upload-Offset}} lệch thì server trả 409 và không sửa file; client gửi {{HEAD}} để biết offset hiện tại; phiên bản không hỗ trợ thì trả 412 kèm {{Tus-Version}}. {{Upload-Metadata}} là các cặp key-value đã base64.

### Bảng so sánh
| Cách | Giới hạn | Resume | Qua API Java | Độ phức tạp |
|---|---|---|---|---|
| multipart/form-data qua API | khoảng 100 MB | Không | Có | Thấp |
| Presigned URL một lần | 5 GB | Không | Không, đi thẳng S3 | Thấp |
| S3 multipart cộng presigned | 48,8 TiB | Có, theo part | Không, đi thẳng S3 | Trung bình |
| tus qua API | Theo {{Tus-Max-Size}} của server | Có, theo byte | Có | Cao |
| Base64 trong JSON | Vài chục MB | Không | Có | Thấp nhưng tốn RAM |

### Pitfall production
- Part không phải part cuối nhỏ hơn 5 MiB: S3 từ chối khi complete.
- Quên complete: part rác tồn tại và vẫn tính tiền lưu trữ; đặt lifecycle {{AbortIncompleteMultipartUpload}} sau 7 ngày.
- Presigned URL TTL quá dài thì lộ link; quá ngắn thì upload dở.
- Chưa cấu hình CORS trên bucket (cơ chế trình duyệt kiểm tra server có cho phép origin khác gọi không; thiếu thì preflight OPTIONS bị chặn): {{PUT}} từ app bị chặn.
- ETag của multipart không phải MD5 của cả file (S3 tính MD5 từng part rồi băm tiếp các MD5 đó, thêm "-số part"); đừng so sánh để kiểm tra toàn vẹn, hãy dùng checksum SHA-256 hoặc CRC32.
- Quét virus sau upload: phải có trạng thái SCANNING hoặc INFECTED và không cho download ngay.
- Client đặt {{Content-Type}} tùy ý; nếu Content-Type nằm trong chữ ký thì giá trị khác sẽ bị 403 SignatureDoesNotMatch, còn không thì phải kiểm ở bước hoàn tất (chỉ PDF, PNG...).

### Ví dụ đời thực
Một ngân hàng nhận khoảng 20 GB sao kê mỗi ngày từ 400 khách hàng doanh nghiệp; 1,4% upload thất bại (khoảng 6 lần/ngày), mỗi lần thất bại ở phút thứ 7 là người dùng phải gửi lại file 2 GB, trung bình 8 phút. Nhóm chuyển sang S3 multipart 16 MiB với presigned URL: client chỉ gửi lại part dở, thời gian upload trung bình còn 95 giây, băng thông giảm 41%, và 0 file sai checksum trong 2 tháng. Nhóm cũng đặt lifecycle abort sau 7 ngày, tiết kiệm khoảng 180 GB lưu trữ rác mỗi tháng. Khi quét virus, 3 file PDF chứa macro bị chặn ở trạng thái INFECTED, không tới được khách.

### Trả lời mẫu khi phỏng vấn
"Tôi không nhận file 2 GB qua API Java. Với file lớn, tôi dùng presigned URL để client upload thẳng lên S3, chia multipart 16 MiB và cho phép resume: client lưu uploadId, part number và ETag; mất mạng thì gọi HEAD hoặc API để biết part nào đã xong, rồi gửi tiếp part còn thiếu. Khi đủ part, client gọi complete với danh sách ETag, S3 ghép file, server trả fileId và trạng thái SCANNING để quét virus. Nếu không dùng S3, tôi dùng tus: POST tạo, PATCH gửi byte, HEAD hỏi offset, offset lệch thì 409. Tôi đặt lifecycle abort các multipart chưa hoàn tất sau 7 ngày để không tốn lưu trữ rác, cấu hình CORS, giới hạn Content-Type, và không cho download khi chưa scan xong. Thực tế: từ 1,4% upload lỗi và 8 phút mỗi lần gửi lại, còn 95 giây trung bình, băng thông giảm 41%."

> Senior tip: **Part size là bài toán cân bằng giữa overhead và khả năng resume.** Part quá nhỏ (1 MiB) thì 2 GB cần 2.000 request, mỗi request có preflight, chữ ký và round-trip; part quá lớn (100 MiB) thì mất mạng ở phút cuối mất trắng 100 MiB. Tôi thường chọn 8–16 MiB cho 4G, đo lại theo tỉ lệ thất bại: nếu tỉ lệ rớt trên 5% thì giảm part xuống 8 MiB, nếu mạng ổn định và file 10 GB thì tăng lên 32 MiB. Và luôn đặt lifecycle abort, vì lưu trữ rác từ multipart không hoàn tất là khoản tiền âm thầm nhưng rất thật.
`,
  follow: [
    'Part size bao nhiêu là hợp lý? Vì sao không quá nhỏ hoặc quá lớn?',
    'Làm sao client biết part nào đã upload thành công khi mất mạng giữa chừng?',
    'Nếu presigned URL bị lộ thì bạn xử lý thế nào?'
  ],
  tags: ['Upload', 'S3', 'Presigned URL', 'Multipart', 'Resumable']
},
{
  id: 'api-060',
  topic: 'api',
  level: 'senior',
  q: 'Bạn thiết kế endpoint chat với LLM cho app web và mobile: model sinh từng token, client muốn thấy chữ chạy dần. Chọn SSE, WebSocket hay NDJSON? Xử lý abort, token usage và client mất kết nối thế nào?',
  a: `**Tóm tắt:** Chat một chiều (server → client) thì SSE là hợp lý nhất: một HTTP request, {{text/event-stream}}, tự nối lại, qua được proxy. WebSocket chỉ khi cần hai chiều thật (voice, interrupt bằng giọng nói); NDJSON là lựa chọn khi client dùng fetch streaming và cần gửi header Authorization. Điểm khó không phải giao thức mà là abort: khi client đóng kết nối, phải hủy subscription để nhà cung cấp ngừng sinh token (tiết kiệm tiền), và phải tính usage ở sự kiện cuối.

### Cơ chế từng bước
1. Client gửi {{POST /chat}} với {{Accept: text/event-stream}}.
2. Server gọi LLM ở chế độ stream; Spring AI {{ChatClient...stream().content()}} trả {{Flux<String>}}, mỗi phần tử là một token.
3. Controller trả {{Flux<ServerSentEvent<String>>}} với {{produces = MediaType.TEXT_EVENT_STREAM_VALUE}}; Spring WebFlux giữ kết nối và đẩy từng event.
4. Mỗi token là một dòng {{data: ...}}; cuối cùng gửi {{event: done}} kèm usage (hoặc dòng {{data: [DONE]}} theo kiểu OpenAI).
5. Client đọc stream: {{EventSource}} chỉ làm được với endpoint {{GET}}, còn với {{POST /chat}} thì phải dùng fetch cộng ReadableStream (hoặc thư viện fetch-event-source) để có body và header {{Authorization}}.

Giải thích thêm: **token** là một mảnh nhỏ của câu trả lời (khoảng 3–4 ký tự tiếng Anh); **NDJSON** là mỗi dòng một JSON hoàn chỉnh, client đọc từng dòng khi server đẩy, không có cú pháp event như SSE.

### Protocol
| Tiêu chí | SSE | WebSocket | NDJSON |
|---|---|---|---|
| Hướng | Server → client | Hai chiều | Server → client |
| API client | {{EventSource}} (chỉ GET) hoặc fetch cộng reader | {{WebSocket}} | {{fetch}} cộng reader |
| Header Authorization | Không (chỉ GET, không body, không custom header) | Có | Có |
| Tự nối lại | Có, {{retry}} cộng {{Last-Event-ID}} (chỉ khi dùng {{EventSource}}) | Tự viết | Tự viết |
| Qua proxy | Tốt nếu tắt buffering | Cần hiểu Upgrade | Tốt |
| Phù hợp | Chat, log, tiến độ | Voice, game, collaborative | Mobile fetch, API đơn giản |

### Code Spring AI
~~~java
@PostMapping(value = "/chat", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
Flux<ServerSentEvent<String>> chat(@RequestBody ChatRequest req) {
    return ChatClient.create(chatModel).prompt().user(req.message())
        .stream().content()                                    // Flux<String> từng token
        .map(t -> ServerSentEvent.builder(t).build())
        .doOnCancel(() -> log.info("client abort: stop upstream")) // hủy -> đóng HTTP upstream
        .concatWith(Flux.just(ServerSentEvent.builder("[DONE]").event("done").build()));
}
~~~
Khi client đóng kết nối, WebFlux hủy subscription (tín hiệu cancel lan ngược lên upstream); nếu dùng WebClient để gọi Anthropic hoặc OpenAI, HTTP request upstream cũng bị hủy và nhà cung cấp ngừng sinh token. Nếu chỉ log {{doFinally}} mà không hủy subscription thì token vẫn được sinh và vẫn bị tính tiền.

### Anthropic events
Một stream Anthropic gồm {{message_start}}, {{content_block_start}}, nhiều {{content_block_delta}} (chữ chạy dần), {{content_block_stop}}, {{message_delta}} (chứa usage), {{message_stop}}. Usage đến ở {{message_delta}} và là số luỹ kế; nếu client ngắt giữa chừng thì không có sự kiện này (OpenAI thì chỉ trả usage khi bật {{stream_options.include_usage}}), nên server phải tự ghi usage khi stream kết thúc hoặc bị hủy.

### Abort và chi phí
- Hủy đúng chỗ: khi người dùng bấm Stop hoặc đóng màn hình, hủy subscription và đóng HTTP upstream.
- Đo bằng {{doOnCancel}} và so sánh số token sinh ra với số token nếu chạy hết.
- Đừng retry cả stream khi lỗi giữa chừng: có thể sinh token hai lần và client thấy chữ lặp.
- Ghi usage ở server khi hoàn tất hoặc hủy, không dựa vào client.

### Pitfall production
- nginx buffering: token dồn cục, client thấy "typing" rồi chữ hiện đột ngột; tắt {{proxy_buffering}} cho endpoint hoặc thêm {{X-Accel-Buffering: no}}.
- gzip trên SSE làm trễ; thường tắt nén cho {{text/event-stream}}.
- Không heartbeat: proxy cắt kết nối sau 60 giây im lặng; gửi comment {{: ping}} mỗi 15 giây.
- Load balancer timeout 60 giây: đặt timeout dài hơn hoặc heartbeat.
- Client {{EventSource}} tự nối lại sau khi server đóng stream (trừ khi server trả 204): gửi lại từ đầu; dùng id hoặc cờ final.
- {{EventSource}} không gửi được header Authorization và chỉ gửi {{GET}}: dùng cookie HttpOnly hoặc fetch streaming.
- Timeout LLM quá ngắn: stream đứt giữa câu; đặt timeout theo p99 của model.
- Thiếu CORS hoặc credentials.

### Ví dụ đời thực
Một app hỏi đáp có 1.200 lượt chat mỗi ngày, p95 first token 900ms. Ban đầu dùng WebSocket: 8% kết nối rớt khi mạng chuyển 4G và WiFi, phải tự viết reconnect và state. Chuyển sang SSE cộng heartbeat 15 giây, rớt còn 0,6%; thêm {{doOnCancel}} đúng chỗ, số token bị bỏ trên mỗi request giảm từ 520 xuống 400 (23%), chi phí model giảm từ 310 USD xuống 240 USD mỗi tháng. Một lần client bấm Stop nhưng server không hủy subscription, một request sinh 4.100 token vô ích; sau khi thêm hủy, không còn request nào vượt 1.500 token khi bị abort.

### Trả lời mẫu khi phỏng vấn
"Tôi chọn SSE cho chat một chiều. Client mở một request với {{Accept: text/event-stream}}, server giữ kết nối và đẩy từng token; SSE tự nối lại, qua proxy tốt, và đủ cho cả web lẫn mobile. WebSocket tôi chỉ dùng khi cần hai chiều thật, ví dụ voice hoặc interrupt bằng giọng nói, vì phải quản lý trạng thái kết nối, sticky session và pub-sub giữa các instance. NDJSON là phương án khi client cần gửi header Authorization, vì {{EventSource}} không cho tùy biến header; khi đó tôi dùng fetch cộng ReadableStream. Phần khó nhất là abort: khi client đóng, tôi hủy subscription để WebFlux đóng HTTP upstream và nhà cung cấp ngừng sinh token, đo bằng {{doOnCancel}} và ghi usage ở server. Tôi cũng tắt buffering ở nginx, gửi heartbeat 15 giây, và không retry cả stream vì có thể sinh token hai lần. Thực tế: rớt kết nối từ 8% xuống 0,6%, và chi phí token giảm 23% nhờ hủy đúng chỗ."

> Senior tip: **Với streaming AI, hãy đo chi phí theo request bị abort, không chỉ theo token trả về.** Một stream bị hủy ở token thứ 2.000 vẫn tốn tiền như nhau; nếu không hủy upstream, bạn đang trả tiền cho những token không ai đọc. Tôi đặt ba mức cảnh báo: tỉ lệ abort, số token trung bình trên mỗi request bị abort, và p95 first token; nếu token trên request abort tăng, thường là do client hủy vì chờ quá lâu chứ không phải do người dùng đổi ý.
`,
  follow: [
    'Nếu client cần ngắt giữa chừng rồi gửi câu mới thì SSE có đủ không, hay phải thêm kênh điều khiển?',
    'Làm sao biết stream đã hoàn tất để tính tiền và ghi log?',
    'NDJSON khác SSE ở điểm nào khi dùng fetch trên mobile?'
  ],
  tags: ['SSE', 'WebSocket', 'LLM', 'Streaming', 'Spring AI']
},
);
