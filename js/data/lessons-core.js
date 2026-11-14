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

### Cơ chế từng bước của try-with-resources

Khai báo tài nguyên trong ngoặc tròn của try, ví dụ {{try (Resource r = open())}}. Compiler dịch thành các khối {{try}} lồng nhau với {{finally}}:

1. **Khởi tạo trước khi vào thân**: mỗi resource được khởi tạo theo thứ tự viết. Nếu resource thứ hai ném lỗi ngay khi tạo, resource đầu tiên đã mở vẫn bị đóng nhờ outer finally — không bị rò rỉ handle hay stream.
2. **Ghi nhớ lỗi chính**: nếu thân khối ném exception A, Java nhảy vào finally nhưng giữ A làm lỗi chính để ném ra cuối cùng.
3. **Đóng ngược thứ tự khai báo**: {{close()}} gọi theo thứ tự đảo ngược. Khai báo outer rồi inner → đóng inner trước, rồi outer. Điều này quan trọng khi inner (ví dụ reader) nằm trên outer (stream): phải flush và đóng reader trước stream dưới đáy.
4. **Gắn suppressed**: nếu inner.close() ném B, Java gọi {{A.addSuppressed(B)}}. Lỗi đóng outer cũng gắn vào suppressed của A. Cuối cùng ném A, và caller duyệt {{getSuppressed()}} để xem B và lỗi đóng outer.
5. **Thân thành công, close lỗi**: lỗi close đầu tiên trở thành lỗi chính; lỗi close sau gắn vào suppressed của nó.

Ví dụ ngắn:

~~~java
try (FileInputStream in = new FileInputStream("a.txt");
     BufferedReader r = new BufferedReader(new InputStreamReader(in))) {
    String line = r.readLine();   // lỗi ở đây vẫn không làm rò stream
    process(line);                // r đóng trước, in đóng sau
}
~~~

Nếu {{readLine()}} ném A và cả hai {{close()}} ném B, C, thì exception ném ra là A; B và C nằm trong {{getSuppressed()}} theo thứ tự đóng. Khác với finally thủ công: exception từ close có thể che mất exception gốc.

### Thiết kế exception nghiệp vụ
Dùng tên thể hiện ngữ cảnh như {{InsufficientFundsException}} thay vì {{Exception}} chung. Có thể giữ mã lỗi ổn định cho API và giữ cause để điều tra:

~~~java
throw new PaymentException("PAYMENT_DECLINED", "Không thể thanh toán", cause);
~~~

Không nhét PAN, token hay dữ liệu nhạy cảm vào message. Chuyển đổi exception ở ranh giới tầng (driver → repository/domain → HTTP) nhưng không làm mất cause. Tránh catch rồi trả null: caller không phân biệt “không có dữ liệu” với “truy vấn lỗi”.

### Lỗi hay gặp trên production

- **Retry mọi exception**: triệu chứng là lỗi validation (sai định dạng) cũng bị gửi lại lần thứ hai, và timeout sau khi server đã ghi tạo giao dịch trùng. Nguyên nhân: code retry bắt cả lỗi transient và lỗi vĩnh viễn. Cách sửa: chỉ retry lỗi transient (mạng gián đoạn, database quá tải), kết hợp idempotency key (khóa nhận dạng duy nhất để phát hiện yêu cầu trùng) để tránh tạo giao dịch trùng.
- **Đóng thủ công trong finally**: triệu chứng là log chỉ ghi exception từ close, exception công việc thực sự biến mất. Nguyên nhân: exception trong close ném ra che mất exception gốc. Cách sửa: dùng {{try-with-resources}}; lỗi close gắn vào {{getSuppressed()}} thay vì che mất lỗi chính.
- **Bắt {{InterruptedException}} rồi bỏ cờ ngắt**: triệu chứng là luồng không bao giờ dừng khi yêu cầu tắt JVM, shutdown kéo dài. Nguyên nhân: swallow exception làm mất cờ ngắt của luồng. Cách sửa: gọi lại {{Thread.currentThread().interrupt()}} nếu không thể ném tiếp.
- **Chuyển mọi lỗi thành HTTP 500**: triệu chứng là client không biết lỗi do họ hay do server, và stack trace nội bộ rò rãi ra response. Nguyên nhân: không phân biệt lỗi nghiệp vụ và lỗi hệ thống. Cách sửa: lỗi nghiệp vụ trả status/mã lỗi ổn định (ví dụ 409 conflict), lỗi nội bộ chỉ log và trả 500 chung chung mà không lộ stack trace cho client.

### Liên hệ phỏng vấn

- Lỗi cleanup làm mất lỗi gốc thì ảnh hưởng gì đến việc chẩn đoán production? → Lỗi từ close bị ném làm lỗi chính, exception nghiệp vụ thực sự bị gắn vào suppressed và dễ bị bỏ qua nếu chỉ log exception chính; nên luôn duyệt {{getSuppressed()}}.
- Vì sao resource đóng theo thứ tự ngược khai báo? → Tài nguyên sau khai báo thường nằm trên tài nguyên trước (reader trên stream); phải đóng lớp trên trước để flush đúng thứ tự và không làm hỏng stream dưới đáy.
- Checked exception ảnh hưởng rollback trong Spring ra sao? → Theo mặc định Spring rollback cho runtime exception; checked exception không rollback trừ khi cấu hình {{rollbackFor}}, do đó bọc database exception thành checked mà không cấu hình sẽ vô tình commit trạng thái dở dang.
`,
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
  }], check: [
    {
      q: 'Theo Java, khi một method ném checked exception, caller bắt buộc phải làm gì?',
      options: ['Không làm gì, JVM tự xử lý', 'Khai báo {{throws}} trong chữ ký hoặc bọc trong {{try-catch}}', 'Chỉ ghi comment nhắc xử lý sau', 'Buộc chuyển thành unchecked exception trước khi ném'],
      answer: 1,
      explain: 'Đáp án B đúng: compiler bắt checked exception được khai báo {{throws}} hoặc bắt bằng {{try-catch}}, code không biên dịch nếu bỏ qua. A sai: JVM không tự xử lý checked exception. C sai: comment không thỏa mã compiler. D sai: không phải bắt buộc, và chuyển đổi có thể làm mất nguyên nhân nếu không giữ cause.'
    },
    {
      q: 'Trong {{try-with-resources}}, thân ném lỗi A, hai resource close() ném B và C. Caller nhận exception gì?',
      options: ['B, vì lỗi đóng xảy ra sau cùng', 'C, vì resource đóng cuối được ưu tiên', 'A làm lỗi chính; B, C gắn vào {{getSuppressed()}}', 'Không ném exception nào ra ngoài'],
      answer: 2,
      explain: 'Đáp án C đúng: exception từ thân được ưu tiên làm lỗi chính; lỗi close được gắn thêm vào mảng suppressed qua {{addSuppressed()}}. A/B sai: lỗi close không trở thành lỗi chính khi thân đã ném. D sai: Java không swallow exception; nếu thân thành công mà close ném, lỗi close đầu tiên mới trở thành lỗi chính.'
    },
    {
      q: 'Developer bọc SQLException thành checked exception {{PaymentException}} trong service Spring, không cấu hình thêm. Transaction sẽ ra sao?',
      options: ['Commit bình thường: checked exception không rollback theo mặc định của Spring', 'Rollback vì exception đã được ném ra', 'Rollback vì SQLException gốc là unchecked', 'Treo vĩnh viễn'],
      answer: 0,
      explain: 'Đáp án A đúng: Spring chỉ rollback runtime exception theo mặc định; checked exception cần cấu hình {{rollbackFor}}. B/C sai: ném exception không tự rollback nếu là checked; SQLException đã bị bọc thành checked, đặc tính runtime của JDBC bị mất. D sai: không có cơ chế treo transaction như vậy.'
    },
    {
      q: 'Bắt {{InterruptedException}} mà không thể ném tiếp, phải làm gì?',
      options: ['Bỏ qua hoàn toàn, không làm gì cả', 'Gọi {{Thread.stop()}} để dừng luồng ngay', 'Chuyển thành HTTP 500 ngay tại chỗ', 'Gọi lại {{Thread.currentThread().interrupt()}} để khôi phục cờ ngắt'],
      answer: 3,
      explain: 'Đáp án D đúng: swallow exception làm mất cờ ngắt, luồng không bao giờ dừng khi yêu cầu shutdown. A sai: mất cờ ngắt, luồng vẫn chạy. B sai: {{Thread.stop()}} đã bị lui, không an toàn (có thể khóa monitor bất ngờ). C sai: InterruptedException là sự kiện luồng, không phải lỗi HTTP của request.'
    }
  ], related: ['core-001'], tags: ['Exception', 'try-with-resources']
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

### Cơ chế từng bước của wildcard (PECS)

Compiler xử lý wildcard bằng cách "bắt" (capture) một kiểu ẩn trong mỗi lời gọi:

1. **{{List<? extends Number>}} là nguồn (producer)**: có thể trỏ tới List<Integer> hoặc List<Double>. Đọc ra: chắc chắn là {{Number}}, gán cho {{Number}} được. Ghi: cấm mọi thứ trừ {{null}}, vì compiler không biết subtype cụ thể nào danh sách thực sự chấp nhận.
2. **{{List<? super Integer>}} là đích (consumer)**: có thể là List<Integer>, List<Number> hoặc List<Object>. Ghi {{Integer}} an toàn vì mọi kiểu đích đều chứa được Integer. Đọc ra: chỉ chắc chắn là {{Object}}.
3. **Quy tắc PECS**: producer (chỉ đọc) dùng {{? extends T}}, consumer (chỉ ghi) dùng {{? super T}}. Hàm vừa đọc vừa ghi cùng collection thì dùng {{List<T>}} rõ ràng hơn.
4. **Một T nối hai phía**: trong hàm copy, cùng một {{T}} ràng buộc src và dst, nên giá trị đọc từ src gán vào dst được ngay, không cần cast.
5. **Runtime bị xóa tham số (erasure)**: {{List<String>}} và {{List<Integer>}} cùng class runtime {{ArrayList}}. Không viết {{value instanceof List<String>}}; kiểm tra từng phần tử hoặc thiết kế kiểu an toàn.

Ví dụ:

~~~java
// Nguồn chỉ cung cấp số: đọc được Number, ghi bị cấm
Number total(List<? extends Number> xs) {
    double s = 0;
    for (Number n : xs) s += n.doubleValue();   // đọc an toàn
    return s;
}
// Đích chỉ nhận số nguyên: ghi Integer an toàn, đọc chỉ ra Object
void luu(List<? super Integer> dst) {
    dst.add(Integer.valueOf(7));                // ghi an toàn
    Object o = dst.get(0);                      // đọc chỉ khẳng định Object
}
~~~

### Lỗi hay gặp trên production

- **API nhận {{List<Object>}}**: triệu chứng là client truyền {{List<String>}} bị lỗi biên dịch ngay chỗ gọi. Nguyên nhân: generic invariant, {{List<String>}} không phải kiểu con của {{List<Object>}}. Cách sửa: dùng {{List<?>}} nếu chỉ đọc, hoặc generic method với wildcard phù hợp cho từng hướng.
- **Cast raw type**: triệu chứng là lỗi {{ClassCastException}} xuất hiện ở nơi hoàn toàn khác nơi đưa dữ liệu vào, rất khó truy vết. Nguyên nhân: raw type tắt kiểm tra kiểu của compiler. Cách sửa: không dùng raw collection để "né" generic; khai báo kiểu tham số rõ ràng.
- **{{? extends T}} để ghi**: triệu chứng là code thêm phần tử vào {{List<? extends Number>}} bị từ chối biên dịch. Nguyên nhân: extends chỉ hứa đọc ra được T cha, không hứa chấp nhận mọi subtype để ghi; chỉ {{null}} chắc chắn tương thích. Cách sửa: dùng {{? super T}} cho đích ghi.
- **{{new T[]}}**: triệu chứng là lỗi biên dịch "generic array creation". Nguyên nhân: type erasure xóa tham số generic ở runtime, JVM không biết kiểu thành phần mảng. Cách sửa: dùng collection hoặc nhận {{Class<T>}}/factory để tạo mảng.
- **Comparator không nhất quán với equals**: triệu chứng là {{TreeSet}} hoặc {{TreeMap}} loại nhầm phần tử, tìm không thấy key đã put. Nguyên nhân: comparator cho hai object khác bằng 0 trong khi equals cho false, vi phạm "consistent with equals". Cách sửa: chọn comparator theo định danh nghiệp vụ và đảm bảo compareTo trả 0 khi và chỉ khi equals true.

### Liên hệ phỏng vấn

- Vì sao {{List<Integer>}} không gán cho {{List<Number>}}? → Java generic là invariant: nếu cho phép, client có thể thêm {{Double}} vào danh sách thực chất là {{Integer}}, vi phạm kiểu tại runtime; compiler chặn ngay tại compile time.
- API copy và max sửa như thế nào mà không dùng cast? → copy nhận {{List<? super T> dst}} (đích ghi) và {{List<? extends T> src}} (nguồn đọc); max nhận {{Collection<? extends T> xs}} (producer) và {{Comparator<? super T> c}} (consumer).
- Kiểu gì đọc được, kiểu gì ghi được ở mỗi wildcard? → {{? extends T}}: đọc được {{T}}, ghi cận trừ {{null}}. {{? super T}}: ghi được {{T}}, đọc chỉ khẳng định {{Object}}.
`,
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
  }], check: [
    {
      q: 'Vì sao Java không gán {{List<Integer>}} cho biến {{List<Number>}}?',
      options: ['Vì Integer và Number là hai class khác nhau, compiler không cho gán', 'Vì generic Java là invariant; nếu cho phép, có thể thêm Double vào danh sách Integer', 'Vì List là interface, không thể dùng làm kiểu tham số', 'Vì Number là abstract class, không tạo được danh sách'],
      answer: 1,
      explain: 'Đáp án B đúng: generic Java là invariant, List<Integer> không phải subtype của List<Number>; nếu cho phép thì có thể thêm Double vào danh sách thực chất là Integer, vi phạm kiểu tại runtime. A sai: Integer gán cho Number được bình thường, vấn đề là kiểu generic bao bọc. C sai: List hoàn toàn có dùng làm kiểu tham số. D sai: abstract không liên quan đến vấn đề gán kiểu generic.'
    },
    {
      q: 'Với {{List<? extends Number>}}, thao tác nào sau đây ĐÚNG theo biên dịch?',
      options: ['Gán giá trị đọc được cho biến kiểu Number', 'Thêm Integer vào danh sách', 'Thêm Double vào danh sách', 'Gán giá trị đọc được cho biến kiểu Integer'],
      answer: 0,
      explain: 'Đáp án A đúng: đọc ra chỉ chắc chắn là Number, gán cho biến Number được. B/C sai: wildcard extends là producer (chỉ đọc), ghi cấm mọi thứ trừ null vì compiler không biết subtype thực tế. D sai: đọc ra chỉ biết là Number, không ép về Integer được.'
    },
    {
      q: 'Với {{List<? super Integer>}}, điều gì chính xác?',
      options: ['Chỉ List<Integer> mới gán được biến này', 'Đọc ra chắc chắn là Integer', 'Ghi Integer an toàn, đọc chỉ khẳng định Object', 'Tương đương List<Integer>, đọc và ghi đều Integer'],
      answer: 2,
      explain: 'Đáp án C đúng: đích super Integer có thể là List<Integer>, List<Number>, List<Object>, ghi Integer an toàn; đọc ra chỉ chắc chắn là Object. A sai: List<Number>, List<Object> cũng gán được. B sai: đọc ra chắc chắn Object chứ không phải Integer. D sai: super Integer mở rộng hơn List<Integer>, không tương đương.'
    },
    {
      q: 'Khi gọi {{Collections.max(xs, c)}} với {{xs}} là {{List<String>}} và truyền comparator {{Comparator<Object>}}, điều gì xảy ra?',
      options: ['Lỗi biên dịch vì Object khác String', 'Chỉ chạy được nếu String implements Comparable', 'Comparator<Object> bị bỏ qua, dùng natural ordering', 'Chạy được: Comparator<Object> là Comparator<? super String>, có thể so hai String'],
      answer: 3,
      explain: 'Đáp án D đúng: comparator là consumer (chỉ tiêu thụ hai T), nên Comparator<Object> vẫn nhận được String — đây là contravariance, comparator của kiểu cha dùng được cho kiểu con. A sai: Comparator<Object> là supertype của Comparator<String> theo wildcard, biên dịch được. B/C sai: comparator được truyền thì được dùng, không cần String implements Comparable cũng không bị bỏ qua.'
    }
  ], related: ['core-001'], tags: ['Generics', 'PECS']
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

### Cơ chế từng bước của defensive copy

Aliasing xảy ra khi nhiều biến trỏ cùng một object mutable: sửa qua biến này thì biến kia cũng thấy thay đổi. Defensive copy phá liên kết đó bằng cách tạo bản sao riêng cho mỗi bên, không còn đường chia sẻ.

Khi người gọi truyền object mutable vào constructor:

1. **Nhận tham chiếu, không phải bản sao**: constructor nhận tham chiếu đến object của người gọi (ví dụ {{Date}} hay {{List}}), chưa tách liên kết.
2. **Sao chép ngay lúc nhận**: constructor tạo object mới chứa dữ liệu sao chép, ví dụ {{new Date(input.getTime())}} hoặc {{List.copyOf(input)}}, rồi gán field trỏ đến bản sao.
3. **Trả bản sao khi đọc**: getter không trả field thô; trả {{new Date(created.getTime())}} hoặc {{List.copyOf(items)}}. Người gọi sửa bản trả về sẽ không làm thay đổi trường bên trong object.
4. **Kết quả**: người gọi giữ bản gốc của mình, object giữ bản của riêng mình, không còn aliasing → chia sẻ an toàn giữa thread.

Ví dụ ngắn với {{Date}} (mutable) và danh sách:

~~~java
final class Transfer {
    private final Date created;   // Date có thể bị sửa sau khi tạo
    private final List<String> items;

    Transfer(Date created, List<String> items) {
        this.created = new Date(created.getTime());   // copy ngay lúc nhận
        this.items = List.copyOf(items);                // tách khỏi danh sách của caller
    }

    Date created() {
        return new Date(created.getTime());             // trả bản sao mới
    }

    List<String> items() {
        return List.copyOf(items);                      // trả danh sách bất biến
    }
}
~~~

### Lỗi hay gặp trên production

- **Chỉ copy khi nhận vào, quên copy khi trả ra**: triệu chứng là caller lấy getter rồi sửa {{Date}} hoặc danh sách, trường bên trong object bị thay đổi mà không qua constructor. Nguyên nhân: getter trả chính tham chiếu trường nội bộ. Cách sửa: getter trả bản sao mới, ví dụ {{new Date(created.getTime())}} hoặc {{List.copyOf(items)}}.
- **Shallow copy với phần tử mutable**: triệu chứng là {{List.copyOf}} ngăn sửa cấu trúc danh sách nhưng phần tử trong danh sách (ví dụ {{OrderLine}} mutable) vẫn chia sẻ tham chiếu; sửa phần tử vẫn thay đổi nội dung thấy được từ snapshot. Nguyên nhân: copy nông chỉ sao chép tham chiếu phần tử, không sao chép object phần tử. Cách sửa: dùng phần tử immutable, hoặc deep-copy từng phần tử, hoặc trả bản sao của từng phần tử.
- **Trả iterator hoặc view trực tiếp**: triệu chứng là người dùng iterator/spliterator của danh sách nội bộ, sửa khi duyệt ném {{ConcurrentModificationException}} hoặc nhìn thấy dữ liệu thay đổi giữa chừng. Nguyên nhân: view không tách bản sao, vẫn liên kết với danh sách gốc. Cách sửa: trả {{List.copyOf(...)}} hoặc mảng/danh sách mới, không trả view trực tiếp.
- **Bảo vệ một nơi còn là rò rỉ ở nơi khác**: triệu chứng là constructor copy nhưng builder hoặc constructor khác giữ nguyên tham chiếu input, object “bất biến” vẫn bị đổi qua đường khác. Nguyên nhân: defensive copy chỉ áp dụng một phần. Cách sửa: áp dụng copy tại mọi nơi nhận dữ liệu từ người gọi (constructor, setter, builder, factory method).

### Pitfall production
- Hibernate entity thường mutable và có lifecycle proxy; đừng biến entity thành value object bất biến chỉ bằng final class. Chuyển sang immutable DTO/domain snapshot tại ranh giới.
- {{unmodifiableList}} không bảo vệ khỏi thay đổi qua list gốc; phù hợp khi cần view live có kiểm soát.
- Defensive copy tốn O(n) thời gian/bộ nhớ. Với collection lớn, cân nhắc persistent collection hoặc chuyển quyền sở hữu rõ ràng, nhưng đừng tuyên bố immutable nếu caller vẫn giữ alias.
- Ngày giờ: ưu tiên {{Instant}}/{{LocalDate}} thay {{Date}}; chúng bất biến.
- Bất biến không thay kiểm tra quyền, validation hay atomicity của thao tác nhiều object.

### Liên hệ phỏng vấn

- Object nào nên làm bất biến? → Dùng cho value object (tiền, mã giao dịch, cấu hình đọc nhiều lần) vì chia sẻ an toàn giữa thread và làm key an toàn trong HashMap/HashSet. Không dùng cho object lớn thay đổi liên tục (ví dụ buffer, trạng thái game) vì defensive copy mỗi lần tốn O(n) bộ nhớ và CPU.
- Defensive copy ngăn được tất cả rò rỉ tham chiếu không? → Không. Chỉ ngăn aliasing qua tham chiếu mà constructor/getter truyền. Nếu danh sách chứa phần tử mutable và chỉ gọi {{List.copyOf}}, phần tử vẫn chia sẻ; cần phần tử immutable hoặc deep-copy từng phần tử.
- unmodifiable view khác snapshot ra sao? → unmodifiableList vẫn là view trên danh sách gốc: sửa danh sách gốc thì view cũng đổi. {{List.copyOf}} tạo bản sao tách biệt: sửa danh sách gốc sau đó không ảnh hưởng bản sao.
`,
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
  }],   check: [
    {
      q: 'Khi class bất biến nhận một {{Date}} vào constructor, sao phải gán field bằng {{new Date(created.getTime())}} thay vì gán trực tiếp {{created}}?',
      options: ['Vì Date không phải final nên Java cấm gán trực tiếp', 'Vì Date là mutable: caller còn tham chiếu đến object gốc, sửa Date của mình sẽ sửa luôn trường bên trong object', 'Vì new Date tạo object nhanh hơn và tiết kiệm bộ nhớ hơn', 'Vì constructor không được nhận tham số kiểu Date'],
      answer: 1,
      explain: 'Đáp án B đúng: Date có thể bị thay đổi sau khi tạo (setTime). Nếu gán trực tiếp, caller và object giữ cùng một tham chiếu → aliasing; sửa ở một đầu sẽ thấy ở đầu kia. new Date(getTime()) tạo bản sao riêng, mỗi bên một object. A sai: Java không cấm gán tham chiếu Date. C sai: mục đích là an toàn không phải tốc độ. D sai: constructor hoàn toàn có thể nhận Date.'
    },
    {
      q: '{{List.copyOf(items)}} khác {{items}} ra sao về việc ngăn sửa danh sách?',
      options: ['Trả danh sách mới không cho thêm/xoá phần tử, còn danh sách gốc vẫn có thể sửa và không ảnh hưởng bản sao', 'Cả hai đều cho sửa phần tử giống nhau', 'List.copyOf chỉ tạo view chỉ đọc: sửa danh sách gốc vẫn thay đổi bản sao', 'List.copyOf sửa luôn danh sách gốc thành không cho sửa'],
      answer: 0,
      explain: 'Đáp án A đúng: List.copyOf tạo bản sao mới và trả về list bất biến — thử add sẽ ném UnsupportedOperationException; sửa danh sách gốc sau đó không ảnh hưởng bản sao. B sai: bản sao không cho sửa cấu trúc. C sai: đó là đặc điểm của unmodifiableList (view), không phải List.copyOf. D sai: List.copyOf không đụng danh sách gốc.'
    },
    {
      q: 'Danh sách items chứa các object {{OrderLine}} mutable. Chỉ gọi {{List.copyOf(items)}} trong getter đủ để object bất biến hoàn toàn không?',
      options: ['Đủ, vì List.copyOf đã copy mọi thứ sâu', 'Không, vì List.copyOf ném exception khi phần tử mutable', 'Không, chỉ copy cấu trúc danh sách: phần tử OrderLine vẫn chia sẻ tham chiếu, sửa phần tử vẫn ảnh hưởng snapshot', 'Không, vì List.copyOf chỉ hoạt động với danh sách String'],
      answer: 2,
      explain: 'Đáp án C đúng: List.copyOf là shallow copy (copy nông) — sao chép tham chiếu phần tử, không sao chép object phần tử. Nếu OrderLine mutable, caller sửa OrderLine qua bản gốc vẫn thay đổi nội dung thấy được từ snapshot. Cần phần tử immutable hoặc deep-copy từng phần tử. A/B/D sai.'
    },
    {
      q: 'Getter trả {{Date}} nội bộ trực tiếp (không tạo bản sao mới). Caller lấy đối tượng đó rồi gọi {{setTime(...)}}. Hệ quả gì xảy ra?',
      options: ['Không có gì: Java tự bảo vệ trường Date trong object', 'Chỉ bản Date của caller bị thay đổi, trường trong object vẫn giữ giá trị cũ', 'Java ném UnsupportedOperationException tại getter', 'Object bị thay đổi trạng thái bên trong sau khi đã tạo, vi phạm bất biến vì caller và object chia sẻ cùng một Date'],
      answer: 3,
      explain: 'Đáp án D đúng: getter trả chính tham chiếu trường nội bộ, caller gọi setTime thì trường của object cũng đổi theo — alias ngược từ caller vào bên trong, object đã không còn bất biến. A/B/C sai: Java không tự sao chép, caller và object giữ cùng tham chiếu nên sửa bản trả về chính là sửa trường nội bộ, và getter không ném exception.'
    }
  ], related: ['core-001'], tags: ['immutability', 'defensive copy']
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

### Cơ chế từng bước của BigDecimal

BigDecimal lưu số dưới hai phần: **unscaled value** (số nguyên không dấu) và **scale** (vị trí dấu thập phân). Ví dụ 123.45 có unscaled = 12345, scale = 2; giá trị thực = 12345 / 10². Số nguyên không giới hạn độ dài, nên BigDecimal không bị sai lệch như double.

1. **Tạo số**: dùng {{new BigDecimal("10.00")}} từ chuỗi để giữ chính xác từng chữ số, hoặc {{BigDecimal.valueOf()}} từ long/double đã an toàn về chuỗi. Không dùng {{new BigDecimal(double)}} vì double đã sai lệch trước khi vào BigDecimal.
2. **Phép tính**: cộng/trừ giữ scale phù hợp, nhân cộng scale, chia phải chọn scale và {{RoundingMode}} vì kết quả có thể vô hạn (10 / 3 = 3.333…).
3. **Làm tròn**: {{divide(divisor, 2, RoundingMode.HALF_UP)}} chọn 2 chữ số thập phân và làm tròn theo quy tắc business. HALF_UP làm tròn theo cách phổ biến; HALF_EVEN giảm thiên lệch khi cộng dồn nhiều lần.
4. **Phân bổ tiền**: tính ở đơn vị nhỏ nhất (cent) bằng số nguyên, chia lấy phần nguyên và phần dư, rồi cộng phần dư vào các kỳ đầu theo thứ tự ổn định. Tổng các kỳ vẫn bằng tổng ban đầu, có thể kiểm tra lại.

Ví dụ phân bổ 10.00 thành 3 kỳ:

~~~java
BigDecimal total = new BigDecimal("10.00");           // 1000 cent
BigInteger[] qr = total.movePointRight(2).toBigIntegerExact().divideAndRemainder(BigInteger.valueOf(3));
// qr[0] = 333 cent mỗi kỳ, qr[1] = 1 cent dư
List<BigDecimal> parts = new ArrayList<>();
for (int i = 0; i < 3; i++) {
    BigInteger cent = qr[0].add(i < qr[1].intValue() ? BigInteger.ONE : BigInteger.ZERO);
    parts.add(new BigDecimal(cent, 2));               // scale 2: 3.34, 3.33, 3.33
}
// tổng: 3.34 + 3.33 + 3.33 = 10.00
~~~

### Lỗi hay gặp trên production

- **{{new BigDecimal(double)}}**: triệu chứng là 0.1USD được lưu thành 0.1000000000000000055511…, tiền sai ngay từ đầu tính toán đầu tiên. Nguyên nhân: double lưu nhị phân, 0.1 không biểu diễn chính xác, và constructor giữ giá trị nhị phân sai lệch đó. Cách sửa: luôn dùng {{new BigDecimal("0.1")}} từ chuỗi, hoặc {{BigDecimal.valueOf(0.1)}} (dùng chuỗi của double, gần đúng ý người viết).
- **Chia BigDecimal thiếu scale**: triệu chứng là {{amount.divide(divisor)}} ném {{ArithmeticException}} khi kết quả không chia hết, ví dụ 10.00 / 3. Nguyên nhân: divide mặc định yêu cầu kết quả chính xác tuyệt đối, không biết làm tròn thế nào. Cách sửa: luôn truyền scale và {{RoundingMode}}, ví dụ {{divide(divisor, 2, RoundingMode.HALF_UP)}}.
- **{{equals}} để so sánh tiền**: triệu chứng là 10.00 và 10.0 được coi là khác trong HashMap/set, dù trị số bằng nhau. Nguyên nhân: equals so cả trị số lẫn scale. Cách sửa: dùng {{compareTo}} == 0 khi chỉ quan tâm trị số, hoặc chuẩn hóa cùng scale bằng {{setScale}} trước khi so.
- **Làm tròn mỗi dòng rồi tổng**: triệu chứng là tổng các dòng sau làm tròn khác tổng đơn hàng, khách khiếu náo sai 1–2 đồng. Nguyên nhân: sai số làm tròn tích lũy ở mỗi dòng. Cách sửa: tính toán ở đơn vị nhỏ nhất (cent) bằng số nguyên, phân bổ phần dư theo quy tắc xác định, chỉ làm tròn ở lớp trình bày.

### Quy tắc lưu trữ và production
- Database {{DECIMAL(p,s)}} phải đủ precision/scale cho giá trị tối đa; kiểm tra overflow trước khi ghi.
- JPA/Hibernate map BigDecimal vào decimal, nhưng schema migration cần khớp precision/scale. Đọc lại có thể giữ scale theo database/driver; đừng dùng equals để so tiền nếu nghiệp vụ chỉ quan tâm trị số.
- Định nghĩa rounding ở đúng một ranh giới. Làm tròn từng dòng hay chỉ tổng có thể cho kết quả khác; ghi rõ quy tắc trong nghiệp vụ và audit.
- Không dùng {{stripTrailingZeros}} để định dạng trực tiếp: có thể tạo scale âm như 1E+3. Format theo currency ở lớp trình bày.
- Với phân bổ, xác định ai nhận remainder và tie-break ổn định để chạy lại cho cùng kết quả.

### Liên hệ phỏng vấn

- Tại sao tiền không dùng double? → Double dùng số nhị phân, 0.1 không biểu diễn hết chính xác nên 0.1 + 0.2 có thể ra 0.30000000000000004. Tiền dùng BigDecimal từ chuỗi, hoặc lưu cent (số nguyên) để mỗi chữ số thập phân chính xác đến đồng.
- So sánh tiền dùng equals hay compareTo? → equals so cả trị số lẫn scale, nên 10.0 khác 10.00 — thường sai ở tiền. Dùng {{compareTo}} == 0 khi chỉ quan tâm trị số, hoặc chuẩn hóa cùng scale bằng {{setScale}} trước khi so.
- Chia tiền cho nhiều kỳ làm sao cho tổng vẫn khớp? → Tính ở đơn vị nhỏ nhất (cent) bằng số nguyên, lấy phần nguyên và phần dư, rồi cộng phần dư vào các kỳ đầu theo thứ tự ổn định (ví dụ 3.34, 3.33, 3.33). Ghi rõ quy tắc này vào nghiệp vụ và audit để đối soát sau này.
`,
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
  }],   check: [
    {
      q: 'Vì sao không viết {{new BigDecimal(0.1)}} để đại diện cho 0.1 đồng USD?',
      options: ['Constructor double giữ chính xác giá trị nhị phân sai lệch của 0.1, nên số tiền đã sai ngay từ đầu', 'BigDecimal không nhận constructor double', '0.1 trong double là chính xác, không có vấn đề gì', 'Constructor double bị Java lui từ Java 17'],
      answer: 0,
      explain: 'Đáp án A đúng: double lưu số nhị phân, 0.1 không có biểu diễn nhị phân hữu hạn, nên new BigDecimal(0.1) giữ giá trị sai lệch (0.1000000000000000055511…). Phải dùng new BigDecimal("0.1") hoặc BigDecimal.valueOf(0.1). B/C/D sai.'
    },
    {
      q: 'Hai số {{new BigDecimal("10.00")}} và {{new BigDecimal("10.0")}} so bằng nhau theo {{equals}} hay theo {{compareTo}}?',
      options: ['Cả hai đều cho bằng nhau', 'Cả hai đều cho khác nhau', 'equals cho khác nhau (scale khác), compareTo cho bằng nhau (trị số bằng)', 'equals cho bằng nhau, compareTo cho khác nhau'],
      answer: 2,
      explain: 'Đáp án C đúng: equals so cả trị số lẫn scale, 10.00 (scale 2) khác 10.0 (scale 1); compareTo chỉ so trị số, hai số bằng 10 nên bằng nhau. Tiền nên dùng compareTo == 0 khi chỉ quan tâm trị số.'
    },
    {
      q: '{{amount.divide(divisor, 2, RoundingMode.HALF_UP)}} cần cả scale và RoundingMode. Nếu bỏ qua, chuyện gì thường xảy ra?',
      options: ['Java tự chọn scale 2 và làm tròn HALF_UP', 'Ném ArithmeticException khi kết quả chia không hết, ví dụ 10 chia 3', 'Kết quả luôn về số nguyên, mất phần thập phân', 'Chỉ ném lỗi khi divisor bằng 0'],
      answer: 3,
      explain: 'Đáp án D đúng: divide không tham số yêu cầu kết quả chia hết chính xác; 10/3 = 3.333… không hết nên ném ArithmeticException. Phải truyền scale và RoundingMode để quy định làm tròn. A sai: Java không tự đoán scale. B sai: mất phần thập phân không phải hành vi của divide. C sai: divisor 0 ném ArithmeticException riêng, không liên quan.'
    },
    {
      q: 'Tổng 10.00 chia cho 3 kỳ, làm tròn mỗi kỳ về 3.33 thì tổng ba kỳ là 9.99, thiếu 0.01. Cách xử lý đúng theo quy tắc phân bổ?',
      options: ['Bỏ qua 0.01 vì số nhỏ, tổng không bắt buộc khớp', 'Cộng phần dư 0.01 vào kỳ đầu theo thứ tự ổn định, ví dụ 3.34, 3.33, 3.33, tổng lại bằng 10.00', 'Làm tròn mỗi kỳ lên 3.34, tổng thành 10.02', 'Chia lại từ đầu cho đến khi tổng đúng 10.00'],
      answer: 1,
      explain: 'Đáp án B đúng: tính ở đơn vị nhỏ nhất (cent), lấy phần nguyên và phần dư, rồi cấp phần dư vào các kỳ đầu theo thứ tự xác định — tổng vẫn bằng 10.00 và có thể kiểm tra lại (audit). A/C/D sai: bỏ qua làm sai đối soát, làm tròn lên làm tổng vượt, và “chia lại từ đầu” không phải quy tắc xác định.'
    }
  ], related: ['core-001'], tags: ['BigDecimal', 'money']
},
{
  id: 'lesson-core-005', track: 'core', order: 5,
  title: 'String, StringBuilder và String pool', level: 'mid', minutes: 25,
  goals: ['Giải thích tính bất biến của String và string pool', 'Chọn StringBuilder cho phép nối lặp', 'Chuẩn hoá và che dữ liệu định danh an toàn'],
  body: `**Tóm tắt:** {{String}} bất biến nên có thể chia sẻ an toàn và dùng làm key trong {{HashMap}}; nối lặp trong vòng lặp có thể tạo nhiều object trung gian và tốn bộ nhớ, nên dùng {{StringBuilder}}. String pool canonicalize một số literal để tối ưu bộ nhớ; so sánh nội dung bằng {{equals}}, không dựa vào identity ({{==}}) hay gọi {{intern}} tùy tiện.

### String và pool
String lưu nội dung không đổi sau khi tạo. "Bất biến" có nghĩa là khi bạn gán một chuỗi vào biến, nội dung của chuỗi đó sẽ không bao giờ thay đổi; nếu muốn nội dung khác, Java phải tạo một chuỗi mới. Ví dụ như viết tên khách hàng lên một tờ biên nhận rồi photocopy: bản gốc không đổi, bạn chỉ có thêm một bản mới. Phép {{concat}} (nối chuỗi) không sửa chuỗi cũ mà trả chuỗi mới; nhờ vậy hash cache, chia sẻ và dùng làm key ổn định. Literal như {{"java"}} được đưa vào pool; compiler có thể gộp literal hằng. {{new String("java")}} tạo object riêng dù nội dung bằng nhau.

~~~java
String a = "java", b = new String("java");
boolean sameText = a.equals(b); // true: cùng nội dung
boolean sameObject = a == b;    // false: khác object, khác vùng nhớ
~~~

{{==}} trên reference kiểm tra cùng object (cùng vùng nhớ), không phải cùng ký tự. {{intern()}} yêu cầu canonical string từ pool nhưng giữ chuỗi trong pool có chi phí và thường không cần trong ứng dụng. Dùng nó chỉ khi đã đo cardinality (số lượng giá trị khác nhau) và lợi ích bộ nhớ.

### Cơ chế từng bước: StringBuilder hoạt động như thế nào
StringBuilder là một "buffer" (vùng nhớ đệm) có thể thay đổi nội dung, khác với String immutable. Khi bạn gọi {{append()}}, Java ghi thêm nội dung vào cuối buffer thay vì tạo chuỗi mới mỗi lần.

1. **Cái gì**: {{StringBuilder}} giữ một mảng char nội bộ (buffer) và một con trỏ chỉ số phần tử cuối cùng.
2. **Vì sao cần**: Nối {{result += part}} trong vòng lặp tạo một String mới mỗi lần, phải copy toàn bộ nội dung cũ sang chuỗi mới; khi kết quả dài dần, tổng số ký tự copy tăng theo bậc hai (O(n²)), chậm và tạo nhiều rác (garbage) trên heap (vùng nhớ JVM quản lý).
3. **Hoạt động thế nào**: {{append()}} ghi nội dung vào buffer, nếu buffer đầy thì tạo mảng mới gấp đôi và copy qua (gần như cách {{ArrayList}} grow). Cuối cùng gọi {{toString()}} tạo một String duy nhất từ nội dung buffer.
4. **Ví dụ cụ thể**: nối 3 phần "A", "B", "C": buffer ban đầu trống → append "A" → "A" → append "B" → "AB" → append "C" → "ABC" → toString() tạo "ABC" một lần duy nhất.
5. **Lỗi hay gặp**: dùng StringBuilder trong nhiều thread cùng lúc không an toàn (không thread-safe, tức không an toàn khi nhiều luồng cùng truy cập); nếu cần, dùng {{StringBuffer}} hoặc xử lý đồng bộ bên ngoài, nhưng đồng bộ từng thao tác không làm cả chuỗi nghiệp vụ atomic (thực hiện toàn bộ như một bước không thể tách).

Ví dụ ngắn (không dùng trong nhiều thread):

~~~java
StringBuilder sb = new StringBuilder(64);   // dự kiến 64 ký tự, tránh cấp buffer nhiều lần
for (String part : parts) {
    sb.append(part);                        // ghi vào buffer, không tạo String mới
}
String result = sb.toString();              // tạo String cuối cùng một lần duy nhất
~~~

### Chi phí nối chuỗi
Trong vòng lặp, {{result += part}} tạo chuỗi mới mỗi lần vì String immutable; tổng lượng ký tự copy có thể tăng bậc hai khi kết quả tăng từng chút. {{StringBuilder}} giữ buffer mutable, mở rộng khi cần, rồi tạo String cuối bằng {{toString}}. Java compiler tối ưu biểu thức nối đơn giản trong một biểu thức, nhưng không thể gộp tùy ý qua vòng lặp nhiều lần.

| Cách | Dùng khi | Ghi chú |
|---|---|---|
| {{+}} | biểu thức ngắn, dễ đọc | compiler thường tối ưu |
| {{StringBuilder}} | ghép lặp trong một thread | không thread-safe |
| {{StringBuffer}} | API legacy cần đồng bộ từng thao tác | đồng bộ không làm cả chuỗi nghiệp vụ atomic |

### Chuẩn hoá và che dữ liệu
Định nghĩa chuẩn hoá theo domain (lĩnh vực nghiệp vụ): số thẻ có thể bỏ dấu cách/gạch nối nhưng không được bỏ ký tự tùy tiện; tài khoản có thể giữ số 0 đầu, nên không parse sang long. Mask chỉ giữ suffix cần thiết và không log giá trị gốc. Dùng builder với capacity dự kiến để tránh cấp buffer nhiều lần.

Chuỗi Java immutable cũng có mặt trái: không thể xoá chắc chắn bản sao chứa mật khẩu khỏi heap. Với secret ngắn hạn, API char[] cho phép caller ghi đè, dù GC/serialization/logging vẫn cần cẩn trọng. Không dùng String cho credential (thông tin đăng nhập) rồi tin rằng {{null}} sẽ xoá bộ nhớ ngay.

### Pitfall production
- Log request trước khi mask: dữ liệu đã rời khỏi luồng an toàn; mask tại boundary trước log.
- {{substring}} không phải chuẩn hoá Unicode. Chữ nhìn giống nhau có thể có nhiều code point (đơn vị cơ bản của ký tự); nghiệp vụ quốc tế cần xác định Unicode normalization cụ thể.
- Mask theo số ký tự thay vì ký tự số sau chuẩn hoá có thể làm lộ nhiều hơn dự kiến.
- Không dùng {{==}} cho nội dung, và đừng dựa vào pool để sửa lỗi so sánh.
- StringBuilder có thể tăng bộ đệm và giữ dữ liệu nhạy cảm trong bộ nhớ; tránh ghi vào log/debug.

### Liên hệ phỏng vấn
- Nối chuỗi trong vòng lặp với StringBuilder khác nhau như thế nào? → Nối bằng {{+}} trong vòng lặp tạo một String mới mỗi lần, tổng ký tự copy tăng bậc hai (O(n²)); StringBuilder ghi vào buffer mutable rồi tạo String một lần, tổng chi phí là O(n).
- String pool là gì và dùng khi nào? → Pool canonicalize (đưa về dạng chuẩn) literal cùng nội dung thành một object để tiết kiệm bộ nhớ; dùng cho hằng số lặp lại nhiều, không dùng làm cache nghiệp vụ và không gọi {{intern}} tùy tiện vì giữ chuỗi trong pool có chi phí.
- So sánh hai chuỗi nên dùng {{equals}} hay {{==}}? → {{equals}} so nội dung ký tự; {{==}} so cùng vùng nhớ. Hai chuỗi cùng nội dung nhưng tạo khác nhau (ví dụ {{new String("java")}} với literal) thì {{==}} cho false, {{equals}} cho true.
`,
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
  }],   check: [{
    q: 'Hai chuỗi {{"java"}} và {{new String("java")}} có cùng nội dung. So sánh bằng {{==}} và {{equals}} kết quả ra sao?',
    options: ['{{==}} và {{equals}} đều cho true', '{{==}} cho true, {{equals}} cho false', '{{==}} cho false, {{equals}} cho true', 'Cả hai đều cho false'],
    answer: 2,
    explain: 'Đáp án C đúng: {{==}} so sánh vùng nhớ (identity), hai object khác nhau nên false; {{equals}} so sánh nội dung ký tự, cả hai là "java" nên true. A sai: {{==}} không so nội dung. B sai: ngược lại. D sai: {{equals}} cho true.'
  }, {
    q: 'Trong vòng lặp, nối chuỗi bằng {{result += part}} nhiều lần gây chi phí cao vì lý do gì?',
    options: ['Compiler từ chối biên dịch vòng lặp nối chuỗi', 'Phải dùng {{StringBuffer}} thay vì {{StringBuilder}}', 'String bất biến, mỗi lần nối phải tạo chuỗi mới và copy toàn bộ nội dung cũ', 'StringBuilder không được dùng trong vòng lặp'],
    answer: 2,
    explain: 'Đáp án C đúng: String bất biến nên mỗi {{+=}} tạo String mới, copy toàn bộ nội dung cũ; tổng ký tự copy tăng bậc hai (O(n²)) khi kết quả dài dần. A sai: compiler cho phép. D sai: StringBuilder dùng được trong vòng lặp (một thread). B sai: StringBuffer cũng được nhưng có chi phí đồng bộ, không bắt buộc.'
  }, {
    q: 'String pool dùng làm gì, và khi nào nên gọi {{intern()}}?',
    options: ['Pool canonicalize literal cùng nội dung thành một object để tiết kiệm bộ nhớ; gọi {{intern}} chỉ khi đã đo thấy lợi ích bộ nhớ', 'Pool lưu tất cả chuỗi trong ứng dụng, gọi {{intern}} cho mọi chuỗi tạo bằng {{new String()}}', 'Pool là cache nghiệp vụ, dùng để lưu kết quả truy vấn database', 'Pool tự động xoá chuỗi không dùng nữa, không cần quan tâm'],
    answer: 0,
    explain: 'Đáp án A đúng: pool canonicalize (đưa về dạng chuẩn) literal cùng nội dung thành một object duy nhất, tiết kiệm bộ nhớ cho hằng số lặp lại nhiều. {{intern}} giữ chuỗi trong pool có chi phí, chỉ dùng khi đo thấy cần. B sai: pool không lưu tất cả chuỗi, và gọi {{intern}} cho mọi chuỗi gây chi phí lớn. C sai: pool không phải cache nghiệp vụ. D sai: pool không tự xoá chuỗi theo cách người dùng có thể dự kiến.'
  }, {
    q: 'Lỗi production hay gặp khi so sánh chuỗi là dùng {{==}} thay vì {{equals}}. Hệ quả là gì?',
    options: ['Chương trình ném NullPointerException ngay lập tức', 'Chương trình chạy nhanh hơn vì không cần duyệt ký tự', 'Chỉ sai khi chuỗi dài hơn 100 ký tự', 'Hai chuỗi cùng nội dung nhưng khác object bị coi là khác nhau, gây sai logic nghiệp vụ'],
    answer: 3,
    explain: 'Đáp án D đúng: {{==}} so sánh vùng nhớ, hai chuỗi cùng nội dung nhưng tạo khác nhau (literal vs {{new String("java")}}) sẽ được coi là khác, gây nhánh logic sai. A sai: {{==}} không ném NullPointerException khi cả hai không null. B sai: {{==}} nhanh nhưng không đúng ý nghĩa so nội dung. C sai: sai lệch không phụ thuộc độ dài.'
  }], related: ['core-001'], tags: ['String', 'StringBuilder', 'string pool']
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
        guard("HashSet không giữ hai phần tử trùng giá trị", () ->
            new HashSet<>(List.of(new Money(500, "VND"), new Money(500, "VND"), new Money(600, "VND"))).size() == 2);
        guard("khác tiền tệ thì không equals cùng số tiền", () -> {
            Money a = new Money(1000, "USD"), b = new Money(1000, "EUR");
            return !a.equals(b) && !b.equals(a);
        });
        guard("add trả object mới và không làm đổi hai số hạng", () -> {
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
        if (!currency.equals(other.currency)) throw new IllegalArgumentException("không cộng được khác tiền tệ");
        return new Money(Math.addExact(amountMinor, other.amountMinor), currency);
    }

    @Override public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Money m)) return false;
        return amountMinor == m.amountMinor && currency.equals(m.currency);
    }
    @Override public int hashCode() { return Objects.hash(amountMinor, currency); }

    @Override public int compareTo(Money other) {
        if (!currency.equals(other.currency)) throw new IllegalArgumentException("không so sánh được khác tiền tệ");
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
        if (error == null) throw new IllegalArgumentException("Result.failure phải có lỗi");
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
        throw new IllegalStateException("Không đọc được giá trị từ Result thất bại", error);
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
                if (!retryOn.test(e)) throw e;                       // lỗi không được phép retry: dừng ngay, giữ nguyên lỗi
                if (attempt == maxAttempts) {
                    for (Throwable earlier : history)
                        if (earlier != e) e.addSuppressed(earlier);   // Java cam gan mot exception vao chinh no
                    throw e;                                          // lỗi lần cuối nằm trong message, phần còn lại ở suppressed
                }
                history.add(e);
            }
        }
        throw new IllegalStateException("khong the xay ra");          // cần vì maxAttempts là biến, compiler không tự suy ra vòng lặp kết thúc
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
},
{
  id: 'lesson-core-008', track: 'core', order: 8,
  title: 'Record, sealed interface và pattern matching: mô hình hoá kết quả nghiệp vụ', level: 'senior', minutes: 30,
  goals: ['Viết record kèm compact constructor để chặn dữ liệu sai ngay lúc tạo', 'Mô hình hoá kết quả bằng sealed interface để trạng thái sai không còn biểu diễn được', 'Dùng instanceof pattern rẽ nhánh theo kiểu mà không cast thủ công', 'Nói được switch pattern Java 21 hơn gì ở tính đầy đủ và vì sao bài tập chỉ dùng Java 17'],
  body: `**Tóm tắt:** **record** là class chứa dữ liệu chỉ đọc do compiler viết hộ: bạn khai báo danh sách thành phần (gọi là **component**), Java tự sinh field final, constructor, accessor, {{equals}}, {{hashCode}}, {{toString}}. **sealed interface** kèm {{permits}} niêm phong tập kiểu con được phép, nên kết quả thanh toán chỉ có thể là Success, Declined hoặc Failed — không có trạng thái thứ tư, không cần trả {{null}} và không cần cờ {{boolean}}. **instanceof pattern** ({{r instanceof Success s}}) vừa kiểm tra kiểu vừa tạo ra biến {{s}} đã được ép kiểu; còn **switch pattern** là tính năng Java 21, ở đây chỉ dùng để đọc hiểu vì bài tập biên dịch bằng Java 17.

### Từ class chứa dữ liệu đến record
Trước đây một class chỉ chở dữ liệu trông như sau: field final, constructor gán từng field, accessor cho từng field, rồi {{equals}}, {{hashCode}}, {{toString}} — khoảng ba mươi dòng, và ba dòng cuối là nơi hay sai nhất: quên một field trong {{equals}} làm hai đối tượng khác nhau bị coi là bằng nhau, quên trong {{hashCode}} khiến tra HashMap trả kết quả khó đoán.

~~~java
record Money(long amount, String currency) { }
~~~

Một dòng thay cho toàn bộ khối đó. Bảng dưới liệt kê đúng những gì compiler tự viết:

| Bạn chỉ khai báo | Compiler tự sinh |
|---|---|
| {{record Money(long amount, String currency)}} | mỗi component thành một field private final |
| | canonical constructor {{Money(long, String)}} đúng thứ tự component |
| | accessor {{amount()}} và {{currency()}} — không có tiền tố get |
| | {{equals}} và {{hashCode}} tính theo tất cả component, không thể quên field |
| | {{toString}} dạng {{Money[amount=1000, currency=VND]}} |

Hai điểm hay bị hỏi: accessor là {{amount()}} chứ không phải {{getAmount()}}, vì record không theo chuẩn JavaBeans (Jackson từ 2.12 đọc record qua constructor và component nên không cần getter); và record luôn ngầm định là **final** đồng thời đã kế thừa {{java.lang.Record}} — nên nó không kế thừa class khác, implement interface thì bình thường, và không được khai thêm field nội bộ ngoài component (static field thì được).

### Compact constructor: chốt chặn ngay ở cửa
**Compact constructor** là khối thân viết ngắn bằng tên record, không có danh sách tham số. Nó chạy **trước khi** các field được gán; cuối thân, compiler tự chèn lệnh gán field từ chính tham số.

~~~java
record Money(long amount, String currency) {
    Money {                                                      // compact: không ghi (long amount, ...)
        if (amount < 0) throw new IllegalArgumentException("amount phai >= 0");
        currency = currency.toUpperCase(java.util.Locale.ROOT);   // chuẩn hoá THAM SỐ, không ghi this
    }
}
~~~

Vì sao phải chạy trước lúc gán? Vì field là final, chỉ được gán một lần, và lần gán đó là phần compiler thêm vào cuối. Nếu bạn viết {{this.currency = ...}} trong compact constructor, compiler báo lỗi "cannot assign a value to final variable currency" — đó là cách Java nhắc bạn: muốn biến đổi giá trị thì ghi đè tham số.

> Lưu ý thiết kế: khi việc kiểm tra nằm trong constructor, mọi object Money tồn tại trong hệ thống đều đã hợp lệ. Các hàm phía sau không cần lặp lại điều kiện {{amount < 0}} nữa. Đó là **bất biến** (invariant): một điều luôn đúng suốt vòng đời của object, và nơi duy nhất cần kiểm tra là lúc tạo.

| Muốn gì | Dùng cách nào |
|---|---|
| Chặn hoặc chuẩn hoá dữ liệu đầu vào | compact constructor |
| Thêm cách tạo thuận tiện, ví dụ tự suy ra tiền tệ | overload gọi {{this(amount, "VND")}} |
| Cắt liên kết với list/mảng của người gọi | {{List.copyOf}} trong compact constructor |
| Đổi hình thức chữ ký công khai | canonical constructor viết tay, giữ đúng kiểu và thứ tự component |

### Bất biến nông: record không tự bảo vệ nội dung bên trong
Field final chỉ đảm bảo **cái tham chiếu** không đổi. Nếu component là {{List}} hoặc mảng mà người gọi vẫn giữ bản gốc, họ sửa được nội dung bên trong; mà {{hashCode}} của record tính theo nội dung, nên object đang nằm trong HashMap/HashSet sẽ "mất tích" khi tra.

~~~java
record Basket(String id, List<String> items) {
    Basket { items = List.copyOf(items); }        // bản sao bất biến: người gọi hết đường sửa
}
~~~

{{List.copyOf}} vừa copy vừa trả về list không cho sửa — đó là defensive copy ở cửa vào, cùng nguyên tắc với bài Immutable object và defensive copy trong track này.

### Sealed interface: niêm phong danh sách kiểu con
Mục tiêu mô hình hoá: "một lệnh thanh toán có đúng ba số phận".

~~~java
sealed interface PaymentResult permits Success, Declined, Failed {
    long amount();                                   // ba subtype đều phải có số tiền
}
record Success(long amount, String reference, long fee) implements PaymentResult { }
record Declined(long amount, String code, String message, boolean retryable) implements PaymentResult { }
record Failed(long amount, String message, Throwable cause) implements PaymentResult { }
~~~

{{permits}} liệt kê đúng những kiểu được phép implement; class khác muốn implement {{PaymentResult}} sẽ bị compiler từ chối. Mỗi subtype phải chọn một trong ba thái độ: final (không cho kế thừa tiếp), sealed (tiếp tục niêm phong) hoặc non-sealed (mở lại cho thế giới); record ngầm định là final nên không cần ghi gì. Các subtype phải nằm **cùng package** với kiểu sealed (nếu dự án dùng module thì cùng module); đặt chung một file là cách gọn nhất, khi đó có thể bỏ {{permits}} vì compiler tự suy ra.

Vì sao không dùng enum? Vì mỗi nhánh ở đây mang dữ liệu riêng: Declined cần {{code}} và {{retryable}}, Success cần {{reference}} và {{fee}}; enum constant là hằng đơn, muốn gắn dữ liệu khác nhau theo từng lần tạo phải nhét field vào enum và khi đó mọi constant mang mọi field. Vì sao không {{boolean ok}} cộng một mớ field rời? Vì cách đó cho phép biểu diễn trạng thái vô nghĩa.

| Cách mô hình hoá | Trạng thái vô nghĩa có tạo ra được không | Ai phát hiện |
|---|---|---|
| cờ boolean cùng field rời, cho phép null | Có: ok true nhưng reference null | người dùng, sau khi lỗi đã xảy ra |
| class cha mở cộng subclass | Có: thêm subtype mới mà không chỗ nào xử lý | code review, hoặc bug |
| sealed interface cùng record | Không: mỗi nhánh mang đúng dữ liệu của nó | compiler |

Đây là cách nói khác của nguyên tắc "make illegal states unrepresentable": thiết kế kiểu dữ liệu sao cho lỗi không viết ra được. Luồng thật của một lệnh thanh toán qua ba hệ thống, nơi {{PaymentResult}} ra đời:

~~~seq
title: Một lệnh thanh toán đi qua ba hệ thống
actors: Service | Bank Gateway | Ngan hang
Service -> Bank Gateway: POST /pay (so tien, ma don hang)
Bank Gateway -> Ngan hang: uy quyet the (authorization)
Ngan hang --> Bank Gateway: ma loi 51 (the het han)
Bank Gateway --> Service: 200 + ket qua DECLINED
Service --> Service: chuyen ket qua thanh Success hoac Declined
note Service..Ngân hàng: Service chỉ nhận PaymentResult, không bao giờ nhận null
~~~

### instanceof pattern (Java 16/17) và switch pattern (Java 21)
~~~java
static long charged(PaymentResult r) {
    if (r instanceof Success s) return s.amount();   // s đã là Success, không cần ép kiểu thủ công
    if (r instanceof Declined d) return 0L;
    if (r instanceof Failed f) return 0L;
    return 0L;                                       // Java 17 KHÔNG biết ba nhánh đã phủ hết
}
~~~

Biến {{s}} trong mẫu {{r instanceof Success s}} gọi là biến được **gắn** (binding variable): nó chỉ sống ở những điểm mà compiler chứng minh được điều kiện đã đúng — quy tắc này có tên flow scoping. Vì nếu điều kiện sai thì chẳng có object nào để ép kiểu, nên {{s}} không dùng được trong khối {{else}}. Cách an toàn nhất: trả kết quả ngay trong nhánh, đừng để dành biến cho phía sau. Giới hạn thứ hai: mẫu gộp kiểu {{if (r instanceof Declined || r instanceof Failed)}} không gắn được biến, vì compiler không biết nhánh nào đúng.

Dòng {{return 0L}} chót là chỗ gây khó chịu kinh điển: sealed cho ta biết chỉ có ba kiểu, nhưng chuỗi if thì không bị kiểm tra tính đầy đủ ở Java 17. Java 21 (JEP 441) sửa bằng switch pattern:

~~~java
static long charged21(PaymentResult r) {
    return switch (r) {                              // Java 21 — KHÔNG dùng trong bài tập dưới đây
        case Success s -> s.amount();
        case Declined d -> 0L;
        case Failed f -> 0L;                         // không cần default: sealed đã liệt kê đủ
    };
}
~~~

Ở dạng này compiler **buộc** phủ hết mọi subtype, và record pattern còn bóc luôn component: {{case Success(amt, ref, fee) -> ...}}, kèm điều kiện phụ khi (guard): {{case Declined d when d.retryable() -> ...}}. Hệ quả thực tế rất đáng tiền: thêm {{Crypto}} vào {{permits}} thì mọi switch không có default đều **lỗi biên dịch** và liệt kê đúng những chỗ phải sửa. Nếu bạn theo thói quen viết default, lợi ích này biến mất, vì default nuốt luôn subtype mới.

Một chi tiết về null: {{switch}} trên giá trị null ném {{NullPointerException}} nếu không có {{case null}} (Java 21 cho phép viết {{case null}}), còn chuỗi if/else instanceof thì null âm thầm rơi xuống dòng chót. Nếu null không phải đầu vào hợp lệ, mở đầu hàm bằng {{Objects.requireNonNull(r, "result")}}.

> Senior tip: thứ giết bạn trên production không phải cú pháp mà là **chỗ xử lý thiếu nhánh**. Codebase Java 17 dùng chuỗi if/else instanceof: thêm subtype mới là im lặng rơi vào nhánh cuối, ví dụ trả 0 đồng thay vì báo lỗi. Ba biện pháp phòng ngừa: gom mọi lần "dịch" {{PaymentResult}} sang hành vi vào **một** hàm duy nhất; viết unit test cho từng subtype; khi lên Java 21 thì đổi sang switch pattern và xoá được cả hai thứ đó.

### Pitfall production
- Dùng record làm JPA **entity**: Hibernate cần class không final để tạo proxy lazy loading, cần constructor không tham số và field gán lại được khi load. Record rất hợp làm DTO/projection; từ Hibernate 6.2 record còn dùng làm {{@Embeddable}} được.
- Component là {{List}} hoặc mảng mà không copy: nội dung bị sửa từ bên ngoài, {{equals}}/{{hashCode}} đổi theo, object mất tích trong HashMap/HashSet.
- Ghi {{this.x = ...}} trong compact constructor: lỗi biên dịch; muốn chuẩn hoá thì ghi đè tham số.
- {{toString}} của record in **toàn bộ** component: nếu record chứa PAN, token, mật khẩu thì log sẽ lộ. Override {{toString}} để mask là hợp lệ và nên làm ngay khi tạo.
- {{equals}} so theo component nên hai record khác kiểu cùng giá trị vẫn không bằng nhau; khi cần so theo nghiệp vụ, so qua accessor chung của interface ({{amount()}}) thay vì {{equals}}.
- Sealed subtype đặt ở package khác: lỗi "illegal inheritance" khó hiểu — nhớ quy tắc cùng package/module.
- Không kiểm tra tham số ở cửa, để NPE nổ ở tầng mapper cách xa nơi nhận dữ liệu sai; người điều tra mất một buổi để tìm một dòng {{null}}.
- Nghĩ rằng "record bất biến nên tạo bao nhiêu cũng được": mỗi lần "sửa" là một object mới. Vòng lặp đọc hai triệu dòng sẽ thấy áp lực allocation — nhưng đó là việc đo xong hãy tối ưu, không phải lý do để bỏ record.

### Liên hệ phỏng vấn
Câu hỏi đi theo trình tự: record khác class thường ở điểm nào, compact constructor chạy lúc nào và có được gán {{this.x}} không, sealed cho ta gì mà interface thường không có, exhaustiveness hoạt động ra sao khi thêm subtype, vì sao không dùng record làm entity, instanceof pattern khác switch pattern ở phiên bản nào. Cách trả lời ăn điểm: **cơ chế → lợi ích an toàn kiểu → giới hạn thực tế (component mutable, JPA, toString)** rồi khép bằng một kinh nghiệm, ví dụ "chúng tôi gom việc chuyển kết quả sang một hàm và đổi sang switch pattern khi lên Java 21, nhờ đó mọi chỗ chưa xử lý lộ ra ngay lúc biên dịch".`,
  exercises: [{
    title: 'PaymentResult sealed, instanceof pattern và compact constructor',
    prompt: `Mô hình hoá kết quả một lệnh thanh toán bằng sealed interface cùng ba record, rồi xử lý bằng instanceof pattern. **Chỉ dùng tính năng có trong Java 17**: không switch pattern, không record pattern.
- {{sealed interface PaymentResult}} permits đúng ba kiểu {{Success}}, {{Declined}}, {{Failed}}; mỗi kiểu là một record và đều có component {{amount}} kiểu {{long}} (VND); interface khai báo {{long amount();}}.
- {{Success}} có thêm {{reference}} (mã giao dịch) và {{fee}} (phí, {{long}}). {{Declined}} có thêm {{code}}, {{message}} và {{retryable}} ({{boolean}}). {{Failed}} có thêm {{message}} và {{cause}} ({{Throwable}}).
- Compact constructor **từ chối dữ liệu sai ngay lúc tạo**: {{amount < 0}} → {{IllegalArgumentException}} có message chứa chữ amount, áp dụng cho cả ba record; {{reference}} null hoặc chỉ toàn khoảng trắng → {{IllegalArgumentException}} chứa reference; {{code}} null hoặc trắng → {{IllegalArgumentException}} chứa code; ở {{Failed}}, {{cause}} null → {{NullPointerException}} có message đúng bằng chuỗi cause.
- {{Checkout.charged(r)}}: Success trả {{amount}}, Declined trả 0, Failed trả 0.
- {{Checkout.receipt(r)}}: Success → "OK " + reference + " " + (amount - fee); Declined → "NO " + code + " REUSE" nếu retryable, ngược lại "NO " + code + " STOP"; Failed → "ERR " + message.
- {{Checkout.retryLater(r)}}: chỉ true khi Declined mà retryable, hoặc khi Failed; Success → false.
Viết rẽ nhánh bằng mẫu {{if (r instanceof Success s)}}, không ép kiểu thủ công. Không đọc ngày giờ, không random, không sleep: chạy hai lần phải cho cùng kết quả.`,
    starter: `sealed interface PaymentResult permits Success, Declined, Failed {
    long amount();
}

record Success(long amount, String reference, long fee) implements PaymentResult {
    Success {
        throw new UnsupportedOperationException("TODO");
    }
}

record Declined(long amount, String code, String message, boolean retryable) implements PaymentResult {
    Declined {
        throw new UnsupportedOperationException("TODO");
    }
}

record Failed(long amount, String message, Throwable cause) implements PaymentResult {
    Failed {
        throw new UnsupportedOperationException("TODO");
    }
}

class Checkout {
    static long charged(PaymentResult r) { throw new UnsupportedOperationException("TODO"); }
    static String receipt(PaymentResult r) { throw new UnsupportedOperationException("TODO"); }
    static boolean retryLater(PaymentResult r) { throw new UnsupportedOperationException("TODO"); }
}`,
    tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, Runnable r) {
        total++;
        try { r.run(); passed++; System.out.println("PASS " + name); }
        catch (Throwable t) { System.out.println("FAIL " + name + ": " + t); }
    }
    static void eq(Object expected, Object actual) {
        if (!Objects.equals(expected, actual)) throw new AssertionError("muốn " + expected + " nhận " + actual);
    }
    static Throwable thrown(Runnable body) {
        try { body.run(); return null; } catch (Throwable t) { return t; }
    }
    public static void main(String[] args) {
        Success ok = new Success(1000L, "T1", 10L);
        Declined no = new Declined(1000L, "51", "the het han", false);
        Declined retry = new Declined(1000L, "96", "ngan hang bom", true);
        Throwable boom = new IllegalStateException("socket timeout");
        Failed err = new Failed(1000L, "khong goi duoc gateway", boom);

        check("charged chi trut tien khi Success", () -> {
            eq(1000L, Checkout.charged(ok));
            eq(0L, Checkout.charged(no));
            eq(0L, Checkout.charged(err));
        });
        check("receipt cua Success la OK reference va tien thuc thu", () -> eq("OK T1 990", Checkout.receipt(ok)));
        check("receipt cua Declined phan biet retryable", () -> {
            eq("NO 51 STOP", Checkout.receipt(no));
            eq("NO 96 REUSE", Checkout.receipt(retry));
        });
        check("receipt cua Failed la ERR kem message", () -> eq("ERR khong goi duoc gateway", Checkout.receipt(err)));
        check("retryLater: Success false, Declined theo retryable, Failed true", () -> {
            eq(false, Checkout.retryLater(ok));
            eq(false, Checkout.retryLater(no));
            eq(true, Checkout.retryLater(retry));
            eq(true, Checkout.retryLater(err));
        });
        check("compact constructor tu choi amount am o ca ba record", () -> {
            Throwable t1 = thrown(() -> new Success(-1L, "T1", 0L));
            Throwable t2 = thrown(() -> new Declined(-1L, "51", "x", false));
            Throwable t3 = thrown(() -> new Failed(-1L, "x", boom));
            eq(true, t1 instanceof IllegalArgumentException);
            eq(true, t2 instanceof IllegalArgumentException);
            eq(true, t3 instanceof IllegalArgumentException);
            eq(true, t1.getMessage().contains("amount"));
            eq(true, t2.getMessage().contains("amount"));
            eq(true, t3.getMessage().contains("amount"));
        });
        check("compact constructor tu choi reference va code rong", () -> {
            Throwable a = thrown(() -> new Success(1L, null, 0L));
            Throwable b = thrown(() -> new Success(1L, "   ", 0L));
            Throwable c = thrown(() -> new Declined(1L, "", "x", false));
            eq(true, a instanceof IllegalArgumentException);
            eq(true, b instanceof IllegalArgumentException);
            eq(true, a.getMessage().contains("reference"));
            eq(true, b.getMessage().contains("reference"));
            eq(true, c instanceof IllegalArgumentException);
            eq(true, c.getMessage().contains("code"));
        });
        check("Failed yeu cause: thieu cause la NullPointerException voi message cause", () -> {
            Throwable t = thrown(() -> new Failed(1L, "loi", null));
            eq(true, t instanceof NullPointerException);
            eq("cause", t.getMessage());
        });
        check("record so sanh theo gia tri va toString lo component", () -> {
            Success same = new Success(1000L, "T1", 10L);
            eq(true, ok.equals(same));
            eq(true, ok.hashCode() == same.hashCode());
            eq(true, ok.toString().contains("reference=T1"));
            Map<Success, String> seen = new HashMap<>();
            seen.put(ok, "lan dau");
            seen.put(same, "lan hai");
            eq(1, seen.size());
            eq("lan hai", seen.get(new Success(1000L, "T1", 10L)));
        });
        check("Failed giu dung instance cause de con dieu tra", () -> {
            eq(true, err.cause() == boom);
            eq("socket timeout", err.cause().getMessage());
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
    reference: `sealed interface PaymentResult permits Success, Declined, Failed {
    long amount();
}

record Success(long amount, String reference, long fee) implements PaymentResult {
    Success {
        if (amount < 0) throw new IllegalArgumentException("amount phai >= 0");
        if (reference == null || reference.isBlank()) throw new IllegalArgumentException("reference không được trống");
    }
}

record Declined(long amount, String code, String message, boolean retryable) implements PaymentResult {
    Declined {
        if (amount < 0) throw new IllegalArgumentException("amount phai >= 0");
        if (code == null || code.isBlank()) throw new IllegalArgumentException("code không được trống");
    }
}

record Failed(long amount, String message, Throwable cause) implements PaymentResult {
    Failed {
        if (amount < 0) throw new IllegalArgumentException("amount phai >= 0");
        Objects.requireNonNull(cause, "cause");
    }
}

class Checkout {
    static long charged(PaymentResult r) {
        if (r instanceof Success s) return s.amount();
        if (r instanceof Declined d) return 0L;
        if (r instanceof Failed f) return 0L;
        return 0L;                        // Java 17 khong chứng minh ba nhánh đã đủ, hàm vẫn cần lối ra
    }
    static String receipt(PaymentResult r) {
        if (r instanceof Success s) return "OK " + s.reference() + " " + (s.amount() - s.fee());
        if (r instanceof Declined d) return "NO " + d.code() + (d.retryable() ? " REUSE" : " STOP");
        if (r instanceof Failed f) return "ERR " + f.message();
        return "UNKNOWN";
    }
    static boolean retryLater(PaymentResult r) {
        if (r instanceof Declined d) return d.retryable();
        if (r instanceof Failed) return true;
        return false;                     // Success, và mỗi subtype chưa được xử lý
    }
}`,
    hints: ['Compact constructor chỉ ghi tên record rồi đến khối thân, không có danh sách tham số. Muốn chuẩn hoá thì ghi đè tham số, đừng gán vào this.', 'Kiểm tra chuỗi rỗng nên viết {{reference == null || reference.isBlank()}}: isBlank coi chuỗi chỉ toàn khoảng trắng là rỗng (có từ Java 11).', 'Mẫu instanceof viết là {{if (r instanceof Success s)}} — một cặp ngoặc đơn bao điều kiện, biến s chỉ dùng được bên trong nhánh đó.', 'Hàm vẫn cần một dòng return cuối vì compiler Java 17 không biết ba nhánh instanceof đã phủ hết sealed type; đó chính là chỗ switch pattern của Java 21 giúp bạn.'],
    explain: `Mỗi record tự sinh accessor {{amount()}} từ component trùng tên, nên ba subtype thoả mãn khai báo {{long amount();}} của interface mà không phải viết thêm dòng nào. Compact constructor chạy trước lúc gán field: nếu {{amount < 0}} thì object không hề tồn tại, vì thế {{charged}} không bao giờ phải đề phòng số âm. Dòng {{Objects.requireNonNull(cause, "cause")}} trả lại chính xác instance được truyền vào và chỉ ném khi nó null — kiểu lỗi này hợp với thất bại từ hạ tầng (gọi gateway hỏng) nơi bạn muốn một message ngắn gọn chứ không phải exception nghiệp vụ. Test {{err.cause() == boom}} khẳng định record giữ nguyên instance chứ không tạo bản sao, nên stack trace gốc còn nguyên để điều tra. Điều kiện {{equals}}/{{hashCode}} do compiler sinh cũng là lý do nhiều đội dùng record làm key: hai {{Success}} cùng giá trị chỉ tạo một entry trong HashMap, và {{toString}} in sẵn tên component nên log đọc được ngay — nhớ mask trước khi để nó in dữ liệu nhạy cảm.`
  }], check: [{
    q: 'Compact constructor của record chạy ở thời điểm nào và được phép làm gì?',
    options: ['Chạy sau khi field đã gán, nên muốn chuẩn hoá phải ghi this.x = ...', 'Chạy trước khi field được gán: bạn validate hoặc ghi đè tham số, còn gán this.x sẽ bị compiler báo lỗi', 'Chỉ chạy với record không có component, dùng để khởi tạo giá trị static', 'Là constructor bắt buộc mà compiler sinh ra khi bạn tự viết canonical constructor'],
    answer: 1,
    explain: 'Compiler tự chèn phần gán field vào cuối compact constructor, nên thân hàm làm việc với tham số. Field của record là final và chưa được gán lúc thân chạy, vì vậy ghi this.x sẽ nhận lỗi cannot assign a value to final variable.'
  },{
    q: 'Codebase Java 17 xử lý PaymentResult bằng chuỗi if/else instanceof. Thêm một subtype mới vào danh sách permits thì gì xảy ra?',
    options: ['Compiler báo lỗi ở mọi chỗ rẽ nhánh chưa xử lý subtype mới', 'Runtime ném illegal subtype exception nên test sẽ phát hiện ngay', 'Không có lỗi biên dịch: nhánh mới im lặng rơi vào phần xử lý còn lại của hàm và có thể trả giá trị sai', 'Toàn bộ record cũ bị vô hiệu hoá và phải viết lại equals'],
    answer: 2,
    explain: 'Chuỗi if không bị kiểm tra tính đầy đủ, kể cả khi kiểu là sealed. Đây là loại bug không ném exception: đơn hàng kiểu mới bị coi như thất bại hoặc bị trừ 0 đồng. Chỉ switch pattern của Java 21 mới buộc phủ hết, và khi đó đừng viết default.'
  },{
    q: 'Vì sao record không phù hợp làm JPA entity nhưng lại phù hợp làm DTO?',
    options: ['Vì record không có equals và hashCode nên JPA không so sánh được', 'Vì entity cần class không final để Hibernate tạo proxy lazy loading, cần constructor không tham số và field gán lại được; DTO chỉ cần chở dữ liệu bất biến', 'Vì record chỉ chứa kiểu số nguyên nên không ánh xạ được cột', 'Vì Jackson không đọc được record nên mọi tầng đều phải dùng class thường'],
    answer: 1,
    explain: 'Hibernate kế thừa class entity để làm lazy loading và dirty checking, nên class final như record bị loại. Record vẫn là lựa chọn tốt cho DTO, cho projection trong query, và từ Hibernate 6.2 là @Embeddable. Jackson từ 2.12 hỗ trợ record trực tiếp qua canonical constructor.'
  },{
    q: 'Đoạn code: if (r instanceof Success s) return s.reference(); Sau dòng if này, biến s còn dùng được không?',
    options: ['Có, vì s được khai báo ở phạm vi cả hàm', 'Không: s chỉ tồn tại ở những điểm mà compiler chứng minh điều kiện đúng (flow scoping); muốn dùng tiếp thì xử lý trọn trong nhánh hoặc gán ra biến riêng', 'Chỉ dùng được nếu Success là subtype của sealed interface', 'Chỉ dùng được khi viết thêm case null'],
    answer: 1,
    explain: 'Biến được gắn của instanceof pattern chỉ đi vào scope tại nhánh mà điều kiện chắc chắn đúng. Nếu điều kiện sai thì không có đối tượng nào để ép kiểu, nên giữ s sống tiếp sẽ phá vỡ an toàn kiểu — đây cũng là lý do nên return ngay trong nhánh.'
  }], related: ['modern-003', 'core-003', 'core-007'], tags: ['record', 'sealed', 'pattern matching', 'Java 17', 'domain modeling']
},
{
  id: 'lesson-core-009', track: 'core', order: 9,
  title: 'Optional và xử lý null đúng cách: kiểu trả về, cửa vào và giá trị mặc định đắt', level: 'mid', minutes: 25,
  goals: ['Diễn giải được vì sao NullPointerException nổ ở nơi xa chỗ nhận dữ liệu sai', 'Dùng Optional đúng chỗ: kiểu trả về, không dùng cho field, tham số và phần tử collection', 'Viết chuỗi lookup bằng map/flatMap thay cho null-check lồng nhau và giải thích map xử lý hàm trả null thế nào', 'Chọn orElse hay orElseGet dựa trên chi phí tính giá trị mặc định, và chặn null ở cửa vào bằng Objects.requireNonNull'],
  body: `**Tóm tắt:** {{null}} nghĩa là "biến này không trỏ tới object nào"; chỉ cần gọi method trên nó là JVM ném {{NullPointerException}}. {{Optional}} là một object nhỏ bọc giá trị, hoặc có một giá trị hoặc không có gì, tồn tại để nói ngay trong kiểu trả về rằng "kết quả có thể vắng mặt". Nó hợp làm **kiểu trả về**, không hợp làm field, tham số method hay phần tử collection. {{orElse}} nhận một **giá trị** nên giá trị đó đã được tính trước khi hàm chạy; {{orElseGet}} nhận một **công thức chưa chạy** ({{Supplier}}) và chỉ gọi khi thật sự thiếu.

### Null là gì và vì sao nó tai hại
Biến kiểu object không chứa object, nó chứa **tham chiếu** (địa chỉ tới object trên heap). {{null}} là giá trị đặc biệt của tham chiếu: "không có gì ở đây". Đọc field hoặc gọi method trên một tham chiếu null thì JVM ném {{NullPointerException}} — một {{RuntimeException}}, nên compiler không ép bạn xử lý nó.

Vấn đề không phải là NPE, mà là **nơi nó nổ thường không phải nơi dữ liệu bị hỏng**:

~~~java
String city = order.getCustomer().getAddress().getCity().toUpperCase();
// NPE ở dòng này, nhưng dữ liệu thiếu có thể được ghi từ 3 tầng trước, hoặc từ một job import lúc 2 giờ sáng
~~~

Chiều sâu thật của chuỗi này: mỗi tầng tin rằng tầng dưới sẽ không trả null. Khi một tầng phá lời hứa, cả hệ thống mang nợ, và người trả nợ là người đọc stack trace.

### Chặn dữ liệu sai ở cửa vào
{{Objects}} là class tiện ích trong {{java.util}}. Ba cách dùng quan trọng nhất:

~~~java
void ship(User user, String id) {
    Objects.requireNonNull(user, "user");                 // NPE với message "user"
    Objects.requireNonNull(id);                           // NPE nhưng message null -> log rất vô ích
    if (id.isBlank()) throw new IllegalArgumentException("id rong: " + id);  // lỗi do caller, kèm ngữ cảnh
}
~~~

Quy tắc chọn: {{requireNonNull}} cho tiền điều kiện "không được null" (lỗi của người gọi code, thường là bug); {{IllegalArgumentException}} khi null **là** một input hợp lệ về cú pháp nhưng nghiệp vụ không chấp nhận; còn nếu sự vắng mặt là chuyện bình thường thì đừng báo lỗi — trả {{Optional.empty()}}. {{requireNonNull}} có hai họ nữa hay bị bỏ quên: {{requireNonNullElse(x, "mac-dinh")}} (lấy giá trị dự phòng) và {{requireNonNullElseGet(x, () -> expensive())}} (chỉ tính dự phòng khi cần), cùng {{checkFromIndexSize}} cho validation index.

{{Optional.of(maybeNull)}} ném NPE; {{Optional.ofNullable(maybeNull)}} trả {{Optional.empty()}}. Đây là cặp hay bị viết nhầm nhất và là nội dung một test bên dưới.

### Ba cách tạo, và chuỗi xử lý thay cho null-check lồng nhau
~~~java
// trước: bốn tầng if lồng nhau, dễ quên một tầng
String city = null;
if (users.containsKey(id)) {
    User u = users.get(id);
    if (u != null && u.address() != null) {
        Address a = u.address();
        if (a.city() != null && !a.city().isBlank()) city = a.city();
    }
}

// sau: một biểu thức, mỗi tầng tự dừng khi gặp thiếu
Optional<String> cityOpt = Optional.ofNullable(id)
        .map(k -> users.get(k))      // Optional<User>: rỗng nếu không có user
        .map(User::address)          // rỗng nếu address null (map tự đổi null thành empty)
        .map(Address::city)          // rỗng nếu city null
        .filter(c -> !c.isBlank());  // rỗng nếu chỉ toàn khoảng trắng
~~~

Điểm then chốt của {{map}}: nếu hàm bên trong trả **null**, kết quả là {{Optional.empty()}}, không phải NPE. Nhờ đó một chuỗi {{map}} thay được cả loạt {{if (x != null)}}. Khi hàm của bạn **đã trả về Optional**, dùng {{flatMap}} để không bị lồng {{Optional}} trong {{Optional}}:

~~~java
Optional<Address> viaMap     = userOpt.map(u -> lookupAddress(u));  // Optional<Optional<Address>> — sai
Optional<Address> viaFlatMap = userOpt.flatMap(u -> lookupAddress(u)); // Optional<Address> — đúng
~~~

Các hàm còn lại, và phiên bản Java có chúng:

| Hàm | Làm gì | Có từ |
|---|---|---|
| {{ifPresent(c -> ...)}} | chạy {{c}} khi có giá trị | 8 |
| {{orElse(d)}} | trả giá trị hoặc {{d}}; **{{d}} đã được tính từ trước** | 8 |
| {{orElseGet(s)}} | chỉ gọi {{s}} khi rỗng | 8 |
| {{orElseThrow()}} | ném {{NoSuchElementException}} message "No value present" | 10 |
| {{orElseThrow(() -> new NotFoundException(...))}} | biến "không có" thành lỗi nghiệp vụ có message | 8 |
| {{filter(p)}} | giữ giá trị nếu thoả {{p}}, ngược lại rỗng | 8 |
| {{ifPresentOrElse(c, otherwise)}} | hai nhánh rõ ràng, hay dùng thay cho {{isPresent()}} | 9 |
| {{or(() -> otherSource)}} | khi rỗng thì thử một nguồn khác | 9 |
| {{stream()}} | 0 hoặc 1 phần tử, để ghép vào {{Stream}} | 9 |
| {{isEmpty()}} | thay cho {{!isPresent()}}, đọc dễ hơn | 11 |

### orElse hay orElseGet: câu hỏi là chi phí tính giá trị mặc định
Đây không phải đặc thù của {{Optional}} mà là quy tắc của Java: **mọi đối số được tính xong trước khi method được gọi**.

~~~java
static final AtomicInteger calls = new AtomicInteger();

static User expensiveFallback() {              // đọc DB: cứ chạy là đếm thêm một lần
    calls.incrementAndGet();
    return new User("khach-lang", null);
}

User a = userOpt.orElse(expensiveFallback());          // fallback vẫn chạy, dù userOpt đã có giá trị
User b = userOpt.orElseGet(() -> expensiveFallback()); // chỉ chạy khi userOpt rỗng
~~~

Ví dụ đời thường: {{orElse}} giống việc bạn **đã gọi món dự phòng và trả tiền**, rồi mới hỏi khách có cần không; {{orElseGet}} đưa đầu bếp cho khách, khách không lấy thì bếp không nấu. Trên production, một service gọi {{orElse(loadDefaultFromDb())}} trong vòng lặp 50.000 đơn hàng sẽ gửi 50.000 query thừa, dù 99% đơn có user — đây là loại lỗi chỉ thấy trên APM, không thấy khi đọc code.

| Giá trị mặc định là | Dùng |
|---|---|
| hằng số, chuỗi tĩnh, biến đã có sẵn | {{orElse}} |
| lời gọi hàm, có side-effect, hoặc cần new object | {{orElseGet}} |
| không chấp nhận vắng mặt | {{orElseThrow}} với exception nghiệp vụ có message |

### Không dùng Optional ở đâu
- **Field của class/DTO**: {{Optional}} không triển khai {{Serializable}}, làm mapping phức tạp (Jackson cần {{Jdk8Module}}), và với JPA/Hibernate thì field Optional không được hỗ trợ như field thường.
- **Tham số method**: ép người gọi viết {{Optional.of(x)}} vô ích. Muốn "có thể không truyền" thì dùng overload, hoặc {{@Nullable}} + {{requireNonNullElse}}.
- **Phần tử collection / key của Map**: {{List<Optional<String>>}} nên là {{List<String>}} đã lọc bỏ; và method trả danh sách thì trả danh sách rỗng, đừng trả {{Optional<List<T>>}} vì caller phải xử lý hai tầng "không có".
- **Primitive có Optional riêng**: {{OptionalInt}}, {{OptionalLong}}, {{OptionalDouble}} để tránh boxing, nhưng API của chúng ít tiện ({{getAsInt}}), cân nhắc trả giá trị mặc định thay vì Optional.
- **Vòng lặp nóng**: mỗi {{Optional}} là một object; JIT có thể loại bỏ bằng escape analysis nhưng không có gì bảo đảm. Trong loop triệu phần tử, đo trước khi kết luận.

> Senior tip: ở ranh giới (repository, client HTTP) hãy để {{Optional}} "nói" sự vắng mặt; khi vào tầng hiển thị hoặc tầng nghiệp vụ đã chắc chắn, chuyển về giá trị hoặc lỗi. {{findById}} của Spring Data JPA trả {{Optional}} — viết {{repository.findById(id).orElseThrow(() -> new EntityNotFoundException("Khong thay id=" + id))}} thay vì {{.get()}}: cùng một hành vi nhưng message nói được thiếu cái gì. {{.get()}} ném {{NoSuchElementException}} với message "No value present" — vô dụng trong log.

### Pitfall production
- Method khai báo trả {{Optional}} nhưng có nhánh {{return null;}} → NPE nổ ở chỗ caller tin rằng không cần kiểm tra. Quy tắc: không bao giờ trả null từ kiểu {{Optional}}.
- {{opt.isPresent()}} rồi {{opt.get()}} trong if: đây chỉ là null-check viết dài hơn, không dùng được gì của Optional; thay bằng {{map/orElse/ifPresentOrElse}}.
- {{Map.of(...)}}, {{List.of(...)}} và các collection bất biến **cấm null**: {{Map.of().get(null)}} ném NPE trong khi {{new HashMap<>().get(null)}} trả null. Vì thế chuỗi lookup nên bắt đầu bằng {{Optional.ofNullable(id).map(k -> users.get(k))}} chứ không phải {{Optional.ofNullable(users.get(id))}}.
- {{ConcurrentHashMap}} cấm cả key lẫn value null; muốn biểu diễn "không có" thì dùng {{Optional}} ở giá trị trả về hoặc sentinel, đừng nhét null vào map.
- Quên {{filter}}: "không có thành phố" được lưu dưới dạng chuỗi rỗng hoặc chuỗi khoảng trắng, {{Optional.of("")}} coi là **có** giá trị và in ra dòng trống.
- Bọc {{Optional}} quanh kết quả của một phép đã chắc chắn có: {{Optional.of(value)}} khi value đến từ DB và có thể null → NPE; dùng {{ofNullable}} cho giá trị từ bên ngoài.
- Log {{Optional}} trực tiếp: {{toString}} in "Optional[Hà Nội]" — dễ gây hiểu khi parse log; hãy {{orElse("-")}} trước khi log.
- {{Optional.empty()}} là một instance dùng lại, còn {{Optional.of(x)}} tạo object mới: so sánh bằng {{==}} giữa hai Optional là sai, hãy dùng {{equals}} hoặc {{isPresent}}+{{equals}}.

### Liên hệ phỏng vấn
Bộ câu hỏi kinh điển: Optional dùng ở đâu và không ở đâu; {{of}} khác {{ofNullable}}; {{orElse}} khác {{orElseGet}} (câu này gần như chắc chắn có, và đáp án đúng nằm ở **quy tắc tính đối số**, không phải trong class Optional); {{map}} xử lý hàm trả null ra sao và khi nào cần {{flatMap}}; vì sao không dùng Optional làm field JPA; làm gì để không nhận NPE từ {{get()}}. Trả lời gọn: kiểu trả về để biểu đạt sự vắng mặt, chặn null ở cửa vào bằng {{requireNonNull}}, chọn {{orElseGet}} khi giá trị mặc định đắt, và luôn có message nghiệp vụ trong {{orElseThrow}}.`,
  exercises: [{
    title: 'Refactor chuỗi lookup lồng null-check sang Optional và đếm số lần gọi fallback',
    prompt: `Dùng ba kiểu đã khai báo: {{record User(String name, Address address)}}, {{record Address(String city)}} và class {{Lookups}}. Viết bốn hàm, **chỉ dùng tính năng có trong Java 17**, không dùng {{get()}}, không đọc ngày giờ/random/sleep.
- {{Lookups.city(Map<String, User> users, String id)}} trả {{Optional<String>}}: chuỗi {{id}} → user → address → city. Trả {{Optional.empty()}} khi {{id}} null, khi map không chứa id, khi {{address}} null, khi {{city}} null, và khi {{city}} chỉ toàn khoảng trắng. **Không được ném exception** kể cả khi {{users}} là {{Map.of()}} (thứ mà {{get(null)}} ném NPE). Không bao giờ trả về {{null}}.
- {{Lookups.cityOrDefault(Map<String, User> users, String id, Supplier<String> fallback)}}: trả thành phố nếu có, nếu không thì trả kết quả của {{fallback}}. {{fallback}} **chỉ được gọi khi thiếu** — tức là dùng {{orElseGet}}, không dùng {{orElse}}.
- {{Lookups.mustFind(Map<String, User> users, String id)}}: trả đúng {{User}} có trong map; khi không có, ném {{IllegalArgumentException}} có message chứa {{id}} (dùng {{orElseThrow}}, không dùng {{get()}}).
- {{Lookups.tagged(String tag, Optional<String> value)}}: chặn {{tag}} null ở cửa vào bằng {{Objects.requireNonNull(tag, "tag")}} rồi trả {{tag + "=" + gia tri}}; khi {{value}} rỗng thì phần giá trị là dấu {{-}}. Tham số {{value}} luôn là một Optional, không null.
Gợi ý thứ tự an toàn cho {{city}}: bắt đầu bằng {{Optional.ofNullable(id)}} rồi {{map}} từng tầng, sau đó {{filter}}.`,
    starter: `record User(String name, Address address) { }
record Address(String city) { }

class Lookups {
    static Optional<String> city(Map<String, User> users, String id) {
        throw new UnsupportedOperationException("TODO");
    }
    static String cityOrDefault(Map<String, User> users, String id, Supplier<String> fallback) {
        throw new UnsupportedOperationException("TODO");
    }
    static User mustFind(Map<String, User> users, String id) {
        throw new UnsupportedOperationException("TODO");
    }
    static String tagged(String tag, Optional<String> value) {
        throw new UnsupportedOperationException("TODO");
    }
}`,
    tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, Runnable r) {
        total++;
        try { r.run(); passed++; System.out.println("PASS " + name); }
        catch (Throwable t) { System.out.println("FAIL " + name + ": " + t); }
    }
    static void eq(Object expected, Object actual) {
        if (!Objects.equals(expected, actual)) throw new AssertionError("muốn " + expected + " nhận " + actual);
    }
    static Throwable thrown(Runnable body) {
        try { body.run(); return null; } catch (Throwable t) { return t; }
    }
    static Map<String, User> hmap() {
        Map<String, User> m = new HashMap<>();
        m.put("u1", new User("An", new Address("Hà Nội")));
        m.put("u2", new User("Bình", null));
        m.put("u3", new User("Cường", new Address(null)));
        m.put("u4", new User("Dung", new Address("   ")));
        m.put("u5", new User("Em", new Address("Đà Nẵng")));
        return m;
    }
    public static void main(String[] args) {
        check("chuoi du tra ve thanh pho", () -> eq(Optional.of("Hà Nội"), Lookups.city(hmap(), "u1")));
        check("address null, city null va city trang deu ra empty", () -> {
            eq(Optional.empty(), Lookups.city(hmap(), "u2"));
            eq(Optional.empty(), Lookups.city(hmap(), "u3"));
            eq(Optional.empty(), Lookups.city(hmap(), "u4"));
        });
        check("id khong co trong map ra empty, khong phai null", () -> {
            Optional<String> r = Lookups.city(hmap(), "khong-co");
            eq(true, r != null);
            eq(Optional.empty(), r);
        });
        check("id null voi Map.of() khong duoc nem NPE", () -> {
            eq(Optional.empty(), Lookups.city(Map.of(), null));
            eq(Optional.empty(), Lookups.city(hmap(), null));
        });
        check("cityOrDefault khong goi fallback khi da co gia tri", () -> {
            AtomicInteger calls = new AtomicInteger();
            String r = Lookups.cityOrDefault(hmap(), "u1", () -> { calls.incrementAndGet(); return "Mặc định"; });
            eq("Hà Nội", r);
            eq(0, calls.get());
        });
        check("cityOrDefault goi fallback dung mot lan khi thieu", () -> {
            AtomicInteger calls = new AtomicInteger();
            String r = Lookups.cityOrDefault(hmap(), "u2", () -> { calls.incrementAndGet(); return "Mặc định"; });
            eq("Mặc định", r);
            eq(1, calls.get());
        });
        check("mustFind tra dung instance va nem IllegalArgumentException kem id khi thieu", () -> {
            Map<String, User> m = hmap();
            eq(true, Lookups.mustFind(m, "u5") == m.get("u5"));
            Throwable t = thrown(() -> Lookups.mustFind(m, "u9"));
            eq(true, t instanceof IllegalArgumentException);
            eq(true, t.getMessage() != null && t.getMessage().contains("u9"));
        });
        check("tagged chan tag null o cua vao, message ro rong", () -> {
            Throwable t = thrown(() -> Lookups.tagged(null, Optional.of("X")));
            eq(true, t instanceof NullPointerException);
            eq("tag", t.getMessage());
        });
        check("tagged tra gia tri hoac dau gach khi Optional rong", () -> {
            eq("city=Hà Nội", Lookups.tagged("city", Optional.of("Hà Nội")));
            eq("city=-", Lookups.tagged("city", Optional.empty()));
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
    reference: `record User(String name, Address address) { }
record Address(String city) { }

class Lookups {
    static Optional<String> city(Map<String, User> users, String id) {
        return Optional.ofNullable(id)
                .map(k -> users.get(k))
                .map(User::address)
                .map(Address::city)
                .filter(c -> !c.isBlank());
    }
    static String cityOrDefault(Map<String, User> users, String id, Supplier<String> fallback) {
        return city(users, id).orElseGet(fallback);        // orElse se goi fallback ngay ca khi co gia tri
    }
    static User mustFind(Map<String, User> users, String id) {
        return Optional.ofNullable(id)
                .map(k -> users.get(k))
                .orElseThrow(() -> new IllegalArgumentException("Không thấy user với id " + id));
    }
    static String tagged(String tag, Optional<String> value) {
        Objects.requireNonNull(tag, "tag");
        return tag + "=" + value.orElse("-");
    }
}`,
    hints: ['Bắt đầu chuỗi bằng {{Optional.ofNullable(id)}}: khi id null thì chưa dòng nào chạm tới map, nên {{Map.of()}} không kịp ném NPE.', 'Mỗi tầng là một {{map}}; nếu hàm trong map trả null thì Optional tự biến thành rỗng, nên bạn không cần {{if}} nào cả. Thêm {{filter(c -> !c.isBlank())}} để loại chuỗi khoảng trắng.', 'Đếm số lần fallback được gọi: biến {{AtomicInteger}} do test truyền vào qua {{Supplier}}. Nếu bạn dùng {{orElse(fallback.get())}} thì bộ đếm sẽ tăng ngay cả khi có giá trị.', 'Viết {{orElseThrow(() -> new IllegalArgumentException("... " + id))}} chứ không viết {{get()}}: message cho người đọc log biết thiếu id nào.'],
    explain: `Bốn dòng {{map}} tương đương bốn tầng {{if != null}} lồng nhau, nhưng thêm tầng mới chỉ là thêm một {{map}} chứ không thêm một cấp lồng. Điểm dễ sai nhất là tầng đầu: {{Optional.ofNullable(users.get(id))}} trông gọn hơn nhưng đọc {{users.get(null)}} ngay lập tức, và với {{Map.of(...)}} (Java 9+, mọi {{List.of}}, {{Set.of}} cũng vậy) thì thao tác đó ném NPE; bọc {{id}} trong {{Optional.ofNullable}} rồi mới {{map}} vào map thì chuỗi dừng lại an toàn. {{cityOrDefault}} dùng {{orElseGet}} vì lý do đã nói ở body: đối số của {{orElse}} luôn được tính trước khi method chạy, nên fallback có side-effect sẽ chạy ở mọi lời gọi. {{mustFind}} chứng minh {{orElseThrow}} tốt hơn {{get()}} ở đúng một chỗ: message — {{get()}} chỉ nói "No value present" còn message của bạn nói thiếu id nào. Cuối cùng, {{tagged}} dùng {{Objects.requireNonNull(tag, "tag")}}: nếu bỏ luôn tham số message thì NPE nhận message {{null}} và log của bạn mất hết ngữ cảnh.`
  }], check: [{
    q: 'Vì sao orElse(loadDefaultFromDb()) luôn truy vấn DB dù Optional đã có giá trị?',
    options: ['Vì orElse được định nghĩa là gọi supplier hai lần để an toàn', 'Vì Java tính xong mọi đối số trước khi gọi method: loadDefaultFromDb() chạy trước, kết quả mới được truyền vào orElse; orElseGet nhận một Supplier chưa chạy và chỉ gọi khi rỗng', 'Vì orElse chỉ làm việc với collection', 'Vì loadDefaultFromDb là static method nên bị JVM cache'],
    answer: 1,
    explain: 'Đây là quy tắc của ngôn ngữ chứ không phải đặc thù của Optional. orElse nhận một giá trị đã có, còn orElseGet nhận công thức tạo giá trị. Hệ quả thực tế: orElse với hàm có side-effect sẽ trả giá cho side-effect đó ở mọi lời gọi, kể cả lời gọi vẫn đủ dữ liệu.'
  },{
    q: 'Optional.of(x) và Optional.ofNullable(x) khác nhau thế nào khi x có thể null?',
    options: ['Cả hai trả Optional.empty() khi x null', 'of ném NullPointerException ngay, còn ofNullable trả Optional.empty() — muốn an toàn với giá trị từ bên ngoài thì dùng ofNullable', 'of chấp nhận null, ofNullable không chấp nhận null', 'ofNullable chỉ dùng cho kiểu primitive'],
    answer: 1,
    explain: 'of biểu đạt khẳng định "tôi chắc chắn nó không null", nên vi phạm khẳng định đó là bug và được báo tại chỗ. ofNullable biểu đạt "có thể không có", chuyển sự vắng mặt thành Optional.empty() để chuỗi map/filter phía sau dừng lại êm.'
  },{
    q: 'Vị trí nào dưới đây là nơi NÊN dùng Optional?',
    options: ['Field của entity JPA để biểu diễn cột nullable', 'Kiểu trả về của repository method có thể không tìm thấy bản ghi, ví dụ findById', 'Phần tử của List<Optional<String>> trả về cho tầng hiển thị', 'Tham số method để caller truyền Optional.empty() khi không có giá trị'],
    answer: 1,
    explain: 'Optional sinh ra để làm tín hiệu ở kiểu trả về. Làm field thì nó không Serializable và gây khó cho mapping; làm phần tử collection thì nên lọc bỏ null và trả danh sách; làm tham số thì ép caller bọc giá trị vô ích, thà dùng overload hoặc chặn null ở cửa vào.'
  },{
    q: 'Hàm bên trong map trả về null thì điều gì xảy ra?',
    options: ['map trả Optional.empty(), nhờ vậy một chuỗi map thay được nhiều if kiểm tra null lồng nhau', 'map ném NullPointerException tại tầng đó', 'map trả Optional chứa null, và get() sau đó mới nổ', 'map bỏ qua cả chuỗi và trả Optional của tầng đầu tiên'],
    answer: 0,
    explain: 'Đây chính là cơ chế khiến chuỗi map an toàn: Optional không bao giờ chứa null, nên kết quả null của hàm được quy về sự vắng mặt. Nếu hàm của bạn đã trả Optional thì dùng flatMap, vì map sẽ tạo Optional bọc Optional.'
  }], related: ['modern-002', 'core-007', 'core-003'], tags: ['Optional', 'null', 'Objects.requireNonNull', 'API design']
},
{
  id: 'lesson-core-010', track: 'core', order: 10,
  title: 'Composite key an toàn: equals, hashCode và compareTo nhất quán', level: 'senior', minutes: 30,
  goals: [
    'Giải thích được vì sao HashMap và TreeMap có thể xem hai key là trùng theo hai cách khác nhau',
    'Tự viết key gồm nhiều phần theo đúng hợp đồng equals/hashCode/compareTo',
    'Kiểm tra class key bằng cả HashMap lẫn TreeMap thay vì chỉ gọi trực tiếp từng method'
  ],
  body: `**Tóm tắt:** Một composite key (khóa ghép) là khóa được tạo từ nhiều giá trị, ví dụ mã tenant và mã đơn hàng. Muốn dùng cùng class an toàn trong {{HashMap}} và {{TreeMap}}, {{equals}} và {{hashCode}} phải xét cùng các thành phần, còn thứ tự tự nhiên từ {{compareTo}} phải trả 0 đúng với những cặp mà {{equals}} coi là bằng nhau; nếu không, một collection có thể tìm trượt hoặc âm thầm bỏ dữ liệu.

### Từ dữ liệu nghiệp vụ tới object key
Hãy tưởng tượng nhiều khách hàng cùng có đơn hàng số {{42}}. Chỉ dùng {{orderId}} làm khóa thì đơn {{42}} của tenant A và đơn {{42}} của tenant B bị trộn. Khóa đúng là cặp {{(tenantId, orderId)}}. Mỗi object đại diện cho một cặp; hai object khác nhau trong bộ nhớ vẫn phải được coi là cùng khóa nếu cả hai thành phần có cùng giá trị.

{{equals}} là phép hỏi “cùng một giá trị nghiệp vụ không?”. {{hashCode}} cho {{HashMap}} một số để chọn bucket (ngăn chứa); nó là bước định vị nhanh, chưa phải câu trả lời cuối. {{compareTo}} định nghĩa thứ tự tự nhiên, như xếp từ điển theo tenant rồi theo mã đơn. {{TreeMap}} giữ khóa trong cây tìm kiếm có thứ tự và xem kết quả so sánh bằng 0 là “khóa này đã có”.

### Vì sao ba method phải thống nhất
Với {{HashMap}}, đường đi khi {{put}} hoặc {{get}} là: gọi {{hashCode}} → chọn bucket → so {{equals}} với các khóa trong bucket. Do đó nếu {{a.equals(b)}} là true thì hash bắt buộc bằng nhau; nếu không, {{HashMap}} có thể tìm ở bucket khác và không bao giờ gọi {{equals}} để phát hiện khóa tương đương. Chiều ngược lại không bắt buộc: hai khóa khác nhau được phép trùng hash, chỉ làm tăng va chạm và giảm tốc độ.

{{TreeMap}} lại không dùng {{hashCode}} hoặc {{equals}} để quyết định vị trí. Nó gọi {{compareTo}} (hoặc {{Comparator}} được truyền vào). So sánh trả 0 nghĩa là cùng một khóa đối với map; lệnh put tiếp theo thay giá trị cũ, không tạo entry thứ hai. Vì thế điều kiện thực dụng là {{compareTo(a, b) == 0}} khi và chỉ khi {{a.equals(b)}}. Java cho phép thứ tự không nhất quán với equals, nhưng tài liệu {{Comparable}} khuyến nghị nhất quán; với map/set có thứ tự, không nhất quán thường tạo hành vi gây ngạc nhiên.

~~~java
final class OrderKey implements Comparable<OrderKey> {
    private final String tenant, order;
    OrderKey(String tenant, String order) {
        this.tenant = Objects.requireNonNull(tenant);
        this.order = Objects.requireNonNull(order);
    }
    @Override public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof OrderKey k)) return false;
        return tenant.equals(k.tenant) && order.equals(k.order);
    }
    @Override public int hashCode() { return Objects.hash(tenant, order); }
    @Override public int compareTo(OrderKey k) {
        int first = tenant.compareTo(k.tenant);
        return first != 0 ? first : order.compareTo(k.order);
    }
}
~~~

Ở đây mã tenant được xét trước; nếu giống nhau mới so mã đơn. Không dùng phép trừ để so số nguyên vì phép trừ có thể tràn và đảo thứ tự; dùng {{Integer.compare}} hoặc {{Long.compare}}. Với chuỗi, {{String.compareTo}} trả số âm, 0, hoặc số dương theo thứ tự từ điển; đừng phụ thuộc vào số âm/dương chính xác là bao nhiêu.

### Ranh giới dữ liệu và thứ tự nghiệp vụ
Mã có phân biệt hoa thường hay không là quy tắc nghiệp vụ, không phải quyết định ngẫu nhiên trong {{equals}}. Nếu hệ thống xem {{Acme}} và {{ACME}} là một tenant, hãy chuẩn hóa ở constructor hoặc tại cửa vào bằng quy tắc locale độc lập, rồi để cả ba method dùng cùng giá trị chuẩn hóa. Không chuẩn hóa chỉ trong {{compareTo}}: khi ấy TreeMap có thể gộp hai key mà HashMap giữ tách rời.

Key cũng phải bất biến trong khi nằm trong collection. {{final}} trên field ngăn gán field lần nữa, còn class {{final}} ngăn subclass thay đổi ý nghĩa bằng/so sánh. Nếu đổi thành phần key sau khi đưa vào HashMap, map vẫn để entry ở bucket cũ trong khi lần tra cứu tính hash mới. Một record có thể tự sinh equals/hashCode theo các component, nhưng không tự sinh {{Comparable}}; và component mutable vẫn cần sao chép phòng vệ.

| Nơi dùng | Method quyết định | Hậu quả khi bất nhất |
|---|---|---|
| {{HashMap}} / {{HashSet}} | {{hashCode}}, sau đó {{equals}} | get trượt hoặc set chứa khóa trùng |
| {{TreeMap}} / {{TreeSet}} | {{compareTo}} hoặc comparator | put thay entry cũ hoặc set bỏ phần tử |
| {{List.contains}} | {{equals}} | kết quả tìm kiếm không đồng nhất với collection khác |

### Ví dụ đời thực
Một dịch vụ nhận sự kiện từ nhiều tenant, với mỗi tenant có mã đơn hàng riêng. Trong một đợt replay, 120 nghìn sự kiện được gom tạm theo {{OrderKey}} trước khi ghi database. Phiên bản lỗi chỉ so {{order}} trong {{compareTo}}, còn {{equals}} so cả tenant và order. Hai tenant có cùng 7.531 mã đơn bị TreeMap coi là cùng khóa; giá trị put sau ghi đè giá trị trước. Log đầu vào vẫn có đủ sự kiện nên lỗi trông giống thiếu dữ liệu ở database. Test tái hiện tạo hai tenant cùng order ID và kiểm tra kích thước map: trước sửa kích thước là 1, sau sửa là 2; replay mẫu giữ đủ 120 nghìn sự kiện. Đây là minh họa kiểm thử, khi điều tra thật cần đối chiếu metric, log và số liệu lưu trữ thay vì mặc định kết quả này.

### Các lỗi thường gặp
- Quên một field ở {{hashCode}} hoặc chỉ dùng một field ở {{equals}}: các collection hash không còn theo cùng định nghĩa khóa.
- So chuỗi không phân biệt hoa thường trong {{compareTo}} nhưng phân biệt trong {{equals}}: {{TreeMap}} có thể làm mất một entry.
- Cài đặt {{compareTo}} bằng {{a - b}}: tràn số làm sai thứ tự ở giá trị biên.
- Dùng field mutable, hoặc field null nhưng gọi trực tiếp {{field.equals}}: key bị đổi nghĩa hoặc ném NPE. Hãy validate đầu vào và chỉ giữ giá trị bất biến.
- Cho {{TreeMap}} comparator khác nhau ở các luồng code: cùng một cặp key có thể được gộp ở nơi này nhưng tách ở nơi khác. Chọn, đặt tên và kiểm thử đúng thứ tự nghiệp vụ cần dùng.

> Senior tip: test contract theo bộ ba cụ thể: cặp bằng nhau phải có cùng hash và compareTo bằng 0; cặp khác nhau ở từng thành phần phải không bị TreeMap gộp. Với key dùng ở nhiều service, thống nhất quy tắc chuẩn hóa mã ngay tại ranh giới API.

### Liên hệ phỏng vấn
Khi được hỏi cách thiết kế khóa ghép, hãy nêu định nghĩa giá trị trước: những trường nào làm hai bản ghi trở thành cùng một bản ghi? Sau đó dùng đúng các trường ấy cho equals/hashCode; với thứ tự nhiều trường thì so lần lượt từng trường cho tới khi khác. Giải thích HashMap dùng hash để tới bucket rồi equals để xác nhận, còn TreeMap dùng compareTo và coi 0 là trùng. Tôi sẽ kiểm thử cả lookup bằng object mới có cùng dữ liệu và hành vi thay thế của TreeMap. Tôi cũng hỏi nghiệp vụ về chữ hoa/thường, null, và khả năng một thành phần thay đổi. Nếu dùng record thì record tiết kiệm phần equals/hashCode viết tay nhưng không tự tạo thứ tự và không làm component mutable trở nên an toàn. Cách trả lời này cho thấy tôi quan tâm cả hợp đồng ngôn ngữ lẫn hậu quả dữ liệu trong production.`,
  exercises: [{
    title: 'Viết TenantOrderKey dùng nhất quán trong HashMap và TreeMap',
    prompt: `Hoàn thiện {{TenantOrderKey}}. Tenant và mã đơn là chuỗi phân biệt hoa thường, không được null. Hai key bằng nhau khi cả hai chuỗi bằng nhau. Thứ tự tự nhiên so tenant trước rồi mới so mã đơn. Không dùng phép trừ để so sánh số; bài này dùng chuỗi. Test sẽ đưa các instance độc lập vào {{HashMap}} và {{TreeMap}} để bắt cả hai hợp đồng.`,
    starter: `final class TenantOrderKey implements Comparable<TenantOrderKey> {
    private final String tenant;
    private final String order;
    TenantOrderKey(String tenant, String order) {
        this.tenant = tenant;
        this.order = order;
    }
    @Override public boolean equals(Object o) { return false; }
    @Override public int hashCode() { return 0; }
    @Override public int compareTo(TenantOrderKey other) { return 0; }
}`,
    tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": dieu kien khong dat");
    }
    public static void main(String[] args) {
        TenantOrderKey a = new TenantOrderKey("tenant-a", "order-7");
        TenantOrderKey same = new TenantOrderKey("tenant-a", "order-7");
        TenantOrderKey otherOrder = new TenantOrderKey("tenant-a", "order-8");
        TenantOrderKey otherTenant = new TenantOrderKey("tenant-b", "order-7");
        check("equals is reflexive symmetric and null safe",
            a.equals(a) && a.equals(same) && same.equals(a) && !a.equals(null) && !a.equals("order-7"));
        check("equal keys have equal hashes and natural comparison zero",
            a.hashCode() == same.hashCode() && a.compareTo(same) == 0);
        check("each key component affects equality and order",
            !a.equals(otherOrder) && !a.equals(otherTenant)
                && a.compareTo(otherOrder) < 0 && a.compareTo(otherTenant) < 0);
        Map<TenantOrderKey, String> hashMap = new HashMap<>();
        hashMap.put(a, "created");
        check("HashMap finds value with a separately created key",
            "created".equals(hashMap.get(same)));
        TreeMap<TenantOrderKey, String> treeMap = new TreeMap<>();
        treeMap.put(a, "old");
        treeMap.put(same, "updated");
        treeMap.put(otherTenant, "other tenant");
        check("TreeMap replaces equal key but keeps other tenant",
            treeMap.size() == 2 && "updated".equals(treeMap.get(a))
                && "other tenant".equals(treeMap.get(otherTenant)));
        check("TreeMap orders tenant then order",
            treeMap.firstKey().equals(a) && treeMap.lastKey().equals(otherTenant));
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
    reference: `final class TenantOrderKey implements Comparable<TenantOrderKey> {
    private final String tenant;
    private final String order;
    TenantOrderKey(String tenant, String order) {
        this.tenant = Objects.requireNonNull(tenant, "tenant");
        this.order = Objects.requireNonNull(order, "order");
    }
    @Override public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof TenantOrderKey k)) return false;
        return tenant.equals(k.tenant) && order.equals(k.order);
    }
    @Override public int hashCode() { return Objects.hash(tenant, order); }
    @Override public int compareTo(TenantOrderKey other) {
        int byTenant = tenant.compareTo(other.tenant);
        return byTenant != 0 ? byTenant : order.compareTo(other.order);
    }
}`,
    hints: [
      'Viết equals theo thứ tự: cùng tham chiếu, đúng kiểu, rồi so cả tenant lẫn order. Với kiểu chuỗi đã được constructor bảo đảm không null, dùng String.equals được.',
      'hashCode cần dùng đúng hai thành phần đó. compareTo so tenant trước; nếu kết quả bằng 0 mới so order, không trả 0 sớm chỉ vì order trùng.',
      'HashMap kiểm tra lookup bằng instance mới; TreeMap kiểm tra hai bước put với key bằng nhau phải thay giá trị cũ nhưng key tenant khác vẫn tồn tại.'
    ],
    explain: `{{HashMap}} dùng hash trước rồi mới dùng equals, nên phép thử lookup bằng object {{same}} chứng minh cả hai method phối hợp được. {{TreeMap}} không hỏi equals để tìm vị trí: {{compareTo}} trả 0 là nó xem key đã có và thay giá trị. So sánh từng thành phần theo cùng thứ tự đảm bảo hai key bằng nhau có compareTo bằng 0, đồng thời hai tenant khác nhau không bị gộp. Trong class thực tế nên kiểm tra null ở constructor như lời giải để lỗi dữ liệu phát sinh tại ranh giới, thay vì xuất hiện muộn trong equals hoặc compareTo.`
  }],
  check: [
    {
      q: '{{HashMap}} đã có key a. Nếu {{a.equals(b)}} là true nhưng hashCode khác nhau, điều gì có thể xảy ra khi gọi {{get(b)}}?',
      options: [
        '{{HashMap}} luôn quét toàn bộ map và chắc chắn tìm được a',
        'b có thể đi tới bucket khác nên {{get(b)}} trả null dù a đang có trong map',
        '{{HashMap}} gọi {{compareTo}} để chuyển b tới bucket đúng',
        'Java tự sửa hashCode của b để khớp với a'
      ],
      answer: 1,
      explain: 'B đúng: HashMap chọn bucket bằng hash trước khi gọi equals; hash khác có thể dẫn tới bucket khác. A sai vì HashMap không quét toàn bộ map cho lookup thông thường. C sai vì HashMap không dùng compareTo để tra cứu thông thường. D sai vì Java không tự sửa method của object.'
    },
    {
      q: 'Trong {{TreeMap}}, {{compareTo(a, b)}} trả 0 nhưng {{a.equals(b)}} trả false. Hệ quả đáng lo nhất là gì?',
      options: [
        'TreeMap xem a và b là cùng khóa; put key thứ hai có thể thay giá trị của key thứ nhất',
        'TreeMap bỏ qua compareTo và gọi hashCode',
        'TreeMap tự ném lỗi biên dịch',
        'Không có hệ quả vì TreeMap chỉ lưu value'
      ],
      answer: 0,
      explain: 'A đúng: TreeMap dựa trên comparator/compareTo; kết quả 0 nghĩa là cùng vị trí khóa và lần put sau thay giá trị. B sai: TreeMap là collection có thứ tự, không tra cứu bằng hashCode. C sai: hợp đồng không nhất quán thường là lỗi logic khi chạy, không phải lỗi biên dịch. D sai vì cách so sánh khóa trực tiếp quyết định map có giữ hai entry hay không.'
    },
    {
      q: 'Hai khóa ghép bằng nhau theo tenant và order. Cách chọn field nào cho ba method là hợp lý nhất?',
      options: [
        'equals dùng tenant; hashCode dùng order; compareTo trả 0 cho mọi khóa',
        'equals và hashCode dùng cả hai field; compareTo lần lượt so tenant rồi order',
        'equals dùng cả hai field; hashCode chỉ dùng order; compareTo bỏ qua tenant',
        'Dùng cùng các field trong equals và hashCode; để compareTo trả 0 đúng khi hai key bằng nhau'
      ],
      answer: 3,
      explain: 'D đúng: hashCode phải nhất quán với equals, còn compareTo bằng 0 nên tương ứng với bằng nhau để TreeMap không gộp nhầm. B gần đúng nhưng chưa nêu điều kiện quan trọng compareTo phải so các cặp thành phần sao cho zero tương đương equals; nếu compareTo không phân biệt một khác biệt trong equals thì vẫn lỗi. A và C dùng tập field/thứ tự không nhất quán, khiến map hoặc set có hành vi sai.'
    }
  ],
  related: ['core-001'],
  tags: ['equals', 'hashCode', 'compareTo', 'HashMap', 'TreeMap', 'composite-key']
},
{
  id: 'lesson-core-011', track: 'core', order: 11,
  title: 'Immutable snapshot cho request: defensive copy ở cả hai biên', level: 'mid', minutes: 25,
  goals: [
    'Giải thích được aliasing và vì sao field final không làm object được trỏ tới trở nên bất biến',
    'Tạo class immutable bằng private final field, kiểm tra đầu vào và defensive copy',
    'Phân biệt snapshot bất biến với unmodifiable view và nhận biết giới hạn shallow copy'
  ],
  body: `**Tóm tắt:** Object bất biến là object không thể đổi trạng thái quan sát được sau khi tạo. Nếu constructor nhận một list mutable (có thể sửa) rồi giữ nguyên tham chiếu, caller vẫn có thể thay đổi nội dung bên trong; muốn tạo snapshot an toàn, phải tách dữ liệu khi nhận vào và không cho caller sửa trạng thái nội bộ qua accessor.

### Tham chiếu giống như chìa khóa cùng mở một ngăn kéo
Trong Java, biến kiểu object lưu tham chiếu tới object, không chứa một bản sao của toàn bộ object. Nếu biến {{input}} và field {{tags}} cùng trỏ tới một {{ArrayList}}, gọi {{input.add("urgent")}} làm nội dung mà request nhìn thấy cũng đổi. Việc nhiều đường truy cập cùng trỏ tới một object gọi là aliasing (bí danh/tham chiếu dùng chung).

{{final}} chỉ ngăn gán lại chính biến field sau khi constructor chạy; nó không khóa object. Vì vậy {{private final List<String> tags}} vẫn có thể thay đổi bằng {{tags.add(...)}} nếu class giữ một ArrayList và có đường gọi tới nó.

### Bất biến cần bảo vệ cả hai chiều
Khi **nhận dữ liệu**, sao chép cấu trúc ngay trong constructor. Nếu không, caller vẫn giữ list gốc và sửa được nội dung. Khi **trả dữ liệu**, không được đưa một list mutable nội bộ ra ngoài; caller có thể sửa nó sau khi gọi getter. Với danh sách các chuỗi, {{List.copyOf}} tạo snapshot không sửa được: sửa list nguồn không làm snapshot thay đổi, và gọi add/remove trên snapshot ném {{UnsupportedOperationException}}.

~~~java
final class RequestSnapshot {
    private final String requestId;
    private final List<String> tags;
    RequestSnapshot(String requestId, List<String> tags) {
        this.requestId = Objects.requireNonNull(requestId);
        this.tags = List.copyOf(Objects.requireNonNull(tags));
    }
    String requestId() { return requestId; }
    List<String> tags() { return tags; }
}
~~~

Accessor trả thẳng {{tags}} ở ví dụ này an toàn vì field trỏ tới list bất biến do {{List.copyOf}} tạo. Nếu thay bằng {{ArrayList}} nội bộ thì accessor phải trả một bản sao bất biến hoặc bản sao độc lập; đừng trả list gốc. Chuỗi {{String}} cũng bất biến, nên shallow copy (sao chép nông: chỉ tạo bản sao cấu trúc và giữ nguyên tham chiếu tới từng phần tử) là đủ cho bài này.

### Snapshot khác view chỉ đọc
{{Collections.unmodifiableList(source)}} tạo một wrapper không cho sửa qua wrapper, nhưng vẫn nhìn vào list {{source}}. Nếu code khác sửa source, nội dung nhìn qua wrapper cũng đổi. Đây là unmodifiable view (khung nhìn không sửa được), không phải snapshot. {{List.copyOf(source)}} tách cấu trúc khỏi list nguồn và không cho sửa cấu trúc của bản copy.

| Cách giữ / trả danh sách | Caller sửa qua kết quả? | Thay đổi nguồn có lộ ra? |
|---|---|---|
| Giữ/trả list gốc | Có | Có |
| {{unmodifiableList(source)}} | Không qua wrapper | Có, đây vẫn là view |
| {{List.copyOf(source)}} | Không | Không, snapshot cấu trúc |

{{List.copyOf}} không tự biến các phần tử thành immutable. Nếu list chứa {{MutableTag}} có setter, caller giữ tham chiếu tới một tag và gọi setter thì snapshot vẫn thấy tag đã đổi. Với dữ liệu lồng nhau, dùng phần tử immutable, chuyển sang value object, hoặc sao chép từng phần tử trong lúc tạo snapshot. Không được gọi shallow snapshot là deep immutable nếu phần tử còn mutable.

### Validation và lỗi ở đúng thời điểm
{{Objects.requireNonNull}} giúp từ chối null ngay tại constructor, nơi dữ liệu đi vào object. {{List.copyOf}} cũng từ chối phần tử null. Đây là quyết định rõ ràng hơn so với giữ list có null rồi chờ một method khác ném NPE. Nếu domain cho phép null hoặc cần giữ vị trí null thì phải định nghĩa chính sách khác; không thể dùng List.copyOf trong trường hợp ấy mà không xử lý trước.

Immutability rất hữu ích cho cấu hình, request snapshot, message đã xác thực và value object: nhiều thread có thể đọc cùng trạng thái mà không cần khóa bảo vệ các field đó. Nó không làm các object khác mà class gọi tới trở thread-safe, không bảo vệ mutable item bên trong, và không thay thế transaction khi nhiều thao tác cần cập nhật nguyên tử. ORM entity thường có lifecycle mutable riêng; thường chuyển entity thành DTO/snapshot bất biến ở ranh giới thay vì cố biến entity đang được quản lý thành final class.

### Ví dụ đời thực
Một API nhận request tạo báo cáo với 12 filter và chuyển nó cho một tác vụ chạy nền. Bản lỗi giữ nguyên list filter do controller sở hữu. Controller tái sử dụng list cho request kế tiếp và xóa filter cũ; tác vụ nền đôi khi chạy sau đó với chỉ 3 filter, khiến báo cáo thiếu dữ liệu dù log nhận đầu vào ghi đủ 12. Cách điều tra là so snapshot request tại lúc enqueue với tham số lúc worker chạy và tái hiện bằng cách sửa list ngay sau khi tạo request. Cách sửa là copy tại constructor, xác thực phần tử, rồi chỉ trả list bất biến. Trong một test tải lặp lại, dữ liệu đầu vào 12 filter vẫn giữ nguyên qua toàn bộ khoảng chờ; con số này mô tả kịch bản minh họa, không phải cam kết đo hiệu năng. Bản copy có chi phí O(n) thời gian và bộ nhớ, nên với danh sách rất lớn phải đo và thiết kế ownership rõ, không bỏ copy một cách âm thầm.

### Lỗi thường gặp
- Chỉ đánh dấu field {{final}} rồi nghĩ object đã bất biến: final bảo vệ tham chiếu, không bảo vệ phần tử mutable.
- Copy ở constructor nhưng accessor trả list mutable nội bộ: caller vẫn thay đổi được snapshot theo chiều ngược lại.
- Dùng unmodifiable view và nghĩ nó tách khỏi nguồn: nguồn thay đổi thì view vẫn đổi.
- Copy list nhưng phần tử là object mutable: cấu trúc tách rời nhưng trạng thái phần tử vẫn alias.
- Dùng {{List.copyOf}} mà không biết nó từ chối list null hoặc phần tử null: hãy xác định contract đầu vào và kiểm tra tại biên.
- Copy mọi thứ nhiều lần trong đường xử lý nóng: mỗi bản sao O(n); ưu tiên một snapshot ở ranh giới rõ ràng rồi truyền object bất biến.

> Senior tip: với request async, ghi nhận thời điểm snapshot được tạo và chỉ truyền snapshot qua hàng đợi; tránh để thread worker đọc một DTO/list mà request thread còn giữ quyền sửa. Nếu phần tử collection mutable, làm test sửa cả list gốc lẫn từng phần tử để chứng minh bạn đã copy đúng độ sâu.

### Liên hệ phỏng vấn
Tôi sẽ giải thích rằng Java truyền giá trị tham chiếu, nên truyền List vào constructor không tự copy dữ liệu. Trường final chỉ ngăn đổi tham chiếu, không ngăn ArrayList đổi nội dung. Vì vậy tôi tạo snapshot tại ranh giới nhận dữ liệu bằng List.copyOf, validate null ngay lúc tạo, và chỉ trả ra list bất biến. Với phần tử String, copy nông đủ vì String immutable; với phần tử mutable, phải copy từng phần tử hoặc chuyển chúng thành value object bất biến. Tôi cũng phân biệt unmodifiableList là view: caller không sửa qua view nhưng nguồn gốc có thể đổi và view nhìn thấy đổi đó. Trong production, snapshot đặc biệt quan trọng khi đưa request sang executor hoặc queue vì thời điểm xử lý tách khỏi thời điểm nhận. Cuối cùng, tôi cân nhắc chi phí O(n) và đo với payload thực, nhưng không hy sinh tính đúng đắn chỉ để tránh một bản sao chưa được chứng minh là đắt.`,
  exercises: [{
    title: 'Tạo RequestSnapshot không để lộ list mutable',
    prompt: `Hoàn thiện {{RequestSnapshot}} để nó giữ mã request và tag. Mã request không null; list tag và mọi phần tử phải không null. Sau khi tạo, sửa list nguồn không được đổi snapshot, và gọi {{add}} qua accessor phải bị từ chối. Các phần tử là {{String}} immutable nên {{List.copyOf}} là đủ; không cần tự viết deep copy.`,
    starter: `final class RequestSnapshot {
    private final String requestId;
    private final List<String> tags;
    RequestSnapshot(String requestId, List<String> tags) {
        this.requestId = requestId;
        this.tags = tags;
    }
    String requestId() { return requestId; }
    List<String> tags() { return tags; }
}`,
    tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, Runnable test) {
        total++;
        try { test.run(); passed++; System.out.println("PASS " + name); }
        catch (Throwable t) { System.out.println("FAIL " + name + ": " + t); }
    }
    static void eq(Object expected, Object actual) {
        if (!Objects.equals(expected, actual))
            throw new AssertionError("expected " + expected + " but got " + actual);
    }
    public static void main(String[] args) {
        check("copy is isolated from later source changes", () -> {
            List<String> source = new ArrayList<>(List.of("urgent", "billing"));
            RequestSnapshot s = new RequestSnapshot("r-1", source);
            source.clear();
            source.add("changed");
            eq(List.of("urgent", "billing"), s.tags());
        });
        check("accessor does not allow mutation", () -> {
            RequestSnapshot s = new RequestSnapshot("r-2", new ArrayList<>(List.of("api")));
            try { s.tags().add("admin"); throw new AssertionError("list was modifiable"); }
            catch (UnsupportedOperationException expected) { }
            eq(List.of("api"), s.tags());
        });
        check("id and empty list are preserved", () -> {
            RequestSnapshot s = new RequestSnapshot("r-empty", new ArrayList<>());
            eq("r-empty", s.requestId());
            eq(List.of(), s.tags());
        });
        check("null id is rejected at construction", () -> {
            try { new RequestSnapshot(null, List.of()); throw new AssertionError("null id accepted"); }
            catch (NullPointerException expected) { }
        });
        check("null list is rejected at construction", () -> {
            try { new RequestSnapshot("r-3", null); throw new AssertionError("null list accepted"); }
            catch (NullPointerException expected) { }
        });
        check("null element is rejected at construction", () -> {
            List<String> source = new ArrayList<>();
            source.add(null);
            try { new RequestSnapshot("r-4", source); throw new AssertionError("null tag accepted"); }
            catch (NullPointerException expected) { }
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
    reference: `final class RequestSnapshot {
    private final String requestId;
    private final List<String> tags;
    RequestSnapshot(String requestId, List<String> tags) {
        this.requestId = Objects.requireNonNull(requestId, "requestId");
        this.tags = List.copyOf(Objects.requireNonNull(tags, "tags"));
    }
    String requestId() { return requestId; }
    List<String> tags() { return tags; }
}`,
    hints: [
      'String đã immutable, nên chỉ cần giữ requestId sau khi kiểm tra null. List là mutable nên phải tạo snapshot chứ không gán tham chiếu trực tiếp.',
      'List.copyOf vừa tách list nguồn, vừa trả collection không sửa được; nó cũng từ chối phần tử null.',
      'Accessor có thể trả field tags trực tiếp nếu constructor chỉ gán List.copyOf vào field và không còn đường nào làm lộ list mutable khác.'
    ],
    explain: `Test thứ nhất sửa list nguồn sau khi tạo để phát hiện alias từ caller vào object. Test thứ hai sửa qua accessor để phát hiện alias từ object ra caller. Hai hướng đều phải bị chặn. {{List.copyOf}} tạo snapshot cấu trúc bất biến và ở bài này các phần tử String cũng bất biến nên không cần copy sâu. Constructor kiểm tra null ngay khi tạo giúp lỗi xuất hiện đúng nơi dữ liệu đi vào. Nếu thay String bằng một lớp tag mutable, List.copyOf không đủ: cần copy từng tag hoặc buộc tag immutable.`
  }],
  check: [
    {
      q: 'Một field khai báo {{private final List<String> tags}} nhưng giữ ArrayList do caller truyền vào. Caller gọi {{add}} trên list đó thì sao?',
      options: [
        'Không thể thêm vì final khóa toàn bộ object List',
        'List gốc đổi và object cũng nhìn thấy nội dung mới vì hai bên giữ cùng tham chiếu',
        'JVM tự tạo bản sao khi list được gán vào field',
        'Java báo lỗi biên dịch vì field final chứa collection'
      ],
      answer: 1,
      explain: 'B đúng: final chỉ ngăn gán lại field, không làm object được trỏ tới bất biến; cả caller và class đang trỏ cùng ArrayList. A sai vì final không khóa method add. C sai vì Java không tự copy object khi gán. D sai vì field final có thể tham chiếu tới collection mutable hợp lệ.'
    },
    {
      q: 'Vì sao {{Collections.unmodifiableList(source)}} không nhất thiết là snapshot?',
      options: [
        'Vì wrapper chỉ chặn sửa qua wrapper; nếu source đổi thì nội dung nhìn qua wrapper cũng đổi',
        'Vì wrapper luôn cho phép gọi add',
        'Vì unmodifiableList tự sửa source thành immutable',
        'Vì phương thức này chỉ dùng được với mảng'
      ],
      answer: 0,
      explain: 'A đúng: unmodifiableList là view trên list nguồn, không tách dữ liệu. B sai: wrapper ném UnsupportedOperationException khi sửa qua nó. C sai: nguồn vẫn mutable và có thể được sửa qua tham chiếu khác. D sai: phương thức nhận List.'
    },
    {
      q: 'Đã gọi {{List.copyOf}} cho List<MutableTag>. Điều gì vẫn có thể làm nội dung quan sát được thay đổi?',
      options: [
        'Không gì cả, copyOf luôn deep-copy mọi object',
        'Chỉ việc gọi add trên snapshot',
        'Caller dùng tham chiếu MutableTag cũ để sửa object phần tử đang được snapshot tham chiếu tới',
        'List.copyOf chỉ sao chép phần tử đầu tiên'
      ],
      answer: 2,
      explain: 'C đúng: List.copyOf sao chép cấu trúc list, không sao chép sâu từng phần tử. Nếu phần tử mutable còn được chia sẻ, thay đổi phần tử vẫn nhìn thấy từ snapshot. A sai vì copyOf không deep-copy. B sai vì cấu trúc snapshot không cho add. D sai vì nó sao chép các phần tử theo thứ tự, không chỉ phần đầu.'
    }
  ],
  related: ['core-002'],
  tags: ['immutability', 'defensive-copy', 'List.copyOf', 'aliasing']
},
{
  id: 'lesson-core-012',
  track: 'core',
  order: 12,
  title: 'Exception đúng chuẩn: checked vs unchecked, wrap giữ cause, try-with-resources và suppressed',
  level: 'senior',
  minutes: 30,
  goals: [
    'Phân biệt checked và unchecked exception dựa trên câu hỏi ai có thể phục hồi lỗi một cách có ý nghĩa',
    'Bọc (wrap) exception ở ranh giới tầng mà vẫn giữ nguyên cause để truy vết nguyên nhân gốc',
    'Giải thích cơ chế try-with-resources: đóng ngược thứ tự, lỗi chính và suppressed exception khi nhiều lần close cùng thất bại'
  ],
  body: `**Tóm tắt:** Exception (ngoại lệ) là tín hiệu cho biết luồng thực thi bình thường không thể tiếp tục; chọn checked hay unchecked phụ thuộc vào việc caller (bên gọi) có hành động phục hồi thực tế hay không. Khi chuyển lỗi qua ranh giới tầng phải bọc và truyền {{cause}} (nguyên nhân gốc) để không mất dấu vết; {{try-with-resources}} đóng tài nguyên theo thứ tự ngược và giữ các lỗi đóng phụ trong {{getSuppressed()}}.

### Exception là gì và vì sao cần phân loại
Trong Java, khi gặp tình huống bất thường, chương trình có thể {{throw}} (ném) một object exception. JVM (Java Virtual Machine, máy ảo chạy bytecode Java) dừng thực thi tại điểm đó, tìm khối {{catch}} phù hợp trên call stack (ngăn xếp lời gọi hàm) và tháo dần các frame (khung gọi hàm) ở giữa. Nếu không có nơi nào bắt, thread (luồng thực thi) kết thúc với uncaught exception handler. Vì exception làm luồng đi "đường tắt", ta phải thiết kế để: (1) người có đủ ngữ cảnh mới xử lý, (2) tài nguyên (resource: file, kết nối DB - cơ sở dữ liệu, socket mạng) luôn được giải phóng, (3) thông tin chẩn đoán không bị mất.

Java chia exception thành hai nhóm chính theo cách compiler (trình biên dịch) kiểm tra:
- **Checked exception**: kế thừa {{Exception}} nhưng không phải {{RuntimeException}}. Compiler bắt buộc caller phải {{catch}} hoặc khai báo {{throws}}. Dùng khi caller thực sự có lựa chọn phục hồi hữu ích (ví dụ: file cấu hình tuỳ chọn thiếu, cho người dùng chọn file khác; endpoint phụ lỗi có thể fallback sang nguồn khác).
- **Unchecked exception**: kế thừa {{RuntimeException}} (hoặc {{Error}}). Compiler không bắt buộc xử lý. Dùng cho vi phạm hợp đồng/lập trình (null không hợp lệ, index sai), hoặc lỗi hạ tầng mà tầng hiện tại không thể sửa và nên để một bộ xử lý tập trung (boundary - ranh giới) quyết định trả mã lỗi, log, hoặc alert.

| Tiêu chí | Checked | Unchecked (Runtime) |
|---|---|---|
| Compiler ép xử lý | Có ({{throws}} hoặc {{catch}}) | Không |
| Người phục hồi | Caller ngay tại chỗ có hành động cụ thể | Boundary/middleware hoặc không phục hồi được |
| Ví dụ điển hình | {{IOException}} khi đọc file tuỳ chọn | {{IllegalArgumentException}}, {{IllegalStateException}}, lỗi timeout DB được bọc lại |
| Rủi ro | Lan {{throws}} khắp chữ ký, code khó đọc | Bị bỏ sót nếu boundary không xử lý thống nhất |

> Lưu ý thực tế với Spring: {{@Transactional}} mặc định rollback (hoàn tác giao dịch) khi gặp {{RuntimeException}} hoặc {{Error}}; checked exception mặc định **không** rollback trừ khi cấu hình {{rollbackFor}}. Vì vậy đừng bọc lỗi ghi DB thành checked chỉ để "đủ khai báo" rồi vô tình commit trạng thái dở dang.

### Bọc exception và giữ nguyên cause
Ở ranh giới tầng (ví dụ repository → service → controller), ta thường chuyển exception kỹ thuật ({{SQLException}}, {{IOException}}) thành exception mang ngữ cảnh nghiệp vụ. Điều quan trọng: **phải truyền exception gốc làm cause** để stack trace (vết ngăn xếp lỗi) còn giữ nguyên nhân thật.

~~~java
class PaymentStoreException extends RuntimeException {
    PaymentStoreException(String message, Throwable cause) {
        super(message, cause); // giu cause de truy vet
    }
}

// Tang repository: chuyen loi ky thuat, giu cause
try {
    return jdbc.query(sql, mapper, orderId);
} catch (RuntimeException e) {
    throw new PaymentStoreException("Khong tai duoc don hang " + orderId, e);
}
~~~

Khi in log, JVM sẽ hiển thị dòng "Caused by: ..." nối chuỗi nguyên nhân. Nếu bạn {{throw new X("msg")}} mà bỏ cause, hoặc bắt lỗi rồi ném lỗi mới không gắn cause, người điều tra production sẽ chỉ thấy triệu chứng ở tầng trên (ví dụ "500 lỗi thanh toán") mà mất manh mối gốc (timeout kết nối, unique constraint - ràng buộc duy nhất vi phạm, sai câu SQL).

Sai lầm hay gặp: bắt {{Exception}} rồi {{return null}} hoặc nuốt lỗi im lặng — caller không phân biệt được "không có dữ liệu" với "hệ thống lỗi". Chỉ catch đúng loại lỗi bạn xử lý được; nếu không xử lý được thì bọc và ném tiếp.

### try-with-resources và suppressed exception
Tài nguyên như file, stream (luồng dữ liệu), kết nối cần được đóng sau khi dùng. Trước Java 7, phải viết {{finally}} thủ công và rất dễ sai (lỗi trong {{close()}} có thể che mất lỗi trong thân khối). Từ Java 7, {{try-with-resources}} tự động đóng mọi tài nguyên implement {{AutoCloseable}} (giao diện cho phép đóng tự động).

Cơ chế từng bước:
1. Các tài nguyên trong ngoặc tròn được khởi tạo theo thứ tự khai báo. Nếu tài nguyên thứ hai lỗi khi khởi tạo, tài nguyên thứ nhất đã mở vẫn được đóng.
2. Chạy thân {{try}}. Nếu thân ném exception A, A được ghi nhớ là **lỗi chính**.
3. Khi rời khối (dù bình thường, {{return}}, hay do exception), Java gọi {{close()}} theo **thứ tự ngược** khai báo. Lý do: tài nguyên khai báo sau thường phụ thuộc tài nguyên trước (ví dụ {{BufferedReader}} bọc {{InputStream}}), nên phải đóng lớp ngoài trước.
4. Nếu một {{close()}} ném exception B trong khi đã có lỗi chính A, B **không** thay thế A mà được gắn vào A bằng {{A.addSuppressed(B)}}. Caller nhận A và có thể duyệt {{A.getSuppressed()}} để thấy toàn bộ lỗi đóng.
5. Nếu thân không lỗi nhưng {{close()}} đầu tiên (theo thứ tự đóng) ném B, B trở thành lỗi chính; các lỗi {{close()}} sau gắn vào suppressed của B.

~~~java
try (Res outer = new Res("OUT", log, failCloseOut);
     Res inner = new Res("IN", log, failCloseIn)) {
    doWork(failWork, log); // neu loi: van dong IN roi OUT
}
// khai bao OUT, IN -> dong IN truoc, OUT sau
~~~

Trong ví dụ trên, nếu {{doWork}} ném "WORK_FAIL", {{inner.close()}} ném "IN_CLOSE_FAIL", {{outer.close()}} ném "OUT_CLOSE_FAIL" thì caller nhận "WORK_FAIL" làm lỗi chính và mảng suppressed chứa ["IN_CLOSE_FAIL", "OUT_CLOSE_FAIL"] theo đúng thứ tự đóng.

### Ví dụ đời thực
Một batch job (tác vụ chạy nền theo lô) ghi báo cáo: mở kết nối DB, mở file tạm, ghi dữ liệu rồi đóng cả hai. Code cũ dùng {{finally}} lồng nhau: khi ghi lỗi và đồng thời {{close()}} file cũng lỗi (ổ đĩa đầy không flush được buffer - vùng đệm), exception từ {{close()}} ghi đè làm log chỉ thấy "disk full" mà mất lỗi nghiệp vụ gốc "duplicate key" (vi phạm khoá duy nhất). Sau khi chuyển sang try-with-resources, lỗi "duplicate key" là lỗi chính, "disk full" nằm trong suppressed; nhóm vận hành sửa được cả ràng buộc dữ liệu lẫn cấu hình dung lượng. Triệu chứng ban đầu: dữ liệu thiếu nhưng log chỉ báo lỗi hạ tầng. Cách sửa: dùng try-with-resources và khi log luôn duyệt {{getSuppressed()}}.

### Lỗi hay gặp
- **Nuốt exception**: bắt {{Exception}} rồi bỏ trống (không xử lý, không ném lại) hoặc chỉ log message không log stack/cause → mất dấu vết, bug im lặng.
- **Mất cause khi wrap**: {{throw new ServiceException(e.getMessage())}} quên truyền {{e}} → mất stack gốc.
- **Retry sai loại lỗi**: retry cả lỗi validation (sai đầu vào, không bao giờ đúng) hoặc retry ghi không idempotent (không có khóa nhận dạng yêu cầu trùng để chặn ghi lặp) → tạo dữ liệu trùng hoặc quá tải.
- **Chỉ đọc lỗi chính, bỏ suppressed**: bỏ qua lỗi flush/close → rò rỉ tài nguyên hoặc dữ liệu chưa ghi xuống đĩa mà hệ thống tưởng thành công.

### Trả lời mẫu khi phỏng vấn
"Khi thiết kế exception em luôn hỏi: ai có thể phục hồi lỗi này một cách có ý nghĩa? Nếu caller ngay tại chỗ có lựa chọn cụ thể như fallback hay hỏi người dùng, em cân nhắc checked exception; còn lỗi do vi phạm hợp đồng hoặc lỗi hạ tầng không sửa được tại chỗ thì dùng unchecked và để boundary như controller advice xử lý tập trung, đồng thời lưu ý với Spring transaction thì unchecked mới rollback mặc định. Khi chuyển exception qua ranh giới tầng, em luôn bọc thành exception mang ngữ cảnh nghiệp vụ nhưng truyền exception gốc vào {{cause}} để giữ toàn bộ stack trace, và chỉ log full stack một lần ở boundary để tránh trùng log. Với tài nguyên em dùng try-with-resources vì nó đóng theo thứ tự ngược, an toàn khi khởi tạo hoặc thân khối lỗi; nếu thân khối ném lỗi chính thì lỗi từ {{close()}} được đưa vào {{getSuppressed()}} thay vì che mất lỗi gốc, nên khi điều tra em luôn duyệt cả suppressed. Em tránh nuốt exception, tránh retry lỗi không transient và với thao tác ghi sẽ đảm bảo idempotency trước khi retry."

> Senior tip: khi điều tra sự cố production, luôn log cả {{e}} và duyệt {{e.getSuppressed()}} (đặc biệt lỗi IO/DB). Một {{close()}} thất bại âm thầm có thể là nguyên nhân thật của mất dữ liệu dù business logic đã "chạy xong".

### Liên hệ phỏng vấn
Nắm chắc ba ý: (1) chọn checked/unchecked theo khả năng phục hồi của caller và hành vi rollback của transaction; (2) luôn wrap giữ {{cause}} để truy vết chuỗi lỗi; (3) try-with-resources đóng ngược, lỗi thân là lỗi chính, lỗi close nằm trong {{getSuppressed()}} — biết đọc suppressed là kỹ năng debug quan trọng.`,
  exercises: [
    {
      title: 'Đóng nhiều resource giả và kiểm tra suppressed exception',
      prompt: 'Cài đặt {{TrackedRes}} (tài nguyên giả, có tên, ghi log và có thể lỗi khi {{close()}}) và hàm {{Runner.run(...)}}. Hàm mở R1 rồi R2 trong cùng một {{try-with-resources}}, ghi "work" và có thể ném "WORK_FAIL". Yêu cầu:\n- Luôn đóng theo thứ tự ngược: R2 trước, R1 sau (ghi log {{close-R2}}, {{close-R1}}).\n- Nếu {{work}} ném lỗi, đó là lỗi chính; mọi lỗi {{close()}} phải nằm trong {{getSuppressed()}} theo thứ tự đóng.\n- Nếu {{work}} thành công nhưng {{close()}} lỗi, lỗi {{close()}} đầu tiên (R2) là lỗi chính, lỗi {{close()}} sau (R1) nằm trong suppressed của nó.\n- Nếu không có lỗi nào, trả về bình thường và log phải có {{work}}, {{close-R2}}, {{close-R1}}.',
      starter: `class TrackedRes implements AutoCloseable {
    final String name;
    final List<String> log;
    final RuntimeException closeError;
    TrackedRes(String name, List<String> log, RuntimeException closeError) {
        this.name = name;
        this.log = log;
        this.closeError = closeError;
    }
    public void close() {
        throw new UnsupportedOperationException("TODO");
    }
}
class Runner {
    static void run(List<String> log, boolean failWork, boolean failCloseR1, boolean failCloseR2) {
        throw new UnsupportedOperationException("TODO");
    }
}`,
      tests: `public class Main {
    static void eq(Object a, Object b) {
        if (!Objects.equals(a, b)) throw new AssertionError("expected " + a + " but got " + b);
    }
    public static void main(String[] args) {
        List<String> log = new ArrayList<>();
        Runner.run(log, false, false, false);
        eq(List.of("work", "close-R2", "close-R1"), log);

        log.clear();
        try {
            Runner.run(log, true, true, true);
            throw new AssertionError("expected work error");
        } catch (RuntimeException e) {
            eq("WORK_FAIL", e.getMessage());
            eq(2, e.getSuppressed().length);
            eq("R2_CLOSE_FAIL", e.getSuppressed()[0].getMessage());
            eq("R1_CLOSE_FAIL", e.getSuppressed()[1].getMessage());
        }
        eq(List.of("work", "close-R2", "close-R1"), log);

        log.clear();
        try {
            Runner.run(log, false, true, true);
            throw new AssertionError("expected close error");
        } catch (RuntimeException e) {
            eq("R2_CLOSE_FAIL", e.getMessage());
            eq(1, e.getSuppressed().length);
            eq("R1_CLOSE_FAIL", e.getSuppressed()[0].getMessage());
        }
        eq(List.of("work", "close-R2", "close-R1"), log);

        log.clear();
        try {
            Runner.run(log, true, false, true);
            throw new AssertionError("expected work error with one suppressed");
        } catch (RuntimeException e) {
            eq("WORK_FAIL", e.getMessage());
            eq(1, e.getSuppressed().length);
            eq("R2_CLOSE_FAIL", e.getSuppressed()[0].getMessage());
        }
        eq(List.of("work", "close-R2", "close-R1"), log);

        System.out.println("RESULT 4/4");
    }
}`,
      reference: `class TrackedRes implements AutoCloseable {
    final String name;
    final List<String> log;
    final RuntimeException closeError;
    TrackedRes(String name, List<String> log, RuntimeException closeError) {
        this.name = name;
        this.log = log;
        this.closeError = closeError;
    }
    public void close() {
        log.add("close-" + name);
        if (closeError != null) throw closeError;
    }
}
class Runner {
    static void run(List<String> log, boolean failWork, boolean failCloseR1, boolean failCloseR2) {
        RuntimeException e1 = failCloseR1 ? new RuntimeException("R1_CLOSE_FAIL") : null;
        RuntimeException e2 = failCloseR2 ? new RuntimeException("R2_CLOSE_FAIL") : null;
        try (TrackedRes r1 = new TrackedRes("R1", log, e1);
             TrackedRes r2 = new TrackedRes("R2", log, e2)) {
            log.add("work");
            if (failWork) throw new RuntimeException("WORK_FAIL");
        }
    }
}`,
      hints: [
        'Khai báo R1 rồi R2 trong cùng try-with-resources; Java tự đóng theo thứ tự ngược (R2 trước R1).',
        'Trong close(), luôn ghi log trước rồi mới ném closeError để test thấy thứ tự đóng.',
        'Không cần tự gắn suppressed: cơ chế ngôn ngữ tự xử lý khi dùng try-with-resources.'
      ],
      explain: 'Tài nguyên tạo sau thường phụ thuộc tài nguyên tạo trước, nên phải đóng ngược (R2 rồi R1). Khi thân ném "WORK_FAIL", đó là lỗi chính và các lỗi close được gắn vào suppressed theo trình tự xảy ra. Khi thân thành công, close đầu tiên thất bại (R2) là lỗi chính, close sau (R1) bị suppressed vào nó. Đây là lợi thế so với finally thủ công, nơi lỗi close dễ che mất lỗi gốc.'
    }
  ],
  check: [
    {
      q: 'Trong try-with-resources mở A rồi B và gọi {{work()}}, nếu {{work()}} ném X, {{b.close()}} ném Y, {{a.close()}} ném Z thì caller nhận được gì?',
      options: [
        'Nhận Z vì a.close() chạy cuối cùng',
        'Nhận Y vì b.close() chạy ngay sau work()',
        'Nhận X là lỗi chính; Y và Z nằm trong {{getSuppressed()}} của X theo thứ tự đóng (Y rồi Z)',
        'Nhận một exception tổng hợp ngẫu nhiên tuỳ JVM'
      ],
      answer: 2,
      explain: 'Lỗi từ thân khối (X) là lỗi chính. Tài nguyên đóng ngược thứ tự khai báo nên b.close() chạy trước (ném Y) rồi a.close() (ném Z); Y và Z được addSuppressed vào X. A, B sai vì lỗi close không thay thế lỗi chính khi thân đã ném; D sai vì hành vi được đặc tả rõ.'
    },
    {
      q: 'Khi bọc {{SQLException}} thành exception nghiệp vụ ở tầng repository, cách nào đúng để giữ khả năng điều tra?',
      options: [
        'throw new RepoException(sqlEx.getMessage())',
        'Chỉ log sqlEx rồi throw new RepoException("DB error")',
        'throw new RepoException("Khong tai duoc don hang", sqlEx) để giữ sqlEx làm cause',
        'return null để caller tự xử lý'
      ],
      answer: 2,
      explain: 'Phải truyền exception gốc làm cause để stack trace giữ chuỗi "Caused by". A và B mất cause; D nuốt lỗi khiến caller không phân biệt "không có dữ liệu" với "hệ thống lỗi".'
    },
    {
      q: 'Trường hợp nào phù hợp nhất để dùng checked exception?',
      options: [
        'Tham số đầu vào null do lỗi lập trình của caller',
        'Lỗi hết bộ nhớ (OutOfMemoryError)',
        'Caller ngay tại chỗ có hành động phục hồi thực tế (ví dụ chọn file khác, fallback endpoint)',
        'Mọi lỗi truy cập cơ sở dữ liệu trong ứng dụng Spring'
      ],
      answer: 2,
      explain: 'Checked exception hợp khi caller thực sự có lựa chọn phục hồi hữu ích. A là vi phạm hợp đồng nên dùng unchecked. B là Error nghiêm trọng. D không phù hợp vì caller tầng trên thường không phục hồi được tại chỗ và trong Spring checked còn không rollback mặc định.'
    }
  ],
  related: ['core-011', 'core-013', 'core-053'],
  tags: ['exception', 'checked-unchecked', 'try-with-resources', 'suppressed', 'cause']
},
{
  id: 'lesson-core-013',
  track: 'core',
  order: 13,
  title: 'Generics PECS thực chiến: viết copy và max an toàn kiểu',
  level: 'senior',
  minutes: 30,
  goals: [
    'Giải thích vì sao generic trong Java là invariant và wildcard giúp biểu diễn quan hệ producer/consumer an toàn',
    'Áp dụng đúng quy tắc PECS: Producer Extends, Consumer Super trong chữ ký phương thức',
    'Viết API generic copy(List<? super T>, List<? extends T>) và max với Comparator<? super T> không cần ép kiểu'
  ],
  body: `**Tóm tắt:** Generic (kiểu tham số hoá) trong Java là invariant (không đồng biến): {{List<Integer>}} không phải con của {{List<Number>}}. Để viết API linh hoạt mà vẫn an toàn kiểu tại compile-time, dùng wildcard (ký tự đại diện): {{? extends T}} cho nguồn chỉ đọc (producer - bên cung cấp dữ liệu) và {{? super T}} cho đích chỉ ghi (consumer - bên nhận dữ liệu). Quy tắc nhớ nhanh là PECS: Producer Extends, Consumer Super.

### Vì sao cần generic và vì sao nó invariant
Trước Java 5, collection (bộ sưu tập) lưu {{Object}} nên phải ép kiểu (cast) khi đọc và lỗi kiểu chỉ lộ ở runtime (lúc chạy, {{ClassCastException}}). Generic cho phép khai báo {{List<String>}} để compiler kiểm tra ngay lúc biên dịch. Nhưng Java chọn **invariant** cho generic: dù {{Integer}} là con của {{Number}}, {{List<Integer>}} **không** gán được cho {{List<Number>}}.

Lý do an toàn: nếu cho phép gán, bạn có thể ghi {{3.14}} (Double) vào một biến kiểu {{List<Number>}} nhưng thực chất đang trỏ tới {{List<Integer>}} — phần tử Double lọt vào danh sách số nguyên và gây lỗi khó truy vết. Mảng Java thì covariant (đồng biến: {{Integer[]}} gán được cho {{Number[]}}) nhưng ghi sai kiểu sẽ ném {{ArrayStoreException}} ngay tại runtime; generic chọn chặn sớm ở compile-time (lúc biên dịch).

~~~java
List<Integer> ints = new ArrayList<>();
// List<Number> nums = ints; // KHONG bien dich: invariant
List<? extends Number> readOnly = ints; // OK: chi doc nhu Number
Number n = readOnly.get(0);              // doc an toan
// readOnly.add(1); // KHONG bien dich: khong biet subtype cu the
~~~

### Wildcard và quy tắc PECS từng bước
Wildcard {{?}} biểu diễn "một kiểu nào đó chưa xác định". Compiler "capture" (bắt) nó thành một kiểu ẩn trong phạm vi lời gọi:

1. **{{? extends T}} (upper bound - cận trên)** — *Producer*: nguồn sản xuất ra giá trị kiểu T. Có thể là {{List<Integer>}} hay {{List<Double>}} khi T là {{Number}}. Đọc ra thì chắc chắn nhận được ít nhất là {{T}}. Nhưng **không ghi được** (trừ {{null}}) vì compiler không biết danh sách thực sự chấp nhận subtype (kiểu con) nào.
2. **{{? super T}} (lower bound - cận dưới)** — *Consumer*: đích tiêu thụ giá trị kiểu T. Có thể là {{List<Integer>}}, {{List<Number>}} hay {{List<Object>}}. **Ghi** một phần tử kiểu {{T}} là an toàn vì mọi kiểu đích trong nhóm này đều là cha của T. Nhưng **đọc ra** chỉ chắc chắn là {{Object}}.
3. **PECS**: nếu tham số chỉ "cho ra" dữ liệu để bạn đọc → {{extends}}; nếu chỉ "nhận vào" dữ liệu bạn ghi → {{super}}. Nếu vừa đọc vừa ghi trên cùng cấu trúc thì dùng {{T}} cụ thể.
4. **Kết nối hai phía bằng cùng một T**: trong {{copy(List<? super T> dst, List<? extends T> src)}}, cùng biến kiểu {{T}} ràng buộc nguồn và đích, nên phần tử đọc từ {{src}} (ít nhất là T) ghi được vào {{dst}} (chấp nhận T) mà không cần cast.

| Khai báo | Đọc ra kiểu | Ghi vào được | Vai trò |
|---|---|---|---|
| {{List<T>}} | {{T}} | {{T}} | Đọc và ghi cùng kiểu |
| {{List<? extends T>}} | {{T}} | Không (trừ {{null}}) | Producer / nguồn |
| {{List<? super T>}} | {{Object}} | {{T}} | Consumer / đích |

### Ví dụ: copy và max an toàn kiểu
Hàm {{copy}} đọc từ nguồn và ghi vào đích: nguồn là producer → {{extends}}, đích là consumer → {{super}}. Hàm {{max}} duyệt collection để đọc phần tử (producer → {{extends}}) và dùng {{Comparator}} (bộ so sánh) để so sánh hai phần tử (comparator "tiêu thụ" hai T để so sánh → {{super}}), nhờ đó {{Comparator<Number>}} hay {{Comparator<Object>}} vẫn dùng được để tìm max trong {{List<Integer>}}.

~~~java
class Ops {
    static <T> void copy(List<? super T> dst, List<? extends T> src) {
        for (T value : src) {
            dst.add(value);
        }
    }

    static <T> Optional<T> max(Collection<? extends T> xs, Comparator<? super T> c) {
        if (xs.isEmpty()) return Optional.empty();
        T best = null;
        for (T v : xs) {
            if (best == null || c.compare(v, best) > 0) best = v;
        }
        return Optional.of(best);
    }
}
~~~

Vì sao {{Comparator<? super T>}} quan trọng? Một comparator viết cho {{Number}} (so sánh theo {{doubleValue}}) hoàn toàn có khả năng so sánh mọi {{Integer}}. Nếu chữ ký yêu cầu {{Comparator<T>}} cứng, bạn không truyền được comparator tổng quát hơn — mất tính tái sử dụng dù an toàn.

### Hạn chế: type erasure
Java generic dùng **type erasure** (xoá kiểu ở runtime): {{List<String>}} và {{List<Integer>}} đều trở thành {{List}} trong bytecode. Hệ quả: không thể {{new T()}}, không thể {{new T[]}}, không thể {{instanceof List<String>}}. Khi cần tạo mảng generic phải dùng kỹ thuật kiểm soát hoặc nhận {{Class<T>}}; khi cần kiểm tra kiểu phần tử phải kiểm tra từng phần tử.

### Ví dụ đời thực
Một thư viện báo cáo nội bộ nhận danh sách số liệu từ nhiều nguồn: {{List<Integer>}} (đếm), {{List<Long>}} (thời gian mili-giây), {{List<Double>}} (tỉ lệ). Nếu API khai báo {{List<Number>}}, mọi caller phải copy sang {{List<Number>}} mới gọi được. Sau khi đổi sang {{Collection<? extends Number>}} và comparator {{Comparator<? super Number>}}, caller truyền thẳng collection gốc, không copy, không cast, compiler vẫn bảo vệ kiểu. Với module xử lý hàng trăm nghìn bản ghi, bỏ bước copy trung gian giúp giảm cấp phát tạm (allocation) và đơn giản hoá code gọi.

### Lỗi hay gặp
- **Dùng raw type** ({{List}} không tham số): tắt kiểm tra kiểu, {{ClassCastException}} nổ ở nơi xa nơi chèn dữ liệu.
- **Nhầm extends/super**: dùng {{? extends T}} cho tham số cần ghi → không thêm phần tử được; dùng {{? super T}} cho tham số cần đọc kiểu T → chỉ lấy ra {{Object}}.
- **Wildcard lồng phức tạp**: khó đọc, khó bảo trì — cân nhắc tách generic method hoặc dùng kiểu đặt tên rõ.
- **Quên {{Comparator<? super T>}}**: API {{max}} kém linh hoạt, buộc caller viết comparator trùng lặp.

### Trả lời mẫu khi phỏng vấn
"Generic trong Java là invariant để an toàn kiểu: nếu {{List<Integer>}} được coi là {{List<Number>}} thì có thể chèn {{Double}} vào danh sách số nguyên và lỗi chỉ lộ lúc chạy. Vì vậy em dùng wildcard theo quy tắc PECS: tham số đóng vai trò producer, chỉ đọc ra, thì khai báo {{? extends T}}; tham số là consumer, chỉ nhận vào, thì {{? super T}}. Ví dụ hàm copy, nguồn là {{List<? extends T>}} và đích là {{List<? super T>}} nên cùng một biến kiểu T nối được hai phía mà không cần cast. Với hàm max, collection là nguồn nên {{Collection<? extends T>}} còn comparator tiêu thụ hai phần tử để so sánh nên em dùng {{Comparator<? super T>}} để tái sử dụng được comparator tổng quát hơn như comparator của Number cho Integer. Em cũng lưu ý generic bị type erasure ở runtime nên không tạo được {{new T[]}} hay kiểm tra {{instanceof}} với tham số kiểu, và em tránh raw type vì nó làm mất toàn bộ lợi ích kiểm tra tại compile-time."

> Senior tip: khi thiết kế API thư viện, hãy ưu tiên chữ ký "nhận rộng nhất có thể, trả hẹp nhất cần thiết" (PECS cho tham số đầu vào). Đừng lạm dụng wildcard ở kiểu trả về vì nó buộc caller phải đối mặt với {{?}} khó dùng; hãy trả về {{List<T>}} hoặc {{Optional<T>}} cụ thể.

### Liên hệ phỏng vấn
Nhớ giải thích được: (1) invariant vs covariant của mảng và vì sao generic chọn invariant; (2) PECS — extends để đọc, super để ghi; (3) vì sao {{Comparator<? super T>}} tăng tính tái sử dụng (contravariant - nghịch biến ở tham số); (4) type erasure và hệ quả (không {{new T[]}}, không {{instanceof}} tham số hoá).`,
  exercises: [
    {
      title: 'Viết copy và max theo PECS (không cast)',
      prompt: 'Hoàn thiện lớp {{Ops}} với hai phương thức generic:\n- {{copy(List<? super T> dst, List<? extends T> src)}}: chép toàn bộ phần tử từ {{src}} sang cuối {{dst}} theo thứ tự, không xoá phần tử cũ của {{dst}}.\n- {{max(Collection<? extends T> xs, Comparator<? super T> c)}}: trả về {{Optional}} chứa phần tử lớn nhất theo {{c}}; nếu {{xs}} rỗng trả {{Optional.empty()}}. Không dùng ép kiểu (cast).\nGợi ý: áp dụng PECS cho cả collection và comparator.',
      starter: `class Ops {
    static <T> void copy(List<? super T> dst, List<? extends T> src) {
        throw new UnsupportedOperationException("TODO");
    }
    static <T> Optional<T> max(Collection<? extends T> xs, Comparator<? super T> c) {
        throw new UnsupportedOperationException("TODO");
    }
}`,
      tests: `public class Main {
    static void eq(Object a, Object b) {
        if (!Objects.equals(a, b)) throw new AssertionError("expected " + a + " but got " + b);
    }
    public static void main(String[] args) {
        // copy: Integer source -> Number dest
        List<Integer> src = new ArrayList<>(List.of(1, 2, 3));
        List<Number> dst = new ArrayList<>(List.of(0));
        Ops.copy(dst, src);
        eq(List.of(0, 1, 2, 3), dst);
        eq(List.of(1, 2, 3), src);

        // copy: empty source keeps dest unchanged
        List<String> d2 = new ArrayList<>(List.of("a"));
        Ops.copy(d2, List.of());
        eq(List.of("a"), d2);

        // max: empty -> Optional.empty()
        eq(Optional.empty(), Ops.max(List.<Integer>of(), Comparator.naturalOrder()));

        // max: Integer list with Comparator<Number> (contravariant)
        Comparator<Number> byDouble = Comparator.comparingDouble(Number::doubleValue);
        List<Integer> nums = List.of(5, 2, 9, 1);
        eq(Optional.of(9), Ops.max(nums, byDouble));

        // max: String by length
        List<String> words = List.of("a", "bbb", "cc");
        eq(Optional.of("bbb"), Ops.max(words, Comparator.comparingInt(String::length)));

        System.out.println("RESULT 5/5");
    }
}`,
      reference: `class Ops {
    static <T> void copy(List<? super T> dst, List<? extends T> src) {
        for (T item : src) {
            dst.add(item);
        }
    }
    static <T> Optional<T> max(Collection<? extends T> xs, Comparator<? super T> c) {
        Iterator<? extends T> it = xs.iterator();
        if (!it.hasNext()) return Optional.empty();
        T best = it.next();
        while (it.hasNext()) {
            T cur = it.next();
            if (c.compare(cur, best) > 0) best = cur;
        }
        return Optional.of(best);
    }
}`,
      hints: [
        'Nguồn chỉ đọc ra (producer) dùng {{? extends T}}; đích chỉ nhận vào (consumer) dùng {{? super T}}.',
        'Comparator tiêu thụ hai giá trị T để so sánh, nên dùng {{Comparator<? super T>}} để nhận comparator của kiểu cha (ví dụ Comparator<Number> cho Integer).',
        'Với max, khởi tạo best bằng phần tử đầu tiên để đúng cả khi toàn giá trị âm.'
      ],
      explain: 'copy áp dụng PECS: đọc từ producer (extends) và ghi vào consumer (super) với cùng T nên không cần cast. max kết hợp: collection là nguồn (extends T), Comparator là consumer của T (super T) nên truyền {{Comparator<Number>}} cho {{List<Integer>}} vẫn hợp lệ. Khởi tạo best từ phần tử đầu giúp thuật toán đúng với mọi miền giá trị.'
    }
  ],
  check: [
    {
      q: 'Vì sao {{List<Integer>}} không thể gán cho biến kiểu {{List<Number>}} trong Java?',
      options: [
        'Vì Integer không kế thừa Number',
        'Vì generic là invariant; nếu cho phép gán, có thể chèn Double vào danh sách thực chất chứa Integer và gây lỗi kiểu',
        'Vì List là interface nên không hỗ trợ đa hình',
        'Vì compiler không biết kích thước phần tử'
      ],
      answer: 1,
      explain: 'Generic Java invariant để bảo toàn an toàn kiểu: cho phép gán sẽ mở đường chèn phần tử sai kiểu con vào danh sách thực. A sai vì Integer extends Number; C, D không phải lý do.'
    },
    {
      q: 'Trong {{static <T> void copy(List<? super T> dst, List<? extends T> src)}}, phát biểu nào đúng?',
      options: [
        'src là consumer nên dùng super, dst là producer nên dùng extends',
        'src là producer (đọc ra) nên dùng extends, dst là consumer (ghi vào) nên dùng super',
        'Cả src và dst đều phải dùng extends T',
        'Phải dùng List<T> cho cả hai vì wildcard không cho phép đọc và ghi'
      ],
      answer: 1,
      explain: 'Theo PECS: nguồn cung cấp phần tử để đọc là Producer Extends, đích nhận phần tử để ghi là Consumer Super. A đảo vai trò; C sai vì dst cần ghi; D sai vì cùng T vẫn cho phép đọc từ src và ghi vào dst an toàn.'
    },
    {
      q: 'Vì sao {{max}} nên nhận {{Comparator<? super T>}} thay vì {{Comparator<T>}}?',
      options: [
        'Vì Comparator luôn phải so sánh Object',
        'Vì Comparator chỉ đọc T nên phải dùng extends',
        'Vì Comparator tiêu thụ hai giá trị T; dùng super cho phép truyền comparator của kiểu cha (ví dụ Comparator<Number> cho List<Integer>)',
        'Vì type erasure bắt buộc phải dùng super'
      ],
      answer: 2,
      explain: 'Comparator nhận vào (tiêu thụ) hai T để so sánh nên theo PECS dùng {{? super T}} (contravariant), cho phép tái sử dụng comparator tổng quát hơn. A, B, D không đúng bản chất.'
    },
    {
      q: 'Với {{List<? extends Number> nums}}, thao tác nào được compiler chấp nhận?',
      options: [
        'nums.add(Integer.valueOf(1))',
        'nums.add(Double.valueOf(1.0))',
        'Number x = nums.get(0) (nếu list không rỗng)',
        'Integer x = nums.get(0)'
      ],
      answer: 2,
      explain: 'Với {{? extends Number}}, đọc ra chắc chắn là Number nên gán vào {{Number}} an toàn. Không thể add vì list thực tế có thể là subtype khác; không thể gán trực tiếp vào {{Integer}} không cast.'
    }
  ],
  related: ['core-001', 'core-012', 'core-056'],
  tags: ['generics', 'PECS', 'wildcard', 'type-safety', 'Comparator']
}

);
