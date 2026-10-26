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
}
];
