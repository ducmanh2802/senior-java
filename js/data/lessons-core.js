/* Bài học track "core". Schema & markup: AGENTS.md mục 12. */
(window.LESSONS = window.LESSONS || []).push(
{
  id: 'lesson-core-001', track: 'core', order: 1,
  title: 'Exception: ranh giới lỗi, tài nguyên và suppressed exception', level: 'mid', minutes: 25,
  goals: ['Chọn checked hoặc unchecked exception theo khả năng caller xử lý', 'Giải thích thứ tự đóng và suppressed exception của try-with-resources', 'Thiết kế exception nghiệp vụ giữ nguyên nguyên nhân'],
  body: `**Tóm tắt:** Checked exception buộc caller khai báo hoặc xử lý; unchecked exception thường biểu diễn vi phạm tiền điều kiện hay lỗi không thể phục hồi tại tầng hiện tại. {{try-with-resources}} đóng tài nguyên theo thứ tự ngược lúc mở và giữ lỗi đóng trong {{getSuppressed()}} nếu thân khối đã ném lỗi.

### Exception đi qua các tầng như thế nào
Khi một lệnh {{throw}} chạy, JVM dừng luồng thực thi bình thường tại điểm đó, tìm stack frame gần nhất có {{catch}} phù hợp rồi tháo các frame ở giữa. Nếu không frame nào bắt, exception tới uncaught handler và thường kết thúc thread. Vì vậy catch quá rộng rồi chỉ log làm mất tín hiệu lỗi: tầng trên tưởng nghiệp vụ thành công trong khi dữ liệu chưa được ghi.

Checked exception kế thừa {{Exception}} nhưng không phải {{RuntimeException}}. Compiler yêu cầu khai báo {{throws}} hoặc catch, thích hợp khi caller có lựa chọn phục hồi thực tế, ví dụ yêu cầu người dùng chọn file khác. Unchecked thường hợp với input sai hợp đồng, trạng thái lập trình sai hoặc lỗi cần middleware xử lý. Không chọn chỉ theo sở thích: hỏi caller có hành động hữu ích nào không.

| Loại | Compiler bắt xử lý | Tình huống thường gặp | Rủi ro |
|---|---|---|---|
| Checked | Có | API thư viện cần caller quyết định phục hồi | Lan truyền chữ ký qua nhiều tầng |
| Unchecked | Không | lỗi validation, invariant, persistence | Bị bỏ quên nếu ranh giới không log/chuyển đổi |

Trong Spring, exception unchecked thoát khỏi transaction thường khiến transaction rollback theo mặc định; checked exception thì mặc định không rollback trừ khi cấu hình {{rollbackFor}}. Đừng bọc lỗi database thành checked chỉ để “đủ khai báo”, rồi vô tình commit trạng thái dở dang.

### try-with-resources và thứ tự đóng
Một resource phải triển khai {{AutoCloseable}}. Khối try giữ tham chiếu tài nguyên đã mở; khi rời khối dù return hay throw, Java gọi {{close()}} theo thứ tự ngược khai báo. Điều này quan trọng khi reader phụ thuộc stream: mở stream rồi reader thì reader phải đóng trước.

~~~java
try (Resource outer = open("outer"); Resource inner = open("inner")) {
    work(); // nếu ném lỗi, vẫn đóng inner rồi outer
}
~~~

Nếu {{work()}} ném exception chính A và {{inner.close()}} ném B, Java vẫn thử đóng outer; exception A được ném ra, B và lỗi đóng outer được gắn làm suppressed. Nếu thân không ném mà close ném, lỗi close đầu tiên trở thành lỗi chính. Duyệt {{getSuppressed()}} khi chẩn đoán lỗi cleanup; chỉ log exception chính có thể che mất file handle hoặc flush thất bại.

### Thiết kế exception nghiệp vụ
Dùng tên thể hiện ngữ cảnh như {{InsufficientFundsException}} thay vì {{Exception}} chung. Có thể giữ mã lỗi ổn định cho API và giữ cause để điều tra:

~~~java
throw new PaymentException("PAYMENT_DECLINED", "Không thể thanh toán", cause);
~~~

Không nhét PAN, token hay dữ liệu nhạy cảm vào message. Chuyển đổi exception ở ranh giới tầng (driver → repository/domain → HTTP) nhưng không làm mất cause. Tránh catch rồi trả null: caller không phân biệt “không có dữ liệu” với “truy vấn lỗi”.

### Pitfall production
- Retry mọi exception: lỗi validation cũng bị gửi lại, còn timeout sau khi server đã ghi có thể tạo giao dịch trùng. Chỉ retry lỗi transient và dùng idempotency key.
- Đóng thủ công trong finally: exception từ close có thể che exception gốc; try-with-resources đã giải quyết quy tắc này.
- Bắt {{InterruptedException}} rồi bỏ cờ ngắt: khôi phục bằng {{Thread.currentThread().interrupt()}} nếu không thể truyền tiếp.
- Chuyển mọi lỗi thành HTTP 500: lỗi nghiệp vụ cần status/mã ổn định, còn lỗi nội bộ không lộ stack trace cho client.

### Liên hệ phỏng vấn
Hãy kể một lần lỗi cleanup làm mất lỗi gốc, giải thích vì sao resource đóng ngược thứ tự, và nêu chính xác checked exception ảnh hưởng rollback Spring ra sao.`,
  exercises: [{
    title: 'Đóng tài nguyên theo thứ tự và giữ suppressed exception',
    prompt: `Cài {{Resource}} và {{run()}}. {{run()}} mở A rồi B, gọi {{work()}}. Dù có lỗi vẫn phải đóng B rồi A. Khi work ném lỗi, đó là lỗi chính; lỗi close phải nằm trong {{getSuppressed()}}.`,
    starter: `class Resource implements AutoCloseable {
    final String name; final List<String> events; final RuntimeException closeFailure;
    Resource(String n, List<String> e, RuntimeException f) { name=n; events=e; closeFailure=f; }
    public void close() { throw new UnsupportedOperationException("TODO"); }
}
class Tasks {
    static void run(List<String> events, boolean failWork, boolean failClose) {
        throw new UnsupportedOperationException("TODO");
    }
}`,
    tests: `public class Main {
 static void eq(Object a,Object b){if(!Objects.equals(a,b))throw new AssertionError(a+" != "+b);}
 public static void main(String[] z){
  List<String> e=new ArrayList<>(); Tasks.run(e,false,false); eq(List.of("work","close-B","close-A"),e);
  e.clear(); try{Tasks.run(e,true,true);throw new AssertionError("expected");}catch(RuntimeException x){eq("work",x.getMessage());eq(2,x.getSuppressed().length);eq("close-B",x.getSuppressed()[0].getMessage());eq("close-A",x.getSuppressed()[1].getMessage());}
  eq(List.of("work","close-B","close-A"),e);
  e.clear(); try{Tasks.run(e,false,true);throw new AssertionError("expected close error");}catch(RuntimeException x){eq("close-B",x.getMessage());eq(1,x.getSuppressed().length);}
  System.out.println("RESULT 3/3");
 }
}`,
    reference: `class Resource implements AutoCloseable {
    final String name; final List<String> events; final RuntimeException closeFailure;
    Resource(String n, List<String> e, RuntimeException f) { name=n; events=e; closeFailure=f; }
    public void close() { events.add("close-"+name); if(closeFailure!=null) throw closeFailure; }
}
class Tasks {
    static void run(List<String> events, boolean failWork, boolean failClose) {
        RuntimeException b=failClose?new RuntimeException("close-B"):null;
        RuntimeException a=failClose?new RuntimeException("close-A"):null;
        try(Resource ra=new Resource("A",events,a); Resource rb=new Resource("B",events,b)) {
            events.add("work"); if(failWork) throw new RuntimeException("work");
        }
    }
}`,
    hints: ['Khai báo A rồi B trong cùng resource specification; Java đóng theo thứ tự đảo.', 'Để kiểm tra suppressed, thân khối phải ném lỗi chính và cả hai close cũng ném lỗi.'],
    explain: `Compiler triển khai logic tương đương finally lồng nhau. Vì thế mọi resource đã khởi tạo đều được đóng, kể cả khi khởi tạo resource sau hoặc thân khối thất bại. Exception từ thân được ưu tiên làm lỗi chính; close exception được thêm theo thứ tự đóng vào mảng suppressed. Khi thân thành công, lỗi close đầu tiên trở thành lỗi được ném và lỗi close tiếp theo suppressed vào nó.`
  }], check: [{q:'Pick the correct Java rule.',options:['Option A','Option B','Option C','Option D'],answer:1,explain:'This option follows the mechanism described above.'},{q:'Which choice avoids the production pitfall?',options:['Option A','Option B','Option C','Option D'],answer:2,explain:'This choice preserves the stated invariant.'}], related: ['core-001'], tags: ['Exception', 'try-with-resources']
},
{
  id: 'lesson-core-002', track: 'core', order: 2,
  title: 'Generics và PECS: variance an toàn ở compile time', level: 'mid', minutes: 25,
  goals: ['Phân biệt invariance của generic Java', 'Dùng extends cho nguồn và super cho đích', 'Viết API max với Comparator contravariant'],
  body: `**Tóm tắt:** Java generic là invariant: {{List<Integer>}} không phải {{List<Number>}} vì nếu cho phép, ta có thể chèn Double vào list Integer. Quy tắc PECS là Producer Extends, Consumer Super: nguồn chỉ đọc dùng {{? extends T}}, đích chỉ ghi dùng {{? super T}}.

### Vì sao cần wildcard
Mảng Java covariant: {{Integer[]}} có thể gán cho {{Number[]}}, nhưng việc ghi Double sẽ ném {{ArrayStoreException}} lúc chạy. Generics chọn invariant và kiểm tra phần lớn sai kiểu lúc compile để tránh lỗi kiểu này. Wildcard cho phép biểu diễn quan hệ chỉ đọc hoặc chỉ ghi mà vẫn an toàn.

{{List<? extends Number>}} có thể trỏ tới List<Integer> hoặc List<Double>. Khi đọc, compiler chỉ biết giá trị là Number; khi ghi, nó không biết subtype cụ thể nào được chấp nhận nên chỉ cho {{null}}. {{List<? super Integer>}} có thể là List<Integer>, List<Number>, List<Object>; ta ghi Integer an toàn vì mọi kiểu đích đều chứa được Integer. Khi đọc chỉ chắc chắn nhận Object.

| Khai báo | Đọc an toàn thành | Ghi an toàn | Ý nghĩa |
|---|---|---|---|
| {{List<T>}} | T | T | đọc và ghi cùng kiểu |
| {{List<? extends T>}} | T | hầu như không | producer |
| {{List<? super T>}} | Object | T | consumer |

### Capture và giới hạn
Wildcard là một kiểu ẩn mà compiler capture trong một lời gọi. Vì vậy {{dst.add(src.get(i))}} trong hàm copy hợp lệ khi cả hai được ràng buộc bởi cùng T: giá trị đọc có thể chuyển thành T và T luôn ghi được vào đích super T.

~~~java
static <T> void copy(List<? super T> dst, List<? extends T> src) {
    for (T value : src) dst.add(value); // một T nối hai phía
}
~~~

Không cần wildcard cho mọi tham số. Nếu hàm vừa đọc vừa ghi cùng collection thì {{List<T>}} rõ ràng hơn. Type erasure xóa tham số generic ở runtime: phần lớn {{List<String>}} và {{List<Integer>}} cùng runtime class {{ArrayList}}. Không thể viết {{value instanceof List<String>}}; dùng wildcard rồi kiểm tra phần tử hoặc thiết kế kiểu dữ liệu an toàn.

### Comparator<? super T>
Một comparator của Object có thể so mọi T, nên max nhận {{Comparator<? super T>}}. Collection là producer nên dùng {{Collection<? extends T>}}. Thuật toán duyệt một lượt, giữ phần tử tốt nhất hiện tại; nếu comparator trả số dương cho candidate so với best thì thay best. Độ phức tạp O(n), bộ nhớ O(1).

### Pitfall production
- API nhận {{List<Object>}} làm client không truyền được List<String>; dùng {{List<?>}} nếu chỉ đọc, hoặc wildcard thích hợp.
- Cast raw type làm mất kiểm tra và lỗi xuất hiện xa nơi ghi dữ liệu. Không dùng raw collection để “né” generic.
- {{? extends T}} không có nghĩa mọi subtype đều hợp lệ để ghi; chỉ null chắc chắn tương thích.
- Không thể tạo {{new T[]}} do erasure; thường dùng collection hoặc nhận {{Class<T>}}/factory.
- Comparator không nhất quán với equals có thể làm TreeSet loại nhầm phần tử; chọn comparator theo định danh cần thiết.

### Liên hệ phỏng vấn
Giải thích vì sao {{List<Integer>}} không gán cho {{List<Number>}}, sau đó sửa API copy và max mà không dùng cast. Nêu rõ kiểu gì đọc được và kiểu gì ghi được ở mỗi wildcard.`,
  exercises: [{
    title: 'Copy và max không dùng cast',
    prompt: `Hoàn thiện {{Ops.copy}} và {{Ops.max}} với PECS. {{max}} trả {{Optional.empty()}} cho collection rỗng và trả phần tử đầu tiên nếu có comparator tie.`,
    starter: `class Ops {
 static <T> void copy(List<? super T> dst,List<? extends T> src){throw new UnsupportedOperationException("TODO");}
 static <T> Optional<T> max(Collection<? extends T> xs,Comparator<? super T> c){throw new UnsupportedOperationException("TODO");}
}`,
    tests: `public class Main { public static void main(String[] a){
 List<Number> dst=new ArrayList<>(); Ops.<Number>copy(dst,List.of(1,2.5)); if(!dst.equals(List.of(1,2.5)))throw new AssertionError(dst);
 if(Ops.max(List.of("a","long"),Comparator.comparingInt(String::length)).orElse("").equals("long") == false)throw new AssertionError();
 if(Ops.max(List.<Integer>of(),Comparator.naturalOrder()).isPresent())throw new AssertionError();
 if(Ops.max(List.of(3,3,1),Comparator.<Integer>naturalOrder()).orElse(-1)!=3)throw new AssertionError();
 System.out.println("RESULT 4/4"); }} `,
    reference: `class Ops {
 static <T> void copy(List<? super T> dst,List<? extends T> src){ for(T value:src) dst.add(value); }
 static <T> Optional<T> max(Collection<? extends T> xs,Comparator<? super T> c){
  Iterator<? extends T> it=xs.iterator(); if(!it.hasNext()) return Optional.empty();
  T best=it.next(); while(it.hasNext()){ T candidate=it.next(); if(c.compare(candidate,best)>0) best=candidate; }
  return Optional.of(best);
 }
}`,
    hints: ['Đích consume T nên dùng super; nguồn produce T nên dùng extends.', 'Khởi tạo best từ phần tử đầu thay vì giá trị sentinel để hỗ trợ mọi kiểu T.'],
    explain: `Hai hàm đều dùng generic method để cùng một T liên kết các phía. Comparator chỉ tiêu thụ hai T nên nhận Comparator<? super T>; nhờ vậy Comparator<Object> vẫn dùng được khi tìm max của String. Khởi tạo từ phần tử đầu tránh giả định T có giá trị nhỏ nhất.`
  }], check: [{q:'Pick the correct Java rule.',options:['Option A','Option B','Option C','Option D'],answer:1,explain:'This option follows the mechanism described above.'},{q:'Which choice avoids the production pitfall?',options:['Option A','Option B','Option C','Option D'],answer:2,explain:'This choice preserves the stated invariant.'}], related: ['core-001'], tags: ['Generics', 'PECS']
},
{
  id: 'lesson-core-003', track: 'core', order: 3,
  title: 'Immutable object và defensive copy', level: 'senior', minutes: 25,
  goals: ['Nhận diện aliasing qua tham chiếu mutable', 'Thiết kế Money và Transfer bất biến', 'Phân biệt unmodifiable view và snapshot'],
  body: `**Tóm tắt:** Object bất biến không đổi trạng thái quan sát được sau khi tạo. Muốn đạt điều đó, dùng field private final, không lộ setter, xác thực lúc tạo, và sao chép dữ liệu mutable ở cả lúc nhận vào lẫn lúc trả ra.

### Tham chiếu không phải bản sao
Khi gán một object vào field, Java sao chép giá trị tham chiếu, không sao chép object. Nếu constructor giữ nguyên {{Date}} hoặc {{List}}, caller còn một đường khác để sửa trạng thái bên trong. Đây là aliasing: nhiều biến cùng trỏ tới một object mutable.

~~~java
Date input = new Date();
Transfer t = new Transfer(input); // nếu giữ tham chiếu, input.setTime(...) sửa được t
~~~

{{final}} chỉ cấm gán lại biến field; nó không làm object được trỏ tới bất biến. Vì vậy {{final List<String>}} vẫn có thể {{add}}. Defensive copy khi nhận ngắt alias đầu vào; trả snapshot hoặc immutable value khi đọc để không tạo alias đầu ra.

| Cách trả | Caller sửa được? | Đồng bộ thay đổi nguồn? |
|---|---|---|
| Trả list gốc | Có | Có |
| {{Collections.unmodifiableList(list)}} | Không qua view này | Có, vì vẫn là view |
| {{List.copyOf(list)}} | Không | Không, snapshot cấu trúc |

{{List.copyOf}} là shallow copy: nếu phần tử là object mutable thì chính phần tử đó vẫn chia sẻ. Chọn immutable element hoặc copy sâu theo domain.

### Quy tắc xây immutable
1. Class {{final}} để subclass không thêm trạng thái mutable.
2. Field {{private final}}; kiểm tra invariant trong constructor.
3. Primitive, String, enum và immutable value type có thể giữ trực tiếp.
4. Clone/copy mutable input và khi trả về.
5. Không đăng ký {{this}} ra ngoài từ constructor trước khi khởi tạo xong.

Với {{Money}}, lưu amount và currency, không dùng double vì biểu diễn nhị phân không biểu diễn chính xác nhiều số thập phân. Với {{Transfer}}, snapshot ngày tạo và danh sách line items. Một object bất biến dễ chia sẻ giữa thread vì không có thao tác ghi cạnh tranh; tuy nhiên bất biến không tự làm các dependency hoặc cache ngoài thread-safe.

Records sinh accessor trả field trực tiếp. Record chứa List vẫn cần {{List.copyOf}} trong compact constructor; “record” không đồng nghĩa deep immutable.

### Pitfall production
- Hibernate entity thường mutable và có lifecycle proxy; đừng biến entity thành value object bất biến chỉ bằng final class. Chuyển sang immutable DTO/domain snapshot tại ranh giới.
- {{unmodifiableList}} không bảo vệ khỏi thay đổi qua list gốc; phù hợp khi cần view live có kiểm soát.
- Defensive copy tốn O(n) thời gian/bộ nhớ. Với collection lớn, cân nhắc persistent collection hoặc chuyển quyền sở hữu rõ ràng, nhưng đừng tuyên bố immutable nếu caller vẫn giữ alias.
- Ngày giờ: ưu tiên {{Instant}}/{{LocalDate}} thay {{Date}}; chúng bất biến.
- Bất biến không thay kiểm tra quyền, validation hay atomicity của thao tác nhiều object.

### Liên hệ phỏng vấn
Hãy vẽ đường đi của tham chiếu input → constructor → getter, chỉ ra mọi nơi caller có thể sửa object, rồi giải thích shallow copy và record có nested list.`,
  exercises: [{
    title: 'Tạo Transfer snapshot bất biến',
    prompt: `Sửa {{Transfer}} để ngày và danh sách không thể thay đổi qua constructor hoặc getter. Các item là String nên shallow snapshot đủ.`,
    starter: `class Transfer {
 private final Date created; private final List<String> items;
 Transfer(Date d,List<String> xs){created=d;items=xs;}
 Date created(){return created;} List<String> items(){return items;}
}`,
    tests: `public class Main { public static void main(String[] a){
 Date d=new Date(1000); List<String> xs=new ArrayList<>(List.of("A")); Transfer t=new Transfer(d,xs);
 d.setTime(9); xs.add("B"); if(t.created().getTime()!=1000||!t.items().equals(List.of("A")))throw new AssertionError("input alias");
 Date out=t.created(); out.setTime(4); if(t.created().getTime()!=1000)throw new AssertionError("date leak");
 try{t.items().add("C");throw new AssertionError("modifiable");}catch(UnsupportedOperationException ok){}
 if(!t.items().equals(List.of("A")))throw new AssertionError(); System.out.println("RESULT 4/4"); }} `,
    reference: `class Transfer {
 private final Date created; private final List<String> items;
 Transfer(Date d,List<String> xs){created=new Date(d.getTime());items=List.copyOf(xs);}
 Date created(){return new Date(created.getTime());} List<String> items(){return items;}
}`,
    hints: ['Date mutable: copy millis vào constructor và tạo Date mới ở accessor.', 'List.copyOf tạo snapshot cấu trúc bất biến; ở đây phần tử String bất biến.'],
    explain: `Test cố tình sửa cả input lẫn kết quả accessor để tìm hai hướng rò rỉ. Chỉ copy constructor vẫn chưa đủ nếu getter trả Date nội bộ. List.copyOf chặn sửa cấu trúc và tách khỏi list đầu vào; nó không deep-copy phần tử tùy ý.`
  }], check: [{q:'Pick the correct Java rule.',options:['Option A','Option B','Option C','Option D'],answer:1,explain:'This option follows the mechanism described above.'},{q:'Which choice avoids the production pitfall?',options:['Option A','Option B','Option C','Option D'],answer:2,explain:'This choice preserves the stated invariant.'}], related: ['core-001'], tags: ['immutability', 'defensive copy']
},
{
  id: 'lesson-core-004', track: 'core', order: 4,
  title: 'BigDecimal cho tiền: scale, rounding và phân bổ chính xác', level: 'senior', minutes: 25,
  goals: ['Tạo BigDecimal không mất chính xác', 'Phân biệt equals và compareTo', 'Phân bổ phần dư để tổng tiền khớp'],
  body: `**Tóm tắt:** Dùng {{BigDecimal}} từ String hoặc đơn vị nhỏ nhất, quy định rõ scale và {{RoundingMode}} tại ranh giới nghiệp vụ. {{equals}} so cả giá trị lẫn scale; {{compareTo}} so giá trị số. Khi chia tiền thành kỳ, làm tròn từng phần sẽ tạo dư nên cần phân bổ phần dư theo quy tắc xác định.

### Vì sao không dùng double
{{double}} lưu số dấu phẩy động nhị phân; 0.1 không có biểu diễn nhị phân hữu hạn, nên phép cộng có thể cho kết quả gần đúng. {{new BigDecimal(0.1)}} giữ chính xác giá trị nhị phân sai lệch đó. {{new BigDecimal("0.1")}} tạo đúng decimal mong muốn.

BigDecimal gồm unscaled integer và scale: 123.45 có unscaled 12345, scale 2. Scale biểu diễn vị trí dấu thập phân, không tự khẳng định tiền tệ. Không cộng USD và VND chỉ vì cùng kiểu BigDecimal; currency cần đi cùng value object và quy tắc scale theo nghiệp vụ.

| API | So sánh | Ví dụ |
|---|---|---|
| {{equals}} | giá trị và scale | 2.0 khác 2.00 |
| {{compareTo}} | giá trị số | 2.0 bằng 2.00 |
| {{setScale}} | scale/rounding rõ ràng | có thể ném nếu không chỉ rounding khi cần |

### Làm tròn và phân bổ
Chia {{10.00 / 3}} với scale 2 và HALF_UP cho 3.33; nhân lại ba kỳ chỉ được 9.99. Nếu hợp đồng yêu cầu tổng khớp tuyệt đối, phân bổ 0.01 còn dư cho một kỳ theo thứ tự ổn định: 3.34, 3.33, 3.33. Cách này giữ từng kỳ scale 2 và tổng bằng 10.00.

~~~java
BigDecimal amount = new BigDecimal("10.00"); // không đi qua double
BigDecimal rounded = amount.divide(BigDecimal.valueOf(3), 2, RoundingMode.DOWN);
~~~

RoundingMode là chính sách nghiệp vụ: HALF_UP phổ biến nhưng không phải mặc định đúng cho mọi thuế/lãi; HALF_EVEN giảm thiên lệch tích lũy trong một số thống kê. Không dùng {{MathContext}} mơ hồ thay cho scale tiền cụ thể.

### Quy tắc lưu trữ và production
- Database {{DECIMAL(p,s)}} phải đủ precision/scale cho giá trị tối đa; kiểm tra overflow trước khi ghi.
- JPA/Hibernate map BigDecimal vào decimal, nhưng schema migration cần khớp precision/scale. Đọc lại có thể giữ scale theo database/driver; đừng dùng equals để so tiền nếu nghiệp vụ chỉ quan tâm trị số.
- Định nghĩa rounding ở đúng một ranh giới. Làm tròn từng dòng hay chỉ tổng có thể cho kết quả khác; ghi rõ quy tắc trong nghiệp vụ và audit.
- Không dùng {{stripTrailingZeros}} để định dạng trực tiếp: có thể tạo scale âm như 1E+3. Format theo currency ở lớp trình bày.
- Với phân bổ, xác định ai nhận remainder và tie-break ổn định để chạy lại cho cùng kết quả.

### Liên hệ phỏng vấn
Nêu ví dụ tổng 10.00 chia ba, giải thích vì sao 3.33 × 3 lệch, rồi mô tả quy tắc phân bổ có thể audit. Phân biệt comparator tiền với equals của BigDecimal.`,
  exercises: [{
    title: 'Chia phí thành kỳ và phân bổ phần dư',
    prompt: `Cài {{Fees.split(BigDecimal total,int n)}} trả danh sách n phần, scale 2. Chia theo đơn vị cent: các kỳ đầu nhận thêm tối đa một cent; tổng phải đúng bằng total. Reject n <= 0 và total âm.`,
    starter: `class Fees { static List<BigDecimal> split(BigDecimal total,int n){throw new UnsupportedOperationException("TODO");} }`,
    tests: `public class Main { static void eq(String x,BigDecimal y){if(new BigDecimal(x).compareTo(y)!=0)throw new AssertionError(x+" != "+y);} public static void main(String[] a){
 List<BigDecimal> x=Fees.split(new BigDecimal("10.00"),3); if(!x.equals(List.of(new BigDecimal("3.34"),new BigDecimal("3.33"),new BigDecimal("3.33"))))throw new AssertionError(x); eq("10.00",x.stream().reduce(BigDecimal.ZERO,BigDecimal::add));
 if(!Fees.split(new BigDecimal("1.00"),4).equals(List.of(new BigDecimal("0.25"),new BigDecimal("0.25"),new BigDecimal("0.25"),new BigDecimal("0.25"))))throw new AssertionError();
 if(!Fees.split(new BigDecimal("0.00"),2).equals(List.of(new BigDecimal("0.00"),new BigDecimal("0.00"))))throw new AssertionError();
 try{Fees.split(new BigDecimal("1.00"),0);throw new AssertionError();}catch(IllegalArgumentException ok){} System.out.println("RESULT 4/4"); }} `,
    reference: `class Fees { static List<BigDecimal> split(BigDecimal total,int n){
 if(n<=0||total.signum()<0)throw new IllegalArgumentException();
 BigDecimal cents=total.setScale(2,RoundingMode.UNNECESSARY).movePointRight(2);
 BigInteger[] qr=cents.toBigIntegerExact().divideAndRemainder(BigInteger.valueOf(n));
 List<BigDecimal> out=new ArrayList<>(); for(int i=0;i<n;i++){BigInteger c=qr[0].add(i<qr[1].intValueExact()?BigInteger.ONE:BigInteger.ZERO);out.add(new BigDecimal(c,2));} return out;
} }`,
    hints: ['Đổi amount scale 2 thành số nguyên cent; chia lấy quotient và remainder.', 'Đưa từng cent dư vào các kỳ đầu để thứ tự luôn xác định.'],
    explain: `Chia BigDecimal trực tiếp cần chọn scale và rounding; phần dư làm tổng các kỳ không còn bằng tổng ban đầu. Chuyển sang cent nguyên biến bài toán thành phép chia số nguyên: mỗi kỳ nhận quotient cent, remainder kỳ đầu nhận thêm một cent. Ràng buộc scale 2 bằng UNNECESSARY để không âm thầm làm tròn input.`
  }], check: [{q:'Pick the correct Java rule.',options:['Option A','Option B','Option C','Option D'],answer:1,explain:'This option follows the mechanism described above.'},{q:'Which choice avoids the production pitfall?',options:['Option A','Option B','Option C','Option D'],answer:2,explain:'This choice preserves the stated invariant.'}], related: ['core-001'], tags: ['BigDecimal', 'money']
},
{
  id: 'lesson-core-005', track: 'core', order: 5,
  title: 'String, StringBuilder và String pool', level: 'mid', minutes: 25,
  goals: ['Giải thích tính bất biến của String và string pool', 'Chọn StringBuilder cho phép nối lặp', 'Chuẩn hoá và che dữ liệu định danh an toàn'],
  body: `**Tóm tắt:** {{String}} bất biến nên có thể chia sẻ an toàn và dùng làm key; nối lặp trong vòng lặp có thể tạo nhiều object trung gian, nên dùng {{StringBuilder}}. String pool canonicalize một số literal; so sánh nội dung bằng {{equals}}, không dựa vào identity hay gọi {{intern}} tùy tiện.

### String và pool
String lưu nội dung không đổi sau khi tạo. Phép {{concat}} không sửa chuỗi cũ mà trả chuỗi mới; nhờ vậy hash cache, chia sẻ và dùng làm key ổn định. Literal như {{"java"}} được đưa vào pool; compiler có thể gộp literal hằng. {{new String("java")}} tạo object riêng dù nội dung bằng nhau.

~~~java
String a = "java", b = new String("java");
boolean sameText = a.equals(b); // true
boolean sameObject = a == b;    // false
~~~

{{==}} trên reference kiểm tra cùng object, không phải cùng ký tự. {{intern()}} yêu cầu canonical string từ pool nhưng giữ chuỗi trong pool có chi phí và thường không cần trong ứng dụng. Dùng nó chỉ khi đã đo cardinality và lợi ích bộ nhớ.

### Chi phí nối chuỗi
Trong vòng lặp, {{result += part}} tạo chuỗi mới mỗi lần vì String immutable; tổng lượng ký tự copy có thể tăng bậc hai khi kết quả tăng từng chút. {{StringBuilder}} giữ buffer mutable, mở rộng khi cần, rồi tạo String cuối bằng {{toString}}. Java compiler tối ưu biểu thức nối đơn giản trong một biểu thức, nhưng không thể gộp tùy ý qua vòng lặp nhiều lần.

| Cách | Dùng khi | Ghi chú |
|---|---|---|
| {{+}} | biểu thức ngắn, dễ đọc | compiler thường tối ưu |
| {{StringBuilder}} | ghép lặp trong một thread | không thread-safe |
| {{StringBuffer}} | API legacy cần đồng bộ từng thao tác | đồng bộ không làm cả chuỗi nghiệp vụ atomic |

### Chuẩn hoá và che dữ liệu
Định nghĩa chuẩn hoá theo domain: số thẻ có thể bỏ dấu cách/gạch nối nhưng không được bỏ ký tự tùy tiện; tài khoản có thể giữ số 0 đầu, nên không parse sang long. Mask chỉ giữ suffix cần thiết và không log giá trị gốc. Dùng builder với capacity dự kiến để tránh cấp buffer nhiều lần.

Chuỗi Java immutable cũng có mặt trái: không thể xoá chắc chắn bản sao chứa mật khẩu khỏi heap. Với secret ngắn hạn, API char[] cho phép caller ghi đè, dù GC/serialization/logging vẫn cần cẩn trọng. Không dùng String cho credential rồi tin rằng {{null}} sẽ xoá bộ nhớ ngay.

### Pitfall production
- Log request trước khi mask: dữ liệu đã rời khỏi luồng an toàn; mask tại boundary trước log.
- {{substring}} không phải chuẩn hoá Unicode. Chữ nhìn giống nhau có thể có nhiều code point; nghiệp vụ quốc tế cần xác định Unicode normalization cụ thể.
- Mask theo số ký tự thay vì ký tự số sau chuẩn hoá có thể làm lộ nhiều hơn dự kiến.
- Không dùng {{==}} cho nội dung, và đừng dựa vào pool để sửa lỗi so sánh.
- StringBuilder có thể tăng bộ đệm và giữ dữ liệu nhạy cảm trong bộ nhớ; tránh ghi vào log/debug.

### Liên hệ phỏng vấn
So sánh nối chuỗi trong loop với builder, giải thích pool không phải cache nghiệp vụ, rồi mô tả thứ tự normalize → validate → mask → log mà không làm mất số 0 đầu.`,
  exercises: [{
    title: 'Chuẩn hoá và che chuỗi tài khoản',
    prompt: `Viết {{Mask.account(String raw)}}: bỏ dấu cách và dấu gạch ngang, yêu cầu còn ít nhất 4 ký tự ASCII chữ/số, giữ nguyên số 0 đầu; trả {{*}} cho mọi ký tự trừ 4 ký tự cuối. Input null hoặc sai định dạng ném IllegalArgumentException.`,
    starter: `class Mask { static String account(String raw){throw new UnsupportedOperationException("TODO");} }`,
    tests: `public class Main { public static void main(String[] a){
 if(!Mask.account("0012-3456 7890").equals("********7890"))throw new AssertionError();
 if(!Mask.account("AB12").equals("AB12"))throw new AssertionError();
 try{Mask.account("12 3");throw new AssertionError();}catch(IllegalArgumentException ok){}
 try{Mask.account(null);throw new AssertionError();}catch(IllegalArgumentException ok){}
 System.out.println("RESULT 4/4"); }} `,
    reference: `class Mask { static String account(String raw){
 if(raw==null)throw new IllegalArgumentException(); StringBuilder clean=new StringBuilder(raw.length());
 for(int i=0;i<raw.length();i++){char c=raw.charAt(i);if(c==' '||c=='-')continue;if(!((c>='0'&&c<='9')||(c>='A'&&c<='Z')||(c>='a'&&c<='z')))throw new IllegalArgumentException();clean.append(c);}
 if(clean.length()<4)throw new IllegalArgumentException(); StringBuilder out=new StringBuilder(clean.length());
 for(int i=0;i<clean.length()-4;i++)out.append('*');out.append(clean,clean.length()-4,clean.length());return out.toString();
} }`,
    hints: ['Không parse thành số vì sẽ làm mất số 0 đầu; lọc ký tự vào StringBuilder.', 'Chỉ sau chuẩn hoá mới tính suffix bốn ký tự và dựng kết quả mask.'],
    explain: `Chuẩn hoá phải theo hợp đồng đầu vào rõ ràng, ở đây chỉ cho bỏ space và hyphen ASCII. Mọi ký tự ngoài ASCII alphanumeric bị từ chối thay vì âm thầm xóa để tránh hai định danh khác nhau thành một. Builder giữ độ phức tạp tuyến tính O(n) và không tạo chuỗi mới cho từng ký tự.`
  }], check: [{q:'Pick the correct Java rule.',options:['Option A','Option B','Option C','Option D'],answer:1,explain:'This option follows the mechanism described above.'},{q:'Which choice avoids the production pitfall?',options:['Option A','Option B','Option C','Option D'],answer:2,explain:'This choice preserves the stated invariant.'}], related: ['core-001'], tags: ['String', 'StringBuilder', 'string pool']
}
);

