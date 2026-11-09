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

### Cơ chế từng bước: từ read đến commit
Khi một transaction đọc entity có {{@Version}}, Hibernate làm các bước sau. Hiểu từng bước để thấy tại sao optimistic locking chỉ "kiểm tra lúc ghi":

1. **SELECT**: Hibernate SELECT các cột của entity, trong đó có cột {{version}}. Nó lưu giá trị này vào **snapshot** bên trong persistence context — giống bài học persistence context, snapshot là bản sao giá trị, không phải tham chiếu.
2. **Sửa trong RAM**: bạn gọi setter trên entity managed. Chỉ đổi object Java, không phát sinh SQL. Snapshot vẫn giữ giá trị cũ.
3. **Flush**: trước commit, Hibernate so field hiện tại với snapshot. Entity nào khác thì sinh UPDATE.
4. **UPDATE có điều kiện version**: câu UPDATE sinh ra là {{UPDATE product SET stock = ?, version = ? WHERE id = ? AND version = ?}}. Câu này là **compare-and-set** nguyên tử: database kiểm tra xem version trong DB có vẫn là lúc đọc không, nếu không thì ảnh hưởng 0 hàng.
5. **Kết quả**: ảnh hưởng 1 hàng → commit thành công, version tăng. Ảnh hưởng 0 hàng → Hibernate ném {{StaleObjectStateException}}, JPA bọc thành {{OptimisticLockException}}, Spring dịch thành {{ObjectOptimisticLockingFailureException}}.

Vì sao phải làm như vậy? Vì optimistic locking **không giữ lock** trong lúc người dùng suy nghĩ hay lúc tính toán (khác với pessimistic lock giữ lock suốt). Nó chỉ "tin tưởng" và phát hiện xung đột lúc ghi. Ưu điểm: không gây blocking, không deadlock, phù hợp với đọc nhiều ghi ít. Nhược điểm: phải retry hoặc trả 409 khi conflict.

~~~java
// Tóm tắt flow: read → modify → flush → UPDATE WHERE version=? → 0 row → exception
@Entity
class Product {
    @Id Long id;
    int stock;
    @Version int version;  // Hibernate tự tăng, ứng dụng không tự ghi
}

// 1. Đọc: SELECT id, stock, version FROM product WHERE id = ?
//    → snapshot = {stock: 10, version: 4}
// 2. Sửa: product.setStock(7);  // chỉ RAM
// 3. Flush: UPDATE product SET stock=7, version=5 WHERE id=? AND version=4
// 4. Nếu version DB vẫn là 4 → 1 row → thành công
//    Nếu version DB đã là 5 → 0 row → StaleObjectStateException
~~~

### Lỗi hay gặp trên production
- **Gọi merge trên entity detached mà không kiểm tra version**: khi merge, Hibernate so version của object bạn truyền vào với DB. Nếu object có version cũ hơn DB, merge cũng từ chối bằng OptimisticLockException. Đây là bẫy khi mở form web lâu (10 phút), người dùng sửa xong rồi submit: entity đã bị thay đổi bởi người khác. Không retry thì trả về 500 thay vì 409.
- **Bulk UPDATE không tự tăng version**: {{@Modifying}} JPQL chạy thẳng xuống database, bỏ qua entity, nên version không tăng. Các transaction khác đang giữ bản cũ sẽ ghi overwrite mà không bị phát hiện. Phải tự ghi {{SET version = version + 1}} hoặc dùng HQL {{UPDATE VERSIONED}}.
- **Retry trong cùng transaction**: bắt exception rồi thử lại trong method {{@Transactional}} là sai, vì transaction đã bị rollback-only. Retry phải ở lớp ngoài, mỗi lần là một transaction mới.
- **Dùng {{@Version}} cho hàng nóng (bộ đếm mọi request)**: optimistic locking không hợp, vì conflict suất cao. Dùng UPDATE nguyên tử {{SET stock = stock - 1 WHERE stock > 0}} hoặc pessimistic lock.

### Liên hệ phỏng vấn
1. **"Lost update là gì, và @Version ngăn chặn nó như thế nào?"** — Trả lời: hai transaction đọc cùng version, sửa khác nhau, ghi đè lẫn nhau. @Version thêm điều kiện {{WHERE version = ?}} vào UPDATE; transaction sau thấy 0 row affected → ném OptimisticLockException.
2. **"Retry sau OptimisticLockException phải làm gì?"** — Trả lời: mở transaction **mới**, đọc lại entity (version mới), áp dụng lại **ý định** (ví dụ cộng 5), không ghi lại kết quả cũ. Giới hạn 3 lần, có backoff. Không retry trong cùng transaction (đã rollback-only).
3. **"Khi nào chọn pessimistic lock thay vì @Version?"** — Trả lời: tranh chấp cao trên ít hàng nóng (bộ đếm, seat booking), đoạn xử lý ngắn. @Version phù hợp đọc nhiều ghi ít, form web mở lâu. Pessimistic giữ lock DB, có thể deadlock, timeout.`,
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
 }],check:[{q:'Retry sau khi gặp {{OptimisticLockException}} nên làm gì?',options:['Gửi lại UPDATE với version cũ','Đọc state mới trong transaction mới rồi áp dụng lại ý định, giới hạn số lần','Xoá cột version để hết lỗi','Bắt exception rồi tiếp tục trong cùng transaction, retry đến khi thành công'],answer:1,explain:`Version cũ chắc chắn tiếp tục thất bại. Transaction hiện tại đã bị đánh dấu rollback-only nên không thể tiếp tục trong nó, và retry vô hạn khuếch đại tải. Xoá version thì quay lại lost update. Cách đúng là transaction mới, đọc lại, áp dụng lại ý định, có giới hạn.`},{q:'{{@Query("UPDATE Product p SET p.stock = 0") @Modifying}} có tự tăng {{@Version}} không?',options:['Có, Hibernate luôn tăng version','Chỉ trên PostgreSQL','Có, nếu retry','Không; bulk JPQL bỏ qua entity, phải tự SET version = version + 1 (hoặc UPDATE VERSIONED trong HQL) và clear context'],answer:3,explain:`Bulk DML chạy thẳng xuống database, không qua entity managed nên không có cơ chế version tự động. Hành vi này không phụ thuộc loại database, và retry không liên quan. Nếu không tự tăng version, các transaction đang giữ bản cũ sẽ ghi đè mà không bị phát hiện.`},{q:'Khi nào pessimistic lock ({{SELECT ... FOR UPDATE}}) hợp hơn @Version?',options:['Khi một vài hàng bị rất nhiều request cùng sửa và đoạn xử lý ngắn','Khi người dùng mở form sửa trong 10 phút','Khi xung đột cực hiếm','Khi muốn tránh hoàn toàn deadlock'],answer:0,explain:`Tranh chấp cao trên hàng nóng làm optimistic liên tục fail và retry; khoá ngắn sẽ hiệu quả hơn. Form mở 10 phút mà giữ lock DB thì chặn người khác suốt thời gian đó, nên optimistic hợp hơn. Xung đột hiếm cũng là đất của optimistic. Pessimistic lock còn **có thể** gây deadlock chứ không tránh được.`},{q:'Entity dùng {{@Version int version}}; transaction A đọc version=5, transaction B đọc version=5. A commit thành công (version=6). B sửa field khác rồi commit. Điều gì xảy ra?',options:['B commit thành công vì sửa field khác','B bị OptimisticLockException vì version đã thay đổi','Hibernate tự merge field của A và B','B ghi đè version=6 thành version=5'],answer:1,explain:`@Version bảo vệ **toàn bộ hàng**, không phải từng field. B sửa field nào cũng không quan trọng; version lúc đọc là 5, lúc flush DB đã là 6 → UPDATE ... WHERE version=5 ảnh hưởng 0 hàng → OptimisticLockException. Đây là thiết kế: bất kỳ thay đổi nào trên hàng cũng được coi là conflict.`}],tags:['@Version','optimistic locking','retry']
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

### Cơ chế từng bước: proxy và persistent collection hoạt động thế nào
Khi association là {{LAZY}}, Hibernate không đọc nó lúc load entity. Hiểu từng bước để thấy tại sao việc này lại là "lazy":

1. **Load parent**: Hibernate SELECT các cột của entity cha (ví dụ {{SELECT * FROM orders WHERE id = ?}}). Kết quả là một entity managed, nằm trong persistence context.
2. **Tạo proxy/collection**: field association không được điền dữ liệu:
   - với to-one ({{@ManyToOne Customer customer}}): Hibernate tạo một **proxy**, là subclass do Hibernate sinh ra lúc chạy, mới chỉ biết {{id}}. Proxy này implement Customer, nhưng mọi field đều là "chưa tải".
   - với collection ({{@OneToMany List<Line> lines}}): field chứa một **persistent collection** (ví dụ {{PersistentBag}}) chưa có phần tử. Collection này biết nó "chưa tải".
3. **Chạm để tải**: lần đầu bạn gọi {{customer.getName()}} hoặc {{lines.size()}}:
- proxy to-one: Hibernate kiểm tra xem Session có đang attached không. Nếu có, chạy {{SELECT * FROM customer WHERE id = ?}} (nếu cần), điền field, proxy trở thành entity thật.
- collection: Hibernate chạy {{SELECT * FROM order_line WHERE order_id = ?}}, điền vào collection.
   - Các lần sau: đọc từ bộ nhớ (cache trong persistence context).
4. **Session đóng**: khi transaction kết thúc, Session được đóng. Nếu dữ liệu chưa được tải (chưa bước 3), proxy không còn connection hay persistence context để chạy query, Hibernate ném {{LazyInitializationException}}.

Vì sao thiết kế như vậy? Lazy loading giúp **tiết kiệm SQL và RAM** khi association không cần thiết: với 80 order, nếu không lazy, Hibernate phải tải lines cho cả 80 order ngay khi load order list. Lazy chỉ tải khi thực sự cần. Nhược điểm: phải có Session mở khi truy cập, và dễ N+1 nếu lặp qua collection.

Lưu ý quan trọng: gọi {{getId()}} trên proxy to-one **không** gây query vì proxy đã biết id (id được lưu trong proxy). Chỉ các getter của field khác mới gây query.

### Lỗi hay gặp trên production
- **Trả entity thẳng từ controller ra view**: Jackson serialize entity, gọi mọi getter, chạm vào collection lazy sau khi transaction đã đóng → LazyInitializationException. Đây là lỗi phổ biến nhất. Sửa bằng cách map sang DTO trong service khi Session còn mở.
- **OSIV che lỗi nhưng chuyển tải sang tầng web**: Spring Boot bật OSIV ({{spring.jpa.open-in-view=true}}) nên lazy loading trong controller "chạy được". Cái giá: query phát sinh ngầm ở tầng web, connection database bị giữ suốt thời gian request (gồm cả serialize), làm cạn connection pool khi tải cao. Đặt {{spring.jpa.open-in-view=false}} để lỗi lộ ra sớm.
- **{{toString()}}/{{equals}}/{{hashCode}} (hoặc Lombok {{@Data}}) chạm vào association lazy**: khi ghi log, Hibernate gọi toString, nó chạm vào collection lazy → query hoặc exception ở chỗ không chờ đợi. Dùng {{@Data}} với entity có collection lazy là bẫy phổ biến.
- **Integration test che lỗi**: test chạy trong {{@Transactional}} bao trùm có thể che lỗi vì Session luôn mở. Có test gọi service rồi kiểm tra DTO **sau khi** transaction đã đóng để bắt được LazyInitializationException.

### Liên hệ phỏng vấn
Giải thích proxy cần Session để tải, vì sao lỗi xảy ra sau khi transaction đóng, vì sao EAGER và OSIV chỉ che triệu chứng. Đề xuất: mọi association LAZY, fetch plan theo use case, map DTO trong service, tắt OSIV.
1. **"LazyInitializationException xảy ra vì sao, và cách nào tránh nó?"** — Trả lời: proxy/collection cần Session để tải; khi transaction đóng, Session bị đóng, proxy không thể chạy query → exception. Tránh bằng cách: mọi association LAZY, tải đúng association cần (fetch join/EntityGraph) trong service khi Session còn mở, map sang DTO trước khi transaction đóng, và đặt {{spring.jpa.open-in-view=false}} để lỗi lộ ra sớm.
2. **"EAGER có phải lời giải cho N+1 hay không?"** — Trả lời: Không. EAGER chỉ đảm bảo association có sẵn khi entity được tải, không đảm bảo một câu JOIN: với JPQL, Hibernate thường chạy thêm query cho từng entity (vẫn N+1). EAGER còn áp dụng ở mọi nơi, kể cả màn hình không cần dữ liệu đó, và không thể tắt theo từng query. Dùng LAZY + fetch plan theo use case thay thế.
3. **"Open Session in View là gì, và bạn có dùng nó không?"** — Trả lời: OSIV giữ EntityManager mở đến khi render xong response, giúp lazy loading trong controller "chạy được". Cái giá: query phát sinh ngầm ở tầng web, connection bị giữ lâu, dễ N+1 và cạn connection pool. Ở Senior, tôi thường đặt {{spring.jpa.open-in-view=false}} để lỗi lộ ra sớm ở ranh giới service, và tự kiểm soát fetch plan.

### @EntityGraph: fetch plan khai báo
{{@EntityGraph}} cho phép tách fetch plan ra khỏi query JPQL, tái dùng được cho nhiều method repository:
~~~java
@Entity
@NamedEntityGraph(name = "Order.withLines", attributeNodes = @NamedAttributeNode("lines"))
class Order { @Id Long id; @OneToMany List<Line> lines; }

interface OrderRepo extends JpaRepository<Order, Long> {
    @EntityGraph("Order.withLines")
    Optional<Order> findWithLines(Long id);
}
~~~
Có hai dạng: **NamedEntityGraph** (định nghĩa trên entity, dùng tên) và **ad-hoc** ({{@EntityGraph(attributePaths = "lines")}} ngay trên method). {{attributePaths}} hỗ trợ đường dẫn chấm: {{"lines.product.category"}}.

### Lỗi production mở rộng
- **Proxy lọt vào log/serialization**: {{toString()}} của Lombok {{@Data}} gọi getter collection → LazyInitializationException hoặc N+1 trong log. Dùng {{@ToString(exclude = "lines")}} hoặc record DTO.
- **Fetch join collection + pagination**: JOIN nhân dòng, LIMIT cắt giữa collection. Hibernate 6 tải hết vào RAM rồi cắt, in cảnh báo HHH90003004. Bật {{hibernate.query.fail_on_pagination_over_collection_fetch=true}} để biến cảnh báo thành exception ngay khi test.

### Kiểm thử LazyInitializationException
Viết integration test **không** có {{@Transactional}} trên method test:
~~~java
@Test
void detail_returnsDtoWithoutLazyError() {
    OrderDto dto = service.detail(1L);
    assertThat(dto.lines()).hasSize(3);
}
~~~
Nếu test có {{@Transactional}}, Session mở suốt test → lazy "chạy được" → bug lọt production. Tắt OSIV ({{spring.jpa.open-in-view=false}}) ở test config để bắt lỗi sớm.
`,exercises:[{title:'Lazy proxy và session',prompt:`Mô phỏng một persistent collection lazy. {{LazyLines}} nhận một {{Supplier}} đóng vai trò câu SELECT:
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
 }],check:[{q:'{{FetchType.EAGER}} có đảm bảo Hibernate dùng một câu JOIN không?',options:['Có, luôn luôn','Có, nhưng chỉ với collection','Không; nó chỉ đảm bảo dữ liệu có sẵn, Hibernate có thể chạy thêm query (ví dụ với JPQL)','EAGER không phát SQL nào'],answer:2,explain:`EAGER nói về **thời điểm** (có sẵn ngay), không nói về **cách** lấy (SQL shape). Với JPQL, query chính chỉ đọc bảng gốc, nên Hibernate phải chạy query phụ cho association EAGER, thường là N+1. Không có ngoại lệ "chỉ với collection", và tất nhiên EAGER vẫn phải phát SQL để lấy dữ liệu.`},{q:'Cách nào ngăn tầng web (Jackson) gây lazy query hoặc LazyInitializationException?',options:['Trả entity nguyên trạng và bật OSIV','Trong service, tải đúng association cần (fetch join/EntityGraph) rồi map sang DTO trước khi transaction đóng','Đổi toàn bộ association sang EAGER','Bật hibernate.enable_lazy_load_no_trans'],answer:1,explain:`DTO tạo ranh giới dữ liệu rõ ràng: web không thấy proxy nào. OSIV làm lỗi "biến mất" nhưng chuyển query sang tầng web và giữ connection lâu. EAGER tải thừa ở mọi nơi và vẫn có thể N+1. enable_lazy_load_no_trans mở session tạm cho mỗi lần lazy load, che lỗi và sinh N+1 âm thầm.`},{q:'Gọi {{getId()}} trên một proxy to-one ({{@ManyToOne}}) khi Session đã đóng. Điều gì xảy ra?',options:['Ném LazyInitializationException','Trả về id mà không phát sinh query, vì proxy đã biết id','Chạy SELECT để lấy id rồi trả về','Trả về null'],answer:1,explain:`Khi Hibernate tạo proxy cho to-one, nó đã biết id (lưu trong proxy). {{getId()}} chỉ đọc field này, không cần Session hay query. Chỉ các getter của field khác (ví dụ {{getName()}}) mới gây query hoặc exception khi Session đã đóng. LazyInitializationException chỉ xảy ra khi cần tải dữ liệu.`},{q:'Fetch join một collection {{@OneToMany}} kèm {{Pageable}} (phân trang 20/trang). Hibernate 6 xử lý thế nào?',options:['Tải toàn bộ kết quả rồi cắt trang trong RAM, chỉ in cảnh báo (trừ khi bật fail_on_pagination_over_collection_fetch)','Đưa LIMIT 20 xuống SQL và luôn trả đúng 20 parent đầy đủ children','Tự tách thành hai query: phân trang parent rồi tải children','Ném lỗi biên dịch JPQL'],answer:0,explain:`JOIN nhân dòng theo số child, nên LIMIT ở SQL sẽ cắt giữa collection. Hibernate vì vậy phân trang trong RAM và cảnh báo HHH90003004, rất nguy hiểm với bảng lớn. Nó không tự tách thành hai query (đó là việc bạn phải làm), và JPQL vẫn hợp lệ nên không có lỗi biên dịch.`}],tags:['LAZY','EAGER','proxy','OSIV']
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
},
{
 id:'lesson-jpa-006',track:'jpa',order:6,title:'Owning side, cascade và orphanRemoval trong quan hệ hai chiều',level:'senior',minutes:30,
 goals:['Phân biệt owning side và inverse side, biết phía nào quyết định giá trị khóa ngoại lúc flush','Viết helper addLine và removeLine giữ cho hai phía của quan hệ luôn khớp nhau','Dùng đúng cascade PERSIST, cascade REMOVE và orphanRemoval; nhận ra REMOVE trên quan hệ ManyToOne là lỗi mất dữ liệu','Nêu được chi phí thật của orphanRemoval: Hibernate phải tải cả collection lên để so sánh'],
 body:`### Hiểu nhanh: quan hệ hai chiều cần một phía làm chủ
Order và OrderLine trỏ lẫn nhau bằng hai field:
- phía cha: {{@OneToMany(mappedBy = "order") List<OrderLine> lines}} — danh sách dòng của đơn;
- phía con: {{@ManyToOne @JoinColumn(name = "order_id") Order order}} — field trỏ về đơn.

{{mappedBy}} nói với Hibernate: "phía này chỉ để đọc, giá trị thật lấy từ field tên order ở class kia". Phía có {{@JoinColumn}} (OrderLine) gọi là **owning side** — chủ sở hữu quan hệ, vì cột khóa ngoại nằm trên bảng của nó. Phía {{mappedBy}} là **inverse side** (phía phụ, phía ngược).

Lý do nằm ở database: liên kết chỉ có MỘT chỗ để cất, là cột {{order_line.order_id}}. Khi flush, Hibernate chỉ đọc con trỏ trên **owning side** để quyết định ghi gì xuống; thay đổi ở collection phía inverse tự nó không sinh ra câu SQL nào.

### Bẫy kinh điển: chỉ set phía inverse thì FK vẫn null
~~~java
order.getLines().add(line);   // inverse side: chỉ đổi collection trong RAM -> KHONG có UPDATE
line.setOrder(order);         // owning side: đây mới là nơi Hibernate nhìn vào lúc flush
~~~
Hibernate **không** tự gọi {{line.setOrder(order)}} hộ bạn. Thêm vào collection mà quên set owning side thì row của line vẫn được INSERT (nhờ cascade PERSIST) nhưng {{order_id}} mang null — đơn hàng "mồ côi" không truy vấn được. Lỗi này qua mặt code review vì test với một đơn nhỏ vẫn chạy, chỉ lộ ra khi cần SELECT "lines của đơn 42".

Helper đặt trên aggregate root là bắt buộc khi map quan hệ hai chiều:
~~~java
class Order {
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private final List<OrderLine> lines = new ArrayList<>();

    public void addLine(OrderLine l) {
        lines.add(l);
        l.setOrder(this);       // luôn đổi CẢ HAI phía trong một lần gọi
    }
    public void removeLine(OrderLine l) {
        lines.remove(l);
        l.setOrder(null);       // để orphanRemoval nhìn thấy "không còn chủ"
    }
}
~~~

> Nếu muốn giữ bất biến của aggregate, đừng trả collection gốc từ getter. Trả {{List.copyOf(lines)}} hoặc collection wrap {{Collections.unmodifiableList}}, và bắt mọi thay đổi đi qua addLine/removeLine.

### Cascade: thao tác nào được "nhân bản" xuống con
{{em.persist(order)}} chỉ ghi bảng orders; nếu chưa bật cascade, Hibernate báo "entity not persistent" khi gặp line ở state new. {{cascade = PERSIST}} bảo nó persist luôn các line trong collection.

~~~seq
title: Luu don hang co hai chi tiet
actors: App | Hibernate | DB
App -> Hibernate: persist order, addLine x2
Hibernate -> Hibernate: cascade PERSIST cac line
Hibernate -> DB: INSERT orders(id)=1
Hibernate -> DB: INSERT order_line 10, sku A
Hibernate -> DB: UPDATE order_line 10 set FK=1
DB --> Hibernate: ok
Hibernate --> App: commit xong
~~~

Thứ tự SQL ở trên là mặc định: INSERT cha, INSERT con, rồi ghi FK lấy từ owning side. Hiểu thứ tự này giúp bạn đọc log SQL khi nghi vấn thiếu liên kết.

| Cascade | Ý nghĩa | Khi nào dùng |
|---|---|---|
| {{PERSIST}} | lưu cha thì lưu con | {{@OneToMany}} của aggregate, dòng luôn đi cùng đơn |
| {{MERGE}} | merge cha thì merge con | dùng kèm PERSIST khi nhận DTO từ tầng web |
| {{REMOVE}} | xóa cha thì xóa con | chỉ khi con không tồn tại độc lập |
| {{ALL}} | gộp mọi loại | nên tránh, quá rộng |

**{{cascade = REMOVE}} trên {{@ManyToOne}} là bug mất dữ liệu kinh điển.** {{@ManyToOne Customer customer}} trên Order chỉ có nghĩa "đơn thuộc về khách", nhưng Customer là dữ liệu dùng chung: thêm cascade REMOVE thì {{em.remove(order)}} xóa **luôn cả khách hàng**, trong khi khách còn bao đơn khác. Quy tắc: cascade REMOVE và orphanRemoval chỉ dành cho quan hệ "cha sở hữu con" (Order → OrderLine). Liên kết trỏ tới dữ liệu dùng chung (Customer, Product, Catalog) thì không bao giờ cascade REMOVE.

Với {{@ManyToMany}} (Student–Course), "hủy đăng ký" chỉ là gỡ **dòng trong bảng join**, không xóa Course; muốn vậy gọi {{student.getCourses().clear()}} trên owning side. {{orphanRemoval}} không tồn tại trên {{@ManyToMany}}.

### orphanRemoval khác cascade REMOVE ở chỗ nào
- {{orphanRemoval = true}} trên {{@OneToMany}}: khi một line bị **gỡ khỏi collection** và không còn ai trỏ tới, Hibernate DELETE row của nó. Đây là cách "xóa dòng khỏi đơn", không phải cách "xóa đơn".
- {{cascade = REMOVE}}: khi bạn gọi {{em.remove(order)}}, toàn bộ line bị xóa theo.

Khác nhau ở **người khởi xướng**: gỡ khỏi collection (orphan) hay xóa entity cha (cascade). Trên thực tế hai cái thường đi cùng nhau: REMOVE để dọn khi xóa đơn, orphanRemoval để dọn khi sửa đơn.

### Lỗi production hay gặp
- **{{lines.clear()}} không xóa row** nếu thiếu {{orphanRemoval}}: Hibernate chỉ bỏ tham chiếu trong RAM, row con vẫn nằm lại database với FK cũ.
- **Xóa con hàng loạt là một dạng N+1**: để biết dòng nào thành orphan, Hibernate phải **tải cả collection** lên và so với snapshot lưu lúc load. Gỡ 100.000 dòng theo cách này là đưa 100.000 row về RAM rồi so từng cái. Muốn nhanh thì dùng bulk {{DELETE FROM order_line WHERE order_id = 1}}, nhưng nó bỏ qua persistence context (entity managed giữ giá trị cũ) và phải xóa con **trước** khi xóa cha nếu FK bắt buộc.
- **{{equals}}/{{hashCode}} dựa trên field nghiệp vụ**: collection là {{Set}}, đổi sku của một dòng khiến nó "không còn là phần tử đó", {{remove}} trả false và dòng không bị xóa. Chuẩn an toàn: so theo id, hoặc dùng {{List}} nếu thứ tự có nghĩa.
- **{{cascade = ALL}} với quan hệ hai chiều** có thể gây vòng lặp merge vô hạn khi entity A và B cùng cascade sang nhau.
- **Quên set owning side khi di chuyển con**: con nằm trong collection của cha mới nhưng FK vẫn chỉ cha cũ, vì bạn sửa phía inverse.

### Liên hệ phỏng vấn
Câu hay hỏi: "Vì sao thêm vào collection mà khóa ngoại vẫn null?" Trả lời: phía {{mappedBy}} là inverse, Hibernate chỉ đọc owning side lúc flush, nên phải có helper set cả hai phía. Nói tiếp: cascade PERSIST để lưu con, orphanRemoval để xóa khi gỡ khỏi collection, cascade REMOVE để dọn khi xóa cha; điểm cộng lớn là nêu được vì sao REMOVE trên {{@ManyToOne}} nguy hiểm và vì sao orphanRemoval kéo theo chi phí tải cả collection.`,
 exercises:[{title:'Flush sinh SQL theo owning side và cascade',prompt:`Mô phỏng việc Hibernate sinh SQL từ **owning side**. Cho sẵn {{Order}} (có {{lines}}) và {{Line}} (có field {{order}}, phía owning). Cài {{Graph}}:
- {{persist(order)}}: đăng ký order vào session; gọi lặp lại không sao.
- {{addLine(order, line)}}: helper hai chiều — thêm line vào {{order.lines}} (nếu chưa có) VÀ gán {{line.order = order}}.
- {{removeLine(order, line)}}: gỡ line khỏi collection và đặt {{line.order = null}} (mô phỏng {{orphanRemoval = true}}).
- {{remove(order)}}: đánh dấu order bị xóa (mô phỏng {{cascade = REMOVE}} truyền xuống lines).
- {{flush()}}: trả về danh sách câu SQL theo đúng thứ tự sinh ra; sau flush trạng thái coi như đã đồng bộ nên flush lại không lặp câu nào. Quy tắc:
1. order đang managed và chưa bị xóa: nếu chưa từng INSERT thì {{INSERT INTO orders(id) VALUES(<id>)}}.
2. theo thứ tự {{order.lines}}: line chưa từng INSERT thì {{INSERT INTO order_line(id,sku) VALUES(<id>,'<sku>')}} — line được lưu kể cả khi {{line.order}} không trỏ về cha, vì đó là cascade PERSIST.
3. khóa ngoại lấy từ owning side: chỉ khi {{line.order == order}} và giá trị {{order_id}} này khác với lần ghi gần nhất của line thì {{UPDATE order_line SET order_id=<oid> WHERE id=<lid>}}.
4. line đã có row mà bị gỡ khỏi collection ({{removeLine}}) thì {{DELETE FROM order_line WHERE id=<lid>}}, đúng một lần.
5. order bị {{remove}}: với từng line còn trỏ về nó và đã có row thì {{DELETE FROM order_line WHERE id=<lid>}} (theo thứ tự collection), sau đó {{DELETE FROM orders WHERE id=<oid>}}; entity chưa từng INSERT thì không sinh câu DELETE nào.`,
 starter:`class Order { long id; List<Line> lines = new ArrayList<>(); Order(long i) { id = i; } }
class Line { long id; String sku; Order order; Line(long i, String s) { id = i; sku = s; } }
class Graph {
    void persist(Order o) { throw new UnsupportedOperationException("TODO"); }
    void addLine(Order o, Line l) { throw new UnsupportedOperationException("TODO"); }
    void removeLine(Order o, Line l) { throw new UnsupportedOperationException("TODO"); }
    void remove(Order o) { throw new UnsupportedOperationException("TODO"); }
    List<String> flush() { throw new UnsupportedOperationException("TODO"); }
}`,
 tests:`public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }
    public static void main(String[] args) {
        Order o1 = new Order(1);
        Graph g1 = new Graph();
        g1.persist(o1);
        Line l1 = new Line(10, "A");
        g1.addLine(o1, l1);
        String[] want1 = {
            "INSERT INTO orders(id) VALUES(1)",
            "INSERT INTO order_line(id,sku) VALUES(10,'A')",
            "UPDATE order_line SET order_id=1 WHERE id=10",
        };
        List<String> s1 = g1.flush();
        check("owning side writes the FK", Arrays.equals(want1, s1.toArray()), "sql = " + s1);
        check("helper keeps both sides", l1.order == o1 && o1.lines.contains(l1), "thiếu một trong hai phía của liên kết");
        List<String> s2 = g1.flush();
        check("flush twice is clean", s2.isEmpty(), "sql = " + s2);

        Order o2 = new Order(2);
        Graph g2 = new Graph();
        g2.persist(o2);
        Line l2 = new Line(20, "B");
        o2.lines.add(l2);
        String[] want3 = {
            "INSERT INTO orders(id) VALUES(2)",
            "INSERT INTO order_line(id,sku) VALUES(20,'B')",
        };
        List<String> s3 = g2.flush();
        check("inverse-only add writes no FK", Arrays.equals(want3, s3.toArray()), "sql = " + s3);

        Order p = new Order(3);
        Order q = new Order(4);
        Graph g3 = new Graph();
        g3.persist(p);
        Line l3 = new Line(30, "C");
        g3.addLine(p, l3);
        g3.flush();
        g3.persist(q);
        g3.addLine(q, l3);
        String[] want4 = {
            "INSERT INTO orders(id) VALUES(4)",
            "UPDATE order_line SET order_id=4 WHERE id=30",
        };
        List<String> s4 = g3.flush();
        check("FK follows the owning side", Arrays.equals(want4, s4.toArray()), "sql = " + s4);

        Order r = new Order(5);
        Graph g4 = new Graph();
        g4.persist(r);
        Line l4 = new Line(50, "D");
        g4.addLine(r, l4);
        g4.flush();
        g4.removeLine(r, l4);
        String[] want5 = {"DELETE FROM order_line WHERE id=50"};
        List<String> s5 = g4.flush();
        check("orphanRemoval deletes the child", Arrays.equals(want5, s5.toArray()), "sql = " + s5);
        List<String> s6 = g4.flush();
        check("orphan deleted only once", s6.isEmpty(), "sql = " + s6);

        Order e = new Order(6);
        Graph g5 = new Graph();
        g5.persist(e);
        g5.addLine(e, new Line(60, "F"));
        g5.addLine(e, new Line(61, "G"));
        g5.flush();
        g5.remove(e);
        String[] want7 = {
            "DELETE FROM order_line WHERE id=60",
            "DELETE FROM order_line WHERE id=61",
            "DELETE FROM orders WHERE id=6",
        };
        List<String> s7 = g5.flush();
        check("cascade REMOVE deletes children then parent", Arrays.equals(want7, s7.toArray()), "sql = " + s7);

        Order n = new Order(7);
        Graph g6 = new Graph();
        g6.persist(n);
        g6.remove(n);
        List<String> s8 = g6.flush();
        check("never-inserted entity writes nothing", s8.isEmpty(), "sql = " + s8);

        Order k = new Order(8);
        Graph g7 = new Graph();
        g7.persist(k);
        g7.flush();
        g7.addLine(k, new Line(80, "H"));
        String[] want9 = {
            "INSERT INTO order_line(id,sku) VALUES(80,'H')",
            "UPDATE order_line SET order_id=8 WHERE id=80",
        };
        List<String> s9 = g7.flush();
        check("cascade persist inserts only the new child", Arrays.equals(want9, s9.toArray()), "sql = " + s9);

        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
 reference:`class Order { long id; List<Line> lines = new ArrayList<>(); Order(long i) { id = i; } }
class Line { long id; String sku; Order order; Line(long i, String s) { id = i; sku = s; } }
class Graph {
    Map<Long, Order> managed = new LinkedHashMap<>();   // thu tu persist = thu tu flush
    Set<Long> insOrder = new HashSet<>();
    Set<Long> insLine = new HashSet<>();
    Set<Long> orphans = new LinkedHashSet<>();
    Set<Long> removed = new HashSet<>();
    Map<Long, Long> fk = new HashMap<>();               // line id -> order_id da ghi xuong DB

    void persist(Order o) { managed.putIfAbsent(o.id, o); }
    void addLine(Order o, Line l) {
        if (!o.lines.contains(l)) o.lines.add(l);
        l.order = o;                                    // OWNING side: FK doc tu day
    }
    void removeLine(Order o, Line l) { o.lines.remove(l); l.order = null; orphans.add(l.id); }
    void remove(Order o) { removed.add(o.id); }

    List<String> flush() {
        List<String> out = new ArrayList<>();
        for (Order o : new ArrayList<>(managed.values())) {
            if (removed.contains(o.id)) {               // cascade REMOVE
                for (Line l : new ArrayList<>(o.lines)) {
                    if (l.order != o) continue;         // con đã đổi cha thì không bị xóa theo
                    if (insLine.remove(l.id)) { out.add("DELETE FROM order_line WHERE id=" + l.id); fk.remove(l.id); }
                    orphans.remove(l.id);
                }
                if (insOrder.remove(o.id)) out.add("DELETE FROM orders WHERE id=" + o.id);
                managed.remove(o.id);
                continue;
            }
            if (insOrder.add(o.id)) out.add("INSERT INTO orders(id) VALUES(" + o.id + ")");
            for (Line l : o.lines) {                    // cascade PERSIST: luu con du FK the nao
                if (insLine.add(l.id)) out.add("INSERT INTO order_line(id,sku) VALUES(" + l.id + ",'" + l.sku + "')");
                if (l.order == o && !Objects.equals(fk.put(l.id, o.id), o.id))
                    out.add("UPDATE order_line SET order_id=" + o.id + " WHERE id=" + l.id);
            }
        }
        for (Long id : new ArrayList<>(orphans)) {      // orphanRemoval
            if (insLine.remove(id)) { out.add("DELETE FROM order_line WHERE id=" + id); fk.remove(id); }
            orphans.remove(id);
        }
        return out;
    }
}`,
 hints:['Giữ ba thứ đã ghi xuống database: tập id order đã INSERT, tập id line đã INSERT, và map lineId → order_id đã ghi. Flush chỉ sinh SQL khi chúng thay đổi.','Trong addLine, đừng quên gán line.order = order; test "inverse-only add writes no FK" chính là kiểm tra việc AI đó.','FK chỉ được xét khi line.order == order đang được duyệt. Dòng đã đổi cha thì để cha mới sinh UPDATE.','Orphan (line bị removeLine, đã từng INSERT) nên xử lý sau vòng duyệt order, và nhớ xóa nó khỏi tập đã-INSERT để flush sau không lặp lại DELETE.','Order bị remove mà chưa từng INSERT thì đừng sinh DELETE: không có row nào để xóa.'],
 explain:`Ba cơ chế tách bạch, và bài tập này buộc bạn chỉ ra chỗ nào tạo ra SQL:
- **Cascade PERSIST** quyết định việc INSERT con: mọi line nằm trong collection của order managed đều được lưu, bất kể {{line.order}} trỏ đi đâu.
- **Owning side** quyết định giá trị FK: UPDATE {{order_id}} chỉ sinh ra khi {{line.order}} chính là order đang duyệt. Vì vậy dòng bị "quên" set owning side có row nhưng FK null — đúng cái bẫy ngoài đời.
- **orphanRemoval** là DELETE khi phần tử bị gỡ khỏi collection, còn **cascade REMOVE** là DELETE khi entity cha bị xóa.

Lỗi hay gặp:
1. So sánh FK theo collection thay theo {{line.order}}: khi một dòng chuyển cha, {{p.lines}} cũ vẫn chứa nó nên bạn ghi đè FK về cha cũ. Hibernate thì luôn lấy {{line.order}}.
2. Quên theo dõi "giá trị đã ghi": mỗi lần flush lại sinh UPDATE lặp lại, giống Hibernate không dirty-check association.
3. Xóa cha trước xóa con: DB từ chối vì FK tham chiếu.
4. Sinh DELETE cho entity chưa từng INSERT (đơn mới tạo rồi hủy ngay), trong khi thực tế chẳng có row nào để xóa.

Trong Hibernate thật, cascade và orphanRemoval hoạt động trên entity managed, nên muốn xóa hàng loạt bạn vẫn phải tải collection lên — đó là lý do bulk DML nhanh hơn nhưng dễ để lại entity cũ trong persistence context và region L2.`,
 }],check:[{q:'Bạn gọi {{order.getLines().add(line)}} mà không gọi {{line.setOrder(order)}}, với {{cascade = PERSIST}}. Sau flush:',options:['Hibernate tự set owning side giúp bạn','Line được INSERT nhưng cột order_id vẫn null','Không có câu SQL nào cho bảng order_line','Hibernate ném lỗi lúc persist'],answer:1,explain:`Collection là phía inverse nên chỉ thêm vào đó không đủ để Hibernate biết FK. Cascade PERSIST vẫn lưu line (nó nằm trong graph được cascade), vì vậy line thành row mồ côi với order_id null. Muốn đúng phải set cả hai phía trong helper. Nếu không có cascade thì line ở state new và persist(order) mới báo lỗi "entity not persistent" — đó là trường hợp khác.`},{q:'{{@ManyToOne(cascade = CascadeType.REMOVE)}} trên field {{Order.customer}} gây ra điều gì khi {{em.remove(order)}}?',options:['Chỉ xóa dòng trong bảng orders','Xóa luôn cả Customer, dù khách còn đơn hàng khác','Bỏ liên kết và giữ Customer','Ném lỗi vì ManyToOne không hỗ trợ cascade'],answer:1,explain:`Customer là dữ liệu dùng chung. REMOVE cascades xuống nó nghĩa là mỗi lần hủy một đơn là mất một khách hàng (và các đơn khác của khách đó thành tham chiếu treo, hoặc bị chặn bởi FK). Đây là lỗi kinh điển gây mất dữ liệu. ManyToOne vẫn nhận cascade nên không có lỗi khai báo; không tồn tại chế độ "chỉ bỏ liên kết" — Hibernate gọi remove trên chính entity mà cascade trỏ tới.`},{q:'orphanRemoval và cascade REMOVE khác nhau ở điểm nào?',options:['orphanRemoval chạy khi entity con bị gỡ khỏi collection; REMOVE chạy khi entity cha bị remove','orphanRemoval chỉ dùng cho ManyToOne','Hai cái là một, chỉ khác tên','REMOVE xóa theo collection còn orphanRemoval xóa theo primary key'],answer:0,explain:`orphanRemoval kích hoạt khi liên kết bị cắt (gỡ khỏi collection, owning side đặt null) — tức "con không còn chủ thì chết". {{cascade = REMOVE}} kích hoạt khi bạn xóa cha. orphanRemoval không khai báo được trên {{@ManyToMany}}, và không áp dụng cho ManyToOne theo nghĩa sở hữu ở chiều ngược lại.`},{q:'Vì sao {{orphanRemoval}} có thể chậm trên bảng lớn?',options:['Vì nó chạy một câu DELETE lớn trong database','Vì mỗi lần flush Hibernate phải tải CẢ collection lên và so với snapshot để tìm phần tử bị gỡ','Vì nó bắt buộc bật second-level cache','Vì nó cần @Version trên entity con'],answer:1,explain:`Hibernate phải biết phần tử nào biến mất, nên nó giữ snapshot của collection từ lúc load và cần collection thật trong RAM để so. Xóa hàng chục nghìn dòng theo cách này là đưa cả collection về heap. Bulk {{DELETE FROM order_line WHERE order_id = ?}} nhanh hơn nhưng bỏ qua persistence context và cache, và phải xóa con trước khi xóa cha.`}],tags:['owning side','mappedBy','cascade','orphanRemoval']
},
{
 id:'lesson-jpa-007',track:'jpa',order:7,title:'Second-level cache và query cache',level:'senior',minutes:30,
 goals:['Phân biệt ba tầng nhớ: persistence context (L1), second-level cache (L2) và query cache','Giải thích vì sao L2 lưu state chứ không lưu object, và hệ quả với identity qua nhiều session','Nói được region bị vô hiệu thế nào khi ghi và vì sao bulk update hoặc node thứ hai làm app phục vụ dữ liệu cũ','Chọn read-only hay read-write theo loại dữ liệu và biết khi nào cache tầng service tốt hơn L2'],
 body:`### Hiểu nhanh: ba tầng nhớ của Hibernate
Một danh mục sản phẩm được đọc cả nghìn lần mỗi phút. Lần nào cũng SELECT xuống database là lãng phí, mà database thường là tài nguyên đắt nhất trong hệ thống. Có ba chỗ để cất kết quả đã đọc:
1. **Persistence context (L1)**: thuộc về một session, tức một transaction. Luôn bật, không cấu hình được, chết khi transaction kết thúc. Đây là thứ tạo ra identity map và dirty checking (bài Persistence context và dirty checking).
2. **Second-level cache (L2)**: thuộc về {{EntityManagerFactory}} (Hibernate gọi là {{SessionFactory}}), dùng chung cho **toàn ứng dụng**, sống xuyên transaction, xuyên request. Phải bật provider hỗ trợ Hibernate 6 ({{Ehcache 3}} qua {{hibernate-jcache}}, {{Infinispan}} hoặc Hazelcast) rồi khai báo entity nào được cache.
3. **Query cache**: cache kết quả truy vấn, nhưng thực chất chỉ lưu **danh sách id** của câu SQL + tham số, nên mỗi lần hit vẫn phải lấy entity từ L2 hoặc database.

Cài đặt tối thiểu: thêm dependency provider cache (ví dụ {{hibernate-jcache}} cho Hibernate 6), bật {{hibernate.cache.use_second_level_cache=true}} (qua {{spring.jpa.properties.}}), chọn region factory, rồi khai báo {{@Cacheable}} trên entity và {{@Cache(usage = ...)}} để chọn chiến lược. Trần số entry và TTL đặt trong cấu hình provider ({{ehcache.xml}} hoặc tương đương). Thêm {{hibernate.cache.use_query_cache=true}} chỉ khi thật sự cần query cache.

### L2 lưu "state", không lưu object
Điểm này hay bị trả lời sai nhất. Region L2 chứa **dehydrated state**: giá trị các cột của entity, không phải tham chiếu tới instance Java đang dùng.

~~~java
@Entity
@Cacheable
@Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
class Category {
    @Id Long id;
    String name;
    @Version Integer version;   // nên có sẵn @Version cho optimistic locking; L2 không thay nó
}
~~~

Hệ quả: hai transaction đọc cùng một id nhận về **hai instance khác nhau** ({{a1 != a2}}). Không có "identity map toàn cục" — mà nếu có thì đã phá mất khả năng cô lập giữa các transaction. Trong một transaction, L1 vẫn thắng: entity đã nằm trong persistence context thì Hibernate trả lại instance đó và không đọc L2.

> Ai hỏi "L2 có phải cache object không": trả lời **cache trạng thái**, mỗi session tự dựng object. Vì thế đừng so sánh entity bằng {{==}} khi có L2.

### Ghi xuống thì region ra sao
Hibernate dùng cơ chế **ghi đè hoặc làm cũ** sau khi transaction thành công: state mới được đưa vào region (write-through), entity bị xóa thì bị gỡ khỏi region. Hai hệ quả thực tế:
- {{@Modifying}} bulk update, native SQL, script sửa dữ liệu chạy tay, hay lệnh UPDATE từ một service khác **không đi qua entity**, nên Hibernate không tự cập nhật entity cache cho từng dòng bị ảnh hưởng; region liên quan tới bảng/query space đó thường bị **evict** (Hibernate 6 có API quản lý query spaces). Ứng dụng có thể tiếp tục phục vụ dữ liệu cũ cho tới khi region được làm mới hoặc entry hết hạn, nên sau bulk DML hãy xem xét {{clearAutomatically}} và evict rõ ràng.
- Chạy nhiều node (nhiều pod Kubernetes) với cache **local trong JVM**: mỗi node giữ một region riêng. Node A ghi, node B vẫn đọc bản cũ tới khi có cơ chế **invalidation qua mạng** (Infinispan hoặc Hazelcast hỗ trợ region phân tán/cụm) hoặc TTL hết hạn.

| Chiến lược | Dành cho | Đặc điểm |
|---|---|---|
| {{read-only}} | danh mục, cấu hình, bảng tham chiếu không bao giờ sửa | rẻ nhất, không lock; sửa là có lỗi |
| {{read-write}} | đọc nhiều, sửa thỉnh thoảng | giữ soft-lock lúc ghi để reader không đọc phải giá trị đang dở |
| {{nonstrict-read-write}} | chấp nhận đọc stale trong vài giây | đơn giản, không lock, ít va chạm |
| {{transactional}} | provider có JTA ({{infinispan}}) | nhất quán theo transaction, cấu hình phức tạp nhất |

### Khi nào đáng bật, khi nào không
Đáng: bảng đọc rất nhiều mà sửa hiếm, dữ liệu nhỏ và "đóng" (country, fee table, danh mục, thông số cấu hình), nhiều request chạm cùng một id, và hệ thống chỉ một node hoặc có invalidation phân tán.
Không đáng: entity sửa thường xuyên (mỗi lần ghi là một lần vô hiệu hóa và serialize lại), entity mang collection lớn, dữ liệu phải nhất quán ngay giữ nhiều node, hoặc tỉ lệ hit thấp. Với dữ liệu hay đổi, cache ở tầng service bằng {{Caffeine}}/Redis với TTL rõ ràng và evict tường minh thường dễ kiểm soát hơn L2: bạn kiểm soát được key, thấy được tỉ lệ hit/miss và không bị bất ngờ về identity.

### Cái giá phải trả
- **RAM**: mỗi entry là state của entity, cộng thêm collection region cho từng {{@OneToMany}} được cache. Region không đặt trần sẽ làm heap phình và gây full GC.
- **Chi phí serialize/copy**: provider có thể lưu trên heap (phải copy để tránh ai đó sửa nhầm) hoặc off-heap (phải serialize) — không có "hit" nào miễn phí.
- **Khó chẩn đoán**: dev một node thì đúng, production nhiều node thì "dữ liệu cũ". Luôn có đường thoát: đặt {{jakarta.persistence.cache.retrieveMode}} thành {{BYPASS}} cho một thao tác để ép đọc DB, hoặc {{factory.getCache().evictAll()}} khi hotfix dữ liệu.
- **Proxy lazy lọt vào cache**: cache entity có association LAZY nghĩa là cache cả proxy; đọc lại ở session khác có thể lỗi hoặc kích hoạt query ngoài ý muốn. Cache **DTO** an toàn hơn.

### Vì sao query cache hiếm khi có giá trị
Nó lưu danh sách id theo đúng câu SQL và bộ tham số, nên đổi một ký tự trong câu SQL là sang key khác. Tệ hơn: Hibernate theo dõi bảng bằng **update timestamp** — bất kỳ INSERT/UPDATE/DELETE nào vào bảng đó (qua Hibernate) làm **mọi** entry liên quan mất hiệu lực. Bảng ghi thường xuyên thì gần như luôn miss, chỉ thêm chi phí tra và ghi cache. Muốn cache danh sách: cache ở tầng service, hoặc dùng DTO projection.

### Liên hệ phỏng vấn
Câu hỏi kiểu này hay gặp: "Second-level cache khác gì caching bằng Redis? Bao giờ bạn bật nó?" Cách trả lời có chiều sâu: phân biệt phạm vi (transaction vs ứng dụng), nêu L2 lưu state nên không giữ identity, giải thích invalidation khi ghi và vấn đề nhiều node, rồi cho biết mình chỉ bật cho bảng đọc nhiều ghi ít với {{read-only}} hoặc {{read-write}}; dữ liệu hay đổi thì để cache ở tầng service kèm TTL. Điểm cộng: nói cách xác minh bằng {{hibernate.generate_statistics}} ({{cache hits, misses, puts}}) và cách thoát khi dữ liệu cũ ({{retrieveMode = BYPASS}}).`,
 exercises:[{title:'Region L2 dung chung qua nhieu session',prompt:`Mô phỏng **second-level cache**: region dùng chung nhiều session và lưu **state**, không lưu object. Cho sẵn {{Account}} và {{DbSim}} ({{read(id)}} đếm một lần truy vấn database). Cài {{HibernateLite}}:
- {{HibernateLite(db, capacity)}}: region L2 chứa tối đa {{capacity}} entry (dương); khi đầy, phần tử **dùng lâu nhất** bị đẩy ra (LRU).
- {{openSession()}}: bắt đầu session mới — identity map cấp session (L1) làm lại từ đầu, region L2 giữ nguyên.
- {{find(id)}}: nếu session đang mở và L1 đã có id thì trả **đúng instance** đó, không đụng L2 và database. Nếu L1 chưa có (hoặc chưa mở session) thì tra L2: hit thì đếm một hit và dựng instance **mới** từ state đã cache; miss thì đếm một miss, gọi {{db.read(id)}} rồi đưa state vào region. Instance luôn được ghi vào L1 của session đang mở.
- {{save(id, name)}}: ghi {{name}} vào database và cập nhật state trong region (write-through); **không** sửa instance đang nằm trong session hiện tại.
- {{bulkSetAllNames(name)}}: đổi tên mọi dòng trong database và **xóa sạch region** (Hibernate evict toàn bộ region khi chạy bulk DML).
- {{hits()}}, {{misses()}}: số lần tra L2, chỉ tính khi L1 miss; {{regionSize()}}: số entry đang có trong region.`,
 starter:`class Account { long id; String name; Account(long i, String n) { id = i; name = n; } }
class DbSim {
    Map<Long, String> rows = new HashMap<>();
    int queries = 0;
    void put(long id, String name) { rows.put(id, name); }
    String read(long id) { queries++; return rows.get(id); }
    void renameAll(String name) { for (long k : new ArrayList<>(rows.keySet())) rows.put(k, name); }
}
class HibernateLite {
    HibernateLite(DbSim d, int capacity) { throw new UnsupportedOperationException("TODO"); }
    void openSession() { throw new UnsupportedOperationException("TODO"); }
    Account find(long id) { throw new UnsupportedOperationException("TODO"); }
    void save(long id, String name) { throw new UnsupportedOperationException("TODO"); }
    void bulkSetAllNames(String name) { throw new UnsupportedOperationException("TODO"); }
    int hits() { throw new UnsupportedOperationException("TODO"); }
    int misses() { throw new UnsupportedOperationException("TODO"); }
    int regionSize() { throw new UnsupportedOperationException("TODO"); }
}`,
 tests:`public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }
    static DbSim seed() {
        DbSim d = new DbSim();
        d.put(1, "A"); d.put(2, "B"); d.put(3, "C");
        return d;
    }
    public static void main(String[] args) {
        DbSim db = seed();
        HibernateLite h = new HibernateLite(db, 5);
        h.openSession();
        Account a = h.find(1);
        Account b = h.find(1);
        check("L1 hit returns the same instance", a == b, "identity map khong hoat dong");
        check("L1 hit costs no query", db.queries == 1 && "A".equals(a.name), "queries = " + db.queries);
        check("first read is a miss", h.hits() == 0 && h.misses() == 1, "hits = " + h.hits() + ", misses = " + h.misses());

        h.openSession();
        Account c = h.find(1);
        check("L2 hit needs no new query", db.queries == 1 && "A".equals(c.name), "queries = " + db.queries + ", name = " + c.name);
        check("L2 does not keep identity across sessions", c != a, "L2 luu state nen session moi co instance rieng");
        check("hit counted once", h.hits() == 1 && h.misses() == 1, "hits = " + h.hits() + ", misses = " + h.misses());

        h.save(1, "B2");
        Account d2 = h.find(1);
        check("save leaves the open session alone", d2 == c && "A".equals(d2.name), "name = " + d2.name);
        h.openSession();
        Account e = h.find(1);
        check("save writes through to the region", "B2".equals(e.name) && db.queries == 1, "name = " + e.name + ", queries = " + db.queries);
        check("write-through causes no extra miss", h.misses() == 1, "misses = " + h.misses());

        h.bulkSetAllNames("Z");
        h.openSession();
        Account f = h.find(2);
        check("bulk update evicts the whole region", "Z".equals(f.name) && db.queries == 2, "name = " + f.name + ", queries = " + db.queries);
        check("region read after eviction is a miss", h.misses() == 2, "misses = " + h.misses());

        DbSim db2 = seed();
        HibernateLite g = new HibernateLite(db2, 2);
        g.openSession(); g.find(1);
        g.openSession(); g.find(2);
        g.openSession(); g.find(1);
        g.openSession(); g.find(3);
        int before = db2.queries;
        g.openSession();
        Account t2 = g.find(2);
        check("LRU evicts the least recently used entry", db2.queries == before + 1 && "B".equals(t2.name), "queries " + before + " -> " + db2.queries);
        check("region never exceeds capacity", g.regionSize() == 2, "regionSize = " + g.regionSize());

        DbSim db3 = seed();
        HibernateLite k = new HibernateLite(db3, 5);
        Account x1 = k.find(1);
        Account x2 = k.find(1);
        check("no open session: L2 answers but builds a new instance", x1 != x2 && db3.queries == 1 && k.hits() == 1, "x1 == x2 la " + (x1 == x2) + ", queries = " + db3.queries + ", hits = " + k.hits());
        k.openSession();
        Account x3 = k.find(1);
        Account x4 = k.find(1);
        check("an open session puts L1 on top of L2", x3 == x4 && db3.queries == 1 && k.misses() == 1, "queries = " + db3.queries + ", misses = " + k.misses());

        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
 reference:`class Account { long id; String name; Account(long i, String n) { id = i; name = n; } }
class DbSim {
    Map<Long, String> rows = new HashMap<>();
    int queries = 0;
    void put(long id, String name) { rows.put(id, name); }
    String read(long id) { queries++; return rows.get(id); }
    void renameAll(String name) { for (long k : new ArrayList<>(rows.keySet())) rows.put(k, name); }
}
class HibernateLite {
    DbSim db; int cap;
    LinkedHashMap<Long, String> l2 = new LinkedHashMap<>();  // region: id -> STATE, không phải object
    LinkedHashMap<Long, Account> l1;                         // identity map cua session dang mo, null = chua mo
    int hits, misses;

    HibernateLite(DbSim d, int capacity) { db = d; cap = capacity; }
    void openSession() { l1 = new LinkedHashMap<>(); }

    Account find(long id) {
        if (l1 != null) { Account a = l1.get(id); if (a != null) return a; }   // L1 thang: khong cham L2 lan database
        Account fresh = new Account(id, state(id));                            // session moi = instance moi
        if (l1 != null) l1.put(id, fresh);
        return fresh;
    }
    private String state(long id) {
        if (l2.containsKey(id)) { hits++; String s = l2.remove(id); l2.put(id, s); return s; }  // được chạm thì ở lại gần hơn
        misses++;
        String s = db.read(id);
        l2.put(id, s);
        while (l2.size() > cap) l2.remove(l2.keySet().iterator().next());       // đầy thì: đẩy phần tử lâu dùng nhất ra
        return s;
    }
    void save(long id, String name) { db.rows.put(id, name); l2.remove(id); l2.put(id, name); }  // write-through, bo qua L1
    void bulkSetAllNames(String name) { db.renameAll(name); l2.clear(); }       // bulk DML: xoa sach region
    int hits() { return hits; }
    int misses() { return misses; }
    int regionSize() { return l2.size(); }
}`,
 hints:['Region phải là LinkedHashMap để giữ thứ tự dùng: khi truy cập một entry, remove rồi put lại để nó trở thành phần tử mới nhất.','find: kiểm tra L1 trước. Chỉ khi L1 miss mới tra region, và chỉ khi region miss mới gọi db.read (đừng đếm nhầm hit/miss).','L2 lưu String (state), không lưu Account: mỗi lần lấy từ region phải new Account(...), nếu không hai session sẽ dùng chung một instance.','save chỉ đụng database và region; instance trong session đang mở phải giữ nguyên giá trị cũ — đó là hành vi thật của L1.','bulkSetAllNames thì l2.clear() toàn bộ region; đừng cập nhật từng entry.'],
 explain:`Bài tập này dạy ba điều mà người ta hay nhầm khi nói về L2:
1. **L1 thắng L2.** find hai lần trong cùng session chỉ xuống region một lần; lần thứ hai là instance y hệt. Đó là lý do {{save}} không làm thay đổi mà bạn đọc lại trong cùng transaction nhìn thấy giá trị mới.
2. **L2 không giữ identity.** Region lưu state, nên session mới tạo instance mới ({{c != a}}). Nếu bạn cache thẳng object, hai transaction sẽ sửa chung một instance và phá vỡ cô lập — cũng là lý do Hibernate không làm vậy.
3. **Ghi thì region phải cũ đi.** Write-through khi ghi qua entity, nhưng bulk DML thì chỉ có nước xóa cả region ({{l2.clear()}}), và đó chính xác là cách Hibernate đối xử với {{@Modifying}}: evict toàn bộ region của bảng.

Bẫy khi cài:
- Đếm hit/miss khi L1 đã hit → số liệu sai, phải để block L1 trả về sớm.
- LRU sai thứ tự: chỉ cho entry vào cuối khi nó **được dùng**, nếu không bạn đẩy nhầm entry đang nóng.
- Dùng {{put}} mà không remove trước: LinkedHashMap theo insertion-order sẽ không đổi vị trí, entry tưởng còn mới hóa ra bị đẩy ra đầu tiên.

Ngoài đời bạn không tự viết cái này; nhưng nó giải thích vì sao "bật L2 cho bảng hay ghi" và "đọc lại thấy dữ liệu cũ" là hai sự cố rất thật, và vì sao {{regionSize}}/hit ratio cần được giám sát.`,
 }],check:[{q:'Second-level cache của Hibernate chứa gì trong region?',options:['Tham chiếu tới object entity đang được session dùng','State của entity (giá trị các cột), nên mỗi session dựng instance riêng','Câu SQL đã chuẩn bị sẵn','Danh sách id của từng câu query đã chạy'],answer:1,explain:`Nếu region giữ object đang dùng, nhiều transaction sẽ sửa chung một instance và hỏng tính cô lập. Vì vậy Hibernate "sấy khô" state để cất, và mỗi session đọc ra lại tạo instance mới. Câu SQL chuẩn bị thuộc về statement cache; danh sách id là việc của query cache, không phải entity region.`},{q:'Hai transaction nối tiếp nhau cùng {{find}} một id đang có trong L2. Điều gì đúng?',options:['Transaction thứ hai nhận đúng object mà transaction thứ nhất đã trả','Mỗi transaction nhận một instance khác nhau, vì identity map chỉ phạm vi một session','Transaction thứ hai phải xuống database','Cả hai transaction phải qua query cache'],answer:1,explain:`Identity là hợp đồng **trong một** persistence context, không phải toàn ứng dụng — nên mỗi session có instance riêng (đều mang cùng giá trị). L2 hit thì không xuống database, và query cache không liên quan tới find theo id.`},{q:'Bạn chạy {{@Modifying @Query("UPDATE Category c SET c.name = :n")}} trong lúc một entity Category đã nằm trong persistence context và trong L2. Chuyện gì xảy ra?',options:['Cả context và region đều tự cập nhật cho khớp','Context giữ giá trị cũ; region bị evict toàn bộ theo bảng, nên phải clear context nếu muốn đọc số mới','Hibernate bỏ qua câu lệnh vì có L2','Region giữ nguyên, context được làm mới'],answer:1,explain:`Bulk DML chạy thẳng xuống database, không đụng entity managed nào, nên instance trong session vẫn giữ giá trị cũ (phải {{clear()}} hoặc {{@Modifying(clearAutomatically = true)}}). Region thì Hibernate vô hiệu theo bảng, nên lần đọc kế tiếp sẽ xuống DB. Đây là nguồn sự cố "sửa xong API vẫn trả dữ liệu cũ".`},{q:'Vì sao query cache thường không đáng bật?',options:['Vì nó chỉ cache danh sách id và bị vô hiệu hóa mỗi khi có ghi vào bảng đó','Vì Hibernate không hỗ trợ query cache','Vì nó chỉ làm việc với {{@Version}}','Vì nó bắt buộc phải dùng Redis'],answer:0,explain:`Query cache lưu id theo câu SQL và tham số, entity vẫn phải lấy từ L2 hoặc DB; và mọi thao tác ghi qua Hibernate vào bảng liên quan làm entry mất hiệu lực. Bảng ghi thường xuyên thì tỉ lệ hit gần bằng 0. Hibernate có hỗ trợ ({{use_query_cache}}), nó không phụ thuộc {{@Version}} và provider cache không nhất thiết là Redis.`}],tags:['second-level cache','query cache','cache invalidation','Hibernate']
},
{
 id:'lesson-jpa-008',track:'jpa',order:8,title:'Dirty checking: snapshot, @DynamicUpdate và chi phí',level:'senior',minutes:25,
 goals:['Giải thích dirty checking so từng field với snapshot và vì sao setter không gửi SQL','So sánh UPDATE mọi cột mặc định với @DynamicUpdate và bytecode enhancement','Nhận biết chi phí dirty checking trên transaction lớn và cách giảm bằng read-only, clear, batch'],
 body:`### Hiểu nhanh
Dirty checking đã được giới thiệu ở bài Persistence context: Hibernate lưu snapshot lúc load, flush so từng field. Bài này đào sâu **chi phí và các biến thể** để bạn trả lời "khi nào nên tối ưu dirty checking".

### UPDATE mặc định: mọi cột
Mặc định Hibernate sinh UPDATE chứa **tất cả** cột của entity, kể cả những cột không đổi:
~~~sql
UPDATE account SET name = ?, email = ?, status = ?, version = ? WHERE id = ? AND version = ?
~~~
Lợi: câu SQL cố định nên tái dùng prepared statement (statement cache). Tốn: gửi nhiều tham số hơn, và database phải ghi các cột không đổi (trigger, index update).

### @DynamicUpdate: chỉ cột đổi
~~~java
@Entity
@DynamicUpdate
class Account { ... }
~~~
Hibernate sinh UPDATE chỉ các cột thực sự đổi. Có lợi với bảng rất nhiều cột hoặc cột lớn (TEXT, JSON). Cái giá: mỗi tổ hợp cột đổi là một câu SQL khác, nên JDBC/DB có ít cơ hội tái dùng prepared statement (statement cache) hơn; và Hibernate vẫn phải so snapshot để biết cột nào đổi (dirty check không biến mất). Chỉ bật sau khi đo (ví dụ bật {{hibernate.generate_statistics}} hoặc dùng profiler).

### Bytecode enhancement
Mặc định dirty checking chạy lúc flush: duyệt entity managed, so mọi field với snapshot. Với entity lớn và nhiều entity, chi phí này đáng kể. Bytecode enhancement (bật tường minh trong build, ví dụ plugin {{hibernate-enhance-maven-plugin}} của Hibernate ORM) chèn code vào setter/getter để **đánh dấu field bẩn ngay lúc gán** (dirty tracking), nên flush chỉ cần đọc danh sách field đã đổi, không so toàn bộ. Phải bật tường minh trong build; đừng giả định project đã có. Có thể ảnh hưởng tương tác với một số công cụ dùng bytecode (AOP, JaCoCo) nên kiểm tra kỹ; chỉ cân nhắc sau khi profiling.

### Flush mode
- AUTO (mặc định): flush trước commit và trước query có thể bị ảnh hưởng bởi thay đổi đang chờ, để query thấy dữ liệu mới nhất.
- COMMIT: chỉ flush trước commit; query không tự flush, nhanh hơn nhưng query có thể thấy dữ liệu cũ trong cùng transaction.
- MANUAL: chỉ flush khi gọi flush().

### Chi phí trên transaction lớn
Mỗi entity managed tốn RAM cho object và snapshot; mỗi flush duyệt tất cả. Import 1 triệu dòng trong một transaction dễ OOM hoặc flush rất chậm. Cách làm: xử lý theo chunk (ví dụ 500 entity), mỗi chunk flush() rồi clear(). Phải flush trước clear, nếu không thay đổi chưa gửi sẽ mất.

### Read-only
@Transactional(readOnly = true) giúp Hibernate không giữ snapshot và bỏ dirty checking cho entity đọc ra, tiết kiệm RAM và CPU. Dùng cho endpoint chỉ đọc.

### Pitfall production
- Dirty checking chạy trên **mọi** entity managed, kể cả entity chỉ đọc trong transaction dài. Một transaction import lớn giữ hàng trăm nghìn entity trong persistence context sẽ làm flush chậm và tốn RAM.
- {{@DynamicUpdate}} không tự động bật; phải khai báo tường minh và đo bằng statistics.
- Bytecode enhancement thay đổi bytecode lúc build, phải kiểm tra tương thích với agent/proxy khác (Spring AOP, JaCoCo).
- Flush mode COMMIT có thể làm query trong transaction thấy dữ liệu cũ; chỉ dùng khi chắc chắn.

### Liên hệ phỏng vấn
"Dirty checking cost bao nhiêu và tối ưu thế nào?" Nêu: snapshot per entity, full scan mỗi flush, UPDATE mọi cột mặc định; @DynamicUpdate, bytecode enhancement, read-only, chunk + clear. Nhấn mạnh đo trước khi tối ưu.`,
 exercises:[{title:'Đếm cột đổi cho UPDATE động',prompt:`Mô phỏng dirty checking trả về danh sách field đổi theo thứ tự {{name}}, {{email}}, {{status}}. Cài {{DirtyTracker}}:
- Constructor nhận snapshot ban đầu (name, email, status).
- {{current(n, e, s)}} cập nhật state hiện tại.
- {{dirty()}} trả danh sách tên field đổi theo thứ tự name, email, status; nếu không đổi thì rỗng.
- {{flush()}} cập nhật snapshot bằng state hiện tại và trả dirty() trước khi cập nhật.`,
 starter:`class DirtyTracker{DirtyTracker(String n,String e,String s){}void current(String n,String e,String s){}List<String> dirty(){throw new UnsupportedOperationException("TODO");}List<String> flush(){throw new UnsupportedOperationException("TODO");}}`,
 tests:`public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }
    public static void main(String[] args) {
        DirtyTracker t = new DirtyTracker("A", "a", "ACTIVE");
        check("clean is empty", t.dirty().isEmpty(), "dirty = " + t.dirty());
        t.current("B", "a", "ACTIVE");
        check("one field changed", List.of("name").equals(t.dirty()), "dirty = " + t.dirty());
        check("dirty repeatable before flush", List.of("name").equals(t.dirty()), "dirty = " + t.dirty());
        List<String> f = t.flush();
        check("flush returns dirty list", List.of("name").equals(f), "flush = " + f);
        check("after flush clean", t.dirty().isEmpty(), "dirty = " + t.dirty());
        t.current("C", "b", "INACTIVE");
        check("multiple fields in order", List.of("name", "email", "status").equals(t.dirty()), "dirty = " + t.dirty());
        t.current("B", "a", "ACTIVE");
        check("value changed back is not dirty", t.dirty().isEmpty(), "dirty = " + t.dirty());
        DirtyTracker t2 = new DirtyTracker("X", "x", "S");
        t2.current("X", "x", "S");
        t2.flush();
        t2.current("Y", "x", "S");
        check("flush updates snapshot", List.of("name").equals(t2.dirty()), "dirty = " + t2.dirty());
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
 reference:`class DirtyTracker {
    String sn, se, ss; String cn, ce, cs;
    DirtyTracker(String n, String e, String s) { sn = cn = n; se = ce = e; ss = cs = s; }
    void current(String n, String e, String s) { cn = n; ce = e; cs = s; }
    List<String> dirty() {
        List<String> d = new ArrayList<>();
        if (!Objects.equals(sn, cn)) d.add("name");
        if (!Objects.equals(se, ce)) d.add("email");
        if (!Objects.equals(ss, cs)) d.add("status");
        return d;
    }
    List<String> flush() {
        List<String> d = dirty();
        if (!d.isEmpty()) { sn = cn; se = ce; ss = cs; }
        return d;
    }
}`,
 hints:['Giữ snapshot (sn, se, ss) và current (cn, ce, cs) riêng.','dirty() so từng field theo thứ tự name, email, status.','flush() cập nhật snapshot bằng current nếu có thay đổi.'],
 explain:`Dirty checking so giá trị, không đếm số lần gán. Lỗi hay gặp: cập nhật snapshot ở mọi lần dirty() thay vì flush(), hoặc không cập nhật sau flush khiến flush sau lặp lại UPDATE.`},
],
 check:[{q:'@DynamicUpdate có lợi khi nào?',options:['Bảng rất ít cột','Bảng rất nhiều cột hoặc cột lớn, và đã đo thấy lợi','Mọi entity','Khi dùng bytecode enhancement'],answer:1,explain:`@DynamicUpdate chỉ gửi cột đổi, có lợi với bảng nhiều cột hoặc cột lớn. Với bảng ít cột, UPDATE mọi cột tái dùng prepared statement tốt hơn. Bytecode enhancement là tối ưu khác (giảm chi phí so snapshot), không bắt buộc đi cùng.`},{q:'@Transactional(readOnly = true) giúp gì?',options:['Tự động commit nhanh hơn','Hibernate không giữ snapshot và bỏ dirty checking cho entity đọc ra','Tắt hoàn toàn SQL','Cho phép ghi trong transaction'],answer:1,explain:`Read-only báo Hibernate không cần theo dõi thay đổi, nên không giữ snapshot, tiết kiệm RAM và CPU dirty checking. Nó không tắt SQL (vẫn SELECT) và không cho phép ghi; ghi trong read-only transaction có thể gây lỗi hoặc bị bỏ qua tuỳ provider.`}],
 tags:['dirty checking','@DynamicUpdate','flush mode']
},
{
 id:'lesson-jpa-009',track:'jpa',order:9,title:'Thứ tự flush và ActionQueue',level:'senior',minutes:25,
 goals:['Giải thích Hibernate flush theo thứ tự insert → update → delete','Hiểu vì sao xóa rồi thêm cùng unique key vẫn lỗi và cách sửa bằng flush giữa chừng','Mô phỏng ActionQueue với bảng có unique constraint'],
 body:`### Hiểu nhanh: ActionQueue
Khi flush, Hibernate không gửi SQL theo thứ tự bạn gọi persist/remove. Nó xếp các thao tác vào **ActionQueue** và flush theo thứ tự cố định: **insert → update → delete** (và trong cùng loại theo thứ tự đăng ký). Lý do: đảm bảo FK và constraint được tôn trọng — insert cha trước con, delete con trước cha.

### Vì sao "xóa rồi thêm cùng unique key" vẫn lỗi
Giả sử bảng có unique constraint trên email. Trong một transaction:
1. Xóa user có email a@x.com.
2. Thêm user mới cũng email a@x.com.
Bạn nghĩ unique không còn bị chiếm. Nhưng flush gửi DELETE sau INSERT (vì insert → delete): INSERT chạy trước, thấy a@x.com vẫn còn (chưa bị xóa) → vi phạm unique. Lỗi xảy ra dù logic của bạn đúng.

### Cách sửa
- Gọi em.flush() giữa hai thao tác: flush đầu tiên gửi DELETE xuống DB, sau đó INSERT mới không bị chặn.
- Hoặc dùng UPDATE thay vì delete+insert.
- Hoặc xử lý ở DB (deferred constraint) nhưng Hibernate không tự làm.

### Thứ tự và FK
Hibernate cố gắng sắp xếp insert/delete để tôn trọng ràng buộc khóa ngoại (FK, foreign key — cột trỏ sang id của bảng khác): insert cha trước con, delete con trước cha (nhờ phân tích quan hệ và cascade/orphan). Nhưng việc này không phải lúc nào cũng "tự cứu" được mọi trường hợp phức tạp (quan hệ vòng, mapping tự quản). Nếu bạn gây mâu thuẫn rõ ràng, DB sẽ từ chối FK.

### ActionQueue và entity state
Hibernate theo dõi entity state (new/transient, managed, removed/detached) và chỉ sinh SQL cho thay đổi. Khi bạn gọi {{remove()}} trên entity managed, nó chuyển sang state removed và ActionQueue thêm delete action. Khi {{persist()}} entity mới (transient — chưa có trong DB/context), thêm insert action. Flush thực thi tất cả action theo thứ tự insert → update → delete.

### Vì sao không gửi theo thứ tự gọi
Nếu gửi theo thứ tự gọi, persist con trước cha sẽ vi phạm FK; remove cha trước con cũng vi phạm. ActionQueue sắp xếp để an toàn. Đây là lý do log SQL thường không khớp với code Java.

### Pitfall production
- Unique constraint trên cột thường xuyên bị "đổi" bằng delete+insert sẽ fail nếu không flush giữa chừng.
- Bulk delete + insert cùng unique key: nên dùng UPDATE hoặc flush rõ ràng.
- Thứ tự insert theo thứ tự đăng ký: nếu persist con trước cha mà không cascade, FK fail.
- Deferred constraint (PostgreSQL) có thể cho phép insert/delete trong transaction rồi kiểm tra lúc commit, nhưng Hibernate không tự bật; phải cấu hình DB.
- Khi debug, bật hibernate.show_sql và format_sql để xem thứ tự thực tế; so sánh với code để hiểu ActionQueue.

### Liên hệ phỏng vấn
"Vì sao xóa rồi thêm cùng unique key vẫn lỗi?" Trả lời: Hibernate flush insert trước delete, nên INSERT chạy khi bản ghi cũ chưa bị xóa. Cách sửa: flush giữa chừng, hoặc dùng UPDATE. Nêu thêm thứ tự insert/update/delete và lý do (FK, constraint).`,
 exercises:[{title:'ActionQueue flush theo thứ tự',prompt:`Mô phỏng ActionQueue. {{Queue}} có:
- {{insert(id)}}: đăng ký insert.
- {{update(id)}}: đăng ký update.
- {{delete(id)}}: đăng ký delete.
- {{flush()}}: trả danh sách id theo thứ tự: tất cả insert (theo thứ tự đăng ký), rồi tất cả update, rồi tất cả delete. Sau flush, hàng đợi rỗng.
- Bảng có unique constraint trên id: nếu cùng một id vừa bị delete vừa được insert trong cùng flush, insert chạy trước delete → vi phạm. Cài {{violatesUnique()}} trả true nếu có id nào vừa delete vừa insert trong hàng đợi hiện tại.`,
 starter:`class Queue {
    void insert(long id) { throw new UnsupportedOperationException("TODO"); }
    void update(long id) { throw new UnsupportedOperationException("TODO"); }
    void delete(long id) { throw new UnsupportedOperationException("TODO"); }
    List<Long> flush() { throw new UnsupportedOperationException("TODO"); }
    boolean violatesUnique() { throw new UnsupportedOperationException("TODO"); }
}`,
 tests:`public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }
    public static void main(String[] args) {
        Queue q = new Queue();
        q.insert(1); q.update(2); q.delete(3); q.insert(4); q.delete(5);
        List<Long> out = q.flush();
        check("inserts first", out.subList(0, 2).equals(List.of(1L, 4L)), "out = " + out);
        check("updates middle", out.get(2).equals(2L), "out = " + out);
        check("deletes last", out.subList(3, 5).equals(List.of(3L, 5L)), "out = " + out);
        check("queue empty after flush", q.flush().isEmpty(), "flush lần 2 không rỗng");
        Queue q2 = new Queue();
        q2.delete(7); q2.insert(7);
        check("unique violation detected", q2.violatesUnique(), "phải true khi cùng id delete+insert");
        Queue q3 = new Queue();
        q3.delete(8); q3.insert(9);
        check("no violation different ids", !q3.violatesUnique(), "phải false");
        Queue q4 = new Queue();
        q4.insert(10); q4.insert(10);
        check("duplicate insert is not unique violation by delete", !q4.violatesUnique(), "phải false");
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
 reference:`class Queue {
    List<Long> ins = new ArrayList<>(), upd = new ArrayList<>(), del = new ArrayList<>();
    void insert(long id) { ins.add(id); }
    void update(long id) { upd.add(id); }
    void delete(long id) { del.add(id); }
    List<Long> flush() {
        List<Long> out = new ArrayList<>();
        out.addAll(ins); out.addAll(upd); out.addAll(del);
        ins.clear(); upd.clear(); del.clear();
        return out;
    }
    boolean violatesUnique() {
        Set<Long> d = new HashSet<>(del);
        for (long id : ins) if (d.contains(id)) return true;
        return false;
    }
}`,
 hints:['Giữ ba danh sách riêng cho insert/update/delete.','flush() gộp theo thứ tự insert, update, delete rồi clear.','violatesUnique() kiểm tra giao giữa tập delete và tập insert.'],
 explain:`ActionQueue đảm bảo thứ tự insert → update → delete để tôn trọng FK và constraint. Lỗi hay gặp: nghĩ "xóa rồi thêm" là an toàn trong cùng transaction; thực tế INSERT chạy trước DELETE nên unique vẫn bị chặn. Cách sửa production: flush giữa chừng, hoặc dùng UPDATE.`},
],
 check:[{q:'Hibernate flush theo thứ tự nào?',options:['Theo thứ tự bạn gọi persist/remove','insert → update → delete','delete → update → insert','Ngẫu nhiên'],answer:1,explain:`ActionQueue sắp xếp insert trước, update giữa, delete sau để insert cha trước con và delete con trước cha, tôn trọng FK và constraint.`},{q:'Trong một transaction bạn xóa user email a@x.com rồi thêm user mới cùng email. Điều gì xảy ra lúc flush?',options:['Hibernate tự sắp xếp delete trước insert','INSERT chạy trước DELETE → vi phạm unique','Không có SQL nào','Hibernate ném lỗi compile'],answer:1,explain:`Hibernate flush insert trước delete, nên INSERT chạy khi bản ghi cũ chưa bị xóa → unique constraint bị vi phạm. Cách sửa: gọi flush() giữa hai thao tác, hoặc dùng UPDATE.`}],
 tags:['ActionQueue','flush order','unique constraint']
}
);
