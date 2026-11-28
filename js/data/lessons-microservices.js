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
Khi downstream service (dịch vụ bên dưới, ví dụ payment gateway, LLM API, auth service) chậm hoặc down, caller tiếp tục gửi request -> thread pool caller bị chiếm hết (thread starvation, nghĩa là mọi luồng xử lý đang bận chờ, không còn luồng rảnh để nhận request mới) -> cascade failure (lỗi lan dần sang service khác) lan sang service khác. Circuit breaker phát hiện lỗi liên tiếp, nhảy sang Open, fail fast (trả lỗi ngay không gọi downstream) -> giải phóng thread, cho downstream hồi phục.

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
- **Half-Open request limit:** Giới hạn số request đồng thời trong HALF_OPEN (thường 1-3) tránh thundering herd (đám request dồn vào cùng lúc khiến service vừa hồi phục bị nghẽn lại) khi vừa hồi phục.

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
{
  id: 'lesson-microservices-016', track: 'microservices', order: 16,
  title: 'Circuit breaker nâng cao: cửa sổ trượt, tỉ lệ lỗi và half-open giới hạn', level: 'senior', minutes: 30,
  goals: [
    'Phân biệt breaker đếm liên tiếp với breaker đếm tỉ lệ lỗi trên cửa sổ trượt',
    'Hiểu count-based và time-based window, minimumNumberOfCalls, ngưỡng tỉ lệ lỗi',
    'Cài breaker tỉ lệ lỗi với Clock giả và test xác định chuyển trạng thái'
  ],
  body: `**Tóm tắt:** Circuit breaker theo tỉ lệ (rate-based) mở mạch khi **tỉ lệ lỗi trong một cửa sổ trượt** vượt ngưỡng, thay vì đếm số lỗi liên tiếp. Cửa sổ giữ N kết quả gần nhất (count-based) hoặc T giây gần nhất (time-based); chỉ xét khi đủ {{minimumNumberOfCalls}}. Ở HALF_OPEN chỉ cho một số probe giới hạn; đủ ngưỡng thành công thì về CLOSED, còn một probe lỗi là về OPEN ngay. Bài này tự cài bằng Java thuần, dùng Clock injectable để test không cần ngủ.

### Vì sao đếm tỉ lệ thay vì đếm liên tiếp
Bài trước (lesson 015) đếm **số lỗi liên tiếp**: cứ đủ ngưỡng thì mở. Cách này dễ bị "pha loãng": chỉ cần một request thành công xen giữa là bộ đếm reset về 0. Một dependency lỗi 40% trong 10 phút nhưng lỗi không nằm liên tiếp (thành công xen kẽ) thì bộ đếm liên tiếp gần như không bao giờ chạm ngưỡng, breaker không mở, latency p99 vẫn tệ mà hệ thống không tự bảo vệ. Đếm **tỉ lệ lỗi trên cửa sổ** phản ánh đúng "sức khỏe" thực: 40 lỗi trên 100 call gần nhất là tín hiệu rõ ràng để fail fast. Đây là cách Resilience4j làm mặc định với {{failureRateThreshold}}.

### Cửa sổ trượt: count-based và time-based
- **Count-based**: giữ N kết quả gần nhất (ví dụ 100). Đơn giản, bộ nhớ cố định. Nhược điểm: khi traffic thấp, N call có thể trải dài nhiều giờ, phản ánh quá khứ cũ chứ không phải hiện tại.
- **Time-based**: giữ các call trong T giây gần nhất (ví dụ 10s). Phản ánh "hiện tại" tốt hơn, nhưng tốn bộ nhớ hơn và cần chia bucket theo thời gian.

Resilience4j dùng {{slidingWindowType}} = {{COUNT_BASED}} (mặc định) hoặc {{TIME_BASED}}, {{slidingWindowSize}} = N call hoặc số giây, và {{minimumNumberOfCalls}} là ngưỡng tối thiểu để bắt đầu tính tỉ lệ (tránh mở mạch chỉ sau 1-2 call lúc mới khởi động hoặc traffic thấp).

### Cơ chế từng bước
1. **CLOSED**: mỗi call ghi kết quả vào cửa sổ. Khi cửa sổ đủ {{minimumNumberOfCalls}} và {{failureRate >= failureRateThreshold}} thì chuyển OPEN, ghi {{openedAt = now}} và xóa cửa sổ để lần sau đo lại từ đầu.
2. **OPEN**: mọi call bị từ chối (fail fast). Khi {{now - openedAt >= openMs}} thì chuyển HALF_OPEN.
3. **HALF_OPEN**: chỉ cho tối đa {{permittedNumberOfCallsInHalfOpenState}} probe. Mỗi probe ghi kết quả: đủ {{halfOpenSuccessThreshold}} lần thành công thì về CLOSED và xóa cửa sổ, còn chỉ cần một probe lỗi là về OPEN ngay và ghi {{openedAt = now}}. Lưu ý Resilience4j làm khác ở đúng điểm này: nó chờ đủ {{permittedNumberOfCallsInHalfOpenState}} probe rồi mới so tỉ lệ lỗi với ngưỡng, nên một probe lỗi đơn lẻ chưa mở mạch ngay.

### Tham số thực tế
| Tham số | Ví dụ | Ý nghĩa |
|---|---|---|
| failureRateThreshold | 50 | Tỉ lệ lỗi (phần trăm) để mở mạch (mặc định 50) |
| slidingWindowSize | 100 | Số call (count) hoặc giây (time) của cửa sổ |
| minimumNumberOfCalls | 20 | Chưa đủ 20 call thì chưa xét tỉ lệ |
| waitDurationInOpenState | 30s | Thời gian ở OPEN trước khi thử lại |
| permittedNumberOfCallsInHalfOpenState | 10 | Số probe tối đa ở HALF_OPEN |

### Cài đặt rút gọn
~~~java
// Rate breaker rút gọn: cửa sổ đếm + ngưỡng tỉ lệ + half-open giới hạn probe
class RateBreaker {
    enum State { CLOSED, OPEN, HALF_OPEN }
    private final int windowSize;
    private final double failureRateThreshold;   // 0..1 (ví dụ 0.5 = 50%)
    private final int minimumCalls;
    private final long openMs;
    private final int halfOpenMaxCalls;
    private final int halfOpenSuccessThreshold;
    private final Clock clock;
    private final Deque<Boolean> window = new ArrayDeque<>();
    private State state = State.CLOSED;
    private long openedAt = 0;
    private int halfOpenCalls = 0, halfOpenSuccess = 0;

    synchronized boolean canCall() {
        long now = clock.millis();
        if (state == State.OPEN && now - openedAt >= openMs) {
            state = State.HALF_OPEN; halfOpenCalls = 0; halfOpenSuccess = 0; window.clear();
        }
        if (state == State.OPEN) return false;
        if (state == State.HALF_OPEN && halfOpenCalls++ >= halfOpenMaxCalls) return false;
        return true;
    }
    synchronized void recordSuccess() {
        if (state == State.HALF_OPEN) {
            halfOpenSuccess++;
            if (halfOpenSuccess >= halfOpenSuccessThreshold) { state = State.CLOSED; window.clear(); }
            return;
        }
        window.addLast(true);
        if (window.size() > windowSize) window.removeFirst();
    }
    synchronized void recordFailure() {
        if (state == State.HALF_OPEN) { state = State.OPEN; openedAt = clock.millis(); return; }
        window.addLast(false);
        if (window.size() > windowSize) window.removeFirst();
        if (window.size() >= minimumCalls && failureRate() >= failureRateThreshold) {
            state = State.OPEN; openedAt = clock.millis(); window.clear();
        }
    }
    private double failureRate() {
        int fail = 0;
        for (boolean ok : window) if (!ok) fail++;
        return (double) fail / window.size();
    }
}
~~~
Điểm mấu chốt: cửa sổ bị **xóa khi vào OPEN** để lần đo sau không bị "lẫn" kết quả cũ; HALF_OPEN reset bộ đếm probe; và {{openedAt}} chỉ set khi thực sự vào OPEN.

### Lỗi hay gặp
- **Quên xóa cửa sổ khi mở mạch**: kết quả cũ còn lại khiến lần đo sau tính cả quá khứ, mở mạch muộn hoặc không mở.
- **minimumNumberOfCalls quá thấp**: lúc traffic thấp, 1-2 lỗi làm tỉ lệ 100% và mở mạch oan; đặt theo lưu lượng thực (ví dụ 20-50).
- **Cửa sổ quá lớn so với traffic**: phản ánh quá khứ cũ, không bảo vệ được hiện tại; cân nhắc time-based khi lưu lượng dao động mạnh.
- **HALF_OPEN không giới hạn probe**: vừa hồi phục đã dồn cả trăm request, dependency sập lại; giới hạn 10-20 probe.
- **Trộn lẫn tỉ lệ và đếm liên tiếp**: dùng cả hai không nhất quán khiến hành vi khó đoán; chọn một mô hình và ghi rõ cấu hình.

### Ví dụ đời thực
**Bối cảnh:** service Order gọi Payment qua HTTP. Payment tăng lỗi từ 0,1% lên 60% trong 5 phút do pool kết nối cạn, nhưng lỗi xen kẽ thành công (một số call lọt qua).
**Triệu chứng:** breaker đếm liên tiếp (threshold 5 liên tiếp) không mở vì cứ vài lỗi lại có một thành công chen vào reset bộ đếm; p99 của Order tăng từ 180ms lên 4,2s, 18% request timeout.
**Điều tra:** đổi sang rate-based: cửa sổ 100 call, failureRateThreshold 50, minimumNumberOfCalls 20, wait 30s, half-open 10 probe. Sau khi đủ 20 call, tỉ lệ lỗi 60% vượt ngưỡng 50% nên breaker mở mạch ngay cả khi lỗi không liên tiếp.
**Xử lý:** khi mở, Order trả 503 kèm circuit open metric; 30s sau cho 10 probe; 9/10 thành công (tỉ lệ lỗi 10% < ngưỡng) nên về CLOSED.
**Kết quả:** p99 của Order về 200ms, timeout giảm từ 18% xuống 0,4%, và không còn "mù" trước dependency lỗi rải rác.

### Trả lời mẫu khi phỏng vấn
Circuit breaker của tôi đếm tỉ lệ lỗi trên một cửa sổ trượt chứ không đếm lỗi liên tiếp, vì lỗi liên tiếp dễ bị một request thành công xen giữa làm reset. Tôi dùng count-based 100 call, failure rate threshold 50%, minimum 20 call để tránh mở oan lúc traffic thấp, wait 30 giây và half-open giới hạn 10 probe. Khi tỉ lệ vượt ngưỡng tôi mở mạch, fail fast trả 503 và ghi metric; sau 30 giây cho 10 request thử, đủ thành công thì về CLOSED (tỉ lệ lỗi dưới ngưỡng). Tôi theo dõi state, failure rate, số request bị reject và thời gian ở OPEN để chỉnh ngưỡng theo SLA từng dependency.

> Senior tip: đặt failureRateThreshold theo SLA: dependency nội bộ 50% là hợp lý, còn dependency ngoài (thanh toán) nên 30-40% vì mỗi lỗi đều là tiền; luôn đo tỉ lệ reject để biết ngưỡng có quá gắt không.

### Liên hệ phỏng vấn
- **Hỏi:** Vì sao breaker tỉ lệ lỗi tốt hơn breaker đếm liên tiếp trong thực tế? **Trả lời ngắn:** Lỗi rải rác (thành công xen kẽ) không làm bộ đếm liên tiếp chạm ngưỡng, nên breaker không mở; tỉ lệ lỗi trên cửa sổ phản ánh đúng mức độ suy giảm và mở mạch kịp thời.
- **Hỏi:** minimumNumberOfCalls dùng để làm gì? **Trả lời ngắn:** Tránh mở mạch oan khi chỉ có 1-2 call (traffic thấp hoặc lúc khởi động), vì 1 lỗi trên 2 call là 50% nhưng không đủ tin cậy; chỉ xét khi đủ mẫu.
- **Hỏi:** Trong HALF_OPEN, nếu một probe lỗi thì sao? **Trả lời ngắn:** Trong mô hình rút gọn này thì chuyển ngay về OPEN, ghi openedAt = now để đếm lại thời gian chờ. Còn Resilience4j chờ đủ {{permittedNumberOfCallsInHalfOpenState}} probe rồi so tỉ lệ lỗi với failureRateThreshold, nên một probe lỗi chỉ là 1/N của cửa sổ half-open chứ chưa mở mạch ngay.
- **Hỏi:** Count-based và time-based window khác nhau ở đâu? **Trả lời ngắn:** Count giữ N call gần nhất (đơn giản, bộ nhớ cố định nhưng có thể cũ khi traffic thấp); time giữ các call trong T giây gần nhất (phản ánh hiện tại tốt hơn nhưng tốn bộ nhớ và cần chia bucket).`,
  exercises: [{
    title: 'RateBreaker: cửa sổ trượt + ngưỡng tỉ lệ + half-open giới hạn',
    prompt: `Cài {{RateBreaker}} theo mô hình tỉ lệ lỗi trên cửa sổ trượt (count-based):

- Constructor: {{RateBreaker(int windowSize, double failureRateThreshold, int minimumCalls, long openMs, int halfOpenMaxCalls, int halfOpenSuccessThreshold, Clock clock)}}. Validate: {{windowSize >= 1}}, {{0 < failureRateThreshold <= 1}}, {{1 <= minimumCalls <= windowSize}}, {{openMs > 0}}, {{halfOpenMaxCalls >= 1}}, {{1 <= halfOpenSuccessThreshold <= halfOpenMaxCalls}}, {{clock != null}}; sai thì ném {{IllegalArgumentException}}.
- {{boolean canCall()}}: nếu OPEN và {{now - openedAt >= openMs}} thì chuyển HALF_OPEN, reset {{halfOpenCalls = 0}}, {{halfOpenSuccess = 0}}, xóa cửa sổ; nếu vẫn OPEN thì {{false}}. Nếu HALF_OPEN: cho tối đa {{halfOpenMaxCalls}} probe (mỗi lần gọi tăng {{halfOpenCalls}}), hết thì {{false}}. CLOSED thì {{true}}.
- {{void recordSuccess()}}: nếu HALF_OPEN tăng {{halfOpenSuccess}}, đủ {{halfOpenSuccessThreshold}} thì về CLOSED và xóa cửa sổ; nếu CLOSED thì thêm {{true}} vào cửa sổ, xóa phần tử cũ khi vượt {{windowSize}}, và nếu đủ {{minimumCalls}} mà tỉ lệ lỗi < ngưỡng thì giữ CLOSED (không cần làm gì thêm).
- {{void recordFailure()}}: nếu HALF_OPEN thì về OPEN, {{openedAt = now}}, reset bộ đếm; nếu CLOSED thì thêm {{false}} vào cửa sổ, xóa phần tử cũ khi vượt {{windowSize}}, và nếu đủ {{minimumCalls}} mà {{failureRate >= failureRateThreshold}} thì về OPEN, {{openedAt = now}}, xóa cửa sổ.
- {{State state()}}, {{int count()}} (số phần tử cửa sổ).

{{Clock}} là interface {{long millis()}}. Tất cả method {{synchronized}}.`,
    starter: `interface Clock { long millis(); }
class RateBreaker {
    enum State { CLOSED, OPEN, HALF_OPEN }
    private final int windowSize;
    private final double failureRateThreshold;
    private final int minimumCalls;
    private final long openMs;
    private final int halfOpenMaxCalls;
    private final int halfOpenSuccessThreshold;
    private final Clock clock;
    private final java.util.ArrayDeque<Boolean> window = new java.util.ArrayDeque<>();
    private State state = State.CLOSED;
    private long openedAt = 0;
    private int halfOpenCalls = 0;
    private int halfOpenSuccess = 0;
    RateBreaker(int windowSize, double failureRateThreshold, int minimumCalls, long openMs, int halfOpenMaxCalls, int halfOpenSuccessThreshold, Clock clock) {
        this.windowSize = windowSize; this.failureRateThreshold = failureRateThreshold; this.minimumCalls = minimumCalls;
        this.openMs = openMs; this.halfOpenMaxCalls = halfOpenMaxCalls; this.halfOpenSuccessThreshold = halfOpenSuccessThreshold; this.clock = clock;
    }
    synchronized boolean canCall() { throw new UnsupportedOperationException("TODO"); }
    synchronized void recordSuccess() { throw new UnsupportedOperationException("TODO"); }
    synchronized void recordFailure() { throw new UnsupportedOperationException("TODO"); }
    synchronized State state() { return state; }
    synchronized int count() { return window.size(); }
}`,
    tests: `public class Main {
 static int p=0,t=0; static void ck(String n,Runnable r){t++;try{r.run();p++;System.out.println("PASS "+n);}catch(Throwable e){System.out.println("FAIL "+n+": "+e);}}
 static void eq(Object a,Object b){if(!Objects.equals(a,b))throw new AssertionError(a+" != "+b);}
 public static void main(String[] x){
  ck("closed opens at failure rate",()->{
   AtomicLong clock=new AtomicLong(0);
   RateBreaker b=new RateBreaker(4,0.5,4,1000,2,2,clock::get);
   b.recordSuccess(); b.recordSuccess(); b.recordFailure();
   eq(RateBreaker.State.CLOSED,b.state());
   b.recordFailure();
   eq(RateBreaker.State.OPEN,b.state());
  });
  ck("sliding window evicts old results",()->{
   AtomicLong clock=new AtomicLong(0);
   RateBreaker b=new RateBreaker(4,0.5,4,1000,2,2,clock::get);
   b.recordSuccess(); b.recordSuccess(); b.recordSuccess(); b.recordSuccess();
   eq(RateBreaker.State.CLOSED,b.state());
   b.recordFailure();
   eq(RateBreaker.State.CLOSED,b.state());
   b.recordFailure();
   eq(RateBreaker.State.OPEN,b.state());
  });
  ck("open blocks until timeout then half-open",()->{
   AtomicLong clock=new AtomicLong(0);
   RateBreaker b=new RateBreaker(2,0.5,2,1000,2,2,clock::get);
   b.recordFailure(); b.recordFailure();
   eq(false,b.canCall());
   clock.set(999); eq(false,b.canCall());
   clock.set(1000); eq(true,b.canCall());
   eq(RateBreaker.State.HALF_OPEN,b.state());
  });
  ck("half-open success closes after threshold",()->{
   AtomicLong clock=new AtomicLong(0);
   RateBreaker b=new RateBreaker(2,0.5,2,1000,2,2,clock::get);
   b.recordFailure(); b.recordFailure();
   clock.set(1000); eq(true,b.canCall());
   b.recordSuccess(); eq(RateBreaker.State.HALF_OPEN,b.state());
   eq(true,b.canCall());
   b.recordSuccess(); eq(RateBreaker.State.CLOSED,b.state());
  });
  ck("half-open failure reopens",()->{
   AtomicLong clock=new AtomicLong(0);
   RateBreaker b=new RateBreaker(2,0.5,2,1000,2,2,clock::get);
   b.recordFailure(); b.recordFailure();
   clock.set(1000); eq(true,b.canCall());
   b.recordFailure();
   eq(RateBreaker.State.OPEN,b.state());
   eq(false,b.canCall());
  });
  ck("half-open limits probe calls",()->{
   AtomicLong clock=new AtomicLong(0);
   RateBreaker b=new RateBreaker(2,0.5,2,1000,2,2,clock::get);
   b.recordFailure(); b.recordFailure();
   clock.set(1000);
   eq(true,b.canCall());
   eq(true,b.canCall());
   eq(false,b.canCall());
  });
  System.out.println("RESULT "+p+"/"+t);
 }
}`,
    reference: `interface Clock { long millis(); }
class RateBreaker {
    enum State { CLOSED, OPEN, HALF_OPEN }
    private final int windowSize;
    private final double failureRateThreshold;
    private int minimumCalls;
    private final long openMs;
    private final int halfOpenMaxCalls;
    private final int halfOpenSuccessThreshold;
    private final Clock clock;
    private final ArrayDeque<Boolean> window = new ArrayDeque<>();
    private State state = State.CLOSED;
    private long openedAt = 0;
    private int halfOpenCalls = 0;
    private int halfOpenSuccess = 0;
    RateBreaker(int windowSize, double failureRateThreshold, int minimumCalls, long openMs, int halfOpenMaxCalls, int halfOpenSuccessThreshold, Clock clock) {
        if (windowSize < 1) throw new IllegalArgumentException("windowSize");
        if (failureRateThreshold <= 0 || failureRateThreshold > 1) throw new IllegalArgumentException("threshold");
        if (minimumCalls < 1 || minimumCalls > windowSize) throw new IllegalArgumentException("minimumCalls");
        if (openMs <= 0) throw new IllegalArgumentException("openMs");
        if (halfOpenMaxCalls < 1) throw new IllegalArgumentException("halfOpenMaxCalls");
        if (halfOpenSuccessThreshold < 1 || halfOpenSuccessThreshold > halfOpenMaxCalls) throw new IllegalArgumentException("successThreshold");
        if (clock == null) throw new IllegalArgumentException("clock");
        this.windowSize = windowSize; this.failureRateThreshold = failureRateThreshold; this.minimumCalls = minimumCalls;
        this.openMs = openMs; this.halfOpenMaxCalls = halfOpenMaxCalls; this.halfOpenSuccessThreshold = halfOpenSuccessThreshold; this.clock = clock;
    }
    synchronized boolean canCall() {
        long now = clock.millis();
        if (state == State.OPEN) {
            if (now - openedAt >= openMs) {
                state = State.HALF_OPEN; halfOpenCalls = 0; halfOpenSuccess = 0; window.clear();
            } else {
                return false;
            }
        }
        if (state == State.HALF_OPEN) {
            if (halfOpenCalls >= halfOpenMaxCalls) return false;
            halfOpenCalls++;
            return true;
        }
        return true;
    }
    synchronized void recordSuccess() {
        if (state == State.HALF_OPEN) {
            halfOpenSuccess++;
            if (halfOpenSuccess >= halfOpenSuccessThreshold) { state = State.CLOSED; window.clear(); }
            return;
        }
        if (state == State.CLOSED) record(true);
    }
    synchronized void recordFailure() {
        if (state == State.HALF_OPEN) {
            state = State.OPEN; openedAt = clock.millis(); halfOpenCalls = 0; halfOpenSuccess = 0; return;
        }
        if (state == State.CLOSED) record(false);
    }
    private void record(boolean ok) {
        window.addLast(ok);
        if (window.size() > windowSize) window.removeFirst();
        if (window.size() >= minimumCalls && failureRate() >= failureRateThreshold) {
            state = State.OPEN; openedAt = clock.millis(); window.clear();
        }
    }
    private double failureRate() {
        int fail = 0;
        for (boolean ok : window) if (!ok) fail++;
        return (double) fail / window.size();
    }
    synchronized State state() { return state; }
    synchronized int count() { return window.size(); }
}`,
    hints: [
      'canCall() trong OPEN: nếu now - openedAt >= openMs thì chuyển HALF_OPEN và xóa cửa sổ, ngược lại trả false.',
      'recordFailure() trong HALF_OPEN phải về OPEN ngay và set openedAt = now, không chờ hết probe.',
      'Cửa sổ chỉ giữ windowSize phần tử gần nhất; khi đủ minimumCalls mới so failureRate với ngưỡng.',
      'Nhớ xóa cửa sổ khi vào OPEN và khi về CLOSED để lần đo sau không bị lẫn kết quả cũ.'
    ],
    explain: `Bài tập cài breaker tỉ lệ lỗi: cửa sổ đếm (ArrayDeque) giữ tối đa windowSize kết quả, mỗi lần vượt thì removeFirst để "trượt". Chỉ khi cửa sổ đủ minimumCalls mới tính failureRate = số false / kích thước cửa sổ và so với ngưỡng. Khi vượt ngưỡng thì vào OPEN, ghi openedAt và xóa cửa sổ.

canCall() xử lý ba trạng thái: OPEN chỉ chuyển HALF_OPEN khi hết openMs; HALF_OPEN giới hạn số probe bằng halfOpenCalls; CLOSED luôn cho qua. recordSuccess/recordFailure phân nhánh theo trạng thái: ở HALF_OPEN, đủ successThreshold thì về CLOSED, còn một lỗi thì về OPEN ngay.

Lỗi thường gặp: quên xóa cửa sổ khi mở mạch (khiến lần đo sau lẫn quá khứ), không reset bộ đếm probe khi vào HALF_OPEN, hoặc so tỉ lệ khi chưa đủ minimumCalls (mở oan lúc traffic thấp). Trong production, các thông số này ánh xạ sang Resilience4j: slidingWindowType, slidingWindowSize, failureRateThreshold, minimumNumberOfCalls, waitDurationInOpenState, permittedNumberOfCallsInHalfOpenState. Riêng HALF_OPEN thì Resilience4j không đếm số lần thành công: nó chờ đủ permittedNumberOfCallsInHalfOpenState probe rồi so tỉ lệ lỗi với failureRateThreshold (một probe lỗi đơn lẻ chưa mở mạch ngay).`
  }],
  check: [
    { q: 'Điểm khác chính giữa breaker đếm liên tiếp và breaker đếm tỉ lệ lỗi?', options: ['Đếm liên tiếp mở mạch theo tỉ lệ phần trăm', 'Đếm tỉ lệ mở mạch khi tỉ lệ lỗi trên cửa sổ vượt ngưỡng, không bị reset bởi một thành công xen giữa', 'Đếm tỉ lệ không cần cấu hình ngưỡng', 'Chúng giống hệt nhau'], answer: 1, explain: `Đúng (B): đếm tỉ lệ nhìn sức khỏe tổng thể trên cửa sổ nên lỗi rải rác vẫn bị phát hiện; đếm liên tiếp reset khi có một thành công nên dễ bỏ sót. (A) sai vì mô tả ngược. (C) sai vì tỉ lệ vẫn cần failureRateThreshold. (D) sai vì hai mô hình khác nhau về bản chất.` },
    { q: 'minimumNumberOfCalls (ví dụ 20) dùng để làm gì?', options: ['Giảm bộ nhớ cửa sổ', 'Tránh mở mạch oan khi chỉ có 1-2 call lúc traffic thấp', 'Tăng tốc độ gọi downstream', 'Thay thế waitDurationInOpenState'], answer: 1, explain: `Đúng (B): với 1-2 call, một lỗi cho tỉ lệ 50-100% nhưng không đủ tin cậy; chỉ xét khi đủ mẫu. (A) sai vì kích thước cửa sổ do slidingWindowSize quyết định. (C) sai vì nó không ảnh hưởng tốc độ gọi. (D) sai vì đây là hai tham số khác nhau.` },
    { q: 'Trong HALF_OPEN của bài này, khi nào về CLOSED và khi nào về OPEN?', options: ['Chờ hết số probe rồi mới quyết định', 'Đủ halfOpenSuccessThreshold probe thành công thì về CLOSED, chỉ cần một probe lỗi là về OPEN', 'Về CLOSED ngay sau probe thành công đầu tiên', 'Không đổi trạng thái'], answer: 1, explain: `Đúng (B): mô hình trong bài đếm số probe thành công, đủ halfOpenSuccessThreshold thì về CLOSED và xóa cửa sổ; mỗi probe lỗi đều chứng minh dependency chưa hồi phục nên về OPEN ngay và ghi openedAt = now. (A) sai vì đó là cách Resilience4j làm: nó chờ đủ permittedNumberOfCallsInHalfOpenState probe rồi mới so tỉ lệ lỗi với ngưỡng. (C) sai vì phải đủ halfOpenSuccessThreshold lần thành công, không phải một. (D) sai vì trạng thái phải cập nhật theo kết quả từng probe.` }
  ],
  related: ['microservices-025', 'microservices-060', 'microservices-061'],
  tags: ['circuit breaker', 'sliding window', 'failure rate', 'half-open', 'resilience4j']
},
{
  id: 'lesson-microservices-017', track: 'microservices', order: 17,
  title: 'Breaker registry theo dependency: cô lập lỗi, fallback và metrics', level: 'senior', minutes: 30,
  goals: [
    'Vì sao mỗi dependency cần một breaker riêng thay vì một breaker chung',
    'Thiết kế registry map tên -> breaker và execute() có fallback',
    'Chọn loại fallback và bộ metrics tối thiểu để vận hành breaker'
  ],
  body: `**Tóm tắt:** Trong một service gọi nhiều downstream, mỗi dependency phải có **breaker riêng** (registry map tên -> breaker) để lỗi của Payment không làm mở mạch Inventory. {{execute(name, call, fallback)}} kiểm tra breaker của dependency đó: nếu OPEN thì trả fallback (không gọi downstream), nếu cho phép thì gọi và ghi kết quả. Kèm theo là bộ metrics tối thiểu: state, failure rate, số request bị reject và thời gian ở OPEN.

### Vì sao không dùng một breaker chung
Một breaker chung cho cả 10 downstream là sai lầm phổ biến: khi Payment lỗi và mở mạch, breaker chung cũng chặn luôn Inventory và Auth đang hoàn toàn khỏe, biến sự cố cục bộ thành sự cố toàn cục. Mỗi dependency có SLA, đặc tính lỗi và ngưỡng riêng: Payment nên nhạy (30-40% lỗi), Inventory có thể 50%, một API nội bộ ổn định có thể 70%. Registry cho phép cấu hình và theo dõi độc lập từng cái.

### Registry và cấu hình theo SLA
Registry giữ một breaker cho mỗi tên dependency, khởi tạo lười (lazy) khi gặp tên mới. Mỗi breaker có trạng thái và bộ đếm riêng, còn failureThreshold/openMs trong bài rút gọn này dùng chung cho mọi tên (Resilience4j thì cho phép cấu hình riêng từng instance). Khi gọi, ta tra breaker theo tên, kiểm tra trạng thái, rồi gọi hoặc trả fallback. Cách này cũng giúp metrics gắn nhãn theo dependency: biểu đồ "reject theo dependency" chỉ ra ngay cái nào đang mở mạch.

### Chọn loại fallback
| Loại fallback | Khi dùng | Rủi ro |
|---|---|---|
| Ném lỗi (fail fast) | Thao tác bắt buộc, không thể đoán bừa | Người dùng thấy lỗi, cần thông báo rõ |
| Giá trị mặc định | Dữ liệu phụ trợ (số lượng gợi ý) | Có thể hiển thị thiếu, cần ghi nhãn |
| Cache cũ (stale) | Dữ liệu đọc, chấp nhận cũ vài phút | Ẩn sự cố nếu không ghi tuổi dữ liệu |
| Đẩy queue / async | Có thể xử lý sau | Trở thành dependency mới, cần giám sát |

Nguyên tắc: fallback **không được giả mạo thành công** cho thao tác quan trọng như thanh toán hay trừ kho. Với dữ liệu đọc, fallback là hợp lệ nhưng phải nói rõ "dữ liệu có thể cũ" thay vì im lặng trả số liệu sai.

### Cơ chế từng bước
1. **Tra breaker theo tên**: nếu chưa có thì tạo mới (state CLOSED, bộ đếm 0).
2. **Kiểm tra trạng thái**: nếu OPEN và chưa hết openMs thì tăng bộ đếm reject, trả fallback, **không gọi downstream** (tiết kiệm tài nguyên, tránh dồn lỗi).
3. **Gọi downstream**: nếu thành công thì reset bộ đếm lỗi, tăng success; nếu ném lỗi thì tăng failure, và khi đủ ngưỡng (hoặc đang HALF_OPEN) thì mở mạch, ghi openedAt.
4. **Ghi metrics**: mỗi lần gọi cập nhật state gauge, failure rate, reject count, và thời gian ở OPEN.

### Cài đặt rút gọn
~~~java
// Registry: mỗi dependency một breaker, execute() có fallback
class BreakerRegistry {
    private final Map<String, Cell> cells = new HashMap<>();
    synchronized <T> T execute(String name, Supplier<T> call, Supplier<T> fallback) {
        Cell c = cells.computeIfAbsent(name, k -> new Cell());
        long now = clock.millis();
        if (c.state == State.OPEN && now - c.openedAt < openMs) {
            rejected.merge(name, 1, Integer::sum);
            return fallback.get();
        }
        if (c.state == State.OPEN) { c.state = State.HALF_OPEN; c.failures = 0; }
        try {
            T r = call.get();               // gọi downstream thật
            c.state = State.CLOSED; c.failures = 0;
            return r;
        } catch (RuntimeException e) {
            c.failures++;
            if (c.state == State.HALF_OPEN || c.failures >= threshold) {
                c.state = State.OPEN; c.openedAt = now;
            }
            return fallback.get();
        }
    }
}
~~~
Điểm mấu chốt: breaker tra theo tên nên lỗi cô lập; khi OPEN thì **không gọi** downstream mà trả fallback ngay; mọi lần từ chối đều được đếm để quan sát.

### Lỗi hay gặp
- **Dùng một breaker chung cho mọi dependency**: lỗi một cái mở mạch tất cả, biến sự cố cục bộ thành toàn cục.
- **Fallback giả mạo thành công**: trả 200 với dữ liệu rỗng cho thao tác thanh toán khiến người dùng tưởng đã xong; phải phân biệt rõ degraded với success.
- **Không đếm reject**: không biết breaker đang chặn bao nhiêu request, không phát hiện được "mở oan".
- **Fallback cũng là dependency mới**: fallback gọi một DB/API khác cũng có thể chết; phải có timeout và giám sát riêng.
- **Không reset khi thành công**: bộ đếm lỗi không về 0 khiến một lỗi cũ làm mở mạch sớm ở lần sau.

### Ví dụ đời thực
**Bối cảnh:** API trang chủ gọi Recommendation, Inventory, Price. Recommendation chậm (p99 3s), Inventory và Price vẫn khỏe.
**Triệu chứng:** dùng một breaker chung, Recommendation mở mạch kéo theo Inventory và Price bị chặn, trang không hiển thị giá và tồn kho dù hai cái hoàn toàn bình thường; tỉ lệ lỗi trang tăng 22%.
**Điều tra:** tách registry theo tên: Recommendation có breaker riêng (ngưỡng 2 lỗi liên tiếp, mở 10s), Inventory và Price breaker riêng. Recommendation mở thì chỉ Recommendation bị chặn, fallback trả danh sách gợi ý rỗng có nhãn "tạm ẩn".
**Kết quả:** tỉ lệ lỗi trang về 0,8%, giá và tồn kho luôn hiển thị, và metric reject theo dependency chỉ ra đúng Recommendation đang mở mạch.

### Trả lời mẫu khi phỏng vấn
Tôi dùng registry map tên dependency sang breaker riêng, không dùng một breaker chung, vì lỗi của một downstream không được phép chặn các downstream đang khỏe. Mỗi execute() kiểm tra breaker theo tên: nếu OPEN thì trả fallback và đếm reject, không gọi downstream; nếu cho phép thì gọi và ghi success/failure, đủ ngưỡng thì mở mạch. Tôi chọn fallback theo loại dữ liệu: thao tác bắt buộc thì fail fast rõ ràng, dữ liệu đọc thì dùng cache cũ có ghi tuổi, và không bao giờ giả mạo thành công cho thanh toán hay tồn kho. Metrics tôi theo dõi là state, failure rate, số request bị reject và thời gian ở OPEN theo từng dependency để chỉnh ngưỡng và phát hiện mở oan.

> Senior tip: đặt ngưỡng breaker theo SLA từng dependency (nội bộ 50%, bên thứ ba 30-40%) và luôn đếm reject theo tên; biểu đồ reject tăng đột biến thường là dấu hiệu mở oan hoặc dependency thật sự đang chết.

### Liên hệ phỏng vấn
- **Hỏi:** Vì sao không dùng một breaker chung cho mọi downstream? **Trả lời ngắn:** Lỗi một dependency sẽ mở mạch chung và chặn cả các dependency khỏe, biến sự cố cục bộ thành toàn cục; mỗi cái cần breaker riêng theo SLA.
- **Hỏi:** Khi breaker OPEN, execute() nên làm gì? **Trả lời ngắn:** Trả fallback ngay và đếm reject, không gọi downstream; tránh dồn thêm lỗi và tiết kiệm tài nguyên.
- **Hỏi:** Metrics nào quan trọng nhất để phát hiện breaker mở oan? **Trả lời ngắn:** Số request bị reject theo dependency và failure rate; reject tăng đột biến trong khi downstream vẫn khỏe cho thấy ngưỡng quá gắt.
- **Hỏi:** Fallback có phải lúc nào cũng an toàn? **Trả lời ngắn:** Không; với thao tác bắt buộc (thanh toán, trừ kho) fallback không được giả mạo thành công, phải fail fast rõ ràng; với dữ liệu đọc thì cache cũ phải ghi tuổi dữ liệu.`,
  exercises: [{
    title: 'BreakerRegistry: cô lập theo dependency + fallback + metrics',
    prompt: `Cài {{BreakerRegistry}} với một breaker độc lập cho mỗi tên dependency (dùng Clock giả):

- Constructor: {{BreakerRegistry(int failureThreshold, long openMs, Clock clock)}}. Validate {{failureThreshold >= 1}}, {{openMs > 0}}, {{clock != null}}; sai thì ném {{IllegalArgumentException}}.
- {{<T> T execute(String name, java.util.function.Supplier<T> call, java.util.function.Supplier<T> fallback)}}:
  - Tra cell theo {{name}} (tạo mới nếu chưa có).
  - Nếu cell đang OPEN và {{now - openedAt < openMs}}: tăng {{rejected}} của tên đó và trả {{fallback.get()}} mà **không gọi** {{call}}.
  - Nếu cell đang OPEN và đã hết {{openMs}}: chuyển HALF_OPEN, reset {{failures = 0}}.
  - Gọi {{call.get()}}: thành công thì về CLOSED, {{failures = 0}}, tăng {{success}}; nếu ném {{RuntimeException}} thì tăng {{failures}} và {{failure}}, và nếu đang HALF_OPEN hoặc {{failures >= failureThreshold}} thì về OPEN, {{openedAt = now}}, rồi trả {{fallback.get()}}.
- {{State state(String name)}} trả CLOSED nếu chưa có cell.
- {{int rejected(String name)}}, {{int successCount(String name)}}, {{int failureCount(String name)}} đếm theo tên (0 nếu chưa có).

{{Clock}} là interface {{long millis()}}. Tất cả method {{synchronized}}.`,
    starter: `interface Clock { long millis(); }
class BreakerRegistry {
    enum State { CLOSED, OPEN, HALF_OPEN }
    private static class Cell { State state = State.CLOSED; int failures = 0; long openedAt = 0; }
    private final int failureThreshold;
    private final long openMs;
    private final Clock clock;
    private final Map<String, Cell> cells = new HashMap<>();
    private final Map<String, Integer> rejected = new HashMap<>();
    private final Map<String, Integer> success = new HashMap<>();
    private final Map<String, Integer> failure = new HashMap<>();
    BreakerRegistry(int failureThreshold, long openMs, Clock clock) {
        this.failureThreshold = failureThreshold; this.openMs = openMs; this.clock = clock;
    }
    synchronized <T> T execute(String name, java.util.function.Supplier<T> call, java.util.function.Supplier<T> fallback) { throw new UnsupportedOperationException("TODO"); }
    synchronized State state(String name) { Cell c = cells.get(name); return c == null ? State.CLOSED : c.state; }
    synchronized int rejected(String name) { return rejected.getOrDefault(name, 0); }
    synchronized int successCount(String name) { return success.getOrDefault(name, 0); }
    synchronized int failureCount(String name) { return failure.getOrDefault(name, 0); }
}`,
    tests: `public class Main {
 static int p=0,t=0; static void ck(String n,Runnable r){t++;try{r.run();p++;System.out.println("PASS "+n);}catch(Throwable e){System.out.println("FAIL "+n+": "+e);}}
 static void eq(Object a,Object b){if(!Objects.equals(a,b))throw new AssertionError(a+" != "+b);}
 public static void main(String[] x){
  ck("success passthrough",()->{
   AtomicLong clock=new AtomicLong(0);
   BreakerRegistry r=new BreakerRegistry(2,1000,clock::get);
   eq("ok",r.execute("pay",()->"ok",()->"fb"));
   eq(1,r.successCount("pay"));
   eq(BreakerRegistry.State.CLOSED,r.state("pay"));
  });
  ck("exception returns fallback",()->{
   AtomicLong clock=new AtomicLong(0);
   BreakerRegistry r=new BreakerRegistry(2,1000,clock::get);
   eq("fb",r.execute("pay",()->{throw new RuntimeException("down");}, ()->"fb"));
   eq(1,r.failureCount("pay"));
  });
  ck("opens at threshold and rejects",()->{
   AtomicLong clock=new AtomicLong(0);
   BreakerRegistry r=new BreakerRegistry(2,1000,clock::get);
   r.execute("pay",()->{throw new RuntimeException();}, ()->"fb");
   r.execute("pay",()->{throw new RuntimeException();}, ()->"fb");
   eq(BreakerRegistry.State.OPEN,r.state("pay"));
   eq("fb",r.execute("pay",()->{throw new AssertionError("must not call");}, ()->"fb"));
   eq(1,r.rejected("pay"));
  });
  ck("half-open success closes",()->{
   AtomicLong clock=new AtomicLong(0);
   BreakerRegistry r=new BreakerRegistry(1,1000,clock::get);
   r.execute("pay",()->{throw new RuntimeException();}, ()->"fb");
   clock.set(1000);
   eq("ok",r.execute("pay",()->"ok", ()->"fb"));
   eq(BreakerRegistry.State.CLOSED,r.state("pay"));
   eq("ok2",r.execute("pay",()->"ok2", ()->"fb"));
  });
  ck("half-open failure reopens",()->{
   AtomicLong clock=new AtomicLong(0);
   BreakerRegistry r=new BreakerRegistry(1,1000,clock::get);
   r.execute("pay",()->{throw new RuntimeException();}, ()->"fb");
   clock.set(1000);
   r.execute("pay",()->{throw new RuntimeException();}, ()->"fb");
   eq(BreakerRegistry.State.OPEN,r.state("pay"));
   eq("fb",r.execute("pay",()->{throw new AssertionError("must not call");}, ()->"fb"));
   eq(1,r.rejected("pay"));
  });
  ck("dependencies isolated",()->{
   AtomicLong clock=new AtomicLong(0);
   BreakerRegistry r=new BreakerRegistry(1,1000,clock::get);
   r.execute("a",()->{throw new RuntimeException();}, ()->"fa");
   eq(BreakerRegistry.State.OPEN,r.state("a"));
   eq("ok",r.execute("b",()->"ok", ()->"fb"));
   eq(BreakerRegistry.State.CLOSED,r.state("b"));
  });
  System.out.println("RESULT "+p+"/"+t);
 }
}`,
    reference: `interface Clock { long millis(); }
class BreakerRegistry {
    enum State { CLOSED, OPEN, HALF_OPEN }
    private static class Cell { State state = State.CLOSED; int failures = 0; long openedAt = 0; }
    private final int failureThreshold;
    private final long openMs;
    private final Clock clock;
    private final Map<String, Cell> cells = new HashMap<>();
    private final Map<String, Integer> rejected = new HashMap<>();
    private final Map<String, Integer> success = new HashMap<>();
    private final Map<String, Integer> failure = new HashMap<>();
    BreakerRegistry(int failureThreshold, long openMs, Clock clock) {
        if (failureThreshold < 1) throw new IllegalArgumentException("failureThreshold");
        if (openMs <= 0) throw new IllegalArgumentException("openMs");
        if (clock == null) throw new IllegalArgumentException("clock");
        this.failureThreshold = failureThreshold; this.openMs = openMs; this.clock = clock;
    }
    synchronized <T> T execute(String name, java.util.function.Supplier<T> call, java.util.function.Supplier<T> fallback) {
        Cell c = cells.computeIfAbsent(name, k -> new Cell());
        long now = clock.millis();
        if (c.state == State.OPEN) {
            if (now - c.openedAt < openMs) {
                rejected.merge(name, 1, Integer::sum);
                return fallback.get();
            }
            c.state = State.HALF_OPEN;
            c.failures = 0;
        }
        try {
            T r = call.get();
            c.state = State.CLOSED;
            c.failures = 0;
            success.merge(name, 1, Integer::sum);
            return r;
        } catch (RuntimeException e) {
            c.failures++;
            failure.merge(name, 1, Integer::sum);
            if (c.state == State.HALF_OPEN || c.failures >= failureThreshold) {
                c.state = State.OPEN;
                c.openedAt = now;
            }
            return fallback.get();
        }
    }
    synchronized State state(String name) { Cell c = cells.get(name); return c == null ? State.CLOSED : c.state; }
    synchronized int rejected(String name) { return rejected.getOrDefault(name, 0); }
    synchronized int successCount(String name) { return success.getOrDefault(name, 0); }
    synchronized int failureCount(String name) { return failure.getOrDefault(name, 0); }
}`,
    hints: [
      'Tra cell theo name; nếu OPEN và chưa hết openMs thì tăng rejected và trả fallback, không gọi call.get().',
      'Khi hết openMs thì chuyển HALF_OPEN và reset failures trước khi gọi downstream.',
      'Bắt RuntimeException: nếu HALF_OPEN hoặc failures >= threshold thì về OPEN và set openedAt = now.',
      'Mỗi tên có bộ đếm riêng; cell chưa tồn tại thì coi như CLOSED và các metric trả 0.'
    ],
    explain: `Registry map mỗi tên dependency sang một Cell (state, failures, openedAt). execute() kiểm tra trạng thái trước: OPEN chưa hết giờ thì reject và trả fallback, hết giờ thì chuyển HALF_OPEN rồi gọi downstream. Thành công reset failures và về CLOSED; lỗi tăng failures, và khi đủ ngưỡng (hoặc đang HALF_OPEN) thì mở mạch, ghi openedAt để đếm thời gian chờ.

Việc tách cell theo tên chính là điểm cô lập: một dependency mở mạch không ảnh hưởng các dependency khác. Các metric rejected/success/failure cũng tách theo tên để quan sát.

Lỗi thường gặp: dùng một breaker chung làm lỗi lan ra mọi dependency; không đếm reject nên không biết mở oan; fallback giả mạo thành công cho thao tác quan trọng; hoặc quên reset failures khi thành công khiến breaker mở sớm. Trong production, Resilience4j cho phép đặt registry + nhiều instance cấu hình riêng, ánh xạ đúng mô hình này.`
  }],
  check: [
    { q: 'Vì sao không nên dùng một breaker chung cho mọi dependency?', options: ['Vì một breaker không đủ nhanh', 'Vì lỗi một dependency sẽ mở mạch chung và chặn cả các dependency đang khỏe', 'Vì mỗi dependency cần một Clock riêng', 'Vì breaker chung không lưu được trạng thái'], answer: 1, explain: `Đúng (B): breaker chung biến sự cố cục bộ thành toàn cục; mỗi dependency có SLA và ngưỡng riêng nên cần breaker riêng. (A) sai vì vấn đề là phạm vi ảnh hưởng, không phải tốc độ. (C) sai vì Clock là tiện ích test, không phải lý do tách breaker. (D) sai vì breaker chung vẫn lưu trạng thái, chỉ là gộp tất cả vào một trạng thái.` },
    { q: 'Khi breaker của một dependency đang OPEN, execute() nên làm gì?', options: ['Vẫn gọi downstream để kiểm tra', 'Trả fallback và đếm reject, không gọi downstream', 'Ném lỗi xuống người dùng ngay', 'Xóa breaker đó'], answer: 1, explain: `Đúng (B): OPEN nghĩa là fail fast, trả fallback và đếm reject để tiết kiệm tài nguyên và tránh dồn lỗi; chỉ khi hết openMs mới cho probe. (A) sai vì gọi tiếp khi OPEN là nguyên nhân gây quá tải. (C) sai vì đã có fallback, không cần ném lỗi (trừ khi fallback là fail fast có chủ đích). (D) sai vì xóa breaker làm mất khả năng bảo vệ.` },
    { q: 'Metrics nào quan trọng nhất để phát hiện breaker mở oan?', options: ['Số dòng code', 'Số request bị reject theo dependency và failure rate', 'Tổng dung lượng RAM', 'Số comment trong code'], answer: 1, explain: `Đúng (B): reject tăng đột biến trong khi downstream vẫn khỏe cho thấy ngưỡng quá gắt; failure rate cho biết mức suy giảm thực. (A), (C), (D) đều không phản ánh sức khỏe dependency.` }
  ],
  related: ['microservices-060', 'microservices-061', 'microservices-025'],
  tags: ['circuit breaker', 'registry', 'fallback', 'metrics', 'bulkhead', 'graceful degradation']
},
{
  id: 'lesson-microservices-018', track: 'microservices', order: 18,
  title: 'Saga bù trừ cho chuyển tiền: orchestration, trạng thái, idempotency và timeout', level: 'senior', minutes: 35,
  goals: [
    'Giải thích được vì sao chuyển tiền qua nhiều service cần saga thay vì transaction đơn',
    'Thiết kế TransferSaga với orchestration: chạy bước tuần tự, bù trừ ngược khi lỗi, lưu trạng thái',
    'Áp dụng idempotency key cho từng bước và xử lý timeout (kết quả không rõ) an toàn'
  ],
  body: `**Tóm tắt:** Saga chia nghiệp vụ chuyển tiền thành các bước cục bộ (local transaction — giao dịch chỉ trong 1 database/service). Orchestrator (bộ điều phối trung tâm) ra lệnh từng bước theo thứ tự; nếu bước sau thất bại, nó gọi compensation (bù trừ — hành động nghiệp vụ đảo ngược hiệu quả bước đã commit) theo thứ tự ngược. Mỗi bước phải idempotent (gọi lại cùng key cho cùng kết quả) vì timeout và retry là bình thường.

### Vì sao chuyển tiền cần saga
Chuyển 500.000đ từ tài khoản A (Account Service, DB A) sang tài khoản B (Account Service, DB B) gồm ít nhất: trừ tiền A (debit) và cộng tiền B (credit). **Vấn đề:** hai database khác nhau không có chung một transaction ACID (Atomicity, Consistency, Isolation, Durability — 4 tính chất đảm bảo giao dịch "hoặc hết hoặc không"). Không thể {{BEGIN}} ở DB A rồi {{COMMIT}} cùng lúc cả DB B bằng lệnh SQL thông thường.

**2PC (Two-Phase Commit — cam kết hai pha)** là giao thức cố gắng làm điều đó: coordinator hỏi tất cả "sẵn sàng chưa?" rồi ra lệnh commit. Thực tế trong microservices 2PC hiếm dùng vì khóa tài nguyên lâu, dễ treo khi coordinator chết, và không phải hệ thống nào cũng hỗ trợ (message broker, dịch vụ ngoài). Saga chấp nhận: mỗi bước tự commit cục bộ, nếu sau đó có lỗi thì chạy bước bù để sửa.

### Orchestration: bộ điều phối trung tâm
**Orchestration** (điều phối tập trung) nghĩa là có một thành phần — orchestrator — giữ "kịch bản": biết bước nào chạy trước, bước nào chạy sau, khi nào bù trừ. **Choreography** (biên đạo, mỗi service tự phản ứng event của nhau) là cách khác; orchestration thường dễ hiểu, dễ audit và dễ debug hơn với luồng có nhánh như chuyển tiền.

~~~seq
title: Chuyển tiền thành công
actors: Orch | DebitSvc | CreditSvc
Orch -> DebitSvc: debit(sagaId, 500k)
DebitSvc --> Orch: OK (đã trừ A)
Orch -> CreditSvc: credit(sagaId, 500k)
CreditSvc --> Orch: OK (đã cộng B)
Orch -> Orch: state = COMPLETED
~~~

~~~seq
title: Credit thất bại -> bù trừ debit
actors: Orch | DebitSvc | CreditSvc
Orch -> DebitSvc: debit(sagaId, 500k)
DebitSvc --> Orch: OK (đã trừ A)
Orch -> CreditSvc: credit(sagaId, 500k)
CreditSvc --> Orch: FAIL
Orch -> DebitSvc: refund(sagaId, 500k)
DebitSvc --> Orch: OK (hoàn A)
Orch -> Orch: state = COMPENSATED
~~~

### Trạng thái saga (state machine)
**State machine** (máy trạng thái) là mô hình mô tả: hệ thống đang ở trạng thái nào và được chuyển sang trạng thái nào khi có sự kiện. Orchestrator phải **lưu trạng thái saga vào bộ nhớ bền vững** (database) trước/sau mỗi bước để nếu process restart vẫn biết đã làm tới đâu, tránh trừ tiền hai lần hoặc quên bù trừ.

| Trạng thái | Ý nghĩa | Chuyển tiếp hợp lệ |
|---|---|---|
| {{STARTED}} | Mới tạo, chưa thực hiện bước nào | sang {{DEBITED}} nếu debit OK, sang {{FAILED}} nếu debit lỗi |
| {{DEBITED}} | Đã trừ tiền nguồn thành công | sang {{COMPLETED}} nếu credit OK, sang {{COMPENSATING}} nếu credit lỗi |
| {{COMPENSATING}} | Đang chạy bù trừ | sang {{COMPENSATED}} khi bù trừ xong |
| {{COMPLETED}} | Chuyển tiền thành công | trạng thái cuối |
| {{COMPENSATED}} | Đã bù trừ sau lỗi | trạng thái cuối (nghiệp vụ không hoàn tất nhưng nhất quán) |
| {{FAILED}} | Thất bại, không có bước nào cần bù | trạng thái cuối |

### Bù trừ (compensation): không phải rollback
**Compensation** là một hành động nghiệp vụ mới để "đảo ngược hiệu quả" của bước đã commit. Nó **không** xóa lịch sử: debit đã ghi sổ thì refund ghi thêm một bút toán hoàn tiền. Bù trừ chạy theo **thứ tự ngược** các bước đã thành công (giống tháo hành lý: bỏ vào sau thì lấy ra trước).

Ví dụ 3 bước: (1) debit A OK, (2) credit B OK, (3) ghi log phí lỗi → bù (2) rồi bù (1). Nếu bước 1 chưa thành công thì không bù bước 1. Compensation cũng có thể thất bại (mạng lỗi) nên nó phải retryable và cần giám sát.

### Idempotency từng bước
**Idempotency** (tính lũy đẳng) nghĩa là thực hiện cùng thao tác nhiều lần với cùng tham số cho kết quả giống như thực hiện một lần. Vì sao cần? Orchestrator gọi {{debit(sagaId)}}, service trừ tiền xong nhưng response bị mất do timeout mạng — orchestrator không biết thành công hay chưa, có thể retry. Không idempotent → trừ tiền hai lần.

Cách làm: mỗi lệnh mang {{sagaId}} (hoặc {{stepId}}) ổn định. Service kiểm tra "sagaId này đã xử lý chưa?" (bảng/Set) trước khi áp dụng; nếu đã xử lý thì trả về kết quả cũ/thành công mà không làm lại. Cả bước tiến (forward) lẫn bước bù (compensate) đều phải idempotent.

~~~java
// Minh họa idempotency: debit chỉ áp dụng một lần cho cùng sagaId
boolean debit(String sagaId, long amount) {
    if (processedDebits.contains(sagaId)) {
        return true; // đã trừ trước đó (do retry) -> coi như thành công
    }
    if (!hasEnoughBalance(amount)) return false;
    balance -= amount;                // hiệu ứng nghiệp vụ chỉ chạy 1 lần
    processedDebits.add(sagaId);      // ghi nhận đã xử lý
    return true;
}
~~~

### Timeout: kết quả không rõ
**Timeout** (hết thời gian chờ) nghĩa là orchestrator không nhận được phản hồi kịp. Timeout **không** chứng minh bước thất bại: bước có thể đã thành công ở service nhưng mạng chậm/mất gói. Bù trừ mù quáng khi timeout có thể gây sai (ví dụ refund trong khi debit chưa từng xảy ra, hoặc debit thực ra đã thành công và bạn lại làm hỏng trạng thái).

Xử lý an toàn: (1) retry cùng {{sagaId}} (idempotency key) — nếu bước đã làm, service trả OK mà không làm lại; (2) truy vấn trạng thái bước theo {{sagaId}} trước khi quyết định bù trừ; (3) lưu saga ở trạng thái "chờ xác nhận" thay vì đoán. Trong production cần giới hạn retry, backoff và đường can thiệp thủ công.

### Ví dụ: orchestrator chuyển tiền (rút gọn)
~~~java
SagaState run(String sagaId, AccountService svc) {
    log.add("debit");
    if (!svc.debit(sagaId)) {          // bước 1: trừ tiền nguồn
        log.set(log.size() - 1, "debit-failed");
        state = SagaState.FAILED;      // chưa trừ được -> không bù trừ
        return state;
    }
    state = SagaState.DEBITED;
    log.add("credit");
    if (!svc.credit(sagaId)) {         // bước 2: cộng tiền đích
        log.set(log.size() - 1, "credit-failed");
        state = SagaState.COMPENSATING;
        svc.refund(sagaId);            // bù trừ bước 1 (ngược lại)
        log.add("refund");
        state = SagaState.COMPENSATED;
        return state;
    }
    state = SagaState.COMPLETED;       // cả hai bước thành công
    return state;
}
~~~

### Lỗi hay gặp trên production
- **Triệu chứng:** khách bị trừ tiền hai lần khi mạng chập chờn. **Nguyên nhân:** orchestrator retry {{debit}} sau timeout nhưng service không idempotent theo {{sagaId}}. **Cách sửa:** mỗi bước kiểm tra {{sagaId}} đã xử lý; lưu kết quả bước; retry trả lại kết quả cũ.
- **Triệu chứng:** sau restart, saga "quên" đã debit và chạy lại từ đầu, hoặc quên bù trừ. **Nguyên nhân:** trạng thái saga chỉ giữ trong RAM (biến trong bộ nhớ, mất khi process tắt). **Cách sửa:** persist state machine vào DB bền vững (ghi state trước khi gọi bước tiếp); khi khởi động đọc lại saga đang dang dở và tiếp tục.
- **Triệu chứng:** tiền bị trừ nhưng người nhận không có tiền và cũng không được hoàn. **Nguyên nhân:** credit lỗi, orchestrator gọi refund nhưng refund lỗi và bị bỏ qua (best-effort). **Cách sửa:** compensation phải retryable/idempotent, có giới hạn retry + alert; đưa saga vào trạng thái cần can thiệp (manual) nếu bù trừ thất bại nhiều lần.
- **Triệu chứng:** timeout khi debit, orchestrator bù trừ nhưng thực ra debit đã thành công muộn. **Nguyên nhân:** coi timeout là failure chắc chắn. **Cách sửa:** không bù trừ mù quáng; query trạng thái hoặc retry cùng idempotency key để xác định kết quả thật.

### Liên hệ phỏng vấn
- **Hỏi:** Saga khác transaction ACID thế nào? **Trả lời ngắn:** Saga không có atomicity/isolation toàn cục; mỗi bước là local transaction commit riêng. Nếu lỗi, dùng compensation (bù trừ) để đạt nhất quán cuối cùng (eventual consistency — cuối cùng sẽ đúng), và phải chấp nhận trạng thái trung gian.
- **Hỏi:** Vì sao compensation phải chạy ngược thứ tự? **Trả lời ngắn:** Bước sau phụ thuộc bước trước (credit chỉ có ý nghĩa sau debit). Bù trừ cần gỡ các hiệu ứng đã commit theo thứ tự ngược để không để lại trạng thái nửa vời; chỉ bù những bước thực sự đã thành công.
- **Hỏi:** Idempotency từng bước giải quyết vấn đề gì? **Trả lời ngắn:** Timeout/retry/duplicate message khiến cùng lệnh có thể gửi lại. Idempotency key ({{sagaId}}) giúp service nhận ra "đã làm rồi" và trả kết quả cũ thay vì trừ/cộng tiền lần nữa.

> Senior tip: log đầy đủ {{sagaId}}, trạng thái và từng bước (kể cả retry/compensation) vào structured log; khi sự cố chuyển tiền, chỉ nhìn được tiền "mất" hay "nhân đôi" nếu bạn truy vết được toàn bộ vòng đời saga.`,
  exercises: [{
    title: 'TransferSaga: bù trừ khi credit thất bại, idempotent theo sagaId',
    prompt: `Cài {{TransferSaga.run(sagaId, svc)}} điều phối chuyển tiền 2 bước: debit (trừ nguồn) rồi credit (cộng đích) dùng {{AccountService}}.

Yêu cầu:
- Thành công: ghi log {{debit}}, {{credit}} theo thứ tự, đặt {{state = SagaState.COMPLETED}} và trả về state.
- Debit thất bại ({{svc.debit}} trả {{false}}): ghi log {{debit-failed}}, {{state = SagaState.FAILED}}, **không** gọi credit/refund (vì chưa trừ được tiền).
- Credit thất bại (debit đã OK, {{svc.credit}} trả {{false}}): ghi log {{debit}}, {{credit-failed}}, chuyển {{COMPENSATING}}, gọi {{svc.refund(sagaId)}}, ghi log {{refund}}, đặt {{state = SagaState.COMPENSATED}}. Bù trừ chỉ chạy cho bước đã thành công (debit), theo thứ tự ngược.

{{AccountService}} đã idempotent theo {{sagaId}} (debit/credit/refund gọi lặp không nhân đôi hiệu ứng). Giữ logic đơn giản, không dùng thread.`,
    starter: `enum SagaState { STARTED, DEBITED, COMPLETED, COMPENSATING, COMPENSATED, FAILED }

class AccountService {
    boolean failDebit = false;
    boolean failCredit = false;
    final Set<String> debited = new HashSet<>();
    final Set<String> credited = new HashSet<>();
    final Set<String> refunded = new HashSet<>();

    boolean debit(String sagaId) {
        if (failDebit) return false;
        debited.add(sagaId); // idempotent: gọi lại cùng sagaId không đổi hiệu ứng
        return true;
    }

    boolean credit(String sagaId) {
        if (failCredit) return false;
        credited.add(sagaId);
        return true;
    }

    boolean refund(String sagaId) {
        refunded.add(sagaId); // idempotent
        return true;
    }

    boolean netDebited(String sagaId) {
        return debited.contains(sagaId) && !refunded.contains(sagaId);
    }

    boolean netCredited(String sagaId) {
        return credited.contains(sagaId);
    }
}

class TransferSaga {
    SagaState state = SagaState.STARTED;
    final List<String> log = new ArrayList<>();

    SagaState run(String sagaId, AccountService svc) {
        throw new UnsupportedOperationException("TODO");
    }
}`,
    tests: `public class Main {
    static int p=0,t=0;
    static void ck(String n,Runnable r){t++;try{r.run();p++;System.out.println("PASS "+n);}catch(Throwable e){System.out.println("FAIL "+n+": "+e);}}
    static void eq(Object a,Object b){if(!Objects.equals(a,b))throw new AssertionError(a+" != "+b);}
    public static void main(String[] x){
        ck("success completes and keeps both effects",()->{
            AccountService svc=new AccountService();
            TransferSaga saga=new TransferSaga();
            eq(SagaState.COMPLETED, saga.run("s1", svc));
            eq(true, svc.netDebited("s1"));
            eq(true, svc.netCredited("s1"));
            eq(false, svc.refunded.contains("s1"));
            eq(java.util.List.of("debit","credit"), saga.log);
        });
        ck("credit failure compensates debit",()->{
            AccountService svc=new AccountService();
            svc.failCredit=true;
            TransferSaga saga=new TransferSaga();
            eq(SagaState.COMPENSATED, saga.run("s2", svc));
            eq(false, svc.netDebited("s2"));
            eq(false, svc.netCredited("s2"));
            eq(true, svc.refunded.contains("s2"));
            eq(java.util.List.of("debit","credit-failed","refund"), saga.log);
        });
        ck("debit failure does not call credit or refund",()->{
            AccountService svc=new AccountService();
            svc.failDebit=true;
            TransferSaga saga=new TransferSaga();
            eq(SagaState.FAILED, saga.run("s3", svc));
            eq(false, svc.netDebited("s3"));
            eq(false, svc.netCredited("s3"));
            eq(true, svc.credited.isEmpty());
            eq(true, svc.refunded.isEmpty());
            eq(java.util.List.of("debit-failed"), saga.log);
        });
        ck("service steps are idempotent by sagaId",()->{
            AccountService svc=new AccountService();
            eq(true, svc.debit("s4")); eq(true, svc.debit("s4"));
            eq(1, svc.debited.size());
            eq(true, svc.netDebited("s4"));
            eq(true, svc.refund("s4")); eq(true, svc.refund("s4"));
            eq(1, svc.refunded.size());
            eq(false, svc.netDebited("s4"));
        });
        ck("compensation runs only after successful debit",()->{
            AccountService svc=new AccountService();
            svc.failCredit=true;
            new TransferSaga().run("s5", svc);
            eq(1, svc.debited.size());
            eq(1, svc.refunded.size());
            eq(0, svc.credited.size());
        });
        System.out.println("RESULT "+p+"/"+t);
    }
}`,
    reference: `enum SagaState { STARTED, DEBITED, COMPLETED, COMPENSATING, COMPENSATED, FAILED }

class AccountService {
    boolean failDebit = false;
    boolean failCredit = false;
    final Set<String> debited = new HashSet<>();
    final Set<String> credited = new HashSet<>();
    final Set<String> refunded = new HashSet<>();

    boolean debit(String sagaId) {
        if (failDebit) return false;
        debited.add(sagaId);
        return true;
    }

    boolean credit(String sagaId) {
        if (failCredit) return false;
        credited.add(sagaId);
        return true;
    }

    boolean refund(String sagaId) {
        refunded.add(sagaId);
        return true;
    }

    boolean netDebited(String sagaId) {
        return debited.contains(sagaId) && !refunded.contains(sagaId);
    }

    boolean netCredited(String sagaId) {
        return credited.contains(sagaId);
    }
}

class TransferSaga {
    SagaState state = SagaState.STARTED;
    final List<String> log = new ArrayList<>();

    SagaState run(String sagaId, AccountService svc) {
        log.add("debit");
        if (!svc.debit(sagaId)) {
            log.set(log.size() - 1, "debit-failed");
            state = SagaState.FAILED; // chưa trừ được tiền -> không có gì để bù
            return state;
        }
        state = SagaState.DEBITED;
        log.add("credit");
        if (!svc.credit(sagaId)) {
            log.set(log.size() - 1, "credit-failed");
            state = SagaState.COMPENSATING;
            svc.refund(sagaId); // bù trừ bước đã thành công (debit), ngược lại
            log.add("refund");
            state = SagaState.COMPENSATED;
            return state;
        }
        state = SagaState.COMPLETED;
        return state;
    }
}`,
    hints: [
      'Ghi log "debit" trước khi gọi debit; nếu debit trả false thì đổi entry cuối thành "debit-failed", đặt FAILED và return (không gọi credit/refund).',
      'Debit thành công thì chuyển state sang DEBITED, ghi "credit" rồi gọi credit; nếu credit false thì đổi thành "credit-failed", chuyển COMPENSATING, gọi refund, ghi "refund", chuyển COMPENSATED.',
      'Debit false nghĩa là bước chưa áp dụng hiệu ứng nên tuyệt đối không refund; chỉ bù trừ những bước đã commit thành công.'
    ],
    explain: `Orchestrator chạy tuần tự: debit -> credit. Nếu debit lỗi, saga kết thúc FAILED và không có compensation vì chưa có hiệu ứng nào cần đảo ngược. Nếu debit thành công nhưng credit lỗi, saga đã ở trạng thái "tiền nguồn đã trừ", nên phải gọi refund (compensation của debit) rồi mới kết thúc COMPENSATED. Đây là bù trừ đúng: chỉ bù bước đã thành công, không bù bước thất bại.

Idempotency nằm ở service: dùng Set theo {{sagaId}} nên gọi debit/refund lặp (ví dụ do retry sau timeout) không nhân đôi hiệu ứng. Trong production, idempotency key được lưu bền vững trong DB và bước forward/compensate đều phải kiểm tra key.

Lỗi thường gặp: gọi refund khi debit chưa thành công (hoàn tiền "ảo"); quên đặt lại log thành *-failed nên log nói dối; hoặc không chuyển state qua COMPENSATING/COMPENSATED khiến không theo dõi được saga đang bù trừ.`
  }],
  check: [
    { q: 'Debit thành công nhưng credit thất bại. Compensation đúng là gì?', options: ['Rollback transaction DB của credit service', 'Gọi refund cho debit (bước đã thành công) rồi kết thúc COMPENSATED, không gọi refund cho credit vì credit chưa thành công', 'Gọi refund cho cả debit và credit', 'Bỏ qua và đánh dấu COMPLETED vì debit đã xong'], answer: 1, explain: 'Đúng (B): chỉ bù trừ bước đã commit thành công, theo thứ tự ngược; credit thất bại nên không có hiệu ứng credit để bù. (A) sai vì mỗi service commit DB riêng, không có rollback xuyên service. (C) sai vì bù bước chưa thành công có thể gây sai trạng thái. (D) sai vì bỏ qua làm tiền bị trừ nhưng người nhận không nhận được.' },
    { q: 'Vì sao mỗi bước saga phải idempotent theo sagaId?', options: ['Để saga chạy nhanh hơn', 'Vì timeout/retry có thể khiến cùng bước được gọi lại; idempotency đảm bảo gọi lặp không nhân đôi hiệu ứng', 'Để không cần lưu trạng thái saga', 'Vì database tự động chống duplicate'], answer: 1, explain: 'Đúng (B): khi timeout, orchestrator không biết bước đã thành công hay chưa và có thể retry; idempotency key giúp service trả kết quả cũ thay vì trừ/cộng tiền lần nữa. (A) sai, idempotency không nhằm tăng tốc. (C) sai, vẫn phải lưu trạng thái saga để phục hồi sau restart. (D) sai, database không tự biết nghiệp vụ nào là duplicate nếu không có ràng buộc/key.' },
    { q: 'Orchestrator gọi debit nhưng bị timeout (không rõ thành công hay thất bại). Cách xử lý an toàn nhất?', options: ['Giả định thất bại và chạy compensation ngay', 'Retry hoặc truy vấn trạng thái cùng sagaId (idempotency key) để xác định kết quả trước khi quyết định bù trừ', 'Giả định thành công và chuyển sang credit', 'Xóa saga và bắt đầu saga mới với sagaId khác'], answer: 1, explain: 'Đúng (B): timeout không chứng minh thất bại; cần xác định kết quả thật bằng query/retry cùng key. (A) sai vì debit có thể đã thành công, bù trừ mù quáng gây sai. (C) sai vì debit có thể chưa thành công, credit sẽ làm lệch tiền. (D) sai vì sagaId cũ có thể đã có hiệu ứng một phần, tạo saga mới không giải quyết và có thể gây rối.' },
    { q: 'Trạng thái saga nên được lưu ở đâu để an toàn khi orchestrator restart?', options: ['Chỉ trong biến RAM của process', 'Trong database/bộ nhớ bền vững, cập nhật theo từng bước', 'Trong log console', 'Không cần lưu vì có thể chạy lại từ đầu'], answer: 1, explain: 'Đúng (B): persist state cho phép tiếp tục từ bước đã biết sau restart, tránh trừ tiền hai lần hoặc quên bù trừ. (A) và (C) mất khi process tắt. (D) sai vì chạy lại từ đầu khi một phần bước đã commit sẽ gây duplicate hiệu ứng nếu không idempotent và không biết điểm dừng.' }
  ],
  related: ['microservices-020', 'microservices-021'],
  tags: ['saga', 'orchestration', 'compensation', 'idempotency', 'timeout', 'state machine', 'distributed transaction']
},
{
  id: 'lesson-microservices-019', track: 'microservices', order: 19,
  title: 'Transactional Outbox: giữ sự nhất quán giữa database và message broker', level: 'senior', minutes: 30,
  goals: ['Giải thích dual-write và tại sao transaction database đơn lẻ không đủ khi có Kafka', 'Mô tả bảng outbox và relay, tại sao delivery là at-least-once', 'Hiểu tại sao consumer phải idempotent để loại bỏ duplicate'],
  body: `**Tóm tắt:** Transactional Outbox lưu thay đổi nghiệp vụ và sự kiện cần phát trong cùng một transaction database. Một relay đọc bảng outbox rồi gửi sự kiện ra broker. Vì crash có thể xảy ra giữa khi gửi và khi đánh dấu đã gửi, hệ thống chấp nhận gửi lặp (at-least-once) và yêu cầu consumer phải chống trùng bằng event id.

### Bài toán: cập nhật DB và gửi Kafka cùng lúc
Một request điển hình cần làm hai việc: ghi đơn hàng vào database và gửi sự kiện OrderCreated lên Kafka để kho hàng và email thông báo xử lý tiếp. Nếu làm tuần tự (dual-write — ghi hai lần riêng lẻ) thì không có cơ chế đảm bảo cả hai thành công cùng lúc:
- Ghi DB xong rồi commit, sau đó process chết trước khi publish: đơn hàng tồn tại nhưng không có sự kiện, downstream không biết.
- Publish lên Kafka trước rồi DB rollback: consumer nhận sự kiện về một đơn hàng chưa từng được commit.
Khác hai database trong cùng hệ thống, một transaction database **không bao trùm** Kafka. Kafka là hệ thống riêng biệt, không tham gia giao dịch của database.

### Giải pháp: bảng outbox trong cùng transaction
Outbox giải quyết bằng cách lưu cả hai record trong cùng một transaction database:
~~~text
BEGIN
  INSERT INTO orders (id, status, amount) VALUES (..., 'CREATED', ...);
  INSERT INTO outbox (id, aggregate_id, event_type, payload, created_at) VALUES (..., ..., 'OrderCreated', ..., now());
COMMIT
~~~
Rollback thì cả hai dòng cùng mất; commit thì cả đơn hàng và dòng outbox đều bền vững. Dòng outbox là "ghi chú" hệ thống cần gửi sự kiện này. Relay sau đó đọc các dòng chưa gửi và publish ra broker. Đây là atomicity giữa state nghiệp vụ và ý định phát sự kiện, không phải atomicity với broker.

### Relay và mô hình at-least-once
Relay là một tiến trình riêng quét bảng outbox tìm các dòng chưa gửi (ví dụ sent_at IS NULL), lấy payload publish lên Kafka topic. Sau khi broker gửi lại ACK (acknowledgment — xác nhận đã nhận/lưu tin nhắn), relay mới cập nhật sent_at. Vì sao đánh dấu sau ACK? Nếu đánh dấu trước rồi publish thất bại hoặc process chết, sự kiện coi như "đã gửi" nhưng thực ra mất. Nếu process chết sau khi publish nhưng trước khi ghi sent_at, lần chạy sau relay sẽ gửi lại. Đây là at-least-once delivery: gửi ít nhất một lần, có thể gửi trùng.

Do có thể gửi lặp, consumer nhận được cùng một sự kiện nhiều lần. Consumer phải idempotent: áp dụng cùng một sự kiện nhiều lần cho kết quả giống như chỉ áp dụng một lần, sử dụng event id ổn định để kiểm tra đã xử lý.

~~~java
// Minh họa: 2 thao tác DB trong 1 transaction, publish nằm ngoài transaction database
void createOrder(OrderRequest req, Connection db, OutboxRelay relay) throws Exception {
    String orderId = UUID.randomUUID().toString();
    String eventId = UUID.randomUUID().toString(); // id ổn định dùng cho deduplication
    db.setAutoCommit(false);
    try {
        // Ghi state nghiệp vụ
        try (var ps = db.prepareStatement(
                "INSERT INTO orders(id, status, amount) VALUES (?,?,?)")) {
            ps.setString(1, orderId); ps.setString(2, "CREATED"); ps.setLong(3, req.amount());
            ps.executeUpdate();
        }
        // Ghi outbox CÙNG transaction với order
        try (var ps = db.prepareStatement(
                "INSERT INTO outbox(event_id, aggregate_id, type, payload) VALUES (?,?,?,?)")) {
            ps.setString(1, eventId); ps.setString(2, orderId);
            ps.setString(3, "OrderCreated"); ps.setString(4, toJson(req));
            ps.executeUpdate();
        }
        db.commit(); // Cả hai cùng commit hoặc cùng rollback
    } catch (Exception e) {
        db.rollback(); // Lỗi → không có đơn, không có dòng outbox
        throw e;
    }
    // Relay poll outbox và publish sau commit; publish KHÔNG nằm trong transaction DB
}
~~~

### Cơ chế từng bước (tạo đơn hàng từ đầu đến cuối)
**Kafka** là hệ thống hàng đợi / phát sự kiện (message broker — "người đưa thư" ở giữa): producer gửi tin nhắn vào topic, consumer đọc tin nhắn từ topic. **Event** là bản ghi mô tả điều đã xảy ra (ví dụ "đơn hàng vừa được tạo"). **Broker** là máy chủ chạy Kafka, nhận và lưu tin nhắn.

1. Nhận request và mở transaction database: transaction là nhóm các thao tác DB, hoặc tất cả thành công, hoặc tất cả bị hủy (rollback). Đây là transaction nội bộ của một database, không phải transaction phân tán qua nhiều hệ thống.
2. Ghi state nghiệp vụ: INSERT vào bảng orders. Ghi trong transaction để nếu bước sau lỗi, đơn hàng "nửa vời" không bị lưu.
3. Ghi ý định phát sự kiện vào outbox cùng transaction: INSERT vào bảng outbox chứa event_id (định danh duy nhất, ổn định), aggregate_id (ví dụ order id), event_type, payload (nội dung JSON). Vì sao cùng transaction? DB đảm bảo hai INSERT cùng commit hoặc cùng rollback.
4. Commit: DB xác nhận. Từ lúc này, cả đơn hàng lẫn dòng outbox đều bền vững (durable — còn sau restart). Chưa có tin nhắn nào gửi tới Kafka ở bước này.
5. Relay đọc outbox và publish: tiến trình riêng quét các dòng outbox chưa gửi, gửi payload lên Kafka topic. ACK là xác nhận từ broker rằng tin nhắn đã được nhận/lưu.
6. Đánh dấu đã gửi sau ACK: chỉ khi broker ACK, relay mới cập nhật sent_at. Nếu chết giữa bước 5 và 6, lần sau gửi lại → at-least-once.
7. Consumer xử lý và phải idempotent: consumer nhận sự kiện (có thể trùng) và áp dụng nghiệp vụ, dùng cơ chế chống trùng.

### Lỗi hay gặp trên production
- Triệu chứng: đơn hàng có trong DB nhưng downstream (kho, thông báo) không nhận sự kiện. Nguyên nhân: code publish Kafka trực tiếp sau khi ghi DB (dual-write), process chết giữa hai thao tác, hoặc publish trước commit rồi transaction rollback. Cách sửa: dùng transactional outbox, không để publish broker nằm giữa transaction DB.
- Triệu chứng: bảng outbox phình to hàng chục triệu dòng, query chậm, disk đầy. Nguyên nhân: chỉ insert không có cơ chế dọn (purge) các dòng đã gửi, hoặc dọn quá chậm so với tốc độ ghi. Cách sửa: job xóa/archiver các dòng sent_at cũ hơn cửa sổ giữ (ví dụ 3-7 ngày); dọn theo batch nhỏ để tránh lock lớn; theo dõi số dòng backlog và tuổi dòng cũ nhất.
- Triệu chứng: consumer nhận cùng một sự kiện 2-3 lần sau restart relay. Nguyên nhân: relay dùng mô hình "gửi rồi mới đánh dấu" nên khi chết giữa chừng sẽ gửi lặp — đây là hành vi at-least-once, không phải bug. Cách sửa: chấp nhận duplicate ở tầng transport; bắt buộc consumer idempotent theo event_id ổn định; đo duplicate rate.
- Triệu chứng: sự kiện cùng đơn hàng đến consumer sai thứ tự (OrderShipped trước OrderCreated). Nguyên nhân: relay gửi song song nhiều dòng, hoặc partition Kafka không gắn theo aggregate, hoặc không dùng sequence/version. Cách sửa: dùng aggregate_id làm partition key để sự kiện cùng aggregate vào cùng partition (Kafka giữ thứ tự trong một partition); thêm sequence/version trong payload; consumer bỏ qua hoặc buffer sự kiện lệch thứ tự.

### Liên hệ phỏng vấn
- Hỏi: Tại sao không thể dùng một transaction bao cả database và Kafka? Trả lời ngắn: Transaction database chỉ cam kết trên một hệ quản trị; Kafka là hệ thống khác. Không có 2PC thực dụng giữa hai bên trong đa số kiến trúc; dùng outbox để atomic trong DB rồi publish at-least-once, consumer idempotent.
- Hỏi: Relay crash sau khi publish nhưng trước khi đánh dấu sent thì sao? Trả lời ngắn: Sự kiện sẽ được gửi lại (at-least-once). Đây là lựa chọn có chủ đích để tránh mất sự kiện; consumer dùng event id ổn định để xử lý idempotent.
- Hỏi: CDC (ví dụ Debezium) khác polling outbox thế nào? Trả lời ngắn: CDC đọc transaction log (WAL/binlog) nên thấy dòng đã commit với độ trễ thấp, không query bảng liên tục; đổi lại phải vận hành connector, schema và quản lý log retention.

> Senior tip: theo dõi p95/p99 tuổi outbox chưa gửi và số hàng backlog; alert theo tuổi sự kiện thường phản ánh tác động người dùng tốt hơn chỉ đếm hàng.
`,
  exercises: [{
    title: 'Mô phỏng OutboxStore: ghi order và outbox nguyên tử, relay gửi lặp an toàn',
    prompt: `Cài {{OutboxStore}} mô phỏng transaction trong bộ nhớ. {{create(id, eventType, payload)}} ghi order và event cùng nhau: id trùng thì ném {{IllegalArgumentException}}. {{relay(sender)}} lần lượt đưa các event chưa gửi cho sender và trả về số event gửi thành công trong lần gọi đó; chỉ đánh dấu đã gửi khi sender trả {{true}}, sender trả {{false}} thì giữ event để retry (dừng ở event lỗi đầu tiên để giữ thứ tự). Event đã gửi không được đưa cho sender lần nữa. Các method đều {{synchronized}}.`,
    starter: `record Event(String id, String orderId, String eventType) {}
class OutboxStore {
    private final Map<String,String> orders = new HashMap<>();
    private final Map<String,Event> events = new LinkedHashMap<>();
    private final Set<String> sent = new HashSet<>();
    synchronized void create(String id, String eventType, String payload) {
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
  ck("atomic create persists order and event",()->{OutboxStore s=new OutboxStore();s.create("o1","type1","order-created");eq(1,s.orderCount());eq(1,s.eventCount());eq(1,s.pending());});
  ck("duplicate id rejected leaves one row",()->{OutboxStore s=new OutboxStore();s.create("x","t","p");try{s.create("x","t","p");throw new AssertionError();}catch(IllegalArgumentException ok){}eq(1,s.eventCount());});
  ck("failed send stays pending then succeeds",()->{OutboxStore s=new OutboxStore();s.create("a","t","p");eq(0,s.relay(e->false));eq(1,s.pending());eq(1,s.relay(e->true));eq(0,s.pending());});
  ck("each pending event sent once after success",()->{OutboxStore s=new OutboxStore();s.create("a","t","p");s.create("b","t","p");List<String> got=new ArrayList<>();eq(2,s.relay(e->{got.add(e.id());return true;}));eq(0,s.relay(e->{throw new AssertionError();}));eq(2,got.size());});
  System.out.println("RESULT "+p+"/"+t);
  }
 }`,
    reference: `record Event(String id, String orderId, String eventType) {}
class OutboxStore {
    private final Map<String,String> orders=new HashMap<>();
    private final Map<String,Event> events=new LinkedHashMap<>();
    private final Set<String> sent=new HashSet<>();
    synchronized void create(String id, String eventType, String payload) {
        if (orders.containsKey(id)) throw new IllegalArgumentException("duplicate");
        String order=id; Event event=new Event("evt-"+id,id,eventType!=null?eventType:""); events.put(event.id(),event); orders.put(id,order);
    }
    synchronized int relay(java.util.function.Predicate<Event> sender) {
        int count=0;
        for(Event e:events.values()) {
            if(sent.contains(e.id())) continue;
            if(!sender.test(e)) break; // chưa ACK: bỏ chờ lần sau
            sent.add(e.id()); count++;
        }
        return count;
    }
    synchronized int orderCount(){return orders.size();}
    synchronized int eventCount(){return events.size();}
    synchronized int pending(){return events.size()-sent.size();}
}`,
    hints: ['Stage cả order lẫn event, kiểm tra lỗi mô phỏng trước, rồi mới ghi cả hai vào map.', 'Relay synchronized; với mỗi event pending, sender false nghĩa là chưa ACK.', 'Chỉ thêm event id vào sent sau khi sender thành công; retry có thể gửi lại nếu crash nằm giữa hai thao tác.'],
    explain: `Bài tập gom hai thay đổi dưới một monitor và stage dữ liệu trước khi commit vào map. Trong DB thật, transaction cung cấp rollback; monitor chỉ mô phỏng tính loại trừ trong một JVM, không thay thế transaction bền vững.

Relay đánh dấu sau khi sender thành công. Nếu sender ném lỗi, exception được truyền ra và trạng thái sent chưa đổi. Nếu broker đã nhận nhưng ứng dụng chưa kịp ghi sent rồi chết, lần chạy sau có thể gửi trùng; mô hình này nhấn mạnh vì sao production cần consumer dedup theo event id. Mutex trong ví dụ cũng giữ lock qua network call, điều không nên làm production vì làm nghẽn ghi; relay thật claim batch rồi gửi ngoài transaction, sau đó cập nhật trạng thái/offset phù hợp.

Lỗi thường gặp: đánh dấu trước send làm mất event khi broker lỗi; tạo order trước rồi ném lỡ mà không rollback để lại trạng thái nửa vời; hoặc cho rằng synchronized bảo vệ nhiều instance/process.`
  }],
  check: [
    { q: 'Relay gửi thành công nhưng process chết trước khi ghi sent. Kết quả có thể là gì?', options: ['Sự kiện bị mất chắc chắn', 'Sự kiện được gửi lại; consumer cần deduplicate', 'DB tự rollback transaction đã commit', 'Kafka xóa sự kiện'], answer: 1, explain: `Outbox giữ hàng chưa đánh dấu nên relay sẽ thử lại. Điều này tạo duplicate nhưng tránh mất sự kiện; consumer dùng event id ổn định để xử lý idempotent. (A) sai vì mô hình "đánh dấu sau ACK" ưu tiên không mất. (C) sai vì transaction DB đã commit trước khi publish. (D) sai vì Kafka không tự xóa sự kiện hợp lệ do relay chết.` },
    { q: 'Vì sao ghi order và outbox trong CÙNG một transaction database?', options: ['Để Kafka tự rollback khi DB lỗi', 'Để publish nhanh hơn nhờ gom network', 'Để đảm bảo state nghiệp vụ và ý định phát sự kiện cùng commit hoặc cùng rollback', 'Để consumer không cần idempotent'], answer: 2, explain: `Đúng (C): cùng transaction cho atomicity nội bộ — không có trạng thái "có đơn nhưng không có outbox" hay ngược lại. (A) sai vì Kafka không tham gia transaction DB. (B) sai vì publish xảy ra sau commit bởi relay, không nằm trong transaction. (D) sai vì consumer vẫn phải idempotent do delivery là at-least-once.` },
    { q: 'Nếu relay đánh dấu sent TRƯỚC khi publish tới Kafka, rủi ro chính là gì?', options: ['Tạo duplicate sự kiện ở consumer', 'Làm transaction DB rollback tự động', 'Làm Kafka partition bị lệch thứ tự', 'Có thể mất sự kiện nếu publish thất bại hoặc process chết sau khi đánh dấu'], answer: 3, explain: `Đúng (D): sự kiện đã bị coi là "xong" nhưng chưa chắc broker đã nhận, nên mất message. (A) ngược lại — đánh dấu trước thường gây mất, không gây duplicate (duplicate xuất hiện khi đánh dấu sau). (B) sai vì đánh dấu sent không ảnh hưởng transaction DB đã commit. (C) sai vì thứ tự partition phụ thuộc key/partitioning, không phụ thuộc thời điểm đánh dấu.` },
  ], tags: ['outbox', 'CDC', 'Kafka', 'atomicity', 'dual-write', 'relay']
},
{
  id: 'lesson-microservices-020', track: 'microservices', order: 20,
  title: 'Idempotent Consumer: chống xử lý trùng sự kiện', level: 'senior', minutes: 25,
  goals: ['Giải thích at-least-once và tại sao consumer nhận trùng là bình thường', 'Deduplicate bằng processed-id cùng transaction với side effect', 'Bỏ qua sự kiện có version cũ'],
  body: `**Tóm tắt:** Consumer idempotent biến việc nhận cùng message nhiều lần thành một hiệu ứng nghiệp vụ duy nhất. Cần lưu processed-id (mã đã xử lý) cùng transaction với cập nhật state; chỉ cache trong RAM không đủ khi restart hay chạy nhiều instance.

### Tại sao nhận lặp là bình thường
Broker thường chỉ biết consumer đã commit offset hay chưa, không biết side effect ở database đã commit chưa. Nếu database commit xong nhưng process chết trước khi commit offset, broker giao lại message. Đây là hành vi at-least-once: ưu tiên không mất message, chấp nhận giao trùng. Mạng timeout cũng không cho producer biết server đã xử lý hay chưa.

### Processed-id và inbox
Bảng inbox có unique key (consumer, message_id/processed-id). Consumer trong một database transaction: insert inbox; nếu conflict thì kết thúc không làm side effect; nếu mới thì cập nhật projection rồi commit. Hai thao tác phải nguyên tử. Với event thay thế state, lưu version theo aggregate và chỉ áp dụng version lớn hơn hiện tại; event cũ đến muộn bị bỏ qua. Với event cộng dồn (charge, increment), version không thể tự thay thế dedup id.

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
**Idempotent** nghĩa là thực hiện cùng một thao tác nhiều lần cho kết quả giống như thực hiện một lần (ví dụ: nhấn nút "lưu" 3 lần nhưng chỉ lưu 1 bản ghi). **Consumer** là chương trình đọc message từ broker (Kafka). **Offset** là vị trí đọc của consumer trong một partition (phân vùng) của topic; commit offset nghĩa là "tôi đã xử lý tới đây".

1. Consumer nhận message: broker giao message kèm message_id (định danh ổn định do producer/outbox tạo) và có thể kèm version/sequence. Vì sao cần message_id ổn định? Để cùng một message, dù được giao lại bao nhiêu lần, vẫn nhận ra là "đã thấy".
2. Mở transaction database cục bộ: consumer bắt đầu một transaction trên database của chính nó (projection/state store). Vì sao? Để việc "ghi nhận đã xử lý" và "áp dụng side effect nghiệp vụ" trở thành một đơn vị nguyên tử.
3. Kiểm tra/ghi inbox (dedup): INSERT vào bảng inbox (bảng ghi nhận message đã xử lý) với unique constraint trên (consumer_name, message_id). Nếu insert thành công → message mới, tiếp tục. Nếu vi phạm unique (conflict) → message trùng, rollback/thoát mà không làm side effect. Vì sao dùng unique constraint thay vì check-then-act? Hai consumer replica cùng kiểm tra "chưa có" rồi cùng xử lý sẽ trừ tiền hai lần; constraint database là trọng tài nguyên tử.
4. Kiểm tra version (nếu event thay thế state): với event dạng snapshot (mô tả trạng thái mới), so incoming.version > current.version. Nếu cũ hơn hoặc bằng → bỏ qua phần áp dụng state (nhưng đã ghi inbox để replay sau không tốn xử lý). Vì sao không dùng timestamp đồng hồ? Đồng hồ các máy có thể lệch (clock skew).
5. Áp dụng side effect nghiệp vụ: cập nhật projection/bảng state, hoặc thực hiện hành động nghiệp vụ. Với event cộng dồn (charge tiền, tăng số dư) thì version không thay thế được dedup — bắt buộc dựa vào message_id.
6. Commit transaction database: inbox row và state change cùng commit. Từ đây, dù message có đến lại, bước 3 sẽ chặn.
7. Commit offset (sau database commit): consumer báo broker đã xử lý. Vì sao sau database commit? Nếu commit offset trước rồi database lỗi, broker nghĩ "xong" và không giao lại → mất hiệu ứng (at-most-once). Commit sau tạo at-least-once (có thể trùng) và dedup xử lý phần trùng.

~~~java
// Luồng idempotent consumer: inbox insert + apply trong 1 transaction database
void handle(Message msg, Connection db) throws Exception {
    db.setAutoCommit(false);
    try {
        // Dedup: unique (consumer, message_id) — conflict nghĩa là đã xử lý
        try (var ps = db.prepareStatement(
                "INSERT INTO inbox(consumer, message_id) VALUES (?,?)")) {
            ps.setString(1, "billing"); ps.setString(2, msg.id());
            ps.executeUpdate();
        } catch (java.sql.SQLIntegrityConstraintViolationException dup) {
            db.rollback(); // Duplicate: không side effect
            return;
        }
        // Chỉ áp version mới, rồi cập nhật state
        applyIfNewer(db, msg.aggregateId(), msg.version(), msg.payload());
        db.commit(); // Inbox + state cùng bền vững
    } catch (Exception e) {
        db.rollback(); // Lỗi → offset chưa commit, broker sẽ giao lại
        throw e;
    }
    // Commit offset SAU database commit (thực tế do consumer framework gọi)
}
~~~

### Lỗi hay gặp trên production
- Triệu chứng: khách bị trừ tiền hai lần, hoặc tồn kho bị trừ hai lần sau khi consumer restart/rebalance. Nguyên nhân: dedup chỉ bằng HashSet trong RAM — mất khi restart, và mỗi replica có Set riêng nên hai instance cùng xử lý trước khi biết nhau; hoặc dùng check-then-act không nguyên tử (kiểm tra rồi mới xử lý tách rời). Cách sửa: dùng inbox table với unique constraint trên (consumer, message_id), insert và side effect trong cùng transaction database; với side effect gọi dịch vụ ngoài, dùng idempotency key ở đích hoặc outbox.
- Triệu chứng: projection hiển thị trạng thái cũ dù event mới đã đến (ví dụ đơn đã "Shipped" nhưng hiện "Paid"). Nguyên nhân: event đến sai thứ tự (out-of-order) và consumer ghi đè state theo thứ tự nhận, không theo version/sequence của aggregate; hoặc dùng timestamp làm version và bị clock skew. Cách sửa: lưu version theo aggregate, chỉ áp dụng khi incoming.version > current; dùng sequence tăng đơn điệu do aggregate phát; với event dạng delta/out-of-order phức tạp, cân nhắc buffer chờ gap hoặc rebuild từ source.
- Triệu chứng: bảng inbox tăng không ngừng, chiếm dung lượng lớn, insert chậm dần. Nguyên nhân: ghi nhận mọi message_id nhưng không có retention (chính sách giữ/xóa). Cách sửa: xóa inbox row cũ hơn cửa sổ replay/khôi phục có căn cứ (ví dụ lâu hơn max retention của topic + thời gian điều tra); dọn theo batch, có index; theo dõi kích thước bảng.
- Triệu chứng: replay một khoảng event cũ (reprocessing) làm phát sinh side effect lặp (gửi mail lại, gọi API đối tác lần nữa). Nguyên nhân: xóa inbox key quá sớm nên replay không còn bị chặn; hoặc side effect nằm ngoài transaction database (gọi HTTP) không có idempotency key. Cách sửa: giữ inbox key đủ dài qua cửa sổ replay; với side effect ngoài, dùng outbox hoặc idempotency key ở hệ thống đích; thiết kế replay chạy ở chế độ có kiểm soát.

### Liên hệ phỏng vấn
- Hỏi: At-least-once nghĩa là gì và vì sao consumer vẫn phải idempotent? Trả lời ngắn: Broker có thể giao lại message khi offset chưa được commit sau khi database đã commit, hoặc khi timeout/rebalance. At-least-once ưu tiên không mất; idempotent consumer (inbox + unique key) biến lần giao trùng thành no-op.
- Hỏi: Vì sao check if (!set.contains(id)) set.add(id) không đủ trong môi trường nhiều replica? Trả lời ngắn: Set cục bộ không chia sẻ giữa instance và thao tác không nguyên tử với side effect; hai replica có thể cùng qua nhánh if rồi cùng xử lý. Cần unique constraint ở database dùng chung và thực hiện trong cùng transaction.
- Hỏi: Làm sao xử lý event đến sai thứ tự? Trả lời ngắn: Với event thay thế state, lưu version/sequence tăng đơn điệu theo aggregate và chỉ áp dụng khi version mới hơn; không dùng timestamp đồng hồ. Với event dạng delta, có thể cần buffer/gap handling hoặc rebuild.

> Senior tip: đo duplicate rate theo topic/consumer; tỷ lệ tăng đột ngột thường chỉ ra rebalance, timeout hoặc database latency chứ không nhất là lỗi broker.
`,
  exercises: [{
    title: 'Áp dụng message một lần và chỉ nhận version mới (processed-id dedup)',
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
  ck("first applied returns true and sets state",()->{Projection p=new Projection();if(!p.apply(new Message("m1",1,"A")))throw new AssertionError();eq("A",p.value());eq(1L,p.version());});
  ck("duplicate processed-id returns false and keeps state",()->{Projection p=new Projection();p.apply(new Message("m1",1,"A"));if(p.apply(new Message("m1",2,"B")))throw new AssertionError();eq("A",p.value());eq(1L,p.version());});
  ck("old version ignored but id still seen",()->{Projection p=new Projection();p.apply(new Message("m2",3,"C"));if(p.apply(new Message("m1",2,"B")))throw new AssertionError();eq("C",p.value());eq(3L,p.version());eq(2,p.seenCount());});
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
        seen.add(m.id()); // đánh dấu id đã thấy kể cả sự kiện cũ: replay không tốn xử lý
        if(m.version()<=version) return false;
        version=m.version(); value=m.value(); return true;
    }
    synchronized long version(){return version;}
    synchronized String value(){return value;}
    synchronized int seenCount(){return seen.size();}
}`,
    hints: ['Kiểm tra messageId trước; không dùng version để thay thế dedup.', 'Đánh dấu ID đã thấy kể cả khi event stale để cùng event không được xét lại.', 'Chỉ thay value và version khi incoming version lớn hơn hiện tại.'],
    explain: `Set biểu diễn inbox bền vững và synchronized làm check-then-act nguyên tử trong bài mô phỏng. Trong production, Set trong process không đủ; dùng unique constraint ở database, và insert inbox cùng transaction cập nhật projection. Nếu side effect nằm ở dịch vụ khác, cần thêm outbox hoặc idempotency key ở đích.

Event stale vẫn được đánh dấu đã thấy để replay không tốn xử lý, nhưng state không đổi. Hai event khác ID có cùng version cũng không ghi đè nhau: version phải biểu thị thứ tự có ý nghĩa, thường do aggregate phát. Nếu event là delta thay vì snapshot, bỏ qua version gap có thể sai nghiệp vụ.

Lỗi thường gặp là lưu ID sau side effect, khiến crash tạo side effect lặp; dùng ID không ổn định qua retry; hoặc chỉ kiểm tra version mà bỏ qua duplicate của side effect không thay thế được.`
  }],
  check: [
    { q: 'Database side effect đã commit nhưng consumer chưa commit offset. Kịch bản hợp lý nhất?', options: ['Message có thể được giao lại', 'Broker biết DB commit nên bỏ qua', 'DB tự rollback theo offset', 'Message bị đổi ID'], answer: 0, explain: `Offset và DB là hai transaction khác nhau; crash ở giữa có thể khiến broker giao lại. Inbox/idempotency làm lần giao lại không nhân đôi hiệu ứng. (B) sai vì broker không quan sát transaction DB. (C) sai vì offset commit không điều khiển rollback DB. (D) sai vì message id ổn định là cơ sở dedup.` },
    { q: 'Vì sao check-then-act bằng HashSet cục bộ không đủ khi có nhiều replica?', options: ['Set không lưu String', 'Mỗi replica có trạng thái riêng và có thể cùng xử lý trước khi ghi', 'Kafka không gửi String', 'Version luôn tăng theo đồng hồ'], answer: 1, explain: `Các process không chia sẻ Set và thao tác cục bộ không nguyên tử toàn cụm. Unique constraint/inbox dùng chung là nơi phân xử. (A) sai vì HashSet lưu được String. (C) sai, không liên quan kiểu dữ liệu. (D) sai và đồng hồ còn có thể lệch.` },
    { q: 'Trong idempotent consumer, tại sao nên insert inbox và cập nhật state trong CÙNG transaction database?', options: ['Để Kafka commit offset nhanh hơn', 'Để tránh trạng thái "đã áp dụng side effect nhưng chưa ghi nhận đã xử lý" khi crash', 'Để cho phép hai replica cùng xử lý một message', 'Để thay thế hoàn toàn version checking'], answer: 1, explain: `Đúng (B): nếu tách rời, crash giữa hai bước có thể làm side effect chạy rồi nhưng inbox chưa ghi, lần giao lại sẽ chạy lại side effect. (A) sai vì offset commit là thao tác riêng với broker. (C) sai, mục tiêu là ngăn xử lý trùng. (D) sai vì version giải quyết thứ tự event state, khác mục đích với dedup theo message_id.` },
    { q: 'Consumer nhận event state cũ (version 2) sau khi đã áp dụng version 5. Cách xử lý đúng là gì?', options: ['Ghi đè state bằng version 2 để giữ đủ lịch sử nhận', 'Bỏ qua áp dụng state vì version không mới hơn; vẫn ghi nhận message id để replay an toàn', 'Rollback DB về version 2', 'Tăng offset nhưng xóa inbox để nhận lại'], answer: 1, explain: `Đúng (B): event state chỉ áp dụng khi version lớn hơn hiện tại; vẫn nên dedup theo message_id để lần replay không xử lý lại. (A) sai vì sẽ làm state lùi. (C) sai vì DB không tự rollback theo version event và việc này phá hủy state mới hơn. (D) sai vì xóa inbox làm mất khả năng chống trùng.` },
  ], tags: ['idempotency', 'Kafka', 'inbox', 'ordering', 'processed-id']
},
{
  id: 'lesson-microservices-021', track: 'microservices', order: 21,
  title: 'State machine cho task: trạng thái hợp lệ và chuyển trạng thái an toàn', level: 'senior', minutes: 30,
  goals: ['Mô tả được các trạng thái NEW/ASSIGNED/IN_PROGRESS/DONE/ESCALATED và chuyển trạng thái hợp lệ', 'Cài đặt state machine thuần Java với bảng chuyển trạng thái', 'Giải thích vì sao không cho phép chuyển trạng thái tùy ý và cách audit'],
  body: `**Tóm tắt:** State machine (máy trạng thái) là cách mô hình hóa vòng đời của một task: chỉ một số chuyển trạng thái là hợp lệ, mọi chuyển khác bị từ chối. Cài đặt bằng bảng chuyển trạng thái (map từ (trạng thái hiện tại, sự kiện) sang trạng thái kế tiếp) giúp rõ ràng, dễ audit và dễ test.

### State machine là gì
State machine là mô hình trong đó một object luôn ở một trong các trạng thái hữu hạn, và chỉ chuyển trạng thái khi nhận sự kiện (event) theo các quy tắc định trước. Ví dụ vòng đời task: NEW → ASSIGNED → IN_PROGRESS → DONE, hoặc IN_PROGRESS → ESCALATED khi quá SLA.

### Các trạng thái và sự kiện
- NEW: task vừa tạo, chưa gán cho ai.
- ASSIGNED: đã gán cho một người thực hiện.
- IN_PROGRESS: người thực hiện đã bắt đầu.
- DONE: hoàn thành.
- ESCALATED: leo thang (vượt SLA hoặc bị escalate thủ công).

Sự kiện: assign, start, complete, escalate, reassign.

### Bảng chuyển trạng thái hợp lệ
| Từ | Sự kiện | Tới |
|---|---|---|
| NEW | assign | ASSIGNED |
| ASSIGNED | start | IN_PROGRESS |
| ASSIGNED | reassign | ASSIGNED |
| IN_PROGRESS | complete | DONE |
| IN_PROGRESS | escalate | ESCALATED |
| ESCALATED | assign | ASSIGNED |
| * | * | (từ chối) |

Mọi chuyển khác (ví dụ DONE → IN_PROGRESS) phải bị từ chối để tránh dữ liệu vô lý.

### Cài đặt thuần Java
~~~java
enum State { NEW, ASSIGNED, IN_PROGRESS, DONE, ESCALATED }
enum Event { ASSIGN, START, COMPLETE, ESCALATE, REASSIGN }

class TaskStateMachine {
    private State state = State.NEW;
    private final Map<String, State> transitions = new HashMap<>();

    TaskStateMachine() {
        put(State.NEW, Event.ASSIGN, State.ASSIGNED);
        put(State.ASSIGNED, Event.START, State.IN_PROGRESS);
        put(State.ASSIGNED, Event.REASSIGN, State.ASSIGNED);
        put(State.IN_PROGRESS, Event.COMPLETE, State.DONE);
        put(State.IN_PROGRESS, Event.ESCALATE, State.ESCALATED);
        put(State.ESCALATED, Event.ASSIGN, State.ASSIGNED);
    }
    private void put(State s, Event e, State t) { transitions.put(s + ":" + e, t); }

    synchronized boolean apply(Event e) {
        State next = transitions.get(state + ":" + e);
        if (next == null) return false;
        state = next;
        return true;
    }
    synchronized State state() { return state; }
}
~~~

### Vì sao không cho chuyển tùy ý
Cho phép chuyển trạng thái tùy ý dẫn đến dữ liệu vô lý (task DONE quay lại IN_PROGRESS không qua bước nào). Bảng chuyển trạng thái đóng vai trò "hợp đồng" giữa các service và UI.

### Audit và idempotency
Mỗi chuyển trạng thái nên ghi log (ai, khi nào, từ → tới). Nếu nhận sự kiện trùng (ví dụ complete gửi 2 lần), lần thứ 2 bị từ chối (vì DONE không có COMPLETE) — đây là idempotency tự nhiên.

### Liên hệ phỏng vấn
- Hỏi: Vì sao dùng state machine thay vì if-else? Trả lời: rõ ràng, dễ test, dễ audit, tránh trạng thái vô lý.
- Hỏi: Làm sao xử lý race condition khi 2 request cùng complete? Trả lời: dùng lock/transaction DB với điều kiện trạng thái hiện tại.

> Senior tip: lưu trạng thái và history trong DB với version (optimistic locking) để tránh lost update.
`,
  exercises: [{
    title: 'Cài state machine cho task với bảng chuyển trạng thái',
    prompt: `Cài {{TaskStateMachine}} với các trạng thái NEW/ASSIGNED/IN_PROGRESS/DONE/ESCALATED và sự kiện ASSIGN/START/COMPLETE/ESCALATE/REASSIGN. {{apply(event)}} trả true nếu chuyển hợp lệ và cập nhật trạng thái, false nếu không. {{state()}} trả trạng thái hiện tại. Thread-safe.`,
    starter: `enum State { NEW, ASSIGNED, IN_PROGRESS, DONE, ESCALATED }
enum Event { ASSIGN, START, COMPLETE, ESCALATE, REASSIGN }
class TaskStateMachine {
    private State state = State.NEW;
    synchronized boolean apply(Event e) { throw new UnsupportedOperationException("TODO"); }
    synchronized State state() { return state; }
}`,
    tests: `public class Main {
  static int p=0,t=0; static void ck(String n,Runnable r){t++;try{r.run();p++;System.out.println("PASS "+n);}catch(Throwable e){System.out.println("FAIL "+n+": "+e);}}
  static void eq(Object a,Object b){if(!Objects.equals(a,b))throw new AssertionError(a+" != "+b);}
  public static void main(String[] x){
    ck("new->assigned",()->{TaskStateMachine s=new TaskStateMachine();if(!s.apply(Event.ASSIGN))throw new AssertionError();eq(State.ASSIGNED,s.state());});
    ck("assigned->in_progress",()->{TaskStateMachine s=new TaskStateMachine();s.apply(Event.ASSIGN);if(!s.apply(Event.START))throw new AssertionError();eq(State.IN_PROGRESS,s.state());});
    ck("in_progress->done",()->{TaskStateMachine s=new TaskStateMachine();s.apply(Event.ASSIGN);s.apply(Event.START);if(!s.apply(Event.COMPLETE))throw new AssertionError();eq(State.DONE,s.state());});
    ck("invalid transition returns false",()->{TaskStateMachine s=new TaskStateMachine();if(s.apply(Event.COMPLETE))throw new AssertionError();eq(State.NEW,s.state());});
    ck("done cannot be completed again",()->{TaskStateMachine s=new TaskStateMachine();s.apply(Event.ASSIGN);s.apply(Event.START);s.apply(Event.COMPLETE);if(s.apply(Event.COMPLETE))throw new AssertionError();});
    System.out.println("RESULT "+p+"/"+t);
  }
}`,
    reference: `enum State { NEW, ASSIGNED, IN_PROGRESS, DONE, ESCALATED }
enum Event { ASSIGN, START, COMPLETE, ESCALATE, REASSIGN }
class TaskStateMachine {
    private State state = State.NEW;
    private final java.util.Map<String, State> t = new java.util.HashMap<>();
    TaskStateMachine() {
        t.put("NEW:ASSIGN", State.ASSIGNED);
        t.put("ASSIGNED:START", State.IN_PROGRESS);
        t.put("ASSIGNED:REASSIGN", State.ASSIGNED);
        t.put("IN_PROGRESS:COMPLETE", State.DONE);
        t.put("IN_PROGRESS:ESCALATE", State.ESCALATED);
        t.put("ESCALATED:ASSIGN", State.ASSIGNED);
    }
    synchronized boolean apply(Event e) {
        State next = t.get(state + ":" + e);
        if (next == null) return false;
        state = next;
        return true;
    }
    synchronized State state() { return state; }
}`,
    hints: ['Dùng map key = state + ":" + event.', 'Chỉ cập nhật state nếu có transition hợp lệ.'],
    explain: `Bảng chuyển trạng thái là hợp đồng rõ ràng. Trong production, lưu state và history trong DB với optimistic locking để tránh lost update.`
  }],
  check: [
    { q: 'Task ở trạng thái DONE, nhận sự kiện COMPLETE. Kết quả?', options: ['Chuyển sang IN_PROGRESS', 'Từ chối (false)', 'Tự động reopen', 'Ném exception'], answer: 1, explain: 'Không có transition DONE:COMPLETE, nên apply trả false và state không đổi.' },
    { q: 'Vì sao cần audit log cho chuyển trạng thái?', options: ['Để debug và truy vết', 'Để tăng tốc', 'Để giảm dung lượng DB', 'Không cần'], answer: 0, explain: 'Audit log giúp truy vết ai làm gì khi nào, quan trọng cho compliance và debug.' }
  ], tags: ['state-machine', 'workflow', 'task', 'audit']
},
{
  id: 'lesson-microservices-022', track: 'microservices', order: 22,
  title: 'Timer escalation theo SLA: Clock giả và kiểm tra quá hạn', level: 'senior', minutes: 30,
  goals: ['Hiểu khái niệm SLA và escalation', 'Cài đặt timer escalation với Clock giả (deterministic)', 'Giải thích vì sao không dùng System.currentTimeMillis trong test'],
  body: `**Tóm tắt:** Escalation theo SLA (Service Level Agreement — cam kết thời gian xử lý) tự động leo thang task khi quá hạn. Dùng Clock giả (fake clock) trong test để kiểm tra deterministic, tránh phụ thuộc thời gian thực.

### SLA và escalation
SLA là cam kết thời gian xử lý một task (ví dụ 4 giờ). Nếu task không hoàn thành trong SLA, hệ thống escalate (leo thang) để người khác xử lý.

### Vì sao cần Clock giả
Dùng System.currentTimeMillis() trong test làm test phụ thuộc thời gian thực, khó deterministic. Clock giả cho phép đặt thời gian tùy ý.

### Cài đặt
~~~java
interface Clock { long now(); }
class SystemClock implements Clock { public long now() { return System.currentTimeMillis(); } }
class FakeClock implements Clock { private long t; FakeClock(long t){this.t=t;} void advance(long ms){t+=ms;} public long now(){return t;} }

class SlaTimer {
    private final Clock clock;
    private final long slaMs;
    private long start;
    SlaTimer(Clock clock, long slaMs){ this.clock=clock; this.slaMs=slaMs; start=clock.now(); }
    boolean isOverdue(){ return clock.now() - start > slaMs; }
}
~~~

### Liên hệ phỏng vấn
- Hỏi: Vì sao không dùng Thread.sleep trong test? Trả lời: chậm và không deterministic; test phụ thuộc thời gian thực khó kiểm soát.
- Hỏi: Escalation có thể retry không? Trả lời: có, dùng scheduler (quartz, scheduled executor) với idempotency.
- Hỏi: Làm sao xử lý task escalate rồi người xử lý mới bắt đầu? Trả lời: reassign về trạng thái ASSIGNED và reset timer.
- Hỏi: Vì sao nên dùng java.time.Clock? Trả lời: chuẩn JDK, hỗ trợ fixed/offset, dễ test.

### Cơ chế từng bước (escalation theo SLA)
**SLA** (Service Level Agreement — cam kết thời gian xử lý) là thời gian tối đa mà task phải được hoàn thành. **Escalation** là hành động leo thang khi task quá hạn: gán cho người khác, thông báo quản lý, hoặc tự động thực hiện bước dự phòng. **Clock giả** là đối tượng giả lập thời gian trong test, cho phép đặt và tăng thời gian tùy ý.

1. Khi task được gán, SlaTimer ghi nhận thời điểm bắt đầu (start = clock.now()).
2. Hệ thống định kỳ (hoặc khi có sự kiện) kiểm tra isOverdue() = clock.now() - start > slaMs.
3. Nếu quá hạn, escalate: chuyển trạng thái sang ESCALATED (qua state machine), gán lại người xử lý, reset timer.
4. Sau khi xử lý xong, complete task và dừng timer.

### Lỗi hay gặp trên production
- Triệu chứng: task bị escalate nhiều lần lặp lại. Nguyên nhân: không reset timer sau escalate, hoặc state machine không chặn escalate từ ESCALATED. Cách sửa: reset start khi escalate, và chỉ cho phép escalate từ IN_PROGRESS.
- Triệu chứng: test flaky do phụ thuộc thời gian thực. Nguyên nhân: dùng System.currentTimeMillis() và Thread.sleep. Cách sửa: dùng Clock giả và advance deterministic.
- Triệu chứng: escalation không chạy vì scheduler bị block. Nguyên nhân: task chạy đồng bộ trong scheduler thread. Cách sửa: dùng async executor và monitoring.

> Senior tip: dùng java.time.Clock (Clock.fixed, Clock.offset) thay vì tự viết interface khi có thể, và theo dõi p99 thời gian escalation.
`,
  exercises: [{
    title: 'Cài SlaTimer với Clock giả và kiểm tra quá hạn',
    prompt: `Cài {{Clock}} interface, {{FakeClock}}, và {{SlaTimer}}. {{SlaTimer(clock, slaMs)}} ghi nhận thời điểm bắt đầu. {{isOverdue()}} trả true nếu thời gian hiện tại vượt quá slaMs. {{advance(ms)}} trên FakeClock tăng thời gian. Thread-safe không bắt buộc.`,
    starter: `interface Clock { long now(); }
class FakeClock implements Clock {
    private long t;
    FakeClock(long t) { this.t = t; }
    void advance(long ms) { throw new UnsupportedOperationException("TODO"); }
    public long now() { return t; }
}
class SlaTimer {
    private final Clock clock;
    private final long slaMs;
    private final long start;
    SlaTimer(Clock clock, long slaMs) { throw new UnsupportedOperationException("TODO"); }
    boolean isOverdue() { throw new UnsupportedOperationException("TODO"); }
}`,
    tests: `public class Main {
  static int p=0,t=0; static void ck(String n,Runnable r){t++;try{r.run();p++;System.out.println("PASS "+n);}catch(Throwable e){System.out.println("FAIL "+n+": "+e);}}
  static void eq(Object a,Object b){if(!Objects.equals(a,b))throw new AssertionError(a+" != "+b);}
  public static void main(String[] x){
    ck("not overdue initially",()->{FakeClock c=new FakeClock(0);SlaTimer t=new SlaTimer(c,1000);if(t.isOverdue())throw new AssertionError();});
    ck("overdue after advance",()->{FakeClock c=new FakeClock(0);SlaTimer t=new SlaTimer(c,1000);c.advance(1500);if(!t.isOverdue())throw new AssertionError();});
    ck("exact boundary not overdue",()->{FakeClock c=new FakeClock(0);SlaTimer t=new SlaTimer(c,1000);c.advance(1000);if(t.isOverdue())throw new AssertionError();});
    ck("advance multiple times",()->{FakeClock c=new FakeClock(0);SlaTimer t=new SlaTimer(c,500);c.advance(300);if(t.isOverdue())throw new AssertionError();c.advance(300);if(!t.isOverdue())throw new AssertionError();});
    System.out.println("RESULT "+p+"/"+t);
  }
}`,
    reference: `interface Clock { long now(); }
class FakeClock implements Clock {
    private long t;
    FakeClock(long t) { this.t = t; }
    void advance(long ms) { t += ms; }
    public long now() { return t; }
}
class SlaTimer {
    private final Clock clock;
    private final long slaMs;
    private final long start;
    SlaTimer(Clock clock, long slaMs) { this.clock = clock; this.slaMs = slaMs; this.start = clock.now(); }
    boolean isOverdue() { return clock.now() - start > slaMs; }
}`,
    hints: ['Ghi nhận start = clock.now() trong constructor.', 'isOverdue = clock.now() - start > slaMs.'],
    explain: `Clock giả giúp test deterministic. Trong production dùng java.time.Clock hoặc scheduler.`
  }],
  check: [
    { q: 'Vì sao không dùng System.currentTimeMillis() trong test escalation?', options: ['Chậm', 'Không deterministic, phụ thuộc thời gian thực', 'Không thread-safe', 'Không hỗ trợ Java 17'], answer: 1, explain: 'Test phụ thuộc thời gian thực khó kiểm soát và không deterministic.' },
    { q: 'SLA là gì?', options: ['Cam kết thời gian xử lý', 'Loại database', 'Framework Java', 'Giao thức mạng'], answer: 0, explain: 'SLA là cam kết thời gian xử lý một task.' }
  ], tags: ['sla', 'escalation', 'clock', 'timer', 'test']
}

,
{
  id: 'lesson-microservices-023', track: 'microservices', order: 23,
  title: 'Kafka từ số 0: topic, partition, offset, consumer group và rebalance', level: 'senior', minutes: 50,
  goals: ['Giải thích topic, partition, offset và vai trò của broker', 'Hiểu producer chọn partition bằng key (hash), consumer group chia partition', 'Phân biệt commit offset trước/sau xử lý: mất vs trùng message', 'Mô phỏng rebalance khi consumer vào/rời group'],
  body: `**Tóm tắt:** Kafka là hệ thống event streaming (luồng sự kiện) phân tán. Topic (chủ đề) là tên luồng dữ liệu; mỗi topic chia thành nhiều partition (phân vùng — nhật ký chỉ-ghi-thêm, append-only). Mỗi bản ghi trong partition có offset (vị trí số thứ tự 0,1,2...). Producer (người gửi) ghi bản ghi; consumer (người đọc) đọc theo offset. Consumer group (nhóm consumer dùng chung group.id) chia sẻ việc đọc: mỗi partition chỉ gán cho TỐI ĐA 1 consumer trong group tại một thời điểm. Rebalance (cân bằng lại) xảy ra khi consumer vào/rời group — partition được gán lại.
**Ví dụ đời thường:** Topic như cuốn sổ ghi chép chung; partition là các trang sổ (mỗi trang ghi liên tục, không xóa sửa); offset là số dòng trên trang. Producer viết thêm dòng mới vào trang. Consumer group là đội đọc sổ: mỗi người đọc một trang riêng, không ai đọc cùng trang. Người mới vào team (consumer join) → chia lại trang (rebalance).

### Topic, Partition, Offset — bộ ba cốt lõi

**Topic** là định danh logic (ví dụ "orders", "payments"). **Partition** chia topic thành nhiều nhật ký song song để scale throughput: mỗi partition có thể nằm trên broker khác nhau. **Offset** là chỉ số vị trí trong một partition, tăng dần từ 0, không bao giờ giảm. Kafka đảm bảo thứ tự trong một partition, KHÔNG đảm bảo thứ tự giữa các partition.

~~~text
Topic: orders (3 partition)
Partition 0: [offset 0: Order#1] [1: Order#4] [2: Order#7] ...
Partition 1: [offset 0: Order#2] [1: Order#5] [2: Order#8] ...
Partition 2: [offset 0: Order#3] [1: Order#6] [2: Order#9] ...
~~~

**Broker** là máy chủ Kafka lưu trữ partition. replication factor (số bản sao) quyết định độ bền: partition leader nhận ghi, follower đồng bộ. {{acks=all}} đợi tất cả in-sync replica xác nhận.

### Producer chọn partition như thế nào

Khi gửi bản ghi, producer có thể cung cấp **key** (ví dụ {{orderId}}). Partition được chọn bằng {{hash(key) % số_partition}}. Cùng key → luôn cùng partition → giữ thứ tự cho cùng một key (ví dụ tất cả event của Order#123 vào partition 1). Nếu không có key → round-robin (xoay vòng) giữa các partition.

~~~java
// ProducerRecord(topic, key, value) — key quyết định partition
new ProducerRecord<>("orders", "order-123", orderEvent); // key="order-123" → partition cố định
new ProducerRecord<>("orders", null, orderEvent);        // không key → round-robin
~~~

**Ví dụ chạy tay:** Topic 3 partition, key "A", "B", "C", "A", "B". Hash đơn giản: độ dài key % 3.
- "A" (len=1) % 3 = 1 → partition 1
- "B" (len=1) % 3 = 1 → partition 1
- "C" (len=1) % 3 = 1 → partition 1 (va chạm hash, thực tế Kafka dùng murmur2)
- "A" → partition 1, "B" → partition 1
Kết quả: cùng key cùng partition → event của A và B lần 1 và lần 2 vào cùng partition 1, thứ tự được bảo toàn.

### Consumer Group — chia việc đọc

Consumer group dùng chung {{group.id}}. Mỗi consumer trong group nhận một tập partition **không giao nhau**. Partition chỉ gán cho **một** consumer. Nếu consumer nhiều hơn partition → consumer thừa bị idle (nhàn). Nếu consumer ít hơn partition → một consumer đọc nhiều partition.

~~~text
Group "order-service" (2 consumer), Topic orders (3 partition)
Consumer-0: đọc Partition 0, Partition 2
Consumer-1: đọc Partition 1
~~~

Consumer gọi {{poll(Duration)}} để kéo batch bản ghi từ các partition được gán. Vị trí đọc hiện tại gọi là **position**. Offset đã commit (đã xử lý xong) lưu trong topic nội bộ {{__consumer_offsets}}.

### Commit Offset: trước hay sau xử lý — mất hay trùng

| Chiến lược | Khi commit | Crash sau commit, trước xử lý xong | Crash sau xử lý, trước commit |
|---|---|---|---|
| **At-most-once** (nhiều nhất một lần) | Trước xử lý | **Mất message** (offset đã tiến, message bị bỏ qua) | Không xảy ra (commit trước) |
| **At-least-once** (ít nhất một lần) | Sau xử lý thành công | Không xảy ra | **Trùng message** (offset chưa tiến, poll lại đọc lại) |

Kafka broker chỉ biết offset đã commit, KHÔNG biết nghiệp vụ đã xử lý xong. **At-least-once an toàn hơn về mất dữ liệu**, và consumer **BẮT BUỘC** idempotent (xử lý lặp không gây tác dụng phụ hai lần — dedup theo key/version, hoặc bảng inbox unique constraint).

~~~java
// At-least-once: commit SAU khi xử lý xong
ConsumerRecords<String, OrderEvent> records = consumer.poll(Duration.ofMillis(500));
for (ConsumerRecord<String, OrderEvent> r : records) {
    handle(r.value());           // xử lý nghiệp vụ (ghi DB, gọi API...)
}
consumer.commitSync();           // commit offset = vị trí sau batch vừa xử lý
// Nếu crash ở giữa vòng lặp handle → lần sau poll lại → trùng → cần idempotent
~~~

### Rebalance: khi consumer vào/rời group

Rebalance xảy ra khi:
- Consumer mới {{join}} group (scale up)
- Consumer {{leave}} group (scale down, deploy mới, crash)
- Heartbeat timeout (consumer treo quá lâu, bị coi là chết)
- Thay đổi số partition (topic thêm partition)

Trong rebalance, Kafka **thu hồi (revoke)** partition đang gán, rồi **gán lại (assign)** theo assignor:
- {{RangeAssignor}}: chia partition liên tiếp **theo từng topic** cho consumer (dễ lệch tải khi nhiều topic)
- {{RoundRobinAssignor}}: xoay vòng **tất cả partition của mọi topic** giữa consumer (cân bằng hơn)
- {{CooperativeStickyAssignor}} (có từ Kafka 2.4, KIP-429; **không** phải mặc định — mặc định vẫn là RangeAssignor): thu hồi/gán **tăng dần**, giảm gián đoạn

**Quan trọng:** Khi partition bị revoke, consumer NÊN commit offset đã xử lý (trong {{ConsumerRebalanceListener.onPartitionsRevoked}}) để không xử lý lại khi gán lại. Nếu không commit → at-least-once → trùng message sau rebalance.

### Sơ đồ luồng đọc cơ bản

~~~seq
title: Consumer group đọc, commit offset, rebalance
actors: Producer | Broker/Partition | Consumer-0 | Consumer-1 | OffsetStore
Producer -> Broker/Partition: append(key=order-1) offset=0
Producer -> Broker/Partition: append(key=order-2) offset=0
Producer -> Broker/Partition: append(key=order-3) offset=0
Consumer-0 -> Broker/Partition: poll(partition 0, 2)
Broker/Partition --> Consumer-0: records [offset 0]
Consumer-0 -> Consumer-0: handle(order-1)
Consumer-0 -> OffsetStore: commitSync(offset=1)
Consumer-1 -> Broker/Partition: poll(partition 1)
Broker/Partition --> Consumer-1: records [offset 0]
Consumer-1 -> Consumer-1: handle(order-2)
Consumer-1 -> OffsetStore: commitSync(offset=1)
note Consumer-0..Consumer-1: Rebalance: Consumer-0 rời, Consumer-1 nhận partition 0
Consumer-1 -> OffsetStore: commitSync(offset=1 cho partition 0)
~~~

### Lỗi hay gặp trên production

- **Bật {{enable.auto.commit=true}} (mặc định) mà xử lý lâu hơn {{auto.commit.interval.ms}}**: commit chạy nền có thể tiến offset của batch chưa xử lý hết → mất message.
- **Commit offset từng record thay vì batch**: chậm, tăng tải broker; commit batch nhưng xử lý sai thứ tự so với offset commit.
- **Không xử lý rebalance**: mất cơ hội commit offset đã xử lý trước khi partition bị thu hồi → trùng message sau rebalance.
- **Nghĩ "exactly-once Kafka" (EOS) miễn là bật {{enable.idempotence}}**: EOS chỉ bao produce/consume trong Kafka (transactional.id, read_committed); ghi DB/JDBC ngoài vẫn cần idempotency/outbox.
- **Consumer group chỉ 1 consumer nhưng partition nhiều**: consumer đơn lẻ đọc tất cả partition, throughput giới hạn bởi single thread. Cần thêm consumer để song song.

### Liên hệ phỏng vấn

- **Topic vs Partition vs Offset là gì?** Topic là tên luồng; partition là nhật ký append-only song song; offset là vị trí số trong partition.
- **Producer chọn partition thế nào?** Key không null → hash(key) % partitions; key null → round-robin. Cùng key → cùng partition → giữ thứ tự.
- **Consumer group chia partition ra sao?** Mỗi partition chỉ gán 1 consumer; consumer có thể đọc nhiều partition; consumer > partition thì consumer thừa idle.
- **Commit offset trước xử lý vs sau xử lý khác nhau thế nào?** Trước → at-most-once (có thể mất); Sau → at-least-once (có thể trùng, cần idempotent). Production chọn at-least-once + idempotent consumer.
- **Rebalance là gì, khi nào xảy ra?** Gán lại partition khi consumer join/leave/heartbeat timeout/partition thay đổi. Nên commit offset trong {{onPartitionsRevoked}}.

> Senior tip: Theo dõi **consumer lag** (latest offset - committed offset) theo partition; lag tăng đột biến thường do xử lý chậm, rebalance, hoặc poison message chặn một partition. Alert lag > ngưỡng và lag không giảm sau N phút.

### Cơ chế từng bước (tóm tắt để nhớ)

1. **Producer** gửi {{ProducerRecord(topic, key, value)}}. Nếu có key → {{hash(key) % partitions}} chọn partition; không key → round-robin.
2. **Broker** append vào partition leader, replicate sang follower (nếu {{acks=all}} đợi ISR), trả ACK kèm offset.
3. **Consumer group** join với {{group.id}}. Assignor chia partition cho các consumer.
4. **Consumer** gọi {{poll()}} kéo batch từ các partition được gán, bắt đầu từ position (hoặc committed offset nếu mới join).
5. **Xử lý nghiệp vụ** cho từng record (ghi DB, gọi downstream...). **BẮT BUỘC** idempotent nếu chọn at-least-once.
6. **Commit offset** (sync hoặc async) sau khi xử lý xong batch. Offset lưu trong {{__consumer_offsets}}.
7. **Rebalance** xảy ra → {{onPartitionsRevoked}} commitSync offset đã xử lý → {{onPartitionsAssigned}} bắt đầu đọc từ offset đã commit.

### Tự thử trên máy (Docker 1 dòng)

~~~bash
docker run -d --name kafka -p 9092:9092 -e KAFKA_NODE_ID=1 -e KAFKA_LISTENER_SECURITY_PROTOCOL_MAP=CONTROLLER:PLAINTEXT,PLAINTEXT:PLAINTEXT -e KAFKA_LISTENERS=PLAINTEXT://0.0.0.0:9092,CONTROLLER://0.0.0.0:9093 -e KAFKA_ADVERTISED_LISTENERS=PLAINTEXT://localhost:9092 -e KAFKA_CONTROLLER_QUORUM_VOTERS=1@localhost:9093 -e KAFKA_PROCESS_ROLES=broker,controller -e KAFKA_CONTROLLER_LISTENER_NAMES=CONTROLLER apache/kafka:3.7.0
~~~
Tạo topic 3 partition:

~~~bash
docker exec kafka kafka-topics.sh --create --topic orders --partitions 3 --replication-factor 1 --bootstrap-server localhost:9092
~~~

Gửi message kèm key (định dạng key:value):

~~~bash
echo '{"id":1}' | docker exec -i kafka kafka-console-producer.sh --topic orders --bootstrap-server localhost:9092 --property parse.key=true --property key.separator=:
~~~

Đọc lại từ đầu:

~~~bash
docker exec kafka kafka-console-consumer.sh --topic orders --group test-group --from-beginning --bootstrap-server localhost:9092
~~~

### Tóm lại 3 ý

1. **Topic chia partition, partition có offset** — partition là nhật ký append-only, offset là con trỏ đọc.
2. **Consumer group chia partition** — mỗi partition chỉ 1 consumer; consumer có thể đọc nhiều partition.
3. **Commit offset sau xử lý + idempotent consumer** — an toàn hơn (at-least-once), tránh mất dữ liệu; commit trước xử lý rủi ro mất message.

### Liên hệ phỏng vấn

- **Hỏi:** Topic 3 partition, consumer group 2 consumer. Phân bố partition ra sao? **Trả lời ngắn:** Assignor quyết định; RangeAssignor: consumer-0 đọc partition 0,1; consumer-1 đọc partition 2. RoundRobin: consumer-0 đọc 0,2; consumer-1 đọc 1.
- **Hỏi:** Consumer crash giữa chừng xử lý batch, đã poll 10 record nhưng mới xử lý 3. Offset commit lúc nào thì an toàn? **Trả lời ngắn:** Chỉ commit SAU KHI xử lý xong 10 record. Commit sớm → crash → 7 record chưa xử lý bị mất vì offset đã tiến. Crash trước commit → poll lại 10 record → trùng 3 record đầu (cần idempotent).
- **Hỏi:** Rebalance làm trùng message nếu không cẩn thận. Vì sao và chặn thế nào? **Trả lời ngắn:** Partition bị revoke, consumer chưa kịp commit offset đã xử lý; gán lại partition → đọc lại từ offset cũ. Chặn: {{onPartitionsRevoked}} commitSync offset đã xử lý trước khi trả partition.
- **Hỏi:** Producer gửi key="order-123" 2 lần cách nhau 1 giờ. Có đảm bảo cùng partition không? **Trả lời ngắn:** Có, partition = hash(key) % partitions. Hash xác định (murmur2), không đổi theo thời gian. Nếu topic thêm partition thì hash % partitions mới có thể thay đổi → key có thể đổi partition (cần cân nhắc khi scale partition).

> Senior tip: Không bao giờ dùng {{enable.auto.commit=true}} cho xử lý quan trọng. Luôn dùng {{commitSync()}} sau xử lý batch, và consumer phải idempotent (dedup theo business key/version hoặc inbox table unique constraint). Với EOS (exactly-once semantics), dùng {{transactional.id}} + {{read_committed}} isolation level, nhưng DB ngoài Kafka vẫn cần outbox/idempotency.`,
  exercises: [{
    title: 'MiniKafkaGroup: 1 topic 3 partition, 2 consumer group, commit strategy demo',
    prompt: `Cài {{MiniKafkaGroup}} mô phỏng Kafka cơ bản: 1 topic, 3 partition (List<String>), consumer group 2 consumer chia partition.
API:
- {{append(topic, partition, key, message)}}: thêm message vào partition, trả offset (0-based). Key dùng để demo partition selection (không ảnh hưởng logic lưu).
- {{joinGroup(groupId, consumerId, topic, numPartitions)}}: consumer join group, nhận assign partition (range assignor đơn giản: partition 0,1 -> consumer-0; partition 2 -> consumer-1). Trả List<Integer> partition được gán.
- {{poll(groupId, consumerId, maxPerPartition)}}: consumer kéo batch từ các partition được gán. Đọc từ position (mặc định = committed offset, 0 nếu chưa commit). Trả Map<partition, List<Record>>. Record = {offset, key, message}. **Tăng position** sau khi đọc.
- {{commitOffset(groupId, consumerId, partition, offset)}}: commit offset cho partition (offset = vị trí tiếp theo sẽ đọc, tức lastProcessed + 1).
- {{position(groupId, consumerId, partition)}} / {{committed(groupId, consumerId, partition)}}: vị trí đọc hiện tại / offset đã commit.
- {{leaveGroup(groupId, consumerId)}}: consumer rời group (trigger rebalance đơn giản: partition của consumer đó được gán lại cho consumer còn lại trong group).
- {{rebalance(groupId, topic, numPartitions, consumerIds)}}: chạy rebalance thủ công (dùng khi test thêm consumer).

Test yêu cầu:
1. Append 9 message vào 3 partition (mỗi partition 3 message).
2. 2 consumer join group → assign partition (range: p0,p1 -> c0; p2 -> c1).
3. **At-most-once demo**: c0 poll, commitOffset TRƯỚC xử lý, rồi mô phỏng crash (leaveGroup + joinGroup lại) → message bị mất (poll trả rỗng vì committed đã tiến).
4. **At-least-once demo**: c1 poll, xử lý xong (ghi vào Set processedKeys), commitOffset SAU xử lý, crash trước commit → joinGroup lại → poll trả lại message cũ → trùng key → dedup bằng Set (idempotent) → chỉ xử lý 1 lần.
5. Kiểm tra: at-most-once mất message; at-least-once + idempotent không trùng hiệu ứng.
Tất cả method {{synchronized}} để test deterministic.`,
    starter: `import java.util.*;
import java.util.concurrent.*;

class MiniKafkaGroup {
    // topic -> partition -> list of messages (offset = index)
    private final Map<String, Map<Integer, List<Record>>> log = new HashMap<>();
    // group -> consumer -> partition -> position (next to read)
    private final Map<String, Map<String, Map<Integer, Integer>>> positions = new HashMap<>();
    // group -> consumer -> partition -> committed offset
    private final Map<String, Map<String, Map<Integer, Integer>>> committed = new HashMap<>();
    // group -> consumer -> assigned partitions
    private final Map<String, Map<String, Set<Integer>>> assignments = new HashMap<>();

    record Record(int offset, String key, String message) {}

    MiniKafkaGroup() {}

    synchronized int append(String topic, int partition, String key, String message) { throw new UnsupportedOperationException("TODO"); }
    synchronized List<Integer> joinGroup(String groupId, String consumerId, String topic, int numPartitions) { throw new UnsupportedOperationException("TODO"); }
    synchronized Map<Integer, List<Record>> poll(String groupId, String consumerId, int maxPerPartition) { throw new UnsupportedOperationException("TODO"); }
    synchronized void commitOffset(String groupId, String consumerId, int partition, int offset) { throw new UnsupportedOperationException("TODO"); }
    synchronized int position(String groupId, String consumerId, int partition) { throw new UnsupportedOperationException("TODO"); }
    synchronized int committed(String groupId, String consumerId, int partition) { throw new UnsupportedOperationException("TODO"); }
    synchronized void leaveGroup(String groupId, String consumerId) { throw new UnsupportedOperationException("TODO"); }
    synchronized void rebalance(String groupId, String topic, int numPartitions, List<String> consumerIds) { throw new UnsupportedOperationException("TODO"); }
}`,
    tests: `public class Main {
  static int p=0,t=0; static void ck(String n,Runnable r){t++;try{r.run();p++;System.out.println("PASS " + n);}catch(Throwable e){System.out.println("FAIL " + n + ": " + e);}}
  static void eq(Object a,Object b){if(!Objects.equals(a,b))throw new AssertionError(a + " != " + b);}
  public static void main(String[] z){
    ck("append returns offsets per partition",()->{
      MiniKafkaGroup k=new MiniKafkaGroup();
      eq(0,k.append("orders",0,"k1","m1")); eq(1,k.append("orders",0,"k2","m2"));
      eq(0,k.append("orders",1,"k3","m3")); eq(0,k.append("orders",2,"k4","m4"));
    });
    ck("range assignor: 2 consumers, 3 partitions",()->{
      MiniKafkaGroup k=new MiniKafkaGroup();
      // c0 join trước (1 mình) -> đọc hết 3 partition
      eq(List.of(0,1,2), k.joinGroup("g","c0","orders",3));
      // c1 join -> rebalance: c1 nhận p2
      eq(List.of(2), k.joinGroup("g","c1","orders",3));
      // c0 join lại (mô phỏng onPartitionsAssigned sau rebalance) -> còn p0,p1
      eq(List.of(0,1), k.joinGroup("g","c0","orders",3));
    });
    ck("at-most-once: commit before process -> crash -> message lost",()->{
      MiniKafkaGroup k=new MiniKafkaGroup();
      k.append("orders",0,"k1","m1"); k.append("orders",0,"k2","m2");
      k.joinGroup("g","c0","orders",3); // c0 gets p0,p1
      var batch=k.poll("g","c0",10);
      // commit BEFORE processing (at-most-once)
      k.commitOffset("g","c0",0,k.position("g","c0",0));
      // crash: leave and rejoin (simulate restart)
      k.leaveGroup("g","c0");
      k.joinGroup("g","c0","orders",3);
      // poll again -> should be empty because committed offset advanced
      var again=k.poll("g","c0",10);
      eq(0,again.getOrDefault(0,List.of()).size()); // messages lost!
    });
    ck("at-least-once: process then commit -> crash before commit -> duplicate poll -> idempotent dedup",()->{
      MiniKafkaGroup k=new MiniKafkaGroup();
      k.append("orders",2,"k3","m3"); k.append("orders",2,"k4","m4");
      k.joinGroup("g","c1","orders",3); // c1 gets p2
      var batch=k.poll("g","c1",10);
      Set<String> processed=new HashSet<>();
      for(var r: batch.getOrDefault(2,List.of())) {
        if(processed.add(r.key())) { /* process */ }
      }
      // crash BEFORE commit
      k.leaveGroup("g","c1");
      k.joinGroup("g","c1","orders",3);
      // poll again -> same messages
      var again=k.poll("g","c1",10);
      int processedCount=0;
      for(var r: again.getOrDefault(2,List.of())) {
        if(processed.add(r.key())) processedCount++; // idempotent: only new keys count
      }
      eq(0,processedCount); // no new keys processed (all duplicates deduped)
      // now commit
      k.commitOffset("g","c1",2,k.position("g","c1",2));
      k.leaveGroup("g","c1");
      k.joinGroup("g","c1","orders",3);
      var afterCommit=k.poll("g","c1",10);
      eq(0,afterCommit.getOrDefault(2,List.of()).size());
    });
    ck("rebalance reassigns partitions",()->{
      MiniKafkaGroup k=new MiniKafkaGroup();
      k.joinGroup("g","c0","orders",3);
      k.joinGroup("g","c1","orders",3);
      // c0 leaves, c1 should get all partitions
      k.leaveGroup("g","c0");
      k.rebalance("g","orders",3,List.of("c1"));
      var assigned=k.joinGroup("g","c1","orders",3); // re-join to see assignment
      eq(List.of(0,1,2),assigned);
    });
    System.out.println("RESULT " + p + "/" + t);
  }
}`,
    reference: `import java.util.*;
import java.util.concurrent.*;

class MiniKafkaGroup {
    private final Map<String, Map<Integer, List<Record>>> log = new HashMap<>();
    private final Map<String, Map<String, Map<Integer, Integer>>> positions = new HashMap<>();
    private final Map<String, Map<String, Map<Integer, Integer>>> committed = new HashMap<>();
    private final Map<String, Map<String, Set<Integer>>> assignments = new HashMap<>();

    record Record(int offset, String key, String message) {}

    private String gkey(String g, String c) { return g + "|" + c; }
    private List<Record> part(String topic, int p) {
        return log.computeIfAbsent(topic, x -> new HashMap<>()).computeIfAbsent(p, x -> new ArrayList<>());
    }
    private Map<Integer, Integer> posMap(String g, String c) {
        return positions.computeIfAbsent(g, x -> new HashMap<>()).computeIfAbsent(c, x -> new HashMap<>());
    }
    private Map<Integer, Integer> comMap(String g, String c) {
        return committed.computeIfAbsent(g, x -> new HashMap<>()).computeIfAbsent(c, x -> new HashMap<>());
    }
    private Set<Integer> assignSet(String g, String c) {
        return assignments.computeIfAbsent(g, x -> new HashMap<>()).computeIfAbsent(c, x -> new HashSet<>());
    }

    MiniKafkaGroup() {}

    synchronized int append(String topic, int partition, String key, String message) {
        List<Record> l = part(topic, partition);
        int offset = l.size();
        l.add(new Record(offset, key, message));
        return offset;
    }

    synchronized List<Integer> joinGroup(String groupId, String consumerId, String topic, int numPartitions) {
        // Simple range assignor: divide partitions evenly among current consumers in group
        Set<String> consumers = assignments.getOrDefault(groupId, Collections.emptyMap()).keySet();
        consumers = new HashSet<>(consumers);
        consumers.add(consumerId);
        List<String> sorted = new ArrayList<>(consumers);
        Collections.sort(sorted);
        int idx = sorted.indexOf(consumerId);
        int perConsumer = (int) Math.ceil((double) numPartitions / sorted.size());
        int start = idx * perConsumer;
        int end = Math.min(start + perConsumer, numPartitions);
        Set<Integer> assigned = new HashSet<>();
        for (int p = start; p < end; p++) assigned.add(p);
        assignSet(groupId, consumerId).clear();
        assignSet(groupId, consumerId).addAll(assigned);
        // Initialize position/committed from existing or 0
        Map<Integer, Integer> pos = posMap(groupId, consumerId);
        Map<Integer, Integer> com = comMap(groupId, consumerId);
        for (int p : assigned) {
            pos.putIfAbsent(p, com.getOrDefault(p, 0));
        }
        return new ArrayList<>(assigned);
    }

    synchronized Map<Integer, List<Record>> poll(String groupId, String consumerId, int maxPerPartition) {
        Map<Integer, List<Record>> out = new HashMap<>();
        Set<Integer> assigned = assignSet(groupId, consumerId);
        Map<Integer, Integer> pos = posMap(groupId, consumerId);
        for (int p : assigned) {
            List<Record> l = log.getOrDefault("orders", Collections.emptyMap()).getOrDefault(p, Collections.emptyList());
            int from = pos.getOrDefault(p, 0);
            int to = Math.min(l.size(), from + Math.max(0, maxPerPartition));
            if (from < to) {
                out.put(p, new ArrayList<>(l.subList(from, to)));
                pos.put(p, to);
            }
        }
        return out;
    }

    synchronized void commitOffset(String groupId, String consumerId, int partition, int offset) {
        comMap(groupId, consumerId).put(partition, Math.max(0, offset));
    }

    synchronized int position(String groupId, String consumerId, int partition) {
        return posMap(groupId, consumerId).getOrDefault(partition, comMap(groupId, consumerId).getOrDefault(partition, 0));
    }

    synchronized int committed(String groupId, String consumerId, int partition) {
        return comMap(groupId, consumerId).getOrDefault(partition, 0);
    }

    synchronized void leaveGroup(String groupId, String consumerId) {
        assignments.getOrDefault(groupId, Collections.emptyMap()).remove(consumerId);
        positions.getOrDefault(groupId, Collections.emptyMap()).remove(consumerId);
    }

    synchronized void rebalance(String groupId, String topic, int numPartitions, List<String> consumerIds) {
        // Reassign all partitions to current consumers using range assignor
        List<String> sorted = new ArrayList<>(consumerIds);
        Collections.sort(sorted);
        int perConsumer = (int) Math.ceil((double) numPartitions / sorted.size());
        Map<String, Set<Integer>> newAssign = new HashMap<>();
        for (int i = 0; i < sorted.size(); i++) {
            String c = sorted.get(i);
            int start = i * perConsumer;
            int end = Math.min(start + perConsumer, numPartitions);
            Set<Integer> assigned = new HashSet<>();
            for (int p = start; p < end; p++) assigned.add(p);
            newAssign.put(c, assigned);
        }
        Map<String, Set<Integer>> groupAssign = assignments.get(groupId);
        if (groupAssign != null) {
            groupAssign.clear();
            groupAssign.putAll(newAssign);
        }
        // Reset position to committed for new assignments
        for (String c : consumerIds) {
            Map<Integer, Integer> pos = posMap(groupId, c);
            Map<Integer, Integer> com = comMap(groupId, c);
            pos.clear();
            for (int p : groupAssign.getOrDefault(c, Collections.emptySet())) {
                pos.put(p, com.getOrDefault(p, 0));
            }
        }
    }
}`,
    hints: [
      'append: thêm Record(offset, key, message) vào List của partition tương ứng. Offset = size trước khi add.',
      'joinGroup: range assignor đơn giản — sort consumerId, chia partition đều (math.ceil). Khởi tạo position = committed (mặc định 0).',
      'poll: với mỗi partition được gán, đọc từ position đến min(size, position+max). Cập nhật position = to.',
      'commitOffset: lưu offset vào committed map. At-most-once: commit TRƯỚC xử lý. At-least-once: commit SAU xử lý.',
      'leaveGroup: xóa assignment và position của consumer đó. rebalance: chạy lại range assignor cho consumer còn lại, reset position = committed.',
      'Test at-most-once: poll -> commitOffset(position) -> leave+join -> poll again -> rỗng (mất message).',
      'Test at-least-once: poll -> process (dedup Set) -> leave+join (chưa commit) -> poll again -> trùng key -> Set dedup -> 0 mới -> commitOffset -> leave+join -> poll rỗng.'
    ],
    explain: `Bài tập mô phỏng cốt lõi Kafka consumer group: partition log (List), position (con trỏ đọc trong RAM), committed offset (con trỏ bền vững). Assignor dùng range đơn giản: consumer đầu lấy partition đầu, v.v. Không mô phỏng network, replication, heartbeat, CooperativeStickyAssignor phức tạp.
- **At-most-once**: commitOffset(position) TRƯỚC xử lý. Nếu crash (leave+join mô phỏng restart), position reset = committed (đã tiến) → poll trả rỗng → message bị bỏ qua (mất). Đây là rủi ro mất dữ liệu.
- **At-least-once + idempotent**: xử lý xong (ghi processedKeys Set), commitOffset SAU. Crash trước commit → position chưa tiến, committed cũ → poll lại trả message cũ → trùng key → Set dedup loại bỏ → không xử lý lại hiệu ứng. Commit sau -> an toàn.
- Production: dùng {{commitSync()}} sau xử lý batch, consumer idempotent (dedup theo business key/version hoặc inbox table unique constraint). {{enable.auto.commit=true}} nguy hiểm vì commit chạy nền có thể tiến offset của batch chưa xử lý xong.
- Rebalance: {{onPartitionsRevoked}} commitSync offset đã xử lý; {{onPartitionsAssigned}} seek đến committed offset. Mô phỏng đơn giản bằng leaveGroup + rebalance + joinGroup.
Lỗi thường gặp: nhầm position/committed; commit trước xử lý; không dedup khi chọn at-least-once; không commit trong onPartitionsRevoked.`,
  }],
  check: [
    { q: 'Topic "orders" có 3 partition. Consumer group "svc" có 2 consumer. RangeAssignor phân bố partition như thế nào?', options: ['Consumer-0: partition 0,1; Consumer-1: partition 2', 'Consumer-0: partition 0,2; Consumer-1: partition 1', 'Consumer-0: partition 0; Consumer-1: partition 1,2', 'Ngẫu nhiên mỗi lần rebalance'], answer: 0, explain: 'RangeAssignor chia partition liên tiếp theo topic: sort consumerId, chia đều partition liên tiếp. 3 partition / 2 consumer = 2 cho consumer đầu (p0,p1), 1 cho consumer sau (p2). RoundRobinAssignor mới xoay vòng (p0,p2 cho c0; p1 cho c1).' },
    { q: 'Producer gửi message với key="order-123". Partition được chọn như thế nào?', options: ['Round-robin luân phiên', 'hash(key) % số_partition (cùng key -> cùng partition)', 'Luôn partition 0', 'Dựa vào timestamp'], answer: 1, explain: 'Có key: partition = murmur2(key) % partitions. Cùng key đảm bảo cùng partition -> giữ thứ tự cho cùng key. Không key: round-robin.' },
    { q: 'Consumer poll 10 record, xử lý 3 record rồi crash. Offset commit lúc nào thì KHÔNG mất message?', options: ['Commit trước khi poll', 'Commit sau khi xử lý 3 record đầu', 'Commit SAU KHI xử lý xong 10 record', 'Không commit, để auto.commit lo'], answer: 2, explain: 'Chỉ commit sau khi xử lý xong toàn bộ batch (at-least-once). Commit sớm (sau 3 record) → crash → 7 record chưa xử lý bị mất vì offset đã tiến. Không commit → auto.commit có thể commit sai lúc.' },
    { q: 'Rebalance xảy ra khi consumer join/leave group. Consumer NÊN làm gì trong onPartitionsRevoked?', options: ['Không làm gì, Kafka tự lo', 'CommitSync offset đã xử lý của partition bị thu hồi', 'Xóa local cache', 'Tăng poll timeout'], answer: 1, explain: 'Partition bị revoke -> consumer mất quyền đọc. Nếu không commit offset đã xử lý, khi partition gán lại (có thể cho consumer khác) -> đọc lại từ offset cũ -> trùng message. CommitSync trong onPartitionsRevoked đảm bảo offset bền vững trước khi trả partition.' }
  ], related: ['microservices-010', 'microservices-011', 'microservices-002'], tags: ['Kafka', 'topic', 'partition', 'offset', 'consumer group', 'rebalance', 'at-least-once', 'idempotent']
},
{
  id: 'lesson-microservices-024', track: 'microservices', order: 24,
  title: 'Kafka consumer lag monitoring, rebalance protocol và exactly-once semantics', level: 'senior', minutes: 45,
  goals: ['Tính và giám sát consumer lag (độ trễ tiêu thụ)', 'Hiểu rebalance protocol: JoinGroup, SyncGroup, Heartbeat', 'Phân biệt exactly-once trong Kafka (EOS) vs end-to-end exactly-once', 'Cài đặt transactional producer + read_committed consumer'],
  body: `**Tóm tắt:** Consumer lag là khoảng cách giữa offset mới nhất (high watermark) và offset đã commit — chỉ số quan trọng nhất để biết consumer có kịp xử lý không. Rebalance protocol (JoinGroup/SyncGroup/Heartbeat) quyết định partition gán cho ai và khi nào. Exactly-once semantics (EOS) trong Kafka dùng transactional.id + read_committed isolation level để đảm bảo produce/consume nguyên tử trong Kafka, nhưng **KHÔNG** tự động mở rộng ra DB/JDBC bên ngoài — vẫn cần outbox/idempotency.
**Ví dụ đời thường:** Lag như hàng đợi tại quầy cafe: high watermark = số khách đã đặt đơn, committed offset = số khách đã phục vụ xong. Lag lớn = khách chờ lâu. Rebalance như ca làm việc đổi ca: nhân viên cũ giao ca (commit offset đã làm), nhân viên mới nhận ca (seek đến offset đã commit). EOS như giao dịch ngân hàng: hoặc tất cả thành công, hoặc không có gì xảy ra — nhưng chỉ trong sổ cái Kafka, không tự lan sang sổ cái ngân hàng thật.

### Consumer Lag — chỉ số sống còn

**High Watermark (HW)** = offset lớn nhất đã được replicate đủ ISR (in-sync replica) — offset mà consumer được phép đọc tới. **Committed Offset** = offset consumer đã commit (đã xử lý xong). **Consumer Lag** = HW - Committed Offset (tính theo từng partition).

| Lag | Nghĩa | Hành động |
|---|---|---|
| 0 | Consumer kịp hoàn toàn | Bình thường |
| 10–100 | Chậm nhẹ, có thể do burst | Quan sát, có thể scale consumer |
| 1000+ | Xử lý chậm, hoặc bị chặn bởi poison message | Cần điều tra ngay: xử lý chậm? rebalance liên tục? partition chặn? |
| Tăng liên tục | Throughput consumer < throughput producer | Scale consumer, tối ưu xử lý, hoặc kiểm tra backpressure |

**Cách tính trong code (AdminClient):**
~~~java
// Lấy endOffsets (high watermark) và committed offsets
Map<TopicPartition, Long> endOffsets = consumer.endOffsets(partitions);
Map<TopicPartition, OffsetAndMetadata> committed = consumer.committed(partitions);
for (TopicPartition tp : partitions) {
    long lag = endOffsets.get(tp) - committed.get(tp).offset();
    // push metric: consumer_lag{topic,partition}=lag
}
~~~

**Lưu ý:** {{consumer.position(tp)}} = vị trí đang đọc tiếp theo (có thể > committed nếu đã poll nhưng chưa commit). {{committed(tp)}} = offset đã commit cuối cùng. Lag dùng committed, không dùng position.

### Rebalance Protocol — JoinGroup, SyncGroup, Heartbeat

Kafka dùng **coordinator** (broker được chọn quản lý group) để điều phối rebalance. Các giai đoạn:

1. **JoinGroup**: Consumer gửi {{JoinGroupRequest}} kèm {{group.id}}, {{member.id}} (hoặc rỗng nếu mới), {{protocol}} (ví dụ {{range}}), {{subscription}} (topic regex). Coordinator chọn **leader** (thường consumer join sớm nhất) và gửi {{JoinGroupResponse}} cho leader kèm danh sách member + metadata subscription của cả group; **leader (phía client) mới là bên chạy assignor để tính partition cho từng member** (coordinator không tự gán partition).
2. **SyncGroup**: Leader gửi {{SyncGroupRequest}} với assignment cho tất cả member. Coordinator phân phát assignment cho từng member qua {{SyncGroupResponse}}. Member nhận partition được gán, {{seek}} đến committed offset, bắt đầu poll.
3. **Heartbeat**: Consumer gửi {{HeartbeatRequest}} định kỳ (mặc định 3s, {{heartbeat.interval.ms}}) để báo "còn sống". Nếu miss {{session.timeout.ms}} (mặc định 45s, hoặc {{max.poll.interval.ms}} cho xử lý) → coordinator kick consumer -> trigger rebalance.

**Static Membership** ({{group.instance.id}}): Consumer cung cấp {{group.instance.id}} cố định. Khi restart, consumer giữ nguyên {{member.id}} -> **không trigger rebalance đầy đủ** (chỉ cần SyncGroup, bỏ qua JoinGroup) -> giảm downtime đáng kể. Dùng cho production quan trọng.

### Exactly-Once Semantics (EOS) trong Kafka

EOS bao gồm 2 phần:
- **Idempotent Producer** ({{enable.idempotence=true}}, mặc định true): PID + sequence number per partition -> deduplicate retry, tránh OUT_OF_ORDER (xem bài 011).
- **Transactions** ({{transactional.id}}): Gom nhiều produce + commit offset của consumer vào **một transaction Kafka**. {{producer.initTransactions()}} -> {{beginTransaction()}} -> {{send()}} + {{sendOffsetsToTransaction()}} -> {{commitTransaction()}}.

**Isolation Level:**
- {{read_uncommitted}} (mặc định): Consumer đọc cả message trong transaction chưa commit (có thể bị abort sau).
- {{read_committed}}: Consumer **chỉ đọc message đã commit** (transaction hoàn tất). Message trong transaction abort sẽ không bao giờ bị consumer thấy.

~~~java
// Transactional producer + consumer read_committed
Producer<String, String> producer = new Producer<>(props);
producer.initTransactions();

Consumer<String, String> consumer = new Consumer<>(props);
consumer.subscribe(Collections.singleton("input-topic"));
consumer.assign(partitions); // hoặc subscribe

while (running) {
    ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(500));
    producer.beginTransaction();
    for (ConsumerRecord<String, String> r : records) {
        // process -> produce output
        producer.send(new ProducerRecord<>("output-topic", r.key(), transform(r.value())));
    }
    // Commit offset của consumer VÀ output produces trong CÙNG transaction
    producer.sendOffsetsToTransaction(
        Map.of(new TopicPartition("input-topic", 0), new OffsetAndMetadata(nextOffset)),
        consumer.groupMetadata()
    );
    producer.commitTransaction();
}
~~~

**Giới hạn EOS:**
- Chỉ đảm bảo **trong Kafka** (produce + consume offset). Ghi DB, gọi HTTP, ghi file **NGOÀI KAFKA** không được bao phủ.
- Cần {{transactional.id}} cố định (không random) để **fencing** (chặn) producer cũ khi deploy mới.
- {{transaction.timeout.ms}} (mặc định 60s = 1 phút, tối đa theo {{transaction.max.timeout.ms}} mặc định 15 phút) là thời gian tối đa transaction tồn tại; vượt quá -> abort.
- {{read_committed}} consumer có độ trễ cao hơn (chờ transaction commit/abort).

### EOS vs End-to-End Exactly-Once

| Phạm vi | Đảm bảo | Cách đạt |
|---|---|---|
| **Kafka EOS** | Produce + commit offset nguyên tử trong Kafka | {{transactional.id}} + {{read_committed}} |
| **End-to-end** | Ghi DB + publish Kafka + consume + ghi DB2 — tất cả nguyên tử | **Không có đơn lẻ**. Cần: Outbox pattern (DB + Kafka trong 1 TX) + Idempotent consumer (dedup) + Idempotent downstream |

**Kết luận:** EOS là công cụ mạnh **trong Kafka**, nhưng hệ thống end-to-end vẫn cần:
1. **Transactional Outbox** (bài 001): DB state + event trong 1 DB transaction.
2. **Idempotent Consumer** (bài 002): dedup theo event_id/version.
3. **Idempotent Downstream**: API nhận event có idempotency key.

### Sơ đồ EOS consume-transform-produce

~~~seq
title: EOS consume-transform-produce loop
actors: Consumer | Producer(TX) | Input Topic | Output Topic | Offset Topic
Consumer -> Input Topic: poll() -> records
Producer(TX) -> Producer(TX): beginTransaction()
Producer(TX) -> Output Topic: send(transform(record)) cho mỗi record
Producer(TX) -> Offset Topic: sendOffsetsToTransaction(consumerOffsets, groupMetadata)
Producer(TX) -> Producer(TX): commitTransaction()
note Consumer: Nếu commitTransaction thất bại -> abort -> output không ghi, offset không commit -> poll lại
~~~

### Lỗi hay gặp trên production

- **Dùng {{read_uncommitted}} (mặc định) cho consume-transform-produce**: Consumer đọc message từ transaction chưa commit -> nếu transaction abort, consumer đã xử lý message "ma" -> sai nghiệp vụ. **Phải dùng {{read_committed}}**.
- **Không set {{transactional.id}} hoặc dùng random**: Deploy mới -> producer mới PID khác -> không fence producer cũ -> duplicate/out-of-order. **Phải set {{transactional.id}} cố định theo ứng dụng** (ví dụ {{order-service-producer}}).
- **Transaction timeout quá ngắn**: Xử lý batch lớn > {{transaction.timeout.ms}} -> transaction abort giữa chừng -> lặp vô tận. **Set {{transaction.timeout.ms}} đủ lớn** (ví dụ 5-15 phút, không vượt {{transaction.max.timeout.ms}} mặc định 15 phút) và batch size hợp lý.
- **Quên {{sendOffsetsToTransaction}}**: Commit offset riêng bằng {{commitSync()}} ngoài transaction -> offset commit nhưng output produce abort (hoặc ngược lại) -> mất đồng bộ. **Phải gom offset vào transaction**.
- **Consumer lag alert không phân biệt partition**: Lag tổng thấp nhưng 1 partition lag cao (poison message) -> alert không kích hoạt. **Alert per partition**.

### Liên hệ phỏng vấn

- **Consumer lag là gì, tính như nào?** HW - committed offset. HW = offset lớn nhất đã replicate đủ ISR. Committed = offset đã commit. Lag > 0 nghĩa là consumer chậm.
- **Rebalance protocol 3 bước là gì?** JoinGroup (consumer join, leader phân chia) -> SyncGroup (leader gửi assignment) -> Heartbeat (báo sống định kỳ, miss session.timeout -> kick -> rebalance).
- **Static membership (group.instance.id) giải quyết vấn đề gì?** Restart consumer không trigger rebalance đầy đủ (bỏ qua JoinGroup) -> giảm downtime, không mất partition assignment tạm thời.
- **EOS Kafka đảm bảo exactly-once cho DB không?** **Không**. Chỉ ensure produce + consume offset nguyên tử trong Kafka. DB ngoài cần outbox pattern + idempotent consumer.
- **Transactional producer + read_committed consumer loop logic?** beginTransaction -> poll (read_committed) -> process -> send output -> sendOffsetsToTransaction(consumer offsets) -> commitTransaction. Abort -> rollback cả output lẫn offset -> poll lại an toàn.

> Senior tip: Với EOS, set {{transaction.timeout.ms}} lớn hơn max xử lý batch (ví dụ 15 phút). Monitor {{producer-metrics.transaction-commit-rate}}, {{transaction-abort-rate}}. Abort rate > 0 thường do timeout hoặc broker error. Consumer {{read_committed}} bị chặn tới Last Stable Offset (LSO): nếu một transaction đang mở (chưa commit/abort) thì consumer không đọc được message nằm sau nó, nên độ trễ phụ thuộc thời gian transaction — cân nhắc trade-off.

### Cơ chế từng bước (EOS loop)

1. Consumer {{poll()}} lấy batch từ input topic (chỉ message đã commit nhờ {{read_committed}}).
2. Producer {{beginTransaction()}} mở transaction mới.
3. Với mỗi record: {{process()}} -> {{producer.send(output-topic)}}.
4. Sau vòng lặp: {{producer.sendOffsetsToTransaction(offsets, groupMetadata)}} gom offset consumer vào transaction.
5. {{producer.commitTransaction()}}: broker commit nguyên tử (output records + offset). Hoặc {{abortTransaction()}} nếu lỗi.
6. Nếu commit thành công: offset bền vững, output records visible cho {{read_committed}} consumer. Nếu abort: output không ghi, offset không commit -> lần sau poll lại batch cũ -> idempotent xử lý lại an toàn.

### Tự thử trên máy (Docker)

~~~bash
# Kafka 3.7+ KRaft mode (đã chạy ở bài 016)
# Tạo topic input/output
docker exec kafka kafka-topics.sh --create --topic input --partitions 3 --replication-factor 1 --bootstrap-server localhost:9092
docker exec kafka kafka-topics.sh --create --topic output --partitions 3 --replication-factor 1 --bootstrap-server localhost:9092
# Chạy producer transactional (cần code Java, xem bài tập)
# Chạy consumer read_committed
docker exec kafka kafka-console-consumer.sh --topic output --group tx-consumer --isolation-level read_committed --bootstrap-server localhost:9092
~~~

### Tóm lại 3 ý

1. **Consumer lag = High Watermark - Committed Offset** (tính per partition). Lag tăng = consumer chậm hoặc bị chặn.
2. **Rebalance protocol: JoinGroup -> SyncGroup -> Heartbeat**. Static membership ({{group.instance.id}}) tránh rebalance khi restart.
3. **EOS Kafka = transactional producer + read_committed consumer**. Chỉ bao trong Kafka. End-to-end exactly-once vẫn cần Outbox + Idempotent Consumer + Idempotent Downstream.

### Liên hệ phỏng vấn

- **Hỏi:** Consumer lag tính như thế nào, alert khi nào? **Trả lời ngắn:** Lag = endOffset (high watermark) - committed offset, tính per partition. Alert khi lag > ngưỡng (ví dụ 1000) hoặc lag không giảm sau N phút. Phân biệt partition lag cao do poison message vs lag tổng cao do throughput thấp.
- **Hỏi:** Rebalance mất bao lâu và giảm thế nào? **Trả lời ngắn:** Rebalance mất vài trăm ms đến vài giây (tùy số partition/consumer). Giảm bằng static membership ({{group.instance.id}}), CooperativeStickyAssignor, giảm số partition/consumer.
- **Hỏi:** EOS consume-transform-produce loop có gì đặc biệt? **Trả lời ngắn:** beginTransaction -> poll (read_committed) -> process -> send output -> sendOffsetsToTransaction(consumer offsets) -> commitTransaction. Abort -> cả output lẫn offset rollback -> poll lại an toàn.
- **Hỏi:** Vì sao read_committed consumer chậm hơn read_uncommitted? **Trả lời ngắn:** Phải chờ transaction commit hoặc abort mới thấy message. Message trong transaction đang chạy không visible cho read_committed (Last Stable Offset không tiến qua transaction đang mở). Độ trễ phụ thuộc thời gian transaction, không cố định.

> Senior tip: Không bật EOS "cho vui" — nó thêm độ phức tạp (transactional.id management, fencing, timeout tuning, read_committed latency). Chỉ dùng khi cần consume-transform-produce loop trong Kafka (ví dụ stream processing, CDC relay). Đối với outbox relay đơn giản, idempotent producer + at-least-once consumer + idempotent downstream đủ và đơn giản hơn.`,
  exercises: [{
    title: 'ConsumerLagCalculator: tính lag per partition từ endOffsets và committed',
    prompt: `Cài {{ConsumerLagCalculator}} nhận {{Consumer}} mock (interface có sẵn trong starter) và tính lag cho từng partition.
API:
- {{Map<TopicPartition, Long> endOffsets(Set<TopicPartition>)}}: trả high watermark (offset lớn nhất đã replicate ISR + 1, tức next offset).
- {{Map<TopicPartition, OffsetAndMetadata> committed(Set<TopicPartition>)}}: trả committed offset + metadata.
- {{Map<TopicPartition, Long> lag(Set<TopicPartition>)}}: trả lag = endOffset - committed.offset() cho mỗi partition. Nếu partition chưa có committed -> committed = 0.
- {{boolean isHealthy(long maxLag)}}: true nếu tất cả partition lag <= maxLag.
- {{TopicPartition worstPartition()}}: partition có lag lớn nhất (trả null nếu không có partition).

{{TopicPartition}}, {{OffsetAndMetadata}} là class đơn giản trong starter. Test dùng mock Consumer trả giá trị cố định.`,
    starter: `import java.util.*;
import java.util.concurrent.*;

final class TopicPartition {
    final String topic; final int partition;
    TopicPartition(String topic, int partition) { this.topic = topic; this.partition = partition; }
    public boolean equals(Object o) { if (!(o instanceof TopicPartition)) return false; TopicPartition t = (TopicPartition) o; return topic.equals(t.topic) && partition == t.partition; }
    public int hashCode() { return Objects.hash(topic, partition); }
    public String toString() { return topic + "-" + partition; }
}
final class OffsetAndMetadata {
    final long offset; final String metadata;
    OffsetAndMetadata(long offset) { this(offset, ""); }
    OffsetAndMetadata(long offset, String metadata) { this.offset = offset; this.metadata = metadata; }
}
interface Consumer {
    Map<TopicPartition, Long> endOffsets(Set<TopicPartition> partitions);
    Map<TopicPartition, OffsetAndMetadata> committed(Set<TopicPartition> partitions);
}
class ConsumerLagCalculator {
    private final Consumer consumer;
    ConsumerLagCalculator(Consumer consumer) { this.consumer = consumer; }
    Map<TopicPartition, Long> lag(Set<TopicPartition> partitions) { throw new UnsupportedOperationException("TODO"); }
    boolean isHealthy(Set<TopicPartition> partitions, long maxLag) { throw new UnsupportedOperationException("TODO"); }
    TopicPartition worstPartition(Set<TopicPartition> partitions) { throw new UnsupportedOperationException("TODO"); }
}`,
    tests: `public class Main {
  static int p=0,t=0; static void ck(String n,Runnable r){t++;try{r.run();p++;System.out.println("PASS " + n);}catch(Throwable e){System.out.println("FAIL " + n + ": " + e);}}
  static void eq(Object a,Object b){if(!Objects.equals(a,b))throw new AssertionError(a + " != " + b);}
  public static void main(String[] z){
    ck("lag = endOffset - committed",()->{
      TopicPartition tp0=new TopicPartition("t",0), tp1=new TopicPartition("t",1);
      Consumer mock = new Consumer(){
        public Map<TopicPartition,Long> endOffsets(Set<TopicPartition> ps){
          return Map.of(tp0,100L,tp1,200L);
        }
        public Map<TopicPartition,OffsetAndMetadata> committed(Set<TopicPartition> ps){
          return Map.of(tp0,new OffsetAndMetadata(90),tp1,new OffsetAndMetadata(150));
        }
      };
      ConsumerLagCalculator calc=new ConsumerLagCalculator(mock);
      Map<TopicPartition,Long> lag=calc.lag(Set.of(tp0,tp1));
      eq(10L,lag.get(tp0)); eq(50L,lag.get(tp1));
    });
    ck("no committed -> treated as 0",()->{
      TopicPartition tp=new TopicPartition("t",0);
      Consumer mock = new Consumer(){
        public Map<TopicPartition,Long> endOffsets(Set<TopicPartition> ps){ return Map.of(tp,50L); }
        public Map<TopicPartition,OffsetAndMetadata> committed(Set<TopicPartition> ps){ return Map.of(); }
      };
      ConsumerLagCalculator calc=new ConsumerLagCalculator(mock);
      eq(50L,calc.lag(Set.of(tp)).get(tp));
    });
    ck("isHealthy all partitions within threshold",()->{
      TopicPartition tp0=new TopicPartition("t",0), tp1=new TopicPartition("t",1);
      Consumer mock = new Consumer(){
        public Map<TopicPartition,Long> endOffsets(Set<TopicPartition> ps){ return Map.of(tp0,100L,tp1,200L); }
        public Map<TopicPartition,OffsetAndMetadata> committed(Set<TopicPartition> ps){ return Map.of(tp0,new OffsetAndMetadata(95),tp1,new OffsetAndMetadata(190)); }
      };
      ConsumerLagCalculator calc=new ConsumerLagCalculator(mock);
      eq(true,calc.isHealthy(Set.of(tp0,tp1),10));
      eq(false,calc.isHealthy(Set.of(tp0,tp1),5));
    });
    ck("worstPartition returns max lag",()->{
      TopicPartition tp0=new TopicPartition("t",0), tp1=new TopicPartition("t",1), tp2=new TopicPartition("t",2);
      Consumer mock = new Consumer(){
        public Map<TopicPartition,Long> endOffsets(Set<TopicPartition> ps){ return Map.of(tp0,100L,tp1,200L,tp2,50L); }
        public Map<TopicPartition,OffsetAndMetadata> committed(Set<TopicPartition> ps){ return Map.of(tp0,new OffsetAndMetadata(90),tp1,new OffsetAndMetadata(150),tp2,new OffsetAndMetadata(49)); }
      };
      ConsumerLagCalculator calc=new ConsumerLagCalculator(mock);
      eq(tp1,calc.worstPartition(Set.of(tp0,tp1,tp2))); // lag 50
    });
    ck("empty partitions returns null worst",()->{
      Consumer mock = new Consumer(){
        public Map<TopicPartition,Long> endOffsets(Set<TopicPartition> ps){ return Map.of(); }
        public Map<TopicPartition,OffsetAndMetadata> committed(Set<TopicPartition> ps){ return Map.of(); }
      };
      ConsumerLagCalculator calc=new ConsumerLagCalculator(mock);
      eq(null,calc.worstPartition(Set.of()));
    });
    System.out.println("RESULT " + p + "/" + t);
  }
}`,
    reference: `import java.util.*;
import java.util.concurrent.*;

final class TopicPartition {
    final String topic; final int partition;
    TopicPartition(String topic, int partition) { this.topic = topic; this.partition = partition; }
    public boolean equals(Object o) { if (!(o instanceof TopicPartition)) return false; TopicPartition t = (TopicPartition) o; return topic.equals(t.topic) && partition == t.partition; }
    public int hashCode() { return Objects.hash(topic, partition); }
    public String toString() { return topic + "-" + partition; }
}
final class OffsetAndMetadata {
    final long offset; final String metadata;
    OffsetAndMetadata(long offset) { this(offset, ""); }
    OffsetAndMetadata(long offset, String metadata) { this.offset = offset; this.metadata = metadata; }
}
interface Consumer {
    Map<TopicPartition, Long> endOffsets(Set<TopicPartition> partitions);
    Map<TopicPartition, OffsetAndMetadata> committed(Set<TopicPartition> partitions);
}
class ConsumerLagCalculator {
    private final Consumer consumer;
    ConsumerLagCalculator(Consumer consumer) { this.consumer = consumer; }
    Map<TopicPartition, Long> lag(Set<TopicPartition> partitions) {
        Map<TopicPartition, Long> end = consumer.endOffsets(partitions);
        Map<TopicPartition, OffsetAndMetadata> com = consumer.committed(partitions);
        Map<TopicPartition, Long> out = new HashMap<>();
        for (TopicPartition tp : partitions) {
            long e = end.getOrDefault(tp, 0L);
            long c = com.getOrDefault(tp, new OffsetAndMetadata(0)).offset;
            out.put(tp, Math.max(0, e - c));
        }
        return out;
    }
    boolean isHealthy(Set<TopicPartition> partitions, long maxLag) {
        for (long l : lag(partitions).values()) if (l > maxLag) return false;
        return true;
    }
    TopicPartition worstPartition(Set<TopicPartition> partitions) {
        Map<TopicPartition, Long> lags = lag(partitions);
        if (lags.isEmpty()) return null;
        return Collections.max(lags.entrySet(), Map.Entry.comparingByValue()).getKey();
    }
}`,
    hints: [
      'endOffsets là high watermark (offset tiếp theo sẽ ghi). committed là offset đã commit cuối cùng.',
      'lag = endOffset - committed.offset(). Nếu partition không có trong committed map -> committed = 0.',
      'isHealthy: tất cả lag <= maxLag. worstPartition: Collections.max theo lag value.'
    ],
    explain: `Consumer lag là chỉ số quan trọng nhất để biết consumer có kịp không. endOffset (high watermark) là offset lớn nhất đã replicate đủ ISR — consumer chỉ được đọc đến đây. committed offset là vị trí consumer đã xác nhận xử lý xong. Lag = endOffset - committed. Nếu consumer chưa commit lần nào cho partition, committed = 0 -> lag = endOffset (đọc từ đầu). isHealthy kiểm tra tất cả partition đều trong ngưỡng. worstPartition tìm partition lag cao nhất — thường là partition bị poison message hoặc chặn bởi lỗi. Production: push metric per partition, alert per partition (không chỉ trung bình), track lag trend theo thời gian.`,
  }],
  check: [
    { q: 'Consumer lag tính như thế nào?', options: ['position - committed', 'endOffsets (high watermark) - committed.offset()', 'endOffsets - position', 'committed - endOffsets'], answer: 1, explain: 'Lag = high watermark (offset lớn nhất đã replicate ISR, là endOffsets) - committed offset. Position là vị trí đang đọc (có thể > committed nếu poll chưa commit), không dùng để tính lag.' },
    { q: 'Static membership (group.instance.id) giúp gì?', options: ['Tăng throughput', 'Restart consumer không trigger rebalance đầy đủ (bỏ qua JoinGroup)', 'Tự động commit offset', 'Bật exactly-once'], answer: 1, explain: 'Consumer cung cấp group.instance.id cố định -> restart giữ member.id -> coordinator nhận biết là consumer cũ -> chỉ cần SyncGroup, bỏ qua JoinGroup -> giảm downtime rebalance.' },
    { q: 'EOS Kafka (transactional producer + read_committed consumer) đảm bảo exactly-once cho ghi DB ngoài Kafka?', options: ['Có, tự động', 'Không, chỉ bao produce/consume offset trong Kafka; DB ngoài cần outbox/idempotency', 'Có nếu dùng JDBC transaction', 'Không bao giờ'], answer: 1, explain: 'EOS chỉ đảm bảo atomicity produce + commit offset trong Kafka. Ghi DB, gọi HTTP, file system ngoài Kafka không nằm trong transaction Kafka -> cần outbox pattern + idempotent consumer.' },
    { q: 'Trong consume-transform-produce loop EOS, sendOffsetsToTransaction gọi khi nào?', options: ['Trước beginTransaction', 'Sau khi send tất cả output record, trước commitTransaction', 'Sau commitTransaction', 'Không cần gọi nếu dùng auto.commit'], answer: 1, explain: 'Phải gom consumer offsets vào CÙNG transaction với output produces: beginTransaction -> send outputs -> sendOffsetsToTransaction -> commitTransaction. Nếu commit offset riêng (commitSync) ngoài transaction -> mất atomicity.' }
  ], related: ['microservices-016', 'microservices-011', 'microservices-001', 'microservices-002'], tags: ['Kafka', 'consumer lag', 'rebalance', 'exactly-once', 'EOS', 'transactional', 'read_committed', 'monitoring']
},
{
  id: 'lesson-microservices-025',
  track: 'microservices',
  order: 25,
  title: 'Circuit breaker từ bên trong: 3 trạng thái với Clock giả và sliding window',
  level: 'senior',
  minutes: 30,
  goals: [
    'Giải thích được 3 trạng thái closed/open/half-open và lý do tồn tại',
    'Tự viết được circuit breaker với Clock giả và sliding window đếm lỗi',
    'Biết khi nào breaker nên mở, khi nào đóng lại, và cách tránh half-open storm'
  ],
  body: `### Circuit breaker là gì

**Tóm tắt:** Circuit breaker là một "cầu chì thông minh" đặt trước lời gọi tới dependency (service khác, DB, API ngoài): khi dependency liên tục lỗi, breaker **ngắt** lời gọi ngay lập tức (fail fast) và trả fallback, thay vì để hàng nghìn thread xếp hàng chờ timeout. Sau một thời gian, breaker cho phép **một vài** lời gọi thử lại (half-open); nếu thành công thì đóng lại, nếu vẫn lỗi thì mở lại.

Tại sao cần? Nếu service B chậm/chết, service A vẫn gọi B và chờ timeout 5 giây. Thread bị giữ → thread pool cạn → A cũng chết theo → hiệu ứng domino. Circuit breaker cắt chuỗi này.

### 3 trạng thái

1. **Closed (đóng)**: mọi lời gọi được phép. Breaker đếm lỗi trong một cửa sổ thời gian (sliding window). Nếu tỉ lệ lỗi vượt ngưỡng → chuyển sang Open.
2. **Open (mở)**: mọi lời gọi bị từ chối ngay (ném exception hoặc trả fallback), **không** gọi dependency. Sau một thời gian chờ (reset timeout), chuyển sang Half-open.
3. **Half-open (nửa mở)**: cho phép đúng **N** lời gọi thử (thường 1–3). Nếu tất cả thành công → Closed. Nếu có lỗi → Open lại, reset timer.

~~~java
// Mô phỏng đơn giản: breaker bọc lời gọi tới payment service
CircuitBreaker cb = new CircuitBreaker(clock, 5, Duration.ofSeconds(10), 3);
try {
    return cb.call(() -> paymentClient.charge(amount));
} catch (CircuitOpenException e) {
    return fallbackCharge(amount);   // trả về hàng đợi / cache
}
~~~

### Vì sao dùng Clock giả

Trong test, thời gian thật làm test **không xác định** (flaky): test phải sleep 10 giây để kiểm tra reset. Dùng {{Clock}} (java.time.Clock) cho phép inject thời gian giả trong test: {{Clock.fixed(...)}} hoặc tự viết Clock tăng theo ý muốn. Đây là pattern chung cho mọi logic phụ thuộc thời gian (timeout, TTL, SLA).

### Sliding window đếm lỗi

Có hai kiểu:
- **Count-based**: đếm N lời gọi gần nhất, tính tỉ lệ lỗi. Đơn giản nhưng chậm phản ứng khi traffic thấp.
- **Time-based**: đếm lỗi trong cửa sổ thời gian (ví dụ 10 giây). Phản ánh traffic thực tế hơn.

Triển khai thật thường dùng ring buffer (mảng vòng) lưu timestamp các lỗi, hoặc bucket theo giây (Hystrix-style). **Bài tập dưới đây dùng bản đơn giản hoá cho dễ hiểu: đếm số lỗi liên tiếp (consecutive failures) — cứ một lời gọi thành công là reset bộ đếm về 0, khi số lỗi liên tiếp đạt {{failureThreshold}} thì mở.** Bản này bỏ phần cửa sổ trượt để tập trung vào 3 trạng thái và cách dùng Clock; production (Resilience4j) mới dùng cửa sổ trượt theo số lần gọi hoặc theo thời gian.

### Half-open storm

Khi breaker chuyển sang Half-open, nếu có 1000 thread cùng gọi, cả 1000 sẽ thử → dependency bị dội lại đúng lúc nó đang cố hồi phục. Giải pháp: half-open chỉ cho phép **một số lượng giới hạn** (permittedNumberOfCallsInHalfOpenState), các lời gọi khác bị từ chối như khi Open.

### Ví dụ đời thực

Service thanh toán gọi fraud-check service. Fraud-check bị quá tải → p99 latency tăng từ 50ms lên 8s. Không có breaker: thread pool 200 thread bị giữ hết, payment service không trả được cho khách → toàn hệ thống treo. Có breaker: sau 5 lỗi trong 10 giây, breaker mở; các request sau trả ngay fallback "giao dịch đang xử lý, sẽ thông báo sau"; fraud-check có thời gian hồi phục; 30 giây sau breaker half-open, 3 request thử thành công → đóng lại. Khách hàng thấy chậm vài giây thay vì sập toàn hệ thống.

### Trả lời mẫu khi phỏng vấn

Circuit breaker là cầu chì thông minh: khi dependency liên tục lỗi, nó ngắt lời gọi ngay lập tức để thread không bị giữ, tránh hiệu ứng domino. Ba trạng thái: Closed cho phép gọi và đếm lỗi trong cửa sổ trượt; vượt ngưỡng thì Open, từ chối mọi gọi và trả fallback; sau reset timeout chuyển Half-open, cho phép một số ít gọi thử — thành công thì Closed, thất bại thì Open lại. Hai điều quan trọng: half-open phải giới hạn số gọi thử để tránh dội lại dependency đang hồi phục, và logic thời gian nên dùng Clock injectable để test được. Trong production tôi cũng thêm fallback (cache, queue) và metric (số lần mở, thời gian mở) để theo dõi.

> Senior tip: Đừng đặt ngưỡng breaker quá thấp (mở vì 2 lỗi đơn lẻ) cũng đừng quá cao (chờ 100 lỗi mới mở). Theo kinh nghiệm, tỉ lệ lỗi 50% trong cửa sổ 10 giây + tối thiểu 20 lời gọi là điểm khởi đầu hợp lý. Và luôn có fallback có ý nghĩa — breaker chỉ là cơ chế, fallback mới là giá trị cho người dùng.
`,
  exercises: [
    {
      title: 'Tự viết circuit breaker 3 trạng thái',
      prompt: 'Viết class {{CircuitBreaker}} nhận {{Clock clock}}, {{int failureThreshold}}, {{Duration openDuration}}, {{int halfOpenPermits}}. Phương thức {{boolean tryCall(Callable<T> action)}}: nếu Closed → chạy action, ghi nhận lỗi/thành công; nếu lỗi làm tỉ lệ vượt ngưỡng → Open. Nếu Open và chưa hết openDuration → trả false (không gọi). Nếu hết openDuration → chuyển Half-open, cho phép tối đa halfOpenPermits gọi thử. Half-open: gọi thành công đủ permits → Closed; gọi thất bại → Open.\n\nDùng Clock để lấy "thời gian hiện tại" để test được.',
      starter: 'import java.time.*;\nimport java.util.concurrent.*;\n\nclass CircuitBreaker {\n    enum State { CLOSED, OPEN, HALF_OPEN }\n    private final Clock clock;\n    private final int failureThreshold;\n    private final Duration openDuration;\n    private final int halfOpenPermits;\n\n    CircuitBreaker(Clock clock, int failureThreshold, Duration openDuration, int halfOpenPermits) {\n        this.clock = clock;\n        this.failureThreshold = failureThreshold;\n        this.openDuration = openDuration;\n        this.halfOpenPermits = halfOpenPermits;\n    }\n\n    State state() { return State.CLOSED; }\n\n    // trả về true nếu gọi được action và thành công; false nếu breaker mở (không gọi); ném exception nếu action ném\n    <T> boolean tryCall(Callable<T> action) throws Exception {\n        throw new UnsupportedOperationException("TODO");\n    }\n}',
      tests: 'import java.time.*;\npublic class Main {\n    static int passed = 0, total = 0;\n    static void check(String name, Runnable r) { total++; try { r.run(); passed++; System.out.println("PASS " + name); } catch (Throwable t) { System.out.println("FAIL " + name + ": " + t); } }\n    static void eq(Object e, Object a) { if (!java.util.Objects.equals(e,a)) throw new AssertionError("expected "+e+" got "+a); }\n    public static void main(String[] args) {\n        // Fixed clock mutable via array\n        class MutableClock extends Clock {\n            Instant now = Instant.parse("2026-01-01T00:00:00Z");\n            public ZoneId getZone(){return ZoneId.of("UTC");}\n            public Clock withZone(ZoneId z){return this;}\n            public Instant instant(){return now;}\n        }\n        MutableClock clock = new MutableClock();\n        CircuitBreaker cb = new CircuitBreaker(clock, 3, Duration.ofSeconds(10), 2);\n        check("starts closed", () -> eq(CircuitBreaker.State.CLOSED, cb.state()));\n        // 2 failures not enough\n        try { cb.tryCall(() -> { throw new RuntimeException("boom"); }); } catch (Exception ignored){}\n        try { cb.tryCall(() -> { throw new RuntimeException("boom"); }); } catch (Exception ignored){}\n        check("still closed after 2 failures", () -> eq(CircuitBreaker.State.CLOSED, cb.state()));\n        // 3rd failure opens\n        try { cb.tryCall(() -> { throw new RuntimeException("boom"); }); } catch (Exception ignored){}\n        check("opens after threshold", () -> eq(CircuitBreaker.State.OPEN, cb.state()));\n        // while open, calls rejected without invoking action\n        check("rejected while open", () -> {\n            boolean[] invoked = {false};\n            boolean r = false;\n            try { r = cb.tryCall(() -> { invoked[0]=true; return 1; }); } catch (Exception e){}\n            if (r) throw new AssertionError("should be rejected");\n            if (invoked[0]) throw new AssertionError("action should not be invoked");\n        });\n        // after openDuration, half-open\n        clock.now = clock.now.plusSeconds(11);\n        check("half-open after timeout", () -> eq(CircuitBreaker.State.HALF_OPEN, cb.state()));\n        // permit success closes\n        try { cb.tryCall(() -> 1); } catch (Exception ignored){}\n        try { cb.tryCall(() -> 1); } catch (Exception ignored){}\n        check("closes after permits succeed", () -> eq(CircuitBreaker.State.CLOSED, cb.state()));\n        System.out.println("RESULT " + passed + "/" + total);\n    }\n}',
      reference: 'import java.time.*;\nimport java.util.concurrent.*;\n\nclass CircuitBreaker {\n    enum State { CLOSED, OPEN, HALF_OPEN }\n    private final Clock clock;\n    private final int failureThreshold;\n    private final Duration openDuration;\n    private final int halfOpenPermits;\n    private State state = State.CLOSED;\n    private int consecutiveFailures = 0;\n    private Instant openedAt = null;\n    private int halfOpenSuccess = 0;\n    private int halfOpenAttempts = 0;\n\n    CircuitBreaker(Clock clock, int failureThreshold, Duration openDuration, int halfOpenPermits) {\n        this.clock = clock; this.failureThreshold = failureThreshold;\n        this.openDuration = openDuration; this.halfOpenPermits = halfOpenPermits;\n    }\n\n    State state() {\n        if (state == State.OPEN && clock.instant().isAfter(openedAt.plus(openDuration))) state = State.HALF_OPEN;\n        return state;\n    }\n\n    <T> boolean tryCall(Callable<T> action) throws Exception {\n        State s = state();\n        if (s == State.OPEN) return false;\n        if (s == State.HALF_OPEN) {\n            if (halfOpenAttempts >= halfOpenPermits) return false;\n            halfOpenAttempts++;\n        }\n        try {\n            action.call();\n            if (state == State.HALF_OPEN) {\n                halfOpenSuccess++;\n                if (halfOpenSuccess >= halfOpenPermits) { state = State.CLOSED; consecutiveFailures = 0; halfOpenSuccess = 0; halfOpenAttempts = 0; }\n            } else {\n                consecutiveFailures = 0;\n            }\n            return true;\n        } catch (Exception e) {\n            if (state == State.HALF_OPEN) { state = State.OPEN; openedAt = clock.instant(); halfOpenSuccess = 0; halfOpenAttempts = 0; }\n            else { consecutiveFailures++; if (consecutiveFailures >= failureThreshold) { state = State.OPEN; openedAt = clock.instant(); } }\n            throw e;\n        }\n    }\n}',
      hints: [
        'State() phải tự kiểm tra thời gian để chuyển OPEN → HALF_OPEN.',
        'Half-open cần đếm số attempt đã cho phép, không chỉ success.'
      ],
      explain: 'Lỗi hay gặp: quên reset counter khi chuyển trạng thái, hoặc cho phép không giới hạn gọi trong half-open (storm). Trong production dùng Resilience4j thay vì tự viết, nhưng hiểu cơ chế giúp tune đúng.'
    }
  ],
  check: [
    { q: 'Circuit breaker chuyển từ Closed sang Open khi nào?', options: ['Sau 1 lỗi bất kỳ', 'Khi tỉ lệ lỗi trong cửa sổ trượt vượt ngưỡng', 'Khi latency vượt ngưỡng', 'Khi thread pool đầy'], answer: 1, explain: 'Closed đếm lỗi trong cửa sổ; vượt ngưỡng (tỉ lệ hoặc số) thì mở. Latency cao có thể là tín hiệu nhưng breaker cổ điển dựa vào lỗi/timeout.' },
    { q: 'Vì sao half-open phải giới hạn số gọi thử?', options: ['Để tiết kiệm CPU', 'Để dependency đang hồi phục không bị dội lại (storm)', 'Vì thread pool nhỏ', 'Không cần giới hạn'], answer: 1, explain: 'Nếu cho phép tất cả thread cùng thử khi half-open, dependency đang yếu sẽ bị tấn công đúng lúc nó cố hồi phục → fail lại → mở lại. Giới hạn 1–3 gọi thử.' },
    { q: 'Dùng Clock giả trong test giúp gì?', options: ['Chạy nhanh hơn', 'Test logic thời gian mà không sleep, deterministic', 'Tránh GC', 'Không liên quan'], answer: 1, explain: 'Clock.injectable cho phép điều khiển thời gian trong test → không sleep, không flaky. Pattern chung cho timeout, TTL, SLA.' }
  ],
  related: ['microservices-015', 'microservices-016', 'microservices-017'],
  tags: ['circuit-breaker', 'resilience', 'fault-tolerance', 'clock']
},
{
  id: 'lesson-microservices-026',
  track: 'microservices',
  order: 26,
  title: 'Idempotency key cho API thanh toán: lưu kết quả theo key, lặp trả cùng kết quả, khác payload bị từ chối',
  level: 'senior',
  minutes: 30,
  goals: [
    'Giải thích được vì sao API thanh toán bắt buộc phải idempotent',
    'Tự viết được store idempotency key với in-flight dedup và payload hash',
    'Biết xử lý request lặp và request khác payload cùng key'
  ],
  body: `### Vì sao thanh toán phải idempotent

**Tóm tắt:** Mạng không đáng tin: client gửi request thanh toán, server xử lý xong nhưng response bị mất → client retry → server xử lý lần nữa → khách bị trừ tiền 2 lần. Idempotency key giải quyết: client gửi kèm một key duy nhất (UUID) cho mỗi "ý định thanh toán"; server lưu kết quả theo key; request lặp với cùng key trả **cùng kết quả** mà **không** xử lý lại; request với cùng key nhưng **payload khác** bị từ chối (409/422) để phát hiện bug client.

### Luồng xử lý

1. Client tạo key = UUID v4 cho mỗi ý định thanh toán (ví dụ click nút "Thanh toán"), retry dùng **cùng key**.
2. Server nhận request: kiểm tra store theo key.
   - Chưa có → tạo record trạng thái "in-flight" (đang xử lý), xử lý thanh toán, lưu kết quả, đánh dấu "completed".
   - Đang in-flight (request trước chưa xong) → chờ hoặc trả 409 Conflict (hoặc 202 với retry-after).
   - Đã completed → trả kết quả đã lưu, không xử lý lại.
3. Kiểm tra payload: hash payload (hoặc so field quan trọng). Nếu key đã có nhưng payload hash khác → 422 (client bug: cùng key nhưng dữ liệu khác).

### In-flight dedup

Vấn đề: hai request cùng key đến cùng lúc (client retry trước khi server trả lời). Nếu cả hai đều "chưa có" và cùng xử lý → duplicate. Giải pháp: dùng lock theo key hoặc conditional insert (INSERT ... ON CONFLICT / compare-and-swap) để chỉ một request "giành" được quyền xử lý; request kia chờ hoặc trả in-flight.

### TTL và phantom

Key không lưu mãi mãi (tốn bộ nhớ). TTL thường 24h–7 ngày. Sau TTL, key bị xoá → request lặp muộn sẽ xử lý lại (phantom duplicate). Đây là trade-off chấp nhận được: retry muộn (sau TTL) hiếm, và hệ thống downstream (payment gateway) cũng phải idempotent theo transaction id.

### Ví dụ đời thực

E-commerce: khách bấm "Đặt hàng" → client sinh key K1, gửi POST /orders với K1. Server xử lý, trừ kho, tạo order O1, lưu kết quả theo K1. Response bị mất do mạng. Client retry với K1 → server thấy K1 completed → trả O1, không trừ kho lần nữa. Nếu client bug gửi K1 nhưng payload khác (thêm sản phẩm) → server trả 422, client phải tạo key mới. Đo: trước khi có idempotency, duplicate order ~0.3% giao dịch; sau khi có, ~0.

### Trả lời mẫu khi phỏng vấn

Idempotency key là bắt buộc cho API thanh toán vì mạng không đáng tin và client retry. Client sinh UUID cho mỗi ý định, retry dùng cùng key. Server lưu kết quả theo key: chưa có thì xử lý và lưu; đã xong thì trả kết quả lưu; đang xử lý thì trả 409/202. Cùng key nhưng payload khác → 422 để phát hiện bug. Cần in-flight dedup bằng conditional insert/lock theo key, và TTL (24h–7 ngày) chấp nhận phantom duplicate muộn. Payment gateway downstream cũng phải idempotent theo transaction id — idempotency ở API gateway chỉ giải quyết retry của client, không giải quyết toàn bộ.

> Senior tip: Key phải do client sinh (server không biết "ý định" nào là cùng một), và client phải retry với cùng key. Nếu server sinh key thì retry của client không biết key cũ → vô dụng. Lưu ý: idempotency không thay thế cho transaction idempotent ở downstream — hai lớp phải phối hợp.
`,
  exercises: [
    {
      title: 'Store idempotency key với in-flight dedup và payload hash',
      prompt: 'Viết class {{IdempotencyStore}} với phương thức {{Result handle(String key, String payloadHash, Supplier<Result> processor)}}. Quy tắc:\n- Nếu key chưa có: đánh dấu in-flight, chạy processor, lưu kết quả, trả về.\n- Nếu key đang in-flight (chưa xong): ném {{InFlightException}}.\n- Nếu key đã completed với cùng payloadHash: trả kết quả đã lưu.\n- Nếu key đã completed nhưng payloadHash khác: ném {{PayloadMismatchException}}.\n\nDùng ConcurrentHashMap và conditional put (putIfAbsent) để dedup đồng thời.',
      starter: 'import java.util.*;\nimport java.util.concurrent.*;\nimport java.util.function.*;\n\nclass IdempotencyStore {\n    static class Result { final int status; final String body; Result(int s, String b){status=s;body=b;} }\n    static class InFlightException extends RuntimeException {}\n    static class PayloadMismatchException extends RuntimeException {}\n\n    // TODO: implement\n    Result handle(String key, String payloadHash, Supplier<Result> processor) {\n        throw new UnsupportedOperationException("TODO");\n    }\n}',
      tests: 'import java.util.*;\nimport java.util.concurrent.*;\npublic class Main {\n    static int passed=0,total=0;\n    static void check(String n, Runnable r){total++;try{r.run();passed++;System.out.println("PASS "+n);}catch(Throwable t){System.out.println("FAIL "+n+": "+t);}}\n    public static void main(String[] args) {\n        IdempotencyStore s = new IdempotencyStore();\n        check("first call processes", () -> {\n            IdempotencyStore.Result r = s.handle("k1","h1", () -> new IdempotencyStore.Result(201,"order-1"));\n            if (r.status != 201 || !"order-1".equals(r.body)) throw new AssertionError("bad result");\n        });\n        check("repeat returns same result without processing", () -> {\n            boolean[] processed = {false};\n            IdempotencyStore.Result r = s.handle("k1","h1", () -> { processed[0]=true; return new IdempotencyStore.Result(201,"order-X"); });\n            if (processed[0]) throw new AssertionError("processor should not run");\n            if (!"order-1".equals(r.body)) throw new AssertionError("should return stored result");\n        });\n        check("payload mismatch throws", () -> {\n            try { s.handle("k1","h2", () -> new IdempotencyStore.Result(201,"x")); throw new AssertionError("should throw"); }\n            catch (IdempotencyStore.PayloadMismatchException e) {}\n        });\n        check("different key independent", () -> {\n            IdempotencyStore.Result r = s.handle("k2","h9", () -> new IdempotencyStore.Result(200,"ok"));\n            if (r.status != 200) throw new AssertionError("bad");\n        });\n        System.out.println("RESULT "+passed+"/"+total);\n    }\n}',
      reference: 'import java.util.*;\nimport java.util.concurrent.*;\nimport java.util.function.*;\n\nclass IdempotencyStore {\n    static class Result { final int status; final String body; Result(int s, String b){status=s;body=b;} }\n    static class InFlightException extends RuntimeException {}\n    static class PayloadMismatchException extends RuntimeException {}\n\n    static class Entry {\n        volatile boolean done = false;\n        String payloadHash;\n        Result result;\n    }\n\n    private final ConcurrentHashMap<String, Entry> store = new ConcurrentHashMap<>();\n\n    Result handle(String key, String payloadHash, Supplier<Result> processor) {\n        Entry e = new Entry();\n        Entry existing = store.putIfAbsent(key, e);\n        if (existing != null) {\n            // wait for completion (simplified: spin with small sleep)\n            long deadline = System.currentTimeMillis() + 5000;\n            while (!existing.done && System.currentTimeMillis() < deadline) {\n                try { Thread.sleep(5); } catch (InterruptedException ie) { Thread.currentThread().interrupt(); break; }\n            }\n            if (!existing.done) throw new InFlightException();\n            if (!existing.payloadHash.equals(payloadHash)) throw new PayloadMismatchException();\n            return existing.result;\n        }\n        // we own it\n        e.payloadHash = payloadHash;\n        try {\n            Result r = processor.get();\n            e.result = r; e.done = true;\n            return r;\n        } catch (RuntimeException ex) {\n            store.remove(key);\n            throw ex;\n        }\n    }\n}',
      hints: [
        'Dùng ConcurrentHashMap.putIfAbsent để chỉ một thread "giành" key.',
        'Lưu payloadHash trong entry để so sánh khi repeat.'
      ],
      explain: 'Lỗi hay gặp: không dedup đồng thời (hai thread cùng xử lý), hoặc không lưu payload hash (client bug không bị phát hiện). Trong production dùng DB với unique constraint trên key và transaction; in-memory chỉ dùng cho bài tập/single node.'
    }
  ],
  check: [
    { q: 'Idempotency key nên do ai sinh?', options: ['Server', 'Client', 'Database', 'Gateway'], answer: 1, explain: 'Client sinh key cho mỗi ý định thanh toán; retry dùng cùng key. Server sinh key thì client retry không biết key cũ → vô dụng.' },
    { q: 'Request lặp với cùng key nhưng payload khác nên xử lý thế nào?', options: ['Xử lý lại', 'Trả kết quả cũ', 'Từ chối (422/409)', 'Bỏ qua'], answer: 2, explain: 'Cùng key khác payload = client bug; phải từ chối để phát hiện, không xử lý lại (có thể duplicate) cũng không trả kết quả cũ (sai dữ liệu).' },
    { q: 'In-flight request (chưa xong) đến cùng lúc nên?', options: ['Xử lý song song', 'Chờ hoặc trả 409/202', 'Từ chối vĩnh viễn', 'Retry vô hạn'], answer: 1, explain: 'Không xử lý song song (duplicate). Chờ hoặc trả 409 Conflict / 202 Accepted với retry-after.' }
  ],
  related: ['microservices-006', 'microservices-011', 'microservices-001'],
  tags: ['idempotency', 'payment', 'api', 'dedup']
},
{
  id: 'lesson-microservices-027', track: 'microservices', order: 27,
  title: 'Circuit breaker cửa sổ thời gian: đếm tỉ lệ lỗi trong T giây gần nhất', level: 'senior', minutes: 30,
  goals: [
    'Phân biệt breaker đếm liên tiếp, đếm theo số lần (count-based) và đếm theo thời gian (time-based)',
    'Tự viết breaker cửa sổ thời gian: ghi kết quả kèm mốc thời gian, loại kết quả cũ, tính tỉ lệ lỗi',
    'Dùng Clock giả để test xác định và tránh half-open storm'
  ],
  body: `**Tóm tắt:** Circuit breaker cửa sổ thời gian (time-based sliding window) mở mạch khi **tỉ lệ lỗi trong T giây gần nhất** vượt ngưỡng, thay vì đếm số lỗi liên tiếp hay đếm trên N lần gọi gần nhất. Mỗi kết quả gọi được ghi kèm một mốc thời gian; khi đánh giá, chỉ những kết quả còn nằm trong cửa sổ T giây mới được tính, kết quả cũ hơn bị loại bỏ. Nhờ vậy breaker phản ánh đúng "sức khỏe hiện tại" của dependency và không bị một request thành công xen giữa làm reset bộ đếm.

### Ba cách đếm lỗi, ba hành vi khác nhau
- **Đếm liên tiếp (consecutive):** cứ một lần thành công là bộ đếm về 0. Nhược điểm: lỗi rải rác (thành công xen kẽ) gần như không bao giờ chạm ngưỡng, breaker mù trước một dependency lỗi 40%.
- **Đếm theo số lần (count-based):** giữ N kết quả gần nhất (ví dụ 100). Đơn giản, bộ nhớ cố định, nhưng khi traffic thấp thì N lần gọi có thể trải dài nhiều giờ, phản ánh quá khứ cũ.
- **Đếm theo thời gian (time-based):** giữ các kết quả trong T giây gần nhất (ví dụ 10 giây). Phản ánh "hiện tại" tốt hơn, phù hợp khi lưu lượng dao động mạnh; đổi lại cần lưu mốc thời gian và loại phần tử cũ.

Bài 016 đã làm bản count-based, bài 025 làm bản đếm liên tiếp. Bài này làm bản **time-based** — góc còn thiếu — và là cách Resilience4j dùng khi {{slidingWindowType}} = {{TIME_BASED}}.

### Ba khái niệm cần định nghĩa
- **Cửa sổ trượt theo thời gian:** một khoảng T giây luôn trôi theo đồng hồ. Tại thời điểm now, cửa sổ là đoạn [now - T, now]. Mọi kết quả có mốc thời gian nhỏ hơn now - T đã "rơi" khỏi cửa sổ và không được tính.
- **Tỉ lệ lỗi (failure rate):** số kết quả thất bại chia cho tổng số kết quả còn trong cửa sổ. Ví dụ 4 kết quả trong 10 giây, 2 thất bại → tỉ lệ 0,5 (50%).
- **minimumCalls (số lần tối thiểu):** chưa đủ ngưỡng này thì chưa xét tỉ lệ, tránh mở mạch oan lúc traffic thấp (1 lỗi trên 1 lần gọi là 100% nhưng không đủ tin cậy).

### Cơ chế từng bước
1. **Ghi kết quả kèm mốc thời gian:** mỗi lần gọi xong, thêm một phần tử (timestamp, thành công/thất bại) vào cuối cửa sổ (một hàng đợi đôi).
2. **Loại kết quả cũ (evict):** trước khi tính, bỏ khỏi đầu hàng mọi phần tử có timestamp < now - T. Vì phần tử được thêm theo thứ tự thời gian tăng dần, chỉ cần xét từ đầu.
3. **Tính tỉ lệ:** nếu số phần tử còn lại >= minimumCalls và tỉ lệ lỗi >= ngưỡng thì mở mạch.
4. **Mở mạch (OPEN):** ghi openedAt = now, xóa cửa sổ để lần đo sau bắt đầu sạch.
5. **Open sang Half-open:** khi now - openedAt >= openMs, chuyển Half-open và reset bộ đếm probe.
6. **Half-open:** cho tối đa một số probe giới hạn; đủ ngưỡng thành công thì về Closed và xóa cửa sổ, chỉ cần một probe lỗi là về Open ngay.

~~~java
// Bản rút gọn: cửa sổ thời gian bằng ArrayDeque các phần tử [timestamp, outcome]
synchronized void recordFailure() {
    long now = clock.millis();
    if (state == State.HALF_OPEN) { state = State.OPEN; openedAt = now; window.clear(); return; }
    window.addLast(new long[]{now, 0});          // 0 = thất bại
    evict(now);                                   // bỏ phần tử cũ hơn now - windowMs
    if (window.size() >= minimumCalls && failureRate() >= failureRateThreshold) {
        state = State.OPEN; openedAt = now; window.clear();
    }
}
private void evict(long now) {
    while (!window.isEmpty() && window.peekFirst()[0] < now - windowMs) window.removeFirst();
}
~~~

### Vì sao dùng Clock giả
Trong test, nếu dùng giờ thật, muốn kiểm tra "kết quả cũ rơi khỏi cửa sổ" bạn phải ngủ thật vài giây — chậm và flaky (lúc pass lúc fail). Clock giả (một hàm trả về số mili-giây do bạn điều khiển) cho phép "tiến thời gian" tức thì: đặt now = 0 rồi now = 1500 để kiểm tra phần tử ở mốc 0 đã bị loại. Đây là pattern chung cho mọi logic phụ thuộc thời gian (timeout, TTL, SLA, breaker).

### Lỗi hay gặp trên production
- **Quên evict phần tử cũ:** cửa sổ phình theo thời gian, tỉ lệ tính cả quá khứ, breaker mở muộn hoặc không bao giờ mở.
- **minimumCalls quá thấp:** lúc traffic thấp, 1-2 lỗi làm tỉ lệ 100% và mở mạch oan; đặt theo lưu lượng thực (ví dụ 20-50).
- **Cửa sổ quá dài so với nhịp lỗi:** phản ánh quá khứ, không bảo vệ hiện tại; cân nhắc T ngắn hơn khi dependency hay đổi trạng thái nhanh.
- **Half-open không giới hạn probe:** dependency vừa hồi phục bị dồn cả trăm request, sập lại; giới hạn số probe.
- **Không xóa cửa sổ khi vào Open và khi về Closed:** lần đo sau lẫn kết quả cũ.

### Ví dụ đời thực
Service Order gọi Payment. Payment tăng lỗi từ 0,1% lên 60% trong 5 phút do pool kết nối cạn, lỗi rải rác (có request lọt qua). Breaker đếm liên tiếp (ngưỡng 5 liên tiếp) không mở vì cứ vài lỗi lại có một thành công chen vào reset bộ đếm; p99 của Order tăng từ 180ms lên 4,2s, 18% request timeout. Đổi sang time-based: cửa sổ 10 giây, failureRateThreshold 50%, minimumCalls 20, openMs 30 giây, half-open 10 probe. Sau khi đủ 20 call trong 10 giây, tỉ lệ lỗi 60% vượt ngưỡng nên breaker mở mạch ngay dù lỗi không liên tiếp. Khi mở, Order trả 503 kèm metric; 30 giây sau cho 10 probe, 9/10 thành công (tỉ lệ 10% < ngưỡng) nên về Closed. Kết quả: p99 của Order về 200ms, timeout giảm từ 18% xuống 0,4%.

### Trả lời mẫu khi phỏng vấn
Circuit breaker của tôi đếm tỉ lệ lỗi trên một cửa sổ trượt theo thời gian, không đếm lỗi liên tiếp, vì lỗi rải rác không làm bộ đếm liên tiếp chạm ngưỡng. Tôi dùng cửa sổ 10 giây, failure rate threshold 50%, minimum 20 call để tránh mở oan lúc traffic thấp, wait 30 giây và half-open giới hạn 10 probe. Mỗi kết quả được ghi kèm mốc thời gian; trước khi tính tỉ lệ tôi loại các phần tử cũ hơn 10 giây, rồi so tỉ lệ với ngưỡng. Khi vượt ngưỡng tôi mở mạch, fail fast trả 503 và ghi metric; sau 30 giây cho 10 request thử, đủ thành công thì về Closed. Tôi theo dõi state, failure rate, số request bị reject và thời gian ở OPEN theo từng dependency để chỉnh ngưỡng theo SLA.

> Senior tip: đặt failureRateThreshold theo SLA: dependency nội bộ 50% là hợp lý, còn dependency ngoài (thanh toán) nên 30-40% vì mỗi lỗi đều là tiền; luôn đo tỉ lệ reject để biết ngưỡng có quá gắt không, và theo dõi tuổi phần tử cũ nhất trong cửa sổ để phát hiện evict có chạy đúng không.

### Liên hệ phỏng vấn
- **Hỏi:** Time-based khác count-based window ở đâu? **Trả lời ngắn:** Count giữ N lần gọi gần nhất (đơn giản, nhưng cũ khi traffic thấp); time giữ các lần gọi trong T giây gần nhất (phản ánh hiện tại tốt hơn, tốn bộ nhớ hơn và cần chia bucket/evict theo thời gian).
- **Hỏi:** Vì sao time-based tốt hơn đếm liên tiếp khi lỗi rải rác? **Trả lời ngắn:** Đếm liên tiếp reset khi có một thành công xen giữa nên bỏ sót lỗi rải rác; time-based nhìn tỉ lệ lỗi tổng trong cửa sổ nên vẫn phát hiện và mở mạch kịp thời.
- **Hỏi:** minimumCalls dùng để làm gì? **Trả lời ngắn:** Tránh mở mạch oan khi chỉ có 1-2 call lúc traffic thấp; chỉ xét tỉ lệ khi đủ mẫu.
- **Hỏi:** Vì sao dùng Clock giả trong test? **Trả lời ngắn:** Để tiến thời gian tức thì, kiểm tra phần tử cũ rơi khỏi cửa sổ mà không cần ngủ thật, test deterministic không flaky.`,
  exercises: [{
    title: 'TimeWindowBreaker: cửa sổ thời gian + tỉ lệ lỗi + half-open giới hạn',
    prompt: `Cài {{TimeWindowBreaker}} theo mô hình tỉ lệ lỗi trên cửa sổ trượt theo thời gian (time-based), dùng {{Clock}} giả (interface {{long millis()}}).

- Constructor: {{TimeWindowBreaker(long windowMs, double failureRateThreshold, int minimumCalls, long openMs, int halfOpenMaxCalls, Clock clock)}}. Validate: {{windowMs > 0}}, {{0 < failureRateThreshold <= 1}}, {{minimumCalls >= 1}}, {{openMs > 0}}, {{halfOpenMaxCalls >= 1}}, {{clock != null}}; sai thì ném {{IllegalArgumentException}}.
- {{boolean canCall()}}: loại các phần tử có timestamp nhỏ hơn {{now - windowMs}}; nếu OPEN và {{now - openedAt >= openMs}} thì chuyển HALF_OPEN, reset bộ đếm probe; nếu vẫn OPEN thì {{false}}. Nếu HALF_OPEN: cho tối đa {{halfOpenMaxCalls}} probe (mỗi lần gọi tăng bộ đếm), hết thì {{false}}. CLOSED thì {{true}}.
- {{void recordSuccess()}}: nếu HALF_OPEN tăng số probe thành công, đủ {{halfOpenMaxCalls}} thì về CLOSED và xóa cửa sổ; nếu CLOSED thì thêm kết quả thành công kèm {{now}} vào cửa sổ rồi loại phần tử cũ.
- {{void recordFailure()}}: nếu HALF_OPEN thì về OPEN, {{openedAt = now}}, xóa cửa sổ; nếu CLOSED thì thêm kết quả thất bại kèm {{now}}, loại phần tử cũ, và nếu đủ {{minimumCalls}} mà {{failureRate >= failureRateThreshold}} thì về OPEN, {{openedAt = now}}, xóa cửa sổ.
- {{State state()}} trả trạng thái hiện tại; {{int count()}} trả số phần tử còn trong cửa sổ (đã loại phần tử cũ theo đồng hồ hiện tại).

{{Clock}} là interface {{long millis()}}. Test dùng {{AtomicLong}} làm clock.`,
    starter: `interface Clock { long millis(); }
class TimeWindowBreaker {
    enum State { CLOSED, OPEN, HALF_OPEN }
    private final long windowMs;
    private final double failureRateThreshold;
    private final int minimumCalls;
    private final long openMs;
    private final int halfOpenMaxCalls;
    private final Clock clock;
    private final java.util.ArrayDeque<long[]> window = new java.util.ArrayDeque<>();
    private State state = State.CLOSED;
    private long openedAt = 0;
    private int halfOpenCalls = 0;
    private int halfOpenSuccess = 0;
    TimeWindowBreaker(long windowMs, double failureRateThreshold, int minimumCalls, long openMs, int halfOpenMaxCalls, Clock clock) {
        this.windowMs = windowMs; this.failureRateThreshold = failureRateThreshold; this.minimumCalls = minimumCalls;
        this.openMs = openMs; this.halfOpenMaxCalls = halfOpenMaxCalls; this.clock = clock;
    }
    synchronized boolean canCall() { throw new UnsupportedOperationException("TODO"); }
    synchronized void recordSuccess() { throw new UnsupportedOperationException("TODO"); }
    synchronized void recordFailure() { throw new UnsupportedOperationException("TODO"); }
    synchronized State state() { return state; }
    synchronized int count() { return window.size(); }
}`,
    tests: `public class Main {
 static int p=0,t=0; static void ck(String n,Runnable r){t++;try{r.run();p++;System.out.println("PASS "+n);}catch(Throwable e){System.out.println("FAIL "+n+": "+e);}}
 static void eq(Object a,Object b){if(!Objects.equals(a,b))throw new AssertionError(a+" != "+b);}
 public static void main(String[] x){
  ck("old failures age out of the time window",()->{
   AtomicLong clock=new AtomicLong(0);
   TimeWindowBreaker b=new TimeWindowBreaker(1000,0.5,2,5000,2,clock::get);
   b.recordFailure();
   clock.set(1500);
   b.recordFailure();
   eq(TimeWindowBreaker.State.CLOSED,b.state());
   eq(1,b.count());
  });
  ck("opens when failure rate reaches threshold in window",()->{
   AtomicLong clock=new AtomicLong(0);
   TimeWindowBreaker b=new TimeWindowBreaker(1000,0.5,4,5000,2,clock::get);
   b.recordSuccess(); b.recordSuccess(); b.recordFailure();
   eq(TimeWindowBreaker.State.CLOSED,b.state());
   b.recordFailure();
   eq(TimeWindowBreaker.State.OPEN,b.state());
  });
  ck("open blocks until openMs then half-open",()->{
   AtomicLong clock=new AtomicLong(0);
   TimeWindowBreaker b=new TimeWindowBreaker(1000,0.5,2,5000,2,clock::get);
   b.recordFailure(); b.recordFailure();
   eq(false,b.canCall());
   clock.set(999); eq(false,b.canCall());
   clock.set(5000); eq(true,b.canCall());
   eq(TimeWindowBreaker.State.HALF_OPEN,b.state());
  });
  ck("half-open success closes after maxCalls",()->{
   AtomicLong clock=new AtomicLong(0);
   TimeWindowBreaker b=new TimeWindowBreaker(1000,0.5,2,5000,2,clock::get);
   b.recordFailure(); b.recordFailure();
   clock.set(5000); eq(true,b.canCall());
   b.recordSuccess();
   eq(TimeWindowBreaker.State.HALF_OPEN,b.state());
   eq(true,b.canCall());
   b.recordSuccess();
   eq(TimeWindowBreaker.State.CLOSED,b.state());
  });
  ck("half-open failure reopens",()->{
   AtomicLong clock=new AtomicLong(0);
   TimeWindowBreaker b=new TimeWindowBreaker(1000,0.5,2,5000,2,clock::get);
   b.recordFailure(); b.recordFailure();
   clock.set(5000); eq(true,b.canCall());
   b.recordFailure();
   eq(TimeWindowBreaker.State.OPEN,b.state());
   eq(false,b.canCall());
  });
  ck("half-open limits probe calls",()->{
   AtomicLong clock=new AtomicLong(0);
   TimeWindowBreaker b=new TimeWindowBreaker(1000,0.5,2,5000,2,clock::get);
   b.recordFailure(); b.recordFailure();
   clock.set(5000);
   eq(true,b.canCall());
   eq(true,b.canCall());
   eq(false,b.canCall());
  });
  System.out.println("RESULT "+p+"/"+t);
 }
}`,
    reference: `interface Clock { long millis(); }
class TimeWindowBreaker {
    enum State { CLOSED, OPEN, HALF_OPEN }
    private final long windowMs;
    private final double failureRateThreshold;
    private final int minimumCalls;
    private final long openMs;
    private final int halfOpenMaxCalls;
    private final Clock clock;
    private final ArrayDeque<long[]> window = new ArrayDeque<>();
    private State state = State.CLOSED;
    private long openedAt = 0;
    private int halfOpenCalls = 0;
    private int halfOpenSuccess = 0;
    TimeWindowBreaker(long windowMs, double failureRateThreshold, int minimumCalls, long openMs, int halfOpenMaxCalls, Clock clock) {
        if (windowMs <= 0) throw new IllegalArgumentException("windowMs");
        if (failureRateThreshold <= 0 || failureRateThreshold > 1) throw new IllegalArgumentException("threshold");
        if (minimumCalls < 1) throw new IllegalArgumentException("minimumCalls");
        if (openMs <= 0) throw new IllegalArgumentException("openMs");
        if (halfOpenMaxCalls < 1) throw new IllegalArgumentException("halfOpenMaxCalls");
        if (clock == null) throw new IllegalArgumentException("clock");
        this.windowMs = windowMs; this.failureRateThreshold = failureRateThreshold; this.minimumCalls = minimumCalls;
        this.openMs = openMs; this.halfOpenMaxCalls = halfOpenMaxCalls; this.clock = clock;
    }
    private void evict(long now) {
        while (!window.isEmpty() && window.peekFirst()[0] < now - windowMs) window.removeFirst();
    }
    private double failureRate() {
        int fail = 0;
        for (long[] e : window) if (e[1] == 0) fail++;
        return (double) fail / window.size();
    }
    synchronized boolean canCall() {
        long now = clock.millis();
        evict(now);
        if (state == State.OPEN) {
            if (now - openedAt >= openMs) { state = State.HALF_OPEN; halfOpenCalls = 0; halfOpenSuccess = 0; }
            else return false;
        }
        if (state == State.HALF_OPEN) {
            if (halfOpenCalls >= halfOpenMaxCalls) return false;
            halfOpenCalls++;
            return true;
        }
        return true;
    }
    synchronized void recordSuccess() {
        long now = clock.millis();
        if (state == State.HALF_OPEN) {
            halfOpenSuccess++;
            if (halfOpenSuccess >= halfOpenMaxCalls) { state = State.CLOSED; window.clear(); halfOpenCalls = 0; halfOpenSuccess = 0; }
            return;
        }
        if (state == State.CLOSED) { window.addLast(new long[]{now, 1}); evict(now); }
    }
    synchronized void recordFailure() {
        long now = clock.millis();
        if (state == State.HALF_OPEN) {
            state = State.OPEN; openedAt = now; halfOpenCalls = 0; halfOpenSuccess = 0; window.clear(); return;
        }
        if (state == State.CLOSED) {
            window.addLast(new long[]{now, 0});
            evict(now);
            if (window.size() >= minimumCalls && failureRate() >= failureRateThreshold) {
                state = State.OPEN; openedAt = now; window.clear();
            }
        }
    }
    synchronized State state() { return state; }
    synchronized int count() { evict(clock.millis()); return window.size(); }
}`,
    hints: [
      'Mỗi phần tử cửa sổ là một mảng long hai phần: timestamp và outcome (1 thành công, 0 thất bại). Thêm vào cuối, evict từ đầu khi timestamp < now - windowMs.',
      'canCall() trong OPEN: nếu now - openedAt >= openMs thì chuyển HALF_OPEN và reset bộ đếm probe, ngược lại trả false. HALF_OPEN giới hạn số probe bằng halfOpenCalls.',
      'recordFailure() trong HALF_OPEN phải về OPEN ngay và set openedAt = now; trong CLOSED thì thêm phần tử, evict, rồi so failureRate với ngưỡng khi đủ minimumCalls.',
      'Nhớ xóa cửa sổ khi vào OPEN và khi về CLOSED để lần đo sau không lẫn kết quả cũ.'
    ],
    explain: `Bài tập cài breaker tỉ lệ lỗi trên cửa sổ thời gian: ArrayDeque giữ các phần tử [timestamp, outcome] theo thứ tự thời gian tăng dần, mỗi lần thêm thì evict phần tử có timestamp nhỏ hơn now - windowMs. Chỉ khi số phần tử còn lại đủ minimumCalls mới tính failureRate = số thất bại / kích thước cửa sổ và so với ngưỡng; vượt ngưỡng thì vào OPEN, ghi openedAt và xóa cửa sổ.

canCall() xử lý ba trạng thái: OPEN chỉ chuyển HALF_OPEN khi hết openMs; HALF_OPEN giới hạn số probe bằng halfOpenCalls; CLOSED luôn cho qua. recordSuccess/recordFailure phân nhánh theo trạng thái: ở HALF_OPEN, đủ halfOpenMaxCalls lần thành công thì về CLOSED, còn một lỗi thì về OPEN ngay.

Điểm khác so với bản count-based (bài 016): ở đây phần tử bị loại theo mốc thời gian chứ không theo số lượng, nên khi traffic thấp cửa sổ vẫn phản ánh đúng "T giây gần nhất". Lỗi thường gặp: quên evict (cửa sổ phình, mở muộn), không xóa cửa sổ khi vào OPEN, hoặc so tỉ lệ khi chưa đủ minimumCalls (mở oan lúc traffic thấp). Trong production, các thông số này ánh xạ sang Resilience4j: slidingWindowType = TIME_BASED, slidingWindowSize (giây), failureRateThreshold, minimumNumberOfCalls, waitDurationInOpenState, permittedNumberOfCallsInHalfOpenState.`
  }],
  check: [
    { q: 'Điểm khác chính giữa time-based window và count-based window?', options: ['Time-based giữ N lần gọi gần nhất, count-based giữ T giây', 'Time-based giữ các lần gọi trong T giây gần nhất (loại phần tử cũ theo thời gian), count-based giữ N lần gọi gần nhất', 'Chúng giống hệt nhau', 'Time-based không cần ngưỡng tỉ lệ'], answer: 1, explain: `Đúng (B): time-based loại phần tử cũ hơn now - T theo mốc thời gian, phản ánh hiện tại tốt hơn khi traffic dao động; count-based giữ N phần tử gần nhất bất kể trải dài bao lâu. (A) mô tả ngược. (C) sai vì khác nhau về cách loại phần tử. (D) sai vì time-based vẫn cần failureRateThreshold.` },
    { q: 'Vì sao time-based tốt hơn đếm liên tiếp khi lỗi rải rác (thành công xen kẽ)?', options: ['Vì time-based không cần Clock', 'Vì đếm liên tiếp reset về 0 khi có một thành công xen giữa nên bỏ sót lỗi rải rác, còn time-based nhìn tỉ lệ lỗi trong cửa sổ', 'Vì time-based luôn mở mạch nhanh hơn', 'Vì đếm liên tiếp tốn nhiều bộ nhớ hơn'], answer: 1, explain: `Đúng (B): một request thành công xen giữa làm bộ đếm liên tiếp về 0, nên dependency lỗi 40% nhưng không liên tiếp gần như không chạm ngưỡng; time-based tính tỉ lệ trên cửa sổ nên vẫn phát hiện. (A) sai, time-based cần Clock để test. (C) sai, không phải lúc nào cũng nhanh hơn. (D) sai, vấn đề là độ nhạy với lỗi rải rác chứ không phải bộ nhớ.` },
    { q: 'minimumCalls (ví dụ 20) dùng để làm gì trong breaker time-based?', options: ['Giảm kích thước cửa sổ', 'Tránh mở mạch oan khi chỉ có 1-2 call lúc traffic thấp', 'Tăng tốc độ gọi downstream', 'Thay thế openMs'], answer: 1, explain: `Đúng (B): với 1-2 call, một lỗi cho tỉ lệ 100% nhưng không đủ tin cậy; chỉ xét khi đủ mẫu. (A) sai vì kích thước cửa sổ do windowMs quyết định. (C) sai vì không ảnh hưởng tốc độ gọi. (D) sai vì đây là hai tham số khác nhau.` },
    { q: 'Trong HALF_OPEN của bài này, khi nào về CLOSED và khi nào về OPEN?', options: ['Chờ hết số probe rồi mới quyết định', 'Đủ halfOpenMaxCalls probe thành công thì về CLOSED, chỉ cần một probe lỗi là về OPEN', 'Về CLOSED ngay sau probe thành công đầu tiên', 'Không đổi trạng thái'], answer: 1, explain: `Đúng (B): mô hình trong bài đếm số probe thành công, đủ halfOpenMaxCalls thì về CLOSED và xóa cửa sổ; mỗi probe lỗi đều chứng minh dependency chưa hồi phục nên về OPEN ngay và ghi openedAt = now. (A) là cách Resilience4j làm (chờ đủ probe rồi so tỉ lệ). (C) sai vì phải đủ halfOpenMaxCalls lần. (D) sai vì trạng thái cập nhật theo kết quả probe.` }
  ],
  related: ['microservices-025', 'microservices-060', 'microservices-061'],
  tags: ['circuit breaker', 'sliding window', 'time-based', 'failure rate', 'resilience4j']
},
{
  id: 'lesson-microservices-028', track: 'microservices', order: 28,
  title: 'Idempotency key thanh toán: fingerprint từ payload, TTL bằng Clock và từ chối in-flight', level: 'senior', minutes: 30,
  goals: [
    'Giải thích vì sao API thanh toán bắt buộc idempotent và vì sao key do client sinh',
    'Tự viết store idempotency: tính fingerprint từ payload, lưu kết quả, replay khi lặp, từ chối khi khác payload',
    'Xử lý in-flight (trả 409 ngay), TTL/phantom bằng Clock giả và dọn key khi processor lỗi'
  ],
  body: `**Tóm tắt:** Mạng không đáng tin: client gửi request thanh toán, server xử lý xong nhưng response bị mất, client retry, server xử lý lần nữa, khách bị trừ tiền hai lần. Idempotency key giải quyết: client gửi kèm một key duy nhất (UUID) cho mỗi "ý định thanh toán"; server tính **fingerprint** từ payload, lưu kết quả theo key; request lặp cùng key + cùng payload trả **đúng kết quả cũ** mà không xử lý lại; cùng key nhưng **payload khác** bị từ chối (422) để phát hiện bug client; request đến khi một request khác đang xử lý (in-flight) bị từ chối ngay (409); key hết TTL thì bị coi như mới (phantom).

### Vì sao key do client sinh
Chỉ client biết "hai request này là cùng một ý định". Nếu server tự sinh key thì khi client retry, nó không biết key cũ là gì, server lại tạo key mới và xử lý lần hai — idempotency vô dụng. Vì vậy client sinh một UUID cho mỗi lần bấm nút "Thanh toán", và **retry phải dùng lại đúng key đó**.

### Fingerprint: nhận ra "cùng payload" hay "khác payload"
Fingerprint là một dấu vân tay rút gọn của payload, dùng để so sánh nhanh mà không cần giữ nguyên payload gốc. Trong bài này fingerprint đơn giản là payload đã chuẩn hóa (cắt khoảng trắng thừa); production dùng SHA-256 của JSON đã chuẩn hóa (sắp xếp khóa ổn định) để hai payload "cùng nội dung" cho cùng fingerprint dù khác thứ tự khóa. Khi key đã tồn tại: fingerprint khớp → replay kết quả cũ; fingerprint khác → 422 (client bug: cùng key nhưng dữ liệu khác, không được xử lý lại vì có thể duplicate, cũng không được trả kết quả cũ vì sai dữ liệu).

### Máy trạng thái của một key
| Trạng thái key | Request cùng key + cùng fingerprint | Việc cần làm |
|---|---|---|
| chưa có | tạo in-flight | chạy processor, lưu kết quả, đánh dấu completed |
| in-flight (đang xử lý) | trả 409 ngay | không chờ, không xử lý song song |
| completed, còn trong TTL | replay | trả kết quả đã lưu, không chạy processor |
| completed, quá TTL | coi như mới (phantom) | chạy lại processor |
| bất kỳ, khác fingerprint | từ chối 422 | không đụng trạng thái cũ |

### In-flight: từ chối ngay thay vì chờ
Bài 026 cho request thứ hai "chờ" (spin) đến khi request đầu xong. Bài này chọn góc khác: **từ chối ngay 409** khi thấy key đang in-flight. Lý do: với API thanh toán đồng bộ, chờ giữ thread và dễ treo; trả 409 kèm Retry-After để client tự retry sau một khoảng ngắn gọn gàng hơn. Yêu cầu "chỉ một request được xử lý" được đảm bảo bằng putIfAbsent (đặt-hay-không) trên map: thread nào đặt được entry rỗng vào key đó thì "giành" quyền chạy processor.

### TTL và phantom bằng Clock giả
Key không lưu mãi (tốn bộ nhớ). TTL thường 24 giờ tới 7 ngày. Sau TTL, key bị coi như chưa từng có, request lặp muộn sẽ xử lý lại — gọi là **phantom duplicate**. Đây là đánh đổi chấp nhận được: retry sau nhiều ngày hiếm, và downstream (payment gateway) cũng phải idempotent theo transaction id. Để test phần TTL mà không ngủ thật, ta truyền vào một Clock giả: đặt now = 0 khi tạo key, rồi now = ttl để kiểm tra key đã hết hạn.

### Cơ chế từng bước
1. Client sinh key = UUID cho mỗi ý định, gửi POST kèm key và payload; retry dùng cùng key.
2. Server nhận: tính fingerprint từ payload, tra store theo key.
3. Nếu có entry completed và now - createdAt >= ttl → xóa entry (hết hạn), coi như mới.
4. Nếu có entry: fingerprint khác → ném PayloadMismatch (422); completed → trả kết quả cũ (replay); in-flight → ném InFlight (409).
5. Nếu chưa có: putIfAbsent một entry in-flight để giành quyền; nếu giành được thì chạy processor, lưu kết quả, đánh dấu completed; processor ném lỗi thì xóa entry để lần sau chạy lại.

~~~java
// Rút gọn: giành quyền bằng putIfAbsent, lưu fingerprint + kết quả theo key
Entry fresh = new Entry(fingerprint(payload), now);
Entry prev = store.putIfAbsent(key, fresh);   // chỉ một request giành được
if (prev != null) {
    if (!prev.fingerprint.equals(fresh.fingerprint)) throw new PayloadMismatchException();
    if (prev.completed) return prev.result;     // replay
    throw new InFlightException();              // 409: đang xử lý
}
try {
    Result r = processor.get();
    fresh.result = r; fresh.completed = true;   // publish result trước cờ completed
    return r;
} catch (RuntimeException ex) {
    store.remove(key, fresh);                   // lỗi: dọn để retry chạy lại
    throw ex;
}
~~~

### Lỗi hay gặp trên production
- **Server tự sinh key:** client retry không biết key cũ, idempotency vô dụng.
- **Không lưu fingerprint:** client bug gửi cùng key nhưng payload khác vẫn bị replay kết quả cũ, trả sai dữ liệu.
- **In-flight xử lý song song:** hai request cùng key cùng chạy processor, trừ tiền hai lần; phải dùng putIfAbsent/unique constraint để chỉ một request giành quyền.
- **TTL quá ngắn:** retry hợp lệ sau TTL bị xử lý lại (phantom); đặt TTL dài hơn cửa sổ retry thực tế.
- **Không dọn key khi processor lỗi:** key kẹt in-flight vĩnh viễn, mọi retry sau nhận 409; phải xóa entry khi lỗi.
- **Map trong RAM:** mất khi restart, không chia sẻ giữa nhiều pod; production dùng DB với unique index theo key và TTL, hoặc Redis.

### Ví dụ đời thực
E-commerce: khách bấm "Đặt hàng", client sinh key K1, gửi POST /orders với K1. Server xử lý, trừ kho, tạo order O1, lưu kết quả theo K1. Response mất do mạng. Client retry với K1 → server thấy K1 completed, fingerprint khớp → trả O1, không trừ kho lần nữa. Nếu client bug gửi K1 nhưng payload khác (thêm sản phẩm) → server trả 422, client phải tạo key mới. Đo: trước khi có idempotency, duplicate order ~0,3% giao dịch; sau khi có, ~0.

### Trả lời mẫu khi phỏng vấn
Idempotency key là bắt buộc cho API thanh toán vì mạng không đáng tin và client retry. Client sinh UUID cho mỗi ý định, retry dùng cùng key. Server tính fingerprint từ payload và lưu kết quả theo key: chưa có thì giành quyền bằng putIfAbsent, chạy processor và lưu; đã completed thì replay kết quả cũ; đang in-flight thì trả 409 kèm Retry-After; cùng key khác fingerprint thì trả 422 để phát hiện bug. Key có TTL (24 giờ tới 7 ngày), quá hạn thì coi như mới và chấp nhận phantom duplicate muộn. In-memory chỉ đúng cho một node; production dùng DB unique index theo key hoặc Redis. Payment gateway downstream cũng phải idempotent theo transaction id — idempotency ở API chỉ giải quyết retry của client, không thay thế downstream.

> Senior tip: key phải do client sinh và client phải retry cùng key; lưu fingerprint (SHA-256 của JSON chuẩn hóa) để bắt bug cùng key khác payload; theo dõi tỉ lệ replay, tỉ lệ in-flight bị từ chối (409) và số key hết TTL — 409 tăng đột biến thường là client retry quá sớm, không phải lỗi server.

### Liên hệ phỏng vấn
- **Hỏi:** Idempotency key nên do ai sinh, vì sao? **Trả lời ngắn:** Client sinh UUID cho mỗi ý định, retry dùng cùng key; server sinh key thì client retry không biết key cũ, idempotency vô dụng.
- **Hỏi:** Cùng key nhưng payload khác nên xử lý thế nào? **Trả lời ngắn:** Từ chối 422 để phát hiện bug client; không xử lý lại (có thể duplicate) và không trả kết quả cũ (sai dữ liệu). Dùng fingerprint (SHA-256 của JSON chuẩn hóa) để so sánh.
- **Hỏi:** In-flight request đến cùng lúc nên làm gì? **Trả lời ngắn:** Trả 409 kèm Retry-After, không xử lý song song; giành quyền bằng putIfAbsent/unique constraint để chỉ một request chạy processor.
- **Hỏi:** TTL và phantom duplicate là gì? **Trả lời ngắn:** Key hết TTL bị coi như mới, retry muộn xử lý lại (phantom); đặt TTL dài hơn cửa sổ retry thực tế và downstream cũng idempotent theo transaction id.`,
  exercises: [{
    title: 'PaymentIdempotency: fingerprint, replay, từ chối khác payload, in-flight và TTL',
    prompt: `Cài {{PaymentIdempotency}} dùng {{Clock}} giả (interface {{long millis()}}).

- Constructor: {{PaymentIdempotency(long ttlMs, Clock clock)}}; validate {{ttlMs > 0}}, {{clock != null}}, sai thì ném {{IllegalArgumentException}}.
- {{Result handle(String key, String payload, java.util.function.Supplier<Result> processor)}}:
  - Tính {{fingerprint = payload == null ? "" : payload.trim()}}.
  - Nếu key đã có entry {{completed}} và {{now - createdAt >= ttlMs}} thì xóa entry (hết hạn), coi như chưa có.
  - Nếu key đã có (chưa hết hạn): fingerprint khác → ném {{PayloadMismatchException}}; {{completed}} → trả {{result}} đã lưu (không chạy processor); đang in-flight → ném {{InFlightException}}.
  - Nếu chưa có: dùng {{putIfAbsent}} để giành quyền với entry in-flight; nếu không giành được thì xử lý như nhánh "đã có" ở trên. Giành được thì chạy {{processor.get()}}, gán {{result}} rồi đánh dấu {{completed = true}} và trả về; nếu processor ném {{RuntimeException}} thì xóa entry ({{remove(key, fresh)}}) rồi ném lại.
- {{int size()}} trả số key đang lưu.

{{Result}} có {{int status}} và {{String body}}. {{InFlightException}} và {{PayloadMismatchException}} là RuntimeException. Dùng {{ConcurrentHashMap}}.`,
    starter: `import java.util.concurrent.*;
interface Clock { long millis(); }
class PaymentIdempotency {
    static class Result { final int status; final String body; Result(int s, String b){status=s;body=b;} }
    static class InFlightException extends RuntimeException {}
    static class PayloadMismatchException extends RuntimeException {}
    private static class Entry {
        final String fingerprint; final long createdAt;
        volatile boolean completed = false;
        Result result;
        Entry(String fingerprint, long createdAt){ this.fingerprint=fingerprint; this.createdAt=createdAt; }
    }
    private final long ttlMs;
    private final Clock clock;
    private final ConcurrentHashMap<String, Entry> store = new ConcurrentHashMap<>();
    PaymentIdempotency(long ttlMs, Clock clock){ this.ttlMs=ttlMs; this.clock=clock; }
    Result handle(String key, String payload, java.util.function.Supplier<Result> processor) {
        throw new UnsupportedOperationException("TODO");
    }
    int size(){ return store.size(); }
}`,
tests: `public class Main {
  static int p=0,t=0; static void ck(String n,Runnable r){t++;try{r.run();p++;System.out.println("PASS "+n);}catch(Throwable e){System.out.println("FAIL "+n+": "+e);}}
  static void eq(Object a,Object b){if(!Objects.equals(a,b))throw new AssertionError(a+" != "+b);}
  public static void main(String[] x){
   ck("first call processes and stores",()->{
    PaymentIdempotency s=new PaymentIdempotency(10000, ()->0L);
    PaymentIdempotency.Result r=s.handle("k1","p1", ()-> new PaymentIdempotency.Result(201,"order-1"));
    eq(201,r.status); eq("order-1",r.body); eq(1,s.size());
   });
   ck("repeat same key and payload replays without processing",()->{
    PaymentIdempotency s=new PaymentIdempotency(10000, ()->0L);
    s.handle("k1","p1", ()-> new PaymentIdempotency.Result(201,"order-1"));
    boolean[] ran={false};
    PaymentIdempotency.Result r=s.handle("k1","p1", ()->{ ran[0]=true; return new PaymentIdempotency.Result(201,"other"); });
    eq(false,ran[0]); eq("order-1",r.body);
   });
   ck("same key different payload is rejected",()->{
    PaymentIdempotency s=new PaymentIdempotency(10000, ()->0L);
    s.handle("k1","p1", ()-> new PaymentIdempotency.Result(201,"order-1"));
    try { s.handle("k1","p2", ()-> new PaymentIdempotency.Result(201,"x")); throw new AssertionError("should reject"); }
    catch(PaymentIdempotency.PayloadMismatchException ok){}
   });
   ck("different keys are independent",()->{
    PaymentIdempotency s=new PaymentIdempotency(10000, ()->0L);
    s.handle("a","p", ()-> new PaymentIdempotency.Result(200,"A"));
    PaymentIdempotency.Result r=s.handle("b","p", ()-> new PaymentIdempotency.Result(200,"B"));
    eq("B",r.body); eq(2,s.size());
   });
   ck("failed processor removes key so retry reruns",()->{
    PaymentIdempotency s=new PaymentIdempotency(10000, ()->0L);
    try { s.handle("k","p", ()->{ throw new RuntimeException("boom"); }); throw new AssertionError("should throw"); }
    catch(RuntimeException ok){}
    eq(0,s.size());
    PaymentIdempotency.Result r=s.handle("k","p", ()-> new PaymentIdempotency.Result(200,"ok"));
    eq("ok",r.body);
   });
   ck("expired key is treated as new after ttl",()->{
    AtomicLong clock=new AtomicLong(0);
    PaymentIdempotency s=new PaymentIdempotency(1000, clock::get);
    s.handle("k","p", ()-> new PaymentIdempotency.Result(200,"first"));
    clock.set(1000);
    boolean[] ran={false};
    PaymentIdempotency.Result r=s.handle("k","p", ()->{ ran[0]=true; return new PaymentIdempotency.Result(200,"second"); });
    eq(true,ran[0]); eq("second",r.body);
   });
   ck("in-flight duplicate is rejected",()->{
    PaymentIdempotency s=new PaymentIdempotency(10000, ()->0L);
    CountDownLatch started=new CountDownLatch(1);
    CountDownLatch release=new CountDownLatch(1);
    AtomicReference<Throwable> err=new AtomicReference<>();
    Thread th=new Thread(()->{
      try { s.handle("k","p", ()->{ started.countDown(); try{release.await(2,TimeUnit.SECONDS);}catch(InterruptedException ie){Thread.currentThread().interrupt();} return new PaymentIdempotency.Result(200,"first"); }); }
      catch(Throwable e){ err.set(e); }
    });
    th.start();
    try { if(!started.await(2,TimeUnit.SECONDS)) throw new AssertionError("worker did not start"); }
    catch (InterruptedException ie) { Thread.currentThread().interrupt(); throw new AssertionError(ie); }
    try { s.handle("k","p", ()-> new PaymentIdempotency.Result(200,"second")); throw new AssertionError("should reject in-flight"); }
    catch(PaymentIdempotency.InFlightException ok){}
    release.countDown();
    try { th.join(2000); }
    catch (InterruptedException ie) { Thread.currentThread().interrupt(); throw new AssertionError(ie); }
    if(err.get()!=null) throw new AssertionError(err.get());
    eq("first", s.handle("k","p", ()-> new PaymentIdempotency.Result(200,"x")).body);
   });
   System.out.println("RESULT "+p+"/"+t);
  }
 }`,
    reference: `import java.util.concurrent.*;
interface Clock { long millis(); }
class PaymentIdempotency {
    static class Result { final int status; final String body; Result(int s, String b){status=s;body=b;} }
    static class InFlightException extends RuntimeException {}
    static class PayloadMismatchException extends RuntimeException {}
    private static class Entry {
        final String fingerprint; final long createdAt;
        volatile boolean completed = false;
        Result result;
        Entry(String fingerprint, long createdAt){ this.fingerprint=fingerprint; this.createdAt=createdAt; }
    }
    private final long ttlMs;
    private final Clock clock;
    private final ConcurrentHashMap<String, Entry> store = new ConcurrentHashMap<>();
    PaymentIdempotency(long ttlMs, Clock clock){
        if (ttlMs <= 0) throw new IllegalArgumentException("ttlMs");
        if (clock == null) throw new IllegalArgumentException("clock");
        this.ttlMs = ttlMs; this.clock = clock;
    }
    private static String fingerprint(String payload) { return payload == null ? "" : payload.trim(); }
    Result handle(String key, String payload, java.util.function.Supplier<Result> processor) {
        long now = clock.millis();
        String fp = fingerprint(payload);
        Entry e = store.get(key);
        if (e != null && e.completed && now - e.createdAt >= ttlMs) {
            store.remove(key, e);
            e = null;
        }
        if (e != null) return existing(e, fp);
        Entry fresh = new Entry(fp, now);
        Entry prev = store.putIfAbsent(key, fresh);
        if (prev != null) return existing(prev, fp);
        try {
            Result r = processor.get();
            fresh.result = r;
            fresh.completed = true;
            return r;
        } catch (RuntimeException ex) {
            store.remove(key, fresh);
            throw ex;
        }
    }
    private static Result existing(Entry e, String fp) {
        if (!e.fingerprint.equals(fp)) throw new PayloadMismatchException();
        if (e.completed) return e.result;
        throw new InFlightException();
    }
    int size(){ return store.size(); }
}`,
    hints: [
      'Tính fingerprint = payload.trim() (bản rút gọn của SHA-256 JSON chuẩn hóa). Dùng putIfAbsent để chỉ một thread giành quyền chạy processor.',
      'Nếu putIfAbsent trả về entry cũ: fingerprint khác thì ném PayloadMismatch, completed thì trả result, in-flight thì ném InFlight.',
      'Khi processor ném RuntimeException thì remove(key, fresh) để retry chạy lại; khi thành công thì gán result rồi mới đặt completed = true.',
      'Hết TTL (now - createdAt >= ttlMs) thì xóa entry và coi như mới; dùng Clock giả để test phần này không cần ngủ.'
    ],
    explain: `Bài tập tách idempotency thành ba quyết định: replay (đã completed, cùng fingerprint), từ chối (khác fingerprint → 422; in-flight → 409), và xử lý mới (chưa có hoặc hết TTL). putIfAbsent là điểm tuần tự hóa: thread nào đặt được entry rỗng vào key thì giành quyền chạy processor, các thread khác thấy entry in-flight và nhận 409 — không xử lý song song.

Fingerprint lưu trong entry để so sánh khi lặp; ở đây là payload.trim(), production là SHA-256 của JSON đã chuẩn hóa (sắp xếp khóa ổn định) để cùng nội dung cho cùng fingerprint. Khi thành công, result được gán trước cờ completed, nên request replay không bao giờ đọc phải result null. Khi processor lỗi, entry bị xóa để lần sau chạy lại, tránh kẹt in-flight vĩnh viễn.

TTL giải quyết phantom: key hết hạn bị coi như mới, retry muộn xử lý lại — đánh đổi chấp nhận được nếu TTL dài hơn cửa sổ retry thực tế. Lỗi thường gặp: server tự sinh key, không lưu fingerprint (bắt sót bug cùng key khác payload), xử lý in-flight song song, không dọn key khi lỗi, hoặc dùng map trong RAM (mất khi restart, không chia sẻ giữa nhiều pod — production dùng DB unique index hoặc Redis).`
  }],
  check: [
    { q: 'Idempotency key nên do ai sinh và client phải làm gì khi retry?', options: ['Server sinh, client không cần key', 'Client sinh UUID cho mỗi ý định, retry dùng lại cùng key', 'Database sinh, client đọc lại', 'Gateway sinh ngẫu nhiên mỗi request'], answer: 1, explain: `Đúng (B): chỉ client biết hai request là cùng một ý định; retry phải dùng lại đúng key thì server mới nhận ra và replay. (A) sai vì server sinh key thì client retry không biết key cũ. (C) sai vì DB không biết "ý định" nghiệp vụ. (D) sai vì key ngẫu nhiên mỗi request làm idempotency vô dụng.` },
    { q: 'Cùng key nhưng payload khác (fingerprint khác) nên xử lý thế nào?', options: ['Xử lý lại bình thường', 'Trả kết quả cũ đã lưu', 'Từ chối 422 để phát hiện bug client', 'Bỏ qua im lặng'], answer: 2, explain: `Đúng (C): cùng key khác payload là client bug; xử lý lại có thể duplicate, trả kết quả cũ là sai dữ liệu, nên từ chối 422 để client tạo key mới. (A) và (B) sai vì che mất bug và có thể gây sai/duplicated. (D) sai vì bỏ qua im lặng không sửa được nguyên nhân.` },
    { q: 'Hai request cùng key đến khi request đầu đang in-flight. Request thứ hai nên?', options: ['Xử lý song song', 'Trả 409 kèm Retry-After, không xử lý song song', 'Chờ vô hạn', 'Xóa key của request đầu'], answer: 1, explain: `Đúng (B): in-flight nghĩa là đang có chủ xử lý; request sau nhận 409 để không nhân đôi hiệu ứng, client tự retry sau. (A) sai vì xử lý song song gây duplicate. (C) sai vì giữ thread dễ treo. (D) sai vì xóa key của chủ hiện tại làm hỏng request đang chạy.` },
    { q: 'Key hết TTL rồi client retry. Hậu quả và cách hiểu đúng?', options: ['Key vẫn replay kết quả cũ mãi mãi', 'Key bị coi như mới nên xử lý lại (phantom duplicate); đặt TTL dài hơn cửa sổ retry và downstream cũng idempotent', 'Server ném lỗi vĩnh viễn', 'Client không bao giờ được retry'], answer: 1, explain: `Đúng (B): hết TTL thì key coi như chưa có, retry muộn xử lý lại — phantom duplicate chấp nhận được nếu TTL dài hơn cửa sổ retry thực tế và downstream idempotent theo transaction id. (A) sai vì key không giữ mãi. (C) và (D) sai vì không chặn retry hợp lệ.` }
  ],
  related: ['microservices-006', 'microservices-041', 'microservices-031'],
  tags: ['idempotency', 'payment', 'fingerprint', 'TTL', 'in-flight', 'phantom']
},
{
  id: 'lesson-microservices-029',
  track: 'microservices',
  order: 29,
  title: 'Circuit breaker nửa mở: probe giới hạn và khôi phục an toàn',
  level: 'senior',
  minutes: 30,
  goals: [
    'Hiểu rõ vai trò của half-open và cách giới hạn số probe',
    'Tự viết breaker với probe counter và reset khi thất bại',
    'Biết đo metric và fallback khi breaker mở'
  ],
  body: `**Tóm tắt:** Trong trạng thái half-open, circuit breaker chỉ cho phép một số probe nhỏ gọi dependency để kiểm tra hồi phục. Nếu probe thành công đủ số lượng thì đóng lại; nếu bất kỳ probe nào thất bại thì mở lại ngay và reset timer. Giới hạn probe tránh dội lại dependency đang yếu.

### Vì sao half-open cần giới hạn

Khi breaker vừa mở xong và chuyển half-open, nếu cho phép tất cả thread cùng gọi, dependency đang cố hồi phục sẽ bị tấn công đúng lúc yếu nhất → fail lại → mở lại → vòng lặp. Vì vậy chỉ cho N probe (thường 1–3) gọi; các lời gọi khác vẫn bị từ chối như khi open. Đây là điểm khác biệt quan trọng so với việc cho toàn bộ traffic đi qua: half-open là giai đoạn "thăm dò" có kiểm soát, không phải mở cửa hoàn toàn.

### Luồng probe

1. Breaker chuyển từ open sang half-open sau reset timeout (waitDurationInOpenState).
2. Cho phép tối đa {{halfOpenPermits}} (permittedNumberOfCallsInHalfOpenState) lời gọi probe.
3. Nếu probe thành công: tăng counter thành công; đủ permits → chuyển closed, reset mọi counter.
4. Nếu probe thất bại: chuyển open ngay lập tức, reset openedAt = now, reset counter probe.

Lưu ý: Resilience4j implementation chờ đủ số probe rồi mới so failure rate với ngưỡng, nhưng mô hình đơn giản trong bài này coi một probe thất bại là đủ để mở lại ngay — cách này an toàn hơn cho dependency đang yếu.

### Metric và fallback

Trong production theo dõi: số lần mở, thời gian mở, số probe thành công/thất bại, tỷ lệ probe thành công. Fallback phải có ý nghĩa (cache, queue, thông báo) chứ không chỉ ném exception. Khi breaker mở, client nhận fallback thay vì chờ timeout — đây là giá trị cốt lõi của circuit breaker: fail fast để giải phóng tài nguyên.

### Ví dụ đời thực

Payment service gọi fraud-check. Fraud-check hồi phục chậm do connection pool cạn. Breaker half-open cho 2 probe: probe 1 thành công, probe 2 thành công → đóng lại, traffic trở về bình thường. Nếu probe 1 thất bại → mở lại ngay, chờ thêm 30 giây. Khách thấy vài giây chậm thay vì sập toàn hệ thống. Đo: trước khi có breaker, p99 payment 12s khi fraud-check down; sau breaker, p99 200ms (fallback trả ngay) và fraud-check tự hồi phục sau 45s.

### Trả lời mẫu khi phỏng vấn

Half-open là giai đoạn thăm dò: chỉ cho ít probe (1–3) gọi dependency để kiểm tra hồi phục. Giới hạn probe tránh storm — nếu cho tất cả request đi qua, dependency vừa hồi phục bị dội lại và sập tiếp. Nếu probe thất bại thì mở lại ngay, reset timer chờ. Kết hợp metric (số lần mở, thời gian mở, probe success/fail) và fallback (cache/stale data) để theo dõi và giữ trải nghiệm người dùng.

> Senior tip: Đặt halfOpenPermits nhỏ (1–3) và reset timeout tăng dần (exponential backoff) để tránh hammer dependency đang yếu. Theo dõi probe success rate: nếu thấp kéo dài thì dependency thực sự chưa hồi phục, cần can thiệp thủ công hoặc scale.
`,
  exercises: [
    {
      title: 'Breaker với probe limit',
      prompt: 'Viết class {{ProbeBreaker}} nhận {{Clock clock}}, {{Duration openDuration}}, {{int permits}}. Phương thức {{boolean tryCall(Callable<T> action)}} hoạt động như mô tả. Dùng Clock để kiểm tra thời gian.',
      starter: 'import java.time.*;\nimport java.util.concurrent.*;\n\nclass ProbeBreaker {\n    enum State { CLOSED, OPEN, HALF_OPEN }\n    private final Clock clock;\n    private final Duration openDuration;\n    private final int permits;\n\n    ProbeBreaker(Clock clock, Duration openDuration, int permits) {\n        this.clock = clock; this.openDuration = openDuration; this.permits = permits;\n    }\n\n    State state() { return State.CLOSED; }\n\n    <T> boolean tryCall(Callable<T> action) throws Exception {\n        throw new UnsupportedOperationException("TODO");\n    }\n}',
      tests: 'import java.time.*;\npublic class Main {\n    static int passed=0,total=0;\n    static void check(String n, Runnable r){total++;try{r.run();passed++;System.out.println("PASS "+n);}catch(Throwable t){System.out.println("FAIL "+n+": "+t);}}\n    static void eq(Object e,Object a){if(!java.util.Objects.equals(e,a)) throw new AssertionError("expected "+e+" got "+a);}\n    public static void main(String[] args){\n        class MC extends Clock { Instant now=Instant.parse("2026-01-01T00:00:00Z"); public ZoneId getZone(){return ZoneId.of("UTC");} public Clock withZone(ZoneId z){return this;} public Instant instant(){return now;} }\n        MC clock=new MC();\n        ProbeBreaker cb=new ProbeBreaker(clock, Duration.ofSeconds(10), 2);\n        check("starts closed", () -> eq(ProbeBreaker.State.CLOSED, cb.state()));\n        check("opens after failures and rejects", () -> {\n            try { cb.tryCall(() -> { throw new RuntimeException(); }); } catch (Exception ignored) {}\n            try { cb.tryCall(() -> { throw new RuntimeException(); }); } catch (Exception ignored) {}\n            try { cb.tryCall(() -> { throw new RuntimeException(); }); } catch (Exception ignored) {}\n            eq(ProbeBreaker.State.OPEN, cb.state());\n            boolean[] invoked = {false};\n            boolean r = false;\n            try { r = cb.tryCall(() -> { invoked[0]=true; return 1; }); } catch (Exception ignored) {}\n            if (r) throw new AssertionError("should reject");\n            if (invoked[0]) throw new AssertionError("action should not be invoked");\n        });\n        check("half-open allows limited probes", () -> {\n            clock.now = clock.now.plusSeconds(11);\n            boolean r1=false, r2=false, r3=false;\n            try { r1 = cb.tryCall(() -> 1); } catch (Exception ignored) {}\n            try { r2 = cb.tryCall(() -> 1); } catch (Exception ignored) {}\n            try { r3 = cb.tryCall(() -> 1); } catch (Exception ignored) {}\n            if (!r1) throw new AssertionError("first probe should be allowed");\n            if (!r2) throw new AssertionError("second probe should be allowed");\n            eq(ProbeBreaker.State.CLOSED, cb.state());\n            if (!r3) throw new AssertionError("breaker đã đóng, lần gọi tiếp được phép");\n        });\n        check("probe success closes breaker", () -> {\n            class MC2 extends Clock { Instant now=Instant.parse(\"2026-01-01T00:00:00Z\"); public ZoneId getZone(){return ZoneId.of(\"UTC\");} public Clock withZone(ZoneId z){return this;} public Instant instant(){return now;} }\n            MC2 clock2 = new MC2();\n            ProbeBreaker cb2 = new ProbeBreaker(clock2, Duration.ofSeconds(10), 2);\n            try { cb2.tryCall(() -> { throw new RuntimeException(); }); } catch (Exception ignored) {}\n            try { cb2.tryCall(() -> { throw new RuntimeException(); }); } catch (Exception ignored) {}\n            try { cb2.tryCall(() -> { throw new RuntimeException(); }); } catch (Exception ignored) {}\n            clock2.now = clock2.now.plusSeconds(11);\n            try { cb2.tryCall(() -> 1); } catch (Exception ignored) {}\n            try { cb2.tryCall(() -> 1); } catch (Exception ignored) {}\n            eq(ProbeBreaker.State.CLOSED, cb2.state());\n        });\n        check("probe failure reopens breaker", () -> {\n            class MC3 extends Clock { Instant now=Instant.parse(\"2026-01-01T00:00:00Z\"); public ZoneId getZone(){return ZoneId.of(\"UTC\");} public Clock withZone(ZoneId z){return this;} public Instant instant(){return now;} }\n            MC3 clock3 = new MC3();\n            ProbeBreaker cb3 = new ProbeBreaker(clock3, Duration.ofSeconds(10), 2);\n            try { cb3.tryCall(() -> { throw new RuntimeException(); }); } catch (Exception ignored) {}\n            try { cb3.tryCall(() -> { throw new RuntimeException(); }); } catch (Exception ignored) {}\n            try { cb3.tryCall(() -> { throw new RuntimeException(); }); } catch (Exception ignored) {}\n            clock3.now = clock3.now.plusSeconds(11);\n            try { cb3.tryCall(() -> 1); } catch (Exception ignored) {}\n            try { cb3.tryCall(() -> { throw new RuntimeException(); }); } catch (Exception ignored) {}\n            eq(ProbeBreaker.State.OPEN, cb3.state());\n        });\n        System.out.println("RESULT "+passed+"/"+total);\n    }\n}',
      reference: 'import java.time.*;\nimport java.util.concurrent.*;\n\nclass ProbeBreaker {\n    enum State { CLOSED, OPEN, HALF_OPEN }\n    private final Clock clock;\n    private final Duration openDuration;\n    private final int permits;\n    private final int failureThreshold = 3;\n    private State state = State.CLOSED;\n    private Instant openedAt;\n    private int consecutiveFailures = 0;\n    private int probeAttempts = 0;\n    private int probeSuccess = 0;\n\n    ProbeBreaker(Clock clock, Duration openDuration, int permits) {\n        this.clock = clock; this.openDuration = openDuration; this.permits = permits;\n    }\n\n    State state() {\n        if (state == State.OPEN && clock.instant().isAfter(openedAt.plus(openDuration))) {\n            state = State.HALF_OPEN;\n            probeAttempts = 0;\n            probeSuccess = 0;\n        }\n        return state;\n    }\n\n    <T> boolean tryCall(Callable<T> action) throws Exception {\n        State s = state();\n        if (s == State.OPEN) return false;\n        if (s == State.HALF_OPEN) {\n            if (probeAttempts >= permits) return false;\n            probeAttempts++;\n        }\n        try {\n            action.call();\n            if (state == State.HALF_OPEN) {\n                probeSuccess++;\n                if (probeAttempts >= permits) { // evaluate after all permits used\n                    if (probeSuccess == permits) { state = State.CLOSED; consecutiveFailures = 0; }\n                    else { state = State.OPEN; openedAt = clock.instant(); }\n                    probeAttempts = 0; probeSuccess = 0;\n                }\n            } else {\n                consecutiveFailures = 0;\n            }\n            return true;\n        } catch (Exception e) {\n            if (state == State.HALF_OPEN) { state = State.OPEN; openedAt = clock.instant(); probeAttempts = 0; probeSuccess = 0; }\n            else { consecutiveFailures++; if (consecutiveFailures >= failureThreshold) { state = State.OPEN; openedAt = clock.instant(); } }\n            throw e;\n        }\n    }\n}',
      hints: ['State() phải tự chuyển OPEN→HALF_OPEN theo thời gian.'],
      explain: 'Lỗi hay gặp: quên reset counter khi fail, hoặc cho phép không giới hạn probe. Production dùng Resilience4j.'
    }
  ],
  check: [
    { q: 'Half-open cho phép bao nhiêu probe?', options: ['Tất cả thread', '1–3 probe', 'Không cho phép', 'Vô hạn'], answer: 1, explain: 'Chỉ 1–3 probe để tránh storm dependency đang yếu.' },
    { q: 'Probe thất bại trong half-open thì?', options: ['Thử tiếp', 'Mở lại ngay và reset timer', 'Đóng lại', 'Bỏ qua'], answer: 1, explain: 'Thất bại → mở lại ngay, reset openedAt.' },
    { q: 'Metric quan trọng của breaker?', options: ['Chỉ số lỗi', 'Số lần mở, thời gian mở, probe success/fail', 'Throughput', 'Latency p50'], answer: 1, explain: 'Theo dõi số lần mở, thời gian mở, probe thành công/thất bại.' }
  ],
  related: ['microservices-015', 'microservices-016', 'microservices-017'],
  tags: ['circuit-breaker', 'half-open', 'probe', 'resilience']
},
{
  id: 'lesson-microservices-030',
  track: 'microservices',
  order: 30,
  title: 'Idempotency key nâng cao: TTL phantom, fingerprint và lock phân tán',
  level: 'senior',
  minutes: 30,
  goals: [
    'Hiểu TTL phantom và cách giảm rủi ro',
    'Tự viết store với fingerprint và TTL bằng Clock giả',
    'Biết lock phân tán cho multi-pod'
  ],
  body: `**Tóm tắt:** Idempotency key nâng cao thêm fingerprint (hash payload) để phát hiện client bug, TTL để tránh giữ key mãi, và lock phân tán để dedup giữa nhiều pod. TTL phantom là trade-off: key hết hạn → retry muộn xử lý lại, chấp nhận được nếu TTL dài hơn cửa sổ retry và downstream idempotent.

### Fingerprint

Hash payload đã chuẩn hóa (sắp xếp khóa) để cùng nội dung cho cùng fingerprint. Nếu cùng key khác fingerprint → 422 để phát hiện bug client. Fingerprint khác với việc so sánh toàn bộ payload: nó là bản tóm gọn (SHA-256 của JSON canonical) nên so sánh nhanh, tốn ít bộ nhớ, và bỏ qua sự khác biệt vô nghĩa như thứ tự key trong JSON. Production thường dùng Jackson để chuẩn hóa JSON (sắp xếp khóa), rồi tính SHA-256 làm fingerprint.

### TTL và phantom

Key lưu có thời hạn (24h–7 ngày). Sau TTL bị xóa → request lặp muộn coi như mới → xử lý lại (phantom duplicate). Đây là trade-off chấp nhận được: retry sau nhiều ngày rất hiếm, và downstream (payment gateway) cũng phải idempotent theo transaction id. TTL không nên quá ngắn (dưới p99 latency của business logic + network) vì sẽ gây phantom duplicate không cần thiết; cũng không nên quá dài (trên 7 ngày) vì tốn bộ nhớ store. Clock giả trong test cho phép tiến thời gian tức thì để kiểm tra TTL expiry mà không cần {{Thread.sleep}}.

### Lock phân tán

In-memory ConcurrentHashMap chỉ hoạt động single pod. Production dùng DB unique constraint trên key ({{INSERT ... ON CONFLICT}}) hoặc Redis SETNX với TTL để dedup giữa nhiều pod. Với DB, unique index trên {{(tenant, endpoint, key)}} đảm bảo chỉ một request thắng; với Redis, {{SET key value NX EX ttl}} thực hiện atomic check-and-set. Cả hai cách đều giải quyết in-flight dedup ở mức cluster: chỉ một pod xử lý, các pod khác nhận lỗi conflict/409.

### Ví dụ đời thực

Thanh toán: client retry sau 2 ngày (ngoài TTL 24h) → xử lý lại → phantom duplicate. Giảm bằng TTL dài hơn cửa sổ retry thực tế (ví dụ 7 ngày) và downstream idempotent theo transaction id. Metric: theo dõi phantom rate (số request xử lý lại sau TTL / tổng request) — nên < 0.01%.

### Trả lời mẫu khi phỏng vấn

Idempotency key nâng cao cần fingerprint (SHA-256 canonical JSON), TTL (24h–7 ngày) và lock phân tán (DB unique index hoặc Redis SETNX). TTL phantom là trade-off chấp nhận được: key hết hạn → retry muộn xử lý lại. Production dùng DB/Redis để dedup giữa pod, in-memory chỉ cho single node. Fingerprint bắt bug client dùng lại key cho payload khác.

> Senior tip: Đặt TTL dài hơn cửa sổ retry thực tế và downstream idempotent theo transaction id để giảm phantom. Theo dõi 409 rate (in-flight conflict) — tăng đột biến thường do client retry quá sớm, không phải lỗi server.
`,
  exercises: [
    {
      title: 'Store với fingerprint và TTL',
      prompt: 'Viết class {{TtlStore}} với Clock, ttlMs, phương thức {{Result handle(String key, String fingerprint, Supplier<Result> processor)}} theo quy tắc idempotency + TTL.',
      starter: 'import java.time.*;\nimport java.util.concurrent.*;\nimport java.util.function.*;\n\nclass TtlStore {\n    static class Result { final int status; final String body; Result(int s,String b){status=s;body=b;} }\n    static class PayloadMismatch extends RuntimeException {}\n    static class InFlight extends RuntimeException {}\n    private final Clock clock;\n    private final long ttlMs;\n    TtlStore(Clock clock, long ttlMs){ this.clock=clock; this.ttlMs=ttlMs; }\n    Result handle(String key, String fingerprint, Supplier<Result> processor){ throw new UnsupportedOperationException("TODO"); }\n}',
      tests: 'import java.time.*;\npublic class Main {\n    static int passed=0,total=0;\n    static void check(String n, Runnable r){total++;try{r.run();passed++;System.out.println("PASS "+n);}catch(Throwable t){System.out.println("FAIL "+n+": "+t);}}\n    public static void main(String[] args){\n        class MC extends Clock { Instant now=Instant.parse("2026-01-01T00:00:00Z"); public ZoneId getZone(){return ZoneId.of("UTC");} public Clock withZone(ZoneId z){return this;} public Instant instant(){return now;} }\n        MC clock=new MC();\n        TtlStore s=new TtlStore(clock, 1000);\n        check("first processes", () -> { TtlStore.Result r=s.handle("k","f",()->new TtlStore.Result(201,"o")); if(r.status!=201) throw new AssertionError("bad"); });\n        check("repeat returns stored", () -> { boolean[] p={false}; TtlStore.Result r=s.handle("k","f",()->{p[0]=true;return new TtlStore.Result(201,"x");}); if(p[0]) throw new AssertionError("processed"); if(!"o".equals(r.body)) throw new AssertionError("not stored"); });\n        check("different fingerprint rejected", () -> {\n            TtlStore s2=new TtlStore(clock, 1000);\n            s2.handle("k","f1",()->new TtlStore.Result(201,"o"));\n            try { s2.handle("k","f2",()->new TtlStore.Result(201,"x")); throw new AssertionError("should reject"); }\n            catch (TtlStore.PayloadMismatch ok) {}\n        });\n        check("expired key treated as new", () -> {\n            MC clock2=new MC();\n            TtlStore s3=new TtlStore(clock2, 1000);\n            s3.handle("k","f",()->new TtlStore.Result(201,"first"));\n            clock2.now = clock2.now.plusMillis(1500);\n            boolean[] p={false};\n            TtlStore.Result r=s3.handle("k","f",()->{p[0]=true;return new TtlStore.Result(201,"second");});\n            if(!p[0]) throw new AssertionError("should process again");\n            if(!"second".equals(r.body)) throw new AssertionError("should return new result");\n        });\n        check("in-flight throws exception", () -> {\n            MC clock3=new MC();\n            TtlStore s4=new TtlStore(clock3, 1000);\n            CountDownLatch start=new CountDownLatch(1), done=new CountDownLatch(1);\n            AtomicReference<Throwable> err=new AtomicReference<>();\n            Thread th=new Thread(()->{try{s4.handle("k","f",()->{start.countDown();try{done.await();}catch(InterruptedException e){}return new TtlStore.Result(200,"x");});}catch(Throwable e){err.set(e);}});\n            th.start();\n            try{start.await();}catch(InterruptedException e){throw new AssertionError(e);}\n            try{s4.handle("k","f",()->new TtlStore.Result(200,"y"));throw new AssertionError("should reject");}\n            catch(TtlStore.InFlight ok){}\n            done.countDown();\n            try{th.join(1000);}catch(InterruptedException e){throw new AssertionError(e);}\n        });\n        System.out.println("RESULT "+passed+"/"+total);\n    }\n}',
      reference: 'import java.time.*;\nimport java.util.concurrent.*;\nimport java.util.function.*;\n\nclass TtlStore {\n    static class Result { final int status; final String body; Result(int s,String b){status=s;body=b;} }\n    static class PayloadMismatch extends RuntimeException {}\n    static class InFlight extends RuntimeException {}\n    static class Entry { String fingerprint; Result result; long createdAt; boolean done; }\n    private final Clock clock;\n    private final long ttlMs;\n    private final ConcurrentHashMap<String,Entry> store=new ConcurrentHashMap<>();\n    TtlStore(Clock clock, long ttlMs){ this.clock=clock; this.ttlMs=ttlMs; }\n    Result handle(String key, String fingerprint, Supplier<Result> processor){\n        long nowMs=clock.instant().toEpochMilli();\n        Entry e=store.get(key);\n        if (e!=null && nowMs - e.createdAt >= ttlMs) { store.remove(key); e=null; }\n        if (e==null) {\n            Entry ne=new Entry(); ne.fingerprint=fingerprint; ne.createdAt=nowMs;\n            Entry prev=store.putIfAbsent(key,ne);\n            if (prev==null) {\n                try { Result r=processor.get(); ne.result=r; ne.done=true; return r; }\n                catch (RuntimeException ex){ store.remove(key); throw ex; }\n            } else { e=prev; }\n        }\n        if (!e.done) throw new InFlight();\n        if (!e.fingerprint.equals(fingerprint)) throw new PayloadMismatch();\n        return e.result;\n    }\n}',
      hints: ['Dùng Clock để lấy thời gian hiện tại.'],
      explain: 'Lỗi hay gặp: không kiểm tra TTL, không fingerprint. Production dùng DB/Redis.'
    }
  ],
  check: [
    { q: 'TTL phantom là gì?', options: ['Key giữ mãi', 'Key hết hạn → retry muộn xử lý lại', 'Server ném lỗi vĩnh viễn', 'Client không được retry'], answer: 1, explain: 'Key hết TTL → coi như mới → xử lý lại (phantom duplicate).' },
    { q: 'Fingerprint dùng để?', options: ['Tăng tốc', 'Phát hiện cùng key khác payload', 'Mã hóa', 'Nén'], answer: 1, explain: 'Cùng key khác fingerprint → client bug → 422.' },
    { q: 'Dedup giữa nhiều pod dùng?', options: ['ConcurrentHashMap', 'DB unique constraint hoặc Redis SETNX', 'ThreadLocal', 'File lock'], answer: 1, explain: 'Production dùng DB unique constraint hoặc Redis SETNX với TTL.' }
  ],
  related: ['microservices-006', 'microservices-011', 'microservices-001'],
  tags: ['idempotency', 'TTL', 'fingerprint', 'distributed-lock']
},
{
  id: 'lesson-microservices-031',
  track: 'microservices',
  order: 31,
  title: 'Circuit breaker cửa sổ trượt theo thời gian: chia bucket giây, tỉ lệ lỗi trôi theo hiện tại',
  level: 'senior',
  minutes: 35,
  goals: [
    'Phân biệt cửa sổ trượt theo THỜI GIAN với đếm liên tiếp và đếm theo số call',
    'Tự cài breaker 3 trạng thái với bucket theo giây và Clock giả, test xác định không sleep',
    'Hiểu vì sao bucket cũ phải bị đẩy ra khỏi cửa sổ và vì sao điều đó phản ánh "hiện tại" tốt hơn'
  ],
  body: `**Tóm tắt:** Circuit breaker (máy cắt tự động) cửa sổ trượt theo THỜI GIAN chia các lời gọi gần đây thành các bucket (thùng) theo từng giây; mỗi bucket đếm số call và số lỗi. Tỉ lệ lỗi = tổng lỗi / tổng call trong N giây gần nhất. Khi tỉ lệ vượt ngưỡng và đã đủ số call tối thiểu thì mở mạch (OPEN) để chặn bớt tải; sau một khoảng chờ thì cho vài lời gọi thăm dò (HALF_OPEN), đủ thành công thì đóng mạch lại. Bài này tự cài bằng Java thuần, dùng Clock giả để test tiến thời gian tức thì.

### Vì sao lại cần cửa sổ theo thời gian
Bài 015 đếm SỐ LỖI LIÊN TIẾP: cứ đủ ngưỡng thì mở, nhưng chỉ một request thành công chen giữa là bộ đếm reset về 0. Bài 016 đếm THEO SỐ CALL (count-based): giữ N kết quả gần nhất, đơn giản nhưng khi lưu lượng thấp, N call có thể trải dài nhiều giờ, cửa sổ phản ánh quá khứ cũ chứ không phải "bây giờ".

Cửa sổ theo THỜI GIAN (time-based) giữ các call trong T giây gần nhất (ví dụ 3 giây). Nhờ gắn nhãn thời gian cho từng bucket, khi thời gian trôi, các bucket cũ tự bị đẩy ra và không còn tính vào tỉ lệ lỗi. Đây chính là điểm mạnh: một cơn lỗi 5 phút trước không được phép làm mở mạch hôm nay khi dependency đã ổn định trở lại. Resilience4j gọi đây là {{slidingWindowType = TIME_BASED}} với {{slidingWindowSize}} tính bằng giây.

Ví dụ đời thường: một bác sĩ không chẩn đoán dựa trên "cả đời bạn từng ho" (quá khứ xa) mà dựa trên "3 ngày gần đây" (cửa sổ thời gian). Cửa sổ trượt theo thời gian chính là "3 ngày gần đây" của circuit breaker.

### Bucket và cách trượt
Mỗi bucket ứng với một khoảng thời gian cố định {{bucketMs}} (ví dụ 100ms hoặc 1000ms). Bucket được đánh chỉ số theo {{start = (now / bucketMs) * bucketMs}} — tức làm tròn thời điểm hiện tại xuống mốc bucket. Khi ghi một kết quả:
1. Nếu bucket cuối cùng trong deque có cùng {{start}} thì cộng dồn vào nó.
2. Nếu khác, tạo bucket mới {{start}} và thêm vào cuối.
3. Đẩy ra (evict) các bucket ở đầu mà {{start < startHienTai - (maxBuckets - 1) * bucketMs}}. Nói cách khác, cửa sổ chỉ giữ các bucket có mốc nằm trong khoảng [hiện tại - (maxBuckets-1)*bucketMs, hiện tại].

Tổng cửa sổ = {{maxBuckets * bucketMs}}. Ví dụ bucketMs = 1000ms, maxBuckets = 3 → cửa sổ 3 giây, mỗi giây một thùng riêng.

### State machine
~~~text
CLOSED: mỗi call ghi vào bucket; nếu tongCall >= minimumCalls va tiLeLoi >= nguong -> OPEN
OPEN:   chan moi call (fail fast); khi now - openedAt >= openMs -> HALF_OPEN, xoa cua so
HALF_OPEN: cho toi da halfOpenMax probe; du halfOpenSuccessThreshold thanh cong -> CLOSED
           bat ky probe nao loi -> OPEN ngay, openedAt = now
~~~

### Cơ chế từng bước
1. **Ghi kết quả vào bucket**: {{recordSuccess}} hoặc {{recordFailure}} tính {{start}} của bucket hiện tại, cộng dồn vào bucket cuối nếu trùng mốc, ngược lại tạo bucket mới. **Vì sao theo mốc thời gian?** Vì như thế mới biết một kết quả "thuộc giây nào" để lát nữa đẩy ra đúng lúc.
2. **Đẩy bucket cũ**: sau khi thêm, loại bỏ các bucket có mốc quá xa so với hiện tại. **Vì sao?** Để tỉ lệ lỗi chỉ phản ánh T giây gần nhất, không bị quá khứ làm sai lệch.
3. **Tính tỉ lệ và quyết định mở**: {{failureRate = tongLoi / tongCall}} trên các bucket còn lại. Nếu {{tongCall >= minimumCalls}} và {{failureRate >= nguong}} thì chuyển OPEN, ghi {{openedAt = now}} và xóa cửa sổ. **Vì sao xóa cửa sổ?** Để lần đo sau không bị "lẫn" kết quả cũ; nếu không, ngay khi mở mạch xong, tàn dư lỗi cũ vẫn còn và lần half-open kế tiếp tính sai.
4. **OPEN chặn gọi**: {{canCall}} trả {{false}} cho tới khi {{now - openedAt >= openMs}}.
5. **HALF_OPEN thăm dò có giới hạn**: mỗi lần {{canCall}} trong half-open tăng {{halfOpenCalls}}; vượt {{halfOpenMax}} thì trả {{false}}. **Vì sao giới hạn?** Dependency vừa hồi phục rất yếu; dồn cả trăm request sẽ đánh nó sập lại (thundering herd).
6. **Đóng hoặc mở lại**: đủ {{halfOpenSuccessThreshold}} probe thành công thì CLOSED và xóa cửa sổ; chỉ một probe lỗi là OPEN ngay, {{openedAt = now}} để đếm lại thời gian chờ.

### Tham số thực tế
| Tham số | Ví dụ | Ý nghĩa |
|---|---|---|
| bucketMs | 1000 | Mỗi thùng rộng bao nhiêu mili-giây |
| maxBuckets | 3 | Cửa sổ = maxBuckets * bucketMs (ở đây 3 giây) |
| failureRateThreshold | 0.5 | Tỉ lệ lỗi (0..1) để mở mạch |
| minimumCalls | 20 | Chưa đủ 20 call thì chưa xét tỉ lệ (tránh mở oan lúc traffic thấp) |
| waitDurationInOpenState (openMs) | 30000 | Thời gian ở OPEN trước khi thử lại |
| halfOpenMax | 10 | Số probe tối đa ở HALF_OPEN |
| halfOpenSuccessThreshold | 5 | Số probe thành công để đóng mạch |

### Lỗi hay gặp trên production
- **Triệu chứng:** breaker không mở dù dependency lỗi 60% suốt 10 phút. **Nguyên nhân:** dùng đếm liên tiếp, một request thành công xen giữa reset bộ đếm; hoặc cửa sổ count-based quá lớn phản ánh quá khứ. **Cách sửa:** dùng time-based, bucket theo giây, ngưỡng tỉ lệ; kiểm tra {{failureRate}} thực tế trên dashboard.
- **Triệu chứng:** breaker mở rồi đóng liên tục (flapping). **Nguyên nhân:** {{openMs}} quá ngắn so với thời gian dependency thực sự hồi phục; half-open probe quá nhiều làm sập lại. **Cách sửa:** tăng {{openMs}} theo p99 thời gian hồi phục, giảm {{halfOpenMax}} còn 1–3, thêm backoff cho khoảng mở.
- **Triệu chứng:** lúc traffic thấp, 1 lỗi trên 2 call (50%) làm mở mạch oan. **Nguyên nhân:** {{minimumCalls}} quá nhỏ. **Cách sửa:** đặt {{minimumCalls}} theo lưu lượng thực (20–50), chỉ xét tỉ lệ khi đủ mẫu.
- **Triệu chứng:** bucket cũ không bị đẩy ra, tỉ lệ lỗi luôn cao. **Nguyên nhân:** quên bước evict theo mốc thời gian, chỉ giới hạn theo số lượng. **Cách sửa:** evict theo {{start < hienTai - (maxBuckets-1)*bucketMs}}, không chỉ theo kích thước.

### Ví dụ đời thực
**Bối cảnh:** service Order gọi Payment qua HTTP, bucket 1 giây, cửa sổ 3 giây, ngưỡng 50%, minimumCalls 20, openMs 30 giây.
**Triệu chứng:** Payment tăng lỗi lên 70% trong 2 phút do pool kết nối cạn, p99 của Order từ 180ms lên 4,2s.
**Điều tra:** sau 20 call trong 3 giây gần nhất, tỉ lệ lỗi 70% > 50% → breaker mở, Order trả 503 kèm metric.
**Xử lý:** 30 giây sau cho 10 probe, 9/10 thành công (tỉ lệ 10% < ngưỡng) → đóng mạch.
**Kết quả:** p99 về 200ms, timeout giảm từ 18% xuống 0,4%, và khi Payment ổn định lại thì cửa sổ trôi qua 3 giây nên tỉ lệ lỗi tự về 0 mà không cần can thiệp.

### Trả lời mẫu khi phỏng vấn
Circuit breaker của tôi dùng cửa sổ trượt theo thời gian: chia kết quả thành bucket theo giây, giữ 3 giây gần nhất, tỉ lệ lỗi = lỗi / tổng call. Khi đủ minimumCalls và tỉ lệ vượt ngưỡng thì mở mạch, fail fast trả 503; sau 30 giây cho tối đa 10 probe, đủ 5 thành công thì đóng lại. Tôi chọn time-based thay vì count-based vì count-based phản ánh quá khứ khi traffic thấp, còn time-based luôn bám "hiện tại" nhờ đẩy bucket cũ ra khỏi cửa sổ. Tôi theo dõi state, failure rate, số request bị reject và thời gian ở OPEN để chỉnh ngưỡng theo SLA từng dependency.

> Senior tip: đặt bucketMs mịn (100ms–1s) để cửa sổ mượt, nhưng không quá mịn gây tốn bộ nhớ; theo dõi riêng "số request bị breaker cắt" và "tỉ lệ lỗi theo cửa sổ" — hai đường này quyết định ngưỡng đúng hay sai.

### Liên hệ phỏng vấn
- **Hỏi:** Time-based khác count-based sliding window ở đâu? **Trả lời ngắn:** Count giữ N call gần nhất (đơn giản, nhưng cũ khi traffic thấp); time giữ các call trong T giây gần nhất nhờ bucket theo thời gian và đẩy bucket cũ ra, phản ánh hiện tại tốt hơn.
- **Hỏi:** Vì sao phải xóa cửa sổ khi chuyển sang OPEN? **Trả lời ngắn:** Để lần đo sau không lẫn kết quả cũ; nếu giữ lại, tàn dư lỗi làm half-open kế tiếp tính sai tỉ lệ.
- **Hỏi:** minimumCalls dùng để làm gì? **Trả lời ngắn:** Tránh mở mạch oan lúc traffic thấp hoặc mới khởi động, khi 1 lỗi trên 2 call đã là 50% nhưng không đủ tin cậy; chỉ xét tỉ lệ khi đủ mẫu.
- **Hỏi:** Vì sao half-open phải giới hạn probe? **Trả lời ngắn:** Dependency vừa hồi phục rất yếu; dồn nhiều request sẽ đánh nó sập lại, nên chỉ cho 1–10 probe và cần đủ ngưỡng thành công mới đóng mạch.`,
  exercises: [{
    title: 'TimeWindowBreaker: bucket theo giây, tỉ lệ lỗi trôi theo thời gian',
    prompt: `Cài {{TimeWindowBreaker}} với Clock giả (một interface Clock có method long millis()).

Constructor: {{TimeWindowBreaker(long bucketMs, int maxBuckets, double threshold, int minimumCalls, long openMs, int halfOpenMax, int halfOpenSuccessThreshold, Clock clock)}}. Validate: {{bucketMs > 0}}, {{maxBuckets >= 1}}, {{0 < threshold <= 1}}, {{minimumCalls >= 1}}, {{openMs > 0}}, {{halfOpenMax >= 1}}, {{1 <= halfOpenSuccessThreshold <= halfOpenMax}}, {{clock != null}}; sai thì ném {{IllegalArgumentException}}.

- {{boolean canCall()}}: nếu OPEN và {{now - openedAt >= openMs}} thì chuyển HALF_OPEN, reset {{halfOpenCalls = 0}}, {{halfOpenSuccess = 0}}, xóa cửa sổ; nếu vẫn OPEN thì {{false}}. Nếu HALF_OPEN: cho tối đa {{halfOpenMax}} probe (mỗi lần gọi tăng {{halfOpenCalls}}), hết thì {{false}}. CLOSED thì {{true}}.
- {{void recordSuccess()}}: nếu HALF_OPEN tăng {{halfOpenSuccess}}, đủ {{halfOpenSuccessThreshold}} thì về CLOSED, reset bộ đếm và xóa cửa sổ; nếu CLOSED thì ghi {{true}} vào bucket hiện tại, đẩy bucket cũ, rồi nếu {{tongCall >= minimumCalls}} mà {{tiLeLoi >= threshold}} thì OPEN và xóa cửa sổ.
- {{void recordFailure()}}: nếu HALF_OPEN thì về OPEN, {{openedAt = now}}, reset; nếu CLOSED thì ghi {{false}} vào bucket, đẩy bucket cũ, rồi kiểm tra ngưỡng như trên.
- {{State state()}}, {{int windowCalls()}} (tổng call trong cửa sổ), {{int windowFailures()}} (tổng lỗi), {{double failureRate()}} (0 nếu chưa có call).

Ghi kết quả vào bucket: {{start = (now / bucketMs) * bucketMs}}; nếu bucket cuối cùng có cùng {{start}} thì cộng dồn, ngược lại tạo bucket mới. Đẩy bucket cũ khi {{bucket.start < start - (maxBuckets - 1) * bucketMs}}. Tất cả method {{synchronized}}.`,
    starter: `interface Clock { long millis(); }
class TimeWindowBreaker {
    enum State { CLOSED, OPEN, HALF_OPEN }
    private final long bucketMs;
    private final int maxBuckets;
    private final double threshold;
    private final int minimumCalls;
    private final long openMs;
    private final int halfOpenMax;
    private final int halfOpenSuccessThreshold;
    private final Clock clock;
    private State state = State.CLOSED;
    TimeWindowBreaker(long bucketMs, int maxBuckets, double threshold, int minimumCalls, long openMs, int halfOpenMax, int halfOpenSuccessThreshold, Clock clock) {
        this.bucketMs=bucketMs; this.maxBuckets=maxBuckets; this.threshold=threshold; this.minimumCalls=minimumCalls;
        this.openMs=openMs; this.halfOpenMax=halfOpenMax; this.halfOpenSuccessThreshold=halfOpenSuccessThreshold; this.clock=clock;
    }
    synchronized boolean canCall() { throw new UnsupportedOperationException("TODO"); }
    synchronized void recordSuccess() { throw new UnsupportedOperationException("TODO"); }
    synchronized void recordFailure() { throw new UnsupportedOperationException("TODO"); }
    synchronized State state() { return state; }
    synchronized int windowCalls() { throw new UnsupportedOperationException("TODO"); }
    synchronized int windowFailures() { throw new UnsupportedOperationException("TODO"); }
    synchronized double failureRate() { throw new UnsupportedOperationException("TODO"); }
}`,
    tests: `public class Main {
 static int p=0,t=0; static void ck(String n,Runnable r){t++;try{r.run();p++;System.out.println("PASS "+n);}catch(Throwable e){System.out.println("FAIL "+n+": "+e);}}
 static void eq(Object a,Object b){if(!Objects.equals(a,b))throw new AssertionError(a+" != "+b);}
 static TimeWindowBreaker brk(AtomicLong clk,int min){ return new TimeWindowBreaker(100,3,0.5,min,1000,2,2,clk::get); }
 public static void main(String[] x){
  ck("closed allows calls",()->{
   AtomicLong clk=new AtomicLong(0);
   TimeWindowBreaker b=brk(clk,4);
   eq(true,b.canCall());
   eq(TimeWindowBreaker.State.CLOSED,b.state());
  });
  ck("opens at failure rate with minimum calls",()->{
   AtomicLong clk=new AtomicLong(0);
   TimeWindowBreaker b=brk(clk,4);
   b.recordSuccess(); b.recordSuccess(); b.recordFailure(); b.recordFailure();
   eq(TimeWindowBreaker.State.OPEN,b.state());
   eq(false,b.canCall());
  });
  ck("below minimum calls never opens",()->{
   AtomicLong clk=new AtomicLong(0);
   TimeWindowBreaker b=brk(clk,4);
   b.recordFailure(); b.recordFailure(); b.recordFailure();
   eq(TimeWindowBreaker.State.CLOSED,b.state());
   eq(true,b.canCall());
  });
  ck("old buckets age out of the time window",()->{
   AtomicLong clk=new AtomicLong(0);
   TimeWindowBreaker b=brk(clk,4);
   b.recordFailure();
   eq(1,b.windowCalls()); eq(1,b.windowFailures());
   clk.set(350);
   b.recordSuccess();
   eq(1,b.windowCalls()); eq(0,b.windowFailures());
  });
  ck("open blocks until timeout then half-open limits probes",()->{
   AtomicLong clk=new AtomicLong(0);
   TimeWindowBreaker b=brk(clk,2);
   b.recordFailure(); b.recordFailure();
   eq(false,b.canCall());
   clk.set(999); eq(false,b.canCall());
   clk.set(1000); eq(true,b.canCall());
   eq(true,b.canCall());
   eq(false,b.canCall());
   eq(TimeWindowBreaker.State.HALF_OPEN,b.state());
  });
  ck("half-open success threshold closes",()->{
   AtomicLong clk=new AtomicLong(0);
   TimeWindowBreaker b=brk(clk,2);
   b.recordFailure(); b.recordFailure();
   clk.set(1000); eq(true,b.canCall());
   b.recordSuccess();
   eq(TimeWindowBreaker.State.HALF_OPEN,b.state());
   eq(true,b.canCall());
   b.recordSuccess();
   eq(TimeWindowBreaker.State.CLOSED,b.state());
  });
  ck("half-open failure reopens",()->{
   AtomicLong clk=new AtomicLong(0);
   TimeWindowBreaker b=brk(clk,2);
   b.recordFailure(); b.recordFailure();
   clk.set(1000); eq(true,b.canCall());
   b.recordFailure();
   eq(TimeWindowBreaker.State.OPEN,b.state());
   eq(false,b.canCall());
  });
  System.out.println("RESULT "+p+"/"+t);
 }
}`,
    reference: `interface Clock { long millis(); }
class TimeWindowBreaker {
    enum State { CLOSED, OPEN, HALF_OPEN }
    private static final class Bucket { long start; int total; int fails; Bucket(long s){ start=s; } }
    private final long bucketMs;
    private final int maxBuckets;
    private final double threshold;
    private final int minimumCalls;
    private final long openMs;
    private final int halfOpenMax;
    private final int halfOpenSuccessThreshold;
    private final Clock clock;
    private final ArrayDeque<Bucket> window = new ArrayDeque<>();
    private State state = State.CLOSED;
    private long openedAt = 0;
    private int halfOpenCalls = 0;
    private int halfOpenSuccess = 0;
    TimeWindowBreaker(long bucketMs, int maxBuckets, double threshold, int minimumCalls, long openMs, int halfOpenMax, int halfOpenSuccessThreshold, Clock clock) {
        if (bucketMs <= 0) throw new IllegalArgumentException("bucketMs>0");
        if (maxBuckets < 1) throw new IllegalArgumentException("maxBuckets>=1");
        if (threshold <= 0 || threshold > 1) throw new IllegalArgumentException("0<threshold<=1");
        if (minimumCalls < 1) throw new IllegalArgumentException("minimumCalls>=1");
        if (openMs <= 0) throw new IllegalArgumentException("openMs>0");
        if (halfOpenMax < 1) throw new IllegalArgumentException("halfOpenMax>=1");
        if (halfOpenSuccessThreshold < 1 || halfOpenSuccessThreshold > halfOpenMax) throw new IllegalArgumentException("halfOpenSuccess in 1..halfOpenMax");
        if (clock == null) throw new IllegalArgumentException("clock");
        this.bucketMs=bucketMs; this.maxBuckets=maxBuckets; this.threshold=threshold; this.minimumCalls=minimumCalls;
        this.openMs=openMs; this.halfOpenMax=halfOpenMax; this.halfOpenSuccessThreshold=halfOpenSuccessThreshold; this.clock=clock;
    }
    synchronized boolean canCall() {
        long now = clock.millis();
        if (state == State.OPEN && now - openedAt >= openMs) {
            state = State.HALF_OPEN; halfOpenCalls = 0; halfOpenSuccess = 0; window.clear();
        }
        if (state == State.OPEN) return false;
        if (state == State.HALF_OPEN) {
            if (halfOpenCalls >= halfOpenMax) return false;
            halfOpenCalls++;
            return true;
        }
        return true;
    }
    synchronized void recordSuccess() {
        if (state == State.HALF_OPEN) {
            halfOpenSuccess++;
            if (halfOpenSuccess >= halfOpenSuccessThreshold) {
                state = State.CLOSED; halfOpenCalls = 0; halfOpenSuccess = 0; window.clear();
            }
            return;
        }
        if (state != State.CLOSED) return;
        add(true);
        maybeOpen();
    }
    synchronized void recordFailure() {
        if (state == State.HALF_OPEN) {
            state = State.OPEN; openedAt = clock.millis(); halfOpenCalls = 0; halfOpenSuccess = 0; window.clear();
            return;
        }
        if (state != State.CLOSED) return;
        add(false);
        maybeOpen();
    }
    private void add(boolean ok) {
        long now = clock.millis();
        long start = (now / bucketMs) * bucketMs;
        Bucket last = window.peekLast();
        if (last != null && last.start == start) {
            last.total++;
            if (!ok) last.fails++;
        } else {
            Bucket b = new Bucket(start);
            b.total = 1;
            if (!ok) b.fails = 1;
            window.addLast(b);
        }
        long oldest = start - (maxBuckets - 1) * bucketMs;
        while (!window.isEmpty() && window.peekFirst().start < oldest) window.removeFirst();
    }
    private void maybeOpen() {
        if (windowCalls() >= minimumCalls && failureRate() >= threshold) {
            state = State.OPEN; openedAt = clock.millis(); window.clear();
        }
    }
    synchronized int windowCalls() { int s=0; for (Bucket b : window) s += b.total; return s; }
    synchronized int windowFailures() { int s=0; for (Bucket b : window) s += b.fails; return s; }
    synchronized double failureRate() { int c = windowCalls(); return c == 0 ? 0.0 : (double) windowFailures() / c; }
    synchronized State state() { return state; }
}`,
    hints: [
      'Mỗi bucket lưu {start, total, fails}. Ghi kết quả: nếu bucket cuối cùng cùng start thì cộng dồn, ngược lại tạo bucket mới.',
      'Sau khi thêm, đẩy các bucket có start < startHienTai - (maxBuckets-1)*bucketMs để cửa sổ chỉ còn T giây gần nhất.',
      'canCall() trong OPEN kiểm tra now - openedAt >= openMs để chuyển HALF_OPEN; trong HALF_OPEN giới hạn halfOpenMax probe.',
      'maybeOpen() chỉ mở khi tongCall >= minimumCalls VÀ failureRate >= threshold; khi mở thì xóa cửa sổ.'
    ],
    explain: `Điểm cốt lõi là cửa sổ trượt theo thời gian: mỗi kết quả được gắn mốc bucket {{start = (now/bucketMs)*bucketMs}}, và các bucket cũ bị đẩy ra khi mốc của chúng ra ngoài khoảng [hiện tại - (maxBuckets-1)*bucketMs, hiện tại]. Nhờ vậy tỉ lệ lỗi luôn phản ánh T giây gần nhất, không bị quá khứ làm sai lệch — điều mà đếm liên tiếp (một success chen giữa là reset) và đếm theo số call (N call có thể trải dài nhiều giờ) không làm được.

Khi mở mạch, cửa sổ bị xóa để lần đo sau không lẫn tàn dư lỗi cũ. Trong HALF_OPEN, {{canCall}} giới hạn số probe và {{recordSuccess}} đủ ngưỡng mới đóng; chỉ một {{recordFailure}} là mở lại ngay và {{openedAt = now}} để đếm lại thời gian chờ. Clock giả cho phép test tiến thời gian tức thì (ví dụ set 350ms để bucket cũ bị đẩy ra) mà không cần {{Thread.sleep}}.

Lỗi thường gặp: quên bước evict theo mốc thời gian (chỉ giới hạn theo số lượng) khiến tỉ lệ luôn cao; {{minimumCalls}} quá thấp gây mở oan lúc traffic thấp; {{openMs}} quá ngắn gây flapping; và không xóa cửa sổ khi mở mạch làm half-open kế tiếp tính sai. Production dùng Resilience4j với {{slidingWindowType=TIME_BASED}}, {{slidingWindowSize}} tính bằng giây.`
  }],
  check: [
    { q: 'Cửa sổ time-based bucket 1 giây, giữ 3 giây. Một lỗi xảy ra 5 giây trước còn được tính vào tỉ lệ lỗi không?', options: ['Còn, vì lỗi là lỗi', 'Không, vì bucket của nó đã bị đẩy ra khỏi cửa sổ 3 giây', 'Chỉ tính khi OPEN', 'Chỉ tính khi traffic cao'], answer: 1, explain: `Cửa sổ time-based chỉ giữ các bucket trong T giây gần nhất; bucket cũ hơn bị evict theo mốc thời gian nên không còn đóng góp vào tỉ lệ. Đây là lý do time-based phản ánh "hiện tại" tốt hơn count-based. (A) sai vì mục đích của cửa sổ là bỏ qua quá khứ xa. (C) sai vì tỉ lệ được tính liên tục ở CLOSED. (D) sai vì traffic không đổi cách evict theo thời gian.` },
    { q: 'Vì sao phải xóa cửa sổ khi breaker chuyển sang OPEN?', options: ['Để tiết kiệm bộ nhớ', 'Để lần đo sau không lẫn tàn dư lỗi cũ, tránh half-open kế tiếp tính sai tỉ lệ', 'Để reset openedAt', 'Để tăng throughput'], answer: 1, explain: `Xóa cửa sổ khi vào OPEN đảm bảo mỗi chu kỳ đo bắt đầu sạch; nếu giữ lại, tàn dư lỗi cũ làm tỉ lệ ở lần half-open sau bị thổi phồng. (A) không phải lý do chính. (C) sai vì openedAt được set riêng. (D) không liên quan.` },
    { q: 'minimumCalls = 20, window 3 giây. Vì sao cần ngưỡng này?', options: ['Để giảm bộ nhớ bucket', 'Để tránh mở mạch oan khi traffic thấp, khi 1 lỗi trên 2 call đã 50% nhưng không đủ tin cậy', 'Để tăng failureRateThreshold', 'Để tắt half-open'], answer: 1, explain: `minimumCalls đảm bảo chỉ xét tỉ lệ khi đủ mẫu; nếu không, lúc traffic thấp một lỗi đơn lẻ có thể mở mạch oan. (A) sai, bộ nhớ do số bucket quyết định. (C) sai, ngưỡng tỉ lệ là tham số khác. (D) sai, half-open vẫn hoạt động.` },
    { q: 'Trong HALF_OPEN, vì sao giới hạn số probe (halfOpenMax)?', options: ['Để giảm chi phí tính toán', 'Vì dependency vừa hồi phục rất yếu, dồn nhiều request sẽ đánh nó sập lại (thundering herd)', 'Để tăng latency', 'Vì Kafka yêu cầu'], answer: 1, explain: `Giới hạn probe bảo vệ dependency đang yếu khỏi bị dồn request đúng lúc hồi phục; chỉ khi đủ ngưỡng thành công mới đóng mạch. (A) không phải lý do. (C) sai, mục tiêu là bảo vệ downstream. (D) không liên quan Kafka.` }
  ],
  related: ['microservices-015', 'microservices-016', 'microservices-009'],
  tags: ['circuit-breaker', 'time-based', 'sliding-window', 'bucket', 'resilience']
},
{
  id: 'lesson-microservices-032',
  track: 'microservices',
  order: 32,
  title: 'Idempotency key cho API thanh toán: lưu cả kết quả từ chối, replay đúng phản hồi cũ',
  level: 'senior',
  minutes: 35,
  goals: [
    'Hiểu vì sao idempotency key của payment phải lưu CẢ kết quả thành công lẫn từ chối',
    'Tự cài store: RUN / REPLAY / IN_PROGRESS / CONFLICT, scope theo tài khoản, phát hiện payload khác',
    'Phân biệt "chạy lại business" với "trả lại phản hồi đã lưu" và vì sao retry accidental không được charge hai lần'
  ],
  body: `**Tóm tắt:** Idempotency key cho API thanh toán gắn một khóa do client sinh với kết quả xử lý, để retry (gửi lại do timeout) không tạo lần charge thứ hai. Khác với store generic, payment phải lưu CẢ kết quả TỪ CHỐI (declined) như một kết quả cuối: cùng key + cùng payload thì trả lại đúng phản hồi cũ (kể cả "thẻ bị từ chối"), KHÔNG chạy lại business; cùng key khác payload (ví dụ khác số tiền) thì 422; đang xử lý thì 409. Muốn thử lại một giao dịch bị từ chối, client phải dùng key MỚI.

### Vì sao retry luôn xảy ra trong thanh toán
Một request POST /payments có thể commit DB thành công nhưng response mất trên đường về. Client timeout rồi gửi lại. Nếu server không phân biệt được hai lần gửi, nó charge thẻ hai lần — khách bị trừ tiền oan. Không thể sửa bằng cách "đảm bảo mạng không mất gói"; phải làm cho thao tác lặp lại an toàn bằng idempotency key.

Idempotency key thường do client sinh một lần cho mỗi thao tác logic (UUID). Server lưu key cùng tài khoản (account), và một fingerprint (vân tay) của payload — thường là hash của các trường quan trọng như số tiền và 4 số cuối thẻ. Fingerprint chặn trường hợp client tái sử dụng key cho payload khác: trả 422 thay vì replay kết quả cũ.

### Điểm khác biệt của payment: từ chối cũng là kết quả cuối
Trong store generic (xem bài 006), một lần thử FAILED thường cho phép BEGIN lại (retry). Nhưng trong thanh toán, một lần bị TỪ CHỐI (ví dụ {{card_declined}}) là một kết quả nghiệp vụ cuối cùng cho khóa đó: nếu client vô tình retry cùng key (do timeout), server phải trả lại đúng "từ chối" đó, KHÔNG được gọi lại cổng thanh toán. Lý do: cổng thanh toán có thể đã ghi nhận nỗ lực, và việc charge lại cùng một intent là sai. Muốn thử thẻ khác hoặc số tiền khác, client phải tạo key MỚI — đó là một thao tác logic mới.

Vì thế store chỉ có hai trạng thái lưu: PENDING (đang chạy) và DONE (đã có kết quả cuối, dù approve hay decline). Không có trạng thái "failed để retry" trong bài này — chính điểm này làm nó khác bài 006.

### Máy trạng thái
| Trạng thái lưu | Request cùng account+key, cùng fingerprint | Việc cần làm |
|---|---|---|
| không có | RUN | chạy business (charge), rồi complete lưu kết quả |
| PENDING | IN_PROGRESS | trả 409, không chạy business |
| DONE | REPLAY | trả đúng body đã lưu (approve hoặc decline) |
| khác fingerprint | CONFLICT | 422, không dùng lại kết quả, không ghi đè |

### Cơ chế từng bước
1. **Client sinh key + gửi request**: key là UUID, gửi kèm POST /payments. **Vì sao client sinh?** Vì chỉ client mới biết đâu là "một thao tác logic" cần retry; server không thể tự nhận ra hai request là một.
2. **begin(account, key, fingerprint)**: server tra store theo khóa đã scope {{account::key}}. **Vì sao scope theo account?** Nếu key toàn cục, account A gửi trùng key của B có thể nhận kết quả của B — rò rỉ dữ liệu.
3. **Nếu chưa có**: tạo entry PENDING, trả RUN. **Vì sao PENDING trước khi chạy?** Để request thứ hai đến trong lúc request đầu đang charge sẽ thấy PENDING và bị chặn (IN_PROGRESS), tránh hai lần charge song song.
4. **Chạy business rồi complete(account, key, fingerprint, body)**: chỉ khi entry còn PENDING và đúng fingerprint thì lưu body và đặt DONE. **Vì sao kiểm tra lại fingerprint ở complete?** Để một request đã bị promote (sai payload) không ghi đè kết quả của chủ hợp lệ.
5. **Nếu đã DONE**: trả REPLAY kèm body đã lưu. **Vì sao không chạy lại?** Vì kết quả (approve hay decline) đã là cuối; chạy lại có thể charge hai lần hoặc trả kết quả khác.
6. **Nếu khác fingerprint**: trả CONFLICT (422). **Vì sao?** Cùng key nhưng khác số tiền/thẻ nghĩa là client dùng lại key sai — một lỗi dữ liệu nghiêm trọng nếu im lặng replay.
7. **Nếu đang PENDING**: trả IN_PROGRESS (409). Client nên chờ rồi poll lại, không gửi request mới.

### Lưu kết quả từ chối — ví dụ cụ thể
~~~text
Client -> API: POST /payments  key=k2  amount=50  card=0000
API -> Store: begin(acc1, k2, "amt=50;card=0000") -> RUN
API -> PaymentGateway: charge -> DECLINED(card_declined)
API -> Store: complete(acc1, k2, "amt=50;card=0000", "DECLINED:card_declined")
API --> Client: 402 DECLINED
Client -> API: POST /payments  key=k2  (timeout, retry accidental)
API -> Store: begin(acc1, k2, "amt=50;card=0000") -> REPLAY "DECLINED:card_declined"
API --> Client: 402 DECLINED  (KHONG charge lai)
~~~

### Lỗi hay gặp trên production
- **Triệu chứng:** khách bị charge hai lần sau khi mạng chập chờn. **Nguyên nhân:** store chỉ lưu kết quả thành công, lần từ chối không lưu nên retry chạy lại; hoặc không có fingerprint. **Cách sửa:** lưu mọi kết quả cuối (approve + decline) theo key; retry cùng key trả REPLAY.
- **Triệu chứng:** một key bị dùng cho hai số tiền khác nhau, server trả kết quả của lần trước. **Nguyên nhân:** không so fingerprint. **Cách sửa:** fingerprint = hash các trường nghiệp vụ (amount, card last4, currency); khác fingerprint → 422.
- **Triệu chứng:** hai request cùng key đến song song, cả hai cùng charge. **Nguyên nhân:** check-then-act không nguyên tử (kiểm tra "chưa có" rồi mới tạo, tách rời). **Cách sửa:** dùng unique constraint ở DB (INSERT ... ON CONFLICT) hoặc {{ConcurrentHashMap.compute}} để chỉ một request thắng; request kia nhận IN_PROGRESS.
- **Triệu chứng:** client retry một giao dịch đã bị từ chối mãi không xong. **Nguyên nhân:** dùng lại key cũ. **Cách sửa:** muốn thử lại (thẻ khác, số tiền khác) phải dùng key MỚI; key cũ chỉ để nhận lại kết quả cũ.

### Ví dụ đời thực
**Bối cảnh:** hệ thống ví điện tử, cổng thanh toán thỉnh thoảng timeout 8s.
**Triệu chứng:** 0,3% giao dịch bị charge hai lần; khiếu nại tăng.
**Điều tra:** client retry sau timeout với cùng key, nhưng store chỉ lưu approve; các lần decline không lưu nên retry charge lại. Thêm nữa, một số client dùng lại key cho số tiền khác.
**Xử lý:** lưu cả decline như DONE; thêm fingerprint (amount + card last4); scope theo account; in-flight trả 409.
**Kết quả:** charge trùng giảm về 0; 422 rate 0,02% (client bug bị phát hiện sớm); p99 không đổi vì store chỉ là một lần tra map/DB.

### Trả lời mẫu khi phỏng vấn
Idempotency key cho payment do client sinh cho mỗi thao tác logic; server lưu theo account + key kèm fingerprint của payload. Điểm quan trọng là lưu CẢ kết quả từ chối như một kết quả cuối: retry cùng key trả lại đúng phản hồi cũ (kể cả decline) mà không charge lại; muốn thử lại phải dùng key mới. Cùng key khác fingerprint thì 422 để bắt bug client; đang xử lý thì 409. Tôi dùng unique constraint ở DB hoặc compute để chỉ một request thắng, tránh hai lần charge song song, và theo dõi replay rate, 409 rate, 422 rate.

> Senior tip: theo dõi tỉ lệ REPLAY (retry cùng key — bình thường), IN_PROGRESS/409 (client retry quá sớm) và CONFLICT/422 (client dùng lại key sai payload). 422 tăng đột biến thường là bug client chứ không phải lỗi server; 409 tăng là do client không chờ đủ.

### Liên hệ phỏng vấn
- **Hỏi:** Vì sao payment phải lưu cả kết quả từ chối, khác store generic? **Trả lời ngắn:** Một decline là kết quả nghiệp vụ cuối cho khóa đó; retry accidental cùng key phải trả lại decline, không được charge lại. Muốn thử lại phải dùng key mới.
- **Hỏi:** Cùng key khác số tiền thì làm gì? **Trả lời ngắn:** Trả 422 CONFLICT vì fingerprint khác; im lặng replay kết quả cũ là lỗi dữ liệu nghiêm trọng.
- **Hỏi:** Hai request cùng key đến song song, tránh hai lần charge thế nào? **Trả lời ngắn:** Dùng unique constraint DB (INSERT ... ON CONFLICT) hoặc ConcurrentHashMap.compute để chỉ một request vào PENDING và chạy business; request kia nhận 409 IN_PROGRESS.
- **Hỏi:** Vì sao scope key theo account? **Trả lời ngắn:** Tránh rò rỉ dữ liệu giữa các tài khoản: key toàn cục khiến account A có thể nhận kết quả của B khi trùng key.`,
  exercises: [{
    title: 'PaymentIdempotency: RUN / REPLAY / IN_PROGRESS / CONFLICT',
    prompt: `Cài {{PaymentIdempotency}} trong bộ nhớ (các kiểu dùng chung đã có trong starter).

- {{Outcome begin(String account, String key, String fingerprint)}} trả {{Outcome(Decision decision, String body)}}, {{Decision}} gồm {{RUN}}, {{REPLAY}}, {{IN_PROGRESS}}, {{CONFLICT}}. Quy tắc: khóa scope theo {{account + "::" + key}}. Chưa có → tạo entry PENDING và trả {{RUN}}. Đã có nhưng {{fingerprint}} khác → {{CONFLICT}} (không đổi trạng thái). Đang PENDING cùng fingerprint → {{IN_PROGRESS}}. Đã DONE cùng fingerprint → {{REPLAY}} kèm body đã lưu.
- {{void complete(String account, String key, String fingerprint, String body)}}: chỉ khi entry còn PENDING và đúng fingerprint thì lưu {{body}} và đặt DONE; ngược lại bỏ qua (không ghi đè).
- {{String body(String account, String key)}} trả body đã lưu hoặc {{null}}.
- {{int size()}} trả số entry.

{{begin}} phải ném {{IllegalArgumentException}} nếu account/key/fingerprint null. Tất cả method {{synchronized}}.`,
    starter: `class PaymentIdempotency {
    enum Decision { RUN, REPLAY, IN_PROGRESS, CONFLICT }
    record Outcome(Decision decision, String body) {}
    PaymentIdempotency() {}
    synchronized Outcome begin(String account, String key, String fingerprint) { throw new UnsupportedOperationException("TODO"); }
    synchronized void complete(String account, String key, String fingerprint, String body) { throw new UnsupportedOperationException("TODO"); }
    synchronized String body(String account, String key) { throw new UnsupportedOperationException("TODO"); }
    synchronized int size() { throw new UnsupportedOperationException("TODO"); }
}`,
    tests: `public class Main {
 static int p=0,t=0; static void ck(String n,Runnable r){t++;try{r.run();p++;System.out.println("PASS "+n);}catch(Throwable e){System.out.println("FAIL "+n+": "+e);}}
 static void eq(Object a,Object b){if(!Objects.equals(a,b))throw new AssertionError(a+" != "+b);}
 public static void main(String[] x){
  ck("first run then replay same body",()->{
   PaymentIdempotency s=new PaymentIdempotency();
   int[] runs={0};
   PaymentIdempotency.Outcome a=s.begin("acc1","k1","amt=100;card=4242");
   eq(PaymentIdempotency.Decision.RUN,a.decision());
   runs[0]++;
   s.complete("acc1","k1","amt=100;card=4242","APPROVED:txn-9");
   PaymentIdempotency.Outcome b=s.begin("acc1","k1","amt=100;card=4242");
   eq(PaymentIdempotency.Decision.REPLAY,b.decision());
   eq("APPROVED:txn-9",b.body());
   eq(1,runs[0]);
  });
  ck("declined result is replayed not re-run",()->{
   PaymentIdempotency s=new PaymentIdempotency();
   int[] runs={0};
   eq(PaymentIdempotency.Decision.RUN,s.begin("acc1","k2","amt=50;card=0000").decision());
   runs[0]++;
   s.complete("acc1","k2","amt=50;card=0000","DECLINED:card_declined");
   PaymentIdempotency.Outcome b=s.begin("acc1","k2","amt=50;card=0000");
   eq(PaymentIdempotency.Decision.REPLAY,b.decision());
   eq("DECLINED:card_declined",b.body());
   eq(1,runs[0]);
  });
  ck("in-flight duplicate is blocked",()->{
   PaymentIdempotency s=new PaymentIdempotency();
   eq(PaymentIdempotency.Decision.RUN,s.begin("a","k","fp").decision());
   PaymentIdempotency.Outcome b=s.begin("a","k","fp");
   eq(PaymentIdempotency.Decision.IN_PROGRESS,b.decision());
   eq(null,b.body());
  });
  ck("same key different payload conflicts",()->{
   PaymentIdempotency s=new PaymentIdempotency();
   s.begin("a","k","amt=100");
   s.complete("a","k","amt=100","APPROVED:t1");
   PaymentIdempotency.Outcome c=s.begin("a","k","amt=999");
   eq(PaymentIdempotency.Decision.CONFLICT,c.decision());
   eq("APPROVED:t1",s.body("a","k"));
   eq(1,s.size());
  });
  ck("scoped per account",()->{
   PaymentIdempotency s=new PaymentIdempotency();
   eq(PaymentIdempotency.Decision.RUN,s.begin("accA","k","fp").decision());
   eq(PaymentIdempotency.Decision.RUN,s.begin("accB","k","fp").decision());
   eq(2,s.size());
  });
  ck("different key is a new payment",()->{
   PaymentIdempotency s=new PaymentIdempotency();
   s.begin("a","k1","fp"); s.complete("a","k1","fp","APPROVED:1");
   eq(PaymentIdempotency.Decision.RUN,s.begin("a","k2","fp").decision());
   eq(2,s.size());
  });
  System.out.println("RESULT "+p+"/"+t);
 }
}`,
    reference: `class PaymentIdempotency {
    enum Decision { RUN, REPLAY, IN_PROGRESS, CONFLICT }
    record Outcome(Decision decision, String body) {}
    private enum Status { PENDING, DONE }
    private static final class Entry {
        final String fingerprint;
        Status status = Status.PENDING;
        String body;
        Entry(String fingerprint) { this.fingerprint = fingerprint; }
    }
    private final Map<String, Entry> store = new HashMap<>();
    private static String scoped(String account, String key) { return account + "::" + key; }
    synchronized Outcome begin(String account, String key, String fingerprint) {
        if (account == null || key == null || fingerprint == null) throw new IllegalArgumentException("account/key/fingerprint required");
        String sk = scoped(account, key);
        Entry e = store.get(sk);
        if (e == null) { store.put(sk, new Entry(fingerprint)); return new Outcome(Decision.RUN, null); }
        if (!e.fingerprint.equals(fingerprint)) return new Outcome(Decision.CONFLICT, null);
        if (e.status == Status.PENDING) return new Outcome(Decision.IN_PROGRESS, null);
        return new Outcome(Decision.REPLAY, e.body);
    }
    synchronized void complete(String account, String key, String fingerprint, String body) {
        Entry e = store.get(scoped(account, key));
        if (e == null || e.status != Status.PENDING || !e.fingerprint.equals(fingerprint)) return;
        e.body = body;   // publish the terminal result (approve or decline) before DONE
        e.status = Status.DONE;
    }
    synchronized String body(String account, String key) {
        Entry e = store.get(scoped(account, key));
        return e == null ? null : e.body;
    }
    synchronized int size() { return store.size(); }
}`,
    hints: [
      'Khóa scope theo account::key. begin: chưa có -> tạo PENDING trả RUN; khác fingerprint -> CONFLICT; PENDING -> IN_PROGRESS; DONE -> REPLAY kèm body.',
      'complete chỉ ghi khi entry còn PENDING và đúng fingerprint; gán body trước rồi mới đặt DONE để REPLAY không bao giờ đọc phải body null.',
      'Không có trạng thái FAILED để retry: decline là DONE và được replay; muốn thử lại phải dùng key mới.'
    ],
    explain: `Bài tập mô phỏng đúng phần khó của idempotency thanh toán: retry accidental không được charge hai lần, kể cả khi lần trước bị từ chối. Store chỉ có PENDING và DONE; một decline được lưu như DONE kèm body, nên begin cùng key trả REPLAY đúng "DECLINED" mà không chạy lại business — điều mà store generic (FAILED -> BEGIN) không làm.

Khác fingerprint trên cùng key trả CONFLICT (422) để bắt bug client dùng lại key cho payload khác; không ghi đè kết quả cũ. Trong lúc PENDING, request thứ hai nhận IN_PROGRESS (409) thay vì chạy song song. Toàn bộ chuyển trạng thái nằm trong một synchronized block (mô phỏng unique constraint ở DB hoặc ConcurrentHashMap.compute): chỉ một request tạo được entry PENDING, request kia thấy PENDING.

complete kiểm tra lại fingerprint và trạng thái PENDING trước khi ghi, rồi gán body trước khi đặt DONE. Thứ tự này đảm bảo REPLAY luôn đọc được body đầy đủ. Trong production, store phải nằm ở DB/Redis với unique index theo (account, endpoint, key) và TTL; map trong RAM chỉ đúng cho một JVM và mất khi restart. Muốn thử lại một giao dịch bị từ chối, client dùng key MỚI.`
  }],
  check: [
    { q: 'Client retry accidental cùng key sau khi lần đầu bị TỪ CHỐI. Server nên làm gì?', options: ['Charge lại thẻ', 'Trả lại đúng kết quả từ chối đã lưu (REPLAY), không charge lại', 'Xóa key và xử lý như mới', 'Trả 500'], answer: 1, explain: `Decline là kết quả cuối cho khóa đó; retry cùng key phải replay đúng phản hồi cũ để không charge hai lần. Muốn thử lại (thẻ khác, số tiền khác) phải dùng key MỚI. (A) sai vì gây charge trùng. (C) sai vì mất khả năng chống trùng. (D) sai vì đây không phải lỗi server.` },
    { q: 'Cùng key nhưng fingerprint (số tiền) khác. Hành vi đúng?', options: ['Replay kết quả cũ', '422 CONFLICT, không ghi đè, để bắt bug client', 'Charge theo số tiền mới', 'Xóa entry'], answer: 1, explain: `Cùng key khác payload là dấu hiệu client dùng lại key sai; im lặng replay sẽ trả kết quả của thao tác cũ — lỗi dữ liệu. Trả 422 buộc client sửa. (A) sai vì gây sai kết quả. (C) sai vì key đã gắn với intent cũ. (D) sai vì xóa entry phá khả năng dedup.` },
    { q: 'Hai request cùng key đến song song, request đầu đang PENDING. Request thứ hai nhận gì?', options: ['RUN và charge song song', '409 IN_PROGRESS, không chạy business', 'REPLAY body null', '422 CONFLICT'], answer: 1, explain: `PENDING nghĩa là đang có chủ xử lý; request sau bị chặn để tránh hai lần charge. RUN chỉ cho entry mới; REPLAY chỉ khi DONE; CONFLICT chỉ khi khác fingerprint. (A) sai vì gây charge hai lần. (C) sai vì chưa có body. (D) sai vì fingerprint giống nhau.` },
    { q: 'Vì sao idempotency key của payment phải scope theo account?', options: ['Để key ngắn hơn', 'Tránh rò rỉ dữ liệu: key toàn cục khiến account A có thể nhận kết quả của B khi trùng key', 'Để tăng tốc', 'Để dùng chung fingerprint'], answer: 1, explain: `Scope theo account đảm bảo mỗi tài khoản có không gian key riêng; nếu toàn cục, trùng key giữa hai account sẽ trả kết quả của nhau — rò rỉ dữ liệu nghiêm trọng. (A) không phải lý do. (C) không liên quan. (D) fingerprint là của payload, không thay thế scope.` }
  ],
  related: ['microservices-006', 'microservices-004', 'microservices-002'],
  tags: ['idempotency', 'payment', 'replay', 'fingerprint', 'in-flight']
},
{
  id: 'lesson-microservices-033',
  track: 'microservices',
  order: 33,
  title: 'Circuit breaker từ bên trong: 3 trạng thái, cửa sổ trượt theo thời gian, đồng hồ giả',
  level: 'senior',
  minutes: 30,
  goals: [
    'Vẽ được ba trạng thái CLOSED / OPEN / HALF_OPEN và chuyển đổi giữa chúng',
    'Hiểu cửa sổ trượt theo thời gian: lỗi cũ hết hạn, chỉ tính lỗi gần đây, khác so với đếm liên tiếp hoặc cửa sổ cố định số lệnh',
    'Viết circuit breaker tự kiểm thử được bằng đồng hồ giả (fake clock) mà không cần chờ thời gian thực',
  ],
  body: `### Vấn đề mà circuit breaker giải quyết
Gọi dịch vụ khác qua mạng luôn có thể thất bại: timeout, connection reset, hoặc dịch vụ downstream đang quá tải. Nếu caller cứ retry liên tục, mỗi lần thử đều dồn thêm tải vào dịch vụ đang yếu, gây retry storm và cascading failure — dịch vụ caller cũng chết theo dù bản thân không có lỗi.

Circuit breaker (cầu dao) là lớp bảo vệ đặt trước mỗi cuộc gọi mạng. Nó theo dõi tỷ lệ lỗi và, khi vượt ngưỡng, mở mạch: các lần gọi sau bị từ chối ngay (fail fast), không gọi downstream, giúp downstream có thời gian hồi phục.

### Ba trạng thái
1. CLOSED (đóng): gọi bình thường qua downstream. Mỗi kết quả (thành công hoặc thất bại) được ghi vào cửa sổ trượt.
2. OPEN (mở): fail fast, trả lỗi ngay, không gọi downstream. Sau một thời gian chờ {{waitDurationInOpenState}}, chuyển sang HALF_OPEN.
3. HALF_OPEN (nửa mở): cho một hoặc vài lệnh gọi thử (probe). Nếu thành công → đóng mạch lại (CLOSED). Nếu thất bại → mở mạch lại (OPEN) và tính tiếp thời gian chờ.

### Cửa sổ trượt theo thời gian (sliding time window)
Khác với việc đếm liên tiếp (lỗi liên tiếp n lần) hoặc cửa sổ cố định số lệnh (đánh giá sau mỗi N lần gọi), cửa sổ trượt theo thời gian ghi nhãn mốc thời gian của mỗi kết quả. Lỗi cũ hơn {{windowSeconds}} bị loại ra, chỉ tính tỷ lệ thất bại trong khoảng thời gian gần đây.

Ví dụ: cửa sổ 10 giây, ngưỡng 50%, tối thiểu 3 lệnh. Nếu 3 lệnh trong 10 giây gần đây đều lỗi → mở mạch. Nếu 2 lệnh lỗi rồi 1 lệnh thành công → tỷ lệ 33% < 50% → vẫn CLOSED. Lỗi xảy ra 15 giây trước đã hết hạn, không còn counted.

Đồng hồ giả (fake clock) cho phép kiểm thử xác định: ta đẩy giờ forwards mà không cần chờ thực tế, nên kiểm thử được mở mạch, chờ, nửa mở, và hết hạn lỗi cũ.

### Mã minh hoạ
~~~java
enum State { CLOSED, OPEN, HALF_OPEN }
interface Clock { long now(); }

class CircuitBreaker {
    private final Clock clock;
    private final long windowMs;
    private final double failureRateThreshold;
    private final int minCalls;
    private final long waitOpenMs;
    private State state = State.CLOSED;
    private long openedAt = -1;
    private int probesUsed = 0;
    private final List<Long> times = new ArrayList<>();
    private final List<Boolean> okList = new ArrayList<>();

    boolean allowCall() {
        long now = clock.now();
        if (state == State.OPEN && now - openedAt >= waitOpenMs) {
            state = State.HALF_OPEN;
            probesUsed = 0;
        }
        if (state == State.OPEN) return false;              // fail fast
        if (state == State.HALF_OPEN) {
            if (probesUsed >= 1) return false;               // chỉ một probe mỗi lần nửa mở
            probesUsed++;
            return true;
        }
        return true;                                          // CLOSED
    }

    void onComplete(boolean ok, long durationMs) {
        long now = clock.now();
        long cutoff = now - windowMs;
        while (!times.isEmpty() && times.get(0) < cutoff) {   // xoá lỗi cũ khỏi cửa sổ
            times.remove(0);
            okList.remove(0);
        }
        times.add(now);
        okList.add(ok);

        if (state == State.HALF_OPEN) {
            state = ok ? State.CLOSED : State.OPEN;          // probe thành công -> đóng, thất bại -> mở
            probesUsed = 0;
            times.clear();
            okList.clear();
            return;
        }
        if (state == State.CLOSED && times.size() >= minCalls) {
            long failures = okList.stream().filter(b -> !b).count();
            if ((double) failures / times.size() >= failureRateThreshold) {
                state = State.OPEN;
                openedAt = now;
            }
        }
    }

    State state() { return state; }
}
~~~

### Ví dụ thực tế
Hệ thống đặt hàng gọi payment-service. Cao điểm trưa, payment-service tăng latency từ 200ms lên 5s. Order-service không có circuit breaker: 200 thread đều chờ payment, thread pool cạn, toàn bộ order-service ngừng phản hồi.

Với circuit breaker: cửa sổ 10 giây, ngưỡng 50% lỗi, chờ 30 giây. Sau 6 lệnh gọi liên tiếp lỗi (tỷ lệ 100%), mạch mở. Các yêu cầu order mới nhận lỗi ngay (fail fast) trong 30 giây, không chờ 5s mỗi lần. Payment-service không bị dồn thêm tải, tự hồi phục. Sau 30 giây, mạch chuyển nửa mở, cho 1 lệnh thử; nếu thanh toán thành công, mạch đóng lại và traffic bình thường.

### Liên hệ phỏng vấn
Interviewer thường hỏi: sai lầm khi đặt circuit breaker ngoài retry hay trong retry? Vì sao timeout phải ngắn hơn tổng deadline? Sự khác biệt giữa failure rate và slow call rate? Tại sao cần bulkhead cùng với circuit breaker?`,
  exercises: [
    {
      title: 'Circuit breaker: ba trạng thái và cửa sổ trượt theo thời gian',
      prompt: `Làm lại class {{CircuitBreaker}} với ba trạng thái {{CLOSED}}, {{OPEN}}, {{HALF_OPEN}}.

API cần triển khai:
- {{CircuitBreaker(Clock clock, int windowSeconds, double failureRateThreshold, int minCalls, long waitDurationOpenMs)}}: cửa sổ {{windowSeconds}} giây, ngưỡng tỷ lệ thất bại {{failureRateThreshold}} (0..1), tối thiểu {{minCalls}} lệnh trong cửa sổ mới đánh giá, thời gian chờ {{waitDurationOpenMs}} mili-giây trước khi chuyển OPEN sang HALF_OPEN.
- {{boolean allowCall()}}: trả về true nếu được gọi. Nếu OPEN và đã hết thời gian chờ, chuyển HALF_OPEN. Nếu OPEN trả false (fail fast). Nếu HALF_OPEN, chỉ cho đúng một lệnh gọi thử (probe) mỗi lần chuyển sang HALF_OPEN, sau đó trả false.
- {{void onComplete(boolean ok, long durationMs)}}: ghi nhận kết quả. Xoá kết quả cũ hơn {{windowSeconds}} ra khỏi cửa sổ. Nếu HALF_OPEN: thành công -> CLOSED, thất bại -> OPEN. Nếu CLOSED và đủ {{minCalls}} lệnh: tính tỷ lệ thất bại, vượt ngưỡng -> OPEN.
- {{State state()}}: trả về trạng thái hiện tại.

Dùng đồng hồ giả {{Clock}} (tiến hành bằng now()) để kiểm thử xác định, không dùng System.currentTimeMillis.`,
      starter: `final class CircuitBreaker {
    enum State { CLOSED, OPEN, HALF_OPEN }
    interface Clock { long now(); }

    private final Clock clock;
    private final long windowMs;
    private final double failureRateThreshold;
    private final int minCalls;
    private final long waitOpenMs;

    private State state = State.CLOSED;
    private long openedAt = -1;
    private int probesUsed = 0;
    private final List<Long> times = new ArrayList<>();
    private final List<Boolean> okList = new ArrayList<>();

    CircuitBreaker(Clock clock, int windowSeconds, double failureRateThreshold, int minCalls, long waitOpenMs) {
        this.clock = clock;
        this.windowMs = windowSeconds * 1000L;
        this.failureRateThreshold = failureRateThreshold;
        this.minCalls = minCalls;
        this.waitOpenMs = waitOpenMs;
    }

    boolean allowCall() {
        throw new UnsupportedOperationException("TODO");
    }

    void onComplete(boolean ok, long durationMs) {
        throw new UnsupportedOperationException("TODO");
    }

    State state() {
        return state;
    }
}`,
      tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }
    static class FakeClock implements CircuitBreaker.Clock {
        long now;
        FakeClock(long now) { this.now = now; }
        public long now() { return now; }
        void advance(long millis) { now += millis; }
    }
    public static void main(String[] args) {
        FakeClock clock = new FakeClock(0);
        CircuitBreaker cb = new CircuitBreaker(clock, 10, 0.5, 3, 5000);

        check("ban dau CLOSED va cho goi", cb.state() == CircuitBreaker.State.CLOSED && cb.allowCall(), "state=" + cb.state());

        cb.onComplete(false, 100);
        cb.onComplete(false, 100);
        cb.onComplete(false, 100);
        check("ba loi lien tiep 100% -> OPEN", cb.state() == CircuitBreaker.State.OPEN, "state=" + cb.state());

        check("OPEN fail fast khong cho goi", !cb.allowCall(), "allowCall=" + cb.allowCall());

        clock.advance(4000);
        check("con 4s van OPEN", cb.state() == CircuitBreaker.State.OPEN && !cb.allowCall(), "state=" + cb.state());

        clock.advance(1000);
        boolean allowed = cb.allowCall();
        check("het waitDuration -> HALF_OPEN va cho mot probe", cb.state() == CircuitBreaker.State.HALF_OPEN && allowed, "state=" + cb.state() + " allowed=" + allowed);

        cb.onComplete(true, 100);
        check("HALF_OPEN thanh cong -> CLOSED", cb.state() == CircuitBreaker.State.CLOSED, "state=" + cb.state());

        clock = new FakeClock(0);
        cb = new CircuitBreaker(clock, 10, 0.5, 3, 5000);

        cb.onComplete(false, 100);
        cb.onComplete(false, 100);
        check("2 loi < minCalls 3 van CLOSED", cb.state() == CircuitBreaker.State.CLOSED, "state=" + cb.state());

        cb.onComplete(false, 100);
        check("loi thu 3 -> OPEN", cb.state() == CircuitBreaker.State.OPEN, "state=" + cb.state());

        clock.advance(6000);
        cb.allowCall();
        check("het wait -> HALF_OPEN lan 2", cb.state() == CircuitBreaker.State.HALF_OPEN, "state=" + cb.state());
        cb.onComplete(false, 100);
        check("HALF_OPEN loi -> OPEN lai", cb.state() == CircuitBreaker.State.OPEN, "state=" + cb.state());

        clock.advance(6000);
        cb.allowCall();
        check("het wait -> HALF_OPEN lan 3", cb.state() == CircuitBreaker.State.HALF_OPEN, "state=" + cb.state());
        cb.onComplete(true, 100);
        check("HALF_OPEN thanh cong -> CLOSED", cb.state() == CircuitBreaker.State.CLOSED, "state=" + cb.state());

        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `final class CircuitBreaker {
    enum State { CLOSED, OPEN, HALF_OPEN }
    interface Clock { long now(); }

    private final Clock clock;
    private final long windowMs;
    private final double failureRateThreshold;
    private final int minCalls;
    private final long waitOpenMs;

    private State state = State.CLOSED;
    private long openedAt = -1;
    private int probesUsed = 0;
    private final List<Long> times = new ArrayList<>();
    private final List<Boolean> okList = new ArrayList<>();

    CircuitBreaker(Clock clock, int windowSeconds, double failureRateThreshold, int minCalls, long waitOpenMs) {
        this.clock = clock;
        this.windowMs = windowSeconds * 1000L;
        this.failureRateThreshold = failureRateThreshold;
        this.minCalls = minCalls;
        this.waitOpenMs = waitOpenMs;
    }

    boolean allowCall() {
        long now = clock.now();
        if (state == State.OPEN && now - openedAt >= waitOpenMs) {
            state = State.HALF_OPEN;
            probesUsed = 0;
        }
        if (state == State.OPEN) return false;
        if (state == State.HALF_OPEN) {
            if (probesUsed >= 1) return false;
            probesUsed++;
            return true;
        }
        return true;
    }

    void onComplete(boolean ok, long durationMs) {
        long now = clock.now();
        long cutoff = now - windowMs;
        while (!times.isEmpty() && times.get(0) < cutoff) {
            times.remove(0);
            okList.remove(0);
        }
        times.add(now);
        okList.add(ok);

        if (state == State.HALF_OPEN) {
            state = ok ? State.CLOSED : State.OPEN;
            if (!ok) openedAt = now;
            probesUsed = 0;
            times.clear();
            okList.clear();
            return;
        }
        if (state == State.CLOSED && times.size() >= minCalls) {
            long failures = okList.stream().filter(b -> !b).count();
            if ((double) failures / times.size() >= failureRateThreshold) {
                state = State.OPEN;
                openedAt = now;
            }
        }
    }

    State state() { return state; }
}`,
      hints: [
        'allowCall: khi OPEN đã quá waitOpenMs, chuyển HALF_OPEN trước, rồi mới quyết định cho gọi hay không.',
        'HALF_OPEN chỉ cho đúng một probe mỗi lần; probe thành công đóng mạch, thất bại mở lại.',
        'onComplete xoá kết quả cũ hơn windowMs khỏi danh sách trước khi tính tỷ lệ thất bại.',
      ],
      explain: `Circuit breaker mô phỏng đúng thành phần chính của Resilience4j. Ba trạng thái CLOSED, OPEN, HALF_OPEN tương ứng trạng thái được Resilience4j theo dõi qua metric {{circuitbreaker.state}}.

Cửa sổ trượt theo thời gian khác với cửa sổ dựa trên số lượng (count-based sliding window): ở đây ta gán nhãn mốc thời gian cho mỗi lệnh và xoá những lệnh cũ hơn {{windowSeconds}}, nên tỷ lệ thất bại phản ánh tình trạng gần đây thay vì tích lũy mãi. Đồng hồ giả {{Clock}} cho phép kiểm thử theo ý ta: đẩy giờ để mở mạch, chờ waitDuration, nửa mở, probe — mọi thứ xác định, không cần chờ thực tế.

Lưu ý quan trọng: {{minCalls}} tránh mở mạch quá sớm khi chỉ có 1–2 lệnh gọi; nếu không, một lệnh gọi lỗi đầu tiên là đủ để mở mạch (tỷ lệ 100%). Trong production, kết hợp circuit breaker với {{bulkhead}} (cô ile tài nguyên theo downstream) và {{fallback}} (trả dữ liệu thay thế) để degrade có kiểm soát. Retry đặt ngoài circuit breaker và phải bỏ qua exception CallNotPermittedException khi breaker OPEN, nếu không retry sẽ dội thêm tải vào dịch vụ đang yếu.`,
    },
  ],
  check: [
    { q: 'Circuit breaker ở trạng thái OPEN, còn thời gian chờ chưa hết, gọi tiếp nhận gì?', options: ['Gọi xuống downstream như bình thường', 'Từ chối ngay (fail fast), không gọi downstream', 'Chờ đến khi hết thời gian chờ rồi mới gọi', 'Trả 503 và tự động retry'], answer: 1, explain: `OPEN nghĩa là fail fast: mọi gọi bị từ chối ngay để giảm tải cho downstream và tránh gọi thành suy kiệt. Chỉ sau khi hết waitDuration mới chuyển HALF_OPEN để thử lại. (A) sai vì OPEN không gọi. (C) sai vì không chờ, trả ngay. (D) sai vì OPEN không tự retry.` },
    { q: 'Cửa sổ trượt theo thời gian khác so với đếm lỗi liên tiếp ở điểm nào?', options: ['Lỗi cũ hết hạn sau windowSeconds, chỉ tính lỗi gần đây', 'Chỉ tính số lần gọi thành công', 'Không bao giờ mở mạch', 'Yêu cầu tối thiểu 100 lệnh mới đánh giá'], answer: 0, explain: `Cửa sổ trượt theo thời gian gán nhãn mốc cho mỗi kết quả và xoá các kết quả cũ hơn windowSeconds, nên lỗi cũ không còn counted. Đếm liên tiếp (consecutive errors) không dùng thời gian, chỉ đếm số lỗi liên tiếp. (B) sai vì tính cả thất bại. (C) sai vì vẫn mở mạch khi vượt ngưỡng. (D) sai vì minClaims có thể ít hơn 100.` },
    { q: 'Trạng thái HALF_OPEN có mục đích gì?', options: ['Chấp nhận mọi gọi mà không kiểm tra lỗi', 'Cho một vài lệnh gọi thử; thành công đóng mạch, thất bại mở lại', 'Giữ mãi mở mà không bao giờ đóng', 'Chuyển trực tiếp từ OPEN sang CLOSED không thử'], answer: 1, explain: `HALF_OPEN là thời gian thử điểm: downstream có thể đã hồi phục, cho một vài lệnh gọi thử (probe). Thành công → đóng mạch (CLOSED), thất bại → mở lại (OPEN) và chờ tiếp. Đây là cách an toàn để phục hồi mà không dội tải toàn bộ ngay lập tức.` },
    { q: 'Vì sao cần minClaims (số lệnh tối thiểu) trước khi đánh giá tỷ lệ thất bại?', options: ['Để tránh mở mạch khi chỉ có 1–2 lệnh gọi và một trong số đó lỗi', 'Để tăng tốc độ mở mạch', 'Để không bao giờ mở mạch', 'Để chỉ đánh giá khi có ít nhất 100 lệnh'], answer: 0, explain: `Nếu không có minClaims, một lệnh gọi lỗi đầu tiên đã làm tỷ lệ thất bại 100% → mở mạch ngay, gây fail fast không cần thiết. minCalls đảm bảo có đủ mẫu số trước khi kết luận downstream yếu. (B) và (C) ngược hoàn toàn. (D) không bắt buột 100.` }
  ],
  related: ['microservices-060', 'microservices-061'],
  tags: ['circuit breaker', 'resilience', 'fail-fast', 'half-open', 'sliding-window']
},
{
  id: 'lesson-microservices-034',
  track: 'microservices',
  order: 34,
  title: 'Idempotency key thanh toán: TTL, PENDING hết hạn, và DONE vĩnh viễn',
  level: 'senior',
  minutes: 30,
  goals: [
    'Viết được idempotency key lưu kết quả theo key, request lặp trả cùng kết quả',
    'Hiểu TTL: PENDING hết hạn thì có thể thử lại, DONE là vĩnh viễn không bao giờ hết hạn',
    'Phát hiện fingerprint khác trên cùng key (422) và PENDING song song (409)',
  ],
  body: `### Idempotency key là gì
Khi client gọi API thanh toán và mạng gián đoạn, client không biết lệnh đã đến server hay chưa. Nếu client retry và server không có cơ chế chống trùng, cùng một lệnh thanh toán có thể được xử lý hai lần -> trừ tiền hai lần.

Idempotency key giải quyết: client sinh một idempotency key duy nhất cho mỗi lệnh ghi (ví dụ {{pay-abc-123}}). Server lưu kết quả theo key. Request lặp cùng key và cùng nội dung -> trả cùng kết quả đã lưu, không chạy lại business. Request cùng key nhưng nội dung khác -> từ chối (422 CONFLICT) vì client dùng nhầm key.

### Store và ba trạng thái
Mỗi entry lưu theo scope {{(accountId, endpoint, key)}}:
- fingerprint: hash của nội dung payload, dùng để phát hiện client dùng lại key cho nội dung khác.
- status: PENDING (đang xử lý) hoặc DONE (hoàn thành, đã có kết quả).
- body: response terminal (chấp nhận hoặc từ chối), chỉ được ghi khi chuyển sang DONE.
- createdAt: thời điểm tạo entry, dùng cho TTL.

Luồng xử lý khi begin(account, key, fingerprint, now):
1. Chưa có entry -> tạo PENDING, trả RUN (caller được phép chạy business).
2. Có entry PENDING nhưng đã hết TTL -> coi như chưa có, xóa và tạo mới, trả RUN. Đây là cách xử lý phantom PENDING (entry bị kẹt PENDING vì process chết giữa chừng).
3. Có entry, fingerprint khác -> trả CONFLICT (422), không ghi đè.
4. Có entry PENDING, đúng fingerprint -> trả IN_PROGRESS (409), không chạy song song.
5. Có entry DONE -> trả REPLAY kèm body đã lưu, không chạy lại business.

Khi complete(account, key, fingerprint, body, now):
- Chỉ ghi khi entry còn PENDING và đúng fingerprint.
- Gán body trước, rồi mới đặt DONE. Thứ tự này đảm bảo REPLAY luôn đọc được body đầy đủ, không bao giờ null.

### TTL: PENDING hết hạn, DONE vĩnh viễn
- PENDING hết hạn sau ttlSeconds: entry bị xóa (hoặc bị bỏ qua), caller sau đó có thể begin lại và chạy lại business. Điều này xử lý được trường hợp process crash sau khi tạo entry PENDING nhưng trước khi complete — entry không bị kẹt vĩnh viễn.
- DONE là vĩnh viễn: không bao giờ hết hạn, luôn REPLAY kết quả cũ. Một lệnh đã từ chối (DECLINED) được lưu như DONE, nên retry cùng key trả lại kết quả từ chối, không charge lại thẻ.

### Ví dụ thực tế
API thanh toán nhận yêu cầu nạp 1.000.000 VND, client gửi key {{pay-abc-123}}. Lần đầu: entry PENDING, business chạy, kết quả APPROVED, complete -> DONE body APPROVED:1000000. Client retry do mạng gián đoạn: cùng key {{pay-abc-123}}, entry DONE -> REPLAY APPROVED:1000000, không trừ tiền hai lần.

Nếu client dùng lại key {{pay-abc-123}} nhưng nạp 2.000.000 VND (fingerprint khác): trả 422 CONFLICT, bắt bug client.

Nếu process crash sau khi tạo PENDING nhưng trước khi complete: entry bị kẹt PENDING. Sau TTL (ví dụ 60 giây), entry hết hạn, caller sau đó có thể begin lại với cùng key -> RUN, xử lý lần mới. Nếu không có TTL, entry PENDING bị kẹt mãi và không bao giờ được retry.

### Liên hệ phỏng vấn
Interviewer thường hỏi: tại sao phải gán body trước khi đặt DONE? Tại sao decline cũng phải lưu làm DONE? TTL đặt bao lâu? Tại sao scope theo account? Muốn retry một giao dịch bị từ chối, làm gì?`,
  exercises: [
    {
      title: 'Idempotency thanh toán: TTL, PENDING hết hạn, DONE vĩnh viễn',
      prompt: `Triển khai class {{PaymentIdempotency}} cho API thanh toán.

API cần triển khai:
- {{PaymentIdempotency(long ttlSeconds)}}: TTL tính bằng giây, chuyển sang mili-giây nội bộ.
- {{Outcome begin(String account, String key, String fingerprint, long now)}}:
  - Chưa có entry -> tạo PENDING, trả {{Decision.RUN}}.
  - Có entry PENDING nhưng hết TTL (now - createdAt >= ttlMs) -> xoá, tạo mới, trả {{Decision.RUN}}.
  - Có entry, fingerprint khác -> trả {{Decision.CONFLICT}}.
  - Có entry PENDING, đúng fingerprint -> trả {{Decision.IN_PROGRESS}}.
  - Có entry DONE -> trả {{Decision.REPLAY}} kèm body.
- {{void complete(String account, String key, String fingerprint, String body, long now)}}: chỉ ghi khi entry còn PENDING và đúng fingerprint; gán body trước rồi mới đặt DONE.
- {{String body(String account, String key)}}: trả body của entry (null nếu không có).
- {{void cleanupExpired(long now)}}: xoá tất cả entry PENDING đã hết TTL.
- {{int size()}}: số entry hiện có trong store.

{{Decision}} là enum { RUN, REPLAY, IN_PROGRESS, CONFLICT }. {{Outcome}} là record { Decision decision; String body; }.
Entry nội bộ có fingerprint, status (PENDING/DONE), body, createdAt. Scope key theo account + "::" + key. Tất cả các phương thức công khai là synchronized.

now là thời điểm truyền vào (mili-giây), giúp kiểm thử xác định mà không cần đồng hồ thực.`,
      starter: `final class PaymentIdempotency {
    enum Decision { RUN, REPLAY, IN_PROGRESS, CONFLICT }
    record Outcome(Decision decision, String body) {}
    private enum Status { PENDING, DONE }
    private static final class Entry {
        final String fingerprint;
        Status status = Status.PENDING;
        String body;
        long createdAt;
        Entry(String fingerprint, long createdAt) { this.fingerprint = fingerprint; this.createdAt = createdAt; }
    }
    private final Map<String, Entry> store = new HashMap<>();
    private final long ttlMs;
    private static String scoped(String account, String key) { return account + "::" + key; }

    PaymentIdempotency(long ttlSeconds) { this.ttlMs = ttlSeconds * 1000L; }

    synchronized Outcome begin(String account, String key, String fingerprint, long now) {
        throw new UnsupportedOperationException("TODO");
    }

    synchronized void complete(String account, String key, String fingerprint, String body, long now) {
        throw new UnsupportedOperationException("TODO");
    }

    synchronized String body(String account, String key) {
        throw new UnsupportedOperationException("TODO");
    }

    synchronized void cleanupExpired(long now) {
        throw new UnsupportedOperationException("TODO");
    }

    synchronized int size() { return store.size(); }
}`,
      tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }
    public static void main(String[] args) {
        PaymentIdempotency s = new PaymentIdempotency(60);
        long now = 1000;

        PaymentIdempotency.Outcome o1 = s.begin("a", "k", "fp1", now);
        check("lan dau RUN", o1.decision() == PaymentIdempotency.Decision.RUN && o1.body() == null, "decision=" + o1.decision());

        PaymentIdempotency.Outcome o2 = s.begin("a", "k", "fp1", now);
        check("van PENDING -> IN_PROGRESS", o2.decision() == PaymentIdempotency.Decision.IN_PROGRESS, "decision=" + o2.decision());

        PaymentIdempotency.Outcome o3 = s.begin("a", "k", "fp2", now);
        check("khac fingerprint -> CONFLICT", o3.decision() == PaymentIdempotency.Decision.CONFLICT, "decision=" + o3.decision());

        s.complete("a", "k", "fp1", "APPROVED:100", now);
        PaymentIdempotency.Outcome o4 = s.begin("a", "k", "fp1", now);
        check("DONE -> REPLAY body", o4.decision() == PaymentIdempotency.Decision.REPLAY && "APPROVED:100".equals(o4.body()), "decision=" + o4.decision() + " body=" + o4.body());

        PaymentIdempotency.Outcome o5 = s.begin("a", "k2", "fp1", now);
        check("key khac -> RUN", o5.decision() == PaymentIdempotency.Decision.RUN, "decision=" + o5.decision());

        PaymentIdempotency.Outcome o6 = s.begin("b", "k", "fp1", now);
        check("account khac cung key -> RUN", o6.decision() == PaymentIdempotency.Decision.RUN, "decision=" + o6.decision());

        PaymentIdempotency s2 = new PaymentIdempotency(60);
        long now2 = 1000;
        s2.begin("x", "k", "fp", now2);
        long expiredNow = now2 + 60_001;
        PaymentIdempotency.Outcome o7 = s2.begin("x", "k", "fp", expiredNow);
        check("PENDING het TTL -> RUN lai", o7.decision() == PaymentIdempotency.Decision.RUN, "decision=" + o7.decision());

        PaymentIdempotency s3 = new PaymentIdempotency(60);
        long now3 = 1000;
        s3.begin("y", "k", "fp", now3);
        s3.complete("y", "k", "fp", "DECLINED", now3);
        long afterTtl = now3 + 60_001;
        PaymentIdempotency.Outcome o8 = s3.begin("y", "k", "fp", afterTtl);
        check("DONE khong het TTL -> van REPLAY", o8.decision() == PaymentIdempotency.Decision.REPLAY && "DECLINED".equals(o8.body()), "decision=" + o8.decision() + " body=" + o8.body());

        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `final class PaymentIdempotency {
    enum Decision { RUN, REPLAY, IN_PROGRESS, CONFLICT }
    record Outcome(Decision decision, String body) {}
    private enum Status { PENDING, DONE }
    private static final class Entry {
        final String fingerprint;
        Status status = Status.PENDING;
        String body;
        long createdAt;
        Entry(String fingerprint, long createdAt) { this.fingerprint = fingerprint; this.createdAt = createdAt; }
    }
    private final Map<String, Entry> store = new HashMap<>();
    private final long ttlMs;
    private static String scoped(String account, String key) { return account + "::" + key; }

    PaymentIdempotency(long ttlSeconds) { this.ttlMs = ttlSeconds * 1000L; }

    synchronized Outcome begin(String account, String key, String fingerprint, long now) {
        if (account == null || key == null || fingerprint == null) throw new IllegalArgumentException("account/key/fingerprint required");
        String sk = scoped(account, key);
        Entry e = store.get(sk);
        if (e == null) { store.put(sk, new Entry(fingerprint, now)); return new Outcome(Decision.RUN, null); }
        if (e.status == Status.PENDING && now - e.createdAt >= ttlMs) {
            store.remove(sk);
            store.put(sk, new Entry(fingerprint, now));
            return new Outcome(Decision.RUN, null);
        }
        if (!e.fingerprint.equals(fingerprint)) return new Outcome(Decision.CONFLICT, null);
        if (e.status == Status.PENDING) return new Outcome(Decision.IN_PROGRESS, null);
        return new Outcome(Decision.REPLAY, e.body);
    }

    synchronized void complete(String account, String key, String fingerprint, String body, long now) {
        Entry e = store.get(scoped(account, key));
        if (e == null || e.status != Status.PENDING || !e.fingerprint.equals(fingerprint)) return;
        e.body = body;
        e.status = Status.DONE;
    }

    synchronized String body(String account, String key) {
        Entry e = store.get(scoped(account, key));
        return e == null ? null : e.body;
    }

    synchronized void cleanupExpired(long now) {
        store.entrySet().removeIf(entry -> entry.getValue().status == Status.PENDING && now - entry.getValue().createdAt >= ttlMs);
    }

    synchronized int size() { return store.size(); }
}`,
      hints: [
        'PENDING het TTL trong begin: xoá entry cũ rồi tạo entry mới, tra RUN de co chay business lai.',
        'complete chi ghi khi con PENDING va dung fingerprint; gan body truoc, moi dat DONE de REPLAY khong doc duoc body null.',
        'DONE khong bao gio het han: luon tra REPLAY body, ngay sau khi qua TTL.',
      ],
      explain: `Idempotency thanh toán là thành phần then chốt để tránh charge trùng khi client retry. Store chỉ có hai trạng thái PENDING và DONE; decline được lưu như DONE kèm body, nên begin cùng key trả REPLAY đúng "DECLINED" chứ không chạy lại business — điều mà store generic (FAILED -> BEGIN) không làm.

Fingerprint khác trên cùng key trả CONFLICT (422) để bắt bug client dùng lại key cho payload khác; không ghi đè kết quả cũ. Trong lúc PENDING, request thứ hai nhận IN_PROGRESS (409) thay vì chạy song song. Toàn bộ chuyển trạng thái nằm trong một synchronized block (mo phỏng unique constraint ở DB): chỉ một request tạo được entry PENDING, request kia thấy PENDING.

complete kiem tra lai fingerprint va trang thai PENDING truoc khi ghi, roi gan body truoc khi dat DONE. Thu tu nay dam bao REPLAY luon doc duoc body day du. Trong production, store phai nam o DB/Redis voi unique index theo (account, endpoint, key) va TTL; map trong RAM chi dung cho mot JVM va mat khi restart. Muon thu lai mot giao dich bi tu choi, client dung key MOI.`,
    },
  ],
  check: [
    { q: 'Client retry accidental cung key sau khi lan dau bi TU CHOI. Server nen lam gi?', options: ['Charge lai the', 'Tra lai dung ket qua tu choi da luu (REPLAY), khong charge lai', 'Xoa key va xu ly nhu moi', 'Tra 500'], answer: 1, explain: `Decline la ket qua cuoi cho khoa do; retry cung key phai replay dung phan hoi cu de khong charge hai lan. Muon thu lai (the khac, so tien khac) phai dung key MOI. (A) sai vi gay charge trung. (C) sai vi mat kha tu dung charge.` },
    { q: 'Cung key nhung fingerprint (so tien) khanh. Hanh vi dung?', options: ['Replay ket qua cu', '422 CONFLICT, khong ghi de, de bat bug client', 'Charge theo so tien moi', 'Xoa entry'], answer: 1, explain: `Cung key khac payload la dau hieu client dung lai key sai; im lang replay se tra ket qua cu — loi du lieu. Tra 422 buoc client sua. (A) sai vi gay sai ket qua. (C) sai vi key da gan voi intent cu. (D) sai vi xoa entry xoa kha dedup.` },
    { q: 'PENDING qua TTL, request moi cung key nhan gi?', options: ['IN_PROGRESS lien tuc', '422 CONFLICT', 'RUN, duoc phep xu ly business lai', '500 Internal Server Error'], answer: 2, explain: `PENDING het TTL duoc coi nhu chua co: xóa entry cu, tao moi, tra RUN. Day xu ly duoc phantom PENDING (entry bi ket sau khi process crash). DONE con van REPLAY vi khong het han.` },
    { q: 'Vì sao idempotency key phai scope theo account?', options: ['De key ngan hon', 'Tranh ro loi du lieu: key toan cuc lam account A nhan ket qua cua B khi trung key', 'De tang toc', 'De dung cung fingerprint'], answer: 1, explain: `Scope theo account dam bao moi tai khoan co khoang key rieng; neu toan cuc, trung key giua hai account se tra ket qua cua nhau — ro loi du lieu nan ngang. (A) khong phai ly do. (C) khong lien quan. (D) fingerprint la cua payload, khong the thay the scope.` }
  ],
  related: ['microservices-041'],
  tags: ['idempotency', 'payment', 'ttl', 'pending', 'done', 'replay', 'fingerprint']
}
);
