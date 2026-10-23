/* JPA lessons use small Java-only models so the exercises run without a database. */
(window.LESSONS = window.LESSONS || []).push(
{
 id:'lesson-jpa-001',track:'jpa',order:1,title:'Persistence context và dirty checking',level:'mid',minutes:25,
 goals:['Hiểu identity map và snapshot','Phát hiện field thay đổi khi flush'],
 body:`### Persistence context là vùng làm việc
Persistence context gắn entity Java với một hàng dữ liệu trong một khoảng thời gian. Khi {{find}} tìm một id đã được nạp, first-level cache trả lại cùng object managed thay vì tạo bản sao hoặc hỏi database lần nữa. Identity map thường nhận diện entity bằng loại và khóa chính. Nhờ vậy một transaction không vô tình giữ hai phiên bản khác nhau của cùng một hàng.

Khi entity được nạp, Hibernate giữ snapshot của trạng thái ban đầu. Setter chỉ đổi object trong bộ nhớ. Đến flush, provider so sánh state hiện tại với snapshot; nếu khác thì tạo UPDATE. Flush có thể xảy ra trước commit và không có nghĩa transaction đã commit: transaction vẫn có thể rollback.

~~~java
Account a = em.find(Account.class, 7L); // managed và có snapshot
a.setName("Mai");                      // chỉ đổi state trong bộ nhớ
em.flush();                            // phát hiện thay đổi, gửi SQL
~~~

### Dirty checking và SQL
Hibernate 6 thường so sánh snapshot khi flush. Bytecode enhancement có thể hỗ trợ theo dõi field thay đổi, nhưng không nên giả định mọi project bật nó. UPDATE mặc định có thể chứa nhiều cột mapped; {{@DynamicUpdate}} có thể thu hẹp cột theo thay đổi nhưng tạo nhiều dạng SQL hơn, ảnh hưởng cache statement. Chỉ nên chọn sau khi đo.

| Trạng thái | Kết quả |
|---|---|
| Managed trong context | đổi field được phát hiện lúc flush |
| Detached | setter không tự ghi database |
| New/transient | cần persist hoặc cascade phù hợp |

Bài tập mô phỏng identity map và snapshot: mỗi id có một object, snapshot là bản sao giá trị chứ không phải cùng object mutable. Flush trả về các field đổi theo thứ tự ổn định rồi cập nhật snapshot để lần sau không phát lại UPDATE. Entity chưa load không được tự nhiên bị ghi.

### Merge không phải attach object đầu vào
Với Spring Data JPA, save một entity detached thường dẫn tới merge. Merge chép trạng thái sang instance managed và trả instance đó; object đầu vào không vì thế biến thành managed. Hãy dùng giá trị trả về khi cần tiếp tục thao tác trong context. Không giữ entity trong cache ứng dụng qua nhiều transaction.

### Lỗi production
Transaction dài có thể giữ hàng nghìn entity managed, khiến snapshot tiêu thụ heap và flush tốn thời gian. Với import lớn, persist theo chunk, flush rồi clear; flush trước clear để không mất thay đổi chưa gửi. Sau clear, reference cũ detached. Thay đổi field của entity detached không được dirty checking phát hiện. Bulk JPQL cũng có thể khiến persistence context giữ state cũ.


### Ranh giới flush và commit
Flush đồng bộ thay đổi managed với database bên trong transaction hiện tại; commit là quyết định kết thúc transaction. Vì vậy SQL đã chạy ở flush vẫn có thể bị rollback. Hibernate thường flush trước commit, và có thể flush trước một số query theo flush mode để kết quả query phản ánh thay đổi đang chờ. Đừng dùng flush như tín hiệu rằng dữ liệu đã bền vững hoặc đã nhìn thấy từ transaction khác.

Trong batch xử lý, flush rồi clear theo chunk giúp giới hạn số entity và snapshot đang được theo dõi. Clear không hoàn tác SQL đã flush nhưng detach object; mọi thay đổi sau đó trên reference cũ không được persistence context theo dõi. Hãy kiểm tra cả số entity managed và thời gian flush khi chọn kích thước chunk.
### Liên hệ phỏng vấn
Giải thích identity map, snapshot, flush khác commit thế nào và vì sao detached object không tự ghi. Nêu cách đo SQL thực tế trước khi chọn dynamic update hoặc bytecode enhancement.`,
 exercises:[{title:'Identity map và dirty fields',prompt:`Cài {{UnitOfWork}}: load cùng id trả cùng object; flush trả map id→field đổi theo thứ tự name,email và cập nhật snapshot.`,
 starter:`class Account {long id;String name,email;Account(long i,String n,String e){id=i;name=n;email=e;}}
class UnitOfWork {Account load(long i,String n,String e){throw new UnsupportedOperationException("TODO");} Map<Long,List<String>> flush(){throw new UnsupportedOperationException("TODO");}}`,
 tests:`public class Main {static void c(String n,boolean b){if(!b)throw new AssertionError(n);System.out.println("PASS "+n);} public static void main(String[]x){UnitOfWork u=new UnitOfWork();Account a=u.load(1,"A","a");c("identity",a==u.load(1,"X","x"));c("clean",u.flush().isEmpty());a.name="B";c("name",u.flush().get(1L).equals(List.of("name")));c("snapshot",u.flush().isEmpty());a.email="b";a.name="C";c("both",u.flush().get(1L).equals(List.of("name","email")));System.out.println("RESULT 5/5");}}`,
 reference:`class Account {long id;String name,email;Account(long i,String n,String e){id=i;name=n;email=e;}}
class UnitOfWork {Map<Long,Account> m=new LinkedHashMap<>();Map<Long,List<String>> s=new HashMap<>();Account load(long i,String n,String e){if(m.containsKey(i))return m.get(i);Account a=new Account(i,n,e);m.put(i,a);s.put(i,List.of(n,e));return a;}Map<Long,List<String>> flush(){Map<Long,List<String>> r=new LinkedHashMap<>();for(Account a:m.values()){List<String> old=s.get(a.id),d=new ArrayList<>();if(!Objects.equals(old.get(0),a.name))d.add("name");if(!Objects.equals(old.get(1),a.email))d.add("email");if(!d.isEmpty()){r.put(a.id,d);s.put(a.id,List.of(a.name,a.email));}}return r;}}`,
 hints:['Map id→object tạo identity map.','Snapshot phải độc lập với object và được thay sau flush.'],explain:`Flush so trạng thái mới với bản sao. Nếu giữ cùng object trong snapshot, setter sẽ làm thay đổi cả hai và không phát hiện được.`,
 }],check:[{q:'Dirty checking thường chạy khi nào?',options:['Trong setter','Lúc flush','Lúc JVM dừng','Trong getter'],answer:1,explain:`Flush so managed state với snapshot; commit thường flush nhưng không đồng nghĩa commit.`},{q:'Detached entity có tự được dirty checking không?',options:['Có, setter tự gửi SQL','Không, cần merge hoặc persist phù hợp','Chỉ khi gọi getter','Chỉ khi bật EAGER'],answer:1,explain:'Dirty checking chỉ theo dõi entity managed; merge chép state vào instance managed.'}],tags:['PersistenceContext','dirty checking']
},
{
 id:'lesson-jpa-002',track:'jpa',order:2,title:'N+1 query và tải association theo batch',level:'senior',minutes:25,
 goals:['Nhận diện 1+N round-trip','Tải parent và child bằng hai query'],
 body:`### N+1 là số lần đi database tăng theo parent
Một query lấy N đơn hàng là query đầu. Nếu đọc lines của từng order và mỗi lần phát SELECT, tổng thành 1+N. Với 80 order, 81 lượt đi database làm latency mạng lặp lại dù dữ liệu nhỏ. Đây là N+1, thường bị bỏ sót trong test chỉ có một parent.

{{LAZY}} trì hoãn tải đến lúc truy cập; nó không tự gom các lần truy cập thành một query. {{EAGER}} cũng không cam kết JOIN duy nhất. Provider có thể phát query phụ; join nhiều collection có thể nhân bản dòng hoặc tạo Cartesian product.

### Chọn fetch plan theo use case
Fetch join phù hợp với association to-one hoặc collection nhỏ khi không cần phân trang phức tạp. EntityGraph mô tả association cần tải. Batch fetching gom khóa lazy cần tải thành các nhóm. DTO projection chọn trực tiếp cột màn hình cần, tránh materialize entity thừa. Có thể lấy orders trước, rồi lấy toàn bộ lines bằng một query IN theo order ids và nhóm trong memory.

~~~text
orders = queryOrders()                 // query 1
lines = queryLinesByOrderIds(ids)      // query 2
group lines by orderId                 // không query trong vòng lặp
~~~

| Phương án | Lợi ích | Cạm bẫy |
|---|---|---|
| Fetch join | ít lượt query | collection + pagination nhân dòng |
| Batch ids | số query giới hạn | cần nhóm kết quả, giới hạn bind params |
| DTO projection | tải đúng dữ liệu | query gắn với use case |

Hibernate 6 hỗ trợ fetch join, batch size và entity graph; hãy kiểm tra SQL phát ra. Fetch join collection cùng pagination có thể làm phân trang trong memory hoặc cảnh báo/lỗi theo cấu hình. Cấu hình fail_on_pagination_over_collection_fetch giúp lộ lỗi sớm. Không đổi mọi association thành EAGER để chữa N+1.

### Production
Đo query count trên nhiều parent và theo dõi slow query/APM. Batch quá lớn có thể vượt giới hạn bind parameters. Page size có giới hạn và fetch plan rõ ràng thường tốt hơn tải toàn bộ graph. Query count không phải mục tiêu duy nhất: xem cả số dòng, payload, thời gian database và heap.


### Đo đúng fetch plan
Một test chỉ có một order không thể phơi bày N+1; tạo fixture có nhiều parent và xác nhận số query không tăng tuyến tính theo số parent. Với batch fetching, Hibernate có thể gom các khóa chưa tải thành một IN query theo batch size, nhưng số query còn phụ thuộc số khóa, kích thước batch, dialect và giới hạn bind parameter. Đây là tối ưu theo nhóm, không phải cam kết luôn đúng hai query.

Phân trang collection cần đặc biệt cẩn thận: JOIN trả một dòng cho mỗi tổ hợp parent-child, nên LIMIT ở SQL có thể cắt giữa collection. Cách an toàn thường là phân trang parent trước, sau đó tải association cho tập id của trang. Kiểm tra số dòng trả về cùng query count để tránh đổi nhiều query nhỏ thành một kết quả khổng lồ.
### Liên hệ phỏng vấn
Nêu 1+N, chọn chiến lược theo cardinality và pagination. Chứng minh bằng SQL/query counter thay vì chỉ đổi LAZY thành EAGER.`,
 exercises:[{title:'Giảm N+1 xuống hai query',prompt:`Repository đếm query. Load mọi order và lines theo tập order id chỉ bằng hai query, giữ order rỗng.`,
 starter:`record Order(long id){} record Line(long orderId,String sku){}
class Repo{int a,b;List<Order> orders(){a++;return List.of(new Order(1),new Order(2),new Order(3));}List<Line> lines(Set<Long> ids){b++;return List.of(new Line(1,"A"),new Line(1,"B"),new Line(3,"C"));}}
class Service{Repo r;Service(Repo x){r=x;}Map<Long,List<String>> load(){throw new UnsupportedOperationException("TODO");}}`,
 tests:`public class Main{static void c(String n,boolean b){if(!b)throw new AssertionError(n);System.out.println("PASS "+n);}public static void main(String[]x){Repo r=new Repo();Map<Long,List<String>> m=new Service(r).load();c("two queries",r.a==1&&r.b==1);c("multiple children",m.get(1L).equals(List.of("A","B")));c("empty parent",m.get(2L).isEmpty());c("last child",m.get(3L).equals(List.of("C")));c("all parents",m.size()==3);System.out.println("RESULT 5/5");}}`,
 reference:`record Order(long id){} record Line(long orderId,String sku){}
class Repo{int a,b;List<Order> orders(){a++;return List.of(new Order(1),new Order(2),new Order(3));}List<Line> lines(Set<Long> ids){b++;return List.of(new Line(1,"A"),new Line(1,"B"),new Line(3,"C"));}}
class Service{Repo r;Service(Repo x){r=x;}Map<Long,List<String>> load(){List<Order> os=r.orders();Set<Long> ids=new LinkedHashSet<>();Map<Long,List<String>> out=new LinkedHashMap<>();for(Order o:os){ids.add(o.id());out.put(o.id(),new ArrayList<>());}if(!ids.isEmpty())for(Line l:r.lines(ids))out.get(l.orderId()).add(l.sku());return out;}}`,
 hints:['Tạo entry cho parent trước khi ráp child.','Chỉ gọi repository lines một lần và bỏ qua nếu ids rỗng.'],explain:`Một query tải parent, query thứ hai tải tất cả child; nhóm theo khóa giữ parent không có child. Thực tế cần chia batch nếu IN list chạm giới hạn database.`,
 }],check:[{q:'LAZY có tự loại N+1 không?',options:['Có, luôn một JOIN','Không, truy cập từng proxy vẫn có thể N+1','Có, bằng cache cấp hai bắt buộc','Không thể dùng với collection'],answer:1,explain:`LAZY chỉ hoãn tải; cần fetch plan hoặc batch để giới hạn query.`},{q:'Collection fetch join và pagination có rủi ro gì?',options:['Luôn tạo đúng một dòng mỗi parent','SQL limit có thể cắt collection hoặc buộc phân trang memory','Tắt persistence context','Không thể dùng LAZY'],answer:1,explain:'Join nhân dòng theo child; thường phân trang parent trước rồi tải children theo ids.'}],tags:['N+1','batch fetching']
},
{
 id:'lesson-jpa-003',track:'jpa',order:3,title:'Optimistic locking với @Version',level:'senior',minutes:25,
 goals:['Hiểu điều kiện version trong UPDATE','Retry bằng transaction mới và trạng thái mới'],
 body:`### Lost update
A và B cùng đọc hàng ở version 4. Cả hai tính giá trị mới. Nếu UPDATE chỉ lọc theo id, lần ghi sau có thể âm thầm ghi đè kết quả trước. {{@Version}} khiến update có dạng khái niệm: {{UPDATE ... SET value=?, version=5 WHERE id=? AND version=4}}. A cập nhật được; B thấy zero rows updated và provider báo optimistic locking conflict.

Hibernate quản lý version field và tăng nó khi cập nhật entity. Ứng dụng không nên tự tăng version. Cơ chế này hợp khi xung đột hiếm, đặc biệt với nhiều lần đọc và ít ghi; nó tránh giữ database lock trong suốt thời gian tính toán.

### Retry có ý nghĩa nghiệp vụ
Retry không thể gửi lại update cũ với version cũ. Cần transaction mới, đọc dữ liệu mới và áp dụng lại ý định, như cộng thêm 10. Giới hạn số lần retry; có thể thêm backoff khi tải cao. Không retry mù side effect ngoài database như gửi tiền hoặc email. Idempotency key/outbox giúp xử lý side effect an toàn.

~~~text
A reads v4 → update where v4 succeeds → v5
B reads v4 → update where v4 affects 0 rows → conflict
B new transaction reads v5 → reapplies intent → update
~~~

| Chiến lược | Chọn khi | Cái giá |
|---|---|---|
| Optimistic | conflict hiếm | retry hoặc trả conflict |
| Pessimistic | tranh chấp cao, vùng ngắn | lock, timeout, deadlock |

### Spring và transaction boundary
Catch lỗi trong cùng transaction rồi tiếp tục thường không hợp lệ vì transaction có thể đã rollback-only. Đặt retry bên ngoài phương thức transactional để mỗi lần tạo transaction mới. Bulk JPQL/native SQL có thể bypass version tự động; phải tự quản version và làm mới persistence context. Tên exception cụ thể có thể được Spring dịch qua lớp exception abstraction.

### Lỗi production
Retry vô hạn làm tải tăng khi database đang tranh chấp. Đo tỷ lệ conflict và giới hạn attempts. Quyết định giữa retry và trả HTTP conflict dựa trên semantics: người dùng có thể cần xác nhận lại nếu dữ liệu mới làm thay đổi quyết định. Version chỉ bảo vệ hàng được cập nhật; invariant nhiều hàng có thể cần constraint/locking khác.


### Ranh giới transaction và conflict
Version check có ý nghĩa ở chính câu UPDATE nguyên tử tại database; kiểm tra version trong Java rồi ghi sau đó sẽ tạo race giữa hai thao tác. Nếu update ảnh hưởng zero row vì version đã đổi hoặc hàng đã bị xóa, Hibernate phát hiện optimistic conflict. Mã ứng dụng nên xử lý exception ở ranh giới transaction, vì transaction hiện tại thường đã bị đánh dấu rollback-only.

Retry an toàn chỉ khi có thể tái tạo thao tác trên state vừa đọc và không lặp side effect. Ví dụ tăng số lượng có thể được áp dụng lại lên giá trị mới; quyết định phê duyệt dựa trên hạn mức có thể cần trả conflict để người dùng xác nhận lại. Đặt giới hạn nhỏ, ghi metric conflict/retry và không coi @Version là bảo vệ cho invariant liên quan nhiều hàng.
### Liên hệ phỏng vấn
Mô tả điều kiện WHERE version, writer thắng và transaction mới khi retry. Nêu bulk update, side effect và giới hạn retry.`,
 exercises:[{title:'Version check và retry',prompt:`update chỉ thành công khi expected version khớp rồi tăng version. addWithRetry đọc version hiện tại và thử tối đa ba lần.`,
 starter:`class Counter{int value,version;boolean update(int v,int d){throw new UnsupportedOperationException("TODO");}void add(int d){throw new UnsupportedOperationException("TODO");}}`,
 tests:`public class Main{static void c(String n,boolean b){if(!b)throw new AssertionError(n);System.out.println("PASS "+n);}public static void main(String[]x){Counter a=new Counter();c("first",a.update(0,5));c("version bump",a.version==1&&a.value==5);c("stale fails",!a.update(0,9)&&a.value==5);a.add(2);c("retry current",a.value==7&&a.version==2);a.add(3);c("second intent",a.value==10);System.out.println("RESULT 5/5");}}`,
 reference:`class Counter{int value,version;boolean update(int v,int d){if(version!=v)return false;value+=d;version++;return true;}void add(int d){for(int i=0;i<3;i++){int seen=version;if(update(seen,d))return;}throw new IllegalStateException("conflict");}}`,
 hints:['Mismatch phải trả false mà không đổi state.','Mỗi lần thử lấy version mới; dừng sau ba lần.'],explain:`Điều kiện version mô phỏng compare-and-set trong UPDATE. Ứng dụng thật dựa vào database để update atomically và đặt mỗi retry trong transaction mới.`,
 }],check:[{q:'Retry optimistic conflict nên làm gì?',options:['Gửi lại UPDATE với version cũ','Đọc state mới trong transaction mới rồi áp dụng lại ý định','Tắt version','Retry vô hạn cùng transaction'],answer:1,explain:`Version cũ sẽ tiếp tục conflict; transaction mới phải tải state mới và retry có giới hạn.`},{q:'Bulk JPQL update tự áp dụng @Version như entity update không?',options:['Có, luôn tăng version','Không nhất thiết; cần quản version và đồng bộ context','Chỉ với PostgreSQL','Chỉ khi retry vô hạn'],answer:1,explain:'Bulk DML bỏ qua state managed; version/update context cần được xử lý rõ.'}],tags:['@Version','optimistic locking']
},
{
 id:'lesson-jpa-004',track:'jpa',order:4,title:'Fetch LAZY/EAGER và LazyInitializationException',level:'mid',minutes:25,
 goals:['Hiểu proxy tải khi truy cập','Trả DTO với dữ liệu cần thiết trước khi đóng session'],
 body:`### Proxy trì hoãn truy vấn
Association LAZY có thể được đại diện bởi proxy hoặc persistent collection wrapper. Lúc entity được nạp, association chưa cần đọc. Khi getter/iterator được gọi, wrapper yêu cầu persistence context chạy query rồi giữ kết quả. Nếu session/entity manager đã đóng và dữ liệu chưa tải, Hibernate không có kết nối/ngữ cảnh để thực hiện query nên ném {{LazyInitializationException}}.

EAGER yêu cầu association sẵn sàng khi entity được tải, nhưng không có nghĩa SQL nhất thiết dùng JOIN. Provider có thể chạy query phụ. Vì thế EAGER toàn cục dễ gây tải thừa và vẫn có thể gặp nhiều query.

### Ranh giới đúng
Service nên định nghĩa dữ liệu use case cần bằng fetch join, EntityGraph hoặc projection, rồi chuyển sang DTO trước khi trả về tầng web. Như vậy JSON serialization không vô tình gọi getter lazy. {{Hibernate.initialize}} chỉ hữu ích khi context còn mở và không thay thế fetch plan. Open Session in View giữ session đến render có thể che query phát sinh ở tầng trình bày.

~~~java
@Transactional(readOnly = true)
OrderDto detail(long id) {
  Order order = repo.findDetail(id); // lấy association cần thiết
  return mapper.toDto(order);       // proxy không lọt ra web
}
~~~

| Fetch | Ý nghĩa | Rủi ro |
|---|---|---|
| LAZY | tải khi truy cập | N+1 hoặc session đã đóng |
| EAGER | sẵn theo mapping | dữ liệu thừa, query phụ |
| DTO query | đúng dữ liệu màn hình | cần query riêng use case |

Serialization thường gọi getter, nên có thể tạo N+1 hoặc exception. Gọi toString trên entity cũng có thể truy cập association nếu tự viết như vậy. Với Hibernate 6, bytecode enhancement thay đổi một số chi tiết tải field nhưng không xóa quy tắc persistence context. Pagination cùng collection fetch join có thể nhân dòng và sai hiệu năng.

### Production
Tắt OSIV làm lỗi xuất hiện tại service boundary, nơi dễ sửa hơn. Đừng giữ transaction mở để template đọc entity. Test với transaction đóng rồi serialize DTO; đếm query trong trang danh sách. Chỉ khởi tạo đúng dữ liệu cần, giới hạn page size và xem SQL.


### Ranh giới tải và tầng trình bày
LazyInitializationException là dấu hiệu dữ liệu chưa được khởi tạo khi persistence context không còn khả năng tải. Mở session lâu hơn có thể làm lỗi biến mất nhưng chuyển truy vấn sang lúc render hoặc serialize, nơi khó kiểm soát N+1 và latency. Transactional service nên tải đúng graph cho use case và tạo DTO khi còn context.

Khi cần nhiều association, tránh fetch join đồng thời nhiều collection lớn vì phép nhân số dòng làm dữ liệu truyền về phình lên. Dùng projection hoặc chia thành query theo từng tập khóa; giữ logic ánh xạ trong service. Integration test nên đóng transaction trước khi kiểm tra DTO để chắc chắn response không phụ thuộc proxy sống.
### Liên hệ phỏng vấn
Phân biệt fetch timing với SQL shape. Giải thích vì sao lazy ngoài session lỗi và đề xuất DTO/query plan cho từng endpoint.`,
 exercises:[{title:'Lazy proxy và session',prompt:`LazyLines tải supplier một lần khi get trong session mở. Nếu chưa tải mà session đóng thì ném IllegalStateException; cache đã tải vẫn đọc được.`,
 starter:`class LazyLines{boolean open=true;java.util.function.Supplier<List<String>> source;LazyLines(java.util.function.Supplier<List<String>> s){source=s;}List<String> get(){throw new UnsupportedOperationException("TODO");}void close(){open=false;}}`,
 tests:`public class Main{static void c(String n,boolean b){if(!b)throw new AssertionError(n);System.out.println("PASS "+n);}public static void main(String[]x){int[] calls={0};LazyLines a=new LazyLines(()->{calls[0]++;return List.of("x");});c("lazy load",a.get().equals(List.of("x")));c("one load",a.get().size()==1&&calls[0]==1);a.close();c("cached after close",a.get().size()==1);LazyLines b=new LazyLines(()->List.of("y"));b.close();boolean err=false;try{b.get();}catch(IllegalStateException e){err=true;}c("closed proxy fails",err);System.out.println("RESULT 4/4");}}`,
 reference:`class LazyLines{boolean open=true;java.util.function.Supplier<List<String>> source;List<String> cache;LazyLines(java.util.function.Supplier<List<String>> s){source=s;}List<String> get(){if(cache!=null)return cache;if(!open)throw new IllegalStateException("closed");cache=List.copyOf(source.get());return cache;}void close(){open=false;}}`,
 hints:['Cache check trước open check.','Supplier chỉ gọi khi chưa có cache.'],explain:`Proxy trì hoãn query, không xóa query. Dữ liệu chưa tải cần session; dữ liệu cache sẵn có thể đọc sau đóng. DTO là ranh giới phù hợp cho web.`,
 }],check:[{q:'EAGER có đảm bảo một JOIN không?',options:['Có','Không, chỉ bảo đảm association sẵn theo mapping','Có nếu collection','Không thể phát SQL'],answer:1,explain:`Fetch timing khác SQL strategy; provider có thể phát query phụ.`},{q:'Cách ngăn web serialization gây lazy query là gì?',options:['Trả entity nguyên trạng','Tạo DTO trong service khi fetch plan đã tải dữ liệu','Đổi toàn bộ association sang EAGER','Giữ transaction mở vô hạn'],answer:1,explain:'DTO tạo ranh giới dữ liệu rõ và tránh getter lazy ở tầng web.'}],tags:['LAZY','EAGER','proxy']
},
{
 id:'lesson-jpa-005',track:'jpa',order:5,title:'Batch insert, IDENTITY và SEQUENCE pooled',level:'senior',minutes:25,
 goals:['So sánh thời điểm cấp id','Mô phỏng allocationSize và round-trip'],
 body:`### JDBC batch
Hibernate có thể gom nhiều INSERT vào JDBC batch khi driver, dialect và mapping hỗ trợ. Batch gửi nhiều lệnh với ít lượt trao đổi hơn; không nhất thiết biến thành một SQL duy nhất. {{hibernate.jdbc.batch_size}} cần cấu hình và đo. Import lớn nên persist theo chunk, flush rồi clear để gửi lệnh và bỏ entity managed khỏi persistence context.

### IDENTITY và SEQUENCE
Với {{GenerationType.IDENTITY}}, id chỉ có sau INSERT vì database sinh giá trị. Hibernate thường phải thực thi insert sớm để nhận generated key, làm khó trì hoãn insert và batch. Chi tiết còn phụ thuộc dialect/driver, không nên coi IDENTITY giống sequence.

SEQUENCE có thể cấp id trước INSERT. Optimizer pooled lấy một giá trị/block rồi phát nhiều id trong ứng dụng. {{allocationSize}} định nghĩa block theo mapping/optimizer và cần cấu hình nhất quán với sequence increment. Nhiều id được biết trước giúp ORM gom insert. Nếu process dừng giữa block, id chưa dùng tạo gap; primary key không phải số thứ tự hóa đơn liên tục.

| Strategy | Khi có id | Tác động |
|---|---|---|
| IDENTITY | sau insert | thường hạn chế gom insert |
| SEQUENCE pooled | trước insert theo block | thuận lợi cho batching |

~~~text
allocationSize 5: xin block một lần → dùng 5 id trong memory
hết block mới cần round-trip tiếp
~~~

### Flush, clear và thứ tự
Flush gửi pending statements nhưng entity vẫn managed. Clear detach tất cả entity; làm trước flush có thể bỏ thay đổi chưa gửi. Foreign key, cascade và insert ordering ảnh hưởng khả năng batch. Spring Data {{saveAll}} chỉ lặp save; nó không tự đảm bảo driver đang batch.

### Production
Kiểm tra SQL và metrics trên database/driver thật. Batch quá lớn giữ transaction/heap lâu và tăng chi phí rollback; batch quá nhỏ không giảm round-trip. Sequence increment không khớp có thể gây vấn đề tùy optimizer/schema. Một sequence pooled dùng nhiều instance vẫn cấp giá trị không trùng, nhưng thứ tự id không phản ánh thứ tự commit. Không dùng id làm timestamp.


### Xác minh batching thực tế
Batch size là số lệnh JDBC được gom khi driver và Hibernate có thể batch chúng; nó không có nghĩa database nhận đúng một câu SQL duy nhất. Cùng một batch chỉ gom được các câu lệnh tương thích về SQL shape và thứ tự. Generated key từ IDENTITY thường buộc insert chạy sớm để lấy id, do đó thường cản batching insert; hành vi chi tiết phụ thuộc dialect và driver.

SEQUENCE cho phép cấp khóa trước insert, còn pooled optimizer giảm số lần lấy sequence bằng cách cấp một vùng id cho mỗi block. allocationSize và cấu hình sequence phải tương thích với optimizer đang dùng. Kiểm tra log SQL/metrics thực tế, vì mapping hoặc thứ tự insert có thể khiến batch không được tạo dù đã cấu hình batch size.
### Liên hệ phỏng vấn
Nêu sequence có id trước insert nên thuận batching, còn identity cần kết quả insert. Thảo luận allocationSize, gap, flush/clear và cách xác minh batch thực tế.`,
 exercises:[{title:'Sequence id pool',prompt:`IdPool nhận allocationSize dương; nextId trả id tăng dần và chỉ tăng roundTrips mỗi lần bắt đầu block mới.`,
 starter:`class IdPool{IdPool(int n){}long nextId(){throw new UnsupportedOperationException("TODO");}int roundTrips(){throw new UnsupportedOperationException("TODO");}}`,
 tests:`public class Main{static void c(String n,boolean b){if(!b)throw new AssertionError(n);System.out.println("PASS "+n);}public static void main(String[]x){IdPool p=new IdPool(3);c("first",p.nextId()==1);c("same block",p.nextId()==2&&p.roundTrips()==1);c("block end",p.nextId()==3&&p.roundTrips()==1);c("next block",p.nextId()==4&&p.roundTrips()==2);IdPool q=new IdPool(1);c("size one",q.nextId()==1&&q.nextId()==2&&q.roundTrips()==2);boolean bad=false;try{new IdPool(0);}catch(IllegalArgumentException e){bad=true;}c("reject invalid",bad);System.out.println("RESULT 6/6");}}`,
 reference:`class IdPool{int size,remaining=0,roundTrips=0;long next=1;IdPool(int n){if(n<=0)throw new IllegalArgumentException();size=n;}long nextId(){if(remaining==0){remaining=size;roundTrips++;}remaining--;return next++;}int roundTrips(){return roundTrips;}}`,
 hints:['Khi remaining bằng 0, xin block và tăng bộ đếm.','Mỗi lần phát id giảm remaining, tăng next.'],explain:`Mô hình tách round-trip xin block với phát id trong memory. Sequence pooled thật có thể để gap nếu process dừng; gap không làm khóa chính sai.`,
 }],check:[{q:'SEQUENCE thường hỗ trợ batch insert hơn vì sao?',options:['Không cần id','Có thể lấy id trước insert','Không có round-trip','Đảm bảo id liên tục'],answer:1,explain:`Biết id trước cho phép trì hoãn và nhóm insert; vẫn có round-trip xin sequence và có thể có gap.`},{q:'Batch size của Hibernate có nghĩa gì?',options:['Một SQL duy nhất cho mọi entity','Số lệnh JDBC có thể gom trong một batch tương thích','Số sequence cần tạo','Số transaction đồng thời'],answer:1,explain:'Batch gom lệnh JDBC tương thích; cần xác minh driver, SQL shape và log thực tế.'}],tags:['batch insert','IDENTITY','SEQUENCE']
}
);
