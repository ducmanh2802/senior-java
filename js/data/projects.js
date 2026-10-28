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
    pitch: `Tạo nền tảng gửi email/SMS/push giả lập từ domain event, làm rõ delivery semantics, retry và trạng thái cuối. Đây là cách tốt để kể về vận hành bất đồng bộ giữa nhiều team: không gửi trùng, không gửi cho người đã opt-out, không để provider chậm kéo sập API.`,
    requirements: `### User story
1. **Gửi từ domain event:** khi đơn hàng thanh toán xong, order service phát event {{OrderPaid}} qua outbox; notification service gửi email + push cho người mua.
  Chấp nhận: provider khoẻ thì p95 từ lúc event commit tới SENT < 5 giây; mỗi kênh có đúng 1 bản ghi delivery.
2. **Idempotency:** producer gửi lại cùng {{notification_id}} (retry, replay, consumer restart).
  Chấp nhận: vẫn chỉ 1 notification và mỗi kênh gửi tối đa 1 lần; cùng id nhưng payload khác trả 409.
3. **Template và i18n:** template {{order.paid}} có bản vi và en cho từng kênh.
  Chấp nhận: thiếu bản locale yêu cầu thì dùng bản vi mặc định; thiếu biến trong params thì delivery FAILED với lỗi TEMPLATE_ERROR, không retry.
4. **Opt-out:** tôi tắt email khuyến mãi.
  Chấp nhận: tin MARKETING qua email bị SKIPPED (không gọi provider), tin TRANSACTIONAL như OTP vẫn gửi; opt-out có hiệu lực cả với event đã nằm trong queue.
5. **Retry:** provider SMS trả 503 hoặc timeout.
  Chấp nhận: retry sau 10 giây, 30 giây, 90 giây, 270 giây; vẫn lỗi thì vào DLT, delivery DEAD; lỗi vĩnh viễn (số điện thoại sai, 400) không retry.
6. **Rate limit theo provider:** gói SMS chỉ cho 50 tin/giây.
  Chấp nhận: vượt hạn mức thì worker chờ chứ không bỏ tin; không bao giờ nhận 429 từ provider giả lập ở tải 500 event/giây.
7. **Tra trạng thái:** support nhập notification id.
  Chấp nhận: thấy từng kênh, số lần thử, lỗi cuối và provider message id.
8. **Replay DLT:** admin replay tin DEAD sau khi provider hồi phục.
  Chấp nhận: chỉ role NOTIF_ADMIN; có audit ai replay, lúc nào; tin đã SENT không bị gửi lại.

### Phi chức năng
- Tiếp nhận 500 event/giây trên laptop 8 core (3 partition, 1 instance mỗi loại worker); API POST p95 < 150 ms.
- Tỉ lệ giao thành công ≥ 99% khi provider lỗi tạm thời 5%; 0 tin gửi trùng trong ranh giới hệ thống.
- Delivery semantics: at-least-once tới provider, dedup bằng khoá idempotency; công bố rõ giới hạn khi provider không hỗ trợ idempotency.
- Không log nội dung tin, số điện thoại, email đầy đủ (che còn 3 ký tự cuối).

### Ngoài phạm vi
- Không dùng provider thật: email qua Mailpit, SMS/push là WireMock giả lập có thể bật lỗi/chậm.
- Không làm campaign marketing hàng loạt, lên lịch gửi, phân khúc người dùng hay UI soạn template.
- Không đảm bảo thứ tự giữa các kênh (email có thể tới sau push).`,
    architecture: `~~~text
Order service -> PostgreSQL outbox -> relay -> Kafka notification.requested (key = userId)
  -> Router: lưu notification + delivery, kiểm tra preference
     -> notification.email / notification.sms / notification.push
        -> channel worker: rate limit -> render template -> provider adapter
        -> retry topic (-retry-0..3, backoff) -> DLT (-dlt)
~~~
Outbox bảo đảm event cùng commit với thay đổi nghiệp vụ. Router và worker đều idempotent nhờ unique key (notification_id, channel) và update có điều kiện; retry không chặn partition nhờ retry topic riêng; mỗi kênh scale độc lập.`,
    design: `### Schema DB (PostgreSQL 16, Flyway V1)
~~~sql
CREATE TABLE notification (
  id           UUID PRIMARY KEY,               -- notification_id do producer sinh
  user_id      VARCHAR(64) NOT NULL,
  template_key VARCHAR(64) NOT NULL,
  locale       VARCHAR(8)  NOT NULL DEFAULT 'vi',
  category     VARCHAR(16) NOT NULL CHECK (category IN ('TRANSACTIONAL','MARKETING')),
  params       JSONB NOT NULL,
  payload_hash CHAR(64) NOT NULL,              -- phát hiện cùng id khác payload
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE delivery (
  id              BIGSERIAL PRIMARY KEY,
  notification_id UUID NOT NULL REFERENCES notification(id),
  channel   VARCHAR(8)  NOT NULL CHECK (channel IN ('EMAIL','SMS','PUSH')),
  status    VARCHAR(16) NOT NULL CHECK (status IN
            ('PENDING','SENDING','SENT','SKIPPED','FAILED','DEAD')),
  attempts  INT NOT NULL DEFAULT 0,
  provider_msg_id VARCHAR(128),
  last_error      VARCHAR(300),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (notification_id, channel)            -- khoá idempotency: 1 kênh tối đa 1 bản ghi
);
CREATE INDEX ix_delivery_stuck ON delivery (updated_at) WHERE status = 'SENDING';
CREATE TABLE user_preference (
  user_id VARCHAR(64), channel VARCHAR(8), category VARCHAR(16),
  enabled BOOLEAN NOT NULL,
  PRIMARY KEY (user_id, channel, category)
);
~~~
- {{UNIQUE (notification_id, channel)}}: chặn trùng ở tầng DB, không cần khoá Java.
- {{ix_delivery_stuck}} là partial index chỉ chứa dòng SENDING: quét "kẹt quá 5 phút" rất rẻ.

### API
| Method | Path | Request | Response | Mã lỗi |
|---|---|---|---|---|
| POST | /api/notifications | {notificationId, userId, templateKey, locale, category, params, channels} | 202 {id} | 400 template không có, 409 cùng id khác payload |
| GET | /api/notifications/{id} | - | 200 {deliveries[]} | 404 |
| PUT | /api/users/{id}/preferences | [{channel, category, enabled}] | 200 | 403 |
| POST | /admin/dlt/replay | {deliveryIds[]} | 202 {replayed} | 403 thiếu NOTIF_ADMIN |

~~~json
GET /api/notifications/5b1f0c2e-...
{ "id": "5b1f0c2e-...", "templateKey": "order.paid", "deliveries": [
  { "channel": "EMAIL", "status": "SENT", "attempts": 1, "providerMsgId": "m-881" },
  { "channel": "SMS", "status": "DEAD", "attempts": 5, "lastError": "HTTP 503" } ] }
~~~

### Luồng chính: router và worker
~~~text
Kafka requested   Router             PostgreSQL           Kafka channel     EmailWorker     Provider
  |-- record ----->|-- INSERT notification ON CONFLICT DO NOTHING ->|          |               |
  |                |-- INSERT delivery (PENDING | SKIPPED nếu opt-out) ->|      |               |
  |                |-- send notification.email (key=userId) --------->|        |               |
  |<- commit offset|                    |                  |-- record ------>|               |
  |                |                    |<-- UPDATE status='SENDING' WHERE status='PENDING' --|
  |                |                    |   (0 dòng => đã có worker khác xử lý, bỏ qua)         |
  |                |                    |                  |  rateLimiter.acquire()            |
  |                |                    |                  |  re-check opt-out, render ------->|
  |                |                    |<-- UPDATE status='SENT', provider_msg_id -----------|
  |                |                    |   lỗi tạm thời => ném exception => retry topic        |
~~~
Router commit offset sau khi publish; crash thì xử lý lại, INSERT bị bỏ qua nhờ unique.

### Xử lý lỗi & đồng thời
| Tình huống | Hành vi hệ thống | Cách test |
|---|---|---|
| Event tới 2 lần | ON CONFLICT DO NOTHING, chỉ 1 delivery | Gửi cùng record 2 lần |
| Worker chết sau khi provider nhận, trước khi ghi SENT | Kẹt SENDING; sweeper sau 5 phút đưa lại PENDING; gửi kèm idempotency key {{notificationId:channel}} | Kill worker bằng hook giữa send và update |
| Provider 503 | Retry topic, backoff x3, sau 5 lần vào DLT, DEAD | WireMock trả 503 cho 3 lần đầu |
| Provider 400 | FAILED ngay, không retry | WireMock trả 400 |
| User opt-out khi tin đang trong queue | Worker kiểm tra lại preference trước khi gửi, SKIPPED | Đổi preference rồi mới thả consumer |
| Vượt 50 SMS/giây | RateLimiter chờ tối đa 5 giây, không bỏ tin | Bơm 1.000 tin SMS, đếm request/giây ở WireMock |

### Chiến lược test
- **Unit:** render template (thiếu biến, fallback locale), phân loại lỗi tạm thời/vĩnh viễn, che số điện thoại khi log.
- **Integration (Testcontainers Kafka + PostgreSQL, WireMock):** luồng end-to-end, retry rồi thành công, vào DLT, replay.
- **Đồng thời:** 2 worker cùng nhận 1 delivery (gửi trùng record), assert WireMock chỉ nhận 1 request.
- **Load (k6 + producer script):** 500 event/giây trong 10 phút, provider lỗi ngẫu nhiên 5%; mục tiêu success ≥ 99%, lag về 0 trong 1 phút sau khi dừng bơm.

### Chạy local
~~~yaml
services:
  postgres:
    image: postgres:16-alpine
    environment: { POSTGRES_DB: notif, POSTGRES_USER: app, POSTGRES_PASSWORD: app }
    ports: ["5432:5432"]
  kafka:
    image: apache/kafka:3.7.0          # KRaft, không cần ZooKeeper
    ports: ["9092:9092"]
  mailpit:
    image: axllent/mailpit             # SMTP 1025, giao diện web 8025
    ports: ["1025:1025", "8025:8025"]
  wiremock:
    image: wiremock/wiremock:3.5.4     # giả lập SMS và push
    ports: ["8089:8080"]
~~~

### Quan sát
- Metric: {{notification.delivery}} (Counter, tag channel, result=sent|skipped|failed|dead), {{notification.delivery.latency}} (Timer, từ created_at tới SENT), {{notification.ratelimit.wait}} (Timer), consumer lag {{kafka.consumer.fetch.manager.records.lag.max}}.
- Tỉ lệ giao thành công = sent / (sent + failed + dead), không tính SKIPPED.
- Alert: success < 97% trong 15 phút; DLT nhận > 50 tin/5 phút; lag > 10.000; số SENDING kẹt > 0 quá 10 phút.

### Mở rộng lên production (5.000 event/giây)
- Tăng partition (12 đến 24) và số pod worker theo từng kênh; rate limit chuyển sang Redis token bucket dùng chung vì RateLimiter của Resilience4j chỉ tính trong 1 instance.
- Tách topic ưu tiên: OTP riêng để tin marketing tồn đọng không chặn OTP.`,
    milestones: [
      { title: 'Contract event, schema và preference', tasks: `1. Tạo project Spring Boot 3.3 (Java 21): Web, Validation, Data JPA, Flyway, Spring for Apache Kafka, Actuator, Mustache.
2. Viết {{V1__init.sql}} theo phần Schema, thêm bảng template (key, locale, channel, subject, body).
3. Định nghĩa event dạng record có {{schemaVersion}}; chỉ thêm field optional, không đổi nghĩa field cũ.
4. Viết API POST nhận request, tính {{payload_hash}} (SHA-256 của JSON đã chuẩn hoá), cùng id khác hash thì 409.
5. Viết API preference và hàm {{isAllowed(userId, channel, category)}}: TRANSACTIONAL luôn true.
6. Viết unit test cho 10 tổ hợp preference.

~~~java
public record NotificationRequested(
        int schemaVersion,                 // tăng khi đổi contract, consumer đọc được cả bản cũ
        UUID notificationId,               // khoá idempotency do producer sinh
        String userId,
        String templateKey,
        String locale,
        Category category,                 // TRANSACTIONAL | MARKETING
        Map<String, Object> params,        // chỉ dữ liệu cần render, không gửi cả entity
        Set<Channel> channels) {}
~~~`, done: `POST cùng notificationId 2 lần trả 202 cả 2 nhưng DB có 1 dòng; cùng id khác params trả 409; 10 test preference pass, gồm OTP vẫn gửi khi user tắt hết.` },
      { title: 'Outbox phía producer và router idempotent', tasks: `1. Ở order service giả lập: ghi order và outbox trong cùng {{@Transactional}}.
2. Viết relay đọc outbox theo lô 100 dòng bằng {{FOR UPDATE SKIP LOCKED}}, gửi Kafka, đánh dấu đã gửi.
3. Router consume {{notification.requested}}: INSERT notification và delivery với ON CONFLICT DO NOTHING.
4. Delivery có kênh bị opt-out thì tạo luôn với status SKIPPED.
5. Publish sang topic kênh cho mọi delivery còn PENDING, rồi mới để offset được commit.
6. Test: dừng app sau khi commit DB nhưng trước khi publish, khởi động lại, kiểm tra tin vẫn tới worker đúng 1 lần.

~~~sql
-- Relay: nhiều instance chạy song song không lấy trùng dòng
SELECT id, topic, msg_key, payload
FROM outbox
WHERE published_at IS NULL
ORDER BY id
LIMIT 100
FOR UPDATE SKIP LOCKED;
~~~
~~~java
@KafkaListener(topics = "notification.requested", groupId = "router")
@Transactional
public void route(NotificationRequested e) {
    repo.insertIfAbsent(e);                           // ON CONFLICT (id) DO NOTHING
    for (Channel ch : e.channels()) {
        String st = prefs.isAllowed(e.userId(), ch, e.category()) ? "PENDING" : "SKIPPED";
        deliveryRepo.insertIfAbsent(e.notificationId(), ch, st);
    }
    // gửi lại cả khi record này là bản lặp: worker sẽ tự bỏ qua delivery không còn PENDING
    deliveryRepo.findPending(e.notificationId())
        .forEach(d -> kafka.send("notification." + d.channel().topic(), e.userId(), d.id()));
}
~~~`, done: `Integration test: gửi cùng event 3 lần thì có 1 notification, 2 delivery; kill relay giữa lô 100 rồi chạy lại thì cả 100 event tới Kafka, consumer đếm không thiếu.` },
      { title: 'Channel worker, template và chống gửi trùng', tasks: `1. Mỗi kênh một {{@KafkaListener}} và một adapter ({{EmailAdapter}} dùng JavaMailSender tới Mailpit, SMS/push gọi WireMock bằng RestClient).
2. Claim delivery bằng UPDATE có điều kiện; 0 dòng thì bỏ qua.
3. Kiểm tra lại opt-out ngay trước khi gửi.
4. Render bằng JMustache; thiếu biến thì ném lỗi, đánh dấu FAILED TEMPLATE_ERROR.
5. Gửi kèm idempotency key {{notificationId:channel}} nếu provider hỗ trợ.
6. Viết sweeper {{@Scheduled}} đưa SENDING quá 5 phút về PENDING và publish lại.

~~~java
@Transactional
public boolean claim(long deliveryId) {
    // Chỉ 1 worker đổi được PENDING -> SENDING; worker kia nhận 0 dòng và bỏ qua
    return jdbc.update("""
        UPDATE delivery SET status = 'SENDING', attempts = attempts + 1, updated_at = now()
        WHERE id = ? AND status = 'PENDING'""", deliveryId) == 1;
}

String render(Template t, Map<String, Object> params) {
    // JMustache mặc định ném MustacheException khi thiếu biến: đúng ý, không gửi "Xin chào ,"
    return Mustache.compiler().escapeHTML(true).compile(t.body()).execute(params);
}
~~~`, done: `Gửi cùng delivery id vào topic 2 lần song song thì Mailpit chỉ có 1 email; template thiếu biến cho FAILED trong < 1 giây và không retry; sweeper khôi phục delivery kẹt trong test.` },
      { title: 'Retry có backoff, DLT và replay', tasks: `1. Phân loại lỗi: {{TransientProviderException}} (timeout, 429, 5xx) và {{PermanentProviderException}} (4xx khác).
2. Bật non-blocking retry bằng {{@RetryableTopic}}: 5 lần, backoff 10 giây nhân 3, tối đa 10 phút.
3. Lỗi vĩnh viễn đưa vào {{exclude}} để đi thẳng DLT và set FAILED.
4. {{@DltHandler}} set DEAD, ghi last_error.
5. Viết API replay: set lại PENDING, publish lại, ghi audit.
6. Test bằng WireMock scenario: 503 hai lần rồi 200.

~~~java
@RetryableTopic(
    attempts = "5",                                   // 1 lần đầu + 4 lần retry
    backoff = @Backoff(delay = 10_000, multiplier = 3.0, maxDelay = 600_000),
    exclude = PermanentProviderException.class,        // không retry lỗi vĩnh viễn
    topicSuffixingStrategy = TopicSuffixingStrategy.SUFFIX_WITH_INDEX_VALUE)
@KafkaListener(topics = "notification.sms", groupId = "sms-worker")
public void onSms(@Payload Long deliveryId) {
    smsWorker.process(deliveryId);                     // ném TransientProviderException để retry
}

@DltHandler
public void dead(Long deliveryId, @Header(KafkaHeaders.EXCEPTION_MESSAGE) String error) {
    deliveryRepo.markDead(deliveryId, error);          // support thấy lý do trong GET
}
~~~`, done: `Scenario 503, 503, 200 cho SENT với attempts = 3; 503 liên tục cho DEAD sau 5 lần và có tin trong topic -dlt; replay 20 tin DEAD thì 20 SENT, tin đã SENT không gửi lại.` },
      { title: 'Rate limit, metric và load test', tasks: `1. Mỗi provider một RateLimiter Resilience4j (50/giây cho SMS); chạy nhiều pod thì chia hạn mức hoặc dùng Redis.
2. Bọc adapter bằng circuit breaker để provider chết không làm mọi tin chờ timeout.
3. Thêm metric như phần Quan sát, dashboard Grafana.
4. Viết script producer bơm 500 event/giây; WireMock lỗi ngẫu nhiên 5%.
5. Chạy 10 phút, ghi throughput, lag, success rate, p95 latency giao nhận vào README.

~~~yaml
resilience4j:
  ratelimiter:
    instances:
      sms:
        limitForPeriod: 50          # 50 lượt mỗi chu kỳ
        limitRefreshPeriod: 1s
        timeoutDuration: 5s         # chờ tối đa 5 giây để có lượt, quá thì ném lỗi để retry
  circuitbreaker:
    instances:
      sms:
        slidingWindowSize: 50
        failureRateThreshold: 50
        waitDurationInOpenState: 30s
~~~`, done: `WireMock ghi nhận tối đa 50 request SMS/giây suốt load test; success ≥ 99% với 5% lỗi tạm thời; README có bảng kết quả và dashboard có đủ 4 metric.` }
    ],
    challenges: [
      `### Gửi trùng khi worker crash
**Triệu chứng:** khách nhận 2 email "Đơn hàng đã thanh toán" sau một lần deploy.
**Nguyên nhân gốc:** Kafka là at-least-once: worker gửi xong nhưng chết trước khi commit offset hoặc trước khi ghi SENT, nên record được xử lý lại.
**Cách 1, claim bằng UPDATE có điều kiện + trạng thái SENDING:** chặn 2 worker gửi song song; nhưng cửa sổ "đã gửi, chưa ghi SENT" vẫn còn, sweeper sẽ gửi lại.
**Cách 2, idempotency key phía provider** ({{notificationId:channel}}): đóng nốt cửa sổ đó, nhưng chỉ dùng được khi provider hỗ trợ; nếu không, ghi rõ giới hạn "tối đa 1 bản trùng khi crash đúng thời điểm".
**Chứng minh:** test kill worker giữa send và update, đếm request ở WireMock.`,
      `### Retry storm khi provider sập
**Triệu chứng:** provider SMS chết 10 phút; khi sống lại bị dội hàng chục nghìn request cùng lúc và sập tiếp.
**Nguyên nhân gốc:** retry ngay lập tức, không giới hạn, mọi tin cùng thời điểm retry.
**Cách 1, retry topic với exponential backoff + giới hạn 5 lần:** không chặn partition chính; đổi lại mất thứ tự giữa các tin (chấp nhận được với thông báo).
**Cách 2, circuit breaker + rate limiter trước adapter:** breaker mở thì không gọi provider, tin quay về retry; rate limiter giữ đều 50/giây khi hồi phục. Phức tạp hơn, phải tinh chỉnh ngưỡng.
**Chứng minh:** WireMock trả 503 trong 2 phút rồi 200, đo số request/giây không vượt 50 và mọi tin cuối cùng SENT.`,
      `### OTP bị kẹt sau tin marketing
**Triệu chứng:** đợt gửi khuyến mãi 1 triệu email, người dùng đăng nhập chờ OTP 4 phút.
**Nguyên nhân gốc:** head-of-line blocking: OTP và marketing chung topic, chung worker, chung hạn mức provider.
**Cách 1, tách topic và worker theo độ ưu tiên** ({{notification.sms.otp}}): đơn giản, OTP không bao giờ chờ marketing; tốn thêm topic và cấu hình.
**Cách 2, chia hạn mức provider** (ví dụ dành 20% cho OTP): tận dụng tài nguyên tốt hơn nhưng logic rate limit phức tạp.
**Chứng minh:** bơm 50.000 tin marketing rồi gửi 1 OTP, đo latency OTP < 5 giây.`,
      `### Opt-out không có hiệu lực ngay
**Triệu chứng:** user tắt thông báo khuyến mãi lúc 10:00 nhưng vẫn nhận tin lúc 10:05.
**Nguyên nhân gốc:** chỉ kiểm tra preference ở router, trong khi tin đã nằm trong queue hoặc retry topic từ trước.
**Cách 1, kiểm tra lại preference ở worker ngay trước khi gửi:** đúng ý người dùng, thêm 1 query mỗi tin (có thể cache Caffeine 30 giây, chấp nhận trễ 30 giây).
**Cách 2, phát event PreferenceChanged để huỷ delivery PENDING:** chủ động hơn nhưng vẫn có race với worker đang gửi, nên vẫn cần kiểm tra lại.
**Chứng minh:** đưa tin vào retry topic, đổi preference, đợi retry chạy, assert SKIPPED và WireMock không có request.`,
      `### Partition nóng
**Triệu chứng:** lag tăng ở 1 partition trong khi các partition khác rảnh.
**Nguyên nhân gốc:** key = userId và một tài khoản hệ thống (ví dụ merchant lớn) nhận rất nhiều tin.
**Cách 1, key theo notificationId:** phân tán đều nhưng mất thứ tự theo user (thường chấp nhận được).
**Cách 2, giữ key userId nhưng tách user nóng sang topic riêng:** giữ thứ tự cho user thường, phức tạp hơn.
**Chứng minh:** đo lag từng partition khi 30% tin dồn vào 1 user.`
    ],
    readme: `# Notification Platform\n\n## Mục tiêu\nDemo pipeline event-driven đa kênh với outbox, retry, DLQ, preference và deduplication. Provider được giả lập.\n\n## Chạy local\n{{docker compose up --build}} khởi động PostgreSQL, Kafka và worker.\n\n## Luồng dữ liệu\nMô tả schema event, partition key, trạng thái delivery, retry policy và điều kiện replay DLQ.\n\n## Kiểm thử\nTest outbox crash/restart, consumer duplicate, lỗi tạm thời/vĩnh viễn và opt-out.\n\n## Benchmark và vận hành\nGhi throughput, consumer count, partition count, lag, p95 tiếp nhận và thời gian giao nhận; không gộp hai loại latency.`,
    interview: {
      story: `### STAR
**Situation:** Order service gửi email/SMS đồng bộ ngay trong request thanh toán. Khi provider SMS chậm, API thanh toán p95 từ 200 ms lên 3 giây; khi provider lỗi thì khách không nhận gì và không ai biết; sau mỗi lần deploy có khoảng 0,5% email bị gửi trùng.
**Task:** Tách việc gửi thông báo khỏi luồng nghiệp vụ, đạt tỉ lệ giao ≥ 99%, 0 gửi trùng trong hệ thống, tôn trọng opt-out và đo được từng bước.
**Action:**
- Outbox trong order service, relay sang Kafka; router idempotent theo {{(notification_id, channel)}}.
- Worker từng kênh claim delivery bằng UPDATE có điều kiện, kiểm tra lại opt-out, render template có i18n.
- Non-blocking retry ({{@RetryableTopic}}, backoff 10 giây nhân 3, 5 lần), DLT và API replay có audit.
- RateLimiter 50 SMS/giây và circuit breaker theo provider; metric success rate, latency giao nhận, lag.
**Result:**
- API thanh toán p95 về 180 ms vì không còn gọi provider.
- Load test 500 event/giây, lỗi provider 5%: giao thành công 99,6%, 0 trùng; provider sập 2 phút thì tự hồi phục, không có tin mất.
- Lỗi cấu hình template phát hiện qua alert trong 5 phút thay vì khách hàng báo.

> Số liệu trên là ví dụ minh hoạ: hãy thay bằng kết quả bạn tự đo.

### Demo trong 5 phút
1. {{docker compose up -d}}, chạy app; mở Mailpit (localhost:8025).
2. POST một notification email + SMS, mở Mailpit thấy email, GET trạng thái thấy SENT.
3. POST lại cùng notificationId: vẫn 1 email.
4. Bật WireMock trả 503 cho SMS, POST tin mới, xem attempts tăng dần, tắt lỗi thì SENT.
5. Tắt email marketing của user, gửi tin marketing: SKIPPED, Mailpit không có gì.
6. Mở dashboard: success rate, lag, số tin trong DLT.`,
      questions: [
        'Outbox giải quyết failure window nào? Sao không publish Kafka ngay sau khi commit?',
        'Làm sao tránh gửi email trùng khi consumer restart?',
        'Bạn chọn partition key nào và vì sao?',
        'Vì sao dùng retry topic thay vì retry ngay trong listener?',
        'Khi nào message vào DLQ và ai được replay?',
        'Làm sao tôn trọng opt-out nếu event đã nằm trong queue?',
        'Rate limit 50 SMS/giây khi chạy 3 pod thì làm thế nào?',
        'Bạn đo "tỉ lệ giao thành công" thế nào cho đúng?'
      ],
      answers: [
        `Nếu commit DB rồi mới gọi {{kafkaTemplate.send}}, có một cửa sổ: DB đã commit nhưng app chết hoặc Kafka lỗi trước khi gửi, event mất vĩnh viễn và khách không bao giờ nhận thông báo. Đảo ngược (gửi trước, commit sau) thì có event cho đơn hàng đã rollback. Outbox biến 2 thao tác thành 1: ghi order và dòng outbox trong cùng transaction, relay đọc outbox và gửi Kafka sau. Cái giá là at-least-once: relay có thể gửi xong mà chưa kịp đánh dấu, nên gửi lại; vì vậy consumer phải idempotent. Ngoài ra thêm độ trễ vài trăm ms do relay polling; nếu cần nhanh hơn dùng CDC (Debezium) đọc WAL thay cho polling.`,
        `Ba lớp. Một: router insert notification và delivery với unique (notification_id, channel) và ON CONFLICT DO NOTHING, nên event lặp không tạo bản ghi mới. Hai: worker claim bằng {{UPDATE ... SET status='SENDING' WHERE status='PENDING'}}; chỉ một worker nhận được 1 dòng, worker kia bỏ qua. Ba: cửa sổ còn lại là "provider đã nhận nhưng chưa ghi SENT" khi worker chết; với trường hợp này tôi gửi idempotency key cho provider nếu họ hỗ trợ, nếu không thì công bố giới hạn "có thể trùng 1 lần khi crash đúng thời điểm". Exactly-once end-to-end với hệ thống bên ngoài là không thể, việc của mình là thu hẹp cửa sổ và đo nó.`,
        `Tôi chọn userId cho topic requested: các thông báo của cùng một người được xử lý theo thứ tự, ví dụ "đơn đã đặt" không tới sau "đơn đã giao". Trade-off là partition nóng nếu một user nhận rất nhiều tin, như tài khoản merchant. Tôi đo phân bố key trước bằng dữ liệu thật; nếu có user nóng thì tách sang topic riêng hoặc dùng notificationId làm key cho loại tin không cần thứ tự. Lưu ý thứ tự chỉ đúng trong một partition, và retry topic phá thứ tự (tin lỗi đi vòng retry trong khi tin sau đã gửi), nên với thông báo tôi chấp nhận "gần đúng thứ tự"; nếu nghiệp vụ cần thứ tự tuyệt đối thì phải dùng blocking retry và chấp nhận chặn partition.`,
        `Retry ngay trong listener (blocking, {{DefaultErrorHandler}} + BackOff) giữ record ở partition: trong lúc chờ backoff 10 phút, mọi tin khác cùng partition đứng chờ, lag tăng, và nếu thời gian chờ vượt {{max.poll.interval.ms}} thì consumer bị đá khỏi group. Retry topic ({{@RetryableTopic}}) chuyển record lỗi sang topic -retry-0, -retry-1 với thời điểm xử lý trễ dần; topic chính chạy tiếp. Đổi lại, mất thứ tự và có thêm nhiều topic phải giám sát. Với thông báo, không chặn hàng nghìn tin khác vì một tin lỗi quan trọng hơn thứ tự. Lỗi vĩnh viễn (400, số điện thoại sai) tôi loại khỏi retry bằng {{exclude}} để không phí 5 lần thử.`,
        `Vào DLT khi: lỗi tạm thời nhưng đã hết 5 lần thử (khoảng 7 phút theo backoff), hoặc lỗi không phân loại được (deserialization). Lỗi vĩnh viễn như email sai định dạng thì đánh FAILED, không cần replay. Replay là thao tác có rủi ro (gửi lại hàng nghìn tin) nên chỉ role NOTIF_ADMIN, qua API nhận danh sách delivery id hoặc khoảng thời gian, có dry-run hiển thị số lượng, và ghi audit ai làm, lúc nào, bao nhiêu tin. Replay chỉ đổi DEAD về PENDING; tin đã SENT không bị gửi lại vì worker claim theo PENDING. Tôi cũng bỏ qua tin quá cũ (OTP quá 5 phút là vô nghĩa) bằng TTL theo template.`,
        `Tôi kiểm tra preference hai lần: ở router khi tạo delivery và ở worker ngay trước khi gọi provider. Lần thứ hai là quan trọng: tin có thể nằm trong retry topic 10 phút, trong lúc đó user tắt thông báo. Worker đọc preference mới nhất; nếu đã tắt thì SKIPPED và ghi lý do. Chi phí là 1 query mỗi tin; tải cao thì cache Caffeine 30 giây, tức chấp nhận trễ tối đa 30 giây, và tôi ghi rõ con số này. Tin TRANSACTIONAL như OTP, cảnh báo bảo mật không cho opt-out theo quy định, nên preference chỉ áp cho MARKETING. Test: đưa tin vào retry, đổi preference, assert WireMock không nhận request.`,
        `RateLimiter của Resilience4j đếm trong bộ nhớ một JVM, nên 3 pod mỗi pod 50/giây thành 150/giây và provider trả 429. Cách đơn giản: chia hạn mức theo số pod (mỗi pod 16/giây) và cố định số pod worker SMS; nhược điểm là khi scale phải đổi cấu hình và pod rảnh không cho pod bận mượn lượt. Cách chuẩn hơn: token bucket dùng chung trong Redis bằng Lua script (lấy token nguyên tử), mọi pod cùng tiêu một bucket 50/giây. Đổi lại mỗi tin thêm 1 round-trip Redis (khoảng 1 ms) và Redis thành phụ thuộc; khi Redis lỗi tôi fallback về hạn mức cục bộ chia theo pod. Dù cách nào vẫn xử lý 429 của provider như lỗi tạm thời để retry.`,
        `Phải định nghĩa mẫu số rõ ràng. Tôi tính theo delivery: thành công = SENT, thất bại = FAILED + DEAD, còn SKIPPED (opt-out) không tính vì đó là hành vi đúng. Tỉ lệ = sent / (sent + failed + dead) theo cửa sổ thời gian và theo kênh, vì gộp chung thì email tốt che SMS tệ. Tôi tách latency tiếp nhận (API 202) khỏi latency giao nhận (created_at tới SENT), vì hai số này trả lời hai câu hỏi khác nhau. Lưu ý: SENT chỉ có nghĩa là provider đã nhận; giao tới máy người dùng cần webhook delivery report của provider, nếu có thì thêm trạng thái DELIVERED. Alert khi tỉ lệ dưới 97% trong 15 phút theo từng kênh.`
      ]
    },
    related: ['lesson-spring-001', 'lesson-concurrency-001', 'design-006', 'microservices-005', 'microservices-022', 'microservices-020', 'microservices-029', 'microservices-009', 'api-011', 'spring-016']
  },
  {
    id: 'proj-reconciliation', title: 'Đối soát giao dịch cuối ngày', level: 'lead', weeks: 8,
    skills: ['Spring Batch', 'Java', 'PostgreSQL', 'S3', 'AWS', 'Observability', 'Testcontainers'],
    pitch: `Xử lý file giao dịch lớn có checkpoint, restart và báo cáo sai lệch. Dự án thể hiện năng lực batch và thiết kế vận hành thực tế, đặc biệt khi dữ liệu phải có thể giải thích, chạy lại cho cùng kết quả và chịu được 10 triệu dòng mỗi đêm.`,
    requirements: `### User story
1. **Nhận file:** mỗi sáng đối tác đẩy {{settlement_20270115.csv}} lên S3; job tự chạy lúc 06:00.
  Chấp nhận: tính SHA-256 khi tải về; file cùng checksum đã xử lý thì bỏ qua, không nạp trùng; dòng trailer (tổng số dòng, tổng tiền) phải khớp nội dung, sai thì cả file FAILED.
2. **Dòng lỗi:** amount không phải số, ngày sai định dạng, thiếu mã giao dịch.
  Chấp nhận: dòng lỗi vào {{recon_invalid}} kèm số dòng và lý do, job chạy tiếp; quá 1.000 dòng lỗi thì job FAILED (file có vấn đề hệ thống, không đối soát nửa vời).
3. **Matching:** ghép dòng file với giao dịch nội bộ theo khoá {{partner_ref}}.
  Chấp nhận: lệch tiền vượt dung sai (VND 0 đồng, USD 0,01) là AMOUNT_MISMATCH; đối tác SUCCESS mà nội bộ FAILED/PENDING là STATUS_MISMATCH; chỉ có ở file là MISSING_INTERNAL; chỉ có nội bộ là MISSING_PARTNER; file có 2 dòng cùng ref là DUPLICATE.
4. **Biên ngày:** giao dịch nội bộ lúc 23:59:58 có thể nằm trong file ngày sau.
  Chấp nhận: MISSING_PARTNER trong 10 phút cuối ngày được xếp PENDING_NEXT_DAY và chỉ thành lệch thật nếu file ngày sau cũng không có.
5. **Báo cáo:** ops nhận file chênh lệch và bảng tổng hợp.
  Chấp nhận: tổng tiền file = tổng MATCHED + các nhóm lệch phía đối tác (control total); báo cáo CSV lên S3 và tái tạo được từ run id.
6. **Restart:** job chết ở dòng 6 triệu.
  Chấp nhận: chạy lại tiếp từ chunk đã commit cuối, không nạp trùng dòng nào.
7. **Chạy lại có chủ đích:** sau khi sửa dữ liệu nội bộ, ops chạy lại ngày D.
  Chấp nhận: tạo run version mới, kết quả version cũ giữ nguyên; audit ghi ai chạy, lúc nào, lý do.
8. **Xử lý chênh lệch:** ops đánh dấu một dòng lệch là RESOLVED kèm ghi chú.
  Chấp nhận: bắt buộc ghi chú; audit ai sửa; không được sửa số tiền trong kết quả.

### Phi chức năng
- 10 triệu dòng (khoảng 1,2 GB CSV) hoàn tất < 30 phút trên laptop 8 core, PostgreSQL 16 trong Docker.
- Heap ≤ 1 GB và không tăng theo kích thước file (streaming).
- Nạp staging ≥ 20.000 dòng/giây; bước matching set-based < 5 phút.
- Xác định: cùng file + cùng dữ liệu nội bộ cho cùng kết quả, đếm và tổng tiền khớp tuyệt đối.

### Ngoài phạm vi
- Không kết nối SFTP/ngân hàng thật: MinIO thay S3, file sinh bằng script.
- Không tự động sửa giao dịch nội bộ, chỉ báo cáo; không quy đổi tỷ giá; không UI (API + file CSV).`,
    architecture: `~~~text
S3 (MinIO) -> tải về đĩa tạm + SHA-256 -> recon_file
Spring Batch job (tham số: fileId, version)
  step 1 load:    FlatFileItemReader -> validate/chuẩn hoá -> JdbcBatchItemWriter -> stg_partner_txn
  step 2 match:   1 câu SQL FULL OUTER JOIN stg với payment_txn -> recon_result
  step 3 report:  JdbcCursorItemReader -> CSV -> S3, cập nhật summary
PostgreSQL: metadata Spring Batch (checkpoint), staging, kết quả, audit
~~~
Đọc streaming theo chunk, checkpoint nằm trong cùng transaction với dữ liệu chunk nên restart không trùng. Matching để PostgreSQL làm bằng hash join thay vì vòng lặp Java. Trên AWS: ECS task theo lịch (EventBridge Scheduler), IAM role chỉ đọc đúng prefix S3, bucket mã hoá SSE-KMS.`,
    design: `### Schema DB (PostgreSQL 16)
~~~sql
CREATE TABLE recon_file (
  id            BIGSERIAL PRIMARY KEY,
  partner       VARCHAR(32) NOT NULL,
  business_date DATE NOT NULL,
  s3_key        VARCHAR(512) NOT NULL,
  sha256        CHAR(64) NOT NULL,
  trailer_rows  BIGINT NOT NULL,
  trailer_total NUMERIC(20,2) NOT NULL,
  UNIQUE (partner, sha256)                 -- file gửi lại y hệt bị bỏ qua
);
CREATE TABLE recon_run (
  id           BIGSERIAL PRIMARY KEY,
  file_id      BIGINT NOT NULL REFERENCES recon_file(id),
  version      INT NOT NULL,
  triggered_by VARCHAR(64) NOT NULL,
  reason       VARCHAR(300),
  status       VARCHAR(16) NOT NULL,
  UNIQUE (file_id, version)
);
-- Staging chia partition theo ngày: xoá dữ liệu cũ bằng DROP partition, không DELETE 10 triệu dòng
CREATE TABLE stg_partner_txn (
  business_date DATE NOT NULL,
  file_id     BIGINT NOT NULL,
  line_no     BIGINT NOT NULL,
  partner_ref VARCHAR(64) NOT NULL,
  amount      NUMERIC(20,2) NOT NULL,
  currency    CHAR(3) NOT NULL,
  status      VARCHAR(16) NOT NULL,       -- đã chuẩn hoá: SUCCESS -> COMPLETED
  txn_time    TIMESTAMPTZ NOT NULL,
  is_dup      BOOLEAN NOT NULL DEFAULT false, -- dòng lặp ref thứ 2 trở đi
  PRIMARY KEY (business_date, file_id, line_no)  -- restart ghi lại chunk cũ: ON CONFLICT DO NOTHING
) PARTITION BY RANGE (business_date);
CREATE TABLE stg_2027_01 PARTITION OF stg_partner_txn
  FOR VALUES FROM ('2027-01-01') TO ('2027-02-01');  -- job tạo trước partition tháng sau
CREATE TABLE recon_result (
  id BIGSERIAL PRIMARY KEY,
  run_id BIGINT NOT NULL REFERENCES recon_run(id),
  partner_ref VARCHAR(64) NOT NULL,
  result VARCHAR(20) NOT NULL,
  partner_amount NUMERIC(20,2), internal_amount NUMERIC(20,2),
  resolved_by VARCHAR(64), note VARCHAR(500)
);
CREATE INDEX ix_result_run ON recon_result (run_id, result);
~~~
- Không index {{partner_ref}} trên staging: matching đọc cả file, hash join nhanh hơn; index chỉ làm chậm lúc nạp.
- Bảng nội bộ {{payment_txn}} cần index {{(partner, created_at)}} để lọc đúng 1 ngày.

### API
| Method | Path | Request | Response | Mã lỗi |
|---|---|---|---|---|
| POST | /api/recon/files | {partner, s3Key, businessDate} | 202 {fileId, runId} | 409 checksum đã xử lý |
| POST | /api/recon/runs/{fileId}/rerun | {reason} | 202 {runId, version} | 409 đang có run chạy |
| GET | /api/recon/runs/{id} | - | 200 {status, summary} | 404 |
| PATCH | /api/recon/results/{id} | {note} | 200 | 400 thiếu note, 403 |

~~~json
GET /api/recon/runs/42
{ "runId": 42, "version": 1, "status": "COMPLETED", "fileRows": 10000000,
  "summary": { "MATCHED": 9998710, "AMOUNT_MISMATCH": 112, "STATUS_MISMATCH": 41,
               "MISSING_INTERNAL": 1103, "MISSING_PARTNER": 25, "DUPLICATE": 9 },
  "controlTotalOk": true, "reportKey": "reports/2027-01-15/run-42.csv" }
~~~

### Luồng chính
~~~text
Scheduler   ReconService       S3        Spring Batch           PostgreSQL
  |-- 06:00 ->|-- GET object --->|              |                    |
  |           |<- stream (tính SHA-256, ghi đĩa tạm)                 |
  |           |-- INSERT recon_file (unique partner+sha256) -------->|
  |           |   trùng => bỏ qua, ghi log                           |
  |           |-- launch(fileId, version=1) --->|                    |
  |           |                  |  load: mỗi chunk 5.000 dòng      |
  |           |                  |   BEGIN; INSERT staging; UPDATE checkpoint; COMMIT
  |           |                  |  match: DELETE result của run; INSERT ... SELECT FULL JOIN
  |           |                  |  report: cursor -> CSV -> S3     |
~~~

### Xử lý lỗi & đồng thời
| Tình huống | Hành vi | Cách test |
|---|---|---|
| Process chết giữa chunk | Chunk đang dở rollback; restart cùng tham số chạy tiếp từ chunk đã commit | Processor ném lỗi ở dòng 60.001 lần đầu |
| File gửi lại y hệt | Unique (partner, sha256) chặn | Upload 2 lần |
| Đối tác gửi file đã sửa cùng ngày | Checksum khác: file mới, run mới, cảnh báo ops | Sửa 1 dòng rồi upload |
| Trailer không khớp | FAILED trước khi matching | File thiếu 10 dòng cuối |
| 2 người cùng bấm rerun | Unique (file_id, version) + kiểm tra run đang chạy | 2 request song song |
| Step match chạy lại | DELETE rồi INSERT trong 1 transaction nên idempotent | Chạy step 2 lần, đếm kết quả |

### Chiến lược test
- **Unit:** parser từng định dạng lỗi, chuẩn hoá status, so sánh tiền bằng {{BigDecimal.compareTo}} (không dùng equals vì 10.0 khác 10.00).
- **Integration (Testcontainers PostgreSQL + MinIO):** file 10.000 dòng tạo đủ 6 nhóm kết quả với số lượng biết trước.
- **Restart:** {{JobLauncherTestUtils}} chạy lần 1 lỗi, lần 2 thành công; assert số dòng staging bằng số dòng file.
- **Hiệu năng:** sinh file 10 triệu dòng bằng script, đo thời gian từng step, heap ({{jcmd GC.heap_info}}) và EXPLAIN ANALYZE câu matching.

### Chạy local
~~~yaml
services:
  postgres:
    image: postgres:16-alpine
    environment: { POSTGRES_DB: recon, POSTGRES_USER: app, POSTGRES_PASSWORD: app }
    command: ["postgres", "-c", "work_mem=256MB", "-c", "max_wal_size=4GB"]
    ports: ["5432:5432"]
  minio:
    image: minio/minio
    command: ["server", "/data", "--console-address", ":9001"]
    environment: { MINIO_ROOT_USER: minio, MINIO_ROOT_PASSWORD: minio123 }
    ports: ["9000:9000", "9001:9001"]
~~~

### Quan sát
- Metric có sẵn của Spring Batch: {{spring.batch.job}}, {{spring.batch.step}}, {{spring.batch.chunk.write}}, {{spring.batch.item.read}}.
- Metric tự thêm: {{recon.result}} (Counter, tag result), {{recon.skip}} (Counter, tag reason), {{recon.amount.diff}} (tổng tiền lệch).
- Alert: job chưa COMPLETED lúc 07:30; tỉ lệ lệch > 0,5%; control total sai; skip > 0 ở đối tác thường không có lỗi.

### Mở rộng (x10: 100 triệu dòng hoặc 20 đối tác)
- Mỗi file một partition của step (partitioned step, {{TaskExecutorPartitionHandler}}); nhiều máy thì remote partitioning.
- Nạp bằng {{COPY}} ({{CopyManager}} của driver PostgreSQL) thay INSERT, nhanh hơn nhiều lần; validate trước khi COPY.
- Đọc {{payment_txn}} từ read replica.`,
    milestones: [
      { title: 'Định dạng file, checksum và metadata', tasks: `1. Tạo project Spring Boot 3.3 (Java 21): Batch, JDBC, Flyway, Actuator, AWS SDK v2 (s3).
2. Viết đặc tả CSV: UTF-8, delimiter dấu phẩy, amount dấu chấm thập phân, thời gian ISO-8601 có offset, dòng cuối {{TRAILER,rows,total}}.
3. Viết script sinh file giả 10.000 và 10 triệu dòng, có cài sẵn lệch tiền, thiếu, trùng.
4. Tải file từ S3 về đĩa tạm theo stream, vừa ghi vừa tính SHA-256.
5. INSERT recon_file; vi phạm unique thì bỏ qua và log.
6. Test file trùng, file thiếu trailer, file trailer sai tổng.

~~~java
// Tải theo stream: heap không phụ thuộc kích thước file
Path download(String bucket, String key, Path dir) throws Exception {
    MessageDigest sha = MessageDigest.getInstance("SHA-256");
    Path target = dir.resolve(Path.of(key).getFileName());
    try (InputStream in = s3.getObject(b -> b.bucket(bucket).key(key));
         OutputStream out = Files.newOutputStream(target)) {
        byte[] buf = new byte[64 * 1024];
        for (int n; (n = in.read(buf)) > 0; ) {
            sha.update(buf, 0, n);                    // tính checksum trong cùng một lần đọc
            out.write(buf, 0, n);
        }
    }
    this.lastSha256 = HexFormat.of().formatHex(sha.digest());
    return target;
}
~~~`, done: `Upload cùng file 2 lần thì chỉ 1 recon_file; file 1,2 GB tải về với heap < 100 MB; 3 test file hỏng đều FAILED với lý do rõ ràng.` },
      { title: 'Step load: chunk, skip, restart', tasks: `1. Khai báo job với tham số định danh {{fileId}} và {{version}}.
2. {{FlatFileItemReader}} đọc file tạm, bỏ dòng header, mapper sang record {{PartnerLine}}.
3. Processor validate và chuẩn hoá (status, currency, thời gian sang UTC); dòng lỗi ném {{ValidationException}}.
4. Writer {{JdbcBatchItemWriter}} với INSERT ... ON CONFLICT DO NOTHING; JDBC URL thêm {{reWriteBatchedInserts=true}}.
5. Fault tolerant: skip parse/validation tối đa 1.000 dòng; SkipListener ghi recon_invalid.
6. Test restart: lần 1 lỗi ở dòng 60.001, lần 2 chạy cùng tham số.

~~~java
@Bean
Step loadStep(JobRepository repo, PlatformTransactionManager tx,
              FlatFileItemReader<PartnerLine> reader, JdbcBatchItemWriter<StagingRow> writer) {
    return new StepBuilder("load", repo)
        .<PartnerLine, StagingRow>chunk(5_000, tx)   // 1 transaction = 5.000 dòng + checkpoint
        .reader(reader)                              // lưu số dòng đã đọc vào ExecutionContext
        .processor(validator)
        .writer(writer)
        .faultTolerant()
        .skip(FlatFileParseException.class)
        .skip(ValidationException.class)
        .skipLimit(1_000)                            // quá 1.000 dòng lỗi thì FAILED
        .listener(invalidRowListener)                // ghi dòng lỗi + lý do vào recon_invalid
        .build();
}
~~~`, done: `Restart sau lỗi ở dòng 60.001: staging có đúng 10.000.000 dòng, không trùng; file 1.500 dòng lỗi cho job FAILED; nạp 10 triệu dòng ≥ 20.000 dòng/giây.` },
      { title: 'Step match: quy tắc đối soát bằng SQL', tasks: `1. Viết tasklet chạy trong 1 transaction: DELETE kết quả cũ của run rồi INSERT ... SELECT.
2. Tính khung ngày theo múi giờ Asia/Ho_Chi_Minh bằng {{ZonedDateTime}} rồi đổi sang Instant.
3. Xử lý DUPLICATE trước: dòng có cùng ref, dòng thứ 2 trở đi ghi DUPLICATE và loại khỏi join.
4. Quy tắc PENDING_NEXT_DAY cho MISSING_PARTNER 10 phút cuối ngày.
5. Chạy EXPLAIN ANALYZE, xác nhận Hash Full Join và không spill đĩa quá nhiều.
6. Test 6 nhóm với file 10.000 dòng có đáp án biết trước.

~~~sql
INSERT INTO recon_result (run_id, partner_ref, result, partner_amount, internal_amount)
SELECT :runId, COALESCE(p.partner_ref, i.ref),
       CASE WHEN i.ref IS NULL THEN 'MISSING_INTERNAL'
            WHEN p.partner_ref IS NULL THEN 'MISSING_PARTNER'
            WHEN abs(p.amount - i.amount) > :tolerance THEN 'AMOUNT_MISMATCH'
            WHEN p.status <> i.status THEN 'STATUS_MISMATCH'
            ELSE 'MATCHED' END,
       p.amount, i.amount
FROM (SELECT * FROM stg_partner_txn
      WHERE business_date = :day AND file_id = :fileId AND NOT is_dup) p
FULL OUTER JOIN
     (SELECT ref, amount, status FROM payment_txn
      WHERE partner = :partner AND created_at >= :dayStart AND created_at < :dayEnd) i
  ON i.ref = p.partner_ref;
~~~`, done: `File mẫu 10.000 dòng cho đúng số lượng từng nhóm như đáp án; chạy step match 2 lần cho cùng kết quả; 10 triệu dòng match < 5 phút, có ảnh EXPLAIN ANALYZE trong README.` },
      { title: 'Báo cáo, control total và audit', tasks: `1. Step report đọc kết quả bằng {{JdbcCursorItemReader}} (fetchSize 5.000) ghi CSV, upload S3 theo key có run id.
2. Tính control total: tổng tiền file phải bằng tổng các nhóm phía đối tác.
3. API rerun tạo version mới (job parameters mới), ghi audit người bấm và lý do.
4. API resolve chỉ cho ghi note, không sửa số tiền; audit mọi thay đổi.
5. Test: rerun giữ nguyên kết quả version cũ.

~~~java
public long rerun(long fileId, String reason, String user) {
    int version = runRepo.nextVersion(fileId);        // unique (file_id, version) chặn bấm trùng
    long runId = runRepo.insert(fileId, version, user, reason);
    audit.log(user, "RERUN", "file=" + fileId + ", version=" + version + ", reason=" + reason);
    JobParameters params = new JobParametersBuilder()
        .addLong("fileId", fileId)
        .addLong("version", (long) version)          // tham số mới => JobInstance mới
        .addLong("runId", runId, false)               // không định danh, chỉ để truyền
        .toJobParameters();
    jobLauncher.run(reconJob, params);
    return runId;
}
~~~`, done: `Control total đúng trên 3 file mẫu và báo sai khi cố tình xoá 1 dòng staging; rerun tạo version 2, version 1 vẫn truy vấn được; mọi rerun/resolve có dòng audit.` },
      { title: 'AWS, tải lớn và vận hành', tasks: `1. Đóng gói Docker, chạy ECS Fargate task theo lịch bằng EventBridge Scheduler.
2. IAM role: {{s3:GetObject}} chỉ trên prefix {{incoming/}}, {{s3:PutObject}} chỉ trên {{reports/}}.
3. Bucket bật SSE-KMS, lifecycle xoá file gốc sau 400 ngày (theo chính sách lưu trữ bạn đặt ra).
4. Chạy file 10 triệu dòng, đo thời gian từng step, heap, I/O PostgreSQL.
5. Thử tăng chunk 1.000, 5.000, 20.000 và ghi bảng so sánh.
6. Thêm metric, alert như phần Quan sát; viết runbook "job FAILED lúc 6 giờ sáng".

~~~json
{ "Version": "2012-10-17",
  "Statement": [
    { "Effect": "Allow", "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::recon-bucket/incoming/*" },
    { "Effect": "Allow", "Action": "s3:PutObject",
      "Resource": "arn:aws:s3:::recon-bucket/reports/*" } ] }
~~~`, done: `10 triệu dòng hoàn tất < 30 phút, heap tối đa < 1 GB; README có bảng chunk size và thời gian; runbook có các bước kiểm tra, restart và báo cáo.` }
    ],
    challenges: [
      `### Restart gây nạp trùng
**Triệu chứng:** job chết lúc 06:20, chạy lại thì staging có 12 triệu dòng cho file 10 triệu, báo cáo lệch hàng loạt.
**Nguyên nhân gốc:** tự viết vòng lặp đọc file và insert, lưu tiến độ ở chỗ khác transaction ghi dữ liệu; hoặc chạy lại từ đầu mà không xoá.
**Cách 1, chunk của Spring Batch:** dữ liệu chunk và ExecutionContext (số dòng đã đọc) commit cùng một transaction trên cùng DB, restart đọc tiếp từ dòng đã commit. Đơn giản, nhưng cần JobRepository chung DB với staging.
**Cách 2, khoá tự nhiên (file_id, line_no) + ON CONFLICT DO NOTHING:** chạy lại từ đầu vẫn không trùng, không phụ thuộc framework; đổi lại tốn thời gian đọc lại phần đã nạp.
Tôi dùng cả hai: lớp 2 là lưới an toàn.
**Chứng minh:** test ném lỗi ở dòng 60.001 rồi restart, đếm staging bằng số dòng file.`,
      `### So sánh tiền sai
**Triệu chứng:** 30.000 dòng báo AMOUNT_MISMATCH dù số tiền nhìn giống nhau.
**Nguyên nhân gốc:** parse amount bằng double (0,1 + 0,2 khác 0,3), hoặc so sánh BigDecimal bằng equals (10.0 khác 10.00 vì khác scale), hoặc file dùng dấu phẩy thập phân.
**Cách 1, parse thẳng sang BigDecimal với định dạng cố định, so bằng compareTo:** chính xác, đơn giản.
**Cách 2, lưu số nguyên đơn vị nhỏ nhất** (đồng, cent) dạng BIGINT: nhanh, không lo scale; phải biết số chữ số thập phân của từng currency.
**Chứng minh:** unit test 10.0 với 10.00 là khớp; file có "1.234,50" bị đưa vào invalid với lý do định dạng.`,
      `### Giao dịch ở biên ngày
**Triệu chứng:** mỗi ngày khoảng 50 dòng MISSING_PARTNER, hôm sau tự xuất hiện trong file của đối tác.
**Nguyên nhân gốc:** nội bộ chốt ngày theo giờ Việt Nam, đối tác chốt theo thời điểm họ xử lý (có thể trễ vài giây đến vài phút), hoặc theo UTC.
**Cách 1, trạng thái PENDING_NEXT_DAY cho giao dịch sát nửa đêm:** ít báo động giả; cần job ngày sau đối chiếu lại các dòng này.
**Cách 2, cửa sổ chồng lấn** (lấy nội bộ từ 23:50 ngày trước tới 00:10 ngày sau, ghép theo ref): bắt được ngay, nhưng phải tránh một giao dịch bị tính ở hai ngày.
**Chứng minh:** fixture có giao dịch 23:59:58 nội bộ nằm trong file ngày sau, kết quả cuối cùng là MATCHED sau 2 ngày.`,
      `### Matching 10 triệu dòng quá chậm
**Triệu chứng:** bước matching chạy 2 giờ, CPU thấp, đĩa đầy file tạm.
**Nguyên nhân gốc:** match bằng vòng lặp Java gọi 1 query cho mỗi dòng (10 triệu round-trip), hoặc hash join tràn đĩa vì work_mem nhỏ.
**Cách 1, set-based SQL FULL OUTER JOIN:** 1 câu lệnh, PostgreSQL dùng hash join; tăng work_mem cho riêng session batch ({{SET LOCAL work_mem = '512MB'}}). Nhanh, nhưng 1 transaction lớn, giữ snapshot lâu.
**Cách 2, chia bucket** (ví dụ theo ký tự cuối của ref) và match từng bucket: transaction nhỏ hơn, chạy song song được; phức tạp hơn, phải đảm bảo hai phía cùng hàm chia bucket.
**Chứng minh:** EXPLAIN (ANALYZE, BUFFERS) trước/sau, ghi thời gian và số batch hash join.`,
      `### Chạy lại làm mất dấu vết audit
**Triệu chứng:** ops chạy lại ngày D, kết quả cũ bị ghi đè, kiểm toán hỏi "vì sao hôm qua báo 112 dòng lệch, hôm nay còn 3" thì không trả lời được.
**Nguyên nhân gốc:** kết quả gắn với ngày chứ không gắn với lần chạy.
**Cách 1, run version bất biến:** mỗi lần chạy lại là version mới, kết quả cũ giữ nguyên; tốn thêm dung lượng.
**Cách 2, chỉ lưu diff giữa các version:** tiết kiệm dung lượng nhưng truy vấn và giải thích phức tạp.
**Chứng minh:** test rerun, truy vấn cả 2 version, audit có người bấm và lý do.`
    ],
    readme: `# Daily Reconciliation Batch\n\n## Mục tiêu\nBatch đối chiếu file giao dịch với dữ liệu nội bộ, hỗ trợ restart, exception report và audit. Chỉ dùng dữ liệu tổng hợp.\n\n## Chạy local\n{{docker compose up --build}} khởi động PostgreSQL và object store local; nạp fixture có checksum.\n\n## Quy trình\nMô tả schema version, staging, chunk/checkpoint, quy tắc match và trạng thái run.\n\n## Kiểm thử và benchmark\nTest restart giữa file, duplicate, malformed row, timezone và tổng tiền. Báo kích thước file, chunk size, heap, thời gian và execution plan.\n\n## AWS\nJob dùng IAM role tối thiểu để đọc S3; bucket mã hóa, policy retention và audit truy cập được ghi rõ.`,
    interview: {
      story: `### STAR
**Situation:** Đội vận hành đối soát file ngân hàng bằng Excel và một script đọc cả file vào bộ nhớ. File lên 8 triệu dòng thì script OutOfMemory; mỗi lần lỗi phải chạy lại từ đầu mất 3 giờ, và không giải thích được vì sao số lệch hôm nay khác hôm qua.
**Task:** Xây job đối soát chạy xong trước 07:00 với 10 triệu dòng, restart được, kết quả xác định và có audit cho kiểm toán.
**Action:**
- Tải file theo stream, SHA-256 để chống nạp trùng, kiểm tra trailer trước khi đối soát.
- Spring Batch chunk 5.000 dòng, skip dòng lỗi có giới hạn, staging có khoá (file_id, line_no) để restart không trùng.
- Matching bằng một câu SQL FULL OUTER JOIN thay vì vòng lặp Java; 6 nhóm kết quả, quy tắc biên ngày.
- Run version bất biến, control total, báo cáo CSV lên S3, metric và alert 07:30.
**Result:**
- 10 triệu dòng từ 3 giờ (khi chạy được) xuống 22 phút; heap tối đa 600 MB bất kể kích thước file.
- Restart sau lỗi tiếp tục trong vài giây, không nạp lại phần đã xong.
- Báo động giả do biên ngày giảm từ khoảng 50 dòng/ngày xuống dưới 5.

> Số liệu trên là ví dụ minh hoạ: hãy thay bằng kết quả bạn tự đo.

### Demo trong 5 phút
1. {{docker compose up -d}}, mở MinIO console, upload file mẫu 10.000 dòng.
2. Gọi POST /api/recon/files, xem log job từng step.
3. GET run: summary 6 nhóm và controlTotalOk; mở file CSV báo cáo trên MinIO.
4. Upload lại cùng file: 409, không chạy.
5. Bật cờ lỗi ở dòng 6.001, chạy, thấy FAILED; tắt cờ, restart, đếm staging đúng 10.000.
6. Mở bảng benchmark 10 triệu dòng và ảnh EXPLAIN trong README.`,
      questions: [
        'Checkpoint và transaction cần phối hợp thế nào để restart không nạp trùng?',
        'Bạn xử lý file gửi lại cùng nội dung, hoặc gửi lại bản đã sửa ra sao?',
        'Vì sao không đọc toàn bộ CSV vào memory rồi so sánh bằng HashMap?',
        'Vì sao matching bằng SQL thay vì Java?',
        'Skip policy: bao nhiêu dòng lỗi thì nên dừng cả job?',
        'Làm sao xác định sai lệch do timezone hay do tiền thật sự lệch?',
        'Bạn thiết kế rerun và audit quyền thao tác thế nào?',
        'Khi lên 100 triệu dòng mỗi ngày bạn đổi gì?'
      ],
      answers: [
        `Trong Spring Batch, mỗi chunk là một transaction: đọc 5.000 dòng, xử lý, ghi staging, rồi cập nhật ExecutionContext của step (reader lưu số dòng đã đọc) vào bảng metadata, tất cả commit cùng lúc. Vì JobRepository và staging nằm chung một PostgreSQL, hoặc cả hai cùng thành công, hoặc cả hai cùng rollback. Khi restart với cùng tham số định danh, Spring Batch tìm execution FAILED, nạp ExecutionContext và reader bỏ qua số dòng đã commit. Nếu staging ở DB khác JobRepository thì mất bảo đảm này, cần 2PC hoặc idempotent writer. Tôi thêm lớp an toàn thứ hai: khoá chính (business_date, file_id, line_no) và ON CONFLICT DO NOTHING, nên kể cả chạy lại từ đầu cũng không nhân đôi.`,
        `Khi tải về tôi tính SHA-256 trên nội dung; bảng recon_file có unique (partner, sha256), nên file y hệt gửi lần 2 bị bỏ qua và trả 409, không tốn tài nguyên. Không dùng tên file làm khoá vì đối tác hay gửi lại cùng tên với nội dung sửa. Nếu checksum khác nhưng cùng partner và ngày, đó là bản sửa: tôi tạo file mới, run mới, và cảnh báo ops vì cần biết đối tác đã đổi gì, có thể so 2 version kết quả. Không ghi đè kết quả cũ, vì kiểm toán cần biết hôm đó hệ thống đã báo gì. Trailer với số dòng và tổng tiền giúp phát hiện file bị cắt cụt khi truyền, trường hợp checksum không bắt được vì đối tác tính checksum trên file đã cắt.`,
        `10 triệu dòng, mỗi object Java vài trăm byte (String, BigDecimal, header object), dễ lên 3 đến 5 GB heap, GC dừng lâu và OOM khi file lớn thêm. Quan trọng hơn: không restart được, chết ở phút 50 thì làm lại từ đầu. Streaming theo chunk giữ heap cố định (5.000 dòng mỗi lúc) bất kể file 1 triệu hay 100 triệu dòng. Phía nội bộ cũng có 10 triệu giao dịch; nạp vào HashMap là thêm vài GB nữa. Đẩy cả hai vào PostgreSQL và để DB join thì DB tự quản lý bộ nhớ, tràn thì ghi đĩa chứ không chết. Trade-off: tốn I/O ghi staging, nhưng staging còn là bằng chứng để audit và debug.`,
        `Vòng lặp Java cho mỗi dòng file gọi 1 query tìm giao dịch nội bộ nghĩa là 10 triệu round-trip, mỗi cái khoảng 0,5 ms là gần 1,5 giờ chỉ riêng mạng. Một câu INSERT ... SELECT với FULL OUTER JOIN cho PostgreSQL chọn hash join: đọc tuần tự hai phía một lần, build hash table phía nhỏ hơn, chạy vài phút. FULL OUTER JOIN cho ra cả 4 trường hợp (khớp, lệch, chỉ bên trái, chỉ bên phải) trong một lần, thay vì hai lần anti-join. Trade-off: logic nằm trong SQL khó unit test hơn, nên tôi viết integration test với file 10.000 dòng có đáp án; transaction lớn giữ snapshot lâu, nên chạy ngoài giờ cao điểm hoặc trên replica, và kiểm tra EXPLAIN ANALYZE để chắc không có nested loop.`,
        `Skip là để chịu lỗi lẻ tẻ, không phải để che lỗi hệ thống. Tôi đặt skipLimit 1.000 (khoảng 0,01% file 10 triệu) và mọi dòng skip đều ghi vào recon_invalid kèm số dòng và lý do, có metric. Nếu đối tác đổi định dạng ngày hay thêm cột, gần như mọi dòng lỗi: job phải FAILED sớm, không được tạo báo cáo "9 triệu dòng thiếu nội bộ" gây hoảng loạn. Chỉ skip lỗi dữ liệu (parse, validate); lỗi hạ tầng như mất kết nối DB thì để retry hoặc fail. Ngưỡng nên cấu hình theo đối tác vì chất lượng file khác nhau, và alert ngay khi skip > 0 ở đối tác bình thường sạch.`,
        `Trước hết chuẩn hoá thời gian: file đối tác có offset hoặc ghi rõ múi giờ trong đặc tả, tôi đổi tất cả sang UTC ({{TIMESTAMPTZ}}) khi nạp, còn khái niệm "ngày nghiệp vụ" tính theo Asia/Ho_Chi_Minh bằng {{ZonedDateTime}}. Lệch do biên ngày có dấu hiệu rõ: MISSING_PARTNER tập trung trong vài phút cuối ngày và xuất hiện lại trong file hôm sau, nên tôi xếp PENDING_NEXT_DAY. Lệch tiền thật thì ref khớp nhưng amount khác; tôi xem chênh lệch có quy luật không (đúng bằng phí giao dịch, hay do làm tròn currency 2 chữ số) để phân biệt lỗi phí với lỗi dữ liệu. Dung sai cấu hình theo currency, VND là 0.`,
        `Mỗi lần chạy là một recon_run với version tăng dần, unique (file_id, version) và kiểm tra không có run đang chạy cho cùng file, nên 2 người bấm cùng lúc chỉ 1 thành công. Job parameters gồm fileId và version, nên rerun là JobInstance mới chứ không đụng execution cũ. Kết quả version cũ không bị xoá: kiểm toán hỏi "ngày 15 hệ thống báo gì" thì vẫn trả lời được. Quyền: chỉ role RECON_OPERATOR được rerun và resolve, bắt buộc nhập lý do; resolve chỉ thêm ghi chú, không sửa số tiền. Mọi thao tác ghi bảng audit append-only (ai, lúc nào, gì, lý do) và user ứng dụng không có quyền UPDATE/DELETE trên bảng này.`,
        `Gấp 10 lần thì nút thắt chuyển sang I/O DB. Một: nạp bằng COPY thay vì INSERT batch, nhanh hơn nhiều lần; validate trong Java rồi stream vào COPY. Hai: nhiều đối tác thì partitioned step, mỗi file một partition chạy song song; khi một máy không đủ thì remote partitioning qua nhiều pod. Ba: đọc payment_txn từ read replica để không ảnh hưởng hệ thống chính, và partition payment_txn theo ngày. Bốn: staging partition theo ngày và DROP partition cũ. Nếu lên hàng tỷ dòng, chuyển sang Spark hoặc Athena trên Parquet trong S3, vì PostgreSQL một node không còn hợp lý. Dù đổi gì vẫn giữ các bất biến: idempotent, version bất biến, control total.`
      ]
    },
    related: ['lesson-spring-001', 'lesson-core-001', 'spring-020', 'db-039', 'sql-016', 'scenario-026', 'design-005']
  },
  {
    id: 'proj-bff', title: 'API gateway và BFF cho mobile banking', level: 'lead', weeks: 10,
    skills: ['Spring Boot', 'Microservices', 'OAuth2', 'Redis', 'AWS', 'Kubernetes', 'Observability', 'Contract Testing'],
    pitch: `Thiết kế lớp BFF gom dữ liệu cho màn hình mobile mà vẫn giữ ranh giới giữa gateway, domain service và identity. Trọng tâm là timeout, bảo mật token, tương thích contract và xử lý lỗi từng phần: một service chậm không được kéo cả màn hình Home chậm theo.`,
    requirements: `### User story
1. **Home trong 1 lần gọi:** là người dùng app, tôi mở màn hình Home và thấy tài khoản, thẻ (đã che số), 10 giao dịch gần nhất, khuyến mãi.
  Chấp nhận: app gọi đúng 1 request {{GET /bff/mobile/v1/home}}; p95 tại gateway < 300 ms khi downstream khoẻ (trước đây app gọi 5 API tuần tự).
2. **Lỗi từng phần:** service khuyến mãi hoặc thẻ chết.
  Chấp nhận: vẫn trả 200, field đó là null và có trong mảng {{degraded}}; nếu service tài khoản chết thì trả 503, không trả trang thiếu số dư.
3. **Đăng nhập OIDC:** app đăng nhập bằng Authorization Code + PKCE qua Keycloak.
  Chấp nhận: token sai issuer/audience hoặc hết hạn trả 401; thiếu scope {{accounts:read}} trả 403; user A không xem được tài khoản của B (404).
4. **Phân trang giao dịch:** tôi cuộn danh sách giao dịch.
  Chấp nhận: cursor mờ (opaque), limit mặc định 20, tối đa 50; giao dịch mới phát sinh không làm trùng hay sót dòng.
5. **Versioning:** app bản cũ vẫn chạy khi ra v2 (đổi cấu trúc field).
  Chấp nhận: v1 được hỗ trợ ít nhất 6 tháng sau khi v2 ra, response v1 có header {{Sunset}}; endpoint config báo app có cần cập nhật bắt buộc không.
6. **Rate limit:** một user gọi quá 20 req/giây.
  Chấp nhận: gateway trả 429; user khác không bị ảnh hưởng.
7. **Cache đúng chỗ:** danh sách khuyến mãi, danh sách ngân hàng cache 5 phút.
  Chấp nhận: số dư và giao dịch không bao giờ lấy từ cache chung.
8. **Truy vết:** support có request id từ app.
  Chấp nhận: tìm được trace qua gateway, BFF và 4 downstream; dashboard p95 theo từng downstream.

### Phi chức năng
- 300 RPS trên laptop (gateway, BFF, 4 service giả lập); p95 end-to-end < 300 ms, p99 < 800 ms; deadline tổng 800 ms.
- Một downstream treo không làm cạn tài nguyên: tối đa 50 call đồng thời tới mỗi downstream (bulkhead).
- Dependency optional lỗi: 0 lỗi 5xx; contract test chạy trong CI chặn thay đổi phá vỡ.

### Ngoài phạm vi
- Không kết nối core banking thật (4 service là WireMock/Spring Boot giả lập), không tự viết IdP (dùng Keycloak).
- Không làm luồng chuyển tiền (BFF chỉ đọc), không GraphQL, không web app.`,
    architecture: `~~~text
Mobile --HTTPS--> Spring Cloud Gateway (xác thực JWT, rate limit Redis, route, request id)
                    -> BFF mobile (Spring Boot 3, Java 21 virtual threads)
                         -> account-service      (bắt buộc, timeout 300 ms)
                         -> card-service         (tuỳ chọn, 300 ms)
                         -> transaction-service  (tuỳ chọn, 400 ms)
                         -> promotion-service    (tuỳ chọn, cache Redis 5 phút)
Keycloak (OIDC) phát token; mọi service tự kiểm tra JWT
~~~
Gateway lo concern biên (TLS, xác thực token, rate limit, routing), BFF chỉ ghép dữ liệu theo nhu cầu một màn hình, không chứa business rule. Mỗi downstream có timeout, circuit breaker, bulkhead riêng.`,
    design: `### Dữ liệu và cache (BFF gần như stateless)
~~~sql
-- Bảng duy nhất của BFF: chính sách phiên bản app
CREATE TABLE app_version_policy (
  platform        VARCHAR(8) PRIMARY KEY CHECK (platform IN ('IOS','ANDROID')),
  min_supported   VARCHAR(16) NOT NULL,  -- thấp hơn thì bắt cập nhật
  latest          VARCHAR(16) NOT NULL,
  v1_sunset_at    TIMESTAMPTZ
);
~~~
| Key Redis | Giá trị | TTL | Lý do |
|---|---|---|---|
| promo:{segment}:{locale} | JSON danh sách | 5 phút | Giống nhau cho mọi user cùng phân khúc |
| ref:banks | JSON | 1 giờ | Dữ liệu tham chiếu |
| rl:{userId} | token bucket của gateway | tự quản | Rate limit |

Số dư, giao dịch không cache chung: sai một lần là sự cố tài chính và lộ dữ liệu người khác.

### API
| Method | Path | Response | Mã lỗi |
|---|---|---|---|
| GET | /bff/mobile/v1/home | 200 {accounts, cards, recentTxns, promotions, degraded[]} | 401, 403, 429, 503 ACCOUNT_UNAVAILABLE |
| GET | /bff/mobile/v1/accounts/{id}/transactions?cursor=&limit= | 200 {items, nextCursor} | 400 limit > 50, 404 |
| GET | /bff/mobile/v2/home | như v1, amount thành {value, currency} | như v1 |
| GET | /bff/mobile/config?platform=&version= | 200 {forceUpdate, latest} | 400 |

~~~json
GET /bff/mobile/v1/home   (card-service timeout)
200 OK
{ "accounts": [ { "id": "acc-1", "name": "Tài khoản thanh toán",
                  "balance": 15250000, "currency": "VND" } ],
  "cards": null,
  "recentTxns": [ { "id": "t-99", "amount": -55000, "desc": "Grab", "bookedAt": "2027-01-15T08:12:00Z" } ],
  "promotions": [ { "id": "p-7", "title": "Hoàn tiền 5%" } ],
  "degraded": ["cards"] }
~~~

### Luồng chính: Home có deadline
~~~text
App      Gateway           BFF (virtual thread)        account   card   txn   promo/Redis
 |--GET-->|                    |                          |        |      |       |
 |        |-- verify JWT, rate limit (Redis), X-Request-Id|        |      |       |
 |        |------------------->| lấy token từ SecurityContext (trước khi fan-out)  |
 |        |                    |-- song song, deadline 800 ms ----------------------->|
 |        |                    |---------------- 300 ms ->|        |      |       |
 |        |                    |---------------------------- 300 ms ->|      |       |
 |        |                    |--------------------------------- 400 ms ->|       |
 |        |                    |<- account OK; card timeout => cards=null, degraded |
 |        |<-- 200 ------------|  account lỗi => 503 ngay, huỷ các call còn lại    |
~~~
Thời gian Home ≈ max(các call) thay vì tổng; app chỉ trả 1 RTT mạng di động (100–200 ms) thay vì 5.

### Xử lý lỗi & đồng thời
| Tình huống | Hành vi | Cách test |
|---|---|---|
| card-service chậm 5 giây | Timeout 300 ms, cards = null, degraded | WireMock {{withFixedDelay(5000)}} |
| account-service 500 liên tục | Circuit breaker mở, trả 503 ngay < 10 ms | WireMock trả 500, đếm request tới mock |
| transaction-service treo, 300 RPS | Bulkhead 50, call thứ 51 bị từ chối ngay, không xếp hàng | Load test + mock treo |
| Token hết hạn giữa chừng | Downstream trả 401, BFF trả 401 (không trả 503) | Token TTL 1 giây |
| Thêm field mới ở downstream | Bỏ qua field lạ ({{FAIL_ON_UNKNOWN_PROPERTIES}} tắt, mặc định Boot) | Contract test |
| User đổi id tài khoản trong URL | Downstream kiểm tra ownership theo sub trong token | Token A gọi tài khoản B |

### Chiến lược test
- **Unit:** mapper v1/v2, ghép partial response, encode/decode cursor.
- **Integration:** {{@SpringBootTest}} + WireMock cho 4 downstream, Keycloak bằng Testcontainers hoặc JWT tự ký với {{spring-security-test}}.
- **Contract:** Pact hoặc Spring Cloud Contract: BFF là consumer, mỗi downstream verify trong CI của nó.
- **Load (k6):** 300 RPS 10 phút khoẻ, rồi 1 downstream chậm; mục tiêu p95 < 300 ms và 0 lỗi 5xx khi chỉ dependency optional lỗi.

### Chạy local
~~~yaml
services:
  keycloak:
    image: quay.io/keycloak/keycloak:24.0
    command: ["start-dev", "--import-realm"]
    environment: { KEYCLOAK_ADMIN: admin, KEYCLOAK_ADMIN_PASSWORD: admin }
    volumes: ["./realm:/opt/keycloak/data/import"]
    ports: ["8180:8080"]
  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
  downstreams:
    image: wiremock/wiremock:3.5.4      # account/card/txn/promo, bật lỗi qua admin API
    volumes: ["./wiremock:/home/wiremock"]
    ports: ["8089:8080"]
~~~

### Quan sát
- {{http.server.requests}} ở gateway và BFF (p95/p99 theo uri), {{http.client.requests}} theo {{client.name}} cho từng downstream, {{resilience4j.circuitbreaker.state}}, {{resilience4j.bulkhead.available.concurrent.calls}}, counter {{bff.degraded}} (tag field).
- Trace bằng Micrometer Tracing + OpenTelemetry, traceId trả về header cho app.
- Alert: p95 Home > 300 ms trong 10 phút; degraded > 5% request; breaker OPEN quá 2 phút.

### Mở rộng (3.000 RPS)
- HPA theo CPU và p95; mỗi pod BFF nhẹ vì virtual thread, nút thắt là downstream nên phải nâng bulkhead cùng năng lực downstream.
- Gom nhiều call nhỏ thành API batch ở downstream; cache khuyến mãi ở CDN.
- Canary bằng trọng số route, rollback tự động khi p95 hoặc error rate vượt ngưỡng.`,
    milestones: [
      { title: 'Ranh giới, contract và skeleton', tasks: `1. Vẽ sơ đồ trust boundary: app, gateway, BFF, 4 downstream, Keycloak; ghi ai kiểm tra gì.
2. Tạo 2 project: gateway (Spring Cloud Gateway) và BFF (Web, Security OAuth2 Resource Server, Actuator, Data Redis, resilience4j-spring-boot3).
3. Viết OpenAPI cho /v1/home và /transactions; ghi field bắt buộc, optional (có thể null khi degraded).
4. Dựng WireMock cho 4 downstream với stub thành công.
5. Bật virtual thread: {{spring.threads.virtual.enabled=true}} (Java 21).
6. Viết DTO dạng record cho v1.

~~~java
// Response v1: field optional có thể null, degraded cho app biết phần nào thiếu
public record HomeV1(
        List<AccountDto> accounts,        // bắt buộc: thiếu thì cả request 503
        List<CardDto> cards,              // optional
        List<TxnDto> recentTxns,          // optional
        List<PromoDto> promotions,        // optional
        List<String> degraded) {}

public record CardDto(String id, String maskedPan, String status) {
    // không bao giờ nhận/trả PAN đầy đủ: che ở downstream, BFF chỉ chuyển tiếp
}
~~~`, done: `OpenAPI có ví dụ cho mọi field; GET /v1/home trên WireMock trả đủ dữ liệu; tài liệu trust boundary có trong README.` },
      { title: 'OAuth2/OIDC và token relay', tasks: `1. Tạo realm Keycloak: public client {{mobile-app}} (PKCE), audience {{bff}}, scope {{accounts:read}}.
2. Gateway và BFF đều là Resource Server: kiểm tra issuer, chữ ký (JWKS), hạn, audience.
3. BFF kiểm tra scope bằng {{@PreAuthorize}} hoặc cấu hình {{authorizeHttpRequests}}.
4. BFF chuyển tiếp token của người dùng tới downstream; downstream kiểm tra ownership theo claim sub.
5. Lấy token **trước** khi fan-out sang thread khác (SecurityContext gắn với thread).
6. Test: sai audience, thiếu scope, token A đọc tài khoản B.

~~~yaml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: http://localhost:8180/realms/bank   # tự lấy JWKS và kiểm tra iss
          audiences: bff                                  # Boot 3.2+: từ chối token cấp cho client khác
~~~
~~~java
@GetMapping("/bff/mobile/v1/home")
@PreAuthorize("hasAuthority('SCOPE_accounts:read')")
public HomeV1 home(@AuthenticationPrincipal Jwt jwt) {
    return homeService.load(jwt.getTokenValue());     // truyền token tường minh vào fan-out
}
~~~`, done: `5 test bảo mật pass: không token 401, sai audience 401, hết hạn 401, thiếu scope 403, truy cập chéo 404; log không chứa token.` },
      { title: 'Fan-out song song có deadline, timeout, circuit breaker, bulkhead', tasks: `1. Mỗi downstream một {{RestClient}} từ {{RestClient.Builder}} của Boot (để có metric), read timeout ở HTTP client.
2. Bọc mỗi call bằng Resilience4j CircuitBreaker + Bulkhead (semaphore).
3. Gọi song song bằng {{CompletableFuture}} trên executor virtual thread, mỗi call có {{orTimeout}}.
4. Call bắt buộc lỗi thì 503; call optional lỗi thì null + degraded.
5. Không retry trong Home (ngân sách 800 ms không đủ, retry nhân tải); chỉ retry 1 lần cho GET khi còn ≥ 2 lần timeout.
6. Test bằng WireMock delay và lỗi.

~~~java
public HomeV1 load(String token) {
    var acc   = call(() -> accounts.list(token), 300);
    var cards = call(() -> cardsClient.list(token), 300);
    var txns  = call(() -> txnClient.recent(token, 10), 400);
    var promo = call(promoCache::current, 200);
    List<String> degraded = new ArrayList<>();
    List<AccountDto> a;
    try { a = acc.join(); }                              // bắt buộc: lỗi là 503
    catch (CompletionException e) { throw new DependencyUnavailableException("account"); }
    return new HomeV1(a, optional(cards, "cards", degraded),
            optional(txns, "recentTxns", degraded), optional(promo, "promotions", degraded), degraded);
}

<T> CompletableFuture<T> call(Supplier<T> s, long ms) {
    // orTimeout chỉ hoàn thành future, KHÔNG huỷ HTTP call: vẫn cần read timeout ở client
    return CompletableFuture.supplyAsync(s, virtualThreads).orTimeout(ms, TimeUnit.MILLISECONDS);
}
~~~`, done: `card-service chậm 5 giây: Home vẫn trả trong < 400 ms với degraded ["cards"]; account-service lỗi: 503 trong < 350 ms; breaker OPEN thì không còn request nào tới mock.` },
      { title: 'Cache, phân trang, rate limit và versioning', tasks: `1. Cache khuyến mãi bằng {{@Cacheable}} + RedisCacheManager TTL 5 phút; key gồm segment và locale, không gồm userId.
2. Cursor phân trang: Base64URL của (bookedAt, id), downstream query keyset {{WHERE (booked_at, id) < (?, ?)}}.
3. Gateway: RequestRateLimiter dùng Redis, key theo principal.
4. Tạo /v2/home, mapper riêng từ cùng dữ liệu; v1 thêm header Sunset.
5. Endpoint config đọc app_version_policy.
6. Test: rate limit 25 req/giây cho 5 lần 429, cursor không trùng khi chèn giao dịch mới.

~~~yaml
spring:
  cloud:
    gateway:
      routes:
        - id: bff-mobile
          uri: http://localhost:8081
          predicates:
            - Path=/bff/mobile/**
          filters:
            - name: RequestRateLimiter
              args:
                redis-rate-limiter.replenishRate: 20     # 20 token mỗi giây
                redis-rate-limiter.burstCapacity: 40     # cho phép dồn ngắn 40
                key-resolver: "#{@principalNameKeyResolver}"
~~~`, done: `Promotion chỉ gọi downstream 1 lần trong 5 phút dưới tải; 25 req/giây từ 1 user cho khoảng 5 lần 429, user khác không bị; app v1 và v2 cùng chạy trên một BFF.` },
      { title: 'Contract test, đo p95 và rollout', tasks: `1. Viết consumer contract (Pact hoặc Spring Cloud Contract) cho account và transaction service.
2. Bật Micrometer Tracing + OTLP, xem trace trong Jaeger hoặc Grafana Tempo.
3. Dashboard: p95/p99 Home, p95 từng downstream, degraded rate, breaker state.
4. k6: 300 RPS 10 phút; lặp lại khi card-service chậm; so sánh với kịch bản "app gọi 5 API tuần tự".
5. Kubernetes: readiness probe, resource limit, HPA; canary 10% bằng trọng số route.
6. Ghi ngưỡng rollback: p95 > 350 ms hoặc 5xx > 1% trong 5 phút.

~~~java
// Test với WireMock: chứng minh deadline thay vì chỉ tin cấu hình
@Test
void slowCardServiceDoesNotBlockHome() {
    stubFor(get("/cards").willReturn(okJson("[]").withFixedDelay(5_000)));   // treo 5 giây
    long start = System.nanoTime();
    HomeV1 home = client.get().uri("/bff/mobile/v1/home")
        .header("Authorization", "Bearer " + tokenFor("user-a"))
        .retrieve().body(HomeV1.class);
    long ms = (System.nanoTime() - start) / 1_000_000;
    assertThat(home.cards()).isNull();
    assertThat(home.degraded()).containsExactly("cards");
    assertThat(ms).isLessThan(500);                    // timeout 300 ms + overhead
}
~~~`, done: `CI chặn thay đổi phá contract; README có bảng k6: 1 call BFF so với 5 call tuần tự (p95), kịch bản downstream chậm; dashboard và ngưỡng canary được ghi rõ.` }
    ],
    challenges: [
      `### Fan-out khuếch đại tải và cạn tài nguyên
**Triệu chứng:** transaction-service chậm, sau 1 phút BFF cạn connection, mọi request (kể cả không cần transaction) đều chậm.
**Nguyên nhân gốc:** không có giới hạn đồng thời; mỗi request Home giữ tài nguyên chờ downstream chậm, request mới tiếp tục dồn vào.
**Cách 1, bulkhead semaphore theo downstream** (50 call): service chậm chỉ chiếm tối đa 50 slot, phần còn lại phục vụ bình thường; call thứ 51 bị từ chối ngay và thành degraded.
**Cách 2, circuit breaker theo slow call rate:** khi 80% call chậm hơn 250 ms thì ngắt hẳn, không gửi request vào service đang quá tải; cần tinh chỉnh ngưỡng để không ngắt nhầm.
Dùng cả hai, và nhớ virtual thread không làm downstream mạnh hơn.
**Chứng minh:** load test 300 RPS khi transaction-service treo, endpoint /accounts riêng vẫn p95 < 100 ms.`,
      `### Token relay và confused deputy
**Triệu chứng:** BFF dùng một service account quyền rộng gọi downstream; lỗi kiểm tra ở BFF làm user A đọc được dữ liệu B.
**Nguyên nhân gốc:** downstream tin BFF tuyệt đối, ownership chỉ kiểm tra ở một chỗ.
**Cách 1, chuyển tiếp token người dùng:** downstream tự kiểm tra sub và scope, lỗi ở BFF không thành lỗ hổng; token phải có audience gồm downstream, nên token rộng hơn.
**Cách 2, token exchange (RFC 8693, Keycloak hỗ trợ):** BFF đổi token lấy token mới có audience hẹp cho từng downstream; an toàn hơn nhưng thêm 1 call tới IdP (cần cache).
**Chứng minh:** test token A gọi tài khoản B trả 404 ngay cả khi tắt kiểm tra ở BFF.`,
      `### Partial response che lỗi nghiệp vụ
**Triệu chứng:** account-service lỗi, BFF trả balance = 0 thay vì null, khách tưởng mất tiền và gọi tổng đài.
**Nguyên nhân gốc:** dùng giá trị mặc định cho mọi lỗi, không phân biệt dữ liệu trọng yếu và tuỳ chọn.
**Cách 1, phân loại field:** trọng yếu (số dư) lỗi thì 503; tuỳ chọn lỗi thì null + degraded để app hiện "tạm thời không tải được".
**Cách 2, trả dữ liệu cũ có nhãn thời gian** ("số dư lúc 08:10"): trải nghiệm tốt hơn nhưng phải cache số dư theo user, rủi ro bảo mật và sai lệch.
**Chứng minh:** test từng downstream lỗi, assert status và degraded đúng bảng.`,
      `### Đổi contract làm vỡ app cũ
**Triệu chứng:** team account đổi {{balance}} từ số sang object, app bản cũ crash sau deploy.
**Nguyên nhân gốc:** không có contract test, và app mobile không thể cập nhật đồng loạt như web.
**Cách 1, consumer-driven contract test trong CI** của downstream: phát hiện trước khi merge; tốn công duy trì contract.
**Cách 2, BFF làm lớp chống va đập:** mapper riêng cho v1/v2, downstream đổi thì chỉ sửa mapper; BFF thêm code phải duy trì.
**Chứng minh:** sửa stub đổi kiểu field, contract test fail; app v1 vẫn nhận đúng định dạng cũ.`,
      `### SecurityContext mất khi chạy song song
**Triệu chứng:** gọi tuần tự thì chạy, chuyển sang CompletableFuture thì downstream nhận request không có token và trả 401.
**Nguyên nhân gốc:** SecurityContextHolder mặc định lưu theo thread (ThreadLocal); thread của executor không có context.
**Cách 1, lấy token ở thread request rồi truyền tường minh:** rõ ràng, dễ test.
**Cách 2, bọc executor bằng {{DelegatingSecurityContextExecutor}}:** code gọn hơn nhưng phụ thuộc "phép màu", dễ quên khi đổi executor.
**Chứng minh:** integration test fan-out kiểm tra header Authorization tới đủ 4 mock.`
    ],
    readme: `# Mobile Banking BFF\n\n## Mục tiêu\nBFF tổng hợp view mobile từ các domain service với ranh giới auth, timeout và contract rõ ràng. Các service được giả lập.\n\n## Chạy local\n{{docker compose up --build}} chạy gateway, BFF và dependency giả lập có thể cấu hình latency/lỗi.\n\n## Security\nMô tả issuer/audience/scope, quyền sở hữu, token relay và dữ liệu nhạy cảm không cache/log.\n\n## Resilience\nGhi deadline tổng, timeout từng dependency, concurrency cap, partial response policy và retry policy.\n\n## Kiểm thử/triển khai\nContract test, fault injection, benchmark và canary thresholds được nêu kèm cấu hình; dashboard phân rã latency/error theo dependency.`,
    interview: {
      story: `### STAR
**Situation:** App mobile banking gọi 5 API tuần tự để dựng màn hình Home. Trên 4G (RTT khoảng 150 ms) p95 Home khoảng 1,6 giây; khi card-service chậm, cả màn hình trắng 10 giây vì không có timeout; mỗi lần team backend đổi field là app bản cũ lỗi.
**Task:** Đưa p95 Home dưới 300 ms phía server và dưới 600 ms phía app, cô lập lỗi từng service, giữ bảo mật token và không làm vỡ app cũ.
**Action:**
- Spring Cloud Gateway lo xác thực JWT, rate limit Redis, request id; BFF chỉ ghép dữ liệu cho màn hình.
- Fan-out song song trên virtual thread, deadline 800 ms, timeout riêng từng downstream, circuit breaker + bulkhead Resilience4j, phân loại field bắt buộc/tuỳ chọn.
- Chuyển tiếp token người dùng, downstream tự kiểm tra ownership; cache chỉ dữ liệu không nhạy cảm.
- Versioning /v1, /v2 với mapper riêng, header Sunset; contract test trong CI.
**Result:**
- Round-trip từ 5 xuống 1; p95 phía app 1,6 giây xuống 520 ms, p95 server 210 ms ở 300 RPS.
- card-service treo 5 giây: Home vẫn trả trong 380 ms với degraded, 0 lỗi 5xx.
- 2 thay đổi phá contract bị CI chặn trong tháng đầu.

> Số liệu trên là ví dụ minh hoạ: hãy thay bằng kết quả bạn tự đo.

### Demo trong 5 phút
1. {{docker compose up -d}}, lấy token từ Keycloak bằng script, gọi /v1/home qua gateway.
2. Gọi không token (401), token thiếu scope (403), token A đọc tài khoản B (404).
3. Bật delay 5 giây cho card mock qua admin API của WireMock, gọi lại: 200 nhanh, degraded ["cards"].
4. Cho account mock trả 500: 503; mở /actuator/circuitbreakers thấy OPEN.
5. Chạy vòng lặp 30 req/giây: thấy 429.
6. Mở dashboard p95 theo downstream và một trace đầy đủ trong Jaeger.`,
      questions: [
        'Gateway và BFF khác nhau ở ranh giới trách nhiệm nào? Sao không gộp làm một?',
        'Bạn truyền identity tới downstream ra sao? Token relay có rủi ro gì?',
        'Khi một dependency chậm, ngân sách timeout được chia thế nào?',
        'Vì sao không retry trong BFF?',
        'Dữ liệu nào tuyệt đối không nên cache ở BFF?',
        'Đã dùng virtual thread thì còn cần bulkhead không?',
        'Bạn versioning API cho mobile thế nào?',
        'Bạn đo "p95 end-to-end" thế nào và canary rollback theo metric nào?'
      ],
      answers: [
        `Gateway là lớp biên dùng chung cho mọi client: TLS, xác thực token, rate limit, routing, request id, chặn request xấu trước khi vào hệ thống. Nó không biết màn hình nào cần gì. BFF thuộc về một loại client (mobile): ghép dữ liệu, đổi định dạng, partial response theo nhu cầu UI, thường do team mobile sở hữu. Gộp làm một thì gateway phình ra logic của từng app, mọi team phải sửa chung một thành phần nhạy cảm, deploy một thay đổi UI có thể làm hỏng rate limit của cả hệ thống. Ranh giới tôi giữ: BFF không chứa business rule (tính phí, kiểm tra hạn mức thuộc domain service), chỉ điều phối và biến đổi. Nếu có web thì làm BFF thứ hai thay vì nhồi vào một BFF.`,
        `App giữ access token lấy bằng Authorization Code + PKCE. Gateway và BFF đều kiểm tra token (issuer, chữ ký, hạn, audience) theo nguyên tắc không tin mạng nội bộ. BFF chuyển tiếp token người dùng tới downstream, và downstream tự kiểm tra sub, scope, ownership. Rủi ro: token có audience rộng, lộ ở một service là dùng được ở nhiều service; và nếu BFF dùng service account quyền rộng thay cho token người dùng thì thành confused deputy, một lỗi ở BFF là lộ dữ liệu. Cách chặt hơn là token exchange (RFC 8693): BFF đổi lấy token audience hẹp cho từng downstream, đổi lại thêm call tới IdP nên phải cache theo hạn token. Không bao giờ log token hay để token đi qua query string.`,
        `Tôi bắt đầu từ mục tiêu người dùng: Home phải trả trong 800 ms kể cả khi có lỗi. Các call chạy song song nên mỗi call có timeout riêng nhỏ hơn deadline tổng: account 300 ms, card 300 ms, transaction 400 ms, promotion 200 ms (có cache), dựa trên p99 đo được của từng service cộng một khoảng đệm. Timeout phải đặt ở HTTP client (read timeout), vì {{orTimeout}} của CompletableFuture chỉ kết thúc future chứ không huỷ socket, thread vẫn bị giữ. Downstream nên nhận deadline còn lại qua header để không làm việc vô ích khi BFF đã bỏ cuộc. Nếu timeout của một service thường xuyên bị chạm, đó là tín hiệu tối ưu service đó chứ không phải nới timeout.`,
        `Retry trong đường đọc đồng bộ có hai vấn đề. Một: ngân sách thời gian, timeout 300 ms rồi retry thêm 300 ms đã vượt mục tiêu p95. Hai: khuếch đại tải, service đang quá tải nên chậm, mỗi request bị gọi 2 lần thì tải gấp đôi đúng lúc nó yếu nhất, và nếu gateway, BFF, downstream mỗi tầng retry 3 lần thì 1 request thành 27. Tôi chỉ retry 1 lần cho lỗi kết nối nhanh (connection refused, pod vừa chết) với GET idempotent khi còn đủ ngân sách, và có retry budget (không quá 10% tổng request). Lỗi khác thì partial response hoặc 503 rõ ràng, để app quyết định hiển thị nút thử lại cho người dùng.`,
        `Không cache chung dữ liệu tài chính theo người dùng: số dư, giao dịch, số thẻ, thông tin cá nhân. Hai lý do: tính đúng (khách vừa chuyển tiền mà Home hiện số dư cũ là gọi tổng đài ngay) và bảo mật (key cache sai, ví dụ thiếu userId, là trả dữ liệu người A cho người B, sự cố nghiêm trọng nhất có thể xảy ra). Tôi chỉ cache dữ liệu giống nhau cho nhiều người: khuyến mãi theo phân khúc, danh sách ngân hàng, cấu hình app; key không chứa userId và nội dung không chứa dữ liệu cá nhân. Response API cá nhân có header {{Cache-Control: no-store}} để proxy hay CDN không lưu. Nếu muốn giảm tải số dư, làm ở downstream nơi biết khi nào dữ liệu đổi.`,
        `Cần. Virtual thread giải quyết phía BFF: thread chờ I/O rất rẻ, 10.000 request chờ không cạn thread pool như platform thread. Nhưng chính vì rẻ, BFF sẽ vui vẻ gửi 10.000 request đồng thời tới card-service đang chậm và đè chết nó, hoặc cạn connection pool HTTP. Bulkhead semaphore giới hạn số call đồng thời tới mỗi downstream (ví dụ 50, theo năng lực đo được của downstream), call vượt quá bị từ chối ngay và thành degraded thay vì xếp hàng. Cộng với circuit breaker theo slow call rate để ngừng gửi khi downstream đã quá tải. Nói gọn: virtual thread bảo vệ mình khỏi chờ đợi, bulkhead bảo vệ người khác khỏi mình.`,
        `Mobile khác web: người dùng không cập nhật app ngay, bản cũ sống hàng tháng. Tôi dùng version trong URI (/v1, /v2) vì dễ route, dễ đọc log và dễ đo tỉ lệ dùng từng version. Thay đổi bổ sung (thêm field, thêm endpoint) không tăng version, client được yêu cầu bỏ qua field lạ. Thay đổi phá vỡ (đổi kiểu, đổi nghĩa, xoá field) thì ra version mới với mapper riêng trên cùng dữ liệu domain. Version cũ có header Sunset báo ngày ngừng, tôi theo dõi metric theo version và chỉ tắt khi lượng dùng dưới ngưỡng thoả thuận; endpoint config cho phép bắt cập nhật bản quá cũ. Contract test giữa BFF và downstream giữ cho BFF không bị vỡ từ phía sau.`,
        `End-to-end có 3 lớp số: phía app (thời gian người dùng thấy, gồm mạng di động, lấy từ telemetry app hoặc k6 chạy từ ngoài), tại gateway ({{http.server.requests}} của gateway, gồm cả BFF và downstream), và từng downstream ({{http.client.requests}} theo client.name). Tôi báo p95 tại gateway là cam kết của backend và ghi riêng số phía app, không trộn. Canary: 10% traffic sang bản mới bằng trọng số route, so sánh với bản cũ cùng thời điểm: p95 Home, tỉ lệ 5xx, tỉ lệ degraded và lỗi 401/403 (bắt lỗi cấu hình bảo mật). Rollback tự động khi p95 cao hơn bản cũ 20% hoặc 5xx > 1% trong 5 phút; chỉ tăng dần 25, 50, 100% khi qua ngưỡng.`
      ]
    },
    related: ['security-001', 'api-001', 'security-004', 'microservices-011', 'microservices-007', 'microservices-026', 'microservices-014', 'api-016', 'testing-004', 'design-003', 'api-019']
  }
];
