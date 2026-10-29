/*
 * Timed system-design practice (window.SD_PROBLEMS), used by #/sd. Phases run on a clock like a real 45-minute round.
 * { id: 'sd-001', title: 'Chuyển tiền liên ngân hàng (Napas)', kind: 'bank'|'bigtech', level: 'senior'|'lead',
 *   prompt: `markup: đề bài như interviewer nói, kèm quy mô (users, TPS, SLA)`,
 *   phases: [ { name: 'Requirements', minutes: 5, guide: `markup: cần hỏi/chốt gì` },
 *             { name: 'Estimation', minutes: 5, guide }, { name: 'API & data model', minutes: 5, guide },
 *             { name: 'High-level design', minutes: 15, guide }, { name: 'Deep dive', minutes: 15, guide } ],
 *   rubric: ['ý bắt buộc 1', …],            // 6-10 điểm chấm, AI dùng để chấm
 *   reference: `markup: lời giải mẫu đầy đủ, có sơ đồ ASCII ~~~text, trade-off, con số`,
 *   followups: ['câu interviewer hỏi thêm / đổi ràng buộc', …],   // 3-5
 *   related: ['design-001'] }               // id câu hỏi có thật (tuỳ chọn)
 */
window.SD_PROBLEMS = [
{
  id: 'sd-001',
  title: 'Chuyển tiền liên ngân hàng qua Napas',
  kind: 'bank',
  level: 'senior',
  prompt: `Bạn là kiến trúc sư cho ngân hàng X. Thiết kế hệ thống chuyển tiền liên ngân hàng qua Napas. Quy mô: 5 triệu tài khoản, peak 2.000 TPS chuyển tiền, SLA 99,99%, mỗi giao dịch phải xử lý trong dưới 3 giây, không được mất tiền, không được trừ hai lần. Napas trả kết quả bất đồng bộ sau 1-5 giây và có thể timeout. Bạn có 45 phút. Hãy trình bày.`,
  phases: [
    { name: 'Requirements', minutes: 5, guide: `Làm rõ functional: chuyển tiền nội bộ và liên ngân hàng qua Napas, tra cứu trạng thái, sao kê, huỷ/hoàn tiền. Non-functional: TPS peak, p99 latency, availability, consistency (tiền phải đúng tuyệt đối), audit retention 7 năm. Hỏi rõ Napas contract: sync hay async, timeout, retry policy, idempotency key Napas có hỗ trợ không, trạng thái treo tối đa bao lâu. Chốt out-of-scope: FX, crypto, bulk payment. Chốt giả định: client retry là chắc chắn, at-least-once.` },
    { name: 'Estimation', minutes: 5, guide: `Tính peak TPS 2.000, trung bình có thể 200-400. Storage: 2.000 txn/s x 86.400 x 1 KB ~ 170 GB/ngày nếu peak liên tục; thực tế ~5-10 GB/ngày. Retention 7 năm ~ 25 TB. Redis idempotency cache: 2.000 keys/s x TTL 24h ~ 172 triệu key/ngày, cần sharding. Bandwidth Napas: 2.000 req/s x 2 KB ~ 4 MB/s, không phải bottleneck. Kết luận: DB là bottleneck chính, cần partition theo thời gian và account.` },
    { name: 'API & data model', minutes: 5, guide: `API: POST /transfers với Idempotency-Key, GET /transfers/{id}, POST /transfers/{id}/cancel (nếu chưa settle). State machine: INITIATED -> PENDING_NAPAS -> SETTLED/FAILED/REVERSED. Bảng transfer (id, idem_key unique, from_acc, to_acc, amount, currency, status, napas_ref, created_at, updated_at). Bảng ledger_entry append-only double-entry. Outbox table cùng DB transaction. Unique constraints để chống trùng.` },
    { name: 'High-level design', minutes: 15, guide: `Vẽ: Client -> API -> Payment service -> Ledger DB (primary) + Outbox -> Napas adapter -> Napas. Async worker đọc outbox publish Kafka -> Napas gateway. Webhook receiver nhận kết quả Napas. Status query từ DB/Redis cache. Giải thích luồng ghi và đọc khác nhau. Nêu vì sao không gọi Napas đồng bộ trong request (timeout làm client retry).` },
    { name: 'Deep dive', minutes: 15, guide: `Đào sâu: idempotency end-to-end (client key -> server -> Napas ref), trạng thái treo và reconciliation hằng ngày, xử lý Napas timeout (retry với cùng ref, không tạo mới), deadlock avoidance (khoá account theo thứ tự id tăng dần), failure modes (Napas down, DB primary failover, duplicate webhook), monitoring (lag, pending count, mismatch).` }
  ],
  rubric: [
    'Làm rõ yêu cầu và con số scale, chốt out-of-scope',
    'Idempotency key từ client đến Napas, xử lý retry an toàn',
    'State machine có trạng thái treo PENDING và timeout rõ ràng',
    'Double-entry ledger append-only, số tiền lưu bằng số nguyên',
    'Outbox pattern thay vì dual-write DB + Kafka',
    'Xử lý Napas timeout/retry bằng cùng napas_ref, không tạo giao dịch mới',
    'Reconciliation hằng ngày với sao kê Napas, dashboard lệch',
    'Khoá tài khoản theo thứ tự id tăng dần để tránh deadlock',
    'Giám sát pending count, DLQ, alert khi reconciliation lệch',
    'Tóm tắt trade-off và failure mode'
  ],
  reference: `**Tóm tắt:** Chuyển tiền liên ngân hàng là bài toán **đúng đắn và truy vết**, không phải tốc độ. Ba trụ cột: idempotency key cho mọi lệnh ghi, double-entry ledger append-only làm nguồn sự thật, và reconciliation hằng ngày với sao kê Napas. Không có exactly-once thần kỳ — chỉ có at-least-once cộng với xử lý idempotent.

### Yêu cầu và quy mô
- 5 triệu tài khoản, peak 2.000 TPS chuyển tiền, p99 dưới 3 giây, availability 99,99%.
- Không mất tiền, không trừ hai lần, audit retention 7 năm.
- Napas trả kết quả bất đồng bộ sau 1-5 giây, có thể timeout; client retry là chắc chắn.

### Ước lượng
- Peak 2.000 TPS, trung bình có thể 200-400 TPS.
- Storage: 2.000 x 86.400 x 1 KB ~ 170 GB/ngày nếu peak liên tục; thực tế 5-10 GB/ngày; 7 năm ~ 25 TB. Cần partition theo tháng.
- Redis idempotency: 2.000 keys/s x TTL 24h ~ 172 triệu key/ngày, phải shard Redis Cluster.
- Bandwidth Napas ~ 4 MB/s, không phải bottleneck.

### State machine
~~~text
INITIATED -> PENDING_NAPAS -> SETTLED
    |              |             |
    +--> FAILED <--+             +--> REVERSED (hoàn tiền)
~~~
Mỗi chuyển trạng thái là conditional update WHERE status = 'PENDING_NAPAS'. Không cho nhảy trạng thái tuỳ tiện.

### Mô hình dữ liệu
~~~sql
CREATE TABLE transfer (
  id            UUID PRIMARY KEY,
  idem_key      VARCHAR(64) NOT NULL,
  from_account  BIGINT NOT NULL,
  to_account    BIGINT NOT NULL,
  amount_minor  BIGINT NOT NULL CHECK (amount_minor > 0),
  currency      CHAR(3) NOT NULL,
  status        VARCHAR(20) NOT NULL,
  napas_ref     VARCHAR(64),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (idem_key)
);
CREATE TABLE ledger_entry (
  id           BIGSERIAL PRIMARY KEY,
  txn_id       UUID NOT NULL,
  account_id   BIGINT NOT NULL,
  direction    CHAR(1) NOT NULL CHECK (direction IN ('D','C')),
  amount_minor BIGINT NOT NULL,
  currency     CHAR(3) NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uk_ledger_idem ON ledger_entry (txn_id, account_id, direction);
CREATE TABLE outbox (
  id           BIGSERIAL PRIMARY KEY,
  aggregate_id UUID NOT NULL,
  type         VARCHAR(50) NOT NULL,
  payload      JSONB NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at TIMESTAMPTZ
);
~~~
Tiền lưu bằng số nguyên đơn vị nhỏ nhất. Ledger append-only: sửa sai bằng reversal, không xoá.

### Kiến trúc
~~~text
Client -> API gateway -> Payment service -> Ledger DB (primary)
                              |                |
                              |          outbox table
                              v                |
                        Napas adapter <-- outbox relay -> Kafka
                              |                                  |
                        Napas network                              v
                              |                         Settlement/recon job
                        Webhook receiver ----------------------+
~~~
- API chỉ nhận và trả 202 kèm id tra cứu, không gọi Napas đồng bộ.
- Outbox: ghi transfer + ledger + outbox trong cùng DB transaction; relay đọc outbox và publish. Tránh dual-write.
- Napas adapter idempotent theo napas_ref.

### Luồng ghi
1. Client gửi POST /transfers với Idempotency-Key (UUID).
2. Payment service kiểm tra key: mới thì xử lý; đã có và body giống thì trả response cũ; đã có nhưng body khác thì 409.
3. Kiểm tra số dư bằng UPDATE ... WHERE balance >= amount (conditional).
4. Ghi transfer INITIATED + ledger entries + outbox trong cùng transaction.
5. Relay publish event sang Napas adapter; adapter gửi Napas với napas_ref = transfer.id.
6. Trả 202 kèm transfer id.

### Xử lý Napas timeout
- Adapter retry với cùng napas_ref; Napas phải idempotent theo ref (hoặc adapter kiểm tra trạng thái trước khi gửi lại).
- Nếu Napas không phản hồi sau N lần, transfer ở PENDING_NAPAS; job nền query Napas theo ref để chốt.
- Webhook từ Napas idempotent theo napas_event_id.

### Trạng thái treo và reconciliation
- Transfer PENDING quá X phút (ví dụ 10) được job quét; query Napas; nếu Napas nói thành công thì settle, nếu thất bại thì reverse, nếu không rõ thì giữ pending và alert.
- Hằng ngày tải sao kê Napas, so khớp theo napas_ref: có ở ta không có ở Napas (treo), có ở Napas không có ở ta (webhook mất), lệch số tiền (alert).
- Kết quả reconciliation lưu lại và có dashboard; "không có lệch" cũng phải chứng minh.

### Cô lập và khoá
- Chuyển tiền hai chiều: khoá tài khoản theo thứ tự account_id tăng dần để tránh deadlock.
- Transaction ngắn; SERIALIZABLE cân nhắc kỹ vì gây retry.
- Số dư đọc từ bảng materialized balance, đối soát với ledger định kỳ.

### Failure modes
| Sự cố | Ảnh hưởng | Cách xử lý |
|---|---|---|
| Napas down | Transfer treo | Giữ pending, retry exponential, alert, không tự reverse |
| DB primary failover | Mất ghi | Replica lag monitor, failover tự động, idempotency bảo vệ retry |
| Duplicate webhook | Settle hai lần | Conditional update WHERE status = PENDING_NAPAS |
| Client retry | Tạo hai transfer | Idempotency key unique |
| Outbox relay chậm | Napas nhận trễ | Monitor lag, scale relay |

### Giám sát
- Pending count theo tuổi, p99 latency end-to-end, Napas success rate, reconciliation mismatch count, DLQ size.
- Alert khi pending quá hạn tăng hoặc mismatch > 0.

> Senior tip: bài học đắt nhất là đừng bao giờ để số dư là nguồn sự thật duy nhất. Khi có sự cố, ledger append-only cho phép dựng lại toàn bộ lịch sử và chứng minh với Napas; một bảng balance bị UPDATE sai thì không có cách nào biết nó sai từ lúc nào.`,
  followups: [
    'Nếu traffic tăng x10 trong 1 giờ, kiến trúc thay đổi thế nào?',
    'Mất một region, bạn khôi phục và đối soát ra sao?',
    'Napas thay đổi từ async sang sync, bạn điều chỉnh gì?',
    'Thiết kế API hoàn tiền một phần (partial refund) trên ledger ra sao?'
  ],
  related: ['design-005']
},
{
  id: 'sd-002',
  title: 'Sổ cái double-entry và số dư thời gian thực',
  kind: 'bank',
  level: 'lead',
  prompt: `Thiết kế hệ thống sổ cái (ledger) double-entry cho ngân hàng với số dư thời gian thực. Quy mô: 50 triệu tài khoản, 5.000 TPS ghi, p99 đọc số dư dưới 50 ms, availability 99,999%, audit lưu 10 năm. Phải trả lời được số dư tại bất kỳ thời điểm nào trong quá khứ và chứng minh với kiểm toán. Bạn có 45 phút.`,
  phases: [
    { name: 'Requirements', minutes: 5, guide: `Làm rõ: tài khoản loại nào (checking/savings/loan), tiền tệ, đa chi nhánh, freeze/hold, số dư available vs booked. Non-functional: TPS, latency đọc, availability, retention, consistency. Hỏi: cần số dư real-time hay near-real-time? Có cần snapshot theo ngày? Ai đọc (customer app, teller, batch)? Out-of-scope: FX conversion phức tạp, interest accrual.` },
    { name: 'Estimation', minutes: 5, guide: `5.000 TPS x 86.400 = 432 triệu entry/ngày. Mỗi entry ~200 byte => 86 GB/ngày, 31 TB/năm, 310 TB/10 năm. Cần tiered storage: hot 90 ngày trên SSD, cold trên object storage. Read: 50 triệu account x nhiều lần/ngày, cache số dư. Kết luận: append-only + materialized balance + partition theo thời gian.` },
    { name: 'API & data model', minutes: 5, guide: `API: POST /ledger/entries (batch), GET /accounts/{id}/balance, GET /accounts/{id}/statement?from&to. Bảng account (id, type, currency, status), ledger_entry (id, txn_id, account_id, direction, amount, currency, value_date, created_at), balance (account_id, booked, available, version, updated_at). Unique constraints, indexes. Version cho optimistic locking.` },
    { name: 'High-level design', minutes: 15, guide: `Vẽ: Client -> API -> Ledger service -> Primary DB (sharded) + Read replica. Balance cache Redis. Event stream Kafka cho downstream (reporting, fraud). Explain luồng ghi và đọc. Nêu vì sao không UPDATE balance trực tiếp; balance là materialized view cập nhật trong cùng transaction.` },
    { name: 'Deep dive', minutes: 15, guide: `Đào sâu: append-only và reversal, point-in-time balance (replay hoặc snapshot), hold/available balance, partitioning và archival, consistency khi cache, failure modes (replica lag, shard rebalance), audit và reconciliation.` }
  ],
  rubric: [
    'Mô hình double-entry với tổng nợ = tổng có',
    'Append-only ledger, sửa sai bằng reversal',
    'Tách booked vs available balance và hold',
    'Số tiền lưu bằng số nguyên, không float',
    'Point-in-time balance (số dư tại thời điểm quá khứ)',
    'Partition theo thời gian và archival tiered storage',
    'Balance là materialized, cập nhật trong cùng transaction',
    'Optimistic locking/version để tránh lost update',
    'Cache số dư với invalidation đúng',
    'Audit trail và khả năng replay để chứng minh'
  ],
  reference: `**Tóm tắt:** Sổ cái double-entry là nguồn sự thật duy nhất của ngân hàng. Không bao giờ UPDATE số dư trực tiếp; chỉ append bút toán, số dư là tổng hợp hoặc bảng materialized cập nhật trong cùng transaction. Point-in-time balance đạt được bằng snapshot + replay từ snapshot.

### Yêu cầu
- 50 triệu tài khoản, 5.000 TPS ghi, p99 đọc số dư dưới 50 ms, availability 99,999%, audit 10 năm.
- Trả lời được số dư tại bất kỳ thời điểm quá khứ và chứng minh với kiểm toán.
- Hold/freeze, available vs booked, đa tiền tệ.

### Ước lượng
- 5.000 x 86.400 = 432 triệu entry/ngày.
- 432M x 200 byte = 86 GB/ngày; 31 TB/năm; 310 TB/10 năm.
- Tiered storage: hot 90 ngày trên SSD (~7,7 TB), warm 1 năm, cold trên S3/Glacier.
- Read: cache số dư trong Redis, TTL ngắn + invalidation.

### Mô hình dữ liệu
~~~sql
CREATE TABLE account (
  id         BIGINT PRIMARY KEY,
  type       VARCHAR(20) NOT NULL,
  currency   CHAR(3) NOT NULL,
  status     VARCHAR(20) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL
);
CREATE TABLE ledger_entry (
  id           BIGSERIAL PRIMARY KEY,
  txn_id       UUID NOT NULL,
  account_id   BIGINT NOT NULL,
  direction    CHAR(1) NOT NULL CHECK (direction IN ('D','C')),
  amount_minor BIGINT NOT NULL CHECK (amount_minor > 0),
  currency     CHAR(3) NOT NULL,
  value_date   DATE NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata     JSONB
);
CREATE INDEX idx_ledger_account_time ON ledger_entry (account_id, created_at);
CREATE TABLE balance (
  account_id  BIGINT PRIMARY KEY,
  booked_minor BIGINT NOT NULL DEFAULT 0,
  available_minor BIGINT NOT NULL DEFAULT 0,
  held_minor   BIGINT NOT NULL DEFAULT 0,
  version     BIGINT NOT NULL DEFAULT 0,
  updated_at  TIMESTAMPTZ NOT NULL
);
~~~
- Mỗi giao dịch có nhiều entry sao cho tổng D = tổng C.
- balance là materialized cache, cập nhật trong cùng transaction với ledger insert.
- version cho optimistic locking khi cần.

### Hold và available
- Khi uỷ quyền (authorization) thành công: tăng held, giảm available, chưa đụng booked.
- Khi capture: giảm held, giảm booked? Actually booked tăng khi tiền vào; available điều chỉnh theo hold.
- Mô hình: booked = tổng đã settle; available = booked - held. Hold là tiền bị giữ chỗ.
- Freeze: đánh dấu account status FROZEN, mọi ghi bị chặn ở service layer.

### Point-in-time balance
Hai cách:
1. **Replay:** sum ledger_entry WHERE account_id = x AND created_at <= t. Đơn giản nhưng chậm với tài khoản nhiều giao dịch.
2. **Snapshot + replay:** lưu snapshot số dư mỗi ngày/cuối tháng; query = snapshot gần nhất trước t + replay từ snapshot đến t. Nhanh và chứng minh được.
- Snapshot bất biến, có checksum; kiểm toán có thể replay để verify.
- Snapshot lưu trong object storage, metadata trong DB.

### Partitioning và archival
- Partition ledger_entry theo tháng (hoặc theo hash(account_id) + thời gian).
- Hot partition trên SSD cho 90 ngày gần nhất; cold partition detach và move sang tablespace trên S3 (qua foreign table hoặc export).
- Index chỉ trên hot partition; query lịch sử dài hạn đi qua cold storage với latency cao hơn (chấp nhận).

### Kiến trúc
~~~text
Client -> API -> Ledger service -> Primary DB (sharded by account_id)
                      |                  |
                      |            balance (materialized)
                      v
                   Kafka (ledger-events)
                      |
              +-------+-------+
              |               |
        Reporting worker   Fraud/AML worker
              |               |
        Data warehouse    Alerting
~~~
- Sharding theo account_id với consistent hashing; mỗi shard phục vụ một phạm vi account.
- Read replica cho balance query; cache Redis cho hot account với TTL 1-5s + invalidation qua CDC.
- Kafka events cho downstream, không block ghi ledger.

### Consistency
- Ghi ledger: strong consistency trong shard (single primary).
- Đọc số dư: có thể eventual qua cache, nhưng luôn có đường đọc trực tiếp DB cho teller/audit.
- Cross-shard transaction (chuyển tiền giữa hai shard): dùng saga hoặc partition theo account range để cùng shard khi có thể; nếu khác shard, dùng outbox + compensation.

### Failure modes
| Sự cố | Ảnh hưởng | Cách xử lý |
|---|---|---|
| Replica lag | Đọc số dư cũ | Đọc primary cho giao dịch vừa ghi; monitor lag |
| Shard overload | Latency tăng | Rebalance, cache, rate limit |
| Cache stale | Hiển thị số dư cũ | TTL ngắn, invalidation CDC, force refresh |
| Mất snapshot | Không replay được | Replicate snapshot, checksum, verify định kỳ |
| Double write | Ledger lệch | Idempotency key, unique constraint |

### Audit và chứng minh
- Mọi thay đổi có actor, timestamp, txn_id.
- Kiểm toán có thể replay ledger từ đầu để rebuild balance và so khớp.
- Export snapshot + delta theo yêu cầu kiểm toán.
- Không xoá, không sửa; chỉ reversal với lý do.

### Giám sát
- TPS ghi/đọc, p99 latency, replica lag, cache hit rate, snapshot age, reconciliation mismatch.

> Senior tip: số dư real-time không có nghĩa là mọi đọc đều mạnh nhất. Tôi tách "số dư hiển thị cho app" (cache, eventual) và "số dư dùng để quyết định ghi" (primary, strong). Nhầm hai cái này là nguyên nhân của phần lớn bug tiền tệ.`,
  followups: [
    'Nếu cần số dư theo múi giờ và value date, schema thay đổi thế nào?',
    'Làm sao migrate từ schema cũ sang partition mới mà không downtime?',
    'Bạn xử lý tài khoản có hàng trăm triệu giao dịch (whale account) ra sao?'
  ],
  related: ['design-005']
},
{
  id: 'sd-003',
  title: 'OTP và xác thực giao dịch',
  kind: 'bank',
  level: 'senior',
  prompt: `Thiết kế hệ thống OTP/xác thực giao dịch cho ngân hàng. Quy mô: 10 triệu user, peak 5.000 OTP/phút, OTP phải đến trong dưới 10 giây, chống brute force, chống replay, tuân thủ bảo mật (PCI-DSS). Hỗ trợ SMS, email, push (app), soft token (TOTP). Bạn có 45 phút.`,
  phases: [
    { name: 'Requirements', minutes: 5, guide: `Làm rõ functional: sinh OTP, gửi đa kênh, verify, resend, lock sau N sai, audit. Non-functional: throughput, latency, availability, bảo mật. Hỏi: OTP dùng cho giao dịch nào (login, transfer, đổi mật khẩu), TTL bao lâu, số chữ số, có cần step-up auth? Out-of-scope: biometrics, hardware token. Chốt: OTP at-most-once verification, không lưu plaintext.` },
    { name: 'Estimation', minutes: 5, guide: `5.000 OTP/phút = 83/s. SMS provider rate limit và chi phí. Storage: OTP record nhỏ, TTL 5 phút, volume thấp. Redis cho OTP state và rate limit. Kết luận: bottleneck là provider SMS và rate limit, không phải DB.` },
    { name: 'API & data model', minutes: 5, guide: `API: POST /auth/otp/request {purpose, channel, transactionRef}, POST /auth/otp/verify {otpId, code}. Bảng otp (id, user_id, purpose, txn_ref, channel, code_hash, attempts, status, expires_at, created_at). Unique (user_id, purpose, txn_ref) để chống replay. Rate limit theo user/IP/device.` },
    { name: 'High-level design', minutes: 15, guide: `Vẽ: Client -> API -> OTP service -> Redis (OTP state + rate limit) + DB (audit). Channel dispatcher -> provider (SMS/email/push/TOTP). Verify path: hash compare constant-time, mark used, publish event. Explain vì sao OTP không đồng bộ với giao dịch chính.` },
    { name: 'Deep dive', minutes: 15, guide: `Đào sâu: sinh OTP an toàn (CSPRNG), hash (bcrypt/argon2) không lưu plaintext, chống brute force (lockout), chống replay (one-time use), TOTP (RFC 6238) và clock skew, provider failover, audit và tuân thủ, failure modes.` }
  ],
  rubric: [
    'Sinh OTP bằng CSPRNG, không dùng Math.random',
    'Lưu hash OTP, không lưu plaintext; so sánh constant-time',
    'One-time use và chống replay theo transaction ref',
    'Rate limit và lockout chống brute force',
    'TTL ngắn và resend có cooldown',
    'Hỗ trợ đa kênh với failover provider',
    'TOTP theo RFC 6238 với clock skew handling',
    'Audit log đầy đủ cho tuân thủ',
    'Tách OTP service khỏi transaction service',
    'Failure modes và degradation'
  ],
  reference: `**Tóm tắt:** OTP là bài toán **bảo mật và trải nghiệm**, không phải throughput. Ba nguyên tắc: sinh bằng CSPRNG và lưu hash, one-time use gắn với transaction ref, và rate limit nhiều lớp. OTP service phải tách khỏi transaction service để sự cố OTP không chặn giao dịch đã xác thực.

### Yêu cầu
- 10 triệu user, peak 5.000 OTP/phút (83/s), OTP đến trong dưới 10 giây.
- Chống brute force, chống replay, tuân thủ PCI-DSS.
- Kênh: SMS, email, push, soft token (TOTP).

### Ước lượng
- 83 OTP/s, mỗi OTP record ~200 byte, TTL 5 phút => ~50.000 record đồng thời, rất nhỏ.
- SMS provider rate limit thường 100-1000/s; cần failover và queue.
- Chi phí SMS là bottleneck tài chính, không phải kỹ thuật.

### Sinh OTP an toàn
- Dùng SecureRandom (Java) / CSPRNG, không Math.random.
- OTP 6 chữ số = 1 triệu khả năng; với rate limit là đủ cho online brute force.
- Lưu hash (bcrypt/argon2 hoặc HMAC-SHA256 với secret server) chứ không plaintext. So sánh bằng constant-time (MessageDigest.isEqual) để tránh timing attack.

### Mô hình dữ liệu
~~~sql
CREATE TABLE otp (
  id           UUID PRIMARY KEY,
  user_id      BIGINT NOT NULL,
  purpose      VARCHAR(30) NOT NULL,
  txn_ref      VARCHAR(64) NOT NULL,
  channel      VARCHAR(10) NOT NULL,
  code_hash    VARCHAR(128) NOT NULL,
  attempts     INT NOT NULL DEFAULT 0,
  status       VARCHAR(20) NOT NULL,
  expires_at   TIMESTAMPTZ NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, purpose, txn_ref)
);
~~~
- One-time use: verify thành công thì status = USED; verify lại trả lỗi.
- txn_ref gắn OTP với giao dịch cụ thể, chống replay sang giao dịch khác.

### Kiến trúc
~~~text
Client -> API gateway -> OTP service -> Redis (OTP state, rate limit)
                              |              |
                              |        DB (audit, otp record)
                              v
                        Channel dispatcher
                          /    |    \
                       SMS   Email  Push  TOTP (local verify)
                        |     |     |
                    Provider adapters (Twilio, SES, FCM)
~~~
- OTP service stateless, scale ngang.
- Redis cho OTP state với TTL tự hết hạn; DB cho audit và record bền.
- Verify path: hash input, so sánh constant-time, conditional update attempts+status.

### Rate limit và chống brute force
- Theo user: 5 OTP/giờ cho mỗi purpose, 3 resend/15 phút.
- Theo IP và device fingerprint: rộng hơn vì NAT.
- Theo transaction: một OTP cho một txn_ref; sai 3-5 lần thì lock OTP đó.
- Lockout 계정 sau N OTP sai liên tiếp trong 24h, yêu cầu kênh khác hoặc branch.
- Backoff: mỗi lần sai tăng delay verify.

### Chống replay
- OTP chỉ verify được một lần (status USED).
- OTP gắn với txn_ref và purpose; dùng OTP của login cho transfer sẽ bị từ chối.
- OTP có TTL ngắn (3-5 phút) và không reuse.
- Client phải gửi otpId, không chỉ code, để server biết record nào.

### Đa kênh và failover
- Mỗi kênh có adapter chung interface.
- Nếu SMS provider lỗi (circuit breaker mở), gợi ý kênh khác hoặc retry provider phụ.
- Push notification nhanh nhất và rẻ nhất, nhưng phụ thuộc app; SMS là fallback phổ biến.
- Email cho giao dịch không khẩn cấp.

### TOTP (RFC 6238)
- Soft token sinh OTP 6 số mỗi 30 giây từ secret chia sẻ.
- Server verify với cửa sổ ±1 step (30s) để xử lý clock skew.
- Secret lưu encrypted at rest; hiển thị QR một lần khi đăng ký.
- Backup codes cho mất thiết bị.

### Tuân thủ và audit
- Log mọi request/verify (user, IP, device, channel, result) nhưng không log OTP plaintext.
- Retention theo quy định (thường 7 năm).
- Mask số điện thoại/email trong log.
- Phân quyền truy cập audit log.

### Failure modes
| Sự cố | Ảnh hưởng | Cách xử lý |
|---|---|---|
| SMS provider down | OTP không đến | Failover provider, gợi ý kênh khác, queue retry |
| Redis down | Không verify được | Fail-closed cho verify (an toàn), degraded |
| Clock skew (TOTP) | Verify sai | Cửa sổ ±1 step, đồng bộ NTP |
| Brute force | Tài khoản bị takeover | Rate limit, lockout, alert |
| Replay attack | Dùng OTP cũ | One-time use, txn_ref binding |

### Giám sát
- OTP delivery rate theo kênh/provider, p99 delivery time, verify success rate, lockout count, rate limit hit.

> Senior tip: tôi luôn tách OTP service khỏi transaction service và coi OTP như một "capability" độc lập. Khi OTP provider gặp sự cố, giao dịch đã xác thực trước đó vẫn phải xử lý được; còn nếu OTP nằm trong transaction service, một sự cố SMS sẽ làm nghẽn cả thanh toán.`,

  followups: [
    'Nếu SMS provider tăng giá gấp 5, bạn chuyển chiến lược kênh thế nào?',
    'Làm sao phát hiện SIM swap attack trước khi gửi OTP?',
    'Thiết kế step-up authentication: khi nào yêu cầu OTP, khi nào không?'
  ],
  related: ['security-001']
},
{
  id: 'sd-004',
  title: 'Sao kê và báo cáo cuối ngày cho hàng triệu tài khoản',
  kind: 'bank',
  level: 'senior',
  prompt: `Thiết kế hệ thống sinh sao kê và báo cáo cuối ngày cho hàng triệu tài khoản. Quy mô: 5 triệu tài khoản, 50 triệu giao dịch/ngày, sao kê phải sẵn sàng trước 6 giờ sáng hôm sau, báo cáo tổng hợp cho chi nhánh/ngân hàng trước 7 giờ. Phải xử lý peak generation, retry, và không block hệ thống giao dịch. Bạn có 45 phút.`,
  phases: [
    { name: 'Requirements', minutes: 5, guide: `Làm rõ: loại sao kê (PDF/CSV/MT940), tần suất (ngày/tháng), nội dung, ngôn ngữ, gửi qua email/app/branch. Báo cáo nào (tổng hợp giao dịch, số dư, phí, hoa hồng). Non-functional: deadline 6h sáng, không block OLTP, idempotent re-run. Hỏi: sao kê có cần real-time on-demand không? Out-of-scope: archiving dài hạn (có thể nhắc).` },
    { name: 'Estimation', minutes: 5, guide: `50M txn/ngày, 5M account => trung bình 10 txn/account. Sinh 5M file PDF trong 8 giờ = 173 file/s nếu đều; thực tế batch theo chi nhánh. Storage: 5M x 50KB = 250 GB/ngày. CPU/render bottleneck. Kết luận: async batch + object storage + metadata DB, không sinh đồng bộ.` },
    { name: 'API & data model', minutes: 5, guide: `API: POST /statements/generate (admin), GET /statements/{id}/download (presigned URL), GET /reports/{type}?date. Bảng statement_job (id, date, status, started_at, finished_at), statement (id, account_id, period, file_key, checksum, generated_at), report (id, type, date, file_key). Unique (account_id, period).` },
    { name: 'High-level design', minutes: 15, guide: `Vẽ: Scheduler -> Orchestrator -> Kafka (statement tasks) -> Workers (render) -> S3 + DB metadata. Reporting pipeline: OLTP -> CDC/replica -> warehouse -> report jobs -> S3. Explain tách OLTP khỏi batch. Nêu retry, idempotency, monitoring.` },
    { name: 'Deep dive', minutes: 15, guide: `Đào sâu: partitioning task theo account range, render template, retry và DLQ, idempotent re-run, storage lifecycle, consistency giữa ledger và statement, failure modes, monitoring deadline.` }
  ],
  rubric: [
    'Tách batch generation khỏi OLTP, không block giao dịch',
    'Task partitioning và parallel workers',
    'Idempotent re-run, không sinh trùng',
    'Object storage + presigned URL cho file',
    'Metadata DB với checksum',
    'CDC/replica để feed reporting, tránh đọc primary',
    'Retry, DLQ, alert khi trễ deadline',
    'Template versioning và localization',
    'Monitoring deadline và throughput',
    'Failure modes và recovery'
  ],
  reference: `**Tóm tắt:** Sinh sao kê hàng triệu là bài toán **batch processing deadline-driven**. Nguyên tắc: không bao giờ sinh đồng bộ trong request; partition task theo account range, render song song, lưu object storage, metadata DB, và luôn có retry + DLQ. Tách OLTP khỏi reporting qua replica/CDC.

### Yêu cầu
- 5 triệu tài khoản, 50 triệu giao dịch/ngày.
- Sao kê sẵn sàng trước 6 giờ sáng hôm sau; báo cáo tổng hợp trước 7 giờ.
- Không block hệ thống giao dịch; idempotent re-run.

### Ước lượng
- 50M txn/ngày, 5M account => trung bình 10 txn/account.
- Sinh 5M file trong 8 giờ (22:00-06:00) = ~173 file/s nếu đều; thực tế batch theo chi nhánh, peak cao hơn.
- Storage: 5M x 50 KB = 250 GB/ngày; 90 TB/năm. Cần lifecycle policy (hot 90 ngày, cold sau đó).
- CPU: render PDF là bottleneck; cần worker pool scale ngang.

### Kiến trúc
~~~text
Scheduler (cron 22:00)
   |
Orchestrator -> partition accounts into chunks (e.g. 10k accounts/chunk)
   |
Kafka topic: statement-tasks (partition by account range)
   |
Statement workers (render PDF/CSV, scale ngang)
   |          |
   v          v
S3 (file)   DB metadata (statement)
   |
Notification service -> email/app push "sao kê sẵn sàng"

Reporting pipeline (parallel):
OLTP primary -> CDC/replica -> Data warehouse -> Report jobs -> S3 + DB
~~~
- Tách hoàn toàn khỏi OLTP: đọc từ replica hoặc warehouse, không chạm primary.
- Workers stateless, scale theo lag.

### Mô hình dữ liệu
~~~sql
CREATE TABLE statement_job (
  id          UUID PRIMARY KEY,
  period      DATE NOT NULL,
  status      VARCHAR(20) NOT NULL,
  total       INT NOT NULL,
  done        INT NOT NULL DEFAULT 0,
  started_at  TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  UNIQUE (period)
);
CREATE TABLE statement (
  id          UUID PRIMARY KEY,
  account_id  BIGINT NOT NULL,
  period      DATE NOT NULL,
  file_key    VARCHAR(256) NOT NULL,
  checksum    VARCHAR(64) NOT NULL,
  size_bytes  BIGINT NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL,
  UNIQUE (account_id, period)
);
CREATE TABLE report (
  id          UUID PRIMARY KEY,
  type        VARCHAR(50) NOT NULL,
  period      DATE NOT NULL,
  file_key    VARCHAR(256) NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL,
  UNIQUE (type, period)
);
~~~

### Luồng sinh sao kê
1. Scheduler kích hoạt job cho kỳ sao kê.
2. Orchestrator partition danh sách account active thành chunks (10k-50k account/chunk), publish Kafka.
3. Worker consume chunk, với mỗi account:
   a. Đọc giao dịch từ warehouse/replica theo period.
   b. Render template (PDF/CSV) với versioned template.
   c. Upload S3 với key deterministic: statements/{period}/{accountId}.pdf.
   d. Insert metadata với checksum; nếu đã tồn tại (idempotent) thì skip.
4. Sau khi all chunks done, orchestrator mark job DONE.
5. Notification service gửi thông báo cho user.

### Idempotency
- Key S3 deterministic + UNIQUE (account_id, period) => re-run không tạo trùng.
- Nếu worker crash giữa chừng, re-consume task; check tồn tại trước khi render.
- Partial failure: chỉ render lại chunk thất bại, không toàn bộ.

### Template và localization
- Template lưu DB với version; thay đổi template không cần deploy.
- Hỗ trợ đa ngôn ngữ theo locale account.
- Mask thông tin nhạy cảm (số thẻ, tài khoản đối tác).
- Version template ghi vào metadata để audit.

### Reporting pipeline
- OLTP -> CDC (Debezium) -> Kafka -> warehouse (ClickHouse/BigQuery/Snowflake).
- Report jobs chạy sau khi CDC lag < threshold.
- Báo cáo tổng hợp: group by branch, product, region; pre-aggregate để nhanh.
- Reconciliation: so tổng giao dịch trong report với ledger.

### Retry và DLQ
- Worker retry với exponential backoff cho lỗi tạm thời (S3 timeout, DB lock).
- Lỗi vĩnh viễn (account không tồn tại, template lỗi) -> DLQ.
- Alert khi DLQ > 0 hoặc job chưa DONE trước 5:30 sáng.
- Có công cụ replay DLQ.

### Storage lifecycle
- Hot 90 ngày trên S3 Standard; sau đó Glacier.
- Presigned URL TTL 1-24 giờ cho download.
- Xoá theo retention policy (7-10 năm) qua lifecycle rule.

### Failure modes
| Sự cố | Ảnh hưởng | Cách xử lý |
|---|---|---|
| Worker crash | Chunk chưa xong | Re-consume, idempotent |
| S3 chậm | Upload trễ | Retry, multipart upload |
| CDC lag | Report thiếu data | Chờ lag < threshold, alert |
| Template lỗi | Toàn bộ fail | Versioning, rollback template |
| Scheduler miss | Không sinh | Alert, manual trigger |

### Giám sát
- Job progress (done/total), throughput file/s, p99 render time, CDC lag, DLQ size, deadline countdown.

> Senior tip: tôi luôn đặt deadline buffer 1 giờ (sinh xong trước 5 giờ) để còn xử lý sự cố. Và luôn có nút "re-run cho một account" để CSKH xử lý yêu cầu thủ công mà không phải re-run toàn bộ.`,

  followups: [
    'Nếu cần sao kê on-demand real-time cho một account, bạn thêm gì?',
    'Làm sao sinh sao kê cho account có hàng triệu giao dịch mà không OOM?',
    'Nếu warehouse lag 2 giờ, bạn vẫn đảm bảo deadline báo cáo thế nào?'
  ],
  related: ['design-004']
},
{
  id: 'sd-005',
  title: 'Phát hiện gian lận theo luật thời gian thực',
  kind: 'bank',
  level: 'lead',
  prompt: `Thiết kế hệ thống phát hiện gian lận (fraud detection) theo luật thời gian thực cho ngân hàng. Quy mô: 5 triệu user, 50 triệu giao dịch/ngày, phải quyết định allow/review/block trong dưới 100 ms cho giao dịch thẻ/chuyển tiền, false positive dưới 1%, false negative dưới 0,1%. Kết hợp rules engine và ML. Bạn có 45 phút.`,
  phases: [
    { name: 'Requirements', minutes: 5, guide: `Làm rõ: loại fraud (card-not-present, account takeover, money mule, AML), kênh (card, transfer, login), SLA quyết định, false positive/negative target. Non-functional: latency, throughput, availability, audit. Hỏi: blocking sync hay async review? Có human review queue? Out-of-scope: AML batch reporting (có thể nhắc).` },
    { name: 'Estimation', minutes: 5, guide: `50M txn/ngày = 578 TPS trung bình, peak 5.000 TPS. Mỗi quyết định phải <100ms. Feature store phải trả feature trong <10ms. Model inference <30ms. Kết luận: in-memory feature store + lightweight model + rules engine, không gọi DB đồng bộ.` },
    { name: 'API & data model', minutes: 5, guide: `API: POST /fraud/score {txn, context} -> {decision, score, reasons, caseId}. Bảng transaction_event, fraud_case (id, txn_id, decision, score, model_version, reasons, reviewer, resolved_at), rule (id, name, expression, enabled, version). Feature store: Redis/Feast với velocity counts.` },
    { name: 'High-level design', minutes: 15, guide: `Vẽ: Transaction service -> Fraud API -> Feature service (Redis) + Rules engine + ML model -> Decision. Async: event stream -> feature updater, case management, model training. Explain sync path (<100ms) và async path (feature update, review). Nêu vì sao tách scoring khỏi transaction.` },
    { name: 'Deep dive', minutes: 15, guide: `Đào sâu: feature engineering (velocity, device, geo), rules vs ML, threshold tuning, false positive handling, human review queue, model versioning và rollback, drift monitoring, failure modes (fail-open vs fail-closed).` }
  ],
  rubric: [
    'Phân biệt sync scoring (<100ms) và async feature update',
    'Feature store in-memory với velocity counts',
    'Rules engine + ML kết hợp, giải thích được decision',
    'Threshold tuning theo false positive/negative target',
    'Human review queue và case management',
    'Model versioning, A/B, rollback',
    'Drift monitoring và retraining pipeline',
    'Fail-open vs fail-closed có chủ đích',
    'Audit trail đầy đủ cho compliance',
    'Failure modes và degradation'
  ],
  reference: `**Tóm tắt:** Fraud detection real-time là bài toán **quyết định nhanh có giải thích được**. Sync path phải dưới 100 ms: rules engine + lightweight model trên feature store in-memory. Async path cập nhật feature, case management, training. Không bao giờ để ML là hộp đen không giải thích được trong ngân hàng.

### Yêu cầu
- 5 triệu user, 50 triệu txn/ngày, peak 5.000 TPS.
- Quyết định allow/review/block dưới 100 ms.
- False positive < 1%, false negative < 0,1%.
- Kết hợp rules và ML, tuân thủ audit.

### Ước lượng
- 50M/86.400 = 578 TPS trung bình; peak 5.000 TPS.
- Feature lookup phải < 10 ms; model inference < 30 ms; overhead < 60 ms.
- Feature store: velocity counts (1h/24h/7d) cho 5M user x nhiều chiều => hàng trăm triệu key, cần Redis Cluster sharded.

### Kiến trúc
~~~text
Transaction service
   |
   v (< 100 ms sync)
Fraud scoring API
   |         |         |
   v         v         v
Rules     Feature    ML model
engine    service    (in-process
 (Drools)  (Redis)    or sidecar)
   |         |         |
   +----+----+----+----+
        v
   Decision + reasons
        |
        +--> Transaction service (allow/block)
        +--> Case management (if review)
        +--> Event stream (async)

Async path:
Event stream -> Feature updater -> Feature store
            -> Case management -> Human review queue
            -> Model training pipeline -> Model registry
~~~

### Feature engineering
- **Velocity:** số txn và tổng tiền trong 1h/24h/7d theo user/device/merchant/IP/card.
- **Device:** fingerprint, user-agent, device age.
- **Geo:** khoảng cách giữa giao dịch liên tiếp, impossible travel.
- **Behavioural:** giờ giao dịch thường, merchant category, amount distribution.
- **Network:** IP reputation, ASN, proxy/VPN flag.
- Feature store: Redis với key pattern velocity:{dimension}:{id}:{window}, TTL theo window. Cập nhật async sau mỗi txn (eventual, chấp nhận trễ vài giây).

### Rules engine
- Rules biểu diễn bằng DSL (Drools/JsonLogic/custom), versioned, hot-reload.
- Ví dụ: if amount > 50M VND and country != user home country and device new then review.
- Rules có priority và stop conditions.
- Mỗi rule trả reason code để giải thích.

### ML model
- Lightweight model (logistic regression / small GBM / neural net quantized) chạy in-process hoặc sidecar.
- Input: feature vector từ feature store + transaction context.
- Output: score 0-1 + top contributing features (SHAP hoặc feature importance) để giải thích.
- Model version trong decision record.

### Quyết định và threshold
- score < 0.3: allow.
- 0.3-0.7: review (hold tiền, queue cho analyst).
- > 0.7: block.
- Threshold tuning theo cost: false positive cost (khách bực, CSKH) vs false negative cost (mất tiền). Điều chỉnh theo segment (VIP threshold cao hơn).
- Rules có thể override ML (ví dụ blacklist -> block ngay).

### Human review queue
- Case management system: analyst xem context, label fraud/legit.
- SLA review: 15 phút cho txn lớn, 24h cho nhỏ.
- Feedback loop: label -> training data.
- Workload balancing theo risk score.

### Model lifecycle
- Training offline trên warehouse data.
- Shadow mode: chạy model mới song song, không ảnh hưởng decision, so sánh.
- A/B: rollout % traffic, monitor metrics.
- Rollback nhanh qua model registry.
- Drift monitoring: PSI, accuracy theo tuần; alert khi drift.

### Fail-open vs fail-closed
- Fraud service down: tuỳ risk appetite. Card payment thường fail-open (không chặn thanh toán) kèm review async; transfer lớn fail-closed (chặn) an toàn hơn.
- Feature store down: dùng cached feature hoặc default rules only.
- Luôn log decision và có fallback reason.

### Audit và tuân thủ
- Lưu decision, score, model version, rule hits, features snapshot cho mỗi txn.
- Giải thích được cho khách hàng tại sao bị chặn (reason codes).
- Retention theo quy định AML (5-10 năm).
- PII masking trong log.

### Failure modes
| Sự cố | Ảnh hưởng | Cách xử lý |
|---|---|---|
| Feature store down | Không score được | Fallback rules-only, alert |
| Model latency cao | Vượt 100ms | Timeout + fallback rules, circuit breaker |
| Drift | False positive tăng | Monitor, retrain, rollback |
| Rules bug | Chặn nhầm hàng loạt | Canary rules, kill switch per rule |
| Review queue tắc | Case tồn đọng | Scale analyst, auto-approve low risk |

### Giám sát
- Decision distribution, false positive/negative (từ label), p99 latency, feature freshness, model drift, review SLA.

> Senior tip: trong ngân hàng, một model 99% chính xác nhưng không giải thích được sẽ bị từ chối bởi risk/compliance. Tôi luôn ưu tiên model đơn giản hơn nhưng có reason codes rõ ràng, và giữ rules engine như lớp bảo vệ cuối cùng có thể tắt/bật trong 1 phút.`,

  followups: [
    'Nếu fraudster thay đổi pattern sau 2 tuần, hệ thống phát hiện thế nào?',
    'Làm sao giảm false positive cho khách VIP mà không giảm bảo mật?',
    'Thiết kế A/B test cho model mới mà không rủi ro production?'
  ],
  related: ['design-005', 'security-001']
},
{
  id: 'sd-006',
  title: 'URL shortener quy mô lớn',
  kind: 'bigtech',
  level: 'senior',
  prompt: `Thiết kế URL shortener (như bit.ly) phục vụ 100 triệu URL mới mỗi tháng, đọc nhiều gấp 100 lần ghi. Yêu cầu: redirect p99 dưới 50 ms, availability 99,99%, analytics click, custom alias, TTL. Bạn có 45 phút.`,
  phases: [
    { name: 'Requirements', minutes: 5, guide: `Functional: tạo short URL (custom alias, TTL), redirect, stats, xoá. Non-functional: 100M URL/tháng = ~40 writes/s, reads 4.000/s, peak 3-5x, p99 redirect <50ms, availability 99,99%. Out-of-scope: chống phishing nâng cao, multi-region active-active ban đầu. Chốt redirect 302 để có analytics.` },
    { name: 'Estimation', minutes: 5, guide: `100M x 500 byte = 50 GB/tháng, 600 GB/năm. 7 ký tự base62 = 3,5e12 tổ hợp. Cache 20% URL nóng = 80% traffic, 1-2 triệu entry Redis. Kết luận: một Postgres đủ năm đầu, cache nóng.` },
    { name: 'API & data model', minutes: 5, guide: `API: POST /urls, GET /{code} -> 302, GET /urls/{code}/stats, DELETE. Bảng url_mapping (id, code unique, long_url, user_id, created_at, expires_at). Index user. Click event vào Kafka -> analytics DB, không vào OLTP.` },
    { name: 'High-level design', minutes: 15, guide: `Vẽ: Client -> CDN -> LB -> URL service (stateless) -> Redis (code->url) + Postgres (primary/replica) -> Kafka -> click worker -> analytics DB. Explain luồng đọc redirect và ghi click async.` },
    { name: 'Deep dive', minutes: 15, guide: `Đào sâu: sinh mã (hash vs random vs counter range allocation), cache stampede, hot URL, cache penetration, partition khi >1 tỷ URL, abuse/phishing, 301 vs 302.` }
  ],
  rubric: [
    'Ước lượng scale và storage',
    'Chiến lược sinh mã ngắn (counter range allocation)',
    'Schema với unique code và index',
    'Cache-aside với TTL jitter và null cache',
    'Redirect 302 để giữ analytics',
    'Click event bất đồng bộ qua Kafka, không block redirect',
    'Xử lý hot URL và cache stampede',
    'Partition/sharding khi vượt scale',
    'Custom alias và xử lý trùng mã',
    'Failure modes'
  ],
  reference: `**Tóm tắt:** URL shortener là bài **key-value ở quy mô lớn**: sinh mã ngắn duy nhất, tra cứu cực nhanh, ghi ít hơn đọc rất nhiều. Chọn sinh mã bằng counter phân đoạn + base62, lưu mapping trong DB có unique index, cache nóng ở Redis, redirect bằng 302 để còn analytics.

### Yêu cầu và quy mô
- 100 triệu URL mới/tháng ≈ 40 writes/s trung bình.
- Đọc gấp 100 lần ≈ 4.000 reads/s, peak 3-5 lần.
- p99 redirect < 50 ms, availability 99,99%.
- Analytics chấp nhận chậm vài phút.

### Ước lượng
- 100M x 500 byte ≈ 50 GB/tháng, ~600 GB/năm.
- 7 ký tự base62 = 62^7 ≈ 3,5 x 10^12 tổ hợp, đủ hàng chục năm.
- Cache: 20% URL nóng chiếm 80% traffic; giữ 1-2 triệu entry Redis.

### Sinh mã ngắn
1. Hash long URL: cùng URL ra cùng mã, tốt dedup, nhưng phải xử lý collision bằng salt.
2. Random 7 ký tự + retry: đơn giản, phân tán tốt, nhưng lãng phí khi kho mã bắt đầu đầy.
3. Counter toàn cục + base62: không trùng, nhưng mã đoán được; khắc phục bằng XOR với số bí mật.
Lựa chọn: **counter phân đoạn (range allocation)**. Service lấy trước 10.000 ID từ DB/Redis bằng INCRBY, phát trong bộ nhớ; process chết chỉ mất một khoảng ID.

### API
~~~text
POST /api/v1/urls  { longUrl, customAlias?, expiresAt? } -> { shortUrl, code }
GET  /{code}       -> 302 Location: longUrl
GET  /api/v1/urls/{code}/stats -> { clicks, countries, referrers }
DELETE /api/v1/urls/{code}
~~~
Mọi POST nhận Idempotency-Key.

### Data model
~~~sql
CREATE TABLE url_mapping (
  id          BIGINT PRIMARY KEY,
  code        VARCHAR(10) NOT NULL,
  long_url    TEXT NOT NULL,
  user_id     BIGINT,
  created_at  TIMESTAMPTZ NOT NULL,
  expires_at  TIMESTAMPTZ,
  UNIQUE (code)
);
CREATE INDEX idx_mapping_user ON url_mapping (user_id, created_at DESC);
~~~
Bảng click event không ở DB giao dịch: bắn vào Kafka, worker ghi sang ClickHouse/BigQuery.

### Kiến trúc
~~~text
                  +-----------+
Client --------> |   CDN     |
                  +-----------+
                        |
                  +-----------+
                  |    LB     |
                  +-----------+
                        |
             +----------+-----------+
             |      URL service     |  stateless
             +----------+-----------+
                  |            |
           +------+-----+   +--+---------+
           |   Redis    |   | Postgres   |
           | code->url  |   | primary    |
           +------------+   +--+---------+
                               |  replica
                        +------+------+
                        |  Kafka      | -> click worker -> analytics DB
                        +-------------+
~~~

### Luồng đọc
1. Chuẩn hoá code, kiểm tra định dạng.
2. Tra Redis. Hit thì redirect ngay, không chạm DB.
3. Miss thì đọc replica Postgres; nếu thấy thì set Redis TTL 24h kèm jitter.
4. Không thấy thì trả 404 và cache "null" TTL 30-60s để chặn penetration.
5. Ghi click event bất đồng bộ vào Kafka, không chặn redirect.

### 301 hay 302
- 301 (permanent): browser/CDN cache, giảm tải, nhưng mất khả năng đổi đích và thống kê.
- 302 (temporary): mỗi click qua server, tốn hơn nhưng analytics chính xác và linh hoạt.
Với sản phẩm cần số liệu, chọn 302.

### Điểm nghẽn
| Vấn đề | Triệu chứng | Giải pháp |
|---|---|---|
| Hot URL viral | Redis/DB một shard quá tải | Local cache L1 trong app + replicate key |
| Cache stampede | Nhiều request cùng đọc DB | Single-flight/mutex theo code |
| Sinh mã tranh chấp | Duplicate key khi random | Counter range allocation |
| Bảng phình to | Query chậm | Partition theo tháng hoặc hash(code) |
| Abuse/phishing | Link độc hại | Safe Browsing API, rate limit theo user/IP |

### Mở rộng
Khi vượt 1 tỷ URL: shard theo hash(code) với consistent hashing, hoặc chuyển sang KV store (DynamoDB/Cassandra) với code làm partition key. Analytics tách hoàn toàn. Multi-region: mỗi region đọc replica, ghi về primary region; chấp nhận độ trễ replication vài chục ms.

> Senior tip: điều hay bị bỏ qua nhất là custom alias và trùng mã. Người dùng nhập alias "promo2026" trong khi hệ thống vừa sinh cùng mã — phải tách namespace hoặc kiểm tra unique trên cả hai nguồn, nếu không sẽ có bug rất khó tái hiện.`,

  followups: [
    'Nếu yêu cầu 10 tỷ URL và 1 triệu reads/s, kiến trúc thay đổi thế nào?',
    'Bạn đảm bảo thống kê click không mất mát khi Kafka down ra sao?',
    'Custom alias có thể bị chiếm dụng; bạn thiết kế quy tắc đặt và thu hồi thế nào?'
  ],
  related: ['design-002']
},
{
  id: 'sd-007',
  title: 'Rate limiter phân tán',
  kind: 'bigtech',
  level: 'senior',
  prompt: `Thiết kế rate limiter phân tán cho API gateway phục vụ 10.000 service, 1 triệu request/giây, với nhiều policy (per user, per IP, per endpoint, per tenant). So sánh token bucket và sliding window, và cách triển khai nguyên tử với Redis. Limiter chết không được làm sập hệ thống. Bạn có 45 phút.`,
  phases: [
    { name: 'Requirements', minutes: 5, guide: `Functional: giới hạn theo API key/user/IP/endpoint/tenant, trả 429 + Retry-After + headers. Non-functional: overhead <2ms, availability, fail-open/fail-closed. Hỏi: policy động hay tĩnh, global hay per-region, burst allowance. Out-of-scope: WAF/DDoS layer 3/4 (có thể nhắc).` },
    { name: 'Estimation', minutes: 5, guide: `1M req/s, mỗi request một lần Redis round-trip ~0,5ms trong cùng DC => 0,5s tổng latency nếu tuần tự; cần pipeline/batch và local cache. Redis memory: mỗi key ~100 byte, 10M active key ~1 GB. Kết luận: bottleneck là Redis round-trip, không phải CPU.` },
    { name: 'API & data model', minutes: 5, guide: `API gateway config: policy (key pattern, limit, window, burst). Redis key: rate:{policy}:{key}. Lua script atomic. Response headers X-RateLimit-*. Bảng policy config trong DB, cache ở gateway.` },
    { name: 'High-level design', minutes: 15, guide: `Vẽ: Client -> LB -> Gateway (limiter middleware) -> Redis Cluster (Lua) -> upstream service. Config service push policy. Explain sync path và fail mode. Nêu local fallback bucket.` },
    { name: 'Deep dive', minutes: 15, guide: `Đào sâu: so sánh thuật toán, Lua atomic, clock Redis, hot key sharding, fail-open/fail-closed, local bucket + sync định kỳ, fairness giữa tenant, test dưới tải đồng thời.` }
  ],
  rubric: [
    'So sánh thuật toán (fixed/sliding/token bucket/leaky)',
    'Token bucket với capacity và refill rate',
    'Redis Lua script atomic, dùng thời gian Redis',
    'Hot key sharding',
    'Fail-open/fail-closed có chủ đích',
    'Local fallback limiter',
    'Response headers và Retry-After',
    'Config policy động',
    'Fairness giữa tenant',
    'Test và observability'
  ],
  reference: `**Tóm tắt:** Rate limiter bảo vệ hệ thống khỏi lưu lượng vượt sức chịu và chống abuse. Với một instance, token bucket trong bộ nhớ là đủ; với nhiều instance, cần trạng thái chia sẻ và cập nhật nguyên tử — Redis + Lua script, hoặc thuật toán xấp xỉ chấp nhận sai số để giảm round-trip.

### Yêu cầu và vị trí đặt
- Giới hạn theo API key/user/IP/endpoint/tenant, ví dụ 100 req/phút cho user thường, 10.000 cho partner.
- Độ trễ thêm mỗi request < 2 ms; limiter chết không làm sập hệ thống.
- Trả 429 Too Many Requests kèm Retry-After, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset.
- Đặt ở API gateway để chặn sớm.

### So sánh thuật toán
| Thuật toán | Cách hoạt động | Ưu | Nhược |
|---|---|---|---|
| Fixed window | Đếm trong mỗi phút, reset đầu phút | Rẻ, dễ hiểu | Burst gấp đôi ở biên |
| Sliding window log | Lưu timestamp từng request | Chính xác nhất | Tốn bộ nhớ O(số request) |
| Sliding window counter | Nội suy giữa window trước và hiện tại | Rẻ, mượt | Xấp xỉ, sai số nhỏ |
| Token bucket | Xô chứa N token, nạp r token/giây | Cho phép burst có kiểm soát | Cần lưu 2 biến |
| Leaky bucket | Hàng đợi xả đều | Làm mượt đầu ra | Thêm độ trễ |

Với API, token bucket thường tốt nhất vì traffic thật có burst.

### Token bucket
Mỗi key có capacity (burst tối đa) và refillRate (token/giây). Request đến:
1. elapsed = now - lastRefill.
2. tokens = min(capacity, tokens + elapsed * refillRate).
3. Nếu tokens >= cost thì trừ và cho qua; ngược lại chặn.

### Triển khai với Redis (Lua atomic)
~~~text
-- KEYS[1] = rate:user:123 ; ARGV = capacity, refill, now_ms, cost
local data = redis.call('HMGET', KEYS[1], 'tokens', 'ts')
local tokens = tonumber(data[1])
local ts = tonumber(data[2])
local now = tonumber(ARGV[3])
if tokens == nil then tokens = tonumber(ARGV[1]); ts = now end
local refill = (now - ts) / 1000.0 * tonumber(ARGV[2])
tokens = math.min(tonumber(ARGV[1]), tokens + refill)
local cost = tonumber(ARGV[4])
local allowed = 0
if tokens >= cost then tokens = tokens - cost; allowed = 1 end
redis.call('HSET', KEYS[1], 'tokens', tokens, 'ts', now)
redis.call('PEXPIRE', KEYS[1], 86400000)
return { allowed, math.floor(tokens) }
~~~
- Dùng thời gian của Redis (TIME) thay vì đồng hồ app.
- TTL phải lớn hơn thời gian đầy xô.
- Mỗi request một lần Redis ~0,3-1 ms trong cùng DC.

### Hot key và sharding
Một key partner 500k req/s biến một key Redis thành điểm nghẽn:
- Tách quota thành N bộ đếm con (rate:key:0..N-1), chọn random/hash; tổng quota đúng xấp xỉ.
- Cache quyết định trong thời gian rất ngắn (10 ms) cho key nóng.

### Limiter chết thì sao
- Fail-open: cho request đi qua khi Redis không truy cập được. Phù hợp API đọc.
- Fail-closed: chặn toàn bộ. An toàn cho tài chính nhưng biến sự cố Redis thành sự cố toàn hệ thống.
- Thực tế: fail-open kèm local fallback limiter (bucket trong bộ nhớ mỗi instance với quota chia đều).

### Local bucket + đồng bộ định kỳ
Mỗi 100 ms xin một phần quota từ Redis; chấp nhận vượt nhẹ nhưng giảm tải Redis hàng chục lần. Phù hợp khi latency là ưu tiên.

### Fairness giữa tenant
- Quota theo tier; tenant lớn có bucket riêng.
- Khi một tenant chiếm hết quota cụm, dùng per-tenant bucket và priority queue.
- Global vs per-region: per-region đơn giản hơn, global chính xác hơn nhưng tốn round-trip.

### Trả lỗi tử tế
Ngoài 429, trả thời gian chờ và hướng dẫn. Client tốt sẽ backoff theo Retry-After.

### Giám sát
- Rate limit hit rate theo policy, Redis latency, fail-open count, hot key top, DLQ (không có).

> Senior tip: đừng đặt rate limit theo user ID nếu chưa xác thực, vì kẻ tấn công tạo hàng triệu tài khoản. Luôn có thêm lớp theo IP và endpoint; và nhớ NAT công ty có thể khiến hàng nghìn người dùng chung một IP — giới hạn theo IP phải rộng hơn nhiều so với theo user.`,

  followups: [
    'Bạn xử lý công bằng khi một tenant chiếm hết quota của cụm thế nào?',
    'Nếu cần giới hạn theo cửa sổ trượt chính xác tuyệt đối, bạn chọn cấu trúc dữ liệu gì?',
    'Làm sao test rate limiter dưới tải đồng thời cao mà không bị flaky?'
  ],
  related: ['design-003']
},
{
  id: 'sd-008',
  title: 'News feed cho mạng xã hội',
  kind: 'bigtech',
  level: 'senior',
  prompt: `Thiết kế news feed cho mạng xã hội. Quy mô: 50 triệu DAU, 5 triệu bài mới/ngày, mỗi người follow trung bình 200, đọc 20 lần/ngày/người. p99 tải feed dưới 300 ms. Xử lý celebrity (50 triệu follower) và ranking. Bạn có 45 phút.`,
  phases: [
    { name: 'Requirements', minutes: 5, guide: `Functional: xem feed người follow, sắp theo thời gian hoặc relevance, phân trang, thấy bài mới trong vài giây, xoá bài biến mất. Non-functional: 50M DAU, 5M posts/ngày, reads ~11.500/s trung bình peak 50k, p99 <300ms, eventual consistency vài giây. Hỏi: ranking hay chronological, media, ads. Out-of-scope: search, messaging.` },
    { name: 'Estimation', minutes: 5, guide: `Write amplification: 5M bài x 200 follower = 1 tỷ bản ghi feed/ngày. Celebrity 50M follower = 50M bản ghi/bài, không thể push. Storage feed cache: 1 tỷ x 100 byte = 100 GB/ngày. Kết luận: hybrid push/pull.` },
    { name: 'API & data model', minutes: 5, guide: `API: GET /feed?cursor, POST /posts. Feed cache Redis ZSET (score=timestamp, member=postId). Post table. Follow table. Celebrity list cache. Cursor pagination (score, postId).` },
    { name: 'High-level design', minutes: 15, guide: `Vẽ: Post service -> Kafka (post-created) -> Fan-out worker -> push vào feed cache của follower thường; celebrity chỉ ghi 1 bản. Feed service merge pushed feed + celebrity posts khi đọc. Explain luồng ghi/đọc và phân trang.` },
    { name: 'Deep dive', minutes: 15, guide: `Đào sâu: ngưỡng celebrity động, ranking pipeline, xoá/sửa bài, rebuild cache, hot key, phân trang cursor, consistency.` }
  ],
  rubric: [
    'Ước lượng write amplification',
    'So sánh fan-out on write vs read',
    'Kiến trúc hybrid với ngưỡng celebrity',
    'Feed cache Redis sorted set với trim',
    'Cursor pagination ổn định',
    'Merge pushed + celebrity posts khi đọc',
    'Hydrate batch tránh N+1',
    'Xử lý xoá/sửa bài',
    'Ranking pipeline tách khỏi storage',
    'Failure modes và rebuild'
  ],
  reference: `**Tóm tắt:** News feed là bài toán **đọc cực nhiều, ghi có hệ quả lan rộng**. Fan-out on write (push) cho đọc nhanh nhưng ghi đắt; fan-out on read (pull) ghi rẻ nhưng đọc đắt. Hệ thống thực tế dùng hybrid: push cho người dùng thường, pull và merge cho celebrity.

### Yêu cầu và quy mô
- 50 triệu DAU, 5 triệu bài mới/ngày, trung bình 200 follow.
- Đọc 20 lần/ngày/người ≈ 11.500 reads/s trung bình, peak 50k.
- p99 tải feed < 300 ms, eventual consistency vài giây.

### Ước lượng write amplification
- Một người 1.000 follower đăng bài = 1.000 bản ghi feed.
- 5 triệu bài x 200 follower = 1 tỷ bản ghi feed/ngày.
- Celebrity 50 triệu follower: 50 triệu bản ghi/bài — không thể push.
- Storage feed cache: 1 tỷ x 100 byte = 100 GB/ngày.

### Hai mô hình
| Tiêu chí | Fan-out on write (push) | Fan-out on read (pull) |
|---|---|---|
| Ghi | Đắt, lan rộng theo follower | Rẻ, chỉ ghi bài gốc |
| Đọc | Rất nhanh, danh sách có sẵn | Chậm, phải merge nhiều nguồn |
| Độ trễ thấy bài mới | Vài giây | Gần như tức thì |
| Celebrity | Thảm hoạ write amplification | Tự nhiên xử lý tốt |
| Lưu trữ | Lớn gấp hàng trăm lần | Nhỏ |
| Xoá/sửa | Phải lan truyền | Chỉ sửa bản gốc |

### Kiến trúc hybrid
~~~text
Post service -> Kafka (post-created)
                     |
             Fan-out worker
              /            \
    follower < 10k      follower >= 10k
         |                     |
   push vào feed cache     đánh dấu "celebrity post"
   của từng follower       (chỉ ghi 1 bản)
         |                     |
         +--------+------------+
                  |
         Feed service khi đọc:
         1. lấy feed đã push từ Redis (ZSET)
         2. lấy bài mới của các celebrity đang follow
         3. merge theo timestamp, phân trang
~~~
- Feed cache: Redis sorted set, key = feed:userId, score = timestamp, member = postId, trim còn 800-1.000 bài.
- Fan-out worker scale ngang theo partition của userId; xử lý batch để giảm round-trip.

### Luồng ghi
1. Đăng bài: Post service lưu bài, phát event post-created.
2. Fan-out worker đọc danh sách follower (cache).
3. Follower thường: ZADD feed:userId timestamp postId cho từng người, pipeline theo lô 500.
4. Celebrity: không push; ghi vào recent posts của tác giả.
5. Người dùng online có thể nhận realtime qua WebSocket, nhưng feed vẫn nhất quán dần.

### Luồng đọc
1. Lấy N bài mới nhất từ feed ZSET.
2. Lấy bài mới của celebrity mà user follow, giới hạn thời gian.
3. Merge hai danh sách, loại trùng, lấy đủ số cho trang.
4. Hydrate thông tin bài (nội dung, tác giả, media) từ cache/DB theo batch.
5. Trả cursor là (score, postId).

### Phân trang
Không dùng offset vì feed thay đổi liên tục gây trùng/sót. Dùng cursor dựa trên score + id: score < lastScore OR (score = lastScore AND id < lastId).

### Xoá và sửa bài
- Xoá: đánh dấu deleted ở bài gốc; feed lọc khi hydrate. Với push, chấp nhận bài đã xoá còn trong cache đến TTL, hoặc phát event xoá.
- Sửa nội dung: chỉ sửa bản gốc, feed chỉ lưu id nên tự động đúng — lợi ích lớn của việc feed lưu con trỏ.

### Ranking
Feed theo thời gian là mặc định. Với feed xếp hạng:
1. Candidate generation: lấy vài trăm bài từ push/pull/trending.
2. Scoring: feature (độ mới, tương tác, quan hệ, loại nội dung) qua mô hình.
3. Re-ranking: diversity, chặn trùng, quảng cáo.
Tách ranking khỏi storage; cache kết quả ngắn hạn. Không chạy model nặng trong request đồng bộ.

### Sự cố
| Sự cố | Nguyên nhân | Giảm thiểu |
|---|---|---|
| Fan-out chậm | Celebrity hoặc worker tắc | Ngưỡng celebrity, batch, backpressure |
| Feed trống | Redis mất dữ liệu | Fallback DB + rebuild on demand |
| Bài trùng | Merge push và pull | Dedup theo postId |
| Hot key | Một user đọc liên tục | Cache L1, replicate |
| Xoá không lan toả | Cache còn id cũ | Lọc khi hydrate, TTL ngắn |

> Senior tip: ngưỡng celebrity không nên cố định cứng 10k. Tôi từng thấy tài khoản 8k follower nhưng bài viral nhận 2 triệu tương tác, làm worker fan-out nghẽn cả hàng đợi. Hãy dùng ngưỡng động theo tải thực tế và luôn có cơ chế tắt push cho một tài khoản cụ thể.`,

  followups: [
    'Nếu sản phẩm yêu cầu feed nhất quán tức thì khi follow/unfollow, bạn xử lý ra sao?',
    'Bạn thiết kế rebuild feed khi Redis mất toàn bộ dữ liệu mà không sập hệ thống?',
    'Làm sao cá nhân hoá feed mà vẫn giữ p99 dưới 300 ms?'
  ],
  related: ['design-007']
},
{
  id: 'sd-009',
  title: 'Chat 1-1 và nhóm thời gian thực',
  kind: 'bigtech',
  level: 'senior',
  prompt: `Thiết kế hệ thống chat thời gian thực hỗ trợ 1-1 và nhóm. Quy mô: 10 triệu user đồng thời, 1-3 connection/user, p99 gửi tới người nhận dưới 200 ms, không mất tin nhắn, lịch sử tải dưới 500 ms cho 50 tin gần nhất. Xử lý mất kết nối, gửi trùng, nhóm lớn 100k thành viên. Bạn có 45 phút.`,
  phases: [
    { name: 'Requirements', minutes: 5, guide: `Functional: chat 1-1 và nhóm, gửi/nhận tức thì, trạng thái đã đọc, online/offline, lịch sử, đính kèm file, push khi offline. Non-functional: 10M concurrent, p99 <200ms, không mất tin, history <500ms. Chấp nhận: thứ tự chỉ trong conversation, presence trễ vài giây, trùng hiếm. Out-of-scope: E2EE (có thể nhắc), voice/video.` },
    { name: 'Estimation', minutes: 5, guide: `10M user x 1-3 conn = 10-30M connection. Mỗi gateway 100k-500k conn. Cần 20-300 gateway node. Tin nhắn: giả sử 100M/ngày = 1157/s trung bình, peak 10k/s. Storage: 100M x 500 byte = 50 GB/ngày. Kết luận: gateway giữ socket, registry tập trung nhỏ, storage wide-column.` },
    { name: 'API & data model', minutes: 5, guide: `WebSocket protocol: send {clientMsgId, conversationId, body}, ack, reconnect {lastSeq}. Storage: conversation_id partition, seq clustering. Bảng message (conversation_id, seq, message_id, sender_id, type, body, created_at). Unique (conversation_id, client_msg_id).` },
    { name: 'High-level design', minutes: 15, guide: `Vẽ: Client ==WS==> Gateway (giữ socket) -> Session registry (Redis) -> Message service -> DB (wide-column) + Kafka -> Gateway đích -> client. Presence service. Explain định tuyến và luồng gửi tin.` },
    { name: 'Deep dive', minutes: 15, guide: `Đào sâu: sequence number bền, chống trùng/at-least-once, reconnect sync, nhóm lớn pull model, presence scale, failure modes, file storage.` }
  ],
  rubric: [
    'WebSocket gateway scale và session registry',
    'Định tuyến tin giữa gateway',
    'Sequence number trong conversation (bền)',
    'Storage wide-column partition theo conversation',
    'At-least-once + client dedup',
    'Ack 2 chiều và reconnect sync',
    'Presence scale (không broadcast toàn danh bạ)',
    'Nhóm lớn dùng pull model',
    'File/media qua object storage',
    'Failure modes'
  ],
  reference: `**Tóm tắt:** Chat realtime gồm ba phần độc lập: kết nối (WebSocket gateway giữ hàng triệu connection), định tuyến (biết user đang ở gateway nào), và lưu trữ (append tin nhắn theo conversation). Thứ tự chỉ cần đảm bảo trong từng cuộc hội thoại; gửi tin dùng at-least-once + client dedup.

### Yêu cầu và quy mô
- 10 triệu user đồng thời, 1-3 connection/user.
- p99 gửi tới người nhận < 200 ms, không mất tin nhắn.
- Lịch sử tải < 500 ms cho 50 tin gần nhất.
- Nhóm lớn 100k thành viên.

### Kết nối: WebSocket gateway
~~~text
Client ==WebSocket==> Gateway node (giữ socket)
                          |
                     Session registry (Redis):
                     userId -> [gatewayId, connId]
                          |
               +----------+----------+
               |                     |
         Message service        Presence service
               |
         Kafka / Redis Stream
               |
         Gateway đích -> đẩy xuống socket
~~~
- Gateway không chứa business logic; chỉ xác thực, giữ socket, đăng ký session, chuyển tin.
- Mỗi gateway 100k-500k connection tuỳ RAM và file descriptor; scale ngang.
- Sticky session ở LB hoặc shared registry.
- Heartbeat ping/pong mỗi 30 giây; quá 60 giây không phản hồi thì đóng socket và xoá session.

### Presence
Không broadcast trạng thái mỗi lần online cho toàn danh bạ:
- Ghi presence:userId = online với TTL 60 giây, refresh theo heartbeat.
- Người xem presence chỉ query cho những người đang mở khung chat.
- Chuyển offline phát event cho subscriber (bạn bè đang mở chat).
- Đa thiết bị: online nếu ít nhất một session còn sống.

### Thứ tự tin nhắn
Chỉ cần trong một conversation:
1. Message service nhận tin, gán sequence number tăng dần cho conversation (Redis INCR conv:seq:<id>, nhưng phải bền; an toàn hơn: DB/allocator cấp sequence bền).
2. Lưu tin với (conversation_id, seq) là khoá duy nhất.
3. Client hiển thị theo seq; nếu thiếu seq thì yêu cầu bù (gap detection).
Không dùng timestamp client vì đồng hồ điện thoại sai.

### Lưu trữ
Mẫu truy cập luôn là "lấy N tin gần nhất của một conversation". Chọn wide-column (Cassandra/ScyllaDB) hoặc Postgres partition:
~~~text
partition key: conversation_id
clustering key: seq DESC
columns: message_id, sender_id, type, body, created_at, edited_at
~~~
- Đọc 50 tin gần nhất là range scan nhỏ.
- Conversation nhóm lớn vẫn một partition; nếu quá lớn thì tách theo tháng.
- File/ảnh lưu S3, tin nhắn chỉ lưu metadata và URL đã ký.

### Luồng gửi tin
1. Client sinh clientMsgId (UUID) và gửi qua WebSocket kèm conversationId.
2. Gateway chuyển sang Message service.
3. Message service kiểm tra quyền, chống spam, cấp seq, ghi DB, trả ack cho sender.
4. Phát event message-created tới các gateway đang giữ session của thành viên.
5. Gateway đẩy xuống client; client gửi ack; nếu không có ack sau timeout, gateway thử lại.
6. Người dùng offline: lưu hộp thư chờ và gửi push notification.

### Chống trùng và mất tin
- At-least-once ở mọi chặng. Client dedup theo clientMsgId; server lưu unique (conversation_id, client_msg_id).
- Ack 2 chiều: server ack khi đã ghi bền; client hiển thị trạng thái "đang gửi/đã gửi".
- Reconnect: client gửi lastSeq đã nhận; server trả các tin từ lastSeq+1 (giới hạn số lượng, nếu quá nhiều thì tải theo trang).
- Không cần exactly-once: trùng hiếm và dedup rẻ hơn.

### Nhóm lớn
Nhóm 100k thành viên (kênh cộng đồng) không thể fan-out từng người. Dùng pull cho nhóm lớn: ghi một bản vào conversation, client online nhận thông báo "có tin mới" rồi tự tải. Với nhóm nhỏ, push trực tiếp để độ trễ thấp.

### Failure modes
| Sự cố | Ảnh hưởng | Cách xử lý |
|---|---|---|
| Gateway chết | Mất socket | Client reconnect backoff + jitter, LB chuyển node |
| Session registry cũ | Tin đẩy nhầm node | TTL ngắn, xoá khi đóng socket, fallback hỏi lại |
| Redis seq mất | Trùng/lùi seq | Sequence bền từ DB, hoặc rebuild |
| Consumer chậm | Tin đến trễ | Scale consumer, backpressure, ưu tiên 1-1 |
| Spam/flood | Quá tải | Rate limit theo user, chặn trước khi cấp seq |

### Giám sát
- Active connections, message throughput, p99 delivery latency, reconnect rate, queue lag, push notification success.

> Senior tip: đừng cố làm WebSocket "stateless" bằng cách đẩy mọi thứ qua database — bạn sẽ tạo ra hàng triệu query mỗi giây. Cái cần là registry tập trung nhỏ (user đang ở gateway nào) cộng với gateway giữ socket trong RAM; đó là mô hình đã được chứng minh ở quy mô hàng chục triệu kết nối.`,

  followups: [
    'Mã hoá đầu cuối (E2EE) ảnh hưởng gì tới kiến trúc?',
    'Làm sao đảm bảo thứ tự tin nhắn khi một conversation bị di chuyển giữa các shard?',
    'Nếu cần tìm kiếm toàn văn trong lịch sử chat, bạn tích hợp kho nào và đồng bộ ra sao?'
  ],
  related: ['design-008']
},
{
  id: 'sd-010',
  title: 'Notification đa kênh quy mô lớn',
  kind: 'bigtech',
  level: 'senior',
  prompt: `Thiết kế notification service gửi email/SMS/push/in-app cho hàng triệu người dùng. Quy mô: 1 triệu thông báo/ngày, peak 10k/phút, OTP p99 dưới 3 giây end-to-end, không mất thông báo giao dịch, marketing có thể trễ. Provider bên thứ ba có rate limit và có lúc down. Tránh gửi trùng. Bạn có 45 phút.`,
  phases: [
    { name: 'Requirements', minutes: 5, guide: `Functional: gửi email/SMS/push/in-app, template có biến, preference người dùng, lịch sử, huỷ thông báo chưa gửi. Non-functional: 1M/ngày, peak 10k/phút, OTP p99 <3s, không mất giao dịch, marketing trễ được. Ràng buộc: provider rate limit và down. Out-of-scope: content personalization ML (có thể nhắc).` },
    { name: 'Estimation', minutes: 5, guide: `1M/ngày = 11,5/s trung bình, peak 10k/phút = 167/s. OTP phải <3s nên high priority queue riêng. Storage: 1M x 1KB = 1 GB/ngày. Kết luận: bottleneck là provider rate limit, không phải infra; tách priority queue là bắt buộc.` },
    { name: 'API & data model', minutes: 5, guide: `API: POST /notifications (202), GET /notifications/{id}. Bảng notification (id, user_id, channel, template_code, payload, dedup_key, priority, status, attempts, next_retry_at). Unique (dedup_key, channel). Template table versioned. Preference table.` },
    { name: 'High-level design', minutes: 15, guide: `Vẽ: Service -> Notification API -> DB -> Priority router -> Kafka topics (high/normal/low) -> Channel workers -> Provider adapters -> Delivery status. Explain vì sao API chỉ trả 202 và không gọi provider đồng bộ.` },
    { name: 'Deep dive', minutes: 15, guide: `Đào sâu: priority tách topic, retry backoff + jitter, dedup 3 lớp, provider failover, quiet hours, DLQ, monitoring.` }
  ],
  rubric: [
    'API chỉ nhận và trả 202, không gọi provider đồng bộ',
    'Tách priority queue (topic riêng) cho OTP',
    'Dedup theo dedup_key unique',
    'Retry exponential backoff + jitter, phân biệt lỗi tạm thời/vĩnh viễn',
    'DLQ và replay tool',
    'Provider failover với circuit breaker',
    'Template versioned và escape nội dung',
    'Preference và quiet hours',
    'Monitoring queue lag và delivery rate',
    'Failure modes'
  ],
  reference: `**Tóm tắt:** Notification service là hệ thống **gửi đi, chấp nhận at-least-once**, cần hàng đợi theo kênh và ưu tiên, retry có backoff, dedup theo sự kiện, và tách biệt hoàn toàn khỏi luồng nghiệp vụ chính. OTP của người dùng không được xếp sau chiến dịch marketing.

### Yêu cầu và quy mô
- 1 triệu thông báo/ngày, peak 10k/phút.
- OTP p99 < 3 giây end-to-end.
- Không mất thông báo giao dịch; marketing có thể trễ.
- Provider có rate limit và có lúc down.

### Ước lượng
- 1M/ngày = 11,5/s trung bình, peak 167/s.
- OTP phải <3s nên high priority queue riêng, không chung với marketing.
- Storage: 1M x 1KB = 1 GB/ngày.
- Bottleneck là provider rate limit, không phải infra.

### Kiến trúc
~~~text
Service A --\
Service B ---> Notification API -> DB (notification, template)
Service C --/         |
                      v
                Priority router
             /        |         \
        high(OTP)   normal      low(marketing)
             \\        |         /
              Kafka topics (3 mức)
                    |
              Channel workers (email/sms/push)
                    |
              Provider adapters (SES, Twilio, FCM)
                    |
              Delivery status -> DB + webhook
~~~
API chỉ nhận và trả 202, không gọi provider đồng bộ.

### Mô hình dữ liệu
~~~sql
CREATE TABLE notification (
  id            UUID PRIMARY KEY,
  user_id       BIGINT NOT NULL,
  channel       VARCHAR(10) NOT NULL,
  template_code VARCHAR(50) NOT NULL,
  payload       JSONB NOT NULL,
  dedup_key     VARCHAR(200) NOT NULL,
  priority      SMALLINT NOT NULL,
  status        VARCHAR(20) NOT NULL,
  attempts      INT NOT NULL DEFAULT 0,
  next_retry_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uk_notif_dedup ON notification (dedup_key, channel);
~~~
dedup_key ví dụ order-paid:12345:email — cùng sự kiện nghiệp vụ chỉ tạo một thông báo mỗi kênh.

### Ưu tiên
Ba topic riêng, ba nhóm worker riêng:
- High: OTP, cảnh báo bảo mật, giao dịch tiền. Không bao giờ bị marketing chặn.
- Normal: xác nhận đơn, nhắc lịch.
- Low: khuyến mãi, bản tin. Có thể trễ vài giờ.
Nếu dùng chung một queue với priority field, marketing ùa vào sẽ làm OTP chờ — lỗi kinh điển.

### Retry
- Retry chỉ với lỗi tạm thời: timeout, 429, 5xx. Lỗi vĩnh viễn (email sai, 4xx) thì FAILED, không retry.
- Exponential backoff + jitter: 1s, 5s, 30s, 2m, 10m.
- Giới hạn 5-8 lần rồi đẩy DLQ. DLQ phải có người xem và công cụ replay.
- Worker tự điều tiết theo token bucket để không bị provider trả 429.

### Chống gửi trùng
At-least-once nên trùng là khả năng thực tế. Ba lớp:
1. Unique dedup_key khi nhận sự kiện — chặn trùng ở nguồn.
2. Trước khi gọi provider, đánh dấu SENDING bằng conditional update; nếu đã SENDING/SENT thì bỏ qua.
3. Provider idempotency key riêng nếu hỗ trợ.

### Template và nội dung
- Template lưu DB, có version; thay đổi không cần deploy.
- Render với dữ liệu đã kiểm tra; escape nội dung người dùng để tránh injection vào HTML email.
- Đa ngôn ngữ theo locale.
- Giới hạn độ dài SMS, cắt an toàn theo ký tự Unicode.

### Tuỳ chọn người dùng và quy định
- Bảng preference theo user_id, channel, category; tôn trọng opt-out ngay.
- Quiet hours: không gửi marketing ban đêm theo múi giờ người dùng.
- Ghi log ai đã đồng ý nhận gì, khi nào.

### Provider failover
Mỗi kênh nên có ít nhất hai provider. Adapter interface chung; khi provider chính lỗi liên tiếp (circuit breaker mở), chuyển provider phụ. Failover phải có cảnh báo để không âm thầm đốt tiền.

### Theo dõi
Các chỉ số: queue lag theo priority, tỉ lệ thành công theo provider, p99 độ trễ, DLQ size, bounce/complaint rate của email.

> Senior tip: OTP là thứ tôi luôn tách hẳn khỏi hệ thống thông báo thường, đôi khi dùng luồng riêng với provider riêng. Một chiến dịch marketing gửi nhầm 2 triệu email có thể làm nghẽn queue và khiến OTP trễ 10 phút — đó là sự cố làm người dùng không đăng nhập được, không phải chỉ là email chậm.`,

  followups: [
    'Bạn thiết kế cơ chế huỷ (cancel) thông báo đã vào queue thế nào?',
    'Nếu provider chính tăng giá gấp ba, kiến trúc giúp bạn chuyển đổi ra sao?',
    'Làm sao đo chất lượng gửi email mà không đọc nội dung người dùng?'
  ],
  related: ['design-006']
},
{
  id: 'sd-011',
  title: 'Đặt vé concert có chọn chỗ ngồi',
  kind: 'bigtech',
  level: 'senior',
  prompt: `Thiết kế hệ thống bán vé concert cho phép **chọn chỗ ngồi** trên sơ đồ. Sân có 50.000 ghế, lúc mở bán có 500.000 người vào cùng lúc. Người dùng giữ ghế trong 10 phút để thanh toán; hết giờ ghế được trả lại. Tuyệt đối không bán một ghế cho hai người, và hệ thống không được sập trong 15 phút đầu. Bạn có 45 phút.`,
  phases: [
    { name: 'Requirements', minutes: 5, guide: `Functional: xem sơ đồ ghế, giữ 1–6 ghế, thanh toán, nhận vé. Non-functional: không oversell (consistency mạnh ở ghế), chịu spike 500k người, sơ đồ ghế được phép trễ vài giây. Hỏi: giới hạn số ghế mỗi người, có hàng chờ ảo (waiting room) không, thời gian giữ ghế, có bán lại vé không. Out-of-scope: chống bot nâng cao, resale.` },
    { name: 'Estimation', minutes: 5, guide: `500k người refresh sơ đồ mỗi 5 giây => 100k req/s đọc. Sơ đồ 50k ghế, mỗi ghế 1 bit trạng thái ~6,25 KB; kèm metadata ~10 KB => 100k x 10 KB = 1 GB/s. Ghi: nếu không có waiting room, ~25k lần giữ ghế/giây; có waiting room cho vào 2.000 người/phút thì chỉ ~100 lần/giây. Dữ liệu ghế: 50k dòng x 100 B = 5 MB, rất nhỏ.` },
    { name: 'API & data model', minutes: 5, guide: `GET /events/{id}/seatmap?section=A (cache được), POST /holds {eventId, seatIds[], Idempotency-Key} -> holdId + expiresAt, POST /orders {holdId} -> thanh toán, DELETE /holds/{id}. Bảng seats(event_id, seat_id, status, hold_id, held_until, version), holds, orders. Ràng buộc: PK (event_id, seat_id).` },
    { name: 'High-level design', minutes: 15, guide: `Vẽ: CDN -> waiting room -> API gateway -> Seat service (DB là nguồn sự thật) -> Payment service; seat map snapshot đẩy lên cache/CDN mỗi 1–2 giây; job/consumer xử lý thanh toán thành công sau khi hold đã hết hạn.` },
    { name: 'Deep dive', minutes: 15, guide: `Đào sâu: giữ nhiều ghế nguyên tử (UPDATE có điều kiện hoặc Lua), hết hạn lazy thay vì cron, thanh toán về muộn, waiting room công bằng, bot, hot section, consistency giữa sơ đồ và thực tế.` }
  ],
  rubric: [
    'Chốt yêu cầu: không oversell, thời gian giữ ghế, giới hạn ghế mỗi người',
    'Ước lượng đọc sơ đồ và nhận ra đọc lớn hơn ghi rất nhiều',
    'Waiting room giới hạn tốc độ vào để biến spike thành luồng đều',
    'Giữ nhiều ghế nguyên tử bằng UPDATE có điều kiện (kiểm tra số dòng) hoặc Lua script',
    'Hết hạn giữ ghế theo held_until (lazy), không phụ thuộc cron chính xác',
    'Sơ đồ ghế là bản cache gần đúng; nguồn sự thật là thao tác giữ ghế',
    'Xử lý thanh toán thành công sau khi hold hết hạn (refund hoặc giữ lại có điều kiện)',
    'Idempotency cho tạo hold và thanh toán',
    'Chống bot và giới hạn mỗi người',
    'Giám sát: tỉ lệ giữ ghế thất bại, độ dài hàng chờ, oversell = 0'
  ],
  reference: `**Tóm tắt:** Bài này có hai bài toán khác nhau: **đọc** sơ đồ ghế rất nhiều (chấp nhận trễ vài giây, phục vụ từ cache/CDN) và **ghi** giữ ghế rất ít nhưng phải đúng tuyệt đối (một câu UPDATE có điều kiện trên DB). Thêm **waiting room** để 500k người không ập vào cùng lúc; giữ ghế bằng {{held_until}} để ghế tự "nhả" mà không cần cron.

### 1. Yêu cầu
- Xem sơ đồ ghế theo khu (section), chọn 1–6 ghế, giữ 10 phút, thanh toán, nhận vé.
- **Không oversell**: một ghế chỉ thuộc một đơn hàng. Đây là yêu cầu consistency mạnh, nhưng chỉ ở mức từng ghế.
- Sơ đồ ghế được phép trễ 1–3 giây: nếu người dùng thấy ghế "trống" nhưng bấm vào thì báo "vừa có người giữ" là chấp nhận được.
- Chịu được 500k người trong 15 phút đầu.

### 2. Ước lượng (có phép tính)
| Đại lượng | Phép tính | Kết quả |
|---|---|---|
| Đọc sơ đồ | 500.000 người / refresh 5 giây | 100.000 req/s |
| Kích thước sơ đồ | 50.000 ghế x 1 bit = 6,25 KB, thêm metadata | ~10 KB |
| Băng thông sơ đồ | 100.000 x 10 KB | ~1 GB/s (~8 Gbps) => bắt buộc CDN/chia theo khu |
| Giữ ghế nếu không có hàng chờ | 500k người, ~3 lần thử trong 1 phút đầu | ~25.000 lần/s |
| Giữ ghế có waiting room | 2.000 người/phút x 3 lần thử / 60 giây | ~100 lần/s |
| Thời gian bán hết | 50.000 ghế / 2,5 ghế mỗi đơn = 20.000 đơn; 2.000 người/phút x 70% mua thành công = 1.400 đơn/phút | ~14 phút |
| Lưu trữ ghế | 50.000 dòng x 100 B | 5 MB |

Kết luận: dữ liệu nhỏ, cái khó là **đỉnh tải** và **tranh chấp cùng một ghế**. Waiting room giảm tải ghi 250 lần (25.000 => 100/s), một Postgres thường xử lý thoải mái.

### 3. Kiến trúc
~~~text
 Người dùng
    |
    v
 [CDN] -- seatmap snapshot (JSON theo section, TTL 2s) <-- [Snapshot builder]
    |                                                          ^ đọc DB mỗi 1-2s
    v                                                          |
 [Waiting room] -- token "được vào" (ký HMAC, hết hạn 15 phút) |
    |                                                          |
    v                                                          |
 [API gateway] -> [Seat service] --UPDATE có điều kiện--> [Postgres: seats, holds, orders]
                        |                                       ^
                        v                                       |
                  [Payment service] --webhook--> [Order consumer]
~~~
- **Waiting room**: người dùng vào hàng (Redis list hoặc sorted set theo thời điểm vào), mỗi phút cấp token cho 2.000 người đầu hàng. Token ký HMAC nên gateway kiểm tra không cần gọi DB.
- **Seat map**: không query DB cho mỗi người xem. Một job đọc trạng thái mỗi 1–2 giây, tạo file JSON theo section, đẩy lên cache/CDN.

### 4. Giữ ghế nguyên tử (trái tim của bài)
~~~sql
-- Giữ 3 ghế cùng lúc: hoặc được cả 3, hoặc không được ghế nào
UPDATE seats
SET status = 'HELD', hold_id = :holdId, held_until = now() + interval '10 minutes'
WHERE event_id = :eventId
  AND seat_id IN (:s1, :s2, :s3)
  AND (status = 'AVAILABLE' OR (status = 'HELD' AND held_until < now()));
-- Ứng dụng kiểm tra số dòng bị ảnh hưởng: khác 3 => ROLLBACK cả transaction
~~~
**Vì sao đúng?** Postgres khoá từng dòng được UPDATE. Hai người cùng giữ ghế A12: người đến sau phải chờ khoá, sau đó điều kiện WHERE được kiểm tra lại trên dữ liệu mới (READ COMMITTED re-check), thấy status = HELD nên không cập nhật => số dòng = 2 thay vì 3 => rollback. Không cần distributed lock.

**Vì sao dùng held_until thay vì cron nhả ghế?** Cron chạy mỗi phút thì ghế bị "kẹt" thêm tới 1 phút, và cron chết thì ghế kẹt mãi. Điều kiện held_until < now() làm ghế hết hạn ngay khi tới giờ (lazy expiry); cron chỉ còn là việc dọn dẹp để sơ đồ hiển thị đẹp.

Xác nhận đơn sau khi thanh toán:
~~~sql
UPDATE seats SET status = 'SOLD'
WHERE hold_id = :holdId AND status = 'HELD' AND held_until > now();
-- 0 dòng: hold đã hết hạn và có thể đã sang tay người khác => refund
~~~

### 5. Trade-off: DB hay Redis để giữ ghế
| Tiêu chí | Postgres UPDATE có điều kiện | Redis Lua (SET NX nhiều key) |
|---|---|---|
| Đúng tuyệt đối | Có, durable | Mất dữ liệu khi failover nếu chưa replicate |
| Thông lượng | Vài nghìn/s là đủ khi có waiting room | 50–100k/s |
| Độ phức tạp | Thấp, một nguồn sự thật | Phải đồng bộ về DB, xử lý lệch |
| Khi nào chọn | Mặc định | Không có waiting room, tải ghi thật sự lớn |

### 6. Thanh toán về muộn
Cổng thanh toán có thể báo thành công ở phút 11 khi hold đã hết. Cách xử lý: thử UPDATE xác nhận; nếu 0 dòng thì thử giữ lại đúng ghế đó (nếu vẫn trống), nếu không được thì **refund tự động** và báo người dùng. Muốn giảm tình huống này: chỉ cho bắt đầu thanh toán khi hold còn ít nhất 2 phút, và đặt timeout của phiên thanh toán ngắn hơn hold.

### 7. Senior vs Lead trả lời khác gì
- **Senior**: đúng câu UPDATE có điều kiện, waiting room, lazy expiry, refund khi thanh toán muộn, idempotency.
- **Lead** thêm: kế hoạch load test với dữ liệu sân thật trước ngày mở bán, chế độ suy giảm (tắt chọn chỗ, chuyển sang "ghế tốt nhất còn lại" khi quá tải), chính sách công bằng (random thứ tự cho người vào trước giờ mở bán thay vì ai nhanh tay), chi phí CDN, phối hợp với đội chống bot và CSKH (kịch bản refund hàng loạt).

### Lỗi hay gặp
- Kiểm tra "ghế trống?" bằng SELECT rồi mới UPDATE ở hai câu riêng: hai người cùng thấy trống và cùng giữ (race check-then-act).
- Dùng SELECT ... FOR UPDATE nhưng khoá ghế theo thứ tự khác nhau giữa các request => deadlock. Nếu dùng FOR UPDATE thì sắp xếp seat_id trước.
- Cho 500k người query sơ đồ trực tiếp từ DB.
- Quên trường hợp thanh toán thành công sau khi hold hết hạn.

### Trả lời miệng 1 phút
"Tôi tách đọc và ghi. Đọc sơ đồ là 100k req/s nhưng chấp nhận trễ 2 giây, nên tôi build snapshot theo khu và đẩy lên CDN. Ghi là thao tác giữ ghế, phải đúng tuyệt đối, nên tôi dùng một câu UPDATE có điều kiện trên Postgres, kiểm tra số dòng bị ảnh hưởng để giữ nhiều ghế nguyên tử, và held_until để ghế tự hết hạn. Để DB không bị dội 25k lần ghi/giây, tôi đặt waiting room cấp 2.000 người/phút, giảm còn khoảng 100 lần/giây. Thanh toán về sau khi hold hết hạn thì xác nhận có điều kiện, thất bại thì refund."

> Senior tip: trong các vụ bán vé sập thật, thủ phạm thường không phải câu UPDATE mà là **trang sơ đồ ghế** và **trang thanh toán** gọi sang cổng thanh toán đồng bộ. Hãy load test riêng hai luồng này, và đặt waiting room ngay cả khi bạn tin DB chịu được: nó còn là công tắc để bạn giảm tốc độ vào khi có sự cố.`,
  followups: [
    'Nếu ban tổ chức muốn bỏ chọn chỗ và chuyển sang "ghế tốt nhất còn lại" khi quá tải, bạn đổi thiết kế thế nào?',
    'Làm sao để waiting room công bằng với người vào trước giờ mở bán và chống một người mở 50 tab?',
    'Nếu dùng Redis để giữ ghế, Redis failover mất 1 giây dữ liệu thì chuyện gì xảy ra và bạn phòng thế nào?',
    'Làm sao gợi ý 4 ghế liền nhau khi sơ đồ bị lấp lỗ chỗ?'
  ],
  related: ['design-016', 'design-004']
},
{
  id: 'sd-012',
  title: 'Ví điện tử: chuyển tiền P2P giữa các shard',
  kind: 'bank',
  level: 'lead',
  prompt: `Thiết kế tính năng chuyển tiền P2P cho một ví điện tử 20 triệu người dùng (5 triệu hoạt động mỗi ngày). Ví được chia thành nhiều shard theo wallet_id, nên người gửi và người nhận thường nằm ở **hai database khác nhau**. Yêu cầu: không mất tiền, không trừ tiền hai lần khi app bấm lại, hạn mức ngày, chuyển cho số điện thoại chưa đăng ký ví. Đỉnh tải là tối mùng 1 Tết. Bạn có 45 phút.`,
  phases: [
    { name: 'Requirements', minutes: 5, guide: `Functional: chuyển theo số điện thoại/wallet, lời nhắn, hạn mức ngày, lịch sử, chuyển cho người chưa có ví (giữ tiền chờ nhận 7 ngày). Non-functional: không mất/tạo tiền, idempotent, p99 < 1 giây cho người gửi, người nhận thấy tiền trong vài giây. Hỏi: số shard, có cần chuyển ra ngân hàng không (out-of-scope), quy định lưu trữ.` },
    { name: 'Estimation', minutes: 5, guide: `5M DAU x 2 giao dịch = 10M/ngày => 10M / 86.400 ~ 116 TPS trung bình; đỉnh Tết gấp 10 => ~1.200 TPS. Mỗi giao dịch: 1 dòng transfer ~500 B + 2 bút toán x 200 B + outbox ~300 B ~ 1,2 KB => 12 GB/ngày ~ 4,4 TB/năm. Lưu 10 năm => partition theo tháng, archive.` },
    { name: 'API & data model', minutes: 5, guide: `POST /transfers {toPhone, amount, note} + header Idempotency-Key -> {transferId, status}. Bảng wallets(id, balance, version), ledger_entries(wallet_id, transfer_id, amount, type), transfers(id, from, to, amount, status), idempotency_keys(wallet_id, key, response), daily_limits(wallet_id, day, used), outbox.` },
    { name: 'High-level design', minutes: 15, guide: `Vẽ: App -> Gateway -> Transfer service -> shard người gửi (trừ tiền + outbox trong 1 transaction) -> Kafka -> Credit consumer -> shard người nhận (cộng tiền, unique transfer_id). Tài khoản trung gian "tiền đang chuyển". Notification sau credit.` },
    { name: 'Deep dive', minutes: 15, guide: `Đào sâu: vì sao không 2PC, saga và bù trừ, idempotency 2 tầng, hạn mức ngày không race, hot wallet (merchant nhận nhiều), đối soát cuối ngày, người nhận chưa có ví.` }
  ],
  rubric: [
    'Ước lượng TPS trung bình và đỉnh, dung lượng có phép tính',
    'Cùng shard: một local transaction; khác shard: saga qua outbox, không 2PC',
    'Tài khoản trung gian (in-flight) để tổng tiền luôn cân',
    'Trừ tiền bằng UPDATE có điều kiện balance >= amount',
    'Idempotency-Key từ client và unique transfer_id ở phía credit',
    'Hạn mức ngày cập nhật trong cùng transaction với trừ tiền',
    'Bù trừ khi credit thất bại vĩnh viễn (hoàn tiền người gửi)',
    'Hot wallet: chia sub-account hoặc gom credit',
    'Đối soát định kỳ tổng các shard',
    'Người nhận chưa có ví: giữ ở tài khoản chờ nhận, hết hạn thì hoàn'
  ],
  reference: `**Tóm tắt:** Nếu người gửi và người nhận cùng shard thì chỉ cần một local transaction. Khác shard thì **không dùng 2PC** mà dùng saga: trừ tiền người gửi + ghi outbox trong một transaction, rồi consumer cộng tiền người nhận một cách idempotent; trong lúc "đang bay", tiền nằm ở tài khoản trung gian để sổ cái lúc nào cũng cân. Idempotency ở cả hai đầu và hạn mức ngày cập nhật cùng transaction với trừ tiền.

### 1. Yêu cầu
- Chuyển theo số điện thoại, có lời nhắn, hạn mức 100 triệu/ngày.
- Không bao giờ mất hoặc "đẻ" ra tiền. App mất mạng bấm lại không được trừ hai lần.
- Người gửi nhận kết quả < 1 giây; người nhận thấy tiền sau vài giây là chấp nhận được (eventual cho phía nhận, strong cho phía gửi).
- Người nhận chưa có ví: tiền chờ 7 ngày, quá hạn thì hoàn.

### 2. Ước lượng
| Đại lượng | Phép tính | Kết quả |
|---|---|---|
| Giao dịch/ngày | 5M DAU x 2 | 10M |
| TPS trung bình | 10.000.000 / 86.400 | ~116 |
| TPS đỉnh (Tết, x10) | 116 x 10 | ~1.200 |
| Dung lượng mỗi giao dịch | 500 B + 2 x 200 B + 300 B | ~1,2 KB |
| Dung lượng/ngày | 10M x 1,2 KB | ~12 GB |
| Dung lượng/năm | 12 GB x 365 | ~4,4 TB |
1.200 TPS ghi chia cho 8 shard là ~150 TPS mỗi shard: con số nhỏ. Cái khó ở bài này là **đúng**, không phải **nhanh**.

### 3. Vì sao không dùng 2PC (XA)?
2PC khoá dòng ở cả hai DB cho tới khi coordinator quyết định. Coordinator chết giữa chừng thì dòng bị khoá tới khi phục hồi, và mỗi giao dịch tốn thêm round-trip. Saga chấp nhận một khoảng thời gian ngắn tiền "đang bay" nhưng mỗi bước chỉ là local transaction, không có khoá xuyên DB.

### 4. Luồng saga
~~~text
 App --(Idempotency-Key)--> Transfer service
                                |
         [Shard người gửi - 1 local transaction]
           1. INSERT idempotency_keys (unique) -- trùng => trả kết quả cũ
           2. UPDATE daily_limits ... used + amt <= limit
           3. UPDATE wallets SET balance = balance - amt WHERE id=A AND balance >= amt
           4. INSERT ledger: A -amt, IN_FLIGHT +amt
           5. INSERT transfers(status=DEBITED), INSERT outbox
                                |
                         outbox relay -> Kafka (key = transferId)
                                |
         [Shard người nhận - 1 local transaction]
           6. INSERT processed(transfer_id) UNIQUE -- trùng => bỏ qua
           7. UPDATE wallets SET balance = balance + amt WHERE id=B
           8. INSERT ledger: IN_FLIGHT -amt, B +amt
                                |
                    event CREDITED -> cập nhật transfers=COMPLETED, push notification
~~~
- **Outbox** đảm bảo "đã trừ tiền thì chắc chắn có sự kiện", vì cả hai được ghi trong cùng transaction. Gửi Kafka trực tiếp trong code thì có thể trừ tiền xong rồi chết trước khi gửi.
- Kafka giao **at-least-once**, nên bước 6 dùng unique key để cộng tiền đúng một lần.
- Tài khoản IN_FLIGHT: tổng mọi số dư + IN_FLIGHT luôn bằng tổng tiền hệ thống. Đối soát chỉ cần kiểm tra IN_FLIGHT có giao dịch nào "bay" quá 5 phút.

### 5. Bù trừ (compensation)
Ví người nhận bị khoá hoặc đã đóng => credit thất bại vĩnh viễn. Consumer phát sự kiện CREDIT_FAILED, shard người gửi chạy transaction ngược: IN_FLIGHT -amt, A +amt, hoàn hạn mức, transfers = REFUNDED. Lỗi tạm thời (DB timeout) thì **retry**, không bù trừ ngay.

### 6. Hạn mức ngày không bị race
~~~sql
-- Cùng transaction với trừ tiền: hai request song song không thể cùng vượt hạn mức
INSERT INTO daily_limits(wallet_id, day, used) VALUES (:w, :d, 0) ON CONFLICT DO NOTHING;
UPDATE daily_limits SET used = used + :amt
WHERE wallet_id = :w AND day = :d AND used + :amt <= :limit;  -- 0 dòng => vượt hạn mức
~~~
Đếm hạn mức trong Redis riêng thì nhanh nhưng lệch với DB khi transaction rollback.

### 7. Hot wallet
Một merchant/KOL nhận 2.000 lần cộng tiền/giây vào **một dòng** => tất cả xếp hàng chờ khoá dòng đó. Cách xử lý:
- Chia ví nhận thành N sub-account (wallet_id#0..N-1), cộng vào sub-account ngẫu nhiên; số dư = tổng. Rút tiền thì gom về.
- Hoặc ghi ledger entry (chỉ INSERT, không khoá) và cộng dồn vào balance theo lô mỗi giây.

### 8. Trade-off
| Lựa chọn | Ưu | Nhược |
|---|---|---|
| 2PC/XA | Nguyên tử tức thì | Khoá xuyên DB, coordinator là điểm chết, chậm |
| Saga + outbox | Mỗi bước local, chịu lỗi tốt | Có trạng thái trung gian, cần bù trừ và đối soát |
| Đặt cả hai ví vào một DB lớn | Đơn giản nhất | Không scale qua giới hạn một DB |

### 9. Senior vs Lead trả lời khác gì
- **Senior**: luồng saga đúng, outbox, idempotency hai tầng, UPDATE có điều kiện, hạn mức trong cùng transaction.
- **Lead** thêm: đối soát end-of-day theo từng shard và với ngân hàng giữ tiền (tiền ví phải khớp tài khoản đảm bảo), runbook khi IN_FLIGHT kẹt, kế hoạch resharding (di chuyển ví giữa shard mà không dừng hệ thống), yêu cầu pháp lý về lưu trữ và audit, cách tổ chức đội (ai sở hữu ledger), feature flag tắt chuyển tiền P2P khi sự cố.

### Lỗi hay gặp
- Đọc số dư, kiểm tra trong Java rồi mới UPDATE balance = :newBalance => mất cập nhật khi hai request song song.
- Sinh transferId ở server mỗi lần gọi => app retry tạo ra hai giao dịch. Phải dựa vào Idempotency-Key client gửi.
- Retry vô hạn credit vào ví đã đóng thay vì bù trừ.
- Coi Kafka là exactly-once rồi bỏ unique key ở phía nhận.

### Trả lời miệng 1 phút
"Đỉnh khoảng 1.200 TPS nên tải không phải vấn đề, vấn đề là đúng. Cùng shard tôi dùng một local transaction. Khác shard tôi tránh 2PC, dùng saga: trong shard người gửi, một transaction vừa kiểm tra idempotency key, cập nhật hạn mức, trừ tiền có điều kiện balance >= amount, ghi bút toán sang tài khoản trung gian và ghi outbox. Consumer ở shard người nhận cộng tiền với unique transfer_id nên chạy lại không cộng hai lần. Credit thất bại vĩnh viễn thì bù trừ hoàn tiền. Cuối cùng có đối soát để bắt giao dịch kẹt ở tài khoản trung gian."

> Senior tip: hãy đặt alert "số giao dịch trong IN_FLIGHT quá 5 phút > 0". Ở các ví thật, sự cố tiền "biến mất" thường là consumer bị dừng (deploy lỗi, consumer group rebalance liên tục) chứ không phải sai logic; alert này phát hiện trong vài phút thay vì đợi khách gọi tổng đài.`,
  followups: [
    'Bạn di chuyển (reshard) 1 triệu ví sang shard mới mà không dừng chuyển tiền thế nào?',
    'Người nhận chưa có ví: tiền nằm ở đâu, hết 7 ngày thì hoàn ra sao, và đối soát thế nào?',
    'Nếu yêu cầu đổi thành người nhận phải thấy tiền ngay khi người gửi thấy "thành công", bạn trả giá gì?',
    'Bạn phát hiện và xử lý một giao dịch bị cộng tiền nhưng chưa trừ tiền (sai lệch) thế nào?'
  ],
  related: ['design-005', 'design-022']
},
{
  id: 'sd-013',
  title: 'Gợi ý từ khoá (autocomplete) cho ô tìm kiếm',
  kind: 'bigtech',
  level: 'senior',
  prompt: `Thiết kế tính năng gợi ý từ khoá khi gõ vào ô tìm kiếm của một sàn thương mại điện tử: 10 triệu người dùng hoạt động mỗi ngày, trả về 10 gợi ý cho mỗi lần gõ, độ trễ phía server p99 < 20 ms. Hỗ trợ tiếng Việt gõ không dấu, cập nhật xu hướng mới (ví dụ sản phẩm vừa ra mắt) trong vòng 1 giờ, và lọc từ khoá nhạy cảm. Bạn có 45 phút.`,
  phases: [
    { name: 'Requirements', minutes: 5, guide: `Functional: gợi ý theo prefix, xếp theo độ phổ biến, gõ không dấu vẫn ra, lọc từ cấm. Non-functional: p99 < 20 ms server, xu hướng cập nhật < 1 giờ, sẵn sàng cao (lỗi thì ẩn gợi ý, không chặn tìm kiếm). Hỏi: có cá nhân hoá không, có sửa lỗi chính tả không (thường out-of-scope), số gợi ý.` },
    { name: 'Estimation', minutes: 5, guide: `10M DAU x 5 lần tìm x ~4 request (đã debounce) = 200M req/ngày => ~2.300 QPS, đỉnh x3 ~7.000 QPS. 5M query phổ biến x tối đa 20 prefix, sau gộp ~30M prefix x ~60 B (key + 10 id) ~ 1,8 GB => vừa RAM một máy. Response ~1 KB => 7 MB/s.` },
    { name: 'API & data model', minutes: 5, guide: `GET /suggest?q=dien+th&limit=10 -> [{text, type}]; Cache-Control cho prefix ngắn. Dữ liệu: bảng query_stats(query, normalized, score, updated_at) offline; trên server: map prefix_normalized -> top 10 query id + mảng text.` },
    { name: 'High-level design', minutes: 15, guide: `Vẽ hai đường: online (Client -> CDN -> Suggest service đọc trie/map trong RAM) và offline (search log -> Kafka -> job tổng hợp mỗi giờ -> build snapshot -> S3 -> các node nạp snapshot mới kiểu blue/green).` },
    { name: 'Deep dive', minutes: 15, guide: `Đào sâu: precompute top-k mỗi prefix vs duyệt trie lúc query, chuẩn hoá tiếng Việt, decay theo thời gian, trending gần realtime, cache prefix ngắn, lọc từ cấm, chống thao túng.` }
  ],
  rubric: [
    'Ước lượng QPS có tính debounce và dung lượng prefix có phép tính',
    'Tách đường online (đọc RAM) và offline (tổng hợp log, build snapshot)',
    'Precompute top-k cho mỗi prefix thay vì duyệt cả cây lúc query',
    'Chuẩn hoá tiếng Việt (bỏ dấu, lowercase) làm key, giữ chuỗi có dấu để hiển thị',
    'Điểm có decay theo thời gian và lớp trending gần realtime',
    'Cache phía client/CDN cho prefix 1–2 ký tự',
    'Nạp snapshot mới không downtime (blue/green, atomic swap)',
    'Lọc từ nhạy cảm và chống bot đẩy từ khoá',
    'Client debounce và huỷ request cũ'
  ],
  reference: `**Tóm tắt:** Autocomplete là bài toán **đọc cực nhiều, dữ liệu thay đổi chậm**. Vì vậy tính sẵn "prefix => 10 gợi ý tốt nhất" ở offline mỗi giờ, nạp toàn bộ vào RAM của service, mỗi request chỉ là một lần tra map O(1). Client debounce, prefix ngắn được cache ở CDN, tiếng Việt được chuẩn hoá bỏ dấu làm key.

### 1. Yêu cầu
- Người dùng gõ "dien th" thấy "điện thoại samsung", "điện thoại iphone 15"…
- Server p99 < 20 ms (tính cả mạng thì người dùng cảm nhận < 100 ms).
- Xu hướng mới lên gợi ý trong vòng 1 giờ. Không gợi ý từ tục, tên hàng cấm.
- Service lỗi thì ô tìm kiếm vẫn dùng được (gợi ý chỉ là "nice to have").

### 2. Ước lượng
| Đại lượng | Phép tính | Kết quả |
|---|---|---|
| Request/ngày | 10M DAU x 5 lần tìm x 4 request (debounce 150 ms) | 200M |
| QPS trung bình | 200.000.000 / 86.400 | ~2.300 |
| QPS đỉnh (x3 buổi tối) | 2.300 x 3 | ~7.000 |
| Số prefix | 5M query x tối đa 20 ký tự, sau gộp trùng | ~30M |
| RAM | 30M x 60 B (key ~20 B + 10 id x 4 B) + 5M text x 40 B | ~1,8 GB + 0,2 GB = ~2 GB |
| Băng thông | 7.000 x 1 KB | ~7 MB/s |
2 GB vừa trong RAM mỗi pod (heap 4 GB) nên **không cần DB online**: mỗi node có bản sao đầy đủ, scale ngang bằng thêm pod.

### 3. Kiến trúc
~~~text
 ONLINE (đường nóng)
 Browser --debounce 150ms--> [CDN: cache q có 1-2 ký tự, TTL 10 phút]
                                  | miss
                                  v
                         [Suggest service x N pod]
                          HashMap<prefix, int[] top10>  (snapshot trong RAM)
                          + overlay trending (cập nhật mỗi 1 phút)

 OFFLINE (đường nguội)
 search logs -> Kafka -> [Job mỗi giờ: đếm, decay, lọc từ cấm]
                               -> build snapshot (file nhị phân) -> S3
                               -> pod tải bản mới, build xong mới swap tham chiếu
~~~

### 4. Vì sao precompute top-k mỗi prefix?
Trie "thuần" lưu mỗi ký tự một node; lúc query phải đi xuống node của prefix rồi **duyệt toàn bộ cây con** để tìm 10 query điểm cao nhất. Prefix "d" có thể có hàng trăm nghìn query con => chậm. Precompute: lúc build, mỗi node lưu sẵn top 10 => query chỉ còn là tra prefix, O(độ dài prefix) hoặc O(1) với HashMap. Đổi lại tốn RAM (đã tính ~2 GB) và dữ liệu chỉ mới theo chu kỳ build.

~~~java
// Swap snapshot không khoá: request đang chạy vẫn đọc bản cũ đến khi xong
private volatile Snapshot current;          // volatile: thread khác thấy ngay bản mới

List<String> suggest(String raw) {
    String key = Normalizer.vi(raw);        // "Điện Th" -> "dien th"
    Snapshot s = current;                   // đọc tham chiếu một lần
    int[] ids = s.top.getOrDefault(key, EMPTY);
    return s.render(ids);                   // trả text CÓ dấu để hiển thị
}
void reload(Snapshot fresh) { current = fresh; } // build xong mới gán
~~~

### 5. Tiếng Việt
- Key chuẩn hoá: lowercase, bỏ dấu (java.text.Normalizer NFD rồi bỏ ký tự dấu, đổi đ thành d), gộp khoảng trắng.
- "dien thoai" và "điện thoại" cùng key; hiển thị bản có dấu phổ biến nhất.
- Người gõ có dấu một phần ("điên tho") vẫn chuẩn hoá về cùng key.

### 6. Xếp hạng và xu hướng
- score = tổng số lần tìm có **decay**: mỗi ngày nhân 0,9, để từ khoá cũ (khuyến mãi năm ngoái) tự chìm.
- Có thể cộng tín hiệu chất lượng: tỉ lệ click, có kết quả hay không (query ra 0 sản phẩm thì không gợi ý).
- Trending: stream job đếm theo cửa sổ 1 giờ, các query tăng đột biến được đẩy vào một overlay nhỏ (vài nghìn mục) mà pod tải mỗi phút và trộn với snapshot.

### 7. Trade-off
| Phương án | Ưu | Nhược |
|---|---|---|
| Snapshot trong RAM mỗi pod | Nhanh nhất, không phụ thuộc mạng | Mỗi pod tốn 2 GB, cập nhật theo chu kỳ |
| Redis (prefix -> ZSET) | Cập nhật realtime, pod nhẹ | Thêm round-trip, Redis thành điểm phụ thuộc |
| Elasticsearch completion suggester | Có sẵn fuzzy, ít code | Vận hành cụm ES, khó tinh chỉnh xếp hạng |

### 8. Senior vs Lead trả lời khác gì
- **Senior**: tách online/offline, precompute top-k, chuẩn hoá tiếng Việt, cache prefix ngắn, swap snapshot an toàn.
- **Lead** thêm: đo hiệu quả bằng A/B (tỉ lệ dùng gợi ý, số ký tự gõ tiết kiệm, conversion), quy trình xử lý khi một gợi ý gây khủng hoảng truyền thông (kill switch xoá một từ khoá trong vài phút, không đợi build lại), chống seller dùng bot đẩy tên shop lên gợi ý, chi phí so với dùng dịch vụ có sẵn.

### Lỗi hay gặp
- Gọi API ở mọi keystroke mà không debounce và không huỷ request cũ: kết quả về sai thứ tự, gợi ý nhảy lung tung.
- Query DB bằng LIKE 'abc%' cho mỗi lần gõ: chết ngay ở 7.000 QPS.
- Build snapshot mới ngay trong pod đang phục vụ, GC pause dài => p99 tăng vọt. Build offline, pod chỉ tải và swap.
- Không lọc query của bot, khiến gợi ý bị thao túng.

### Trả lời miệng 1 phút
"Khoảng 7.000 QPS đỉnh, dữ liệu prefix chỉ khoảng 2 GB nên tôi giữ toàn bộ trong RAM mỗi pod. Mỗi giờ một job offline đọc search log từ Kafka, đếm có decay, lọc từ cấm, rồi tính sẵn top 10 cho mỗi prefix đã chuẩn hoá bỏ dấu, ghi snapshot lên S3; pod tải và swap tham chiếu volatile. Request chỉ là một lần tra HashMap nên dưới 1 ms. Prefix 1–2 ký tự được cache ở CDN, client debounce 150 ms. Xu hướng mới dùng một overlay nhỏ cập nhật mỗi phút."

> Senior tip: 1–2 ký tự đầu chiếm phần rất lớn traffic nhưng chỉ có vài nghìn giá trị khác nhau, nên cache chúng ở CDN/browser giảm tải đáng kể. Và luôn có **danh sách chặn khẩn cấp** đọc realtime: sớm muộn sẽ có một gợi ý gây phản cảm lên mạng xã hội, lúc đó không ai muốn đợi job chạy lại.`,
  followups: [
    'Bạn thêm cá nhân hoá (lịch sử tìm của chính người dùng) mà vẫn giữ p99 < 20 ms thế nào?',
    'Người dùng gõ sai chính tả "iphon" vẫn muốn ra "iphone": bạn mở rộng thiết kế ra sao?',
    'Nếu dữ liệu tăng lên 50 GB không còn vừa RAM một pod, bạn shard thế nào?',
    'Làm sao xoá một gợi ý độc hại khỏi toàn hệ thống trong 5 phút?'
  ],
  related: ['design-018']
},
{
  id: 'sd-014',
  title: 'Hệ thống hẹn giờ thực thi hàng chục triệu job',
  kind: 'bigtech',
  level: 'lead',
  prompt: `Thiết kế dịch vụ hẹn giờ (delayed/scheduled job) dùng chung cho cả công ty: các team đăng ký "gọi webhook X lúc 09:00 ngày mai", "nhắc thanh toán sau 3 ngày", hoặc lịch cron. Quy mô 50 triệu job/ngày, nhiều job dồn vào đúng 08:00 và 09:00. Yêu cầu chạy trễ không quá 5 giây so với giờ hẹn, không mất job, và không làm sập service đích. Bạn có 45 phút.`,
  phases: [
    { name: 'Requirements', minutes: 5, guide: `Functional: tạo/huỷ job một lần, cron có timezone, payload, retry policy, callback HTTP hoặc message Kafka. Non-functional: at-least-once, trễ < 5 giây, multi-tenant, rate limit theo service đích. Hỏi: độ chính xác cần thiết, job xa nhất (1 năm?), có cần exactly-once không (thường không, đích phải idempotent).` },
    { name: 'Estimation', minutes: 5, guide: `50M/ngày => ~580 job/giây trung bình. Nếu 20% (10M) hẹn đúng 09:00:00 thì cần 10M trong vài giây - không thể; dàn đều trong 10 phút => ~16.700/giây. Lưu: 50M x 500 B = 25 GB/ngày; giữ lịch sử 30 ngày ~ 750 GB => partition theo ngày.` },
    { name: 'API & data model', minutes: 5, guide: `POST /jobs {tenant, runAt | cron + tz, target, payload, idempotencyKey, maxDelaySec} -> jobId; DELETE /jobs/{id}. Bảng jobs(id, shard, due_at, status, attempt, lease_until, tenant, target, payload), partition theo due_at, index (shard, status, due_at).` },
    { name: 'High-level design', minutes: 15, guide: `Vẽ: API -> DB (sharded) ; Scheduler node sở hữu một số shard (lease) -> quét job sắp tới hạn -> timing wheel trong RAM -> đúng giờ đẩy vào Kafka -> Executor gọi đích (rate limit theo target) -> cập nhật trạng thái; retry với backoff; DLQ.` },
    { name: 'Deep dive', minutes: 15, guide: `Đào sâu: claim job không trùng (SKIP LOCKED + lease), node chết, giờ cao điểm 09:00, backpressure khi đích chậm, cron và DST, fairness giữa tenant, chỉ số lag.` }
  ],
  rubric: [
    'Ước lượng trung bình và đỉnh tại giờ tròn, nhận ra cần dàn tải',
    'Lưu job bền vững trong DB, partition theo thời gian',
    'Claim job bằng FOR UPDATE SKIP LOCKED + lease, node chết thì job được claim lại',
    'Hai tầng: DB cho job xa, timing wheel/hàng đợi trong RAM cho job sắp tới',
    'At-least-once + idempotency key gửi kèm cho đích',
    'Rate limit và backpressure theo service đích',
    'Retry có backoff, DLQ',
    'Cron: tính lần chạy kế tiếp theo timezone, xử lý DST và misfire',
    'Fairness giữa tenant',
    'Metric lag = thời điểm chạy thật - due_at'
  ],
  reference: `**Tóm tắt:** Job được lưu bền trong DB chia shard theo id và partition theo ngày. Mỗi scheduler node giữ **lease** trên một nhóm shard, cứ vài giây quét các job sắp tới hạn bằng {{FOR UPDATE SKIP LOCKED}}, nạp vào timing wheel trong RAM, đến giờ thì đẩy sang Kafka cho executor gọi đích. Giao **at-least-once** nên đích phải idempotent; đỉnh giờ tròn được xử lý bằng dàn tải và rate limit theo đích.

### 1. Yêu cầu
- Job một lần (runAt) và cron có timezone. Đích là HTTP callback hoặc topic Kafka.
- Trễ < 5 giây, không mất job, chạy ít nhất một lần (exactly-once thật sự là không thể khi gọi HTTP ra ngoài).
- Không biến scheduler thành "vũ khí DDoS" bắn 1 triệu request vào service đích lúc 09:00.

### 2. Ước lượng
| Đại lượng | Phép tính | Kết quả |
|---|---|---|
| Trung bình | 50.000.000 / 86.400 | ~580 job/s |
| Dồn đúng 09:00 | 20% x 50M = 10M job | không thể chạy trong 1 giây |
| Dàn trong 10 phút | 10.000.000 / 600 | ~16.700 job/s |
| Lưu trữ/ngày | 50M x 500 B | 25 GB |
| Giữ 30 ngày | 25 GB x 30 | ~750 GB |
Bài học: phải hỏi chủ job "có cần đúng 09:00:00 không?". Phần lớn job nhắc nhở chấp nhận trễ vài phút => API có trường maxDelaySec để scheduler được phép dàn ra.

### 3. Kiến trúc
~~~text
 Team A/B/C --POST /jobs--> [Job API] --INSERT--> [DB shards 0..63, partition theo ngày]
                                                        ^      |
                                     lease shard 0..15  |      | quét: due_at <= now() + 60s
                                                        |      v
                                   [Scheduler node 1] timing wheel (RAM, ô 1 giây)
                                   [Scheduler node 2] ...       |
                                   [Scheduler node 3] ...       | đến giờ
                                                                v
                                                     [Kafka: jobs.due, key = target]
                                                                |
                                   [Executor pool] -- rate limit theo target --> service đích
                                          | thành công: DONE | lỗi: retry backoff | hết lượt: DLQ
~~~

### 4. Claim job không trùng
~~~sql
-- Chạy mỗi 5 giây trên mỗi shard mà node đang giữ lease
WITH due AS (
  SELECT id FROM jobs
  WHERE shard = :shard AND status = 'PENDING' AND due_at <= now() + interval '60 seconds'
  ORDER BY due_at
  LIMIT 1000
  FOR UPDATE SKIP LOCKED          -- node khác đang claim thì bỏ qua, không chờ
)
UPDATE jobs j SET status = 'CLAIMED', lease_until = now() + interval '2 minutes'
FROM due WHERE j.id = due.id
RETURNING j.id, j.due_at, j.target;
~~~
- **Vì sao cần lease?** Node claim xong rồi chết thì job kẹt ở CLAIMED. Một tiến trình dọn đưa job có lease_until < now() về PENDING => node khác chạy. Đây là nguồn chạy trùng duy nhất, chấp nhận được vì at-least-once.
- **Vì sao 2 tầng (DB + timing wheel)?** Quét DB mỗi giây để bắt đúng giây là rất tốn. Quét trước 60 giây, nạp vào timing wheel (mảng 60 ô, mỗi ô là danh sách job của giây đó) rồi một thread tick mỗi giây lấy ô hiện tại => chính xác tới giây mà DB chỉ bị quét mỗi 5 giây.

### 5. Backpressure và fairness
- Kafka key = target nên một đích chậm chỉ làm chậm partition của nó.
- Executor có token bucket cho từng target (ví dụ billing-service tối đa 500 req/s). Vượt thì job chờ, lag tăng có chủ đích thay vì làm sập đích.
- Mỗi tenant có quota job/phút; một team đăng ký 10M job không được làm trễ job thanh toán của team khác => hàng đợi ưu tiên theo tier.

### 6. Cron, timezone, DST
- Lưu biểu thức cron + timezone (Asia/Ho_Chi_Minh), sau mỗi lần chạy tính next_fire_at bằng java.time (ZonedDateTime) rồi INSERT lần kế tiếp **trong cùng transaction** với đánh dấu DONE.
- Ở vùng có DST, 02:30 có thể không tồn tại hoặc xảy ra hai lần: quy định rõ chính sách.
- Misfire (scheduler dừng 1 giờ): chạy bù tất cả, chỉ chạy lần gần nhất, hay bỏ qua? Cho tenant chọn.

### 7. Trade-off
| Phương án | Ưu | Nhược |
|---|---|---|
| DB + SKIP LOCKED + timing wheel | Bền, truy vấn/huỷ job dễ, quen thuộc | Phải tự viết lease, tune index |
| Redis sorted set (score = due_at) | Rất nhanh, ZRANGEBYSCORE đơn giản | Bền vững kém hơn, RAM đắt khi giữ job 1 năm |
| Dịch vụ cloud (ví dụ EventBridge Scheduler) | Không phải vận hành | Quota, chi phí theo số lần gọi, khoá vào nhà cung cấp |
| Quartz cluster | Có sẵn cho Spring | Khoá DB tập trung, khó lên hàng chục triệu job/ngày |

### 8. Senior vs Lead trả lời khác gì
- **Senior**: SKIP LOCKED + lease, at-least-once + idempotency key, retry/DLQ, timing wheel, partition theo ngày.
- **Lead** thêm: SLO rõ ràng (99,9% job trễ < 5 giây) và metric lag theo tenant, onboarding/quota như một platform nội bộ, chính sách khi đích chậm (ai chịu trách nhiệm), kế hoạch rebalance shard khi thêm node, chi phí tự xây so với dịch vụ cloud, và dàn tải giờ tròn như một chính sách sản phẩm (maxDelaySec) chứ không chỉ là kỹ thuật.

### Lỗi hay gặp
- Mọi node cùng SELECT job tới hạn không có SKIP LOCKED => chạy trùng hàng loạt hoặc chờ khoá nhau.
- Một leader duy nhất quét toàn bộ DB: leader trở thành nút thắt và điểm chết.
- Không gửi idempotency key cho đích, rồi trách scheduler khi khách bị nhắc hai lần.
- Lưu job đã chạy chung bảng không partition => bảng phình, index chậm dần; xoá bằng DELETE thay vì DROP PARTITION.

### Trả lời miệng 1 phút
"Trung bình chỉ ~580 job/giây, nhưng giờ tròn có thể dồn 10 triệu job, nên tôi dàn tải trong cửa sổ maxDelay, khoảng 16.700 job/giây trong 10 phút. Job lưu bền trong DB chia 64 shard, partition theo ngày. Scheduler node giữ lease trên nhóm shard, mỗi 5 giây claim job sắp tới hạn trong 60 giây bằng FOR UPDATE SKIP LOCKED, nạp vào timing wheel để bắn đúng giây sang Kafka. Executor gọi đích có rate limit theo target, retry backoff, DLQ. Giao at-least-once nên mỗi lần gọi kèm idempotency key. Metric chính là lag giữa giờ chạy thật và due_at."

> Senior tip: metric quan trọng nhất của scheduler là **lag** (now - due_at) theo percentile và theo tenant, không phải số job chạy. Alert khi p99 lag > 5 giây sẽ bắt được mọi sự cố: DB chậm, node mất lease, đích bị rate limit, consumer Kafka dừng.`,
  followups: [
    'Một job hẹn chạy sau 1 năm: lưu ở đâu cho rẻ, và huỷ nó thế nào?',
    'Nếu một team cần đúng exactly-once (ví dụ trừ phí định kỳ), bạn phối hợp với service đích ra sao?',
    'Thêm scheduler node mới thì chia lại shard thế nào mà không chạy trùng hoặc bỏ sót?',
    'Service đích chết 2 giờ: 3 triệu job tồn đọng xử lý thế nào khi nó sống lại?'
  ],
  related: ['design-013', 'design-029']
},
{
  id: 'sd-015',
  title: 'Gọi xe: tìm tài xế gần nhất theo thời gian thực',
  kind: 'bigtech',
  level: 'senior',
  prompt: `Thiết kế phần tìm và ghép tài xế cho một ứng dụng gọi xe: 300.000 tài xế online giờ cao điểm, mỗi tài xế gửi vị trí 4 giây một lần; 1 triệu chuyến mỗi ngày. Khách mở app thấy xe quanh mình, đặt xe thì hệ thống phải ghép được tài xế phù hợp trong vài giây, **không giao một tài xế cho hai khách**. Bạn có 45 phút.`,
  phases: [
    { name: 'Requirements', minutes: 5, guide: `Functional: tài xế cập nhật vị trí, khách xem xe quanh mình, đặt xe -> mời tài xế -> tài xế nhận/từ chối, theo dõi chuyến. Non-functional: ghép trong < 10 giây, vị trí trên bản đồ trễ vài giây được, không double-assign. Hỏi: phạm vi (một nước, nhiều thành phố), loại xe, có ghép theo lô không. Out-of-scope: tính giá, thanh toán.` },
    { name: 'Estimation', minutes: 5, guide: `300k tài xế / 4 giây = 75.000 cập nhật/giây, mỗi gói ~200 B => 15 MB/s. Vị trí hiện tại: 300k x 100 B = 30 MB (vừa RAM). Lịch sử: 75k x 100 B = 7,5 MB/s ~ 650 GB/ngày => đổ sang object storage. Đặt chuyến: 1M/86.400 ~ 12/s, đỉnh x3 ~ 35/s. Xem xe quanh: ~1.000 QPS đỉnh.` },
    { name: 'API & data model', minutes: 5, guide: `Driver: gửi vị trí qua kết nối WebSocket/gRPC stream {lat, lng, heading, ts}. Rider: GET /nearby?lat&lng, POST /rides {pickup, dropoff, Idempotency-Key}. Lưu: driver_state(driver_id, status, ride_id, version) và geo index theo thành phố; rides(id, rider, driver, status).` },
    { name: 'High-level design', minutes: 15, guide: `Vẽ: Driver app -> Location gateway (kết nối lâu dài) -> Location service ghi geo index trong RAM/Redis theo thành phố + đẩy Kafka cho lịch sử; Rider -> Matching service: tìm ứng viên quanh điểm đón, xếp theo ETA, mời từng người với timeout; Driver state service đổi trạng thái nguyên tử.` },
    { name: 'Deep dive', minutes: 15, guide: `Đào sâu: geohash/H3 vs Redis GEO, ô biên, khoảng cách đường đi vs đường chim bay, khoá tài xế khi mời, timeout và mời người kế, hot spot sân bay, mất kết nối, ghép theo lô.` }
  ],
  rubric: [
    'Ước lượng 75k cập nhật vị trí/giây và nhận ra đây là luồng ghi chính',
    'Vị trí hiện tại giữ trong RAM/Redis, lịch sử đẩy qua stream sang storage rẻ',
    'Geo index (geohash, H3 hoặc Redis GEO) và xử lý ô lân cận',
    'Shard theo thành phố/vùng',
    'Xếp ứng viên theo ETA đường đi, không chỉ đường chim bay',
    'Đổi trạng thái tài xế nguyên tử (AVAILABLE -> OFFERED) để không double-assign',
    'Mời tài xế có timeout, hết giờ thì mời người kế',
    'Xử lý tài xế mất kết nối (vị trí cũ quá N giây thì loại)',
    'Hot spot (sân bay) và ghép theo lô khi cầu cao'
  ],
  reference: `**Tóm tắt:** Luồng nặng nhất là **75.000 cập nhật vị trí/giây**, nên vị trí hiện tại chỉ giữ trong RAM (Redis GEO hoặc index trong service) theo từng thành phố, còn lịch sử đổ qua Kafka sang storage rẻ. Khi khách đặt xe, tìm ứng viên trong ô lưới quanh điểm đón, xếp theo ETA, rồi **đổi trạng thái tài xế nguyên tử** (AVAILABLE -> OFFERED) trước khi mời để không giao một tài xế cho hai khách.

### 1. Yêu cầu
- Tài xế gửi vị trí 4 giây/lần; khách thấy xe quanh mình (trễ vài giây không sao).
- Đặt xe: ghép tài xế trong < 10 giây; một tài xế chỉ được mời cho một chuyến tại một thời điểm.
- Phạm vi nhiều thành phố; tài xế mất sóng thì không được mời.

### 2. Ước lượng
| Đại lượng | Phép tính | Kết quả |
|---|---|---|
| Cập nhật vị trí | 300.000 / 4 giây | 75.000/s |
| Băng thông vào | 75.000 x 200 B | 15 MB/s |
| Vị trí hiện tại | 300.000 x 100 B | 30 MB |
| Lịch sử vị trí | 75.000 x 100 B x 86.400 | ~650 GB/ngày |
| Đặt chuyến trung bình | 1.000.000 / 86.400 | ~12/s |
| Đặt chuyến đỉnh (x3) | 12 x 3 | ~35/s |
Nhận xét: dữ liệu nóng chỉ 30 MB nhưng **ghi** 75k lần/s. Không đưa luồng này vào Postgres (mỗi UPDATE sinh một phiên bản dòng mới, vacuum không theo kịp). Một Redis shard chịu khoảng 100k thao tác đơn giản/giây, nên shard theo thành phố là đủ: Hà Nội, TP.HCM mỗi nơi một shard riêng.

### 3. Geo index: tìm "ai ở gần" thế nào?
Không thể tính khoảng cách tới 300k tài xế cho mỗi lần tìm. Ý tưởng: chia bản đồ thành ô lưới, mỗi tài xế thuộc một ô; tìm thì chỉ xét ô của khách và các ô xung quanh.
- **Geohash**: mã hoá (lat, lng) thành chuỗi; prefix chung = gần nhau. Độ dài 6 ~ ô 1,2 km x 0,6 km; độ dài 7 ~ 153 m x 153 m.
- **Bẫy ô biên**: khách đứng sát mép ô, tài xế cách 50 m nhưng ở ô bên cạnh có mã khác hẳn => luôn tìm ô hiện tại **cộng 8 ô lân cận**.
- **Redis GEO**: GEOADD lưu vào sorted set (score là geohash 52 bit), GEOSEARCH ... BYRADIUS 3 km ASC COUNT 50 tự lo phần ô lân cận.
- **H3** (lưới lục giác): khoảng cách từ tâm tới các ô kề đều nhau, tiện cho phân tích cung/cầu theo vùng.

~~~text
 Driver app --stream 4s--> [Location gateway] --> [Location service]
                                                    | GEOADD drivers:hcm lng lat id
                                                    | SET last_seen:id ts (TTL 30s)
                                                    v
                                     [Redis shard / thành phố]      [Kafka: locations] -> S3 (lịch sử)
                                                    ^
 Rider --POST /rides--> [Matching service] --GEOSEARCH 3km, 50 ứng viên--+
                              | lọc AVAILABLE + last_seen < 15s
                              | gọi ETA service (đường đi thật) -> xếp hạng
                              v
                       [Driver state] CAS AVAILABLE -> OFFERED (TTL 15s) -> push lời mời
~~~

### 4. Không giao một tài xế cho hai khách
Hai matching worker có thể cùng chọn tài xế D cho hai khách. Giải pháp: trước khi mời phải **giành** tài xế bằng một thao tác nguyên tử.
~~~sql
UPDATE driver_state SET status = 'OFFERED', ride_id = :rideId, offer_until = now() + interval '15 seconds'
WHERE driver_id = :d AND status = 'AVAILABLE';
-- 1 dòng: giành được, gửi lời mời; 0 dòng: người khác đã giành, thử ứng viên kế
~~~
(Tương đương bằng Redis: SET offer:D rideId NX EX 15.) Tài xế từ chối hoặc hết 15 giây => trả về AVAILABLE và mời người kế. Tài xế nhận => OFFERED -> ON_TRIP với điều kiện ride_id khớp.

### 5. Trade-off
| Lựa chọn | Ưu | Nhược |
|---|---|---|
| Redis GEO theo thành phố | Có sẵn, đơn giản, đủ nhanh | Một thành phố quá lớn vẫn có thể thành hot shard |
| Index trong RAM của service (geohash -> set) | Nhanh nhất, không round-trip | Phải tự lo sharding, replication, khởi động lại mất dữ liệu (tài xế gửi lại sau 4 giây) |
| PostGIS | Truy vấn không gian mạnh | Không chịu 75k UPDATE/s |
| Mời lần lượt từng tài xế | Đơn giản, công bằng với tài xế | Chậm nếu nhiều người từ chối |
| Ghép theo lô mỗi 2 giây | Tối ưu tổng ETA toàn vùng | Phức tạp, thêm độ trễ nhỏ |

### 6. Senior vs Lead trả lời khác gì
- **Senior**: ước lượng đúng luồng ghi, geo index + ô lân cận, ETA theo đường đi, CAS trạng thái tài xế, timeout mời, loại tài xế mất sóng.
- **Lead** thêm: ghép theo lô để tối ưu toàn cục giờ cao điểm, hot spot sân bay (hàng chờ FIFO tài xế riêng), chế độ suy giảm khi ETA service chết (dùng đường chim bay nhân hệ số), multi-region và cách di chuyển một thành phố sang cụm khác, chỉ số kinh doanh (tỉ lệ ghép thành công, thời gian chờ) gắn với SLO kỹ thuật.

### Lỗi hay gặp
- Lưu mỗi lần cập nhật vị trí vào bảng SQL chính.
- Chỉ tìm trong một ô geohash, bỏ sót tài xế ngay bên kia ranh giới.
- Xếp theo đường chim bay: tài xế cách 300 m nhưng bên kia sông/cao tốc có thể mất 15 phút.
- Mời tài xế mà không khoá trạng thái => hai khách cùng được báo "đã có tài xế".
- Không loại tài xế có vị trí cũ (mất sóng 2 phút) khỏi danh sách ứng viên.

### Trả lời miệng 1 phút
"Luồng nặng nhất là 300k tài xế gửi vị trí mỗi 4 giây, tức 75k ghi/giây, nhưng dữ liệu hiện tại chỉ khoảng 30 MB. Nên tôi giữ vị trí hiện tại trong Redis GEO chia theo thành phố, lịch sử đẩy qua Kafka sang S3. Khi đặt xe, matching service lấy khoảng 50 tài xế trong bán kính 3 km, lọc người đang rảnh và còn tín hiệu, xếp theo ETA đường đi thật. Trước khi mời, tôi đổi trạng thái tài xế từ AVAILABLE sang OFFERED bằng một thao tác nguyên tử có TTL 15 giây, nên không ai bị giao hai chuyến; từ chối hoặc hết giờ thì mời người kế."

> Senior tip: 4 giây/lần là con số cân bằng giữa pin điện thoại tài xế và độ chính xác; nhiều hệ thống cho app tự giảm tần suất khi tài xế đứng yên và tăng khi đang chạy, giảm đáng kể tải ghi. Và luôn đo **thời gian từ lúc đặt tới lúc có tài xế nhận** theo từng khu vực; đó là chỉ số khách hàng cảm nhận được, không phải latency của GEOSEARCH.`,
  followups: [
    'Khu vực sân bay có 2.000 tài xế chờ: bạn xếp hàng công bằng thế nào thay vì chọn người gần nhất?',
    'ETA service chết giữa giờ cao điểm: hệ thống suy giảm ra sao?',
    'Bạn hiển thị xe quanh khách cho 1.000 QPS mà không đè lên luồng matching thế nào?',
    'Chuyển sang ghép theo lô mỗi 2 giây: thuật toán và trade-off là gì?'
  ],
  related: ['design-010']
}
];
