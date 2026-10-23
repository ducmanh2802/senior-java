/* Debug labs — category incident. Format: AGENTS.md section 10 (LABS). */
(window.LABS = window.LABS || []).push(
{
  id: 'lab-incident-001',
  category: 'incident',
  title: 'Ngân hàng đối tác chậm, cả luồng thanh toán sập và khách bị trừ tiền hai lần',
  level: 'senior',
  scenario: `**Bối cảnh:** Sàn **ShopVN** có luồng thanh toán: app → **api-gateway** (Spring Cloud Gateway) → **checkout-service** → **payment-service** → **bank-adapter** → API ghi nợ của ngân hàng đối tác **VBK**. Các service đều là Spring Boot 3.2, Tomcat 200 thread, có Micrometer Tracing (traceId truyền qua header W3C {{traceparent}}). Ngoài việc gọi bank-adapter, payment-service còn phục vụ API xem số dư ví {{GET /v1/wallets/balance}}, vốn chỉ mất khoảng 45 ms.

**Triệu chứng:** Ngày **22/10/2026**, từ **19:58** API của VBK chậm (p99 từ 0.8 giây lên khoảng 35 giây, VBK xác nhận lỗi DB phía họ, khắc phục lúc 20:04). Hậu quả: gateway trả **504** hàng loạt cho mọi luồng thanh toán (kể cả khách dùng ví, không đi qua VBK), API số dư ví timeout, và hệ thống chỉ hồi phục hoàn toàn lúc 20:09. Sáng hôm sau, đối soát phát hiện **217 đơn** có trạng thái FAILED nhưng khách bị VBK trừ tiền, trong đó 64 đơn bị trừ **2–3 lần**.

**Dữ liệu thu thập:** Log JSON của 4 thành phần lọc theo một traceId, cấu hình timeout và retry của từng service, và metric Prometheus 19:55–20:10.`,
  artifacts: [
    {
      name: 'logs-trace-6721d0a8.json',
      lang: 'text',
      content: `{"@timestamp":"2026-10-22T20:01:12.204+07:00","level":"INFO","service":"api-gateway","thread_name":"reactor-http-epoll-3","logger_name":"vn.shopvn.gateway.AccessLogFilter","traceId":"6721d0a87c3e4b19a2f05d8e1c6b7a34","spanId":"a2f05d8e1c6b7a34","message":"POST /api/checkout/orders/ORD-26102201873/pay route=checkout-service user=U-5512093"}
{"@timestamp":"2026-10-22T20:01:12.219+07:00","level":"INFO","service":"checkout-service","thread_name":"http-nio-8080-exec-131","logger_name":"vn.shopvn.checkout.PayOrderService","traceId":"6721d0a87c3e4b19a2f05d8e1c6b7a34","spanId":"3b1c8e0f9a7d2264","message":"pay order=ORD-26102201873 amount=1250000 method=VBK_DEBIT"}
{"@timestamp":"2026-10-22T20:01:12.241+07:00","level":"INFO","service":"payment-service","thread_name":"http-nio-8080-exec-77","logger_name":"vn.shopvn.payment.PaymentService","traceId":"6721d0a87c3e4b19a2f05d8e1c6b7a34","spanId":"e47a19c03d5b8f10","message":"created payment=PAY-9F3A21 order=ORD-26102201873 status=PENDING"}
{"@timestamp":"2026-10-22T20:01:12.260+07:00","level":"INFO","service":"bank-adapter","thread_name":"http-nio-8080-exec-188","logger_name":"vn.shopvn.bank.VbkClient","traceId":"6721d0a87c3e4b19a2f05d8e1c6b7a34","spanId":"5d0e6b2a91c4f7e3","message":"VBK debit request ref=PAY-9F3A21 amount=1250000"}
{"@timestamp":"2026-10-22T20:01:14.902+07:00","level":"INFO","service":"payment-service","thread_name":"http-nio-8080-exec-12","logger_name":"vn.shopvn.payment.WalletController","traceId":"6721d0a9a12b7c40e5d3f81b0c9a2e57","spanId":"e5d3f81b0c9a2e57","message":"balance user=U-7781020 took 9874 ms"}
{"@timestamp":"2026-10-22T20:01:22.205+07:00","level":"WARN","service":"api-gateway","thread_name":"reactor-http-epoll-3","logger_name":"o.s.c.g.h.DefaultErrorWebExceptionHandler","traceId":"6721d0a87c3e4b19a2f05d8e1c6b7a34","spanId":"a2f05d8e1c6b7a34","message":"[9c1e4f02-118] 504 GATEWAY_TIMEOUT \"Response took longer than timeout: PT10S\" for HTTP POST \"/api/checkout/orders/ORD-26102201873/pay\""}
{"@timestamp":"2026-10-22T20:01:42.231+07:00","level":"WARN","service":"checkout-service","thread_name":"http-nio-8080-exec-131","logger_name":"vn.shopvn.checkout.RetryEventLogger","traceId":"6721d0a87c3e4b19a2f05d8e1c6b7a34","spanId":"3b1c8e0f9a7d2264","message":"2026-10-22T20:01:42.230+07:00: Retry 'payment', waiting PT0.5S until attempt '1'. Last attempt failed with exception 'org.springframework.web.client.ResourceAccessException: I/O error on POST request for \"http://payment-service/v1/payments\": Read timed out'."}
{"@timestamp":"2026-10-22T20:01:42.744+07:00","level":"INFO","service":"payment-service","thread_name":"http-nio-8080-exec-164","logger_name":"vn.shopvn.payment.PaymentService","traceId":"6721d0a87c3e4b19a2f05d8e1c6b7a34","spanId":"77c2a0d51e9b3f48","message":"created payment=PAY-9F3A77 order=ORD-26102201873 status=PENDING"}
{"@timestamp":"2026-10-22T20:01:42.761+07:00","level":"INFO","service":"bank-adapter","thread_name":"http-nio-8080-exec-23","logger_name":"vn.shopvn.bank.VbkClient","traceId":"6721d0a87c3e4b19a2f05d8e1c6b7a34","spanId":"0b9e4d7c2a6f1185","message":"VBK debit request ref=PAY-9F3A77 amount=1250000"}
{"@timestamp":"2026-10-22T20:01:47.072+07:00","level":"INFO","service":"bank-adapter","thread_name":"http-nio-8080-exec-188","logger_name":"vn.shopvn.bank.VbkClient","traceId":"6721d0a87c3e4b19a2f05d8e1c6b7a34","spanId":"5d0e6b2a91c4f7e3","message":"VBK debit response ref=PAY-9F3A21 code=00 (SUCCESS) took 34812 ms"}
{"@timestamp":"2026-10-22T20:01:47.090+07:00","level":"INFO","service":"payment-service","thread_name":"http-nio-8080-exec-77","logger_name":"vn.shopvn.payment.PaymentService","traceId":"6721d0a87c3e4b19a2f05d8e1c6b7a34","spanId":"e47a19c03d5b8f10","message":"payment=PAY-9F3A21 status=SUCCESS"}
{"@timestamp":"2026-10-22T20:01:47.093+07:00","level":"WARN","service":"payment-service","thread_name":"http-nio-8080-exec-77","logger_name":"o.s.w.s.m.s.DefaultHandlerExceptionResolver","traceId":"6721d0a87c3e4b19a2f05d8e1c6b7a34","spanId":"e47a19c03d5b8f10","message":"Failure in @ExceptionHandler ... org.apache.catalina.connector.ClientAbortException: java.io.IOException: Broken pipe"}
{"@timestamp":"2026-10-22T20:02:12.746+07:00","level":"WARN","service":"checkout-service","thread_name":"http-nio-8080-exec-131","logger_name":"vn.shopvn.checkout.RetryEventLogger","traceId":"6721d0a87c3e4b19a2f05d8e1c6b7a34","spanId":"3b1c8e0f9a7d2264","message":"2026-10-22T20:02:12.745+07:00: Retry 'payment', waiting PT0.5S until attempt '2'. Last attempt failed with exception 'org.springframework.web.client.ResourceAccessException: I/O error on POST request for \"http://payment-service/v1/payments\": Read timed out'."}
{"@timestamp":"2026-10-22T20:02:13.262+07:00","level":"INFO","service":"payment-service","thread_name":"http-nio-8080-exec-41","logger_name":"vn.shopvn.payment.PaymentService","traceId":"6721d0a87c3e4b19a2f05d8e1c6b7a34","spanId":"c81f0e3b6a2d9947","message":"created payment=PAY-9F3B02 order=ORD-26102201873 status=PENDING"}
{"@timestamp":"2026-10-22T20:02:19.588+07:00","level":"INFO","service":"bank-adapter","thread_name":"http-nio-8080-exec-23","logger_name":"vn.shopvn.bank.VbkClient","traceId":"6721d0a87c3e4b19a2f05d8e1c6b7a34","spanId":"0b9e4d7c2a6f1185","message":"VBK debit response ref=PAY-9F3A77 code=00 (SUCCESS) took 36827 ms"}
{"@timestamp":"2026-10-22T20:02:27.790+07:00","level":"WARN","service":"payment-service","thread_name":"http-nio-8080-exec-41","logger_name":"vn.shopvn.payment.BankAdapterClient","traceId":"6721d0a87c3e4b19a2f05d8e1c6b7a34","spanId":"c81f0e3b6a2d9947","message":"bank-adapter call failed payment=PAY-9F3B02: I/O error on POST request for \"http://bank-adapter/v1/debit\": Connect timed out (bank-adapter pool full, accept queue 100/100)"}
{"@timestamp":"2026-10-22T20:02:43.252+07:00","level":"ERROR","service":"checkout-service","thread_name":"http-nio-8080-exec-131","logger_name":"vn.shopvn.checkout.PayOrderService","traceId":"6721d0a87c3e4b19a2f05d8e1c6b7a34","spanId":"3b1c8e0f9a7d2264","message":"pay order=ORD-26102201873 failed after 3 attempts, marking FAILED: Read timed out"}`
    },
    {
      name: 'timeout-config.yml',
      lang: 'text',
      content: `# ---------- api-gateway (application.yml) ----------
spring:
  cloud:
    gateway:
      httpclient:
        connect-timeout: 2000
        response-timeout: 10s

# ---------- checkout-service ----------
clients:
  payment:
    base-url: http://payment-service
    connect-timeout: 2s
    read-timeout: 30s          # "VBK đôi khi chậm, để rộng cho chắc"
resilience4j:
  retry:
    instances:
      payment:
        max-attempts: 3
        wait-duration: 500ms
        retry-exceptions:
          - org.springframework.web.client.ResourceAccessException
server:
  tomcat:
    threads:
      max: 200

# ---------- payment-service ----------
clients:
  bank-adapter:
    connect-timeout: 15s
    read-timeout: 45s
server:
  tomcat:
    threads:
      max: 200                 # dùng chung cho /v1/payments và /v1/wallets/balance

# ---------- bank-adapter ----------
vbk:
  api:
    read-timeout: 60s
server:
  tomcat:
    threads:
      max: 200
    accept-count: 100`
    },
    {
      name: 'prometheus-19h55-20h10.txt',
      lang: 'text',
      content: `# busy = max(tomcat_threads_busy_threads) theo service (max = 200)
# vbk_p99 = histogram_quantile(0.99, http_client_requests_seconds_bucket{client_name="vbk-api"})
# pay_in = rate(http_server_requests_seconds_count{service="payment-service",uri="/v1/payments"}[1m])
# balance_p99 = p99 của GET /v1/wallets/balance (payment-service)
# gw_504 = rate(spring_cloud_gateway_requests_seconds_count{status="GATEWAY_TIMEOUT"}[1m])

time   vbk_p99  busy_bank  busy_pay  busy_checkout  pay_in/s  balance_p99  gw_504/s  pay_order/s
19:55    0.8 s         12        18             25       6.1        45 ms       0.0         6.1
19:58    6.2 s         64        71             60       6.4        48 ms       0.4         6.2
20:00   31.5 s        200       200            182      13.9       9.8 s       38.2         6.0
20:02   34.9 s        200       200            200      17.6      30.0 s      112.5         6.3
20:04    1.1 s        187       200            200      16.8      12.4 s       96.1         6.1
20:06    0.9 s        121       200            194      14.2       6.1 s       41.7         6.2
20:08    0.9 s         40        52             61       7.0        60 ms       3.1         6.0
20:10    0.8 s         14        20             27       6.2        44 ms       0.0         6.1

# Đối soát VBK 23/10: 217 đơn FAILED nhưng có giao dịch ghi nợ SUCCESS
#   153 đơn trừ 1 lần, 51 đơn trừ 2 lần, 13 đơn trừ 3 lần
# Mỗi lần retry, payment-service tạo paymentId mới (PAY-...) và gửi sang VBK với ref = paymentId`
    }
  ],
  questions: [
    'Dựng lại dòng thời gian của trace 6721d0a87c3e4b19a2f05d8e1c6b7a34. Lỗi cấu hình nào khiến một sự cố ở ngân hàng đối tác lan ra toàn bộ luồng thanh toán và cả API số dư ví?',
    'Vì sao khách bị trừ tiền 2–3 lần trong khi đơn ở trạng thái FAILED? Chỉ ra dòng log làm bằng chứng.',
    'Thiết kế lại timeout, retry và cách cô lập lỗi cho chuỗi này. Xử lý 217 đơn bị ảnh hưởng thế nào?'
  ],
  hints: [
    'Liệt kê timeout từ ngoài vào trong: gateway, checkout (nhân với số lần retry), payment, bank-adapter. Lớp ngoài bỏ cuộc lúc nào, còn lớp trong vẫn chờ đến lúc nào?',
    'Theo dõi PAY-9F3A21: ai đang chờ kết quả của nó lúc 20:01:47? Dòng Broken pipe nói gì? Rồi đếm có bao nhiêu paymentId cho cùng ORD-26102201873.',
    'Dùng Little law: số thread bận = tốc độ request × thời gian chờ. Với pay_in khoảng 14–17 request/giây và mỗi request chờ khoảng 35 giây thì cần bao nhiêu thread? Vì sao API số dư ví, vốn không gọi VBK, cũng chết theo?'
  ],
  answer: `**Tóm tắt:** Timeout được cấu hình **ngược chiều**: lớp ngoài cùng bỏ cuộc sớm nhất (gateway 10 giây) trong khi lớp trong chờ lâu hơn (checkout 30 giây × 3 lần, payment 45 giây, bank-adapter 60 giây). Khi VBK chậm khoảng 35 giây, mọi lớp bên trong vẫn giữ thread để làm một việc mà client đã bỏ cuộc từ lâu. Checkout còn retry, nhân tải lên và tạo **paymentId mới** mỗi lần, nên giao dịch cũ vẫn thành công ở VBK. Kết quả là thread pool của cả ba service cạn (lan sang API số dư ví dùng chung pool), và khách bị trừ tiền nhiều lần trong khi đơn bị đánh FAILED.

### Dòng thời gian của trace

| Thời điểm | Sự kiện |
|---|---|
| 20:01:12.204 | Gateway nhận request trả tiền cho ORD-26102201873 |
| 20:01:12.241 | payment-service tạo **PAY-9F3A21**, gọi bank-adapter, bank-adapter gọi VBK |
| 20:01:22.205 | Gateway **504** "Response took longer than timeout: PT10S", app báo thất bại cho khách |
| 20:01:42.231 | checkout hết read-timeout 30 giây, Resilience4j retry (attempt 2) |
| 20:01:42.744 | payment-service tạo **PAY-9F3A77**, ghi nợ lần 2 cho cùng đơn |
| 20:01:47.072 | VBK trả **SUCCESS cho PAY-9F3A21** sau 34,812 ms |
| 20:01:47.093 | payment-service ghi response, nhưng gặp **Broken pipe**: checkout đã đóng kết nối, không còn ai nhận kết quả |
| 20:02:13.262 | Retry lần 3: tạo **PAY-9F3B02** |
| 20:02:19.588 | VBK trả **SUCCESS cho PAY-9F3A77** (36,827 ms), tức lần trừ tiền thứ hai |
| 20:02:27.790 | PAY-9F3B02 không gọi được bank-adapter: {{accept queue 100/100}} |
| 20:02:43.252 | checkout đánh đơn **FAILED** sau 3 lần thử |

Kết quả: một đơn FAILED nhưng có 2 giao dịch ghi nợ SUCCESS ở VBK. Đây đúng là mẫu của 51 đơn bị trừ 2 lần.

### Nguyên nhân gốc

**1. Timeout ngược chiều (outer < inner).** Ngân sách thời gian của gateway là 10 giây, nhưng:
- checkout chờ payment tối đa 30 giây × 3 lần, cộng 2 × 0.5 giây chờ, tức khoảng 91 giây;
- payment chờ bank-adapter 45 giây; bank-adapter chờ VBK 60 giây.

Sau giây thứ 10, mọi công việc phía trong là **công việc vô ích** (không còn ai chờ kết quả) nhưng vẫn chiếm thread. Quy tắc đúng: timeout phải **giảm dần từ ngoài vào trong**, và tổng thời gian kể cả retry của lớp trong phải nhỏ hơn timeout của lớp ngoài.

**2. Thread pool cạn và lan rộng.** Theo Little law: số thread bận = tốc độ đến × thời gian giữ. Lúc 20:02, {{pay_in}} khoảng 17.6 request/giây (6.3 đơn/giây thật, phần còn lại do retry) × khoảng 35 giây ≈ 600 thread cần dùng, trong khi pool chỉ có 200. Kết quả là {{busy_bank}}, {{busy_pay}} và {{busy_checkout}} đều 200/200, và accept queue của bank-adapter đầy. Vì {{/v1/wallets/balance}} dùng chung pool Tomcat của payment-service, nó cũng phải chờ thread: {{balance took 9874 ms}}, {{balance_p99}} lên 30 giây. Khách thanh toán bằng ví (không liên quan VBK) cũng nhận 504. Đây là lỗi thiếu **bulkhead**.

**3. Retry cho thao tác không idempotent.** Mỗi attempt tạo payment mới với {{ref = paymentId}} mới, nên VBK coi đó là các giao dịch khác nhau. Retry sau timeout là trường hợp nguy hiểm nhất: timeout **không có nghĩa là thất bại**, chỉ là "không biết kết quả". PAY-9F3A21 thực tế đã thành công.

**4. Hồi phục chậm.** VBK khỏe lại lúc 20:04 nhưng hệ thống mất đến 20:09 mới ổn, vì các request và retry đang xếp hàng phải chạy hết (busy_pay vẫn 200 lúc 20:06), dù client của chúng đã bỏ đi từ lâu.

### Cách sửa

**Xử lý sự cố và dữ liệu (ngay):**
- Đối chiếu từng đơn với giao dịch VBK theo {{order}} và {{paymentId}}. Đơn có ít nhất một giao dịch SUCCESS: chuyển đơn sang PAID (hoặc hỏi khách muốn giữ đơn hay hoàn tiền). Các giao dịch thừa: hoàn tiền qua API refund của VBK, kèm thông báo cho khách. Ghi lại để báo cáo sự cố.
- Tạm tắt retry của checkout cho {{/v1/payments}}.

**Ngân sách timeout mới (giảm dần, có tính retry):**

| Lớp | Timeout | Ghi chú |
|---|---|---|
| gateway | 10 s | giữ nguyên, là cam kết với app |
| checkout → payment | 8 s, **không retry** cho POST tạo payment | hoặc chỉ retry khi lỗi xảy ra trước khi gửi request (connect fail) |
| payment → bank-adapter | 7 s | connect timeout 1 s thay vì 15 s |
| bank-adapter → VBK | 6 s | nếu quá thì trả trạng thái PENDING, không trả FAILED |

Tốt hơn nữa là truyền **deadline** theo request (ví dụ header chứa thời điểm hết hạn), để mỗi lớp tự tính thời gian còn lại và từ chối ngay khi đã quá hạn, thay vì cấu hình tĩnh ở từng service.

**Idempotency và trạng thái không xác định:**
- Idempotency key là **orderId** (hoặc payment intent id), được truyền tới VBK làm ref, không phải paymentId của từng lần thử. Nếu VBK hỗ trợ, gửi lại cùng ref sẽ bị từ chối là trùng hoặc trả về kết quả cũ.
- Khi timeout: đánh đơn **PENDING/UNKNOWN**, không phải FAILED. Một job hỏi lại trạng thái giao dịch ở VBK (inquiry API) hoặc nhận callback, rồi mới chốt.
- Với ngân hàng chậm, chuyển sang mô hình **bất đồng bộ**: API trả 202 kèm paymentId, app poll trạng thái hoặc nhận push.

**Cô lập lỗi:**
- **Circuit breaker** ở bank-adapter cho VBK (Resilience4j: mở khi tỷ lệ chậm hoặc lỗi vượt ngưỡng), để fail fast và hiển thị "VBK đang bảo trì, vui lòng chọn phương thức khác".
- **Bulkhead**: pool hoặc semaphore riêng cho mỗi ngân hàng đối tác ở bank-adapter, và tách API số dư ví khỏi luồng tạo payment (pool riêng hoặc service riêng).

### Phòng ngừa và alert

- Alert khi p99 của client gọi đối tác vượt 3 giây, khi {{tomcat_threads_busy_threads}} vượt 80% max, và theo tỷ lệ 504 ở gateway.
- Alert nghiệp vụ: số đơn FAILED nhưng có giao dịch ghi nợ SUCCESS, chạy đối soát gần thời gian thực (mỗi 15 phút) thay vì chờ sáng hôm sau.
- Review cấu hình: kiểm tra tự động (lint) rằng timeout của client nhỏ hơn timeout của lớp gọi nó, cộng cả retry.
- Chaos test định kỳ: inject độ trễ 30 giây vào API giả lập ngân hàng trên staging, kiểm tra hệ thống fail fast và không phát sinh ghi nợ trùng.

> Senior tip: Khi review một chuỗi gọi đồng bộ, tôi luôn vẽ bảng "ai chờ ai, chờ bao lâu, retry mấy lần" từ ngoài vào trong. Chín trên mười hệ thống tôi từng gặp có ít nhất một chỗ timeout lớp trong lớn hơn lớp ngoài, thường vì ai đó "nới timeout cho chắc" khi đối tác chậm. Câu cần nhớ: timeout không phải là thất bại. Với tiền, mọi timeout phải dẫn đến trạng thái UNKNOWN và cơ chế hỏi lại, không bao giờ dẫn đến FAILED rồi retry bằng một giao dịch mới.`,
  rubric: [
    'Chỉ ra timeout bị cấu hình ngược: gateway 10s < checkout 30s × 3 lần retry < payment 45s < bank-adapter 60s; sau 10 giây mọi xử lý phía trong là vô ích nhưng vẫn giữ thread.',
    'Giải thích việc cạn thread pool lan truyền (Little law: khoảng 17 req/s × 35 s vượt 200 thread) và API số dư ví chết theo vì dùng chung Tomcat pool (thiếu bulkhead).',
    'Chứng minh trừ tiền nhiều lần từ log: PAY-9F3A21 SUCCESS sau 34,812 ms trong khi checkout đã timeout (Broken pipe), retry tạo PAY-9F3A77 và PAY-9F3B02 với ref mới; đơn bị đánh FAILED.',
    'Đề xuất ngân sách timeout giảm dần từ ngoài vào trong (hoặc truyền deadline), bỏ retry cho POST không idempotent, idempotency key theo orderId, trạng thái PENDING/UNKNOWN kèm inquiry khi timeout.',
    'Đề xuất circuit breaker, bulkhead theo đối tác, xử lý 217 đơn (đối soát, chuyển PAID hoặc hoàn tiền) và alert đối soát gần thời gian thực.'
  ],
  tags: ['timeout', 'cascading-failure', 'retry', 'idempotency', 'bulkhead', 'tracing']
},
{
  id: 'lab-incident-002',
  category: 'incident',
  title: 'Flash sale 12:00: retry không backoff biến 2,400 request thành 27,000 request mỗi giây',
  level: 'senior',
  scenario: `**Bối cảnh:** Sàn **ShopVN** mở flash sale lúc **12:00:00 ngày 20/10/2026**, có mã giảm giá **FLASH1111** (10,000 lượt). Khi đặt hàng, **checkout-service** gọi **voucher-service** để kiểm tra và giữ mã. voucher-service có 8 pod, Tomcat 200 thread và Hikari 30 connection mỗi pod, dữ liệu trên PostgreSQL. Ứng dụng mobile có cơ chế tự gửi lại request khi gặp lỗi 5xx hoặc timeout.

**Triệu chứng:** Từ 12:00:10, voucher-service trả lỗi hàng loạt. Mã FLASH1111 hết lượt lúc 12:02:40, DB hết tranh chấp, nhưng voucher-service **vẫn quá tải**. Lúc 12:06 SRE scale voucher-service lên 16 pod: không cải thiện, pod mới cũng bão hoà ngay. Chỉ khi bật rate limit ở gateway và cờ bỏ qua voucher lúc 12:14, hệ thống mới hồi phục (12:19). Lượng người mua thật ước tính chỉ khoảng 2,400 lượt đặt mỗi giây.

**Dữ liệu thu thập:** Metric Prometheus theo phút và theo 100 ms, log của checkout-service và voucher-service, cấu hình retry ở backend và mobile.`,
  artifacts: [
    {
      name: 'prometheus-flashsale.txt',
      lang: 'text',
      content: `# checkout_in = rate(http_server_requests_seconds_count{service="checkout-service",uri="/v1/orders"}[1m])
# voucher_in  = rate(http_server_requests_seconds_count{service="voucher-service",uri="/v1/vouchers/reserve"}[1m])
# voucher_p99 = p99 phía server của voucher-service (đo đến khi xử lý xong, kể cả khi client đã bỏ đi)
# hikari_pending = sum(hikaricp_connections_pending{service="voucher-service"})

time    checkout_in  voucher_in  voucher_p99  voucher_5xx/s  hikari_pending  pods  db_row_lock_wait
11:59         310         310        18 ms             0               0     8     0
12:00       2,350       2,610       640 ms            12               4     8     1.2 s
12:01       4,920      14,880        4.1 s         3,110             420     8     2.8 s
12:02       5,710      24,300        4.6 s         8,920           1,190     8     3.1 s
12:03       5,790      26,450        4.8 s        10,840           1,350     8     0 s    <- FLASH1111 hết lượt 12:02:40
12:05       5,820      26,900        4.8 s        11,610           1,370     8     0 s
12:07       5,880      27,350        4.7 s        11,920           2,710    16     0 s    <- scale lên 16 pod lúc 12:06
12:10       5,840      27,120        4.8 s        11,780           2,690    16     0 s
12:14       3,000       3,350        410 ms           38              12    16     0 s    <- rate limit gateway 3,000 rps + cờ bỏ qua voucher
12:16       2,980       3,010         95 ms            4               0    16     0 s
12:19       2,100       2,100         22 ms            0               0    16     0 s

# Resilience4j (checkout-service), rate theo giây lúc 12:05
resilience4j_retry_calls_total{name="voucher",kind="successful_without_retry"}      410
resilience4j_retry_calls_total{name="voucher",kind="successful_with_retry"}         280
resilience4j_retry_calls_total{name="voucher",kind="failed_with_retry"}            5130
resilience4j_retry_calls_total{name="voucher",kind="failed_without_retry"}            0

# voucher_in theo từng 100 ms (tổng 8 pod), 12:05:31.0 -> 12:05:33.0
12:05:31.0 11204 | .1 6118 | .2 2407 | .3 1322 | .4 902 | .5 811 | .6 790 | .7 805 | .8 1140 | .9 1401
12:05:32.0 11388 | .1 6002 | .2 2511 | .3 1290 | .4 870 | .5 799 | .6 812 | .7 830 | .8 1108 | .9 1295`
    },
    {
      name: 'logs-checkout-voucher.json',
      lang: 'text',
      content: `{"@timestamp":"2026-10-20T12:05:31.002+07:00","level":"INFO","service":"checkout-service","thread_name":"http-nio-8080-exec-88","traceId":"6714904b2c7d1e0fa93b55e1d02c4e71","message":"reserve voucher code=FLASH1111 user=U-3381204 cart=C-77120934 attempt=1","headers":{"X-Client-Retry":"1"}}
{"@timestamp":"2026-10-20T12:05:31.004+07:00","level":"INFO","service":"voucher-service","thread_name":"http-nio-8080-exec-197","traceId":"6714904b2c7d1e0fa93b55e1d02c4e71","message":"reserve code=FLASH1111 user=U-3381204"}
{"@timestamp":"2026-10-20T12:05:32.004+07:00","level":"WARN","service":"checkout-service","thread_name":"http-nio-8080-exec-88","traceId":"6714904b2c7d1e0fa93b55e1d02c4e71","message":"voucher call failed attempt=1: I/O error on POST request for \"http://voucher-service/v1/vouchers/reserve\": Read timed out"}
{"@timestamp":"2026-10-20T12:05:32.005+07:00","level":"INFO","service":"voucher-service","thread_name":"http-nio-8080-exec-31","traceId":"6714904b2c7d1e0fa93b55e1d02c4e71","message":"reserve code=FLASH1111 user=U-3381204"}
{"@timestamp":"2026-10-20T12:05:32.006+07:00","level":"ERROR","service":"voucher-service","thread_name":"http-nio-8080-exec-197","traceId":"6714904b2c7d1e0fa93b55e1d02c4e71","message":"HikariPool-1 - Connection is not available, request timed out after 1000ms (total=30, active=30, idle=0, waiting=171)"}
{"@timestamp":"2026-10-20T12:05:33.006+07:00","level":"WARN","service":"checkout-service","thread_name":"http-nio-8080-exec-88","traceId":"6714904b2c7d1e0fa93b55e1d02c4e71","message":"voucher call failed attempt=2: I/O error on POST request for \"http://voucher-service/v1/vouchers/reserve\": Read timed out"}
{"@timestamp":"2026-10-20T12:05:34.007+07:00","level":"WARN","service":"checkout-service","thread_name":"http-nio-8080-exec-88","traceId":"6714904b2c7d1e0fa93b55e1d02c4e71","message":"voucher call failed attempt=3: 503 Service Unavailable: \"{\"code\":\"DB_UNAVAILABLE\"}\""}
{"@timestamp":"2026-10-20T12:05:35.008+07:00","level":"WARN","service":"checkout-service","thread_name":"http-nio-8080-exec-88","traceId":"6714904b2c7d1e0fa93b55e1d02c4e71","message":"voucher call failed attempt=4: I/O error on POST request for \"http://voucher-service/v1/vouchers/reserve\": Read timed out"}
{"@timestamp":"2026-10-20T12:05:36.009+07:00","level":"ERROR","service":"checkout-service","thread_name":"http-nio-8080-exec-88","traceId":"6714904b2c7d1e0fa93b55e1d02c4e71","message":"voucher call failed attempt=5, giving up -> HTTP 503 to client"}
{"@timestamp":"2026-10-20T12:05:36.011+07:00","level":"INFO","service":"voucher-service","thread_name":"http-nio-8080-exec-6","traceId":"","message":"actuator health UP (db: UP, diskSpace: UP)"}
{"@timestamp":"2026-10-20T12:05:37.031+07:00","level":"INFO","service":"checkout-service","thread_name":"http-nio-8080-exec-140","traceId":"6714905126a0c3d8e47f19b2a5c0d613","message":"reserve voucher code=FLASH1111 user=U-3381204 cart=C-77120934 attempt=1","headers":{"X-Client-Retry":"2"}}
{"@timestamp":"2026-10-20T12:05:37.033+07:00","level":"INFO","service":"voucher-service","thread_name":"http-nio-8080-exec-54","traceId":"6714905126a0c3d8e47f19b2a5c0d613","message":"reserve code=FLASH1111 user=U-3381204 -> SOLD_OUT (remaining=0)"}`
    },
    {
      name: 'retry-config.txt',
      lang: 'text',
      content: `# ---------- checkout-service: application.yml ----------
clients:
  voucher:
    connect-timeout: 500ms
    read-timeout: 1s
resilience4j:
  retry:
    instances:
      voucher:
        max-attempts: 5
        wait-duration: 0ms              # "khách đang chờ, retry ngay cho nhanh"
        retry-exceptions:
          - org.springframework.web.client.ResourceAccessException
          - org.springframework.web.client.HttpServerErrorException
# (không có circuit breaker cho voucher)

# ---------- voucher-service ----------
spring:
  datasource:
    hikari:
      maximum-pool-size: 30
      connection-timeout: 1000
# Reserve: UPDATE voucher SET remaining = remaining - 1 WHERE code = ? AND remaining > 0
# Lỗi lấy connection -> trả 503 {"code":"DB_UNAVAILABLE"}, không có header Retry-After

# ---------- mobile app: remote config (Firebase) ----------
{
  "checkout": {
    "retry": { "maxAttempts": 3, "delayMs": 1000, "retryOn": [500, 502, 503, 504, "TIMEOUT"] },
    "timeoutMs": 8000
  }
}`
    }
  ],
  questions: [
    'Tính hệ số khuếch đại tải (amplification) từ người dùng đến voucher-service. Chứng minh bằng metric Resilience4j và log của một request.',
    'Vì sao khi FLASH1111 đã hết lượt và DB hết tranh chấp, hệ thống vẫn không tự hồi phục, và scale lên 16 pod cũng không giúp gì? Phân bố request theo 100 ms nói lên điều gì?',
    'Đề xuất sửa ngắn hạn và dài hạn: retry đúng cách, bảo vệ phía server, và xử lý điểm nóng của mã giảm giá.'
  ],
  hints: [
    'Mỗi lớp retry nhân tải với nhau. Mobile thử tối đa 3 lần, checkout thử tối đa 5 lần. Đối chiếu với kind="failed_with_retry": mỗi lần như vậy tốn bao nhiêu request tới voucher-service?',
    'Read timeout 1 giây nhưng voucher_p99 phía server là 4.8 giây: voucher-service vẫn xử lý những request mà client đã bỏ đi. Khi phần lớn công suất dùng cho request vô ích thì sẽ ra sao, kể cả khi nguyên nhân ban đầu đã hết?',
    'Nhìn các dòng 100 ms: vì sao request dồn vào khoảng .0 đến .1 của mỗi giây? Retry không có jitter và flash sale bắt đầu đúng 12:00:00.000.'
  ],
  answer: `**Tóm tắt:** Đây là **retry storm** dẫn đến **metastable failure**. Nguyên nhân ban đầu (tranh chấp lock trên một dòng voucher) chỉ làm chậm khoảng 2–3 giây, nhưng hai lớp retry không backoff, không jitter (mobile 3 lần × checkout 5 lần, chờ 0 ms) nhân tải lên khoảng **11 lần**: 2,400 lượt đặt thật thành khoảng 26,900 request/giây tới voucher-service. Lúc này phần lớn công suất bị dùng cho những request mà client đã bỏ đi, nên hệ thống không tự thoát ra được, kể cả khi nguyên nhân ban đầu đã hết lúc 12:02:40.

### Hệ số khuếch đại

- Từ metric Resilience4j lúc 12:05: số lời gọi logic từ checkout là 410 + 280 + 5,130 = 5,820/s, khớp {{checkout_in 5,820}}. Số request thật tới voucher-service: 410 × 1 + 280 × khoảng 3 + **5,130 × 5** ≈ 26,900/s, khớp {{voucher_in 26,900}}. Có 88% lời gọi thất bại sau khi dùng hết 5 lần thử.
- Từ checkout lên app: 5,820 / 2,400 ≈ 2.4. App gửi lại tối đa 3 lần (header {{X-Client-Retry}} 1 và 2 trong log).
- Tổng cộng: 26,900 / 2,400 ≈ **11.2 lần**, mức tối đa lý thuyết là 3 × 5 = 15.
- Log trace 6714904b...: attempt 1 → 5 cách nhau **đúng 1.001–1.002 giây** (read timeout 1 giây + wait 0 ms), rồi trả 503. Một giây sau, app gửi lại đơn đó với {{X-Client-Retry: 2}}, tạo thêm một chuỗi 5 lần nữa.

### Vì sao không tự hồi phục: metastable failure

1. **Làm việc vô ích:** checkout bỏ cuộc sau 1 giây, nhưng voucher-service vẫn giữ request trong hàng đợi Tomcat và Hikari ({{waiting=171}} trên mỗi pod, {{hikari_pending}} khoảng 1,370), xử lý xong sau khoảng 4.8 giây ({{voucher_p99}}). Gần như mọi kết quả đều bị vứt bỏ, trong khi mỗi request vô ích lại sinh thêm retry.
2. **Vòng phản hồi dương:** chậm → timeout → retry → tải tăng → chậm hơn. Sau 12:02:40, mỗi request chỉ còn là một SELECT/UPDATE nhẹ ({{SOLD_OUT}}), nhưng 27,000 request/giây trên 8 × 30 = 240 connection vẫn vượt công suất. Trạng thái quá tải tự duy trì mà không cần nguyên nhân ban đầu.
3. **Scale không giúp được:** lên 16 pod thì tổng số connection tăng gấp đôi ({{hikari_pending}} tăng lên 2,710), dồn thêm tải lên DB và khiến DB chậm theo. Tải đầu vào lại tỉ lệ với mức độ lỗi, nên thêm năng lực không theo kịp tải do retry tạo ra.
4. **Đồng bộ hoá (thundering herd):** dữ liệu 100 ms cho thấy khoảng 64% request mỗi giây dồn vào 200 ms đầu ({{.0 11204}}, {{.1 6118}}). Flash sale mở đúng 12:00:00.000, mọi retry có chu kỳ cố định 1 giây (1 giây timeout cộng 0 ms chờ, app chờ cố định 1,000 ms), nên các đợt sóng giữ nguyên pha. Mỗi đầu giây là một cú dội tải gấp khoảng 4 lần mức trung bình.
5. Nhiễu cần bỏ qua: health check vẫn {{UP}} (DB vẫn sống, chỉ quá tải); {{db_row_lock_wait}} về 0 từ 12:03. DB không phải nút thắt sau 12:03.

Chỉ khi **cắt tải đầu vào** (rate limit ở gateway 3,000 request/giây và cờ bỏ qua voucher) lúc 12:14, vòng lặp mới bị phá: voucher_in giảm ngay xuống 3,350, p99 về 95 ms sau 2 phút.

### Cách sửa

**Ngắn hạn (playbook khi đang có sự cố):**
- Cắt tải: rate limit ở gateway, bật circuit breaker hoặc cờ tắt tính năng phụ (đặt hàng không dùng voucher, hoặc hiển thị "mã đã hết").
- Tắt retry ở một lớp (remote config cho app: {{maxAttempts}} bằng 1) để giảm hệ số khuếch đại ngay.
- Thông tin "đã hết lượt" nên được chặn ở lớp ngoài cùng: cache cờ SOLD_OUT ở checkout hoặc gateway, không gọi voucher-service nữa.

**Dài hạn: retry đúng cách**
- **Chỉ retry ở một lớp**, thường là lớp gần người dùng nhất hoặc lớp có đủ ngữ cảnh. Không bao giờ để retry lồng retry.
- **Exponential backoff + jitter**, số lần thử ít:

~~~java
RetryConfig voucherRetry = RetryConfig.custom()
        .maxAttempts(2)                                        // 1 lần gọi + 1 lần thử lại
        .intervalFunction(IntervalFunction.ofExponentialRandomBackoff(
                Duration.ofMillis(200), 2.0, 0.5))             // 200ms x 2^n, lệch ngẫu nhiên +-50%
        .retryOnException(e -> e instanceof ResourceAccessException
                && e.getCause() instanceof ConnectException)   // chỉ lỗi xảy ra trước khi gửi request
        .build();                                              // 503/429 và read timeout: không retry
~~~

- **Không retry khi server báo quá tải** (503 hoặc 429). Server trả kèm {{Retry-After}}, client phải tôn trọng.
- **Retry budget**: giới hạn số retry trong một cửa sổ, ví dụ không quá 10% số request thành công. Có thể tự làm bằng token bucket, hoặc dùng cơ chế có sẵn của service mesh.
- **Circuit breaker** (Resilience4j) đặt trước retry: khi tỷ lệ lỗi vượt 50%, mở mạch và fail fast, không sinh thêm tải.

**Dài hạn: bảo vệ phía server**
- **Load shedding:** giới hạn số request đồng thời (concurrency limit) và trả 503 nhanh khi vượt, thay vì xếp hàng 4–5 giây. Bỏ qua request đã quá deadline của client (truyền deadline qua header).
- Tomcat {{accept-count}} và queue nhỏ, Hikari {{connection-timeout}} ngắn phù hợp với deadline.

**Dài hạn: điểm nóng của mã giảm giá**
- Không để 2,400 request/giây cùng UPDATE một dòng. Dùng bộ đếm nguyên tử trên Redis ({{DECR}} hoặc Lua script kiểm tra và trừ), sau đó ghi DB bất đồng bộ. Hoặc chia sẵn 10,000 lượt thành nhiều bucket (sharded counter).
- Mobile: thêm jitter cho đếm ngược (mở nút "Mua" lệch ngẫu nhiên vài trăm ms), xếp hàng chờ (waiting room) cho flash sale lớn.

### Phòng ngừa và alert

- Dashboard và alert **hệ số khuếch đại**: {{voucher_in / checkout_in}} vượt 1.5 trong 2 phút. Tỷ lệ {{failed_with_retry}} trên tổng lời gọi vượt 20%.
- Load test flash sale có mô phỏng lỗi phụ thuộc (inject chậm 3 giây vào voucher), kiểm tra hệ thống tự hồi phục sau khi bỏ lỗi. Đây là bài test cho metastable failure.
- Quy định kiến trúc: mọi cấu hình retry phải được review cùng toàn bộ chuỗi gọi (bảng "lớp nào retry, bao nhiêu lần, chờ bao lâu").

> Senior tip: Khi thấy hệ thống không tự hồi phục dù nguyên nhân gốc đã hết, hãy nghĩ ngay tới metastable failure. Cách thoát duy nhất là **giảm tải đầu vào xuống dưới công suất** (rate limit, tắt retry, tắt tính năng), không phải scale. Tôi luôn đặt một dòng trong runbook: "nếu voucher_in / checkout_in > 2, tắt retry trước, điều tra sau". Ngoài ra, retry với wait bằng 0 và timeout cố định gần như chắc chắn tạo ra sóng đồng bộ. Jitter không phải là trang trí.`,
  rubric: [
    'Tính được hệ số khuếch đại: 410 + 280×3 + 5,130×5 ≈ 26,900 request/giây so với khoảng 2,400 lượt đặt thật (khoảng 11 lần, tối đa 15 = 3 × 5), dẫn chứng log 5 attempt cách nhau 1 giây và X-Client-Retry.',
    'Giải thích metastable failure: server xử lý request mà client đã bỏ (p99 4.8 s so với timeout 1 s), vòng phản hồi dương, nên vẫn quá tải sau khi FLASH1111 hết lượt; scale không giúp vì tải tỉ lệ với lỗi và dồn thêm connection vào DB.',
    'Nhận ra sóng đồng bộ trong dữ liệu 100 ms do retry không có jitter và flash sale bắt đầu cùng một thời điểm.',
    'Đề xuất retry đúng cách: chỉ một lớp, exponential backoff + jitter, không retry 503/429 (tôn trọng Retry-After), retry budget, circuit breaker; cắt tải ở gateway khi đang có sự cố.',
    'Đề xuất bảo vệ phía server (load shedding, concurrency limit, bỏ request quá deadline) và xử lý điểm nóng của mã giảm giá (Redis DECR, sharded counter), kèm alert theo hệ số khuếch đại.'
  ],
  tags: ['retry-storm', 'backoff', 'jitter', 'metastable', 'resilience4j', 'flash-sale']
},
{
  id: 'lab-incident-003',
  category: 'incident',
  title: 'Consumer hạch toán đứng hình: lag Kafka 1.6 triệu, rebalance liên tục',
  level: 'senior',
  scenario: `**Bối cảnh:** Ngân hàng **VNBank** có service **ledger-posting** (Spring Boot 3.2, spring-kafka 3.1, kafka-clients 3.6) đọc topic **payment-events** (24 partition, Kafka 3.6, 3 broker) và gọi API hạch toán của core banking cho từng sự kiện. Idempotency key là {{eventId}}: nếu một sự kiện đã hạch toán, core trả **409 DUPLICATE**. Triển khai 6 pod × concurrency 4 = 24 consumer. Bình thường mỗi lời gọi core mất khoảng 80 ms, lag gần như bằng 0.

**Triệu chứng:** Lúc 09:02 ngày **22/10/2026**, đội core banking rebuild index trên DB hạch toán, latency API tăng lên khoảng 700 ms (dự kiến kéo dài đến cuối ngày). Từ khoảng 09:10, lag tăng liên tục, đến 11:43 đạt hơn **1.6 triệu** message. Khách hàng phản ánh số dư không cập nhật sau khi chuyển tiền. Dashboard cho thấy consumer vẫn "chạy", core banking vẫn nhận khoảng 34 request/giây, CPU pod thấp, không pod nào restart. Một bạn đề xuất tăng lên 12 pod.

**Dữ liệu thu thập:** Hai lần chạy {{kafka-consumer-groups.sh}} cách nhau 30 phút, log của một pod, metric và cấu hình consumer.`,
  artifacts: [
    {
      name: 'kafka-consumer-groups.txt',
      lang: 'text',
      content: `$ date; kafka-consumer-groups.sh --bootstrap-server kafka-1:9092 --describe --group ledger-posting
Thu Oct 22 11:13:05 +07 2026

Warning: Consumer group 'ledger-posting' is rebalancing.

GROUP           TOPIC           PARTITION  CURRENT-OFFSET  LOG-END-OFFSET  LAG             CONSUMER-ID     HOST            CLIENT-ID
ledger-posting  payment-events  0          7180013         7236271         56258           -               -               -
ledger-posting  payment-events  1          7230532         7286385         55853           -               -               -
ledger-posting  payment-events  2          7259034         7314835         55801           -               -               -
ledger-posting  payment-events  3          7310284         7366025         55741           -               -               -
ledger-posting  payment-events  4          7376021         7431159         55138           -               -               -
ledger-posting  payment-events  5          7349896         7405891         55995           -               -               -
ledger-posting  payment-events  6          7344138         7399418         55280           -               -               -
ledger-posting  payment-events  7          7373778         7428669         54891           -               -               -
ledger-posting  payment-events  8          7401560         7457304         55744           -               -               -
ledger-posting  payment-events  9          7318583         7374579         55996           -               -               -
ledger-posting  payment-events  10         7269338         7324440         55102           -               -               -
ledger-posting  payment-events  11         7259740         7314765         55025           -               -               -
ledger-posting  payment-events  12         7282832         7337829         54997           -               -               -
ledger-posting  payment-events  13         7313768         7369483         55715           -               -               -
ledger-posting  payment-events  14         7194069         7249182         55113           -               -               -
ledger-posting  payment-events  15         7302112         7357609         55497           -               -               -
ledger-posting  payment-events  16         7398152         7452993         54841           -               -               -
ledger-posting  payment-events  17         7262589         7318183         55594           -               -               -
ledger-posting  payment-events  18         7303565         7358567         55002           -               -               -
ledger-posting  payment-events  19         7248062         7303376         55314           -               -               -
ledger-posting  payment-events  20         7259817         7315322         55505           -               -               -
ledger-posting  payment-events  21         7235975         7292142         56167           -               -               -
ledger-posting  payment-events  22         7387122         7442785         55663           -               -               -
ledger-posting  payment-events  23         7303898         7359330         55432           -               -               -

$ date; kafka-consumer-groups.sh --bootstrap-server kafka-1:9092 --describe --group ledger-posting
Thu Oct 22 11:43:07 +07 2026

Warning: Consumer group 'ledger-posting' is rebalancing.

GROUP           TOPIC           PARTITION  CURRENT-OFFSET  LOG-END-OFFSET  LAG             CONSUMER-ID     HOST            CLIENT-ID
ledger-posting  payment-events  0          7180013         7249686         69673           -               -               -
ledger-posting  payment-events  1          7230532         7299898         69366           -               -               -
ledger-posting  payment-events  2          7259034         7328437         69403           -               -               -
ledger-posting  payment-events  3          7310284         7379579         69295           -               -               -
ledger-posting  payment-events  4          7376021         7444608         68587           -               -               -
ledger-posting  payment-events  5          7349896         7419212         69316           -               -               -
ledger-posting  payment-events  6          7344138         7413086         68948           -               -               -
ledger-posting  payment-events  7          7373778         7442174         68396           -               -               -
ledger-posting  payment-events  8          7401560         7470861         69301           -               -               -
ledger-posting  payment-events  9          7318583         7388242         69659           -               -               -
ledger-posting  payment-events  10         7269338         7338074         68736           -               -               -
ledger-posting  payment-events  11         7259740         7328184         68444           -               -               -
ledger-posting  payment-events  12         7282832         7351503         68671           -               -               -
ledger-posting  payment-events  13         7313768         7383134         69366           -               -               -
ledger-posting  payment-events  14         7194069         7262706         68637           -               -               -
ledger-posting  payment-events  15         7302112         7370986         68874           -               -               -
ledger-posting  payment-events  16         7398152         7466439         68287           -               -               -
ledger-posting  payment-events  17         7262589         7331852         69263           -               -               -
ledger-posting  payment-events  18         7303565         7372029         68464           -               -               -
ledger-posting  payment-events  19         7248062         7316845         68783           -               -               -
ledger-posting  payment-events  20         7259817         7328867         69050           -               -               -
ledger-posting  payment-events  21         7235975         7305625         69650           -               -               -
ledger-posting  payment-events  22         7387122         7456338         69216           -               -               -
ledger-posting  payment-events  23         7303898         7372905         69007           -               -               -

$ kafka-consumer-groups.sh --bootstrap-server kafka-1:9092 --describe --group ledger-posting --state
GROUP                     COORDINATOR (ID)          ASSIGNMENT-STRATEGY  STATE                #MEMBERS
ledger-posting            kafka-2:9092 (2)          range                PreparingRebalance   21`
    },
    {
      name: 'ledger-posting-5c9d7-wq2x8.log',
      lang: 'text',
      content: `2026-10-22T11:20:02.118+07:00  INFO 1 --- [ledger-posting] [ntainer#0-2-C-1] v.v.ledger.PostingListener               : batch start partition=payment-events-13 records=500 firstOffset=7313768
2026-10-22T11:20:02.833+07:00  INFO 1 --- [ledger-posting] [ntainer#0-2-C-1] v.v.ledger.CoreBankClient                : POST /postings eventId=PE-20261022-0871233 -> 409 DUPLICATE (712 ms)
2026-10-22T11:20:03.541+07:00  INFO 1 --- [ledger-posting] [ntainer#0-2-C-1] v.v.ledger.CoreBankClient                : POST /postings eventId=PE-20261022-0871240 -> 409 DUPLICATE (705 ms)
2026-10-22T11:21:30.004+07:00  INFO 1 --- [ledger-posting] [nio-8080-exec-3] o.s.b.a.health.HealthEndpointSupport     : health status UP (kafka: UP, db: UP)
2026-10-22T11:25:02.130+07:00  WARN 1 --- [ledger-posting] [ ledger-posting] o.a.k.c.c.internals.ConsumerCoordinator  : [Consumer clientId=consumer-ledger-posting-3, groupId=ledger-posting] consumer poll timeout has expired. This means the time between subsequent calls to poll() was longer than the configured max.poll.interval.ms, which typically implies that the poll loop is spending too much time processing messages. You can address this either by increasing max.poll.interval.ms or by reducing the maximum size of batches returned in poll() with max.poll.records.
2026-10-22T11:25:02.131+07:00  INFO 1 --- [ledger-posting] [ ledger-posting] o.a.k.c.c.internals.ConsumerCoordinator  : [Consumer clientId=consumer-ledger-posting-3, groupId=ledger-posting] Member consumer-ledger-posting-3-6f2a9c1e-0d4b-4e8a-b1f7-3c5d9e2a7b10 sending LeaveGroup request to coordinator kafka-2:9092 (id: 2147483645 rack: null) due to consumer poll timeout has expired.
2026-10-22T11:25:02.135+07:00  INFO 1 --- [ledger-posting] [ ledger-posting] o.a.k.c.c.internals.ConsumerCoordinator  : [Consumer clientId=consumer-ledger-posting-3, groupId=ledger-posting] Resetting generation and member id due to: consumer pro-actively leaving the group
2026-10-22T11:25:02.136+07:00  INFO 1 --- [ledger-posting] [ ledger-posting] o.a.k.c.c.internals.ConsumerCoordinator  : [Consumer clientId=consumer-ledger-posting-3, groupId=ledger-posting] Request joining group due to: consumer pro-actively leaving the group
2026-10-22T11:25:51.704+07:00  INFO 1 --- [ledger-posting] [ntainer#0-2-C-1] v.v.ledger.CoreBankClient                : POST /postings eventId=PE-20261022-0871731 -> 409 DUPLICATE (698 ms)
2026-10-22T11:25:52.412+07:00  INFO 1 --- [ledger-posting] [ntainer#0-2-C-1] v.v.ledger.PostingListener               : batch done partition=payment-events-13 records=500 took 350294 ms (created=0, duplicate=500)
2026-10-22T11:25:52.420+07:00 ERROR 1 --- [ledger-posting] [ntainer#0-2-C-1] o.s.k.l.KafkaMessageListenerContainer    : Consumer exception

org.apache.kafka.clients.consumer.CommitFailedException: Offset commit cannot be completed since the consumer is not part of an active group for auto partition assignment; it is likely that the consumer was kicked out of the group.
	at org.apache.kafka.clients.consumer.internals.ConsumerCoordinator.sendOffsetCommitRequest(ConsumerCoordinator.java:1351)
	...
2026-10-22T11:25:52.468+07:00  INFO 1 --- [ledger-posting] [ntainer#0-2-C-1] o.a.k.c.c.internals.ConsumerCoordinator  : [Consumer clientId=consumer-ledger-posting-3, groupId=ledger-posting] Giving away all assigned partitions as lost since generation/memberID has been reset,indicating that consumer is in old state or no longer part of the group
2026-10-22T11:25:52.469+07:00  INFO 1 --- [ledger-posting] [ntainer#0-2-C-1] o.a.k.c.c.internals.ConsumerCoordinator  : [Consumer clientId=consumer-ledger-posting-3, groupId=ledger-posting] Lost previously assigned partitions payment-events-13
2026-10-22T11:25:52.470+07:00  INFO 1 --- [ledger-posting] [ntainer#0-2-C-1] o.s.k.l.KafkaMessageListenerContainer    : ledger-posting: partitions lost: [payment-events-13]
2026-10-22T11:25:52.471+07:00  INFO 1 --- [ledger-posting] [ntainer#0-2-C-1] o.a.k.c.c.internals.ConsumerCoordinator  : [Consumer clientId=consumer-ledger-posting-3, groupId=ledger-posting] (Re-)joining group
2026-10-22T11:25:55.903+07:00  INFO 1 --- [ledger-posting] [ntainer#0-2-C-1] o.a.k.c.c.internals.ConsumerCoordinator  : [Consumer clientId=consumer-ledger-posting-3, groupId=ledger-posting] Successfully joined group with generation Generation{generationId=1874, memberId='consumer-ledger-posting-3-a81e4b07-5c2d-4f19-8e6a-0b3d7c9f1e24', protocol='range'}
2026-10-22T11:25:55.917+07:00  INFO 1 --- [ledger-posting] [ntainer#0-2-C-1] o.a.k.c.c.internals.ConsumerCoordinator  : [Consumer clientId=consumer-ledger-posting-3, groupId=ledger-posting] Successfully synced group in generation Generation{generationId=1874, memberId='consumer-ledger-posting-3-a81e4b07-5c2d-4f19-8e6a-0b3d7c9f1e24', protocol='range'}
2026-10-22T11:25:55.918+07:00  INFO 1 --- [ledger-posting] [ntainer#0-2-C-1] o.a.k.c.c.internals.ConsumerCoordinator  : [Consumer clientId=consumer-ledger-posting-3, groupId=ledger-posting] Adding newly assigned partitions: payment-events-21
2026-10-22T11:25:55.931+07:00  INFO 1 --- [ledger-posting] [ntainer#0-2-C-1] o.a.k.c.c.internals.ConsumerCoordinator  : [Consumer clientId=consumer-ledger-posting-3, groupId=ledger-posting] Setting offset for partition payment-events-21 to the committed offset FetchPosition{offset=7235975, offsetEpoch=Optional[12], currentLeader=LeaderAndEpoch{leader=Optional[kafka-1:9092 (id: 1 rack: null)], epoch=12}}
2026-10-22T11:25:55.932+07:00  INFO 1 --- [ledger-posting] [ntainer#0-2-C-1] o.s.k.l.KafkaMessageListenerContainer    : ledger-posting: partitions assigned: [payment-events-21]
2026-10-22T11:25:56.012+07:00  INFO 1 --- [ledger-posting] [ntainer#0-2-C-1] v.v.ledger.PostingListener               : batch start partition=payment-events-21 records=500 firstOffset=7235975
2026-10-22T11:25:56.719+07:00  INFO 1 --- [ledger-posting] [ntainer#0-2-C-1] v.v.ledger.CoreBankClient                : POST /postings eventId=PE-20261022-0869012 -> 409 DUPLICATE (707 ms)`
    },
    {
      name: 'metrics-and-config.txt',
      lang: 'text',
      content: `# lag = sum(kafka_consumergroup_lag{consumergroup="ledger-posting"})  (kafka-exporter)
# committed/s = sum(rate(kafka_consumergroup_current_offset{consumergroup="ledger-posting"}[5m]))
# tbp_max = max(kafka_consumer_time_between_poll_max)  (ms, Micrometer KafkaClientMetrics)
# rebal/h = sum(increase(kafka_consumer_coordinator_rebalance_total[1h]))

time    in_msg/s  committed/s  core_calls/s  core_409/s        lag  rebal/h   tbp_max  core_p50
08:30      176.0        176.0         176.0         0.0      1,820        0    41,200     80 ms
09:00      182.0        181.0         182.0         0.0      2,140        0    43,050     85 ms
09:30      179.0          0.0          33.9        21.7    218,600       41   351,804    690 ms
10:00      181.0          0.0          33.6        33.5    543,300       44   352,617    710 ms
11:00      180.0          0.0          34.1        34.1  1,191,200       47   351,022    705 ms
11:43      178.0          0.0          34.0        34.0  1,656,392       46   352,310    700 ms

# application.yml (ledger-posting)
spring:
  kafka:
    bootstrap-servers: kafka-1:9092,kafka-2:9092,kafka-3:9092
    consumer:
      group-id: ledger-posting
      enable-auto-commit: false
      auto-offset-reset: earliest
      # max-poll-records: không đặt -> mặc định 500
      properties:
        partition.assignment.strategy: org.apache.kafka.clients.consumer.RangeAssignor
        # max.poll.interval.ms: không đặt -> mặc định 300000
        # session.timeout.ms: không đặt -> mặc định 45000, heartbeat.interval.ms 3000
    listener:
      concurrency: 4
      ack-mode: batch            # commit offset sau khi xử lý xong TOÀN BỘ record của một lần poll()

// PostingListener.java
@KafkaListener(topics = "payment-events")
public void onEvent(PaymentEvent e) {
    coreBankClient.post(e.toPostingRequest());   // đồng bộ, idempotency key = e.eventId(), trùng -> 409
}`
    }
  ],
  questions: [
    'Vì sao lag tăng đúng bằng tốc độ message đến, trong khi core banking vẫn nhận khoảng 34 request/giây từ consumer? Chứng minh bằng hai lần describe và log.',
    'Giải thích chuỗi cơ chế: max.poll.records, max.poll.interval.ms, ack-mode batch, rebalance của RangeAssignor. Vì sao heartbeat vẫn chạy mà consumer vẫn bị đá khỏi group?',
    'Tăng lên 12 pod có giúp không? Đề xuất cách gỡ ngay, cách sửa dài hạn và alert cần có.'
  ],
  hints: [
    'So sánh CURRENT-OFFSET của cùng một partition lúc 11:13 và 11:43. Rồi nhìn metric committed/s và core_409/s.',
    'Mỗi lần poll trả tối đa 500 record, mỗi record mất khoảng 700 ms. Thời gian xử lý một batch là bao nhiêu so với max.poll.interval.ms 300,000 ms? Với ack-mode batch, offset được commit lúc nào?',
    'Topic có 24 partition. Consumer thứ 25 trở đi sẽ làm gì? Và nếu mỗi batch vẫn mất 350 giây thì thêm consumer có giúp commit được không?'
  ],
  answer: `**Tóm tắt:** Consumer group rơi vào **vòng lặp rebalance không có tiến triển (livelock)**. Mỗi lần {{poll()}} trả 500 record, mỗi record mất khoảng 700 ms, nên một batch mất khoảng **350 giây**, vượt {{max.poll.interval.ms}} mặc định 300 giây. Consumer bị đá khỏi group trước khi kịp commit (ack-mode batch chỉ commit khi xong cả batch), partition được giao cho consumer khác, consumer đó bắt đầu lại **từ đúng offset cũ**. Core banking vẫn nhận 34 request/giây nhưng phần lớn là xử lý lại (409 DUPLICATE). Offset không nhích từ khoảng 09:10, nên lag tăng bằng đúng tốc độ message đến (khoảng 180 message/giây).

### Bằng chứng

- **Offset đứng yên:** partition 13 có {{CURRENT-OFFSET 7313768}} ở cả 11:13 và 11:43, và tương tự cho cả 24 partition. Chỉ LOG-END-OFFSET tăng. Tổng lag tăng từ 1,331,664 lên 1,656,392, tức 324,728 trong 1,800 giây, khoảng **180 message/giây**, khớp với {{in_msg/s}}. Metric {{committed/s = 0.0}} từ 09:30.
- **Thời gian giữa hai lần poll:** {{tbp_max}} khoảng 351,000–352,600 ms, vượt 300,000. Log khớp: batch bắt đầu 11:20:02.118, heartbeat thread báo {{consumer poll timeout has expired}} lúc **11:25:02.130**, đúng 300 giây sau. Consumer gửi LeaveGroup, nhưng thread listener vẫn tiếp tục xử lý đến {{batch done ... took 350294 ms}} lúc 11:25:52.
- **Commit thất bại:** {{CommitFailedException: ... the consumer was kicked out of the group}}, sau đó {{Lost previously assigned partitions payment-events-13}}. Toàn bộ 350 giây công sức bị bỏ.
- **Xử lý lại:** batch có {{created=0, duplicate=500}}: cả 500 sự kiện đã được hạch toán từ vòng đầu tiên (khoảng 09:10), mọi vòng sau chỉ nhận 409 từ core. Từ 10:00, {{core_409/s}} gần bằng {{core_calls/s}} (33.5 trên 33.6): gần như 100% lời gọi tới core là việc lặp lại. Sau khi rejoin, consumer nhận payment-events-21 và bắt đầu từ {{offset=7235975}}, đúng bằng CURRENT-OFFSET đang đứng yên trong describe. Vòng lặp lại tiếp tục.
- **Rebalance liên tục:** {{generationId=1874}}, khoảng 41–47 rebalance/giờ, describe luôn báo {{is rebalancing}}, state {{PreparingRebalance}} với 21 member.
- Nhiễu: health {{UP}}, CPU thấp, không restart. Consumer "sống" nhưng không làm được việc có ích.

### Cơ chế

1. **Hai cơ chế phát hiện consumer chết khác nhau.** {{session.timeout.ms}} (45 giây) được kiểm tra bằng heartbeat từ **thread nền**, nên consumer xử lý chậm vẫn gửi heartbeat đều. {{max.poll.interval.ms}} (300 giây) kiểm tra **thread xử lý**: nếu không gọi {{poll()}} trong 300 giây, client coi như thread bị treo và tự rời group. Đây chính là thông điệp WARN trong log.
2. **Ack-mode batch:** với record listener, spring-kafka commit offset sau khi xử lý hết các record từ một lần {{poll()}}. Batch không bao giờ xong trong 300 giây thì không bao giờ commit.
3. **Range assignor là eager rebalance:** mỗi lần một member rời hoặc vào lại, **toàn bộ** group dừng, thu hồi hết partition rồi chia lại. 24 member luân phiên bị đá ra mỗi khoảng 6 phút, nên group gần như lúc nào cũng đang rebalance.
4. **Idempotency cứu dữ liệu nhưng không cứu throughput:** nhờ {{eventId}} nên không hạch toán trùng (không mất tiền), nhưng mỗi lời gọi trùng vẫn tốn 700 ms ở core. Core thực chất đang làm lại cùng một việc.

Trước 09:02: 500 × 80 ms = 40 giây mỗi batch, khớp {{tbp_max 41,200}}, nằm an toàn dưới 300 giây. Lỗi tiềm ẩn từ đầu, sự chậm lên của core chỉ làm nó lộ ra.

### Tăng lên 12 pod có giúp không?

**Không.** Topic có 24 partition, nên tối đa chỉ 24 consumer có việc. 12 pod × 4 = 48 consumer thì 24 consumer ngồi không, đồng thời số member nhiều hơn khiến mỗi lần rebalance chậm hơn. Quan trọng hơn: mỗi batch vẫn mất 350 giây, nên vẫn không commit được. Ngoài ra, kể cả khi hết livelock, công suất tối đa vẫn chỉ khoảng 24 / 0.7 ≈ 34 message/giây, nhỏ hơn 180 message/giây đang đến.

### Cách sửa

**Gỡ ngay (cấu hình, rolling restart):**

~~~yaml
spring:
  kafka:
    consumer:
      max-poll-records: 20                 # 20 x 0.7 s = 14 s mỗi batch, dư rất xa so với giới hạn
      properties:
        max.poll.interval.ms: 600000        # thêm biên an toàn khi downstream chậm bất thường
~~~

Sau khi đổi, offset sẽ bắt đầu nhích. Khoảng 500 sự kiện đầu mỗi partition vẫn phải gọi lại core và nhận 409 (mỗi lời gọi khoảng 700 ms); có thể bỏ qua nhanh hơn nếu consumer tự lưu eventId đã xử lý thành công. Nhưng công suất vẫn chỉ khoảng 34 message/giây, nên cần thêm bước tăng công suất:
- Làm việc với core banking để dùng **API hạch toán theo lô** (ví dụ 50 bút toán mỗi lời gọi) hoặc tạm hoãn việc rebuild index.
- Hoặc xử lý song song trong một partition **theo khoá** (cùng tài khoản thì tuần tự, khác tài khoản thì song song), ví dụ dùng thư viện parallel consumer, vẫn giữ thứ tự theo tài khoản.
- Ưu tiên: hạch toán chậm ảnh hưởng tới số dư khách thấy, nên cần thông báo cho CSKH và hiển thị "giao dịch đang xử lý".

**Dài hạn:**
- Đổi sang {{CooperativeStickyAssignor}} (incremental rebalance): chỉ những partition cần di chuyển mới bị thu hồi, các consumer khác vẫn chạy.
- **Static membership** ({{group.instance.id}} = tên pod): rolling restart không gây rebalance nếu pod quay lại trong {{session.timeout.ms}}.
- Commit thường xuyên hơn (ack-mode {{RECORD}} hoặc {{COUNT}}/{{TIME}}) để giảm lượng việc phải làm lại khi mất partition.
- Khi downstream chậm hoặc lỗi: dùng backoff của error handler, hoặc {{pause()}} container thay vì xử lý quá giới hạn.
- Thiết kế số partition theo công suất cần có: với 700 ms mỗi message và 180 message/giây, cần ít nhất 126 luồng xử lý song song nếu xử lý tuần tự, nên phải dùng xử lý theo lô hoặc song song theo khoá.
- Kiểm tra trước khi đổi số partition: tăng partition làm thay đổi ánh xạ khoá sang partition, ảnh hưởng thứ tự xử lý theo tài khoản trong giai đoạn chuyển tiếp.

### Alert

- Lag theo thời gian chờ (giây), không chỉ theo số message: ví dụ lag / tốc độ đến vượt 60 giây.
- {{committed/s}} bằng 0 trong 5 phút khi vẫn có message đến: đây là dấu hiệu chính xác nhất của livelock.
- {{kafka_consumer_time_between_poll_max}} vượt 70% {{max.poll.interval.ms}}.
- Số rebalance/giờ lớn hơn 0 khi không có deploy.
- Tỷ lệ 409 DUPLICATE của core: nếu cao bất thường nghĩa là đang xử lý lại.

> Senior tip: Với consumer gọi hệ thống bên ngoài, tôi luôn tính trước giá trị {{max.poll.records}} × p99 latency của downstream lúc xấu nhất và giữ nó dưới khoảng một nửa {{max.poll.interval.ms}}. Thông điệp {{consumer poll timeout has expired}} trong log nên được coi là sự cố, không phải warning. Và không bao giờ trả lời "lag cao" bằng cách thêm pod trước khi kiểm tra số partition và việc offset có nhích hay không.`,
  rubric: [
    'Chỉ ra livelock: CURRENT-OFFSET đứng yên giữa 11:13 và 11:43 (ví dụ partition 13 ở 7313768), committed/s = 0, lag tăng đúng khoảng 180 message/giây bằng tốc độ đến.',
    'Giải thích cơ chế: 500 record × khoảng 700 ms = 350 s vượt max.poll.interval.ms 300 s, consumer tự rời group (log poll timeout), CommitFailedException vì ack-mode batch chỉ commit sau cả batch, partition mới bắt đầu lại từ offset cũ (409 DUPLICATE).',
    'Phân biệt session.timeout.ms (heartbeat thread) với max.poll.interval.ms (thread xử lý), và nêu tác động của eager rebalance với RangeAssignor.',
    'Giải thích vì sao thêm pod không giúp: tối đa 24 consumer theo 24 partition, mỗi batch vẫn quá 300 s, công suất khoảng 34 message/giây vẫn nhỏ hơn 180.',
    'Đề xuất: giảm max.poll.records, tăng max.poll.interval.ms, tăng công suất (API theo lô, song song theo khoá), CooperativeStickyAssignor, static membership, commit thường xuyên hơn; alert theo committed rate, time-between-poll, rebalance.'
  ],
  tags: ['kafka', 'consumer-lag', 'rebalance', 'max-poll-interval', 'spring-kafka', 'idempotency']
},
{
  id: 'lab-incident-004',
  category: 'incident',
  title: 'Trang flash sale cứ khoảng 5 phút lại treo 30 giây: cache stampede trên một hot key',
  level: 'senior',
  scenario: `**Bối cảnh:** Trong đợt flash sale ngày **22/10/2026**, trang danh sách sản phẩm của chiến dịch 1111 trên **ShopVN** nhận khoảng **9,000 request/giây**. **product-service** (20 pod, Spring Boot 3.3, Tomcat 200 thread, Hikari 20 connection mỗi pod) cache kết quả bằng Spring Cache trên Redis, TTL 5 phút. Khi cache miss, service chạy một truy vấn join 4 bảng trên PostgreSQL 15 (khoảng 420 ms khi DB rảnh). checkout-service dùng chung cụm DB này.

**Triệu chứng:** Từ 12:00, cứ khoảng 5 phút lại có một đợt 20–40 giây trang flash sale trả lỗi hoặc rất chậm, CPU của DB lên 99%, và **checkout cũng chậm theo** (p99 từ 180 ms lên gần 7 giây). Ngoài các đợt đó, mọi thứ bình thường, hit ratio của cache 99.9%. Một bạn đề xuất "tăng TTL lên 30 phút cho đỡ" và một bạn khác đề xuất "thêm jitter cho TTL".

**Dữ liệu thu thập:** Metric 10 giây quanh đợt 12:05, Redis MONITOR (lấy mẫu vài giây), log ứng dụng, {{pg_stat_activity}} và {{pg_stat_statements}}, mã nguồn và cấu hình cache.`,
  artifacts: [
    {
      name: 'grafana-12h05.txt',
      lang: 'text',
      content: `# hit_ratio = sum(rate(cache_gets_total{cache="flashsale",result="hit"}[10s])) / sum(rate(cache_gets_total{cache="flashsale"}[10s]))
# loads    = số lần chạy truy vấn loadCampaignItems (pg_stat_statements calls, delta 10s)
# tomcat   = sum(tomcat_threads_busy_threads{service="product-service"}) (max 20 x 200 = 4000)
# hikari   = sum(hikaricp_connections_active / hikaricp_connections_pending{service="product-service"}) (max active 400)

time       req/s  hit_ratio  miss/s  loads  product_p99  tomcat  hikari(act/pend)  db_cpu  checkout_p99
12:05:00   9,020     99.9%       9      0        35 ms      180          22/0         31%       180 ms
12:05:10   9,010     99.9%       9      0        34 ms      176          21/0         30%       175 ms
12:05:20   8,240     13.8%   7,100    171       6.2 s     2,960         400/1,712      97%       2.4 s
12:05:30   3,900      0.0%   3,900    112      19.8 s     4,000         400/3,412      99%       6.8 s
12:05:40   4,610     54.6%   2,093    164      21.3 s     4,000         400/2,901      99%       6.9 s
12:05:50   9,870     99.7%      30     58       9.6 s     3,120         397/1,040      93%       3.3 s
12:06:00   9,450     99.9%       9      0       180 ms      410          35/0          44%       240 ms
12:06:10   9,030     99.9%       9      0        36 ms      181          22/0          31%       182 ms

# Các thời điểm hit_ratio rơi xuống dưới 50% trong ngày:
#   11:55:00.0 (job warm-up nạp chiến dịch)   12:00:00.1   12:05:21.4   12:10:58.7   12:16:36.2
# Khoảng cách giữa hai đợt: 5 phút 21.3 giây, 5 phút 37.3 giây, 5 phút 37.5 giây`
    },
    {
      name: 'redis-monitor-and-logs.txt',
      lang: 'text',
      content: `$ redis-cli -h redis-cache-1 MONITOR | grep "campaign:1111"     (lấy mẫu, đã cắt bớt)
1792645521.402114 [0 10.42.6.14:51022] "GET" "flashsale::campaign:1111:items"
1792645521.402131 [0 10.42.7.33:40418] "GET" "flashsale::campaign:1111:items"
1792645521.402159 [0 10.42.5.90:38710] "GET" "flashsale::campaign:1111:items"
1792645521.402188 [0 10.42.6.21:52944] "GET" "flashsale::campaign:1111:items"
... (hàng chục nghìn lệnh GET cùng key trả về nil trong khoảng 22 giây tiếp theo) ...
1792645543.118006 [0 10.42.7.33:40418] "SET" "flashsale::campaign:1111:items" "[\"java.util.ArrayList\",[{\"@class\":\"vn.shopvn.product.FlashSaleItemDto\",\"sku\":\"SKU-88123\",... (98213 bytes)" "PX" "300000"
1792645543.120410 [0 10.42.6.14:51022] "SET" "flashsale::campaign:1111:items" "[\"java.util.ArrayList\",[{\"@class\":\"vn.shopvn.product.FlashSaleItemDto\",\"sku\":\"SKU-88123\",... (98213 bytes)" "PX" "300000"
1792645551.377021 [0 10.42.5.90:38710] "SET" "flashsale::campaign:1111:items" "[\"java.util.ArrayList\",[{\"@class\":\"vn.shopvn.product.FlashSaleItemDto\",\"sku\":\"SKU-88123\",... (98213 bytes)" "PX" "300000"
... (tổng cộng 505 lệnh SET cùng key, cùng nội dung, từ 12:05:43.118 đến 12:05:58.702) ...
1792645558.702233 [0 10.42.6.21:52944] "SET" "flashsale::campaign:1111:items" "[\"java.util.ArrayList\",[{\"@class\":\"vn.shopvn.product.FlashSaleItemDto\",\"sku\":\"SKU-88123\",... (98213 bytes)" "PX" "300000"

# Log product-service (JSON, rút gọn)
{"@timestamp":"2026-10-22T12:05:21.403+07:00","level":"DEBUG","pod":"product-service-7c9f-2xkqp","thread_name":"http-nio-8080-exec-17","message":"cache miss flashsale::campaign:1111:items -> loading"}
{"@timestamp":"2026-10-22T12:05:21.403+07:00","level":"DEBUG","pod":"product-service-7c9f-m81zt","thread_name":"http-nio-8080-exec-102","message":"cache miss flashsale::campaign:1111:items -> loading"}
{"@timestamp":"2026-10-22T12:05:21.404+07:00","level":"DEBUG","pod":"product-service-7c9f-2xkqp","thread_name":"http-nio-8080-exec-88","message":"cache miss flashsale::campaign:1111:items -> loading"}
{"@timestamp":"2026-10-22T12:05:24.880+07:00","level":"INFO","pod":"product-service-7c9f-q4d8n","thread_name":"http-nio-8080-exec-3","message":"GET /v1/products/SKU-77120 200 41 ms"}
{"@timestamp":"2026-10-22T12:05:43.117+07:00","level":"INFO","pod":"product-service-7c9f-m81zt","thread_name":"http-nio-8080-exec-102","message":"loaded campaign=1111 items=312 in 21714 ms"}
{"@timestamp":"2026-10-22T12:05:51.402+07:00","level":"ERROR","pod":"product-service-7c9f-v6jtw","thread_name":"http-nio-8080-exec-140","message":"HikariPool-1 - Connection is not available, request timed out after 30000ms (total=20, active=20, idle=0, waiting=187)"}
{"@timestamp":"2026-10-22T12:05:52.611+07:00","level":"WARN","service":"checkout-service","thread_name":"http-nio-8080-exec-61","message":"slow order insert order=ORD-26102204411 took 6120 ms"}`
    },
    {
      name: 'postgres-and-code.txt',
      lang: 'text',
      content: `-- pg_stat_activity lúc 12:05:35
shop=# SELECT state, coalesce(wait_event_type,'CPU') AS wait, count(*), left(query, 60) AS q
       FROM pg_stat_activity WHERE datname = 'shop' GROUP BY 1, 2, 4 ORDER BY 3 DESC LIMIT 4;
 state  |  wait  | count |                              q
--------+--------+-------+--------------------------------------------------------------
 active | CPU    |   371 | SELECT i.sku, i.flash_price, i.quota, p.name, p.thumbnail, s
 active | LWLock |    29 | SELECT i.sku, i.flash_price, i.quota, p.name, p.thumbnail, s
 active | Lock   |    14 | INSERT INTO orders (id, user_id, total, status, created_at)
 idle   | Client |    46 | COMMIT
(4 rows)

-- pg_stat_statements, 12:00 -> 13:00
shop=# SELECT calls, round(mean_exec_time) AS mean_ms, round(total_exec_time/1000) AS total_s, left(query, 50) AS q
       FROM pg_stat_statements ORDER BY total_exec_time DESC LIMIT 3;
 calls | mean_ms | total_s |                         q
-------+---------+---------+----------------------------------------------------
  6212 |   13870 |   86160 | SELECT i.sku, i.flash_price, i.quota, p.name, p.th
 98114 |     412 |   40423 | INSERT INTO orders (id, user_id, total, status, cr
 31207 |      38 |    1186 | SELECT stock FROM inventory WHERE sku = $1 FOR UPD
(3 rows)

// ===== FlashSaleQueryService.java =====
@Cacheable(cacheNames = "flashsale", key = "'campaign:' + #campaignId + ':items'")
public List<FlashSaleItemDto> getItems(long campaignId) {
    log.debug("cache miss flashsale::campaign:{}:items -> loading", campaignId);
    long t0 = System.nanoTime();
    List<FlashSaleItemDto> items = repo.loadCampaignItems(campaignId);   // join 4 bảng, ~420 ms khi DB rảnh
    log.info("loaded campaign={} items={} in {} ms", campaignId, items.size(), (System.nanoTime() - t0) / 1_000_000);
    return items;
}

// ===== CacheConfig.java =====
@Bean
RedisCacheManager cacheManager(RedisConnectionFactory cf) {
    RedisCacheConfiguration cfg = RedisCacheConfiguration.defaultCacheConfig()
            .entryTtl(Duration.ofMinutes(5))
            .serializeValuesWith(RedisSerializationContext.SerializationPair
                    .fromSerializer(new GenericJackson2JsonRedisSerializer()));
    return RedisCacheManager.builder(cf).cacheDefaults(cfg).enableStatistics().build();
}`
    }
  ],
  questions: [
    'Giải thích cơ chế gây ra các đợt treo định kỳ. Vì sao khoảng cách giữa hai đợt là khoảng 5 phút 37 giây chứ không phải đúng 5 phút?',
    'Mỗi đợt có bao nhiêu lần truy vấn DB thay vì 1? Dẫn chứng từ Redis MONITOR, pg_stat_statements, pg_stat_activity. Vì sao checkout cũng bị ảnh hưởng?',
    'Đánh giá hai đề xuất "tăng TTL 30 phút" và "thêm jitter cho TTL". Bạn sẽ sửa thế nào ngay và về lâu dài?'
  ],
  hints: [
    'Cả trang dùng MỘT key. Khi key hết hạn, mọi request trong khoảng thời gian truy vấn đang chạy đều thấy miss. @Cacheable mặc định không khoá: ai miss thì tự chạy truy vấn.',
    'Đếm số lệnh SET cùng key trong MONITOR và số calls trong pg_stat_statements. Nếu chỉ có một lần nạp mỗi 5 phút thì một giờ cần bao nhiêu lần? Mỗi lệnh SET có tham số PX 300000.',
    'Jitter giúp khi có nhiều key cùng hết hạn một lúc. Ở đây có bao nhiêu key? Hãy nghĩ tới việc làm mới trước khi hết hạn và phục vụ dữ liệu cũ trong lúc làm mới.'
  ],
  answer: `**Tóm tắt:** Đây là **cache stampede** (còn gọi là dogpile hoặc thundering herd) trên **một hot key** {{flashsale::campaign:1111:items}}. Khi key hết hạn, hàng nghìn request đồng thời cùng thấy miss, và vì {{@Cacheable}} không có cơ chế gộp request, mỗi request tự chạy truy vấn nặng. Khoảng 500 truy vấn giống hệt nhau cùng lúc làm CPU của DB lên 99%, mỗi truy vấn mất khoảng 14–21 giây thay vì 420 ms, và checkout dùng chung DB cũng chậm theo.

### Cơ chế

1. Lúc 12:05:21.4 key hết hạn (TTL 5 phút tính từ lệnh SET cuối cùng của đợt trước).
2. Ở 9,000 request/giây, chỉ trong vài mili giây đã có hàng chục request thấy miss: log cho thấy 3 lần {{cache miss ... -> loading}} trong 1 ms trên 2 pod. Mỗi request tự gọi {{repo.loadCampaignItems}}.
3. Hikari giới hạn 20 connection mỗi pod, tức 400 truy vấn đồng thời trên 20 pod: {{hikari 400/3,412}}, {{pg_stat_activity}} có **371 + 29 = 400** session cùng chạy đúng truy vấn đó (371 đang dùng CPU, 29 chờ LWLock). Truy vấn 420 ms trở thành khoảng 21 giây vì 400 truy vấn tranh nhau CPU.
4. Tomcat cạn thread ({{tomcat 4,000}}), request mới phải xếp hàng, product p99 khoảng 20 giây. Các request đã miss trước đó vẫn sẽ chạy truy vấn khi lấy được connection.
5. Truy vấn đầu tiên xong lúc 12:05:43.1 và SET vào Redis, từ đây request mới bắt đầu hit. Nhưng **khoảng 500 loader** đã khởi động trước đó vẫn tiếp tục chạy rồi SET lần lượt đến 12:05:58.7. Mỗi lệnh SET có {{PX 300000}} nên **TTL được đặt lại** theo lệnh SET cuối cùng.
6. Vì vậy lần hết hạn tiếp theo là 12:05:58.7 + 5 phút = **12:10:58.7**, khớp với dữ liệu. Chu kỳ là 5 phút cộng thời gian của đợt stampede (khoảng 37 giây), giải thích vì sao các đợt trôi dần: 12:00:00.1, 12:05:21.4, 12:10:58.7, 12:16:36.2.

### Bằng chứng định lượng

- Redis MONITOR: **505 lệnh SET** cùng key, cùng nội dung (98,213 byte), từ 12:05:43.118 đến 12:05:58.702, nghĩa là 505 lần chạy truy vấn cho một đợt, thay vì 1.
- {{pg_stat_statements}}: **6,212 calls** trong 1 giờ, trong khi chỉ cần khoảng 12 (mỗi 5 phút một lần). Mean **13,870 ms** so với 420 ms bình thường. Tổng thời gian thực thi của truy vấn này là 86,160 giây trong 1 giờ, gấp đôi truy vấn insert order.
- Metric: {{loads}} là 171 + 112 + 164 + 58 = 505, khớp với số SET. hit_ratio 0% lúc 12:05:30, {{db_cpu 99%}}.
- Checkout bị kéo theo: {{INSERT INTO orders}} chờ {{Lock}} và CPU, {{slow order insert ... 6120 ms}}, {{checkout_p99 6.9 s}}. Một cache miss trên trang xem hàng đã làm hỏng luồng đặt hàng, nơi tạo ra doanh thu.
- Nhiễu: {{GET /v1/products/SKU-77120 200 41 ms}} là endpoint khác, có cache riêng, không bị ảnh hưởng.

### Đánh giá các đề xuất

- **Tăng TTL lên 30 phút:** chỉ giảm tần suất từ khoảng 5 phút xuống khoảng 30 phút một lần, mỗi lần vẫn sập 30–40 giây. Đồng thời giá và số lượng còn lại của flash sale có thể cũ tới 30 phút. Không giải quyết gốc.
- **Jitter cho TTL:** hữu ích khi **nhiều key** được nạp cùng lúc rồi cùng hết hạn (ví dụ job warm-up nạp 10,000 sản phẩm lúc 11:55). Ở đây vấn đề là **một key** bị hàng nghìn request đọc đồng thời, nên jitter không thay đổi gì.

### Cách sửa

**Ngắn hạn (deploy trong ngày):**
1. {{@Cacheable(sync = true)}}: Spring gọi {{Cache.get(key, valueLoader)}}, và trong một JVM chỉ một thread chạy loader, các thread khác chờ kết quả. Số truy vấn mỗi đợt giảm từ khoảng 500 xuống tối đa 20 (mỗi pod một), DB chịu được. Lưu ý: đây là khoá trong một JVM, không phải khoá phân tán.
2. **Làm mới trước khi hết hạn (refresh-ahead):** một job {{@Scheduled}} mỗi 60 giây gọi phương thức có {{@CachePut}} cho các chiến dịch đang chạy, TTL vẫn để 5–10 phút làm lưới an toàn. Trong điều kiện bình thường, key không bao giờ hết hạn.

**Dài hạn:**
- **Stale-while-revalidate (logical expiry):** lưu giá trị kèm {{softExpireAt}}, TTL vật lý dài hơn (ví dụ 30 phút). Khi quá {{softExpireAt}}, một request giành khoá phân tán ({{SET lock:campaign:1111 <token> NX PX 10000}}) và làm mới bất đồng bộ; mọi request khác vẫn trả dữ liệu cũ vài giây. Không ai phải chờ DB.

~~~java
CachedValue<List<FlashSaleItemDto>> v = redis.get(key);          // value + softExpireAt
if (v != null && v.softExpireAt().isAfter(Instant.now())) return v.data();
if (v != null) {                                                  // đã cũ: 1 request làm mới, còn lại trả dữ liệu cũ
    if (lock.tryAcquire("lock:" + key, Duration.ofSeconds(10))) refreshAsync(campaignId);
    return v.data();
}
return loadWithLockOrWait(campaignId);                           // chưa có gì: khoá + chờ ngắn
~~~

- **Cache 2 tầng:** Caffeine trong từng pod với {{refreshAfterWrite(30s)}} (làm mới bất đồng bộ, trong lúc đó vẫn trả giá trị cũ) và {{expireAfterWrite(10m)}}, Redis làm tầng 2. Cách này còn giảm 9,000 lệnh GET/giây vào một key Redis duy nhất (hot key cũng làm quá tải một shard Redis).
- **Bảo vệ DB:** truy vấn nặng dùng pool connection riêng và nhỏ (bulkhead), đặt {{statement_timeout}} cho truy vấn đọc, để một tính năng xem hàng không thể chiếm hết DB của checkout. Tối ưu truy vấn (index, bảng tổng hợp sẵn cho chiến dịch).

### Phòng ngừa và alert

- Alert khi {{miss/s}} của một cache tăng đột biến (ví dụ trên 100 lần mức nền) hoặc hit ratio dưới 90% trong 30 giây.
- Alert khi {{calls}} của truy vấn nạp cache trong {{pg_stat_statements}} vượt ngưỡng mỗi phút (bình thường khoảng 0.2 lần/phút).
- Nhận diện mẫu "lỗi theo chu kỳ đều đặn" trên dashboard: chu kỳ gần bằng TTL gần như luôn là stampede.
- Load test có tình huống cố ý xoá hot key ({{DEL}}) khi đang chịu tải cao.

> Senior tip: Với mọi key "nóng" (trang chủ, flash sale, cấu hình), câu hỏi đầu tiên tôi đặt ra là: "Khi key này biến mất ở lúc tải cao nhất thì điều gì xảy ra?" Câu trả lời chấp nhận được duy nhất là "chỉ một tiến trình đi nạp lại, các tiến trình khác vẫn dùng dữ liệu cũ". TTL nên là lưới an toàn, không phải cơ chế làm mới chính. Và hãy nhớ mỗi lệnh SET sẽ đặt lại TTL: nhiều loader cùng ghi sẽ làm chu kỳ lỗi trôi đi, đây là manh mối rất tốt khi đọc dashboard.`,
  rubric: [
    'Nhận diện cache stampede trên một hot key: key hết hạn, @Cacheable không khoá nên mọi request miss đều tự chạy truy vấn nặng; 400 truy vấn giống nhau cùng lúc (giới hạn bởi Hikari 20 × 20 pod) làm DB lên 99%.',
    'Dẫn chứng định lượng: 505 lệnh SET cùng key trong MONITOR, loads 171+112+164+58 = 505, pg_stat_statements 6,212 calls/giờ so với khoảng 12 cần thiết, mean 13,870 ms so với 420 ms.',
    'Giải thích chu kỳ khoảng 5 phút 37 giây: mỗi lệnh SET với PX 300000 đặt lại TTL theo lệnh SET cuối của đợt trước; và giải thích vì sao checkout chậm theo (dùng chung DB).',
    'Phản biện đúng: tăng TTL chỉ giảm tần suất và làm dữ liệu cũ hơn; jitter chỉ giúp khi nhiều key cùng hết hạn, không giúp với một hot key.',
    'Đề xuất: sync=true (khoá trong JVM), refresh-ahead hoặc stale-while-revalidate kèm khoá phân tán, cache 2 tầng (Caffeine refreshAfterWrite), bulkhead và statement_timeout cho DB; alert theo miss rate và số lần chạy truy vấn nạp cache.'
  ],
  tags: ['cache-stampede', 'redis', 'hot-key', 'spring-cache', 'postgresql', 'flash-sale']
},
{
  id: 'lab-incident-005',
  category: 'incident',
  title: 'Service gửi webhook restart mỗi 25 phút: Too many open files và 62 nghìn socket CLOSE_WAIT',
  level: 'senior',
  scenario: `**Bối cảnh:** Cổng thanh toán **PayHub** có service **merchant-notify** (Spring Boot 3.2, JDK 17, Apache HttpClient 5.2) gửi webhook kết quả thanh toán tới khoảng 3,000 merchant qua HTTPS. Webhook lỗi được gửi lại theo lịch backoff. Có 4 pod, giới hạn file descriptor của container là 65,536. Tháng 8, service từng gặp lỗi hết connection trong pool khi gửi webhook ({{ConnectionRequestTimeoutException}}). Cách xử lý lúc đó là tăng {{maxConnTotal}} và {{maxConnPerRoute}} lên 50,000.

**Triệu chứng:** Ngày **23/10/2026**, từ khoảng 11:06, merchant-notify không nhận request mới, log đầy {{Too many open files}}, liveness probe thất bại và pod bị restart lúc 11:09. Sau restart pod chạy bình thường khoảng 25 phút rồi lặp lại. CPU, heap, GC đều bình thường. Lúc 10:41, merchant lớn **M-0042** deploy bản mới và endpoint webhook của họ bắt đầu trả **HTTP 500**.

**Dữ liệu thu thập:** Output {{ss}} và {{/proc}} trong pod lúc 11:07 (trước khi bị restart), metric, log, và mã nguồn gửi webhook.`,
  artifacts: [
    {
      name: 'ss-proc-1107.txt',
      lang: 'text',
      content: `$ kubectl -n payment exec merchant-notify-58d7c-9wq4t -- sh -c 'ss -s'
Total: 65444
TCP:   65478 (estab 3385, closed 52, orphaned 0, timewait 47)

Transport Total     IP        IPv6
RAW       0         0         0
UDP       1         1         0
TCP       65426     65426     0
INET      65427     65427     0
FRAG      0         0         0

$ ss -tanp state close-wait | head -6
Recv-Q Send-Q      Local Address:Port        Peer Address:Port  Process
0      0              10.42.7.31:48122      112.213.89.40:443   users:(("java",pid=1,fd=40211))
0      0              10.42.7.31:48130      112.213.89.40:443   users:(("java",pid=1,fd=40219))
0      0              10.42.7.31:39954      103.97.125.18:443   users:(("java",pid=1,fd=1877))
0      0              10.42.7.31:48144      112.213.89.40:443   users:(("java",pid=1,fd=40233))
0      0              10.42.7.31:48151      112.213.89.40:443   users:(("java",pid=1,fd=40240))

$ ss -tan state close-wait | awk 'NR>1 {split($4,a,":"); print a[1]}' | sort | uniq -c | sort -rn | head -6
  58214 112.213.89.40
   1873 103.97.125.18
    611 171.244.62.7
    203 14.225.210.33
     98 42.119.30.150
     61 27.71.233.19

$ ss -tan state close-wait | wc -l
62040

$ ls /proc/1/fd | wc -l
65536

$ grep "open files" /proc/1/limits
Max open files            65536                65536                files

$ getent hosts webhook.m0042-shop.vn
112.213.89.40   webhook.m0042-shop.vn`
    },
    {
      name: 'metrics-and-logs.txt',
      lang: 'text',
      content: `# pod merchant-notify-58d7c-9wq4t (khởi động lại gần nhất trước sự cố: 19/10 22:10)
# fds    = process_files_open_files ; max = process_files_max_files = 65536
# leased = httpcomponents_httpclient_pool_total_connections{state="leased"}
# avail  = httpcomponents_httpclient_pool_total_connections{state="available"}
# m42_5xx = rate(webhook_delivery_total{merchant="M-0042",outcome="http_5xx"}[1m])

time    webhook/s  m42_5xx/s     fds   leased  avail  heap_used  cpu
10:00       212.4        0.0   4,250    3,790    205     612 MB  0.21
10:30       209.9        0.0   4,331    3,871    211     598 MB  0.20
10:40       214.1        0.0   4,357    3,897    209     631 MB  0.21
10:45       215.0       40.6  13,828   13,368    208     640 MB  0.24
10:50       214.6       40.8  26,023   25,563    212     655 MB  0.24
10:55       213.8       40.5  38,218   37,758    207     649 MB  0.25
11:00       214.9       40.7  50,413   49,953    213     662 MB  0.25
11:05       215.2       40.6  62,608   62,148    214     670 MB  0.25
11:07        41.3       38.6  65,536   65,079    214     668 MB  0.31

# Log (JSON, rút gọn)
{"@timestamp":"2026-10-23T10:41:07.311+07:00","level":"WARN","thread_name":"notify-worker-7","logger_name":"vn.payhub.notify.WebhookSender","message":"webhook merchant=M-0042 event=EV-2310-88120931 status=500"}
{"@timestamp":"2026-10-23T10:41:07.402+07:00","level":"INFO","thread_name":"notify-worker-2","logger_name":"vn.payhub.notify.WebhookSender","message":"webhook merchant=M-1007 event=EV-2310-88120933 status=200 took 84 ms"}
{"@timestamp":"2026-10-23T11:06:12.020+07:00","level":"ERROR","thread_name":"http-nio-8080-Acceptor","logger_name":"org.apache.tomcat.util.net.Acceptor","message":"Socket accept failed","stack_trace":"java.io.IOException: Too many open files\n\tat java.base/sun.nio.ch.Net.accept(Native Method)\n\tat java.base/sun.nio.ch.ServerSocketChannelImpl.implAccept(ServerSocketChannelImpl.java:425)\n\tat java.base/sun.nio.ch.ServerSocketChannelImpl.accept(ServerSocketChannelImpl.java:391)\n\tat org.apache.tomcat.util.net.NioEndpoint.serverSocketAccept(NioEndpoint.java:521)\n\t..."}
{"@timestamp":"2026-10-23T11:06:13.554+07:00","level":"ERROR","thread_name":"notify-worker-4","logger_name":"vn.payhub.notify.WebhookSender","message":"webhook merchant=M-1007 event=EV-2310-88544102 failed","stack_trace":"java.net.SocketException: Too many open files\n\tat java.base/sun.nio.ch.Net.socket0(Native Method)\n\tat java.base/sun.nio.ch.Net.socket(Net.java:524)\n\tat java.base/sun.nio.ch.NioSocketImpl.create(NioSocketImpl.java:480)\n\t..."}
{"@timestamp":"2026-10-23T11:06:14.008+07:00","level":"INFO","thread_name":"scheduling-1","logger_name":"vn.payhub.notify.RetryScheduler","message":"rescheduled 1,204 failed webhooks (next attempt +5m)"}

# kubectl get events
11:08:51  Warning  Unhealthy  pod/merchant-notify-58d7c-9wq4t  Liveness probe failed: Get "http://10.42.7.31:8080/actuator/health/liveness": context deadline exceeded (Client.Timeout exceeded while awaiting headers)
11:09:31  Normal   Killing    pod/merchant-notify-58d7c-9wq4t  Container app failed liveness probe, will be restarted`
    },
    {
      name: 'WebhookSender.java',
      lang: 'text',
      content: `@Configuration
class HttpClientConfig {
    @Bean(destroyMethod = "close")
    CloseableHttpClient webhookHttpClient() {
        PoolingHttpClientConnectionManager cm = PoolingHttpClientConnectionManagerBuilder.create()
                .setMaxConnTotal(50_000)            // tháng 8: tăng từ 200 lên để "hết lỗi pool"
                .setMaxConnPerRoute(50_000)         // tăng từ 20
                .setDefaultConnectionConfig(ConnectionConfig.custom()
                        .setConnectTimeout(Timeout.ofSeconds(3))
                        .setSocketTimeout(Timeout.ofSeconds(10))
                        .build())
                .build();
        return HttpClients.custom().setConnectionManager(cm).build();
    }
}

@Component
class WebhookSender {
    private final CloseableHttpClient httpClient;

    DeliveryResult deliver(Merchant m, WebhookEvent ev) throws IOException {
        HttpPost post = new HttpPost(m.webhookUrl());
        post.setHeader("X-PayHub-Signature", signer.sign(ev));
        post.setEntity(new StringEntity(json(ev), ContentType.APPLICATION_JSON));

        CloseableHttpResponse resp = httpClient.execute(post);
        int code = resp.getCode();
        if (code >= 200 && code < 300) {
            EntityUtils.consume(resp.getEntity());     // đọc hết body -> connection trả về pool
            return DeliveryResult.ok(code);
        }
        log.warn("webhook merchant={} event={} status={}", m.id(), ev.id(), code);
        return DeliveryResult.retryLater(code);        // nhánh lỗi: không đọc body, không close response
    }
}`
    }
  ],
  questions: [
    'File descriptor đang bị dùng vào đâu? Giải thích trạng thái CLOSE_WAIT nghĩa là gì và phía nào đang "có lỗi".',
    'Tìm dòng code gây leak và chứng minh bằng mối liên hệ giữa các artifact (thời điểm, tốc độ tăng, địa chỉ peer, metric pool). Vì sao lần "sửa" hồi tháng 8 làm sự cố tệ hơn?',
    'Đề xuất sửa ngắn hạn, dài hạn và alert. Restart theo liveness probe có phải là cách giảm nhẹ chấp nhận được không?'
  ],
  hints: [
    'CLOSE_WAIT nghĩa là phía bên kia đã gửi FIN (đóng kết nối) và kernel đã ACK, nhưng ứng dụng phía mình CHƯA gọi close() trên socket. Socket ở trạng thái này có thể tồn tại mãi.',
    'Đổi IP 112.213.89.40 ra tên miền. Từ 10:41, fds tăng khoảng 12,200 mỗi 5 phút, tức khoảng 40 mỗi giây. So sánh với m42_5xx/s và với leased.',
    'Trong HttpClient 5 classic, một connection chỉ quay về pool khi response được close hoặc entity được đọc hết. Pool giới hạn 20 connection mỗi route sẽ báo lỗi gì khi bị leak, và pool 50,000 thì sao?'
  ],
  answer: `**Tóm tắt:** {{WebhookSender.deliver}} **không đóng response ở nhánh lỗi** (status khác 2xx). Mỗi webhook nhận 500 từ M-0042 làm một connection bị giữ ở trạng thái leased vĩnh viễn trong pool. Sau khoảng 75 giây không hoạt động, server của merchant đóng kết nối, socket phía mình chuyển sang **CLOSE_WAIT** và vẫn giữ file descriptor. Với khoảng 40 webhook lỗi mỗi giây, process dùng hết 65,536 FD trong khoảng 25 phút: Tomcat không accept được kết nối mới, liveness probe thất bại, pod bị restart, rồi chu kỳ lặp lại.

### CLOSE_WAIT nghĩa là gì

Khi bên kia đóng kết nối (gửi FIN), kernel phía mình ACK và đưa socket vào CLOSE_WAIT, **chờ ứng dụng gọi close()**. Kernel không có timeout cho trạng thái này. Vì vậy hàng nghìn CLOSE_WAIT gần như luôn là **bug của chính ứng dụng mình** (quên đóng), không phải lỗi mạng hay lỗi của merchant. Ngược lại, TIME_WAIT là trạng thái bình thường của bên chủ động đóng và tự hết sau một khoảng thời gian; ở đây chỉ có {{timewait 47}}, không đáng kể.

### Dẫn chứng

- {{ls /proc/1/fd | wc -l}} bằng **65536**, đúng bằng {{Max open files 65536}}.
- {{ss -tan state close-wait | wc -l}} là 62,040, tức **62,039 socket** (trừ dòng header). Trong đó **58,214** tới **112.213.89.40**, và {{getent hosts}} cho thấy đây là {{webhook.m0042-shop.vn}}. Các peer khác (1,873, 611, ...) là leak tích luỹ chậm từ ngày 19/10 do các merchant khác thỉnh thoảng trả lỗi.
- {{ss -tanp}}: các socket CLOSE_WAIT đều thuộc {{"java",pid=1}} với fd lên tới 40,211 trở lên.
- **Thời điểm và tốc độ:** fds đứng ở khoảng 4,300 cho tới 10:40, rồi tăng đều **khoảng 12,200 mỗi 5 phút, tức khoảng 40.6/giây** từ 10:41, khớp với {{m42_5xx/s}} khoảng 40 và log đầu tiên {{webhook merchant=M-0042 ... status=500}} lúc 10:41:07. (65,536 − 4,357) / 40.6 ≈ 1,507 giây, khoảng 25 phút tính từ 10:41:07, khớp với thời điểm bắt đầu {{Too many open files}} lúc 11:06 và chu kỳ restart 25 phút.
- **Pool:** {{leased}} tăng cùng nhịp với fds (luôn thấp hơn fds khoảng 460, lên 65,079 lúc 11:07), trong khi {{avail}} đứng yên khoảng 210. Connection được mượn nhưng không bao giờ trả. 65,079 = 62,039 CLOSE_WAIT + khoảng 3,040 connection tới M-0042 vẫn ESTABLISHED (leak trong 75 giây gần nhất, server chưa đóng).
- **Hậu quả:** Tomcat {{Socket accept failed ... Too many open files}} (không nhận được request mới, kể cả probe), HttpClient không tạo được socket mới tới merchant khác ({{M-1007 ... SocketException: Too many open files}}), webhook/s giảm còn 41. Kubelet báo liveness thất bại và restart pod.
- Nhiễu: CPU, heap ổn định, GC không liên quan. GC không cứu được vì pool (singleton) vẫn tham chiếu mạnh tới các connection đang leased.

### Code gây lỗi

~~~java
CloseableHttpResponse resp = httpClient.execute(post);
if (code >= 200 && code < 300) {
    EntityUtils.consume(resp.getEntity());   // chỉ nhánh 2xx trả connection
    return DeliveryResult.ok(code);
}
return DeliveryResult.retryLater(code);      // nhánh lỗi: connection bị leased mãi mãi
~~~

Trong HttpClient 5 classic, connection chỉ được trả về pool khi **entity được đọc hết** hoặc **response được close**. Nhánh 5xx không làm điều nào. Nếu có exception giữa chừng ({{signer}}, {{getCode}}), connection cũng bị leak.

### Vì sao "sửa" hồi tháng 8 làm tệ hơn

Với giới hạn cũ 20 connection mỗi route, leak này sẽ biểu hiện là **pool của route đó hết** sau 20 lần lỗi: chỉ webhook tới merchant lỗi bị {{ConnectionRequestTimeoutException}}, các merchant khác vẫn bình thường, và lỗi chỉ ra đúng vị trí. Tăng lên 50,000 đã **che đi triệu chứng** và đổi một lỗi cục bộ, dễ chẩn đoán thành lỗi toàn cục: cạn FD của process, sập luôn API inbound và webhook của 3,000 merchant. Giới hạn pool vốn là một bulkhead.

### Cách sửa

**Ngắn hạn (hotfix):** luôn đóng response bằng try-with-resources, hoặc tốt hơn là dùng API có response handler (HttpClient 5 tự đóng và trả connection về pool):

~~~java
DeliveryResult deliver(Merchant m, WebhookEvent ev) throws IOException {
    HttpPost post = buildPost(m, ev);
    return httpClient.execute(post, response -> {          // HttpClientResponseHandler
        int code = response.getCode();
        EntityUtils.consume(response.getEntity());          // đọc bỏ body (giới hạn kích thước nếu cần)
        return (code >= 200 && code < 300) ? DeliveryResult.ok(code) : DeliveryResult.retryLater(code);
    });                                                       // connection luôn được giải phóng, kể cả khi có exception
}
~~~

Trong lúc chờ deploy: tạm dừng gửi webhook tới M-0042 (circuit breaker thủ công) và báo cho merchant.

**Dài hạn:**
- Trả giới hạn pool về mức hợp lý (ví dụ tổng 500, mỗi route 20). Pool cạn ở một route là tín hiệu, không phải lỗi cần che.
- Cấu hình dọn connection: {{evictExpiredConnections()}} và {{evictIdleConnections(TimeValue.ofSeconds(30))}} trên builder, và time-to-live cho connection, để socket idle được đóng chủ động.
- **Circuit breaker và bulkhead theo merchant:** một merchant lỗi không được chiếm tài nguyên dùng chung. Merchant lỗi liên tục thì giãn lịch retry và tạm ngưng sau N lần.
- Đặt ứng dụng vào môi trường test có fault injection: merchant giả lập trả 500, 404, timeout, đóng kết nối giữa chừng, kiểm tra FD không tăng.
- Đặt giới hạn FD đủ dư nhưng **không coi việc tăng ulimit là giải pháp**: tăng lên 1 triệu chỉ dời thời điểm sập từ 25 phút lên vài giờ.

### Restart theo liveness probe có chấp nhận được không?

Đó là lý do hệ thống "tự hồi phục" mỗi 25 phút, nhưng là cách giảm nhẹ rất tệ: mỗi lần restart làm rơi webhook đang gửi và request inbound, các webhook bị gửi lại có thể khiến merchant nhận trùng (merchant phải xử lý idempotent theo event id), và sự cố bị che đi. Chỉ nên dùng như biện pháp tạm thời có chủ đích (rolling restart theo lịch) trong lúc chờ hotfix.

### Alert

- {{process_files_open_files / process_files_max_files}} vượt 70%, và tốc độ tăng dương liên tục 15 phút.
- Số socket CLOSE_WAIT theo pod (node exporter hoặc script đếm {{ss}}) vượt vài trăm.
- {{httpcomponents_httpclient_pool_total_connections}} với state="leased" tăng mà không giảm, hoặc gần bằng max.
- Tỷ lệ 5xx theo merchant: một merchant lỗi hàng loạt phải được thấy riêng, không bị gộp vào tổng.

> Senior tip: Khi thấy nhiều CLOSE_WAIT, hãy nhóm theo peer address bằng {{ss}} rồi đối chiếu với code gọi tới peer đó. Gần như chắc chắn có một nhánh (thường là nhánh lỗi hoặc exception) không đóng response, stream hay connection. Quy tắc tôi áp dụng trong review: mọi {{CloseableHttpResponse}}, {{InputStream}}, {{ResultSet}} phải nằm trong try-with-resources, hoặc dùng API dạng callback để thư viện tự đóng. Và đừng bao giờ "sửa" lỗi hết pool bằng cách tăng kích thước pool trước khi chứng minh được không có leak.`,
  rubric: [
    'Giải thích đúng CLOSE_WAIT: phía remote đã đóng (FIN), ứng dụng mình chưa gọi close(), socket giữ FD vô thời hạn; là lỗi của ứng dụng chứ không phải của mạng hay merchant.',
    'Dẫn chứng: 65,536 FD bằng limit, 62,039 CLOSE_WAIT trong đó 58,214 tới 112.213.89.40 (webhook.m0042-shop.vn), fds tăng 40/giây từ 10:41 khớp m42_5xx/s, leased tăng cùng nhịp với avail không đổi, hết FD sau khoảng 25 phút.',
    'Chỉ đúng code: nhánh status không phải 2xx không consume entity và không close response nên connection bị leased mãi; GC không cứu được vì pool giữ tham chiếu.',
    'Giải thích việc tăng maxConnTotal và maxConnPerRoute lên 50,000 đã che leak và biến lỗi cục bộ của một route thành cạn FD toàn process.',
    'Đề xuất: try-with-resources hoặc response handler, trả lại giới hạn pool, evict idle và expired connection, circuit breaker theo merchant, alert theo FD, CLOSE_WAIT và pool leased; nêu vì sao restart theo liveness hay tăng ulimit không phải giải pháp.'
  ],
  tags: ['close-wait', 'file-descriptor', 'httpclient', 'connection-leak', 'webhook', 'linux']
}
,{id:'lab-incident-006',category:'incident',title:'Hikari pool cạn do transaction chờ HTTP',level:'senior',scenario:`@Transactional cập nhật tồn kho rồi gọi risk API chậm 28 giây. Hikari pool 20 connection cạn, cả endpoint đọc cũng lỗi dù DB CPU 18%.`,artifacts:[{name:'app.log',lang:'text',content:`14:00:01.108 INFO [http-nio-8080-exec-17] UPDATE stock sku=A-17; 14:00:01.111 POST risk /score; 14:00:29.113 timeout 28000ms; 14:03 Hikari total=20 active=20 idle=0 waiting=31; 17 PostgreSQL sessions idle in transaction wait_event=Client; request rate=1.8/s; risk p99=28s; CPU=18%.`}],questions:['Vì sao pool cạn dù DB CPU thấp?','Đề xuất sửa luồng và ứng phó.'],hints:['HTTP nằm trong transaction.','Little law: 1.8×28≈50 connection.'],answer:`**Tóm tắt:** Transaction giữ connection suốt lời gọi risk API; 20 request chờ lâu làm pool cạn và 31 request xếp hàng.
### Bằng chứng
Log ghi UPDATE rồi HTTP, PostgreSQL idle in transaction; Hikari active 20, idle 0. Theo Little law 1.8 req/s × 28s cần khoảng 50 connection.
### Sửa
- Tách transaction: ghi PENDING/outbox rồi commit, gọi risk ngoài transaction, transaction mới chốt kết quả; dùng saga/bù tồn kho.
- Giới hạn tải, timeout, circuit breaker và bulkhead; xử lý idempotent.
- Theo dõi connection hold time, pending và transaction age.
> Senior tip: Query time thấp nhưng connection hold time cao thường là I/O ngoài DB trong transaction.`,rubric:['Nêu transaction giữ connection và idle in transaction','Tính ~50 nhu cầu so với pool 20','Đề xuất transaction ngắn/outbox','Nêu idempotency và timeout/breaker','Nêu metrics pending/hold time'],tags:['hikari','transaction']},
{id:'lab-incident-007',category:'incident',title:'Kafka rebalance do batch vượt max poll interval',level:'senior',scenario:`Kafka consumer xử lý tuần tự batch 500 record, mỗi record có thể chờ tax API 30 giây. Lag tăng và group rebalance liên tục.`,artifacts:[{name:'consumer.log',lang:'text',content:`09:14:02 poll returned 500 records; 09:14:32 timeout INV-8801; 09:15:02 timeout INV-8802; 09:17:02 poll interval exceeded; revoked invoice-0,invoice-1; 09:17:04 assigned invoice-2,invoice-3; lag=184220; max.poll.records=500 max.poll.interval.ms=300000 session.timeout.ms=45000 heartbeat.interval.ms=15000.`}],questions:['Giải thích rebalance và phân biệt heartbeat.','Sửa batch, offset, lỗi downstream.'],hints:['500×30s vượt 300s.','Heartbeat không thay thế poll.'],answer:`**Tóm tắt:** Batch có thể mất 15.000 giây giữa hai poll, vượt max.poll.interval.ms 300 giây. Consumer bị loại, partition revoke và rebalance; record chưa commit có thể phát lại.
### Phân tích
Log thể hiện poll 500 record, timeout rồi cảnh báo interval. Heartbeat giữ session sống; max poll interval giới hạn thời gian ứng dụng không poll.
### Sửa
- Giảm batch theo p99, giới hạn timeout/retry.
- Worker bounded có backpressure; commit offset theo thứ tự partition.
- Side effect idempotent, lỗi dai dẳng chuyển retry topic/DLQ; tăng interval chỉ sau đo đạc.
- Theo dõi poll interval, rebalance, lag và offset chưa commit.
> Senior tip: Định cỡ batch theo worst case, không chỉ latency trung bình.`,rubric:['Tính 500×30s vượt 300s','Phân biệt heartbeat/max poll','Nêu replay do offset chưa commit','Giảm batch/worker bounded/commit đúng thứ tự','Idempotency và retry topic'],tags:['kafka','rebalance']},
{id:'lab-incident-008',category:'incident',title:'ThreadLocal MDC giữ payload trên worker pool',level:'senior',scenario:`Heap tăng sau deploy, log mang requestId cũ. Filter đặt MDC và RequestContext ThreadLocal nhưng không dọn ở mọi nhánh.`,artifacts:[{name:'heap.log',lang:'text',content:`After Full GC: dominator Thread -> threadLocals -> Entry -> RequestContext retained=612MiB entries=184 body=2.8MiB; 16:19:55 [http-nio-8080-exec-7] requestId=R-9812 /upload; 16:19:56 same thread /health header absent but requestId=R-9812; filter has try chain.doFilter catch rethrow and no finally.`}],questions:['Giải thích leak và requestId cũ.','Sửa exception và async thế nào?'],hints:['Worker thread sống lâu hơn request.','Dọn trong finally.'],answer:`**Tóm tắt:** ThreadLocal value gắn với worker sống lâu; thiếu cleanup giữ payload và MDC rò requestId qua request kế tiếp.
### Bằng chứng
MAT chỉ đường Thread→threadLocals→RequestContext, retained 612MiB/184 entries; cùng worker ghi requestId cũ dù header vắng mặt.
### Sửa
Đặt {{MDC.clear()}} và {{RequestContextHolder.reset()}} trong finally, không lưu body/credential. Async cần truyền context tường minh hoặc capture/restore/clear bằng executor decorator. Test exception rồi request mới trên worker tái sử dụng.
> Senior tip: Context thread pool cần quy ước capture, restore, clear; MDC contamination có thể rò dữ liệu.`,rubric:['Nêu lifecycle ThreadLocal và thiếu finally','Dẫn heap dump và log cũ cùng worker','Cleanup finally','Async propagation an toàn, tránh PII','Đề xuất worker reuse test'],tags:['threadlocal','mdc']},
{id:'lab-incident-009',category:'incident',title:'Retry storm khuếch đại lỗi catalog',level:'lead',scenario:`Order, pricing và DB proxy cho phép tối đa ba attempts mỗi tầng, tính cả lần gọi đầu. Catalog chậm; attempts tăng mạnh dù user traffic không đổi.`,artifacts:[{name:'retry-metrics.txt',lang:'text',content:`max attempts per layer=3 (including initial attempt); no jitter/budget/breaker; 14:00 user=100/s catalog=100/s p99=80ms errors=.2%; 14:02 user=101/s catalog=901/s p99=1500ms errors=31%; 14:03 user=98/s catalog=1044/s p99=1800ms errors=42%; 14:06 user=100/s catalog=109/s.`}],questions:['Tính retry amplification.','Thiết kế lại retry và bảo vệ downstream.'],hints:['Ba tầng, tối đa 3 attempts mỗi tầng: 3×3×3=27 downstream calls cho một logical request nếu mọi lần đều retry.','Ingress ổn định, downstream tăng >10 lần; số đo thực tế không nhất thiết đạt worst case.'],answer:`**Tóm tắt:** Ba tầng cho phép tối đa 3 attempts mỗi tầng, tính cả lần đầu, nên một logical request có thể tạo tới 27 downstream calls. Khi catalog chậm, retry không có jitter/budget góp phần đẩy catalog từ 100 lên 1.044 attempts/s dù user traffic ổn định.
### Phân tích
P99 tăng 80ms lên 1.8s, lỗi 42%; retry chồng request làm concurrency và queue tăng.
### Sửa
- Chỉ một tầng retry, tối đa 2–3 attempt, exponential backoff full jitter, lỗi transient và thao tác idempotent.
- Truyền deadline, retry budget, bulkhead, circuit breaker và load shedding.
- Dùng idempotency key; dashboard tách logical request khỏi physical attempt.
> Senior tip: Theo dõi amplification ratio để phát hiện retry storm sớm.`,rubric:['Tính 27 attempts','Dẫn user traffic ổn định/cat 1044/s','Một tầng retry, jitter, giới hạn','Deadline/budget/bulkhead/breaker','Idempotency và metrics logical/physical'],tags:['retry-storm','circuit-breaker']}
);
// APPEND_END
