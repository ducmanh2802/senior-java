/* Track db: mô phỏng các cơ chế database bằng Java thuần để học và tự chấm. */
(window.LESSONS = window.LESSONS || []).push(
{
  id: 'lesson-db-001', track: 'db', order: 1,
  title: 'Isolation level qua lịch xen kẽ: dirty read, non-repeatable read và lost update',
  level: 'senior', minutes: 30,
  goals: ['Dựng được lịch hai transaction đọc/ghi xen kẽ', 'Phân biệt dirty read, non-repeatable read và lost update', 'Liên hệ isolation với MVCC của PostgreSQL'],
  body: `**Tóm tắt:** Isolation quyết định transaction nhìn thấy phiên bản dữ liệu nào khi nhiều transaction chạy đồng thời. Hãy mô tả lịch đọc/ghi cụ thể thay vì chỉ đọc thuộc tên mức isolation.

### Mô hình lịch xen kẽ
Database không nhất thiết chạy trọn T1 rồi mới đến T2. Scheduler có thể xen các thao tác: T1 đọc x=10, T2 ghi x=20, T2 commit, T1 đọc lại. Mỗi phép đọc nhận một giá trị theo chính sách isolation; do đó ta biểu diễn giao dịch thành các thao tác tường minh và cho chạy theo một thứ tự cố định.

Dirty read xảy ra khi T1 đọc giá trị T2 đã ghi nhưng chưa commit. Nếu T2 rollback, T1 đã dùng một giá trị không bao giờ trở thành dữ liệu bền vững. Non-repeatable read là cùng một transaction đọc cùng một hàng hai lần nhưng nhận hai phiên bản đã commit khác nhau. Lost update thường xảy ra với chuỗi read-modify-write: cả hai transaction đọc 10, cùng cộng 1, rồi cùng ghi 11; một lần tăng bị mất.

~~~java
int initial = 10;
int t1 = initial;       // T1 đọc 10
int t2 = initial;       // T2 cũng đọc 10
t1++;
t2++;
int stored = t1;        // T1 ghi 11
stored = t2;            // T2 ghi 11: lost update
~~~

Đoạn mô phỏng không phải database thật; nó làm rõ lịch và điểm xung đột. Cách sửa phụ thuộc nghiệp vụ: cập nhật nguyên tử {{SET value = value + 1}}, khóa hàng, hoặc optimistic version check. Chỉ nâng isolation không thay thế việc xác định invariant cần bảo vệ.

### SQL và EXPLAIN PostgreSQL

~~~sql
-- Đặt isolation level cho transaction (thuộc tính của transaction, không phải của câu lệnh)
SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;

-- UPDATE nguyên tử tránh lost update: database tự tính, không cần đọc trước
UPDATE accounts SET balance = balance + 100 WHERE id = 42;

-- SELECT FOR UPDATE: khóa hàng khi cần read-modify-write trong cùng transaction
BEGIN;
SELECT balance FROM accounts WHERE id = 42 FOR UPDATE;
-- ... tính toán dựa trên giá trị đã đọc ...
UPDATE accounts SET balance = 100 WHERE id = 42;
COMMIT;

-- Kiểm tra planner chọn plan bằng EXPLAIN (ANALYZE, BUFFERS)
EXPLAIN (ANALYZE, BUFFERS)
SELECT balance FROM accounts WHERE id = 42;
~~~

EXPLAIN (ANALYZE, BUFFERS) cho câu SELECT ở trên cho thấy:
- **Seq Scan**: planner quét toàn bộ bảng khi bảng nhỏ hoặc selectivity cao (trả về nhiều hàng).
- **Index Scan**: dùng index để tìm nhanh nhưng vẫn phải đọc heap theo TID (heap fetch).
- **Index Only Scan**: chỉ xảy ra khi index chứa đủ cột và visibility map đánh dấu page all-visible — không cần đọc heap.
- **Buffers**: số page read từ disk vs hit từ cache, giúp thấy I/O thực tế và so sánh chi phí.

### PostgreSQL 15 và MVCC
PostgreSQL lưu phiên bản hàng (tuple) cùng thông tin transaction tạo/xóa. Một snapshot quyết định transaction nào đã commit và được phép nhìn thấy. Ở {{READ COMMITTED}} (mức mặc định), mỗi câu SQL lấy snapshot mới; hai SELECT trong cùng transaction có thể thấy hai trạng thái khác nhau. PostgreSQL không cho dirty read: yêu cầu {{READ UNCOMMITTED}} được xử lý như {{READ COMMITTED}}.

Ở {{REPEATABLE READ}}, snapshot lấy ở câu lệnh đầu tiên và giữ ổn định suốt transaction, nên PostgreSQL chặn cả non-repeatable read lẫn phantom read (chặt hơn mức chuẩn SQL yêu cầu). Nếu transaction này UPDATE/DELETE hoặc SELECT FOR UPDATE một hàng đã bị transaction khác sửa và commit sau khi snapshot được lấy, PostgreSQL báo lỗi {{could not serialize access due to concurrent update}} (SQLSTATE 40001) thay vì ghi đè: lost update bị chặn, đổi lại ứng dụng phải retry cả transaction. Tuy vậy đây là snapshot isolation chứ không phải tuần tự hóa tổng quát; các anomaly kiểu write skew vẫn có thể cần {{SERIALIZABLE}} hoặc constraint/locking phù hợp. PostgreSQL Serializable dùng SSI để phát hiện các phụ thuộc nguy hiểm và có thể abort transaction (cũng SQLSTATE 40001); ứng dụng cần retry lỗi serialization.

| Mức trong PostgreSQL 15 | Dirty read | Non-repeatable / phantom | Lost update (đọc rồi ghi) | Write skew |
|---|---|---|---|---|
| READ COMMITTED | không | có thể | có thể | có thể |
| REPEATABLE READ | không | không | bị chặn bằng lỗi 40001 | có thể |
| SERIALIZABLE | không | không | bị chặn bằng lỗi 40001 | bị chặn bằng lỗi 40001 |

| Nhu cầu | Hướng xử lý |
|---|---|
| Cộng/trừ số đếm | UPDATE nguyên tử trong SQL |
| Chỉnh một hàng theo phiên bản | optimistic locking với version |
| Bảo vệ nhiều hàng cùng invariant | constraint, khóa phù hợp hoặc SERIALIZABLE + retry |

### Lịch xen kẽ minh họa
Mỗi cột là một transaction, thời gian chạy từ trên xuống. Commit là dấu +, rollback là dấu ×.

Dirty read (READ UNCOMMITTED, PostgreSQL coi như READ COMMITTED, không cho phép thật):

~~~text
T1                              T2
|                               |
|-- SELECT balance = 100 ------>|
|                               |-- UPDATE balance = 80 (chưa commit)
|                               |
|-- SELECT balance = 80 ---------|   <-- T1 đọc giá trị chưa commit
|                               |-- ROLLBACK
|-- SELECT balance = 80 ---------|   <-- T1 đã dùng giá trị "ma" không tồn tại
~~~

Non-repeatable read (READ COMMITTED):

~~~text
T1                              T2
|                               |
|-- SELECT balance = 100 ------>|
|                               |-- UPDATE balance = 80
|                               |-- COMMIT
|-- SELECT balance = 80 ---------|   <-- T1 đọc lại, giá trị khác (hợp lệ ở READ COMMITTED)
~~~

Lost update (READ COMMITTED, read-modify-write ở ứng dụng):

~~~text
T1                              T2
|                               |
|-- SELECT balance = 100 ------>|
|                               |-- SELECT balance = 100 ------>|
|                               |   <-- cả hai cùng đọc 100
|-- UPDATE balance = 101 ------->|   <-- T1 ghi 101
|                               |-- UPDATE balance = 101 -->|   <-- T2 ghi 101, ghi đè T1
|                               |   <-- kết quả 101, một lần tăng bị mất
~~~

### Cơ chế từng bước
Hãy tưởng tượng hai giao dịch cùng muốn sửa một giá trị. Cơ chế isolation hoạt động theo từng bước như sau:

1. **Transaction bắt đầu và lấy snapshot.** Khi một transaction chạy, database quyết định nó được nhìn thấy những phiên bản dữ liệu nào. Ở READ COMMITTED, snapshot được lấy cho mỗi câu lệnh; ở REPEATABLE READ, snapshot được lấy một lần ở đầu transaction và giữ nguyên.

2. **Ghi tạo ra phiên bản mới.** Khi transaction ghi (UPDATE/DELETE), database không sửa tại chỗ mà tạo một tuple mới, đánh dấu tuple cũ là đã bị thay thế (xmax). Tuple cũ vẫn còn trong bảng cho đến khi VACUUM dọn.

3. **Đọc chọn tuple theo snapshot.** Khi transaction đọc, nó chọn trong các tuple của hàng tuple mà snapshot của nó cho phép thấy: tuple đã sinh ra (xmin đã commit theo snapshot) và chưa bị thay thế (xmax chưa commit theo snapshot).

4. **Commit làm thay đổi quan sát được.** Sau khi transaction commit, các tuple nó sinh ra trở nên visible với các snapshot lấy sau đó. Ở READ COMMITTED, các câu lệnh sau trong cùng transaction sẽ thấy commit mới; ở REPEATABLE READ, chúng không thấy vì đã chụp ảnh cũ.

5. **Xung đột ghi bị phát hiện ở bước 4.** Nếu một transaction ở REPEATABLE READ muốn ghi một hàng mà đã có commit mới sau snapshot của nó, PostgreSQL không ghi overwrite mà abort với SQLSTATE 40001, bắt ứng dụng retry toàn bộ transaction.

Vì sao lại như vậy? MVCC ưu tiên đọc không bị ngăn bởi ghi, đổi lại để lại tuple chết và yêu cầu VACUUM. Mỗi mức isolation là một trade-off giữa nhất quán và đồng thời.

~~~java
// Mô phỏng 5 bước bằng một hàng có hai tuple
// Tuple cũ: value=10, xmin=100, xmax=201 (đã bị T201 thay thế)
// Tuple mới: value=12, xmin=201, xmax=0 (hiện hành)
// Snapshot T300 với committed={100}: thấy tuple cũ (10)
// Snapshot T400 với committed={100,201}: thấy tuple mới (12)
boolean bornOld = true;     // xmin=100 đã commit theo snapshot T300
boolean goneOld = false;    // xmax=201 chưa commit theo snapshot T300
boolean visibleOld = bornOld && !goneOld;   // true: T300 thấy 10
boolean bornNew = true;     // xmin=201 đã commit theo snapshot T400
boolean goneNew = false;    // xmax=0 chưa bị thay thế
boolean visibleNew = bornNew && !goneNew;   // true: T400 thấy 12
~~~

### Lỗi hay gặp trên production
1. **Dùng READ COMMITTED cho nghiệp vụ cần nhất quán giữa hai SELECT.** Triệu chứng: SELECT thứ nhất đọc số dư 100, sau đó làm việc khác, SELECT thứ hai đọc số dư 90 vì người khác đã trừ. Nguyên nhân: READ COMMITTED lấy snapshot mới mỗi câu lệnh, nên non-repeatable read là hợp lệ. Cách sửa: nếu cần cùng một giá trị trong suốt transaction, dùng REPEATABLE READ hoặc SELECT ... FOR UPDATE để khóa hàng; hoặc dùng UPDATE nguyên tử không cần đọc trước.

2. **Code Java read-modify-write mà không dùng UPDATE nguyên tử.** Triệu chứng: hai request cùng đọc 100, cùng cộng 1, cùng ghi 101; một lần tăng bị mất. Nguyên nhân: lost update — cả hai phép ghi đều dựa trên ảnh chụp ban đầu. Cách sửa: {{UPDATE account SET balance = balance + ? WHERE id = ?}} để database tính, hoặc optimistic locking với version check.

3. **Dùng SERIALIZABLE cho workload cao mà không retry.** Triệu chứng: ứng dụng liên tục gặp serialization failure (SQLSTATE 40001). Nguyên nhân: SERIALIZABLE abort khi phát hiện write skew hoặc lost update. Cách giữ SERIALIZABLE nhưng retry có giới hạn với backoff, hoặc xuống REPEATABLE READ nếu không thực sự cần.

4. **Chạy chung transaction với thao tác ngoài DB.** Triệu chứng: transaction kéo dài, giữ snapshot và lock, làm transaction khác phải chờ, VACUUM chậm, bảng phình. Nguyên nhân: gọi HTTP, gửi email, await người dùng trong transaction. Cách sửa: ghi event vào outbox trong cùng transaction, để relay gửi sau commit; giữ transaction chỉ quanh phần DB.

### Pitfall production
Transaction dài giữ snapshot cũ, làm VACUUM khó thu hồi tuple chết và tăng bloat. Retry toàn transaction phải idempotent, không gửi email/charge thẻ trước khi commit. Đừng dùng một bài test chạy tuần tự để kết luận về concurrency: cố định lịch xen kẽ để tái hiện race.

> Senior tip: đo thời gian transaction và tỷ lệ serialization failure; retry có backoff giới hạn, và chỉ retry phần nghiệp vụ thực sự an toàn.

### Liên hệ phỏng vấn
- **"READ COMMITTED và REPEATABLE READ khác biệt gì?"** → READ COMMITTED lấy snapshot mỗi câu lệnh, hai SELECT trong cùng transaction có thể thấy hai giá trị khác nhau; REPEATABLE READ lấy snapshot một lần ở đầu transaction, giữ nguyên trong suốt transaction, nhưng khi cố ghi hàng đã đổi, PostgreSQL abort với 40001.
- **"Lost update xảy ra sao và sửa bằng cách nào?"** → Hai transaction cùng đọc 10, cùng cộng 1, cùng ghi 11 — một lần tăng bị mất. Sửa bằng UPDATE nguyên tử (SET balance = balance + 1) hoặc optimistic locking với version check.
- **"Khi nào chọn SERIALIZABLE thay vì REPEATABLE READ?"** → Khi invariant bao gồm nhiều hàng (ví dụ tổng số dư phải bằng 0), REPEATABLE READ không bắt được write skew; SERIALIZABLE dùng SSI để phát hiện và abort. Ứng dụng phải retry.
- **"MVCC giúp đọc không bị chặn bởi ghi như thế nào?"** → Đọc chọn tuple theo snapshot, ghi tạo tuple mới thay vì overwrite. Nhược điểm là VACUUM phải dọn tuple chết và transaction dài giữ snapshot gây bloat.
`,
  exercises: [{
    title: 'Phát hiện lost update trong lịch cố định',
    prompt: `Hoàn thiện {{LostUpdate.run(initial, deltaA, deltaB)}} theo lịch cố định R(A), R(B), W(A), W(B): cả hai giao dịch đọc cùng số dư ban đầu, mỗi bên cộng delta của mình vào giá trị đã đọc, A ghi trước rồi B ghi sau (không có kiểm tra version). Trả về số dư cuối cùng. Mô hình hóa đúng lịch, không dùng thread.`,
    starter: `class LostUpdate {
    static int run(int initial, int deltaA, int deltaB) {
        throw new UnsupportedOperationException("TODO");
    }
}`,
    tests: `public class Main {
 static int p=0,t=0;
 static void check(String n,Runnable r){t++;try{r.run();p++;System.out.println("PASS "+n);}catch(Throwable e){System.out.println("FAIL "+n+": "+e);}}
 static void eq(int a,int b){if(a!=b)throw new AssertionError(a+" != "+b);}
 public static void main(String[]x){
  check("two increments lose one",()->eq(11,LostUpdate.run(10,1,1)));
  check("different deltas",()->eq(17,LostUpdate.run(10,2,7)));
  check("withdrawal of A is lost",()->eq(10,LostUpdate.run(10,-4,0)));
  System.out.println("RESULT "+p+"/"+t);
 }
}`,
    reference: `class LostUpdate {
    static int run(int initial, int deltaA, int deltaB) {
        int readA = initial; // Cả hai đọc trước khi transaction nào ghi.
        int readB = initial;
        int writeA = readA + deltaA;
        int writeB = readB + deltaB;
        int stored = writeA;
        stored = writeB; // Ghi sau cùng ghi đè kết quả của A.
        return stored;
    }
}`,
    hints: ['Cả hai transaction cần đọc trước khi có write.', 'Tính hai giá trị từ cùng initial; write cuối cùng thắng.'],
    explain: `Lịch mô phỏng là R(A), R(B), W(A), W(B). Vì cả hai phép ghi đều dựa trên ảnh chụp ban đầu nên phép ghi sau không cộng trên kết quả trước. Trong PostgreSQL, dùng UPDATE số học nguyên tử khi phù hợp; nếu cần kiểm tra dữ liệu đã đọc, thêm version và kiểm tra số dòng cập nhật. READ COMMITTED tự nó không biến nhiều lệnh ứng dụng thành một phép toán nguyên tử.`
  }],
  check: [
    {q:'READ UNCOMMITTED trong PostgreSQL 15 có cho dirty read không?',options:['Có','Không, được xử lý như READ COMMITTED','Chỉ khi dùng MVCC','Chỉ với bảng temporary'],answer:1,explain:'PostgreSQL không expose dirty read; READ UNCOMMITTED có hành vi như READ COMMITTED.'},
    {q:'Ở READ COMMITTED, snapshot được lấy khi nào?',options:['Mỗi statement','Chỉ lúc BEGIN','Chỉ lúc COMMIT','Mỗi lần gọi Java getter'],answer:0,explain:'Mỗi câu lệnh SQL có snapshot mới; vì vậy SELECT lặp lại có thể thấy commit mới.'},
    {q:'PostgreSQL SERIALIZABLE abort với SQLSTATE 40001 khi nào?',options:['Khi có dirty read','Chỉ khi có non-repeatable read','Khi phát hiện write skew hoặc lost update qua SSI','Mỗi lần transaction BEGIN'],answer:2,explain:'SSI phát hiện dependency nguy hiểm giữa các transaction và abort một trong số chúng; ứng dụng phải retry toàn bộ transaction.'},
    {q:'Ở REPEATABLE READ, transaction UPDATE một hàng đã bị transaction khác sửa và commit sau khi snapshot lấy, sẽ ra sao?',options:['Ghi đè giá trị mới','Báo lỗi could not serialize access (SQLSTATE 40001)','Tự động rollback toàn bộ database','Không ghi gì và silently bỏ qua'],answer:1,explain:'PostgreSQL không cho ghi đè dựa trên snapshot cũ; nó abort transaction hiện tại và bắt ứng dụng retry.'}
  ], tags:['isolation','MVCC','PostgreSQL','lost-update']
},
{
  id: 'lesson-db-002', track: 'db', order: 2,
  title: 'Optimistic locking: version check và retry có giới hạn', level: 'senior', minutes: 25,
  goals: ['Mô phỏng compare-and-set bằng version', 'Xử lý conflict mà không ghi đè cập nhật mới', 'Thiết kế retry transaction an toàn'],
  body: `**Tóm tắt:** Optimistic locking cho phép nhiều reader cùng làm việc rồi chỉ chấp nhận write nếu phiên bản chưa đổi. Conflict được phát hiện lúc ghi và phải xử lý rõ ràng, thường bằng cách đọc lại rồi retry nghiệp vụ.

### Version là điều kiện của UPDATE
Một hàng có cặp (value, version). Transaction đọc (10, 4), tính giá trị mới, rồi gửi update chỉ khi version vẫn là 4. Thành công thì ghi giá trị và tăng version thành 5. Nếu một transaction khác đã cập nhật trước, điều kiện không khớp, số hàng cập nhật bằng 0 và transaction biết mình đang dùng dữ liệu cũ.

~~~java
if (row.version == expectedVersion) {
    row.value = newValue;
    row.version++;
    return true;
}
return false; // caller must reload and decide whether to retry
~~~

Trong SQL tương ứng: {{UPDATE account SET balance=?, version=version+1 WHERE id=? AND version=?}}. Không kiểm tra row count là lỗi nghiêm trọng: request có thể báo thành công dù update không xảy ra. ORM như Hibernate hỗ trợ {{@Version}} và thường ném optimistic lock exception khi update không khớp.

### SQL và EXPLAIN PostgreSQL

~~~sql
-- UPDATE với version predicate: compare-and-set ở tầng database
UPDATE accounts
SET balance = ?, version = version + 1
WHERE id = ? AND version = ?;
-- Kiểm tra số dòng: bằng 0 thì conflict (dữ liệu đã đổi), không được coi là thành công.

-- Dùng RETURNING để lấy version mới sau khi update thành công
UPDATE accounts
SET balance = balance - 100
WHERE id = 42 AND version = 5
RETURNING balance, version;

-- EXPLAIN (ANALYZE, BUFFERS): xem plan thực tế và số page read/heap fetch
EXPLAIN (ANALYZE, BUFFERS)
SELECT balance, version FROM accounts WHERE id = 42;
~~~

EXPLAIN (ANALYZE, BUFFERS) cho câu truy vấn ở trên:
- **Index Scan**: tìm entry bằng index theo {{id}}, sau đó read heap theo TID để lấy {{balance}} và {{version}}.
- **Index Only Scan**: chỉ xảy ra khi index {{(id, version)}} chứa đủ cột cần và page all-visible — không cần heap fetch.
- **Buffers**: {{shared hit}} (đã có trong RAM) và {{read}} (phải đọc từ disk), giúp đo chi phí I/O thực tế.
- **Actual Rows**: so sánh với Estimated Rows để thấy thống kê có lệch (cần ANALYZE sau bulk load).

### Bảng so sánh locking strategies

| Chiến lược | Cách hoạt động | Ưu điểm | Nhược điểm | Phù hợp |
|---|---|---|---|---|
| **Optimistic locking (version check)** | Không lock khi đọc, chỉ check version khi ghi; conflict thì retry | Reader không blocked, throughput cao khi contention thấp | Cần retry, side effect phải idempotent | Xung đột ít, read-heavy |
| **Pessimistic locking (SELECT FOR UPDATE)** | Lock hàng từ đầu transaction, giữ đến commit/rollback | Đảm bảo atomicity, không cần retry | Reader bị blocked, deadlock, throughput giảm | Contention cao, cần tuần tự hóa |
| **Atomic SQL update** | UPDATE với biểu thức số học (SET balance = balance + ?) | Database tự tính, không cần read trước | Logic phải biểu diễn được trong SQL | Cộng/trừ đơn giản |
| **SERIALIZABLE + retry** | SSI phát hiện write skew và abort với 40001 | Chained invariant nhiều hàng | Abort thường xuyên, phải retry | Invariant nhiều hàng, write skew |

Khi Hibernate dùng {{@Version}}, nó tự thêm điều kiện version vào câu UPDATE và ném {{OptimisticLockException}} nếu row count bằng 0. Đây là cơ chế chuẩn của JPA, bản chất vẫn là compare-and-set ở tầng database. Version nên là kiểu số nguyên (Long/Integer) và tăng thêm 1 mỗi lần cập nhật. Không nên dùng timestamp làm version vì độ phân giải thấp có thể khiến hai cập nhật cùng giây được coi là cùng version.

Một điểm quan trọng là version chỉ bảo vệ một hàng. Nếu nghiệp vụ cần cập nhật nhiều hàng nguyên tử (ví dụ trừ tiền từ tài khoản A và cộng vào tài khoản B), version một hàng không đủ; cần transaction, khóa hàng, hoặc SERIALIZABLE.

### SQL và EXPLAIN PostgreSQL

~~~sql
-- UPDATE với version predicate: compare-and-set ở tầng database
UPDATE accounts
SET balance = ?, version = version + 1
WHERE id = ? AND version = ?;
-- Kiểm tra số dòng: bằng 0 thì conflict (dữ liệu đã đổi), không được coi là thành công.

-- Dùng RETURNING để lấy version mới sau khi update thành công
UPDATE accounts
SET balance = balance - 100
WHERE id = 42 AND version = 5
RETURNING balance, version;

-- EXPLAIN (ANALYZE, BUFFERS): xem plan thực tế và số page read/heap fetch
EXPLAIN (ANALYZE, BUFFERS)
SELECT balance, version FROM accounts WHERE id = 42;
~~~

EXPLAIN (ANALYZE, BUFFERS) cho câu truy vấn ở trên:
- **Index Scan**: tìm entry bằng index theo {{id}}, sau đó read heap theo TID để lấy {{balance}} và {{version}}.
- **Index Only Scan**: chỉ xảy ra khi index {{(id, version)}} chứa đủ cột cần và page all-visible — không cần heap fetch.
- **Buffers**: {{shared hit}} (đã có trong RAM) và {{read}} (phải đọc từ disk), giúp đo chi phí I/O thực tế.
- **Actual Rows**: so sánh với Estimated Rows để thấy thống kê có lệch (cần ANALYZE sau bulk load).

### Retry phải tính lại
Retry đúng nghĩa là bắt đầu transaction mới, đọc trạng thái mới, tính lại thay đổi dựa trên input nghiệp vụ rồi thử lại. Không nên chỉ gửi lại cùng SQL với giá trị tuyệt đối cũ; như vậy có thể lặp lại stale write — ghi đè lên kết quả mới nhất, lại thành lost update.

Vòng retry an toàn trong Java:

~~~java
int attempt = 0;
while (attempt++ < MAX_RETRY) {
    int current = readBalance(id);       // đọc lại version + giá trị mới
    int next = current + delta;          // tính lại từ input nghiệp vụ
    int updated = updateBalance(id, next, currentVersion);
    if (updated == 1) return;            // thành công
    sleep(randomBackoff(attempt));       // jitter tránh thundering herd
}
throw new OptimisticConflictException("quá số lần retry");
~~~

Khi contention cao, nhiều transaction cùng conflict và retry cùng lúc có thể gây "thundering herd": tất cả cùng đọc, cùng conflict, cùng retry, tải tăng vọt. Giới hạn số lần retry (3-5 lần), thêm exponential backoff với jitter (thời gian chờ ngẫu nhiên) để các transaction không va chạm lại, và trả conflict cho client nếu vượt quá giới hạn hoặc conflict là do nghiệp vụ (ví dụ số dư không đủ).

### PostgreSQL MVCC
MVCC giúp reader không chặn writer trong nhiều trường hợp, nhưng không tự ngăn lost update trong ứng dụng kiểu read-compute-write ở READ COMMITTED. Version predicate biến tính toàn vẹn thành điều kiện ghi nguyên tử. Một lệnh UPDATE nguyên tử trên cột cũng có thể phù hợp hơn cho phép cộng đơn giản. Với invariant nhiều hàng, version một hàng không đủ; cân nhắc constraint, khóa hoặc SERIALIZABLE.

| Cách | Phù hợp | Trade-off |
|---|---|---|
| Version check | xung đột ít, cập nhật từ object đã đọc | retry/conflict ở ứng dụng |
| Atomic SQL update | phép biến đổi đơn giản tại DB | logic phải biểu diễn được trong SQL |
| Pessimistic row lock | contention cao, cần tuần tự hóa | chờ khóa, deadlock, throughput thấp |

### Lịch xen kẽ: conflict và retry
T1 đọc (số dư=100, version=5), tính toán, rồi ghi. T2 đã cập nhật giữa thời gian đó.

~~~text
T1                              T2
|                               |
|-- SELECT (100, v5) ---------->|
|                               |-- SELECT (100, v5) ------>|
|                               |   <-- cả hai cùng đọc v5
|-- UPDATE ... WHERE version=5 -->|   <-- T1 thành công, v→6
|                               |-- UPDATE ... WHERE version=5
|                               |   <-- T2: 0 dòng, version đã là 6
|-- (T2 đọc lại: 105, v6) ------>|   <-- retry: đọc trạng thái mới
|-- UPDATE ... WHERE version=6 -->|   <-- T2 thành công, v→7
~~~

### Cơ chế từng bước
Optimistic locking hoạt động theo 5 bước, từ đọc đến ghi thành công hoặc conflict:

1. **Đọc kèm version.** Transaction đọc hàng cùng với version hiện tại (ví dụ value=10, version=4). Đây là điểm chuẩn bị để so sánh.

2. **Tính thay đổi trong bộ nhớ.** Dựa trên giá trị đã đọc, transaction tính ra giá trị mới (ví dụ 10 + 3 = 13). Bước này không đụng đến database.

3. **Ghi với điều kiện version.** Transaction gửi UPDATE với điều kiện WHERE version = 4 (phiên bản đã đọc). Database so sánh version hiện tại với 4.

4. **Kiểm tra kết quả.** Nếu version vẫn là 4, UPDATE thay đổi value và tăng version lên 5, trả về số dòng = 1. Nếu version đã thành 5 (transaction khác vừa cập nhật), điều kiện không khớp, UPDATE trả về 0 dòng.

5. **Quyết định retry hoặc báo conflict.** Với 0 dòng, application biết dữ liệu đã đổi: đọc lại (bước 1) và tính lại (bước 2), hoặc trả conflict cho client. Với 1 dòng, ghi thành công.

Vì sao lại như vậy? Cách này không khóa cho đến khi ghi, nên nhiều reader cùng đọc không cần chờ nhau. Giá phải trả là phải xử lý conflict một cách explicit, và retry phải bắt đầu từ dữ liệu mới.

~~~java
// Mô phỏng 5 bước bằng một VersionedCounter
VersionedCounter c = new VersionedCounter(10); // value=10, version=0
boolean ok = c.update(0, 3);   // version hiện tại là 0, expected 0 -> khớp, value=13, version=1, trả true
ok = c.update(0, 9);           // version đã thành 1, expected 0 -> không khớp, trả false, giữ nguyên
~~~

### Lỗi hay gặp trên production
1. **Không kiểm tra row count của UPDATE.** Triệu chứng: request được application coi là thành công (vì không có exception) nhưng dữ liệu thực tế không thay đổi. Nguyên nhân: UPDATE với version predicate không khớp trả về 0 dòng, application không check số dòng. Cách sửa: luôn kiểm tra affected rows; bằng 0 thì coi là conflict, retry hoặc trả về client.

2. **Retry gửi lại cùng SQL với giá trị tuyệt đối cũ.** Triệu chứng: retry lặp lại stale write — ghi lại giá trị đã đọc từ snapshot cũ thay vì giá trị mới. Nguyên nhân: retry không đọc lại dữ liệu. Cách sửa: retry phải bắt đầu transaction mới, đọc lại state, tính lại thay đổi từ input nghiệp vụ.

3. **Side effect trước commit.** Triệu chứng: mỗi retry gửi email hoặc gọi API thanh toán, gây gửi trùng lặp. Nguyên nhân: thực hiện side effect ngoài transaction. Cách sửa: ghi event vào outbox trong cùng transaction, relay gửi sau commit; dùng idempotency key.

4. **Retry vô hạn khi hệ thống đã nóng.** Triệu chứng: khi contention cao, retry liên tục làm tăng tải thêm, hệ thống càng chậm. Nguyên nhân: không giới hạn số lần retry và không phân biệt conflict tạm thời với conflict nghiệp vụ. Cách sửa: retry có giới hạn (3-5 lần) với exponential backoff và jitter; conflict nghiệp vụ trả về client.

### Pitfall production
Đừng thực hiện side effect ngoài DB (gửi email, gọi API thanh toán) trước khi commit, vì mỗi lần retry sẽ lặp lại nó; ghi event vào outbox trong cùng transaction và để relay gửi sau commit. Retry không giới hạn gây khuếch đại tải khi hệ thống đã nóng. Cần phân biệt conflict nghiệp vụ (cần người dùng chọn) với lỗi transient có thể tự retry.

> Senior tip: theo dõi tỷ lệ optimistic conflict theo loại entity; nếu thường xuyên cao, cân nhắc atomic update hoặc khóa thay vì retry vô ích.

### Liên hệ phỏng vấn
- **"Optimistic locking và pessimistic locking khác biệt gì?"** → Optimistic không lock khi đọc, chỉ check version khi ghi; conflict thì retry. Pessimistic lock hàng từ đầu, chờ đến khi commit; phù hợp contention cao nhưng gây deadlock và giảm throughput.
- **"UPDATE có version predicate trả về 0 dòng nghĩa là gì?"** → Điều kiện version không khớp, có thể dữ liệu đã đổi hoặc hàng không tồn tại; ứng dụng phải retry hoặc trả conflict, không được coi là thành công.
- **"Retry optimistic conflict cần làm gì?"** → Bắt đầu transaction mới, đọc lại state, tính lại thay đổi từ input nghiệp vụ; retry có giới hạn (3-5 lần) với backoff; side effect phải idempotent hoặc dùng outbox.
- **"Vì sao không nên gọi HTTP hoặc gửi email trong hàm compute/merge?"** → Hàm tính toán chạy trên ảnh chụp đã đọc, ngoài khóa database; side effect sẽ được lặp lại mỗi lần retry, gây gửi trùng (email/thanh toán).
`,
  exercises: [{
    title: 'Cập nhật nếu version còn khớp',
    prompt: `Cài {{VersionedCounter}}. {{update(expected, delta)}}: nếu {{expected}} bằng version hiện tại thì cộng delta vào value, tăng version thêm 1 và trả {{true}}; nếu không khớp thì trả {{false}} và giữ nguyên cả value lẫn version.`,
    starter: `class VersionedCounter {
    int value, version;
    VersionedCounter(int value) { this.value = value; this.version = 0; }
    boolean update(int expected, int delta) { throw new UnsupportedOperationException("TODO"); }
}`,
    tests: `public class Main {
 static int p=0,t=0; static void c(String n,Runnable r){t++;try{r.run();p++;System.out.println("PASS "+n);}catch(Throwable e){System.out.println("FAIL "+n+": "+e);}}
 static void eq(int a,int b){if(a!=b)throw new AssertionError(a+" != "+b);}
 public static void main(String[]z){
  c("matching update",()->{VersionedCounter x=new VersionedCounter(10);if(!x.update(0,3))throw new AssertionError();eq(13,x.value);eq(1,x.version);});
  c("stale update unchanged",()->{VersionedCounter x=new VersionedCounter(10);x.update(0,1);if(x.update(0,9))throw new AssertionError();eq(11,x.value);eq(1,x.version);});
  c("successive versions",()->{VersionedCounter x=new VersionedCounter(0);if(!x.update(0,2)||!x.update(1,4))throw new AssertionError();eq(6,x.value);eq(2,x.version);});
  System.out.println("RESULT "+p+"/"+t);
 }
}`,
    reference: `class VersionedCounter {
    int value, version;
    VersionedCounter(int value) { this.value = value; this.version = 0; }
    boolean update(int expected, int delta) {
        if (version != expected) return false; // tương đương WHERE version = ?
        value += delta;
        version++;
        return true;
    }
}`,
    hints: ['Kiểm tra version trước khi đụng vào value.', 'Conflict phải giữ nguyên cả value lẫn version.'],
    explain: `Version predicate đóng vai trò compare-and-set: chỉ một updater với expectedVersion hiện tại có thể thành công. Nếu trả false, caller cần đọc lại và quyết định tính lại thay đổi; không được coi đó là thành công. Trong DB, kiểm tra row count của UPDATE. Mô phỏng đơn luồng diễn đạt logic điều kiện, còn transaction/atomicity thực tế do database đảm nhiệm.`
  }],
  check:[{q:'UPDATE có version predicate trả row count 0 thường biểu thị gì?',options:['Update đã commit hai lần','Dữ liệu đã đổi hoặc hàng không tồn tại','Database mất MVCC','Connection pool đầy'],answer:1,explain:'Điều kiện version không khớp hoặc id không tồn tại; ứng dụng cần phân biệt theo nghiệp vụ nếu cần.'},{q:'Retry optimistic conflict nên làm gì?',options:['Gửi lại nguyên giá trị tính từ snapshot cũ','Đọc lại và tính lại trong transaction mới','Bỏ kiểm tra version','Retry vô hạn'],answer:1,explain:'Dữ liệu nền đã đổi; transaction mới cần đọc trạng thái mới và tính lại.'},{q:'Vì sao optimistic locking phù hợp hơn pessimistic khi xung đột ít?',options:['Không cần khóa khi đọc, nhiều reader cùng đọc không chờ nhau','Luôn nhanh hơn pessimistic locking mọi trường hợp','Không cần retry bao giờ','Không cần version'],answer:0,explain:'Optimistic không khoá khi đọc, nên reader không chặn reader; chỉ kiểm tra version khi ghi. Không phải luôn nhanh hơn, và vẫn cần retry khi conflict.'},{q:'Khi dùng Hibernate {{@Version}}, điều gì xảy ra nếu UPDATE không khớp version?',options:['Hibernate ném OptimisticLockException','Hibernate tự rollback toàn bộ database','Hibernate ghi đè dữ liệu mới','Hibernate không kiểm tra version'],answer:0,explain:'Hibernate tự thêm điều kiện version vào UPDATE; nếu row count bằng 0, nó ném OptimisticLockException cho ứng dụng xử lý.'}], tags:['optimistic-locking','version','PostgreSQL']
},
{
  id: 'lesson-db-003', track: 'db', order: 3,
  title: 'B-tree index và full scan: đếm phép so sánh, hiểu chọn lọc', level: 'mid', minutes: 25,
  goals: ['So sánh tìm tuyến tính với tra cứu cây có thứ tự', 'Đếm phép so sánh thay vì đo thời gian nhiễu', 'Hiểu index scan không luôn nhanh hơn sequential scan'],
  body: `**Tóm tắt:** Index lưu cấu trúc phụ để tìm vị trí hàng nhanh hơn quét toàn bộ bảng, đổi lại tốn dung lượng và chi phí khi ghi. Độ lợi phụ thuộc selectivity, kích thước dữ liệu và I/O, không chỉ Big O.

### Mô phỏng chỉ mục có thứ tự
Trong mô phỏng, full scan kiểm tra lần lượt từng key đến khi khớp, nên cần tối đa N phép so sánh (Seq Scan thật không có LIMIT vẫn đọc hết bảng vì có thể còn hàng khớp khác). Cây tìm kiếm cân bằng điều hướng bằng so sánh tại từng node, cỡ log2(N) bước (cây đỏ-đen cao tối đa khoảng 2·log2(N)). Java {{TreeMap}} dùng cây đỏ-đen và phù hợp để mô phỏng thao tác ordered lookup; đây không phải mô phỏng layout vật lý của PostgreSQL.

~~~java
int checks = 0;
for (int key : rows) {      // full scan: có thể xem cả N dòng
    checks++;
    if (key == target) break;
}
Integer value = tree.get(target); // cây tự điều hướng theo comparator
~~~

Đếm số lần comparator được gọi giúp bài tập deterministic. Không dùng thời gian wall clock cho ví dụ nhỏ vì JIT, cache, GC và tải máy làm kết quả dao động.

### B-tree trong PostgreSQL
PostgreSQL dùng B-tree index theo trang, mỗi trang chứa nhiều key và con trỏ, giúp chiều cao cây thấp và giảm lượt đọc page so với cây nhị phân một node mỗi tầng. Index có thể hỗ trợ equality, range và ordering. Nhưng index là cấu trúc riêng: mỗi INSERT và mỗi UPDATE không phải HOT phải thêm entry vào mọi index của bảng, làm tăng WAL và dung lượng; entry trỏ tới hàng đã bị DELETE/UPDATE được VACUUM dọn sau.

Khi insert khóa mới, PostgreSQL tìm leaf page thích hợp và có thể phải split trang nếu hết chỗ. Page split làm tăng write amplification; giảm fillfactor của index (B-tree mặc định 90) để chừa chỗ trống giúp bớt split khi insert vào giữa dải khóa, đổi lại index lớn hơn. Fillfactor của bảng (mặc định 100) là tham số khác: giảm nó để heap page còn chỗ cho HOT update. HOT update chỉ tránh cập nhật index khi không đổi cột được index tham chiếu và còn chỗ trên heap page; không nên giả định mọi UPDATE đều rẻ như nhau. Bởi vậy quyết định index cần nhìn cả read/write ratio và kích thước page cache.

Planner ước lượng cost từ thống kê và chọn sequential scan nếu phần lớn bảng cần đọc hoặc bảng nhỏ. Index scan có thể gây nhiều random heap fetch; bitmap heap scan gom vị trí để đọc hiệu quả hơn. Covering index với {{INCLUDE}} có thể cho index-only scan khi visibility map cho phép, nhưng không đảm bảo luôn tránh heap.

| Truy vấn | Cân nhắc |
|---|---|
| key duy nhất, bảng lớn | B-tree thường hữu ích |
| trả tỷ lệ lớn số hàng | Sequential scan có thể rẻ hơn |
| range có thứ tự | B-tree có thể tránh sort |
| cột ghi liên tục | cân nhắc chi phí duy trì index |

### SQL và EXPLAIN PostgreSQL

~~~sql
-- Tạo index B-tree trên cột email (equality lookup)
CREATE INDEX idx_users_email ON users (email);

-- Composite index: equality filter trước, range/order sau
CREATE INDEX idx_orders_tenant_created
  ON orders (tenant_id, created_at);

-- Partial index: chỉ index tập con hàng thỏa predicate
CREATE INDEX idx_orders_pending_created
  ON orders (created_at)
  WHERE status = 'PENDING';

-- Covering index với INCLUDE: các cột trong SELECT không cần vào khóa
CREATE INDEX idx_orders_cov
  ON orders (tenant_id, created_at)
  INCLUDE (status, total);

-- Kiểm tra planner chọn plan bằng EXPLAIN (ANALYZE, BUFFERS)
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, created_at, status, total
FROM orders
WHERE tenant_id = 7
  AND created_at >= '2026-01-01'
ORDER BY created_at, id
LIMIT 50;
~~~

EXPLAIN (ANALYZE, BUFFERS) cho câu truy vấn ở trên cho thấy:
- **Seq Scan**: planner quét toàn bộ bảng khi selectivity cao (trả về quá nhiều hàng) hoặc bảng nhỏ fit trong shared buffers.
- **Index Scan**: dùng B-tree tìm entry theo {{(tenant_id, created_at)}}, sau đó read heap theo TID để lấy {{status}} và {{total}}.
- **Index Only Scan**: chỉ xảy ra khi {{(tenant_id, created_at)}} + {{INCLUDE (status, total)}} chứa đủ cột và visibility map cho phép — không cần heap fetch.
- **Buffers**: {{shared hit}} (đã có trong RAM) vs {{read}} (phải đọc từ disk), giúp thấy I/O thực tế.
- **Actual Rows vs Estimated Rows**: lệch lớn → cần ANALYZE để cập nhật thống kê.

### Cơ chế từng bước: B-tree lookup trong PostgreSQL
Khi một câu SQL có điều kiện WHERE trên cột có B-tree index, PostgreSQL thực hiện tra cứu theo các bước:

1. **Đọc root page từ shared buffer.** Index metadata lưu block number của root; nếu chưa có trong buffer pool thì đọc từ disk (random I/O).
2. **Đi xuống qua internal page.** Tại mỗi internal page, binary search tìm con trỏ child page phù hợp với key đang tìm. Với fanout ~100–300 (page 8KB, key nhỏ), chiều cao cây thường chỉ 3–4 tầng dù bảng có tỷ hàng.
3. **Đến leaf page.** Leaf page chứa cặp (index key, TID/heap pointer). Binary search lần nữa để tìm entry khớp.
4. **Heap fetch (trừ khi index-only scan).** Dùng TID (block, offset) để đọc heap page. Nếu visibility map cho phép và query chỉ chọn cột có trong index, có thể bỏ qua bước này (index-only scan).
5. **Kiểm tra visibility (MVCC).** Tuple trên heap phải visible theo snapshot của transaction; nếu không thì bỏ qua.

Vì sao lại như vậy? B-tree thiết kế để giảm random I/O: fanout lớn → chiều cao thấp. Tuy nhiên mỗi level vẫn là một lần đọc page tiềm năng. Nếu phải đọc nhiều hàng liên tiếp (range scan), leaf page được liên kết bằng sibling pointer để duyệt tuần tự.

~~~java
// Mô phỏng B-tree lookup: đếm số page đọc (giả định fanout=100, height=3)
class BTreeSim {
    static int pagesRead(int rows, double selectivity) {
        int height = 3;                 // root + 1 internal + leaf
        int leafPages = (int) Math.ceil(rows / 100.0); // ~100 entry/page
        int scannedLeaves = Math.max(1, (int) (leafPages * selectivity));
        return height + scannedLeaves;  // root->internal->leaf + leaf pages duyệt
    }
}
// 10M hàng, selectivity 0.001% -> pagesRead ≈ 3 + 1 = 4 page (index scan)
// 10M hàng, selectivity 10%     -> pagesRead ≈ 3 + 10000 = 10003 page (seq scan rẻ hơn)
~~~

### So sánh B-tree và cây nhị phân cân bằng (red-black)

| Đặc điểm | B-tree (PostgreSQL) | Red-Black Tree (Java TreeMap) |
|---|---|---|
| Node | 1 page 8KB, hàng trăm key | 1 object, 1 key |
| Fanout | 100–300 | 2 (nhị phân) |
| Chiều cao (1 tỷ hàng) | 3–4 tầng | ~30 tầng |
| I/O pattern | Tuần tự trong page, random giữa page | Object trải rải bộ nhớ |
| Phù hợp cho | Đĩa (page I/O) | RAM (pointer chasing) |

Đây là lý do B-tree thắng trên đĩa: mỗi lần đọc page mang theo hàng trăm key, giảm lượt I/O vật lý.

### Lỗi hay gặp trên production
1. **Index trên cột low cardinality (ví dụ boolean, status enum) mà không kết hợp.** Triệu chứng: planner vẫn chọn seq scan dù có index. Nguyên nhân: B-tree trả về quá nhiều TID, chi phí heap fetch ngẫu nhiên vượt quá seq scan. Cách sửa: dùng composite index (status, created_at) hoặc partial index {{WHERE status = 'active'}} để giảm số entry.
2. **Thiếu ANALYZE sau bulk load hoặc partition detach/attach.** Triệu chứng: estimated rows lệch lớn so với actual rows, planner chọn sai plan (index scan thay vì seq scan hoặc ngược lại). Nguyên nhân: thống kê pg_statistic cũ. Cách sửa: chạy {{ANALYZE}} hoặc bật autovacuum-analyze; dùng {{EXPLAIN (ANALYZE, BUFFERS)}} để đối chiếu.
3. **Write amplification do quá nhiều index trên bảng ghi dày.** Triệu chứng: INSERT/UPDATE chậm, WAL tăng vọt, replication lag. Nguyên nhân: mỗi index là một B-tree riêng, mỗi ghi phải cập nhật tất cả. Cách sửa: xóa index không dùng ({{pg_stat_user_indexes.idx_scan = 0}}), gom index trùng lặp, cân nhắc fillfactor thấp hơn cho index insert-heavy.
4. **Index-only scan không kích hoạt do visibility map chưa set.** Triệu chứng: {{EXPLAIN}} hiện "Index Scan" thay vì "Index Only Scan" dù query chỉ chọn cột trong index. Nguyên nhân: vacuum chưa chạy để set all-visible flag trên heap page. Cách sửa: bật autovacuum, giảm {{autovacuum_vacuum_scale_factor}}, hoặc {{VACUUM (ANALYZE)}} thủ công.

### Pitfall production
Index trên cột có cardinality thấp không tự động vô ích hay hữu ích; điều quan trọng là số hàng phù hợp và pattern truy vấn. Dùng {{EXPLAIN (ANALYZE, BUFFERS)}} trên workload đại diện, nhớ ANALYZE để cập nhật thống kê. Một query trả vài phần trăm bảng có thể đổi plan khi dữ liệu phân bố lệch.

### Liên hệ phỏng vấn
- **"B-tree index trong PostgreSQL khác gì so với cây nhị phân cân bằng?"** → B-tree là cây nhiều nhánh (multi-way), mỗi node là một page 8KB chứa hàng trăm key + con trỏ, fanout lớn (~100–300) nên chiều cao chỉ 3–4 tầng dù tỷ hàng. Binary tree (như TreeMap) mỗi node 1 key, chiều cao log2(N) ≈ 40 tầng cho 1 tỷ hàng → I/O nhiều hơn.
- **"Khi nào planner chọn Sequential Scan thay vì Index Scan?"** → Khi selectivity cao (trả về > 5–10% bảng) hoặc bảng nhỏ (fit trong shared buffers). Seq scan đọc tuần tự (prefetch, sequential I/O) rẻ hơn nhiều random I/O của index scan + heap fetch. Planner ước lượng cost từ thống kê pg_statistic.
- **"Partial index là gì và dùng khi nào?"** → Index chỉ bao gồm hàng thỏa mãn predicate (ví dụ {{CREATE INDEX ON orders (created_at) WHERE status = 'active'}}). Dùng khi query thường lọc theo giá trị hiếm của cột low cardinality, giúp index nhỏ hơn và planner dễ chọn.
- **"Vì sao cần ANALYZE sau khi insert hàng loạt?"** → Planner dùng thống kê (most common values, histogram, n_distinct) để ước lượng rows. Bulk load làm thống kê lỗi thời, dẫn đến sai plan. Autovacuum-analyze sẽ chạy tự động nhưng có thể chậm; nên chạy {{ANALYZE}} thủ công sau bulk load.

> Senior tip: theo dõi buffer hit/read và actual rows so với estimated rows; sai lệch thống kê thường quan trọng hơn tranh luận Big O.
`,
  exercises:[{
    title:'So sánh số phép kiểm tra của full scan và TreeMap',
    prompt:`Cài {{SearchCounts}}. {{linear(values, target)}} mô phỏng full scan: duyệt mảng và trả số phần tử đã so sánh (dừng khi gặp key; không thấy thì bằng độ dài mảng). {{tree(values, target)}} nạp mọi giá trị vào {{TreeMap}} tạo với comparator có đếm, reset bộ đếm sau khi nạp, gọi {{get(target)}} rồi trả số lần comparator được gọi (mảng rỗng trả 0).`,
    starter:`class SearchCounts {
    static int linear(int[] values, int target) { throw new UnsupportedOperationException("TODO"); }
    static int tree(int[] values, int target) { throw new UnsupportedOperationException("TODO"); }
}`,
    tests:`public class Main {
 static int p=0,t=0;static void c(String n,Runnable r){t++;try{r.run();p++;System.out.println("PASS "+n);}catch(Throwable e){System.out.println("FAIL "+n+": "+e);}}
 static void ok(boolean b){if(!b)throw new AssertionError();}
 public static void main(String[]z){
  c("linear counts examined rows",()->{if(SearchCounts.linear(new int[]{4,8,12,16},12)!=3)throw new AssertionError();});
  c("linear miss scans all",()->{if(SearchCounts.linear(new int[]{1,2,3},9)!=3)throw new AssertionError();});
  c("tree logarithmic comparisons",()->{int[] a=new int[1024];for(int i=0;i<a.length;i++)a[i]=i;int n=SearchCounts.tree(a,777);ok(n>0&&n<30);});
  c("empty tree",()->{if(SearchCounts.tree(new int[0],1)!=0)throw new AssertionError();});
  System.out.println("RESULT "+p+"/"+t);
 }
}`,
    reference:`class SearchCounts {
    static int linear(int[] values, int target) {
        int checks = 0;
        for (int value : values) { checks++; if (value == target) break; }
        return checks;
    }
    static int tree(int[] values, int target) {
        final int[] comparisons = {0};
        Comparator<Integer> cmp = (a, b) -> { comparisons[0]++; return Integer.compare(a, b); };
        TreeMap<Integer, Boolean> index = new TreeMap<>(cmp);
        for (int value : values) index.put(value, true);
        comparisons[0] = 0; // chỉ đếm lookup, không đếm lúc dựng index
        index.get(target);
        return comparisons[0];
    }
}`,
    hints:['Duyệt mảng và tăng counter trước phép so sánh từng hàng.','TreeMap comparator có thể tăng int[] counter; reset sau khi nạp dữ liệu.'],
    explain:`Full scan trả N nếu không tìm thấy; lookup trong cây đỏ-đen có số so sánh tăng theo log N. Comparator được gọi cả lúc insert nên phải reset trước lookup. Đây chỉ là đếm phép so sánh trong cấu trúc Java, không đại diện số page I/O hoặc cost PostgreSQL. PostgreSQL B-tree là cây nhiều nhánh tối ưu cho page; planner vẫn có thể chọn sequential scan khi đọc nhiều hàng.`
  }],
  check:[{q:'Vì sao PostgreSQL đôi khi chọn sequential scan dù có index?',options:['Index bị bỏ qua ngẫu nhiên','Đọc tỷ lệ lớn bảng có thể rẻ hơn nhiều heap fetch rời rạc','B-tree chỉ hỗ trợ chuỗi','MVCC cấm index scan'],answer:1,explain:'Planner chọn plan ước lượng có tổng cost thấp hơn; I/O và số hàng trả về quan trọng.'},{q:'Index thường làm chi phí nào tăng?',options:['INSERT/UPDATE và dung lượng','Chỉ SELECT','VACUUM bị cấm','Transaction isolation tự giảm'],answer:0,explain:'Mỗi thay đổi liên quan phải duy trì index, ghi WAL và dùng storage.'},{q:'Partial index trong PostgreSQL giúp gì?',options:['Index chỉ chứa hàng thỏa predicate, nhỏ hơn và planner dễ chọn','Tự động chuyển seq scan thành index scan','Bỏ qua visibility check','Vô hiệu hóa autovacuum'],answer:0,explain:'Partial index {{WHERE status = ...}} chỉ index tập con hàng, giảm kích thước và chi phí duy trì; planner ước lượng cost chính xác hơn cho query lọc cùng predicate.'},{q:'Fillfactor 90 của B-tree index mặc định nhằm gì?',options:['Giảm chiều cao cây','Chừa chỗ trống trên leaf page để bớt split khi insert','Tăng fanout','Bật index-only scan'],answer:1,explain:'Fillfactor 90 để leaf page còn 10% chỗ trống; insert vào giữa dải khóa không phải split ngay, giảm write amplification. Giá đổi là index lớn hơn ~11%.'}], tags:['B-tree','index','EXPLAIN','PostgreSQL']
},
{
  id:'lesson-db-004',track:'db',order:4,title:'Connection pool: giới hạn tài nguyên và timeout khi cạn pool',level:'senior',minutes:25,
  goals:['Mô hình hóa pool có capacity hữu hạn','Phân biệt chờ lấy connection với giữ connection lâu','Ước lượng tác động của transaction dài'],
  body:`**Tóm tắt:** Connection pool tái sử dụng một số hữu hạn kết nối vật lý tới database. Khi mọi slot đang được mượn, request mới phải chờ hoặc timeout; tăng pool mù quáng có thể làm database quá tải hơn.

### Pool như semaphore
Với capacity P, mỗi borrower lấy một slot và phải trả lại trong mọi nhánh bằng finally/try-with-resources. Nếu P request cùng giữ connection, request P+1 chờ. Connection chỉ nên được mượn khi cần truy cập DB; không giữ nó trong lúc gọi dịch vụ HTTP hoặc chờ người dùng.

~~~java
try (Connection c = dataSource.getConnection()) {
    // thời gian giữ connection nên bao quanh phần DB cần thiết
    update(c);
}
~~~

Mô phỏng deterministic không cần thread thật: danh sách slot đang dùng cùng số lượng chờ, và timeout được biểu diễn bằng kết quả thất bại thay vì sleep. Mục tiêu là hiểu capacity, không dựng lại scheduling hay timeout clock của HikariCP.

### PostgreSQL và giới hạn kết nối
Pool phía ứng dụng bảo vệ latency bằng cách giới hạn concurrency tới DB. PostgreSQL có giới hạn connection ({{max_connections}}, thường mặc định 100) và mỗi connection là một backend process riêng tiêu thụ bộ nhớ; một pool quá lớn trên nhiều instance nhân tổng số connection lên rất nhanh. Cần tính tổng pool của mọi replica cộng tác vụ nền, admin và headroom. PgBouncer có thể multiplex một số workload theo transaction pooling, nhưng session state và prepared statement cần xem xét theo mode.

Little’s Law cho trực giác: concurrency xấp xỉ throughput nhân thời gian lưu trú. Nếu query chậm gấp đôi mà throughput giữ nguyên, số connection bị chiếm có thể tăng gấp đôi. Tìm nguyên nhân ở query, lock, network hoặc transaction duration trước khi chỉ tăng max pool.

| Triệu chứng | Kiểm tra |
|---|---|
| pool active chạm max | thời gian acquire, leak, transaction duration |
| DB nhiều connection idle | tổng pool giữa replica, cấu hình service |
| acquire timeout tăng | query latency, lock wait, tải DB |

### Cơ chế từng bước: vòng đời một connection trong pool
Khi ứng dụng cần truy cập database, pool quản lý vòng đời connection theo các bước:

1. **Borrow (mượn slot).** Thread gọi {{dataSource.getConnection()}}. Pool kiểm tra {{Semaphore}} (bộ đếm slot rảnh): nếu còn thì giảm bộ đếm và trả connection đã mở; nếu hết thì thread vào hàng đợi FIFO, chờ tối đa {{connectionTimeout}} (mặc định 30s).
2. **Giữ connection (critical section).** Connection được trả cho thread. Thread chạy logic DB (query, update, transaction). **Lưu ý quan trọng:** trong suốt thời gian này slot bị chiếm, không thread khác dùng được.
3. **Release (trả slot).** Thread đóng connection (hoặc try-with-resources tự đóng). Pool tăng {{Semaphore}}, đánh dấu slot rảnh, và nếu có thread đang chờ, thread đầu tiên trong hàng đợi được đánh thức và nhận slot.
4. **Health check / idle eviction.** Nền tảng (HikariCP) định kỳ kiểm tra connection ngồi im quá {{idleTimeout}} (mặc định 10 phút) thì đóng để nhường tài nguyên cho DB. {{maxLifetime}} (mặc định 30 phút) buộc đổi connection trước khi firewall/load balancer cắt.
5. **Leak detection.** Nếu bật {{leakDetectionThreshold}} (ví dụ 60s), pool ghi log stack trace của chỗ đã {{borrow}} mà chưa {{release}} sau ngưỡng; giúp tìm code quên đóng.

Vì sao lại như vậy? Pool chuyển chi phí mở connection (TCP, TLS, auth, process backend) từ "mỗi request" thành "mỗi slot khởi tạo". {{Semaphore}} đảm bảo fairness (FIFO) tránh starvation. Idle/max lifetime bảo vệ DB không bị tích tụ connection chết.

~~~java
// Mô phỏng pool đơn giản: Semaphore + mảng slot + timestamp mượn
import java.util.concurrent.*;
import java.time.Clock;

class TinyPoolSim {
    private final Semaphore permits;
    private final long[] borrowedAt; // 0 = rảnh, >0 = thời điểm mượn (ms)
    private final Clock clock;

    TinyPoolSim(int capacity, Clock clock) {
        if (capacity < 0) throw new IllegalArgumentException();
        this.permits = new Semaphore(capacity, true); // fair = FIFO
        this.borrowedAt = new long[capacity];
        this.clock = clock;
    }

    int borrow(long timeoutMs) throws InterruptedException {
        if (!permits.tryAcquire(timeoutMs, TimeUnit.MILLISECONDS))
            throw new IllegalStateException("Pool exhausted, timeout " + timeoutMs + "ms");
        for (int i = 0; i < borrowedAt.length; i++) {
            if (borrowedAt[i] == 0) { borrowedAt[i] = clock.millis(); return i; }
        }
        throw new IllegalStateException("Logic error: permit acquired but no slot");
    }

    boolean release(int id) {
        if (id < 0 || id >= borrowedAt.length || borrowedAt[id] == 0) return false;
        borrowedAt[id] = 0;
        permits.release();
        return true;
    }

    int leakedOver(long thresholdMs) {
        long now = clock.millis();
        int count = 0;
        for (long t : borrowedAt) if (t > 0 && now - t > thresholdMs) count++;
        return count;
    }
}
~~~

### So sánh các loại timeout

| Timeout | Đặt ở đâu | Mặc định | Khi nổ nghĩa là |
|---|---|---|---|
| {{connectionTimeout}} | HikariCP | 30000 ms | không mượn được kết nối từ pool |
| {{socketTimeout}} | JDBC socket | theo driver | DB đã nhận query nhưng trả lời quá chậm |
| {{statement_timeout}} | PostgreSQL | 0 (tắt) | DB tự hủy query chạy quá lâu |
| {{lock_timeout}} | PostgreSQL | 0 (tắt) | chờ lock quá lâu |
| {{idle_in_transaction_session_timeout}} | PostgreSQL | 0 (tắt) | mở transaction rồi ngồi im |

Mặc định các timeout phía database đều tắt, nên một query xấu có thể treo vô hạn và chiếm một slot mãi. Đó là lý do production nên đặt {{statement_timeout}} theo tầng (ví dụ 5 giây cho OLTP).

### SQL và EXPLAIN PostgreSQL

~~~sql
-- Đặt statement_timeout cho session hoặc role (ví dụ 5 giây cho OLTP)
SET statement_timeout = '5s';
SET lock_timeout = '1s';
SET idle_in_transaction_session_timeout = '300s';

-- Kiểm tra các connection đang chạy và thời gian đã giữ
SELECT pid, state, now() - xact_start AS xact_age,
       now() - query_start AS query_age,
       wait_event_type, wait_event,
       left(query, 80) AS query_snippet
FROM pg_stat_activity
WHERE state != 'idle'
ORDER BY xact_age DESC;

-- Xem lock đang chờ và ai đang giữ
SELECT blocked.pid AS blocked_pid, blocked.wait_event_type,
       blocked.left(query, 60) AS blocked_query,
       holding.pid AS holder_pid,
       holding.left(query, 60) AS holder_query
FROM pg_stat_activity blocked
JOIN pg_locks bl ON blocked.pid = bl.pid
JOIN pg_locks hl ON bl.locktype = hl.locktype
  AND bl.relation IS NOT DISTINCT FROM hl.relation
  AND hl.pid != blocked.pid
JOIN pg_stat_activity holding ON hl.pid = holding.pid
WHERE blocked.wait_event_type = 'Lock';

-- EXPLAIN (ANALYZE, BUFFERS): xem plan và số page read/heap fetch
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, balance FROM accounts WHERE id = 42;
~~~

EXPLAIN (ANALYZE, BUFFERS) cho câu truy vấn ở trên:
- **Seq Scan**: planner quét toàn bộ bảng khi bảng nhỏ hoặc selectivity cao.
- **Index Scan**: dùng index tìm entry theo {{id}}, sau đó read heap theo TID.
- **Buffers**: {{shared hit}} (đã có trong RAM) vs {{read}} (phải đọc từ disk) — giúp thấy I/O thực tế.
- **Actual Rows vs Estimated Rows**: lệch lớn → cần ANALYZE để cập nhật thống kê.

### Lỗi hay gặp trên production
1. **Transaction boundary quá rộng (gọi HTTP/Redis/Kafka bên trong transaction).** Triệu chứng: pool cạn nhanh, {{connectionTimeout}} liên tục, DB vẫn rảnh. Nguyên nhân: connection được giữ suốt transaction, remote call kéo dài từ ms lên giây, slot không được trả kịp. Cách sửa: thu hẹp transaction chỉ quanh phần DB; dùng outbox pattern ghi event rồi commit, relay gửi sau.
2. **Thiếu {{statement_timeout}} ở PostgreSQL.** Triệu chứng: một query chậm (báo cáo, thiếu index) chiếm slot hàng phút, pool cạn. Nguyên nhân: mặc định {{statement_timeout = 0}} (vô hạn). Cách sửa: đặt {{statement_timeout = '5s'}} (hoặc phù hợp SLA) ở session/role/user/database level; HikariCP có thể set qua {{connectionInitSql}}.
3. **Quên đóng connection (leak) trong nhánh exception.** Triệu chứng: pool từ từ cạn sau vài giờ/giờ, không có lỗi rõ ràng. Nguyên nhân: code {{getConnection()}} không bọc try-with-resources, exception xảy ra trước dòng {{close()}}. Cách sửa: luôn dùng try-with-resources; bật {{leakDetectionThreshold = 60000}} để log stack trace chỗ mượn.

~~~java
try (Connection c = ds.getConnection()) {
    // logic DB
}
~~~
4. **Tăng {{maximumPoolSize}} mù quáng khi pool cạn.** Triệu chứng: tăng pool 10→50, latency không giảm, DB bị OOM hoặc CPU 100%. Nguyên nhân: DB có core giới hạn; nhiều connection chỉ gây context switch, lock contention, memory pressure. Cách sửa: đo {{active}}, {{idle}}, {{pending}}, {{acquire time}} (HikariCP metrics), và {{wait_event}} từ {{pg_stat_activity}}; tối ưu query/transaction trước, mới tăng pool nếu thực sự cần.

### Pitfall production
Quên close connection gây leak; giữ connection qua remote call làm cạn pool dù database rảnh. Pool timeout không đồng nghĩa query timeout. Đặt timeout riêng cho acquire, statement và transaction; bật leak detection ở mức chẩn đoán. Với HikariCP: {{maximumPoolSize}} mặc định 10; {{connectionTimeout}} (thời gian tối đa chờ lấy connection) mặc định 30000 ms, quá hạn thì {{getConnection()}} ném {{SQLTransientConnectionException}}; {{leakDetectionThreshold}} mặc định 0 (tắt). Timeout câu lệnh đặt ở DB/driver, ví dụ {{statement_timeout}} của PostgreSQL. Trong Spring, transaction boundary rộng có thể giữ connection xuyên qua xử lý không cần thiết.

### Liên hệ phỏng vấn
- **"Connection pool là backpressure như thế nào?"** → Pool giới hạn số connection đồng thời tới DB. Khi request vượt quá capacity, thread phải chờ (hàng đợi FIFO) tới {{connectionTimeout}} rồi ném {{SQLTransientConnectionException}}. Đây là cơ chế backpressure ở tầng ứng dụng bảo vệ DB không bị quá tải.
- **"Tại sao không nên tăng pool size mặc định 10 lên 100 khi thấy pool cạn?"** → DB có CPU core và RAM giới hạn. Mỗi connection là một process backend tốn memory. Thêm connection khi DB đã bão hòa CPU chỉ làm tăng context switch và lock contention, chứ không tăng throughput. Công thức khởi điểm: {{cores * 2 + spindles}} (SSD coi spindles = 0).
- **"Ba loại timeout cần phân biệt là gì?"** → (1) {{connectionTimeout}} (HikariCP, 30s mặc định): chờ mượn slot từ pool. (2) {{statement_timeout}} (PostgreSQL, mặc định 0): DB tự hủy query chạy quá lâu. (3) {{socketTimeout}} (JDBC driver): chờ network packet từ DB. Phổ biến nhất là thiếu {{statement_timeout}}, để một query xấu treo slot vô hạn.
- **"Leak detection trong HikariCP hoạt động sao?"** → {{leakDetectionThreshold}} (ms, mặc định 0=tắt). Khi connection được mượn quá lâu vượt ngưỡng, pool log stack trace tại điểm {{borrow}} (không phải điểm bị kẹt). Giúp tìm code quên {{try-with-resources}} hoặc gọi service chậm bên trong transaction.

> Senior tip: khi pool cạn, thứ cần tìm là "ai đang giữ slot và giữ bao lâu", không phải "còn thiếu bao nhiêu slot"; một câu {{SELECT state, now() - xact_start FROM pg_stat_activity ORDER BY 2 DESC}} thường trả lời ngay.
`,
  exercises:[{title:'Pool hữu hạn với acquire/release',prompt:`Cài {{TinyPool}} có {{capacity}} slot đánh số từ 0 đến capacity - 1. {{acquire()}} đánh dấu và trả id slot rảnh nhỏ nhất, hoặc {{-1}} khi hết slot (mô phỏng timeout). {{release(id)}} nhả slot và trả {{true}} nếu id hợp lệ và slot đang được mượn; id ngoài phạm vi hoặc slot đang rảnh (kể cả release lần hai) trả {{false}}. Không dùng sleep/thread.`,starter:`class TinyPool {
    TinyPool(int capacity) { throw new UnsupportedOperationException("TODO"); }
    int acquire() { throw new UnsupportedOperationException("TODO"); }
    boolean release(int id) { throw new UnsupportedOperationException("TODO"); }
}`,
  tests:`public class Main {
 static int p=0,t=0;static void c(String n,Runnable r){t++;try{r.run();p++;System.out.println("PASS "+n);}catch(Throwable e){System.out.println("FAIL "+n+": "+e);}}
 static void eq(Object a,Object b){if(!Objects.equals(a,b))throw new AssertionError(a+" != "+b);}
 public static void main(String[]z){
  c("bounded capacity",()->{TinyPool x=new TinyPool(2);eq(0,x.acquire());eq(1,x.acquire());eq(-1,x.acquire());});
  c("release permits reuse",()->{TinyPool x=new TinyPool(1);int a=x.acquire();if(!x.release(a))throw new AssertionError();eq(a,x.acquire());});
  c("invalid release rejected",()->{TinyPool x=new TinyPool(1);eq(false,x.release(0));int a=x.acquire();eq(false,x.release(9));eq(true,x.release(a));eq(false,x.release(a));});
  c("zero capacity",()->{TinyPool x=new TinyPool(0);eq(-1,x.acquire());});
  System.out.println("RESULT "+p+"/"+t);
 }
}`,
  reference:`class TinyPool {
    private final boolean[] busy;
    TinyPool(int capacity) {
        if (capacity < 0) throw new IllegalArgumentException("capacity");
        busy = new boolean[capacity];
    }
    int acquire() {
        for (int i = 0; i < busy.length; i++) if (!busy[i]) { busy[i] = true; return i; }
        return -1;
    }
    boolean release(int id) {
        if (id < 0 || id >= busy.length || !busy[id]) return false;
        busy[id] = false; return true;
    }
}`,
  hints:['Mảng boolean biểu diễn slot đang được mượn.','Acquire chọn slot rảnh đầu tiên; release cần từ chối id ngoài phạm vi và slot chưa mượn.'],
  explain:`Pool giữ tối đa capacity slot. Khi không còn slot rảnh, mô phỏng trả -1 như tình huống timeout; triển khai thật thường chờ trong giới hạn thời gian. Release phải idempotent theo hợp đồng đã chọn, ở đây lần release thứ hai trả false. Ứng dụng thật cần luôn đóng connection bằng try-with-resources để slot quay về pool kể cả khi exception.`}],
  check:[{q:'Pool active chạm max và pending tăng, nên xem gì trước?',options:['Tăng max lên rất lớn ngay','Acquire time, query/lock latency và thời gian giữ transaction','Xóa index','Tắt timeout'],answer:1,explain:'Cần tìm nguồn chiếm connection và kiểm tra tải DB; tăng pool có thể làm tổng concurrency vượt sức DB.'},{q:'Remote HTTP call nằm trong transaction DB có thể gây gì?',options:['Giảm thời gian giữ connection','Giữ connection trong lúc chờ mạng, làm cạn pool','Tự động retry SQL','Tắt MVCC'],answer:1,explain:'Connection thường được giữ đến khi transaction kết thúc; latency ngoài DB kéo dài thời gian chiếm slot.'},{q:'Mặc định {{statement_timeout}} của PostgreSQL là bao nhiêu và hệ quả gì?',options:['5s, query chậm tự bị hủy','0 (tắt), query xấu có thể treo slot vô hạn','30s, tương đương connectionTimeout','1 phút, đủ cho hầu hết OLTP'],answer:1,explain:'Mặc định 0 = vô hạn. Một query quên WHERE hoặc thiếu index có thể chạy cả giờ, chiếm slot và cạn pool.'},{q:'HikariCP {{leakDetectionThreshold}} log cái gì khi connection bị leak?',options:['Stack trace tại điểm đang bị kẹt','Stack trace tại điểm đã {{borrow}} (lấy connection)','Danh sách query chậm','Số connection đang idle'],answer:1,explain:'Log vị trí code gọi {{getConnection()}} mà chưa trả lại, giúp tìm nhánh exception quên close hoặc gọi service chậm trong transaction.'}],tags:['connection-pool','PostgreSQL','HikariCP']
},
{
  id:'lesson-db-005',track:'db',order:5,title:'Offset pagination và keyset pagination: chi phí bỏ qua hàng',level:'mid',minutes:25,
  goals:['Đếm số hàng phải bỏ qua khi phân trang offset','Cài keyset pagination với cursor ổn định','Chọn index và thứ tự sắp xếp phù hợp'],
  body:`**Tóm tắt:** Offset pagination tiện cho trang số bất kỳ nhưng database thường phải tìm và bỏ qua các hàng trước offset. Keyset dùng khóa cuối trang trước làm cursor, thường hiệu quả hơn khi đi tuần tự qua dữ liệu lớn.

### Offset bỏ qua từ đầu
Truy vấn {{LIMIT 20 OFFSET 100000}} vẫn phải đọc rồi bỏ đi 100000 hàng đầu theo thứ tự trước khi trả 20 hàng. Một index có thể tránh sort, nhưng không làm biến mất công việc đi qua các entry bị bỏ qua. Insert/delete giữa các lần request cũng có thể khiến vị trí hàng dịch chuyển: người dùng thấy trùng hoặc thiếu kết quả giữa các trang.

### Keyset dùng khóa sắp xếp
Với thứ tự ổn định {{ORDER BY created_at, id}}, cursor chứa cặp cuối cùng (created_at, id). Trang tiếp theo dùng điều kiện từ điển lớn hơn cặp đó và LIMIT. Trong PostgreSQL có thể dùng row comparison phù hợp kiểu dữ liệu: {{WHERE (created_at, id) > (?, ?)}}. Index ghép nên theo cùng thứ tự cột để hỗ trợ range scan.

~~~sql
SELECT id, created_at
FROM orders
WHERE (created_at, id) > (:last_time, :last_id)
ORDER BY created_at, id
LIMIT 50;
~~~

Thêm id làm tie-breaker là cần thiết nếu timestamp có thể trùng; cursor chỉ có timestamp sẽ bỏ sót hoặc lặp hàng. Cột cursor nên bất biến trong quá trình duyệt nếu cần trải nghiệm nhất quán.

| Thuộc tính | Offset | Keyset |
|---|---|---|
| Nhảy tới trang N | dễ | cần cursor/đi tiếp |
| Duyệt sâu tuần tự | chi phí bỏ qua tăng | tìm từ cursor |
| Dữ liệu thay đổi giữa trang | dễ lệch vị trí | ổn định hơn với khóa phù hợp |

### Snapshot và UX
Keyset không tự tạo snapshot xuyên nhiều HTTP request. Dữ liệu mới có thể xuất hiện trước cursor và không được thấy trong phiên duyệt; dữ liệu bị xóa cũng thay đổi tập kết quả. Nếu cần snapshot nhất quán xuyên trang, phải thiết kế rõ transaction/export snapshot hoặc watermark nghiệp vụ; giữ transaction mở lâu qua HTTP thường không nên vì giữ snapshot và connection.

Cursor cần bao gồm toàn bộ khóa sắp xếp và encode đúng kiểu, kể cả null ordering nếu cột nullable. Với sort giảm dần, toán tử so sánh và predicate cũng phải đảo tương ứng (row comparison chỉ dùng được khi mọi cột sắp cùng chiều; trộn ASC/DESC phải viết điều kiện OR tách từng cột); collation của text phải nhất quán với index. Cursor opaque có thể ký để client không tự sửa ranh giới, nhưng vẫn cần validate phiên bản cursor và filter mà nó gắn với. Nếu filter thay đổi mà cursor cũ được dùng lại, kết quả sẽ khó hiểu dù SQL hợp lệ.

PostgreSQL planner vẫn có thể chọn scan khác tùy predicate, thống kê và selectivity. Xác nhận bằng {{EXPLAIN (ANALYZE, BUFFERS)}} và index khớp filter + order. API nên encode cursor có kiểm tra/opaque để tránh client sửa tùy ý.

### Cơ chế từng bước
1. **Offset: đếm từ đầu.** DB quét theo thứ tự sắp xếp, bỏ qua {{OFFSET}} hàng trước khi trả kết quả. Mỗi hàng bỏ qua tốn CPU (kiểm tra MVCC visibility) và có thể tốn I/O (đọc page từ đĩa). Chi phí lớn theo tỷ lệ offset, không phải theo {{LIMIT}}.
2. **Keyset: index seek đến cursor.** Cursor là giá trị khóa của hàng cuối trang trước (ví dụ cặp created_at, id). Trang tiếp theo dùng {{WHERE (sort_col, tie_breaker) > (last_val, last_id)}}. B-tree seek đến vị trí cursor trong O(log N), không quét các hàng trước.
3. **Trả trang dữ liệu.** Cả hai chỉ đọc {{LIMIT}} hàng liên tiếp sau vị trí bắt đầu. Keyset đi dọc qua các leaf page liền kề (next pointer); offset tiếp tục quét từ vị trí đã đếm đến khi đủ {{LIMIT}}.
4. **Dữ liệu thay đổi giữa request.** Offset lệch: insert hàng trước offset làm trang lùi (bị bỏ), delete làm nhảy (bị trùng). Keyset ổn định hơn vì cursor gắn khóa cụ thể; nhưng dữ liệu mới chèn trước cursor sẽ không xuất hiện — đây là đặc tính, không phải bug.
5. **Encode/decode cursor an toàn.** Cursor chứa toàn bộ cột ORDER BY, encode base64/JSON, ký HMAC. Server decode, verify chữ ký, dựng predicate. Nếu filter đổi, cursor cũ bị từ chối để tránh kết quả khó hiểu.

**Ví dụ số liệu:** Bảng 10 triệu hàng, {{LIMIT}} 20.
- Trang 1 (offset 0): đọc 20 hàng, nhanh.
- Trang 50000 (offset 1.000.000): offset đọc khoảng 1.000.020 hàng rồi trả 20 (chi phí tuyến tính). Keyset chỉ seek đến cursor và đọc 20 hàng (chi phí hằng số).
Vì vậy offset phù hợp UI nhảy trang (trang nông), keyset phù hợp infinite scroll/feed.

~~~java
class PagingCostModel {
    static long offsetCost(long n, long offset, long limit) { return Math.min(n, offset + limit); }
    static long keysetCost(long n, long cursor, long limit) { return Math.min(limit, Math.max(0, n - cursor)); }
}
// 10M hàng, trang 50000 (offset=1M, limit=20): offsetCost ≈ 1,000,020 | keysetCost ≈ 20
~~~

### Lỗi hay gặp trên production
1. **Dùng OFFSET lớn cho infinite scroll/feed.** Trang đầu <50ms, trang 10000 >5s. Nguyên nhân: chi phí tuyến tính với offset. Sửa: keyset + cursor {{(created_at, id)}} + composite index.
2. **Cursor thiếu tie-breaker.** Trùng/lỡ hàng khi nhiều bản ghi cùng timestamp. Sửa: luôn thêm id: {{WHERE (created_at, id) > (?, ?)}}.
3. **Client tự sửa cursor/dùng lại cursor cũ sau đổi filter.** Kết quả lạ, không báo lỗi SQL. Sửa: ký cursor (HMAC), gắn version/filter hash, từ chối cursor không khớp.
4. **Thiếu index composite ORDER BY + WHERE.** Keyset chậm, planner chọn seq scan. Sửa: index {{(filter_col, sort_col, tie_breaker)}} theo thứ tự predicate.

### Lựa chọn offset hay keyset?
Offset phù hợp khi trang số ít và cần nhảy thẳng trang N (trang quản trị). Keyset phù hợp feed/infinite scroll, danh sách lớn, dữ liệu thay đổi giữa các trang. Ngưỡng thực tế: offset dưới vài nghìn hàng thì nhanh, trên đó chi phí tăng tuyến tính nên chuyển sang keyset. Keyset không hỗ trợ nhảy thẳng trang số tùy ý.

### Liên hệ phỏng vấn
- **"Offset vs keyset: khác nhau ở đâu, khi nào dùng?"** → Offset đếm từ đầu O(offset); keyset cursor seek O(log N). Admin nhảy trang: offset; feed/infinite scroll: keyset.
- **"Tại sao keyset cần tie-breaker (id)?"** → Nhiều hàng cùng timestamp -> cursor không xác định duy nhất ranh giới -> trùng/lỡ hàng.
- **"Cursor opaque là gì, cần ký HMAC?"** → Server tạo, encode base64/JSON, ký HMAC để client không tự sửa; validate chữ ký và filter version khi decode.
- **"Làm sao planner chọn index cho keyset?"** → Composite index: WHERE filter columns trước -> ORDER BY columns -> tie-breaker. Dùng {{EXPLAIN (ANALYZE, BUFFERS)}} xác nhận.

> Senior tip: đo trang sâu, không chỉ trang đầu; OFFSET biểu hiện chi phí ở tail latency khi offset tăng.
`,
  exercises:[{title:'Đếm hàng bỏ qua ở offset và keyset',prompt:`Cài {{PagingCost}}. Mô hình: bảng n hàng có khóa unique 1..n đã sắp tăng dần. {{offsetCost(n, offset, limit)}} trả số hàng phải đi qua từ đầu để trả trang: hàng bị bỏ qua cộng hàng trả về, không vượt quá n. {{keysetCost(n, after, limit)}} giả định index seek thẳng tới cursor {{after}} (khóa cuối của trang trước) nên chỉ đếm số hàng của trang tiếp theo: các khóa lớn hơn after, tối đa limit hàng.`,starter:`class PagingCost {
    static int offsetCost(int n, int offset, int limit) { throw new UnsupportedOperationException("TODO"); }
    static int keysetCost(int n, int after, int limit) { throw new UnsupportedOperationException("TODO"); }
}`,
  tests:`public class Main {
 static int p=0,t=0;static void c(String n,Runnable r){t++;try{r.run();p++;System.out.println("PASS "+n);}catch(Throwable e){System.out.println("FAIL "+n+": "+e);}}
 static void eq(int a,int b){if(a!=b)throw new AssertionError(a+" != "+b);}
 public static void main(String[]z){
  c("offset includes skipped rows",()->eq(120,PagingCost.offsetCost(1000,100,20)));
  c("offset capped at end",()->eq(100,PagingCost.offsetCost(100,90,20)));
  c("keyset only visits page",()->eq(20,PagingCost.keysetCost(1000,100,20)));
  c("keyset near end",()->eq(5,PagingCost.keysetCost(100,95,20)));
  c("empty page",()->eq(0,PagingCost.keysetCost(100,100,20)));
  System.out.println("RESULT "+p+"/"+t);
 }
}`,
  reference:`class PagingCost {
    static int offsetCost(int n, int offset, int limit) {
        if (n < 0 || offset < 0 || limit < 0) throw new IllegalArgumentException();
        return Math.min(n, offset + limit); // bỏ qua offset rồi đọc tới limit hoặc hết tập
    }
    static int keysetCost(int n, int after, int limit) {
        if (n < 0 || after < 0 || limit < 0) throw new IllegalArgumentException();
        return Math.min(limit, Math.max(0, n - after));
    }
}`,
  hints:['Offset scan từ đầu qua cả hàng bị skip lẫn hàng được trả.', 'Với cursor hợp lệ sau phần tử thứ after, chỉ thăm min(limit, n-after) phần tử tiếp theo.'],
  explain:`Trong mô hình đã sắp thứ tự, offset cần đi qua offset + limit hàng, bị giới hạn bởi tổng n. Keyset giả định index seek tới cursor nên chỉ tính hàng của trang kế tiếp. Đây là mô hình chi phí hàng logic; DB thật còn có page I/O, visibility check, filter và cache. Composite B-tree theo cột filter/order giúp seek đúng vùng. OFFSET vẫn hợp với trang nông hoặc cần nhảy tới trang số cụ thể.`}],
  check:[{q:'Tại sao keyset thường cần tie-breaker như id?',options:['Để ép PostgreSQL dùng hash join','Để thứ tự là total order khi sort key bị trùng','Để bỏ MVCC','Để offset nhanh hơn'],answer:1,explain:'Nếu nhiều hàng cùng timestamp, cursor chỉ timestamp không định vị duy nhất ranh giới trang.'},{q:'Keyset pagination có đảm bảo snapshot nhất quán xuyên nhiều request không?',options:['Có, luôn luôn','Không; cursor không thay thế snapshot transaction','Chỉ khi không có index','Có nếu LIMIT là số chẵn'],answer:1,explain:'Keyset xác định vị trí tiếp theo; dữ liệu vẫn có thể thay đổi giữa các HTTP request.'},{q:'Khi dùng keyset với ORDER BY created_at DESC, id DESC, predicate WHERE đúng là gì?',options:['WHERE (created_at, id) > (?, ?)','WHERE (created_at, id) < (?, ?)','WHERE created_at < ? OR (created_at = ? AND id < ?)','WHERE created_at > ? AND id > ?'],answer:2,explain:'Row comparison (created_at, id) < ... chỉ hoạt động khi mọi cột cùng chiều ASC. Trộn ASC/DESC phải viết điều kiện OR tách từng cột theo thứ tự ưu tiên.'},{q:'Composite index cho keyset pagination nên đặt cột theo thứ tự nào?',options:['ORDER BY columns trước, WHERE columns sau','WHERE filter columns trước, rồi ORDER BY columns, cuối tie-breaker','Chỉ cần index trên cột sort','Primary key đã đủ cho mọi trường hợp'],answer:1,explain:'Index phải hỗ trợ cả filter (WHERE) lẫn range scan (ORDER BY). Thứ tự: equality filter -> range/order -> tie-breaker.'}],tags:['pagination','keyset','PostgreSQL','B-tree']
},
{
  id:'lesson-db-006',track:'db',order:6,title:'Bên trong connection pool: borrow, timeout khi chờ và phát hiện leak',level:'senior',minutes:30,
  goals:['Giải thích vì sao mở một connection tốn kém và pool tiết kiệm gì','Mô hình mượn/trả slot bằng Semaphore và hàng đợi FIFO','Phân biệt connectionTimeout, statement_timeout, lock_timeout','Viết code mượn kết nối không bao giờ quên trả','Bật và đọc được log leak detection'],
  body:`**Tóm tắt:** Connection pool giữ sẵn một số ít kết nối đã mở tới database để nhiều request mượn chung. Phải nắm ba chuyện: mở kết nối mắc ở đâu, khi hết slot thì app chờ bao lâu rồi ném lỗi gì, và vì sao một kết nối bị giữ quá lâu (leak) có thể làm cả service đứng trong khi database vẫn khỏe.

### Mở một connection mắc thật sự ở chỗ nào
Gọi {{dataSource.getConnection()}} không chỉ tạo một object Java. Phía dưới là cả chuỗi việc:

- TCP handshake tới host database (một round-trip; trên AWS còn thêm phân giải DNS và một tầng load balancer).
- Bắt tay TLS: gửi certificate, sinh khóa chung (vài round-trip, tốn CPU cả hai phía).
- Xác thực: PostgreSQL mặc định dùng SCRAM-SHA-256, về cơ bản là chuỗi challenge/response, thêm round-trip.
- Database cấp tài nguyên cho session. PostgreSQL chạy mỗi connection bằng một **process backend riêng**; process đó tự dành bộ nhớ cho {{work_mem}} và cache lock của riêng nó. SQL Server/Oracle dùng thread/session, nhẹ hơn chút nhưng không miễn phí.
- Driver dựng trạng thái phiên ({{search_path}}, timezone, cache prepared statement).

Tổng thời gian thường cỡ 10–50 ms, khác region có thể vài trăm ms. Trong khi một query tra theo khóa chính trả kết quả trong khoảng 1 ms. Nếu cứ mỗi request HTTP lại mở rồi đóng kết nối, bạn nhiều lần trả phí "khởi động" cao hơn cả phí làm việc. Pool tồn tại để trả phí đó đúng N lần (N là số kết nối trong pool), chứ không phải trả theo từng request.

### Bên trong pool: slot, permit và hàng đợi FIFO
Hình dung pool là N slot, mỗi slot là một kết nối thật. Mượn là chiếm một slot, trả là nhả slot. Ba thành phần: kho kết nối, bộ đếm số slot còn rảnh (mô hình đúng bằng {{Semaphore(N)}}), và hàng đợi người chờ theo thứ tự FIFO để không ai bị bỏ đói vĩnh viễn.

HikariCP có {{connectionTimeout}}, mặc định 30000 ms: hết thời gian mà vẫn không lấy được slot thì {{getConnection()}} ném {{SQLTransientConnectionException}} kiểu "request timed out after 30000 ms waiting for a connection". Chú ý đây là lỗi **của ứng dụng**, database chưa hề nhận câu SQL nào.

~~~seq
title: Hai request tranh một slot
actors: Req B | Pool | Req A | PostgreSQL
Req A -> Pool: borrow
Pool --> Req A: slot 0, đánh dấu đang mượn
Req A -> PostgreSQL: SELECT chậm 4 giây
Req B -> Pool: borrow
note Pool: hết slot, Req B vào hàng đợi, deadline now cộng timeout
PostgreSQL --> Req A: kết quả
Req A -> Pool: release slot 0
Pool -> Req B: trao slot 0 theo FIFO
Req B -> PostgreSQL: UPDATE
~~~

### Ba loại timeout đừng lẫn lộn
| Timeout | Đặt ở đâu | Mặc định | Khi nổ nghĩa là |
|---|---|---|---|
| {{connectionTimeout}} | HikariCP | 30000 ms | không mượn được kết nối từ pool |
| {{socketTimeout}} | JDBC socket | theo driver | DB đã nhận query nhưng trả lời quá chậm |
| {{statement_timeout}} | PostgreSQL | 0 (tắt) | DB tự hủy query chạy quá lâu |
| {{lock_timeout}} | PostgreSQL | 0 (tắt) | chờ lock quá lâu |
| {{idle_in_transaction_session_timeout}} | PostgreSQL | 0 (tắt) | mở transaction rồi ngồi im |

Mặc định các timeout phía database đều tắt, nên một query xấu có thể treo vô hạn và chiếm một slot mãi. Đó là lý do production nên đặt {{statement_timeout}} theo tầng (ví dụ 5 giây cho OLTP).

### Vì sao pool nhỏ thường nhanh hơn pool lớn
Database chỉ có K core CPU. Mỗi connection là một process; khi số query đang chạy đồng thời vượt K, các process chỉ tranh CPU. Thêm connection khi đó không thêm sức mạnh, chỉ thêm lượt chuyển bối cảnh và bộ nhớ. Công thức khởi điểm nổi tiếng trong PostgreSQL wiki: {{cores * 2 + spindles}} (số core nhân 2, cộng số đĩa cơ), với máy SSD thì spindles coi như 0: 8 core gợi ý pool cỡ 16 cho **toàn bộ hệ thống**, không phải cho mỗi pod.

| Cách đặt | Kết quả thường thấy |
|---|---|
| 20 pod x pool 20 = 400 connection | DB hết memory, context switch cao, p99 tăng |
| tổng pool sát số core, có PgBouncer phía sau | throughput ổn định, hàng đợi dời về phía app |
| pool to vì "cho an toàn" | lỗi dây chuyền: mọi service cùng đổ thêm tải xuống DB |

Trực giác từ Little's Law: số slot đang bị chiếm = throughput nhân thời gian giữ kết nối. Giữ kết nối lâu gấp đôi thì số slot cần cũng gấp đôi, nên giảm thời gian giữ thường hiệu quả hơn tăng pool.

### Leak: mượn rồi quên trả
Ví dụ điển hình — code thiếu đóng kết nối:

~~~java
Connection c = dataSource.getConnection();
List rows = query(c);           // ném exception ở đây
return toDto(rows);             // dòng release phía dưới không bao giờ chạy
~~~

Cách đúng, trong mọi nhánh kể cả exception:

~~~java
try (Connection c = dataSource.getConnection()) {
    return toDto(query(c));     // close tự chạy khi ra khỏi block
}
~~~

HikariCP có {{leakDetectionThreshold}}, mặc định 0 (tắt); bật 60000 thì pool ghi log kèm **stack trace của chỗ đã mượn** một kết nối chưa trả sau 60 giây. Stack trace không chỉ nơi bị kẹt mà chỉ nơi lấy kết nối, nhưng đủ để lần ra method. Kẻ thù phổ biến: gọi HTTP/gRPC, đọc Redis, chờ người dùng, hoặc gửi Kafka ngay trong lúc đang giữ connection hoặc đang mở transaction.

> Nguyên tắc: mượn kết nối sát chỗ chạy SQL nhất, trả trong finally hoặc try-with-resources, và giữ transaction ngắn nhất có thể.

### idleTimeout, maxLifetime và kết nối chết
- {{idleTimeout}} (HikariCP mặc định 600000 ms): kết nối nằm im quá lâu thì bị đóng để nhường tài nguyên cho DB.
- {{maxLifetime}} (mặc định 1800000 ms = 30 phút): kết nối bị cho nghỉ **trước** khi firewall/load balancer cắt nó, để app không bao giờ mượn phải một kết nối đã chết. Phải đặt nhỏ hơn idle timeout của thiết bị ở giữa; ví dụ AWS NLB mặc định cắt kết nối không hoạt động sau 350 giây.
- Khi database restart hoặc failover, không kết nối cũ nào còn dùng được; pool phát hiện qua lỗi khi mượn và thay dần bằng kết nối mới.

### Lỗi hay gặp trên production
- Tăng pool để "chữa" chậm, trong khi nguyên nhân là một query giữ transaction 30 giây.
- Không đặt {{statement_timeout}}, một báo cáo chạy cả giờ chiếm slot.
- Quên tính tổng pool của mọi replica cộng job nền, công cụ admin.
- Chỉ nhìn số kết nối đang dùng, không nhìn số người đang chờ và thời gian chờ mượn.
- Trả kết nối thủ công mà thiếu finally, nên nhánh exception rò rỉ từ từ cho tới khi cạn pool.

### Liên hệ phỏng vấn
Trả lời theo bốn lớp: (1) mở connection mắc vì TCP, TLS, xác thực và process backend riêng, (2) pool là tài nguyên hữu hạn, mượn theo FIFO, hết slot thì chờ tới {{connectionTimeout}} rồi ném {{SQLTransientConnectionException}}, (3) pool to không tự động nhanh hơn vì CPU và bộ nhớ của DB có hạn, lấy {{cores * 2 + spindles}} làm điểm xuất phát rồi benchmark, (4) cách chữa: đưa call HTTP/cache ra ngoài transaction, bật leak detection nếu nghi ngờ quên trả, đặt {{idle_in_transaction_session_timeout}} ở DB để không session nào ngồi im giữa transaction và đặt {{maxLifetime}} nhỏ hơn idle timeout của load balancer. Sau đó nêu cách đo: active, pending, thời gian chờ mượn, độ dài transaction, wait event phía database.

> Senior tip: khi pool cạn, thứ cần tìm là "ai đang giữ slot và giữ bao lâu", không phải "còn thiếu bao nhiêu slot"; một câu {{SELECT state, now() - xact_start FROM pg_stat_activity ORDER BY 2 DESC}} thường trả lời ngay.
`,
  exercises:[{
    title:'MiniPool: mượn có timeout và phát hiện kết nối giữ quá lâu',
    prompt:`Cài {{MiniPool}} dùng {{java.util.concurrent.Semaphore}} và {{java.time.Clock}} nạp vào để không phụ thuộc đồng hồ thật.

- Constructor {{MiniPool(size, timeoutMs, clock)}} tạo đúng {{size}} slot đánh số từ 0; {{size}} âm thì ném {{IllegalArgumentException}}.
- {{borrow()}} xin một permit nhưng tối đa chỉ chờ {{timeoutMs}}. Không lấy được thì ném {{IllegalStateException}} (mô phỏng pool cạn). Có permit thì trả slot chưa dùng có id nhỏ nhất, ghi thời điểm mượn bằng {{clock.millis()}}.
- {{release(c)}} nhả slot và permit. {{c}} bằng {{null}} hoặc kết nối đang không được mượn (trả hai lần) thì bỏ qua, không nhả thêm permit.
- {{leased()}} trả số slot đang bị mượn.
- {{leakedOver(thresholdMs)}} trả số slot đang bị mượn mà giữ lâu hơn {{thresholdMs}} theo {{clock.millis()}} hiện tại.

Không dùng {{Thread.sleep}}, không tự tăng thời gian thật. Chạy được nhiều thread: hai thread không bao giờ cùng nhận một slot.`,
    starter:`import java.time.Clock;
import java.util.concurrent.Semaphore;

class MiniPool {
    static final class Conn {
        final int id;
        long borrowedAt;
        boolean leased;
        Conn(int id) { this.id = id; }
    }

    MiniPool(int size, long timeoutMs, Clock clock) { throw new UnsupportedOperationException("TODO"); }

    Conn borrow() { throw new UnsupportedOperationException("TODO"); }

    void release(Conn c) { throw new UnsupportedOperationException("TODO"); }

    int leased() { throw new UnsupportedOperationException("TODO"); }

    int leakedOver(long thresholdMs) { throw new UnsupportedOperationException("TODO"); }
}`,
    tests:`import java.time.*;

public class Main {
 static int p=0,t=0;
 static void c(String n,Runnable r){t++;try{r.run();p++;System.out.println("PASS "+n);}catch(Throwable e){System.out.println("FAIL "+n+": "+e);}}
 static void eq(Object a,Object b){if(!Objects.equals(a,b))throw new AssertionError(a+" != "+b);}
 static void ok(boolean b){if(!b)throw new AssertionError("expected true");}
 static void mustThrow(Runnable r){try{r.run();throw new AssertionError("expected IllegalStateException");}catch(IllegalStateException expected){}}
 static final class FakeClock extends Clock {
   long now=1_000_000L;
   public ZoneId getZone(){return ZoneOffset.UTC;}
   public Clock withZone(ZoneId zone){return this;}
   public Instant instant(){return Instant.ofEpochMilli(now);}
   public long millis(){return now;}
 }
 public static void main(String[]z){
  FakeClock clock=new FakeClock();
  c("gives lowest free slot",()->{MiniPool x=new MiniPool(2,30L,clock);eq(0,x.borrow().id);eq(1,x.borrow().id);eq(2,x.leased());});
  c("throws when exhausted after timeout",()->{MiniPool x=new MiniPool(1,25L,clock);x.borrow();mustThrow(()->x.borrow());eq(1,x.leased());});
  c("release frees the slot",()->{MiniPool x=new MiniPool(1,30L,clock);MiniPool.Conn a=x.borrow();x.release(a);eq(0,x.leased());eq(0,x.borrow().id);});
  c("double release adds no phantom slot",()->{MiniPool x=new MiniPool(1,25L,clock);MiniPool.Conn a=x.borrow();x.release(a);x.release(a);x.borrow();mustThrow(()->x.borrow());});
  c("null release is ignored",()->{MiniPool x=new MiniPool(1,30L,clock);MiniPool.Conn a=x.borrow();x.release(null);eq(1,x.leased());x.release(a);eq(0,x.leased());});
  c("zero size pool refuses immediately",()->{MiniPool x=new MiniPool(0,25L,clock);mustThrow(()->x.borrow());eq(0,x.leased());});
  c("negative size rejected",()->{try{new MiniPool(-1,30L,clock);throw new AssertionError("expected IllegalArgumentException");}catch(IllegalArgumentException expected){}});
  c("leak detected past threshold",()->{FakeClock fc=new FakeClock();MiniPool x=new MiniPool(2,30L,fc);x.borrow();fc.now+=6000L;eq(1,x.leakedOver(5000L));});
  c("recent borrow is not a leak",()->{FakeClock fc=new FakeClock();MiniPool x=new MiniPool(2,30L,fc);MiniPool.Conn a=x.borrow();fc.now+=1000L;eq(0,x.leakedOver(5000L));x.release(a);eq(0,x.leakedOver(5000L));});
  c("concurrent borrowers never exceed capacity",()->{MiniPool x=new MiniPool(2,10000L,Clock.systemUTC());ExecutorService ex=Executors.newFixedThreadPool(8);CountDownLatch go=new CountDownLatch(1);AtomicInteger max=new AtomicInteger();try{List<Future<?>> fs=new ArrayList<>();for(int i=0;i<16;i++){fs.add(ex.submit(()->{try{go.await();}catch(InterruptedException e){Thread.currentThread().interrupt();return;}MiniPool.Conn a=x.borrow();try{max.accumulateAndGet(x.leased(),Math::max);}finally{x.release(a);}}));}go.countDown();for(Future<?> f:fs){try{f.get(30L,TimeUnit.SECONDS);}catch(Exception e){throw new RuntimeException(e);}}ok(max.get()>=1);ok(max.get()<=2);eq(0,x.leased());}finally{ex.shutdownNow();}});
  System.out.println("RESULT "+p+"/"+t);
 }
}`,
    reference:`import java.time.Clock;
import java.util.concurrent.Semaphore;
import java.util.concurrent.TimeUnit;

class MiniPool {
    static final class Conn {
        final int id;
        long borrowedAt;
        boolean leased;
        Conn(int id) { this.id = id; }
    }

    private final Conn[] slots;
    private final Semaphore free;
    private final long timeoutMs;
    private final Clock clock;

    MiniPool(int size, long timeoutMs, Clock clock) {
        if (size < 0) throw new IllegalArgumentException("size must not be negative");
        this.slots = new Conn[size];
        for (int i = 0; i < size; i++) this.slots[i] = new Conn(i);
        this.free = new Semaphore(size, true); // true: FIFO, người chờ lâu nhất được phục vụ trước
        this.timeoutMs = timeoutMs;
        this.clock = clock;
    }

    Conn borrow() {
        boolean got;
        try {
            got = free.tryAcquire(timeoutMs, TimeUnit.MILLISECONDS);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("interrupted while waiting for a connection", e);
        }
        if (!got) throw new IllegalStateException("pool exhausted after " + timeoutMs + " ms");
        synchronized (this) {
            for (Conn slot : slots) {
                if (!slot.leased) {
                    slot.leased = true;
                    slot.borrowedAt = clock.millis(); // đồng hồ ảo giúp test leak xác định
                    return slot;
                }
            }
        }
        throw new IllegalStateException("invariant broken: permit without free slot");
    }

    void release(Conn c) {
        if (c == null) return;
        synchronized (this) {
            if (!c.leased) return; // trả lần hai: bỏ qua để không nhân đôi permit
            c.leased = false;
        }
        free.release();
    }

    int leased() {
        synchronized (this) {
            int n = 0;
            for (Conn slot : slots) if (slot.leased) n++;
            return n;
        }
    }

    int leakedOver(long thresholdMs) {
        long now = clock.millis();
        synchronized (this) {
            int n = 0;
            for (Conn slot : slots) if (slot.leased && now - slot.borrowedAt > thresholdMs) n++;
            return n;
        }
    }
}`,
    hints:['Dùng {{Semaphore(size, true)}} và {{tryAcquire(timeoutMs, TimeUnit.MILLISECONDS)}}; false thì ném {{IllegalStateException}}.','Đánh dấu slot bằng mảng {{Conn}} có cờ {{leased}}: mượn ghi {{borrowedAt = clock.millis()}}, trả phải từ chối nhả permit khi slot đang rảnh.','leakedOver chỉ đếm slot đang leased và so {{clock.millis() - borrowedAt}} với ngưỡng.','Test concurrency: {{ExecutorService}}, {{CountDownLatch}} chờ hiệu lệnh, {{Future.get}} để lộ exception.'],
    explain:`Semaphore đóng vai bộ đếm slot; {{tryAcquire}} có timeout chính là hành vi "chờ tới {{connectionTimeout}} rồi ném lỗi" của pool thật, còn Clock làm phần đếm thời gian giữ kết nối chạy xác định (không phụ thuộc tốc độ máy). Trả hai lần mà vẫn nhả permit là lỗi kinh điển: pool được thêm slot ảo, hai thread cùng dùng một kết nối và mọi thứ hỏng rất khó đoán, nên {{release}} phải kiểm tra trạng thái trước khi nhả permit. Trong hệ thật HikariCP không dùng Semaphore mà dùng một "ConcurrentBag" plus hàng đợi FIFO cho request; ý tưởng vẫn là mượn có giới hạn, chờ có giới hạn, trả bắt buộc. {{maxLifetime}} và {{idleTimeout}} là hai chuyện khác: chúng đóng kết nối chủ động để tránh kết nối chết, không liên quan tới việc cạn pool.}`
  }],
  check:[
    {q:'App báo "request timed out waiting for a connection" trong khi database hoàn toàn khỏe. Nguyên nhân hợp lý nhất?',options:['Database bị tắt','Pool cạn vì connection bị giữ quá lâu hoặc rò rỉ, yêu cầu mới không mượn được slot','Statement timeout quá nhỏ','Index bị hỏng'],answer:1,explain:'Lỗi này sinh ở tầng pool trước khi có SQL gửi đi; phải tìm ai đang giữ kết nối và giữ bao lâu.'},
    {q:'Vì sao tăng pool từ 10 lên 200 có thể làm mọi thứ chậm hơn?',options:['Vì JDBC không hỗ trợ pool lớn','Vì driver phải mở nhiều connection cùng lúc','Vì database chỉ có giới hạn CPU và bộ nhớ; mỗi connection thêm process tranh tài nguyên, không thêm sức mạnh','Vì PostgreSQL cấm quá 100 connection'],answer:2,explain:'Khi CPU DB đã bão, connection thêm chỉ làm tăng chuyển bối cảnh và memory; max_connections cũng là trần cứng.'},
    {q:'Bật leakDetectionThreshold của HikariCP cho gì?',options:['Log kèm stack trace của nơi đã mượn một kết nối chưa trả sau ngưỡng thời gian','Danh sách query chậm','Tự động đóng transaction mở quá lâu','Số connection tối đa an toàn'],answer:0,explain:'Nó in ra chỗ đã lấy kết nối và quên trả, giúp lần ra dòng code thiếu close hoặc đang giữ qua call ngoài.'},
    {q:'Hành vi nào chắc chắn gây rò rỉ kết nối?',options:['Dùng try-with-resources','Mượn kết nối rồi return trong một nhánh mà không có finally','Đặt connectionTimeout thấp','Đóng pool khi shutdown'],answer:1,explain:'Nhánh return sớm bỏ qua lời release; try-with-resources hoặc finally là cách an toàn duy nhất.'}
  ],
  tags:['connection-pool','HikariCP','Semaphore','leak-detection','timeout']
},
{
  id:'lesson-db-007',track:'db',order:7,title:'Deadlock: hai giao dịch khoá ngược chiều và cách database phá vòng chờ',level:'senior',minutes:30,
  goals:['Vẽ được lịch khoá của hai transaction chuyển tiền ngược chiều','Giải thích wait-for graph và vì sao chu trình nghĩa là deadlock','Nêu cách database chọn nạn nhân và mã lỗi 40P01','Áp dụng quy tắc khoá theo thứ tự cố định và retry có giới hạn'],
  body:`**Tóm tắt:** Deadlock là hai (hay nhiều) transaction cùng giữ khoá và cùng chờ khoá của nhau, nên không ai đi tiếp được. Database phát hiện vòng chờ và tự hủy một bên để những bên còn lại chạy. Cách phòng chính là để mọi transaction khoá các hàng theo cùng một thứ tự.

### Nhắc lại: khoá hàng hoạt động thế nào
Khi bạn chạy {{UPDATE account SET balance = balance - 100 WHERE id = 1}}, database đặt một **row lock** (khoá trên đúng một hàng) ở chế độ ghi, và theo quy tắc two-phase locking nó **giữ khoá đó tới khi commit hoặc rollback**, không nhả giữa chừng. Transaction khác muốn ghi cùng hàng phải chờ. Chờ là bình thường; chờ hai chiều mới thành deadlock.

### Kịch bản kinh điển: chuyển tiền ngược chiều
Hai request đến gần đồng thời: T1 chuyển A sang B, T2 chuyển B sang A.

~~~sql
-- T1                                 -- T2
START TRANSACTION;                     START TRANSACTION;
UPDATE acc SET bal = bal - 10          UPDATE acc SET bal = bal + 10
  WHERE id = 'A';                        WHERE id = 'B';
-- đã khoá A, đang chờ B                -- đã khoá B, đang chờ A
UPDATE acc SET bal = bal + 10          UPDATE acc SET bal = bal - 10
  WHERE id = 'B';                        WHERE id = 'A';
COMMIT;                                COMMIT;
~~~

~~~seq
title: Vòng chờ khoá giữa hai transaction
actors: T1 | DB | T2
T1 -> DB: UPDATE tài khoản A
DB --> T1: đang giữ khoá A
T2 -> DB: UPDATE tài khoản B
DB --> T2: đang giữ khoá B
T1 -> DB: UPDATE tài khoản B
note DB: B đang bị T2 giữ, T1 phải chờ
T2 -> DB: UPDATE tài khoản A
note DB: A đang bị T1 giữ, T2 phải chờ
note T1..T2: vòng chờ: T1 đợi T2 và T2 đợi T1
~~~

Sơ đồ wait-for graph (đỉnh là transaction, cạnh "đang chờ") có dạng vòng:

~~~text
T1 ---> T2        (T1 chờ khoá mà T2 đang giữ)
T1 <--- T2        (T2 chờ khoá mà T1 đang giữ)
chu trình: T1 -> T2 -> T1
~~~

T1 không nhả A vì chưa commit; T2 không nhả B vì chưa commit; cả hai cứ chờ. Chờ thêm cũng không bao giờ tự hết, nên database phải cắt vòng: đây là deadlock, định nghĩa hình thức là **chu trình trong wait-for graph**.

### Database phát hiện và phá vòng thế nào
Phát hiện chu trình tốn công, nên PostgreSQL không kiểm tra mỗi lần chờ khoá. Tham số {{deadlock_timeout}} (mặc định 1000 ms): transaction chờ khoá quá 1 giây thì server mới dựng wait-for graph và tìm chu trình. Vì vậy triệu chứng trên production thường là "một giao dịch đứng đúng khoảng 1 giây rồi chết".

PostgreSQL báo lỗi {{ERROR: deadlock detected}}, SQLSTATE {{40P01}}, và ghi log cho biết hai bên đang giữ và chờ khoá gì. MySQL/InnoDB phát hiện gần như tức thì, báo {{ERROR 1213 (HY000): Deadlock found}} và in chi tiết vào {{SHOW ENGINE INNODB STATUS}}; Oracle báo ORA-00060 và rollback (hoàn tác) câu lệnh vừa phát hiện vòng chờ, nên ứng dụng vẫn phải xử lý lỗi và quyết định rollback transaction hay thử lại; SQL Server báo lỗi 1205.

Bên bị hủy gọi là **nạn nhân (victim)**, và mỗi DB chọn một kiểu: PostgreSQL hủy transaction cần "làm ít việc nhất để kết thúc", MySQL chọn transaction ít thay đổi chưa commit nhất (undo nhỏ), SQL Server chọn theo chi phí hủy đã định sẵn. Không hệ nào hứa "chọn transaction trẻ nhất"; bài tập bên dưới dùng quy tắc trẻ nhất chỉ để có một luật xác định, dễ kiểm tra.

Transaction bị hủy phải được ứng dụng chạy lại **toàn bộ** (bắt đầu transaction mới, đọc lại dữ liệu, tính lại), không chạy lại riêng câu SQL đã chết, vì các bước trước đó đã bị rollback.

### Cách phòng
1. **Khoá theo thứ tự cố định.** Mọi transaction sắp xếp các id cần khoá theo cùng một chiều, ví dụ luôn khoá id nhỏ trước. Đây là cách rẻ và hiệu quả nhất, chính là {{TransferLocks.order(a, b)}} trong bài tập.
2. **Bọc cả hai phép ghi trong một service định thứ tự**, đừng để mỗi nhánh nghiệp vụ tự viết hai UPDATE theo thứ tự riêng.
3. **Transaction ngắn.** Đừng gọi HTTP, đọc Redis, chờ người dùng trong transaction; mỗi giây giữ khoá là thêm cửa sổ va chạm.
4. **Có index cho điều kiện UPDATE.** {{UPDATE ... WHERE customer_id = ?}} không có index sẽ khóa quét nhiều hàng hơn và tăng xác suất chạm nhau (với PostgreSQL, hành vi khoá khi quét phụ thuộc plan và chế độ isolation; ý chung vẫn là quét càng rộng thì giữ khoá càng nhiều hàng).
5. **Chia nhỏ việc hoặc dùng queue theo khóa.** Gom các thao tác cùng một tài khoản vào một worker để không hai transaction cùng đụng nhau.
6. **Retry có giới hạn** với mã 40P01 (MySQL 1213, SQL Server 1205), kèm backoff; các deadlock do lock timeout thì SQLSTATE {{55P03}} ({{lock_not_available}}), và serialization failure là {{40001}} — retry có thể được nhưng đừng lẫn nguyên nhân.
7. Nếu contention quá cao, cân nhắc thiết kế lại: một UPDATE nguyên tử cho cả hai phía, số dư giữ ở một hàng, hoặc optimistic locking (xem bài version check).

| Hiện tượng | Đặc điểm | Cách xử lý |
|---|---|---|
| Blocking bình thường | một bên chờ, bên kia rồi commit | không cần làm gì, trừ khi chờ quá lâu |
| Deadlock | chu trình, không bên nào tự đi | DB tự hủy một bên, ứng dụng retry |
| Starvation | bên chờ không bao giờ tới lượt | Hàng đợi FIFO không đủ, phải kiểm tra giao dịch ưu tiên |
| Lost update | không ai chờ, một ghi đè ghi khác | version check hoặc UPDATE nguyên tử (xem bài học trước) |

### Lỗi hay gặp
- Retry riêng câu SQL thay vì retry cả transaction: nghiệp vụ đã mất phần trừ tiền ở bước trước.
- Retry không giới hạn khi hệ thống đang quá tải, làm deadlock nhiều hơn (khuếch đại tải).
- Hai code path cùng một tính năng nhưng thứ tự ngược nhau — một bên thêm tính năng mà quên luật khoá.
- Log không in lock stack trace nên không tái hiện được: cần giữ input và hai id liên quan trong log có kiểm soát.

### SQL và EXPLAIN PostgreSQL

~~~sql
-- Kiểm tra lock đang chờ và ai đang giữ (PostgreSQL)
SELECT blocked.pid AS blocked_pid, blocked.wait_event_type,
       blocked.left(query, 60) AS blocked_query,
       holding.pid AS holder_pid,
       holding.left(query, 60) AS holder_query
FROM pg_stat_activity blocked
JOIN pg_locks bl ON blocked.pid = bl.pid
JOIN pg_locks hl ON bl.locktype = hl.locktype
  AND bl.relation IS NOT DISTINCT FROM hl.relation
  AND hl.pid != blocked.pid
JOIN pg_stat_activity holding ON hl.pid = holding.pid
WHERE blocked.wait_event_type = 'Lock';

-- Lock theo thứ tự cố định: SELECT FOR UPDATE với ORDER BY
BEGIN;
SELECT * FROM accounts WHERE id IN (?, ?) ORDER BY id FOR UPDATE;
UPDATE accounts SET balance = balance - 100 WHERE id = ?;
UPDATE accounts SET balance = balance + 100 WHERE id = ?;
COMMIT;

-- Kiểm tra deadlock và lock wait
SELECT pid, state, wait_event_type, wait_event,
       left(query, 80) AS query_snippet,
       now() - query_start AS query_age
FROM pg_stat_activity
WHERE wait_event_type = 'Lock'
ORDER BY query_age DESC;
~~~

EXPLAIN (ANALYZE, BUFFERS) cho SELECT FOR UPDATE ở trên:
- **Index Scan**: dùng index trên {{id}} để tìm entry, sau đó lock từng row theo TID.
- **Seq Scan**: nếu không có index trên cột điều kiện WHERE, planner quét toàn bộ bảng và lock nhiều hàng hơn — tăng khả năng deadlock.
- **Buffers**: {{shared hit}} vs {{read}} — giúp thấy chi phí I/O của việc lock và quét.

### Liên hệ phỏng vấn
Mô tả đúng vòng: T1 khoá A chờ B, T2 khoá B chờ A; giải thích wait-for graph và chu trình; nói DB phát hiện (PostgreSQL sau {{deadlock_timeout}}, MySQL gần như ngay) và tự hủy một transaction với SQLSTATE {{40P01}}; rồi nêu ba lớp phòng vệ theo thứ tự ưu tiên: thống nhất thứ tự khoá ở tầng service, transaction ngắn, retry cả transaction có giới hạn. Nói thêm cách đo: số deadlock mỗi phút, thời gian chờ khoá, danh sách cặp id hay va chạm.

> Senior tip: ở nghiệp vụ chuyển tiền, thứ tự cố định thường đủ; nếu bạn thấy deadlock lặp lại cùng một cặp khóa, vấn đề nằm ở mô hình (nhiều giao dịch chạm cùng hàng nóng), nên đổi thiết kế như một UPDATE hai cột hoặc gộp theo tài khoản, thay vì chỉ thêm retry.
`,
  exercises:[{
    title:'Wait-for graph: tìm chu trình, chọn nạn nhân, và thứ tự khoá an toàn',
    prompt:`Cài {{WaitForGraph}} (chu trình trong đồ thị chờ khoá) và {{TransferLocks}} (thứ tự khoá cố định).

{{WaitForGraph}}:
- {{addWait(tx, holder)}} ghi nhận "tx đang chờ holder". Transaction nào xuất hiện lần đầu được đánh số thứ tự bắt đầu: lần xuất hiện **sau** nghĩa là **trẻ hơn**.
- {{findCycle()}} trả danh sách các tx trong một chu trình, theo chiều "tx đầu chờ tx kế tiếp, tx cuối chờ tx đầu"; không có chu trình thì trả danh sách rỗng. Kết quả phải xác định: thử DFS từ tx lâu đời nhất, theo thứ tự cạnh đã thêm, và xoay chu trình để bắt đầu bằng tx lâu đời nhất trong chu trình.
- {{victim()}} trả tx **trẻ nhất** trong chu trình mà {{findCycle()}} tìm được, hoặc {{null}} nếu không có chu trình.

{{TransferLocks}}:
- {{order(a, b)}} trả danh sách id theo thứ tự phải khoá, id nhỏ hơn trước (so sánh chuỗi); nếu hai id bằng nhau thì trả danh sách một phần tử, vì chỉ cần khoá một lần.
- {{order}} không được phụ thuộc vào thứ tự tham số: {{order(a, b)}} và {{order(b, a)}} phải bằng nhau.

Mọi phép so sánh dựa trên thứ tự chèn ({{LinkedHashMap}} hoặc {{ArrayList}}), không dùng {{HashSet}}/{{HashMap}} để duyệt kết quả, để cùng một input luôn cho cùng một output.`,
    starter:`import java.util.*;

class WaitForGraph {
    void addWait(String tx, String holder) { throw new UnsupportedOperationException("TODO"); }

    List<String> findCycle() { throw new UnsupportedOperationException("TODO"); }

    String victim() { throw new UnsupportedOperationException("TODO"); }
}

class TransferLocks {
    static List<String> order(String a, String b) { throw new UnsupportedOperationException("TODO"); }
}`,
    tests:`public class Main {
 static int p=0,t=0;
 static void c(String n,Runnable r){t++;try{r.run();p++;System.out.println("PASS "+n);}catch(Throwable e){System.out.println("FAIL "+n+": "+e);}}
 static void eq(Object a,Object b){if(!Objects.equals(a,b))throw new AssertionError(a+" != "+b);}
 static void ok(boolean b){if(!b)throw new AssertionError("expected true");}
 public static void main(String[]z){
  c("chain is not a deadlock",()->{WaitForGraph g=new WaitForGraph();g.addWait("T1","T2");g.addWait("T2","T3");eq(List.of(),g.findCycle());ok(g.victim()==null);});
  c("two transfers form a cycle",()->{WaitForGraph g=new WaitForGraph();g.addWait("T1","T2");g.addWait("T2","T1");eq(List.of("T1","T2"),g.findCycle());eq("T2",g.victim());});
  c("three tx cycle",()->{WaitForGraph g=new WaitForGraph();g.addWait("T1","T2");g.addWait("T2","T3");g.addWait("T3","T1");eq(List.of("T1","T2","T3"),g.findCycle());eq("T3",g.victim());});
  c("waiting on itself is a cycle",()->{WaitForGraph g=new WaitForGraph();g.addWait("T1","T1");eq(List.of("T1"),g.findCycle());eq("T1",g.victim());});
  c("victim must come from the cycle",()->{WaitForGraph g=new WaitForGraph();g.addWait("T0","T1");g.addWait("T1","T2");g.addWait("T2","T1");eq(List.of("T1","T2"),g.findCycle());eq("T2",g.victim());});
  c("diamond has no cycle",()->{WaitForGraph g=new WaitForGraph();g.addWait("T4","T2");g.addWait("T4","T3");g.addWait("T2","T1");g.addWait("T3","T1");eq(List.of(),g.findCycle());ok(g.victim()==null);});
  c("youngest means seen last",()->{WaitForGraph g=new WaitForGraph();g.addWait("T2","T1");g.addWait("T1","T2");eq(List.of("T2","T1"),g.findCycle());eq("T1",g.victim());});
  c("edges can be added twice",()->{WaitForGraph g=new WaitForGraph();g.addWait("A","B");g.addWait("A","B");eq(List.of(),g.findCycle());g.addWait("B","A");eq(List.of("A","B"),g.findCycle());eq("B",g.victim());});
  c("locks ordered ascending",()->eq(List.of("acct-01","acct-02"),TransferLocks.order("acct-02","acct-01")));
  c("same account locked once",()->eq(List.of("acct-07"),TransferLocks.order("acct-07","acct-07")));
  c("order ignores argument order",()->eq(TransferLocks.order("acct-09","acct-03"),TransferLocks.order("acct-03","acct-09")));
  System.out.println("RESULT "+p+"/"+t);
 }
}`,
    reference:`import java.util.*;

class WaitForGraph {
    private final Map<String, List<String>> waits = new LinkedHashMap<>(); // tx -> những tx nó chờ, theo thứ tự thêm vào
    private final List<String> born = new ArrayList<>();                   // thứ tự xuất hiện = thứ tự bắt đầu

    void addWait(String tx, String holder) {
        register(tx);
        register(holder);
        List<String> out = waits.computeIfAbsent(tx, k -> new ArrayList<>());
        if (!out.contains(holder)) out.add(holder); // cạnh trùng chỉ tính một lần
    }

    private void register(String tx) {
        if (!born.contains(tx)) born.add(tx);
    }

    List<String> findCycle() {
        for (String start : born) { // thử từ tx lâu đời nhất trước để kết quả xác định
            List<String> cycle = walk(start, new ArrayList<>(), new HashSet<>());
            if (cycle != null) return rotateToOldest(cycle);
        }
        return List.of();
    }

    private List<String> walk(String node, List<String> path, Set<String> onPath) {
        path.add(node);
        onPath.add(node);
        for (String next : waits.getOrDefault(node, List.of())) {
            if (onPath.contains(next)) {
                return new ArrayList<>(path.subList(path.indexOf(next), path.size()));
            }
            List<String> found = walk(next, path, onPath);
            if (found != null) return found;
        }
        onPath.remove(node);
        path.remove(path.size() - 1);
        return null;
    }

    private List<String> rotateToOldest(List<String> cycle) {
        int best = 0, bestRank = born.indexOf(cycle.get(0));
        for (int i = 1; i < cycle.size(); i++) {
            int rank = born.indexOf(cycle.get(i));
            if (rank < bestRank) { bestRank = rank; best = i; }
        }
        List<String> out = new ArrayList<>(cycle.subList(best, cycle.size()));
        out.addAll(cycle.subList(0, best));
        return out;
    }

    String victim() {
        List<String> cycle = findCycle();
        if (cycle.isEmpty()) return null;
        String youngest = cycle.get(0);
        for (String tx : cycle) if (born.indexOf(tx) > born.indexOf(youngest)) youngest = tx;
        return youngest;
    }
}

class TransferLocks {
    static List<String> order(String a, String b) {
        int cmp = a.compareTo(b);
        if (cmp == 0) return List.of(a);            // cùng một hàng thì chỉ khoá một lần
        return cmp < 0 ? List.of(a, b) : List.of(b, a);
    }
}`,
    hints:['Dùng {{LinkedHashMap}} cho cạnh và {{ArrayList}} cho thứ tự xuất hiện để mọi kết quả xác định.','DFS có {{path}} và {{onPath}}: khi gặp đỉnh đã nằm trên path, cắt {{path}} từ vị trí đỉnh đó để được chu trình.','Nạn nhân là tx có chỉ số lớn nhất trong {{born}} nhưng chỉ tính các tx thuộc chu trình.','order(a, b): so sánh chuỗi rồi trả danh sách theo chiều tăng dần; hai id bằng nhau thì một phần tử.'],
    explain:`Chu trình trong wait-for graph chính là định nghĩa deadlock: mỗi đỉnh giữ một khoá mà đỉnh kế tiếp cần. Thứ tự xuất hiện dùng làm "tuổi" chỉ là luật đơn giản, xác định cho bài tập; PostgreSQL thật chọn nạn nhân theo chi phí hoàn tất, MySQL theo lượng undo. Điều quan trọng khi đi phỏng vấn là hai ý: phát hiện có chi phí nên PostgreSQL chờ quá {{deadlock_timeout}} (1 giây) mới dựng đồ thị, và nạn nhân bị rollback **toàn bộ transaction** nên ứng dụng phải đọc lại rồi tính lại, không chạy lại một câu SQL. {{TransferLocks.order}} mô tả cách phòng rẻ nhất: mọi transaction đều khoá id nhỏ trước thì đồ thị chờ không thể thành vòng, vì cạnh luôn đi từ "đang chờ id lớn" sang "đang giữ id nhỏ" và không có đường quay lại. Trong code thật, hàm này thường nhận danh sách nhiều id và sắp xếp toàn bộ trước khi khoá, hoặc dùng {{SELECT ... FOR UPDATE}} có {{ORDER BY}} cùng một thứ tự.}`
  }],
  check:[
    {q:'Bất biến nào đủ để hai transaction không tạo thành deadlock?',options:['Chúng dùng hai bảng khác nhau','Mỗi transaction khoá đúng hai hàng','Mọi transaction đều khoá các hàng theo cùng một thứ tự cố định','Chúng chạy ở READ COMMITTED'],answer:2,explain:'Với một thứ tự khoá toàn cục, wait-for graph chỉ có cạnh theo một chiều nên không thể có chu trình.'},
    {q:'PostgreSQL thường báo deadlock chậm khoảng một giây vì lý do gì?',options:['Network delay giữa app và DB','Vì phải chờ deadlock_timeout trước khi dựng wait-for graph và tìm chu trình','Vì lock được xếp hạng theo priority','Vì MVCC cần snapshot'],answer:1,explain:'Phát hiện chu trình tốn chi phí nên chỉ chạy khi một transaction đã chờ khoá quá deadlock_timeout, mặc định 1000 ms.'},
    {q:'Transaction của bạn bị hủy vì deadlock. Cách retry đúng là gì?',options:['Chạy lại riêng câu UPDATE vừa chết','Bắt đầu transaction mới, đọc lại dữ liệu và tính lại toàn bộ nghiệp vụ','Đặt isolation thấp hơn để tránh deadlock','Tăng deadlock_timeout'],answer:1,explain:'Rollback vì deadlock hủy toàn bộ thay đổi của transaction, nên mọi bước trước đó phải được thực hiện lại trong transaction mới.'},
    {q:'Yếu tố nào thường làm deadlock tăng lên chứ không giảm?',options:['Sắp xếp id cần khoá theo thứ tự tăng dần','Rút ngắn transaction','UPDATE với điều kiện không dùng index nên quét và khoá nhiều hàng','Giới hạn số lần retry'],answer:2,explain:'Không có index thì phạm vi hàng bị đụng rộng hơn, số cặp khoá xung đột tăng theo cấp số nhân.'}
  ],
  tags:['deadlock','locking','wait-for-graph','PostgreSQL','retry']
},
{
  id:'lesson-db-008',track:'db',order:8,title:'MVCC: snapshot nào nhìn thấy dòng nào',level:'senior',minutes:30,
  goals:['Đọc được một hàng qua cặp xmin/xmax','Suy ra phiên bản nào nhìn thấy được với một snapshot cho trước','Phân biệt snapshot lấy theo câu lệnh và theo transaction','Giải thích vì sao UPDATE tạo phiên bản mới và VACUUM dọn cái gì'],
  body:`**Tóm tắt:** MVCC (Multi-Version Concurrency Control — điều khiển đồng thời bằng nhiều phiên bản) giữ cùng lúc vài phiên bản của một hàng, và mỗi transaction nhận một **snapshot** (ảnh chụp) quyết định nó được thấy phiên bản nào. Người đọc không phải chờ người ghi, đổi lại mỗi UPDATE để lại một "tuple chết" trong bảng và VACUUM chỉ dọn được nó khi không còn snapshot nào cần tới.

### Một "hàng" thật ra là một chuỗi phiên bản
Bảng trong PostgreSQL được chia thành các **page** 8 KB. Mỗi lần INSERT hoặc UPDATE, database không sửa tại chỗ mà **ghi thêm một tuple** (một phiên bản của hàng) vào page còn chỗ. Hàng id=42 vì thế có thể có ba tuple cùng mang id=42 trong cùng một page. Đọc một hàng thực chất là: chọn trong chuỗi tuple đó tuple mà transaction mình **được phép thấy**.

Có ba trường phái xử lý khi hai transaction cùng chạm một hàng:

| Trường phái | Chuyện xảy ra | Giá phải trả |
|---|---|---|
| Khoá hàng, reader phải chờ writer (SQL Server mặc định, PostgreSQL khi UPDATE/SELECT FOR UPDATE) | luôn có đúng một bản trên đĩa | reader bị chặn, reader chậm kéo theo mọi người khác chờ |
| Ghi đè tại chỗ, giữ bản cũ trong **undo log** (Oracle, MySQL InnoDB) | reader dựng lại bản cũ từ undo khi cần | undo chain dài, mỗi record mang con trỏ tới bản trước |
| Lưu nhiều phiên bản ngay trong bảng (PostgreSQL) | reader chỉ việc chọn tuple theo snapshot | bảng phình vì tuple chết, cần VACUUM liên tục |

### xmin và xmax: hai con dấu trên mỗi tuple
Header của mỗi tuple chứa hai id transaction quan trọng nhất (kèm một con trỏ vật lý tới phiên bản kế tiếp):

- **xmin**: transaction đã **sinh ra** phiên bản này (do INSERT hoặc do UPDATE tạo bản mới).
- **xmax**: transaction đã **xoá hoặc thay thế** phiên bản này; bằng 0 khi chưa ai đụng vào.
- **Transaction id (xid)** là số nguyên 32 bit tăng dần, được cấp cho transaction đầu tiên có thao tác ghi (transaction chỉ đọc không cần xid riêng — nó chỉ mang snapshot). Nên "xid lớn hơn" đơn giản nghĩa là "bắt đầu ghi muộn hơn".

~~~text
 id | balance | xmin | xmax
 42 |   10    | 100  | 201     <- ban cu: T201 da thay the no
 42 |   12    | 201  |  0      <- ban dang mo (chua bi thay the)
~~~

Cả hai dòng đều còn nguyên trong page. Chỉ snapshot mới quyết định bạn đọc dòng nào.

### Snapshot gồm ba con số
PostgreSQL dựng snapshot ở đầu mỗi câu lệnh ({{READ COMMITTED}}) hoặc ở đầu transaction ({{REPEATABLE READ}} / {{SERIALIZABLE}}), gồm:

- **xmin**: xid cũ nhất mà snapshot còn phải để ý — mọi xid nhỏ hơn đã kết thúc từ lâu.
- **xmax**: xid sẽ được cấp tiếp theo — mọi xid từ xmax trở lên diễn ra **sau** snapshot.
- **xip**: danh sách các xid **đang chạy** đúng lúc lấy snapshot (in-progress list).

~~~sql
SELECT txid_current_snapshot();          -- vi du tra ve: 101:105:[103,104]
--                                              xmin  xmax  xip
-- Tu PG 13 co kieu pg_snapshot voi cac ham
-- pg_snapshot_xmin / pg_snapshot_xmax / pg_snapshot_xip
-- va pg_visible_in_snapshot(xid, snapshot) de tham chieu mot xid.
~~~

Suy luận "transaction X đã kết thúc và đã commit **theo snapshot S**":

| Vị trí của X | Kết luận với S |
|---|---|
| X là transaction của chính S | luôn coi là đã commit — thay đổi của mình thì mình phải thấy, kể cả chưa commit |
| X nhỏ hơn xmin của S | đã kết thúc trước snapshot; commit thì thấy, abort (rollback) thì không |
| xmin tới xmax, X nằm trong xip | đang chạy lúc chụp ảnh → chưa commit → **không thấy** |
| xmin tới xmax, X không nằm trong xip | đã kết thúc trước snapshot → commit thì thấy |
| X từ xmax trở lên | diễn ra sau snapshot → **không thấy** (dù sau đó X đã commit) |

Gộp lại thành quy tắc nhìn thấy — và cũng là hàm {{visible(row, snapshot)}} trong bài tập:

> Một tuple nhìn thấy được **khi và chỉ khi**: xmin được coi là đã commit theo snapshot, **và** xmax KHÔNG được coi là đã commit theo snapshot (xmax = 0 luôn thoả vế sau).

Vế đầu trả lời "phiên bản này đã tồn tại chưa", vế sau trả lời "đã bị thay thế chưa". Một transaction abort thì mọi phiên bản nó sinh ra vĩnh viễn vô hình với tất cả mọi người.

### SQL và EXPLAIN PostgreSQL

~~~sql
-- Xem snapshot hiện tại (xmin:xmax:[xip])
SELECT txid_current_snapshot();

-- Xem tuple đang sống/chết trên một bảng (xmin, xmax, cột dữ liệu)
SELECT xmin, xmax, balance, ctid FROM accounts WHERE id = 42;

-- Kiểm tra visibility theo snapshot cụ thể
SELECT pg_visible_in_snapshot(100, '(101:105:[103,104])');

-- Xem số tuple dead/live và lần vacuum cuối
SELECT relname, n_live_tup, n_dead_tup, last_autovacuum, last_vacuum
FROM pg_stat_user_tables
ORDER BY n_dead_tup DESC
LIMIT 10;

-- Kiểm tra ai đang giữ snapshot cũ (xmin horizon)
SELECT pid, state, now() - xact_start AS xact_age,
       now() - query_start AS query_age,
       left(query, 80) AS query_snippet
FROM pg_stat_activity
WHERE xact_start IS NOT NULL
ORDER BY xact_start;

-- EXPLAIN (ANALYZE, BUFFERS): xem plan và heap fetch
EXPLAIN (ANALYZE, BUFFERS)
SELECT balance FROM accounts WHERE id = 42;
~~~

EXPLAIN (ANALYZE, BUFFERS) cho câu truy vấn ở trên:
- **Index Scan**: tìm entry theo {{id}}, sau đó read heap theo TID và kiểm tra visibility theo snapshot.
- **Index Only Scan**: chỉ xảy ra khi index chứa đủ cột và visibility map cho page all-visible — không cần heap fetch.
- **Buffers**: {{shared hit}} vs {{read}} — giúp thấy I/O thực tế.
- **Heap Fetches**: số lần phải đọc heap; nếu cao dù index đủ cột, có thể visibility map chưa set (cần VACUUM).

### Cùng một lịch, hai kết quả
~~~seq
title: Hai transaction trên cùng hàng id 42
actors: T1 | PostgreSQL | T2
T1 -> PostgreSQL: BEGIN roi SELECT so du lan dau
PostgreSQL --> T1: 10 (tuple co xmin 100)
T2 -> PostgreSQL: UPDATE so du thanh 12
PostgreSQL -> PostgreSQL: tuple cu nhan xmax 201, them tuple moi xmin 201
T2 -> PostgreSQL: COMMIT
note PostgreSQL: tuple cu van nam trong page, chua ai xin xoa
T1 -> PostgreSQL: SELECT so du lan thu hai
PostgreSQL --> T1: READ COMMITTED thay 12 vi lay snapshot moi
note T1: REPEATABLE READ van thay 10 vi giu snapshot cu
~~~

Đây chính là khác biệt được đóng gói trong một chữ: **điểm chụp ảnh**. {{READ COMMITTED}} chụp lại mỗi câu SQL, nên hai câu SELECT trong cùng transaction có thể ra hai giá trị (non-repeatable read hợp lệ). {{REPEATABLE READ}} chụp một lần, nên toàn bộ transaction làm việc trên cùng một trạng thái logic của database — nhưng khi nó muốn sửa một hàng mà người khác đã sửa và commit sau điểm chụp, PostgreSQL **không ghi đè** mà báo {{could not serialize access due to concurrent update}} (SQLSTATE {{40001}}), và ứng dụng phải retry cả transaction.

### Vì sao UPDATE tạo phiên bản mới thay vì ghi đè
- **Reader không bao giờ chờ writer, writer không chờ reader.** Đó là toàn bộ lợi ích: một báo cáo đọc 10 giây không làm tê liệt API đặt hàng, và ngược lại. Chỉ writer-vs-writer **cùng một tuple** là phải chờ nhau (kèm theo hoặc lỗi 40001, hoặc đọc lại bản mới, tuỳ mức isolation).
- **Giá phải trả là dung lượng và index.** Một UPDATE không phải HOT (Heap-Only Tuple — cập nhật chỉ chạm cột không có index và page còn chỗ trống) phải ghi thêm entry vào **mọi index** của bảng. HOT thì index đứng nguyên. Đó là lý do sửa một cột được index hoá làm bảng phình nhanh hơn nhiều so với sửa cột thường.
- **Index không phân biệt sống/chết.** Entry trong index trỏ tới cả tuple sống lẫn tuple chết, nên khi lấy hàng database phải kiểm tra visibility từng dòng. Các bit "all-visible" trong **visibility map** cho phép bỏ qua kiểm tra đó và là điều kiện cần của index-only scan.

### Tuple chết và VACUUM
Tuple mà không snapshot nào còn có thể cần gọi là **dead tuple**. VACUUM làm ba việc:

1. Dọn dead tuple, đánh dấu khoảng trống trong page để tái sử dụng (chỉ trả dung lượng về hệ điều hành với các page trống ở **cuối** bảng).
2. Đóng băng (**freeze**) xid của các hàng quá cũ. xid chỉ có 32 bit và quay vòng; nếu dữ liệu vẫn mang xid mà database hiện tại hiểu là "lớn hơn", nó sẽ bị coi là tương lai và **vô hình** — mất dữ liệu trên lý thuyết. Vì vậy PostgreSQL cưỡng bức vacuum ở {{autovacuum_freeze_max_age}} (mặc định 200 triệu xid) và có thể từ chối nhận ghi khi {{age(datfrozenxid)}} tiến gần 2 tỷ.
3. Cập nhật thống kê và visibility map.

Điều kiện 1 có một hệ quả sống còn: **VACUUM không được phép xoá tuple mà một snapshot đang mở còn cần.** Nên chỉ cần một transaction mở lâu là cả bảng bắt đầu phình:

~~~sql
-- Ai đang giữ "xmin horizon" (ngăn chặn thứ nhất khi bảng phình bất thường)?
SELECT pid, state, now() - xact_start AS mo_du_ra, left(query, 60) AS cau_lenh
FROM pg_stat_activity
WHERE xact_start IS NOT NULL
ORDER BY xact_start;
-- Ke ca: replication slot chua duoc tieu thu, transaction PREPARE bo quen.
~~~

**Autovacuum** chạy khi số thay đổi ước lượng vượt ngưỡng: {{autovacuum_vacuum_threshold}} (50) cộng {{autovacuum_vacuum_scale_factor}} (0.2) nhân số hàng — tức bảng 10 triệu hàng cần khoảng 2 triệu lần sửa để tự dọn, đó là lý do bảng rất lớn nên hạ scale factor về 0.01 hoặc đặt lịch vacuum thủ công theo bảng nóng.

~~~sql
SELECT relname, n_live_tup, n_dead_tup, last_autovacuum, last_vacuum
FROM pg_stat_user_tables
ORDER BY n_dead_tup DESC
LIMIT 10;

VACUUM (VERBOSE, ANALYZE) account;   -- doc "removed N dead row versions"
~~~

### Java: mô hình hoá quyết định nhìn thấy
~~~java
// Tuple: (value, xmin, xmax). Snapshot: (own, cac xid da commit tai thoi diem chup anh).
boolean visible(int xmin, int xmax, int own, Set<Integer> committed) {
    boolean born = xmin == own || committed.contains(xmin);        // da ton tai voi minh
    boolean gone = xmax != 0 && (xmax == own || committed.contains(xmax)); // da bi thay the
    return born && !gone;
}
~~~

Bài tập dưới đây dùng đúng hai biến {{born}} và {{gone}}; toàn bộ hành vi "snapshot nào nhìn thấy dòng nào" của PostgreSQL gói lại trong bốn dòng đó.

### Lỗi hay gặp
- **idle in transaction**: connection mượn từ pool, mở transaction, rồi không commit/rollback (thường vì code return sớm hoặc app crash nhưng session vẫn sống). Đặt {{idle_in_transaction_session_timeout}} để DB tự cắt.
- **Job batch một transaction khổng lồ**: 5 triệu dòng trong một BEGIN/COMMIT — vừa giữ snapshot vừa sinh 5 triệu tuple chết cùng lúc.
- Nghĩ rằng "UPDATE trả 0 dòng nghĩa là hàng không tồn tại" ở {{REPEATABLE READ}}; ở mức này xung đột ghi biểu hiện bằng exception 40001, còn 0 dòng thường là predicate version không khớp (xem bài optimistic locking).
- **VACUUM FULL** trên bảng lớn: nó dựng lại bảng và **giữ khoá độc quyền** — đừng chạy trong giờ cao điểm; {{pg_repack}} làm việc đó online.
- Index phình: VACUUM thường không thu nhỏ index, chỉ REINDEX hoặc {{pg_repack}} mới làm được; từ PostgreSQL 14 VACUUM có thể dọn entry trùng trong B-tree nhưng không co cây lại.

### Liên hệ phỏng vấn
Hãy trả lời theo chuỗi nhân quả: mỗi hàng là một chuỗi tuple mang xmin/xmax; snapshot gồm xmin/xmax/xip nên suy được xid nào đã commit, nào đang chạy, nào thuộc tương lai; một tuple visible khi xmin đã commit theo snapshot và xmax thì chưa; {{READ COMMITTED}} chụp ảnh theo câu lệnh nên thấy commit mới, {{REPEATABLE READ}} chụp theo transaction nên ổn định nhưng phải retry 40001; UPDATE ghi phiên bản mới để reader không chờ writer; hệ quả là dead tuple, và VACUUM chỉ dọn được khi không còn snapshot cũ — vì vậy một transaction mở lâu làm bảng phình. Sau đó nêu cách bạn chẩn đoán: {{pg_stat_activity}} tìm transaction già nhất, {{pg_stat_user_tables}} xem {{n_dead_tup}} và {{last_autovacuum}}.

> Senior tip: khi được hỏi "bảng của tôi phình gấp 5 lần dữ liệu thật", câu trả lời trưởng thành không phải "chạy VACUUM FULL" mà là "tìm xem ai đang giữ xmin horizon" — 90% trường hợp là một job, một {{idle in transaction}}, hoặc một replication slot đã ngừng tiêu thụ.

`,
  exercises:[{
    title:'MvccTable: phiên bản nào nhìn thấy được với snapshot này?',
    prompt:`Mô phỏng một hàng của PostgreSQL theo quy tắc xmin/xmax. Cài {{MvccTable}} (và hai lớp tĩnh {{MvccTable.Version}}, {{MvccTable.Snapshot}}).

- {{insert(xid, value)}}: thêm phiên bản mới với {{xmin = xid}}, {{xmax = 0}}.
- {{update(xid, value)}}: **thay thế** — đặt {{xmax = xid}} lên mọi phiên bản đang mở ({{xmax = 0}}), rồi thêm phiên bản mới {{xmin = xid}}, {{xmax = 0}}. Không xoá phiên bản cũ nào khỏi bảng.
- {{delete(xid)}}: đặt {{xmax = xid}} lên mọi phiên bản đang mở, không thêm phiên bản mới. Không có phiên bản nào đang mở thì không làm gì.
- {{versions()}}: mọi phiên bản theo đúng thứ tự đã thêm (phiên bản cũ vẫn còn).
- {{visible(v, s)}} (static): {{true}} khi và chỉ khi xmin của v "đã commit theo s" VÀ xmax của v không "đã commit theo s". Với một xid bất kỳ, "đã commit theo s" nghĩa là xid khác 0 và ({{xid == s.own}} hoặc {{s.committed}} chứa xid). {{s.own}} là transaction đang đọc: thay đổi của chính nó luôn được nó thấy dù chưa commit.
- {{visibleTo(s)}}: các phiên bản visible, giữ thứ tự của {{versions()}}.
- {{read(s)}}: value của phiên bản visible **cuối cùng** trong thứ tự thêm (bản mới nhất mà snapshot thấy), hoặc {{-1}} nếu snapshot không thấy phiên bản nào.

Không dùng thread, không đồng hồ thật. Mọi kết quả phải xác định.`,
    starter:`import java.util.*;

class MvccTable {
    static final class Version {
        final int xmin, xmax, value;   // xmax = 0 khi chưa bị xoá hoặc thay thế
        Version(int xmin, int xmax, int value) {
            this.xmin = xmin; this.xmax = xmax; this.value = value;
        }
        public String toString() { return "v(xmin=" + xmin + ",xmax=" + xmax + ",val=" + value + ")"; }
    }

    static final class Snapshot {
        final int own;                 // xid của transaction đang đọc
        final Set<Integer> committed;  // các xid đã commit tại thời điểm chụp ảnh
        Snapshot(int own, Set<Integer> committed) {
            this.own = own;
            this.committed = new HashSet<>(committed);
        }
    }

    void insert(int xid, int value) { throw new UnsupportedOperationException("TODO"); }

    void update(int xid, int value) { throw new UnsupportedOperationException("TODO"); }

    void delete(int xid) { throw new UnsupportedOperationException("TODO"); }

    List<Version> versions() { throw new UnsupportedOperationException("TODO"); }

    static boolean visible(Version v, Snapshot s) { throw new UnsupportedOperationException("TODO"); }

    List<Version> visibleTo(Snapshot s) { throw new UnsupportedOperationException("TODO"); }

    int read(Snapshot s) { throw new UnsupportedOperationException("TODO"); }
}`,
    tests:`public class Main {
 static int p=0,t=0;
 static void c(String n,Runnable r){t++;try{r.run();p++;System.out.println("PASS "+n);}catch(Throwable e){System.out.println("FAIL "+n+": "+e);}}
 static void eq(Object a,Object b){if(!Objects.equals(a,b))throw new AssertionError(a+" != "+b);}
 static void ok(boolean b){if(!b)throw new AssertionError("expected true");}
 public static void main(String[]z){
  c("own uncommitted insert is visible to itself",()->{MvccTable x=new MvccTable();x.insert(10,5);eq(5,x.read(new MvccTable.Snapshot(10,Set.of())));eq(1,x.visibleTo(new MvccTable.Snapshot(10,Set.of())).size());});
  c("another tx uncommitted insert is invisible",()->{MvccTable x=new MvccTable();x.insert(10,5);eq(-1,x.read(new MvccTable.Snapshot(20,Set.of())));eq(0,x.visibleTo(new MvccTable.Snapshot(20,Set.of())).size());});
  c("once the writer committed the value appears",()->{MvccTable x=new MvccTable();x.insert(10,5);eq(5,x.read(new MvccTable.Snapshot(20,Set.of(10))));});
  c("update keeps the old version in the table",()->{MvccTable x=new MvccTable();x.insert(10,5);x.update(20,7);eq(2,x.versions().size());ok(x.versions().get(0).xmax==20);ok(x.versions().get(0).value==5);});
  c("old snapshot still reads the old value",()->{MvccTable x=new MvccTable();x.insert(10,5);x.update(20,7);eq(5,x.read(new MvccTable.Snapshot(30,Set.of(10))));eq(1,x.visibleTo(new MvccTable.Snapshot(30,Set.of(10))).size());});
  c("newer snapshot reads the new value",()->{MvccTable x=new MvccTable();x.insert(10,5);x.update(20,7);eq(7,x.read(new MvccTable.Snapshot(30,Set.of(10,20))));eq(1,x.visibleTo(new MvccTable.Snapshot(30,Set.of(10,20))).size());});
  c("the updater sees its own new version only",()->{MvccTable x=new MvccTable();x.insert(10,5);x.update(20,7);eq(7,x.read(new MvccTable.Snapshot(20,Set.of(10))));});
  c("delete bites only after the deleting tx commits",()->{MvccTable x=new MvccTable();x.insert(10,5);x.delete(30);eq(5,x.read(new MvccTable.Snapshot(40,Set.of(10))));eq(-1,x.read(new MvccTable.Snapshot(40,Set.of(10,30))));eq(0,x.visibleTo(new MvccTable.Snapshot(40,Set.of(10,30))).size());});
  c("repeatable read stable while read committed refreshes",()->{MvccTable x=new MvccTable();x.insert(10,100);x.update(20,200);x.update(30,300);eq(100,x.read(new MvccTable.Snapshot(50,Set.of(10))));eq(200,x.read(new MvccTable.Snapshot(50,Set.of(10,20))));eq(300,x.read(new MvccTable.Snapshot(50,Set.of(10,20,30))));});
  c("a tx replacing its own row sees just the newest",()->{MvccTable x=new MvccTable();x.insert(10,5);x.update(10,7);eq(7,x.read(new MvccTable.Snapshot(10,Set.of())));eq(1,x.visibleTo(new MvccTable.Snapshot(10,Set.of())).size());});
  c("never more than one visible version",()->{MvccTable x=new MvccTable();x.insert(10,5);x.update(20,7);x.update(30,9);atMostOne(x,Set.of());atMostOne(x,Set.of(10));atMostOne(x,Set.of(10,20));atMostOne(x,Set.of(10,20,30));atMostOne(x,Set.of(20));});
  System.out.println("RESULT "+p+"/"+t);
 }
 static void atMostOne(MvccTable x,Set<Integer> committed){ok(x.visibleTo(new MvccTable.Snapshot(50,committed)).size()<=1);}
}`,
    reference:`import java.util.*;

class MvccTable {
    static final class Version {
        final int xmin, xmax, value;
        Version(int xmin, int xmax, int value) {
            this.xmin = xmin; this.xmax = xmax; this.value = value;
        }
        public String toString() { return "v(xmin=" + xmin + ",xmax=" + xmax + ",val=" + value + ")"; }
    }

    static final class Snapshot {
        final int own;
        final Set<Integer> committed;
        Snapshot(int own, Set<Integer> committed) {
            this.own = own;
            this.committed = new HashSet<>(committed);
        }
    }

    private final List<Version> rows = new ArrayList<>();

    void insert(int xid, int value) {
        rows.add(new Version(xid, 0, value));
    }

    void update(int xid, int value) {
        closeOpen(xid);                       // không xóa bản cũ, chỉ đóng đầu của nó lại
        rows.add(new Version(xid, 0, value)); // ban moi la mot tuple khac, cung id
    }

    void delete(int xid) {
        closeOpen(xid);
    }

    private void closeOpen(int xid) {
        List<Version> grown = new ArrayList<>();
        for (Version v : rows) {
            grown.add(v.xmax == 0 ? new Version(v.xmin, xid, v.value) : v);
        }
        rows.clear();
        rows.addAll(grown);
    }

    List<Version> versions() {
        return new ArrayList<>(rows);
    }

    static boolean visible(Version v, Snapshot s) {
        return committedFor(v.xmin, s) && !committedFor(v.xmax, s);
    }

    private static boolean committedFor(int xid, Snapshot s) {
        if (xid == 0) return false;                    // chưa transaction nào đụng tới
        return xid == s.own || s.committed.contains(xid);
    }

    List<Version> visibleTo(Snapshot s) {
        List<Version> out = new ArrayList<>();
        for (Version v : rows) if (visible(v, s)) out.add(v);
        return out;
    }

    int read(Snapshot s) {
        int found = -1;
        for (Version v : rows) if (visible(v, s)) found = v.value; // bản mới nhất còn nhìn thấy
        return found;
    }
}`,
    hints:['Version bất biến, nên "đóng" một phiên bản nghĩa là thay nó bằng Version mới có cùng xmin và value nhưng xmax = xid.','Viết một hàm phụ giúp: xid khác 0 và (xid bằng s.own hoặc s.committed chứa xid) thì được coi là đã commit theo snapshot.','Một phiên bản visible khi nó đã sinh ra (vế xmin) và chưa bị thay thế (vế xmax).','read duyệt theo thứ tự đã thêm và lấy value của phiên bản visible cuối cùng; không có thì trả -1.'],
    explain:`Hai biến quyết định tất cả: phiên bản đó **đã sinh ra** chưa (xmin đã commit theo snapshot, hoặc chính là transaction của mình) và nó **đã bị thay thế** chưa (xmax đã commit theo snapshot). Vì bản cũ không bị xoá, cùng một bảng cho ra nhiều bộ dữ liệu khác nhau tuỳ snapshot — đó là nội dung chữ isolation trong câu phỏng vấn. {{READ COMMITTED}} đổi snapshot sau mỗi câu lệnh nên thấy xmax mới commit; {{REPEATABLE READ}} giữ snapshot cũ nên thấy lại giá trị cũ, và chính sự bất lực đó khiến PostgreSQL phải báo 40001 khi transaction cố ghi đè lên bản nó không nhìn thấy. Trong bài mô phỏng, {{update}} đóng **mọi** phiên bản đang mở cho đơn giản; PostgreSQL thật chặn transaction thứ hai ghi cùng một hàng cho tới khi thứ nhất kết thúc, nên gần như không bao giờ có hai phiên bản cùng mở. Model cũng coi "abort" là chưa commit: phiên bản của transaction rollback vĩnh viễn vô hình, và VACUUM sẽ dọn nó.`
  }],
  check:[
    {q:'Điều kiện nào là quy tắc nhìn thấy của một tuple dưới MVCC snapshot?',options:['xmin đã commit theo snapshot, bất kể xmax','xmax bằng 0','xmin nhỏ hơn xmax của snapshot','xmin được coi là đã commit theo snapshot và xmax thì không'],answer:3,explain:'Cả hai vế đều cần: bản phải đã tồn tại với người đọc, và chưa bị thay thế theo snapshot đó.'},
    {q:'Vì sao UPDATE ghi một phiên bản mới thay vì sửa tại chỗ?',options:['Vì page 8 KB không cho phép ghi đè','Vì index không hỗ trợ cập nhật','Vì như vậy reader không phải chờ writer và snapshot cũ vẫn đọc được giá trị cũ','Vì VACUUM cần bản gốc để phục hồi sau crash'],answer:2,explain:' Đó là toàn bộ mục đích của MVCC: đọc không bị chặn bởi ghi, và ảnh chụp cũ còn nguyên nghĩa.'},
    {q:'Bảng phình, n_dead_tup tăng đều dù autovacuum vẫn chạy. Kiểm tra gì đầu tiên?',options:['Tăng fillfactor của index','Xóa rồi dựng lại toàn bộ index','Tìm transaction mở lâu nhất, session idle in transaction và replication slot chưa tiêu thụ trong pg_stat_activity','Tăng shared_buffers'],answer:2,explain:'VACUUM không xoá tuple mà một snapshot đang mở còn cần; một snapshot già cũng chặn luôn freeze và thu hồi WAL.'},
    {q:'Ở REPEATABLE READ, UPDATE một hàng mà transaction khác đã sửa và commit sau snapshot của bạn thì:',options:['PostgreSQL ghi đè và trả về 1 dòng','PostgreSQL báo lỗi could not serialize access due to concurrent update (SQLSTATE 40001)','transaction tự hạ xuống READ COMMITTED','lỗi bị che vì MVCC chặn mọi xung đột ghi'],answer:1,explain:'Snapshot cũ không cho phép ghi đè bản mới; PostgreSQL hủy transaction và ứng dụng phải retry toàn bộ.'}
  ],
  related:['db-002','db-034'],
  tags:['MVCC','snapshot','xmin','xmax','VACUUM','PostgreSQL']
},
{
  id:'lesson-db-009',track:'db',order:9,title:'WAL, commit và crash recovery: vì sao mất điện không mất dữ liệu đã commit',level:'senior',minutes:30,
  goals:['Giải thích vì sao database không ghi trang dữ liệu ngay khi commit','Nêu đúng hai quy tắc của write-ahead log','Suy ra kết quả của từng thời điểm crash quanh commit record','Giải thích checkpoint, full page write và vì sao pg_wal có thể đầy đĩa','Viết bộ phát lại log (redo) bằng Java thuần'],
  body:`**Tóm tắt:** **WAL** (Write-Ahead Log — log ghi trước) là một file chỉ ghi thêm ở cuối, chứa mô tả từng thay đổi kèm record BEGIN/COMMIT/ABORT. Quy tắc cốt lõi: bản mô tả thay đổi phải **bền trên đĩa trước khi** transaction được báo là đã commit, còn trang dữ liệu thật có thể được ghi sau, khi rảnh. Mất điện vì thế chỉ làm mất những gì chưa commit; những gì đã commit được phục hồi bằng cách **phát lại (redo)** log.

### Vấn đề: một transaction chạm nhiều trang nằm rải rác
Giả sử một nghiệp vụ sửa 40 hàng thuộc ba bảng. Dữ liệu được tổ chức thành **page** 8 KB, 40 hàng đó rơi vào hơn chục page nằm ở các vị trí khác nhau của vài file. Nếu database bắt các page ấy phải nằm trên đĩa trước khi trả "commit", mỗi commit cần hàng chục lần seek cộng vài chục lần **fsync** (lệnh yêu cầu hệ điều hành dồn toàn bộ nội dung đang đệm ra thiết bị, và chỉ trả lời khi thiết bị xác nhận đã nhận xong). Trên đĩa thường, một fsync tốn vài ms tới hơn chục ms: commit 50–100 ms, cả hệ thống chỉ vài chục giao dịch mỗi giây. Tệ hơn, cùng hàng đó bị sửa 100 lần trong ngày nghĩa là ghi đi ghi lại cả page 8 KB cho vài byte thay đổi.

### Vài từ cần thống nhất trước
| Từ | Nghĩa, nói cho dễ hình dung |
|---|---|
| **page** (đôi khi gọi block) | mẩu 8 KB, đơn vị nhỏ nhất database đọc/ghi với hệ điều hành. Giống một trang vở: bạn không sửa một chữ, bạn sao cả trang vào RAM, sửa, rồi ghi trả. |
| **shared buffers / buffer cache** | vùng RAM của server database chứa các page đang làm việc. Page vừa sửa gọi là **dirty** (bẩn) vì nội dung trong RAM khác với nội dung trên đĩa. |
| **fsync** | lệnh yêu cầu hệ điều hành "dồn hết những gì đang đệm ra thiết bị thật, rồi mới trả lời". Đây là ranh giới giữa "còn nằm trong RAM" và "đã bền". |
| **log record** | một bản ghi mô tả thay đổi, dạng "page số 77 của file này, từ byte 120, giờ là chuỗi byte kia". |
| **redo (phát lại)** | đọc log từ đầu tới điểm đã biết và áp lại các thay đổi lên trang, để dựng lại trạng thái mà RAM chưa kịp ghi. |
| **checkpoint** | thời điểm database chủ động ghi hết trang dirty xuống đĩa và ghi một record đánh dấu; từ đó log cũ không còn cần để khôi phục. |
| **transaction abort / rollback** | giao dịch kết thúc mà không commit; thay đổi của nó bị vứt. |

### Hai quy tắc của write-ahead log

1. Trước khi báo commit cho client, mọi record log mô tả thay đổi của transaction đó đã được fsync xuống đĩa.
2. Một page chỉ được ghi vào file dữ liệu sau khi các record mô tả thay đổi của nó đã bền.

Nhờ hai quy tắc này, thao tác ghi trở thành **append tuần tự** vào một file log (rẻ với mọi loại đĩa, rất rẻ với SSD), còn trang dữ liệu được ghi muộn và ghi gộp: một page bị sửa 50 lần chỉ phải ghi xuống đĩa một lần.

Trong PostgreSQL, log sống ở thư mục **pg_wal**, gồm các file segment 16 MB. Mỗi record có **LSN** (Log Sequence Number) — về bản chất là vị trí byte tính từ đầu dòng log — dùng làm "đồng hồ" để biết record nào trước record nào, và để máy replica báo "tôi đã nhận tới đâu".

### Commit thật ra là chuyện gì
~~~seq
title: Đường đi của một UPDATE, từ lúc chạy đến khi được coi là bền
actors: App | Backend | WAL | File du lieu
App -> Backend: UPDATE account SET balance = 12 WHERE id = 42
Backend -> Backend: sua tuple trong shared buffers, page tro nen dirty
Backend -> WAL: ghi record thay doi, nhan LSN 100
App -> Backend: COMMIT
Backend -> WAL: ghi record COMMIT roi fsync ca log
WAL --> App: OK, giao dịch của bạn đã bền
note File du lieu: page chua hang 42 van la trang cu, chua bi ghi
Backend -> File du lieu: checkpoint sau nay moi ghi page do
~~~

Record COMMIT mà fsync đã hoàn thành chính là **điểm không thể đảo ngược**. Mọi thứ khác — ghi trang, dọn tuple chết, cập nhật thống kê — xảy ra sau đó và đổ vỡ cũng không mất dữ liệu đã commit. Vì transaction chỉ phải chờ đúng một fsync, PostgreSQL gom nhiều transaction đang chờ vào cùng một lần fsync (**group commit**); đó là lý do throughput commit tăng mạnh khi tải vừa phải.

### Crash ở từng thời điểm thì sao
| Thời điểm sập | Kết quả khi mở lại |
|---|---|
| Trước khi record COMMIT được fsync | transaction biến mất hoàn toàn; client chưa từng nhận OK nên không ai bị lừa |
| Sau fsync của COMMIT, trước khi trang dữ liệu được ghi | recovery phát lại log và ghi thay đổi vào trang — dữ liệu về đúng trạng thái |
| Trang bị ghi dở (**torn page**: page 8 KB của database lớn hơn sector của đĩa, nên có thể ghi một nửa rồi chết) | ảnh toàn trang (**full page write**) được ghi vào WAL ở lần sửa đầu tiên sau checkpoint, dùng để khôi phục nguyên page |
| Chết khi đang ghi chính record WAL | record dở bị loại vì độ dài/LSN/checksum không khớp; nếu COMMIT chưa fsync thì coi như chưa xảy ra |

Chú ý điều hay: **không cần undo cho transaction chết**. Thay đổi của nó tồn tại trong RAM và bay theo tiến trình; nếu một phần của nó đã bị "ăn cắp" ghi xuống page (database được phép ghi page dirty của transaction chưa commit), thì khi khôi phục, bản ghi lại từ WAL sẽ đè lên và xóa dấu vết. Atomicity và durability cùng được giải quyết bởi một cơ chế.

### Checkpoint: thu hồi log và giới hạn thời gian khôi phục
Nếu lúc nào cũng phải phát lại toàn bộ log từ thuở khai thiên lập địa thì khôi phục sẽ mất hàng giờ. **Checkpoint** giải quyết việc đó: database ghi toàn bộ trang dirty xuống file dữ liệu, fsync, rồi viết một record CHECKPOINT. Từ điểm đó, log cũ không còn cần cho khôi phục, và các segment pg_wal trước nó được tái sử dụng. Hai tham số mặc định: {{checkpoint_timeout}} = 5 phút, {{max_wal_size}} = 1 GB — cái nào chạm trước thì checkpoint chạy. Chi phí của nó là một cơn bão I/O, nên PostgreSQL dàn đều việc ghi trong {{checkpoint_completion_target}} = 0.9.

| Cấu hình | Hậu quả |
|---|---|
| Checkpoint quá dày (max_wal_size nhỏ) | write amplification, I/O spike liên tục, disk mòn nhanh |
| Checkpoint quá thưa | khôi phục lâu, pg_wal chiếm nhiều đĩa, replication chậm hơn |
| {{wal_level = logical}} | log mang thêm thông tin cho CDC (Debezium), lượng WAL tăng rõ rệt |

### Vì sao pg_wal đầy đĩa
Log chỉ được tái sử dụng khi không còn ai cần nó. Ba kẻ giữ log phổ biến: **replication slot** chưa được tiêu thụ (standby chết nhưng slot còn nguyên), {{archive_command}} thất bại liên tục, và một transaction dài khiến điểm cần giữ (xmin horizon) lùi lại — chủ đề của bài học trước. Đây là sự cố rất thật: thư mục pg_wal 400 GB trong khi dữ liệu không tăng, thủ phạm thường là một slot cô đơn chứ không phải workload.

### SQL và EXPLAIN PostgreSQL

~~~sql
-- Kiểm tra WAL và checkpoint
SELECT name, setting, unit FROM pg_settings
WHERE name IN ('wal_level', 'max_wal_size', 'checkpoint_timeout',
               'synchronous_commit', 'archive_mode');

-- Xem WAL files đang dùng và số lượng
SELECT count(*) AS wal_files, pg_size_pretty(sum(size)) AS total_size
FROM pg_ls_dir('pg_wal') f(file)
WHERE file ~ '^[0-9A-F]{24}$';

-- Kiểm tra replication slot và LSN cần giữ
SELECT slot_name, slot_type, active, restart_lsn,
       pg_size_pretty(pg_wal_lsn_diff(restart_lsn, flush_lsn)) AS wal_to_keep
FROM pg_replication_slots;

-- Xem tiến độ checkpoint gần nhất
SELECT * FROM pg_stat_bgwriter
WHERE checkpoints_timed > 0
ORDER BY check_time DESC LIMIT 5;

-- Xem WAL archive status
SELECT * FROM pg_stat_archiver
ORDER BY last_archived_time DESC LIMIT 5;
~~~

EXPLAIN (ANALYZE, BUFFERS) cho một UPDATE đơn giản:
- **Update**: tìm row theo index/key, ghi tuple mới (xmin = xid), đặt xmax lên tuple cũ, ghi WAL record.
- **Buffers**: {{shared hit}} vs {{read}} — page đã có trong RAM hay phải đọc từ disk.
- **WAL**: mỗi UPDATE sinh WAL record; số WAL sinh ra phụ thuộc số cột index phải cập nhật (HOT update chỉ xảy ra khi không đổi cột được index và page còn chỗ).

### Java: commit là một record, không phải dữ liệu đã ghi
~~~java
long lsn = 0;
Map<String, String> buffers = new HashMap<>();          // shared buffers: RAM, bay theo tien trinh
log.append(new Rec(++lsn, "t1", "SET", "a", "1"));      // chua co gi xuong file du lieu
buffers.put("a", "1");
log.append(new Rec(++lsn, "t1", "COMMIT", null, null));
fsync(log);                                             // DIEM KHONG THE DAO NGUOC
// checkpoint sau nay moi day page 8 KB chua "a" xuong file du lieu
~~~

Bài tập dưới đây chính là phần "mở lại máy": cho một list các record, hãy tính xem state cuối cùng là gì.

### Độ bền mua bằng gì
{{synchronous_commit = on}} (mặc định): chờ fsync, mất khoảng 1 fsync mỗi commit nhưng không mất giao dịch đã báo OK khi sập máy. {{off}}: OS tự dồn ghi, nhanh hơn hàng chục lần, nhưng nếu **máy sập** (mất điện, kernel panic) thì vài transaction đã báo OK có thể mất — vẫn nhất quán, chỉ là mất cái mà database đã hứa. {{remote_write}} / {{remote_apply}}: chờ một replica, dùng khi không chấp nhận mất dữ liệu kể cả khi cả máy chủ chết. Câu trả lời trưởng thành: chọn theo chi phí của một bản ghi bị mất, và với nghiệp vụ tiền thì không tắt {{synchronous_commit}}.

### Lỗi hay gặp
- Nghĩ rằng commit xong là dữ liệu "đã nằm trong file bảng"; muốn kiểm chứng thì tắt process giữa chừng rồi mở lại — sẽ thấy WAL đã làm việc.
- Tắt {{synchronous_commit}} cho job chạy nhanh, rồi không nói với ai, đến khi mất dữ liệu mới nhớ.
- Không bật {{archive_command}} / backup từ WAL: chỉ khôi phục được tới bản backup cũ nhất, mất cả ngày dữ liệu.
- Quên rằng replication slot giữ WAL: connector CDC ngừng chạy cuối tuần, thứ Hai đĩa đầy.
- Benchmark trên máy dev với SSD doanh nghiệp có cache tự bảo vệ khi mất điện → số fsync rất đẹp; đĩa cloud hoặc đĩa quay thường chậm gấp nhiều lần, và con số production phải đo lại từ đầu.

### Liên hệ phỏng vấn
Kể theo nhân quả, không thuộc lòng tên viết tắt: (1) ghi trang ngay thì tốn quá nhiều random I/O và fsync, (2) WAL ghi tuần tự mô tả thay đổi, và hai quy tắc ghi trước, (3) commit là record COMMIT cộng fsync, còn page vẫn ở RAM, (4) crash thì phát lại redo từ checkpoint gần nhất, transaction chưa commit mất theo RAM nên không cần undo, (5) full page write chống torn page, (6) checkpoint cân bằng giữa thời gian khôi phục và write amplification, (7) {{synchronous_commit}} và {{max_wal_size}}/pg_wal là hai câu tuning hay bị hỏi. Kết bằng cách kiểm chứng: số record commit mỗi giây và thời gian fsync, số lượng WAL sinh ra mỗi giờ, độ tuổi slot lớn nhất trong {{pg_replication_slots}}.

> Senior tip: với ứng dụng Java, "đã commit" không có nghĩa là "đã gửi message". Muốn nghiệp vụ và database cùng bền, ghi một bảng outbox **trong cùng transaction** rồi để một relay đọc và gửi sau commit, kèm khóa idempotency — vì sau fsync vẫn còn cửa sổ nhỏ trước khi client nhận OK, và Kafka không bảo đảm gửi đúng một lần.

`,
  exercises:[{
    title:'WalLog: ghi log, commit, checkpoint và phát lại sau crash',
    prompt:`Mô phỏng phần quyết định độ bền của database: một log toàn record có LSN tăng dần, và bộ phát lại (redo) tính ra state mà database sẽ có sau khi mở lại. Cài {{WalLog}} với lớp tĩnh {{WalLog.Rec}} ({{lsn}}, {{txn}}, {{op}}, {{key}}, {{value}}).

- {{set(txn, key, value)}}, {{del(txn, key)}}, {{commit(txn)}}, {{abort(txn)}}: mỗi lệnh thêm **đúng một** record với {{op}} lần lượt là {{"SET"}}, {{"DEL"}}, {{"COMMIT"}}, {{"ABORT"}}; LSN là số nguyên tăng dần bắt đầu từ 1 theo thứ tự thêm; record SET giữ key và value, DEL giữ key (value null), COMMIT/ABORT giữ txn và có key/value null.
- {{checkpoint()}}: thêm record {{"CHECKPOINT"}} và trả về LSN của nó. Hình dung checkpoint chỉ được lấy khi không còn transaction nào đang mở (quiesced).
- {{records()}}: toàn bộ record theo thứ tự đã thêm.
- {{recover(log, fromLsn, base)}} (static): phát lại redo và trả về state mới.
  - Bắt đầu từ bản sao của {{base}} (state đã nằm trên file dữ liệu tại checkpoint; {{base}} **không được thay đổi**).
  - Bỏ qua mọi record có {{lsn <= fromLsn}} — chúng đã bền trước checkpoint, phát lại là vô nghĩa và có thể làm hỏng state của checkpoint.
  - Các record SET/DEL của một transaction được **tạm giữ** theo txn, theo đúng thứ tự log; chỉ khi gặp COMMIT của txn đó mới áp vào state (SET ghi, DEL xoá).
  - ABORT thì vứt toàn bộ phần tạm giữ của txn; kết thúc log mà chưa gặp COMMIT thì cũng vứt — đó chính là giao dịch "chết cùng RAM".
  - Trả về một {{Map}} ({{LinkedHashMap}} là đủ).

Không dùng thread, không sleep, không I/O thật. Cùng input luôn cho cùng output.`,
    starter:`import java.util.*;

class WalLog {
    static final class Rec {
        final long lsn;
        final String txn, op, key, value;
        Rec(long lsn, String txn, String op, String key, String value) {
            this.lsn = lsn; this.txn = txn; this.op = op; this.key = key; this.value = value;
        }
        public String toString() { return lsn + " " + op + " " + txn + " " + key + "=" + value; }
    }

    void set(String txn, String key, String value) { throw new UnsupportedOperationException("TODO"); }

    void del(String txn, String key) { throw new UnsupportedOperationException("TODO"); }

    void commit(String txn) { throw new UnsupportedOperationException("TODO"); }

    void abort(String txn) { throw new UnsupportedOperationException("TODO"); }

    long checkpoint() { throw new UnsupportedOperationException("TODO"); }

    List<Rec> records() { throw new UnsupportedOperationException("TODO"); }

    static Map<String, String> recover(List<Rec> log, long fromLsn, Map<String, String> base) { throw new UnsupportedOperationException("TODO"); }
}`,
    tests:`public class Main {
 static int p=0,t=0;
 static void c(String n,Runnable r){t++;try{r.run();p++;System.out.println("PASS "+n);}catch(Throwable e){System.out.println("FAIL "+n+": "+e);}}
 static void eq(Object a,Object b){if(!Objects.equals(a,b))throw new AssertionError(a+" != "+b);}
 static void ok(boolean b){if(!b)throw new AssertionError("expected true");}
 public static void main(String[]z){
  c("committed write is redone",()->{WalLog w=new WalLog();w.set("t1","a","1");w.commit("t1");eq(Map.of("a","1"),WalLog.recover(w.records(),0L,Map.of()));});
  c("write without commit is lost with the process",()->{WalLog w=new WalLog();w.set("t1","a","1");eq(Map.of(),WalLog.recover(w.records(),0L,Map.of()));});
  c("abort discards every write of the transaction",()->{WalLog w=new WalLog();w.set("t1","a","1");w.set("t1","b","2");w.abort("t1");eq(Map.of(),WalLog.recover(w.records(),0L,Map.of()));});
  c("delete becomes durable only at commit",()->{WalLog w=new WalLog();w.set("t1","a","1");w.commit("t1");w.del("t2","a");w.commit("t2");eq(Map.of(),WalLog.recover(w.records(),0L,Map.of()));});
  c("uncommitted delete leaves the old value",()->{WalLog w=new WalLog();w.set("t1","a","1");w.commit("t1");w.del("t2","a");eq(Map.of("a","1"),WalLog.recover(w.records(),0L,Map.of()));});
  c("last committed value wins",()->{WalLog w=new WalLog();w.set("t1","a","1");w.commit("t1");w.set("t2","a","2");w.commit("t2");eq(Map.of("a","2"),WalLog.recover(w.records(),0L,Map.of()));});
  c("only the committed transaction survives",()->{WalLog w=new WalLog();w.set("t1","a","1");w.set("t2","a","2");w.commit("t1");eq(Map.of("a","1"),WalLog.recover(w.records(),0L,Map.of()));});
  c("set then delete inside one transaction",()->{WalLog w=new WalLog();w.set("t1","a","1");w.del("t1","a");w.commit("t1");eq(Map.of(),WalLog.recover(w.records(),0L,Map.of()));});
  c("lsn starts at one and checkpoint returns its lsn",()->{WalLog w=new WalLog();w.set("t1","a","1");w.commit("t1");long cp=w.checkpoint();eq(3L,cp);eq(1L,w.records().get(0).lsn);eq("SET",w.records().get(0).op);eq("CHECKPOINT",w.records().get(2).op);});
  c("recovery ignores records before the checkpoint",()->{WalLog w=new WalLog();w.set("t1","a","1");w.commit("t1");long cp=w.checkpoint();eq(Map.of("a","9"),WalLog.recover(w.records(),cp,Map.of("a","9")));});
  c("full replay reaches the same state",()->{WalLog w=new WalLog();w.set("t1","a","1");w.commit("t1");w.checkpoint();w.set("t2","b","2");w.commit("t2");List<WalLog.Rec> log=w.records();long cp=log.get(2).lsn;eq(WalLog.recover(log,0L,Map.of()),WalLog.recover(log,cp,Map.of("a","1")));eq(Map.of("a","1","b","2"),WalLog.recover(log,cp,Map.of("a","1")));});
  c("base map is never mutated",()->{WalLog w=new WalLog();w.set("t1","a","1");w.commit("t1");Map<String,String> base=new LinkedHashMap<String,String>(Map.of("z","1"));WalLog.recover(w.records(),0L,base);eq(Map.of("z","1"),base);});
  System.out.println("RESULT "+p+"/"+t);
 }
}`,
    reference:`import java.util.*;

class WalLog {
    static final class Rec {
        final long lsn;
        final String txn, op, key, value;
        Rec(long lsn, String txn, String op, String key, String value) {
            this.lsn = lsn; this.txn = txn; this.op = op; this.key = key; this.value = value;
        }
        public String toString() { return lsn + " " + op + " " + txn + " " + key + "=" + value; }
    }

    private final List<Rec> log = new ArrayList<>();

    private long append(String txn, String op, String key, String value) {
        log.add(new Rec(log.size() + 1L, txn, op, key, value)); // LSN la so thu tu record
        return log.size();
    }

    void set(String txn, String key, String value) { append(txn, "SET", key, value); }

    void del(String txn, String key) { append(txn, "DEL", key, null); }

    void commit(String txn) { append(txn, "COMMIT", null, null); }

    void abort(String txn) { append(txn, "ABORT", null, null); }

    long checkpoint() { return append(null, "CHECKPOINT", null, null); }

    List<Rec> records() { return new ArrayList<>(log); }

    static Map<String, String> recover(List<Rec> log, long fromLsn, Map<String, String> base) {
        Map<String, String> state = new LinkedHashMap<>(base);            // du lieu da nam tren file
        Map<String, List<Rec>> pending = new LinkedHashMap<>();           // chua commit: tam giu trong RAM
        for (Rec r : log) {
            if (r.lsn <= fromLsn) continue;                                // da ben tu truoc checkpoint
            if (r.op.equals("COMMIT")) {
                for (Rec w : pending.getOrDefault(r.txn, List.of())) {     // REDO: ap lai theo thu tu log
                    if (w.op.equals("SET")) state.put(w.key, w.value);
                    else state.remove(w.key);
                }
                pending.remove(r.txn);
            } else if (r.op.equals("ABORT")) {
                pending.remove(r.txn);
            } else if (r.op.equals("SET") || r.op.equals("DEL")) {
                pending.computeIfAbsent(r.txn, k -> new ArrayList<>()).add(r);
            }
        }
        return state;                                                      // phan chua commit: chet cung RAM
    }
}`,
    hints:['Mỗi lệnh ghi nghiệp vụ chỉ cần thêm một Record với lsn = log.size() + 1; checkpoint trả về chính lsn vừa cấp.','recover: dùng một Map<String, List<Rec>> để tạm giữ thao tác chưa commit theo txn, chỉ áp vào state khi gặp COMMIT.','Điều kiện bỏ qua record là r.lsn <= fromLsn, kiểm tra TRƯỚC mọi việc khác.','Sao chép base bằng new LinkedHashMap<>(base) để không sửa đổi object của caller.'],
    explain:`Ba tính chất của redo recovery hiện ra rõ trong bài tập: **chỉ COMMIT làm thay đổi thành bền** (nguyên văn định nghĩa durability), **thứ tự trong log là thứ tự quyết định kết quả** (hai SET cùng key thì cái được áp cuối là cái cuối trước COMMIT), và **checkpoint cho phép bỏ phần đầu** vì nó đã được phản ánh trong {{base}}. Điều mô hình đơn giản hoá: PostgreSQL không lưu "giá trị logic mới" mà lưu thay đổi vật lý trên page, và một transaction chưa commit vẫn có thể bị đẩy trang dirty xuống đĩa; không sao cả, vì redo từ WAL sẽ ghi đè lại dấu vết của nó, và full page write xử lý trường hợp ghi dở. Trong production, ba chỗ hay gặp nhất của cùng một ý này: {{pg_wal}} đầy vì slot không được tiêu thụ, thời gian mở database tỷ lệ với lượng WAL phải phát lại sau checkpoint, và {{synchronous_commit = off}} chỉ tiết kiệm fsync chứ không thay đổi thứ tự log.`
  }],
  check:[
    {q:'Quy tắc cốt lõi của write-ahead log là gì?',options:['Toàn bộ trang dữ liệu phải được ghi xuống đĩa trước khi trả lời client','Mỗi record mô tả thay đổi phải bền trong log trước khi transaction được báo là commit','Mọi replica phải xác nhận trước khi commit','Shared buffers phải được flush sau mỗi câu lệnh'],answer:1,explain:'Ghi log tuần tự rồi mới fsync là mấu chốt: trang dữ liệu có thể ghi muộn vì đã có cách dựng lại từ log.'},
    {q:'Vì sao commit chỉ cần khoảng một lần fsync dù transaction sửa hàng trăm hàng?',options:['Vì database nén các page lại thành một file','Vì page nằm cạnh nhau trên đĩa','Vì log chỉ lưu con trỏ tới các page, không lưu nội dung','Vì các thay đổi được ghi liên tiếp vào một log append-only và fsync một lần, còn trang dữ liệu ghi sau'],answer:3,explain:'Append tuần tự rẻ; database còn gộp nhiều transaction chờ fsync vào cùng một lần (group commit).'},
    {q:'Crash xảy ra sau khi record COMMIT đã fsync nhưng trước khi trang dữ liệu được ghi. Khi mở lại:',options:['Transaction mất vì dữ liệu chưa vào file bảng','Recovery phát lại WAL từ checkpoint gần nhất và áp thay đổi vào trang','Bắt buộc restore từ backup cũ','Trang dữ liệu hỏng vĩnh viễn'],answer:1,explain:'Đây đúng là trường hợp WAL tồn tại để giải quyết: log đã bền thì dữ liệu dựng lại được.'},
    {q:'Tác dụng của một checkpoint là gì?',options:['Đảm bảo toàn bộ thay đổi nằm trong WAL và cho phép tái sử dụng log trước nó, đồng thời giới hạn thời gian khôi phục','Xóa sạch các transaction chưa commit','Nén pg_wal thành một file duy nhất','Tắt cơ chế ghi ảnh toàn trang'],answer:0,explain:'Sau checkpoint, các trang dirty đã nằm trên file dữ liệu nên log cũ không cần phát lại nữa; vì thế pg_wal có thể quay vòng.'}
  ],
  related:['db-035','db-006'],
  tags:['WAL','durability','checkpoint','recovery','PostgreSQL']
},
{
  id: 'lesson-db-010',
  track: 'db',
  order: 10,
  title: 'B+ tree thu nhỏ: node lá, tách node, và range scan theo chuỗi lá',
  level: 'senior',
  minutes: 35,
  goals: [
    'Giải thích vì sao database dùng B+ tree thay vì cây nhị phân cho index trên đĩa',
    'Mô phỏng insert, split node và duy trì thứ tự khóa trong cây bậc nhỏ',
    'Thực hiện range scan bằng cách đi xuống lá trái rồi theo liên kết giữa các lá',
    'Liên hệ fan-out, chiều cao cây và số lần đọc page trong PostgreSQL B-tree'
  ],
  body: `**Tóm tắt:** B+ tree là cấu trúc index dạng cây cân bằng (balanced tree: mọi lá cùng độ sâu) mà database dùng cho tra cứu theo khóa và truy vấn theo khoảng. Khác với cây nhị phân, mỗi node chứa nhiều khóa (fan-out: số con tối đa của node nội bộ) để giảm chiều cao; khác với B-tree thuần, mọi bản ghi thực nằm ở lá và các lá được nối chuỗi, nên range scan (quét theo khoảng khóa) chỉ cần đi dọc lá.

### Vì sao không dùng cây nhị phân
Một index trên đĩa (disk: ổ lưu trữ bền nhưng truy cập chậm hơn RAM rất nhiều) đọc dữ liệu theo **page** (trang: đơn vị I/O cố định, thường 8 KB trong PostgreSQL). Nếu mỗi node chỉ chứa 1 khóa như cây nhị phân cân bằng, thì 1 triệu khóa cần khoảng 20 tầng (~20 lần đọc page). B+ tree đặt hàng chục đến hàng trăm khóa vào mỗi page, nên 1 triệu khóa có thể chỉ cần 3-4 tầng. Chiều cao thấp đồng nghĩa ít I/O (input/output, đọc/ghi đĩa) hơn. Fan-out càng lớn, cây càng thấp; PostgreSQL B-tree mặc định page 8 KB, fan-out thực tế thường hàng trăm.

### Cấu trúc B+ tree (phiên bản thu nhỏ)
Ta mô phỏng B+ tree bậc {{m}} (bậc nhỏ như 4 để dễ quan sát split - tách node). Quy ước:
- Mỗi node chứa tối đa {{m - 1}} = 3 khóa.
- Node nội bộ (internal node): khóa phân cách và con trỏ con. Quy ước: đi sang con phải khi {{key >= separator[i]}}.
- Node lá (leaf node): cặp (khóa, giá trị) đã sắp xếp. Mọi lá cùng độ sâu.
- Các lá nối bằng con trỏ {{next}} sang lá bên phải: range scan nhanh.

~~~text
B+ tree bậc 4 (tối đa 3 khóa/node), minh hoạ:
                 [ 17 | 35 ]
                /     |     \\
          [5|9|12]  [17|26]  [35|40|48]   (lá, chứa value)
             |        |         |
             +--------+---------+          (next giữa các lá)

Tìm 26: 26 >= 17 và < 35 -> xuống lá giữa -> thấy 26.
Range [10, 36]: xuống lá chứa 10, đi dọc next tới khi khóa > 36.
~~~

### Insert và tách node (split)
Khi chèn khóa mới, luôn chèn vào **lá** đúng vị trí:
1. Từ gốc đi xuống theo khóa phân cách để tìm lá đích.
2. Chèn (khóa, giá trị) vào lá, giữ thứ tự. Khóa đã tồn tại -> cập nhật (upsert: chèn hoặc cập nhật).
3. Lá vượt {{m - 1}} khóa (tràn) -> **split**: chia đôi. Khóa đầu của lá mới được **copy lên** cha (lá vẫn giữ bản sao vì dữ liệu nằm ở lá).
4. Node cha tràn -> split node nội bộ: khóa giữa **đẩy lên** (promote), không copy.
5. Split đến gốc -> tạo gốc mới, chiều cao tăng 1.

~~~java
// Split lá bậc 4 (tối đa 3 khóa). Lá [5,9,12], chèn 7 -> [5,7,9,12] (tràn)
Leaf left  = [5, 7];       // giữ nửa trái
Leaf right = [9, 12];      // nửa phải
right.next = left.next;    // giữ chuỗi cũ
left.next = right;         // nối left -> right
promoteKey = 9;            // COPY 9 lên cha (lá vẫn giữ 9)
~~~

### Range scan
Truy vấn {{WHERE id >= 10 AND id <= 36}}: (1) tìm lá chứa biên dưới (10); (2) duyệt entry theo thứ tự, hết lá đi theo {{next}}; (3) dừng khi khóa > biên trên (36). Chỉ tốn 1 lần đi xuống cây cộng số lá cần đọc, nên {{ORDER BY}} và range predicate được B-tree hỗ trợ tốt.

### Trong PostgreSQL thật (khác mô phỏng)
PostgreSQL dùng B-tree (biến thể Lehman & Yao) làm index mặc định, page 8 KB:
- Mỗi trang là một node; split cần latch (khóa nhẹ trong bộ nhớ) để đọc/ghi đồng thời (concurrency).
- Lá trỏ tới heap tuple (ctid: địa chỉ vật lý hàng); index-only scan chỉ khả thi khi visibility map cho phép.
- Có VACUUM dọn entry chết; {{fillfactor}} mặc định 90 cho index chừa chỗ giảm page split (write amplification: ghi khuếch đại).

| Tính chất | Cây nhị phân cân bằng | B+ tree (index DB) |
|---|---|---|
| Khóa mỗi node | 1 | hàng chục-hàng trăm (theo page) |
| Chiều cao với N lớn | ~log2(N) | ~log_f(N), f = fan-out lớn |
| Range scan | duyệt cây phức tạp | đi xuống lá + đi dọc next |
| Tối ưu cho | RAM, con trỏ rẻ | đĩa/page, giảm I/O |

### Lỗi hay gặp
- Nhầm copy lên (leaf split) với promote (internal split): leaf phải giữ khóa vì dữ liệu nằm ở lá.
- Quên nối {{next}} khi split lá: range scan đứt chuỗi.
- Nghĩ B+ tree xoay như AVL: nó cân bằng bằng split/merge, mọi lá luôn cùng độ sâu.

### SQL và EXPLAIN PostgreSQL

~~~sql
-- Tạo B-tree index trên cột đơn
CREATE INDEX idx_orders_created ON orders (created_at);

-- Composite index: equality filter trước, range/order sau
CREATE INDEX idx_orders_tenant_created ON orders (tenant_id, created_at);

-- Covering index với INCLUDE (cột payload không vào khóa)
CREATE INDEX idx_orders_cov ON orders (tenant_id, created_at) INCLUDE (status, total);

-- Partial index: chỉ index tập con hàng thỏa predicate
CREATE INDEX idx_orders_pending_created ON orders (created_at) WHERE status = 'PENDING';

-- Kiểm tra planner chọn plan bằng EXPLAIN (ANALYZE, BUFFERS)
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, created_at, status, total
FROM orders
WHERE tenant_id = 7 AND created_at >= '2026-01-01'
ORDER BY created_at, id
LIMIT 50;
~~~

EXPLAIN (ANALYZE, BUFFERS) cho câu truy vấn ở trên:
- **Index Only Scan**: chỉ xảy ra khi index {{(tenant_id, created_at) INCLUDE (status, total)}} chứa đủ cột và visibility map cho page all-visible — không cần heap fetch.
- **Index Scan**: dùng B-tree tìm entry theo {{(tenant_id, created_at)}}, sau đó read heap theo TID để lấy {{status}} và {{total}}.
- **Seq Scan**: planner quét toàn bộ bảng khi selectivity cao (trả về quá nhiều hàng) hoặc bảng nhỏ.
- **Buffers**: {{shared hit}} (đã có trong RAM) vs {{read}} (phải đọc từ disk) — giúp thấy I/O thực tế.
- **Heap Fetches**: số lần phải đọc heap; nếu cao dù index đủ cột, có thể visibility map chưa set (cần VACUUM).

### Liên hệ phỏng vấn
(1) Fan-out lớn -> cây thấp -> ít page read. (2) Dữ liệu ở lá + lá nối chuỗi -> range scan/ORDER BY tốt. (3) Insert có thể gây split và write amplification; random insert (UUID v4) gây split nhiều hơn insert tuần tự. Nhắc {{EXPLAIN (ANALYZE, BUFFERS)}} để xem index scan thực tế.

> Senior tip: thứ tự cột trong composite index (index nhiều cột) quan trọng vì B+ tree hỗ trợ prefix; {{(tenant_id, created_at)}} phục vụ lọc tenant rồi range thời gian, đảo thứ tự thì khác hẳn.`,
  exercises: [
    {
      title: 'B+ tree bậc 4: insert, get, range và chiều cao',
      prompt: `Cài {{BPlusTree}} bậc cố định 4 (mỗi node tối đa 3 khóa):
- {{put(key, value)}}: upsert (chèn hoặc cập nhật), giữ khóa tăng dần. Node vượt 3 khóa thì split: lá chia đôi, khóa đầu nửa phải **copy lên** cha; node nội bộ chia đôi, khóa giữa **đẩy lên** cha. Lá duy trì {{next}}.
- {{get(key)}}: trả {{Integer}} value hoặc {{null}}.
- {{range(lo, hi)}}: trả {{List<Integer>}} value có khóa {{k}} thỏa {{lo <= k <= hi}}, tăng dần. Tìm lá chứa {{lo}} rồi đi dọc {{next}}, dừng khi khóa > {{hi}}.
- {{height()}}: số tầng, cây rỗng trả 0, chỉ gốc lá trả 1.

Chỉ dùng JDK chuẩn, không dùng {{TreeMap}}/{{TreeSet}} thay cho cấu trúc cây.`,
      starter: `import java.util.*;

class BPlusTree {
    private static final int ORDER = 4;      // tối đa 3 khóa mỗi node
    private static final int MAX_KEYS = ORDER - 1;

    BPlusTree() { }

    void put(int key, int value) { throw new UnsupportedOperationException("TODO"); }

    Integer get(int key) { throw new UnsupportedOperationException("TODO"); }

    // trả value của các khóa trong [lo, hi], tăng dần theo khóa
    List<Integer> range(int lo, int hi) { throw new UnsupportedOperationException("TODO"); }

    int height() { throw new UnsupportedOperationException("TODO"); }
}`,
      tests: `import java.util.*;

public class Main {
    static int p = 0, t = 0;
    static void check(String n, Runnable r) {
        t++; try { r.run(); p++; System.out.println("PASS " + n); }
        catch (Throwable e) { System.out.println("FAIL " + n + ": " + e); }
    }
    static void eq(Object a, Object b) { if (!Objects.equals(a, b)) throw new AssertionError(a + " != " + b); }
    static void ok(boolean b) { if (!b) throw new AssertionError("expected true"); }
    public static void main(String[] args) {
        check("empty tree", () -> {
            BPlusTree x = new BPlusTree();
            eq(0, x.height()); eq(null, x.get(1)); eq(List.of(), x.range(0, 10));
        });
        check("put and get basic, update same key", () -> {
            BPlusTree x = new BPlusTree();
            x.put(5, 50); x.put(1, 10); x.put(9, 90);
            eq(50, x.get(5)); eq(10, x.get(1)); eq(90, x.get(9)); eq(null, x.get(7));
            x.put(5, 55); eq(55, x.get(5));
        });
        check("leaf split keeps all keys and range order", () -> {
            BPlusTree x = new BPlusTree();
            for (int k : new int[]{10, 20, 30, 40}) x.put(k, k * 2);
            for (int k : new int[]{10, 20, 30, 40}) eq(k * 2, x.get(k));
            eq(List.of(20, 40, 60, 80), x.range(10, 40));
            eq(List.of(40, 60), x.range(15, 35));
            ok(x.height() >= 2);
        });
        check("many inserts cause growth and preserve range", () -> {
            BPlusTree x = new BPlusTree();
            for (int i = 1; i <= 20; i++) x.put(i, i + 100);
            for (int i = 1; i <= 20; i++) eq(i + 100, x.get(i));
            eq(List.of(105, 106, 107, 108, 109, 110), x.range(5, 10));
            eq(List.of(), x.range(21, 30));
            ok(x.height() >= 3);
        });
        check("range bounds inclusive and missing edges", () -> {
            BPlusTree x = new BPlusTree();
            for (int k : new int[]{2, 4, 6, 8, 10, 12}) x.put(k, k);
            eq(List.of(4, 6, 8), x.range(4, 8));
            eq(List.of(4, 6, 8), x.range(3, 9));
            eq(List.of(2), x.range(0, 2));
            eq(List.of(12), x.range(12, 99));
            eq(List.of(), x.range(5, 5));
        });
        check("reverse-order inserts and overwrite", () -> {
            BPlusTree x = new BPlusTree();
            for (int i = 15; i >= 1; i--) x.put(i, i);
            for (int i = 1; i <= 15; i++) x.put(i, i * 10);
            eq(List.of(30, 40, 50), x.range(3, 5));
            eq(150, x.get(15)); eq(null, x.get(0));
        });
        System.out.println("RESULT " + p + "/" + t);
    }
}`,
      reference: `import java.util.*;

class BPlusTree {
    private static final int ORDER = 4;
    private static final int MAX_KEYS = ORDER - 1;

    private abstract static class Node {
        final List<Integer> keys = new ArrayList<>();
        abstract boolean isLeaf();
    }
    private static class Leaf extends Node {
        final List<Integer> vals = new ArrayList<>();
        Leaf next;
        boolean isLeaf() { return true; }
    }
    private static class Internal extends Node {
        final List<Node> kids = new ArrayList<>();
        boolean isLeaf() { return false; }
    }
    private static class Split { final int key; final Node right; Split(int k, Node r) { key = k; right = r; } }

    private Node root;

    Integer get(int key) {
        if (root == null) return null;
        Leaf lf = findLeaf(key);
        int i = Collections.binarySearch(lf.keys, key);
        return i >= 0 ? lf.vals.get(i) : null;
    }

    void put(int key, int value) {
        if (root == null) {
            Leaf lf = new Leaf(); lf.keys.add(key); lf.vals.add(value); root = lf; return;
        }
        Split sp = insert(root, key, value);
        if (sp != null) {
            Internal nr = new Internal();
            nr.keys.add(sp.key); nr.kids.add(root); nr.kids.add(sp.right); root = nr;
        }
    }

    List<Integer> range(int lo, int hi) {
        List<Integer> out = new ArrayList<>();
        if (root == null || lo > hi) return out;
        Leaf lf = findLeaf(lo);
        while (lf != null) {
            for (int i = 0; i < lf.keys.size(); i++) {
                int k = lf.keys.get(i);
                if (k > hi) return out;
                if (k >= lo) out.add(lf.vals.get(i));
            }
            lf = lf.next;
        }
        return out;
    }

    int height() {
        int h = 0; Node n = root;
        while (n != null) { h++; n = n.isLeaf() ? null : ((Internal) n).kids.get(0); }
        return h;
    }

    private Leaf findLeaf(int key) {
        Node n = root;
        while (!n.isLeaf()) {
            Internal in = (Internal) n;
            int i = childIndex(in.keys, key);
            n = in.kids.get(i);
        }
        return (Leaf) n;
    }

    private int childIndex(List<Integer> keys, int key) {
        int i = 0;
        while (i < keys.size() && key >= keys.get(i)) i++;
        return i;
    }

    private Split insert(Node n, int key, int value) {
        if (n.isLeaf()) return insertLeaf((Leaf) n, key, value);
        Internal in = (Internal) n;
        int i = childIndex(in.keys, key);
        Split sp = insert(in.kids.get(i), key, value);
        if (sp == null) return null;
        in.keys.add(i, sp.key);
        in.kids.add(i + 1, sp.right);
        if (in.keys.size() <= MAX_KEYS) return null;
        return splitInternal(in);
    }

    private Split insertLeaf(Leaf lf, int key, int value) {
        int i = Collections.binarySearch(lf.keys, key);
        if (i >= 0) { lf.vals.set(i, value); return null; }
        i = -i - 1;
        lf.keys.add(i, key); lf.vals.add(i, value);
        if (lf.keys.size() <= MAX_KEYS) return null;
        return splitLeaf(lf);
    }

    private Split splitLeaf(Leaf lf) {
        int mid = lf.keys.size() / 2;
        Leaf right = new Leaf();
        right.keys.addAll(lf.keys.subList(mid, lf.keys.size()));
        right.vals.addAll(lf.vals.subList(mid, lf.vals.size()));
        lf.keys.subList(mid, lf.keys.size()).clear();
        lf.vals.subList(mid, lf.vals.size()).clear();
        right.next = lf.next; lf.next = right;
        return new Split(right.keys.get(0), right); // COPY
    }

    private Split splitInternal(Internal in) {
        int mid = in.keys.size() / 2;
        int up = in.keys.get(mid);
        Internal right = new Internal();
        right.keys.addAll(in.keys.subList(mid + 1, in.keys.size()));
        right.kids.addAll(in.kids.subList(mid + 1, in.kids.size()));
        in.keys.subList(mid, in.keys.size()).clear();
        in.kids.subList(mid + 1, in.kids.size()).clear();
        return new Split(up, right); // PROMOTE
    }
}`,
      hints: [
        'Tách 2 loại node: lá (keys + values + next) và nội bộ (keys + kids). Luôn insert vào lá; split trả (khóa phân cách, node phải) lên cha.',
        'Leaf split: chia đôi, nối next (right.next = left.next; left.next = right), copy khóa đầu right lên cha. Internal split: khóa giữa promote lên cha.',
        'range(lo,hi): findLeaf(lo) rồi duyệt; nếu key > hi thì return; hết lá thì lf = lf.next.',
        'Upsert: binarySearch thấy key có sẵn thì set value và return null. Cây rỗng put lần đầu tạo gốc lá height=1.'
      ],
      explain: `Mô phỏng 3 ý cốt lõi: (1) dữ liệu ở lá, node nội bộ chỉ điều hướng; (2) split giữ cây cân bằng theo chiều cao, mọi lá cùng độ sâu; (3) lá nối chuỗi nên range scan là đi xuống + duyệt tuần tự.

Đơn giản hoá so với PostgreSQL B-tree thật: bậc nhỏ cố định (4); không delete/merge; không concurrency latch; không lưu trên page đĩa hay ctid. PostgreSQL B-tree (Lehman & Yao) dùng latch và chiến lược split để đọc/ghi đồng thời an toàn.

Lỗi thường gặp: quên nối {{next}} khi split; nhầm copy (leaf) với promote (internal); dùng {{TreeMap}} thay cho cấu trúc node.`
    }
  ],
  check: [
    {
      q: 'Vì sao B+ tree thường dùng cho index trên đĩa thay vì cây nhị phân cân bằng?',
      options: [
        'Vì B+ tree không cần sắp xếp khóa',
        'Vì fan-out lớn làm cây thấp, giảm số lần đọc page',
        'Vì B+ tree không bao giờ split',
        'Vì cây nhị phân không hỗ trợ số nguyên'
      ],
      answer: 1,
      explain: 'Mỗi node B+ tree chứa nhiều khóa (gần đầy page), nên chiều cao thấp và ít I/O hơn.'
    },
    {
      q: 'Điểm nào giúp B+ tree range scan hiệu quả?',
      options: ['Mọi node nội bộ lưu value', 'Các lá được nối chuỗi và khóa trong lá đã sắp', 'Gốc luôn là lá', 'Split chỉ xảy ra ở gốc'],
      answer: 1,
      explain: 'Sau khi tìm lá đầu, chỉ cần đi dọc next giữa các lá theo thứ tự khóa.'
    },
    {
      q: 'Khi split một node lá trong B+ tree, khóa phân cách xử lý thế nào?',
      options: ['Bị xóa khỏi cây', 'Chỉ nằm ở cha, lá phải không giữ', 'Được copy lên cha và lá phải vẫn giữ khóa đó', 'Được đẩy xuống dưới'],
      answer: 2,
      explain: 'Dữ liệu thực nằm ở lá nên lá phải vẫn giữ khóa; bản sao đưa lên cha để điều hướng.'
    }
  ],
  related: ['db-003'],
  tags: ['B+tree', 'index', 'range-scan', 'page-split', 'PostgreSQL']
},
{
  id: 'lesson-db-011',
  track: 'db',
  order: 11,
  title: 'WAL và khôi phục sau crash: redo commit, bỏ qua chưa commit',
  level: 'senior',
  minutes: 35,
  goals: [
    'Giải thích quy tắc write-ahead: log phải bền trước khi báo commit',
    'Mô phỏng crash tại nhiều điểm và thấy vì sao chỉ áp dụng transaction đã commit',
    'Cài recover() duyệt log: checkpoint cắt ngắn, COMMIT thì redo, chưa COMMIT thì bỏ qua',
    'Liên hệ WAL của PostgreSQL, checkpoint và thời gian khôi phục'
  ],
  body: `**Tóm tắt:** WAL (Write-Ahead Log: nhật ký ghi trước) là cơ chế database ghi mô tả thay đổi vào log bền vững **trước** khi sửa trang dữ liệu và trước khi báo transaction (giao dịch: nhóm thao tác coi như một đơn vị) commit. Khi crash (sập: mất điện, process chết), database đọc log từ checkpoint: **redo** (làm lại) thay đổi của transaction đã có COMMIT, **bỏ qua** transaction chưa commit. Dữ liệu đã commit không mất, dữ liệu chưa commit không lọt ra.

### Vì sao cần WAL
Ghi trực tiếp vào file dữ liệu mỗi lần UPDATE rất tốn: file dữ liệu là các page rải rác, ghi ngẫu nhiên (random I/O) chậm; crash giữa chừng có thể làm page chỉ ghi nửa (torn page). WAL gom thay đổi thành record nhỏ và **append** (ghi nối đuôi) vào file log tuần tự. Ghi tuần tự nhanh, và một lần {{fsync}} (ép bộ đệm xuống đĩa bền) có thể xác nhận commit.

Quy tắc cốt lõi: **log record phải bền trên đĩa trước khi trang dữ liệu bị ghi xuống, và trước khi client nhận "commit thành công".**

~~~text
Luồng đơn giản hoá (1 transaction):
  BEGIN
  SET balance=80 WHERE id=A  -> log (LSN=1, T1, SET, A, 80)
  SET balance=120 WHERE id=B -> log (LSN=2, T1, SET, B, 120)
  COMMIT                     -> log (LSN=3, T1, COMMIT) rồi fsync
                              -> giờ mới báo "commit OK"
  (trang dữ liệu A,B có thể còn trong buffer, flush sau - checkpoint)

LSN = Log Sequence Number: số thứ tự tăng dần của record trong log.
~~~

### Crash xảy ra ở đâu?
- Crash **trước** khi COMMIT fsync: transaction chưa xác nhận -> recover bỏ qua các SET của nó.
- Crash **sau** khi COMMIT đã fsync: client đã nhận "OK" -> recover phải redo các SET (kể cả khi trang dữ liệu chưa kịp ghi).
- Nhiều transaction xen kẽ: mỗi transaction xét độc lập dựa trên việc có COMMIT bền hay không.

### Recover: redo các transaction đã commit
Thuật toán tối thiểu (redo-only, giống tinh thần PostgreSQL):
1. Bắt đầu từ **checkpoint**. Chỉ đọc log từ {{fromLsn}} trở đi.
2. Xác định transaction nào có {{COMMIT}}. Áp dụng (redo) SET/DEL của transaction đã COMMIT theo thứ tự log. Bỏ qua thao tác của transaction chưa COMMIT/ABORT.
3. Trạng thái cuối nhất quán sau crash.

Redo nên **idempotent** (lặp lại cho cùng kết quả) trong thiết kế thật; SET cùng giá trị tự nhiên idempotent.

~~~seq
title: Crash sau COMMIT T1, T2 chưa commit
actors: App | DB | WAL | Data
App -> DB: T1 SET A=80; SET B=120; COMMIT
DB -> WAL: append SET,SET,COMMIT; fsync
WAL --> DB: durable
DB --> App: commit OK (T1)
App -> DB: T2 SET A=999 (chưa COMMIT)
DB -> WAL: append SET(A,999)
note DB,Data: CRASH - buffer chưa flush
DB -> WAL: recover() từ checkpoint
WAL --> DB: T1 có COMMIT -> redo A=80,B=120; T2 bỏ qua
DB -> Data: trạng thái: A=80, B=120
~~~

### PostgreSQL WAL thật (khác mô phỏng)
- WAL là file nhị phân segment (thường 16 MB) trong {{pg_wal}}; record ở mức thay đổi page, không phải key/value.
- Checkpoint định kỳ ghi dirty page xuống data file; {{checkpoint_timeout}}, {{max_wal_size}} ảnh hưởng tần suất. Checkpoint thường -> recover nhanh nhưng tốn I/O nền.
- {{synchronous_commit}} điều khiển khi fsync: mặc định an toàn; tắt có thể mất vài transaction gần nhất khi crash OS, đổi lại throughput cao hơn.
- Có full page write sau checkpoint để chống torn page. Replica streaming nhận WAL; PITR dùng base backup + WAL archive.

### Cơ chế từng bước: từ UPDATE đến recovery sau crash
1. **Sửa trong shared buffers.** UPDATE đọc page vào RAM, sửa tuple, đánh dấu dirty. Chỉ ở RAM.
2. **Ghi WAL trước commit.** Tạo WAL record append vào buffer. LSN tăng dần. **Quy tắc: WAL phải fsync TRƯỚC khi trả "COMMIT OK".**
3. **COMMIT: ghi COMMIT record, fsync WAL, trả OK.** Trang dirty chưa flush.
4. **Crash: RAM mất, WAL trên đĩa nguyên vẹn.** Nhờ fsync bước 3.
5. **Recovery: redo từ checkpoint.** Đọc checkpoint, từ LSN đó đọc WAL: CÓ COMMIT -> redo; KHÔNG CÓ COMMIT -> bỏ qua. Theo thứ tự LSN.
6. **Checkpoint thu hồi WAL.** Ghi dirty page ra data file, fsync, ghi CHECKPOINT. WAL trước đó không còn cần.

Vì sao? Ghi page ngẫu nhiên (random I/O) chậm, dễ torn page. WAL biến thành append tuần tự + 1 fsync/commit. Trang flush lazy, gộp nhiều sửa. Crash chỉ mất RAM, WAL đủ dựng lại.

~~~java
class MiniWalRecovery {
    static class Rec { int lsn; String tx, op, key; Integer val; }
    static Map<String, Integer> recover(List<Rec> log, int fromLsn, Map<String, Integer> base) {
        Map<String, Integer> state = new LinkedHashMap<>(base);
        Set<String> committed = new LinkedHashSet<>();
        for (Rec r : log) if (r.lsn >= fromLsn && "COMMIT".equals(r.op)) committed.add(r.tx);
        for (Rec r : log) if (r.lsn >= fromLsn && ("SET".equals(r.op) || "DEL".equals(r.op)) && committed.contains(r.tx)) {
            if ("SET".equals(r.op)) state.put(r.key, r.val); else state.remove(r.key);
        }
        return state;
    }
}
~~~

### Lỗi hay gặp trên production
1. **Tắt {{synchronous_commit = off}} cho tài chính.** Mất điện -> đơn "thành công" mất. Nguyên nhân: COMMIT trả OK trước WAL fsync. Sửa: không tắt synchronous_commit.
2. **Slot không tiêu thụ -> {{pg_wal}} đầy.** Disk tăng không kiểm soát, DB đứng. Nguyên nhân: standby/CDC down nhưng slot giữ WAL. Sửa: monitor {{pg_replication_slots.active}}; drop slot inactive.
3. **Không bật {{archive_command}}.** Chỉ có backup base cũ, mất dữ liệu. Nguyên nhân: PITR cần base + WAL archive. Sửa: archive_command đẩy WAL sang S3/GCS, test restore định kỳ.
4. **Ghi data trước WAL.** Crash -> dữ liệu không nhất quán. Nguyên nhân: bảng unlogged hoặc extension bỏ qua WAL. Sửa: không dùng unlogged table cho dữ liệu cần bền.

### Liên hệ phỏng vấn
- **"Mất điện có làm mất đơn đã commit không?"** → Không ({{synchronous_commit = on}} mặc định). COMMIT đã fsync WAL trước khi OK; recovery redo.
- **"Tại sao WAL trước data file?"** → Write-ahead: fsync WAL xong mới báo commit. Ghi data trước vi phạm quy tắc.
- **"Checkpoint ảnh hưởng recovery?"** → Ghi sạch dirty page, đánh dấu LSN an toàn. Recovery chỉ đọc từ checkpoint; thưa -> lâu, dày -> I/O cao.
- **"Slot giữ WAL thế nào?"** → Lưu {{restart_lsn}}. Slot inactive giữ WAL mãi -> pg_wal đầy. Phải drop slot không dùng.
- **"full page write là gì?"** → Sau checkpoint, lần sửa đầu page ghi cả 8 KB. Chống torn page: crash ghi nửa page, recovery có bản full.

> Senior tip: theo dõi {{pg_wal}} phình (thường do slot giữ hoặc archiving kẹt), thời gian checkpoint và {{pg_stat_bgwriter}}.`,
  exercises: [
    {
      title: 'WalStore: commit, crash giả lập, recover()',
      prompt: `Cài {{WalStore}} mô phỏng WAL key/value (đơn giản hoá):
- {{put(tx, key, value)}}: append log SET cho transaction {{tx}}.
- {{del(tx, key)}}: append log DEL.
- {{commit(tx)}}: append log COMMIT. Chỉ transaction có COMMIT mới thành công.
- {{abort(tx)}}: append log ABORT.
- {{recover(Map<String,Integer> base, int fromLsn)}}: trả {{Map<String,Integer>}} trạng thái sau khôi phục. Bắt đầu từ bản sao {{base}} (null coi như rỗng). Chỉ xét record có {{lsn >= fromLsn}} (checkpoint). Áp dụng theo thứ tự log các SET/DEL của transaction **có COMMIT** (không abort). Transaction chưa commit/abort -> bỏ qua toàn bộ. Cùng key bị set nhiều lần bởi txn đã commit: giá trị sau cùng theo thứ tự log thắng.

Đơn giản hoá: log lưu trong bộ nhớ; "crash" mô phỏng bằng gọi {{recover}}; LSN tăng dần từ 1; mục tiêu là đúng quy tắc redo commit, bỏ qua chưa commit.`,
      starter: `import java.util.*;

class WalStore {
    // gợi ý: record (lsn, tx, op, key, value), lsn tăng từ 1
    WalStore() { }

    void put(String tx, String key, int value) { throw new UnsupportedOperationException("TODO"); }

    void del(String tx, String key) { throw new UnsupportedOperationException("TODO"); }

    void commit(String tx) { throw new UnsupportedOperationException("TODO"); }

    void abort(String tx) { throw new UnsupportedOperationException("TODO"); }

    // Chỉ redo txn có COMMIT; xét log từ fromLsn (>=), áp trên bản sao base.
    Map<String, Integer> recover(Map<String, Integer> base, int fromLsn) { throw new UnsupportedOperationException("TODO"); }
}`,
      tests: `import java.util.*;

public class Main {
    static int p = 0, t = 0;
    static void check(String n, Runnable r) {
        t++; try { r.run(); p++; System.out.println("PASS " + n); }
        catch (Throwable e) { System.out.println("FAIL " + n + ": " + e); }
    }
    static void eq(Object a, Object b) { if (!Objects.equals(a, b)) throw new AssertionError(a + " != " + b); }
    public static void main(String[] args) {
        check("commit then crash: committed data survives", () -> {
            WalStore w = new WalStore();
            w.put("T1", "A", 80); w.put("T1", "B", 120); w.commit("T1");
            Map<String, Integer> s = w.recover(new LinkedHashMap<>(), 1);
            eq(80, s.get("A")); eq(120, s.get("B")); eq(2, s.size());
        });
        check("crash before commit: uncommitted ignored", () -> {
            WalStore w = new WalStore();
            w.put("T1", "A", 80); w.commit("T1");
            w.put("T2", "A", 999);
            Map<String, Integer> s = w.recover(new LinkedHashMap<>(), 1);
            eq(80, s.get("A"));
        });
        check("interleaved txns: only committed applied", () -> {
            WalStore w = new WalStore();
            w.put("T1", "A", 1);
            w.put("T2", "A", 2); w.put("T2", "B", 20);
            w.commit("T1");
            Map<String, Integer> s = w.recover(new LinkedHashMap<>(), 1);
            eq(1, s.get("A")); eq(null, s.get("B"));
        });
        check("later committed txn wins in log order", () -> {
            WalStore w = new WalStore();
            w.put("T1", "A", 1); w.commit("T1");
            w.put("T2", "A", 2); w.commit("T2");
            Map<String, Integer> s = w.recover(new LinkedHashMap<>(), 1);
            eq(2, s.get("A"));
        });
        check("abort/discard uncommitted and delete", () -> {
            WalStore w = new WalStore();
            w.put("T1", "A", 5); w.put("T1", "B", 6); w.commit("T1");
            w.del("T2", "A"); w.commit("T2");
            w.put("T3", "B", 999); w.abort("T3");
            w.put("T4", "C", 7);
            Map<String, Integer> s = w.recover(new LinkedHashMap<>(), 1);
            eq(null, s.get("A")); eq(6, s.get("B")); eq(null, s.get("C"));
        });
        check("checkpoint base and fromLsn", () -> {
            WalStore w = new WalStore();
            w.put("T1", "A", 1); w.commit("T1");
            w.put("T2", "B", 2); w.commit("T2");
            Map<String, Integer> base = new LinkedHashMap<>(); base.put("A", 1);
            Map<String, Integer> s = w.recover(base, 3);
            eq(1, s.get("A")); eq(2, s.get("B"));
            Map<String, Integer> s2 = w.recover(base, 999);
            eq(1, s2.get("A")); eq(null, s2.get("B"));
        });
        System.out.println("RESULT " + p + "/" + t);
    }
}`,
      reference: `import java.util.*;

class WalStore {
    private static final class Rec {
        final int lsn; final String tx, op, key; final Integer val;
        Rec(int lsn, String tx, String op, String key, Integer val) {
            this.lsn = lsn; this.tx = tx; this.op = op; this.key = key; this.val = val;
        }
    }
    private final List<Rec> log = new ArrayList<>();
    private int nextLsn = 1;

    void put(String tx, String key, int value) { log.add(new Rec(nextLsn++, tx, "SET", key, value)); }
    void del(String tx, String key) { log.add(new Rec(nextLsn++, tx, "DEL", key, null)); }
    void commit(String tx) { log.add(new Rec(nextLsn++, tx, "COMMIT", null, null)); }
    void abort(String tx) { log.add(new Rec(nextLsn++, tx, "ABORT", null, null)); }

    Map<String, Integer> recover(Map<String, Integer> base, int fromLsn) {
        Map<String, Integer> state = base == null ? new LinkedHashMap<>() : new LinkedHashMap<>(base);
        Set<String> committed = new LinkedHashSet<>();
        Set<String> aborted = new LinkedHashSet<>();
        for (Rec r : log) {
            if (r.lsn < fromLsn) continue;
            if ("COMMIT".equals(r.op)) committed.add(r.tx);
            else if ("ABORT".equals(r.op)) aborted.add(r.tx);
        }
        for (Rec r : log) {
            if (r.lsn < fromLsn) continue;
            if (("SET".equals(r.op) || "DEL".equals(r.op))
                    && committed.contains(r.tx) && !aborted.contains(r.tx)) {
                if ("SET".equals(r.op)) state.put(r.key, r.val); else state.remove(r.key);
            }
        }
        return state;
    }
}`,
      hints: [
        'Mỗi record cần lsn tăng dần, tx id, op (SET/DEL/COMMIT/ABORT), key, value. put/del/commit/abort chỉ append log.',
        'recover: xác định tập tx có COMMIT (không abort) với lsn >= fromLsn; rồi duyệt log theo thứ tự lsn và chỉ áp dụng SET/DEL của các tx đó lên bản sao base.',
        'Txn không có COMMIT -> bỏ qua toàn bộ thao tác. Áp dụng theo thứ tự log để "later committed wins" tự đúng.',
        'Đừng sửa base của caller; dùng new LinkedHashMap<>(base).'
      ],
      explain: `Mô phỏng quy tắc WAL: (1) thay đổi ghi thành record log; (2) COMMIT là mốc quyết định transaction tồn tại sau crash; (3) recover chỉ redo transaction có COMMIT, theo thứ tự log, từ checkpoint (base + fromLsn).

Đơn giản hoá so với PostgreSQL/InnoDB: log trong bộ nhớ (không fsync thật), record mức key/value logic thay vì page; không undo log riêng, torn-page handling, group commit, hay ARIES đầy đủ. Vẫn dạy đúng bất biến cốt lõi: "đã báo commit thành công thì crash không được mất" và "chưa commit thì crash phải như chưa từng có".`
    }
  ],
  check: [
    {
      q: 'Quy tắc write-ahead yêu cầu điều gì trước khi báo COMMIT thành công?',
      options: [
        'Trang dữ liệu phải ghi xong xuống đĩa',
        'Record COMMIT (và log liên quan) phải bền trên đĩa (fsync log)',
        'Tất cả index phải cập nhật',
        'Client phải gửi lại xác nhận'
      ],
      answer: 1,
      explain: 'Báo commit chỉ sau khi log bền; trang dữ liệu có thể flush trễ vì đã có WAL để redo.'
    },
    {
      q: 'Recover sau crash: transaction đã ghi SET nhưng chưa có COMMIT bền thì sao?',
      options: ['Vẫn redo vì SET đã ghi log', 'Bỏ qua toàn bộ thay đổi của transaction đó', 'Chỉ redo một nửa', 'Chuyển thành COMMIT tự động'],
      answer: 1,
      explain: 'Chưa commit bền thì transaction coi như không thành công, phải không để lại hiệu ứng.'
    },
    {
      q: 'Checkpoint trong mô hình recovery giúp gì?',
      options: [
        'Làm transaction nhanh gấp đôi',
        'Cho phép chỉ replay log từ một mốc, giảm thời gian recover',
        'Thay thế hoàn toàn WAL',
        'Bỏ qua mọi transaction chưa commit trong tương lai'
      ],
      answer: 1,
      explain: 'Checkpoint đánh dấu base đã an toàn tới mức nào, nên recover không cần đọc lại toàn bộ log từ đầu.'
    },
    {
      q: 'Replication slot làm pg_wal đầy ổ cứng khi nào?',
      options: [
        'Khi standby đang replicate bình thường',
        'Khi slot inactive (standby down) không bị drop, giữ restart_lsn không cho WAL tái sử dụng',
        'Khi checkpoint chạy quá thường xuyên',
        'Khi synchronous_commit = off'
      ],
      answer: 1,
      explain: 'Slot lưu restart_lsn (LSN cũ nhất còn cần). Slot inactive không tiêu thụ WAL -> pg_wal không được quay vòng, dung lượng tăng không kiểm soát.'
    }
  ],
  related: ['db-006', 'db-035'],
  tags: ['WAL', 'crash-recovery', 'redo', 'checkpoint', 'durability']
},
{
  id: 'lesson-db-012',
  track: 'db',
  order: 12,
  title: 'Index composite và thứ tự cột: leftmost prefix, selectivity và chi phí ghi',
  level: 'senior',
  minutes: 30,
  goals: [
    'Giải thích index composite là gì và vì sao thứ tự cột quyết định truy vấn nào dùng được',
    'Mô phỏng tìm kiếm trên index đã sắp theo nhiều cột và đếm số entry phải xét',
    'Chọn thứ tự cột theo equality, range và selectivity',
    'Nêu chi phí ghi và bẫy index thừa trên PostgreSQL'
  ],
  body: `**Tóm tắt:** Index composite (index nhiều cột) là một B-tree được sắp theo thứ tự cột bạn khai báo, giống danh bạ sắp theo (họ, tên) chứ không phải theo tên. Nó chỉ phục vụ tốt những truy vấn lọc theo **tiền tố bên trái** (leftmost prefix) của thứ tự đó, nên thứ tự cột quyết định query nào nhanh, index có chọn lọc hay không, và mỗi lần ghi phải trả bao nhiêu.

### Vì sao cần index nhiều cột
Một index một cột chỉ sắp theo đúng một cột. Khi truy vấn lọc đồng thời {{WHERE tenant_id = 42 AND created_at >= '2026-01-01'}}, index trên tenant_id trả về toàn bộ đơn của tenant đó (hàng nghìn entry), database phải đọc **heap** (bảng dữ liệu gốc: nơi từng hàng được lưu, đọc theo địa chỉ TID) rồi lọc created_at trên từng dòng. Index (tenant_id, created_at) sắp theo cả hai, nên nó seek thẳng tới vùng cần.

### Index composite lưu gì trong lá
Mỗi entry ở lá gồm các giá trị cột theo thứ tự khai báo, rồi tới con trỏ TID (địa chỉ vật lý của hàng trong heap). Các entry được sắp theo thứ tự từ điển: so cột 1 trước; nếu bằng thì so cột 2; nếu bằng nữa thì so cột 3.

~~~text
entry (tenant_id, created_at)      -> TID
(7, 2026-01-01 09:00)              -> [block 120, offset 3]
(7, 2026-01-01 09:05)              -> [block 120, offset 4]
(7, 2026-01-02 08:00)              -> [block 121, offset 1]
(9, 2026-01-01 07:00)              -> [block 200, offset 9]
~~~

### Leftmost prefix: quy tắc vàng
- {{WHERE tenant_id = 42}}: dùng được, vì tenant_id là cột đầu tiên.
- {{WHERE created_at >= ...}}: theo quy tắc cổ điển thì không seek được, vì created_at không phải cột đầu; database phải quét toàn bộ entry của index (hoặc chuyển sang seq scan). Một số database khác (Oracle, SQL Server, MySQL 8.0.13+) hỗ trợ **skip scan** (nhảy cóc: khi thiếu cột đầu, nó lần lượt giả sử từng giá trị của cột đầu rồi seek tiếp); PostgreSQL (tới 17) chưa có tính năng này.
- {{WHERE tenant_id = 42 AND created_at >= ...}}: dùng được cả hai — seek tới (42, ...) rồi đi tiếp theo created_at.
- {{WHERE tenant_id = 42 ORDER BY created_at}}: không cần sort, vì trong cùng một tenant, các entry đã có thứ tự theo created_at.

Nói ngắn: theo quy tắc cổ điển, index (a, b, c) phục vụ các tiền tố (a), (a, b), (a, b, c), không phục vụ (b), (c), (b, c). Một số database khác (Oracle, SQL Server, MySQL 8.0.13+) có skip scan cho một phần trường hợp thiếu cột đầu nếu cột đầu ít giá trị phân biệt; PostgreSQL (tới 17) chưa hỗ trợ.

### Thứ tự cột: equality trước, range sau
Quy tắc thực dụng:
1. Cột dùng dấu {{=}} (equality) đặt trước.
2. Cột dùng range ({{>}}, {{<}}, {{BETWEEN}}) hoặc ORDER BY đặt sau trong nhóm đó.
3. Giữa nhiều cột equality, thứ tự không làm index to hay nhỏ khác đi (index vẫn chứa đủ các cột đó). Nó quyết định truy vấn nào **chỉ lọc một phần** index thì còn seek được: nếu có truy vấn quan trọng chỉ {{WHERE tenant_id = ?}}, hãy để {{tenant_id}} đứng đầu; nếu truy vấn nào cũng lọc đủ các cột thì thứ tự giữa chúng ít quan trọng.

Ví dụ truy vấn {{WHERE tenant_id = ? AND status = ? AND created_at BETWEEN ? AND ?}} nên có index {{(tenant_id, status, created_at)}}. Nếu đảo thành {{(created_at, tenant_id, status)}}, seek chỉ còn dựa vào {{created_at}} (range), còn {{tenant_id}} và {{status}} trở thành điều kiện lọc trên từng entry; một số database khác có skip scan nếu hai cột này ít giá trị phân biệt, nhưng PostgreSQL (tới 17) không hỗ trợ, nên phải duyệt nhiều entry hơn.

Selectivity (độ chọn lọc) = số giá trị khác nhau chia cho số hàng: cột boolean chỉ có 2 giá trị nên selectivity rất thấp, đặt nó đầu chỉ giúp khi truy vấn lọc thêm cột phía sau; nếu chỉ lọc riêng {{is_active}} thì index phải đọc rất nhiều entry. Tổ hợp (tenant_id, created_at) thường trỏ tới ít hàng hơn từng cột riêng (mỗi tenant có nhiều đơn, nhưng mỗi cặp tenant + thời điểm thì gần như một đơn), nên số entry phải đọc ít hơn.

### Ví dụ số liệu cụ thể
Bảng {{orders}} 10 triệu dòng, 1000 tenant, mỗi tenant 10 nghìn đơn.
- Index (tenant_id): mỗi tenant 10 nghìn entry.
- Index (tenant_id, created_at): truy vấn "đơn của tenant 7 trong tháng 1" seek tới (7, 2026-01-01) rồi quét khoảng 1 nghìn entry, thay vì 10 nghìn.
- Truy vấn "mọi đơn có created_at trong ngày" theo quy tắc cổ điển không dùng được index trên (vì cột đầu là tenant_id); một số database khác có skip scan nếu tenant_id ít giá trị phân biệt, nhưng PostgreSQL (tới 17) không hỗ trợ; nếu truy vấn này phổ biến thì vẫn nên có index riêng trên created_at.

### Covering index và INCLUDE
Nếu index đã chứa mọi cột mà SELECT cần, PostgreSQL có thể trả kết quả bằng index-only scan, không phải đọc heap. {{CREATE INDEX idx_orders_cov ON orders (tenant_id, created_at) INCLUDE (status, total)}}. Giá phải trả: index rộng hơn, ghi chậm hơn, tốn WAL hơn.

### Chi phí ghi
Mỗi index là một B-tree riêng. INSERT phải chèn entry vào mọi index; UPDATE một cột nằm trong index phải đánh dấu entry cũ và chèn entry mới; mỗi thay đổi sinh WAL. Index càng nhiều cột hoặc cột càng dài thì WAL và bloat càng tăng. Thống kê {{pg_stat_user_indexes.idx_scan}} giúp tìm index không ai dùng.

### Cơ chế từng bước khi PostgreSQL dùng index
1. Planner (bộ lập kế hoạch truy vấn: thành phần quyết định đọc bảng/index theo cách nào) đọc thống kê (pg_statistic: bảng chứa số giá trị phân biệt, histogram...) và ước lượng số hàng mỗi điều kiện trả về.
2. Nếu điều kiện khớp tiền tố trái, nó đi xuống B-tree: so sánh khóa (gồm các cột trong index) ở internal page để chọn con, rồi so tiếp ở lá.
3. Lấy TID của các entry khớp, đọc heap (trừ khi index-only scan).
4. Kiểm tra visibility theo MVCC (đa phiên bản: mỗi transaction thấy một phiên bản dữ liệu riêng thay vì ghi đè lẫn nhau).
5. Nếu số hàng lớn, planner có thể chọn bitmap heap scan hoặc seq scan.

### Mô phỏng trong Java
~~~java
// Index (a, b) sắp theo a rồi b. Truy vấn a = 7 và b trong [5, 15]:
int lo = firstNotBefore(7, 5);    // binary search entry (7, 5)
int hi = firstNotBefore(7, 16);   // entry (7, 16) la bien tren
int examined = hi - lo;           // chi cac entry cua a=7, b trong [5, 15]
// Neu index la (b, a): phai quet moi entry co b trong [5, 15]
// roi moi loc a = 7 -> examined lon hon nhieu.
~~~

### Lỗi hay gặp trên production
1. Thứ tự cột ngược: index (created_at, tenant_id) không phục vụ {{WHERE tenant_id = ?}}.
2. Cột selectivity thấp đứng đầu: index (is_active, tenant_id) gần như vô dụng khi is_active chỉ có 2 giá trị và truy vấn chỉ lọc is_active; một số database khác có skip scan khi truy vấn lọc tenant_id, nhưng PostgreSQL (tới 17) không hỗ trợ.
3. Index thừa trùng tiền tố: đã có (a, b) thì index (a) thường bỏ được.
4. Hàm trên cột: {{WHERE date(created_at) = ...}} không dùng được index; viết thành range {{created_at >= ... AND created_at < ...}}.
5. Quên ANALYZE sau bulk load: planner dùng thống kê cũ và chọn sai plan.

### Liên hệ phỏng vấn
- **"Index composite là gì và leftmost prefix nghĩa là gì?"** → Index sắp theo thứ tự cột khai báo; chỉ tiền tố bên trái dùng được: (a, b, c) phục vụ (a), (a, b), (a, b, c), không phục vụ (b).
- **"Thứ tự cột trong composite index nên thế nào?"** → Equality trước, range/ORDER BY sau; cột selectivity cao cân nhắc đặt trước; index phải khớp cả WHERE lẫn ORDER BY.
- **"Khi nào composite index vô dụng?"** → Khi điều kiện không phải tiền tố, cột đầu selectivity thấp, hoặc có hàm trên cột.
- **"Chi phí của một index thêm là gì?"** → Mỗi INSERT/UPDATE phải duy trì nó, sinh WAL, tăng bloat; index rộng còn làm index-only scan khó hơn.

> Senior tip: trước khi thêm index, viết đúng câu truy vấn rồi đọc {{EXPLAIN (ANALYZE, BUFFERS)}}; một composite index khớp cả WHERE lẫn ORDER BY thường thay được hai index một cột.`,
  exercises: [
    {
      title: 'CompositeIndex: cột đầu quyết định số entry phải xét',
      prompt: `Mô phỏng index composite trên bảng có mọi cặp (a, b) với 1 <= a <= aMax và 1 <= b <= bMax (tổng aMax nhân bMax hàng).

Constructor {{CompositeIndex(order, aMax, bMax)}}: {{order}} là {{"ab"}} (cột đầu là a) hoặc {{"ba"}} (cột đầu là b). Xây mảng entry đã sắp theo thứ tự từ điển của order.

{{examined(aEq, bLo, bHi)}}: số entry index phải xét cho truy vấn {{a = aEq AND b BETWEEN bLo AND bHi}}. Với {{"ab"}}: seek tới (aEq, bLo), duyệt tới hết (aEq, bHi). Với {{"ba"}}: seek tới b = bLo, duyệt hết các entry có b trong khoảng [bLo, bHi] (không lọc được a khi seek).

{{matched(aEq, bLo, bHi)}}: số entry khớp cả hai điều kiện.

Tự sắp mảng và dùng binary search; không dùng TreeMap.`,
      starter: `class CompositeIndex {
    private final String order;
    private final int[] as;
    private final int[] bs;

    CompositeIndex(String order, int aMax, int bMax) { throw new UnsupportedOperationException("TODO"); }

    int examined(int aEq, int bLo, int bHi) { throw new UnsupportedOperationException("TODO"); }

    int matched(int aEq, int bLo, int bHi) { throw new UnsupportedOperationException("TODO"); }
}`,
      tests: `public class Main {
 static int p=0,t=0;
 static void c(String n,Runnable r){t++;try{r.run();p++;System.out.println("PASS "+n);}catch(Throwable e){System.out.println("FAIL "+n+": "+e);}}
 static void eq(int a,int b){if(a!=b)throw new AssertionError(a+" != "+b);}
 static void ok(boolean b){if(!b)throw new AssertionError("expected true");}
 public static void main(String[]z){
  c("ab index examines only the matching slice",()->{CompositeIndex x=new CompositeIndex("ab",50,20);eq(11,x.examined(7,5,15));eq(11,x.matched(7,5,15));});
  c("ba index must scan the whole b range",()->{CompositeIndex x=new CompositeIndex("ba",50,20);eq(550,x.examined(7,5,15));eq(11,x.matched(7,5,15));});
  c("column order changes the examined count",()->{CompositeIndex ab=new CompositeIndex("ab",50,20);CompositeIndex ba=new CompositeIndex("ba",50,20);ok(ab.examined(7,5,15)<ba.examined(7,5,15));});
  c("single b value with ab",()->{CompositeIndex x=new CompositeIndex("ab",50,20);eq(1,x.examined(7,5,5));eq(1,x.matched(7,5,5));});
  c("single b value with ba scans all a",()->{CompositeIndex x=new CompositeIndex("ba",50,20);eq(50,x.examined(7,5,5));eq(1,x.matched(7,5,5));});
  c("full b range for one a",()->{CompositeIndex x=new CompositeIndex("ab",50,20);eq(20,x.examined(7,1,20));eq(20,x.matched(7,1,20));});
  c("empty range",()->{CompositeIndex x=new CompositeIndex("ab",50,20);eq(0,x.examined(7,10,5));eq(0,x.matched(7,10,5));});
  System.out.println("RESULT "+p+"/"+t);
 }
}`,
      reference: `class CompositeIndex {
    private final String order;
    private final int[] as;
    private final int[] bs;

    CompositeIndex(String order, int aMax, int bMax) {
        if (!order.equals("ab") && !order.equals("ba")) throw new IllegalArgumentException("order");
        if (aMax < 0 || bMax < 0) throw new IllegalArgumentException("size");
        this.order = order;
        int n = aMax * bMax;
        int[] bigA = new int[n], bigB = new int[n];
        int k = 0;
        for (int a = 1; a <= aMax; a++)
            for (int b = 1; b <= bMax; b++) { bigA[k] = a; bigB[k] = b; k++; }
        Integer[] idx = new Integer[n];
        for (int i = 0; i < n; i++) idx[i] = i;
        final boolean ab = order.equals("ab");
        Arrays.sort(idx, (i, j) -> {
            int x = ab ? Integer.compare(bigA[i], bigA[j]) : Integer.compare(bigB[i], bigB[j]);
            if (x != 0) return x;
            return ab ? Integer.compare(bigB[i], bigB[j]) : Integer.compare(bigA[i], bigA[j]);
        });
        as = new int[n];
        bs = new int[n];
        for (int i = 0; i < n; i++) { as[i] = bigA[idx[i]]; bs[i] = bigB[idx[i]]; }
    }

    int examined(int aEq, int bLo, int bHi) {
        if (bLo > bHi) return 0;
        int lo, hi;
        if (order.equals("ab")) { lo = lowerAb(aEq, bLo); hi = lowerAb(aEq, bHi + 1); }
        else { lo = lowerB(bLo); hi = lowerB(bHi + 1); }
        return hi - lo;
    }

    int matched(int aEq, int bLo, int bHi) {
        if (bLo > bHi) return 0;
        int lo, hi;
        if (order.equals("ab")) { lo = lowerAb(aEq, bLo); hi = lowerAb(aEq, bHi + 1); }
        else { lo = lowerB(bLo); hi = lowerB(bHi + 1); }
        int count = 0;
        for (int i = lo; i < hi; i++) if (as[i] == aEq) count++;
        return count;
    }

    private int lowerAb(int a, int b) {
        int lo = 0, hi = as.length;
        while (lo < hi) {
            int mid = (lo + hi) >>> 1;
            if (as[mid] < a || (as[mid] == a && bs[mid] < b)) lo = mid + 1; else hi = mid;
        }
        return lo;
    }

    private int lowerB(int b) {
        int lo = 0, hi = bs.length;
        while (lo < hi) {
            int mid = (lo + hi) >>> 1;
            if (bs[mid] < b) lo = mid + 1; else hi = mid;
        }
        return lo;
    }
}`,
      hints: [
        'Sắp entry theo đúng thứ tự cột: với order ab thì so a trước rồi b; với order ba thì so b trước rồi a.',
        'Vùng cần xét là đoạn liên tiếp trong mảng đã sắp: tìm biên dưới và biên trên bằng binary search, rồi lấy hiệu hai chỉ số.',
        'Với order ba, mọi entry có b trong khoảng đều bị xét (không loại được a khi seek); matched vẫn đếm entry có a bằng aEq.'
      ],
      explain: `Bài tập tách hai đại lượng: **examined** (số entry index phải liếc qua) và **matched** (số entry thực sự khớp). Với index (a, b) và truy vấn a = 7, b trong [5, 15], hai biên seek được là (7, 5) và (7, 16), nên chỉ có 11 entry của đúng a = 7 bị xét. Với index (b, a), cột đầu là b nên seek được tới b = 5 nhưng trong mỗi b vẫn phải duyệt mọi a; vì a = 7 nằm rải rác, examined bằng 50 nhân 11 bằng 550. Đó là nội dung của leftmost prefix: chỉ tiền tố bên trái mới dùng được để thu hẹp.

Lỗi hay gặp khi cài: dùng == cho chuỗi order (phải dùng equals); quên xử lý bLo > bHi (khoảng rỗng); tính biên trên bằng bHi thay vì bHi + 1 làm mất entry ở đúng biên trên. Trong PostgreSQL, cùng ý này thể hiện ở thứ tự cột của index và ở việc planner chọn index scan hay seq scan; hãy kiểm chứng bằng {{EXPLAIN (ANALYZE, BUFFERS)}} thay vì suy đoán. Một số database khác (MySQL 8.0.13+, Oracle, SQL Server) có skip scan giúp trường hợp index {{(b, a)}} khi {{a}} ít giá trị phân biệt; PostgreSQL (tới 17) không hỗ trợ; mô phỏng này cố tình dùng hành vi cổ điển để thấy rõ leftmost prefix.`
    }
  ],
  check: [
    {
      q: 'Index (a, b, c) phục vụ những tiền tố điều kiện nào?',
      options: [
        'Chỉ (a, b, c)',
        '(a), (a, b) và (a, b, c)',
        '(b) và (c)',
        'Mọi tổ hợp của a, b, c'
      ],
      answer: 1,
      explain: 'B-tree sắp theo thứ tự từ điển nên chỉ tiền tố bên trái dùng được; (b) hay (c) đứng một mình không phải tiền tố.'
    },
    {
      q: 'Truy vấn WHERE tenant_id = ? AND created_at BETWEEN ? AND ? nên dùng index nào?',
      options: [
        '(created_at, tenant_id)',
        '(tenant_id, created_at)',
        '(created_at)',
        '(status, tenant_id)'
      ],
      answer: 1,
      explain: 'Equality tenant_id đứng trước, range created_at đứng sau, khớp đúng tiền tố và cho phép range scan.'
    },
    {
      q: 'Vấn đề của index (is_active, created_at) khi is_active là boolean?',
      options: [
        'Boolean không được index',
        'Cột đầu selectivity rất thấp nên index gần như không thu hẹp được',
        'PostgreSQL không cho index boolean',
        'created_at không được đứng sau'
      ],
      answer: 1,
      explain: 'is_active chỉ có 2 giá trị, mỗi giá trị trỏ tới khoảng nửa bảng; nếu truy vấn chỉ lọc is_active thì index scan phải đọc rất nhiều entry. Một số database khác (MySQL 8.0.13+, Oracle, SQL Server) có skip scan khi truy vấn lọc cột phía sau, nhưng PostgreSQL (tới 17) không hỗ trợ; cột đầu ít giá trị phân biệt là điều kiện để skip scan có lợi ở những database có tính năng này.'
    },
    {
      q: 'Vì sao thêm một index làm INSERT chậm đi?',
      options: [
        'Vì index chiếm RAM của application',
        'Vì mỗi INSERT phải chèn entry vào mọi index và sinh thêm WAL',
        'Vì index làm transaction dài hơn',
        'Vì PostgreSQL phải ANALYZE sau mỗi INSERT'
      ],
      answer: 1,
      explain: 'Mỗi index là một B-tree riêng; INSERT phải duy trì tất cả, ghi WAL và có thể gây page split.'
    }
  ],
  related: ['db-001', 'db-022', 'db-023'],
  tags: ['composite-index', 'index', 'leftmost-prefix', 'PostgreSQL']
},
{
  id: 'lesson-db-013',
  track: 'db',
  order: 13,
  title: 'Non-repeatable read và phantom: mô phỏng lịch giao dịch và snapshot',
  level: 'senior',
  minutes: 30,
  goals: [
    'Phân biệt non-repeatable read và phantom read bằng lịch giao dịch cụ thể',
    'Giải thích vì sao READ COMMITTED cho phép còn REPEATABLE READ của PostgreSQL thì không',
    'Mô phỏng snapshot của transaction và thấy kết quả hai lần đọc',
    'Nêu cách phòng ngừa trong code và trên PostgreSQL'
  ],
  body: `**Tóm tắt:** Non-repeatable read là khi một transaction đọc cùng một hàng hai lần nhưng nhận hai giá trị đã commit khác nhau, vì transaction khác cập nhật và commit ở giữa. Phantom read là khi cùng một truy vấn theo điều kiện chạy hai lần mà lần sau thấy thêm (hoặc bớt) hàng, vì transaction khác INSERT/DELETE rồi commit. Cả hai đều hợp lệ ở READ COMMITTED; REPEATABLE READ của PostgreSQL chặn cả hai bằng snapshot.

### Lịch giao dịch (schedule) là gì
Schedule là cách sắp xen kẽ các thao tác đọc/ghi của nhiều transaction theo thời gian. Ký hiệu R là đọc (read), W là ghi (write), C là commit. Một dòng như {{R1(x) = 100}} nghĩa là transaction 1 đọc hàng x và nhận 100.

Non-repeatable read:
~~~text
T1                                   T2
|-- R1(x) -> 100                    |
|                                   |-- W(x, 80)
|                                   |-- C (commit)
|-- R2(x) -> 80   <-- khac lan 1
~~~

Phantom read:
~~~text
T1                                        T2
|-- SELECT count(*) WHERE v < 100 -> 3    |
|                                         |-- INSERT (v = 50)
|                                         |-- C (commit)
|-- SELECT count(*) WHERE v < 100 -> 4    |
~~~

### Vì sao hai hiện tượng này xảy ra
Ở READ COMMITTED (mức mặc định của PostgreSQL), mỗi câu lệnh SQL lấy một snapshot mới. Câu SELECT thứ hai chạy sau khi T2 commit nên thấy dữ liệu mới: non-repeatable read là chuyện bình thường, không phải lỗi.
Ở REPEATABLE READ, snapshot được lấy ở câu lệnh đầu tiên của transaction và giữ nguyên tới khi commit. Mọi câu lệnh sau đó làm việc trên cùng một ảnh chụp logic, nên đọc lại vẫn ra giá trị cũ và không thấy hàng mới. Giá phải trả: nếu transaction muốn ghi một hàng đã bị người khác sửa và commit sau snapshot, PostgreSQL không ghi đè mà báo {{could not serialize access due to concurrent update}} (SQLSTATE 40001), buộc ứng dụng retry cả transaction.

~~~seq
title: Non-repeatable read ở READ COMMITTED
actors: T1 | PostgreSQL | T2
T1 -> PostgreSQL: SELECT balance lan 1
PostgreSQL --> T1: 100
T2 -> PostgreSQL: UPDATE balance = 80
T2 -> PostgreSQL: COMMIT
PostgreSQL --> T2: OK
T1 -> PostgreSQL: SELECT balance lan 2
PostgreSQL --> T1: 80 (snapshot moi)
~~~

### Bảng so sánh anomaly và mức isolation
| Hiện tượng | READ COMMITTED | REPEATABLE READ (PostgreSQL) | SERIALIZABLE |
|---|---|---|---|
| Non-repeatable read | có thể | không | không |
| Phantom read | có thể | không | không |
| Lost update | có thể | chặn bằng 40001 | chặn bằng 40001 |
| Write skew | có thể | có thể | chặn bằng 40001 |

PostgreSQL không cho dirty read ở bất kỳ mức nào: {{READ UNCOMMITTED}} được xử lý như {{READ COMMITTED}}.

MySQL InnoDB khác về cơ chế: ở REPEATABLE READ, đọc thường dùng snapshot (chặn non-repeatable và phantom), còn locking read ({{SELECT ... FOR UPDATE}}) dùng next-key lock để chặn phantom, nhưng chính gap lock lại có thể gây deadlock khi INSERT (xem bài về deadlock).

Ba hiện tượng hay bị nhầm:
- **Lost update (mất cập nhật):** hai transaction cùng đọc x = 100, mỗi bên cộng 10 rồi ghi 110; một trong hai phép cộng biến mất.
- **Write skew (lệch ghi):** hai transaction đọc cùng dữ liệu, mỗi bên ghi vào hàng khác nhau dựa trên một ràng buộc chung (ví dụ tổng số dư không âm); không ai ghi đè hàng của ai nhưng ràng buộc chung bị vi phạm.
- **OLTP (xử lý giao dịch trực tuyến):** hệ thống nhiều người dùng đọc/ghi từng dòng, như app ngân hàng hay đặt hàng; khác OLAP (phân tích, quét lượng lớn dữ liệu).

**Gap lock** là khóa một khoảng giá trị giữa hai khóa để chặn INSERT lọt vào; **next-key lock** là khóa bản ghi cộng khoảng ngay trước nó. PostgreSQL không dùng hai loại khóa này; nó dựa vào snapshot và kiểm tra xung đột khi ghi.

### Cơ chế từng bước
1. Transaction BEGIN.
2. Ở REPEATABLE READ, câu lệnh đầu tiên lấy snapshot (danh sách transaction đã commit tại thời điểm đó). Ở READ COMMITTED, mỗi câu lệnh lấy snapshot riêng.
3. Transaction khác ghi và commit.
4. Transaction của bạn đọc lại: REPEATABLE READ dùng snapshot cũ nên thấy dữ liệu cũ; READ COMMITTED dùng snapshot mới nên thấy dữ liệu mới.
5. Kết thúc: ở REPEATABLE READ, nếu bạn cố ghi đè một hàng đã đổi sau snapshot, PostgreSQL báo 40001.

### Đọc và ghi trong code
~~~java
// Isolation là thuộc tính của transaction, không đặt ở từng câu SELECT
conn.setTransactionIsolation(Connection.TRANSACTION_REPEATABLE_READ);
try {
    // ... đọc dữ liệu, tính toán, kiểm tra điều kiện nghiệp vụ
    // ... ghi (UPDATE/INSERT) trong cùng transaction
    conn.commit();
} catch (SQLException e) {
    // 40001 = serialization_failure: transaction khác đã commit trước
    // Khi dùng SERIALIZABLE (và cả REPEATABLE READ khi ghi đè), phải retry cả transaction
    if ("40001".equals(e.getSQLState())) {
        conn.rollback();
        // TODO: thử lại tối đa 2-3 lần, sau đó báo lỗi cho người gọi
    }
    throw e;
}
~~~
Điểm quan trọng: không đặt isolation ở từng câu lệnh rồi mong cả transaction nhất quán; isolation là thuộc tính của **transaction**. Và mọi mức isolation mạnh hơn READ COMMITTED đều phải đi kèm chính sách retry ở tầng ứng dụng, vì lỗi 40001 là tín hiệu bình thường khi có xung đột, không phải bug.

### Ví dụ đời thực
Một báo cáo doanh thu chạy trong transaction 30 giây ở READ COMMITTED: câu SELECT đầu đếm 10 nghìn đơn, câu SELECT thứ hai đếm 10 nghìn 5 trăm đơn vì đơn mới commit ở giữa. Con số tổng không khớp với bất kỳ thời điểm nào. Cách sửa: chạy ở REPEATABLE READ, hoặc gộp thành một câu SQL, hoặc ghi kết quả ra bảng snapshot theo ngày.

Ví dụ khác: kiểm tra email chưa tồn tại rồi INSERT. Hai request cùng chạy ở READ COMMITTED đều thấy chưa tồn tại nên cùng insert. Cách sửa: unique constraint trên email (database chặn), hoặc SERIALIZABLE, hoặc {{INSERT ... ON CONFLICT DO NOTHING}}.

### Lỗi hay gặp trên production
1. Đọc nhiều lần trong một transaction ở READ COMMITTED rồi so sánh số liệu — non-repeatable read làm kết quả vô nghĩa.
2. Dùng SELECT rồi tính trong Java rồi UPDATE — lost update (xem bài isolation trước).
3. Kiểm tra tồn tại rồi INSERT mà không có unique constraint — race tạo bản trùng.
4. Nâng lên SERIALIZABLE nhưng không retry lỗi 40001 — ứng dụng nổ theo.
5. Transaction dài ở REPEATABLE READ giữ snapshot, chặn VACUUM dọn tuple chết.

### Liên hệ phỏng vấn
- **"Non-repeatable read khác phantom read ở đâu?"** → Non-repeatable là cùng một hàng, hai lần đọc ra hai giá trị; phantom là cùng một điều kiện, hai lần đọc ra hai tập hàng khác nhau.
- **"READ COMMITTED và REPEATABLE READ chặn được gì?"** → READ COMMITTED không chặn cả hai; REPEATABLE READ của PostgreSQL chặn cả hai bằng snapshot, nhưng phải retry 40001 khi ghi đè.
- **"Vì sao PostgreSQL không cho dirty read?"** → PostgreSQL không có mức READ UNCOMMITTED thật; nó xử lý như READ COMMITTED.
- **"Làm sao tránh race khi kiểm tra rồi insert?"** → Unique constraint, SERIALIZABLE, hoặc INSERT ON CONFLICT; đừng dựa vào SELECT rồi INSERT ở READ COMMITTED.

> Senior tip: chọn mức isolation theo invariant nghiệp vụ, không theo thói quen; phần lớn hệ thống OLTP dùng READ COMMITTED và bọc các thao tác cần nhất quán bằng UPDATE nguyên tử, FOR UPDATE hoặc SERIALIZABLE cộng retry.`,
  exercises: [
    {
      title: 'IsolationSim: đọc hai lần và đếm phantom theo mức isolation',
      prompt: `Mô phỏng một bảng nhỏ trong bộ nhớ để thấy hai anomaly.

Constructor {{IsolationSim(level, initialValues...)}}: {{level}} là {{"RC"}} (READ COMMITTED) hoặc {{"RR"}} (REPEATABLE READ). {{initialValues}} là giá trị các hàng theo id 1, 2, 3... (mỗi phần tử là một hàng).

{{nonRepeatableRead(id, newVal)}}: mở transaction T1, đọc hàng {{id}}, cho T2 cập nhật hàng đó thành {{newVal}} rồi commit, sau đó T1 đọc lại. Trả về mảng hai phần tử {đọc lần 1, đọc lần 2}.
- RR: T1 dùng snapshot lấy lúc bắt đầu, nên hai lần đọc bằng nhau.
- RC: mỗi lần đọc lấy snapshot mới, nên lần 2 thấy giá trị mới.

{{phantom(threshold, insertVal)}}: mở transaction T1, đếm số hàng có giá trị nhỏ hơn {{threshold}}, cho T2 INSERT một hàng giá trị {{insertVal}} rồi commit, sau đó T1 đếm lại. Trả về mảng hai phần tử {đếm lần 1, đếm lần 2}.
- RR: T1 đếm trên snapshot cũ, kết quả không đổi.
- RC: T1 thấy hàng mới nếu {{insertVal}} nhỏ hơn {{threshold}}.

Không dùng thread, không sleep; kết quả phải xác định.`,
      starter: `class IsolationSim {
    private final boolean repeatableRead;
    private final java.util.List<Integer> live = new java.util.ArrayList<>();
    private java.util.List<Integer> snapshot;

    IsolationSim(String level, int... initial) {
        this.repeatableRead = "RR".equalsIgnoreCase(level);
        for (int v : initial) live.add(v);
    }

    int[] nonRepeatableRead(int id, int newVal) { throw new UnsupportedOperationException("TODO"); }

    int[] phantom(int threshold, int insertVal) { throw new UnsupportedOperationException("TODO"); }
}`,
      tests: `public class Main {
 static int p=0,t=0;
 static void c(String n,Runnable r){t++;try{r.run();p++;System.out.println("PASS "+n);}catch(Throwable e){System.out.println("FAIL "+n+": "+e);}}
 static void eq(int a,int b){if(a!=b)throw new AssertionError(a+" != "+b);}
 public static void main(String[]z){
  c("repeatable read keeps the first value",()->{IsolationSim x=new IsolationSim("RR",100);int[] r=x.nonRepeatableRead(1,80);eq(100,r[0]);eq(100,r[1]);});
  c("read committed sees the committed update",()->{IsolationSim x=new IsolationSim("RC",100);int[] r=x.nonRepeatableRead(1,80);eq(100,r[0]);eq(80,r[1]);});
  c("repeatable read blocks phantom",()->{IsolationSim x=new IsolationSim("RR",10,20,30);int[] r=x.phantom(100,40);eq(3,r[0]);eq(3,r[1]);});
  c("read committed allows phantom",()->{IsolationSim x=new IsolationSim("RC",10,20,30);int[] r=x.phantom(100,40);eq(3,r[0]);eq(4,r[1]);});
  c("insert outside the predicate changes nothing",()->{IsolationSim x=new IsolationSim("RC",10,20,30);int[] r=x.phantom(25,100);eq(2,r[0]);eq(2,r[1]);});
  c("repeatable read rereads the same row from snapshot",()->{IsolationSim x=new IsolationSim("RR",5,6,7);int[] r=x.nonRepeatableRead(2,60);eq(6,r[0]);eq(6,r[1]);});
  c("read committed updates only the targeted row",()->{IsolationSim x=new IsolationSim("RC",5,6,7);int[] r=x.nonRepeatableRead(2,60);eq(6,r[0]);eq(60,r[1]);});
  System.out.println("RESULT "+p+"/"+t);
 }
}`,
      reference: `import java.util.*;

class IsolationSim {
    private final boolean repeatableRead;
    private final List<Integer> live;
    private List<Integer> snapshot;

    IsolationSim(String level, int... initial) {
        this.repeatableRead = "RR".equalsIgnoreCase(level) || "REPEATABLE READ".equalsIgnoreCase(level);
        this.live = new ArrayList<>();
        for (int v : initial) live.add(v);
    }

    private void begin() {
        snapshot = repeatableRead ? new ArrayList<>(live) : null;
    }

    private List<Integer> view() {
        return repeatableRead ? snapshot : live;
    }

    private int read(int id) {
        return view().get(id - 1);
    }

    private int countBelow(int threshold) {
        int count = 0;
        for (int v : view()) if (v < threshold) count++;
        return count;
    }

    int[] nonRepeatableRead(int id, int newVal) {
        begin();
        int first = read(id);
        live.set(id - 1, newVal);
        int second = read(id);
        return new int[]{first, second};
    }

    int[] phantom(int threshold, int insertVal) {
        begin();
        int first = countBelow(threshold);
        live.add(insertVal);
        int second = countBelow(threshold);
        return new int[]{first, second};
    }
}`,
      hints: [
        'Với RR, chụp một bản sao danh sách hàng khi transaction bắt đầu; mọi lần đọc trong transaction dùng bản sao đó.',
        'Với RC, không chụp snapshot: đọc trực tiếp danh sách hiện tại mỗi lần.',
        'nonRepeatableRead: đọc, cho T2 ghi, đọc lại. phantom: đếm, cho T2 insert, đếm lại. Trả về cặp {lần 1, lần 2}.'
      ],
      explain: `Toàn bộ bài tập gói trong một ý: **điểm chụp ảnh (snapshot)**. REPEATABLE READ chụp một lần ở đầu transaction nên đọc lại vẫn thấy giá trị cũ và không thấy hàng mới; READ COMMITTED chụp lại mỗi câu lệnh nên thấy commit mới. Đó là lý do chuẩn SQL định nghĩa READ COMMITTED cho phép non-repeatable read và phantom, còn REPEATABLE READ thì không.

Đơn giản hoá so với PostgreSQL: bài mô phỏng dùng danh sách trong RAM, không có MVCC tuple, không có 40001 khi ghi đè. Trong PostgreSQL thật, REPEATABLE READ giữ snapshot nhưng khi bạn UPDATE hàng đã bị người khác sửa và commit sau snapshot, nó abort transaction với SQLSTATE 40001 thay vì ghi đè. Muốn chặn cả write skew (ví dụ hai transaction cùng kiểm tra tổng số dư rồi cùng trừ) thì cần SERIALIZABLE.`
    }
  ],
  check: [
    {
      q: 'Non-repeatable read là gì?',
      options: [
        'Cùng một hàng, hai lần đọc trong một transaction cho hai giá trị đã commit khác nhau',
        'Cùng một điều kiện, hai lần đọc cho hai tập hàng khác nhau',
        'Đọc được dữ liệu chưa commit',
        'Hai transaction cùng ghi một hàng'
      ],
      answer: 0,
      explain: 'Đối tượng là một hàng cụ thể; giá trị đổi vì transaction khác commit ở giữa. Hiện tượng tập hàng đổi là phantom.'
    },
    {
      q: 'Phantom read là gì?',
      options: [
        'Đọc lại một hàng ra giá trị khác',
        'Cùng một điều kiện, hai lần đọc cho hai tập hàng khác nhau do INSERT/DELETE rồi commit',
        'Đọc dữ liệu chưa commit',
        'Mất kết nối giữa transaction'
      ],
      answer: 1,
      explain: 'Phantom nói về tập kết quả của một predicate, không phải một hàng cố định.'
    },
    {
      q: 'REPEATABLE READ của PostgreSQL chặn non-repeatable read và phantom bằng cách nào?',
      options: [
        'Bằng gap lock như InnoDB',
        'Bằng cách giữ snapshot lấy ở đầu transaction suốt transaction',
        'Bằng cách tắt MVCC',
        'Bằng cách ghi đè dữ liệu cũ'
      ],
      answer: 1,
      explain: 'PostgreSQL dùng snapshot (MVCC), không dùng gap lock; đọc lại dùng snapshot cũ nên không thấy thay đổi đã commit.'
    },
    {
      q: 'Vì sao hai SELECT trong cùng một transaction ở READ COMMITTED có thể ra hai kết quả?',
      options: [
        'Vì PostgreSQL bỏ qua câu lệnh thứ hai',
        'Vì mỗi câu lệnh lấy một snapshot mới, nên thấy commit mới ở giữa',
        'Vì READ COMMITTED tắt transaction',
        'Vì index bị hỏng'
      ],
      answer: 1,
      explain: 'READ COMMITTED chụp ảnh theo từng câu lệnh; đó chính là định nghĩa cho phép non-repeatable read.'
    }
  ],
  related: ['db-002', 'db-033', 'db-034'],
  tags: ['isolation', 'non-repeatable-read', 'phantom-read', 'snapshot', 'PostgreSQL']
},
{
  id: 'lesson-db-014',
  track: 'db',
  order: 14,
  title: 'B-tree, covering index (INCLUDE) và partial index: tra cứu đúng chỗ, đọc ít dữ liệu',
  level: 'senior',
  minutes: 30,
  goals: [
    'Giải thích B-tree trong PostgreSQL hoạt động thế nào từ gốc: page, chiều cao cây, leaf chain và heap fetch',
    'Hiểu covering index với INCLUDE cho index-only scan và điều kiện visibility map',
    'Biết khi nào dùng partial index để index nhỏ, chọn lọc cao và ít tốn ghi',
    'Mô phỏng tra cứu bằng cấu trúc có thứ tự như B-tree và đếm số bước so với quét tuần tự'
  ],
  body: `**Tóm tắt:** PostgreSQL dùng B-tree index (cây B, cấu trúc dữ liệu dạng cây cân bằng trên đĩa, mỗi nút là một page 8KB chứa nhiều khóa) để nhảy thẳng tới vài page thay vì đọc toàn bộ bảng. Covering index (index bao phủ: index chứa đủ mọi cột truy vấn cần) với {{INCLUDE}} có thể trả kết quả mà không đọc heap (bảng dữ liệu gốc). Partial index (index bộ phận: index chỉ một tập hàng thỏa điều kiện {{WHERE}}) giữ index nhỏ và chọn lọc cao khi truy vấn thường nhắm vào một nhóm hàng hiếm.

### B-tree hoạt động thế nào từ gốc
**Page (trang)** là đơn vị đọc/ghi cơ bản của PostgreSQL, mặc định 8KB. Mỗi node của B-tree là một page: internal page lưu các khóa ngăn cách và con trỏ tới page con; leaf page (lá) lưu cặp (khóa index, TID). **TID (tuple identifier)** là địa chỉ vật lý của một hàng trong heap, gồm số block và offset trong block.

Cơ chế tra cứu từng bước (ví dụ {{WHERE email = 'a@x.com'}} trên index {{(email)}}):
1. Đọc **root page** (gốc). Số page của root được lưu trong **metapage** (page 0 của index, nơi chứa siêu dữ liệu); nếu chưa có trong shared buffers (bộ nhớ đệm dùng chung của PostgreSQL) thì đọc từ đĩa.
2. **Binary search** (tìm nhị phân: vì khóa trong page đã sắp thứ tự) trong page để chọn con trỏ con phù hợp. Lặp xuống internal page tiếp theo.
3. Tới **leaf page**: tìm khóa khớp. Leaf pages được nối ngang bằng **sibling pointers** (con trỏ anh em) nên range scan (quét khoảng, ví dụ {{>=}}) đi tuần tự sang lá kế tiếp mà không phải leo lại từ gốc.
4. **Heap fetch**: dùng TID đọc heap page để lấy các cột còn thiếu và kiểm tra **visibility** (tính nhìn thấy theo MVCC: một hàng chỉ hiện với transaction nếu phiên bản đó hợp lệ với snapshot của transaction). Nếu hàng đã bị UPDATE/DELETE, index entry cũ vẫn có thể còn đó cho tới khi VACUUM dọn.
5. Trả kết quả.

Vì sao chiều cao thấp? **Fanout** (số nhánh/con trỏ con trong một node) lớn: một page 8KB chứa hàng trăm khóa nên cây 3-4 tầng đã chỉ mục được hàng tỷ hàng (mỗi tầng là một page đọc tiềm năng). Đây là khác biệt cốt lõi với cây nhị phân trong RAM (mỗi node 1 khóa, fanout 2, cao ~30 tầng cho 1 tỷ).

~~~text
                 [root: 100 | 500]          (internal)
                /        |        \\
        [10|40|70]   [120|300]   [520|800]  (internal/leaf)
           ...          ...          ...
  leaf: (8,TID)-(10,TID)-(12,TID) <-> (40,TID)-...  (sibling chain)
~~~

### Covering index (INCLUDE) và index-only scan
**Index-only scan** (quét chỉ trên index) trả kết quả mà không đọc heap. Điều kiện: mọi cột trong {{SELECT}}, {{WHERE}}, {{JOIN}}, {{ORDER BY}} đều nằm trong index. Nhưng MVCC đòi hỏi biết tuple có "nhìn thấy" không; PostgreSQL dùng **visibility map** (bản đồ đánh dấu page nào có mọi tuple đều đã commit và hiển thị với tất cả transaction). Nếu page chưa được đánh dấu all-visible, engine vẫn phải kiểm tra heap.

{{INCLUDE}} thêm cột "payload" vào lá mà **không** đưa vào khóa sắp xếp (khác với cột khóa): cột INCLUDE không tham gia so sánh thứ tự, chỉ để trả về. Điều này giữ cây gọn hơn so với nhét mọi cột vào khóa.

~~~sql
-- truy vấn: SELECT status, total FROM orders WHERE tenant_id = 1 AND created_at >= '2026-01-01'
CREATE INDEX idx_orders_cov
  ON orders (tenant_id, created_at)   -- khóa: dùng để seek/range
  INCLUDE (status, total);            -- payload: chỉ để trả về
~~~

| Kiểu | Đọc heap? | Khi nào |
|---|---|---|
| Index scan | Có (theo TID) | Thiếu cột hoặc visibility map chưa cho phép |
| Index-only scan | Không (thường) | Đủ cột + page all-visible |
| Bitmap index scan | Có, gom theo block | Nhiều TID rải rác, giảm random I/O |

Trade-off: index rộng hơn, tốn dung lượng; mọi INSERT và UPDATE có cột nằm trong index đều phải cập nhật index (ghi chậm hơn, WAL nhiều hơn). Chỉ thêm INCLUDE cho truy vấn thực sự nóng và ổn định.

### Partial index
Partial index có mệnh đề {{WHERE}}: chỉ những hàng thỏa điều kiện mới được đưa vào index. Lợi ích: index nhỏ, ít tốn ghi, chọn lọc rất cao cho đúng truy vấn mục tiêu.

~~~sql
-- 95% đơn đã 'DONE', truy vấn thường lấy đơn 'PENDING'
CREATE INDEX idx_orders_pending_created
  ON orders (created_at)
  WHERE status = 'PENDING';
-- planner dùng index này khi truy vấn cũng có WHERE status = 'PENDING'
~~~

Quy tắc: predicate trong truy vấn phải **bao hàm** (imply) predicate của index thì planner (bộ lập kế hoạch truy vấn) mới dùng. {{WHERE status = 'PENDING' AND tenant_id = 7}} dùng được index trên; {{WHERE status = 'FAILED'}} thì không. Partial index cũng hữu ích cho unique có điều kiện, ví dụ {{CREATE UNIQUE INDEX ... ON users(email) WHERE deleted_at IS NULL}} (chỉ email của user chưa xóa phải duy nhất).

### Ví dụ đời thực
Giả sử bảng {{orders}} có 200 triệu dòng, mỗi ngày thêm 180 nghìn đơn. Truy vấn nóng của dashboard: {{SELECT status, total FROM orders WHERE tenant_id = 7 AND created_at >= now() - interval '30 days'}} — chiếm 80% traffic. Tenant 7 là khách lớn: 1,2 triệu đơn tích lũy trong 3 năm (khoảng 1.100 đơn/ngày), nên 30 ngày chỉ khoảng 33 nghìn đơn. Index cũ {{(tenant_id)}} phải đọc 1,2 triệu entry của tenant 7 rồi heap fetch từng dòng để lọc 30 ngày.

Đổi sang index {{(tenant_id, created_at) INCLUDE (status, total)}}: planner seek tới (7, biên dưới) rồi quét đúng khoảng 33 nghìn entry, và vì đủ cột nên có thể index-only scan. Trong ví dụ giả định này, sau khi autovacuum chạy, {{EXPLAIN (ANALYZE, BUFFERS)}} cho thấy số block đọc giảm từ khoảng 45 nghìn xuống 6 nghìn, {{Heap Fetches}} từ khoảng 1,2 triệu xuống 0, p95 truy vấn từ 850 ms xuống 120 ms.

> Các con số trên là ví dụ minh hoạ, không phải benchmark của bạn; phải đo bằng {{EXPLAIN (ANALYZE, BUFFERS)}} trên dữ liệu thật.

### Lỗi hay gặp trên production
1. **Thêm {{INCLUDE}} cho mọi index “cho chắc”.** Index phình, mỗi INSERT/UPDATE tốn thêm WAL và có thể gây page split; index-only scan chỉ có lợi khi truy vấn thật sự nóng và ổn định.
2. **Partial index nhưng predicate truy vấn không khớp.** Planner không dùng; nếu điều kiện thay đổi thường xuyên, hãy tạo index phù hợp hoặc bỏ partial.
3. **Index-only scan vẫn có {{Heap Fetches}} cao.** Visibility map chưa đánh dấu all-visible vì autovacuum chưa chạy hoặc transaction dài giữ snapshot; kiểm tra {{pg_stat_user_tables.n_dead_tup}} và chạy {{VACUUM}} có kiểm soát.
4. **Tắt autovacuum hoặc để bloat lớn.** Entry chết nhiều làm index to, index-only scan phải đọc heap, truy vấn chậm dần; theo dõi {{pg_stat_user_indexes}} và lịch vacuum.
5. **Đưa cột rất lớn ({{text}}, {{jsonb}}) vào {{INCLUDE}}.** Index cồng kềnh, tốn I/O; chỉ đưa cột nhỏ, đủ để trả về.

### Liên hệ phỏng vấn
- "B-tree của PostgreSQL khác cây nhị phân thế nào?" → fanout lớn, mỗi node là page 8KB, chiều cao 3-4 tầng cho dữ liệu rất lớn, leaf có sibling chain cho range scan; tối ưu cho I/O trang trên đĩa.
- "Khi nào index-only scan thực sự không đọc heap?" → khi index chứa đủ cột và visibility map đánh dấu page all-visible (VACUUM/autovacuum đã chạy).
- "Partial index dùng khi nào?" → khi truy vấn lặp lại nhắm vào một tập con hàng có điều kiện ổn định (trạng thái hiếm, chưa xóa); giúp index nhỏ và nhanh hơn.

> Senior tip: dùng {{EXPLAIN (ANALYZE, BUFFERS)}} để xem "Index Only Scan" hay "Index Scan" và số {{Heap Fetches}}. Nếu heap fetches cao dù index đủ cột, kiểm tra autovacuum/vacuum và {{pg_stat_user_tables.n_dead_tup}}.
`,
  exercises: [
    {
      title: 'Mô phỏng quét tuần tự và tra cứu theo index có thứ tự',
      prompt: `Cài đặt lớp {{IndexSim}} mô phỏng một "bảng" gồm các hàng có khóa số nguyên tăng dần (đã sắp theo khóa, giống dữ liệu trong leaf của B-tree).

- Constructor {{IndexSim(int[] sortedKeys)}}: nhận mảng khóa đã sắp tăng dần.
- {{int sequentialSteps(int target)}}: đếm số bước khi **quét tuần tự** từ đầu mảng để tìm {{target}}. Mỗi lần so sánh một phần tử với {{target}} tính là 1 bước. Nếu tìm thấy thì dừng và trả về số bước đã thực hiện; nếu duyệt hết mà không thấy thì trả về tổng số phần tử.
- {{int indexSteps(int target)}}: đếm số bước khi tra cứu bằng **tìm nhị phân** (binary search) trên mảng đã sắp, mô phỏng việc đi xuống cây có thứ tự. Mỗi lần so sánh phần tử giữa với {{target}} tính là 1 bước (kể cả lần tìm ra kết quả). Nếu mảng rỗng trả về 0.
- {{boolean contains(int target)}}: trả về {{true}} nếu tìm thấy bằng tra cứu index (tìm nhị phân), ngược lại {{false}}.`,
      starter: `class IndexSim {
    private final int[] keys;

    IndexSim(int[] sortedKeys) {
        this.keys = sortedKeys == null ? new int[0] : sortedKeys.clone();
    }

    int sequentialSteps(int target) {
        throw new UnsupportedOperationException("TODO");
    }

    int indexSteps(int target) {
        throw new UnsupportedOperationException("TODO");
    }

    boolean contains(int target) {
        throw new UnsupportedOperationException("TODO");
    }
}
`,
      tests: `public class Main {
    static void check(String name, boolean cond) {
        if (cond) System.out.println("PASS " + name);
        else System.out.println("FAIL " + name);
    }
    public static void main(String[] args) {
        int[] keys = new int[16];
        for (int i = 0; i < 16; i++) keys[i] = (i + 1) * 10; // 10,20,...,160
        IndexSim sim = new IndexSim(keys);

        int seq = sim.sequentialSteps(140);
        check("sequential scans in order", seq == 14);

        int idx = sim.indexSteps(140);
        check("index uses binary search steps", idx >= 1 && idx <= 5);

        check("index far fewer steps than scan", idx < seq);

        check("sequential miss scans all", sim.sequentialSteps(999) == 16);

        check("index miss bounded", sim.indexSteps(999) >= 1 && sim.indexSteps(999) <= 5);

        check("contains found", sim.contains(80));
        check("contains not found", !sim.contains(85));

        IndexSim empty = new IndexSim(new int[0]);
        check("empty sequential", empty.sequentialSteps(1) == 0);
        check("empty index", empty.indexSteps(1) == 0);
        check("empty contains", !empty.contains(1));

        System.out.println("RESULT " + (countPass()) + "/10");
    }
    static int countPass() {
        // recompute for RESULT line
        int pass = 0;
        int[] keys = new int[16];
        for (int i = 0; i < 16; i++) keys[i] = (i + 1) * 10;
        IndexSim sim = new IndexSim(keys);
        if (sim.sequentialSteps(140) == 14) pass++;
        int idx = sim.indexSteps(140);
        if (idx >= 1 && idx <= 5) pass++;
        if (idx < sim.sequentialSteps(140)) pass++;
        if (sim.sequentialSteps(999) == 16) pass++;
        int miss = sim.indexSteps(999);
        if (miss >= 1 && miss <= 5) pass++;
        if (sim.contains(80)) pass++;
        if (!sim.contains(85)) pass++;
        IndexSim empty = new IndexSim(new int[0]);
        if (empty.sequentialSteps(1) == 0) pass++;
        if (empty.indexSteps(1) == 0) pass++;
        if (!empty.contains(1)) pass++;
        return pass;
    }
}
`,
      reference: `class IndexSim {
    private final int[] keys;

    IndexSim(int[] sortedKeys) {
        this.keys = sortedKeys == null ? new int[0] : sortedKeys.clone();
    }

    int sequentialSteps(int target) {
        for (int i = 0; i < keys.length; i++) {
            if (keys[i] == target) return i + 1; // da so sanh i+1 phan tu
        }
        return keys.length; // duyet het
    }

    int indexSteps(int target) {
        if (keys.length == 0) return 0;
        int lo = 0, hi = keys.length - 1;
        int steps = 0;
        while (lo <= hi) {
            int mid = lo + (hi - lo) / 2;
            steps++; // mot lan so sanh voi phan tu giua
            if (keys[mid] == target) return steps;
            if (keys[mid] < target) lo = mid + 1;
            else hi = mid - 1;
        }
        return steps;
    }

    boolean contains(int target) {
        if (keys.length == 0) return false;
        int lo = 0, hi = keys.length - 1;
        while (lo <= hi) {
            int mid = lo + (hi - lo) / 2;
            if (keys[mid] == target) return true;
            if (keys[mid] < target) lo = mid + 1;
            else hi = mid - 1;
        }
        return false;
    }
}
`,
      hints: [
        'Quét tuần tự: duyệt từ trái sang phải, tăng bộ đếm mỗi lần so sánh; gặp đúng thì trả ngay, không gặp thì trả keys.length.',
        'Tìm nhị phân: giữ lo/hi, mỗi vòng lặp lấy mid, tăng bước, rồi thu hẹp nửa trái hoặc nửa phải tùy so sánh.',
        'Mảng rỗng là trường hợp biên: trả 0 bước và contains false.'
      ],
      explain: `Quét tuần tự phải kiểm tra lần lượt nên tệ nhất O(n). Tìm nhị phân trên dữ liệu đã sắp (mô phỏng cách B-tree chọn nhánh/entry) mỗi bước loại bỏ một nửa khoảng, nên chỉ O(log n) bước. Với 16 phần tử, quét tới phần tử thứ 14 mất 14 bước nhưng nhị phân chỉ vài bước.

Đây là mô phỏng ý tưởng "có thứ tự nên nhảy có mục tiêu", không phải mô phỏng đầy đủ B-tree trên đĩa (B-tree có fanout lớn, đọc theo page, leaf chain). Trong PostgreSQL thật, lợi ích còn đến từ việc đọc ít page và tận dụng shared buffers; planner sẽ chọn sequential scan nếu ước lượng phải đọc phần lớn bảng vì sequential I/O rẻ hơn nhiều random heap fetch.`
    }
  ],
  check: [
    {
      q: 'Trong B-tree của PostgreSQL, tại sao chiều cao cây thường rất thấp dù bảng có hàng tỷ hàng?',
      options: [
        'Vì mỗi node chỉ lưu một khóa như cây nhị phân',
        'Vì mỗi page 8KB chứa hàng trăm khóa nên fanout lớn',
        'Vì PostgreSQL nén toàn bộ index vào RAM',
        'Vì index không lưu TID'
      ],
      answer: 1,
      explain: 'Fanout lớn (nhiều khóa/con trỏ trong một page) làm chiều cao chỉ 3-4 tầng cho dữ liệu rất lớn, giảm số page phải đọc. Node một khóa là cây nhị phân, không phải B-tree trên đĩa.'
    },
    {
      q: 'Index-only scan có thể tránh đọc heap khi nào?',
      options: [
        'Luôn luôn, miễn là có index',
        'Khi index chứa đủ cột cần thiết và visibility map cho biết page all-visible',
        'Chỉ khi dùng partial index',
        'Khi bảng không có khóa chính'
      ],
      answer: 1,
      explain: 'Cần đủ cột trong index và trang heap phải all-visible theo visibility map; nếu không PostgreSQL vẫn phải kiểm tra heap để xác nhận tuple nhìn thấy theo MVCC.'
    },
    {
      q: 'Partial index {{CREATE INDEX ... WHERE status = \'PENDING\'}} có đặc điểm nào đúng?',
      options: [
        'Chứa mọi hàng của bảng nhưng sắp theo status',
        'Chỉ chứa hàng thỏa điều kiện, nên nhỏ và chọn lọc cao cho truy vấn có cùng điều kiện',
        'Tự động áp dụng cho mọi truy vấn bất kể WHERE',
        'Không bao giờ được planner sử dụng'
      ],
      answer: 1,
      explain: 'Partial index chỉ lập chỉ mục tập con hàng thỏa predicate, giúp index nhỏ và nhanh cho truy vấn có predicate tương thích; planner chỉ dùng khi điều kiện truy vấn bao hàm predicate của index.'
    },
    {
      q: 'Quét tuần tự (sequential scan) so với tra cứu trên cấu trúc có thứ tự thường khác nhau thế nào về số bước?',
      options: [
        'Quét tuần tự luôn ít bước hơn',
        'Tra cứu có thứ tự (như tìm nhị phân/B-tree) giảm số bước theo log n thay vì tuyến tính n',
        'Hai cách luôn bằng nhau',
        'Tra cứu có thứ tự phải đọc mọi phần tử'
      ],
      answer: 1,
      explain: 'Quét tuần tự kiểm tra lần lượt O(n); tra cứu trên dữ liệu có thứ tự loại bỏ dần khoảng tìm kiếm nên O(log n) bước. Trên bảng thật planner còn cân nhắc chi phí I/O.'
    }
  ],
  related: ['db-001', 'db-022', 'db-023', 'db-024'],
  tags: ['B-tree', 'index', 'covering-index', 'partial-index', 'index-only-scan', 'PostgreSQL']
},
{
  id: 'lesson-db-015',
  track: 'db',
  order: 15,
  title: 'Composite index, leftmost prefix và khi nào index không được dùng',
  level: 'senior',
  minutes: 30,
  goals: [
    'Hiểu composite index sắp theo thứ tự cột và quy tắc cột trái nhất (leftmost prefix)',
    'Chọn thứ tự cột theo equality, range, ORDER BY và độ chọn lọc',
    'Nhận biết các trường hợp index không được dùng: hàm trên cột, LIKE bắt đầu bằng ký tự đại diện, kiểu dữ liệu lệch',
    'Mô phỏng đếm bước tra cứu index theo prefix so với quét tuần tự bằng Java thuần'
  ],
  body: `**Tóm tắt:** Composite index (index nhiều cột, ví dụ {{(a, b, c)}}) sắp khóa theo từ điển: so cột {{a}} trước, bằng nhau mới so {{b}}. Quy tắc **leftmost prefix** (tiền tố trái nhất) nói rằng index chỉ hỗ trợ seek/range hiệu quả khi truy vấn lọc từ cột trái sang phải liên tục. Nhiều cách viết truy vấn vô tình phá khả năng dùng index: bọc cột trong hàm, dùng {{LIKE '%x'}} (ký tự đại diện {{%}} ở đầu), hoặc so sánh lệch kiểu dữ liệu khiến database phải ép kiểu ngầm.

### Composite index và leftmost prefix
Bài 12 đã đi sâu vào thiết kế composite index và chi phí ghi; bài này chỉ nhắc lại leftmost prefix ngắn gọn rồi tập trung vào **chẩn đoán khi index không được dùng**.

Hãy tưởng tượng danh bạ giấy sắp theo (Họ, Tên). Bạn tìm nhanh được mọi người họ "Nguyen" (cột trái), hoặc "Nguyen Van" (hai cột trái). Nhưng bạn không thể lật thẳng tới tất cả người tên "An" nếu không biết họ, vì tên nằm sau họ trong thứ tự sắp.

Index {{(tenant_id, status, created_at)}}:
- {{WHERE tenant_id = 7}}: dùng được (prefix 1 cột).
- {{WHERE tenant_id = 7 AND status = 'PENDING'}}: dùng được (2 cột).
- {{WHERE tenant_id = 7 AND status = 'PENDING' AND created_at >= '2026-01-01'}}: dùng được (3 cột, cột cuối là range).
- {{WHERE status = 'PENDING'}}: theo quy tắc cổ điển thì không seek theo index này vì thiếu cột trái {{tenant_id}}; một số database khác (MySQL 8.0.13+, Oracle, SQL Server) có skip scan nếu {{tenant_id}} ít giá trị phân biệt; PostgreSQL (tới 17) chưa hỗ trợ.
- {{WHERE tenant_id = 7 AND created_at >= '2026-01-01'}} (bỏ {{status}}): seek được theo {{tenant_id}} nhưng không thu hẹp tiếp theo {{created_at}} như một khóa liên tục; planner có thể quét mọi entry của tenant 7 rồi lọc {{created_at}}. Một số database khác có skip scan lặp qua từng giá trị phân biệt của {{status}} trong tenant 7 rồi seek theo {{created_at}}, nếu {{status}} ít giá trị phân biệt; PostgreSQL (tới 17) không hỗ trợ.

~~~text
Index (tenant_id, status, created_at) — các entry đã sắp:
(7, DONE,    2026-01-01)
(7, PENDING, 2026-01-02)  <- seek bat dau khi tenant_id=7,status=PENDING
(7, PENDING, 2026-01-10)
(7, PENDING, 2026-02-01)  <- range theo created_at di tiep lien tuc
(9, PENDING, 2026-01-03)
~~~

Quy tắc chọn thứ tự cột (thực dụng): (1) cột equality {{=}} đặt trước, (2) cột range/{{BETWEEN}}/{{ORDER BY}} đặt sau trong nhóm dùng được, (3) giữa các cột equality, thứ tự không làm index to hơn, nhưng quyết định truy vấn nào chỉ lọc một cột thì còn seek được; nếu có truy vấn chỉ {{WHERE tenant_id = ?}}, đặt cột selectivity cao (nhiều giá trị phân biệt) lên đầu để đọc ít entry hơn. Luôn đối chiếu với truy vấn thật và {{EXPLAIN (ANALYZE, BUFFERS)}}.

### Khi nào index không được dùng
Ngay cả khi có index đúng cột, planner (bộ lập kế hoạch truy vấn: thành phần quyết định đọc bảng/index theo cách nào) có thể không dùng hoặc chỉ dùng kém hiệu quả:

1. **Hàm/biểu thức trên cột được index.** Index lưu giá trị gốc của cột; nếu WHERE biến đổi cột thì không khớp khóa.
~~~sql
-- khong dung index tren created_at (neu khong co index bieu thuc)
WHERE date(created_at) = DATE '2026-01-10'
-- cach viet giu index: so sanh tren cot goc
WHERE created_at >= TIMESTAMP '2026-01-10 00:00:00'
  AND created_at <  TIMESTAMP '2026-01-11 00:00:00'
-- hoac tao expression index
CREATE INDEX idx_orders_created_date ON orders ((date(created_at)));
~~~

2. **{{LIKE '%abc'}} hoặc {{LIKE '%abc%'}}.** B-tree sắp theo tiền tố chuỗi; ký tự đại diện {{%}} ở đầu làm mất điểm bắt đầu cố định nên không seek được. {{LIKE 'abc%'}} (tiền tố cố định) có thể dùng B-tree (với collation/operator class phù hợp, ví dụ {{text_pattern_ops}} trong một số trường hợp). Tìm kiếm chứa chuỗi giữa thường cần GIN/GiST với pg_trgm.

3. **Kiểu dữ liệu lệch (implicit cast).** Ví dụ cột {{user_id}} kiểu {{bigint}} có index. Nếu viết {{WHERE user_id = '42'}} với một literal, PostgreSQL coi literal là kiểu chưa xác định và ép về {{bigint}}, index vẫn dùng được. Nhưng nếu tham số bind bị khai báo là {{text}} (ví dụ JDBC {{setString}}, hoặc {{WHERE user_id = $1}} với {{$1}} kiểu {{text}}), hoặc so sánh với {{numeric}}, PostgreSQL có thể phải ép kiểu **cột** thành {{user_id::text}} hoặc {{user_id::numeric}}; khi đó điều kiện là biểu thức trên cột và index không dùng. Cách an toàn: bind đúng kiểu cột ({{setLong}}), hoặc viết {{user_id = 42}}.

4. **Toán tử/điều kiện không hỗ trợ bởi operator class của index.** Operator class (bộ toán tử của một kiểu dữ liệu cho index, ví dụ cách so sánh {{text}}) quyết định toán tử nào dùng được; B-tree mặc định hỗ trợ {{=, <, <=, >, >=}}, các toán tử khác cần operator class phù hợp.

5. **Planner ước lượng trả về quá nhiều hàng.** Khi selectivity thấp (lọc ra phần lớn bảng), sequential scan + đọc tuần tự rẻ hơn index scan + nhiều random heap fetch; đây là lựa chọn có chủ đích.

~~~text
Bang tom tat nhanh:
| Tinh huong                     | Index thuong dung duoc? | Cach xu ly                         |
|--------------------------------|-------------------------|------------------------------------|
| WHERE col = 1                  | Co                      | giu nguyen                         |
| WHERE lower(col) = 'a'         | Khong (cot bi boc ham)  | expression index hoac so sanh goc  |
| WHERE col LIKE 'abc%'          | Co (tien to co dinh)    | giu nguyen                         |
| WHERE col LIKE '%abc'          | Khong                   | pg_trgm/GIN hoac thiet ke khac     |
| WHERE col = $1, $1 la text     | Co the mat              | bind setLong hoac viet col = 1     |
~~~

### Liên hệ phỏng vấn
- "Leftmost prefix là gì?" → composite index {{(a,b,c)}} chỉ hỗ trợ điều kiện bắt đầu từ {{a}} liên tục; thiếu {{a}} thì không seek theo index đó.
- "Vì sao {{WHERE date(created_at)=...}} không dùng index trên {{created_at}}?" → hàm biến đổi cột thành biểu thức khác khóa index; viết lại thành range trên cột gốc hoặc tạo expression index.
- "LIKE '%x' vì sao chậm?" → wildcard đầu chuỗi phá tiền tố cố định nên B-tree không seek; cần chiến lược tìm kiếm khác (trigram/full-text) tùy bài toán.

> Senior tip: khi nghi index "không ăn", đọc {{EXPLAIN (ANALYZE, BUFFERS)}} để xem node thực tế (Seq Scan/Index Scan), kiểm tra kiểu tham số ở driver/ORM, và kiểm tra có hàm/cast ngầm trên cột hay không.
`,
  exercises: [
    {
      title: 'Mô phỏng leftmost prefix: đếm bước tra cứu index và quét tuần tự',
      prompt: `Mô phỏng bảng {{orders}} có các cột số nguyên {{tenantId}} và {{createdDay}} (ngày dạng số, ví dụ 20260110). Dữ liệu đã được sắp theo (tenantId, createdDay) giống một composite index.

Cho mảng song song {{tenants}} và {{days}} cùng độ dài, đã sắp tăng theo (tenants[i], days[i]). Cài {{PrefixIndexSim}}:
- Constructor {{PrefixIndexSim(int[] tenants, int[] days)}}.
- {{int scanAllSteps(int tenantId, int dayFrom, int dayTo)}}: quét tuần tự toàn bộ mảng, mỗi hàng kiểm tra tính là 1 bước; trả về tổng số hàng đã kiểm tra (luôn bằng độ dài mảng, vì phải duyệt hết để chắc chắn).
- {{int prefixIndexSteps(int tenantId, int dayFrom, int dayTo)}}: mô phỏng tra cứu dùng composite index (tenantId, createdDay). Bước 1: tìm nhị phân vị trí bắt đầu của tenantId (mỗi lần so sánh phần tử giữa với tenantId tính 1 bước). Bước 2: từ vị trí đầu của tenantId, duyệt tuần tự trong phạm vi tenantId và đếm mỗi hàng xét là 1 bước, nhưng **dừng sớm** khi {{days[i] > dayTo}} (vì trong cùng tenant dữ liệu đã sắp theo day). Nếu tenantId không tồn tại, chỉ trả về số bước tìm nhị phân. Trả về tổng bước (bước tìm nhị phân + số hàng đã xét trong phạm vi).
- {{int countMatches(int tenantId, int dayFrom, int dayTo)}}: trả về số hàng thỏa {{tenantId}} đúng và {{dayFrom <= day <= dayTo}}.

Gợi ý: tìm nhị phân cận dưới (lower bound) của tenantId.`,
      starter: `class PrefixIndexSim {
    private final int[] tenants;
    private final int[] days;

    PrefixIndexSim(int[] tenants, int[] days) {
        this.tenants = tenants == null ? new int[0] : tenants.clone();
        this.days = days == null ? new int[0] : days.clone();
    }

    int scanAllSteps(int tenantId, int dayFrom, int dayTo) {
        throw new UnsupportedOperationException("TODO");
    }

    int prefixIndexSteps(int tenantId, int dayFrom, int dayTo) {
        throw new UnsupportedOperationException("TODO");
    }

    int countMatches(int tenantId, int dayFrom, int dayTo) {
        throw new UnsupportedOperationException("TODO");
    }
}
`,
      tests: `public class Main {
    static void check(String name, boolean cond) {
        if (cond) System.out.println("PASS " + name);
        else System.out.println("FAIL " + name);
    }
    public static void main(String[] args) {
        int[] t = {1,1,1,1, 2,2,2, 3,3,3,3,3};
        int[] d = {20260101,20260105,20260110,20260120, 20260102,20260107,20260115, 20260101,20260103,20260105,20260107,20260109};
        PrefixIndexSim sim = new PrefixIndexSim(t, d);

        check("scan all is full length", sim.scanAllSteps(1, 20260103, 20260112) == 12);

        int idx = sim.prefixIndexSteps(1, 20260103, 20260112);
        check("prefix index fewer steps than scan", idx < sim.scanAllSteps(1, 20260103, 20260112));

        check("count matches tenant1 range", sim.countMatches(1, 20260103, 20260112) == 2);

        check("count matches tenant3 range", sim.countMatches(3, 20260104, 20260108) == 2);

        check("tenant not found uses only search steps", sim.prefixIndexSteps(5, 20260101, 20260131) <= 4 && sim.countMatches(5, 20260101, 20260131) == 0);

        PrefixIndexSim sim2 = new PrefixIndexSim(new int[]{7,7,7}, new int[]{1,2,3});
        check("scan all small", sim2.scanAllSteps(7,1,3) == 3);
        check("count all in range", sim2.countMatches(7,1,3) == 3);

        PrefixIndexSim empty = new PrefixIndexSim(new int[0], new int[0]);
        check("empty scan", empty.scanAllSteps(1,1,2) == 0);
        check("empty index", empty.prefixIndexSteps(1,1,2) == 0);

        System.out.println("RESULT " + (countPass()) + "/9");
    }
    static int countPass() {
        int pass = 0;
        int[] t = {1,1,1,1, 2,2,2, 3,3,3,3,3};
        int[] d = {20260101,20260105,20260110,20260120, 20260102,20260107,20260115, 20260101,20260103,20260105,20260107,20260109};
        PrefixIndexSim sim = new PrefixIndexSim(t, d);
        if (sim.scanAllSteps(1, 20260103, 20260112) == 12) pass++;
        if (sim.prefixIndexSteps(1, 20260103, 20260112) < sim.scanAllSteps(1, 20260103, 20260112)) pass++;
        if (sim.countMatches(1, 20260103, 20260112) == 2) pass++;
        if (sim.countMatches(3, 20260104, 20260108) == 2) pass++;
        if (sim.prefixIndexSteps(5, 20260101, 20260131) <= 4 && sim.countMatches(5, 20260101, 20260131) == 0) pass++;
        PrefixIndexSim sim2 = new PrefixIndexSim(new int[]{7,7,7}, new int[]{1,2,3});
        if (sim2.scanAllSteps(7,1,3) == 3) pass++;
        if (sim2.countMatches(7,1,3) == 3) pass++;
        PrefixIndexSim empty = new PrefixIndexSim(new int[0], new int[0]);
        if (empty.scanAllSteps(1,1,2) == 0) pass++;
        if (empty.prefixIndexSteps(1,1,2) == 0) pass++;
        return pass;
    }
}
`,
      reference: `class PrefixIndexSim {
    private final int[] tenants;
    private final int[] days;

    PrefixIndexSim(int[] tenants, int[] days) {
        this.tenants = tenants == null ? new int[0] : tenants.clone();
        this.days = days == null ? new int[0] : days.clone();
    }

    int scanAllSteps(int tenantId, int dayFrom, int dayTo) {
        // quet tuan tu toan bo: luon kiem tra moi hang
        return tenants.length;
    }

    int prefixIndexSteps(int tenantId, int dayFrom, int dayTo) {
        if (tenants.length == 0) return 0;
        // buoc 1: tim nhi phan lower bound cua tenantId
        int lo = 0, hi = tenants.length;
        int steps = 0;
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            steps++; // so sanh tenants[mid] voi tenantId
            if (tenants[mid] < tenantId) lo = mid + 1;
            else hi = mid;
        }
        int i = lo;
        // buoc 2: duyet trong pham vi tenantId, dung som khi day > dayTo
        while (i < tenants.length && tenants[i] == tenantId) {
            steps++; // xet mot hang trong pham vi tenant
            if (days[i] > dayTo) break; // vi da sap theo day trong cung tenant
            i++;
        }
        return steps;
    }

    int countMatches(int tenantId, int dayFrom, int dayTo) {
        int count = 0;
        for (int i = 0; i < tenants.length; i++) {
            if (tenants[i] == tenantId && days[i] >= dayFrom && days[i] <= dayTo) count++;
        }
        return count;
    }
}
`,
      hints: [
        'scanAllSteps luôn trả về độ dài mảng vì quét tuần tự phải đi hết bảng để không bỏ sót.',
        'prefixIndexSteps: dùng tìm nhị phân lower bound để nhảy tới tenantId; mỗi lần so sánh ở giữa tăng 1 bước.',
        'Sau khi vào đúng tenant, duyệt tăng dần theo day và dừng sớm khi days[i] > dayTo (tận dụng thứ tự cột thứ hai trong prefix).'
      ],
      explain: `Composite index (tenantId, createdDay) cho phép "nhảy" tới đúng tenant (nhờ cột trái) rồi đi tuần tự trong khoảng day (nhờ cột phải đã sắp trong cùng tenant). Vì vậy số bước thường nhỏ hơn nhiều so với quét toàn bộ. Nếu thiếu cột trái (ví dụ chỉ lọc theo day), bạn không thể tìm nhị phân theo tenant và phải xét rộng hơn — đây chính là ý nghĩa leftmost prefix.

Mô phỏng này đếm bước logic, không đo I/O thật. Trong PostgreSQL, lợi ích thực tế là đọc ít page index/heap hơn; nhưng nếu range trả về quá nhiều hàng, planner vẫn có thể chọn sequential scan.`
    }
  ],
  check: [
    {
      q: 'Với composite index {{(tenant_id, status, created_at)}}, truy vấn nào tận dụng được tốt nhất theo leftmost prefix?',
      options: [
        'WHERE status = \'PENDING\'',
        'WHERE tenant_id = 7 AND status = \'PENDING\' AND created_at >= \'2026-01-01\'',
        'WHERE created_at >= \'2026-01-01\'',
        'WHERE status = \'PENDING\' AND created_at >= \'2026-01-01\''
      ],
      answer: 1,
      explain: 'Truy vấn lọc liên tục từ cột trái (tenant_id, status) rồi range ở cột tiếp theo (created_at) nên dùng được prefix. Thiếu tenant_id ở đầu làm mất khả năng seek theo index này.'
    },
    {
      q: 'Vì sao {{WHERE date(created_at) = DATE \'2026-01-10\'}} thường không dùng index B-tree trên cột {{created_at}}?',
      options: [
        'Vì PostgreSQL không hỗ trợ so sánh ngày',
        'Vì hàm bọc lên cột làm giá trị so sánh khác khóa đã lưu trong index',
        'Vì B-tree chỉ dùng cho số nguyên',
        'Vì index tự động bị vô hiệu sau một ngày'
      ],
      answer: 1,
      explain: 'Index lưu giá trị gốc của created_at; áp dụng hàm lên cột tạo biểu thức không khớp khóa index (trừ khi có expression index). Viết lại thành range trên cột gốc để dùng index.'
    },
    {
      q: 'Điều kiện {{LIKE \'%abc\'}} khó tận dụng B-tree index thông thường vì sao?',
      options: [
        'Vì chuỗi quá dài',
        'Vì ký tự đại diện % ở đầu làm không có tiền tố cố định để seek trong cây đã sắp theo tiền tố',
        'Vì LIKE chỉ hoạt động với số',
        'Vì PostgreSQL cấm LIKE'
      ],
      answer: 1,
      explain: 'B-tree sắp theo thứ tự giá trị/tiền tố; khi mẫu bắt đầu bằng % thì mọi giá trị đều có thể khớp nên không xác định được điểm bắt đầu, thường dẫn tới scan.'
    },
    {
      q: 'So sánh lệch kiểu dữ liệu (ví dụ cột bigint với tham số bind kiểu text) có thể khiến index không được dùng khi nào?',
      options: [
        'Khi database phải ép kiểu trên chính cột được index, biến điều kiện thành biểu thức trên cột',
        'Khi bảng có quá ít hàng',
        'Khi dùng khóa chính',
        'Khi chạy trong transaction'
      ],
      answer: 1,
      explain: 'Literal chuỗi thường được PostgreSQL ép về kiểu cột nên index vẫn dùng; nhưng nếu tham số bind được khai báo là text (hoặc so sánh với numeric), việc ép kiểu có thể áp dụng lên cột và điều kiện thành biểu thức trên cột, không khớp khóa index. Cách an toàn là truyền tham số đúng kiểu với cột.'
    }
  ],
  related: ['db-001', 'db-003', 'db-022', 'db-023'],
  tags: ['composite-index', 'leftmost-prefix', 'B-tree', 'LIKE', 'index', 'PostgreSQL']
},
{
  id: 'lesson-db-016',
  track: 'db',
  order: 16,
  title: 'Cache-aside từ gốc: TTL, LRU eviction và vì sao cache phải có giới hạn',
  level: 'senior',
  minutes: 35,
  goals: [
    'Giải thích được cache-aside: đọc cache trước, miss thì đọc nguồn chính rồi ghi lại cache',
    'Cài cache có TTL và kiểm tra hết hạn đúng tại biên bằng một đồng hồ giả (fake clock)',
    'Cài giới hạn kích thước bằng LRU eviction và giải thích vì sao cache không giới hạn là rò rỉ bộ nhớ',
    'Phân biệt penetration, avalanche, stampede và biết công cụ chống từng loại'
  ],
  body: `**Tóm tắt:** Cache là bản sao dữ liệu đặt gần nơi đọc để khỏi hỏi nguồn chính (database) mỗi lần. Pattern phổ biến nhất là **cache-aside**: đọc cache trước, nếu miss thì đọc DB, rồi ghi lại vào cache kèm **TTL** (thời gian sống). Nhưng cache chỉ an toàn khi có hai thứ đi kèm: **giới hạn kích thước** (đầy thì đuổi bớt, thường theo LRU) và **hạn sử dụng** (hết hạn thì nạp lại). Thiếu một trong hai, cache biến thành rò rỉ bộ nhớ hoặc dữ liệu cũ vĩnh viễn.

### Cache là gì và vì sao backend nào cũng có nó
**Cache** (bộ nhớ đệm) là một bản sao dữ liệu đã đọc một lần, đặt ở nơi đọc nhanh hơn nguồn chính. Ví dụ đời thường: quán phở dán bảng giá ở quầy (cache) thay vì mỗi lần khách hỏi lại chạy vào kho xem bảng giá gốc (database). Bảng dán giúp trả lời trong 1 giây thay vì 30 giây, đổi lại nếu quán đổi giá mà chưa thay bảng thì khách thấy giá cũ — đó chính là **staleness** (dữ liệu cũ).

Các thuật ngữ cần nắm ngay từ đầu:

- **Nguồn chính (source of truth)**: nơi dữ liệu đúng nhất, thường là PostgreSQL. Cache chỉ là bản sao, mất cache không mất dữ liệu.
- **Cache hit** (trúng cache): tìm thấy key trong cache, không cần chạm DB. **Cache miss** (trượt): không tìm thấy, phải đọc DB.
- **Hit rate** (tỉ lệ trúng): phần trăm request tìm thấy trong cache. Đây là chỉ số quan trọng nhất để biết cache có đáng tiền không.
- **Key**: định danh một mục trong cache, ví dụ {{product:42}}. Thiết kế key sai (thiếu tenant, thiếu phiên bản) là nguồn gốc của những bug dữ liệu chéo khách hàng.

Số liệu để cảm nhận độ chênh: một lệnh {{GET}} tới Redis trong cùng datacenter mất khoảng 0,3–1 ms; một truy vấn Postgres đơn giản theo primary key mất 1–3 ms, còn truy vấn join vài bảng có thể 20–100 ms. Với dịch vụ 6.000 request/giây và hit rate 96%, DB chỉ nhận 240 truy vấn/giây thay vì 6.000 — giảm 25 lần tải. Đó là lý do cache xuất hiện trong gần như mọi hệ thống đọc nhiều.

> Cache không miễn phí: bạn thêm một tầng phải vận hành, phải theo dõi, và phải chấp nhận dữ liệu có thể cũ trong khoảng TTL. Câu hỏi phỏng vấn hay gặp không phải "có nên cache không" mà là "dữ liệu này chịu được cũ bao lâu".

### Cache-aside: luồng chuẩn và từng bước
**Cache-aside** (còn gọi **lazy loading**, nạp lười) nghĩa là ứng dụng tự quản lý cache, Redis không tự đi đọc DB. Luồng đọc gồm 5 bước:

~~~seq
title: Đọc theo cache-aside (TTL 600 giây)
actors: API | Redis | Postgres
API -> Redis: GET product:42
Redis --> API: miss (không có key)
API -> Postgres: SELECT id, name, price
Postgres --> API: 1 dòng
API -> Redis: SET product:42 json EX 600
API -> API: trả kết quả cho client
~~~

1. Ứng dụng hỏi cache trước bằng key đã thống nhất.
2. Miss thì ứng dụng đọc nguồn chính.
3. Ghi kết quả vào cache **kèm TTL** để lần sau trúng.
4. Trả kết quả cho client.
5. Lần đọc kế tiếp lặp lại từ bước 1 và dừng ở cache.

Vì sao nạp theo nhu cầu chứ không nạp sẵn tất cả? Vì dữ liệu ít dùng sẽ chiếm chỗ của dữ liệu nóng. Cache hiệu quả nhờ quy luật 80/20: khoảng 20% key phục vụ 80% request. Nạp sẵn toàn bộ (cache warm) chỉ nên làm cho một danh sách nhỏ đã biết chắc là nóng, và phải làm từ từ để không dội DB.

Ba pattern hay bị đem ra so sánh:

| Pattern | Ai nạp cache | Ghi dữ liệu | Phù hợp khi |
|---|---|---|---|
| Cache-aside | Ứng dụng (đọc miss rồi ghi) | Ứng dụng ghi DB, xoá key | Phổ biến nhất, kiểm soát rõ ràng |
| Read-through | Cache engine tự gọi loader | Ứng dụng ghi DB | Muốn code đọc gọn, chấp nhận phụ thuộc engine |
| Write-through | Ứng dụng/engine | Ghi cache và DB cùng lúc | Cần đọc lại ngay sau ghi, ghi không quá nhiều |
| Write-behind | Ứng dụng ghi cache | Cache ghi DB sau, bất đồng bộ | Ghi rất nhiều, chấp nhận mất vài giây dữ liệu |

**Bẫy kinh điển khi ghi:** đừng {{SET}} đè giá trị mới vào cache ngay sau khi cập nhật DB. Hãy **xoá key** (invalidate) để lần đọc sau nạp lại. Lý do: hai request ghi có thể đua nhau. T1 đọc DB được giá trị cũ 10, T2 cập nhật DB thành 20 rồi xoá cache, sau đó T1 mới {{SET}} 10 vào cache — cache giữ giá trị cũ cho tới khi TTL hết. Xoá key sau khi ghi DB thu hẹp cửa sổ sai, và TTL là chốt an toàn cuối cùng.

### TTL: hạn sử dụng của bản cache
**TTL** (time to live, thời gian sống) là khoảng thời gian một entry được coi là còn giá trị. Ví dụ {{SET product:42 ... EX 600}} nghĩa là sau 600 giây key tự hết hạn. Trong cache tự viết, mỗi entry phải lưu **thời điểm hết hạn** ({{expiresAt = now + ttl}}), không phải một TTL chung cho cả cache, vì các key được ghi ở những thời điểm khác nhau.

Điểm dễ hiểu sai: hết hạn **không** có nghĩa là bộ nhớ được giải phóng ngay.

- **Lazy expiration** (hết hạn lười): khi có ai đọc key, mới so {{now}} với {{expiresAt}}; nếu quá hạn thì coi như miss và gỡ entry. Cách này rẻ nhưng key hết hạn mà không ai đọc vẫn nằm trong bộ nhớ.
- **Active expiration** (dọn nền): tiến trình nền lấy mẫu ngẫu nhiên các key có TTL để gỡ. Redis chạy chu kỳ dọn khoảng 10 lần/giây, mỗi lần lấy mẫu một ít key có TTL; nếu tỉ lệ hết hạn cao thì lặp lại ngay trong chu kỳ đó. Nhờ vậy bộ nhớ được thu hồi dần dù không ai đọc.

TTL bao lâu là câu hỏi về nghiệp vụ, không phải về kỹ thuật: giá sản phẩm có thể cũ 60 giây, nhưng số dư ví thì gần như không được cũ. Hai cách chọn:

- TTL dài: hit rate cao, ít tải DB, nhưng dữ liệu cũ lâu hơn.
- TTL ngắn: dữ liệu tươi, nhưng miss nhiều, DB chịu tải cao hơn và stampede xảy ra thường xuyên hơn.

> **Jitter** (làm lệch ngẫu nhiên): đừng đặt TTL giống hệt nhau cho mọi key. Nếu 1,5 triệu key được nạp cùng lúc lúc 09:00 với TTL 600 giây, thì 09:10 cả 1,5 triệu key hết hạn trong vài chục giây — DB nhận một cơn sóng. Đặt TTL = 600 giây cộng/trừ ngẫu nhiên ±10% (540–660 giây) sẽ rải các lần hết hạn ra.

Ba sự cố thường bị gọi lẫn tên nhau:

| Sự cố | Cơ chế | Cách chống |
|---|---|---|
| Penetration (xuyên thủng) | Key không tồn tại, request nào cũng miss rồi đọc DB | Cache cả kết quả rỗng (negative caching) với TTL ngắn 30–60 giây; validate đầu vào |
| Avalanche (tuyết lở) | Rất nhiều key hết hạn cùng lúc | Jitter TTL, cache nhiều tầng, nạp ấm từ từ |
| Stampede (giẫm đạp) | Một key nóng hết hạn, hàng nghìn request cùng nạp | Single-flight theo key (bài tiếp theo) |

### Giới hạn kích thước và LRU eviction
Cache **không được** phình vô hạn. Một triệu entry, mỗi entry 2 KB là 2 GB RAM; nếu key chứa cả JSON 50 KB thì chỉ 40.000 entry đã là 2 GB. Không có giới hạn thì kết cục là {{OutOfMemoryError}} ở cache trong JVM, hoặc Redis trả lỗi ghi khi chạm {{maxmemory}}.

**Eviction** (đuổi bớt) là việc chọn một entry để xoá khi cache đầy. Chính sách phổ biến nhất là **LRU** (least recently used, lâu không dùng nhất). Hình dung bàn làm việc chỉ để được 3 cuốn sách: mỗi lần bạn lấy một cuốn ra đọc, cuốn đó thành "vừa dùng"; khi có cuốn thứ tư, bạn cất cuốn nằm lâu nhất dưới đáy chồng.

Cài LRU đúng trong O(1) cần hai cấu trúc phối hợp:

- **HashMap**: tra key ra entry trong O(1).
- **Danh sách liên kết đôi** theo thứ tự sử dụng: chạm vào entry thì gỡ nó ra và gắn lên đầu (mới nhất); đầy thì cắt node ở cuối.

~~~text
capacity 3, thứ tự từ mới nhất sang cũ nhất
[c] <-> [a] <-> [b]        get("a")  ->  [a] <-> [c] <-> [b]
put("d")                   đầy, đuổi b (cũ nhất) -> [d] <-> [a] <-> [c]
~~~

Java có sẵn một cài LRU gọn trong một thread:

~~~java
// accessOrder = true: mỗi get/put đưa entry về cuối danh sách (mới dùng nhất)
Map<String, String> lru = new LinkedHashMap<>(16, 0.75f, true) {
    @Override
    protected boolean removeEldestEntry(Map.Entry<String, String> eldest) {
        return size() > 3;   // vượt 3 entry thì xoá entry lâu không dùng nhất
    }
};
lru.put("a", "1");
lru.put("b", "2");
lru.put("c", "3");
lru.get("a");                 // a thành mới nhất; b thành cũ nhất
lru.put("d", "4");            // đuổi b, còn a, c, d
~~~

Redis không dùng LRU chính xác. Lý do: LRU chính xác cần thêm hai con trỏ mỗi key và phải sửa một danh sách toàn cục dưới khoá, làm mất tính song song. Redis dùng **approximated LRU** (LRU xấp xỉ): mỗi lần cần đuổi, nó lấy mẫu ngẫu nhiên {{maxmemory-samples}} key (mặc định 5), rồi đuổi key có lần dùng gần nhất cũ nhất trong mẫu. Mẫu càng lớn càng giống LRU thật nhưng tốn CPU; đây là trade-off có chủ đích.

Các chính sách thường gặp:

| Chính sách | Đuổi entry nào | Phù hợp khi | Bẫy |
|---|---|---|---|
| {{allkeys-lru}} | Mọi key, cái lâu dùng nhất | Cache thuần túy | Dữ liệu nóng có thể bị đuổi nếu traffic lệch |
| {{volatile-lru}} | Chỉ key **có TTL** | Vừa cache vừa lưu dữ liệu lâu dài | Key không TTL sẽ không bị đuổi, đầy bộ nhớ thì ghi lỗi |
| {{allkeys-lfu}} | Key ít dùng nhất theo tần suất | Hot key ổn định, ít bị quét | Key mới chưa kịp nổi tiếng dễ bị đuổi |
| {{allkeys-random}} | Ngẫu nhiên | Mọi key đều ngang giá trị | Hit rate kém hơn LRU/LFU |
| {{noeviction}} | Không đuổi, trả lỗi khi đầy | Không được phép mất key | Client phải chịu lỗi ghi |

**LRU hay LFU?** LRU bị "lạm dụng" bởi các lần quét dữ liệu một lần: một job đọc 200.000 key không lặp lại đẩy hết key nóng ra khỏi cache, hit rate sụp sau mỗi lần chạy. LFU đếm tần suất nên key nóng được bảo vệ tốt hơn. Ngược lại, LFU phản ứng chậm khi món hàng đang hot đổi sang món khác.

> Bẫy production: chọn {{volatile-lru}} nhưng quên đặt TTL cho hàng loạt key. Khi bộ nhớ đầy, Redis không tìm được key nào để đuổi, và với chính sách này Redis trả lỗi {{OOM command not allowed when used memory > maxmemory}} cho mọi lệnh ghi. Kiểm tra bằng {{INFO memory}} và {{CONFIG GET maxmemory-policy}}.

> Bẫy khi tự viết: {{LinkedHashMap}} với {{accessOrder = true}} không thread-safe, vì {{get()}} cũng sửa cấu trúc bên trong. Dùng nó trong nhiều thread mà không có khoá sẽ gây {{ConcurrentModificationException}} hoặc dữ liệu sai. Trên production hãy dùng thư viện đã kiểm chứng (Caffeine, Guava Cache) hoặc ConcurrentHashMap kết hợp khoá/ghi bất biến; bài tập của bài này mô phỏng đơn luồng để nhìn rõ cơ chế.

### Ví dụ đời thực
Catalog service của một sàn thương mại điện tử phục vụ 6.000 request/giây lúc cao điểm, cache 1,5 triệu sản phẩm trong Redis với TTL 600 giây, hit rate 96%, DB nhận khoảng 240 truy vấn/giây.

**Triệu chứng:** sau một lần deploy, cứ 10 phút lại có 60–90 giây DB CPU lên 92%, p99 API từ 120 ms nhảy lên 1,4 giây, hit rate tụt còn 70% trong đúng khoảng đó.

**Điều tra:** cả 1,5 triệu key được nạp trong lúc nạp ấm lúc 08:55 với cùng TTL 600, nên chúng hết hạn gần như đồng thời lúc 09:05. Mỗi đợt hết hạn, khoảng 1.500 request/giây cùng miss (xem {{INFO stats}} có {{keyspace_misses}} tăng vọt theo chu kỳ 10 phút).

**Xử lý:** (1) TTL = 600 giây cộng ngẫu nhiên 10% để rải hết hạn; (2) thêm single-flight theo key để mỗi key chỉ một truy vấn DB; (3) nạp ấm thành nhiều đợt nhỏ thay vì một lần.

**Kết quả đo được:** đỉnh truy vấn DB giảm từ khoảng 1.500 xuống 260/giây, p99 về 180 ms, hit rate ổn định 95–96%.

### Liên hệ phỏng vấn
- **"Cache-aside là gì? Khác read-through và write-through chỗ nào?"** → Trả lời đúng vai trò người nạp: cache-aside để ứng dụng tự nạp/set/xoá; read-through để cache engine gọi loader; write-through ghi cả cache và DB; write-behind ghi DB sau. Nêu được khi nào chọn cái nào.
- **"TTL nên đặt bao lâu?"** → Không có con số chung; quyết định theo mức cũ chấp nhận được của dữ liệu, hit rate đo được và tần suất stampede. Luôn thêm jitter.
- **"Vì sao cập nhật DB xong nên xoá cache thay vì set lại giá trị?"** → Hai writer đua nhau có thể ghi lại giá trị cũ; xoá + TTL là chốt an toàn. Có thể nêu thêm delay double delete hoặc version trong key.
- **"Cài LRU thế nào? Redis LRU có chính xác không?"** → HashMap + doubly linked list cho O(1); Redis dùng approximated LRU lấy mẫu vì chính xác quá tốn.
- **"Hết cache thì sao?"** → Hệ thống vẫn đúng (cache không phải nguồn chính), nhưng tải DB tăng đột ngột; cần giới hạn tốc độ, circuit breaker, và chấp nhận giảm chất lượng hoặc trả lỗi có kiểm soát.

> Senior tip: mỗi cache production cần ba con số được theo dõi liên tục: hit rate, số key bị eviction mỗi phút, và p99 thời gian đọc DB. Khi hit rate giảm mà traffic không đổi, hãy nghi ngay eviction (cache quá nhỏ) hoặc TTL quá ngắn, chứ không phải "Redis chậm".
`,
  exercises: [
    {
      title: 'TtlLruCache: TTL bằng đồng hồ giả và đuổi LRU khi vượt sức chứa',
      prompt: `Cài {{TtlLruCache<K, V>}} — một cache đơn luồng có TTL và giới hạn số entry, dùng **đồng hồ giả** {{LongSupplier clock}} trả về mili giây (test tự bơm thời gian nên kết quả xác định, không phụ thuộc đồng hồ thật).

Chữ ký và ngữ nghĩa:
- {{TtlLruCache(int capacity, long ttlMillis, LongSupplier clock)}}: sức chứa tối đa {{capacity}} entry, mỗi entry sống {{ttlMillis}} mili giây tính từ lần ghi.
- {{void put(K key, V value)}}: lưu value với hạn {{clock.getAsLong() + ttlMillis}}. Nếu key đã có thì thay giá trị và **đặt lại hạn**. Coi put là một lần dùng (mới nhất).
- {{V get(K key)}}: nếu key có và {{now < expiresAt}} trả value và đánh dấu vừa dùng. Nếu đã hết hạn ({{now >= expiresAt}}) thì gỡ entry và trả {{null}}.
- {{int size()}}: số entry đang có trong map. Entry đã hết hạn nhưng chưa bị đọc vẫn được tính — đúng như cache thật chỉ dọn khi đọc (lazy expiration) hoặc khi có chu kỳ dọn nền.
- Khi số entry vượt {{capacity}}, đuổi entry **lâu nhất không được dùng** (LRU); cả {{get}} và {{put}} đều tính là dùng.

Giá trị không null, key không null. Gợi ý: {{LinkedHashMap}} có {{accessOrder = true}} cộng {{removeEldestEntry}}.`,
      starter: `class TtlLruCache<K, V> {
    private final long ttlMillis;
    private final LongSupplier clock;

    TtlLruCache(int capacity, long ttlMillis, LongSupplier clock) {
        this.ttlMillis = ttlMillis;
        this.clock = clock;
    }

    V get(K key) {
        throw new UnsupportedOperationException("TODO");
    }

    void put(K key, V value) {
        throw new UnsupportedOperationException("TODO");
    }

    int size() {
        throw new UnsupportedOperationException("TODO");
    }
}
`,
      tests: `public class Main {
    static int p = 0, t = 0;
    static void c(String name, Runnable r) {
        t++;
        try { r.run(); p++; System.out.println("PASS " + name); }
        catch (Throwable e) { System.out.println("FAIL " + name + ": " + e); }
    }
    static void eq(Object expected, Object actual) {
        if (!Objects.equals(expected, actual)) throw new AssertionError("expected " + expected + " but got " + actual);
    }

    public static void main(String[] args) {
        c("hit khi còn hạn", () -> {
            AtomicLong now = new AtomicLong(1_000);
            TtlLruCache<String, String> cache = new TtlLruCache<>(3, 1_000, now::get);
            cache.put("k", "v1");
            now.set(1_999);                    // còn 1ms nữa mới hết hạn
            eq("v1", cache.get("k"));
            eq(1, cache.size());
        });

        c("hết hạn đúng biên và bị gỡ", () -> {
            AtomicLong now = new AtomicLong(0);
            TtlLruCache<String, String> cache = new TtlLruCache<>(3, 1_000, now::get);
            cache.put("k", "v1");
            now.set(1_000);                    // now == expiresAt -> hết hạn
            eq(null, cache.get("k"));
            eq(0, cache.size());
        });

        c("put lại đặt lại hạn", () -> {
            AtomicLong now = new AtomicLong(0);
            TtlLruCache<String, String> cache = new TtlLruCache<>(2, 1_000, now::get);
            cache.put("k", "v1");              // hạn 1000
            now.set(600);
            cache.put("k", "v2");              // hạn mới 1600
            now.set(1_500);
            eq("v2", cache.get("k"));
            now.set(1_600);
            eq(null, cache.get("k"));
        });

        c("LRU đuổi key lâu không dùng", () -> {
            AtomicLong now = new AtomicLong(0);
            TtlLruCache<String, Integer> cache = new TtlLruCache<>(2, 60_000, now::get);
            cache.put("a", 1);
            cache.put("b", 2);
            cache.get("a");                    // a mới dùng -> b là cũ nhất
            cache.put("c", 3);                 // vượt capacity -> đuổi b
            eq(null, cache.get("b"));
            eq(1, cache.get("a"));
            eq(3, cache.get("c"));
            eq(2, cache.size());
        });

        c("put lại cũng tính là dùng", () -> {
            AtomicLong now = new AtomicLong(0);
            TtlLruCache<String, Integer> cache = new TtlLruCache<>(2, 60_000, now::get);
            cache.put("a", 1);
            cache.put("b", 2);
            cache.put("a", 10);                // a mới dùng -> b bị đuổi khi thêm c
            cache.put("c", 3);
            eq(null, cache.get("b"));
            eq(10, cache.get("a"));
            eq(3, cache.get("c"));
        });

        System.out.println("RESULT " + p + "/" + t);
    }
}
`,
      reference: `class TtlLruCache<K, V> {
    private static final class Entry<V> {
        final V value;
        final long expiresAt;
        Entry(V value, long expiresAt) { this.value = value; this.expiresAt = expiresAt; }
    }

    private final long ttlMillis;
    private final LongSupplier clock;
    private final LinkedHashMap<K, Entry<V>> map;

    TtlLruCache(int capacity, long ttlMillis, LongSupplier clock) {
        this.ttlMillis = ttlMillis;
        this.clock = clock;
        // accessOrder = true: get/put đưa entry về cuối danh sách = mới dùng nhất
        this.map = new LinkedHashMap<K, Entry<V>>(16, 0.75f, true) {
            @Override
            protected boolean removeEldestEntry(Map.Entry<K, Entry<V>> eldest) {
                return size() > capacity;   // vượt sức chứa thì đuổi entry cũ nhất
            }
        };
    }

    V get(K key) {
        Entry<V> e = map.get(key);          // get cũng làm entry thành mới nhất
        if (e == null) return null;
        if (clock.getAsLong() >= e.expiresAt) {
            map.remove(key);                // hết hạn: gỡ ngay (lazy expiration)
            return null;
        }
        return e.value;
    }

    void put(K key, V value) {
        map.put(key, new Entry<>(value, clock.getAsLong() + ttlMillis));
    }

    int size() {
        return map.size();
    }
}
`,
      hints: [
        'Lưu cả value lẫn expiresAt trong một object Entry; TTL tính từ lần ghi gần nhất.',
        'LinkedHashMap(16, 0.75f, true) với accessOrder = true đã tự sắp lại khi get/put; override removeEldestEntry để chặn vượt capacity.',
        'Kiểm tra hết hạn bằng now >= expiresAt (biên thuộc về "hết hạn") và nhớ gỡ entry khi phát hiện.'
      ],
      explain: `Lời giải tách hai trục: **thời gian** (expiresAt so với đồng hồ) và **thứ tự sử dụng** (accessOrder của LinkedHashMap). get() có hai tác dụng phụ: đánh dấu entry mới dùng và dọn entry hết hạn. put() luôn đặt lại hạn, nên "ghi đè" không làm sống lại một entry đã quá hạn cũ — chỉ cần thay object Entry.

Vì sao dùng đồng hồ giả? TTL phụ thuộc thời gian; nếu test dùng {{System.currentTimeMillis()}} thì phải {{Thread.sleep}} và kết quả có thể flaky trên CI chậm. Truyền {{LongSupplier}} cho phép test nhảy thời gian chính xác đến từng mili giây.

Lỗi hay gặp:

- So sánh {{now > expiresAt}} thay vì {{now >= expiresAt}} làm entry sống thêm 1ms — sai ở test biên và khó thấy trên production.
- Chỉ lưu value mà không lưu hạn, rồi dùng một "lần ghi cuối" chung cho cả cache: key nào cũng sống theo nhịp của key mới nhất.
- Quên rằng {{get()}} trên {{LinkedHashMap}} access-order cũng là thao tác sửa cấu trúc: nếu cache dùng chung nhiều thread, cần khoá hoặc thư viện chuyên dụng.
- Kiểm tra hết hạn nhưng không gỡ entry: bộ nhớ vẫn giữ dữ liệu chết, eviction LRU lại đuổi nhầm key còn sống vì dữ liệu chết chiếm chỗ.

Trên production, cơ chế này là phần lõi của Caffeine/Guava: bảng băm cho tra cứu, cấu trúc theo dõi thứ tự dùng, và một đồng hồ (thường là tick đơn điệu) cho hạn dùng. Redis làm tương tự nhưng ở mức key và dùng xấp xỉ LRU để giữ throughput.`
    }
  ],
  check: [
    {
      q: 'Một entry trong cache ghi lúc 10:00:00 với TTL 60 giây. Đến 10:01:00 đúng (theo đồng hồ) thì entry đó thế nào?',
      options: [
        'Còn hạn thêm 1 giây vì TTL tính từ giây kế tiếp',
        'Hết hạn: điều kiện now >= expiresAt đã đúng',
        'Tự động bị xoá khỏi Redis ngay lập tức và giải phóng bộ nhớ tức thì',
        'Chuyển thành entry vĩnh viễn'
      ],
      answer: 1,
      explain: 'expiresAt = 10:01:00; tại đúng thời điểm đó now >= expiresAt nên entry hết hạn. Việc giải phóng bộ nhớ không tức thì: cache có thể chỉ gỡ khi đọc (lazy) hoặc dọn nền theo mẫu.'
    },
    {
      q: 'Vì sao cache tự viết bắt buộc phải có giới hạn kích thước (capacity hoặc maxmemory)?',
      options: [
        'Vì HashMap chỉ chứa được 1 triệu entry',
        'Vì key sinh ra vô hạn theo dữ liệu, không giới hạn thì bộ nhớ tăng đến khi OOM hoặc Redis từ chối ghi',
        'Vì LRU cần số entry chẵn',
        'Vì TTL chỉ hoạt động khi cache đầy'
      ],
      answer: 1,
      explain: 'Số key có thể tăng theo dữ liệu và theo traffic; không có eviction thì bộ nhớ chỉ tăng. Kết cục là OutOfMemoryError trong JVM hoặc lỗi ghi khi Redis chạm maxmemory.'
    },
    {
      q: '1,5 triệu key được nạp cùng lúc với cùng TTL 600 giây. Cách hiệu quả nhất để tránh DB bị dội mỗi 10 phút là gì?',
      options: [
        'Tăng TTL lên 24 giờ cho mọi key',
        'Thêm jitter (lệch ngẫu nhiên khoảng 10%) vào TTL để các lần hết hạn rải ra',
        'Tắt hoàn toàn TTL',
        'Giảm capacity của cache để đuổi bớt key'
      ],
      answer: 1,
      explain: 'Jitter rải thời điểm hết hạn nên không còn cơn sóng đồng thời. Tăng TTL chỉ giảm tần suất chứ vẫn dồn cục; bỏ TTL làm dữ liệu cũ vĩnh viễn; giảm capacity chỉ làm hit rate tệ hơn.'
    },
    {
      q: 'Redis dùng approximated LRU (LRU xấp xỉ) thay vì LRU chính xác chủ yếu vì lý do gì?',
      options: [
        'Vì Redis không lưu được con trỏ',
        'Vì LRU chính xác cần thêm bộ nhớ mỗi key và một danh sách toàn cục phải sửa dưới khoá, làm giảm throughput',
        'Vì LRU chính xác chỉ đúng với key có TTL',
        'Vì xấp xỉ luôn cho hit rate cao hơn'
      ],
      answer: 1,
      explain: 'LRU chính xác cần danh sách liên kết toàn cục cập nhật mỗi lần đọc, tạo tranh chấp khoá. Redis lấy mẫu maxmemory-samples key rồi đuổi key cũ nhất trong mẫu: rẻ hơn, gần đúng, chấp nhận sai số.'
    }
  ],
  related: ['db-024', 'collections-005', 'collections-028', 'spring-017'],
  tags: ['cache', 'cache-aside', 'TTL', 'LRU', 'eviction', 'Redis', 'stampede']
},
{
  id: 'lesson-db-017',
  track: 'db',
  order: 17,
  title: 'Chống cache stampede bằng single-flight: một CompletableFuture cho mỗi key',
  level: 'senior',
  minutes: 40,
  goals: [
    'Giải thích cache stampede: vì sao một key nóng hết hạn có thể làm sập database',
    'Cài single-flight theo từng key bằng ConcurrentHashMap và CompletableFuture',
    'Phân biệt single-flight với khoá toàn cục và với computeIfAbsent, nêu được bẫy của từng cách',
    'Xử lý loader lỗi, timeout và giới hạn khi hệ thống chạy nhiều instance'
  ],
  body: `**Tóm tắt:** **Cache stampede** (giẫm đạp cache) là khi một key nóng vừa hết hạn, hàng nghìn request cùng miss và cùng chạy loader — database nhận một cơn sóng truy vấn giống hệt nhau. **Single-flight** (gộp chuyến) sửa đúng điểm đó: thread đầu tiên đăng ký một {{CompletableFuture}} cho key, các thread sau tìm thấy future ấy và **chờ chung** kết quả, nên loader chỉ chạy một lần.

### Stampede: ba cái tên cho cùng một sự cố
Trong tài liệu bạn sẽ gặp ba tên gần như đồng nghĩa:

- **Cache stampede** (giẫm đạp): nhiều request đồng thời cùng miss **một** key và cùng nạp.
- **Thundering herd** (bầy thú hoảng loạn): cùng hiện tượng, nhấn vào việc tất cả cùng "lao" về DB.
- **Dogpile** (chồng đống): cách gọi cũ, cùng bản chất.

Hãy hình dung một quầy bán vé có tấm bảng ghi "còn 50 vé" (cache). Đúng 9 giờ, tấm bảng được gỡ để cập nhật. 2.000 người đang xếp hàng cùng lúc không thấy bảng nên cùng gọi điện vào phòng vé để hỏi — phòng vé có 5 nhân viên, sập. Đó là stampede: không phải cache hỏng, mà là cache hết hạn trong khi key đó đang nóng.

Vì sao việc này nguy hiểm hơn về mặt số liệu? Giả sử một endpoint nhận 3.000 request/giây, key cấu hình có TTL 60 giây và mỗi lần nạp mất 300 ms. Bình thường DB nhận 1 truy vấn/phút. Đúng thời điểm hết hạn, khoảng 300 ms đó có thể có tới 900 request cùng miss (3.000 × 0,3). Nếu connection pool của DB là 50, thì 50 kết nối bị chiếm bởi các truy vấn giống hệt nhau, các request khác phải chờ — và chính các request chờ đó lại tiếp tục miss và xếp hàng dài thêm. Hiện tượng tự khuếch đại.

> Tăng TTL **không** sửa được stampede, chỉ làm nó xảy ra ít hơn. Chừng nào cache còn hết hạn thì chừng đó còn cơn sóng; TTL 1 giờ vẫn có stampede mỗi giờ, và khi xảy ra thì càng dữ dội vì lượng request dồn trong 1 giờ lớn hơn.

### Single-flight: một chuyến bay cho mỗi key
**Single-flight** nghĩa là gộp các lời gọi **cùng một key** đang đồng thời thành một lần tính. Ví dụ đời thường: quán chỉ cho một nhân viên vào kho lấy hàng; những người đến sau không tự vào kho mà đứng chờ và cùng nhận đúng thùng hàng đó.

Ba yêu cầu của một cài đặt đúng:

1. **Theo key, không toàn cục**: key A đang nạp không được chặn key B. Nếu khoá cả cache bằng {{synchronized}}, mọi key xếp hàng sau một loader chậm 500 ms — throughput sụp dù không có stampede.
2. **Người đến sau phải chờ và nhận kết quả**, không được bỏ qua rồi tự nạp, cũng không được trả lỗi ngay.
3. **Không được "đầu độc" cache khi loader lỗi**: lỗi tạm thời của DB không được biến thành lỗi vĩnh viễn cho mọi request sau.

Cách cài phổ biến là một map key → "vé chờ". Ở Java, {{CompletableFuture}} vừa là vé chờ vừa là kết quả: nó có trạng thái "chưa xong", gọi {{join()}} để chờ, và khi xong thì trả cùng một giá trị cho mọi người gọi.

~~~seq
title: Single-flight khi key nóng hết hạn
actors: Thread A | Thread B | Cache
Thread A -> Cache: get(hot, loader)
Cache --> Thread A: future mới chưa xong
Thread B -> Cache: get(hot, loader)
Cache --> Thread B: đúng future đó
Thread A -> Thread A: chạy loader một lần
Thread A -> Cache: future.complete(value)
Cache --> Thread B: join nhận cùng value
~~~

### Hoạt động từng bước
Map có kiểu {{ConcurrentHashMap<K, CompletableFuture<V>>}}. Thuật toán của {{get(key, loader)}}:

1. {{map.get(key)}} — nếu có future thì nhảy thẳng tới bước 5 (dùng chung).
2. Nếu chưa có, tạo {{mine = new CompletableFuture<>()}} rồi {{map.putIfAbsent(key, mine)}}. Đây là phép nguyên tử: đúng **một** thread nhận về {{null}} (thread thắng), mọi thread khác nhận future của thread thắng.
3. Thread thắng chạy loader **ngay trên thread của nó** (không đẩy sang pool khác), rồi {{mine.complete(value)}}.
4. Nếu loader ném lỗi: {{mine.completeExceptionally(t)}} **và** {{map.remove(key, mine)}} để lần gọi sau được thử lại. Truyền đúng {{mine}} vào remove để không xoá nhầm future của người khác (nếu key vừa được thay).
5. Mọi thread gọi {{future.join()}} (hoặc {{get(timeout, unit)}}) và nhận cùng một kết quả hoặc cùng một lỗi.

Điểm tinh tế: future **thành công** được để nguyên trong map và đóng vai trò cache entry. Vì vậy thread đến muộn — kể cả sau khi loader đã xong — vẫn thấy future đã hoàn thành, lấy giá trị luôn, không nạp lại. Nhờ đó test đếm số lần gọi loader là xác định, không phụ thuộc thứ tự lập lịch thread.

### Vì sao không dùng computeIfAbsent cho cả loader?
{{ConcurrentHashMap.computeIfAbsent}} cũng đảm bảo chỉ một thread chạy hàm cho một key, và đó là cách hay cho cache không có I/O (xem bài concurrency về single-flight). Nhưng khi loader gọi DB/Redis (I/O chậm), nó có hai vấn đề:

- **Giữ khoá bucket lâu**: JDK giữ khoá trên bucket trong suốt thời gian hàm chạy. Loader 500 ms làm mọi key khác rơi vào cùng bucket phải chờ 500 ms. Với 16 bucket mặc định ban đầu và nhiều key, xác suất đụng bucket không nhỏ.
- **Cấm sửa map trong hàm**: nếu loader (hoặc code nó gọi) lại đụng chính map đó, có thể gây {{IllegalStateException}} hoặc deadlock, vì thread đang giữ khoá của bucket.

Khi dùng CompletableFuture, {{putIfAbsent}} chỉ giữ khoá trong khoảng thời gian tạo future (cực ngắn); loader chạy ngoài khoá. Đó là lý do pattern này phổ biến ở các thư viện cache.

### Vì sao không dùng supplyAsync mặc định?
{{CompletableFuture.supplyAsync(loader)}} không truyền executor sẽ chạy trên **ForkJoinPool.commonPool** — pool dùng chung cho cả parallel stream và nhiều việc khác, mặc định chỉ có {{số CPU - 1}} thread. Nếu loader là lời gọi DB blocking 300 ms, vài chục key cùng miss sẽ chiếm hết pool chung, làm chậm cả những chỗ không liên quan. Nếu muốn chạy bất đồng bộ, hãy truyền executor riêng có giới hạn; còn cách đơn giản và dễ suy luận nhất là chạy loader ngay trên thread đang gọi, vì request đó dù sao cũng đang chờ kết quả.

### Timeout, lỗi và các bẫy production
- **join() vô hạn là bẫy chết người**: nếu loader treo (DB không trả lời, mạng đứt) thì mọi thread chờ key đó treo theo; thread pool của web server (Tomcat) cạn dần và cả service ngừng phục vụ. Luôn dùng {{get(timeout, unit)}} hoặc {{orTimeout}} và có kế hoạch fallback.
- **Future lỗi phải bị gỡ**: nếu chỉ {{completeExceptionally}} mà quên {{remove}}, mọi request sau nhận lại đúng lỗi cũ cho tới khi key bị xoá hoặc TTL hết — một lỗi DB 1 giây biến thành sự cố 10 phút.
- **Phân biệt lỗi tạm thời và vĩnh viễn**: lỗi timeout nên gỡ future để thử lại; lỗi "không tồn tại" nên cache có TTL ngắn (negative caching) để không đập DB liên tục.
- **Timeout không tự huỷ việc đang chạy**: future vẫn tiếp tục và có thể complete sau khi caller đã bỏ đi. Cần chấp nhận điều đó hoặc huỷ hợp lý; điều quan trọng là loader không chạy vô hạn.
- **Single-flight chỉ trong một JVM**: 10 instance chạy 10 map riêng ⇒ tối đa 10 loader đồng thời cho một key. Với key cực nóng và loader rất đắt, cần khoá phân tán (ví dụ Redis {{SET key value NX PX 5000}} làm leader, người khác chờ hoặc dùng bản cũ) hoặc chấp nhận 10 lần.
- **Stale-while-revalidate**: cách bổ sung rất thực dụng — giữ bản cũ quá hạn, trả ngay cho người dùng, và chỉ một thread nền refresh. Người dùng không phải chờ loader, DB vẫn chỉ nhận một truy vấn.
- **Kết hợp TTL**: future hoàn thành nằm trong map nên cần hạn sử dụng. Hoặc tách map {{inFlight}} (chỉ future chưa xong) khỏi cache value có TTL, hoặc lưu cặp {{(future, expiresAt)}} và kiểm tra hạn khi đọc.

### Ví dụ đời thực
Một dịch vụ thanh toán có 10 instance, mỗi instance nhận 3.000 request/giây. Bảng phí giao dịch được cache theo key {{fee-table}} với TTL 60 giây; mỗi lần nạp là một truy vấn join 4 bảng mất khoảng 250 ms.

**Triệu chứng:** cứ mỗi phút lại có khoảng 5 giây lỗi 500 hàng loạt; connection pool của DB (30 kết nối) báo timeout; APM cho thấy mỗi instance bắn khoảng 300 truy vấn giống hệt nhau trong đúng 250 ms đó.

**Điều tra:** TTL hết hạn đồng thời trên cả 10 instance; mỗi instance nhận khoảng 3.000 request/giây × 0,25 giây = 750 request cùng miss. Không có cơ chế gộp.

**Xử lý:** (1) single-flight theo key trong từng JVM; (2) thêm khoá Redis {{SET fee-table:lock ... NX PX 5000}} để chỉ một instance nạp, các instance khác chờ hoặc đọc bản cũ; (3) thêm jitter TTL để 10 instance không hết hạn cùng lúc; (4) timeout 200 ms cho bước chờ, fallback về bảng phí mặc định đã kiểm duyệt.

**Kết quả đo được:** truy vấn nạp bảng phí giảm từ khoảng 3.000 lần/phút (mỗi instance tự nạp) xuống còn 1 lần/phút; lỗi 500 về 0; p99 của endpoint từ 2,1 giây xuống 180 ms.

### Liên hệ phỏng vấn
- **"Cache stampede là gì? Chống thế nào?"** → Một key nóng hết hạn, nhiều request cùng nạp; chống bằng single-flight theo key, jitter TTL, stale-while-revalidate, và khoá phân tán khi nhiều instance.
- **"Vì sao dùng CompletableFuture thay vì computeIfAbsent?"** → computeIfAbsent giữ khoá bucket trong suốt loader I/O và cấm sửa map bên trong; future chỉ giữ khoá lúc đăng ký, loader chạy ngoài khoá.
- **"Loader lỗi thì xử lý thế nào?"** → completeExceptionally + remove đúng future để lần sau retry; phân biệt lỗi tạm thời với "not found" (negative caching có TTL).
- **"Hệ thống 10 instance thì single-flight có đủ?"** → Không, nó chỉ gộp trong một JVM; cần khoá phân tán hoặc chấp nhận N lần nạp; nêu trade-off.
- **"Vì sao phải có timeout?"** → Tránh thread chờ vô hạn làm cạn thread pool khi loader treo; kèm fallback (bản cũ, giá trị mặc định, lỗi có kiểm soát).

> Senior tip: single-flight không thay thế TTL và eviction, nó chỉ bịt lỗ "nạp trùng". Hãy đo hai con số: số lần loader chạy mỗi phút (kỳ vọng xấp xỉ số lần hết hạn, không phải số request) và thời gian chờ trung bình của các thread join. Nếu số lần loader vẫn tăng theo traffic, single-flight của bạn đang không hoạt động — thường vì future bị gỡ quá sớm hoặc vì mỗi request tạo map riêng.
`,
  exercises: [
    {
      title: 'SingleFlightCache: gộp loader theo key bằng CompletableFuture',
      prompt: `Cài {{SingleFlightCache<K, V>}} dùng {{ConcurrentHashMap<K, CompletableFuture<V>>}} để bảo đảm với mỗi key, loader chỉ chạy **một lần** dù nhiều thread gọi đồng thời.

API và ngữ nghĩa:
- {{V get(K key, Function<K, V> loader)}}: trả giá trị của key.
  - Nếu key **chưa có future**: tạo future mới, {{putIfAbsent}}. Thread nào nhận về {{null}} là thread thắng, tự chạy {{loader.apply(key)}} trên chính thread đó rồi {{complete(value)}}.
  - Nếu đã có future (đang chạy hoặc đã xong): {{join}} và dùng chung kết quả, **không** gọi loader.
  - Nếu loader ném lỗi: {{completeExceptionally}} và gỡ future khỏi map (dùng {{remove(key, future)}}) để lần sau thử lại; lỗi được ném ra ngoài dưới dạng {{RuntimeException}} bọc nguyên nhân.
- {{int size()}}: số future đang có trong map.

Future thành công nằm lại trong map như một entry cache. loader nhận key và trả value không null.`,
      starter: `class SingleFlightCache<K, V> {
    private final ConcurrentHashMap<K, CompletableFuture<V>> map = new ConcurrentHashMap<>();

    V get(K key, Function<K, V> loader) {
        throw new UnsupportedOperationException("TODO");
    }

    int size() {
        return map.size();
    }
}
`,
      tests: `public class Main {
    static int p = 0, t = 0;
    static void c(String name, Runnable r) {
        t++;
        try { r.run(); p++; System.out.println("PASS " + name); }
        catch (Throwable e) { System.out.println("FAIL " + name + ": " + e); }
    }
    static void eq(Object expected, Object actual) {
        if (!Objects.equals(expected, actual)) throw new AssertionError("expected " + expected + " but got " + actual);
    }

    public static void main(String[] args) {
        c("hai lần gọi cùng key: loader chạy một lần", () -> {
            AtomicInteger calls = new AtomicInteger();
            SingleFlightCache<String, Integer> cache = new SingleFlightCache<>();
            Function<String, Integer> loader = k -> { calls.incrementAndGet(); return 99; };
            eq(99, cache.get("hot", loader));
            eq(99, cache.get("hot", loader));
            eq(1, calls.get());
            eq(1, cache.size());
        });

        c("key khác nhau nạp độc lập", () -> {
            AtomicInteger calls = new AtomicInteger();
            SingleFlightCache<String, Integer> cache = new SingleFlightCache<>();
            Function<String, Integer> loader = k -> { calls.incrementAndGet(); return k.length(); };
            eq(3, cache.get("abc", loader));
            eq(2, cache.get("ab", loader));
            eq(3, cache.get("abc", loader));
            eq(2, calls.get());
            eq(2, cache.size());
        });

        c("8 thread cùng key: loader chạy một lần", () -> {
            AtomicInteger calls = new AtomicInteger();
            CountDownLatch started = new CountDownLatch(1);
            CountDownLatch release = new CountDownLatch(1);
            Function<String, Integer> loader = k -> {
                calls.incrementAndGet();
                started.countDown();
                try { release.await(); }
                catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    throw new RuntimeException(e);
                }
                return 42;
            };
            SingleFlightCache<String, Integer> cache = new SingleFlightCache<>();
            ExecutorService pool = Executors.newFixedThreadPool(8);
            try {
                List<Future<Integer>> results = new ArrayList<>();
                for (int i = 0; i < 8; i++) results.add(pool.submit(() -> cache.get("hot", loader)));
                if (!started.await(2, TimeUnit.SECONDS)) throw new AssertionError("loader chưa chạy");
                release.countDown();
                for (Future<Integer> r : results) eq(42, r.get(2, TimeUnit.SECONDS));
            } catch (Exception e) {
                throw new RuntimeException(e);
            } finally {
                pool.shutdownNow();
            }
            eq(1, calls.get());
            eq(1, cache.size());
        });

        c("lỗi không bị cache: lần sau nạp lại", () -> {
            AtomicInteger calls = new AtomicInteger();
            SingleFlightCache<String, Integer> cache = new SingleFlightCache<>();
            Function<String, Integer> loader = k -> {
                if (calls.incrementAndGet() == 1) throw new IllegalStateException("DB down");
                return 7;
            };
            boolean threw = false;
            try { cache.get("k", loader); } catch (RuntimeException e) { threw = true; }
            if (!threw) throw new AssertionError("lần đầu phải ném lỗi");
            eq(7, cache.get("k", loader));
            eq(2, calls.get());
            eq(1, cache.size());
        });

        System.out.println("RESULT " + p + "/" + t);
    }
}
`,
      reference: `class SingleFlightCache<K, V> {
    private final ConcurrentHashMap<K, CompletableFuture<V>> map = new ConcurrentHashMap<>();

    V get(K key, Function<K, V> loader) {
        CompletableFuture<V> f = map.get(key);
        if (f == null) {
            CompletableFuture<V> mine = new CompletableFuture<>();
            f = map.putIfAbsent(key, mine);   // null: mình là thread thắng
            if (f == null) {
                f = mine;
                try {
                    f.complete(loader.apply(key));   // loader chạy đúng một lần cho key
                } catch (Throwable t) {
                    f.completeExceptionally(t);
                    map.remove(key, mine);           // lỗi tạm thời không được nằm lại cache
                }
            }
        }
        try {
            return f.join();                         // thread khác chờ chung kết quả
        } catch (CompletionException e) {
            throw new RuntimeException(e.getCause());
        }
    }

    int size() {
        return map.size();
    }
}
`,
      hints: [
        'Dùng putIfAbsent để chọn thread thắng một cách nguyên tử; ai nhận null thì chạy loader, ai nhận future thì join.',
        'Loader ném lỗi thì completeExceptionally rồi remove(key, future) — truyền đúng future để không xoá nhầm của người khác.',
        'join() ném CompletionException; bọc lại (unwrap) nếu API của bạn muốn ném lỗi gốc.'
      ],
      explain: `Lời giải dùng map làm **bảng đăng ký chuyến bay**: key → future. Thao tác quyết định là {{putIfAbsent}} — nguyên tử, nên chỉ một thread nhận {{null}} và được quyền chạy loader. Các thread còn lại nhận future (đang chạy hoặc đã xong) và {{join}} để chờ cùng kết quả. Vì future thành công **không bị gỡ**, nó đồng thời là cache entry: lần gọi sau dùng luôn, không nạp lại.

Vì sao test vẫn xác định khi có 8 thread? Không có nhánh nào phụ thuộc "ai chạy trước". Chỉ một thread thắng putIfAbsent, và thread đến sau — sớm hay muộn — đều thấy đúng future trong map. CountDownLatch chỉ giữ loader cho tới khi test ra hiệu, để tất cả thread có cơ hội chờ; kể cả thread đến sau khi future đã complete vẫn trả đúng 42 mà không gọi loader, nên {{calls == 1}} luôn đúng.

Lỗi hay gặp:

- **Quên remove khi loader lỗi** ⇒ future lỗi nằm mãi trong map, mọi request sau nhận lỗi cũ. Đây là lỗi "poison cache" nguy hiểm nhất của pattern này.
- **remove(key)** một tham số ⇒ có thể xoá future của thread khác vừa đăng ký; hãy dùng {{remove(key, mine)}}.
- **Dùng computeIfAbsent bọc cả lời gọi loader I/O** ⇒ giữ khoá bucket lâu và có thể deadlock; computeIfAbsent chỉ nên dùng cho phép tính nhanh, không I/O.
- **join() không timeout** ⇒ loader treo làm treo luôn mọi request chờ key đó.
- **Gọi complete hai lần** ⇒ lần sau trả false, không có tác dụng; cũng đừng completeExceptionally sau khi đã complete thành công.
- **Mỗi request tạo map mới** (ví dụ map đặt trong biến cục bộ của method) ⇒ không gộp được gì; map phải sống theo vòng đời cache.

Trên production, hãy coi single-flight là lớp bảo vệ **trong một JVM**. Muốn giảm số lần nạp trên toàn cụm thì cần khoá phân tán hoặc để chỉ một instance chịu trách nhiệm refresh, và luôn có timeout + fallback để không biến stampede thành sự cố treo.`
    }
  ],
  check: [
    {
      q: 'Trong 300 ms cuối vòng đời của một key nóng, endpoint nhận 3.000 request/giây. Không có single-flight thì khoảng bao nhiêu request có thể cùng miss?',
      options: [
        'Đúng 1 request',
        'Khoảng 900 request (3.000 nhân 0,3 giây)',
        'Khoảng 3 request',
        'Không request nào vì TTL còn hiệu lực'
      ],
      answer: 1,
      explain: 'Mọi request đến trong khoảng thời gian key đã hết hạn và future chưa xong đều miss, nên số request cùng nạp xấp xỉ tốc độ nhân thời gian nạp: 3.000 × 0,3 = 900. Đó là lý do connection pool bị chiếm hết.'
    },
    {
      q: 'Vì sao dùng CompletableFuture trong map thay vì bọc loader bằng computeIfAbsent khi loader gọi database?',
      options: [
        'Vì computeIfAbsent không đảm bảo chạy một lần',
        'Vì computeIfAbsent giữ khoá bucket trong suốt thời gian hàm chạy và cấm sửa map bên trong, nên loader I/O chậm sẽ chặn key khác cùng bucket',
        'Vì CompletableFuture nhanh hơn khoá ở mọi trường hợp',
        'Vì computeIfAbsent không dùng được với ConcurrentHashMap'
      ],
      answer: 1,
      explain: 'computeIfAbsent có đảm bảo chạy một lần, nhưng giữ khoá trong lúc hàm chạy. Loader I/O 500 ms vừa chặn key khác cùng bucket vừa có nguy cơ deadlock nếu loader đụng lại map. Future chỉ giữ khoá lúc đăng ký.'
    },
    {
      q: 'Loader ném ngoại lệ ở lần gọi đầu. Cài đặt đúng cần làm gì với future trong map?',
      options: [
        'Giữ future lỗi lại để các request sau nhận cùng lỗi, đỡ phải gọi DB',
        'completeExceptionally và gỡ future đó (remove đúng future) để lần sau nạp lại',
        'complete với giá trị null',
        'Xoá toàn bộ map'
      ],
      answer: 1,
      explain: 'Lỗi tạm thời không được biến thành lỗi vĩnh viễn. Gỡ đúng future vừa lỗi để request sau thử lại; nếu muốn tránh đập DB với key không tồn tại thì cache kết quả rỗng với TTL ngắn (negative caching).'
    },
    {
      q: 'Hệ thống chạy 10 instance, mỗi instance có SingleFlightCache riêng. Điều gì đúng?',
      options: [
        'Toàn cụm chỉ còn đúng 1 lần nạp mỗi key',
        'Mỗi key có thể có tối đa 10 lần nạp đồng thời, mỗi instance một lần; muốn giảm nữa cần khoá phân tán',
        'Single-flight không hoạt động vì mỗi instance có map khác nhau',
        'Cần tắt cache để tránh stampede'
      ],
      answer: 1,
      explain: 'Single-flight chỉ gộp trong một JVM. Với 10 instance, mỗi instance vẫn có một loader riêng nên tối đa 10 lần nạp; giảm tiếp bằng khoá phân tán (Redis NX/PX) hoặc để một instance chịu trách nhiệm refresh.'
    }
  ],
  related: ['concurrency-030', 'db-024', 'db-009', 'spring-017'],
  tags: ['cache', 'stampede', 'single-flight', 'CompletableFuture', 'ConcurrentHashMap', 'Redis']
},
{
  id: 'lesson-db-018',
  track: 'db',
  order: 18,
  title: 'Redis bên trong: RAM, single thread, kiểu dữ liệu, TTL, persistence',
  level: 'senior',
  minutes: 40,
  goals: [
    'Giải thích Redis là gì và vì sao lưu trong RAM lại nhanh',
    'Hiểu mô hình single-threaded event loop và tại sao một lệnh chậm làm treo tất cả',
    'Phân biệt các kiểu dữ liệu cốt lõi và biết dùng cho bài toán nào',
    'Nắm TTL, eviction policy và các chế độ persistence (RDB, AOF)'
  ],
  body: `**Tóm tắt:** Redis (Remote Dictionary Server) là một kho dữ liệu in-memory (trong bộ nhớ RAM) cấu trúc theo key-value, hỗ trợ nhiều kiểu dữ liệu phong phú. Nó đạt độ trễ cực thấp (sub-millisecond) nhờ đọc/ghi thẳng RAM và mô hình **single-threaded event loop** xử lý lệnh lần lượt, tránh chi phí khóa và context switch. Đổi lại, một lệnh chậm (như KEYS *, hoặc Lua script chạy lâu) sẽ chặn toàn bộ server.
 
### Redis là gì và vì sao RAM nhanh
 **Redis** là một server key-value chạy hoàn toàn trong RAM. RAM (Random Access Memory - bộ nhớ truy cập ngẫu nhiên) cho phép đọc/ghi bất kỳ địa chỉ nào trong thời gian hằng số (~100 ns), không cần chuyển động cơ học như ổ cứng (HDD) hay thậm chí SSD (có độ trễ ~50–100 µs). Với cùng một thao tác GET, Redis trong RAM mất ~0.3–1 ms (kể cả network round-trip trong cùng datacenter), trong khi PostgreSQL đọc từ đĩa (dù đã cache trong shared_buffers) thường 1–3 ms, join phức tạp 20–100 ms.
 
 Ví dụ đời thường: RAM giống như bạn nhớ số điện thoại ngay lập tức (trong đầu), còn ổ cứng giống như tra điền trong sổ điện thoại trên kệ (phải đứng dậy, lật trang).
 
### Single-threaded event loop: một luồng xử lý lần lượt
 Redis dùng **một luồng chính (main thread)** để:
 1. Nhận kết nối từ client (accept)
 2. Đọc lệnh (parse RESP protocol)
 3. Thực thi lệnh (thao tác trên dictionary/hash table nội bộ)
 4. Ghi phản hồi về client
 
 Mọi lệnh được xếp hàng trong **command queue** và thực thi tuần tự. Không có khóa (lock), không có race condition giữa các lệnh, code đơn giản và dễ bảo trì.
 
 ~~~seq
 title: Redis event loop xử lý 3 client
 actors: Client A | Redis | Client B | Client C
 Client A -> Redis: SET key1 value1
 Redis -> Redis: thực thi SET
 Redis --> Client A: OK
 Client B -> Redis: GET key1
 Redis -> Redis: thực thi GET
 Redis --> Client B: value1
 Client C -> Redis: INCR counter
 Redis -> Redis: thực thi INCR
 Redis --> Client C: 1
 ~~~
 
**Tại sao một lệnh chậm làm treo tất cả?** Vì chỉ có một luồng. Nếu Client A gửi {{KEYS *}} (quét toàn bộ keyspace, O(N)) trên 10 triệu key, lệnh đó chạy vài giây. Trong lúc đó, Client B muốn {{GET key1}} (O(1)) phải chờ cho {{KEYS *}} xong. Client C muốn {{INCR}} cũng chờ. Toàn bộ throughput sụt xuống 0.

Cách tránh: không bao giờ dùng {{KEYS *}} trên production (dùng {{SCAN}} cursor-based), không chạy Lua script lâu, tách cluster nếu workload quá nặng.
 
### Các kiểu dữ liệu cốt lõi và bài toán phù hợp
 
 | Kiểu | Cấu trúc bên trong | Dùng cho bài toán gì | Lệnh điển hình |
 |---|---|---|---|
 | **String** | Simple Dynamic String (SDS), binary-safe | Cache giá trị đơn, counter (INCR), rate limiter, session token | SET, GET, INCR, DECR, GETSET |
 | **Hash** | Hash table (field -> value) | Object/entity (user:100 -> {name, email, balance}), giảm key count so với flatten | HSET, HGET, HGETALL, HMGET |
 | **List** | Doubly linked list (quicklist) | Queue (LPUSH/RPOP), stack, recent items feed, capped log | LPUSH, RPUSH, LPOP, RPOP, LRANGE |
 | **Set** | Hash table (chỉ key, không value) | Tagging, unique visitors, intersection/union (SINTER/SUNION) | SADD, SREM, SISMEMBER, SINTER |
 | **Sorted Set (ZSet)** | Skip list + hash table (score -> member) | **Leaderboard** (xếp hạng), delay queue (score = timestamp), rate limiter trượt | ZADD, ZRANGE, ZRANK, ZSCORE, ZREVRANGE |
 
 **Ví dụ leaderboard với Sorted Set:**
 
 ~~~text
 ZADD game:rank 1250 "player:A"
 ZADD game:rank 980  "player:B"
 ZADD game:rank 2100 "player:C"
 ZREVRANGE game:rank 0 9 WITHSCORES  -> top 10 cao nhất
 ZRANK game:rank "player:B"         -> thứ hạng (0-based)
 ZSCORE game:rank "player:A"        -> điểm số
 ~~~
 
 Skip list cho phép insert/delete/search O(log N) và duyệt theo thứ tự score nhanh, phù hợp cho xếp hạng thời gian thực.
 
### TTL (Time To Live) và Eviction
**TTL** gắn hạn sử dụng cho key: {{SET key value EX 300}} (hết hạn sau 300 giây). Redis lưu {{expireAt}} (timestamp Unix milliseconds) cho mỗi key.

- **Lazy expiration**: khi client truy cập key, Redis kiểm tra {{now >= expireAt}} thì xoá và trả nil.
- **Active expiration**: mỗi chu kỳ (mặc định 10 chu kỳ/giây) lấy mẫu ngẫu nhiên 20 key có TTL, xoá key hết hạn; nếu >25% mẫu hết hạn, lặp lại ngay trong chu kỳ đó (adaptive).

Khi bộ nhớ chạm {{maxmemory}}, **eviction policy** quyết định key nào bị đuổi:

| Policy | Mô tả | Phù hợp |
|---|---|---|
| {{noeviction}} | Mặc định, trả lỗi khi đầy | Không được phép mất dữ liệu |
| {{allkeys-lru}} | Đuổi key lâu không dùng nhất (LRU xấp xỉ) | Cache thuần túy |
| {{volatile-lru}} | Chỉ đuổi key **có TTL** theo LRU | Vừa cache vừa dữ liệu bền |
| {{allkeys-lfu}} | Đuổi key ít dùng nhất theo tần suất | Hot key ổn định |
| {{volatile-ttl}} | Đuổi key sắp hết hạn nhất | TTL là ưu tiên |

> Redis LRU/LFU là **xấp xỉ** (approximated): lấy mẫu {{maxmemory-samples}} key (mặc định 5), đuổi key cũ/ít dùng nhất trong mẫu. Mẫu càng lớn càng chính xác nhưng tốn CPU.

### Persistence: RDB và AOF
Redis là in-memory, mất điện = mất dữ liệu. Hai cơ chế bền:

1. **RDB (Redis Database)** - snapshot tại một thời điểm:
   - {{SAVE}} (blocking) hoặc {{BGSAVE}} (fork process con, copy-on-write)
   - File {{.rdb}} nén, khôi phục nhanh
   - Mất dữ liệu từ snapshot cuối cùng đến lúc crash

2. **AOF (Append-Only File)** - ghi nối đuôi mọi lệnh ghi:
   - {{appendfsync always}} (mỗi lệnh fsync, an toàn nhất, chậm)
   - {{appendfsync everysec}} (mặc định, fsync mỗi giây, cân bằng)
   - {{appendfsync no}} (để OS quyết định, nhanh nhất, rủi ro mất ~30s)
   - Rewrite định kỳ nén file (loại bỏ lệnh ghi đè nhau)

**Kết hợp RDB + AOF** (khuyên dùng production): RDB cho backup/khôi phục nhanh, AOF cho độ bền giữa các snapshot.

### Cơ chế từng bước: một lệnh SET đi qua đâu
1. Client gửi {{SET mykey myvalue EX 60}} qua TCP (RESP protocol).
2. Redis main thread đọc từ socket buffer, parse lệnh.
3. Tra dictionary (hash table) tìm {{mykey}}: O(1) trung bình.
4. Tạo/cập nhật entry: lưu SDS value, gán {{expireAt = now + 60000}}.
5. Nếu bật AOF: append lệnh vào AOF buffer.
6. Ghi phản hồi {{+OK\r\n}} vào socket write buffer.
7. Event loop quay lại bước 1 cho client tiếp theo.

Vì sao lại như vậy? Dictionary (hash table) cho O(1) truy cập; single thread loại bỏ lock contention; SDS tránh buffer overflow và cho phép binary data; event loop tận dụng CPU cache tốt.
 
 ~~~java
 // Mô phỏng đơn giản: dictionary + expire map + single thread loop
 class MiniRedis {
     private final Map<String, String> data = new HashMap<>();
     private final Map<String, Long> expires = new HashMap<>();
     private final Clock clock;
 
     MiniRedis(Clock clock) { this.clock = clock; }
 
     String set(String key, String value, long ttlMs) {
         data.put(key, value);
         if (ttlMs > 0) expires.put(key, clock.millis() + ttlMs);
         else expires.remove(key);
         return "OK";
     }
 
     String get(String key) {
         if (isExpired(key)) { data.remove(key); expires.remove(key); return null; }
         return data.get(key);
     }
 
     boolean isExpired(String key) {
         Long exp = expires.get(key);
         return exp != null && clock.millis() >= exp;
     }
 }
 ~~~
 
### Tự thử trên máy
 Chạy Redis container và test cơ bản:
 
 ~~~bash
 docker run -d --name redis-demo -p 6379:6379 redis:7-alpine
 redis-cli -h localhost -p 6379
 ~~~
 
Trong {{redis-cli}}:

~~~text
127.0.0.1:6379> SET user:1 "{\"name\":\"An\",\"balance\":1000}" EX 60
OK
127.0.0.1:6379> GET user:1
"{\"name\":\"An\",\"balance\":1000}"
127.0.0.1:6379> HSET user:2 name "Binh" email "binh@x.com" balance 500
(integer) 3
127.0.0.1:6379> HGETALL user:2
1) "name" 2) "Binh" 3) "email" 4) "binh@x.com" 5) "balance" 6) "500"
127.0.0.1:6379> ZADD leaderboard 1250 "player:A" 2100 "player:C" 980 "player:B"
(integer) 3
127.0.0.1:6379> ZREVRANGE leaderboard 0 2 WITHSCORES
1) "player:C" 2) "2100" 3) "player:A" 4) "1250" 5) "player:B" 6) "980"
127.0.0.1:6379> INCR api:counter
(integer) 1
127.0.0.1:6379> TTL user:1
(integer) 55
~~~

Kết quả mong đợi: các lệnh trên đều trả về như minh hoạ, TTL giảm dần theo thời gian thực.

### Lỗi hay gặp trên production
1. **Dùng {{KEYS *}} trên production**. Triệu chứng: Redis CPU 100%, mọi request khác timeout. Nguyên nhân: {{KEYS}} quét toàn bộ keyspace O(N), chặn event loop. Sửa: dùng {{SCAN cursor MATCH pattern COUNT 100}} lặp qua cursor.
2. **Lua script chạy lâu / khối lượng lớn**. Triệu chứng: tương tự {{KEYS}}, event loop bị chiếm. Nguyên nhân: Lua chạy atomically trong main thread. Sửa: viết script ngắn, tránh vòng lặp lớn; chia công việc thành nhiều script nhỏ thay vì một script nặng.
3. **Không đặt {{maxmemory}} và {{maxmemory-policy}}**. Triệu chứng: Redis chiếm hết RAM máy chủ, OOM killer hạ process. Nguyên nhân: mặc định {{noeviction}}, viết thất bại khi đầy. Sửa: đặt {{maxmemory 2gb}} và {{maxmemory-policy allkeys-lru}} cho cache.
4. **Lưu object lớn (JSON 100KB+) dưới một key String**. Triệu chứng: memory tăng vọt, network latency cao, replication lag. Sửa: tách thành Hash (mỗi field một cột) hoặc nén (LZ4/Snappy) trước khi SET.
5. **Quên TTL cho cache key**. Triệu chứng: key cache cũ không bao giờ bị xoá, memory tăng liên tục. Sửa: luôn {{EX}}/{{PX}} khi SET cache; dùng {{EXPIRE}} cho key đã có.
 
### Tóm lại 3 ý
 1. Redis nhanh nhờ **RAM + single-threaded event loop + O(1) hash table**; một lệnh chậm chặn toàn bộ server.
 2. **Kiểu dữ liệu** quyết định bài toán: String cho counter/cache đơn, Hash cho object, Sorted Set cho leaderboard, List cho queue, Set cho unique/tag.
 3. **TTL + eviction policy + persistence (RDB+AOF)** là ba chân vịt bảo vệ bộ nhớ và dữ liệu; thiếu một trong ba là rủi ro production.
 
### Liên hệ phỏng vấn
- **"Redis nhanh ở đâu? Vì sao single-threaded lại nhanh?"** → RAM truy cập hằng số, không lock, event loop tận dụng CPU cache, O(1) hash table. Đa luồng thêm chi phí context switch và lock contention.
- **"Một lệnh chậm ảnh hưởng thế nào?"** → Chặn event loop, mọi client khác (kể cả {{GET}} O(1)) phải chờ. Không bao giờ {{KEYS *}}, dùng {{SCAN}}; giới hạn Lua script.
- **"Khi nào dùng Sorted Set thay vì List cho leaderboard?"** → Cần xếp hạng theo điểm (score), cập nhật điểm thường xuyên, lấy top N hay rank của một player. List chỉ phù hợp queue/log theo thời gian.
- **"TTL hoạt động ra sao? Lazy vs active expiration?"** → Mỗi key lưu {{expireAt}}. Lazy: đọc key thì kiểm tra. Active: sample ngẫu nhiên key có TTL, xoá hết hạn; >25% hết hạn thì lặp lại.
- **"RDB và AOF khác gì, dùng cái nào?"** → RDB: snapshot định kỳ, khôi phục nhanh, mất dữ liệu từ snapshot cuối. AOF: ghi nối đuôi lệnh, {{everysec}} cân bằng. Production nên bật cả hai.
- **"Vì sao Redis LRU là approximated?"** → Không duyệt toàn bộ key (chậm). Lấy mẫu {{maxmemory-samples}} key (mặc định 5), đuổi key cũ nhất trong mẫu. Trade-off CPU vs độ chính xác.
 `,
  exercises: [
    {
      title: 'MiniRedisCore: dictionary, TTL (fake clock), INCR atomic',
      prompt: `Cài {{MiniRedisCore}} — một key-value store đơn luồng mô phỏng cốt lõi Redis: dictionary (HashMap), TTL kiểm tra bằng **đồng hồ giả** {{Clock}}, và **INCR atomic** (đọc-cộng-ghi như một phép toán không thể bị ngắt).
 
 API:
 - {{MiniRedisCore(Clock clock)}}: nạp đồng hồ giả để test xác định.
 - {{String set(String key, String value, long ttlMs)}}: lưu value, gán hết hạn {{clock.millis() + ttlMs}} nếu {{ttlMs > 0}}; {{ttlMs <= 0}} nghĩa là vĩnh viễn (xoá expire). Trả {{"OK"}}.
 - {{String get(String key)}}: nếu key không tồn tại hoặc **đã hết hạn** ({{clock.millis() >= expireAt}}) thì xoá entry và trả {{null}}; ngược lại trả value.
 - {{long incr(String key)}}: **atomic increment**. Nếu key không tồn tại hoặc hết hạn -> coi như 0, set thành 1, trả 1. Nếu value không parse được thành long -> ném {{NumberFormatException}}. Toàn bộ đọc-cộng-ghi phải là một bước duy nhất (không cho phép lệnh khác xen vào giữa — mô phỏng bằng việc không có lệnh khác chạy song song trong bài test đơn luồng, nhưng code phải viết gộp logic).
 - {{long ttl(String key)}}: trả mili giây còn lại trước khi hết hạn; key không tồn tại trả -2; key vĩnh viễn trả -1; đã hết hạn (chưa bị dọn) trả -2 sau khi dọn.
 - {{void flush()}}: xoá toàn bộ dữ liệu.
 
 Không dùng thread, không sleep. Cùng input + clock sequence luôn cho cùng output.`,
      starter: `import java.time.Clock;
 import java.util.*;
 
 class MiniRedisCore {
     private final Map<String, String> data = new HashMap<>();
     private final Map<String, Long> expires = new HashMap<>();
     private final Clock clock;
 
     MiniRedisCore(Clock clock) {
         this.clock = clock;
     }
 
     String set(String key, String value, long ttlMs) {
         throw new UnsupportedOperationException("TODO");
     }
 
     String get(String key) {
         throw new UnsupportedOperationException("TODO");
     }
 
     long incr(String key) {
         throw new UnsupportedOperationException("TODO");
     }
 
     long ttl(String key) {
         throw new UnsupportedOperationException("TODO");
     }
 
     void flush() {
         throw new UnsupportedOperationException("TODO");
     }
 }
 `,
      tests: `import java.time.*;
 import java.util.*;
 
 public class Main {
     static int p = 0, t = 0;
     static void c(String name, Runnable r) {
         t++;
         try { r.run(); p++; System.out.println("PASS " + name); }
         catch (Throwable e) { System.out.println("FAIL " + name + ": " + e); }
     }
     static void eq(Object expected, Object actual) {
         if (!Objects.equals(expected, actual)) throw new AssertionError("expected " + expected + " but got " + actual);
     }
 
     static class FixedClock extends Clock {
         long now = 0;
         public ZoneId getZone() { return ZoneOffset.UTC; }
         public Clock withZone(ZoneId zone) { return this; }
         public Instant instant() { return Instant.ofEpochMilli(now); }
         public long millis() { return now; }
     }
 
     public static void main(String[] args) {
         c("set/get basic with TTL", () -> {
             FixedClock clock = new FixedClock();
             MiniRedisCore r = new MiniRedisCore(clock);
             eq("OK", r.set("k", "v", 1_000));
             eq("v", r.get("k"));
             clock.now = 999;
             eq("v", r.get("k"));
             clock.now = 1_000;
             eq(null, r.get("k"));
             eq(-2L, r.ttl("k"));
         });
 
         c("incr creates key at 1", () -> {
             FixedClock clock = new FixedClock();
             MiniRedisCore r = new MiniRedisCore(clock);
             eq(1L, r.incr("counter"));
             eq(2L, r.incr("counter"));
             eq("2", r.get("counter"));
         });
 
         c("incr on expired key restarts at 1", () -> {
             FixedClock clock = new FixedClock();
             MiniRedisCore r = new MiniRedisCore(clock);
             r.set("counter", "5", 100);
             clock.now = 200;
             eq(1L, r.incr("counter"));
             eq("1", r.get("counter"));
         });
 
         c("incr non-numeric throws", () -> {
             FixedClock clock = new FixedClock();
             MiniRedisCore r = new MiniRedisCore(clock);
             r.set("k", "abc", 0);
             boolean threw = false;
             try { r.incr("k"); } catch (NumberFormatException e) { threw = true; }
             if (!threw) throw new AssertionError("expected NumberFormatException");
         });
 
         c("ttl returns remaining ms, -1 for no expiry, -2 for missing/expired", () -> {
             FixedClock clock = new FixedClock();
             MiniRedisCore r = new MiniRedisCore(clock);
             r.set("perm", "v", 0);
             r.set("temp", "v", 5_000);
             eq(-1L, r.ttl("perm"));
             clock.now = 2_000;
             eq(3_000L, r.ttl("temp"));
             clock.now = 6_000;
             eq(-2L, r.ttl("temp"));
             eq(-2L, r.ttl("missing"));
         });
 
         c("flush clears everything", () -> {
             FixedClock clock = new FixedClock();
             MiniRedisCore r = new MiniRedisCore(clock);
             r.set("a", "1", 0);
             r.incr("b");
             r.flush();
             eq(null, r.get("a"));
             eq(-2L, r.ttl("b"));
         });
 
         System.out.println("RESULT " + p + "/" + t);
     }
 }
 `,
      reference: `import java.time.Clock;
 import java.util.*;
 
 class MiniRedisCore {
     private final Map<String, String> data = new HashMap<>();
     private final Map<String, Long> expires = new HashMap<>();
     private final Clock clock;
 
     MiniRedisCore(Clock clock) {
         this.clock = clock;
     }
 
     String set(String key, String value, long ttlMs) {
         data.put(key, value);
         if (ttlMs > 0) expires.put(key, clock.millis() + ttlMs);
         else expires.remove(key);
         return "OK";
     }
 
     String get(String key) {
         if (isExpired(key)) {
             data.remove(key);
             expires.remove(key);
             return null;
         }
         return data.get(key);
     }
 
     long incr(String key) {
         // Atomic: read-increment-write as one logical step
         long now = clock.millis();
         Long exp = expires.get(key);
         if (exp != null && now >= exp) {
             // expired: treat as missing
             data.remove(key);
             expires.remove(key);
         }
         String cur = data.get(key);
         long val = (cur == null) ? 0 : Long.parseLong(cur);
         val++;
         data.put(key, String.valueOf(val));
         return val;
     }
 
     long ttl(String key) {
         Long exp = expires.get(key);
         if (exp == null) {
             // no expiry set, but key might not exist
             return data.containsKey(key) ? -1L : -2L;
         }
         long now = clock.millis();
         if (now >= exp) {
             // expired but not yet cleaned by get/incr
             data.remove(key);
             expires.remove(key);
             return -2L;
         }
         return exp - now;
     }
 
     void flush() {
         data.clear();
         expires.clear();
     }
 
     private boolean isExpired(String key) {
         Long exp = expires.get(key);
         if (exp == null) return false;
         if (clock.millis() >= exp) {
             // will be cleaned by caller
             return true;
         }
         return false;
     }
 }
 `,
      hints: [
        'Dùng hai HashMap: data lưu value, expires lưu expireAt (ms từ epoch). Clock giả giúp test TTL xác định từng ms.',
        'get/incr/ttl đều phải kiểm tra hết hạn (now >= expireAt) và dọn entry nếu đã hết hạn (lazy expiration).',
        'incr: parseLong value hiện tại (0 nếu missing/expired), cộng 1, lưu lại chuỗi, trả về long mới. Toàn bộ trong một method -> atomic ở mức đơn luồng.',
        'ttl: key không tồn tại -2; vĩnh viễn (expires không có key) -1; còn lại exp - now.'
      ],
      explain: `MiniRedisCore gói gọn ba ý cốt lõi của Redis: (1) **Dictionary O(1)** bằng HashMap; (2) **TTL lazy expiration** — chỉ kiểm tra khi truy cập, dùng Clock giả để test xác định; (3) **INCR atomic** — đọc, cộng, ghi trong một bước logic, không cho phép lệnh khác xen vào (đơn luồng đảm bảo điều này tự nhiên).
 
 Đơn giản hoá so với Redis thật: không có RESP protocol, không có replication, không có AOF/RDB, không có eviction, không có Sorted Set/Hash/List/Set type system (chỉ String), không có client connection handling. Redis thật dùng SDS (Simple Dynamic String) để tránh realloc, dictionary dùng dict.c (hash table rehash dần), event loop dùng epoll/kqueue, INCR dùng long long và check overflow.
 
 Lỗi hay gặp khi tự viết:
 - Quên dọn entry hết hạn trong get/incr/ttl -> key "ma" vẫn trả value hoặc cản trở incr.
 - TTL trả giá trị âm sai (ví dụ key vĩnh viễn trả 0 thay vì -1).
 - incr không parse long mà cộng chuỗi -> "5" + 1 = "51".
 - Clock dùng System.currentTimeMillis() -> test flaky, không xác định.`
    }
  ],
  check: [
    {
      q: 'Tại sao Redis đơn luồng vẫn đạt throughput cao?',
      options: [
        'Vì nó dùng nhiều CPU core ngầm',
        'Vì không có lock contention, context switch, và O(1) hash table tận dụng CPU cache tốt',
        'Vì nó viết bằng C nên nhanh hơn Java',
        'Vì nó không bền dữ liệu'
      ],
      answer: 1,
      explain: 'Single thread loại bỏ chi phí khóa và chuyển ngữ cảnh; event loop + hash table O(1) + RAM = độ trễ sub-ms. Đa luồng thêm overhead chứ không nhất thiết nhanh hơn cho workload in-memory đơn giản.'
    },
    {
      q: 'Lệnh {{KEYS *}} trên 10 triệu key gây ra hiện tượng gì?',
      options: [
        'Chỉ chậm client gửi lệnh đó, client khác không ảnh hưởng',
        'Chặn event loop, toàn bộ server bị treo vài giây, mọi client khác timeout',
        'Tự động chuyển sang SCAN',
        'Chỉ làm chậm replication'
      ],
      answer: 1,
      explain: 'Redis chỉ có một main thread. KEYS * quét O(N) keyspace, chiếm thread vài giây -> mọi lệnh khác (GET, INCR...) phải xếp hàng chờ.'
    },
    {
      q: 'Khi nào nên dùng Sorted Set (ZSET) thay vì List cho bảng xếp hạng?',
      options: [
        'Khi cần đẩy/pop nhanh ở hai đầu',
        'Khi cần xếp hạng theo điểm (score), cập nhật điểm thường xuyên, lấy top N / rank của một member',
        'Khi dữ liệu chỉ thêm, không bao giờ sửa',
        'Khi cần duy nhất hóa phần tử'
      ],
      answer: 1,
      explain: 'ZSET dùng skip list + hash table: ZADD/ZINCRBY O(log N), ZRANGE/ZREVRANGE top N, ZRANK rank của member. List chỉ phù hợp queue/log theo thứ tự thời gian.'
    },
    {
      q: 'Redis TTL lazy expiration hoạt động ra sao?',
      options: [
        'Một thread nền quét toàn bộ key mỗi giây và xoá hết hạn',
        'Chỉ khi client truy cập key (GET/INCR/TTL...), Redis mới so sánh now với expireAt và xoá nếu đã hết hạn',
        'Key hết hạn tự biến mất ngay lập tức tại expireAt',
        'Chỉ kiểm tra khi SAVE/BGSAVE'
      ],
      answer: 1,
      explain: 'Lazy expiration: không tốn CPU quét liên tục; chỉ dọn khi có ai đọc key. Active expiration bổ sung bằng cách sample ngẫu nhiên key có TTL để dọn key không ai đọc.'
    }
  ],
  related: ['db-016', 'db-017', 'concurrency-030'],
  tags: ['Redis', 'in-memory', 'single-threaded', 'TTL', 'eviction', 'persistence', 'Sorted Set']
},
{
  id: 'lesson-db-019',
  track: 'db',
  order: 19,
  title: 'Xây mini key-value store: BlockingQueue lệnh, TTL, INCR atomic, test xác định',
  level: 'senior',
  minutes: 45,
  goals: [
    'Hiểu kiến trúc single-threaded command processor qua BlockingQueue',
    'Cài TTL với Clock giả và lazy expiration',
    'Cài INCR atomic (compare-and-set logic) trong đơn luồng',
    'Viết test xác định (deterministic) không phụ thuộc thread timing'
  ],
body: `**Tóm tắt:** Bài học này dẫn dắt bạn xây một **mini key-value store** mô phỏng Redis cốt lõi: một luồng worker duy nhất lấy lệnh từ {{BlockingQueue}}, thực thi lần lượt (SET, GET, INCR, TTL, FLUSH), và trả kết quả cho client qua {{CompletableFuture}}. Kiến trúc này chính là mẫu **actor / single-threaded event loop** — nền tảng của Redis, Netty, Disruptor, và nhiều hệ thống cao tải.

### Vì sao single-threaded + queue?
Đa luồng truy cập shared state (HashMap) cần khóa (lock) hoặc {{ConcurrentHashMap}} — vẫn có cache line bouncing, false sharing, và độ trễ không xác định. **Một luồng duy nhất** sở hữu state, không bao giờ cần khóa, code đơn giản, dễ suy luận, và throughput cao nhờ locality.

Client gửi lệnh (Command object) vào {{BlockingQueue}}. Worker thread vòng lặp {{take()}}, thực thi, {{complete()}} future. Client {{join()}} đợi kết quả.
 
 ~~~seq
 title: Client -> Queue -> Worker -> Response
 actors: Client A | BlockingQueue | Worker | Client B
 Client A -> BlockingQueue: put(SET k v)
 Client B -> BlockingQueue: put(GET k)
 Worker -> BlockingQueue: take() -> SET k v
 Worker -> Worker: exec SET, complete future A
 Worker -> BlockingQueue: take() -> GET k
 Worker -> Worker: exec GET, complete future B
 ~~~
 
### Command pattern và CompletableFuture
Mỗi lệnh là một {{record}} (Java 16+) hoặc class immutable:
 
 ~~~java
 sealed interface Command permits SetCmd, GetCmd, IncrCmd, TtlCmd, FlushCmd { }
 record SetCmd(String key, String value, long ttlMs, CompletableFuture<String> result) implements Command { }
 record GetCmd(String key, CompletableFuture<String> result) implements Command { }
 record IncrCmd(String key, CompletableFuture<Long> result) implements Command { }
 record TtlCmd(String key, CompletableFuture<Long> result) implements Command { }
 record FlushCmd(CompletableFuture<Void> result) implements Command { }
 ~~~
 
 Worker loop:
 
 ~~~java
 void run() {
     while (!Thread.currentThread().isInterrupted()) {
         try {
             Command cmd = queue.take();
             switch (cmd) {
                 case SetCmd c -> c.result.complete(doSet(c.key, c.value, c.ttlMs));
                 case GetCmd c -> c.result.complete(doGet(c.key));
                 case IncrCmd c -> c.result.complete(doIncr(c.key));
                 case TtlCmd c -> c.result.complete(doTtl(c.key));
                 case FlushCmd c -> { doFlush(); c.result.complete(null); }
             }
         } catch (InterruptedException e) {
             Thread.currentThread().interrupt(); break;
         } catch (Throwable e) {
             // completeExceptionally cho future tương ứng nếu cần
         }
     }
 }
 ~~~
 
### TTL với Clock giả (fake clock)
Để test xác định, **không bao giờ dùng {{System.currentTimeMillis()}}** trong logic. Thay vào đó, inject {{java.time.Clock}}:

~~~java
interface TimeSource { long millis(); }
// Production: () -> System.currentTimeMillis()
// Test: new TimeSource() { long now=0; public long millis(){return now;} }
~~~

Mỗi entry lưu {{expireAt}} (ms). {{GET}}/{{INCR}}/{{TTL}} kiểm tra {{clock.millis() >= expireAt}} -> coi như hết hạn, lazy delete.

### INCR atomic trong đơn luồng
Vì chỉ có một worker thread, **toàn bộ method {{doIncr}} chạy không bị ngắt quãng** (no preemption giữa các lệnh Java bytecode trong một thread trừ khi freiwillig yield). Do đó logic đọc-parse-cộng-ghi-lưu là **atomic** theo mặc định — không cần {{synchronized}}, không cần {{AtomicLong}}, không cần CAS.
 
 ~~~java
 long doIncr(String key) {
     if (isExpired(key)) { data.remove(key); expires.remove(key); }
     String cur = data.get(key);
     long val = (cur == null) ? 0 : Long.parseLong(cur);
     val++;
     data.put(key, String.valueOf(val));
     return val;
 }
 ~~~
 
Nếu chuyển sang đa luồng, cần {{ConcurrentHashMap.compute(key, (k, v) -> ...)}} hoặc {{LongAdder}} cho counter riêng, nhưng đơn luồng thì logic tuần tự đã đủ an toàn.

### Test xác định (deterministic)
Test **không dùng {{Thread.sleep}}**, **không dùng real clock**, **không spawn thread worker thật** (hoặc spawn nhưng điều khiển bằng {{CountDownLatch}}/{{CompletableFuture}} để thứ tự thực thi cố định). Thay vào đó:

1. Khởi tạo {{FixedClock}} (clock giả).
2. Khởi tạo store + worker (có thể chạy inline trong test thread cho đơn giản).
3. Gửi lệnh, {{join()}} future, kiểm tra kết quả.
4. Tiến {{clock.now}} theo ý muốn, gửi lệnh tiếp, kiểm tra TTL/expiration.

Cùng input + clock sequence -> cùng output. Không flaky.

### Cơ chế từng bước: từ client đến worker
1. Client tạo {{CompletableFuture}} và {{Command}} object, {{queue.put(cmd)}}.
2. Worker {{queue.take()}} (block cho đến khi có lệnh).
3. Worker {{switch}} trên loại lệnh, gọi handler.
4. Handler đọc/ghi {{data}} + {{expires}} map, dùng {{clock.millis()}}.
5. Handler {{future.complete(value)}} hoặc {{completeExceptionally(err)}}.
6. Client {{future.join()}} nhận kết quả.

Toàn bộ không có {{synchronized}}, không có {{Lock}}, không có {{volatile}} (trừ {{queue}} internal). Độ trễ = queue wait + handler time.
 
 ~~~java
 // Mini store hoàn chỉnh cho bài tập
 class MiniKVStore {
     private final BlockingQueue<Command> queue = new LinkedBlockingQueue<>();
     private final Map<String, String> data = new HashMap<>();
     private final Map<String, Long> expires = new HashMap<>();
     private final Clock clock;
     private final Thread worker;
 
     MiniKVStore(Clock clock) {
         this.clock = clock;
         this.worker = new Thread(this::loop, "kv-worker");
         this.worker.start();
     }
 
     private void loop() {
         while (!Thread.interrupted()) {
             try {
                 Command cmd = queue.take();
                 exec(cmd);
             } catch (InterruptedException e) { Thread.currentThread().interrupt(); break; }
         }
     }
 
     private void exec(Command cmd) {
         if (cmd instanceof SetCmd c) c.result.complete(doSet(c.key, c.value, c.ttlMs));
         else if (cmd instanceof GetCmd c) c.result.complete(doGet(c.key));
         else if (cmd instanceof IncrCmd c) c.result.complete(doIncr(c.key));
         else if (cmd instanceof TtlCmd c) c.result.complete(doTtl(c.key));
         else if (cmd instanceof FlushCmd c) { doFlush(); c.result.complete(null); }
     }
 
     String doSet(String key, String value, long ttlMs) {
         data.put(key, value);
         if (ttlMs > 0) expires.put(key, clock.millis() + ttlMs);
         else expires.remove(key);
         return "OK";
     }
 
     String doGet(String key) {
         if (isExpired(key)) { data.remove(key); expires.remove(key); return null; }
         return data.get(key);
     }
 
     long doIncr(String key) {
         if (isExpired(key)) { data.remove(key); expires.remove(key); }
         String cur = data.get(key);
         long val = (cur == null) ? 0 : Long.parseLong(cur);
         val++;
         data.put(key, String.valueOf(val));
         return val;
     }
 
     long doTtl(String key) {
         Long exp = expires.get(key);
         if (exp == null) return data.containsKey(key) ? -1L : -2L;
         long now = clock.millis();
         if (now >= exp) { data.remove(key); expires.remove(key); return -2L; }
         return exp - now;
     }
 
     void doFlush() { data.clear(); expires.clear(); }
 
     boolean isExpired(String key) {
         Long exp = expires.get(key);
         return exp != null && clock.millis() >= exp;
     }
 
     void shutdown() { worker.interrupt(); }
 
     // Client API
     CompletableFuture<String> set(String key, String value, long ttlMs) {
         var f = new CompletableFuture<String>();
         queue.add(new SetCmd(key, value, ttlMs, f));
         return f;
     }
     CompletableFuture<String> get(String key) {
         var f = new CompletableFuture<String>();
         queue.add(new GetCmd(key, f));
         return f;
     }
     CompletableFuture<Long> incr(String key) {
         var f = new CompletableFuture<Long>();
         queue.add(new IncrCmd(key, f));
         return f;
     }
     CompletableFuture<Long> ttl(String key) {
         var f = new CompletableFuture<Long>();
         queue.add(new TtlCmd(key, f));
         return f;
     }
     CompletableFuture<Void> flush() {
         var f = new CompletableFuture<Void>();
         queue.add(new FlushCmd(f));
         return f;
     }
 }
 ~~~
 
### Tự thử trên máy
 Chạy test unit (không cần Docker) để thấy single-threaded queue xử lý lệnh lần lượt:
 
 ~~~bash
 # Biên dịch và chạy test (giả sử file MiniKVStoreTest.java đã có)
 javac MiniKVStoreTest.java
 java MiniKVStoreTest
 ~~~
 
 Kết quả mong đợi:
 
 ~~~text
 PASS set/get basic with TTL
 PASS incr creates key at 1
 PASS incr on expired key restarts at 1
 PASS incr non-numeric throws NumberFormatException
 PASS ttl returns -1 for no expiry, -2 for missing/expired, remaining ms for valid
 PASS flush clears everything
 PASS concurrent clients serialized by queue
 PASS expired key lazy deleted on next access
 RESULT 8/8
 ~~~
 
### Lỗi hay gặp
1. **Dùng {{System.currentTimeMillis()}} trong logic** -> test không xác định, flaky trên CI chậm. Luôn inject {{Clock}} hoặc {{TimeSource}}.
2. **Worker thread không handle {{InterruptedException}} đúng** -> {{interrupt()}} không dừng được, test treo ở {{shutdown()}}. Phải {{Thread.currentThread().interrupt(); break;}}.
3. **Quên {{completeExceptionally}} khi handler ném lỗi** -> client {{join()}} treo mãi. Luôn try-catch trong {{exec()}} và {{completeExceptionally}}.
4. **INCR parse Long không xử lý null/expired** -> NPE hoặc {{NumberFormatException}} sai chỗ. Check expired trước, missing thì coi như 0.
5. **Test spawn worker thật nhưng không chờ worker kịp xử lý** -> race condition test. Dùng {{CompletableFuture.join()}} để đồng bộ, hoặc chạy worker inline trong test thread (đơn giản hơn).
6. **{{BlockingQueue}} {{add}} vs {{put}}**: {{add}} ném exception khi đầy (unbounded {{LinkedBlockingQueue}} không bao giờ đầy), {{put}} block. Với unbounded queue, {{add}} an toàn và không block client.
 
### Tóm lại 3 ý
 1. **Single-threaded worker + BlockingQueue** = actor model: state bị đóng gói, không lock, throughput cao, code dễ đúng.
 2. **Clock giả (fake clock)** là chìa khóa test TTL/expiration xác định; không bao giờ dùng real clock trong logic.
 3. **INCR atomic** nhờ đơn luồng: đọc-parse-cộng-ghi trong một method không bị ngắt; đa luồng mới cần CAS/ConcurrentHashMap.compute.
 
### Liên hệ phỏng vấn
- **"Tại sao Redis dùng single thread mà không dùng multi-thread?"** → Tránh lock contention, context switch, cache line bouncing; event loop + O(1) hash table đủ nhanh cho in-memory. Multi-thread thêm phức tạp và overhead cho workload này.
- **"BlockingQueue trong kiến trúc actor/event loop đóng vai trò gì?"** → Hàng đợi lệnh (command queue), tách producer (client) và consumer (worker), bảo chứng tuần tự hóa, backpressure tự nhiên khi queue đầy (nếu bounded).
- **"Làm sao test TTL xác định không flaky?"** → Inject {{Clock}}/{{TimeSource}} interface; test dùng {{FixedClock}} tiến thời gian thủ công ({{clock.now += 1000}}).
- **"INCR trong Redis atomic như thế nào? Đơn luồng có đủ không?"** → Đơn luồng: một lệnh chạy hết mới đến lệnh sau, nên đọc-cộng-ghi không bị ngắt. Đa luồng (ví dụ client library pipeline) thì Redis dùng Lua script hoặc command atomic để đảm bảo.
- **"Worker thread bị exception thì sao? Client treo không?"** → Phải {{try-catch}} trong loop {{exec()}}, {{future.completeExceptionally(e)}} để client nhận lỗi và không treo {{join()}}.
 `,
exercises: [
    {
      title: 'MiniKVStore: BlockingQueue worker, TTL (fake clock), INCR atomic',
      prompt: `Cài {{MiniKVStore}} — key-value store đơn luồng với worker thread lấy lệnh từ {{BlockingQueue}}, hỗ trợ SET, GET, INCR, TTL, FLUSH. Mỗi lệnh trả {{CompletableFuture}} để client chờ kết quả.

Yêu cầu:
- Constructor {{MiniKVStore(Clock clock)}}: nạp đồng hồ giả, khởi động worker thread tên {{"kv-worker"}}.
- {{CompletableFuture<String> set(String key, String value, long ttlMs)}}: lưu value, TTL ms (>0 có hạn, <=0 vĩnh viễn). Trả future complete {{"OK"}}.
- {{CompletableFuture<String> get(String key)}}: trả future complete value hoặc {{null}} (missing/expired). Hết hạn thì lazy delete.
- {{CompletableFuture<Long> incr(String key)}}: **atomic increment**. Missing/expired -> coi như 0, set 1, trả 1. Value không parse long -> future complete exceptionally {{NumberFormatException}}.
- {{CompletableFuture<Long> ttl(String key)}}: trả future complete: -2 (missing/expired), -1 (vĩnh viễn), ms còn lại (valid). Hết hạn thì lazy delete.
- {{CompletableFuture<Void> flush()}}: xoá toàn bộ, trả future complete {{null}}.
- {{void shutdown()}}: interrupt worker thread, chờ kết thúc (join với timeout).

Command objects: dùng {{record}} (Java 16+) hoặc class immutable. Queue: {{LinkedBlockingQueue<Command>}} unbounded.
Worker loop (code block để tránh nested braces trong inline code):

~~~java
while (!Thread.currentThread().isInterrupted()) {
    Command c = queue.take();
    exec(c);
}
~~~

với try-catch {{InterruptedException}} -> interrupt lại và break; catch {{Throwable}} -> {{completeExceptionally}} future tương ứng.

Không dùng {{synchronized}}, {{Lock}}, {{Atomic*}}, {{ConcurrentHashMap}} cho data/expires (worker đơn luồng sở hữu state). Chỉ {{queue}} là thread-safe.`,
      starter: `import java.time.Clock;
 import java.util.*;
 import java.util.concurrent.*;
 
 class MiniKVStore {
     private final BlockingQueue<Command> queue = new LinkedBlockingQueue<>();
     private final Map<String, String> data = new HashMap<>();
     private final Map<String, Long> expires = new HashMap<>();
     private final Clock clock;
     private final Thread worker;
 
     MiniKVStore(Clock clock) {
         this.clock = clock;
         this.worker = new Thread(this::loop, "kv-worker");
         this.worker.start();
     }
 
     private void loop() {
         throw new UnsupportedOperationException("TODO");
     }
 
     private void exec(Command cmd) {
         throw new UnsupportedOperationException("TODO");
     }
 
     // Handlers
     private String doSet(String key, String value, long ttlMs) { throw new UnsupportedOperationException("TODO"); }
     private String doGet(String key) { throw new UnsupportedOperationException("TODO"); }
     private long doIncr(String key) { throw new UnsupportedOperationException("TODO"); }
     private long doTtl(String key) { throw new UnsupportedOperationException("TODO"); }
     private void doFlush() { throw new UnsupportedOperationException("TODO"); }
     private boolean isExpired(String key) { throw new UnsupportedOperationException("TODO"); }
 
     // Client API
     public CompletableFuture<String> set(String key, String value, long ttlMs) { throw new UnsupportedOperationException("TODO"); }
     public CompletableFuture<String> get(String key) { throw new UnsupportedOperationException("TODO"); }
     public CompletableFuture<Long> incr(String key) { throw new UnsupportedOperationException("TODO"); }
     public CompletableFuture<Long> ttl(String key) { throw new UnsupportedOperationException("TODO"); }
     public CompletableFuture<Void> flush() { throw new UnsupportedOperationException("TODO"); }
 
     public void shutdown() throws InterruptedException { throw new UnsupportedOperationException("TODO"); }
 
     sealed interface Command permits SetCmd, GetCmd, IncrCmd, TtlCmd, FlushCmd { }
     record SetCmd(String key, String value, long ttlMs, CompletableFuture<String> result) implements Command { }
     record GetCmd(String key, CompletableFuture<String> result) implements Command { }
     record IncrCmd(String key, CompletableFuture<Long> result) implements Command { }
     record TtlCmd(String key, CompletableFuture<Long> result) implements Command { }
     record FlushCmd(CompletableFuture<Void> result) implements Command { }
 }
 `,
      tests: `import java.time.*;
 import java.util.*;
 import java.util.concurrent.*;
 
 public class Main {
     static int p = 0, t = 0;
     static void c(String name, Runnable r) {
         t++;
         try { r.run(); p++; System.out.println("PASS " + name); }
         catch (Throwable e) { System.out.println("FAIL " + name + ": " + e); }
     }
     static void eq(Object expected, Object actual) {
         if (!Objects.equals(expected, actual)) throw new AssertionError("expected " + expected + " but got " + actual);
     }
 
     static class FixedClock extends Clock {
         long now = 0;
         public ZoneId getZone() { return ZoneOffset.UTC; }
         public Clock withZone(ZoneId zone) { return this; }
         public Instant instant() { return Instant.ofEpochMilli(now); }
         public long millis() { return now; }
     }
 
     public static void main(String[] args) throws Exception {
         c("set/get basic with TTL", () -> {
             FixedClock clock = new FixedClock();
             try (var store = new AutoCloseableMiniKVStore(clock)) {
                 eq("OK", store.set("k", "v", 1_000).join());
                 eq("v", store.get("k").join());
                 clock.now = 999;
                 eq("v", store.get("k").join());
                 clock.now = 1_000;
                 eq(null, store.get("k").join());
             }
         });
 
         c("incr creates key at 1", () -> {
             FixedClock clock = new FixedClock();
             try (var store = new AutoCloseableMiniKVStore(clock)) {
                 eq(1L, store.incr("counter").join());
                 eq(2L, store.incr("counter").join());
                 eq("2", store.get("counter").join());
             }
         });
 
         c("incr on expired key restarts at 1", () -> {
             FixedClock clock = new FixedClock();
             try (var store = new AutoCloseableMiniKVStore(clock)) {
                 store.set("counter", "5", 100).join();
                 clock.now = 200;
                 eq(1L, store.incr("counter").join());
                 eq("1", store.get("counter").join());
             }
         });
 
         c("incr non-numeric throws NumberFormatException", () -> {
             FixedClock clock = new FixedClock();
             try (var store = new AutoCloseableMiniKVStore(clock)) {
                 store.set("k", "abc", 0).join();
                 boolean threw = false;
                 try { store.incr("k").join(); } catch (CompletionException e) {
                     if (e.getCause() instanceof NumberFormatException) threw = true;
                 }
                 if (!threw) throw new AssertionError("expected NumberFormatException");
             }
         });
 
         c("ttl returns -1 (no expiry), -2 (missing/expired), remaining ms (valid)", () -> {
             FixedClock clock = new FixedClock();
             try (var store = new AutoCloseableMiniKVStore(clock)) {
                 store.set("perm", "v", 0).join();
                 store.set("temp", "v", 5_000).join();
                 eq(-1L, store.ttl("perm").join());
                 clock.now = 2_000;
                 eq(3_000L, store.ttl("temp").join());
                 clock.now = 6_000;
                 eq(-2L, store.ttl("temp").join());
                 eq(-2L, store.ttl("missing").join());
             }
         });
 
         c("flush clears everything", () -> {
             FixedClock clock = new FixedClock();
             try (var store = new AutoCloseableMiniKVStore(clock)) {
                 store.set("a", "1", 0).join();
                 store.incr("b").join();
                 store.flush().join();
                 eq(null, store.get("a").join());
                 eq(-2L, store.ttl("b").join());
             }
         });
 
         c("concurrent clients serialized by queue", () -> {
             FixedClock clock = new FixedClock();
             try (var store = new AutoCloseableMiniKVStore(clock)) {
                 ExecutorService pool = Executors.newFixedThreadPool(8);
                 try {
                     List<CompletableFuture<Long>> futures = new ArrayList<>();
                     for (int i = 0; i < 50; i++) {
                         futures.add(store.incr("shared"));
                     }
                     CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();
                     for (var f : futures) eq(true, f.isDone());
                     eq("50", store.get("shared").join());
                 } finally {
                     pool.shutdownNow();
                 }
             }
         });
 
         c("expired key lazy deleted on next access", () -> {
             FixedClock clock = new FixedClock();
             try (var store = new AutoCloseableMiniKVStore(clock)) {
                 store.set("k", "v", 100).join();
                 clock.now = 200;
                 // expired but not yet accessed
                 eq(-2L, store.ttl("k").join()); // ttl also triggers lazy delete
                 eq(null, store.get("k").join());
                 // second get also null
                 eq(null, store.get("k").join());
             }
         });
 
         System.out.println("RESULT " + p + "/" + t);
     }
 
     // Helper để try-with-resources shutdown
     static class AutoCloseableMiniKVStore implements AutoCloseable {
         final MiniKVStore store;
         AutoCloseableMiniKVStore(Clock clock) { this.store = new MiniKVStore(clock); }
         CompletableFuture<String> set(String k, String v, long ttl) { return store.set(k, v, ttl); }
         CompletableFuture<String> get(String k) { return store.get(k); }
         CompletableFuture<Long> incr(String k) { return store.incr(k); }
         CompletableFuture<Long> ttl(String k) { return store.ttl(k); }
         CompletableFuture<Void> flush() { return store.flush(); }
         public void close() {
            try { store.shutdown(); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
        }
     }
 }
 `,
      reference: `import java.time.Clock;
 import java.util.*;
 import java.util.concurrent.*;
 
 class MiniKVStore {
     private final BlockingQueue<Command> queue = new LinkedBlockingQueue<>();
     private final Map<String, String> data = new HashMap<>();
     private final Map<String, Long> expires = new HashMap<>();
     private final Clock clock;
     private final Thread worker;
 
     MiniKVStore(Clock clock) {
         this.clock = clock;
         this.worker = new Thread(this::loop, "kv-worker");
         this.worker.start();
     }
 
     private void loop() {
         while (!Thread.interrupted()) {
             try {
                 Command cmd = queue.take();
                 exec(cmd);
             } catch (InterruptedException e) {
                 Thread.currentThread().interrupt();
                 break;
             }
         }
     }
 
     private void exec(Command cmd) {
         try {
             if (cmd instanceof SetCmd c) c.result.complete(doSet(c.key, c.value, c.ttlMs));
             else if (cmd instanceof GetCmd c) c.result.complete(doGet(c.key));
             else if (cmd instanceof IncrCmd c) c.result.complete(doIncr(c.key));
             else if (cmd instanceof TtlCmd c) c.result.complete(doTtl(c.key));
             else if (cmd instanceof FlushCmd c) { doFlush(); c.result.complete(null); }
         } catch (Throwable t) {
             if (cmd instanceof SetCmd c) c.result.completeExceptionally(t);
             else if (cmd instanceof GetCmd c) c.result.completeExceptionally(t);
             else if (cmd instanceof IncrCmd c) c.result.completeExceptionally(t);
             else if (cmd instanceof TtlCmd c) c.result.completeExceptionally(t);
             else if (cmd instanceof FlushCmd c) c.result.completeExceptionally(t);
         }
     }
 
     private String doSet(String key, String value, long ttlMs) {
         data.put(key, value);
         if (ttlMs > 0) expires.put(key, clock.millis() + ttlMs);
         else expires.remove(key);
         return "OK";
     }
 
     private String doGet(String key) {
         if (isExpired(key)) { data.remove(key); expires.remove(key); return null; }
         return data.get(key);
     }
 
     private long doIncr(String key) {
         if (isExpired(key)) { data.remove(key); expires.remove(key); }
         String cur = data.get(key);
         long val = (cur == null) ? 0 : Long.parseLong(cur);
         val++;
         data.put(key, String.valueOf(val));
         return val;
     }
 
     private long doTtl(String key) {
         Long exp = expires.get(key);
         if (exp == null) return data.containsKey(key) ? -1L : -2L;
         long now = clock.millis();
         if (now >= exp) { data.remove(key); expires.remove(key); return -2L; }
         return exp - now;
     }
 
     private void doFlush() {
         data.clear();
         expires.clear();
     }
 
     private boolean isExpired(String key) {
         Long exp = expires.get(key);
         return exp != null && clock.millis() >= exp;
     }
 
     public CompletableFuture<String> set(String key, String value, long ttlMs) {
         var f = new CompletableFuture<String>();
         queue.add(new SetCmd(key, value, ttlMs, f));
         return f;
     }
 
     public CompletableFuture<String> get(String key) {
         var f = new CompletableFuture<String>();
         queue.add(new GetCmd(key, f));
         return f;
     }
 
     public CompletableFuture<Long> incr(String key) {
         var f = new CompletableFuture<Long>();
         queue.add(new IncrCmd(key, f));
         return f;
     }
 
     public CompletableFuture<Long> ttl(String key) {
         var f = new CompletableFuture<Long>();
         queue.add(new TtlCmd(key, f));
         return f;
     }
 
     public CompletableFuture<Void> flush() {
         var f = new CompletableFuture<Void>();
         queue.add(new FlushCmd(f));
         return f;
     }
 
     public void shutdown() throws InterruptedException {
         worker.interrupt();
         worker.join(2000);
     }
 
     sealed interface Command permits SetCmd, GetCmd, IncrCmd, TtlCmd, FlushCmd { }
     record SetCmd(String key, String value, long ttlMs, CompletableFuture<String> result) implements Command { }
     record GetCmd(String key, CompletableFuture<String> result) implements Command { }
     record IncrCmd(String key, CompletableFuture<Long> result) implements Command { }
     record TtlCmd(String key, CompletableFuture<Long> result) implements Command { }
     record FlushCmd(CompletableFuture<Void> result) implements Command { }
 }
 `,
      hints: [
        'Worker loop: {{queue.take()}} block cho đến khi có lệnh; {{exec}} switch trên record type và complete future. Try-catch bao quanh exec để {{completeExceptionally}} nếu handler ném lỗi.',
        'Clock giả: test dùng {{FixedClock}} extends {{Clock}} với field {{now}} tự tăng. Logic chỉ dùng {{clock.millis()}} -> test xác định.',
        'INCR atomic: đơn luồng đảm bảo không lệnh khác xen vào giữa đọc-parse-cộng-ghi. Check expired trước, missing = 0, parseLong, ++, put, return.',
        'TTL: -2 missing/expired (và lazy delete), -1 vĩnh viễn (expires không có key), exp - now còn lại.',
        'shutdown: {{worker.interrupt(); worker.join(timeout);}}; loop bắt {{InterruptedException}}, {{interrupt()}} lại, {{break}}.'
      ],
      explain: `MiniKVStore minh hoạ **actor model / single-threaded event loop** — kiến trúc cốt lõi của Redis, Netty, Disruptor, Akka. Worker thread sở hữu state ({{data}}, {{expires}}), không bao giờ chia sẻ -> **không cần khóa**, không race condition, code đơn giản, throughput cao nhờ CPU cache locality.
 
{{BlockingQueue}} tách **producer** (client thread) và **consumer** (worker). Client {{queue.add(cmd)}} (non-blocking với unbounded queue) và {{future.join()}} đợi. Worker {{queue.take()}} block cho đến khi có việc. Thứ tự lệnh được bảo toàn (FIFO).

**Fake Clock** ({{Clock}} inject) là kỹ thuật bắt buộc để test TTL/expiration xác định. Production dùng {{Clock.systemUTC()}}; test dùng {{FixedClock}} tiến thời gian thủ công.

**INCR atomic** nhờ đơn luồng: toàn bộ {{doIncr}} chạy liên tục không bị preempt bởi lệnh khác (Java thread chỉ yield tại các điểm an toàn như I/O, lock, park; bytecode đơn giản không yield). Nếu chuyển sang đa luồng worker, cần {{ConcurrentHashMap.compute}} hoặc {{LongAdder}}.
 
 Đơn giản hoá so với Redis thật: không RESP protocol, không replication/pubsub, không Lua scripting, không cluster, không eviction, không AOF/RDB, chỉ String type. Redis thật dùng dict.c (rehashincremental), SDS, epoll/kqueue event loop, client output buffer.
 
 Lỗi hay gặp:
 - Quên {{completeExceptionally}} trong catch -> client {{join()}} treo vô hạn.
 - {{shutdown()}} không {{join}} -> test kết thúc trước worker dọn dẹp, resource leak.
 - Dùng {{System.currentTimeMillis()}} -> test flaky.
 - {{queue.put}} thay vì {{add}} (put block nếu bounded queue, add an toàn unbounded).
 - Không lazy delete trong ttl/get/incr -> key "ma" vẫn tồn tại, sai TTL và memory leak.`
    }
  ],
  check: [
    {
      q: 'Tại sao kiến trúc single-threaded worker + BlockingQueue không cần {{synchronized}} hay {{ConcurrentHashMap}} cho state?',
      options: [
        'Vì Java tự động thread-local cho HashMap',
        'Vì chỉ worker thread duy nhất truy cập state, không có chia sẻ -> không race condition',
        'Vì BlockingQueue đã xử lý đồng bộ hóa',
        'Vì HashMap an toàn khi chỉ đọc'
      ],
      answer: 1,
      explain: 'State (data, expires) bị sở hữu độc quyền bởi worker thread. Client chỉ giao tiếp qua queue và future. Không có truy cập đồng thời -> không cần khóa hay cấu trúc concurrent.'
    },
    {
      q: 'Fake Clock (Clock inject) giúp test TTL như thế nào?',
      options: [
        'Tăng tốc độ test 100 lần',
        'Cho phép test tiến thời gian thủ công (clock.now += 1000) để kiểm tra expiration xác định, không flaky',
        'Tự động mock System.currentTimeMillis()',
        'Giảm bộ nhớ test'
      ],
      answer: 1,
      explain: 'Test kiểm soát thời gian: set key TTL 1000ms, clock.now = 999 -> còn hạn; clock.now = 1000 -> hết hạn. Không phụ thuộc wall-clock, không Thread.sleep, không flaky trên CI chậm.'
    },
    {
      q: 'INCR trong đơn luồng được coi là atomic vì sao?',
      options: [
        'Vì dùng AtomicLong',
        'Vì worker thread chạy doIncr liên tục không bị ngắt bởi lệnh khác (FIFO queue), đọc-parse-cộng-ghi trong một method không yield',
        'Vì HashMap thread-safe',
        'Vì BlockingQueue khóa toàn bộ store'
      ],
      answer: 1,
      explain: 'Đơn luồng + FIFO queue đảm bảo không lệnh nào xen vào giữa các bytecode của doIncr. Atomic ở mức logic ứng dụng, không cần CAS hay synchronized.'
    },
    {
      q: 'Worker thread bị exception trong handler (ví dụ parseLong fail). Cách đúng để client không treo?',
      options: [
        'Bỏ qua exception, để future tự complete null',
        'Try-catch trong exec(), future.completeExceptionally(e) để client nhận lỗi qua join()',
        'Restart worker thread ngay lập tức',
        'Log và trả về giá trị mặc định'
      ],
      answer: 1,
      explain: 'Future không complete thì client join() treo mãi. Phải completeExceptionally với cause gốc để client xử lý (retry, fallback, log).'
    }
  ],
  related: ['db-018', 'db-016', 'db-017', 'concurrency-030'],
  tags: ['key-value-store', 'BlockingQueue', 'single-threaded', 'actor-model', 'fake-clock', 'atomic', 'CompletableFuture']
},
{
  id: 'lesson-db-020', track: 'db', order: 20,
  title: 'Write skew và SERIALIZABLE: vì sao REPEATABLE READ chưa đủ',
  level: 'senior', minutes: 30,
  goals: [
    'Mô tả write skew: hai transaction cùng đọc rồi ghi các hàng khác nhau, cùng commit làm vỡ invariant chung',
    'Phân biệt write skew với lost update và non-repeatable read',
    'Vì sao snapshot isolation (REPEATABLE READ) không chặn được write skew còn SERIALIZABLE (SSI) thì có',
    'Chọn cách sửa: SERIALIZABLE + retry, hoặc hiện thực hóa xung đột bằng hàng khóa chung'
  ],
  body: `**Tóm tắt:** Write skew là hiện tượng hai transaction cùng đọc một trạng thái, mỗi bên ra quyết định dựa trên trạng thái đó rồi ghi vào những hàng khác nhau, nhưng khi cả hai cùng commit thì một ràng buộc chung (invariant) bị phá vỡ — dù không transaction nào ghi đè dữ liệu của transaction kia. REPEATABLE READ (snapshot isolation) KHÔNG chặn được; phải dùng SERIALIZABLE (PostgreSQL dùng SSI) hoặc "hiện thực hóa xung đột" bằng một hàng khóa chung.

### Trước hết: invariant là gì
Invariant (bất biến) là điều luôn phải đúng về dữ liệu, nhưng không nằm gọn trong một hàng. Ví dụ: "mỗi ca trực phải có ít nhất một bác sĩ" (liên quan mọi hàng của bảng on_call), hoặc "tổng tiền của một khách không được âm" (liên quan nhiều giao dịch). Nó khác {{CHECK}} constraint trên một cột (như {{balance >= 0}}) vì CHECK chỉ nhìn một hàng; còn invariant kiểu này phải "nhìn" nhiều hàng cùng lúc. Đây chính là chỗ write skew sinh ra.

### Kịch bản kinh điển: hai bác sĩ trực
Bảng {{on_call(doctor_id, on_call)}} có hai bác sĩ A và B, hiện cả hai đang trực (invariant: ít nhất một người). Cả hai đều muốn tan ca sớm:
- T1 (A): đọc bảng, thấy A và B đang trực. A nghĩ "còn B trực, mình về được" nên đặt {{on_call = false}} cho A.
- T2 (B): đọc bảng, cũng thấy A và B đang trực. B nghĩ "còn A trực, mình về được" nên đặt {{on_call = false}} cho B.
- Cả hai commit. Kết quả: A off, B off, không còn ai trực. Invariant vỡ, mà không hề có ai ghi đè dữ liệu của ai.

~~~text
T1 (bác sĩ A)                     T2 (bác sĩ B)
|                                 |
|-- đọc: A trực, B trực --------->|   snapshot chung: còn 2 người
|                                 |-- đọc: A trực, B trực
|   A thấy B trực -> A tắt        |   B thấy A trực -> B tắt
|-- UPDATE A = off -------------->|
|-- COMMIT ----------------------->|   A off, còn B
|                                 |-- UPDATE B = off
|                                 |-- COMMIT
|  Kết quả: A off, B off -> 0 người trực (invariant vỡ)
~~~

### Vì sao đây không phải lost update
Lost update là hai transaction cùng đọc một giá trị rồi cùng ghi vào **cùng một ô**, người ghi sau đè người ghi trước (ví dụ cùng đọc balance 10, cùng ghi 11). Ở write skew, hai transaction **ghi vào các hàng khác nhau** (A ghi hàng A, B ghi hàng B) nên không có "ghi đè". Database không thấy xung đột ghi nào để chặn: mỗi hàng chỉ có một writer. Đó là lý do write skew khó hơn lost update và cần mức đảm bảo mạnh hơn.

### Vì sao REPEATABLE READ không cứu được
PostgreSQL REPEATABLE READ là **snapshot isolation**: mỗi transaction đọc từ một ảnh chụp (snapshot) lấy ở câu lệnh đầu, và khi ghi, nó chỉ chặn nếu có transaction khác đã sửa **cùng hàng** đó rồi commit sau snapshot (first-committer-wins). Trong kịch bản trên, A và B sửa hai hàng khác nhau, nên không kích hoạt chặn; cả hai cùng commit. Snapshot isolation bảo đảm đọc nhất quán và chặn lost update, nhưng không "hiểu" invariant liên quan nhiều hàng, nên write skew lọt qua. Muốn chặn, phải suy ra được rằng hai thay đổi này xung đột về mặt logic — điều chỉ SERIALIZABLE làm được.

### SERIALIZABLE (SSI) chặn bằng cách nào
PostgreSQL SERIALIZABLE dùng **SSI (Serializable Snapshot Isolation)**. Nó ghi lại các phụ thuộc đọc-ghi giữa các transaction: nếu T1 đọc một hàng mà T2 sửa (rw-conflict), SSI ghi nhận "T1 phụ thuộc T2". Khi các phụ thuộc tạo thành một cấu trúc nguy hiểm (dangerous structure: hai cạnh rw-conflict nối tiếp tạo thành chu trình), SSI kết luận không thể sắp thứ tự tuần tự mà vẫn giữ đúng kết quả, và **abort một transaction** với SQLSTATE 40001 (serialization_failure). Ứng dụng phải retry cả transaction. Điểm quan trọng: SSI chỉ abort khi thật sự có cấu trúc nguy hiểm; nó không hy sinh throughput một cách mù quáng như khóa toàn bộ bảng.

### Hiện thực hóa xung đột: một hàng khóa chung
Nếu không muốn dùng SERIALIZABLE, có thể **materialize the conflict** (hiện thực hóa xung đột): biến invariant thành một hàng dữ liệu thật để mọi transaction phải cùng ghi vào đó.
- Tạo bảng {{on_call_guard(day date primary key, ...)}} với đúng một hàng cho mỗi ca.
- Mỗi transaction trước khi tắt phiên phải {{UPDATE on_call_guard SET ... WHERE day = ...}} — thao tác này khóa hàng guard. Hai transaction cùng sửa hàng guard sẽ xung đột: một bên commit trước, bên kia chờ rồi thấy dữ liệu đã đổi.
- Cách khác: {{pg_advisory_xact_lock(key)}} lấy một khóa ở mức transaction cho ca đó; transaction thứ hai phải chờ và khi vào được thì đọc lại trạng thái mới.

~~~sql
-- Hiện thực hóa xung đột: mọi transaction cùng khóa một hàng guard cho ca trực
BEGIN;
-- Khóa các hàng của ca để không ai khác sửa xen vào
SELECT count(*) FILTER (WHERE on_call) AS busy FROM on_call WHERE day = :d FOR UPDATE;
-- Nếu busy - (thay đổi của chính mình) >= 1 thì được tắt, ngược lại hủy
UPDATE on_call SET on_call = false WHERE doctor_id = :me AND day = :d;
COMMIT;
~~~

### Bảng phân biệt ba hiện tượng
| Hiện tượng | Bản chất | Ai ghi đè ai | Mức chặn (PostgreSQL) |
|---|---|---|---|
| Lost update | Cùng đọc rồi cùng ghi một ô | Có, người sau đè người trước | REPEATABLE READ chặn (40001) |
| Write skew | Cùng đọc, ghi các hàng khác nhau, vỡ invariant chung | Không | Chỉ SERIALIZABLE chặn (40001) |
| Phantom read | Cùng một điều kiện range, hai lần đọc thấy số hàng khác | Không | REPEATABLE READ chặn |

### Cơ chế từng bước
1. **Hai transaction cùng bắt đầu và cùng đọc snapshot.** A và B đều thấy "còn 2 người trực".
2. **Mỗi bên kiểm invariant cục bộ.** A thấy "còn B" nên hợp lệ để tắt; B thấy "còn A" nên hợp lệ để tắt. Cả hai quyết định dựa trên cùng một snapshot.
3. **Mỗi bên ghi hàng của mình.** A ghi hàng A, B ghi hàng B — không hàng nào bị hai writer.
4. **Commit.** REPEATABLE READ không thấy xung đột ghi (khác hàng) nên cho cả hai commit, invariant vỡ.
5. **Với SERIALIZABLE**, SSI đã ghi nhận phụ thuộc đọc-ghi; khi phát hiện cấu trúc nguy hiểm, nó abort một bên. Transaction bị abort retry, lần này đọc trạng thái đã cập nhật và thấy không còn ai, nên không tắt nữa.

Vì sao lại như vậy? Snapshot isolation tối ưu cho đọc và cho xung đột ghi đơn hàng, nhưng invariant nhiều hàng cần một mức đảm bảo mạnh hơn — tuần tự hóa — và SSI đạt điều đó bằng cách phát hiện phụ thuộc thay vì khóa trước.

### Ví dụ đời thực
Một hệ thống đặt lịch trực 24/7 cho 5 kỹ sư. Một tối, hai kỹ sư A và B cùng bấm "kết thúc ca" gần như đồng thời. API dùng {{REPEATABLE READ}} và câu {{UPDATE on_call SET active = false WHERE user_id = ?}}. Cả hai cùng đọc "đang có 2 người trực", cùng thấy điều kiện "còn người khác" đúng, cùng commit. Hậu quả: 0 người trực suốt 2 giờ sáng, sự cố không ai xử lý. Điều tra: log cho thấy hai transaction start cách nhau 20 ms, cùng đọc snapshot lúc 02:00:01, cùng commit lúc 02:00:01. Sửa: đổi sang {{SERIALIZABLE}} cho thao tác đặt lịch và bọc retry 3 lần với backoff; hoặc thêm hàng guard khóa theo ngày. Sau khi sửa, tình huống tương tự: một transaction bị abort 40001, retry, thấy chỉ còn mình nên không tắt, ca trực vẫn có người. Số lần 40001 tăng nhẹ nhưng không còn sự cố "0 người trực".

### Lỗi hay gặp
1. **Tưởng REPEATABLE READ chặn mọi anomaly.** Triệu chứng: invariant nhiều hàng vẫn vỡ dù đã nâng isolation. Nguyên nhân: snapshot isolation chỉ chặn ghi đè cùng hàng. Sửa: dùng SERIALIZABLE cho invariant nhiều hàng, hoặc hiện thực hóa xung đột.
2. **SERIALIZABLE mà không retry.** Triệu chứng: request lỗi 40001 liên tục. Nguyên nhân: SSI abort là cơ chế bình thường, không phải sự cố. Sửa: retry có giới hạn với backoff; phân biệt conflict nghiệp vụ thật với serialization failure.
3. **Đọc-rồi-kiểm-rồi-ghi mà không khóa guard.** Triệu chứng: hai transaction cùng đọc "còn chỗ", cùng thêm. Nguyên nhân: khoảng giữa đọc và ghi không được bảo vệ. Sửa: guard row, advisory xact lock, hoặc SERIALIZABLE.

> Senior tip: write skew là lý do thật sự khiến "SERIALIZABLE chậm" trở nên đáng giá với nghiệp vụ tiền và lịch trực; hãy đo tỷ lệ 40001 và retry có backoff, đừng hạ isolation chỉ vì thấy vài abort.

### Liên hệ phỏng vấn
- **"Write skew là gì và khác lost update ra sao?"** → Write skew: hai transaction cùng đọc trạng thái, mỗi bên ghi hàng khác nhau, cùng commit làm vỡ invariant chung; không có ghi đè. Lost update: cùng ghi một ô, người sau đè người trước.
- **"REPEATABLE READ có chặn write skew không?"** → Không. Snapshot isolation chặn lost update và đọc không nhất quán, nhưng không suy ra được invariant nhiều hàng; cần SERIALIZABLE (SSI) hoặc khóa guard.
- **"SSI hoạt động thế nào?"** → Ghi phụ thuộc đọc-ghi, phát hiện cấu trúc nguy hiểm (chu trình), abort một transaction với 40001; ứng dụng retry.
- **"Khi nào dùng SERIALIZABLE thay vì READ COMMITTED?"** → Khi invariant liên quan nhiều hàng và không thể biểu diễn bằng CHECK; chấp nhận retry để đổi lấy đúng đắn.
`,
  exercises: [{
    title: 'Mô phỏng write skew và cách sửa bằng hàng khóa chung',
    prompt: `Mô phỏng hai transaction trên bảng trực {{on_call}} để thấy write skew. {{naiveBothOff(onCall)}} mô phỏng hai người cùng đọc một snapshot: mỗi người có ít nhất một người khác đang trực (tính theo snapshot) thì tắt phiên; cả hai cùng ghi rồi trả về số người còn trực (0 nghĩa là invariant bị phá). {{guardedBothOff(onCall)}} mô phỏng cách sửa bằng một hàng khóa chung: mỗi người đọc lại trạng thái mới nhất rồi chỉ tắt nếu vẫn còn ít nhất một người; trả về số người còn trực. Mảng {{boolean[]}} biểu diễn từng người có đang trực hay không; không dùng thread, lịch được mô phỏng tuần tự.`,
    starter: `class WriteSkewSim {
    // Mô phỏng write skew: mỗi người đọc cùng một snapshot rồi tự tắt phiên; cả hai cùng ghi.
    // Trả về số người còn trực sau khi cả hai commit (0 = anomaly: không còn ai trực).
    static int naiveBothOff(boolean[] onCall) {
        throw new UnsupportedOperationException("TODO");
    }

    // Mô phỏng cách sửa: hàng khóa chung tuần tự hoá, mỗi người đọc lại trạng thái mới nhất
    // và chỉ tắt phiên nếu vẫn còn ít nhất một người trực.
    static int guardedBothOff(boolean[] onCall) {
        throw new UnsupportedOperationException("TODO");
    }
}`,
    tests: `public class Main {
 static int p=0,t=0;
 static void c(String n,Runnable r){t++;try{r.run();p++;System.out.println("PASS "+n);}catch(Throwable e){System.out.println("FAIL "+n+": "+e);}}
 static void eq(int a,int b){if(a!=b)throw new AssertionError(a+" != "+b);}
 public static void main(String[]z){
  c("naive: two on-call both leave, zero remain",()->eq(0,WriteSkewSim.naiveBothOff(new boolean[]{true,true})));
  c("guarded: two on-call keep one",()->eq(1,WriteSkewSim.guardedBothOff(new boolean[]{true,true})));
  c("guarded: single doctor cannot be last to leave",()->eq(1,WriteSkewSim.guardedBothOff(new boolean[]{true})));
  c("naive: three on-call all leave",()->eq(0,WriteSkewSim.naiveBothOff(new boolean[]{true,true,true})));
  c("guarded: three on-call keep one",()->eq(1,WriteSkewSim.guardedBothOff(new boolean[]{true,true,true})));
  c("guarded: nobody on call stays zero",()->eq(0,WriteSkewSim.guardedBothOff(new boolean[]{false,false})));
  System.out.println("RESULT "+p+"/"+t);
 }
}`,
    reference: `class WriteSkewSim {
    static int naiveBothOff(boolean[] onCall) {
        int n = onCall.length;
        boolean[] after = onCall.clone();   // cả hai đọc cùng một snapshot gốc
        int total = count(onCall);
        for (int i = 0; i < n; i++) {
            int others = total - (onCall[i] ? 1 : 0); // số người trực khác, tính trên snapshot
            if (onCall[i] && others >= 1) after[i] = false; // thấy còn người khác nên tắt
        }
        return count(after);
    }

    static int guardedBothOff(boolean[] onCall) {
        boolean[] cur = onCall.clone();
        for (int i = 0; i < cur.length; i++) {
            if (!cur[i]) continue;
            int others = count(cur) - 1; // đọc lại trạng thái mới nhất (hàng khóa đã tuần tự hoá)
            if (others >= 1) cur[i] = false; // chỉ tắt khi vẫn còn ít nhất một người
        }
        return count(cur);
    }

    private static int count(boolean[] a) {
        int c = 0;
        for (boolean b : a) if (b) c++;
        return c;
    }
}`,
    hints: [
      'naive: mỗi người quyết định dựa trên cùng một snapshot gốc (số người trực khác = tổng - chính mình).',
      'guarded: cập nhật mảng trực tiếp và đọc lại số người còn trực trước mỗi lần tắt; nếu là người cuối thì giữ nguyên.'
    ],
    explain: `Write skew xảy ra vì cả hai transaction ra quyết định trên **cùng một ảnh chụp**, nên không ai thấy thay đổi của người kia trước khi commit. {{guardedBothOff}} mô phỏng cách sửa: một hàng khóa chung (hoặc SERIALIZABLE + retry) buộc các thay đổi đi qua tuần tự, mỗi người đọc lại trạng thái mới nhất và từ chối nếu mình là người cuối. Trong PostgreSQL, SERIALIZABLE (SSI) phát hiện cấu trúc phụ thuộc nguy hiểm và abort một transaction (40001), còn {{SELECT ... FOR UPDATE}} hoặc hàng guard biến invariant thành xung đột ghi thật.`
  }],
  check: [
    {q:'Write skew khác lost update ở điểm nào?',options:['Hai transaction ghi đè cùng một hàng','Hai transaction cùng đọc rồi ghi các hàng khác nhau, cùng commit làm vỡ invariant chung','Đọc dữ liệu chưa commit','Cùng đọc một hàng hai lần thấy khác nhau'],answer:1,explain:'Write skew không có ghi đè; mỗi hàng chỉ một writer nhưng invariant nhiều hàng vẫn vỡ. Lost update là cùng ghi một ô, người sau đè người trước.'},
    {q:'Mức isolation nào của PostgreSQL chặn được write skew?',options:['READ COMMITTED','REPEATABLE READ','SERIALIZABLE (SSI)','READ UNCOMMITTED'],answer:2,explain:'Snapshot isolation (REPEATABLE READ) không suy ra được invariant nhiều hàng; SERIALIZABLE dùng SSI phát hiện và abort với 40001.'},
    {q:'Hiện thực hóa xung đột (materialize the conflict) nghĩa là gì?',options:['Tạo thêm index trên cột balance','Đưa invariant về một hàng khóa chung để mọi transaction cùng ghi vào đó, tạo xung đột ghi thật','Tăng connection pool','Thêm CHECK constraint trên một cột'],answer:1,explain:'Guard row hoặc advisory xact lock biến invariant logic thành một điểm xung đột vật lý, giúp snapshot isolation cũng chặn được.'},
    {q:'Khi gặp SQLSTATE 40001 ở SERIALIZABLE, ứng dụng nên làm gì?',options:['Bỏ qua lỗi','Retry toàn bộ transaction với backoff có giới hạn','Ghi đè dữ liệu','Hạ isolation xuống READ UNCOMMITTED'],answer:1,explain:'40001 là serialization failure bình thường của SSI; retry có giới hạn với backoff, phân biệt với conflict nghiệp vụ thật.'}
  ],
  related: ['db-002', 'db-031', 'db-058'],
  tags: ['write-skew', 'SERIALIZABLE', 'SSI', 'PostgreSQL', 'isolation']
},
{
  id: 'lesson-db-021', track: 'db', order: 21,
  title: 'HOT update và fillfactor: vì sao UPDATE có khi không phải chạm vào index',
  level: 'senior', minutes: 30,
  goals: [
    'Giải thích UPDATE trong PostgreSQL tạo tuple mới thay vì sửa tại chỗ',
    'Mô tả điều kiện HOT (heap-only tuple) và vì sao nó không chèn entry vào index',
    'Phân biệt fillfactor của bảng và của index',
    'Đọc {{pg_stat_user_tables}} để biết tỷ lệ HOT và tác động của nó tới WAL, bloat'
  ],
  body: `**Tóm tắt:** Mỗi bảng trong PostgreSQL là một đống tuple (heap) và mỗi index là một B-tree trỏ tới tuple bằng địa chỉ TID. Khi UPDATE, PostgreSQL tạo tuple mới; nếu tuple mới nằm cùng trang và không đụng cột nào được index, nó thực hiện HOT update — chỉ ghi tuple mới kèm con trỏ tới bản cũ, KHÔNG chèn entry vào bất kỳ index nào. Ngược lại, nếu UPDATE đụng cột được index hoặc trang đã đầy, mọi index phải chèn entry mới (non-HOT), làm tăng WAL, dung lượng và bloat.

### Nhắc lại: heap và TID
Bảng dữ liệu (heap) lưu mỗi hàng là một tuple (bản ghi) trong các trang 8 KB. Mỗi tuple có địa chỉ vật lý gọi là **TID** = (số trang, offset trong trang). Index B-tree ở lá lưu cặp (giá trị khóa, TID) — nó không lưu cả hàng, chỉ lưu "khóa này nằm ở đâu". Muốn lấy dữ liệu, PostgreSQL dùng TID để đọc tuple trên heap.

### UPDATE tạo tuple mới, không sửa tại chỗ
PostgreSQL không ghi đè tuple cũ khi UPDATE (để phục vụ MVCC: transaction cũ vẫn phải thấy phiên bản cũ). Nó chèn một tuple mới, đánh dấu tuple cũ là "chết". Nếu mỗi UPDATE đều phải chèn entry mới vào mọi index thì bảng ghi nhiều sẽ phình index rất nhanh. HOT (Heap-Only Tuple: tuple chỉ nằm trong heap) sinh ra để tránh việc đó trong trường hợp phổ biến.

### HOT update hoạt động thế nào
HOT áp dụng khi cả hai điều kiện đúng:
1. UPDATE **không** thay đổi bất kỳ cột nào đang được index tham chiếu.
2. Tuple mới **còn chỗ** trên cùng heap page với tuple cũ (không phải chuyển sang trang khác).

Khi đó PostgreSQL chỉ cần:
- Ghi tuple mới trên cùng trang.
- Đặt con trỏ (LP_REDIRECT) từ chỗ của tuple cũ sang tuple mới, tạo một chuỗi HOT (HOT chain).
- **Không** chèn entry nào vào index. Mọi index vẫn trỏ tới tuple gốc; khi duyệt, PostgreSQL đi theo chuỗi HOT để tìm phiên bản hiện hành (còn visible).

~~~text
Heap page (HOT):
[ tuple cũ (xmin=100) ] --redirect--> [ tuple mới (xmin=201) ]
        ^                                      |
        |                                      |
   index trỏ tới đây (TID tuple cũ) ---------+ (đi theo chuỗi để tới bản mới)

Index: KHÔNG có entry mới. Chỉ một entry, vẫn trỏ vào đầu chuỗi.
~~~

### Khi nào HOT thất bại
- UPDATE đụng **cột được index** (ví dụ đổi {{email}} khi có index trên email): PostgreSQL buộc non-HOT, chèn entry mới vào **mọi** index của bảng.
- Trang đã đầy (fillfactor của bảng mặc định 100, không chừa chỗ): tuple mới phải sang trang khác, không tạo được chuỗi HOT trên cùng trang, thành non-HOT.
- UPDATE làm tuple mới lớn hơn chỗ trống còn lại.

### Fillfactor: chừa chỗ cho HOT và cho index
Fillfactor là tỷ lệ phần trăm trang được lấp đầy ban đầu.
- **Fillfactor của bảng** (mặc định 100): giảm xuống 90 để mỗi trang còn 10% chỗ trống, nhiều UPDATE thành HOT hơn, giảm bloat index. Đổi lại bảng to hơn.
- **Fillfactor của index B-tree** (mặc định 90): chừa chỗ trên leaf page để bớt page split khi chèn khóa mới vào giữa dải.
Hai fillfactor này khác nhau và phục vụ mục đích khác nhau — đừng lẫn.

### Chi phí khi không HOT
Khi non-HOT, mỗi index phải:
- Chèn một entry mới (giá trị khóa mới, TID mới).
- Đánh dấu entry cũ là trỏ tới tuple đã chết (sẽ được VACUUM dọn).
Điều này làm WAL tăng, index phình (cần VACUUM hoặc REINDEX), và index-only scan có thể phải đọc heap nhiều hơn. Với bảng ghi dày, tỷ lệ HOT thấp là nguyên nhân phổ biến khiến index to nhanh và truy vấn chậm dần.

### SQL minh họa
~~~sql
-- Xem tỷ lệ HOT: n_tup_hot_upd / n_tup_upd càng cao càng tốt
SELECT relname, n_tup_upd, n_tup_hot_upd,
       round(100.0 * n_tup_hot_upd / nullif(n_tup_upd, 0), 1) AS hot_pct
FROM pg_stat_user_tables
ORDER BY n_tup_upd DESC;

-- Giảm fillfactor của bảng để nhiều UPDATE thành HOT hơn (nên đặt trước khi nạp dữ liệu)
ALTER TABLE orders SET (fillfactor = 90);

-- EXPLAIN (ANALYZE, BUFFERS) để thấy Heap Fetches khi index-only scan không dùng được
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, status FROM orders WHERE id = 42;
~~~

### Bảng so sánh HOT và non-HOT
| | HOT update | Non-HOT update |
|---|---|---|
| Điều kiện | không đụng cột index và còn chỗ trên trang | đụng cột index hoặc hết chỗ |
| Entry index mới | 0 | mỗi index một entry |
| WAL | ít hơn | nhiều hơn |
| Bloat index | không tăng | tăng |
| Chuỗi HOT | có, đi theo con trỏ trên trang | không |

### Cơ chế từng bước
1. **UPDATE chạy.** PostgreSQL tìm tuple cũ qua TID.
2. **Tính tuple mới.** Kiểm tra có cột nào thuộc index bị đổi không.
3. **Quyết định HOT hay không.** Nếu không đụng index và trang còn chỗ thì HOT; ngược lại non-HOT.
4. **HOT: ghi tuple mới cộng redirect, không đụng index.** Non-HOT: ghi tuple mới và chèn entry vào mọi index.
5. **VACUUM dọn tuple chết và entry cũ.** Chuỗi HOT giúp VACUUM prune nhanh hơn (chỉ cần đi theo chuỗi trên một trang).

Vì sao lại như vậy? HOT đánh đổi: giữ index gọn khi UPDATE không đổi khóa, đổi lại khi đọc phải đi theo chuỗi. Thực tế phần lớn UPDATE chỉ đổi vài cột không index (như {{updated_at}}, {{status}}), nên HOT giúp giảm tải ghi rất nhiều.

### Ví dụ đời thực
Bảng {{orders}} 50 triệu dòng, 6 index, mỗi ngày 2 triệu UPDATE đổi {{status}} và {{updated_at}}. Ban đầu không có index trên status nên nhiều UPDATE là HOT, index ổn định. Sau một sprint, có người thêm index trên {{status}} và {{updated_at}} để "cho nhanh báo cáo". Tỷ lệ HOT tụt từ khoảng 95% xuống 40%; WAL tăng gấp đôi, dung lượng index phình, truy vấn chậm dần, VACUUM không theo kịp. Điều tra {{pg_stat_user_tables}}: {{n_tup_hot_upd}}/{{n_tup_upd}} giảm mạnh đúng lúc deploy. Sửa: bỏ index không cần thiết trên cột hay bị UPDATE, hoặc chuyển bộ đếm sang bảng riêng; giảm fillfactor bảng xuống 90; thêm job VACUUM đúng nhịp. Sau đó HOT trở lại khoảng 90%, WAL giảm, p99 truy vấn ổn định.

### Lỗi hay gặp
1. **Đặt index lên cột bị UPDATE liên tục.** Triệu chứng: index phình, WAL cao. Nguyên nhân: mỗi UPDATE thành non-HOT, chèn entry mọi index. Sửa: cân nhắc bỏ index đó, hoặc chỉ index trên cột ít đổi.
2. **Fillfactor 100 cho bảng ghi nhiều.** Triệu chứng: ít HOT, bloat nhanh. Sửa: giảm fillfactor (ví dụ 90) để chừa chỗ; đo lại tỷ lệ HOT.
3. **Nghĩ HOT luôn nhanh hơn.** Triệu chứng: đọc phải đi theo chuỗi HOT dài. Sửa: VACUUM prune chuỗi; theo dõi độ dài chuỗi.
4. **Nhầm fillfactor bảng với fillfactor index.** Hai tham số khác nhau; giảm cái này không ảnh hưởng cái kia.

> Senior tip: theo dõi {{n_tup_hot_upd}}/{{n_tup_upd}} theo thời gian; một cú tụt đột ngột thường trùng với lúc thêm index trên cột hay bị UPDATE.

### Liên hệ phỏng vấn
- **"HOT update là gì?"** → UPDATE không đụng cột được index và tuple mới còn chỗ trên cùng trang, nên chỉ ghi tuple mới cộng redirect, không chèn entry index.
- **"Vì sao HOT quan trọng?"** → Tránh phình index và giảm WAL khi UPDATE các cột không index; tỷ lệ HOT cao nghĩa là ghi rẻ.
- **"Khi nào HOT thất bại?"** → Đụng cột được index, hết chỗ trên trang, hoặc tuple mới lớn hơn chỗ trống.
- **"Fillfactor ảnh hưởng HOT ra sao?"** → Giảm fillfactor của bảng chừa chỗ cho tuple mới trên cùng trang nên nhiều HOT hơn; fillfactor của index là chuyện khác (chừa chỗ cho page split).
`,
  exercises: [{
    title: 'HOT hay non-HOT: đếm entry index phải ghi',
    prompt: `Mô phỏng chi phí UPDATE trên heap cộng B-tree index. {{isHot(indexedCols, changedCols, pageHasRoom)}} trả về true khi UPDATE là HOT: không cột nào trong {{changedCols}} nằm trong {{indexedCols}} (cột được index) và {{pageHasRoom}} bằng true (trang còn chỗ). {{indexEntryWrites(indexCount, indexedCols, changedCols, pageHasRoom)}} trả về số entry index phải ghi: 0 nếu HOT, ngược lại bằng {{indexCount}} (mỗi index một entry). {{indexedCols}} và {{changedCols}} là mảng chỉ số cột; không dùng Set.`,
    starter: `class HotUpdateSim {
    // HOT khi: UPDATE không đụng cột được index VÀ còn chỗ trên heap page.
    static boolean isHot(int[] indexedCols, int[] changedCols, boolean pageHasRoom) {
        throw new UnsupportedOperationException("TODO");
    }

    // Số entry index phải ghi: HOT = 0; non-HOT = mỗi index một entry.
    static int indexEntryWrites(int indexCount, int[] indexedCols, int[] changedCols, boolean pageHasRoom) {
        throw new UnsupportedOperationException("TODO");
    }
}`,
    tests: `public class Main {
 static int p=0,t=0;
 static void c(String n,Runnable r){t++;try{r.run();p++;System.out.println("PASS "+n);}catch(Throwable e){System.out.println("FAIL "+n+": "+e);}}
 static void eq(int a,int b){if(a!=b)throw new AssertionError(a+" != "+b);}
 static void ok(boolean b){if(!b)throw new AssertionError("expected true");}
 public static void main(String[]z){
  int[] idx1={0};
  c("HOT when non-indexed col and page has room",()->{ok(HotUpdateSim.isHot(idx1,new int[]{1},true));eq(0,HotUpdateSim.indexEntryWrites(3,idx1,new int[]{1},true));});
  c("non-HOT when indexed col changes",()->{ok(!HotUpdateSim.isHot(idx1,new int[]{0},true));eq(3,HotUpdateSim.indexEntryWrites(3,idx1,new int[]{0},true));});
  c("forced non-HOT when page is full",()->{ok(!HotUpdateSim.isHot(idx1,new int[]{1},false));eq(3,HotUpdateSim.indexEntryWrites(3,idx1,new int[]{1},false));});
  c("index entry count scales with index count",()->{eq(0,HotUpdateSim.indexEntryWrites(1,idx1,new int[]{2},true));eq(5,HotUpdateSim.indexEntryWrites(5,idx1,new int[]{0},true));});
  c("change two cols incl indexed",()->{int[] idx={1,2};eq(4,HotUpdateSim.indexEntryWrites(4,idx,new int[]{1,3},true));});
  System.out.println("RESULT "+p+"/"+t);
 }
}`,
    reference: `class HotUpdateSim {
    static boolean isHot(int[] indexedCols, int[] changedCols, boolean pageHasRoom) {
        for (int c : changedCols)
            for (int ic : indexedCols)
                if (c == ic) return false; // đụng cột được index -> buộc non-HOT
        return pageHasRoom;              // không đụng index: HOT chỉ khi trang còn chỗ
    }

    static int indexEntryWrites(int indexCount, int[] indexedCols, int[] changedCols, boolean pageHasRoom) {
        return isHot(indexedCols, changedCols, pageHasRoom) ? 0 : indexCount;
    }
}`,
    hints: [
      'HOT cần đồng thời: không có cột changed nào trùng cột indexed, và trang còn chỗ.',
      'Khi HOT, không index nào phải chèn entry, nên số entry ghi bằng 0; khi non-HOT, mỗi index một entry.'
    ],
    explain: `HOT chỉ áp dụng khi UPDATE không đụng cột được index và tuple mới còn chỗ trên cùng trang; khi đó PostgreSQL ghi tuple mới cộng con trỏ redirect và **không** chèn entry vào index, giúp giảm WAL và bloat. Nếu đụng cột được index hoặc trang đầy, mọi index phải chèn entry mới (non-HOT). Giảm fillfactor của bảng chừa chỗ trống để nhiều UPDATE thành HOT hơn; đây là lý do thực tế khiến tỷ lệ {{n_tup_hot_upd}}/{{n_tup_upd}} là chỉ số cần theo dõi.`
  }],
  check: [
    {q:'HOT update xảy ra khi nào?',options:['Khi UPDATE đổi khóa chính','Khi UPDATE không đụng cột được index và tuple mới còn chỗ trên cùng heap page','Khi INSERT thêm hàng','Khi DELETE hàng'],answer:1,explain:'HOT cần đồng thời hai điều kiện: không đổi cột được index và tuple mới nằm cùng trang.'},
    {q:'Vì sao HOT update có lợi?',options:['Không phải ghi entry mới vào mọi index nên giảm WAL và bloat','Làm query nhanh hơn nhờ thêm index','Cho phép đọc dữ liệu chưa commit','Tự động giảm số kết nối'],answer:0,explain:'HOT giữ index gọn, giảm WAL và bloat; đổi lại khi đọc phải đi theo chuỗi HOT.'},
    {q:'UPDATE đổi một cột có index thì sao?',options:['Vẫn là HOT','Buộc non-HOT: mỗi index phải chèn entry mới, tuple cũ thành dead','PostgreSQL bỏ qua index','PostgreSQL tự động REINDEX'],answer:1,explain:'Đụng cột được index khiến mọi index phải cập nhật, không thể HOT.'},
    {q:'Fillfactor của bảng ảnh hưởng HOT thế nào?',options:['Không liên quan','Giảm fillfactor chừa chỗ trống trên heap page nên nhiều UPDATE thành HOT hơn','Tăng fillfactor giúp HOT nhiều hơn','Fillfactor chỉ áp dụng cho index'],answer:1,explain:'Fillfactor của bảng (mặc định 100) giảm xuống 90 chừa chỗ cho tuple mới cùng trang; fillfactor của index là tham số khác (chừa chỗ cho page split).'}
  ],
  related: ['db-001', 'db-013', 'db-040'],
  tags: ['HOT-update', 'fillfactor', 'PostgreSQL', 'B-tree', 'VACUUM']
},
{
  id: 'lesson-db-022', track: 'db', order: 22,
  title: 'Lost update và hai cách chặn: pessimistic lock (FOR UPDATE) và compare-and-set',
  level: 'senior', minutes: 30,
  goals: [
    'Mô tả lịch read-modify-write gây lost update trên một bảng giả',
    'Mô phỏng pessimistic lock: transaction sau phải chờ rồi đọc giá trị mới nên không mất cập nhật',
    'Mô phỏng compare-and-set: ghi kèm điều kiện version, conflict thì đọc lại và retry',
    'Chọn giữa pessimistic lock và optimistic CAS theo contention và side effect'
  ],
  body: `**Tóm tắt:** Lost update (mất cập nhật) xảy ra khi hai transaction cùng đọc một giá trị, cùng tính rồi cùng ghi, khiến một trong hai thay đổi biến mất. Có hai cách chặn: pessimistic lock (khóa hàng bằng {{SELECT ... FOR UPDATE}}, transaction sau phải chờ và đọc giá trị mới) và optimistic compare-and-set (ghi kèm điều kiện {{version}}, nếu version đã đổi thì đọc lại rồi retry).

### Transaction và read-modify-write là gì
Transaction (giao dịch) là một nhóm thao tác đọc/ghi được chạy như một khối "tất cả hoặc không": hoặc mọi thay đổi đều được lưu, hoặc không có gì. Read-modify-write là mẫu code kinh điển: đọc một giá trị, tính giá trị mới trong bộ nhớ, rồi ghi lại. Ví dụ cộng tiền: đọc số dư 100, cộng 1, ghi 101. Vấn đề nằm ở chỗ giữa lúc đọc và lúc ghi, một transaction khác có thể chen vào và cũng đọc/ghi cùng hàng đó.

### Lost update sinh ra thế nào
Xét hai transaction cùng tăng số dư thêm 1. Lịch chạy (schedule: cách sắp xen kẽ các thao tác theo thời gian) như sau:
1. T1 đọc số dư = 100.
2. T2 cũng đọc số dư = 100, vì T1 chưa ghi.
3. T1 tính 100 + 1 = 101 rồi ghi 101.
4. T2 tính 100 + 1 = 101 rồi ghi 101, đè lên kết quả của T1.

Kết quả cuối là 101, nhưng đáng lẽ phải là 102: một lần tăng đã biến mất. Đây là lost update. Nó không phải bug của database; ở mức {{READ COMMITTED}} (mặc định của PostgreSQL), mỗi câu lệnh lấy một snapshot mới nên database không tự biết hai phép ghi này xung đột — nó chỉ thấy hai câu UPDATE tuần tự.

~~~text
T1                              T2
|-- đọc 100 ------------------->|
|                               |-- đọc 100
|-- ghi 101 ------------------->|
|                               |-- ghi 101 (đè kết quả của T1)
|  Kết quả 101, mất một lần tăng
~~~

### Cách 1: pessimistic lock với SELECT ... FOR UPDATE
Pessimistic lock (khóa bi quan) là kiểu khóa "giành trước": transaction giữ khóa trên hàng từ lúc đọc cho tới lúc commit, transaction khác muốn đọc hoặc ghi hàng đó phải chờ. Trong PostgreSQL, {{SELECT ... FOR UPDATE}} khóa hàng ngay khi đọc:

~~~sql
BEGIN;
SELECT balance FROM accounts WHERE id = 42 FOR UPDATE;  -- khóa hàng id=42 tới khi commit
-- tính toán dựa trên balance vừa đọc
UPDATE accounts SET balance = 100 WHERE id = 42;          -- vẫn trong cùng transaction
COMMIT;                                                  -- nhả khóa
~~~

Cơ chế: khi T1 đang giữ khóa, T2 gọi {{SELECT ... FOR UPDATE}} cùng hàng sẽ bị block (chờ). T1 commit xong thì T2 mới đọc được, và nó đọc giá trị MỚI (101) rồi cộng tiếp. Vì T2 không còn dùng giá trị cũ 100 nữa, không có mất cập nhật. Đổi lại, T2 phải chờ; khi nhiều người tranh cùng một hàng thì throughput giảm, và nếu hai transaction khóa ngược chiều nhau có thể deadlock (xem bài deadlock).

### Cách 2: optimistic compare-and-set với version
Optimistic locking (khóa lạc quan) không khóa khi đọc. Mỗi hàng có thêm một cột {{version}} (số nguyên tăng dần). Khi ghi, transaction gửi kèm version đã đọc; database chỉ ghi nếu version hiện tại vẫn khớp, ngược lại trả về 0 dòng và transaction phải đọc lại rồi retry (làm lại).

~~~sql
UPDATE accounts
SET balance = balance + 1, version = version + 1
WHERE id = 42 AND version = 5;   -- chỉ ghi nếu version vẫn là 5
-- nếu số dòng cập nhật = 0: dữ liệu đã đổi, phải đọc lại và tính lại
~~~

So sánh: T1 đọc (100, v5), T2 cũng đọc (100, v5). T1 ghi với version=5 thành công, version thành 6. T2 ghi với version=5 nhưng version đã là 6 nên điều kiện không khớp, trả 0 dòng; T2 đọc lại (101, v6), tính 102, ghi với version=6 thành công. Không mất cập nhật, và T2 không phải chờ khóa — nhưng phải viết vòng retry.

### Bảng so sánh hai cách
| | Pessimistic lock (FOR UPDATE) | Optimistic (compare-and-set) |
|---|---|---|
| Khi nào khóa | lúc đọc, giữ tới commit | không khóa, chỉ kiểm tra lúc ghi |
| Khi xung đột | transaction sau chờ | transaction sau retry |
| Phù hợp | contention cao, ít muốn retry | contention thấp, đọc nhiều |
| Rủi ro | deadlock, giảm throughput | retry dồn tải, side effect lặp |

### Cơ chế từng bước của bài tập mô phỏng
Bài tập mô phỏng cả ba lịch trên một bảng giả trong RAM, không dùng thread, để kết quả xác định:
1. {{withoutLock}}: cả hai đọc cùng initial, mỗi bên cộng delta của mình, A ghi trước rồi B ghi sau — trả về giá trị cuối để thấy lost update.
2. {{withPessimisticLock}}: A đọc, ghi, rồi mới nhả khóa; B chỉ vào sau đó, đọc lại giá trị mới rồi cộng — không mất.
3. {{withCompareAndSet}}: A ghi với version 0 thành công; B đọc version 0 (ảnh cũ), ghi trượt, đọc lại version 1 rồi ghi lại — không mất.

### Ví dụ đời thực
Một hệ thống ví điện tử dùng {{READ COMMITTED}}, code rút tiền kiểu đọc số dư rồi ghi lại giá trị tuyệt đối. Hai request rút cùng lúc: cả hai đọc 100, cả hai ghi 90, kết quả cuối là 90 — một lần rút 10 biến mất, khách được rút "miễn phí". Điều tra log cho thấy hai transaction start cách nhau 15 ms, cùng đọc snapshot lúc đó. Sửa: chuyển sang câu cập nhật nguyên tử {{UPDATE balance = balance - 10 WHERE id = ?}} (database tự tính, không cần đọc trước), hoặc {{SELECT ... FOR UPDATE}}, hoặc thêm version và retry. Sau khi sửa, số dư cuối ngày luôn khớp với tổng giao dịch.

### Lỗi hay gặp trên production
1. Đọc rồi tính trong Java rồi UPDATE giá trị tuyệt đối — lost update. Sửa bằng UPDATE nguyên tử hoặc version.
2. Dùng {{FOR UPDATE}} nhưng quên commit/rollback — khóa treo, transaction khác chờ vô hạn. Luôn bọc try/finally hoặc dùng transaction template.
3. CAS mà không kiểm tra số dòng cập nhật — tưởng thành công dù 0 dòng. Luôn kiểm tra affected rows.
4. Retry CAS không giới hạn — hệ thống nóng, retry dồn thêm tải; giới hạn 3-5 lần, thêm backoff và jitter, phân biệt conflict nghiệp vụ với conflict tạm thời.

### Pitfall production
Đừng thực hiện side effect (gửi email, gọi API thanh toán) giữa read và write rồi retry, vì mỗi lần retry sẽ lặp lại side effect; hãy ghi event vào outbox trong cùng transaction và để relay gửi sau commit. Với pessimistic lock, thứ tự khóa phải nhất quán giữa các service để tránh deadlock.

> Senior tip: phần lớn hệ thống OLTP dùng {{READ COMMITTED}} cộng UPDATE nguyên tử; chỉ dùng {{FOR UPDATE}} khi thật sự cần đọc-rồi-quyết-định, và đo contention trước khi chọn optimistic để tránh retry vô ích.

### Liên hệ phỏng vấn
- **"Lost update là gì và vì sao xảy ra?"** → Hai transaction cùng đọc một giá trị, cùng tính rồi cùng ghi; người ghi sau đè người ghi trước. Ở READ COMMITTED database không tự chặn vì mỗi câu lệnh có snapshot riêng.
- **"FOR UPDATE và version check khác nhau ra sao?"** → FOR UPDATE khóa bi quan, transaction sau chờ và đọc giá trị mới; version check khóa lạc quan, không chờ nhưng conflict thì phải retry. Chọn theo contention.
- **"Vì sao UPDATE nguyên tử lại an toàn hơn read-modify-write?"** → Vì database tính biểu thức ngay trong câu lệnh, không có khoảng trống giữa đọc và ghi để transaction khác chen vào.
- **"Retry optimistic conflict cần lưu ý gì?"** → Đọc lại trạng thái mới, tính lại từ input nghiệp vụ, giới hạn số lần, backoff + jitter, và side effect phải idempotent hoặc dùng outbox.
`,
  exercises: [{
    title: 'Ba lịch: không khóa, pessimistic lock, compare-and-set',
    prompt: `Cài {{LostUpdateFix}} với ba phương thức static mô phỏng cùng một bảng số dư {{initial}} cho hai transaction A và B cùng cộng delta.
{{withoutLock(initial, deltaA, deltaB)}}: cả hai đọc initial, mỗi bên cộng delta, A ghi trước rồi B ghi sau (không kiểm tra version). Trả về giá trị cuối.
{{withPessimisticLock(initial, deltaA, deltaB)}}: A giữ khóa, đọc-ghi xong mới nhả; B đọc lại giá trị mới rồi cộng. Trả về giá trị cuối.
{{withCompareAndSet(initial, deltaA, deltaB)}}: A ghi với version 0; B đọc version 0 cũ, ghi trượt, đọc lại version mới rồi ghi lại. Trả về giá trị cuối.
Không dùng thread, không sleep; kết quả phải xác định.`,
    starter: `class LostUpdateFix {
    static int withoutLock(int initial, int deltaA, int deltaB) {
        throw new UnsupportedOperationException("TODO");
    }
    static int withPessimisticLock(int initial, int deltaA, int deltaB) {
        throw new UnsupportedOperationException("TODO");
    }
    static int withCompareAndSet(int initial, int deltaA, int deltaB) {
        throw new UnsupportedOperationException("TODO");
    }
}`,
    tests: `public class Main {
 static int p=0,t=0;
 static void c(String n,Runnable r){t++;try{r.run();p++;System.out.println("PASS "+n);}catch(Throwable e){System.out.println("FAIL "+n+": "+e);}}
 static void eq(int a,int b){if(a!=b)throw new AssertionError(a+" != "+b);}
 public static void main(String[]z){
  c("no lock loses one increment",()->eq(11,LostUpdateFix.withoutLock(10,1,1)));
  c("no lock different deltas",()->eq(17,LostUpdateFix.withoutLock(10,2,7)));
  c("no lock withdrawal lost",()->eq(10,LostUpdateFix.withoutLock(10,-4,0)));
  c("pessimistic keeps both",()->eq(12,LostUpdateFix.withPessimisticLock(10,1,1)));
  c("pessimistic different deltas",()->eq(19,LostUpdateFix.withPessimisticLock(10,2,7)));
  c("compare-and-set keeps both",()->eq(12,LostUpdateFix.withCompareAndSet(10,1,1)));
  c("compare-and-set different deltas",()->eq(19,LostUpdateFix.withCompareAndSet(10,2,7)));
  System.out.println("RESULT "+p+"/"+t);
 }
}`,
    reference: `class LostUpdateFix {
    static int withoutLock(int initial, int deltaA, int deltaB) {
        int readA = initial;          // T1 đọc
        int readB = initial;          // T2 đọc cùng giá trị (T1 chưa ghi)
        int writeA = readA + deltaA;  // T1 tính rồi ghi
        int writeB = readB + deltaB;  // T2 tính từ ảnh cũ rồi ghi
        int stored = writeA;
        stored = writeB;              // ghi sau đè: mất cập nhật của A
        return stored;
    }
    static int withPessimisticLock(int initial, int deltaA, int deltaB) {
        int stored = initial;
        stored = stored + deltaA;     // T1 giữ khóa: đọc-ghi xong mới nhả
        stored = stored + deltaB;     // T2 vào sau, đọc giá trị MỚI rồi cộng
        return stored;
    }
    static int withCompareAndSet(int initial, int deltaA, int deltaB) {
        int value = initial;
        int version = 0;
        value = value + deltaA;       // T1 ghi với expected=0 -> khớp
        version = 1;
        int readValue = initial;      // T2 đọc ảnh cũ (version=0)
        int expected = 0;
        if (expected != version) {    // compare-and-set trượt: version đã là 1
            readValue = value;        // đọc lại trạng thái mới
            expected = version;
        }
        value = readValue + deltaB;   // tính lại rồi ghi với expected=1 -> khớp
        version++;
        return value;
    }
}`,
    hints: [
      'withoutLock: cả hai đọc cùng initial; write cuối cùng thắng nên một delta biến mất.',
      'withPessimisticLock: cộng dồn deltaA rồi deltaB lên cùng một biến, vì B đọc sau khi A đã ghi.',
      'withCompareAndSet: mô phỏng version; nếu expected khác version thì đọc lại value mới rồi mới cộng.'
    ],
    explain: `Ba phương thức thể hiện ba lịch khác nhau trên cùng dữ liệu. {{withoutLock}} cho kết quả chỉ bằng một trong hai delta cộng initial, vì cả hai ghi dựa trên cùng ảnh chụp. {{withPessimisticLock}} tuần tự hóa: B chờ A xong rồi đọc giá trị mới, nên kết quả là initial cộng cả hai delta. {{withCompareAndSet}} dùng version làm điều kiện ghi: lần ghi của B với version cũ trượt, B đọc lại rồi ghi lại, nên cũng không mất. Trong PostgreSQL thật, FOR UPDATE là khóa bi quan còn version predicate là khóa lạc quan; cả hai đều biến read-modify-write thành thao tác an toàn, khác nhau ở chỗ chờ hay retry.`
  }],
  check: [
    {q:'Lost update xảy ra khi nào?',options:['Hai transaction cùng đọc một giá trị, cùng tính rồi cùng ghi, người sau đè người trước','Đọc dữ liệu chưa commit','Cùng một điều kiện range cho hai tập hàng khác nhau','Hai transaction khóa ngược chiều'],answer:0,explain:'Bản chất là read-modify-write trên cùng một ô; người ghi sau dựa trên ảnh cũ nên ghi đè.'},
    {q:'SELECT ... FOR UPDATE chặn lost update bằng cách nào?',options:['Tự động tăng isolation lên SERIALIZABLE','Khóa hàng, transaction khác chờ và đọc giá trị mới sau khi commit','Xóa version','Bỏ qua index'],answer:1,explain:'Khóa bi quan giữ hàng tới commit; transaction sau đọc trạng thái mới nên không dùng giá trị cũ.'},
    {q:'UPDATE với version predicate trả 0 dòng nghĩa là gì?',options:['Đã commit hai lần','Dữ liệu đã đổi hoặc hàng không tồn tại, phải đọc lại và retry','Database mất kết nối','Index bị hỏng'],answer:1,explain:'Điều kiện version không khớp; ứng dụng phải đọc lại trạng thái mới rồi tính lại, không được coi là thành công.'},
    {q:'Vì sao UPDATE nguyên tử (SET balance = balance + 1) an toàn hơn read-modify-write?',options:['Vì nó luôn nhanh hơn','Vì database tính ngay trong câu lệnh, không có khoảng trống giữa đọc và ghi','Vì nó bỏ qua transaction','Vì nó dùng SERIALIZABLE'],answer:1,explain:'Không có cửa sổ để transaction khác chen vào giữa đọc và ghi, nên không mất cập nhật.'}
  ],
  related: ['db-002', 'db-004', 'db-016'],
  tags: ['lost-update', 'pessimistic-lock', 'FOR UPDATE', 'compare-and-set', 'PostgreSQL']
},
{
  id: 'lesson-db-023', track: 'db', order: 23,
  title: 'Tìm kiếm khoảng bằng binary search: lower bound, upper bound và so với quét toàn bộ',
  level: 'mid', minutes: 25,
  goals: [
    'Hiểu vì sao mảng đã sắp xếp cho phép tìm biên khoảng bằng binary search',
    'Cài lowerBound và upperBound và đếm số phép so sánh',
    'So sánh số bước với quét toàn bộ và liên hệ range scan của index B-tree',
    'Biết khi nào index không giúp: selectivity cao, cột không có thứ tự'
  ],
  body: `**Tóm tắt:** Trên một mảng đã sắp xếp, ta tìm được một khoảng giá trị bằng binary search (tìm kiếm nhị phân): mỗi bước so sánh với phần tử giữa rồi loại bỏ một nửa, nên chỉ tốn khoảng log2(N) phép so sánh để tìm biên dưới và biên trên. Quét toàn bộ (full scan) phải xem lần lượt mọi phần tử, tốn N phép so sánh. Đây chính là lý do index B-tree trên đĩa nhanh hơn seq scan khi truy vấn trả về ít hàng.

### Vì sao mảng có thứ tự thì tìm nhanh
Binary search (tìm kiếm nhị phân) là thuật toán: cứ nhìn phần tử ở giữa, nếu nó nhỏ hơn giá trị cần tìm thì bỏ nửa bên trái, ngược lại bỏ nửa bên phải. Mỗi bước loại bỏ một nửa số phần tử, nên với N phần tử chỉ cần khoảng log2(N) bước. Với 1024 phần tử, log2(1024) = 10, tức chỉ khoảng 10 phép so sánh — trong khi quét tuần tự có thể phải xem cả 1024. Điều kiện tiên quyết: dữ liệu phải đã sắp xếp theo cùng thứ tự với điều kiện so sánh; nếu chưa sắp, binary search cho kết quả sai.

### Lower bound và upper bound là gì
Để đếm số phần tử nằm trong một khoảng {{[lo, hi]}}, ta cần hai biên:
- {{lowerBound(target)}}: chỉ số đầu tiên có giá trị {{>= target}} (vị trí chèn bên trái). Nếu không có phần tử nào thỏa, trả về N.
- {{upperBound(target)}}: chỉ số đầu tiên có giá trị {{> target}} (vị trí chèn bên phải). Nếu không có, trả về N.

Khi đó số phần tử trong {{[lo, hi]}} bằng {{upperBound(hi) - lowerBound(lo)}}. Ví dụ mảng {{[1, 3, 3, 5, 7]}}: lowerBound(3) = 1, upperBound(3) = 3, nên có 3 - 1 = 2 phần tử bằng 3; lowerBound(4) = 3, upperBound(5) = 4, nên {{[4, 5]}} có 1 phần tử.

~~~java
// lowerBound: chỉ số đầu tiên >= target, đếm số phép so sánh
int lowerBound(int[] a, int target) {
    int lo = 0, hi = a.length;
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        comparisons++;                 // mỗi vòng một phép so sánh
        if (a[mid] < target) lo = mid + 1;  // nửa trái còn nhỏ, bỏ đi
        else hi = mid;                      // a[mid] >= target, thử nửa trái
    }
    return lo;
}
~~~

### Đếm số bước thay vì đo thời gian
Đo thời gian wall clock (đồng hồ thực) cho mảng nhỏ rất nhiễu: JIT, cache CPU, GC và tải máy làm kết quả dao động. Vì vậy bài tập đếm số phép so sánh — deterministic (xác định, không phụ thuộc thời gian). Với binary search, số phép so sánh tăng theo log2(N); với quét toàn bộ, nó bằng đúng N (hoặc vị trí tìm thấy). Đây là cách so sánh công bằng giữa hai chiến lược.

### Liên hệ với index B-tree của database
PostgreSQL lưu index B-tree theo trang (page 8 KB), mỗi trang chứa nhiều khóa và con trỏ. Khi truy vấn {{WHERE id BETWEEN lo AND hi}}, database đi từ gốc xuống lá để tìm biên dưới (giống lowerBound), rồi duyệt các lá theo thứ tự khóa tới khi vượt biên trên (giống upperBound). Vì cây cao chỉ 3-4 tầng dù bảng tỷ hàng, chi phí tìm biên rất nhỏ; phần còn lại là đọc các hàng thuộc khoảng. Nếu khoảng trả về quá nhiều hàng (selectivity cao), planner có thể chọn seq scan vì đọc tuần tự rẻ hơn nhiều random I/O. Đó là lý do "index không phải lúc nào cũng nhanh".

### Bảng so sánh
| | Binary search trên mảng | Quét toàn bộ | Index B-tree (range) |
|---|---|---|---|
| Số bước tìm biên | ~log2(N) | ~N | ~chiều cao cây (3-4) |
| Điều kiện | dữ liệu đã sắp | không cần | khóa có thứ tự |
| Khi nào thua | khoảng trả nhiều phần tử | luôn | selectivity cao |

### Cơ chế từng bước của bài tập
1. {{lowerBound}} và {{upperBound}} chạy binary search trên mảng đã sắp, mỗi vòng tăng bộ đếm so sánh.
2. {{countInRange(lo, hi)}} trả về {{upperBound(hi) - lowerBound(lo)}}.
3. {{linearCountInRange(lo, hi)}} quét toàn bộ, mỗi phần tử tăng bộ đếm 1.
4. Test so sánh: với mảng 1024 phần tử, binary search dùng dưới 30 phép so sánh, còn quét toàn bộ dùng đúng 1024.

### Ví dụ đời thực
Một API tra cứu đơn hàng {{WHERE created_at BETWEEN ? AND ?}} trên bảng 50 triệu dòng có index B-tree trên {{created_at}}. Khi khoảng chỉ vài giờ, index trả về vài trăm dòng, p99 khoảng 8 ms. Khi một báo cáo quét cả quý (trả về 30% bảng), cùng câu lệnh chậm 4 giây vì planner chuyển sang seq scan — đọc tuần tự 30% bảng rẻ hơn nhảy index 15 triệu lần. Sửa: giới hạn khoảng, thêm điều kiện lọc chọn lọc hơn, hoặc dùng index khác; không "ép" index bằng hint.

### Lỗi hay gặp
1. Gọi binary search trên mảng chưa sắp — kết quả sai âm thầm.
2. Nhầm lowerBound với upperBound — đếm thiếu hoặc thừa một phần tử ở biên.
3. Nghĩ index luôn nhanh — selectivity cao thì seq scan rẻ hơn.
4. Dùng hàm trên cột ({{WHERE lower(email) = ...}}) làm index không dùng được; cần expression index.

> Senior tip: khi tối ưu, hãy đọc {{EXPLAIN (ANALYZE, BUFFERS)}} để xem actual rows so với estimated; sai lệch thống kê và selectivity quyết định plan nhiều hơn việc "có index hay không".

### Liên hệ phỏng vấn
- **"Binary search cần điều kiện gì?"** → Dữ liệu đã sắp xếp theo đúng thứ tự so sánh; mỗi bước loại một nửa nên tốn log2(N).
- **"lowerBound và upperBound khác nhau ra sao?"** → lowerBound là chỉ số đầu tiên >= target, upperBound là chỉ số đầu tiên > target; hiệu của chúng cho số phần tử trong khoảng.
- **"Vì sao index B-tree không luôn nhanh hơn seq scan?"** → Khi truy vấn trả về tỷ lệ lớn bảng, nhiều random heap fetch tốn hơn đọc tuần tự; planner chọn theo cost ước lượng.
- **"Làm sao biết index có được dùng không?"** → Đọc EXPLAIN (ANALYZE, BUFFERS): xem planner chọn Index Scan, Index Only Scan hay Seq Scan, và so actual rows với estimated.
`,
  exercises: [{
    title: 'RangeSearch: lowerBound, upperBound và đếm bước so với quét',
    prompt: `Cài {{RangeSearch}} với constructor {{RangeSearch(int[] a)}} nhận mảng đã sắp tăng dần (không sắp lại).
{{lowerBound(target)}}: trả chỉ số đầu tiên có giá trị >= target, hoặc a.length nếu không có; mỗi vòng binary search tăng {{comparisons}} 1.
{{upperBound(target)}}: trả chỉ số đầu tiên có giá trị > target, hoặc a.length nếu không có; cũng đếm so sánh.
{{countInRange(lo, hi)}}: trả số phần tử có lo <= giá trị <= hi, tính bằng {{upperBound(hi) - lowerBound(lo)}} (không reset bộ đếm).
{{linearCountInRange(lo, hi)}}: quét toàn bộ mảng, mỗi phần tử tăng {{comparisons}} 1, trả số phần tử trong khoảng.
{{comparisons()}} trả tổng số so sánh; {{resetComparisons()}} đặt về 0. Không dùng Collections.binarySearch.`,
    starter: `class RangeSearch {
    private final int[] a;
    private int comparisons;
    RangeSearch(int[] a) { this.a = a; }
    int comparisons() { return comparisons; }
    void resetComparisons() { comparisons = 0; }
    int lowerBound(int target) { throw new UnsupportedOperationException("TODO"); }
    int upperBound(int target) { throw new UnsupportedOperationException("TODO"); }
    int countInRange(int lo, int hi) { throw new UnsupportedOperationException("TODO"); }
    int linearCountInRange(int lo, int hi) { throw new UnsupportedOperationException("TODO"); }
}`,
    tests: `public class Main {
 static int p=0,t=0;
 static void c(String n,Runnable r){t++;try{r.run();p++;System.out.println("PASS "+n);}catch(Throwable e){System.out.println("FAIL "+n+": "+e);}}
 static void eq(int a,int b){if(a!=b)throw new AssertionError(a+" != "+b);}
 static void ok(boolean b){if(!b)throw new AssertionError("expected true");}
 public static void main(String[]z){
  c("lowerBound basic",()->{RangeSearch r=new RangeSearch(new int[]{1,3,3,5,7});eq(1,r.lowerBound(3));eq(3,r.lowerBound(4));eq(0,r.lowerBound(0));eq(5,r.lowerBound(8));});
  c("upperBound basic",()->{RangeSearch r=new RangeSearch(new int[]{1,3,3,5,7});eq(3,r.upperBound(3));eq(4,r.upperBound(5));eq(0,r.upperBound(0));eq(5,r.upperBound(7));});
  c("count in range",()->{RangeSearch r=new RangeSearch(new int[]{1,3,3,5,7});eq(3,r.countInRange(3,5));eq(1,r.countInRange(4,6));eq(5,r.countInRange(0,100));eq(0,r.countInRange(8,9));});
  c("linear agrees with binary",()->{int[] a={2,4,4,4,8,9,10};RangeSearch r=new RangeSearch(a);eq(r.linearCountInRange(4,8),r.countInRange(4,8));eq(r.linearCountInRange(0,3),r.countInRange(0,3));});
  c("binary uses few comparisons",()->{int[] a=new int[1024];for(int i=0;i<a.length;i++)a[i]=i;RangeSearch r=new RangeSearch(a);r.resetComparisons();r.countInRange(100,200);ok(r.comparisons()<30);});
  c("linear scans all",()->{int[] a=new int[1024];for(int i=0;i<a.length;i++)a[i]=i;RangeSearch r=new RangeSearch(a);r.resetComparisons();r.linearCountInRange(100,200);eq(1024,r.comparisons());});
  System.out.println("RESULT "+p+"/"+t);
 }
}`,
    reference: `class RangeSearch {
    private final int[] a;
    private int comparisons;
    RangeSearch(int[] a) { this.a = a; }
    int comparisons() { return comparisons; }
    void resetComparisons() { comparisons = 0; }
    int lowerBound(int target) {
        int lo = 0, hi = a.length;
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            comparisons++;
            if (a[mid] < target) lo = mid + 1; else hi = mid;
        }
        return lo;
    }
    int upperBound(int target) {
        int lo = 0, hi = a.length;
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            comparisons++;
            if (a[mid] <= target) lo = mid + 1; else hi = mid;
        }
        return lo;
    }
    int countInRange(int lo, int hi) {
        if (lo > hi) return 0;
        return upperBound(hi) - lowerBound(lo);
    }
    int linearCountInRange(int lo, int hi) {
        int c = 0;
        for (int v : a) { comparisons++; if (v >= lo && v <= hi) c++; }
        return c;
    }
}`,
    hints: [
      'lowerBound: khi a[mid] < target thì biên dưới là mid+1, ngược lại thu hẹp hi = mid.',
      'upperBound: khi a[mid] <= target thì biên dưới là mid+1, ngược lại hi = mid.',
      'countInRange = upperBound(hi) - lowerBound(lo); linearCountInRange tăng comparisons cho từng phần tử.'
    ],
    explain: `Binary search duy trì đoạn {{[lo, hi)}} luôn chứa câu trả lời; mỗi vòng chọn mid và loại một nửa, nên số phép so sánh cỡ log2(N). {{lowerBound}} tìm phần tử đầu tiên {{>= target}}, {{upperBound}} tìm phần tử đầu tiên {{> target}}; hiệu của chúng là số phần tử trong {{[lo, hi]}}. {{linearCountInRange}} phải xem mọi phần tử nên tốn đúng N phép so sánh. Đây là mô phỏng đếm bước, không phải I/O thật; trong PostgreSQL, index B-tree tìm biên bằng cách đi từ gốc xuống lá (cỡ 3-4 tầng) rồi duyệt lá theo thứ tự, còn seq scan đọc tuần tự — planner chọn theo selectivity và cost.`
  }],
  check: [
    {q:'Điều kiện tiên quyết của binary search là gì?',options:['Mảng phải rỗng','Dữ liệu đã sắp xếp theo đúng thứ tự so sánh','Mảng phải có số chẵn phần tử','Không được có phần tử trùng'],answer:1,explain:'Binary search loại một nửa dựa trên thứ tự; nếu chưa sắp, kết quả sai.'},
    {q:'Số phần tử trong [lo, hi] tính bằng gì?',options:['lowerBound(hi) - upperBound(lo)','upperBound(hi) - lowerBound(lo)','lowerBound(lo) + upperBound(hi)','N - lowerBound(lo)'],answer:1,explain:'upperBound(hi) là chỉ số đầu > hi, lowerBound(lo) là chỉ số đầu >= lo; hiệu là số phần tử trong khoảng.'},
    {q:'Vì sao bài tập đếm phép so sánh thay vì đo thời gian?',options:['Vì phép so sánh luôn chính xác hơn','Vì đo thời gian nhiễu do JIT, cache, GC, tải máy; đếm bước là deterministic','Vì binary search không tốn thời gian','Vì mảng quá nhỏ'],answer:1,explain:'Đo wall clock dao động; đếm số phép so sánh cho kết quả xác định, so sánh công bằng giữa hai chiến lược.'},
    {q:'Khi nào index B-tree có thể chậm hơn seq scan?',options:['Khi bảng rỗng','Khi truy vấn trả về tỷ lệ lớn bảng (selectivity cao), nhiều random heap fetch','Khi khóa là số nguyên','Khi mảng đã sắp'],answer:1,explain:'Đọc tuần tự rẻ hơn nhiều random I/O; planner chọn seq scan khi actual rows cao.'}
  ],
  related: ['db-001', 'db-003', 'db-023'],
  tags: ['binary-search', 'lower-bound', 'upper-bound', 'B-tree', 'EXPLAIN']
},
{
  id: 'lesson-db-024', track: 'db', order: 24,
  title: 'Transaction retry với exponential backoff: xử lý serialization failure 40001',
  level: 'senior', minutes: 30,
  goals: [
    'Hiểu SQLSTATE 40001 là gì và tại sao phải retry toàn bộ transaction',
    'Cài exponential backoff với jitter để tránh thundering herd khi retry',
    'Phân biệt retry tạm thời (transient) và conflict nghiệp vụ (cần can thiệp)',
    'Áp dụng idempotency key để an toàn khi retry có side effect'
  ],
body: `**Tóm tắt:** Khi dùng REPEATABLE READ hoặc SERIALIZABLE trong PostgreSQL, xung đột ghi (write skew, lost update bị chặn) khiến database abort transaction với lỗi **SQLSTATE 40001** (serialization_failure). Ứng dụng **bắt buộc retry toàn bộ transaction** (đọc lại, tính lại, ghi lại), không chỉ chạy lại câu SQL chết. Retry sai cách (vô hạn, không backoff, side effect lặp) biến xung đột nhỏ thành sập hệ thống.

### SQLSTATE 40001: serialization_failure là gì
Ở REPEATABLE READ, nếu transaction cố ghi một hàng đã bị transaction khác sửa và commit sau snapshot, PostgreSQL không ghi đè mà ném **ERROR: could not serialize access due to concurrent update** (SQLSTATE 40001). Ở SERIALIZABLE, SSI (Serializable Snapshot Isolation) phát hiện các phụ thuộc nguy hiểm (dangerous structure) và abort một transaction. Cả hai đều yêu cầu ứng dụng bắt đầu transaction **mới**, đọc trạng thái mới, tính lại thay đổi từ input nghiệp vụ, rồi thử lại.

### Tại sao không chỉ chạy lại câu UPDATE?
Vì transaction đã bị **rollback hoàn toàn**: mọi thay đổi trước đó (INSERT, UPDATE, DELETE) trong transaction đó đều bị huỷ. Chạy lại riêng câu chết không khôi phục được các bước trước. Retry đúng nghĩa là:
1. Bắt đầu transaction mới (BEGIN)
2. ĐỌC LẠI dữ liệu liên quan (SELECT ... FOR UPDATE hoặc SELECT với version)
3. TÍNH LẠI thay đổi từ input nghiệp vụ (không dùng giá trị đã đọc cũ)
4. Ghi và commit
 
 ~~~java
 // SAI: chỉ chạy lại UPDATE
 try { updateBalance(id, newBalance); } catch (e) { if (e.sqlState == '40001') updateBalance(id, newBalance); }
 
 // ĐÚNG: retry toàn bộ transaction
 for (int attempt = 0; attempt < MAX_RETRY; attempt++) {
     try (Connection c = ds.getConnection()) {
         c.setTransactionIsolation(Connection.TRANSACTION_REPEATABLE_READ);
         int current = readBalance(c, id);           // đọc lại
         int next = current + delta;                 // tính lại từ input
         int updated = updateBalance(c, id, next, currentVersion);
         if (updated == 1) { c.commit(); return; }   // thành công
     } catch (SQLException e) {
         if (!"40001".equals(e.getSQLState())) throw e;
     }
     sleep(backoff(attempt));                        // chờ rồi thử lại
 }
 throw new RetryExhaustedException();
 ~~~
 
### Exponential backoff với jitter: tránh thundering herd
Khi nhiều transaction cùng conflict và cùng retry ngay lập tức, chúng đọc cùng trạng thái, conflict lại, retry lại — tải tăng vọt (thundering herd). Giải pháp:
- **Exponential backoff**: thời gian chờ tăng gấp đôi mỗi lần (10ms, 20ms, 40ms, 80ms...)
- **Jitter (ngẫu nhiên)**: cộng thêm ngẫu nhiên ±25% để các transaction không va chạm lại
- **Giới hạn số lần**: 3-5 lần, sau đó ném lỗi cho caller quyết định
 
 ~~~java
 long backoff(int attempt) {
     long base = 10L * (1L << attempt);          // 10, 20, 40, 80, 160 ms
     long jitter = (long) (base * 0.25 * (random.nextDouble() * 2 - 1)); // ±25%
     return Math.max(1, base + jitter);
 }
 ~~~
 
### Phân biệt: conflict tạm thời vs conflict nghiệp vụ
Không phải 40001 nào cũng nên retry vô điều kiện:
- **Serialization failure (40001)**: conflict do concurrency, thường retry được.
- **Deadlock (40P01)**: cũng retry được nhưng cần backoff dài hơn.
- **Unique violation (23505)**: key trùng — KHÔNG retry, báo lỗi nghiệp vụ (ví dụ email đã tồn tại).
- **Check violation (23514)**: ràng buộc dữ liệu — KHÔNG retry, dữ liệu đầu vào sai.
- **Lock timeout (55P03)**: chờ lock quá lâu — có thể retry nhưng cần xem xét contention.

### Side effect và idempotency key
Nếu transaction có side effect (gửi email, gọi API thanh toán, publish Kafka), retry sẽ lặp lại side effect → gửi trùng email, trừ tiền hai lần. Cách an toàn:
1. **Không làm side effect trong transaction** (đồng ý cả team).
2. Dùng **outbox pattern**: ghi event vào bảng outbox **trong cùng transaction**, relay đọc outbox và gửi sau commit.
3. Dùng **idempotency key**: client sinh UUID cho request, server kiểm tra key đã xử lý chưa (bảng idempotency_keys). Nếu đã có thì trả kết quả cũ, không chạy lại.

### Ví dụ đời thực
Payment service dùng REPEATABLE READ cho chuyển tiền. Giờ cao điểm, 200 transaction/giây cùng đụng tài khoản hot. Không có retry → 15% request lỗi 40001, client thấy thất bại. Có retry nhưng không backoff → khi conflict tăng, retry dồn tải làm DB CPU 100%, latency từ 50ms lên 5s. Sửa: retry 3 lần với exponential backoff (10ms base, ±25% jitter), log số lần retry để theo dõi. Kết quả: 99.8% transaction thành công ở lần 1-2, p99 latency ổn định 80ms.

### Lỗi hay gặp
1. **Retry riêng câu SQL** thay vì cả transaction — mất các bước trước. Luôn BEGIN mới, đọc lại, tính lại.
2. **Không giới hạn số lần retry** — hệ thống nóng, retry dồn tải thêm. Giới hạn 3-5 lần.
3. **Không có jitter** — tất cả retry cùng lúc, thundering herd. Luôn thêm ngẫu nhiên.
4. **Side effect trong transaction** (gửi email, call API) — retry lặp lại. Dùng outbox + idempotency key.
5. **Retry cả lỗi nghiệp vụ** (unique violation, check violation) — vô ích, làm chậm client. Chỉ retry 40001/40P01/55P03.

### Pitfall production
Đo tỷ lệ 40001 theo loại entity; nếu entity nào thường xuyên conflict, cân nhắc redesign: atomic UPDATE, partition hot key, hoặc optimistic locking thay vì SERIALIZABLE. Đừng để retry che giấu vấn đề thiết kế.

> Senior tip: retry không phải miễn phí; mỗi lần retry tốn một round-trip DB và giữ connection pool. Theo dõi {{retry_count}} histogram; nếu p99 > 2 thì hệ thống đang bị contention, cần fix ở mức thiết kế hơn là tăng {{MAX_RETRY}}.

### Liên hệ phỏng vấn
- **"SQLSTATE 40001 nghĩa là gì? Ứng dụng xử lý sao?"** → Serialization failure do SSI hoặc REPEATABLE READ ghi đè snapshot cũ. Phải retry TOÀN BỘ transaction: BEGIN mới, đọc lại, tính lại từ input, ghi lại.
- **"Vì sao cần exponential backoff và jitter khi retry?"** → Tránh thundering herd: nhiều transaction cùng retry cùng lúc làm tải tăng vọt. Backoff rải thời gian, jitter rải thêm ngẫu nhiên.
- **"Retry có side effect (gửi email) thì sao?"** → Mỗi retry gửi trùng email. Dùng outbox pattern (ghi event trong transaction, relay gửi sau) hoặc idempotency key (client gửi UUID, server deduplicate).
- **"Khi nào KHÔNG retry 40001?"** → Khi đã vượt MAX_RETRY, hoặc lỗi thực ra là unique violation (23505) / check violation (23514) bị nhầm là 40001. Luôn kiểm tra SQLState chính xác.`,
  exercises: [{
    title: 'RetryTransaction: exponential backoff, jitter, giới hạn lần và idempotency',
    prompt: `Cài {{RetryTransaction}} mô phỏng retry transaction với exponential backoff và jitter.
 
 Constructor {{RetryTransaction(int maxAttempts, long baseDelayMs, long maxDelayMs, Random random)}}:
 - {{maxAttempts}}: tối đa bao nhiêu lần thử (kể cả lần đầu), ví dụ 3.
 - {{baseDelayMs}}: delay cơ sở cho lần retry 1 (lần 0 là lần đầu, không delay).
 - {{maxDelayMs}}: trần delay, không được vượt.
 - {{random}}: nguồn ngẫu nhiên cho jitter (±25%).
 
 {{boolean execute(TransactionBody body)}}: chạy transaction.
 - {{TransactionBody}} là functional interface: {{boolean run()}} trả {{true}} nếu thành công, ném {{SerializationFailure}} (custom exception) nếu conflict 40001, ném exception khác cho lỗi nghiệp vụ.
 - Logic: vòng lặp tới {{maxAttempts}}. Lần 0 chạy ngay. Nếu ném {{SerializationFailure}}, delay = min(baseDelayMs * 2^attempt, maxDelayMs) ±25% jitter, sleep (trong mô phỏng: chỉ tính tổng delay, không sleep thật), tăng attempt, thử lại. Ném exception khác thì dừng ngay, không retry. Trả {{true}} nếu thành công, {{false}} nếu hết lần thử.
 - {{long totalDelayMs()}}: tổng mili giây đã delay (để test xác định).
 - {{int attemptsMade()}}: số lần đã thử (kể cả lần thành công).
 
 Không dùng {{Thread.sleep}}; delay mô phỏng bằng cách cộng vào {{totalDelay}}. Cùng input + random seed -> cùng output.`,
    starter: `import java.util.*;
 
 class RetryTransaction {
     static class SerializationFailure extends Exception {
         SerializationFailure() { super("SQLSTATE 40001"); }
     }
 
     @FunctionalInterface
     interface TransactionBody {
         boolean run() throws SerializationFailure;
     }
 
     private final int maxAttempts;
     private final long baseDelayMs;
     private final long maxDelayMs;
     private final Random random;
 
     RetryTransaction(int maxAttempts, long baseDelayMs, long maxDelayMs, Random random) {
         this.maxAttempts = maxAttempts;
         this.baseDelayMs = baseDelayMs;
         this.maxDelayMs = maxDelayMs;
         this.random = random;
     }
 
     boolean execute(TransactionBody body) {
         throw new UnsupportedOperationException("TODO");
     }
 
     long totalDelayMs() { throw new UnsupportedOperationException("TODO"); }
 
     int attemptsMade() { throw new UnsupportedOperationException("TODO"); }
 }`,
    tests: `public class Main {
     static int p = 0, t = 0;
     static void c(String name, Runnable r) {
         t++;
         try { r.run(); p++; System.out.println("PASS " + name); }
         catch (Throwable e) { System.out.println("FAIL " + name + ": " + e); }
     }
     static void eq(Object expected, Object actual) {
         if (!Objects.equals(expected, actual)) throw new AssertionError("expected " + expected + " but got " + actual);
     }
     static void ok(boolean b) { if (!b) throw new AssertionError("expected true"); }
 
     public static void main(String[] args) {
         c("success on first attempt", () -> {
             Random rnd = new Random(42);
             RetryTransaction rt = new RetryTransaction(3, 10, 1000, rnd);
             boolean ok = rt.execute(() -> true);
             eq(true, ok);
             eq(1, rt.attemptsMade());
             eq(0L, rt.totalDelayMs());
         });
 
         c("retry once on serialization failure", () -> {
             Random rnd = new Random(42);
             RetryTransaction rt = new RetryTransaction(3, 10, 1000, rnd);
             AtomicInteger calls = new AtomicInteger();
             boolean ok = rt.execute(() -> {
                 if (calls.incrementAndGet() == 1) throw new RetryTransaction.SerializationFailure();
                 return true;
             });
             eq(true, ok);
             eq(2, rt.attemptsMade());
             ok(rt.totalDelayMs() > 0);
         });
 
         c("exhausted retries returns false", () -> {
             Random rnd = new Random(42);
             RetryTransaction rt = new RetryTransaction(3, 10, 1000, rnd);
             AtomicInteger calls = new AtomicInteger();
             boolean ok = rt.execute(() -> {
                 calls.incrementAndGet();
                 throw new RetryTransaction.SerializationFailure();
             });
             eq(false, ok);
             eq(3, rt.attemptsMade());
             ok(rt.totalDelayMs() > 0);
         });
 
         c("business exception not retried", () -> {
             Random rnd = new Random(42);
             RetryTransaction rt = new RetryTransaction(3, 10, 1000, rnd);
             AtomicInteger calls = new AtomicInteger();
             boolean threw = false;
             try {
                 rt.execute(() -> {
                     calls.incrementAndGet();
                     throw new IllegalArgumentException("unique violation");
                 });
             } catch (IllegalArgumentException e) { threw = true; }
             ok(threw);
             eq(1, calls.get());
             eq(1, rt.attemptsMade());
         });
 
         c("delay capped at maxDelayMs", () -> {
             Random rnd = new Random(42);
             RetryTransaction rt = new RetryTransaction(5, 100, 250, rnd); // base 100, max 250
             AtomicInteger calls = new AtomicInteger();
             rt.execute(() -> {
                 calls.incrementAndGet();
                 throw new RetryTransaction.SerializationFailure();
             });
             // attempts: 1 (success not reached) + 4 retries = 5 attempts total
             // delays: attempt 1: ~100, attempt 2: ~200, attempt 3: capped 250, attempt 4: capped 250
             // total should be <= 4 * 250 * 1.25 (with jitter max)
             ok(rt.totalDelayMs() <= 1250);
             eq(5, rt.attemptsMade());
         });
 
         c("jitter makes delay non-deterministic across seeds", () -> {
             RetryTransaction rt1 = new RetryTransaction(3, 10, 1000, new Random(1));
             RetryTransaction rt2 = new RetryTransaction(3, 10, 1000, new Random(2));
             rt1.execute(() -> { throw new RetryTransaction.SerializationFailure(); });
             rt2.execute(() -> { throw new RetryTransaction.SerializationFailure(); });
             // with different seeds, total delay should differ (jitter)
             ok(rt1.totalDelayMs() != rt2.totalDelayMs());
         });
 
         System.out.println("RESULT " + p + "/" + t);
     }
 }`,
    reference: `import java.util.*;
 
 class RetryTransaction {
     static class SerializationFailure extends Exception {
         SerializationFailure() { super("SQLSTATE 40001"); }
     }
 
     @FunctionalInterface
     interface TransactionBody {
         boolean run() throws SerializationFailure;
     }
 
     private final int maxAttempts;
     private final long baseDelayMs;
     private final long maxDelayMs;
     private final Random random;
 
     private long totalDelay = 0;
     private int attempts = 0;
 
     RetryTransaction(int maxAttempts, long baseDelayMs, long maxDelayMs, Random random) {
         this.maxAttempts = maxAttempts;
         this.baseDelayMs = baseDelayMs;
         this.maxDelayMs = maxDelayMs;
         this.random = random;
     }
 
     boolean execute(TransactionBody body) {
         for (int attempt = 0; attempt < maxAttempts; attempt++) {
             attempts = attempt + 1;
             try {
                 if (body.run()) return true;
} catch (SerializationFailure e) {
                  if (attempt == maxAttempts - 1) return false; // hết lần thử
                  long delay = Math.min(baseDelayMs * (1L << attempt), maxDelayMs);
                  // jitter ±25%
                  double jitterFactor = 1.0 + 0.25 * (random.nextDouble() * 2 - 1);
                  long delayWithJitter = Math.max(1, (long) (delay * jitterFactor));
                  totalDelay += delayWithJitter;
                  // không sleep thật, chỉ tính tổng delay
              } catch (RuntimeException e) {
                  // lỗi nghiệp vụ: không retry, ném ra ngoài nguyên gốc
                  throw e;
              }
         }
         return false;
     }
 
     long totalDelayMs() { return totalDelay; }
 
     int attemptsMade() { return attempts; }
 }`,
    hints: [
      'Vòng lặp từ attempt = 0 đến maxAttempts - 1. Lần 0 chạy ngay, không delay.',
      'SerializationFailure thì tính delay = min(base * 2^attempt, maxDelay), thêm jitter ±25% bằng random.nextDouble().',
      'Exception khác (IllegalArgumentException...) ném ra ngoài ngay (wrap RuntimeException).',
      'Lưu totalDelay và attempts để test kiểm tra.'
    ],
    explain: `Lời giải thể hiện ba yêu cầu cốt lõi của retry an toàn: (1) **chỉ retry serialization failure** (40001), lỗi nghiệp vụ ném ngay; (2) **exponential backoff có trần** (maxDelay) để không chờ quá lâu; (3) **jitter ngẫu nhiên** (±25%) để các transaction không retry đồng loạt gây thundering herd. Trong production, delay thật dùng {{Thread.sleep}} hoặc {{CompletableFuture.delayedExecutor}}; bài tập chỉ cộng delay để test xác định. Idempotency key không demo ở đây nhưng là bắt buộc nếu transaction có side effect: client sinh UUID, server lưu key trong bảng idempotency_keys trước khi chạy transaction, nếu key đã tồn tại thì trả kết quả cũ.`
  }],
  check: [
    {q:'SQLSTATE 40001 (serialization_failure) xảy ra khi nào trong PostgreSQL?',options:['Khi deadlock','Khi REPEATABLE READ/SERIALIZABLE phát hiện xung đột ghi trên snapshot cũ và abort transaction','Khi unique constraint vi phạm','Khi lock timeout'],answer:1,explain:'SSI hoặc REPEATABLE READ abort transaction ghi đè snapshot cũ với 40001; ứng dụng phải retry toàn bộ transaction.'},
    {q:'Vì sao retry phải chạy lại TOÀN BỘ transaction (BEGIN mới, đọc lại, tính lại) thay vì chỉ câu SQL chết?',options:['Vì câu SQL chết là câu duy nhất','Vì transaction đã rollback hoàn toàn, mọi thay đổi trước đó đều mất','Vì PostgreSQL yêu cầu vậy','Vì connection pool reset'],answer:1,explain:'Rollback huỷ tất cả INSERT/UPDATE/DELETE trong transaction; chạy lại một câu không khôi phục được state.'},
    {q:'Exponential backoff với jitter giải quyết vấn đề gì?',options:['Làm transaction nhanh hơn','Tránh thundering herd: nhiều transaction cùng retry đồng loạt làm tải tăng vọt','Giảm số lần retry','Bỏ qua lock timeout'],answer:1,explain:'Không có jitter, tất cả conflict cùng retry cùng lúc -> thundering herd. Backoff rải thời gian, jitter rải thêm ngẫu nhiên.'},
    {q:'Transaction có side effect (gửi email) thì retry thế nào an toàn?',options:['Retry bình thường, email trùng không sao','Dùng outbox pattern (ghi event trong transaction, relay gửi sau commit) hoặc idempotency key','Tắt retry','Gửi email trước khi BEGIN'],answer:1,explain:'Side effect trong transaction sẽ lặp lại mỗi lần retry. Outbox + relay hoặc idempotency key (client UUID, server deduplicate) là cách chuẩn.'}
  ],
  related: ['db-020', 'db-022', 'db-006'],
  tags: ['retry', 'serialization-failure', '40001', 'exponential-backoff', 'jitter', 'idempotency', 'outbox']
},
{
  id: 'lesson-db-025', track: 'db', order: 25,
  title: 'BRIN index cho time-series: min/max per block, nhỏ gọn và phù hợp dữ liệu append-only',
  level: 'senior', minutes: 30,
  goals: [
    'Hiểu BRIN (Block Range Index) lưu min/max cho mỗi dải block thay vì từng hàng',
    'Biết khi nào BRIN thắng B-tree: bảng lớn, dữ liệu append-only có tương quan vật lý (timestamp tăng dần)',
    'Mô phỏng tìm kiếm khoảng trên BRIN và so sánh số block phải đọc với B-tree',
    'Nêu trade-off: BRIN nhỏ, ghi nhanh, nhưng scan trong block có thể đọc nhiều hàng không liên quan'
  ],
body: `**Tóm tắt:** **BRIN** (Block Range Index) là loại index PostgreSQL thiết kế cho bảng **rất lớn** (tỷ hàng) với dữ liệu **append-only** có thứ tự tự nhiên (như timestamp, serial id). Thay vì lưu con trỏ cho từng hàng như B-tree, BRIN chia bảng thành các **range** (mặc định 128 block = 1 MB), mỗi range chỉ lưu **min** và **max** của cột index. Kích thước BRIN chỉ ~1% B-tree, ghi nhanh vì không phải duy trì cây, nhưng truy vấn range phải đọc toàn bộ block nằm trong range (có thể đọc thừa hàng không khớp).

### Vì sao cần BRIN khi đã có B-tree
B-tree index trên cột {{created_at}} của bảng 1 tỷ hàng: mỗi hàng một entry, index to (~10-20% kích thước bảng), mỗi INSERT phải chèn entry vào B-tree (random I/O trên index, page split, WAL). Với dữ liệu time-series (IoT, log, metrics), hàng mới luôn có timestamp lớn hơn hàng cũ → dữ liệu **tự nhiên sắp xếp theo thứ tự vật lý trên đĩa**. BRIN tận dụng tính chất này: không index từng hàng, chỉ tóm tắt "block 1000-1127 có timestamp từ 2026-01-01 00:00 đến 2026-01-01 01:00".

### Cấu trúc BRIN: range và summary
 - **Range**: một dải block liên tiếp (mặc định {{pages_per_range = 128}}, mỗi block 8 KB → 1 MB dữ liệu).
 - **Summary**: cho mỗi range, lưu {{min}} và {{max}} của cột index (có thể multi-column). Nếu range chưa có dữ liệu thì summary rỗng.
 - **Meta page**: trang 0 của index BRIN lưu bitmap các range nào có summary.
 
 ~~~text
 Bảng events (append-only, sắp theo created_at):
 Block 0-127    (range 0): created_at ∈ [2026-01-01 00:00:00, 2026-01-01 00:59:59]  -> summary (min, max)
 Block 128-255  (range 1): created_at ∈ [2026-01-01 01:00:00, 2026-01-01 01:59:59]  -> summary (min, max)
 Block 256-383  (range 2): created_at ∈ [2026-01-01 02:00:00, 2026-01-01 02:59:59]  -> summary (min, max)
 ...
 
 BRIN index chỉ lưu mảng summary này (~1 entry per 128 block). Kích thước ~1% B-tree.
 ~~~
 
### Tra cứu range trên BRIN
Truy vấn {{WHERE created_at BETWEEN '2026-01-01 00:30' AND '2026-01-01 01:30'}}:
1. Đọc meta page, duyệt các summary.
2. Range nào có {{max < lo}} hoặc {{min > hi}} -> **bỏ qua toàn bộ range** (không đọc block nào trong range đó).
3. Range nào giao nhau (overlap) -> **phải đọc tất cả block trong range đó** (và filter hàng trong block).

Vì mỗi range 128 block, một truy vấn nhỏ có thể đọc thừa nhiều block (và hàng trong block) không thực sự khớp. Đó là trade-off: index nhỏ, ghi nhanh, đổi lại scan trong range có overhead.

### Khi nào BRIN thắng, khi nào thua
 | Đặc điểm | BRIN tốt | B-tree tốt |
 |---|---|---|
 | Kích thước bảng | > 100 GB (tỷ hàng) | Bất kỳ |
 | Thứ tự dữ liệu | Append-only, tương quan vật lý cao (timestamp, serial) | Ngẫu nhiên, update nhiều |
 | Kích thước index | ~1% bảng | ~10-20% bảng |
 | Tốc độ INSERT | Rất nhanh (chỉ append summary khi range mới) | Chậm hơn (random I/O trên index) |
 | Truy vấn point lookup ({{=}}) | Kém (phải scan range) | Rất nhanh |
 | Truy vấn range scan | Tốt nếu selectivity thấp (trả về ít % bảng) | Tốt cho mọi selectivity |
 | UPDATE/DELETE nhiều | Kém (summary cũ, cần BRIN summation) | Tốt |
 
### BRIN summation: cập nhật summary khi dữ liệu cũ bị sửa
Nếu UPDATE/DELETE làm thay đổi min/max trong range đã có summary, summary sẽ **không còn chính xác** (stale). PostgreSQL không tự cập nhật summary ngay (để giữ ghi nhanh). Có hai cách:
- {{brin_summarize_new_values(index)}}: quét các range chưa có summary (dữ liệu mới append) và tạo summary.
- {{brin_desummarize_range(index, range)}}: xoá summary của một range, lần sau truy vấn sẽ quét block thật để rebuild.
- Autovacuum cũng tự summarize range mới.

### SQL minh họa
 ~~~sql
 -- Tạo BRIN index trên cột timestamp (mặc định pages_per_range = 128)
 CREATE INDEX idx_events_created_brin ON events USING BRIN (created_at);
 
 -- Tùy chỉnh pages_per_range: nhỏ hơn -> summary chính xác hơn, index to hơn
 CREATE INDEX idx_events_created_brin_32 ON events USING BRIN (created_at) WITH (pages_per_range = 32);
 
 -- Multi-column BRIN
 CREATE INDEX idx_events_tenant_time_brin ON events USING BRIN (tenant_id, created_at);
 
 -- Kiểm tra kích thước index
 SELECT pg_size_pretty(pg_relation_size('idx_events_created_brin')) AS brin_size,
        pg_size_pretty(pg_relation_size('idx_events_created_btree')) AS btree_size;
 
 -- Xem summary của BRIN (debug)
 SELECT * FROM brin_page_items(get_raw_page('idx_events_created_brin', 1), 'idx_events_created_brin');
 ~~~
 
### Cơ chế từng bước của bài tập mô phỏng
1. Bảng mô phỏng: mảng các block, mỗi block chứa các timestamp đã sắp (append-only).
2. BRIN chia thành range (mỗi range {{rangeSize}} block), tính min/max cho mỗi range.
3. {{rangeQuery(lo, hi)}}: duyệt summary, bỏ qua range không giao nhau, đếm block phải đọc trong range giao nhau.
4. {{btreeQuery(lo, hi)}}: mô phỏng B-tree tìm biome dưới/ trên bằng binary search, đếm block phải đọc (giả định mỗi block 1 entry, B-tree height = 3).
5. So sánh: BRIN đọc ít block hơn khi range nhỏ và dữ liệu có tương quan; B-tree đọc chính xác các block chứa hàng khớp.

### Ví dụ đời thực
 Hệ thống IoT thu 10 triệu event/ngày từ 50.000 sensor. Bảng {{sensor_events}} 3 tỷ hàng sau 1 năm. B-tree trên {{event_time}} to 600 GB, INSERT chậm do page split. Chuyển sang BRIN {{pages_per_range = 32}}: index chỉ 8 GB, INSERT nhanh 5x, truy vấn "event của sensor X trong 1 giờ" p99 từ 2 giây xuống 300 ms (vì dữ liệu sensor Xappend liên tục, range nhỏ chỉ đọc vài block). Trade-off: truy vấn "tất cả event lúc 12:00:00 chính xác" (point lookup) chậm hơn vì phải scan range.
 
### Lỗi hay gặp
1. **Dùng BRIN cho bảng hay UPDATE/DELETE** — summary stale, kết quả sai (trả hàng không khớp hoặc bỏ sót). Chỉ dùng cho append-only.
2. **Point lookup ({{=}}) trên BRIN** — phải scan toàn range, chậm. Cần B-tree cho point lookup.
3. **Quên brin_summarize_new_values sau khi nạp dữ liệu hàng loạt** — range mới chưa có summary, planner không dùng index. Chạy summarize hoặc chờ autovacuum.
4. **pages_per_range quá lớn** — range rộng, scan thừa nhiều block. Giảm xuống 32 hoặc 16 cho range nhỏ hơn.

### Pitfall production
 BRIN không thay thế B-tree cho mọi trường hợp. Chỉ dùng khi: (1) bảng rất lớn, (2) dữ liệu append-only có tương quan vật lý, (3) truy vấn chủ yếu là range scan trên cột đó. Luôn benchmark với {{EXPLAIN (ANALYZE, BUFFERS)}} trên dữ liệu thật; đừng tin cảm tính.
 
 > Senior tip: với time-series, BRIN + partition theo tháng là cặp đôi vàng: partition pruning loại bỏ partition không liên quan, BRIN trong partition lọc nhanh range. Kích thước index tổng thể chỉ vài % so với B-tree toàn bảng.
 
### Liên hệ phỏng vấn
- **"BRIN index là gì và khác B-tree ở đâu?"** → BRIN chia bảng thành range (mặc định 128 block), mỗi range lưu min/max. Không con trỏ từng hàng. Index nhỏ (~1% B-tree), ghi nhanh, phù hợp append-only có thứ tự vật lý.
- **"Khi nào dùng BRIN thay vì B-tree?"** → Bảng lớn (100GB+), dữ liệu append-only sắp theo cột index (timestamp, serial), truy vấn chủ yếu range scan, ít UPDATE/DELETE.
- **"pages_per_range ảnh hưởng gì?"** → Nhỏ hơn -> summary chính xác hơn (ít đọc thừa block), index to hơn. Mặc định 128; time-series hay dùng 32 hoặc 16.
- **"Dữ liệu cũ bị UPDATE thì BRIN sao?"** → Summary stale (min/max không còn đúng). Cần {{brin_desummarize_range}} rồi summarize lại, hoặc tránh UPDATE trên bảng BRIN.`,
  exercises: [{
    title: 'BRINIndexSim: min/max per range, range query so với B-tree',
    prompt: `Cài {{BRINIndexSim}} mô phỏng BRIN index trên mảng timestamp đã sắp (append-only).
 
 Constructor {{BRINIndexSim(long[] timestamps, int rangeSizeBlocks, int blockSize)}}:
 - {{timestamps}}: mảng timestamp (ms) của các hàng, đã sắp tăng dần (append-only).
 - {{rangeSizeBlocks}}: số block mỗi range (mặc định 128 trong PG, ở bài tập dùng giá trị nhỏ như 4, 8).
 - {{blockSize}}: số hàng mỗi block.
 - Chia {{timestamps}} thành các block {{blockSize}} hàng, rồi gom {{rangeSizeBlocks}} block thành một range. Tính {{min}} và {{max}} timestamp cho mỗi range. Range rỗng (chưa đủ block) không tạo summary.
 
 {{int rangeQueryBlocks(long lo, long hi)}}: trả số block **phải đọc** khi truy vấn range {{[lo, hi]}}.
 - Duyệt các range: nếu {{range.max < lo}} hoặc {{range.min > hi}} -> bỏ qua (0 block).
 - Nếu giao nhau -> cộng {{blocksInRange}} (số block thực tế trong range đó, range cuối có thể < rangeSizeBlocks).
 
 {{int btreeQueryBlocks(long lo, long hi)}}: mô phỏng B-tree tìm kiếm range trên cùng dữ liệu.
 - Giả định B-tree height = 3 (root + internal + leaf), leaf entry trỏ tới block.
 - Tìm lower bound block index bằng binary search trên mảng timestamp (mỗi block lấy timestamp hàng đầu).
 - Tìm upper bound block index.
 - Trả về {{height + (upperBlockIdx - lowerBlockIdx + 1)}}: 3 block cho traversal + số block leaf trong khoảng.
 
 {{int totalBlocks()}}: tổng số block.
 {{int totalRanges()}}: số range có summary.
 
 Không dùng Thread, không I/O thật. Kết quả xác định.`,
    starter: `class BRINIndexSim {
     private final long[] timestamps;
     private final int rangeSizeBlocks;
     private final int blockSize;
 
     // summary per range
     private final long[] rangeMin;
     private final long[] rangeMax;
     private final int[] blocksInRange;
 
     BRINIndexSim(long[] timestamps, int rangeSizeBlocks, int blockSize) {
         throw new UnsupportedOperationException("TODO");
     }
 
     int rangeQueryBlocks(long lo, long hi) {
         throw new UnsupportedOperationException("TODO");
     }
 
     int btreeQueryBlocks(long lo, long hi) {
         throw new UnsupportedOperationException("TODO");
     }
 
     int totalBlocks() { throw new UnsupportedOperationException("TODO"); }
 
     int totalRanges() { throw new UnsupportedOperationException("TODO"); }
 }`,
    tests: `public class Main {
     static int p = 0, t = 0;
     static void c(String name, Runnable r) {
         t++;
         try { r.run(); p++; System.out.println("PASS " + name); }
         catch (Throwable e) { System.out.println("FAIL " + name + ": " + e); }
     }
     static void eq(int a, int b) { if (a != b) throw new AssertionError(a + " != " + b); }
     static void ok(boolean b) { if (!b) throw new AssertionError("expected true"); }
 
     public static void main(String[] args) {
         // 100 block, 10 hàng/block, 4 block/range -> 25 range
         long[] ts = new long[1000];
         for (int i = 0; i < 1000; i++) ts[i] = i * 1000L; // 0, 1000, 2000... ms
 
c("basic range query", () -> {
              BRINIndexSim sim = new BRINIndexSim(ts, 4, 10);
              eq(100, sim.totalBlocks());
              eq(25, sim.totalRanges());
              // query [250000, 350000] ms -> block 25-35 (11 block)
              // BRIN: range 6 (block 24-27) và range 7 (block 28-31) và range 8 (block 32-35) -> 3 ranges overlap = 12 blocks
              int brin = sim.rangeQueryBlocks(250000, 350000);
              ok(brin >= 11 && brin <= 12); // BRIN đọc thừa tối đa 1 block mỗi range biên
          });

          c("btree query blocks", () -> {
              BRINIndexSim sim = new BRINIndexSim(ts, 4, 10);
              // B-tree: height 3 + 11 blocks in range = 14
              int btree = sim.btreeQueryBlocks(250000, 350000);
              eq(14, btree);
          });

          c("brin reads fewer blocks for small range when correlation high", () -> {
              BRINIndexSim sim = new BRINIndexSim(ts, 4, 10);
              int brin = sim.rangeQueryBlocks(250000, 260000); // 2 blocks (25, 26)
              int btree = sim.btreeQueryBlocks(250000, 260000); // 3 + 2 = 5
              // BRIN reads range 6 (4 blocks) = 4 blocks (plus maybe partial overlap)
              ok(brin <= btree);
          });
 
         c("no overlap returns 0", () -> {
             BRINIndexSim sim = new BRINIndexSim(ts, 4, 10);
             eq(0, sim.rangeQueryBlocks(2_000_000, 3_000_000));
             eq(3, sim.btreeQueryBlocks(2_000_000, 3_000_000)); // height only
         });
 
         c("range covering full table", () -> {
             BRINIndexSim sim = new BRINIndexSim(ts, 4, 10);
             eq(100, sim.rangeQueryBlocks(0, 1_000_000));
             eq(103, sim.btreeQueryBlocks(0, 1_000_000));
         });
 
         c("partial last range", () -> {
             long[] ts2 = new long[1050]; // 105 block -> 26 ranges (last has 1 block)
             for (int i = 0; i < 1050; i++) ts2[i] = i * 1000L;
             BRINIndexSim sim = new BRINIndexSim(ts2, 4, 10);
             eq(105, sim.totalBlocks());
             eq(27, sim.totalRanges()); // 105/4 = 26.25 -> 27 ranges
             // query last few blocks
             int brin = sim.rangeQueryBlocks(1_040_000, 1_050_000);
             ok(brin >= 1 && brin <= 4);
         });
 
         System.out.println("RESULT " + p + "/" + t);
     }
 }`,
    reference: `class BRINIndexSim {
     private final long[] timestamps;
     private final int rangeSizeBlocks;
     private final int blockSize;
 
     private final long[] rangeMin;
     private final long[] rangeMax;
     private final int[] blocksInRange;
 
     BRINIndexSim(long[] timestamps, int rangeSizeBlocks, int blockSize) {
         this.timestamps = timestamps;
         this.rangeSizeBlocks = rangeSizeBlocks;
         this.blockSize = blockSize;
 
         int nBlocks = (timestamps.length + blockSize - 1) / blockSize;
         int nRanges = (nBlocks + rangeSizeBlocks - 1) / rangeSizeBlocks;
 
         rangeMin = new long[nRanges];
         rangeMax = new long[nRanges];
         blocksInRange = new int[nRanges];
 
         for (int r = 0; r < nRanges; r++) {
             int startBlock = r * rangeSizeBlocks;
             int endBlock = Math.min(startBlock + rangeSizeBlocks, nBlocks);
             blocksInRange[r] = endBlock - startBlock;
 
             long min = Long.MAX_VALUE;
             long max = Long.MIN_VALUE;
             for (int b = startBlock; b < endBlock; b++) {
                 int startIdx = b * blockSize;
                 int endIdx = Math.min(startIdx + blockSize, timestamps.length);
                 if (startIdx < endIdx) {
                     min = Math.min(min, timestamps[startIdx]);
                     max = Math.max(max, timestamps[endIdx - 1]);
                 }
             }
             if (min == Long.MAX_VALUE) {
                 rangeMin[r] = 0;
                 rangeMax[r] = 0;
                 blocksInRange[r] = 0;
             } else {
                 rangeMin[r] = min;
                 rangeMax[r] = max;
             }
         }
     }
 
     int rangeQueryBlocks(long lo, long hi) {
         if (lo > hi) return 0;
         int blocks = 0;
         for (int r = 0; r < rangeMin.length; r++) {
             if (blocksInRange[r] == 0) continue;
             if (rangeMax[r] < lo || rangeMin[r] > hi) continue; // no overlap
             blocks += blocksInRange[r]; // must read all blocks in this range
         }
         return blocks;
     }
 
     int btreeQueryBlocks(long lo, long hi) {
         if (lo > hi) return 3; // height only, no leaf blocks
         int nBlocks = (timestamps.length + blockSize - 1) / blockSize;
         // lower bound: first block with timestamp >= lo
         int lb = lowerBoundBlock(lo);
         // upper bound: first block with timestamp > hi
         int ub = upperBoundBlock(hi);
         if (lb >= nBlocks) return 3; // no match
         if (ub > nBlocks) ub = nBlocks;
         int leafBlocks = ub - lb;
         return 3 + leafBlocks; // height 3 + leaf blocks
     }
 
     private int lowerBoundBlock(long target) {
         int nBlocks = (timestamps.length + blockSize - 1) / blockSize;
         int lo = 0, hi = nBlocks;
         while (lo < hi) {
             int mid = lo + (hi - lo) / 2;
             long firstTs = timestamps[mid * blockSize];
             if (firstTs < target) lo = mid + 1; else hi = mid;
         }
         return lo;
     }
 
     private int upperBoundBlock(long target) {
         int nBlocks = (timestamps.length + blockSize - 1) / blockSize;
         int lo = 0, hi = nBlocks;
         while (lo < hi) {
             int mid = lo + (hi - lo) / 2;
             long firstTs = timestamps[mid * blockSize];
             if (firstTs <= target) lo = mid + 1; else hi = mid;
         }
         return lo;
     }
 
     int totalBlocks() {
         return (timestamps.length + blockSize - 1) / blockSize;
     }
 
     int totalRanges() {
         int nBlocks = totalBlocks();
         return (nBlocks + rangeSizeBlocks - 1) / rangeSizeBlocks;
     }
 }`,
    hints: [
      'Constructor: chia timestamps thành block (blockSize hàng), gom rangeSizeBlocks block thành range. Mỗi range lưu min/max của block đầu và block cuối (vì timestamps đã sắp).',
      'rangeQueryBlocks: duyệt ranges, nếu rangeMax < lo hoặc rangeMin > hi thì bỏ qua; giao nhau thì cộng blocksInRange[r]. Range rỗng (blocksInRange=0) bỏ qua.',
      'btreeQueryBlocks: binary search trên first timestamp của mỗi block để tìm lb, ub. Trả 3 (height) + (ub - lb). Không match thì trả 3.',
      'Test dùng timestamp cách đều 1000ms để dễ suy diễn block index = timestamp / (blockSize * 1000).'
    ],
    explain: `BRINIndexSim minh hoạ cốt lõi của BRIN: **tóm tắt min/max cho mỗi range block**. Với dữ liệu append-only đã sắp, range query chỉ cần đọc các range giao nhau. Vì mỗi range 4 block, một range query nhỏ (2 block) vẫn đọc 4 block (toàn range) — đây là overhead của BRIN đổi lấy index nhỏ. B-tree tìm chính xác block chứa giá trị (binary search trên entry đầu block) nên đọc ít block hơn cho range hẹp, nhưng index to gấp nhiều lần.
 
 Tham số {{pages_per_range}} (ở đây {{rangeSizeBlocks}}) quyết định trade-off: nhỏ hơn -> summary chính xác hơn, index to hơn. PostgreSQL mặc định 128 block (1 MB); time-series thường giảm xuống 32 hoặc 16.
 
 Quan trọng: mô phỏng này giả định timestamps **hoàn toàn sắp xếp** (correlation = 1). Thực tế correlation < 1 thì BRIN đọc thừa nhiều hơn; planner dùng {{correlation}} từ {{pg_stats}} để ước lượng. Nếu correlation thấp, planner có thể chọn seq scan thay vì BRIN.`
  }],
  check: [
    {q:'BRIN index lưu gì cho mỗi range?',options:['Con trỏ tới từng hàng','Min và max của cột index trong range đó','Bitmap của các hàng','Hash của cột index'],answer:1,explain:'BRIN không lưu entry per hàng; mỗi range (mặc định 128 block) chỉ lưu min/max -> index rất nhỏ.'},
    {q:'Khi nào BRIN hiệu quả hơn B-tree?',options:['Bảng nhỏ, point lookup','Bảng lớn, append-only, dữ liệu có thứ tự vật lý (timestamp), truy vấn range scan','Bảng hay UPDATE/DELETE','Cần unique constraint'],answer:1,explain:'BRIN tận dụng tương quan vật lý: dữ liệu mới append ở cuối, min/max của range khớp chặt với dữ liệu thật. Index nhỏ, ghi nhanh.'},
    {q:'pages_per_range nhỏ hơn (ví dụ 32 vs 128) ảnh hưởng gì?',options:['Index nhỏ hơn, ghi chậm hơn','Index to hơn, summary chính xác hơn (ít đọc thừa block)','Không ảnh hưởng','Index bị hỏng'],answer:1,explain:'Range nhỏ hơn -> summary min/max bao quát ít block hơn -> chính xác hơn cho range query, nhưng số range tăng -> index to hơn.'},
    {q:'Dữ liệu cũ trong bảng BRIN bị UPDATE thì sao?',options:['BRIN tự cập nhật summary','Summary stale (min/max không còn đúng), cần brin_desummarize_range rồi summarize lại','B-tree tự convert','Query trả kết quả nhanh hơn'],answer:1,explain:'BRIN không tự maintain summary khi UPDATE/DELETE; summary stale dẫn đến kết quả sai (đọc thừa hoặc bỏ sót). Cần summarize lại.'}
  ],
  related: ['db-010', 'db-014', 'db-021', 'db-023'],
  tags: ['BRIN', 'block-range-index', 'time-series', 'append-only', 'PostgreSQL', 'index']
},
);
