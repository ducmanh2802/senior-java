/* Bài học microservices: mô phỏng pattern phân tán bằng Java thuần. */
(window.LESSONS = window.LESSONS || []).push(
{
  id: 'lesson-microservices-001', track: 'microservices', order: 1,
  title: 'Transactional outbox: không mất event giữa database và broker', level: 'senior', minutes: 30,
  goals: ['Giải thích được dual-write và vì sao transaction DB không bao trùm Kafka', 'Thiết kế outbox relay chịu được crash và gửi lặp', 'Phân biệt atomicity nội bộ với delivery at-least-once'],
  body: `**Tóm tắt:** Transactional outbox ghi thay đổi nghiệp vụ và event cần phát trong cùng transaction database. Một relay đọc outbox rồi gửi event; vì crash có thể xảy ra giữa gửi và đánh dấu, consumer vẫn phải idempotent.

### Vì sao dual-write nguy hiểm
Một request thường phải cập nhật order trong DB và publish OrderCreated lên Kafka. Nếu commit DB trước rồi process chết, order tồn tại nhưng không có event. Nếu publish trước rồi DB rollback, consumer nhận event về một order chưa từng được commit. Gọi hai thao tác liên tiếp không tạo thành một transaction phân tán.

Outbox giải quyết bằng cách lưu cả hai record trong cùng transaction:
~~~text
BEGIN
  INSERT order(...)
  INSERT outbox(id, aggregate_id, type, payload, created_at)
COMMIT
~~~
Rollback thì cả hai cùng mất; commit thì relay có thể khôi phục việc phát sau sự cố. Đây là atomicity giữa state và ý định phát event, không phải atomicity với broker.

### Relay và giới hạn delivery
Relay có thể polling các hàng chưa gửi rồi publish. Trình tự phổ biến: publish thành công, sau đó đánh dấu sent. Nếu process chết giữa hai bước, lần sau publish lại. Đánh dấu trước khi publish lại tạo cửa sổ mất message. Vì vậy thiết kế ưu tiên at-least-once và dùng event id ổn định để consumer deduplicate.

~~~java
// Phác thảo: transaction chỉ bao các thao tác trên cùng database.
transaction(() -> {
    orders.insert(order);
    outbox.insert(new Event(eventId, order.id(), "OrderCreated"));
});
// Relay gửi event; chỉ đánh dấu sau ACK, nên có thể gửi lặp khi crash.
~~~

### Tích hợp production
Outbox có thể là bảng SQL được relay polling có giới hạn batch, hoặc CDC đọc transaction log. Lựa chọn CDC phổ biến là Debezium chạy trên Kafka Connect: connector đọc transaction log (WAL của PostgreSQL, binlog của MySQL) nên chỉ thấy các row đã commit; SMT Outbox Event Router biến mỗi row outbox thành message trên topic theo aggregate type, dùng aggregate id làm message key. Ứng dụng không cần tự poll. Spring Cloud Stream giúp kết nối binder và handler nhưng không tự biến DB transaction với Kafka thành một atomic transaction. Kafka transaction chỉ bao phủ thao tác trong Kafka (produce và commit offset của consumer); nó không bao trùm một relational DB.

| Cách | Ưu điểm | Chi phí / lưu ý |
|---|---|---|
| Polling | Ít hạ tầng, dễ hiểu | Query tải DB, cần claim row và backoff |
| CDC | Độ trễ thấp, ít polling | Vận hành connector, schema và log retention |

### Pitfall production
Outbox tăng liên tục nếu không dọn sent row; dọn quá sớm làm mất khả năng replay. Nhiều relay cùng chọn row phải dùng claim/lease hoặc cơ chế CDC có checkpoint. Thứ tự theo aggregate cần partition key ổn định và sequence/version; thứ tự toàn cục thường không được đảm bảo. Payload cần version hóa, bảo vệ dữ liệu nhạy cảm và có metric tuổi row cũ nhất, lag, retry.

### Liên hệ phỏng vấn
Hãy mô tả crash ở từng ranh giới: trước commit, sau commit trước publish, sau publish trước ACK/mark. Sau đó giải thích vì sao consumer idempotent vẫn cần thiết và cách replay một khoảng event.

> Senior tip: theo dõi p95/p99 tuổi outbox chưa gửi và số hàng backlog; alert theo tuổi sự kiện thường phản ánh tác động người dùng tốt hơn chỉ đếm hàng.
`,
  exercises: [{
    title: 'Ghi order và outbox nguyên tử, relay có thể retry',
    prompt: `Cài {{OutboxStore}} mô phỏng transaction trong bộ nhớ. {{create(id, failAfterOrder)}} ghi order và event cùng nhau: id trùng thì ném {{IllegalArgumentException}}; {{failAfterOrder = true}} mô phỏng lỗi xảy ra sau khi ghi order, phải ném {{IllegalStateException}} và không để lại order lẫn event (không có dữ liệu một nửa). {{relay(sender)}} lần lượt đưa các event chưa gửi cho sender và trả về số event gửi thành công trong lần gọi đó; chỉ đánh dấu đã gửi khi sender trả {{true}}, sender trả {{false}} thì giữ event để retry (nên dừng ở event lỗi đầu tiên để giữ thứ tự). Event đã gửi không được đưa cho sender lần nữa. Các method đều {{synchronized}} để thao tác nhất quán.`,
    starter: `record Event(String id, String orderId) {}
class OutboxStore {
    private final Map<String, String> orders = new HashMap<>();
    private final Map<String, Event> events = new LinkedHashMap<>();
    private final Set<String> sent = new HashSet<>();
    synchronized void create(String id, boolean failAfterOrder) {
        throw new UnsupportedOperationException("TODO");
    }
    synchronized int relay(java.util.function.Predicate<Event> sender) {
        throw new UnsupportedOperationException("TODO");
    }
    synchronized int orderCount() { return orders.size(); }
    synchronized int eventCount() { return events.size(); }
    synchronized int pending() { return events.size() - sent.size(); }
}`,
    tests: `public class Main {
 static int p=0,t=0; static void ck(String n,Runnable r){t++;try{r.run();p++;System.out.println("PASS "+n);}catch(Throwable e){System.out.println("FAIL "+n+": "+e);}}
 static void eq(Object a,Object b){if(!Objects.equals(a,b))throw new AssertionError(a+" != "+b);}
 public static void main(String[] z){
  ck("atomic create",()->{OutboxStore s=new OutboxStore();s.create("o1",false);eq(1,s.orderCount());eq(1,s.eventCount());eq(1,s.pending());});
  ck("rollback leaves neither row",()->{OutboxStore s=new OutboxStore();try{s.create("x",true);}catch(IllegalStateException ok){}eq(0,s.orderCount());eq(0,s.eventCount());});
  ck("duplicate rejected",()->{OutboxStore s=new OutboxStore();s.create("x",false);try{s.create("x",false);throw new AssertionError();}catch(IllegalArgumentException ok){}eq(1,s.eventCount());});
  ck("failed send remains pending then succeeds",()->{OutboxStore s=new OutboxStore();s.create("a",false);eq(0,s.relay(e->false));eq(1,s.pending());eq(1,s.relay(e->true));eq(0,s.pending());});
  ck("each event sent once after success",()->{OutboxStore s=new OutboxStore();s.create("a",false);s.create("b",false);List<String> got=new ArrayList<>();eq(2,s.relay(e->{got.add(e.id());return true;}));eq(0,s.relay(e->{throw new AssertionError();}));eq(2,got.size());});
  System.out.println("RESULT "+p+"/"+t);
 }
}`,
    reference: `record Event(String id, String orderId) {}
class OutboxStore {
    private final Map<String,String> orders=new HashMap<>();
    private final Map<String,Event> events=new LinkedHashMap<>();
    private final Set<String> sent=new HashSet<>();
    synchronized void create(String id, boolean failAfterOrder) {
        if (orders.containsKey(id)) throw new IllegalArgumentException("duplicate");
        // Stage mutations first: validation/error cannot expose partial state.
        String order=id; Event event=new Event("evt-"+id,id);
        if (failAfterOrder) throw new IllegalStateException("simulated rollback");
        orders.put(id,order); events.put(event.id(),event);
    }
    synchronized int relay(java.util.function.Predicate<Event> sender) {
        int count=0;
        for(Event e:events.values()) {
            if(sent.contains(e.id())) continue;
            if(!sender.test(e)) break; // no ACK: leave pending for a later attempt
            sent.add(e.id()); count++;
        }
        return count;
    }
    synchronized int orderCount(){return orders.size();}
    synchronized int eventCount(){return events.size();}
    synchronized int pending(){return events.size()-sent.size();}
}`,
    hints: ['Chuẩn bị (stage) cả order lẫn event, kiểm tra lỗi mô phỏng trước, rồi mới ghi cả hai vào map.', 'Giữ relay synchronized; với mỗi event pending, sender false nghĩa là chưa ACK.', 'Chỉ thêm event id vào sent sau khi sender thành công; retry có thể gửi lại nếu crash thật nằm giữa hai thao tác.'],
    explain: `Bài tập gom hai thay đổi dưới một monitor và stage dữ liệu trước khi commit vào map. Trong DB thật, transaction cung cấp rollback; monitor chỉ mô phỏng tính loại trừ trong một JVM, không thay thế transaction bền vững.

Relay đánh dấu sau khi sender thành công. Nếu sender ném lỗi, exception được truyền ra và trạng thái sent chưa đổi. Nếu broker đã nhận nhưng ứng dụng chưa kịp ghi sent rồi chết, lần chạy sau có thể gửi trùng; mô hình này nhấn mạnh vì sao production cần consumer dedup theo event id. Mutex trong ví dụ cũng giữ lock qua network call, điều không nên làm production vì làm nghẽn ghi; relay thật claim batch rồi gửi ngoài transaction, sau đó cập nhật trạng thái/offset phù hợp.

Lỗi thường gặp: đánh dấu trước send làm mất event khi broker lỗi; tạo order trước rồi ném lỗi mà không rollback để lại trạng thái nửa vời; hoặc cho rằng synchronized bảo vệ nhiều instance/process.`,
  }],
  check: [
    { q: 'Relay gửi thành công nhưng process chết trước khi ghi sent. Kết quả có thể là gì?', options: ['Event bị mất chắc chắn', 'Event được gửi lại; consumer cần deduplicate', 'DB tự rollback transaction đã commit', 'Kafka xóa event'], answer: 1, explain: `Outbox giữ hàng chưa đánh dấu nên relay sẽ thử lại. Điều này tạo duplicate nhưng tránh mất event; consumer dùng event id ổn định để xử lý idempotent.` },
    { q: 'Debezium (kèm SMT Outbox Event Router) lấy event từ bảng outbox bằng cách nào?', options: ['CDC từ transaction log của database', 'Quét mọi bảng mỗi mili giây', 'Gọi trực tiếp controller Spring', 'Đọc ThreadLocal của producer'], answer: 0, explain: `Debezium connector đọc transaction log (WAL của PostgreSQL, binlog của MySQL) để bắt các INSERT đã commit vào bảng outbox; Outbox Event Router chỉ là SMT biến đổi và định tuyến change event đó sang topic. Debezium không quét bảng theo chu kỳ, không gọi vào ứng dụng và không đọc state trong JVM của producer.` },
  ], tags: ['outbox', 'CDC', 'Kafka', 'atomicity']
},
{
  id: 'lesson-microservices-002', track: 'microservices', order: 2,
  title: 'Idempotent consumer: chống duplicate và sự kiện cũ', level: 'senior', minutes: 25,
  goals: ['Giải thích at-least-once và duplicate', 'Deduplicate bằng messageId trong cùng transaction với side effect', 'Bỏ qua event có version cũ'],
  body: `**Tóm tắt:** Consumer idempotent biến việc nhận cùng message nhiều lần thành một hiệu ứng nghiệp vụ duy nhất. Cần lưu messageId hoặc version cùng transaction với cập nhật state; chỉ cache trong RAM không đủ khi restart hay chạy nhiều instance.

### Vì sao nhận lặp là bình thường
Broker thường chỉ biết consumer đã commit offset hay chưa, không biết side effect ở DB đã commit chưa. Nếu DB commit xong nhưng process chết trước khi commit offset, broker giao lại message. Đây là hành vi at-least-once: ưu tiên không mất message, chấp nhận giao trùng. Mạng timeout cũng không cho producer biết server đã xử lý hay chưa.

### Dedup và version
Bảng inbox có unique key (consumer, message_id). Consumer trong một DB transaction: insert inbox; nếu conflict thì kết thúc không làm side effect; nếu mới thì cập nhật projection rồi commit. Hai thao tác phải nguyên tử. Với event thay thế state, lưu version theo aggregate và chỉ áp dụng version lớn hơn hiện tại; event cũ đến muộn bị bỏ qua. Với event cộng dồn (charge, increment), version không thể tự thay thế dedup id.

~~~java
if (inbox.insertIfAbsent(message.id())) { // unique constraint là trọng tài giữa replicas
    if (message.version() > current.version()) apply(message);
}
~~~

### Phân biệt event và command
Event thường mô tả điều đã xảy ra, còn command yêu cầu hành động. Không nên bỏ command khác id chỉ vì payload giống nhau; hai giao dịch hợp lệ có thể cùng số tiền. Idempotency key nên do nguồn tạo và ổn định qua retry. Với HTTP API, lưu key, request fingerprint và kết quả để lần gọi lại trả cùng kết quả.

| Cơ chế | Bao phủ | Giới hạn |
|---|---|---|
| Set trong RAM | Một process đang sống | Mất khi restart, không chia sẻ replicas |
| Inbox SQL unique | Nhiều instance, bền vững | Tăng dung lượng; cần retention có căn cứ |
| Version aggregate | Bỏ event state cũ | Không đủ cho mọi side effect cộng dồn |

### Công cụ và production
Kafka consumer offset và DB transaction là hai hệ thống riêng; commit offset sau DB thường tạo at-least-once. Kafka transactions hỗ trợ consume-transform-produce trong Kafka, nhưng không tự nguyên tử với database ngoài. Spring Cloud Stream cung cấp listener/binder và error handling, không tự làm business side effect idempotent. Thiết kế schema inbox có unique constraint, metric duplicate rate, lag, conflict version; retention phải dài hơn cửa sổ replay/khôi phục. Nếu xóa key quá sớm, replay cũ có thể chạy lại side effect.

### Pitfall
Check-then-act không atomic: hai consumer cùng thấy key chưa có rồi cả hai cùng trừ tiền. Dùng unique constraint và xử lý duplicate key. Không dùng timestamp làm version nếu đồng hồ có thể lệch; sequence tăng đơn điệu theo aggregate tốt hơn. Với event out-of-order dạng delta, cần buffer/gap handling hoặc rebuild từ source; chỉ bỏ version cũ có thể làm mất delta bắt buộc.

### Liên hệ phỏng vấn
Hãy chỉ ra điểm crash giữa DB commit và offset commit, rồi mô tả unique key, transaction boundary, retention và cách xử lý event đến sai thứ tự.

> Senior tip: đo duplicate rate theo topic/consumer; tỷ lệ tăng đột ngột thường chỉ ra rebalance, timeout hoặc DB latency chứ không nhất thiết là lỗi broker.
`,
  exercises: [{
    title: 'Áp dụng message một lần và chỉ nhận version mới',
    prompt: `Cài {{Projection}}. {{apply(m)}} nhận {{Message(id, version, value)}}, trả {{true}} khi có hiệu ứng state mới, {{false}} nếu id đã xử lý hoặc version không lớn hơn version hiện tại (bằng nhau cũng là cũ). Dedup theo id độc lập với version: mọi id đã nhận, kể cả event cũ bị bỏ qua, đều được ghi vào {{seen}} ({{seenCount()}} đếm cả chúng). Chỉ thay {{value}} và {{version}} khi áp dụng. Tất cả thao tác thread-safe.`,
    starter: `record Message(String id, long version, String value) {}
class Projection {
    private final Set<String> seen = new HashSet<>();
    private long version = 0;
    private String value = "";
    synchronized boolean apply(Message m) { throw new UnsupportedOperationException("TODO"); }
    synchronized long version() { return version; }
    synchronized String value() { return value; }
    synchronized int seenCount() { return seen.size(); }
}`,
    tests: `public class Main {
 static int p=0,t=0;static void ck(String n,Runnable r){t++;try{r.run();p++;System.out.println("PASS "+n);}catch(Throwable e){System.out.println("FAIL "+n+": "+e);}}
 static void eq(Object a,Object b){if(!Objects.equals(a,b))throw new AssertionError(a+" != "+b);}
 public static void main(String[] x){
  ck("first applied",()->{Projection p=new Projection();if(!p.apply(new Message("m1",1,"A")))throw new AssertionError();eq("A",p.value());eq(1L,p.version());});
  ck("duplicate id ignored",()->{Projection p=new Projection();p.apply(new Message("m1",1,"A"));if(p.apply(new Message("m1",2,"B")))throw new AssertionError();eq("A",p.value());eq(1L,p.version());});
  ck("old version ignored",()->{Projection p=new Projection();p.apply(new Message("m2",3,"C"));if(p.apply(new Message("m1",2,"B")))throw new AssertionError();eq("C",p.value());eq(3L,p.version());eq(2,p.seenCount());});
  ck("new version applies",()->{Projection p=new Projection();p.apply(new Message("m1",1,"A"));if(!p.apply(new Message("m2",2,"B")))throw new AssertionError();eq("B",p.value());});
  ck("same version is stale",()->{Projection p=new Projection();p.apply(new Message("m1",4,"A"));if(p.apply(new Message("m2",4,"B")))throw new AssertionError();eq("A",p.value());});
  System.out.println("RESULT "+p+"/"+t);
 }
}`,
    reference: `record Message(String id,long version,String value) {}
class Projection {
    private final Set<String> seen=new HashSet<>();
    private long version=0; private String value="";
    synchronized boolean apply(Message m) {
        if(seen.contains(m.id())) return false;
        seen.add(m.id()); // reserve id even for stale event: replay stays a no-op
        if(m.version()<=version) return false;
        version=m.version(); value=m.value(); return true;
    }
    synchronized long version(){return version;}
    synchronized String value(){return value;}
    synchronized int seenCount(){return seen.size();}
}`,
    hints: ['Kiểm tra messageId trước; không dùng version để thay thế dedup.', 'Đánh dấu ID đã thấy kể cả khi event stale để cùng event không được xét lại.', 'Chỉ thay value và version khi incoming version lớn hơn hiện tại.'],
    explain: `Set biểu diễn inbox bền vững và synchronized làm check-then-act nguyên tử trong bài mô phỏng. Trong production, Set trong process không đủ; dùng unique constraint ở DB, và insert inbox cùng transaction cập nhật projection. Nếu side effect nằm ở dịch vụ khác, cần thêm outbox hoặc idempotency key ở đích.

Event stale vẫn được đánh dấu đã thấy để replay không tốn xử lý, nhưng state không đổi. Hai event khác ID có cùng version cũng không ghi đè nhau: version phải biểu thị thứ tự có ý nghĩa, thường do aggregate phát. Nếu event là delta thay vì snapshot, bỏ qua version gap có thể sai nghiệp vụ.

Lỗi thường gặp là lưu ID sau side effect, khiến crash tạo side effect lặp; dùng ID không ổn định qua retry; hoặc chỉ kiểm tra version mà bỏ qua duplicate của side effect không thay thế được.`,
  }],
  check: [
    { q: 'DB side effect đã commit nhưng consumer chưa commit offset. Kịch bản hợp lý nhất?', options: ['Message có thể được giao lại', 'Broker biết DB commit nên bỏ qua', 'DB tự rollback theo offset', 'Message bị đổi ID'], answer: 0, explain: `Offset và DB là hai transaction khác nhau; crash ở giữa có thể khiến broker giao lại. Inbox/idempotency làm lần giao lại không nhân đôi hiệu ứng.` },
    { q: 'Vì sao check-then-act bằng HashSet cục bộ không đủ khi có nhiều replica?', options: ['Set không lưu String', 'Mỗi replica có trạng thái riêng và có thể cùng xử lý trước khi ghi', 'Kafka không gửi String', 'Version luôn tăng theo đồng hồ'], answer: 1, explain: `Các process không chia sẻ Set và thao tác cục bộ không nguyên tử toàn cụm. Unique constraint/inbox dùng chung là nơi phân xử.` },
  ], tags: ['idempotency', 'Kafka', 'inbox', 'ordering']
},
{
  id: 'lesson-microservices-003', track: 'microservices', order: 3,
  title: 'Saga orchestration: bù trừ khi quy trình nhiều service thất bại', level: 'lead', minutes: 30,
  goals: ['Mô tả saga như chuỗi local transaction', 'Thực thi compensation ngược thứ tự khi bước sau lỗi', 'Nêu giới hạn compensation và orchestration'],
  body: `**Tóm tắt:** Saga chia nghiệp vụ xuyên nhiều service thành các local transaction có kết quả bền vững. Khi bước sau thất bại, orchestrator gọi compensation cho các bước đã thành công; đây là hành động nghiệp vụ mới, không phải rollback thời gian.

### Luồng đặt hàng
Ví dụ: tạo order ở trạng thái PENDING → authorize/trừ tiền → giữ kho → xác nhận order. Mỗi service commit DB riêng và phát event/response. Không có transaction ACID bao cả ba service. Nếu giữ kho lỗi sau khi tiền đã trừ, orchestrator yêu cầu refund rồi đánh dấu order FAILED/CANCELLED.

~~~text
Order(PENDING) → Payment(authorized) → Inventory(reserved)
                                      ↘ lỗi
                 Payment(refunded) ← compensation
~~~

Compensation không xóa sự kiện đã xảy ra: refund có thể chậm, phí có thể không hoàn, kho đã giữ có thể đã hết hạn. Vì vậy trạng thái trung gian phải hiển thị và có thể retry/reconcile.

### Orchestration và choreography
Orchestrator lưu sagaId, trạng thái từng bước, kết quả và retry; nó quyết định bước kế tiếp. Choreography để service phản ứng event của nhau, ít điều phối tập trung hơn nhưng luồng khó nhìn khi nhiều nhánh. Với nghiệp vụ có điều kiện và cần audit, orchestration thường dễ kiểm soát; với luồng nhỏ, event choreography có thể giảm coupling trực tiếp.

### An toàn thực thi
Mỗi command mang sagaId và idempotency key. Orchestrator cần state machine bền vững để restart không quên tiến độ; timeout phải phân biệt kết quả chưa biết với thất bại chắc chắn. Một payment timeout có thể đã thành công ở provider: trước khi bù trừ cần truy vấn trạng thái hoặc gửi cùng key để nhận kết quả cũ. Compensation cũng idempotent và retryable. Dùng outbox/inbox để không rơi event tại ranh giới DB-broker.

| Lựa chọn | Tốt khi | Cần chú ý |
|---|---|---|
| Orchestration | Nhiều bước, nhánh, audit | Orchestrator là thành phần phải HA và bền vững |
| Choreography | Luồng ngắn, phản ứng event | Theo dõi dependency và vòng lặp khó hơn |

Spring Statemachine hoặc workflow engine như Temporal/Camunda có thể quản lý trạng thái và retry tùy kiến trúc; Spring Cloud Stream hỗ trợ event transport nhưng không tự cung cấp saga semantics. Saga không đảm bảo isolation toàn cục: có thể cần reservation, optimistic version, hoặc kiểm tra lại invariant.

### Pitfall production
Gọi compensation ngay khi timeout là nguy hiểm vì lệnh gốc có thể đang chạy. Thiết kế timeout, query trạng thái, idempotency và reconciliation. Không retry vô hạn không giới hạn; lưu lỗi cuối, phát cảnh báo và đưa saga vào trạng thái cần can thiệp. Theo dõi saga bị kẹt lâu nhất, tỷ lệ compensation thất bại và thời gian hoàn tất.

### Liên hệ phỏng vấn
Vẽ state transition, nêu dữ liệu bền vững, key idempotency, timeout không rõ kết quả, và cách tiếp tục sau restart. Nói rõ compensation nào thực sự đảo ngược được.

> Senior tip: compensation thất bại là một trạng thái nghiệp vụ cần dashboard và runbook, không phải chỉ là log ERROR.
`,
  exercises: [{
    title: 'Bù tiền sau khi giữ kho thất bại',
    prompt: `Cài {{OrderSaga}} với các bước: đặt order, trừ tiền, giữ kho, xác nhận. {{run(failPayment, failInventory)}} trả danh sách thao tác theo thứ tự, dùng đúng các chuỗi sau:
- Thành công: {{order}}, {{charge}}, {{reserve}}, {{confirm}}.
- Trừ tiền lỗi: {{order}}, {{charge-failed}}, {{cancel}} (chưa trừ được tiền nên không refund, không giữ kho).
- Giữ kho lỗi: {{order}}, {{charge}}, {{reserve-failed}}, {{refund}}, {{cancel}} (bù trừ ngược thứ tự: hoàn tiền rồi hủy order, không confirm).

Mỗi thao tác compensation chỉ chạy nếu bước tương ứng đã thành công; bước lỗi không được ghi nhận như thành công.`,
    starter: `class OrderSaga {
    private final List<String> log = new ArrayList<>();
    List<String> run(boolean failPayment, boolean failInventory) {
        throw new UnsupportedOperationException("TODO");
    }
}`,
    tests: `public class Main {
 static int p=0,t=0;static void ck(String n,Runnable r){t++;try{r.run();p++;System.out.println("PASS "+n);}catch(Throwable e){System.out.println("FAIL "+n+": "+e);}}
 static void eq(Object a,Object b){if(!Objects.equals(a,b))throw new AssertionError(a+" != "+b);}
 public static void main(String[] x){
  ck("success commits all",()->eq(List.of("order","charge","reserve","confirm"),new OrderSaga().run(false,false)));
  ck("payment failure cancels order",()->eq(List.of("order","charge-failed","cancel"),new OrderSaga().run(true,false)));
  ck("inventory failure refunds then cancels",()->eq(List.of("order","charge","reserve-failed","refund","cancel"),new OrderSaga().run(false,true)));
  ck("failed payment is not refunded",()->{List<String> l=new OrderSaga().run(true,true);if(l.contains("refund"))throw new AssertionError(l);});
  ck("inventory failure does not confirm",()->{List<String> l=new OrderSaga().run(false,true);if(l.contains("confirm"))throw new AssertionError(l);});
  System.out.println("RESULT "+p+"/"+t);
 }
}`,
    reference: `class OrderSaga {
    private final List<String> log=new ArrayList<>();
    List<String> run(boolean failPayment,boolean failInventory) {
        log.add("order"); // local transaction created pending order
        if(failPayment){log.add("charge-failed");log.add("cancel");return log;}
        log.add("charge");
        if(failInventory){log.add("reserve-failed");log.add("refund");log.add("cancel");return log;}
        log.add("reserve");log.add("confirm");return log;
    }
}`,
    hints: ['Ghi thao tác theo thứ tự; kiểm tra lỗi payment trước khi ghi charge thành công.', 'Chỉ khi đã charge mới cần thêm refund.', 'Inventory lỗi thì thứ tự compensation là refund rồi cancel; không confirm.'],
    explain: `Bài tập là state machine rút gọn: mỗi nhánh ghi lại local outcome và compensation. Bước 3 lỗi sau charge nên hoàn tiền rồi hủy order. Payment lỗi thì không có khoản đã charge để refund. Một saga bền vững phải lưu bước hiện tại trước/đồng thời phát command tiếp theo để restart có thể tiếp tục.

Trong production refund có thể lỗi hoặc pending; không thể chỉ trả về CANCELLED như thể tiền đã hoàn. Cần trạng thái REFUND_PENDING, retry có giới hạn, idempotency key và reconciliation. Nếu charge request timeout, phải query bằng key trước khi quyết định có cần refund.

Lỗi thường gặp: compensation theo thứ tự xuôi, bù bước chưa thành công, hoặc giả định bù trừ là rollback đồng bộ. Orchestrator nên có transition hợp lệ rõ ràng và lưu sagaId để audit.`,
  }],
  check: [
    { q: 'Trong saga, compensation có nghĩa gì?', options: ['Rollback ACID trên mọi service', 'Một hành động nghiệp vụ mới nhằm bù cho bước đã commit', 'Xóa log broker', 'Tắt retry toàn hệ thống'], answer: 1, explain: `Mỗi local transaction đã commit riêng. Compensation là command/event mới, có thể thất bại hoặc không đảo ngược hoàn toàn tác động.` },
    { q: 'Payment request timeout và chưa rõ provider đã charge chưa, nên làm gì?', options: ['Refund ngay không cần kiểm tra', 'Gửi charge mới với ID khác', 'Tra cứu hoặc retry cùng idempotency key để xác định kết quả', 'Đánh dấu saga thành công'], answer: 2, explain: `Timeout không chứng minh thao tác thất bại. Cùng key giúp provider trả kết quả cũ; query trạng thái tránh charge hai lần hoặc refund sai.` },
  ], tags: ['saga', 'compensation', 'orchestration', 'workflow']
},
{
  id: 'lesson-microservices-004', track: 'microservices', order: 4,
  title: 'Retry và dead letter queue: phân loại lỗi thay vì lặp vô hạn', level: 'senior', minutes: 25,
  goals: ['Thiết kế retry hữu hạn với backoff', 'Phân biệt lỗi transient và poison message', 'Đưa message lỗi sang DLQ có thể replay an toàn'],
  body: `**Tóm tắt:** Retry phù hợp với lỗi tạm thời như timeout hoặc throttling, nhưng cần giới hạn lần thử và backoff. Message không xử lý được sau chính sách phải được cách ly vào DLQ cùng metadata để điều tra và replay có kiểm soát.

### Retry có nhịp
Retry ngay lập tức tạo retry storm: nhiều request cùng đánh vào dependency đang suy yếu. Backoff tăng khoảng chờ theo lần thử, thường có jitter để các client không đồng bộ thức dậy. Ví dụ delay cơ sở 100 ms, 200 ms, 400 ms; giới hạn trần và tổng thời gian. Trong bài học dùng đồng hồ giả để không đợi thời gian thật.

Lỗi transient: network reset, 429/503 tùy hợp đồng. Lỗi permanent: schema không hợp lệ, thiếu field bắt buộc, poison message luôn ném cùng exception. Retry lỗi permanent chỉ trì hoãn message khác trong partition.

### DLQ và khả năng vận hành
DLQ giữ payload, message id, topic/partition/offset, số attempt, exception rút gọn và timestamp. Không đưa secret/PII không cần thiết vào header hoặc log. DLQ cần alert, quyền truy cập, retention, công cụ xem và quy trình sửa/replay. Replay phải bảo toàn idempotency và tránh tạo side effect hai lần.

~~~java
// Pseudocode: attempt count giới hạn, clock injectable để kiểm thử deterministic.
if (attempt < maxAttempts) schedule(message, now + backoff(attempt));
else deadLetter(message, error);
~~~

Spring Kafka có {{DefaultErrorHandler}} (retry theo BackOff) kết hợp {{DeadLetterPublishingRecoverer}}, và retry không chặn qua các retry topic với {{@RetryableTopic}}; Spring Cloud Stream có cơ chế retry/DLQ tùy binder và cấu hình. Kafka broker không có DLQ sẵn cho consumer; ứng dụng/framework phải publish sang topic khác. Tránh retry đồng bộ lâu trên thread consumer vì làm giảm throughput, giữ partition, và nếu giữa hai lần poll vượt {{max.poll.interval.ms}} (mặc định 300000 ms) thì consumer bị loại khỏi group, gây rebalance.

| Chính sách | Khi dùng | Rủi ro |
|---|---|---|
| Retry ngắn tại chỗ | Lỗi rất ngắn, thao tác nhanh | Chặn partition |
| Retry topic có delay | Cần trì hoãn lâu hơn | Phức tạp thứ tự và vận hành |
| DLQ | Đã hết ngân sách hoặc lỗi permanent | Message bị quên nếu không alert |

### Pitfall production
Tính retry từ số lần gọi có thể khác số lần giao của broker; định nghĩa rõ attempt. Thêm jitter, max delay và ngân sách tổng. Không retry mọi exception; lỗi validation chuyển DLQ sớm. Ghi metric age, depth, retry count, DLQ rate; tránh log toàn payload. Nếu xử lý side effect trước khi lỗi response, retry cần idempotency.

### Liên hệ phỏng vấn
Nêu lỗi nào retry, số lần tối đa, backoff, timeout tổng, DLQ ownership, replay và cách giữ throughput/ordering.

> Senior tip: đặt ngân sách thời gian retry nhỏ hơn SLA nghiệp vụ; nếu message đến sau deadline thì retry thành công vẫn có thể gây hại.
`,
  exercises: [{
    title: 'Retry theo đồng hồ giả rồi chuyển poison message vào DLQ',
    prompt: `Cài {{RetryQueue}}: mỗi message được xử lý tối đa {{maxAttempts}} lần. {{runOne(now, processor)}} chỉ xét message ở đầu hàng: nếu hàng rỗng hoặc {{now < dueAt}} thì không chạy và trả {{false}}; nếu tới hạn thì lấy ra, chạy processor và trả {{true}}. Thành công thì message rời hàng. Processor trả {{false}} (lỗi) thì tăng {{attempts}}: nếu {{attempts}} đã bằng {{maxAttempts}} thì chuyển Job (giữ số attempts) sang DLQ; ngược lại đưa lại vào hàng với {{dueAt = now + baseDelay * 2^(attempts-1)}}.`,
    starter: `record Job(String id, int attempts, long dueAt) {}
class RetryQueue {
    private final int maxAttempts; private final long baseDelay;
    private final Deque<Job> ready = new ArrayDeque<>();
    private final List<Job> dead = new ArrayList<>();
    RetryQueue(int maxAttempts,long baseDelay){this.maxAttempts=maxAttempts;this.baseDelay=baseDelay;}
    void add(String id){ready.add(new Job(id,0,0));}
    boolean runOne(long now, java.util.function.Predicate<String> processor){throw new UnsupportedOperationException("TODO");}
    int readyCount(){return ready.size();} int deadCount(){return dead.size();}
    Job next(){return ready.peekFirst();} List<Job> dead(){return dead;}
}`,
    tests: `public class Main {
 static int p=0,t=0;static void ck(String n,Runnable r){t++;try{r.run();p++;System.out.println("PASS "+n);}catch(Throwable e){System.out.println("FAIL "+n+": "+e);}}
 static void eq(Object a,Object b){if(!Objects.equals(a,b))throw new AssertionError(a+" != "+b);}
 public static void main(String[] x){
  ck("not due does not run",()->{RetryQueue q=new RetryQueue(3,10);q.add("a");eq(false,q.runOne(-1,id->true));eq(1,q.readyCount());});
  ck("success removes",()->{RetryQueue q=new RetryQueue(3,10);q.add("a");eq(true,q.runOne(0,id->true));eq(0,q.readyCount());});
  ck("backoff doubles",()->{RetryQueue q=new RetryQueue(4,10);q.add("a");q.runOne(0,id->false);eq(10L,q.next().dueAt());q.runOne(10,id->false);eq(30L,q.next().dueAt());});
  ck("poison reaches DLQ at limit",()->{RetryQueue q=new RetryQueue(2,5);q.add("bad");q.runOne(0,id->false);q.runOne(5,id->false);eq(0,q.readyCount());eq(1,q.deadCount());eq(2,q.dead().get(0).attempts());});
  ck("early retry waits",()->{RetryQueue q=new RetryQueue(2,5);q.add("x");q.runOne(0,id->false);eq(false,q.runOne(4,id->true));eq(1,q.readyCount());});
  System.out.println("RESULT "+p+"/"+t);
 }
}`,
    reference: `record Job(String id,int attempts,long dueAt) {}
class RetryQueue {
    private final int maxAttempts; private final long baseDelay;
    private final Deque<Job> ready=new ArrayDeque<>(); private final List<Job> dead=new ArrayList<>();
    RetryQueue(int maxAttempts,long baseDelay){if(maxAttempts<1||baseDelay<0)throw new IllegalArgumentException();this.maxAttempts=maxAttempts;this.baseDelay=baseDelay;}
    void add(String id){ready.addLast(new Job(id,0,0));}
    boolean runOne(long now,java.util.function.Predicate<String> processor){
        Job j=ready.peekFirst(); if(j==null||now<j.dueAt())return false;
        ready.removeFirst();
        if(processor.test(j.id()))return true;
        int n=j.attempts()+1;
        if(n>=maxAttempts)dead.add(new Job(j.id(),n,now));
        else ready.addLast(new Job(j.id(),n,now+baseDelay*(1L<< (n-1))));
        return true;
    }
    int readyCount(){return ready.size();} int deadCount(){return dead.size();}
    Job next(){return ready.peekFirst();} List<Job> dead(){return dead;}
}`,
    hints: ['Nếu chưa tới dueAt thì không lấy message khỏi queue.', 'Mỗi lần processor trả false tăng attempts; dueAt mới là now cộng delay.', 'Sau attempt thứ maxAttempts đưa vào dead, không giữ trong ready.'],
    explain: `Đồng hồ được truyền vào runOne nên kiểm thử không ngủ. Lịch delay trong test: lần lỗi đầu đặt now+baseDelay; lần lỗi thứ hai đặt now+2×baseDelay. Hết maxAttempts thì message rời ready và vào DLQ. Production cần giới hạn exponent để tránh tràn số, thêm jitter, lưu trạng thái bền vững và phân biệt exception transient/permanent.

Predicate false mô phỏng lỗi. Trong hệ thống thực, processor thường ném exception; error handler phân loại lỗi, metrics và context được ghi cùng message. Thử lại sau khi side effect đã commit có thể lặp tác dụng, vì thế retry phải đi với idempotency. Queue đơn giản này cũng chưa xử lý fairness hay ordering nhiều partition.

Lỗi thường gặp: retry không delay, attempt off-by-one, poison message giữ mãi đầu queue, hoặc chuyển DLQ mà không có alert/owner.`,
  }],
  check: [
    { q: 'Một payload sai schema chắc chắn lỗi ở mọi lần thử. Cách xử lý phù hợp?', options: ['Retry vô hạn', 'Retry nhanh không giới hạn', 'Đưa DLQ sớm theo chính sách lỗi permanent', 'Tăng timeout vô hạn'], answer: 2, explain: `Poison message không tự hết lỗi; retry chỉ chặn tiến độ. Cách ly kèm metadata để điều tra và replay sau khi sửa.` },
    { q: 'Mục tiêu của jitter trong exponential backoff là gì?', options: ['Mã hóa payload', 'Tránh nhiều client retry đồng thời thành đợt tải đồng bộ', 'Đảm bảo exactly-once', 'Giữ thứ tự toàn cục'], answer: 1, explain: `Jitter phân tán thời điểm retry, giảm thundering herd khi dependency vừa phục hồi.` },
  ], tags: ['retry', 'backoff', 'DLQ', 'resilience']
},
{
  id: 'lesson-microservices-005', track: 'microservices', order: 5,
  title: 'Trace context qua thread pool: giữ traceId và spanId đúng ranh giới', level: 'senior', minutes: 25,
  goals: ['Phân biệt traceId và spanId', 'Truyền context tường minh qua service và executor', 'Nhận biết bẫy ThreadLocal với thread pool'],
  body: `**Tóm tắt:** Trace context liên kết các span thuộc cùng một request để lần theo đường đi qua nhiều service. ThreadLocal chỉ gắn dữ liệu với thread hiện tại; khi chuyển sang thread pool, context không tự đi theo và có thể rò sang task kế tiếp nếu không dọn.

### Trace và span
Một trace có traceId chung; mỗi operation tạo spanId riêng và thường có parentSpanId. HTTP service truyền context qua header chuẩn W3C Trace Context (traceparent), tạo span con rồi kết thúc span. Không tự đặt traceId mới ở mỗi service nếu muốn nối cùng trace.

### ThreadLocal không phải propagation
MDC thường dựa trên ThreadLocal để log pattern in traceId. Thread pool tái sử dụng worker: request A đặt context rồi submit task, nhưng worker không kế thừa ThreadLocal mặc định. Nếu worker còn context cũ, task B có thể log nhầm A. Giải pháp an toàn là capture context khi submit, set trên worker, rồi restore/clear trong finally.

~~~java
Context captured = local.get(); // capture ở thread gọi submit
executor.submit(() -> {
    Context previous = local.get();
    try { local.set(captured); work.run(); }
    finally { local.set(previous); } // hoặc remove nếu không có context trước
});
~~~

Tốt hơn nữa, truyền context tường minh trong API khi phù hợp. OpenTelemetry Java có Context và instrumentation/propagator; dùng wrapper (ví dụ {{Context.current().wrap(runnable)}} hoặc {{Context.taskWrapping(executor)}}) hoặc Java agent đã cấu hình để context đi qua executor. Không tự giả định mọi thư viện async đều được instrument.

### Production và bảo mật
W3C traceparent mang version, trace-id (16 byte), parent-id (8 byte) và trace-flags (ví dụ bit sampled); baggage là metadata tùy chọn, đi trong header riêng. Không đưa PII, token hay dữ liệu không tin cậy vào baggage. Sampling có thể loại một số trace, nên log/metric vẫn cần correlation và không được coi trace là audit log. Cardinality cần giới hạn ở span name và metric label: orderId có thể là span attribute nhưng không dùng làm span name hay metric label. OpenTelemetry SDK/exporter có batch processor; cấu hình queue, timeout và shutdown flush để tránh mất dữ liệu khi dừng.

### Pitfall
Không chỉ set MDC mà quên finally remove/restore. Tạo span mới mà không gắn parent context sẽ làm trace bị đứt thành nhiều trace rời. Không log toàn bộ baggage. Khi truyền qua message broker, inject context vào header và extract ở consumer; message retry có thể tiếp tục trace cũ hoặc tạo span xử lý mới theo chính sách instrumentation.

### Liên hệ phỏng vấn
Giải thích traceparent qua HTTP, context qua executor, và cách chứng minh không rò context giữa hai task dùng chung worker. Nêu lựa chọn instrumentation thay vì tự viết ThreadLocal khắp ứng dụng.

> Senior tip: kiểm tra task bị reject/cancel và đường exception; cleanup context phải nằm trong finally, kể cả khi code nghiệp vụ ném lỗi.
`,
  exercises: [{
    title: 'Truyền context tường minh và dọn ThreadLocal trong worker',
    prompt: `Cài {{ContextRunner}} dùng một {{ExecutorService}} một thread (worker luôn được tái sử dụng). {{submit(traceId, fail)}} truyền traceId vào task; trong task, đặt ThreadLocal {{local}} theo traceId (rỗng thì không có context), ghi giá trị {{local.get()}} quan sát được vào {{seen}}, rồi nếu {{fail}} thì ném exception. Sau mỗi task luôn xóa context kể cả khi lỗi, để task có traceId rỗng quan sát {{null}} chứ không kế thừa trace trước. {{observed()}} trả bản sao kết quả theo thứ tự hoàn tất. {{await()}} đã cài sẵn: shutdown rồi chờ các task xong.`,
    starter: `class ContextRunner implements AutoCloseable {
    private final ThreadLocal<String> local = new ThreadLocal<>();
    private final List<String> seen = Collections.synchronizedList(new ArrayList<>());
    private final ExecutorService pool = Executors.newSingleThreadExecutor();
    void submit(String traceId, boolean fail) { throw new UnsupportedOperationException("TODO"); }
    void await() { // đã cài sẵn: shutdown rồi chờ mọi task xong (có timeout)
        pool.shutdown();
        try { if (!pool.awaitTermination(2, TimeUnit.SECONDS)) throw new AssertionError("timeout"); }
        catch (InterruptedException e) { Thread.currentThread().interrupt(); throw new RuntimeException(e); }
    }
    List<String> observed() { throw new UnsupportedOperationException("TODO"); }
    public void close() { pool.shutdown(); }
}`,
    tests: `public class Main {
 static int p=0,t=0;static void ck(String n,Runnable r){t++;try{r.run();p++;System.out.println("PASS "+n);}catch(Throwable e){System.out.println("FAIL "+n+": "+e);}}
 static void eq(Object a,Object b){if(!Objects.equals(a,b))throw new AssertionError(a+" != "+b);}
 public static void main(String[] x){
  ck("context follows each task",()->{try(ContextRunner c=new ContextRunner()){c.submit("trace-A",false);c.submit("trace-B",false);c.await();eq(List.of("trace-A","trace-B"),c.observed());}});
  ck("empty context does not inherit",()->{try(ContextRunner c=new ContextRunner()){c.submit("trace-A",false);c.submit("",false);c.await();eq(Arrays.asList("trace-A",null),c.observed());}});
  ck("exception still cleans worker",()->{try(ContextRunner c=new ContextRunner()){c.submit("trace-A",true);c.submit("",false);c.await();eq(Arrays.asList("trace-A",null),c.observed());}});
  ck("returned list is a copy",()->{try(ContextRunner c=new ContextRunner()){c.submit("x",false);c.await();List<String> a=c.observed();a.clear();eq(1,c.observed().size());}});
  System.out.println("RESULT "+p+"/"+t);
 }
}`,
    reference: `class ContextRunner implements AutoCloseable {
    private final ThreadLocal<String> local=new ThreadLocal<>();
    private final List<String> seen=Collections.synchronizedList(new ArrayList<>());
    private final ExecutorService pool=Executors.newSingleThreadExecutor();
    void submit(String traceId,boolean fail){
        pool.submit(()->{
            try { if(traceId!=null&&!traceId.isEmpty())local.set(traceId); else local.remove();
                seen.add(local.get()); if(fail)throw new IllegalStateException("simulated");
            } finally { local.remove(); }
        });
    }
    void await(){pool.shutdown();try{if(!pool.awaitTermination(2,TimeUnit.SECONDS))throw new AssertionError("timeout");}catch(InterruptedException e){Thread.currentThread().interrupt();throw new RuntimeException(e);}}
    List<String> observed(){synchronized(seen){return new ArrayList<>(seen);}}
    public void close(){pool.shutdownNow();}
}`,
    hints: ['Capture traceId ở submit và truyền nó vào lambda; ThreadLocal của caller không tự truyền.', 'Set hoặc remove context ngay đầu task, rồi ghi giá trị quan sát.', 'Bọc thân task bằng try/finally và remove; awaitTermination với timeout giúp bài test deterministic.'],
    explain: `Một executor một thread cố ý tái sử dụng cùng worker để lộ rò ThreadLocal. Task nhận traceId như dữ liệu tường minh, set/remove trên worker, rồi ghi context thấy được. finally luôn remove kể cả khi task ném exception. awaitTermination đảm bảo quan sát sau khi task hoàn tất mà không sleep dự đoán.

Trong production, OpenTelemetry Context thường là abstraction propagation; instrumentation có thể bọc executor. MDC cần được đồng bộ với context và dọn sau task. Nếu restore context trước đó thay vì remove, phải lưu previous và khôi phục đúng, đặc biệt với nested execution.

Lỗi thường gặp: đọc ThreadLocal trên thread caller rồi mong worker nhận giá trị; chỉ clear ở đường thành công; hoặc dùng traceId làm spanId cho mọi operation. TraceId định danh toàn trace, spanId định danh operation cụ thể.`,
  }],
  check: [
    { q: 'Thread pool tái sử dụng worker; task A đặt MDC nhưng không clear. Nguy cơ chính?', options: ['Task B có thể ghi log với context A', 'TraceId tự đổi thành spanId', 'Executor sẽ tạo thread mới cho B', 'Kafka offset sẽ rollback'], answer: 0, explain: `ThreadLocal thuộc worker và worker được tái sử dụng. Không cleanup có thể làm context rò giữa các task.` },
    { q: 'Trong W3C Trace Context, trace-id và parent-id có vai trò nào?', options: ['Cả hai là ID của database', 'trace-id nối toàn trace; parent-id xác định span cha được truyền', 'parent-id là baggage PII', 'trace-id chỉ dùng làm metric label'], answer: 1, explain: `trace-id giữ các span trong cùng trace; parent-id chỉ span hiện tại ở phía gửi để phía nhận tạo quan hệ con. Baggage là metadata riêng, không nên chứa bí mật.` },
  ], tags: ['tracing', 'OpenTelemetry', 'ThreadLocal', 'context propagation']
},
{
  id: 'lesson-microservices-006', track: 'microservices', order: 6,
  title: 'Idempotency key store: in-flight dedup, TTL phantom và payload hash', level: 'senior', minutes: 45,
  goals: ['Thiết kế state machine BEGIN/REPLAY/DUPLICATE/PHANTOM cho idempotency key', 'Chuyển trạng thái nguyên tử bằng ConcurrentHashMap mà không khóa toàn cục', 'Giải thích vì sao phải scope theo tenant, hash body và có TTL cho PENDING'],
  body: `**Tóm tắt:** Idempotency store gắn một khóa do client sinh với trạng thái xử lý, để retry không tạo hiệu ứng thứ hai. Khóa được scope theo tenant + endpoint + body hash; chuyển trạng thái PENDING → COMPLETED/FAILED phải nguyên tử. Request thấy PENDING thì bị chặn, thấy COMPLETED thì nhận lại đúng result cũ, còn PENDING quá TTL được promote cho lần chạy mới.

### Vì sao retry luôn xảy ra
Một POST tạo đơn có thể commit DB thành công nhưng response mất trên đường về. Client timeout rồi gửi lại; nếu server không phân biệt được hai lần gửi, nó tạo hai đơn hoặc trừ tiền hai lần. Không thể sửa bằng cách "đảm bảo mạng không mất gói"; phải làm cho thao tác lặp lại an toàn.

Idempotency key thường do client sinh một lần cho mỗi thao tác logic (UUID). Server lưu key cùng tenant, endpoint và hash của body. Scope theo tenant là bắt buộc: nếu key toàn cục, tenant A gửi trùng key của tenant B có thể nhận dữ liệu của B. Hash body chặn trường hợp client tái sử dụng key cho payload khác; trả 409 thay vì replay kết quả cũ.

### Máy trạng thái
| Trạng thái lưu | Request mới cùng key + hash | Việc cần làm |
|---|---|---|
| không có | BEGIN | chạy business rồi complete hoặc fail |
| PENDING, còn trong TTL | DUPLICATE_INFLIGHT | trả 409/202, không chạy business |
| PENDING, quá TTL | PHANTOM_PROMOTE | coi như chủ cũ đã chết, nhận quyền chạy |
| COMPLETED | REPLAY | trả đúng result đã lưu |
| FAILED | BEGIN | cho phép thử lại |
| khác hash | CONFLICT | 409, không dùng lại kết quả |

### Chuyển trạng thái nguyên tử
Dùng {{ConcurrentHashMap.compute}} để mỗi key chỉ có một luồng sửa tại một thời điểm. compute khóa theo bin/key, không phải khóa toàn cục, nên các key khác vẫn chạy song song. Trong lambda: đọc entry, so hash, so trạng thái, rồi trả entry cũ hoặc entry mới. Không dùng khóa distributed ở đây vì bản thân bảng key đã là điểm tuần tự hóa.

~~~java
Begin b = store.begin(key, tenant, endpoint, hash);
switch (b.decision()) {
    case BEGIN, PHANTOM_PROMOTE -> {
        String result = business();                 // chỉ một request thắng
        store.complete(key, tenant, endpoint, hash, result);
    }
    case REPLAY -> respond(b.result());              // không chạy lại business
    case DUPLICATE_INFLIGHT -> respond(409);
    case CONFLICT -> respond(409);
}
~~~

Thứ tự ghi quan trọng: gán result trước rồi mới đặt trạng thái COMPLETED. Nếu làm ngược, một request khác có thể thấy COMPLETED nhưng đọc result còn null. Trong JVM, compute cung cấp quan hệ happens-before giữa các lần compute cùng key; ở store thật hãy dùng UPDATE có điều kiện hoặc transaction.

### TTL và phantom
Process chết sau khi đặt PENDING nhưng trước complete sẽ để key kẹt. TTL biến PENDING cũ thành phantom: request đến sau TTL được promote và chạy lại. TTL phải lớn hơn p99 thời gian business, nếu không hai request có thể cùng chạy. Với job dài, dùng lease + heartbeat/gia hạn thay vì TTL cố định. Clock được truyền vào để test được; production dùng đồng hồ DB hoặc Redis, không tin đồng hồ từng máy vì lệch giờ.

### Pitfall production
- Chỉ giữ key trong RAM: hai instance không thấy nhau, dedup thất bại. Cần Redis/DB với unique index {{(tenant, endpoint, key)}} và TTL.
- Quên hash body: client đổi payload nhưng key cũ trả về kết quả của payload trước.
- Giữ khóa suốt network call: làm nghẽn và dễ treo khi downstream chậm. Chỉ giữ trạng thái, không giữ mutex phân tán trong lúc gọi.
- Trả REPLAY khi lần trước đã FAILED nhưng side effect đã xảy ra một phần: business phải transactional hoặc có bước kiểm tra; chỉ đánh FAILED sau khi chắc chắn đã rollback.
- Lưu result quá lớn hoặc chứa PII: giới hạn kích thước, mã hóa, và có retention (ví dụ 24 giờ).

### Liên hệ phỏng vấn
Hãy vẽ state machine và trả lời: hai request đồng thời cùng key thì request thứ hai làm gì; vì sao cần hash payload; TTL xử lý crash thế nào; và vì sao in-memory map không đủ khi chạy nhiều pod.

> Senior tip: theo dõi tỉ lệ REPLAY, DUPLICATE_INFLIGHT và số key PENDING quá TTL. PENDING tăng bất thường thường là dấu hiệu business chậm hoặc một instance chết giữa chừng; đặt alert theo tuổi key chứ không chỉ theo số lượng.
`,
  exercises: [{
    title: 'Idempotency store với in-flight dedup và phantom promotion',
    prompt: `Cài {{IdempotencyStore}} trong bộ nhớ với API sau (các kiểu dùng chung đã có trong starter):

- {{IdempotencyStore(long ttlMillis, LongSupplier clock)}}.
- {{Begin begin(String key, String tenant, String endpoint, String payloadHash)}} trả {{Begin(Decision decision, String result)}}, trong đó {{Decision}} gồm {{BEGIN}}, {{DUPLICATE_INFLIGHT}}, {{PHANTOM_PROMOTE}}, {{REPLAY}}, {{CONFLICT}}.
- {{void complete(String key, String tenant, String endpoint, String payloadHash, String result)}}.
- {{void fail(String key, String tenant, String endpoint, String payloadHash)}}.
- {{String result(String key, String tenant, String endpoint)}} và {{int size()}}.

Quy tắc: key chưa có thì BEGIN. Cùng key nhưng payloadHash khác thì CONFLICT và không đổi trạng thái. COMPLETED thì REPLAY kèm result đã lưu. FAILED thì BEGIN cho lần thử mới. PENDING còn trong TTL thì DUPLICATE_INFLIGHT; PENDING có tuổi từ TTL trở lên thì PHANTOM_PROMOTE và trở thành chủ mới. Scope khóa theo cả tenant và endpoint. Chỉ complete/fail khi entry đang PENDING và đúng payloadHash.`,
    starter: `enum Decision { BEGIN, DUPLICATE_INFLIGHT, PHANTOM_PROMOTE, REPLAY, CONFLICT }
record Begin(Decision decision, String result) {}
class IdempotencyStore {
    IdempotencyStore(long ttlMillis, LongSupplier clock) {
        throw new UnsupportedOperationException("TODO");
    }
    Begin begin(String key, String tenant, String endpoint, String payloadHash) {
        throw new UnsupportedOperationException("TODO");
    }
    void complete(String key, String tenant, String endpoint, String payloadHash, String result) {
        throw new UnsupportedOperationException("TODO");
    }
    void fail(String key, String tenant, String endpoint, String payloadHash) {
        throw new UnsupportedOperationException("TODO");
    }
    String result(String key, String tenant, String endpoint) {
        throw new UnsupportedOperationException("TODO");
    }
    int size() {
        throw new UnsupportedOperationException("TODO");
    }
}`,
    tests: `public class Main {
 static int p=0,t=0;
 interface Th { void run() throws Exception; }
 static void ck(String n,Th r){t++;try{r.run();p++;System.out.println("PASS "+n);}catch(Throwable e){System.out.println("FAIL "+n+": "+e);}}
 static void eq(Object a,Object b){if(!Objects.equals(a,b))throw new AssertionError(a+" != "+b);}
 public static void main(String[] x){
  ck("first request runs business once",()->{
   AtomicLong now=new AtomicLong();
   AtomicInteger runs=new AtomicInteger();
   IdempotencyStore s=new IdempotencyStore(1000,now::get);
   Begin b=s.begin("k1","tenant-a","POST /orders","hash-1");
   eq(Decision.BEGIN,b.decision());
   eq(null,b.result());
   runs.incrementAndGet();
   s.complete("k1","tenant-a","POST /orders","hash-1","{\\"id\\":1}");
   eq(1,runs.get());
   eq(1,s.size());
  });
  ck("replay returns the stored result",()->{
   AtomicLong now=new AtomicLong();
   AtomicInteger runs=new AtomicInteger();
   IdempotencyStore s=new IdempotencyStore(1000,now::get);
   s.begin("k1","tenant-a","POST /orders","hash-1"); runs.incrementAndGet();
   s.complete("k1","tenant-a","POST /orders","hash-1","{\\"id\\":1}");
   Begin again=s.begin("k1","tenant-a","POST /orders","hash-1");
   eq(Decision.REPLAY,again.decision());
   eq("{\\"id\\":1}",again.result());
   eq(1,runs.get());
  });
  ck("ten concurrent calls from two threads run business once",()->{
   AtomicLong now=new AtomicLong();
   AtomicInteger business=new AtomicInteger();
   IdempotencyStore s=new IdempotencyStore(1000,now::get);
   ExecutorService pool=Executors.newFixedThreadPool(2);
   CountDownLatch ready=new CountDownLatch(2),go=new CountDownLatch(1),done=new CountDownLatch(10);
   List<Decision> decisions=Collections.synchronizedList(new ArrayList<>());
   List<Throwable> errors=Collections.synchronizedList(new ArrayList<>());
   for(int i=0;i<10;i++) pool.submit(()->{
    try{ ready.countDown(); go.await();
      Begin b=s.begin("same","tenant-a","POST /orders","hash-1");
      decisions.add(b.decision());
      if(b.decision()==Decision.BEGIN) business.incrementAndGet();
    }catch(Throwable e){ errors.add(e); } finally { done.countDown(); }
   });
   ready.await(); go.countDown();
   if(!done.await(2,TimeUnit.SECONDS)) throw new AssertionError("timeout waiting for requests");
   pool.shutdownNow();
   eq(0,errors.size());
   eq(10,decisions.size());
   eq(1,business.get());
   eq(1,(int)decisions.stream().filter(d->d==Decision.BEGIN).count());
   eq(9,(int)decisions.stream().filter(d->d==Decision.DUPLICATE_INFLIGHT).count());
  });
  ck("stale pending is promoted after ttl",()->{
   AtomicLong now=new AtomicLong(0);
   IdempotencyStore s=new IdempotencyStore(1000,now::get);
   eq(Decision.BEGIN,s.begin("k","t","e","h").decision());
   now.set(999);
   eq(Decision.DUPLICATE_INFLIGHT,s.begin("k","t","e","h").decision());
   now.set(1000);
   eq(Decision.PHANTOM_PROMOTE,s.begin("k","t","e","h").decision());
   now.set(1499);
   eq(Decision.DUPLICATE_INFLIGHT,s.begin("k","t","e","h").decision());
  });
  ck("failed attempt can begin again and replay latest result",()->{
   AtomicLong now=new AtomicLong();
   IdempotencyStore s=new IdempotencyStore(1000,now::get);
   eq(Decision.BEGIN,s.begin("k","t","e","h").decision());
   s.fail("k","t","e","h");
   eq(Decision.BEGIN,s.begin("k","t","e","h").decision());
   s.complete("k","t","e","h","second");
   Begin b=s.begin("k","t","e","h");
   eq(Decision.REPLAY,b.decision());
   eq("second",b.result());
  });
  ck("same key with different payload conflicts",()->{
   AtomicLong now=new AtomicLong();
   IdempotencyStore s=new IdempotencyStore(1000,now::get);
   eq(Decision.BEGIN,s.begin("k","t","e","hash-a").decision());
   eq(Decision.CONFLICT,s.begin("k","t","e","hash-b").decision());
   eq(1,s.size());
   eq(null,s.result("k","t","e"));
  });
  ck("same key is isolated per tenant and endpoint",()->{
   AtomicLong now=new AtomicLong();
   IdempotencyStore s=new IdempotencyStore(1000,now::get);
   eq(Decision.BEGIN,s.begin("k","tenant-a","POST /orders","h").decision());
   eq(Decision.BEGIN,s.begin("k","tenant-b","POST /orders","h").decision());
   eq(Decision.BEGIN,s.begin("k","tenant-a","POST /refunds","h").decision());
   eq(3,s.size());
  });
  System.out.println("RESULT "+p+"/"+t);
 }
}`,
    reference: `enum Decision { BEGIN, DUPLICATE_INFLIGHT, PHANTOM_PROMOTE, REPLAY, CONFLICT }
record Begin(Decision decision, String result) {}
class IdempotencyStore {
    private enum Status { PENDING, COMPLETED, FAILED }
    private static final class Entry {
        final String payloadHash;
        volatile Status status = Status.PENDING;
        volatile String result;
        volatile long startedAt;
        Entry(String payloadHash, long startedAt) {
            this.payloadHash = payloadHash;
            this.startedAt = startedAt;
        }
    }
    private final ConcurrentHashMap<String, Entry> entries = new ConcurrentHashMap<>();
    private final long ttlMillis;
    private final LongSupplier clock;

    IdempotencyStore(long ttlMillis, LongSupplier clock) {
        if (ttlMillis <= 0) throw new IllegalArgumentException("ttlMillis must be positive");
        if (clock == null) throw new IllegalArgumentException("clock");
        this.ttlMillis = ttlMillis;
        this.clock = clock;
    }

    private static String scoped(String key, String tenant, String endpoint) {
        return tenant + "::" + endpoint + "::" + key;
    }

    Begin begin(String key, String tenant, String endpoint, String payloadHash) {
        if (key == null || tenant == null || endpoint == null || payloadHash == null)
            throw new IllegalArgumentException("key/tenant/endpoint/payloadHash required");
        String scoped = scoped(key, tenant, endpoint);
        Begin[] out = new Begin[1];
        entries.compute(scoped, (k, current) -> {
            long now = clock.getAsLong();
            if (current == null) {
                out[0] = new Begin(Decision.BEGIN, null);
                return new Entry(payloadHash, now);
            }
            if (!current.payloadHash.equals(payloadHash)) {
                out[0] = new Begin(Decision.CONFLICT, null);
                return current;
            }
            switch (current.status) {
                case COMPLETED:
                    out[0] = new Begin(Decision.REPLAY, current.result);
                    return current;
                case FAILED:
                    out[0] = new Begin(Decision.BEGIN, null);
                    return new Entry(payloadHash, now);
                default:
                    if (now - current.startedAt >= ttlMillis) {
                        out[0] = new Begin(Decision.PHANTOM_PROMOTE, null);
                        return new Entry(payloadHash, now);
                    }
                    out[0] = new Begin(Decision.DUPLICATE_INFLIGHT, null);
                    return current;
            }
        });
        return out[0];
    }

    void complete(String key, String tenant, String endpoint, String payloadHash, String result) {
        entries.compute(scoped(key, tenant, endpoint), (k, current) -> {
            if (current == null || current.status != Status.PENDING
                    || !current.payloadHash.equals(payloadHash)) return current;
            current.result = result;          // publish payload before the terminal state
            current.status = Status.COMPLETED;
            return current;
        });
    }

    void fail(String key, String tenant, String endpoint, String payloadHash) {
        entries.compute(scoped(key, tenant, endpoint), (k, current) -> {
            if (current == null || current.status != Status.PENDING
                    || !current.payloadHash.equals(payloadHash)) return current;
            current.status = Status.FAILED;
            current.result = null;
            return current;
        });
    }

    String result(String key, String tenant, String endpoint) {
        Entry e = entries.get(scoped(key, tenant, endpoint));
        return e == null ? null : e.result;
    }

    int size() { return entries.size(); }
}`,
    hints: [
      'Dùng {{ConcurrentHashMap.compute}} cho cả ba thao tác; mỗi lần chạy lambda là một lần chuyển trạng thái nguyên tử theo key.',
      'Thứ tự kiểm tra: entry null, payload hash, rồi trạng thái COMPLETED/FAILED/PENDING. Với PENDING hết TTL thì trả entry mới thay vì entry cũ.',
      'Gán result trước khi đổi status sang COMPLETED để request REPLAY không bao giờ đọc phải result null.',
    ],
    explain: `Bài tập mô phỏng đúng phần khó nhất của idempotency: hai request đến cùng lúc và một process chết giữa chừng. compute là điểm tuần tự hóa theo key, nên chỉ một thread thấy entry null và nhận BEGIN; các thread còn lại thấy PENDING và nhận DUPLICATE_INFLIGHT. Không cần khóa toàn cục, cũng không cần distributed lock vì chính bảng key là trọng tài.

Trạng thái terminal được ghi sau result. Với COMPLETED, result đã có trước khi status đổi, nên REPLAY luôn đọc được dữ liệu đầy đủ. Với FAILED, lần begin kế tiếp tạo entry PENDING mới, tức là cho phép retry nhưng không dùng lại kết quả cũ. Nếu complete/fail đến từ một request đã bị promote (sai payloadHash hoặc entry không còn PENDING), chúng bị bỏ qua: chủ cũ không được ghi đè chủ mới.

TTL giải quyết phantom: process giữ PENDING rồi chết không để lại tín hiệu nào. Sau TTL, request khác được promote. Lỗi thường gặp là đặt TTL quá ngắn so với p99 business, hoặc không gia hạn lease cho job dài, dẫn tới hai chủ cùng chạy. Trong production, state phải nằm ở store chia sẻ (Redis/DB) với unique index theo tenant, endpoint, key và TTL; map trong RAM chỉ đúng cho một JVM và mất khi restart.`,
  }],
  check: [
    { q: 'Hai request cùng tenant, endpoint, key và payload đến đồng thời; request đầu đang PENDING. Request thứ hai nên nhận gì?', options: ['BEGIN và chạy business song song', 'DUPLICATE_INFLIGHT và không chạy business', 'REPLAY với result null', 'CONFLICT vì key đã tồn tại'], answer: 1, explain: `PENDING nghĩa là đang có chủ xử lý; request sau phải bị chặn để tránh hai hiệu ứng. BEGIN chỉ dành cho key mới hoặc sau FAILED/phantom; REPLAY chỉ khi COMPLETED và result đã có; CONFLICT chỉ khi payloadHash khác.` },
    { q: 'Vì sao phải lưu và so sánh hash của body cùng idempotency key?', options: ['Để nén payload trước khi lưu', 'Để phát hiện client dùng lại key với payload khác và trả 409 thay vì replay sai kết quả', 'Để tăng tốc độ tính khóa chính', 'Để thay thế TTL'], answer: 1, explain: `Key do client sinh nên có thể bị tái sử dụng sai. Cùng key nhưng body khác mà vẫn REPLAY sẽ trả kết quả của thao tác cũ, một lỗi dữ liệu nghiêm trọng. Hash không nén payload, không liên quan tốc độ khóa chính và không thay thế TTL cho PENDING.` },
    { q: 'Một entry PENDING đã quá TTL. Hành vi đúng là gì?', options: ['Xóa entry và trả lỗi 500', 'Promote entry thành chủ mới để request hiện tại chạy business', 'Replay kết quả null', 'Chờ mãi đến khi chủ cũ complete'], answer: 1, explain: `PENDING quá TTL thường do process chết; promote cho phép hệ thống tự phục hồi. Xóa và trả 500 không giải quyết thao tác; replay null là sai vì chưa có kết quả; chờ mãi làm key kẹt vĩnh viễn, đúng lỗi mà TTL sinh ra để tránh.` },
  ], related: ['microservices-006', 'microservices-041', 'microservices-031'],
  tags: ['idempotency', 'ConcurrentHashMap', 'TTL', 'in-flight', 'payload hash']
},
{
  id: 'lesson-microservices-007', track: 'microservices', order: 7,
  title: 'Partial success khi xoá: 207 Multi-Status và compensation ledger', level: 'senior', minutes: 40,
  goals: ['Thiết kế saga xoá dữ liệu qua DB, object store và downstream', 'Trả 207 kèm chi tiết từng id thay vì báo thành công giả', 'Dùng tiến độ và compensation ledger để retry, reconcile không xoá hai lần'],
  body: `**Tóm tắt:** Xoá một lô dữ liệu nằm ở DB, object store và hệ downstream không thể là một transaction. Orchestrator chạy từng id theo thứ tự DB → blob → notify, trả 200 khi tất cả thành công và 207 kèm chi tiết từng id khi có lỗi. Mỗi bước đã thành công được ghi vào compensation ledger; retry dựa trên tiến độ từng id để không xoá hay notify hai lần.

### Vì sao không thể all-or-nothing
Ba hệ thống có transaction riêng và không có giao thức commit chung. Xoá row DB xong, xoá blob lỗi thì row đã mất trong khi file còn; nếu rollback DB thì có thể không khôi phục được blob đã xoá. 2PC không phù hợp vì object store/downstream thường không hỗ trợ, khóa lâu và lỗi mạng làm treo. Cách thực tế là saga: chấp nhận trạng thái trung gian, ghi lại việc đã làm, và có cơ chế hoàn tất hoặc bù.

### Thứ tự và mã trả về
- DB trước: nếu row không tồn tại, coi như đã xoá (idempotent), bỏ qua các bước sau.
- Blob sau DB: tránh để blob mồ côi nếu row xoá thất bại.
- Notify cuối: thông báo cho downstream chỉ khi dữ liệu đã biến mất.

Response 200 khi mọi id đều 200. Chỉ cần một id lỗi thì trả 207 Multi-Status, trong {{detail}} mỗi id có code và msg riêng. Client phải đọc từng dòng, không được coi 207 là thành công.

### Tiến độ và compensation
Mỗi id có một tập bước đã xong. Retry bỏ qua bước đã xong nên không gọi xoá DB lần hai. Khi một bước lỗi, các bước trước đó đã thành công được ghi vào ledger:

~~~text
id=ord-7: db=OK, blob=FAIL
ledger: compensation.delete.row(ord-7)
~~~

Token trên không phải rollback tức thời; nó đánh dấu công việc cần reconcile. reconcile đọc ledger, thử lại bước còn thiếu (blob rồi notify) và xoá entry khi xong. Nhờ vậy client nhận 207 ngay, còn hệ thống vẫn có đường hoàn tất mà không xoá lại row.

### Production
Ledger và tiến độ phải bền (bảng saga/outbox), không nằm trong RAM như bài tập. Mỗi bước cần idempotent ở phía đối tác: xoá row thiếu trả thành công, xoá blob thiếu trả thành công, notify dùng idempotency key. Orchestrator có thể chạy lại sau crash nhờ state đã lưu. Đừng gọi downstream trong transaction DB dài; ghi state trước, gọi ngoài transaction, rồi cập nhật.

### Pitfall
- Trả 200 dù có id lỗi: người dùng tưởng đã xoá hết.
- Không có ledger: blob mồ côi, không ai biết cần dọn.
- Retry không có tiến độ: xoá và notify lặp, đặc biệt nguy hiểm với notify gửi email.
- Ledger chỉ trong RAM: restart là mất, dữ liệu kẹt nửa vời.
- Xoá cứng ngay: khó khôi phục khi bước sau fail; nhiều hệ thống dùng soft delete + job dọn sau khi chắc chắn.

### Liên hệ phỏng vấn
Nêu rõ vì sao chọn 207 thay vì 500, thứ tự ba bước, ledger ghi gì, retry dựa vào đâu, và reconcile xử lý trường hợp nào. Sau đó mô tả cách làm cho từng tier idempotent để retry an toàn.

> Senior tip: đặt metric theo id kẹt quá N phút và tuổi entry ledger; alert khi ledger tăng mà reconcile không giảm. Với lô lớn, xử lý theo batch nhỏ và trả 202 kèm job id thay vì giữ request quá lâu.
`,
  exercises: [{
    title: 'Delete orchestrator: 207, tiến độ từng id và reconcile',
    prompt: `Cài {{DeleteOrchestrator}} với ba tier (đã khai báo trong starter): {{DbTier.deleteRows(id)}} trả {{true}} nếu xoá được row, {{false}} nếu row không tồn tại và có thể ném exception; {{ObjectTier.deleteBlob(id)}} và {{DownstreamTier.notify(id)}} có thể ném exception.

{{deleteBatch(List<String> ids)}} xử lý từng id theo thứ tự DB → blob → notify và trả {{Response(int status, List<Detail> detail)}}. Mọi id thành công thì status 200; chỉ cần một id lỗi thì 207; danh sách rỗng trả 200 với detail rỗng. Row không tồn tại được coi là đã xoá: trả detail code 200, bỏ qua blob và notify. Detail lỗi dùng code 500 và message chứa loại exception.

Mỗi id lưu tiến độ các bước đã xong. Khi một bước lỗi, ghi ledger cho từng bước đã thành công theo đúng dạng {{compensation.delete.row(id)}} và {{compensation.delete.blob(id)}}; id đã xoá hoàn toàn thì lần gọi sau trả 200 ngay, không gọi lại tier. {{reconcile()}} thử tiếp các bước còn thiếu của id trong ledger, xoá ledger khi xong và trả số id còn kẹt.`,
    starter: `record Detail(String id, int code, String msg) {}
record Response(int status, List<Detail> detail) {}
interface DbTier { boolean deleteRows(String id) throws Exception; }
interface ObjectTier { void deleteBlob(String id) throws Exception; }
interface DownstreamTier { void notify(String id) throws Exception; }
class DeleteOrchestrator {
    DeleteOrchestrator(DbTier db, ObjectTier objects, DownstreamTier downstream) {
        throw new UnsupportedOperationException("TODO");
    }
    Response deleteBatch(List<String> ids) {
        throw new UnsupportedOperationException("TODO");
    }
    int reconcile() {
        throw new UnsupportedOperationException("TODO");
    }
    List<String> compensations() {
        throw new UnsupportedOperationException("TODO");
    }
}`,
    tests: `public class Main {
 static int p=0,t=0;
 interface Th { void run() throws Exception; }
 static void ck(String n,Th r){t++;try{r.run();p++;System.out.println("PASS "+n);}catch(Throwable e){System.out.println("FAIL "+n+": "+e);}}
 static void eq(Object a,Object b){if(!Objects.equals(a,b))throw new AssertionError(a+" != "+b);}
 public static void main(String[] x){
  ck("all tiers succeed returns 200",()->{
   AtomicInteger dbc=new AtomicInteger(),blobc=new AtomicInteger(),notc=new AtomicInteger();
   DeleteOrchestrator o=new DeleteOrchestrator(
     id->{dbc.incrementAndGet();return true;},
     id->blobc.incrementAndGet(),
     id->notc.incrementAndGet());
   Response r=o.deleteBatch(List.of("o1","o2"));
   eq(200,r.status()); eq(2,r.detail().size());
   eq(200,r.detail().get(0).code()); eq(200,r.detail().get(1).code());
   eq(2,dbc.get()); eq(2,blobc.get()); eq(2,notc.get());
   eq(0,o.compensations().size());
  });
  ck("object failure returns 207 and logs row compensation",()->{
   AtomicInteger blobc=new AtomicInteger(),notc=new AtomicInteger();
   DeleteOrchestrator o=new DeleteOrchestrator(
     id->true,
     id->{blobc.incrementAndGet();throw new InstantiationException("blob store down");},
     id->notc.incrementAndGet());
   Response r=o.deleteBatch(List.of("o1"));
   eq(207,r.status()); eq(500,r.detail().get(0).code());
   eq(1,blobc.get()); eq(0,notc.get());
   eq(true,o.compensations().contains("compensation.delete.row(o1)"));
   eq(false,o.compensations().contains("compensation.delete.blob(o1)"));
  });
  ck("downstream failure logs row and blob compensation",()->{
   DeleteOrchestrator o=new DeleteOrchestrator(
     id->true,
     id->{},
     id->{throw new InstantiationException("downstream down");});
   Response r=o.deleteBatch(List.of("o1"));
   eq(207,r.status());
   eq(true,o.compensations().contains("compensation.delete.row(o1)"));
   eq(true,o.compensations().contains("compensation.delete.blob(o1)"));
  });
  ck("reconcile finishes missing steps without deleting db twice",()->{
   AtomicInteger dbc=new AtomicInteger(),blobc=new AtomicInteger(),notc=new AtomicInteger();
   DeleteOrchestrator o=new DeleteOrchestrator(
     id->{dbc.incrementAndGet();return true;},
     id->{if(blobc.incrementAndGet()==1)throw new InstantiationException("first blob attempt");},
     id->notc.incrementAndGet());
   eq(207,o.deleteBatch(List.of("o1")).status());
   eq(1,dbc.get());
   eq(0,o.reconcile());
   eq(1,notc.get());
   Response again=o.deleteBatch(List.of("o1"));
   eq(200,again.status());
   eq(1,dbc.get());
   eq(1,notc.get());
   eq(0,o.compensations().size());
  });
  ck("stale id is treated as already deleted",()->{
   AtomicInteger blobc=new AtomicInteger(),notc=new AtomicInteger();
   DeleteOrchestrator o=new DeleteOrchestrator(
     id->false,
     id->blobc.incrementAndGet(),
     id->notc.incrementAndGet());
   Response r=o.deleteBatch(List.of("ghost"));
   eq(200,r.status()); eq(200,r.detail().get(0).code());
   eq(0,blobc.get()); eq(0,notc.get());
   eq(0,o.compensations().size());
  });
  ck("empty batch returns 200 with empty detail",()->{
   AtomicInteger calls=new AtomicInteger();
   DeleteOrchestrator o=new DeleteOrchestrator(
     id->{calls.incrementAndGet();return true;}, id->calls.incrementAndGet(), id->calls.incrementAndGet());
   Response r=o.deleteBatch(List.of());
   eq(200,r.status()); eq(0,r.detail().size()); eq(0,calls.get());
  });
  ck("mixed batch returns 207 with one detail per id",()->{
   DeleteOrchestrator o=new DeleteOrchestrator(
     id->true,
     id->{if(id.equals("bad"))throw new InstantiationException("blob missing");},
     id->{});
   Response r=o.deleteBatch(List.of("ok","bad"));
   eq(207,r.status()); eq(2,r.detail().size());
   eq(200,r.detail().get(0).code()); eq(500,r.detail().get(1).code());
   eq(true,o.compensations().contains("compensation.delete.row(bad)"));
   eq(false,o.compensations().contains("compensation.delete.row(ok)"));
  });
  ck("db failure has no completed tier to compensate",()->{
   AtomicInteger blobc=new AtomicInteger(),notc=new AtomicInteger();
   AtomicBoolean down=new AtomicBoolean(true);
   DeleteOrchestrator o=new DeleteOrchestrator(
     id->{if(down.get())throw new InstantiationException("db down");return true;},
     id->blobc.incrementAndGet(),
     id->notc.incrementAndGet());
   eq(207,o.deleteBatch(List.of("o1")).status());
   eq(0,o.compensations().size()); eq(0,blobc.get()); eq(0,notc.get());
   down.set(false);
   eq(200,o.deleteBatch(List.of("o1")).status());
   eq(1,blobc.get()); eq(1,notc.get());
  });
  ck("repeated success does not call tiers again",()->{
   AtomicInteger dbc=new AtomicInteger(),notc=new AtomicInteger();
   DeleteOrchestrator o=new DeleteOrchestrator(
     id->{dbc.incrementAndGet();return true;}, id->{}, id->notc.incrementAndGet());
   eq(200,o.deleteBatch(List.of("x")).status());
   eq(200,o.deleteBatch(List.of("x")).status());
   eq(1,dbc.get()); eq(1,notc.get());
  });
  System.out.println("RESULT "+p+"/"+t);
 }
}`,
    reference: `record Detail(String id, int code, String msg) {}
record Response(int status, List<Detail> detail) {}
interface DbTier { boolean deleteRows(String id) throws Exception; }
interface ObjectTier { void deleteBlob(String id) throws Exception; }
interface DownstreamTier { void notify(String id) throws Exception; }
class DeleteOrchestrator {
    private enum Step { DB, BLOB, NOTIFY }
    private static final class State {
        final EnumSet<Step> done = EnumSet.noneOf(Step.class);
    }
    private record Comp(String action, String id) {}
    private final DbTier db;
    private final ObjectTier objects;
    private final DownstreamTier downstream;
    private final Map<String, State> progress = new HashMap<>();
    private final Set<String> completed = new HashSet<>();
    private final List<Comp> ledger = new ArrayList<>();

    DeleteOrchestrator(DbTier db, ObjectTier objects, DownstreamTier downstream) {
        this.db = db;
        this.objects = objects;
        this.downstream = downstream;
    }

    Response deleteBatch(List<String> ids) {
        List<Detail> detail = new ArrayList<>();
        for (String id : ids) detail.add(deleteOne(id));
        boolean failed = detail.stream().anyMatch(d -> d.code() >= 400);
        return new Response(failed ? 207 : 200, List.copyOf(detail));
    }

    private Detail deleteOne(String id) {
        if (completed.contains(id)) return new Detail(id, 200, "already deleted");
        State st = progress.computeIfAbsent(id, k -> new State());
        try {
            if (!st.done.contains(Step.DB)) {
                if (!db.deleteRows(id)) {
                    progress.remove(id);                 // no row and nothing to compensate
                    return new Detail(id, 200, "already absent");
                }
                st.done.add(Step.DB);
            }
            if (!st.done.contains(Step.BLOB)) {
                objects.deleteBlob(id);
                st.done.add(Step.BLOB);
            }
            if (!st.done.contains(Step.NOTIFY)) {
                downstream.notify(id);
                st.done.add(Step.NOTIFY);
            }
            completed.add(id);
            progress.remove(id);
            clearLedger(id);
            return new Detail(id, 200, "deleted");
        } catch (Exception e) {
            if (st.done.contains(Step.DB)) ledger.add(new Comp("delete.row", id));
            if (st.done.contains(Step.BLOB)) ledger.add(new Comp("delete.blob", id));
            return new Detail(id, 500, e.getClass().getSimpleName() + ": " + e.getMessage());
        }
    }

    int reconcile() {
        Set<String> ids = new LinkedHashSet<>();
        for (Comp c : ledger) ids.add(c.id());
        int unresolved = 0;
        for (String id : ids) {
            State st = progress.get(id);
            if (completed.contains(id) || st == null) { clearLedger(id); continue; }
            boolean ok = true;
            try {
                if (st.done.contains(Step.DB) && !st.done.contains(Step.BLOB)) {
                    objects.deleteBlob(id);
                    st.done.add(Step.BLOB);
                }
                if (st.done.contains(Step.BLOB) && !st.done.contains(Step.NOTIFY)) {
                    downstream.notify(id);
                    st.done.add(Step.NOTIFY);
                }
            } catch (Exception e) {
                ok = false;
            }
            if (ok && st.done.contains(Step.NOTIFY)) {
                completed.add(id);
                progress.remove(id);
                clearLedger(id);
            } else {
                unresolved++;
            }
        }
        return unresolved;
    }

    List<String> compensations() {
        List<String> out = new ArrayList<>();
        for (Comp c : ledger) out.add("compensation." + c.action() + "(" + c.id() + ")");
        return out;
    }

    private void clearLedger(String id) {
        ledger.removeIf(c -> c.id().equals(id));
    }
}`,
    hints: [
      'Mỗi id có một {{EnumSet}} các bước đã xong; đầu mỗi lần xử lý chỉ chạy bước chưa có trong tập này.',
      'Khi catch exception, ghi ledger cho các bước đã thành công, không ghi cho bước vừa lỗi. Với DB trả false, coi như đã xoá và bỏ qua blob/notify.',
      'reconcile chỉ chạy tiếp từ bước còn thiếu dựa trên State, rồi xoá ledger của id khi đã notify xong.',
    ],
    explain: `Bài tập cho thấy saga xoá không cần rollback tức thời. Mỗi id đi qua ba bước; tiến độ được giữ lại nên retry tiếp tục từ chỗ dở dang. Nếu blob lỗi sau khi DB đã xoá, ledger ghi {{compensation.delete.row(id)}} để reconciler biết id này còn dang dở và sẽ thử blob/notify tiếp. Khi downstream lỗi sau khi cả DB và blob đã xong, ledger có cả row và blob.

reconcile không gọi lại DB vì State đã đánh dấu DB xong; nó chỉ chạy blob rồi notify. Vì vậy lần retry sau không xoá row lần hai, và id đã hoàn tất được đưa vào completed để các lần gọi sau trả 200 ngay. Row không tồn tại trả về 200 thay vì 404: với thao tác xoá, trạng thái mong muốn đã đạt, còn blob mồ côi nên do job dọn riêng thay vì làm fail cả lô.

Trong production, State và ledger phải được lưu bền và cập nhật nguyên tử với nhau; nếu không, crash sau khi xoá DB nhưng trước khi ghi ledger sẽ để lại dữ liệu không ai reconcile. Mỗi tier cần idempotent (xoá thiếu trả thành công, notify có idempotency key), và client phải hiển thị 207 theo từng id thay vì báo thành công chung.`,
  }],
  check: [
    { q: 'Một lô có 10 id: 9 id xoá xong, 1 id lỗi ở object store. API nên trả gì?', options: ['200 vì phần lớn thành công', '207 kèm detail từng id để client biết id nào lỗi', '500 và rollback toàn bộ', '202 và bỏ qua id lỗi'], answer: 1, explain: `207 Multi-Status đúng cho kết quả từng phần: 9 id thành công, 1 id lỗi vẫn được báo riêng. 200 che mất lỗi; 500 làm mất thông tin id nào đã xong và không rollback được object store; 202 chỉ hợp lý nếu chấp nhận xử lý nền, nhưng vẫn phải có trạng thái theo id.` },
    { q: 'Vì sao orchestrator lưu tiến độ các bước đã xong theo từng id?', options: ['Để tăng kích thước response', 'Để retry tiếp tục từ bước còn thiếu, tránh xoá DB hoặc notify hai lần', 'Để thay thế transaction DB', 'Để tự động rollback blob'], answer: 1, explain: `Tiến độ biến retry thành idempotent ở mức orchestration: bước đã xong bị bỏ qua. Nó không làm response lớn hơn (chỉ dùng nội bộ), không thay thế transaction DB, và cũng không tự rollback blob đã xoá.` },
    { q: 'Sau khi DB đã xoá nhưng blob lỗi, compensation ledger nên ghi gì?', options: ['Không ghi gì vì chưa hoàn tất', 'compensation.delete.row(id) cho bước DB đã thành công', 'compensation.delete.blob(id) cho bước vừa lỗi', 'Một bản sao dữ liệu blob để phục hồi'], answer: 1, explain: `Ledger ghi các bước đã thành công để reconciler biết id còn dang dở; trong ví dụ này là row. Bước vừa lỗi chưa thành công nên không ghi blob; không ghi gì sẽ làm mất dấu id cần xử lý; sao lưu blob là việc của backup, không phải ledger compensation.` },
  ], related: ['microservices-043', 'microservices-004', 'microservices-022'],
  tags: ['207', 'partial success', 'compensation', 'saga', 'reconcile']
}
);
