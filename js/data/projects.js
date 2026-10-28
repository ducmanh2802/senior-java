/* Senior Java pet-project blueprints. Progress lives in App.store by milestone. */
window.PROJECTS = [
  {
    id: 'proj-wallet', title: 'Ví điện tử và ledger kế toán kép', level: 'senior', weeks: 8,
    skills: ['Spring Boot 3', 'PostgreSQL', 'OAuth2/JWT', 'Redis', 'Kafka', 'Docker', 'Testcontainers'],
    pitch: `Xây dựng ví có nạp, chuyển và hoàn tiền với sổ cái bất biến, để interviewer thấy bạn hiểu tính đúng đắn của tiền trước khi tối ưu throughput. Điểm nhấn là mỗi giao dịch cân bằng Nợ/Có và có thể truy vết từ API tới event.`,
    requirements: `### User story
1. **Tạo ví:** là người dùng đã đăng nhập, tôi tạo ví VND của mình.
  Chấp nhận: mỗi user tối đa 1 ví mỗi currency; ví mới có balance = 0; tạo lần 2 trả 409.
2. **Nạp tiền (mô phỏng):** tôi nạp 500.000 VND vào ví.
  Chấp nhận: sinh 1 transfer + 2 ledger entry (Nợ tài khoản hệ thống "cash-in", Có ví của tôi); balance tăng đúng 500.000.
3. **Chuyển tiền:** tôi chuyển 100.000 VND cho ví khác kèm header {{Idempotency-Key}}.
  Chấp nhận: thiếu tiền trả 422 và không ghi gì; đủ tiền thì tổng Nợ = tổng Có; retry cùng key trả lại đúng response cũ.
4. **Retry an toàn:** app mobile timeout và gửi lại.
  Chấp nhận: cùng key + cùng payload trả 200 với transfer cũ; cùng key + payload khác trả 422 {{IDEMPOTENCY_MISMATCH}}.
5. **Hoàn tiền:** admin hoàn một transfer đã COMPLETED.
  Chấp nhận: tạo transfer mới loại REVERSAL với entry đảo chiều; không sửa/xoá entry cũ; chỉ hoàn được 1 lần.
6. **Lịch sử:** tôi xem 20 giao dịch gần nhất, phân trang bằng cursor.
  Chấp nhận: chỉ thấy ví của mình (xem ví người khác trả 404, không phải 403, để không lộ ví tồn tại).
7. **Thông báo:** người nhận được thông báo "bạn vừa nhận tiền".
  Chấp nhận: event phát qua outbox; consumer chạy lại 2 lần vẫn chỉ 1 thông báo.
8. **Đối soát:** job hằng đêm so balance với tổng ledger.
  Chấp nhận: lệch 1 đồng cũng phải sinh alert kèm wallet id.

### Phi chức năng
- Throughput mục tiêu: 100 transfer/giây ổn định trên laptop 8 core (app 1 instance, PostgreSQL 16 trong Docker).
- Latency: p95 < 300 ms, p99 < 800 ms cho POST /transfers ở 100 req/s; GET lịch sử p95 < 100 ms.
- Nhất quán: **strong consistency** cho balance và ledger (cùng 1 transaction PostgreSQL); event/notification là **eventual**, trễ p95 < 2 giây.
- Bất biến: tổng mọi ledger entry của một transfer = 0 (Nợ âm, Có dương); balance không bao giờ âm; 0 transfer trùng với cùng idempotency key.
- Bảo mật: JWT (OAuth2 Resource Server); không log số dư/payload đầy đủ; dữ liệu giả hoàn toàn.

### Ngoài phạm vi
- Không tích hợp ngân hàng/cổng thanh toán thật, không KYC, không đa tiền tệ có quy đổi tỷ giá.
- Không làm UI; dùng Postman/HTTPie/curl và Swagger UI.
- Không làm sharding hay multi-region (chỉ mô tả hướng mở rộng).`,
    architecture: `~~~text
Client -> Spring Boot API -> PostgreSQL (wallet, transfer, ledger, outbox)
                         -> Redis (rate limit, cache đọc)
Outbox relay -> Kafka -> notification / audit consumer
~~~
API xác thực OAuth2 Resource Server/JWT, kiểm tra quyền sở hữu ví rồi ghi transfer, ledger và outbox trong cùng transaction PostgreSQL. Consumer dùng inbox hoặc unique event id để khử lặp; Redis chỉ hỗ trợ giới hạn tốc độ và cache dữ liệu đọc có thể làm mới.`,
    design: `### Schema DB (PostgreSQL 16, Flyway V1)
~~~sql
CREATE TABLE wallet (
  id          UUID PRIMARY KEY,
  owner_id    VARCHAR(64) NOT NULL,          -- subject trong JWT
  currency    CHAR(3) NOT NULL DEFAULT 'VND',
  balance     NUMERIC(19,2) NOT NULL DEFAULT 0 CHECK (balance >= 0),
  kind        VARCHAR(16) NOT NULL DEFAULT 'USER',  -- USER | SYSTEM
  version     BIGINT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (owner_id, currency)                 -- 1 ví / user / currency
);
CREATE TABLE transfer (
  id              UUID PRIMARY KEY,
  idem_key        VARCHAR(64) NOT NULL,
  owner_id        VARCHAR(64) NOT NULL,
  request_hash    CHAR(64) NOT NULL,          -- SHA-256 của payload
  type            VARCHAR(16) NOT NULL,       -- TOPUP | TRANSFER | REVERSAL
  from_wallet     UUID NOT NULL REFERENCES wallet(id),
  to_wallet       UUID NOT NULL REFERENCES wallet(id),
  amount          NUMERIC(19,2) NOT NULL CHECK (amount > 0),
  status          VARCHAR(16) NOT NULL,       -- COMPLETED | REJECTED
  reversal_of     UUID UNIQUE REFERENCES transfer(id), -- hoàn đúng 1 lần
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (owner_id, idem_key),                -- hàng rào chống trùng
  CHECK (from_wallet <> to_wallet)
);
CREATE TABLE ledger_entry (
  id          BIGSERIAL PRIMARY KEY,
  transfer_id UUID NOT NULL REFERENCES transfer(id),
  wallet_id   UUID NOT NULL REFERENCES wallet(id),
  amount      NUMERIC(19,2) NOT NULL CHECK (amount <> 0), -- âm = Nợ, dương = Có
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_ledger_wallet_time ON ledger_entry (wallet_id, id DESC);
CREATE TABLE outbox (
  id           BIGSERIAL PRIMARY KEY,
  aggregate_id UUID NOT NULL,
  event_type   VARCHAR(64) NOT NULL,
  payload      JSONB NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at TIMESTAMPTZ
);
CREATE INDEX ix_outbox_unpublished ON outbox (id) WHERE published_at IS NULL;
~~~
Lý do chọn index:
- {{UNIQUE (owner_id, idem_key)}}: vừa là ràng buộc nghiệp vụ, vừa là index tra cứu khi retry. Scope theo owner để key của user A không đụng user B.
- {{ix_ledger_wallet_time (wallet_id, id DESC)}}: lịch sử ví phân trang bằng cursor {{WHERE wallet_id = ? AND id < ?}} chạy index range scan, không cần OFFSET.
- {{ix_outbox_unpublished}} là **partial index**: chỉ chứa dòng chưa phát nên luôn nhỏ, relay quét rất nhanh dù bảng outbox có hàng triệu dòng cũ.
- Ledger **append-only**: thu quyền UPDATE/DELETE của user ứng dụng trên bảng này ({{REVOKE UPDATE, DELETE ON ledger_entry FROM app}}).

### API
| Method | Path | Request | Response | Mã lỗi |
|---|---|---|---|---|
| POST | /api/wallets | {currency} | 201 Wallet | 409 đã có ví |
| GET | /api/wallets/{id} | - | 200 Wallet | 404 không phải của bạn |
| POST | /api/topups | Idempotency-Key, {walletId, amount} | 201 Transfer | 400, 422 |
| POST | /api/transfers | Idempotency-Key, {fromWalletId, toWalletId, amount} | 201 Transfer (200 nếu replay) | 400 validate, 404, 409 đang xử lý, 422 thiếu tiền / key khác payload, 429 |
| POST | /api/transfers/{id}/reversal | Idempotency-Key | 201 Transfer | 409 đã hoàn |
| GET | /api/wallets/{id}/entries?cursor=&size=20 | - | 200 {items, nextCursor} | 404 |

Ví dụ endpoint quan trọng nhất:
~~~json
POST /api/transfers
Idempotency-Key: 7f9c1a52-3d2e-4b8e-9a51-1c2d3e4f5a6b
{ "fromWalletId": "1b7e...", "toWalletId": "9c2d...", "amount": "100000.00" }

201 Created
{ "id": "5e1f...", "type": "TRANSFER", "status": "COMPLETED",
  "amount": "100000.00", "fromWalletId": "1b7e...", "toWalletId": "9c2d...",
  "createdAt": "2026-10-28T09:15:02Z" }

422 Unprocessable Entity  (application/problem+json)
{ "type": "/errors/insufficient-funds", "title": "Insufficient funds", "status": 422 }
~~~
Tiền truyền dạng **string** để client JavaScript không làm tròn sai bằng double.

### Luồng chính: chuyển tiền + outbox
~~~text
Client        API (TX)                      PostgreSQL               Relay      Kafka
  |-- POST ---->|                                |                       |          |
  |             |-- INSERT transfer ON CONFLICT ->|  (idem key)           |          |
  |             |<- 0 rows? -> đọc transfer cũ --|  => trả 200 replay    |          |
  |             |-- UPDATE wallet A balance-=x  ->|  WHERE balance >= x   |          |
  |             |   (khoá theo thứ tự id)         |  0 rows => 422, ROLLBACK         |
  |             |-- UPDATE wallet B balance+=x  ->|                       |          |
  |             |-- INSERT 2 ledger_entry       ->|  (-x, +x)             |          |
  |             |-- INSERT outbox               ->|                       |          |
  |             |-- COMMIT ---------------------->|                       |          |
  |<-- 201 -----|                                 |                       |          |
  |             |                                 |<-- SELECT ... SKIP LOCKED (500ms)|
  |             |                                 |                       |-- send ->|
  |             |                                 |<-- UPDATE published_at|  (ack)   |
~~~
Điểm mấu chốt: mọi thứ trước COMMIT nằm trong **một** transaction, nên hoặc có đủ transfer + 2 entry + outbox, hoặc không có gì. Kafka nằm ngoài transaction và được relay đẩy sau, at-least-once.

### Xử lý lỗi & đồng thời
| Tình huống | Hành vi hệ thống | Cách test |
|---|---|---|
| 2 request cùng key đến song song | Request 2 chặn ở unique index cho tới khi 1 commit, rồi nhận 0 row và trả replay | 2 thread + CountDownLatch, assert 1 transfer |
| Cùng key, payload khác | So request_hash, trả 422 | Unit test controller |
| A chuyển cho B và B chuyển cho A cùng lúc | Luôn UPDATE ví có id nhỏ hơn trước, không deadlock | 200 cặp ngược chiều, assert không có lỗi 40P01 |
| 50 request rút hết tiền cùng ví | UPDATE có điều kiện, số dư không âm | Testcontainers, tổng thành công x amount = số dư ban đầu |
| Kafka chết 1 giờ | API vẫn chạy; outbox dồn lại; relay phát bù khi Kafka sống | Dừng container Kafka, assert outbox_pending tăng rồi về 0 |
| Relay crash sau send, trước UPDATE published_at | Event phát lại; consumer khử lặp bằng event id | Gọi handler 2 lần cùng event |
| DB timeout lúc commit | Client không biết kết quả, retry cùng key | Test retry trả đúng transfer cũ |

### Chiến lược test
- **Unit (JUnit 5 + AssertJ):** tính toán tiền bằng BigDecimal, validate request, hash payload, mapping lỗi sang ProblemDetail. Mục tiêu > 80% line coverage cho package domain.
- **Integration (Testcontainers PostgreSQL 16 + Kafka):** chạy migration thật, test repository UPDATE có điều kiện, outbox relay, consumer khử lặp. Dùng {{@ServiceConnection}} (Boot 3.1+) để khỏi cấu hình URL tay.
- **Concurrency:** 100 thread cùng rút từ một ví 1.000.000 với amount 50.000 → đúng 20 thành công, 80 nhận 422, balance cuối = 0, ledger tổng = 0.
- **Load test (k6 hoặc Gatling):** ramp 0 → 100 req/s trong 1 phút, giữ 5 phút, 1.000 ví ngẫu nhiên. Đạt: p95 < 300 ms, lỗi 5xx = 0, sau test chạy query đối soát không lệch.

### Chạy local
~~~yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: wallet
      POSTGRES_USER: app
      POSTGRES_PASSWORD: app
    ports: ["5432:5432"]
  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
  kafka:
    image: apache/kafka:3.7.0   # KRaft 1 node, mặc định lắng nghe localhost:9092
    ports: ["9092:9092"]
~~~
App chạy trên máy bằng {{./mvnw spring-boot:run}} với profile local; Flyway tự migrate khi khởi động.

### Quan sát
- Metric Micrometer (Actuator + Prometheus): {{wallet.transfer}} (Counter, tag result=ok|insufficient|replay|error), {{wallet.transfer.duration}} (Timer, bật percentile histogram), {{wallet.outbox.pending}} (Gauge = số dòng chưa phát), {{wallet.outbox.lag.seconds}} (Gauge = tuổi dòng cũ nhất), {{hikaricp.connections.pending}} có sẵn.
- Log JSON có {{traceId}}, transferId, idemKey (không log số dư, không log token).
- Alert: outbox lag > 60 giây trong 5 phút; tỉ lệ 5xx > 1%; p95 > 500 ms trong 10 phút; job đối soát phát hiện lệch > 0 (page ngay).

### Mở rộng lên production (tải x10 = 1.000 TPS)
- Tăng instance app (stateless) sau load balancer; HikariCP mỗi pod 10–20 connection, đặt PgBouncer phía trước PostgreSQL.
- **Hot wallet** (ví hệ thống, ví merchant lớn) thành nút thắt vì mọi transfer khoá cùng một dòng: chia thành N sub-account rồi gộp số dư khi đọc, hoặc ghi entry không khoá và tính số dư theo batch.
- Partition {{ledger_entry}} theo tháng (declarative partitioning) để index nhỏ và dễ archive.
- Thay relay polling bằng CDC (Debezium đọc WAL) khi outbox > vài nghìn event/giây.
- Đọc lịch sử từ read replica, chấp nhận trễ vài trăm ms và ghi rõ trong API.`,
    milestones: [
      { title: 'Mô hình dữ liệu và quy tắc tiền', tasks: `1. Tạo project Spring Boot 3.3 (Java 21) với Web, Data JPA, Validation, Flyway, PostgreSQL driver, Actuator.
2. Viết {{V1__init.sql}} theo phần Schema DB; chạy {{docker compose up -d postgres}} và khởi động app để Flyway migrate.
3. Tạo entity {{Wallet}}, {{Transfer}}, {{LedgerEntry}} dùng {{BigDecimal}} với scale 2; tuyệt đối không dùng double.
4. Tạo tài khoản hệ thống "cash-in" (kind = SYSTEM) bằng migration V2 để nạp tiền cũng là bút toán kép.
5. Viết class {{Money}} (record) gói BigDecimal + currency, có hàm add/subtract kiểm tra cùng currency.
6. Viết query đối soát: tổng amount theo transfer phải = 0, và balance = tổng entry theo ví.

~~~java
// Money: value object bất biến, không bao giờ dùng double cho tiền
public record Money(BigDecimal amount, String currency) {
    public Money {
        // scale 2 + HALF_EVEN (làm tròn ngân hàng) ngay khi tạo
        amount = amount.setScale(2, RoundingMode.HALF_EVEN);
        if (amount.signum() < 0) throw new IllegalArgumentException("negative");
    }
    public Money plus(Money o) { same(o); return new Money(amount.add(o.amount), currency); }
    private void same(Money o) {
        if (!currency.equals(o.currency)) throw new IllegalArgumentException("currency mismatch");
    }
}
~~~
~~~sql
-- Query đối soát: phải trả về 0 dòng
SELECT transfer_id, SUM(amount) FROM ledger_entry
GROUP BY transfer_id HAVING SUM(amount) <> 0;
~~~`, done: `Flyway migrate thành công trên PostgreSQL 16 sạch; INSERT amount âm hoặc balance âm bị CHECK chặn (có test); query đối soát trả 0 dòng sau bộ test; grep toàn repo không có {{double}} cho tiền.` },
      { title: 'API và xác thực', tasks: `1. Thêm {{spring-boot-starter-oauth2-resource-server}}; cấu hình issuer (Keycloak trong compose hoặc JWT ký bằng khoá local cho profile dev).
2. Viết {{SecurityFilterChain}}: mọi /api/** cần JWT, Actuator health mở.
3. Viết controller ví và lịch sử; lấy ownerId từ {{jwt.getSubject()}}, không nhận ownerId từ body.
4. Repository tìm ví theo {{id AND owner_id}} → không thấy thì 404 (không lộ ví người khác tồn tại).
5. Trả lỗi bằng {{ProblemDetail}} (RFC 7807) qua {{@RestControllerAdvice}}.
6. Viết test {{@WebMvcTest}} với {{jwt()}} của spring-security-test cho 2 user khác nhau.

~~~java
@Configuration
class SecurityConfig {
    @Bean
    SecurityFilterChain api(HttpSecurity http) throws Exception {
        http.authorizeHttpRequests(a -> a
                .requestMatchers("/actuator/health/**").permitAll()
                .anyRequest().authenticated())
            .oauth2ResourceServer(o -> o.jwt(Customizer.withDefaults())) // xác thực JWT
            .csrf(c -> c.disable())  // API stateless, không dùng cookie
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS));
        return http.build();
    }
}
~~~`, done: `Test chứng minh user A gọi GET/POST trên ví của B nhận 404; request không token nhận 401; body lỗi không chứa stack trace hay số dư.` },
      { title: 'Chuyển tiền an toàn khi retry và đồng thời', tasks: `1. Tính {{request_hash}} = SHA-256 của payload đã chuẩn hoá (thứ tự field cố định).
2. Trong transaction: {{INSERT INTO transfer ... ON CONFLICT (owner_id, idem_key) DO NOTHING}}.
3. Nếu 0 dòng được chèn: đọc transfer cũ; hash khác → 422, giống → trả lại kết quả cũ (200).
4. Trừ tiền bằng UPDATE có điều kiện, khoá 2 ví theo thứ tự id tăng dần để tránh deadlock.
5. Nếu UPDATE trừ trả 0 dòng → ném {{InsufficientFundsException}} → rollback toàn bộ (kể cả dòng transfer vừa chèn).
6. Ghi 2 ledger entry và 1 dòng outbox trong cùng transaction.
7. Viết test đồng thời 100 thread (milestone này là trái tim của dự án).

~~~java
public interface WalletRepo extends JpaRepository<Wallet, UUID> {
    // Trừ tiền nguyên tử: điều kiện balance >= amount nằm NGAY trong câu UPDATE
    @Modifying(clearAutomatically = true)
    @Query("update Wallet w set w.balance = w.balance - :amt, w.version = w.version + 1 " +
           "where w.id = :id and w.balance >= :amt")
    int debit(@Param("id") UUID id, @Param("amt") BigDecimal amt);

    @Modifying(clearAutomatically = true)
    @Query("update Wallet w set w.balance = w.balance + :amt where w.id = :id")
    int credit(@Param("id") UUID id, @Param("amt") BigDecimal amt);
}

@Transactional
public Transfer transfer(UUID from, UUID to, BigDecimal amt) {
    boolean fromFirst = from.compareTo(to) < 0;     // thứ tự khoá cố định
    if (fromFirst) { mustDebit(from, amt); walletRepo.credit(to, amt); }
    else { walletRepo.credit(to, amt); mustDebit(from, amt); }
    // ... insert 2 ledger_entry (-amt, +amt) + 1 outbox row
}
private void mustDebit(UUID id, BigDecimal amt) {
    if (walletRepo.debit(id, amt) == 0) throw new InsufficientFundsException(id);
}
~~~`, done: `Test Testcontainers: 100 thread rút 50.000 từ ví 1.000.000 → đúng 20 thành công, balance = 0; 10 thread cùng idempotency key → 1 transfer, 2 ledger entry; 200 cặp chuyển ngược chiều không có deadlock.` },
      { title: 'Outbox relay và consumer idempotent', tasks: `1. Thêm spring-kafka; topic {{wallet.events}} với 6 partition, key = walletId để giữ thứ tự theo ví.
2. Viết relay {{@Scheduled(fixedDelay = 500)}} lấy tối đa 100 dòng chưa phát bằng {{FOR UPDATE SKIP LOCKED}} (nhiều instance chạy song song không tranh nhau).
3. Gửi Kafka và chờ ack (có timeout) rồi mới đánh dấu {{published_at}}.
4. Consumer notification có bảng {{processed_event(event_id PRIMARY KEY)}}; insert trùng thì bỏ qua.
5. Cấu hình producer {{acks=all}}, {{enable.idempotence=true}} (mặc định từ Kafka 3.0).
6. Job dọn outbox đã phát quá 7 ngày.

~~~java
@Scheduled(fixedDelay = 500)
@Transactional
public void relay() {
    // SKIP LOCKED: instance khác đang giữ dòng nào thì bỏ qua dòng đó
    List<OutboxRow> rows = outboxRepo.lockBatch(100); // native: ... WHERE published_at IS NULL
                                                       // ORDER BY id LIMIT 100 FOR UPDATE SKIP LOCKED
    for (OutboxRow r : rows) {
        try {
            kafka.send("wallet.events", r.aggregateId().toString(), r.payload())
                 .get(5, TimeUnit.SECONDS);           // chờ broker ack
            r.markPublished(Instant.now());
        } catch (Exception e) {
            log.warn("relay failed id={}", r.id(), e);
            break;  // giữ thứ tự: dừng batch, lần sau thử lại
        }
    }
}
~~~`, done: `Dừng container Kafka 2 phút trong lúc gọi 1.000 transfer: API vẫn 201; sau khi Kafka chạy lại, outbox pending về 0 trong < 30 giây; consumer nhận event trùng (test gọi 2 lần) chỉ tạo 1 notification.` },
      { title: 'Rate limit, quan sát và đóng gói', tasks: `1. Rate limit theo user: 20 transfer/phút bằng Redis INCR + EXPIRE trong một Lua script (nguyên tử).
2. Redis lỗi → fail-open cho GET, fail-closed cho chuyển tiền là lựa chọn cần ghi rõ trong README.
3. Thêm metric Micrometer như phần Quan sát; bật {{management.endpoints.web.exposure.include=health,prometheus}}.
4. Thêm Prometheus + Grafana vào compose (profile riêng) và 1 dashboard.
5. Viết kịch bản k6 và chạy benchmark, ghi cấu hình máy.
6. Hoàn thiện README theo mẫu.

~~~java
@Component
class TransferRateLimiter {
    // INCR rồi đặt TTL nếu là lần đầu; trả về số lần trong cửa sổ hiện tại
    private static final RedisScript<Long> SCRIPT = RedisScript.of(
        "local c = redis.call('INCR', KEYS[1]) " +
        "if c == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end return c", Long.class);
    private final StringRedisTemplate redis;
    TransferRateLimiter(StringRedisTemplate redis) { this.redis = redis; }

    boolean allow(String userId) {
        long window = Instant.now().getEpochSecond() / 60;   // fixed window 1 phút
        Long n = redis.execute(SCRIPT, List.of("rl:tx:" + userId + ":" + window), "60");
        return n != null && n <= 20;
    }
}
~~~`, done: `Request thứ 21 trong 1 phút nhận 429 kèm header Retry-After; dashboard hiện throughput, p95, outbox lag; k6 100 req/s trong 5 phút: p95 < 300 ms, 0 lỗi 5xx, đối soát không lệch.` }
    ],
    challenges: [
      `### Race khi chuyển tiền (lost update)
**Triệu chứng:** load test 50 request rút tiền cùng ví, balance cuối âm hoặc tổng tiền trong hệ thống tăng/giảm.
**Nguyên nhân gốc:** code kiểu đọc rồi ghi ({{findById}} → kiểm tra balance trong Java → {{save}}). Hai transaction cùng đọc balance cũ ở READ COMMITTED (mặc định PostgreSQL), cùng thấy đủ tiền và cùng ghi.
**Cách 1, UPDATE có điều kiện** ({{WHERE balance >= :amt}}): PostgreSQL khoá dòng khi UPDATE và đánh giá lại điều kiện trên bản mới nhất sau khi transaction trước commit. Nhanh, 1 round-trip, nhưng logic nghiệp vụ nằm trong SQL.
**Cách 2, khoá bi quan** ({{SELECT ... FOR UPDATE}}, JPA {{@Lock(PESSIMISTIC_WRITE)}}): logic ở Java dễ đọc, nhưng thêm round-trip và giữ khoá lâu hơn; phải khoá theo thứ tự id để tránh deadlock.
(Optimistic {{@Version}} cũng đúng nhưng ví nóng sẽ retry liên tục.)
**Chứng minh:** test 100 thread + {{CountDownLatch}} cùng xuất phát; assert số thành công x amount = số dư ban đầu và balance >= 0. Chạy lặp 20 lần để chắc chắn.`,
      `### Idempotency khi client timeout
**Triệu chứng:** người dùng bị trừ tiền 2 lần sau khi app báo "lỗi mạng" và tự retry.
**Nguyên nhân gốc:** timeout phía client không có nghĩa là server thất bại; transaction có thể đã commit. Kiểm tra trùng bằng {{SELECT}} trước rồi {{INSERT}} sau vẫn có race giữa 2 bước.
**Cách 1, unique constraint trong DB** + {{ON CONFLICT DO NOTHING}} trong cùng transaction nghiệp vụ: đúng tuyệt đối, không cần hệ thống khác; giá là một index thêm và key phải lưu lâu (ví dụ 30 ngày).
**Cách 2, Redis SETNX trước, DB sau:** nhanh, chặn sớm, nhưng Redis và DB không cùng transaction: Redis ghi xong mà DB rollback thì key bị "kẹt"; Redis mất dữ liệu thì mất bảo vệ. Chỉ dùng làm lớp phụ, không làm hàng rào cuối.
**Chứng minh:** 10 thread gửi cùng key song song → đúng 1 dòng transfer; cùng key nhưng amount khác → 422.`,
      `### Event phát trùng hoặc mất
**Triệu chứng:** người nhận có 2 thông báo, hoặc không có thông báo dù tiền đã vào.
**Nguyên nhân gốc:** dual write: commit DB rồi gọi {{kafkaTemplate.send}} không phải một transaction. Crash giữa 2 bước làm mất event; retry sau khi send thành công làm trùng event.
**Cách 1, transactional outbox + polling relay:** đơn giản, chỉ cần PostgreSQL, nhưng có độ trễ polling (500 ms) và tạo tải query đều đặn.
**Cách 2, CDC với Debezium đọc WAL:** trễ thấp, không polling, nhưng thêm Kafka Connect cần vận hành và giám sát replication slot (slot treo làm WAL phình đầy đĩa).
Cả 2 đều at-least-once nên consumer **bắt buộc** idempotent (bảng processed_event).
**Chứng minh:** test ném exception sau khi send và trước khi đánh dấu published → event phát lại; consumer nhận 2 lần → 1 notification.`,
      `### Deadlock khi chuyển ngược chiều
**Triệu chứng:** log có {{ERROR: deadlock detected}} (SQLSTATE 40P01) khi A→B và B→A xảy ra cùng lúc.
**Nguyên nhân gốc:** TX1 khoá A rồi chờ B, TX2 khoá B rồi chờ A. PostgreSQL phát hiện sau {{deadlock_timeout}} (mặc định 1 giây) và huỷ một bên.
**Cách 1, khoá theo thứ tự cố định** (id nhỏ trước): loại bỏ deadlock tận gốc, chi phí gần như bằng 0, nhưng mọi đường code chạm nhiều ví phải tuân thủ.
**Cách 2, retry khi gặp 40P01/40001** (Spring Retry, tối đa 3 lần, có jitter): chịu được lỗi nhưng vẫn tốn 1 giây chờ và làm tăng p99.
Nên làm cả 2: thứ tự khoá là chính, retry là lưới an toàn.
**Chứng minh:** 200 cặp transfer ngược chiều song song, assert không có exception deadlock và tổng tiền hệ thống không đổi.`,
      `### Hot wallet làm nghẽn throughput
**Triệu chứng:** mọi lệnh nạp tiền đi qua ví hệ thống "cash-in"; p99 tăng vọt khi tải tăng dù CPU DB thấp.
**Nguyên nhân gốc:** mọi transaction xếp hàng chờ khoá cùng một dòng; throughput bị giới hạn bởi 1 / (thời gian giữ khoá).
**Cách 1, chia ví hệ thống thành N sub-account** (ví dụ 16 dòng, chọn ngẫu nhiên): tăng song song gần N lần, khi đọc thì cộng tổng.
**Cách 2, không cập nhật balance của ví hệ thống trong transaction** (chỉ ghi ledger entry), số dư tính lại theo batch: rất nhanh nhưng số dư ví hệ thống chỉ eventual.
**Chứng minh:** k6 1 kịch bản chỉ nạp tiền, so p95 và TPS trước/sau.`
    ],
    readme: `# Wallet Ledger\n\n## Mục tiêu\nVí demo tập trung vào tính đúng đắn của chuyển tiền, idempotency và khả năng kiểm toán. Không xử lý tiền thật.\n\n## Kiến trúc\nSpring Boot 3, PostgreSQL là nguồn dữ liệu chuẩn, transactional outbox phát sự kiện sang Kafka; Redis chỉ dùng cho cache/rate limit.\n\n## Chạy local\nYêu cầu Docker. Chạy {{docker compose up --build}}; áp dụng migration tự động và dùng profile local với dữ liệu giả.\n\n## Kiểm thử và benchmark\nChạy unit test và integration test với Testcontainers. Ghi rõ máy, cấu hình, dữ liệu, concurrency, throughput và p95/p99; không coi số đo local là cam kết production.\n\n## Quyết định thiết kế\nLedger append-only giúp tái dựng biến động; số dư có thể là projection nhưng phải đối soát từ entries. Idempotency dựa trên unique constraint, không dựa riêng vào cache.`,
    interview: {
      story: `### STAR
**Situation:** Bản đầu của ví demo dùng kiểu đọc số dư rồi ghi lại. Khi chạy k6 với 50 request song song rút cùng một ví, có 3/20 lần chạy balance bị âm; ngoài ra mô phỏng mobile retry sau timeout tạo ra transfer trùng.
**Task:** Tôi cần bảo đảm 3 bất biến: balance không âm, mỗi transfer cân bằng Nợ/Có, và retry cùng idempotency key không tạo giao dịch mới; đồng thời giữ p95 < 300 ms ở 100 req/s.
**Action:**
- Chuyển sang ledger kép append-only, UPDATE có điều kiện {{balance >= amount}} và khoá 2 ví theo thứ tự id để tránh deadlock.
- Đặt unique {{(owner_id, idem_key)}} và lưu hash payload để phát hiện cùng key khác nội dung.
- Ghi outbox trong cùng transaction, relay dùng {{FOR UPDATE SKIP LOCKED}}, consumer khử lặp bằng event id.
- Viết bộ test Testcontainers: 100 thread rút tiền, 10 thread cùng key, 200 cặp chuyển ngược chiều, tắt Kafka giữa chừng.
**Result:**
- 0 lần balance âm qua 50 lần chạy test đồng thời (trước đó 3/20 lần lỗi).
- 0 transfer trùng; query đối soát ledger trả 0 dòng lệch.
- k6 100 req/s: p95 từ 410 ms xuống 180 ms (bỏ round-trip SELECT, giảm thời gian giữ khoá); Kafka tắt 2 phút không mất event nào.

> Số liệu trên là ví dụ minh hoạ: hãy thay bằng kết quả bạn tự đo và nói rõ cấu hình máy.

### Demo trong 5 phút
1. {{docker compose up -d}} rồi {{./mvnw spring-boot:run}}; mở Swagger UI, chỉ nhanh sơ đồ kiến trúc trong README (30 giây).
2. Tạo 2 ví, nạp 1.000.000 vào ví A, chuyển 100.000 sang B; mở bảng {{ledger_entry}} cho thấy 2 dòng -100.000 / +100.000.
3. Gửi lại đúng request với cùng Idempotency-Key → 200 cùng transfer id; đổi amount → 422.
4. Chạy {{./mvnw test -Dtest=ConcurrentTransferIT}}: 100 thread, log in "success=20, rejected=80, balance=0".
5. {{docker stop kafka}}, gọi vài transfer, mở Grafana thấy outbox pending tăng; {{docker start kafka}} → về 0.
6. Kết bằng kết quả k6 (ảnh chụp p95) và query đối soát trả 0 dòng.`,
      questions: [
        'Vì sao dùng ledger thay vì chỉ cập nhật balance?',
        'Nếu Kafka ngừng một giờ sau khi DB commit thì điều gì xảy ra?',
        'Bạn xử lý request cùng idempotency key nhưng khác payload thế nào?',
        'Làm sao kiểm chứng không overspend khi hai transfer cạnh tranh?',
        'Bạn đối soát balance projection với ledger ra sao?',
        'Vì sao không dùng 2PC/XA giữa PostgreSQL và Kafka?',
        'Nếu Redis chết thì chuyển tiền có chạy không?',
        'Ví merchant nhận 2.000 giao dịch/giây thì thiết kế này vỡ ở đâu?'
      ],
      answers: [
        `Balance chỉ là **kết quả**; ledger là **lịch sử tạo ra kết quả đó**. Nếu chỉ UPDATE balance, khi số dư sai tôi không thể trả lời "sai từ giao dịch nào", và kiểm toán cũng không chấp nhận. Với ledger kép append-only, mỗi transfer có các entry tổng bằng 0, nên tiền không tự sinh ra hay biến mất; muốn sửa sai thì ghi entry đảo chiều chứ không sửa entry cũ. Tôi vẫn giữ cột balance như một projection để đọc nhanh và để UPDATE có điều kiện chặn overspend, nhưng nó luôn đối soát được với tổng entry. Trade-off: ghi nhiều dòng hơn (1 transfer = 3 insert + 2 update) và bảng ledger lớn nhanh, cần partition theo tháng khi dữ liệu nhiều.`,
        `API vẫn hoạt động bình thường vì Kafka không nằm trong transaction chuyển tiền: transfer, ledger và dòng outbox được commit vào PostgreSQL. Relay gửi thất bại nên dừng batch và thử lại mỗi 500 ms; outbox dồn lên, metric {{wallet.outbox.lag.seconds}} vượt 60 giây sẽ bắn alert. Hậu quả nghiệp vụ chỉ là thông báo đến trễ. Khi Kafka sống lại, relay phát bù theo thứ tự id; vài event có thể bị phát 2 lần (gửi xong nhưng chưa kịp đánh dấu) và consumer khử lặp bằng event id. Cần lưu ý: một giờ ở 100 TPS là khoảng 360.000 dòng, partial index giữ query relay vẫn nhanh, nhưng tôi sẽ tăng batch size khi phát bù để không mất quá lâu.`,
        `Tôi lưu {{request_hash}} (SHA-256 của payload đã chuẩn hoá) cùng dòng transfer. Khi {{INSERT ... ON CONFLICT DO NOTHING}} trả 0 dòng, tôi đọc transfer cũ và so hash: giống thì trả lại đúng response cũ (200), khác thì trả 422 {{IDEMPOTENCY_MISMATCH}}. Lý do không âm thầm xử lý như request mới: cùng key mà khác payload gần như luôn là bug phía client (dùng lại key), và đoán ý định khi đụng tới tiền là nguy hiểm. Key được scope theo owner để 2 user vô tình dùng cùng UUID không ảnh hưởng nhau. Trade-off: phải chuẩn hoá payload cẩn thận (thứ tự field, định dạng số "100000" và "100000.00" phải cho cùng hash), nếu không retry hợp lệ cũng bị 422.`,
        `Bằng test chứ không bằng lý luận. Integration test Testcontainers với PostgreSQL thật (H2 không mô phỏng đúng khoá dòng): ví có 1.000.000, tạo 100 thread, dùng {{CountDownLatch}} để tất cả cùng bắt đầu, mỗi thread rút 50.000. Kỳ vọng đúng 20 thành công, 80 nhận lỗi thiếu tiền, balance cuối = 0, tổng ledger = 0. Tôi chạy lặp 50 lần vì race không xuất hiện mỗi lần; bản cũ đọc-rồi-ghi thất bại khoảng 15% số lần chạy, nên test này thực sự bắt được lỗi. Cơ chế đúng là vì PostgreSQL khoá dòng khi UPDATE; transaction thứ hai chờ, rồi đánh giá lại {{WHERE balance >= amount}} trên phiên bản mới nhất sau khi transaction đầu commit, nên thấy số dư đã giảm.`,
        `Có 2 tầng. Tầng 1 trong transaction: entry luôn ghi cùng lúc với UPDATE balance nên lệch chỉ xảy ra khi có bug hoặc ai đó sửa tay. Tầng 2 là job hằng đêm chạy query: {{SELECT w.id, w.balance, COALESCE(SUM(e.amount),0) FROM wallet w LEFT JOIN ledger_entry e ON e.wallet_id = w.id GROUP BY w.id HAVING w.balance <> COALESCE(SUM(e.amount),0)}}, cộng thêm query mỗi transfer tổng bằng 0. Có dòng nào là alert mức page, kèm danh sách ví. Không bao giờ tự "sửa" balance theo ledger trong job, vì cần người điều tra nguyên nhân trước. Khi dữ liệu lớn, tôi đối soát tăng dần: lưu snapshot số dư cuối ngày và chỉ cộng entry phát sinh trong ngày, thay vì quét toàn bộ lịch sử.`,
        `2PC/XA giữa PostgreSQL và Kafka gần như không khả thi: Kafka không tham gia XA, và transaction của Kafka chỉ bảo đảm nguyên tử trong phạm vi Kafka. Kể cả với hệ thống hỗ trợ XA, 2PC có coordinator là điểm chết: nếu coordinator chết sau prepare, các participant giữ khoá cho tới khi nó phục hồi, làm hệ thống tiền bị treo. Latency cũng tăng vì thêm round-trip prepare/commit. Outbox giải bài toán bằng cách chỉ có **một** hệ thống cần commit nguyên tử (PostgreSQL), phần còn lại chuyển thành at-least-once + consumer idempotent. Trade-off là event đến trễ (eventual) và phải vận hành relay, nhưng đổi lại không có khoá phân tán và dễ chứng minh đúng bằng test.`,
        `Có, và đó là quyết định thiết kế có chủ đích. Redis chỉ dùng cho rate limit và cache đọc; idempotency và số dư nằm hoàn toàn ở PostgreSQL. Khi Redis lỗi, rate limiter bắt exception và tôi phải chọn fail-open hay fail-closed. Với chuyển tiền tôi chọn fail-open có giới hạn: vẫn cho qua nhưng áp một giới hạn thô trong bộ nhớ từng pod (ví dụ Bucket4j local), vì chặn toàn bộ chuyển tiền chỉ vì mất lớp chống lạm dụng thì ảnh hưởng người dùng thật nhiều hơn. Lệnh Redis có timeout ngắn (50 ms) và circuit breaker để không kéo p95 lên khi Redis chậm. Nếu yêu cầu bảo mật cao (chống brute force) thì fail-closed, và tôi ghi rõ lựa chọn này trong README.`,
        `Vỡ ở khoá dòng của ví merchant: mọi transfer tới merchant đều UPDATE cùng một dòng, nên dù có 20 pod, các transaction vẫn xếp hàng. Nếu giữ khoá 2 ms thì trần lý thuyết khoảng 500 TPS cho ví đó. Cách xử lý: (1) chia ví merchant thành N sub-account, chọn ngẫu nhiên khi ghi Có và cộng tổng khi đọc; ghi Có không cần kiểm tra số dư nên chia rất an toàn. (2) Hoặc với ví chỉ nhận tiền, không UPDATE balance trong transaction mà chỉ insert ledger entry, rồi job tổng hợp số dư mỗi vài giây. Ngoài ra rút ngắn transaction: không gọi mạng hay serialize JSON lớn trong lúc giữ khoá. Tôi sẽ đo trước bằng k6 kịch bản 1 merchant để có số liệu thật trước khi chọn.`
      ]
    },
    related: ['lesson-spring-001', 'api-004', 'scenario-025', 'design-022', 'design-005', 'microservices-005', 'api-015', 'scenario-008', 'testing-020', 'db-010']
  },
  {
    id: 'proj-shortlink', title: 'Rút gọn URL có quota và rate limit', level: 'mid', weeks: 4,
    skills: ['Spring Boot', 'PostgreSQL', 'Redis', 'REST API', 'Docker', 'Testing'],
    pitch: `Một dịch vụ nhỏ nhưng cho phép trình bày thiết kế API, mã định danh, cache và chống lạm dụng. Có thể mở rộng từng phần bằng số liệu thay vì tuyên bố “scale lớn” thiếu căn cứ.`,
    requirements: `### User story
1. **Tạo link:** là user đã đăng nhập, tôi gửi URL dài và nhận link ngắn 7 ký tự.
  Chấp nhận: trả 201 kèm {{shortUrl}}; URL phải là http/https, dài ≤ 2.048 ký tự; scheme khác (javascript:, data:, file:) trả 400.
2. **Alias tuỳ chọn:** tôi chọn alias "sale-tet".
  Chấp nhận: alias 3–30 ký tự [a-zA-Z0-9-]; đã có người dùng thì 409; không được trùng từ khoá hệ thống (api, admin, health).
3. **Hạn dùng:** tôi đặt link hết hạn sau 7 ngày.
  Chấp nhận: sau hạn, truy cập trả 410 Gone; cache không bao giờ trả link quá hạn.
4. **Chuyển hướng:** khách mở {{/sale-tet}} và được chuyển tới URL gốc.
  Chấp nhận: 302 kèm header Location; link không tồn tại trả 404.
5. **Vô hiệu hoá:** tôi tắt một link bị lạm dụng.
  Chấp nhận: trong ≤ 1 giây sau khi tắt, mọi instance trả 410 (xoá cache chủ động).
6. **Quota:** gói free tạo tối đa 100 link/ngày.
  Chấp nhận: link thứ 101 trả 429 kèm thông tin quota còn lại; quota reset 00:00 UTC.
7. **Thống kê:** tôi xem tổng lượt click theo ngày của link mình.
  Chấp nhận: số liệu trễ tối đa 1 phút; user khác xem trả 404.
8. **Chống lạm dụng:** một IP gọi resolve quá 50 lần/giây bị chặn.
  Chấp nhận: trả 429 kèm Retry-After; không ảnh hưởng IP khác.

### Phi chức năng
- Resolve: 2.000 req/s trên 1 instance khi cache nóng, p95 < 20 ms (đo tại server), p99 < 50 ms; cache miss p95 < 60 ms với 1 triệu link.
- Tạo link: 50 req/s, p95 < 150 ms.
- Nhất quán: tạo/tắt link là strong (PostgreSQL); resolve qua cache chấp nhận trễ tối đa bằng TTL (5 phút) nếu xoá cache thất bại; thống kê click là eventual (≤ 1 phút).
- Tính sẵn sàng: Redis chết thì resolve vẫn chạy (đọc DB), chỉ chậm hơn.

### Ngoài phạm vi
- Không làm preview/fetch metadata URL đích (tránh SSRF); không quét malware URL.
- Không có thống kê chi tiết theo quốc gia/thiết bị, không UI.
- Không có custom domain cho từng user.`,
    architecture: `~~~text
Client -> Spring Boot -> PostgreSQL (links, ownership)
                    -> Redis (resolve cache, rate limit)
                    -> event queue (optional click aggregation)
~~~
PostgreSQL lưu trạng thái chuẩn và unique alias; Redis cache kết quả resolve với TTL không vượt thời gian hết hạn của link. Click counting có thể bất đồng bộ nếu README nêu rõ độ trễ nhất quán.`,
    design: `### Schema DB (PostgreSQL 16)
~~~sql
CREATE TABLE link (
  id          BIGSERIAL PRIMARY KEY,
  code        VARCHAR(30) NOT NULL,           -- mã ngẫu nhiên 7 ký tự hoặc alias
  owner_id    VARCHAR(64) NOT NULL,
  target_url  VARCHAR(2048) NOT NULL CHECK (target_url ~ '^https?://'),
  status      VARCHAR(16) NOT NULL DEFAULT 'ACTIVE'
              CHECK (status IN ('ACTIVE', 'DISABLED')),
  expires_at  TIMESTAMPTZ,                    -- NULL = không hết hạn
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- So sánh không phân biệt hoa thường để "Sale" và "sale" không cùng tồn tại
CREATE UNIQUE INDEX ux_link_code ON link (lower(code));
CREATE INDEX ix_link_owner ON link (owner_id, id DESC);

CREATE TABLE link_click_daily (
  link_id  BIGINT NOT NULL REFERENCES link(id),
  day      DATE NOT NULL,
  clicks   BIGINT NOT NULL DEFAULT 0,
  PRIMARY KEY (link_id, day)                  -- dùng cho UPSERT cộng dồn
);
CREATE TABLE create_quota (
  owner_id VARCHAR(64) NOT NULL,
  day      DATE NOT NULL,
  used     INT NOT NULL DEFAULT 0 CHECK (used <= 100),
  PRIMARY KEY (owner_id, day)
);
~~~
Lý do chọn index:
- {{ux_link_code}} trên {{lower(code)}}: đường resolve nóng nhất tra theo code, index unique vừa chống trùng vừa cho lookup O(log n); với 1 triệu dòng B-tree chỉ sâu 3 tầng. Query phải viết {{WHERE lower(code) = lower(?)}} để dùng được index.
- {{ix_link_owner}}: trang "link của tôi" phân trang theo cursor id.
- {{CHECK (used <= 100)}} trên quota: UPDATE vượt quota bị DB từ chối, không cần khoá ở Java.

### API
| Method | Path | Request | Response | Mã lỗi |
|---|---|---|---|---|
| POST | /api/links | {url, alias?, expiresAt?} | 201 {code, shortUrl, expiresAt} | 400 URL/alias sai, 409 alias đã có, 429 hết quota |
| GET | /{code} | - | 302 Location | 404 không có, 410 hết hạn/đã tắt, 429 rate limit |
| GET | /api/links?cursor= | - | 200 {items, nextCursor} | 401 |
| PATCH | /api/links/{code} | {status: "DISABLED"} | 200 | 404 không phải của bạn |
| GET | /api/links/{code}/stats?from=&to= | - | 200 [{day, clicks}] | 404 |

~~~json
POST /api/links
{ "url": "https://shop.example.com/campaign/tet-2027?utm_source=fb", "alias": "sale-tet",
  "expiresAt": "2027-02-15T00:00:00Z" }

201 Created
{ "code": "sale-tet", "shortUrl": "https://s.example.dev/sale-tet",
  "expiresAt": "2027-02-15T00:00:00Z", "quotaRemaining": 87 }
~~~

### Luồng chính: resolve có cache
~~~text
Browser       Rate limiter      ResolveService        Redis            PostgreSQL
  |-- GET /abc1234 ->|                 |                  |                  |
  |                  |-- INCR ip key ->|(Lua, 1 round-trip)                  |
  |                  |  > 50/s => 429  |                  |                  |
  |                  |---------------->|-- GET link:abc1234 ->|              |
  |                  |                 |<- hit: url|expiresAt |              |
  |                  |                 |   (kiểm expiresAt lần nữa)          |
  |                  |                 |-- miss --------------------------->|
  |                  |                 |<-- row (ACTIVE, chưa hết hạn) -----|
  |                  |                 |-- SET link:abc1234 EX min(300s, tới expiresAt) ->|
  |                  |                 |-- clickBuffer.increment(id) (bộ nhớ) |
  |<-- 302 Location -|-----------------|                  |                  |
                     Mỗi 10 giây: flush buffer -> UPSERT link_click_daily
~~~
Ghi nhận click không nằm trên đường nóng: chỉ tăng một {{LongAdder}} trong bộ nhớ, flush theo lô. Đổi lại, pod crash mất tối đa 10 giây click (ghi rõ trong README).

### Xử lý lỗi & đồng thời
| Tình huống | Hành vi hệ thống | Cách test |
|---|---|---|
| Mã ngẫu nhiên trùng mã có sẵn | Bắt {{DataIntegrityViolationException}}, sinh mã mới, tối đa 3 lần rồi 503 | Inject generator trả mã cố định |
| 2 user cùng xin alias "sale" | Unique index: 1 người 201, người kia 409 | 2 thread song song |
| User spam tạo link vượt quota | UPDATE used + 1 vi phạm CHECK → 429 | 120 request song song, đúng 100 thành công |
| Tắt link nhưng cache còn | Xoá key sau commit; nếu xoá lỗi thì TTL ≤ 5 phút là giới hạn trên | Tắt rồi resolve ngay → 410 |
| Redis timeout | Circuit breaker mở, đọc thẳng DB; rate limit fail-open với limiter cục bộ | Dừng container Redis giữa test |
| Link hết hạn khi đang nằm trong cache | TTL không vượt expiresAt và code kiểm expiresAt khi hit | Link hết hạn sau 2 giây |
| Cache stampede khi 1 link viral vừa hết TTL | Single-flight theo code trong pod (chỉ 1 query DB) | 200 request song song cho 1 code miss, đếm query |

### Chiến lược test
- **Unit:** validator URL (scheme, độ dài, host rỗng, ký tự lạ), sinh mã base62, tính TTL cache theo expiresAt.
- **Integration (Testcontainers PostgreSQL + Redis):** tạo → resolve → tắt → resolve; quota; cache hit/miss; dùng {{@SpringBootTest(webEnvironment = RANDOM_PORT)}} và {{TestRestTemplate}} (tắt follow redirect để assert 302).
- **Concurrency:** 120 request tạo link song song từ cùng user → đúng 100 thành công; 2 thread cùng alias → 1 thắng.
- **Load test (k6):** seed 1 triệu link bằng {{generate_series}}; kịch bản A 2.000 req/s chỉ 1.000 code nóng (cache hit > 99%); kịch bản B code ngẫu nhiên trên cả 1 triệu (cache miss nhiều). Ghi p95/p99 riêng từng kịch bản và hit ratio.

### Chạy local
~~~yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: shortlink
      POSTGRES_USER: app
      POSTGRES_PASSWORD: app
    ports: ["5432:5432"]
  redis:
    image: redis:7-alpine
    command: ["redis-server", "--maxmemory", "256mb", "--maxmemory-policy", "allkeys-lru"]
    ports: ["6379:6379"]
~~~
{{allkeys-lru}} hợp với cache thuần; nếu dùng chung Redis cho rate limit thì tách instance hoặc dùng {{volatile-lru}} để key không TTL không bị xoá.

### Quan sát
- Metric: {{shortlink.resolve}} (Timer, tag result=hit|miss|not_found|gone), {{shortlink.cache.hit.ratio}} tính từ counter hit/miss trên dashboard, {{shortlink.ratelimit.rejected}} (Counter, tag scope=ip|quota), {{shortlink.click.buffer.size}} (Gauge), cộng {{lettuce.command.completion}} có sẵn khi bật metrics Lettuce.
- Log: mỗi lần tạo/tắt link (owner, code, host đích, không log query string vì có thể chứa token); không log từng lần resolve (quá nhiều), chỉ log lỗi.
- Alert: hit ratio < 80% trong 10 phút; p99 resolve > 100 ms; số 429 theo một IP tăng đột biến (dấu hiệu bot); click buffer không flush được > 1 phút.

### Mở rộng lên production (tải x10 = 20.000 resolve/s)
- Đặt CDN/edge cache trước cho response 302 của link không hết hạn (Cache-Control ngắn), giảm phần lớn tải trước khi tới app.
- Thêm cache trong JVM (Caffeine, 10 giây, 100.000 entry) phía trước Redis cho link nóng; invalidation qua Redis Pub/Sub.
- Redis Cluster hoặc replica đọc; PostgreSQL read replica cho đường resolve miss.
- Click đi qua Kafka thay vì buffer bộ nhớ để không mất khi pod chết và để nhiều consumer tổng hợp.
- Sinh mã: vẫn random 7 ký tự (62^7 khoảng 3,5 nghìn tỷ), xác suất trùng thấp tới khi có hàng tỷ link; khi đó tăng lên 8 ký tự.`,
    milestones: [
      { title: 'Contract REST và validation', tasks: `1. Tạo project Spring Boot 3.3 (Java 21): Web, Validation, Data JPA, Flyway, Data Redis, Actuator, springdoc-openapi.
2. Viết bảng API như phần Thiết kế và DTO dạng record.
3. Viết validator URL dùng {{java.net.URI}}: scheme chỉ http/https, có host, độ dài ≤ 2.048.
4. Validate alias bằng regex và danh sách từ khoá cấm.
5. Trả lỗi bằng {{ProblemDetail}} với mã lỗi ổn định (INVALID_URL, ALIAS_TAKEN, QUOTA_EXCEEDED).
6. Viết unit test cho ít nhất 15 URL hợp lệ/không hợp lệ.

~~~java
public record CreateLinkRequest(
        @NotBlank @Size(max = 2048) String url,
        @Pattern(regexp = "[a-zA-Z0-9-]{3,30}") String alias,   // null = sinh ngẫu nhiên
        @Future Instant expiresAt) {}

static URI validateTarget(String raw) {
    URI uri;
    try { uri = new URI(raw.trim()); }
    catch (URISyntaxException e) { throw new InvalidUrlException("malformed"); }
    String scheme = uri.getScheme() == null ? "" : uri.getScheme().toLowerCase();
    // chặn javascript:, data:, file: ... ngay từ đầu
    if (!scheme.equals("http") && !scheme.equals("https")) throw new InvalidUrlException("scheme");
    if (uri.getHost() == null) throw new InvalidUrlException("host");
    return uri;
}
~~~`, done: `Swagger UI hiển thị đủ 5 endpoint có ví dụ; 15+ unit test validator pass, gồm javascript:alert(1), data:, URL 3.000 ký tự và URL không có host; mọi lỗi trả problem+json đúng status.` },
      { title: 'Sinh mã, alias và persistence', tasks: `1. Viết migration {{V1__link.sql}} theo phần Schema.
2. Viết {{CodeGenerator}} dùng {{SecureRandom}} sinh 7 ký tự base62.
3. Service tạo link: insert; nếu vi phạm unique index thì sinh lại (tối đa 3 lần), với alias thì trả 409 ngay.
4. Để retry an toàn, mỗi lần insert là một transaction riêng (lỗi unique làm transaction PostgreSQL bị abort).
5. Seed 1 triệu link bằng SQL để chuẩn bị benchmark.
6. Test collision bằng generator giả trả mã đã tồn tại.

~~~java
@Component
class CodeGenerator {
    private static final char[] ALPHABET =
        "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".toCharArray();
    private final SecureRandom random = new SecureRandom();  // không đoán được mã kế tiếp

    String next() {
        char[] out = new char[7];                             // 62^7 khoảng 3,5e12 tổ hợp
        for (int i = 0; i < out.length; i++) out[i] = ALPHABET[random.nextInt(ALPHABET.length)];
        return new String(out);
    }
}
~~~
~~~sql
-- Seed 1 triệu link cho benchmark (md5 chỉ để có chuỗi khác nhau)
INSERT INTO link (code, owner_id, target_url)
SELECT substr(md5(g::text), 1, 7), 'seed', 'https://example.com/p/' || g
FROM generate_series(1, 1000000) g
ON CONFLICT DO NOTHING;
~~~`, done: `Test collision: generator trả mã trùng 2 lần rồi mã mới → link tạo thành công, link cũ không bị ghi đè; 2 thread cùng alias → 1 nhận 201, 1 nhận 409; seed 1 triệu dòng < 1 phút.` },
      { title: 'Quota, auth và rate limit', tasks: `1. Bật OAuth2 Resource Server (JWT) cho /api/**; /{code} để public.
2. Quota tạo link: UPSERT {{create_quota}} cộng 1 trong cùng transaction với insert link; vi phạm CHECK → 429.
3. Rate limit resolve theo IP: Redis Lua fixed window 1 giây, 50 request.
4. Lấy IP thật từ X-Forwarded-For chỉ khi request đi qua proxy tin cậy ({{server.forward-headers-strategy=native}}), không tin header từ client trực tiếp.
5. Kiểm tra quyền sở hữu khi PATCH/stats: tìm theo code và owner, không thấy → 404.
6. Test 120 request song song cho quota.

~~~sql
-- Cộng quota nguyên tử; vượt 100 thì CHECK (used <= 100) làm câu lệnh lỗi
INSERT INTO create_quota (owner_id, day, used)
VALUES (:owner, CURRENT_DATE, 1)
ON CONFLICT (owner_id, day) DO UPDATE SET used = create_quota.used + 1;
~~~
~~~java
// Bắt lỗi CHECK constraint của PostgreSQL (SQLSTATE 23514) và đổi thành 429
catch (DataIntegrityViolationException e) {
    if (e.getMostSpecificCause() instanceof SQLException se && "23514".equals(se.getSQLState()))
        throw new QuotaExceededException();
    throw e;
}
~~~`, done: `120 request tạo link song song của 1 user → đúng 100 thành công, 20 nhận 429; IP gọi 60 lần/giây nhận 10 lần 429 có Retry-After; user B không sửa hay xem stats link của A.` },
      { title: 'Cache resolve và vô hiệu hoá', tasks: `1. Viết {{ResolveService}} cache-aside: đọc Redis, miss thì đọc DB rồi SET kèm TTL.
2. TTL = min(300 giây, thời gian còn lại tới expiresAt); link đã hết hạn thì không cache.
3. Cache cả kết quả "không tồn tại" 30 giây (negative cache) để bot quét mã ngẫu nhiên không dập DB.
4. Khi tắt link: xoá key Redis **sau khi** transaction commit ({{TransactionSynchronization.afterCommit}} hoặc {{@TransactionalEventListener}}).
5. Bọc lệnh Redis bằng timeout 50 ms + Resilience4j circuit breaker; lỗi thì đọc DB.
6. Đo riêng hit và miss.

~~~java
public Optional<String> resolve(String code) {
    String key = "link:" + code.toLowerCase();
    String cached = safeGet(key);                       // null nếu miss hoặc Redis lỗi
    if (cached != null) return cached.equals("-") ? Optional.empty() : Optional.of(cached);

    Optional<Link> link = repo.findActiveByCode(code, Instant.now()); // ACTIVE và chưa hết hạn
    if (link.isEmpty()) { safeSet(key, "-", Duration.ofSeconds(30)); return Optional.empty(); }

    Link l = link.get();
    Duration ttl = Duration.ofMinutes(5);
    if (l.getExpiresAt() != null) {                     // không cache quá hạn của link
        Duration left = Duration.between(Instant.now(), l.getExpiresAt());
        if (left.compareTo(ttl) < 0) ttl = left;
    }
    if (!ttl.isNegative() && !ttl.isZero()) safeSet(key, l.getTargetUrl(), ttl);
    return Optional.of(l.getTargetUrl());
}
~~~`, done: `Test: link hết hạn sau 2 giây trả 410 ngay khi hết hạn dù đã nằm trong cache; tắt link rồi resolve ngay → 410; dừng Redis → resolve vẫn 302 (chậm hơn) và không có 5xx.` },
      { title: 'Thống kê click, đo tải và README', tasks: `1. {{ClickBuffer}}: {{ConcurrentHashMap}} của {{LongAdder}} theo link id; resolve chỉ gọi increment.
2. {{@Scheduled(fixedDelay = 10000)}} hoán đổi map và UPSERT cộng dồn vào {{link_click_daily}} theo lô (batch update).
3. Flush thêm một lần khi tắt app ({{@PreDestroy}}) để giảm mất dữ liệu khi deploy.
4. Thêm metric Micrometer như phần Quan sát.
5. Viết 2 kịch bản k6 (hit nóng, miss ngẫu nhiên), chạy mỗi kịch bản 3 phút sau 1 phút warm-up.
6. Ghi bảng kết quả vào README: máy, dataset, RPS, p95, p99, hit ratio.

~~~java
@Component
class ClickBuffer {
    private volatile ConcurrentHashMap<Long, LongAdder> current = new ConcurrentHashMap<>();

    void hit(long linkId) {               // gọi trên đường resolve: không I/O, rất rẻ
        current.computeIfAbsent(linkId, k -> new LongAdder()).increment();
    }

    @Scheduled(fixedDelay = 10_000)
    void flush() {
        var snapshot = current;
        current = new ConcurrentHashMap<>();          // request mới ghi vào map mới
        // Lưu ý: thread đang ghi dở vào snapshot có thể bị trễ sang lần flush sau hoặc mất
        // vài click - chấp nhận được với thống kê, KHÔNG dùng cách này cho tiền.
        snapshot.forEach((id, n) -> statsRepo.addClicks(id, LocalDate.now(ZoneOffset.UTC), n.sum()));
    }
}
~~~`, done: `Sau 10.000 resolve, bảng thống kê lệch ≤ 0,1%; README có bảng benchmark 2 kịch bản (ví dụ hit p95 < 20 ms ở 2.000 req/s) và ghi rõ giới hạn mất click khi pod crash.` }
    ],
    challenges: [
      `### Mã ngắn bị đoán (enumeration)
**Triệu chứng:** bot duyệt /aaaa1, /aaaa2... và tìm ra link riêng tư (tài liệu nội bộ, link reset mật khẩu ai đó rút gọn).
**Nguyên nhân gốc:** dùng ID tuần tự encode base62 nên mã kế tiếp đoán được.
**Cách 1, random 7 ký tự bằng SecureRandom:** không đoán được, không cần điều phối giữa nhiều instance; giá là phải xử lý collision bằng unique index + retry.
**Cách 2, ID tuần tự nhưng làm rối** (mã hoá ID bằng thuật toán hoán vị như Sqids/Feistel với khoá bí mật): không bao giờ trùng, mã ngắn hơn ở giai đoạn đầu; nhưng lộ khoá là lộ toàn bộ thứ tự và vẫn cần một nguồn ID tuần tự.
Dù chọn gì vẫn cần rate limit theo IP và negative cache.
**Chứng minh:** test sinh 1 triệu mã không trùng nhau trong bộ nhớ; load test bot quét 10.000 mã ngẫu nhiên bị 429 sau 50 req/s.`,
      `### Cache trả link đã tắt hoặc hết hạn
**Triệu chứng:** admin tắt link lừa đảo nhưng người dùng vẫn bị chuyển hướng vài phút.
**Nguyên nhân gốc:** cache-aside xoá key trước khi transaction commit (request khác đọc DB cũ và nạp lại cache) hoặc lệnh xoá thất bại im lặng.
**Cách 1, xoá key sau commit + TTL ngắn làm giới hạn trên:** đơn giản; nếu xoá lỗi thì tối đa 5 phút stale.
**Cách 2, version trong key** ({{link:abc:v3}}, tăng version mỗi lần sửa và lưu version ở DB): không bao giờ đọc nhầm bản cũ nhưng cần đọc version trước, tốn thêm 1 lookup.
**Chứng minh:** test tắt link rồi resolve ngay trong 100 ms → 410; test giả lập xoá Redis lỗi → hết TTL thì 410.`,
      `### Open redirect và URL độc hại
**Triệu chứng:** kẻ gian dùng domain của bạn để phát tán link phishing, hoặc link {{javascript:}} chạy script.
**Nguyên nhân gốc:** chỉ kiểm tra chuỗi bắt đầu bằng "http" (bị qua mặt bằng "HTTP:" hoặc khoảng trắng đầu dòng), không chuẩn hoá trước khi kiểm.
**Cách 1, validate bằng {{java.net.URI}}** (trim, lấy scheme chữ thường, bắt buộc có host) + danh sách chặn domain: nhẹ, đủ cho pet project.
**Cách 2, gọi dịch vụ đánh giá URL** (ví dụ Google Safe Browsing) bất đồng bộ sau khi tạo và tự tắt link xấu: bảo vệ tốt hơn nhưng phụ thuộc bên ngoài và có độ trễ.
Tuyệt đối không fetch URL đích từ server trong luồng tạo link (nguy cơ SSRF tới 169.254.169.254 hay mạng nội bộ).
**Chứng minh:** bảng unit test 15+ URL độc hại đều trả 400.`,
      `### Redis chết kéo cả hệ thống chết
**Triệu chứng:** Redis restart 30 giây, mọi request resolve treo 2 giây rồi 500, thread pool Tomcat đầy.
**Nguyên nhân gốc:** timeout Redis mặc định quá dài và không có fallback; cả cache lẫn rate limit đều phụ thuộc Redis.
**Cách 1, timeout ngắn + circuit breaker (Resilience4j), fallback đọc DB:** hệ thống chậm đi nhưng còn sống; cần chắc DB chịu được tải miss (connection pool, read replica).
**Cách 2, thêm tầng cache trong JVM (Caffeine)** trước Redis: link nóng vẫn được phục vụ khi Redis chết, nhưng invalidation khó hơn (phải broadcast) và mỗi pod tốn thêm RAM.
**Chứng minh:** k6 chạy 500 req/s, {{docker stop redis}} giữa chừng: 0 lỗi 5xx, p95 tăng nhưng < 100 ms; breaker chuyển OPEN rồi HALF_OPEN khi Redis sống lại.`,
      `### Cache stampede với link viral
**Triệu chứng:** link được chia sẻ trên mạng xã hội, đúng lúc key hết TTL có 2.000 request cùng miss và cùng query DB.
**Nguyên nhân gốc:** cache-aside không điều phối ai sẽ nạp lại cache.
**Cách 1, single-flight trong pod:** {{ConcurrentHashMap.computeIfAbsent}} với {{CompletableFuture}} theo code, chỉ 1 thread query DB, các thread khác chờ kết quả; đơn giản, nhưng N pod vẫn có N query.
**Cách 2, TTL có jitter + làm mới sớm** (refresh khi TTL còn < 10%): tránh nhiều key hết hạn cùng lúc và giữ key nóng không bao giờ miss; phức tạp hơn một chút.
**Chứng minh:** 200 request song song cho 1 code vừa xoá cache, đếm số query bằng metric Hibernate/datasource-proxy: ≤ 1 query mỗi pod.`
    ],
    readme: `# Shortlink Service\n\n## Mục tiêu\nAPI rút gọn URL với alias, expiry, quota và giới hạn lạm dụng.\n\n## Chạy local\nYêu cầu Docker; {{docker compose up --build}} khởi động ứng dụng, PostgreSQL và Redis.\n\n## API và cấu hình\nMô tả endpoint, auth, quota, rate limit, thời gian cache và cách tạo dữ liệu thử. Không lưu bí mật trong repository.\n\n## Kiểm thử và benchmark\nChạy unit/integration test. Đo resolve cache hit/miss ở cùng dataset, ghi cấu hình máy và percentile latency.\n\n## Quyết định thiết kế\nAlias có unique constraint; cache chỉ tăng tốc read. Đặt expiry trên dữ liệu chuẩn và không cho TTL cache vượt expiry.`,
    interview: {
      story: `### STAR
**Situation:** Tôi muốn một pet project hoàn thành trong 4 tuần nhưng vẫn có vấn đề production thật. Bản đầu của dịch vụ rút gọn URL đọc thẳng PostgreSQL mỗi lần resolve: ở 1.000 req/s p95 khoảng 45 ms, và link đã tắt vẫn chuyển hướng tới 5 phút vì cache xoá sai thời điểm.
**Task:** Đưa resolve lên 2.000 req/s với p95 < 20 ms, bảo đảm link tắt/hết hạn không bao giờ bị phục vụ quá giới hạn đã công bố, và chặn lạm dụng (quota, rate limit, URL độc hại).
**Action:**
- Thiết kế contract trước, validate URL bằng {{java.net.URI}}, sinh mã 7 ký tự bằng {{SecureRandom}} với unique index và retry khi trùng.
- Cache-aside Redis với TTL = min(5 phút, thời gian còn lại của link), xoá key sau commit, negative cache cho mã không tồn tại.
- Quota bằng UPSERT + CHECK constraint; rate limit IP bằng Lua script; Redis có timeout 50 ms và circuit breaker, fallback DB.
- Click đếm bằng LongAdder trong bộ nhớ, flush theo lô mỗi 10 giây.
**Result:**
- Resolve cache nóng: p95 từ 45 ms xuống 8 ms, đạt 2.000 req/s trên 1 instance; hit ratio 97%.
- Link bị tắt trả 410 trong < 100 ms (trước đây tới 5 phút).
- Tắt Redis giữa load test: 0 lỗi 5xx, p95 tạm lên 40 ms.

> Số liệu trên là ví dụ minh hoạ: hãy thay bằng kết quả bạn tự đo và nói rõ cấu hình máy.

### Demo trong 5 phút
1. {{docker compose up -d}}, chạy app, mở Swagger UI.
2. Tạo link có alias và expiresAt sau 1 phút; {{curl -i}} cho thấy 302 + Location.
3. Tạo link {{javascript:alert(1)}} → 400; tạo trùng alias → 409.
4. Tắt link qua PATCH rồi curl ngay → 410; mở {{redis-cli KEYS link:*}} cho thấy key đã bị xoá.
5. Chạy vòng lặp curl 60 lần/giây → thấy 429 và header Retry-After.
6. Mở kết quả k6 và dashboard (hit ratio, p95); {{docker stop redis}} rồi curl vẫn 302.`,
      questions: [
        'Tại sao không dùng ID tuần tự làm alias?',
        'Redis bị lỗi thì resolve có hoạt động không?',
        'Bạn xử lý cache stale sau khi disable link thế nào?',
        'Làm sao tránh SSRF nếu bổ sung URL preview?',
        'Bạn chọn status code nào cho link hết hạn và vì sao?',
        'Vì sao dùng 302 thay vì 301 cho redirect?',
        'Mã 7 ký tự ngẫu nhiên thì khi nào bắt đầu trùng nhiều và bạn xử lý ra sao?',
        'Đếm click mỗi lần resolve bằng UPDATE thì có vấn đề gì?'
      ],
      answers: [
        `ID tuần tự encode base62 cho mã ngắn và không bao giờ trùng, nhưng **đoán được**: ai có mã abc12 sẽ thử abc13, abc14 và quét được toàn bộ link, kể cả link riêng tư người dùng tưởng là bí mật. Nó cũng lộ quy mô kinh doanh (đối thủ biết bạn tạo bao nhiêu link mỗi ngày). Tôi chọn SecureRandom 7 ký tự base62, khoảng 3,5 nghìn tỷ tổ hợp, nên bot quét ngẫu nhiên gần như không trúng, cộng với rate limit IP và negative cache. Trade-off là phải xử lý collision: unique index trên {{lower(code)}} và retry tối đa 3 lần. Nếu muốn mã vừa ngắn vừa không trùng, có thể hoán vị ID tuần tự bằng khoá bí mật, nhưng khi đó phải bảo vệ khoá và vẫn cần sequence.`,
        `Có. Redis chỉ là lớp tăng tốc; nguồn sự thật là PostgreSQL. Mọi lệnh Redis có timeout 50 ms (cấu hình {{spring.data.redis.timeout}}) và bọc circuit breaker Resilience4j. Khi lỗi vượt ngưỡng, breaker mở và code bỏ qua Redis, đọc DB trực tiếp, nên không phải chờ timeout cho từng request. Rate limit chuyển sang giới hạn cục bộ trong bộ nhớ mỗi pod (thô hơn nhưng vẫn chặn bot). Điều kiện là DB phải chịu được tải miss: với 1 triệu link và index unique, một lookup khoảng 1 ms, nhưng 2.000 req/s cần connection pool đủ và có thể cần read replica. Tôi đã chứng minh bằng load test tắt Redis giữa chừng: 0 lỗi 5xx, chỉ p95 tăng.`,
        `Có 3 lớp. Một: xoá key Redis **sau khi** transaction tắt link commit, dùng {{@TransactionalEventListener(phase = AFTER_COMMIT)}}. Nếu xoá trước commit, request khác có thể đọc DB còn ACTIVE và nạp lại cache cũ. Hai: TTL tối đa 5 phút là giới hạn trên cho trường hợp lệnh xoá thất bại, và tôi công bố con số này. Ba: với link quan trọng như link lừa đảo bị báo cáo, có thể publish sự kiện qua Redis Pub/Sub để các pod xoá cả cache Caffeine cục bộ. Nếu yêu cầu tuyệt đối không stale thì dùng version trong key: DB lưu version, key cache gắn version; nhưng như vậy mỗi resolve cần biết version hiện tại, làm mất một phần lợi ích của cache.`,
        `Preview nghĩa là server tự gọi tới URL do người dùng nhập, đây chính là kịch bản SSRF: kẻ tấn công nhập {{http://169.254.169.254/latest/meta-data/}} để lấy credential cloud, hoặc địa chỉ nội bộ 10.x. Cách làm: chạy fetch trong worker riêng, không trong request tạo link; resolve DNS trước, chặn mọi IP private, loopback, link-local, metadata; kết nối tới đúng IP đã kiểm (chống DNS rebinding); tắt tự động follow redirect và kiểm tra lại từng bước; giới hạn timeout 3 giây, kích thước 1 MB, chỉ port 80/443. Tốt nhất là chạy worker trong network segment không có quyền vào mạng nội bộ. Trade-off: phức tạp đáng kể, nên tôi để preview ngoài phạm vi phiên bản đầu.`,
        `Link không tồn tại trả **404**, link hết hạn hoặc bị tắt trả **410 Gone**. 410 nói rõ "tài nguyên từng tồn tại và đã bị gỡ vĩnh viễn", giúp người dùng hiểu link không phải gõ sai, và crawler bỏ link khỏi chỉ mục nhanh hơn 404. Nếu lo lộ thông tin (biết được mã đó từng tồn tại) thì có thể gộp tất cả về 404, đó là trade-off giữa trải nghiệm và chống enumeration; với pet project công khai tôi chọn 410. Body là trang HTML thân thiện cho trình duyệt, còn API quản trị trả problem+json. Lưu ý không trả 302 tới trang lỗi, vì như vậy status thật bị che mất và monitoring không đếm được.`,
        `301 là redirect vĩnh viễn: trình duyệt và proxy được phép cache rất lâu, lần sau đi thẳng tới URL đích mà không gọi lại server. Như vậy tôi mất khả năng tắt link, đổi đích và đếm click: link lừa đảo đã tắt vẫn tiếp tục chuyển hướng trên máy người đã từng mở. 302 (hoặc 307) không được cache mặc định nên mọi lần mở đều qua server. Trade-off: 302 tạo nhiều tải hơn cho hệ thống; nếu muốn giảm tải, tôi dùng 302 kèm {{Cache-Control: max-age=60}} để CDN cache ngắn, vẫn giữ quyền thu hồi trong vòng 1 phút. Chọn 301 khi ưu tiên SEO và tải thấp, chọn 302 khi ưu tiên analytics và khả năng thu hồi; với dự án này tôi ưu tiên vế sau.`,
        `Theo nghịch lý ngày sinh, xác suất có ít nhất một cặp trùng đạt khoảng 50% khi số mã cỡ căn bậc hai của không gian: căn của 3,5e12 là khoảng 1,9 triệu. Nhưng điều tôi quan tâm là xác suất **một lần insert mới** bị trùng = số link đã có / 3,5e12: với 10 triệu link chỉ khoảng 0,0003%, retry 3 lần là đủ. Unique index bảo đảm không bao giờ ghi đè. Tôi theo dõi metric {{shortlink.code.collision}}; khi tỉ lệ retry vượt khoảng 0,1% (tương ứng vài tỷ link), tôi tăng độ dài lên 8 ký tự (62 lần không gian) mà không ảnh hưởng link cũ. Lưu ý: retry phải trong transaction mới, vì PostgreSQL abort transaction ngay khi gặp lỗi unique.`,
        `Mỗi click một câu {{UPDATE link SET clicks = clicks + 1}} biến đường đọc thành đường ghi: link viral 2.000 req/s nghĩa là 2.000 lần khoá cùng một dòng, các request xếp hàng chờ nhau, p99 tăng mạnh và WAL/vacuum làm DB nặng thêm. Tôi tách hẳn: resolve chỉ tăng LongAdder trong bộ nhớ (vài chục nano giây), mỗi 10 giây flush một UPSERT cộng dồn cho mỗi link vào bảng theo ngày. 2.000 click trở thành 1 câu SQL. Trade-off: pod crash mất tối đa 10 giây click và số liệu trễ tối đa 1 phút; tôi ghi rõ trong README. Nếu cần không mất, đẩy event click vào Kafka và consumer tổng hợp, đổi lại phải vận hành thêm Kafka.`
      ]
    },
    related: ['api-001', 'lesson-core-001', 'design-002', 'design-003', 'design-009', 'api-019', 'scenario-018', 'english-021', 'api-002', 'testing-002']
  },
  {
    id: 'proj-flash-sale', title: 'Flash sale chống oversell', level: 'senior', weeks: 7,
    skills: ['Spring Boot', 'PostgreSQL', 'Redis', 'Kafka', 'Concurrency', 'Testcontainers', 'Kubernetes'],
    pitch: `Mô phỏng giờ mở bán với tồn kho hữu hạn và hàng đợi đơn. Câu chuyện phỏng vấn tập trung vào invariant tồn kho, backpressure và cách đo giới hạn thay vì chỉ thêm Redis.`,
    requirements: `### User story
1. **Tạo campaign:** là admin, tôi tạo campaign "iPhone 1 đồng" có 1.000 suất, mở lúc 20:00, mỗi người tối đa 1 suất.
  Chấp nhận: total > 0; start < end; trước giờ mở mọi lệnh mua trả 409 NOT_STARTED.
2. **Giữ suất:** là người mua, tôi bấm "Mua ngay" kèm Idempotency-Key.
  Chấp nhận: còn hàng → 201 reservation PENDING hạn 5 phút; hết hàng → 409 SOLD_OUT; tổng reservation + đơn đã bán không bao giờ vượt total.
3. **Một người một suất:** tôi bấm 5 lần hoặc mở 2 tab.
  Chấp nhận: chỉ 1 reservation; các lần sau trả lại reservation cũ (cùng key) hoặc 409 ALREADY_RESERVED (key khác).
4. **Thanh toán:** tôi thanh toán (giả lập) trong 5 phút.
  Chấp nhận: reservation → CONFIRMED, tồn kho reserved giảm 1, sold tăng 1; thanh toán báo về 2 lần vẫn chỉ xác nhận 1 lần.
5. **Hết hạn giữ suất:** tôi không thanh toán.
  Chấp nhận: sau 5 phút worker chuyển EXPIRED và trả suất về available; chạy worker 2 lần không trả 2 lần.
6. **Quá tải có kiểm soát:** 50.000 người bấm trong 1 giây.
  Chấp nhận: hệ thống trả 429/503 có Retry-After cho phần vượt khả năng thay vì timeout hàng loạt; không pod nào OOM.
7. **Theo dõi:** tôi xem trạng thái đơn của mình.
  Chấp nhận: GET reservation trả trạng thái hiện tại; người khác xem trả 404.

### Phi chức năng
- Burst: 5.000 req/s trong 10 giây vào 1 campaign (k6, laptop 8 core, 2 instance app); 0 oversell là tiêu chí **cứng**.
- Latency của request được nhận vào xử lý: p95 < 200 ms, p99 < 500 ms; request bị từ chối sớm trả trong < 20 ms.
- Nhất quán: tồn kho và reservation strong consistency trong PostgreSQL; thanh toán và thông báo eventual qua Kafka (p95 < 3 giây).
- Invariant luôn đúng: available + reserved + sold = total và available >= 0.

### Ngoài phạm vi
- Không làm cổng thanh toán thật (payment simulator ngẫu nhiên thành công/thất bại).
- Không cam kết công bằng FIFO toàn cục; chỉ bảo đảm không oversell và mỗi người 1 suất.
- Không chống bot nâng cao (CAPTCHA, device fingerprint), chỉ rate limit theo user/IP.`,
    architecture: `~~~text
Client -> API -> PostgreSQL conditional stock reservation + order
        -> Redis (optional admission rate limit)
Outbox -> Kafka -> payment simulator / expiry worker
~~~
PostgreSQL là nguồn chuẩn duy nhất cho stock và reservation; conditional update trong transaction chỉ nhận đơn khi available đủ, đồng thời ghi order và outbox. Redis chỉ có thể giới hạn/admit request, không giữ reservation. Kafka chuyển tiếp payment simulator và expiry worker; consumer xử lý idempotent. Đo giới hạn của phương án PostgreSQL trước khi cân nhắc partitioning hay admission queue.`,
    design: `### Schema DB (PostgreSQL 16)
~~~sql
CREATE TABLE campaign (
  id         BIGSERIAL PRIMARY KEY,
  name       VARCHAR(200) NOT NULL,
  starts_at  TIMESTAMPTZ NOT NULL,
  ends_at    TIMESTAMPTZ NOT NULL,
  hold_secs  INT NOT NULL DEFAULT 300,
  CHECK (starts_at < ends_at)
);
CREATE TABLE campaign_stock (
  campaign_id BIGINT PRIMARY KEY REFERENCES campaign(id),
  total       INT NOT NULL CHECK (total > 0),
  available   INT NOT NULL CHECK (available >= 0),   -- hàng rào cuối chống oversell
  reserved    INT NOT NULL DEFAULT 0 CHECK (reserved >= 0),
  sold        INT NOT NULL DEFAULT 0 CHECK (sold >= 0),
  CHECK (available + reserved + sold = total)          -- invariant trong 1 dòng
);
CREATE TABLE reservation (
  id          UUID PRIMARY KEY,
  campaign_id BIGINT NOT NULL REFERENCES campaign(id),
  user_id     VARCHAR(64) NOT NULL,
  idem_key    VARCHAR(64) NOT NULL,
  status      VARCHAR(16) NOT NULL
              CHECK (status IN ('PENDING','CONFIRMED','EXPIRED','CANCELLED')),
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (campaign_id, user_id),               -- mỗi người 1 suất / campaign
  UNIQUE (user_id, idem_key)
);
CREATE INDEX ix_resv_pending_exp ON reservation (expires_at)
  WHERE status = 'PENDING';                    -- worker hết hạn chỉ quét dòng PENDING
CREATE TABLE outbox (
  id BIGSERIAL PRIMARY KEY, aggregate_id UUID NOT NULL, event_type VARCHAR(64) NOT NULL,
  payload JSONB NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), published_at TIMESTAMPTZ
);
CREATE INDEX ix_outbox_unpub ON outbox (id) WHERE published_at IS NULL;
~~~
Lý do thiết kế:
- Gom available/reserved/sold vào **một dòng** để CHECK của PostgreSQL bảo vệ invariant mà không cần trigger; đổi lại dòng này là hot row (xem Mở rộng).
- {{UNIQUE (campaign_id, user_id)}} chặn mua 2 suất ở tầng DB, kể cả khi 2 pod cùng xử lý 2 request của 1 user.
- Partial index {{ix_resv_pending_exp}} giữ index nhỏ: sau campaign có thể có 1.000 dòng PENDING nhưng hàng trăm nghìn dòng đã xong.

### API
| Method | Path | Request | Response | Mã lỗi |
|---|---|---|---|---|
| POST | /api/campaigns | {name, total, startsAt, endsAt} | 201 | 400 |
| POST | /api/campaigns/{id}/reservations | Idempotency-Key | 201 Reservation (200 nếu replay) | 409 SOLD_OUT / NOT_STARTED / ALREADY_RESERVED, 429, 503 |
| GET | /api/reservations/{id} | - | 200 | 404 |
| POST | /api/reservations/{id}/payments | {simulate: "OK" hoặc "FAIL"} | 202 | 409 đã hết hạn |
| GET | /api/campaigns/{id}/stock | - | 200 {available} (cache 1 giây) | 404 |

~~~json
POST /api/campaigns/42/reservations
Idempotency-Key: 0b9e6c1e-58a4-4d55-9c3c-6c1f2a7d9e10

201 Created
{ "id": "c1a2...", "campaignId": 42, "status": "PENDING",
  "expiresAt": "2026-11-11T20:05:00Z" }

409 Conflict
{ "type": "/errors/sold-out", "title": "Sold out", "status": 409 }
~~~

### Luồng chính: đặt suất trong giờ cao điểm
~~~text
User      Admission (Redis)     API (TX PostgreSQL)                     Relay/Kafka
 |-- POST -->|                        |                                     |
 |           | token còn? (DECR gate) |                                     |
 |           | hết => 409 SOLD_OUT nhanh, không chạm DB                     |
 |           | semaphore pod đầy => 503 Retry-After                         |
 |           |----------------------->| INSERT reservation ON CONFLICT      |
 |           |                        |   trùng key => trả bản cũ (200)     |
 |           |                        |   trùng user => 409 ALREADY_RESERVED|
 |           |                        | UPDATE campaign_stock               |
 |           |                        |   SET available-1, reserved+1       |
 |           |                        |   WHERE available > 0               |
 |           |                        |   0 rows => ROLLBACK, 409 SOLD_OUT  |
 |           |                        | INSERT outbox ReservationCreated    |
 |           |                        | COMMIT                              |
 |<-- 201 ---|------------------------|                                     |
 |           |                        |------------- relay ---------------->| payment simulator
 |           |                        |<-- PaymentSucceeded (consumer) -----| UPDATE ... WHERE status='PENDING'
~~~
Redis gate chỉ là **bộ lọc**: nếu Redis cho qua nhiều hơn số hàng (ví dụ sau restart), PostgreSQL vẫn chặn bằng {{WHERE available > 0}} và CHECK. Nếu Redis chặn nhầm (đếm lệch xuống), hệ thống bán thiếu, nên cần job đồng bộ token với DB.

### Xử lý lỗi & đồng thời
| Tình huống | Hành vi hệ thống | Cách test |
|---|---|---|
| 5.000 request tranh 100 suất | Đúng 100 PENDING, còn lại 409 | Testcontainers + ExecutorService 200 thread, assert invariant |
| 1 user bấm 5 lần khác key | 1 reservation, 4 lần 409 ALREADY_RESERVED | 5 thread cùng user |
| Retry cùng key sau timeout | Trả reservation cũ, không trừ kho thêm | Gọi 2 lần tuần tự và song song |
| Thanh toán báo về 2 lần | UPDATE có điều kiện status = 'PENDING'; lần 2 không đổi gì | Consumer xử lý cùng event 2 lần |
| Thanh toán về sau khi đã EXPIRED | Không xác nhận; phát event hoàn tiền | Đặt expires_at quá khứ rồi gửi event |
| Worker hết hạn chạy song song 2 pod | {{FOR UPDATE SKIP LOCKED}}, mỗi dòng xử lý 1 lần | 2 worker cùng lúc, assert available đúng |
| Redis chết giữa campaign | Bỏ qua gate, chỉ còn semaphore cục bộ + DB | Dừng Redis giữa k6 |
| DB chậm, request dồn | Semaphore 50 slot/pod, chờ tối đa 100 ms rồi 503 | k6 vượt tải, kiểm không có timeout 30 giây |

### Chiến lược test
- **Unit:** state machine reservation (chỉ cho PENDING → CONFIRMED/EXPIRED/CANCELLED), tính expiresAt, phân loại lỗi retryable.
- **Integration (Testcontainers PostgreSQL + Redis + Kafka):** đặt suất → thanh toán → CONFIRMED; hết hạn → EXPIRED và kho trả lại; outbox phát đúng event.
- **Concurrency:** stock 100, 200 thread mỗi thread 25 request với user khác nhau → đúng 100 thành công; lặp 30 lần; sau mỗi lần assert {{available + reserved + sold = total}}.
- **Load test (k6, executor ramping-arrival-rate):** 0 → 5.000 req/s trong 5 giây, giữ 10 giây, 50.000 user ảo, stock 1.000. Đạt: 0 oversell, p95 request được nhận < 200 ms, tỉ lệ 5xx khác 503 = 0, không pod nào restart.

### Chạy local
~~~yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: flash
      POSTGRES_USER: app
      POSTGRES_PASSWORD: app
    command: ["postgres", "-c", "max_connections=200"]
    ports: ["5432:5432"]
  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
  kafka:
    image: apache/kafka:3.7.0
    ports: ["9092:9092"]
~~~
Chạy 2 instance app trên port 8081/8082 ({{--server.port=8082}}) để thấy chuyện tranh chấp giữa nhiều pod.

### Quan sát
- Metric: {{flash.reservation}} (Counter, tag result=ok|sold_out|duplicate|rejected_overload), {{flash.reservation.duration}} (Timer), {{flash.stock.available}} (Gauge theo campaign), {{flash.admission.inflight}} (Gauge semaphore), {{flash.expiry.released}} (Counter), {{flash.outbox.lag.seconds}}; cộng {{hikaricp.connections.pending}} và metric consumer lag của Kafka.
- Log: mỗi reservation tạo/đổi trạng thái kèm reservationId, userId, campaignId, traceId; log tổng hợp mỗi 10 giây trong giờ cao điểm thay vì log từng request bị từ chối.
- Alert: query invariant trả dòng sai (page ngay, nghĩa là có oversell); reserved > 0 nhưng không có PENDING (rò suất); consumer lag > 1.000 trong 2 phút; tỉ lệ 503 > 30% trong 1 phút.

### Mở rộng lên production (tải x10 = 50.000 req/s)
- **Hot row:** mọi request UPDATE cùng 1 dòng {{campaign_stock}}, throughput bị giới hạn bởi thời gian giữ khoá. Chia kho thành N bucket (ví dụ 20 dòng mỗi dòng 50 suất), request chọn bucket ngẫu nhiên, hết thì thử bucket khác.
- Đưa phần lớn tải "hết hàng" ra khỏi DB: Redis gate (Lua DECR) từ chối sau khi token về 0, CDN cache trang sản phẩm và số tồn kho 1 giây.
- Hàng đợi vào cửa (waiting room): ghi request vào Kafka, consumer theo partition xử lý tuần tự, client poll kết quả; đổi latency lấy khả năng chịu burst và công bằng hơn.
- Kubernetes: HPA theo CPU không kịp cho burst 10 giây, nên **scale trước** giờ mở bán (pre-warm pod, JIT warm-up, connection pool đầy sẵn).`,
    milestones: [
      { title: 'Invariant, state machine và schema', tasks: `1. Vẽ state machine: PENDING → CONFIRMED | EXPIRED | CANCELLED; trạng thái cuối không đổi được nữa.
2. Viết migration theo phần Schema, đặc biệt CHECK {{available + reserved + sold = total}}.
3. Viết enum {{ReservationStatus}} có hàm {{canTransitionTo}}.
4. Viết query kiểm tra invariant để dùng trong test và alert.
5. Seed campaign 1.000 suất cho môi trường local.
6. Unit test mọi cặp trạng thái (16 tổ hợp).

~~~java
public enum ReservationStatus {
    PENDING, CONFIRMED, EXPIRED, CANCELLED;

    // Chỉ PENDING được đổi; trạng thái cuối là bất biến
    public boolean canTransitionTo(ReservationStatus next) {
        return this == PENDING && next != PENDING;
    }
}
~~~
~~~sql
-- Kiểm invariant chéo bảng: reserved trong stock = số reservation PENDING
SELECT s.campaign_id, s.reserved, COUNT(r.id) AS pending
FROM campaign_stock s
LEFT JOIN reservation r ON r.campaign_id = s.campaign_id AND r.status = 'PENDING'
GROUP BY s.campaign_id, s.reserved
HAVING s.reserved <> COUNT(r.id);   -- phải trả 0 dòng
~~~`, done: `Migration chạy sạch; UPDATE làm lệch tổng bị CHECK chặn (có test); 16 unit test chuyển trạng thái pass; query invariant trả 0 dòng sau seed.` },
      { title: 'Đặt suất bằng conditional update và idempotency', tasks: `1. Viết service {{reserve(campaignId, userId, idemKey)}} trong 1 transaction.
2. INSERT reservation trước với {{ON CONFLICT DO NOTHING}}; 0 dòng thì đọc lại để phân biệt trùng key (trả bản cũ) hay trùng user (409).
3. UPDATE kho có điều kiện {{available > 0}}; 0 dòng thì ném {{SoldOutException}} để rollback cả dòng reservation.
4. Ghi outbox ReservationCreated trong cùng transaction.
5. Kiểm tra campaign đã mở (starts_at) trước khi chạm kho.
6. Viết test đồng thời Testcontainers (bên dưới), lặp 30 lần.

~~~java
@Test
void neverOversells() throws Exception {
    long campaignId = seedCampaign(100);                 // stock = 100
    ExecutorService pool = Executors.newFixedThreadPool(200);
    CountDownLatch start = new CountDownLatch(1);
    AtomicInteger ok = new AtomicInteger(), soldOut = new AtomicInteger();
    for (int i = 0; i < 1000; i++) {
        String user = "u" + i;
        pool.submit(() -> {
            start.await();                               // mọi thread xuất phát cùng lúc
            try { service.reserve(campaignId, user, UUID.randomUUID().toString()); ok.incrementAndGet(); }
            catch (SoldOutException e) { soldOut.incrementAndGet(); }
            return null;
        });
    }
    start.countDown();
    pool.shutdown();
    assertThat(pool.awaitTermination(60, TimeUnit.SECONDS)).isTrue();
    assertThat(ok.get()).isEqualTo(100);                 // không hơn, không kém
    assertThat(soldOut.get()).isEqualTo(900);
    assertThat(stockRepo.find(campaignId).available()).isZero();
}
~~~`, done: `Test trên pass 30/30 lần; 5 request cùng user khác key → 1 thành công + 4 lần 409; retry cùng key → cùng reservation id, available chỉ giảm 1.` },
      { title: 'Admission control và backpressure', tasks: `1. Mỗi pod có {{Semaphore(50)}} bao quanh đoạn chạm DB; {{tryAcquire(100, MILLISECONDS)}} thất bại → 503 + Retry-After: 1.
2. Đặt HikariCP {{maximum-pool-size}} khoảng 20 và {{connection-timeout}} 500 ms để không treo 30 giây mặc định.
3. Redis gate: khi campaign mở, SET {{stock:42}} = total; mỗi request chạy Lua DECR, âm thì 409 SOLD_OUT ngay.
4. Khi reservation hết hạn/huỷ, INCR lại token; job mỗi 30 giây đồng bộ token = available trong DB.
5. Rate limit 5 request/giây/user để chặn bấm liên tục.
6. Load test vượt tải và ghi số 503/409/201.

~~~java
private static final RedisScript<Long> TAKE = RedisScript.of(
    // -2: key chưa có (Redis vừa restart) => bỏ qua gate; -1: hết token; >= 0: số còn lại.
    // Nguyên tử vì Lua chạy trọn vẹn, không lệnh nào chen vào giữa.
    "local v = redis.call('GET', KEYS[1]) if not v then return -2 end " +
    "if tonumber(v) <= 0 then return -1 end return redis.call('DECR', KEYS[1])", Long.class);

private final Semaphore dbSlots = new Semaphore(50);

public Reservation reserveGuarded(long campaignId, String user, String key) throws InterruptedException {
    Long left = redis.execute(TAKE, List.of("stock:" + campaignId));
    if (left != null && left == -1) throw new SoldOutException();     // chặn sớm, không chạm DB
    if (!dbSlots.tryAcquire(100, TimeUnit.MILLISECONDS)) {
        if (left != null && left >= 0) redis.opsForValue().increment("stock:" + campaignId); // trả token
        throw new OverloadedException();                              // 503 Retry-After
    }
    try { return service.reserve(campaignId, user, key); }            // DB vẫn là trọng tài cuối
    finally { dbSlots.release(); }
}
~~~`, done: `k6 5.000 req/s với stock 1.000: 0 oversell; phần lớn request sau khi hết hàng trả 409 trong < 20 ms; không có request nào chờ > 1 giây; HikariCP pending không vượt 50.` },
      { title: 'Thanh toán qua outbox, Kafka và hết hạn', tasks: `1. Relay outbox như dự án ví ({{FOR UPDATE SKIP LOCKED}}, chờ ack rồi đánh dấu).
2. Payment simulator consume ReservationCreated, trả PaymentSucceeded/Failed sau 0–3 giây.
3. Consumer xác nhận bằng UPDATE có điều kiện {{WHERE id = ? AND status = 'PENDING'}} rồi cập nhật kho (reserved - 1, sold + 1) chỉ khi số dòng = 1; 0 dòng nghĩa là event trùng hoặc đã EXPIRED.
4. Worker hết hạn {{@Scheduled(fixedDelay = 5000)}} lấy lô 100 dòng PENDING quá hạn thêm 30 giây ân hạn (để thanh toán sát giờ kịp về) bằng SKIP LOCKED, chuyển EXPIRED và trả kho trong cùng transaction.
5. Thanh toán về khi đã EXPIRED → phát event RefundRequested.
6. Test chạy 2 worker song song và gửi event trùng.

~~~sql
-- Worker hết hạn: một câu lệnh, nguyên tử, chạy lặp an toàn
WITH expired AS (
  SELECT id, campaign_id FROM reservation
  WHERE status = 'PENDING' AND expires_at < now() - interval '30 seconds'
  ORDER BY expires_at
  LIMIT 100
  FOR UPDATE SKIP LOCKED                      -- pod khác bỏ qua dòng đang bị khoá
), upd AS (
  UPDATE reservation r SET status = 'EXPIRED'
  FROM expired e WHERE r.id = e.id
  RETURNING r.campaign_id
)
UPDATE campaign_stock s
SET available = s.available + x.n, reserved = s.reserved - x.n
FROM (SELECT campaign_id, COUNT(*) AS n FROM upd GROUP BY campaign_id) x
WHERE s.campaign_id = x.campaign_id;
~~~`, done: `100 reservation hết hạn, 2 worker chạy cùng lúc → available tăng đúng 100; gửi PaymentSucceeded 2 lần → sold tăng 1; thanh toán sau hạn → reservation vẫn EXPIRED và có event RefundRequested.` },
      { title: 'Đóng gói, Kubernetes và quan sát', tasks: `1. Dockerfile nhiều stage (build bằng Maven, chạy trên JRE 21), chạy user không phải root.
2. Thêm Actuator probes: {{management.endpoint.health.probes.enabled=true}}; readiness kiểm DB, liveness không kiểm DB (DB chậm không nên làm pod bị restart).
3. Manifest Kubernetes: 3 replica, resources requests/limits, {{-XX:MaxRAMPercentage=75}}.
4. Metric Micrometer như phần Quan sát, dashboard Grafana có panel available theo thời gian.
5. Kịch bản k6 đầy đủ và bảng kết quả trong README.
6. Runbook: tắt campaign khẩn cấp (cờ trong DB), rollback phiên bản.

~~~yaml
# application.yaml
management:
  endpoint:
    health:
      probes:
        enabled: true               # /actuator/health/liveness và /readiness
      group:
        readiness:
          include: readinessState,db  # readiness rớt khi DB lỗi: ngừng nhận traffic
  endpoints:
    web:
      exposure:
        include: health,prometheus
spring:
  datasource:
    hikari:
      maximum-pool-size: 20
      connection-timeout: 500       # ms: thà fail nhanh còn hơn treo
~~~`, done: `Pod khởi động và readiness OK; giết 1 pod giữa load test không gây oversell và tỉ lệ lỗi < 1%; README có ảnh dashboard và bảng k6 (RPS, p95, p99, 201/409/503).` }
    ],
    challenges: [
      `### Oversell do đọc rồi ghi
**Triệu chứng:** stock 100 nhưng có 103 đơn PENDING sau load test.
**Nguyên nhân gốc:** code {{if (stock.getAvailable() > 0) stock.setAvailable(available - 1)}} rồi save: nhiều transaction cùng đọc available = 1 và cùng ghi 0.
**Cách 1, UPDATE có điều kiện** {{WHERE available > 0}} và kiểm số dòng bị ảnh hưởng: đúng tuyệt đối, 1 round-trip, nhưng dòng kho thành hot row.
**Cách 2, mỗi suất là một dòng** (bảng stock_unit 1.000 dòng, lấy 1 dòng FREE bằng {{FOR UPDATE SKIP LOCKED}}): các transaction không chờ nhau vì mỗi bên khoá dòng khác, song song tốt hơn; giá là dữ liệu lớn hơn và không hợp với số lượng hàng trăm nghìn.
**Chứng minh:** test 1.000 request tranh 100 suất, lặp 30 lần, assert đúng 100 và CHECK invariant không lần nào bị vi phạm.`,
      `### Redis và PostgreSQL lệch nhau
**Triệu chứng:** Redis báo hết hàng nhưng DB còn 12 suất (bán thiếu), hoặc Redis còn token khi DB đã hết (tải dồn vào DB).
**Nguyên nhân gốc:** Redis DECR và DB transaction không nguyên tử với nhau: DECR xong rồi DB rollback (trùng user, lỗi) mà quên INCR lại; Redis restart mất key.
**Cách 1, Redis chỉ làm gate, DB là trọng tài, có job đồng bộ token = available** mỗi 30 giây: đơn giản, sai lệch tự lành trong 30 giây.
**Cách 2, Redis là nơi giữ suất chính** (Lua kiểm + giữ chỗ), DB ghi bất đồng bộ qua Kafka: throughput rất cao nhưng mất Redis là mất reservation, cần đối soát phức tạp. Tôi chọn cách 1 cho dự án này.
**Chứng minh:** test làm DB rollback sau DECR (trùng user) → token được trả; test xoá key Redis giữa campaign → job khôi phục đúng số.`,
      `### Quá tải làm chết dây chuyền
**Triệu chứng:** đúng 20:00, p99 lên 30 giây, Tomcat hết thread, health check timeout và Kubernetes restart pod, làm tình hình tệ hơn.
**Nguyên nhân gốc:** không có giới hạn: mọi request đều chờ connection DB (HikariCP {{connection-timeout}} mặc định 30 giây), thread bị giữ, liveness probe cũng không được phục vụ.
**Cách 1, load shedding tại pod** (Semaphore + chờ tối đa 100 ms rồi 503): nhanh gọn, bảo vệ DB; người dùng phải thử lại.
**Cách 2, hàng đợi vào cửa** (ghi request vào Kafka, trả ticket, client poll): không ai bị từ chối thô, có thể công bằng hơn; nhưng phức tạp hơn nhiều và latency tính bằng giây.
Ngoài ra liveness không được kiểm DB.
**Chứng minh:** k6 gấp 3 lần khả năng: không pod restart, 503 trả trong < 150 ms, request được nhận vẫn giữ p95 < 200 ms.`,
      `### Hết hạn và thanh toán đến cùng lúc
**Triệu chứng:** đơn đã trả tiền nhưng trạng thái EXPIRED và suất bị bán cho người khác, hoặc suất bị trả về kho 2 lần.
**Nguyên nhân gốc:** worker và consumer thanh toán cùng sửa 1 reservation, mỗi bên đọc PENDING rồi ghi trạng thái của mình.
**Cách 1, UPDATE có điều kiện trạng thái** ({{WHERE status = 'PENDING'}}) ở cả 2 phía và chỉ cập nhật kho khi số dòng = 1: bên nào đến trước thắng, bên sau không làm gì. Bên thanh toán thua thì phát yêu cầu hoàn tiền.
**Cách 2, khoá dòng** ({{SELECT ... FOR UPDATE}}) rồi xử lý: logic rõ ràng ở Java nhưng giữ khoá lâu hơn và dễ deadlock nếu khoá kho và reservation theo thứ tự khác nhau.
Thêm biên an toàn: worker chỉ hết hạn sau expires_at + 30 giây để thanh toán sát giờ có cơ hội về.
**Chứng minh:** test đặt expires_at = now, chạy song song worker và consumer 500 lần: invariant luôn đúng, mỗi reservation đúng 1 trạng thái cuối.`,
      `### Công bằng giữa nhiều pod
**Triệu chứng:** người bấm sớm hơn vẫn nhận SOLD_OUT, người bấm sau lại mua được; khách khiếu nại.
**Nguyên nhân gốc:** request đi qua load balancer tới nhiều pod, mạng và GC mỗi pod khác nhau; thứ tự tới DB không phải thứ tự người dùng bấm.
**Cách 1, công bố rõ "không bảo đảm thứ tự"** và tập trung chống bot, mỗi người 1 suất: đơn giản, đúng với phần lớn flash sale.
**Cách 2, hàng đợi có thứ tự:** Kafka 1 partition cho campaign (thứ tự theo thời điểm broker ghi nhận), consumer cấp suất tuần tự; công bằng hơn nhưng throughput bị giới hạn bởi 1 consumer và latency tăng.
**Chứng minh:** với cách 2, test gửi 1.000 request có timestamp, assert người nhận suất là 100 request đầu theo offset.`
    ],
    readme: `# Flash Sale\n\n## Mục tiêu\nMô phỏng nhận đơn cho chiến dịch có stock hữu hạn, đo tải và chứng minh không oversell.\n\n## Chạy local\n{{docker compose up --build}} khởi động PostgreSQL, Kafka và API. Dùng seed stock nhỏ để test cạnh tranh.\n\n## Invariant\navailable + reserved + sold luôn bằng total; mọi command có idempotency key. Mô tả state machine và cách giải phóng reservation.\n\n## Kiểm thử và benchmark\nTestcontainers kiểm tra race/retry/restart. Benchmark ghi số pod, partition, dataset, concurrency, latency và rejected rate.\n\n## Vận hành\nTheo dõi queue lag, reservation quá hạn, lỗi consumer và tỷ lệ từ chối; có hướng giảm tải/rollback.`,
    interview: {
      story: `### STAR
**Situation:** Bản đầu xử lý đặt hàng theo kiểu đọc tồn kho rồi ghi lại. Với k6 2.000 req/s tranh 1.000 suất, có lần bán 1.037 đơn (oversell 3,7%), và khi tải vượt khả năng, p99 lên 28 giây rồi pod bị Kubernetes restart.
**Task:** Bảo đảm 0 oversell ở 5.000 req/s với 2 instance, mỗi người 1 suất, retry không tạo đơn trùng; quá tải thì từ chối có kiểm soát thay vì sập.
**Action:**
- Đặt PostgreSQL làm nguồn sự thật: UPDATE có điều kiện {{available > 0}}, CHECK {{available + reserved + sold = total}}, unique (campaign, user) và (user, idem_key).
- Thêm Redis gate (Lua DECR) để từ chối sớm khi hết hàng, Semaphore 50 slot mỗi pod và HikariCP timeout 500 ms để load shedding.
- Thanh toán và hết hạn qua outbox + Kafka; worker dùng {{FOR UPDATE SKIP LOCKED}}, mọi chuyển trạng thái đều có điều kiện {{status = 'PENDING'}}.
- Viết test đồng thời lặp 30 lần và k6 vượt tải 3 lần.
**Result:**
- 0 oversell qua 30 lần test đồng thời và 10 lần load test (trước: oversell 3,7%).
- 92% request sau khi hết hàng bị Redis gate từ chối trong < 10 ms, tải DB giảm khoảng 10 lần.
- Vượt tải 3 lần: không pod restart, request được nhận giữ p95 160 ms, phần thừa nhận 503 trong < 120 ms.

> Số liệu trên là ví dụ minh hoạ: hãy thay bằng kết quả bạn tự đo và nói rõ cấu hình máy.

### Demo trong 5 phút
1. {{docker compose up -d}}, chạy 2 instance app (port 8081, 8082), mở Grafana dashboard.
2. Tạo campaign 100 suất mở ngay; chạy {{k6 run burst.js}} (2.000 req/s, 10 giây) và để dashboard hiện available giảm về 0, đếm 201/409/503.
3. Chạy query invariant trong psql → 0 dòng sai; {{SELECT COUNT(*) FROM reservation}} đúng 100.
4. Gửi lại 1 request với cùng Idempotency-Key → cùng reservation id.
5. Đổi hold_secs = 10, chờ worker hết hạn → available tăng trở lại; gửi PaymentSucceeded trùng → sold chỉ tăng 1.
6. {{docker stop redis}} rồi chạy lại burst ngắn: vẫn 0 oversell, chỉ DB nhận nhiều tải hơn.`,
      questions: [
        'Bạn đặt nguồn dữ liệu chuẩn tồn kho ở đâu?',
        'Redis reservation mất dữ liệu thì reconcile thế nào?',
        'Có thể đảm bảo FIFO giữa nhiều pod không?',
        'Bạn phân loại lỗi để retry ra sao?',
        'Bạn sẽ scale consumer theo metric nào?',
        'Nếu Redis chết đúng lúc mở bán thì sao?',
        'Vì sao không dùng distributed lock (Redisson) quanh đoạn trừ kho?',
        'Một dòng campaign_stock chịu được bao nhiêu TPS và bạn mở rộng thế nào?'
      ],
      answers: [
        `Ở PostgreSQL, bảng {{campaign_stock}}, và đó là nơi duy nhất quyết định một suất có được bán hay không. Lý do: PostgreSQL cho tôi transaction ACID để ghi kho, reservation và outbox nguyên tử, cộng với CHECK constraint làm hàng rào cuối, nên kể cả code có bug cũng không thể commit trạng thái oversell. Redis chỉ là bộ lọc phía trước để từ chối sớm khi đã hết hàng; nó có thể sai (lệch token sau restart) mà không phá invariant, chỉ làm DB nhận nhiều tải hơn hoặc bán thiếu tạm thời rồi job đồng bộ sửa lại. Trade-off: throughput bị giới hạn bởi DB và hot row, nhưng với quy mô vài nghìn suất, tính đúng đắn quan trọng hơn. Khi cần scale thì chia bucket kho, vẫn giữ DB là nguồn sự thật.`,
        `Trong thiết kế của tôi Redis không giữ reservation, chỉ giữ một bộ đếm token để chặn sớm, nên mất Redis không mất đơn nào. Reconcile là đặt lại token: job mỗi 30 giây đọc {{available}} từ DB và SET lại key, đồng thời job chạy ngay khi phát hiện key không tồn tại. Nếu một thiết kế khác để Redis giữ reservation (ghi DB bất đồng bộ) thì phải đối soát 2 chiều: danh sách reservation trong Redis so với DB theo user, cái nào chỉ có ở Redis thì bổ sung vào DB nếu kho còn, nếu không thì huỷ và báo người dùng. Đó là lý do tôi không chọn mô hình đó: trải nghiệm "đã mua được rồi lại bị huỷ" tệ hơn nhiều so với vài mili giây latency thêm.`,
        `Không, nếu chỉ có nhiều pod sau load balancer: thời điểm request tới DB phụ thuộc mạng, GC và thread scheduling của từng pod, nên người bấm sau vài mili giây có thể vào trước. Tôi nói rõ trong yêu cầu là không bảo đảm FIFO, chỉ bảo đảm không oversell và mỗi người 1 suất. Nếu nghiệp vụ bắt buộc công bằng, cách thực tế là hàng đợi: ghi request vào Kafka partition theo campaign, thứ tự là offset broker ghi nhận, một consumer cấp suất tuần tự và client poll kết quả. Ngay cả vậy thứ tự cũng là theo lúc broker nhận, không phải lúc người dùng bấm. Trade-off: throughput của campaign bị giới hạn bởi 1 consumer và người dùng chờ vài giây; bù lại DB không còn bị tranh chấp.`,
        `Tôi chia 3 nhóm. **Lỗi nghiệp vụ** (SOLD_OUT, ALREADY_RESERVED, validate): không retry, trả 409/400 ngay. **Lỗi tạm thời có thể retry an toàn**: deadlock 40P01, serialization 40001, timeout lấy connection, Kafka broker không sẵn sàng; retry tối đa 3 lần với exponential backoff + jitter, vì không có jitter thì hàng nghìn client retry cùng nhịp tạo burst thứ hai. **Quá tải** (503 từ semaphore): server không tự retry, trả Retry-After để client lùi lại. Mọi retry đều an toàn nhờ idempotency key và UPDATE có điều kiện. Với consumer Kafka, lỗi tạm thời retry vài lần rồi đưa vào DLQ topic để không chặn partition, kèm alert khi DLQ có message.`,
        `Metric chính là **consumer lag** (số message chưa xử lý, theo partition) và xu hướng của nó, không phải CPU. Lag tăng liên tục nghĩa là tốc độ xử lý thấp hơn tốc độ đổ vào. Trên Kubernetes có thể dùng KEDA với Kafka scaler để scale theo lag. Giới hạn cứng: số consumer hiệu quả không vượt số partition của topic, nên phải chọn số partition từ đầu (ví dụ 12) và key theo reservationId để phân tán đều. Thêm nữa, scale consumer làm tăng tải DB, nên tôi theo dõi cùng lúc {{hikaricp.connections.pending}} và latency DB; nếu DB đã bão hoà thì thêm consumer chỉ làm tệ hơn. Với flash sale, tôi scale trước giờ mở bán vì autoscale phản ứng chậm hơn burst 10 giây.`,
        `Hệ thống vẫn đúng, chỉ kém hiệu quả hơn. Lệnh Redis có timeout ngắn và circuit breaker; khi breaker mở, code bỏ qua gate và đi thẳng tới phần semaphore + PostgreSQL. Không oversell được vì DB là trọng tài. Cái mất là lớp từ chối sớm: mọi request sau khi hết hàng đều chạm DB, nhưng semaphore 50 slot mỗi pod giới hạn số request đồng thời tới DB, phần dư nhận 503 nhanh. Rate limit theo user cũng chuyển sang bộ nhớ cục bộ. Sau khi Redis sống lại, job đồng bộ đặt lại token từ available trong DB rồi mới đóng breaker. Tôi đã chạy kịch bản tắt Redis giữa load test để chứng minh: 0 oversell, p95 tăng, tỉ lệ 503 tăng.`,
        `Distributed lock giải quyết bài toán "chỉ một người được làm việc này tại một thời điểm", nhưng ở đây DB đã có khoá dòng và UPDATE có điều kiện làm đúng việc đó, nguyên tử và bền vững. Bọc thêm Redisson lock quanh đoạn trừ kho làm mọi request của campaign tuần tự hoá qua Redis, thêm 2 round-trip, và tạo rủi ro mới: lock hết hạn trong lúc GC pause dài thì 2 pod cùng nghĩ mình giữ lock; Redis failover có thể làm mất lock. Muốn an toàn thật phải có fencing token, mà cuối cùng vẫn phải kiểm ở DB. Tôi chỉ dùng lock phân tán cho việc không có DB làm trọng tài, ví dụ đảm bảo chỉ một instance chạy job, và ngay cả việc đó tôi cũng ưu tiên {{FOR UPDATE SKIP LOCKED}}.`,
        `Tất cả request UPDATE cùng một dòng phải xếp hàng, nên trần xấp xỉ 1 / thời gian giữ khoá. Transaction ngắn (INSERT reservation, UPDATE kho, INSERT outbox, COMMIT có fsync) giữ khoá khoảng 1–3 ms, tức vài trăm đến khoảng 1.000 TPS cho một dòng, tuỳ ổ đĩa; tôi đo bằng k6 chứ không đoán. Cách mở rộng: (1) chia kho thành N bucket, request chọn bucket ngẫu nhiên, bucket hết thì thử bucket kế, throughput gần N lần; trade-off là cuối campaign có thể vài bucket còn hàng trong khi request rơi vào bucket rỗng, cần logic thử tiếp. (2) Đưa phần lớn tải hết hàng ra khỏi DB bằng Redis gate. (3) Rút ngắn transaction: không gọi mạng, khoá kho ở bước cuối cùng ngay trước COMMIT.`
      ]
    },
    related: ['lesson-concurrency-001', 'lesson-spring-001', 'design-004', 'scenario-049', 'scenario-051', 'scenario-008', 'db-010', 'microservices-038', 'design-010', 'microservices-026']
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
