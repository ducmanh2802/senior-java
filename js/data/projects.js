/* Senior Java pet-project blueprints. Progress lives in App.store by milestone. */
window.PROJECTS = [
  {
    id: 'proj-wallet', title: 'Ví điện tử và ledger kế toán kép', level: 'senior', weeks: 8,
    skills: ['Spring Boot 3', 'PostgreSQL', 'OAuth2/JWT', 'Redis', 'Kafka', 'Docker', 'Testcontainers'],
    pitch: `Xây dựng ví có nạp, chuyển và hoàn tiền với sổ cái bất biến, để interviewer thấy bạn hiểu tính đúng đắn của tiền trước khi tối ưu throughput. Điểm nhấn là mỗi giao dịch cân bằng Nợ/Có và có thể truy vết từ API tới event.`,
    requirements: `### Chức năng
- Tạo ví, nạp tiền mô phỏng, chuyển tiền, hoàn giao dịch và xem lịch sử.
- Mỗi lệnh nhận idempotency key; retry cùng key không tạo bút toán mới.
### Phi chức năng
- Mục tiêu demo: 100 request/giây, p95 dưới 300 ms ở tải thường; kiểm tra bằng benchmark có ghi cấu hình máy.
- PostgreSQL là nguồn dữ liệu chuẩn; không để số dư trong Redis quyết định giao dịch.
- Không ghi thông tin thẻ thật; dùng dữ liệu giả và giới hạn quyền theo chủ ví.`,
    architecture: `~~~text
Client -> Spring Boot API -> PostgreSQL (wallet, transfer, ledger, outbox)
                         -> Redis (rate limit, cache đọc)
Outbox relay -> Kafka -> notification / audit consumer
~~~
API xác thực OAuth2 Resource Server/JWT, kiểm tra quyền sở hữu ví rồi ghi transfer, ledger và outbox trong cùng transaction PostgreSQL. Consumer dùng inbox hoặc unique event id để khử lặp; Redis chỉ hỗ trợ giới hạn tốc độ và cache dữ liệu đọc có thể làm mới.`,
    milestones: [
      { title: 'Mô hình dữ liệu và quy tắc tiền', tasks: `Thiết kế wallet, transfer, ledger_entry, outbox; dùng NUMERIC cho tiền, ghi rõ currency và quy tắc làm tròn.`, done: `Migration chạy được trên PostgreSQL; constraint theo từng dòng chặn amount không hợp lệ, còn invariant debit/credit được kiểm tra trong transaction hoặc bằng deferred constraint trigger; không dùng floating point.` },
      { title: 'API và xác thực', tasks: `Tạo API ví, chuyển tiền, lịch sử; cấu hình Spring Security OAuth2 Resource Server và kiểm tra quyền theo chủ sở hữu.`, done: `Test chứng minh người dùng A không đọc hoặc chuyển tiền từ ví của B; response lỗi không lộ dữ liệu nhạy cảm.` },
      { title: 'Chuyển tiền an toàn khi retry', tasks: `Thêm idempotency key, unique constraint và transaction; xử lý hai request đồng thời cùng key.`, done: `Integration test Testcontainers gửi request song song: chỉ có một transfer và một bộ ledger entries.` },
      { title: 'Outbox và event', tasks: `Ghi event vào outbox cùng transaction nghiệp vụ; relay phát Kafka và consumer xử lý lặp an toàn.`, done: `Test mô phỏng publish lại cùng event; notification chỉ có một kết quả nghiệp vụ.` },
      { title: 'Rate limit, quan sát và đóng gói', tasks: `Thêm rate limit theo user, metrics/health/log correlation id và docker compose cho môi trường local.`, done: `README có lệnh chạy sạch, dashboard hoặc ảnh metrics, benchmark có tải và giới hạn đã nêu.` }
    ],
    challenges: [
      `### Race khi chuyển tiền
Hai transaction cùng đọc số dư cũ có thể cùng tiêu một khoản. Dùng UPDATE có điều kiện hoặc khóa hàng/serializable phù hợp, kiểm tra số hàng bị cập nhật và retry lỗi serialization có giới hạn.`,
      `### Idempotency và timeout
Client timeout không chứng minh transaction thất bại. Lưu key cùng trạng thái/kết quả trong transaction; unique constraint là hàng rào cuối, và request cùng key nhưng payload khác phải bị từ chối.`,
      `### Event phát trùng
Database commit và Kafka publish không phải một transaction mặc định. Outbox tránh mất event giữa hai bước; consumer vẫn phải idempotent vì relay có thể phát lại sau crash.`
    ],
    readme: `# Wallet Ledger\n\n## Mục tiêu\nVí demo tập trung vào tính đúng đắn của chuyển tiền, idempotency và khả năng kiểm toán. Không xử lý tiền thật.\n\n## Kiến trúc\nSpring Boot 3, PostgreSQL là nguồn dữ liệu chuẩn, transactional outbox phát sự kiện sang Kafka; Redis chỉ dùng cho cache/rate limit.\n\n## Chạy local\nYêu cầu Docker. Chạy {{docker compose up --build}}; áp dụng migration tự động và dùng profile local với dữ liệu giả.\n\n## Kiểm thử và benchmark\nChạy unit test và integration test với Testcontainers. Ghi rõ máy, cấu hình, dữ liệu, concurrency, throughput và p95/p99; không coi số đo local là cam kết production.\n\n## Quyết định thiết kế\nLedger append-only giúp tái dựng biến động; số dư có thể là projection nhưng phải đối soát từ entries. Idempotency dựa trên unique constraint, không dựa riêng vào cache.`,
    interview: { story: `### STAR
**Situation:** Bản demo chuyển tiền có thể bị gửi lại khi client timeout và hai yêu cầu đồng thời làm số dư sai.\n**Task:** Tôi cần giữ sổ cái cân bằng và không ghi nhận giao dịch lặp.\n**Action:** Tôi mô hình hóa mỗi chuyển tiền bằng hai ledger entry, đặt unique constraint cho idempotency key, cập nhật số dư có điều kiện trong transaction và phát event qua outbox. Tôi dùng Testcontainers để kiểm tra retry, concurrency và trường hợp relay phát trùng.\n**Result:** Bộ test chứng minh invariant tiền và tính idempotent trong các tình huống lỗi đã mô phỏng; README công bố giới hạn benchmark và các failure mode còn lại.`, questions: ['Vì sao dùng ledger thay vì chỉ cập nhật balance?', 'Nếu Kafka ngừng một giờ sau khi DB commit thì điều gì xảy ra?', 'Bạn xử lý request cùng idempotency key nhưng khác payload thế nào?', 'Làm sao kiểm chứng không overspend khi hai transfer cạnh tranh?', 'Bạn đối soát balance projection với ledger ra sao?'] },
    related: ['lesson-spring-001', 'api-004']
  },
  {
    id: 'proj-shortlink', title: 'Rút gọn URL có quota và rate limit', level: 'mid', weeks: 4,
    skills: ['Spring Boot', 'PostgreSQL', 'Redis', 'REST API', 'Docker', 'Testing'],
    pitch: `Một dịch vụ nhỏ nhưng cho phép trình bày thiết kế API, mã định danh, cache và chống lạm dụng. Có thể mở rộng từng phần bằng số liệu thay vì tuyên bố “scale lớn” thiếu căn cứ.`,
    requirements: `### Chức năng
- Tạo short link, chọn alias tùy chọn, đặt hạn dùng và xem số lượt truy cập tổng hợp.
- Người dùng đăng nhập có quota; link công khai có rate limit và validate scheme.
### Phi chức năng
- Mục tiêu demo: 200 lần resolve/giây, p95 dưới 100 ms khi cache nóng; dữ liệu mẫu 1 triệu link.
- Không chuyển hướng tới scheme nguy hiểm như javascript:; giới hạn độ dài URL và chống enumeration ở endpoint quản trị.`,
    architecture: `~~~text
Client -> Spring Boot -> PostgreSQL (links, ownership)
                    -> Redis (resolve cache, rate limit)
                    -> event queue (optional click aggregation)
~~~
PostgreSQL lưu trạng thái chuẩn và unique alias; Redis cache kết quả resolve với TTL không vượt thời gian hết hạn của link. Click counting có thể bất đồng bộ nếu README nêu rõ độ trễ nhất quán.`,
    milestones: [
      { title: 'Contract REST và validation', tasks: `Định nghĩa API tạo, resolve, disable; validate URL, length, expiry và lỗi theo status code nhất quán.`, done: `OpenAPI hoặc bảng contract có ví dụ request/response và test các input không hợp lệ.` },
      { title: 'Alias và persistence', tasks: `Sinh mã ngắn ngẫu nhiên đủ entropy; lưu unique constraint và xử lý collision bằng retry hữu hạn.`, done: `Test collision giả lập chứng minh không ghi đè link khác; alias tùy chọn được bảo vệ uniqueness.` },
      { title: 'Quota, auth và abuse control', tasks: `Thêm quyền chủ sở hữu, quota tạo link và rate limit resolve theo IP/key với cấu hình rõ ràng.`, done: `Test xác nhận quota/rate limit và user không thể sửa link của người khác.` },
      { title: 'Cache và phép đo', tasks: `Thêm cache resolve có TTL, invalidation khi disable và benchmark hit/miss riêng biệt.`, done: `Báo cáo tải ghi dataset, warm-up, p95/p99, tỷ lệ hit; test xác nhận link hết hạn không được cache quá hạn.` }
    ],
    challenges: [
      `### Mã ngắn không đoán được
Counter tuần tự dễ enumeration. Mã ngẫu nhiên cần entropy đủ lớn; unique constraint xử lý collision, còn rate limit và authorization vẫn cần thiết.`,
      `### Cache và vô hiệu hóa
Link bị disable có thể còn tồn tại trong cache. Dùng TTL ngắn phù hợp, xóa key khi cập nhật và cân nhắc version/cache stampede; PostgreSQL vẫn là nguồn chuẩn.`,
      `### URL độc hại
Validate scheme, chuẩn hóa host và không fetch URL phía server trong luồng tạo link. Nếu có preview/fetch metadata, cần chống SSRF bằng allowlist và kiểm tra DNS/IP sau redirect.`
    ],
    readme: `# Shortlink Service\n\n## Mục tiêu\nAPI rút gọn URL với alias, expiry, quota và giới hạn lạm dụng.\n\n## Chạy local\nYêu cầu Docker; {{docker compose up --build}} khởi động ứng dụng, PostgreSQL và Redis.\n\n## API và cấu hình\nMô tả endpoint, auth, quota, rate limit, thời gian cache và cách tạo dữ liệu thử. Không lưu bí mật trong repository.\n\n## Kiểm thử và benchmark\nChạy unit/integration test. Đo resolve cache hit/miss ở cùng dataset, ghi cấu hình máy và percentile latency.\n\n## Quyết định thiết kế\nAlias có unique constraint; cache chỉ tăng tốc read. Đặt expiry trên dữ liệu chuẩn và không cho TTL cache vượt expiry.`,
    interview: { story: `### STAR
**Situation:** Tôi cần một pet project vừa đủ nhỏ để hoàn thành nhưng vẫn có vấn đề production thực tế.\n**Task:** Làm URL resolver có quota và không thành open redirect nguy hiểm.\n**Action:** Tôi xác định contract trước, validate scheme, đặt unique constraint cho alias, thêm rate limit và cache có TTL gắn với expiry. Tôi đo cache hit/miss riêng bằng dataset cố định.\n**Result:** Demo thể hiện rõ trade-off giữa độ trễ, khả năng thu hồi link và chống abuse; kết quả benchmark có thể lặp lại.`, questions: ['Tại sao không dùng ID tuần tự làm alias?', 'Redis bị lỗi thì resolve có hoạt động không?', 'Bạn xử lý cache stale sau khi disable link thế nào?', 'Làm sao tránh SSRF nếu bổ sung URL preview?', 'Bạn chọn status code nào cho link hết hạn và vì sao?'] },
    related: ['api-001', 'lesson-core-001']
  },
  {
    id: 'proj-flash-sale', title: 'Flash sale chống oversell', level: 'senior', weeks: 7,
    skills: ['Spring Boot', 'PostgreSQL', 'Redis', 'Kafka', 'Concurrency', 'Testcontainers', 'Kubernetes'],
    pitch: `Mô phỏng giờ mở bán với tồn kho hữu hạn và hàng đợi đơn. Câu chuyện phỏng vấn tập trung vào invariant tồn kho, backpressure và cách đo giới hạn thay vì chỉ thêm Redis.`,
    requirements: `### Chức năng
- Tạo campaign, giữ chỗ tồn kho có thời hạn, xác nhận đơn hoặc giải phóng reservation.
- Có idempotency cho yêu cầu mua và trạng thái đơn có thể truy vết.
### Phi chức năng
- Mục tiêu thử nghiệm: burst 1.000 request/giây trên dataset nhỏ, không oversell; báo rõ thiết bị và cấu hình.
- Hàng đợi có giới hạn; hệ thống trả trạng thái chờ hoặc từ chối có kiểm soát khi quá tải.`,
    architecture: `~~~text
Client -> API -> PostgreSQL conditional stock reservation + order
        -> Redis (optional admission rate limit)
Outbox -> Kafka -> payment simulator / expiry worker
~~~
PostgreSQL là nguồn chuẩn duy nhất cho stock và reservation; conditional update trong transaction chỉ nhận đơn khi available đủ, đồng thời ghi order và outbox. Redis chỉ có thể giới hạn/admit request, không giữ reservation. Kafka chuyển tiếp payment simulator và expiry worker; consumer xử lý idempotent. Đo giới hạn của phương án PostgreSQL trước khi cân nhắc partitioning hay admission queue.`,
    milestones: [
      { title: 'Định nghĩa invariant và state machine', tasks: `Viết trạng thái order/reservation và chuyển trạng thái hợp lệ; xác định thời điểm trừ, giữ và hoàn kho.`, done: `Tài liệu nêu invariant available + reserved + sold = total và test mọi chuyển trạng thái.` },
      { title: 'Conditional update và idempotency', tasks: `Dùng update tồn kho có điều kiện hoặc reservation record có unique key; đảm bảo transaction không oversell.`, done: `Testcontainers tạo cạnh tranh lớn hơn stock; tổng accepted không vượt stock và retry không nhân đôi order.` },
      { title: 'Backpressure và hàng đợi', tasks: `Giới hạn queue, timeout, retry có jitter và DLQ; phân biệt retryable với lỗi nghiệp vụ.`, done: `Load test cho thấy hành vi khi queue đầy và metrics thể hiện rejected, latency, queue depth.` },
      { title: 'Expiry và phục hồi', tasks: `Viết worker giải phóng reservation hết hạn an toàn, có thể chạy lặp và tiếp tục sau restart.`, done: `Test chạy worker hai lần không cộng kho hai lần; crash giữa chừng được phục hồi qua trạng thái lưu bền.` },
      { title: 'Triển khai và quan sát', tasks: `Đóng gói Docker, readiness/liveness, metrics và kịch bản scale consumer có partition key phù hợp.`, done: `README có sơ đồ, benchmark tái lập, cảnh báo oversell/queue lag và hướng rollback.` }
    ],
    challenges: [
      `### Atomicity qua nhiều hệ thống
Không thể giả định Redis, PostgreSQL và Kafka cùng commit nguyên tử. Chọn một nguồn sự thật, ghi trạng thái chuyển tiếp và dùng outbox/saga để bù trừ.`,
      `### Retry và đặt hàng trùng
Timeout khiến client không biết lệnh đã thành công chưa. Idempotency key cần unique ở persistence và trả lại kết quả cũ; không dựa trên kiểm tra rồi ghi riêng rẽ.`,
      `### Độ công bằng khi tranh suất
Thứ tự đến ở nhiều pod không đồng nghĩa thứ tự toàn cục. Nếu cần fairness, thiết kế admission queue/partition và công bố tiêu chí; đừng hứa FIFO khi kiến trúc không đảm bảo.`
    ],
    readme: `# Flash Sale\n\n## Mục tiêu\nMô phỏng nhận đơn cho chiến dịch có stock hữu hạn, đo tải và chứng minh không oversell.\n\n## Chạy local\n{{docker compose up --build}} khởi động PostgreSQL, Kafka và API. Dùng seed stock nhỏ để test cạnh tranh.\n\n## Invariant\navailable + reserved + sold luôn bằng total; mọi command có idempotency key. Mô tả state machine và cách giải phóng reservation.\n\n## Kiểm thử và benchmark\nTestcontainers kiểm tra race/retry/restart. Benchmark ghi số pod, partition, dataset, concurrency, latency và rejected rate.\n\n## Vận hành\nTheo dõi queue lag, reservation quá hạn, lỗi consumer và tỷ lệ từ chối; có hướng giảm tải/rollback.`,
    interview: { story: `### STAR
**Situation:** Burst traffic có thể bán vượt stock nếu mỗi request đọc số lượng rồi cập nhật riêng.\n**Task:** Chứng minh số đơn chấp nhận không vượt tồn kho, kể cả retry và worker chạy lại.\n**Action:** Tôi định nghĩa invariant, dùng conditional update/unique reservation trong transaction, lưu idempotency key và làm expiry worker có thể chạy lặp. Load test và Testcontainers tạo cạnh tranh, mô phỏng timeout và restart.\n**Result:** Tập test đo được giới hạn đã thiết kế; metrics giúp nhận ra queue đầy trước khi ảnh hưởng lan rộng.`, questions: ['Bạn đặt nguồn dữ liệu chuẩn tồn kho ở đâu?', 'Redis reservation mất dữ liệu thì reconcile thế nào?', 'Có thể đảm bảo FIFO giữa nhiều pod không?', 'Bạn phân loại lỗi để retry ra sao?', 'Bạn sẽ scale consumer theo metric nào?'] },
    related: ['lesson-concurrency-001', 'lesson-spring-001']
  },
  {
    id: 'proj-notifications', title: 'Thông báo đa kênh qua event', level: 'senior', weeks: 6,
    skills: ['Spring Boot', 'Kafka', 'PostgreSQL', 'Outbox', 'Docker', 'Observability', 'Testing'],
    pitch: `Tạo nền tảng gửi email/SMS/push giả lập từ domain event, làm rõ delivery semantics, retry và trạng thái cuối. Đây là cách tốt để kể về vận hành bất đồng bộ giữa nhiều team.`,
    requirements: `### Chức năng
- Nhận notification request, áp dụng template/preferences, gửi qua adapter giả lập và tra trạng thái.
- Có deduplication key, retry theo loại lỗi, DLQ và thao tác replay có kiểm soát.
### Phi chức năng
- Mục tiêu demo: 500 event/giây, p95 tiếp nhận dưới 150 ms; latency giao nhận được báo riêng.
- Không ghi nội dung nhạy cảm vào log; giới hạn retry để tránh gửi lặp vô hạn.`,
    architecture: `~~~text
Domain API -> PostgreSQL outbox -> Kafka topic
                                 -> channel workers
                                 -> retry topic / DLQ
Workers -> provider adapters (fake SMTP/SMS/push)
~~~
Outbox bảo đảm event cùng commit với thay đổi nghiệp vụ. Mỗi consumer lưu delivery state và khóa idempotency; retry topic có backoff và consumer phải phân biệt lỗi tạm thời với lỗi vĩnh viễn.`,
    milestones: [
      { title: 'Event contract và preference', tasks: `Định nghĩa schema có version, recipient reference, template key, correlation id và consent/preference.`, done: `Contract có compatibility rule; test từ chối payload thiếu field bắt buộc và không log nội dung nhạy cảm.` },
      { title: 'Outbox và publish', tasks: `Ghi outbox trong cùng transaction nghiệp vụ, relay có checkpoint và xử lý crash/restart.`, done: `Integration test xác nhận không mất event sau commit và phát lại không tạo tác dụng phụ trùng.` },
      { title: 'Worker, retry và DLQ', tasks: `Xây adapter channel, phân loại lỗi, retry với backoff và dead-letter sau ngưỡng.`, done: `Test lỗi tạm thời thành công sau retry; lỗi vĩnh viễn vào DLQ cùng nguyên nhân có thể truy vết.` },
      { title: 'Preference, dedup và quan sát', tasks: `Kiểm tra opt-out trước delivery, lưu trạng thái theo key và thêm metrics lag/failure.`, done: `Test opt-out không gửi, duplicate event không gửi lần hai; dashboard có throughput, lag và DLQ count.` }
    ],
    challenges: [
      `### At-least-once và gửi trùng
Kafka consumer có thể xử lý lại sau khi side effect đã xảy ra nhưng offset chưa commit. Lưu delivery key bền vững; với provider ngoài, idempotency phụ thuộc khả năng của provider và cần ghi rõ giới hạn.`,
      `### Thứ tự và partition
Chỉ có ordering trong một partition. Chọn key theo recipient hoặc aggregate tùy invariant; key nóng có thể làm mất song song, nên đo phân bố trước khi chọn.`,
      `### Retry storm
Retry tức thì có thể khuếch đại outage. Dùng exponential backoff có jitter, giới hạn số lần, tách retry topic và circuit breaker ở adapter; DLQ cần quy trình replay có quyền kiểm soát.`
    ],
    readme: `# Notification Platform\n\n## Mục tiêu\nDemo pipeline event-driven đa kênh với outbox, retry, DLQ, preference và deduplication. Provider được giả lập.\n\n## Chạy local\n{{docker compose up --build}} khởi động PostgreSQL, Kafka và worker.\n\n## Luồng dữ liệu\nMô tả schema event, partition key, trạng thái delivery, retry policy và điều kiện replay DLQ.\n\n## Kiểm thử\nTest outbox crash/restart, consumer duplicate, lỗi tạm thời/vĩnh viễn và opt-out.\n\n## Benchmark và vận hành\nGhi throughput, consumer count, partition count, lag, p95 tiếp nhận và thời gian giao nhận; không gộp hai loại latency.`,
    interview: { story: `### STAR
**Situation:** Gửi thông báo đồng bộ làm API phụ thuộc provider và lỗi provider kéo dài request người dùng.\n**Task:** Tách tiếp nhận khỏi delivery nhưng vẫn truy vết được trạng thái.\n**Action:** Tôi lưu outbox cùng transaction, relay vào Kafka, worker dùng delivery key, retry có backoff và DLQ. Preference được kiểm tra ngay trước gửi; metrics phân biệt API acceptance với delivery latency.\n**Result:** Khi adapter giả lập lỗi, API vẫn nhận event và worker phục hồi theo policy; duplicate/replay được kiểm soát bằng test.`, questions: ['Outbox giải quyết failure window nào?', 'Làm sao tránh gửi email trùng khi consumer restart?', 'Bạn chọn partition key nào?', 'Khi nào message vào DLQ và ai được replay?', 'Làm sao tôn trọng opt-out nếu event đã nằm trong queue?'] },
    related: ['lesson-spring-001', 'lesson-concurrency-001']
  },
  {
    id: 'proj-reconciliation', title: 'Đối soát giao dịch cuối ngày', level: 'lead', weeks: 8,
    skills: ['Spring Batch', 'Java', 'PostgreSQL', 'S3', 'AWS', 'Observability', 'Testcontainers'],
    pitch: `Xử lý file giao dịch lớn có checkpoint, restart và báo cáo sai lệch. Dự án thể hiện năng lực batch và thiết kế vận hành thực tế, đặc biệt khi dữ liệu phải có thể giải thích và chạy lại.`,
    requirements: `### Chức năng
- Nhận file CSV từ object storage, validate schema, chống nạp trùng và đối chiếu tổng tiền/số lượng với giao dịch nội bộ.
- Xuất matched, unmatched và invalid records kèm lý do; hỗ trợ chạy lại theo file/version.
### Phi chức năng
- Mục tiêu demo: 5 triệu dòng/file, chạy trong 30 phút trên máy đã mô tả; bộ nhớ không tăng tuyến tính theo file.
- File có checksum, mã hóa, retention và audit trail; không đưa dữ liệu cá nhân thật vào repo.`,
    architecture: `~~~text
S3/local object store -> batch job -> staging table -> reconciliation
                                      -> matched / exception report
PostgreSQL metadata: file checksum, run id, checkpoint, totals
~~~
Đọc stream theo chunk, lưu progress bền vững và dùng run id/version để idempotently tiếp tục. AWS demo có thể dùng S3 + scheduled container; phân quyền IAM tối thiểu và mã hóa bucket.`,
    milestones: [
      { title: 'Định dạng và kiểm soát file', tasks: `Định nghĩa CSV version, checksum, encoding, timezone, currency và quy tắc duplicate.`, done: `Parser có test file lỗi/truncated/duplicate; metadata run lưu checksum và schema version.` },
      { title: 'Chunk processing và checkpoint', tasks: `Đọc streaming theo chunk, staging dữ liệu và checkpoint để restart không nạp lại toàn bộ.`, done: `Test dừng giữa file rồi resume cho cùng kết quả và không nhân đôi staging records.` },
      { title: 'Quy tắc đối soát', tasks: `Đối chiếu theo khóa nghiệp vụ, amount/currency và thời gian; lưu mã lý do cho từng exception.`, done: `Test bao phủ matched, missing, duplicate, amount mismatch và timezone boundary.` },
      { title: 'Báo cáo và vận hành', tasks: `Xuất file kết quả, metrics tiến độ, cảnh báo lỗi và cơ chế phê duyệt/replay run.`, done: `Báo cáo tái lập từ run id; có tổng số/amount đối chiếu và audit người thao tác.` },
      { title: 'AWS và tải lớn', tasks: `Đóng gói job, đọc S3 qua IAM role, cấu hình retry và đo heap/database throughput.`, done: `README mô tả quyền IAM tối thiểu, retention, benchmark file lớn và giới hạn tài nguyên.` }
    ],
    challenges: [
      `### Restart không gây nạp trùng
Checkpoint chỉ an toàn khi tiến độ và dữ liệu chunk được commit nhất quán. Dùng transaction/checkpoint của batch framework hoặc staging có unique key theo run/file/row; thiết kế rõ semantics khi process chết giữa commit.`,
      `### CSV không đồng nhất
Encoding, delimiter, timezone và dấu thập phân có thể khác nhau. Gắn schema version, parse nghiêm ngặt và cách ly dòng lỗi thay vì đoán format âm thầm.`,
      `### Dữ liệu lớn và đối chiếu
Không giữ toàn bộ file trong heap. Dùng streaming/chunk và index phù hợp; nếu join staging với bảng lớn, kiểm tra execution plan và giới hạn transaction duration.`
    ],
    readme: `# Daily Reconciliation Batch\n\n## Mục tiêu\nBatch đối chiếu file giao dịch với dữ liệu nội bộ, hỗ trợ restart, exception report và audit. Chỉ dùng dữ liệu tổng hợp.\n\n## Chạy local\n{{docker compose up --build}} khởi động PostgreSQL và object store local; nạp fixture có checksum.\n\n## Quy trình\nMô tả schema version, staging, chunk/checkpoint, quy tắc match và trạng thái run.\n\n## Kiểm thử và benchmark\nTest restart giữa file, duplicate, malformed row, timezone và tổng tiền. Báo kích thước file, chunk size, heap, thời gian và execution plan.\n\n## AWS\nJob dùng IAM role tối thiểu để đọc S3; bucket mã hóa, policy retention và audit truy cập được ghi rõ.`,
    interview: { story: `### STAR
**Situation:** Đối soát thủ công khó chạy lại sau lỗi và không giải thích được từng sai lệch.\n**Task:** Tôi cần pipeline xử lý file lớn có thể restart và audit.\n**Action:** Tôi đưa file qua checksum/schema validation, xử lý streaming theo chunk vào staging, lưu checkpoint và sinh exception có reason code. Testcontainers mô phỏng restart và file lỗi; benchmark theo dõi heap, DB plan và thời gian.\n**Result:** Cùng file/version tạo cùng kết quả, có thể truy nguyên từ run tới từng dòng; giới hạn throughput và vận hành được ghi trong README.`, questions: ['Checkpoint và transaction cần phối hợp thế nào?', 'Bạn xử lý file gửi lại cùng nội dung ra sao?', 'Vì sao không đọc toàn bộ CSV vào memory?', 'Làm sao xác định sai lệch timezone/currency?', 'Bạn thiết kế replay và audit quyền thao tác thế nào?'] },
    related: ['lesson-spring-001', 'lesson-core-001']
  },
  {
    id: 'proj-bff', title: 'API gateway và BFF cho mobile banking', level: 'lead', weeks: 10,
    skills: ['Spring Boot', 'Microservices', 'OAuth2', 'Redis', 'AWS', 'Kubernetes', 'Observability', 'Contract Testing'],
    pitch: `Thiết kế lớp BFF gom dữ liệu cho màn hình mobile mà vẫn giữ ranh giới giữa gateway, domain service và identity. Trọng tâm là timeout, bảo mật token, tương thích contract và xử lý lỗi từng phần.`,
    requirements: `### Chức năng
- API tổng hợp trang tài khoản từ account, card và transaction service; hỗ trợ version mobile client.
- Áp dụng OAuth2 access token, scope/ownership, quota và correlation id.
### Phi chức năng
- Mục tiêu demo: 300 QPS, p95 dưới 250 ms khi dependency khỏe; timeout tổng request 800 ms.
- Một dependency chậm không giữ thread vô hạn; response partial chỉ cho field được phép thiếu và có telemetry.`,
    architecture: `~~~text
Mobile -> Edge/Gateway -> BFF -> account service
                               -> card service
                               -> transaction service
                       -> Redis (short-lived reference/cache)
~~~
Gateway xử lý concern biên như TLS/rate limit; BFF điều phối theo nhu cầu UI và không trở thành nơi chứa business rule. Dùng timeout theo ngân sách, giới hạn concurrency, token relay có chủ đích và contract test giữa service.`,
    milestones: [
      { title: 'Ranh giới và API contract', tasks: `Vẽ trust boundary, xác định gateway/BFF/domain ownership và response version cho mobile.`, done: `Contract test kiểm tra schema tương thích; tài liệu nêu field bắt buộc, optional và deprecation.` },
      { title: 'Auth và quyền truy cập', tasks: `Xác thực JWT/OAuth2, kiểm tra audience/scope và quyền sở hữu account; không tin user id từ client.`, done: `Test token sai audience, scope thiếu và truy cập chéo người dùng đều bị từ chối.` },
      { title: 'Fan-out có timeout', tasks: `Gọi dependency song song có giới hạn, deadline tổng, bulkhead và chính sách partial response.`, done: `Test dependency chậm/lỗi chứng minh request kết thúc trong ngân sách và partial data không che lỗi nghiêm trọng.` },
      { title: 'Cache và rate limit', tasks: `Cache dữ liệu tham chiếu phù hợp, không cache số dư nhạy cảm tùy tiện; giới hạn theo principal/client.`, done: `Test invalidation/TTL và rate limit; README ghi rõ consistency và dữ liệu được phép cache.` },
      { title: 'Triển khai và quan sát', tasks: `Docker/Kubernetes readiness, trace propagation, metrics theo dependency và rollout canary.`, done: `Dashboard có p95/p99, error rate, saturation; canary dừng theo ngưỡng định lượng và có rollback.` }
    ],
    challenges: [
      `### Fan-out khuếch đại tải
Một request BFF gọi nhiều service làm downstream nhận tải nhân lên. Giới hạn concurrency, timeout, cache dữ liệu phù hợp và tránh retry đồng loạt; đo saturation từng dependency.`,
      `### Token relay và confused deputy
BFF không nên chuyển access token tùy tiện tới mọi service. Kiểm tra audience/scope, dùng token exchange hoặc credentials phù hợp với kiến trúc identity; không biến BFF thành quyền truy cập rộng thay người dùng.`,
      `### Partial response
Trả dữ liệu thiếu có thể khiến UI hiểu sai trạng thái tài chính. Chỉ cho partial với dữ liệu không trọng yếu, mô tả field status rõ ràng và không dùng cache stale để che lỗi nghiệp vụ.`
    ],
    readme: `# Mobile Banking BFF\n\n## Mục tiêu\nBFF tổng hợp view mobile từ các domain service với ranh giới auth, timeout và contract rõ ràng. Các service được giả lập.\n\n## Chạy local\n{{docker compose up --build}} chạy gateway, BFF và dependency giả lập có thể cấu hình latency/lỗi.\n\n## Security\nMô tả issuer/audience/scope, quyền sở hữu, token relay và dữ liệu nhạy cảm không cache/log.\n\n## Resilience\nGhi deadline tổng, timeout từng dependency, concurrency cap, partial response policy và retry policy.\n\n## Kiểm thử/triển khai\nContract test, fault injection, benchmark và canary thresholds được nêu kèm cấu hình; dashboard phân rã latency/error theo dependency.`,
    interview: { story: `### STAR
**Situation:** Mobile gọi nhiều backend riêng làm latency tăng và trải nghiệm phụ thuộc từng team.\n**Task:** Tạo BFF tối ưu cho UI nhưng không đưa business rule hay quyền truy cập nhạy cảm sai chỗ.\n**Action:** Tôi vẽ trust boundary, xác định gateway xử lý concern biên và BFF điều phối. Tôi đặt deadline tổng, bulkhead, contract test, kiểm tra audience/scope và dashboard theo dependency.\n**Result:** Fault injection cho thấy lỗi dependency không làm request treo vô hạn; canary có ngưỡng rollback và các giới hạn partial response được công bố.`, questions: ['Gateway và BFF khác nhau ở ranh giới trách nhiệm nào?', 'Bạn truyền identity tới downstream ra sao?', 'Khi một dependency chậm, ngân sách timeout được chia thế nào?', 'Dữ liệu nào tuyệt đối không nên cache ở BFF?', 'Bạn thiết kế canary rollback theo metric nào?'] },
    related: ['security-001', 'api-001']
  }
];
