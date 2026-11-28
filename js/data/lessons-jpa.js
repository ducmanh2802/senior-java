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

### Cơ chế từng bước: từ load đến flush UPDATE
Hiểu từng bước để thấy tại sao dirty checking chỉ "so sánh lúc flush" và vì sao UPDATE luôn chứa mọi cột:

1. **Load**: Hibernate SELECT entity, lưu **snapshot** — bản sao giá trị các cột lúc đọc. Snapshot là giá trị (string, int…), không phải tham chiếu tới object; nếu giữ cùng object, setter đổi cả hai và không bao giờ phát hiện thay đổi.
2. **Sửa trong RAM**: bạn gọi setter trên entity managed. Chỉ đổi object Java, không phát sinh SQL. Snapshot vẫn giữ giá trị cũ.
3. **Flush**: trước commit (hoặc trước query bị ảnh hưởng bởi FlushMode AUTO), Hibernate duyệt các entity managed, so field hiện tại với snapshot. Entity nào khác → sinh UPDATE.
4. **UPDATE**: mặc định sinh UPDATE chứa **tất cả** cột của entity, kể cả cột không đổi. Lý do: câu SQL cố định nên JDBC/DB có thể tái dùng prepared statement (statement cache).
5. **Sau flush**: Hibernate cập nhật snapshot bằng giá trị hiện tại; nếu không, flush lần sau sẽ lặp lại UPDATE.

Vì sao thiết kế như vậy? Snapshot cho phép dirty checking chỉ cần so sánh, không cần ghi nhớ lịch sử. UPDATE mọi cột là một thỏa thuận: giảm chi phí phân tích SQL, nhưng tốn payload lớn hơn và database ghi các cột không đổi.

~~~java
// Ví dụ: entity Account, load xong sửa name
Account a = em.find(Account.class, 1L);
// snapshot = {name: "A", email: "a@x.com", status: "ACTIVE", version: 1}
a.setName("B");                          // chỉ đổi object trong RAM, chưa có SQL
// commit → flush: UPDATE account SET name=?, email=?, status=?, version=? WHERE id=?
~~~

| Cách | UPDATE | Ưu điểm | Cái giá |
|---|---|---|---|
| Mặc định | mọi cột | statement cache tốt, câu SQL cố định | gửi nhiều tham số, DB ghi cột không đổi (trigger, index update) |
| @DynamicUpdate | chỉ cột đổi | giảm payload, tốt bảng nhiều cột hoặc cột lớn (TEXT, JSON) | mỗi tổ hợp cột là một câu SQL khác → giảm cơ hội tái dùng prepared statement |
| Bytecode enhancement | marking | flush chỉ đọc danh sách field đã đổi, không so toàn bộ | phải bật tường minh trong build, có thể tương tác với AOP/JaCoCo |

### Lỗi hay gặp trên production
- **Transaction dài, import lớn**: mỗi entity managed tốn RAM cho object và snapshot; mỗi flush phải so toàn bộ. Import 1 triệu dòng trong một transaction dễ OOM hoặc flush rất chậm. Cách: xử lý theo chunk (ví dụ 500 entity), mỗi chunk {{flush()}} rồi {{clear()}}. Phải flush **trước** clear, nếu không thay đổi chưa gửi sẽ mất.
- **@DynamicUpdate không tự động bật**: phải khai báo tường minh và đo bằng statistics ({{hibernate.generate_statistics}}) hoặc profiler. Bảng ít cột thì UPDATE mọi cột tái dùng statement cache tốt hơn — chỉ nên bật khi đã đo thấy lợi.
- **Flush mode COMMIT**: chỉ flush trước commit; query trong cùng transaction có thể thấy dữ liệu cũ. Chỉ dùng khi chắc chắn không cần query thấy dữ liệu mới.
- **Read-only endpoint mà vẫn giữ snapshot**: {{@Transactional(readOnly = true)}} giúp Hibernate không giữ snapshot và bỏ dirty checking cho entity đọc ra, tiết kiệm RAM và CPU. Dùng cho endpoint chỉ đọc.

### Liên hệ phỏng vấn
1. **"Dirty checking cost bao nhiêu và tối ưu thế nào?"** — Trả lời: snapshot per entity (RAM), full scan mỗi flush (CPU), UPDATE mọi cột mặc định (payload). Tối ưu: {{@DynamicUpdate}} (bảng nhiều cột), bytecode enhancement (giảm so snapshot), {{@Transactional(readOnly = true)}} (bỏ snapshot cho entity đọc), chunk + flush + clear (transaction lớn). Luôn đo trước khi tối ưu.
2. **"So sánh @DynamicUpdate với UPDATE mọi cột — khi nào chọn cái nào?"** — Bảng nhiều cột hoặc cột lớn (TEXT, JSON) thì {{@DynamicUpdate}} giảm payload; bảng ít cột thì UPDATE mọi cột tái dùng statement cache tốt hơn. Bytecode enhancement là tối ưu khác giảm chi phí so snapshot, không bắt buộc đi cùng.
3. **"@Transactional(readOnly = true) có tác dụng gì với dirty checking?"** — Hibernate không giữ snapshot và bỏ dirty checking cho entity đọc ra, tiết kiệm RAM và CPU. Vẫn SELECT được, không cho phép ghi; ghi trong read-only transaction có thể gây lỗi hoặc bị bỏ qua tuỳ provider.`,
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
check:[{q:'@DynamicUpdate có lợi khi nào?',options:['Bảng rất ít cột','Bảng rất nhiều cột hoặc cột lớn, và đã đo thấy lợi','Mọi entity','Khi dùng bytecode enhancement'],answer:1,explain:`@DynamicUpdate chỉ gửi cột đổi, có lợi với bảng nhiều cột hoặc cột lớn. Với bảng ít cột, UPDATE mọi cột tái dùng prepared statement tốt hơn. Bytecode enhancement là tối ưu khác (giảm chi phí so snapshot), không bắt buộc đi cùng.`},{q:'@Transactional(readOnly = true) giúp gì?',options:['Tự động commit nhanh hơn','Hibernate không giữ snapshot và bỏ dirty checking cho entity đọc ra','Tắt hoàn toàn SQL','Cho phép ghi trong transaction'],answer:1,explain:`Read-only báo Hibernate không cần theo dõi thay đổi, nên không giữ snapshot, tiết kiệm RAM và CPU dirty checking. Nó không tắt SQL (vẫn SELECT) và không cho phép ghi; ghi trong read-only transaction có thể gây lỗi hoặc bị bỏ qua tuỳ provider.`},{q:'Vì sao UPDATE mặc định chứa mọi cột?',options:['Chỉ để giảm số câu SQL','Tái dụng prepared statement (statement cache) tốt hơn; cái giá là payload lớn hơn và DB ghi cột không đổi','Vì Hibernate không biết cột nào đổi','Để hỗ trợ @DynamicUpdate'],answer:1,explain:`Câu SQL cố định cho một entity luôn có cùng dạng, JDBC/DB có thể chuẩn bị sẵn và tái dùng. Cái giá: gửi nhiều tham số hơn, và database phải ghi các cột không đổi (kích hoạt trigger, cập nhật index). @DynamicUpdate thay đổi câu SQL để chỉ gửi cột đổi, giảm payload nhưng giảm cơ hội tái dùng prepared statement.`},{q:'Bytecode enhancement làm gì để giảm chi phí dirty checking?',options:['Tự động thêm @DynamicUpdate cho mọi entity','Chèn code vào setter/getter để đánh dấu field bẩn ngay lúc gán, flush chỉ đọc danh sách field đã đổi','Tắt dirty checking hoàn toàn','Chỉ áp dụng cho entity có @Version'],answer:1,explain:`Bytecode enhancement chèn code vào setter để ghi nhận ngay khi field bị đổi, nên flush không cần so toàn bộ snapshot mà chỉ đọc danh sách field đã đánh dấu. Phải bật tường minh trong build (ví dụ plugin hibernate-enhance-maven-plugin) và kiểm tra tương tác với AOP, JaCoCo; đừng giả định project đã có.`}],
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

### Cơ chế từng bước: ActionQueue xếp action thế nào và vì sao
Hiểu từng bước để thấy tại sao Hibernate không gửi SQL theo thứ tự bạn gọi:

1. **Đăng ký action**: Khi bạn gọi {{persist(entity)}} (entity ở state new), Hibernate thêm một **insert action** vào ActionQueue. Khi gọi {{remove(entity)}} (entity managed), thêm một **delete action**. Khi entity managed có field đổi, dirty checking thêm một **update action** lúc flush. Mỗi action ghi lại entity id và loại.
2. **Xếp hàng**: ActionQueue giữ các action trong ba hàng đợi riêng: **insert**, **update**, **delete**. Trong mỗi hàng đợi, thứ tự là thứ tự đăng ký (giống thứ tự bạn thao tác).
3. **Flush**: Hibernate thực thi theo thứ tự cố định: **insert → update → delete**. Chỉ khi đó các câu SQL mới được gửi xuống database.
4. **Vì sao thứ tự này?** Nếu insert con trước cha, FK sẽ từ chối (con trỏ vào cha chưa có). Nếu delete cha trước con, FK cũng từ chối (con vẫn trỏ vào cha đã xóa). Với unique constraint: insert trước delete có thể bị Blocked nếu cùng key. Với FK: insert cha trước con, delete con trước cha — thứ tự insert → update → delete tự động đảm bảo điều đó.

Ví dụ: persist order (cha), persist order_line (con) → flush gửi INSERT orders trước, INSERT order_line sau. Xóa order_line trước, xóa order sau → flush gửi DELETE order_line trước, DELETE orders sau.

~~~java
// Code Java:
em.persist(order);       // thêm insert action
em.persist(line);        // thêm insert action
em.remove(line2);        // thêm delete action
// Flush → SQL:
//   INSERT INTO orders(id) VALUES(1)
//   INSERT INTO order_line(id) VALUES(10)
//   DELETE FROM order_line WHERE id=11
~~~

| Loại | thứ tự trong ActionQueue | Lý do |
|---|---|---|
| Insert | theo thứ tự đăng ký | insert cha trước con (FK) |
| Update | sau insert, trước delete | dirty checking |
| Delete | cuối cùng | delete con trước cha (FK) |

### Lỗi hay gặp trên production
- **Xóa rồi thêm cùng unique key vẫn lỗi**: bảng có unique constraint trên email. Trong một transaction: xóa user email a@x.com, thêm user mới cùng email. Flush gửi INSERT trước DELETE → INSERT thấy a@x.com vẫn còn (chưa bị xóa) → vi phạm unique. Cách sửa: gọi {{em.flush()}} giữa hai thao tác (gửi DELETE xuống DB trước khi INSERT), hoặc dùng UPDATE thay vì delete+insert, hoặc cấu hình deferred constraint ở DB (PostgreSQL) nhưng Hibernate không tự bật.
- **Persist con trước cha mà không cascade**: ActionQueue sắp xếp insert theo thứ tự đăng ký, nếu persist con trước cha mà không có cascade PERSIST, FK fail. Luôn set cascade đúng hoặc persist cha trước.
- **Bulk delete + insert cùng unique key**: nên dùng UPDATE hoặc flush rõ ràng giữa chừng.
- **Deferred constraint (PostgreSQL)** cho phép insert/delete trong transaction rồi kiểm tra lúc commit, nhưng Hibernate không tự bật; phải cấu hình DB.
- **Khi debug**: bật {{hibernate.show_sql}} và {{format_sql}} để xem thứ tự thực tế; so sánh với code để hiểu ActionQueue. Log SQL thường không khớp với code Java — đó là hiện tượng bình thường.

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
check:[{q:'Hibernate flush theo thứ tự nào?',options:['Theo thứ tự bạn gọi persist/remove','insert → update → delete','delete → update → insert','Ngẫu nhiên'],answer:1,explain:`ActionQueue sắp xếp insert trước, update giữa, delete sau để insert cha trước con và delete con trước cha, tôn trọng FK và constraint.`},{q:'Trong một transaction bạn xóa user email a@x.com rồi thêm user mới cùng email. Điều gì xảy ra lúc flush?',options:['Hibernate tự sắp xếp delete trước insert','INSERT chạy trước DELETE → vi phạm unique','Không có SQL nào','Hibernate ném lỗi compile'],answer:1,explain:`Hibernate flush insert trước delete, nên INSERT chạy khi bản ghi cũ chưa bị xóa → unique constraint bị vi phạm. Cách sửa: gọi flush() giữa hai thao tác, hoặc dùng UPDATE.`},{q:'Vì sao ActionQueue không gửi SQL theo thứ tự bạn gọi persist/remove?',options:['Để giảm số câu SQL','Để insert cha trước con và delete con trước cha, tôn trọng FK và constraint','Vì database yêu cầu','Để tái dùng prepared statement'],answer:1,explain:`Nếu gửi theo thứ tự gọi, persist con trước cha sẽ vi phạm FK; remove cha trước con cũng vi phạm. ActionQueue sắp xếp để an toàn. Đây là lý do log SQL thường không khớp với code Java.`},{q:'Cách nào sửa lỗi "xóa rồi thêm cùng unique key" trong cùng transaction?',options:['Gọi flush() giữa hai thao tác để gửi DELETE xuống DB trước khi INSERT','Chờ commit rồi làm lại','Dùng UPDATE thay vì delete+insert, hoặc flush giữa chừng','Bỏ unique constraint'],answer:2,explain:`Gọi em.flush() giữa hai thao tác: flush đầu tiên gửi DELETE xuống DB, sau đó INSERT mới không bị ngăn. Hoặc dùng UPDATE thay vì delete+insert. Deferred constraint ở DB cũng có thể giúp nhưng Hibernate không tự bật; cần cấu hình DB.`}],
  tags:['ActionQueue','flush order','unique constraint']
},
{
  id:'lesson-jpa-010',track:'jpa',order:10,title:'Transaction và persistence context: flush, commit, detach',level:'mid',minutes:25,
  goals:['Giải thích transaction là gì và tại sao các thao tác ghi dữ liệu phải nằm trong một transaction','Hiểu persistence context (EntityManager/Session của Hibernate): identity map, snapshot, dirty checking và khi nào Hibernate sinh SQL','Phân biệt flush và commit; biết rollback làm gì với dữ liệu vừa sửa','Biết detach/clear là gì và tại sao sửa entity sau khi transaction kết thúc bị bỏ qua lặng'],
  body:`**Tóm tắt:** Transaction là một nhóm các thao tác với database được xử lý như một đơn vị duy nhất: hoặc tất cả thành công, hoặc tất cả bị hủy (ví dụ chuyển tiền: trừ tài khoản A và cộng tài khoản B phải cùng xảy ra, không được một bên thành công một bên thất bại). Persistence context (EntityManager của JPA, Hibernate gọi là Session) là "bàn làm việc" gắn với một transaction: entity được load vào đây sẽ được theo dõi, và Hibernate tự sinh SQL khi flush hoặc commit. Sửa entity sau khi context đã đóng (detached) thì Hibernate không ghi gì và cũng không báo lỗi — dữ liệu vãng lại như chưa chạm.

### Transaction là gì, và tại sao cần
Transaction (giao dịch database) là một nhóm các thao tác đọc/ghi database được gói thành một đơn vị duy nhất: **hoàn thành hoàn toàn hoặc hủy hoàn toàn**. Hãy hình dung giao dịch ngân hàng: chuyển 100.000 từ tài khoản A sang B gồm hai bước — trừ A, cộng B. Nếu máy chủ mất điện đúng giữa chừng, không được phép chỉ trừ A mà không cộng B. Transaction đảm bảo: cả hai bước đều ghi vào database, hoặc cả hai đều bị hủy, cái nào cũng không xảy ra.

Trong Spring, bạn đánh dấu một method bằng {{@Transactional}}: Spring mở transaction trước khi method chạy và commit khi method kết thúc bình thường; nếu method ném exception, Spring rollback (hủy) mọi thay đổi đã làm trong method đó.

Ví dụ:
~~~java
@Transactional
public void transfer(long from, long to, long amount) {
    Account a = em.find(Account.class, from); // load A
    Account b = em.find(Account.class, to);   // load B
    a.setBalance(a.getBalance() - amount);    // sửa trong RAM, chưa gửi SQL
    b.setBalance(b.getBalance() + amount);    // sửa trong RAM, chưa gửi SQL
} // commit: Hibernate flush và ghi cả hai UPDATE xuống database
~~~

Nếu setBalance bị lỗi ở bước B, transaction rollback: việc trừ A cũng không được ghi vào database. Số tiền không bao giờ "bị mất vào không gian".

### Persistence context: "bàn làm việc" của EntityManager
EntityManager (JPA) hoặc Session (Hibernate) là đối tượng chính để ứng dụng nói chuyện với database. Mỗi EntityManager giữ một **persistence context**: vùng nhớ chứa các entity mà nó đang **quản lý (managed)**. Hãy hình dung đó là một bản nháp in chậm: bạn sửa trên bản nháp, dữ liệu mới được in ra giấy (ghi vào database) khi flush hoặc commit.

Bên trong persistence context có **identity map**: một map có khoá là (loại entity, id), giá trị là object Java. Khi gọi {{em.find(Account.class, 7L)}}:
1. Hibernate tra map trước. Nếu đã có object id 7, trả về đúng object đó, không chạy SQL.
2. Nếu chưa có, chạy SELECT, tạo object, đưa vào map rồi trả về.

Vì vậy trong cùng một transaction, {{find}} hai lần cùng id trả về **cùng một instance** ({{a1 == a2}} là true). Cache này chỉ sống trong một persistence context; transaction khác có map riêng.

Khi nạp entity, Hibernate lưu thêm một **snapshot**: ảnh chụp giá trị các field lúc đọc (bản sao giá trị, không phải tham chiếu tới object). Setter chỉ đổi object trong RAM, chưa chạy SQL. Đến lúc flush, Hibernate duyệt các entity managed, so sánh từng field với snapshot; field nào khác thì sinh UPDATE. Đó là **dirty checking**: với entity đang managed, bạn **không cần** gọi {{save}}.

~~~java
@Transactional
public void rename(long id) {
    Account a = em.find(Account.class, id); // SELECT; a managed, snapshot = {name: "Lan"}
    a.setName("Mai");                       // chỉ đổi object trong RAM, chưa có SQL
} // commit → flush: so với snapshot, thấy name khác → sinh UPDATE
~~~

### Flush khác commit, và cả hai khác rollback
**Flush** = gửi các câu SQL đang chờ xuống database, **vẫn trong khoảng thời gian transaction còn mở**. **Commit** = kết thúc transaction: thay đổi trở nên bền vững và transaction khác mới nhìn thấy được.

| | Flush | Commit |
|---|---|---|
| Ý nghĩa | Gửi SQL chờ xuống database | Kết thúc transaction |
| Dữ liệu bền vững? | Chưa (vẫn có thể rollback) | Có |
| Transaction khác nhìn thấy? | Chưa | Có |
| Sau đó transaction vẫn mở? | Có | Không |

Flush xảy ra:
- tự động trước commit;
- trước một câu query JPQL có thể bị ảnh hưởng bởi thay đổi đang chờ (FlushMode mặc định là AUTO), để query thấy dữ liệu mới nhất;
- khi bạn gọi {{em.flush()}} thủ công.

Sau flush, transaction vẫn có thể rollback và mọi SQL đã flush bị hủy. Vì vậy flush **không phải** tín hiệu "dữ liệu đã lưu".

~~~text
begin transaction
   SELECT * FROM account WHERE id = 1   -- load vào persistence context, lưu snapshot
   setName("Mai")                       -- chỉ sửa RAM
   flush()                              -- gửi UPDATE xuống database (chưa bền vững)
commit                                   -- dữ liệu bền vững, context thường bị xóa
~~~

Nếu thay commit bằng **rollback**, mọi thay đổi trong transaction bị hủy, database quay về như chưa có transaction này, và persistence context bị xóa sạch.

### Bốn trạng thái của entity
| Trạng thái | Nghĩa | Sửa field thì sao? |
|---|---|---|
| New/transient | Vừa {{new}}, chưa persist | Không ai theo dõi; cần {{persist}} hoặc cascade |
| Managed | Đang nằm trong persistence context | Phát hiện lúc flush, tự sinh UPDATE |
| Detached | Từng managed nhưng context đã đóng, clear hoặc detach | Không được theo dõi, không tự ghi |
| Removed | Đã gọi {{remove}} | Sinh DELETE lúc flush |

### Detach và clear: setter bị bỏ qua lặng
{{em.detach(entity)}} gỡ một entity ra khỏi persistence context; {{em.clear()}} gỡ hết. Entity đã detach không còn được Hibernate theo dõi: bạn gọi setter, object trong RAM đổi, nhưng không sinh SQL nào, và Hibernate cũng không báo lỗi.

Lỗi hay gặp: transaction kết thúc (commit hoặc rollback) thì persistence context thường bị xóa, mọi entity bạn đang giữ trong biến trở thành **detached**. Nếu bạn hoặc tầng gọi tiếp (ví dụ controller) sửa field trên entity đó rồi hy vọng lưu lại, dữ liệu vãng lại lặng lên. Spring Data {{save()}} trên entity detached thực ra gọi {{merge()}}: Hibernate tìm (hoặc nạp) instance managed cùng id, chép state từ object của bạn sang instance đó, rồi trả về **instance managed mới**. Object bạn truyền vào vẫn detached — nên phải dùng giá trị trả về: {{account = repo.save(account)}}.

### Ví dụ đời thực: import 500.000 sản phẩm trong một transaction
Một job import giá cho 500.000 sản phẩm trong **một** transaction: load hết 500.000 entity rồi sửa từng cái. Persistence context giữ 500.000 entity **cùng cả 500.000 snapshot** → heap phình lên 4GB, và mỗi lần flush Hibernate phải so sánh từng entity với snapshot → mất 9 phút, full GC liên tục.

Điều tra phát hiện gốc rễ: persistence context lớn quá và flush quét toàn bộ mỗi lần. Cách sửa: xử lý theo chunk (ví dụ 1.000 entity), mỗi chunk persist xong gọi {{flush()}} rồi {{clear()}}. **Phải flush trước clear**, nếu không thay đổi chưa gửi xuống database sẽ bị mất. Kết quả: thời gian còn 60 giây, heap tối đa khoảng 400MB.

### Trả lời mẫu khi phỏng vấn
"Transaction là nhóm các thao tác database thành một đơn vị all-or-nothing: hoặc tất cả thành công, hoặc tất cả bị hủy; trong Spring tôi đánh dấu method bằng @Transactional. Persistence context là EntityManager theo dõi các entity đã load: có identity map (cùng id trong một transaction trả về cùng object) và snapshot, nên sửa setter trên managed entity đủ, Hibernate tự sinh UPDATE khi flush. Flush gửi SQL xuống database nhưng transaction vẫn mở, có thể rollback; commit thì dữ liệu bền vững và context thường bị xóa, biến entity thành detached — sửa entity detached sẽ bị Hibernate bỏ qua lặng. Vì vậy import lớn tôi chia chunk, flush rồi clear mỗi chunk (flush trước clear), và dùng read-only transaction cho endpoint chỉ đọc."

### Liên hệ phỏng vấn
1. **"Transaction kết thúc rồi entity bạn giữ trong biến có còn được Hibernate theo dõi không?"** — Không. Sau commit (hoặc rollback) persistence context thường bị xóa, entity trở thành detached, setter không còn sinh SQL. Muốn ghi lại phải load lại entity hoặc dùng giá trị trả về của {{save()}}/{{merge()}} (instance managed mới).
2. **"Flush khác commit ở chỗ nào?"** — Flush gửi các câu SQL đang chờ xuống database nhưng transaction vẫn còn mở, nên vẫn có thể rollback hết. Commit kết thúc transaction, dữ liệu trở nên bền vững và transaction khác mới nhìn thấy.
3. **"Vì sao import lớn phải flush rồi clear theo chunk?"** — Mỗi entity managed tốn RAM (object và snapshot), mỗi flush duyệt tất cả entity managed. Chunk giữ persistence context nhỏ; flush trước clear để thay đổi đã được gửi xuống database trước khi giải phóng context.`,
  exercises:[{title:'Unit of Work: load, sửa, flush, commit, detach, rollback',prompt:`Mô phỏng persistence context (unit of work) bằng class {{UnitOfWork}} quản lý entity {{Account}} (có {{id}} và {{name}}):
- {{load(id, name)}}: nếu id đã có trong identity map thì trả về **cùng object** cũ (bỏ qua {{name}} truyền vào); nếu chưa thì tạo {{Account}}, đưa vào identity map và lưu snapshot (bản sao giá trị {{name}}).
- {{setName(id, name)}}: nếu entity đang được quản lý thì đổi {{name}} trong RAM; nếu không (đã detach) thì không làm gì cả.
- {{flush()}}: với mỗi entity đang được quản lý (theo thứ tự load), so {{name}} hiện tại với snapshot; khác thì thêm câu {{"UPDATE account SET name='<name>' WHERE id=<id>"}} vào danh sách trả về, và cập nhật snapshot. Entity không đổi thì không có câu SQL.
- {{commit()}}: xóa toàn bộ persistence context (mọi entity trở thành detached).
- {{detach(id)}}: gỡ một entity ra khỏi context.
- {{rollback()}}: khôi phục giá trị của mọi entity đang quản lý về snapshot (hủy mọi thay đổi chưa flush).`,
  starter:`class Account {long id;String name;Account(long i,String n){id=i;name=n;}}
class UnitOfWork {
    Account load(long id,String name){throw new UnsupportedOperationException("TODO");}
    void setName(long id,String name){throw new UnsupportedOperationException("TODO");}
    List<String> flush(){throw new UnsupportedOperationException("TODO");}
    void commit(){throw new UnsupportedOperationException("TODO");}
    void detach(long id){throw new UnsupportedOperationException("TODO");}
    void rollback(){throw new UnsupportedOperationException("TODO");}}`,
  tests:`public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }
    public static void main(String[] args) {
        UnitOfWork u = new UnitOfWork();
        Account a = u.load(1, "A");
        check("cung id tra ve cung object", a == u.load(1, "Z"), "khac instance");
        check("giu trang thai cu khi load lai", "A".equals(a.name), "name = " + a.name);
        List<String> s = u.flush();
        check("flush trong khi khong sua", s.isEmpty(), "sql = " + s);
        u.setName(1, "B");
        s = u.flush();
        check("phat hien sua ten", s.equals(List.of("UPDATE account SET name='B' WHERE id=1")), "sql = " + s);
        s = u.flush();
        check("sau flush thi sach", s.isEmpty(), "sql = " + s);
        u.detach(1);
        u.setName(1, "C");
        s = u.flush();
        check("da detach thi khong the theo doi", s.isEmpty(), "sql = " + s);
        u.load(2, "P");
        u.setName(2, "Q");
        s = u.flush();
        check("ghi entity moi", s.equals(List.of("UPDATE account SET name='Q' WHERE id=2")), "sql = " + s);
        u.rollback();
        List<String> s2 = u.flush();
        check("rollback huy het", s2.isEmpty(), "sql = " + s2);
        u.setName(2, "R");
        u.rollback();
        Account b = u.load(2, "X");
        check("rollback da khoi phuc gia tri cu", "Q".equals(b.name) && b == u.load(2, "Y"), "name = " + b.name);
        u.commit();
        u.setName(2, "R");
        s = u.flush();
        check("sau commit entities la detached", s.isEmpty(), "sql = " + s);
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  reference:`class Account {long id;String name;Account(long i,String n){id=i;name=n;}}
class UnitOfWork {
    Map<Long,Account> managed=new LinkedHashMap<>();   // identity map, giu thu tu load
    Map<Long,String> snapshot=new HashMap<>();         // snapshot: ban sao gia tri, khong phai tham chieu
    Account load(long id,String name){
        Account a=managed.get(id);
        if(a!=null)return a;
        a=new Account(id,name);managed.put(id,a);snapshot.put(id,name);return a;
    }
    void setName(long id,String name){
        Account a=managed.get(id);
        if(a!=null)a.name=name;                        // da detach thi lam giang
    }
    List<String> flush(){
        List<String> sql=new ArrayList<>();
        for(Account a:managed.values()){
            String old=snapshot.get(a.id);
            if(!Objects.equals(old,a.name)){
                sql.add("UPDATE account SET name='"+a.name+"' WHERE id="+a.id);
                snapshot.put(a.id,a.name);             // cap nhat snapshot de khong lap lai
            }
        }
        return sql;
    }
    void commit(){managed.clear();snapshot.clear();}   // ca het tro thanh detached
    void detach(long id){managed.remove(id);snapshot.remove(id);}
    void rollback(){
        for(Account a:managed.values())a.name=snapshot.get(a.id); // khoi phuc tu snapshot
    }
}`,
  hints:['Dung LinkedHashMap<Long, Account> lam identity map, giu thu tu load.','Snapshot phai la ban sao gia tri (String), khong phai tham chieu den Account.','flush: duyet managed, so name voi snapshot, khac thi them SQL va ghi de snapshot.','commit xoa ca map va snapshot; rollback gan lai name tu snapshot; detach chi xoa mot entity.'],
  explain:`Flush so sanh gia tri hien tai voi snapshot; chi field khac moi sinh SQL, sau flush Hibernate ghi de snapshot de lan sau khong lap lai cau SQL cu. Detach xoa entity khoi persistence context nen setter sau do khong duoc theo doi — bẫy "sua xong khong co gi xay ra". Commit xoa toan bo context, moi entity dang giu tro thanh detached; rollback khoi phuc gia tri tu snapshot, va vi flush chua ben cung du lieu cho nen khong co gi trong database bi thay doi.`,
  }],check:[{q:'Flush khac commit o dau?',options:['Flush dua SQL xu du DB van trong transaction (van rollback duoc); commit ket thuc transaction, du lieu ben cung','Commit chi xoa persistence context, flush moi dua SQL xu DB','Hai cung la cung mot luc: dua SQL va ket thuc transaction','Flush chi xay ra khi goi em.flush(), commit tu dong xay ra luon'],answer:0,explain:`Flush gui cac cau SQL dang cho xu xu database nhung transaction van con nen, nen van co the rollback. Commit ket thuc transaction, du lieu tro nen ben cung va transaction khac moi thay duoc. Co 3 lan flush tuong tu: truoc commit, truoc query JPQL (FlushMode AUTO), va khi goi em.flush() thu cong.`},{q:'Ban goi em.detach(entity) sau do goi setter sua field. Luc commit, Hibernate co sinh UPDATE khong?',options:['Co, Hibernate luon ghi entity da duoc load','Khong; entity da detached boi detach nen setter khong duoc theo doi, khong co SQL','Co nhung chi neu co cascade','Chua biet, phu thuoc database'],answer:1,explain:`Detach xoa entity khoi persistence context, Hibernate bo qua no: setter doi object trong RAM nhung khong sinh SQL, cung khong bao loi. Day la bat "sua xong mat ma khong biet sao".`},{q:'Transaction bi rollback sau khi da goi em.flush(). Du lieu vua flush co nam trong database khong?',options:['Co, flush da dua SQL xu DB nen khong the hoan tac','Khong; rollback huy tat ca thay doi trong transaction, database quay lai nhu chua co transaction','Co phan, chi luu cac cau da flush truoc commit','Chua biet'],answer:1,explain:`Flush chua la ket thuc transaction; rollback huy het, cac cau SQL da gui van trong khoang transaction va bo qua. Chi commit moi lam du lieu ben cung.`}],related:['jpa-002'],tags:['transaction','persistence context','dirty checking','flush','detach']
},
{
  id:'lesson-jpa-011',track:'jpa',order:11,title:'Optimistic locking voi @Version: chan lost update va retry',level:'senior',minutes:25,
  goals:['Giải thích lost update (mat cap nhat) va tai sao isolation mac dinh cua database khong chong duoc','Hieu @Version sinh cau UPDATE co dieu kien version, va chac lan gi xay ra khi version da doi','Biet retry sau OptimisticLockException phai lam gi: transaction moi, doc state moi, ap dung lai y dinh, gioi han so lan','So sanh optimistic locking voi pessimistic lock (SELECT FOR UPDATE) va biet chon cai nao'],
  body:`**Tóm tắt:** Lost update (mất cập nhật) xảy ra khi hai transaction cùng đọc một giá trị, cùng tính toán trong ứng dụng rồi cùng ghi, và lần ghi sau silently ghi đè mất lần ghi trước — database ở mức isolation mặc định (READ COMMITTED) không báo lỗi vì hai câu UPDATE đều hợp lệ. @Version giải quyết bằng cách thêm cột version vào entity; mỗi UPDATE kèm điều kiện {{WHERE version = ?}}. Nếu transaction khác đã sửa hàng này, số hàng bị ảnh hưởng là 0 và Hibernate ném exception. Sau exception phải mở transaction mới, đọc lại trạng thái mới, và áp dụng lại ý định (không ghi lại kết quả cũ), với số lần thử bị giới hạn.

### Lost update: khi hai lan ghi de lai nhau
Lost update (mất cập nhật) là tình huống hai người cùng sửa một bản ghi mà thay đổi của người đầu tiên biến mất. Ví dụ:
- Nhân viên A mở sản phẩm, tồn kho hiện 10. A bán 3 nên tính 10 − 3 = 7.
- Nhân viên B cũng mở cùng sản phẩm, tồn kho vẫn 10 (B đọc trước khi A lưu). B nhập thêm 5 nên tính 10 + 5 = 15.
- A lưu trước (ghi 7), B lưu sau (ghi 15). Kết quả là 15, sai: đúng là 12. Thay đổi của A bị **ghi đè âm thầm**. Đó là lost update.

~~~text
A: SELECT stock=10    B: SELECT stock=10
A: tinh 7             B: tinh 15
A: UPDATE stock=7     B: UPDATE stock=15   <-- mat 3 san pham cu A
~~~

Database ở mức isolation mặc định (READ COMMITTED) không ngăn được: hai câu UPDATE đều hợp lệ, database không biết chúng sinh ra từ hai bản đọc khác nhau. Vì vậy cần cơ chế khác, ví dụ @Version.

### @Version va cau UPDATE co dieu kien version
Them mot cot {{version}} vao entity (Java 17, Spring Boot 3, Hibernate 6):

~~~java
@Entity
class Product {
    @Id Long id;
    int stock;
    @Version int version;   // Hibernate tu quan ly, ung dung khong tu tang
}
~~~

Khi flush mot thay doi, Hibernate sinh:

~~~sql
UPDATE product SET stock = ?, version = 5 WHERE id = ? AND version = 4
~~~

Cau UPDATE chi ket hop (match) hang neu version trong database **van con la 4**, tuc chua ai sua tai khoan cua ban doc. Database thuc hien kiem tra va ghi trong **cung mot cau lenh nguyen tu**, nen khong co kho het giua "kiem tra" va "ghi". Neu so hang bi anh huong la 0 (da co nguoi tang version, hoac hang bi xoa), Hibernate nem {{StaleObjectStateException}}, JPA boi thanh {{OptimisticLockException}}, va Spring dich thanh {{ObjectOptimisticLockingFailureException}}.

~~~text
A doc v4  -> UPDATE ... WHERE version=4 -> 1 hang -> v5, thanh cong
B doc v4  -> UPDATE ... WHERE version=4 -> 0 hang -> exception
B mo transaction moi -> doc v5 -> ap dung lai "nhap them 5" -> UPDATE ... WHERE version=5 -> thanh cong
~~~

Goi la "optimistic" (lach quan) vi khong giu khoa gi trong database trong khi nguoi dung suy nghinh hay may tinh toan; chi phat hien xung dot luc ghi. @Version cung duoc kiem tra khi {{merge}} mot entity detached: neu version trong object cu hon database thi cung bi tu choi, rat co ich cho form web mo lau.

### Cac buoc tu doc den commit
Khi mot transaction doc entity co {{@Version}}, Hibernate lam cac buoc sau:

1. **SELECT**: Hibernate doc cac cot cua entity, trong do cot {{version}}. Luu gia tri nay vao **snapshot** (anh chup gia tri, khong phai tham chieu).
2. **Sua trong RAM**: ban goi setter tren entity managed. Chi doi object Java, chua phat sinh SQL. Snapshot van giu gia tri cu.
3. **Flush**: truoc commit, Hibernate duyet entity managed, so field hien tai voi snapshot. Entity khac thi sinh UPDATE.
4. **UPDATE co dieu kien version**: cau UPDATE sinh ra la {{UPDATE product SET stock = ?, version = ? WHERE id = ? AND version = ?}}. Cau nay la compare-and-set nguyen tu: database kiem tra version trong DB con la khi doc khong, neu khong thi anh huong 0 hang.
5. **Ket qua**: anh huong 1 hang -> commit thanh cong, version tang. Anh huong 0 hang -> Hibernate nem {{StaleObjectStateException}}, JPA boi thanh {{OptimisticLockException}}, Spring dich thanh {{ObjectOptimisticLockingFailureException}}.

Tai sao phai lam nhu the? Vi optimistic locking **khong giu kho** trong khi nguoi dung suy nghinh (khac pessimistic lock kho hang trong DB trong toan bo transaction). Uu diem: khong gay block, khong deadlock, phu hop voi doc nhieu ghi it. Nhuoc diem: phai retry hoac tra 409 khi xung dot.

### Retry dung cach
Khong the gui lai UPDATE voi version cu — no se fail mai. Retry dung nghia la:
1. Mo **transaction moi** (transaction cu da bi danh dau rollback-only, khong dung tiep duoc).
2. Doc lai state moi (version moi).
3. Ap dung lai **y dinh** (vi "cong them 5"), khong ghi lai **ket qua** da tinh (15).
4. Gioi han so lan (vi du 3), co backoff nho khi tai cao.

Vay retry phai dat **ben ngoai** method {{@Transactional}}: mot method khac goi vao service transactional qua proxy, hoac {{@Retryable}} cua Spring Retry dat lop ngoai. Bat exception ben trong cung transaction roi thu lai la sai.

Khong retry mu vi thao tac co side effect ngoai database (gui email, goi cong thanh toan): dung idempotency key hoac outbox. Va khong phai xung dot nao cung nen retry: neu nguoi dung quyet dan du lieu da thay doi (gia moi, han muc moi), hien tra HTTP 409 de ho xem lai.

| Chien luoc | Chon khi | Cai gia |
|---|---|---|
| Optimistic (@Version) | xung dot hiem, doc nhieu ghi it, thao tac dai | phai retry hoac tra 409 |
| Pessimistic ({{PESSIMISTIC_WRITE}}, SELECT ... FOR UPDATE) | tranh chap cao tren it hang nong, xu ly ngan | giu kho, cho, timeout, deadlock |

### Bat tai production
- **Bulk JPQL** ({{UPDATE Product p SET p.stock = 0}}) khong tu tang version, nen cac transaction khac khong phat hien xung dot. Phai tu tang ({{SET p.version = p.version + 1}}; HQL co cuc phap {{UPDATE VERSIONED}}) va clear persistence context.
- **Retry vo han** lam tai tang trong luc database dang tranh chap. Do ti le conflict va gioi han so lan.
- **@Version chi bao viet tung hang**. Rang truoc tren nhieu hang (vi du tong ca truc >= 2 nguoi) can unique/check constraint hoac khoa khac.
- **Hang "nong"** (mot bo dem moi cung request cung sua) se conflict lien tuc; optimistic khong hop, can nhac UPDATE nguyen tu {{SET stock = stock - 1 WHERE stock > 0}} hoac pessimistic lock.

### Vi du doi thuc: he thong dat ve phong kham
Benh vien co 30.000 benh nhan/ngay, 80% luot khoa tac chi doc lich kham, 20% dat/luu lich. Mot gio cao diem, 3 nhan vien vien phi cung mo form chinh sua sua khoa cua bac thuoc 42: A sua gio kham, B sua phong kham, C sua gia, ba cung doc version = 11. A luu dau tien (version 12 thanh cong). B luu sau: version DB da 12 khac 11 -> 0 hang -> ObjectOptimisticLockingFailureException -> API tra 409 ke version moi, giao dien bao "Khoa da du nguoi khac cap nhat, tai lai?". C nhan 409, tai lai form, ap dung lai sua gia cua minh, luu thanh cong. Ket qua: 0 ca mat cap nhat, ty le 409 duoi 1% va duoc bao dong de phat hien UI cache qua lau.

### Tra loi mau khi pham van
"Em xac dinh lost update: hai transaction cung doc mot gia tri, cung tinh trong ung dung, cung ghi, lan ghi sau de mat lan truoc; DB o READ COMMITTED khong bao loi. Em giai quyet theo thu tu uu tien: neu phep tinh bieu dien bang SQL (tru ton kho) thi day vao cau UPDATE nguyen tu co dieu kien; neu sua nhieu truong qua form, em dung @Version va tra 409 de nguoi dung tai lai. Sau OptimisticLockException, em mo transaction moi, doc lai entity (version moi), ap dung lai y dinh khong ghi lai ket qua cu, gioi han 3 lan co backoff. Khong retry trong cung transaction vi da rollback-only. Neu xung dot rat cao (bo dem hang chuc nghin request/giay), em chuyen sang SELECT FOR UPDATE hoac UPDATE nguyen tu. Luon co buoc doi soat de sua du lieu da sai."

### Lien he pham van
1. **"Cau UPDATE co dieu kien version lam gi, va tai sao no chong duoc lost update?"** — Hibernate them cot version moi thanh ghi. Luc flush, UPDATE cot cot cua entity them {{WHERE version = ?}} voi version ban doc. Neu nguoi khac da sua, version DB da doi, UPDATE anh huong 0 hang, Hibernate nem OptimisticLockException. No la compare-and-set nguyen tu o cap database.
2. **"Retry sau OptimisticLockException phai lam gi?"** — Mo transaction **moi**, doc lai entity (version moi), ap dung lai **y dinh** (vi cong them 5), khong ghi lai ket qua cu. Gioi han 3 lan co backoff. Khong retry trong cung transaction (da rollback-only).
3. **"Khi nao chon pessimistic lock thay vi @Version?"** — Tranh chap cao tren it hang nong (bo dem, dat ve phong kham) va xu ly ngan. @Version phu hop doc nhieu ghi it, form web mo lau. Pessimistic kho hang DB, co the deadlock, timeout.`,
  exercises:[{title:'Version check va retry (tai toan bo khoan)',prompt:`Mot tai khoan co {{balance}} va {{version}} (ca hai bat dau bang 0):
- {{update(expectedVersion, delta)}}: neu {{version}} hien tai khac {{expectedVersion}} thi tra {{false}} va **khong** doi gi; neu khop thi cong {{delta}} vao {{balance}}, tang {{version}} them 1 va tra {{true}} (giong UPDATE ... WHERE version = ?).
- {{credit(delta)}}: thu toi da **3 lan**; moi lan **doc version hien tai** roi goi {{update}}. Thanh cong thi dung. Sau 3 lan that bai niem {{IllegalStateException}}.`,
  starter:`class Wallet {long id;long balance;int version;Wallet(long i){id=i;}boolean update(int v,long d){throw new UnsupportedOperationException("TODO");}void credit(long d){throw new UnsupportedOperationException("TODO");}}`,
  tests:`public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }
    public static void main(String[] args) {
        Wallet w = new Wallet(1);
        check("update dau tien thanh cong", w.update(0, 100) && w.balance == 100 && w.version == 1, "balance=" + w.balance + ", version=" + w.version);
        check("version cu bi tu choi va khong doi gi", !w.update(0, 50) && w.balance == 100 && w.version == 1, "balance=" + w.balance + ", version=" + w.version);
        w.credit(30);
        check("credit doc version moi", w.balance == 130 && w.version == 2, "balance=" + w.balance + ", version=" + w.version);
        w.credit(20);
        check("credit lan hai", w.balance == 150 && w.version == 3, "balance=" + w.balance + ", version=" + w.version);
        // an writer khac chen vao giua: lan thu dau tien coi nhu version da doi
        Wallet flaky = new Wallet(2) {
            int calls;
            boolean update(int v, long d) { if (calls++ == 0) { version++; return false; } return super.update(v, d); }
        };
        flaky.credit(25);
        check("retry doc lai version sau xung dot", flaky.balance == 25 && flaky.version == 2, "balance=" + flaky.balance + ", version=" + flaky.version);
        int[] attempts = {0};
        Wallet busy = new Wallet(3) { boolean update(int v, long d) { attempts[0]++; return false; } };
        boolean thrown = false;
        try { busy.credit(7); } catch (IllegalStateException e) { thrown = true; }
        check("thu 3 lan roi niem exception", thrown && attempts[0] == 3, "thrown=" + thrown + ", attempts=" + attempts[0]);
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  reference:`class Wallet {long id;long balance;int version;Wallet(long i){id=i;}
    boolean update(int v,long d){
        if(version!=v)return false;   // giong UPDATE ... WHERE version = ? anh huong 0 hang
        balance+=d;version++;return true;
    }
    void credit(long d){
        for(int i=0;i<3;i++){
            int seen=version;            // doc lai state moi moi lan thu
            if(update(seen,d))return;    // ap dung lai y dinh (cong d), khong ghi lai ket qua cu
        }
        throw new IllegalStateException("conflict after 3 attempts");
    }
}`,
  hints:['update: so version truoc; khong khop thi return false ngay, khong doi balance/version.','credit: doc version **trong** vong lap, khong phai mot lan truoc vong lap.','Het 3 lan ma chua thanh cong thi throw new IllegalStateException(...).'],
  explain:`{{update}} mo phong compare-and-set ma database lam trong mot cau UPDATE co dieu kien version. Loi hay gap nhat la doc version **mot lan truoc vong lap**: sau khi xung dot, lan thu sau van dung version cu, nen lan nao cung that bai. Test {{flaky}} bat chinh loi nay. O ung dung thuc, moi lan thu la mot transaction moi (doc entity moi tu DB), vong retry o lop ngoai method @Transactional. Gioi han 3 lan giup khong khuong dia tai khi tranh chap cao.`,
  }],check:[{q:'Retry sau khi gap OptimisticLockException (Spring boi thanh ObjectOptimisticLockingFailureException) nen lam gi?',options:['Gui lai UPDATE voi version cu','Mo transaction moi, doc entity moi (version moi), ap dung lai y dinh, gioi han so lan','Xoa cot version de het loi','Bat exception roi thu lai trong cung transaction, retry den khi thanh cong'],answer:1,explain:`Version cu chac chan tiep tuc that bai. Transaction hien da bi danh dau rollback-only nen khong the tiep tuc trong no, va retry vo han khuong dia tai. Xoa version thi quay lai lost update. Cach dung: transaction moi, doc lai, ap dung lai y dinh, co gioi han.`},{q:'@Query("UPDATE Product p SET p.stock = 0") @Modifying co tu tang cot @Version khong?',options:['Co, Hibernate luon tang version','Chi khi co @Transactional','Khong; bulk DML bo qua entity, phai tu SET version = version + 1 (hoac UPDATE VERSIONED trong HQL)','Chi tren PostgreSQL'],answer:2,explain:`Bulk DML chay thang xu database, khong qua entity managed nen khong co tang version tu dong. Hanh vi nay khong phu thuoc loai database, va retry khong lien quan. Neu khong tu tang version, cac transaction dang giu ban cu se ghi de khong phat hien duoc.`},{q:'Khi nao chon pessimistic lock (SELECT ... FOR UPDATE) hon @Version?',options:['Xung dot cuc hiem','Tranh chap cao tren it hang nong, xu ly ngan','Muon tranh hoan toan deadlock','Nguoi dung mo form sua 10 phut'],answer:1,explain:`Tranh chap cao tren hang nong lam optimistic lien tuc that va retry; kho ngan hieu qua hon. Form mo 10 phut ma kho DB thi chan nguoi khac het thoi gian, nen optimistic hon hon. Xung dot hiem cung la dat cua optimistic. Pessimistic lock van **co the** gay deadlock khong phai tranh duoc.`}],related:['jpa-004'],tags:['optimistic locking','@Version','lost update','retry']
},
{
  id:'lesson-jpa-012',track:'jpa',order:12,title:'N+1 query: phát hiện, đo lường và khắc phục bằng fetch plan',level:'senior',minutes:30,
  goals:['Nhận diện N+1 trong log SQL và hiểu vì sao nó tốn kém','So sánh các chiến lược: fetch join, EntityGraph, batch fetching, DTO projection, hai query IN','Biết bẫy phân trang khi fetch join collection và cách xử lý','Viết code giảm N+1 xuống 2 query bằng mô phỏng repository đếm lượt gọi'],
  body:`### Hiểu nhanh
Bạn lấy 80 đơn hàng ({{Order}}) bằng một query (một câu lệnh SQL do Hibernate sinh ra), rồi trong vòng lặp gọi {{order.getLines()}}. Mỗi lần gọi, Hibernate phát thêm một SELECT để lấy lines (các dòng hàng) của đơn đó. Tổng cộng 1 + 80 = 81 query. Đó là **N+1**: 1 query cho danh sách cha (parent), N query cho con (child). Mỗi query chỉ mất khoảng 1 ms bên trong database, nhưng mỗi lần như vậy còn tốn round-trip mạng (thời gian đi và về giữa ứng dụng và database) và thời gian lấy connection từ pool (connection pool là tập kết nối được mở sẵn và tái sử dụng). Vì thế 81 query có thể biến một API 10 ms thành 150 ms; với 1.000 parent là vài giây.

~~~java
List<Order> orders = orderRepo.findAll();   // query 1: SELECT ... FROM orders
for (Order o : orders) {
    total += o.getLines().size();           // moi vong: SELECT ... FROM order_line WHERE order_id = ?
}
~~~

Test chỉ có 1 order thì chỉ thấy 2 query, nên N+1 thường lọt qua review. Muốn bắt được, test phải có nhiều parent và kiểm số query **không tăng theo** số parent.

### Phát hiện N+1 trong production
1. **Log SQL**: bật {{org.hibernate.SQL}} ở mức DEBUG, đếm số dòng SELECT trong một request.
2. **Statistics**: {{hibernate.generate_statistics=true}} + JMX hoặc Actuator endpoint {{/actuator/hibernate.statistics}} cho {{queryExecutionCount}}, {{entityLoadCount}}. (Actuator là module của Spring Boot mở các endpoint để xem số liệu vận hành.)
3. **APM** (Application Performance Monitoring — công cụ theo dõi hiệu năng như Datadog, New Relic, Elastic APM): xem span database, tức đoạn gọi xuống database trong một trace của request, và đếm số query mỗi request.
4. **Integration test assert**: dùng proxy DataSource đếm query (giống bài tập bên dưới) và assert {{queryCount <= expected}} (khẳng định số query không vượt ngưỡng mong đợi).
5. **Slow query log của DB**: N+1 thường xuất hiện là hàng loạt query giống nhau, cùng tham số khác nhau.

Khi thấy số query tỷ lệ thuận với số lượng entity cha, đó là N+1.

### LAZY hay EAGER đều không tự chữa N+1
- {{LAZY}} (tải lười) chỉ **trì hoãn** việc tải đến lúc truy cập. Truy cập trong vòng lặp thì mỗi lần là một query.
- {{EAGER}} (tải ngay) nghĩa là "phải có sẵn khi entity được tải", **không** có nghĩa "dùng JOIN". Với {{em.find}}, Hibernate có thể JOIN; nhưng với JPQL (ngôn ngữ query của JPA) {{SELECT o FROM Order o}}, câu SQL chỉ đọc bảng orders, rồi Hibernate phải chạy **thêm** query cho association EAGER của từng order: vẫn là N+1, và còn xảy ra ở mọi nơi load Order kể cả không cần dữ liệu đó.
- Theo chuẩn JPA, {{@ManyToOne}} và {{@OneToOne}} mặc định là EAGER. Nên ghi {{fetch = FetchType.LAZY}} từ mình rồi chọn fetch plan (kế hoạch tải dữ liệu) theo từng use case.

### Cách sửa: so sánh chi tiết
| Cách | Số query | Ưu điểm | Cạm bẫy |
|---|---|---|---|
| Fetch join / EntityGraph | 1 | Đơn giản, Hibernate tự loại parent trùng (Hibernate 6) | Nhân dòng; không phân trang an toàn khi fetch collection |
| Batch fetching ({{@BatchSize}} / {{hibernate.default_batch_fetch_size}}) | 1 + ceil(N/batch) | Ít sửa code, không cần đổi query | N rất lớn vẫn nhiều query; IN dài có thể chạm giới hạn tham số DB |
| DTO projection | 1 | Nhẹ nhất, đúng cột màn hình cần | Mỗi màn hình một query riêng |
| Hai query + IN | 2 | Kiểm soát hoàn toàn, không nhân dòng | IN quá dài (Oracle 1.000, SQL Server ~2.100) phải chia lô |

#### 1. Fetch join
~~~java
@Query("SELECT o FROM Order o JOIN FETCH o.lines WHERE o.status = :s")
List<Order> findWithLines(@Param("s") String status);
~~~
Từ Hibernate 6, kết quả tự loại parent trùng (không cần DISTINCT như Hibernate 5). Với collection, JOIN nhân dòng: order có 3 lines chiếm 3 dòng trong result set. Hibernate gom lại trong RAM.

#### 2. EntityGraph
~~~java
@EntityGraph(attributePaths = "lines")
List<Order> findWithLines();
~~~
Tách fetch plan ra khỏi query, tái dùng được cho nhiều method repository.

#### 3. Batch fetching
~~~java
@OneToMany(fetch = FetchType.LAZY)
@BatchSize(size = 50)
List<Line> lines;
~~~
Hoặc cấu hình toàn cục {{spring.jpa.properties.hibernate.default_batch_fetch_size=50}}. Khi bạn chạm vào lines của order đầu tiên, Hibernate tải lines cho tối đa 50 order đang chờ cùng lúc bằng {{WHERE order_id IN (...)}}. 80 order: 1 + 2 query thay vì 81.

#### 4. DTO projection
~~~java
@Query("SELECT new com.shop.OrderRow(o.id, o.total) FROM Order o")
List<OrderRow> findAllRow();
~~~
Không tạo entity, không có lazy, không N+1. Dùng cho màn hình chỉ đọc, danh sách lớn. (DTO = Data Transfer Object, object chỉ chứa dữ liệu cần trả về, không gắn với persistence context.)

#### 5. Hai query tự viết (bài tập bên dưới)
~~~text
orders = queryOrders()                 // query 1
lines  = queryLinesByOrderIds(ids)     // query 2: WHERE order_id IN (1, 2, 3)
group lines by orderId                 // ghep trong RAM, khong query trong vong lap
~~~
Đây là cách Hibernate batch fetching hoạt động bên dưới.

### Bẫy kinh điển: fetch join collection + phân trang
JOIN trả một dòng cho mỗi cặp (order, line): order có 3 lines chiếm 3 dòng. Nếu đặt {{LIMIT 20}} vào SQL, bạn có thể nhận 20 dòng thuộc 7 order, order cuối bị cắt mất lines. Hibernate biết điều này nên khi có {{JOIN FETCH}} collection kèm {{setMaxResults}} (hoặc {{Pageable}}), nó **không** đưa LIMIT xuống SQL mà tải **toàn bộ** kết quả rồi cắt trong RAM, chỉ in cảnh báo HHH90003004. Bảng 1 triệu order sẽ gây OOM (OutOfMemoryError — hết bộ nhớ heap). Bật {{hibernate.query.fail_on_pagination_over_collection_fetch=true}} để biến cảnh báo thành exception ngay khi test.

Cách đúng: phân trang **chỉ trên parent** (query 1 lấy 20 order), rồi tải lines cho 20 id đó (fetch join với {{WHERE o.id IN :ids}}, hoặc batch fetching).

### Production: số query không phải mục tiêu duy nhất
1 query trả 2 triệu dòng con tệ hơn 3 query nhỏ. Xem cả số dòng, payload (lượng dữ liệu truyền), thời gian DB và heap.

### Ví dụ đời thực: API đơn hàng chậm từ 50 ms lên 2 giây
Team có endpoint {{GET /orders}} trả 200 đơn hàng kèm lines. Dev mới viết JPQL đơn giản {{SELECT o FROM Order o}}. QA test 5 đơn hàng: 60 ms. Ra production, khách hàng 200 đơn hàng, mỗi đơn 5 lines: 1 + 200 = 201 query. Round-trip 1 ms/query -> khoảng 200 ms chỉ cho DB, cộng tranh chấp connection pool -> response chậm.

Điều tra: bật log SQL, thấy hàng loạt {{SELECT * FROM order_line WHERE order_id = ?}}. Sửa: thêm {{@EntityGraph(attributePaths = "lines")}} vào method repository. Kết quả: 1 query JOIN, response 80 ms. Cảnh báo HHH90003004 xuất hiện vì dùng Pageable -> chuyển sang phân trang parent + batch fetching cho lines. Kết quả cuối: 2 query, 40 ms.

### Trả lời mẫu khi phỏng vấn
"N+1 là 1 query cho parent, N query cho child khi duyệt collection lazy. Phát hiện bằng log SQL (hàng loạt query giống nhau), statistics (queryExecutionCount tăng theo parent), APM. Sửa: fetch join/EntityGraph cho trang chi tiết (1 query), batch fetching hoặc 2 query IN cho danh sách (kiểm soát số query), DTO projection cho read-only. Bẫy: fetch join collection + Pageable khiến Hibernate tải toàn bộ rồi cắt trong RAM (HHH90003004) -> phân trang parent rồi fetch child. Đừng bao giờ trả lời 'đổi sang EAGER'."

### Liên hệ phỏng vấn
Câu hay gặp: "Bạn phát hiện và sửa N+1 thế nào?" Nêu dấu hiệu (số query tăng theo số parent), cách đo (SQL log, statistics, APM), rồi chọn giải pháp theo use case: fetch join hoặc EntityGraph cho trang chi tiết, batch fetching hoặc hai query cho danh sách, DTO projection cho màn hình chỉ đọc. Giải thích thêm bẫy phân trang với collection fetch. Đừng trả lời "đổi sang EAGER".

> Senior tip: N+1 không phải lúc nào cũng là 81 query. Với 1 parent (trang chi tiết) chỉ là 2 query — test đơn giản sẽ bỏ qua. Luôn dùng proxy DataSource hoặc hibernate.generate_statistics để đếm số query thực tế, và assert số query không tăng theo số parent. Khi chọn giải pháp, ưu tiên DTO projection cho màn hình danh sách lớn: nó nhẹ nhất (chỉ chọn cột cần), không tạo entity, không có lazy loading, và dễ thêm caching ở tầng service. Fetch join/EntityGraph phù hợp trang chi tiết có ít parent; batch fetching hoặc 2 query IN phù hợp danh sách lớn khi không muốn nhân dòng. Đừng bao giờ dùng EAGER để "giải quyết" N+1 — nó không sinh JOIN và còn áp dụng everywhere, làm query chậm ở cả những nơi không cần association.
  `,exercises:[{title:'Giảm N+1 xuống hai query với repo đếm lượt gọi',prompt:`{{Repo}} đếm số lần gọi: {{a}} cho {{orders()}}, {{b}} cho {{lines(ids)}}. Cài {{Service.load()}} trả về map orderId -> danh sách sku, theo thứ tự order:
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
        check("exactly two queries", r.a == 1 && r.b == 1, "orders() goi " + r.a + " lan, lines() goi " + r.b + " lan");
        check("lines queried with all order ids", Set.of(1L, 2L, 3L).equals(r.lastIds), "ids = " + r.lastIds);
        check("multiple children", List.of("A", "B").equals(m.get(1L)), "order 1 = " + m.get(1L));
        check("parent without children is empty", m.get(2L) != null && m.get(2L).isEmpty(), "order 2 = " + m.get(2L));
        check("last child", List.of("C").equals(m.get(3L)), "order 3 = " + m.get(3L));
        check("keys in order", List.of(1L, 2L, 3L).equals(new ArrayList<>(m.keySet())), "keys = " + m.keySet());
        Repo empty = new Repo() { List<Order> orders() { a++; return List.of(); } };
        Map<Long, List<String>> e = new Service(empty).load();
        check("no orders: skip lines query", e.isEmpty() && empty.b == 0, "map = " + e + ", lines() goi " + empty.b + " lan");
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  reference:`record Order(long id){} record Line(long orderId,String sku){}
class Repo{int a,b;Set<Long> lastIds;List<Order> orders(){a++;return List.of(new Order(1),new Order(2),new Order(3));}List<Line> lines(Set<Long> ids){b++;lastIds=new HashSet<>(ids);return List.of(new Line(1,"A"),new Line(1,"B"),new Line(3,"C"));}}
class Service{Repo r;Service(Repo x){r=x;}
    Map<Long,List<String>> load(){
        List<Order> os=r.orders();                              // query 1
        Map<Long,List<String>> out=new LinkedHashMap<>();
        for(Order o:os)out.put(o.id(),new ArrayList<>());       // tao entry truoc: order rong van co mat
        if(out.isEmpty())return out;                            // khong co id thi khoi query 2
        for(Line l:r.lines(out.keySet()))out.get(l.orderId()).add(l.sku()); // query 2, nhom trong RAM
        return out;
    }
}`,
  hints:['Tạo entry (danh sách rỗng) cho mỗi order trước khi ráp line.','Gom id vào một Set rồi gọi lines(ids) đúng một lần, bên ngoài vòng lặp.','Kiểm tra trường hợp không có order trước khi gọi lines.'],
  explain:`Query 1 tải parent, query 2 tải mọi child theo tập id, rồi nhóm theo {{orderId}} trong RAM. Tạo entry trước giúp order không có line vẫn xuất hiện (giống LEFT JOIN). Bỏ qua query 2 khi tập id rỗng vì {{IN ()}} rỗng là SQL không hợp lệ ở nhiều database.
  Lỗi hay gặp: gọi {{lines(Set.of(o.id()))}} trong vòng lặp, tức chính là N+1. Trong thực tế còn phải chia tập id thành lô (ví dụ 500 id) khi danh sách lớn để không vượt giới hạn tham số của database. Đây cũng là cách Hibernate batch fetching hoạt động bên dưới.`
}, {title:'Batch fetching mô phỏng: hiểu cơ chế IN lô',prompt:`Mô phỏng batch fetching của Hibernate. {{BatchFetcher}} nhận {{batchSize}} và hàm {{loadAll(ids)}} trả về map id -> value.
- {{get(id)}}: nếu id đã có trong cache thì trả ngay; nếu chưa thì thêm id vào hàng đợi chờ.
- {{flush()}}: gom các id chờ, chia thành các lô kích thước {{batchSize}}, gọi {{loadAll}} cho mỗi lô, cập nhật cache, trả về số lô đã load.`,
  starter:`class BatchFetcher{int batchSize;Function<Set<Long>,Map<Long,String>> loader;Map<Long,String> cache=new HashMap<>();Set<Long> pending=new HashSet<>();BatchFetcher(int batchSize,Function<Set<Long>,Map<Long,String>> loader){this.batchSize=batchSize;this.loader=loader;}String get(long id){throw new UnsupportedOperationException("TODO");}int flush(){throw new UnsupportedOperationException("TODO");}}`,
  tests:`public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }
    public static void main(String[] args) {
        AtomicInteger calls = new AtomicInteger();
        BatchFetcher f = new BatchFetcher(3, ids -> {
            calls.incrementAndGet();
            Map<Long,String> m = new HashMap<>();
            for(long id:ids)m.put(id,"V"+id);
            return m;
        });
        check("cache miss adds to pending", f.get(1) == null, "get(1) should return null on cache miss");
        f.flush();
        check("first flush loads batch", "V1".equals(f.get(1)) && calls.get() == 1, "calls=" + calls.get());
        f.get(2); f.get(3); f.get(4); f.get(5); f.get(6); f.get(7); f.get(8);
        int loaded = f.flush();
        check("7 pending split into 3 batches of 3,3,1", loaded == 3 && calls.get() == 4, "loaded=" + loaded + ", calls=" + calls.get());
        check("all cached now", f.get(5).equals("V5") && calls.get() == 4, "calls=" + calls.get());
        BatchFetcher f2 = new BatchFetcher(2, ids -> { calls.incrementAndGet(); Map<Long,String> m=new HashMap<>(); for(long id:ids)m.put(id,"X"+id); return m; });
        f2.get(10); f2.get(11); f2.get(12);
        check("batch size 2: 3 ids -> 2 batches", f2.flush() == 2, "flush=" + f2.flush());
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  reference:`class BatchFetcher{int batchSize;Function<Set<Long>,Map<Long,String>> loader;Map<Long,String> cache=new HashMap<>();Set<Long> pending=new HashSet<>();BatchFetcher(int batchSize,Function<Set<Long>,Map<Long,String>> loader){this.batchSize=batchSize;this.loader=loader;}String get(long id){if(cache.containsKey(id))return cache.get(id);pending.add(id);return null;}int flush(){if(pending.isEmpty())return 0;List<Long> list=new ArrayList<>(pending);pending.clear();int batches=0;for(int i=0;i<list.size();i+=batchSize){int end=Math.min(i+batchSize,list.size());Set<Long> batch=new HashSet<>(list.subList(i,end));cache.putAll(loader.apply(batch));batches++;}return batches;}}`,
  hints:['Cache hit trả ngay, không thêm vào pending.','flush() chia pending thành các lô kích thước batchSize, gọi loader cho mỗi lô.','Trả về số lô đã load.'],
  explain:`Batch fetching gom các id đang chờ (pending) và tải theo lô (mệnh đề IN). Hibernate làm chính xác điều này: khi bạn chạm vào collection của entity đầu tiên, nó gom id của các entity cùng loại đang trong persistence context và tải theo batch. Test kiểm tra việc chia lô đúng kích thước và cache hit không gọi loader.`
}],check:[{q:'Đổi association sang {{FetchType.LAZY}} có tự loại bỏ N+1 không?',options:['Có, LAZY luôn sinh một JOIN','Có, vì LAZY bắt buộc dùng second-level cache','Không, truy cập association của từng parent trong vòng lặp vẫn phát một query mỗi lần','LAZY không dùng được với collection'],answer:2,explain:`LAZY chỉ hoãn thời điểm tải; truy cập trong vòng lặp vẫn N query. Cần fetch join, EntityGraph, batch fetching hoặc projection. LAZY không sinh JOIN (đó là việc của fetch join), không liên quan second-level cache, và collection mặc định đã là LAZY.`},{q:'Query có {{JOIN FETCH o.lines}} kèm phân trang 20 order/trang. Hibernate 6 xử lý thế nào?',options:['Tải toàn bộ kết quả rồi cắt trang trong RAM, chỉ in cảnh báo (trừ khi bật fail_on_pagination_over_collection_fetch)','Đưa LIMIT 20 xuống SQL và luôn trả đúng 20 order đầy đủ lines','Tự tách thành hai query: phân trang order rồi tải lines','Ném lỗi biên dịch JPQL'],answer:0,explain:`JOIN nhân dòng theo số line, nên LIMIT ở SQL sẽ cắt giữa collection. Hibernate vì vậy phân trang trong RAM và cảnh báo HHH90003004, rất nguy hiểm với bảng lớn. Nó không tự tách thành hai query (đó là việc bạn phải làm), và JPQL vẫn hợp lệ nên không có lỗi biên dịch.`},{q:'Bật {{hibernate.default_batch_fetch_size=50}}, load 120 order rồi duyệt lines của từng order. Khoảng bao nhiêu query?',options:['1','121','2','Khoảng 4: 1 query order + khoảng 3 query lines dạng IN'],answer:3,explain:`Batch fetching gom tối đa 50 khoá mỗi lần: 120 order cần khoảng 3 query IN cho lines, cộng 1 query order. Con số chính xác có thể khác một chút tuỳ cách Hibernate chia lô, nhưng không còn tăng theo từng order. 121 là N+1 không có batch; 1 hay 2 query chỉ đạt được bằng fetch join hoặc tự viết query IN không chia lô.`},{q:'Tại sao DTO projection không bao giờ bị N+1?',options:['Vì DTO luôn dùng fetch join','Vì projection chỉ chọn cột cần thiết, không tạo entity nên không có lazy loading','Vì Spring tự bật batch fetching cho DTO','Vì DTO dùng second-level cache'],answer:1,explain:`DTO projection ({{SELECT new DTO(...) FROM Entity}}) chạy một query SELECT đúng các cột cần, trả về object DTO thuần Java. Không có entity, không có proxy, không có lazy loading, do đó không bao giờ phát sinh query phụ.`}],related:['jpa-001','jpa-010','jpa-011','jpa-026','jpa-043','jpa-053'],tags:['N+1','batch fetching','fetch join','EntityGraph','DTO projection']
},
{
  id:'lesson-jpa-013',track:'jpa',order:13,title:'Vòng đời entity: transient, managed, detached, removed và merge vs persist',level:'senior',minutes:30,
  goals:['Phân biệt rõ 4 trạng thái: transient (new), managed, detached, removed','Hiểu merge không biến object đầu vào thành managed, mà trả về instance managed khác','Biết persist chỉ dùng cho entity mới (transient), merge dùng cho cả mới và detached','Mô phỏng persistence context với identity map, snapshot và chuyển trạng thái'],
  body:`### Hiểu nhanh
Entity JPA trải qua 4 trạng thái trong vòng đời: **transient (new)** -> **managed** -> **detached** (hoặc **removed**). Chỉ entity **managed** được Hibernate theo dõi và tự sinh SQL khi flush (flush = đẩy các thay đổi đang giữ trong RAM xuống database). **Persist** chỉ dành cho entity transient (chưa có trong DB/context). **Merge** dùng cho entity detached (đã có trong DB nhưng không còn trong context) — và quan trọng: merge **không biến object đầu vào thành managed**, nó chép state (dữ liệu các field) vào instance managed (nạp từ DB nếu cần) rồi trả về instance đó. Object bạn truyền vào vẫn detached.

### Bốn trạng thái chi tiết
| Trạng thái | Cách vào trạng thái này | Được Hibernate theo dõi? | Flush làm gì? |
|---|---|---|---|
| Transient (new) | {{new Entity()}}, chưa persist | Không | Không gì |
| Managed | {{persist()}}, {{find()}}, {{merge()}} trả về, load qua query | Có | So snapshot, sinh UPDATE/INSERT/DELETE |
| Detached | {{clear()}}, {{detach()}}, {{close()}}, commit (thường) | Không | Không gì (setter bị bỏ qua lặng lẽ) |
| Removed | {{remove()}} trên managed | Có (đánh dấu xoá) | Sinh DELETE |

### Persist: chỉ cho entity mới
{{em.persist(entity)}} chuyển entity từ **transient** sang **managed**. Entity phải **chưa có trong database** (id chưa được gán hoặc strategy là AUTO/SEQUENCE). Nếu persist entity đã có id (ví dụ detached), Hibernate ném {{EntityExistsException}}.

~~~java
@Transactional
public Order create(OrderDto dto) {
    Order o = new Order();
    o.setCustomer(dto.getCustomer());
    em.persist(o);        // o tro thanh managed, INSERT luc flush
    return o;
}
~~~

### Merge: cho entity detached (và cả transient)
{{em.merge(entity)}} tìm (hoặc nạp) instance managed cùng id, **chép state** từ object của bạn sang instance đó, rồi trả về **instance managed**. Object bạn truyền vào **vẫn detached**.

~~~java
@Transactional
public Order update(OrderDto dto) {
    Order detached = new Order();   // transient, nhung co id tu client
    detached.setId(dto.getId());
    detached.setTotal(dto.getTotal());
    Order managed = em.merge(detached);  // managed != detached
    return managed;                 // PHAI dung managed, khong phai detached
}
~~~

Spring Data {{repo.save(entity)}} gọi {{merge}} khi entity không "mới" (id khác null hoặc {{Persistable.isNew()}} trả false). Vì vậy **luôn dùng giá trị trả về**: {{order = repo.save(order)}}.

### Tại sao merge không làm object đầu vào thành managed?
Nếu merge biến object của bạn thành managed, Hibernate phải theo dõi object do ứng dụng tạo ra — có thể object đó được share ở chỗ khác, hoặc là DTO, hoặc immutable (bất biến). Thay vào đó, Hibernate quản lý **instance của riêng nó** (nạp từ DB hoặc tạo mới trong context), chép dữ liệu vào đó, và trả instance đó cho bạn. Instance của Hibernate nằm trong identity map (map khoá chính -> entity managed, đảm bảo mỗi id chỉ có một instance trong context), có snapshot (bản sao giá trị lúc nạp), được dirty checking (so sánh field hiện tại với snapshot để biết có thay đổi).

### Chuyển trạng thái thực tế
~~~text
new Order()                          -> transient
em.persist(order)                    -> managed
em.find(Order.class, 1L)             -> managed (load tu DB)
em.merge(detachedOrder)              -> tra ve managed, detachedOrder van detached
em.detach(managedOrder)              -> detached
em.clear() / commit / close          -> tat ca managed -> detached
em.remove(managedOrder)              -> removed (van managed cho den flush)
flush()                              -> removed -> DELETE, managed -> UPDATE, transient (qua persist) -> INSERT
rollback()                           -> managed khoi phuc snapshot, removed huy bo, transient khong doi
~~~

### Bẫy production hay gặp
1. **Sửa entity sau commit**: controller nhận entity từ service, transaction đã commit, entity detached. Controller sửa field rồi hy vọng lưu — **không có UPDATE**. Sửa: load lại entity trong transaction mới, hoặc dùng {{repo.save()}} (gọi merge) và dùng instance trả về.
2. **Persist entity có id**: {{em.persist(new Order(1L))}} ném {{EntityExistsException}} vì Hibernate nghĩ entity đã tồn tại. Dùng {{merge}} cho entity có id.
3. **Merge entity mới không có id**: {{merge(new Order())}} sẽ chạy INSERT (như persist) vì không có id để nạp. Nhưng object trả về mới là managed.
4. **Merge quên dùng kết quả**: {{em.merge(detached); detached.setName("X");}} — setter chạy trên detached, không có SQL. Phải dùng instance trả về.
5. **Cascade MERGE vs PERSIST**: {{@OneToMany(cascade = CascadeType.PERSIST)}} chỉ cascade persist, không cascade merge. Muốn merge con khi merge cha cần {{CascadeType.MERGE}} hoặc {{ALL}}. (Cascade = lan truyền thao tác từ cha xuống con.)
6. **Detached entity qua network (DTO)**: form web gửi JSON, server deserialize thành entity (có id). Entity này là detached. Gọi {{repo.save()}} (merge) là đúng, nhưng phải dùng instance trả về.

### Mô phỏng persistence context (bài tập bên dưới)
Bài tập cài {{PersistenceContextSimulator}} với:
- Identity map: map id -> entity managed
- Snapshot: bản sao giá trị lúc load/merge
- Trạng thái: transient, managed, detached, removed
- {{persist}}, {{merge}}, {{remove}}, {{detach}}, {{flush}}, {{commit}}, {{rollback}}
Giúp hình dung tại sao setter trên detached bị bỏ qua, tại sao merge trả về instance khác, và flush sinh SQL thế nào.

### Ví dụ đời thực: API cập nhật đơn hàng mất cập nhật
Khách hàng gọi {{PUT /orders/1}} với JSON {{"total": 500}}. Controller deserialize thành {{Order}} (id=1, total=500) — detached. Service gọi {{repo.save(order)}} nhưng **không dùng giá trị trả về**, mà trả về {{order}} cũ. Response 200 OK, nhưng database không đổi. Debug: log SQL rỗng. Nguyên nhân: {{save}} gọi {{merge}}, trả về managed instance mới, nhưng service trả về detached instance cũ. Sửa: {{return repo.save(order);}}. Test integration assert số query = 1.

### Trả lời mẫu khi phỏng vấn
"Entity JPA có 4 trạng thái: transient (new), managed (đang được theo dõi), detached (đã ra khỏi context), removed (đã xoá, chờ flush). Chỉ managed mới được dirty checking và sinh SQL. Persist chỉ cho transient; merge cho detached (và transient) — quan trọng: merge chép state vào instance managed của Hibernate và trả instance đó, object truyền vào vẫn detached. Vì vậy Spring Data save() phải dùng giá trị trả về. Sai lầm thường gặp: sửa entity sau commit (đã detached), persist entity có id, merge quên dùng kết quả."

### Liên hệ phỏng vấn
Câu hay gặp: "persist và merge khác nhau thế nào? Khi nào dùng cái nào?" Persist cho entity mới chưa có trong DB; merge cho entity đã có trong DB (detached) — merge trả về instance managed MỚI, object truyền vào vẫn detached. Nếu thêm: detach sau commit, setter bị bỏ qua, cascade MERGE vs PERSIST, và bẫy Spring Data save() quên dùng kết quả.

> Senior tip: Trong production, sai lầm thường gặp là controller nhận entity từ service, transaction đã commit (entity detached), rồi sửa field và hy vọng tự lưu — log SQL rỗng, response 200. Debug bằng cách thêm {{hibernate.show_sql}} và kiểm tra xem entity có trong managed map không. Luôn dùng {{return repo.save(entity);}} và dùng instance trả về. Với form web nhận JSON, entity deserialize luôn là detached — merge là đúng, nhưng phải dùng instance trả về. Khi cần update một field cụ thể mà không muốn load toàn bộ entity, dùng {{@Modifying @Query}} hoặc DTO projection thay vì merge toàn object.
  `,exercises:[{title:'Mô phỏng persistence context: trạng thái và flush',prompt:`Cài {{PersistenceContextSimulator}} quản lý entity {{Item}} (có {{id}} và {{name}}):
- {{load(id, name)}}: nếu id đã có trong identity map thì trả **cùng object** cũ (bỏ qua name); nếu chưa thì tạo {{Item}}, đưa vào managed map và lưu snapshot (bản sao name).
- {{persist(item)}}: item phải ở trạng thái **transient** (chưa có trong managed map, không có trong snapshot). Thêm vào managed map, lưu snapshot.
- {{merge(item)}}: nếu id đã có trong managed map thì chép name vào managed instance đó; nếu id có trong snapshot (đã từng load, giờ detached) thì nạp managed instance từ snapshot, chép name; nếu id hoàn toàn mới thì tạo managed instance mới. Trả về **managed instance** (khác với item truyền vào nếu item không phải managed instance đó). Lưu/cập nhật snapshot.
- {{remove(id)}}: chuyển entity sang trạng thái **removed** (xoá khỏi managed map, đưa vào removed set, giữ snapshot).
- {{detach(id)}}: chuyển entity sang **detached** (xoá khỏi managed map, giữ snapshot).
- {{flush()}}: duyệt managed map theo thứ tự load, so name với snapshot. Khác thì thêm {{"UPDATE item SET name='...' WHERE id=..."}}. Duyệt removed set, thêm {{"DELETE FROM item WHERE id=..."}}. Duyệt managed map các entity mới (persist) chưa có trong snapshot lúc load -> thêm {{"INSERT INTO item(id,name) VALUES(...)"}}.
- {{commit()}}: xoá toàn bộ managed map, removed set, snapshot (tất cả entity trở thành detached).
- {{rollback()}}: khôi phục name của managed entity từ snapshot; bỏ removed set (huỷ xoá); xoá entity vừa persist (chưa có snapshot).`,
  starter:`class Item {long id;String name;Item(long i,String n){id=i;name=n;}}
class PersistenceContextSimulator {
    Map<Long,Item> managed=new LinkedHashMap<>();   // identity map: id -> managed instance
    Map<Long,String> snapshot=new HashMap<>();      // snapshot: id -> name value
    Set<Long> removed=new HashSet<>();              // id da remove, cho DELETE
    Item load(long id,String name){throw new UnsupportedOperationException("TODO");}
    void persist(Item item){throw new UnsupportedOperationException("TODO");}
    Item merge(Item item){throw new UnsupportedOperationException("TODO");}
    void remove(long id){throw new UnsupportedOperationException("TODO");}
    void detach(long id){throw new UnsupportedOperationException("TODO");}
    List<String> flush(){throw new UnsupportedOperationException("TODO");}
    void commit(){throw new UnsupportedOperationException("TODO");}
    void rollback(){throw new UnsupportedOperationException("TODO");}}`,
  tests:`public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }
    public static void main(String[] args) {
        PersistenceContextSimulator ctx = new PersistenceContextSimulator();
        Item a = ctx.load(1, "A");
        check("load creates managed", a.name.equals("A") && ctx.flush().isEmpty(), "flush=" + ctx.flush());
        check("load same id returns same instance", ctx.load(1, "Z") == a, "khac instance");
        check("second load keeps original name", a.name.equals("A"), "name=" + a.name);
        a.name = "B";
        check("dirty tracking", ctx.flush().equals(List.of("UPDATE item SET name='B' WHERE id=1")), "flush=" + ctx.flush());
        check("snapshot updated after flush", ctx.flush().isEmpty(), "flush2=" + ctx.flush());
        ctx.detach(1);
        a.name = "C";
        check("detached changes ignored", ctx.flush().isEmpty(), "flush=" + ctx.flush());
        Item merged = ctx.merge(new Item(1, "D"));
        check("merge returns managed instance", merged != a, "merged == a la " + (merged == a));
        check("merge updates state", merged.name.equals("D") && ctx.flush().equals(List.of("UPDATE item SET name='D' WHERE id=1")), "flush=" + ctx.flush());
        ctx.remove(1);
        check("remove queues delete", ctx.flush().equals(List.of("DELETE FROM item WHERE id=1")), "flush=" + ctx.flush());
        ctx.commit();
        check("commit clears all", ctx.flush().isEmpty(), "flush=" + ctx.flush());
        PersistenceContextSimulator ctx2 = new PersistenceContextSimulator();
        Item p = new Item(10, "P");
        ctx2.persist(p);
        check("persist queues insert", ctx2.flush().equals(List.of("INSERT INTO item(id,name) VALUES(10,'P')")), "flush=" + ctx2.flush());
        PersistenceContextSimulator ctx3 = new PersistenceContextSimulator();
        ctx3.load(5, "X");
        ctx3.load(6, "Y");
        ctx3.remove(5);
        ctx3.rollback();
        check("rollback restores removed", ctx3.flush().isEmpty(), "flush=" + ctx3.flush());
        check("removed entity still accessible", ctx3.load(5, "Z").name.equals("X"), "name=" + ctx3.load(5, "Z").name);
        PersistenceContextSimulator ctx4 = new PersistenceContextSimulator();
        Item n = new Item(7, "N");
        ctx4.persist(n);
        ctx4.rollback();
        check("rollback drops new entity", ctx4.flush().isEmpty(), "flush=" + ctx4.flush());
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  reference:`class Item {long id;String name;Item(long i,String n){id=i;name=n;}}
class PersistenceContextSimulator {
    Map<Long,Item> managed=new LinkedHashMap<>();
    Map<Long,String> snapshot=new HashMap<>();  // chi luu state cua entity da co trong DB
    Set<Long> removed=new HashSet<>();
    Item load(long id,String name){
        Item m=managed.get(id); if(m!=null)return m;
        Item n=new Item(id,name); managed.put(id,n); snapshot.put(id,name); return n;
    }
    void persist(Item item){
        if(managed.containsKey(item.id) || snapshot.containsKey(item.id)) throw new IllegalArgumentException("not transient");
        managed.put(item.id,item);  // KHONG them vao snapshot - entity moi chua co trong DB
    }
    Item merge(Item item){
        Item m=managed.get(item.id);
        if(m!=null){ m.name=item.name; return m; }  // da managed, chi cap nhat name
        if(snapshot.containsKey(item.id)){
            // entity co trong DB (da load truoc do, gio detached)
            m=new Item(item.id,item.name); managed.put(item.id,m);  // KHONG cap nhat snapshot
            return m;
        }
        // entity hoan toan moi (id khong co trong DB)
        m=new Item(item.id,item.name); managed.put(item.id,m);  // KHONG them snapshot
        return m;
    }
    void remove(long id){
        Item m=managed.remove(id);
        if(m!=null){ removed.add(id); }
    }
    void detach(long id){
        managed.remove(id);
    }
    List<String> flush(){
        List<String> sql=new ArrayList<>();
        for(Item m:managed.values()){
            String old=snapshot.get(m.id);
            if(old==null){ sql.add("INSERT INTO item(id,name) VALUES("+m.id+",'"+m.name+"')"); snapshot.put(m.id,m.name); }
            else if(!Objects.equals(old,m.name)){ sql.add("UPDATE item SET name='"+m.name+"' WHERE id="+m.id); snapshot.put(m.id,m.name); }
        }
        for(long id:removed){ sql.add("DELETE FROM item WHERE id="+id); snapshot.remove(id); }
        removed.clear();
        return sql;
    }
    void commit(){ managed.clear(); snapshot.clear(); removed.clear(); }
    void rollback(){
        for(Item m:managed.values()){ String old=snapshot.get(m.id); if(old!=null)m.name=old; }
        for(long id:new ArrayList<>(removed)){ if(snapshot.containsKey(id)) managed.put(id,new Item(id,snapshot.get(id))); }
        removed.clear();
        managed.entrySet().removeIf(e -> !snapshot.containsKey(e.getKey()));
    }
}`,
  hints:['Managed map dùng LinkedHashMap để giữ thứ tự load.','Snapshot lưu giá trị (String), không lưu tham chiếu Item.','merge: ưu tiên managed instance sẵn có; nếu không có mà có snapshot thì nạp từ snapshot; nếu hoàn toàn mới thì tạo mới.','flush: INSERT cho entity mới persist (không có snapshot lúc load), UPDATE cho managed đã có snapshot mà name khác, DELETE cho removed.','commit xoá sạch tất cả. rollback khôi phục managed từ snapshot, bỏ removed, xoá entity vừa persist (không có snapshot).'],
  explain:`Bài tập mô phỏng cốt lõi persistence context: identity map, snapshot, và chuyển trạng thái. Lỗi hay gặp: merge không trả về managed instance (trả về object truyền vào), flush không sinh INSERT cho entity vừa persist, rollback không khôi phục đúng entity removed, commit không xoá snapshot. Hiểu mô hình này giúp debug "sửa xong không thấy UPDATE", "merge mà object cũ không đổi", "persist entity có id bị lỗi".`
}, {title:'Merge vs Persist: hành vi với entity detached',prompt:`Viết {{RepositorySimulator}} đơn giản hoá: {{save(entity)}} gọi merge nếu entity có id, persist nếu chưa có id.
- {{find(id)}}: load từ DB (mô phỏng bằng map).
- {{save(entity)}}: nếu entity.id == 0 -> persist (gán id mới); nếu entity.id != 0 -> merge.
- Trả về instance managed (merge trả về instance khác, persist trả về chính entity đó sau khi gán id).
- DB: map id -> name. ID tự tăng từ 1.`,
  starter:`record Entity(long id,String name){}
class RepositorySimulator {
    Map<Long,String> db=new HashMap<>(); long nextId=1;
    Entity find(long id){throw new UnsupportedOperationException("TODO");}
    Entity save(Entity e){throw new UnsupportedOperationException("TODO");}}`,
  tests:`public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }
    public static void main(String[] args) {
        RepositorySimulator repo = new RepositorySimulator();
        Entity e1 = repo.save(new Entity(0, "New"));
        check("save new assigns id and inserts", e1.id() == 1 && e1.name().equals("New") && repo.find(1).name().equals("New"), "e1=" + e1);
        Entity e2 = repo.save(new Entity(1, "Updated"));
        check("save existing merges and returns managed", e2.id() == 1 && e2.name().equals("Updated") && repo.find(1).name().equals("Updated"), "e2=" + e2);
        Entity detached = new Entity(1, "DetachedChange");
        Entity merged = repo.save(detached);
        check("merge returns different instance", merged != detached, "merged == detached la " + (merged == detached));
        check("merged instance is in DB", repo.find(1).name().equals("DetachedChange"), "db=" + repo.find(1));
        check("detached unchanged does not affect DB", detached.name().equals("DetachedChange"), "detached name=" + detached.name());
        Entity e3 = repo.save(new Entity(0, "Another"));
        check("another new gets next id", e3.id() == 2 && repo.find(2).name().equals("Another"), "e3=" + e3);
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
  reference:`record Entity(long id,String name){}
class RepositorySimulator {
    Map<Long,String> db=new HashMap<>(); long nextId=1;
    Entity find(long id){ return db.containsKey(id) ? new Entity(id, db.get(id)) : null; }
    Entity save(Entity e){
        if(e.id() == 0){
            long id = nextId++; db.put(id, e.name()); return new Entity(id, e.name());
        } else {
            db.put(e.id(), e.name()); return new Entity(e.id(), e.name());
        }
    }
}`,
  hints:['save: id == 0 là persist (gán id mới), id != 0 là merge (cập nhật DB).','Luôn trả về instance MỚI (record immutable), mô phỏng merge trả về managed instance khác.','DB lưu name theo id.'],
  explain:`Spring Data save() hành vi giống thế này: entity "mới" (id null hoặc isNew() true) -> persist; entity đã có id -> merge. Quan trọng: save() trả về instance managed (merge trả về instance khác), nên PHẢI dùng giá trị trả về. Test kiểm tra merge trả về instance khác detached, và DB được cập nhật qua instance managed.`
}],check:[{q:'Entity vừa {{new}}, chưa persist, gọi {{em.persist(entity)}}. Trạng thái sau đó?',options:['Transient','Managed','Detached','Removed'],answer:1,explain:`Persist chuyển entity từ transient sang managed. Entity bây giờ nằm trong persistence context, có snapshot, và sẽ được dirty checking khi flush.`},{q:'Entity đã load trong transaction A, transaction A commit. Transaction B lấy entity đó (cùng object trong biến Java) và sửa field. Lúc commit B, có UPDATE không?',options:['Có, vì object vẫn là entity managed','Không, vì commit A đã clear context, entity trở thành detached','Có, vì Hibernate tự merge khi thấy entity detached','Tuỳ cấu hình cascade'],answer:1,explain:`Commit (hoặc close) thường xoá persistence context, mọi entity managed trở thành detached. Setter trên detached bị Hibernate bỏ qua lặng lẽ, không sinh SQL. Phải load lại hoặc dùng merge (repo.save) và dùng instance trả về.`},{q:'{{em.merge(detachedEntity)}} trả về gì?',options:['detachedEntity sau khi đã biến thành managed','Instance managed MỚI (hoặc sẵn có trong context), detachedEntity vẫn detached','null nếu entity không tồn tại trong DB','EntityExistsException'],answer:1,explain:`Merge tìm/khởi tạo instance managed trong context, chép state từ detachedEntity vào đó, trả về instance managed đó. Object bạn truyền vào KHÔNG đổi trạng thái, vẫn detached. Đây là lý do Spring Data save() phải dùng giá trị trả về.`},{q:'Persist entity đã có id (ví dụ detached entity có id từ client) sẽ thế nào?',options:['Tự chuyển sang merge','Ném EntityExistsException','INSERT thành công','UPDATE thành công'],answer:1,explain:`Persist chỉ dành cho entity transient (chưa có trong DB/context). Entity có id được coi là đã tồn tại, nên Hibernate ném EntityExistsException. Dùng merge cho trường hợp này.`}],related:['jpa-002','jpa-019','jpa-022','jpa-049'],tags:['entity lifecycle','persist','merge','transient','managed','detached','removed']
},
{
  id:'lesson-jpa-014',track:'jpa',order:14,title:'Xây dựng persistence context mini: identity map, snapshot, dirty checking và flush từ con số 0',level:'senior',minutes:35,
  goals:['Hiểu rõ cơ chế identity map: vì sao cùng id trong một context trả về cùng instance','Triển khai snapshot và dirty checking: so sánh giá trị thay vì tham chiếu, cập nhật snapshot sau flush','Mô phỏng vòng đời entity: transient, managed, detached, removed và chuyển trạng thái','Hiểu flush theo thứ tự: insert → update → delete, và tại sao thứ tự này quan trọng cho FK'],
  body:`### Tóm tắt
Persistence context (EntityManager trong JPA, Session trong Hibernate) là **đơn vị làm việc** (unit of work) gắn liền với một transaction. Nó giữ ba cấu trúc cốt lõi: **identity map** (map khoá chính → entity managed), **snapshot** (bản sao giá trị các field lúc nạp), và **hàng đợi thao tác** (insert/update/delete actions). Khi bạn gọi setter trên entity managed, Hibernate **không** chạy SQL ngay mà chỉ đổi object trong RAM. Đến lúc flush, nó duyệt identity map, so field hiện tại với snapshot, entity nào khác thì sinh UPDATE. Vì vậy sửa entity managed **không cần gọi save** — đó là dirty checking. Flush gửi SQL xuống database nhưng transaction vẫn mở (có thể rollback); commit mới kết thúc transaction và làm bền dữ liệu. Hiểu cơ chế này từ con số 0 giúp bạn debug "sửa xong không thấy UPDATE", "merge mà object cũ không đổi", "persist entity có id báo lỗi", và biết khi nào cần flush/clear theo chunk.

### Identity map: bản đồ danh tính trong context
Khi bạn gọi em.find(Account.class, 7L), Hibernate làm theo thứ tự:
1. Tra identity map (Map<EntityKey, Object>) — EntityKey gộp tên entity và id.
2. Nếu đã có: trả về **chính instance đó** (a1 == a2 là true). Không chạy SQL.
3. Nếu chưa có: chạy SELECT, tạo object, đưa vào map, lưu snapshot, trả về.

Identity map đảm bảo **tính đồng nhất** (identity): trong một transaction, cùng một hàng database chỉ được đại diện bởi **một** object Java. Nếu không có identity map, hai em.find cùng id sẽ tạo hai object, bạn sửa object thứ nhất, object thứ hai vẫn giữ giá trị cũ, và lúc flush Hibernate không biết cập nhật object nào — dẫn đến lost update hoặc dữ liệu không nhất quán.

Ví dụ:
~~~java
@Transactional
public void demo() {
    Account a1 = em.find(Account.class, 1L); // SELECT, tạo instance A, đưa vào map
    Account a2 = em.find(Account.class, 1L); // tra map, trả về instance A
    System.out.println(a1 == a2); // true
    a1.setName("Mai"); // chỉ đổi RAM
} // flush → UPDATE account SET name='Mai' WHERE id=1
~~~

Identity map chỉ sống trong một persistence context. Transaction khác (context khác) có map riêng, nên cùng id sẽ cho instance khác nhau — đây là thiết kế đúng vì mỗi transaction cần cô lập.

### Snapshot: bản sao giá trị, không phải tham chiếu
Khi nạp entity, Hibernate lưu **snapshot** — bản sao giá trị từng cột (String, int, Long...), **không** phải tham chiếu tới object entity. Đây là điểm mấu chốt: nếu snapshot trỏ tới cùng object, setter đổi object thì "snapshot" cũng đổi theo, dirty checking sẽ không bao giờ phát hiện thay đổi.

Cấu trúc snapshot trong Hibernate (giản lược):
~~~text
EntityEntry {
    Object[] loadedState;   // giá trị các field lúc load, theo thứ tự property
    boolean loadedWithLazy; // có tải lazy không
    ...
}
~~~

Khi bạn gọi setter, chỉ object Java trong RAM thay đổi. loadedState giữ nguyên. Đến lúc flush, Hibernate duyệt identity map, lấy loadedState so với current state (giá trị hiện tại của entity). Field nào khác → đánh dấu dirty.

Sau flush, Hibernate **ghi đè loadedState bằng current state** để lần flush sau không lặp lại UPDATE. Nếu quên bước này, mỗi lần flush sẽ thấy entity "đã đổi" và gửi UPDATE lặp lại — tương tự bug "quên cập nhật snapshot" trong bài tập.

### Dirty checking: so giá trị, không đếm lần gán
Dirty checking chạy khi flush (tự động trước commit, trước query bị ảnh hưởng, hoặc gọi em.flush() thủ công). Nó so sánh **giá trị** (equals) của từng field, không quan tâm bạn gọi setter bao nhiêu lần.

Ví dụ:
~~~java
Account a = em.find(Account.class, 1L); // snapshot: name="A"
a.setName("B"); // đổi 1
a.setName("C"); // đổi 2
a.setName("A"); // đổi lại như cũ
// flush: so current "A" với snapshot "A" → KHÔNG KHÁC → không có UPDATE
~~~

Đây là hành vi đúng: database chỉ quan tâm giá trị cuối cùng, không quan tâm bạn đã gán bao nhiêu lần.

### Vòng đời entity: 4 trạng thái
| Trạng thái | Cách vào | Được theo dõi? | Flush làm gì? |
|---|---|---|---|
| Transient (new) | new Entity(), chưa persist | Không | Không gì |
| Managed | persist(), find(), merge() trả về, load query | Có | So snapshot, sinh INSERT/UPDATE/DELETE |
| Detached | detach(), clear(), close(), commit (thường) | Không | Không gì (setter bị bỏ qua lặng) |
| Removed | remove() trên managed | Có (đánh dấu xóa) | Sinh DELETE |

Chuyển trạng thái quan trọng:
- new → persist → managed
- managed → detach/clear/commit → detached
- managed → remove → removed → (flush) → DELETE → (commit) → detached (vì context bị xóa)
- detached → merge → managed **mới** (object cũ vẫn detached)

### Merge không biến object đầu vào thành managed
em.merge(detached) tìm (hoặc nạp) instance managed cùng id, **chép state** từ object của bạn sang instance đó, rồi trả về **instance managed**. Object bạn truyền vào **vẫn detached**.

~~~java
Account detached = new Account(); detached.setId(1L); detached.setName("X");
Account managed = em.merge(detached); // managed != detached
managed.setName("Y"); // này được theo dõi
detached.setName("Z"); // này KHÔNG được theo dõi
~~~

Spring Data repo.save(entity) gọi merge khi entity không "mới" (id khác null). Vì vậy **luôn dùng giá trị trả về**: account = repo.save(account).

### Flush theo thứ tự: insert → update → delete (ActionQueue)
Hibernate không gửi SQL theo thứ tự bạn gọi persist/remove. Nó xếp các thao tác vào **ActionQueue** ba hàng đợi riêng: insert, update, delete. Flush thực thi theo thứ tự cố định: **insert → update → delete**.

Lý do: tôn trọng ràng buộc khóa ngoại (FK).
- Insert cha trước con (con trỏ vào id cha đã có).
- Delete con trước cha (cha vẫn còn id để con tham chiếu).
- Update ở giữa để cập nhật giá trị trước khi delete (nếu cần).

Ví dụ: persist order, persist line, remove line2 → flush sinh:
1. INSERT orders
2. INSERT order_line (line)
3. DELETE order_line (line2)

Nếu bạn xóa user email a@x.com rồi thêm user mới cùng email trong cùng transaction: flush gửi INSERT trước DELETE → unique constraint vi phạm vì bản ghi cũ chưa bị xóa. Cách sửa: gọi em.flush() giữa hai thao tác (gửi DELETE xuống DB trước), hoặc dùng UPDATE thay vì delete+insert.

### Transaction dài, import lớn: flush rồi clear theo chunk
Mỗi entity managed tốn RAM cho object và snapshot. Mỗi flush duyệt toàn bộ identity map. Import 1 triệu dòng trong một transaction dễ OOM hoặc flush rất chậm.

Cách làm: xử lý theo chunk (ví dụ 500 entity), mỗi chunk flush() rồi clear(). **Phải flush trước clear**, nếu không thay đổi chưa gửi sẽ mất.

~~~java
for (int i = 0; i < rows.size(); i++) {
    em.persist(toEntity(rows.get(i)));
    if ((i + 1) % 500 == 0) { em.flush(); em.clear(); }
}
~~~

### Read-only transaction
@Transactional(readOnly = true) báo Hibernate không cần theo dõi thay đổi → không giữ snapshot, bỏ dirty checking cho entity đọc ra → tiết kiệm RAM và CPU. Dùng cho endpoint chỉ đọc.

### Ví dụ đời thực: API cập nhật đơn hàng mất cập nhật
Khách hàng gọi PUT /orders/1 với JSON {"total": 500}. Controller deserialize thành Order (id=1, total=500) — detached. Service gọi repo.save(order) nhưng **không dùng giá trị trả về**, mà trả về order cũ. Response 200 OK, nhưng database không đổi. Debug: log SQL rỗng. Nguyên nhân: save gọi merge, trả về managed instance mới, nhưng service trả về detached instance cũ. Sửa: return repo.save(order). Test integration assert số query = 1.

### Trả lời mẫu khi phỏng vấn
"Persistence context là unit of work gắn với transaction. Nó có identity map (cùng id trả về cùng instance), snapshot (bản sao giá trị lúc load), và ActionQueue (insert/update/delete). Sửa entity managed chỉ đổi RAM, flush so snapshot sinh UPDATE — nên không cần save. Flush gửi SQL nhưng transaction vẫn mở, commit mới bền vững. Merge chép state vào instance managed mới, object đầu vào vẫn detached. Import lớn phải flush/clear theo chunk. Read-only transaction bỏ snapshot tiết kiệm tài nguyên."

### Liên hệ phỏng vấn
1. **"Vì sao sửa entity mà không gọi save vẫn có UPDATE?"** — Entity managed, có snapshot, dirty checking chạy lúc flush so giá trị hiện tại với snapshot.
2. **"Flush khác commit ở đâu?"** — Flush gửi SQL xuống DB nhưng transaction vẫn mở (có thể rollback). Commit kết thúc transaction, dữ liệu bền vững, context thường bị xóa, entity thành detached.
3. **"em.merge(detached) trả về gì? Object đầu vào có thành managed không?"** — Trả về instance managed mới (hoặc có sẵn trong context). Object đầu vào KHÔNG thành managed, vẫn detached. Phải dùng instance trả về.
4. **"Import 500.000 sản phẩm trong một transaction bị OOM, sửa thế nào?"** — Chia chunk (500 entity), mỗi chunk flush() rồi clear(). Phải flush trước clear. Dùng @Transactional(readOnly = true) cho phần chỉ đọc.
5. **"Xóa rồi thêm cùng unique key trong một transaction vẫn lỗi, tại sao?"** — Hibernate flush insert trước delete. INSERT chạy khi bản ghi cũ chưa bị xóa → vi phạm unique. Sửa: flush giữa chừng hoặc dùng UPDATE.

> Senior tip: Khi debug "sửa xong mà không thấy UPDATE", đầu tiên hãy kiểm tra entity có đang managed không — sau commit hoặc clear(), nó đã detached và setter bị bỏ qua. Dùng {{em.getReference()}} hoặc reload entity nếu cần update chỉ một field. Khi cần kiểm soát chính xác các query (ví dụ list 10.000 dòng), ưu tiên DTO projection hoặc hai query IN thay vì fetch join — fetch join dễ gây OOM khi có Pageable. Luôn đo thực tế: số query, số dòng, heap, thời gian DB, không chỉ số query.

---

### Bài tập 1: UnitOfWork — identity map, snapshot, dirty checking, flush, commit, detach, rollback
Mô phỏng persistence context bằng class UnitOfWork quản lý entity Account (có id và name):
- load(id, name): nếu id đã có trong identity map thì trả về **cùng object** cũ (bỏ qua name truyền vào); nếu chưa thì tạo Account, đưa vào identity map và lưu snapshot (bản sao giá trị name).
- setName(id, name): nếu entity đang được quản lý thì đổi name trong RAM; nếu không (đã detach) thì không làm gì cả.
- flush(): với mỗi entity đang được quản lý (theo thứ tự load), so name hiện tại với snapshot; khác thì thêm câu "UPDATE account SET name='<name>' WHERE id=<id>" vào danh sách trả về, và cập nhật snapshot. Entity không đổi thì không có câu SQL.
- commit(): xóa toàn bộ persistence context (mọi entity trở thành detached).
- detach(id): gỡ một entity ra khỏi context.
- rollback(): khôi phục giá trị của mọi entity đang quản lý về snapshot (hủy mọi thay đổi chưa flush).

Chú ý: snapshot phải là **bản sao giá trị** (String), không phải tham chiếu tới Account. flush phải cập nhật snapshot sau khi phát hiện thay đổi. commit xóa cả identity map và snapshot.

  `,exercises:[{title:'UnitOfWork: identity map, snapshot, dirty checking, flush, commit, detach, rollback',prompt:`Mô phỏng persistence context (unit of work) bằng class UnitOfWork quản lý entity Account (có id và name):
- load(id, name): nếu id đã có trong identity map thì trả về **cùng object** cũ (bỏ qua name truyền vào); nếu chưa thì tạo Account, đưa vào identity map và lưu snapshot (bản sao giá trị name).
- setName(id, name): nếu entity đang được quản lý thì đổi name trong RAM; nếu không (đã detach) thì không làm gì cả.
- flush(): với mỗi entity đang được quản lý (theo thứ tự load), so name hiện tại với snapshot; khác thì thêm câu "UPDATE account SET name='<name>' WHERE id=<id>" vào danh sách trả về, và cập nhật snapshot. Entity không đổi thì không có câu SQL.
- commit(): xóa toàn bộ persistence context (mọi entity trở thành detached).
- detach(id): gỡ một entity ra khỏi context.
- rollback(): khôi phục giá trị của mọi entity đang quản lý về snapshot (hủy mọi thay đổi chưa flush).`,starter:`class Account {long id;String name;Account(long i,String n){id=i;name=n;}}
class UnitOfWork {
    Account load(long id,String name){throw new UnsupportedOperationException("TODO");}
    void setName(long id,String name){throw new UnsupportedOperationException("TODO");}
    List<String> flush(){throw new UnsupportedOperationException("TODO");}
    void commit(){throw new UnsupportedOperationException("TODO");}
    void detach(long id){throw new UnsupportedOperationException("TODO");}
    void rollback(){throw new UnsupportedOperationException("TODO");}}`,tests:`public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }
    public static void main(String[] args) {
        UnitOfWork u = new UnitOfWork();
        Account a = u.load(1, "A");
        check("cung id tra ve cung object", a == u.load(1, "Z"), "khac instance");
        check("giu trang thai cu khi load lai", "A".equals(a.name), "name = " + a.name);
        List<String> s = u.flush();
        check("flush trong khi khong sua", s.isEmpty(), "sql = " + s);
        u.setName(1, "B");
        s = u.flush();
        check("phat hien sua ten", s.equals(List.of("UPDATE account SET name='B' WHERE id=1")), "sql = " + s);
        s = u.flush();
        check("sau flush thi sach", s.isEmpty(), "sql = " + s);
        u.detach(1);
        u.setName(1, "C");
        s = u.flush();
        check("da detach thi khong the theo doi", s.isEmpty(), "sql = " + s);
        u.load(2, "P");
        u.setName(2, "Q");
        s = u.flush();
        check("ghi entity moi", s.equals(List.of("UPDATE account SET name='Q' WHERE id=2")), "sql = " + s);
        u.rollback();
        List<String> s2 = u.flush();
        check("rollback huy het", s2.isEmpty(), "sql = " + s2);
        u.setName(2, "R");
        u.rollback();
        Account b = u.load(2, "X");
        check("rollback da khoi phuc gia tri cu", "Q".equals(b.name) && b == u.load(2, "Y"), "name = " + b.name);
        u.commit();
        u.setName(2, "R");
        s = u.flush();
        check("sau commit entities la detached", s.isEmpty(), "sql = " + s);
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,reference:`class Account {long id;String name;Account(long i,String n){id=i;name=n;}}
class UnitOfWork {
    Map<Long,Account> managed=new LinkedHashMap<>();   // identity map, giu thu tu load
    Map<Long,String> snapshot=new HashMap<>();         // snapshot: ban sao gia tri, khong phai tham chieu
    Account load(long id,String name){
        Account a=managed.get(id);
        if(a!=null)return a;
        a=new Account(id,name);managed.put(id,a);snapshot.put(id,name);return a;
    }
    void setName(long id,String name){
        Account a=managed.get(id);
        if(a!=null)a.name=name;                        // da detach thi lam giang
    }
    List<String> flush(){
        List<String> sql=new ArrayList<>();
        for(Account a:managed.values()){
            String old=snapshot.get(a.id);
            if(!Objects.equals(old,a.name)){
                sql.add("UPDATE account SET name='"+a.name+"' WHERE id="+a.id);
                snapshot.put(a.id,a.name);             // cap nhat snapshot de khong lap lai
            }
        }
        return sql;
    }
    void commit(){managed.clear();snapshot.clear();}     // ca het tro thanh detached
    void detach(long id){managed.remove(id);snapshot.remove(id);}
    void rollback(){
        for(Account a:managed.values())a.name=snapshot.get(a.id); // khoi phuc tu snapshot
    }
}`,hints:['Dung LinkedHashMap<Long, Account> lam identity map, giu thu tu load.','Snapshot phai la ban sao gia tri (String), khong phai tham chieu den Account.','flush: duyet managed, so name voi snapshot, khac thi them SQL va ghi de snapshot.','commit xoa ca map va snapshot; rollback gan lai name tu snapshot; detach chi xoa mot entity.'],explain:`Flush so sanh gia tri hien tai voi snapshot; chi field khac moi sinh SQL, sau flush Hibernate ghi de snapshot de lan sau khong lap lai cau SQL cu. Detach xoa entity khoi persistence context nen setter sau do khong duoc theo doi — bat "sua xong khong co gi xay ra". Commit xoa toan bo context, moi entity dang giu tro thanh detached; rollback khoi phuc gia tri tu snapshot, va vi flush chua ben cung du lieu cho nen khong co gi trong database bi thay doi.`},{title:'Merge vs Persist: hanh vi voi entity detached',prompt:`Viet RepositorySimulator don gian hoa: save(entity) goi merge neu entity co id, persist neu chua co id.
- find(id): load tu DB (mo phong bang map).
- save(entity): neu entity.id == 0 -> persist (gan id moi); neu entity.id != 0 -> merge.
- Tra ve instance managed (merge tra ve instance khac, persist tra ve chinh entity do sau khi gan id).
- DB: map id -> name. ID tu tang tu 1.`,starter:`record Entity(long id,String name){}
class RepositorySimulator {
    Map<Long,String> db=new HashMap<>(); long nextId=1;
    Entity find(long id){throw new UnsupportedOperationException("TODO");}
    Entity save(Entity e){throw new UnsupportedOperationException("TODO");}}`,tests:`public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }
    public static void main(String[] args) {
        RepositorySimulator repo = new RepositorySimulator();
        Entity e1 = repo.save(new Entity(0, "New"));
        check("save new assigns id and inserts", e1.id() == 1 && e1.name().equals("New") && repo.find(1).name().equals("New"), "e1=" + e1);
        Entity e2 = repo.save(new Entity(1, "Updated"));
        check("save existing merges and returns managed", e2.id() == 1 && e2.name().equals("Updated") && repo.find(1).name().equals("Updated"), "e2=" + e2);
        Entity detached = new Entity(1, "DetachedChange");
        Entity merged = repo.save(detached);
        check("merge returns different instance", merged != detached, "merged == detached la " + (merged == detached));
        check("merged instance is in DB", repo.find(1).name().equals("DetachedChange"), "db=" + repo.find(1));
        check("detached unchanged does not affect DB", detached.name().equals("DetachedChange"), "detached name=" + detached.name());
        Entity e3 = repo.save(new Entity(0, "Another"));
        check("another new gets next id", e3.id() == 2 && repo.find(2).name().equals("Another"), "e3=" + e3);
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,reference:`record Entity(long id,String name){}
class RepositorySimulator {
    Map<Long,String> db=new HashMap<>(); long nextId=1;
    Entity find(long id){ return db.containsKey(id) ? new Entity(id, db.get(id)) : null; }
    Entity save(Entity e){
        if(e.id() == 0){
            long id = nextId++; db.put(id, e.name()); return new Entity(id, e.name());
        } else {
            db.put(e.id(), e.name()); return new Entity(e.id(), e.name());
        }
    }
}`,hints:['save: id == 0 la persist (gan id moi), id != 0 la merge (cap nhat DB).','Luon tra ve instance MOI (record immutable), mo phong merge tra ve managed instance khac.','DB luu name theo id.'],explain:`Spring Data save() hanh vi giong the nay: entity "moi" (id null hoac isNew() true) -> persist; entity da co id -> merge. Quan trong: save() tra ve instance managed (merge tra ve instance khac), nen PHAI dung gia tri tra ve. Test kiem tra merge tra ve instance khac detached, va DB duoc cap nhat qua instance managed.`}],check:[{q:'Flush khac commit o dau?',options:['Flush dua SQL xu du DB van trong transaction (van rollback duoc); commit ket thuc transaction, du lieu ben cung','Commit chi xoa persistence context, flush moi dua SQL xu DB','Hai cung la cung mot luc: dua SQL va ket thuc transaction','Flush chi xay ra khi goi em.flush(), commit tu dong xay ra luon'],answer:0,explain:`Flush gui cac cau SQL dang cho xu xu database nhung transaction van con nen, nen van co the rollback. Commit ket thuc transaction, du lieu tro nen ben cung va transaction khac moi thay duoc. Co 3 lan flush tuong tu: truoc commit, truoc query JPQL (FlushMode AUTO), va khi goi em.flush() thu cong.`},{q:'Ban goi em.detach(entity) sau do goi setter sua field. Luc commit, Hibernate co sinh UPDATE khong?',options:['Co, Hibernate luon ghi entity da duoc load','Khong; entity da detached boi detach nen setter khong duoc theo doi, khong co SQL','Co nhung chi neu co cascade','Chua biet, phu thuoc database'],answer:1,explain:`Detach xoa entity khoi persistence context, Hibernate bo qua no: setter doi object trong RAM nhung khong sinh SQL, cung khong bao loi. Day la bat "sua xong mat ma khong biet sao".`},{q:'Transaction bi rollback sau khi da goi em.flush(). Du lieu vua flush co nam trong database khong?',options:['Co, flush da dua SQL xu DB nen khong the hoan tac','Khong; rollback huy tat ca thay doi trong transaction, database quay lai nhu chua co transaction','Co phan, chi luu cac cau da flush truoc commit','Chua biet'],answer:1,explain:`Flush chua la ket thuc transaction; rollback huy het, cac cau SQL da gui van trong khoang transaction va bo qua. Chi commit moi lam du lieu ben cung.`},{q:'em.merge(detachedEntity) tra ve gi?',options:['detachedEntity sau khi da bien thanh managed','Instance managed MOI (hoac san co trong context), detachedEntity van detached','null neu entity khong ton tai trong DB','EntityExistsException'],answer:1,explain:`Merge tim/khoi tao instance managed trong context, chep state tu detachedEntity vao do, tra ve instance managed do. Object ban truyen vao KHONG doi trang thai, van detached. Day la ly do Spring Data save() phai dung gia tri tra ve.`}],related:['jpa-001','jpa-010','jpa-013'],tags:['persistence context','identity map','snapshot','dirty checking','flush','merge','detach','rollback']
},
{
  id:'lesson-jpa-015',track:'jpa',order:15,title:'Phat hien va khac phuc N+1 bang mo phong repository dem query',level:'senior',minutes:35,
  goals:['Hieu N+1 la gi, tai sao no ton kem, va cach phat hien bang log SQL, statistics, APM','So sanh cac chien luoc khac phuc: fetch join, EntityGraph, batch fetching, DTO projection, hai query IN','Biet bat phan trang khi fetch join collection va cach xu ly dung','Triển khai repository mo phong dem luot goi de chung minh N+1 va kiem tra giai phap'],
  body:`### Tóm tắt
N+1 là vấn đề hiệu năng kinh điển khi dùng JPA/Hibernate: bạn lấy N entity cha bằng 1 query, rồi duyệt qua collection lazy của từng cha — mỗi lần truy cập Hibernate phát thêm 1 SELECT cho con. Tổng cộng 1 + N query. Với N=200, round-trip 1ms/query → 200ms chỉ cho DB, cộng connection pool tranh chấp → response chậm từ 50ms lên 2 giây. Phát hiện bằng: bật log SQL (org.hibernate.SQL), hibernate.generate_statistics, APM (Datadog, New Relic), hoặc integration test assert số query. Khắc phục: fetch join/EntityGraph cho detail (1 query), batch fetching hoặc 2 query IN cho list (kiểm soát số query), DTO projection cho read-only. Bẫy: fetch join collection + Pageable khiến Hibernate tải toàn bộ rồi cắt trong RAM (HHH90003004) — phải phân trang parent rồi fetch child.

### Hiểu N+1 từ gốc
Khi association là LAZY (mặc định cho @OneToMany), Hibernate không đọc nó lúc load entity cha. Thay vào đó, field collection chứa một **persistent collection** (ví dụ PersistentBag) chưa có phần tử. Lần đầu bạn gọi order.getLines().size(), collection nhờ Session đang gắn với nó chạy SELECT * FROM order_line WHERE order_id = ? rồi giữ kết quả.

Nếu bạn duyệt 80 order trong vòng lặp:
~~~java
List<Order> orders = orderRepo.findAll();        // query 1: SELECT * FROM orders
for (Order o : orders) {
    total += o.getLines().size();                // mỗi vòng: SELECT * FROM order_line WHERE order_id = ?
}
~~~
Tổng 1 + 80 = 81 query. Mỗi query nhanh (1ms trong DB) nhưng round-trip mạng, lấy connection từ pool, parse/plan SQL ở DB làm tổng thời gian phình to.

Test chỉ có 1 order thì chỉ thấy 2 query → N+1 thường lọt qua review. Muốn bắt được, test phải có nhiều parent và kiểm tra số query **không tăng theo** số parent.

### LAZY hay EAGER đều không tự chữa N+1
- LAZY chỉ **trì hoãn** việc tải đến lúc truy cập. Truy cập trong vòng lặp thì mỗi lần một query.
- EAGER nghĩa là "phải có sẵn khi entity được tải", **không** có nghĩa "dùng JOIN". Với em.find, Hibernate có thể JOIN; nhưng với JPQL SELECT o FROM Order o, câu SQL chỉ đọc bảng orders, rồi Hibernate phải chạy **thêm** query cho association EAGER của từng order: vẫn là N+1, và còn xảy ra ở mọi nơi load Order kể cả khi không cần dữ liệu đó.
- Theo chuẩn JPA, @ManyToOne và @OneToOne mặc định là EAGER. Nên ghi fetch = FetchType.LAZY tường minh rồi chọn fetch plan theo từng use case.

### Các cách khắc phục: so sánh chi tiết
| Cách | Số query | Ưu điểm | Cạm bẫy |
|---|---|---|---|
| Fetch join / EntityGraph | 1 | Đơn giản, Hibernate tự loại parent trùng (Hibernate 6) | Nhân dòng; không phân trang an toàn khi fetch collection |
| Batch fetching (@BatchSize / hibernate.default_batch_fetch_size) | 1 + ceil(N/batch) | Ít sửa code, không cần đổi query | N rất lớn vẫn nhiều query; IN dài chạm giới hạn tham số DB |
| DTO projection | 1 | Nhẹ nhất, đúng cột màn hình cần | Mỗi màn hình một query riêng |
| Hai query + IN | 2 | Kiểm soát hoàn toàn, không nhân dòng | IN quá dài (Oracle 1.000, SQL Server ~2.100) phải chia lô |

#### 1. Fetch join
~~~java
@Query("SELECT o FROM Order o JOIN FETCH o.lines WHERE o.status = :s")
List<Order> findWithLines(@Param("s") String status);
~~~
Từ Hibernate 6, kết quả tự loại parent trùng (không cần DISTINCT như Hibernate 5). Với collection, JOIN nhân dòng: order có 3 lines chiếm 3 dòng trong result set. Hibernate gom lại trong RAM.

#### 2. EntityGraph
~~~java
@EntityGraph(attributePaths = "lines")
List<Order> findWithLines();
~~~
Tách fetch plan ra khỏi query, tái dùng được cho nhiều method repository. attributePaths hỗ trợ đường dẫn chấm: "lines.product.category".

#### 3. Batch fetching
~~~java
@OneToMany(fetch = FetchType.LAZY)
@BatchSize(size = 50)
List<Line> lines;
~~~
Hoặc cấu hình toàn cục spring.jpa.properties.hibernate.default_batch_fetch_size=50. Khi bạn chạm vào lines của order đầu tiên, Hibernate tải lines cho tối đa 50 order đang chờ cùng lúc bằng WHERE order_id IN (...). 80 order: 1 + 2 query thay vì 81, không cần sửa query.

#### 4. DTO projection
~~~java
@Query("SELECT new com.shop.OrderRow(o.id, o.total) FROM Order o")
List<OrderRow> findAllRow();
~~~
Không tạo entity, không có lazy, không N+1. Dùng cho màn hình chỉ đọc, danh sách lớn.

#### 5. Hai query tự viết (cơ chế của batch fetching)
~~~text
orders = queryOrders()                 // query 1
lines  = queryLinesByOrderIds(ids)     // query 2: WHERE order_id IN (1, 2, 3)
group lines by orderId                 // ghép trong RAM, không query trong vòng lặp
~~~

### Bẫy kinh điển: fetch join collection + phân trang
JOIN trả một dòng cho mỗi cặp (order, line): order có 3 lines chiếm 3 dòng. Nếu đặt LIMIT 20 vào SQL, bạn có thể nhận 20 dòng thuộc 7 order, order cuối bị cắt mất lines. Hibernate biết điều này nên khi có JOIN FETCH collection kèm setMaxResults (hoặc Pageable), nó **không** đưa LIMIT xuống SQL mà tải **toàn bộ** kết quả rồi cắt trong RAM, chỉ in cảnh báo HHH90003004. Bảng 1 triệu order sẽ gây OOM. Bật hibernate.query.fail_on_pagination_over_collection_fetch=true để biến cảnh báo thành exception ngay khi test.

Cách đúng: phân trang **chỉ trên parent** (query 1 lấy 20 order), rồi tải lines cho 20 id đó (fetch join với WHERE o.id IN :ids, hoặc batch fetching).

### Production: số query không phải mục tiêu duy nhất
1 query trả 2 triệu dòng còn tệ hơn 3 query nhỏ. Xem cả số dòng, payload, thời gian DB và heap.

### Ví dụ đời thực: API đơn hàng chậm từ 50ms lên 2 giây
Team có endpoint GET /orders trả 200 đơn hàng kèm lines. Dev mới viết JPQL đơn giản SELECT o FROM Order o. QA test 5 đơn hàng: 60ms. Ra production, khách hàng 200 đơn hàng, mỗi đơn 5 lines: 1 + 200 = 201 query. Round-trip 1ms/query → khoảng 200ms chỉ cho DB, cộng connection pool tranh chấp → response chậm.

Điều tra: bật log SQL, thấy hàng loạt SELECT * FROM order_line WHERE order_id = ?. Sửa: thêm @EntityGraph(attributePaths = "lines") vào method repository. Kết quả: 1 query JOIN, response 80ms. Cảnh báo HHH90003004 xuất hiện vì dùng Pageable → chuyển sang phân trang parent + batch fetching cho lines. Kết quả cuối: 2 query, 40ms.

### Trả lời mẫu khi phỏng vấn
"N+1 là 1 query cho parent, N query cho child khi duyệt collection lazy. Phát hiện bằng log SQL (hàng loạt query giống nhau), statistics (queryExecutionCount tăng theo parent), APM. Sửa: fetch join/EntityGraph cho detail (1 query), batch fetching hoặc 2 query IN cho list (kiểm soát số query), DTO projection cho read-only. Bẫy: fetch join collection + Pageable khiến Hibernate tải toàn bộ rồi cắt trong RAM (HHH90003004) → phải phân trang parent rồi fetch child. Đừng bao giờ trả lời 'đổi sang EAGER'."

### Liên hệ phỏng vấn
1. **"Bạn phát hiện và sửa N+1 thế nào?"** — Nêu dấu hiệu (số query tăng theo số parent), cách đo (SQL log, statistics, APM), rồi chọn giải pháp theo use case: fetch join hoặc EntityGraph cho trang chi tiết, batch fetching hoặc hai query cho danh sách, DTO projection cho màn hình chỉ đọc. Giải thích thêm bẫy phân trang với collection fetch.
2. **"Đổi association sang EAGER có giải quyết N+1 không?"** — Không. EAGER chỉ đảm bảo association có sẵn khi entity được tải, không đảm bảo một câu JOIN: với JPQL, Hibernate thường chạy thêm query cho từng entity (vẫn N+1). EAGER còn áp dụng ở mọi nơi, kể cả màn hình không cần dữ liệu đó, và không thể tắt theo từng query.
3. **"Fetch join collection kèm Pageable xảy ra gì?"** — Hibernate tải toàn bộ kết quả vào RAM rồi cắt trang, in cảnh báo HHH90003004, nguy hiểm OOM. Phải phân trang parent rồi fetch child.
4. **"Batch fetching hoạt động như thế nào?"** — Khi chạm vào collection của entity đầu tiên, Hibernate gom id của các entity cùng loại trong persistence context, tải theo lô bằng WHERE ... IN (...), kích thước lô do @BatchSize hoặc default_batch_fetch_size quyết định.
5. **"Khi nào dùng DTO projection thay vì entity?"** — Màn hình chỉ đọc, danh sách lớn, không cần lazy loading, muốn kiểm soát chính xác cột và số query.

---

### Bài tập 1: Giảm N+1 xuống hai query với repo đếm lượt gọi
Repo đếm số lần gọi: a cho orders(), b cho lines(ids). Cài Service.load() trả về map orderId → danh sách sku, theo thứ tự order:
- Chỉ gọi orders() **một** lần và lines(ids) **một** lần với tập id của mọi order (không gọi trong vòng lặp).
- Order không có line vẫn có mặt trong map với danh sách rỗng.
- Nếu không có order nào thì **không** gọi lines và trả map rỗng.

  `,exercises:[{title:'Giam N+1 xuong hai query voi repo dem luot goi',prompt:`Repo dem so lan goi: a cho orders(), b cho lines(ids). Cai Service.load() tra ve map orderId -> danh sach sku, theo thu tu order:
- Chi goi orders() **mot** lan va lines(ids) **mot** lan voi tap id cua moi order (khong goi trong vong lap).
- Order khong co line van co mat trong map voi danh sach rong.
- Neu khong co order nao thi **khong** goi lines va tra map rong.`,starter:`record Order(long id){} record Line(long orderId,String sku){}
class Repo{int a,b;Set<Long> lastIds;List<Order> orders(){a++;return List.of(new Order(1),new Order(2),new Order(3));}List<Line> lines(Set<Long> ids){b++;lastIds=new HashSet<>(ids);return List.of(new Line(1,"A"),new Line(1,"B"),new Line(3,"C"));}}
class Service{Repo r;Service(Repo x){r=x;}Map<Long,List<String>> load(){throw new UnsupportedOperationException("TODO");}}`,tests:`public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }
    public static void main(String[] args) {
        Repo r = new Repo();
        Map<Long, List<String>> m = new Service(r).load();
        check("exactly two queries", r.a == 1 && r.b == 1, "orders() goi " + r.a + " lan, lines() goi " + r.b + " lan");
        check("lines queried with all order ids", Set.of(1L, 2L, 3L).equals(r.lastIds), "ids = " + r.lastIds);
        check("multiple children", List.of("A", "B").equals(m.get(1L)), "order 1 = " + m.get(1L));
        check("parent without children is empty", m.get(2L) != null && m.get(2L).isEmpty(), "order 2 = " + m.get(2L));
        check("last child", List.of("C").equals(m.get(3L)), "order 3 = " + m.get(3L));
        check("keys in order", List.of(1L, 2L, 3L).equals(new ArrayList<>(m.keySet())), "keys = " + m.keySet());
        Repo empty = new Repo() { List<Order> orders() { a++; return List.of(); } };
        Map<Long, List<String>> e = new Service(empty).load();
        check("no orders: skip lines query", e.isEmpty() && empty.b == 0, "map = " + e + ", lines() goi " + empty.b + " lan");
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,reference:`record Order(long id){} record Line(long orderId,String sku){}
class Repo{int a,b;Set<Long> lastIds;List<Order> orders(){a++;return List.of(new Order(1),new Order(2),new Order(3));}List<Line> lines(Set<Long> ids){b++;lastIds=new HashSet<>(ids);return List.of(new Line(1,"A"),new Line(1,"B"),new Line(3,"C"));}}
class Service{Repo r;Service(Repo x){r=x;}
    Map<Long,List<String>> load(){
        List<Order> os=r.orders();                              // query 1
        Map<Long,List<String>> out=new LinkedHashMap<>();
        for(Order o:os)out.put(o.id(),new ArrayList<>());       // tao entry truoc: order rong van co mat
        if(out.isEmpty())return out;                            // khong co id thi khoi query 2
        for(Line l:r.lines(out.keySet()))out.get(l.orderId()).add(l.sku()); // query 2, nhom trong RAM
        return out;
    }
}`,hints:['Tao entry (danh sach rong) cho moi order truoc khi rap line.','Gom id vao mot Set roi goi lines(ids) dung mot lan, ben ngoai vong lap.','Kiem tra truong hop khong co order truoc khi goi lines.'],explain:`Query 1 tai parent, query 2 tai moi child theo tap id, roi nhom theo orderId trong RAM. Tao entry truoc giup order khong co line van xuat hien (giong LEFT JOIN). Bo qua query 2 khi tap id rong vi IN () rong la SQL khong hop le o nhieu database.
Loi hay gap: goi lines(Set.of(o.id())) trong vong lap, tuc chinh la N+1. Trong thuc te con phai chia tap id thanh lo (vi du 500 id) khi danh sach lon de khong vuot gioi han tham so cua database. Day cung la cach Hibernate batch fetching hoat dong ben duoi.`},{title:'Batch fetching mo phong: hieu co che IN lo',prompt:`Mo phong batch fetching cua Hibernate. BatchFetcher nhan batchSize va ham loadAll(ids) tra ve map id -> value.
- get(id): neu id da co trong cache thi tra ngay; neu chua thi them id vao hang doi cho.
- flush(): gom cac id cho, chia thanh cac lo kich thuoc batchSize, goi loadAll cho moi lo, cap nhat cache, tra ve so lo da load.`,starter:`class BatchFetcher{int batchSize;Function<Set<Long>,Map<Long,String>> loader;Map<Long,String> cache=new HashMap<>();Set<Long> pending=new HashSet<>();BatchFetcher(int batchSize,Function<Set<Long>,Map<Long,String>> loader){this.batchSize=batchSize;this.loader=loader;}String get(long id){throw new UnsupportedOperationException("TODO");}int flush(){throw new UnsupportedOperationException("TODO");}}`,tests:`public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }
    public static void main(String[] args) {
        AtomicInteger calls = new AtomicInteger();
        BatchFetcher f = new BatchFetcher(3, ids -> {
            calls.incrementAndGet();
            Map<Long,String> m = new HashMap<>();
            for(long id:ids)m.put(id,"V"+id);
            return m;
        });
        check("cache miss adds to pending", f.get(1) == null, "get(1) should return null on cache miss");
        f.flush();
        check("first flush loads batch", "V1".equals(f.get(1)) && calls.get() == 1, "calls=" + calls.get());
        f.get(2); f.get(3); f.get(4); f.get(5); f.get(6); f.get(7); f.get(8);
        int loaded = f.flush();
        check("7 pending split into 3 batches of 3,3,1", loaded == 3 && calls.get() == 4, "loaded=" + loaded + ", calls=" + calls.get());
        check("all cached now", f.get(5).equals("V5") && calls.get() == 4, "calls=" + calls.get());
        BatchFetcher f2 = new BatchFetcher(2, ids -> { calls.incrementAndGet(); Map<Long,String> m=new HashMap<>(); for(long id:ids)m.put(id,"X"+id); return m; });
        f2.get(10); f2.get(11); f2.get(12);
        check("batch size 2: 3 ids -> 2 batches", f2.flush() == 2, "flush=" + f2.flush());
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,reference:`class BatchFetcher{int batchSize;Function<Set<Long>,Map<Long,String>> loader;Map<Long,String> cache=new HashMap<>();Set<Long> pending=new HashSet<>();BatchFetcher(int batchSize,Function<Set<Long>,Map<Long,String>> loader){this.batchSize=batchSize;this.loader=loader;}String get(long id){if(cache.containsKey(id))return cache.get(id);pending.add(id);return null;}int flush(){if(pending.isEmpty())return 0;List<Long> list=new ArrayList<>(pending);pending.clear();int batches=0;for(int i=0;i<list.size();i+=batchSize){int end=Math.min(i+batchSize,list.size());Set<Long> batch=new HashSet<>(list.subList(i,end));cache.putAll(loader.apply(batch));batches++;}return batches;}}`,hints:['Cache hit tra ngay, khong them vao pending.','flush() chia pending thanh cac lo kich thuoc batchSize, goi loader cho moi lo.','Tra ve so lo da load.'],explain:`Batch fetching gom cac id dang cho (pending) va tai theo lo (IN clause). Hibernate lam chinh xac dieu nay: khi ban cham vao collection cua entity dau tien, no gom id cua cac entity cung loai dang trong persistence context va tai theo batch. Test kiem tra viec chia lo dung kich thuoc va cache hit khong goi loader.`}],check:[{q:'Doi association sang FetchType.LAZY co tu loai bo N+1 khong?',options:['Co, LAZY luon sinh mot JOIN','Co, vi LAZY bat buoc dung second-level cache','Khong, truy cap association cua tung parent trong vong lap van phat mot query moi lan','LAZY khong dung duoc voi collection'],answer:2,explain:`LAZY chi hoan thoi diem tai; truy cap trong vong lap van N query. Can fetch join, EntityGraph, batch fetching hoac projection. LAZY khong sinh JOIN (do la viec cua fetch join), khong lien quan second-level cache, va collection mac dinh da la LAZY.`},{q:'Query co JOIN FETCH o.lines ke phan trang 20 order/trang. Hibernate 6 xu ly the nao?',options:['Tai toan bo ket qua roi cat trang trong RAM, chi in canh bao (tru khi bat fail_on_pagination_over_collection_fetch)','Dua LIMIT 20 xuong SQL va luon tra dung 20 order day du lines','Tu tach thanh hai query: phan trang order roi tai lines','Nem loi bien dich JPQL'],answer:0,explain:`JOIN nhan dong theo so line, nen LIMIT o SQL se cat giua collection. Hibernate vi vay phan trang trong RAM va canh bao HHH90003004, rat nguy hiem voi bang lon. No khong tu tach thanh hai query (do la viec ban phai lam), va JPQL van hop le nen khong co loi bien dich.`},{q:'Bat hibernate.default_batch_fetch_size=50, load 120 order roi duyet lines cua tung order. Khoang bao nhieu query?',options:['1','121','2','Khoang 4: 1 query order + khoang 3 query lines dang IN'],answer:3,explain:`Batch fetching gom toi da 50 khoa moi lan: 120 order can khoang 3 query IN cho lines, cong 1 query order. Con so chinh xac co the khac mot chut tuy cach Hibernate chia lo, nhung khong con tang theo tung order. 121 la N+1 khong co batch; 1 hay 2 query chi dat duoc bang fetch join hoac tu viet query IN khong chia lo.`},{q:'Tai sao DTO projection khong bao gio bi N+1?',options:['Vi DTO luon dung fetch join','Vi projection chi chon cot can thiet, khong tao entity nen khong co lazy loading','Vi Spring tu bat batch fetching cho DTO','Vi DTO dung second-level cache'],answer:1,explain:`Projection chi SELECT cot can thiet, tra ve record/DTO, khong tao entity JPA nen khong co association lazy, khong co N+1. Fetch join, batch fetching, second-level cache la cac mach khac.`}],related:['jpa-002','jpa-012'],tags:['N+1','batch fetching','fetch join','EntityGraph','DTO projection']
}
,
{
  id:'lesson-jpa-016',track:'jpa',order:16,title:'N+1: fetch join va batch fetching - hai cach giai quyet, mot bai tap',level:'senior',minutes:30,
  goals:['Triển khai loadOrdersWithItems bang fetch join (1 query) va batch fetching (1 + ceil(N/batchSize) query)','Hieu khi nao chon fetch join, khi nao chon batch fetching dua vao use case','Dem so query bang repository mo phong de chung minh giai phap','Biet bat phan trang khi fetch join collection va cach xu ly'],
  body:`### Tóm tắt
N+1 là 1 query parent + N query child khi duyệt collection lazy. Hai giải pháp phổ biến nhất: **fetch join** (1 query JOIN) và **batch fetching** (1 query parent + ceil(N/batchSize) query IN). Fetch join phù hợp trang chi tiết (ít parent, cần đầy đủ dữ liệu); batch fetching phù hợp danh sách lớn (nhiều parent, kiểm soát số query). Bài tập dưới đây triển khai loadOrdersWithItems(strategy) nhận tham số "join" hoặc "batch" và repository đếm query để kiểm chứng.
 
### N+1: vì sao 1 query parent lại sinh ra hàng trăm query child
Khi association là LAZY (mặc định @OneToMany), Hibernate không đọc collection lúc load parent. Field collection chứa một **persistent collection** (PersistentBag) chưa có phần tử. Lần đầu gọi order.getLines().size(), collection nhờ Session chạy SELECT * FROM order_line WHERE order_id = ?.
 
~~~java
List<Order> orders = orderRepo.findAll();        // query 1: SELECT * FROM orders
for (Order o : orders) {
    total += o.getLines().size();                // mỗi vòng: SELECT * FROM order_line WHERE order_id = ?
}
~~~
80 order → 81 query. Round-trip 1ms/query → 80ms chỉ cho DB, cộng connection pool tranh chấp → response chậm từ 50ms lên 150ms. Test 1 order chỉ thấy 2 query nên N+1 thường lọt review.
 
### Giải pháp 1: Fetch join — 1 query
~~~java
@Query("SELECT o FROM Order o JOIN FETCH o.lines WHERE o.status = :s")
List<Order> findWithLines(@Param("s") String status);
~~~
JOIN trả 1 dòng cho mỗi cặp (order, line): order có 3 lines chiếm 3 dòng. Hibernate 6 tự loại parent trùng (không cần DISTINCT). Ưu: 1 query duy nhất. Nhược: nhân dòng (payload lớn), **không phân trang an toàn khi fetch collection** — Hibernate tải toàn bộ rồi cắt trong RAM (HHH90003004).
 
### Giải pháp 2: Batch fetching — 1 + ceil(N/batchSize) query
~~~java
@OneToMany(fetch = FetchType.LAZY)
@BatchSize(size = 50)
List<Line> lines;
~~~
Hoặc cấu hình spring.jpa.properties.hibernate.default_batch_fetch_size=50. Khi chạm vào lines của order đầu tiên, Hibernate gom id của các order đang chờ trong persistence context, tải bằng WHERE order_id IN (...) kích thước ≤ batchSize. 80 order, batchSize=50 → 1 query parent + 2 query IN = 3 query.
 
### So sánh nhanh
| Tiêu chí | Fetch join | Batch fetching |
|---|---|---|
| Số query | 1 | 1 + ceil(N/batchSize) |
| Payload | Nhân dòng (parent lặp theo child) | Tách biệt, gọn hơn |
| Phân trang | Không an toàn với collection (HHH90003004) | An toàn — chỉ phân trang parent |
| Phù hợp | Trang chi tiết (1–20 parent) | Danh sách lớn (100+ parent) |
| Sửa code | Thêm query JPQL / EntityGraph | Chỉ thêm @BatchSize hoặc config |
 
### Bẫy phân trang fetch join collection
JOIN FETCH o.lines + Pageable → Hibernate KHÔNG đưa LIMIT xuống SQL, tải **toàn bộ** kết quả vào RAM rồi cắt trang, cảnh báo HHH90003004. Bảng 1 triệu order gây OOM. Bật hibernate.query.fail_on_pagination_over_collection_fetch=true để biến cảnh báo thành exception khi test.
 
Cách đúng: **phân trang chỉ trên parent** (query 1 lấy 20 order), rồi tải lines cho 20 id đó (fetch join WHERE o.id IN :ids hoặc batch fetching).
 
### Ví dụ đời thực: API danh sách đơn hàng 5000 đơn
Team có endpoint GET /orders trả 5000 đơn hàng kèm lines. QA test 10 đơn: 60ms. Production 5000 đơn, mỗi đơn 3 lines → N+1 = 5001 query → 5s response.
 
- Lần 1: Thêm @EntityGraph(attributePaths = "lines") → 1 query JOIN, nhưng payload 15.000 dòng, response 2s (vẫn chậm do payload lớn).
- Lần 2: Chuyển sang batch fetching @BatchSize(size = 100) → 1 query parent + 50 query IN (5000/100) = 51 query, response 180ms. Payload gọn, connection pool ít tranh chấp hơn.
- Kết luận: Danh sách lớn → batch fetching thắng fetch join.
 
### Trả lời mẫu khi phỏng vấn
"N+1 là 1 query parent + N query child khi duyệt collection lazy. Hai giải pháp chính: fetch join (1 query JOIN) và batch fetching (1 + ceil(N/batchSize) query IN). Fetch join nhân dòng, payload lớn, không phân trang an toàn — dùng cho detail ít parent. Batch fetching tách query, kiểm soát số query bằng batchSize, phân trang an toàn — dùng cho list lớn. Bẫy: fetch join + Pageable gây OOM (HHH90003004), phải tách query. Đừng bao giờ nói 'đổi sang EAGER'."
 
### Liên hệ phỏng vấn
1. "Fetch join vs batch fetching — chọn cái nào khi nào?" — Fetch join cho detail (ít parent, cần đầy đủ), batch fetching cho list (nhiều parent, kiểm soát số query, phân trang an toàn).
2. "Fetch join collection + Pageable xảy ra gì?" — Hibernate tải toàn bộ vào RAM, cắt trang, cảnh báo HHH90003004, nguy hiểm OOM. Phải phân trang parent rồi fetch child.
3. "Batch fetching hoạt động như thế nào?" — Khi chạm collection entity đầu tiên, Hibernate gom id các entity cùng loại trong persistence context, tải theo lô WHERE ... IN (...) kích thước ≤ batchSize.
4. "Khi nào batch fetching vẫn nhiều query?" — N rất lớn (10.000) với batchSize nhỏ (20) → 500 query IN. Tăng batchSize (500–1000) nhưng chú ý giới hạn tham số IN của DB (Oracle 1000, SQL Server ~2100).
 
> Senior tip: Đừng chỉ nói "giảm N+1". Hãy nêu: fetch join 1 query nhưng nhân dòng, batch fetching 1 + N/batch query nhưng tách payload. Với list 5000 đơn, fetch join payload 15k dòng chậm hơn 50 query IN gọn nhẹ. Luôn đo: số query, payload (bytes), heap, thời gian DB. Batch fetching là default an toàn cho list; fetch join dành cho detail. Nếu dùng fetch join cho list, PHẢI tách phân trang parent + fetch child, không được dùng Pageable trực tiếp.
 
---
 
### Bài tập: loadOrdersWithItems(strategy) — fetch join (1 query) hoặc batch fetching (1 + ceil(N/batch))`
,exercises:[{title:'loadOrdersWithItems: fetch join hoặc batch fetching với repo đếm query',prompt:`Mô phỏng repository có hai chiến lược tải order kèm lines:
- FETCH_JOIN: 1 query JOIN (trả về list OrderLineRaw gồm orderId, lineId, sku), sau đó nhóm trong RAM.
- BATCH: 1 query orders + ceil(N/batchSize) query lines bằng IN (giả lập batch fetching).
 
Yêu cầu cài OrderService.loadOrdersWithItems(strategy, batchSize):
- strategy là enum Strategy { FETCH_JOIN, BATCH }.
- batchSize chỉ dùng khi strategy = BATCH (mặc định 50).
- Trả về Map<Long, List<String>> orderId → danh sách sku, theo thứ tự order.
- Order không có line vẫn có entry với list rỗng.
- Repo cung cấp orders() (dem a), linesJoin() (dem b), linesBatch(ids) (dem c).
- Kiểm tra: FETCH_JOIN → a=1, b=1, c=0; BATCH → a=1, b=0, c=ceil(N/batchSize).
- Không gọi lines trong vòng lặp.`,starter:`enum Strategy { FETCH_JOIN, BATCH }
record Order(long id){}
record LineRaw(long orderId,long lineId,String sku){}
record Line(long orderId,String sku){}
class Repo {
    int a=0,b=0,c=0; List<Long> lastBatchIds;
    List<Order> orders(){ a++; return List.of(new Order(1),new Order(2),new Order(3),new Order(4),new Order(5),new Order(6),new Order(7),new Order(8),new Order(9),new Order(10)); }
    List<LineRaw> linesJoin(){ b++; return List.of(
        new LineRaw(1,10,"A"), new LineRaw(1,11,"B"),
        new LineRaw(3,12,"C"), new LineRaw(3,13,"D"),
        new LineRaw(5,14,"E"), new LineRaw(6,15,"F"),
        new LineRaw(7,16,"G"), new LineRaw(7,17,"H"),
        new LineRaw(9,18,"I"), new LineRaw(10,19,"J")
    ); }
    List<Line> linesBatch(Set<Long> ids){ c++; lastBatchIds=new ArrayList<>(ids); return List.of(
        new Line(1,"A"), new Line(1,"B"),
        new Line(3,"C"), new Line(3,"D"),
        new Line(5,"E"), new Line(6,"F"),
        new Line(7,"G"), new Line(7,"H"),
        new Line(9,"I"), new Line(10,"J")
    ); }
}
class OrderService {
    Repo r; int batchSize=50;
    OrderService(Repo r, int batchSize){ this.r=r; this.batchSize=batchSize; }
    Map<Long,List<String>> loadOrdersWithItems(Strategy s){ throw new UnsupportedOperationException("TODO"); }
}`,tests:`public class Main {
    static int passed=0,total=0;
    static void check(String name,boolean ok,String detail){ total++; if(ok){passed++;System.out.println("PASS "+name);}else System.out.println("FAIL "+name+": "+detail); }
    public static void main(String[] args){
        Repo r1=new Repo();
        Map<Long,List<String>> m1=new OrderService(r1,50).loadOrdersWithItems(Strategy.FETCH_JOIN);
        check("FETCH_JOIN: exactly 2 queries", r1.a==1 && r1.b==1 && r1.c==0, "a="+r1.a+", b="+r1.b+", c="+r1.c);
        check("FETCH_JOIN: all 10 orders present", m1.size()==10, "size="+m1.size());
        check("FETCH_JOIN: order 1 has 2 skus", List.of("A","B").equals(m1.get(1L)), "order1="+m1.get(1L));
        check("FETCH_JOIN: order 2 empty but present", m1.get(2L)!=null && m1.get(2L).isEmpty(), "order2="+m1.get(2L));
        check("FETCH_JOIN: order 3 has 2 skus", List.of("C","D").equals(m1.get(3L)), "order3="+m1.get(3L));
        check("FETCH_JOIN: order 10 has 1 sku", List.of("J").equals(m1.get(10L)), "order10="+m1.get(10L));
        check("FETCH_JOIN: order preserved", List.of(1L,2L,3L,4L,5L,6L,7L,8L,9L,10L).equals(new ArrayList<>(m1.keySet())), "keys="+m1.keySet());
        
        Repo r2=new Repo();
        Map<Long,List<String>> m2=new OrderService(r2,3).loadOrdersWithItems(Strategy.BATCH);
        check("BATCH: 1 orders + 4 batches", r2.a==1 && r2.b==0 && r2.c==4, "a="+r2.a+", b="+r2.b+", c="+r2.c);
        check("BATCH: all 10 orders present", m2.size()==10, "size="+m2.size());
        check("BATCH: order 1 has 2 skus", List.of("A","B").equals(m2.get(1L)), "order1="+m2.get(1L));
        check("BATCH: order 2 empty but present", m2.get(2L)!=null && m2.get(2L).isEmpty(), "order2="+m2.get(2L));
        check("BATCH: last batch size <= batchSize", r2.lastBatchIds!=null && r2.lastBatchIds.size()<=3, "lastBatch="+r2.lastBatchIds);
        
        Repo r3=new Repo();
        Map<Long,List<String>> m3=new OrderService(r3,5).loadOrdersWithItems(Strategy.BATCH);
        check("BATCH size 5: 2 batches", r3.a==1 && r3.b==0 && r3.c==2, "a="+r3.a+", b="+r3.b+", c="+r3.c);
        
        Repo empty=new Repo(){ List<Order> orders(){ a++; return List.of(); } };
        Map<Long,List<String>> me=new OrderService(empty,50).loadOrdersWithItems(Strategy.FETCH_JOIN);
        check("empty: FETCH_JOIN no lines query", me.isEmpty() && empty.b==0, "b="+empty.b);
        Map<Long,List<String>> me2=new OrderService(empty,50).loadOrdersWithItems(Strategy.BATCH);
        check("empty: BATCH no lines query", me2.isEmpty() && empty.c==0, "c="+empty.c);
        
        System.out.println("RESULT "+passed+"/"+total);
    }
}`,reference:`enum Strategy { FETCH_JOIN, BATCH }
record Order(long id){}
record LineRaw(long orderId,long lineId,String sku){}
record Line(long orderId,String sku){}
class Repo {
    int a=0,b=0,c=0; List<Long> lastBatchIds;
    List<Order> orders(){ a++; return List.of(new Order(1),new Order(2),new Order(3),new Order(4),new Order(5),new Order(6),new Order(7),new Order(8),new Order(9),new Order(10)); }
    List<LineRaw> linesJoin(){ b++; return List.of(
        new LineRaw(1,10,"A"), new LineRaw(1,11,"B"),
        new LineRaw(3,12,"C"), new LineRaw(3,13,"D"),
        new LineRaw(5,14,"E"), new LineRaw(6,15,"F"),
        new LineRaw(7,16,"G"), new LineRaw(7,17,"H"),
        new LineRaw(9,18,"I"), new LineRaw(10,19,"J")
    ); }
    List<Line> linesBatch(Set<Long> ids){ c++; lastBatchIds=new ArrayList<>(ids); return List.of(
        new Line(1,"A"), new Line(1,"B"),
        new Line(3,"C"), new Line(3,"D"),
        new Line(5,"E"), new Line(6,"F"),
        new Line(7,"G"), new Line(7,"H"),
        new Line(9,"I"), new Line(10,"J")
    ); }
}
class OrderService {
    Repo r; int batchSize=50;
    OrderService(Repo r, int batchSize){ this.r=r; this.batchSize=batchSize; }
    Map<Long,List<String>> loadOrdersWithItems(Strategy s){
        List<Order> orders=r.orders();                                    // query 1
        Map<Long,List<String>> out=new LinkedHashMap<>();
        for(Order o:orders)out.put(o.id(),new ArrayList<>());
        if(out.isEmpty())return out;
        
        if(s==Strategy.FETCH_JOIN){
            for(LineRaw l:r.linesJoin())out.get(l.orderId()).add(l.sku()); // query 2: JOIN
        }else{
            List<Long> ids=new ArrayList<>(out.keySet());                 // BATCH: chia lo
            for(int i=0;i<ids.size();i+=batchSize){
                int end=Math.min(i+batchSize,ids.size());
                Set<Long> batch=new HashSet<>(ids.subList(i,end));
                for(Line l:r.linesBatch(batch))if(batch.contains(l.orderId()))out.get(l.orderId()).add(l.sku());
            }
        }
        return out;
    }
}`,hints:['Tạo entry (list rỗng) cho TẤT CẢ order TRƯỚC khi nạp line — order không có line vẫn xuất hiện.','FETCH_JOIN: gọi linesJoin() MỘT LẦN, nhóm theo orderId trong RAM.','BATCH: gom ids, chia lô kích thước batchSize, gọi linesBatch(batch) cho từng lô.','Kiểm tra out.isEmpty() TRƯỚC khi gọi lines — IN rỗng là SQL không hợp lệ.'],explain:`FETCH_JOIN mô phỏng 1 query JOIN: trả về OrderLineRaw (orderId, lineId, sku) cho tất cả line của tất cả order. Nhóm theo orderId trong RAM → order không có line vẫn có entry (giống LEFT JOIN). Tổng 2 query (orders + linesJoin).
 
BATCH mô phỏng batch fetching của Hibernate: query 1 lấy orders, sau đó chia tập orderId thành các lô kích thước batchSize, mỗi lô gọi linesBatch(ids) → 1 query IN. 10 order, batchSize=3 → ceil(10/3)=4 lô → 1 + 4 = 5 query. Batch fetching thật của Hibernate cũng làm y chang: gom id trong persistence context, chia lô, query IN.
 
Lỗi hay gặp:
- Gọi linesBatch(Set.of(id)) trong vòng lặp → quay lại N+1.
- Quên tạo entry rỗng cho order trước → order không có line bị mất khỏi map.
- Không check empty trước khi gọi linesBatch → IN () rỗng lỗi SQL.
- FETCH_JOIN dùng linesBatch hoặc ngược lại → đếm query sai.`,}],check:[{q:'Fetch join collection + Pageable (phân trang 20 order/trang). Hibernate 6 xử lý thế nào?',options:['Tải toàn bộ kết quả rồi cắt trang trong RAM, chỉ in cảnh báo (trừ khi bật fail_on_pagination_over_collection_fetch)','Đưa LIMIT 20 xuống SQL và luôn trả đúng 20 order đầy đủ lines','Tự tách thành hai query: phân trang order rồi tải lines','Ném lỗi biên dịch JPQL'],answer:0,explain:`JOIN nhân dòng theo số line, nên LIMIT ở SQL sẽ cắt giữa collection. Hibernate vì vậy phân trang trong RAM và cảnh báo HHH90003004, rất nguy hiểm với bảng lớn. Nó không tự tách thành hai query (đó là việc bạn phải làm), và JPQL vẫn hợp lệ nên không có lỗi biên dịch.`},{q:'Batch fetching với batchSize=50, load 120 order rồi duyệt lines. Khoảng bao nhiêu query?',options:['1','121','2','Khoảng 4: 1 query order + 3 query lines IN'],answer:3,explain:`Batch fetching gom tối đa 50 id mỗi lô: 120 order cần 3 lô (50+50+20) → 3 query IN cho lines, cộng 1 query order = 4 query. Không còn tăng theo từng order.`},{q:'Tại sao fetch join không phù hợp danh sách lớn (5000 order, 3 lines/order)?',options:['Vì fetch join không hỗ trợ collection','Vì payload 15.000 dòng nhân dòng, chậm hơn nhiều query IN gọn nhẹ','Vì Hibernate không cho phép fetch join nhiều order','Vì fetch join chỉ dùng được cho to-one'],answer:1,explain:`Fetch join nhân dòng: 5000 order × 3 lines = 15.000 dòng result set. Payload lớn, tốn network, heap, thời gian parse. Batch fetching: 1 query order (5000 dòng) + ceil(5000/batchSize) query IN (mỗi query vài trăm dòng) → payload gọn, song song hóa tốt hơn.`},{q:'Khi dùng batch fetching, giới hạn tham số IN của database cần lưu ý gì?',options:['Không có giới hạn','Oracle 1000, SQL Server ~2100, PostgreSQL không giới hạn nhưng hiệu năng giảm','Chỉ MySQL có giới hạn','Giới hạn là 100 cho mọi DB'],answer:1,explain:`Oracle cứng 1000 tham số cho IN. SQL Server ~2100. PostgreSQL không cứng nhưng query quá dài chậm. Khi batchSize lớn (500–1000) cần chia lô thủ công hoặc dùng temp table / CTE. Hibernate batch fetching tự chia lô theo batchSize nên an toàn miễn batchSize ≤ 1000.`}],related:['jpa-002','jpa-012','jpa-015'],tags:['N+1','fetch join','batch fetching','@BatchSize','query counting']
},
{
  id:'lesson-jpa-017',track:'jpa',order:17,title:'Persistence context và dirty checking: import theo chunk, flush rồi clear',level:'senior',minutes:30,
  goals:['Giải thích vì sao transaction dài với nhiều entity làm persistence context phình to (RAM, snapshot) và flush chậm','Hiểu flush gửi SQL tích lũy xuống DB trong transaction, clear giải phóng identity map và snapshot','Mô phỏng import theo chunk: persist → flush → clear, không mất thay đổi và không phình RAM','Phân biệt flush, clear và commit; biết entity thành detached sau clear và phải load lại nếu muốn sửa'],
  body:`### Hiểu nhanh: persistence context là "bàn làm việc" phình to theo số entity
Persistence context (EntityManager của JPA, Session của Hibernate) là vùng nhớ chứa các entity mà Hibernate đang **quản lý (managed)**. Trong một transaction Spring (đánh dấu bằng {{@Transactional}}), mọi entity load ra đều nằm trên "bàn" này, kèm một **snapshot** (bản sao giá trị lúc đọc) để dirty checking so sánh lúc flush. Vấn đề: nếu bạn import 500.000 dòng trong một transaction, bàn làm việc chứa 500.000 entity + 500.000 snapshot → heap phình, mỗi flush duyệt toàn bộ → chậm, dễ OOM (hết bộ nhớ heap). Cách làm đúng: chia **chunk** (ví dụ 500 entity), mỗi chunk persist xong gọi {{flush()}} (gửi SQL tích lũy xuống DB) rồi {{clear()}} (dọn bàn làm việc, mọi entity thành detached).

### Vì sao flush rồi clear, theo thứ tự đó
{{flush()}} gửi các câu INSERT/UPDATE đang chờ xuống database **trong transaction hiện tại** (chưa commit, vẫn rollback được). {{clear()}} xóa toàn bộ persistence context: identity map và snapshot. Nếu clear trước flush, các thay đổi chưa gửi sẽ **mất** vì không còn ai theo dõi entity đó nữa. Vì vậy thứ tự bắt buộc là: persist → flush → clear.

### Cơ chế từng bước
1. {{persist(entity mới)}}: Hibernate thêm entity vào identity map, đánh dấu là new (chưa có snapshot vì chưa có trong DB).
2. {{flush()}}: duyệt identity map, entity nào là new → sinh INSERT; entity managed có field khác snapshot → sinh UPDATE. Sau flush, cập nhật snapshot, entity new trở thành managed "đã đồng bộ".
3. {{clear()}}: xóa identity map + snapshot. Mọi entity bạn đang giữ trong biến trở thành detached; setter sau đó không sinh SQL.
4. Lặp lại chunk tiếp theo.

### Ví dụ số liệu
Import 10.000 entity, chunk 1.000: 10 lần flush, mỗi flush 1.000 INSERT → 10.000 INSERT. Persistence context mỗi lúc chỉ giữ 1.000 entity + snapshot → heap ổn định. Nếu không chunk: 1 flush cuối với 10.000 entity → heap lớn gấp 10 lần, flush chậm vì duyệt 10.000 entity một lượt.

### Lỗi hay gặp
- clear trước flush → mất INSERT/UPDATE chưa gửi.
- flush trước clear nhưng quên clear → persistence context vẫn phình.
- Sau clear, sửa entity cũ rồi commit → không có UPDATE (đã detached).
- Đọc lại entity sau clear: phải load lại từ DB, không dùng object cũ.

### Liên hệ phỏng vấn
"Vì sao import lớn phải chia chunk và flush rồi clear?" Trả lời: persistence context giữ entity + snapshot, phình to theo số entity → heap và thời gian flush tăng tuyến tính. Chia chunk giữ context nhỏ; flush trước clear để gửi SQL tích lũy trước khi giải phóng. Sau clear entity thành detached, muốn sửa phải load lại. Dùng {{@Transactional(readOnly = true)}} cho phần chỉ đọc.`,
  exercises:[{title:'ChunkImporter: persist, flush, clear, load lại từ DB',prompt:`Cài {{ChunkImporter}} mô phỏng persistence context khi import theo chunk. Entity {{Row}} có {{id}} và {{name}}. DB là map id → name.
- {{persist(id, name)}}: tạo Row mới, thêm vào managed map. Entity mới **chưa có snapshot** (chưa có trong DB).
- {{load(id)}}: nếu managed map đã có thì trả về **cùng object** đó; nếu chưa thì tạo Row từ DB (map {{db}}), thêm vào managed map, lưu snapshot, đánh dấu đã INSERT.
- {{flush()}}: duyệt managed theo thứ tự load. Entity chưa có snapshot → sinh {{INSERT INTO row(id,name) VALUES(...)}} và cập nhật db + snapshot. Entity có snapshot mà name khác → sinh {{UPDATE row SET name='...' WHERE id=...}} và cập nhật db + snapshot. Trả về danh sách câu SQL.
- {{clear()}}: xóa managed map và snapshot (entity thành detached).
- {{commit()}}: clear rồi xóa tập đã-INSERT (mọi thứ đã bền).`,
  starter:`class Row {long id;String name;Row(long i,String n){id=i;name=n;}}
class ChunkImporter {
    Map<Long,String> db=new HashMap<>();
    Map<Long,Row> managed=new LinkedHashMap<>();
    Map<Long,String> snapshot=new HashMap<>();
    Set<Long> inserted=new HashSet<>();
    void persist(long id,String name){throw new UnsupportedOperationException("TODO");}
    Row load(long id){throw new UnsupportedOperationException("TODO");}
    List<String> flush(){throw new UnsupportedOperationException("TODO");}
    void clear(){throw new UnsupportedOperationException("TODO");}
    void commit(){throw new UnsupportedOperationException("TODO");}
}`,
  tests:`public class Main {
    static int passed=0,total=0;
    static void check(String name,boolean ok,String detail){total++;if(ok){passed++;System.out.println("PASS "+name);}else System.out.println("FAIL "+name+": "+detail);}
    public static void main(String[] args){
        ChunkImporter imp=new ChunkImporter();
        imp.persist(1,"A");imp.persist(2,"B");imp.persist(3,"C");
        List<String> sql1=imp.flush();
        check("flush inserts new entities",sql1.equals(List.of("INSERT INTO row(id,name) VALUES(1,'A')","INSERT INTO row(id,name) VALUES(2,'B')","INSERT INTO row(id,name) VALUES(3,'C')")),"sql="+sql1);
        imp.clear();
        check("clear empties context",imp.managed.isEmpty(),"managed="+imp.managed.size());
        Row r=imp.load(1);
        check("load after clear reads from DB",r.name.equals("A"),"name="+r.name);
        check("load after clear no insert",imp.flush().isEmpty(),"flush="+imp.flush());
        r.name="X";
        List<String> sql2=imp.flush();
        check("update dirty field",sql2.equals(List.of("UPDATE row SET name='X' WHERE id=1")),"sql="+sql2);
        imp.clear();
        check("update persisted",imp.load(1).name.equals("X"),"name="+imp.load(1).name);
        ChunkImporter imp2=new ChunkImporter();
        int totalInsert=0,flushCount=0;
        for(int i=1;i<=5;i++){
            imp2.persist(i,"N"+i);
            if(i%2==0){List<String> s=imp2.flush();flushCount++;totalInsert+=s.size();imp2.clear();}
        }
        List<String> last=imp2.flush();
        check("chunk flush count",flushCount==2 && last.size()==1,"flushCount="+flushCount+", last="+last.size());
        check("chunk total inserts",totalInsert+last.size()==5,"total="+(totalInsert+last.size()));
        imp2.clear();
        check("all rows readable after chunk",imp2.load(1).name.equals("N1")&&imp2.load(5).name.equals("N5"),"loaded");
        imp2.commit();
        check("commit clears context",imp2.managed.isEmpty(),"managed="+imp2.managed.size());
        System.out.println("RESULT "+passed+"/"+total);
    }
}`,
  reference:`class Row {long id;String name;Row(long i,String n){id=i;name=n;}}
class ChunkImporter {
    Map<Long,String> db=new HashMap<>();
    Map<Long,Row> managed=new LinkedHashMap<>();
    Map<Long,String> snapshot=new HashMap<>();
    Set<Long> inserted=new HashSet<>();
    void persist(long id,String name){
        if(managed.containsKey(id)||snapshot.containsKey(id))throw new IllegalArgumentException("not transient");
        managed.put(id,new Row(id,name));
    }
    Row load(long id){
        Row r=managed.get(id);
        if(r!=null)return r;
        r=new Row(id,db.get(id));
        managed.put(id,r);snapshot.put(id,r.name);inserted.add(id);return r;
    }
    List<String> flush(){
        List<String> sql=new ArrayList<>();
        for(Row r:managed.values()){
            String old=snapshot.get(r.id);
            if(old==null){sql.add("INSERT INTO row(id,name) VALUES("+r.id+",'"+r.name+"')");db.put(r.id,r.name);snapshot.put(r.id,r.name);inserted.add(r.id);}
            else if(!Objects.equals(old,r.name)){sql.add("UPDATE row SET name='"+r.name+"' WHERE id="+r.id);db.put(r.id,r.name);snapshot.put(r.id,r.name);}
        }
        return sql;
    }
    void clear(){managed.clear();snapshot.clear();}
    void commit(){clear();inserted.clear();}
}`,
  hints:['persist chỉ thêm vào managed map, KHÔNG thêm snapshot (entity mới chưa có trong DB).','load kiểm tra managed trước; nếu không có thì đọc từ db rồi thêm managed + snapshot + inserted.','flush phân biệt entity mới (snapshot null → INSERT) với entity cũ đổi field (snapshot khác → UPDATE), cập nhật db và snapshot sau mỗi câu.','clear xóa managed và snapshot; commit gọi clear rồi xóa inserted.'],
  explain:`Bài tập buộc bạn tách bạch ba việc: persist (đưa entity mới vào context), flush (sinh SQL và cập nhật DB + snapshot), clear (giải phóng context). Lỗi hay gặp:
- Thêm snapshot ngay khi persist → entity mới bị coi là "đã có trong DB", flush không sinh INSERT.
- clear trước flush → INSERT/UPDATE chưa gửi bị mất.
- Quên cập nhật snapshot sau flush → flush lần sau lặp lại INSERT/UPDATE.
- Sau clear, load lại entity phải đọc từ db (không phải object cũ), nếu không sẽ thấy giá trị cũ.

Ngoài đời, chunk size thường bằng hibernate.jdbc.batch_size (ví dụ 50–100) để batch insert hoạt động, và phải flush trước clear.`,
  }],
  check:[{q:'Thứ tự đúng khi import theo chunk là gì?',options:['persist → clear → flush','persist → flush → clear','clear → persist → flush','flush → persist → clear'],answer:1,explain:`flush gửi SQL tích lũy xuống DB trong transaction; clear giải phóng persistence context. Nếu clear trước flush, entity đã detached nên thay đổi chưa gửi bị mất. Thứ tự bắt buộc: persist → flush → clear.`},{q:'Sau {{clear()}}, entity bạn đang giữ trong biến có còn được Hibernate theo dõi không?',options:['Có, vì vẫn còn trong transaction','Không, nó thành detached; setter không sinh SQL, phải load lại nếu muốn sửa','Có, nếu gọi save()','Tùy cấu hình'],answer:1,explain:`clear xóa identity map và snapshot, mọi entity thành detached. Setter trên detached chỉ đổi RAM, không sinh SQL, không báo lỗi. Muốn sửa phải load lại entity trong context mới.`},{q:'Vì sao import 500.000 dòng trong một transaction dễ OOM?',options:['Vì database từ chối','Vì persistence context giữ 500.000 entity + snapshot, heap phình, flush duyệt toàn bộ','Vì Hibernate không hỗ trợ số lớn','Vì thiếu unique constraint'],answer:1,explain:`Mỗi entity managed tốn RAM cho object và snapshot; mỗi flush duyệt tất cả. 500.000 entity cùng lúc → heap lớn, flush chậm, dễ OOM. Chia chunk + flush + clear giữ context nhỏ.`}],
  related:['jpa-022','jpa-025'],
  tags:['persistence context','dirty checking','chunk','flush','clear']
},
{
  id:'lesson-jpa-018',track:'jpa',order:18,title:'Optimistic locking với @Version: hai transaction xen kẽ, xung đột và retry',level:'senior',minutes:30,
  goals:['Giải thích lost update và vì sao isolation mặc định không chặn được','Hiểu @Version sinh UPDATE ... WHERE version=? và xung đột khi 0 hàng','Mô phỏng hai transaction xen kẽ: A commit trước, B thất bại, B retry đọc version mới','Biết retry đúng: transaction mới, áp dụng lại ý định, giới hạn số lần; khi nào dùng pessimistic lock'],
  body:`### Hiểu nhanh: lost update và @Version
Lost update xảy ra khi hai transaction cùng đọc một bản ghi, cùng sửa trong RAM, rồi ghi đè lẫn nhau: A đọc balance=100, B cũng đọc 100; A ghi 120, B ghi 150 → mất thay đổi của A. {{@Version}} thêm cột version: mỗi entity có version, khi flush Hibernate sinh {{UPDATE ... SET balance=?, version=? WHERE id=? AND version=?}} (version đọc lúc đầu). Nếu transaction khác đã tăng version, câu UPDATE ảnh hưởng 0 hàng → {{OptimisticLockException}}. "Optimistic" vì không giữ lock trong lúc tính toán, chỉ phát hiện xung đột lúc ghi.

### Cơ chế từng bước (hai transaction xen kẽ)
1. A đọc row (version=0, balance=0), giữ snapshot v0.
2. B đọc row (version=0, balance=0), giữ snapshot v0.
3. A sửa balance=100, commit: {{UPDATE WHERE version=0}} → 1 hàng → version=1, balance=100.
4. B sửa balance=200, commit: {{UPDATE WHERE version=0}} → 0 hàng (DB đã v1) → OptimisticLockException.
5. B retry: mở "transaction mới" (đọc lại row v1), áp dụng lại ý định (cộng delta, không ghi lại 200), commit {{WHERE version=1}} → thành công, version=2.

### Retry đúng cách
Retry phải ở lớp ngoài method {{@Transactional}} (transaction cũ đã rollback-only). Mỗi lần thử: đọc version mới, áp dụng lại **ý định** (ví dụ "cộng 50"), giới hạn 3 lần, backoff nhỏ khi tải cao. Không retry vô hạn (khuếch đại tải khi tranh chấp). Nếu xung đột do người dùng sửa dữ liệu khác (giá mới), trả 409 cho người dùng xem lại thay vì retry mù.

### Bẫy production
- Bulk JPQL {{UPDATE}} không tự tăng version → phải {{SET version = version + 1}} hoặc HQL {{UPDATE VERSIONED}}.
- {{@Version}} chỉ bảo vệ từng hàng, không bảo vệ ràng buộc nhiều hàng.
- Hàng nóng (bộ đếm mọi request) → optimistic liên tục fail, dùng UPDATE nguyên tử {{SET stock = stock - 1 WHERE stock > 0}} hoặc pessimistic lock.
- Retry trong cùng transaction là sai.

### Ví dụ đời thực: hai nhân viên cùng sửa đơn hàng
Hệ thống bán vé có 30.000 lượt xem/ngày, 5% chốt đơn. Một nhân viên mở đơn 42 (version=7) lúc 9:00, người khác cũng mở đơn 42 lúc 9:01 (vẫn version=7 vì chưa ai lưu). Người thứ nhất đổi địa chỉ giao, lưu lúc 9:05 → version=8. Người thứ hai đổi ghi chú, lưu lúc 9:06 với version=7 → UPDATE WHERE version=7 ảnh hưởng 0 hàng → ObjectOptimisticLockingFailureException. API trả 409 kèm version=8; giao diện báo "Đơn vừa được người khác cập nhật, tải lại?". Người thứ hai tải lại, thấy địa chỉ mới, chỉ đổi ghi chú, lưu thành công (version=9). Kết quả: không mất thay đổi, tỷ lệ 409 dưới 1% và được ghi log để phát hiện UI cache quá lâu.

### So sánh optimistic và pessimistic lock
| Tiêu chí | Optimistic (@Version) | Pessimistic (SELECT FOR UPDATE) |
|---|---|---|
| Thời điểm phát hiện xung đột | Lúc ghi (flush) | Lúc đọc (giữ lock ngay) |
| Giữ lock trong DB | Không | Có, suốt transaction |
| Phù hợp | Đọc nhiều ghi ít, form mở lâu, xung đột hiếm | Tranh chấp cao trên ít hàng nóng, đoạn xử lý ngắn |
| Rủi ro | Phải retry hoặc trả 409 | Chờ, timeout, deadlock |
| Ví dụ | Sửa hồ sơ khách hàng, đơn hàng | Trừ tồn kho, đặt ghế, bộ đếm |

### Liên hệ phỏng vấn
"Lost update là gì, @Version ngăn thế nào, retry ra sao?" Trả lời: hai transaction đọc cùng version, ghi đè nhau; @Version thêm {{WHERE version=?}} vào UPDATE, 0 hàng → exception. Retry: transaction mới, đọc version mới, áp dụng lại ý định, giới hạn 3 lần. Pessimistic lock (SELECT FOR UPDATE) khi tranh chấp cao trên hàng nóng, đoạn xử lý ngắn.`,
  exercises:[{title:'Hai transaction xen kẽ: version check, xung đột và retry',prompt:`Mô phỏng optimistic locking. {{VersionedRow}} có {{balance}} và {{version}}.
- {{update(expected, newBalance)}}: nếu {{version}} hiện tại khác {{expected}} thì trả {{false}} và **không** đổi gì; nếu khớp thì đặt balance=newBalance, tăng version thêm 1, trả {{true}} (giống UPDATE ... WHERE version = ?).
- {{Tx}}: {{read(row)}} đọc balance và version hiện tại vào object; {{commit(row)}} gọi row.update(version, balance).
- {{Service.applyDelta(row, delta)}}: thử tối đa **3 lần**; mỗi lần tạo Tx mới, read row, cộng delta vào balance, commit. Thành công thì dừng. Sau 3 lần thất bại ném {{IllegalStateException}}.`,
  starter:`class VersionedRow {long balance;int version;
    boolean update(int expected,long newBalance){throw new UnsupportedOperationException("TODO");}
}
class Tx {long balance;int version;
    void read(VersionedRow r){throw new UnsupportedOperationException("TODO");}
    boolean commit(VersionedRow r){throw new UnsupportedOperationException("TODO");}
}
class Service {
    boolean applyDelta(VersionedRow row,long delta){throw new UnsupportedOperationException("TODO");}
}`,
  tests:`public class Main {
    static int passed=0,total=0;
    static void check(String name,boolean ok,String detail){total++;if(ok){passed++;System.out.println("PASS "+name);}else System.out.println("FAIL "+name+": "+detail);}
    public static void main(String[] args){
        VersionedRow row=new VersionedRow();
        Tx a=new Tx();a.read(row);
        Tx b=new Tx();b.read(row);
        a.balance=100;
        check("A commits first",a.commit(row),"A commit failed");
        check("version bumped to 1",row.version==1 && row.balance==100,"v="+row.version+", bal="+row.balance);
        b.balance=200;
        check("B stale commit fails",!b.commit(row),"B commit should fail");
        check("DB unchanged after failed B",row.version==1 && row.balance==100,"v="+row.version+", bal="+row.balance);
        Tx b2=new Tx();b2.read(row);
        b2.balance=300;
        check("B retry succeeds",b2.commit(row),"retry commit failed");
        check("final state v2 bal 300",row.version==2 && row.balance==300,"v="+row.version+", bal="+row.balance);
        VersionedRow row2=new VersionedRow();
        Service svc=new Service();
        boolean ok=svc.applyDelta(row2,50);
        check("service applies delta",ok && row2.balance==50 && row2.version==1,"ok="+ok+", v="+row2.version+", bal="+row2.balance);
        class FlakyRow extends VersionedRow {int calls;
            boolean update(int expected,long newBal){if(calls++==0){version++;return false;}return super.update(expected,newBal);}
        }
        FlakyRow flaky=new FlakyRow();
        boolean ok2=svc.applyDelta(flaky,10);
        check("service retries after conflict",ok2 && flaky.balance==10 && flaky.version==2 && flaky.calls==2,"ok="+ok2+", v="+flaky.version+", calls="+flaky.calls);
        class BusyRow extends VersionedRow {int attempts;
            boolean update(int expected,long newBal){attempts++;return false;}
        }
        BusyRow busy=new BusyRow();
        boolean thrown=false;
        try{svc.applyDelta(busy,5);}catch(IllegalStateException e){thrown=true;}
        check("gives up after 3 attempts",thrown && busy.attempts==3,"thrown="+thrown+", attempts="+busy.attempts);
        System.out.println("RESULT "+passed+"/"+total);
    }
}`,
  reference:`class VersionedRow {long balance;int version;
    boolean update(int expected,long newBalance){
        if(version!=expected)return false;
        balance=newBalance;version++;return true;
    }
}
class Tx {long balance;int version;
    void read(VersionedRow r){balance=r.balance;version=r.version;}
    boolean commit(VersionedRow r){return r.update(version,balance);}
}
class Service {
    boolean applyDelta(VersionedRow row,long delta){
        for(int i=0;i<3;i++){
            Tx tx=new Tx();tx.read(row);
            tx.balance=tx.balance+delta;
            if(tx.commit(row))return true;
        }
        throw new IllegalStateException("conflict after 3 attempts");
    }
}`,
  hints:['update so version truoc; khong khop thi return false ngay, khong doi balance/version.','Tx.read doc ca balance va version; Tx.commit goi update(version, balance).','applyDelta: moi lan thu tao Tx moi, read lai row (version moi), cong delta vao balance, commit; het 3 lan thi throw IllegalStateException.'],
  explain:`Bài tập tách bạch ba bước mà optimistic locking làm ở tầng database: đọc state (balance + version), sửa trong RAM (cộng delta), ghi có điều kiện version. Lỗi hay gặp:
- Đọc version một lần trước vòng lặp → sau xung đột, lần thử sau vẫn dùng version cũ nên fail mãi. Test FlakyRow bắt đúng lỗi này.
- Ghi lại kết quả cũ (200) thay vì áp dụng lại ý định (cộng delta) → sai nghiệp vụ.
- Retry trong cùng transaction → transaction đã rollback-only, không dùng tiếp được.

Ở ứng dụng thật, mỗi lần thử là một transaction mới (đọc entity mới từ DB), vòng retry nằm ngoài method @Transactional, giới hạn 3 lần có backoff.`,
  }],
  check:[{q:'Hai transaction cùng đọc version=5. A commit thành công (version=6). B commit với version=5. Điều gì xảy ra?',options:['B thành công vì sửa field khác','B bị OptimisticLockException vì UPDATE ... WHERE version=5 ảnh hưởng 0 hàng','B tự động retry','B ghi đè A'],answer:1,explain:`@Version thêm điều kiện WHERE version=? vào UPDATE. Khi A đã tăng version lên 6, câu UPDATE của B với version=5 không khớp hàng nào → 0 row affected → Hibernate ném OptimisticLockException. Không phân biệt field nào đổi: version là điều kiện chung cho cả hàng.`},{q:'Retry sau OptimisticLockException đúng cách là gì?',options:['Gửi lại UPDATE với version cũ','Mở transaction mới, đọc entity (version mới), áp dụng lại ý định, giới hạn số lần','Xóa cột version','Bắt exception rồi tiếp tục trong cùng transaction'],answer:1,explain:`Version cũ chắc chắn fail. Transaction hiện tại đã rollback-only nên không thể tiếp tục. Phải mở transaction mới, đọc state mới, áp dụng lại ý định (ví dụ cộng delta), có giới hạn (3 lần) và backoff. Retry vô hạn khuếch đại tải khi tranh chấp.`},{q:'Khi nào pessimistic lock (SELECT ... FOR UPDATE) hợp hơn @Version?',options:['Xung đột cực hiếm','Tranh chấp cao trên ít hàng nóng, đoạn xử lý ngắn','Người dùng mở form sửa 10 phút','Muốn tránh hoàn toàn deadlock'],answer:1,explain:`Tranh chấp cao trên hàng nóng làm optimistic liên tục fail và retry; giữ lock ngắn hiệu quả hơn. Form mở 10 phút mà giữ lock DB thì chặn người khác suốt thời gian đó → optimistic hợp hơn. Xung đột hiếm cũng là đất của optimistic. Pessimistic lock vẫn có thể deadlock chứ không tránh được.`}],
  related:['jpa-024','jpa-022'],
  tags:['optimistic locking','@Version','lost update','retry','pessimistic lock']
},
{
  id:'lesson-jpa-019',track:'jpa',order:19,title:'Dirty checking theo field: snapshot và UPDATE chỉ cột đã đổi',level:'senior',minutes:30,
  goals:['Hiểu Hibernate so sánh entity với snapshot để biết field nào đổi','Biết @DynamicUpdate sinh UPDATE chỉ các cột đổi và khi nên dùng','Mô phỏng persistence context theo dõi field thay đổi và sinh UPDATE chỉ những cột đổi','Biết chi phí dirty checking và @DynamicUpdate khi entity có nhiều cột'],
  body:`**Tóm tắt:** Dirty checking là cơ chế Hibernate tự phát hiện entity nào đã thay đổi: lúc load entity, Hibernate lưu **snapshot** (bản sao giá trị từng property). Khi flush, nó so sánh entity hiện tại với snapshot theo từng property; property nào khác thì đưa vào câu UPDATE. Mặc định Hibernate sinh UPDATE chứa **tất cả cột** để câu SQL cố định (cache được prepared statement). {{@DynamicUpdate}} bật thì sinh UPDATE chỉ các cột đã đổi, câu SQL thay đổi theo tập cột — phù hợp entity nhiều cột (30–50+) mà thường chỉ đổi 1–2 cột.

### Cơ chế từng bước: từ load đến UPDATE
1. **Load entity**: Hibernate SELECT và tạo **snapshot** — mảng giá trị property lúc đọc (String, int, Long...), **không phải tham chiếu** tới object entity. Nếu snapshot trỏ tới cùng object, setter đổi object thì snapshot cũng đổi theo, dirty checking sẽ không bao giờ phát hiện thay đổi.
2. **Setter thay đổi field**: Chỉ sửa object Java trong RAM, **không chạy SQL**. Snapshot vẫn giữ giá trị cũ.
3. **Flush**: Hibernate duyệt identity map, so từng property của entity managed với snapshot. Property nào khác → đánh dấu dirty, thu vào tập changed properties.
4. **Sinh UPDATE**:
   - Mặc định: UPDATE chứa **tất cả cột** của entity (kể cả cột không đổi). Lợi: câu SQL cố định → JDBC/DB tái dùng prepared statement (statement cache). Tốn: payload lớn hơn, DB ghi cột không đổi (kích hoạt trigger, cập nhật index).
   - Với {{@DynamicUpdate}}: chỉ các cột trong tập changed properties. Lợi: giảm I/O, giảm lock duration, tốt cho bảng có trigger/index nhạy cảm. Cái giá: câu SQL thay đổi mỗi lần → giảm cơ hội tái dùng prepared statement; Hibernate vẫn phải so snapshot toàn bộ để tìm cột dirty.
5. **Sau flush**: Hibernate ghi đè snapshot bằng trạng thái hiện tại. Nếu quên bước này, flush lần sau sẽ lặp lại UPDATE.

### Khi nào nên dùng @DynamicUpdate (và khi nào không)
| Trường hợp | Khuyến nghị |
|---|---|
| Entity 30–50+ cột, thường chỉ sửa 1–2 cột | **Bật @DynamicUpdate** — giảm payload và I/O đáng kể |
| Bảng có trigger/index trên cột nhạy cảm | **Bật** — tránh kích hoạt trigger/index khi cột không đổi |
| Entity nhỏ (< 10 cột) | **Không bật** — chi phí build SQL động + mất statement cache không bù lại lợi ích |
| Entity sửa nhiều cột cùng lúc | **Không bật** — câu SQL gần như giống mặc định, thêm chi phí build |

> **Lưu ý:** @DynamicUpdate **không tự động bật**; phải khai báo tường minh trên entity. Bytecode enhancement (plugin hibernate-enhance-maven-plugin) là tối ưu khác: chèn code vào setter để đánh dấu field bẩn ngay lúc gán, flush chỉ đọc danh sách field đã đổi thay vì so toàn bộ snapshot. Cần bật trong build; đừng giả định project đã có.

### Ví dụ đời thực: bảng hồ sơ khách hàng 45 cột
Hệ thống CRM có entity {{CustomerProfile}} 45 cột (thông tin cá nhân, địa chỉ, sở thích, lịch sử...). Endpoint PATCH {{/profile}} cho phép khách hàng tự cập nhật avatar và nickname (2 cột). Trước khi bật @DynamicUpdate: mỗi lần PATCH sinh UPDATE 45 cột, DB mất 3 ms ghi index/trigger cho 43 cột không đổi; 1000 req/s → 3000 ms/s CPU DB cho việc vô nghĩa. Sau khi bật @DynamicUpdate: UPDATE chỉ 2 cột, CPU DB giảm 85%, p99 latency từ 45 ms xuống 28 ms. Đo bằng {{hibernate.generate_statistics}} và slow query log.

### Lỗi hay gặp
- **Quên @DynamicUpdate**: entity nhiều cột vẫn sinh UPDATE toàn bộ — đo statistics mới phát hiện.
- **Dirty checking chạy trên entity chỉ đọc**: transaction dài import 500k entity, mỗi entity managed tốn RAM snapshot và CPU so sánh lúc flush. Dùng {{@Transactional(readOnly = true)}} cho phần chỉ đọc để Hibernate bỏ snapshot và dirty checking.
- **Bulk JPQL UPDATE**: {{@Modifying @Query("UPDATE Profile p SET p.updated = now()")}} bypass dirty checking, không tăng {{@Version}}, entity managed vẫn giữ giá trị cũ — phải {{clearAutomatically = true}} hoặc tự clear context.
- **Quên cập nhật snapshot sau flush** (khi tự viết persistence context): flush lặp lại UPDATE cho cùng thay đổi.

### Trả lời mẫu khi phỏng vấn
"Dirty checking: Hibernate lưu snapshot giá trị property lúc load. Flush so từng property với snapshot; property khác → đưa vào UPDATE. Mặc định UPDATE tất cả cột để câu SQL cố định (statement cache). @DynamicUpdate sinh UPDATE chỉ cột dirty — phù hợp entity nhiều cột đổi ít (giảm I/O, tránh trigger), chi phí là mất statement cache. Bulk update bypass dirty checking, không tự tăng @Version. Import lớn phải chunk + flush + clear, read-only transaction bỏ snapshot."

> **Senior tip:** Đừng bật @DynamicUpdate cho mọi entity. Chỉ bật khi đã đo (statistics, profiler) thấy lợi. Entity nhỏ thì UPDATE tất cả cột tái dùng prepared statement tốt hơn. Bytecode enhancement giảm chi phí so snapshot nhưng phải bật trong build và test tương thích AOP/JaCoCo. Luôn đo: payload, CPU DB, heap, p99 latency — không chỉ "giảm cột UPDATE".`,
  exercises:[{title:'Mini persistence context: theo dõi field đổi và sinh UPDATE',prompt:`Cài {{MiniContext}} theo dõi entity {{Row}} có id, name, email. snapshot lưu giá trị lúc load. setField(id, field, value) đặt giá trị và đánh dấu field dirty. flush() sinh câu UPDATE chỉ các cột dirty (theo thứ tự name, email), rồi reset dirty và cập nhật snapshot. Nếu không dirty trả về rỗng.`,
  starter:`class Row {long id;String name;String email;Row(long i,String n,String e){id=i;name=n;email=e;}}
class MiniContext {
    Map<Long,Row> entities=new HashMap<>();
    Map<Long,Map<String,String>> snapshot=new HashMap<>();
    Map<Long,Set<String>> dirty=new HashMap<>();
    void load(Row r){throw new UnsupportedOperationException("TODO");}
    void setField(long id,String field,String value){throw new UnsupportedOperationException("TODO");}
    List<String> flush(){throw new UnsupportedOperationException("TODO");}
}`,
  tests:`public class Main {
    static int passed=0,total=0;
    static void check(String name,boolean ok,String detail){total++;if(ok){passed++;System.out.println("PASS "+name);}else System.out.println("FAIL "+name+": "+detail);}
    public static void main(String[] args){
        MiniContext ctx=new MiniContext();
        Row r=new Row(1,"A","a@x");
        ctx.load(r);
        ctx.setField(1,"name","B");
        List<String> sql=ctx.flush();
        check("only changed column",sql.equals(List.of("UPDATE row SET name='B' WHERE id=1")),"sql="+sql);
        check("dirty cleared",ctx.flush().isEmpty(),"second flush should be empty");
        ctx.setField(1,"name","C");ctx.setField(1,"email","c@x");
        List<String> sql2=ctx.flush();
        check("multiple changed columns",sql2.equals(List.of("UPDATE row SET name='C', email='c@x' WHERE id=1")),"sql="+sql2);
        ctx.load(new Row(2,"X","x@x"));
        ctx.setField(2,"email","y@x");
        check("per entity",ctx.flush().equals(List.of("UPDATE row SET email='y@x' WHERE id=2")),"sql="+ctx.flush());
        System.out.println("RESULT "+passed+"/"+total);
    }
}`,
  reference:`class Row {long id;String name;String email;Row(long i,String n,String e){id=i;name=n;email=e;}}
class MiniContext {
    Map<Long,Row> entities=new HashMap<>();
    Map<Long,Map<String,String>> snapshot=new HashMap<>();
    Map<Long,Set<String>> dirty=new HashMap<>();
    void load(Row r){entities.put(r.id,r);Map<String,String> s=new HashMap<>();s.put("name",r.name);s.put("email",r.email);snapshot.put(r.id,s);dirty.put(r.id,new LinkedHashSet<>());}
    void setField(long id,String field,String value){Row r=entities.get(id);if(field.equals("name"))r.name=value;else if(field.equals("email"))r.email=value;dirty.get(id).add(field);}
    List<String> flush(){
        List<String> out=new ArrayList<>();
        for(Long id:entities.keySet()){
            Set<String> d=dirty.get(id);
            if(d==null||d.isEmpty())continue;
            List<String> cols=new ArrayList<>();
            if(d.contains("name"))cols.add("name='"+entities.get(id).name+"'");
            if(d.contains("email"))cols.add("email='"+entities.get(id).email+"'");
            out.add("UPDATE row SET "+String.join(", ",cols)+" WHERE id="+id);
            Map<String,String> s=snapshot.get(id);s.put("name",entities.get(id).name);s.put("email",entities.get(id).email);
            d.clear();
        }
        return out;
    }
}`,
  hints:['load lưu snapshot name/email; setField đổi giá trị và thêm field vào dirty set.','flush chỉ sinh cột dirty theo thứ tự name rồi email; sau đó clear dirty và cập nhật snapshot.'],
  explain:`Bài tập tách bạch: load (snapshot), setField (dirty), flush (sinh UPDATE + reset). Lỗi hay gặp: sinh UPDATE tất cả cột dù không dirty; quên reset dirty → flush lặp; không cập nhật snapshot → lần sau vẫn coi là dirty. Ở Hibernate thật, @DynamicUpdate bật thì câu SQL chỉ gồm cột dirty, nhưng dirty checking vẫn so toàn bộ property.`,
  }],
  check:[{q:'@DynamicUpdate sinh UPDATE với những cột nào?',options:['Tất cả cột','Chỉ các cột đã đổi','Chỉ cột @Version','Chỉ cột not-null'],answer:1,explain:'@DynamicUpdate làm Hibernate sinh UPDATE chỉ các cột dirty (đã đổi), câu SQL thay đổi theo tập cột. Mặc định (không @DynamicUpdate) sinh UPDATE tất cả cột để câu SQL cố định.'},{q:'Khi nào @DynamicUpdate thường không đáng dùng?',options:['Entity có 50 cột và thường đổi 1 cột','Entity nhỏ ít cột','Bảng có trigger','Tranh chấp cao'],answer:1,explain:'Entity nhỏ ít cột: chi phí build SQL động và mất cache câu SQL chuẩn bị sẵn không bù lại lợi ích. @DynamicUpdate hợp entity nhiều cột đổi ít.'},{q:'Dirty checking so sánh entity với cái gì?',options:['Database hiện tại','Snapshot lúc load vào context','Cache L2','Index'],answer:1,explain:'Hibernate lưu snapshot của entity lúc load vào persistence context; flush so entity hiện tại với snapshot theo từng property. Nếu không có snapshot (entity new) thì coi là insert.'}],
  related:['jpa-008','jpa-017'],
  tags:['dirty checking','@DynamicUpdate','snapshot','flush']
},
{
  id:'lesson-jpa-020',track:'jpa',order:20,title:'Optimistic locking: bulk update và retry có giới hạn với backoff',level:'senior',minutes:30,
  goals:['Biết bulk JPQL UPDATE không tự tăng @Version và cách xử lý','Mô phỏng retry có giới hạn với backoff khi xung đột','Hiểu idempotency và áp dụng lại ý định thay vì ghi lại giá trị cũ','Biết khi nào trả 409 thay vì retry'],
  body:`### Hiểu nhanh: bulk update và retry
Bulk JPQL {{UPDATE}} đi thẳng xuống DB, bỏ qua persistence context và dirty checking, nên {{@Version}} **không** tự tăng. Phải viết {{SET version = version + 1}} hoặc dùng {{update versioned}} (HQL riêng của Hibernate). Retry sau xung đột phải có giới hạn (ví dụ 3 lần) và backoff nhỏ; nếu dữ liệu nghiệp vụ đã đổi (giá mới) thì trả 409 để người dùng xem lại thay vì retry mù.

### Vì sao bulk update làm hỏng optimistic locking
Optimistic locking của JPA dựa trên một quy ước: **mọi lần ghi đều tăng version**. Khi bạn sửa entity đã load rồi flush, Hibernate sinh câu lệnh dạng:

~~~sql
UPDATE account SET balance = 150, version = 8
WHERE id = 1 AND version = 7;   -- 0 dòng bị ảnh hưởng => OptimisticLockException
~~~

Bulk JPQL thì khác: Hibernate dịch thẳng sang SQL, không đi qua entity, không biết cột version là gì (trừ khi bạn nói). Hậu quả thực tế:
- Transaction A load account version 7, đang giữ trong memory.
- Job đêm chạy {{UPDATE Account a SET a.balance = a.balance * 1.01}}: balance đổi, version **vẫn là 7**.
- A flush với {{WHERE version = 7}}: khớp, ghi đè mất tiền lãi vừa cộng. Không có exception nào báo cho bạn.

Cách sửa:

~~~java
// Tự tăng version trong JPQL chuẩn
em.createQuery("""
    UPDATE Account a
    SET a.balance = a.balance * :rate, a.version = a.version + 1
    WHERE a.status = :status""")
  .setParameter("rate", new BigDecimal("1.01"))
  .setParameter("status", Status.ACTIVE)
  .executeUpdate();
// Hibernate: "update versioned Account a set ..." tự tăng version
// Sau bulk update: em.clear() để persistence context không giữ entity cũ
~~~

Lưu ý thêm: bulk update **không** đồng bộ persistence context hiện tại. Entity đã load trước đó vẫn mang giá trị cũ, nên hãy chạy bulk ở transaction riêng hoặc gọi {{em.clear()}} ngay sau. Với Spring Data, dùng {{@Modifying(clearAutomatically = true)}}.

### Cơ chế retry đúng
1. Mỗi lần thử mở **transaction mới**, đọc lại entity với version mới nhất. Retry bên trong cùng transaction là vô ích, vì persistence context vẫn giữ bản cũ và transaction đã bị đánh dấu rollback-only.
2. Áp dụng lại **ý định** (ví dụ cộng delta 50), không ghi lại giá trị đã tính từ lần đọc trước.
3. Commit với version mới; nếu lại xung đột, tăng số lần thử và chờ backoff.
4. Sau N lần fail: trả 409 hoặc ném exception cho caller quyết định.

Retry phải nằm **ngoài** biên transaction. Trong Spring, nếu {{@Retryable}} và {{@Transactional}} đặt trên cùng method thì thứ tự proxy quyết định retry có mở transaction mới không. Cách an toàn: một bean ngoài làm retry, gọi sang bean có {{@Transactional}}.

### Backoff và giới hạn: vì sao cần
| Cấu hình | Hệ quả |
|---|---|
| Retry vô hạn, không backoff | Nhiều request cùng tranh một hàng, cùng thất bại rồi cùng thử lại ngay: livelock, CPU và DB tăng vọt |
| 3 lần, backoff 10–50 ms + jitter | Đủ cho xung đột ngắn (2 người bấm cùng lúc); các request tự lệch nhau |
| Xung đột kéo dài (hàng "nóng") | Retry không cứu được; cần đổi thiết kế: hàng đợi, pessimistic lock, tách bộ đếm |

Jitter (cộng ngẫu nhiên vài ms) giúp các request không đồng loạt thử lại cùng thời điểm.

### Idempotency
Operation phải idempotent theo ý định: áp dụng lại nhiều lần vẫn cho kết quả đúng. "Cộng 50 vào số dư hiện tại" đúng khi đọc lại state mỗi lần thử; "đặt balance = 200" (giá trị tính từ lần đọc cũ) sẽ ghi đè thay đổi của người khác. Nếu operation gọi ra ngoài (gửi email, gọi payment gateway), đừng đặt trong vòng retry: dùng idempotency key hoặc outbox.

### Khi nào trả 409 thay vì retry
- Người dùng đã nhìn thấy dữ liệu cũ và ra quyết định dựa trên nó (sửa form sản phẩm, duyệt giá): retry âm thầm là sai, phải trả 409 để họ xem bản mới.
- Hệ thống tự tính (cộng điểm, trừ tồn kho theo delta): retry an toàn.

> Pitfall production: bắt {{OptimisticLockException}} bên trong method {{@Transactional}} rồi "thử lại" ngay trong đó. Exception thường nổ lúc commit (sau khi method đã return), nên khối catch không bao giờ chạy; nếu có chạy thì transaction đã rollback-only.

### Liên hệ phỏng vấn
"Bulk update có tăng version không? Retry thế nào?" Trả lời: không tự tăng, phải {{SET version = version + 1}} hoặc {{update versioned}}, và clear persistence context. Retry bằng transaction mới, áp dụng lại ý định, giới hạn 3 lần với backoff + jitter, đặt retry ngoài biên {{@Transactional}}. Dữ liệu người dùng đã xem bị đổi thì trả 409. Hàng nóng xung đột liên tục là dấu hiệu cần đổi thiết kế, không phải tăng số lần retry.`,
  exercises:[{title:'Retry có giới hạn và backoff',prompt:`Cài {{RetryService}} gọi operation {{op}} (Runnable ném {{ConflictException}} khi xung đột). Thử tối đa {{maxAttempts}} lần; mỗi lần fail tăng backoff (delayMs += 10). Nếu thành công trả true; nếu hết lần ném {{IllegalStateException}}. Ghi lại số lần thử vào {{attempts}}.`,
  starter:`class ConflictException extends RuntimeException {}
class RetryService {
    int maxAttempts=3;
    int attempts=0;
    int delayMs=0;
    boolean run(Runnable op){throw new UnsupportedOperationException("TODO");}
}`,
  tests:`public class Main {
    static int passed=0,total=0;
    static void check(String name,boolean ok,String detail){total++;if(ok){passed++;System.out.println("PASS "+name);}else System.out.println("FAIL "+name+": "+detail);}
    public static void main(String[] args){
        RetryService s=new RetryService();
        s.maxAttempts=3;
        int[] calls={0};
        boolean ok=s.run(()->{calls[0]++;if(calls[0]<2)throw new ConflictException();});
        check("succeeds on second attempt",ok && s.attempts==2 && calls[0]==2,"ok="+ok+", attempts="+s.attempts);
        check("backoff grows",s.delayMs==10,"delayMs="+s.delayMs);
        RetryService s2=new RetryService();
        s2.maxAttempts=2;
        int[] calls2={0};
        boolean thrown=false;
        try{s2.run(()->{calls2[0]++;throw new ConflictException();});}catch(IllegalStateException e){thrown=true;}
        check("gives up after max",thrown && s2.attempts==2 && calls2[0]==2,"thrown="+thrown+", attempts="+s2.attempts);
        RetryService s3=new RetryService();
        s3.maxAttempts=1;
        boolean ok3=s3.run(()->{});
        check("single attempt success",ok3 && s3.attempts==1,"ok="+ok3+", attempts="+s3.attempts);
        System.out.println("RESULT "+passed+"/"+total);
    }
}`,
  reference:`class ConflictException extends RuntimeException {}
class RetryService {
    int maxAttempts=3;
    int attempts=0;
    int delayMs=0;
    boolean run(Runnable op){
        for(int i=0;i<maxAttempts;i++){
            attempts++;
            try{op.run();return true;}
            catch(ConflictException e){delayMs+=10;if(i==maxAttempts-1)throw new IllegalStateException("conflict after "+maxAttempts+" attempts");}
        }
        return false;
    }
}`,
  hints:['Moi lan thu tang attempts; thanh cong return true.','Khi fail, delayMs += 10; neu la lan cuoi thi throw IllegalStateException.'],
  explain:`Bài tập mô phỏng retry loop với backoff. Lỗi hay gặp: retry vô hạn; không tăng backoff; ném exception sai loại; đếm attempts sai. Ở ứng dụng thật, mỗi lần thử là transaction mới, backoff có thể exponential với jitter, và sau N lần fail trả 409.`,
  }],
  check:[{q:'Bulk JPQL UPDATE có tự tăng @Version không?',options:['Có, Hibernate tự tăng','Không, bypass dirty checking; phải SET version = version + 1','Tùy database','Chỉ khi có @Modifying'],answer:1,explain:'Bulk JPQL UPDATE đi thẳng DB, không đi qua persistence context nên @Version không tự tăng. Phải viết SET version = version + 1 hoặc dùng HQL VERSIONED.'},{q:'Khi nào nên trả 409 thay vì retry?',options:['Xung đột do tải cao tạm thời','Dữ liệu nghiệp vụ đã đổi (giá mới) cần người dùng xem lại','Lần thử đầu tiên fail','Khi dùng pessimistic lock'],answer:1,explain:'Retry chỉ hợp xung đột tạm thời do tranh chấp. Nếu dữ liệu nghiệp vụ đã thay đổi (ví dụ giá mới), retry mù sẽ ghi đè ý định người dùng → nên trả 409 để họ xem lại và quyết định.'},{q:'Idempotency trong retry nghĩa là gì?',options:['Retry vô hạn','Áp dụng lại ý định cho kết quả đúng dù chạy nhiều lần','Không retry','Dùng cùng transaction'],answer:1,explain:'Operation idempotent: áp dụng lại ý định (cộng delta) cho kết quả đúng dù chạy nhiều lần. Ghi lại giá trị cũ (đặt balance=200) không idempotent và sai nghiệp vụ.'}],
  related:['jpa-024','jpa-011'],
  tags:['optimistic locking','bulk update','retry','backoff','409']
}
);

