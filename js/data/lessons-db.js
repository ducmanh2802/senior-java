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
-- Ai dang giu "xmin horizon" (ngan cach thu nhat khi bang phinh bat thuong)?
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
        closeOpen(xid);                       // khong xoa ban cu, chi dong dau cua no lai
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
title: Duong di cua mot UPDATE, tu luc chay den khi duoc coi la ben
actors: App | Backend | WAL | File du lieu
App -> Backend: UPDATE account SET balance = 12 WHERE id = 42
Backend -> Backend: sua tuple trong shared buffers, page tro nen dirty
Backend -> WAL: ghi record thay doi, nhan LSN 100
App -> Backend: COMMIT
Backend -> WAL: ghi record COMMIT roi fsync ca log
WAL --> App: OK, giao dich cua ban da ben
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

### Lỗi hay gặp
- Áp dụng mọi record khi recover: sai, transaction chưa COMMIT phải bỏ qua.
- Ghi trang dữ liệu rồi mới ghi log: vi phạm write-ahead.
- Nghĩ checkpoint cho phép xóa hết log: phải giữ WAL đủ cho recovery/replica.
- Bỏ qua thứ tự LSN: redo phải theo thứ tự log.

### Liên hệ phỏng vấn
Nhấn mạnh: (1) commit trả lời client chỉ sau COMMIT record fsync; (2) crash recovery redo transaction có COMMIT từ checkpoint; (3) đánh đổi {{synchronous_commit}}/checkpoint/IO. "Mất điện có mất đơn đã báo thành công không?" -> không, nếu COMMIT đã durable.

> Senior tip: theo dõi {{pg_wal}} phình bất thường (thường do replication slot giữ hoặc archiving kẹt), thời gian checkpoint và {{pg_stat_bgwriter}}.`,
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
    }
  ],
  related: ['db-006', 'db-035'],
  tags: ['WAL', 'crash-recovery', 'redo', 'checkpoint', 'durability']
}
);
