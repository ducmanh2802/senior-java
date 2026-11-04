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
},
{
  id: 'lesson-core-006', track: 'core', order: 6,
  title: 'equals, hashCode, compareTo: bộ ba quyết định hành vi trong collection', level: 'senior', minutes: 30,
  goals: ['Nói được mặc định của Object.equals và vì sao value type phải override', 'Giữ đúng hợp đồng equals/hashCode và điều kiện compareTo nhất quán với equals', 'Viết Money bất biến dùng an toàn trong HashMap, HashSet, TreeSet và biết record sinh những gì'],
  body: `**Tóm tắt:** {{equals}} trả lời "hai object này có phải cùng một giá trị không", {{hashCode}} quyết định object được đặt vào bucket nào của bảng băm, {{compareTo}} trả lời "object này đứng trước hay sau object kia". Bộ ba phải khớp nhau: {{equals}} và {{hashCode}} lệch nhau làm {{HashMap}} không tìm thấy key đã put; {{compareTo}} gộp hai giá trị mà {{equals}} coi là khác làm {{TreeSet}} âm thầm bỏ bản ghi.

### Mặc định của Object: "tôi là tôi"
Mọi class đều kế thừa {{Object}}, nên bạn nhận miễn phí {{equals}} và {{hashCode}}. Bản gốc của {{equals}} so bằng {{==}}, tức "hai biến có trỏ tới cùng một vùng nhớ không". Vì vậy hai lần viết {{new Money(1000, "USD")}} luôn là hai key khác nhau, dù với kế toán chúng là cùng một số tiền. Bản gốc {{hashCode}} sinh số từ danh tính object trong bộ nhớ, cũng không nhìn vào nội dung.
Bạn PHẢI override khi class của mình là **value type**: giá trị tự nó có nghĩa (tiền, ngày, toạ độ, khoá phức hợp gồm nhiều cột). Bạn KHÔNG cần override khi muốn đúng nghĩa "cùng một đối tượng" (một entity đang được quản lý, một object khoá {{synchronized}}, một cache đang mutate).

### Ai gọi method nào
| Cấu trúc | Khi thêm hoặc tìm phần tử nó dùng | Nếu làm sai |
|---|---|---|
| {{HashMap}}, {{HashSet}} | {{hashCode}} để chọn bucket, rồi {{equals}} để xác nhận phần tử trong bucket | {{get}} trả null dù key đã được put; set chứa trùng |
| {{TreeMap}}, {{TreeSet}} | {{compareTo}} (hoặc {{Comparator}}) để đi xuống cây; kết quả 0 nghĩa là "đã có rồi" | Mất bản ghi mà không có cảnh báo |
| {{List.contains}}, {{distinct}}, {{removeIf}} | chỉ {{equals}} | Vẫn đúng nhưng tốn O(n) |

> {{String}} và {{Integer}} đã override cả ba method, nên bạn dùng chúng làm key hàng năm trời mà không phải nghĩ. Với class tự viết, phần "miễn phí" đó không tồn tại.

### Hợp đồng equals: năm điều
1. **Phản xạ**: {{x.equals(x)}} luôn đúng.
2. **Đối xứng**: {{x.equals(y)}} và {{y.equals(x)}} phải giống nhau. hay vỡ nhất khi class con thêm field: {{Point}} so với {{ColorPoint}} — chiều nhìn từ cha bỏ qua màu nên bằng, chiều nhìn từ con bắt bằng màu nên khác.
3. **Bắt cầu**: nếu {{a}} bằng {{b}} và {{b}} bằng {{c}} thì {{a}} phải bằng {{c}}. Hay vỡ khi định nghĩa "gần đúng" kiểu {{Math.abs(a - b) < 0.01}}: a gần b, b gần c nhưng a có thể không gần c.
4. **Nhất quán**: field không đổi thì kết quả không đổi trong suốt lần chạy chương trình.
5. **Với null**: {{x.equals(null)}} phải trả {{false}}, không được ném exception.

Khuôn an toàn cho một value type bất biến:

~~~java
@Override public boolean equals(Object o) {
    if (this == o) return true;                    // đường tắt, và đúng cả khi o là chính nó
    if (!(o instanceof Money m)) return false;     // instanceof với null cho false: khỏi cần check null riêng
    return amountMinor == m.amountMinor && currency.equals(m.currency);
}
~~~

{{o instanceof Money m}} là pattern matching for instanceof (Java 16 trở lên): đúng kiểu thì bind luôn vào biến {{m}}. Trước Java 16 phải viết hai dòng {{if (!(o instanceof Money)) return false; Money m = (Money) o;}}.

### Hợp đồng hashCode: tấm bản đồ tới bucket
{{HashMap}} chỉ nhìn vào MỘT bucket cho một khoá: nó dùng {{hashCode}} để chọn bucket, rồi dùng {{equals}} để tìm trong danh sách của bucket đó. Suy ra quy tắc duy nhất: **nếu {{a.equals(b)}} thì {{a.hashCode() == b.hashCode()}}**. Vi phạm thì hai object "bằng nhau" nằm ở hai bucket khác nhau, {{get}} không bao giờ gặp nhau để mà so {{equals}}, kết quả là {{null}}.
Chiều ngược lại được phép: hai object khác nhau CÓ THỂ cùng hashCode (gọi là va chạm). Cái giá không phải tính đúng đắn mà là tốc độ: cùng bucket thì chuỗi dài ra, {{get}} trong bucket thành O(n).

~~~java
@Override public int hashCode() {                  // dùng ĐÚNG các field mà equals dùng
    return Objects.hash(amountMinor, currency);
}
~~~

{{Objects.hash}} tiện nhưng mỗi lần gọi cấp phát một mảng và đóng gói {{long}} thành {{Long}}; trong vòng lặp nóng hãy viết tay:

~~~java
@Override public int hashCode() {
    int r = Long.hashCode(amountMinor);
    return 31 * r + currency.hashCode();           // 31 là số nguyên tố lẻ: nhân rồi cộng giúp lan bit đều
}
~~~

### Key mutable: lỗi "mất tiền trong map"
{{hashCode}} còn phải **ổn định suốt thời gian object nằm trong collection**. Đây là lỗi kinh điển với khoá mutable:

~~~text
put(k, "orders/1")   hash(k) = 7    entry nằm ở bucket 7
k.currency = "EUR"   hash(k) = 3    trạng thái đã đổi sau khi put
get(k)               hash(k) = 3    nhìn vào bucket 3 (trống) => null
remove(k)                        cũng null: bucket 7 không còn ai tìm ra => rò rỉ bộ nhớ
~~~

Vì vậy field tham gia tính hash nên là {{final}}, và khoá nên là record hoặc class bất biến. Nếu buộc dùng object mutable làm khoá thì đừng sửa nó khi còn trong map, nhưng tốt nhất là đừng thiết kế như vậy.

### compareTo và "nhất quán với equals"
{{Comparable<Money>}} khai báo thứ tự tự nhiên của kiểu. {{TreeSet}} không gọi {{equals}} để quyết định "đã có chưa", mà dựa vào {{compareTo}} trả về 0. Nếu {{compareTo}} bỏ qua {{currency}}:

~~~java
public int compareTo(Money o) { return Long.compare(amountMinor, o.amountMinor); }   // SAI khi dùng TreeSet
~~~

thêm {{USD 1000}} rồi {{EUR 1000}} vào {{TreeSet}} chỉ còn MỘT phần tử: số tiền biến mất im lặng. Điều kiện cần là {{compareTo(x, y)}} trả 0 khi và chỉ khi {{x.equals(y)}} (tài liệu tiếng Anh gọi là *consistent with equals*). Với tiền có hai thiết kế hợp lệ, chọn theo nghiệp vụ:
- **Chỉ so sánh trong cùng tiền tệ**: khác {{currency}} thì ném {{IllegalArgumentException}}. An toàn nhất vì mọi phép so sánh đều có nghĩa, nhưng không sort được một danh sách hỗn hợp tiền tệ.
- **So số tiền trước, lấy tiền tệ làm tie-break**: so {{amountMinor}} trước, nếu bằng 0 thì so tiếp {{currency.compareTo(o.currency)}}. Sort được mọi thứ, hợp lý với bảng kê đa tiền tệ.

Đừng bao giờ trả hiệu số bằng phép trừ: {{(int)(a - b)}} với {{a = 5_000_000_000L}} và {{b = 0}} bị cắt xuống int ra số âm, thứ tự đảo ngược mà không báo lỗi. Luôn dùng {{Long.compare}}, {{Integer.compare}}; với chuỗi dùng {{String.compareTo}}.

### Money: invariant và phép cộng
~~~java
Money add(Money other) {
    if (other == null) throw new IllegalArgumentException("other null");
    if (!currency.equals(other.currency))               // ràng buộc CHÉO giữa hai instance, record không tự sinh được
        throw new IllegalArgumentException("Không cộng được " + currency + " với " + other.currency);
    return new Money(Math.addExact(amountMinor, other.amountMinor), currency);
}
~~~

{{amountMinor}} là số đơn vị nhỏ nhất (cent) kiểu {{long}}: 10.00 USD thành 1000. Dùng số nguyên để tránh dấu phẩy động nhị phân không biểu diễn đúng 0.1 ({{double}} cộng dồn sẽ lệch). {{Math.addExact}} ném {{ArithmeticException}} khi tràn thay vì quay số sang âm: trong nghiệp vụ tiền, một số dư tràn thành âm là tai nạn không ai muốn phát hiện sau một năm.

### Record có thay được phần này không
~~~java
record Money(long amountMinor, String currency) implements Comparable<Money> {
    Money {                                       // compact constructor: chỉ validate, không cần gán lại
        if (currency == null || currency.length() != 3) throw new IllegalArgumentException("Cần mã ISO 4217 3 ký tự");
    }
    public int compareTo(Money o) { return 0; }   // vẫn phải tự viết
}
~~~

Record tự sinh {{equals}}, {{hashCode}}, {{toString}} và accessor dựa trên TẤT CẢ component, nên "quên một field trong hashCode" không còn là chỗ để sai. Record **không** tự sinh {{compareTo}}; record có field {{List}} vẫn phải {{List.copyOf}} trong compact constructor; và ràng buộc chéo giữa hai instance như {{add}} vẫn là việc của bạn.

### Pitfall production
- Thêm field vào {{equals}} mà quên {{hashCode}} hoặc ngược lại. Hãy grep tên field và sửa cả hai chỗ: hai method phải liệt kê cùng một danh sách field.
- {{hashCode}} trả một hằng số cho mọi object: vẫn đúng hợp đồng nhưng mọi khoá dồn vào một bucket, {{HashMap}} thoái hoá thành danh sách liên kết, CPU tăng bất thường dưới tải.
- {{equals}} gọi {{field.equals(...)}} trên field có thể null → NPE. Dùng {{Objects.equals(a, b)}}.
- So sánh bằng {{getClass() != other.getClass()}} khi object bị proxy (Hibernate): proxy luôn khác class nên mọi lookup thất bại âm thầm.
- Dùng cùng một class vừa làm entity mutable vừa làm khoá trong {{HashMap}}: bug lộ ra sau vài giờ chạy và không reproduce được trong unit test.
- Hai {{Comparator}} khác nhau cho cùng một kiểu, một chỗ dùng {{TreeSet}} một chỗ dùng {{sorted()}}: khái niệm "đã tồn tại" cho kết quả khác nhau. Tài liệu hoá rõ thứ tự nào được coi là duy nhất.

### Liên hệ phỏng vấn
Câu hỏi đào sâu thường là: vì sao {{equals}} cần cả {{this == o}} lẫn {{instanceof}}, làm gì khi phải thêm field vào khoá đã nằm trong map đang chạy (đáp án: migrate lại map hoặc đổi sang khoá record, đừng sửa hợp đồng retro), vì sao {{TreeSet}} nguy hiểm hơn {{HashSet}} khi {{compareTo}} không nhất quán, và khi nào chọn {{TreeSet}} thay {{HashSet}} (cần thứ tự, cần {{first()}}/{{last()}}/{{headSet()}}). Trả lời bằng cách vẽ đường đi của một lệnh {{put}} rồi chỉ đúng chỗ hợp đồng bị phá.`,
  exercises: [{
    title: 'Money bất biến dùng an toàn trong HashMap, HashSet, TreeSet',
    prompt: `Viết {{Money}} là value type bất biến: {{amountMinor}} là số đơn vị nhỏ nhất (cent) và {{currency}} là mã tiền tệ ISO 4217 — chuẩn quốc tế ba chữ cái in hoa như USD, EUR, VND.
Yêu cầu:
- Constructor từ chối {{currency}} null, độ dài khác 3, hoặc chứa ký tự ngoài A-Z bằng {{IllegalArgumentException}}.
- {{equals}} và {{hashCode}} dựa trên CẢ HAI field; {{equals(null)}} và so với kiểu khác trả {{false}}.
- {{add}} trả {{Money}} mới, không làm thay đổi hai số hạng; khác {{currency}} hoặc {{other}} null thì ném {{IllegalArgumentException}}; dùng {{Math.addExact}} để bắt tràn số.
- {{compareTo}} chỉ so hai {{Money}} cùng {{currency}}; khác {{currency}} ném {{IllegalArgumentException}}.
- {{amountMinor()}} và {{currency()}} là accessor.
Test sẽ dùng {{HashSet}}, {{TreeSet}}, {{HashMap}} và {{Collections.sort}} để kiểm tra hành vi thật, không chỉ kiểm tra giá trị trả về.`,
    starter: `final class Money implements Comparable<Money> {
    private final long amountMinor;
    private final String currency;

    Money(long amountMinor, String currency) {
        this.amountMinor = amountMinor;
        this.currency = currency;
        throw new UnsupportedOperationException("TODO");   // kiểm tra currency ở đây
    }
    long amountMinor() { return amountMinor; }
    String currency() { return currency; }
    Money add(Money other) { throw new UnsupportedOperationException("TODO"); }
    @Override public boolean equals(Object o) { throw new UnsupportedOperationException("TODO"); }
    @Override public int hashCode() { throw new UnsupportedOperationException("TODO"); }
    @Override public int compareTo(Money other) { throw new UnsupportedOperationException("TODO"); }
}`,
    tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }
    static void guard(String name, Supplier<Boolean> body) {
        try { check(name, body.get(), "điều kiện không đạt"); }
        catch (Throwable t) { check(name, false, t.getClass().getSimpleName() + ": " + t.getMessage()); }
    }
    static boolean rejects(Supplier<?> body) {
        try { body.get(); return false; } catch (IllegalArgumentException expected) { return true; }
    }
    public static void main(String[] args) {
        guard("hai Money cung gia tri thi equals va cung hashCode", () -> {
            Money a = new Money(1000, "USD"), b = new Money(1000, "USD");
            return a.equals(b) && b.equals(a) && a.hashCode() == b.hashCode()
                && a.equals(a) && !a.equals(null) && !a.equals("USD 1000");
        });
        guard("HashSet khong giu hai phan tu trung gia tri", () ->
            new HashSet<>(List.of(new Money(500, "VND"), new Money(500, "VND"), new Money(600, "VND"))).size() == 2);
        guard("khac tien te thi khong equals du cung so tien", () -> {
            Money a = new Money(1000, "USD"), b = new Money(1000, "EUR");
            return !a.equals(b) && !b.equals(a);
        });
        guard("add tra object moi va khong lam doi hai so hang", () -> {
            Money a = new Money(700, "USD"), b = new Money(450, "USD"), sum = a.add(b);
            return sum.amountMinor() == 1150 && sum.currency().equals("USD")
                && a.amountMinor() == 700 && b.amountMinor() == 450;
        });
        guard("add hai tien te khac nhau bi tu choi", () -> rejects(() -> new Money(100, "USD").add(new Money(100, "EUR"))));
        guard("compareTo va Collections.sort sap xep theo so tien", () -> {
            List<Money> xs = new ArrayList<>(List.of(new Money(300, "USD"), new Money(100, "USD"), new Money(200, "USD")));
            Collections.sort(xs);
            return xs.get(0).amountMinor() == 100 && xs.get(1).amountMinor() == 200 && xs.get(2).amountMinor() == 300
                && xs.get(0).compareTo(xs.get(2)) < 0 && xs.get(2).compareTo(xs.get(0)) > 0 && xs.get(1).compareTo(new Money(200, "USD")) == 0;
        });
        guard("TreeSet dung compareTo de loai trung va khong gop hai tien te", () -> {
            TreeSet<Money> ts = new TreeSet<>();
            ts.add(new Money(300, "USD")); ts.add(new Money(300, "USD")); ts.add(new Money(100, "USD"));
            boolean crossRejected = rejects(() -> ts.add(new Money(300, "EUR")));
            return ts.size() == 2 && ts.first().amountMinor() == 100 && crossRejected;
        });
        guard("currency sai dinh dang bi tu choi ngay luc tao", () ->
            rejects(() -> new Money(100, "us")) && rejects(() -> new Money(100, "USDX")) && rejects(() -> new Money(100, null)));
        guard("Money dung duoc lam key trong HashMap", () -> {
            Map<Money, String> ledger = new HashMap<>();
            ledger.put(new Money(250, "VND"), "orders/1");
            return "orders/1".equals(ledger.get(new Money(250, "VND")))
                && "orders/1".equals(ledger.remove(new Money(250, "VND"))) && ledger.isEmpty();
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
    reference: `final class Money implements Comparable<Money> {
    private final long amountMinor;
    private final String currency;

    Money(long amountMinor, String currency) {
        if (currency == null || currency.length() != 3) throw new IllegalArgumentException("currency phai la ma 3 ky tu");
        for (int i = 0; i < 3; i++) {
            char c = currency.charAt(i);
            if (c < 'A' || c > 'Z') throw new IllegalArgumentException("currency phai la chu hoa A-Z");
        }
        this.amountMinor = amountMinor;
        this.currency = currency;
    }
    long amountMinor() { return amountMinor; }
    String currency() { return currency; }

    Money add(Money other) {
        if (other == null) throw new IllegalArgumentException("other null");
        if (!currency.equals(other.currency)) throw new IllegalArgumentException("khong cong duoc khac tien te");
        return new Money(Math.addExact(amountMinor, other.amountMinor), currency);
    }

    @Override public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Money m)) return false;
        return amountMinor == m.amountMinor && currency.equals(m.currency);
    }
    @Override public int hashCode() { return Objects.hash(amountMinor, currency); }

    @Override public int compareTo(Money other) {
        if (!currency.equals(other.currency)) throw new IllegalArgumentException("khong so sanh duoc khac tien te");
        return Long.compare(amountMinor, other.amountMinor);
    }
}`,
    hints: ['{{HashSet}} định vị trước bằng {{hashCode}}, chỉ gọi {{equals}} bên trong một bucket: nếu {{hashCode}} bỏ sót {{currency}} thì {{USD 1000}} và {{EUR 1000}} rơi vào hai bucket khác nhau và set giữ cả hai dù {{equals}} nói chúng khác — tức là {{equals}} và {{hashCode}} phải liệt kê đúng cùng một danh sách field.', 'compareTo ném IllegalArgumentException khi khác currency, còn add thì so bằng currency.equals và đừng quên kiểm tra other null trước khi chạm vào other.currency: giữ nguyên tắc "mọi phép so sánh đều phải có nghĩa" thì TreeSet và HashMap không bao giờ phải đoán.', 'Trong TreeSet, add phần tử thứ hai có compareTo trả 0 nghĩa là "đã tồn tại" nên bị bỏ; đó là lý do test cho {{USD 300}} vào sau {{EUR 300}} — nếu {{compareTo}} bỏ qua {{currency}} thì size vẫn là 2 và bài tập không phát hiện ra lỗi.'],
    explain: `Bộ test không chỉ gọi {{equals}} mà còn đưa object vào {{HashSet}}, {{TreeSet}}, {{HashMap}} thật, vì đó là nơi hợp đồng bị kiểm tra. {{HashSet}} định vị bằng {{hashCode}} rồi xác nhận bằng {{equals}}: thiếu một trong hai field ở {{hashCode}} làm hai bản trùng nằm hai bucket và set phình to. {{TreeSet}} không dùng {{equals}} chút nào: nó tin {{compareTo}}, nên một {{compareTo}} bỏ qua {{currency}} sẽ gộp {{USD 300}} và {{EUR 300}} thành một. {{add}} phải trả object mới để giữ tính bất biến; nếu nó mutate {{this}} thì mọi entry đã put trong map có thể bị lệch bucket. {{Math.addExact}} bảo vệ khỏi tràn {{long}} — điều {{long}} thường không xảy ra nhưng cent thì va chạm được với hệ thống cộng dồn lớn.`
  }], check: [{
    q: 'Lớp Money có equals theo (amountMinor, currency) nhưng hashCode chỉ theo amountMinor. Chuyện gì xảy ra với HashSet?',
    options: ['Không có gì sai: hashCode chỉ liên quan tới TreeMap', 'HashSet có thể giữ hai phần tử trùng vì chúng rơi vào hai bucket khác nhau và equals không bao giờ được gọi để so', 'HashSet ném IllegalStateException khi thêm phần tử', 'hashCode không ảnh hưởng equals, chỉ compareTo mới ảnh hưởng'],
    answer: 1,
    explain: 'HashMap và HashSet dùng hashCode để CHỌN bucket, chỉ sau đó mới dùng equals để xác nhận trong bucket đó. Equals đúng mà hash khác nghĩa là hai object không bao giờ đứng cùng chỗ để so với nhau, nên set chứa cả hai bản trùng.'
  },{
    q: 'compareTo của Money chỉ so amountMinor. Đưa vào TreeSet hai phần tử USD 1000 và EUR 1000, kết quả?',
    options: ['Set giữ cả hai vì equals coi chúng là khác nhau', 'Set ném ClassCastException', 'Set chỉ giữ một phần tử, phần tử thêm sau bị bỏ im lặng', 'Không xác định được vì TreeSet sắp xếp theo hashCode'],
    answer: 2,
    explain: 'TreeSet định vị bằng compareTo và coi kết quả 0 nghĩa là phần tử đã tồn tại, nên nó bỏ qua luôn equals. Đây là kiểu mất dữ liệu không log, không exception — chỉ thấy khi đối soát số tiền.'
  },{
    q: 'Vì sao không viết compareTo là return (int)(amountMinor - other.amountMinor)?',
    options: ['Vì javac cấm trừ hai số long', 'Vì hiệu luôn bằng 0 khi hai giá trị gần nhau', 'Vì cần cộng thêm currency vào hiệu đó', 'Vì hiệu có thể vượt phạm vi int, bị cắt narrow và đảo dấu nên thứ tự sai'],
    answer: 3,
    explain: 'Ép kiểu long xuống int chỉ giữ 32 bit thấp. Với a = 5_000_000_000 và b = 0, hiệu dương bị cắt thành số âm, comparator trả "a nhỏ hơn b". Long.compare so sánh trực tiếp nên không có bẫy này.'
  },{
    q: 'Chuyển Money sang record Money(long amountMinor, String currency). Việc nào vẫn phải tự làm?',
    options: ['Viết equals và hashCode', 'Viết compareTo và kiểm tra ràng buộc chéo khi cộng hai instance', 'Viết accessor cho amountMinor', 'Viết toString'],
    answer: 1,
    explain: 'Record tự sinh equals, hashCode, toString và accessor dựa trên mọi component, cộng thêm compact constructor để validate. Nhưng thứ tự tự nhiên (Comparable) và ràng buộc giữa hai object như "cùng currency khi cộng" thì record không biết gì về nghiệp vụ.'
  }], related: ['core-001', 'core-002'], tags: ['equals', 'hashCode', 'Comparable', 'value type']
},
{
  id: 'lesson-core-007', track: 'core', order: 7,
  title: 'Xử lý exception trong service: wrap giữ cause, retry có điều kiện và Result', level: 'senior', minutes: 30,
  goals: ['Chọn checked hay unchecked theo câu hỏi ai là người sửa được lỗi', 'Chuyển đổi exception ở ranh giới tầng mà không mất cause và không nuốt lỗi', 'Thiết kế retry chỉ cho lỗi transient và gom mọi lần lỗi vào một exception duy nhất', 'Biết khi nào trả Result thay vì ném exception'],
  body: `**Tóm tắt:** Exception trong service là thông điệp gửi cho một người ở tầng khác, nên câu hỏi thiết kế không phải "ném hay không" mà "**ai sửa được lỗi này**". Checked exception ép caller xử lý tại chỗ; unchecked đi thẳng lên boundary để bộ xử lý tập trung quyết định. Khi đổi lỗi ở ranh giới tầng luôn giữ {{cause}}, không bắt rồi bỏ, và chỉ retry đúng lỗi transient vì retry một lệnh ghi mà không có idempotency key có thể tạo giao dịch trùng.

### Checked hay unchecked: nhìn vào người cứu được
Checked exception là subclass của {{Exception}} nhưng không phải {{RuntimeException}}; compiler bắt khai báo {{throws}} hoặc catch. Chỉ nên dùng khi caller thật sự có lựa chọn phục hồi: đọc file khác, nhập lại, thử node khác trong danh sách. Nếu không, nó chỉ lan chữ ký {{throws}} qua controller → service → repository và làm rối API.
**Bẫy Spring**: {{@Transactional}} mặc định chỉ rollback cho {{RuntimeException}} và {{Error}}. Bọc lỗi database thành checked exception rồi "xử lý" ở tầng trên có thể khiến transaction **commit** với trạng thái ghi dở dang. Phải khai báo {{rollbackFor}} nếu cố tình dùng checked.

| Loại | Ai quyết định | Ví dụ | Ghi chú |
|---|---|---|---|
| Checked | Caller ngay tại chỗ gọi | File không tồn tại, cần chọn cái khác | Rò rỉ vào chữ ký API; Spring không rollback mặc định |
| {{IllegalArgumentException}} | Người viết code sai hợp đồng | Input null, sai định dạng | Là lỗi của caller, không phải của hệ thống |
| {{IllegalStateException}} | Trạng thái hệ thống sai | Đóng rồi mà vẫn ghi | Kiểm tra xem có phải race condition không |
| {{RuntimeException}} do hạ tầng | Middleware, boundary | Timeout DB, 503 từ upstream | Retry hay circuit breaker ở đúng tầng đó |
| {{Error}} | Không ai | {{OutOfMemoryError}} | Đừng bắt; để process chết và restart |

### Wrap nhưng phải giữ cause
Ở ranh giới tầng, người đọc cần ngữ cảnh nghiệp vụ (mã đơn hàng) chứ không cần class của driver. Viết lại message là đúng, nhưng phải truyền lỗi gốc vào tham số {{cause}}:

~~~java
try {
    return jdbc.query(sql, rowMapper, orderId);
} catch (DataAccessException e) {
    throw new OrderRepositoryException("Không tải được đơn hàng " + orderId, e);
}
~~~

Constructor có cause làm JVM in cả chuỗi: dòng đầu là message mới, tiếp theo là {{Caused by:}} kèm stack gốc. Bỏ cause thì mất luôn thông tin quý nhất: lỗi thật là timeout, unique constraint hay sai connection string — nhìn từ trên xuống tất cả đều là "lỗi rồi".
Chỉ log full stack trace **một lần** ở boundary (filter, {{@ControllerAdvice}}, hoặc chỗ job kết thúc). Log ở mọi tầng khiến cùng một lỗi xuất hiện 5 lần trên Kibana, che mất các lỗi khác và tính tiền index log.

### Không nuốt exception
Ba dạng dưới đây đều phá khả năng điều tra:

~~~java
catch (Exception e) { }                       // mất hết: không còn gì để truy
catch (Exception e) { log.warn("có lỗi"); }   // mất loại lỗi và stack trace
catch (DataAccessException e) { return List.of(); }  // caller không phân biệt "trống" và "hỏng"
~~~

{{catch (Exception e)}} còn nuốt luôn cả {{RuntimeException}} do bug thuần túy (NPE, {{ClassCastException}}), biến lỗi code thành hành vi im lặng khó hiểu. {{catch (Throwable t)}} còn tệ hơn vì giữ cả {{OutOfMemoryError}}. Hướng đúng: bắt đúng loại lỗi mà tầng này xử lý được, hoặc bọc và ném tiếp. Nếu vòng lặp xử lý nhiều phần tử mà mỗi phần tử bắt rồi ghi log continue, hãy đếm số lỗi và báo cuối job, đừng để một job "thành công" khi 500 đơn vị thất bại.

### try-with-resources vẫn là chỗ dễ mất thông tin
Tài nguyên đóng theo thứ tự ngược lúc mở; nếu thân khối đã ném lỗi A còn {{close()}} ném B, caller nhận A và B nằm trong {{A.getSuppressed()}}. Chẩn đoán lỗi cleanup bằng cách duyệt {{getSuppressed()}}, vì {{close()}} của {{BufferedWriter}} chính là nơi flush diễn ra — bỏ qua nó nghĩa là chấp nhận mất dữ liệu không ai biết.
Một chi tiết ít người để ý: nếu hệ thống dùng lại **cùng một instance exception** (exception static để tiết kiệm chi phí tạo), thì {{e.addSuppressed(e)}} sẽ ném {{IllegalStateException}} vì Java cấm một exception tự gắn chính nó làm suppressed.

### Result: khi thất bại là một phần của luồng
{{Result<T>}} là object chứa hoặc một giá trị hoặc một lỗi; caller buộc phải đi qua {{isSuccess()}} hoặc {{value()}}. Nó hợp ở ranh giới: parse payload từ bên ngoài, gọi API trả về kết quả nghiệp vụ, hoặc helper retry mà caller không muốn viết {{try/catch}}.

~~~java
Result<Quote> r = Result.of(() -> parser.parse(payload));
if (!r.isSuccess()) return ResponseEntity.badRequest().body(describe(r.error()));
~~~

| Cách | Ưu | Nhược |
|---|---|---|
| Exception | Đi xuyên nhiều tầng không cần đổi chữ ký; giữ stack trace | Đắt khi ném vì {{fillInStackTrace}}; dễ bị nuốt; không hợp luồng dự đoán được |
| {{Result}} | Tường minh, dễ test, không có đường đi "quên xử lý" | Không tự giữ stack nếu ta không cất {{Throwable}}; phải tự viết plumbing khi nested |

Không dùng {{Result}} để thay exception trong toàn bộ hệ thống: lỗi hạ tầng vẫn nên ném để transaction, circuit breaker và alert của bạn hoạt động như cũ. {{Result}} chỉ nên là "viên nang" ở ranh giới.

### Retry: chỉ transient, có trần, có idempotency
{{retryOn}} là {{Predicate<Throwable>}} cho biết loại lỗi nào đáng thử lại — thay vì {{catch (Exception)}} rồi retry mọi thứ.

~~~java
Predicate<Throwable> netTransient = t -> t instanceof SocketTimeoutException;
String body = Attempts.retry(() -> client.fetch(orderId), 3, netTransient);
~~~

- **Không retry**: lỗi validation, 400/401/403/404, nghiệp vụ bị từ chối (số dư không đủ). Chạy lại y nguyên input thì ra y nguyên kết quả; retry chỉ đốt tài nguyên và làm metrics lẫn tỷ lệ lỗi thật.
- **Timeout của một lệnh ghi**: server có thể đã nhận và đã commit. Cần idempotency key (khoá duy nhất do client sinh, server chỉ cho qua lần đầu) trước khi nghĩ tới retry POST.
- **Retry storm**: mọi instance retry cùng lúc khi DB chậm sẽ dồn tải ngược vào DB. Dùng exponential backoff có jitter, đặt trần số lần và tổng thời gian (deadline), kết hợp circuit breaker.
- **Test deterministic**: đừng kiểm chứng retry bằng {{Thread.sleep}} hay đồng hồ. Đếm số lần {{action}} được gọi và kiểm tra danh sách lỗi — chạy 200 lần vẫn ra cùng kết quả.
- **Gom lịch sử lỗi**: ném exception của lần cuối (message mô tả đúng lần fail mà người đọc quan tâm) và gắn các exception trước vào {{getSuppressed()}} theo thứ tự thời gian, để chỉ một dòng log cho thấy cả ba lần thử.

### Mapping lỗi domain ra thế giới ngoài
| Lỗi | HTTP | Ghi chú |
|---|---|---|
| {{NotFoundException}} | 404 | resource không tồn tại |
| Validation, {{IllegalArgumentException}} | 400 | lỗi do caller, kèm danh sách field |
| Nghiệp vụ bị từ chối (hạn mức, số dư) | 422 | request đúng cú pháp nhưng không xử lý được |
| {{ConflictException}}, optimistic lock | 409 | phiên bản dữ liệu đã đổi |
| Phụ thuộc tạm thời unavailable | 503 | kèm {{Retry-After}} để client tử tế lùi lại |
| Còn lại | 500 | trả correlation id, KHÔNG trả stack trace hay SQL |

### Pitfall production
- {{e.getMessage().contains("timeout")}} để phân loại lỗi: mong manh khi driver hoặc upstream đổi câu chữ. Hãy phân loại bằng type hoặc mã lỗi ổn định.
- Trả giá trị mặc định (0, rỗng, {{null}}) khi có lỗi: dữ liệu sai mà không ai biết, và báo cáo đối soát phát hiện sau một tháng.
- Bọc lỗi rồi chỉ truyền message, mất cause (mất {{Caused by:}}).
- Bọc exception trong một vòng {{for}} rồi chỉ ném cái cuối mà không gom suppressed: người đọc chỉ thấy một lần thử.
- Log message có PAN, token, mật khẩu hoặc dữ liệu cá nhân: boundary phải mask trước khi log.
- Nuốt {{InterruptedException}} mà không gọi {{Thread.currentThread().interrupt()}}: ứng dụng không kịp shutdown khi platform kill pod.
- Bật retry ở tầng HTTP client VÀ tầng service AND tầng job: ba tầng nhân nhau thành 27 lần gọi cho một lỗi, và phía upstream coi bạn là tấn công.

### Liên hệ phỏng vấn
Hãy kể một lỗi production bị nuốt ở tầng giữa và bạn tìm ra nó thế nào; giải thích vì sao checked exception thay đổi hành vi rollback trong Spring; nêu tiêu chí chọn lỗi được retry kèm idempotency key cho lệnh ghi; và cho biết khi nào bạn chủ đích trả {{Result}} thay vì ném exception.`,
  exercises: [{
    title: 'retry có điều kiện, Result và suppressed exception',
    prompt: `Viết {{Result<T>}} và {{Attempts}}.
- {{Result.success(v)}} chứa giá trị; {{Result.failure(e)}} chứa lỗi, từ chối {{null}} error bằng {{IllegalArgumentException}}; {{Result.of(action)}} chạy {{action}} và bắt {{RuntimeException}} lẫn {{Error}} thành {{Result}} thất bại. {{isSuccess()}} cho biết thành công; {{value()}} trả giá trị hoặc ném đúng instance lỗi đã lưu (nếu là unchecked); {{error()}} trả lỗi hoặc {{null}}.
- {{Attempts.retry(action, maxAttempts, retryOn)}}: nếu {{maxAttempts < 1}} ném {{IllegalArgumentException}} TRƯỚC khi gọi {{action}}. Gọi {{action}} tối đa {{maxAttempts}} lần. Nếu lỗi không được {{retryOn}} chấp nhận thì dừng ngay và ném đúng lỗi đó, không bọc lại. Nếu vẫn còn lỗi được phép mà hết lần, ném lỗi của lần CUỐI và gắn các lỗi của những lần trước vào {{getSuppressed()}} theo thứ tự thời gian.
- {{Attempts.attempt(...)}} dùng {{retry}} bên trong nhưng trả {{Result}} thay vì ném.
Không được dùng {{Thread.sleep}}, ngày giờ hay thứ tự không xác định: mọi test phải chạy lại cho cùng kết quả.`,
    starter: `final class Result<T> {
    private final T value;
    private final Throwable error;
    private Result(T value, Throwable error) { this.value = value; this.error = error; }

    static <T> Result<T> success(T value) { throw new UnsupportedOperationException("TODO"); }
    static <T> Result<T> failure(Throwable error) { throw new UnsupportedOperationException("TODO"); }
    static <T> Result<T> of(Supplier<T> action) { throw new UnsupportedOperationException("TODO"); }
    boolean isSuccess() { throw new UnsupportedOperationException("TODO"); }
    T value() { throw new UnsupportedOperationException("TODO"); }
    Throwable error() { throw new UnsupportedOperationException("TODO"); }
}
final class Attempts {
    static <T> T retry(Supplier<T> action, int maxAttempts, Predicate<Throwable> retryOn) { throw new UnsupportedOperationException("TODO"); }
    static <T> Result<T> attempt(Supplier<T> action, int maxAttempts, Predicate<Throwable> retryOn) { throw new UnsupportedOperationException("TODO"); }
}`,
    tests: `public class Main {
    static int passed = 0, total = 0;
    static final Predicate<Throwable> TRANSIENT = t -> t instanceof IllegalStateException;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }
    static void guard(String name, Supplier<Boolean> body) {
        try { check(name, body.get(), "điều kiện không đạt"); }
        catch (Throwable t) { check(name, false, t.getClass().getSimpleName() + ": " + t.getMessage()); }
    }
    static Throwable thrown(Runnable body) {
        try { body.run(); return null; } catch (Throwable t) { return t; }
    }
    static Supplier<String> flaky(AtomicInteger calls, int succeedAt) {
        return () -> {
            int n = calls.incrementAndGet();
            if (n < succeedAt) throw new IllegalStateException("attempt-" + n);
            return "ok-" + n;
        };
    }
    public static void main(String[] args) {
        guard("thanh cong lan dau chi goi dung mot lan", () -> {
            AtomicInteger calls = new AtomicInteger();
            String value = Attempts.retry(flaky(calls, 1), 3, TRANSIENT);
            return value.equals("ok-1") && calls.get() == 1;
        });
        guard("loi transient duoc thu lai cho toi khi co ket qua", () -> {
            AtomicInteger calls = new AtomicInteger();
            String value = Attempts.retry(flaky(calls, 3), 5, TRANSIENT);
            return value.equals("ok-3") && calls.get() == 3;
        });
        guard("loi khong duoc phep retry thi dung sau lan dau va nem dung loi do", () -> {
            AtomicInteger calls = new AtomicInteger();
            IllegalArgumentException boom = new IllegalArgumentException("don khong hop le");
            Throwable t = thrown(() -> Attempts.retry(() -> {
                calls.incrementAndGet();
                throw boom;
            }, 5, TRANSIENT));
            return t == boom && "don khong hop le".equals(t.getMessage())
                && calls.get() == 1 && t.getSuppressed().length == 0;
        });
        guard("ket lan thu thi nem loi cuoi va gom loi truoc vao suppressed", () -> {
            AtomicInteger calls = new AtomicInteger();
            Throwable t = thrown(() -> Attempts.retry(() -> {
                throw new IllegalStateException("attempt-" + calls.incrementAndGet());
            }, 3, TRANSIENT));
            return t != null && "attempt-3".equals(t.getMessage()) && t.getSuppressed().length == 2
                && "attempt-1".equals(t.getSuppressed()[0].getMessage())
                && "attempt-2".equals(t.getSuppressed()[1].getMessage()) && calls.get() == 3;
        });
        guard("maxAttempts nho hon 1 bi tu choi tru khi goi action", () -> {
            AtomicInteger calls = new AtomicInteger();
            Throwable t = thrown(() -> Attempts.retry(() -> { calls.incrementAndGet(); return "x"; }, 0, TRANSIENT));
            return t instanceof IllegalArgumentException && calls.get() == 0;
        });
        guard("attempt tra Result that bai thay vi nem", () -> {
            AtomicInteger calls = new AtomicInteger();
            Result<String> r = Attempts.attempt(() -> {
                throw new IllegalStateException("attempt-" + calls.incrementAndGet());
            }, 2, TRANSIENT);
            return !r.isSuccess() && r.error() != null && "attempt-2".equals(r.error().getMessage())
                && r.error().getSuppressed().length == 1;
        });
        guard("Result giu dung instance loi goc", () -> {
            Result<String> ok = Result.success("vip");
            IllegalStateException boom = new IllegalStateException("loi goc");
            Result<String> bad = Result.failure(boom);
            Throwable rethrown = thrown(bad::value);
            return ok.isSuccess() && "vip".equals(ok.value()) && !bad.isSuccess() && bad.error() == boom
                && rethrown == boom && Result.of(() -> "tu of").isSuccess();
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
    reference: `final class Result<T> {
    private final T value;
    private final Throwable error;
    private Result(T value, Throwable error) { this.value = value; this.error = error; }

    static <T> Result<T> success(T value) { return new Result<>(value, null); }
    static <T> Result<T> failure(Throwable error) {
        if (error == null) throw new IllegalArgumentException("Result.failure can phai co loi");
        return new Result<>(null, error);
    }
    static <T> Result<T> of(Supplier<T> action) {
        try { return success(action.get()); }
        catch (RuntimeException | Error e) { return failure(e); }
    }
    boolean isSuccess() { return error == null; }
    T value() {
        if (error == null) return value;
        if (error instanceof RuntimeException re) throw re;
        if (error instanceof Error er) throw er;
        throw new IllegalStateException("Khong doc duoc gia tri tu Result that bai", error);
    }
    Throwable error() { return error; }
}
final class Attempts {
    static <T> T retry(Supplier<T> action, int maxAttempts, Predicate<Throwable> retryOn) {
        if (maxAttempts < 1) throw new IllegalArgumentException("maxAttempts phai lon hon 0");
        List<Throwable> history = new ArrayList<>();
        for (int attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return action.get();
            } catch (RuntimeException | Error e) {
                if (!retryOn.test(e)) throw e;                       // loi khong duoc phep retry: dung ngay, giu nguyen loi
                if (attempt == maxAttempts) {
                    for (Throwable earlier : history)
                        if (earlier != e) e.addSuppressed(earlier);   // Java cam gan mot exception vao chinh no
                    throw e;                                          // loi lan cuoi nam trong message, phan con lai o suppressed
                }
                history.add(e);
            }
        }
        throw new IllegalStateException("khong the xay ra");          // can vi maxAttempts la bien, compiler khong tu suy ra vong lap ket thuc
    }
    static <T> Result<T> attempt(Supplier<T> action, int maxAttempts, Predicate<Throwable> retryOn) {
        try { return Result.success(retry(action, maxAttempts, retryOn)); }
        catch (RuntimeException e) { return Result.failure(e); }      // Error khong bi bien thanh Result
    }
}`,
    hints: ['Vòng for từ 1 tới maxAttempts; nếu retryOn trả false thì throw ngay lập tức, trước cả khi kịp gom lịch sử.', 'Giữ một List các lỗi đã gặp; chỉ khi tới lần cuối mới gắn chúng vào lỗi cuối bằng addSuppressed theo thứ tự thời gian rồi ném lỗi cuối.', 'maxAttempts cần kiểm tra ở đầu hàm, trước khi action được gọi lần nào — test sẽ đếm số lần gọi để bắt lỗi này.', 'attempt nên gọi retry rồi bắt RuntimeException để trả Result.failure(error), giữ nguyên instance lỗi để error() còn dùng được.'],
    explain: `Quy tắc "ném lỗi của lần cuối" giữ cho message phản ánh đúng lần thất bại gần nhất, còn {{getSuppressed()}} cho thấy chuỗi {{attempt-1}}, {{attempt-2}} trong một lần đọc log — đúng cơ chế JVM dùng cho {{close()}} của try-with-resources. {{retryOn}} là {{Predicate}} chứ không phải {{catch (Exception)}} vì retry lỗi validation vừa vô ích vừa làm xấu metrics. Kiểm tra {{maxAttempts}} trước khi gọi {{action}} biến cấu hình sai thành lỗi rõ ràng thay vì im lặng chạy một lần rồi thôi. Cuối cùng, {{Result}} giữ nguyên instance lỗi nên caller vẫn đọc được stack trace và cause gốc; nếu ta chỉ cất message thì mất luôn phần {{Caused by:}}.`
  }], check: [{
    q: 'Repository bắt DataAccessException rồi ném new RuntimeException("Lỗi rồi") không truyền cause. Hệ quả nghiêm trọng nhất?',
    options: ['Mất thông tin gốc: log ở boundary không còn cho biết là timeout, unique constraint hay sai kết nối, mọi lỗi trông giống nhau', 'Compiler báo lỗi vì không khai báo throws', 'Chương trình luôn crash vì RuntimeException không bắt được', 'Không có hệ quả gì, vì stack trace của chỗ ném mới đã đủ'],
    answer: 0,
    explain: 'Bọc lỗi là đúng để tách nghiệp vụ khỏi driver, nhưng constructor phải nhận cause để JVM in thêm dòng Caused by. Mất cause thì quá trình điều tra bắt đầu lại từ con số không, và lỗi hạ tầng khác nhau trở nên không phân biệt được.'
  },{
    q: 'Một method @Transactional của Spring ném checked exception. Mặc định chuyện gì xảy ra với transaction?',
    options: ['Rollback đầy đủ vì mọi exception đều gây rollback', 'Rollback một phần', 'Không rollback: mặc định chỉ rollback cho RuntimeException và Error, muốn rollback checked phải khai báo rollbackFor', 'Spring ném ngược IllegalTransactionStateException'],
    answer: 2,
    explain: 'Rule mặc định của Spring là rollback trên RuntimeException và Error. Checked exception đi qua mà transaction vẫn commit, nên nếu bạn bọc lỗi database thành checked rồi xử lý ở tầng trên, hệ thống có thể commit trạng thái ghi dở dang.'
  },{
    q: 'Service trừ tiền gọi upstream qua mạng. Loại lỗi nào nên retry?',
    options: ['Số dư không đủ (nghiệp vụ từ chối)', 'Timeout khi kết nối, kèm idempotency key cho lệnh ghi', 'Response 404 vì cấu hình sai đường dẫn', 'IllegalArgumentException từ bước validate input'],
    answer: 1,
    explain: 'Chỉ lỗi transient của hạ tầng đáng thử lại, và với lệnh ghi thì timeout không cho biết server đã commit hay chưa, nên bắt buộc có idempotency key. Ba lựa chọn còn lại cho kết quả y nguyên khi chạy lại, chỉ làm chậm và tăng tải.'
  },{
    q: 'Trong retry, vì sao ném exception của lần CUỐI cùng với các lần trước nằm trong getSuppressed, thay vì chỉ ném lần cuối hoặc chỉ log?',
    options: ['Vì getSuppressed là cách duy nhất để đổi loại exception', 'Vì chỉ có exception lần cuối mới có message', 'Vì Java không cho phép ném exception đã bắt ở vòng lặp trước', 'Vì người đọc thấy một lần lỗi chính là lần mới nhất và vẫn có đầy đủ các lần thất bại trước đó trong cùng một dòng log'],
    answer: 3,
    explain: 'Đây đúng là cơ chế try-with-resources dùng cho lỗi close. Giữ toàn bộ lịch sử trong một exception giúp so sánh message giữa các lần thử (transient hay lặp lại y hệt) mà không phải lần ngược nhiều dòng log của cùng một request.'
  }], related: ['core-001', 'core-003'], tags: ['Exception', 'retry', 'Result', 'observability']
}
);

