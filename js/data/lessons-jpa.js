/* JPA lessons use small Java-only models so the exercises run without a database. */
(window.LESSONS = window.LESSONS || []).push(
{
 id:'lesson-jpa-001',track:'jpa',order:1,title:'Persistence context và dirty checking',level:'mid',minutes:25,
 goals:['Giải thích identity map (first-level cache) và vì sao find hai lần cùng id trả về cùng object','Hiểu snapshot và dirty checking: vì sao sửa entity managed không cần gọi save','Phân biệt flush với commit, và các trạng thái new/managed/detached/removed'],
 body:`### Hiểu nhanh: persistence context là "bàn làm việc" của Hibernate
Mỗi {{EntityManager}} (trong Hibernate gọi là {{Session}}) có một **persistence context**: vùng nhớ chứa các entity mà nó đang **quản lý (managed)**. Trong Spring, thường một transaction ({{@Transactional}}) dùng một persistence context. Hãy hình dung đó là bàn làm việc: entity nào đã nằm trên bàn thì Hibernate theo dõi mọi thay đổi trên nó, và đến lúc **flush** sẽ tự ghi các thay đổi xuống database.

### Identity map (first-level cache)
Bên trong persistence context có một map: khoá là (loại entity, id), giá trị là object. Khi gọi {{em.find(Account.class, 7L)}}:
1. Hibernate tra map trước. Nếu đã có, trả về **đúng object đó**, không chạy SQL.
2. Nếu chưa có, chạy SELECT, tạo object, đưa vào map rồi trả về.

Vì vậy trong một transaction, {{find}} hai lần cùng id cho ra cùng một instance ({{a1 == a2}} là true). Nhờ đó không có chuyện hai object khác nhau cùng đại diện một hàng rồi ghi đè lẫn nhau. Cache này chỉ sống trong một persistence context; transaction khác có map riêng. Query JPQL luôn chạy SQL, nhưng hàng nào có id đã nằm trong map thì Hibernate trả lại object managed sẵn có (không ghi đè thay đổi chưa flush của bạn).

### Snapshot và dirty checking
Khi nạp entity, Hibernate lưu thêm một **snapshot**: bản sao giá trị các cột tại lúc đọc. Setter chỉ đổi object Java trong RAM, không chạy SQL. Đến lúc flush, Hibernate duyệt các entity managed, so từng field với snapshot; entity nào có field khác thì sinh UPDATE. Đó là **dirty checking**: với entity đang managed, bạn **không cần** gọi {{save}}.

~~~java
@Transactional
public void rename(long id) {
    Account a = em.find(Account.class, id); // SELECT; a managed, snapshot = {name: "Lan"}
    a.setName("Mai");                       // chỉ đổi object trong RAM, chưa có SQL
}                                           // commit → flush: so snapshot, thấy name khác → UPDATE
~~~

Mặc định Hibernate sinh UPDATE chứa **mọi cột** của entity: câu SQL cố định nên tái dùng được prepared statement. {{@DynamicUpdate}} chỉ đưa cột thay đổi vào UPDATE: có lợi với bảng rất nhiều cột, nhưng mỗi tổ hợp cột là một câu SQL khác nên giảm hiệu quả statement cache. Bytecode enhancement có thể ghi nhận field bị đổi ngay trong setter để khỏi so toàn bộ snapshot, nhưng phải bật trong build; đừng giả định project đã có. Chỉ đổi sau khi đo.

### Flush khác commit
**Flush** = gửi các câu SQL đang chờ xuống database, **bên trong** transaction hiện tại. **Commit** = kết thúc transaction: thay đổi trở nên bền vững và transaction khác mới nhìn thấy. Flush xảy ra:
- tự động trước commit;
- trước một query JPQL/HQL có thể bị ảnh hưởng bởi thay đổi đang chờ (FlushMode AUTO), để query thấy dữ liệu mới nhất;
- khi bạn gọi {{em.flush()}}.

Sau flush, transaction vẫn có thể rollback và mọi SQL đã flush bị huỷ. Vì vậy flush không phải tín hiệu "dữ liệu đã lưu".

| Trạng thái | Nghĩa | Đổi field thì sao? |
|---|---|---|
| New/transient | object vừa {{new}}, chưa persist | không ai theo dõi; cần {{persist}} hoặc cascade |
| Managed | nằm trong persistence context | phát hiện lúc flush, tự UPDATE |
| Detached | từng managed nhưng context đã đóng, clear hoặc detach | không được theo dõi, không tự ghi |
| Removed | đã gọi {{remove}} | DELETE lúc flush |

### Merge không biến object đầu vào thành managed
{{em.merge(detached)}} tìm (hoặc nạp) instance managed cùng id, **chép state** từ object của bạn sang instance đó, rồi trả về instance managed. Object bạn truyền vào **vẫn detached**. Spring Data {{save()}} gọi merge khi entity không "mới" (id khác null), nên hãy dùng giá trị trả về: {{account = repo.save(account)}}.

### Lỗi production hay gặp
- **Transaction dài, import lớn**: mỗi entity managed tốn RAM cho object và snapshot, mỗi lần flush phải so tất cả. Import 1 triệu dòng trong một transaction dễ OOM hoặc flush rất chậm. Cách làm: xử lý theo chunk (ví dụ 500 entity), mỗi chunk {{flush()}} rồi {{clear()}}. Phải flush **trước** clear, nếu không thay đổi chưa gửi sẽ mất.
- **Sửa entity sau clear**: reference cũ đã detached, setter không còn tác dụng gì.
- **Bulk JPQL** ({{UPDATE Account a SET a.status = ...}}) chạy thẳng xuống database, bỏ qua persistence context: entity đang managed vẫn giữ giá trị cũ. Dùng {{@Modifying(clearAutomatically = true)}} hoặc tự clear.
- **Chỉ đọc**: {{@Transactional(readOnly = true)}} giúp Hibernate không giữ snapshot và bỏ dirty checking cho entity đọc ra, tiết kiệm RAM và CPU.

> Bài tập mô phỏng identity map và snapshot bằng Java thuần. Snapshot phải là **bản sao giá trị**: nếu giữ cùng object, setter đổi cả hai và không bao giờ phát hiện thay đổi. Sau flush phải cập nhật snapshot để lần flush sau không lặp lại UPDATE.

### Liên hệ phỏng vấn
Câu hay gặp: "Vì sao sửa entity mà không gọi save vẫn có UPDATE?" Trả lời: entity managed, có snapshot, dirty checking chạy lúc flush. Sau đó nêu flush khác commit, detached không được theo dõi, merge trả về instance khác, và cách xử lý batch lớn bằng flush rồi clear theo chunk.`,
 exercises:[{title:'Identity map và dirty fields',prompt:`Cài {{UnitOfWork}} mô phỏng persistence context:
- {{load(id, name, email)}}: nếu id đã được load thì trả về **cùng object** cũ (bỏ qua name/email truyền vào); nếu chưa thì tạo {{Account}}, lưu vào identity map và lưu snapshot (bản sao giá trị name, email).
- {{flush()}}: với mỗi entity đã load (theo thứ tự load), so field hiện tại với snapshot; trả về map id → danh sách tên field đổi theo thứ tự {{"name"}}, {{"email"}}. Entity không đổi thì không có trong map. Sau flush, cập nhật snapshot của entity đã đổi.`,
 starter:`class Account {long id;String name,email;Account(long i,String n,String e){id=i;name=n;email=e;}}
class UnitOfWork {Account load(long i,String n,String e){throw new UnsupportedOperationException("TODO");} Map<Long,List<String>> flush(){throw new UnsupportedOperationException("TODO");}}`,
 tests:`public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }
    public static void main(String[] args) {
        UnitOfWork u = new UnitOfWork();
        Account a = u.load(1, "A", "a");
        check("identity map returns same object", a == u.load(1, "X", "x"), "load cùng id phải trả cùng instance");
        check("second load keeps original state", "A".equals(a.name), "name = " + a.name + ", mong đợi A");
        Map<Long, List<String>> f = u.flush();
        check("clean flush is empty", f.isEmpty(), "flush = " + f);
        a.name = "B";
        f = u.flush();
        check("detect changed name", List.of("name").equals(f.get(1L)) && f.size() == 1, "flush = " + f);
        f = u.flush();
        check("snapshot updated after flush", f.isEmpty(), "flush lần 2 vẫn báo đổi: " + f);
        Account b = u.load(2, "P", "p");
        a.email = "b"; a.name = "C";
        f = u.flush();
        check("both fields in order name,email", List.of("name", "email").equals(f.get(1L)), "flush = " + f);
        check("untouched entity not flushed", !f.containsKey(2L), "flush = " + f);
        b.email = "q"; b.email = "p";
        f = u.flush();
        check("value changed back is not dirty", f.isEmpty(), "flush = " + f);
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
 reference:`class Account {long id;String name,email;Account(long i,String n,String e){id=i;name=n;email=e;}}
class UnitOfWork {
    Map<Long,Account> m=new LinkedHashMap<>();      // identity map, giữ thứ tự load
    Map<Long,List<String>> s=new HashMap<>();       // snapshot: bản sao giá trị, không phải object
    Account load(long i,String n,String e){
        if(m.containsKey(i))return m.get(i);
        Account a=new Account(i,n,e);m.put(i,a);s.put(i,List.of(n,e));return a;
    }
    Map<Long,List<String>> flush(){
        Map<Long,List<String>> r=new LinkedHashMap<>();
        for(Account a:m.values()){
            List<String> old=s.get(a.id),d=new ArrayList<>();
            if(!Objects.equals(old.get(0),a.name))d.add("name");
            if(!Objects.equals(old.get(1),a.email))d.add("email");
            if(!d.isEmpty()){r.put(a.id,d);s.put(a.id,List.of(a.name,a.email));} // cập nhật snapshot
        }
        return r;
    }
}`,
 hints:['Dùng Map<Long, Account> làm identity map; LinkedHashMap giữ thứ tự load.','Snapshot phải là bản sao giá trị (ví dụ List.of(name, email)), không phải tham chiếu tới chính Account.','Sau khi phát hiện thay đổi, ghi đè snapshot bằng giá trị hiện tại.'],
 explain:`Flush so trạng thái hiện tại với snapshot. Hai lỗi hay gặp:
- **Snapshot trỏ tới cùng object**: setter đổi object thì "snapshot" cũng đổi theo, nên không bao giờ phát hiện thay đổi. Hibernate lưu snapshot là mảng giá trị đã sao chép.
- **Quên cập nhật snapshot sau flush**: lần flush sau lại báo đổi, tương đương Hibernate gửi UPDATE lặp lại.

Test cuối cho thấy dirty checking so **giá trị**, không đếm số lần gọi setter: đổi rồi đổi lại như cũ thì không có UPDATE.`,
 }],check:[{q:'Dirty checking của Hibernate thường chạy khi nào?',options:['Ngay trong setter, mỗi lần gán field','Khi JVM tắt','Lúc flush (trước commit, trước query bị ảnh hưởng, hoặc khi gọi flush())','Trong getter'],answer:2,explain:`Hibernate so state hiện tại với snapshot lúc **flush**; commit tự gây flush trước. Setter của entity thường chỉ là code Java bình thường, không gửi SQL (trừ khi bật bytecode enhancement thì setter chỉ **đánh dấu** field bẩn, SQL vẫn đợi flush). Getter không liên quan đến dirty checking. JVM tắt không gây flush; transaction chưa commit sẽ mất.`},{q:'Bạn gọi {{em.clear()}} rồi sửa field trên một entity đã load trước đó. Điều gì xảy ra lúc commit?',options:['Không có UPDATE vì entity đã detached','Hibernate tự UPDATE vì vẫn còn snapshot','Ném LazyInitializationException ngay khi gọi setter','Hibernate tự merge entity trở lại'],answer:0,explain:`clear() detach mọi entity và bỏ snapshot, nên thay đổi sau đó không được theo dõi. Snapshot đã bị xoá cùng persistence context. Setter trên field thường không ném LazyInitializationException (chỉ khi truy cập association lazy chưa tải). Hibernate không bao giờ tự merge; bạn phải gọi {{merge}} và dùng instance nó trả về.`},{q:'{{Account saved = em.merge(detached);}} Phát biểu nào đúng?',options:['detached trở thành managed','saved và detached luôn là cùng object','saved là instance managed; detached vẫn detached','merge chạy UPDATE ngay lập tức'],answer:2,explain:`merge chép state vào instance managed (nạp từ DB nếu cần) và trả về instance đó; object đầu vào không đổi trạng thái, nên chúng là hai object khác nhau. UPDATE chỉ được gửi lúc flush nếu state khác snapshot, không phải ngay khi gọi merge.`}],tags:['PersistenceContext','dirty checking','flush']
},
{
 id:'lesson-jpa-002',track:'jpa',order:2,title:'N+1 query và tải association theo batch',level:'senior',minutes:25,
 goals:['Nhận diện N+1 và đo được số query','Chọn giữa fetch join, EntityGraph, batch fetching, DTO projection','Hiểu bẫy phân trang khi fetch join collection','Tải parent và child bằng đúng hai query'],
 body:`### Hiểu nhanh
Bạn lấy 80 đơn hàng bằng một query, rồi trong vòng lặp gọi {{order.getLines()}}. Mỗi lần gọi, Hibernate phát thêm một SELECT để lấy lines của đơn đó. Tổng cộng 1 + 80 = 81 query. Đó là **N+1**: 1 query cho danh sách cha, N query cho con. Mỗi query có thể chỉ mất 1 ms trong database, nhưng cộng round-trip mạng và lấy connection, 81 query có thể biến API 10 ms thành 150 ms; với 1.000 parent là vài giây.

~~~java
List<Order> orders = orderRepo.findAll();   // query 1: SELECT ... FROM orders
for (Order o : orders) {
    total += o.getLines().size();           // mỗi vòng: SELECT ... FROM order_line WHERE order_id = ?
}
~~~

Test chỉ có 1 order thì chỉ thấy 2 query, nên N+1 thường lọt qua review. Muốn bắt được, test phải có nhiều parent và kiểm tra số query **không tăng theo** số parent.

### LAZY hay EAGER đều không tự chữa N+1
- {{LAZY}} chỉ **trì hoãn** việc tải đến lúc truy cập. Truy cập trong vòng lặp thì mỗi lần một query.
- {{EAGER}} nghĩa là "phải có sẵn khi entity được tải", **không** có nghĩa "dùng JOIN". Với {{em.find}}, Hibernate có thể JOIN; nhưng với JPQL {{SELECT o FROM Order o}}, câu SQL chỉ đọc bảng orders, rồi Hibernate phải chạy **thêm** query cho association EAGER của từng order: vẫn là N+1, và còn xảy ra ở mọi nơi load Order kể cả khi không cần dữ liệu đó.
- Theo chuẩn JPA, {{@ManyToOne}} và {{@OneToOne}} mặc định là EAGER. Nên ghi {{fetch = FetchType.LAZY}} tường minh rồi chọn fetch plan theo từng use case.

### Các cách sửa
1. **Fetch join**: {{SELECT o FROM Order o JOIN FETCH o.lines WHERE o.status = :s}}, một query trả về cả cha và con. Từ Hibernate 6, kết quả tự loại parent trùng (không cần DISTINCT như Hibernate 5).
2. **EntityGraph**: {{@EntityGraph(attributePaths = "lines")}} trên method repository khai báo association cần tải cho use case đó; Hibernate sinh JOIN.
3. **Batch fetching**: {{@BatchSize(size = 50)}} trên collection hoặc cấu hình {{hibernate.default_batch_fetch_size}}. Khi bạn chạm vào lines của order đầu tiên, Hibernate tải lines cho tối đa 50 order đang chờ cùng lúc bằng {{WHERE order_id IN (...)}}. 80 order: 1 + 2 query thay vì 81, không cần sửa query.
4. **DTO projection**: chỉ chọn cột màn hình cần ({{SELECT new com.shop.OrderRow(o.id, o.total) FROM Order o}}), không tạo entity, không có lazy.
5. **Hai query tự viết**: lấy orders, gom id, lấy toàn bộ lines bằng {{IN (:ids)}}, rồi nhóm trong RAM. Đây là bài tập bên dưới.

~~~text
orders = queryOrders()                 // query 1
lines  = queryLinesByOrderIds(ids)     // query 2: WHERE order_id IN (1, 2, 3)
group lines by orderId                 // ghép trong RAM, không query trong vòng lặp
~~~

| Cách | Ưu điểm | Cạm bẫy |
|---|---|---|
| Fetch join / EntityGraph | 1 query | nhân dòng; không phân trang an toàn khi fetch collection |
| Batch fetching | ít sửa code, số query khoảng N / batch size | N rất lớn vẫn nhiều query |
| DTO projection | nhẹ nhất | mỗi màn hình một query riêng |
| Hai query + IN | kiểm soát hoàn toàn | IN quá dài chạm giới hạn (Oracle 1.000 phần tử, SQL Server khoảng 2.100 tham số) nên phải chia lô |

### Bẫy kinh điển: fetch join collection + phân trang
JOIN trả một dòng cho mỗi cặp (order, line): order có 3 lines chiếm 3 dòng. Nếu đặt {{LIMIT 20}} vào SQL, bạn có thể nhận 20 dòng thuộc 7 order, order cuối bị cắt mất lines. Hibernate biết điều này nên khi có {{JOIN FETCH}} collection kèm {{setMaxResults}} (hoặc {{Pageable}}), nó **không** đưa LIMIT xuống SQL mà tải **toàn bộ** kết quả rồi cắt trong RAM, chỉ in cảnh báo HHH90003004. Bảng 1 triệu order sẽ gây OOM. Bật {{hibernate.query.fail_on_pagination_over_collection_fetch=true}} để biến cảnh báo thành exception ngay khi test.

Cách đúng: phân trang **chỉ trên parent** (query 1 lấy 20 order), rồi tải lines cho 20 id đó (fetch join với {{WHERE o.id IN :ids}}, hoặc batch fetching).

### Production
- Bật log SQL ở dev/test (logger {{org.hibernate.SQL}}) và đếm query; có thể dùng {{hibernate.generate_statistics}} hoặc thư viện proxy DataSource để assert số query trong integration test.
- Fetch join hai collection kiểu {{List}} cùng lúc gây {{MultipleBagFetchException}}; đổi sang {{Set}} thì hết lỗi nhưng số dòng thành **tích** kích thước hai collection (Cartesian product). Tải từng collection bằng query riêng.
- Số query không phải mục tiêu duy nhất: 1 query trả 2 triệu dòng còn tệ hơn 3 query nhỏ. Xem cả số dòng, payload, thời gian DB và heap.

### Liên hệ phỏng vấn
"Bạn phát hiện và sửa N+1 thế nào?" Nêu dấu hiệu (số query tăng theo số parent), cách đo (SQL log, statistics, APM), rồi chọn giải pháp theo use case: fetch join hoặc EntityGraph cho trang chi tiết, batch fetching hoặc hai query cho danh sách, DTO projection cho màn hình chỉ đọc. Giải thích thêm bẫy phân trang với collection fetch. Đừng trả lời "đổi sang EAGER".`,
 exercises:[{title:'Giảm N+1 xuống hai query',prompt:`{{Repo}} đếm số lần gọi: {{a}} cho {{orders()}}, {{b}} cho {{lines(ids)}}. Cài {{Service.load()}} trả về map orderId → danh sách sku, theo thứ tự order:
- Chỉ gọi {{orders()}} **một** lần và {{lines(ids)}} **một** lần với tập id của mọi order (không gọi trong vòng lặp).
- Order không có line vẫn có mặt trong map với danh sách rỗng.
- Nếu không có order nào thì **không** gọi {{lines}} và trả map rỗng.`,
 starter:`record Order(long id){} record Line(long orderId,String sku){}
class Repo{int a,b;Set<Long> lastIds;List<Order> orders(){a++;return List.of(new Order(1),new Order(2),new Order(3));}List<Line> lines(Set<Long> ids){b++;lastIds=new HashSet<>(ids);return List.of(new Line(1,"A"),new Line(1,"B"),new Line(3,"C"));}}
class Service{Repo r;Service(Repo x){r=x;}Map<Long,List<String>> load(){throw new UnsupportedOperationException("TODO");}}`,
 tests:`public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }
    public static void main(String[] args) {
        Repo r = new Repo();
        Map<Long, List<String>> m = new Service(r).load();
        check("exactly two queries", r.a == 1 && r.b == 1, "orders() gọi " + r.a + " lần, lines() gọi " + r.b + " lần");
        check("lines queried with all order ids", Set.of(1L, 2L, 3L).equals(r.lastIds), "ids = " + r.lastIds);
        check("multiple children", List.of("A", "B").equals(m.get(1L)), "order 1 = " + m.get(1L));
        check("parent without children is empty", m.get(2L) != null && m.get(2L).isEmpty(), "order 2 = " + m.get(2L));
        check("last child", List.of("C").equals(m.get(3L)), "order 3 = " + m.get(3L));
        check("keys in order", List.of(1L, 2L, 3L).equals(new ArrayList<>(m.keySet())), "keys = " + m.keySet());
        Repo empty = new Repo() { List<Order> orders() { a++; return List.of(); } };
        Map<Long, List<String>> e = new Service(empty).load();
        check("no orders: skip lines query", e.isEmpty() && empty.b == 0, "map = " + e + ", lines() gọi " + empty.b + " lần");
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
 reference:`record Order(long id){} record Line(long orderId,String sku){}
class Repo{int a,b;Set<Long> lastIds;List<Order> orders(){a++;return List.of(new Order(1),new Order(2),new Order(3));}List<Line> lines(Set<Long> ids){b++;lastIds=new HashSet<>(ids);return List.of(new Line(1,"A"),new Line(1,"B"),new Line(3,"C"));}}
class Service{Repo r;Service(Repo x){r=x;}
    Map<Long,List<String>> load(){
        List<Order> os=r.orders();                              // query 1
        Map<Long,List<String>> out=new LinkedHashMap<>();
        for(Order o:os)out.put(o.id(),new ArrayList<>());       // tạo entry trước: order rỗng vẫn có mặt
        if(out.isEmpty())return out;                            // không có id thì khỏi query 2
        for(Line l:r.lines(out.keySet()))out.get(l.orderId()).add(l.sku()); // query 2, nhóm trong RAM
        return out;
    }
}`,
 hints:['Tạo entry (danh sách rỗng) cho mọi order trước khi ráp line.','Gom id vào một Set rồi gọi lines(ids) đúng một lần, bên ngoài vòng lặp.','Kiểm tra trường hợp không có order trước khi gọi lines.'],
 explain:`Query 1 tải parent, query 2 tải mọi child theo tập id, rồi nhóm theo {{orderId}} trong RAM. Tạo entry trước giúp order không có line vẫn xuất hiện (giống LEFT JOIN). Bỏ qua query 2 khi tập id rỗng vì {{IN ()}} rỗng là SQL không hợp lệ ở nhiều database.

Lỗi hay gặp: gọi {{lines(Set.of(o.id()))}} trong vòng lặp, tức chính là N+1. Trong thực tế còn phải chia tập id thành lô (ví dụ 500 id) khi danh sách lớn để không vượt giới hạn tham số của database. Đây cũng là cách Hibernate batch fetching hoạt động bên dưới.`,
 }],check:[{q:'Đổi association sang {{FetchType.LAZY}} có tự loại bỏ N+1 không?',options:['Có, LAZY luôn sinh một JOIN','Có, vì LAZY bắt buộc dùng second-level cache','Không, truy cập association của từng parent trong vòng lặp vẫn phát một query mỗi lần','LAZY không dùng được với collection'],answer:2,explain:`LAZY chỉ hoãn thời điểm tải; truy cập trong vòng lặp vẫn N query. Cần fetch join, EntityGraph, batch fetching hoặc projection. LAZY không sinh JOIN (đó là việc của fetch join), không liên quan second-level cache, và collection mặc định đã là LAZY.`},{q:'Query có {{JOIN FETCH o.lines}} kèm phân trang 20 order/trang. Hibernate 6 xử lý thế nào?',options:['Tải toàn bộ kết quả rồi cắt trang trong RAM, chỉ in cảnh báo (trừ khi bật fail_on_pagination_over_collection_fetch)','Đưa LIMIT 20 xuống SQL và luôn trả đúng 20 order đầy đủ lines','Tự tách thành hai query: phân trang order rồi tải lines','Ném lỗi biên dịch JPQL'],answer:0,explain:`JOIN nhân dòng theo số line, nên LIMIT ở SQL sẽ cắt giữa collection. Hibernate vì vậy phân trang trong RAM và cảnh báo HHH90003004, rất nguy hiểm với bảng lớn. Nó không tự tách thành hai query (đó là việc bạn phải làm), và JPQL vẫn hợp lệ nên không có lỗi biên dịch.`},{q:'Bật {{hibernate.default_batch_fetch_size=50}}, load 120 order rồi duyệt lines của từng order. Khoảng bao nhiêu query?',options:['1','121','2','Khoảng 4: 1 query order + khoảng 3 query lines dạng IN'],answer:3,explain:`Batch fetching gom tối đa 50 khoá mỗi lần: 120 order cần khoảng 3 query IN cho lines, cộng 1 query order. Con số chính xác có thể khác một chút tuỳ cách Hibernate chia lô, nhưng không còn tăng theo từng order. 121 là N+1 khi không có batch; 1 hay 2 query chỉ đạt được bằng fetch join hoặc tự viết query IN không chia lô.`}],tags:['N+1','batch fetching','fetch join']
},
{
 id:'lesson-jpa-003',track:'jpa',order:3,title:'Optimistic locking với @Version',level:'senior',minutes:25,
 goals:['Giải thích lost update và điều kiện version trong câu UPDATE','Biết exception nào được ném và bắt nó ở đâu trong Spring','Retry đúng cách: transaction mới, đọc state mới, áp dụng lại ý định, có giới hạn'],
 body:`### Lost update: vì sao cần khoá
Hai nhân viên cùng mở sản phẩm có tồn kho 10. A bán 3 nên tính 7; B nhập thêm 5 nên tính 15. A lưu trước (7), B lưu sau (15). Kết quả 15 là sai, đáng lẽ phải 12: thay đổi của A đã bị **ghi đè âm thầm**. Đó là **lost update**. Transaction isolation mặc định (READ COMMITTED) không ngăn được vì hai câu UPDATE đều hợp lệ.

### @Version hoạt động thế nào
Thêm một cột version vào entity:

~~~java
@Entity
class Product {
    @Id Long id;
    int stock;
    @Version int version;   // Hibernate tự quản, ứng dụng không tự tăng
}
~~~

Khi flush một thay đổi, Hibernate sinh:

~~~sql
UPDATE product SET stock = ?, version = 5 WHERE id = ? AND version = 4
~~~

Câu UPDATE chỉ khớp hàng nếu version trong DB **vẫn là 4**, tức chưa ai sửa kể từ lúc bạn đọc. Database thực hiện kiểm tra và ghi trong **cùng một câu lệnh nguyên tử**, nên không có khe hở giữa "kiểm tra" và "ghi". Nếu số hàng bị ảnh hưởng là 0 (đã có người tăng version, hoặc hàng bị xoá), Hibernate ném {{StaleObjectStateException}}, được JPA bọc thành {{OptimisticLockException}} và Spring dịch thành {{ObjectOptimisticLockingFailureException}}.

~~~text
A đọc v4 → UPDATE ... WHERE version=4 → 1 hàng → v5, thành công
B đọc v4 → UPDATE ... WHERE version=4 → 0 hàng → exception
B mở transaction mới → đọc v5 → áp dụng lại "nhập thêm 5" → UPDATE ... WHERE version=5 → thành công
~~~

Gọi là "optimistic" vì không giữ lock nào trong lúc người dùng suy nghĩ hay lúc tính toán; chỉ phát hiện xung đột lúc ghi. @Version cũng được kiểm tra khi {{merge}} một entity detached: nếu version trong object cũ hơn DB thì cũng bị từ chối, rất hữu ích cho form web mở lâu.

### Retry đúng cách
Không thể gửi lại UPDATE với version cũ, nó sẽ fail mãi. Retry đúng nghĩa là:
1. Mở **transaction mới** (transaction cũ đã bị đánh dấu rollback-only, không dùng tiếp được).
2. Đọc lại state mới (version mới).
3. Áp dụng lại **ý định** ("cộng thêm 5"), chứ không ghi lại **kết quả** đã tính (15).
4. Giới hạn số lần (ví dụ 3), có backoff nhỏ khi tải cao.

Vì vậy retry phải đặt **bên ngoài** method {{@Transactional}}: ví dụ một method khác gọi vào service transactional qua proxy, hoặc {{@Retryable}} của Spring Retry đặt ở lớp ngoài. Bắt exception bên trong cùng transaction rồi thử lại là sai.

Không retry mù nếu thao tác có side effect ngoài database (gửi email, gọi cổng thanh toán): dùng idempotency key hoặc outbox. Và không phải xung đột nào cũng nên retry: nếu người dùng quyết định dựa trên dữ liệu đã thay đổi (giá mới, hạn mức mới), hãy trả HTTP 409 để họ xem lại.

| Chiến lược | Chọn khi | Cái giá |
|---|---|---|
| Optimistic (@Version) | xung đột hiếm, đọc nhiều ghi ít, thao tác dài | phải retry hoặc trả 409 |
| Pessimistic ({{PESSIMISTIC_WRITE}}, SELECT ... FOR UPDATE) | tranh chấp cao trên ít hàng nóng, đoạn xử lý ngắn | giữ lock, chờ, timeout, deadlock |

### Bẫy production
- **Bulk JPQL** ({{UPDATE Product p SET p.stock = 0}}) không tự tăng version, nên các transaction khác không phát hiện xung đột. Phải tự tăng ({{SET p.version = p.version + 1}}; HQL có cú pháp {{UPDATE VERSIONED}}) và clear persistence context.
- **Retry vô hạn** làm tải tăng đúng lúc database đang tranh chấp. Đo tỷ lệ conflict và giới hạn số lần.
- **@Version chỉ bảo vệ từng hàng**. Ràng buộc trên nhiều hàng (ví dụ tổng ca trực ≥ 2 người) cần unique/check constraint hoặc lock khác.
- **Hàng "nóng"** (một bộ đếm mọi request cùng sửa) sẽ conflict liên tục; optimistic locking không hợp, cân nhắc UPDATE nguyên tử {{SET stock = stock - 1 WHERE stock > 0}} hoặc pessimistic lock.

### Liên hệ phỏng vấn
Mô tả lost update, câu UPDATE có điều kiện version, exception được ném, rồi cách retry: ngoài transaction, đọc lại, áp dụng lại ý định, có giới hạn. Nêu thêm khi nào chọn pessimistic, và bẫy bulk update.`,
 exercises:[{title:'Version check và retry',prompt:`Mô phỏng một hàng có {{value}} và {{version}} (cả hai bắt đầu là 0):
- {{update(expectedVersion, delta)}}: nếu {{version}} hiện tại khác {{expectedVersion}} thì trả {{false}} và **không** đổi gì; nếu khớp thì cộng {{delta}} vào value, tăng version thêm 1 và trả {{true}} (giống UPDATE ... WHERE version = ?).
- {{add(delta)}}: thử tối đa **3 lần**; mỗi lần **đọc version hiện tại** rồi gọi {{update}}. Thành công thì dừng. Sau 3 lần thất bại ném {{IllegalStateException}}.`,
 starter:`class Counter{int value,version;boolean update(int v,int d){throw new UnsupportedOperationException("TODO");}void add(int d){throw new UnsupportedOperationException("TODO");}}`,
 tests:`public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }
    public static void main(String[] args) {
        Counter a = new Counter();
        check("first update succeeds", a.update(0, 5), "update(0, 5) phải trả true");
        check("version bumped", a.version == 1 && a.value == 5, "value=" + a.value + ", version=" + a.version);
        check("stale version fails without change", !a.update(0, 9) && a.value == 5 && a.version == 1, "value=" + a.value + ", version=" + a.version);
        a.add(2);
        check("add uses current version", a.value == 7 && a.version == 2, "value=" + a.value + ", version=" + a.version);
        // mô phỏng: lần thử đầu tiên bị writer khác chen vào (version tăng), lần sau phải đọc lại version
        Counter flaky = new Counter() {
            int calls;
            boolean update(int v, int d) { if (calls++ == 0) { version++; return false; } return super.update(v, d); }
        };
        flaky.add(5);
        check("retry re-reads version after conflict", flaky.value == 5 && flaky.version == 2, "value=" + flaky.value + ", version=" + flaky.version);
        int[] attempts = {0};
        Counter busy = new Counter() { boolean update(int v, int d) { attempts[0]++; return false; } };
        boolean thrown = false;
        try { busy.add(1); } catch (IllegalStateException e) { thrown = true; }
        check("gives up after 3 attempts", thrown && attempts[0] == 3, "thrown=" + thrown + ", attempts=" + attempts[0]);
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
 reference:`class Counter{int value,version;
    boolean update(int v,int d){
        if(version!=v)return false;    // giống UPDATE ... WHERE version = ? ảnh hưởng 0 hàng
        value+=d;version++;return true;
    }
    void add(int d){
        for(int i=0;i<3;i++){
            int seen=version;              // mỗi lần thử đọc lại state mới
            if(update(seen,d))return;      // áp dụng lại ý định (cộng d), không ghi lại kết quả cũ
        }
        throw new IllegalStateException("conflict after 3 attempts");
    }
}`,
 hints:['update: so version trước; không khớp thì return false ngay, không đổi value.','add: đọc version **bên trong** vòng lặp, không phải một lần trước vòng lặp.','Hết 3 lần mà chưa thành công thì throw new IllegalStateException(...).'],
 explain:`{{update}} mô phỏng compare-and-set mà database làm trong một câu UPDATE có điều kiện version. Lỗi hay gặp nhất là đọc version **một lần trước vòng lặp**: sau khi xung đột, lần thử sau vẫn dùng version cũ nên lần nào cũng thất bại. Test {{flaky}} bắt đúng lỗi này.

Ở ứng dụng thật, mỗi lần thử là một transaction mới (đọc entity mới từ DB), và vòng retry nằm ngoài method @Transactional. Giới hạn 3 lần giúp không khuếch đại tải khi tranh chấp cao.`,
 }],check:[{q:'Retry sau khi gặp {{OptimisticLockException}} nên làm gì?',options:['Gửi lại UPDATE với version cũ','Đọc state mới trong transaction mới rồi áp dụng lại ý định, giới hạn số lần','Xoá cột version để hết lỗi','Bắt exception rồi tiếp tục trong cùng transaction, retry đến khi thành công'],answer:1,explain:`Version cũ chắc chắn tiếp tục thất bại. Transaction hiện tại đã bị đánh dấu rollback-only nên không thể tiếp tục trong nó, và retry vô hạn khuếch đại tải. Xoá version thì quay lại lost update. Cách đúng là transaction mới, đọc lại, áp dụng lại ý định, có giới hạn.`},{q:'{{@Query("UPDATE Product p SET p.stock = 0") @Modifying}} có tự tăng {{@Version}} không?',options:['Có, Hibernate luôn tăng version','Chỉ trên PostgreSQL','Có, nếu retry','Không; bulk JPQL bỏ qua entity, phải tự SET version = version + 1 (hoặc UPDATE VERSIONED trong HQL) và clear context'],answer:3,explain:`Bulk DML chạy thẳng xuống database, không qua entity managed nên không có cơ chế version tự động. Hành vi này không phụ thuộc loại database, và retry không liên quan. Nếu không tự tăng version, các transaction đang giữ bản cũ sẽ ghi đè mà không bị phát hiện.`},{q:'Khi nào pessimistic lock ({{SELECT ... FOR UPDATE}}) hợp hơn @Version?',options:['Khi một vài hàng bị rất nhiều request cùng sửa và đoạn xử lý ngắn','Khi người dùng mở form sửa trong 10 phút','Khi xung đột cực hiếm','Khi muốn tránh hoàn toàn deadlock'],answer:0,explain:`Tranh chấp cao trên hàng nóng làm optimistic liên tục fail và retry; khoá ngắn sẽ hiệu quả hơn. Form mở 10 phút mà giữ lock DB thì chặn người khác suốt thời gian đó, nên optimistic hợp hơn. Xung đột hiếm cũng là đất của optimistic. Pessimistic lock còn **có thể** gây deadlock chứ không tránh được.`}],tags:['@Version','optimistic locking','retry']
},
{
 id:'lesson-jpa-004',track:'jpa',order:4,title:'Fetch LAZY/EAGER và LazyInitializationException',level:'mid',minutes:25,
 goals:['Hiểu proxy và persistent collection tải dữ liệu khi được truy cập','Giải thích vì sao LazyInitializationException xảy ra','Tạo DTO trong service khi persistence context còn mở; biết rủi ro của Open Session in View'],
 body:`### Lazy loading hoạt động thế nào
Khi association là {{LAZY}}, Hibernate không đọc nó lúc load entity. Thay vào đó:
- với to-one ({{@ManyToOne Customer customer}}): field chứa một **proxy**, là subclass của {{Customer}} do Hibernate sinh ra lúc chạy, mới chỉ biết id;
- với collection ({{@OneToMany List<Line> lines}}): field chứa một **persistent collection** (ví dụ {{PersistentBag}}) chưa có phần tử.

Lần đầu bạn gọi {{customer.getName()}} hoặc {{lines.size()}}, proxy/collection nhờ **Session đang gắn với nó** chạy SELECT rồi giữ kết quả. Các lần sau đọc từ bộ nhớ.

Nếu lúc đó Session đã đóng (transaction đã kết thúc) và dữ liệu chưa được tải, proxy không còn connection hay persistence context để chạy query, nên Hibernate ném:

~~~text
org.hibernate.LazyInitializationException: failed to lazily initialize a collection
of role: com.shop.Order.lines: could not initialize proxy - no Session
~~~

Lưu ý: gọi {{getId()}} trên proxy to-one thường **không** gây query vì proxy đã biết id.

### Kịch bản lỗi điển hình
~~~java
@Transactional(readOnly = true)
public Order find(long id) { return repo.findById(id).orElseThrow(); } // transaction đóng khi return

// Controller: Jackson serialize Order → gọi getLines() → không còn Session → LazyInitializationException
~~~

Controller trả thẳng entity, Jackson gọi mọi getter, chạm vào collection lazy sau khi transaction đã đóng.

### EAGER không phải lời giải
{{EAGER}} yêu cầu association có sẵn khi entity được tải, nhưng **không** đảm bảo một câu JOIN: với JPQL, Hibernate thường chạy thêm query cho từng entity (N+1). EAGER còn áp dụng **ở mọi nơi**, kể cả màn hình không cần dữ liệu đó, và không thể "tắt" theo từng query. Nên để LAZY cho mọi association rồi chỉ định cần tải gì cho từng use case.

### Ranh giới đúng: service tải đủ rồi trả DTO
~~~java
@Transactional(readOnly = true)
public OrderDto detail(long id) {
    Order order = repo.findWithLines(id);      // JOIN FETCH o.lines: tải đúng thứ cần
    return OrderDto.from(order);               // map sang DTO khi Session còn mở
}                                              // web chỉ thấy DTO, không có proxy nào lọt ra
~~~

Cách khai báo dữ liệu cần tải: fetch join trong JPQL, {{@EntityGraph}}, hoặc DTO projection (không có entity nên không có lazy). {{Hibernate.initialize(order.getLines())}} ép tải một association khi Session còn mở; dùng được nhưng thường sinh thêm query, không thay được fetch plan.

| Cách | Ý nghĩa | Rủi ro |
|---|---|---|
| LAZY | tải khi truy cập | N+1, hoặc lỗi nếu Session đã đóng |
| EAGER | luôn tải theo mapping | dữ liệu thừa, query phụ ở mọi nơi |
| Fetch join / EntityGraph | tải đúng association cho use case | nhân dòng khi fetch collection |
| DTO projection | đúng cột màn hình cần | mỗi use case một query |

### Open Session in View (OSIV)
Spring Boot **bật OSIV mặc định** ({{spring.jpa.open-in-view=true}}) và in cảnh báo lúc khởi động. OSIV giữ EntityManager mở đến khi render xong response, nên lazy loading trong controller/Jackson "chạy được". Cái giá:
- query phát sinh ngầm ở tầng web, khó thấy, dễ N+1;
- connection database bị giữ suốt thời gian xử lý request (gồm cả gọi API ngoài, serialize), làm cạn connection pool khi tải cao.

Nhiều team đặt {{spring.jpa.open-in-view=false}} để lỗi lộ ra sớm ở ranh giới service. Tương tự, đừng bật {{hibernate.enable_lazy_load_no_trans}}: nó mở Session tạm cho **mỗi** lần lazy load, che lỗi và gây N+1 âm thầm.

### Bẫy khác
- {{toString()}}, {{equals}}/{{hashCode}} (hoặc Lombok {{@Data}}) chạm vào association lazy sẽ gây query hoặc LazyInitializationException ở chỗ không ngờ, như khi ghi log.
- Fetch join nhiều collection lớn cùng lúc làm số dòng nhân lên; tách thành nhiều query.
- Integration test chạy trong một {{@Transactional}} bao trùm có thể che lỗi vì Session luôn mở; nên có test gọi service rồi kiểm tra DTO **sau khi** transaction đã đóng.

### Liên hệ phỏng vấn
Giải thích proxy cần Session để tải, vì sao lỗi xảy ra sau khi transaction đóng, vì sao EAGER và OSIV chỉ che triệu chứng. Đề xuất: mọi association LAZY, fetch plan theo use case, map DTO trong service, tắt OSIV.`,
 exercises:[{title:'Lazy proxy và session',prompt:`Mô phỏng một persistent collection lazy. {{LazyLines}} nhận một {{Supplier}} đóng vai trò câu SELECT:
- {{get()}}: nếu đã tải trước đó thì trả dữ liệu đã giữ, **không** gọi supplier nữa (kể cả khi session đã đóng).
- Nếu chưa tải và session còn mở: gọi supplier **đúng một lần**, giữ một bản sao của kết quả, rồi trả về.
- Nếu chưa tải và session đã đóng ({{close()}} đã được gọi): ném {{IllegalStateException}} và **không** gọi supplier.`,
 starter:`class LazyLines{boolean open=true;java.util.function.Supplier<List<String>> source;LazyLines(java.util.function.Supplier<List<String>> s){source=s;}List<String> get(){throw new UnsupportedOperationException("TODO");}void close(){open=false;}}`,
 tests:`public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }
    public static void main(String[] args) {
        int[] calls = {0};
        LazyLines a = new LazyLines(() -> { calls[0]++; return List.of("x"); });
        int before = calls[0];
        List<String> got = a.get();
        check("not loaded before access", before == 0, "supplier đã bị gọi " + before + " lần trước get()");
        check("lazy load on first access", List.of("x").equals(got), "get() = " + got);
        check("loaded only once", a.get().size() == 1 && calls[0] == 1, "supplier gọi " + calls[0] + " lần");
        a.close();
        check("loaded data readable after close", List.of("x").equals(a.get()) && calls[0] == 1, "calls=" + calls[0]);
        int[] calls2 = {0};
        LazyLines b = new LazyLines(() -> { calls2[0]++; return List.of("y"); });
        b.close();
        boolean err = false;
        try { b.get(); } catch (IllegalStateException e) { err = true; }
        check("closed session throws", err, "phải ném IllegalStateException");
        check("closed session does not query", calls2[0] == 0, "supplier gọi " + calls2[0] + " lần");
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
 reference:`class LazyLines{boolean open=true;java.util.function.Supplier<List<String>> source;List<String> cache;LazyLines(java.util.function.Supplier<List<String>> s){source=s;}
    List<String> get(){
        if(cache!=null)return cache;                                   // đã tải: không cần session
        if(!open)throw new IllegalStateException("could not initialize proxy - no Session");
        cache=List.copyOf(source.get());                               // tải đúng một lần
        return cache;
    }
    void close(){open=false;}
}`,
 hints:['Thêm một field cache; null nghĩa là chưa tải.','Kiểm tra cache trước, rồi mới kiểm tra open.','Chỉ gọi source.get() khi cache còn null và session đang mở.'],
 explain:`Thứ tự kiểm tra là mấu chốt: dữ liệu **đã tải** vẫn đọc được sau khi session đóng (giống collection đã được fetch join hoặc đã chạm vào trong transaction), còn dữ liệu **chưa tải** thì cần session. Nếu kiểm tra {{open}} trước, test "loaded data readable after close" sẽ fail.

Trong Hibernate thật, cách tránh lỗi không phải là mở session lâu hơn, mà là tải đủ dữ liệu trong service (fetch join, EntityGraph) rồi map sang DTO trước khi transaction đóng.`,
 }],check:[{q:'{{FetchType.EAGER}} có đảm bảo Hibernate dùng một câu JOIN không?',options:['Có, luôn luôn','Có, nhưng chỉ với collection','Không; nó chỉ đảm bảo dữ liệu có sẵn, Hibernate có thể chạy thêm query (ví dụ với JPQL)','EAGER không phát SQL nào'],answer:2,explain:`EAGER nói về **thời điểm** (có sẵn ngay), không nói về **cách** lấy (SQL shape). Với JPQL, query chính chỉ đọc bảng gốc, nên Hibernate phải chạy query phụ cho association EAGER, thường là N+1. Không có ngoại lệ "chỉ với collection", và tất nhiên EAGER vẫn phải phát SQL để lấy dữ liệu.`},{q:'Cách nào ngăn tầng web (Jackson) gây lazy query hoặc LazyInitializationException?',options:['Trả entity nguyên trạng và bật OSIV','Trong service, tải đúng association cần (fetch join/EntityGraph) rồi map sang DTO trước khi transaction đóng','Đổi toàn bộ association sang EAGER','Bật hibernate.enable_lazy_load_no_trans'],answer:1,explain:`DTO tạo ranh giới dữ liệu rõ ràng: web không thấy proxy nào. OSIV làm lỗi "biến mất" nhưng chuyển query sang tầng web và giữ connection lâu. EAGER tải thừa ở mọi nơi và vẫn có thể N+1. enable_lazy_load_no_trans mở session tạm cho mỗi lần lazy load, che lỗi và sinh N+1 âm thầm.`}],tags:['LAZY','EAGER','proxy','OSIV']
},
{
 id:'lesson-jpa-005',track:'jpa',order:5,title:'Batch insert, IDENTITY và SEQUENCE pooled',level:'senior',minutes:25,
 goals:['Hiểu JDBC batch và cấu hình hibernate.jdbc.batch_size','Giải thích vì sao IDENTITY tắt batch insert còn SEQUENCE thì không','Mô phỏng allocationSize của pooled optimizer và đếm round-trip'],
 body:`### JDBC batch là gì
Không có batch, 10.000 INSERT là 10.000 lần gửi lệnh tới database và chờ trả lời (round-trip). Nếu mỗi round-trip mất 0,5 ms thì riêng thời gian mạng đã là 5 giây. **JDBC batch** gom nhiều lệnh cùng dạng SQL ({{addBatch()}}) rồi gửi một lần ({{executeBatch()}}): 10.000 INSERT với batch 50 chỉ còn khoảng 200 round-trip.

Hibernate **không** batch mặc định. Cần cấu hình:
- {{hibernate.jdbc.batch_size=50}} (trong Spring Boot: {{spring.jpa.properties.hibernate.jdbc.batch_size}});
- {{hibernate.order_inserts=true}} để sắp INSERT cùng bảng đứng cạnh nhau (batch chỉ gom được các lệnh **liên tiếp** cùng câu SQL);
- tuỳ driver: PostgreSQL {{reWriteBatchedInserts=true}}, MySQL {{rewriteBatchedStatements=true}} để driver ghép thành INSERT nhiều dòng.

Batch không biến 50 lệnh thành "một câu SQL" (trừ khi driver rewrite); nó giảm số lần trao đổi qua mạng.

### Vì sao IDENTITY phá batch
Với {{GenerationType.IDENTITY}} (cột auto-increment), **database** sinh id lúc INSERT. Nhưng Hibernate cần id ngay khi {{persist()}} để đưa entity vào identity map (khoá là id). Vì vậy nó phải chạy INSERT **ngay lập tức**, từng câu một, để lấy generated key. Tài liệu Hibernate nói rõ: dùng IDENTITY thì Hibernate **tắt JDBC batch cho INSERT** của entity đó.

### SEQUENCE và pooled optimizer
Với {{GenerationType.SEQUENCE}}, Hibernate xin id từ sequence **trước** khi INSERT, nên có thể giữ các INSERT lại rồi gửi theo batch lúc flush.

Nếu mỗi id lại gọi {{nextval}} một lần thì vẫn tốn round-trip. **Pooled optimizer** giải quyết: sequence được tạo với {{INCREMENT BY 50}}, mỗi lần gọi {{nextval}} Hibernate nhận về một con số và tự suy ra một khối 50 id để phát trong RAM. {{allocationSize}} trong {{@SequenceGenerator}} (mặc định **50**) phải khớp với INCREMENT của sequence; Hibernate mặc định kiểm tra lúc khởi động và báo lỗi nếu lệch (cấu hình {{hibernate.id.sequence.increment_size_mismatch_strategy}}).

~~~java
@Id
@GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "order_seq")
@SequenceGenerator(name = "order_seq", sequenceName = "order_seq", allocationSize = 50)
private Long id;   // 1 round-trip nextval cho mỗi 50 id
~~~

~~~text
allocationSize = 3:
nextId() → 1  (round-trip #1: xin khối 1..3)
nextId() → 2  (trong RAM)
nextId() → 3  (trong RAM)
nextId() → 4  (round-trip #2: xin khối 4..6)
~~~

| Strategy | Có id khi nào | Batch insert |
|---|---|---|
| IDENTITY | sau khi INSERT chạy | Hibernate tắt batch insert |
| SEQUENCE (pooled) | trước INSERT, theo khối allocationSize | batch được |
| TABLE | trước INSERT nhưng dùng bảng + lock | chậm, tránh dùng |

**Gap là bình thường**: process dừng giữa khối thì các id chưa dùng bị bỏ qua; rollback cũng không trả lại id. Nhiều instance cùng dùng một sequence nhận các khối khác nhau nên id không trùng, nhưng thứ tự id không phản ánh thứ tự thời gian. Đừng dùng id làm số hoá đơn liên tục hay làm timestamp.

### Flush, clear và chunk
Import lớn: persist theo chunk bằng đúng batch size, mỗi chunk gọi {{flush()}} (gửi batch) rồi {{clear()}} (giải phóng entity khỏi persistence context để không tốn RAM và không làm chậm dirty checking). Clear trước flush sẽ làm mất các INSERT chưa gửi.

~~~java
for (int i = 0; i < rows.size(); i++) {
    em.persist(toEntity(rows.get(i)));
    if ((i + 1) % 50 == 0) { em.flush(); em.clear(); } // 50 = hibernate.jdbc.batch_size
}
~~~

Spring Data {{saveAll()}} chỉ lặp {{save()}} từng phần tử; nó **không** tự bật batch. Batch có xảy ra hay không vẫn do cấu hình ở trên và generator quyết định.

### Production
- Xác minh batch thật sự xảy ra: bật {{hibernate.generate_statistics}} (có dòng "executing N JDBC batches") hoặc log của driver/proxy DataSource. Mapping, cascade hay thứ tự INSERT xen kẽ nhiều bảng có thể khiến batch không được tạo dù đã cấu hình.
- Batch quá lớn giữ transaction lâu, tốn heap và rollback đắt; quá nhỏ không giảm đáng kể round-trip. 20–100 thường là điểm khởi đầu, rồi đo.
- Với bulk load rất lớn, cân nhắc bỏ qua ORM: {{JdbcTemplate.batchUpdate}} hoặc lệnh {{COPY}} của PostgreSQL.

### Liên hệ phỏng vấn
Nêu: SEQUENCE có id trước INSERT nên batch được, IDENTITY cần kết quả INSERT nên Hibernate tắt batch insert. Giải thích allocationSize (khối id, giảm round-trip, phải khớp INCREMENT), gap là chấp nhận được, flush/clear theo chunk, và cách xác minh batch bằng statistics.`,
 exercises:[{title:'Sequence id pool',prompt:`Mô phỏng pooled optimizer. {{IdPool(allocationSize)}}:
- {{allocationSize}} phải dương, nếu không ném {{IllegalArgumentException}}.
- {{nextId()}} trả id tăng dần bắt đầu từ 1. Khi khối hiện tại đã hết (hoặc lần gọi đầu tiên), "xin" khối mới: tăng bộ đếm round-trip thêm 1.
- {{roundTrips()}} trả số lần đã xin khối.`,
 starter:`class IdPool{IdPool(int n){}long nextId(){throw new UnsupportedOperationException("TODO");}int roundTrips(){throw new UnsupportedOperationException("TODO");}}`,
 tests:`public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }
    public static void main(String[] args) {
        IdPool p = new IdPool(3);
        long first = p.nextId();
        check("first id is 1 and costs one round-trip", first == 1 && p.roundTrips() == 1, "id=" + first + ", roundTrips=" + p.roundTrips());
        long second = p.nextId();
        check("same block needs no round-trip", second == 2 && p.roundTrips() == 1, "id=" + second + ", roundTrips=" + p.roundTrips());
        long third = p.nextId();
        check("block end", third == 3 && p.roundTrips() == 1, "id=" + third + ", roundTrips=" + p.roundTrips());
        long fourth = p.nextId();
        check("next block", fourth == 4 && p.roundTrips() == 2, "id=" + fourth + ", roundTrips=" + p.roundTrips());
        IdPool big = new IdPool(50);
        long last = 0;
        for (int i = 0; i < 120; i++) last = big.nextId();
        check("120 ids with allocationSize 50", last == 120 && big.roundTrips() == 3, "last=" + last + ", roundTrips=" + big.roundTrips());
        IdPool q = new IdPool(1);
        long q1 = q.nextId(), q2 = q.nextId();
        check("size one: round-trip per id", q1 == 1 && q2 == 2 && q.roundTrips() == 2, "ids=" + q1 + "," + q2 + ", roundTrips=" + q.roundTrips());
        boolean bad = false;
        try { new IdPool(0); } catch (IllegalArgumentException e) { bad = true; }
        check("reject non-positive size", bad, "IdPool(0) phải ném IllegalArgumentException");
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
 reference:`class IdPool{int size,remaining=0,roundTrips=0;long next=1;
    IdPool(int n){if(n<=0)throw new IllegalArgumentException("allocationSize must be > 0");size=n;}
    long nextId(){
        if(remaining==0){remaining=size;roundTrips++;}   // hết khối: xin khối mới (1 round-trip)
        remaining--;                                     // phát id trong RAM
        return next++;
    }
    int roundTrips(){return roundTrips;}
}`,
 hints:['Giữ remaining = số id còn lại trong khối; ban đầu là 0 nên lần gọi đầu tiên sẽ xin khối.','Khi remaining bằng 0: đặt remaining = size và tăng roundTrips.','Mỗi lần phát id: giảm remaining, trả next rồi tăng next.'],
 explain:`Mô hình tách hai việc: **xin khối** (tốn round-trip tới database) và **phát id** (chỉ trong RAM). Với allocationSize 50, 120 id chỉ cần 3 round-trip thay vì 120.

Lỗi hay gặp: tăng roundTrips ở mọi lần gọi, hoặc khởi tạo remaining = size trong constructor mà không đếm round-trip đầu tiên. Ngoài đời, nếu process dừng khi khối còn dư thì các id đó bị bỏ (gap); điều này không làm khoá chính sai, chỉ làm dãy id không liên tục.`,
 }],check:[{q:'Vì sao SEQUENCE hỗ trợ batch insert tốt hơn IDENTITY?',options:['SEQUENCE không cần id','SEQUENCE đảm bảo id liên tục, không có gap','SEQUENCE không cần bất kỳ round-trip nào','Có id trước khi INSERT, nên Hibernate có thể hoãn và gom INSERT'],answer:3,explain:`Biết id trước cho phép đưa entity vào persistence context mà chưa INSERT, rồi gửi theo batch lúc flush. Entity vẫn cần id. SEQUENCE vẫn có round-trip xin khối (giảm nhờ allocationSize) và vẫn có gap khi process dừng hoặc rollback.`},{q:'{{hibernate.jdbc.batch_size=50}} có nghĩa là gì?',options:['Gom tối đa 50 lệnh JDBC cùng dạng SQL liên tiếp vào một lần gửi','Mọi entity được ghi bằng đúng một câu SQL','Tạo 50 sequence','Cho phép 50 transaction đồng thời'],answer:0,explain:`Batch gom các lệnh JDBC cùng câu SQL (vì vậy cần order_inserts khi xen kẽ nhiều bảng) để giảm round-trip; vẫn là nhiều lệnh, trừ khi driver rewrite thành INSERT nhiều dòng. Nó không liên quan đến số sequence hay số transaction đồng thời.`},{q:'Entity dùng {{GenerationType.IDENTITY}}, đã cấu hình batch_size=50, gọi saveAll 1.000 entity. Điều gì xảy ra?',options:['10 batch INSERT, mỗi batch 100 dòng','20 batch INSERT, mỗi batch 50 dòng','Khoảng 1.000 INSERT gửi riêng lẻ, vì Hibernate tắt batch insert với IDENTITY','Lỗi khởi động vì IDENTITY không tương thích batch_size'],answer:2,explain:`Hibernate cần id ngay khi persist nên phải chạy từng INSERT để lấy generated key; batch insert bị tắt một cách âm thầm, không có lỗi khởi động. Muốn 20 batch × 50 dòng thì phải chuyển sang SEQUENCE. Con số 100 dòng/batch không khớp cấu hình nào.`}],tags:['batch insert','IDENTITY','SEQUENCE']
}
);
