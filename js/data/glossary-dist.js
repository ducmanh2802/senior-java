/*
 * Glossary (window.GLOSSARY): hard terms are auto-linked inside every .md block; click opens a modal (js/core/glossary.js).
 * { id: "idempotency-key",                 // kebab-case, unique across all glossary-*.js
 *   term: "Idempotency key",               // display name
 *   aliases: ["idempotency key", "idempotency-key"],   // lowercase phrases matched in text (2+ chars, longest wins)
 *   short: "1 câu giải thích dễ hiểu",       // tooltip / first line of the modal
 *   body: `markup (AGENTS.md mục 5): ### Ví dụ đời thường, ### Cơ chế, ~~~text sơ đồ ASCII ~~~, ### Khi nào dùng, ### Hay nhầm với`,
 *   refs: [{ type: "video"|"doc"|"article", title, url, note? }],   // 1-3, link THẬT, kiểm tra bằng node scripts/check-links.mjs
 *   related: ["retry", "payment-intent"] } // ids of other glossary entries
 */
(window.GLOSSARY = window.GLOSSARY || []).push(
  {
    id: 'idempotency',
    term: 'Idempotency',
    aliases: ['idempotency', 'idempotent', 'tính idempotent', 'tính bất biến lặp'],
    short: 'Gọi lại cùng một thao tác nhiều lần vẫn cho kết quả như chỉ gọi một lần.',
    body: `### Ví dụ đời thường
Bạn bấm nút gọi thang máy ba lần vì tưởng máy chưa nhận. Thang máy vẫn chỉ đến một lần, không đến ba lần. Một thao tác như vậy là idempotent: lặp lại không tạo thêm tác dụng phụ.

### Cơ chế
Về toán, f(f(x)) = f(x). Trong hệ thống, ta quan tâm tác dụng phụ chứ không chỉ giá trị trả về:
- Thao tác đọc như GET thường idempotent vì không đổi dữ liệu.
- PUT cập nhật cả object về một trạng thái xác định nên lặp lại vẫn vậy.
- POST tạo mới thường không idempotent: gọi hai lần tạo hai bản ghi.
- DELETE có thể idempotent về kết quả cuối (bản ghi đã mất), dù lần hai trả 404.

Muốn biến POST thành idempotent, server cần một khóa do client gửi lên, lưu khóa cùng kết quả đã xử lý, và khi gặp lại khóa thì trả lại kết quả cũ thay vì chạy lại. Cách khác là dùng ràng buộc duy nhất trong database, ví dụ unique(order_id) trên bảng thanh toán, để lần ghi thứ hai bị từ chối.

~~~text
Client                Server                     Kho khóa
  |-- POST key=K ------->|                           |
  |                      |-- tìm K ----------------->| chưa có
  |                      |-- xử lý, lưu K + kết quả ->|
  |<-- 201, kết quả -----|                           |
  |-- POST key=K ------->|                           |
  |                      |-- tìm K ----------------->| đã có
  |<-- 200, kết quả cũ --|                           |
~~~

Idempotency không tự có khi retry qua nhiều tầng. Nếu gateway, service và client cùng retry, một yêu cầu có thể chạy ba lần. Chỉ nên retry ở một tầng; mọi thao tác ghi tiền phải có khóa hoặc dedupe.

### Khi nào dùng
Bắt buộc với thanh toán, tạo đơn, trừ kho, gửi email, xử lý message và mọi API có retry. Thao tác chỉ đọc hoặc ghi đè toàn bộ trạng thái thường đã có tính chất này.

### Hay nhầm với
Idempotency không đồng nghĩa exactly-once. Nó chỉ nói lặp lại vô hại; message vẫn có thể được giao nhiều lần, miễn consumer xử lý idempotent. Đừng nhầm với "an toàn": GET không đổi dữ liệu, còn DELETE idempotent nhưng vẫn phá hủy dữ liệu.`,
    refs: [
      { type: 'doc', title: 'Stripe: Idempotent requests', url: 'https://docs.stripe.com/api/idempotent_requests' },
      { type: 'article', title: 'AWS Builders Library: Timeouts, retries and backoff with jitter', url: 'https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/' },
    ],
    related: ['idempotency-key', 'retry', 'at-least-once', 'exactly-once'],
  },
  {
    id: 'idempotency-key',
    term: 'Idempotency key',
    aliases: ['idempotency key', 'idempotency-key', 'idempotencykey', 'idempotency keys', 'khóa idempotency'],
    short: 'Mã do người gửi tạo để máy chủ nhận ra lần gửi lặp và không xử lý hai lần.',
    body: `### Ví dụ đời thường
Khi gửi bưu phẩm, bạn điền mã vận đơn do mình tạo trước. Nếu nhân viên nhập lại cùng mã, hệ thống biết đây là cùng một kiện hàng chứ không phải kiện mới, dù bạn mang đến quầy hai lần.

### Cơ chế
Client tạo một giá trị duy nhất cho mỗi thao tác logic, thường là UUID, và gửi trong header Idempotency-Key. Server lưu khóa cùng với trạng thái và kết quả:
1. Thử INSERT vào bảng idempotency với unique(scope, key). Nếu trùng, đọc bản ghi cũ.
2. Nếu bản ghi cũ đang xử lý, trả 409 hoặc chờ; nếu đã xong, trả lại đúng status và body cũ.
3. Nếu là khóa mới, xử lý nghiệp vụ trong cùng transaction với bản ghi khóa khi có thể.
4. Nếu cùng khóa nhưng payload khác, từ chối bằng 422 để tránh client vô tình dùng lại khóa.

Khóa phải có phạm vi: thường là cặp merchant_id và key. Cần thời gian sống, ví dụ 24 giờ, và phải lưu cả response để lần gọi lại không chạy lại tác dụng phụ.

~~~text
POST /payments
Idempotency-Key: 7f3c...

INSERT (merchant, key, hash_payload)
   |-- trùng key, payload giống --> trả kết quả đã lưu
   |-- trùng key, payload khác  --> 422
   |-- key mới                  --> xử lý, lưu kết quả
~~~

Có hai cách triển khai: lưu khóa trước rồi mới xử lý (trạng thái pending, an toàn khi crash nhưng phức tạp), hoặc xử lý và lưu trong cùng transaction (đơn giản hơn nếu nghiệp vụ nằm cùng database). Với thanh toán bên thứ ba, thường phải lưu pending và đối soát lại khi timeout.

### Khi nào dùng
Dùng cho POST tạo thanh toán, hoàn tiền, tạo đơn, gửi lệnh chuyển khoản, và cho API public có client tự retry. Không cần cho GET hoặc thao tác đã idempotent tự nhiên.

### Hay nhầm với
Không phải correlation id: correlation id để nối log, có thể trùng giữa nhiều thao tác; idempotency key đại diện cho đúng một thao tác ghi. Cũng không phải request id do server sinh, vì server sinh sau khi nhận thì không chặn được lần gửi thứ hai đã tới.`,
    refs: [
      { type: 'doc', title: 'Stripe: Idempotent requests', url: 'https://docs.stripe.com/api/idempotent_requests' },
    ],
    related: ['idempotency', 'retry', 'correlation-id'],
  },
  {
    id: 'payment-intent',
    term: 'Payment intent',
    aliases: ['payment intent', 'payment intents', 'payment-intent', 'ý định thanh toán'],
    short: 'Một bản ghi phía cổng thanh toán theo dõi toàn bộ vòng đời một lần thu tiền.',
    body: `### Ví dụ đời thường
Bạn đặt món ở quán cà phê. Nhân viên tạo một phiếu gọi món, rồi món đi qua các trạng thái: chờ pha, đang pha, xong, đã hủy. Phiếu đó không phải ly cà phê, mà là thứ theo dõi ly cà phê. Payment intent là phiếu như vậy cho một khoản tiền.

### Cơ chế
Payment intent do cổng thanh toán (PSP) quản lý, chứa số tiền, tiền tệ, khách hàng, phương thức thanh toán và trạng thái. Vòng đời điển hình:
- requires_payment_method: mới tạo, chưa có cách trả.
- requires_confirmation: đã gắn phương thức, chờ xác nhận.
- requires_action: cần bước phụ, ví dụ xác thực 3D Secure.
- processing: PSP đang xử lý bất đồng bộ.
- succeeded hoặc canceled: kết thúc.

Client xác nhận bằng client_secret, còn server lắng nghe webhook để biết kết quả cuối. Xác nhận lại cùng một intent là thao tác idempotent nếu dùng đúng khóa; tạo intent mới cho cùng đơn hàng là sai và dễ thu tiền hai lần.

~~~text
Tạo intent --> requires_payment_method
                    |
             gắn thẻ, confirm
                    v
            requires_confirmation
                    |
          +---------+----------+
          v                    v
   requires_action         processing
   (3DS, xác thực)             |
          |                    v
          +--------------> succeeded / canceled
~~~

Điểm quan trọng là trạng thái cuối chỉ đáng tin khi đến từ webhook có chữ ký, không phải từ redirect trình duyệt. Người dùng đóng tab sau khi trả tiền vẫn thành công. Server phải lưu order_id trong metadata để đối soát.

### Khi nào dùng
Dùng khi tích hợp PSP cho thanh toán một lần hoặc lưu thẻ, đặc biệt khi cần 3DS, retry, hoặc xử lý bất đồng bộ. Với mô hình ví điện tử nội bộ, bạn có thể tự xây khái niệm tương đương.

### Hay nhầm với
Payment intent không phải charge hay transaction đã trừ tiền; nó là ý định và có thể sinh nhiều lần thử. Cũng khác order trong hệ thống của bạn: order là nghiệp vụ bán hàng, payment intent là đối tượng của PSP. SetupIntent dùng để lưu phương thức, không thu tiền ngay.`,
    refs: [
      { type: 'doc', title: 'Stripe: Payment Intents', url: 'https://docs.stripe.com/payments/payment-intents' },
      { type: 'doc', title: 'Stripe: Webhooks', url: 'https://docs.stripe.com/webhooks' },
    ],
    related: ['idempotency-key', 'webhook', 'reconciliation', 'chargeback'],
  },
  {
    id: 'retry',
    term: 'Retry',
    aliases: ['retry', 'retries', 'retrying', 'thử lại', 'gọi lại'],
    short: 'Gọi lại một thao tác đã thất bại với hy vọng lần sau thành công.',
    body: `### Ví dụ đời thường
Bạn gọi điện cho khách nhưng thuê bao đang bận. Bạn gọi lại vài lần, giãn thời gian ra, rồi bỏ cuộc và để lại tin nhắn. Nếu gọi liên tục mỗi giây, bạn chỉ làm phiền và tốn công vô ích.

### Cơ chế
Retry chỉ có tác dụng với lỗi tạm thời: timeout, connection reset, HTTP 429, 503, deadlock database. Không retry lỗi vĩnh viễn như 400, 401, 404, 422 vì lần sau vẫn thế. Quy trình đúng:
1. Đặt timeout cho từng lần gọi, ngắn hơn timeout của caller.
2. Chỉ retry thao tác idempotent, hoặc gửi kèm idempotency key.
3. Giới hạn số lần, thường 2 đến 3, và dùng exponential backoff kèm jitter.
4. Chỉ retry ở một tầng; retry chồng nhau làm số lần gọi tăng theo cấp số nhân.
5. Khi hết lượt, trả lỗi rõ ràng hoặc đẩy vào dead letter queue.

~~~text
Lần 1 --timeout--> chờ 100ms + jitter
Lần 2 --503-----> chờ 200ms + jitter
Lần 3 --OK------> dùng kết quả
Lần 4 (nếu có) --> bỏ cuộc, ghi log, đẩy DLQ
~~~

Retry có thể gây bão: hàng nghìn client cùng retry sau một sự cố làm dịch vụ vốn yếu càng sập. Jitter và circuit breaker giúp giảm hiệu ứng này. Với giao dịch tiền, retry không có khóa idempotency là nguyên nhân kinh điển của trừ tiền hai lần.

### Khi nào dùng
Dùng cho lời gọi qua mạng tới dịch vụ có lỗi tạm thời, cho consumer xử lý message, và cho job nền. Không dùng để che lỗi logic hoặc để chờ một dịch vụ đã chết hẳn.

### Hay nhầm với
Retry không thay thế timeout: không có timeout thì một lần gọi có thể treo mãi và không bao giờ tới lượt retry. Cũng khác với circuit breaker: retry cố gắng thêm, breaker ngừng cố gắng khi tỉ lệ lỗi quá cao.`,
    refs: [
      { type: 'article', title: 'AWS Builders Library: Timeouts, retries and backoff with jitter', url: 'https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/' },
    ],
    related: ['exponential-backoff', 'idempotency', 'circuit-breaker', 'dead-letter-queue', 'timeout-budget'],
  },
  {
    id: 'exponential-backoff',
    term: 'Exponential backoff',
    aliases: ['exponential backoff', 'exponential-backoff', 'backoff', 'giãn cách lũy thừa', 'lùi lũy thừa'],
    short: 'Tăng dần thời gian chờ giữa các lần thử lại theo cấp số nhân.',
    body: `### Ví dụ đời thường
Bạn gõ cửa nhà hàng xóm khi họ không nghe. Lần đầu gõ rồi chờ 10 giây, lần sau chờ 20 giây, rồi 40 giây. Chờ lâu dần cho họ thời gian mở cửa, thay vì gõ liên tục.

### Cơ chế
Công thức phổ biến: delay = min(cap, base * 2^attempt). Ví dụ base 100ms, cap 30 giây: 100ms, 200ms, 400ms, 800ms... Nếu tất cả client cùng retry theo cùng lịch, chúng tạo ra từng đợt sóng đúng chu kỳ, gọi là thundering herd. Jitter thêm ngẫu nhiên để phân tán:
- Full jitter: delay = random(0, min(cap, base * 2^attempt)).
- Equal jitter: một nửa cố định, một nửa ngẫu nhiên.
- Decorrelated jitter: delay = random(base, delay_trước * 3), có trần.

Server nên trả Retry-After khi biết thời gian chờ, đặc biệt với 429. Tổng thời gian retry phải nằm trong timeout budget của request, nếu không caller đã bỏ đi mà client vẫn tiếp tục gọi.

~~~text
attempt: 0     1     2     3     4
delay:  0.1s  0.2s  0.4s  0.8s  1.6s
jitter: 0-0.1 0-0.2 0-0.4 0-0.8 0-1.6
        |     |     |     |     |
        +-- phân tán client, tránh dồn cùng lúc --+
~~~

Backoff cố định dễ làm nghẽn lâu hơn vì mọi client vẫn đập cùng nhịp. Backoff quá dài làm tăng tail latency; cần cân bằng với SLO. Với message queue, retry thường dùng delay queue thay vì giữ thread ngủ.

### Khi nào dùng
Dùng cùng retry cho API bên thứ ba, kết nối database, gửi email, webhook delivery và consumer xử lý lỗi tạm thời. Là mặc định khi nhiều client có thể cùng gặp một sự cố.

### Hay nhầm với
Không phải rate limiting: backoff là phản ứng của client sau khi lỗi, rate limiting là giới hạn chủ động của server. Cũng khác retry đơn thuần ở chỗ có chiến lược thời gian, không chỉ đếm số lần.`,
    refs: [
      { type: 'article', title: 'AWS Builders Library: Timeouts, retries and backoff with jitter', url: 'https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/' },
    ],
    related: ['retry', 'rate-limiting', 'timeout-budget'],
  },
  {
    id: 'at-least-once',
    term: 'At-least-once delivery',
    aliases: ['at-least-once', 'at least once', 'at-least-once delivery', 'giao ít nhất một lần'],
    short: 'Mỗi message được giao ít nhất một lần, nhưng có thể bị giao lặp.',
    body: `### Ví dụ đời thường
Người đưa báo chỉ rời đi khi bạn ký nhận. Nếu họ chưa thấy chữ ký, họ có thể đưa lại số báo hôm nay lần nữa. Bạn chắc chắn nhận được báo, nhưng đôi khi nhận hai bản giống nhau.

### Cơ chế
Consumer nhận message, xử lý xong mới gửi xác nhận (ack) hoặc commit offset. Nếu nó chết sau khi xử lý nhưng trước khi ack, broker coi như chưa xử lý và giao lại. Vì vậy hệ quả là không mất message, nhưng có thể lặp.

Điều kiện để an toàn: consumer phải idempotent. Với database, dùng unique constraint hoặc bảng dedupe theo message id. Với nghiệp vụ, dùng trạng thái chuyển một chiều: đơn từ PENDING sang PAID chỉ một lần, lần sau thấy đã PAID thì bỏ qua.

~~~text
Broker --> Consumer: message M
Consumer: xử lý M (ghi DB)
Consumer: crash trước khi ack
Broker --> Consumer khác: giao lại M
Consumer: thấy M đã xử lý --> bỏ qua, ack
~~~

Kafka mặc định là at-least-once nếu commit offset sau khi xử lý. RabbitMQ ack thủ công cũng vậy. Đây là lựa chọn mặc định của đa số hệ thống vì dễ triển khai và không mất dữ liệu. Cái giá là phải chấp nhận trùng lặp và thiết kế dedupe.

Cần phân biệt trùng lặp do giao lại với trùng lặp do producer gửi hai lần. Cả hai đều có thể xảy ra, nên khóa dedupe nên nằm ở phía consumer hoặc tầng nghiệp vụ, không chỉ dựa vào broker.

### Khi nào dùng
Là mặc định cho hầu hết message queue, job nền, đồng bộ dữ liệu và tích hợp giữa service. Chỉ tránh khi nghiệp vụ chịu được mất mát và không chịu được lặp.

### Hay nhầm với
Khác at-most-once ở chỗ không bao giờ mất nhưng có thể lặp. Khác exactly-once ở chỗ không cam kết chỉ một lần; exactly-once thường được xây từ at-least-once cộng idempotency, hoặc từ transaction của broker trong phạm vi hẹp.`,
    refs: [
      { type: 'doc', title: 'Apache Kafka: Message delivery semantics', url: 'https://kafka.apache.org/documentation/#semantics' },
    ],
    related: ['at-most-once', 'exactly-once', 'idempotency', 'consumer-group', 'offset'],
  },
  {
    id: 'at-most-once',
    term: 'At-most-once delivery',
    aliases: ['at-most-once', 'at most once', 'at-most-once delivery', 'giao nhiều nhất một lần'],
    short: 'Mỗi message được giao nhiều nhất một lần, có thể mất nhưng không bao giờ lặp.',
    body: `### Ví dụ đời thường
Bạn thả thiệp mời vào hòm thư mà không xác nhận. Người nhận có thể nhận được, cũng có thể thư thất lạc. Nhưng chắc chắn không ai nhận hai tấm giống hệt, vì bạn chỉ thả một lần.

### Cơ chế
Consumer xác nhận hoặc commit offset trước khi xử lý. Nếu nó chết giữa chừng, broker coi message đã giao và không gửi lại. Một số hệ thống gọi đây là fire-and-forget.

~~~text
Broker --> Consumer: message M
Consumer: ack ngay
Consumer: crash khi đang xử lý
Broker: không giao lại
Kết quả: message có thể chưa được xử lý
~~~

Ưu điểm là không bao giờ trùng, đơn giản và nhanh. Nhược điểm là mất dữ liệu khi lỗi. Với UDP, gửi log qua syslog, hoặc metric không quan trọng, mất một mẫu chấp nhận được. Với thanh toán hoặc đơn hàng, gần như không bao giờ chấp nhận.

Có thể kết hợp at-most-once với cơ chế bù: nếu mất message thì chạy job đối soát định kỳ để phát hiện và sửa. Khi đó tính chất giao hàng không còn thuần at-most-once ở mức nghiệp vụ, nhưng tầng message vẫn vậy.

### Khi nào dùng
Dùng cho telemetry, log, metric, thông báo không quan trọng, hoặc khi trùng lặp gây hại hơn mất mát. Cũng dùng khi nguồn dữ liệu có thể đọc lại từ nơi khác.

### Hay nhầm với
Khác at-least-once ở hướng đánh đổi: mất thay vì lặp. Không nên nhầm với "gửi một lần" trong exactly-once, vì exactly-once còn phải bảo đảm không mất trong phạm vi đã cam kết.`,
    refs: [
      { type: 'doc', title: 'Apache Kafka: Message delivery semantics', url: 'https://kafka.apache.org/documentation/#semantics' },
    ],
    related: ['at-least-once', 'exactly-once', 'dead-letter-queue'],
  },
  {
    id: 'exactly-once',
    term: 'Exactly-once delivery',
    aliases: ['exactly-once', 'exactly once', 'exactly-once delivery', 'giao đúng một lần'],
    short: 'Mỗi message được xử lý đúng một lần, không mất và không lặp.',
    body: `### Ví dụ đời thường
Bạn chuyển 100 nghìn cho bạn. Điều bạn muốn không phải "ít nhất một lần" hay "nhiều nhất một lần", mà tài khoản kia tăng đúng 100 nghìn và tài khoản bạn giảm đúng 100 nghìn, dù mạng chập chờn thế nào.

### Cơ chế
Exactly-once thật sự từ đầu đến cuối là cực khó vì mỗi tầng có lỗi riêng. Cách hiểu thực dụng: exactly-once effect = at-least-once delivery + idempotent processing. Broker có thể giao lặp, nhưng consumer khử trùng để tác dụng phụ chỉ xảy ra một lần.

Một số broker hỗ trợ transaction:
- Kafka idempotent producer gắn sequence number để loại trùng khi retry.
- Kafka transaction ghi nhiều partition và offset trong một transaction, consumer đọc isolation.level=read_committed.
- Flink dùng checkpoint và hai pha để đạt exactly-once trong nội bộ pipeline.

Ngay cả khi vậy, side effect ra ngoài như gửi email hay gọi API ngân hàng vẫn cần idempotency key. Không có phép màu nào bảo đảm một lời gọi HTTP bên ngoài chỉ chạy một lần nếu bên kia không hợp tác.

~~~text
Producer --(retry, seq=5)--> Broker
Broker lưu seq=5 một lần
Consumer đọc read_committed
   --> xử lý + ghi kết quả trong transaction
   --> commit offset cùng transaction
Kết quả: không mất, không lặp trong phạm vi broker
~~~

Chi phí: throughput thấp hơn, độ phức tạp cao, phụ thuộc tính năng của broker. Với hệ thống chỉ cần "không trùng" ở mức nghiệp vụ, idempotency key thường rẻ và đáng tin hơn.

### Khi nào dùng
Dùng khi trùng lặp gây thiệt hại tài chính hoặc sai lệch số liệu, và khi bạn kiểm soát được toàn bộ pipeline. Với tích hợp qua HTTP tới bên thứ ba, hãy coi nó là at-least-once kèm dedupe.

### Hay nhầm với
Không đồng nghĩa với "giao một lần" ở tầng mạng. Cũng khác idempotency: idempotency là tính chất của thao tác, exactly-once là cam kết về số lần tác dụng phụ. Trong thực tế, exactly-once thường được xây bằng idempotency.`,
    refs: [
      { type: 'doc', title: 'Apache Kafka: Message delivery semantics', url: 'https://kafka.apache.org/documentation/#semantics' },
    ],
    related: ['at-least-once', 'at-most-once', 'idempotency-key', 'transactional-outbox'],
  },
  {
    id: 'dead-letter-queue',
    term: 'Dead letter queue',
    aliases: ['dead letter queue', 'dead-letter queue', 'dead letter queues', 'dlq', 'hàng đợi thư chết'],
    short: 'Nơi giữ những message xử lý mãi không được để người vận hành xem lại.',
    body: `### Ví dụ đời thường
Bưu điện có một ngăn riêng cho những lá thư không giao được: địa chỉ sai, người nhận đã chuyển đi, tem thiếu. Thay vì ném đi, họ giữ lại để điều tra và xử lý sau.

### Cơ chế
Khi consumer nhận message và xử lý thất bại quá số lần cho phép, broker chuyển message sang một queue khác thay vì retry vô hạn. Các tham số điển hình:
- maxReceiveCount: số lần thử tối đa trước khi vào DLQ.
- Message retention: giữ DLQ bao lâu, ví dụ 14 ngày.
- Redrive: đưa message từ DLQ trở lại queue chính sau khi sửa lỗi.
- Alarm khi DLQ có message mới, nếu không nó chỉ là nghĩa địa im lặng.

Message trong DLQ phải giữ nguyên body, header, lý do lỗi và số lần thử. Với Kafka không có DLQ built-in, thường dùng một topic riêng và một consumer ghi lỗi vào đó.

~~~text
Queue chính --lỗi--> retry 1 --> retry 2 --> retry 3
                                                |
                                                v
                                          Dead letter queue
                                                |
                                   alarm --> người xem --> redrive
~~~

Phân loại lỗi rất quan trọng: lỗi tạm thời nên retry, lỗi dữ liệu vĩnh viễn như JSON sai schema nên vào DLQ ngay, không nên đốt 100 lần thử. Nếu không, message độc (poison message) sẽ chặn cả partition.

### Khi nào dùng
Dùng cho consumer không được phép mất message và cần điều tra lỗi: thanh toán, đồng bộ đơn hàng, webhook, ETL. Cũng dùng để tách lỗi nghiệp vụ khỏi lỗi hạ tầng.

### Hay nhầm với
Không phải retry queue: retry queue giữ message để thử lại sau, DLQ giữ message đã bỏ cuộc. Cũng khác outbox: outbox bảo đảm message được phát đi, còn DLQ xử lý message đã phát nhưng không ai xử lý được.`,
    refs: [
      { type: 'doc', title: 'AWS SQS: Dead-letter queues', url: 'https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-dead-letter-queues.html' },
    ],
    related: ['retry', 'backpressure', 'message-broker', 'consumer-group'],
  },
  {
    id: 'transactional-outbox',
    term: 'Transactional outbox',
    aliases: ['transactional outbox', 'transactional-outbox', 'outbox pattern', 'outbox', 'hộp thư đi'],
    short: 'Ghi dữ liệu nghiệp vụ và message cần gửi trong cùng một transaction database.',
    body: `### Ví dụ đời thường
Bạn viết đơn hàng vào sổ, đồng thời kẹp phiếu giao hàng vào cùng một túi hồ sơ. Nếu túi hồ sơ được lưu thì cả hai cùng có; nếu mất thì cả hai cùng mất. Không bao giờ có chuyện đơn đã ghi mà phiếu giao biến mất.

### Cơ chế
Vấn đề gốc: ghi database và gửi message là hai hệ thống khác nhau, không có transaction chung. Nếu ghi DB xong rồi publish lỗi, hệ thống khác không bao giờ biết. Nếu publish trước rồi ghi DB lỗi, người khác thấy sự kiện không có thật.

Outbox giải quyết bằng cách thêm bảng outbox trong cùng database:
1. Trong một transaction: INSERT/UPDATE bảng nghiệp vụ và INSERT bảng outbox.
2. Một tiến trình relay đọc các dòng chưa gửi, publish lên broker.
3. Đánh dấu đã gửi, hoặc xóa sau khi hết hạn.
4. Consumer phải idempotent vì relay có thể publish lặp.

Relay có hai kiểu: polling định kỳ (đơn giản, có độ trễ) hoặc CDC như Debezium đọc transaction log (gần thời gian thực, không quét bảng).

~~~text
BEGIN
  INSERT orders(...)
  INSERT outbox(event=OrderCreated, payload=...)
COMMIT
        |
        v
Relay/CDC --> Kafka topic --> Consumer
        |
   UPDATE outbox SET sent=true
~~~

Cần dọn bảng outbox để không phình vô hạn, và đảm bảo thứ tự theo aggregate nếu nghiệp vụ cần. Với database sharding, outbox nên nằm cùng shard với dữ liệu để giữ transaction cục bộ.

### Khi nào dùng
Dùng khi cần phát sự kiện đáng tin sau khi thay đổi dữ liệu: tạo đơn, trừ kho, cập nhật thanh toán, đồng bộ giữa service. Là nền tảng cho saga và event-driven mà không cần distributed transaction.

### Hay nhầm với
Không phải 2PC: outbox chỉ dùng transaction cục bộ của một database. Không phải event sourcing: outbox là hộp thư tạm để phát sự kiện, không phải nguồn sự thật của toàn bộ trạng thái. Cũng khác saga: outbox là cơ chế vận chuyển, saga là cách phối hợp nhiều bước nghiệp vụ.`,
    refs: [
      { type: 'doc', title: 'microservices.io: Transactional outbox', url: 'https://microservices.io/patterns/data/transactional-outbox.html' },
    ],
    related: ['two-phase-commit', 'saga', 'event-sourcing', 'message-broker', 'idempotency'],
  },
  {
    id: 'saga',
    term: 'Saga',
    aliases: ['saga', 'sagas', 'saga pattern', 'saga orchestration', 'saga choreography'],
    short: 'Chia một giao dịch dài thành nhiều bước nhỏ, mỗi bước có hành động bù nếu bước sau thất bại.',
    body: `### Ví dụ đời thường
Bạn đặt một tour gồm khách sạn, vé máy bay và xe đưa đón. Nếu vé máy bay hết chỗ sau khi khách sạn đã đặt, bạn phải hủy khách sạn. Không có ai giữ tất cả nhà cung cấp trong một phòng chờ để cam kết cùng lúc.

### Cơ chế
Saga là chuỗi local transaction. Mỗi bước hoàn thành thì phát sự kiện hoặc gọi bước kế. Nếu một bước thất bại, hệ thống chạy các giao dịch bù theo thứ tự ngược để hoàn tác tác dụng trước đó.

Hai kiểu phối hợp:
- Orchestration: một bộ điều phối trung tâm biết toàn bộ quy trình, gọi từng service và quyết định bù. Dễ nhìn, dễ debug, nhưng có điểm tập trung.
- Choreography: mỗi service lắng nghe sự kiện và tự phản ứng. Ít coupling hơn, nhưng khó hình dung luồng khi có nhiều service.

~~~text
Orchestration:
  Saga coordinator
     |-- reserve hotel --> OK
     |-- book flight ---> FAIL
     |-- cancel hotel --> OK
     |-- mark saga FAILED

Choreography:
  OrderCreated --> Payment --OK--> Stock --FAIL--> PaymentRefunded --> OrderCancelled
~~~

Saga không có isolation như ACID. Người dùng có thể thấy trạng thái trung gian, ví dụ tiền đã giữ nhưng đơn chưa xác nhận. Cần semantic lock, trạng thái chờ, idempotency cho từng bước, và retry có kiểm soát. Bước bù cũng có thể thất bại, nên cần dead letter và người vận hành can thiệp.

### Khi nào dùng
Dùng cho quy trình nhiều service, kéo dài từ giây đến ngày: đặt hàng, thanh toán, du lịch, onboarding, xử lý hồ sơ. Phù hợp khi không thể giữ khóa database xuyên service.

### Hay nhầm với
Khác 2PC ở chỗ saga không khóa tài nguyên toàn cục và chỉ đạt nhất quán cuối. Khác workflow engine ở chỗ saga nhấn mạnh giao dịch bù; workflow có thể chỉ là điều phối tác vụ. Cũng không phải outbox, dù outbox thường là cách phát sự kiện giữa các bước saga.`,
    refs: [
      { type: 'doc', title: 'microservices.io: Saga pattern', url: 'https://microservices.io/patterns/data/saga.html' },
    ],
    related: ['two-phase-commit', 'transactional-outbox', 'eventual-consistency', 'idempotency'],
  },
  {
    id: 'two-phase-commit',
    term: 'Two-phase commit',
    aliases: ['two-phase commit', 'two phase commit', '2pc', 'two-phase-commit', 'cam kết hai pha'],
    short: 'Giao thức để nhiều database cùng cam kết một giao dịch, qua bước chuẩn bị rồi bước chốt.',
    body: `### Ví dụ đời thường
Hai người cùng ký một hợp đồng mua nhà, có công chứng viên điều phối. Đầu tiên mỗi người xác nhận đã sẵn sàng ký và giữ bút, sau đó công chứng viên nói "ký đi" và tất cả cùng ký. Nếu một người chưa sẵn sàng, cả giao dịch dừng.

### Cơ chế
Có một coordinator và nhiều participant (các database/resource manager). Giao thức gồm hai pha:
1. Prepare: coordinator hỏi từng participant "chuẩn bị được không". Participant thực hiện công việc, giữ khóa và ghi log, trả yes hoặc no.
2. Commit: nếu tất cả yes, coordinator ghi quyết định commit và bảo mọi người commit. Nếu bất kỳ no hoặc timeout, coordinator bảo mọi người rollback.

~~~text
Coordinator        DB A              DB B
    |-- prepare ---->|                 |
    |                | giữ khóa, log   |
    |<-- yes ---------|                 |
    |-- prepare ---------------------->|
    |                |                 | giữ khóa, log
    |<-- yes --------------------------|
    |-- commit ----->|                 |
    |-- commit ----------------------->|
    |<-- done -------|                 |
    |<-- done -------------------------|
~~~

Nhược điểm lớn: participant bị block sau khi trả yes cho đến khi nhận quyết định. Nếu coordinator chết, tài nguyên bị khóa. Nếu một participant commit còn participant khác rollback do lỗi mạng, xảy ra heuristic outcome, dữ liệu không nhất quán và phải xử lý thủ công.

2PC phù hợp trong một hệ quản trị hoặc giữa các resource hỗ trợ XA, thời gian ngắn. Nó không phù hợp cho microservices qua HTTP vì độ trễ, lỗi mạng và khóa dài.

### Khi nào dùng
Dùng khi cần tính nguyên tử mạnh giữa vài database trong cùng trung tâm dữ liệu, giao dịch ngắn, hoặc hệ thống cũ dùng XA. Tránh dùng xuyên service phân tán.

### Hay nhầm với
Khác saga: saga không khóa và chấp nhận nhất quán cuối, đền bù khi lỗi. Khác outbox: outbox dùng một transaction cục bộ rồi phát sự kiện, không cần coordinator toàn cục. Ba pha (3PC) thêm bước để giảm block nhưng hiếm dùng trong thực tế.`,
    refs: [
      { type: 'article', title: 'Martin Fowler: Two-phase commit', url: 'https://martinfowler.com/articles/patterns-of-distributed-systems/two-phase-commit.html' },
    ],
    related: ['saga', 'transactional-outbox', 'distributed-lock', 'strong-consistency'],
  },
  {
    id: 'eventual-consistency',
    term: 'Eventual consistency',
    aliases: ['eventual consistency', 'eventually consistent', 'nhất quán cuối', 'nhất quán sau cùng'],
    short: 'Các bản sao có thể lệch nhau tạm thời nhưng sẽ hội tụ nếu ngừng ghi.',
    body: `### Ví dụ đời thường
Một tin đồn lan qua các nhóm chat. Người ở nhóm A biết trước, nhóm B biết sau vài phút, nhưng cuối cùng ai cũng biết cùng một câu chuyện. Trong khoảng giữa, thông tin chưa đồng đều.

### Cơ chế
Khi ghi vào một node, dữ liệu được đồng bộ bất đồng bộ sang các bản sao khác. Trong khoảng trễ, đọc từ bản sao khác có thể thấy dữ liệu cũ. Hệ thống đạt eventual consistency nếu, với điều kiện không có ghi mới, mọi bản sao cuối cùng sẽ có cùng giá trị.

Các khái niệm liên quan:
- Read-your-writes: người vừa ghi phải đọc thấy dữ liệu của mình. Có thể đạt bằng cách đọc từ leader hoặc dùng version token.
- Monotonic reads: không bao giờ thấy dữ liệu cũ hơn lần đọc trước.
- Bounded staleness: độ lệch có giới hạn thời gian hoặc số version.
- Đồng bộ xung đột bằng last-write-wins, vector clock, CRDT hoặc logic nghiệp vụ.

~~~text
Client --> Node A: ghi X=1
Node A --> Node B: replicate (trễ 200ms)
Client --> Node B: đọc --> X=0 (tạm thời)
Sau 200ms: Node B có X=1 (hội tụ)
~~~

Hệ quả là UI và nghiệp vụ phải chịu được trạng thái trung gian: hiển thị "đang xử lý", ẩn nút mua khi chưa chắc, hoặc bù trừ sau. Với số dư ví, eventual consistency có thể cho phép chi tiêu vượt số dư nếu không có kiểm soát ở nơi ghi.

### Khi nào dùng
Dùng cho feed, đếm like, catalog, chỉ mục tìm kiếm, cache, đồng bộ đa vùng, và read model của CQRS. Phù hợp khi độ trễ thấp và sẵn sàng quan trọng hơn việc đọc luôn mới nhất.

### Hay nhầm với
Không phải "không có nhất quán": nó vẫn có quy tắc hội tụ, chỉ là trễ. Khác strong consistency ở chỗ không cam kết đọc thấy ghi gần nhất ngay lập tức. Cũng đừng nhầm với eventual consistency của database với eventual consistency của message delivery; hai khái niệm liên quan nhưng không đồng nhất.`,
    refs: [
      { type: 'article', title: 'Jepsen: Consistency models', url: 'https://jepsen.io/consistency' },
    ],
    related: ['strong-consistency', 'cap-theorem', 'cqrs', 'saga'],
  },
  {
    id: 'strong-consistency',
    term: 'Strong consistency',
    aliases: ['strong consistency', 'strongly consistent', 'nhất quán mạnh'],
    short: 'Mọi lần đọc đều thấy dữ liệu mới nhất như thể chỉ có một bản sao.',
    body: `### Ví dụ đời thường
Một lớp học chỉ có một bảng điểm treo trên tường. Giáo viên sửa điểm xong thì mọi học sinh nhìn vào đều thấy điểm mới. Không có chuyện mỗi người nhìn một bảng khác nhau.

### Cơ chế
Strong consistency thường được hiểu là linearizability: mỗi thao tác trông như xảy ra tức thời tại một điểm giữa lúc gọi và lúc trả về, và mọi client thấy cùng một thứ tự. Cách đạt:
- Chỉ một leader nhận ghi, đọc cũng từ leader hoặc từ follower đã bắt kịp.
- Ghi và đọc theo quorum với R + W > N, ví dụ N=3, W=2, R=2.
- Dùng consensus như Raft hoặc Paxos để thống nhất thứ tự log.
- Đồng bộ replication trước khi trả thành công.

~~~text
Client 1 --ghi X=1--> Leader --> Follower A (ack)
                            --> Follower B (ack)
Leader trả OK sau khi đủ quorum
Client 2 --đọc X------> Leader/Follower đã catch-up --> X=1
~~~

Cái giá là độ trễ cao hơn, throughput thấp hơn, và khó đạt khi mất mạng. Nếu partition xảy ra, hệ thống CP sẽ từ chối ghi hoặc đọc thay vì trả dữ liệu cũ. Đây là lựa chọn đúng cho số dư, tồn kho, khóa, tính duy nhất.

Cần phân biệt linearizability với serializability. Linearizability nói về một object tại một thời điểm; serializability nói về transaction nhiều object tương đương một thứ tự tuần tự. Một hệ có thể serializable nhưng không linearizable và ngược lại.

### Khi nào dùng
Dùng cho tiền, tồn kho, đặt chỗ, phân quyền, uniqueness, counter cần chính xác. Cũng dùng khi logic nghiệp vụ không thể chịu trạng thái trung gian.

### Hay nhầm với
Khác eventual consistency ở cam kết thời điểm. Không đồng nghĩa với "ACID": ACID nói về transaction, strong consistency nói về quan sát. Cũng không phải "high availability": chọn strong consistency thường phải hy sinh availability khi có partition.`,
    refs: [
      { type: 'article', title: 'Jepsen: Consistency models', url: 'https://jepsen.io/consistency' },
    ],
    related: ['eventual-consistency', 'cap-theorem', 'two-phase-commit', 'distributed-lock'],
  },
  {
    id: 'cap-theorem',
    term: 'CAP theorem',
    aliases: ['cap theorem', 'định lý cap', 'brewers theorem', "brewer's theorem"],
    short: 'Khi mạng bị chia cắt, hệ phân tán phải chọn giữa nhất quán và sẵn sàng.',
    body: `### Ví dụ đời thường
Hai quầy bán vé ở hai toà nhà, đường dây liên lạc giữa họ bị đứt. Quầy A muốn bán vé cuối cùng nhưng không biết quầy B đã bán chưa. Họ phải chọn: hoặc từ chối bán để chắc chắn không trùng, hoặc vẫn bán và chấp nhận rủi ro trùng.

### Cơ chế
CAP nói về ba tính chất:
- Consistency (C): mọi lần đọc thấy dữ liệu mới nhất, hiểu theo nghĩa linearizability.
- Availability (A): mọi request tới node còn sống đều nhận được phản hồi không lỗi, không có bảo đảm là mới nhất.
- Partition tolerance (P): hệ vẫn chạy khi mạng giữa các node bị chia cắt.

Trong hệ phân tán thật, partition là điều không tránh khỏi, nên P không phải lựa chọn. Khi partition xảy ra, hệ phải chọn C hoặc A:
- CP: từ chối ghi/đọc ở phía thiểu số để không trả dữ liệu sai. Ví dụ hệ consensus, database truyền thống cấu hình chặt.
- AP: vẫn phục vụ, chấp nhận dữ liệu cũ hoặc xung đột, hội tụ sau. Ví dụ Cassandra, DynamoDB ở chế độ eventually consistent.

~~~text
        Partition xảy ra
               |
       +-------+-------+
       v               v
   Chọn C           Chọn A
   từ chối ghi      vẫn trả lời
   ở thiểu số       có thể cũ
   (CP)             (AP)
~~~

Ngoài CAP còn có PACELC: khi có partition chọn A hoặc C; khi không có partition (E), vẫn phải chọn giữa latency (L) và consistency (C). Đây là lý do nhiều hệ thống chọn nhất quán cuối ngay cả khi mạng tốt, để giảm độ trễ.

### Khi nào dùng
Dùng khi chọn database, thiết kế đa vùng, hoặc quyết định hành vi khi mất kết nối. Câu hỏi thực tế là: khi partition, nghiệp vụ của bạn thà từ chối phục vụ hay thà trả dữ liệu cũ?

### Hay nhầm với
Không phải "chọn 2 trong 3" một cách máy móc, vì P thường là bắt buộc. Không đồng nghĩa với ACID/BASE: CAP nói về hành vi khi partition, ACID nói về transaction. Cũng không phải lời giải thích cho mọi trade-off về consistency; có nhiều mô hình nhất quán trung gian.`,
    refs: [
      { type: 'article', title: 'InfoQ: CAP twelve years later', url: 'https://www.infoq.com/articles/cap-twelve-years-later-how-the-rules-have-changed/' },
    ],
    related: ['strong-consistency', 'eventual-consistency', 'leader-election', 'distributed-lock'],
  },
  {
    id: 'distributed-lock',
    term: 'Distributed lock',
    aliases: ['distributed lock', 'distributed locks', 'distributed-lock', 'khóa phân tán'],
    short: 'Cơ chế để nhiều máy cùng thống nhất chỉ một máy được làm một việc tại một thời điểm.',
    body: `### Ví dụ đời thường
Nhà vệ sinh công cộng có một chìa khóa duy nhất treo ở quầy. Ai cầm chìa thì được vào; người khác phải chờ. Nếu người cầm chìa bị lạc, cần cơ chế thu hồi sau một thời gian.

### Cơ chế
Có nhiều cách triển khai:
- Redis: SET key value NX PX ttl. Chỉ một client đặt được. Khi xong, xóa bằng script kiểm tra đúng value để không xóa nhầm khóa của người khác.
- ZooKeeper/etcd: tạo node ephemeral, dùng sequence và watch; node biến mất khi session chết.
- Database: unique constraint, SELECT FOR UPDATE, hoặc bảng lock có lease.

Vấn đề khó nhất là lease hết hạn khi client vẫn đang làm việc (do GC pause, mạng chậm). Khi đó client khác lấy khóa và hai bên cùng chạy. Giải pháp là fencing token: mỗi lần cấp khóa tăng một số, và tài nguyên từ chối ghi nếu token nhỏ hơn token lớn nhất đã thấy.

~~~text
Client A: acquire lock, token=7, TTL=30s
Client A: bị pause 35s
Lock hết hạn --> Client B: acquire, token=8
Client A tỉnh: ghi với token=7
Storage: đã thấy token=8 --> từ chối token=7
~~~

Redlock của Redis gây tranh cãi vì khó bảo đảm an toàn dưới partition và clock skew. Với nghiệp vụ tài chính, đừng dùng distributed lock làm hàng rào duy nhất; hãy dùng ràng buộc dữ liệu hoặc idempotency.

### Khi nào dùng
Dùng để tránh chạy trùng job định kỳ, bảo vệ tài nguyên dùng chung, hoặc giới hạn một thao tác tại một thời điểm. Không dùng cho logic cần chính xác tuyệt đối nếu không có fencing.

### Hay nhầm với
Khác khóa database cục bộ ở phạm vi nhiều máy. Khác leader election ở mục đích: lock là giành quyền trong thời gian ngắn, leader election chọn một node lãnh đạo lâu dài. Cũng không thay thế idempotency: lock có thể mất, idempotency vẫn phải có.`,
    refs: [
      { type: 'article', title: 'Martin Fowler: Lease-based distributed locks', url: 'https://martinfowler.com/articles/patterns-of-distributed-systems/lease.html' },
    ],
    related: ['leader-election', 'idempotency', 'strong-consistency', 'cap-theorem'],
  },
  {
    id: 'leader-election',
    term: 'Leader election',
    aliases: ['leader election', 'leader-election', 'bầu leader', 'chọn leader'],
    short: 'Quá trình các node chọn ra một node duy nhất làm người điều phối.',
    body: `### Ví dụ đời thường
Một nhóm bạn đi du lịch cần một người giữ quỹ. Cả nhóm bầu một người, những người khác không tự tiêu quỹ. Nếu người giữ quỹ ốm, cả nhóm bầu người khác thay.

### Cơ chế
Các node cạnh tranh để trở thành leader, thường thông qua một hệ thống đồng thuận như Raft, Paxos, ZooKeeper hoặc etcd. Leader giữ một lease có thời hạn và phải gia hạn định kỳ. Nếu không gia hạn được, node khác có thể tranh cử.

Các yếu tố quan trọng:
- Term/epoch: mỗi nhiệm kỳ có số tăng dần để phân biệt leader cũ và mới.
- Quorum: leader cần đa số phiếu, tránh hai leader cùng lúc.
- Fencing: leader cũ có thể vẫn tưởng mình là leader sau khi mất mạng; tài nguyên phải từ chối request có term cũ.
- Failover: khi leader chết, bầu lại, có thể mất vài giây.

~~~text
Node A: xin làm leader, term=5
Quorum: A được 2/3 --> A là leader
A mất mạng, lease hết hạn
Node B: tranh cử, term=6, được 2/3 --> B là leader
A tỉnh: gửi write term=5 --> bị từ chối
~~~

Split-brain là khi hai phần mạng đều bầu ra leader riêng. Quorum ngăn điều này vì chỉ một phía có đa số. Hệ thống không có quorum có thể phục vụ nhưng phải chấp nhận nguy cơ hai leader.

### Khi nào dùng
Dùng cho scheduler chỉ chạy một instance, background job, phân vùng dữ liệu, replication primary, và các thành phần cần một điểm điều phối. Cũng dùng trong Kafka controller, Kubernetes control plane.

### Hay nhầm với
Khác distributed lock ở thời hạn và phạm vi: leader election chọn người lãnh đạo cho một tập tác vụ, lock thường bảo vệ một tài nguyên. Khác service discovery: discovery tìm ai đang sống, election chọn ai đứng đầu.`,
    refs: [
      { type: 'article', title: 'Martin Fowler: Leader election', url: 'https://martinfowler.com/articles/patterns-of-distributed-systems/leader-follower.html' },
    ],
    related: ['distributed-lock', 'cap-theorem', 'strong-consistency', 'service-discovery'],
  },
  {
    id: 'circuit-breaker',
    term: 'Circuit breaker',
    aliases: ['circuit breaker', 'circuit breakers', 'circuit-breaker', 'cầu dao', 'ngắt mạch'],
    short: 'Tự động ngừng gọi một dịch vụ đang lỗi để tránh kéo cả hệ thống xuống.',
    body: `### Ví dụ đời thường
Khi dây điện trong nhà bị chập, cầu dao tự ngắt để không cháy nhà. Bạn sửa xong mới gạt cầu dao lên lại. Nếu không có cầu dao, dòng điện cứ chạy và thiệt hại lan rộng.

### Cơ chế
Circuit breaker bọc lời gọi tới một dependency và có ba trạng thái:
- Closed: cho gọi bình thường, đếm lỗi trong cửa sổ trượt.
- Open: khi tỉ lệ lỗi vượt ngưỡng, chặn ngay lập tức, trả fallback hoặc lỗi nhanh. Không tốn thời gian chờ timeout.
- Half-open: sau một khoảng chờ, cho một ít request thử. Nếu thành công, về Closed; nếu lỗi, về Open.

Tham số điển hình: failure rate threshold, minimum number of calls, sliding window, wait duration in open state, permitted calls in half-open. Nên đặt breaker riêng cho từng dependency và từng instance, tránh một API chậm làm nghẽn tất cả.

~~~text
Closed --tỉ lệ lỗi > 50%--> Open
Open --hết wait duration--> Half-open
Half-open --thử thành công--> Closed
Half-open --thử thất bại--> Open
~~~

Fallback phải có ý nghĩa: trả cache cũ, ẩn tính năng, xếp hàng chờ, hoặc báo lỗi thân thiện. Đừng fallback bằng cách gọi một dịch vụ khác cũng đang chết. Circuit breaker không sửa lỗi gốc; nó chỉ bảo vệ caller và cho dependency thời gian hồi phục.

### Khi nào dùng
Dùng khi gọi dịch vụ ngoài, database, API bên thứ ba hoặc bất kỳ dependency có thể chậm. Đặc biệt quan trọng khi caller có thread pool giới hạn, vì chờ timeout có thể làm cạn thread.

### Hay nhầm với
Khác retry: retry cố thêm, breaker ngừng cố. Khác rate limiting: rate limiting giới hạn tần suất, breaker phản ứng theo lỗi. Khác bulkhead: bulkhead chia tài nguyên, breaker chặn lời gọi.`,
    refs: [
      { type: 'article', title: 'Martin Fowler: CircuitBreaker', url: 'https://martinfowler.com/bliki/CircuitBreaker.html' },
    ],
    related: ['retry', 'bulkhead', 'timeout-budget', 'backpressure'],
  },
  {
    id: 'bulkhead',
    term: 'Bulkhead',
    aliases: ['bulkhead', 'bulkheads', 'bulkhead pattern', 'khoang ngăn', 'vách ngăn'],
    short: 'Chia tài nguyên thành các khoang riêng để một phần hỏng không làm chết toàn bộ.',
    body: `### Ví dụ đời thường
Tàu thuỷ được chia thành nhiều khoang kín. Nếu một khoang bị thủng, nước chỉ tràn vào khoang đó, tàu vẫn nổi. Nếu là một khoang lớn duy nhất, một lỗ thủng làm chìm cả tàu.

### Cơ chế
Trong phần mềm, bulkhead giới hạn tài nguyên cho từng nhóm công việc để lỗi cục bộ không lan ra. Các dạng phổ biến:
- Thread pool riêng cho từng dependency, để dependency A chậm không chiếm hết thread của B.
- Connection pool riêng cho từng downstream.
- Semaphore giới hạn số request đồng thời tới một dịch vụ.
- Hàng đợi có sức chứa giới hạn, từ chối khi đầy.
- Ở hạ tầng: namespace, container resource limit, node pool riêng.

~~~text
Không bulkhead:
  [ Thread pool chung 200 ]
     |-- API A chậm chiếm 200 --> API B đói thread

Có bulkhead:
  [ Pool A 50 ]  [ Pool B 50 ]  [ Pool C 100 ]
     A chậm chỉ làm đầy pool A
~~~

Đánh đổi là mất hiệu suất sử dụng tài nguyên: pool riêng có thể nhàn rỗi trong khi pool khác quá tải. Cần chọn kích thước theo tải thực tế và theo dõi tỉ lệ từ chối. Bulkhead thường đi kèm timeout và circuit breaker để giải phóng tài nguyên nhanh.

Với Java, Resilience4j có Bulkhead dạng semaphore hoặc thread pool. Với Kubernetes, resource request/limit và pod disruption budget cũng là một dạng bulkhead ở tầng hạ tầng.

### Khi nào dùng
Dùng khi một service phụ thuộc nhiều downstream có mức quan trọng khác nhau, khi cần cô lập tenant, hoặc khi một job nặng có thể chiếm hết tài nguyên của API chính.

### Hay nhầm với
Khác rate limiting: bulkhead giới hạn số việc đồng thời, rate limiting giới hạn số việc theo thời gian. Khác circuit breaker: breaker ngừng gọi khi lỗi, bulkhead giới hạn tài nguyên ngay cả khi không lỗi. Khác backpressure: backpressure là tín hiệu chậm lại từ phía sau.`,
    refs: [
      { type: 'doc', title: 'Microsoft Azure: Bulkhead pattern', url: 'https://learn.microsoft.com/en-us/azure/architecture/patterns/bulkhead' },
    ],
    related: ['circuit-breaker', 'rate-limiting', 'backpressure', 'timeout-budget'],
  },
  {
    id: 'rate-limiting',
    term: 'Rate limiting',
    aliases: ['rate limiting', 'rate limit', 'rate limits', 'rate-limiting', 'giới hạn tần suất', 'giới hạn tốc độ'],
    short: 'Giới hạn số request một chủ thể được gửi trong một khoảng thời gian.',
    body: `### Ví dụ đời thường
Hộp đêm có một bảo vệ đếm số người vào mỗi phút. Khi đủ số, người sau phải chờ hoặc bị từ chối. Mục đích là không để quá đông làm hỏng trải nghiệm bên trong.

### Cơ chế
Các thuật toán phổ biến:
- Fixed window: đếm trong mỗi phút. Đơn giản nhưng có hiệu ứng bùng nổ ở ranh giới hai cửa sổ.
- Sliding window log: lưu timestamp từng request, chính xác nhưng tốn bộ nhớ.
- Sliding window counter: nội suy giữa hai cửa sổ, cân bằng.
- Token bucket: có một xô token, mỗi request lấy một token, token được nạp đều. Cho phép burst trong giới hạn.
- Leaky bucket: xếp hàng và xả đều, làm phẳng lưu lượng.

Server trả HTTP 429 kèm Retry-After, và các header như X-RateLimit-Limit, Remaining, Reset. Khóa giới hạn có thể theo API key, user id, IP, tenant hoặc endpoint. Với hệ phân tán, dùng Redis với script Lua nguyên tử hoặc gateway chia sẻ bộ đếm.

~~~text
Token bucket: capacity=10, refill=2/giây
  request --> lấy token? có --> xử lý
                     không --> 429 + Retry-After
  burst 10 request cùng lúc vẫn được nếu xô đầy
~~~

Đặt rate limit ở gateway để bảo vệ toàn hệ thống, và ở từng service cho giới hạn nội bộ. Cần phân biệt giới hạn theo client với giới hạn bảo vệ tài nguyên dùng chung. Nếu đặt quá thấp, client hợp lệ bị chặn; quá cao thì không bảo vệ được gì.

### Khi nào dùng
Dùng cho API public, chống brute force, bảo vệ database, công bằng giữa tenant, và kiểm soát chi phí gọi dịch vụ AI. Cũng dùng để giới hạn webhook hoặc email gửi ra ngoài.

### Hay nhầm với
Khác throttling ở góc nhìn: rate limiting là luật, throttling là hành vi làm chậm hoặc trì hoãn. Khác backpressure: rate limiting do phía nhận chủ động đặt, backpressure là tín hiệu khi phía nhận không theo kịp. Khác concurrency limit: một cái đếm theo thời gian, một cái đếm số việc đồng thời.`,
    refs: [
      { type: 'doc', title: 'Stripe: Rate limits', url: 'https://docs.stripe.com/rate-limits' },
    ],
    related: ['backpressure', 'bulkhead', 'circuit-breaker', 'api-gateway', 'timeout-budget'],
  },
  {
    id: 'backpressure',
    term: 'Backpressure',
    aliases: ['backpressure', 'back pressure', 'back-pressure', 'áp lực ngược', 'phản áp'],
    short: 'Tín hiệu buộc phía gửi chậm lại khi phía nhận không theo kịp.',
    body: `### Ví dụ đời thường
Một băng chuyền đưa hàng vào máy đóng gói. Khi máy đóng gói chậm, băng chuyền phải dừng hoặc giảm tốc, nếu không hàng sẽ rơi khỏi mép và chất thành đống. Máy đóng gói gửi tín hiệu ngược về để điều khiển băng chuyền.

### Cơ chế
Backpressure xuất hiện khi tốc độ sản xuất nhanh hơn tốc độ tiêu thụ. Nếu không có cơ chế, hàng đợi tăng vô hạn, bộ nhớ đầy, độ trễ tăng và cuối cùng hệ thống sập.

Các cách thực hiện:
- Hàng đợi có giới hạn: khi đầy, từ chối hoặc chặn producer.
- Pull-based: consumer chủ động lấy khi sẵn sàng, như Kafka poll.
- Reactive Streams: subscriber gọi request(n) để báo nhận thêm n item.
- TCP flow control: receive window báo phía gửi gửi ít lại.
- Load shedding: chủ động bỏ request khi quá tải, thay vì giữ tất cả.
- Giảm chất lượng: sampling, batch nhỏ hơn, trả kết quả gần đúng.

~~~text
Producer nhanh --> [ Hàng đợi giới hạn 1000 ] --> Consumer chậm
                            |
                    đầy --> chặn producer
                         hoặc từ chối (429/503)
                         hoặc bỏ mẫu (load shedding)
~~~

Backpressure khác với rate limiting ở chỗ nó phản ứng theo trạng thái thực của consumer, không chỉ theo hạn mức cố định. Một hệ thống tốt cần cả hai: rate limiting bảo vệ cửa vào, backpressure bảo vệ đường ống bên trong.

### Khi nào dùng
Dùng trong streaming, message queue, pipeline xử lý ảnh/log, API có tải đột biến, và mọi nơi có hàng đợi. Đặc biệt quan trọng khi consumer chậm hơn producer một cách hệ thống.

### Hay nhầm với
Không phải rate limiting: rate limiting giới hạn số lượng theo thời gian, backpressure truyền tín hiệu chậm lại theo khả năng thực tế. Không phải buffering: buffer chỉ giấu vấn đề tạm thời, buffer vô hạn làm vấn đề tệ hơn. Cũng khác timeout: timeout cắt một lời gọi, backpressure điều chỉnh cả dòng chảy.`,
    refs: [
      { type: 'doc', title: 'Reactive Streams', url: 'https://www.reactive-streams.org/' },
    ],
    related: ['rate-limiting', 'bulkhead', 'message-broker', 'consumer-group', 'timeout-budget'],
  },
  {
    id: 'message-broker',
    term: 'Message broker',
    aliases: ['message broker', 'message brokers', 'message-broker', 'message queue', 'message queues', 'trung gian tin nhắn'],
    short: 'Phần mềm trung gian nhận message từ người gửi và chuyển cho người nhận.',
    body: `### Ví dụ đời thường
Bưu điện không quan tâm bạn là ai; bạn đưa thư, họ giữ và chuyển tới địa chỉ. Người gửi và người nhận không cần gặp nhau, không cần biết địa chỉ thật của nhau, chỉ cần biết bưu điện.

### Cơ chế
Message broker tách producer khỏi consumer. Producer gửi message tới một queue hoặc topic; broker lưu, định tuyến và giao cho consumer. Các tính năng chính:
- Persistence: message được ghi xuống đĩa để không mất khi broker restart.
- Acknowledgment: consumer xác nhận đã xử lý.
- Routing: queue point-to-point, topic publish-subscribe, routing key, header.
- Ordering: bảo đảm thứ tự trong một queue hoặc partition.
- Dead letter: chuyển message lỗi sang nơi khác.
- Retention: giữ message bao lâu.

Các loại phổ biến: RabbitMQ (AMQP, routing linh hoạt), Kafka (log phân tán, throughput cao, replay được), AWS SQS (queue managed, đơn giản), Google Pub/Sub, NATS.

~~~text
Producer --> [ Broker: queue/topic ] --> Consumer A
                    |                  --> Consumer B
                    |-- lưu đĩa
                    |-- ack
                    |-- DLQ khi lỗi
~~~

Broker giúp giảm coupling và chịu tải đột biến, nhưng thêm độ phức tạp: message trùng, mất thứ tự, poison message, và vận hành broker. Cần chọn mô hình giao hàng, cách commit offset, và chiến lược retry ngay từ đầu.

### Khi nào dùng
Dùng khi cần xử lý bất đồng bộ, tách service, chịu tải đột biến, fan-out sự kiện, hoặc kết nối hệ thống có tốc độ khác nhau. Không dùng khi cần phản hồi đồng bộ tức thời và đơn giản.

### Hay nhầm với
Không phải API gateway: gateway định tuyến request đồng bộ, broker chuyển message bất đồng bộ. Không phải event bus ở góc nhìn nghiệp vụ, dù event bus thường dùng broker. Cũng khác database: broker không phải nơi lưu trạng thái lâu dài, dù Kafka có thể giữ log rất lâu.`,
    refs: [
      { type: 'doc', title: 'Apache Kafka: Documentation', url: 'https://kafka.apache.org/documentation/' },
      { type: 'doc', title: 'microservices.io: Messaging patterns', url: 'https://microservices.io/patterns/communication-style/messaging.html' },
    ],
    related: ['consumer-group', 'partition', 'offset', 'dead-letter-queue', 'fan-out'],
  },
  {
    id: 'consumer-group',
    term: 'Consumer group',
    aliases: ['consumer group', 'consumer groups', 'consumer-group', 'nhóm consumer'],
    short: 'Nhiều consumer cùng chia nhau đọc các phần của một topic.',
    body: `### Ví dụ đời thường
Một siêu thị có nhiều quầy thu ngân và một hàng khách chung. Các thu ngân trong cùng ca chia nhau khách để không ai phải chờ quá lâu. Khi một thu ngân nghỉ, khách của quầy đó được chia lại cho người còn lại.

### Cơ chế
Trong Kafka, consumer group có group.id. Các consumer trong cùng group chia nhau các partition của topic: mỗi partition chỉ được một consumer trong group đọc tại một thời điểm. Consumer khác group vẫn đọc độc lập, nên có thể có nhiều group cùng xử lý một topic cho các mục đích khác nhau.

Khi consumer join hoặc rời group, broker chạy rebalance để chia lại partition. Có hai kiểu:
- Eager: dừng toàn bộ, thu hồi hết rồi chia lại, có khoảng dừng.
- Cooperative: thu hồi từng phần, giảm gián đoạn.

Heartbeat và session.timeout phát hiện consumer chết. max.poll.interval.ms giới hạn thời gian xử lý giữa hai lần poll; vượt quá thì consumer bị coi là chết và partition bị thu hồi.

~~~text
Topic có 4 partition: P0 P1 P2 P3
Group A: Consumer 1 --> P0, P1
         Consumer 2 --> P2, P3

Consumer 3 join --> rebalance
         C1 --> P0
         C2 --> P1, P2
         C3 --> P3
~~~

Số consumer hữu ích tối đa bằng số partition. Thêm consumer quá số partition thì có người ngồi không. Chọn số partition phải tính tới tải tương lai vì tăng partition làm thay đổi ánh xạ key.

### Khi nào dùng
Dùng khi cần scale consumer theo chiều ngang, xử lý song song một topic, hoặc chạy nhiều ứng dụng độc lập trên cùng dữ liệu. Cũng dùng để tách workload: một group ghi vào database, một group cập nhật cache.

### Hay nhầm với
Không phải subscriber đơn thuần: subscriber thường nhận mọi message, consumer group chia message. Khác partition: partition là đơn vị dữ liệu, consumer group là đơn vị người đọc. Khác offset: offset là vị trí đọc, group quản lý tập offset của các consumer.`,
    refs: [
      { type: 'doc', title: 'Apache Kafka: Consumer configs', url: 'https://kafka.apache.org/documentation/#consumerconfigs' },
    ],
    related: ['partition', 'offset', 'message-broker', 'at-least-once', 'fan-out'],
  },
  {
    id: 'partition',
    term: 'Partition',
    aliases: ['partition', 'partitions', 'partitioned', 'kafka partition', 'phân vùng'],
    short: 'Một phần độc lập của dữ liệu, được lưu theo thứ tự và xử lý song song.',
    body: `### Ví dụ đời thường
Một siêu thị có nhiều quầy thu ngân, mỗi quầy có hàng riêng. Khách được xếp vào một quầy theo quy tắc, ví dụ theo số cuối của mã khách. Trong một quầy, thứ tự được giữ; giữa các quầy thì không cần.

### Cơ chế
Trong Kafka, topic được chia thành các partition. Mỗi partition là một log chỉ ghi thêm (append-only), có thứ tự và offset riêng. Producer gửi message tới một partition:
- Nếu có key, dùng hash(key) % số partition, nên cùng key luôn vào cùng partition.
- Nếu không có key, dùng round-robin hoặc sticky để phân tán.

Consumer group chia partition cho các consumer, nên thứ tự chỉ được bảo đảm trong một partition. Muốn giữ thứ tự cho một thực thể, phải dùng cùng key, ví dụ order_id.

~~~text
Topic orders (3 partition)
  P0: [m1][m3][m7]  --> Consumer 1
  P1: [m2][m5]      --> Consumer 2
  P2: [m4][m6][m8]  --> Consumer 3

key=order-42 hash --> P1, mọi event của order-42 vào P1
~~~

Partition nhiều giúp tăng throughput và song song, nhưng có cái giá: nhiều file mở, rebalance lâu hơn, và có thể lệch tải nếu key phân bố không đều (hot partition). Số partition thường không giảm được, nên cần tính toán trước. Trong database, partition cũng là chia bảng theo range hoặc hash, nhưng ngữ cảnh khác.

### Khi nào dùng
Dùng khi thiết kế topic Kafka, chọn key, tính toán scale consumer, hoặc chia dữ liệu lớn trong database. Cần hiểu rõ yêu cầu thứ tự và mức song song.

### Hay nhầm với
Không phải shard theo nghĩa database, dù ý tưởng chia dữ liệu giống nhau. Khác consumer group: partition là dữ liệu, group là người đọc. Khác offset: offset là vị trí trong một partition. Trong SQL, partition thường là chia bảng vật lý, không liên quan broker.`,
    refs: [
      { type: 'doc', title: 'Apache Kafka: Topics and partitions', url: 'https://kafka.apache.org/documentation/#intro_concepts_and_terms' },
    ],
    related: ['offset', 'consumer-group', 'message-broker', 'fan-out'],
  },
  {
    id: 'offset',
    term: 'Offset',
    aliases: ['offset', 'offsets', 'consumer offset', 'committed offset', 'kafka offset'],
    short: 'Con số chỉ vị trí đã đọc tới trong một partition.',
    body: `### Ví dụ đời thường
Bạn đọc một cuốn sách dày và dùng bookmark để đánh dấu trang đang đọc. Lần sau mở lại, bạn đọc tiếp từ bookmark thay vì từ đầu. Nếu đánh dấu sai, bạn có thể đọc lại một trang hoặc bỏ sót.

### Cơ chế
Mỗi message trong một partition có offset tăng dần, ví dụ 0, 1, 2... Offset chỉ có ý nghĩa trong partition đó. Consumer có hai khái niệm:
- Current position: message tiếp theo sẽ đọc.
- Committed offset: vị trí đã lưu là đã xử lý xong, dùng khi consumer restart hoặc rebalance.

Commit có thể tự động (enable.auto.commit=true) hoặc thủ công. Auto-commit theo thời gian có thể commit trước khi xử lý xong, gây mất message. Commit sau khi xử lý cho at-least-once; commit trước khi xử lý cho at-most-once.

~~~text
Partition P0: [0][1][2][3][4][5]
                        ^
                   committed=3
Consumer restart --> đọc lại từ 3 (nếu chưa commit 4)
                   hoặc từ 4 nếu đã commit
~~~

Có thể seek để replay dữ liệu, nhưng chỉ trong thời gian retention còn giữ. Offset không phải id duy nhất toàn cục; muốn idempotency theo message nên dùng khóa nghiệp vụ hoặc message id do producer sinh.

### Khi nào dùng
Dùng khi cấu hình consumer, debug mất/trùng message, replay sự kiện, hoặc giám sát lag. Consumer lag chính là khoảng cách giữa offset mới nhất của partition và committed offset của group.

### Hay nhầm với
Không phải message id: offset thay đổi khi topic được ghi lại hoặc partition thay đổi. Khác cursor trong database: cursor thường gắn với query, offset gắn với log. Khác watermark: watermark là mốc thời gian trong stream processing, không phải vị trí đọc.`,
    refs: [
      { type: 'doc', title: 'Apache Kafka: Consumer configs', url: 'https://kafka.apache.org/documentation/#consumerconfigs' },
    ],
    related: ['partition', 'consumer-group', 'at-least-once', 'exactly-once'],
  },
  {
    id: 'event-sourcing',
    term: 'Event sourcing',
    aliases: ['event sourcing', 'event-sourcing', 'event sourced', 'lưu trữ sự kiện'],
    short: 'Lưu chuỗi sự kiện đã xảy ra thay vì chỉ lưu trạng thái hiện tại.',
    body: `### Ví dụ đời thường
Một cuốn sổ ngân hàng ghi từng giao dịch: nộp 100, rút 30, nộp 50. Số dư 120 chỉ là kết quả tính lại từ các dòng đó. Nếu chỉ ghi số dư cuối, bạn không biết vì sao nó lại như vậy.

### Cơ chế
Event sourcing lưu mọi thay đổi trạng thái dưới dạng sự kiện bất biến, theo thứ tự, trong một event store. Trạng thái hiện tại được dựng lại bằng cách phát lại sự kiện từ đầu, hoặc từ snapshot gần nhất rồi áp các sự kiện sau.

Các thành phần:
- Command: yêu cầu thay đổi, được kiểm tra nghiệp vụ.
- Event: sự kiện đã xảy ra, ví dụ OrderPlaced, PaymentCaptured.
- Aggregate: cụm dữ liệu nhất quán, phát event.
- Projection: đọc event và xây read model cho truy vấn.
- Snapshot: ảnh trạng thái tại một version để giảm thời gian replay.

~~~text
Command --> Aggregate kiểm tra --> append Event(version=7)
                                  |
                                  v
                           Event store (append-only)
                                  |
                    +-------------+-------------+
                    v                           v
             Projection A                 Projection B
             (read model)                 (audit/search)
~~~

Ưu điểm: audit đầy đủ, có thể replay để sửa lỗi, dễ mô hình hoá nghiệp vụ phức tạp. Nhược điểm: schema event thay đổi khó, truy vấn phức tạp cần projection, xoá dữ liệu cá nhân khó vì event bất biến, và replay có thể tốn kém.

### Khi nào dùng
Dùng cho ledger tài chính, hệ thống cần audit, quy trình nghiệp vụ phức tạp, hoặc khi cần tái tạo trạng thái quá khứ. Không dùng cho CRUD đơn giản.

### Hay nhầm với
Khác event-driven: event-driven chỉ nói service giao tiếp qua sự kiện; event sourcing nói sự kiện là nguồn sự thật. Khác CDC: CDC đọc thay đổi từ database hiện có, không nhất thiết lưu event như nguồn chính. Khác audit log: audit log thường chỉ để tra cứu, không dựng lại trạng thái.`,
    refs: [
      { type: 'doc', title: 'microservices.io: Event sourcing', url: 'https://microservices.io/patterns/data/event-sourcing.html' },
      { type: 'article', title: 'Martin Fowler: Event Sourcing', url: 'https://martinfowler.com/eaaDev/EventSourcing.html' },
    ],
    related: ['cqrs', 'transactional-outbox', 'double-entry-ledger', 'reconciliation'],
  },
  {
    id: 'cqrs',
    term: 'CQRS',
    aliases: ['cqrs', 'command query responsibility segregation', 'command-query separation', 'tách lệnh và truy vấn'],
    short: 'Tách đường ghi dữ liệu khỏi đường đọc dữ liệu để tối ưu riêng từng bên.',
    body: `### Ví dụ đời thường
Một nhà hàng có quầy nhận order riêng và quầy trả món riêng. Đầu bếp tập trung nấu, nhân viên phục vụ tập trung giao món. Không ai bắt đầu bếp vừa nấu vừa chạy ra bàn để trả lời thực đơn.

### Cơ chế
CQRS chia mô hình thành hai phía:
- Command side: xử lý thay đổi, kiểm tra nghiệp vụ, ghi vào write model. Thường chuẩn hoá và nhất quán mạnh.
- Query side: phục vụ đọc, dùng read model được tối ưu cho truy vấn, có thể denormalized, nằm ở database khác.

Hai bên đồng bộ qua sự kiện hoặc projection. Vì vậy read model có thể trễ so với write model, dẫn tới eventual consistency. Người dùng vừa ghi có thể chưa thấy dữ liệu ở màn hình danh sách; cần xử lý bằng cách đọc từ write side sau khi ghi, hoặc hiển thị trạng thái chờ.

~~~text
Client --command--> Write model --> Event --> Projection --> Read model
Client --query--------------------------------------------> Read model
                                     (độ trễ nhất quán cuối)
~~~

CQRS không bắt buộc đi kèm event sourcing, nhưng hai cái thường gặp nhau. CQRS có thể chỉ là tách database đọc/ghi, hoặc tách service. Cái giá là nhiều code hơn, nhiều hạ tầng hơn, và phải xử lý đồng bộ, replay, rebuild projection.

### Khi nào dùng
Dùng khi tải đọc và ghi rất khác nhau, khi read model cần hình dạng khác write model, hoặc khi cần nhiều góc nhìn trên cùng dữ liệu. Không dùng cho CRUD nhỏ, ít phức tạp.

### Hay nhầm với
Không đồng nghĩa event sourcing: CQRS tách mô hình đọc/ghi, event sourcing lưu sự kiện làm nguồn sự thật. Khác read replica: replica giữ cùng schema, read model CQRS thường schema khác. Khác microservices: CQRS là pattern trong một bounded context, có thể dùng trong monolith.`,
    refs: [
      { type: 'doc', title: 'microservices.io: CQRS', url: 'https://microservices.io/patterns/data/cqrs.html' },
      { type: 'article', title: 'Martin Fowler: CQRS', url: 'https://martinfowler.com/bliki/CQRS.html' },
    ],
    related: ['event-sourcing', 'eventual-consistency', 'transactional-outbox', 'api-gateway'],
  },
  {
    id: 'api-gateway',
    term: 'API gateway',
    aliases: ['api gateway', 'api-gateway', 'api gateways', 'cổng api'],
    short: 'Một cửa vào chung cho client, đứng trước nhiều service phía sau.',
    body: `### Ví dụ đời thường
Toà nhà văn phòng có một quầy lễ tân. Khách không đi thẳng vào từng phòng; lễ tân kiểm tra giấy tờ, gọi người cần gặp và chỉ đường. Mọi người vào qua một cửa, nhưng công việc bên trong vẫn do từng phòng đảm nhận.

### Cơ chế
API gateway nhận request từ client và chuyển tới service phù hợp. Nó thường đảm nhận:
- Routing theo path, host, header.
- Xác thực và phân quyền, kiểm tra token, API key.
- Rate limiting và quota.
- TLS termination, nén, CORS.
- Aggregate response từ nhiều service.
- Log, metric, tracing, correlation id.
- Phiên bản API, rewrite path.

~~~text
Client --> [ API Gateway ]
                |-- /orders  --> Order service
                |-- /users   --> User service
                |-- /pay     --> Payment service
                |-- auth, rate limit, log, trace
~~~

Gateway không nên chứa logic nghiệp vụ phức tạp; nếu nhét quá nhiều, nó thành monolith mới và là điểm chết duy nhất. Cần thiết kế stateless, scale ngang, có health check và cấu hình động. BFF (backend for frontend) là biến thể: mỗi loại client có gateway riêng, tối ưu response.

### Khi nào dùng
Dùng khi có nhiều service cần một điểm vào chung, cần xác thực tập trung, hoặc cần che giấu cấu trúc nội bộ. Cũng dùng cho API public cần quota và versioning.

### Hay nhầm với
Khác load balancer: load balancer chia tải ở tầng thấp, gateway hiểu API và làm thêm auth, routing nghiệp vụ. Khác reverse proxy: reverse proxy chỉ chuyển tiếp, gateway có thêm chính sách. Khác service mesh: mesh xử lý giao tiếp service-to-service, gateway xử lý client-to-service.`,
    refs: [
      { type: 'doc', title: 'microservices.io: API gateway', url: 'https://microservices.io/patterns/apigateway.html' },
    ],
    related: ['service-discovery', 'rate-limiting', 'correlation-id', 'distributed-tracing', 'webhook'],
  },
  {
    id: 'service-discovery',
    term: 'Service discovery',
    aliases: ['service discovery', 'service-discovery', 'service registry', 'service registries', 'khám phá dịch vụ'],
    short: 'Cách một service tìm được địa chỉ hiện tại của service khác.',
    body: `### Ví dụ đời thường
Bạn cần gọi cho bác sĩ nhưng họ vừa chuyển phòng khám. Bạn tra danh bạ điện thoại để lấy số mới, thay vì dùng số cũ đã ngắt. Danh bạ được cập nhật khi có người chuyển đi hoặc đổi số.

### Cơ chế
Trong môi trường động, instance sinh ra và chết liên tục, IP thay đổi. Service discovery cung cấp registry để instance đăng ký địa chỉ và client tìm địa chỉ. Có hai mô hình:
- Client-side discovery: client hỏi registry, chọn instance, tự gọi. Ví dụ Eureka, Consul.
- Server-side discovery: client gọi một địa chỉ ổn định, bộ cân bằng tải phía sau hỏi registry và chuyển tiếp. Ví dụ Kubernetes Service, AWS ALB.

Registry cần health check, TTL, deregister khi instance chết. Dữ liệu có thể trễ, nên client cần retry, timeout và cache hợp lý.

~~~text
Instance A --register/heartbeat--> Registry
Client --lookup(service-b)-------> Registry
Registry --trả danh sách IP------> Client
Client --gọi trực tiếp-----------> Instance B
~~~

Kubernetes thường dùng DNS và Service: tên service phân giải thành ClusterIP, Endpoints cập nhật khi pod thay đổi. Đây là server-side discovery ngầm. Với đa cụm hoặc multi-cloud, cần giải pháp xuyên cụm như Consul hoặc service mesh.

### Khi nào dùng
Dùng khi service scale ngang, chạy container, thay đổi IP thường xuyên, hoặc cần failover tự động. Cũng dùng khi chuyển từ cấu hình IP tĩnh sang môi trường động.

### Hay nhầm với
Không phải DNS thông thường: DNS có thể là một phần, nhưng discovery cần health check và cập nhật động. Khác load balancer: discovery tìm địa chỉ, load balancer chia tải. Khác API gateway: gateway là cửa cho client bên ngoài, discovery chủ yếu cho giao tiếp nội bộ.`,
    refs: [
      { type: 'doc', title: 'microservices.io: Service registry', url: 'https://microservices.io/patterns/service-registry.html' },
    ],
    related: ['api-gateway', 'leader-election', 'distributed-tracing'],
  },
  {
    id: 'double-entry-ledger',
    term: 'Double-entry ledger',
    aliases: ['double-entry ledger', 'double entry ledger', 'double-entry', 'double entry', 'sổ kép', 'ghi sổ kép'],
    short: 'Sổ ghi mọi giao dịch thành hai vế đối ứng để tổng luôn cân bằng.',
    body: `### Ví dụ đời thường
Bạn chuyển 100 nghìn từ ví của mình sang ví bạn. Trong sổ, ví bạn giảm 100 và ví người nhận tăng 100. Không có đồng tiền nào tự sinh ra; tổng tài sản trong hệ thống không đổi.

### Cơ chế
Mỗi giao dịch gồm ít nhất hai bút toán: một ghi nợ (debit) và một ghi có (credit), tổng bằng 0. Tài khoản không lưu số dư trực tiếp mà số dư được tính từ tổng các bút toán, hoặc lưu cache kèm kiểm tra định kỳ.

Nguyên tắc thực hiện:
- Bút toán là bất biến, sai thì ghi bút toán đảo, không sửa dòng cũ.
- Mỗi giao dịch có id duy nhất và idempotency key để tránh ghi hai lần.
- Số tiền dùng đơn vị nhỏ nhất, ví dụ cents, tránh số thực.
- Khóa tài khoản theo thứ tự cố định để tránh deadlock khi chuyển tiền.
- Có tài khoản treo cho tiền đang xử lý, ví dụ pending, để tổng vẫn cân.

~~~text
Chuyển 100 từ A sang B:
  Debit  A 100
  Credit B 100
  -----------------
  Tổng    0

Sổ:
  A: -100
  B: +100
~~~

Double-entry giúp phát hiện sai sót: nếu tổng không bằng 0, có lỗi. Nó cũng là nền tảng cho đối soát, hoàn tiền, phí, và báo cáo tài chính. Nhưng nó không tự giải quyết tính nhất quán phân tán; cần transaction và idempotency.

### Khi nào dùng
Dùng cho ví, ngân hàng, sàn thương mại, hệ thống tích điểm quy đổi ra tiền, và mọi nơi cần audit tài chính. Nên dùng ngay từ đầu thay vì chỉ lưu số dư.

### Hay nhầm với
Khác single-entry: single-entry chỉ ghi một vế, dễ sai và khó đối soát. Khác event sourcing: double-entry là mô hình kế toán, có thể cài trên event store hoặc database thường. Khác reconciliation: đối soát là kiểm tra sổ với bên ngoài, double-entry là cách ghi sổ bên trong.`,
    refs: [
      { type: 'article', title: 'Investopedia: Double-entry accounting', url: 'https://en.wikipedia.org/wiki/Double-entry_bookkeeping' },
    ],
    related: ['reconciliation', 'chargeback', 'event-sourcing', 'idempotency'],
  },
  {
    id: 'reconciliation',
    term: 'Reconciliation',
    aliases: ['reconciliation', 'reconcile', 'reconciled', 'đối soát', 'đối chiếu'],
    short: 'So sánh hai nguồn số liệu để tìm và xử lý chênh lệch.',
    body: `### Ví dụ đời thường
Cuối ngày, người thu ngân đếm tiền trong két và so với tổng hoá đơn. Nếu thiếu 50 nghìn, họ kiểm tra lại giao dịch, có thể do thối nhầm hoặc một hoá đơn bị bỏ sót. Đối soát giúp phát hiện sai sót trước khi quá muộn.

### Cơ chế
Trong thanh toán, reconciliation so sánh sổ nội bộ với sao kê của ngân hàng hoặc PSP. Quy trình điển hình:
1. Tải file settlement hoặc gọi API lấy danh sách giao dịch của kỳ.
2. Match theo khóa: payment id, idempotency key, mã tham chiếu, số tiền, thời gian.
3. Phân loại: khớp, chỉ có nội bộ, chỉ có đối tác, lệch số tiền, lệch phí.
4. Xử lý: điều chỉnh, tạo bút toán bù, ghi vào tài khoản treo, hoặc chuyển người kiểm tra.
5. Báo cáo và cảnh báo các khoản chênh lệch lớn hoặc lặp lại.

~~~text
Sổ nội bộ:        PSP settlement:
  T1 100k           T1 100k
  T2  50k           T3  70k
  T3  70k           T4 200k
  T4 200k

Khớp: T1, T3, T4
Chỉ nội bộ: T2 (có thể PSP chưa ghi nhận)
Chỉ PSP: không có
--> điều tra T2, không sửa mù
~~~

Chênh lệch thường do độ trễ (timing), phí, hoàn tiền, chargeback, tỉ giá, hoặc lỗi ghi trùng. Không nên tự động sửa mọi thứ; cần phân loại và có ngưỡng. Chạy đối soát định kỳ, tốt nhất hằng ngày, và lưu kết quả để audit.

### Khi nào dùng
Dùng cho thanh toán, ví, chuyển khoản, hoàn tiền, kế toán, tích điểm, và đồng bộ dữ liệu giữa hai hệ thống. Cũng dùng sau sự cố để tìm giao dịch bị ảnh hưởng.

### Hay nhầm với
Khác settlement: settlement là việc chuyển tiền thật giữa các bên; reconciliation là kiểm tra sổ sách. Khác chargeback: chargeback là tranh chấp từ khách, là một nguồn gây lệch cần đối soát. Khác audit: audit kiểm tra tuân thủ và kiểm soát, reconciliation là so khớp số liệu cụ thể.`,
    refs: [
      { type: 'article', title: 'Wikipedia: Reconciliation (accounting)', url: 'https://en.wikipedia.org/wiki/Reconciliation_%28accounting%29' },
    ],
    related: ['double-entry-ledger', 'chargeback', 'payment-intent', 'webhook'],
  },
  {
    id: 'chargeback',
    term: 'Chargeback',
    aliases: ['chargeback', 'chargebacks', 'charge back', 'hoàn tiền tranh chấp', 'khiếu nại thẻ'],
    short: 'Khách yêu cầu ngân hàng phát hành thẻ lấy lại tiền của một giao dịch.',
    body: `### Ví dụ đời thường
Bạn mua một món đồ online nhưng nhận được hàng hỏng, người bán không phản hồi. Bạn gọi ngân hàng nhờ đòi lại tiền. Ngân hàng tạm giữ tiền của người bán và yêu cầu hai bên cung cấp bằng chứng.

### Cơ chế
Chargeback là quy trình tranh chấp do ngân hàng phát hành thẻ khởi tạo, không phải người bán tự hoàn tiền. Các bước thường gặp:
1. Khách gửi khiếu nại tới ngân hàng phát hành.
2. Ngân hàng kiểm tra, có thể cấp credit tạm thời.
3. Khoản tiền bị giữ hoặc rút khỏi tài khoản người bán (provisional credit).
4. Người bán nhận thông báo, phải phản hồi trong thời hạn với bằng chứng: hoá đơn, log giao dịch, chứng từ giao hàng, email xác nhận.
5. Mạng thẻ ra quyết định; có thể có bước đại diện (representment) hoặc trọng tài.

Lý do phổ biến: hàng không nhận, không đúng mô tả, giao dịch lạ, trùng lặp, dịch vụ không cung cấp. Mỗi lý do có mã và yêu cầu bằng chứng riêng.

~~~text
Khách --> Ngân hàng phát hành: khiếu nại
Ngân hàng --> Mạng thẻ: mở dispute
Mạng thẻ --> PSP/người bán: thông báo + deadline
Người bán --> PSP: bằng chứng
PSP --> Mạng thẻ --> Ngân hàng: quyết định
Kết quả: chấp nhận (mất tiền) hoặc bác (hoàn lại)
~~~

Chargeback khác refund ở chỗ refund là người bán chủ động trả lại tiền. Chargeback tốn phí, ảnh hưởng tỉ lệ rủi ro và có thể dẫn tới bị phạt hoặc mất quyền nhận thẻ. Cần lưu bằng chứng giao dịch đủ lâu và tự động hoá phản hồi.

### Khi nào dùng
Dùng khi vận hành thanh toán thẻ, cần xử lý tranh chấp, hoặc thiết kế quy trình chống gian lận. Không phải công cụ để khách đổi ý; đổi ý nên dùng refund theo chính sách.

### Hay nhầm với
Khác refund: refund do người bán chủ động, chargeback do ngân hàng khởi tạo. Khác fraud alert: cảnh báo gian lận là tín hiệu trước giao dịch, chargeback là tranh chấp sau giao dịch. Khác dispute nội bộ: dispute có thể là bước trước khi thành chargeback chính thức.`,
    refs: [
      { type: 'doc', title: 'Stripe: Disputes and chargebacks', url: 'https://docs.stripe.com/disputes' },
    ],
    related: ['reconciliation', 'payment-intent', 'double-entry-ledger', 'webhook'],
  },
  {
    id: 'webhook',
    term: 'Webhook',
    aliases: ['webhook', 'webhooks', 'web hook'],
    short: 'Một hệ thống tự gửi thông báo HTTP tới URL của bạn khi có sự kiện.',
    body: `### Ví dụ đời thường
Bạn đặt mua hàng và để lại số điện thoại. Khi hàng tới bưu cục, bưu điện nhắn tin cho bạn, thay vì bạn phải gọi hỏi mỗi giờ. Tin nhắn đến chủ động, nhưng bạn phải có số đúng và xử lý được tin nhắn.

### Cơ chế
Nhà cung cấp (PSP, GitHub, shipping...) gửi HTTP POST tới endpoint của bạn mỗi khi có sự kiện. Request có body JSON và thường có header chữ ký. Các điểm cần xử lý:
- Xác minh chữ ký HMAC bằng secret, so sánh an toàn thời gian.
- Kiểm tra timestamp để chống replay, chấp nhận cửa sổ vài phút.
- Trả 2xx nhanh, thường dưới vài giây; xử lý nặng đưa vào queue.
- Dedupe theo event id vì nhà cung cấp có thể gửi lặp.
- Không dựa vào thứ tự; các sự kiện có thể đến lệch.
- Có endpoint riêng, log đầy đủ, retry và DLQ khi xử lý lỗi.

~~~text
PSP --POST /webhooks/psp--> Your endpoint
     header: signature, timestamp
     body: {id, type, data}

1. verify signature
2. dedupe by event.id
3. enqueue, trả 200 ngay
4. worker xử lý, cập nhật order
~~~

Webhook không đáng tin tuyệt đối: có thể mất, trễ, lặp, hoặc đến trước khi giao dịch nội bộ commit. Vì vậy cần đối soát định kỳ và cho phép chủ động hỏi lại trạng thái (polling) khi cần. Đừng chỉ dựa vào webhook cho số liệu tài chính.

### Khi nào dùng
Dùng khi tích hợp bên thứ ba cần thông báo gần thời gian thực: thanh toán, vận chuyển, CI/CD, chat, email. Cũng dùng nội bộ giữa service nếu không muốn dựng message broker.

### Hay nhầm với
Khác polling: polling là bạn hỏi định kỳ, webhook là bên kia đẩy tới. Khác callback: callback thường là hàm được gọi trong cùng tiến trình hoặc API phản hồi; webhook là HTTP qua mạng. Khác message queue: webhook không có broker lưu trữ và retry chuẩn hoá, dù nhà cung cấp có retry riêng.`,
    refs: [
      { type: 'doc', title: 'Stripe: Webhooks', url: 'https://docs.stripe.com/webhooks' },
    ],
    related: ['idempotency-key', 'payment-intent', 'reconciliation', 'correlation-id'],
  },
  {
    id: 'correlation-id',
    term: 'Correlation ID',
    aliases: ['correlation id', 'correlation-id', 'correlationid', 'correlation ids', 'mã tương quan'],
    short: 'Mã gắn vào một request để nối tất cả log và service liên quan.',
    body: `### Ví dụ đời thường
Một kiện hàng có mã vận đơn. Khi khách hỏi "hàng của tôi đâu", bạn tra mã đó và thấy nó đã qua kho, đang trên xe, sắp tới. Cùng một mã giúp nối các chặng do nhiều người khác nhau xử lý.

### Cơ chế
Correlation ID thường được sinh ở biên (gateway, load balancer hoặc client) và truyền xuyên suốt:
- HTTP header, ví dụ X-Correlation-ID hoặc X-Request-ID.
- Message header khi gửi qua broker.
- Log MDC để mọi dòng log trong request có cùng mã.
- Response trả lại cho client để hỗ trợ điều tra.

Khi qua service, ID được giữ nguyên hoặc ánh xạ sang trace id. Với W3C Trace Context, traceparent chứa trace-id và span-id; correlation id có thể là trace-id hoặc một mã nghiệp vụ riêng.

~~~text
Client --X-Correlation-ID: abc--> Gateway
Gateway --abc--> Order service --abc--> Payment service
Log:
  order:   corr=abc nhận request
  payment: corr=abc gọi PSP
  psp:     corr=abc timeout
--> tra abc thấy toàn bộ chuỗi
~~~

Cần thống nhất tên header giữa các service và bảo đảm không bị mất khi qua async. Không nên dùng correlation id làm idempotency key vì một correlation id có thể bao nhiều thao tác; cũng không nên sinh lại ở mỗi service.

### Khi nào dùng
Dùng trong mọi hệ thống có nhiều service hoặc xử lý bất đồng bộ, đặc biệt khi debug sự cố và hỗ trợ khách hàng. Là bước đầu tiên trước khi triển khai distributed tracing đầy đủ.

### Hay nhầm với
Khác trace id: trace id là một phần của distributed tracing, thường do thư viện sinh và có cấu trúc; correlation id có thể là mã nghiệp vụ đơn giản. Khác request id: request id đôi khi được sinh lại ở từng hop, correlation id phải giữ nguyên. Khác idempotency key: idempotency key đại diện một thao tác ghi.`,
    refs: [
      { type: 'doc', title: 'W3C: Trace Context', url: 'https://www.w3.org/TR/trace-context/' },
    ],
    related: ['distributed-tracing', 'idempotency-key', 'webhook', 'timeout-budget'],
  },
  {
    id: 'distributed-tracing',
    term: 'Distributed tracing',
    aliases: ['distributed tracing', 'distributed-tracing', 'distributed trace', 'distributed traces', 'truy vết phân tán'],
    short: 'Theo dõi một request đi qua nhiều service dưới dạng các span nối với nhau.',
    body: `### Ví dụ đời thường
Bạn gửi một bưu kiện đi xa. Mỗi chặng có một phiếu ghi ai nhận, ai gửi, mất bao lâu. Ghép các phiếu lại thành hành trình đầy đủ, bạn biết kiện hàng kẹt ở kho nào và lâu bao nhiêu.

### Cơ chế
Distributed tracing dùng hai khái niệm:
- Trace: toàn bộ hành trình của một request, có trace id.
- Span: một đơn vị công việc trong trace, có span id, parent span id, start/end time, thuộc tính.

Khi service A gọi B, nó truyền context (trace id, span id, sampling flag) qua HTTP header hoặc message header. Mỗi service tạo span con. Collector nhận span từ các service, ghép thành cây và lưu trữ. UI hiển thị timeline để thấy span nào chậm.

~~~text
Trace abc
  [gateway 5ms]
    [order 120ms]
      [payment 80ms]
        [PSP call 70ms]  <-- critical path
      [inventory 10ms]
~~~

Sampling rất quan trọng vì lưu mọi trace rất tốn kém. Có thể sample theo tỉ lệ, theo lỗi, hoặc tail-based sampling (quyết định sau khi thấy toàn bộ trace). Cần lan truyền quyết định sample để không bị đứt đoạn.

Công cụ: OpenTelemetry (chuẩn thu thập), Jaeger, Tempo, Zipkin, X-Ray, Datadog. Trong Java, agent hoặc SDK tự động instrument Spring, JDBC, Kafka.

### Khi nào dùng
Dùng khi có nhiều service, cần tìm điểm chậm, hiểu luồng async, hoặc điều tra lỗi liên service. Cũng dùng để đo SLO theo từng chặng.

### Hay nhầm với
Khác logging: log là sự kiện rời rạc, trace là cấu trúc theo request. Khác metric: metric là số liệu tổng hợp, trace là mẫu chi tiết. Khác correlation id: correlation id chỉ nối log, tracing có cấu trúc span và quan hệ cha-con.`,
    refs: [
      { type: 'doc', title: 'OpenTelemetry: Traces', url: 'https://opentelemetry.io/docs/concepts/signals/traces/' },
    ],
    related: ['correlation-id', 'timeout-budget', 'api-gateway', 'circuit-breaker'],
  },
  {
    id: 'timeout-budget',
    term: 'Timeout budget',
    aliases: ['timeout budget', 'timeout-budget', 'deadline budget', 'ngân sách thời gian chờ', 'ngân sách timeout'],
    short: 'Tổng thời gian tối đa một request được phép dùng, chia dần cho từng bước gọi.',
    body: `### Ví dụ đời thường
Bạn có 30 phút để nấu cơm, canh và xào. Nếu canh đã mất 20 phút, bạn chỉ còn 10 phút cho món xào, không thể tiếp tục chờ canh thêm 20 phút nữa. Ngân sách thời gian chia cho từng việc và co lại khi đã dùng.

### Cơ chế
Timeout budget, hay deadline propagation, là một hạn chót tuyệt đối cho toàn bộ request. Mỗi lần gọi service khác phải:
1. Tính thời gian còn lại = deadline - now.
2. Đặt timeout cho lời gọi nhỏ hơn thời gian còn lại một khoảng an toàn.
3. Truyền deadline hoặc thời gian còn lại cho service con.
4. Không retry nếu đã quá deadline hoặc retry sẽ vượt deadline.

gRPC hỗ trợ deadline sẵn; service con nhận được và tự huỷ khi hết hạn. Với HTTP, có thể truyền header như X-Request-Deadline hoặc dùng context lan truyền. Nếu chỉ đặt timeout cố định ở từng hop, tổng thời gian có thể cộng dồn vượt xa mức người dùng chịu được.

~~~text
Client deadline: 1000ms
  Gateway timeout: 900ms, còn 900
    Order timeout: 600ms, còn 500
      Payment timeout: 300ms, còn 250
        PSP timeout: 200ms

Nếu payment đã dùng 280ms --> còn 220ms
Không gọi thêm bước nào có timeout > 220ms
~~~

Cần chừa buffer cho network và xử lý cuối. Timeout quá ngắn gây lỗi giả; quá dài làm cạn thread. Đặt timeout dựa trên percentile thực tế, ví dụ p99, và review khi dependency thay đổi.

### Khi nào dùng
Dùng trong mọi hệ thống nhiều tầng, đặc biệt khi có retry, fan-out và chuỗi gọi service. Cũng cần cho job nền có hạn chót.

### Hay nhầm với
Khác timeout đơn lẻ: timeout chỉ cắt một lời gọi, budget quản lý tổng thể. Khác retry: retry phải tôn trọng budget, không được làm tổng thời gian vượt hạn. Khác SLA/SLO: SLA là cam kết với khách, budget là công cụ kỹ thuật để đạt cam kết đó.`,
    refs: [
      { type: 'article', title: 'AWS Builders Library: Timeouts, retries and backoff with jitter', url: 'https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/' },
    ],
    related: ['retry', 'circuit-breaker', 'distributed-tracing', 'backpressure'],
  },
  {
    id: 'fan-out',
    term: 'Fan-out',
    aliases: ['fan-out', 'fan out', 'fanout', 'fan-out pattern', 'tỏa nhánh'],
    short: 'Một sự kiện hoặc request được gửi tới nhiều nơi xử lý cùng lúc.',
    body: `### Ví dụ đời thường
Một trường học có thông báo nghỉ học. Nhà trường gửi tin nhắn tới tất cả phụ huynh, mỗi người nhận một bản. Chỉ một thông báo được tạo ra, nhưng có rất nhiều người nhận và xử lý.

### Cơ chế
Fan-out có hai nghĩa phổ biến:
- Message fan-out: một event được gửi tới nhiều queue/topic/consumer độc lập. Ví dụ SNS fan-out tới nhiều SQS, mỗi queue cho một downstream. Mỗi consumer xử lý độc lập, lỗi ở một nhánh không chặn nhánh khác nếu tách queue.
- Request fan-out: một request gọi song song nhiều service rồi tổng hợp kết quả. Ví dụ trang chủ gọi product, price, review cùng lúc.

~~~text
Message fan-out:
  OrderCreated --> SQS email
               --> SQS analytics
               --> SQS inventory
               --> SQS fraud

Request fan-out:
  Client --> Aggregator --song song--> Service A
                         --song song--> Service B
                         --song song--> Service C
                         <-- tổng hợp kết quả
~~~

Vấn đề thường gặp: bùng nổ tải, một sự kiện nhân lên nhiều lần, chi phí tăng, partial failure khi một nhánh lỗi, và thứ tự không được bảo đảm giữa các nhánh. Cần idempotency cho từng consumer, timeout cho từng nhánh, và quyết định có chờ tất cả hay trả kết quả một phần.

Fan-out sâu có thể gây khuếch đại: một request tạo 10, mỗi cái tạo 10, thành 100. Cần giới hạn độ sâu và số nhánh, theo dõi cardinality.

### Khi nào dùng
Dùng khi một sự kiện cần nhiều hệ thống phản ứng, khi cần tổng hợp dữ liệu từ nhiều service, hoặc khi muốn tách consumer để xử lý độc lập.

### Hay nhầm với
Khác broadcast: broadcast gửi tới mọi người nhận theo một kênh, fan-out thường là chủ động nhân bản tới nhiều đích. Khác fan-in: fan-in gom nhiều nguồn về một nơi. Khác scatter-gather: scatter-gather là fan-out request rồi gom kết quả, chỉ là một biến thể.`,
    refs: [
      { type: 'doc', title: 'AWS: Fanout pattern with SNS and SQS', url: 'https://docs.aws.amazon.com/sns/latest/dg/sns-common-scenarios.html' },
    ],
    related: ['message-broker', 'consumer-group', 'partition', 'backpressure', 'timeout-budget'],
  }
);
