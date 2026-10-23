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

### Pitfall production
Transaction dài giữ snapshot cũ, làm VACUUM khó thu hồi tuple chết và tăng bloat. Retry toàn transaction phải idempotent, không gửi email/charge thẻ trước khi commit. Đừng dùng một bài test chạy tuần tự để kết luận về concurrency: cố định lịch xen kẽ để tái hiện race.

### Liên hệ phỏng vấn
Hãy vẽ lịch T1/T2, ghi trạng thái commit và giá trị mỗi lần đọc. Nêu rõ PostgreSQL READ COMMITTED tạo snapshot theo statement, còn REPEATABLE READ theo transaction; giải thích anomaly nghiệp vụ và biện pháp cụ thể.

> Senior tip: đo thời gian transaction và tỷ lệ serialization failure; retry có backoff giới hạn, và chỉ retry phần nghiệp vụ thực sự an toàn.
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
    {q:'Ở READ COMMITTED, snapshot được lấy khi nào?',options:['Mỗi statement','Chỉ lúc BEGIN','Chỉ lúc COMMIT','Mỗi lần gọi Java getter'],answer:0,explain:'Mỗi câu lệnh SQL có snapshot mới; vì vậy SELECT lặp lại có thể thấy commit mới.'}
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

### Retry phải tính lại
Retry đúng nghĩa là bắt đầu transaction mới, đọc trạng thái mới, tính lại thay đổi dựa trên input nghiệp vụ rồi thử lại. Không nên chỉ gửi lại cùng SQL với giá trị tuyệt đối cũ; như vậy có thể lặp lại stale write. Giới hạn số lần retry, thêm jitter khi contention cao và trả conflict cho client nếu không thể hòa giải.

### PostgreSQL MVCC
MVCC giúp reader không chặn writer trong nhiều trường hợp, nhưng không tự ngăn lost update trong ứng dụng kiểu read-compute-write ở READ COMMITTED. Version predicate biến tính toàn vẹn thành điều kiện ghi nguyên tử. Một lệnh UPDATE nguyên tử trên cột cũng có thể phù hợp hơn cho phép cộng đơn giản. Với invariant nhiều hàng, version một hàng không đủ; cân nhắc constraint, khóa hoặc SERIALIZABLE.

| Cách | Phù hợp | Trade-off |
|---|---|---|
| Version check | xung đột ít, cập nhật từ object đã đọc | retry/conflict ở ứng dụng |
| Atomic SQL update | phép biến đổi đơn giản tại DB | logic phải biểu diễn được trong SQL |
| Pessimistic row lock | contention cao, cần tuần tự hóa | chờ khóa, deadlock, throughput thấp |

### Pitfall production
Đừng thực hiện side effect ngoài DB (gửi email, gọi API thanh toán) trước khi commit, vì mỗi lần retry sẽ lặp lại nó; ghi event vào outbox trong cùng transaction và để relay gửi sau commit. Retry không giới hạn gây khuếch đại tải khi hệ thống đã nóng. Cần phân biệt conflict nghiệp vụ (cần người dùng chọn) với lỗi transient có thể tự retry.

### Liên hệ phỏng vấn
Nêu SQL có predicate version, giải thích row count bằng 0, rồi mô tả vòng retry bắt đầu transaction mới và tính lại. Hibernate {{@Version}} tiện lợi nhưng không thay thế xử lý exception ở boundary.

> Senior tip: theo dõi tỷ lệ optimistic conflict theo loại entity; nếu thường xuyên cao, cân nhắc atomic update hoặc khóa thay vì retry vô ích.
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
  check:[{q:'UPDATE có version predicate trả row count 0 thường biểu thị gì?',options:['Update đã commit hai lần','Dữ liệu đã đổi hoặc hàng không tồn tại','Database mất MVCC','Connection pool đầy'],answer:1,explain:'Điều kiện version không khớp hoặc id không tồn tại; ứng dụng cần phân biệt theo nghiệp vụ nếu cần.'},{q:'Retry optimistic conflict nên làm gì?',options:['Gửi lại nguyên giá trị tính từ snapshot cũ','Đọc lại và tính lại trong transaction mới','Bỏ kiểm tra version','Retry vô hạn'],answer:1,explain:'Dữ liệu nền đã đổi; transaction mới cần đọc trạng thái mới và tính lại.'}], tags:['optimistic-locking','version','PostgreSQL']
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

### Pitfall production
Index trên cột có cardinality thấp không tự động vô ích hay hữu ích; điều quan trọng là số hàng phù hợp và pattern truy vấn. Dùng {{EXPLAIN (ANALYZE, BUFFERS)}} trên workload đại diện, nhớ ANALYZE để cập nhật thống kê. Một query trả vài phần trăm bảng có thể đổi plan khi dữ liệu phân bố lệch.

### Liên hệ phỏng vấn
Giải thích cấu trúc làm giảm candidate rows, sau đó nêu write amplification và quyết định planner dựa trên cost. Không hứa “index luôn nhanh hơn”; chỉ số benchmark cần cùng dữ liệu, cache và query thực tế.

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
  check:[{q:'Vì sao PostgreSQL đôi khi chọn sequential scan dù có index?',options:['Index bị bỏ qua ngẫu nhiên','Đọc tỷ lệ lớn bảng có thể rẻ hơn nhiều heap fetch rời rạc','B-tree chỉ hỗ trợ chuỗi','MVCC cấm index scan'],answer:1,explain:'Planner chọn plan ước lượng có tổng cost thấp hơn; I/O và số hàng trả về quan trọng.'},{q:'Index thường làm chi phí nào tăng?',options:['INSERT/UPDATE và dung lượng','Chỉ SELECT','VACUUM bị cấm','Transaction isolation tự giảm'],answer:0,explain:'Mỗi thay đổi liên quan phải duy trì index, ghi WAL và dùng storage.'}], tags:['B-tree','index','EXPLAIN','PostgreSQL']
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

### Pitfall production
Quên close connection gây leak; giữ connection qua remote call làm cạn pool dù database rảnh. Pool timeout không đồng nghĩa query timeout. Đặt timeout riêng cho acquire, statement và transaction; bật leak detection ở mức chẩn đoán. Với HikariCP: {{maximumPoolSize}} mặc định 10; {{connectionTimeout}} (thời gian tối đa chờ lấy connection) mặc định 30000 ms, quá hạn thì {{getConnection()}} ném {{SQLTransientConnectionException}}; {{leakDetectionThreshold}} mặc định 0 (tắt). Timeout câu lệnh đặt ở DB/driver, ví dụ {{statement_timeout}} của PostgreSQL. Trong Spring, transaction boundary rộng có thể giữ connection xuyên qua xử lý không cần thiết.

### Liên hệ phỏng vấn
Tính tổng connection tối đa qua số replica, giải thích vì sao pool là backpressure, rồi đề xuất đo active/idle/pending/acquire time và DB wait events trước khi tuning.

> Senior tip: đặt pool size theo sức chịu tải DB và workload benchmark; một pool nhỏ ổn định thường tốt hơn nhiều backend tranh CPU và I/O.
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
  check:[{q:'Pool active chạm max và pending tăng, nên xem gì trước?',options:['Tăng max lên rất lớn ngay','Acquire time, query/lock latency và thời gian giữ transaction','Xóa index','Tắt timeout'],answer:1,explain:'Cần tìm nguồn chiếm connection và kiểm tra tải DB; tăng pool có thể làm tổng concurrency vượt sức DB.'},{q:'Remote HTTP call nằm trong transaction DB có thể gây gì?',options:['Giảm thời gian giữ connection','Giữ connection trong lúc chờ mạng, làm cạn pool','Tự động retry SQL','Tắt MVCC'],answer:1,explain:'Connection thường được giữ đến khi transaction kết thúc; latency ngoài DB kéo dài thời gian chiếm slot.'}],tags:['connection-pool','PostgreSQL','HikariCP']
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

### Liên hệ phỏng vấn
Nêu rõ workload: admin cần nhảy trang có thể dùng offset ở tập vừa; feed/infinite scroll thường hợp keyset. Đảm bảo thứ tự total order, cursor tie-breaker, composite index và semantics khi dữ liệu đổi.

> Senior tip: đo trang sâu, không chỉ trang đầu; OFFSET thường biểu hiện chi phí ở tail latency khi offset tăng.
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
  check:[{q:'Tại sao keyset thường cần tie-breaker như id?',options:['Để ép PostgreSQL dùng hash join','Để thứ tự là total order khi sort key bị trùng','Để bỏ MVCC','Để offset nhanh hơn'],answer:1,explain:'Nếu nhiều hàng cùng timestamp, cursor chỉ timestamp không định vị duy nhất ranh giới trang.'},{q:'Keyset pagination có đảm bảo snapshot nhất quán xuyên nhiều request không?',options:['Có, luôn luôn','Không; cursor không thay thế snapshot transaction','Chỉ khi không có index','Có nếu LIMIT là số chẵn'],answer:1,explain:'Keyset xác định vị trí tiếp theo; dữ liệu vẫn có thể thay đổi giữa các HTTP request.'}],tags:['pagination','keyset','PostgreSQL','B-tree']
}
);
