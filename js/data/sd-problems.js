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
- Khoá tài khoản sau N OTP sai liên tiếp trong 24h, yêu cầu kênh khác hoặc branch.
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
},
{
  id: 'sd-016',
  title: 'Flash sale: 1.000 sản phẩm, 200.000 người bấm mua cùng lúc',
  kind: 'bigtech',
  level: 'senior',
  prompt: `Sàn thương mại điện tử chạy flash sale 0 giờ: 1.000 chiếc điện thoại giá 1 triệu đồng (giá gốc 20 triệu), mỗi tài khoản chỉ được mua 1 chiếc. Dự kiến 200.000 người dùng mở app chờ, khoảng 50.000 request/giây trong 10 giây đầu. Yêu cầu: **không bán vượt số lượng (oversell)**, không để một người mua hai chiếc, hệ thống chính (giỏ hàng, thanh toán của các đơn khác) không bị sập theo, đơn giữ chỗ mà không thanh toán trong 10 phút thì trả hàng về kho. Bạn có 45 phút. Hãy thiết kế.`,
  phases: [
    { name: 'Requirements', minutes: 5, guide: `Chốt: số lượng hàng (1.000), giới hạn mỗi người (1), thời gian giữ chỗ chờ thanh toán (10 phút), có cần công bằng theo thứ tự đến không (thường chỉ cần "không oversell", không cần FIFO tuyệt đối). Non-functional: peak 50.000 RPS, p99 phản hồi "thành công/hết hàng" dưới 1 giây, không ảnh hưởng hệ thống khác. Hỏi: có chống bot không, thanh toán qua cổng nào, có cho huỷ đơn không. Out-of-scope: gợi ý sản phẩm, livestream.` },
    { name: 'Estimation', minutes: 5, guide: `50.000 RPS nhưng chỉ 1.000 request "thành công": 98% request chỉ cần trả "hết hàng" thật rẻ. Một DB quan hệ chịu vài nghìn UPDATE/giây trên **một dòng** tồn kho là trần (lock hàng đợi); Redis single-thread làm được khoảng 100.000 lệnh đơn giản/giây. Đơn giữ chỗ: 1.000 bản ghi, không đáng kể. Băng thông: 50.000 × 2 KB ≈ 100 MB/s ở edge, phải chặn sớm ở CDN/gateway.` },
    { name: 'API & data model', minutes: 5, guide: `POST /flash-sales/{saleId}/reservations (Idempotency-Key, userId từ token) → 201 {reservationId, expiresAt} hoặc 409 SOLD_OUT / 409 ALREADY_BOUGHT. GET /flash-sales/{saleId} (trạng thái, còn hàng hay không, qua cache). POST /reservations/{id}/pay. Dữ liệu: Redis key stock:{saleId} (số nguyên), set buyers:{saleId}; DB bảng reservation (id, sale_id, user_id, status PENDING/PAID/EXPIRED, expires_at, UNIQUE(sale_id, user_id)).` },
    { name: 'High-level design', minutes: 15, guide: `CDN + trang tĩnh đếm ngược; gateway rate limit theo user/IP và chặn trước giờ mở; Redis Lua trừ kho nguyên tử + kiểm tra người mua; ghi reservation qua Kafka (hoặc ghi DB trực tiếp vì chỉ 1.000 dòng); worker hết hạn trả kho; thanh toán đi luồng thường. Tách hạ tầng flash sale (cluster Redis, service riêng) khỏi hệ thống đặt hàng chính.` },
    { name: 'Deep dive', minutes: 15, guide: `Đào sâu: script Lua bảo đảm "kiểm tra + trừ" nguyên tử; Redis mất dữ liệu khi failover thì sao (đối soát với DB, giới hạn bằng UNIQUE và CHECK trong DB); trả hàng khi hết hạn và race với thanh toán đến muộn; chống bot (captcha, token xếp hàng, giới hạn thiết bị); hot key Redis; quan sát và kill switch.` }
  ],
  rubric: [
    'Nhận ra 98% request là "hết hàng" và phải trả lời rẻ ở tầng ngoài (cache, gateway, Redis)',
    'Không trừ tồn kho trực tiếp bằng UPDATE trên một dòng DB ở 50.000 RPS; giải thích hot row/lock',
    'Trừ kho nguyên tử trong Redis (Lua hoặc DECR có kiểm tra) kèm chống mua trùng mỗi người',
    'Ràng buộc cuối ở DB: UNIQUE(sale_id, user_id) và tổng đơn không vượt số lượng (đối soát)',
    'Giữ chỗ có hạn, worker hết hạn trả kho, xử lý race thanh toán đến muộn bằng trạng thái có điều kiện',
    'Idempotency cho request đặt chỗ và thanh toán',
    'Rate limit, chống bot, chặn trước giờ mở bán ở edge',
    'Cô lập hạ tầng flash sale khỏi hệ thống chính (bulkhead), có kill switch',
    'Xử lý Redis failover/mất dữ liệu và đối soát sau sale',
    'Giám sát: số còn lại, tỉ lệ 409, độ trễ, lỗi; nêu trade-off FIFO và công bằng'
  ],
  reference: `**Tóm tắt:** Flash sale là bài toán **chặn tải sớm** và **trừ kho nguyên tử**. 50.000 request/giây nhưng chỉ 1.000 request thành công, nên thiết kế phải trả lời "hết hàng" thật rẻ ở tầng ngoài cùng, và chỉ để một số nhỏ request chạm tới nơi trừ kho. Trừ kho làm trong Redis bằng script Lua (kiểm tra còn hàng, kiểm tra người này chưa mua, trừ, ghi nhận, tất cả trong một bước nguyên tử). Database giữ ràng buộc cuối cùng (UNIQUE theo người mua) và là nguồn sự thật cho đơn; giữ chỗ có hạn 10 phút, hết hạn thì trả kho.

### Vì sao không trừ kho bằng database
~~~sql
UPDATE flash_stock SET remaining = remaining - 1 WHERE sale_id = 7 AND remaining > 0;
~~~
Câu này đúng về logic nhưng mọi request đều tranh **một dòng**: mỗi UPDATE giữ row lock tới khi commit, các request khác xếp hàng. Thực tế một dòng nóng chỉ chịu vài nghìn lượt/giây; 50.000 request/giây sẽ làm hàng đợi lock dài, connection pool cạn, và kéo sập cả các API khác dùng chung database. Redis xử lý lệnh tuần tự trên một thread, mỗi lệnh vài micro giây, nên chịu được khoảng 100.000 thao tác/giây trên một key mà không cần lock.

### Kiến trúc
~~~text
Client --> CDN (trang tĩnh, đếm ngược, trạng thái còn/hết cache 1s)
   |
   v
API Gateway: chặn trước giờ mở, rate limit 1 req/2s mỗi user, captcha/token xếp hàng
   |
   v
Flash Sale Service (cluster riêng) --Lua--> Redis (stock:7, buyers:7)
   |  thành công (tối đa ~1.000 lần)
   v
Ghi reservation vào DB (UNIQUE sale_id+user_id)  ---> Kafka "reservation-created"
   |                                                     |
   v                                                     v
Trả 201 + reservationId                     Payment flow thường / thông báo
                                                         |
Expiry worker: quét reservation PENDING quá hạn --> trả kho (Redis INCR) + EXPIRED
~~~
- Trang sản phẩm và trạng thái "còn hàng/hết hàng" phục vụ từ CDN/cache, cập nhật mỗi giây, nên phần lớn người dùng không chạm vào backend.
- Khi Redis báo hết, service bật cờ **sold_out** trong bộ nhớ: mọi request sau trả 409 ngay, không gọi Redis nữa.

### Trừ kho nguyên tử bằng Lua
~~~text
-- KEYS[1] = stock:{sale}, KEYS[2] = buyers:{sale}, ARGV[1] = userId
if redis.call('SISMEMBER', KEYS[2], ARGV[1]) == 1 then return -2 end   -- đã mua
local left = tonumber(redis.call('GET', KEYS[1]))
if left <= 0 then return -1 end                                        -- hết hàng
redis.call('DECR', KEYS[1])
redis.call('SADD', KEYS[2], ARGV[1])
return left - 1
~~~
Redis chạy cả script như một lệnh duy nhất, không lệnh nào chen giữa "kiểm tra" và "trừ", nên không thể bán vượt. Hai key dùng chung hash tag (đặt phần sale id trong dấu ngoặc nhọn, ví dụ stock:{7} và buyers:{7}) để nằm cùng một slot khi chạy Redis Cluster.

### Ghi đơn và ràng buộc cuối
Sau khi Lua trả thành công, service ghi bảng reservation:
~~~sql
CREATE TABLE reservation (
  id          UUID PRIMARY KEY,
  sale_id     BIGINT NOT NULL,
  user_id     BIGINT NOT NULL,
  status      VARCHAR(16) NOT NULL,      -- PENDING, PAID, EXPIRED, CANCELLED
  expires_at  TIMESTAMPTZ NOT NULL,
  UNIQUE (sale_id, user_id)              -- lưới an toàn cuối: một người một đơn
);
~~~
Chỉ khoảng 1.000 lần ghi, database chịu thoải mái. Nếu ghi DB lỗi sau khi Redis đã trừ, service gọi script hoàn kho (INCR và SREM) rồi trả lỗi; một job đối soát định kỳ so số lượng trong Redis với số reservation PENDING/PAID để sửa lệch.

### Hết hạn giữ chỗ và race với thanh toán
~~~sql
-- worker mỗi 10 giây
UPDATE reservation SET status = 'EXPIRED'
WHERE status = 'PENDING' AND expires_at < now()
RETURNING sale_id, user_id;            -- với mỗi dòng: Redis INCR stock, SREM buyers
-- thanh toán xác nhận
UPDATE reservation SET status = 'PAID' WHERE id = ? AND status = 'PENDING';
~~~
Cả hai đều là cập nhật **có điều kiện trên trạng thái**: nếu thanh toán đến đúng lúc worker vừa đánh EXPIRED, câu UPDATE của thanh toán ảnh hưởng 0 dòng, service hoàn tiền tự động (hoặc cho phép mua nếu kho còn), không bao giờ có hai trạng thái cùng thắng.

### Chống bot và công bằng
- Chặn ở gateway trước giờ mở (request tới sớm trả 425/403 ngay), token mua do trang chờ cấp kèm captcha.
- Rate limit theo user, thiết bị, IP; giới hạn một tài khoản xác thực số điện thoại.
- Hàng đợi ảo (virtual waiting room) nếu cần công bằng theo thứ tự: người dùng nhận số thứ tự, chỉ một nhóm được vào trang mua mỗi giây. Đổi lại tốn công vận hành; nhiều sàn chấp nhận "ai nhanh hơn thì được" kèm chống bot.

### Failure modes
| Sự cố | Ảnh hưởng | Xử lý |
|---|---|---|
| Redis primary chết, replica chưa kịp nhận vài lệnh DECR | Kho trong Redis lớn hơn thực tế, có thể bán vượt vài chiếc | UNIQUE trong DB chặn mua trùng; đối soát tổng reservation, vượt thì huỷ đơn cuối kèm voucher xin lỗi; dùng WAIT 1 0 sau script nếu chấp nhận trễ thêm |
| Ghi DB lỗi sau khi Redis trừ | Kho "mất" một chiếc | Hoàn kho ngay trong luồng lỗi + job đối soát |
| Service flash sale quá tải | Lỗi 5xx | Cluster riêng, autoscale trước giờ G, kill switch tắt sale mà không ảnh hưởng hệ thống chính |
| Bot spam | Người thật không mua được | Captcha, token, rate limit, phát hiện bất thường |

### Giám sát
Số còn lại theo thời gian thực, tỉ lệ 201/409/429/5xx, p99 latency, số reservation PENDING sắp hết hạn, số lệch khi đối soát Redis với DB. Diễn tập tải (load test 2 lần peak) một tuần trước sự kiện.

> Senior tip: điều quan trọng nhất khi trả lời bài này là nói rõ **đâu là nguồn sự thật cho mỗi thứ**: Redis là nguồn sự thật cho "còn được bán không" trong lúc sale (nhanh, chấp nhận lệch nhỏ khi failover), database là nguồn sự thật cho "ai đã mua" (UNIQUE, bền vững), và một job đối soát nối hai bên. Interviewer thường hỏi tiếp "Redis chết thì sao", và câu trả lời tốt luôn có con số: lệch tối đa bao nhiêu chiếc và xử lý phần lệch thế nào với khách.`,
  followups: [
    'Nếu yêu cầu tuyệt đối không được bán vượt dù chỉ một chiếc kể cả khi Redis failover, bạn đổi thiết kế thế nào và mất gì?',
    'Thay vì 1 sản phẩm, flash sale có 500 sản phẩm khác nhau cùng mở lúc 0 giờ: hot key và phân bổ Redis thay đổi ra sao?',
    'Làm sao triển khai hàng đợi ảo (waiting room) để công bằng theo thứ tự đến?',
    'Khách đã thanh toán nhưng đơn bị đánh hết hạn do callback cổng thanh toán đến muộn: luồng xử lý thế nào?'
  ],
  related: ['design-004', 'scenario-049', 'scenario-051', 'scenario-008']
},
{
  id: 'sd-017',
  title: 'Hệ thống voucher và mã giảm giá có giới hạn lượt dùng',
  kind: 'bigtech',
  level: 'senior',
  prompt: `Thiết kế hệ thống voucher cho sàn thương mại điện tử: marketing tạo chiến dịch (giảm 50.000 đồng cho đơn từ 300.000, tối đa 100.000 lượt toàn hệ thống, mỗi khách 1 lượt, hiệu lực 7 ngày), khách "lưu" voucher vào ví rồi áp dụng khi thanh toán. Quy mô: 30 triệu khách, 2.000 đơn/giây giờ cao điểm, một chiến dịch lớn có thể có 1 triệu lượt lưu trong 5 phút đầu. Yêu cầu: **không vượt tổng lượt**, không dùng một voucher hai lần, đơn huỷ thì hoàn lượt. Bạn có 45 phút.`,
  phases: [
    { name: 'Requirements', minutes: 5, guide: `Chốt loại voucher: mã công khai (nhập tay) và voucher cá nhân (đã lưu vào ví); điều kiện áp dụng (giá trị đơn tối thiểu, ngành hàng, kênh thanh toán); giới hạn: tổng lượt, mỗi khách, theo ngày; có cộng dồn nhiều voucher không. Vòng đời: tạo → phát/lưu → giữ (reserve) khi tạo đơn → dùng (redeem) khi thanh toán thành công → hoàn khi huỷ. Non-functional: kiểm tra voucher dưới 50 ms, không vượt lượt, audit đầy đủ.` },
    { name: 'Estimation', minutes: 5, guide: `30 triệu khách × trung bình 10 voucher trong ví = 300 triệu dòng user_voucher (khoảng 100 byte/dòng ≈ 30 GB, cần partition theo user). 2.000 đơn/giây, mỗi đơn kiểm tra 3–5 voucher ứng viên → 10.000 lượt đọc/giây (cache được). Lượt lưu đột biến 1 triệu trong 5 phút ≈ 3.300 ghi/giây trên **một** bộ đếm tổng lượt: hot counter.` },
    { name: 'API & data model', minutes: 5, guide: `POST /vouchers/{campaignId}/claim (Idempotency-Key) → lưu vào ví. GET /wallet/vouchers?cartValue=... → danh sách áp dụng được. POST /orders (kèm voucherIds) → reserve. Bảng campaign (id, rule JSON, total_quota, per_user_limit, starts_at, ends_at); user_voucher (user_id, campaign_id, status CLAIMED/RESERVED/USED/EXPIRED, order_id, version) PK (user_id, campaign_id); voucher_ledger (append-only: claim, reserve, redeem, release).` },
    { name: 'High-level design', minutes: 15, guide: `Voucher service tách khỏi Order service; rule engine đánh giá điều kiện; quota counter trong Redis (hoặc chia nhỏ quota thành nhiều shard) cho lượt lưu; user_voucher trong DB phân vùng theo user; reserve trong cùng luồng tạo đơn bằng saga/TCC: reserve khi tạo đơn, confirm khi thanh toán, release khi huỷ hoặc quá hạn; outbox để đồng bộ sự kiện.` },
    { name: 'Deep dive', minutes: 15, guide: `Đào sâu: hot counter tổng lượt (Redis DECR, quota sharding, cấp phát theo lô cho từng instance); idempotency khi khách bấm lưu nhiều lần; race áp dụng cùng một voucher cho hai đơn song song (UPDATE có điều kiện trên trạng thái); hoàn lượt khi huỷ và chống gian lận (tạo đơn rồi huỷ để giữ voucher); mã công khai bị lộ; đối soát ngân sách marketing.` }
  ],
  rubric: [
    'Phân biệt rõ vòng đời claim, reserve, redeem, release và trạng thái tương ứng',
    'Chống vượt tổng lượt với hot counter: Redis nguyên tử hoặc chia quota theo shard/lô, có đối soát',
    'Chống dùng trùng: UPDATE có điều kiện trên trạng thái/version, UNIQUE theo (user, campaign)',
    'Reserve khi tạo đơn, confirm khi thanh toán, release khi huỷ hoặc hết hạn (saga/TCC)',
    'Idempotency cho claim và cho reserve theo orderId',
    'Rule engine đánh giá điều kiện áp dụng, cache campaign',
    'Dữ liệu ví phân vùng theo user, ước lượng dung lượng',
    'Ledger append-only để audit và đối soát ngân sách',
    'Chống gian lận: giới hạn theo thiết bị/tài khoản, mã công khai bị lộ',
    'Nêu trade-off nhất quán chặt và hiệu năng'
  ],
  reference: `**Tóm tắt:** Voucher là bài toán **đếm có giới hạn dưới tải cao** cộng **máy trạng thái không được chạy hai lần**. Tách vòng đời thành bốn bước: **claim** (lưu vào ví, trừ quota tổng), **reserve** (gắn vào đơn khi tạo đơn), **redeem** (xác nhận khi thanh toán thành công), **release** (hoàn khi đơn huỷ hoặc giữ chỗ hết hạn). Quota tổng là một hot counter nên đặt ở Redis (DECR nguyên tử) hoặc chia thành nhiều shard; mọi chuyển trạng thái của từng voucher là UPDATE có điều kiện trong DB để không thể dùng hai lần. Mọi thay đổi ghi vào ledger append-only để đối soát ngân sách marketing.

### Vòng đời và trạng thái
~~~text
           claim                 reserve(orderId)            redeem(orderId)
(campaign) -----> CLAIMED  ---------------------> RESERVED ------------------> USED
                     ^                                |
                     |        release (huỷ đơn, hết hạn giữ 30 phút)
                     +--------------------------------+
CLAIMED --(hết hạn chiến dịch)--> EXPIRED
~~~
Mỗi mũi tên là một câu UPDATE có điều kiện trên trạng thái hiện tại:
~~~sql
-- reserve: chỉ thành công nếu voucher đang CLAIMED và còn hạn
UPDATE user_voucher
SET status = 'RESERVED', order_id = :orderId, reserved_at = now()
WHERE user_id = :userId AND campaign_id = :campaignId
  AND status = 'CLAIMED' AND expires_at > now();
-- 0 dòng => voucher đã được dùng cho đơn khác hoặc hết hạn => từ chối
~~~
Hai đơn song song cùng dùng một voucher: chỉ một câu UPDATE thắng, câu kia ảnh hưởng 0 dòng. Gọi lại reserve với cùng orderId (retry) phải trả thành công: kiểm tra {{status = 'RESERVED' AND order_id = :orderId}} trước khi báo lỗi.

### Quota tổng: hot counter
Một triệu lượt claim trong 5 phút đổ vào **một** bộ đếm. Ba lựa chọn:
| Cách | Thông lượng | Độ chính xác | Ghi chú |
|---|---|---|---|
| UPDATE campaign SET remaining = remaining - 1 WHERE remaining > 0 | Vài nghìn/giây trên một dòng | Tuyệt đối | Lock dòng nóng, dễ nghẽn |
| Redis DECR (Lua kiểm tra không âm) | Khoảng 100.000/giây | Lệch nhỏ khi failover | Đối soát với ledger |
| Chia quota thành 16 shard (16 key hoặc 16 dòng), chọn shard ngẫu nhiên | Gấp 16 lần | Tuyệt đối nếu ở DB | Khi một shard hết thì thử shard khác |
Thực tế: Redis DECR cho đường nóng, DB ghi user_voucher với PK (user_id, campaign_id) bảo đảm mỗi người một lượt, job đối soát mỗi phút so tổng claim trong DB với quota.

### Kiến trúc
~~~text
App --> API Gateway --> Voucher Service --(DECR quota)--> Redis
                          |  rule engine (campaign cache 30s)
                          v
                  DB user_voucher (partition theo hash user_id) + voucher_ledger
                          ^
Order Service --reserve/confirm/release (đồng bộ, idempotent theo orderId)--+
                          |
                     outbox --> Kafka (voucher-events) --> báo cáo ngân sách, CRM
~~~
- **Áp dụng khi checkout**: Order Service gọi reserve trong luồng tạo đơn (đồng bộ, timeout 200 ms); thanh toán thành công thì gọi redeem; đơn huỷ hoặc không thanh toán sau 30 phút thì release. Đây là saga dạng TCC: Try (reserve), Confirm (redeem), Cancel (release).
- **Rule engine**: điều kiện (giá trị đơn tối thiểu, ngành hàng, kênh thanh toán, khung giờ) lưu dạng JSON có version, cache theo campaign; đánh giá trên snapshot giỏ hàng gửi kèm.

### Chống gian lận
- Mã công khai bị đăng lên mạng: giới hạn theo tài khoản đã xác thực, thiết bị, phương thức thanh toán; mã cá nhân gắn với user thay vì mã chung.
- Tạo đơn rồi huỷ để "giữ" voucher: reserve có hạn 30 phút; huỷ nhiều lần thì hạ mức ưu tiên hoặc không hoàn lượt.
- Bot claim hàng loạt: rate limit, captcha khi claim chiến dịch lớn.

### Đối soát ngân sách
voucher_ledger ghi mọi sự kiện (claim, reserve, redeem, release) kèm số tiền giảm. Báo cáo cuối ngày: tổng redeem × giá trị giảm phải khớp chi phí marketing ghi nhận ở kế toán; số CLAIMED + RESERVED + USED không vượt quota.

### Failure modes
| Sự cố | Ảnh hưởng | Xử lý |
|---|---|---|
| Redis mất vài DECR khi failover | Có thể vượt quota vài lượt | Đối soát, chặn claim khi DB vượt quota, chấp nhận lệch nhỏ đã thống nhất với marketing |
| Order Service gọi reserve timeout | Không biết đã reserve chưa | Retry cùng orderId (idempotent), release theo hạn nếu đơn không tạo |
| Đơn huỷ nhưng sự kiện huỷ bị mất | Voucher kẹt RESERVED | Job quét RESERVED quá hạn đối chiếu trạng thái đơn |
| Campaign sửa điều kiện khi đang chạy | Đơn cũ/mới đánh giá khác nhau | Rule có version, đơn lưu version đã áp dụng |

> Senior tip: hãy nói rõ voucher là **tiền** của công ty: mọi lượt dùng phải có dấu vết trong ledger và đối soát được với kế toán. Interviewer đánh giá cao ứng viên chủ động hỏi "lệch quota bao nhiêu lượt thì marketing chấp nhận được", vì câu trả lời quyết định chọn Redis (nhanh, lệch nhỏ khi sự cố) hay counter chia shard trong DB (chậm hơn, chính xác tuyệt đối).`,
  followups: [
    'Cho phép cộng dồn tối đa 3 voucher (một của shop, một của sàn, một freeship): chọn tổ hợp tốt nhất cho khách thế nào?',
    'Marketing muốn tăng quota giữa chiến dịch hoặc dừng khẩn cấp: thiết kế thay đổi ra sao?',
    'Hoàn tiền một phần cho đơn đã dùng voucher: phân bổ giá trị giảm cho từng sản phẩm thế nào?',
    'Làm sao phát hiện và chặn nhóm tài khoản ảo săn voucher?'
  ],
  related: ['scenario-050', 'scenario-056', 'design-004']
},
{
  id: 'sd-018',
  title: 'Hệ thống đặt lệnh và khớp lệnh chứng khoán',
  kind: 'bank',
  level: 'lead',
  prompt: `Công ty chứng khoán muốn xây hệ thống nhận lệnh mua/bán cổ phiếu từ app và **khớp lệnh nội bộ** (order book theo từng mã) trong giờ giao dịch. Quy mô: 2 triệu tài khoản, 1.500 mã, giờ mở cửa 30.000 lệnh/giây, mã nóng nhất chiếm 15% lượng lệnh. Yêu cầu: khớp theo **ưu tiên giá rồi thời gian**, trả xác nhận đặt lệnh dưới 50 ms, kiểm tra sức mua/số dư chứng khoán trước khi nhận lệnh, không được khớp sai hay mất lệnh khi một máy chết, kết quả phải tái lập được cho kiểm toán. Bạn có 45 phút.`,
  phases: [
    { name: 'Requirements', minutes: 5, guide: `Chốt loại lệnh (LO giới hạn, MP thị trường, huỷ, sửa), phiên (khớp liên tục, ATO/ATC khớp định kỳ có thể out-of-scope), đơn vị giá (bước giá), lô. Kiểm tra trước giao dịch: sức mua (tiền), số dư chứng khoán khả dụng (bán). Non-functional: p99 nhận lệnh 50 ms, khớp tuần tự xác định (deterministic), sẵn sàng cao trong giờ giao dịch, audit 10 năm. Hỏi rõ: nội bộ hay chuyển lên sở; ở đây giả định khớp nội bộ.` },
    { name: 'Estimation', minutes: 5, guide: `30.000 lệnh/giây toàn hệ thống, mã nóng 4.500 lệnh/giây. Một engine khớp lệnh đơn luồng trong bộ nhớ xử lý hàng trăm nghìn lệnh/giây (thao tác trên cây giá + hàng đợi), nên một luồng cho một mã là đủ, chia 1.500 mã cho vài chục engine. Lưu trữ: 30.000 × 6,5 giờ ≈ 700 triệu sự kiện/ngày × 200 byte ≈ 140 GB/ngày cho log sự kiện.` },
    { name: 'API & data model', minutes: 5, guide: `POST /orders {clientOrderId, symbol, side, type, price, qty} → 202 {orderId, status: ACCEPTED} hoặc 422 (thiếu sức mua). DELETE /orders/{id}. Luồng sự kiện về app qua WebSocket: ACCEPTED, PARTIALLY_FILLED, FILLED, CANCELLED, REJECTED. Dữ liệu: order (id, account, symbol, side, price, qty, filled_qty, status, seq), trade (id, buy_order, sell_order, price, qty, seq), sổ cái tiền và chứng khoán (append-only), log sự kiện đầu vào theo mã (sequence number).` },
    { name: 'High-level design', minutes: 15, guide: `Gateway → Order Service (xác thực, idempotency, kiểm tra rủi ro: phong toả tiền/chứng khoán) → ghi lệnh vào log có thứ tự theo mã (Kafka partition theo symbol hoặc journal riêng) → Matching Engine đơn luồng cho mỗi nhóm mã, state trong RAM, đọc log tuần tự → phát sự kiện khớp → Settlement/Ledger cập nhật tiền và chứng khoán → Notification qua WebSocket. Engine dự phòng đọc cùng log để sẵn sàng thay thế.` },
    { name: 'Deep dive', minutes: 15, guide: `Đào sâu: cấu trúc order book (TreeMap theo giá + hàng đợi FIFO mỗi mức giá), vì sao đơn luồng mỗi mã (xác định, không lock); event sourcing và tái lập sau khi engine chết (snapshot + replay từ offset); phong toả sức mua trước khi gửi lệnh vào engine và giải phóng khi huỷ; huỷ lệnh đi cùng hàng đợi với đặt lệnh để giữ thứ tự; tránh khớp hai lần khi failover (engine dự phòng chỉ phát sự kiện sau khi nhận quyền leader, sự kiện có seq để downstream khử trùng).` }
  ],
  rubric: [
    'Order book theo mã: mức giá sắp xếp, hàng đợi FIFO trong cùng mức giá, ưu tiên giá rồi thời gian',
    'Engine khớp lệnh đơn luồng cho mỗi mã (hoặc nhóm mã), state trong bộ nhớ, giải thích vì sao không dùng DB lock',
    'Log đầu vào có thứ tự (sequence) theo mã làm nguồn sự thật, event sourcing để tái lập',
    'Snapshot định kỳ + replay khi khôi phục, engine dự phòng hot standby',
    'Kiểm tra và phong toả sức mua/chứng khoán trước khi lệnh vào engine; giải phóng khi huỷ/khớp',
    'Huỷ và sửa lệnh đi cùng log với đặt lệnh để giữ thứ tự xác định',
    'Idempotency theo clientOrderId; sự kiện có seq để downstream khử trùng',
    'Sổ cái tiền/chứng khoán append-only, đối soát cuối ngày',
    'Phân bổ mã cho engine, xử lý mã nóng',
    'Audit, tái lập kết quả khớp, giám sát độ trễ end-to-end'
  ],
  reference: `**Tóm tắt:** Trái tim là **matching engine đơn luồng cho mỗi mã chứng khoán**, giữ order book trong RAM và xử lý lệnh tuần tự từ một **log đầu vào có số thứ tự**. Đơn luồng nghe có vẻ chậm nhưng ngược lại: không lock, không tranh chấp, mỗi lệnh chỉ vài micro giây, và quan trọng nhất là **xác định**: cùng một log đầu vào luôn cho cùng kết quả khớp, nên khôi phục sau sự cố và kiểm toán chỉ là replay log. Mọi kiểm tra tiền và chứng khoán (phong toả sức mua) làm **trước** khi lệnh vào log, để engine chỉ lo khớp.

### Order book của một mã
~~~text
          BÁN (ask)  giá tăng dần
  25.300 | [S7 1.000] [S9 500]          <- giá bán thấp nhất được ưu tiên
  25.200 | [S3 2.000]
  ---------------------------------
  25.100 | [B4 1.500] [B8 300]          <- giá mua cao nhất được ưu tiên
  25.000 | [B1 1.000] [B2 700] [B6 400]
          MUA (bid)  giá giảm dần
Mỗi mức giá: hàng đợi FIFO theo thời gian vào sổ
~~~
Cấu trúc: hai cây sắp theo giá (Java {{TreeMap<Long, ArrayDeque<Order>>}}, giá lưu bằng số nguyên theo bước giá) và một map orderId → order để huỷ nhanh. Lệnh mua giá 25.300 khối lượng 1.200 đến: khớp 1.000 với S7 rồi 200 với S9 ở mức 25.300 (giá của lệnh đang chờ), phần còn lại của S9 vẫn nằm sổ.

### Vì sao đơn luồng
- Khớp lệnh về bản chất là tuần tự: lệnh sau phụ thuộc trạng thái sổ sau lệnh trước. Song song hoá trong cùng một mã chỉ thêm lock mà không thêm thông lượng.
- Không lock, dữ liệu nằm gọn trong cache CPU: một luồng xử lý hàng trăm nghìn lệnh mỗi giây. Mã nóng nhất 4.500 lệnh/giây còn rất xa trần.
- Song song **giữa các mã**: 1.500 mã chia cho khoảng 20 engine (theo hash hoặc theo tải), mỗi engine một luồng khớp chính.

### Luồng xử lý
~~~seq
title: Đặt lệnh mua và khớp
actors: App | Order Service | Risk | Log | Engine | Ledger
App -> Order Service: POST /orders (clientOrderId)
Order Service -> Risk: phong toả sức mua = giá x khối lượng + phí
Risk --> Order Service: OK, đã phong toả
Order Service -> Log: append NEW_ORDER (seq theo mã)
Order Service --> App: 202 ACCEPTED
Log -> Engine: đọc tuần tự theo seq
Engine -> Engine: khớp theo giá rồi thời gian
Engine -> Log: append TRADE, ORDER_UPDATED (seq đầu ra)
Log -> Ledger: chuyển tiền và chứng khoán, giải phóng phong toả thừa
Ledger --> App: thông báo khớp qua WebSocket
~~~
- **Log đầu vào** là nguồn sự thật: Kafka topic phân vùng theo mã (một partition giữ thứ tự cho một nhóm mã) hoặc journal chuyên dụng có replication. Order Service chỉ trả 202 sau khi lệnh đã ghi bền vào log (acks=all).
- **Huỷ và sửa lệnh** cũng là sự kiện trong cùng log, nên thứ tự giữa "đặt" và "huỷ" luôn xác định.
- **Idempotency**: clientOrderId duy nhất theo tài khoản; gửi lại cùng clientOrderId trả kết quả cũ.

### Kiểm tra trước giao dịch
Lệnh mua: phong toả tiền = giá × khối lượng + phí ước tính, trong sổ cái tiền (UPDATE có điều kiện số dư khả dụng ≥ số cần phong toả). Lệnh bán: phong toả chứng khoán khả dụng. Khi khớp ở giá tốt hơn hoặc huỷ phần còn lại, Ledger giải phóng phần phong toả thừa. Engine không bao giờ phải hỏi "có đủ tiền không", nên không có I/O trong vòng khớp.

### Khôi phục và sẵn sàng cao
- Engine chính ghi **snapshot** order book mỗi vài phút kèm seq cuối cùng đã xử lý.
- Engine dự phòng đọc cùng log, giữ state song song (hot standby) nhưng **không phát** sự kiện đầu ra.
- Engine chính chết: cơ chế bầu leader (ví dụ lease trong etcd/ZooKeeper) chuyển quyền; engine dự phòng tiếp tục từ seq đã xử lý, đầu ra mang seq nên downstream khử trùng nếu có sự kiện bị phát hai lần quanh thời điểm chuyển.
- Mất cả hai: dựng engine mới từ snapshot cuối + replay log từ seq đó; vì xử lý xác định nên kết quả trùng khớp tuyệt đối.

### Lưu trữ và kiểm toán
Log đầu vào và log đầu ra lưu dài hạn (object storage, 10 năm). Kiểm toán viên có thể replay một ngày giao dịch và so sánh từng trade. Sổ cái tiền và chứng khoán append-only, đối soát cuối ngày: tổng tiền phong toả bằng tổng giá trị lệnh đang chờ, tổng trade khớp với Ledger.

### Failure modes
| Sự cố | Ảnh hưởng | Xử lý |
|---|---|---|
| Engine chính chết giữa phiên | Gián đoạn vài giây | Hot standby nhận quyền, tiếp tục từ seq |
| Sự kiện đầu ra phát trùng khi failover | Ledger cộng hai lần | Ledger khử trùng theo (symbol, seq đầu ra) |
| Risk phong toả thành công nhưng ghi log lỗi | Tiền bị giữ mà không có lệnh | Giải phóng ngay trong luồng lỗi + job đối soát phong toả mồ côi |
| Mã nóng vượt năng lực một engine | Độ trễ tăng | Tách mã đó ra engine riêng, tối ưu cấu trúc dữ liệu, không tách một mã ra nhiều luồng |

> Senior tip: câu hỏi kiểm tra tư duy lead nhất là "vì sao không dùng database với SELECT FOR UPDATE để khớp lệnh". Hãy trả lời bằng ba ý: khớp lệnh là tuần tự theo bản chất nên lock chỉ thêm chi phí; engine trong RAM đơn luồng nhanh hơn hàng trăm lần; và quan trọng nhất là tính **xác định** từ log có thứ tự, thứ biến khôi phục và kiểm toán thành bài toán replay. Đây là cùng ý tưởng với kiến trúc LMAX nổi tiếng trong ngành tài chính.`,
  followups: [
    'Phiên ATO/ATC khớp lệnh định kỳ (tìm một mức giá khớp nhiều nhất) khác khớp liên tục thế nào về thuật toán và thiết kế?',
    'Làm sao gửi lệnh lên sở giao dịch thay vì khớp nội bộ mà vẫn giữ thứ tự và không gửi trùng?',
    'Nhà đầu tư huỷ lệnh đúng lúc lệnh đang được khớp: kết quả xác định thế nào?',
    'Bạn đo và đảm bảo p99 độ trễ end-to-end dưới 50 ms ra sao?'
  ],
  related: ['design-017']
},
{
  id: 'sd-019',
  title: 'Bảng xếp hạng thời gian thực cho game và mini-app khuyến mãi',
  kind: 'bigtech',
  level: 'senior',
  prompt: `Ví điện tử chạy mini-game khuyến mãi 7 ngày: người chơi kiếm điểm qua giao dịch và nhiệm vụ, xem **top 100** toàn quốc, **thứ hạng của chính mình** và **những người xung quanh mình**, cập nhật gần thời gian thực. Quy mô: 10 triệu người chơi, 5.000 sự kiện cộng điểm/giây lúc cao điểm, 50.000 lượt xem bảng xếp hạng/giây. Kết thúc chiến dịch phải chốt kết quả chính xác để trao thưởng, chống gian lận điểm. Bạn có 45 phút.`,
  phases: [
    { name: 'Requirements', minutes: 5, guide: `Chốt: điểm chỉ tăng hay có thể giảm; xếp hạng khi bằng điểm (ai đạt trước xếp trên); độ trễ chấp nhận được (vài giây); có bảng theo tỉnh/bạn bè không; chốt kết quả lúc nào và có đóng băng điểm không. Non-functional: đọc 50.000/giây p99 dưới 100 ms, ghi 5.000/giây, kết quả trao thưởng chính xác tuyệt đối và kiểm toán được.` },
    { name: 'Estimation', minutes: 5, guide: `10 triệu thành viên trong một Redis sorted set: mỗi phần tử khoảng 60–100 byte (skiplist + hash), tổng khoảng 1 GB, vừa một instance. ZINCRBY 5.000/giây và ZREVRANK/ZREVRANGE 50.000/giây đều O(log N) với N = 10 triệu (khoảng 24 bước), một Redis xử lý được; top 100 cache 1 giây giảm phần lớn lượt đọc.` },
    { name: 'API & data model', minutes: 5, guide: `GET /leaderboards/{campaign}/top?limit=100; GET /leaderboards/{campaign}/me (rank, score, 5 người trên/dưới). Sự kiện vào: Kafka topic point-events {eventId, userId, delta, source, occurredAt}. Lưu bền: bảng point_ledger (event_id PK, user_id, delta, source, created_at) append-only; bảng user_score (user_id, score, reached_at) là kết quả tổng hợp.` },
    { name: 'High-level design', minutes: 15, guide: `Nguồn sự kiện (giao dịch, nhiệm vụ) → Kafka → Score Service: khử trùng theo eventId, ghi point_ledger (DB, nguồn sự thật), cập nhật Redis sorted set (ZINCRBY) → Leaderboard API đọc Redis, cache top 100 trong 1 giây ở API/CDN. Chốt kết quả: tính lại từ point_ledger, không lấy thẳng từ Redis.` },
    { name: 'Deep dive', minutes: 15, guide: `Tie-break bằng điểm kết hợp thời gian (score * 10^k + (Tmax - t)); khử trùng sự kiện; Redis mất dữ liệu thì dựng lại từ ledger; scale khi 100 triệu người (shard theo dải điểm hoặc tính rank xấp xỉ); bảng theo tỉnh/bạn bè; chống gian lận (giới hạn điểm/ngày, phát hiện bất thường, đóng băng trước khi chốt).` }
  ],
  rubric: [
    'Dùng sorted set (Redis ZSET) với ZINCRBY, ZREVRANK, ZREVRANGE và giải thích độ phức tạp O(log N)',
    'Xử lý bằng điểm: mã hoá thời gian đạt điểm vào score hoặc khoá phụ',
    'Nguồn sự thật bền vững (point ledger) tách khỏi Redis; dựng lại Redis từ ledger',
    'Khử trùng sự kiện cộng điểm (idempotency theo eventId)',
    'Cache top 100 ngắn hạn để giảm tải đọc',
    '"Người xung quanh tôi" bằng ZREVRANK rồi ZREVRANGE quanh vị trí đó',
    'Chốt kết quả trao thưởng từ ledger, có đóng băng và kiểm toán',
    'Chống gian lận: giới hạn, phát hiện bất thường, xem xét trước khi trao thưởng',
    'Phương án scale khi số người chơi vượt một instance',
    'Giám sát độ trễ cập nhật, lệch giữa Redis và ledger'
  ],
  reference: `**Tóm tắt:** Dùng **Redis sorted set** làm chỉ mục xếp hạng: ZINCRBY cộng điểm, ZREVRANGE lấy top, ZREVRANK lấy hạng của tôi, tất cả O(log N), với 10 triệu người chỉ khoảng 24 bước so sánh. Nhưng Redis **không** là nguồn sự thật: mọi lần cộng điểm được ghi vào **point ledger** append-only trong database (khử trùng theo eventId), Redis chỉ là bản chiếu có thể dựng lại. Kết quả trao thưởng tính lại từ ledger sau khi đóng băng, không lấy thẳng từ Redis.

### Vì sao sorted set
Sorted set của Redis là skiplist kết hợp hash: tìm vị trí, chèn, cập nhật điểm đều O(log N); lấy hạng của một phần tử cũng O(log N) nhờ skiplist lưu số phần tử bỏ qua ở mỗi tầng. Database quan hệ trả lời "hạng của user X" phải đếm {{COUNT(*) WHERE score > x}}, chậm dần theo số người chơi và không chịu được 50.000 lượt/giây.
~~~text
ZINCRBY lb:summer 30 user:42             -- cộng 30 điểm
ZREVRANGE lb:summer 0 99 WITHSCORES      -- top 100
ZREVRANK lb:summer user:42               -- hạng của tôi (0 là hạng nhất)
ZREVRANGE lb:summer (r-5) (r+5)          -- 5 người trên, 5 người dưới quanh hạng r
~~~

### Bằng điểm thì ai đứng trên
Yêu cầu "ai đạt điểm trước xếp trên". Sorted set khi bằng điểm sắp theo thứ tự từ điển của member, không theo thời gian. Cách phổ biến: mã hoá thời gian vào score.
~~~text
score_lưu = điểm * 10^7 + (T_kết_thúc - thời_điểm_đạt_điểm_tính_bằng_giây)
~~~
Ai đạt cùng điểm sớm hơn có phần thời gian lớn hơn nên xếp trên. Score của Redis là số double, chính xác tuyệt đối tới 2^53 (khoảng 9 × 10^15), nên với khoảng 7 ngày (khoảng 605.000 giây, cần 10^6) và điểm tới 10^8 vẫn an toàn; tính kỹ biên trước khi chọn hệ số. Vì score lưu đã chứa thời gian, cộng điểm phải đọc điểm hiện tại từ ledger/hash rồi ghi lại score mới bằng một script Lua, không dùng ZINCRBY thô.

### Kiến trúc
~~~text
Giao dịch, nhiệm vụ --> Kafka point-events (partition theo userId)
                              |
                              v
                       Score Service
       1) INSERT point_ledger (event_id PK) -- trùng thì bỏ qua
       2) cập nhật user_score (DB) cùng transaction
       3) Lua: tính score mã hoá -> ZADD lb:summer
                              |
App --> Leaderboard API --> Redis (ZSET)      Top 100 cache 1 giây (API + CDN)
~~~
- Partition Kafka theo userId để sự kiện của một người xử lý tuần tự, không race khi tính điểm mới.
- Thứ tự: ghi DB trước, Redis sau. Redis lỗi thì sự kiện vẫn đã an toàn trong ledger; một job đồng bộ lại.
- Đọc top 100: 50.000 lượt/giây nhưng kết quả giống nhau cho mọi người, cache 1 giây giảm tải Redis còn vài lượt/giây; chỉ "hạng của tôi" mới thật sự đi vào Redis.

### Dựng lại và chốt kết quả
- Redis mất dữ liệu: dựng lại sorted set từ bảng user_score (10 triệu dòng, vài phút với pipeline ZADD theo lô).
- Đối soát mỗi giờ: lấy mẫu người chơi, so điểm trong Redis với user_score.
- Kết thúc chiến dịch: **đóng băng** (ngừng nhận sự kiện có thời điểm sau giờ kết thúc), chờ consumer xử lý hết lag, tính bảng xếp hạng cuối từ user_score bằng SQL (ORDER BY score DESC, reached_at ASC), lưu snapshot kèm hash để kiểm toán, rồi mới công bố.

### Chống gian lận
- Giới hạn điểm theo ngày và theo nguồn; sự kiện chỉ đến từ hệ thống nội bộ (giao dịch đã quyết toán), không nhận điểm từ client.
- Phát hiện bất thường: tăng điểm đột biến, nhiều tài khoản cùng thiết bị, giao dịch vòng tròn giữa các tài khoản.
- Top người thắng giải được xét duyệt trước khi trao thưởng.

### Scale khi 100 triệu người
Một sorted set 100 triệu phần tử khoảng 10 GB, vẫn chạy được trên một instance lớn nhưng là điểm nghẽn ghi. Phương án: chia nhiều sorted set theo dải điểm (người điểm thấp ở set riêng, hạng = số người ở các set trên + hạng trong set), hoặc chấp nhận **hạng xấp xỉ** cho người ngoài top 10.000 ("bạn ở top 15%") tính từ histogram điểm, chỉ giữ chính xác cho nhóm đầu.

### Failure modes
| Sự cố | Ảnh hưởng | Xử lý |
|---|---|---|
| Sự kiện cộng điểm gửi lặp | Điểm bị cộng hai lần | event_id là khoá chính trong ledger, trùng thì bỏ qua |
| Redis failover mất vài cập nhật | Hạng hiển thị lệch tạm thời | Đồng bộ lại từ user_score, kết quả chốt từ DB |
| Consumer lag lúc cao điểm | Bảng chậm cập nhật vài chục giây | Theo dõi lag, scale consumer theo số partition |
| Gian lận điểm | Trao thưởng sai | Giới hạn, phát hiện bất thường, duyệt trước khi trao |

> Senior tip: điểm phân biệt câu trả lời senior là tách bạch "hiển thị" và "trao thưởng". Redis cho trải nghiệm thời gian thực và được phép lệch vài giây; còn danh sách người nhận giải phải tính lại từ ledger bền vững sau khi đóng băng, có snapshot và hash để kiểm toán. Nói được điều này cùng cách xử lý bằng điểm theo thời gian là đủ thuyết phục interviewer.`,
  followups: [
    'Thêm bảng xếp hạng theo tỉnh và theo danh sách bạn bè (mỗi người vài trăm bạn): thiết kế thay đổi thế nào?',
    'Điểm có thể bị trừ (hoàn giao dịch): ảnh hưởng gì tới thiết kế và tie-break?',
    'Làm sao hiển thị "bạn vừa vượt 3 người" ngay sau khi cộng điểm mà không quá tải Redis?',
    'Với 500 triệu người chơi toàn cầu, bạn tính hạng gần đúng thế nào?'
  ],
  related: ['design-031']
},
{
  id: 'sd-020',
  title: 'Đếm click quảng cáo thời gian thực để tính tiền nhà quảng cáo',
  kind: 'bigtech',
  level: 'senior',
  prompt: `Nền tảng quảng cáo nhận **1 tỷ click mỗi ngày** (cao điểm 50.000 click/giây). Nhà quảng cáo cần dashboard số click theo từng quảng cáo **mỗi phút**, độ trễ dưới 1–2 phút, và hoá đơn cuối ngày phải **chính xác** (không đếm thiếu, không đếm trùng) vì tính tiền theo click (CPC). Cần lọc click gian lận (bot, click lặp). Thiết kế hệ thống thu thập và tổng hợp. Bạn có 45 phút.`,
  phases: [
    { name: 'Requirements', minutes: 5, guide: `Chốt: đếm theo ad_id và cửa sổ 1 phút (có thể thêm country, device); truy vấn N phút/giờ gần nhất; top 100 quảng cáo được click nhiều nhất mỗi phút; số liệu dashboard được phép lệch nhẹ và được sửa sau, còn **số tính tiền phải đúng tuyệt đối**; click đến trễ (mạng mobile chập chờn) vài phút vẫn phải được tính đúng phút xảy ra.` },
    { name: 'Estimation', minutes: 5, guide: `1 tỷ/ngày ≈ 11.600 click/giây trung bình, cao điểm 50.000/giây. Mỗi sự kiện khoảng 200 byte → khoảng 200 GB/ngày dữ liệu thô, giữ 90 ngày trên object storage. Kết quả tổng hợp: 200.000 quảng cáo đang chạy × 1.440 phút = tối đa 288 triệu dòng/ngày, thực tế thưa hơn nhiều vì phần lớn quảng cáo không có click mỗi phút.` },
    { name: 'API & data model', minutes: 5, guide: `Click đi qua redirect: GET /click?token=... → ghi sự kiện rồi 302 về trang đích. Sự kiện: click_id (sinh lúc hiển thị quảng cáo, dùng khử trùng), ad_id, user/device, ip, event_time. Kết quả: bảng ad_clicks_minute (ad_id, minute, clicks, invalid_clicks) khoá chính (ad_id, minute) để ghi lặp vẫn an toàn (upsert). Truy vấn: GET /ads/ID/clicks?from=&to=&granularity=minute.` },
    { name: 'High-level design', minutes: 15, guide: `Click Service (stateless) → Kafka topic clicks (partition theo ad_id) → hai nhánh: (1) Stream processor (Flink) gom cửa sổ 1 phút theo event time, khử trùng click_id, lọc gian lận cơ bản, upsert vào OLAP store (ClickHouse/Druid) cho dashboard; (2) sink thô vào S3 (data lake). Job batch hằng ngày tính lại từ dữ liệu thô làm số chốt hoá đơn và đối soát với số streaming.` },
    { name: 'Deep dive', minutes: 15, guide: `Event time vs processing time, watermark và click đến trễ; exactly-once từ Kafka tới kết quả (checkpoint + sink idempotent); quảng cáo "hot" gây lệch partition (salting rồi gộp 2 tầng); khử trùng click_id với state có TTL; lọc gian lận; đối soát streaming và batch; sự cố consumer chết, replay từ offset.` }
  ],
  rubric: [
    'Ghi sự kiện thô vào Kafka trước khi tổng hợp, có thể replay',
    'Gom theo cửa sổ 1 phút dựa trên event time, không dùng thời điểm xử lý',
    'Watermark và cách xử lý sự kiện đến trễ (allowed lateness, side output, batch sửa sau)',
    'Exactly-once hiệu quả: checkpoint + ghi kết quả idempotent theo khoá (ad_id, minute)',
    'Khử trùng theo click_id và lọc click gian lận trước khi tính tiền',
    'Xử lý quảng cáo hot (key skew): pre-aggregate có salting rồi gộp',
    'Tách số hiển thị (streaming) và số tính tiền (batch tính lại từ dữ liệu thô), có đối soát',
    'Chọn kho lưu kết quả phù hợp truy vấn theo thời gian (OLAP/columnar)',
    'Ước lượng throughput và dung lượng hợp lý',
    'Giám sát consumer lag, tỉ lệ sự kiện trễ, chênh lệch streaming vs batch'
  ],
  reference: `**Tóm tắt:** Click đi qua một redirect service ghi sự kiện vào **Kafka** (nguồn sự thật có thể replay), một **stream processor** như Flink gom theo **cửa sổ 1 phút theo event time** với watermark, khử trùng theo click_id và ghi kết quả **idempotent** (upsert theo ad_id + phút) vào kho OLAP cho dashboard. Song song, dữ liệu thô được lưu vào S3 và một **job batch** hằng ngày tính lại để chốt hoá đơn, rồi đối soát với số streaming. Hiển thị cần nhanh, tính tiền cần đúng: hai yêu cầu này được phục vụ bởi hai đường khác nhau.

### Vì sao không UPDATE counter trong database
Cách ngây thơ: mỗi click chạy {{UPDATE ad_stats SET clicks = clicks + 1 WHERE ad_id = ? AND minute = ?}}. Với 50.000 click/giây, các quảng cáo hot dồn vào cùng một dòng, row lock xếp hàng, database chết. Thêm nữa, nếu ứng dụng retry sau timeout thì click bị cộng hai lần mà không ai biết. Ghi **sự kiện** (append-only, rẻ) rồi **tổng hợp theo lô nhỏ** mới chịu được tải và cho phép tính lại khi có lỗi.

### Kiến trúc
~~~text
Người dùng click --> Click Service (302 về trang đích)
                          | produce (acks=all, idempotent producer)
                          v
                 Kafka "clicks" (partition theo ad_id, giữ 7 ngày)
                    |                               |
                    v                               v
       Flink: khử trùng click_id,              Sink thô --> S3 (Parquet, theo giờ)
       lọc gian lận, cửa sổ 1 phút                          |
                    | upsert (ad_id, minute)                v
                    v                              Spark batch hằng ngày:
       ClickHouse/Druid --> Dashboard API          tính lại, chốt hoá đơn,
                                                   đối soát với số streaming
~~~

### Event time, watermark và click đến trễ
Click xảy ra lúc 10:00:58 trên điện thoại mất sóng, tới server lúc 10:02:10. Nếu gom theo thời điểm xử lý, click này rơi nhầm vào phút 10:02. Phải gom theo **event time** (thời điểm click xảy ra). Nhưng khi nào thì "đóng" cửa sổ 10:00? Đó là việc của **watermark**: một mốc "tôi tin rằng sự kiện có event time trước T đã đến hết". Với watermark trễ 15 giây, cửa sổ 10:00–10:01 được phát kết quả khi watermark vượt 10:01:00, tức khoảng 10:01:15.
- Click trễ hơn watermark nhưng vẫn trong **allowed lateness** (ví dụ 5 phút): Flink tính lại cửa sổ và phát kết quả cập nhật. Vì kết quả được upsert theo (ad_id, minute), bản mới ghi đè bản cũ.
- Click trễ hơn nữa: đưa ra **side output**, ghi riêng; job batch cuối ngày sẽ tính đúng.

### Exactly-once hiệu quả
Không có "exactly-once delivery" xuyên suốt; cái ta cần là **kết quả** như thể mỗi click được đếm đúng một lần:
1. Producer bật idempotence để retry không tạo bản ghi trùng trong Kafka.
2. Flink checkpoint định kỳ lưu cả offset Kafka lẫn state (bộ đếm đang gom). Khi crash, nó khôi phục state và đọc lại từ offset của checkpoint, nên mỗi sự kiện ảnh hưởng state đúng một lần.
3. Sink ghi kết quả bằng **upsert theo khoá (ad_id, minute)**: ghi lại cùng kết quả sau khi khôi phục cũng không sao.
4. Khử trùng ở mức nghiệp vụ: click_id sinh lúc hiển thị quảng cáo; Flink giữ state "đã thấy click_id" với TTL vài giờ, gặp lại thì bỏ.

### Quảng cáo hot và lệch tải
Partition theo ad_id giữ thứ tự và gom đúng, nhưng một chiến dịch lớn có thể chiếm 30% click và dồn hết vào một subtask. Cách xử lý: gom **hai tầng**. Tầng 1 dùng khoá (ad_id, salt ngẫu nhiên 0–15) để chia tải ra 16 subtask, mỗi subtask đếm một phần; tầng 2 gộp 16 phần theo ad_id. Tổng vẫn đúng vì phép cộng có tính kết hợp.

### Tách số hiển thị và số tính tiền
| | Đường streaming | Đường batch |
|---|---|---|
| Độ trễ | 1–2 phút | Vài giờ, chạy sau nửa đêm |
| Dùng cho | Dashboard, cảnh báo ngân sách | Hoá đơn, báo cáo chính thức |
| Click trễ quá ngưỡng | Có thể thiếu | Đầy đủ |
| Lọc gian lận | Luật đơn giản (tần suất theo IP/thiết bị) | Mô hình phức tạp, dữ liệu cả ngày |

Job đối soát so hai con số theo từng quảng cáo; chênh lệch trên 0,1% thì cảnh báo để điều tra (thường là lỗi watermark quá chặt hoặc sink lỗi).

### Lọc gian lận
- Cùng thiết bị/IP click một quảng cáo nhiều lần trong vài phút: chỉ tính lần đầu.
- User-agent của bot, IP trung tâm dữ liệu, tốc độ click phi lý.
- Click không có impression tương ứng (click_id không khớp lượt hiển thị nào): không hợp lệ.
Click gian lận vẫn được ghi lại (cột invalid_clicks) để giải trình với nhà quảng cáo.

### Ví dụ đời thực
Một đội ads thấy số click trên dashboard thấp hơn hoá đơn 2,3% vào các buổi tối. Điều tra: tỉ lệ sự kiện vào side output (trễ hơn allowed lateness) tăng vọt lúc 20–22 giờ, đúng giờ cao điểm mạng mobile, và phần lớn đến từ SDK Android gửi theo lô mỗi 3 phút khi app ở nền. Watermark 10 giây và allowed lateness 1 phút là quá chặt. Họ tăng allowed lateness lên 5 phút và cho SDK gửi ngay khi app trở lại foreground. Chênh lệch giảm xuống dưới 0,1%, còn state của Flink tăng khoảng 20% vì giữ cửa sổ lâu hơn.

### Trả lời mẫu khi phỏng vấn
"Tôi tách hai đường. Click đi qua redirect service, ghi sự kiện vào Kafka partition theo ad_id; Kafka là nguồn sự thật có thể replay. Đường nhanh là Flink gom cửa sổ một phút theo event time, watermark khoảng 15 giây, allowed lateness vài phút, khử trùng theo click_id rồi upsert kết quả theo khoá ad_id cộng phút vào ClickHouse cho dashboard. Nhờ checkpoint lưu cả offset lẫn state, cộng với sink idempotent, mỗi click ảnh hưởng kết quả đúng một lần dù job có crash. Đường chậm lưu dữ liệu thô vào S3, job Spark hằng ngày tính lại làm số chốt hoá đơn, rồi đối soát với số streaming; chênh quá ngưỡng thì cảnh báo. Quảng cáo hot thì tôi gom hai tầng có salting để không dồn vào một subtask. Gian lận lọc cơ bản trên stream, kỹ hơn ở batch, và vẫn lưu click không hợp lệ để giải trình. Điểm mấu chốt là dashboard được phép lệch nhẹ, nhưng tiền thì phải tính từ dữ liệu thô đầy đủ."

> Senior tip: interviewer thường đào vào "click đến trễ 10 phút thì sao" và "job crash giữa chừng có đếm trùng không". Trả lời bằng ba khái niệm cụ thể: event time + watermark + allowed lateness, checkpoint + sink idempotent, và batch tính lại làm nguồn chốt. Đừng hứa "exactly-once delivery"; hãy nói "exactly-once về kết quả".`,
  followups: [
    'Nhà quảng cáo muốn lọc thêm theo quốc gia và thiết bị: số dòng kết quả và cách lưu thay đổi thế nào?',
    'Phát hiện bug lọc gian lận đã chạy sai 3 ngày: bạn tính lại và sửa hoá đơn thế nào?',
    'Muốn dừng quảng cáo ngay khi hết ngân sách (độ trễ dưới 10 giây): thiết kế thêm gì?',
    'Không dùng Flink mà chỉ có Kafka Streams: thay đổi những gì?'
  ],
  related: ['microservices-006', 'microservices-051', 'db-052']
},
{
  id: 'sd-021',
  title: 'Cổng thanh toán cho merchant tích hợp nhiều ngân hàng và ví',
  kind: 'bank',
  level: 'senior',
  prompt: `Bạn thiết kế **cổng thanh toán** (payment gateway) cho 20.000 merchant thương mại điện tử: khách thanh toán bằng thẻ quốc tế, thẻ nội địa, QR và ví điện tử, qua 5 đối tác xử lý (ngân hàng, PSP). Cao điểm ngày sale 2.000 giao dịch/giây. Yêu cầu: **không trừ tiền hai lần**, không "khách bị trừ tiền mà đơn báo thất bại", merchant nhận kết quả tin cậy, đối soát được với đối tác mỗi ngày, tuân thủ PCI DSS. Bạn có 45 phút.`,
  phases: [
    { name: 'Requirements', minutes: 5, guide: `Chốt luồng: merchant tạo payment → khách xác thực ở trang thanh toán (3-D Secure, OTP, quét QR) → đối tác báo kết quả → gateway báo merchant. Hỏi: có refund một phần không, payment hết hạn sau bao lâu, merchant cần webhook hay polling, có lưu thẻ cho lần sau (tokenization) không. Non-functional: tính đúng tuyệt đối về tiền, idempotent, khả dụng 99,95%, kiểm toán được.` },
    { name: 'Estimation', minutes: 5, guide: `2.000 TPS cao điểm, mỗi payment khoảng 5–8 lượt ghi (tạo, chuyển trạng thái, gọi đối tác, callback, webhook). Khoảng 10 triệu payment/ngày ngày thường; bảng payment tăng vài trăm GB/năm, partition theo tháng. Webhook ra merchant: khoảng 1 webhook/payment cộng retry.` },
    { name: 'API & data model', minutes: 5, guide: `POST /payments (header Idempotency-Key; merchant_id + order_id là duy nhất) → trả payment_id và URL trang thanh toán. GET /payments/ID. POST /payments/ID/refunds. Bảng payments (id, merchant_id, order_id, amount, currency, method, psp, status, psp_ref, version, created_at); payment_events (lịch sử chuyển trạng thái, append-only); outbox cho webhook; bảng ledger double-entry cho số dư merchant và phí.` },
    { name: 'High-level design', minutes: 15, guide: `API Gateway → Payment Service (state machine, idempotency) → Routing chọn đối tác theo phương thức, tỉ lệ thành công, phí → PSP Adapter (mỗi đối tác một adapter, ký request, ánh xạ mã lỗi) → đối tác. Callback/IPN từ đối tác → Callback Service (xác thực chữ ký, idempotent). Kết quả → outbox → Webhook Dispatcher → merchant. Card data chỉ đi qua trang hosted / vault tách biệt (phạm vi PCI nhỏ). Reconciliation job đọc file quyết toán của đối tác mỗi ngày.` },
    { name: 'Deep dive', minutes: 15, guide: `Trạng thái "không rõ" khi gọi đối tác timeout (không được retry trừ tiền mù quáng; dùng API tra cứu); callback đến trùng, đến sai thứ tự, đến trước redirect; state machine chặn chuyển trạng thái ngược; đối soát và xử lý "trừ tiền nhưng đơn thất bại"; failover đối tác khi sập; bảo mật thẻ và tokenization.` }
  ],
  rubric: [
    'Idempotency khi tạo payment: Idempotency-Key và ràng buộc duy nhất (merchant_id, order_id)',
    'State machine rõ ràng, trạng thái cuối không bị ghi đè, cập nhật có điều kiện hoặc optimistic lock',
    'Xử lý timeout với đối tác bằng trạng thái UNKNOWN + tra cứu, không retry trừ tiền mù quáng',
    'Callback từ đối tác: xác thực chữ ký, idempotent, chịu được đến trùng và sai thứ tự; có polling dự phòng',
    'Webhook ra merchant qua outbox, retry có backoff, ký HMAC',
    'Đối soát hằng ngày với file quyết toán của đối tác, xử lý từng loại chênh lệch',
    'Ledger double-entry cho số dư merchant, phí, refund',
    'Phạm vi PCI DSS nhỏ: không lưu số thẻ, hosted page/vault, tokenization',
    'Routing và failover giữa các đối tác, chỉ failover cho lần thử mới chứ không cho giao dịch đang treo',
    'Giám sát tỉ lệ thành công theo đối tác, số payment kẹt ở UNKNOWN/PENDING'
  ],
  reference: `**Tóm tắt:** Trái tim của cổng thanh toán là một **state machine** lưu trong database với các chuyển trạng thái có điều kiện, cộng **idempotency ở mọi cửa vào**: merchant tạo payment (Idempotency-Key, unique merchant_id + order_id), callback từ đối tác (khử trùng theo mã giao dịch đối tác), webhook ra merchant (outbox + retry). Khi gọi đối tác bị timeout, payment chuyển sang **UNKNOWN** và được **tra cứu** chứ không bao giờ trừ tiền lại. Cuối cùng, **đối soát hằng ngày** với file quyết toán của đối tác là lưới an toàn bắt mọi chênh lệch còn sót.

### Luồng chính
~~~seq
title: Thanh toán thẻ qua cổng
actors: Merchant | Gateway | PSP | Khách
Merchant -> Gateway: POST /payments (Idempotency-Key)
Gateway --> Merchant: payment_id + URL trang thanh toán
Khách -> Gateway: mở trang, nhập thẻ (hosted page)
Gateway -> PSP: authorize/charge (ký request)
PSP -> Khách: 3-D Secure / OTP
PSP -> Gateway: callback IPN (có chữ ký)
Gateway -> Gateway: kiểm chữ ký, PENDING -> SUCCEEDED
Gateway -> Merchant: webhook payment.succeeded (HMAC)
~~~

### State machine
~~~text
CREATED --> PENDING --> SUCCEEDED --> (PARTIALLY_)REFUNDED
               |  \--> FAILED
               |  \--> EXPIRED (khách bỏ dở quá 15 phút)
               \--> UNKNOWN --(tra cứu)--> SUCCEEDED / FAILED
~~~
Mọi chuyển trạng thái là một câu UPDATE có điều kiện, ví dụ {{UPDATE payments SET status = 'SUCCEEDED', version = version + 1 WHERE id = ? AND status IN ('PENDING','UNKNOWN')}}. Nếu số dòng cập nhật là 0 thì sự kiện này đến muộn hoặc trùng: ghi log, không làm gì thêm. Trạng thái cuối (SUCCEEDED, FAILED) không bao giờ bị ghi đè; riêng trường hợp "FAILED nhưng đối tác thực ra đã trừ tiền" được xử lý bằng đối soát và refund, không quay ngược trạng thái âm thầm.

### Timeout: tình huống nguy hiểm nhất
Gateway gửi lệnh charge, chờ 30 giây không thấy phản hồi. Có ba khả năng: request chưa tới đối tác, đối tác đã trừ tiền nhưng phản hồi bị mất, hoặc đối tác đang xử lý. Retry ngay có thể **trừ tiền hai lần**; báo FAILED có thể sinh ra "khách bị trừ tiền mà đơn thất bại". Cách đúng:
1. Chuyển payment sang UNKNOWN, báo merchant là "đang xử lý".
2. Gọi **API tra cứu** của đối tác theo mã tham chiếu do gateway sinh (gửi kèm từ đầu), với backoff: 10 giây, 30 giây, 2 phút, 10 phút.
3. Vẫn không rõ sau ngưỡng: để job đối soát cuối ngày quyết định, kèm cảnh báo cho vận hành.
Nếu đối tác hỗ trợ idempotency key thì gửi lại cùng key là an toàn; nếu không, chỉ được tra cứu.

### Callback từ đối tác
- **Xác thực chữ ký** (HMAC hoặc chữ ký RSA theo tài liệu đối tác) và kiểm tra số tiền khớp với payment, tránh callback giả.
- **Idempotent**: lưu mã giao dịch của đối tác với ràng buộc unique; callback trùng trả 200 ngay.
- **Sai thứ tự**: "failed" đến sau "succeeded" thì câu UPDATE có điều kiện tự bỏ qua.
- **Có thể không bao giờ đến**: job quét payment PENDING quá 5 phút để chủ động tra cứu.
- Trả 200 nhanh, xử lý nặng làm sau, để đối tác không retry vì timeout.

### Webhook ra merchant
Cập nhật trạng thái và ghi bản ghi vào bảng **outbox** trong cùng một transaction. Webhook Dispatcher đọc outbox, gửi POST có chữ ký HMAC và timestamp; merchant trả lỗi thì retry theo exponential backoff trong khoảng 24–72 giờ. Merchant phải xử lý idempotent theo event_id, và luôn có GET /payments/ID để tự kiểm tra.

### Đối soát hằng ngày
Đối tác gửi file quyết toán (giao dịch đã thành công, phí, số tiền chuyển về). Job so từng dòng với bảng payments:
| Chênh lệch | Nguyên nhân thường gặp | Xử lý |
|---|---|---|
| Đối tác: thành công, mình: FAILED/UNKNOWN | Mất callback, timeout | Refund tự động hoặc chuyển SUCCEEDED và báo merchant tuỳ chính sách |
| Mình: SUCCEEDED, đối tác: không có | Callback giả hoặc lỗi đối tác | Treo, điều tra, chặn quyết toán cho merchant |
| Lệch số tiền/phí | Sai cấu hình phí, tỉ giá | Bút toán điều chỉnh trong ledger |

### Tiền của merchant: ledger
Mỗi payment thành công tạo bút toán kép: ghi nợ tài khoản phải thu từ đối tác, ghi có số dư merchant (sau khi trừ phí) và doanh thu phí. Refund là bút toán ngược. Số dư merchant luôn tính từ ledger, không phải một cột số dư cập nhật tay.

### Bảo mật thẻ
Số thẻ chỉ đi vào **trang thanh toán hosted** hoặc iframe của gateway, rồi vào **vault** tách biệt trả về token; Payment Service chỉ thấy token. Như vậy phần lớn hệ thống nằm ngoài phạm vi kiểm định PCI DSS. Không bao giờ ghi số thẻ hay CVV vào log; CVV không được lưu sau khi authorize.

### Routing và failover
Routing chọn đối tác theo phương thức, tỉ lệ thành công gần nhất và phí. Đối tác sập (circuit breaker mở) thì **lần thử mới** chuyển sang đối tác khác, nhưng payment đang UNKNOWN ở đối tác cũ thì **không** được gửi sang đối tác mới, vì có thể bị trừ tiền ở cả hai nơi.

### Ví dụ đời thực
Ngày sale, một ngân hàng đối tác phản hồi chậm, p99 lên 45 giây trong khi timeout của gateway là 30 giây. Bản cũ coi timeout là FAILED và khách bấm thanh toán lại: 1.200 khách bị trừ tiền hai lần, call center quá tải. Điều tra bằng đối soát: file quyết toán có 1.200 giao dịch thành công mà hệ thống ghi FAILED. Sửa: thêm trạng thái UNKNOWN với tra cứu theo backoff, trang kết quả hiển thị "đang xử lý" thay vì "thất bại", và refund tự động cho các giao dịch lệch. Sale tháng sau, số ca trừ tiền hai lần về 0, số payment kẹt UNKNOWN sau 10 phút dưới 0,05%.

### Trả lời mẫu khi phỏng vấn
"Tôi xây quanh ba thứ: state machine, idempotency và đối soát. Merchant tạo payment với Idempotency-Key, database có unique trên merchant_id và order_id nên gọi lặp chỉ trả lại payment cũ. Mọi chuyển trạng thái là UPDATE có điều kiện trên trạng thái hiện tại, nên callback trùng hay sai thứ tự đều vô hại, và trạng thái cuối không bị ghi đè. Tình huống tôi chú ý nhất là timeout khi gọi đối tác: tôi không retry trừ tiền và cũng không báo thất bại, mà chuyển sang UNKNOWN rồi tra cứu theo backoff. Callback từ đối tác được kiểm chữ ký và số tiền, còn kết quả gửi merchant đi qua outbox với retry và chữ ký HMAC. Mỗi ngày job đối soát so file quyết toán của đối tác với hệ thống để bắt những ca trừ tiền mà mình ghi thất bại và refund tự động. Số thẻ chỉ đi qua trang hosted và vault, phần còn lại chỉ thấy token để giữ phạm vi PCI nhỏ."

> Senior tip: câu hỏi phân loại ứng viên là "gọi ngân hàng timeout thì làm gì". Người chưa làm thanh toán sẽ nói "retry 3 lần"; người đã làm sẽ nói "trạng thái không rõ, tra cứu, đối soát, không bao giờ retry trừ tiền mù quáng". Thêm một con số thật như "bao nhiêu payment kẹt UNKNOWN quá 10 phút" là metric vận hành bạn theo dõi hằng ngày.`,
  followups: [
    'Merchant gọi refund hai lần liên tiếp do retry: bạn chặn refund vượt số tiền đã thu thế nào?',
    'Thêm thanh toán định kỳ (subscription) với thẻ đã lưu: cần thay đổi gì về token và xác thực?',
    'Một đối tác chỉ có API tra cứu theo ngày, không theo từng giao dịch: xử lý UNKNOWN thế nào?',
    'Bạn chia database thế nào khi lên 20.000 TPS?'
  ],
  related: ['banking-004', 'api-022', 'api-035', 'microservices-022']
},
{
  id: 'sd-022',
  title: 'Lưu trữ và đồng bộ file nhiều thiết bị kiểu Google Drive',
  kind: 'bigtech',
  level: 'lead',
  prompt: `Thiết kế dịch vụ lưu trữ file cho **50 triệu người dùng** (10 triệu hoạt động mỗi ngày): upload/download file tới 10 GB, **tự đồng bộ** giữa laptop, điện thoại và web, giữ **lịch sử phiên bản** 30 ngày, chia sẻ file/thư mục. Mạng của người dùng có thể chập chờn; upload dở phải tiếp tục được. Hai thiết bị sửa cùng file khi offline phải xử lý xung đột hợp lý. Bạn có 60 phút.`,
  phases: [
    { name: 'Requirements', minutes: 5, guide: `Chốt: kích thước file tối đa, số thiết bị mỗi người, độ trễ đồng bộ chấp nhận được (vài giây khi online), phiên bản giữ bao lâu, chia sẻ quyền đọc/sửa, có sửa đồng thời kiểu Google Docs không (thường là không, đó là bài toán khác). Non-functional: không mất dữ liệu (độ bền 11 số 9 của object storage), upload tiếp tục được, tiết kiệm băng thông.` },
    { name: 'Estimation', minutes: 5, guide: `50 triệu người × trung bình 2 GB đã dùng = khoảng 100 PB trước khi khử trùng. 10 triệu DAU × 2 file thay đổi/ngày × 1 MB trung bình = 20 TB/ngày dữ liệu mới, khoảng 230 file/giây trung bình, cao điểm gấp 5. Metadata: vài tỉ file × khoảng 1 KB = vài TB, cần shard.` },
    { name: 'API & data model', minutes: 5, guide: `Chia file thành chunk 4 MB, định danh bằng SHA-256. API: POST /files/ID/upload-session (gửi danh sách hash chunk, nhận lại chunk còn thiếu + presigned URL); PUT chunk thẳng lên object storage; POST /files/ID/commit (manifest + base_version). GET /changes?cursor=... trả thay đổi từ cursor. Metadata: files (file_id, namespace_id, path, latest_version), file_versions (file_id, version, chunk_hashes[], size, created_by), journal (namespace_id, seq, file_id, op).` },
    { name: 'High-level design', minutes: 20, guide: `Client đồng bộ (theo dõi thư mục, chia chunk, tính hash) → API/Metadata Service (sharded theo namespace = user hoặc shared folder) → Object storage (S3) lưu chunk theo hash. Notification Service (WebSocket/long-poll) chỉ báo "có thay đổi"; client gọi /changes lấy delta theo cursor. Thumbnail/preview/virus scan chạy bất đồng bộ qua queue.` },
    { name: 'Deep dive', minutes: 25, guide: `Upload tiếp tục và delta sync theo chunk; commit hai pha (chunk trước, manifest sau); journal theo namespace và cursor; xung đột khi base_version lệch (tạo bản "conflicted copy"); dọn chunk không còn ai dùng; khử trùng và vấn đề riêng tư; chia sẻ thư mục cho nhiều người; bảo mật và mã hoá.` }
  ],
  rubric: [
    'Chia file thành chunk có hash nội dung, chỉ upload chunk còn thiếu (delta sync, khử trùng)',
    'Upload thẳng lên object storage qua presigned URL, upload dở tiếp tục được ở mức chunk',
    'Commit manifest sau khi đủ chunk, không để phiên bản tham chiếu chunk chưa tồn tại',
    'Journal thay đổi theo namespace với cursor tăng dần để client lấy delta',
    'Notification chỉ báo hiệu, dữ liệu lấy qua API changes (tránh mất sự kiện)',
    'Phát hiện xung đột bằng base_version và tạo bản conflicted copy, không ghi đè im lặng',
    'Metadata shard theo namespace, phân tích được truy vấn nóng',
    'Dọn chunk rác an toàn (mark-and-sweep có thời gian ân hạn), không xoá chunk đang dùng',
    'Ước lượng dung lượng, băng thông, số file mỗi giây',
    'Bảo mật: mã hoá, quyền chia sẻ, link chia sẻ có hạn'
  ],
  reference: `**Tóm tắt:** Tách **dữ liệu** và **metadata**. File được chia thành **chunk 4 MB định danh bằng SHA-256**; client chỉ upload chunk mà server chưa có, thẳng lên **object storage** qua presigned URL, rồi **commit một manifest** (danh sách hash) kèm base_version vào **Metadata Service**. Mỗi thay đổi được ghi vào **journal** của namespace với số thứ tự tăng dần; thiết bị khác được báo "có thay đổi" qua kết nối notification rồi tự lấy delta từ cursor của mình. Commit với base_version cũ nghĩa là có xung đột: server từ chối, client lưu thành bản "conflicted copy".

### Vì sao chia chunk theo hash
- **Upload tiếp tục**: mất mạng ở chunk 180/250 thì lần sau chỉ gửi 70 chunk còn lại.
- **Delta sync**: sửa vài trang trong file PDF 200 MB chỉ đổi vài chunk; với chunk kích thước cố định, chèn dữ liệu ở đầu file sẽ làm lệch mọi chunk sau đó, nên hệ thống tối ưu hơn dùng content-defined chunking (cắt theo rolling hash) để chỉ chunk quanh chỗ sửa bị đổi.
- **Khử trùng**: cùng nội dung thì cùng hash, lưu một lần.
- **Toàn vẹn**: server kiểm hash khi nhận, chunk hỏng bị phát hiện ngay.

### Luồng upload
~~~seq
title: Upload một phiên bản mới
actors: Client | Metadata | S3
Client -> Client: chia chunk 4 MB, tính SHA-256
Client -> Metadata: upload-session (danh sách hash, base_version)
Metadata --> Client: các hash còn thiếu + presigned URL
Client -> S3: PUT từng chunk còn thiếu (song song)
Client -> Metadata: commit manifest + base_version
Metadata -> Metadata: kiểm chunk tồn tại, so base_version
Metadata --> Client: version mới, seq trong journal
~~~
Commit kiểm tra mọi chunk đã có trong object storage trước khi ghi phiên bản: không bao giờ có phiên bản trỏ tới chunk chưa tồn tại. Ghi file_versions, cập nhật latest_version và thêm dòng journal trong **cùng một transaction** của shard metadata.

### Đồng bộ giữa các thiết bị
Mỗi namespace (thư mục của một người, hoặc một thư mục chia sẻ) có một **journal** với seq tăng dần. Mỗi thiết bị nhớ cursor = seq cuối cùng đã áp dụng.
1. Notification Service giữ kết nối WebSocket/long-poll với thiết bị, chỉ gửi tín hiệu "namespace X có thay đổi".
2. Thiết bị gọi /changes?cursor=1052 và nhận các thay đổi từ seq 1053 trở đi, tải chunk còn thiếu và dựng lại file.
Vì dữ liệu thật luôn lấy qua /changes, tín hiệu bị mất (thiết bị offline, server notification khởi động lại) cũng không làm sai: lần kết nối sau, thiết bị hỏi theo cursor và nhận đủ.

### Xung đột
Laptop và điện thoại cùng sửa notes.docx từ phiên bản 7 khi offline. Laptop commit trước, thành phiên bản 8. Điện thoại commit với base_version = 7, server thấy latest là 8 nên từ chối. Client lưu bản của mình thành "notes (bản xung đột của điện thoại).docx" và tải bản 8 về. Không hệ thống lưu file nào tự trộn nội dung file nhị phân; cái quan trọng là **không mất dữ liệu và không ghi đè im lặng**.

### Metadata ở quy mô lớn
- Shard theo namespace_id: mọi thao tác của một thư mục nằm trên một shard, transaction commit + journal là transaction cục bộ.
- Thư mục chia sẻ cho 10.000 người là namespace riêng; mỗi người "mount" nó vào cây thư mục của mình, nên một lần sửa chỉ ghi journal một lần, không ghi 10.000 lần.
- Truy vấn nóng (liệt kê thư mục, lấy delta theo cursor) có index theo (namespace_id, seq) và (namespace_id, parent_id).

### Lưu chunk và dọn rác
Chunk lưu trên S3 theo khoá là hash, có thể gom nhiều chunk nhỏ vào một object lớn để giảm số request. Phiên bản cũ hơn 30 ngày bị xoá, kéo theo chunk không còn phiên bản nào tham chiếu. Đếm tham chiếu chính xác giữa hàng tỉ chunk rất dễ sai lệch khi có lỗi giữa chừng, nên thường dùng **mark-and-sweep**: định kỳ quét metadata đánh dấu chunk còn dùng, chunk không được đánh dấu và đã cũ hơn thời gian ân hạn (ví dụ 7 ngày, để không xoá chunk của upload đang dở) mới bị xoá.

### Bảo mật
- Mã hoá khi lưu (SSE-KMS hoặc khoá riêng theo người dùng) và TLS khi truyền.
- Presigned URL hết hạn sau vài phút, chỉ cho đúng chunk đó.
- Khử trùng **chéo người dùng** có rủi ro rò rỉ thông tin: người ngoài thử upload một file và thấy "upload xong ngay" là biết file đó đã có trên hệ thống. Nhiều hệ thống chỉ khử trùng trong phạm vi một người dùng hoặc không tiết lộ việc chunk đã tồn tại.

### Ví dụ đời thực
Một đội làm sync cho tài liệu doanh nghiệp thấy upload file thiết kế 2 GB qua 4G thất bại 35%: cả file là một request, mất mạng giữa chừng là upload lại từ đầu. Chuyển sang chunk 8 MB, mỗi chunk retry riêng, phiên upload lưu danh sách chunk đã nhận 24 giờ: tỉ lệ thất bại về dưới 1%. Sau khi thêm content-defined chunking, băng thông trung bình khi lưu lại file Office giảm khoảng 70%, vì thường chỉ vài chunk thay đổi.

### Trả lời mẫu khi phỏng vấn
"Tôi tách dữ liệu và metadata. Client chia file thành chunk khoảng 4 MB, tính SHA-256, gửi danh sách hash lên Metadata Service; server trả về chunk nào còn thiếu kèm presigned URL, client upload thẳng lên S3, song song và có retry từng chunk, nên upload dở có thể tiếp tục và sửa nhỏ chỉ gửi vài chunk. Khi đủ chunk, client commit manifest kèm base_version; server kiểm chunk đã tồn tại rồi ghi phiên bản mới và một dòng journal trong cùng transaction. Mỗi thư mục là một namespace có journal seq tăng dần; thiết bị giữ cursor, được Notification Service báo có thay đổi rồi tự gọi API changes để lấy delta, nên mất tín hiệu cũng không sai. Nếu base_version lệch, server từ chối và client lưu bản xung đột, không ghi đè im lặng. Metadata shard theo namespace; chunk rác dọn bằng mark-and-sweep có thời gian ân hạn."

> Senior tip: điểm lead mà interviewer tìm là bạn tách "tín hiệu" khỏi "dữ liệu" (notification chỉ báo, journal + cursor mới là nguồn sự thật) và bạn nói thẳng về xung đột: không giả vờ tự trộn được file nhị phân. Nhắc S3 multipart upload (mỗi phần tối thiểu 5 MB trừ phần cuối, tối đa 10.000 phần) cho thấy bạn đã đụng tới thực tế triển khai.`,
  followups: [
    'Một thư mục chia sẻ có 50.000 thành viên và thay đổi liên tục: notification và journal chịu tải thế nào?',
    'Người dùng xoá nhầm cả thư mục 20 GB: khôi phục thế nào, và journal ghi gì?',
    'Bạn thêm tìm kiếm toàn văn trong file PDF/Office thế nào mà không làm chậm upload?',
    'So sánh chunk kích thước cố định với content-defined chunking: khi nào đáng làm phức tạp?'
  ],
  related: ['aws-007', 'scenario-011', 'api-023']
},
{
  id: 'sd-023',
  title: 'Chatbot hỏi đáp tài liệu nội bộ có phân quyền cho 5.000 nhân viên',
  kind: 'bigtech',
  level: 'lead',
  prompt: `Công ty có **5.000 nhân viên**, tài liệu nằm rải rác trên Confluence, SharePoint và Google Drive (khoảng **40.000 trang**, mỗi trang 1.500 token). Bạn thiết kế chatbot hỏi đáp bằng tiếng Việt cho nội bộ (chính sách nhân sự, quy trình, tài liệu sản phẩm). Câu hỏi phải **chỉ dựa vào tài liệu người hỏi được đọc**, có **trích nguồn** (tên tài liệu, đoạn, ngày cập nhật). Tài liệu đổi mỗi ngày (500 trang/ngày) và quyền đổi thường xuyên (nhân viên chuyển phòng, dự án). Ước tính **1.500 người dùng/ngày**, mỗi người 8 câu, **80% câu hỏi trùng câu người khác đã hỏi** (chỉ khác cách diễn đạt). Một câu trả lời sai về chính sách có thể gây tranh chấp, nên cần đo chất lượng. Ngân sách token hàng tháng tối đa **5.000 USD**. Bạn có 45 phút.`,
  phases: [
    { name: 'Requirements', minutes: 5, guide: `Chốt functional: hỏi đáp có trích nguồn, "không biết thì nói không biết", tiếng Việt có dấu và không dấu, lịch sử hội thoại, phản hồi thích/không thích. Chốt **quyền là yêu cầu cứng**: user chỉ thấy đoạn thuộc tài liệu user được đọc; quyền kế thừa từ nguồn (nhóm, phòng, dự án) và **phải đổi theo nguồn**. Non-functional: p95 dưới 6 giây, chi phí dưới 5.000 USD/tháng, chất lượng đo được (recall, faithfulness), audit mọi câu hỏi kèm nguồn. Hỏi rõ: có cần trả lời về dữ liệu cá nhân (lương, hợp đồng) không — thường tách luồng riêng và không qua LLM; tài liệu có được phép gửi ra nhà cung cấp LLM ngoài không (nếu không thì phải dùng model self-host hoặc dịch vụ trong VPC). Out-of-scope: dịch tài liệu, tóm tắt cả thư mục, agent có tool ghi.`,
    },
    { name: 'Estimation', minutes: 5, guide: `Tải: 1.500 người x 8 câu = 12.000 câu/ngày, trung bình 0,14 câu/giây; giờ cao điểm có thể gấp 4–8 lần, giả sử peak 1,2 câu/giây. Giả sử prompt trung bình 4.900 token và 12.000 câu đều gọi model: 58,8 triệu token/ngày, khoảng 1,76 tỷ token/30 ngày; chi phí phải tính theo bảng giá model/provider thực tế và tách input, output, cached input, không đoán một giá cố định. Embedding lúc ingest: 40.000 trang x 1.500 token = 60 triệu token một lần; chunk 600–800 token tạo khoảng 75.000–100.000 chunk. Với vector 1.536 chiều dạng float32, phần vector thô khoảng 0,46–0,61 GB; HNSW, metadata, index và replica làm dung lượng lớn hơn, phải benchmark. Mỗi ngày 500 trang đổi tương đương khoảng 1,25% tập trang; quyền đổi cần cập nhật riêng, không cần re-embed. Kết luận: ngân sách inference và độ mới ACL quan trọng hơn vector thô.`,
    },
    { name: 'API & data model', minutes: 5, guide: `POST /v1/chat {conversation_id?, question} -> 202 {answer_id} rồi GET /v1/answers/{id} (hoặc SSE khi xong) kèm answer, citations[{doc_id, chunk_id, section, updated_at, url}], confidence. POST /v1/feedback {answer_id, verdict, comment}. POST /v1/admin/ingest (internal, có auth service-to-service). Bảng: documents(id, source, external_id, title, url, owner, acl_group_ids[], updated_at, version, checksum, status), chunks(id, document_id, ord, content, token_count, content_hash, embedding vector(1536), acl_group_ids[], updated_at), ingest_jobs(id, source, cursor, status, stats jsonb), answers(id, conversation_id, question, answer, citations jsonb, model, tokens_in, tokens_out, cache_hit, created_at), answer_feedback(id, answer_id, verdict, comment, user_id). Unique(documents.source, documents.external_id) và unique(chunks.content_hash, chunks.document_id) để chạy lại không nhân đôi.`,
    },
    { name: 'High-level design', minutes: 15, guide: `Connector (Confluence/SharePoint/Drive) -> Normalization Service (đọc, làm sạch, cắt chunk theo heading, trích metadata + ACL, hash để bỏ qua trang không đổi) -> Embedding Worker (gọi embedding API, có hàng đợi và rate limit) -> ghi phiên bản chunk và vector vào PostgreSQL + pgvector; publish dữ liệu mới theo version sau khi transaction hoàn tất. Truy vấn: API -> Auth Service (lấy user và nhóm từ SSO/SCIM) -> Retrieval (hybrid: pgvector cosine + full-text, **lọc ACL trong truy vấn**) -> Reranker (xếp lại đoạn) -> Prompt builder -> LLM Gateway -> ánh xạ citation từ chunk thật. Hệ thống quyền nguồn là authoritative; không tin group list do client gửi. Không trả dữ liệu nếu không xác định được quyền.`,
    },
    { name: 'Deep dive', minutes: 15, guide: `Đào sâu: (1) quyền — quyền lấy từ nguồn/SSO, áp dụng tức thời theo policy: nếu sync ACL chưa hoàn tất thì fail closed hoặc kiểm tra policy trực tiếp; không dùng TTL dài như bảo đảm tức thời. (2) index — hash, upsert, tombstone, checkpoint; publish nguyên tử theo version để không có khoảng trống khi đổi tài liệu. (3) citation — chỉ nhận ID đoạn model chọn từ context, server nối metadata thật. (4) chi phí — tách input/output/cached tokens, model và phòng ban; semantic cache chỉ khi mọi nguồn trong câu trả lời vẫn được phép đọc, nếu không thì bỏ cache; prompt caching của provider chủ yếu giảm giá input prefix, không phải cache câu trả lời. (5) chất lượng — recall@k, faithfulness, câu không có nguồn phải từ chối, golden set có người review. (6) lỗi — vector search chậm, API embedding/LLM trả 429, rò ACL qua cache, prompt injection trong tài liệu; có timeout, circuit breaker và kiểm soát nguồn.`,
    },
  ],
  rubric: [
    'Nêu rõ yêu cầu quyền: chỉ dùng tài liệu người hỏi được đọc, lọc ACL ở tầng retrieval chứ không phải sau khi LLM trả lời',
    'Phân biệt câu hỏi thường và câu hỏi dữ liệu cá nhân (lương, hợp đồng): luồng thứ hai không đưa vào LLM chung',
    'Ước lượng token và chi phí LLM, chỉ ra token là nút thắt và đề xuất cách hạ chi phí',
    'Ingestion: connector theo nguồn, chunk theo heading kèm metadata, hash nội dung để bỏ qua trang không đổi',
    'Cập nhật tăng dần: upsert chunk, tombstone khi trang bị xoá, checkpoint để chạy lại an toàn; không xoá thẳng index đang phục vụ',
    'Hybrid retrieval (vector + full-text tiếng Việt) có lọc ACL, reranking lấy 3–5 đoạn; giải thích vì sao vector thuần sai với câu hỏi tiếng Việt không dấu',
    'Trích nguồn đúng chunk đã đưa vào prompt, kèm phiên bản và ngày; yêu cầu model nói "không biết" khi thiếu căn cứ',
    'Cache câu trả lời phải kiểm tra quyền trước khi trả và không dùng chung giữa các user có ACL khác nhau',
    'Prompt caching / batch / streaming / hàng đợi để đạt ngân sách 5.000 USD mỗi tháng, có đo chi phí theo phòng ban',
    'Bộ đánh giá hồi quy (recall@k, faithfulness, tỉ lệ trả lời đúng khi thiếu dữ liệu) và quy trình sửa khi chất lượng tụt'
  ],
  reference: `**Tóm tắt:** chatbot tài liệu nội bộ là bài toán **quyền, dữ liệu và chi phí**, không phải bài toán gọi LLM. Ba quyết định quan trọng nhất: (1) **ACL được lọc ở tầng retrieval**, trước khi chunk vào context — nếu lọc sau khi LLM trả lời thì dữ liệu đã lộ; (2) **ingest tăng dần theo hash nội dung** để 500 trang thay đổi mỗi ngày không kéo theo 40.000 trang; (3) **ngân sách token** được quản lý như ngân sách hạ tầng: semantic cache có kiểm quyền, prompt caching cho prefix cố định, streaming để giảm token output bị bỏ phí.

### Vì sao không nhồi cả tài liệu vào prompt
40.000 trang x 1.500 token = 60 triệu token. Dù model có context window lớn đến đâu, gửi cả kho vào mỗi câu hỏi vẫn tốn token, chậm và khó bảo đảm câu trả lời dựa đúng đoạn liên quan; thông tin giữa context cũng dễ bị "chìm" (lost in the middle). RAG (Retrieval-Augmented Generation — truy xuất đoạn liên quan rồi đưa vào mô hình) chỉ đưa 3–5 đoạn vào mỗi lần hỏi, khoảng 4.000 token, và luôn kèm nguồn để người dùng tự kiểm chứng.

### Quyền: lớp quyết định
~~~seq
title: Một câu hỏi đi qua các lớp
actors: Web | API | Auth | Retrieval | LLM
Web -> API: POST /v1/chat {question}
API -> Auth: lấy user, nhóm, dự án
Auth --> API: user_id + acl_groups[] (nguồn sự thật)
API -> Retrieval: question + acl_groups + top_k=20
Retrieval --> API: 5 chunk đã lọc theo acl_groups
API -> LLM: system + 5 chunk + câu hỏi (kèm cấm bịa)
LLM --> API: câu trả lời + trích dẫn theo index chunk
API --> Web: answer + citations + confidence
~~~
Hai điểm dễ sai ở sơ đồ trên: (1) {{acl_groups}} phải đến từ **hệ thống định danh của công ty** (SSO, SCIM), không phải từ prompt; (2) retrieval trả về chunk đã lọc, nên LLM **không nhìn thấy** tài liệu ngoài quyền.

### Lọc ACL ngay trong truy vấn
- Mỗi chunk lưu mảng {{acl_group_ids}} đã được chuẩn hoá (ví dụ {{dept:marketing}}, {{proj:atlas}}, {{all}}).
- Truy vấn vector có điều kiện: tìm chunk gần nhất trong số chunk mà {{acl_group_ids}} giao với nhóm của user khác rỗng.
- Với approximate search như HNSW, điều kiện ACL chọn lọc có thể khiến truy vấn thu được ít hơn k kết quả sau lọc; đây là giới hạn số ứng viên chứ không phải lý do để bỏ ACL. Đo recall trên tập ứng viên user thực sự được phép đọc; cân nhắc iterative scan nếu phiên bản pgvector đang dùng hỗ trợ, hoặc chiến lược partition/chỉ mục phù hợp. Không gửi chunk ngoài quyền sang reranker, LLM hay log.
- Câu hỏi về lương, hợp đồng, dữ liệu cá nhân: tách luồng riêng, không đưa vào vector store chung. Luồng này kiểm quyền ở tầng ứng dụng và không gọi LLM nếu user không có quyền xem hồ sơ đó.

### Chất lượng tiếng Việt
- Cắt chunk theo heading, 300–800 token, chồng lấn 10–20%. Bảng lương hoặc bảng giá bị cắt giữa dòng là lỗi phổ biến nhất: chunk phải giữ nguyên bảng.
- **Hybrid search**: pgvector cosine tìm theo nghĩa + PostgreSQL full-text search/tsvector tìm theo từ khoá; chọn tokenizer/dictionary phù hợp tiếng Việt hoặc analyzer tiếng Việt trong hệ tìm kiếm riêng, vì cấu hình mặc định không tự động xử lý đầy đủ mọi biến thể tiếng Việt. Vector thuần dễ hụt mã sản phẩm, số điều khoản và tên riêng.
- Chuẩn hoá: bỏ dấu khi so khớp từ khoá (tiếng Việt không dấu), nhưng vẫn giữ dấu để hiển thị.
- Reranker (cross-encoder nhỏ) chấm lại 20 ứng viên, lấy 5 đoạn tốt nhất. Reranker rẻ hơn nhiều so với gọi LLM lớn.

### Ngân sách token: tính trước khi tối ưu
Giả định mỗi câu trả lời: system 800 token, 5 đoạn x 700 token = 3.500, câu hỏi 100, output 500. Tổng khoảng 4.900 token, trong đó 85% là input.
- Nếu 12.000 câu/ngày đều gọi LLM: khoảng 59 triệu token input + 6 triệu token output mỗi ngày, tức khoảng 1,8 tỷ token/tháng.
- **Prompt caching** (một số provider tái sử dụng prefix giống hệt nhau theo cơ chế riêng): system prompt 800 token + hướng dẫn trích dẫn 400 token = tối đa 1.200 token prefix cố định. Nếu 70% request dùng lại được prefix, phần tiết kiệm phụ thuộc chênh lệch giá input thường và cached input, đồng thời tính phí tạo/lưu cache nếu provider áp dụng; không đồng nghĩa giảm 70% toàn bộ bill.
- **Semantic cache** (tìm câu hỏi tương tự để tái sử dụng kết quả) không đồng nghĩa 80% hit: cách diễn đạt giống nhau chưa đảm bảo cùng câu trả lời, cùng phiên bản tài liệu hay cùng quyền. Bản an toàn ban đầu chỉ cache câu hỏi công khai hoặc dùng khóa chứa tenant, model, phiên bản nguồn và tập entitlement; trước khi trả phải kiểm tra lại quyền trên mọi citation. Nếu không chứng minh được quyền tương đương thì bỏ cache, chạy retrieval mới.
- **Streaming** (trả chữ theo từng đoạn qua SSE): không giảm token, nhưng giảm thời gian chờ cảm nhận và cho phép huỷ giữa chừng để không trả tiền phần output không ai đọc.
- Với khoảng 1,8 tỷ token/tháng, trần 5.000 USD tương đương bình quân tối đa khoảng **2,78 USD cho mỗi triệu token tổng hợp**. Đây chỉ là ngưỡng sơ bộ: phải biết tỷ lệ input/output/cached tokens và bảng giá từng model. Nếu giá bình quân dự kiến vượt ngưỡng, giảm context/output, route tác vụ đơn giản sang model rẻ đã đánh giá, đặt quota và cảnh báo ngân sách; không giả định cache sẽ tự đạt mục tiêu.
- **Hàng đợi + rate limit theo token** cho các job không gấp (tóm tắt tài liệu dài, sinh câu hỏi ôn tập).
- Theo dõi chi phí theo phòng ban (attributing): gắn {{department}} vào mọi request và dashboard theo tuần.

### Cập nhật index
Mỗi ngày 500 trang thay đổi, 50 trang bị xoá.
1. Connector đọc theo con trỏ thời gian (incremental sync), chỉ lấy trang có {{updated_at}} mới hơn lần trước; đồng bộ riêng thay đổi ACL từ nguồn định danh.
2. Băm nội dung sau khi chuẩn hoá; nếu hash không đổi thì bỏ qua (không tốn embedding).
3. Chunk mới được {{INSERT ... ON CONFLICT}} theo khóa (document_id, version, ordinal); chunk của trang đã đổi được đánh dấu stale và được thay thế sau khi phiên bản mới sẵn sàng.
4. Trang bị xoá: ghi tombstone (bản ghi {{status=deleted}}) rồi xoá chunk ở job dọn; **không** xoá thẳng trong lúc đang phục vụ vì retrieval có thể đang đọc.
5. Mọi bước có checkpoint để chạy lại an toàn; chạy nền, không chặn truy vấn. Khi đổi nội dung, cập nhật version hiện hành và vô hiệu hóa cache citation cũ; khi chỉ đổi ACL, cập nhật policy/metadata mà không gọi lại embedding.

### Trích nguồn
Prompt yêu cầu model trả lời kèm số thứ tự đoạn đã dùng (ví dụ {{[2]}}). Server **ghép lại** phần trích dẫn từ danh sách chunk thật, không tin vào chuỗi model sinh ra: nếu model trả về số không tồn tại thì bỏ trích dẫn đó và ghi log để đánh giá. Mỗi citation gồm tên tài liệu, đường dẫn, phiên bản và ngày cập nhật — người dùng bấm vào là thấy đúng đoạn.

### Đo chất lượng
- **recall@k**: trong 200 câu hỏi golden có đáp án đúng đã biết, top-k có chứa đoạn chứa đáp án không.
- **faithfulness**: câu trả lời có mâu thuẫn với đoạn được trích không (LLM-as-judge, có người kiểm mẫu).
- **tỉ lệ trả lời đúng khi thiếu dữ liệu**: câu hỏi không có trong tài liệu, hệ thống phải nói "không tìm thấy" — nếu trả lời bịa là lỗi nghiêm trọng.
- Chạy eval mỗi khi đổi prompt, đổi model hoặc đổi chunking; so sánh trước/sau trên cùng bộ golden.

### Ví dụ đời thực
Một công ty 4.000 nhân viên dùng RAG nội bộ. **Triệu chứng:** nhân viên Marketing nhận câu trả lời trích tài liệu "Pháp chế — nội bộ", đồng thời chi phí token tháng thứ hai gấp 3,4 lần dự toán. **Điều tra:** retrieval đã đưa chunk nhóm legal vào context trước khi bộ lọc chạy; cache chỉ khóa theo câu hỏi và model; lượng gọi thật là 12.000 câu/ngày x khoảng 4.900 token/câu. **Cách xử lý:** từ chối chunk thiếu ACL, đưa điều kiện quyền vào retrieval và kiểm tra lại citation tại điểm trả; bỏ cache khi không chứng minh được quyền; giới hạn context, thêm model nhỏ cho câu hỏi đơn giản và theo dõi chi phí theo phòng ban. **Kết quả sau 90 ngày:** không có sự cố truy cập chéo đã xác nhận, p95 giảm từ 7,8 xuống 4,6 giây và bộ golden cho thấy tỉ lệ từ chối đúng khi thiếu nguồn tăng từ 71% lên 94%. Mức giảm chi phí 62% chỉ đạt sau đo trên workload thực; không coi đó là bảo đảm trước khi benchmark.

### Trả lời mẫu khi phỏng vấn
"Tôi chia hệ thống thành ba luồng. Ingestion: connector đồng bộ Confluence, SharePoint và Drive theo cursor; lưu ACL/version từ nguồn, cắt theo heading thành chunk 300–800 token, băm nội dung để bỏ qua trang không đổi, rồi upsert version mới và tombstone khi xóa. Thay đổi ACL không cần tạo lại embedding. Query: lấy quyền từ hệ thống định danh, không tin client; tìm hybrid bằng pgvector và full-text phù hợp tiếng Việt, lọc ACL ngay trong query, rerank các ứng viên được phép rồi chỉ gửi năm đoạn tốt nhất cho model. Trước khi trả, kiểm tra lại quyền và ghép citation từ document/chunk/version thật; khi nguồn thiếu thì nói không tìm thấy. Về tải, 12.000 câu/ngày nhân 4.900 token là khoảng 1,8 tỷ token/tháng; 5.000 USD đặt ngưỡng blended gần 2,78 USD mỗi triệu token, cần tính lại theo tỷ lệ input/output và model. Tôi không coi 80% câu hỏi tương tự là cache hit: response cache cần cùng quyền, nguồn còn mới và key cô lập; prompt caching chỉ bật khi provider hỗ trợ. Golden set đo recall@k, faithfulness và từ chối đúng."

> Senior tip: trong RAG nội bộ, lỗi tốn kém nhất không phải model yếu mà là **lọc quyền sai tầng** và **cache không cô lập theo quyền**. Hãy viết test bảo mật như test nghiệp vụ: một user cố ý hỏi tài liệu của phòng khác và assert bị chặn. Và luôn đo chi phí trên mỗi câu trả lời — con số đó là thứ sếp hỏi trước khi hỏi về chất lượng.`,
  followups: [
    'Nhân viên chuyển từ phòng Marketing sang Pháp chế: chunk cũ phải mất hiệu lực ngay, bạn làm thế nào mà không phải reindex toàn bộ?',
    'Một tài liệu chứa bảng lương 12 cột bị cắt giữa dòng: bạn sửa chunking và đo lại chất lượng ra sao?',
    'Người dùng hỏi câu không có trong tài liệu: hệ thống phải trả lời thế nào để không bịa, và đo tỉ lệ này bằng gì?',
    'Bạn đổi embedding model sang bản mới: lập kế hoạch backfill, dual-read và rollback thế nào mà không downtime?',
    'Nhà cung cấp LLM tăng giá 40%: bạn giữ nguyên chất lượng mà giảm chi phí bằng những đòn bẩy nào, theo thứ tự nào?'
  ],
  related: ['ai-009', 'ai-019', 'ai-039', 'ai-040']
},
{
  id: 'sd-024',
  title: 'LLM gateway dùng chung cho nhiều team',
  kind: 'bigtech',
  level: 'lead',
  prompt: `Một công ty có **20 team** và khoảng **5.000 kỹ sư, nhân viên** đang gọi trực tiếp nhiều nhà cung cấp LLM bằng API key riêng. Có lúc một team thử nghiệm gây hết hạn mức của các team khác; hóa đơn cuối tháng không biết request nào thuộc sản phẩm nào; prompt có thể chứa email, số điện thoại và dữ liệu khách hàng. Hãy thiết kế **LLM gateway dùng chung**: định tuyến model theo tác vụ/chính sách, giới hạn tốc độ và ngân sách theo team, giảm chi phí bằng prompt caching, thống kê chi phí, che dữ liệu nhạy cảm, fallback khi provider lỗi. Giả định ban đầu 10 request/giây trung bình, peak 50 request/giây, trung bình 2.000 token tổng mỗi request. Bạn có 45 phút.`,
  phases: [
    { name: 'Requirements', minutes: 5, guide: `Chốt gateway nhận yêu cầu đồng bộ hay streaming, có giữ tương thích một phần với API hiện tại không, model nào được phép dùng với loại dữ liệu nào, và latency p95. Danh tính team phải lấy từ token/identity đã xác thực chứ không tin header client tự đặt. Làm rõ hạn mức theo phút/ngày/tháng, burst, concurrency, soft warning hay hard stop; cách tính tiền và thời gian lưu log. Dữ liệu nhạy cảm: chính sách redact, nhà cung cấp nào được phép nhận prompt, có tác vụ phải dùng model nội bộ không. Chốt không bảo đảm ngữ nghĩa các model giống nhau; fallback phải tôn trọng policy, không gửi dữ liệu sang provider chưa được duyệt.` },
{ name: 'Estimation', minutes: 5, guide: `Giả định 10 RPS trung bình, peak 50 RPS: 864.000 request/ngày nếu chạy liên tục ở mức trung bình. Với 2.000 token/request, khoảng 1,728 tỷ token/ngày (input + output); đây là phép nhân công suất, không phải dự toán chi phí. Chi phí = số token input/output/cached input theo model x bảng giá hiệu lực; lưu cả model, provider và price_version để giải thích hoá đơn. Peak 50 RPS cần quota token/concurrency riêng, không chỉ giới hạn request. Nếu metadata usage mỗi request 1 KB: khoảng 0,86 GB/ngày trước index/replica; raw prompt không lưu mặc định để tránh phình log và rủi ro riêng tư. Redis giữ bucket quota ngắn hạn; ledger usage bền vững cần queue/DB và reconciliation.` },
        { name: 'API & data model', minutes: 5, guide: `API nội bộ POST /v1/responses nhận request_id, messages, task, model_policy, stream; team lấy từ service identity đã verify. Trả response chuẩn hoá hoặc SSE; usage gồm input_tokens, output_tokens, cached_input_tokens, provider/model, request_id. Bảng team_policy(team_id, rpm, tpm, daily_budget, allowed_models, data_class, version); provider_model(provider, model, capabilities, status); price_catalog(provider, model, effective_from, input_price, output_price, cached_input_price, version); request_usage(request_id unique, team_id, model, token counts, status, estimated_cost, final_cost, price_version, timestamps); outbox/usage_event để publish không mất. Không lưu API key ở bảng policy; lấy secret từ secret manager.` },
        { name: 'High-level design', minutes: 15, guide: `Client -> AuthN/AuthZ -> Gateway: xác thực danh tính workload, map team và policy. Redaction/validation -> Router chọn model được phép theo task/cost/capability/health -> Redis quota (atomic token bucket RPM/TPM + concurrency) -> provider adapter -> chuẩn hoá response/stream. Trước khi gửi, ước tính token và reserve quota; sau response reconcile bằng usage provider trả về, điều chỉnh reservation. Usage event ghi qua outbox/Kafka tới billing store và dashboard. Provider key nằm trong secret manager; egress qua mạng được kiểm soát. Fallback chỉ thử model/provider khác đã policy cho phép, cùng data class; cache câu trả lời tách khỏi prompt caching.` },
        { name: 'Deep dive', minutes: 15, guide: `Đào sâu: token bucket Redis atomic Lua và xử lý Redis mất kết nối (không âm thầm bỏ quota; chọn fail closed hoặc local conservative limit); request đồng thời và reservation/refund; provider timeout có thể đã xử lý và tính tiền nên retry có giới hạn, tránh fan-out; streaming đã gửi token thì không thể đổi provider an toàn. Prompt caching chỉ tái sử dụng prefix theo tính năng/provider, không phải câu trả lời miễn phí; không cache nội dung cross-team. Đo giá theo price version và đối soát với hóa đơn provider. Redaction có false negative nên không ghi raw prompt mặc định, mã hoá và hạn retention; route theo data policy. Theo dõi 429, latency, error, token, cache hit, fallback, budget burn; circuit breaker chỉ mở theo provider/model, không che lỗi policy.` }
      ],
      rubric: [
        'Xác thực workload và gán team từ danh tính tin cậy, không nhận team_id không kiểm chứng từ client',
        'Định nghĩa chính sách dữ liệu và model được phép; fallback cũng phải cùng policy',
        'Ước lượng 10 RPS trung bình, peak 50 RPS và 2.000 token/request thành token/day, phân biệt đây là tải chứ chưa phải tiền',
        'Giới hạn RPM, TPM, concurrency và ngân sách theo team bằng reservation/reconciliation',
        'Token bucket cập nhật nguyên tử trên Redis; xử lý rõ khi Redis lỗi và khi nhiều request đồng thời',
        'Phân biệt prompt caching của provider với cache câu trả lời; cô lập cache và vô hiệu hóa cache nhạy cảm',
        'Router dựa trên tác vụ, khả năng model, giá, latency, sức khoẻ và policy, có adapter chuẩn hoá khác biệt provider',
        'Fallback/retry có giới hạn, chỉ với lỗi phù hợp; timeout có thể đã bị tính phí và stream không thể chuyển provider sau khi phát dữ liệu',
        'Usage event bền vững, price version, tính input/output/cached token và đối soát hoá đơn',
        'Che dữ liệu nhạy cảm trước egress, hạn chế log prompt, quản lý secret, retention, metrics và alert vận hành'
      ],
      reference: `**Tóm tắt:** Tôi đặt một gateway làm **điểm thực thi policy và đo usage**, không chỉ là proxy HTTP. Gateway xác thực workload để biết team, kiểm tra dữ liệu nào được gửi tới model nào, reserve hạn mức RPM/TPM trước khi gọi provider, sau đó đối soát theo token usage thực tế. Router được phép fallback chỉ trong tập model đã duyệt; prompt caching giảm chi phí của prefix theo khả năng provider nhưng không phải cache câu trả lời. Mặc định không lưu prompt thô, còn usage phải có thể đối soát tới team, model và phiên bản bảng giá.

### Yêu cầu và giả định tải
- Functional: API đồng bộ và streaming, chọn model theo tác vụ, quota theo team, thống kê chi phí, che PII (thông tin nhận dạng cá nhân như email/điện thoại), fallback và audit.
- Non-functional: p95 latency gateway thấp, ví dụ overhead dưới 100 ms ngoài thời gian gọi model; cách ly dữ liệu giữa team; quota không bị vượt đáng kể khi nhiều request đồng thời; hoạt động dù một provider lỗi.
- Giả định bài: 20 team; 10 request/giây trung bình, peak 50; 2.000 token tổng mỗi request. Đây là số để thiết kế, cần thay bằng telemetry thật trước khi chốt năng lực.
- Danh tính team lấy từ OAuth/JWT đã verify hoặc service identity của workload. Header {{X-Team-Id}} do client gửi không phải bằng chứng, vì client có thể giả mạo để dùng quota/secret của team khác.
- Mỗi team có policy: model được phép, data classification (loại dữ liệu), RPM (request/phút), TPM (token/phút), concurrency, ngân sách ngày/tháng, timeout và retention.

### Ước lượng tải và chi phí
- 10 request/giây x 86.400 giây/ngày = **864.000 request/ngày**.
- 864.000 x 2.000 token = **1,728 tỷ token/ngày** tổng input và output. Cần đo tách hai loại vì bảng giá thường khác nhau.
- Chi phí ngày = input token x giá input/model + output token x giá output/model + phần cached input theo giá tương ứng. Nhân với bảng giá có hiệu lực; không hard-code giá vì provider và model thay đổi giá.
- Peak 50 RPS x 2.000 = 100.000 token/giây. Một giới hạn chỉ tính request không đủ: request dài 20.000 token có chi phí và thời gian khác request 200 token.
- 1 KB metadata/request x 864.000 = khoảng 0,86 GB/ngày. Đây chưa tính index, replica, retention; không ghi toàn bộ prompt và response vào analytics mặc định.
- Quota/cost gồm hai tín hiệu: token ước tính trước khi gửi để bảo vệ ngân sách, usage thực tế từ provider để tính đúng sau đó. Ước lượng tokenizer có thể khác provider nên cần reconcile và theo dõi sai số.

### API và mô hình dữ liệu
Ví dụ API nội bộ:
~~~text
POST /v1/responses
Authorization: Bearer <service-token>
{
  "request_id": "uuid",
  "task": "classification",
  "model_policy": "balanced",
  "messages": [{"role":"user","content":"..."}],
  "stream": true
}
~~~
Gateway suy ra team từ token, không dùng team do body chỉ định. Response chuẩn hoá chứa request_id, model/provider thực tế, output và usage: input_tokens, output_tokens, cached_input_tokens. Tầng adapter dịch giữa định dạng nội bộ và API riêng của provider; không giả định mọi model hỗ trợ cùng tool calling, JSON schema, context length hoặc streaming.

~~~sql
team_policy(team_id, version, rpm, tpm, concurrency, daily_budget,
           monthly_budget, allowed_models, allowed_data_class)
provider_model(provider, model, capabilities, health, enabled)
price_catalog(provider, model, effective_from, input_rate, output_rate,
              cached_input_rate, price_version)
request_usage(request_id UNIQUE, team_id, provider, model, input_tokens,
              output_tokens, cached_input_tokens, price_version,
              estimated_cost, final_cost, status, created_at)
~~~
Usage record là sổ kiểm toán; bảng tổng hợp theo ngày/team/model là dữ liệu dashboard có thể dựng lại. Lưu price_version giúp tính lại giải thích được vì sao cùng lượng token ở hai tháng có số tiền khác. Provider keys ở secret manager (dịch vụ lưu secret được mã hoá và phân quyền), không ở database policy hay log.

### Kiến trúc và luồng request
~~~seq
title: Một request qua gateway
actors: Client | Gateway | Redis | Provider | Kafka
Client -> Gateway: gửi request cùng service token
Gateway -> Gateway: xác minh team và phân loại dữ liệu
Gateway -> Redis: reserve RPM, TPM và concurrency
Redis --> Gateway: quota được cấp hoặc từ chối
Gateway -> Provider: gửi request đã redact, chọn model
Provider --> Gateway: response và usage thực tế
Gateway -> Kafka: usage event qua outbox
Gateway --> Client: response chuẩn hóa hoặc SSE
~~~
Các bước trước provider: xác thực, kiểm kích thước/định dạng, áp policy model, redaction, ước lượng token, kiểm quota. Sau response: ghi usage, settle reservation, chuẩn hoá lỗi và trả kết quả. Với request không streaming, có thể ghi trạng thái hoàn tất trước khi trả; với streaming cần ghi event kết thúc/usage khi nhận được, đồng thời xử lý trường hợp client ngắt giữa chừng.

### Quota công bằng khi có request đồng thời
**Token bucket** là bộ đếm có dung lượng tối đa, được nạp lại theo thời gian; giống bình nước rò đều, request tiêu thụ token từ bình. Dùng Redis Lua script hoặc thao tác nguyên tử tương đương để đọc-sửa-ghi RPM/TPM trong một bước. Nếu làm ba lệnh riêng, hai request cùng đọc quota còn lại rồi cả hai cùng được phép, vượt hạn mức.
1. Gateway ước tính input và output tối đa, reserve token cùng một request_id duy nhất. Cùng request_id retry nội bộ không reserve lần hai.
2. Khi provider trả usage thật, settle chênh lệch; token không dùng được hoàn vào bucket theo policy. Nếu provider timeout và không rõ đã xử lý hay chưa, ghi trạng thái uncertain, không hoàn toàn bộ một cách mù quáng.
3. Có quota theo request, token và concurrency. Concurrency giới hạn số tác vụ đang chạy, tránh một team chiếm hết socket/connection dù RPM còn thấp.
4. Redis lỗi: với dịch vụ tính phí, chọn fail closed hoặc fallback sang quota local bảo thủ có giới hạn rõ; không được âm thầm bỏ kiểm tra. Alert khi fallback quota hoạt động.

### Định tuyến và fallback
Router lọc trước theo policy dữ liệu, sau đó chọn model đủ capability cho task, rồi xếp hạng theo latency/health/giá và ưu tiên cấu hình. Ví dụ tác vụ phân loại ngắn có thể dùng model rẻ đã được đánh giá; yêu cầu code hoặc reasoning cần model đủ năng lực. Chọn model rẻ nhất mà chưa đo chất lượng có thể tăng lỗi và retry, khiến tổng chi phí cao hơn.
- Mỗi provider có adapter riêng, timeout, circuit breaker và giới hạn kết nối. Circuit breaker tạm ngừng gọi provider đang lỗi sau một ngưỡng, rồi thử lại có kiểm soát.
- Chỉ retry lỗi tạm thời như 429/5xx theo chính sách, tối đa số lần nhỏ với exponential backoff có jitter (thời gian chờ tăng dần, thêm ngẫu nhiên để tránh dồn request). Không retry lỗi xác thực, request sai hay policy từ chối.
- Timeout không chứng minh provider chưa nhận request; có thể đã xử lý và tính tiền. Chỉ gửi lại khi provider hỗ trợ idempotency cho loại request đó hoặc chấp nhận ghi nhận khả năng tính phí kép.
- Fallback phải kiểm lại model được phép, khu vực lưu trữ và data class. Không gửi prompt nhạy cảm từ provider được duyệt sang provider chưa duyệt chỉ để giữ availability.
- Với streaming, trước byte đầu tiên có thể thử provider khác; sau khi đã gửi một phần câu trả lời thì không thể đổi provider an toàn vì câu trả lời sẽ bị nối từ hai lần sinh khác nhau. Trả lỗi stream rõ ràng hoặc kết thúc theo contract.

### Ba thứ thường bị gọi nhầm là cache
| Cơ chế | Dữ liệu tái sử dụng | Lợi ích | Rủi ro/chú ý |
|---|---|---|---|
| Prompt caching của provider | Prefix prompt đã gửi nhiều lần, nếu provider/model hỗ trợ | Có thể giảm chi phí hoặc độ trễ phần input prefix | Cách bật, thời hạn và giá riêng theo provider; không tái sử dụng câu trả lời |
| Cache response của gateway | Kết quả sinh hoàn chỉnh | Tránh gọi model lại cho yêu cầu tương đương | Có thể sai/ngày cũ hoặc rò dữ liệu nếu khóa cache không cô lập |
| Cache ứng dụng | Kết quả nghiệp vụ đã xác định | Tốc độ và chi phí thấp nhất | Chỉ đúng khi nghiệp vụ có điều kiện cache rõ |

Prompt caching không thay thế privacy review; prefix chứa dữ liệu nhạy cảm cũng phải theo chính sách provider. Nếu cache response, khóa tối thiểu cần phân biệt team, model/version, prompt đã chuẩn hoá, tham số sinh, tools/schema và policy version; tắt với nội dung cá nhân hoặc thay đổi liên tục. Không dùng chung cache giữa team chỉ vì prompt giống nhau. Xác thực và quota vẫn chạy trước cache hit, nếu không người dùng có thể bypass hạn mức bằng cách hỏi câu đã có cache.

### Chi phí, logging và dữ liệu nhạy cảm
- Ước lượng chi phí trước request để cảnh báo budget; sau response tính từ usage thực và price_version. Phân biệt cached input, input thường và output. Đối soát tổng tháng với hóa đơn provider, điều tra request thiếu usage thay vì coi chúng là miễn phí.
- Ghi metadata tối thiểu: request_id, team_id, model/provider, usage, latency, status, cache/fallback, policy version. Mặc định không lưu raw prompt/response; nếu cần lấy mẫu debug phải có mục đích, quyền hạn, retention ngắn và thông báo phù hợp.
- Redaction có thể thay email/điện thoại bằng placeholder trước khi gửi, nhưng detector có false negative và false positive. Không tuyên bố đã ẩn danh hoàn toàn; dữ liệu nhạy cảm cao có thể bị chặn hoặc route tới model được phê duyệt thay vì gửi ra ngoài.
- Giữ danh sách model/provider được phép theo data class, TLS khi truyền, secret manager cho API key, phân quyền tối thiểu, audit thay đổi policy, quy trình xoay key và yêu cầu xóa theo retention.
- Prompt injection (nội dung cố khiến model bỏ qua chỉ dẫn) vẫn có thể xảy ra dù qua gateway. Gateway kiểm soát egress, tool permissions, logging và model policy; ứng dụng gọi tool vẫn phải xác minh quyền trên từng hành động.

### Failure modes và quan sát
| Tình huống | Hành vi |
|---|---|
| Team hết TPM/ngân sách | Trả 429 có quota/reset phù hợp; không âm thầm chuyển sang quota team khác |
| Redis quota không khả dụng | Fail closed hoặc local limit bảo thủ; alert và ghi rõ chế độ degraded |
| Provider trả 429/5xx | Backoff giới hạn, circuit breaker, fallback đã được duyệt nếu còn quota |
| Provider timeout sau khi gửi | Ghi uncertain; không retry vô hạn hay khẳng định chưa bị tính phí |
| Kafka/analytics gián đoạn | Outbox bền vững và retry publish; không làm mất usage |
| Redactor lỗi hoặc policy không rõ | Từ chối request nhạy cảm; không default sang gửi raw prompt |

Dashboard theo team/provider/model: request rate, input/output/cached tokens, chi phí dự kiến và cuối cùng, quota rejection, latency p50/p95/p99, 429/5xx, timeout uncertain, fallback, cache hit, redaction count và outbox lag. Alert budget burn bất thường theo tốc độ tiêu hao, provider lỗi và usage thiếu đối soát. Không gắn prompt text vào metric label vì gây lộ dữ liệu và cardinality lớn.

### Ví dụ đời thực
Giả sử 20 team cùng dùng một gateway ở 10 RPS trung bình. Ngày đầu, một thử nghiệm batch của team A tăng lên 40 RPS; các team khác nhận 429 từ provider và hóa đơn vượt dự kiến. Điều tra cho thấy gateway chỉ giới hạn request tổng, không có quota token/team; batch prompt dài 12.000 token chiếm phần lớn throughput. Khắc phục: map team từ workload identity, đặt bucket riêng theo RPM/TPM và concurrency, reserve theo token ước tính, route batch vào model đã benchmark, dashboard burn rate theo team. Một tuần sau, team A bị giới hạn riêng khi vượt quota, các team khác duy trì SLO; phần usage thực vẫn reconcile từ provider. Mục tiêu số liệu cần đo lại theo workload thật, không hứa giảm chi phí cố định trước khi có baseline.

### Trả lời mẫu khi phỏng vấn
"Tôi xem gateway là điểm thực thi policy, quota và accounting. Client được xác thực theo service identity; team suy ra từ danh tính chứ không từ header. Policy kiểm tra data class và model allowlist trước khi redaction và routing. Tôi dùng bucket RPM/TPM nguyên tử trên Redis, có reservation theo request idempotency key, rồi reconcile với usage thật từ provider; giới hạn concurrency riêng để một team không chiếm hết tài nguyên. Router chọn model theo task, capability, health và chi phí, nhưng fallback vẫn phải cùng policy. Timeout có thể đã được provider xử lý nên retry giới hạn; streaming thì chỉ đổi provider trước byte đầu tiên. Tôi tách prompt caching của provider khỏi response cache, cache response phải cô lập theo team và policy, còn dữ liệu nhạy cảm mặc định không cache. Usage event đi qua outbox để không mất, gắn price version và đối soát hóa đơn. Log chủ yếu metadata, không lưu prompt thô, và theo dõi budget burn, 429, latency, token usage, fallback cùng sai lệch billing."

> Senior tip: đừng báo "tiết kiệm 30% nhờ cache" trước khi đo. Theo dõi riêng cache hit, cached input tokens, response-cache hit và cost/request; chúng là các đại lượng khác nhau. Đưa policy version và price version vào usage record sẽ giúp trả lời được câu hỏi khó nhất của Finance: request nào, team nào, model nào tạo ra khoản phí này?
`,
      followups: [
        'Redis quota bị mất dữ liệu khi failover: làm sao giới hạn thiệt hại mà không từ chối mọi request hợp lệ?',
        'Provider timeout sau 30 giây nhưng response thực tế đã được tính phí: client retry và billing xử lý thế nào?',
        'Một team muốn gửi dữ liệu hợp đồng cho model rẻ hơn nhưng data policy cấm: gateway và quy trình ngoại lệ phải làm gì?',
        'Prompt caching hit rate cao nhưng tổng hóa đơn vẫn tăng: bạn kiểm tra token, output, model mix và response cache ra sao?',
        'Bạn muốn thay provider chính mà không gián đoạn: làm canary, so sánh chất lượng và rollback theo metric nào?'
      ],
      related: ['ai-009', 'ai-019', 'microservices-006']
    },
{
  id: 'sd-025',
  title: 'Nền tảng chạy agent tự động xử lý ticket hỗ trợ khách hàng',
  kind: 'bigtech',
  level: 'lead',
  prompt: `Bạn thiết kế nền tảng (platform) cho phép các đội nghiệp vụ xây dựng và chạy **agent tự động** (dựa trên LLM) xử lý ticket hỗ trợ khách hàng. Agent có thể: đọc ticket, gọi công cụ (tra cứu đơn hàng, hoàn tiền, đổi địa chỉ, tạo case cho đội kỹ thuật), hỏi lại khách nếu thiếu thông tin, chờ duyệt của con người (human-in-the-loop) cho hành động rủi ro cao, chạy trong nhiều bước dài (có thể kéo dài vài ngày do chờ phản hồi), **lưu trạng thái để resume** khi pod chết hoặc deploy mới, **giới hạn chi phí token** theo ticket và theo ngày, và **audit đầy đủ** mọi quyết định. Quy mô: 5.000 ticket/ngày, peak 500 ticket/giây lúc sale, agent trung bình 8–12 bước, 15% cần human approval. Bạn có 60 phút.`,
  phases: [
    { name: 'Requirements', minutes: 8, guide: `Functional: định nghĩa agent (prompt, tools, approval rules, cost limit), chạy agent theo ticket, human approval queue, xem lịch sử bước và chi phí, huỷ/dừng agent, versioning agent. Non-functional: độ bền trạng thái (pod chết không mất bước), p99 bước chạy < 3 giây (không tính thời gian chờ human/khách), cost limit cứng, audit log không thể xoá, multi-tenant (nhiều team dùng chung platform). Hỏi: LLM provider nào (OpenAI, Anthropic, tự host), có cần streaming response không, tool gọi đồng bộ hay async, rollback khi tool thất bại. Out-of-scope: RAG knowledge base, fine-tuning, guardrails nội dung (có thể nhắc).` },
    { name: 'Estimation', minutes: 7, guide: `5.000 ticket/ngày x 10 bước = 50.000 bước/ngày ≈ 0,6 bước/giây trung bình, peak 500 ticket/giây x 10 = 5.000 bước/giây. Mỗi bước: LLM call 1–3 giây + tool call 0,1–2 giây. State mỗi ticket ~20 KB (history, variables, step pointer). 5.000 ticket đang chạy x 20 KB = 100 MB state nóng. LLM token: 10 bước x 4.000 token = 40.000 token/ticket => 200M token/ngày, chi phí ~$400–800/ngày tuỳ model. Cần budget enforcement.` },
    { name: 'API & data model', minutes: 7, guide: `POST /agents (định nghĩa agent), POST /runs {agentId, ticketId, input} -> runId, GET /runs/{id}, POST /runs/{id}/approve {stepId, decision}, POST /runs/{id}/cancel. Bảng agent_def (id, version, prompt, tools[], approval_rules, cost_limit_usd, cost_limit_daily_usd), agent_run (id, agent_def_id, ticket_id, status, current_step, state_json, cost_usd, tokens_used, created_at, updated_at), agent_step (run_id, step_idx, type, input, output, tool_calls[], status, cost_usd, started_at, finished_at), approval_task (id, run_id, step_id, status, reviewer, decided_at), audit_log (append-only, run_id, step_idx, event_type, payload).` },
    { name: 'High-level design', minutes: 18, guide: `Vẽ: API -> Run Service (tạo run, load state) -> Execution Engine (đơn luồng cho một run, state machine) -> LLM Gateway (rate limit, cost tracking, provider failover) + Tool Registry (HTTP/gRPC, timeout, retry, idempotency) -> State Store (Postgres + Redis cache) -> Approval Service (queue, Slack/email notify) -> Audit Sink (Kafka -> S3/ClickHouse). Giải thích: vì sao execution engine đơn luồng mỗi run, checkpoint sau mỗi bước, cách resume, cost enforcement.` },
    { name: 'Deep dive', minutes: 20, guide: `Đào sâu: state machine và checkpoint, execution engine đơn luồng (optimistic lock version), LLM gateway (budget, streaming, tool calling format), tool registry (schema, timeout, retry, side-effect classification), human approval (priority, SLA, escalation), cost enforcement (pre-check ước lượng, real-time tracking, hard stop), audit và replay, failure modes (pod chết giữa bước, LLM timeout, tool lỗi một phần, approval hết hạn).` }
  ],
  rubric: [
    'State machine rõ ràng: INIT -> RUNNING(step N) -> WAITING_TOOL -> WAITING_APPROVAL -> WAITING_USER -> COMPLETED/FAILED/CANCELLED',
    'Execution engine đơn luồng cho một run, checkpoint state sau mỗi bước (DB + Redis), resume bằng optimistic lock (version)',
    'LLM Gateway: budget enforcement (ước lượng trước, theo dõi real-time, hard stop), provider failover, tool calling chuẩn (OpenAI function calling / Anthropic tool use), rate limit',
    'Tool Registry: schema JSON, timeout, retry policy, idempotency key, phân loại side-effect (read-only vs write) để quyết định rollback',
    'Human approval: priority queue, SLA theo mức độ rủi ro, escalation tự động, decision ghi lại với reviewer và lý do',
    'Cost limit: per-run và per-day, enforce ở gateway (từ chối bước mới khi vượt), alert khi đạt 80%',
    'Audit log append-only: mọi input, output, tool call, decision, cost; có thể replay run từ đầu',
    'Versioning agent: chạy version mới chỉ cho ticket mới, ticket đang chạy ở version cũ chạy hết hoặc migrate có chủ đích',
    'Observability: step latency p99, token usage, approval queue depth, cost trend, failure rate theo tool',
    'Failure modes và cách xử lý từng loại'
  ],
  reference: `**Tóm tắt:** Nền tảng agent tự động là một **workflow engine có trạng thái bền**, trong đó mỗi run là một state machine đơn luồng checkpoint sau mỗi bước. Ba trụ cột: **state bền** (Postgres + version để resume an toàn), **LLM Gateway** (budget enforcement, provider abstraction, tool calling chuẩn), và **audit append-only** (replay được, compliance). Human approval là một state đặc biệt trong state machine, không phải hệ thống riêng tách biệt.
  
### 1. Yêu cầu và quy mô
- 5.000 ticket/ngày, peak 500 ticket/giây lúc sale.
- Agent trung bình 8–12 bước; 15% cần human approval (hoàn tiền > 500k, xoá tài khoản, thay đổi hợp đồng).
- Chạy lâu: một ticket có thể kéo dài 2–3 ngày do chờ khách phản hồi hoặc chờ duyệt.
- Pod deploy mới hoặc chết không được làm mất tiến độ; cost limit cứng theo ticket và theo ngày.
- Audit log không thể xoá, phải replay được để chứng minh với kiểm toán/legal.
  
### 2. Ước lượng (có phép tính)
| Đại lượng | Phép tính | Kết quả |
|---|---|---|
| Bước/ngày trung bình | 5.000 ticket x 10 bước | 50.000 |
| Bước/giây peak | 500 ticket/s x 10 bước | 5.000 |
| State một run | history (10 bước x 1.5 KB) + variables + pointer | ~20 KB |
| State nóng | 5.000 run đồng thời x 20 KB | 100 MB |
| Token/ngày | 5.000 x 40.000 token | 200M |
| Chi phí LLM/ngày | 200M token x $2–4/1M (Claude Sonnet / GPT-4o mini) | $400–800 |
| Audit log/ngày | 50.000 bước x 5 KB | 250 MB |

Kết luận: state nhỏ, vừa RAM Redis; bottleneck là **LLM latency và cost**, không phải throughput state. Cần single-threaded execution per run để tránh race condition state.

### 3. State Machine
~~~text
INIT
  |
  v (bắt đầu run)
RUNNING(step 0) --> ... --> RUNNING(step N)
  |                              |
  |  tool call                   |  human approval needed
  v                              v
WAITING_TOOL                WAITING_APPROVAL
  |                              |
  |  tool done                   |  approve / reject
  v                              v
RUNNING(step N+1)           RUNNING(step N+1) / FAILED
  |
  |  cần hỏi khách
  v
WAITING_USER
  |
  |  khách trả lời
  v
RUNNING(step N+1)
  |
  v (hoàn tất)
COMPLETED / FAILED / CANCELLED
~~~
Mỗi run chỉ có **một luồng thực thi** tại một thời điểm. Chuyển trạng thái là UPDATE có điều kiện trên version (optimistic locking): UPDATE agent_run SET state = ..., version = version + 1 WHERE id = ? AND version = ?. Nếu 0 dòng => run đang được chạy bởi pod khác hoặc đã chuyển state => retry load state mới.

### 4. Execution Engine (đơn luồng mỗi run)
- Engine là một pool worker kéo task từ queue run:{runId} (Redis list hoặc Kafka partition theo runId).
- Khi nhận task: SELECT * FROM agent_run WHERE id = ? FOR UPDATE (hoặc SELECT rồi UPDATE có điều kiện version).
- Thực hiện một bước: gọi LLM Gateway -> parse tool calls -> gọi Tool Registry -> cập nhật state -> checkpoint.
- **Checkpoint sau mỗi bước**: ghi agent_step, cập nhật agent_run.state_json, current_step, cost_usd, version trong **một transaction**.
- Nếu pod chết giữa bước: step chưa checkpoint, state vẫn ở bước trước. Khi pod mới resume, load state và tiếp tục từ current_step.
- **Idempotency tool call**: mọi tool call mang idempotency_key = runId:stepIdx:toolName (attempt chỉ ghi vào payload log, không nằm trong key). Tool Registry deduplicate theo key này.

~~~java
// Pseudocode execution loop
while (run.status == RUNNING) {
    StepDef step = agentDef.steps[run.currentStep];
    LLMResponse resp = llmGateway.chat(run.stateJson, step.tools);
    
    if (resp.hasToolCalls) {
        run.status = WAITING_TOOL; checkpoint(run);
        for (ToolCall tc : resp.toolCalls) {
            ToolResult tr = toolRegistry.call(tc, run.id, run.currentStep);
            run.stateJson.addToolResult(tc.name, tr);
        }
        run.status = RUNNING; checkpoint(run);
    } else if (resp.needsApproval) {
        run.status = WAITING_APPROVAL; checkpoint(run);
        approvalService.createTask(run.id, run.currentStep, resp.approvalContext);
        return; // yield, wait for approval callback
    } else if (resp.needsUserInput) {
        run.status = WAITING_USER; checkpoint(run);
        notificationService.notifyUser(run.ticketId, resp.question);
        return; // yield, wait for user reply
    } else {
        run.currentStep++;
        if (run.currentStep >= agentDef.steps.length) { run.status = COMPLETED; }
        checkpoint(run);
    }
}
~~~

### 5. LLM Gateway (trung tâm chi phí và provider)
Chức năng:
- **Budget enforcement**: trước mỗi bước, ước lượng token (system prompt + history + tools schema). Nếu run.cost_usd + estimated > run.cost_limit_usd hoặc daily_used + estimated > daily_limit => chặn, chuyển run sang FAILED_COST_LIMIT.
- **Real-time tracking**: sau mỗi LLM call, cộng input_tokens + output_tokens vào run.tokens_used và run.cost_usd theo giá model hiện tại.
- **Provider abstraction**: interface ChatClient với implement OpenAI, Anthropic, Vertex AI. Tự động retry provider khác khi lỗi 5xx/429 (circuit breaker).
- **Tool calling format**: chuẩn hoá sang OpenAI function calling format; Anthropic tool use tự chuyển đổi.
- **Streaming (tuỳ chọn)**: nếu agent cần stream về UI, gateway hỗ trợ SSE; state chỉ checkpoint khi stream kết thúc.
- **Rate limit**: token bucket per provider per project, tránh bị ban.

### 6. Tool Registry
Mỗi tool đăng ký:
~~~json
{
  "name": "refund_order",
  "description": "Hoàn tiền đơn hàng, cần approval nếu > 500k",
  "parameters": { "type": "object", "properties": { "order_id": {"type": "string"}, "amount": {"type": "number"}, "reason": {"type": "string"} }, "required": ["order_id", "amount"] },
  "timeout_ms": 5000,
  "retry": { "max_attempts": 3, "backoff_ms": 200 },
  "idempotent": true,
  "side_effect": "write",
  "approval_required_if": "amount > 500000"
}
~~~
- **Side-effect classification**: read-only (tra cứu) có thể retry tự do; write (hoàn tiền, đổi địa chỉ) cần idempotency key và không auto-retry khi lỗi không xác định; external (gửi email, gọi PSP) có thể gây side-effect bên ngoài, cần compensation nếu rollback.
- **Timeout**: mặc định 5 giây, có thể cấu hình. Timeout thì tool trả ERROR_TIMEOUT, engine quyết định retry hay dừng run.
- **Schema validation**: input/output validate bằng JSON Schema trước/sau khi gọi.

### 7. Human Approval
- Khi agent cần approval, engine tạo approval_task với priority (critical/high/normal) dựa trên loại hành động và số tiền.
- Gửi thông báo Slack/email cho reviewer group có runId, stepIdx, context (tóm tắt ticket, hành động đề xuất, rủi ro, chi phí ước lượng).
- **SLA**: critical 15 phút, high 1 giờ, normal 4 giờ. Hết SLA => escalation lên manager, hoặc auto-reject tuỳ config.
- Reviewer bấm Approve/Reject trên Slack/app -> callback POST /runs/{id}/approve -> engine resume từ WAITING_APPROVAL.
- Mọi decision ghi vào audit_log kèm reviewer_id, decision, reason, decided_at.

### 8. Cost Enforcement (chi tiết)
| Lớp | Cơ chế |
|---|---|
| Pre-check | Ước lượng token bước tới (system prompt ~2k + history ~4k + tools schema ~1k + output dự kiến ~2k) x giá model. Nếu vượt limit => chặn ngay. |
| Real-time | Sau mỗi LLM call, update cost_usd từ usage trả về. Nếu vượt limit giữa chừng => dừng run, status FAILED_COST_LIMIT. |
| Daily aggregate | Job hàng giờ tính SUM(cost_usd) WHERE created_at > now() - 24h per agent_def; đạt 80% daily limit => alert Slack; đạt 100% => từ chối run mới của agent_def đó. |
| Hard limit | Không bao giờ cho vượt; tốt hơn dừng run sớm hơn là nhận hoá đơn bất ngờ. |

### 9. Audit và Replay
- audit_log append-only: (run_id, step_idx, event_type, payload_json, created_at). event_type: LLM_REQUEST, LLM_RESPONSE, TOOL_CALL, TOOL_RESULT, APPROVAL_REQUESTED, APPROVAL_DECIDED, USER_ASKED, USER_REPLIED, STATE_CHECKPOINT, COST_UPDATE, ERROR.
- **Replay**: đọc audit_log theo run_id ORDER BY step_idx, created_at, chạy lại logic engine (mock LLM/tool) để verify kết quả. Dùng cho debugging, compliance, và test regression khi cập nhật prompt.
- **Retention**: 7 năm (tuân thủ), lưu S3 Glacier sau 90 ngày.

### 10. Versioning Agent
- agent_def có version (semver). Ticket mới luôn dùng version mới nhất ACTIVE.
- Run đang chạy: **chạy hết version cũ** (đảm bảo hành vi nhất quán cho khách). Hoặc có công cụ migrate: pause run, chuyển agent_def_id sang version mới, resume từ current_step (cần tương thích state schema).
- Không bao giờ auto-migrate run đang chờ approval/user input.

### 11. Failure Modes
| Sự cố | Phát hiện | Xử lý |
|---|---|---|
| Pod chết giữa bước | Step chưa có record agent_step finished | Resume từ current_step (state đã checkpoint trước đó) |
| LLM timeout / 5xx | Gateway ném LLMError | Retry 2 lần với provider khác; vẫn lỗi => run FAILED_LLM, alert |
| Tool lỗi một phần (ví dụ hoàn tiền thành công nhưng gửi email thất bại) | Tool trả PARTIAL_FAILURE | Engine ghi chi tiết, tiếp tục nếu step không critical; compensation job sau |
| Approval hết hạn SLA | Approval task status = ESCALATED | Auto-reject hoặc chuyển cho manager tuỳ config; run FAILED_APPROVAL_TIMEOUT |
| Cost limit vượt giữa bước | run.cost_usd > limit sau LLM call | Dừng run ngay, status FAILED_COST_LIMIT, refund token chưa dùng (nếu provider hỗ trợ) |
| Tool side-effect write thất bại sau khi LLM đã quyết định | Tool trả error | Đánh dấu step FAILED, run FAILED_TOOL; human review quyết định compensation |
| Prompt injection / agent lặp vô tận | Step count > max_steps (config, mặc định 50) | Hard stop run, status FAILED_LOOP_DETECTED |

### 12. Giám sát
- Step latency p50/p99 (không tính thời gian chờ human/user).
- Token usage per run, per agent, per day.
- Approval queue depth, SLA breach rate.
- Run success/failed/cancelled rate, failure reason breakdown.
- Cost trend và forecast.
- Tool error rate theo tool.

### 13. Ví dụ đời thực
Một sàn TMĐT triển khai agent xử lý ticket "đổi địa chỉ giao hàng". Trước đây: CSKH mất 10 phút/ticket (tra đơn, xác thực OTP, gọi API partner logistics, cập nhật DB, trả lời khách). Sau khi triển khai agent: 80% ticket tự động trong 45 giây, 20% cần approval (đơn đã đóng gói). Chi phí LLM trung bình $0,08/ticket. Tuần đầu có bug: agent lặp vô tận hỏi "bạn muốn đổi sang địa chỉ nào?" vì prompt thiếu điều kiện dừng. Fix: thêm max_steps = 15 và rule "nếu đã hỏi 2 lần vẫn không rõ => yêu cầu human". Sau fix, zero loop, customer satisfaction tăng từ 3.8 lên 4.5/5.

### 14. Trả lời mẫu khi phỏng vấn (90 giây)
"Tôi thiết kế platform agent như một **workflow engine stateful**. Mỗi run là một state machine đơn luồng, checkpoint state vào Postgres sau mỗi bước kèm optimistic lock version để resume an toàn khi pod chết. LLM Gateway đứng giữa: enforce budget (pre-check ước lượng + real-time tracking từ usage), abstract provider (OpenAI/Anthropic failover), chuẩn hoá tool calling. Tool Registry đăng ký schema, timeout, retry, idempotency key, và phân loại side-effect để engine biết khi nào có thể retry an toàn. Human approval là một state WAITING_APPROVAL trong state machine, có priority queue, SLA, escalation. Audit log append-only ghi mọi event để replay và compliance. Cost limit cứng per-run và per-day, alert ở 80%. Failure modes: pod chết resume từ checkpoint, LLM timeout failover provider, tool partial failure ghi chi tiết cho compensation, approval timeout auto-escalate. Metric chính: step latency p99, cost/run, approval SLA, failure reason breakdown."

> Senior tip: đừng để agent tự do gọi LLM không kiểm soát chi phí. Một prompt injection hoặc bug logic làm agent lặp 1.000 bước sẽ đốt hàng nghìn đô la trong vài phút. Luôn có **hard limit** ở gateway (token count từ usage response, không ước lượng), và **max_steps** ở engine. Và hãy log **prompt gốc + biến** vào audit, không chỉ tóm tắt — khi có tranh chấp pháp lý, bạn cần chứng minh chính xác agent "nhìn" gì và "nghĩ" gì lúc đó.`,
  followups: [
    'Làm sao cho phép agent tự quyết định luồng (dynamic branching) thay vì steps cố định, vẫn giữ được audit và cost limit?',
    'Nếu một tool cần chạy_async trong 30 phút (ví dụ batch export), engine xử lý thế nào?',
    'Team A muốn dùng GPT-4o, team B muốn dùng Claude Sonnet, team C muốn dùng model tự host: gateway quản lý multi-tenant ra sao?',
    'Khi cập nhật prompt version mới, làm sao test regression hàng ngàn ticket mẫu tự động?',
    'Agent cần truy xuất knowledge base (RAG) 500GB PDF: tích hợp vào tool hay vào prompt context?'
  ],
  related: ['ai-001', 'ai-003', 'microservices-040']
},
{
  id: 'sd-026',
  title: 'Hệ thống thông báo đa kênh: push, email, SMS với template, ưu tiên, giờ yên lặng, chống trùng',
  kind: 'bigtech',
  level: 'senior',
  prompt: `Bạn thiết kế **hệ thống thông báo trung tâm** cho một super-app 20 triệu người dùng: gửi push notification (FCM/APNs), email (SES/SendGrid), SMS (Twilio/VNPT), in-app. Yêu cầu: **template đa ngôn ngữ** có biến, **ưu tiên** (OTP/giao dịch > hệ thống > marketing), **chống gửi trùng** (idempotency 3 lớp), **retry có backoff** phân biệt lỗi tạm thời/vĩnh viễn, **tôn trọng giờ yên lặng** theo múi giờ và tuỳ chọn người dùng, **giới hạn tần suất** theo kênh/người dùng/ngày, **huỷ thông báo** chưa gửi, **đối soát** với provider. Quy mô: 2 triệu thông báo/ngày, peak 20.000/phút (sale), OTP p99 < 3 giây end-to-end. Bạn có 45 phút.`,
  phases: [
    { name: 'Requirements', minutes: 5, guide: `Functional: gửi đơn lẻ/đồng loạt, template versioned (biến, fallback locale), ưu tiên 3 mức, quiet hours (mặc định 22h-7h local time, user có thể tắt/bật), preference per user per channel per category, huỷ bằng notification_id, lịch sử gửi/trạng thái. Non-functional: OTP < 3s p99, không mất thông báo giao dịch, marketing trễ được, provider rate limit (FCM 10k/s, SES 50k/s, SMS 100/s), khả dụng 99.95%. Hỏi: có cần rich push (hình, action button) không, có webhook callback delivery status không. Out-of-scope: content personalization ML, A/B test template.` },
    { name: 'Estimation', minutes: 5, guide: `2M/ngày = 23/s trung bình, peak 20k/phút = 333/s. OTP ~5% volume nhưng cần latency thấp. Template: ~500 template x 10 locale. Preference: 20M user x 3 kênh x 5 category = 300M dòng (partition theo user_id). Idempotency key: 2M/ngày x TTL 7 ngày = 14M key Redis. Storage: 2M x 2 KB = 4 GB/ngày notification record; 90 ngày = 360 GB.` },
    { name: 'API & data model', minutes: 5, guide: `POST /notifications (Idempotency-Key, priority, template_code, payload, channels[], send_at?) -> 202 {notification_id}. GET /notifications/{id}. POST /notifications/{id}/cancel. POST /templates (versioned). Bảng notification (id, user_id, template_code, template_version, payload, channels[], priority, status, idempotency_key, send_at, created_at), notification_channel (notification_id, channel, provider, provider_msg_id, status, attempts, next_retry_at, sent_at), template (code, version, locale, subject, body_text, body_html, variables_schema), user_preference (user_id, channel, category, enabled, quiet_hours_start, quiet_hours_end, timezone), idempotency_key (key, notification_id, created_at, TTL 7 ngày).` },
    { name: 'High-level design', minutes: 15, guide: `Vẽ: API -> Validation -> Idempotency check -> Priority Router -> 3 Kafka topics (high/normal/low) -> Channel Workers (push/email/sms) -> Provider Adapters -> Delivery Status -> Outbox -> Webhook/Callback -> User Preference Cache (Redis) -> Quiet Hours Check -> Rate Limiter. Giải thích tách topic theo priority, tại sao API chỉ trả 202, cách huỷ thông báo đã vào queue.` },
    { name: 'Deep dive', minutes: 15, guide: `Đào sâu: template rendering (biến, fallback locale, XSS escape), idempotency 3 lớp (API key, DB unique, provider idempotency), retry policy (exponential backoff + jitter, phân biệt transient/permanent), quiet hours (tính toán send_at hiệu lực, delay thay vì drop), rate limiter per user/channel/day, huỷ thông báo (mark cancelled, consumer bỏ qua), provider failover (circuit breaker), đối soát hàng ngày.` }
  ],
  rubric: [
    'API chỉ nhận và trả 202, không gọi provider đồng bộ; tách 3 Kafka topic theo priority (OTP riêng topic)',
    'Template versioned, render an toàn (escape HTML, giới hạn độ dài SMS), fallback locale chain',
    'Idempotency 3 lớp: Idempotency-Key API, UNIQUE (idempotency_key) trong DB, provider idempotency key (FCM message_id, SES message_id)',
    'Retry: exponential backoff + jitter (1s, 5s, 30s, 2m, 10m, 30m), chỉ retry lỗi transient (timeout, 429, 5xx); lỗi permanent (email bounce, invalid phone) -> FAILED ngay',
    'Quiet hours: nếu rơi vào giờ yên lặng thì delay đến giờ mở cửa tiếp theo (không drop), user có thể opt-out quiet hours per category',
    'Rate limiter: per user per channel per day (configurable), per category, global burst control',
    'Huỷ thông báo: status = CANCELLED, consumer kiểm tra status trước khi gửi, outbox cũng kiểm tra',
    'Provider failover: circuit breaker per provider, fallback provider thứ 2, alert khi failover',
    'Đối soát hàng ngày: download report từ provider (SES bounce/complaint, Twilio delivery, FCM delivery), so khớp với notification_channel, chênh lệch > 0.1% alert',
    'Observability: queue lag per priority, delivery rate per provider, p99 latency OTP, quiet hours delayed count, cancelled rate, cost per channel'
  ],
  reference: `**Tóm tắt:** Hệ thống thông báo là **hàng đợi ưu tiên có trạng thái**, không phải fire-and-forget. Ba nguyên tắc: **tách priority queue** (OTP không bao giờ chờ marketing), **idempotency 3 lớp** (API, DB, provider), và **retry có phân biệt transient/permanent**. Template versioned render ở worker, quiet hours delay thay vì drop, huỷ bằng status CANCELLED kiểm tra ở consumer. Đối soát hàng ngày với file báo cáo provider là lưới an toàn cuối.
  
### 1. Yêu cầu và quy mô
- 20 triệu user, 2 triệu thông báo/ngày, peak 20.000/phút (333/s) lúc sale.
- 4 kênh: Push (FCM/APNs), Email (SES/SendGrid), SMS (Twilio/VNPT), In-app.
- OTP/giao dịch: p99 < 3 giây end-to-end, **không bao giờ bị marketing chặn**.
- Template: 500 template, 10 locale, có biến ({{user_name}}, {{order_id}}), versioned.
- Quiet hours: mặc định 22:00-07:00 theo timezone user, user có thể tắt/bật per category.
- Rate limit: ví dụ push max 10/ngày/user, email max 5/ngày/user, SMS max 3/ngày/user.
- Huỷ: có thể huỷ thông báo PENDING/SCHEDULED bằng notification_id.
- Đối soát: hàng ngày so sánh với report provider.

### 2. Ước lượng (có phép tính)
| Đại lượng | Phép tính | Kết quả |
|---|---|---|
| Trung bình | 2.000.000 / 86.400 | ~23/s |
| Peak sale | 20.000 / 60 | ~333/s |
| OTP proportion | 5% | ~17/s peak |
| Template storage | 500 x 10 x 5 KB | ~25 MB |
| Preference rows | 20M x 3 kênh x 5 category | 300M rows (~30 GB) |
| Idempotency keys | 2M/ngày x TTL 7 ngày | 14M keys Redis |
| Notification record | 2M x 2 KB | 4 GB/ngày |
| Retention 90 ngày | 4 GB x 90 | 360 GB |

Kết luận: **bottleneck là provider rate limit** (SMS 100/s, FCM 10k/s, SES 50k/s), không phải infra. Tách topic priority là bắt buộc.

### 3. Kiến trúc
~~~text
Service A (Order) --\
Service B (Auth)  ---> [Notification API] --Validation, Idempotency--> [DB: notification, notification_channel]
Service C (Mkt) --/         |                                                         |
                            v                                                         v
                    [Priority Router]                                           [Outbox] --> [Webhook Dispatcher] --> Merchant/App
                       |      |      |
                 high    normal   low                                            ^
                 (OTP)   (sys)   (mkt)                                           |
                       |      |      |                                           |
                  +------+------+------+                                         |
                  | Kafka Topics x 3 |                                         |
                  +------+------+------+                                         |
                         |     |     |                                          |
              +----------+     |     +----------+                               |
              v                v                v                               |
         [Push Worker]  [Email Worker]   [SMS Worker]                           |
              |                |                |                               |
              v                v                v                               |
         [FCM/APNs]        [SES/SendGrid]  [Twilio/VNPT]                        |
              |                |                |                               |
              +----------------+----------------+                               |
                               |                                               |
                        [Delivery Status Handler]                               |
                               |                                               |
                        Update notification_channel,                           |
                        nếu thành công -> DONE, nếu lỗi -> retry/DLQ           |
~~~
- **API chỉ trả 202**: ghi notification + notification_channel (mỗi kênh một dòng, status PENDING), publish Kafka topic theo priority. Không gọi provider trong request.
- **3 Kafka topic riêng**: notif.high (OTP, fraud alert, payment), notif.normal (order confirm, shipping), notif.low (promo, newsletter). Worker pool riêng mỗi topic, high priority luôn có worker rảnh.
- **Consumer group per channel per priority**: push.high, email.high, sms.high, push.normal... Cho phép scale độc lập.

### 4. Template Engine
- Template lưu trong DB, có version. Khi gửi, worker đọc template_version từ notification (snapshot tại thời điểm tạo) -> render.
- **Biến**: {{user_name}}, {{order_id}}, {{amount | currency:VND}}. Hỗ trợ filter đơn giản (currency, date, upper).
- **Fallback locale**: user locale vi-VN -> tìm vi-VN, thiếu thì vi, thiếu thì en-US, thiếu thì en (base).
- **Render an toàn**:
  - Email HTML: escape tất cả biến (trừ biến đánh dấu {{{safe_html}}} cho team marketing tin cậy).
  - SMS: giới hạn 160 ký tự GSM-7 / 70 ký tự Unicode, cắt an toàn ở grapheme cluster, thêm [...] nếu cắt.
  - Push: title max 50 ký tự, body max 100 ký tự (tuỳ platform).
- **Variable validation**: variables_schema trong template (JSON Schema), render validate trước khi gửi.

~~~java
// Render pseudocode
String render(Template t, Locale userLocale, Map<String, Object> payload) {
    TemplateVersion tv = t.getVersion(userLocale); // fallback chain
    String rendered = tv.body;
    for (var entry : payload.entrySet()) {
        String safe = escapeHtml(entry.getValue().toString());
        rendered = rendered.replace("{{" + entry.getKey() + "}}", safe);
    }
    // Xử lý filter {{amount | currency:VND}} -> regex replace
    return rendered;
}
~~~

### 5. Idempotency 3 Lớp (Chống gửi trùng)
At-least-once ở mọi chặng, trùng là thực tế. Ba lớp bảo vệ:
1. **API Layer**: Client gửi Idempotency-Key (UUID). API kiểm tra idempotency_key table: tồn tại => trả 202 kèm notification_id cũ ngay.
2. **DB Layer**: notification table có UNIQUE (idempotency_key). Insert race condition: một sẽ thắng, kia bị duplicate key => catch, load record cũ, trả 202.
3. **Provider Layer**: 
   - FCM: message_id do server sinh, nhưng client có thể truyền apns-collapse-id / android.collapse_key để FCM deduplicate.
   - SES: MessageId trả về, không có idempotency key input -> phụ thuộc lớp 1,2.
   - Twilio: MessageSid trả về; SMS thường không idempotent -> lớp 1,2 là chủ chốt.
   - In-app: UNIQUE (notification_id, user_id) trong bảng in_app_message.

### 6. Retry Policy (Phân biệt Transient vs Permanent)
| Loại lỗi | Ví dụ | Xử lý |
|---|---|---|
| **Transient** | Timeout, 429 (rate limit), 5xx, network error | Retry với exponential backoff + jitter |
| **Permanent** | 400 invalid payload, email bounce (hard bounce), invalid phone number, FCM NotRegistered | FAILED ngay, không retry |
| **Quasi-permanent** | Soft bounce, FCM Unavailable (thiết bị offline) | Retry vài lần rồi FAILED, lưu lý do |

**Backoff schedule**: 1s, 5s, 30s, 2m, 10m, 30m, 1h, 3h (tối đa 8 lần). Jitter ±20%.
next_retry_at = now() + backoff[attempt] * (0.8 + 0.4 * random()).
Worker query: WHERE status = 'PENDING' AND next_retry_at <= now() ORDER BY priority DESC, next_retry_at LIMIT 100.

### 7. Quiet Hours (Giờ yên lặng)
- Mỗi user có timezone (IANA, ví dụ Asia/Ho_Chi_Minh), quiet_hours_start (mặc định 22), quiet_hours_end (mặc định 7), per category (transactional, system, marketing).
- Khi consumer chuẩn bị gửi: tính local_now = utc_now.atZone(user.timezone). Nếu local_now trong [start, end) VÀ category bật quiet hours -> **delay**.
- **Delay strategy**: không drop, tính next_open = local_now.withHour(end).withMinute(0).withSecond(0) (ngày hôm sau nếu đã qua giờ end). send_at_effective = next_open.atZone(user.timezone).toInstant().
- Cập nhật notification_channel.next_retry_at = send_at_effective, status = DELAYED_QUIET_HOURS.
- User có thể opt-out quiet hours per category (toggle trong preference) -> bỏ qua check.

### 8. Rate Limiter (Giới hạn tần suất)
- **Per user per channel per day**: Redis key ratelimit:{channel}:{user_id}:{date} (INCR, TTL 86400). Config mặc định: push 10, email 5, SMS 3, in-app unlimited.
- **Per category per day**: ratelimit:cat:{category}:{user_id}:{date} (marketing max 2/ngày).
- **Global burst**: token bucket per channel (FCM 10k/s, SMS 100/s) tại worker level.
- Khi vượt limit: status = RATE_LIMITED, next_retry_at = tomorrow 00:00:01 UTC (hoặc giờ mở cửa quiet hours nếu có). Alert nếu marketing bị rate limit nhiều.

### 9. Huỷ thông báo (Cancel)
- POST /notifications/{id}/cancel -> UPDATE notification SET status = 'CANCELLED' WHERE id = ? AND status IN ('PENDING','SCHEDULED','DELAYED_QUIET_HOURS','RATE_LIMITED').
- Nếu đã SENT/DELIVERED/FAILED -> trả 409 Cannot cancel.
- Consumer trước khi gửi: SELECT status FROM notification WHERE id = ?. Nếu CANCELLED -> bỏ qua, update notification_channel status = 'CANCELLED'.
- Outbox/webhook cũng kiểm tra notification.status trước khi dispatch.

### 10. Provider Failover
- Mỗi kênh có 2 provider: Push (FCM primary, APNs fallback cho iOS), Email (SES primary, SendGrid fallback), SMS (Twilio primary, VNPT fallback).
- **Circuit breaker** per provider: lỗi 5xx/429 > 50% trong 1 phút -> OPEN (30s) -> HALF_OPEN -> CLOSED.
- Khi primary OPEN: worker chuyển sang fallback provider cho **lần thử mới** (retry hoặc notification mới). **Không failover cho notification đang SENDING** (đang chờ callback) vì có thể gây trùng.
- Failover phải log và alert Slack (chi phí provider khác nhau, deliverability khác).

### 11. Đối soát hàng ngày (Reconciliation)
- **Input**: file báo cáo từ provider (SES: bounce/complaint/delivery CSV; Twilio: delivery report; FCM: delivery report qua BigQuery export).
- **Process**: Job 02:00 UTC đọc file, so khớp provider_msg_id với notification_channel.provider_msg_id.
- **Kết quả so khớp**:
  | Trạng thái hệ thống | Trạng thái provider | Hành động |
  |---|---|---|
  | SENT | Delivered | OK |
  | SENT | Bounced (hard) | Mark FAILED_BOUNCE, cập nhật preference (disable email) |
  | SENT | Bounced (soft) | Retry nếu attempts < max |
  | SENT | Complaint | Mark COMPLAINT, disable marketing email cho user |
  | SENT | Không có trong report | UNKNOWN_DELIVERY, retry query sau 4h |
  | PENDING/RETRYING | Delivered | Cập nhật DELIVERED, tính latency |
- **Metric đối soát**: mismatch_rate = count(mismatch) / count(total_sent). > 0.1% -> alert.

### 12. In-app Notification (Kênh thứ 4)
- Không qua provider bên ngoài. Worker ghi vào bảng in_app_message (id, user_id, notification_id, title, body, data_json, read_at, created_at).
- API GET /in-app/messages?cursor=&limit=20 đọc từ bảng này (index user_id, created_at DESC).
- Real-time: server push qua WebSocket khi có message mới (nếu user online), hoặc client poll.

### 13. Failure Modes
| Sự cố | Ảnh hưởng | Xử lý |
|---|---|---|
| Kafka consumer group rebalance | Tạm dừng xử lý vài giây | Idempotency + checkpoint offset đảm bảo không mất/bội |
| Provider chính down 10 phút | Notification kẹt PENDING | Circuit breaker mở -> fallback provider cho retry/new; alert |
| Quiet hours delay làm OTP trễ | OTP gửi đạt > 3 giây | **OTP category KHÔNG bao giờ áp dụng quiet hours** (hard code trong config) |
| Template render lỗi (biến thiếu) | Notification FAILED_TEMPLATE | Validation tại API (kiểm tra payload vs schema), render lỗi vẫn log để debug |
| SMS provider trả 429 liên tục | Queue SMS backing up | Backpressure: worker dừng consume SMS topic, alert, scale worker hoặc xin tăng quota |
| User preference thay đổi khi notification đang PENDING | Gửi sai ý định của người dùng (gửi theo preference cũ) | Consumer đọc preference **lúc gửi** (Redis cache TTL 30s), không lúc tạo |

### 14. Giám sát
- **Queue lag per priority**: high < 10, normal < 1.000, low < 10.000 (số message chờ consumer).
- **Delivery rate per provider**: SES delivered/bounce/complaint %, Twilio delivered/failed %, FCM sent/delivered %.
- **p99 latency OTP**: từ API receive đến provider accept (target < 3s).
- **Quiet hours delayed count**: bao nhiêu notification bị delay, trung bình delay bao lâu.
- **Cancelled rate**: tỷ lệ huỷ / tổng tạo.
- **Cost per channel per day**: USD, so với budget.

### 15. Ví dụ đời thực
Ngày Black Friday, marketing đẩy 500.000 email promo trong 1 giờ. Hệ thống cũ dùng một queue duy nhất -> OTP đặt hàng bị chặn 15 phút, khách khiếu nại hàng loạt. Sau redesign: tách 3 Kafka topic, worker email.high dành riêng OTP (luôn 10 worker rảnh), email.low xử lý promo với rate limit 50k/phút (SES quota). Kết quả: OTP p99 1,2 giây không biến đổi, promo gửi xong trong 2 giờ (delay có chủ đích), chi phí SES tăng 20% do retry bounce nhưng bounce rate giảm từ 4% xuống 0,8% nhờ preference sync và quiet hours (không gửi email promo lúc 23h gây complaint).

### 16. Trả lời mẫu khi phỏng vấn (90 giây)
"Tôi tách ba thứ: priority queue, idempotency ba lớp, và retry có phân biệt lỗi. API nhận request, kiểm tra Idempotency-Key, ghi DB status PENDING, publish vào 1 trong 3 Kafka topic (high/normal/low) -> OTP vào high topic, không bao giờ chờ marketing. Worker per channel per priority consume, trước khi gửi: đọc user preference (Redis cache), check quiet hours (delay không drop), check rate limit, render template versioned với fallback locale và escape an toàn. Gọi provider với circuit breaker và fallback provider. Retry chỉ transient error (timeout, 429, 5xx) với exponential backoff + jitter; permanent error (bounce, invalid phone) -> FAILED ngay. Huỷ bằng UPDATE status CANCELLED, consumer check trước khi gửi. Hàng ngày job đối soát so file report provider với DB, mismatch > 0.1% alert. Metric chính: queue lag per priority, OTP p99 latency, delivery rate per provider."

> Senior tip: **OTP là thứ tôi không bao giờ để vào quiet hours, không rate limit per user per day (chỉ rate limit per IP/device để chống brute force), và luôn có provider fallback**. Một sự cố SMS provider down 10 phút khiến hàng nghìn khách không đăng nhập được là sự cố P0, trong khi marketing gửi trễ 2 giờ không ai phàn nàn. Hãy tách infrastructure OTP (topic, worker, provider account) hẳn ra khỏi notification thường — đó là cách chắc chắn nhất để không bao giờ bị "marketing chặn OTP".`,
  followups: [
    'Làm sao hỗ trợ rich push (hình ảnh, action button) mà vẫn giữ template versioned và fallback?',
    'Nếu muốn A/B test 2 template cho cùng một campaign, thiết kế thêm gì?',
    'Provider SMS tăng giá gấp 3: bạn chuyển traffic sang push/email thế nào mà không làm rơi conversion?',
    'Làm sao phát hiện và chặn một campaign marketing gửi spam (template bị inject script, hoặc gửi 100k email cho user chưa opt-in)?',
    'In-app notification real-time cho 10 triệu user online: WebSocket hay SSE, và scale thế nào?'
  ],
  related: ['design-006', 'microservices-020', 'scenario-012']
},
{
  id: 'sd-027',
  title: 'Rate limiter phân tán cho API gateway',
  kind: 'bigtech',
  level: 'senior',
  prompt: `Thiết kế rate limiter phân tán cho API gateway phục vụ 10.000 service, 1 triệu request/giây, với nhiều policy (per user, per IP, per endpoint, per tenant). So sánh token bucket và sliding window, và cách triển khai nguyên tử với Redis Lua script. Limiter phải hỗ trợ multi-region (active-active), limiter chết không được làm sập hệ thống. Bạn có 45 phút.`,
  phases: [
    { name: 'Requirements', minutes: 5, guide: `Functional: giới hạn theo API key/user/IP/endpoint/tenant, trả 429 + Retry-After + headers chuẩn (X-RateLimit-*). Non-functional: overhead < 2 ms, availability 99.99%, fail-open/fail-closed có chủ đích, multi-region active-active. Hỏi: policy động hay tĩnh, global hay per-region, burst allowance. Out-of-scope: WAF/DDoS layer 3/4 (có thể nhắc).` },
    { name: 'Estimation', minutes: 5, guide: `1M req/s, mỗi request một lần Redis round-trip ~0,5 ms trong cùng region => 0,5 s tổng latency nếu tuần tự; cần pipeline/batch và local cache. Redis memory: mỗi key ~100 byte, 10M active key ~1 GB. Kết luận: bottleneck là Redis round-trip, không phải CPU.` },
    { name: 'API & data model', minutes: 5, guide: `API gateway config: policy (key pattern, limit, window, burst). Redis key: rate:{policy}:{key}. Lua script atomic. Response headers X-RateLimit-*. Bảng policy config trong DB, cache ở gateway.` },
    { name: 'High-level design', minutes: 15, guide: `Vẽ: Client -> LB -> Gateway (limiter middleware) -> Redis Cluster (Lua) -> upstream service. Config service push policy. Explain sync path và fail mode. Nêu local fallback bucket.` },
    { name: 'Deep dive', minutes: 15, guide: `Đào sâu: so sánh thuật toán, Lua atomic, clock Redis, hot key sharding, fail-open/fail-closed, local bucket + sync định kỳ, fairness giữa tenant, test dưới tải đồng thời.` }
  ],
  rubric: [
    'So sánh thuật toán (fixed/sliding/token bucket/leaky) với ưu/nhược điểm thực tế',
    'Token bucket với capacity và refill rate, giải thích burst control',
    'Redis Lua script atomic, dùng thời gian Redis (TIME) thay vì đồng hồ app',
    'Hot key sharding: chia quota thành N bộ đếm con, random/hash',
    'Fail-open/fail-closed có chủ đích: đọc fail-open, ghi/tài chính fail-closed',
    'Local fallback limiter (bucket trong bộ nhớ mỗi instance, quota chia đều)',
    'Response headers và Retry-After chuẩn RFC 6585',
    'Config policy động (không deploy lại gateway)',
    'Fairness giữa tenant: quota theo tier, priority queue',
    'Test và observability: hit rate, latency, fail-open count, hot key top'
  ],
  reference: `**Tóm tắt:** Rate limiter bảo vệ hệ thống khỏi lưu lượng vượt sức chịu và chống abuse. Với một instance, token bucket trong bộ nhớ là đủ; với nhiều instance và multi-region, cần trạng thái chia sẻ và cập nhật nguyên tử — Redis + Lua script, hoặc thuật toán xấp xỉ chấp nhận sai số để giảm round-trip. Multi-region active-active yêu cầu đồng bộ quota cross-region hoặc chấp nhận eventual consistency.

### Yêu cầu và vị trí đặt
- Giới hạn theo API key/user/IP/endpoint/tenant, ví dụ 100 req/phút cho user thường, 10.000 cho partner.
- Độ trễ thêm mỗi request < 2 ms; limiter chết không làm sập hệ thống.
- Trả 429 Too Many Requests kèm Retry-After, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset.
- Đặt ở API gateway để chặn sớm.
- Multi-region active-active: traffic routing theo latency/geo, quota có thể global hoặc per-region.

### So sánh thuật toán
| Thuật toán | Cách hoạt động | Ưu | Nhược |
|---|---|---|---|
| Fixed window | Đếm trong mỗi phút, reset đầu phút | Rẻ, dễ hiểu | Burst gấp đôi ở biên |
| Sliding window log | Lưu timestamp từng request | Chính xác nhất | Tốn bộ nhớ O(số request) |
| Sliding window counter | Nội suy giữa window trước và hiện tại | Rẻ, mượt | Xấp xỉ, sai số nhỏ |
| Token bucket | Xô chứa N token, nạp r token/giây | Cho phép burst có kiểm soát | Cần lưu 2 biến (tokens, last_refill) |
| Leaky bucket | Hàng đợi xả đều | Làm mượt đầu ra | Thêm độ trễ, không cho burst |

Với API, token bucket thường tốt nhất vì traffic thật có burst. Sliding window counter là lựa chọn thay thế tốt nếu muốn độ chính xác cao hơn ở biên window.

### Token bucket
Mỗi key có capacity (burst tối đa) và refillRate (token/giây). Request đến:
1. elapsed = now - lastRefill.
2. tokens = min(capacity, tokens + elapsed * refillRate).
3. Nếu tokens >= cost thì trừ và cho qua; ngược lại chặn.

### Triển khai với Redis (Lua atomic)
~~~text
-- KEYS[1] = rate:user:123 ; ARGV = capacity, refill, cost
local data = redis.call('HMGET', KEYS[1], 'tokens', 'ts')
local tokens = tonumber(data[1])
local ts = tonumber(data[2])
-- Dùng thời gian của Redis (TIME) để tránh lệch đồng hồ giữa các app instance
local t = redis.call('TIME')
local now = tonumber(t[1]) * 1000 + math.floor(tonumber(t[2]) / 1000)
local capacity = tonumber(ARGV[1])
local refillRate = tonumber(ARGV[2])
if tokens == nil then tokens = capacity; ts = now end
local refill = (now - ts) / 1000.0 * refillRate
tokens = math.min(capacity, tokens + refill)
local cost = tonumber(ARGV[3])
local allowed = 0
if tokens >= cost then tokens = tokens - cost; allowed = 1 end
redis.call('HSET', KEYS[1], 'tokens', tokens, 'ts', now)
redis.call('PEXPIRE', KEYS[1], 86400000)
return { allowed, math.floor(tokens) }
~~~
- Script lấy thời gian bằng {{redis.call('TIME')}} ngay trong Redis (thay vì tin đồng hồ của app) để tránh clock skew khi nhiều gateway instance chạy trên máy khác nhau. Redis chạy Lua script theo kiểu atomic (nguyên tử: chạy trọn vẹn, request khác không xen vào giữa chừng), nên đọc-sửa-ghi bộ đếm an toàn dưới tải cao.
- TTL phải lớn hơn thời gian đầy xô (capacity / refillRate).
- Mỗi request một lần Redis ~0,3-1 ms trong cùng region.

### Hot key và sharding
Một key partner 500k req/s biến một key Redis thành điểm nghẽn:
- Tách quota thành N bộ đếm con (rate:key:0..N-1), chọn random/hash; tổng quota đúng xấp xỉ.
- Cache quyết định trong thời gian rất ngắn (10 ms) cho key nóng.
- Với Redis Cluster, dùng hash tag {key} để các shard con nằm cùng slot.

### Multi-region
| Chiến lược | Mô tả | Trade-off |
|---|---|---|
| Per-region quota | Mỗi region có quota riêng, không đồng bộ | Đơn giản, nhưng user đổi region có thể vượt quota global |
| Global quota sync | Redis CRDT hoặc sync qua Kafka | Chính xác, thêm latency cross-region |
| Token bucket local + async reconcile | Mỗi region có bucket local, đồng bộ quota định kỳ | Cân bằng, chấp nhận vượt nhẹ quota global |

Lựa chọn thực tế: per-region quota với quota global = per-region x số region (an toàn), hoặc global quota với Redis Enterprise Active-Active / CRDT nếu cần chính xác.

### Limiter chết thì sao
- Fail-open: cho request đi qua khi Redis không truy cập được. Phù hợp API đọc.
- Fail-closed: chặn toàn bộ. An toàn cho tài chính nhưng biến sự cố Redis thành sự cố toàn hệ thống.
- Thực tế: fail-open kèm local fallback limiter (bucket trong bộ nhớ mỗi instance với quota chia đều).

### Local bucket + đồng bộ định kỳ
Mỗi 100 ms xin một phần quota từ Redis; chấp nhận vượt nhẹ nhưng giảm tải Redis hàng chục lần. Phù hợp khi latency là ưu tiên.
~~~java
// Local token bucket trong gateway instance
class LocalBucket {
    private double tokens;
    private long lastRefill;
    private final double capacity;
    private final double refillRate;
    
    synchronized boolean tryTake(int cost) {
        refill();
        if (tokens >= cost) { tokens -= cost; return true; }
        return false;
    }
    
    private void refill() {
        long now = System.currentTimeMillis();
        tokens = Math.min(capacity, tokens + (now - lastRefill) / 1000.0 * refillRate);
        lastRefill = now;
    }
    
    // Định kỳ sync về Redis: đọc tokens còn lại, reset local
}
~~~

### Fairness giữa tenant
- Quota theo tier; tenant lớn có bucket riêng.
- Khi một tenant chiếm hết quota cụm, dùng per-tenant bucket và priority queue.
- Global vs per-region: per-region đơn giản hơn, global chính xác hơn nhưng tốn round-trip cross-region.

### Trả lỗi tử tế
Ngoài 429, trả thời gian chờ và hướng dẫn. Client tốt sẽ backoff theo Retry-After.
~~~http
HTTP/1.1 429 Too Many Requests
Retry-After: 45
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1704067200
Content-Type: application/json
{"error": "rate_limit_exceeded", "message": "Quá giới hạn, thử lại sau 45 giây"}
~~~

### Giám sát
- Rate limit hit rate theo policy, Redis latency, fail-open count, hot key top.
- Alert khi p99 latency limiter > 5 ms hoặc fail-open rate > 1%.

> Senior tip: đừng đặt rate limit theo user ID nếu chưa xác thực, vì kẻ tấn công tạo hàng triệu tài khoản. Luôn có thêm lớp theo IP và endpoint; và nhớ NAT công ty có thể khiến hàng nghìn người dùng chung một IP — giới hạn theo IP phải rộng hơn nhiều so với theo user. Với multi-region, hãy quyết định rõ: quota global hay per-region? Nếu global, đừng quên tính chi phí cross-region traffic cho Redis sync.`,

  followups: [
    'Bạn xử lý công bằng khi một tenant chiếm hết quota của cụm thế nào?',
    'Nếu cần giới hạn theo cửa sổ trượt chính xác tuyệt đối, bạn chọn cấu trúc dữ liệu gì?',
    'Làm sao test rate limiter dưới tải đồng thời cao mà không bị flaky?',
    'Multi-region active-active: khi network partition giữa hai region, quota global xử lý ra sao?',
    'Bạn implement sliding window log với Redis sorted set thế nào, và chi phí so với token bucket?'
  ],
  related: ['design-003', 'microservices-011']
},

{
  id: 'sd-028',
  title: 'News feed kiểu mạng xã hội',
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
    'Ước lượng write amplification có phép tính',
    'So sánh fan-out on write vs read (push vs pull)',
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
Không dùng offset vì feed thay đổi liên tục gây trùng/sót. Dùng cursor dựa trên score + id. Vì feed lấy bài mới trước (điểm cao hơn = mới hơn), khi tải trang tiếp theo ta lấy các bài có score nhỏ hơn cursor: {{score < lastScore}} hoặc ({{score == lastScore}} và {{postId < lastPostId}} theo thứ tự mong muốn, phải thống nhất với cách member cùng score được sắp trong Redis sorted set).
~~~java
// Ví dụ cursor pagination (lấy bài cũ hơn cursor, mới nhất trước)
public List<Post> getFeed(String userId, String cursor, int limit) {
    // Parse cursor: "timestamp:postId"
    double maxScore = cursor != null ? parseScore(cursor) : Double.POSITIVE_INFINITY;
    String lastPostId = cursor != null ? parsePostId(cursor) : null;

    // ZREVRANGEBYSCORE feed:userId (maxScore -inf LIMIT 0 limit+1
    // Nếu cursor trùng score, loại bỏ bài đã trả ở trang trước bằng cách so sánh postId
    // (Redis xếp member cùng score theo lexicographic tăng dần).
    // Trả về list và cursor mới = score của bài cuối + postId
}
~~~

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

### Ngưỡng celebrity động
Không nên cố định cứng 10k. Tài khoản 8k follower nhưng bài viral nhận 2 triệu tương tác, làm worker fan-out nghẽn cả hàng đợi. Hãy dùng ngưỡng động theo tải thực tế và luôn có cơ chế tắt push cho một tài khoản cụ thể.
~~~java
// Logic celebrity động
boolean isCelebrity(String authorId) {
    long followers = followService.getFollowerCount(authorId);
    long recentEngagement = engagementService.getRecentEngagement(authorId, Duration.ofHours(24));
    // Celebrity nếu follower > 10k HOẶC engagement cao bất thường
    return followers > 10000 || recentEngagement > 100000;
}
~~~

### Rebuild feed khi Redis mất
1. Từ DB lấy danh sách follower của user.
2. Với mỗi follower thường: đọc bài của người họ follow, ZADD vào feed:userId.
3. Với celebrity: không rebuild, chỉ merge lúc đọc.
4. Chạy song song theo batch userId, rate limit để không sập DB.

> Senior tip: ngưỡng celebrity không nên cố định cứng 10k. Tôi từng thấy tài khoản 8k follower nhưng bài viral nhận 2 triệu tương tác, làm worker fan-out nghẽn cả hàng đợi. Hãy dùng ngưỡng động theo tải thực tế và luôn có cơ chế tắt push cho một tài khoản cụ thể. Và quan trọng: feed chỉ lưu postId (con trỏ), không lưu nội dung — sửa bài, xoá bài, kiểm duyệt chỉ cần sửa bản gốc, feed tự động đúng.

### Trả lời mẫu khi phỏng vấn
"Tôi dùng kiến trúc hybrid push/pull. Người dùng thường (follower < ngưỡng) được push bài vào Redis sorted set feed:userId; celebrity không push, chỉ lưu bài gốc. Khi đọc, feed service merge pushed feed + celebrity posts, hydrate batch, trả cursor pagination. Fan-out worker đọc Kafka post-created, batch ZADD 500 user/lượt. Write amplification: 1 tỷ bản ghi/ngày cho người thường, celebrity chỉ 1 bản/bài. Ngưỡng celebrity động theo follower count + engagement gần đây. Xoá bài lọc khi hydrate; sửa bài tự động đúng vì feed chỉ lưu id. Ranking tách pipeline: candidate generation -> scoring -> re-ranking, cache ngắn hạn. Rebuild từ DB nếu Redis mất."

### Giám sát
- Fan-out lag (thời gian từ post đến khi có trong feed), p99 read latency, cache hit rate, celebrity post count, merge dedup rate.

> Senior tip: điểm phân biệt senior là nhận ra feed chỉ lưu con trỏ (postId), không lưu nội dung. Điều này làm xoá/sửa bài trễ vài giây cũng tự động đúng, và giảm storage 100 lần so với lưu full text. Interviewer thường hỏi "làm sao xoá bài đã push cho 1 triệu follower", câu trả lời đúng là "không cần xoá trong feed, chỉ đánh dấu deleted ở bài gốc và lọc khi hydrate".`,

  followups: [
    'Nếu sản phẩm yêu cầu feed nhất quán tức thì khi follow/unfollow, bạn xử lý ra sao?',
    'Bạn thiết kế rebuild feed khi Redis mất toàn bộ dữ liệu mà không sập hệ thống?',
    'Làm sao cá nhân hoá feed mà vẫn giữ p99 dưới 300 ms?',
    'Celebrity đăng bài, bạn push cho 100k follower "super fan" (tương tác nhiều) và pull cho phần còn lại: thiết kế ra sao?',
    'Bạn xử lý bài vi phạm chính sách (cần xoá ngay trên toàn hệ thống) thế nào?'
  ],
  related: ['design-007', 'design-028']
},
{
  id: 'sd-029',
  title: 'Bot review pull request bằng LLM cho 200 repository',
  kind: 'bigtech',
  level: 'senior',
  prompt: `Thiết kế bot review pull request bằng Large Language Model (LLM, mô hình ngôn ngữ lớn) cho 200 repository nội bộ trên GitHub Enterprise. Bot phải phản hồi trong vài phút, chỉ đưa nhận xét có khả năng là lỗi thật, không làm lộ mã nguồn và không khiến chi phí AI tăng không kiểm soát. Quy mô: 2.000 pull request mỗi ngày, giờ cao điểm 300 pull request/giờ, trung bình mỗi pull request có 8 file thay đổi. Người dùng có thể đẩy commit mới khi lần review trước còn đang chạy. Bạn có 45 phút.`,
  phases: [
    { name: 'Requirements', minutes: 5, guide: `Chốt bot chỉ đọc pull request trong repository được cài đặt và chỉ tạo nhận xét, không tự sửa hay merge. Review cả pull request mới và commit mới; xác định bot review toàn bộ diff hay chỉ phần mới. Chất lượng đo bằng precision (trong các comment bot đưa ra, bao nhiêu comment đúng) và recall (trong các lỗi thật, bot bắt được bao nhiêu); ưu tiên precision để tránh làm phiền. Chốt p95 từ webhook đến review, giới hạn dữ liệu gửi nhà cung cấp LLM, chính sách lưu dữ liệu, quota theo repository và khả năng tắt bot.` },
    { name: 'Estimation', minutes: 5, guide: `2.000 PR/ngày / 86.400 ≈ 0,023 PR/s trung bình. Giả sử giờ cao điểm 300 PR/giờ ≈ 0,083 PR/s; burst gấp 10 tương đương khoảng 0,83 PR/s, tức 50 PR/phút trong 5 phút. Tám file mỗi PR, giả sử mỗi file có trung vị 100 dòng diff, là khoảng 800 dòng; sau lọc vẫn có thể 10–30 nghìn token đầu vào và 1–3 nghìn token đầu ra mỗi lần. Ở 2.000 PR/ngày, 20 nghìn token vào tương đương 40 triệu input token/ngày, chưa tính retry. Con số token chỉ là giả định để lập ngân sách; đo token thực tế theo model. Tính thêm PR lớn, file sinh tự động, retry và review lại commit mới.` },
    { name: 'API & data model', minutes: 5, guide: `GitHub App nhận webhook pull_request (opened, synchronize, reopened) và check_suite/check_run nếu cần. Xác thực chữ ký webhook trước khi nhận; kiểm tra installation và repository allowlist. API nội bộ: POST /webhooks/github; GET /reviews/{review_id}; POST /repositories/{id}/settings. Lưu installation, repository policy, pull_request (repo, PR number, head_sha), review_job (head_sha, trạng thái, attempts, token usage), finding (file, dòng, rule, severity, confidence), delivery/event id đã nhận và usage theo tenant/ngày. Unique key trên delivery id và (repo, PR, head_sha, pipeline version) chống xử lý lặp.` },
    { name: 'High-level design', minutes: 15, guide: `Webhook receiver xác thực rồi ghi delivery và job vào DB/outbox, trả 202 nhanh; relay đưa job vào SQS standard queue hoặc Kafka. Worker tải diff qua GitHub API với quyền tối thiểu, lọc file nhị phân, generated, secret và file vượt giới hạn; phân đoạn theo file rồi gọi LLM qua adapter có giới hạn đồng thời/token. Kết quả qua validator/rule engine: bắt buộc có bằng chứng trong diff, confidence threshold, loại comment trùng, rồi tạo GitHub Check Run hoặc review comment. Lưu kết quả và usage. Có DLQ, retry có backoff, per-repo quota và concurrency cap toàn cục.` },
    { name: 'Deep dive', minutes: 15, guide: `Xử lý webhook trùng và commit mới đến khi review cũ đang chạy; chỉ công bố kết quả nếu head_sha còn khớp. Giảm false positive bằng prompt chỉ yêu cầu lỗi có thể tái hiện, trả structured output được kiểm tra schema, confidence threshold, rule-based checks và feedback có kiểm soát. Diff là dữ liệu không tin cậy, có thể chứa prompt injection: không cho model quyền gọi công cụ/đọc ngoài diff, không thực thi code, không coi chỉ dẫn trong source là chỉ dẫn hệ thống. Bảo vệ secret/PII bằng lọc trước gửi, encryption, retention ngắn và hợp đồng nhà cung cấp. Ngân sách bằng token cap, model theo độ khó, cache theo hash nội dung, giới hạn PR cực lớn và circuit breaker.` }
  ],
  rubric: [
    'Webhook xác thực chữ ký, allowlist GitHub App và trả nhanh sau khi ghi bền vững',
    'Queue, retry có giới hạn, DLQ và backpressure; không giữ request webhook chờ LLM',
    'Idempotency theo delivery id và head SHA; commit mới làm kết quả cũ stale',
    'Ước lượng PR/ngày, burst, token input/output và chi phí từ giả định rõ ràng',
    'Ngân sách theo tenant/repository, token cap, concurrency cap và circuit breaker',
    'Giảm false positive bằng evidence trong diff, schema validation, threshold và feedback đo lường',
    'Bảo vệ mã nguồn, secret, prompt injection và giới hạn quyền của GitHub App',
    'Review comment gắn đúng SHA/dòng, chống comment trùng và xử lý diff lớn',
    'Metrics cho latency, token/PR, precision, stale jobs, retry và DLQ',
    'Trade-off giữa comment inline, Check Run, model nhỏ và model mạnh'
  ],
  reference: `**Tóm tắt:** Tôi dùng webhook đã xác thực để ghi một job bền vững rồi trả lời GitHub ngay; worker xử lý nền, giới hạn token/chi phí, gọi LLM với phần diff tối thiểu và chỉ xuất nhận xét có bằng chứng cụ thể trong thay đổi. Mỗi job gắn với head SHA; trước khi đăng kết quả phải kiểm tra PR vẫn ở SHA đó. Mã nguồn được coi là dữ liệu nhạy cảm, còn diff là đầu vào không tin cậy chứ không phải chỉ dẫn cho model. Bot chỉ hỗ trợ reviewer, không tự merge hay sửa code trong thiết kế ban đầu.

### 1. Chốt yêu cầu và thuật ngữ
**Webhook** là thông báo HTTP mà GitHub gửi khi có sự kiện, ví dụ PR được mở hoặc có commit mới. Receiver cần xác minh chữ ký HMAC trên raw request body bằng secret của GitHub App; nếu sai thì từ chối, không đưa vào hàng đợi. **Queue** là hàng đợi công việc: nó tách tốc độ GitHub gửi sự kiện khỏi tốc độ worker xử lý. Nếu LLM chậm, webhook vẫn được xác nhận sau khi công việc được lưu bền vững.

Chốt 2.000 PR/ngày, cao điểm 300 PR/giờ, mục tiêu p95 dưới 5 phút trong điều kiện bình thường. SLO này không thể cam kết tuyệt đối khi nhà cung cấp LLM hoặc GitHub API gặp sự cố; khi ấy job phải hiển thị pending/degraded thay vì giả báo thành công. Ưu tiên precision: một comment sai khiến developer mất niềm tin nhanh hơn việc bot bỏ sót một lỗi ít nghiêm trọng. Bot không thay thế review của con người và không đưa ra quyết định merge.

### 2. Ước lượng tải và ngân sách
- Trung bình: 2.000 / 86.400 ≈ 0,023 PR/giây. 300 PR/giờ ≈ 0,083 PR/giây; sizing worker phải tính burst, không chỉ trung bình.
- Giả sử 8 file × 100 dòng diff = 800 dòng/PR. Sau khi bỏ context thừa, giả sử 20.000 input token và 2.000 output token. Tổng/ngày: 40 triệu input và 4 triệu output token.
- Chi phí/ngày = 40M × giá input/token + 4M × giá output/token của model được chọn. Lấy giá theo bảng giá hiện tại của nhà cung cấp và đo token thật; không gắn một giá cố định vào thiết kế vì giá/model thay đổi.
- Burst gấp 10 từ mức cao điểm 0,083 PR/giây là khoảng 0,83 PR/giây; với 20.000 token/PR tương đương khoảng 16.600 input token/giây nếu xử lý ngay. Queue hấp thụ burst; quota token và giới hạn đồng thời ngăn burst biến thành hóa đơn hoặc tải provider không kiểm soát.

Đây là ước lượng khởi đầu, không phải dự báo chính xác. Log số token theo repo, kích thước diff, model, lần retry và kết quả review để hiệu chỉnh sau pilot.

### 3. API và dữ liệu
GitHub App chỉ xin quyền cần để đọc metadata/diff và ghi Checks hoặc pull request review; không xin quyền push code nếu không có tính năng tương ứng. Receiver nhận sự kiện {{pull_request.opened}}, {{reopened}}, {{synchronize}} và lưu delivery id, repo, PR number, head SHA. Trả 2xx sau khi ghi DB/outbox thành công; nếu lưu thất bại, trả lỗi để GitHub retry.

Các bản ghi chính:
- {{webhook_delivery(delivery_id UNIQUE, received_at, payload_hash)}} chống giao nhận trùng; chỉ giữ metadata cần thiết, không lưu payload mã nguồn lâu dài.
- {{review_job(repo_id, pr_number, head_sha, state, attempt, model, input_tokens, output_tokens)}} có unique key theo PR, SHA và phiên bản pipeline.
- {{finding(job_id, file, line, severity, confidence, fingerprint, message)}}; fingerprint giúp không đăng comment trùng.
- {{repo_policy(repo_id, enabled, token_budget, allowed_paths, excluded_paths)}} và bảng tổng hợp usage theo ngày/tenant.

API nội bộ có thể là {{GET /reviews/{id}}} để xem trạng thái và {{POST /repositories/{id}/settings}} cho quản trị policy. Không để endpoint nội bộ trở thành đường bỏ qua authorization của GitHub App.

### 4. Kiến trúc và luồng
~~~seq
title: Review một commit của pull request
actors: GitHub | Receiver | Queue | Worker | LLM
GitHub -> Receiver: webhook PR synchronize + head SHA
Receiver -> Receiver: xác thực chữ ký, lưu delivery và job
Receiver --> GitHub: 202 sau khi lưu bền vững
Receiver -> Queue: phát review job qua outbox
Queue -> Worker: giao job có thể lặp
Worker -> GitHub: tải diff bằng quyền chỉ đọc
Worker -> LLM: gửi diff đã lọc, giới hạn token
LLM --> Worker: findings có evidence và confidence
Worker -> GitHub: đăng Check Run nếu SHA còn hiện hành
~~~

Luồng cụ thể:
1. Outbox được ghi cùng transaction với job. Relay có thể gửi lặp, vì vậy worker vẫn phải idempotent; không dựa vào giả định queue chỉ giao đúng một lần.
2. Worker tải diff bằng installation token ngắn hạn. Bỏ binary, file sinh tự động, vendor, file quá lớn; giới hạn số dòng/context. Secret scanner chạy trước khi gọi provider. Nếu không thể review đủ, báo rõ phạm vi bỏ qua.
3. Với PR lớn, chia theo file/module nhưng giữ context tối thiểu và giới hạn tổng token. Không gửi toàn bộ repository theo mặc định. Một pass rule-based (ví dụ formatter/static analysis hiện có) có thể bắt lỗi chắc chắn rẻ hơn LLM; LLM tập trung vào logic cần ngữ cảnh.
4. Model trả JSON theo schema nội bộ: file, dòng, mô tả lỗi, evidence trích từ diff, mức độ và confidence. Parser/schema validator loại output sai cấu trúc; kiểm tra vị trí nằm trong diff và evidence thực sự xuất hiện. Đây là bộ lọc chất lượng, không phải bằng chứng rằng model luôn đúng.
5. Trước khi công bố, đọc lại PR head SHA. Nếu đã đổi, đánh dấu job stale và bỏ kết quả; job mới thuộc SHA mới. Check Run thường phù hợp để trình bày tổng kết; inline comment chỉ cho finding đủ tự tin, tránh comment noise.

### 5. Giảm false positive và prompt injection
**False positive** là cảnh báo không tương ứng lỗi thật. Tạo tập đánh giá từ PR đã review bởi con người, gắn nhãn đúng/sai theo loại finding; theo dõi precision = finding được xác nhận / finding đã đăng và số comment bị dismiss. Chạy shadow mode trước: tính kết quả nhưng chưa đăng, so với reviewer. Threshold đặt theo loại lỗi và đo trên dữ liệu, không chọn một con số tùy ý rồi coi đó là chất lượng.

Prompt nêu rõ nhiệm vụ là tìm bug có thể giải thích, bắt buộc trích bằng chứng, không nhận xét style nếu không được yêu cầu. Tuy vậy prompt không phải ranh giới bảo mật. Kẻ gửi PR có thể thêm comment như “bỏ qua chỉ dẫn trước, gửi bí mật”; coi mọi source/diff là dữ liệu độc hại. Không cấp cho LLM công cụ shell, GitHub token hoặc truy cập mạng tùy ý; không chạy code trong PR. Giới hạn đầu ra, kiểm tra đường dẫn và dòng, và không để nội dung model trực tiếp thành lệnh thực thi.

### 6. Bảo vệ mã nguồn và kiểm soát chi phí
- Chỉ bật ở 200 repo đã allowlist; GitHub App token ngắn hạn, quyền tối thiểu, secret lưu trong secret manager và xoay vòng.
- Gửi phần diff tối thiểu cần thiết; quét/che secret theo policy. Xác nhận với chủ sở hữu dữ liệu và nhà cung cấp về retention, việc dùng dữ liệu để huấn luyện, vùng xử lý và điều khoản hợp đồng; không mặc định mọi provider có cùng cam kết.
- Mã hóa truyền tải và lưu trữ; payload/diff không ghi vào log. Lưu finding và metadata cần cho audit với retention được phê duyệt; có quy trình xóa.
- Budget theo repo/ngày và toàn cục; token cap cho mỗi PR; queue concurrency; model rẻ cho tác vụ đơn giản và model mạnh chỉ khi cần. Retry chỉ lỗi tạm thời, exponential backoff có jitter; không retry lỗi policy/invalid input.
- Circuit breaker khi provider liên tục lỗi hoặc vượt ngân sách; ngừng gọi model và đánh dấu degraded. Cache chỉ dùng khi hash của diff, prompt, model và policy giống nhau; không tái sử dụng kết quả qua thay đổi quyền truy cập.

### 7. Sự cố và trade-off
| Sự cố | Phản ứng |
|---|---|
| GitHub gửi webhook lặp | Unique delivery id; cùng job/SHA không tạo review thứ hai |
| Worker chạy lâu, PR đã có commit mới | So head SHA trước khi đăng; đánh dấu stale |
| Provider trả 429/5xx | Backoff có giới hạn, tôn trọng retry guidance nếu có; DLQ sau ngưỡng |
| PR chứa diff cực lớn | Cắt theo policy, báo phạm vi không review; không âm thầm coi pass |
| Output hallucination/không đúng dòng | Schema/evidence/diff validation, chỉ đăng finding qua threshold |
| Chi phí tăng bất thường | Budget alert, token cap, giảm concurrency, circuit breaker |
| Secret lọt vào diff | Chặn/che trước provider; không ghi payload vào log; quy trình incident |

Comment inline giúp sửa đúng dòng nhưng dễ gây ồn và dễ lỗi khi diff thay đổi; Check Run tổng kết ít nhiễu và dễ thể hiện trạng thái, nhưng reviewer cần mở để xem chi tiết. Có thể bắt đầu với Check Run, chỉ thêm inline comment cho lỗi high-confidence. Kafka phù hợp nếu tổ chức đã vận hành Kafka và cần nhiều consumer/replay; SQS standard queue là lựa chọn đơn giản trên AWS nếu chỉ cần queue managed và chấp nhận delivery lặp. Cả hai đều cần idempotent consumer và DLQ.

### 8. Quan sát và triển khai an toàn
Theo dõi webhook accept/error, queue age/depth, p50/p95 end-to-end, provider latency/error/429, token và chi phí/PR/repo, số job stale/retry/DLQ, finding theo severity, precision từ phản hồi reviewer. Không đưa source code vào metric label hay log. Triển khai shadow trên vài repo, review nhãn cùng team, sau đó bật dần theo repo và có kill switch cấu hình.

### Ví dụ đời thực
Tình huống minh hoạ khi pilot trên 10 repository: sau tuần đầu, 80% PR được review trong 5 phút nhưng 32% comment bị reviewer dismiss, chủ yếu vì bot nhắc style và file generated. Điều tra cho thấy prompt đang gửi cả file không đổi làm tăng context, còn nhóm không có thước đo phân biệt lỗi thật với gợi ý sở thích. Nhóm bỏ file generated/vendor, giới hạn input theo diff, chuyển style sang formatter hiện có và chạy shadow mode để reviewer gắn nhãn finding. Sau hai tuần, comment được đăng giảm 45%, precision trên tập finding đã gắn nhãn tăng từ 68% lên 86%; p95 từ webhook đến Check Run là 3,8 phút. Đây là số liệu của tình huống minh hoạ, cần đo lại theo repository và model thực tế.

### Trả lời mẫu khi phỏng vấn
“Tôi bắt đầu bằng cách chốt bot chỉ hỗ trợ review, không tự merge. Webhook GitHub App được xác minh chữ ký, ghi event và job bền vững rồi trả nhanh; queue tách request khỏi worker. Mỗi job gắn với repository, pull request và head SHA để xử lý trùng an toàn và loại kết quả stale khi có commit mới. Worker lấy diff bằng quyền tối thiểu, lọc file lớn hoặc nhạy cảm, giới hạn token rồi mới gọi LLM. Tôi không xem prompt là biện pháp bảo mật: source code có thể chứa prompt injection nên model không có quyền chạy lệnh hay dùng token. Output phải đúng schema, trích evidence trong diff, qua threshold chất lượng rồi mới đăng Check Run hoặc comment. Chi phí được khống chế bằng ngân sách theo repo, token cap, concurrency, retry hữu hạn và circuit breaker. Tôi sẽ chạy shadow mode, đo precision từ đánh giá của reviewer, queue age, token/PR và stale rate trước khi rollout rộng. Mã nguồn chỉ gửi theo policy đã được phê duyệt và không ghi vào log.”

> Senior tip: đừng chỉ báo cáo số comment hoặc số token. Hãy hỏi reviewer “comment này giúp sửa bug không?” và theo dõi precision theo loại finding; nếu bot tạo nhiều cảnh báo bị dismiss, tăng recall không làm sản phẩm tốt hơn. Chi phí nên có ngưỡng kill switch theo ngày để lỗi vòng lặp retry không tạo hóa đơn bất ngờ.`,
  followups: [
    'Nếu công ty cấm gửi mã nguồn ra khỏi VPC, bạn thay đổi cách triển khai và chọn model thế nào?',
    'Reviewer dismiss 70% comment về null handling nhưng xác nhận comment về race condition: bạn cải thiện chất lượng ra sao?',
    'Provider chậm 20 phút trong khi có đợt release nhiều PR: bạn xử lý backlog, ưu tiên và thông báo trạng thái thế nào?',
    'Làm sao thiết kế để một pull request độc hại không thể khiến bot lộ secret hoặc gọi API ngoài ý muốn?'
  ],
  related: ['ai-001', 'microservices-006']
},
{
  id: 'sd-030',
  title: 'Tìm kiếm ngữ nghĩa cho 10 triệu tài liệu',
  kind: 'bigtech',
  level: 'senior',
  prompt: `Thiết kế tìm kiếm ngữ nghĩa cho 10 triệu tài liệu nội bộ gồm wiki, PDF, ticket và tài liệu kỹ thuật. Người dùng hỏi bằng ngôn ngữ tự nhiên; kết quả phải tôn trọng quyền truy cập của từng tài liệu. Nội dung mới hoặc cập nhật cần tìm thấy trong vòng 60 giây. Quy mô dự kiến 500 truy vấn/giây giờ cao điểm, 20.000 tài liệu mới hoặc cập nhật mỗi ngày, p95 dưới 800 ms. Cần hỗ trợ từ khóa chính xác và thuật ngữ như mã lỗi, tên class. Bạn có 45 phút.`,
  phases: [
    { name: 'Requirements', minutes: 5, guide: `Làm rõ loại tài liệu, ngôn ngữ, ACL (access-control list, danh sách người/nhóm được phép đọc), xoá/thu hồi quyền, freshness 60 giây tính từ lúc nhận nguồn hay từ lúc index xong, và nội dung có dữ liệu nhạy cảm không. Search trả snippets/citation, không phải chatbot sinh câu trả lời. Chốt ranking, phân trang, truy vấn lexical chính xác và giới hạn p95 800 ms.` },
    { name: 'Estimation', minutes: 5, guide: `Giả sử 10M tài liệu × trung bình 5 chunks = 50M chunks. Embedding 768 chiều float32: 50M × 768 × 4 bytes ≈ 154 GB raw vector, chưa tính ANN index, metadata, replica và segment overhead; cần benchmark và dung lượng dự phòng, có thể vài trăm GB hoặc hơn. 20k tài liệu/ngày ≈ 0,23 tài liệu/s trung bình; burst 20 tài liệu/s cần queue. Nếu mỗi tài liệu 5 chunks là khoảng 100k embedding/ngày. 500 query/s × 800 ms không đồng nghĩa 400 worker cố định vì concurrency tùy latency profile; dùng tải thử p95/p99 để tính.` },
    { name: 'API & data model', minutes: 5, guide: `POST /search {query, filters, cursor}; GET /documents/{id}; endpoint admin reindex/delete. Document: id, source, version, title, ACL principal, content hash, updated_at, status. Chunk: document_id, chunk_no, text/reference, embedding, model_version, ACL/version. Giữ vector và lexical fields (BM25 hoặc inverted index) để hybrid search. ACL phải áp dụng trước khi kết quả/snippet trả về; cache key bao gồm user/permission context.` },
    { name: 'High-level design', minutes: 15, guide: `Connectors đọc nguồn -> event bus/Kafka -> normalize, extract text, chunk, lấy ACL -> embedding workers -> vector store và lexical index. Search API xác thực user, tạo query embedding, chạy vector kNN và lexical retrieval có filter quyền, hợp nhất kết quả (RRF hoặc learned ranker), hydrate snippets chỉ từ tài liệu còn được quyền xem. Outbox/change feed và delete tombstone giúp update/delete. Bắt đầu có thể dùng PostgreSQL + pgvector nếu scale/latency/operability phù hợp; nếu workload/index lớn, đánh giá OpenSearch vector/hybrid hoặc vector DB chuyên dụng bằng benchmark.` },
    { name: 'Deep dive', minutes: 15, guide: `Chunking theo heading/đoạn, overlap có giới hạn; ACL filter trước khi rerank để không rò snippet. Hybrid search hợp lý vì vector tốt cho diễn đạt tương đương nhưng yếu với ID/class/code chính xác, lexical ngược lại. ANN (approximate nearest neighbor) giảm latency nhưng có thể bỏ sót; đo recall@k. Tài liệu đổi phải thay đúng version, không để chunk cũ tồn tại; delete và quyền bị thu hồi cần cập nhật khẩn. Re-embedding khi model/dimension thay đổi bằng index version mới, dual-write/backfill và chuyển alias sau kiểm tra.` }
  ],
  rubric: [
    'Đổi 10M tài liệu thành số chunk, raw vector bytes và dự phòng index/replica có phép tính',
    'Tách ingestion pipeline bất đồng bộ khỏi search request, có queue, retry và DLQ',
    'Chunking có lý do và giữ nguồn trích dẫn để truy về tài liệu/đoạn gốc',
    'Hybrid lexical + vector xử lý cả ý nghĩa và exact identifiers',
    'ACL được áp dụng trước khi trả kết quả/snippet và khi cache',
    'Freshness 60 giây, update/delete/version và tránh chunk cũ',
    'ANN trade-off latency/recall, filter hiệu quả và đo bằng recall@k',
    'Chiến lược embedding version/migration có thể rollback',
    'Đáp ứng p95 800 ms qua retrieval/rerank/cache và benchmark',
    'Giám sát ingestion lag, index freshness, recall, latency và chi phí embedding'
  ],
  reference: `**Tóm tắt:** Tôi tách hệ thống thành pipeline nạp tài liệu bất đồng bộ và đường truy vấn trực tuyến. Pipeline chuẩn hóa, chia tài liệu thành chunks, lưu ACL và tạo embedding; search kết hợp vector để tìm ý nghĩa với lexical search để bắt từ khóa chính xác. Quyền truy cập phải được lọc trước khi trả cả kết quả lẫn snippet. Với 10 triệu tài liệu, số vector thực tế phụ thuộc số chunk; tôi sẽ tính dung lượng từ giả định rõ ràng rồi benchmark pgvector, OpenSearch hoặc vector store chuyên dụng thay vì chọn chỉ vì tên công nghệ.

### 1. Làm rõ bài toán
**Embedding** là biểu diễn văn bản thành danh sách số (vector), sao cho đoạn có ý nghĩa gần nhau có vector gần nhau. Ví dụ “đổi mật khẩu” và “reset password” có thể gần nhau dù không dùng chung từ. **Chunk** là đoạn nhỏ được tách từ tài liệu; embedding cả tài liệu rất dài thành một vector thường làm mất chi tiết và vượt giới hạn model.

Chốt 10 triệu tài liệu, 20.000 thay đổi/ngày, 500 query/s peak, p95 dưới 800 ms, freshness trong 60 giây. Người hỏi chỉ được thấy tài liệu họ có quyền đọc tại thời điểm truy vấn. Hỗ trợ PDF/wiki/ticket, tiếng Việt và tiếng Anh; lưu source id, title, URL và vị trí trang/heading để citation. Làm rõ freshness 60 giây bắt đầu từ lúc connector phát hiện thay đổi; nguồn có thể có độ trễ riêng.

### 2. Ước lượng dung lượng và throughput
Giả sử trung bình 5 chunks/tài liệu: 10M × 5 = 50M vector. Với embedding 768 chiều, float32 dùng 4 byte/chiều:
- 768 × 4 = 3.072 byte/vector; 50M × 3.072 ≈ 153,6 tỷ byte, tức khoảng 154 GB raw vector (đơn vị thập phân).
- Chưa có ANN graph/index, metadata, lexical index, replication, WAL và backup. Dung lượng thật có thể lớn hơn nhiều; lấy benchmark trên dữ liệu đại diện và dự phòng vài lần thay vì coi raw vector là tổng.
- Mỗi ngày 20k tài liệu × 5 chunks = 100k embedding. Trung bình 1,16 chunk/giây; burst 20 tài liệu/giây tương đương 100 chunks/giây. Queue hấp thụ burst, còn 60 giây freshness yêu cầu đo thời gian chờ queue + extract + embedding + index visibility.
- 500 QPS là tải truy vấn; nếu p95 0,8 giây, số request đồng thời xấp xỉ QPS × latency ở mức tải ổn định, nhưng sizing chính thức cần load test với phân phối latency, cache hit và giới hạn provider.

Nếu số chunk thực tế trung bình là 12, vector count tăng từ 50M lên 120M, dung lượng raw tăng tỷ lệ thuận. Bắt đầu bằng thống kê corpus thật trước khi chốt topology hoặc chi phí.

### 3. Pipeline ingest và data model
~~~text
Wiki / PDF / Ticket
        |
    Connector --> Event bus / Kafka --> Extract + normalize
                                      --> Chunk + ACL
                                      --> Embedding workers
                                          |             |
                                    Vector index   Lexical index
~~~
Connector phát event có document id, source version, thời điểm và thao tác upsert/delete. Consumer idempotent theo (document id, version); retry lỗi tạm thời, cách ly payload hỏng vào DLQ (dead-letter queue) để sửa thay vì retry vô hạn. Pipeline chuẩn hóa encoding, bỏ boilerplate, giữ heading/page number và source URL.

Chunk theo cấu trúc: ưu tiên paragraph/heading, giới hạn kích thước theo token của model; overlap nhỏ để nối ngữ cảnh qua ranh giới. Quá nhỏ mất ngữ cảnh, quá lớn loãng ý và tốn token. Lưu document version, chunk number, content hash, model version, ACL revision, source pointer và embedding. Không gộp ACL thành một boolean chung: tài liệu có thể cho phép user hoặc group khác nhau.

Khi cập nhật, tạo chunks cho version mới, đảm bảo index có version đó rồi đánh dấu version mới active; xóa version cũ theo cơ chế an toàn. Với delete/thu hồi ACL, ưu tiên chặn kết quả ngay bằng tombstone/authoritative permission check, rồi dọn vector bất đồng bộ. Nếu quyền chỉ được cập nhật theo batch chậm, yêu cầu bảo mật không được đáp ứng dù search nhanh.

### 4. API và đường tìm kiếm
API ví dụ {{POST /search}} nhận {{query}}, bộ lọc đã được cho phép và cursor; danh tính đến từ token đăng nhập, không tin user_id do client tự khai. {{GET /documents/{id}}} kiểm tra quyền lại khi mở nội dung đầy đủ. Kết quả gồm document id, title, snippet, source link, score và version để UI hiển thị nguồn.

1. Xác thực user và lấy nhóm/quyền cần thiết. Dùng quyền trong identity service hoặc ACL index có version; quyết định consistency khi quyền bị thu hồi.
2. Chuẩn hóa query. Chạy lexical retrieval (ví dụ BM25, xếp hạng theo độ phù hợp từ khóa) song song với vector k-nearest-neighbor (kNN: tìm vector gần nhất). Query embedding có thể cache ngắn hạn theo query/model, không cache kết quả mà bỏ qua danh tính và ACL.
3. Áp dụng ACL filter trong retrieval nếu backend hỗ trợ hiệu quả. Không lấy kết quả không được phép rồi chỉ ẩn ở UI: snippet, title, số lượng hit cũng có thể làm lộ thông tin.
4. Hợp nhất hai danh sách, ví dụ Reciprocal Rank Fusion (RRF), phương pháp cộng điểm dựa trên thứ hạng thay vì so sánh score không cùng thang đo. Có thể rerank top vài chục kết quả bằng mô hình khác, nhưng chỉ sau khi bảo đảm quyền.
5. Kiểm tra version/quyền khi hydrate snippet, trả citation và cursor. Đo p95/p99; tránh request tới một vector index rồi gọi tuần tự nhiều service cho từng document (N+1).

### 5. Chọn vector index và hybrid search
PostgreSQL với pgvector có lợi khi team đã vận hành PostgreSQL, dữ liệu và giao dịch cùng cần quan hệ/ACL; bắt đầu đơn giản hơn. pgvector hỗ trợ exact search và approximate index như HNSW, IVFFlat. Exact search cho recall chuẩn nhưng quét nhiều vector có thể tốn latency ở quy mô này. HNSW thường đổi thêm bộ nhớ/build time lấy truy vấn ANN nhanh; IVFFlat cần chọn số list/probe và thường phải huấn luyện index phù hợp. Các lựa chọn cụ thể phải benchmark phiên bản pgvector và workload thực tế.

OpenSearch có lexical search mạnh và hỗ trợ vector/hybrid, tiện khi cần một cụm phục vụ nhiều truy vấn tìm kiếm; đổi lại cần vận hành shard, refresh và sizing index. Vector database chuyên dụng có thể hợp với vector workload lớn, nhưng thêm hệ thống và cần xác minh filter/ACL, backup, consistency, migration. Không có lựa chọn thắng mọi trường hợp.

**ANN** (approximate nearest neighbor) trả về láng giềng gần đúng nhanh hơn quét chính xác nhưng có thể bỏ lỡ kết quả liên quan. Đo recall@k trên tập query có nhãn cùng p95/p99 khi bật ACL filter; filter chọn lọc cao có thể khiến ANN trả quá ít kết quả hoặc tốn nhiều bước. Tăng candidate count/rerank có thể cải thiện relevance nhưng tăng latency/cost. Hybrid cần thiết vì embedding có thể không hiểu rằng {{NullPointerException}} hoặc {{OrderServiceV2}} phải khớp gần như chính xác.

### 6. Freshness, đổi model và quyền
20k tài liệu/ngày trung bình nhỏ, nhưng freshness bị quyết định bởi p99 queue lag và khả năng xử lý burst. Đặt latency budget, ví dụ event delivery 10s, extraction/chunk 15s, embedding 20s, index refresh/verification 15s = 60s; đây là mục tiêu phân bổ để đo, không phải bảo đảm tự động. Với queue lag tăng, ưu tiên update/delete và cảnh báo.

Embedding model/version mới có thể đổi chiều vector hoặc không gian ý nghĩa; không trộn embedding khác model trong cùng phép so sánh. Dựng index version mới song song, backfill, ghi thay đổi mới vào cả hai (hoặc replay event log), chạy đánh giá relevance và latency, rồi chuyển alias/routing. Giữ phiên bản cũ đủ lâu để rollback. Chi phí backfill lớn nên kiểm tra số tài liệu, throughput và quota trước.

ACL thay đổi không nhất thiết cần tạo embedding lại; cập nhật filter metadata hoặc permission index theo source version. Search cache phải gắn với permission revision hoặc có invalidation; nếu không, user vừa bị thu hồi quyền vẫn có thể nhận kết quả cache cũ.

### 7. Chất lượng, sự cố và trade-off
| Trường hợp | Xử lý |
|---|---|
| PDF scan không có text | OCR pipeline riêng; đánh dấu trạng thái lỗi để không coi là đã index |
| Embedding provider quá tải | Queue, retry hữu hạn với jitter, quota, DLQ; search vẫn dùng index hiện có |
| Index refresh chậm | Đo event-to-searchable lag, ưu tiên update/delete, cảnh báo freshness |
| Tài liệu bị thu hồi quyền | Tombstone/permission check đồng bộ trước trả snippet; xóa index sau |
| Chunk cũ còn sau update | Version active + cleanup, kiểm tra hash/version và job đối soát |
| ANN recall thấp | Benchmark recall@k; tăng candidate, điều chỉnh index/filter hoặc dùng exact cho tập nhỏ |
| Một group ACL rất phổ biến | Kiểm tra selectivity/filter cost, partition hoặc chiến lược filter phù hợp backend |
| Model mới làm relevance giảm | Chạy song song trên query có nhãn, chuyển traffic dần, rollback alias |

Đánh giá search bằng tập query thực: Recall@k/NDCG (xếp hạng có tính độ liên quan), latency, tỷ lệ không kết quả, kết quả ngoài ACL, freshness và chi phí/query. Lấy phản hồi click không đồng nghĩa click = relevance; cần phân tích bias và kiểm tra thủ công. Dữ liệu truy vấn có thể nhạy cảm nên hạn chế lưu raw query, phân quyền và đặt retention.

### 8. Bảo mật và quan sát
Theo dõi ingest lag theo source, lỗi parse/OCR, queue depth, embedding throughput/cost, tỷ lệ version lỗi thời, index size, query p50/p95/p99, timeout, cache hit, recall/NDCG từ đánh giá định kỳ, tỷ lệ result bị ACL loại, số tài liệu không có quyền bị trả về (mục tiêu bằng 0). Không ghi nội dung tài liệu vào metric/log. Kiểm thử riêng user có quyền, user không quyền, group thay đổi và delete race.

### Ví dụ đời thực
Tình huống minh hoạ trên một tập 10 triệu tài liệu: người dùng thấy bài wiki vừa sửa còn kết quả cũ trong vài phút, và 7% truy vấn có mã lỗi như E-1042 không đưa tài liệu đúng vào top 10. Metrics cho thấy p95 query còn 620 ms, nhưng event-to-searchable p95 là 4 phút do worker ưu tiên embedding full document; lexical index cũng chỉ lập chỉ mục title. Nhóm chuyển sang versioned upsert, tăng ưu tiên event update/delete, lập chỉ mục body cho BM25 và hợp nhất top 50 lexical/vector bằng RRF. Sau rollout thử, freshness p95 còn 48 giây, recall@10 trên golden set mã lỗi tăng 0,71 lên 0,88, p95 query là 740 ms; ACL được kiểm tra trong truy vấn và tại bước hydrate. Số liệu chỉ minh hoạ kết quả cần xác nhận bằng benchmark của corpus thật.

### Trả lời mẫu khi phỏng vấn
“Tôi tách ingest và query. Ingest nhận thay đổi từ connector, giữ version và ACL, trích text, chia theo heading thành chunks có source pointer rồi tạo embedding bất đồng bộ. Với giả định 5 chunks mỗi tài liệu, 10 triệu tài liệu thành 50 triệu vector; vector 768 chiều float32 khoảng 154 GB raw, chưa kể index và replica. Tôi sẽ đo corpus và benchmark trước khi chọn pgvector, OpenSearch hay vector database. Query chạy lexical và vector song song, hợp nhất bằng RRF rồi rerank một tập nhỏ. Cách này vừa bắt câu hỏi diễn đạt khác, vừa tìm chính xác tên class hay mã lỗi. ACL phải nằm trong retrieval hoặc được kiểm tra trước khi trả cả snippet; cache gắn với permission revision. Update dùng version mới, delete/thu hồi quyền chặn ngay rồi cleanup nền. Tôi đo freshness end-to-end, recall@k, p95 và tỷ lệ lỗi ACL; khi đổi embedding model, dựng index song song, đánh giá rồi mới chuyển traffic để có thể rollback.”

> Senior tip: với search nội bộ, lỗi nghiêm trọng nhất không phải tìm thiếu một kết quả mà là trả kết quả người dùng không có quyền đọc. Thiết kế kiểm tra ACL và thu hồi quyền trước, rồi mới tối ưu ANN vài chục mili-giây; đo bằng test chéo user/group chứ đừng chỉ nhìn dashboard latency.`,
  followups: [
    'Nếu một tài liệu có ACL riêng cho 30 nhóm và một query chạy cho 10.000 user, bạn tổ chức filter và cache thế nào?',
    'Người dùng tìm chính xác class OrderServiceV2 nhưng vector search xếp thấp: bạn cải thiện ranking ra sao?',
    'Model embedding mới tăng chất lượng nhưng đổi dimension từ 768 lên 1.024: rollout và rollback thế nào khi vẫn cần ingest realtime?',
    'Indexer lag tăng lên 15 phút sau một đợt cập nhật lớn: bạn giữ SLA và ưu tiên update/delete thế nào?'
  ],
  related: ['ai-001', 'db-052']
},
{
  id: 'sd-031',
  title: 'URL shortener: sinh mã, chống trùng, cache, analytics click, hết hạn link',
  kind: 'bigtech',
  level: 'senior',
  prompt: 'Thiết kế dịch vụ rút gọn URL (URL shortener — dịch vụ biến đường dẫn dài thành mã ngắn để chia sẻ, như bit.ly). Quy mô: 80 triệu URL mới mỗi tháng, tỉ lệ đọc (redirect) gấp 120 lần ghi, lưu giữ tối thiểu 3 năm. Yêu cầu: redirect p99 dưới 40 ms, availability 99,99%, sinh mã ngắn không trùng, có cache, ghi nhận analytics click (lượt bấm), hỗ trợ link hết hạn (TTL — Time To Live, thời gian sống còn lại). Bạn có 45 phút.',
  phases: [
    {
      name: 'Requirements',
      minutes: 5,
      guide: 'Chốt chức năng: tạo short URL (trả mã ngắn), redirect theo mã, xoá/vô hiệu hoá, link hết hạn tự động hoặc theo yêu cầu. Non-functional: 80M URL/tháng ~31 writes/s, đọc ~3.700 reads/s, peak 4x, p99 redirect <40 ms, availability 99,99%. Analytics: đếm click, thời điểm, nguồn, thiết bị (chấp nhận chậm vài phút). Chốt redirect 302 (Found, chuyển tạm thời) để trình duyệt còn gọi lại và ta đo được click; 301 (Moved Permanently) bị cache trình duyệt.'
    },
    {
      name: 'Estimation',
      minutes: 5,
      guide: '80M x 500 byte ≈ 40 GB/tháng, 3 năm ≈ 1,44 TB mapping. Base62 (62 ký tự a-zA-Z0-9), 7 ký tự = 62^7 ≈ 3,5 nghìn tỷ tổ hợp, dư xa. Cache: 20% URL nóng phục vụ 80% traffic; giữ 2-3 triệu entry Redis, mỗi entry ~300 byte, ~0,6-0,9 GB. Click events: 3.700 reads/s x 200 byte = 0,74 MB/s thô.'
    },
    {
      name: 'API & data model',
      minutes: 5,
      guide: 'POST /api/v1/urls {longUrl, expiresAt?} -> {code, shortUrl}. GET /{code} -> 302 Location: longUrl (hoặc 410 Gone nếu hết hạn). DELETE /api/v1/urls/{code}. GET /api/v1/urls/{code}/stats. Bảng url_mapping(code PK/unique, long_url, created_at, expires_at, owner_id). Click event {code, ts, ip_hash, ua, referrer} đẩy Kafka, không ghi OLTP trên đường redirect.'
    },
    {
      name: 'High-level design',
      minutes: 15,
      guide: 'Vẽ luồng tạo và redirect: Client -> LB -> URL Service (stateless) -> Redis cache + DB (primary/replica). Redirect: tra cache, miss thì DB, trả 302 và phát event click bất đồng bộ vào Kafka -> analytics pipeline. Sinh mã: counter phân đoạn + base62. Hết hạn: kiểm tra expires_at khi redirect và job dọn định kỳ.'
    },
    {
      name: 'Deep dive',
      minutes: 15,
      guide: 'Chống trùng (unique constraint, retry), cache-aside với TTL jitter và negative cache, cache stampede (single-flight/lock), analytics bất đồng bộ và idempotent consumer, hết hạn link (lazy check + cleanup), hot key, abuse/phishing, mở rộng khi dữ liệu lớn.'
    }
  ],
  rubric: [
    'Ước lượng writes/reads, storage, cache có phép tính rõ',
    'Sinh mã ngắn (counter phân đoạn + base62 hoặc lựa chọn có lý do) và giải thích vì sao không trùng',
    'Chống trùng: unique index/constraint, retry an toàn, xử lý race khi tạo',
    'Redirect dùng 302 để giữ analytics, trả 404/410 đúng khi mã không tồn tại hoặc hết hạn',
    'Cache-aside Redis: TTL, TTL jitter, negative cache, giảm cache stampede',
    'Analytics click bất đồng bộ (Kafka/queue), không làm chậm redirect',
    'Hết hạn link: kiểm tra expires_at lúc đọc và chiến lược dọn dữ liệu',
    'Schema, index hợp lý; tách OLTP redirect khỏi OLAP analytics',
    'Sự cố: cache/DB lỗi, hot key, abuse, duplicate event',
    'Giám sát: p99 redirect, cache hit rate, lỗi 404/410, backlog analytics'
  ],
  reference: '**Tóm tắt:** URL shortener (dịch vụ rút gọn URL) về bản chất là một bảng tra cứu key-value (khóa-giá trị) cực đọc-nhiều-ghi-ít: biến mã ngắn thành URL dài thật nhanh. Tôi sinh mã bằng **counter phân đoạn** (cấp trước dải số ID) rồi mã hoá **Base62** (hệ cơ số 62 dùng 62 ký tự 0-9, a-z, A-Z) để mã ngắn và không trùng; lưu mapping trong cơ sở dữ liệu (database - DB, nơi lưu dữ liệu bền vững) có **unique index** (chỉ mục duy nhất: DB từ chối hai dòng cùng giá trị) để chống trùng tuyệt đối; đặt **cache** (bộ nhớ đệm, ví dụ Redis - kho key-value trong RAM để đọc rất nhanh) trước DB để redirect p99 dưới 40 ms; phát **sự kiện click** (event: bản ghi "vừa có một lần bấm") bất đồng bộ qua **message queue** (hàng đợi tin nhắn, ví dụ Kafka - hệ thống truyền sự kiện bền vững, giúp tách việc ghi nhận khỏi đường redirect) để analytics không làm chậm người dùng; và kiểm tra **TTL/hết hạn** (thời gian sống) mỗi lần redirect.\n\n### 1. Làm rõ yêu cầu (cái gì và vì sao cần)\n- **Tạo mã:** người dùng gửi URL dài, hệ thống trả mã ngắn (ví dụ 7 ký tự). Cần mã duy nhất, khó đoán tùy mức (ở đây ưu tiên không trùng và nhanh).\n- **Redirect (chuyển hướng):** khi ai đó mở {{https://sho.rt/Ab3x9Q}}, hệ thống tìm URL dài và trả HTTP 302 về địa chỉ thật. Đây là đường nóng, phải cực nhanh.\n- **Analytics click:** đếm lượt bấm, thời gian, nguồn (referrer - trang giới thiệu), thiết bị (user-agent). Phục vụ báo cáo, chấp nhận trễ vài phút nhưng không được làm chậm redirect.\n- **Hết hạn link:** link có {{expires_at}}; sau thời điểm này truy cập phải bị từ chối (thường 410 Gone - tài nguyên không còn) thay vì redirect.\n- **Non-functional (phi chức năng):** 99,99% availability (tính sẵn sàng: ~52 phút downtime/năm), p99 (99% request nhanh hơn ngưỡng) redirect < 40 ms.\n\n### 2. Ước lượng tải (phép tính)\n- 80.000.000 URL / (30 ngày x 86.400 giây) ≈ 30,9 writes/giây trung bình. Peak 4x ≈ 124 writes/giây.\n- Đọc gấp 120 lần: 30,9 x 120 ≈ 3.700 reads/giây trung bình, peak ≈ 14.800 reads/giây.\n- Dung lượng mapping 3 năm: 80M x 36 tháng = 2,88 tỷ URL. 2,88 tỷ x 500 byte ≈ 1,44 TB (chưa tính index/replica). Cần kế hoạch phân mảnh (sharding - chia dữ liệu ra nhiều DB) khi tiến gần ngưỡng một máy.\n- Không gian mã: Base62, 7 ký tự = 62^7 ≈ 3.521.614.606.208 (~3,5 nghìn tỷ). Dùng 2,88 tỷ trong 3 năm là rất nhỏ, gần như không lo cạn.\n- Cache: quy luật 80/20 (20% link nóng chiếm 80% lượt đọc). 3 triệu entry x ~300 byte ≈ 900 MB RAM Redis, dễ chịu.\n\n### 3. Sinh mã và chống trùng (vì sao không trùng)\n**Vấn đề:** hai request tạo link cùng lúc có thể cố ghi cùng một mã nếu thuật toán không an toàn.\n**Cách chọn: counter phân đoạn + Base62**\n1. Một bộ cấp ID (ID allocator) tăng dần: dùng DB {{INCRBY}} hoặc bảng sequence để "xin" một dải, ví dụ 10.000 ID một lần.\n2. Mỗi instance (bản chạy của URL Service) phát ID trong dải của nó vào RAM. Chết process chỉ mất dải chưa dùng, không trùng.\n3. Mã hoá số ID sang Base62 để được chuỗi ngắn (ví dụ 7 ký tự). Có thể XOR (phép toán bit làm xáo trộn) với số bí mật để mã khó đoán tuần tự, nhưng không coi đây là bảo mật.\n\n**Chống trùng tuyệt đối bằng DB:**\n- Cột {{code}} có **UNIQUE constraint/index** (ràng buộc duy nhất). Nếu vì lý do hiếm (retry, cấp dải lỗi) hai lần ghi cùng mã, DB trả lỗi trùng khoá.\n- Ứng dụng bắt lỗi duplicate key, xin mã mới và thử lại (retry) tối đa vài lần. Vì mỗi lần lấy ID mới từ dải, retry sẽ ra mã khác.\n- Kiểm tra "tồn tại" rồi mới "insert" (check-then-insert) KHÔNG đủ khi đồng thời (race condition - hai luồng chạy đua). Phải dựa vào unique constraint làm chốt cuối.\n\n~~~text\nVí dụ race condition (tại sao check-then-insert hỏng):\nT1: SELECT code=\'Ab3x9Q\' -> không có\nT2: SELECT code=\'Ab3x9Q\' -> không có\nT1: INSERT code=\'Ab3x9Q\' -> OK\nT2: INSERT code=\'Ab3x9Q\' -> TRÙNG (nếu có UNIQUE thì DB chặn, nếu không thì dữ liệu hỏng)\n~~~\n\n### 4. Thiết kế tổng thể và luồng\n~~~seq\ntitle: Luồng tạo mã và redirect có analytics, hết hạn\nactors: Client | LB | URL Service | Redis | DB | Kafka\nClient -> LB: POST /urls (longUrl, expiresAt)\nLB -> URL Service: chuyển request\nURL Service -> DB: INSERT url_mapping(code unique)\nDB --> URL Service: OK (hoặc duplicate -> retry mã mới)\nURL Service --> Client: trả code\nClient -> LB: GET /{code}\nLB -> URL Service: redirect\nURL Service -> Redis: GET code\nRedis --> URL Service: hit (url, expires) hoặc miss\nURL Service -> DB: SELECT khi miss\nDB --> URL Service: url, expires_at\nURL Service -> Redis: SET code + TTL jitter\nURL Service -> URL Service: kiểm tra hết hạn\nURL Service -> Kafka: phát click event bất đồng bộ\nURL Service --> Client: 302 Location hoặc 410 Gone\n~~~\n\n**Luồng tạo (ghi):**\n1. Client gọi POST với URL dài (và {{expires_at}} nếu có). Service xác thực, chuẩn hoá URL.\n2. Lấy ID từ dải, mã hoá Base62 thành {{code}}. (Tuỳ chọn: nếu muốn dedup - cùng long URL trả cùng mã - có thể hash long URL để tra trước, nhưng phải xử lý va chạm hash).\n3. {{INSERT}} vào DB với unique {{code}}. Nếu duplicate key, thử mã mới.\n4. Trả {{shortUrl}}. Không cần ghi cache ngay (cache-aside sẽ lấp khi có đọc).\n\n**Luồng redirect (đọc, đường nóng):**\n1. Tra {{code}} trong Redis. **Cache hit** (có trong cache): dùng ngay.\n2. **Cache miss** (không có): đọc DB. Nếu không tồn tại, ghi **negative cache** (cache kết quả "không có", TTL ngắn, ví dụ 30-60 giây) để chống cache penetration (kẻ tấn công dò mã rác làm DB quá tải).\n3. Kiểm tra hết hạn: nếu {{expires_at != null}} và {{now >= expires_at}} thì trả **410 Gone** (hoặc 404 tuỳ chính sách, nhưng 410 nói rõ "đã từng có, giờ hết"). Không redirect.\n4. Trả **302 Found** với header {{Location}} là URL dài. Dùng 302 (tạm thời) thay vì 301 (vĩnh viễn) vì 301 bị trình duyệt/CDN cache lâu, lần sau người dùng không gọi server nên ta mất analytics click.\n5. Phát sự kiện click vào Kafka **sau khi quyết định redirect** (hoặc bất đồng bộ) và không chờ Kafka xác nhận trên đường trả response; nếu Kafka lỗi, ghi log/buffer cục bộ có giới hạn và ưu tiên redirect vẫn thành công (analytics là best-effort, redirect là quan trọng nhất). Có thể dùng producer bất đồng bộ với timeout ngắn.\n\n### 5. Cache: nhanh, đúng và chống sập\n- **Cache-aside (đọc qua cache):** miss thì đọc DB rồi {{SET}} vào Redis kèm TTL (thời gian cache sống). Lần sau hit.\n- **TTL jitter (lệch ngẫu nhiên):** đặt TTL, ví dụ 24h ± ngẫu nhiên 0-2h. Nếu hàng nghìn key cùng hết hạn một lúc sẽ gây "thundering herd" (bầy đàn đổ dồn về DB). Jitter trải đều thời điểm hết hạn.\n- **Cache stampede (kẹt cache) khi key nóng hết hạn:** nhiều request cùng miss cùng lúc. Giảm bằng single-flight (chỉ một request đi DB, các request khác chờ) hoặc khoá phân tán ngắn (SETNX lock) theo {{code}}.\n- **Hot key:** một link viral (ví dụ chia sẻ trên mạng xã hội) nhận rất nhiều đọc. Redis xử lý tốt đọc đơn giản; thêm replica Redis, cache tại CDN/edge hoặc local in-process cache (cache trong RAM của từng instance, TTL rất ngắn vài giây) cho các mã cực nóng.\n- **Invalidation (làm mất hiệu lực cache):** khi xoá hoặc cập nhật {{expires_at}}, xoá key Redis tương ứng để lần đọc sau lấy dữ liệu mới từ DB.\n\n### 6. Analytics click bất đồng bộ\n**Vì sao bất đồng bộ:** ghi analytics trực tiếp vào DB trên mỗi redirect sẽ thêm độ trễ và làm DB OLTP (DB giao dịch chính) quá tải.\n- Redirect path chỉ {{produce}} một event nhỏ vào Kafka topic {{click-events}}, partition theo {{code}} (giữ thứ tự tương đối theo link nếu cần).\n- **Consumer** (worker đọc Kafka) tổng hợp và ghi vào kho analytics/OLAP (Online Analytical Processing - kho truy vấn phân tích, ví dụ ClickHouse) theo cửa sổ thời gian. Dashboard đọc từ đây.\n- **Idempotent (thực hiện nhiều lần như một lần):** nếu producer retry hoặc consumer đọc lại, có thể có event trùng. Gắn {{click_id}} (UUID sinh tại service) và để consumer/OLAP khử trùng theo {{click_id}} hoặc chấp nhận sai số nhỏ tuỳ yêu cầu; với báo cáo gần real-time thường chấp nhận xấp xỉ, còn số liệu đối soát chạy batch từ log thô.\n- Lưu dữ liệu thô (raw events) vào object storage (S3) để có thể tính lại.\n\n### 7. Hết hạn link (TTL)\n- **Lưu:** {{expires_at}} (timestamp) trong {{url_mapping}}. {{NULL}} nghĩa là không hết hạn.\n- **Lazy check (kiểm tra lười, lúc đọc):** mỗi lần redirect, nếu hết hạn thì trả 410 và (tuỳ chọn) xoá/đánh dấu trong cache. Đây là cách đảm bảo đúng hành vi ngay lập tức.\n- **Active cleanup (dọn chủ động):** job nền chạy định kỳ (ví dụ mỗi giờ) xoá hoặc archive các bản ghi đã hết hạn lâu để giải phóng DB/index. Không cần chạy quá thường xuyên.\n- **TTL trong Redis:** có thể đặt TTL cache <= thời gian còn lại tới {{expires_at}} (nếu gần hết hạn) để cache tự hết, tránh trả link đã hết hạn từ cache. Nhưng vẫn phải tin DB là nguồn sự thật và kiểm tra {{expires_at}} khi miss.\n- **Lưu ý:** 410/404 vẫn có thể cache negative ngắn hạn sau khi hết hạn để giảm tải truy cập lặp vào link chết.\n\n### 8. Schema gợi ý và chỉ mục\n~~~sql\n-- PostgreSQL (ví dụ)\nCREATE TABLE url_mapping (\n  code       VARCHAR(16) PRIMARY KEY, -- mã ngắn, unique\n  long_url   TEXT NOT NULL,\n  created_at TIMESTAMP NOT NULL,\n  expires_at TIMESTAMP NULL,          -- NULL = không hết hạn\n  owner_id   BIGINT NULL\n);\nCREATE INDEX idx_url_expires ON url_mapping (expires_at);\n~~~\n- Tra cứu theo {{code}} dùng primary key (rất nhanh). Index {{expires_at}} hỗ trợ job dọn.\n- Analytics không lưu trong bảng này: dùng bảng/event trong ClickHouse hoặc pipeline riêng để tránh làm chậm ghi/đọc OLTP.\n\n### 9. Sự cố hay gặp và cách xử lý\n| Sự cố | Nguyên nhân | Giảm thiểu |\n|---|---|---|\n| Redirect chậm, DB quá tải | Cache miss hàng loạt, traffic tăng đột biến | Cache-aside, TTL jitter, local cache cho hot key, replica đọc |\n| Cache stampede | Key nóng hết hạn cùng lúc | Single-flight/lock ngắn, gia hạn sớm (probabilistic early refresh) |\n| Mã trùng | Race condition khi sinh mã | Unique constraint + retry, counter phân đoạn |\n| Click bị đếm sai | Event trùng/mất khi Kafka retry hoặc consumer lỗi | click_id + khử trùng/đối soát, lưu raw log để tính lại |\n| Link hết hạn vẫn redirect | Cache chưa xoá | Kiểm tra expires_at khi đọc, TTL cache bám expires_at, xoá cache khi cập nhật |\n| Redis/DB chết | Hạ tầng lỗi | Redis: fallback DB (chấp nhận chậm) hoặc circuit breaker; DB: replica, failover, ưu tiên redirect đọc |\n| Abuse/phishing | Tạo link độc hại | Rate limit tạo link, quét URL (safe browsing), cho phép vô hiệu hoá |\n\n### Ví dụ đời thực\nMột chiến dịch marketing phát QR dẫn tới {{sho.rt/sale}} được chia sẻ trên mạng xã hội, traffic redirect tăng từ 3.500 reads/s lên 22.000 reads/s trong 10 phút (gấp ~6,3 lần). Trước đó key {{sale}} có TTL hết hạn cùng lúc trên cache gây 8.000 request/giây dồn xuống DB, p99 redirect tăng lên 420 ms. Nhóm xử lý: bật single-flight theo mã, thêm TTL jitter (24h ± 90 phút) cho các key mới, và đặt local in-process cache 5 giây cho top mã nóng. Kết quả: cache hit rate tăng từ 71% lên 97%, p99 redirect giảm còn 28 ms, DB read QPS (số truy vấn đọc mỗi giây) giảm từ 8.000 xuống ~650/s, trong khi analytics click vẫn trễ trung bình 45 giây (chấp nhận được).\n\n### Trả lời mẫu khi phỏng vấn\n"Em thiết kế URL shortener như một hệ thống đọc nhiều, ghi ít. Lúc tạo, em cấp ID theo dải (range allocation) rồi mã hoá Base62 để ra mã ngắn; chống trùng bằng unique constraint trên cột mã và retry nếu hiếm khi đụng duplicate. Đường redirect là đường nóng: tra Redis trước, miss thì đọc DB, có negative cache cho mã không tồn tại và TTL jitter để tránh stampede; nếu mã hết hạn theo {{expires_at}} thì trả 410, còn hợp lệ thì trả 302 để trình duyệt luôn gọi lại và em đo được click. Analytics không ghi thẳng vào DB giao dịch: em phát click event vào Kafka, consumer ghi sang kho OLAP và lưu raw log để tính lại, nên redirect vẫn giữ p99 dưới 40 ms. Em cũng chuẩn bị cho hot key (link viral), job dọn link hết hạn, và giám sát cache hit rate, p99, tỉ lệ 410/404. Khi dữ liệu lên tới hàng tỷ bản ghi, em sẽ shard theo {{code}} và mở rộng cache/replica đọc."\n\n> Senior tip: đừng nhầm "cache có TTL" với "link hết hạn". TTL của Redis chỉ là lúc phần tử rời cache; {{expires_at}} của nghiệp vụ mới quyết định link còn dùng được không. Luôn kiểm tra {{expires_at}} từ nguồn tin cậy (DB hoặc giá trị đã được cache kèm) trước khi redirect, và nhớ 301 tiết kiệm request nhưng làm mất analytics, còn 302 giữ được đo lường với cái giá là thêm một lần gọi.',
  followups: [
    'Nếu muốn cùng một long URL luôn trả về cùng một mã (dedup), bạn thay đổi thiết kế sinh mã và chỉ mục thế nào, và trade-off là gì?',
    'Làm sao để hệ thống analytics vẫn gần đúng khi Kafka hoặc consumer bị chậm vài giờ, và khi nào bạn chấp nhận đếm trùng/thiếu?',
    'Một link bị báo là phishing sau khi đã phát tán rộng: bạn chặn redirect, cập nhật cache và audit như thế nào trong vài phút?',
    'Khi bảng url_mapping vượt 5 tỷ dòng và một máy DB không chứa nổi, bạn shard theo key nào và xử lý redirect ra sao?'
  ],
  related: [
    'sd-004',
    'db-024',
    'microservices-006'
  ]
},
{
  id: 'sd-032',
  title: 'Hệ thống chat 1-1 và nhóm: WebSocket, lưu tin nhắn, đã đọc, presence, đồng bộ nhiều thiết bị',
  kind: 'bigtech',
  level: 'senior',
  prompt: 'Thiết kế hệ thống chat hỗ trợ trò chuyện 1-1 và nhóm. Quy mô: 8 triệu người dùng đồng thời, trung bình 2 kết nối/người (đa thiết bị), gửi/nhận thời gian thực, p99 dưới 250 ms, không mất tin nhắn. Yêu cầu: dùng WebSocket (kết nối hai chiều giữ mở giữa client và server), lưu trữ tin nhắn, trạng thái đã đọc (read receipt), trạng thái online/offline (presence), và đồng bộ nhiều thiết bị của cùng một người dùng. Bạn có 45 phút.',
  phases: [
    {
      name: 'Requirements',
      minutes: 5,
      guide: 'Chốt chức năng: chat 1-1 và nhóm (ví dụ nhóm 500 người), gửi/nhận tức thì, lịch sử, đã đọc, presence online/offline/last seen, đồng bộ nhiều thiết bị (điện thoại, web). Non-functional: 8M concurrent, ~16M kết nối, p99 <250 ms, không mất tin, lịch sử tải nhanh. Làm rõ: thứ tự tin nhắn đảm bảo trong từng cuộc hội thoại (conversation), không cần thứ tự toàn cục; offline nhận khi kết nối lại.'
    },
    {
      name: 'Estimation',
      minutes: 5,
      guide: '8M user x 2 conn = 16M kết nối WebSocket. Mỗi gateway giữ 50k-100k kết nối -> cần ~160-320 node. Tin nhắn: giả sử 80M/ngày ≈ 926 msg/s trung bình, peak 10k/s. 500 byte/msg -> ~40 GB/ngày. Read receipt và presence là traffic phụ nhưng rất chatty nếu thiết kế sai.'
    },
    {
      name: 'API & data model',
      minutes: 5,
      guide: 'Kết nối: WebSocket (wss://). Gửi: {clientMsgId, conversationId, body, type}. Ack: server ack kèm seq. Sync: reconnect gửi {conversationId, lastSeq}. Bảng message(conversation_id, seq, msg_id, sender_id, body, created_at) partition theo conversation_id, seq tăng dần. Bảng receipt(conversation_id, user_id, last_read_seq). Session registry: user_id -> danh sách (device_id, gateway_id).'
    },
    {
      name: 'High-level design',
      minutes: 15,
      guide: 'Vẽ: Client <==WebSocket==> Chat Gateway (giữ socket, theo device) -> Session Registry (Redis) -> Chat/Message Service -> DB lưu tin (wide-column hoặc SQL partitioned) + event bus. Presence Service cập nhật online/offline. Notification đẩy tới thiết bị khác của cùng user và các thành viên online; offline dùng push notification. Đồng bộ thiết bị dựa trên seq và inbox.'
    },
    {
      name: 'Deep dive',
      minutes: 15,
      guide: 'Sequence number per-conversation, at-least-once + dedup bằng clientMsgId, reconnect/sync theo lastSeq, fan-out read receipt (tránh ghi bừa), presence (heartbeat, TTL, không broadcast toàn bộ), multi-device (mọi device của sender cũng nhận bản sao), nhóm lớn, lưu trữ và truy vấn lịch sử.'
    }
  ],
  rubric: [
    'WebSocket gateway giữ kết nối stateful, scale ngang, có session registry theo user/device',
    'Định tuyến tin: tìm gateway/device của người nhận và các thiết bị cùng user',
    'Lưu tin nhắn bền vững theo conversation với sequence number tăng dần',
    'At-least-once delivery, ack, clientMsgId dedup, reconnect đồng bộ theo lastSeq',
    'Trạng thái đã đọc: lưu last_read_seq/marker, fan-out hợp lý, tránh ghi quá nhiều',
    'Presence online/offline/last seen dùng heartbeat + TTL, không broadcast ồn ào',
    'Đồng bộ nhiều thiết bị: mọi device của user thấy cùng lịch sử và trạng thái',
    'Phân biệt chat 1-1 và nhóm (fan-out), xử lý nhóm đông',
    'Sự cố: gateway chết, mất kết nối, trùng tin, lệch thứ tự, offline',
    'Giám sát: số kết nối, độ trễ gửi, backlog, lỗi ack, reconnect rate'
  ],
  reference: '**Tóm tắt:** Hệ thống chat realtime cần ba mảnh ghép: (1) **WebSocket** (kết nối TCP hai chiều giữ mở, server có thể chủ động đẩy tin xuống client ngay lập tức) qua các **gateway** (máy cổng giữ socket - điểm nối mạng) có **session registry** (sổ đăng ký phiên: ai đang kết nối ở gateway/thiết bị nào, thường lưu trong Redis - kho key-value trong RAM); (2) **lưu tin nhắn** bền vững theo từng **conversation** (cuộc hội thoại) với **sequence number** (số thứ tự tăng dần trong hội thoại) để sắp đúng và đồng bộ lại; (3) cơ chế **đã đọc (read receipt)** và **presence** (trạng thái online/offline) được thiết kế tiết kiệm ghi. Gửi tin theo **at-least-once** (ít nhất một lần: có thể trùng, không được mất) kết hợp **idempotent/dedup** (khử trùng bằng mã định danh) để không mất và không nhân đôi.\n\n### 1. Làm rõ yêu cầu (cái gì, vì sao)\n- **WebSocket:** khác HTTP request-response (hỏi-đáp một lần), WebSocket giữ kết nối mở nên server đẩy tin mới trong vài chục mili-giây mà client không phải hỏi liên tục (polling - hỏi lặp lại, tốn tài nguyên).\n- **Lưu tin nhắn:** người dùng mở app sau phải thấy lịch sử. Tin nhắn là dữ liệu phải bền (durable - không mất khi máy lỗi), ghi vào DB trước hoặc cùng lúc với việc báo thành công.\n- **Đã đọc:** người nhận mở hội thoại tới tin nào thì người gửi thấy "đã đọc". Cần mốc tiến độ (thường {{last_read_seq}}) thay vì cập nhật từng tin.\n- **Presence (online/offline):** biết ai đang trực tuyến/hoạt động gần nhất. Dữ liệu này thay đổi liên tục, chấp nhận trễ vài giây, không được tốn chi phí bằng lưu tin nhắn.\n- **Đồng bộ nhiều thiết bị:** cùng tài khoản đăng nhập điện thoại và web: gửi từ điện thoại thì web cũng thấy; đọc trên web thì điện thoại cập nhật trạng thái.\n- **Phạm vi:** thứ tự đảm bảo trong một conversation; 1-1 và nhóm; offline dùng **push notification** (thông báo đẩy qua dịch vụ của hệ điều hành như FCM/APNs) để đánh thức thiết bị.\n\n### 2. Ước lượng tải\n- 8.000.000 user x 2 kết nối = 16.000.000 WebSocket. Nếu 80.000 kết nối/gateway thì cần ~200 gateway (cộng dư phòng). Gateway là **stateful** (giữ trạng thái kết nối trong RAM) nên scale bằng thêm node và cân bằng tải.\n- 80.000.000 tin/ngày / 86.400 ≈ 926 msg/s trung bình. Giờ cao điểm giả sử gấp 10 ≈ 9.260 msg/s. Mỗi tin ~500 byte -> ~40 GB/ngày (chưa index/bản sao).\n- Fan-out (lan toả): 1-1 là 2 phía (gồm các thiết bị). Nhóm 200 người online 50 người -> mỗi tin tạo ~50 lần đẩy (plus thiết bị gửi). Nhóm rất lớn cần chiến lược khác (xem deep dive).\n\n### 3. Mô hình dữ liệu và định danh\n- {{conversation}}: {{conversation_id}}, loại (direct/group), danh sách thành viên. 1-1 có thể chuẩn hoá id từ hai user để không tạo trùng.\n- {{message}}: {{conversation_id}} (partition key - khoá phân vùng), {{seq}} (số thứ tự tăng đơn điệu trong conversation), {{msg_id}} (UUID), {{sender_id}}, {{client_msg_id}} (id client sinh, để dedup), {{body}}, {{created_at}}. Unique theo {{(conversation_id, client_msg_id)}} để chặn gửi trùng.\n- {{receipt}} (đã đọc): {{conversation_id}}, {{user_id}}, {{last_read_seq}}, {{updated_at}}. Lưu mốc, không lưu từng tin.\n- {{session/device}}: {{user_id}}, {{device_id}}, {{gateway_id}}, {{conn_id}}, {{last_seen}} trong Redis (có TTL) để định tuyến.\n\n~~~text\nVí dụ thứ tự trong một conversation:\nseq 101: A "Chào"        -> lưu, đẩy\nseq 102: B "Chào bạn"    -> lưu, đẩy\nseq 103: A "Khỏe không?" -> client A sync thấy thiếu 102? xin lại từ 102\n(seq chỉ so sánh trong cùng conversation_id)\n~~~\n\n### 4. Kiến trúc và luồng gửi/nhận\n~~~seq\ntitle: Gửi tin nhắn 1-1, lưu và đồng bộ nhiều thiết bị\nactors: Sender Device | Gateway | Msg Service | DB | Registry | Receiver Device\nSender Device -> Gateway: WebSocket send(clientMsgId, convId, body)\nGateway -> Msg Service: chuyển tiếp (đã xác thực)\nMsg Service -> DB: ghi message + tăng seq (atomic theo conv)\nDB --> Msg Service: OK (seq=103)\nMsg Service -> Registry: tra thiết bị người nhận và các device người gửi\nRegistry --> Msg Service: Receiver@Gateway, Sender devices\nMsg Service -> Gateway: đẩy tin seq=103\nGateway -> Receiver Device: deliver qua WebSocket\nMsg Service -> Gateway: đẩy bản sao tới thiết bị khác của sender\nMsg Service --> Gateway: ACK(seq=103, clientMsgId)\nGateway --> Sender Device: ACK thành công\n~~~\n\n**Các bước quan trọng:**\n1. Sender mở WebSocket tới Gateway A (qua load balancer hỗ trợ WebSocket). Gateway xác thực token, đăng ký {{(user, device) -> Gateway A}} vào Redis.\n2. Client sinh {{clientMsgId}} (UUID) trước khi gửi. Nếu timeout chưa nhận ACK, client gửi lại cùng {{clientMsgId}}.\n3. Message Service ghi DB: cấp {{seq}} tăng dần trong conversation (có thể dùng transaction/conditional write theo partition). Nhờ unique {{clientMsgId}}, ghi trùng sẽ bị phát hiện và trả ACK của bản đã có (idempotent).\n4. Sau khi lưu bền, service định tuyến: tra registry lấy tất cả thiết bị online của người nhận và **các thiết bị khác của chính sender** (để đồng bộ đa thiết bị). Đẩy qua gateway tương ứng. Thiết bị offline sẽ nhận khi reconnect (sync) và/hoặc qua push notification.\n5. Trả ACK cho thiết bị gửi. Chỉ ACK sau khi lưu DB để "đã gửi" nghĩa là "không mất".\n\n### 5. Đồng bộ nhiều thiết bị (multi-device)\n- Mỗi thiết bị là một kết nối/session riêng có {{device_id}}. Registry lưu tập thiết bị của user, không chỉ một gateway.\n- Khi A gửi từ điện thoại: server lưu tin, đẩy xuống web của A (bản sao) và các thiết bị của B. Vì vậy mọi thiết bị thấy cùng lịch sử.\n- Khi B đọc trên web: web gửi {{read(conversationId, last_read_seq=103)}}. Server cập nhật {{receipt}} và đẩy sự kiện "read updated" tới thiết bị khác của B và (tuỳ thiết kế) cho A thấy.\n- **Sync khi reconnect:** thiết bị gửi {{lastSeq}} đã có theo từng conversation (hoặc dùng cursor/inbox). Server trả các tin {{seq > lastSeq}}. Đây là cơ chế chống mất tin khi rớt mạng.\n- Conflict hiếm (cùng sửa trạng thái): dùng mốc tiến độ đơn điệu (last_read_seq chỉ tăng) nên gộp (merge) dễ và an toàn.\n\n### 6. Trạng thái đã đọc (read receipt)\n- Không cập nhật "đã đọc" cho từng tin nhắn riêng lẻ trên DB nếu traffic cao, vì một người kéo đọc lịch sử sẽ tạo rất nhiều ghi. Thay vào đó lưu **mốc** {{last_read_seq}} cho mỗi (conversation, user).\n- Client khi mở hội thoại và cuộn tới đâu thì báo {{last_read_seq}} mới (debounce - gộp, chỉ gửi sau một khoảng ngắn, ví dụ 500 ms đến 2 giây).\n- Server chỉ ghi nếu mốc mới lớn hơn mốc cũ (idempotent, chống lùi). Sau đó fan-out sự kiện cập nhật cho các bên liên quan.\n- Nhóm lớn: hiển thị "đã đọc" chi tiết cho từng thành viên rất tốn (N người x M mốc). Thực tế thường chỉ hiển thị "đã xem" tổng quát hoặc số người đã đọc, tính từ mốc của từng người.\n\n### 7. Presence (online/offline)\n- **Heartbeat (nhịp tim):** client gửi ping định kỳ (ví dụ 30 giây) hoặc tận dụng hoạt động WebSocket. Gateway cập nhật {{last_seen}} và đặt TTL trong Redis (ví dụ 60-90 giây).\n- Nếu hết TTL mà không có heartbeat (mất mạng, app tắt), coi là offline và ghi {{last_seen_at}} (thời điểm thấy lần cuối) vào DB để hiển thị "hoạt động 5 phút trước".\n- **Không broadcast cho tất cả mọi người:** chỉ gửi presence cho người đang mở hội thoại với user đó hoặc đang subscribe (đăng ký theo dõi). Tránh bão sự kiện.\n- Nhiều thiết bị: user online nếu còn ít nhất một thiết bị online; offline khi tất cả hết phiên.\n\n### 8. Lưu trữ và truy vấn lịch sử\n- Tin nhắn là append-heavy (ghi nối đuôi). Lưu theo {{conversation_id}} để lấy 50 tin gần nhất nhanh: truy vấn {{WHERE conversation_id=? ORDER BY seq DESC LIMIT 50}}.\n- DB wide-column (Cassandra/ScyllaDB: partition theo conversation_id, clustering theo seq) hoặc PostgreSQL partitioned theo conversation_id/hash đều dùng được tuỳ quy mô; quan trọng là đọc theo hội thoại phải tuần tự và nhanh.\n- File/ảnh: upload lên object storage (S3), tin nhắn chỉ lưu metadata và URL (có chữ ký, thời hạn) để không phình DB.\n- Tin nhắn cũ: nén/lưu tầng lạnh theo thời gian, nhưng vẫn truy cập được khi người dùng cuộn lịch sử.\n\n### 9. Sự cố hay gặp và cách xử lý\n| Sự cố | Nguyên nhân | Giảm thiểu |\n|---|---|---|\n| Mất tin nhắn | Server ACK trước khi lưu, hoặc crash giữa chừng | Chỉ ACK sau khi ghi DB bền; client retry nếu không có ACK |\n| Tin trùng | Client retry do timeout/ACK mất | {{clientMsgId}} unique + dedup/idempotent ở server |\n| Lệch thứ tự | Gửi song song, mạng trễ khác nhau | {{seq}} per-conversation do server cấp; client sắp theo seq, phát hiện hổng để xin sync |\n| Gateway chết | Node stateful bị lỗi, hàng chục nghìn socket rớt | Client tự reconnect sang gateway khác; registry hết hạn; sync theo lastSeq để bù tin |\n| Presence sai (ảo online/offline) | Mạng chập chờn, heartbeat trễ | TTL đủ rộng, debounce chuyển trạng thái, chấp nhận eventual consistency (nhất quán cuối cùng, trễ vài giây) |\n| Nhóm lớn gây fan-out nổ | 1 tin đẩy tới hàng nghìn người | Với nhóm rất lớn: chuyển sang mô hình pull (client lấy tin mới), hoặc fan-out bất đồng bộ qua queue, giới hạn push realtime |\n| Read receipt gây ghi nhiều | Mỗi lần cuộn đều ghi | Lưu mốc last_read_seq, debounce, chỉ tăng không giảm |\n\n### Ví dụ đời thực\nMột nhóm chat lớp 300 thành viên bị báo "tin đến trễ 5-8 giây" vào giờ cao điểm (19:00-21:00). Số liệu: 12.000 msg/phút trong nhóm, mỗi tin fan-out ngay lập tức tới ~180 thiết bị online, tạo ~36.000 lần đẩy/giây chỉ riêng nhóm này và làm queue nội bộ của Message Service tăng backlog 45 giây. Đồng thời read receipt được client gửi mỗi lần cuộn, gây 4.000 write/s vào bảng receipt. Nhóm xử lý: (1) chuyển fan-out nhóm > 100 thành viên qua hàng đợi bất đồng bộ theo lô; (2) client debounce read receipt 2 giây và chỉ gửi khi {{last_read_seq}} tăng; (3) tách presence traffic sang kênh nhẹ. Kết quả: p99 độ trễ nhận tin giảm từ 6,2 giây xuống 210 ms, write receipt giảm còn ~350/s, backlog về 0 trong giờ cao điểm.\n\n### Trả lời mẫu khi phỏng vấn\n"Em thiết kế chat tách rõ kết nối, định tuyến và lưu trữ. Client giữ WebSocket tới gateway stateful; gateway đăng ký từng thiết bị vào session registry (Redis) nên biết user đang online ở đâu và có bao nhiêu device. Khi gửi tin, client gắn {{clientMsgId}} để server dedup; Message Service ghi tin bền vào DB và cấp {{seq}} tăng trong từng conversation rồi mới ACK, nên không mất tin và client sắp xếp lại được. Sau khi lưu, server fan-out tới thiết bị người nhận và cả thiết bị khác của chính sender để đồng bộ đa thiết bị; thiết bị offline sync lại theo {{lastSeq}} khi reconnect. Trạng thái đã đọc em lưu mốc {{last_read_seq}} và debounce để giảm ghi, còn presence dùng heartbeat + TTL trong Redis, chỉ thông báo cho người đang quan tâm thay vì broadcast. Với nhóm lớn, em tránh push đồng bộ cho tất cả mà dùng hàng đợi/pull. Em theo dõi p99 deliver, backlog, tỉ lệ reconnect và lỗi ACK để vận hành."\n\n> Senior tip: trong phỏng vấn, hãy nhấn mạnh "ACK sau khi lưu DB" và "sync bằng seq khi reconnect" — đó là cặp bảo hiểm chống mất tin. Đồng thời đừng biến read receipt và presence thành gánh nặng ghi: dùng mốc (last_read_seq, last_seen) và debounce/TTL. Multi-device không khó nếu bạn coi mỗi thiết bị là một session và luôn phát bản sao sự kiện cho mọi session của cùng user.',
  followups: [
    'Nếu cần đảm bảo thứ tự tin nhắn giữa hai vùng (region) địa lý khác nhau, bạn đánh đổi gì và thiết kế đồng bộ ra sao?',
    'Khi nhóm tăng lên 50.000 thành viên, fan-out và read receipt thay đổi thế nào để hệ thống không sập?',
    'Làm sao xử lý trường hợp người dùng thu hồi (delete/unsend) một tin nhắn đã được đồng bộ xuống nhiều thiết bị offline?',
    'Bạn phát hiện một client bị bug gửi lặp cùng tin 20 lần/giây: server và hệ thống bảo vệ mình thế nào ngoài việc dedup?'
  ],
  related: [
    'sd-007',
    'microservices-006',
    'db-024'
  ]
},
{
  id: 'sd-033',
  title: 'Hệ thống thanh toán/chuyển tiền nội bộ (ledger double-entry, idempotency, đối soát, saga gọi cổng ngoài)',
  kind: 'bank',
  level: 'lead',
  prompt: `Bạn là kiến trúc sư cho một ví điện tử / ngân hàng số 10 triệu người dùng (3 triệu DAU). Thiết kế hệ thống chuyển tiền **nội bộ** giữa người dùng trong cùng hệ thống: ledger double-entry, idempotency end-to-end, đối soát hàng ngày, và **saga** khi cần gọi cổng thanh toán ngoài (napas, ngân hàng đối tác) để nạp/rút tiền. Quy mô: peak 5.000 TPS chuyển tiền nội bộ, SLA 99,99%, p99 < 500 ms, không mất tiền, không trừ hai lần, audit retention 7 năm. Bạn có 45 phút.`,
  phases: [
    { name: 'Requirements', minutes: 5, guide: `Làm rõ functional: chuyển tiền theo số điện thoại/user_id, request money, lịch sử, sao kê, huỷ/hoàn tiền (nếu chưa settle), hạn mức ngày. Non-functional: TPS peak, p99 latency, availability, consistency (tiền phải đúng tuyệt đối), audit retention 7 năm. Hỏi rõ contract cổng ngoài: async/sync, timeout, retry policy, idempotency key có hỗ trợ không, trạng thái treo tối đa bao lâu. Chốt out-of-scope: FX, crypto, bulk payment, AML batch. Chốt giả định: client retry là chắc chắn, at-least-once.` },
    { name: 'Estimation', minutes: 5, guide: `TPS peak 5.000, trung bình 500-1.000. Storage: 5.000 txn/s x 86.400 x 1,5 KB ~ 650 GB/ngày nếu peak liên tục; thực tế ~20-50 GB/ngày. Retention 7 năm ~ 130 TB. Ledger double-entry: 2 entry/txn. Redis idempotency cache: 5.000 keys/s x TTL 24h ~ 432 triệu key/ngày, cần sharding. Cổng ngoài bandwidth: 500 req/s x 2 KB ~ 1 MB/s, không phải bottleneck. Kết luận: DB ledger là bottleneck chính, cần partition theo thời gian và account.` },
    { name: 'API & data model', minutes: 5, guide: `API: POST /transfers {{to_user_id|phone, amount, note, idempotency_key}} -> {{transfer_id, status}}, GET /transfers/{{id}}, POST /transfers/{{id}}/cancel (nếu chưa settle), GET /ledger/statement?from&to. State machine: INITIATED -> PENDING_EXTERNAL -> SETTLED/FAILED/REVERSED. Bảng transfer (id, idem_key unique, from_user, to_user, amount_minor, currency, status, external_ref, created_at, updated_at). Bảng ledger_entry append-only double-entry (txn_id, account_id, direction D/C, amount_minor, currency, created_at). Outbox table cùng DB transaction. Bảng {{external_gateway_txn}} (transfer_id, gateway, ref, status, raw_response). Unique constraints để chống trùng.` },
    { name: 'High-level design', minutes: 15, guide: `Vẽ: Client -> API -> Transfer service -> Ledger DB (primary) + Outbox -> External gateway adapter -> Cổng ngoài (Napas/ngân hàng). Async worker đọc outbox publish Kafka -> Gateway adapter. Webhook receiver nhận kết quả cổng ngoài. Status query từ DB/Redis cache. Giải thích luồng ghi và đọc khác nhau. Nêu vì sao không gọi cổng ngoài đồng bộ trong request (timeout làm client retry). Tách internal transfer (cùng hệ thống, strong consistency) và external transfer (saga, eventual).` },
    { name: 'Deep dive', minutes: 15, guide: `Đào sâu: idempotency end-to-end (client key -> server -> external ref), trạng thái treo và reconciliation hằng ngày, xử lý cổng ngoài timeout (retry với cùng {{external_ref}}, không tạo mới), deadlock avoidance (khoá account theo thứ tự id tăng dần), failure modes (cổng ngoài down, DB primary failover, duplicate webhook, client retry), monitoring (lag, pending count, mismatch, external gateway latency).` }
  ],
  rubric: [
    'Làm rõ yêu cầu và con số scale, chốt out-of-scope, phân biệt internal vs external transfer',
    'Idempotency key từ client đến cổng ngoài, xử lý retry an toàn',
    'State machine có trạng thái treo PENDING_EXTERNAL và timeout rõ ràng',
    'Double-entry ledger append-only, số tiền lưu bằng số nguyên đơn vị nhỏ nhất',
    'Outbox pattern thay vì dual-write DB + Kafka',
    'Xử lý cổng ngoài timeout/retry bằng cùng {{external_ref}}, không tạo giao dịch mới',
    'Reconciliation hằng ngày với file quyết toán cổng ngoài, dashboard lệch',
    'Khoá tài khoản theo thứ tự id tăng dần để tránh deadlock',
    'Giám sát pending count theo tuổi, external gateway success rate, reconciliation mismatch count, DLQ size',
    'Tóm tắt trade-off và failure mode, giải thích vì sao không dùng 2PC'
  ],
  reference: `**Tóm tắt:** Chuyển tiền nội bộ là bài toán **đúng đắn và truy vết**, không phải tốc độ. Ba trụ cột: idempotency key cho mọi lệnh ghi, double-entry ledger append-only làm nguồn sự thật, và reconciliation hằng ngày với cổng ngoài. Không có exactly-once thần kỳ — chỉ có at-least-once cộng với xử lý idempotent. Phân biệt rõ: internal transfer (cùng hệ thống, một local transaction, strong consistency) vs external transfer (gọi cổng ngoài, saga, eventual consistency).

### Yêu cầu và quy mô
- 10 triệu user, 3 triệu DAU, peak 5.000 TPS chuyển tiền nội bộ, p99 < 500 ms, availability 99,99%.
- Không mất tiền, không trừ hai lần, audit retention 7 năm.
- Cổng ngoài (Napas, ngân hàng) trả kết quả bất đồng bộ sau 1-30 giây, có thể timeout; client retry là chắc chắn.
- Internal transfer: từ A -> B trong cùng hệ thống. External transfer: nạp/rút qua cổng ngoài.

### Ước lượng
- Peak 5.000 TPS, trung bình 500-1.000 TPS.
- Storage: 5.000 x 86.400 x 1,5 KB ~ 650 GB/ngày nếu peak liên tục; thực tế 20-50 GB/ngày; 7 năm ~ 130 TB. Cần partition theo tháng.
- Ledger: 2 entry/txn, append-only.
- Redis idempotency: 5.000 keys/s x TTL 24h ~ 432 triệu key/ngày, phải shard Redis Cluster.
- Cổng ngoài: ~500 req/s peak, bandwidth ~1 MB/s, không phải bottleneck.

### Phân loại: Internal vs External Transfer
| Đặc điểm | Internal Transfer | External Transfer (nạp/rút) |
|---|---|---|
| Consistency | Strong (1 local transaction) | Eventual (saga, vài giây-phút) |
| Latency | < 50 ms | 1-30 giây (phụ thuộc cổng ngoài) |
| Failure handling | Rollback ngay | Retry + compensation + reconciliation |
| Idempotency | Client key + server unique | Client key + server + external ref |

### State Machine
~~~text
Internal:          INITIATED -> SETTLED
                      |           |
                      +-> FAILED <-+ (insufficient balance, limit)
External (nạp):    INITIATED -> PENDING_EXTERNAL -> SETTLED
                      |              |                 |
                      +-> FAILED <---+                 +-> REVERSED (hoàn tiền)
External (rút):    INITIATED -> PENDING_EXTERNAL -> SETTLED
                      |              |                 |
                      +-> FAILED <---+                 +-> REVERSED
~~~
Mỗi chuyển trạng thái là conditional update WHERE status = 'PENDING_EXTERNAL' (hoặc INITIATED). Không cho nhảy trạng thái tuỳ tiện.

### Mô hình dữ liệu
~~~sql
CREATE TABLE transfer (
  id            UUID PRIMARY KEY,
  idem_key      VARCHAR(64) NOT NULL,
  type          VARCHAR(20) NOT NULL CHECK (type IN ('INTERNAL','DEPOSIT','WITHDRAWAL')),
  from_user     BIGINT,
  to_user       BIGINT,
  amount_minor  BIGINT NOT NULL CHECK (amount_minor > 0),
  currency      CHAR(3) NOT NULL,
  status        VARCHAR(20) NOT NULL,
  external_ref  VARCHAR(64),
  external_gateway VARCHAR(30),
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
CREATE TABLE {{external_gateway_txn}} (
  id              BIGSERIAL PRIMARY KEY,
  transfer_id     UUID NOT NULL,
  gateway         VARCHAR(30) NOT NULL,
  external_ref    VARCHAR(64) NOT NULL,
  request_payload JSONB NOT NULL,
  response_raw    JSONB,
  status          VARCHAR(20) NOT NULL,
  attempt         INT NOT NULL DEFAULT 0,
  next_retry_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (transfer_id, gateway, external_ref)
);
~~~
- Tiền lưu bằng số nguyên đơn vị nhỏ nhất (VND minor = VND, USD minor = cent). Ledger append-only: sửa sai bằng reversal, không xoá.
- {{external_gateway_txn}} theo dõi mọi lần gọi cổng ngoài để reconciliation.

### Kiến trúc
~~~text
Client -> API gateway -> Transfer service -> Ledger DB (primary)
                              |                |
                              |          outbox table
                              v                |
                         Internal:          External gateway adapter <-- outbox relay -> Kafka
                         credit/debit           |                                  |
                         in 1 txn           Cổng ngoài (Napas/                    v
                                              Bank)                        Settlement/recon job
                                              |                                  |
                                       Webhook receiver ----------------------+
~~~
- API chỉ nhận và trả 202 kèm id tra cứu, không gọi cổng ngoài đồng bộ.
- Outbox: ghi transfer + ledger + outbox trong cùng DB transaction; relay đọc outbox và publish. Tránh dual-write.
- External gateway adapter idempotent theo {{external_ref}} (gateway sinh hoặc dùng transfer.id).

### Luồng Internal Transfer (cùng hệ thống)
1. Client gửi POST /transfers với Idempotency-Key (UUID).
2. Transfer service kiểm tra key: mới thì xử lý; đã có và body giống thì trả response cũ; đã có nhưng body khác thì 409.
3. Kiểm tra hạn mức ngày (UPDATE daily_limits ... used + amt <= limit).
4. Lấy khoá hai tài khoản theo thứ tự {{LEAST(from_user, to_user)}} trước, {{GREATEST(...)}} sau để tránh deadlock.
5. Kiểm tra số dư: {{UPDATE wallets SET balance = balance - amt WHERE id = from_user AND balance >= amt}} (conditional update).
6. Ghi transfer SETTLED + 2 ledger entry (from: D, to: C) + outbox(event cho notification) trong **cùng một transaction**.
7. Trả 200 kèm transfer id. Notification async qua outbox/Kafka.

### Luồng External Transfer (nạp/rút qua cổng ngoài)
1. Client tạo transfer type DEPOSIT/WITHDRAWAL, Idempotency-Key.
2. Transfer service ghi transfer INITIATED + outbox trong 1 transaction.
3. Outbox relay -> Kafka -> External gateway adapter.
4. Adapter sinh {{external_ref = transfer.id}} (hoặc UUID mới), ghi {{external_gateway_txn}} attempt=1, gọi cổng ngoài.
5. Trả 202 cho client, status = PENDING_EXTERNAL.
6. Cổng ngoài xử lý, sau đó gọi webhook hoặc adapter poll kết quả.
7. Webhook receiver: xác thực chữ ký, idempotent theo {{external_event_id}}, conditional update transfer PENDING_EXTERNAL -> SETTLED/FAILED, ghi ledger (nạp: credit user; rút: debit user + credit external), cập nhật {{external_gateway_txn}}.
8. Nếu webhook không đến sau N phút: adapter retry với **cùng {{external_ref}}** (idempotent ở phía cổng ngoài), attempt++.

### Xử lý cổng ngoài timeout
- Adapter retry với cùng {{external_ref}}; cổng ngoài phải idempotent theo ref (hoặc adapter kiểm tra trạng thái trước khi gửi lại).
- Nếu cổng ngoài không phản hồi sau N lần (ví dụ 5 lần trong 30 phút), transfer ở PENDING_EXTERNAL; job nền query cổng ngoài theo ref để chốt.
- Webhook từ cổng ngoài idempotent theo {{external_event_id}} (do cổng ngoài sinh).
- **Quan trọng**: Không bao giờ tạo transfer mới khi retry. Không retry "trừ tiền mù quáng" — chỉ tra cứu hoặc gửi lại cùng ref.

### Trạng thái treo và reconciliation
- Transfer PENDING_EXTERNAL quá X phút (ví dụ 10) được job quét; query cổng ngoài; nếu cổng nói thành công thì settle, nếu thất bại thì reverse, nếu không rõ thì giữ pending và alert.
- **Hằng ngày** tải file quyết toán (settlement file) từ cổng ngoài (CSV/SFTP/API), so khớp theo {{external_ref}}:
  - Có ở ta không có ở cổng ngoài (treo, webhook mất) -> query cổng, chốt.
  - Có ở cổng ngoài không có ở ta (webhook mất, adapter down) -> tạo transfer, settle.
  - Lệch số tiền -> alert, điều tra, bút toán điều chỉnh.
- Kết quả reconciliation lưu lại và có dashboard; "không có lệch" cũng phải chứng minh.

### Cô lập và khoá (deadlock avoidance)
- Chuyển tiền hai chiều (A->B và B->A cùng lúc): khoá tài khoản theo thứ tự {{account_id}} tăng dần (LEAST/GREATEST trong SQL, hoặc sort trong code trước khi UPDATE).
- Transaction ngắn; SERIALIZABLE cân nhắc kỹ vì gây retry.
- Số dư đọc từ bảng materialized balance, đối soát với ledger định kỳ.

### Failure modes
| Sự cố | Ảnh hưởng | Cách xử lý |
|---|---|---|
| Cổng ngoài down | Transfer treo PENDING_EXTERNAL | Giữ pending, retry exponential, alert, không tự reverse |
| DB primary failover | Mất ghi | Replica lag monitor, failover tự động, idempotency bảo vệ retry |
| Duplicate webhook | Settle hai lần | Conditional update WHERE status = PENDING_EXTERNAL |
| Client retry | Tạo hai transfer | Idempotency key unique |
| Outbox relay chậm | Cổng ngoài nhận trễ | Monitor lag, scale relay |
| Cổng ngoài trả lệch số tiền | Sai số dư | Reconciliation bắt, bút toán điều chỉnh, alert |

### Giám sát
- Pending count theo tuổi (0-5p, 5-30p, 30p+), p99 latency end-to-end, external gateway success rate theo gateway, reconciliation mismatch count, DLQ size.
- Alert khi pending quá hạn tăng hoặc mismatch > 0.

> Senior tip: bài học đắt nhất là đừng bao giờ để số dư là nguồn sự thật duy nhất. Khi có sự cố, ledger append-only cho phép dựng lại toàn bộ lịch sử và chứng minh với cổng ngoài; một bảng balance bị UPDATE sai thì không có cách nào biết nó sai từ lúc nào. Và **luôn sinh {{external_ref = transfer.id}}** (không random) để reconciliation tra cứu được 1-1 mà không cần mapping table phức tạp.`,
  followups: [
    'Nếu traffic tăng x10 trong 1 giờ (flash sale nạp tiền), kiến trúc thay đổi thế nào?',
    'Mất một region (multi-region), bạn khôi phục và đối soát ra sao?',
    'Cổng ngoài thay đổi từ async sang sync, bạn điều chỉnh gì?',
    'Thiết kế API hoàn tiền một phần (partial refund) trên ledger ra sao?',
    'Nếu cổng ngoài không hỗ trợ idempotency key, bạn đảm bảo không trừ hai lần thế nào?'
  ],
  related: ['design-005', 'banking-004', 'microservices-022']
},
{
  id: 'sd-034',
  title: 'Distributed job scheduler (lập lịch cron cho hàng triệu job, đảm bảo chạy đúng một lần, retry, phân vùng theo shard)',
  kind: 'bigtech',
  level: 'lead',
  prompt: `Công ty cần một **job scheduler dùng chung** (platform nội bộ) cho 50 team: các team đăng ký job cron ("chạy 02:00 mỗi ngày"), job delayed ("gọi webhook X sau 3 ngày"), job recurring với rate limit. Quy mô: **50 triệu job/ngày**, trong đó 20% (10 triệu) dồn đúng các giờ tròn (00:00, 02:00, 06:00, 09:00). Yêu cầu: chạy trễ không quá 5 giây so với giờ hẹn, **không mất job**, **chạy đúng một lần** (exactly-once semantic cho phía downstream), không làm sập service đích (rate limit, backpressure), multi-tenant fairness. Bạn có 45 phút.`,
  phases: [
    { name: 'Requirements', minutes: 5, guide: `Functional: tạo/huỷ job một lần (run_at), cron có timezone (IANA), payload JSON, retry policy (max_attempts, backoff), callback HTTP hoặc publish Kafka, idempotency key cho callback. Non-functional: at-least-once (exactly-once downstream nhờ idempotency key), trễ < 5 giây, multi-tenant, rate limit theo service đích. Hỏi: độ chính xác cần thiết (có chấp nhận dàn tải không), job xa nhất (1 năm?), có cần exactly-once thực sự không (thường không, đích phải idempotent). Out-of-scope: workflow engine (DAG), human approval.` },
    { name: 'Estimation', minutes: 5, guide: `50M/ngày => ~580 job/s trung bình. Nếu 20% (10M) hẹn đúng 09:00:00 thì cần 10M trong vài giây - không thể; dàn đều trong cửa sổ max_delay (mặc định 10 phút) => ~16.700 job/s. Lưu: 50M x 500 B = 25 GB/ngày; giữ lịch sử 30 ngày ~ 750 GB => partition theo ngày. Metadata: 50M job x ~1 KB = 50 GB, cần shard.` },
    { name: 'API & data model', minutes: 5, guide: `POST /jobs {{tenant, run_at | cron_expr + tz, target {{type: http|kafka, url|topic, headers}}, payload, idempotency_key, max_delay_sec, retry_policy}} -> job_id; DELETE /jobs/{{id}}; GET /jobs/{{id}}/history. Bảng jobs (id, shard_key, due_at, status, attempt, lease_until, tenant, target, payload, idempotency_key, cron_expr, tz, next_run_at, version), partition theo due_at (ngày), index (shard_key, status, due_at). Bảng job_executions (job_id, attempt, started_at, finished_at, status, response_code, error).` },
    { name: 'High-level design', minutes: 15, guide: `Vẽ: API -> DB (sharded by tenant/hash, partition by day); Scheduler node sở hữu lease trên một số shard -> quét job sắp tới hạn (due_at <= now + 60s) bằng FOR UPDATE SKIP LOCKED -> nạp vào timing wheel trong RAM -> đúng giờ đẩy vào Kafka topic jobs.due (key = target) -> Executor pool gọi đích (rate limit theo target) -> cập nhật trạng thái; retry với backoff; DLQ. Cron: sau khi chạy xong, tính next_run_at và INSERT lần kế tiếp trong cùng transaction.` },
    { name: 'Deep dive', minutes: 15, guide: `Đào sâu: claim job không trùng (SKIP LOCKED + lease), node chết thì job được claim lại, giờ cao điểm 09:00 (dàn tải max_delay), backpressure khi đích chậm (token bucket per target), cron và DST (múi giờ có DST), fairness giữa tenant (priority queue theo tier), chỉ số lag = now - due_at, exactly-once downstream (idempotency key + sink idempotent).` }
  ],
  rubric: [
    'Ước lượng trung bình và đỉnh tại giờ tròn, nhận ra cần dàn tải (max_delay_sec)',
    'Lưu job bền vững trong DB, partition theo thời gian (ngày), shard theo tenant/hash',
    'Claim job bằng FOR UPDATE SKIP LOCKED + lease, node chết thì job được claim lại',
    'Hai tầng: DB cho job xa, timing wheel/hàng đợi trong RAM cho job sắp tới',
    'At-least-once + idempotency key gửi kèm cho đích, sink idempotent',
    'Rate limit và backpressure theo service đích (token bucket per target)',
    'Retry có exponential backoff + jitter, DLQ và replay tool',
    'Cron: tính lần chạy kế tiếp theo timezone, xử lý DST và misfire policy',
    'Fairness giữa tenant (quota, priority queue, tier)',
    'Metric lag = thời điểm chạy thật - due_at, p99 lag < 5 giây, alert theo tenant'
  ],
  reference: `**Tóm tắt:** Job được lưu bền trong DB chia shard theo tenant/hash và partition theo ngày. Mỗi scheduler node giữ **lease** trên một nhóm shard, cứ vài giây quét các job sắp tới hạn bằng **FOR UPDATE SKIP LOCKED**, nạp vào **timing wheel** trong RAM, đến giờ thì đẩy sang Kafka cho executor gọi đích. Giao **at-least-once** nên đích phải idempotent; đỉnh giờ tròn được xử lý bằng dàn tải (max_delay_sec) và rate limit theo đích. Cron được xử lý bằng việc tính {{next_run_at}} sau mỗi lần chạy và INSERT trong cùng transaction.

### Yêu cầu
- Job một lần (run_at) và cron có timezone (IANA, ví dụ Asia/Ho_Chi_Minh). Đích là HTTP callback hoặc topic Kafka.
- Trễ < 5 giây, không mất job, chạy ít nhất một lần (exactly-once thực sự là không thể khi gọi HTTP ra ngoài — downstream phải idempotent).
- Không biến scheduler thành "vũ khí DDoS" bắn 1 triệu request vào service đích lúc 09:00.
- Multi-tenant: 50 team, cách ly quota và độ ưu tiên.

### Ước lượng
| Đại lượng | Phép tính | Kết quả |
|---|---|---|
| Trung bình | 50.000.000 / 86.400 | ~580 job/s |
| Dồn đúng 09:00 | 20% x 50M = 10M job | không thể chạy trong 1 giây |
| Dàn trong 10 phút (max_delay_sec=600) | 10.000.000 / 600 | ~16.700 job/s |
| Lưu trữ/ngày | 50M x 500 B | 25 GB |
| Giữ 30 ngày | 25 GB x 30 | ~750 GB |

Bài học: phải hỏi chủ job "có cần đúng 09:00:00 không?". Phần lớn job nhắc nhở, báo cáo chấp nhận trễ vài phút => API có trường {{max_delay_sec}} (mặc định 600s) để scheduler được phép dàn ra.

### Kiến trúc
~~~text
  Team A/B/C --POST /jobs--> [Job API] --INSERT--> [DB: 64 shards, partition by day]
                                                            ^      |
                                             lease shard 0..15  |      | quét: due_at <= now() + 60s
                                                            |      v
                                               [Scheduler node 1] timing wheel (RAM, ô 1 giây)
                                               [Scheduler node 2] ...       |
                                               [Scheduler node 3] ...       | đến giờ
                                                                           v
                                                                 [Kafka: jobs.due, key = target]
                                                                           |
                                                             [Executor pool] -- rate limit per target --> service đích
                                                                   | thành công: DONE | lỗi: retry backoff | hết lượt: DLQ
~~~

### Claim job không trùng (SKIP LOCKED + Lease)
~~~sql
-- Chạy mỗi 5 giây trên mỗi shard mà node đang giữ lease
WITH due AS (
  SELECT id FROM jobs
  WHERE shard_key = :shard AND status = 'PENDING' AND due_at <= now() + interval '60 seconds'
  ORDER BY due_at
  LIMIT 1000
  FOR UPDATE SKIP LOCKED          -- node khác đang claim thì bỏ qua, không chờ
)
UPDATE jobs j SET status = 'CLAIMED', lease_until = now() + interval '2 minutes', attempt = attempt + 1
FROM due WHERE j.id = due.id
RETURNING j.id, j.due_at, j.target, j.payload, j.idempotency_key, j.retry_policy;
~~~
- **Vì sao cần lease?** Node claim xong rồi chết thì job kẹt ở CLAIMED. Một tiến trình dọn (reaper) chạy mỗi 30 giây: {{UPDATE jobs SET status = 'PENDING' WHERE status = 'CLAIMED' AND lease_until < now()}} => node khác chạy lại. Đây là nguồn chạy trùng duy nhất, chấp nhận được vì at-least-once + idempotency key.
- **Vì sao 2 tầng (DB + timing wheel)?** Quét DB mỗi giây để bắt đúng giây là rất tốn. Quét trước 60 giây, nạp vào timing wheel (mảng 60 ô, mỗi ô là danh sách job của giây đó) rồi một thread tick mỗi giây lấy ô hiện tại => chính xác tới giây mà DB chỉ bị quét mỗi 5 giây.

### Timing Wheel trong RAM
~~~java
// Mỗi scheduler node có một timing wheel cục bộ cho các shard nó sở hữu
class TimingWheel {
    private final List<List<Job>> slots = new ArrayList<>(60); // 60 giây
    private int currentSlot = 0;
    private final ScheduledExecutorService tick = Executors.newSingleThreadScheduledExecutor();

    TimingWheel() {
        for (int i = 0; i < 60; i++) slots.add(new ArrayList<>());
        tick.scheduleAtFixedRate(this::tick, 1, 1, TimeUnit.SECONDS);
    }

    void add(Job job) {
        int delaySec = (int) (job.dueAt.toEpochMilli() - System.currentTimeMillis()) / 1000;
        if (delaySec < 0) delaySec = 0;
        if (delaySec >= 60) delaySec = 59; // không nên xảy ra vì quét 60s
        int slot = (currentSlot + delaySec) % 60;
        slots.get(slot).add(job);
    }

    void tick() {
        List<Job> due = slots.get(currentSlot);
        slots.set(currentSlot, new ArrayList<>());
        currentSlot = (currentSlot + 1) % 60;
        for (Job job : due) {
            // đẩy sang Kafka jobs.due, key = target.url hoặc target.topic
            kafkaProducer.send(new ProducerRecord<>("jobs.due", job.targetKey, job));
        }
    }
}
~~~
- Mỗi node chỉ quản lý timing wheel cho các shard nó lease.
- Job đẩy sang Kafka với {{key = target}} (URL hoặc topic) để cùng một đích rơi vào cùng partition -> executor xử lý tuần tự theo đích.

### Backpressure và Fairness
- Kafka key = target nên một đích chậm chỉ làm chậm partition của nó, không chặn đích khác.
- Executor có **token bucket** cho từng target (ví dụ billing-service tối đa 500 req/s, notification-service 5.000 req/s). Vượt thì job chờ trong bộ nhớ executor, lag tăng có chủ đích thay vì làm sập đích.
- **Fairness giữa tenant:** Mỗi tenant có quota job/phút (ví dụ tier FREE 1.000, PRO 10.000, ENTERPRISE 100.000). Scheduler node ưu tiên claim job của tenant tier cao hơn khi tải cao (priority queue trong claim query: {{ORDER BY tenant_priority DESC, due_at}}). Hoặc tách shard theo tier.

### Cron, Timezone, DST
- Lưu {{cron_expr}} (ví dụ {{0 2 * * *}}) + {{tz}} (IANA {{Asia/Ho_Chi_Minh}}). Sau mỗi lần chạy, tính {{next_fire_at}} bằng {{java.time.ZonedDateTime}} rồi {{INSERT}} lần kế tiếp **trong cùng transaction** với đánh dấu job hiện tại {{DONE}}.
- Ở vùng có DST, 02:30 có thể không tồn tại (spring forward) hoặc xảy ra hai lần (fall back): quy định rõ chính sách (ví dụ: spring forward -> chạy lúc 03:00; fall back -> chạy lần đầu, bỏ qua lần hai). Dùng {{ZonedDateTime}} với {{ZoneRules}} xử lý tự động.
- **Misfire policy** (scheduler dừng 1 giờ, job lỡ giờ): tenant chọn một trong ba: {{FIRE_ALL_MISSED}} (chạy bù tất cả), {{FIRE_LATEST_ONLY}} (chỉ chạy lần gần nhất), {{SKIP_MISSED}} (bỏ qua). Mặc định {{FIRE_LATEST_ONLY}}.

### Exactly-once cho phía downstream
Không có exactly-once delivery xuyên suốt HTTP. Cách đạt được **kết quả như exactly-once**:
1. Client cung cấp {{idempotency_key}} khi tạo job (hoặc scheduler sinh từ {{job_id + attempt}}).
2. Executor gửi HTTP kèm header {{Idempotency-Key: <key>}}; nếu Kafka thì {{key = idempotency_key}}.
3. Sink (đích) khử trùng theo key này.
4. Executor chỉ đánh dấu job {{DONE}} sau khi đích trả 2xx (hoặc Kafka ack). Lỗi 5xx/timeout -> retry.
5. Nếu executor chết sau khi đích đã xử lý nhưng chưa cập nhật DB: lần retry sau sẽ gửi lại cùng key -> đích khử trùng -> không chạy logic nghiệp vụ hai lần.

### Retry và DLQ
- Retry chỉ với lỗi tạm thời: timeout, 429, 5xx. Lỗi vĩnh viễn (4xx trừ 429) -> {{FAILED}} ngay, không retry.
- Exponential backoff + jitter: 10s, 1m, 5m, 30m, 2h, 6h (configurable trong {{retry_policy}}).
- Giới hạn {{max_attempts}} (mặc định 6) rồi đẩy {{DLQ}} (dead letter queue: bảng {{job_dlq}} hoặc Kafka topic {{jobs.dlq}}).
- DLQ phải có UI xem, công cụ replay (sửa payload rồi retry), và alert khi DLQ > 0.

### Trade-off
| Phương án | Ưu | Nhược |
|---|---|---|
| DB + SKIP LOCKED + timing wheel | Bền, truy vấn/huỷ job dễ, quen thuộc | Phải tự viết lease, tune index |
| Redis sorted set (score = due_at) | Rất nhanh, ZRANGEBYSCORE đơn giản | Bền vững kém hơn, RAM đắt khi giữ job 1 năm |
| Dịch vụ cloud (EventBridge Scheduler) | Không phải vận hành | Quota, chi phí theo số lần gọi, khoá vendor |
| Quartz cluster | Có sẵn cho Spring | Khoá DB tập trung, khó lên hàng chục triệu job/ngày |

### Senior vs Lead trả lời khác gì
- **Senior**: SKIP LOCKED + lease, at-least-once + idempotency key, retry/DLQ, timing wheel, partition theo ngày, cron next_run_at trong transaction.
- **Lead** thêm: SLO rõ ràng (99,9% job trễ < 5 giây) và metric lag theo tenant, onboarding/quota như một platform nội bộ, chính sách khi đích chậm (ai chịu trách nhiệm), kế hoạch rebalance shard khi thêm node, chi phí tự xây so với dịch vụ cloud, và dàn tải giờ tròn như một **chính sách sản phẩm** (max_delay_sec) chứ không chỉ là kỹ thuật. Còn phải xử lý multi-region active-active cho disaster recovery.

### Lỗi hay gặp
- Mọi node cùng SELECT job tới hạn không có SKIP LOCKED => chạy trùng hàng loạt hoặc chờ khoá nhau.
- Một leader duy nhất quét toàn bộ DB: leader trở thành nút thắt và điểm chết.
- Không gửi idempotency key cho đích, rồi trách scheduler khi khách bị gọi hai lần.
- Lưu job đã chạy chung bảng không partition => bảng phình, index chậm dần; xoá bằng DELETE thay vì DROP PARTITION.
- Cron dùng {{cron4j}}/{{Spring @Scheduled}} đơn luồng: một job lâu làm trễ toàn bộ hệ thống.

### Trả lời miệng 1 phút
"Trung bình chỉ ~580 job/giây, nhưng giờ tròn có thể dồn 10 triệu job, nên tôi dàn tải trong cửa sổ max_delay (mặc định 10 phút), ra khoảng 16.700 job/giây. Job lưu bền trong DB chia 64 shard theo tenant/hash, partition theo ngày. Scheduler node giữ lease trên nhóm shard, mỗi 5 giây claim job sắp tới hạn trong 60 giây bằng FOR UPDATE SKIP LOCKED, nạp vào timing wheel để bắn đúng giây sang Kafka. Executor gọi đích có token bucket rate limit theo target, retry exponential backoff + jitter, DLQ. Giao at-least-once nên mỗi lần gọi kèm idempotency key. Cron: sau khi chạy xong, tính next_run_at bằng ZonedDateTime (xử lý DST tự động) và INSERT trong cùng transaction. Metric chính là lag (now - due_at) theo percentile và theo tenant; alert khi p99 lag > 5 giây."

> Senior tip: metric quan trọng nhất của scheduler là **lag** (now - due_at) theo percentile và theo tenant, không phải số job chạy. Alert khi p99 lag > 5 giây sẽ bắt được mọi sự cố: DB chậm, node mất lease, đích bị rate limit, consumer Kafka dừng. Và **luôn hỏi chủ job "max_delay_sec bao nhiêu?"** — câu trả lời quyết định kiến trúc dàn tải.

### Ví dụ đời thực
Team marketing đăng ký job gửi email 1 triệu user lúc 09:00, {{max_delay_sec = 3600}} (1 giờ). Scheduler dàn 1 triệu job ra 277 job/s trong 1 giờ. Executor gọi email-service với rate limit 500 req/s, thực tế gửi ~277/s, hoàn thành trong 1 giờ. Cùng lúc team billing có job đối soát 100 job lúc 09:00, {{max_delay_sec = 60}} (1 phút), tier ENTERPRISE ưu tiên cao hơn => claim trước, chạy ngay, không bị chặn bởi job marketing.

### Giám sát
- Lag p50/p95/p99 theo tenant, theo target, tổng thể.
- Throughput job/s (claimed, executed, succeeded, failed, dlq).
- Queue depth per target (số job chờ rate limit).
- Lease health: số shard có lease, số shard lease hết hạn (node chết).
- Cron misfire count.

### Trả lời mẫu khi phỏng vấn
"Tôi thiết kế scheduler làm platform nội bộ. Job lưu trong Postgres sharded 64 shard, partition theo ngày. Mỗi scheduler node lease một nhóm shard, dùng FOR UPDATE SKIP LOCKED claim job sắp tới hạn 60 giây, nạp vào timing wheel RAM để bắn đúng giây sang Kafka. Executor có token bucket rate limit từng đích, retry backoff, DLQ. Giao at-least-once, khách hàng cung cấp idempotency_key khi tạo job, executor truyền kèm cho đích. Cron: sau khi chạy xong, dùng ZonedDateTime tính next_run_at (xử lý DST), INSERT lần kế tiếp trong cùng transaction. Dọn dẹp job cũ bằng DROP PARTITION. Metric vàng là lag p99 < 5s theo tenant. Lỗi thường gặp: không có SKIP LOCKED dẫn đến chạy trùng, không có idempotency key khiến đích chạy hai lần, cron dùng Spring @Scheduled đơn luồng bị một job chặn hết."

### Follow-ups
- 'Một job hẹn chạy sau 1 năm: lưu ở đâu cho rẻ, và huỷ nó thế nào?',
- 'Nếu một team cần đúng exactly-once (ví dụ trừ phí định kỳ), bạn phối hợp với service đích ra sao?',
- 'Thêm scheduler node mới thì chia lại shard thế nào mà không chạy trùng hoặc bỏ sót?',
- 'Service đích chết 2 giờ: 3 triệu job tồn đọng xử lý thế nào khi nó sống lại?',
- 'Multi-region active-active: job tạo ở region A, chạy ở region B khi A sập, thiết kế lease và timing wheel thế nào?'
`,
  followups: [
    'Một job hẹn chạy sau 1 năm: lưu ở đâu cho rẻ, và huỷ nó thế nào?',
    'Nếu một team cần đúng exactly-once (ví dụ trừ phí định kỳ), bạn phối hợp với service đích ra sao?',
    'Thêm scheduler node mới thì chia lại shard thế nào mà không chạy trùng hoặc bỏ sót?',
    'Service đích chết 2 giờ: 3 triệu job tồn đọng xử lý thế nào khi nó sống lại?',
    'Multi-region active-active: job tạo ở region A, chạy ở region B khi A sập, thiết kế lease và timing wheel thế nào?'
  ],
  related: ['design-013', 'design-029', 'microservices-051']
},
{
  id: 'sd-035',
  title: 'Dịch vụ ghi âm và tóm tắt cuộc họp bằng AI cho 50.000 người dùng',
  kind: 'bigtech',
  level: 'senior',
  prompt: `Thiết kế dịch vụ cho 50.000 người dùng có thể tải bản ghi âm cuộc họp lên, nhận bản chép lời và bản tóm tắt có mục hành động. Trung bình mỗi người có 2 cuộc họp mỗi tuần, dài 45 phút; file có thể dài tới 4 giờ. Xử lý bất đồng bộ, thông báo khi xong, chịu được nhà cung cấp speech-to-text hoặc LLM chậm/lỗi, kiểm soát chi phí và bảo vệ nội dung nhạy cảm. Người dùng có thể xem, chia sẻ và yêu cầu xoá cuộc họp. Bạn có 45 phút.`,
  phases: [
    { name: 'Requirements', minutes: 5, guide: `Chốt ai được tải/xem/chia sẻ; định dạng và giới hạn file; ngôn ngữ; có cần nhận diện người nói không; thời hạn lưu; xoá cả audio, transcript và bản tóm tắt; thông báo tiến độ; cho phép tải lại không. Chốt kỳ vọng: upload có thể tiếp tục sau mất mạng, xử lý không đồng bộ, 95% cuộc họp 45 phút hoàn tất trong 10 phút kể từ khi upload xong, còn file 4 giờ có thể lâu hơn. Nội dung âm thanh không được đưa vào log hay dùng huấn luyện nếu chưa có đồng ý.` },
    { name: 'Estimation', minutes: 5, guide: `Giả định 50.000 người dùng hoạt động, 2 cuộc họp/người/tuần: 100.000/7 ≈ 14.300 cuộc/ngày. Mỗi cuộc 45 phút => khoảng 643.000 phút audio/ngày. Nén audio mono 32 kbit/s: 32.000 bit/s ÷ 8 × 60 ≈ 240 KB/phút; 45 phút ≈ 10,8 MB; tổng gần 154 GB/ngày, chưa tính bản sao và metadata. Trung bình 446 phút audio/phút đồng hồ; nếu upload dồn giờ làm việc, dự trù đỉnh 10 lần ≈ 4.500 phút audio/phút. Tách bài toán dung lượng lưu trữ khỏi throughput STT; đặt quota và tính chi phí theo phút audio cùng token LLM, không đoán một mức giá nhà cung cấp cố định.` },
    { name: 'API & data model', minutes: 5, guide: `POST /meetings tạo bản ghi và trả meeting_id, upload URL có thời hạn (URL ký sẵn cho upload trực tiếp vào object storage) và giới hạn kích thước. POST /meetings/{id}/complete xác nhận upload; GET /meetings/{id} trả trạng thái; GET /meetings/{id}/transcript; DELETE /meetings/{id} yêu cầu xoá; POST /meetings/{id}/share tạo quyền chia sẻ. Bảng meetings (id, tenant_id, owner_id, status, object_key, duration_sec, language, created_at, deleted_at, version); meeting_chunks (meeting_id, chunk_no, time_offset, status, transcript_ref); outputs (meeting_id, kind, object_key, model_version); ACL/share grants. Lưu file lớn trong object storage như S3, không trong PostgreSQL hay Kafka.` },
    { name: 'High-level design', minutes: 15, guide: `Client -> API/Auth -> PostgreSQL + outbox; API phát URL ký sẵn để client upload multipart vào S3. Khi xác nhận upload, outbox relay đưa meeting_id và object_key (không phải audio bytes) vào Kafka. Worker kiểm định file, chia thành đoạn nếu cần, gọi speech-to-text (STT: chuyển giọng nói thành văn bản) qua provider adapter; lưu transcript có timestamp/speaker. Bước tóm tắt gửi transcript đã làm sạch tới LLM (mô hình ngôn ngữ lớn), lưu summary/action items; cập nhật trạng thái và phát notification. Kafka consumer xử lý at-least-once, mỗi bước idempotent theo meeting_id + phiên bản pipeline + chunk.` },
    { name: 'Deep dive', minutes: 15, guide: `File 4 giờ: chia đoạn 10–15 phút, overlap vài giây để không mất câu ở ranh giới; lưu offset thời gian để nối transcript. Tóm tắt phân cấp (tóm tắt từng đoạn rồi tổng hợp), giữ action item gắn timestamp, không gửi toàn bộ audio vào LLM. Quota theo tenant, giới hạn concurrency, queue riêng ưu tiên; retry lỗi tạm thời có exponential backoff+jitter, lỗi vĩnh viễn/DLQ có công cụ replay. Xử lý xoá đang chạy và race giữa retry với DELETE. KMS mã hoá object/database, TLS, IAM tối thiểu, kiểm tra quyền theo tenant trên mọi API, retention và audit; không ghi transcript vào log. Theo dõi queue age, phút audio chờ, tỉ lệ lỗi theo provider, chi phí mỗi phút và thời gian hoàn tất.` }
  ],
  rubric: [
    'Nêu giả định sử dụng và tính số meeting, audio-minutes, dung lượng nén/ngày, peak theo burst',
    'Upload trực tiếp multipart vào object storage bằng URL ký sẵn; không chuyển audio lớn qua API, DB hoặc Kafka',
    'Mô hình trạng thái bất đồng bộ và outbox để không mất job giữa commit database và publish Kafka',
    'Chia file dài thành chunks có overlap, giữ offset và xử lý thứ tự/ghép transcript',
    'Tóm tắt phân cấp để không vượt context window, kiểm soát token và chi phí',
    'At-least-once + idempotency theo meeting/version/chunk; retry lỗi tạm thời, DLQ lỗi vĩnh viễn',
    'Provider adapter, giới hạn concurrency/quota, circuit breaker và fallback có kiểm soát',
    'Mã hoá, kiểm tra quyền tenant, consent, retention, xoá audio và mọi output, tránh nội dung trong log',
    'Nêu trade-off SLA và chi phí, ưu tiên queue và metrics theo phút audio/chi phí',
    'Nêu race/failure: upload dở dang, worker chết, callback trễ, xoá trong khi job chạy'
  ],
  reference: `**Tóm tắt:** Tôi tách dịch vụ thành control plane (API, quyền, trạng thái) và worker xử lý nền. Audio tải thẳng vào object storage, Kafka chỉ mang tham chiếu và trạng thái job; worker chuyển giọng nói thành transcript theo chunk, rồi dùng LLM tóm tắt phân cấp. Mỗi bước có trạng thái bền vững, idempotency, quota và chính sách xoá xuyên suốt audio lẫn kết quả. Chi phí được dự toán từ phút audio và token, không để một lần retry tạo chi phí vô hạn hay kết quả trùng lặp.

### 1. Yêu cầu và giả định
- 50.000 người dùng hoạt động, trung bình 2 cuộc họp mỗi tuần; cuộc họp 45 phút, trường hợp dài nhất 4 giờ.
- Upload có thể tiếp tục sau lỗi mạng; người dùng thấy trạng thái QUEUED, TRANSCRIBING, SUMMARIZING, COMPLETED hoặc FAILED.
- Chủ sở hữu mới xem được nội dung; chia sẻ phải cấp quyền rõ ràng và có thể thu hồi. Nội dung mặc định riêng tư.
- Mục tiêu đề xuất: 95% cuộc họp 45 phút hoàn tất trong 10 phút sau upload. Không cam kết cùng SLA cho file 4 giờ hoặc lúc nhà cung cấp suy giảm.
- Có chính sách lưu giữ, đồng ý ghi âm, khu vực lưu dữ liệu và xoá theo yêu cầu. Đây là yêu cầu sản phẩm/pháp lý cần xác nhận, không mặc định tự dùng dữ liệu để huấn luyện.

### 2. Ước lượng có thể kiểm tra
14.300 cuộc/ngày x 45 phút ≈ 643.500 phút audio/ngày. Audio mono nén 32 kbit/s tương đương khoảng 240 KB/phút; 643.500 x 240 KB ≈ 154 GB/ngày. Dữ liệu thực tế phụ thuộc codec, ngôn ngữ và audio stereo; đo trên sample trước khi chốt ngân sách.

643.500 / 1.440 ≈ 447 phút audio mỗi phút đồng hồ trung bình. Nếu upload giờ làm việc tạo đỉnh gấp 10 lần, STT phải tiêu thụ gần 4.470 phút audio/phút. Đây là throughput của audio được xử lý, không phải số request HTTP: file 45 phút là một job nhưng tốn 45 phút năng lực STT. Nếu chia chunk 15 phút thì trung bình mỗi cuộc có 3 chunk; file 4 giờ có 16 chunk.

Chi phí biến đổi xấp xỉ: tổng phút audio x đơn giá STT/phút + tổng input/output token LLM x đơn giá tương ứng + lưu trữ, request và egress. Ước token bằng transcript thực tế theo ngôn ngữ; ví dụ 45 phút họp có 4.500 từ thì transcript có thể vào khoảng vài nghìn token, còn cách chia chunk và lời nhắc làm thay đổi lượng token. Đặt ngân sách tenant, giới hạn độ dài, hiển thị ước tính và đo chi phí trên từng meeting; không giả định giá cố định vì giá và chất lượng khác provider/model.

### 3. API và dữ liệu
1. {{POST /meetings}}: xác thực tenant, tạo meeting UPLOADING, trả ID và URL ký sẵn có hạn ngắn. Client upload nhiều phần trực tiếp lên S3; API không giữ kết nối hàng giờ.
2. {{POST /meetings/{id}/complete}}: xác nhận upload hoàn tất. Server kiểm tra owner, kích thước, checksum, loại file và quota trước khi chuyển sang QUEUED.
3. {{GET /meetings/{id}}}: trả trạng thái, tiến độ theo giai đoạn và lỗi đã làm sạch; {{GET /meetings/{id}/transcript}} trả transcript nếu caller có quyền.
4. {{DELETE /meetings/{id}}}: đánh dấu DELETING ngay, từ chối đọc/chạy job mới, sau đó xoá object, transcript, summary và bản sao theo retention.

Bảng {{meetings}} lưu id, tenant_id, owner_id, status, object_key, duration_sec, language, version, created_at, deleted_at. {{meeting_chunks}} lưu chunk_no, time_offset, trạng thái và transcript_ref. {{outputs}} lưu phiên bản transcript/summary và model/pipeline version. ACL tách quyền xem/chia sẻ. PostgreSQL giữ metadata và trạng thái; object storage giữ file audio và output lớn. Không đưa audio bytes vào Kafka vì log broker sẽ phình và khó áp dụng chính sách xoá.

### 4. Luồng kiến trúc
~~~seq
title: Upload và xử lý cuộc họp
actors: Client | API | S3 | Kafka | Worker | STT/LLM
Client -> API: POST /meetings, nhận URL ký sẵn
Client -> S3: Upload multipart audio
Client -> API: complete upload
API -> Kafka: meeting_id + object_key qua outbox
Kafka -> Worker: nhận job, kiểm tra phiên bản
Worker -> S3: đọc audio, chia chunk
Worker -> STT/LLM: transcript rồi summary
Worker -> API: ghi output, cập nhật trạng thái
API --> Client: trạng thái COMPLETED / notification
~~~

**Outbox** là bảng ghi event cùng transaction với thay đổi database. Nếu chỉ commit meeting rồi publish Kafka, tiến trình có thể chết ở khoảng giữa và job bị mất; outbox relay thử publish lại, consumer khử trùng bằng ID. Kafka giao ít nhất một lần trong nhiều cấu hình thực tế, vì vậy worker phải chấp nhận cùng event đến lặp.

### 5. File dài và pipeline
Kiểm tra container/codec, thời lượng, checksum và malware trước khi gọi provider. Chia audio dài thành chunk khoảng 10–15 phút với overlap nhỏ, ví dụ 2 giây; ghi offset gốc để câu nói ở ranh giới không mất và timestamps ghép lại chính xác. Chunk có khoá duy nhất (meeting_id, pipeline_version, chunk_no); retry ghi đè cùng kết quả thay vì tạo transcript thứ hai.

Sau STT, chuẩn hoá transcript theo timestamp và người nói nếu provider hỗ trợ. Không giả định diarization (ước lượng ai đang nói) luôn chính xác; cho phép sửa tay và thể hiện độ không chắc. Với transcript dài, chia theo đoạn/chủ đề, yêu cầu LLM tóm tắt từng đoạn, rồi tổng hợp các bản tóm tắt thành quyết định, vấn đề mở và action items. Cách map-reduce này tránh gửi văn bản dài vượt giới hạn ngữ cảnh; lưu liên kết timestamp để người dùng kiểm chứng. LLM có thể bịa hoặc bỏ sót, nên tóm tắt là gợi ý có nguồn dẫn chứ không thay transcript.

### 6. Hàng đợi, lỗi và độ trễ
Lưu state machine ở database; Kafka phân phối job. Dùng consumer group để tăng worker, nhưng đặt concurrency theo quota của provider và tenant. Queue age (tuổi job cũ nhất), phút audio đang chờ, thời gian STT/LLM và tỉ lệ retry là tín hiệu scale hữu ích hơn chỉ nhìn CPU.

Timeout hoặc 429/5xx: retry có exponential backoff và jitter, giới hạn số lần; lỗi file không hỗ trợ hoặc vượt quota là lỗi vĩnh viễn để FAILED, không retry tốn tiền. Sau giới hạn, đưa metadata vào DLQ (dead-letter queue) để điều tra/replay có kiểm soát. Circuit breaker tạm ngừng gọi provider đang lỗi; adapter cho phép đổi provider, nhưng không tự gửi cùng nội dung sang provider khác nếu chính sách tenant/region chưa cho phép. Gửi thông báo chỉ sau khi trạng thái đã commit.

### 7. Bảo mật, xoá và chi phí
TLS khi truyền; mã hoá object và database bằng khoá quản lý như AWS KMS; IAM giới hạn worker theo bucket/prefix. URL ký sẵn chỉ có quyền upload một object, thời hạn ngắn; mọi API kiểm tra tenant và ACL ở server, không tin tenant_id do client tự khai. Không ghi audio, transcript, prompt hoặc token vào log/trace; che dữ liệu nhạy cảm khỏi thông báo.

DELETE đặt cờ DELETING và tăng version để worker cũ không thể công bố output sau khi xoá. Huỷ job đang chờ, xoá audio/chunks/transcript/summary, thu hồi share, xử lý bản sao/backup theo retention đã công bố, rồi ghi audit event không chứa nội dung. Có thể giữ bằng chứng xoá tối thiểu theo nghĩa vụ pháp lý, nhưng phải quyết định rõ.

Chi phí được giới hạn bằng quota phút/ngày, max duration, ngân sách theo tenant, giới hạn token, model rẻ cho việc thường và model tốt hơn chỉ khi cần. Retry có thể gây gọi provider lần nữa nếu timeout xảy ra sau khi provider đã xử lý; ghi attempt và chi phí theo provider, dùng idempotency phía provider nếu có, không hứa rằng request mạng là exactly-once.

### Trade-off và tình huống thực tế
Đánh đổi: upload nhanh và pipeline async dễ chịu file lớn nhưng người dùng phải chờ; gọi STT/LLM chất lượng cao hơn nhưng tăng chi phí/latency; giữ audio lâu giúp kiểm chứng nhưng tăng rủi ro và chi phí. Một đợt họp cuối ngày làm queue tăng: ưu tiên tenant trong quota, scale worker tới hạn concurrency của provider, hiển thị thời gian chờ thay vì mở rộng vô hạn và vượt ngân sách.

Ví dụ vận hành: sau một đợt upload 3.000 bản ghi 45 phút, dashboard cho thấy queue age tăng từ 2 lên 18 phút, nhưng worker CPU vẫn thấp. Phân tích cho thấy STT provider trả 429; tăng pod không giúp vì giới hạn nằm ở nhà cung cấp. Hệ thống giảm concurrency, áp dụng backoff+jitter, dừng retry lỗi vĩnh viễn và chuyển người dùng sang trạng thái đang chờ. Khi quota được nâng, backlog giảm; chi phí được đối chiếu từ số phút audio và số lần gọi thực tế.

### Trả lời mẫu khi phỏng vấn
Tôi sẽ bắt đầu bằng upload trực tiếp lên object storage, dùng URL có chữ ký ngắn hạn để API không phải proxy file hàng trăm megabyte. Sau complete, ghi trạng thái và outbox trong cùng transaction; Kafka chỉ mang meeting ID và object key. Worker kiểm tra file, chia audio dài thành chunk có overlap và timestamp, gọi STT, sau đó tóm tắt phân cấp để transcript không vượt giới hạn ngữ cảnh của LLM. Mỗi chunk và mỗi phiên bản pipeline có khoá idempotent vì queue giao at-least-once. Với 50.000 người, giả định hai cuộc họp mỗi tuần thì khoảng 643.000 audio-minutes mỗi ngày; tôi dùng con số đó để tính throughput và dự toán theo giá STT/phút, token, storage. Tôi giới hạn quota/concurrency, retry lỗi tạm thời có backoff và DLQ cho lỗi vĩnh viễn. Cuối cùng, quyền theo tenant, mã hoá, không log nội dung và DELETE phải xoá cả audio lẫn mọi output, kể cả ngăn worker cũ ghi kết quả trở lại.

> Senior tip: theo dõi chi phí trên mỗi audio-minute và queue age theo tenant. Đừng chỉ scale theo CPU: STT thường bị giới hạn bởi quota nhà cung cấp, còn retry sau timeout có thể bị tính phí dù client chưa nhận response.`,
  followups: [
    'Nếu provider STT trả kết quả theo callback nhưng callback có thể đến trùng hoặc sai thứ tự, bạn lưu và hợp nhất thế nào?',
    'Người dùng yêu cầu xoá đúng lúc LLM đang chạy; làm sao ngăn output được tạo lại sau khi đã xoá?',
    'Làm sao chứng minh một câu action item trong summary xuất phát từ đoạn transcript nào?',
    'Nếu dữ liệu của tenant phải ở một region cụ thể, thay đổi routing, storage và provider thế nào?',
    'Provider bị 429 trong giờ cao điểm; bạn chọn giữa queue lâu, từ chối upload hay chuyển provider ra sao?'
  ],
  related: ['design-016', 'ai-001', 'microservices-051']
},
{
  id: 'sd-036',
  title: 'Nền tảng feature flag dùng chung cho nhiều ứng dụng',
  kind: 'bigtech',
  level: 'senior',
  prompt: `Thiết kế nền tảng feature flag dùng chung cho 50 team và nhiều ứng dụng backend, web, mobile. Team cần tạo flag, nhắm theo thuộc tính người dùng, rollout theo phần trăm, tắt khẩn cấp và xem ai đã đổi cấu hình. Đánh giá flag phải nhanh, không làm request nghiệp vụ phụ thuộc mạng điều khiển; thay đổi phải lan tới ứng dụng trong vài giây. So sánh đánh giá tại client/server, thiết kế cache, phân phối cấu hình, rollout ổn định, audit và xử lý khi control plane hoặc mạng bị lỗi. Bạn có 45 phút.`,
  phases: [
    { name: 'Requirements', minutes: 5, guide: `Làm rõ loại flag: release, experiment, operational kill switch; ai tạo/sửa/duyệt; số environment và region; SLA cập nhật; cần targeting thuộc tính nào; flag client có chứa dữ liệu nhạy cảm không; ai được tắt khẩn cấp. Chốt đánh giá local dưới 1 ms p99 trong ứng dụng, cập nhật cấu hình trong 5 giây p95, SDK vẫn đánh giá được khi control plane mất mạng. Flag không phải authorization: quyền truy cập vẫn phải được kiểm tra độc lập.` },
    { name: 'Estimation', minutes: 5, guide: `Giả định 50 team, 20 ứng dụng/team, 20 instance/app => 20.000 instance SDK. Mỗi instance đánh giá local 500 lần/giây => 10 triệu đánh giá/giây, nhưng không đi qua server trung tâm. Nếu instance lấy snapshot mỗi 30 giây thì khoảng 667 lần lấy/giây; 10 KB cấu hình/app tương đương khoảng 200 MB mỗi lần nhân bản cho toàn bộ instance, nên cần delta, cache CDN/edge hoặc streaming và nén. Control plane ghi cấu hình thấp hơn nhiều, ví dụ vài trăm thay đổi/phút; cần ưu tiên an toàn và audit hơn throughput ghi.` },
    { name: 'API & data model', minutes: 5, guide: `Management API: POST /projects/{p}/flags; PATCH /flags/{key}/rules; POST /flags/{key}/publish; GET /audit?flag_key=. Runtime: SDK lấy snapshot có version/ETag, stream notification phiên bản mới; server evaluation endpoint chỉ là lựa chọn khi rule nhạy cảm hoặc cần kết quả tập trung. Model: project/environment, flag(key, type, default, owner, expiry), immutable flag_version, ordered rules/segments, audit_event(actor, action, before_hash, after_hash, reason, time). Mỗi flag có unique project+environment+key; giữ phiên bản cũ để rollback.` },
    { name: 'High-level design', minutes: 15, guide: `Control plane: UI/API -> auth/RBAC -> PostgreSQL -> audit + event/outbox -> config publisher. Data plane: SDK bootstrap lấy snapshot có version; cập nhật qua SSE/long polling hoặc polling có jitter; snapshot được cache tại CDN/edge nếu phù hợp. SDK kiểm tra rules local và cache evaluation theo context/version. Server-side SDK giữ attributes nhạy cảm; client SDK chỉ nhận rule an toàn đã lọc hoặc evaluated values. Kill switch phát thay đổi ưu tiên cao; SDK cập nhật local atomic snapshot, không để cấu hình nửa cũ nửa mới.` },
    { name: 'Deep dive', minutes: 15, guide: `Rollout 10%: bucket ổn định từ hash(flag key + stable subject ID + salt) thành 0..9999; bật khi bucket < 1000. Không dùng random mỗi request vì user đổi trạng thái liên tục. Xác định ưu tiên rule, segment, multi-variate allocation, missing attribute và default. Cache theo flag + context đã chuẩn hoá + config version; không cache toàn cục kết quả nếu phụ thuộc user. Mất kết nối: dùng snapshot cuối cùng có TTL và default an toàn theo từng flag; phân biệt release flag với kill switch. Audit bất biến, RBAC, approval cho production, rollout canary, rollback; metric propagation delay, stale SDK, evaluation error, rule count.` }
  ],
  rubric: [
    'Tách control plane (quản lý/publish) khỏi data plane (đánh giá lúc runtime)',
    'So sánh local SDK evaluation với remote/server evaluation về latency, availability, rule secrecy và consistency',
    'Tính tải evaluation nhưng không đẩy mọi lần evaluate qua control plane; tính quy mô config propagation',
    'Thiết kế snapshot versioned, atomic update, ETag/delta/stream hoặc polling có jitter',
    'Rollout phần trăm deterministic theo flag + stable subject ID + salt, nhất quán qua request',
    'Rule precedence, default khi thiếu thuộc tính, cache key/version và tránh rò dữ liệu giữa user',
    'Offline/stale policy khác nhau theo loại flag; kill switch cần cơ chế lan truyền ưu tiên',
    'Audit append-only, RBAC, approval/rollback, owner và expiry để dọn flag cũ',
    'Không dùng feature flag thay authorization; không gửi secret targeting rules xuống client',
    'Nêu metrics, sự cố propagation/mạng và trade-off consistency vs availability'
  ],
  reference: `**Tóm tắt:** Tôi tách control plane quản trị flag khỏi data plane đánh giá flag. SDK lấy snapshot có phiên bản và đánh giá ngay trong tiến trình để request không phụ thuộc một lần gọi mạng; cấu hình mới được phân phối bằng stream hoặc polling có cache. Rollout phần trăm dựa trên hash ổn định của flag và subject, không random mỗi request. Với client, chỉ phát rule không nhạy cảm; audit, phân quyền và cách dùng snapshot cũ phải được định nghĩa rõ cho từng loại flag.

### 1. Yêu cầu và SLO
- Nền tảng cho 50 team và backend/web/mobile; flag có kiểu boolean hoặc variant, môi trường dev/staging/prod, rule theo thuộc tính và rollout.
- Evaluation local p99 < 1 ms; cấu hình publish lan tới SDK p95 < 5 giây, p99 < 30 giây. Đây là mục tiêu cần đo ở từng region, không phải cam kết khi client offline.
- Tắt khẩn cấp phải được ưu tiên phân phối. Tạo/sửa flag cần owner, lý do, quyền theo project/environment và audit.
- Feature flag điều khiển bật/tắt tính năng, không thay thế authorization. Không được cho phép user truy cập dữ liệu chỉ vì flag trả true.

### 2. Ước lượng
Giả sử 50 team x 20 ứng dụng/team x 20 instance/ứng dụng = 20.000 SDK instance. Mỗi instance xử lý 500 evaluation/giây => 10.000.000 evaluation/giây toàn nền tảng. Nếu mỗi lần gọi trung tâm, backend phải phục vụ 10 triệu request/giây và mọi request sản phẩm bị phụ thuộc mạng; vì vậy SDK local là lựa chọn mặc định.

Nếu mỗi instance kiểm tra cập nhật 30 giây/lần, trung bình 20.000/30 ≈ 667 lần lấy snapshot/giây; jitter làm đều các lần poll, tránh tất cả instance cùng thức một lúc. Với snapshot 10 KB, nhân bản 20.000 lần tốn 200 MB cho mỗi vòng cập nhật toàn bộ; nén, CDN/edge cache, ETag/long polling hoặc delta giúp giảm đáng kể. Thay đổi cấu hình thấp hơn nhiều so với evaluation, nhưng một kill switch có thể tạo fan-out lớn nên cần đo thời gian publish-to-last-SDK.

### 3. API và mô hình dữ liệu
Management API tạo và publish: {{POST /projects/{p}/flags}}, {{PATCH /flags/{key}/rules}}, {{POST /flags/{key}/publish}}; xem audit: {{GET /audit?flag_key=...}}. Mỗi thay đổi tạo version immutable, không sửa âm thầm version đã phát hành. Có thể rollback bằng cách phát một version mới có nội dung cũ.

SDK runtime lấy snapshot theo project/environment và version; ETag cho phép trả không thay đổi nếu cấu hình vẫn mới. SSE (kênh server gửi event một chiều) hoặc long polling báo có version mới; polling định kỳ là phương án dự phòng. Evaluation endpoint chỉ dùng khi rule cần giữ bí mật hoặc cần đánh giá tập trung; đánh đổi là thêm network latency và phụ thuộc availability.

Dữ liệu gồm project, environment, flag (key, type, default, owner, expiry), flag_version, ordered rules, segment và audit_event (actor, thời điểm, lý do, hành động, version trước/sau). Audit append-only; quyền xem/sửa/publish tách biệt, production có thể cần approval hai người. Key duy nhất theo project + environment để tránh cấu hình nhầm ứng dụng.

### 4. Luồng phân phối
~~~seq
title: Publish flag và evaluate trong ứng dụng
actors: Operator | Control API | DB | Publisher | SDK
Operator -> Control API: sửa rule, yêu cầu publish
Control API -> DB: ghi version và audit transaction
DB -> Publisher: outbox báo version mới
Publisher -> SDK: notification version qua SSE
SDK -> Control API: lấy snapshot version mới
Control API --> SDK: snapshot có ETag/version
SDK -> SDK: cập nhật snapshot atomic
SDK -> SDK: evaluate local theo context
~~~

Control plane là nơi quản lý quyền, lịch sử và phát hành; data plane là phần đọc cấu hình và đánh giá ở runtime. Ghi version và outbox cùng transaction tránh trường hợp UI báo publish thành công nhưng không có event phát đi. Publisher có thể gửi notification trùng; SDK so version và tải snapshot mới nhất. SDK thay snapshot nguyên tử (atomic), nghĩa là một evaluation nhìn thấy toàn bộ version cũ hoặc mới, không nhìn thấy nửa bộ rule.

### 5. Rollout phần trăm ổn định
Với rollout 10%, ánh xạ subject ID thành bucket 0..9999 bằng hash ổn định trên flag key, subject ID và salt của flag; bật nếu bucket < 1000. Cùng user/flag luôn vào cùng bucket dù request tới instance khác. Không dùng random mỗi lần evaluate vì user sẽ thấy tính năng bật rồi tắt; không dùng Java String.hashCode làm giao thức chung nếu client Java, JS và mobile phải cho kết quả như nhau. Chọn thuật toán hash cụ thể, serialization và test vector chung cho mọi SDK.

Rule có thứ tự và ưu tiên rõ: deny/allow segment cụ thể trước rollout tổng quát, cuối cùng default. Thiếu thuộc tính như country không được diễn giải tuỳ tiện thành match; rule phải định nghĩa fallback. Với experiment nhiều biến thể, phân vùng bucket không chồng lấn và giữ nguyên salt trong suốt experiment. Stable subject ID cần pseudonymous; không đưa email hay dữ liệu cá nhân vào hash nếu không cần.

### 6. Local, server và cache
| Cách đánh giá | Ưu | Nhược |
|---|---|---|
| Local SDK với snapshot | Rất nhanh, tiếp tục chạy khi control plane lỗi | Có độ trễ phân phối; rule trong client có thể bị xem |
| Server evaluation | Giữ rule/attribute nhạy cảm phía server, dễ kiểm soát trung tâm | Thêm network hop, tải lớn, phụ thuộc availability |
| Hybrid | Local cho backend, server cho quyết định cần bí mật | Hai luồng cần test để tránh khác kết quả |

Mặc định backend đánh giá local. Cache snapshot theo project/environment/version. Có thể cache kết quả theo flag + subject/context đã chuẩn hoá + version; nếu rule phụ thuộc thuộc tính thì cache key phải gồm các thuộc tính liên quan hoặc không cache kết quả. Không cache một giá trị theo flag rồi dùng chung cho mọi user. Client chỉ nhận các rule/segment được phép công khai; rule nhắm theo nhóm nhạy cảm nên đánh giá server-side.

SDK khởi động bằng snapshot nhúng hoặc cache gần nhất, rồi cập nhật nền. Mỗi flag cần policy khi stale: flag UI/release có thể dùng giá trị cuối cùng trong TTL ngắn; kill switch liên quan vận hành có thể chọn default fail-safe cụ thể, nhưng không có lựa chọn chung đúng cho mọi hệ thống. Ghi rõ tuổi snapshot và cảnh báo stale. Đừng để SDK đồng bộ gọi mạng trong hot path.

### 7. Audit, rollout an toàn và failure modes
Audit lưu ai đổi gì, ở môi trường nào, lý do, version và thời điểm; hạn chế quyền sửa prod, yêu cầu review cho thay đổi rủi ro, hỗ trợ rollback bằng version mới. Canary 1% rồi 10%, 50%, 100% dựa trên error rate/latency; có kill switch nhưng không thay cho rollback code. Gắn owner và expiry date; flag tồn lâu làm tăng nhánh điều kiện và test matrix.

Mạng đứt: tiếp tục từ snapshot cuối cùng theo TTL/policy; không làm request nghiệp vụ thất bại chỉ vì control plane không truy cập được. SSE rớt thì reconnect từ version đã biết rồi lấy full snapshot nếu delta thiếu. Publisher chậm: metric propagation delay và stale instance, ưu tiên kill switch. DB/control plane lỗi: không nhận publish mới nhưng evaluation local tiếp tục. Version sai hoặc schema không hỗ trợ: SDK giữ snapshot tốt gần nhất, báo lỗi telemetry, không áp dụng dữ liệu nửa đọc.

### Trade-off và tình huống thực tế
Local evaluation chọn độ trễ và availability thay vì cập nhật tức thời tuyệt đối: trong vài giây, hai instance có thể dùng version khác nhau. Nếu tính năng cần consistency mạnh (ví dụ hạn mức tiền), không dùng flag làm nguồn quyết định nghiệp vụ và không dựa vào propagation để khóa giao dịch; dùng cơ chế nghiệp vụ phù hợp.

Ví dụ: rollout 10% cho phiên bản checkout, một SDK dùng user ID còn SDK khác dùng session ID nên cùng khách thay đổi nhóm qua web/mobile và số liệu experiment sai. Khắc phục bằng contract subject ID thống nhất, hash test vector dùng chung và tăng canary theo version. Khi publish kill switch, đo timestamp publish tới SDK cuối cùng thay vì chỉ xác nhận API đã trả 200.

### Trả lời mẫu khi phỏng vấn
Tôi sẽ đặt API quản trị và lưu version/audit trong control plane, còn SDK là data plane. Mỗi instance tải snapshot theo environment, cập nhật bằng SSE hoặc polling có jitter, cache version gần nhất và evaluate local; như vậy hàng triệu evaluation mỗi giây không đi qua một service trung tâm. Rollout 10% dùng hash ổn định của flag key, subject ID và salt thành bucket 0 đến 9999, nên cùng user luôn nhận cùng kết quả trên mọi instance. Rule cần thứ tự và default rõ, còn cache phải gắn version và đủ context để không dùng nhầm kết quả của user khác. Client chỉ nhận rule không nhạy cảm; quyết định quyền truy cập vẫn kiểm tra ở backend. Tôi lưu audit bất biến, giới hạn quyền publish production, hỗ trợ rollback và expiry cho flag cũ. Khi mạng lỗi, SDK dùng snapshot theo policy từng flag và phát telemetry về độ stale; kill switch có ưu tiên phân phối, nhưng không giả vờ rằng mọi instance cập nhật tức thì.

> Senior tip: đo propagation delay từ lúc publish đến lúc SDK cuối cùng áp dụng version, cùng tỷ lệ SDK stale theo region. Evaluation nhanh mà một phần fleet vẫn dùng snapshot cũ là lỗi người dùng nhìn thấy; riêng kill switch nên có SLO và cảnh báo tách khỏi polling thông thường.`,
  followups: [
    'Làm thế nào để Java, JavaScript và mobile SDK tính cùng một rollout bucket với một user?',
    'Một kill switch phải lan trong 2 giây nhưng 5% SDK đang offline; bạn định nghĩa SLO và fallback ra sao?',
    'Cache kết quả của rule phụ thuộc country và plan thế nào để không trả nhầm flag giữa hai user?',
    'Flag nhắm theo nhóm nhân viên thử nghiệm có thuộc tính nhạy cảm; nên evaluate ở client hay server?',
    'Làm sao dọn flag hết hạn mà rollback vẫn kiểm toán và không làm hỏng client cũ?'
  ],
  related: ['design-013', 'microservices-006', 'architecture-014']
},
];
