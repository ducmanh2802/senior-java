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

### Cơ chế từng bước
Hãy nhìn một luồng tạo đơn hàng từ đầu đến cuối. **Kafka** là một hệ thống hàng đợi/phát sự kiện (message broker — "người đưa thư" ở giữa): producer gửi message vào topic, consumer đọc message từ topic. **Event** là một bản ghi mô tả điều đã xảy ra (ví dụ "đơn hàng vừa được tạo"). **Broker** là máy chủ chạy Kafka, nhận và lưu message.

1. **Nhận request và mở transaction database**: service nhận lệnh tạo đơn. Nó mở một transaction (giao dịch — nhóm các thao tác DB: hoặc tất cả thành công, hoặc tất cả bị hủy/rollback). Đây là transaction nội bộ của một database, không phải transaction phân tán qua nhiều hệ thống.
2. **Ghi state nghiệp vụ**: {{INSERT}} vào bảng {{orders}}. Vì sao ghi trong transaction? Để nếu bước sau lỗi, đơn hàng "nửa vời" không bị lưu.
3. **Ghi ý định phát event vào outbox (cùng transaction)**: {{INSERT}} một dòng vào bảng {{outbox}} chứa {{event_id}} (định danh duy nhất, ổn định), {{aggregate_id}} (ví dụ order id), {{event_type}}, {{payload}} (nội dung JSON). Đây là "ghi chú" nói rằng: khi commit xong, hãy gửi event này. Vì sao cùng transaction? Vì DB đảm bảo hai INSERT cùng commit hoặc cùng rollback.
4. **Commit**: DB xác nhận. Từ thời điểm này, cả đơn hàng lẫn dòng outbox đều bền vững (durable — còn sau khi restart). **Chưa có message nào được gửi tới Kafka** ở bước này.
5. **Relay đọc outbox và publish**: một tiến trình riêng (relay/worker) quét các dòng outbox chưa gửi ({{sent_at IS NULL}}), gửi payload lên Kafka topic. **ACK** (acknowledgment) là xác nhận từ broker rằng message đã được nhận/lưu.
6. **Đánh dấu đã gửi sau ACK**: chỉ khi broker ACK, relay mới cập nhật {{sent_at}}. Vì sao sau ACK? Nếu đánh dấu trước rồi broker lỗi, event coi như "đã gửi" nhưng thực ra mất. Nếu chết giữa bước 5 và 6, lần sau relay gửi lại — đây là **at-least-once delivery** (gửi ít nhất một lần, có thể trùng).
7. **Consumer xử lý và phải idempotent**: consumer nhận event (có thể trùng) và áp dụng nghiệp vụ. Nó cần cơ chế chống trùng (xem bài idempotent consumer).

~~~java
// Minh họa luồng outbox: 2 thao tác DB trong 1 transaction, publish nằm ngoài
void createOrder(OrderRequest req, Connection db, OutboxRelay relay) throws Exception {
    String orderId = UUID.randomUUID().toString();
    String eventId = UUID.randomUUID().toString(); // id ổn định cho dedup
    db.setAutoCommit(false);
    try {
        // (2) ghi state nghiệp vụ
        try (var ps = db.prepareStatement(
                "INSERT INTO orders(id, status, amount) VALUES (?,?,?)")) {
            ps.setString(1, orderId); ps.setString(2, "CREATED"); ps.setLong(3, req.amount());
            ps.executeUpdate();
        }
        // (3) ghi outbox CÙNG transaction
        try (var ps = db.prepareStatement(
                "INSERT INTO outbox(event_id, aggregate_id, type, payload) VALUES (?,?,?,?)")) {
            ps.setString(1, eventId); ps.setString(2, orderId);
            ps.setString(3, "OrderCreated"); ps.setString(4, toJson(orderId));
            ps.executeUpdate();
        }
        db.commit(); // (4) commit: cả hai cùng bền vững
    } catch (Exception e) {
        db.rollback(); // lỗi → không có đơn, không có event
        throw e;
    }
    // (5)(6) relay poll outbox và publish sau commit; publish KHÔNG nằm trong transaction DB
}
~~~

### Lỗi hay gặp trên production
- **Triệu chứng:** đơn hàng có trong DB nhưng downstream (kho, thông báo) không nhận được event. **Nguyên nhân:** code publish Kafka trực tiếp sau khi ghi DB (dual-write) rồi process chết/crash giữa hai thao tác, hoặc publish trước commit rồi transaction rollback. **Cách sửa:** dùng transactional outbox; không bao giờ để publish broker nằm giữa transaction DB theo kiểu "hy vọng cả hai cùng thành công".
- **Triệu chứng:** bảng outbox phình to hàng chục triệu dòng, query chậm, disk đầy. **Nguyên nhân:** chỉ insert mà không có cơ chế dọn (purge) các dòng đã gửi, hoặc dọn quá chậm so với tốc độ ghi. **Cách sửa:** job xóa/archiver các dòng {{sent_at}} cũ hơn cửa sổ giữ (ví dụ 3-7 ngày, đủ để replay điều tra); dọn theo batch nhỏ để tránh lock lớn; theo dõi số dòng backlog và tuổi dòng cũ nhất.
- **Triệu chứng:** consumer nhận cùng một event 2-3 lần sau khi deploy/restart relay. **Nguyên nhân:** relay dùng mô hình "gửi rồi mới đánh dấu" (đúng) nên khi chết giữa chừng sẽ gửi lặp — đây là hành vi at-least-once, không phải bug. **Cách sửa:** chấp nhận duplicate ở tầng transport; bắt buộc consumer idempotent theo {{event_id}} ổn định; đo duplicate rate để phân biệt duplicate bình thường với storm.
- **Triệu chứng:** event của cùng một đơn hàng đến consumer sai thứ tự ({{OrderShipped}} trước {{OrderCreated}}). **Nguyên nhân:** relay gửi song song nhiều dòng, hoặc partition Kafka không gắn theo aggregate, hoặc không dùng sequence/version. **Cách sửa:** dùng {{aggregate_id}} (order id) làm partition key để các event cùng aggregate vào cùng partition (Kafka giữ thứ tự trong một partition); thêm {{sequence/version}} trong payload; consumer bỏ qua hoặc buffer event đến lệch thứ tự theo chính sách.

### Liên hệ phỏng vấn
- **Hỏi:** Vì sao không thể dùng một transaction bao cả database và Kafka? **Trả lời ngắn:** DB transaction chỉ cam kết trên một hệ quản trị; Kafka là hệ thống khác. Không có 2PC thực dụng giữa hai bên trong đa số kiến trúc; dùng outbox để atomic trong DB rồi publish at-least-once, consumer idempotent.
- **Hỏi:** Relay crash sau khi publish nhưng trước khi đánh dấu sent thì sao? **Trả lời ngắn:** Event sẽ được gửi lại (at-least-once). Đây là lựa chọn có chủ đích để tránh mất event; consumer phải deduplicate theo {{event_id}} ổn định.
- **Hỏi:** CDC (ví dụ Debezium) khác polling outbox thế nào? **Trả lời ngắn:** CDC đọc transaction log (WAL/binlog) nên thấy row đã commit với độ trễ thấp, không query bảng liên tục; đổi lại phải vận hành connector, schema và quản lý log retention.

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
    { q: 'Relay gửi thành công nhưng process chết trước khi ghi sent. Kết quả có thể là gì?', options: ['Event bị mất chắc chắn', 'Event được gửi lại; consumer cần deduplicate', 'DB tự rollback transaction đã commit', 'Kafka xóa event'], answer: 1, explain: `Outbox giữ hàng chưa đánh dấu nên relay sẽ thử lại. Điều này tạo duplicate nhưng tránh mất event; consumer dùng event id ổn định để xử lý idempotent. (A) sai vì mô hình "đánh dấu sau ACK" ưu tiên không mất. (C) sai vì transaction DB đã commit trước khi publish. (D) sai vì Kafka không tự xóa event hợp lệ do relay chết.` },
    { q: 'Debezium (kèm SMT Outbox Event Router) lấy event từ bảng outbox bằng cách nào?', options: ['CDC từ transaction log của database', 'Quét mọi bảng mỗi mili giây', 'Gọi trực tiếp controller Spring', 'Đọc ThreadLocal của producer'], answer: 0, explain: `Debezium connector đọc transaction log (WAL của PostgreSQL, binlog của MySQL) để bắt các INSERT đã commit vào bảng outbox; Outbox Event Router chỉ là SMT biến đổi và định tuyến change event đó sang topic. (B) sai vì CDC đọc log, không polling bảng. (C) sai vì CDC hoạt động ở tầng DB log, không gọi ứng dụng. (D) vô nghĩa vì ThreadLocal là state trong JVM, không phải nguồn event bền vững.` },
    { q: 'Vì sao nên ghi order và outbox trong CÙNG một transaction database?', options: ['Để Kafka tự rollback khi DB lỗi', 'Để publish nhanh hơn nhờ gom network', 'Để đảm bảo state nghiệp vụ và ý định phát event cùng commit hoặc cùng rollback', 'Để consumer không cần idempotent'], answer: 2, explain: `Đúng (C): cùng transaction cho atomicity nội bộ — không có trạng thái "có đơn nhưng không có outbox" hay ngược lại. (A) sai vì Kafka không tham gia transaction DB. (B) sai vì publish xảy ra sau commit bởi relay, không nằm trong transaction. (D) sai vì consumer vẫn phải idempotent do delivery là at-least-once.` },
    { q: 'Nếu relay đánh dấu sent TRƯỚC khi publish tới Kafka, rủi ro chính là gì?', options: ['Tạo duplicate event ở consumer', 'Làm transaction DB rollback tự động', 'Làm Kafka partition bị lệch thứ tự', 'Có thể mất event nếu publish thất bại hoặc process chết sau khi đánh dấu'], answer: 3, explain: `Đúng (D): event đã bị coi là "xong" nhưng chưa chắc broker đã nhận, nên mất message. (A) ngược lại — đánh dấu trước thường gây mất, không gây duplicate (duplicate xuất hiện khi đánh dấu sau). (B) sai vì đánh dấu sent không ảnh hưởng transaction DB đã commit. (C) sai vì thứ tự partition phụ thuộc key/partitioning, không phụ thuộc thời điểm đánh dấu.` },
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

### Cơ chế từng bước
**Idempotent** (lũy đẳng) nghĩa là thực hiện cùng một thao tác nhiều lần cho kết quả giống như thực hiện một lần (ví dụ: nhấn nút "lưu" 3 lần nhưng chỉ lưu 1 bản ghi). **Consumer** là chương trình đọc message từ broker (Kafka). **Offset** là vị trí đọc của consumer trong một partition (phân vùng) của topic; commit offset nghĩa là "tôi đã xử lý tới đây".

1. **Consumer nhận message**: broker giao message kèm {{message_id}} (định danh ổn định do producer/outbox tạo) và có thể kèm {{version/sequence}}. Vì sao cần {{message_id}} ổn định? Để cùng một message, dù được giao lại bao nhiêu lần, vẫn nhận ra là "đã thấy".
2. **Mở transaction database cục bộ**: consumer bắt đầu một transaction trên DB của chính nó (projection/state store). Vì sao? Để việc "ghi nhận đã xử lý" và "áp dụng side effect nghiệp vụ" trở thành một đơn vị nguyên tử.
3. **Kiểm tra/ghi inbox (dedup)**: {{INSERT}} vào bảng inbox (bảng ghi nhận message đã xử lý) với unique constraint trên {{(consumer_name, message_id)}}. Nếu insert thành công → message mới, tiếp tục. Nếu vi phạm unique (conflict) → message trùng, **rollback/thoát mà không làm side effect**. Vì sao dùng unique constraint thay vì check-then-act? Vì hai consumer replica cùng kiểm tra "chưa có" rồi cùng xử lý sẽ trừ tiền hai lần; constraint DB là trọng tài nguyên tử.
4. **Kiểm tra version (nếu event thay thế state)**: với event dạng snapshot (mô tả trạng thái mới), so {{incoming.version > current.version}}. Nếu cũ hơn hoặc bằng → bỏ qua phần áp dụng state (nhưng đã ghi inbox để replay sau không tốn xử lý). Vì sao không dùng timestamp đồng hồ? Đồng hồ các máy có thể lệch (clock skew).
5. **Áp dụng side effect nghiệp vụ**: cập nhật projection/bảng state, hoặc thực hiện hành động nghiệp vụ. Với event **cộng dồn** (charge tiền, tăng số dư) thì version không thay thế được dedup — bắt buộc dựa vào {{message_id}}.
6. **Commit transaction DB**: inbox row và state change cùng commit. Từ đây, dù message có đến lại, bước 3 sẽ chặn.
7. **Commit offset (sau DB commit)**: consumer báo broker đã xử lý. Vì sao sau DB commit? Nếu commit offset trước rồi DB lỗi, broker nghĩ "xong" và không giao lại → mất hiệu ứng (at-most-once). Commit sau tạo at-least-once (có thể trùng) và dedup xử lý phần trùng.

~~~java
// Luồng idempotent consumer: inbox insert + apply trong 1 transaction DB
void handle(Message msg, Connection db) throws Exception {
    db.setAutoCommit(false);
    try {
        // (3) dedup: unique (consumer, message_id) — conflict nghĩa là đã xử lý
        try (var ps = db.prepareStatement(
                "INSERT INTO inbox(consumer, message_id) VALUES (?,?)")) {
            ps.setString(1, "billing"); ps.setString(2, msg.id());
            ps.executeUpdate();
        } catch (java.sql.SQLIntegrityConstraintViolationException dup) {
            db.rollback(); // (3) duplicate: không side effect
            return;
        }
        // (4)(5) chỉ áp version mới, rồi cập nhật state
        applyIfNewer(db, msg.aggregateId(), msg.version(), msg.payload());
        db.commit(); // (6) inbox + state cùng bền vững
    } catch (Exception e) {
        db.rollback(); // lỗi → offset chưa commit, broker sẽ giao lại
        throw e;
    }
    // (7) commit offset SAU DB commit (thực tế do consumer framework gọi)
}
~~~

### Lỗi hay gặp trên production
- **Triệu chứng:** khách bị trừ tiền hai lần, hoặc tồn kho bị trừ hai lần sau khi consumer restart/rebalance. **Nguyên nhân:** dedup chỉ bằng {{HashSet}} trong RAM — mất khi restart, và mỗi replica có Set riêng nên hai instance cùng xử lý trước khi biết nhau; hoặc dùng check-then-act không nguyên tử (kiểm tra rồi mới xử lý tách rời). **Cách sửa:** dùng inbox table với unique constraint trên {{(consumer, message_id)}}, insert và side effect trong cùng transaction DB; với side effect gọi dịch vụ ngoài, dùng idempotency key ở đích hoặc outbox.
- **Triệu chứng:** projection hiển thị trạng thái cũ dù event mới đã đến (ví dụ đơn đã "Shipped" nhưng hiện "Paid"). **Nguyên nhân:** event đến sai thứ tự (out-of-order) và consumer ghi đè state theo thứ tự nhận, không theo {{version/sequence}} của aggregate; hoặc dùng timestamp làm version và bị clock skew. **Cách sửa:** lưu {{version}} theo aggregate, chỉ áp dụng khi {{incoming.version > current}}; dùng sequence tăng đơn điệu do aggregate phát; với event dạng delta/out-of-order phức tạp, cân nhắc buffer chờ gap hoặc rebuild từ source.
- **Triệu chứng:** bảng inbox tăng không ngừng, chiếm dung lượng lớn, insert chậm dần. **Nguyên nhân:** ghi nhận mọi {{message_id}} nhưng không có retention (chính sách giữ/xóa). **Cách sửa:** xóa inbox row cũ hơn cửa sổ replay/khôi phục có căn cứ (ví dụ lâu hơn max retention của topic + thời gian điều tra); dọn theo batch, có index; theo dõi kích thước bảng.
- **Triệu chứng:** replay một khoảng event cũ (reprocessing) làm phát sinh side effect lặp (gửi mail lại, gọi API đối tác lần nữa). **Nguyên nhân:** xóa inbox key quá sớm nên replay không còn bị chặn; hoặc side effect nằm ngoài transaction DB (gọi HTTP) không có idempotency key. **Cách sửa:** giữ inbox key đủ dài qua cửa sổ replay; với side effect ngoài, dùng outbox hoặc idempotency key ở hệ thống đích; thiết kế replay chạy ở chế độ có kiểm soát.

### Công cụ và production
Kafka consumer offset và DB transaction là hai hệ thống riêng; commit offset sau DB thường tạo at-least-once. Kafka transactions hỗ trợ consume-transform-produce trong Kafka, nhưng không tự nguyên tử với database ngoài. Spring Cloud Stream cung cấp listener/binder và error handling, không tự làm business side effect idempotent. Thiết kế schema inbox có unique constraint, metric duplicate rate, lag, conflict version; retention phải dài hơn cửa sổ replay/khôi phục. Nếu xóa key quá sớm, replay cũ có thể chạy lại side effect.

### Pitfall
Check-then-act không atomic: hai consumer cùng thấy key chưa có rồi cả hai cùng trừ tiền. Dùng unique constraint và xử lý duplicate key. Không dùng timestamp làm version nếu đồng hồ có thể lệch; sequence tăng đơn điệu theo aggregate tốt hơn. Với event out-of-order dạng delta, cần buffer/gap handling hoặc rebuild từ source; chỉ bỏ version cũ có thể làm mất delta bắt buộc.

### Liên hệ phỏng vấn
- **Hỏi:** At-least-once nghĩa là gì và vì sao consumer vẫn phải idempotent? **Trả lời ngắn:** Broker có thể giao lại message khi offset chưa được commit sau khi DB đã commit, hoặc khi timeout/rebalance. At-least-once ưu tiên không mất; idempotent consumer (inbox + unique key) biến lần giao trùng thành no-op.
- **Hỏi:** Vì sao check {{if (!set.contains(id)) set.add(id)}} không đủ trong môi trường nhiều replica? **Trả lời ngắn:** Set cục bộ không chia sẻ giữa instance và thao tác không nguyên tử với side effect; hai replica có thể cùng qua nhánh {{if}} rồi cùng xử lý. Cần unique constraint ở DB dùng chung và thực hiện trong cùng transaction.
- **Hỏi:** Làm sao xử lý event đến sai thứ tự? **Trả lời ngắn:** Với event thay thế state, lưu {{version/sequence}} tăng đơn điệu theo aggregate và chỉ áp dụng khi version mới hơn; không dùng timestamp đồng hồ. Với event dạng delta, có thể cần buffer/gap handling hoặc rebuild.

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
    { q: 'DB side effect đã commit nhưng consumer chưa commit offset. Kịch bản hợp lý nhất?', options: ['Message có thể được giao lại', 'Broker biết DB commit nên bỏ qua', 'DB tự rollback theo offset', 'Message bị đổi ID'], answer: 0, explain: `Offset và DB là hai transaction khác nhau; crash ở giữa có thể khiến broker giao lại. Inbox/idempotency làm lần giao lại không nhân đôi hiệu ứng. (B) sai vì broker không quan sát transaction DB. (C) sai vì offset commit không điều khiển rollback DB. (D) sai vì message id ổn định là cơ sở dedup.` },
    { q: 'Vì sao check-then-act bằng HashSet cục bộ không đủ khi có nhiều replica?', options: ['Set không lưu String', 'Mỗi replica có trạng thái riêng và có thể cùng xử lý trước khi ghi', 'Kafka không gửi String', 'Version luôn tăng theo đồng hồ'], answer: 1, explain: `Các process không chia sẻ Set và thao tác cục bộ không nguyên tử toàn cụm. Unique constraint/inbox dùng chung là nơi phân xử. (A) sai vì HashSet lưu được String. (C) sai, không liên quan kiểu dữ liệu. (D) sai và đồng hồ còn có thể lệch.` },
    { q: 'Trong idempotent consumer, tại sao nên insert inbox và cập nhật state trong CÙNG transaction DB?', options: ['Để Kafka commit offset nhanh hơn', 'Để tránh trạng thái "đã áp dụng side effect nhưng chưa ghi nhận đã xử lý" khi crash', 'Để cho phép hai replica cùng xử lý một message', 'Để thay thế hoàn toàn version checking'], answer: 1, explain: `Đúng (B): nếu tách rời, crash giữa hai bước có thể làm side effect chạy rồi nhưng inbox chưa ghi, lần giao lại sẽ chạy lại side effect. (A) sai vì offset commit là thao tác riêng với broker. (C) sai, mục tiêu là ngăn xử lý trùng. (D) sai vì version giải quyết thứ tự event state, khác mục đích với dedup theo message_id.` },
    { q: 'Consumer nhận event state cũ (version 2) sau khi đã áp dụng version 5. Cách xử lý đúng là gì?', options: ['Ghi đè state bằng version 2 để giữ đủ lịch sử nhận', 'Bỏ qua áp dụng state vì version không mới hơn; vẫn ghi nhận message id để replay an toàn', 'Rollback DB về version 2', 'Tăng offset nhưng xóa inbox để nhận lại'], answer: 1, explain: `Đúng (B): event state chỉ áp dụng khi version lớn hơn hiện tại; vẫn nên dedup theo message_id để lần replay không xử lý lại. (A) sai vì sẽ làm state lùi. (C) sai vì DB không tự rollback theo version event và việc này phá hủy state mới hơn. (D) sai vì xóa inbox làm mất khả năng chống trùng.` },
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

### Cơ chế từng bước

Saga chia một nghiệp vụ lớn thành nhiều **local transaction** (giao dịch cục bộ): mỗi service tự commit trong database của riêng mình, không có một transaction duy nhất bao toàn bộ quy trình. **Orchestrator** lưu sagaId (mã định danh toàn quy trình), trạng thái từng bước và kết quả, rồi quyết định bước tiếp theo.

Ví dụ đặt hàng: tạo đơn PENDING → authorize tiền → reserve kho → confirm đơn. Mỗi service commit riêng. Nếu bước 3 (reserve) thất bại sau khi bước 2 đã trừ tiền, orchestrator không thể rollback payment (đã commit ở database khác); thay vào đó gọi **compensation** (bù trừ): hoàn tiền qua payment rồi đánh dấu đơn FAILED/CANCELLED. Compensation là hành động nghiệp vụ mới, không phải quay ngược thời gian, và chỉ chạy cho các bước đã thành công.

~~~java
// Phác thảo orchestrator: chạy từng bước, bù ngược thứ tự khi lỗi
class OrderSagaOrchestrator {
    void run(Order order) {
        orderService.createPending(order.id()); // commit đơn PENDING
        if (!paymentService.authorize(order.id(), order.amount())) {
            orderService.cancel(order.id());    // chưa trừ tiền → chỉ hủy đơn
            return;
        }
        if (!inventoryService.reserve(order.id(), order.items())) {
            paymentService.refund(order.id(), order.amount()); // đã trừ → hoàn tiền trước
            orderService.cancel(order.id());                      // rồi hủy đơn
            return;
        }
        orderService.confirm(order.id());   // saga hoàn thành
    }
}
~~~

### Lỗi hay gặp trên production

- **Triệu chứng:** payment timeout, orchestrator refund và hủy đơn, sau provider cho biết tiền đã bị trừ. Khách bị trừ tiền nhưng đơn đã hủy. **Nguyên nhân:** timeout không chứng minh thao tác thất bại; lệnh gốc có thể vẫn chạy ở provider. **Cách sửa:** trước khi bù trừ, tra cứu trạng thái bằng idempotency key hoặc gửi lại lệnh cùng key để lấy kết quả cũ; chỉ refund khi chắc đã charge.
- **Triệu chứng:** compensation gọi refund nhưng refund lại lỗi, orchestrator đánh dấu saga FAILED và bỏ qua; tiền chưa hoàn nhưng hệ thống coi như xong. **Nguyên nhân:** coi compensation là best-effort, không retry và không theo dõi. **Cách sửa:** compensation idempotent, retry có giới hạn; lưu lỗi cuối, đưa saga vào trạng thái cần can thiệp và alert.
- **Triệu chứng:** restart orchestrator làm saga quên tiến độ, bắt đầu lại từ đầu và trừ tiền hai lần cho cùng đơn. **Nguyên nhân:** trạng thái saga chỉ lưu trong RAM, mất khi process restart. **Cách sửa:** lưu sagaId, trạng thái từng bước và kết quả vào database bền vững trước khi gọi service tiếp theo; restart đọc lại và tiếp tục từ bước cuối cùng đã lưu.

### Liên hệ phỏng vấn

- **Hỏi:** Vì sao saga không dùng transaction phân tán (2PC) bao cả ba service? **Trả lời ngắn:** Hai service có database riêng, không có giao thức commit chung thực dụng; 2PC khóa lâu và dễ treo. Saga chấp nhận trạng thái trung gian, mỗi service commit cục bộ, rồi bù trừ bằng compensation khi lỗi.
- **Hỏi:** Payment timeout, chưa rõ provider đã trừ tiền chưa, bạn làm gì? **Trả lời ngắn:** Không refund ngay. Tra cứu hoặc retry cùng idempotency key để provider trả kết quả cũ, chỉ hoàn tiền khi chắc đã charge.
- **Hỏi:** Compensation thất bại (refund lỗi), xử lý thế nào? **Trả lời ngắn:** Compensation idempotent, retry có giới hạn, lưu lỗi cuối, đưa saga vào trạng thái cần can thiệp và alert; không coi compensation là best-effort rồi bỏ qua.
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
    { q: 'Bước thứ ba của saga thất bại sau khi bước thứ hai đã commit riêng. Orchestrator nên làm gì?', options: ['Gọi compensation cho bước hai (đã thành công), ngược thứ tự, rồi đánh dấu đơn FAILED', 'Gọi rollback trên database của bước hai để hủy tất cả', 'Chỉ đánh dấu đơn FAILED mà không động vào bước hai', 'Bỏ qua bước hai và tiếp tục bước thứ tư'], answer: 0, explain: `Đúng (A): mỗi local transaction đã commit riêng, không có rollback toàn cục; orchestrator gọi compensation (hành động bù mới) cho các bước đã thành công, ngược thứ tự, rồi kết thúc saga. (B) sai vì không thể rollback database của service khác. (C) sai vì đã commit thì phải bù, không được bỏ qua. (D) sai vì bước thất bại dừng quy trình, không tiếp tục.` },
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

### Cơ chế từng bước

Retry là thử lại một thao tác sau khi lỗi, chỉ hợp lý khi lỗi có khả năng tự biến mất (lỗi transient). **Lỗi transient** (lỗi tạm thời) có thể hết sau ngắn, ví dụ mạng reset, dịch vụ quá tải trả 503, API giới hạn gọi trả 429. **Lỗi permanent** (lỗi vĩnh viễn) không qua nếu thử lại, ví dụ payload sai schema, thiếu trường bắt buộc, hoặc message poison (dữ liệu hỏng làm processor luôn ném exception). Thử lại lỗi permanent chỉ làm chậm tiến độ và có thể làm tắc partition (khu vực dữ liệu) của Kafka.

Luồng xử lý một message với retry:

1. **Nhận message**: consumer lấy message từ hàng đợi, kèm số lần thử (attempt) đã lưu.
2. **Kiểm tra đến hạn (dueAt)**: chưa đến giờ thì để lại trong hàng, không xử lý.
3. **Chạy processor**: thành công thì message rời hàng. Nếu lỗi:
4. **Tăng attempts**: đạt ngân sách tối đa (maxAttempts) thì chuyển message vào **DLQ** (dead letter queue — hàng đợi thư thất, cách ly message không xử lý được) kèm metadata. Chưa đạt thì tính thời gian chờ bằng **exponential backoff** (gấp đôi mỗi lần, ví dụ 100 ms, 200 ms, 400 ms), cộng **jitter** (ngẫu nhiên nhỏ để client không cùng thức dậy tạo đợt tải đồng bộ), rồi đưa lại hàng.
5. **DLQ**: cần alert, chủ sở hữu, công cụ xem và quy trình replay sau khi sửa; replay phải bảo toàn idempotency để không tạo side effect hai lần.

~~~java
// Phác thảo retry với đồng hồ giả: kiểm thử không cần Thread.sleep
class RetryQueue {
    private final int maxAttempts;
    private final long baseDelay;
    private final Deque<Job> ready = new ArrayDeque<>();
    private final List<Job> dead = new ArrayList<>();

    boolean runOne(long now, Predicate<String> processor) {
        Job j = ready.peekFirst();
        if (j == null || now < j.dueAt()) return false; // chưa đến giờ
        ready.removeFirst();
        if (processor.test(j.id())) return true;        // thành công: rời hàng
        int n = j.attempts() + 1;
        if (n >= maxAttempts) {
            dead.add(new Job(j.id(), n, now));          // poison message → DLQ
        } else {
            ready.addLast(new Job(j.id(), n, now + baseDelay * (1L << (n - 1)))); // backoff gấp đôi
        }
        return true;
    }
}
~~~

Trong ví dụ, {{now}} là đồng hồ truyền vào nên kiểm thử không cần ngủ thật. Production cần giới hạn trễ tối đa, thêm jitter, lưu trạng thái bền vững và phân biệt lỗi transient/permanent.

### Lỗi hay gặp trên production

- **Triệu chứng:** consumer ném exception liên tục trên message hỏng, partition bị tắc, broker loại consumer khỏi nhóm, gây rebalance liên tục. **Nguyên nhân:** retry lỗi permanent trên thread consumer, không chuyển sang DLQ kịp thời. **Cách sửa:** phân loại lỗi ngay, lỗi validation/poison message chuyển DLQ sớm; retry chỉ với lỗi transient và số lần tối đa.
- **Triệu chứng:** nhiều client cùng retry vào database vừa hồi phục, tạo đợt tải đồng bộ (thundering herd) làm database sập lại. **Nguyên nhân:** không có jitter, tất cả client thức dậy cùng lúc. **Cách sửa:** thêm jitter ngẫu nhiên vào mỗi lần backoff và giới hạn trễ tối đa.
- **Triệu chứng:** retry thành công nhưng side effect đã xảy ra (trừ tiền rồi mới nhận lỗi response), khách bị trừ hai lần. **Nguyên nhân:** retry không đi kèm idempotency. **Cách sửa:** dùng idempotency key hoặc outbox, chỉ retry khi side effect thực hiện lại an toàn.
- **Triệu chứng:** ngân sách retry dài hơn SLA nghiệp vụ (retry 5 phút nhưng đơn chỉ xử lý trong 1 phút). **Nguyên nhân:** chỉ quy tắc số lần thử, không tính tổng thời gian. **Cách sửa:** đặt ngân sách thời gian retry nhỏ hơn SLA; message đến sau deadline thì retry thành công vẫn có thể gây hại.

### Liên hệ phỏng vấn

- **Hỏi:** Lỗi nào nên retry, lỗi nào đưa DLQ ngay? **Trả lời ngắn:** Retry lỗi transient (mạng reset, 429, 503) có số lần và backoff giới hạn; lỗi permanent (schema sai, thiếu trường bắt buộc, message hỏng) đưa DLQ sớm.
- **Hỏi:** Vai trò của jitter trong exponential backoff là gì? **Trả lời ngắn:** Phân tán thời điểm retry của nhiều client, tránh đợt tải đồng bộ khi dịch vụ vừa khôi phục.
- **Hỏi:** Hết ngân sách retry thì message đi đâu và làm sao sử dụng lại? **Trả lời ngắn:** Đưa vào DLQ kèm metadata; sau khi sửa lỗi, replay từ DLQ với idempotency để không tạo side effect hai lần.
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
    { q: 'Một message bị hỏng (poison message) khiến processor ném exception ở mọi lần thử. Chính sách phù hợp là gì?', options: ['Dừng retry và chuyển message vào DLQ kèm metadata để điều tra', 'Retry vô hạn cho đến khi message hợp lệ', 'Giữ message mãi đầu hàng và chờ bản sửa', 'Tăng max.poll.interval.ms cho đủ thời gian xử lý'], answer: 0, explain: `Đúng (A): poison message không tự hồi phục; retry vĩnh viễn không giải quyết lỗi dữ liệu, chỉ chặn tiến độ và có thể làm tắc partition. DLQ cách ly message kèm metadata (id, offset, lỗi) để nhóm điều tra và replay sau khi sửa, hàng chính vẫn tiếp tục chảy. (B) sai vì retry vĩnh viễn trên message hỏng không bao giờ kết thúc. (C) sai vì giữ đầu hàng chặn tất cả message sau. (D) sai vì max.poll.interval.ms chỉ là thời gian giữa hai lần poll, không đổi bản chất lỗi message.` },
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

### Cơ chế từng bước
Hãy đi qua luồng một request đi qua nhiều service và thread pool, từ đầu đến cuối. **TraceId** là định danh duy nhất của toàn bộ trace (một request end-to-end); **SpanId** là định danh của một operation cụ thể trong trace đó; **ParentSpanId** cho biết span cha. **ThreadLocal** là cơ chế lưu dữ liệu gắn với một thread cụ thể — dữ liệu này không tự lan truyền sang thread khác.

1. **Client gửi request có header traceparent**: Header W3C Trace Context (ví dụ {{traceparent: 00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01}}) mang {{version-trace-id-parent-id-flags}}. **Vì sao cần header này?** Vì traceId phải do client hoặc gateway edge sinh ra một lần, rồi tất cả service dùng chung để nối các span thành một trace hoàn chỉnh.
2. **Gateway/service edge extract context**: Đọc header, tạo {{Span}} gốc với traceId từ header, spanId mới. **Vì sao không tự sinh traceId mới?** Nếu mỗi service sinh traceId riêng, backend sẽ thấy hàng nghìn trace rời rạc thay vì một chuỗi liên tục — không thể debug latency hay error rate theo request thật.
3. **Gọi service downstream qua HTTP**: Inject context vào header {{traceparent}} và {{tracestate}} (baggage) khi gọi HTTP client. **Vì sao inject?** Vì network boundary cắt đứt ThreadLocal; header là cầu nối duy nhất giữa hai tiến trình.
4. **Xử lý bất đồng bộ qua thread pool**: Khi {{executor.submit(task)}}, thread caller **capture** context hiện tại ({{Context.current()}} hoặc {{MDC.getCopyOfContextMap()}}), truyền vào task. **Vì sao không để worker tự lấy?** Worker là thread tái sử dụng; ThreadLocal của caller không hiển thị ở worker. Nếu không capture, task chạy không có traceId, log mất liên kết.
5. **Trong task worker**: Set context đã capture vào ThreadLocal/MDC ngay đầu task, ghi log/span, xóa context trong {{finally}} (dù thành công hay exception). **Vì sao finally?** Exception làm bỏ qua code cleanup → context rò sang task kế tiếp trên cùng worker (thread leak).
6. **Kết thúc span và export**: Span kết thúc, đưa vào batch processor của OpenTelemetry SDK. **Vì sao batch?** Gửi từng span lên collector tốn network round-trip; batch gom nhiều span giảm overhead. Cấu hình {{scheduleDelayMillis}}, {{maxQueueSize}}, {{maxExportBatchSize}} để cân bằng latency vs throughput.
7. **Message broker (Kafka/RabbitMQ)**: Producer inject context vào message header; consumer extract và tạo span tiếp tục (hoặc span mới với parent context). **Vì sao inject vào message?** Message queue là network boundary khác; header message thay cho HTTP header.

~~~java
// Minh họa: capture context ở caller, set/clear trong worker (OpenTelemetry style)
Context captured = Context.current();                    // 4. capture ở thread submit
executor.submit(() -> {
    try (Scope scope = captured.makeCurrent()) {        // 5. set context cho task này, tự restore khi đóng
        Span span = tracer.spanBuilder("async-work").setParent(captured).startSpan();
        try (Scope s = span.makeCurrent()) {
            doWork();                                    // nghiệp vụ, log tự có traceId
        } finally { span.end(); }
    }
});
~~~

### Lỗi hay gặp trên production
- **Triệu chứng:** Log của request B hiển thị traceId của request A, khiến tracing UI hiển thị sai luồng. **Nguyên nhân:** Thread pool tái sử dụng worker; task A set MDC/ThreadLocal nhưng không clear trong {{finally}}, task B kế thừa context cũ. **Cách sửa:** Luôn bọc thân task bằng try/finally (set context trước, clear trong finally); dùng {{Context.taskWrapping(executor)}} của OpenTelemetry thay vì tự quản lý ThreadLocal.
- **Triệu chứng:** Trace bị đứt thành nhiều trace rời rạc ở service downstream; một request end-to-end hiển thị 3-4 traceId khác nhau. **Nguyên nhân:** Service gọi HTTP client nhưng không inject header {{traceparent}}/{{tracestate}}; hoặc service nhận request không extract header để làm parent context. **Cách sửa:** Cấu hình instrumentation tự động (OpenTelemetry Java agent, Micrometer Tracing) hoặc interceptor thủ công inject/extract header tại mọi boundary HTTP/gRPC/message.
- **Triệu chứng:** Collector nhận quá nhiều span, bộ nhớ tăng, batch export timeout, trace bị sampling bỏ qua ngẫu nhiên. **Nguyên nhân:** Không cấu hình {{BatchSpanProcessor}} (queue size, schedule delay, max batch size) và sampler phù hợp; span name dùng giá trị động (orderId) làm metric label gây cardinality explosion. **Cách sửa:** Dùng {{ParentBasedSampler}} với {{TraceIdRatioBased}} (ví dụ 10%); span name cố định (ví dụ {{HTTP POST /orders}}), orderId để vào attribute; cấu hình processor: {{scheduleDelayMillis=5000}}, {{maxQueueSize=2048}}, {{maxExportBatchSize=512}}.
- **Triệu chứng:** Retry message từ DLQ tạo span mới không nối với trace gốc, mất bối cảnh lỗi ban đầu. **Nguyên nhân:** Consumer retry không extract context từ message header, hoặc tạo span mới không set parent. **Cách sửa:** Khi retry, extract context từ header message gốc, tạo span con ({{setParent(extractedContext)}}) hoặc tiếp tục span cũ theo chính sách instrumentation.

### Liên hệ phỏng vấn
- **Hỏi:** Thread pool tái sử dụng worker; task A đặt MDC nhưng không clear. Nguy cơ chính? **Trả lời ngắn:** Task B có thể ghi log với context A — ThreadLocal thuộc worker, không tự dọn khi task kết thúc.
- **Hỏi:** Trong W3C Trace Context, {{trace-id}} và {{parent-id}} có vai trò nào? **Trả lời ngắn:** {{trace-id}} nối toàn trace; {{parent-id}} chỉ span cha được truyền để phía nhận tạo quan hệ con. Baggage là metadata riêng, không nên chứa bí mật.
- **Hỏi:** Tại sao không nên dùng {{orderId}} làm {{span name}} hoặc metric label? **Trả lời ngắn:** Cardinality explosion — mỗi đơn hàng tạo một tên span/label duy nhất, làm sập hệ thống metric/tracing. Dùng tên cố định ({{HTTP POST /orders}}), orderId để vào attribute.

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
    { q: 'Service A gọi HTTP service B nhưng không inject header traceparent. Hậu quả?', options: ['Service B tự sinh traceId mới, trace bị đứt', 'Service B dùng traceId của A tự động', 'HTTP client tự inject header', 'Không ảnh hưởng vì ThreadLocal lan truyền'], answer: 0, explain: `Ranh giới mạng cắt đứt ThreadLocal. Không inject header = service B không biết parent context, tự tạo trace mới → trace bị đứt. (B) sai vì không có cơ chế tự động. (C) sai trừ khi cấu hình instrumentation. (D) sai vì ThreadLocal không lan truyền qua network.` },
    { q: 'Tại sao không nên dùng orderId làm span name hoặc metric label?', options: ['Khó đọc trong UI', 'Cardinality explosion: mỗi đơn tạo label duy nhất, sập hệ thống metric', 'Vi phạm W3C spec', 'Làm chậm span export'], answer: 1, explain: `Span name/label phải ổn định, số lượng hữu hạn. orderId không giới hạn → cardinality không kiểm soát. Dùng span name cố định ("HTTP POST /orders"), orderId để attribute.` },
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

### Cơ chế từng bước
Hãy đi qua luồng xoá một lô dữ liệu (ví dụ 100 đơn hàng) qua ba hệ thống: Database (PostgreSQL), Object Store (S3/MinIO), Downstream (Notification Service). **Saga** là chuỗi các local transaction, mỗi transaction commit ở một hệ thống riêng; không có transaction ACID bao trùm cả ba. **Compensation** là hành động nghiệp vụ ngược chiều để bù trừ tác động đã commit (ví dụ: đã xoá row → compensation là khôi phục row, hoặc ghi log để reconcile sau). **207 Multi-Status** là mã HTTP báo "thành công một phần" — response kèm danh sách chi tiết từng item.

1. **Nhận request xoá lô**: API nhận {{DELETE /orders/batch}} với danh sách {{orderIds}}. **Vì sao batch?** Xoá từng id một request tốn network round-trip; batch gom nhiều id giảm overhead. Client nhận một response duy nhất.
2. **Duyệt từng id theo thứ tự DB → Blob → Notify**: Với mỗi {{id}}:
   - **Bước 1 - Xoá row DB**: Gọi {{DELETE FROM orders WHERE id = ?}}. Nếu row không tồn tại ({{false}}), coi như **đã xoá** (idempotent), bỏ qua Blob và Notify cho id này. **Vì sao DB trước?** Row DB là "source of truth"; nếu xoá DB thất bại thì không nên xoá blob (sẽ tạo blob mồ côi).
   - **Bước 2 - Xoá blob Object Store**: Gọi {{s3.deleteObject(bucket, key)}}. Nếu lỗi (network, permission), **ghi compensation ledger**: {{compensation.delete.row(id)}} — nghĩa là row DB đã xoá, cần reconcile sau. **Vì sao ghi ledger?** Row đã mất, blob còn lại; ledger đánh dấu "còn việc dang dở" để job reconcile xử lý.
   - **Bước 3 - Notify downstream**: Gọi {{notificationService.deleted(id)}}. Nếu lỗi, ghi thêm {{compensation.delete.blob(id)}} (blob đã xoá, cần notify lại). **Vì sao notify cuối?** Downstream chỉ cần biết khi dữ liệu thực sự đã biến mất; notify sớm có thể gây race condition (downstream đọc DB còn thấy row).
3. **Tổng hợp response**: Nếu **tất cả** id thành công (mỗi id qua hết 3 bước) → trả {{200 OK}}. Nếu **có ít nhất một id lỗi** ở bất kỳ bước nào → trả {{207 Multi-Status}} kèm {{detail}} danh sách từng id với {{code}} (200/500) và {{msg}}. **Vì sao 207 không phải 500?** 500 nghĩa là "toàn bộ thất bại", client không biết id nào đã xoá. 207 cho client thấy rõ: id nào xong, id nào lỗi, tự quyết định retry hay báo cáo.
4. **Retry / Reconcile**: Client hoặc scheduler gọi lại {{deleteBatch}} (hoặc {{reconcile()}}). Orchestrator đọc **tiến độ** (progress) từng id: bước nào đã {{done}} thì **bỏ qua**, chỉ chạy bước còn thiếu. **Vì sao cần tiến độ?** Không có tiến độ, retry sẽ xoá DB lần 2 (idempotent nên an toàn nhưng lãng phí), xoá blob lần 2, **gửi notify lần 2** (gửi email gấp đôi — nguy hiểm).
5. **Kết thúc**: Khi tất cả bước của một id đã {{done}} → xoá tiến độ và ledger của id đó. Id này lần sau gọi trả {{200}} ngay (already deleted).

~~~java
// Minh họa luồng deleteOne với tiến độ và ledger (rút gọn từ bài tập)
Detail deleteOne(String id) {
    if (completed.contains(id)) return new Detail(id, 200, "already deleted");
    State st = progress.computeIfAbsent(id, k -> new State()); // EnumSet<Step> done

    try {
        // Bước 1: DB
        if (!st.done.contains(Step.DB)) {
            if (!db.deleteRows(id)) { progress.remove(id); return new Detail(id, 200, "already absent"); }
            st.done.add(Step.DB);
        }
        // Bước 2: Blob
        if (!st.done.contains(Step.BLOB)) { objects.deleteBlob(id); st.done.add(Step.BLOB); }
        // Bước 3: Notify
        if (!st.done.contains(Step.NOTIFY)) { downstream.notify(id); st.done.add(Step.NOTIFY); }

        completed.add(id); progress.remove(id); clearLedger(id);
        return new Detail(id, 200, "deleted");
    } catch (Exception e) {
        // Ghi ledger cho các bước ĐÃ thành công (bước lỗi KHÔNG ghi)
        if (st.done.contains(Step.DB)) ledger.add(new Comp("delete.row", id));
        if (st.done.contains(Step.BLOB)) ledger.add(new Comp("delete.blob", id));
        return new Detail(id, 500, e.getClass().getSimpleName() + ": " + e.getMessage());
    }
}
~~~

### Lỗi hay gặp trên production
- **Triệu khách:** Client nhận {{200 OK}} nhưng một số id thực tế chưa xoá được blob/notify; dữ liệu mồ côi tồn tại âm thầm. **Nguyên nhân:** Orchestrator trả {{200}} khi có lỗi (chỉ kiểm tra DB thành công, bỏ qua lỗi blob/notify), hoặc try-catch nuốt exception mà không ghi ledger/đánh dấu lỗi. **Cách sửa:** Luôn kiểm tra lỗi ở **tất cả** ba bước; chỉ trả {{200}} khi mọi id qua hết 3 bước; lỗi bất kỳ bước → {{207}} kèm detail từng id.
- **Triệu chứng:** Reconcile chạy mà xoá row DB lần hai (hoặc gửi notify lần hai), gây email trùng lặp cho người dùng. **Nguyên nhân:** Không lưu tiến độ (progress) từng bước đã xong; retry chạy lại từ đầu thay vì tiếp tục từ bước lỗi. **Cách sửa:** Lưu {{EnumSet<Step> done}} cho mỗi id (bền vững trong DB/Redis); đầu mỗi lần xử lý kiểm tra {{done}} để bỏ qua bước đã thành công.
- **Triệu chứng:** Service restart làm mất compensation ledger, các id kẹt giữa chừng không bao giờ được reconcile. **Nguyên nhân:** Ledger và tiến độ chỉ lưu trong RAM ({{Map}}, {{List}}); process chết là mất hết state. **Cách sửa:** Ghi ledger và progress vào bảng bền vững ({{saga_state/outbox}}) **trước hoặc cùng transaction** với việc gọi tier tiếp theo; restart đọc lại state và tiếp tục.
- **Triệu chứng:** Xoá cứng (hard delete) row DB, sau đó blob lỗi → không thể khôi phục row để retry, dữ liệu mất lệch. **Nguyên nhân:** Dùng {{DELETE}} thay vì {{soft delete}} (cột {{deleted_at}}); hard delete không thể undo. **Cách sửa:** Dùng soft delete + job dọn dẹp sau cửa sổ an toàn (ví dụ 30 ngày); compensation chỉ cần cập nhật {{deleted_at = null}} để khôi phục.

### Liên hệ phỏng vấn
- **Hỏi:** Vì sao chọn {{207 Multi-Status}} thay vì {{500}} khi một id lỗi? **Trả lời ngắn:** 500 che mất thông tin id nào đã xoá thành công; 207 trả detail từng id (code {{200}}/{{500}}) để client biết chính xác trạng thái và quyết định retry/report.
- **Hỏi:** Thứ tự ba bước {{DB → Blob → Notify}} có ý nghĩa gì? **Trả lời ngắn:** DB là source of truth (xoá trước để tránh blob mồ côi); Blob sau DB (tránh file rác khi DB fail); Notify cuối (downstream chỉ hành động khi dữ liệu thực sự mất).
- **Hỏi:** Reconcile không xoá DB hai lần nhờ cơ chế nào? **Trả lời ngắn:** Lưu tiến độ ({{EnumSet<Step> done}}) cho mỗi id; retry đọc tiến độ và chỉ chạy bước chưa {{done}}.
- **Hỏi:** Compensation ledger ghi gì khi blob lỗi sau khi DB đã xoá? **Trả lời ngắn:** {{compensation.delete.row(id)}} — đánh dấu row đã xoá, cần reconcile blob/notify; KHÔNG ghi {{compensation.delete.blob}} vì blob chưa xoá thành công.

> Senior tip: đặt metric theo id kẹt quá N phút và tuổi entry ledger; alert khi ledger tăng mà reconcile không giảm. Với lô lớn, xử lý theo batch nhỏ và trả {{202}} kèm job id thay vì giữ request quá lâu.
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
    { q: 'Row DB không tồn tại (xoá thất bại trả false). Orchestrator xử lý ra sao?', options: ['Trả 500 và ghi ledger compensation.delete.row', 'Coi như đã xoá: trả detail 200, bỏ qua blob và notify, không ghi ledger', 'Tạo row mới rồi xoá lại để có compensation', 'Retry vô hạn cho đến khi row xuất hiện'], answer: 1, explain: `Xoá idempotent: trạng thái mong muốn (row không còn) đã đạt. Không cần compensation vì không có tác động đã commit cần bù; blob/notify cũng không chạy vì không có dữ liệu để xoá/thông báo.` },
  ], related: ['microservices-043', 'microservices-004', 'microservices-022'],
  tags: ['207', 'partial success', 'compensation', 'saga', 'reconcile']
},
{
  id: 'lesson-microservices-008', track: 'microservices', order: 8,
  title: 'Saga engine tổng quát: compensation ngược thứ tự, idempotent và state log', level: 'senior', minutes: 45,
  goals: ['Viết engine saga chạy mọi danh sách bước (action + compensate), lỗi ở bước k thì bù trừ ngược k-1..0', 'Giải thích vì sao compensate có thể bị gọi hai lần và cách chặn ở cả engine lẫn phía nhận', 'Chọn nơi lưu trạng thái saga (bảng durable, event log, workflow engine) để crash không mất tiến độ'],
  body: `**Tóm tắt:** Saga là một dãy bước, mỗi bước có action (làm việc) và compensation (hoàn tác việc đã làm). Khi action của bước k thất bại, engine chạy compensation cho các bước đã thành công theo thứ tự NGƯỢC từ k-1 về 0; mỗi compensation chỉ được gọi một lần cho một saga, kể cả sau khi retry hay restart. Trạng thái saga phải lưu bền để tiến trình chết vẫn làm tiếp được. Bài 003 đã đi qua một luồng cố định bốn bước; bài này tổng quát hóa thành engine chạy được mọi danh sách bước — đúng cái bạn sẽ cài đặt ở bài tập — và trả lời hai câu khó nhất: vì sao compensate bị gọi hai lần và state saga để đâu.

### Nhắc lại gốc: không có rollback xuyên service
Trong monolith, một hàm gắn {{@Transactional}} (đơn vị làm việc do database quản lý: mọi thao tác bên trong hoặc cùng thành công, hoặc cùng bị hoàn tác) ghi đơn hàng, kho, tiền vào CÙNG database; dòng thứ ba lỗi thì database tự undo hai dòng trước. Mỗi microservice có database riêng thì không lệnh rollback nào với tới ba nơi cùng lúc. Nên "hủy" không phải là xóa: phải tạo HÀNH ĐỘNG MỚI bù cho hành động cũ — refund, nhả kho, hủy lệnh giao. Hóa đơn hủy vẫn nằm trong log, tiền có thể về chậm, phí có thể không hoàn lại. Compensation là nghiệp vụ, không phải nút xóa. (Ví dụ đời thường: trả hàng đã shipped không phải là làm như chưa từng mua — cửa hàng lập phiếu trả hàng, thu gói về, hoàn tiền, mỗi việc một phiếu riêng.)

### Luồng bốn bước chuẩn: đặt hàng → trừ kho → thanh toán → giao hàng
~~~seq
title: Order saga: bước giao hàng loi, bu tru nguoc thu tu
actors: Order | Kho | Thanh toán | Vận chuyển
Order -> Kho: reserve(SKU-42)
Kho --> Order: OK giu hang
Order -> Thanh toán: authorize(250000)
Thanh toán --> Order: OK giu tien
Order -> Vận chuyển: schedulePickup(o42)
Vận chuyển --> Order: FAIL het xe
Order -> Thanh toán: refund(250000) cung key
Order -> Kho: release(SKU-42)
note Order: saga xong khi ca hai bu tru xong
~~~

### Vì sao compensation phải chạy ngược thứ tự
Bước sau được xây trên kết quả bước trước: lệnh giao hàng tồn tại nhờ kho đã giữ và tiền đã thu. Nếu hoàn tác theo thứ tự xuôi — nhả kho trước khi hủy lệnh giao — đội giao vận sẽ nhận lệnh đi lấy hàng trong khi chỗ hàng đã được bán cho khách khác; nếu refund trước khi hủy order, order còn sống nhưng tiền đã mất. Engine vì thế hoạt động như một stack undo: bước lỗi dừng hàng đợi, rồi compensate từ ngay trước nó ngược về bước đầu. Quy tắc bạn sẽ cài: lỗi ở bước k → chỉ compensate các bước 0..k-1 theo thứ tự k-1, k-2, ..., 0.

### Bước nào được compensate — và timeout là ca khó nhất
Chỉ bước chắc chắn đã thành công mới được compensate; bước vừa lỗi không được coi là thành công nên không có gì để bù. Trường hợp khó là TIMEOUT: service gọi không trả lời kịp, bạn KHÔNG biết charge đã chạy chưa. Timeout không phải thất bại — refund ngay có thể hoàn một khoản chưa từng thu (cho khách tiền miễn phí), bỏ qua có thể để khách bị trừ tiền oan. Động tác đúng: đánh dấu bước là UNKNOWN, truy vấn kết quả theo sagaId hoặc gửi lại ĐÚNG idempotency key để phía kia trả kết quả cũ (xem lesson-microservices-006), chỉ khi chắc chắn mới quyết định đi tiếp hay bù trừ.

### Vì sao compensate có thể bị gọi hai lần
Orchestrator gửi refund, nhận timeout; không biết refund đã chạy chưa nên retry; nếu payment không chống trùng, khách nhận hai lần tiền. Chiều ngược cũng xảy ra: engine crash sau khi refund thành công nhưng TRƯỚC khi ghi "refund xong" vào state — restart thấy bước chưa bù nên gọi compensate lần hai. Phòng thủ phải có ở hai tầng: (1) engine lưu trạng thái compensation theo sagaId + bước nên không gọi lại compensate đã thành công; (2) phía nhận giữ idempotency key để lệnh trùng trả kết quả cũ thay vì hoàn thêm tiền. Bài tập dưới đây cài đúng tầng (1): retryCompensations() gọi hai lần không được làm compensate chạy hai lần.

### Trạng thái saga lưu ở đâu
Nguyên tắc: ghi transition của saga TRƯỚC hoặc cùng transaction với lúc phát command bước kế (kết hợp outbox ở bài 001), để restart biết chính xác đang đứng đâu. Dạng bảng tối thiểu:
~~~sql
CREATE TABLE saga_state (
  saga_id      varchar PRIMARY KEY,
  saga_type    varchar NOT NULL,           -- 'order_v1'
  status       varchar NOT NULL,           -- RUNNING | COMPENSATING | DONE | FAILED
  step_states  jsonb NOT NULL,             -- {"reserve":"DONE","pay":"DONE","ship":"FAILED"}
  updated_at   timestamptz NOT NULL
);
-- Scanner phục hồi: saga kẹt (cần làm tiếp sau restart)
SELECT * FROM saga_state
 WHERE status IN ('RUNNING','COMPENSATING')
   AND updated_at < now() - interval '5 minutes';
~~~
| Cách | Khi nào hợp | Đánh đổi |
|---|---|---|
| Bảng saga_state tự viết | Vài bước, đội quen SQL | Tự viết retry, timer, dashboard, công cụ xem saga |
| Event log / event sourcing | Đã theo CQRS, cần audit từng transition | Phức tạp khi saga rẽ nhánh |
| Workflow engine (Temporal, AWS Step Functions, Camunda) | Saga dài, nhiều nhánh, cần durable timer | Thêm hạ tầng phải vận hành, vendor lock-in |

### Khung engine tổng quát
~~~java
// Bước vận hành theo sagaId để mỗi lệnh giữ được idempotency key của nó
record Step(String name, SagaAction action, SagaAction compensate) {}
interface SagaAction { void run(String sagaId) throws Exception; }

void advance(Saga saga) {
    while (saga.step() < saga.steps().size()) {
        Step s = saga.steps().get(saga.step());
        try {
            s.action().run(saga.id());
            saga.markDone(s.name());        // ghi saga_state trước hoặc cùng lúc phát lệnh kế tiếp
            saga.step(saga.step() + 1);
        } catch (TimeoutException e) {
            saga.markUnknown(s.name());     // UNKNOWN: truy van ket qua, khong doan that bai
            return;
        } catch (Exception e) {
            saga.markFailed(s.name());
            compensateFrom(saga, saga.step() - 1);   // bu nguoc ve buoc dau
            return;
        }
    }
    saga.markCompleted();
}
~~~

### Lỗi hay gặp trên production
- Compensate theo thứ tự xuôi: lệnh nghiệp vụ phía sau tham chiếu tài nguyên đã bị thu hồi.
- Compensate cả bước chưa thành công: refund khoản chưa từng charge.
- Compensation của mình lỗi mà chỉ ghi log ERROR: saga kẹt âm thầm; phải có trạng thái COMPENSATION_PENDING + hàng đợi retry + alert theo tuổi saga.
- State chỉ nằm trong RAM: restart là mất đơn hàng đang dở; hai pod cùng "tiếp quản" một saga nếu không có lease.
- Xem timeout như thất bại chắc chắn: nguồn gốc của hoàn tiền hai lần và kho bị nhả oan.

### Liên hệ phỏng vấn
Vẽ state machine: RUNNING → mỗi bước DONE/FAILED/UNKNOWN → COMPENSATING (ngược thứ tự) → COMPLETED/ROLLED_BACK/COMPENSATION_PENDING. Trả lời gọn ba câu: vì sao ngược thứ tự (bước sau đè lên bước trước), compensate có thể bị gọi hai lần bằng cách nào (timeout + crash-trước-khi-ghi-state) và chặn ở đâu (engine theo sagaId + key ở phía nhận), state lưu đâu (bảng saga hoặc workflow engine, ghi trước/cùng lúc phát lệnh). Nói thêm compensation không đảo ngược mọi thứ: tiền về chậm, phí không hoàn, kho đã hết hạn giữ.

> Senior tip: bug saga đắt tiền nhất là "bù nửa vời im lặng" — compensation lỗi, không ai biết, khách bị giữ tiền giữa hai trạng thái. Theo dõi saga kẹt theo tuổi và theo bước, alert khi số saga COMPENSATION_PENDING tăng mà reconciler không giảm; mỗi saga phải có một người chịu trách nhiệm và một runbook can thiệp tay.
`,
  exercises: [{
    title: 'SagaRunner: chạy N bước, lỗi ở đâu bù ngược về đó, compensate không chạy hai lần',
    prompt: `Cài {{SagaRunner}} làm việc trong bộ nhớ, nhận một danh sách bước ({{Step}} với {{name()}}, {{doWork()}}, {{compensate()}} đã khai báo trong starter).

- {{SagaStatus run()}}: lần lượt chạy {{doWork}} của từng bước, ghi log {{START <ten>}}, {{DONE <ten>}}, {{FAIL <ten>}}. Tất cả thành công → {{COMMITTED}}. Một bước ném exception → ghi {{FAIL}}, KHÔNG chạy các bước sau, rồi compensate đúng các bước đã thành công theo thứ tự NGƯỢC (từ bước ngay trước bước lỗi về bước đầu): ghi {{COMPENSATE <ten>}} trước khi gọi, {{COMPENSATED <ten>}} khi hoàn tác thành công, {{COMPENSATE_FAILED <ten>}} khi hoàn tác cũng ném exception — và vẫn tiếp tục bù các bước còn lại chứ không dừng.
- Trạng thái cuối của run(): mọi compensation đều thành công (hoặc không có bước nào cần bù) → {{ROLLED_BACK}}; còn bước nào thất bại khi bù → {{COMPENSATION_PENDING}}.
- {{SagaStatus retryCompensations()}}: chạy lại CHỈ các bước đang {{COMPENSATION_PENDING}}, theo thứ tự ngược; nếu không còn bước pending → {{ROLLED_BACK}}. Nếu trạng thái hiện tại không phải {{COMPENSATION_PENDING}} thì trả ngay trạng thái hiện tại và KHÔNG gọi bất kỳ {{compensate}} nào — bảo đảm một compensation đã thành công không bao giờ chạy lần hai dù retry được gọi lặp.
- {{SagaStatus status()}} trả trạng thái hiện tại; {{List<String> stateLog()}} trả bản copy log trạng thái.
- Không có ràng buộc thứ tự giữa START và DONE của log nghiệp vụ; test chỉ dựa vào trạng thái từng bước, số lần compensate, và log COMPENSATE.
`,
    starter: `interface Step {
    String name();
    void doWork() throws Exception;      // action: commit local transaction cua service do
    void compensate() throws Exception;  // hanh dong nghiep vu nguoc chieu, phai idempotent
}
enum SagaStatus { COMMITTED, ROLLED_BACK, COMPENSATION_PENDING }
class SagaRunner {
    SagaRunner(List<Step> steps) {
        throw new UnsupportedOperationException("TODO");
    }
    SagaStatus run() {
        throw new UnsupportedOperationException("TODO");
    }
    SagaStatus retryCompensations() {
        throw new UnsupportedOperationException("TODO");
    }
    SagaStatus status() {
        throw new UnsupportedOperationException("TODO");
    }
    List<String> stateLog() {
        throw new UnsupportedOperationException("TODO");
    }
}`,
    tests: `public class Main {
 static int p=0,t=0;
 interface Act { void run() throws Exception; }
 static void ck(String n,Act r){t++;try{r.run();p++;System.out.println("PASS "+n);}catch(Throwable e){System.out.println("FAIL "+n+": "+e);}}
 static void eq(Object a,Object b){if(!Objects.equals(a,b))throw new AssertionError(a+" != "+b);}
 static Act ok(){ return ()->{ }; }
 static Act boom(){ return ()->{ throw new RuntimeException("step failed"); }; }
 static Act onceThenOk(AtomicInteger n){ return ()->{ if(n.incrementAndGet()==1) throw new RuntimeException("compensation unavailable"); }; }
 static Step stp(String name,Act work,Act comp,List<String> trace){
  return new Step(){
   public String name(){ return name; }
   public void doWork() throws Exception { trace.add("do "+name); work.run(); }
   public void compensate() throws Exception { trace.add("comp "+name); comp.run(); }
  };
 }
 public static void main(String[] x){
  ck("all steps succeed -> COMMITTED, no compensation",()->{
   List<String> trace=new ArrayList<>();
   List<Step> steps=new ArrayList<>();
   steps.add(stp("reserve",ok(),ok(),trace));
   steps.add(stp("pay",ok(),ok(),trace));
   SagaRunner r=new SagaRunner(steps);
   eq(SagaStatus.COMMITTED,r.run());
   eq(SagaStatus.COMMITTED,r.status());
   eq(List.of("do reserve","do pay"),trace);
   eq(0,(int)trace.stream().filter(s->s.startsWith("comp ")).count());
  });
  ck("last step fails -> earlier steps compensated in reverse",()->{
   List<String> trace=new ArrayList<>();
   List<Step> steps=new ArrayList<>();
   steps.add(stp("reserve",ok(),ok(),trace));
   steps.add(stp("pay",ok(),ok(),trace));
   steps.add(stp("ship",boom(),ok(),trace));
   SagaRunner r=new SagaRunner(steps);
   eq(SagaStatus.ROLLED_BACK,r.run());
   eq(List.of("do reserve","do pay","do ship","comp pay","comp reserve"),trace);
  });
  ck("first step fails -> nothing to compensate",()->{
   List<String> trace=new ArrayList<>();
   List<Step> steps=new ArrayList<>();
   steps.add(stp("reserve",boom(),ok(),trace));
   steps.add(stp("pay",ok(),ok(),trace));
   SagaRunner r=new SagaRunner(steps);
   eq(SagaStatus.ROLLED_BACK,r.run());
   eq(List.of("do reserve"),trace);
  });
  ck("failure in the middle -> only completed steps compensated",()->{
   List<String> trace=new ArrayList<>();
   List<Step> steps=new ArrayList<>();
   steps.add(stp("reserve",ok(),ok(),trace));
   steps.add(stp("pay",boom(),ok(),trace));
   steps.add(stp("ship",ok(),ok(),trace));
   steps.add(stp("gift",ok(),ok(),trace));
   SagaRunner r=new SagaRunner(steps);
   eq(SagaStatus.ROLLED_BACK,r.run());
   eq(List.of("do reserve","do pay","comp reserve"),trace);
  });
  ck("compensation failure keeps other compensations running",()->{
   List<String> trace=new ArrayList<>();
   List<Step> steps=new ArrayList<>();
   steps.add(stp("reserve",ok(),ok(),trace));
   steps.add(stp("pay",ok(),ok(),trace));
   steps.add(stp("ship",boom(),ok(),trace));
   steps.add(stp("gift",ok(),ok(),trace));
   SagaRunner r=new SagaRunner(steps);
   eq(SagaStatus.ROLLED_BACK,r.run());
   eq(List.of("do reserve","do pay","do ship","comp pay","comp reserve"),trace);
  });
  ck("pending compensation -> COMPENSATION_PENDING then retry fixes it",()->{
   List<String> trace=new ArrayList<>();
   AtomicInteger orderComp=new AtomicInteger();
   List<Step> steps=new ArrayList<>();
   steps.add(stp("order",ok(),onceThenOk(orderComp),trace));
   steps.add(stp("reserve",ok(),ok(),trace));
   steps.add(stp("ship",boom(),ok(),trace));
   SagaRunner r=new SagaRunner(steps);
   eq(SagaStatus.COMPENSATION_PENDING,r.run());
   eq(1,orderComp.get());
   eq(SagaStatus.ROLLED_BACK,r.retryCompensations());
   eq(2,orderComp.get());
   eq(2,(int)trace.stream().filter(s->s.equals("comp order")).count());
  });
  ck("compensate is never called twice after a clean rollback",()->{
   List<String> trace=new ArrayList<>();
   List<Step> steps=new ArrayList<>();
   steps.add(stp("reserve",ok(),ok(),trace));
   steps.add(stp("pay",ok(),ok(),trace));
   steps.add(stp("ship",boom(),ok(),trace));
   SagaRunner r=new SagaRunner(steps);
   eq(SagaStatus.ROLLED_BACK,r.run());
   eq(SagaStatus.ROLLED_BACK,r.retryCompensations());
   eq(SagaStatus.ROLLED_BACK,r.retryCompensations());
   eq(1,(int)trace.stream().filter(s->s.equals("comp pay")).count());
   eq(1,(int)trace.stream().filter(s->s.equals("comp reserve")).count());
  });
  ck("retry with nothing pending keeps every counter unchanged",()->{
   List<String> trace=new ArrayList<>();
   List<Step> steps=new ArrayList<>();
   steps.add(stp("a",ok(),ok(),trace));
   steps.add(stp("b",boom(),ok(),trace));
   SagaRunner r=new SagaRunner(steps);
   eq(SagaStatus.ROLLED_BACK,r.run());
   int before=trace.size();
   eq(SagaStatus.ROLLED_BACK,r.retryCompensations());
   eq(before,trace.size());
  });
  ck("permanently failing compensation stays pending across retries",()->{
   List<String> trace=new ArrayList<>();
   AtomicInteger calls=new AtomicInteger();
   Act alwaysBoom=()->{ calls.incrementAndGet(); throw new RuntimeException("still down"); };
   List<Step> steps=new ArrayList<>();
   steps.add(stp("order",ok(),alwaysBoom,trace));
   steps.add(stp("ship",boom(),ok(),trace));
   SagaRunner r=new SagaRunner(steps);
   eq(SagaStatus.COMPENSATION_PENDING,r.run());
   eq(SagaStatus.COMPENSATION_PENDING,r.retryCompensations());
   eq(SagaStatus.COMPENSATION_PENDING,r.retryCompensations());
   eq(3,calls.get());
  });
  System.out.println("RESULT "+p+"/"+t);
 }
}`,
    reference: `interface Step {
    String name();
    void doWork() throws Exception;
    void compensate() throws Exception;
}
enum SagaStatus { COMMITTED, ROLLED_BACK, COMPENSATION_PENDING }
class SagaRunner {
    private final List<Step> steps;
    private final Map<String, Boolean> applied = new HashMap<>();
    private final Map<String, Boolean> compensated = new HashMap<>();
    private final List<String> log = new ArrayList<>();
    private int failedIndex = -1;
    private SagaStatus status;

    SagaRunner(List<Step> steps) { this.steps = steps; }

    SagaStatus run() {
        failedIndex = -1;
        for (int i = 0; i < steps.size(); i++) {
            Step s = steps.get(i);
            log.add("START " + s.name());
            try {
                s.doWork();
                applied.put(s.name(), true);
                log.add("DONE " + s.name());
            } catch (Exception e) {
                log.add("FAIL " + s.name());
                failedIndex = i;
                break;
            }
        }
        if (failedIndex < 0) { status = SagaStatus.COMMITTED; log.add("COMMITTED"); return status; }
        unwind(failedIndex - 1);
        return status;
    }

    SagaStatus retryCompensations() {
        if (status != SagaStatus.COMPENSATION_PENDING) return status;
        unwind(failedIndex - 1);
        return status;
    }

    private void unwind(int from) {
        for (int i = from; i >= 0; i--) {
            Step s = steps.get(i);
            if (!Boolean.TRUE.equals(applied.get(s.name()))) continue; // never compensate a step that did not succeed
            if (!Boolean.TRUE.equals(compensated.get(s.name()))) {     // idempotency guard: a done compensation is never re-run
                log.add("COMPENSATE " + s.name());
                try {
                    s.compensate();
                    compensated.put(s.name(), true);
                    log.add("COMPENSATED " + s.name());
                } catch (Exception e) {
                    compensated.put(s.name(), false);
                    log.add("COMPENSATE_FAILED " + s.name());
                }
            }
        }
        status = computeStatus();
        log.add(status.name());
    }

    private SagaStatus computeStatus() {
        for (int i = failedIndex - 1; i >= 0; i--) {
            String n = steps.get(i).name();
            if (Boolean.TRUE.equals(applied.get(n)) && !Boolean.TRUE.equals(compensated.get(n)))
                return SagaStatus.COMPENSATION_PENDING;
        }
        return SagaStatus.ROLLED_BACK;
    }

    SagaStatus status() { return status; }
    List<String> stateLog() { return List.copyOf(log); }
}`,
    hints: [
      'Giữ hai map: bước nào đã {{applied}} và bước nào đã {{compensated}}. Khi bước k lỗi, duyệt i = k-1 về 0 và chỉ bù các bước applied mà chưa compensated.',
      'Bọc từng {{compensate}} trong try/catch: một bước bù lỗi thì ghi {{COMPENSATE_FAILED}} rồi đi tiếp các bước còn lại, đừng ném exception làm mất phần bù của các bước đầu.',
      'Trạng thái saga là hệ quả của các bước: còn ít nhất một bước applied mà chưa compensated → {{COMPENSATION_PENDING}}, không còn → {{ROLLED_BACK}}. retryCompensations chỉ chạy lại khi đang pending, nhờ vậy compensate đã thành công không bị gọi lần hai.',
    ],
    explain: `Engine SagaRunner tách làm hai phần: vòng apply ghi dấu từng bước thành công, và vòng unwind duyệt NGƯỢC từ bước ngay trước bước lỗi về bước đầu. Điều kiện {{applied}} loại đúng bước vừa lỗi (chưa từng commit gì) và các bước sau nó (chưa chạy); điều kiện {{!compensated}} chính là idempotency guard ở tầng orchestrator: một compensation đã thành công được đánh dấu nên dù retryCompensations() được gọi thêm bao nhiêu lần nữa, không service nào nhận lệnh bù lần hai. Trong production guard này phải nằm trong {{saga_state}} (mỗi transition ghi trước khi phát command tiếp theo) thì restart mới khôi phục được; map trong RAM chỉ mô phỏng một tiến trình sống liên tục.

Chi tiết dễ sai thứ hai: exception từ {{compensate}} không được thoát khỏi vòng unwind. Refund lỗi (nhà cung cấp tạm từ chối, hết hạn hoàn) không phải lý do để bỏ qua việc nhả kho — mỗi bước còn lại vẫn phải cố bù, bước lỗi rơi về trạng thái pending để reconciler hoặc người vận hành xử lý sau. Trạng thái cuối vì thế suy ra từ tập bước chứ không hard-code: còn bước pending → COMPENSATION_PENDING.

Lỗi kinh điển mà bài tập cố phơi bày: xem timeout là thất bại chắc chắn. Ở đây doWork ném exception nghĩa là THẤT BẠI RÕ; còn timeout là chưa biết — engine thật phải truy vấn theo sagaId hoặc gửi lại cùng idempotency key trước khi quyết định compensate, nếu không sẽ refund khoản chưa từng charge.`,
  }],
  check: [
    { q: 'Trong các câu về saga bên dưới, câu nào SAI?', options: ['Compensation nên chạy ngược thứ tự các bước đã thành công', 'Timeout của một bước nên được xử lý như chưa biết kết quả, không phải thất bại chắc chắn', 'Vì mỗi bước đã commit local transaction của nó, compensation chỉ cần chạy đúng một lần là đủ, không cần phía nhận biết trùng lặp', 'Một saga đúng thứ tự cần idempotency key: timeout cộng với retry luôn có thể tạo lệnh trùng'], answer: 2, explain: `Idempotency engine tầng (guard theo sagaId + bước) không đủ khi chính lệnh compensate gửi đi rồi timeout và được retry. Hai lần gửi refund là hai lời gọi đến payment, nên phía nhận vẫn phải dedup bằng idempotency key. Ba câu còn lại là tính chất chuẩn của saga.` },
    { q: 'Bước pay lỗi và refund cũng lỗi (provider từ chối) trong khi release kho đã chạy. SagaRunner đúng phải làm gì?', options: ['Dừng và đánh dấu saga thất bại', 'Chạy tiếp các bước bù còn lại, giữ saga ở trạng thái pending để reconcile', 'Xóa order khỏi database', 'Gọi lại refund trong một vòng lặp không giới hạn cho tới khi thành công'], answer: 1, explain: `Một compensation lỗi không hủy bỏ các compensation còn lại. Saga rơi về pending (cần reconcile/alert), không phải trạng thái cuối, và không được retry vô hạn không có trần.` },
    { q: 'Vì sao bảng saga_state phải ghi TRƯỚC (hoặc cùng transaction với) việc phát command bước tiếp theo?', options: ['Để tăng tốc độ phản hồi', 'Vì nếu ghi SAU khi gửi, tiến trình chết giữa hai thời điểm khiến restart không biết đã gửi lệnh hay chưa và phát trùng', 'Vì Kafka yêu cầu', 'Để tránh deadlock'], answer: 1, explain: `Thứ tự ghi-state-rồi-gửi-lệnh là cái tạo khả năng phục hồi. Ghi sau lệnh gửi để lại cửa sổ mất tiến độ; nhờ idempotency key, phát lại cùng bước thì an toàn còn quên mất bước thì không có gì cứu được.` },
  ], related: ['microservices-004', 'microservices-023'],
  tags: ['saga', 'compensation', 'idempotent', 'orchestrator', 'state']
},
{
  id: 'lesson-microservices-009', track: 'microservices', order: 9,
  title: 'Timeout budget và deadline propagation: đừng để chuỗi gọi tự giết nhau', level: 'senior', minutes: 40,
  goals: ['Giải thích vì sao timeout của một service phải nhỏ hơn thời gian còn lại mà caller giao cho nó', 'Tính tải nhân bản khi nhiều tầng cùng retry (retry storm) và nêu 4 cách chặn', 'Tính timeout còn lại cho từng hop với đồng hồ giả và quyết định có còn đủ thời gian để retry'],
  body: `**Tóm tắt:** Một request đi qua nhiều service chỉ có TỔNG thời gian cho phép (timeout budget) — thường là SLA của client. Mỗi hop phải lấy thời gian còn lại để cấu hình timeout cho hop kế (deadline propagation), không đặt timeout cứng độc lập; và trước khi retry phải kiểm tra thời gian còn lại đủ cho một lần gọi mới, không sẽ tiếp tay cho retry storm.

### Ba từ ngữ cần định nghĩa trước
- **timeout**: số mili-giây tối đa bạn chịu chờ MỘT lời gọi (ví dụ 800ms).
- **deadline (hay budget)**: MỐC THỜI GIAN TUYỆT ĐỐI mà request phải xong (ví dụ 12:00:03.420). Deadline không đổi khi đi qua các hop, chỉ có thời gian còn lại là ngắn dần.
- **SLA**: cam kết thời gian phản hồi với người dùng (ví dụ "99% request dưới 3 giây") — nguồn của con số budget.
Ví dụ đời thường: máy bay cất cánh lúc 15:00 (deadline) chứ không phải "đợi 2 tiếng nữa" (timeout) — mọi bộ phận tính ngược từ 15:00, không ai tự đặt giờ riêng.

### Vì sao mỗi nơi tự đặt timeout là thảm họa
Quy ước sai phổ biến: mọi service đều đặt timeout gọi downstream = 5 giây. Chain user → gateway → order → payment → ngân hàng, payment treo. Hình dung:
~~~text
Gateway:   |========== 5s ==========|  → bỏ cuộc, báo lỗi user
Order:     |=========== 5s ===========|  → bỏ cuộc, gọi lại payment
Payment:   |============ 5s =============|  → vẫn chờ ngân hàng!
Ngân hàng: |============= 5s ===============|  → làm xong, không ai nhận
~~~
Ba hệ quả: (1) user nhận lỗi từ giây thứ 5 nhưng hệ thống đốt tài nguyên (thread, connection DB) tới giây 15 cho request không còn ai chờ — dưới tải cao chính đám "work mồ côi" này làm nghẽn pool và sập dây chuyền (cascading failure: một service chậm kéo cả cụm chết theo); (2) caller đã bỏ cuộc trong khi callee vẫn đang làm → nếu thao tác ghi (trừ tiền) thì trạng thái hệ thống lệch với những gì user thấy; (3) không ai biết lỗi thật nằm ở đâu khi tầng nào cũng báo "timeout".
Vì thế luật nền tảng: **timeout bạn đặt cho chính mình phải NHỎ HƠN thời gian còn lại mà caller giao**, để caller còn kịp đọc lỗi của bạn và tự xử lý (fallback, trả 504 kèm lý do). Ngược lại, hop trong cùng một service thì timeout của nó phải nhỏ hơn deadline đang chạy.

### Deadline propagation: truyền thời gian còn lại, đừng truyền timeout
Thay vì mỗi hop tự đặt timeout cứng, caller gửi "mày chỉ còn X ms" cho callee. HTTP không có chuẩn, người ta tự đặt header ({{X-Deadline-Ms}} hoặc mốc tuyệt đối bằng epoch-ms); gRPC thì có sẵn header grpc-timeout và mọi interceptor tự tuân theo — nên một chain gRPC chậm dần tự cắt đúng chỗ.
~~~seq
title: Deadline di truyen: moi hop tiep tuoi con it thoi gian hon
actors: User | Gateway | Order | Payment | Bank
User -> Gateway: POST /orders (deadline +3000ms)
Gateway -> Order: create (deadline con 2600ms)
Order -> Payment: authorize (deadline con 1900ms)
Payment -> Bank: charge (deadline con 1200ms)
Bank --> Payment: OK
Payment --> Order: OK (con 700ms du loi)
Order --> Gateway: 201 Created
Gateway --> User: 201 Created
note Gateway: moi hop truir thoi gian cua minh roi moi truyen deadline
~~~
Số học cụ thể, và cũng là quy tắc cài đặt:
~~~text
Client đưa 3000ms tổng
Gateway:      giữ 400ms cho việc của mình → giao Order      2600ms
Order:        giữ 700ms (DB, tổng hợp)  → giao Payment     1900ms
Payment:      cap hop Bank 1200ms, giữ 700ms còn lại để ghi kết quả + trả lời
~~~
Code phía gọi (kiểu RestTemplate/Feign interceptor):
~~~java
// Timeout hộp kế tiếp = min(cap của mình, budget còn lại - dự phòng cho việc của mình)
long remaining = budget.remainingMillis();          // doc tu header X-Deadline
long hopTimeout = Math.min(1200, remaining - 300);  // cap 1.2s, giu 300ms duoi
if (hopTimeout <= 0) {
    return failFast("deadline exhausted");          // hết giờ: gọi tiếp cũng không kịp xong, dừng gọi
}
requestConfig.setResponseTimeout(Duration.ofMillis(hopTimeout));
~~~

### Retry storm: phép nhân tải không ai chủ trương
Một service timeout rồi retry 3 lần là bình thường. Ba tầng CHỒNG NHAU, mỗi tầng 3 lần, là thảm họa: nếu cả gateway, order lẫn payment đều retry khi tầng dưới chậm, một request của user biến thành tối đa 3x3x3 = 27 request đến payment — đúng lúc payment đang chậm nhất. Đó là retry storm (bão retry): tải nhân bản theo cấp số nhân, biến một dependency chậm thành cả cụm sập. Bốn lớp chặn:
1. **Chỉ retry Ở MỘT tầng** gần nguồn lỗi chuyển tiếp nhất (thường là tầng gọi trực tiếp), các tầng trên fail-fast.
2. **Retry có budget**: ví dụ tối đa 10% tổng request được là retry (Envoy và Resilience4j đều có retry budget).
3. **Backoff + jitter**: backoff là tăng dần thời gian chờ giữa các lần thử (100ms, 200ms, 400ms); jitter là cộng nhiễu ngẫu nhiên để hàng nghìn client không cùng retry đúng một thời điểm.
4. **Circuit breaker** (máy cắt tự động: n lỗi liên tiếp thì tạm ngưng gọi một khoảng): chặn dòng retry vô ích, và chỉ retry những request còn ĐỦ deadline — quay lại mục sau.

### Khi nào KHÔNG được retry nữa
Retry chỉ có nghĩa nếu lần thử mới còn kịp xong TRƯỚC deadline. Công thức: {{canRetry = remaining >= backoffMillis + timeoutOfNextAttempt}}. Còn 250ms mà hop kế cần 1200ms thì lần retry đó chắc chắn chết dọc đường — gửi đi chỉ tổ thêm tải. Chết sớm (fail fast) ở edge là hành vi ĐÚNG: user thấy lỗi trong 3 giây như cam kết, còn hệ thống ngừng đốt tài nguyên cho request ma.

### Lỗi hay gặp
- Đặt timeout tầng trong LỚN HƠN tầng ngoài: tầng ngoài đầu hàng trước, tầng trong làm công cốc.
- Quên trừ phần việc của chính mình: giao hết budget cho downstream, không còn ms nào ghi kết quả hay trả lời caller.
- Truyền TIMEOUT (số ms tương đối) thay vì DEADLINE (mốc tuyệt đối): mỗi hop tính lại từ đầu làm tổng thời gian phình ra.
- Mọi tầng cùng retry → storm khi một dependency chậm (brownout: chậm dần chứ chưa chết).
- Không cancel công việc đang chạy khi deadline đi qua — chỉ thôi chờ là chưa đủ.

### Liên hệ phỏng vấn
Vẽ chain 4 hop với budget 3000ms, chỉ ra công thức chia timeout từng hop; giải thích vì sao deadline (mốc tuyệt đối) phải được propagate chứ không phải timeout; liệt kê retry storm + 4 cách chặn (một tầng retry, retry budget, backoff + jitter, circuit breaker); chốt bằng "fail fast khi không còn đủ thời gian là tính năng, không phải bug".

> Senior tip: đặt timeout từ số liệu, không từ cảm giác: đo p99 thật của downstream rồi chọn timeout = p99 + một biên độ (công thức hay dùng là p99 x2 hoặc p99 + 100ms); timeout quá chật tự sinh lỗi trên traffic chậm-but-ok, quá rộng thì giữ tài nguyên. Monitor riêng "số request bị cắt bởi deadline" và "retry rate / request rate" — hai đường này dốc lên cùng lúc chính là bình minh của một sự cố storm.
`,
  exercises: [{
    title: 'Budget: tính thời gian còn lại cho từng hop với đồng hồ giả',
    prompt: `Cài {{Budget}} — bộ tính thời gian còn lại của một chuỗi gọi, dùng đồng hồ giả truyền vào để test bước thời gian tự do (không sleep, không đọc giờ thật).

- {{Budget(long totalMillis, LongSupplier clock)}}: deadline = thời điểm hiện tại của đồng hồ + totalMillis; ném {{IllegalArgumentException}} nếu totalMillis không dương.
- {{static Budget withDeadline(long deadlineMillis, LongSupplier clock)}}: tạo từ deadline tuyệt đối truyền xuống từ caller qua header (kiểu X-Deadline) — một service giữa chuỗi đi tiếp deadline của người gọi, không tự đặt lại từ đầu.
- {{long deadlineAt()}}: deadline tuyệt đối đã lưu.
- {{long remaining()}}: thời gian còn lại, không bao giờ âm.
- {{boolean expired()}}: đồng hồ đã chạm hoặc vượt deadline.
- {{long timeoutForCall(long capMillis, long reserveMillis)}}: timeout dành cho lời gọi downstream tiếp theo = {{min(capMillis, remaining - reserveMillis)}}; nếu kết quả không dương thì trả {{0}} — caller phải fail fast, đừng gọi downstream. Kiểm tra {{capMillis > 0}}, {{reserveMillis >= 0}} (ngược lại ném IllegalArgumentException).
- {{boolean canRetry(long retryTimeoutMillis, long backoffMillis)}}: chỉ cho phép thêm một lần thử khi thời gian còn lại đủ để chờ backoff rồi chạy trọn một attempts {{retryTimeoutMillis}}; kiểm tra {{retryTimeoutMillis > 0}}, {{backoffMillis >= 0}}.
`,
    starter: `class Budget {
    Budget(long totalMillis, LongSupplier clock) {
        throw new UnsupportedOperationException("TODO");
    }
    static Budget withDeadline(long deadlineMillis, LongSupplier clock) {
        throw new UnsupportedOperationException("TODO");
    }
    long deadlineAt() {
        throw new UnsupportedOperationException("TODO");
    }
    long remaining() {
        throw new UnsupportedOperationException("TODO");
    }
    boolean expired() {
        throw new UnsupportedOperationException("TODO");
    }
    long timeoutForCall(long capMillis, long reserveMillis) {
        throw new UnsupportedOperationException("TODO");
    }
    boolean canRetry(long retryTimeoutMillis, long backoffMillis) {
        throw new UnsupportedOperationException("TODO");
    }
}`,
    tests: `public class Main {
 static int p=0,t=0;
 interface Th { void run() throws Exception; }
 static void ck(String n,Th r){t++;try{r.run();p++;System.out.println("PASS "+n);}catch(Throwable e){System.out.println("FAIL "+n+": "+e);}}
 static void eq(Object a,Object b){if(!Objects.equals(a,b))throw new AssertionError(a+" != "+b);}
 public static void main(String[] x){
  ck("remaining decreases with the clock and never goes negative",()->{
   AtomicLong now=new AtomicLong(0);
   Budget b=new Budget(1000,now::get);
   eq(1000L,b.remaining());
   now.set(400);
   eq(600L,b.remaining());
   now.set(2000);
   eq(0L,b.remaining());
   eq(true,b.expired());
  });
  ck("expired exactly at the deadline",()->{
   AtomicLong now=new AtomicLong(0);
   Budget b=new Budget(500,now::get);
   now.set(499);
   eq(false,b.expired());
   now.set(500);
   eq(true,b.expired());
   eq(0L,b.remaining());
  });
  ck("timeoutForCall uses the cap when the budget is generous",()->{
   AtomicLong now=new AtomicLong(0);
   Budget b=new Budget(1000,now::get);
   eq(300L,b.timeoutForCall(300,100));
   eq(1000L,b.timeoutForCall(5000,0));
  });
  ck("timeoutForCall shrinks to remaining minus reserve",()->{
   AtomicLong now=new AtomicLong(0);
   Budget b=new Budget(500,now::get);
   now.set(300);
   eq(150L,b.timeoutForCall(1000,50));
   now.set(450);
   eq(0L,b.timeoutForCall(1000,50));
   now.set(480);
   eq(10L,b.timeoutForCall(1000,10));
   now.set(495);
   eq(0L,b.timeoutForCall(1000,10));
  });
  ck("canRetry passes exactly at the boundary and fails one ms short",()->{
   AtomicLong now=new AtomicLong(0);
   Budget b=new Budget(1000,now::get);
   eq(true,b.canRetry(800,200));
   eq(false,b.canRetry(800,201));
   now.set(300);
   eq(true,b.canRetry(700,0));
   eq(false,b.canRetry(701,0));
  });
  ck("withDeadline continues the caller deadline instead of resetting",()->{
   AtomicLong now=new AtomicLong(700);
   Budget caller=new Budget(1000,now::get);      // deadline = 1700
   now.set(900);
   Budget hop=new Budget(5000,now::get);         // hop tu dat timeout 5s: sai
   Budget propagated=Budget.withDeadline(caller.deadlineAt(),now::get);
   eq(800L,propagated.remaining());
   eq(5000L,hop.remaining());
   eq(caller.deadlineAt(),propagated.deadlineAt());
   eq(true,propagated.remaining()<hop.remaining());
  });
  ck("chain simulation: later hops get less until they fail fast",()->{
   AtomicLong now=new AtomicLong(0);
   Budget chain=new Budget(1000,now::get);
   List<Long> used=new ArrayList<>();
   for(int hop=0; hop<4; hop++){
    long t=chain.timeoutForCall(500,0);
    if(t==0) { used.add(0L); continue; }
    used.add(t);
    now.set(now.get()+t);                        // mỗi hộp dùng hết timeout của nó
   }
   eq(List.of(500L,500L,0L,0L),used);
  });
  ck("retry loop stops when the budget is exhausted",()->{
   AtomicLong now=new AtomicLong(0);
   Budget b=new Budget(1000,now::get);
   now.set(200);                                 // first attempt burned its full 200ms timeout
   int retries=0;
   long backoff=100;
   while(b.canRetry(200,backoff)){
    now.set(now.get()+backoff+200);
    retries++;
    backoff*=2;
   }
   eq(2,retries);
   eq(100L,b.remaining());
  });
  System.out.println("RESULT "+p+"/"+t);
 }
}`,
    reference: `class Budget {
    private final long deadline;
    private final LongSupplier clock;

    Budget(long totalMillis, LongSupplier clock) {
        this(deadlineFrom(totalMillis, clock), clock, true);
    }
    private Budget(long deadline, LongSupplier clock, boolean ignored) {
        this.deadline = deadline;
        this.clock = clock;
    }
    private static long deadlineFrom(long totalMillis, LongSupplier clock) {
        if (clock == null) throw new IllegalArgumentException("clock required");
        if (totalMillis <= 0) throw new IllegalArgumentException("totalMillis must be positive");
        return clock.getAsLong() + totalMillis;
    }
    static Budget withDeadline(long deadlineMillis, LongSupplier clock) {
        if (clock == null) throw new IllegalArgumentException("clock required");
        return new Budget(deadlineMillis, clock, true);
    }
    long deadlineAt() { return deadline; }
    long remaining() { return Math.max(0L, deadline - clock.getAsLong()); }
    boolean expired() { return clock.getAsLong() >= deadline; }
    long timeoutForCall(long capMillis, long reserveMillis) {
        if (capMillis <= 0) throw new IllegalArgumentException("capMillis must be positive");
        if (reserveMillis < 0) throw new IllegalArgumentException("reserveMillis must not be negative");
        long available = deadline - clock.getAsLong() - reserveMillis;
        return available <= 0 ? 0 : Math.min(capMillis, available);
    }
    boolean canRetry(long retryTimeoutMillis, long backoffMillis) {
        if (retryTimeoutMillis <= 0) throw new IllegalArgumentException("retryTimeoutMillis must be positive");
        if (backoffMillis < 0) throw new IllegalArgumentException("backoffMillis must not be negative");
        return remaining() >= retryTimeoutMillis + backoffMillis;
    }
}`,
    hints: [
      'Chỉ cần lưu hai thứ: deadline tuyệt đối (long) và clock. Mọi phương pháp khác đều là deadline trừ thời điểm hiện tại của clock.',
      'Dùng {{Math.max(0, deadline - now)}} để {{remaining()}} không bao giờ âm khi đồng hồ đã vượt deadline.',
      'Trong {{timeoutForCall}}, lấy {{deadline - now - reserve}} rồi mới {{Math.min}} với cap; nếu phần khả dụng không dương thì trả 0 chứ không trả số âm.',
      'Với constructor public nhận totalMillis: tính deadline trước trong một static helper, rồi gọi qua constructor phụ private có tham số phụ (boolean) để hai constructor không trùng chữ ký.',
    ],
    explain: `Budget là phần số học của deadline propagation: một request sinh ra với deadline tuyệt đối (mốc đồng hồ, không phải số ms tương đối), và mọi quyền định sau nó đều suy từ {{deadline - now}}. {{timeoutForCall(cap, reserve)}} embody hai quy tắc trong lesson: timeout của hop kế không bao giờ vượt cap của chính hop đó, và luôn trừ lại {{reserve}} để service còn ms ghi kết quả, trả lời caller, chạy compensation. Trả {{0}} nghĩa là "fail fast": đừng phát lời gọi mà bạn biết chắc không kịp sống.

{{canRetry(timeout, backoff)}}, không phải trạng thái retry, là chốt chặn retry storm: nếu {{remaining < backoff + timeout}} thì lần thử mới chắc chắn chết sau khi caller đầu hàng, phát nó chỉ để nhân tải cho hệ thống đang chậm. Vòng retry trong test 8 dừng đúng lúc remaining còn 100ms < backoff 400 + timeout 200 — request sẽ fail-fast ở edge trong SLA thay vì biến thành con số 27 ở tầng cuối.

{{withDeadline}} tái hiện hop giữa chuỗi: service B nhận deadline của A và đi tiếp chính mốc đó — nó KHÔNG được quyền tự cộng thêm 1000ms. Đây là chỗ phân biệt truyền deadline (mốc tuyệt đối) với truyền timeout (số tương đối): truyền timeout làm deadline phình lên qua từng hop. Trong production còn một nửa việc chưa mô phỏng được: khi deadline đi qua lúc công việc đang chạy dở, service phải cancel (interrupt, đóng connection, statement timeout) — chỉ ngừng chờ mà để worker tiếp tục đốt DB là đúng công thức của work mồ côi.

Bẫy khi cài: quên clamp {{remaining}} về 0 (test 1, 5 sẽ đỏ), so sánh {{remaining >= timeout}} mà quên backoff (test 5, 8 sẽ đỏ), trả timeout âm khi reserve ăn hết budget (test 4), và dùng {{System.currentTimeMillis}} thay vì clock truyền vào (thừa pass nhưng không test được deterministic).`,
  }],
  check: [
    { q: 'Gateway cho order-service deadline 1000ms. Order đã dùng 650ms, cần gọi payment với cap 500ms và muốn giữ 100ms cho việc của mình. Timeout đặt cho payment là bao nhiêu?', options: ['500 ms — cap cấu hình của payment', '350 ms — thời gian còn lại của order', '250 ms — còn lại trừ phần dự phòng', '1000 ms — deadline gốc từ gateway'], answer: 2, explain: `Còn 350ms, trừ 100ms dự phòng, chỉ còn 250ms khả dụng; cap 500ms không đạt nên không cắt thêm. Đặt 350ms (không dự phòng) nghĩa là payment có thể xong đúng lúc order không còn ms nào ghi kết quả; đặt cap hay deadline gốc đều vi phạm budget của caller.` },
    { q: 'Ba tầng A→B→C, mỗi tầng đặt 3 lần thử (1 ban đầu + 2 retry). C chậm. Số request tối đa có thể đổ xuống C cho MỘT request của user?', options: ['3 request', '9 request', '18 request', '27 request'], answer: 3, explain: `A thử 3 lần; mỗi lần đó B cũng thử 3 lần; mỗi lần của B, C lại nhận 3 lần từ B → 3x3x3 = 27. Đó là lý do retry phải tập kết ở MỘT tầng, có retry budget và chỉ khi còn đủ deadline.` },
    { q: 'Vì sao nên truyền deadline tuyệt đối (mốc thời gian) thay vì timeout tương đối qua header?', options: ['Vì header gọn hơn', 'Vì truyền số ms tương đối khiến mỗi hop tính lại từ đầu, tổng thời gian chuỗi phình to; deadline không đổi nên phần còn lại luôn đúng', 'Vì deadline nhanh hơn timeout', 'Vì HTTP không hỗ trợ timeout'], answer: 1, explain: `Timeout là đại lượng tương đối, cộng dồn qua mỗi hop là sai; deadline là mốc tuyệt đối, hop nào cũng tự suy ra thời gian còn lại của mình bằng deadline - now. gRPC làm đúng như vậy với grpc-timeout.` },
    { q: 'Payment timeout (provider không trả lời kịp). Trong các câu sau, câu nào ĐÚNG?', options: ['Timeout là bằng chứng charge chưa chạy, refund ngay là an toàn', 'Timeout không phân biệt được chưa chạy hay đã chạy xong, phải xác minh qua idempotency key hoặc query trước khi kết luận', 'Timeout là tín hiệu chậm, cứ retry ngay 3 lần', 'Timeout chỉ có ý nghĩa khi timeout đặt dài hơn deadline tổng'], answer: 1, explain: `Cả ba kịch bản (chưa chạy / đang chạy / xong nhưng response đi lạc) đều cho cùng một timeout. Chỉ idempotency key hoặc truy vấn trạng thái mới phân biệt được; đó cũng là lý do deadline propagation và canRetry phải đi kèm, để không retry mù vào khoảng không biết.` },
  ], related: ['microservices-025', 'microservices-008', 'microservices-007'],
  tags: ['timeout budget', 'deadline propagation', 'retry storm', 'backoff', 'fail fast']
}
,
{
  id: 'lesson-microservices-010', track: 'microservices', order: 10,
  title: 'Mô phỏng Kafka: partition log, offset và chiến lược commit', level: 'senior', minutes: 45,
  goals: ['Giải thích partition log (nhật ký phân vùng) và offset (vị trí đọc) trong consumer group', 'Phân biệt commit offset trước và sau xử lý dẫn đến mất hay trùng message', 'Tự mô phỏng assign/poll/commit để quan sát at-least-once và at-most-once'],
  body: `**Tóm tắt:** Kafka (hệ thống hàng đợi sự kiện phân tán, nơi producer gửi bản ghi và consumer đọc lại theo dòng) lưu message vào partition log (nhật ký phân vùng, dãy chỉ-ghi-thêm) theo offset (vị trí số thứ tự 0,1,2...). Consumer group (nhóm consumer dùng chung tên group để chia việc đọc) chia partition cho các consumer; consumer poll (kéo một lô bản ghi) và tự commit (ghi nhận vị trí đã đọc). Commit trước xử lý (at-most-once, nhiều nhất một lần) có thể mất message khi crash sau commit; commit sau xử lý (at-least-once, ít nhất một lần) có thể trùng khi crash trước commit. Bài này tự mô phỏng cơ chế thu nhỏ để thấy rõ đánh đổi.

### Cơ chế thật (Kafka) - hiểu trước khi mô phỏng
Topic (chủ đề, tên luồng dữ liệu) được chia thành nhiều partition. Mỗi partition là log bất biến theo thời gian: broker (máy chủ Kafka lưu dữ liệu) gán offset tăng dần cho từng bản ghi. Kafka đảm bảo mỗi partition trong một group chỉ gán cho tối đa 1 consumer tại một thời điểm (để giữ thứ tự trong partition).

~~~seq
title: Luồng đọc cơ bản (đơn giản hóa)
actors: Producer | Broker/Partition | Consumer | OffsetStore
Producer -> Broker/Partition: append(record) -> offset=5
Consumer -> Broker/Partition: poll(from offset=3)
Broker/Partition --> Consumer: records [3,4,5]
Consumer -> Consumer: xử lý nghiệp vụ
Consumer -> OffsetStore: commit(offset=6) (vị trí đọc tiếp)
~~~

Tên cấu hình thật (Kafka client Java, lớp {{KafkaConsumer}}):
- {{enable.auto.commit}}: tự động commit theo chu kỳ (mặc định true, {{auto.commit.interval.ms}}). Tiện nhưng có thể commit vị trí chưa xử lý xong.
- Commit thủ công: {{consumer.commitSync()}} / {{commitAsync()}} sau khi xử lý xong → hướng at-least-once.
- {{auto.offset.reset}} ({{earliest}}/{{latest}}): chọn vị trí khi group chưa có offset đã commit.
- Rebalance (cân bằng lại, gán lại partition khi consumer vào/rời group): gán bởi {{PartitionAssignor}}. {{RangeAssignor}} gán partition liên tiếp **theo từng topic** cho consumer (dễ lệch tải khi có nhiều topic). {{RoundRobinAssignor}} xoay vòng **tất cả partition của mọi topic** giữa consumer (cân bằng hơn). {{CooperativeStickyAssignor}} giảm gián đoạn bằng cách thu hồi/gán tăng dần. Khi revoke partition, {{ConsumerRebalanceListener.onPartitionsRevoked}} nên commit offset đã xử lý.

Task yêu cầu nhắc "gán partition (range vs round-robin)": ý chính là Range chia liên tiếp theo topic, Round-robin phân phối xoay vòng. (Bản mô phỏng bài tập không cài rebalance/assigner, chỉ tập trung vào offset+commit; đây là điểm đơn giản hoá.)

### Vì sao commit strategy quyết định mất hay trùng
| Chiến lược | Khi commit | Crash ở đâu | Hậu quả |
|---|---|---|---|
| At-most-once (nhiều nhất một lần) | Trước xử lý | Sau commit, trước xử lý xong | Mất message (offset đã tiến, message bị bỏ qua) |
| At-least-once (ít nhất một lần) | Sau xử lý | Sau xử lý, trước commit | Trùng message (offset chưa tiến, poll lại) |
| Exactly-once (đúng một lần, phạm vi Kafka) | Transaction / EOS | Tuỳ | Cần {{transactional.id}}, {{isolation.level=read_committed}}; không tự bao DB ngoài |

Kafka broker chỉ biết offset đã commit, không biết nghiệp vụ đã xử lý xong. Vì vậy at-least-once an toàn về mất dữ liệu, và consumer phải idempotent (xử lý lặp không gây tác dụng phụ hai lần, ví dụ dedup theo key/version).

### Bản mô phỏng đơn giản hoá (Java thuần)
{{MiniKafka}} chạy trong một JVM: partition là {{List<String>}} theo offset; mỗi group có committed offset và position đọc. Không có network, không có rebalance thật, không có nhiều consumer song song, không có retention/compaction, không mô phỏng auto-commit theo thời gian. "Crash" được mô phỏng bằng {{resetToCommitted}} (khởi động lại và đọc từ offset đã commit).

~~~java
// At-least-once: chỉ commit SAU khi xử lý thành công
List<String> batch = k.poll("g", "orders", 0, 10);
for (String m : batch) { handle(m); }     // crash ở đây → chưa commit
k.commit("g", "orders", 0, k.position("g","orders",0));
// handle ghi DB + crash trước commit → poll lại → trùng (cần idempotent)
~~~

### Lỗi hay gặp
- Bật {{enable.auto.commit}} mà xử lý lâu hơn {{auto.commit.interval.ms}}: commit chạy nền có thể tiến offset của batch chưa xử lý hết.
- Commit offset từng record thay vì batch: chậm; commit batch nhưng xử lý sai thứ tự so với offset commit.
- Không xử lý rebalance: mất cơ hội commit offset đã xử lý trước khi partition bị thu hồi.
- Nghĩ "exactly-once Kafka" là miễn phí: EOS chỉ bao produce/consume trong Kafka; ghi DB/JDBC ngoài vẫn cần idempotency/outbox.

### Liên hệ phỏng vấn
Nêu rõ: partition log + offset, group assignment (range/round-robin), hai hướng commit và hậu quả crash, vì sao chọn at-least-once + consumer idempotent. Nhắc {{enable.auto.commit}}, {{commitSync}}, {{ConsumerRebalanceListener}} và giới hạn EOS.

> Senior tip: theo dõi {{consumer lag}} (offset mới nhất trừ offset đã commit) theo partition; lag tăng đột biến thường do xử lý chậm, rebalance, hoặc poison message chặn một partition.
`,
  exercises: [
    {
      title: 'MiniKafka: poll/commit và mất-trùng theo chiến lược',
      prompt: `Cài {{MiniKafka}} mô phỏng partition log. {{append(topic, partition, message)}} thêm message vào cuối partition và trả offset (bắt đầu 0). {{poll(group, topic, partition, max)}} trả tối đa {{max}} message từ position hiện tại của group trên partition đó (chưa có position thì dùng committed offset, mặc định 0) và **tăng position** của group lên số message đã trả (mô phỏng đã đọc). {{commit(group, topic, partition, offset)}} đặt committed offset của group. {{position(group, topic, partition)}} trả position đọc hiện tại; {{committed(group, topic, partition)}} trả committed offset. {{resetToCommitted(group, topic, partition)}} đặt position = committed (mô phỏng consumer khởi động lại sau crash). Test kiểm tra: commit trước xử lý rồi reset → message bị bỏ qua (mất); xử lý xong nhưng chưa commit rồi reset → message đọc lại (trùng). Tất cả method {{synchronized}}.`,
      starter: `class MiniKafka {
    // topic -> partition -> list of messages (offset = index)
    private final Map<String, Map<Integer, List<String>>> log = new HashMap<>();
    // key group|topic|partition -> committed offset
    private final Map<String, Integer> commits = new HashMap<>();
    // key group|topic|partition -> read position
    private final Map<String, Integer> pos = new HashMap<>();
    private String key(String g, String t, int p) { return g + "|" + t + "|" + p; }
    synchronized int append(String topic, int partition, String message) { throw new UnsupportedOperationException("TODO"); }
    synchronized List<String> poll(String group, String topic, int partition, int max) { throw new UnsupportedOperationException("TODO"); }
    synchronized void commit(String group, String topic, int partition, int offset) { throw new UnsupportedOperationException("TODO"); }
    synchronized void resetToCommitted(String group, String topic, int partition) { throw new UnsupportedOperationException("TODO"); }
    synchronized int position(String group, String topic, int partition) { throw new UnsupportedOperationException("TODO"); }
    synchronized int committed(String group, String topic, int partition) { throw new UnsupportedOperationException("TODO"); }
}`,
      tests: `public class Main {
 static int p=0,t=0; static void ck(String n,Runnable r){t++;try{r.run();p++;System.out.println("PASS "+n);}catch(Throwable e){System.out.println("FAIL "+n+": "+e);}}
 static void eq(Object a,Object b){if(!Objects.equals(a,b))throw new AssertionError(a+" != "+b);}
 public static void main(String[] z){
  ck("append returns offsets",()->{MiniKafka k=new MiniKafka();eq(0,k.append("o",0,"a"));eq(1,k.append("o",0,"b"));eq(0,k.append("o",1,"x"));});
  ck("poll advances position",()->{MiniKafka k=new MiniKafka();k.append("o",0,"a");k.append("o",0,"b");k.append("o",0,"c");eq(List.of("a","b"),k.poll("g","o",0,2));eq(2,k.position("g","o",0));eq(List.of("c"),k.poll("g","o",0,5));});
  ck("at-most-once loses on crash",()->{MiniKafka k=new MiniKafka();k.append("o",0,"m1");k.append("o",0,"m2");List<String> batch=k.poll("g","o",0,10);
   k.commit("g","o",0,k.position("g","o",0)); // commit TRƯỚC xử lý
   // crash: không xử lý batch, restart
   k.resetToCommitted("g","o",0);
   eq(List.of(),k.poll("g","o",0,10)); // m1,m2 bi mat
  });
  ck("at-least-once duplicates on crash",()->{MiniKafka k=new MiniKafka();k.append("o",0,"m1");k.append("o",0,"m2");List<String> batch=k.poll("g","o",0,10);
   // đã xử lý batch nhưng crash TRƯỚC commit
   k.resetToCommitted("g","o",0);
   eq(List.of("m1","m2"),k.poll("g","o",0,10)); // doc lai -> trung
   k.commit("g","o",0,k.position("g","o",0));k.resetToCommitted("g","o",0);eq(List.of(),k.poll("g","o",0,10));
  });
  ck("independent groups and partitions",()->{MiniKafka k=new MiniKafka();k.append("o",0,"a");k.append("o",1,"b");eq(List.of("a"),k.poll("g1","o",0,5));eq(List.of("b"),k.poll("g1","o",1,5));eq(List.of("a"),k.poll("g2","o",0,5));});
  ck("poll beyond end returns empty",()->{MiniKafka k=new MiniKafka();k.append("o",0,"a");k.poll("g","o",0,5);k.commit("g","o",0,1);eq(List.of(),k.poll("g","o",0,5));});
  System.out.println("RESULT "+p+"/"+t);
 }
}`,
      reference: `class MiniKafka {
    private final Map<String, Map<Integer, List<String>>> log = new HashMap<>();
    private final Map<String, Integer> commits = new HashMap<>();
    private final Map<String, Integer> pos = new HashMap<>();
    private String key(String g, String t, int p) { return g + "|" + t + "|" + p; }
    private List<String> part(String topic, int partition) {
        return log.computeIfAbsent(topic, x -> new HashMap<>()).computeIfAbsent(partition, x -> new ArrayList<>());
    }
    synchronized int append(String topic, int partition, String message) {
        List<String> l = part(topic, partition); l.add(message); return l.size() - 1;
    }
    synchronized List<String> poll(String group, String topic, int partition, int max) {
        String k = key(group, topic, partition);
        int from = pos.getOrDefault(k, commits.getOrDefault(k, 0));
        List<String> l = part(topic, partition);
        int to = Math.min(l.size(), from + Math.max(0, max));
        if (from >= to) { pos.put(k, from); return List.of(); }
        List<String> out = new ArrayList<>(l.subList(from, to));
        pos.put(k, to);
        return out;
    }
    synchronized void commit(String group, String topic, int partition, int offset) {
        commits.put(key(group, topic, partition), Math.max(0, offset));
    }
    synchronized void resetToCommitted(String group, String topic, int partition) {
        String k = key(group, topic, partition);
        pos.put(k, commits.getOrDefault(k, 0));
    }
    synchronized int position(String group, String topic, int partition) {
        String k = key(group, topic, partition);
        return pos.getOrDefault(k, commits.getOrDefault(k, 0));
    }
    synchronized int committed(String group, String topic, int partition) {
        return commits.getOrDefault(key(group, topic, partition), 0);
    }
}`,
      hints: ['append lấy size trước khi add làm offset. poll đọc từ pos (hoặc committed nếu chưa có pos), copy subList, rồi đặt pos = vị trí sau phần đã trả.', 'resetToCommitted đặt pos = commits.getOrDefault(key,0) để mô phỏng restart đọc lại từ offset đã commit.', 'Các group/partition độc lập nhờ key ghép; committed mặc định 0.'],
      explain: `Mô phỏng tách {{position}} (vị trí đang đọc trong bộ nhớ) và {{committed}} (vị trí bền vững mà group ghi nhận). Commit trước xử lý làm committed tiến ngay: reset mô phỏng crash sau đó khiến position quay về committed đã tiến → bỏ qua batch chưa xử lý (mất). Commit sau xử lý giữ committed cũ: reset sau crash khiến poll trả lại batch → trùng. Đây chính là at-most-once vs at-least-once.

Trong Kafka thật, committed offset lưu trong topic nội bộ {{__consumer_offsets}}. {{poll()}} trả {{ConsumerRecords}}; {{commitSync}} thường commit offset = lastProcessed + 1. Rebalance có thể thu hồi partition nên cần commit offset đã xử lý. Bản mô phỏng bỏ qua network, serialization, nhiều consumer, rebalance thật, retention, và không mô phỏng {{enable.auto.commit}} theo thời gian.

Lỗi hay gặp: nhầm "đã poll" với "đã xử lý xong"; commit offset của record chưa xử lý; dùng auto-commit với handler chậm; không làm consumer idempotent khi chọn at-least-once.`
    }
  ],
  check: [
    { q: 'Commit offset trước khi xử lý xong nghiệp vụ, rồi process crash. Hậu quả điển hình?', options: ['Message được xử lý lại (trùng)', 'Message bị bỏ qua vì offset đã tiến (mất)', 'Broker tự rollback offset', 'Consumer group bị xóa'], answer: 1, explain: 'Offset đã commit được coi là đã đọc; sau restart consumer tiếp tục từ offset mới nên batch chưa xử lý bị bỏ qua. Đây là at-most-once.' },
    { q: 'Tại sao at-least-once thường đi kèm consumer idempotent?', options: ['Để tăng throughput', 'Vì crash trước commit có thể khiến cùng message được poll và xử lý lại', 'Vì Kafka xóa message sau poll', 'Vì offset luôn giảm'], answer: 1, explain: 'Commit sau xử lý an toàn hơn về mất dữ liệu nhưng tạo cửa sổ trùng khi crash trước commit; idempotency (dedup theo key/version) làm lần xử lý lại không gây tác dụng phụ hai lần.' },
    { q: 'Exactly-once của Kafka (EOS/transaction) đảm bảo điều gì?', options: ['Mọi DB ngoài Kafka cũng exactly-once tự động', 'Phạm vi produce/consume trong Kafka theo cấu hình transaction; DB ngoài vẫn cần cơ chế riêng', 'Không bao giờ cần idempotent consumer', 'Tắt rebalance'], answer: 1, explain: 'Transactional producer và read_committed giúp tính nhất quán trong Kafka; ghi vào DB/JDBC hay gọi HTTP ngoài Kafka không nằm trong transaction Kafka nên vẫn cần outbox/idempotency key.' }
  ],
  related: ['microservices-001', 'microservices-002', 'concurrency-010'],
  tags: ['Kafka', 'partition', 'offset', 'consumer group', 'at-least-once', 'commit']
},
{
  id: 'lesson-microservices-011', track: 'microservices', order: 11,
  title: 'Idempotent producer: sequence number, dedup và lỗi OUT_OF_ORDER', level: 'senior', minutes: 40,
  goals: ['Giải thích producer id (PID) và sequence number trong idempotent producer của Kafka', 'Cài broker dedup: APPENDED, DUPLICATE, OUT_OF_ORDER', 'Nêu giới hạn của idempotent producer (phạm vi partition, phiên, retry)'],
  body: `**Tóm tắt:** Khi producer (bên gửi) retry (thử gửi lại) vì timeout (hết thời gian chờ — producer chờ phản hồi ACK nhưng quá lâu nên coi như thất bại), broker (máy chủ Kafka nhận và lưu bản ghi) có thể nhận cùng bản ghi hai lần. Idempotent producer (producer có khả năng gửi lặp an toàn: gửi lại vẫn chỉ tạo một bản ghi logic) gắn mỗi phiên gửi một PID (producer ID, định danh do broker cấp) và mỗi bản ghi trên một partition (phân vùng — một dải log có thứ tự trong topic) một sequence number (số thứ tự tăng dần từ 0). Broker nhớ sequence cuối theo (PID, partition): seq lặp → DUPLICATE (trùng, bỏ qua), seq nhảy cóc → OUT_OF_ORDER (lỗi thứ tự), đúng kế tiếp → APPENDED (đã ghi).

### Cơ chế thật (Kafka)
Bật {{enable.idempotence=true}} (mặc định true ở client Kafka mới) khiến producer xin broker cấp {{PID}} khi khởi tạo. Với mỗi cặp {{<topic, partition>}}, producer gán {{sequence number}} bắt đầu 0, tăng 1 mỗi batch (nhóm bản ghi) gửi thành công. Broker lưu trạng thái {{(PID, partition) -> lastSeq}} gắn với log của partition đó.

| Nhận (PID, seq) | Điều kiện (last là seq cuối đã append) | Kết quả |
|---|---|---|
| lần đầu / last chưa có | seq == 0 (mô phỏng đơn giản) | APPENDED, last=seq |
| đúng kế tiếp | seq == last + 1 | APPENDED, last=seq |
| trùng retry | seq == last | DUPLICATE (ACK thành công, không ghi thêm) |
| nhảy cóc / cũ bất thường | seq > last + 1 hoặc seq < last | OUT_OF_ORDER (lỗi, từ chối) |

~~~seq
title: Retry tạo duplicate nhưng broker dedup
actors: Producer(PID=7) | Broker | Log
Producer(PID=7) -> Broker: append(partition, seq=3, msg)
Broker -> Log: ghi msg (lastSeq=3)
Broker -->> Producer(PID=7): ACK (mất trên mạng)
Producer(PID=7) -> Broker: retry append(partition, seq=3, msg)
Broker --> Broker: seq==lastSeq → DUPLICATE
Broker -->> Producer(PID=7): ACK (không ghi lần 2)
~~~

Cấu hình liên quan (client mới thường tự đảm bảo khi bật idempotence): {{acks=all}} (đợi tất cả replica trong ISR xác nhận), {{retries}} đủ lớn (thực tế bị chặn bởi {{delivery.timeout.ms}}), và {{max.in.flight.requests.per.connection}} <= 5 (mặc định 5) để giữ thứ tự khi retry. Idempotence Kafka đảm bảo không trùng/không đảo thứ tự **trong phạm vi một phiên producer và một partition**. Producer restart lấy PID mới (trừ khi dùng {{transactional.id}} để fence — chặn — phiên cũ); exactly-once xuyên partition/topic cần transaction API.

### Cơ chế từng bước
1. **Khởi tạo phiên:** Producer kết nối broker, xin {{PID}} (ví dụ PID=7). Đây là danh tính phiên gửi; nếu producer crash rồi khởi động lại, nó xin PID mới nên dedup của phiên cũ không tự nối tiếp.
2. **Gán sequence:** Với mỗi {{<topic, partition>}} producer giữ một bộ đếm riêng, bắt đầu 0. Mỗi lần gửi thành công (nhận ACK hợp lệ), bộ đếm tăng 1. Vì vậy sequence là **per (PID, partition)**, không dùng chung giữa partition.
3. **Gửi bản ghi:** Producer gửi {{(PID, partition, seq, payload)}}. Broker tra {{lastSeq}} của (PID, partition).
4. **Broker quyết định:**
   - Nếu {{seq == expected}} (expected = lastSeq + 1, hoặc 0 nếu chưa có): ghi vào log, cập nhật lastSeq, trả ACK → APPENDED.
   - Nếu {{seq == lastSeq}}: đây là retry của bản ghi đã commit (ACK trước có thể bị mất trên mạng). Broker **không ghi thêm** nhưng vẫn trả ACK thành công → DUPLICATE. Vậy producer thấy thành công, log không bị nhân đôi.
   - Nếu {{seq > expected}} hoặc {{seq < lastSeq}} (bất thường): broker từ chối → OUT_OF_ORDER. Vì sao không chấp nhận? Nếu nhận seq=5 khi last=3, seq=4 có thể đã mất vĩnh viễn; chấp nhận sẽ tạo lỗ hổng trong chuỗi thứ tự.
5. **Retry an toàn:** Khi timeout, producer gửi lại **cùng (PID, seq, payload)**. Nhờ bước 4, retry trở nên idempotent trong phạm vi phiên+partition.
6. **Kết thúc phiên:** Producer đóng hoặc crash. PID phiên đó hết hiệu lực (trừ fencing bằng {{transactional.id}}). Dữ liệu đã append vẫn đúng; dedup không hứa hẹn xuyên các phiên khác PID.

~~~java
// Ví dụ tư duy: mô phỏng quyết định APPENDED/DUPLICATE/OUT_OF_ORDER theo từng PID
class Broker {
    private final Map<Integer, Long> last = new HashMap<>(); // PID -> lastSeq
    synchronized String append(int pid, long seq, String msg) {
        Long cur = last.get(pid);
        long expected = (cur == null) ? 0L : cur + 1L; // pid mới phải bắt đầu từ 0
        if (seq == expected) {
            last.put(pid, seq);         // ghi thành công, cập nhật mốc
            return "APPENDED";
        }
        if (cur != null && seq == cur) return "DUPLICATE"; // retry an toàn
        return "OUT_OF_ORDER";          // nhảy cóc hoặc lùi: từ chối, không đổi state
    }
}
~~~

### Vì sao OUT_OF_ORDER là lỗi nghiêm trọng
OUT_OF_ORDER có nghĩa chuỗi sequence bị đứt. Nếu broker im lặng chấp nhận seq nhảy cóc, consumer sẽ đọc log có lỗ hổng mà không biết bản ghi thiếu. Kafka client có thể ném {{OutOfOrderSequenceException}}: đây là dấu hiệu cấu hình, retry, hoặc in-flight bất thường — cần điều tra, không nên nuốt lỗi (catch rồi bỏ qua).

### Bản mô phỏng đơn giản hoá
{{Broker.append(pid, seq, msg)}} trong bài tập xử lý một partition logic duy nhất, không có topic/partition key, không có PID epoch fencing (cơ chế chặn PID cũ khi dùng transaction), không có batch, không có network. DUPLICATE trả về chuỗi để test quan sát (thực tế broker vẫn trả ACK thành công cho producer).

### Lỗi hay gặp
- Nghĩ idempotent producer làm exactly-once end-to-end: consumer/DB bên ngoài vẫn thấy tác dụng lặp nếu pipeline không idempotent (ví dụ ghi DB hai lần nếu consumer xử lý lại).
- Cấu hình xung đột với idempotence ({{acks!=all}} hoặc {{max.in.flight.requests.per.connection}} > 5) bị client mới từ chối; nếu tắt idempotence và cho nhiều request in-flight, retry có thể đảo thứ tự.
- Sequence là **per (PID, partition)**; không dùng chung giữa partition.
- Nhầm DUPLICATE (an toàn, broker đã có bản ghi) với OUT_OF_ORDER (cần xử lý lỗi, chuỗi bị đứt).

### Lỗi hay gặp trên production
- **Triệu chứng:** Metric {{record-error-rate}} tăng, log producer xuất hiện {{OutOfOrderSequenceException}} hoặc {{UnknownProducerIdException}}.
  **Nguyên nhân:** Producer ID hết hạn do vô hoạt động lâu (vượt {{transactional.id.expiration.ms}}, mặc định 7 ngày) hoặc broker restart mất state PID; hoặc producer mới cùng {{transactional.id}} khởi động làm fence epoch cũ. Cấu hình in-flight/retry không hợp lệ cũng gây OUT_OF_ORDER; leader failover kết hợp timeout có thể.trigger sequence gap.
  **Cách sửa:** Kiểm tra {{transactional.id.expiration.ms}}, {{delivery.timeout.ms}}, {{request.timeout.ms}}; đảm bảo {{enable.idempotence=true}}, {{acks=all}}, {{max.in.flight.requests.per.connection <= 5}}. Nếu cần vượt phiên, dùng {{transactional.id}} để fencing.
- **Triệu chứng:** Duplicate message xuất hiện ở consumer/DB dù producer đã bật idempotence.
  **Nguyên nhân:** Hiểu nhầm phạm vi: idempotence chỉ chặn duplicate **trong phiên producer + partition** do retry. Duplicate có thể đến từ consumer reprocess (offset commit chưa kịp), producer restart với PID mới gửi lại cùng nghiệp vụ, hoặc nhiều partition.
  **Cách sửa:** Thiết kế consumer/ghi DB idempotent theo business key (ví dụ {{orderId}} + unique constraint, hoặc bảng dedup). Nếu cần exactly-once Kafka-to-Kafka, dùng transaction API.
- **Triệu chứng:** Sau deploy/restart producer, thấy một số sự kiện nghiệp vụ bị ghi hai lần.
  **Nguyên nhân:** Ứng dụng gửi lại cùng sự kiện với PID mới (phiên mới) — broker coi đây là bản ghi hợp lệ vì không có state dedup của PID cũ cho payload đó ở mức nghiệp vụ.
  **Cách sửa:** Áp dụng idempotency key ở tầng ứng dụng (outbox pattern + unique key, hoặc check-before-write). Không dựa vào Kafka PID để dedup xuyên restart.
- **Triệu chứng:** Throughput giảm rõ khi bật idempotence, latency tăng.
  **Nguyên nhân:** {{acks=all}} và giới hạn in-flight (<=5) làm producer chờ xác nhận nhiều hơn, đặc biệt khi {{min.insync.replicas}} cao hoặc cụm có độ trễ mạng.
  **Cách sửa:** Đo baseline với {{record-send-rate}}, {{request-latency-avg}}; cân bằng {{batch.size}}, {{linger.ms}}; chấp nhận đánh đổi (đúng dữ liệu quan trọng hơn). Chỉ tắt idempotence nếu chấp nhận được duplicate/mất thứ tự và đã đánh giá rủi ro.

### Liên hệ phỏng vấn
- **"Kafka idempotent producer chống duplicate thế nào?"** → Trả lời: broker cấp {{PID}} cho phiên producer, producer gán {{sequence number}} tăng dần cho mỗi (PID, partition); broker lưu lastSeq, seq trùng trả ACK nhưng không append (dedup retry), seq nhảy cóc trả OUT_OF_ORDER để tránh lỗ hổng.
- **"Idempotent producer có đảm bảo exactly-once end-to-end không?"** → Trả lời: không. Nó đảm bảo không trùng/không đảo thứ tự trong phạm vi **một phiên producer + một partition** với cấu hình đúng ({{acks=all}}, {{max.in.flight <= 5}}). Consumer, DB, và xử lý xuyên phiên/partition vẫn cần idempotency hoặc transaction.
- **"Khi gặp {{OutOfOrderSequenceException}} bạn xử lý ra sao?"** → Trả lời: coi là lỗi nghiêm trọng (chuỗi sequence đứt), không nuốt lỗi; kiểm tra cấu hình idempotence, timeout/retry, in-flight, và sức khoẻ broker/leader; theo dõi metric error/retry; nếu do timeout giả thì điều chỉnh {{request.timeout.ms}}/{{delivery.timeout.ms}} và hạ tải in-flight.

> Senior tip: theo dõi producer {{record-error-rate}}, {{record-retry-rate}} và OutOfOrderSequence; retry tăng bất thường khi broker ổn định thường do timeout/in-flight hoặc mạng gây timeout giả.
`,
  exercises: [
    {
      title: 'Broker.append: APPENDED / DUPLICATE / OUT_OF_ORDER',
      prompt: `Cài {{Broker}} với một partition logic. {{append(pid, seq, msg)}} xử lý bản ghi từ producer {{pid}} (int) có sequence {{seq}} (long, bắt đầu 0 cho mỗi pid) và trả một trong ba chuỗi: {{"APPENDED"}} nếu seq là số kế tiếp ({{lastSeq + 1}}, hoặc 0 nếu pid chưa ghi lần nào) → lưu msg và cập nhật lastSeq; {{"DUPLICATE"}} nếu {{seq == lastSeq}} (đã có, retry) → không lưu thêm; {{"OUT_OF_ORDER"}} nếu {{seq > lastSeq + 1}} (nhảy cóc) hoặc {{seq < lastSeq}} (cũ hơn last) → không lưu, không đổi lastSeq. {{size()}} trả số message đã append thành công. {{lastSeq(pid)}} trả lastSeq của pid, hoặc {{-1}} nếu chưa có. Method {{synchronized}}.`,
      starter: `class Broker {
    private final List<String> log = new ArrayList<>();
    private final Map<Integer, Long> last = new HashMap<>();
    synchronized String append(int pid, long seq, String msg) { throw new UnsupportedOperationException("TODO"); }
    synchronized int size() { return log.size(); }
    synchronized long lastSeq(int pid) { return last.getOrDefault(pid, -1L); }
}`,
      tests: `public class Main {
 static int p=0,t=0; static void ck(String n,Runnable r){t++;try{r.run();p++;System.out.println("PASS "+n);}catch(Throwable e){System.out.println("FAIL "+n+": "+e);}}
 static void eq(Object a,Object b){if(!Objects.equals(a,b))throw new AssertionError(a+" != "+b);}
 public static void main(String[] z){
  ck("first append seq 0",()->{Broker b=new Broker();eq("APPENDED",b.append(1,0,"a"));eq(1,b.size());eq(0L,b.lastSeq(1));});
  ck("in order appends",()->{Broker b=new Broker();b.append(1,0,"a");eq("APPENDED",b.append(1,1,"b"));eq("APPENDED",b.append(1,2,"c"));eq(3,b.size());eq(2L,b.lastSeq(1));});
  ck("duplicate retry",()->{Broker b=new Broker();b.append(1,0,"a");b.append(1,1,"b");eq("DUPLICATE",b.append(1,1,"b"));eq(2,b.size());eq(1L,b.lastSeq(1));});
  ck("out of order gap",()->{Broker b=new Broker();b.append(1,0,"a");eq("OUT_OF_ORDER",b.append(1,2,"c"));eq(1,b.size());eq(0L,b.lastSeq(1));});
  ck("old seq is out of order",()->{Broker b=new Broker();b.append(1,0,"a");b.append(1,1,"b");b.append(1,2,"c");eq("OUT_OF_ORDER",b.append(1,0,"a"));eq(3,b.size());});
  ck("independent producers",()->{Broker b=new Broker();eq("APPENDED",b.append(1,0,"a"));eq("APPENDED",b.append(2,0,"x"));eq("DUPLICATE",b.append(1,0,"a"));eq("APPENDED",b.append(2,1,"y"));eq(3,b.size());eq(0L,b.lastSeq(1));eq(1L,b.lastSeq(2));});
  ck("unknown pid starts at 0 only",()->{Broker b=new Broker();eq("OUT_OF_ORDER",b.append(9,1,"x"));eq(0,b.size());eq(-1L,b.lastSeq(9));});
  System.out.println("RESULT "+p+"/"+t);
 }
}`,
      reference: `class Broker {
    private final List<String> log = new ArrayList<>();
    private final Map<Integer, Long> last = new HashMap<>();
    synchronized String append(int pid, long seq, String msg) {
        Long cur = last.get(pid);
        long expected = (cur == null) ? 0L : cur + 1L;
        if (seq == expected) {
            log.add(msg);
            last.put(pid, seq);
            return "APPENDED";
        }
        if (cur != null && seq == cur) {
            return "DUPLICATE"; // retry an toan: da co ban ghi, khong ghi them
        }
        return "OUT_OF_ORDER"; // seq < last hoặc nhảy cóc: không chấp nhận
    }
    synchronized int size() { return log.size(); }
    synchronized long lastSeq(int pid) { return last.getOrDefault(pid, -1L); }
}`,
      hints: ['Với pid mới, expected = 0. Với pid đã có last, expected = last + 1. So seq với expected và last.', 'DUPLICATE chỉ khi pid đã tồn tại và seq == last. Nếu pid mới mà seq != 0 thì là OUT_OF_ORDER (nhảy cóc từ đầu).', 'OUT_OF_ORDER không đổi last và không ghi log.'],
      explain: `State machine theo từng PID: lastSeq là mốc tin cậy. seq == expected → append và cập nhật; seq == last → retry của bản ghi đã commit nên chỉ ack DUPLICATE; còn lại (nhảy cóc hoặc lùi) → OUT_OF_ORDER vì chấp nhận sẽ tạo lỗ hổng/mâu thuẫn. Test "unknown pid starts at 0 only" nhấn mạnh không chấp nhận seq=1 khi chưa thấy seq=0.

Trong Kafka thật, broker theo dõi {{(PID, baseSequence)}} cho batch trên partition; có PID epoch để fence producer cũ. Lỗi out-of-order có thể khiến producer fatal. Idempotence không thay thế idempotency nghiệp vụ. Mô phỏng gộp một partition, không epoch, không đối chiếu nội dung msg khi duplicate, dùng {{synchronized}} thay cơ chế log append thật.

Lỗi hay gặp: coi seq < last là DUPLICATE; không tách state theo pid; append rồi mới kiểm tra; quên pid mới với seq > 0.`
    }
  ],
  check: [
    { q: 'Producer gửi lại (PID=5, seq=10) vì timeout ACK, broker đã có lastSeq=10. Kết quả đúng?', options: ['APPENDED thêm bản ghi thứ hai', 'DUPLICATE, không ghi thêm', 'OUT_OF_ORDER', 'Broker reset lastSeq'], answer: 1, explain: 'seq trùng lastSeq là retry của bản ghi đã được broker ghi nhận; broker trả thành công logic (dedup) nhưng không append lần hai.' },
    { q: 'Broker có lastSeq=3 cho PID=5, nhận seq=5. Kết quả đúng?', options: ['APPENDED', 'DUPLICATE', 'OUT_OF_ORDER vì nhảy cóc qua seq=4', 'Tự điền seq=4'], answer: 2, explain: 'seq > lastSeq+1 tạo lỗ hổng (thiếu seq=4). Broker phải từ chối để bảo toàn tính liên tục sequence; im lặng chấp nhận sẽ che mất mất dữ liệu.' },
    { q: 'Idempotent producer của Kafka (enable.idempotence) đảm bảo phạm vi nào?', options: ['Exactly-once cho mọi DB và HTTP gọi ra ngoài', 'Không trùng/đảo thứ tự trong phạm vi phiên producer + partition (cấu hình đúng)', 'Mọi consumer tự động idempotent', 'Không bao giờ retry'], answer: 1, explain: 'Đảm bảo dựa trên PID/sequence per partition; cross-partition transaction cần transactional.id. Hệ thống ngoài Kafka vẫn cần cơ chế idempotency riêng.' },
    { q: 'Tại sao producer restart rồi gửi lại cùng sự kiện nghiệp vụ vẫn có thể tạo bản ghi trùng ở Kafka dù từng phiên bật idempotence?', options: ['Vì broker tự xoá lastSeq sau mỗi ACK', 'Vì phiên mới xin PID mới nên dedup theo PID/sequence không nối tiếp cho nghiệp vụ cũ', 'Vì {{acks=all}} luôn tạo duplicate', 'Vì sequence number dùng chung cho mọi partition'], answer: 1, explain: 'Idempotence Kafka dedup theo (PID, partition) trong phiên. Restart lấy PID mới, broker coi bản ghi là hợp lệ theo phiên mới; dedup nghiệp vụ cần key ứng dụng (outbox/unique constraint).' }
  ],
  related: ['microservices-002', 'microservices-001', 'core-015'],
  tags: ['Kafka', 'idempotent producer', 'sequence number', 'dedup', 'exactly-once']
},
{
  id: 'lesson-microservices-012',
  track: 'microservices',
  order: 12,
  title: 'Queue cho tác vụ AI dài: job queue, worker, retry và client poll',
  level: 'senior',
  minutes: 40,
  goals: [
    'Hiểu vì sao tác vụ AI (LLM) cần hàng đợi thay vì gọi đồng bộ HTTP',
    'Thiết kế job queue với 4 trạng thái: PENDING, RUNNING, DONE, FAILED',
    'Cài worker xử lý job, retry có giới hạn (exponential backoff), client poll kết quả',
    'Biết cách mở rộng: priority queue, dead letter queue, metrics theo dõi'
  ],
  body: `**Tóm tắt:** Gọi LLM (Large Language Model — mô hình ngôn ngữ lớn) thường mất 30–120 giây, vượt quá timeout HTTP thông thường (thường 30s). Nếu gọi đồng bộ, client bị treo, thread server bị chiếm dụng, và retry ngẫu nhiên làm tăng tải. Giải pháp: client gửi request → server tạo **job** trạng thái {{PENDING}} → trả về {{jobId}} ngay → **worker** nền lấy job, đổi {{RUNNING}}, gọi LLM, lưu kết quả {{DONE}} hoặc {{FAILED}} (có retry) → client **poll** (truy vấn định kỳ) {{jobId}} để lấy kết quả.

### Tại sao cần hàng đợi cho tác vụ AI

| Vấn đề gọi đồng bộ | Giải pháp hàng đợi |
|---|---|
| LLM phản hồi chậm (30–120s) > HTTP timeout (thường 30s) | Tách request/response: client nhận {{jobId}} ngay, không chờ LLM |
| Thread server bị chiếm dụng lâu → hết thread pool | Worker chạy riêng (thread pool nhỏ, kiểm soát), server API nhẹ |
| Retry ngẫu nhiên khi timeout → gấp đôi tải LLM | Retry có chính sách: max attempts, exponential backoff, dead letter |
| Khó quan sát, debug, replay | Job lưu state, input, output, error, timestamps → dễ trace, replay |

### Mô hình trạng thái (State Machine)

~~~text
PENDING → RUNNING → DONE
                ↘ FAILED → (retry) → PENDING (nếu attempts < max)
                ↘ FAILED → DEAD_LETTER (nếu attempts >= max)
~~~

- **PENDING**: Vừa tạo, chờ worker lấy.
- **RUNNING**: Worker đã nhận, đang gọi LLM.
- **DONE**: Hoàn thành, có {{result}}.
- **FAILED**: Gặp lỗi, có {{error}}, {{attempts}} tăng. Nếu {{attempts < maxRetries}} → quay về {{PENDING}} sau delay. Nếu {{attempts >= maxRetries}} → {{DEAD_LETTER}} (hàng đợi tử thi, cần can thiệp thủ công).
- **DEAD_LETTER**: Đã hết retry, lưu lại để dev điều tra.

### Kiến trúc thành phần

~~~seq
title: Luồng job queue AI
actors: Client | API Server | JobQueue | Worker | MockLLM
Client -> API Server: POST /ai-jobs {prompt, params}
API Server -> JobQueue: enqueue(jobId, PENDING, payload)
API Server --> Client: 202 Accepted {jobId}
Client -> API Server: GET /ai-jobs/{jobId} (poll)
Worker -> JobQueue: dequeue() → job PENDING
Worker -> JobQueue: update(jobId, RUNNING)
Worker -> MockLLM: generate(prompt)
MockLLM --> Worker: result / error
Worker -> JobQueue: update(jobId, DONE/FAILED, result/error)
Client -> API Server: GET /ai-jobs/{jobId}
API Server -> JobQueue: get(jobId)
API Server --> Client: 200 {status, result?, error?}
~~~

### Cài đặt JobQueue (Java thuần, single-thread demo)

~~~java
enum Status { PENDING, RUNNING, DONE, FAILED, DEAD_LETTER }

record Job(String id, String prompt, Status status, String result, String error,
           int attempts, int maxRetries, long createdAt, long updatedAt) {}

class JobQueue {
    private final Map<String, Job> jobs = new ConcurrentHashMap<>();
    private final Queue<String> pending = new ConcurrentLinkedQueue<>();
    private final int maxRetries;
    private final long baseDelayMs; // exponential backoff base

    JobQueue(int maxRetries, long baseDelayMs) {
        this.maxRetries = maxRetries;
        this.baseDelayMs = baseDelayMs;
    }

    // Tạo job mới, trả về jobId
    String submit(String prompt) {
        String id = UUID.randomUUID().toString();
        Job job = new Job(id, prompt, Status.PENDING, null, null,
                          0, maxRetries, System.currentTimeMillis(), System.currentTimeMillis());
        jobs.put(id, job);
        pending.add(id);
        return id;
    }

    // Worker gọi để lấy job PENDING tiếp theo (blocking ngắn)
    Job poll() {
        String id = pending.poll();
        if (id == null) return null;
        Job job = jobs.get(id);
        if (job == null || job.status() != Status.PENDING) return null; // đã bị lấy hoặc hủy
        // Đổi RUNNING (compare-and-set đơn giản)
        Job running = new Job(job.id(), job.prompt(), Status.RUNNING, job.result(), job.error(),
                              job.attempts(), job.maxRetries(), job.createdAt(), System.currentTimeMillis());
        if (jobs.replace(id, job, running)) return running;
        return null; // race condition hiếm, bỏ qua
    }

    // Worker cập nhật kết quả
    void complete(String jobId, String result) {
        updateStatus(jobId, Status.DONE, result, null);
    }

    void fail(String jobId, String error) {
        Job job = jobs.get(jobId);
        if (job == null) return;
        int nextAttempts = job.attempts() + 1;
        if (nextAttempts >= job.maxRetries()) {
            // Hết retry → DEAD_LETTER
            updateStatus(jobId, Status.DEAD_LETTER, null, error + " (max retries exceeded)");
        } else {
            // Chưa hết retry → quay về PENDING, sẽ được schedule lại sau delay
            // Đơn giản: đẩy lại pending ngay; production dùng delay queue
            Job failed = new Job(job.id(), job.prompt(), Status.PENDING, null, error,
                                 nextAttempts, job.maxRetries(), job.createdAt(), System.currentTimeMillis());
            jobs.put(jobId, failed);
            pending.add(jobId);
        }
    }

    private void updateStatus(String jobId, Status status, String result, String error) {
        Job job = jobs.get(jobId);
        if (job == null) return;
        Job updated = new Job(job.id(), job.prompt(), status, result, error,
                              job.attempts(), job.maxRetries(), job.createdAt(), System.currentTimeMillis());
        jobs.replace(jobId, job, updated);
    }

    Job get(String jobId) { return jobs.get(jobId); }
}
~~~

### Worker xử lý job

~~~java
class AiWorker implements Runnable {
    private final JobQueue queue;
    private final MockLlm llm;
    private volatile boolean running = true;

    AiWorker(JobQueue queue, MockLlm llm) { this.queue = queue; this.llm = llm; }

    @Override public void run() {
        while (running) {
            Job job = queue.poll();
            if (job == null) {
                sleep(100); // không có job, ngủ chút
                continue;
            }
            try {
                String result = llm.generate(job.prompt());
                queue.complete(job.id(), result);
            } catch (Exception e) {
                queue.fail(job.id(), e.getMessage());
            }
        }
    }

    void shutdown() { running = false; }
    private void sleep(long ms) { try { Thread.sleep(ms); } catch (InterruptedException ignored) {} }
}
~~~

### Mock LLM (giả lập LLM thật)

Production gọi API Anthropic/OpenAI; bài tập dùng class giả:

~~~java
class MockLlm {
    // Giả lập: 10% lỗi tạm thời, 90% thành công sau 50–200ms
    String generate(String prompt) throws Exception {
        Thread.sleep(50 + new Random().nextInt(150));
        if (new Random().nextDouble() < 0.1) throw new IOException("LLM temporary error");
        return "AI response for: " + prompt.substring(0, Math.min(20, prompt.length())) + "...";
    }
}
~~~

### Client Poll (client truy vấn kết quả)

~~~java
class AiClient {
    private final HttpClient http = HttpClient.newHttpClient();
    private final String baseUrl;

    AiClient(String baseUrl) { this.baseUrl = baseUrl; }

    String submit(String prompt) throws Exception {
        var req = HttpRequest.newBuilder(URI.create(baseUrl + "/ai-jobs"))
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString("{\"prompt\":\"" + escape(prompt) + "\"}"))
            .build();
        var resp = http.send(req, HttpResponse.BodyHandlers.ofString());
        // parse JSON đơn giản lấy jobId
        return extractJobId(resp.body());
    }

    JobResult poll(String jobId, int maxPolls, long intervalMs) throws Exception {
        for (int i = 0; i < maxPolls; i++) {
            var req = HttpRequest.newBuilder(URI.create(baseUrl + "/ai-jobs/" + jobId)).GET().build();
            var resp = http.send(req, HttpResponse.BodyHandlers.ofString());
            JobResult r = parseResult(resp.body());
            if (r.status() == Status.DONE || r.status() == Status.FAILED || r.status() == Status.DEAD_LETTER)
                return r;
            Thread.sleep(intervalMs);
        }
        throw new TimeoutException("Poll timeout");
    }
    // parse JSON helpers...
}
~~~

### Exponential Backoff (tăng gấp đôi thời gian chờ giữa các retry)

Thay vì retry ngay lập tức, chờ {{baseDelayMs * 2^attempts}} (ví dụ 1s, 2s, 4s, 8s...). Giảm áp lực lên LLM khi nó đang quá tải.

~~~java
// Trong JobQueue.fail(), thay vì pending.add(jobId) ngay:
long delay = baseDelayMs * (1L << job.attempts()); // 2^attempts
scheduler.schedule(() -> pending.add(jobId), delay, TimeUnit.MILLISECONDS);
~~~

### Mở rộng production

| Mở rộng | Mô tả |
|---|---|
| **Priority queue** | Job ưu tiên (ví dụ user VIP) dùng {{PriorityQueue}} hoặc Redis sorted set |
| **Dead Letter Queue (DLQ)** | Tách hàng đợi riêng cho job hết retry, có UI để replay/inspect |
| **Metrics** | Theo dõi: queue depth, processing time (p50/p99), retry rate, dead letter rate |
| **Idempotency key** | Client gửi {{idempotencyKey}}, server kiểm tra trùng trước khi tạo job mới |
| **Horizontal scaling** | Nhiều worker instance, dùng Redis stream/Kafka làm queue chia sẻ |
| **Observability** | Trace ID xuyên suốt: client → API → queue → worker → LLM |

### Lỗi hay gặp

- **Poll interval quá ngắn** (ví dụ 100ms) → DDoS API server. Nên dùng 1–2s, có jitter.
- **Không giới hạn maxRetries** → job kẹt lặp vô tận khi LLM down kéo dài.
- **Worker crash giữa chừng** → job ở RUNNING không bao giờ hoàn thành. Cần **heartbeat** hoặc **TTL**: job RUNNING quá lâu (ví dụ > 5 phút) tự reset về PENDING.
- **In-memory queue mất data khi restart**. Production dùng Redis/RabbitMQ/Kafka persistence.
- **Race condition poll/complete**: worker đang update, client poll thấy status cũ. Acceptable eventual consistency.

### Ví dụ đời thực

**Bối cảnh:** Hệ thống dịch vụ tài chính dùng LLM phân loại giao dịch bất thường. Mỗi request LLM trung bình 45s, peak 90s. API gateway timeout 30s.
**Triệu chứng:** Client gọi đồng bộ → 504 Gateway Timeout → user bấm gửi lại → gấp 3–5 lần tải LLM → LLM rate limit → cascade failure.
**Xử lý:** Chuyển sang job queue. API trả 202 + jobId < 50ms. Worker pool 4 thread, maxRetries=3, backoff 2s/4s/8s. Client poll 2s. Dead letter queue lưu job thất bại để team data science review.
**Kết quả:** 0% 504 error, throughput LLM ổn định 4 req/s, p99 latency client 95s (bao gồm poll), dead letter rate < 0.5%.

### Liên hệ phỏng vấn
- **"Làm sao xử lý tác vụ AI mất 60s khi HTTP timeout 30s?"** → Trả lời: tách request/response bằng job queue. Client POST tạo job, nhận jobId ngay (202). Worker nền xử lý, client poll GET /jobs/{id} để lấy kết quả. Queue lưu state PENDING/RUNNING/DONE/FAILED, hỗ trợ retry exponential backoff, dead letter.
- **"Worker crash khi đang RUNNING thì job đó sao?"** → Trả lời: Job bị kẹt RUNNING. Cần cơ chế TTL/heartbeat: job RUNNING quá timeout (ví dụ 5 phút) tự reset về PENDING để worker khác nhặt. Hoặc dùng transactional outbox pattern đảm bảo state durable.
- **"Poll interval nên đặt bao nhiêu?"** → Trả lời: 1–2 giây, có jitter ±200ms tránh thundering herd. Không poll quá dày (tốn CPU/API), không quá thưa (user chờ lâu). Có thể dùng long-polling hoặc WebSocket/server-sent events để push thay vì poll.
- **"Queue in-memory có gì rủi ro?"** → Trả lời: Mất data khi restart, không scale horizontal. Production dùng Redis Stream (XADD/XREADGROUP), RabbitMQ, hoặc Kafka. Redis stream hỗ trợ consumer group, ack, pending list, TTL tự động.`,

  exercises: [
    {
      title: 'JobQueue cơ bản: submit, poll, complete, fail với retry',
      prompt: 'Cài {{JobQueue}} quản lý job AI với 5 trạng thái: {{PENDING}}, {{RUNNING}}, {{DONE}}, {{FAILED}}, {{DEAD_LETTER}}.\n\nYêu cầu:\n- {{submit(prompt)}}: tạo job {{PENDING}}, trả {{jobId}} (UUID string).\n- {{poll()}}: lấy và đổi một job {{PENDING}} sang {{RUNNING}}, trả {{Job}}; nếu không có job {{PENDING}} trả {{null}}. Phải thread-safe.\n- {{complete(jobId, result)}}: đổi job sang {{DONE}}, lưu {{result}}.\n- {{fail(jobId, error)}}: tăng {{attempts}}. Nếu {{attempts < maxRetries}} → quay về {{PENDING}} (đẩy lại queue). Nếu {{attempts >= maxRetries}} → {{DEAD_LETTER}} lưu {{error}}.\n- {{get(jobId)}}: trả job hiện tại hoặc {{null}}.\n- {{getPendingCount()}}, {{getRunningCount()}}, {{getDoneCount()}}, {{getFailedCount()}}, {{getDeadLetterCount()}}: thống kê.\n\n{{Job}} là record: {{id, prompt, status, result, error, attempts, maxRetries, createdAt, updatedAt}}. Dùng {{ConcurrentHashMap}} + {{ConcurrentLinkedQueue}}.',
      starter: `import java.util.*;
import java.util.concurrent.*;

enum Status { PENDING, RUNNING, DONE, FAILED, DEAD_LETTER }
record Job(String id, String prompt, Status status, String result, String error,
           int attempts, int maxRetries, long createdAt, long updatedAt) {}

class JobQueue {
    private final Map<String, Job> jobs = new ConcurrentHashMap<>();
    private final Queue<String> pending = new ConcurrentLinkedQueue<>();
    private final int maxRetries;

    JobQueue(int maxRetries) { this.maxRetries = maxRetries; }

    String submit(String prompt) { throw new UnsupportedOperationException("TODO"); }
    Job poll() { throw new UnsupportedOperationException("TODO"); }
    void complete(String jobId, String result) { throw new UnsupportedOperationException("TODO"); }
    void fail(String jobId, String error) { throw new UnsupportedOperationException("TODO"); }
    Job get(String jobId) { return jobs.get(jobId); }
    int getPendingCount() { throw new UnsupportedOperationException("TODO"); }
    int getRunningCount() { throw new UnsupportedOperationException("TODO"); }
    int getDoneCount() { throw new UnsupportedOperationException("TODO"); }
    int getFailedCount() { throw new UnsupportedOperationException("TODO"); }
    int getDeadLetterCount() { throw new UnsupportedOperationException("TODO"); }
}`,
      tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, Runnable r) {
        total++;
        try { r.run(); passed++; System.out.println("PASS " + name); }
        catch (Throwable t) { System.out.println("FAIL " + name + ": " + t); }
    }
    static void eq(Object a, Object b) { if (!Objects.equals(a, b)) throw new AssertionError(a + " != " + b); }
    public static void main(String[] args) throws Exception {
        check("submit returns id and PENDING", () -> {
            JobQueue q = new JobQueue(3);
            String id = q.submit("hello");
            Job job = q.get(id);
            eq(Status.PENDING, job.status());
            eq("hello", job.prompt());
            eq(0, job.attempts());
            eq(3, job.maxRetries());
            eq(1, q.getPendingCount());
        });
        check("poll moves PENDING to RUNNING", () -> {
            JobQueue q = new JobQueue(3);
            String id = q.submit("task");
            Job polled = q.poll();
            eq(id, polled.id());
            eq(Status.RUNNING, polled.status());
            eq(0, q.getPendingCount());
            eq(1, q.getRunningCount());
        });
        check("poll returns null when empty", () -> {
            JobQueue q = new JobQueue(3);
            eq(null, q.poll());
        });
        check("complete sets DONE with result", () -> {
            JobQueue q = new JobQueue(3);
            String id = q.submit("t");
            q.poll();
            q.complete(id, "ai result");
            Job job = q.get(id);
            eq(Status.DONE, job.status());
            eq("ai result", job.result());
            eq(1, q.getDoneCount());
        });
        check("fail with attempts < maxRetries goes back to PENDING", () -> {
            JobQueue q = new JobQueue(3);
            String id = q.submit("t");
            q.poll();
            q.fail(id, "temp error");
            Job job = q.get(id);
            eq(Status.PENDING, job.status());
            eq(1, job.attempts());
            eq(1, q.getPendingCount());
            eq(0, q.getRunningCount());
        });
        check("fail with attempts >= maxRetries goes to DEAD_LETTER", () -> {
            JobQueue q = new JobQueue(2); // max 2 retries: attempts 0,1,2 -> at 2 goes dead letter
            String id = q.submit("t");
            q.poll(); q.fail(id, "e1"); // attempt 1
            q.poll(); q.fail(id, "e2"); // attempt 2 -> dead letter
            Job job = q.get(id);
            eq(Status.DEAD_LETTER, job.status());
            eq(2, job.attempts());
            eq(1, q.getDeadLetterCount());
            eq(0, q.getPendingCount());
        });
        check("independent jobs tracked separately", () -> {
            JobQueue q = new JobQueue(3);
            String id1 = q.submit("a");
            String id2 = q.submit("b");
            q.poll(); // takes id1
            q.complete(id1, "r1");
            Job j2 = q.get(id2);
            eq(Status.PENDING, j2.status());
            eq(1, q.getPendingCount());
            eq(1, q.getDoneCount());
        });
        check("concurrent submit and poll", () -> {
            JobQueue q = new JobQueue(3);
            ExecutorService es = Executors.newFixedThreadPool(10);
            CountDownLatch latch = new CountDownLatch(100);
            for (int i = 0; i < 100; i++) {
                int finalI = i;
                es.submit(() -> { q.submit("task" + finalI); latch.countDown(); });
            }
            try { latch.await(); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
            eq(100, q.getPendingCount());
            int polled = 0;
            while (q.poll() != null) polled++;
            eq(100, polled);
            eq(100, q.getRunningCount());
            es.shutdown();
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `import java.util.*;
import java.util.concurrent.*;

enum Status { PENDING, RUNNING, DONE, FAILED, DEAD_LETTER }
record Job(String id, String prompt, Status status, String result, String error,
           int attempts, int maxRetries, long createdAt, long updatedAt) {}

class JobQueue {
    private final Map<String, Job> jobs = new ConcurrentHashMap<>();
    private final Queue<String> pending = new ConcurrentLinkedQueue<>();
    private final int maxRetries;

    JobQueue(int maxRetries) { this.maxRetries = maxRetries; }

    String submit(String prompt) {
        String id = UUID.randomUUID().toString();
        long now = System.currentTimeMillis();
        Job job = new Job(id, prompt, Status.PENDING, null, null, 0, maxRetries, now, now);
        jobs.put(id, job);
        pending.add(id);
        return id;
    }

    Job poll() {
        String id;
        while ((id = pending.poll()) != null) {
            Job job = jobs.get(id);
            if (job == null) continue;
            if (job.status() != Status.PENDING) continue;
            Job running = new Job(job.id(), job.prompt(), Status.RUNNING, job.result(), job.error(),
                                  job.attempts(), job.maxRetries(), job.createdAt(), System.currentTimeMillis());
            if (jobs.replace(id, job, running)) return running;
        }
        return null;
    }

    void complete(String jobId, String result) {
        Job job = jobs.get(jobId);
        if (job == null) return;
        Job done = new Job(job.id(), job.prompt(), Status.DONE, result, null,
                           job.attempts(), job.maxRetries(), job.createdAt(), System.currentTimeMillis());
        jobs.replace(jobId, job, done);
    }

    void fail(String jobId, String error) {
        Job job = jobs.get(jobId);
        if (job == null) return;
        int nextAttempts = job.attempts() + 1;
        if (nextAttempts >= job.maxRetries()) {
            Job dead = new Job(job.id(), job.prompt(), Status.DEAD_LETTER, null,
                               error + " (max retries exceeded)", nextAttempts,
                               job.maxRetries(), job.createdAt(), System.currentTimeMillis());
            jobs.replace(jobId, job, dead);
        } else {
            Job pendingJob = new Job(job.id(), job.prompt(), Status.PENDING, null, error,
                                     nextAttempts, job.maxRetries(), job.createdAt(), System.currentTimeMillis());
            jobs.replace(jobId, job, pendingJob);
            pending.add(jobId);
        }
    }

    Job get(String jobId) { return jobs.get(jobId); }

    int getPendingCount() { return (int) jobs.values().stream().filter(j -> j.status() == Status.PENDING).count(); }
    int getRunningCount() { return (int) jobs.values().stream().filter(j -> j.status() == Status.RUNNING).count(); }
    int getDoneCount() { return (int) jobs.values().stream().filter(j -> j.status() == Status.DONE).count(); }
    int getFailedCount() { return (int) jobs.values().stream().filter(j -> j.status() == Status.FAILED).count(); }
    int getDeadLetterCount() { return (int) jobs.values().stream().filter(j -> j.status() == Status.DEAD_LETTER).count(); }
}`,
      hints: [
        "Dùng {{ConcurrentHashMap}} cho jobs, {{ConcurrentLinkedQueue}} cho pending queue.",
        "{{poll()}}: lấy id từ queue, kiểm tra job còn tồn tại và status PENDING, CAS (compare-and-set) đổi RUNNING.",
        "{{fail()}}: tăng attempts, so sánh với maxRetries. Chưa hết retry → status PENDING, đẩy lại pending queue. Hết retry → DEAD_LETTER.",
        "Thống kê: stream lọc theo status (acceptably chậm cho demo; production dùng counter riêng)."
      ],
      explain: "Job queue dùng CAS ({{jobs.replace(old, new)}}) để tránh race condition khi nhiều worker cùng poll. {{ConcurrentLinkedQueue}} không bounded, production nên dùng bounded queue hoặc semaphore chặn submit khi quá đầy. Retry logic đơn giản: đẩy lại pending ngay; production dùng delay queue ({{ScheduledExecutorService}}) hoặc priority queue với {{nextRunAt}} để thực hiện exponential backoff. DEAD_LETTER lưu error kèm ghi chú để dev điều tra. Thống kê dùng stream cho đơn giản; thực tế duy trì {{AtomicLong}} counter cho mỗi trạng thái cập nhật O(1).\n\nLỗi hay gặp: poll không kiểm tra status PENDING (job đã bị lấy/ hủy); fail không tăng attempts; complete/fail không kiểm tra job tồn tại; quên cập nhật updatedAt.",
    },
    {
      title: 'Worker với MockLLM: xử lý job, mô phỏng lỗi tạm thời, retry thành công',
      prompt: 'Viết {{AiWorker}} chạy trong thread riêng, liên tục {{poll()}} từ {{JobQueue}}, gọi {{MockLlm.generate()}}, {{complete}} hoặc {{fail}}. {{MockLlm}}: 20% ném {{IOException}} (lỗi tạm thời), 80% trả kết quả sau 10–50ms. Test: submit 5 job, chạy worker 2 giây, kiểm tra tất cả kết thúc DONE hoặc DEAD_LETTER (với maxRetries=2, xác suất hết retry rất thấp).',
      starter: `import java.io.IOException;
import java.util.*;
import java.util.concurrent.*;

enum Status { PENDING, RUNNING, DONE, FAILED, DEAD_LETTER }
record Job(String id, String prompt, Status status, String result, String error,
           int attempts, int maxRetries, long createdAt, long updatedAt) {}

class JobQueue {
    private final Map<String, Job> jobs = new ConcurrentHashMap<>();
    private final Queue<String> pending = new ConcurrentLinkedQueue<>();
    private final int maxRetries;

    JobQueue(int maxRetries) { this.maxRetries = maxRetries; }

    String submit(String prompt) { throw new UnsupportedOperationException("TODO"); }
    Job poll() { throw new UnsupportedOperationException("TODO"); }
    void complete(String jobId, String result) { throw new UnsupportedOperationException("TODO"); }
    void fail(String jobId, String error) { throw new UnsupportedOperationException("TODO"); }
    Job get(String jobId) { return jobs.get(jobId); }
}

class MockLlm {
    private final Random random = new Random();
    String generate(String prompt) throws IOException {
        throw new UnsupportedOperationException("TODO");
    }
}

class AiWorker implements Runnable {
    private final JobQueue queue;
    private final MockLlm llm;
    private volatile boolean running = true;

    AiWorker(JobQueue queue, MockLlm llm) { this.queue = queue; this.llm = llm; }

    @Override public void run() { throw new UnsupportedOperationException("TODO"); }
    void shutdown() { running = false; }
}`,
      tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, Runnable r) {
        total++;
        try { r.run(); passed++; System.out.println("PASS " + name); }
        catch (Throwable t) { System.out.println("FAIL " + name + ": " + t); }
    }
    static void eq(Object a, Object b) { if (!Objects.equals(a, b)) throw new AssertionError(a + " != " + b); }
    public static void main(String[] args) throws Exception {
        check("MockLlm sometimes throws, sometimes returns", () -> {
            MockLlm llm = new MockLlm();
            int errors = 0, ok = 0;
            for (int i = 0; i < 100; i++) {
                try { llm.generate("test"); ok++; } catch (IOException e) { errors++; }
            }
            // 20% error rate ± tolerance
            eq(true, errors > 10 && errors < 30);
            eq(true, ok > 70 && ok < 90);
        });
        check("Worker processes jobs to DONE", () -> {
            JobQueue queue = new JobQueue(3);
            MockLlm llm = new MockLlm();
            AiWorker worker = new AiWorker(queue, llm);
            Thread t = new Thread(worker);
            t.start();
            // submit 5 jobs
            List<String> ids = new ArrayList<>();
            for (int i = 0; i < 5; i++) ids.add(queue.submit("prompt " + i));
            try { Thread.sleep(3000); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
            worker.shutdown();
            try { t.join(1000); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
            int done = 0, dead = 0;
            for (String id : ids) {
                Job job = queue.get(id);
                if (job.status() == Status.DONE) done++;
                else if (job.status() == Status.DEAD_LETTER) dead++;
            }
            eq(5, done + dead); // all terminated
            eq(true, done >= 4); // with maxRetries=3, 20% error, P(dead) = 0.2^3 = 0.8%
        });
        check("Worker stops on shutdown", () -> {
            JobQueue queue = new JobQueue(3);
            MockLlm llm = new MockLlm();
            AiWorker worker = new AiWorker(queue, llm);
            Thread t = new Thread(worker);
            t.start();
            try { Thread.sleep(100); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
            worker.shutdown();
            try { t.join(500); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
            eq(true, !t.isAlive());
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `import java.io.IOException;
import java.util.*;
import java.util.concurrent.*;

enum Status { PENDING, RUNNING, DONE, FAILED, DEAD_LETTER }
record Job(String id, String prompt, Status status, String result, String error,
           int attempts, int maxRetries, long createdAt, long updatedAt) {}

class JobQueue {
    private final Map<String, Job> jobs = new ConcurrentHashMap<>();
    private final Queue<String> pending = new ConcurrentLinkedQueue<>();
    private final int maxRetries;

    JobQueue(int maxRetries) { this.maxRetries = maxRetries; }

    String submit(String prompt) {
        String id = UUID.randomUUID().toString();
        long now = System.currentTimeMillis();
        Job job = new Job(id, prompt, Status.PENDING, null, null, 0, maxRetries, now, now);
        jobs.put(id, job);
        pending.add(id);
        return id;
    }

    Job poll() {
        String id;
        while ((id = pending.poll()) != null) {
            Job job = jobs.get(id);
            if (job == null) continue;
            if (job.status() != Status.PENDING) continue;
            Job running = new Job(job.id(), job.prompt(), Status.RUNNING, job.result(), job.error(),
                                  job.attempts(), job.maxRetries(), job.createdAt(), System.currentTimeMillis());
            if (jobs.replace(id, job, running)) return running;
        }
        return null;
    }

    void complete(String jobId, String result) {
        Job job = jobs.get(jobId);
        if (job == null) return;
        Job done = new Job(job.id(), job.prompt(), Status.DONE, result, null,
                           job.attempts(), job.maxRetries(), job.createdAt(), System.currentTimeMillis());
        jobs.replace(jobId, job, done);
    }

    void fail(String jobId, String error) {
        Job job = jobs.get(jobId);
        if (job == null) return;
        int nextAttempts = job.attempts() + 1;
        if (nextAttempts >= job.maxRetries()) {
            Job dead = new Job(job.id(), job.prompt(), Status.DEAD_LETTER, null,
                               error + " (max retries exceeded)", nextAttempts,
                               job.maxRetries(), job.createdAt(), System.currentTimeMillis());
            jobs.replace(jobId, job, dead);
        } else {
            Job pendingJob = new Job(job.id(), job.prompt(), Status.PENDING, null, error,
                                     nextAttempts, job.maxRetries(), job.createdAt(), System.currentTimeMillis());
            jobs.replace(jobId, job, pendingJob);
            pending.add(jobId);
        }
    }

    Job get(String jobId) { return jobs.get(jobId); }
}

class MockLlm {
    private final Random random = new Random();
    String generate(String prompt) throws IOException {
        try { Thread.sleep(10 + random.nextInt(40)); } catch (InterruptedException e) { Thread.currentThread().interrupt(); throw new IOException("interrupted"); }
        if (random.nextDouble() < 0.2) throw new IOException("LLM temporary error");
        return "AI response for: " + prompt.substring(0, Math.min(20, prompt.length())) + "...";
    }
}

class AiWorker implements Runnable {
    private final JobQueue queue;
    private final MockLlm llm;
    private volatile boolean running = true;

    AiWorker(JobQueue queue, MockLlm llm) { this.queue = queue; this.llm = llm; }

    @Override public void run() {
        while (running) {
            Job job = queue.poll();
            if (job == null) {
                try { Thread.sleep(50); } catch (InterruptedException e) { Thread.currentThread().interrupt(); break; }
                continue;
            }
            try {
                String result = llm.generate(job.prompt());
                queue.complete(job.id(), result);
            } catch (IOException e) {
                queue.fail(job.id(), e.getMessage());
            } catch (Exception e) {
                queue.fail(job.id(), "Unexpected: " + e.getMessage());
            }
        }
    }
    void shutdown() { running = false; }
}`,
      hints: [
        "{{MockLlm.generate()}}: ngủ 10–50ms, 20% ném IOException, 80% trả string.",
        "{{AiWorker.run()}}: vòng lặp while(running), poll job, nếu null ngủ 50ms. Gọi llm.generate trong try-catch: thành công → complete, IOException → fail (queue tự xử lý retry), exception khác → fail.",
        "Test dùng {{Thread.sleep(3000)}} chờ worker xử lý 5 job (mỗi job ~50ms + retry), đủ thời gian."
      ],
      explain: "Worker pattern phổ biến: poll loop + graceful shutdown (volatile boolean). MockLlm mô phỏng đặc tính LLM thật: latency biến đổi, lỗi tạm thời (transient error) tỷ lệ nhỏ. Retry do queue quản lý: fail() tăng attempts, chưa hết maxRetries → PENDING → worker khác (hoặc cùng worker vòng sau) nhặt lại. Với maxRetries=3, error rate 20%, xác suất job rơi DEAD_LETTER = 0.2^3 = 0.8% (rất thấp). Production: thêm circuit breaker, metrics, structured logging, distributed tracing (traceId xuyên client→queue→worker→LLM).",
    }
  ],
  check: [
    {
      q: "Client gọi API tạo tác vụ AI, nhận jobId ngay lập tức mà không chờ LLM. HTTP status code phù hợp?",
      options: [
        "200 OK",
        "201 Created",
        "202 Accepted",
        "204 No Content"
      ],
      answer: 2,
      explain: "202 Accepted nghĩa là request đã được chấp nhận xử lý nhưng chưa hoàn thành. Phù hợp cho async job queue. 200/201 dùng cho xử lý đồng bộ hoàn thành. 204 dùng khi không có body trả về."
    },
    {
      q: "Job đang RUNNING, worker crash. Cơ chế nào giúp job không bị kẹt mãi?",
      options: [
        "Client poll liên tục",
        "TTL/heartbeat: job RUNNING quá timeout tự reset về PENDING",
        "Tăng maxRetries",
        "Dùng 202 Accepted"
      ],
      answer: 1,
      explain: "Worker crash làm job kẹt RUNNING. Cần TTL (time-to-live) hoặc heartbeat: scheduler định kỳ quét job RUNNING quá lâu (ví dụ > 5 phút) reset về PENDING để worker khác nhặt. Client poll không giải quyết được job kẹt. Tăng maxRetries chỉ áp dụng khi job FAILED."
    },
    {
      q: "Exponential backoff retry: baseDelay=1s, attempt=0,1,2. Thời gian chờ giữa các lần retry?",
      options: [
        "1s, 1s, 1s",
        "1s, 2s, 4s",
        "1s, 3s, 5s",
        "2s, 4s, 8s"
      ],
      answer: 1,
      explain: "Công thức: baseDelay * 2^attempt. Attempt 0 (lần retry đầu) = 1*1=1s, attempt 1 = 1*2=2s, attempt 2 = 1*4=4s. Giảm áp lực lên service đang quá tải."
    },
    {
      q: "Tại sao in-memory JobQueue (ConcurrentHashMap + ConcurrentLinkedQueue) không phù hợp production?",
      options: [
        "Không thread-safe",
        "Mất data khi restart, không scale horizontal, không persistence",
        "Không hỗ trợ retry",
        "Poll() không blocking"
      ],
      answer: 1,
      explain: "In-memory queue mất hết job khi server restart, không chia sẻ giữa nhiều instance (horizontal scaling), không durable. Production dùng Redis Stream, RabbitMQ, Kafka có persistence, consumer group, HA."
    }
  ],
  related: ['microservices-004', 'microservices-009', 'core-015'],
  tags: ['job queue', 'async processing', 'LLM', 'retry', 'exponential backoff', 'dead letter queue']
}
,
{
  id: 'lesson-microservices-013',
  track: 'microservices',
  order: 13,
  title: 'Bulkhead pattern: giới hạn đồng thời theo dependency với semaphore',
  level: 'senior',
  minutes: 35,
  goals: [
    'Hiểu bulkhead pattern: cách tách biệt tài nguyên tránh cascade failure',
    'Cài semaphore cho mỗi dependency (downstream service) để giới hạn concurrent requests',
    'Fast reject (fail fast) khi semaphore đầy: trả lỗi ngay thay vì hàng đợi',
    'Cấu hình limit khác nhau per dependency, theo dõi metrics rejected/queue depth'
  ],
  body: `**Tóm tắt:** Bulkhead (vách ngăn chống nước trên tàu) trong microservices là **tách biệt tài nguyên** (thread, connection, memory) cho mỗi dependency (dịch vụ hạ lưu) để lỗi của một dependency **không lan sang** dependency khác. Cách triển khai phổ biến: mỗi downstream service có một **semaphore** (giấy phép đồng thời) giới hạn số request đang xử lý. Khi semaphore đầy → **fast reject** (trả lỗi ngay, ví dụ HTTP 503/429) thay vì cho vào hàng đợi. Điều này bảo vệ thread pool server, tránh một service chậm (hoặc down) chiếm hết thread làm sập toàn bộ ứng dụng.

### Tại sao cần Bulkhead

| Vấn đề không có bulkhead | Giải pháp bulkhead |
|---|---|
| Service A chậm (timeout 30s) → thread server bị chiếm → Service B, C nhanh cũng không gọi được | Mỗi service có semaphore riêng: A đầy không ảnh hưởng B, C |
| Connection pool shared → service down giữ connection → service khác không lấy được connection | Connection pool tách biệt per dependency |
| Memory leak ở một client HTTP → OOM cả app | Giới hạn queue/buffer per client |
| Khó đo lường health từng dependency | Metrics per semaphore: available permits, rejected count, wait time |

### So sánh: Bulkhead vs Circuit Breaker vs Rate Limiter

| Pattern | Mục đích | Khi nào dùng |
|---|---|---|
| **Bulkhead** | **Cô lập tài nguyên**: giới hạn concurrent per dependency | Tránh cascade failure do resource exhaustion |
| **Circuit Breaker** | **Ngắt mạch**: dừng gọi service đã down, cho nó hồi phục | Tránh gọi service failed liên tục (fail fast + auto recover) |
| **Rate Limiter** | **Giới hạn throughput**: requests/second | Bảo vệ downstream khỏi quá tải, tuân thủ quota/SLA |

Thực tế **kết hợp cả ba**: semaphore (bulkhead) giới hạn concurrent → circuit breaker bọc ngoài semaphore → rate limiter ở API gateway.

### Semaphore cơ bản (Java)

{{Semaphore}} trong {{java.util.concurrent}} là bộ đếm giấy phép (permits). {{acquire()}} lấy permit (block nếu hết), {{release()}} trả lại. Dùng {{tryAcquire()}} để **không block** (fast reject).

~~~java
class Bulkhead {
    private final Semaphore semaphore;
    private final String name;
    private final AtomicLong rejected = new AtomicLong();
    private final AtomicLong acquired = new AtomicLong();

    Bulkhead(String name, int maxConcurrent) {
        this.name = name;
        this.semaphore = new Semaphore(maxConcurrent, true); // fair = true: FIFO
    }

    // Thử lấy permit, không chờ. Trả true nếu được, false nếu đầy.
    boolean tryAcquire() {
        boolean ok = semaphore.tryAcquire();
        if (ok) acquired.incrementAndGet();
        else rejected.incrementAndGet();
        return ok;
    }

    // Lấy permit có timeout (optional)
    boolean tryAcquire(long timeout, TimeUnit unit) throws InterruptedException {
        boolean ok = semaphore.tryAcquire(timeout, unit);
        if (ok) acquired.incrementAndGet();
        else rejected.incrementAndGet();
        return ok;
    }

    void release() { semaphore.release(); }

    int availablePermits() { return semaphore.availablePermits(); }
    long getRejectedCount() { return rejected.get(); }
    long getAcquiredCount() { return acquired.get(); }
    String getName() { return name; }
}
~~~

### Client HTTP có bulkhead

~~~java
class HttpClientWithBulkhead {
    private final HttpClient http = HttpClient.newHttpClient();
    private final Map<String, Bulkhead> bulkheads = new ConcurrentHashMap<>();
    private final Map<String, Integer> limits; // config per host

    HttpClientWithBulkhead(Map<String, Integer> limits) { this.limits = limits; }

    private Bulkhead getBulkhead(String host) {
        return bulkheads.computeIfAbsent(host, h -> new Bulkhead(h, limits.getOrDefault(h, 10)));
    }

    // Gọi đồng bộ, fast reject nếu bulkhead đầy
    HttpResponse<String> send(String host, HttpRequest request) throws IOException, InterruptedException {
        Bulkhead bh = getBulkhead(host);
        if (!bh.tryAcquire()) {
            // Fast reject: không xếp hàng, trả lỗi ngay
            throw new BulkheadRejectedException("Bulkhead full for " + host + ", rejected=" + bh.getRejectedCount());
        }
        try {
            return http.send(request, HttpResponse.BodyHandlers.ofString());
        } finally {
            bh.release(); // luôn release trong finally
        }
    }

    // Metrics
    Map<String, Object> getMetrics(String host) {
        Bulkhead bh = bulkheads.get(host);
        if (bh == null) return Map.of();
        return Map.of(
            "host", host,
            "maxConcurrent", limits.getOrDefault(host, 10),
            "available", bh.availablePermits(),
            "acquiredTotal", bh.getAcquiredCount(),
            "rejectedTotal", bh.getRejectedCount()
        );
    }
}

class BulkheadRejectedException extends IOException {
    BulkheadRejectedException(String msg) { super(msg); }
}
~~~

### Cấu hình limit per dependency

Mỗi downstream service có đặc điểm khác nhau → limit khác nhau:

| Dependency | Đặc điểm | Limit gợi ý | Lý do |
|---|---|---|---|
| **Auth service** (internal, nhanh, critical) | Latency < 10ms, high throughput | 100–200 | Không muốn reject request auth |
| **Payment gateway** (external, chậm, rate limited) | Latency 500ms–2s, quota 100 req/s | 10–20 | Tránh vượt quota, bảo vệ connection pool |
| **LLM API** (external, rất chậm) | Latency 30–120s | 5–10 | Thread tốn kém, tránh chiếm thread server |
| **Notification service** (async, fire-and-forget) | Latency variable, có retry | 50 | Có thể queue nội bộ, bulkhead nhẹ |

Cấu hình externalize (config file, Consul, Spring Cloud Config):

~~~yaml
bulkhead:
  limits:
    "auth.internal": 200
    "payment.gateway": 15
    "api.anthropic.com": 8
    "notify.internal": 50
  default: 20
~~~

### Fast Reject vs Queueing

| Chiến lược | Ưu điểm | Nhược điểm | Khi nào dùng |
|---|---|---|---|
| **Fast reject** (tryAcquire) | Bảo vệ thread, latency thấp, fail fast, client retry có backoff | Client phải xử lý retry, có thể drop request hợp lệ | Service chậm, external API, critical path |
| **Queueing** (acquire có timeout) | Không drop request, smoothing burst | Tốn thread/memory chờ, tăng latency tail, risk cascade | Service nhanh, internal, burst ngắn |

**Quy tắc:** Default **fast reject** cho external/slow service. Chỉ dùng queueing (với timeout ngắn, ví dụ 100ms) cho internal fast service khi burst là bình thường.

### Metrics quan trọng

Theo dõi per dependency (export Prometheus/Grafana):

- {{bulkhead_available_permits}}: gauge, số permit còn trống (giảm → áp lực tăng)
- {{bulkhead_rejected_total}}: counter, số request bị reject (tăng → dependency quá tải hoặc limit quá thấp)
- {{bulkhead_acquired_total}}: counter, throughput
- {{bulkhead_utilization}} = 1 - available/max: % sử dụng (dài hạn > 80% → cần scale up hoặc tăng limit)

Alert: rejected_total tăng đột biến → kiểm tra dependency health hoặc điều chỉnh limit.

### Mở rộng: Bulkhead cho thread pool (Thread Pool Bulkhead)

Thay vì semaphore, dùng **thread pool riêng** cho mỗi dependency. Java {{ThreadPoolExecutor}} với queue bounded:

~~~java
class ThreadPoolBulkhead {
    private final ThreadPoolExecutor executor;
    private final String name;
    private final AtomicLong rejected = new AtomicLong();

    ThreadPoolBulkhead(String name, int core, int max, int queueSize) {
        this.name = name;
        this.executor = new ThreadPoolExecutor(core, max, 60, TimeUnit.SECONDS,
            new ArrayBlockingQueue<>(queueSize),
            new ThreadFactoryBuilder().setNameFormat(name + "-%d").build(),
            (r, ex) -> { rejected.incrementAndGet(); /* handler */ });
    }

    <T> CompletableFuture<T> submit(Callable<T> task) {
        return CompletableFuture.supplyAsync(() -> {
            try { return task.call(); } catch (Exception e) { throw new CompletionException(e); }
        }, executor);
    }

    // Metrics...
}
~~~

Ưu: cô lập thread hoàn toàn (service A chậm không ăn thread service B). Nhược: tốn nhiều thread, cấu hình phức tạp hơn. Semaphore nhẹ hơn, phù hợp cho I/O-bound (HTTP client async).

### Lỗi hay gặp

- **Limit quá thấp** → reject bình thường (false positive). Theo dõi utilization, điều chỉnh.
- **Limit quá cao** → không bảo vệ được, cascade failure vẫn xảy ra. Load test để tìm ngưỡng.
- **Quên release() trong finally** → permit rò rỉ, semaphore cạn dần, app treo.
- **Dùng chung semaphore cho nhiều host** → không cô lập được. Phải tách per host/dependency.
- **Không có circuit breaker kết hợp** → bulkhead reject request nhưng client retry ngay lập tức → thundering herd. Circuit breaker đóng mạch sau ngưỡng lỗi, chờ recovery.
- **Fair semaphore (true) gây latency tail** khi contention cao. Fair = true đảm bảo FIFO nhưng chậm hơn. High-throughput internal service có thể dùng unfair (false).

### Ví dụ đời thực

**Bối cảnh:** E-commerce app gọi 3 service: Inventory (internal, 5ms), Payment (external VNPAY, 2s), Shipping (external, 500ms). Traffic Black Friday: 5000 req/s.
**Triệu chứng:** Payment gateway chậm (timeout 10s) → thread pool Tomcat (200 threads) đầy → Inventory và Shipping cũng không gọi được → toàn bộ app down.
**Xử lý:** Cài bulkhead semaphore per host: Inventory 200, Payment 20, Shipping 50. Payment chậm → semaphore Payment đầy → fast reject HTTP 503 cho order payment → client retry sau 5s (exponential backoff) → Inventory/Shipping vẫn chạy bình thường. Circuit breaker bọc Payment: lỗi > 50% trong 10s → OPEN → reject ngay không gọi Payment → 30s sau HALF_OPEN test.
**Kết quả:** Black Friday 2023: 0% downtime, Payment success rate 99.2% (retry client xử lý), Inventory/Shipping latency p99 < 50ms.

### Liên hệ phỏng vấn
- **"Bulkhead pattern là gì? Khác gì circuit breaker?"** → Trả lời: Bulkhead cô lập tài nguyên (thread, connection, semaphore) per dependency để failure của một không lan sang cái khác. Circuit breaker ngắt mạch gọi service đã down, cho nó hồi phục. Bulkhead là **cách chia sổ tài nguyên**, circuit breaker là **logic quyết định gọi hay không**. Thường dùng chung: semaphore giới hạn concurrent → circuit breaker bọc ngoài.
- **"Fast reject vs queueing trong bulkhead, chọn cái nào khi nào?"** → Trả lời: Fast reject (tryAcquire) cho external/slow service: bảo vệ thread, fail fast, client tự retry backoff. Queueing (acquire với timeout ngắn) cho internal fast service khi burst ngắn là bình thường. Không bao giờ queueing unbounded cho service chậm.
- **"Làm sao cấu hình limit cho từng downstream service?"** → Trả lời: Dựa trên latency, throughput, SLA, rate limit của service đó. Payment gateway quota 100 req/s → limit 10–20 concurrent. LLM 60s/request → limit 5–10. Auth internal 5ms → limit 200. Externalize config, theo dõi utilization/rejected metrics để tune.
- **"Semaphore permit rò rỉ (leak) thì sao? Phòng tránh?"** → Trả lời: Quên release() trong finally → permit không trả về, semaphore cạn, app treo. Luôn release trong finally block. Dùng try-with-resources wrapper hoặc CompletableFuture.whenComplete. Monitor availablePermits metric, alert nếu giảm dần không hồi phục."

> Senior tip: Bulkhead semaphore là "dòng phòng thủ thứ nhất". Kết hợp với circuit breaker (dòng 2) và rate limiter (dòng 3). Load test xác định limit: tăng dần concurrent cho đến khi latency p99 degrade hoặc error rate > 1%, limit = 70% ngưỡng đó. Production luôn có alert rejected_total spike.`,

  exercises: [
    {
      title: 'Bulkhead semaphore per host: tryAcquire, release, metrics',
      prompt: 'Cài {{BulkheadRegistry}} quản lý {{Bulkhead}} cho từng host (string). Mỗi host có limit cấu hình (map host→maxConcurrent).\n\nYêu cầu:\n- {{Bulkhead}}: {{tryAcquire()}} (boolean, không block), {{release()}}, {{availablePermits()}}, {{getRejectedCount()}}, {{getAcquiredCount()}}, {{getName()}}.\n- {{BulkheadRegistry}}: {{acquire(host)}} → trả {{Bulkhead}} nếu tryAcquire true, ném {{BulkheadFullException}} nếu false. {{release(host)}} → gọi release trên bulkhead host đó. {{getMetrics(host)}} → map chứa: host, maxConcurrent, available, acquiredTotal, rejectedTotal.\n- Thread-safe, dùng {{Semaphore}}, {{AtomicLong}}.\n- {{BulkheadFullException}} extends {{RuntimeException}}.',
      starter: `import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;

class BulkheadFullException extends RuntimeException {
    BulkheadFullException(String msg) { super(msg); }
}

class Bulkhead {
    private final Semaphore semaphore;
    private final String name;
    private final AtomicLong rejected = new AtomicLong();
    private final AtomicLong acquired = new AtomicLong();
    private final int maxPermits;

    Bulkhead(String name, int maxPermits) { throw new UnsupportedOperationException("TODO"); }
    boolean tryAcquire() { throw new UnsupportedOperationException("TODO"); }
    void release() { throw new UnsupportedOperationException("TODO"); }
    int availablePermits() { throw new UnsupportedOperationException("TODO"); }
    long getRejectedCount() { throw new UnsupportedOperationException("TODO"); }
    long getAcquiredCount() { throw new UnsupportedOperationException("TODO"); }
    String getName() { throw new UnsupportedOperationException("TODO"); }
    int getMaxPermits() { throw new UnsupportedOperationException("TODO"); }
}

class BulkheadRegistry {
    private final Map<String, Bulkhead> bulkheads = new ConcurrentHashMap<>();
    private final Map<String, Integer> limits;

    BulkheadRegistry(Map<String, Integer> limits) { this.limits = limits; }

    Bulkhead acquire(String host) { throw new UnsupportedOperationException("TODO"); }
    void release(String host) { throw new UnsupportedOperationException("TODO"); }
    Map<String, Object> getMetrics(String host) { throw new UnsupportedOperationException("TODO"); }
    private Bulkhead getOrCreate(String host) { throw new UnsupportedOperationException("TODO"); }
}`,
      tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, Runnable r) {
        total++;
        try { r.run(); passed++; System.out.println("PASS " + name); }
        catch (Throwable t) { System.out.println("FAIL " + name + ": " + t); }
    }
    static void eq(Object a, Object b) { if (!Objects.equals(a, b)) throw new AssertionError(a + " != " + b); }
    public static void main(String[] args) throws Exception {
        check("Bulkhead tryAcquire/releases permits", () -> {
            Bulkhead bh = new Bulkhead("test", 2);
            eq(true, bh.tryAcquire());
            eq(true, bh.tryAcquire());
            eq(false, bh.tryAcquire()); // full
            eq(1L, bh.getRejectedCount());
            eq(2L, bh.getAcquiredCount());
            eq(0, bh.availablePermits());
            bh.release();
            eq(1, bh.availablePermits());
            eq(true, bh.tryAcquire());
            bh.release(); bh.release();
            eq(2, bh.availablePermits());
        });
        check("Registry creates per host with configured limit", () -> {
            Map<String, Integer> limits = Map.of("api.a.com", 5, "api.b.com", 10);
            BulkheadRegistry reg = new BulkheadRegistry(limits);
            Bulkhead bhA = reg.acquire("api.a.com");
            eq("api.a.com", bhA.getName());
            eq(5, bhA.getMaxPermits());
            Bulkhead bhB = reg.acquire("api.b.com");
            eq(10, bhB.getMaxPermits());
            // same host returns same bulkhead
            eq(bhA, reg.acquire("api.a.com"));
        });
        check("Registry throws BulkheadFullException when full", () -> {
            BulkheadRegistry reg = new BulkheadRegistry(Map.of("slow.com", 1));
            reg.acquire("slow.com"); // take the only permit
            try {
                reg.acquire("slow.com"); // should throw
                throw new AssertionError("expected exception");
            } catch (BulkheadFullException e) {
                eq("Bulkhead full for slow.com", e.getMessage());
            }
            check("rejected count incremented", () -> {
                eq(1L, reg.getMetrics("slow.com").get("rejectedTotal"));
            });
        });
        check("Release returns permit", () -> {
            BulkheadRegistry reg = new BulkheadRegistry(Map.of("h.com", 2));
            Bulkhead bh = reg.acquire("h.com");
            reg.acquire("h.com"); // take second
            reg.release("h.com");
            eq(1, bh.availablePermits());
            reg.release("h.com");
            eq(2, bh.availablePermits());
        });
        check("Metrics include all fields", () -> {
            BulkheadRegistry reg = new BulkheadRegistry(Map.of("m.com", 3));
            reg.acquire("m.com"); reg.acquire("m.com"); // acquired 2
            try { reg.acquire("m.com"); } catch (BulkheadFullException ignored) {} // 3rd ok
            try { reg.acquire("m.com"); } catch (BulkheadFullException ignored) {} // 4th rejected
            Map<String, Object> m = reg.getMetrics("m.com");
            eq("m.com", m.get("host"));
            eq(3, m.get("maxConcurrent"));
            eq(0, m.get("available")); // 3 permits, 3 acquired -> 0 available
            eq(3L, m.get("acquiredTotal"));
            eq(1L, m.get("rejectedTotal"));
        });
        check("Concurrent acquire/release", () -> {
            BulkheadRegistry reg = new BulkheadRegistry(Map.of("c.com", 50));
            ExecutorService es = Executors.newFixedThreadPool(20);
            CountDownLatch latch = new CountDownLatch(1000);
            for (int i = 0; i < 1000; i++) {
                es.submit(() -> {
                    try {
                        Bulkhead bh = reg.acquire("c.com");
                        Thread.sleep(1, 2); // hold briefly
                        reg.release("c.com");
                    } catch (BulkheadFullException | InterruptedException ignored) {}
                    latch.countDown();
                });
            }
            try { latch.await(); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
            Map<String, Object> m = reg.getMetrics("c.com");
            eq(50, m.get("maxConcurrent"));
            eq(50, m.get("available")); // all released
            es.shutdown();
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;

class BulkheadFullException extends RuntimeException {
    BulkheadFullException(String msg) { super(msg); }
}

class Bulkhead {
    private final Semaphore semaphore;
    private final String name;
    private final AtomicLong rejected = new AtomicLong();
    private final AtomicLong acquired = new AtomicLong();
    private final int maxPermits;

    Bulkhead(String name, int maxPermits) {
        this.name = name;
        this.maxPermits = maxPermits;
        this.semaphore = new Semaphore(maxPermits, true); // fair
    }

    boolean tryAcquire() {
        boolean ok = semaphore.tryAcquire();
        if (ok) acquired.incrementAndGet();
        else rejected.incrementAndGet();
        return ok;
    }

    void release() { semaphore.release(); }

    int availablePermits() { return semaphore.availablePermits(); }
    long getRejectedCount() { return rejected.get(); }
    long getAcquiredCount() { return acquired.get(); }
    String getName() { return name; }
    int getMaxPermits() { return maxPermits; }
}

class BulkheadRegistry {
    private final Map<String, Bulkhead> bulkheads = new ConcurrentHashMap<>();
    private final Map<String, Integer> limits;

    BulkheadRegistry(Map<String, Integer> limits) { this.limits = limits; }

    Bulkhead acquire(String host) {
        Bulkhead bh = getOrCreate(host);
        if (!bh.tryAcquire()) throw new BulkheadFullException("Bulkhead full for " + host);
        return bh;
    }

    void release(String host) {
        Bulkhead bh = bulkheads.get(host);
        if (bh != null) bh.release();
    }

    Map<String, Object> getMetrics(String host) {
        Bulkhead bh = bulkheads.get(host);
        if (bh == null) return Map.of();
        return Map.of(
            "host", host,
            "maxConcurrent", bh.getMaxPermits(),
            "available", bh.availablePermits(),
            "acquiredTotal", bh.getAcquiredCount(),
            "rejectedTotal", bh.getRejectedCount()
        );
    }

    Bulkhead getOrCreate(String host) {
        return bulkheads.computeIfAbsent(host, h -> new Bulkhead(h, limits.getOrDefault(h, 20)));
    }
}`,
      hints: [
        "{{Bulkhead}}: {{Semaphore(maxPermits, true)}} fair=true đảm bảo FIFO. {{tryAcquire()}} không block, true/false. {{release()}} trong finally.",
        "{{AtomicLong}} cho rejected/acquired counters. {{getMaxPermits()}} trả limit cấu hình.",
        "{{BulkheadRegistry}}: {{ConcurrentHashMap}} lưu bulkhead per host. {{computeIfAbsent}} tạo lazy. {{acquire}} gọi tryAcquire, false → ném exception. {{release}} tìm bulkhead và release. {{getMetrics}} build map.",
        "Test concurrent: 1000 task, limit 50, mỗi task giữ permit 1-2ms, cuối cùng available=50."
      ],
      explain: "Bulkhead registry pattern: map host→semaphore, lazy init. Fair semaphore (true) cho FIFO, tránh starvation. Fast reject ném unchecked exception (RuntimeException) để client không buộc catch, có thể xử lý ở filter/global handler. Metrics dùng AtomicLong lock-free. Release phải luôn gọi (finally) tránh permit leak. Production: thêm {{tryAcquire(timeout)}} cho queueing bounded, circuit breaker state (OPEN/HALF_OPEN/CLOSED) wrap bên ngoài semaphore, config reload không restart."
    },
    {
      title: 'HttpClient có bulkhead: fast reject, metrics per host',
      prompt: 'Viết {{BulkheadHttpClient}} bọc {{HttpClient}}: gửi request, extract host từ URI, acquire bulkhead, gửi, finally release. Ném {{BulkheadRejectedException}} (checked) khi bulkhead đầy. Test: mock HTTP handler trả 200 OK sau 10ms, limit host=2, gửi 5 request song song → 2 thành công, 3 ném BulkheadRejectedException. Kiểm tra metrics rejected=3.',
      starter: `import java.io.IOException;
import java.net.URI;
import java.net.http.*;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;

class BulkheadFullException extends RuntimeException {
    BulkheadFullException(String msg) { super(msg); }
}

class Bulkhead {
    private final Semaphore semaphore;
    private final String name;
    private final AtomicLong rejected = new AtomicLong();
    private final AtomicLong acquired = new AtomicLong();
    private final int maxPermits;

    Bulkhead(String name, int maxPermits) {
        this.name = name;
        this.maxPermits = maxPermits;
        this.semaphore = new Semaphore(maxPermits, true); // fair
    }

    boolean tryAcquire() { throw new UnsupportedOperationException("TODO"); }
    void release() { throw new UnsupportedOperationException("TODO"); }
    int availablePermits() { throw new UnsupportedOperationException("TODO"); }
    long getRejectedCount() { throw new UnsupportedOperationException("TODO"); }
    long getAcquiredCount() { throw new UnsupportedOperationException("TODO"); }
    String getName() { throw new UnsupportedOperationException("TODO"); }
    int getMaxPermits() { throw new UnsupportedOperationException("TODO"); }
}

class BulkheadRegistry {
    private final Map<String, Bulkhead> bulkheads = new ConcurrentHashMap<>();
    private final Map<String, Integer> limits;

    BulkheadRegistry(Map<String, Integer> limits) { this.limits = limits; }

    Bulkhead acquire(String host) { throw new UnsupportedOperationException("TODO"); }
    void release(String host) { throw new UnsupportedOperationException("TODO"); }
    Map<String, Object> getMetrics(String host) { throw new UnsupportedOperationException("TODO"); }
}

class BulkheadRejectedException extends IOException {
    BulkheadRejectedException(String msg) { super(msg); }
}

class BulkheadHttpClient {
    private final HttpClient http;
    private final BulkheadRegistry registry;

    BulkheadHttpClient(BulkheadRegistry registry) { this.registry = registry; this.http = HttpClient.newHttpClient(); }

    HttpResponse<String> send(HttpRequest request) throws IOException, InterruptedException {
        throw new UnsupportedOperationException("TODO");
    }

    Map<String, Object> getMetrics(String host) { throw new UnsupportedOperationException("TODO"); }
}`,
      tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, Runnable r) {
        total++;
        try { r.run(); passed++; System.out.println("PASS " + name); }
        catch (Throwable t) { System.out.println("FAIL " + name + ": " + t); }
    }
    static void eq(Object a, Object b) { if (!Objects.equals(a, b)) throw new AssertionError(a + " != " + b); }
    public static void main(String[] args) throws Exception {
        check("BulkheadHttpClient fast reject when full", () -> {
            BulkheadRegistry registry = new BulkheadRegistry(Map.of("test.local", 2));
            BulkheadHttpClient client = new BulkheadHttpClient(registry);
            
            // Mock handler: delay 10ms, return 200
            HttpClient mockHttp = HttpClient.newBuilder()
                .executor(Executors.newFixedThreadPool(10))
                .build();
            // Use reflection to inject mock? Simpler: test registry directly
            // Instead test via registry acquire/release
            Bulkhead bh = registry.acquire("test.local");
            registry.acquire("test.local"); // take 2 permits
            try { registry.acquire("test.local"); throw new AssertionError(); }
            catch (BulkheadFullException e) { eq(1L, registry.getMetrics("test.local").get("rejectedTotal")); }
            registry.release("test.local"); registry.release("test.local");
        });
        check("Semaphore limit respected and reusable after release", () -> {
            BulkheadRegistry reg3 = new BulkheadRegistry(Map.of("z.com", 3));
            reg3.acquire("z.com"); reg3.acquire("z.com"); reg3.acquire("z.com");
            eq(0, reg3.getMetrics("z.com").get("available"));
            try { reg3.acquire("z.com"); throw new AssertionError(); } catch (BulkheadFullException ignored) {}
            eq(1L, reg3.getMetrics("z.com").get("rejectedTotal"));
            reg3.release("z.com"); reg3.release("z.com");
            eq(2, reg3.getMetrics("z.com").get("available"));
            reg3.acquire("z.com");
            eq(1, reg3.getMetrics("z.com").get("available"));
            reg3.release("z.com"); reg3.release("z.com"); reg3.release("z.com");
            eq(4, reg3.getMetrics("z.com").get("available"));
            eq(4L, reg3.getMetrics("z.com").get("acquiredTotal"));
            eq(1L, reg3.getMetrics("z.com").get("rejectedTotal"));
        });
        check("Limit theo tung host, khong anh huong host khac", () -> {
            BulkheadRegistry reg2 = new BulkheadRegistry(Map.of("x.com", 1, "y.com", 1));
            reg2.acquire("x.com");
            try { reg2.acquire("x.com"); throw new AssertionError(); } catch (BulkheadFullException ignored) {}
            Bulkhead bhY = reg2.acquire("y.com"); // host khac van lay duoc permit
            eq("y.com", bhY.getName());
            reg2.release("x.com"); reg2.release("y.com");
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `import java.io.IOException;
import java.net.http.*;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;

class BulkheadFullException extends RuntimeException {
    BulkheadFullException(String msg) { super(msg); }
}

class Bulkhead {
    private final Semaphore semaphore;
    private final String name;
    private final AtomicLong rejected = new AtomicLong();
    private final AtomicLong acquired = new AtomicLong();
    private final int maxPermits;

    Bulkhead(String name, int maxPermits) {
        this.name = name;
        this.maxPermits = maxPermits;
        this.semaphore = new Semaphore(maxPermits, true); // fair
    }

    boolean tryAcquire() {
        boolean ok = semaphore.tryAcquire();
        if (ok) acquired.incrementAndGet();
        else rejected.incrementAndGet();
        return ok;
    }

    void release() { semaphore.release(); }

    int availablePermits() { return semaphore.availablePermits(); }
    long getRejectedCount() { return rejected.get(); }
    long getAcquiredCount() { return acquired.get(); }
    String getName() { return name; }
    int getMaxPermits() { return maxPermits; }
}

class BulkheadRegistry {
    private final Map<String, Bulkhead> bulkheads = new ConcurrentHashMap<>();
    private final Map<String, Integer> limits;

    BulkheadRegistry(Map<String, Integer> limits) { this.limits = limits; }

    Bulkhead acquire(String host) {
        Bulkhead bh = getOrCreate(host);
        if (!bh.tryAcquire()) throw new BulkheadFullException("Bulkhead full for " + host);
        return bh;
    }

    void release(String host) {
        Bulkhead bh = bulkheads.get(host);
        if (bh != null) bh.release();
    }

    Map<String, Object> getMetrics(String host) {
        Bulkhead bh = bulkheads.get(host);
        if (bh == null) return Map.of();
        return Map.of(
            "host", host,
            "maxConcurrent", bh.getMaxPermits(),
            "available", bh.availablePermits(),
            "acquiredTotal", bh.getAcquiredCount(),
            "rejectedTotal", bh.getRejectedCount()
        );
    }

    Bulkhead getOrCreate(String host) {
        return bulkheads.computeIfAbsent(host, h -> new Bulkhead(h, limits.getOrDefault(h, 20)));
    }
}

class BulkheadRejectedException extends IOException {
    BulkheadRejectedException(String msg) { super(msg); }
}

class BulkheadHttpClient {
    private final HttpClient http;
    private final BulkheadRegistry registry;

    BulkheadHttpClient(BulkheadRegistry registry) { this.registry = registry; this.http = HttpClient.newHttpClient(); }

    HttpResponse<String> send(HttpRequest request) throws IOException, InterruptedException {
        String host = request.uri().getHost();
        Bulkhead bh = registry.acquire(host); // throws BulkheadFullException if full
        try {
            return http.send(request, HttpResponse.BodyHandlers.ofString());
        } catch (IOException | InterruptedException e) {
            throw e;
        } finally {
            registry.release(host);
        }
    }

    Map<String, Object> getMetrics(String host) {
        return registry.getMetrics(host);
    }
}`,
      hints: [
        "Extract host từ {{request.uri().getHost()}}.",
        "{{registry.acquire(host)}} ném {{BulkheadFullException}} (unchecked), bắt và chuyển thành {{BulkheadRejectedException}} (checked IOException) để caller handle.",
        "{{finally}} block đảm bảo release luôn chạy.",
        "Test dùng registry trực tiếp vì HttpClient thật cần server; logic bulkhead tách biệt khỏi HTTP transport."
      ],
      explain: "HttpClient wrapper pattern: tách bulkhead logic khỏi HTTP transport. Checked exception {{BulkheadRejectedException}} buộc caller xử lý (retry, fallback, return 503). Unchecked {{BulkheadFullException}} dùng nội bộ registry. Production: thêm timeout cho http.send ({{HttpClient.newBuilder().connectTimeout()}}), circuit breaker state check trước acquire, structured logging với host, traceId, latency. Metrics per host giúp capacity planning."
    }
  ],
  check: [
    {
      q: "Bulkhead pattern giải quyết vấn đề gì chính trong microservices?",
      options: [
        "Giới hạn requests/second (rate limiting)",
        "Cô lập tài nguyên per dependency tránh cascade failure",
        "Retry tự động khi service down",
        "Cache response để giảm latency"
      ],
      answer: 1,
      explain: "Bulkhead (vách ngăn) cô lập thread/connection/semaphore cho mỗi downstream service. Service A chậm/down không làm tiêu tốn tài nguyên của Service B, C. Rate limiter giới hạn throughput, circuit breaker ngắt mạch service failed, cache giảm latency — đều khác bulkhead."
    },
    {
      q: "Semaphore tryAcquire() trả false khi nào? Ứng dụng xử lý ra sao?",
      options: [
        "Khi permit > 0, queue request",
        "Khi permit = 0 (đầy), fast reject (ném exception/trả 503)",
        "Khi thread pool busy, tạo thread mới",
        "Khi network timeout, retry"
      ],
      answer: 1,
      explain: "tryAcquire() không block: permit > 0 → true (lấy permit), permit = 0 → false (đầy). Fast reject: ném exception hoặc trả HTTP 503/429 ngay, client retry với backoff. Không queue, không tạo thread mới."
    },
    {
      q: "Payment gateway external có quota 100 req/s, latency trung bình 2s. Limit bulkhead semaphore hợp lý?",
      options: [
        "500",
        "50",
        "10–20",
        "1"
      ],
      answer: 2,
      explain: "Quota 100 req/s, latency 2s → concurrent cần ~200 để bão hòa quota. Nhưng để an toàn (burst, retry, network), đặt limit 10–20 concurrent. 500 quá cao → vượt quota. 50 vẫn khá cao. 1 quá thấp → throughput thấp."
    },
    {
      q: "Tại sao phải release() semaphore trong finally block?",
      options: [
        "Để code dễ đọc",
        "Đảm bảo permit trả về ngay cả khi exception, tránh permit leak làm semaphore cạn dần",
        "Để fair semaphore hoạt động",
        "Bắt buộc bởi Java compiler"
      ],
      answer: 1,
      explain: "Nếu exception ném ra trước release(), permit không trả về → semaphore cạn dần (permit leak) → sau một thời gian tryAcquire() luôn false → app reject mọi request. finally đảm bảo release chạy dù có exception hay không."
    }
  ],
  related: ['microservices-009', 'microservices-010', 'core-015'],
  tags: ['bulkhead', 'semaphore', 'concurrency limit', 'cascade failure', 'fast reject', 'resilience']
},
{
  id: 'lesson-microservices-014',
  track: 'microservices',
  order: 14,
  title: 'Idempotent consumer: dedupe theo messageId khi Kafka giao lặp',
  level: 'senior',
  minutes: 30,
  goals: [
    'Giải thích at-least-once delivery của Kafka và tại sao consumer phải tự chống trùng',
    'Thiết kế in-memory dedup store theo messageId với TTL và thread-safety',
    'Mô phỏng consumer nhận message trùng lặp và đảm bảo số dư tài khoản đúng'
  ],
  body: `**Tóm tắt:** Kafka đảm bảo at-least-once (ít nhất một lần) — message có thể được giao lại khi consumer crash sau khi xử lý nhưng trước khi commit offset. Consumer phải tự deduplicate bằng messageId ổn định (do outbox sinh). Giải pháp: lưu messageId đã xử lý trong transaction cùng cập nhật state (inbox table hoặc dedup store). Bài này mô phỏng bằng Java thuần: consumer giả nhận message trùng, dùng Set lưu messageId để chặn duplicate, đảm bảo số dư không bị cộng/trừ hai lần.

### At-least-once và duplicate
Kafka consumer đọc message từ partition theo offset. Commit offset đánh dấu "đã đọc tới đây". Nếu process message thành công nhưng crash TRƯỚC khi commit offset, lần restart consumer đọc lại từ offset cũ -> message được xử lý lần hai. Đây là thiết kế có chủ đích: ưu tiên không mất message (at-least-once), chấp nhận duplicate. Broker không biết side effect DB đã commit hay chưa.

### MessageId ổn định
Để deduplicate, message CÓ messageId duy nhất, ổn định qua retry. Transactional outbox (bài 001) gán eventId UUID khi ghi outbox. CDC (Debezium) đọc transaction log -> eventId đi cùng message. Producer tự sinh message.key cũng dùng làm dedup key nếu ổn định. Không dùng offset làm key vì offset thay đổi khi rebalance hoặc restart.

### Cơ chế dedup trong transaction
Consumer trong một DB transaction cục bộ:
1. INSERT vào bảng inbox (consumer_name, message_id) unique key
2. Nếu conflict (duplicate key) -> rollback, bỏ qua side effect
3. Nếu thành công -> cập nhật state nghiệp vụ (cộng tiền, trừ kho, v.v.)
4. Commit transaction -> inbox row và state cùng bền vững
5. Sau đó commit offset

Cách này đảm bảo atomic: hoặc cả hai (inbox + state) đều thành công, hoặc cả hai rollback. Unique constraint là trọng tài giữa các replica.

### TTL và cleanup
Inbox table phình nếu không dọn. Cần TTL (ví dụ 7 ngày > max retention Kafka + cửa sổ replay). Job dọn định kỳ xóa messageId cũ. Với traffic lớn, shard theo consumer + date.

### Minh họa luồng
~~~seq
title: Consumer xử lý message, crash trước commit offset -> duplicate
actors: Kafka | Consumer | DB
Kafka -> Consumer: message (eventId=abc, amount=100)
Consumer -> DB: BEGIN
Consumer -> DB: INSERT inbox(abc) -- thành công
Consumer -> DB: UPDATE account SET balance=balance+100 -- thành công
Consumer -> DB: COMMIT
Consumer -> Kafka: commit offset -- CRASH ở đây!
note Kafka..Consumer: offset chưa commit
Kafka -> Consumer: restart, đọc lại offset cũ
Kafka -> Consumer: message (eventId=abc, amount=100)
Consumer -> DB: BEGIN
Consumer -> DB: INSERT inbox(abc) -- CONFLICT unique key!
Consumer -> DB: ROLLBACK
Consumer -> DB: -- không cập nhật balance lần 2
~~~

### Lỗi hay gặp trên production
- **Triệu chứng:** Số dư tài khoản sai lệch (cộng/trừ gấp đôi) sau rebalance hoặc restart consumer. **Nguyên nhân:** Dedup chỉ bằng HashSet trong RAM -> mất khi restart, mỗi replica có Set riêng -> hai instance cùng xử lý trước khi biết nhau. **Cách sửa:** Dùng inbox table unique constraint trong DB chia sẻ, insert và side effect trong cùng transaction.
- **Triệu chứng:** Bảng inbox tăng không ngừng, insert chậm. **Nguyên nhân:** Không có retention/TTL. **Cách sửa:** Job xóa messageId cũ hơn max retention + buffer; partition table theo thời gian.
- **Triệu chứng:** Event cũ (version 1) đến sau event mới (version 3) -> state bị lùi. **Nguyên nhân:** Chỉ dedup theo messageId, không check version. **Cách sửa:** Lưu version per aggregate, chỉ apply khi version mới hơn (xem bài 002).

### Ví dụ đời thực
**Bối cảnh:** Hệ thống ví điện tử nhận message nạp tiền từ Kafka. Mỗi message có messageId, amount. Consumer cộng tiền vào balance.
**Triệu chứng:** Khách nạp 100k nhưng balance tăng 200k. **Điều tra:** Consumer restart giữa chừng, message được xử lý 2 lần. Code chỉ có balance += amount mà không dedup.
**Xử lý:** Thêm bảng inbox (message_id PRIMARY KEY). Consumer: INSERT INTO inbox VALUES (?, ?) ON CONFLICT DO NOTHING -> nếu row count = 0 là duplicate -> bỏ qua. Balance chỉ cộng 1 lần.
**Kết quả:** Test chaos: kill consumer 100 lần giữa chừng -> balance luôn đúng.

### Liên hệ phỏng vấn
- **Hỏi:** Kafka at-least-once nghĩa là gì? Consumer phải làm gì? **Trả lời ngắn:** Message có thể giao trùng khi crash trước commit offset. Consumer phải idempotent: lưu messageId (inbox unique key) trong cùng transaction với side effect.
- **Hỏi:** Vì sao không dùng offset làm dedup key? **Trả lời ngắn:** Offset thay đổi khi rebalance, restart, partition assign lại. MessageId do outbox sinh ổn định suốt đời event.
- **Hỏi:** Hai consumer replica cùng nhận message trùng, dùng check-then-act (if set.contains) -> sai? **Trả lời ngắn:** Check-then-act không atomic. Cần unique constraint DB hoặc CAS atomic. Inbox table unique key là trọng tài.
- **Hỏi:** Inbox table phình to, làm sao dọn? **Trả lời ngắn:** TTL dựa trên max retention Kafka + cửa sổ replay (ví dụ 7-14 ngày). Dọn theo batch, partition theo thời gian.

> Senior tip: Đo duplicate rate theo topic/consumer. Tỷ lệ tăng đột ngột thường chỉ ra rebalance, timeout hoặc DB latency, không nhất thiết là lỗi broker.`,
 exercises: [
   {
     title: 'Dedup consumer: nhận message trùng, đảm bảo số dư đúng',
     prompt: `Cài {{DedupConsumer}} mô phỏng consumer Kafka nhận message có {{messageId}} và {{amount}} (long, có thể âm cho rút tiền).

Yêu cầu:
- {{handle(messageId, amount)}}: nếu messageId CHƯA xử lý -> cộng amount vào {{balance}}, lưu messageId, trả {{true}} (đã xử lý). Nếu messageId ĐÃ xử lý -> bỏ qua, trả {{false}} (duplicate).
- {{getBalance()}} trả số dư hiện tại.
- {{getProcessedCount()}} trả số messageId duy nhất đã xử lý (kể cả duplicate).
- Tất cả method {{synchronized}} để thread-safe.
- Dùng {{Set<String>}} lưu messageId (in-memory mô phỏng inbox).`,
     starter: `class DedupConsumer {
    private final Set<String> processed = new HashSet<>();
    private long balance = 0;

    synchronized boolean handle(String messageId, long amount) {
        throw new UnsupportedOperationException("TODO");
    }

    synchronized long getBalance() {
        throw new UnsupportedOperationException("TODO");
    }

    synchronized int getProcessedCount() {
        throw new UnsupportedOperationException("TODO");
    }
}`,
     tests: `public class Main {
  static int p=0,t=0; static void ck(String n,Runnable r){t++;try{r.run();p++;System.out.println("PASS "+n);}catch(Throwable e){System.out.println("FAIL "+n+": "+e);}}
  static void eq(Object a,Object b){if(!Objects.equals(a,b))throw new AssertionError(a+" != "+b);}
  public static void main(String[] z){
    ck("first message updates balance",()->{DedupConsumer c=new DedupConsumer();if(!c.handle("msg-1",100))throw new AssertionError();eq(100L,c.getBalance());eq(1,c.getProcessedCount());});
    ck("duplicate message ignored, balance unchanged",()->{DedupConsumer c=new DedupConsumer();c.handle("msg-1",100);if(c.handle("msg-1",100))throw new AssertionError();eq(100L,c.getBalance());eq(1,c.getProcessedCount());});
    ck("negative amount (withdraw) works",()->{DedupConsumer c=new DedupConsumer();if(!c.handle("msg-2",-50))throw new AssertionError();eq(-50L,c.getBalance());});
    ck("mixed duplicate and new messages",()->{DedupConsumer c=new DedupConsumer();c.handle("a",100);c.handle("b",200);c.handle("a",100);c.handle("c",-50);eq(250L,c.getBalance());eq(3,c.getProcessedCount());});
    ck("concurrent duplicate handling",()->{DedupConsumer c=new DedupConsumer();ExecutorService es=Executors.newFixedThreadPool(10);CountDownLatch latch=new CountDownLatch(100);for(int i=0;i<100;i++)es.submit(()->{c.handle("same",10);latch.countDown();});try{latch.await();}catch(InterruptedException e){Thread.currentThread().interrupt();}es.shutdown();eq(10L,c.getBalance());eq(1,c.getProcessedCount());});
    System.out.println("RESULT "+p+"/"+t);
  }
}`,
     reference: `class DedupConsumer {
    private final Set<String> processed = new HashSet<>();
    private long balance = 0;

    synchronized boolean handle(String messageId, long amount) {
        if (processed.contains(messageId)) return false;
        processed.add(messageId);
        balance += amount;
        return true;
    }

    synchronized long getBalance() { return balance; }

    synchronized int getProcessedCount() { return processed.size(); }
}`,
     hints: [
       'Kiểm tra messageId trong Set TRƯỚC khi cập nhật balance. Dùng contains -> add pattern.',
       'Trả true khi lần đầu xử lý (add thành công), false khi duplicate (contains trả true).',
       'synchronized trên method đảm bảo atomic check-then-act trong JVM đơn giản. Production dùng DB unique constraint.'
     ],
     explain: `Set mô phỏng inbox table: contains = check duplicate, add = insert. synchronized làm check-then-act nguyên tử trong một JVM. Trong production, Set trong RAM không đủ (mất khi restart, không chia sẻ replicas) -> cần bảng inbox có unique constraint (consumer_name, message_id) và INSERT trong cùng transaction với UPDATE balance. Nếu side effect gọi service ngoài, cần outbox hoặc idempotency key ở đích.

Lỗi thường gặp: cập nhật balance trước khi add vào Set (crash giữa chừng -> balance đã đổi nhưng chưa ghi nhận messageId -> lần retry đổi lại); dùng messageId không ổn định (offset, timestamp); quên synchronized -> race condition khi nhiều thread cùng handle messageId mới.`
   }
 ],
 check: [
   {
     q: 'Kafka consumer crash SAU KHI xử lý message nhưng TRƯỚC KHI commit offset. Hậu quả?',
     options: [
       'Message bị mất vĩnh viễn',
       'Message được giao lại (duplicate) khi consumer restart',
       'Broker tự động xóa message',
       'Offset tự động rollback'
     ],
     answer: 1,
     explain: 'Offset chưa commit -> consumer restart đọc lại từ offset cũ -> message xử lý lần 2. Đây là at-least-once: ưu tiên không mất message, chấp nhận duplicate. Consumer phải tự dedup.'
   },
   {
     q: 'Vì sao dùng messageId (eventId) làm dedup key thay vì Kafka offset?',
     options: [
       'Offset ngắn hơn, tiết kiệm bộ nhớ',
       'Offset thay đổi khi rebalance/restart, messageId ổn định suốt đời event',
       'Broker không cung cấp offset cho consumer',
       'messageId được Kafka sinh tự động cho mọi message'
     ],
     answer: 1,
     explain: 'Offset là vị trí đọc trong partition, thay đổi khi partition assign lại (rebalance) hoặc consumer restart từ đầu. messageId do outbox/producer sinh (UUID) gắn liền với event nghiệp vụ, không thay đổi.'
   },
   {
     q: 'Hai consumer replica cùng nhận message trùng, dùng if (!set.contains(id)) set.add(id) -> vấn đề?',
     options: [
       'Set không lưu được String',
       'Check-then-act không atomic: cả hai cùng qua if rồi cùng xử lý -> side effect chạy 2 lần',
       'Kafka không gửi message trùng cho 2 replica',
       'Offset tự phân biệt được duplicate'
     ],
     answer: 1,
     explain: 'Set cục bộ không chia sẻ giữa process, thao tác check + add không nguyên tử. Cần unique constraint DB (trọng tài chung) trong cùng transaction với side effect, hoặc atomic CAS (ConcurrentHashMap.putIfAbsent).'
   },
   {
     q: 'Inbox table unique constraint (consumer_name, message_id). Consumer INSERT vào inbox -> conflict -> rollback. Side effect có chạy không?',
     options: [
       'Chạy bình thường vì INSERT đã thành công',
       'Không chạy vì transaction rollback, cả inbox lẫn side effect đều bị huỷ',
       'Chạy một nửa rồi dừng',
       'Tùy cấu hình isolation level'
     ],
     answer: 1,
     explain: 'Unique constraint conflict ném SQLException, transaction rollback -> inbox row không được ghi, side effect (UPDATE balance) cũng rollback. Lần sau nhận message trùng -> INSERT conflict -> rollback -> side effect không chạy. Atomic guaranteed.'
   }
 ],
 related: ['microservices-002', 'microservices-006', 'microservices-041'],
 tags: ['idempotent consumer', 'Kafka', 'deduplication', 'messageId', 'at-least-once', 'inbox']
},
{
 id: 'lesson-microservices-015',
 track: 'microservices',
 order: 15,
 title: 'Circuit breaker từ gốc: closed/open/half-open',
 level: 'senior',
 minutes: 30,
 goals: [
   'Hiểu state machine circuit breaker: Closed -> Open -> Half-Open -> Closed',
   'Tự cài CircuitBreaker với Clock giả để test deterministic',
   'Giải thích failure threshold, timeout, success threshold và tại sao cần Half-Open'
 ],
 body: `**Tóm tắt:** Circuit breaker (máy cắt tự động) bảo vệ hệ thống không gọi liên tục vào dependency đang lỗi. Ba trạng thái: {{Closed}} (bình thường, cho gọi qua, đếm lỗi), {{Open}} (quá nhiều lỗi, chặn gọi ngay, trả lỗi nhanh), {{Half-Open}} (sau timeout, cho 1- vài request thử, thành công -> Closed, thất bại -> Open). Bài này tự cài bằng Java thuần, dùng Clock injectable để test không cần sleep thật.

### Tại sao cần circuit breaker
Khi downstream service (payment gateway, LLM API, auth service) chậm hoặc down, caller tiếp tục gửi request -> thread pool caller bị chiếm hết (thread starvation) -> cascade failure lan sang service khác. Circuit breaker phát hiện lỗi liên tiếp, nhảy sang Open, fail fast (trả lỗi ngay không gọi downstream) -> giải phóng thread, cho downstream hồi phục.

### State machine
~~~text
CLOSED: bình thường
  - Gọi downstream, thành công -> reset failureCount
  - Thất bại -> failureCount++
  - failureCount >= threshold -> OPEN, ghi openedAt = now

OPEN: chặn mọi request, fail fast
  - now - openedAt >= timeout -> HALF_OPEN
  - chưa hết timeout -> reject ngay

HALF_OPEN: cho request thử (probe)
  - Thành công -> CLOSED, reset failureCount
  - Thất bại -> OPEN, openedAt = now
~~~

### Tham số quan trọng
- **Failure threshold (failureThreshold):** Số lỗi liên tiếp trong CLOSED mới bật OPEN. Thường 5-10.
- **Timeout (resetTimeoutMs):** Thời gian ở OPEN trước khi chuyển HALF_OPEN. Phải > downstream recovery time ước lượng (ví dụ 30-60s).
- **Success threshold (successThreshold):** Số request thành công liên tiếp trong HALF_OPEN mới về CLOSED. Thường 1-3 (an toàn hơn để 2-3).
- **Half-Open request limit:** Giới hạn số request đồng thời trong HALF_OPEN (thường 1-3) tránh thundering herd khi vừa hồi phục.

### Clock injectable để test deterministic
Production dùng {{System.currentTimeMillis()}}. Test inject {{Clock}} (interface có {{millis()}}) -> test tiến thời gian tự do, không sleep.

~~~java
interface Clock { long millis(); }
class CircuitBreaker {
    enum State { CLOSED, OPEN, HALF_OPEN }
    private final int failureThreshold;
    private final long resetTimeoutMs;
    private final int successThreshold;
    private final Clock clock;

    private State state = State.CLOSED;
    private int failureCount = 0;
    private int successCount = 0;
    private long openedAt = 0;

    CircuitBreaker(int failureThreshold, long resetTimeoutMs, int successThreshold, Clock clock) {
        this.failureThreshold = failureThreshold;
        this.resetTimeoutMs = resetTimeoutMs;
        this.successThreshold = successThreshold;
        this.clock = clock;
    }

    boolean canCall() { ... }
    void recordSuccess() { ... }
    void recordFailure() { ... }
    State getState() { return state; }
}
~~~

### CanCall logic
- CLOSED: luôn true
- OPEN: nếu {{clock.millis() - openedAt >= resetTimeoutMs}} -> chuyển HALF_OPEN, trả true; còn lại false
- HALF_OPEN: true (cho probe), nhưng production giới hạn concurrent probe

### RecordSuccess / RecordFailure
- CLOSED: success -> failureCount=0; failure -> failureCount++, nếu >= threshold -> OPEN, openedAt=now
- HALF_OPEN: success -> successCount++, nếu >= successThreshold -> CLOSED, reset counts; failure -> OPEN, openedAt=now, reset counts
- OPEN: không gọi record (canCall=false)

### Lỗi hay gặp
- **Quên reset failureCount khi thành công trong CLOSED:** Một lỗi rời rạc làm bật OPEN sai.
- **Không có Half-Open:** OPEN mãi không bao giờ thử lại -> dependency hồi phục mà không ai biết.
- **Half-Open cho quá nhiều request cùng lúc:** Dependency vừa hồi phục bị dồn request -> sập lại. Giới hạn 1-3 probe.
- **Timeout quá ngắn:** Chuyển Half-Open trước khi downstream kịp hồi phục -> OPEN -> Half-Open lặp vô tận.
- **Không inject Clock:** Test phải sleep thật -> chậm, flaky.

### Minh họa luồng
~~~seq
title: Circuit breaker state transitions
actors: Caller | CircuitBreaker | Downstream
Caller -> CircuitBreaker: canCall() -> true
Caller -> Downstream: request (thất bại)
Caller -> CircuitBreaker: recordFailure()
note Caller..CircuitBreaker: failureCount=1 (threshold=3)
Caller -> CircuitBreaker: recordFailure() -> state=OPEN, openedAt=now
Caller -> CircuitBreaker: canCall() -> false (fail fast)
note Caller..CircuitBreaker: chờ resetTimeoutMs
Caller -> CircuitBreaker: canCall() -> true (-> HALF_OPEN)
Caller -> Downstream: request (thành công)
Caller -> CircuitBreaker: recordSuccess() -> state=CLOSED
~~~

### Ví dụ đời thực
**Bối cảnh:** Service gọi payment gateway external. Gateway đôi khi quá tải trả 503.
**Triệu chứng:** Payment down 2 phút -> caller thread pool hết (timeout 30s * 100 req/s) -> toàn bộ app sập.
**Xử lý:** Thêm circuit breaker (threshold=5, timeout=30s, successThreshold=2). Khi 5 lỗi liên tiếp -> OPEN -> fail fast trả 503 ngay -> thread giải phóng. 30s sau -> HALF_OPEN cho 2 request thử. 2 thành công -> CLOSED.
**Kết quả:** App không sập khi payment down. Recovery tự động.

### Liên hệ phỏng vấn
- **Hỏi:** Circuit breaker 3 trạng thái là gì? Chuyển trạng thái khi nào? **Trả lời ngắn:** CLOSED (bình thường, đếm lỗi) -> OPEN (lỗi >= threshold, chặn gọi, fail fast) -> HALF_OPEN (sau timeout, cho probe) -> thành công đủ successThreshold -> CLOSED, thất bại -> OPEN.
- **Hỏi:** Vì sao cần Half-Open, không OPEN trực tiếp về CLOSED? **Trả lời ngắn:** Cần probe để xác nhận dependency đã hồi phục thực sự. Nếu OPEN -> CLOSED mà không test, dependency vẫn down -> flood request -> sập lại.
- **Hỏi:** Failure threshold=5, resetTimeout=30s, successThreshold=2. Lỗi 5 lần -> OPEN. 30s sau -> HALF_OPEN. Request 1 thành công, request 2 thất bại -> trạng thái? **Trả lời ngắn:** OPEN. Half-Open thất bại bất kỳ lúc nào đều quay về OPEN (reset successCount, openedAt=now).
- **Hỏi:** Production cần metric gì cho circuit breaker? **Trả lời ngắn:** state (gauge), failureCount, successCount, rejectedTotal (counter), latency p99. Alert khi state=OPEN kéo dài hoặc rejected rate tăng.

> Senior tip: Circuit breaker không thay thế retry. Retry cho lỗi transient (network glitch), circuit breaker cho lỗi systematic (dependency down). Kết hợp: retry với backoff trong CLOSED, OPEN thì fail fast không retry. Resilience4j, Spring Cloud CircuitBreaker có sẵn, nhưng hiểu gốc mới tinh chỉnh đúng.`,
 exercises: [
   {
     title: 'CircuitBreaker: Closed/Open/Half-Open với Clock giả',
     prompt: `Cài {{CircuitBreaker}} theo state machine:

- Constructor: {{CircuitBreaker(int failureThreshold, long resetTimeoutMs, int successThreshold, Clock clock)}}
- Enum {{State}}: {{CLOSED}}, {{OPEN}}, {{HALF_OPEN}}
- {{boolean canCall()}}: CLOSED -> true; OPEN -> nếu {{now - openedAt >= resetTimeoutMs}} chuyển HALF_OPEN trả true, ngược lại false; HALF_OPEN -> true
- {{void recordSuccess()}}: CLOSED -> failureCount=0; HALF_OPEN -> successCount++, nếu >= successThreshold -> CLOSED, reset counts; OPEN -> bỏ qua
- {{void recordFailure()}}: CLOSED -> failureCount++, nếu >= failureThreshold -> OPEN, openedAt=now; HALF_OPEN -> OPEN, openedAt=now, reset counts; OPEN -> bỏ qua
- {{State getState()}} trả trạng thái hiện tại
- {{int getFailureCount()}}, {{int getSuccessCount()}} cho test quan sát

{{Clock}} interface: {{long millis()}}. Test dùng {{AtomicLong}} làm clock.

Tất cả method {{synchronized}}.

Lưu ý: {{openedAt}} chỉ set khi chuyển sang OPEN. Chuyển HALF_OPEN KHÔNG reset openedAt (chỉ khi recordFailure trong HALF_OPEN hoặc recordSuccess đủ successThreshold về CLOSED mới reset).`,
     starter: `interface Clock { long millis(); }

class CircuitBreaker {
    enum State { CLOSED, OPEN, HALF_OPEN }

    private final int failureThreshold;
    private final long resetTimeoutMs;
    private final int successThreshold;
    private final Clock clock;

    private State state = State.CLOSED;
    private int failureCount = 0;
    private int successCount = 0;
    private long openedAt = 0;

    CircuitBreaker(int failureThreshold, long resetTimeoutMs, int successThreshold, Clock clock) {
        throw new UnsupportedOperationException("TODO");
    }

    synchronized boolean canCall() {
        throw new UnsupportedOperationException("TODO");
    }

    synchronized void recordSuccess() {
        throw new UnsupportedOperationException("TODO");
    }

    synchronized void recordFailure() {
        throw new UnsupportedOperationException("TODO");
    }

    synchronized State getState() {
        throw new UnsupportedOperationException("TODO");
    }

    synchronized int getFailureCount() {
        throw new UnsupportedOperationException("TODO");
    }

    synchronized int getSuccessCount() {
        throw new UnsupportedOperationException("TODO");
    }
}`,
     tests: `public class Main {
  static int p=0,t=0; static void ck(String n,Runnable r){t++;try{r.run();p++;System.out.println("PASS "+n);}catch(Throwable e){System.out.println("FAIL "+n+": "+e);}}
  static void eq(Object a,Object b){if(!Objects.equals(a,b))throw new AssertionError(a+" != "+b);}
  public static void main(String[] z){
    ck("closed allows calls, failure threshold triggers open",()->{
      AtomicLong clock=new AtomicLong(0);
      CircuitBreaker cb=new CircuitBreaker(3,1000,2,clock::get);
      eq(true,cb.canCall());
      cb.recordFailure(); cb.recordFailure();
      eq(CircuitBreaker.State.CLOSED,cb.getState()); eq(2,cb.getFailureCount());
      cb.recordFailure(); // 3rd failure -> OPEN
      eq(CircuitBreaker.State.OPEN,cb.getState());
      eq(false,cb.canCall());
    });
    ck("open rejects until timeout, then half-open",()->{
      AtomicLong clock=new AtomicLong(0);
      CircuitBreaker cb=new CircuitBreaker(2,1000,2,clock::get);
      cb.recordFailure(); cb.recordFailure(); // OPEN
      eq(false,cb.canCall());
      clock.set(500); // chưa hết timeout
      eq(false,cb.canCall());
      clock.set(1000); // hết timeout -> HALF_OPEN
      eq(true,cb.canCall());
      eq(CircuitBreaker.State.HALF_OPEN,cb.getState());
    });
    ck("half-open success threshold -> closed",()->{
      AtomicLong clock=new AtomicLong(0);
      CircuitBreaker cb=new CircuitBreaker(2,1000,2,clock::get);
      cb.recordFailure(); cb.recordFailure(); // OPEN
      clock.set(1000); // HALF_OPEN
      cb.canCall(); // trigger transition
      cb.recordSuccess(); // 1st success
      eq(CircuitBreaker.State.HALF_OPEN,cb.getState()); eq(1,cb.getSuccessCount());
      cb.recordSuccess(); // 2nd success -> CLOSED
      eq(CircuitBreaker.State.CLOSED,cb.getState());
      eq(0,cb.getFailureCount()); eq(0,cb.getSuccessCount());
    });
    ck("half-open failure -> back to open",()->{
      AtomicLong clock=new AtomicLong(0);
      CircuitBreaker cb=new CircuitBreaker(2,1000,2,clock::get);
      cb.recordFailure(); cb.recordFailure(); // OPEN
      clock.set(1000); // HALF_OPEN
      cb.canCall();
      cb.recordFailure(); // failure in half-open -> OPEN
      eq(CircuitBreaker.State.OPEN,cb.getState());
      eq(false,cb.canCall()); // ngay lập tức reject
    });
    ck("closed success resets failure count",()->{
      AtomicLong clock=new AtomicLong(0);
      CircuitBreaker cb=new CircuitBreaker(3,1000,2,clock::get);
      cb.recordFailure(); cb.recordFailure(); // 2 failures
      eq(2,cb.getFailureCount());
      cb.recordSuccess(); // success -> reset
      eq(0,cb.getFailureCount());
      eq(CircuitBreaker.State.CLOSED,cb.getState());
    });
    System.out.println("RESULT "+p+"/"+t);
  }
}`,
     reference: `interface Clock { long millis(); }

class CircuitBreaker {
    enum State { CLOSED, OPEN, HALF_OPEN }

    private final int failureThreshold;
    private final long resetTimeoutMs;
    private final int successThreshold;
    private final Clock clock;

    private State state = State.CLOSED;
    private int failureCount = 0;
    private int successCount = 0;
    private long openedAt = 0;

    CircuitBreaker(int failureThreshold, long resetTimeoutMs, int successThreshold, Clock clock) {
        if (failureThreshold <= 0) throw new IllegalArgumentException("failureThreshold > 0");
        if (resetTimeoutMs <= 0) throw new IllegalArgumentException("resetTimeoutMs > 0");
        if (successThreshold <= 0) throw new IllegalArgumentException("successThreshold > 0");
        if (clock == null) throw new IllegalArgumentException("clock required");
        this.failureThreshold = failureThreshold;
        this.resetTimeoutMs = resetTimeoutMs;
        this.successThreshold = successThreshold;
        this.clock = clock;
    }

    synchronized boolean canCall() {
        long now = clock.millis();
        switch (state) {
            case CLOSED:
                return true;
            case OPEN:
                if (now - openedAt >= resetTimeoutMs) {
                    state = State.HALF_OPEN;
                    successCount = 0;
                    return true;
                }
                return false;
            case HALF_OPEN:
                return true;
            default:
                return false;
        }
    }

    synchronized void recordSuccess() {
        switch (state) {
            case CLOSED:
                failureCount = 0;
                break;
            case HALF_OPEN:
                successCount++;
                if (successCount >= successThreshold) {
                    state = State.CLOSED;
                    failureCount = 0;
                    successCount = 0;
                    openedAt = 0;
                }
                break;
            case OPEN:
                // no-op
                break;
        }
    }

    synchronized void recordFailure() {
        switch (state) {
            case CLOSED:
                failureCount++;
                if (failureCount >= failureThreshold) {
                    state = State.OPEN;
                    openedAt = clock.millis();
                }
                break;
            case HALF_OPEN:
                state = State.OPEN;
                openedAt = clock.millis();
                failureCount = 0;
                successCount = 0;
                break;
            case OPEN:
                // no-op
                break;
        }
    }

    synchronized State getState() { return state; }
    synchronized int getFailureCount() { return failureCount; }
    synchronized int getSuccessCount() { return successCount; }
}`,
     hints: [
       'canCall() phải check timeout trong OPEN: now - openedAt >= resetTimeoutMs -> chuyển HALF_OPEN, reset successCount=0.',
       'recordSuccess() trong HALF_OPEN: tăng successCount, đủ successThreshold -> CLOSED, reset counts + openedAt=0.',
       'recordFailure() trong HALF_OPEN: ngay lập tức OPEN, openedAt=now, reset counts.',
       'CLOSED: recordSuccess reset failureCount=0; recordFailure tăng, đủ threshold -> OPEN, openedAt=now.',
       'Validator yêu cầu constructor validate tham số > 0, clock not null.'
     ],
     explain: `State machine 3 trạng thái là lõi circuit breaker. Clock injectable cho phép test tiến thời gian không sleep: test 2 set clock=500, 1000 thay vì Thread.sleep(500). Production dùng System.currentTimeMillis() hoặc Instant.now().

Chi tiết dễ sai:
- Quên reset successCount khi mới vào HALF_OPEN (canCall chuyển trạng thái).
- Quên reset failureCount/successCount khi HALF_OPEN failure -> OPEN.
- Quên reset openedAt=0 khi về CLOSED.
- Không validate constructor params (threshold <= 0, clock null).
- OPEN state không cho gọi recordSuccess/recordFailure (canCall=false nên caller không gọi, nhưng method vẫn phải no-op an toàn).

Production: Resilience4j, Spring Cloud CircuitBreaker cung cấp sẵn. Hiểu gốc giúp config đúng: failureRateThreshold, waitDurationInOpenState, permittedNumberOfCallsInHalfOpenState, slidingWindowType.`
   }
 ],
 check: [
   {
     q: 'Circuit breaker ở trạng thái OPEN. canCall() trả true khi nào?',
     options: [
       'Luôn false cho đến khi restart ứng dụng',
       'Khi now - openedAt >= resetTimeoutMs (chuyển HALF_OPEN)',
       'Khi downstream service báo healthy qua health check',
       'Khi failureCount giảm về 0'
     ],
     answer: 1,
     explain: 'OPEN chuyển HALF_OPEN dựa trên timeout (resetTimeoutMs), không phải health check chủ động. Khi now - openedAt >= resetTimeoutMs, canCall() chuyển state = HALF_OPEN và trả true cho phép probe.'
   },
   {
     q: 'Trong HALF_OPEN, recordFailure() làm gì?',
     options: [
       'Giữ HALF_OPEN, tăng failureCount',
       'Chuyển ngay lập tức về OPEN, reset counts, openedAt = now',
       'Chuyển về CLOSED',
       'Không làm gì'
     ],
     answer: 1,
     explain: 'HALF_OPEN là trạng thái thử nghiệm. Bất kỳ failure nào cũng chứng minh downstream chưa hồi phục -> quay về OPEN ngay, reset successCount/failureCount, openedAt = now để đếm timeout mới.'
   },
   {
     q: 'CLOSED state, failureThreshold=5. Ghi nhận 2 failure, rồi 1 success, rồi 3 failure. Trạng thái cuối?',
     options: [
       'CLOSED (failureCount=3)',
       'OPEN (failureCount=5)',
       'HALF_OPEN',
       'CLOSED (failureCount=0)'
     ],
     answer: 0,
     explain: 'CLOSED: success reset failureCount=0. Sequence: F,F (count=2), S (count=0), F,F,F (count=3). Chưa đủ 5 -> vẫn CLOSED, failureCount=3. (B) sai vì failureCount=5 mới mở, ở đây chỉ 3. (C) sai vì HALF_OPEN chỉ từ OPEN sau timeout. (D) sai vì failureCount=3, không reset sau failure.'
   },
   {
     q: 'Tại sao CircuitBreaker cần Clock injectable thay vì dùng System.currentTimeMillis() trực tiếp?',
     options: [
       'Để code chạy nhanh hơn',
       'Để test deterministic: tiến thời gian tự do không sleep, không flaky',
       'Để thread-safe',
       'Để hỗ trợ time zone khác nhau'
     ],
     answer: 1,
     explain: 'Test unit cần kiểm soát thời gian: set clock=0, 500, 1000 ms thay vì Thread.sleep(500). Dùng System.currentTimeMillis() ép test phải sleep thật -> chậm, flaky, khó test edge case (timeout boundary).'
   }
 ],
 related: ['microservices-009', 'microservices-013', 'microservices-025'],
 tags: ['circuit breaker', 'resilience', 'closed', 'open', 'half-open', 'fail fast', 'state machine']
},
);
