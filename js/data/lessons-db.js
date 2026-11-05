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
}
);
