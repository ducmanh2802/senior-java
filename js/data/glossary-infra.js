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
    id: 'acid',
    term: 'ACID',
    aliases: ['acid', 'tính acid', 'acid properties', 'thuộc tính acid'],
    short: 'Bốn lời hứa của một giao dịch: làm trọn vẹn, không dở dang, không giẫm lên nhau và ghi xong là thấy ngay.',
    body: `### Ví dụ đời thường
Chuyển khoản 100 nghìn từ A sang B giống việc bưu tá giao một kiện hàng: hoặc kiện đến tay người nhận, hoặc quay về người gửi. Nó không bao giờ nằm lửng lơ giữa đường, cũng không bao giờ bị nhân đôi chỉ vì người gửi bấm lại nút.

### Cơ chế
ACID là bốn thuộc tính mà một giao dịch cơ sở dữ liệu phải giữ:
- **Atomicity (nguyên tử):** tất cả hoặc không có gì. Nếu câu lệnh thứ ba lỗi, hai câu trước phải được hoàn tác. Cơ sở dữ liệu ghi undo log để rollback.
- **Consistency (nhất quán):** các ràng buộc như khóa ngoại, unique, check vẫn đúng trước và sau giao dịch.
- **Isolation (cô lập):** giao dịch chạy song song không nhìn thấy dữ liệu dở dang của nhau. Mức cô lập quyết định chúng được thấy gì.
- **Durability (bền vững):** commit xong thì mất điện vẫn còn dữ liệu, nhờ write-ahead log được fsync xuống đĩa trước khi trả lời client.

~~~text
BEGIN
  trừ A 100   --> ghi undo + ghi redo (WAL)
  cộng B 100  --> ghi undo + ghi redo (WAL)
  kiểm tra ràng buộc
     |-- sai  --> ROLLBACK, chạy undo
     |-- đúng --> COMMIT --> fsync WAL --> trả OK
~~~

Atomicity cần log để hoàn tác; durability cần fsync để không mất dữ liệu; isolation cần khóa hoặc ảnh chụp dữ liệu (MVCC). Bốn chữ cái phụ thuộc nhau chứ không độc lập: không có log thì không thể vừa nhanh vừa bền.

### Khi nào dùng
Nói về giao dịch ngân hàng, tồn kho, đặt vé, thanh toán. Không phải mọi thao tác đều cần ACID: log, analytics, cache thường chấp nhận nhất quán cuối (BASE) để đổi lấy tốc độ và khả năng mở rộng.

### Hay nhầm với
ACID không đồng nghĩa với nhanh. Nhiều hệ NoSQL hy sinh consistency hoặc isolation để scale. ACID cũng chỉ nói về giao dịch trong một cơ sở dữ liệu; giao dịch trải qua nhiều service là bài toán khác, thường giải bằng saga hoặc two-phase commit.`,
    refs: [
      { type: 'doc', title: 'PostgreSQL: Transaction Isolation', url: 'https://www.postgresql.org/docs/current/transaction-iso.html' },
    ],
    related: ['isolation-level', 'mvcc', 'dirty-read'],
  },
  {
    id: 'isolation-level',
    term: 'Isolation level',
    aliases: ['isolation level', 'isolation levels', 'mức cô lập', 'transaction isolation', 'mức isolation'],
    short: 'Mức quyết định một giao dịch được phép thấy dữ liệu chưa hoàn tất của giao dịch khác hay không.',
    body: `### Ví dụ đời thường
Bạn đọc một bản hợp đồng còn đang được sửa. Nếu được phép nhìn bản nháp, bạn có thể đọc một con số mà lát nữa sẽ bị gạch. Nếu chỉ được nhìn bản đã ký, bạn luôn thấy con số cuối cùng. Mức cô lập chính là quy định bạn được nhìn bản nào.

### Cơ chế
Chuẩn SQL định nghĩa bốn mức, từ lỏng đến chặt:
- **Read uncommitted:** thấy cả dữ liệu chưa commit, có thể gặp dirty read.
- **Read committed:** mỗi câu lệnh lấy một ảnh chụp mới, nên đọc hai lần có thể ra hai giá trị khác nhau. Đây là mặc định của PostgreSQL.
- **Repeatable read:** cả giao dịch dùng một ảnh chụp, đọc lại vẫn như cũ. MySQL InnoDB mặc định mức này.
- **Serializable:** kết quả như thể các giao dịch chạy tuần tự; chặt nhất nhưng dễ bị lỗi phải retry.

Mức càng chặt càng ít bất thường nhưng càng nhiều khóa, chờ và retry. Cơ sở dữ liệu thực hiện bằng khóa (MySQL) hoặc ảnh chụp đa phiên bản (PostgreSQL MVCC).

~~~text
Read uncommitted : dirty | non-repeatable | phantom
Read committed   :       | non-repeatable | phantom
Repeatable read  :       |                | phantom (tùy DB)
Serializable     : không còn bất thường
~~~

### Khi nào dùng
Báo cáo tài chính, tính số dư, trừ tồn kho nên dùng repeatable read hoặc serializable, kèm retry khi gặp lỗi xung đột. Web đọc thông thường để read committed cho thoáng. Đừng chọn mức cao nhất cho mọi thứ vì sẽ nghẽn.

### Hay nhầm với
Isolation level không phải transaction propagation của Spring. Propagation quyết định giao dịch nào tham gia giao dịch nào; isolation quyết định giao dịch đó nhìn thấy dữ liệu gì. Cũng đừng nhầm với mức nhất quán của replica (read-your-writes).`,
    refs: [
      { type: 'doc', title: 'PostgreSQL: Transaction Isolation', url: 'https://www.postgresql.org/docs/current/transaction-iso.html' },
      { type: 'doc', title: 'MySQL: InnoDB Transaction Model', url: 'https://dev.mysql.com/doc/refman/8.4/en/innodb-transaction-model.html' },
    ],
    related: ['acid', 'dirty-read', 'non-repeatable-read', 'phantom-read', 'mvcc'],
  },
  {
    id: 'mvcc',
    term: 'MVCC',
    aliases: ['mvcc', 'multi-version concurrency control', 'multiversion concurrency control', 'đa phiên bản'],
    short: 'Cơ sở dữ liệu giữ nhiều phiên bản của cùng một dòng để người đọc không phải chờ người ghi.',
    body: `### Ví dụ đời thường
Một tài liệu chung có lịch sử phiên bản. Người đọc mở bản lúc 9 giờ và cứ đọc bản đó, trong khi người khác sửa thành bản 9 giờ 5. Hai người không phải giành nhau, và người đọc không thấy nội dung đang viết dở.

### Cơ chế
MVCC lưu nhiều phiên bản của một dòng thay vì ghi đè tại chỗ:
1. Khi giao dịch bắt đầu, nó nhận một ảnh chụp (snapshot) gồm các giao dịch đã commit.
2. Người đọc chỉ thấy phiên bản được tạo bởi giao dịch nằm trong ảnh chụp của mình.
3. Người ghi tạo phiên bản mới và đánh dấu phiên bản cũ đã hết hiệu lực; người đọc cũ vẫn dùng phiên bản cũ.
4. Một tiến trình dọn rác xóa các phiên bản không còn ai thấy: PostgreSQL gọi là vacuum, InnoDB gọi là purge.

Nhờ vậy đọc và ghi không chặn nhau, đọc không cần khóa. Cái giá là dung lượng: nhiều phiên bản cùng tồn tại, và nếu dọn rác chậm, bảng bị phình (bloat), index bị phình theo.

~~~text
Dòng X, phiên bản:
  v1 (tx 100)  <-- snapshot của reader A vẫn thấy
  v2 (tx 105)  <-- reader B mới thấy
  v3 (tx 108)  <-- đang ghi, chưa commit

vacuum/purge: xóa v1 khi không còn reader nào cần
~~~

### Khi nào dùng
Bạn dùng MVCC gián tiếp qua PostgreSQL, MySQL InnoDB, Oracle hay SQL Server. Hiểu nó để giải thích vì sao đọc không bị chặn, vì sao cần vacuum, và vì sao giao dịch mở lâu làm bloat.

### Hay nhầm với
MVCC không có nghĩa là không khóa gì. Hai giao dịch cùng sửa một dòng vẫn xung đột và phải chờ hoặc bị lỗi serialization. MVCC cũng không phải version control của Git: nó là cơ chế nội bộ để cô lập giao dịch, không phải lịch sử để khôi phục.`,
    refs: [
      { type: 'doc', title: 'PostgreSQL: Concurrency Control', url: 'https://www.postgresql.org/docs/current/mvcc.html' },
    ],
    related: ['isolation-level', 'acid', 'phantom-read'],
  },
  {
    id: 'dirty-read',
    term: 'Dirty read',
    aliases: ['dirty read', 'dirty reads', 'đọc bẩn'],
    short: 'Đọc phải dữ liệu của giao dịch khác chưa hoàn tất, nên thứ vừa đọc có thể biến mất ngay sau đó.',
    body: `### Ví dụ đời thường
Bạn liếc vào tờ đơn nháp trên bàn thu ngân và tưởng khách đã trả tiền. Một phút sau thu ngân gạch bỏ tờ đơn vì khách đổi ý. Bạn đã hành động dựa trên một thông tin chưa bao giờ là thật.

### Cơ chế
Một giao dịch sửa dòng dữ liệu nhưng chưa commit. Nếu mức cô lập là read uncommitted, giao dịch khác được phép đọc phiên bản chưa commit đó. Khi giao dịch đầu rollback, phiên bản kia biến mất, nhưng người đọc đã dùng nó để tính toán hoặc gửi đi.

~~~text
Tx A: UPDATE account SET balance = 0   (chưa commit)
Tx B: SELECT balance  --> thấy 0        (dirty read)
Tx A: ROLLBACK
Tx B: vẫn tưởng balance = 0, có thể đã gửi email sai
~~~

Hầu hết cơ sở dữ liệu hiện đại mặc định không cho dirty read. PostgreSQL không hỗ trợ read uncommitted thật; mức này được ánh xạ thành read committed. MySQL InnoDB cũng không cho đọc bẩn ở mức mặc định. Nơi dirty read còn xuất hiện là các hệ đọc từ bộ nhớ chia sẻ hoặc replication chưa đồng bộ.

### Khi nào dùng
Gần như không bao giờ dùng có chủ đích. Nếu cần đọc dữ liệu đang ghi để theo dõi tiến độ, hãy dùng kênh riêng như log hoặc metric thay vì hạ mức cô lập.

### Hay nhầm với
Dirty read khác non-repeatable read. Dirty read thấy dữ liệu chưa từng được commit; non-repeatable read thấy dữ liệu đã commit nhưng thay đổi giữa hai lần đọc trong cùng giao dịch. Cũng đừng nhầm với việc đọc replica bị trễ: dữ liệu ở đó đã commit, chỉ là chưa kịp truyền.`,
    refs: [
      { type: 'doc', title: 'PostgreSQL: Transaction Isolation', url: 'https://www.postgresql.org/docs/current/transaction-iso.html' },
    ],
    related: ['isolation-level', 'non-repeatable-read', 'phantom-read', 'mvcc'],
  },
  {
    id: 'non-repeatable-read',
    term: 'Non-repeatable read',
    aliases: ['non-repeatable read', 'non-repeatable reads', 'non repeatable read', 'đọc không lặp lại'],
    short: 'Đọc cùng một dòng hai lần trong một giao dịch lại thấy hai giá trị khác nhau.',
    body: `### Ví dụ đời thường
Bạn xem giá món trên menu, quay đi lấy ví, nhìn lại thì giá đã tăng. Cùng một món, cùng một buổi, nhưng hai con số. Bạn không thể lập kế hoạch dựa trên con số đầu tiên nữa.

### Cơ chế
Ở mức read committed, mỗi câu SELECT lấy một ảnh chụp mới tại thời điểm câu đó chạy. Giao dịch khác có thể commit thay đổi xen giữa hai lần đọc của bạn:
1. Tx A đọc dòng có giá 100.
2. Tx B cập nhật giá thành 120 và commit.
3. Tx A đọc lại, thấy 120.

Với repeatable read, cả giao dịch giữ một ảnh chụp, nên lần đọc thứ hai vẫn ra 100. Với serializable, nếu việc đọc hai lần khác nhau có thể phá vỡ tính tuần tự, giao dịch sẽ bị hủy và phải retry.

~~~text
Tx A                         Tx B
BEGIN
SELECT price --> 100
                             UPDATE price = 120
                             COMMIT
SELECT price --> 120        <-- non-repeatable read
COMMIT
~~~

Điều này nguy hiểm khi logic đọc rồi quyết định: kiểm tra số dư, tính tổng, xác nhận trạng thái đơn. Nếu giá trị đổi giữa chừng, quyết định dựa trên dữ liệu cũ.

### Khi nào dùng
Báo cáo, tính tiền, kiểm tra rồi cập nhật nên dùng repeatable read hoặc khóa dòng. API đọc đơn lẻ thường chấp nhận read committed và không quan tâm.

### Hay nhầm với
Khác dirty read ở chỗ dữ liệu đã commit, không phải dữ liệu ma. Khác phantom read ở chỗ non-repeatable read đổi giá trị của dòng đã đọc, còn phantom read làm xuất hiện hoặc mất dòng trong tập kết quả. Cũng khác lost update: đó là hai người cùng ghi và một người ghi đè người kia.`,
    refs: [
      { type: 'doc', title: 'PostgreSQL: Transaction Isolation', url: 'https://www.postgresql.org/docs/current/transaction-iso.html' },
    ],
    related: ['isolation-level', 'dirty-read', 'phantom-read', 'mvcc'],
  },
  {
    id: 'phantom-read',
    term: 'Phantom read',
    aliases: ['phantom read', 'phantom reads', 'đọc bóng ma', 'phantom'],
    short: 'Đọc lại cùng một điều kiện lại thấy thêm hoặc bớt dòng do giao dịch khác vừa chèn hay xóa.',
    body: `### Ví dụ đời thường
Bạn đếm số người đang xếp hàng và thấy 8. Trong lúc bạn quay đi lấy vé, hai người chen vào. Khi quay lại, hàng có 10 người dù bạn chưa hề bỏ ai ra. Những người mới là các bóng ma xuất hiện trong tập kết quả của bạn.

### Cơ chế
Phantom read xảy ra khi một truy vấn có điều kiện (ví dụ WHERE status = 'pending') được chạy hai lần và giữa hai lần có dòng mới thỏa điều kiện được chèn vào. Khác với non-repeatable read, ở đây không phải một dòng đã đọc bị đổi giá trị, mà tập hợp dòng thay đổi.

Cách chặn tùy cơ sở dữ liệu:
- Repeatable read của PostgreSQL dùng ảnh chụp nên không thấy dòng mới, tránh được phantom.
- MySQL InnoDB ở repeatable read dùng next-key lock cho một số truy vấn, khóa cả khoảng trống để không ai chèn vào.
- Serializable chặn chắc chắn nhưng có thể làm giao dịch bị hủy.

~~~text
Tx A: SELECT COUNT(*) FROM orders WHERE status='pending' --> 5
Tx B: INSERT order(status='pending') ; COMMIT
Tx A: SELECT COUNT(*) ... --> 6   (phantom)
~~~

### Khi nào dùng
Kiểm tra tồn tại trước khi tạo, đếm để áp hạn mức, báo cáo tổng hợp cần chạy trong repeatable read hoặc serializable. Với nghiệp vụ quan trọng, thêm ràng buộc unique để cơ sở dữ liệu tự bảo vệ thay vì chỉ dựa vào kiểm tra ở tầng ứng dụng.

### Hay nhầm với
Phantom read không phải non-repeatable read: một cái đổi tập dòng, một cái đổi giá trị dòng. Cũng đừng nhầm với hiện tượng đọc replica cũ thấy thiếu dòng: đó là replication lag, không phải lỗi cô lập giao dịch.`,
    refs: [
      { type: 'doc', title: 'PostgreSQL: Transaction Isolation', url: 'https://www.postgresql.org/docs/current/transaction-iso.html' },
      { type: 'doc', title: 'MySQL: InnoDB Locking', url: 'https://dev.mysql.com/doc/refman/8.4/en/innodb-locking.html' },
    ],
    related: ['isolation-level', 'non-repeatable-read', 'dirty-read', 'mvcc'],
  },
  {
    id: 'b-tree-index',
    term: 'B-tree index',
    aliases: ['b-tree index', 'b-tree', 'b tree index', 'btree', 'btree index', 'b+tree', 'b+ tree'],
    short: 'Cấu trúc cây giúp tìm một dòng trong hàng triệu dòng chỉ sau vài lần nhảy.',
    body: `### Ví dụ đời thường
Một cuốn từ điển dày được chia thành các tầng: chữ cái đầu, rồi vài chữ tiếp theo, rồi trang. Bạn không đọc từ đầu đến cuối; bạn nhảy qua vài tầng rồi mở đúng trang. B-tree index hoạt động đúng như vậy.

### Cơ chế
Mỗi nút của cây chứa các khóa đã sắp xếp và con trỏ tới nút con. Nút gốc chia khoảng giá trị; đi xuống theo khoảng chứa khóa cần tìm; đến lá thì gặp vị trí dòng hoặc con trỏ tới dòng.
- **Tìm một giá trị:** O(log n), thường 3 đến 4 lần đọc trang với bảng hàng triệu dòng.
- **Tìm theo khoảng:** các lá được nối thành danh sách nên quét khoảng rất nhanh.
- **Chèn:** có thể làm nút đầy và tách (split), nên ghi index cũng tốn công.

~~~text
            [50 | 100]
           /     |     \
      [10 30] [60 80] [120 150]
        |       |         |
      lá ->   lá ->     lá ->  (lá nối nhau)

Tìm 80: gốc -> nhánh giữa -> lá [60 80]
~~~

Index không miễn phí: mỗi lần INSERT, UPDATE cột được index, DELETE đều phải sửa cây. Bảng càng nhiều index, ghi càng chậm và dung lượng càng lớn. Vì vậy chỉ index cột thực sự dùng trong WHERE, JOIN, ORDER BY.

### Khi nào dùng
Cột có độ chọn lọc cao như email, mã đơn, user_id. Với truy vấn nhiều cột, dùng composite index đúng thứ tự. Không dùng index cho cột ít giá trị như giới tính, trạng thái có hai giá trị, trừ khi đi kèm cột khác hoặc dùng partial index.

### Hay nhầm với
B-tree khác hash index: hash chỉ tìm bằng đúng giá trị, không hỗ trợ khoảng hay sắp xếp. Cũng khác bitmap index (phù hợp phân tích ít cập nhật) và GIN/GiST (full-text, JSONB, hình học). Trong PostgreSQL, câu lệnh CREATE INDEX mặc định tạo B-tree.`,
    refs: [
      { type: 'doc', title: 'PostgreSQL: Indexes', url: 'https://www.postgresql.org/docs/current/indexes.html' },
      { type: 'article', title: 'Use The Index, Luke: Anatomy of an Index', url: 'https://use-the-index-luke.com/sql/anatomy' },
    ],
    related: ['covering-index', 'query-plan', 'partitioning'],
  },
  {
    id: 'covering-index',
    term: 'Covering index',
    aliases: ['covering index', 'covering indexes', 'index covering', 'chỉ mục bao phủ'],
    short: 'Index chứa luôn các cột cần trả về nên cơ sở dữ liệu không phải quay lại bảng chính.',
    body: `### Ví dụ đời thường
Danh bạ điện thoại không chỉ có tên mà còn in sẵn số. Khi cần gọi một người, bạn tra tên là thấy số ngay, không phải mở thêm hồ sơ. Index bao phủ cũng vậy: trả lời xong ngay tại index.

### Cơ chế
Một index thường chỉ chứa cột khóa và con trỏ tới dòng trong bảng. Khi truy vấn cần thêm cột khác, cơ sở dữ liệu phải nhảy về bảng chính (heap fetch), tốn thêm I/O ngẫu nhiên.
Covering index chứa luôn các cột được SELECT, nên toàn bộ truy vấn được trả lời từ index. PostgreSQL gọi là index-only scan và hỗ trợ cột INCLUDE; MySQL InnoDB tự gắn khóa chính vào secondary index nên nhiều truy vấn chỉ cần index.

~~~text
Index (user_id, created_at) INCLUDE (status)

SELECT status FROM orders
WHERE user_id = 7
ORDER BY created_at DESC;

--> đọc index, không quay lại bảng
~~~

Index-only scan vẫn cần kiểm tra visibility map để biết dòng còn hiệu lực. Nếu bảng vừa cập nhật nhiều, visibility map chưa được cập nhật và cơ sở dữ liệu vẫn phải quay lại heap.

### Khi nào dùng
Truy vấn nóng, đọc nhiều, cột trả về ít và ổn định. Ví dụ API danh sách đơn chỉ cần id, trạng thái, ngày tạo. Đo bằng EXPLAIN ANALYZE để thấy Index Only Scan thay vì Index Scan.

### Hay nhầm với
Covering index không phải composite index. Composite index chỉ nói về nhiều cột trong khóa; nó chỉ bao phủ nếu mọi cột truy vấn cần đều nằm trong index. Covering index cũng không thay thế việc chọn đúng thứ tự cột: cột lọc phải đứng trước.

> Senior tip: đừng biến mọi index thành covering index. Mỗi cột thêm vào làm index nặng hơn, ghi chậm hơn và dễ bloat. Chỉ bao phủ những truy vấn đã đo được là chiếm nhiều thời gian nhất.`,
    refs: [
      { type: 'doc', title: 'PostgreSQL: Index-Only Scans', url: 'https://www.postgresql.org/docs/current/indexes-index-only-scans.html' },
      { type: 'article', title: 'Use The Index, Luke: Covering Indexes', url: 'https://use-the-index-luke.com/sql/glossary/covering-index' },
    ],
    related: ['b-tree-index', 'query-plan'],
  },
  {
    id: 'query-plan',
    term: 'Query plan',
    aliases: ['query plan', 'query plans', 'execution plan', 'explain plan', 'explain analyze', 'kế hoạch truy vấn'],
    short: 'Bản kế hoạch cơ sở dữ liệu chọn để lấy dữ liệu, xem được bằng lệnh EXPLAIN.',
    body: `### Ví dụ đời thường
Ứng dụng chỉ đường không phải lúc nào cũng chọn đường ngắn nhất. Nó cân nhắc đường cao tốc, đường tắt, giờ cao điểm rồi chọn lộ trình rẻ nhất theo ước tính. Query plan là lộ trình cơ sở dữ liệu chọn cho câu SQL của bạn.

### Cơ chế
Khi nhận câu SQL, cơ sở dữ liệu chạy qua các bước:
1. Parser kiểm tra cú pháp và quyền.
2. Planner liệt kê các cách thực thi: quét toàn bảng, dùng index, nested loop, hash join, sort.
3. Planner dùng thống kê (pg_statistic trong PostgreSQL) để ước lượng số dòng và chi phí từng cách.
4. Executor chạy kế hoạch rẻ nhất.

EXPLAIN chỉ in kế hoạch và chi phí ước tính. EXPLAIN ANALYZE chạy thật và in thêm thời gian, số dòng thực tế, số lần lặp. Chênh lệch lớn giữa ước tính và thực tế là dấu hiệu thống kê cũ hoặc điều kiện tương quan.

~~~text
EXPLAIN ANALYZE
SELECT * FROM orders WHERE user_id = 7 ORDER BY created_at DESC;

Limit
  -> Index Scan using idx_orders_user_created
       Index Cond: (user_id = 7)
       Buffers: shared hit=4
~~~

Các node hay gặp: Seq Scan (quét cả bảng), Index Scan, Index Only Scan, Nested Loop (tốt khi một bên nhỏ), Hash Join (tốt khi join bảng lớn), Sort, Aggregate.

### Khi nào dùng
Khi truy vấn chậm, sau khi thêm index, sau khi dữ liệu tăng gấp nhiều lần, hoặc khi thấy Node.js hay Hibernate sinh ra câu lạ. Đọc plan từ dưới lên, tìm node tốn thời gian nhất và số dòng thực tế lớn bất thường.

### Hay nhầm với
EXPLAIN không chạy câu lệnh, EXPLAIN ANALYZE có chạy và có thể ghi dữ liệu nếu câu là INSERT/UPDATE. Query plan không phải query: cùng một câu SQL có thể có plan khác nhau tùy tham số và thống kê, nên plan tốt hôm nay có thể xấu ngày mai.`,
    refs: [
      { type: 'doc', title: 'PostgreSQL: Using EXPLAIN', url: 'https://www.postgresql.org/docs/current/using-explain.html' },
      { type: 'article', title: 'Use The Index, Luke: Reading Execution Plans', url: 'https://use-the-index-luke.com/sql/explain-plan' },
    ],
    related: ['b-tree-index', 'covering-index', 'partitioning'],
  },
  {
    id: 'sharding',
    term: 'Sharding',
    aliases: ['sharding', 'shard', 'shards', 'sharded', 'phân mảnh', 'chia shard'],
    short: 'Chia dữ liệu theo khóa sang nhiều cơ sở dữ liệu độc lập để mỗi máy chỉ giữ một phần.',
    body: `### Ví dụ đời thường
Một chuỗi siêu thị không dồn toàn bộ hàng vào một kho. Mỗi khu vực có kho riêng, giữ phần hàng của khách khu đó. Muốn tìm hàng của khách ở tỉnh khác thì phải liên hệ kho tỉnh đó.

### Cơ chế
Chọn một shard key, ví dụ user_id. Một hàm định tuyến biến khóa thành shard: hash(user_id) chia lấy dư, hoặc chia theo khoảng (user_id 1 đến 1 triệu vào shard 1). Ứng dụng hoặc một router biết khóa thì gửi truy vấn đến đúng shard.
- Truy vấn theo shard key: đi thẳng một shard, nhanh.
- Truy vấn không có shard key: phải gửi tới mọi shard rồi gộp (fan-out), chậm và dễ lỗi.
- Thêm shard (resharding): phải di chuyển dữ liệu, đây là phần đau nhất.

~~~text
Client
  |
Router (hash user_id % 4)
  |---- shard 0: user 4, 8, 12...
  |---- shard 1: user 1, 5, 9...
  |---- shard 2: user 2, 6, 10...
  |---- shard 3: user 3, 7, 11...
~~~

Chọn shard key phải tránh điểm nóng: nếu chọn theo ngày, hôm nay mọi ghi dồn vào một shard. Nếu chọn theo quốc gia, một quốc gia đông có thể lệch tải. Consistent hashing giúp giảm dữ liệu phải di chuyển khi thêm node.

### Khi nào dùng
Khi một cơ sở dữ liệu không còn chịu nổi dung lượng hoặc lưu lượng ghi dù đã tối ưu index, cache, replica và partition. Sharding là bước cuối vì làm tăng độ phức tạp vận hành rất nhiều.

### Hay nhầm với
Partitioning chia bảng trong cùng một cơ sở dữ liệu, không cần router và không giải phóng máy chủ. Replication tạo bản sao để đọc và dự phòng, không chia tải ghi. Sharding chia cả dữ liệu lẫn tải ghi ra nhiều máy độc lập.`,
    refs: [
      { type: 'doc', title: 'MongoDB: Sharding', url: 'https://www.mongodb.com/docs/manual/sharding/' },
    ],
    related: ['partitioning', 'read-replica', 'replication-lag'],
  },
  {
    id: 'partitioning',
    term: 'Partitioning',
    aliases: ['partitioning', 'table partitioning', 'database partitioning', 'range partitioning', 'hash partitioning', 'phân vùng bảng'],
    short: 'Chia một bảng lớn thành nhiều bảng con theo quy tắc nhưng vẫn truy vấn như một bảng.',
    body: `### Ví dụ đời thường
Một tủ hồ sơ khổng lồ được chia thành nhiều ngăn theo năm. Người tìm hồ sơ năm 2024 chỉ mở ngăn 2024, không lục cả tủ. Khi hết hạn lưu trữ, bạn bỏ nguyên ngăn thay vì xé từng tờ.

### Cơ chế
Cơ sở dữ liệu chia bảng logic thành các bảng vật lý theo quy tắc:
- **Range:** theo khoảng, ví dụ theo tháng tạo đơn.
- **List:** theo danh sách giá trị, ví dụ theo vùng.
- **Hash:** theo hàm băm, chia đều khi không có khóa tự nhiên.

Khi truy vấn có điều kiện khớp quy tắc, planner bỏ qua các partition không liên quan (partition pruning). Mỗi partition có index riêng nên index nhỏ hơn, vacuum nhanh hơn. Xóa dữ liệu cũ chỉ cần DROP PARTITION thay vì DELETE hàng triệu dòng.

~~~text
orders (logical)
  |-- orders_2026_01  (Jan)
  |-- orders_2026_02  (Feb)
  |-- orders_2026_03  (Mar)

WHERE created_at >= '2026-03-01'
  --> chỉ đọc orders_2026_03
~~~

Giới hạn: khóa duy nhất phải chứa cột phân vùng; quá nhiều partition làm planning chậm; truy vấn không lọc theo cột phân vùng sẽ đọc mọi partition.

### Khi nào dùng
Bảng log, sự kiện, đơn hàng theo thời gian, nơi dữ liệu cũ thường bị xóa theo kỳ. Cũng hữu ích khi một bảng quá lớn khiến index và vacuum không còn hiệu quả.

### Hay nhầm với
Partitioning không phải sharding: partition nằm trong cùng một server, cùng một transaction, không cần router. Sharding chia ra nhiều server độc lập. Cũng đừng nhầm với việc chia bảng bằng tay thành nhiều bảng riêng: khi đó ứng dụng phải tự biết bảng nào, còn declarative partitioning để cơ sở dữ liệu lo.`,
    refs: [
      { type: 'doc', title: 'PostgreSQL: Table Partitioning', url: 'https://www.postgresql.org/docs/current/ddl-partitioning.html' },
      { type: 'doc', title: 'MySQL: Partitioning', url: 'https://dev.mysql.com/doc/refman/8.4/en/partitioning.html' },
    ],
    related: ['sharding', 'b-tree-index', 'query-plan'],
  },
  {
    id: 'replication-lag',
    term: 'Replication lag',
    aliases: ['replication lag', 'replica lag', 'replication delay', 'độ trễ replication', 'lag replication'],
    short: 'Khoảng thời gian dữ liệu ở bản sao chậm hơn so với máy chính.',
    body: `### Ví dụ đời thường
Bạn xem bản tin thể thao phát lại chậm vài phút so với trận đấu đang diễn ra. Khi bạn reo lên vì bàn thắng, thực tế trận đấu đã sang hiệp hai. Bản sao dữ liệu cũng có thể chậm như vậy.

### Cơ chế
Máy chính ghi thay đổi vào write-ahead log (WAL). Log này được gửi sang máy phụ, máy phụ phát lại (replay) để cập nhật dữ liệu. Lag là khoảng cách giữa vị trí log đã ghi ở máy chính và vị trí đã phát lại ở máy phụ, đo bằng byte hoặc bằng thời gian.
Nguyên nhân thường gặp:
- Mạng giữa hai máy chậm hoặc chập chờn.
- Máy phụ yếu hơn, replay không kịp.
- Một đợt ghi lớn ở máy chính.
- Transaction dài hoặc một câu lệnh nặng trên máy phụ chặn replay.
- Replication đồng bộ (synchronous) thì ghi phải chờ, lag gần như bằng 0 nhưng độ trễ ghi tăng.

~~~text
Primary:   WAL vị trí 1000  -------------
              | gửi log
Standby:   nhận 1000, replay 940
              lag = 60 byte (hoặc vài giây)
~~~

Hệ quả: đọc từ replica có thể không thấy dữ liệu vừa ghi (read-your-writes bị phá vỡ), báo cáo có thể thiếu giao dịch mới nhất.

### Khi nào dùng
Theo dõi bằng pg_stat_replication, metric của nhà cung cấp, hoặc độ trễ phát lại. Đặt cảnh báo khi lag vượt ngưỡng. Với thao tác cần đọc ngay sau ghi, gắn session vào primary hoặc dùng synchronous replication có kiểm soát.

### Hay nhầm với
Lag không phải lỗi dữ liệu: dữ liệu ở replica đã commit, chỉ là chưa tới. Cũng đừng nhầm với clock skew (đồng hồ hai máy lệch) hay eventual consistency ở tầng ứng dụng. Lag bằng 0 không có nghĩa là replica đã sẵn sàng nhận đọc: nó vẫn có thể đang bận.`,
    refs: [
      { type: 'doc', title: 'PostgreSQL: Log-Shipping Standby Servers', url: 'https://www.postgresql.org/docs/current/warm-standby.html' },
    ],
    related: ['read-replica', 'eventual-consistency', 'strong-consistency'],
  },
  {
    id: 'read-replica',
    term: 'Read replica',
    aliases: ['read replica', 'read replicas', 'read-only replica', 'read only replica', 'replica chỉ đọc', 'bản sao chỉ đọc'],
    short: 'Bản sao chỉ nhận đọc, giúp chia tải các truy vấn đọc khỏi máy chính.',
    body: `### Ví dụ đời thường
Một quầy photo giữ bản gốc trong két và đặt bản sao ở quầy cho khách đọc. Ai muốn đọc thì ra quầy, chỉ một người được sửa bản gốc. Quầy càng đông thì càng cần thêm bản sao.

### Cơ chế
Read replica là một máy chủ nhận dữ liệu từ primary qua replication và chỉ phục vụ SELECT. Ứng dụng chia đường đọc và đường ghi, thường qua một router hoặc cấu hình datasource riêng.
1. Ghi luôn đi tới primary.
2. Đọc đi tới replica, thường chọn ngẫu nhiên hoặc theo vùng.
3. Sau khi người dùng ghi, các request đọc ngay sau đó nên tạm gắn vào primary trong vài trăm mili giây để tránh đọc phải dữ liệu cũ.
4. Khi primary chết, một replica có thể được promote thành primary (failover).

~~~text
          ghi                    đọc
Client ---------> Primary <----- Replica 1
                     |  \-------> Replica 2
                     |            (chỉ đọc)
                  WAL stream
~~~

Lợi ích: scale đọc gần như tuyến tính, giảm tải primary, có bản dự phòng. Cái giá: dữ liệu có thể cũ do replication lag, tốn thêm hạ tầng, và failover cần kiểm soát.

### Khi nào dùng
Hệ đọc nhiều như catalog, báo cáo, API tra cứu. Với dữ liệu vừa ghi cần đọc ngay, dùng primary hoặc session stickiness. Đừng dùng replica cho ghi hoặc cho transaction cần nhất quán mạnh.

### Hay nhầm với
Read replica không phải sharding: mỗi replica giữ toàn bộ dữ liệu, chỉ chia tải đọc. Cũng không phải bản backup: replica có thể bị lỗi theo primary và không bảo vệ khỏi xóa nhầm. Replica set trong MongoDB hay cụm HA còn có mục tiêu sẵn sàng cao, không chỉ để đọc.`,
    refs: [
      { type: 'doc', title: 'Amazon RDS: Working with Read Replicas', url: 'https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_ReadRepl.html' },
      { type: 'doc', title: 'PostgreSQL: High Availability, Load Balancing, and Replication', url: 'https://www.postgresql.org/docs/current/high-availability.html' },
    ],
    related: ['replication-lag', 'sharding', 'strong-consistency'],
  },
  {
    id: 'connection-pool-exhaustion',
    term: 'Connection pool exhaustion',
    aliases: ['connection pool exhaustion', 'pool exhaustion', 'connection pool exhausted', 'cạn connection pool', 'hết connection', 'không còn connection'],
    short: 'Hết chỗ trong nhóm kết nối sẵn nên request mới phải chờ hoặc bị từ chối.',
    body: `### Ví dụ đời thường
Một quán chỉ có 10 bàn. Bình thường khách ăn xong rồi đi nên bàn được trả lại. Hôm nay vài khách ngồi lì cả buổi, bàn không trống, khách mới xếp hàng dài. Nhóm kết nối cơ sở dữ liệu cũng vậy: hết chỗ không phải vì database chết, mà vì có người giữ kết nối quá lâu.

### Cơ chế
Ứng dụng giữ một pool gồm tối đa N kết nối mở sẵn. Mỗi request mượn một kết nối, dùng xong trả lại. Khi cả N kết nối đang bận, request thứ N+1 phải chờ tới borrow timeout rồi nhận lỗi.
Nguyên nhân thường gặp:
- Quên đóng kết nối trong nhánh lỗi (leak).
- Giữ kết nối trong lúc gọi HTTP, gọi service khác hoặc chờ lock.
- Truy vấn chậm, transaction dài.
- Thread pool của ứng dụng lớn hơn nhiều so với pool, hoặc nhiều instance cùng cộng lại vượt max_connections của database.
- HikariCP đặt maximumPoolSize quá nhỏ so với tải thật.

~~~text
Pool (max 10): [busy][busy][busy]...[busy]  <-- 10/10
Request 11 --> chờ borrowTimeout (30s) --> timeout
                     |
               thread bị giữ, CPU tăng, API chậm dây chuyền
~~~

Dấu hiệu: latency tăng đều, log timeout lấy connection, metric active connections bằng max, thread dump thấy nhiều thread đang chờ ở getConnection.

### Khi nào dùng
Điều tra khi API chậm hoặc lỗi hàng loạt. Xem metric pool (active, idle, waiting, acquire time), thread dump, pg_stat_activity. Sửa gốc: đóng kết nối đúng cách, bọc try-with-resources, giảm thời gian giữ, đặt timeout hợp lý, tăng pool có tính toán, dùng virtual threads cẩn thận vì chúng có thể làm tăng áp lực lên pool.

### Hay nhầm với
Không phải database hết kết nối là do max_connections. Một pool 20 kết nối nhân 30 pod đã là 600, vượt xa giới hạn database. Cũng đừng nhầm với thread pool exhaustion: thread pool hết thì không có thread xử lý, còn connection pool hết thì thread vẫn có nhưng phải chờ.`,
    refs: [
      { type: 'doc', title: 'HikariCP: About Pool Sizing', url: 'https://github.com/brettwooldridge/HikariCP' },
      { type: 'doc', title: 'PostgreSQL: Connections and Authentication', url: 'https://www.postgresql.org/docs/current/runtime-config-connection.html' },
    ],
    related: ['connection-pool', 'backpressure', 'timeout-budget'],
  },
  {
    id: 'cache-aside',
    term: 'Cache-aside',
    aliases: ['cache-aside', 'cache aside', 'cache aside pattern', 'cache-aside pattern'],
    short: 'Ứng dụng tự đọc cache trước, thiếu thì đọc database rồi ghi lại vào cache.',
    body: `### Ví dụ đời thường
Bạn cần biết giá một món. Bạn mở sổ tay xem có ghi sẵn không. Nếu có, đọc luôn. Nếu không, ra bảng niêm yết, đọc giá rồi chép vào sổ tay để lần sau khỏi đi lại. Chính bạn là người quản lý sổ, không phải cái bảng.

### Cơ chế
Cache-aside (còn gọi lazy loading) để ứng dụng điều phối:
1. Đọc cache theo khóa.
2. Nếu trúng, trả luôn.
3. Nếu trượt, đọc database.
4. Ghi kết quả vào cache kèm thời hạn (TTL).
5. Khi dữ liệu thay đổi, cập nhật database rồi xóa khóa cache, không ghi đè giá trị mới vào cache.

Bước 5 nên xóa thay vì cập nhật vì hai lý do: nhiều luồng có thể ghi đè lẫn nhau, và một lần đọc chậm có thể ghi lại giá trị cũ sau khi đã có giá trị mới. Trong hệ phân tán, có thể cần xóa hai lần hoặc dùng outbox/CDC để đảm bảo cache không giữ dữ liệu cũ quá lâu.

~~~text
Read:  App -> Cache --hit--> trả
                 \--miss--> DB -> App -> Cache.set(TTL)

Write: App -> DB (commit) -> Cache.delete(key)
~~~

### Khi nào dùng
Dữ liệu đọc nhiều, ghi ít, chấp nhận cũ trong khoảng TTL: profile, catalog, cấu hình, bảng tra cứu. Không phù hợp khi cần nhất quán mạnh ngay sau ghi hoặc khi tỉ lệ trúng thấp.

### Hay nhầm với
Cache-aside khác read-through: read-through để cache tự gọi database, còn cache-aside để ứng dụng gọi. Cũng khác write-through (ghi cả cache lẫn database trong một luồng) và write-behind (ghi cache trước, database sau). Cache-aside đơn giản nhưng trách nhiệm nhất quán nằm ở ứng dụng.`,
    refs: [
      { type: 'doc', title: 'Azure Architecture Center: Cache-Aside Pattern', url: 'https://learn.microsoft.com/en-us/azure/architecture/patterns/cache-aside' },
    ],
    related: ['cache-stampede', 'ttl', 'cdn'],
  },
  {
    id: 'cache-stampede',
    term: 'Cache stampede',
    aliases: ['cache stampede', 'stampede', 'thundering herd', 'dogpile', 'cache avalanche'],
    short: 'Một khóa cache hết hạn đúng lúc đông người hỏi nên tất cả cùng lao vào database.',
    body: `### Ví dụ đời thường
Bảng giá trước cửa hàng bị gỡ xuống để thay. Mọi khách cùng lúc không thấy giá nên ùa vào hỏi nhân viên. Một nhân viên thì không thể trả lời hết, cả cửa hàng tắc nghẽn. Cache hết hạn cũng tạo ra cảnh tượng đó ở phía database.

### Cơ chế
Một khóa rất hot hết hạn. Trong khoảng thời gian trước khi có ai đó ghi lại giá trị mới, hàng nghìn request cùng trượt cache và cùng chạy truy vấn database. Database bị quá tải, truy vấn chậm, càng chậm thì càng nhiều request dồn vào.
Các cách chặn:
- **Single flight / mutex:** chỉ một request được đi lấy dữ liệu, các request khác chờ rồi dùng kết quả.
- **Stale-while-revalidate:** trả bản cũ trong lúc một luồng nền làm mới.
- **Jitter TTL:** thêm nhiễu ngẫu nhiên để các khóa không hết hạn cùng lúc.
- **Probabilistic early expiration:** làm mới sớm với xác suất tăng dần khi gần hết hạn.
- **Warm cache** trước sự kiện lớn.

~~~text
key "home:feed" hết hạn
  req 1 ---\
  req 2 ----\___ cùng miss --> DB (quá tải)
  req 3 ----/
  ...
Fix: req 1 giữ mutex -> DB; req 2..n chờ -> dùng kết quả
~~~

### Khi nào dùng
Hay gặp với hot key, TTL đồng loạt sau deploy, traffic tăng đột ngột. Theo dõi bằng biểu đồ QPS database có gai đúng chu kỳ TTL. Với hệ lớn, kết hợp single flight với TTL jitter và giới hạn tải database.

### Hay nhầm với
Cache penetration là request hỏi key không tồn tại nên lần nào cũng xuống database; cache stampede là key có thật nhưng hết hạn. Cache avalanche là nhiều key khác nhau hết hạn cùng lúc, thường do TTL giống nhau hoặc cache restart. Cả ba đều làm database quá tải nhưng cách chữa khác nhau.`,
    refs: [],
    related: ['cache-aside', 'ttl', 'backpressure'],
  },
  {
    id: 'ttl',
    term: 'TTL',
    aliases: ['ttl', 'time to live', 'time-to-live', 'thời gian sống', 'thời hạn cache'],
    short: 'Thời hạn một mục trong cache được coi là còn dùng được trước khi bị xóa.',
    body: `### Ví dụ đời thường
Hộp sữa có hạn dùng in trên nắp. Trong hạn thì bạn dùng, quá hạn thì bỏ dù trông vẫn còn tốt. TTL là hạn dùng gắn cho dữ liệu trong cache: hết hạn thì đừng tin nữa, hãy lấy bản mới.

### Cơ chế
Khi ghi một mục vào cache, bạn kèm thời điểm hết hạn. Redis hỗ trợ EXPIRE theo giây và PEXPIRE theo mili giây; HTTP dùng Cache-Control max-age để trình duyệt và CDN biết giữ bao lâu. Cơ chế xóa thường kết hợp:
- **Lazy expiration:** chỉ kiểm tra và xóa khi có người đọc mục đó.
- **Active expiration:** tiến trình nền quét và xóa dần.
Vì vậy một mục hết hạn có thể vẫn nằm trong bộ nhớ một lúc, chỉ là không còn được trả về.

~~~text
SET session:42 "..." EX 300
  t=0      ghi, hạn 300s
  t=299    còn dùng
  t=300    hết hạn -> lần đọc sau là miss
~~~

TTL ngắn giúp dữ liệu tươi nhưng nhiều lần trượt cache, tăng tải database. TTL dài giúp giảm tải nhưng dữ liệu cũ lâu hơn và khó thu hồi khi có sự kiện. Thêm jitter để tránh mọi khóa cùng hết hạn.

### Khi nào dùng
Gần như mọi cache đều cần TTL để tự chữa lành khi invalidation thất bại. Chọn TTL theo mức chấp nhận dữ liệu cũ của nghiệp vụ: giá hiển thị có thể 1 phút, quyền truy cập nên ngắn hơn, cấu hình ít đổi có thể 1 giờ.

### Hay nhầm với
TTL không phải chính sách loại bỏ khi hết bộ nhớ. LRU, LFU quyết định bỏ mục nào khi cache đầy; TTL quyết định mục còn giá trị hay không. Cũng khác TTI (time to idle), tính từ lần truy cập cuối thay vì từ lúc ghi.`,
    refs: [
      { type: 'doc', title: 'MDN: Cache-Control', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control' },
      { type: 'doc', title: 'Redis: Key expiration', url: 'https://redis.io/docs/latest/commands/expire/' },
    ],
    related: ['cache-aside', 'cache-stampede', 'cdn'],
  },
  {
    id: 'cdn',
    term: 'CDN',
    aliases: ['cdn', 'content delivery network', 'content delivery networks', 'mạng phân phối nội dung'],
    short: 'Mạng máy chủ đặt gần người dùng để trả nội dung nhanh hơn và giảm tải máy gốc.',
    body: `### Ví dụ đời thường
Một hãng nước giải khát không gửi từng chai từ nhà máy ở miền Bắc cho khách miền Nam. Họ đặt kho tại từng khu vực. Khách lấy hàng từ kho gần nhất, nhanh hơn và nhà máy không bị quá tải. CDN là hệ thống kho nội dung đặt khắp nơi.

### Cơ chế
CDN gồm nhiều điểm hiện diện (edge) ở các khu vực. Khi người dùng yêu cầu một tài nguyên:
1. DNS hoặc anycast đưa người dùng tới edge gần nhất về mặt mạng.
2. Edge kiểm tra cache. Nếu có và còn hạn, trả luôn.
3. Nếu không, edge lấy từ máy gốc (hoặc từ một tầng trung gian gọi là origin shield), lưu lại theo TTL rồi trả.
4. Khi nội dung đổi, bạn purge hoặc dùng URL có phiên bản mới.

~~~text
Người dùng VN --> Edge Hà Nội --hit--> trả nhanh
                       |
                    --miss--> Origin (server chính)
                                   |
                              cache tại edge
~~~

CDN hiện đại còn tăng tốc động: tối ưu TLS, nén, HTTP/2, chọn đường mạng tốt hơn tới origin. Cấu hình sai cache key hoặc cache cả dữ liệu riêng tư là lỗi bảo mật nghiêm trọng.

### Khi nào dùng
Tài nguyên tĩnh như JS, CSS, ảnh, video, font; API công khai có thể cache; phòng chống DDoS ở một mức. Không dùng cho dữ liệu phụ thuộc người dùng nếu chưa cấu hình Vary và cache key đúng.

### Hay nhầm với
CDN không phải load balancer. Load balancer chia request trong một cụm máy chủ; CDN đưa nội dung tới gần người dùng toàn cầu. CDN cũng không phải nơi lưu dữ liệu gốc: nó là bản sao có hạn, mất edge thì vẫn phải có origin.`,
    refs: [
      { type: 'doc', title: 'Cloudflare: What is a CDN?', url: 'https://www.cloudflare.com/learning/cdn/what-is-a-cdn/' },
      { type: 'doc', title: 'MDN: CDN', url: 'https://developer.mozilla.org/en-US/docs/Glossary/CDN' },
    ],
    related: ['ttl', 'load-balancer', 'cache-aside'],
  },
  {
    id: 'load-balancer',
    term: 'Load balancer',
    aliases: ['load balancer', 'load balancers', 'load balancing', 'cân bằng tải', 'lb'],
    short: 'Thiết bị hoặc phần mềm chia request đến nhiều máy chủ phía sau.',
    body: `### Ví dụ đời thường
Một quầy tiếp đón có người điều phối: khách vào thì được chỉ tới quầy đang trống, thay vì tất cả dồn vào quầy đầu tiên. Khi một quầy đóng, người điều phối ngừng đưa khách tới đó. Load balancer làm việc đó với request.

### Cơ chế
Load balancer đứng trước một nhóm máy chủ (pool) và quyết định request đi đâu:
- **Lớp 4 (TCP/UDP):** chỉ nhìn IP và cổng, nhanh, không hiểu HTTP.
- **Lớp 7 (HTTP):** đọc được path, header, cookie nên có thể định tuyến theo đường dẫn, kết thúc TLS, nén, thêm header.
Các thuật toán phổ biến:
- Round robin: lần lượt từng máy.
- Least connections: chọn máy ít kết nối nhất.
- Consistent hashing: cùng một khóa luôn về cùng một máy, hữu ích cho cache.
- Weighted: máy khỏe nhận nhiều hơn.
Kèm theo là health check: máy nào fail thì tạm gỡ khỏi pool.

~~~text
Client --> LB (health check mỗi 5s)
             |--> app-1  (healthy)
             |--> app-2  (healthy)
             |--> app-3  (fail -> gỡ khỏi pool)
~~~

Load balancer cũng có thể là điểm chết duy nhất, nên thường chạy nhiều instance hoặc dùng dịch vụ có sẵn của cloud. Sticky session giúp giữ người dùng trên một máy nhưng làm mất cân bằng khi máy đó chết.

### Khi nào dùng
Khi chạy nhiều instance dịch vụ, cần zero-downtime deploy, cần kết thúc TLS tập trung hoặc cần mở rộng theo chiều ngang. Với một máy duy nhất thì load balancer chưa cần thiết.

### Hay nhầm với
API gateway hiểu nghiệp vụ API: xác thực, rate limit, biến đổi request. Load balancer chủ yếu chia tải. Reverse proxy có thể chỉ trỏ tới một backend, không nhất thiết cân bằng. CDN tối ưu khoảng cách địa lý, không thay load balancer nội bộ.`,
    refs: [
      { type: 'doc', title: 'NGINX: HTTP Load Balancing', url: 'https://docs.nginx.com/nginx/admin-guide/load-balancer/http-load-balancer/' },
      { type: 'doc', title: 'Kubernetes: Service', url: 'https://kubernetes.io/docs/concepts/services-networking/service/' },
    ],
    related: ['cdn', 'hpa', 'kubernetes-pod'],
  },
  {
    id: 'container',
    term: 'Container',
    aliases: ['container', 'containers', 'docker container', 'container image'],
    short: 'Gói ứng dụng cùng thư viện và cấu hình để chạy giống nhau ở mọi máy.',
    body: `### Ví dụ đời thường
Một hộp cơm đóng sẵn gồm cơm, thức ăn và gia vị. Ai mua cũng được đúng phần đó, không phụ thuộc nhà bếp của họ có gì. Container đóng gói ứng dụng kèm mọi thứ nó cần để chạy.

### Cơ chế
Container không ảo hóa phần cứng như máy ảo. Nó dùng tính năng của kernel Linux:
- **Namespaces** cô lập process, mạng, mount, PID, user. Ứng dụng trong container tưởng mình là process chính trên một máy riêng.
- **cgroups** giới hạn và đo CPU, RAM, I/O.
- **Image** là các lớp chỉ đọc xếp chồng: base image, thư viện, mã ứng dụng. Chạy image tạo ra container với một lớp ghi phía trên.
Vì dùng chung kernel, container khởi động nhanh, nhẹ hơn máy ảo, nhưng không cô lập mạnh bằng máy ảo.

~~~text
Image layers:
  [ base OS libs ]
  [ JDK 21        ]
  [ app.jar       ]
  [ config        ]  <-- đọc
        |
   container (lớp ghi tạm)
~~~

Nguyên tắc thực tế: image immutable, cấu hình đưa vào qua biến môi trường, không ghi dữ liệu quan trọng vào filesystem của container, chạy process chính ở foreground để nhận tín hiệu dừng.

### Khi nào dùng
Đóng gói service để chạy giống nhau từ laptop đến CI đến production; triển khai nhanh, rollback bằng image cũ; chạy nhiều phiên bản song song. Không phù hợp khi cần kernel riêng hoặc phần cứng đặc biệt.

### Hay nhầm với
Container không phải máy ảo: máy ảo có kernel riêng, cô lập mạnh hơn nhưng nặng hơn. Container cũng không phải pod của Kubernetes: pod là đơn vị bao quanh một hoặc vài container dùng chung mạng.`,
    refs: [
      { type: 'doc', title: 'Docker: What is a container?', url: 'https://docs.docker.com/get-started/docker-concepts/the-basics/what-is-a-container/' },
      { type: 'doc', title: 'Kubernetes: Containers', url: 'https://kubernetes.io/docs/concepts/containers/' },
    ],
    related: ['kubernetes-pod', 'infrastructure-as-code', 'blue-green-deployment'],
  },
  {
    id: 'kubernetes-pod',
    term: 'Kubernetes pod',
    aliases: ['kubernetes pod', 'kubernetes pods', 'k8s pod', 'k8s pods', 'pod', 'pods'],
    short: 'Đơn vị nhỏ nhất Kubernetes chạy: một hoặc vài container dùng chung mạng và ổ đĩa.',
    body: `### Ví dụ đời thường
Một ca làm việc gồm vài người ngồi cùng một phòng, dùng chung wifi và tủ hồ sơ. Họ được xếp vào cùng ca, nghỉ cùng lúc. Pod giống một ca như vậy: các container trong pod sống chung, chia sẻ địa chỉ mạng và volume.

### Cơ chế
Pod là đơn vị triển khai nhỏ nhất trong Kubernetes:
- Các container trong pod dùng chung network namespace, nên nói chuyện qua localhost và chia sẻ một IP.
- Chúng có thể chia sẻ volume.
- Pod được tạo từ một spec, thường do Deployment hoặc ReplicaSet quản lý. Nếu pod chết, controller tạo pod mới thay thế, nhưng pod mới có IP khác.
- Pod thường chứa một container chính và các sidecar như proxy, log shipper.
- Kubernetes không sửa container đang chạy; nó thay cả pod bằng image mới.

~~~text
Deployment (3 replicas)
   |-- Pod A: [app] [sidecar]  IP 10.1.1.5
   |-- Pod B: [app] [sidecar]  IP 10.1.1.6
   |-- Pod C: [app] [sidecar]  IP 10.1.1.7
Service -> chọn pod theo label, cân bằng tải
~~~

Vì pod là tạm thời, đừng lưu dữ liệu quan trọng trong filesystem của nó. Đừng dựa vào IP pod; hãy dùng Service hoặc DNS. Đặt resource requests để scheduler xếp pod và HPA có dữ liệu tính toán.

### Khi nào dùng
Mọi workload chạy trên Kubernetes đều qua pod, dù bạn viết Deployment, StatefulSet hay Job. Hiểu pod giúp debug vì sao restart, vì sao không nhận traffic, vì sao bị OOMKilled.

### Hay nhầm với
Pod không phải container: pod là một nhóm container. Pod không phải node: node là máy chủ, pod là đơn vị chạy trên node. Pod cũng không phải Deployment: Deployment là bản thiết kế quản lý vòng đời các pod.`,
    refs: [
      { type: 'doc', title: 'Kubernetes: Pods', url: 'https://kubernetes.io/docs/concepts/workloads/pods/' },
      { type: 'doc', title: 'Kubernetes: Pod Lifecycle', url: 'https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/' },
    ],
    related: ['container', 'readiness-liveness-probe', 'hpa'],
  },
  {
    id: 'readiness-liveness-probe',
    term: 'Readiness / liveness probe',
    aliases: ['readiness probe', 'liveness probe', 'startup probe', 'readiness probes', 'liveness probes', 'readiness', 'liveness', 'health probe'],
    short: 'Hai bài kiểm tra sức khỏe: một để biết đã nhận traffic được chưa, một để biết còn sống để restart.',
    body: `### Ví dụ đời thường
Một nhân viên mới đi làm. Câu hỏi "còn thở không" quyết định có phải gọi cấp cứu hay không. Câu hỏi "đã mở quầy được chưa" quyết định có cho khách vào hay chưa. Hai câu hỏi khác nhau, dù cùng nói về một người.

### Cơ chế
kubelet định kỳ gọi probe theo ba cách: HTTP GET, mở TCP, hoặc chạy lệnh trong container.
- **Readiness probe:** nếu fail, pod bị gỡ khỏi Service endpoints, không nhận traffic. Khi pass lại, pod được thêm vào. Dùng khi ứng dụng chưa sẵn sàng: đang nạp cache, chưa kết nối được database.
- **Liveness probe:** nếu fail đủ số lần, container bị restart. Dùng để phát hiện treo, deadlock, không thể tự phục hồi.
- **Startup probe:** cho ứng dụng khởi động chậm; trong lúc startup chưa chạy liveness, tránh bị restart oan.

~~~text
kubelet -> GET /health/ready  (mỗi 5s, fail 3 lần -> gỡ endpoint)
        -> GET /health/live   (mỗi 10s, fail 3 lần -> restart)

Service endpoints: [pod A ready] [pod B NOT ready] [pod C ready]
                                  ^ không nhận request
~~~

Lỗi kinh điển: để liveness kiểm tra database. Database chậm một chút làm mọi pod fail liveness và bị restart hàng loạt, biến sự cố nhỏ thành sự cố lớn. Liveness chỉ nên kiểm tra chính process còn phản hồi được.

### Khi nào dùng
Mọi service production chạy Kubernetes. Readiness nên phản ánh khả năng phục vụ thật; liveness nên rẻ và chỉ kiểm tra nội tại; startup cho Java app khởi động lâu. Cấu hình initialDelay, period, failureThreshold theo thực tế.

### Hay nhầm với
Readiness không restart pod, chỉ ngắt traffic. Liveness restart container. Startup chỉ chạy một lần lúc đầu. Cũng đừng nhầm với health check của load balancer bên ngoài: cùng ý tưởng nhưng do thành phần khác gọi.`,
    refs: [
      { type: 'doc', title: 'Kubernetes: Configure Liveness, Readiness and Startup Probes', url: 'https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/' },
    ],
    related: ['kubernetes-pod', 'load-balancer', 'blue-green-deployment'],
  },
  {
    id: 'hpa',
    term: 'HPA autoscaling',
    aliases: ['hpa', 'horizontal pod autoscaler', 'horizontal pod autoscaling', 'horizontal pod autoscalers', 'autoscaling', 'autoscaler', 'tự động scale'],
    short: 'Kubernetes tự thêm hoặc bớt số bản sao theo tải đo được.',
    body: `### Ví dụ đời thường
Quán cà phê có hai nhân viên lúc vắng, nhưng khi khách xếp hàng thì quản lý gọi thêm người từ ca dự bị. Đông quá thì gọi thêm nữa; vắng thì cho về. HPA là người quản lý tự động làm việc đó với số bản sao ứng dụng.

### Cơ chế
HPA là một controller trong Kubernetes. Nó đọc metric của các pod (CPU, RAM, hoặc metric tùy chỉnh) rồi so với mục tiêu:
1. metrics-server hoặc adapter cung cấp số liệu.
2. HPA tính tỉ lệ hiện tại so với mục tiêu.
3. Số replica mong muốn = làm tròn lên của số hiện tại nhân tỉ lệ đó.
4. HPA sửa số replica của Deployment; Deployment tạo hoặc xóa pod.
5. Khi tải giảm, HPA scale down chậm hơn để tránh nhấp nháy.

~~~text
3 pod, CPU trung bình 80%, target 50%
desired = ceil(3 * 80/50) = ceil(4.8) = 5 pod

Tải giảm còn 20% -> scale down từ từ (cooldown)
~~~

Yêu cầu quan trọng: pod phải có resource requests thì HPA tính theo phần trăm CPU mới có nghĩa. Nếu ứng dụng khởi động 60 giây, scale nhanh có thể không kịp cứu traffic dồn. Nếu tải tăng làm database quá tải, thêm pod chỉ làm database chết nhanh hơn.

### Khi nào dùng
Tải biến động theo giờ hoặc theo sự kiện, chạy trên Kubernetes. Kết hợp với cluster autoscaler để thêm node khi không đủ chỗ. Với tải dự đoán được, đặt lịch scale trước còn tốt hơn chờ metric.

### Hay nhầm với
HPA thay đổi số bản sao (ngang). VPA thay đổi tài nguyên cấp cho mỗi pod (dọc). Cluster autoscaler thêm hoặc bớt node. Load balancer chỉ chia traffic, không tạo thêm pod.`,
    refs: [
      { type: 'doc', title: 'Kubernetes: Horizontal Pod Autoscaling', url: 'https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/' },
      { type: 'doc', title: 'Kubernetes: HorizontalPodAutoscaler Walkthrough', url: 'https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale-walkthrough/' },
    ],
    related: ['kubernetes-pod', 'load-balancer', 'p99-latency'],
  },
  {
    id: 'blue-green-deployment',
    term: 'Blue-green deployment',
    aliases: ['blue-green deployment', 'blue green deployment', 'blue-green', 'blue green', 'blue/green', 'triển khai xanh lam'],
    short: 'Chạy hai môi trường giống hệt, chuyển toàn bộ traffic sang bản mới khi nó đã sẵn sàng.',
    body: `### Ví dụ đời thường
Một nhà hàng mở thêm căn bếp mới y hệt bếp cũ. Đầu bếp nấu thử và kiểm tra mọi thứ ở bếp mới. Khi chắc chắn ổn, quản lý chuyển toàn bộ đơn sang bếp mới rồi đóng bếp cũ. Nếu bếp mới có sự cố, chỉ cần chuyển đơn ngược lại.

### Cơ chế
Có hai môi trường song song, thường gọi là blue (đang chạy) và green (bản mới):
1. Green được triển khai và chạy thử, chưa nhận traffic thật.
2. Kiểm tra smoke test, migration database, cấu hình.
3. Chuyển traffic từ blue sang green bằng cách đổi weight ở load balancer, DNS hoặc service selector.
4. Theo dõi. Nếu lỗi, chuyển traffic ngược lại blue ngay lập tức.
5. Khi green ổn định, blue trở thành môi trường dự phòng cho lần sau.

~~~text
           +--> Blue  (v1)  <-- traffic 100%
Client --> LB
           +--> Green (v2)  <-- traffic 0%, đã test

Chuyển: Blue 0% | Green 100%
Rollback: Blue 100% | Green 0%
~~~

Điều kiện khó nhất là database. Nếu bản mới đổi schema không tương thích, cả hai môi trường không thể cùng chạy trên một database. Vì vậy cần migration tương thích hai chiều: thêm cột trước, deploy code, sau mới bỏ cột cũ. Cũng cần chú ý session, cache, message format giữa hai phiên bản.

### Khi nào dùng
Release lớn cần rollback tức thì, hệ thống có đủ tài nguyên gấp đôi, thay đổi khó test hết trên staging. Không phù hợp khi chi phí hạ tầng là ràng buộc cứng hoặc khi stateful service khó nhân đôi.

### Hay nhầm với
Canary chia một phần nhỏ traffic cho bản mới và tăng dần, còn blue-green chuyển toàn bộ một lần. Rolling update thay từng instance trong cùng môi trường, không có hai môi trường độc lập. Blue-green cũng không phải backup: môi trường cũ chỉ là bản chạy trước, không bảo vệ dữ liệu.`,
    refs: [
      { type: 'article', title: 'Martin Fowler: BlueGreenDeployment', url: 'https://martinfowler.com/bliki/BlueGreenDeployment.html' },
    ],
    related: ['canary-deployment', 'load-balancer', 'container'],
  },
  {
    id: 'canary-deployment',
    term: 'Canary deployment',
    aliases: ['canary deployment', 'canary release', 'canary deploy', 'canary', 'triển khai canary'],
    short: 'Đưa một phần nhỏ traffic sang bản mới, theo dõi rồi tăng dần nếu ổn.',
    body: `### Ví dụ đời thường
Một quán muốn thử món mới nhưng không dám đổi toàn bộ thực đơn. Họ cho vài khách dùng thử, quan sát phản ứng. Nếu ổn, bán cho nhiều người hơn; nếu không, rút món ngay mà phần lớn khách không hề biết.

### Cơ chế
Canary đưa một tỉ lệ nhỏ traffic tới phiên bản mới, phần còn lại vẫn dùng phiên bản cũ:
1. Triển khai phiên bản canary bên cạnh bản cũ.
2. Chuyển 1 phần trăm traffic, thường theo trọng số ở load balancer hoặc service mesh.
3. So sánh metric giữa canary và baseline: tỉ lệ lỗi, p99, log exception, business metric.
4. Nếu ổn, tăng dần 5, 25, 50 rồi 100 phần trăm. Nếu lỗi, đưa về 0 ngay.
5. Có thể tự động hóa bằng công cụ như Argo Rollouts hoặc Flagger.

~~~text
v1 (baseline) <-- 95% traffic
v2 (canary)   <-- 5% traffic

So sánh: error rate, p99, saturation
  ổn  -> tăng dần
  lỗi -> rollback về 0%
~~~

Canary chỉ hiệu quả khi có đủ lưu lượng để phát hiện lỗi và có observability tách được metric theo phiên bản. Nếu traffic quá ít, 1 phần trăm chưa đủ để thấy lỗi trong vài giờ. Cần chú ý session và dữ liệu: người dùng lỡ vào canary rồi quay lại bản cũ phải không bị lỗi.

### Khi nào dùng
Thay đổi rủi ro trên hệ có traffic lớn, cần giới hạn phạm vi ảnh hưởng. Đặc biệt hữu ích khi không thể tái hiện đầy đủ lỗi ở staging.

### Hay nhầm với
Blue-green chuyển toàn bộ traffic một lần. A/B test cũng chia traffic nhưng mục tiêu là đo hành vi người dùng cho quyết định sản phẩm, không phải kiểm tra độ ổn định của bản release. Canary cũng khác feature flag: flag bật tắt tính năng, canary chuyển phiên bản code.`,
    refs: [
      { type: 'article', title: 'Martin Fowler: CanaryRelease', url: 'https://martinfowler.com/bliki/CanaryRelease.html' },
      { type: 'doc', title: 'Argo Rollouts: Canary', url: 'https://argo-rollouts.readthedocs.io/en/stable/features/canary/' },
    ],
    related: ['blue-green-deployment', 'observability', 'p99-latency'],
  },
  {
    id: 'infrastructure-as-code',
    term: 'Infrastructure as code',
    aliases: ['infrastructure as code', 'infrastructure-as-code', 'iac', 'hạ tầng dưới dạng mã', 'hạ tầng như mã'],
    short: 'Mô tả hạ tầng bằng file cấu hình để máy tạo lại được, thay vì bấm tay trên giao diện.',
    body: `### Ví dụ đời thường
Thay vì nhớ từng bước nấu một món, bạn viết công thức ra giấy. Ai cầm công thức cũng nấu được, và lần sau muốn đổi gia vị thì sửa công thức. Hạ tầng dưới dạng mã là công thức cho máy chủ, mạng, database.

### Cơ chế
Bạn khai báo trạng thái mong muốn trong file: bao nhiêu máy, cấu hình mạng, quyền truy cập, database. Công cụ so sánh trạng thái thật với file rồi tạo kế hoạch thay đổi.
- **Terraform:** quản lý tài nguyên cloud, có state file, plan trước khi apply.
- **CloudFormation:** dịch vụ của AWS, chạy theo stack.
- **Ansible:** cấu hình bên trong máy, thường không cần agent.
- **Pulumi:** viết bằng ngôn ngữ lập trình thay vì DSL.

~~~text
File .tf (mong muốn) ---> plan ---> apply ---> Cloud thật
        ^                                      |
        |__________ state (thực tế đã tạo) _____|
~~~

Thực hành tốt: review thay đổi qua pull request, môi trường tách biệt, state lưu ở nơi chia sẻ có khóa, không commit secret, chạy drift detection để phát hiện ai sửa tay.

### Khi nào dùng
Gần như mọi hạ tầng production, đặc biệt nhiều môi trường hoặc nhiều tài khoản cloud. Cũng dùng để tạo lại môi trường test giống production. Không phù hợp cho thay đổi khẩn cấp không qua quy trình, vì lần apply sau sẽ ghi đè.

### Hay nhầm với
IaC không phải CI/CD: CI/CD là pipeline build và deploy ứng dụng; IaC tạo hạ tầng bên dưới. Cũng khác configuration management: IaC thường tạo tài nguyên, configuration management chỉnh cấu hình bên trong tài nguyên đã có. Terraform không phải công cụ duy nhất, chỉ là phổ biến.`,
    refs: [
      { type: 'article', title: 'Martin Fowler: InfrastructureAsCode', url: 'https://martinfowler.com/bliki/InfrastructureAsCode.html' },
      { type: 'doc', title: 'Terraform: Introduction', url: 'https://developer.hashicorp.com/terraform/intro' },
    ],
    related: ['container', 'secret-rotation', 'blue-green-deployment'],
  },
  {
    id: 'observability',
    term: 'Observability',
    aliases: ['observability', 'khả năng quan sát', 'three pillars', 'ba trụ cột'],
    short: 'Khả năng hiểu hệ thống đang làm gì từ dữ liệu nó phát ra, không cần đoán.',
    body: `### Ví dụ đời thường
Bác sĩ không hỏi bệnh nhân "anh thấy thế nào" rồi đoán. Họ đo mạch, nhiệt độ, xét nghiệm máu, chụp hình. Từ các tín hiệu đó họ suy ra bệnh. Observability là bộ tín hiệu giúp bạn suy ra hệ thống đang hỏng ở đâu.

### Cơ chế
Ba loại tín hiệu chính:
- **Log:** sự kiện rời rạc, có ngữ cảnh, dùng để biết chuyện gì đã xảy ra. Cần cấu trúc (JSON), có mức log, có correlation id.
- **Metric:** con số tổng hợp theo thời gian, rẻ để lưu và truy vấn. Dùng cho dashboard, cảnh báo, tính SLO.
- **Trace:** đường đi của một request qua nhiều service, gồm các span và thời gian từng chặng. Dùng để tìm service nào chậm.

Ghép ba loại lại: metric báo "p99 tăng", trace chỉ ra "chậm ở payment service", log cho biết "timeout gọi ngân hàng". OpenTelemetry là chuẩn mở để thu thập cả ba.

~~~text
Request --> API Gateway --> Order --> Payment --> Bank
   trace id: 7f3c...
   |-- span gateway 12ms
       |-- span order 340ms
           |-- span payment 320ms  <-- chậm ở đây
               |-- log: bank timeout
~~~

Cái giá: chi phí lưu trữ và cardinality. Gắn nhãn user_id vào metric có thể tạo hàng triệu chuỗi thời gian và làm nổ chi phí. Cần lấy mẫu trace và đặt retention hợp lý.

### Khi nào dùng
Hệ microservices, hệ có nhiều biến số, production cần điều tra sự cố nhanh. Observability không thay thế monitoring: monitoring trả lời câu đã biết trước, observability giúp trả lời câu chưa biết trước.

### Hay nhầm với
Observability không phải chỉ là dashboard hay log tập trung. Cũng không phải distributed tracing: tracing là một phần. Monitoring là tập con: bạn đặt câu hỏi trước và xem biểu đồ; observability cho phép hỏi những câu mới từ dữ liệu thô.`,
    refs: [
      { type: 'doc', title: 'OpenTelemetry: What is OpenTelemetry?', url: 'https://opentelemetry.io/docs/what-is-opentelemetry/' },
      { type: 'doc', title: 'Google SRE Book: Monitoring Distributed Systems', url: 'https://sre.google/sre-book/monitoring-distributed-systems/' },
    ],
    related: ['slo-sla-sli', 'p99-latency', 'canary-deployment', 'distributed-tracing'],
  },
  {
    id: 'slo-sla-sli',
    term: 'SLO / SLA / SLI',
    aliases: ['slo', 'slos', 'sla', 'slas', 'sli', 'slis', 'service level objective', 'service level objectives', 'service level agreement', 'service level indicator'],
    short: 'SLI là số đo, SLO là mục tiêu nội bộ, SLA là cam kết với khách kèm hậu quả.',
    body: `### Ví dụ đời thường
Một lớp học có ba thứ: điểm kiểm tra thực tế (SLI), mục tiêu bạn tự đặt là trên 8 điểm (SLO), và hợp đồng với phụ huynh rằng nếu dưới 7 thì sẽ học thêm bù (SLA). Ba con số gần nhau nhưng mục đích khác nhau.

### Cơ chế
- **SLI (indicator):** con số đo được, ví dụ tỉ lệ request thành công, tỉ lệ request dưới 300ms. Nên định nghĩa chính xác: good events chia valid events, đo ở đâu (client hay server), cửa sổ thời gian nào.
- **SLO (objective):** mục tiêu nội bộ cho SLI, ví dụ 99,9 phần trăm request thành công trong 30 ngày. Từ đó suy ra error budget: 0,1 phần trăm thời gian được phép lỗi.
- **SLA (agreement):** cam kết với khách, thường kèm bồi thường hoặc phạt. SLA thường thấp hơn SLO một chút để có đệm.

~~~text
SLI = request thành công / tổng request
SLO = 99.9% trong 30 ngày
error budget = 0.1% * 30 ngày ~ 43 phút

SLA = 99.5% (cam kết với khách)
SLO chặt hơn SLA để không vi phạm hợp đồng
~~~

Error budget đổi cách ra quyết định: còn budget thì được release nhanh, cháy budget thì ưu tiên ổn định. Đo SLO bằng dữ liệu thật, không bằng cảm giác. Đừng đặt SLO cho thứ không đo được.

### Khi nào dùng
Vận hành service production, thống nhất giữa dev và business về mức ổn định, quyết định khi nào dừng ra tính năng mới để sửa reliability. Cũng dùng khi thiết kế alert: cảnh báo theo tốc độ đốt error budget thay vì từng lỗi lẻ.

### Hay nhầm với
SLA không phải SLO: SLA là hợp đồng, SLO là mục tiêu nội bộ. SLI không phải metric chung chung: SLI phải gắn với trải nghiệm người dùng. SLO cũng khác KPI: KPI đo hiệu quả kinh doanh, SLO đo độ tin cậy của service.`,
    refs: [
      { type: 'doc', title: 'Google SRE Book: Service Level Objectives', url: 'https://sre.google/sre-book/service-level-objectives/' },
      { type: 'doc', title: 'Google SRE Workbook: Implementing SLOs', url: 'https://sre.google/workbook/implementing-slos/' },
    ],
    related: ['p99-latency', 'observability'],
  },
  {
    id: 'p99-latency',
    term: 'p99 latency',
    aliases: ['p99', 'p99 latency', 'p99.9', 'p95', 'tail latency', 'latency tail', 'độ trễ đuôi'],
    short: '99 phần trăm request nhanh hơn ngưỡng này; 1 phần trăm chậm hơn, thường là trải nghiệm tệ nhất.',
    body: `### Ví dụ đời thường
Một quầy phục vụ 100 khách. 99 người được phục vụ dưới 5 phút, một người phải chờ 40 phút. Nếu bạn chỉ tính trung bình, con số trông rất đẹp và bạn không thấy người khách khổ sở kia. p99 kể câu chuyện của người đó.

### Cơ chế
Percentile chia mẫu theo thứ tự: p99 là giá trị mà 99 phần trăm mẫu nhỏ hơn hoặc bằng nó. Percentile được tính từ histogram hoặc thuật toán xấp xỉ, không phải bằng cách lấy trung bình các con số.
Vì sao p99 quan trọng: phân phối độ trễ thường lệch phải, có đuôi dài. Trung bình bị các request nhanh kéo xuống và che mất đuôi. Đuôi chậm thường đến từ GC, queue, cache miss, retry, lock, hoặc một instance quá tải.

~~~text
100 request (ms):
  95 request: 20-80ms
   4 request: 150-300ms
   1 request: 2500ms

average ~ 60ms (trông ổn)
p99 = 2500ms (người dùng thật thấy)
~~~

Cẩn thận: không thể lấy trung bình p99 của nhiều instance để ra p99 toàn hệ. Phải gộp histogram hoặc tính trên dữ liệu thô. Cũng cần đủ mẫu: p99 trên 100 request chỉ là request chậm nhất.

### Khi nào dùng
Đặt SLO latency, đánh giá hiệu năng API, capacity planning, so sánh trước và sau tối ưu. Hệ lớn thường theo dõi p99 và p99.9. Với tác vụ nền, p50 có thể đủ.

### Hay nhầm với
p99 không phải trung bình và không phải giá trị lớn nhất. p95 và p99 khác nhau: p99 nhìn sâu vào đuôi hơn. Cũng đừng nhầm p99 latency với throughput: hệ có thể chịu tải cao nhưng p99 tệ, hoặc ngược lại.`,
    refs: [
      { type: 'doc', title: 'Google SRE Book: Service Level Objectives', url: 'https://sre.google/sre-book/service-level-objectives/' },
    ],
    related: ['slo-sla-sli', 'observability', 'hpa'],
  },
  {
    id: 'jwt',
    term: 'JWT',
    aliases: ['jwt', 'jwt token', 'jwt tokens', 'json web token', 'json web tokens'],
    short: 'Một chuỗi token tự chứa thông tin người dùng, có chữ ký để máy chủ kiểm tra mà không cần lưu session.',
    body: `### Ví dụ đời thường
Vé vào cổng hội chợ có in sẵn tên, loại vé và ngày, kèm dấu giáp lai của ban tổ chức. Người soát vé chỉ cần nhìn dấu và thông tin trên vé, không phải tra sổ. Nhưng nếu vé bị in giả mà không có dấu thì bị chặn.

### Cơ chế
JWT gồm ba phần ngăn bằng dấu chấm:
- **Header:** thuật toán ký, ví dụ HS256 hoặc RS256.
- **Payload:** các claim như sub (người dùng), exp (hết hạn), iss (người phát hành), aud (đối tượng), role.
- **Signature:** chữ ký trên header và payload bằng khóa bí mật hoặc khóa riêng.

Máy chủ nhận token sẽ kiểm tra chữ ký, thời hạn, người phát hành và đối tượng. Payload chỉ được mã hóa base64url, không phải mã hóa bí mật: ai cầm token cũng đọc được nội dung. Vì vậy không đặt dữ liệu nhạy cảm trong payload.

~~~text
eyJhbGciOiJIUzI1NiJ9 . eyJzdWIiOiI0MiIsImV4cCI6MTcwMH0 . signature
      header                    payload                     chữ ký

Server: verify(signature) + exp + iss + aud
~~~

JWT thường đi kèm access token ngắn hạn (5 đến 15 phút) và refresh token dài hạn. Muốn thu hồi ngay thì cần thêm danh sách đen hoặc kiểm tra phiên bản token, vì bản thân JWT không thu hồi được.

### Khi nào dùng
API stateless, SPA, mobile, service-to-service. Phù hợp khi nhiều service cùng cần xác thực mà không muốn gọi database mỗi request. Không phù hợp khi cần đăng xuất tức thì trên mọi thiết bị hoặc khi token sống quá lâu.

### Hay nhầm với
JWT không phải OAuth2: OAuth2 là giao thức ủy quyền, JWT chỉ là một định dạng token có thể dùng trong đó. JWT cũng không phải session cookie: session lưu trạng thái ở server, JWT mang trạng thái trong token. Đừng nhầm với JWE, nơi payload được mã hóa thật.`,
    refs: [
      { type: 'doc', title: 'RFC 7519: JSON Web Token', url: 'https://www.rfc-editor.org/rfc/rfc7519' },
    ],
    related: ['oauth2', 'pkce', 'secret-rotation'],
  },
  {
    id: 'oauth2',
    term: 'OAuth 2.0',
    aliases: ['oauth', 'oauth2', 'oauth 2', 'oauth 2.0', 'open authorization'],
    short: 'Giao thức cho phép ứng dụng lấy quyền truy cập tài nguyên thay mặt người dùng mà không cần biết mật khẩu.',
    body: `### Ví dụ đời thường
Bạn vào khách sạn và được phát một thẻ ra vào chỉ mở được phòng của mình, có hạn theo ngày. Lễ tân không đưa bạn chìa khóa tổng, và bạn không cần biết mật khẩu hệ thống cửa. OAuth2 cấp cho ứng dụng một thẻ như vậy để truy cập tài nguyên.

### Cơ chế
Bốn vai:
- **Resource owner:** người dùng.
- **Client:** ứng dụng muốn truy cập.
- **Authorization server:** nơi người dùng đăng nhập và cấp quyền.
- **Resource server:** API chứa dữ liệu.

Luồng authorization code phổ biến:
1. Client chuyển người dùng sang authorization server kèm client_id, scope, redirect_uri, state.
2. Người dùng đăng nhập và đồng ý.
3. Server chuyển về redirect_uri kèm authorization code ngắn hạn.
4. Client đổi code lấy access token (và thường cả refresh token) ở kênh back-channel.
5. Client gọi resource server với access token.

~~~text
User -> Client -> Auth Server: xin quyền
User <- Auth Server: đăng nhập, đồng ý
Client <- Auth Server: authorization code
Client -> Auth Server: code + client secret (back-channel)
Client <- Auth Server: access token + refresh token
Client -> API: Bearer access token
~~~

Không dùng implicit flow hay password flow cho ứng dụng mới. Public client như SPA, mobile phải dùng PKCE. Access token nên ngắn hạn, scope tối thiểu, và không đặt token trong URL.

### Khi nào dùng
Đăng nhập bằng Google, Facebook; cấp quyền cho ứng dụng bên thứ ba; service-to-service với client credentials; API mở cho đối tác. Với một ứng dụng nội bộ đơn giản, session truyền thống có thể đủ và an toàn hơn.

### Hay nhầm với
OAuth2 không phải cơ chế đăng nhập, dù hay được dùng kèm OpenID Connect. OAuth2 chỉ nói về ủy quyền truy cập. JWT là định dạng token, có thể dùng hoặc không. Cũng đừng nhầm OAuth2 với SAML, một chuẩn enterprise cũ hơn dùng XML.`,
    refs: [
      { type: 'doc', title: 'RFC 6749: The OAuth 2.0 Authorization Framework', url: 'https://www.rfc-editor.org/rfc/rfc6749' },
      { type: 'doc', title: 'OAuth 2.0 Security Best Current Practice', url: 'https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics' },
    ],
    related: ['jwt', 'pkce', 'mtls'],
  },
  {
    id: 'pkce',
    term: 'PKCE',
    aliases: ['pkce', 'proof key for code exchange', 'code challenge', 'code_verifier'],
    short: 'Cách bảo vệ luồng đăng nhập công khai bằng một cặp mã tạm mà kẻ đánh cắp code cũng không đổi được token.',
    body: `### Ví dụ đời thường
Bạn gửi đồ cho người quen qua quầy. Nhân viên đưa một phiếu có mã tạm. Khi người nhận tới lấy, họ phải đọc đúng mã tạm đó. Kẻ nhặt được phiếu ngoài đường không biết mã nên không lấy được đồ. PKCE tạo ra mã tạm như vậy cho luồng đăng nhập.

### Cơ chế
PKCE (Proof Key for Code Exchange, đọc là "pixy") dành cho ứng dụng không giữ được client secret, như SPA và mobile:
1. Client tạo một chuỗi ngẫu nhiên gọi là code_verifier.
2. Client băm nó bằng SHA-256, thường mã hóa base64url, được code_challenge.
3. Khi chuyển người dùng sang authorization server, client gửi code_challenge và phương thức S256.
4. Server lưu challenge và trả authorization code.
5. Khi đổi code lấy token, client gửi kèm code_verifier gốc.
6. Server băm verifier và so với challenge. Chỉ khớp thì mới cấp token.

~~~text
Client: verifier = random(43..128 ký tự)
        challenge = BASE64URL(SHA256(verifier))

Authorize: ...&code_challenge=abc&code_challenge_method=S256
Token:     code=xyz&code_verifier=<verifier gốc>
Server:    SHA256(verifier) == abc ? cấp token : từ chối
~~~

Nếu kẻ tấn công chặn được authorization code, chúng vẫn không có verifier nên không đổi được token. PKCE không thay thế state; state vẫn cần để chống CSRF trên redirect.

### Khi nào dùng
Bắt buộc với mọi public client dùng authorization code, tức SPA, ứng dụng mobile, ứng dụng desktop. Confidential client cũng nên dùng. Đây là khuyến nghị bảo mật hiện hành, không phải tùy chọn.

### Hay nhầm với
PKCE không phải client secret: secret có thể bị trích xuất từ app, còn verifier chỉ tồn tại trong phiên và không gửi ở bước đầu. PKCE cũng không mã hóa token, chỉ chứng minh code được đổi bởi đúng client đã xin. Đừng nhầm với state, thứ chống CSRF.`,
    refs: [
      { type: 'doc', title: 'RFC 7636: Proof Key for Code Exchange', url: 'https://www.rfc-editor.org/rfc/rfc7636' },
    ],
    related: ['oauth2', 'jwt'],
  },
  {
    id: 'mtls',
    term: 'mTLS',
    aliases: ['mtls', 'mutual tls', 'mutual tls authentication', 'tls hai chiều', 'xác thực hai chiều'],
    short: 'Cả hai phía đều xuất trình chứng chỉ, không chỉ máy chủ, để chứng minh danh tính.',
    body: `### Ví dụ đời thường
Ở cửa một tòa nhà bảo mật, bảo vệ kiểm tra thẻ của khách, và khách cũng kiểm tra thẻ của bảo vệ trước khi đi theo. Hai bên đều phải chứng minh mình là ai. mTLS làm điều đó ở tầng kết nối.

### Cơ chế
TLS thông thường chỉ máy chủ gửi chứng chỉ để trình duyệt xác thực. mTLS bắt cả client gửi chứng chỉ trong handshake:
1. Client chào server, trao đổi khả năng TLS.
2. Server gửi chứng chỉ; client kiểm tra chuỗi tin cậy và tên miền.
3. Server yêu cầu chứng chỉ client.
4. Client gửi chứng chỉ; server kiểm tra chuỗi, thời hạn, thu hồi và ánh xạ danh tính (ví dụ service name).
5. Hai bên thỏa thuận khóa phiên và mã hóa dữ liệu.

~~~text
Client                              Server
  |--- ClientHello ----------------->|
  |<-- ServerHello + cert -----------|
  |    (client verify server cert)   |
  |<-- CertificateRequest -----------|
  |--- Client cert ----------------->|
  |                         (verify) |
  |<== kênh mã hóa hai chiều =======>|
~~~

Trong Kubernetes, service mesh như Istio hoặc Linkerd tự phát chứng chỉ ngắn hạn cho từng pod và xoay vòng. Bạn cũng có thể dùng mTLS cho API đối tác, nhưng phải quản lý vòng đời chứng chỉ cẩn thận.

### Khi nào dùng
Giao tiếp service-to-service trong mô hình zero trust, API B2B yêu cầu xác thực mạnh, bảo vệ endpoint nội bộ khỏi truy cập trái phép. Không dùng khi chỉ cần người dùng đăng nhập qua trình duyệt, vì việc phát chứng chỉ cho từng người rất phức tạp.

### Hay nhầm với
mTLS không thay thế OAuth2 hay phân quyền. Nó trả lời "ai đang kết nối", không trả lời "người đó được làm gì". TLS thường chỉ xác thực server. mTLS cũng khác SSH key: mTLS gắn với kết nối TLS và chứng chỉ có thể thu hồi, hết hạn theo chuẩn X.509.`,
    refs: [
      { type: 'doc', title: 'Cloudflare: What is mTLS?', url: 'https://www.cloudflare.com/learning/access-management/what-is-mutual-tls/' },
      { type: 'doc', title: 'RFC 8446: TLS 1.3', url: 'https://www.rfc-editor.org/rfc/rfc8446' },
    ],
    related: ['oauth2', 'secret-rotation', 'kubernetes-pod'],
  },
  {
    id: 'secret-rotation',
    term: 'Secret rotation',
    aliases: ['secret rotation', 'rotate secret', 'rotating secrets', 'secret rotation policy', 'xoay vòng secret', 'luân chuyển secret'],
    short: 'Định kỳ thay mật khẩu, khóa hay chứng chỉ và thu hồi bản cũ mà không làm sập hệ thống.',
    body: `### Ví dụ đời thường
Bạn đổi ổ khóa nhà theo lịch. Bạn phát chìa mới cho người nhà trước, đợi mọi người dùng được chìa mới, rồi mới thu chìa cũ. Nếu thu chìa cũ trước khi phát chìa mới, cả nhà đứng ngoài đường. Xoay vòng secret cũng cần thứ tự như vậy.

### Cơ chế
Secret gồm mật khẩu database, API key, chứng chỉ TLS, khóa ký JWT. Quy trình xoay vòng an toàn:
1. Tạo secret mới bên cạnh secret cũ, lưu trong secret manager có phiên bản.
2. Cấu hình hệ thống chấp nhận cả hai trong giai đoạn chuyển tiếp.
3. Đưa secret mới cho các instance, kiểm tra chúng dùng được.
4. Khi tất cả đã dùng secret mới, thu hồi secret cũ.
5. Ghi audit, đặt lịch lần xoay tiếp theo.

Tự động hóa bằng AWS Secrets Manager rotation, Vault, hoặc một job định kỳ. Với JWT signing key, cần hỗ trợ nhiều key (kid trong header) để token cũ vẫn xác thực được đến khi hết hạn.

~~~text
t0: secret v1 đang dùng
t1: tạo v2, hệ thống chấp nhận v1 + v2
t2: deploy, mọi instance dùng v2
t3: thu hồi v1
t4: lên lịch xoay v3
~~~

Lỗi thường gặp: hard-code secret trong mã hoặc file cấu hình, xoay bằng cách sửa tay từng server, không có giai đoạn chấp nhận hai secret, hoặc xoay xong không kiểm tra. Secret bị lộ phải được thu hồi ngay, không chờ lịch.

### Khi nào dùng
Mọi secret production, đặc biệt mật khẩu database, khóa ký, chứng chỉ, API key của bên thứ ba. PCI DSS yêu cầu xoay vòng khóa và mật khẩu theo định kỳ. Cũng cần quy trình xoay khi nhân viên rời đi hoặc nghi ngờ lộ.

### Hay nhầm với
Xoay vòng secret không phải key rotation của mã hóa dữ liệu. Key rotation có thể cần giải mã rồi mã hóa lại dữ liệu (rewrap), còn secret rotation thường chỉ đổi thông tin xác thực. Cũng khác revoke token: thu hồi token là vô hiệu phiên cụ thể, xoay secret là đổi chìa khóa dùng chung.`,
    refs: [
      { type: 'doc', title: 'AWS Secrets Manager: Rotate secrets', url: 'https://docs.aws.amazon.com/secretsmanager/latest/userguide/rotating-secrets.html' },
      { type: 'doc', title: 'OWASP: Secrets Management Cheat Sheet', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html' },
    ],
    related: ['mtls', 'infrastructure-as-code', 'jwt'],
  },
  {
    id: 'idor',
    term: 'IDOR',
    aliases: ['idor', 'insecure direct object reference', 'insecure direct object references'],
    short: 'Lỗi cho phép đổi id trên URL để đọc dữ liệu của người khác vì máy chủ không kiểm tra quyền sở hữu.',
    body: `### Ví dụ đời thường
Một tòa nhà có bảo vệ ở cổng. Bạn nói "tôi vào căn hộ 302" và bảo vệ mở cửa vì số căn hộ hợp lệ, dù bạn không sống ở đó. Vấn đề không phải số căn hộ dễ đoán, mà là bảo vệ không kiểm tra bạn có quyền vào căn đó.

### Cơ chế
Ứng dụng nhận id từ client, ví dụ GET /api/orders/123, rồi trả dữ liệu nếu người dùng đã đăng nhập. Lỗi xảy ra khi server chỉ kiểm tra authentication mà không kiểm tra authorization:
1. Người dùng A đăng nhập, có token hợp lệ.
2. A đổi 123 thành 124 trên URL hoặc trong body.
3. Server tìm đơn 124 và trả về, dù đơn đó thuộc về B.

~~~text
GET /orders/123  (token của A) --> 200, đơn của A
GET /orders/124  (token của A) --> 200, đơn của B  <-- IDOR

Fix:
SELECT ... FROM orders
WHERE id = ? AND owner_id = <current_user_id>
~~~

Cách chữa không phải là dùng UUID khó đoán. UUID chỉ làm việc đoán khó hơn, không sửa được lỗi phân quyền. Cách đúng là kiểm tra quyền sở hữu ở mọi truy vấn, ở tầng dữ liệu nếu có thể. Với API phức tạp, dùng kiểm tra tập trung như policy engine, và viết test tự động cho từng endpoint.

### Khi nào dùng
Mọi API có id tài nguyên: đơn hàng, hồ sơ, hóa đơn, file, tin nhắn. Đặc biệt nguy hiểm với API mobile vì id thường lộ trong app. Kiểm tra cả trường hợp đổi id trong body, query parameter và header.

### Hay nhầm với
IDOR không phải lỗi authentication: người dùng đã đăng nhập hợp lệ. Đây là lỗi authorization, thuộc nhóm broken access control. Cũng khác mass assignment: IDOR đổi id để xem dữ liệu người khác, mass assignment gửi thêm trường để sửa dữ liệu không được phép. UUID không phải cách chữa IDOR.`,
    refs: [
      { type: 'doc', title: 'OWASP Top 10: Broken Access Control', url: 'https://owasp.org/Top10/A01_2021-Broken_Access_Control/' },
      { type: 'doc', title: 'OWASP: Authorization Cheat Sheet', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html' },
    ],
    related: ['ssrf', 'jwt', 'oauth2'],
  },
  {
    id: 'ssrf',
    term: 'SSRF',
    aliases: ['ssrf', 'server-side request forgery', 'server side request forgery'],
    short: 'Lỗi lừa máy chủ tự gửi request đến địa chỉ nội bộ mà kẻ tấn công không với tới.',
    body: `### Ví dụ đời thường
Kẻ lạ mặt không vào được phòng kỹ thuật, nhưng nhờ lễ tân gọi điện đến phòng đó rồi nghe lén nội dung. Lễ tân có quyền gọi nội bộ, nên yêu cầu tưởng như vô hại lại mở đường vào nơi cấm. SSRF lợi dụng máy chủ làm "lễ tân" như vậy.

### Cơ chế
Ứng dụng nhận một URL từ người dùng rồi tự gửi request tới URL đó: tải ảnh từ xa, kiểm tra webhook, xem trước liên kết. Kẻ tấn công gửi địa chỉ nội bộ:
- http://169.254.169.254/... để đọc metadata của cloud, có thể lấy credential.
- http://localhost:8080/admin để gọi API nội bộ.
- http://10.0.0.5/... trong dải mạng riêng.
- Dùng DNS rebinding: tên miền lúc kiểm tra trỏ ra ngoài, lúc request trỏ vào trong.

~~~text
Attacker --> App: "hãy tải http://169.254.169.254/latest/meta-data/"
App --> Metadata service: GET ...
Metadata --> App: credential
App --> Attacker: nội dung (qua lỗi hoặc file đã tải)
~~~

Cách chữa: allowlist tên miền và giao thức, chặn IP riêng sau khi phân giải DNS (không chỉ kiểm tra chuỗi), không tự động theo redirect, dùng proxy ra ngoài có kiểm soát, giới hạn thời gian và kích thước, chạy trong mạng riêng không có quyền vào metadata.

### Khi nào dùng
Bất kỳ tính năng nào nhận URL từ người dùng: nhập ảnh từ link, webhook tester, preview, tích hợp RSS, import file. Cũng cần kiểm tra khi server gọi callback URL do đối tác cung cấp.

### Hay nhầm với
SSRF không phải XSS: XSS chạy mã trong trình duyệt nạn nhân, SSRF lợi dụng máy chủ. Cũng khác CSRF: CSRF lợi dụng phiên của người dùng để gửi request, SSRF lợi dụng quyền mạng của server. Chặn localhost bằng regex URL là chưa đủ vì DNS rebinding và IPv6.`,
    refs: [
      { type: 'doc', title: 'OWASP: Server Side Request Forgery', url: 'https://owasp.org/www-community/attacks/Server_Side_Request_Forgery' },
      { type: 'doc', title: 'OWASP: SSRF Prevention Cheat Sheet', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html' },
    ],
    related: ['idor', 'secret-rotation'],
  },
  {
    id: 'pci-dss',
    term: 'PCI DSS',
    aliases: ['pci dss', 'pci-dss', 'payment card industry data security standard'],
    short: 'Bộ tiêu chuẩn bắt buộc khi lưu, xử lý hoặc truyền dữ liệu thẻ thanh toán.',
    body: `### Ví dụ đời thường
Một nhà hàng muốn nhận thanh toán thẻ phải tuân quy định vệ sinh an toàn thực phẩm, không chỉ nấu ngon. Có người kiểm tra định kỳ, có sổ sách, có quy trình khi có sự cố. PCI DSS là bộ quy định như vậy cho dữ liệu thẻ.

### Cơ chế
PCI DSS do Hội đồng Tiêu chuẩn Bảo mật Ngành Thẻ Thanh toán đưa ra, gồm các nhóm yêu cầu về:
- Bảo vệ mạng và hệ thống, cấu hình an toàn, mã hóa dữ liệu thẻ khi lưu và khi truyền.
- Kiểm soát truy cập, xác thực mạnh, phân quyền tối thiểu.
- Theo dõi, ghi log, kiểm tra định kỳ, quản lý lỗ hổng.
- Chính sách bảo mật và đào tạo nhân viên.

Cách giảm phạm vi quan trọng hơn cách cố gắng bảo vệ mọi thứ: không lưu số thẻ đầy đủ, dùng tokenization của nhà cung cấp thanh toán, để họ xử lý thẻ và chỉ nhận token. Khi đó hệ thống của bạn không còn chạm dữ liệu thẻ, phạm vi audit nhỏ hơn rất nhiều.

~~~text
Không tốt: Browser -> App -> lưu số thẻ trong DB
Tốt hơn:  Browser -> Payment provider (hosted fields)
           App chỉ nhận token, không thấy số thẻ
~~~

Chứng nhận không phải làm một lần rồi xong: cần đánh giá định kỳ, quét lỗ hổng, vá lỗi, và xử lý sự cố. Log truy cập dữ liệu thẻ phải được bảo vệ và lưu đủ lâu theo yêu cầu.

### Khi nào dùng
Bất kỳ hệ thống nào lưu, xử lý hoặc truyền số thẻ, CVV, dải từ tính. Nếu dùng nhà cung cấp thanh toán đã được chứng nhận và không lưu dữ liệu thẻ, nghĩa vụ của bạn nhẹ hơn nhưng không biến mất hoàn toàn.

### Hay nhầm với
PCI DSS không phải GDPR: GDPR bảo vệ dữ liệu cá nhân nói chung, PCI DSS tập trung vào dữ liệu thẻ. Cũng khác ISO 27001: ISO là hệ thống quản lý an ninh thông tin tổng quát, PCI DSS là tiêu chuẩn cụ thể cho ngành thẻ. Tuân thủ PCI không có nghĩa là hệ thống không thể bị tấn công.`,
    refs: [
      { type: 'doc', title: 'PCI Security Standards Council: PCI DSS', url: 'https://www.pcisecuritystandards.org/standards/pci-dss/' },
    ],
    related: ['secret-rotation', 'idor'],
  }
);
