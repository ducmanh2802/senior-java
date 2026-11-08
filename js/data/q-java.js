/* Topics: core, collections, modern — owner: task T1. Format: see AGENTS.md */
(window.QUESTIONS = window.QUESTIONS || []).push(
{
  id: 'core-001',
  topic: 'core',
  level: 'mid',
  q: 'Contract giữa {{equals()}} và {{hashCode()}} là gì? Vi phạm thì chuyện gì xảy ra?',
  a: `**Tóm tắt:** {{equals()}} trả lời "hai object có coi là bằng nhau không" còn {{hashCode()}} trả về một số nguyên dùng để xếp object vào "ngăn" trong bảng băm (hash table - cấu trúc dữ liệu tra cứu nhanh như {{HashMap}}/{{HashSet}}). Hợp đồng (contract): nếu {{a.equals(b)}} là {{true}} thì {{a.hashCode() == b.hashCode()}} bắt buộc đúng; ngược lại, cùng {{hashCode}} không có nghĩa là {{equals}} (gọi là va chạm - collision). Vi phạm hợp đồng làm {{HashMap}}/{{HashSet}} tìm sai chỗ, trả về {{false}} dù phần tử có tồn tại, hoặc chứa phần tử trùng.

### Cái gì - vì sao cần - cơ chế bên trong
- **{{equals()}} là gì?** Phương thức trong {{java.lang.Object}} dùng để so sánh "nghiệp vụ" hai object có bằng nhau không. Mặc định (trong {{Object}}) nó so sánh địa chỉ tham chiếu (giống {{==}}), nên class tự định nghĩa "bằng nhau theo ý nghĩa" (ví dụ hai {{User}} cùng id) phải override.
- **{{hashCode()}} là gì?** Trả về một số {{int}}. {{HashMap}} dùng số này để tính chỉ số bucket (ngăn): thường {{index = (n - 1) & hash}} với {{n}} là số bucket. Object nào hash về cùng index thì nằm cùng bucket; trong bucket, {{HashMap}} mới gọi {{equals()}} để phân biệt.
- **Vì sao phải đi đôi?** {{HashMap.get(key)}} làm 2 bước: (1) dùng {{hashCode}} của key để nhảy thẳng tới bucket - rất nhanh, O(1) trung bình; (2) trong bucket có thể có nhiều phần tử va chạm, nên duyệt và gọi {{equals}} để tìm đúng key. Nếu bạn override {{equals}} nhưng quên {{hashCode}}, hai key "bằng nhau" theo {{equals}} có thể trả về hash khác → rơi vào 2 bucket khác → bước (1) tìm sai chỗ → {{get}}/{{contains}} trả {{null}}/{{false}} dù phần tử thực sự có trong map.

### Contract chi tiết (cần nhớ khi override)
| Quy tắc | Ý nghĩa |
|---|---|
| Phản xạ (reflexive) | {{x.equals(x)}} luôn {{true}} |
| Đối xứng (symmetric) | {{x.equals(y)}} == {{y.equals(x)}} |
| Bắc cầu (transitive) | x=y và y=z thì x=z |
| Nhất quán (consistent) | Gọi nhiều lần, dữ liệu không đổi thì kết quả không đổi |
| So với null | {{x.equals(null)}} luôn {{false}} |
| Liên hệ hash | {{equals}} true ⇒ {{hashCode}} bằng nhau |

### Ví dụ đời thực (production)
Giả định một dịch vụ phiên đăng nhập dùng {{HashSet<SessionToken>}} (tập hợp không trùng) để kiểm tra token đang hoạt động, ~50.000 token, ~3.000 QPS tra cứu. Dev tạo class {{SessionToken}} có field {{value}} và override {{equals}} so sánh {{value}}, nhưng quên override {{hashCode}} (dùng mặc định của {{Object}}: identity hash, khác nhau cho mỗi object; HotSpot hiện sinh nó bằng số ngẫu nhiên chứ không phải địa chỉ bộ nhớ). Hậu quả: cùng một chuỗi token tạo thành 2 object Java khác nhau → {{hashCode}} mặc định khác → {{set.contains(tokenMoi)}} trả {{false}} dù token hợp lệ đã có trong set. Triệu chứng: người dùng bị đăng xuất ngẫu nhiên, tỷ lệ lỗi 401 tăng từ ~0,1% lên ~8% sau deploy. Điều tra: log cho thấy token "không tìm thấy" nhưng truy vấn DB xác nhận token còn hiệu lực; viết unit test {{set.add(t1); assert set.contains(new Token(t1.value));}} → fail. Cách sửa: thêm override {{hashCode()}} dùng {{Objects.hash(value)}} (đúng các field tham gia equals), hoặc đổi sang {{record SessionToken(String value)}} (Java 16+, record tự sinh {{equals}}/{{hashCode}} đúng contract). Kết quả: lỗi 401 về mức bình thường, p99 tra cứu token vẫn < 1ms.

~~~java
// BAD: override equals, quên hashCode -> vi phạm contract
class UserKey {
    final String id;
    UserKey(String id) { this.id = id; }
    @Override public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof UserKey k)) return false;
        return Objects.equals(id, k.id);
    }
    // thiếu hashCode!
}
// GOOD: dùng record (Java 16+) - tự sinh cả hai, immutable
record UserKey(String id) {}
// GOOD: tự viết, dùng cùng field với equals
@Override public int hashCode() { return Objects.hash(id); }
~~~

### Pitfall production
- **Key mutable (có thể thay đổi):** dùng object có field thay đổi làm key {{HashMap}} rồi sửa field đó sau {{put}} → {{hashCode}} đổi, entry "mất tích" (không {{get}} được, cũng khó {{remove}}), gây leak logic. Chỉ dùng key **immutable** (bất biến) như {{String}}, {{Integer}}, {{record}} với component immutable.
- **{{hashCode}} trả hằng số:** vẫn đúng contract nhưng mọi key rơi vào 1 bucket → tra cứu thành O(n), hiệu năng sập với dữ liệu lớn.
- **Dùng sai field:** {{equals}} so sánh {{id}} nhưng {{hashCode}} lại dùng {{name}} → hai key cùng {{id}} (equals true) có thể hash khác.

### Trả lời mẫu khi phỏng vấn
"Equals và hashCode là cặp hợp đồng bắt buộc phải đúng khi dùng HashMap hay HashSet. Equals quyết định hai object có bằng nhau về mặt nghiệp vụ không, còn hashCode trả về số nguyên để HashMap tính bucket - nói đơn giản là chọn ngăn để tra cứu nhanh. Quy tắc quan trọng nhất: nếu hai object equals bằng true thì hashCode của chúng phải bằng nhau, vì HashMap tìm theo hashCode trước rồi mới gọi equals trong bucket. Nếu tôi override equals mà quên hashCode, hai key bằng nhau có thể rơi vào hai bucket khác, nên contains trả false dù phần tử đang có trong map - tôi từng gặp lỗi kiểu người dùng bị đăng xuất ngẫu nhiên vì token hợp lệ không tìm thấy trong set. Cách an toàn nhất là dùng record để Java tự sinh cả hai, hoặc dùng Objects.hash trên đúng các field tham gia equals. Một lưu ý nữa: key đưa vào HashMap phải immutable, nếu sửa field làm hashCode đổi thì entry sẽ bị mất tích."

> Senior tip: với JPA entity, đừng dùng id tự sinh ({{@GeneratedValue}}) trong {{hashCode}} vì id là {{null}} trước khi persist - hashCode đổi sau khi lưu làm entity "lạc" khỏi {{HashSet}}. Dùng business key ổn định, hoặc trả hằng số theo class (chấp nhận va chạm nhiều hơn để đổi lấy tính đúng). Luôn viết test: {{add}} rồi {{contains(new SameKey(...))}} phải {{true}}.`,
  follow: [
    'Vì sao {{hashCode}} trả về hằng số vẫn đúng contract nhưng là ý tưởng tồi?',
    'Implement {{equals}} cho class có kế thừa thế nào để không phá tính đối xứng?'
  ],
  tags: ['equals', 'hashCode', 'HashMap']
},
{
  id: 'core-002',
  topic: 'core',
  level: 'mid',
  q: 'Vì sao {{String}} là immutable và final? String pool hoạt động thế nào, {{intern()}} dùng khi nào?',
  a: `**Tóm tắt:** {{String}} bất biến vì an toàn (thread, bảo mật, làm key), còn pool là vùng nhớ chia sẻ các literal giống nhau để tiết kiệm heap; {{intern()}} đưa chuỗi runtime về pool và trả về instance chuẩn.

### Bên trong String
- Class khai báo {{public final class String}}, nên không thể kế thừa để phá tính bất biến.
- Từ Java 9, dữ liệu nằm trong {{private final byte[] value}} kèm {{byte coder}} (Compact Strings): chuỗi Latin-1 dùng 1 byte/ký tự, chuỗi có ký tự ngoài Latin-1 dùng UTF-16. Trước Java 9 là {{char[]}}.
- Mọi "thay đổi" như {{concat}}, {{substring}}, {{replace}} đều tạo object mới. Không có setter, không expose mảng bên trong.

### Vì sao phải bất biến
- **Thread-safe miễn phí**: nhiều thread đọc cùng object mà không cần lock, vì trạng thái không đổi.
- **An toàn khi làm key**: {{hashCode}} được cache trong field {{hash}} (tính lần đầu), nếu chuỗi đổi thì entry trong {{HashMap}} sẽ mất tích.
- **Bảo mật**: đường dẫn file, URL, tên class, câu SQL được truyền vào API nhạy cảm; nếu bên nhận giữ tham chiếu mà nội dung bị sửa sau khi kiểm tra (TOCTOU) thì lỗ hổng xuất hiện.
- **Chia sẻ và tối ưu**: pool, substring cũ không còn chia sẻ mảng (từ Java 7u6 đổi để tránh leak), JIT tối ưu tốt hơn.

### String pool
- Literal {{"hello"}} được resolve lúc load class và đưa vào **string pool** (từ Java 7 nằm trên heap, không phải PermGen).
- {{new String("hello")}} tạo object mới trên heap; literal bên trong vẫn lấy từ pool.
- {{==}} so sánh reference, {{equals}} so sánh nội dung.
- {{intern()}} tra pool: nếu có chuỗi bằng nội dung thì trả về instance trong pool, nếu chưa có thì thêm vào và trả về chính nó. Từ Java 7, chuỗi không còn trong pool cũng có thể được thu gom khi không còn ai tham chiếu.

~~~java
String a = "hello";                  // pool
String b = new String("hello");      // heap, khác reference
System.out.println(a == b);          // false
System.out.println(a == b.intern()); // true
String c = ("hel" + "lo");           // compile-time constant => pool
System.out.println(a == c);          // true
~~~

### Pitfall production
- Cộng chuỗi trong vòng lặp bằng {{+}} tạo hàng nghìn object trung gian; dùng {{StringBuilder}} cho vòng lặp, {{String.join}} cho tập hợp.
- Nối chuỗi trong {{toString()}} của entity trong log nóng cũng tạo rác; cân nhắc log theo tham số.
- {{intern()}} trên dữ liệu không lặp lại (ví dụ mỗi request một UUID) làm pool phình to; chỉ dùng khi biết chắc tập giá trị nhỏ và lặp nhiều.

### Bên trong String pool: một hash table cố định số bucket
String pool là một **hash table nội bộ của JVM** (StringTable), số bucket cố định lúc khởi động ({{-XX:StringTableSize}}, mặc định 65.536 từ Java 11). Mỗi lần {{intern()}} phải tính hash và duyệt chuỗi trong bucket. Đưa hàng triệu chuỗi khác nhau vào pool → mỗi bucket dài ra, {{intern()}} chậm dần, và GC phải quét bảng này. Đó là lý do {{intern()}} chỉ hợp với tập giá trị **nhỏ và lặp lại nhiều** (mã tiền tệ, mã quốc gia, tên trạng thái).
**String Deduplication** của G1 là cách khác: GC tự phát hiện các String có mảng {{byte[]}} giống nhau và cho chúng **dùng chung mảng** (object String vẫn riêng), không cần sửa code, chạy nền.

### Ví dụ đời thực
Service tổng hợp giao dịch nạp 8 triệu bản ghi vào cache, mỗi bản có các trường {{currency}}, {{status}}, {{channel}} đọc từ JSON → mỗi lần parse tạo String mới dù chỉ có vài chục giá trị khác nhau. Heap dump (Eclipse MAT) cho thấy khoảng 1,4GB là các mảng byte trùng nội dung. Team map ba trường này sang **enum** khi parse (cách tốt nhất), còn trường {{merchantCategory}} (khoảng 600 giá trị) thì {{intern()}}. Heap sau GC giảm từ 4,1GB xuống 2,5GB, Full GC hằng giờ biến mất. Một team khác thử {{intern()}} cả {{transactionId}} (duy nhất mỗi bản ghi) → StringTable phình, thời gian parse tăng 30% — phải gỡ ra.

### Trả lời mẫu khi phỏng vấn
"String bất biến vì nhiều lý do. Nó được chia sẻ rộng rãi nên bất biến giúp thread-safe mà không cần khoá. hashCode được cache, nên String làm key HashMap an toàn. Về bảo mật, đường dẫn hay câu SQL đã kiểm tra rồi không thể bị đổi nội dung sau đó. Và nhờ bất biến mới có thể chia sẻ qua string pool. Class là final để không ai kế thừa phá tính bất biến. Từ Java 9, String lưu bằng mảng byte kèm coder, chuỗi Latin-1 chỉ tốn một byte mỗi ký tự. Literal được đưa vào pool, một hash table của JVM nằm trên heap; intern trả về instance chuẩn trong pool. Tôi chỉ dùng intern cho tập giá trị nhỏ lặp nhiều; còn khi heap có nhiều chuỗi trùng, tôi ưu tiên đổi sang enum hoặc bật String Deduplication của G1 thay vì intern tràn lan."

> Senior tip: với service nhiều chuỗi trùng, bật {{-XX:+UseStringDeduplication}} (G1) và theo dõi {{-XX:+PrintStringTableStatistics}}; đừng gọi {{intern()}} tràn lan vì nó chạm một bảng có lock nội bộ.`,
  follow: [
    'Vì sao cộng chuỗi bằng {{+}} trong vòng lặp lại chậm hơn {{StringBuilder}}?',
    'Nếu {{String}} cho phép kế thừa thì những bất biến nào bị phá?',
    '{{substring()}} từ Java 7 trở đi có còn giữ mảng gốc không, vì sao thay đổi đó quan trọng?'
  ],
  tags: ['String', 'immutability', 'String pool', 'intern']
},
{
  id: 'core-003',
  topic: 'core',
  level: 'mid',
  q: 'Java luôn pass-by-value — giải thích điều này khi truyền một object reference vào method.',
  a: `**Tóm tắt:** Java copy **giá trị của tham số** khi gọi method. Với object, giá trị được copy là **reference**, nên method sửa được nội dung object nhưng không thể đổi reference của biến phía caller.

### Chuyện gì xảy ra trên stack
- Mỗi lời gọi method tạo frame mới; tham số là biến local trong frame đó.
- Với primitive, bản copy là giá trị số. Sửa trong method không ảnh hưởng caller.
- Với object, biến ở caller và biến tham số là **hai biến khác nhau** cùng trỏ tới một object trên heap. Vì vậy:
  - Gọi method trên object ({{list.add}}, {{sb.append}}) thì caller thấy thay đổi.
  - Gán lại tham số ({{param = other}}) chỉ đổi biến local, caller vẫn trỏ object cũ.

~~~java
static void reassign(StringBuilder sb) {
    sb = new StringBuilder("moi");     // chỉ đổi biến local
}
static void mutate(StringBuilder sb) {
    sb.append(" them");                // sửa object dùng chung
}

StringBuilder x = new StringBuilder("goc");
reassign(x);
System.out.println(x);                 // goc
mutate(x);
System.out.println(x);                 // goc them
~~~

### Hệ quả khi phỏng vấn
- Không có "pass-by-reference" kiểu C++ trong Java. Không thể viết {{swap(a, b)}} đổi được biến của caller.
- Muốn trả nhiều giá trị: trả object/record, dùng mảng một phần tử, hoặc {{AtomicReference}} (nhưng thường record là rõ ràng nhất).
- Truyền mảng cũng là truyền reference: method sửa phần tử thì caller thấy, gán mảng mới thì không.
- Khi API nhận collection/array/ngày tháng mutable, hãy **defensive copy** ở biên nếu muốn giữ bất biến; nếu không, caller có thể sửa dữ liệu sau khi bạn validate.

### Liên hệ với immutability
- Vì reference được copy chứ không phải object, việc "truyền object vào method" không tạo bản sao. Đây là lý do các class như {{String}}, {{LocalDate}}, record nên bất biến: chia sẻ an toàn mà không cần copy.
- Ngược lại, chia sẻ {{Date}}, {{ArrayList}} giữa các tầng dễ sinh bug "dữ liệu tự đổi" rất khó truy.

### Bên trong: JVM truyền tham số thế nào
Khi gọi method, JVM tạo **frame mới** trên stack của thread, và các tham số được **sao chép** vào mảng biến local của frame đó (bytecode {{aload}}/{{iload}} đọc từ đây). Với object, thứ được sao chép là **reference** — một con trỏ tới object trên heap (với compressed oops là 4 byte). Hai frame có hai biến khác nhau giữ cùng một con trỏ. Vì vậy:
- {{param.setX()}} đi theo con trỏ tới object trên heap → caller thấy.
- {{param = new X()}} chỉ ghi đè ô biến local trong frame mới → frame của caller không bị chạm tới.
Đây là lý do Java không thể có {{swap(a, b)}} như C++ (truyền tham chiếu tới chính biến), và vì sao lambda chỉ được bắt biến **effectively final**: lambda nhận bản sao giá trị, nên nếu biến gốc đổi về sau, hai bên sẽ lệch nhau.

### Ví dụ đời thực
Một service tính khuyến mãi có hàm {{applyRules(List<Item> items)}} — một dev "lọc" bằng {{items.removeIf(...)}} ngay trong hàm vì nghĩ đang làm việc trên bản sao. Danh sách gốc của giỏ hàng (do controller giữ để tính tổng tiền sau đó) bị mất các món không được khuyến mãi → hoá đơn thiếu tiền ở khoảng 0,7% đơn trong một ngày trước khi đối soát phát hiện. Sửa: hàm nhận dữ liệu và trả về **danh sách mới** ({{items.stream().filter(...).toList()}}), các DTO giỏ hàng chuyển sang record với {{List.copyOf}} trong constructor. Code review thêm quy tắc: không sửa collection nhận từ tham số trừ khi tên hàm nói rõ điều đó.

### Trả lời mẫu khi phỏng vấn
"Java luôn truyền theo giá trị. Khi gọi method, JVM tạo một frame mới và sao chép giá trị tham số vào biến local của frame đó. Với kiểu nguyên thuỷ thì sao chép con số. Với object thì giá trị được sao chép là reference, tức con trỏ tới object trên heap. Nên nếu method gọi phương thức làm thay đổi object, như add vào list, thì caller thấy vì cả hai trỏ cùng một object. Nhưng nếu method gán tham số sang object khác, chỉ biến local thay đổi, biến của caller vẫn trỏ object cũ. Hệ quả thực tế là phải cẩn thận khi nhận collection hay object mutable: tôi không sửa collection của caller, và ở biên của class tôi dùng List.copyOf hoặc record bất biến để tránh lỗi dữ liệu tự đổi."

> Senior tip: khi review code, thấy method public nhận {{List}} rồi lưu thẳng vào field là dấu hiệu cần {{List.copyOf}}; còn thấy {{param = ...}} trong method thì gần như chắc chắn là bug do hiểu sai pass-by-value.`,
  follow: [
    'Viết method {{swap}} cho hai {{Integer}} — vì sao không thể?',
    'Truyền {{List}} vào method rồi {{list = new ArrayList<>()}} có ảnh hưởng caller không?',
    'Defensive copy nên đặt ở constructor hay getter, hay cả hai?'
  ],
  tags: ['pass-by-value', 'reference', 'method']
},
{
  id: 'core-004',
  topic: 'core',
  level: 'senior',
  q: 'Thiết kế exception hierarchy cho một service Spring thế nào? Checked hay unchecked, khi nào wrap, và làm sao tránh nuốt lỗi?',
  a: `**Tóm tắt:** dùng một base **unchecked** {{BusinessException}} mang {{errorCode}} cho lỗi nghiệp vụ, để nguyên các RuntimeException của framework, wrap lỗi hạ tầng kèm {{cause}}, và map ra HTTP ở một chỗ duy nhất ({{@RestControllerAdvice}}).

### Checked vs unchecked
- **Checked** (extends {{Exception}}): compiler bắt handle. Phù hợp với điều kiện **có thể phục hồi** mà caller bắt buộc phải quyết định, ví dụ {{IOException}} khi đọc file, {{InterruptedException}}. Nhược điểm: làm bẩn signature, khó dùng trong lambda/stream, dễ sinh {{catch (Exception e)}} rỗng.
- **Unchecked** (extends {{RuntimeException}}): lỗi lập trình hoặc lỗi nghiệp vụ không phục hồi tại chỗ. Đa số service hiện đại chọn unchecked để giữ API sạch; lỗi được xử lý tập trung ở tầng web.
- **Error** ({{OutOfMemoryError}}, {{StackOverflowError}}): không bắt, không khai báo; JVM ở trạng thái không đáng tin.

### Một hierarchy gợi ý
~~~java
public class BusinessException extends RuntimeException {
    private final String code;                 // "ORDER_NOT_FOUND"
    public BusinessException(String code, String msg, Throwable cause) {
        super(msg, cause);                     // luôn giữ cause
        this.code = code;
    }
    public String getCode() { return code; }
}

public class NotFoundException extends BusinessException {
    public NotFoundException(String code, String msg) { super(code, msg, null); }
}
~~~

- Tầng domain ném {{NotFoundException("ORDER_NOT_FOUND", ...)}}; tầng web map code sang 404, 409, 422.
- Không để lộ stack trace hay tên bảng/DB ra response; log đầy đủ ở server, trả message an toàn cho client.
- Lỗi validation nên gom nhiều field (danh sách lỗi), không ném từng cái.

### Khi nào wrap
- Wrap khi thêm **ngữ cảnh nghiệp vụ** hoặc đổi loại lỗi cho tầng trên: bắt {{SQLException}} rồi {{throw new RepositoryException(msg, e)}} để giữ cause và thêm ngữ cảnh.
- Không wrap nếu không thêm thông tin — chỉ làm stack dài và khó đọc.
- Luôn truyền {{cause}}; đừng {{throw new RuntimeException(e.getMessage())}} vì mất stack gốc.
- Tránh **log rồi ném lại**: một lỗi bị log ở 3 tầng gây nhiễu và tăng chi phí. Chọn một nơi log (advice hoặc consumer boundary).

### Nuốt lỗi và try-with-resources
- {{catch (Exception e)}} rồi không làm gì là anti-pattern; tối thiểu phải log kèm context và quyết định rõ (bỏ qua, retry, fallback).
- {{finally}} dùng để cleanup; với tài nguyên implements {{AutoCloseable}} hãy dùng try-with-resources để exception khi close được gắn vào {{getSuppressed()}} thay vì che lỗi chính.
- Trong async/CompletableFuture, lỗi nằm trong future; phải {{exceptionally}}/{{handle}} hoặc log ở {{whenComplete}}, nếu không sẽ biến mất im lặng.

### Bên trong: chi phí của exception
Tạo exception tốn kém chủ yếu ở bước **{{fillInStackTrace()}}** — JVM duyệt toàn bộ stack (thường 100–200 frame trong ứng dụng Spring) để ghi lại vết. Ném và bắt thì rẻ hơn nhiều. Vì vậy:
- Dùng exception cho luồng **bất thường**, không dùng làm điều khiển luồng chính (ví dụ ném {{NotFoundException}} cho mỗi lần cache miss trong vòng lặp nóng).
- Với lỗi nghiệp vụ xảy ra với tần suất rất cao và không cần stack trace, có thể dùng constructor {{RuntimeException(msg, cause, enableSuppression, writableStackTrace=false)}} — nhưng chỉ khi đã đo và thật sự cần.
- Spring {{@Transactional}} mặc định **rollback với unchecked**, **không rollback với checked** — một lý do thực tế để lỗi nghiệp vụ là unchecked, hoặc khai báo {{rollbackFor}} rõ ràng.

### Ví dụ đời thực
Một service đặt lịch trả về lỗi 500 "Internal Server Error" cho mọi trường hợp — kể cả "slot đã có người đặt" — vì {{SlotTakenException extends Exception}} (checked) bị bọc lại thành {{RuntimeException(e.getMessage())}} ở 4 tầng. Hậu quả: app mobile không phân biệt được lỗi để hiển thị, log mất stack gốc, và transaction không rollback ở một nhánh (checked exception) nên để lại bản ghi "giữ chỗ" mồ côi khoảng 300 bản/ngày. Thiết kế lại: {{BusinessException}} unchecked có {{code}}, một {{@RestControllerAdvice}} map sang 409/422 với ProblemDetail, log một lần ở advice kèm traceId. Lỗi 500 giảm 85% (phần còn lại là lỗi thật), bản ghi mồ côi về 0.

### Trả lời mẫu khi phỏng vấn
"Trong service Spring tôi dùng một base exception unchecked, ví dụ BusinessException mang một error code ổn định, cho lỗi nghiệp vụ như không tìm thấy hay xung đột. Lý do chọn unchecked là signature gọn, dùng được trong lambda, và Spring mặc định rollback transaction với unchecked. Lỗi hạ tầng như SQLException thì tôi wrap khi thêm được ngữ cảnh, luôn giữ cause. Toàn bộ việc map sang HTTP nằm ở một @RestControllerAdvice duy nhất, trả ProblemDetail với code, không lộ stack trace hay tên bảng. Để tránh nuốt lỗi, tôi cấm catch rỗng, chỉ log một lần ở biên kèm traceId thay vì log rồi ném lại ở mọi tầng, và với CompletableFuture thì luôn xử lý lỗi bằng handle hoặc exceptionally."

> Senior tip: đặt {{errorCode}} ổn định trong enum/constant và đừng đổi nghĩa của code cũ; client/monitoring thường parse code này. Với lỗi 5xx, log kèm correlation id và đừng log toàn bộ payload nếu có dữ liệu cá nhân.`,
  follow: [
    'Vì sao lỗi {{InterruptedException}} phải gọi {{Thread.currentThread().interrupt()}} khi bắt?',
    '{{@Transactional}} rollback mặc định với checked và unchecked khác nhau thế nào?',
    'Làm sao giữ {{cause}} mà không lộ thông tin nội bộ ra response?'
  ],
  tags: ['exception', 'checked', 'RuntimeException', 'error handling'],
  refs: [
    { type: 'doc', title: 'Java Language Specification', url: 'https://docs.oracle.com/javase/specs/' }
  ]
},
{
  id: 'core-005',
  topic: 'core',
  level: 'senior',
  q: 'Phân biệt {{final}}, {{finally}}, {{finalize}}. Vì sao {{finalize}} bị deprecate và {{Cleaner}}/try-with-resources thay thế ra sao?',
  a: `**Tóm tắt:** {{final}} là modifier (không đổi tham chiếu/không override/không kế thừa), {{finally}} là block luôn chạy khi thoát try, còn {{finalize}} là hook GC đã bị deprecate vì không đảm bảo thời điểm, chạy chậm và nguy hiểm; thay bằng try-with-resources hoặc {{Cleaner}}.

### final
- **Biến/field**: gán một lần, không đổi reference. Với object, nội dung vẫn mutable ({{final List}} vẫn {{add}} được).
- **Method**: không cho override.
- **Class**: không cho kế thừa ({{String}}, {{Integer}}).
- Ý nghĩa quan trọng với **memory model**: field {{final}} được "freeze" sau constructor, nên thread khác đọc thấy giá trị đúng nếu object được publish an toàn. Đây là nền tảng của immutable object.
- {{final}} local dùng được trong lambda/anonymous class (effectively final cũng vậy).

### finally
- Chạy khi try thoát bình thường, khi có exception, khi {{return}}, {{break}}, {{continue}}.
- **Không chạy** khi JVM chết: {{System.exit}}, {{Runtime.halt}}, crash native, kill -9.
- {{return}} trong {{finally}} **che** exception/return trước đó — cực kỳ nguy hiểm, tránh tuyệt đối.

### finalize
- Được gọi bởi GC **trước khi** thu hồi, không đảm bảo thời điểm, có thể không bao giờ gọi, và chạy trên finalizer thread đơn luồng nên dễ nghẽn.
- Có thể **hồi sinh** object bằng cách gán {{this}} vào static field — phá vỡ giả định về vòng đời.
- Không ném được exception hữu ích; exception bị nuốt.
- Từ Java 18, finalization **deprecated for removal** (JEP 421) và có thể tắt bằng {{--finalization=disabled}}; từ Java 9 đã có {{Cleaner}} chính thức.
- Vì sao vẫn còn: tương thích ngược với code cũ và một số thư viện native.

### Thay thế
- **try-with-resources**: cách chuẩn cho mọi tài nguyên {{AutoCloseable}} (file, socket, JDBC). Close theo thứ tự ngược, exception khi close vào {{getSuppressed()}}.
- **Cleaner** ({{java.lang.ref.Cleaner}}): đăng ký một action chạy khi object bị phantom-reachable; dùng cho tài nguyên native không có API close, nhưng vẫn **không đảm bảo** thời điểm — chỉ là lưới an toàn.
- Với {{ByteBuffer}} trực tiếp, dùng {{Cleaner}} nội bộ của JDK hoặc cố gắng tái sử dụng buffer.

~~~java
try (var in = Files.newInputStream(path);
     var out = Files.newOutputStream(dest)) {
    in.transferTo(out);                  // close tự động, kể cả khi lỗi
}
~~~

### Bên trong: vì sao finalize làm chậm GC
Object có {{finalize()}} không tầm thường được JVM đăng ký ngay lúc **tạo** (một {{Finalizer}} reference). Khi object không còn ai tham chiếu, GC **không thu hồi ngay** mà đưa nó vào hàng đợi; một **thread finalizer duy nhất** gọi {{finalize()}} lần lượt; chỉ sau lần GC **tiếp theo** bộ nhớ mới được giải phóng. Hệ quả: object sống qua ít nhất hai chu kỳ GC, thường bị đẩy lên Old Gen; nếu {{finalize()}} chậm (đóng socket, ghi log) thì hàng đợi dài ra và heap đầy dần dù "không còn ai dùng".
{{Cleaner}} dùng **PhantomReference**: object không thể bị "hồi sinh", action chạy trên thread của Cleaner và **không được** tham chiếu tới chính object (nếu không object không bao giờ trở nên unreachable).

### Ví dụ đời thực
Một service xử lý ảnh dùng thư viện cũ bọc bộ nhớ native, giải phóng trong {{finalize()}}. Dưới tải cao, RSS của container tăng đều tới khi bị OOMKilled sau khoảng 6 giờ, trong khi heap Java chỉ 40%. Heap dump cho thấy hơn 200.000 object nằm trong hàng đợi {{java.lang.ref.Finalizer}} — thread finalizer không theo kịp. Sửa: bọc tài nguyên bằng {{AutoCloseable}}, dùng try-with-resources ở mọi chỗ gọi, giữ {{Cleaner}} làm lưới an toàn và ghi cảnh báo nếu Cleaner phải chạy (nghĩa là có chỗ quên close). Bộ nhớ native ổn định, không còn OOMKilled; log cảnh báo chỉ ra thêm 2 chỗ quên close.

### Trả lời mẫu khi phỏng vấn
"final là modifier: biến chỉ gán một lần, method không override được, class không kế thừa được; field final còn có đảm bảo của memory model là thread khác thấy giá trị đúng sau constructor. finally là block luôn chạy khi thoát try, trừ khi JVM chết, và tuyệt đối không return trong finally vì nó che exception. finalize là hook của GC, đã deprecated for removal từ Java 18. Nó tệ vì không đảm bảo thời điểm chạy, chạy trên một thread finalizer duy nhất nên dễ nghẽn, object phải sống qua ít nhất hai chu kỳ GC, và còn có thể bị hồi sinh. Thay thế chuẩn là AutoCloseable với try-with-resources để đóng tài nguyên một cách xác định; Cleaner chỉ dùng làm lưới an toàn cho tài nguyên native, và tôi thường cho nó log cảnh báo để phát hiện chỗ quên close."

> Senior tip: đừng bao giờ đặt logic nghiệp vụ quan trọng trong {{finalize}}. Nếu thấy {{finalize}} trong codebase cũ, hãy thay bằng {{AutoCloseable}} + try-with-resources trước, chỉ giữ {{Cleaner}} cho native resource.`,
  follow: [
    'Vì sao {{return}} trong {{finally}} có thể nuốt exception?',
    '{{final}} field giúp gì cho việc publish object an toàn giữa các thread?',
    '{{Cleaner}} khác {{finalize}} ở điểm nào và vẫn còn hạn chế gì?'
  ],
  tags: ['final', 'finally', 'finalize', 'Cleaner', 'try-with-resources'],
  refs: [
    { type: 'doc', title: 'Java Language Specification', url: 'https://docs.oracle.com/javase/specs/' }
  ]
},
{
  id: 'core-006',
  topic: 'core',
  level: 'senior',
  q: 'Generics bị type erasure ảnh hưởng thế nào? Giải thích wildcard và quy tắc PECS với {{? extends}} / {{? super}}.',
  a: `**Tóm tắt:** generic chỉ được kiểm tra lúc compile rồi **xoá** (erasure) khỏi bytecode; wildcard dùng để tăng tính linh hoạt, và PECS: **Producer Extends, Consumer Super** — đọc ra thì {{? extends T}}, ghi vào thì {{? super T}}.

### Type erasure
- {{List<String>}} và {{List<Integer>}} cùng là {{List}} trong bytecode; không có {{new T()}}, không {{instanceof T}}, không mảng {{new T[]}}, không overload chỉ khác type parameter.
- Compiler chèn **cast** và **bridge method** để giữ tính đa hình. Ví dụ {{Comparable}} có {{compareTo(Object)}} bridge gọi {{compareTo(MyType)}}.
- Hệ quả: không thể kiểm tra generic runtime; {{List<String>}} bị "heap pollution" nếu nhét sai qua raw type. {{@SafeVarargs}} chỉ là cam kết của lập trình viên.
- Generic type không có mặt trong reflection đầy đủ, nhưng **vẫn còn** trong metadata ({{getGenericSuperclass}}, {{ParameterizedType}}) nếu khai báo ở class/field/method. Jackson lợi dụng điều này qua {{TypeReference}}.

### Tại sao cần wildcard
- Generic là **invariant**: {{List<Integer>}} **không phải** subtype của {{List<Number>}}, dù {{Integer}} là subtype của {{Number}}. Nếu cho phép, ta có thể {{add(3.14)}} vào list Integer.
- Wildcard mở rộng theo một chiều an toàn:

~~~java
Number sum(List<? extends Number> src) {   // producer: đọc được Number
    double s = 0;
    for (Number n : src) s += n.doubleValue();
    return s;
}
void addInts(List<? super Integer> dst) {  // consumer: ghi được Integer
    dst.add(1);
}
~~~

- {{? extends T}}: chỉ đọc ra {{T}}, **không** ghi (trừ {{null}}) vì compiler không biết subtype cụ thể.
- {{? super T}}: ghi được {{T}}, đọc ra chỉ {{Object}}.
- {{?}} = {{? extends Object}}, đọc được Object, không ghi.

### PECS áp dụng
- {{Collections.copy(List<? super T> dest, List<? extends T> src)}} là ví dụ kinh điển.
- API nhận collection chỉ để đọc: dùng {{Collection<? extends T>}} để nhận cả {{List<Sub>}}.
- API chỉ ghi: {{Consumer<? super T>}}.
- Trả về thì dùng type cụ thể, không dùng wildcard (trừ khi che giấu implementation).
- {{Comparable<? super T>}} cho phép so sánh với supertype.

### Pitfall
- Raw type ({{List}} không tham số) tắt kiểm tra compile, sinh warning và có thể nổ {{ClassCastException}} ở chỗ khác.
- Không thể tạo mảng generic: {{new List<String>[10]}} sai; dùng {{List<List<String>>}} hoặc {{Array.newInstance}} + cast có kiểm soát.
- {{List<Object>}} không nhận {{List<String>}}; {{List<?>}} thì nhận nhưng không add được.

### Bên trong: compiler làm gì với generic
Với {{List<String> list; String s = list.get(0);}}, bytecode thực chất là {{(String) list.get(0)}} — method {{get}} trả về {{Object}}, compiler chèn **checkcast**. Với class {{class Money implements Comparable<Money>}}, compiler sinh thêm **bridge method** {{compareTo(Object)}} gọi sang {{compareTo(Money)}} để đa hình vẫn đúng sau khi xoá kiểu. Thông tin generic **còn lại trong metadata** của khai báo (field, method, superclass) — đó là cách Jackson (một anonymous subclass của {{TypeReference<List<Order>>}}), Spring ({{ResolvableType}}) và Gson đọc được kiểu phần tử: anonymous subclass "chụp" lại kiểu generic vào superclass của nó.
Vì sao Java chọn erasure: để code generic (Java 5) **chạy được cùng thư viện và JVM cũ** mà không đổi bytecode — đổi lại mất thông tin kiểu lúc runtime.

### Ví dụ đời thực
Một client HTTP nội bộ có hàm {{<T> T get(String url, Class<T> type)}}. Team gọi {{get(url, List.class)}} cho API trả danh sách đơn hàng; Jackson không biết kiểu phần tử nên tạo {{List<LinkedHashMap>}}, code chạy được đến khi ai đó gọi {{order.getAmount()}} → {{ClassCastException}} ở production, xa chỗ gây lỗi. Sửa: thêm overload nhận {{ParameterizedTypeReference<T>}} (Spring) và cấm raw type bằng cảnh báo compiler {{-Xlint:unchecked -Werror}} trong module đó. Build tìm ra thêm 11 chỗ dùng raw type cần sửa.

### Trả lời mẫu khi phỏng vấn
"Generic trong Java chỉ được kiểm tra lúc biên dịch rồi bị xoá khỏi bytecode: List of String và List of Integer đều là List khi chạy, compiler tự chèn cast khi đọc và sinh bridge method để giữ đa hình. Java chọn erasure để tương thích ngược với JVM và thư viện cũ. Hệ quả là không new T, không instanceof List of String, không tạo mảng generic, và dễ heap pollution qua raw type. Thông tin generic vẫn còn trong metadata của khai báo, nên Jackson dùng TypeReference để lấy kiểu phần tử. Generic là invariant, List of Integer không phải List of Number, nên cần wildcard theo quy tắc PECS: nguồn chỉ để đọc thì dùng extends, đích chỉ để ghi thì dùng super, như Collections.copy. Khi thiết kế API, tôi dùng wildcard ở tham số đầu vào để linh hoạt, còn kiểu trả về thì cụ thể."

> Senior tip: khi thiết kế API thư viện, dùng wildcard ở **input** để người dùng truyền được nhiều loại hơn; đừng lạm dụng wildcard ở return vì làm caller phải xử lý {{?}} vô ích. Và nhớ rằng chi phí generic là 0 runtime — chỉ có bridge method và cast nhỏ.`,
  follow: [
    'Vì sao không thể {{new T[]}} hay {{new List<String>[10]}}?',
    'Bridge method sinh ra để làm gì và ảnh hưởng reflection thế nào?',
    'Khi nào dùng {{List<?>}} thay vì {{List<Object>}}?'
  ],
  tags: ['generics', 'type erasure', 'wildcard', 'PECS'],
  refs: [
    { type: 'doc', title: 'Java Language Specification', url: 'https://docs.oracle.com/javase/specs/' }
  ]
},
{
  id: 'core-007',
  topic: 'core',
  level: 'mid',
  q: 'Thiết kế một immutable class thế nào cho đúng? Defensive copy đặt ở đâu và vì sao?',
  a: `**Tóm tắt:** class {{final}}, mọi field {{private final}}, không setter, **copy** mọi tham số mutable trong constructor và copy lại khi trả ra ngoài; không để {{this}} rò rỉ trong constructor.

### Các bước thiết kế
1. Khai báo {{final class}} (hoặc dùng static factory + constructor private) để không bị subclass phá bất biến.
2. Field {{private final}}; không có method thay đổi trạng thái.
3. Trong constructor, **validate** rồi **defensive copy** mọi tham số mutable ({{Date}}, {{List}}, {{Map}}, mảng).
4. Getter trả về bản copy hoặc view bất biến, không trả reference nội bộ.
5. Cẩn thận với **leaking this**: không gọi method override được, không đăng ký listener, không đưa {{this}} ra ngoài trước khi constructor xong.
6. {{equals}}/{{hashCode}} dựa trên field bất biến; {{toString}} không lộ dữ liệu nhạy cảm.

~~~java
public final class Period {
    private final LocalDate start;      // LocalDate immutable, không cần copy
    private final List<String> tags;    // List mutable, phải copy

    public Period(LocalDate start, List<String> tags) {
        this.start = Objects.requireNonNull(start);
        this.tags = List.copyOf(tags);  // copy + null-hostile + immutable
    }
    public List<String> tags() { return tags; }   // an toàn vì đã bất biến
}
~~~

### Defensive copy ở đâu
- **Constructor**: bắt buộc nếu tham số mutable và bạn muốn giữ bất biến. Nếu không, caller giữ reference và sửa sau khi object tạo xong.
- **Getter**: nếu field vẫn mutable (ví dụ {{Date}}), phải trả {{new Date(value.getTime())}}; nếu đã dùng {{List.copyOf}}/{{Collections.unmodifiableList}} thì không cần copy thêm.
- {{Collections.unmodifiableList}} chỉ là **view**: nếu list gốc bị sửa, view vẫn thay đổi. {{List.copyOf}} tạo bản sao thật và bất biến, an toàn hơn cho giá trị.
- Mảng luôn phải copy vì {{clone()}} của mảng trả bản mới nhưng getter trả thẳng mảng là hở.

### Vì sao đáng làm
- Thread-safe không cần lock; dùng làm key trong map an toàn; dễ cache và chia sẻ.
- Ít bug "dữ liệu tự đổi" khi object đi qua nhiều tầng.
- Record giúp giảm boilerplate nhưng **không tự copy** component mutable; vẫn phải viết compact constructor gọi {{List.copyOf}}.

### Pitfall
- Quên copy trong constructor nhưng copy trong getter: vẫn bị lộ nếu có method nội bộ dùng list gốc — và tốn copy mỗi lần đọc.
- Dùng {{List.of(...)}} với phần tử null sẽ ném NPE; kiểm tra dữ liệu đầu vào trước.
- Class "gần bất biến" có field mutable lộ ra qua getter là nguyên nhân phổ biến của race condition khó tái hiện.

### Bên trong: vì sao field final quan trọng với nhiều thread
Java Memory Model có quy tắc đặc biệt cho field {{final}}: sau khi constructor kết thúc, mọi thread nhìn thấy reference tới object đều **thấy đúng giá trị** của các field final (và những gì chúng trỏ tới tại thời điểm đó), kể cả khi object được chia sẻ qua một biến không {{volatile}}. Không có {{final}}, JIT và CPU được phép sắp xếp lại lệnh, và thread khác có thể thấy object "nửa khởi tạo" (field còn null/0). Đó là lý do bất biến thật sự cần **cả** {{final}} lẫn không để {{this}} thoát ra trong constructor — nếu {{this}} bị publish trước khi constructor xong, đảm bảo trên mất hiệu lực.

### Ví dụ đời thực
Một service cấu hình phí giữ object {{FeeSchedule}} trong cache dùng chung; class có getter {{getTiers()}} trả thẳng {{ArrayList}} nội bộ. Một job báo cáo gọi {{getTiers().sort(...)}} để in theo thứ tự khác → thứ tự bậc phí trong cache bị đổi, API tính phí chọn sai bậc cho khoảng 2% giao dịch trong 40 phút cho tới khi cache được làm mới. Sửa: {{FeeSchedule}} thành record với compact constructor gọi {{List.copyOf}}, sắp xếp sẵn trong constructor; job báo cáo tự tạo bản sao khi cần thứ tự khác. Thêm test: gọi getter rồi thử {{add}} phải ném {{UnsupportedOperationException}}.

### Trả lời mẫu khi phỏng vấn
"Để thiết kế immutable class, tôi khai báo class final hoặc constructor private kèm factory, mọi field private final, không có setter. Trong constructor, tôi validate rồi defensive copy mọi tham số mutable, ví dụ List.copyOf, để caller giữ reference cũng không sửa được. Getter trả về giá trị đã bất biến, hoặc bản sao nếu field buộc phải mutable như Date. Tôi tránh để this thoát ra trong constructor, vì field final có đảm bảo của memory model là thread khác luôn thấy giá trị đã khởi tạo, nhưng đảm bảo đó mất nếu object bị publish sớm. Lưu ý unmodifiableList chỉ là view, list gốc đổi thì view đổi theo, còn copyOf là bản sao thật. Với record, tôi vẫn phải tự copy trong compact constructor vì record không tự làm việc đó."

> Senior tip: với DTO/record nhận từ request, hãy copy ngay ở biên (controller/service) để phần còn lại của hệ thống làm việc với dữ liệu bất biến; đừng tin rằng caller không sửa.`,
  follow: [
    '{{Collections.unmodifiableList}} khác {{List.copyOf}} ở điểm nào?',
    'Record có tự bảo vệ khỏi component mutable không?',
    'Leaking {{this}} trong constructor gây ra vấn đề gì với đa hình?'
  ],
  tags: ['immutable', 'defensive copy', 'List.copyOf']
},
{
  id: 'core-008',
  topic: 'core',
  level: 'senior',
  q: 'Phân biệt static nested class và inner class. Vì sao inner class dễ gây memory leak?',
  a: `**Tóm tắt:** static nested class **không** giữ reference tới instance outer; inner (non-static) giữ ngầm {{this$0}} nên object inner sống thì outer cũng sống. Vì vậy mặc định hãy dùng static nested, chỉ dùng inner khi thật sự cần truy cập trạng thái outer.

### Khác biệt cơ bản
- **Static nested**: khai báo {{static class Foo}} trong outer. Không cần instance outer, không có {{this$0}}, dùng như class top-level (chỉ khác phạm vi tên).
- **Inner (non-static)**: mỗi instance gắn với một instance outer; compiler sinh field {{final Outer this$0}} và constructor nhận outer. Có thể gọi trực tiếp field/method của outer.
- **Local class**: khai báo trong method, cũng giữ reference tới outer và capture biến local effectively final.
- **Anonymous class**: như local, giữ outer và biến capture; thường thấy trong listener/callback.

~~~java
public class Service {
    private final Repo repo;

    static class CacheKey {            // không giữ Service
        final String id;
        CacheKey(String id) { this.id = id; }
    }

    class Worker {                     // giữ ngầm Service.this
        void run() { repo.find(); }
    }
}
~~~

### Vì sao leak
- Đăng ký inner listener/callback vào một registry sống lâu (static list, singleton, thread pool, event bus). Registry giữ inner, inner giữ outer, nên **cả object service** không được thu gom dù nghiệp vụ đã xong.
- Trong ứng dụng desktop/Android, inner class giữ Activity/Context là leak kinh điển; trong backend, inner task giữ cả service lớn kèm cache, connection pool reference.
- Anonymous class trong {{ThreadLocal}} hoặc scheduled task cũng giữ outer theo cách tương tự.
- Ngoài ra, inner class làm object outer không thể GC dù chỉ còn callback nhỏ; kích thước thực tế bị giữ có thể rất lớn.

### Cách tránh
- Mặc định {{static}} cho nested class; truyền dependency cần thiết qua constructor thay vì truy cập {{Outer.this}}.
- Với listener, giữ reference và **unregister** trong {{close()}}/{{@PreDestroy}}; hoặc dùng {{WeakReference}} cho callback ngắn hạn.
- Với task định kỳ, dùng static nested + tham số, tránh capture {{this}} ngoài ý muốn.
- Kiểm tra bằng heap dump (Eclipse MAT) tìm {{this$0}} trỏ ngược bất thường.

### Khi nào dùng inner
- Khi object con thực sự là một phần vòng đời của outer và cần truy cập trạng thái private của outer, ví dụ {{Iterator}} của collection ({{ArrayList.Itr}} là inner, truy cập {{elementData}} và {{modCount}}).
- Khi muốn API {{outer.new Inner()}} thể hiện quan hệ chặt. Còn lại, static nested rõ ràng và an toàn hơn.

### Bên trong: compiler sinh ra gì cho inner class
Với {{class Worker}} không static bên trong {{Service}}, javac sinh class {{Service$Worker}} có field {{final Service this$0}} và constructor ẩn nhận {{Service}} làm tham số đầu tiên; {{new Worker()}} bên trong Service thực chất là {{new Service$Worker(this)}}. Lambda thì khác: lambda **chỉ** bắt {{this}} khi thân lambda dùng tới field/method của instance — lambda không dùng gì của outer không giữ outer. Anonymous class thì **luôn** giữ outer nếu được tạo trong ngữ cảnh instance, kể cả khi không dùng tới (trước Java 18; từ JDK 18 javac bỏ được tham chiếu outer không dùng tới cho một số trường hợp, nhưng không nên dựa vào).

### Ví dụ đời thực
Một service xuất báo cáo tạo một anonymous {{TimerTask}} để dọn file tạm, đăng ký vào một {{Timer}} static dùng chung, nhưng không bao giờ cancel. Mỗi lần tạo báo cáo, một instance {{ReportJob}} (kèm buffer dữ liệu khoảng 15MB) bị giữ lại qua {{this$0}}. Sau khoảng 2 ngày, heap đầy và Full GC liên tục. Heap dump (MAT, "Path to GC Roots") cho thấy chuỗi {{Timer → TaskQueue → ReportJob$1 → this$0 → ReportJob → byte[]}}. Sửa: dùng {{ScheduledExecutorService}} dùng chung, task là static nested chỉ nhận đường dẫn file, và cancel khi job kết thúc. Heap ổn định ở mức 1,2GB.

### Trả lời mẫu khi phỏng vấn
"Static nested class không gắn với instance của outer, dùng như class top-level chỉ khác phạm vi tên. Inner class thì mỗi instance giữ ngầm một reference tới outer: compiler sinh field this$0 và constructor nhận outer. Vì vậy nếu inner object, anonymous class hay callback được đưa vào một nơi sống lâu như registry static, timer hay thread pool, thì cả object outer cùng mọi thứ nó giữ không được GC thu hồi. Lambda thì chỉ bắt this khi dùng tới thành viên của instance. Quy tắc của tôi là mặc định static nested, truyền dependency qua constructor, chỉ dùng inner khi thật sự cần trạng thái outer như Iterator của collection. Với listener, luôn unregister khi đóng. Khi nghi leak, tôi xem heap dump bằng MAT, đi theo đường tới GC root để tìm this$0 trỏ ngược."

> Senior tip: trong code review, thấy {{private class X}} không dùng field/method outer là dấu hiệu nên đổi thành {{static}}; điều này cũng giảm 1 reference và giúp serialization gọn hơn.`,
  follow: [
    'Inner class được compiler sinh field gì, và field đó ảnh hưởng serialization thế nào?',
    'Làm sao phát hiện memory leak do inner class bằng heap dump?',
    'Vì sao {{Iterator}} của {{ArrayList}} lại là inner class hợp lý?'
  ],
  tags: ['nested class', 'inner class', 'memory leak', 'this$0'],
  refs: [
    { type: 'doc', title: 'Java Language Specification', url: 'https://docs.oracle.com/javase/specs/' }
  ]
},
{
  id: 'core-009',
  topic: 'core',
  level: 'senior',
  q: 'Java serialization: {{serialVersionUID}} để làm gì, rủi ro bảo mật của deserialization là gì và nên thay bằng gì?',
  a: `**Tóm tắt:** {{serialVersionUID}} là "version" của class để tránh {{InvalidClassException}} khi cấu trúc thay đổi; Java deserialization trên dữ liệu không tin cậy có thể bị **gadget chain dẫn tới RCE**, nên hiện đại ưu tiên JSON/Protobuf/Avro và nếu buộc dùng thì phải có {{ObjectInputFilter}}.

### serialVersionUID
- Nếu không khai báo, JVM tự tính từ signature class (field, method, modifier); chỉ cần thêm một field là giá trị đổi và dữ liệu cũ không đọc được.
- Khai báo tường minh {{private static final long serialVersionUID = 1L;}} để kiểm soát tương thích.
- Đổi version khi thay đổi **không tương thích** (xoá field, đổi type); thêm field mới thường tương thích và field mới nhận giá trị mặc định.
- Serialization mặc định ghi **toàn bộ object graph** theo tên class; đổi package/class name cũng làm hỏng.

### Cách hoạt động
- {{Serializable}} là marker; {{ObjectOutputStream}} ghi metadata + field không {{transient}}; {{readObject}} khôi phục **không gọi constructor** (trừ class cha không Serializable).
- {{transient}} loại field khỏi luồng; {{Externalizable}} cho phép tự kiểm soát hoàn toàn.
- {{writeReplace}}/{{readResolve}} dùng cho singleton/proxy.

### Rủi ro
- Kẻ tấn công gửi byte stream chứa chuỗi class có sẵn trên classpath (Apache Commons Collections, Spring, ROME...) tạo **gadget chain**: mỗi {{readObject}} thực thi code, cuối cùng gọi {{Runtime.exec}}. Không cần lỗi trong code của bạn.
- Deserialization xảy ra **trước** khi bạn validate dữ liệu, nên validate field không cứu được.
- Các lỗ hổng nổi tiếng (CommonsCollections, WebLogic, JBoss) đều đi qua đường này.

### Phòng thủ
- **Không nhận Java serialization qua network/HTTP**, kể cả từ service nội bộ. Dùng JSON (Jackson), Protobuf, Avro, CBOR.
- Nếu bắt buộc (RMI, session cũ), đặt {{ObjectInputFilter}} whitelist class và giới hạn độ sâu/kích thước (JEP 290, {{jdk.serialFilter}}), bật filter theo ngữ cảnh (JEP 415).
- Không dùng {{ObjectInputStream}} trên cookie/session do client kiểm soát; nếu có, ký và mã hoá.
- Với cache phân tán (Redis), đừng dùng Java serialization mặc định; dùng JSON/Protobuf để tránh cả lỗi tương thích lẫn bảo mật.

### Thay thế
- DTO record + Jackson/Protobuf rõ ràng schema, dễ version, an toàn hơn.
- Với session, lưu JSON hoặc dùng token stateless (JWT) thay vì serialize object.
- Với snapshot nội bộ, có thể dùng {{Externalizable}} nhưng vẫn cần kiểm soát nguồn.

### Bên trong: vì sao deserialization chạy được code
{{ObjectInputStream.readObject()}} đọc tên class từ luồng byte, **nạp class đó** từ classpath, tạo instance **không qua constructor**, gán field, rồi gọi các method "ma thuật" nếu class có định nghĩa: {{readObject}}, {{readResolve}}, và gián tiếp {{hashCode}}/{{equals}}/{{compareTo}} khi khôi phục {{HashMap}}, {{TreeMap}}, {{PriorityQueue}}. Kẻ tấn công không cần lỗi trong code của bạn: chỉ cần trên classpath có những class mà chuỗi lời gọi đó, với dữ liệu do họ chọn, dẫn tới {{Method.invoke}} hay {{Runtime.exec}} (**gadget chain** — công cụ như ysoserial có sẵn chuỗi cho nhiều thư viện phổ biến). Kiểm tra dữ liệu sau khi đọc xong là quá muộn.

### Ví dụ đời thực
Một hệ thống nội bộ lưu session của Spring Session vào Redis bằng serializer mặc định của JDK. Lần nâng cấp thư viện đổi cấu trúc một class trong session → toàn bộ người dùng bị đăng xuất cùng lúc vì {{InvalidClassException}}, khoảng 9.000 phiên mất trong 5 phút. Rà soát cũng phát hiện một endpoint cũ nhận {{application/x-java-serialized-object}} từ hệ thống đối tác — trên classpath có commons-collections bản cũ, đủ để tạo gadget chain. Xử lý: chuyển session sang {{GenericJackson2JsonRedisSerializer}} với danh sách kiểu cho phép, gỡ endpoint, thêm {{jdk.serialFilter}} toàn cục chỉ cho phép các package nội bộ và từ chối mặc định. Lần nâng cấp sau, session không bị mất.

### Trả lời mẫu khi phỏng vấn
"serialVersionUID là phiên bản của class khi dùng Java serialization; nếu không khai báo, JVM tự tính từ cấu trúc class, nên chỉ thêm một field là dữ liệu cũ không đọc được nữa. Vấn đề lớn hơn là bảo mật: readObject đọc tên class từ dữ liệu, nạp class, tạo object không qua constructor và gọi các method như readObject, hashCode khi dựng lại HashMap. Kẻ tấn công ghép những class sẵn có trên classpath thành gadget chain để chạy lệnh tuỳ ý, và việc validate sau khi đọc là quá muộn. Vì vậy tôi không bao giờ nhận Java serialization từ nguồn không tin cậy; tôi dùng JSON với Jackson, Protobuf hay Avro có schema rõ ràng. Hệ thống cũ bắt buộc dùng thì đặt ObjectInputFilter theo danh sách cho phép, giới hạn độ sâu và kích thước, rồi lên kế hoạch migrate, kể cả session hay cache trong Redis."

> Senior tip: nếu hệ thống cũ còn dùng Java serialization trong Redis/session, hãy coi đó là **nợ bảo mật P1**; đặt filter trước, sau đó migrate sang JSON. Đừng chỉ tăng {{serialVersionUID}} rồi yên tâm — nó không liên quan gì đến an toàn.`,
  follow: [
    'Vì sao deserialization không gọi constructor và điều đó ảnh hưởng bất biến thế nào?',
    '{{ObjectInputFilter}} whitelist nên cấu hình ở đâu trong Spring Boot?',
    'Khi nào {{transient}} là bắt buộc thay vì chỉ để tối ưu?'
  ],
  tags: ['serialization', 'serialVersionUID', 'deserialization', 'security'],
  refs: [
    { type: 'doc', title: 'Java Language Specification', url: 'https://docs.oracle.com/javase/specs/' }
  ]
},
{
  id: 'core-010',
  topic: 'core',
  level: 'senior',
  q: 'Reflection và annotation processing: chi phí ra sao, framework dùng ở đâu, và pitfall nào hay gặp trên production?',
  a: `**Tóm tắt:** reflection cho phép nhìn và gọi class lúc runtime nhưng chậm hơn lời gọi trực tiếp (lookup, kiểm tra access, boxing, khó inline); annotation processing chạy lúc **compile** và sinh code nên gần như không có chi phí runtime. Spring/Hibernate/Jackson dùng reflection, Lombok/MapStruct dùng annotation processing.

### Reflection
- API: {{Class.forName}}, {{getDeclaredFields}}, {{Method.invoke}}, {{Constructor.newInstance}}, {{setAccessible}}.
- Chi phí:
  - **Lookup** tên method/field mỗi lần gọi rất đắt; phải cache {{Method}}/{{Field}}.
  - **Access check** và boxing/unboxing cho tham số kiểu primitive.
  - **Không inline** được qua JIT như lời gọi trực tiếp; từ Java 18 core reflection được viết lại trên {{MethodHandle}} nên nhanh hơn trước, nhưng vẫn không bằng static call.
  - Khởi tạo class, load metadata, có thể tăng thời gian startup.
- {{MethodHandle}}/{{VarHandle}} là lựa chọn nhanh hơn cho hot path; {{LambdaMetafactory}} biến reflective call thành functional interface một lần.
- Reflection phá encapsulation: {{setAccessible(true)}} có thể bị chặn bởi module ({{InaccessibleObjectException}}) từ Java 9/17; cần {{--add-opens}} (thường chỉ để tương thích tạm).

### Framework dùng thế nào
- **Spring**: scan class, đọc annotation, tạo proxy (CGLIB/JDK dynamic proxy), inject field/constructor. Startup chậm nhưng runtime dùng proxy đã sinh.
- **Hibernate**: map entity qua metadata, dùng bytecode enhancement/reflect để đọc field, lazy proxy.
- **Jackson**: đọc getter/constructor/record component để serialize; cache {{BeanDescription}} để giảm chi phí.
- **JUnit/Mockito**: tạo instance, inject mock, verify lời gọi.

### Annotation processing
- Chạy trong {{javac}} qua {{Processor}}; đọc annotation và **sinh source/bytecode** (hoặc báo lỗi compile).
- **Lombok** can thiệp AST bằng internal API của javac, sinh getter/setter/constructor vào bytecode — tiện nhưng dễ vỡ khi JDK đổi và gây tranh cãi với tooling.
- **MapStruct** sinh mapper type-safe lúc compile, runtime nhanh như code tay; **Dagger** sinh DI graph.
- Chi phí runtime = 0; chi phí build tăng; cần cấu hình processor trong Maven/Gradle và đôi khi lỗi khó đọc khi generated code sai.

### Pitfall production
- Gọi {{getMethods()}}/{{getDeclaredFields()}} trong vòng lặp request mà không cache: CPU tăng vọt, GC nhiều.
- Dùng reflection để set field private của JDK: chết khi nâng JDK (strong encapsulation), native image/AOT cũng không hỗ trợ tốt.
- Reflection + {{setAccessible}} làm mất kiểm tra kiểu, lỗi chỉ nổ runtime.
- Startup chậm do scan quá rộng; cân nhắc AOT, CDS, hoặc giới hạn package scan.
- Với GraalVM native image, reflection cần khai báo cấu hình; thư viện dùng reflection động dễ fail.

### Bên trong: Method.invoke từ Java 18
Trước Java 18, {{Method.invoke}} ban đầu gọi qua JNI (chậm), sau khoảng 15 lần gọi thì JVM sinh một class bytecode "accessor" để gọi nhanh hơn ("inflation"). Từ Java 18 (JEP 416), core reflection được viết lại trên **{{MethodHandle}}**: nếu {{Method}} được giữ trong field {{static final}}, JIT có thể coi nó là hằng số và inline gần như lời gọi trực tiếp; nếu {{Method}} được tra cứu lại mỗi lần hoặc nằm trong biến thường, chi phí vẫn cao. Đó là lý do quy tắc "cache metadata, giữ trong final field" quan trọng hơn cả việc chọn reflection hay MethodHandle.
Annotation processor chạy theo **vòng (round)**: mỗi vòng xử lý file nguồn mới sinh ra ở vòng trước, cho tới khi không còn file mới — nhờ vậy MapStruct có thể sinh mapper dùng code do processor khác sinh.

### Ví dụ đời thực
Một service tự viết "mapper tổng quát" dùng reflection: mỗi lần chuyển entity sang DTO lại gọi {{getDeclaredFields()}} và {{setAccessible(true)}}. Ở 3.000 request/giây, profiler (async-profiler) cho thấy 22% CPU nằm trong reflection và việc cấp phát mảng {{Field[]}} mới mỗi lần gọi (method này trả bản sao). Thay bằng MapStruct (sinh code lúc compile): CPU giảm 18%, p99 giảm từ 140ms xuống 95ms, và lỗi mapping (field đổi tên) chuyển từ lỗi runtime thành **lỗi biên dịch**. Khi nâng lên Java 17, mapper cũ còn gãy vì {{setAccessible}} vào class JDK bị strong encapsulation chặn — thêm một lý do để bỏ.

### Trả lời mẫu khi phỏng vấn
"Reflection cho phép xem và gọi class lúc runtime, Spring, Hibernate, Jackson đều dùng nó. Chi phí nằm ở việc tra cứu method hay field, kiểm tra quyền truy cập, boxing tham số, và khó cho JIT inline. Từ Java 18 reflection chạy trên MethodHandle, nên nếu Method được cache trong field static final thì JIT tối ưu khá tốt, còn tra cứu lại mỗi lần thì vẫn đắt; getDeclaredFields còn trả về mảng mới mỗi lần gọi. Annotation processing thì chạy lúc biên dịch và sinh code, như MapStruct hay Lombok, nên gần như không tốn chi phí runtime và lỗi lộ ra sớm lúc build. Pitfall tôi hay gặp: reflection trong đường nóng không cache, setAccessible vào nội bộ JDK gãy khi nâng Java 17, và reflection động làm khó native image. Tôi chỉ dùng reflection ở tầng hạ tầng, và đo bằng profiler trước khi tối ưu."

> Senior tip: cache metadata reflection trong {{ConcurrentHashMap}} hoặc dùng {{MethodHandle}}; đo bằng JMH trước khi tối ưu. Và đừng dùng reflection cho logic nghiệp vụ thường ngày — chỉ dùng ở tầng hạ tầng/framework.`,
  follow: [
    'Vì sao {{Method.invoke}} chậm hơn lời gọi trực tiếp, và {{MethodHandle}} cải thiện gì?',
    'Strong encapsulation từ Java 17 ảnh hưởng thư viện cũ thế nào?',
    'Annotation processing khác runtime annotation ở điểm nào?'
  ],
  tags: ['reflection', 'annotation processing', 'Lombok', 'MethodHandle'],
  refs: [
    { type: 'doc', title: 'Java Language Specification', url: 'https://docs.oracle.com/javase/specs/' }
  ]
},
{
  id: 'core-011',
  topic: 'core',
  level: 'lead',
  q: 'Liệt kê các method của {{Object}}. {{clone()}} có nên dùng không, so với copy constructor thế nào?',
  a: `**Tóm tắt:** {{Object}} cung cấp {{equals}}, {{hashCode}}, {{toString}}, {{getClass}}, {{clone}}, {{finalize}} và bộ {{wait}}/{{notify}}/{{notifyAll}}; {{clone()}} hoạt động qua {{Cloneable}} nhưng nhiều cạm bẫy, nên ưu tiên **copy constructor** hoặc static factory.

### Các method của Object
- {{equals(Object)}}: so sánh tham chiếu mặc định; override theo contract.
- {{hashCode()}}: hash mặc định dựa trên identity; phải đi cùng {{equals}}.
- {{toString()}}: mặc định {{ClassName@hex}}; override để log dễ đọc nhưng che dữ liệu nhạy cảm.
- {{getClass()}}: trả {{Class}} runtime; không override được; dùng cho reflection và so sánh chính xác kiểu.
- {{clone()}}: protected native, tạo bản sao; chỉ hoạt động nếu class implements {{Cloneable}}, nếu không ném {{CloneNotSupportedException}}.
- {{finalize()}}: đã deprecate, không dùng.
- {{wait()}}, {{wait(long)}}, {{wait(long,int)}}, {{notify()}}, {{notifyAll()}}: phối hợp monitor; phải gọi trong {{synchronized}} trên đúng object, nếu không {{IllegalMonitorStateException}}.

### clone() có vấn đề gì
- **Shallow copy**: field object vẫn chia sẻ reference; muốn deep phải tự clone từng field — dễ sai và dễ bỏ sót.
- **Không gọi constructor**: bất biến/validate trong constructor bị bỏ qua; với class có final field rất khó gán.
- **{{Cloneable}} là marker kỳ lạ**: không có method nào; nó chỉ đổi hành vi của {{Object.clone}} từ ném exception sang copy field.
- **Kế thừa**: subclass phải tự override để trả đúng kiểu; dễ trả sai class hoặc làm hỏng contract.
- **Không type-safe**: {{clone()}} trả {{Object}} ở nhiều chỗ, phải cast.
- Với mảng, {{clone()}} an toàn và nhanh (copy nông), nhưng với object phức tạp thì không.

### Copy constructor / factory
- Copy constructor {{User(User other)}} rõ ràng, type-safe, kiểm soát deep copy và giữ được validation; bên trong gán {{this.tags = List.copyOf(other.tags)}}.
- Static factory {{User.copyOf(u)}} tiện cho generic/collection.
- Record có canonical constructor; muốn copy thì {{new User(r.id(), r.tags())}} hoặc compact constructor tự copy.
- Với deep copy phức tạp, dùng mapper (MapStruct) hoặc serialization qua JSON (chậm, chỉ dùng khi cần).

### Khi nào vẫn dùng clone
- Copy mảng primitive/object nông trong hot path: {{int[] copy = arr.clone()}}.
- Code cũ/thư viện bắt buộc; khi đó override {{clone()}} public, gọi {{super.clone()}}, rồi deep copy field mutable, và cân nhắc {{CloneNotSupportedException}}.

### Bên trong: Object.clone làm gì
{{Object.clone()}} là method native: nó kiểm tra class có implements {{Cloneable}} không (không thì ném {{CloneNotSupportedException}}), rồi cấp phát object mới **cùng class runtime** và **sao chép từng bit** của mọi field — không gọi constructor, không chạy field initializer. Với field là reference, chỉ con trỏ được sao chép (shallow). Vì không qua constructor, field {{final}} trỏ tới object mutable không thể gán lại bản sao sâu trong {{clone()}} của bạn — đây là lý do {{clone}} xung đột với thiết kế bất biến. Ngược lại, {{clone()}} của **mảng** được JVM tối ưu rất tốt và trả về đúng kiểu mảng (không cần cast từ Java 5) — đó là trường hợp dùng hợp lý nhất.

### Ví dụ đời thực
Một engine báo giá bảo hiểm sao chép "gói mẫu" cho từng khách bằng {{clone()}}; class {{Policy}} có field {{List<Rider> riders}}. Khi nhân viên thêm quyền lợi bổ sung cho một khách, quyền lợi đó xuất hiện ở **mọi** hợp đồng tạo từ cùng gói mẫu trong phiên làm việc — vì list được chia sẻ. 64 báo giá sai được gửi đi trước khi phát hiện. Sửa: bỏ {{Cloneable}}, viết copy constructor tạo list mới và copy từng {{Rider}}; thêm test khẳng định sửa bản sao không làm đổi bản gốc. Sau đó team chuyển {{Rider}} sang record bất biến để không cần copy sâu nữa.

### Trả lời mẫu khi phỏng vấn
"Object có equals, hashCode, toString, getClass, clone, finalize và wait, notify, notifyAll. Tôi tránh clone vì nhiều cạm bẫy. Object.clone là method native, kiểm tra Cloneable rồi sao chép từng field mà không gọi constructor, nên validation trong constructor bị bỏ qua, field final không gán lại được, và mặc định chỉ là shallow copy: list hay object con vẫn dùng chung với bản gốc. Cloneable là một marker interface kỳ lạ không có method, và kế thừa làm mọi thứ phức tạp hơn. Tôi dùng copy constructor hoặc static factory: rõ ràng, type-safe, tự quyết định copy sâu đến đâu, giữ được validation. Với record bất biến thì nhiều khi không cần copy. Trường hợp duy nhất tôi dùng clone là sao chép mảng, vì nó nhanh và đúng kiểu."

> Senior tip: trong codebase mới, đừng implement {{Cloneable}}; dùng copy constructor hoặc record. Nếu buộc phải giữ {{clone()}} cho tương thích, hãy viết unit test khẳng định bản copy **không chia sẻ** collection/mảng với bản gốc — đây là chỗ bug thường ẩn.`,
  follow: [
    'Vì sao {{Cloneable}} được xem là thiết kế tồi trong Effective Java?',
    '{{wait}}/{{notify}} khác gì {{Condition}} của {{ReentrantLock}}?',
    'Làm sao deep copy một object graph có vòng lặp tham chiếu?'
  ],
  tags: ['Object', 'clone', 'copy constructor', 'wait notify']
},
{
  id: 'collections-001',
  topic: 'collections',
  level: 'senior',
  q: 'Giải thích bên trong {{HashMap}}: hash spreading, bucket, resize, load factor và treeify từ Java 8.',
  a: `**Tóm tắt:** {{HashMap}} là mảng các bucket ({{Node[] table}}); index = {{(n-1) & spread(hash)}}; khi số phần tử vượt {{capacity * loadFactor}} thì resize gấp đôi; từ Java 8 bucket dài ≥ 8 được chuyển thành cây đỏ-đen để tránh O(n) khi collision nhiều.

### Cấu trúc
- Mặc định capacity 16, load factor 0.75; bảng **lazy init** ở lần {{put}} đầu tiên (trước đó {{table == null}}).
- Mỗi entry là {{Node}} gồm {{hash}}, {{key}}, {{value}}, {{next}}. Bucket là danh sách liên kết.
- Capacity luôn là luỹ thừa của 2 để dùng phép {{&}} thay cho modulo.

### Hash spreading
~~~java
static final int hash(Object key) {
    int h;
    return (key == null) ? 0 : (h = key.hashCode()) ^ (h >>> 16);
}
int index = (n - 1) & hash;          // n là capacity
~~~
- XOR 16 bit cao xuống thấp để các bit cao cũng tham gia index; nếu không, với capacity nhỏ, hash chỉ dùng bit thấp nên dễ đụng.
- {{null}} key luôn vào bucket 0, chỉ có một key null.

### Resize
- Khi {{size > threshold}} (threshold = capacity * 0.75), gọi {{resize}}: tạo mảng mới gấp đôi, phân bố lại node.
- Java 8 tối ưu: mỗi bucket cũ tách thành **lo** và **hi** theo bit mới của hash, giữ thứ tự tương đối, không tính lại hash.
- Chi phí O(n) mỗi lần; nhiều lần resize liên tiếp gây spike latency. Vì vậy nếu biết trước số phần tử, khởi tạo capacity hợp lý: {{new HashMap<>((int)(expected / 0.75f) + 1)}}.

### Treeify (Java 8)
- Khi một bucket có ≥ {{TREEIFY_THRESHOLD = 8}} node **và** capacity ≥ {{MIN_TREEIFY_CAPACITY = 64}}, bucket chuyển thành {{TreeNode}} (cây đỏ-đen), tìm kiếm O(log n) thay vì O(n).
- Nếu capacity < 64, HashMap **resize** thay vì treeify, vì resize có thể làm bucket ngắn lại.
- Khi số node giảm xuống ≤ {{UNTREEIFY_THRESHOLD = 6}}, chuyển lại linked list.
- So sánh key trong cây dùng {{hashCode}} trước; nếu bằng thì dùng {{Comparable}} nếu key implements, nếu không dùng {{tieBreakOrder}} (so sánh identity) để cây vẫn hợp lệ.
- Tại sao threshold 8: phân bố hash chuẩn thì xác suất bucket dài 8 cực nhỏ (xấp xỉ 6e-8 với load factor 0.75); treeify chỉ để chống tấn công hash flooding.

### Các điểm hay hỏi
- {{HashMap}} không thread-safe: {{put}} đồng thời có thể mất dữ liệu; trước Java 8 còn có thể tạo vòng lặp vô hạn khi resize (bug nổi tiếng).
- Từ Java 8, việc resize không còn tạo vòng lặp nhưng vẫn không an toàn — cần {{ConcurrentHashMap}} hoặc đồng bộ ngoài.
- {{containsKey}} và {{get}} đều O(1) trung bình; worst case O(log n) từ Java 8 (có treeify), trước đó O(n).
- Key phải có {{hashCode}} ổn định; key mutable làm entry "mất tích".
- {{HashMap}} cho phép 1 key null và nhiều value null; {{Hashtable}}/{{ConcurrentHashMap}} thì không.

### Ví dụ đời thực
Một service đối soát nạp 2 triệu giao dịch vào {{HashMap<TxKey, Tx>}} mỗi đêm. Job chậm dần từ 4 lên 25 phút dù dữ liệu chỉ tăng 30%. Profiler cho thấy phần lớn thời gian nằm trong {{TxKey.equals}}. Nguyên nhân: {{TxKey}} tự viết {{hashCode()}} chỉ dựa trên {{bankCode}} (khoảng 40 giá trị) → 2 triệu key dồn vào khoảng 40 bucket; key không implements {{Comparable}} nên cây đỏ-đen phải dùng {{tieBreakOrder}} và duyệt nhiều nhánh. Sửa {{hashCode}} dùng {{Objects.hash(bankCode, txId, date)}} (hoặc chuyển {{TxKey}} sang record), khởi tạo capacity theo số phần tử dự kiến: job còn 2 phút 40 giây, heap cũng giảm vì không còn hàng nghìn {{TreeNode}} (mỗi TreeNode nặng gần gấp đôi Node).

### Trả lời mẫu khi phỏng vấn
"HashMap là một mảng bucket. Khi put, nó lấy hashCode của key, trộn 16 bit cao xuống 16 bit thấp bằng XOR để bit cao cũng ảnh hưởng tới vị trí, rồi tính index bằng n trừ 1 AND hash, vì capacity luôn là luỹ thừa của 2. Mỗi bucket là danh sách liên kết; từ Java 8, bucket dài từ 8 phần tử trở lên và bảng đã ít nhất 64 bucket thì chuyển thành cây đỏ-đen để worst case là log n thay vì n, chủ yếu để chống hash flooding. Khi số phần tử vượt capacity nhân load factor 0,75, bảng gấp đôi và mỗi bucket tách thành hai nhóm theo một bit của hash, không cần tính lại hash. Thực tế tôi chú ý ba điều: hashCode của key phải phân bố tốt và ổn định, key không được thay đổi sau khi put, và đặt capacity ban đầu cho map lớn. HashMap không thread-safe, dùng đồng thời thì phải chọn ConcurrentHashMap."

> Senior tip: đặt capacity ban đầu cho map lớn (ví dụ map cấu hình 100k entry) để tránh 10+ lần resize lúc khởi động; và nếu nghi ngờ hash flooding từ input người dùng, dùng key kiểu {{String}} với salt hoặc giới hạn kích thước request.`,
  follow: [
    'Vì sao capacity phải là luỹ thừa của 2 và load factor 0.75?',
    'Treeify threshold 8 và untreeify 6 — vì sao không dùng cùng một ngưỡng?',
    'HashMap thay đổi thế nào từ Java 7 sang Java 8 về xử lý collision?'
  ],
  tags: ['HashMap', 'resize', 'treeify', 'hash flooding'],
  refs: [
    { type: 'doc', title: 'Java Language Specification', url: 'https://docs.oracle.com/javase/specs/' },
    { type: 'doc', title: 'Java Object Specification', url: 'https://docs.oracle.com/javase/8/docs/api/java/lang/Object.html' }
  ]
},
{
  id: 'collections-002',
  topic: 'collections',
  level: 'lead',
  q: '{{ConcurrentHashMap}} từ Java 8 hoạt động thế nào (CAS + synchronized trên bin)? Vì sao {{size()}} không chính xác tuyệt đối và vì sao không cho null?',
  a: `**Tóm tắt:** Java 8 bỏ segment, dùng **CAS** để chèn vào bucket rỗng và **synchronized trên node đầu** khi có collision; bộ đếm dùng {{baseCount}} + {{CounterCell}} nên {{size()}} là ước lượng dưới cập nhật đồng thời; null bị cấm để tránh nhập nhằng giữa "không có key" và "key có value null", đồng thời đơn giản hoá lock-free read.

### Từ Java 7 sang Java 8
- Java 7: chia thành các {{Segment}} (mặc định 16), mỗi segment là một bảng có lock riêng; mức đồng thời cố định.
- Java 8: một mảng {{Node[] table}}, không segment.
  - Bucket rỗng: {{casTabAt}} để đặt node đầu, không lock.
  - Bucket có node: {{synchronized (f)}} trên node đầu, cập nhật list/cây trong bucket đó.
  - Đọc: {{get}} không lock vì {{val}} và {{next}} là {{volatile}}.
- Kết quả: mức đồng thời theo bucket, tốt hơn nhiều so với 16 segment cố định.

### Ghi và đọc
~~~java
// giả lập ý tưởng putVal
if (tabAt(tab, i) == null) {
    if (casTabAt(tab, i, null, new Node(hash, key, value)))
        return;                        // chèn không lock
}
synchronized (f) {                     // f = node đầu bucket
    // duyệt list, update hoặc append; nếu dài thì treeify
}
~~~
- Resize có hỗ trợ **multi-threading**: các thread giúp di chuyển bucket ({{transfer}}), dùng {{ForwardingNode}} đánh dấu bucket đã chuyển.
- {{computeIfAbsent}}/{{compute}}/{{merge}} là atomic theo key, nhưng mapping function chạy **bên trong lock của bucket** — đừng gọi I/O hay thao tác chậm trong đó, và tuyệt đối không cập nhật đệ quy cùng map (có thể deadlock hoặc vòng lặp).
- Iterator là **weakly consistent**: không ném {{ConcurrentModificationException}}, phản ánh trạng thái tại một thời điểm, có thể thấy hoặc không thấy cập nhật mới.

### size() và bộ đếm
- Không dùng một biến {{size}} duy nhất vì sẽ thành điểm nghẽn. Java 8 dùng {{baseCount}} cộng thêm mảng {{CounterCell}} (ý tưởng giống {{LongAdder}}): mỗi thread cập nhật một cell khác nhau, giảm contention.
- {{sumCount()}} cộng tất cả lại, nhưng trong lúc đang cộng thì các thread khác vẫn thay đổi ⇒ kết quả có thể **không phải snapshot chính xác** tại bất kỳ thời điểm nào.
- Vì vậy {{size()}} chỉ nên dùng cho ước lượng/monitoring; đừng dùng để quyết định logic "nếu size == 0 thì..." trong môi trường đồng thời.
- {{mappingCount()}} trả {{long}}, tránh tràn int khi > 2 tỷ entry.

### Vì sao cấm null
- Nếu cho phép value null, {{get(key)}} trả null không phân biệt được "key không tồn tại" và "key tồn tại với value null"; muốn phân biệt phải gọi thêm {{containsKey}}, tạo race giữa hai lời gọi.
- Việc cấm null cho phép triển khai lock-free đơn giản hơn: sự hiện diện của node đã đủ biểu diễn key tồn tại.
- Trong {{ConcurrentHashMap}} còn cấm key null; nếu cần biểu diễn "không có", dùng giá trị sentinel hoặc {{Optional}} (nhưng cân nhắc chi phí).

### Pitfall
- Dùng {{computeIfAbsent}} để cache kết quả gọi DB: lock giữ lâu, các thread khác cùng bucket bị chặn; nên dùng cache có loading (Caffeine) hoặc future per key.
- {{putIfAbsent}} + kiểm tra sau đó không atomic; dùng {{computeIfAbsent}}/{{merge}} đúng cách.
- Kích thước ban đầu: {{new ConcurrentHashMap<>(expected)}} để giảm resize.

> Senior tip: CHM rất tốt cho map cấu hình/registry đọc nhiều, nhưng không thay thế cache có eviction. Với hot key, cân nhắc {{LongAdder}}/{{striped lock}} thay vì {{compute}} trên cùng một key vì mọi thread sẽ xếp hàng trên cùng bucket.`,
  follow: [
    'Vì sao {{computeIfAbsent}} có thể gây deadlock nếu mapping function động vào chính map?',
    '{{ConcurrentHashMap}} đảm bảo gì cho iterator và {{size()}}?',
    'Khi nào nên dùng {{Collections.synchronizedMap}} thay vì CHM?'
  ],
  tags: ['ConcurrentHashMap', 'CAS', 'size', 'null']
},
{
  id: 'collections-003',
  topic: 'collections',
  level: 'mid',
  q: '{{ArrayList}} vs {{LinkedList}}: cache locality ảnh hưởng thế nào, và khi nào {{LinkedList}} thực sự thắng?',
  a: `**Tóm tắt:** {{ArrayList}} lưu trong mảng liên tục nên duyệt cực nhanh nhờ cache locality và truy cập ngẫu nhiên O(1); {{LinkedList}} là các node rải rác, mỗi node tốn header + 2 reference, duyệt chậm và tốn bộ nhớ. {{LinkedList}} gần như không bao giờ thắng ở workload thực tế; {{ArrayDeque}} thường tốt hơn cho queue/stack.

### Bên trong
- {{ArrayList}}: {{Object[] elementData}} + {{size}}. Thêm cuối amortized O(1); chèn/xoá giữa O(n) do {{System.arraycopy}} dịch phần tử. Khi đầy, tăng khoảng 1.5 lần ({{oldCapacity + (oldCapacity >> 1)}}).
- {{LinkedList}}: node {{prev, item, next}}; mỗi node là object riêng. {{get(i)}} O(n) (duyệt từ đầu hoặc cuối); thêm/xoá ở hai đầu O(1); xoá qua {{Iterator}} O(1) vì đã có node.

### Cache locality
- CPU đọc theo cache line (thường 64 byte). Mảng {{Object[]}} nằm liền nhau nên duyệt tuần tự gần như luôn hit cache; JIT cũng tối ưu vòng lặp mảng tốt.
- Mỗi node LinkedList là một object trên heap, có thể nằm rải rác; truy cập {{next}} là **pointer chasing**, mỗi bước có thể cache miss. Duyệt 1 triệu phần tử có thể chậm gấp nhiều lần ArrayList dù cùng O(n).
- Memory: node LinkedList tốn header object (~16 byte) + 3 reference (~12-24 byte tuỳ compressed oops) ≈ 32-40 byte/phần tử; ArrayList chỉ tốn reference trong mảng (4-8 byte) + overhead mảng.

### Khi nào LinkedList có lý
- Cần cả {{List}} và {{Deque}}, thêm/xoá rất nhiều ở hai đầu, và **không** truy cập theo index. Nhưng {{ArrayDeque}} cũng làm được việc này nhanh hơn và ít bộ nhớ hơn.
- Xoá phần tử ở giữa khi đã có {{ListIterator}} tại đúng vị trí (O(1) cho thao tác xoá), nhưng chi phí để **đi tới** vị trí vẫn O(n), và locality vẫn kém.
- Danh sách rất lớn mà thao tác chèn/xoá giữa liên tục và không cần index — hiếm trong backend; thường dùng cấu trúc khác (skip list, tree, queue).

### Thực tế
- Hầu hết code backend dùng {{ArrayList}}; queue/stack dùng {{ArrayDeque}}; priority dùng {{PriorityQueue}}; concurrent queue dùng {{ArrayBlockingQueue}}/{{LinkedBlockingQueue}}.
- {{LinkedList}} còn được dùng làm {{Deque}} trong một số code cũ, nhưng {{ArrayDeque}} nhanh hơn ~vài lần trong benchmark.
- Đừng chọn collection dựa trên Big-O thuần; hằng số và bộ nhớ quyết định rất nhiều.

### Ví dụ đời thực
Một service xếp hạng sản phẩm giữ danh sách 300.000 ứng viên trong {{LinkedList}} vì "thường xuyên xoá phần tử bị loại". Code thực tế lại gọi {{list.get(i)}} trong vòng lặp for theo index → mỗi lần get duyệt từ đầu, tổng chi phí O(n²); request xếp hạng mất 4–9 giây. Đổi sang {{ArrayList}} và lọc bằng {{removeIf}} (một lần dịch mảng, O(n)): còn khoảng 35ms. Heap của danh sách cũng giảm từ khoảng 12MB (node + header) xuống khoảng 1,5MB cho mảng reference.

### Trả lời mẫu khi phỏng vấn
"ArrayList lưu reference trong một mảng liên tục nên truy cập theo index là O(1), và duyệt tuần tự rất nhanh vì CPU đọc theo cache line 64 byte, các phần tử liền nhau nên gần như luôn trúng cache. Thêm vào cuối là amortized O(1), chèn hay xoá ở giữa thì phải dịch mảng. LinkedList thì mỗi phần tử là một node riêng có prev, next, nên mỗi phần tử tốn thêm khoảng 24 đến 32 byte và duyệt là đuổi theo con trỏ, mỗi bước có thể cache miss; get theo index là O(n). Về lý thuyết LinkedList thắng khi chèn xoá giữa danh sách lúc đã có iterator ở đúng chỗ, nhưng thực tế việc đi tới chỗ đó vẫn O(n). Nên tôi gần như luôn dùng ArrayList, cần queue hay stack thì ArrayDeque, và nếu nghi ngờ thì đo bằng JMH trên dữ liệu thật."

> Senior tip: nếu thấy {{LinkedList}} trong code, hỏi ngay "có thật sự cần chèn/xoá giữa với iterator không?"; 90% trường hợp đổi sang {{ArrayList}} hoặc {{ArrayDeque}} sẽ nhanh hơn và giảm heap. Đo bằng JMH trên dữ liệu thật thay vì tin cảm giác.`,
  follow: [
    'Vì sao {{ArrayDeque}} thường thay được {{LinkedList}} làm queue/stack?',
    'Tăng capacity 1.5 lần của ArrayList có ảnh hưởng gì tới bộ nhớ?',
    'Khi nào nên khởi tạo {{ArrayList}} với capacity cho trước?'
  ],
  tags: ['ArrayList', 'LinkedList', 'cache locality', 'ArrayDeque']
},
{
  id: 'collections-004',
  topic: 'collections',
  level: 'senior',
  q: 'Fail-fast và fail-safe iterator khác nhau thế nào? {{ConcurrentModificationException}} xảy ra khi nào và tránh ra sao?',
  a: `**Tóm tắt:** fail-fast iterator kiểm tra {{modCount}} và ném {{ConcurrentModificationException}} nếu collection bị sửa ngoài iterator; fail-safe (weakly consistent) như {{ConcurrentHashMap}} hay snapshot như {{CopyOnWriteArrayList}} thì không ném nhưng có thể thấy dữ liệu cũ/không đầy đủ.

### Fail-fast
- {{ArrayList}}, {{HashMap}}, {{HashSet}}... có field {{modCount}} tăng mỗi lần thay đổi cấu trúc.
- Iterator lưu {{expectedModCount}}; mỗi {{next()}}/{{remove()}} so sánh, lệch thì ném CME ngay.
- Đây là **best-effort detection**, không phải cơ chế đồng bộ: không đảm bảo phát hiện mọi trường hợp, nhất là đa luồng.
- CME có thể xảy ra cả trong **một thread** khi vừa for-each vừa {{list.remove(x)}} hoặc {{map.put}}.

~~~java
for (String s : list) {
    if (s.isEmpty()) list.remove(s);   // CME
}
// đúng:
Iterator<String> it = list.iterator();
while (it.hasNext()) if (it.next().isEmpty()) it.remove();
// hoặc gọn:
list.removeIf(String::isEmpty);
~~~

- {{list.remove(int)}} khác {{it.remove()}}; chỉ iterator biết để cập nhật {{expectedModCount}}.
- {{for (int i...)}} rồi {{remove(i)}} không ném nhưng **bỏ sót** phần tử do index dịch — bug âm thầm còn tệ hơn.

### Fail-safe / weakly consistent
- {{ConcurrentHashMap}}: iterator không ném CME, phản ánh trạng thái tại một thời điểm; có thể thấy hoặc không thấy thay đổi đang diễn ra. {{size()}} cũng chỉ là ước lượng.
- {{CopyOnWriteArrayList}}: iterator làm việc trên **snapshot** của mảng tại thời điểm tạo; sửa list không ảnh hưởng iterator, nhưng iterator không hỗ trợ {{remove}}.
- {{Collections.synchronizedList}}: iterator **vẫn fail-fast**; muốn duyệt an toàn phải đặt khối {{synchronized (list)}} quanh cả vòng lặp (theo Javadoc).
- {{ConcurrentSkipListMap}} weakly consistent tương tự.

### Cách tránh
- Sửa qua iterator ({{it.remove()}}, {{it.set()}}).
- Dùng {{removeIf}}, {{replaceAll}}, {{computeIfPresent}}.
- Với map, dùng {{entrySet().removeIf}}, {{map.compute}} thay vì remove trong for-each.
- Đa luồng: dùng collection concurrent đúng loại, hoặc copy sang list mới trước khi duyệt nếu chỉ cần snapshot.
- Không dùng {{Collections.synchronizedList}} rồi tưởng iterator an toàn.

### Pitfall
- Bắt CME rồi bỏ qua là che bug; CME là tín hiệu logic sai, không phải lỗi tạm thời để retry.
- Duyệt {{subList}} rồi sửa list gốc cũng gây CME.
- Sửa collection trong {{forEach}} của chính nó cũng CME (trừ concurrent).

### Bên trong: modCount nằm ở đâu
{{modCount}} là một field {{int}} thường (không {{volatile}}) trong {{AbstractList}}/{{HashMap}}; nó tăng khi **cấu trúc** thay đổi (thêm, xoá, resize), không tăng khi {{set}} giá trị tại chỗ. Vì không có đồng bộ, ở môi trường đa luồng thread khác có thể **không thấy** giá trị mới → CME không được bảo đảm; dữ liệu có thể hỏng mà không có exception nào. Đó là lý do Javadoc gọi đây là "best-effort", chỉ dùng để phát hiện bug, không để dựa vào cho tính đúng đắn.

### Ví dụ đời thực
Một scheduler giữ {{ArrayList<Job>}} dùng chung giữa thread lập lịch và thread API "huỷ job". Thỉnh thoảng (khoảng 3 lần/ngày) scheduler chết với CME; có lần không ném gì nhưng một job bị chạy hai lần. Đổi sang {{CopyOnWriteArrayList}} (danh sách nhỏ, đọc nhiều, sửa ít) cho danh sách job, và thao tác huỷ chuyển sang đặt cờ {{cancelled}} trên job thay vì xoá khỏi list khi đang duyệt. Không còn CME hay job chạy trùng trong 6 tháng sau.

### Trả lời mẫu khi phỏng vấn
"Collection thông thường như ArrayList, HashMap có field modCount tăng mỗi khi cấu trúc thay đổi. Iterator ghi lại giá trị đó lúc tạo và kiểm tra ở mỗi next; lệch thì ném ConcurrentModificationException. Điều này xảy ra ngay cả trong một thread, ví dụ remove trong vòng for-each. Cách đúng là xoá qua iterator.remove, hoặc dùng removeIf, replaceAll, compute. Lưu ý for theo index rồi remove không ném lỗi nhưng bỏ sót phần tử. Cơ chế này chỉ là best-effort: modCount không volatile nên đa luồng có thể không phát hiện gì mà dữ liệu vẫn hỏng. Với đa luồng tôi dùng collection concurrent: ConcurrentHashMap có iterator weakly consistent không ném lỗi, CopyOnWriteArrayList duyệt trên snapshot. Còn synchronizedList thì iterator vẫn fail-fast, phải tự đặt synchronized quanh cả vòng lặp."

> Senior tip: trong code review, ưu tiên {{removeIf}}/{{computeIfAbsent}} vì vừa gọn vừa tránh CME; với CHM, đừng dựa vào {{size()}} để dừng vòng lặp trong môi trường đồng thời — dùng kết quả trả về của thao tác hoặc đếm cục bộ.`,
  follow: [
    'Vì sao {{Collections.synchronizedList}} vẫn có thể ném CME khi duyệt?',
    '{{CopyOnWriteArrayList}} iterator có hỗ trợ {{remove}} không, vì sao?',
    'CME trong ứng dụng đa luồng có phải lúc nào cũng do đa luồng không?'
  ],
  tags: ['iterator', 'fail-fast', 'ConcurrentModificationException', 'fail-safe'],
  refs: [
    { type: 'doc', title: 'Java Language Specification', url: 'https://docs.oracle.com/javase/specs/' }
  ]
},
{
  id: 'collections-005',
  topic: 'collections',
  level: 'senior',
  q: 'Dùng {{LinkedHashMap}} làm LRU cache thế nào? {{removeEldestEntry}} và access-order hoạt động ra sao, và có nên dùng trong production?',
  a: `**Tóm tắt:** bật {{accessOrder = true}} để mỗi lần {{get}}/{{put}} đưa entry lên cuối danh sách, override {{removeEldestEntry}} trả {{size() > capacity}} để tự xoá entry cũ nhất; cách này đơn giản nhưng **không thread-safe** và không có thống kê/expiry, nên production thường dùng Caffeine.

### Cơ chế
- {{LinkedHashMap}} kế thừa {{HashMap}} và nối các entry bằng danh sách đôi ({{before}}/{{after}}).
- Mặc định **insertion-order**; constructor {{LinkedHashMap(int capacity, float loadFactor, boolean accessOrder)}} với {{accessOrder = true}} chuyển sang **access-order**.
- Trong access-order, {{get}} và {{put}} (kể cả {{getOrDefault}}, {{compute}}) là "truy cập" và di chuyển entry ra cuối.
- {{removeEldestEntry(Map.Entry)}} được gọi sau mỗi lần thêm; trả {{true}} thì xoá entry **đầu tiên** (least recently used).

~~~java
class LruCache<K, V> extends LinkedHashMap<K, V> {
    private final int max;
    LruCache(int max) {
        super(16, 0.75f, true);      // accessOrder = true
        this.max = max;
    }
    @Override protected boolean removeEldestEntry(Map.Entry<K, V> eldest) {
        return size() > max;
    }
}
~~~

- Có thể override {{removeEldestEntry}} để trả false với một số key (ghim entry) hoặc log khi evict.

### Giới hạn
- **Không thread-safe**: nhiều thread {{get}} đồng thời vẫn làm thay đổi danh sách liên kết (access-order) ⇒ phải bọc {{synchronized}} hoặc dùng {{Collections.synchronizedMap}}; nhưng khi đó mọi thao tác tuần tự, mất lợi ích.
- **Không có TTL**: chỉ evict theo kích thước, không theo thời gian.
- **Không có thống kê**: hit rate, eviction count phải tự đếm.
- **Không có chính sách tốt hơn LRU**: LRU dễ bị "cache pollution" bởi quét tuần tự một lần (mỗi phần tử mới đẩy hết cache cũ ra).
- **Chi phí bộ nhớ**: thêm 2 reference/entry so với HashMap; với cache lớn và entry nhỏ, overhead đáng kể.
- {{get}} trong access-order là **structural modification** theo nghĩa iterator: duyệt và {{get}} đồng thời có thể gây CME trong cùng thread.

### Production
- Dùng **Caffeine**: {{Caffeine.newBuilder().maximumSize(10_000).expireAfterWrite(...).recordStats().build()}}, hỗ trợ W-TinyLFU (tốt hơn LRU), async loading, thống kê, thread-safe.
- Hoặc Guava Cache (đơn giản hơn, ít tính năng hơn Caffeine).
- Redis/Memcached nếu cache phân tán; cần chính sách invalidate rõ ràng.
- Với cache trong JVM, luôn đặt **maximumSize** để tránh OOM; cache không giới hạn là bom hẹn giờ.

### Ví dụ đời thực
Một service tra cứu tỉ giá dùng {{LinkedHashMap}} access-order làm LRU 10.000 phần tử, bọc {{Collections.synchronizedMap}}. Dưới 2.000 request/giây, p99 lên 300ms: mọi {{get}} đều là thao tác ghi (di chuyển entry ra cuối danh sách) nên phải lấy cùng một khoá — hàng trăm thread xếp hàng. Chuyển sang Caffeine ({{maximumSize(10_000)}}, {{expireAfterWrite(5 phút)}}, {{recordStats()}}): p99 còn 4ms, hit rate đo được 97%. Thống kê còn cho thấy một job đêm quét toàn bộ mã tiền tệ cũ làm sạch cache LRU cũ mỗi đêm — chính sách W-TinyLFU của Caffeine giữ được các key nóng qua đợt quét đó.

### Trả lời mẫu khi phỏng vấn
"LinkedHashMap nối các entry bằng một danh sách liên kết đôi. Khi khởi tạo với accessOrder bằng true, mỗi lần get hay put sẽ chuyển entry đó ra cuối danh sách, nên đầu danh sách luôn là entry lâu nhất không được dùng. Override removeEldestEntry trả về size lớn hơn giới hạn thì sau mỗi lần thêm, entry đầu bị xoá, thế là có LRU trong vài dòng. Nhưng tôi không dùng nó trong production cho cache dùng chung. Nó không thread-safe, và vì get cũng sửa danh sách nên bọc synchronized biến mọi lần đọc thành tuần tự. Nó không có TTL, không có thống kê, và LRU dễ bị một lần quét làm sạch cache. Production tôi dùng Caffeine: thread-safe, có maximumSize, expire, thống kê hit rate và chính sách W-TinyLFU tốt hơn LRU."

> Senior tip: đừng tự viết LRU bằng LinkedHashMap trong service production trừ khi cache rất nhỏ và chỉ một thread truy cập. Caffeine không chỉ nhanh hơn mà còn tránh được pattern scan làm sạch cache, và có metric để biết cache có hiệu quả hay không.`,
  follow: [
    'Vì sao access-order {{get}} có thể gây CME khi duyệt map?',
    'LRU có nhược điểm gì so với LFU/W-TinyLFU?',
    'Làm sao thêm TTL cho một cache tự viết bằng LinkedHashMap?'
  ],
  tags: ['LinkedHashMap', 'LRU', 'removeEldestEntry', 'Caffeine'],
  refs: [
    { type: 'doc', title: 'Java Language Specification', url: 'https://docs.oracle.com/javase/specs/' },
    { type: 'doc', title: 'Java Object Specification', url: 'https://docs.oracle.com/javase/8/docs/api/java/lang/Object.html' }
  ]
},
{
  id: 'collections-006',
  topic: 'collections',
  level: 'senior',
  q: '{{TreeMap}}/{{NavigableMap}} dùng khi nào? Vì sao comparator phải nhất quán với {{equals}} và hậu quả nếu không?',
  a: `**Tóm tắt:** {{TreeMap}} là cây đỏ-đen, giữ key theo thứ tự, cho phép truy vấn range/floor/ceiling O(log n); comparator (hoặc {{compareTo}}) phải nhất quán với {{equals}}, nếu không map/set sẽ coi hai key khác nhau là một và **mất dữ liệu âm thầm**.

### NavigableMap
- {{firstKey}}, {{lastKey}}, {{floorKey(k)}} (≤ k), {{ceilingKey(k)}} (≥ k), {{lowerKey}}, {{higherKey}}.
- {{headMap(k, inclusive)}}, {{tailMap}}, {{subMap(from, to)}} là **view** — thay đổi view ảnh hưởng map gốc.
- {{pollFirstEntry}}, {{pollLastEntry}} tiện cho hàng đợi ưu tiên có xoá.
- {{descendingMap}} đảo thứ tự; {{TreeSet}} tương tự cho set.

### Use case
- Range query trong bộ nhớ: tìm khung giờ, bucket giá, version ≥ X.
- Leaderboard nhỏ, scheduler đơn giản (nhưng production nên dùng heap/Redis sorted set).
- Gom nhóm theo khoảng: {{subMap(from, true, to, false)}}.
- Tìm phần tử gần nhất (nearest neighbor 1 chiều).

### Comparator và equals
- {{TreeMap}} **không dùng** {{equals}}/{{hashCode}} để định danh key; nó dùng {{compare()}}.
- Nếu {{compare(a, b) == 0}} nhưng {{a.equals(b)}} là false, map coi là **cùng một key**: {{put(b, ...)}} ghi đè value của {{a}}, {{size()}} không tăng, {{get(b)}} trả value của a. Đây là vi phạm contract của {{Map}}.
- Ví dụ kinh điển: {{new TreeSet<>(Comparator.comparing(String::length))}} — "ab" và "cd" cùng length 2 nên chỉ giữ một.
- Comparator cũng phải **transitive** và **consistent**: nếu không, cây đỏ-đen có thể mất cân bằng hoặc tìm kiếm sai.
- Với key có {{compareTo}} tự nhiên: đảm bảo {{compareTo == 0}} ⇔ {{equals == true}}. {{BigDecimal}} là cái bẫy nổi tiếng: {{new BigDecimal("1.0").equals(new BigDecimal("1.00"))}} là false nhưng {{compareTo}} là 0 ⇒ dùng làm key TreeMap sẽ gộp.
- Null: {{TreeMap}} không cho key null trừ khi comparator xử lý null; natural ordering ném NPE.

### Khác biệt với HashMap
- {{TreeMap}}: O(log n), có thứ tự, memory cao hơn, không cho null key (mặc định).
- {{HashMap}}: O(1) trung bình, không thứ tự; {{LinkedHashMap}} giữ thứ tự chèn/access.
- Nếu chỉ cần sắp xếp khi in ra, dùng HashMap rồi sort lúc cần sẽ nhanh hơn cho write-heavy.

### Ví dụ đời thực
Một hệ thống tính phí theo bậc dùng {{TreeMap<BigDecimal, Fee>}} với key là ngưỡng số tiền và tra bằng {{floorEntry(amount)}}. Cấu hình nhập từ Excel có hai dòng "1000000" và "1000000.00" với hai mức phí khác nhau (lỗi nhập liệu); vì {{compareTo}} coi hai giá trị bằng nhau, dòng sau **ghi đè** dòng trước mà không báo lỗi — 6 tuần tính sai phí cho khoảng 1,2% giao dịch. Sửa: chuẩn hoá key bằng {{setScale(2)}} khi nạp, **báo lỗi** nếu {{put}} trả về giá trị cũ khác null (phát hiện trùng), và thêm test cho cấu hình. {{floorEntry}} vẫn là cách tra bậc gọn nhất — đổi sang danh sách sắp xếp + duyệt tuyến tính trước đó chậm hơn 20 lần với 5.000 bậc.

### Trả lời mẫu khi phỏng vấn
"TreeMap là cây đỏ-đen giữ key theo thứ tự, mọi thao tác O(log n). Tôi dùng nó khi cần truy vấn theo khoảng hoặc tìm phần tử gần nhất: floorKey, ceilingKey, subMap, headMap, ví dụ tra bậc phí theo số tiền hay tìm khung giờ. Điểm quan trọng là TreeMap không dùng equals và hashCode mà dùng compareTo hoặc comparator để xác định key. Nếu comparator trả về 0 cho hai key mà equals coi là khác nhau, map sẽ coi chúng là một, put sau ghi đè put trước và không có lỗi nào. Ví dụ comparator theo độ dài chuỗi, hoặc BigDecimal 1.0 và 1.00 có compareTo bằng 0 nhưng equals khác. Vì vậy comparator phải nhất quán với equals, tôi chuẩn hoá scale của BigDecimal trước khi làm key, và kiểm tra giá trị trả về của put để phát hiện trùng."

> Senior tip: khi dùng comparator tùy biến, viết unit test khẳng định các key **khác nhau** vẫn là phần tử riêng biệt; đây là loại bug không ném exception, chỉ làm mất record và cực khó phát hiện. Với BigDecimal, luôn normalize ({{stripTrailingZeros}}) trước khi làm key, ví dụ {{bd.stripTrailingZeros().toPlainString()}} — riêng {{toPlainString}} không normalize ("1.0" và "1.00" vẫn khác nhau).`,
  follow: [
    'Vì sao {{BigDecimal}} là cái bẫy khi làm key của {{TreeMap}}?',
    '{{subMap}} là view hay bản copy, và điều đó ảnh hưởng gì?',
    'Khi nào dùng {{TreeMap}} thay vì sort một {{HashMap}} khi cần?'
  ],
  tags: ['TreeMap', 'NavigableMap', 'Comparator', 'BigDecimal'],
  refs: [
    { type: 'doc', title: 'Java Language Specification', url: 'https://docs.oracle.com/javase/specs/' }
  ]
},
{
  id: 'collections-007',
  topic: 'collections',
  level: 'senior',
  q: '{{CopyOnWriteArrayList}} và các {{BlockingQueue}} dùng trong tình huống nào? So sánh {{ArrayBlockingQueue}}, {{LinkedBlockingQueue}}, {{SynchronousQueue}}.',
  a: `**Tóm tắt:** {{CopyOnWriteArrayList}} copy toàn bộ mảng mỗi lần ghi, đọc không lock — hợp với danh sách listener **đọc nhiều, ghi cực ít**; {{BlockingQueue}} dùng cho producer-consumer, chọn theo bounded/unbounded, throughput và cơ chế handoff.

### CopyOnWriteArrayList
- Mọi thao tác ghi ({{add}}, {{set}}, {{remove}}) tạo mảng mới rồi thay reference {{volatile}}; đọc dùng mảng hiện tại, không lock.
- Iterator là **snapshot**: không CME, không {{remove}}; có thể thấy dữ liệu cũ.
- Chi phí ghi O(n) cả về thời gian và bộ nhớ; ghi liên tục ⇒ GC pressure rất lớn.
- Hợp: danh sách listener/observer ít thay đổi, cấu hình read-mostly, tập subscriber trong event bus.
- Không hợp: cache, queue, collection lớn cập nhật thường xuyên.
- {{CopyOnWriteArraySet}} tương tự, dùng cho tập nhỏ.

### BlockingQueue
- Hỗ trợ {{put}} (chờ khi đầy), {{take}} (chờ khi rỗng), bản có timeout {{offer(e, t, unit)}}, {{poll(t, unit)}}.
- Dùng cho thread pool ({{ThreadPoolExecutor}} dùng queue), pipeline xử lý, backpressure.

| Queue | Bound | Đặc điểm | Dùng khi |
|---|---|---|---|
| {{ArrayBlockingQueue}} | có | mảng, lock + condition, công bằng tuỳ chọn | cần giới hạn chặt, throughput vừa, bộ nhớ dự đoán được |
| {{LinkedBlockingQueue}} | tuỳ chọn | node, 2 lock (put/take) | throughput cao; **mặc định không giới hạn** nên dễ OOM |
| {{SynchronousQueue}} | 0 | handoff trực tiếp, không lưu | thread pool kiểu cached, chuyển task ngay cho consumer |
| {{PriorityBlockingQueue}} | không giới hạn | heap, ưu tiên | task có priority, chấp nhận không bound |
| {{DelayQueue}} | không giới hạn | phần tử chỉ lấy được sau delay | retry, scheduler nhẹ |
| {{LinkedTransferQueue}} | không giới hạn | transfer, hiệu năng cao | producer chờ consumer nhận |

### Chọn thế nào
- Luôn đặt **bound** cho queue trong production; queue vô hạn chỉ dời OOM chứ không tránh.
- Cần backpressure: dùng {{ArrayBlockingQueue}} nhỏ + {{CallerRunsPolicy}} hoặc chặn producer.
- Cần throughput lớn với nhiều producer/consumer: {{LinkedBlockingQueue}} có bound hợp lý.
- Cần handoff tức thì, không tồn đọng: {{SynchronousQueue}}.
- Cần ưu tiên: {{PriorityBlockingQueue}} nhưng nhớ nó không bound và không đảm bảo FIFO cho cùng priority.
- Với virtual thread (Java 21), {{SynchronousQueue}}/{{ArrayBlockingQueue}} vẫn dùng tốt; tránh queue quá lớn làm mất lợi ích backpressure.

### Pitfall
- {{LinkedBlockingQueue}} mặc định {{Integer.MAX_VALUE}} — một trong những nguyên nhân OOM phổ biến khi dùng {{Executors.newFixedThreadPool}} (queue unbounded).
- {{CopyOnWriteArrayList}} trong vòng lặp ghi hàng nghìn phần tử: O(n²).
- Không xử lý {{InterruptedException}}: phải restore interrupt hoặc thoát êm.
- Poison pill để đóng consumer cần đúng số consumer, nếu không sẽ kẹt.

> Senior tip: với thread pool, luôn tự tạo {{ThreadPoolExecutor}} với queue bounded và đặt tên thread; đừng dùng {{Executors.newFixedThreadPool}} mặc định vì queue vô hạn che giấu overload cho tới khi OOM. Theo dõi {{queue.size()}} và thời gian chờ {{take}} để phát hiện nghẽn sớm.`,
  follow: [
    'Vì sao {{Executors.newFixedThreadPool}} có thể gây OOM khi tải tăng?',
    '{{SynchronousQueue}} hoạt động thế nào khi không có consumer chờ?',
    'Khi nào {{CopyOnWriteArrayList}} là lựa chọn tồi dù đọc nhiều?'
  ],
  tags: ['CopyOnWriteArrayList', 'BlockingQueue', 'backpressure', 'thread pool'],
  refs: [
    { type: 'doc', title: 'Java Language Specification', url: 'https://docs.oracle.com/javase/specs/' }
  ]
},
{
  id: 'collections-008',
  topic: 'collections',
  level: 'lead',
  q: 'Cần lưu 10 triệu phần tử trong bộ nhớ — chọn collection nào? Phân tích memory footprint, boxing và primitive collections.',
  a: `**Tóm tắt:** với 10 triệu phần tử, **boxing và overhead của node** quyết định hàng trăm MB; ưu tiên mảng primitive ({{int[]}}) hoặc primitive collection (Eclipse Collections, fastutil) thay vì {{ArrayList<Integer>}} hay {{HashMap<Integer, ...>}}; nếu phải dùng object, chọn cấu trúc mảng liên tục và presize.

### Tính nhanh bộ nhớ
- {{int[]}} 10 triệu: 40 MB + header mảng.
- {{ArrayList<Integer>}} 10 triệu: mảng reference ~40-80 MB (tuỳ compressed oops) **cộng** 10 triệu object {{Integer}} ~16 byte mỗi cái = ~160 MB, tổng thường 200-300 MB. Nếu giá trị ngoài cache {{-128..127}}, không dùng chung được.
- {{LinkedList<Integer>}}: mỗi node ~32-40 byte + Integer ⇒ có thể > 500 MB và duyệt cực chậm.
- {{HashMap<Integer, Integer>}} 10 triệu entry: mảng bucket + node + 2 Integer + key object; thực tế có thể 700 MB đến hơn 1 GB, và còn phụ thuộc load factor. Đây là lựa chọn tồi nếu key là số nguyên liên tục.
- {{String}} key còn tệ hơn: mỗi String ~40+ byte + mảng byte.

### Nguyên nhân
- **Boxing**: mỗi primitive thành object có header (12-16 byte) + field; cache Integer chỉ cho -128..127.
- **Object header + alignment**: object trên HotSpot thường align 8 byte; node nhỏ cũng tốn 16 byte header.
- **Reference**: mỗi phần tử trong mảng/Object[] tốn 4 byte (heap < 32 GB với compressed oops) hoặc 8 byte.
- **Over-allocation**: ArrayList tăng 1.5x, HashMap capacity luỹ thừa 2 + load factor 0.75.

### Lựa chọn theo nhu cầu
- Chỉ lưu số nguyên/giá trị: {{int[]}}, {{long[]}}; nếu cần động, dùng {{IntArrayList}} (fastutil), {{IntArrayList}}/{{IntHashSet}} (Eclipse Collections), HPPC.
- Map khoá int → value object: {{Int2ObjectOpenHashMap}} (fastutil) hoặc Eclipse {{IntObjectHashMap}}; tránh {{HashMap<Integer, V>}}.
- Map int → int: {{IntIntHashMap}} — tiết kiệm cực lớn.
- Cần tập hợp: {{IntOpenHashSet}} thay {{HashSet<Integer>}}.
- Cần sort/range: mảng primitive + {{Arrays.sort}} + {{Arrays.binarySearch}} thường nhanh và nhẹ nhất.
- Dữ liệu quá lớn: cân nhắc lưu ngoài heap (off-heap, Chronicle Map), cơ sở dữ liệu nhúng, hoặc streaming thay vì giữ tất cả.
- Nếu key là số liên tục 0..N: dùng mảng trực tiếp thay map — O(1) và ít bộ nhớ nhất.

### Đo và kiểm chứng
- Dùng JOL (Java Object Layout) để đo chính xác footprint.
- Bật {{-XX:+UseCompressedOops}} (mặc định khi heap < 32 GB) và {{-XX:+UseCompressedClassPointers}}.
- Đặt {{-Xmx}} và theo dõi GC; cache 10 triệu object thường cần heap 1-2 GB chỉ cho cấu trúc, chưa kể tải.
- JMH để đo throughput; đừng tối ưu theo cảm giác.

### Pitfall
- Nghĩ rằng {{HashMap}} O(1) là đủ nhanh mà bỏ qua memory: 10 triệu entry có thể làm GC pause tăng mạnh.
- Dùng {{ArrayList<Integer>}} rồi sort: boxing comparator chậm hơn {{Arrays.sort(int[])}} nhiều.
- Giữ collection lớn trong static field/singleton ⇒ leak suốt vòng đời ứng dụng.
- Quên rằng {{Integer.valueOf}} cache chỉ giúp giá trị nhỏ; dữ liệu thực tế thường ngoài khoảng đó.

> Senior tip: trước khi chọn collection, ước lượng memory bằng công thức đơn giản và kiểm tra với JOL; nếu vượt quá ~30-40% heap dự kiến, hãy thiết kế lại (primitive collection, chunking, hoặc không giữ toàn bộ trong RAM). Đây là quyết định kiến trúc, không chỉ là micro-optimization.`,
  follow: [
    'Vì sao {{HashMap<Integer, V>}} tốn bộ nhớ hơn nhiều so với tính toán ngây thơ?',
    'Khi nào nên chọn mảng primitive thay vì primitive collection?',
    'Làm sao đo chính xác footprint của một collection bằng JOL?'
  ],
  tags: ['memory', 'boxing', 'primitive collections', 'fastutil']
},
{
  id: 'collections-009',
  topic: 'collections',
  level: 'senior',
  q: '{{PriorityQueue}}: heap bên trong, bài toán top-K trên stream dữ liệu lớn, độ phức tạp.',
  a: `**Tóm tắt:** {{PriorityQueue}} là min-heap (binary heap) dựa trên mảng, O(log n) cho offer/poll, O(1) peek; dùng cho top-K (giữ K phần tử lớn nhất/nhỏ nhất) trên stream lớn với bộ nhớ O(K); không thread-safe, không cho null, iterator không đảm bảo thứ tự.
 
### Cấu trúc heap
- Mảng {{Object[] queue}}; parent tại i, children tại 2i+1, 2i+2.
- {{offer}}: thêm cuối, sift-up (bubble up) so sánh với parent.
- {{poll}}: lấy root, đổi cuối lên root, sift-down (trickle down).
- {{peek}}: trả root không xoá.
- Không phải BST — chỉ đảm bảo parent ≤ children (min-heap), không sắp xếp toàn bộ.

### Top-K trên stream lớn
- Bài toán: tìm K phần tử lớn nhất từ stream N phần tử (N >> K, ví dụ N=1 tỷ, K=100).
- Giải pháp: min-heap size K. Duyệt stream:
  - Heap size < K: {{offer}} trực tiếp.
  - Heap size = K: nếu phần tử mới > root (min), {{poll}} rồi {{offer}} mới.
- Kết quả: heap chứa K phần tử lớn nhất, root là nhỏ nhất trong top-K.
- Độ phức tạp: O(N log K) thời gian, O(K) bộ nhớ — tốt hơn sort O(N log N) khi K << N.

~~~java
// Top 100 số lớn nhất
PriorityQueue<Long> minHeap = new PriorityQueue<>(100);
for (long v : stream) {
    if (minHeap.size() < 100) minHeap.offer(v);
    else if (v > minHeap.peek()) { minHeap.poll(); minHeap.offer(v); }
}
List<Long> top100 = minHeap.stream().sorted(Comparator.reverseOrder()).toList();
~~~

### Độ phức tạp
| Thao tác | Độ phức tạp |
|---|---|
| {{offer}}/{{add}} | O(log n) |
| {{poll}}/{{remove}} | O(log n) |
| {{peek}} | O(1) |
| {{contains}} | O(n) (duyệt mảng) |
| {{size}}/{{isEmpty}} | O(1) |
| Xây heap từ collection | O(n) (heapify) |

### Pitfall
- **Không cho null**: ném NPE ngay khi {{offer(null)}}.
- **Không thread-safe**: dùng {{PriorityBlockingQueue}} cho đa luồng.
- **Iterator không sorted**: {{iterator()}} duyệt theo mảng heap, không theo thứ tự ưu tiên; muốn sorted phải {{stream().sorted()}} hoặc poll hết.
- **Comparator phức tạp**: nếu comparator chậm, log n nhân thêm hằng số lớn; cân nhắc pre-compute key.
- **Memory**: mảng mở rộng 2x khi đầy; presize {{new PriorityQueue<>(initialCapacity)}} nếu biết K.

### Bên trong: vì sao top-K dùng min-heap
Để giữ **K phần tử lớn nhất**, dùng **min-heap** kích thước K: đỉnh heap là phần tử nhỏ nhất trong K phần tử đang giữ — tức "ngưỡng" để vào top. Phần tử mới lớn hơn đỉnh thì {{poll}} đỉnh rồi {{offer}} phần tử mới (O(log K)); nhỏ hơn thì bỏ qua (O(1)). Tổng chi phí O(n log K), bộ nhớ O(K). Heap lưu trong mảng: con của vị trí i ở 2i+1 và 2i+2, nên không cần object node, rất thân thiện cache. Khởi tạo heap từ một mảng có sẵn (heapify) chỉ O(n) — nhanh hơn chèn từng phần tử.

~~~java
PriorityQueue<Item> top = new PriorityQueue<>(k, Comparator.comparingLong(Item::score));
for (Item it : stream) {
    if (top.size() < k) top.offer(it);
    else if (it.score() > top.peek().score()) { top.poll(); top.offer(it); }
}
~~~

### Ví dụ đời thực
Dashboard "top 100 merchant theo doanh thu 5 phút" ban đầu sort toàn bộ 2 triệu bản ghi mỗi lần làm mới (O(n log n), cấp phát danh sách lớn) — mất 1,8 giây và tạo nhiều rác. Đổi sang min-heap 100 phần tử khi duyệt: 120ms, gần như không cấp phát thêm. Khi hệ thống chia thành 8 node, mỗi node tính top 100 cục bộ rồi gửi về node tổng hợp gộp 800 phần tử — kết quả đúng vì top-K toàn cục chắc chắn nằm trong hợp các top-K cục bộ (với tổng doanh thu đã gộp theo merchant trước).

### Trả lời mẫu khi phỏng vấn
"PriorityQueue là binary heap lưu trong mảng, mặc định là min-heap theo natural ordering hoặc comparator. offer và poll là log n vì phải đẩy phần tử lên hoặc xuống cây, peek là O(1). Iterator của nó không theo thứ tự ưu tiên, muốn có thứ tự thì phải poll lần lượt. Với bài top K trên luồng dữ liệu lớn, tôi giữ một min-heap đúng K phần tử: đỉnh heap là ngưỡng để vào top, phần tử mới lớn hơn đỉnh thì thay đỉnh, nhỏ hơn thì bỏ. Như vậy chi phí là n log K và bộ nhớ chỉ O(K), không phải sort cả dữ liệu. Khi dữ liệu phân tán, mỗi node tính top K cục bộ rồi gộp. PriorityQueue không thread-safe; cần dùng đồng thời thì có PriorityBlockingQueue."

> Senior tip: với top-K thực tế (log analytics, monitoring), dùng {{PriorityQueue}} + stream processing; nếu cần top-K phân tán, mỗi node tính local top-K rồi merge. Với K rất lớn, cân nhắc {{TreeSet}} (O(log n) nhưng memory cao hơn) hoặc approximate algorithm (Count-Min Sketch, t-Digest).`,
  follow: [
    'Vì sao {{PriorityQueue}} dùng min-heap cho bài toán top-K lớn nhất?',
    '{{PriorityBlockingQueue}} khác {{PriorityQueue}} ở đâu?',
    'Khi nào nên dùng {{TreeSet}} thay vì {{PriorityQueue}}?'
  ],
  tags: ['PriorityQueue', 'heap', 'top-K', 'stream'],
  refs: [
    { type: 'doc', title: 'Java Language Specification', url: 'https://docs.oracle.com/javase/specs/' }
  ]
},
{
  id: 'collections-010',
  topic: 'collections',
  level: 'mid',
  q: '{{ArrayDeque}} vs {{Stack}}/{{LinkedList}} làm stack/queue; vì sao {{Stack}} bị khuyên tránh?',
  a: `**Tóm tắt:** {{ArrayDeque}} là lựa chọn hiện đại cho stack/queue: mảng vòng (circular array), O(1) amortized cho push/pop/offer/poll, cache-friendly, không đồng bộ, không cho null; {{Stack}} extends {{Vector}} (sync, legacy), {{LinkedList}} tốn memory và cache miss — đều không khuyến khích.
 
### Stack — legacy, không dùng
- Extends {{Vector}}: mọi method {{synchronized}} ⇒ chi phí lock không cần thiết cho single-thread.
- Kế thừa {{Vector}} kéo theo {{get}}, {{set}}, {{insert}} ở giữa — phá vỡ ngữ nghĩa stack (LIFO).
- {{push}}/{{pop}} đồng bộ hóa từng method, không hỗ trợ atomic batch.
- JavaDoc khuyến nghị: **"A more complete and consistent set of LIFO stack operations is provided by the Deque interface and its implementations."**

### LinkedList — tốn kém cho stack/queue
- Node object riêng: header + 2 reference + data ≈ 32-40 byte/entry (vs 4-8 byte reference trong mảng).
- Pointer chasing: mỗi {{pop}}/{{poll}} truy cập {{next}}/{{prev}} — cache miss nhiều.
- Implement cả {{List}} và {{Deque}}; dùng làm {{Deque}} thì thừa thừa method {{get(i)}}, {{add(i, e)}} O(n).
- Chỉ ưu tiên khi cần {{ListIterator}} xoá giữa O(1) **và** đã có con trỏ tại vị trí.

### ArrayDeque — lựa chọn chuẩn
- Mảng vòng {{Object[] elements}} + {{head}}, {{tail}} index.
- {{push}}/{{addFirst}}/{{offerFirst}}: giảm head, ghi.
- {{pop}}/{{removeFirst}}/{{pollFirst}}: đọc head, tăng head.
- {{offerLast}}/{{pollLast}} tương tự cho queue.
- Resize: mảng gấp đôi khi đầy (copy 2 mảng do vòng).
- **Không cho null** (để phân biệt empty slot và null value).
- **Không thread-safe**: dùng {{ConcurrentLinkedDeque}} hoặc sync ngoài nếu cần.
- Implement {{Deque}}, {{Queue}}, {{Cloneable}}, {{Serializable}}.

### So sánh nhanh
| | Stack | LinkedList | ArrayDeque |
|---|---|---|---|
| Push/Pop | O(1) sync | O(1) | O(1) amortized |
| Memory/entry | ~40 byte (Vector) | ~32-40 byte | 4-8 byte (ref) |
| Cache locality | Tốt (mảng) | Tệ (node) | Rất tốt (mảng) |
| Null allowed | Có | Có | **Không** |
| Thread-safe | Có (sync) | Không | Không |

### Khi nào dùng gì
- Stack/Queue single-thread: **ArrayDeque**.
- Queue đa luồng bounded: **ArrayBlockingQueue**.
- Queue đa luồng unbounded: **LinkedBlockingQueue** (có bound!).
- Cần priority: **PriorityQueue** / **PriorityBlockingQueue**.
- Cần blocking + priority: **PriorityBlockingQueue**.
- Handoff trực tiếp: **SynchronousQueue**.

### Bên trong: mảng vòng của ArrayDeque
{{ArrayDeque}} giữ một mảng và hai chỉ số {{head}}, {{tail}}. {{addFirst}} lùi head (quay vòng về cuối mảng khi xuống dưới 0), {{addLast}} tiến tail; khi head gặp tail, mảng được nhân đôi và các phần tử được sắp lại. Không có node riêng cho từng phần tử, không có khoá, nên push/pop gần như chỉ là một phép gán và một phép tăng chỉ số. {{Stack}} thì kế thừa {{Vector}}: **mọi** method có {{synchronized}}, và vì là {{Vector}} nên lộ cả {{get(i)}}, {{add(i, x)}} — có thể chèn vào giữa "stack", phá vỡ ý nghĩa của cấu trúc dữ liệu.

### Ví dụ đời thực
Một parser biểu thức tính phí (dùng trong mọi request tính giá) dùng {{Stack<Token>}}. Profiler cho thấy khoảng 6% CPU của service nằm trong các lời gọi {{synchronized}} của {{Vector}} không cần thiết, cùng các {{Integer}} boxing. Đổi sang {{ArrayDeque<Token>}} (và mảng {{int[]}} tự quản lý cho stack số): thời gian parse giảm khoảng 40%, CPU service giảm 4%. Code review sau đó thêm quy tắc chặn {{java.util.Stack}} bằng ArchUnit.

### Trả lời mẫu khi phỏng vấn
"Để làm stack hay queue tôi dùng ArrayDeque. Nó là mảng vòng với hai chỉ số đầu và cuối, thêm bớt ở hai đầu là O(1) amortized, không tạo node cho từng phần tử nên tiết kiệm bộ nhớ và thân thiện cache, và không có khoá. Stack thì là lớp legacy kế thừa Vector: mọi method đều synchronized nên tốn chi phí khoá không cần thiết, và vì kế thừa Vector nên lộ cả các method truy cập theo index, có thể chèn vào giữa stack, sai về mặt thiết kế. LinkedList làm được Deque nhưng mỗi phần tử là một node, tốn bộ nhớ và chậm hơn khi duyệt. Lưu ý ArrayDeque không cho phần tử null và không thread-safe; cần dùng đồng thời thì chọn ConcurrentLinkedDeque hoặc một BlockingQueue."

> Senior tip: trong code review, thấy {{new Stack()}} hoặc {{new LinkedList()}} dùng làm stack/queue là cơ hội refactor sang {{ArrayDeque}} — nhanh hơn, nhẹ hơn, API hiện đại ({{push}}/{{pop}}/{{peek}} cho stack, {{offer}}/{{poll}}/{{peek}} cho queue).`,
  follow: [
    'Vì sao {{ArrayDeque}} không cho null trong khi {{LinkedList}} cho phép?',
    '{{ArrayDeque}} resize như thế nào khi mảng vòng đầy?',
    'Khi nào {{ConcurrentLinkedDeque}} thích hợp hơn {{ArrayBlockingQueue}}?'
  ],
  tags: ['ArrayDeque', 'Stack', 'LinkedList', 'Deque', 'Queue']
},
{
  id: 'collections-011',
  topic: 'collections',
  level: 'senior',
  q: '{{List.of}} vs {{Collections.unmodifiableList}} vs copy: immutable thật hay chỉ là view; null và NPE.',
  a: `**Tóm tắt:** {{List.of}} (Java 9+) tạo list **immutable thật** (không thêm/xoá/sửa được, cấm null); {{Collections.unmodifiableList}} chỉ là **view** bao list gốc (list gốc sửa thì view thay đổi); copy thủ công ({{new ArrayList<>(src)}}) tạo bản sao mutable. Chọn theo nhu cầu: immutable API dùng {{List.of}}/{{List.copyOf}}, defensive copy dùng {{new ArrayList<>}}, read-only view dùng {{unmodifiableList}}.
 
### List.of / List.copyOf (Java 9/10)
- {{List.of(a, b, c)}}: immutable, fixed-size, **cấm null** (ném NPE), không hỗ trợ {{add}}/{{remove}}/{{set}}/{{sort}}.
- {{List.copyOf(list)}}: copy bản gốc thành immutable list; nếu list gốc đã immutable thì có thể trả về chính nó (optimization).
- Internal: dùng {{ImmutableCollections.ListN}} (compact, không field thừa), serialization hỗ trợ.
- Null: bất kỳ phần tử null nào ⇒ NPE ngay khi tạo — phát hiện sớm bug data.

### Collections.unmodifiableList
~~~java
List<String> mutable = new ArrayList<>(List.of("a", "b"));
List<String> view = Collections.unmodifiableList(mutable);
mutable.add("c");           // OK
System.out.println(view);   // [a, b, c] — view thấy thay đổi!
~~~
- Chỉ **wrap** list gốc, không copy; method mutating ({{add}}, {{set}}, {{remove}}, {{sort}}) ném {{UnsupportedOperationException}}.
- List gốc vẫn mutable ⇒ view không an toàn nếu list gốc bị chia sẻ và sửa.
- Cho phép null nếu list gốc cho phép.
- Dùng khi: muốn expose read-only view cho caller nhưng nội bộ vẫn cần mutate; hoặc tạm bọc legacy API.

### Copy thủ công
~~~java
List<String> copy = new ArrayList<>(source);   // shallow copy, mutable
List<String> copy = List.copyOf(source);       // immutable copy (Java 10)
~~~
- {{new ArrayList<>(source)}}: shallow copy, hoàn toàn độc lập, mutable, cho phép null.
- Dùng cho defensive copy trong constructor/setter khi cần sở hữu dữ liệu.

### So sánh nhanh
| Tính chất | List.of/copyOf | unmodifiableList | new ArrayList() |
|---|---|---|---|
| Immutable | **Có** | View (gốc mutable) | Không |
| Null allowed | **Không** | Theo list gốc | Có |
| Bản sao hay view | Bản sao | View | Bản sao |
| Memory | Tối ưu (compact) | Wrapper nhẹ | Mảng mới + ref |
| Serialization | Hỗ trợ | Hỗ trợ | Hỗ trợ |

### Pitfall
- Dùng {{List.of}} cho DTO/response mà dữ liệu có null ⇒ NPE lúc runtime; lọc null trước hoặc dùng {{new ArrayList<>}}.
- Truyền {{unmodifiableList}} cho API bên ngoài mà quên list gốc còn bị mutate nội bộ ⇒ caller thấy dữ liệu "immutable" vẫn thay đổi.
- {{List.copyOf(null)}} ném NPE; {{Collections.unmodifiableList(null)}} ném NPE.
- {{List.of}} không implement {{RandomAccess}} (đánh giá tuần tự), nhưng truy cập index O(1) do mảng backing.

### Bên trong: List.of trả về class gì
{{List.of(a, b)}} trả về các class nội bộ được tối ưu theo kích thước ({{ImmutableCollections.List12}} cho 1–2 phần tử, {{ListN}} cho nhiều hơn) — không có mảng dư, không có modCount. Mọi method sửa đổi ném {{UnsupportedOperationException}}. {{List.copyOf(x)}} **không sao chép** nếu x đã là list bất biến kiểu này (trả về chính nó), còn lại tạo bản sao — vì vậy gọi {{copyOf}} nhiều lần ở các tầng gần như miễn phí. {{contains(null)}} trên {{List.of}} ném NPE (cấm null hoàn toàn), khác với {{ArrayList}}. {{Collections.unmodifiableList}} chỉ là lớp bọc chuyển tiếp lời gọi tới list gốc.

### Ví dụ đời thực
Một service quyền truy cập trả {{Collections.unmodifiableList(roles)}} cho các module khác, tin rằng "đã bất biến". Một module khác giữ list này để kiểm tra quyền; trong khi đó service gốc **xoá và nạp lại** {{roles}} khi cấu hình thay đổi → trong khoảng vài mili giây list rỗng, vài request bị từ chối 403 ngẫu nhiên (khoảng 50 lỗi mỗi lần reload). Đổi sang tạo list mới rồi thay reference ({{this.roles = List.copyOf(newRoles)}}, field volatile) — người đọc hoặc thấy list cũ hoặc thấy list mới, không bao giờ thấy trạng thái nửa vời.

### Trả lời mẫu khi phỏng vấn
"List.of tạo list bất biến thật: không thêm, xoá, sửa được, cấm cả phần tử null, và được tối ưu theo kích thước. List.copyOf tạo bản sao bất biến, nếu đầu vào đã là list bất biến thì trả luôn chính nó nên rất rẻ. Collections.unmodifiableList chỉ là một view chỉ đọc bọc list gốc: người cầm view không sửa được, nhưng nếu list gốc bị sửa thì view thấy thay đổi ngay. Còn new ArrayList từ list khác là bản sao có thể sửa. Tôi chọn theo mục đích: API public trả về List.copyOf để bất biến thật, defensive copy ở constructor cũng dùng copyOf, unmodifiableList chỉ khi cố ý muốn người đọc thấy cập nhật mới nhất. Cần chú ý List.of ném NPE với null, kể cả contains null, nên dữ liệu có thể chứa null phải xử lý trước."

> Senior tip: API public trả về collection **luôn dùng {{List.copyOf}}/{{Set.copyOf}}/{{Map.copyOf}}** (Java 10+) để đảm bảo immutable thực sự; nội bộ dùng {{ArrayList}}/{{HashMap}} mutable. Đừng dùng {{unmodifiableList}} cho API public trừ khi có lý do mạnh (performance cực đoan, list lớn, không muốn copy).`,
  follow: [
    'Vì sao {{List.of}} cấm null trong khi {{ArrayList}} cho phép?',
    '{{List.copyOf}} có tối ưu khi list gốc đã immutable không?',
    'Làm sao tạo immutable list có null được (nếu thực sự cần)?'
  ],
  tags: ['List.of', 'unmodifiableList', 'immutable', 'defensive copy'],
  refs: [
    { type: 'doc', title: 'Java Language Specification', url: 'https://docs.oracle.com/javase/specs/' }
  ]
},
{
  id: 'collections-012',
  topic: 'collections',
  level: 'senior',
  q: '{{WeakHashMap}}, {{IdentityHashMap}}: cơ chế và use case thật (cache theo key class, graph traversal).',
  a: `**Tóm tắt:** {{WeakHashMap}} key là {{WeakReference}} — entry tự biến mất khi key không còn strong reference (phù hợp cache metadata theo class/object); {{IdentityHashMap}} dùng {{==}} thay vì {{equals}}/{{hashCode}} (phù hợp graph traversal, object identity). Cả hai không thread-safe.
 
### WeakHashMap
- Entry: key wrap trong {{WeakReference}}, value strong reference.
- GC: khi key chỉ còn weak reference (không ai strong reference tới), GC sẽ clear weak reference ⇒ entry bị xoá ở lần truy cập tiếp theo (hoặc {{expungeStaleEntries}}).
- **Không** tự dọn dẹp ngay lập tức; size() có thể tính entry đang chờ dọn.
- Value **không** được weak — nếu value giữ strong reference ngược về key thì key không bao giờ bị GC.

~~~java
// Cache metadata cho Class (ClassLoader có thể unload)
Map<Class<?>, Meta> cache = new WeakHashMap<>();
Meta getMeta(Class<?> clazz) {
    return cache.computeIfAbsent(clazz, Meta::new);
}
~~~

### Use case WeakHashMap
- **Class/ClassLoader metadata cache**: khi class unload, entry tự dọn.
- **Observer/Listener registry**: listener là key, value là callback; listener GC ⇒ entry tự mất (tránh memory leak).
- **Cache cho object ngắn hạn**: key là object do caller quản lý lifecycle.
- **Không dùng cho**: cache dữ liệu chung (value có thể giữ key), caching nặng (dùng Caffeine/Guava).

### IdentityHashMap
- So sánh key bằng **{{==}}** (identity), không dùng {{equals}}/{{hashCode}}.
- Hash bằng {{System.identityHashCode(key)}} (thường dựa trên address).
- Violation {{Map}} contract (equals/hashCode) — dùng có chủ đích.
- Iterator order không xác định, nhưng ổn định trong một lần duyệt.

### Use case IdentityHashMap
- **Graph traversal**: visited set cho object graph (cycle detection), key là object node — cần identity vì node có thể equals nhau nhưng khác instance.
- **Object-to-metadata mapping**: gắn metadata cho object không kiểm soát {{equals}}/{{hashCode}} (thư viện thứ ba, entity JPA proxy).
- **Serialization/Deep copy**: tracking object đã xử lý.
- **Proxy/Wrapper**: key là proxy instance, equals delegate nhưng identity khác nhau.

### So sánh
| | WeakHashMap | IdentityHashMap |
|---|---|---|
| Key equality | {{equals}} (trên referent) | **{{==}}** (identity) |
| Key reference | {{WeakReference}} | Strong |
| Auto cleanup | Khi key GC | Không |
| Thread-safe | Không | Không |
| Null key | Cho phép | Cho phép |

### Pitfall
- {{WeakHashMap}} size() không chính xác (tính entry stale); dùng {{expungeStaleEntries}} nếu cần.
- {{WeakHashMap}} value giữ key ⇒ leak (circular reference); dùng {{WeakReference}} cho value nếu cần.
- {{IdentityHashMap}} vi phạm contract Map — không dùng cho key có equals/hashCode logic business.
- Cả hai không thread-safe; bọc {{Collections.synchronizedMap}} hoặc dùng concurrent alternative.

> Senior tip: {{WeakHashMap}} là "lưới an toàn" cho metadata cache nhẹ, không thay thế cache production (Caffeine). {{IdentityHashMap}} hiếm dùng nhưng không thể thay thế khi cần identity semantics — đừng cố gắng hack {{equals}}/{{hashCode}} để làm được việc này.`,
  follow: [
    'Vì sao {{WeakHashMap}} value không nên giữ reference ngược về key?',
    '{{IdentityHashMap}} dùng {{System.identityHashCode}} — collision xử lý thế nào?',
    'Khi nào dùng {{WeakHashMap}} thay vì {{ReferenceQueue}} + {{WeakReference}} thủ công?'
  ],
  tags: ['WeakHashMap', 'IdentityHashMap', 'weak reference', 'identity', 'cache'],
  refs: [
    { type: 'doc', title: 'Java Language Specification', url: 'https://docs.oracle.com/javase/specs/' },
    { type: 'doc', title: 'Java Object Specification', url: 'https://docs.oracle.com/javase/8/docs/api/java/lang/Object.html' }
  ]
},
{
  id: 'collections-013',
  topic: 'collections',
  level: 'senior',
  q: 'Sort trong Java: TimSort ổn định, {{Comparator.comparing().thenComparing()}}, {{nullsFirst}}, lỗi "Comparison method violates its general contract".',
  a: `**Tóm tắt:** Java dùng **TimSort** (hybrid merge/insertion) cho {{Arrays.sort}}/{{Collections.sort}} — ổn định (stable), O(n log n) worst-case, O(n) cho mảng gần đã sort; {{Comparator.composing}} cho phép chain so sánh; {{nullsFirst}}/{{nullsLast}} xử lý null an toàn; vi phạm contract (transitivity, symmetry) ném {{IllegalArgumentException}}.
 
### TimSort
- Kết hợp **merge sort** (ổn định, tốt cho run có sẵn) và **insertion sort** (tốt cho mảng nhỏ/gần sort).
- Tìm "run" (dãy đã sort) tự nhiên, merge chúng; tận dụng data gần sort ⇒ O(n) best case.
- **Stable**: phần tử bằng nhau giữ thứ tự tương đối — quan trọng cho multi-key sort (sort bằng key phụ rồi key chính).
- Từ Java 8: {{Arrays.sort}} primitive dùng dual-pivot quicksort (không stable); object arrays dùng TimSort.

### Comparator chain
~~~java
// Sắp xếp: status ASC, createdAt DESC, name ASC
Comparator<Order> cmp = Comparator
    .comparing(Order::getStatus)
    .thenComparing(Order::getCreatedAt, Comparator.reverseOrder())
    .thenComparing(Order::getName, Comparator.nullsFirst(String::compareTo));
orders.sort(cmp);
~~~
- {{comparing}}: key extractor + optional key comparator.
- {{thenComparing}}: chain thêm comparator cho tie-break.
- {{nullsFirst}}/{{nullsLast}}: wrapper cho comparator con, null coi là nhỏ/lớn nhất.

### Comparator tĩnh hữu ích
- {{Comparator.naturalOrder()}}, {{reverseOrder()}}
- {{Comparator.nullsFirst(naturalOrder())}}, {{nullsLast(...)}}
- {{comparingInt}}/{{comparingLong}}/{{comparingDouble}} tránh boxing.

### Lỗi "Comparison method violates its general contract"
- Ném khi TimSort phát hiện comparator **không transitive** hoặc **không symmetric**.
- Nguyên nhân thường gặp:
  1. **Comparator dựa trên field nullable** mà không xử lý null: {{a.getName().compareTo(b.getName())}} ném NPE hoặc vi phạm transitivity khi null xen vào.
  2. **Logic so sánh phức tạp sai**: {{(a, b) -> a.x < b.x ? -1 : 1}} (quên case bằng nhau trả 0).
  3. **So sánh float/double** với NaN: {{Double.compare}} xử lý NaN, nhưng tự viết {{a < b ? -1 : 1}} sai với NaN.

~~~java
// Sai: vi phạm transitivity khi có null
Comparator<Person> bad = (a, b) -> a.getName().compareTo(b.getName());

// Đúng: xử lý null tường minh
Comparator<Person> good = Comparator
    .comparing(Person::getName, Comparator.nullsFirst(String::compareTo));
~~~

### Pitfall
- **Primitive array sort không stable**: {{Arrays.sort(int[])}} dùng quicksort; muốn stable dùng {{Integer[]}} hoặc {{List.sort}}.
- **Comparator không consistent với equals**: {{TreeSet}}/{{TreeMap}} dùng comparator, không dùng {{equals}} — nếu comparator trả 0 cho 2 object khác nhau, TreeSet coi là trùng và loại bỏ.
- **Null trong stream sort**: {{stream.sorted()}} ném NPE nếu phần tử null; dùng {{Comparator.nullsFirst}} hoặc lọc trước.
- **Performance**: comparator phức tạp trong hot path — cache key extractor, tránh lambda capture.

> Senior tip: luôn test comparator với {{Collections.sort}} trên dữ liệu có null, trùng giá trị, và kiểm tra stability bằng cách sort 2 lần với key khác nhau. Với data lớn, dùng {{comparingInt}}/{{comparingLong}} để tránh boxing. Đừng tự viết logic so sánh phức tạp — chain các comparator có sẵn.`,
  follow: [
    'Vì sao TimSort ổn định (stable) quan trọng cho multi-key sort?',
    'Primitive array sort ({{Arrays.sort(int[])}}) không stable — làm sao sort stable cho int?',
    'Làm sao debug lỗi "Comparison method violates its general contract" khi stack trace không rõ dòng nào sai?'
  ],
  tags: ['TimSort', 'Comparator', 'sort', 'stable', 'nullsFirst'],
  refs: [
    { type: 'doc', title: 'Java Language Specification', url: 'https://docs.oracle.com/javase/specs/' }
  ]
},
{
  id: 'collections-014',
  topic: 'collections',
  level: 'lead',
  q: 'Hash collision và tấn công HashDoS; vì sao treeify giúp; thiết kế {{hashCode}} tốt cho composite key.',
  a: `**Tóm tắt:** hash collision là 2 key khác nhau có {{hashCode}} trùng bucket; HashDoS khai thác collision để biến {{HashMap}} O(1) thành O(n) gây DoS; Java 8 **treeify** chuyển bucket dài ≥ 8 thành cây đỏ-đen O(log n); {{hashCode}} tốt cho composite key dùng {{Objects.hash}} hoặc mix bit thủ công (prime multiplier).
 
### Hash collision cơ bản
- {{HashMap}} index = {{(n-1) & spread(hashCode())}}; capacity luỹ thừa 2 ⇒ chỉ dùng bit thấp.
- Collision: 2 key khác bucket nhưng index trùng ⇒ chuỗi linked list (Java 7) hoặc cây (Java 8+).
- Tần suất collision phụ thuộc chất lượng {{hashCode}} và capacity.

### Tấn công HashDoS (Algorithmic Complexity Attack)
- Kẻ tấn công gửi nhiều key gây collision cố ý ({{hashCode}} trả về cùng giá trị hoặc cùng bucket).
- Ví dụ: {{String}} hash = {{s[0]*31^(n-1) + ...}}; có thể tạo nhiều string khác nhau cùng hash.
- Kết quả: {{put}}/{{get}} degrade thành O(n) ⇒ CPU 100%, request timeout.
- Thực tế: tấn công qua JSON payload, form parameter, header — server parse vào {{HashMap}}.

### Treeify (Java 8) — chống HashDoS
- Ngưỡng: bucket size ≥ {{TREEIFY_THRESHOLD = 8}} **VÀ** capacity ≥ {{MIN_TREEIFY_CAPACITY = 64}} ⇒ chuyển linked list → {{TreeNode}} (red-black tree).
- Tìm kiếm trong cây: O(log n) thay vì O(n).
- Nếu capacity < 64: **resize** gấp đôi thay vì treeify (resize làm bucket phân tán lại, có thể giảm collision).
- Untreeify: bucket size ≤ {{UNTREEIFY_THRESHOLD = 6}} ⇒ chuyển lại list.
- Key trong cây so sánh: trước {{hashCode}}, sau {{Comparable}} (nếu implement), cuối {{tieBreakOrder}} (identity hash) để đảm bảo total order.

### Thiết kế hashCode tốt cho composite key
~~~java
// Cách 1: Objects.hash (Java 7+) — tiện nhưng tạo varargs array
@Override public int hashCode() { return Objects.hash(id, name, category); }

// Cách 2: Thủ công (nhanh hơn, không allocation) — Effective Java
@Override public int hashCode() {
    int result = 17;
    result = 31 * result + (id == null ? 0 : id.hashCode());
    result = 31 * result + (name == null ? 0 : name.hashCode());
    result = 31 * result + (category == null ? 0 : category.hashCode());
    return result;
}

// Cách 3: Record (Java 14+) — tự sinh hashCode đúng contract
record Key(Long id, String name, String category) {}
~~~
- Nguyên tắc: **prime multiplier** (31, 37, 1000003) để phân tán bit; mix bit cao xuống thấp ({{h ^ (h >>> 16)}} như {{HashMap.spread}}).
- {{equals}} phải khớp: so sánh cùng các field.
- Immutable field cho key — key mutable trong map là bug.

### Phòng thủ HashDoS production
- Giới hạn request size, parameter count (Spring: {{spring.mvc.max-request-parameters}}).
- Dùng {{ConcurrentHashMap}} (treeify cũng có) hoặc key không do user kiểm soát (UUID, Long).
- Với input user làm key: hash salt (Java 9+ {{String.hashCode}} không salt, nhưng có thể wrap key).
- Monitoring: theo dõi {{HashMap}} bucket size max qua JMX/heap dump.

> Senior tip: HashDoS hiếm nhưng khi xảy ra rất đau; treeify là lưới an toàn cuối, không phải giải pháp gốc. Gốc là: **không bao giờ dùng input user trực tiếp làm key của HashMap/HashSet không giới hạn**. Dùng UUID/Long ID, hoặc giới hạn số entry, hoặc dùng Caffeine/Guava cache có eviction. Với composite key, dùng record — trình biên dịch sinh {{hashCode}}/{{equals}} chuẩn và không bao giờ sai.`,
  follow: [
    'Vì sao treeify threshold là 8 và untreeify là 6 (không dùng cùng ngưỡng)?',
    '{{Objects.hash}} có allocation varargs — khi nào nên viết thủ công?',
    'Làm sao phát hiện HashDoS đang diễn ra trên production?'
  ],
  tags: ['HashDoS', 'hash collision', 'treeify', 'hashCode', 'composite key']
}
,
{
  id: 'modern-001',
  topic: 'modern',
  level: 'senior',
  q: 'Stream có lazy evaluation thế nào? Phân biệt stateful/stateless operation và khi nào parallel stream có hại?',
  a: `**Tóm tắt:** intermediate operation chỉ **xây pipeline**, chưa chạy; terminal operation mới kéo dữ liệu qua. Stateful op ({{sorted}}, {{distinct}}, {{limit}}) phải giữ trạng thái và có thể phải duyệt hết; parallel stream dùng chung {{ForkJoinPool.commonPool}} nên dễ hại khi có I/O, dữ liệu nhỏ, hoặc tác vụ blocking.

### Lazy evaluation
~~~java
Stream<String> s = names.stream()
    .filter(n -> { System.out.println("filter " + n); return n.length() > 3; })
    .map(String::toUpperCase);       // chưa có dòng nào in ra
List<String> out = s.toList();       // terminal -> mới chạy
~~~
- Mỗi phần tử đi qua toàn bộ pipeline trước khi sang phần tử tiếp theo (trừ op stateful), nhờ vậy short-circuit hiệu quả.
- {{findFirst}}, {{anyMatch}}, {{limit}} có thể dừng sớm; {{forEach}} thì không.
- Stream **single-use**: dùng lại ném {{IllegalStateException}}.
- Không có terminal operation ⇒ không có gì chạy; đây là lỗi hay gặp khi quên {{collect}}/{{forEach}}.

### Stateful vs stateless
- **Stateless**: {{filter}}, {{map}}, {{flatMap}}, {{peek}}, {{mapToInt}} — xử lý từng phần tử độc lập.
- **Stateful**: {{distinct}}, {{sorted}}, {{limit}}, {{skip}}, {{takeWhile}}/{{dropWhile}} — cần buffer hoặc biết toàn bộ dữ liệu.
- {{sorted}} trên stream vô hạn sẽ không bao giờ kết thúc; {{distinct}} phải nhớ mọi giá trị đã thấy.
- Stateful op làm parallel kém hiệu quả vì phải đồng bộ/merge; {{limit}} trong parallel đặc biệt tốn kém.

### Parallel stream
- Mặc định dùng {{ForkJoinPool.commonPool()}} với số thread = CPU - 1. Mọi parallel stream trong JVM **chia sẻ** pool này.
- Có hại khi:
  - Tác vụ **blocking** (gọi DB, HTTP, file): thread pool cạn, các stream khác đói; thậm chí deadlock nếu task chờ nhau.
  - Dữ liệu nhỏ: chi phí split/merge/fork lớn hơn lợi ích.
  - Nguồn dữ liệu khó split: {{LinkedList}}, {{Iterator}}, {{Stream.iterate}} — splitting kém.
  - Có stateful op nặng hoặc side effect không thread-safe.
  - Chạy trong môi trường đã có thread pool riêng (web request) — dễ tranh chấp.
- Có lợi khi: dữ liệu lớn, CPU-bound, nguồn split tốt (ArrayList, mảng), op stateless, không blocking.
- Quy tắc ước lượng của Brian Goetz: N * Q > 10.000 (N = số phần tử, Q = chi phí mỗi phần tử) mới đáng parallel.
- Muốn dùng pool riêng: submit vào {{ForkJoinPool}} custom, không đặt {{parallelStream}} trực tiếp trong request thread.

### Pitfall
- {{peek}} để debug có thể không chạy nếu không có terminal op hoặc bị short-circuit.
- Side effect trong {{map}}/{{forEach}} (add vào list ngoài) không an toàn khi parallel; dùng {{collect}}.
- {{Stream.iterate}} vô hạn + {{parallel}} chia rất kém; dùng {{Stream.iterate(seed, hasNext, next)}} (Java 9) hoặc generator phù hợp.
- Quên đóng stream có tài nguyên ({{Files.lines}}, {{Files.list}}) — dùng try-with-resources.

> Senior tip: mặc định viết stream tuần tự cho rõ ràng; chỉ bật parallel khi có benchmark chứng minh và dữ liệu đủ lớn. Trong service web, đừng gọi {{parallelStream}} cho I/O — dùng virtual thread (Java 21) hoặc executor có bound.`,
  follow: [
    'Vì sao {{sorted}} trên stream vô hạn không bao giờ trả về?',
    '{{findFirst}} và {{findAny}} khác nhau thế nào trong parallel?',
    'Làm sao dùng ForkJoinPool riêng cho parallel stream?'
  ],
  tags: ['Stream', 'lazy', 'parallel', 'ForkJoinPool'],
  refs: [
    { type: 'doc', title: 'Java Language Specification', url: 'https://docs.oracle.com/javase/specs/' }
  ]
},
{
  id: 'modern-002',
  topic: 'modern',
  level: 'mid',
  q: '{{Optional}} nên và không nên dùng ở đâu? Phân biệt {{orElse}}/{{orElseGet}}, {{of}}/{{ofNullable}} và các pitfall thường gặp.',
  a: `**Tóm tắt:** {{Optional}} là **kiểu trả về** để buộc caller xử lý "có thể không có"; không dùng làm field, tham số, hay phần tử collection; tránh {{get()}} trần, dùng {{orElseGet}} khi giá trị mặc định đắt, và {{ofNullable}} khi nguồn có thể null.

### Mục đích
- Thay cho việc trả {{null}} để API tự mô tả khả năng vắng mặt.
- Không phải để thay mọi null; nó là tín hiệu ở **biên API**, nhất là khi không có exception tự nhiên.
- Không thiết kế cho hiệu năng cao: mỗi {{Optional}} là một object; escape analysis có thể loại bỏ nhưng không đảm bảo.

### Nên
- Method trả về có thể không có kết quả: {{Optional<User> findById(long id)}}.
- Chuỗi xử lý: {{optional.map(User::email).filter(s -> !s.isBlank()).orElse(DEFAULT)}}.
- {{orElseThrow(() -> new NotFoundException(...))}} để biến vắng mặt thành lỗi rõ ràng.
- {{ifPresent}}, {{ifPresentOrElse}} (Java 9), {{stream()}} (Java 9) để chuyển thành stream.

### Không nên
- **Field** của entity/DTO: không Serializable, khó map JPA/Jackson (cần module), tăng phức tạp; dùng null + validate.
- **Tham số method**: caller phải bọc {{Optional.of(...)}} vô ích; dùng overload hoặc validate null.
- **Collection**: {{List<Optional<T>>}} thường là dấu hiệu nên lọc bỏ null; trả list rỗng thay vì Optional rỗng.
- **Key của Map**: Optional không có hashCode/equals phù hợp ngữ nghĩa? Thực ra có, nhưng dùng làm key là lạm dụng.
- **Primitive**: dùng {{OptionalInt}}/{{OptionalLong}}/{{OptionalDouble}} để tránh boxing, nhưng API này ít được ưa chuộng.

### orElse vs orElseGet
~~~java
// orElse: tham số được tính NGAY, kể cả khi Optional có giá trị
User u1 = opt.orElse(loadFromDb());       // luôn gọi DB -> lãng phí

// orElseGet: supplier chỉ gọi khi rỗng
User u2 = opt.orElseGet(() -> loadFromDb());
~~~
- {{orElse}} nhận giá trị đã có; nếu tạo object/đọc DB thì dùng {{orElseGet}}.
- {{orElseThrow()}} (Java 10) ném {{NoSuchElementException}}; bản có supplier cho exception tùy biến.

### of vs ofNullable
- {{Optional.of(x)}} ném NPE nếu x null — dùng khi chắc chắn không null.
- {{Optional.ofNullable(x)}} cho phép null → {{Optional.empty()}}.
- {{Optional.empty()}} là singleton, dùng khi biết chắc không có.

### Pitfall
- {{opt.get()}} không kiểm tra ⇒ {{NoSuchElementException}}, tương đương null nhưng khó debug hơn. Dùng {{orElseThrow}} với message.
- {{opt.isPresent()}} rồi {{get()}} là code null-check trá hình; ưu tiên {{map}}/{{ifPresent}}.
- So sánh {{opt == Optional.empty()}} sai; dùng {{isEmpty()}} (Java 11) hoặc {{isPresent()}}.
- {{Optional}} trong entity JPA gây lỗi mapping; trong Jackson cần {{Jdk8Module}}.
- Lạm dụng {{Optional}} cho mọi thứ làm code rối và chậm; đôi khi trả null có kiểm soát + {{@Nullable}} lại thực dụng hơn.

### Bên trong: chi phí của Optional
{{Optional}} là một object thật (khoảng 16 byte) trừ {{Optional.empty()}} là singleton. Trả về Optional từ method nóng tạo rác mỗi lần gọi — thường JIT loại bỏ được nhờ escape analysis nếu method được inline, nhưng không phải lúc nào cũng vậy. {{Optional}} **không Serializable** (cố ý), nên đặt làm field của entity/DTO làm hỏng serialization và một số framework. Với kiểu nguyên thuỷ, dùng {{OptionalInt}}/{{OptionalLong}} để tránh boxing. Từ Java 9 có {{or()}}, {{ifPresentOrElse()}}, {{stream()}}; Java 10 có {{orElseThrow()}} không tham số — tên rõ ràng hơn {{get()}}.

### Ví dụ đời thực
Một service tính khuyến mãi viết {{repo.findById(id).orElse(loadDefaultPromotion())}} — {{loadDefaultPromotion()}} gọi DB và API đối tác. Vì {{orElse}} **luôn** tính tham số, mỗi request (kể cả khi đã tìm thấy khuyến mãi) đều gọi thêm DB và API: 3.000 lời gọi thừa mỗi phút, đối tác cảnh báo vượt hạn mức. Đổi sang {{orElseGet(this::loadDefaultPromotion)}}: lời gọi tới đối tác giảm 92%, p99 giảm 70ms. Sau đó team thêm rule Sonar cảnh báo {{orElse}} với tham số là lời gọi method.

### Trả lời mẫu khi phỏng vấn
"Optional được thiết kế làm kiểu trả về để buộc caller xử lý trường hợp không có giá trị, ví dụ repository findById. Tôi không dùng nó làm field, vì nó không Serializable và làm phức tạp entity, DTO; không dùng làm tham số, vì caller vẫn có thể truyền null; và không bọc collection, vì list rỗng đã diễn đạt được việc không có gì. orElse luôn tính giá trị mặc định kể cả khi Optional có giá trị, còn orElseGet chỉ gọi supplier khi rỗng, nên giá trị mặc định đắt như gọi DB thì phải dùng orElseGet. of ném NPE nếu truyền null, ofNullable thì chấp nhận null. Tôi tránh get trần, dùng orElseThrow với exception có ý nghĩa, và với chuỗi xử lý thì dùng map, flatMap, filter thay vì isPresent rồi get."

> Senior tip: dùng {{Optional}} ở tầng service/repository, còn ở tầng controller/DTO hãy chuyển về giá trị hoặc lỗi rõ ràng. Đừng bọc Optional quanh collection — trả {{List.of()}} rỗng để caller không phải xử lý hai tầng "không có".`,
  follow: [
    'Vì sao {{Optional}} không nên làm field của entity JPA?',
    '{{Optional.stream()}} dùng để làm gì?',
    'Khi nào trả null tốt hơn trả {{Optional}}?'
  ],
  tags: ['Optional', 'orElse', 'ofNullable', 'API design']
},
{
  id: 'modern-003',
  topic: 'modern',
  level: 'senior',
  q: 'Record có những đặc điểm gì? Compact constructor hoạt động ra sao, và record có làm DTO/JPA entity được không?',
  a: `**Tóm tắt:** record là class **final**, bất biến theo khai báo, tự sinh accessor/{{equals}}/{{hashCode}}/{{toString}}, có canonical constructor; compact constructor dùng để validate/chuẩn hoá; record rất hợp làm DTO/value object nhưng **không** hợp làm JPA entity.

### Đặc điểm
- Khai báo {{record Point(int x, int y)}} sinh:
  - field {{private final}} cho từng component.
  - accessor {{x()}}, {{y()}} (không phải {{getX()}}).
  - {{equals}}/{{hashCode}} theo tất cả component; {{toString}} dạng {{Point[x=1, y=2]}}.
  - canonical constructor nhận đủ component.
- Không thể kế thừa class khác (đã final), nhưng **implement interface** được; có thể có static field/method, instance method phụ.
- Không có setter; "sửa" bằng cách tạo record mới.
- Serialization của record dùng canonical constructor và component, không dùng cơ chế field mặc định; không cần {{serialVersionUID}} (nhưng có thể khai báo).
- Record pattern (Java 21) cho phép destructure trong {{instanceof}}/switch.

### Compact constructor
~~~java
record Range(int lo, int hi) {
    Range {                          // không có danh sách tham số
        if (lo > hi) throw new IllegalArgumentException("lo > hi");
        // gán ngầm vào field sau khi validate
    }
}
record Order(String id, List<Item> items) {
    Order {
        Objects.requireNonNull(id);
        items = List.copyOf(items);   // defensive copy cho component mutable
    }
}
~~~
- Compact constructor chạy **trước** khi field được gán; có thể reassign tham số để chuẩn hoá.
- Không được truy cập {{this}} trước khi gán; không gọi method instance.
- Có thể khai báo canonical constructor đầy đủ nếu cần, hoặc constructor phụ gọi {{this(...)}}.

### DTO
- Rất tốt: ít boilerplate, bất biến, dễ đọc, {{equals}} đúng.
- Jackson hỗ trợ record từ 2.12 (cần {{jackson-databind}} mới); nhiều thư viện mapping hỗ trợ.
- Bean Validation: annotation trên component được áp dụng (cần cấu hình phù hợp).
- Hạn chế: không có kế thừa, không có default value trực tiếp (phải qua constructor phụ), một số framework cũ yêu cầu no-arg constructor/getter.
- Với DTO lớn, record vẫn ổn; nhưng nếu cần mutate dần khi build, dùng builder + class thường.

### JPA entity
- **Không nên**: JPA yêu cầu no-arg constructor (có thể protected), field không final, proxy cho lazy loading cần subclass (Hibernate tạo proxy), dirty checking dựa trên snapshot field mutable.
- Record là final nên Hibernate không tạo proxy được; accessor không theo chuẩn getter; field final không set được khi load.
- Hibernate 6 có hỗ trợ record cho một số trường hợp ({{@Embeddable}}, projection) nhưng entity vẫn nên là class thường.
- Có thể dùng record làm **projection** trong JPQL constructor expression hoặc interface projection; rất tiện cho read-only.
- Với DTO từ entity, map thủ công hoặc MapStruct.

### Pitfall
- Record không tự deep-copy component mutable; phải {{List.copyOf}} trong compact constructor.
- {{equals}} của record dùng tất cả component; nếu có field cache/derived, đừng thêm vào record.
- Không dùng record cho object cần thay đổi nhiều lần (builder pattern phù hợp hơn).
- Reflection/serialization framework cũ có thể không nhận record.

> Senior tip: dùng record cho **value object và DTO**, còn entity JPA giữ class thường. Trong compact constructor, luôn validate và copy collection; đây là nơi duy nhất đảm bảo bất biến thực sự.`,
  follow: [
    'Vì sao Hibernate không tạo proxy được cho record?',
    'Compact constructor khác canonical constructor ở điểm nào?',
    'Record pattern (Java 21) giúp gì khi xử lý dữ liệu lồng nhau?'
  ],
  tags: ['record', 'compact constructor', 'DTO', 'JPA'],
  refs: [
    { type: 'doc', title: 'Java Language Specification', url: 'https://docs.oracle.com/javase/specs/' }
  ]
},
{
  id: 'modern-004',
  topic: 'modern',
  level: 'senior',
  q: 'Sealed class và pattern matching for switch (Java 21) hoạt động thế nào? Exhaustiveness đảm bảo gì và có pitfall gì?',
  a: `**Tóm tắt:** {{sealed}} giới hạn tập class con được phép kế thừa, giúp mô hình hoá **algebraic data type**; switch pattern (Java 21) cho phép match theo kiểu + guard và compiler kiểm tra **exhaustive** nếu hierarchy sealed, nhưng vẫn cần xử lý {{null}} và cẩn thận khi thêm subtype mới.

### Sealed
~~~java
sealed interface Shape permits Circle, Square, Triangle {}
record Circle(double r) implements Shape {}
record Square(double side) implements Shape {}
record Triangle(double a, double b, double c) implements Shape {}
~~~
- Subclass phải {{final}}, {{sealed}} hoặc {{non-sealed}}.
- Subclass phải nằm cùng module (hoặc cùng package nếu unnamed module) với sealed type.
- Có thể dùng {{permits}} tường minh hoặc để compiler suy ra từ các class cùng file.
- Lợi ích: đóng tập kiểu, cho phép compiler kiểm tra đầy đủ, tài liệu hoá domain.

### Pattern matching for switch
~~~java
double area(Shape s) {
    return switch (s) {
        case Circle c            -> Math.PI * c.r() * c.r();
        case Square q            -> q.side() * q.side();
        case Triangle t          -> heron(t);
        // không cần default vì Shape sealed và đã phủ hết
    };
}
~~~
- Java 21 cho phép switch trên bất kỳ reference type, kết hợp type pattern, record pattern, guard {{when}}.
- {{case null}} có thể khai báo riêng; nếu không, switch pattern ném NPE khi selector null (khác switch cũ trên String cũng NPE).
- Thứ tự case quan trọng: case cụ thể phải trước case tổng quát, nếu không compiler báo lỗi "dominated".
- {{when}} guard: {{case Circle c when c.r() > 10 -> ...}}.
- Record pattern lồng: {{case Point(int x, int y) -> ...}}; có thể destructure sâu.
- Exhaustiveness: với sealed hierarchy, compiler biết mọi subtype và bắt buộc phủ hết; với interface không sealed, cần {{default}}.

### Exhaustiveness đảm bảo gì
- Nếu thêm một subtype mới vào sealed interface, **mọi switch thiếu case sẽ lỗi compile** — đây là lợi ích lớn so với visitor/if-else, giúp refactor an toàn.
- Với switch expression, thiếu case là lỗi compile (không như switch statement cũ).
- Tuy nhiên, exhaustiveness chỉ đúng khi hierarchy thực sự sealed và compiler thấy hết subtype; nếu dùng {{non-sealed}} thì mất tính chất này.

### Pitfall
- {{null}}: quên xử lý ⇒ NPE runtime; thêm {{case null -> ...}} nếu dữ liệu có thể null.
- Thứ tự case: pattern tổng quát đứng trước làm case sau không bao giờ chạy, compiler báo lỗi nhưng đôi khi thông báo khó hiểu.
- Sealed không ngăn được việc dùng reflection/unsafe, nhưng trong code thường ngày đủ tốt.
- Preview: pattern matching switch là preview ở 17-20, **final từ 21**; nếu build bằng 17 phải bật {{--enable-preview}} và không dùng được trong production (preview không tương thích).
- Từ Java 21, switch **statement** dùng pattern hoặc {{case null}} cũng bắt buộc exhaustive; chỉ switch statement kiểu cũ (hằng enum/String/int) mới được phép thiếu case mà vẫn compile — nên ưu tiên switch expression để luôn được kiểm tra.
- Không lạm dụng sealed cho mọi interface: chỉ dùng khi tập subtype thực sự đóng và bạn kiểm soát được.

> Senior tip: sealed + record + switch exhaustive là bộ ba thay thế visitor pattern rất gọn cho domain ít thay đổi. Nhưng nếu domain mở cho plugin bên ngoài, đừng sealed — bạn sẽ chặn việc mở rộng.`,
  follow: [
    'Vì sao switch pattern trên sealed type không cần {{default}}?',
    '{{non-sealed}} dùng khi nào và ảnh hưởng gì tới exhaustiveness?',
    'Switch pattern xử lý {{null}} khác switch trên String thế nào?'
  ],
  tags: ['sealed', 'pattern matching', 'switch', 'Java 21'],
  refs: [
    { type: 'doc', title: 'Java Language Specification', url: 'https://docs.oracle.com/javase/specs/' }
  ]
},
{
  id: 'modern-005',
  topic: 'modern',
  level: 'lead',
  q: 'Từ Java 8 lên 21, tính năng nào đáng giá nhất khi nâng cấp hệ thống? Lộ trình migrate 8 → 17/21 nên làm thế nào?',
  a: `**Tóm tắt:** giá trị lớn nhất là **GC/performance** (G1 mặc định, ZGC), **ngôn ngữ** (record, sealed, pattern matching, switch expression, text block), **runtime** (virtual thread ở 21, strong encapsulation), và **bảo mật/vòng đời**; migrate nên theo bước 8 → 11 → 17 → 21, chạy test + jdeps, xử lý reflection/module trước khi đổi LTS.

### Tính năng đáng giá
- **Java 9**: collection factory {{List.of}}/{{Map.of}}, {{Optional}} bổ sung, private interface method, try-with-resources với biến effectively final, module system (có thể chưa dùng ngay).
- **Java 10**: {{var}} cho local.
- **Java 11 (LTS)**: {{String.isBlank}}/{{strip}}/{{lines}}/{{repeat}}, {{Files.readString}}, HTTP Client chuẩn, chạy single-file {{java Foo.java}}, {{Optional.isEmpty}}.
- **Java 14-16**: switch expression, text block, record, {{instanceof}} pattern, {{helpful NullPointerException}} (rất hữu ích debug).
- **Java 17 (LTS)**: sealed class, strong encapsulation mặc định, bỏ SecurityManager dần, nhiều cải tiến GC.
- **Java 21 (LTS)**: **virtual thread** (JEP 444), pattern matching for switch, record pattern, sequenced collection ({{getFirst}}/{{getLast}}/{{reversed}}), generational ZGC, key encapsulation API.
- **GC**: G1 mặc định từ 9; ZGC (11+) và Shenandoah cho pause thấp; Epsilon cho benchmark. Từ 21, ZGC generational cải thiện throughput.
- **Khác**: Compact Strings (9), AppCDS mặc định (12+), container awareness (10+), TLS 1.3, cải thiện startup.

### Vì sao nâng cấp
- Bảo mật: bản cũ không còn nhận patch.
- Hiệu năng: GC và JIT tốt hơn; G1/ZGC giảm pause.
- Hệ sinh thái: Spring Boot 3 yêu cầu Java 17; nhiều thư viện mới bỏ hỗ trợ 8.
- Virtual thread giảm chi phí thread cho I/O, đơn giản hoá code blocking.

### Lộ trình migrate
1. **Đo baseline**: test suite, JMH, heap/GC log, dependency tree.
2. **8 → 11**: chạy {{jdeps --jdk-internals}}, thay API bị bỏ (JAXB, JAX-WS, CORBA, Nashorn), cập nhật TLS, xử lý {{--illegal-access}} (11 còn cho phép, 17 thì chặt).
3. **11 → 17**: dọn reflection vào JDK internals ({{--add-opens}}), nâng Spring Boot 3 nếu dùng, kiểm tra thư viện bytecode (Lombok, CGLIB, Mockito) tương thích.
4. **17 → 21**: tận dụng pattern matching/record, thử virtual thread ở nơi I/O-bound nhưng **đo lại** (pin carrier thread với synchronized trước Java 24; connection pool cần điều chỉnh).
5. **CI**: chạy song song JDK cũ/mới, test integration, smoke test trên staging với tải thật.
6. **Rollout**: container image mới, có thể blue-green; theo dõi GC, latency p99, memory.

### Pitfall
- Nhảy thẳng 8 → 21 làm gỡ lỗi khó hơn nhiều; đi từng LTS giúp khoanh vùng.
- Reflection/bytecode instrumentation (agent APM, Lombok cũ) là chỗ vỡ nhiều nhất.
- Thư viện cũ dùng {{sun.misc.Unsafe}}: vẫn chạy ở 17/21, nhưng các method truy cập bộ nhớ bị deprecate for removal từ Java 23 (JEP 471) và in cảnh báo runtime từ 24 (JEP 498); nên lên kế hoạch chuyển sang {{VarHandle}}/FFM API.
- Virtual thread không nhanh hơn cho CPU-bound; đừng thay toàn bộ thread pool.
- {{--add-opens}} là giải pháp tạm; hãy sửa code/thư viện.
- Kiểm tra TLS, chứng chỉ, và độ tương thích của driver DB.

> Senior tip: hãy coi migrate JDK là dự án có kế hoạch, không phải đổi version trong pom. Bắt đầu bằng việc chạy test trên JDK mới trong CI **trước khi** đổi production; dùng jdeprscan để tìm API sắp bỏ và OpenRewrite để tự động hoá một phần.`,
  follow: [
    'Vì sao nên đi qua từng LTS thay vì nhảy thẳng 8 → 21?',
    'Virtual thread giải quyết vấn đề gì và không giải quyết vấn đề gì?',
    'Strong encapsulation từ Java 17 ảnh hưởng thư viện cũ ra sao?'
  ],
  tags: ['Java 21', 'migration', 'LTS', 'virtual threads']
},
{
  id: 'modern-006',
  topic: 'modern',
  level: 'mid',
  q: '{{var}}, text block và switch expression: lợi ích thực tế và pitfall cần tránh là gì?',
  a: `**Tóm tắt:** {{var}} giảm boilerplate nhưng chỉ dùng cho local và nên giữ tên biến rõ nghĩa; text block viết chuỗi nhiều dòng dễ đọc, cần hiểu quy tắc bỏ indentation; switch expression trả giá trị, không fallthrough, và bắt buộc exhaustive.

### var (Java 10)
- Suy luận kiểu lúc compile từ initializer; không phải dynamic typing, không có chi phí runtime.
- Chỉ dùng cho **biến local**, cả trong for/foreach, try-with-resources; không dùng cho field, tham số, return type.
- Không dùng khi không có initializer: {{var x;}} sai; {{var x = null;}} cũng sai.
- Nên dùng khi kiểu dài và lộ rõ từ vế phải: {{var users = new ArrayList<User>();}}, {{var entry = map.entrySet().iterator().next();}}.
- Không nên khi kiểu không rõ: {{var result = service.process();}} — người đọc phải nhảy vào method. Ưu tiên tên biến mô tả kiểu hoặc giữ kiểu tường minh.
- Pitfall: {{var}} với anonymous class vẫn giữ được kiểu anonymous (khác diamond), nhưng hiếm dùng; {{var}} cho tham số lambda (Java 11) chủ yếu để gắn annotation, ví dụ {{(@NonNull var s) -> s.length()}}.
- Không ảnh hưởng API công khai; đừng lạm dụng để code ngắn mà khó đọc.

### Text block (Java 15)
~~~java
String sql = """
        SELECT id, name
        FROM users
        WHERE active = true
        ORDER BY name
        """;
~~~
- Mở bằng ba dấu nháy kép + xuống dòng bắt buộc; đóng bằng ba dấu nháy kép.
- **Incidental whitespace** (indentation chung nhỏ nhất + whitespace cuối dòng) được bỏ; dùng semantics của {{stripIndent}}.
- Ký tự cuối trước dấu đóng ảnh hưởng newline cuối; cần cẩn thận khi so sánh.
- Escape vẫn hoạt động; có {{ \\s }} để giữ space cuối; không cần escape dấu nháy kép đơn lẻ.
- Có {{formatted}} hoặc {{String.format}}; không có interpolation trực tiếp (String template đã rút khỏi 23).
- Rất hợp SQL/JSON/HTML/XML; nhưng **đừng** ghép dữ liệu người dùng vào SQL text block — vẫn dùng PreparedStatement.

### Switch expression (Java 14)
~~~java
String label = switch (status) {
    case ACTIVE, PENDING -> "mo";
    case CLOSED -> "dong";
    case null -> "khong ro";         // case null cần Java 21
    default -> "khac";
};
~~~
- Dùng {{->}} không fallthrough, không cần {{break}}; có thể dùng block + {{yield}}.
- Bắt buộc bao phủ hết (exhaustive) cho expression; enum/String phải có default nếu không đủ.
- Selector null: ném NPE nếu không có {{case null}} (với switch trên reference type).
- Có thể trả giá trị trực tiếp, giảm biến tạm và lỗi gán thiếu nhánh.
- Switch statement vẫn có thể dùng cú pháp cũ; nên chuyển dần sang arrow để tránh fallthrough.
- Với enum, thêm hằng số mới mà quên case sẽ lỗi compile ở switch expression — lợi ích lớn khi refactor.

### Pitfall chung
- {{var}} làm code khó đọc khi kiểu quan trọng cho người review; đừng dùng ở API public.
- Text block giữ indentation bất ngờ nếu dấu đóng đặt sai cột; dùng IDE format và test chuỗi.
- Switch expression trên {{null}} khác switch cũ; nếu dữ liệu có thể null, thêm {{case null}} hoặc kiểm tra trước.
- Đừng dùng text block để build câu SQL động; đó là lỗi bảo mật, không phải lỗi style.

> Senior tip: dùng text block cho SQL/JSON cố định trong test hoặc query, còn dữ liệu động vẫn bind qua placeholder. Với {{var}}, quy ước nội bộ nên là: dùng khi vế phải đã nói rõ kiểu, tránh khi gọi method trả về kiểu phức tạp.`,
  follow: [
    'Vì sao {{var}} không dùng được cho field hay tham số?',
    'Text block bỏ indentation theo quy tắc nào?',
    'Switch expression xử lý enum thiếu case ra sao?'
  ],
  tags: ['var', 'text block', 'switch expression', 'Java 15']
},
{
  id: 'modern-007',
  topic: 'modern',
  level: 'mid',
  q: 'Functional interface, lambda capture "effectively final" và method reference hoạt động thế nào? Có pitfall gì?',
  a: `**Tóm tắt:** functional interface có đúng **một** abstract method (SAM); lambda chỉ capture biến local **effectively final** (không gán lại) và capture theo giá trị; method reference là cú pháp gọn cho lambda, nhưng có thể gây nhập nhằng hoặc boxing nếu không để ý.

### Functional interface
- Interface có một abstract method, ví dụ {{Runnable}}, {{Comparator<T>}}, {{Function<T,R>}}, {{Predicate<T>}}.
- {{@FunctionalInterface}} chỉ là kiểm tra compile, không bắt buộc.
- Có thể có default/static method; chúng không tính vào SAM.
- Lambda không tạo class mới cho mỗi biểu thức: compiler dùng {{invokedynamic}} + {{LambdaMetafactory}} để sinh implementation, thường nhẹ hơn anonymous class.
- Có thể dùng method reference ở mọi nơi cần functional interface.

### Lambda capture
- Lambda capture biến local bằng **giá trị** tại thời điểm tạo; biến phải **effectively final** (không bị gán lại sau khi khởi tạo).
- Field của enclosing object thì không bị ràng buộc này; lambda giữ {{this}} và đọc field qua đó (nên field có thể thay đổi).
- {{this}} trong lambda trỏ **enclosing instance**, khác anonymous class (trong anonymous class {{this}} là instance của anonymous class).
- Không thể dùng {{break}}/{{continue}} nhảy ra ngoài lambda; {{return}} trong lambda là return của lambda.
- Vòng lặp tạo nhiều lambda capture biến đổi → lỗi compile; dùng biến local mới trong mỗi vòng.

~~~java
int base = 10;                 // không gán lại -> OK
Function<Integer, Integer> f = x -> x + base;

int count = 0;
// count++;                    // nếu gán lại thì lambda dưới không compile
Runnable r = () -> System.out.println(count);

String prefix = "ID-";
List<String> ids = items.stream()
    .map(s -> prefix + s)      // capture prefix
    .toList();
~~~

### Method reference
- 4 dạng: static ({{Integer::parseInt}}), instance của object cụ thể ({{System.out::println}}), unbound instance ({{String::length}} tương đương {{s -> s.length()}}), constructor ({{ArrayList::new}}).
- Ưu điểm: ngắn, rõ khi method đã có tên tốt.
- Nhược điểm: có thể khó hiểu khi chain dài; đôi khi lambda rõ hơn (nhất là khi cần đặt tên tham số).
- Nhập nhằng: overload có thể làm method reference không compile; phải chỉ rõ kiểu hoặc dùng lambda.
- Boxing: {{Function<Integer,Integer> f = x -> x + 1}} vẫn boxing; dùng {{IntUnaryOperator}} nếu cần tránh.
- Method reference không tự truyền thêm tham số; với method cần state, phải bind trước.

### Pitfall
- Capture biến mutable bằng cách tạo mảng một phần tử hoặc {{AtomicInteger}} — chạy được nhưng dễ sinh race; ưu tiên thiết kế lại.
- Lambda trong vòng lặp capture biến vòng lặp (biến đổi) → lỗi compile; copy ra biến local.
- Checked exception không đi qua functional interface chuẩn; phải wrap hoặc viết interface riêng.
- Serializability: lambda chỉ serializable nếu target type là {{Serializable}}; không nên dựa vào.
- {{peek}}/{{forEach}} với side effect trong parallel không an toàn.
- Method reference tới method có side effect ẩn có thể gây bất ngờ; đọc kỹ.

> Senior tip: dùng method reference khi nó làm code dễ đọc hơn, nhưng đừng ép; một lambda có tên tham số rõ đôi khi tốt hơn {{Foo::bar}}. Và với hot path, cân nhắc functional interface primitive chuyên dụng để tránh boxing.`,
  follow: [
    'Vì sao biến local capture phải effectively final?',
    '{{this}} trong lambda và anonymous class khác nhau thế nào?',
    'Khi nào method reference gây nhập nhằng overload?'
  ],
  tags: ['lambda', 'functional interface', 'method reference', 'effectively final']
},
{
  id: 'modern-008',
  topic: 'modern',
  level: 'senior',
  q: '{{Collectors.groupingBy}}/{{toMap}} có những pitfall gì (duplicate key, null value) và cách xử lý đúng?',
  a: `**Tóm tắt:** {{toMap}} ném {{IllegalStateException}} khi key trùng và NPE khi value null; {{groupingBy}} ném NPE khi classifier trả null; cách xử lý là cung cấp merge function, lọc null trước, hoặc dùng downstream phù hợp.

### toMap
~~~java
// sai: trùng key -> IllegalStateException
Map<String, User> byEmail = users.stream()
    .collect(Collectors.toMap(User::email, u -> u));

// đúng: chọn bản ghi thắng
Map<String, User> byEmail = users.stream()
    .collect(Collectors.toMap(
        User::email,
        u -> u,
        (a, b) -> b,              // hoặc merge theo updatedAt
        LinkedHashMap::new));     // giữ thứ tự nếu cần
~~~
- Key trùng: bản không có merge function ném {{IllegalStateException}} ("Duplicate key ...", từ Java 9 kèm cả hai value).
- Value null: **NPE** — bản 2 tham số kiểm tra {{requireNonNull(value)}}, bản có merge function dùng {{Map.merge}} vốn cấm value null; lọc bằng {{filter(Objects::nonNull)}} hoặc thay bằng sentinel.
- Key null: {{HashMap}} vẫn nhận (hash của null là 0) nhưng {{ConcurrentHashMap}} thì không; đừng dựa vào key null, hãy lọc hoặc đảm bảo key không null.
- Không có merge function thì không thể biết giữ bản nào; đừng bỏ qua lỗi này bằng cách nuốt exception.

### groupingBy
- {{groupingBy(classifier)}} trả {{Map<K, List<T>>}}; classifier trả null ⇒ NPE (do {{computeIfAbsent}}/key null).
- Downstream: {{counting()}}, {{mapping()}}, {{summingInt()}}, {{averagingInt()}}, {{joining()}}, {{toSet()}}, {{collectingAndThen()}}.
- Muốn map con là {{Set}} hoặc kiểu khác: truyền downstream {{toSet()}}, {{toMap()}}...
- Muốn giữ thứ tự: {{groupingBy(classifier, LinkedHashMap::new, downstream)}}.
- Muốn sắp xếp: {{TreeMap::new}}; nhưng nhớ comparator/equals consistency.
- {{partitioningBy}} chỉ chia hai nhóm true/false, luôn có cả hai key.

### Các collector hữu ích
- {{teeing}} (Java 12): kết hợp hai collector, ví dụ vừa đếm vừa tính trung bình.
- {{flatMapping}} (Java 9): flatten collection trong downstream.
- {{filtering}} (Java 9): lọc trước khi collect downstream.
- {{collectingAndThen}}: biến đổi kết quả cuối (ví dụ wrap unmodifiable).

### Pitfall
- Dùng {{toMap}} rồi ngạc nhiên vì mất dữ liệu: thực ra nó ném exception, nhưng nếu có merge function trả sai thì mất âm thầm.
- {{groupingBy}} với classifier null: dữ liệu bẩn làm nổ toàn bộ pipeline; lọc trước.
- Value null trong downstream {{toMap}} vẫn NPE; kiểm tra kỹ.
- Dùng {{HashMap}} mặc định rồi phụ thuộc thứ tự: kết quả không đảm bảo; dùng {{LinkedHashMap}}/{{TreeMap}}.
- Song song: collector **không** cần container thread-safe (mỗi thread có container riêng rồi gộp bằng combiner), nhưng supplier/accumulator/combiner tự viết phải đúng và không dùng state chia sẻ.
- Tránh side effect trong classifier/downstream; collector nên là hàm thuần.

> Senior tip: khi map dữ liệu từ DB, luôn giả định key có thể trùng và value có thể null; viết merge function rõ ràng (ví dụ giữ bản mới nhất theo timestamp) thay vì để exception nổ ở production. Và với báo cáo, dùng {{LinkedHashMap}}/{{TreeMap}} để thứ tự ổn định giữa các lần chạy.`,
  follow: [
    'Vì sao {{toMap}} ném NPE khi value null?',
    'Làm sao group theo nhiều tiêu chí lồng nhau?',
    '{{teeing}} dùng trong tình huống nào?'
  ],
  tags: ['Collectors', 'groupingBy', 'toMap', 'Stream'],
  refs: [
    { type: 'doc', title: 'Java Language Specification', url: 'https://docs.oracle.com/javase/specs/' }
  ]
},
{
  id: 'modern-009',
  topic: 'modern',
  level: 'senior',
  q: '{{SequencedCollection}} / {{SequencedMap}} (Java 21): giải quyết vấn đề gì, {{getFirst}}/{{getLast}}/{{reversed}}.',
  a: `**Tóm tắt:** Java 21 thêm interface {{SequencedCollection}} và {{SequencedMap}} để thống nhất API truy cập đầu/cuối và đảo ngược cho các collection có thứ tự ({{List}}, {{Deque}}, {{LinkedHashSet}}, {{LinkedHashMap}}, {{TreeSet}}, {{TreeMap}}); trước đây mỗi loại có method riêng ({{getFirst}}/{{getLast}}, {{first}}/{{last}}, {{peekFirst}}/{{peekLast}}).
 
### Vấn đề trước Java 21
| Collection | First | Last | Reversed |
|---|---|---|---|
| {{List}} | {{get(0)}} | {{get(size-1)}} | {{Collections.reverse}} (mutate) hoặc {{ListIterator}} |
| {{Deque}} | {{getFirst}}/{{peekFirst}} | {{getLast}}/{{peekLast}} | {{descendingIterator}} |
| {{LinkedHashSet}} | Không có | Không có | Không có |
| {{SortedSet}}/{{TreeSet}} | {{first}} | {{last}} | {{descendingSet}} |
| {{LinkedHashMap}} | Không có | Không có | Không có |
| {{SortedMap}}/{{TreeMap}} | {{firstKey}} | {{lastKey}} | {{descendingMap}} |

- API không thống nhất, khó viết code generic cho "collection có thứ tự".
- {{Collections.reverse}} mutate list gốc; muốn view reversed phải tự viết wrapper.

### SequencedCollection (extends Collection)
- {{getFirst()}} / {{getLast()}}: lấy phần tử đầu/cuối (ném {{NoSuchElementException}} nếu rỗng).
- {{addFirst(E)}} / {{addLast(E)}}: thêm đầu/cuối (optional, {{UnsupportedOperationException}} nếu immutable).
- {{removeFirst()}} / {{removeLast()}}: xoá đầu/cuối (optional).
- {{reversed()}}: trả **view** đảo ngược (read-only, không copy, thay đổi gốc ảnh hưởng view).

~~~java
List<String> list = new ArrayList<>(List.of("a", "b", "c"));
list.getFirst();           // "a"
list.getLast();            // "c"
for (String s : list.reversed()) { ... }  // c, b, a
~~~

### SequencedMap (extends Map)
- {{firstEntry()}} / {{lastEntry()}}: {{Map.Entry}} đầu/cuối.
- {{firstKey()}} / {{lastKey()}}: key đầu/cuối.
- {{putFirst}}, {{putLast}}: thêm đầu/cuối (optional).
- {{reversed()}}: view đảo ngược (entry set reversed).
- {{sequencedKeySet()}}, {{sequencedValues()}}, {{sequencedEntrySet()}}: view có thứ tự.

~~~java
LinkedHashMap<String, Integer> map = new LinkedHashMap<>();
map.put("a", 1); map.put("b", 2);
map.firstKey();           // "a"
map.lastEntry();          // b=2
for (var e : map.reversed().entrySet()) { ... }  // b=2, a=1
~~~

### Implementer chính
- {{List}}, {{ArrayList}}, {{LinkedList}}, {{Vector}}, {{Stack}}
- {{Deque}}, {{ArrayDeque}}, {{LinkedList}}, {{ConcurrentLinkedDeque}}
- {{LinkedHashSet}}, {{LinkedHashMap}}
- {{SortedSet}}/{{NavigableSet}}, {{TreeSet}}
- {{SortedMap}}/{{NavigableMap}}, {{TreeMap}}
- **Không implement**: {{HashSet}}, {{HashMap}}, {{ConcurrentHashMap}}, {{CopyOnWriteArrayList}} (vì không đảm bảo thứ tự ổn định).

### Pitfall
- {{reversed()}} trả **view**, không phải bản copy — sửa collection gốc thì view thay đổi, và ngược lại (nếu mutable).
- {{getFirst}} ném exception nếu rỗng; dùng {{isEmpty()}} check trước hoặc {{stream().findFirst()}}.
- {{SequencedCollection}} không extends {{Deque}} — không có {{push}}/{{pop}}.
- Immutable collections ({{List.of}}, {{Set.of}}) implement {{SequencedCollection}} nhưng {{addFirst}}/{{removeFirst}} ném {{UnsupportedOperationException}}.

> Senior tip: khi viết method nhận collection có thứ tự, dùng {{SequencedCollection}} làm tham số thay vì {{List}}/{{Deque}} — chấp nhận được nhiều loại hơn và có API thống nhất. {{reversed()}} view rất tiện cho duyệt ngược không cần index math.`,
  follow: [
    'Vì sao {{HashSet}}/{{HashMap}} không implement {{SequencedCollection}}/{{SequencedMap}}?',
    '{{reversed()}} view có thread-safe không?',
    'Làm sao viết code generic in ra collection có thứ tự trước Java 21?'
  ],
  tags: ['SequencedCollection', 'SequencedMap', 'Java 21', 'reversed', 'getFirst'],
  refs: [
    { type: 'doc', title: 'Java Language Specification', url: 'https://docs.oracle.com/javase/specs/' }
  ]
},
{
  id: 'modern-010',
  topic: 'modern',
  level: 'senior',
  q: 'Record patterns và nested deconstruction trong switch (Java 21), guard {{when}}.',
  a: `**Tóm tắt:** Java 21 cho phép **record pattern** destructure ngay trong {{instanceof}} và {{switch}}; lồng nhau (nested) để tách dữ liệu sâu; {{when}} guard thêm điều kiện boolean cho case — thay thế visitor pattern và if-else chain phức tạp.
 
### Record pattern cơ bản
~~~java
record Point(int x, int y) {}
record Rectangle(Point topLeft, Point bottomRight) {}

Object obj = new Rectangle(new Point(0, 0), new Point(10, 10));

if (obj instanceof Rectangle(Point(int x1, int y1), Point(int x2, int y2))) {
    System.out.println(x1 + "," + y1 + " -> " + x2 + "," + y2); // 0,0 -> 10,10
}
~~~
- Pattern: {{Rectangle(Point(int x1, int y1), Point(int x2, int y2))}} khớp type và destructure component lồng nhau.
- Biến pattern ({{int x1}}) khai báo ngay trong pattern, scope là block {{if}}/{{case}}.

### Nested deconstruction trong switch
~~~java
sealed interface Expr permits Const, Add, Mul {}
record Const(int value) implements Expr {}
record Add(Expr left, Expr right) implements Expr {}
record Mul(Expr left, Expr right) implements Expr {}

int eval(Expr e) {
    return switch (e) {
        case Const(int v)            -> v;
        case Add(Expr l, Expr r)     -> eval(l) + eval(r);
        case Mul(Expr l, Expr r)     -> eval(l) * eval(r);
    };
}
~~~
- {{Add(Expr l, Expr r)}}: destructure 2 component là {{Expr}}, đệ quy xử lý.
- Không cần visitor pattern, không cần cast, compiler kiểm tra exhaustive (vì {{Expr}} sealed).

### Guard {{when}}
~~~java
String classify(Object o) {
    return switch (o) {
        case String s when s.length() > 10 -> "long string";
        case String s                       -> "short string";
        case Integer i when i > 0           -> "positive int";
        case Integer i                      -> "non-positive int";
        case null                           -> "null";
        default                             -> "other";
    };
}
~~~
- {{when}}: boolean expression sau pattern, chỉ match nếu true.
- Thứ tự case quan trọng: case có guard cụ thể phải **trước** case tổng quát cùng type (compiler báo "dominated" nếu ngược).
- {{case null}} tách biệt — không match {{default}}.

### Kết hợp record pattern + guard
~~~java
record Order(String id, Customer customer, List<Item> items) {}
record Customer(String name, boolean vip) {}

String priority(Order o) {
    return switch (o) {
        case Order(_, Customer(_, true), var items) when items.size() > 5 -> "VIP_BULK";
        case Order(_, Customer(_, true), _)                              -> "VIP";
        case Order(_, _, var items) when items.size() > 100              -> "BULK";
        default                                                            -> "NORMAL";
    };
}
~~~
- {{_}} (unnamed pattern, Java 22+ preview / Java 21 unnamed variable): bỏ qua component không cần.
- {{var items}}: pattern variable declaration (type inference).

### So sánh với visitor pattern
| | Visitor | Record pattern + switch |
|---|---|---|
| Boilerplate | Cao (interface + accept + impl) | Thấp (chỉ record + switch) |
| Exhaustiveness | Runtime (quên impl ném exception) | **Compile-time** (sealed) |
| Thêm operation | Thêm method visitor (sửa nhiều class) | Thêm switch method (một chỗ) |
| Thêm type | Sửa visitor interface + tất cả impl | Thêm record + sửa switch (compiler nhắc) |
| Performance | Double dispatch | Single dispatch, JIT tốt |

### Pitfall
- Sealed hierarchy bắt buộc: không sealed ⇒ cần {{default}} ⇒ mất exhaustive check.
- Guard {{when}} không được truy cập biến pattern từ case khác.
- Unnamed pattern {{_}} chỉ Java 22+ (preview), Java 21 dùng {{var _}} hoặc tên biến rồi không dùng.
- Performance: pattern matching switch compile thành {{tableswitch}}/{{lookupswitch}} + type check, nhanh hơn visitor.

> Senior tip: record pattern + sealed + switch exhaustive là "killer feature" cho domain modeling (AST, command, event, state). Thay thế visitor pattern hoàn toàn cho hierarchy ổn định. Nếu domain mở (plugin), dùng {{non-sealed}} hoặc interface thường.`,
  follow: [
    'Vì sao record pattern + sealed switch an toàn hơn visitor pattern?',
    'Unnamed pattern {{_}} khác {{var _}} ở điểm nào?',
    'Khi nào không nên dùng record pattern (ví dụ hierarchy thay đổi thường xuyên)?'
  ],
  tags: ['record pattern', 'nested deconstruction', 'switch', 'when', 'Java 21'],
  refs: [
    { type: 'doc', title: 'Java Language Specification', url: 'https://docs.oracle.com/javase/specs/' }
  ]
}
,
{
  id: 'core-012',
  topic: 'core',
  level: 'senior',
  q: 'Xử lý tiền tệ bằng {{BigDecimal}}: scale, {{RoundingMode}}, {{equals}} vs {{compareTo}}, và vì sao tuyệt đối không dùng {{double}}?',
  a: `**Tóm tắt:** tiền tệ **bắt buộc** dùng {{BigDecimal}} vì {{double}}/{{float}} không biểu diễn chính xác số thập phân (0.1 + 0.2 ≠ 0.3); {{BigDecimal}} cho phép kiểm soát scale và {{RoundingMode}}, dùng {{compareTo}} để so sánh thay vì {{equals}} (vì {{equals}} còn so sánh scale).

### Vì sao không dùng double
- {{double}} tuân theo IEEE 754 nhị phân: số thập phân hữu hạn (0.1, 0.01, 19.99) thường thành số lặp vô hạn trong nhị phân ⇒ sai số tròn tích lũy.
- Ví dụ kinh điển: {{0.1 + 0.2 = 0.30000000000000004}}; tính lãi, chiết khấu, tiền tệ ngoại tệ sẽ lệch cent và cộng dồn qua ngàn giao dịch thành số lớn.
- Nghiệp vụ kế toán/ngân hàng yêu cầu số tiền khớp tuyệt đối tới đơn vị nhỏ nhất của tiền tệ (số chữ số thập phân của mỗi loại tiền theo ISO 4217: VND 0, USD 2, JPY 0); {{double}} không đáp ứng được.

### BigDecimal cơ bản
~~~java
// Tạo từ String — AN TOÀN
BigDecimal price = new BigDecimal("19.99");

// Tạo từ double — CẤM (giữ sai số nhị phân)
BigDecimal bad = new BigDecimal(0.1);   // 0.10000000000000000555...
BigDecimal good = BigDecimal.valueOf(0.1); // dùng Double.toString -> "0.1"
~~~
- Luôn dùng constructor nhận {{String}} hoặc {{BigDecimal.valueOf(double)}}.
- {{scale}} = số chữ số sau dấu phẩy; âm nghĩa là nhân 10^|scale| (dùng cho số lớn tròn hàng chục/trăm).

### RoundingMode
- Cần thiết khi chia hoặc chuyển đổi scale: {{divide(divisor, scale, RoundingMode.HALF_UP)}}.
- Các mode phổ biến: {{HALF_UP}} (toán học), {{HALF_EVEN}} (banker's rounding, chuẩn IEEE 754R), {{DOWN}}/{{UP}}/{{CEILING}}/{{FLOOR}}.
- Không đặt scale cho {{divide}} sẽ ném {{ArithmeticException}} nếu không chia hết (non-terminating decimal).

### equals vs compareTo
~~~java
new BigDecimal("1.0").equals(new BigDecimal("1.00"));  // false (scale khác)
new BigDecimal("1.0").compareTo(new BigDecimal("1.00")); // 0 (giá trị bằng)
~~~
- {{equals}} so sánh cả **scale** và giá trị; {{compareTo}} chỉ so sánh giá trị số học.
- Dùng {{compareTo}} cho logic nghiệp vụ (so sánh giá, kiểm tra âm/dương); dùng {{equals}} chỉ khi cần biết chính xác định dạng (ví dụ serial hóa).
- {{signum()}} trả -1/0/1 tiện cho điều kiện.

### Pitfall production
- Quên {{divide}} kèm scale + rounding ⇒ exception lúc runtime khi chia 10/3.
- Dùng {{double}} trung gian trong công thức ({{bd.add(BigDecimal.valueOf(0.1))}}) rồi convert về {{BigDecimal}} — sai số vẫn lạ.
- Lưu DB: cột {{NUMERIC(19,4)}} hoặc {{DECIMAL}}; đừng dùng {{FLOAT}}/{{DOUBLE}}. Hibernate mapping {{@Column(precision = 19, scale = 4)}}.
- Tiền tệ đa ngoại tệ: luôn kèm {{Currency}} (ISO 4217), không cộng/trừ tiền tệ khác nhau.

### Bên trong: BigDecimal lưu gì
{{BigDecimal}} = **unscaledValue** (số nguyên {{BigInteger}}, hoặc {{long}} nội bộ khi đủ nhỏ) × 10 mũ âm **scale**. Ví dụ 12.50 là (1250, scale 2); 12.5 là (125, scale 1) — cùng giá trị số nhưng khác biểu diễn, vì vậy {{equals}} (so cả scale) trả false còn {{compareTo}} trả 0. {{double}} thì lưu theo hệ nhị phân: 0.1 không có biểu diễn hữu hạn (như 1/3 trong hệ thập phân), nên luôn là giá trị xấp xỉ. Phép chia {{divide(x)}} không có scale/rounding sẽ ném {{ArithmeticException}} nếu kết quả là số thập phân vô hạn (ví dụ 10/3) — luôn truyền scale và {{RoundingMode}}. Tạo từ {{new BigDecimal(0.1)}} mang theo sai số của double; dùng {{BigDecimal.valueOf(0.1)}} hoặc từ chuỗi.

### Ví dụ đời thực
Một ví điện tử chia hoàn tiền 100.000đ cho 3 người bằng {{double}} rồi làm tròn từng phần: 33.333,33 × 3 = 99.999,99 — mỗi giao dịch "rơi" 0,01đ, sau 2 triệu giao dịch lệch đối soát khoảng 20.000đ và mất 3 ngày để tìm nguyên nhân. Sửa: dùng {{BigDecimal}} với scale 0 (VND không có phần lẻ), chia {{divide(3, 0, RoundingMode.DOWN)}} cho hai phần đầu, phần cuối = tổng trừ các phần đã chia (người cuối nhận 33.334đ) — tổng luôn đúng tuyệt đối. Gói logic trong record {{Money}} với {{Currency}} để scale đúng theo từng loại tiền (VND 0, USD 2).

### Trả lời mẫu khi phỏng vấn
"Tiền tệ tôi luôn dùng BigDecimal, không bao giờ double. double lưu theo hệ nhị phân nên 0,1 chỉ là giá trị xấp xỉ, cộng dồn nhiều giao dịch sẽ lệch đối soát. BigDecimal lưu một số nguyên không dấu phẩy cùng scale, nên biểu diễn chính xác số thập phân. Tôi luôn tạo từ chuỗi hoặc valueOf, không dùng constructor nhận double vì nó mang theo sai số. Phép chia phải chỉ rõ scale và RoundingMode, nếu không chia 10 cho 3 sẽ ném ArithmeticException; ngân hàng thường dùng HALF_EVEN hoặc theo quy định nghiệp vụ. So sánh thì dùng compareTo, vì equals so cả scale nên 12.5 khác 12.50. Khi chia tiền cho nhiều phần, tôi tính phần cuối bằng tổng trừ các phần trước để không thất thoát. Và tôi gói vào một record Money có Currency để làm tròn đúng theo từng loại tiền."

> Senior tip: viết wrapper {{Money}} (record {{Money(BigDecimal amount, Currency currency)}}) với validation ở constructor; tập trung logic làm tròn, chuyển đổi, so sánh vào một chỗ để tránh rải rác {{RoundingMode.HALF_UP}} khắp codebase.`,
  follow: [
    'Vì sao {{BigDecimal("0.1")}} an toàn mà {{new BigDecimal(0.1)}} không?',
    'Khi nào dùng {{RoundingMode.HALF_EVEN}} thay vì {{HALF_UP}}?',
    'Làm sao xử lý tiền tệ đa ngoại tệ trong một hệ thống thanh toán?'
  ],
  tags: ['BigDecimal', 'money', 'RoundingMode', 'floating point'],
  refs: [
    { type: 'doc', title: 'Java Language Specification', url: 'https://docs.oracle.com/javase/specs/' }
  ]
},
{
  id: 'core-013',
  topic: 'core',
  level: 'senior',
  q: 'Java Date/Time API: phân biệt {{Instant}}, {{LocalDateTime}}, {{ZonedDateTime}}, {{OffsetDateTime}}; lưu thời gian trong DB thế nào để tránh bug timezone lúc nửa đêm (cut-off ngân hàng)?',
  a: `**Tóm tắt:** {{Instant}} là điểm trên timeline (UTC, không timezone), {{LocalDateTime}} là ngày giờ địa phương **không** có offset, {{OffsetDateTime}} có offset cố định, {{ZonedDateTime}} có quy tắc timezone (DST). Lưu DB luôn dùng {{Instant}} (UTC) hoặc {{TIMESTAMP WITH TIME ZONE}}; chuyển về múi giờ người dùng **chỉ ở tầng hiển thị**.

### Bốn kiểu chính
| Kiểu | Mô tả | Dùng khi |
|---|---|---|
| {{Instant}} | UTC nanosecond, không timezone | Lưu trữ, log, so sánh, truyền giữa service |
| {{LocalDateTime}} | Năm-tháng-ngày-giờ-phút-giây, **không** offset | Giao diện người dùng, lịch hẹn, sinh nhật |
| {{OffsetDateTime}} | LocalDateTime + offset cố định (+07:00) | Giao tiếp với hệ thống ngoài chỉ gửi offset |
| {{ZonedDateTime}} | LocalDateTime + ZoneId (IANA, có DST) | Business logic liên quan múi giờ, quy tắc mùa hè |

### Chuyển đổi an toàn
~~~java
Instant now = Instant.now();                    // UTC
ZonedDateTime vn = now.atZone(ZoneId.of("Asia/Ho_Chi_Minh")); // +07, có DST lịch sử
OffsetDateTime odt = vn.toOffsetDateTime();     // offset tại thời điểm đó
LocalDateTime ldt = vn.toLocalDateTime();       // mất timezone
Instant back = vn.toInstant();                  // ngược về UTC
~~~
- Không bao giờ dùng {{LocalDateTime}} để lưu timestamp sự kiện (log, order time, payment time) — mất ngữ cảnh timezone.
- {{ZonedDateTime}} khác {{OffsetDateTime}} ở chỗ nó biết **quy tắc DST** (ngày chuyển giờ mùa hè); {{OffsetDateTime}} chỉ là offset tĩnh.

### Bug cut-off ngân hàng (thực tế)
- Hệ thống cut-off giao dịch lúc 23:59:59 **theo múi giờ ngân hàng (ví dụ +07)**.
- Nếu lưu {{LocalDateTime}} "2024-03-10 23:59:59" mà không lưu offset, ngày chuyển DST (nếu có) hoặc khi server đổi múi giờ, thời điểm thực tế sai lệch 1 tiếng.
- Giải pháp: lưu {{Instant}} (UTC) trong DB cột {{TIMESTAMP WITH TIME ZONE}} (PostgreSQL) hoặc {{DATETIME}} (MySQL 8.0+ với {{TIMESTAMP}} tự convert). Khi query cut-off: {{WHERE created_at < '2024-03-11 00:00:00+07'}} (đã có offset).
- Spring Boot: cấu hình {{spring.jpa.properties.hibernate.jdbc.time_zone=UTC}} và dùng {{@Column(columnDefinition = "TIMESTAMP WITH TIME ZONE")}}.

### Các lỗi hay gặp
- {{LocalDateTime.now()}} lấy theo múi giờ JVM ({{ZoneId.systemDefault()}}); container Docker thường để UTC ⇒ sai so với múi giờ VN.
- Parse string không có offset bằng {{LocalDateTime.parse}} rồi gán cho cột {{TIMESTAMP WITH TIME ZONE}} ⇒ DB dùng múi giờ session, không ổn định.
- So sánh {{ZonedDateTime}} khác zone: phải {{toInstant()}} rồi so sánh, không so sánh field trực tiếp.
- {{Period}} vs {{Duration}}: {{Period}} cho ngày/tháng/năm (date-based), {{Duration}} cho giờ/phút/giây/nano (time-based).

### Ví dụ đời thực
Một ngân hàng chạy job "chốt giao dịch trong ngày" lúc 23:59 theo giờ Việt Nam, nhưng server và cột DB dùng {{TIMESTAMP}} (không timezone) lưu giờ UTC, còn code so sánh bằng {{LocalDateTime.now()}} theo múi giờ của container (UTC). Kết quả: giao dịch từ 0:00 đến 7:00 sáng giờ Việt Nam bị tính vào ngày hôm trước — khoảng 4% giao dịch mỗi ngày lệch kỳ, báo cáo cho cơ quan quản lý sai. Sửa: cột chuyển sang {{timestamptz}}, code lưu {{Instant}}, ranh giới ngày nghiệp vụ tính tường minh {{LocalDate.of(...).atStartOfDay(ZoneId.of("Asia/Ho_Chi_Minh")).toInstant()}}, inject {{Clock}} để test được các mốc 23:59:59/00:00:00. Thêm test cho ngày cuối tháng và năm nhuận.

### Trả lời mẫu khi phỏng vấn
"Instant là một điểm trên trục thời gian tính theo UTC, không có múi giờ, phù hợp để lưu và truyền giữa các hệ thống. LocalDateTime chỉ là ngày giờ trên lịch, không biết ở đâu, nên không xác định được một thời điểm cụ thể; tôi chỉ dùng nó cho khái niệm như 'mở cửa lúc 8 giờ'. OffsetDateTime có độ lệch cố định như cộng 7, ZonedDateTime có cả quy tắc múi giờ, gồm giờ mùa hè. Trong DB tôi lưu thời điểm bằng Instant với cột timestamptz, và chỉ đổi sang múi giờ người dùng khi hiển thị hoặc khi tính ranh giới nghiệp vụ như 'ngày giao dịch theo giờ Việt Nam', mà tôi tính tường minh với ZoneId. Tôi inject Clock thay vì gọi now trực tiếp để test các mốc nửa đêm, cuối tháng. Bug kinh điển là container chạy UTC trong khi code giả định giờ địa phương."

> Senior tip: quy tắc vàng — **luôn lưu UTC (Instant) trong DB**, **luôn hiển thị theo timezone người dùng ở frontend**, **không bao giờ để business logic tính toán trên LocalDateTime**. Với batch job cut-off, dùng {{ZonedDateTime}} có ZoneId cố định của ngân hàng để xác định ranh giới ngày.`,
  follow: [
    'Vì sao {{ZonedDateTime}} an toàn hơn {{OffsetDateTime}} cho logic cut-off?',
    'Làm sao migrate cột {{TIMESTAMP}} cũ sang {{TIMESTAMP WITH TIME ZONE}} không mất dữ liệu?',
    'Khi nào dùng {{LocalDate}} thay vì {{LocalDateTime}} cho ngày sinh/ngày hết hạn?'
  ],
  tags: ['Date/Time', 'Instant', 'ZonedDateTime', 'timezone', 'cut-off'],
  refs: [
    { type: 'doc', title: 'Java Language Specification', url: 'https://docs.oracle.com/javase/specs/' }
  ]
},
{
  id: 'core-014',
  topic: 'core',
  level: 'mid',
  q: 'Autoboxing: Integer cache (-128..127), {{==}} trên wrapper, NPE khi unboxing, và chi phí boxing trong vòng lặp nóng.',
  a: `**Tóm tắt:** autoboxing tự chuyển primitive ↔ wrapper; {{Integer.valueOf}} cache -128..127 nên {{==}} đúng trên cache nhưng sai ngoài phạm vi; unboxing {{null}} ném NPE; boxing trong vòng lặp tạo rác GC lớn — dùng primitive hoặc primitive collection.
 
### Cache Integer
- {{Integer.valueOf(int)}} cache [-128, 127] (có thể mở rộng bằng {{-XX:AutoBoxCacheMax}}); {{new Integer()}} đã deprecated (Java 9) và không dùng cache.
- {{Long}}, {{Short}}, {{Byte}}, {{Character}} cũng có cache tương tự.
- {{Boolean}} cache {{TRUE}}/{{FALSE}} singleton.

~~~java
Integer a = 127, b = 127;        // cache -> same object
Integer c = 128, d = 128;        // mới tạo -> khác object
System.out.println(a == b);      // true
System.out.println(c == d);      // false (so sánh reference!)
System.out.println(c.equals(d)); // true (so sánh giá trị)
~~~

### NPE khi unboxing
~~~java
Integer wrapper = null;
int primitive = wrapper;         // NPE tại dòng này (unboxing ngầm)
~~~
- Xảy ra khi: map.get(key) trả null rồi gán cho primitive; ternary operator {{condition ? 1 : null}} ép kiểu primitive; stream {{reduce}} với identity null.
- Phòng thủ: dùng {{Objects.requireNonNull}}, {{Optional}}, hoặc kiểm tra null trước khi unbox.

### Chi phí boxing trong hot path
- Mỗi boxing tạo object mới (trừ cache), gây allocation rate cao ⇒ young GC nhiều, pause tăng.
- Ví dụ: {{Long sum = 0L; for (long v : values) sum += v;}} — {{sum}} bị box/unbox mỗi vòng.
- Khắc phục: dùng primitive local ({{long sum = 0;}}), hoặc primitive stream ({{LongStream}}, {{IntStream}}), hoặc primitive collection (fastutil/Eclipse Collections).
- JIT có thể escape analysis loại bỏ boxing nếu object không thoát method, nhưng không đảm bảo.

### So sánh wrapper
- Luôn dùng {{equals}} cho wrapper; {{==}} chỉ đúng nhờ cache và là bug ngầm.
- {{Comparator.naturalOrder()}} an toàn cho wrapper null (ném NPE), {{Comparator.nullsFirst}} xử lý null tường minh.

### Bên trong: vì sao có cache -128..127
{{Integer.valueOf(int)}} kiểm tra giá trị trong khoảng cache (mặc định -128..127, mở rộng phía trên bằng {{-XX:AutoBoxCacheMax}}) và trả về object đã tạo sẵn; ngoài khoảng thì {{new Integer}}. Autoboxing của compiler chính là lời gọi {{valueOf}}. Vì vậy {{==}} "đúng" với số nhỏ trong test (id 1, 2, 3) nhưng sai với dữ liệu thật (id 1000) — loại bug chỉ lộ ra trên production. {{Long}}, {{Short}}, {{Byte}}, {{Character}} (0..127) cũng có cache tương tự; {{Double}}/{{Float}} thì không.

### Ví dụ đời thực
Một service phân quyền so sánh {{if (user.getTenantId() == resource.getTenantId())}} với kiểu {{Long}}. Mọi test đều xanh vì dữ liệu test có tenant 1–50. Trên production, tenant id từ 1.000 trở lên → so sánh reference luôn false → người dùng hợp lệ bị từ chối truy cập tài nguyên của chính họ (khoảng 300 khiếu nại trong một buổi sáng). Sửa: {{Objects.equals}} hoặc so sánh {{long}} nguyên thuỷ; bật cảnh báo SpotBugs RC_REF_COMPARISON; thêm dữ liệu test có id lớn hơn 127. Một service khác cũng phát hiện {{Map<Long, Long>}} cộng dồn trong vòng lặp tạo 40 triệu object Long mỗi phút — đổi sang mảng {{long[]}}/primitive map giảm 25% thời gian GC.

### Trả lời mẫu khi phỏng vấn
"Autoboxing là compiler tự chuyển giữa kiểu nguyên thuỷ và wrapper, thực chất gọi valueOf khi box và intValue khi unbox. Integer.valueOf có cache các giá trị từ âm 128 đến 127, nên so sánh hai Integer bằng dấu bằng bằng chỉ tình cờ đúng với số nhỏ, còn với số lớn hơn thì so sánh reference và ra false; đây là bug hay qua được test vì dữ liệu test thường nhỏ. Tôi luôn dùng equals hoặc so sánh giá trị nguyên thuỷ. Unbox một wrapper null sẽ ném NullPointerException, hay gặp khi map get trả về null rồi cộng vào int, hoặc entity có cột nullable map sang int. Trong vòng lặp nóng, boxing tạo rất nhiều object rác, nên tôi dùng kiểu nguyên thuỷ, mảng hoặc IntStream, LongAdder, thay vì collection của wrapper."

> Senior tip: bật {{-XX:+PrintCompilation}} và {{-XX:+PrintInlining}} để xem JIT có loại bỏ boxing không; trong code quan trọng (low latency), viết thủ công dùng primitive hoặc dùng thư viện primitive collection. Đừng tin rằng "JIT sẽ lo" — đo bằng JMH.`,
  follow: [
    'Vì sao {{Integer}} cache mặc định -128..127 và làm sao mở rộng?',
    'Ternary operator {{flag ? 1 : null}} ném NPE khi gán cho {{int}} — tại sao?',
    'Khi nào nên dùng {{OptionalInt}} thay vì {{Optional<Integer>}}?'
  ],
  tags: ['autoboxing', 'Integer cache', 'NPE', 'performance']
},
{
  id: 'core-015',
  topic: 'core',
  level: 'senior',
  q: 'try-with-resources: thứ tự đóng, suppressed exception, và cách viết {{AutoCloseable}} đúng.',
  a: `**Tóm tắt:** try-with-resources đóng tài nguyên theo thứ tự **ngược lại khai báo**, exception khi close bị gắn vào {{getSuppressed()}} của exception chính; tự viết {{AutoCloseable}} phải idempotent, không ném exception trong {{close()}} trừ khi không thể khôi phục.
 
### Thứ tự đóng
~~~java
try (var in = new FileInputStream("a.txt");
     var out = new FileOutputStream("b.txt")) {
    // dùng in, out
} // out.close() chạy trước, rồi in.close()
~~~
- Đóng theo LIFO (last in, first out) — giống stack; resource khai báo sau đóng trước.
- Nếu constructor resource sau ném exception, resource trước vẫn được đóng (Java 9+ hỗ trợ resource final/effectively final).

### Suppressed exception
- Nếu block try ném exception **và** close() cũng ném exception: exception close bị **suppressed** (gắn vào {{primary.getSuppressed()}}), exception chính vẫn là exception từ try block.
- Trước Java 7 (dùng finally), exception close sẽ **ghi đè** exception chính — mất nguyên nhân gốc.
- Luôn log {{getSuppressed()}} khi bắt exception để không mất lỗi đóng tài nguyên.

~~~java
try (var rs = stmt.executeQuery()) {
    // xử lý
} catch (SQLException e) {
    for (Throwable s : e.getSuppressed()) {
        log.warn("Suppressed: {}", s.getMessage());
    }
    throw e;
}
~~~

### Viết AutoCloseable đúng
~~~java
public final class DbResource implements AutoCloseable {
    private final Connection conn;
    private volatile boolean closed = false;
 
    public DbResource(Connection conn) { this.conn = conn; }
 
    @Override
    public void close() {
        if (closed) return;                 // idempotent
        closed = true;
        try {
            if (conn != null && !conn.isClosed()) conn.close();
        } catch (SQLException e) {
            // log và nuốt, hoặc wrap thành unchecked nếu caller cần biết
            // KHÔNG ném checked exception mới nếu không cần thiết
        }
    }
}
~~~
- **Idempotent**: gọi {{close()}} nhiều lần an toàn.
- **Không ném exception** trong {{close()}} trừ khi lỗi nghiêm trọng không thể bỏ qua (ví dụ flush buffer thất bại khi ghi log quan trọng). Nếu ném, caller không xử lý được dễ dàng.
- **Thread-safe** nếu resource chia sẻ: dùng {{volatile}} hoặc {{synchronized}}.
- Resource có state ({{InputStream}}, {{Connection}}) nên {{final}} class để tránh subclass phá vỡ logic đóng.

### Java 9+: resource final/effectively final
~~~java
var in = Files.newInputStream(path);
try (in) { ... }  // không cần khai báo mới trong try
~~~

### Bên trong: compiler biến try-with-resources thành gì
javac dịch {{try (var r = open())}} thành một khối try/catch/finally: nếu thân try ném exception {{t}}, khi đóng tài nguyên mà {{close()}} cũng ném {{e}}, compiler gọi {{t.addSuppressed(e)}} rồi ném lại {{t}} — exception chính không bị che. Nếu thân không lỗi mà {{close()}} lỗi, exception của close được ném ra. Tài nguyên khai báo sau đóng trước (ngược thứ tự) vì nó thường phụ thuộc tài nguyên khai báo trước (ví dụ {{PreparedStatement}} phụ thuộc {{Connection}}). Tài nguyên null được bỏ qua khi đóng, không ném NPE.

### Ví dụ đời thực
Một job xuất file dùng {{try/finally}} tự viết: trong finally gọi {{writer.close()}}; khi đĩa đầy, {{write}} ném IOException "No space left", rồi {{close()}} (cố flush) lại ném exception khác và **che mất** exception gốc. Log chỉ có "Stream closed" — team mất 2 ngày điều tra sai hướng. Chuyển sang try-with-resources: log hiển thị exception gốc kèm phần "Suppressed: ..." của close, chẩn đoán đầy đĩa trong 10 phút. Cùng đợt đó, phát hiện một pool connection bị rò vì {{ResultSet}} không đóng ở nhánh lỗi — try-with-resources với cả {{Connection}}, {{PreparedStatement}}, {{ResultSet}} sửa luôn.

### Trả lời mẫu khi phỏng vấn
"try-with-resources tự đóng mọi tài nguyên implements AutoCloseable khi thoát khối, kể cả khi có exception, và đóng theo thứ tự ngược với khai báo, vì tài nguyên khai báo sau thường phụ thuộc tài nguyên trước, như statement phụ thuộc connection. Điểm quan trọng là nếu thân khối ném exception và close cũng ném, exception của close được gắn vào getSuppressed của exception chính chứ không che nó, khác với try finally tự viết hay làm mất exception gốc. Khi tự viết AutoCloseable, tôi làm close idempotent để gọi hai lần không lỗi, giải phóng tài nguyên kể cả khi một bước giữa chừng lỗi, và khai báo exception cụ thể thay vì Exception chung. Từ Java 9 có thể dùng biến final đã có sẵn trong khai báo try."

> Senior tip: trong code review, tìm mọi {{close()}} thủ công trong finally — hãy chuyển sang try-with-resources. Với resource pool (DB connection), {{close()}} trả về pool chứ không đóng vật lý; đảm bảo {{AutoCloseable}} của wrapper pool đúng ngữ nghĩa.`,
  follow: [
    'Vì sao exception trong close() bị suppressed thay vì ghi đè exception chính?',
    'Resource khai báo trong try-with-resources có thể là null không?',
    'Làm sao viết AutoCloseable cho resource cần flush trước khi đóng (ví dụ BufferedWriter)?'
  ],
  tags: ['try-with-resources', 'AutoCloseable', 'suppressed exception', 'resource management'],
  refs: [
    { type: 'doc', title: 'Java Language Specification', url: 'https://docs.oracle.com/javase/specs/' }
  ]
},
{
  id: 'core-016',
  topic: 'core',
  level: 'senior',
  q: 'Enum nâng cao: {{EnumMap}}/{{EnumSet}}, enum singleton, enum làm state machine, và vì sao không persist bằng {{ordinal()}}.',
  a: `**Tóm tắt:** enum là class final với tập instance cố định; {{EnumMap}}/{{EnumSet}} nhanh hơn HashMap/HashSet nhờ mảng index theo {{ordinal()}}; enum singleton thread-safe miễn phí; enum state machine gọn nhẹ; **không persist ordinal()** vì thêm/sửa enum làm lệch dữ liệu — dùng name() hoặc code tự định nghĩa.
 
### EnumMap / EnumSet
- {{EnumMap<K,V>}}: key là enum, backing là mảng {{V[]}} index = {{key.ordinal()}}; O(1) không hash, không collision, memory nhỏ, duyệt theo thứ tự khai báo.
- {{EnumSet}}: bitset (long cho ≤ 64 enum, mảng long cho > 64); {{EnumSet.allOf}}, {{noneOf}}, {{range}}, {{complement}} cực nhanh.
- So với {{HashMap}}/{{HashSet}}: nhanh hơn 2-10x, ít GC, không cần hashCode/equals.

~~~java
enum Status { NEW, PROCESSING, DONE, FAILED }
EnumMap<Status, Integer> counter = new EnumMap<>(Status.class);
EnumSet<Status> active = EnumSet.of(Status.NEW, Status.PROCESSING);
~~~

### Enum singleton
~~~java
enum Singleton { INSTANCE; void doWork() {} }
~~~
- Thread-safe, serialization-safe (JVM đảm bảo), reflection-safe (constructor private), lazy init.
- Cách đơn giản nhất và được khuyến nghị (Effective Java Item 3).

### Enum state machine
~~~java
enum OrderState {
    CREATED { @Override OrderState next() { return PAID; } },
    PAID { @Override OrderState next() { return SHIPPED; } },
    SHIPPED { @Override OrderState next() { return DELIVERED; } },
    DELIVERED { @Override OrderState next() { return this; } };
    abstract OrderState next();
}
~~~
- Mỗi state là instance, method abstract ép buộc implement chuyển tiếp.
- Dễ thêm validation, logging, side effect trong từng state.
- Không dùng cho state machine phức tạp với nhiều transition điều kiện — dùng thư viện hoặc pattern khác.

### Vì sao không persist ordinal()
- {{ordinal()}} trả về index khai báo (0-based). Thêm enum ở giữa hoặc đổi thứ tự ⇒ tất cả dữ liệu cũ sai nghĩa.
- Ví dụ: {{Status.NEW=0, PROCESSING=1}}; thêm {{PENDING}} ở giữa ⇒ PROCESSING thành 2, dữ liệu cũ PROCESSING (1) giờ thành PENDING.
- Giải pháp: persist {{name()}} (String) hoặc code tự định nghĩa {{code}} (String/Int) trong enum field.
- {{name()}} ổn định miễn là không đổi tên enum; đổi tên enum vẫn cần migration script.

### Pitfall
- {{EnumMap}} không thread-safe; dùng {{ConcurrentHashMap}} nếu chia sẻ.
- {{EnumSet}} không serializable tốt qua một số framework cũ; test kỹ.
- Switch trên enum: thêm case mới mà quên cập nhật switch ⇒ bug; dùng switch expression (exhaustive) để compiler bắt.

### Bên trong: vì sao EnumMap nhanh
{{EnumMap}} giữ một **mảng** có độ dài bằng số hằng của enum, index chính là {{ordinal()}} — {{get}}/{{put}} chỉ là truy cập mảng, không tính hash, không có object Node. {{EnumSet}} với enum ≤ 64 hằng dùng **một số long** làm bit vector ({{RegularEnumSet}}): {{contains}} là một phép AND, {{addAll}} là một phép OR. Lưu {{ordinal}} trong bộ nhớ là an toàn vì enum và map cùng một phiên bản class; lưu ra DB hay message thì không, vì thứ tự có thể đổi giữa các phiên bản.

### Ví dụ đời thực
Bảng {{orders}} lưu trạng thái bằng {{@Enumerated(EnumType.ORDINAL)}} (mặc định của JPA nếu không khai báo). Một dev thêm trạng thái {{PENDING_REVIEW}} vào **giữa** enum → mọi đơn cũ có ordinal từ 3 trở đi bị đọc thành trạng thái kế tiếp: khoảng 180.000 đơn "SHIPPED" hiển thị thành "DELIVERED", vài trăm khách nhận email xác nhận giao hàng sai. Khắc phục: rollback, migration chuyển cột sang chuỗi, dùng {{@Enumerated(EnumType.STRING)}} hoặc {{AttributeConverter}} với mã ổn định ({{"SHP"}}, {{"DLV"}}); thêm ArchUnit rule cấm {{EnumType.ORDINAL}}.

### Trả lời mẫu khi phỏng vấn
"Enum trong Java là class final với một tập instance cố định, được khởi tạo một lần khi load class, nên enum một phần tử là cách làm singleton thread-safe và chống cả reflection lẫn serialization tạo bản sao. Enum có thể có field, constructor, và method riêng cho từng hằng, nên rất hợp làm state machine nhỏ: mỗi trạng thái tự khai báo các chuyển trạng thái hợp lệ. EnumMap và EnumSet nhanh hơn HashMap, HashSet nhiều vì dùng mảng index theo ordinal và bit vector. Nhưng tôi không bao giờ lưu ordinal ra DB hay message: chỉ cần chèn một hằng vào giữa là toàn bộ dữ liệu cũ đọc sai mà không có lỗi nào. Tôi lưu name, hoặc tốt hơn là một mã ổn định qua AttributeConverter để còn đổi tên hằng được."

> Senior tip: trong JPA, map enum bằng {{@Enumerated(EnumType.STRING)}} (lưu name) hoặc {{AttributeConverter}} cho code tùy chỉnh; **không bao giờ** dùng {{EnumType.ORDINAL}}. Với state machine phức tạp, cân nhắc thư viện như Squirrel hoặc tự viết nhưng tách logic transition ra class riêng.`,
  follow: [
    'Vì sao {{EnumMap}} nhanh hơn {{HashMap}} cho key enum?',
    'Enum singleton có nhược điểm gì so với static holder?',
    'Làm sao migrate dữ liệu đã lưu ordinal() sang code/name an toàn?'
  ],
  tags: ['enum', 'EnumMap', 'EnumSet', 'singleton', 'state machine'],
  refs: [
    { type: 'doc', title: 'Java Language Specification', url: 'https://docs.oracle.com/javase/specs/' }
  ]
},
{
  id: 'core-017',
  topic: 'core',
  level: 'senior',
  q: 'Interface default/static/private method, diamond problem, và khi nào chọn abstract class thay vì interface?',
  a: `**Tóm tắt:** Java 8+ cho phép default/static/private method trong interface; diamond problem giải quyết bằng quy tắc "class win" và bắt buộc override khi conflict; chọn abstract class khi cần state chung, constructor, hoặc non-public member; interface cho contract và multiple implementation.

### Default method
~~~java
default void log() { System.out.println("log"); }
~~~
- Cung cấp implementation mặc định, class implement có thể override.
- Dùng để **mở rộng interface cũ** mà không phá binary compatibility (ví dụ {{Collection.stream()}}, {{Iterable.forEach()}}).
- Không thể truy cập private field của class implement (chỉ dùng method public/protected khác).

### Static method
~~~java
static void helper() { ... }
~~~
- Tiện cho utility method gắn liền interface ({{Stream.of}}, {{Comparator.naturalOrder()}}).
- Không kế thừa được; gọi qua {{InterfaceName.helper()}}.

### Private method (Java 9)
~~~java
private void shared() { ... }
private static void util() { ... }
~~~
- Chia sẻ code giữa default method, không lộ ra ngoài.

### Diamond problem
~~~java
interface A { default void m() { System.out.println("A"); } }
interface B { default void m() { System.out.println("B"); } }
class C implements A, B { 
    @Override public void m() { A.super.m(); } // bắt buộc override, chọn A hoặc B
}
~~~
- Quy tắc: **class win** — nếu class (hoặc cha) có method cụ thể (non-abstract), dùng của class.
- Nếu hai interface có default method trùng tên và class không override ⇒ compile error.
- Dùng {{A.super.m()}} để gọi default method cụ thể.

### Interface vs Abstract class
| Tiêu chí | Interface | Abstract class |
|---|---|---|
| Kế thừa | multiple (implements) | single (extends) |
| Field | chỉ {{static final}} | instance field, constructor |
| Access modifier | public (default method) | bất kỳ (protected, package) |
| State | không | có |
| Binary compat | thêm default method an toàn | thêm method abstract phá vỡ subclass |

### Khi nào chọn abstract class
- Cần **state chung** (field) hoặc **constructor** khởi tạo state.
- Cần **non-public method** (protected helper cho subclass).
- Thiết kế template method pattern ({{final}} method gọi abstract hook).
- Base class cho hierarchy chặt (entity base, handler base).

### Khi nào chọn interface
- Định nghĩa **contract** (capability), không quan tâm implementation.
- Cần multiple implementation ({{Comparable}}, {{Serializable}}, {{AutoCloseable}}).
- API công khai muốn binary compatibility khi mở rộng.

### Ví dụ đời thực
Một thư viện nội bộ có interface {{PaymentGateway}} dùng ở 14 service. Thêm method mới {{refund()}} làm vỡ biên dịch của mọi class triển khai. Team chuyển sang thêm {{default}} method {{refund()}} ném {{UnsupportedOperationException}} kèm thông báo rõ, rồi từng service bổ sung dần — không cần phát hành đồng loạt. Sau đó một service triển khai đồng thời {{PaymentGateway}} và {{Auditable}} — cả hai có default {{describe()}} → lỗi biên dịch, buộc class phải override và chọn rõ {{PaymentGateway.super.describe()}}. Bài học được ghi vào hướng dẫn: default method dùng để **tiến hoá API**, không để nhét logic nghiệp vụ dùng chung (logic đó nên nằm trong class có thể test riêng).

### Trả lời mẫu khi phỏng vấn
"Từ Java 8 interface có default method và static method, từ Java 9 có thêm private method để chia sẻ code giữa các default. Mục đích chính của default method là tiến hoá API: thêm method vào interface đã có nhiều class triển khai mà không làm vỡ chúng. Diamond problem được giải theo quy tắc: method của class luôn thắng default của interface, interface con cụ thể hơn thắng interface cha, còn nếu hai interface ngang hàng cùng có default thì compiler bắt class phải override và chọn rõ bằng cú pháp tên interface chấm super. Tôi chọn abstract class khi cần trạng thái chung, constructor, hoặc thành viên không public, và chấp nhận chỉ kế thừa một lớp. Interface dành cho hợp đồng, cho phép một class đóng nhiều vai trò, và dễ mock trong test."

> Senior tip: mặc định dùng **interface** cho API mới; chỉ dùng abstract class khi thực sự cần state/constructor. Nếu thấy interface có quá nhiều default method phức tạp, cân nhắc tách thành abstract class helper + interface mảnh.`,
  follow: [
    'Default method có thể override {{Object}} method (equals, hashCode, toString) không?',
    'Static method trong interface có được kế thừa không?',
    'Vì sao Java không cho phép interface có instance field non-final?'
  ],
  tags: ['interface', 'default method', 'diamond problem', 'abstract class'],
  refs: [
    { type: 'doc', title: 'Java Language Specification', url: 'https://docs.oracle.com/javase/specs/' }
  ]
},
{
  id: 'core-018',
  topic: 'core',
  level: 'senior',
  q: 'Java I/O vs NIO: buffer, channel, {{Files}} API, đọc file lớn theo stream, zero-copy {{transferTo}}.',
  a: `**Tóm tắt:** I/O truyền thống (stream) blocking, byte-by-byte; NIO (New I/O) dùng **buffer + channel**, non-blocking, memory-mapped, zero-copy. {{Files}} API (Java 7+) tiện cho thao tác file hệ thống; đọc file lớn dùng {{Files.lines}}/{{Files.newInputStream}} + stream; {{transferTo}} truyền dữ liệu kernel-to-kernel không copy qua user space.
 
### I/O truyền thống vs NIO
| Đặc điểm | java.io (Stream) | java.nio (Buffer/Channel) |
|---|---|---|
| Mô hình | Blocking, byte/char stream | Buffer + Channel, non-blocking (Selector) |
| Đơn vị đọc/ghi | Byte/char đơn lẻ hoặc mảng | Buffer ({{ByteBuffer}}, {{CharBuffer}}...) |
| Memory-mapped | Không | {{FileChannel.map}} ({{MappedByteBuffer}}) |
| Zero-copy | Không | {{transferTo}}/{{transferFrom}} |
| File system | {{File}} (hạn chế) | {{Path}}, {{Files}} (bộ API đầy đủ) |

### Buffer cơ bản
~~~java
ByteBuffer buf = ByteBuffer.allocateDirect(8192); // off-heap, zero-copy ready
buf.put(data);        // write mode
buf.flip();           // chuyển sang read mode (limit=position, position=0)
channel.read(buf);    // đọc vào buffer
buf.compact();        // dời unread data về đầu, chuẩn bị đọc tiếp
~~~
- {{allocateDirect}}: off-heap, dùng cho zero-copy, GC ít hơn nhưng allocation chậm hơn.
- {{flip()}}, {{clear()}}, {{compact()}}, {{rewind()}} quản trị position/limit/capacity.

### Files API (Java 7+)
- {{Files.readAllLines}}, {{Files.write}}, {{Files.copy}}, {{Files.move}}, {{Files.delete}}, {{Files.walk}}.
- {{Files.lines(path)}} trả {{Stream<String>}} lazy, tự đóng stream khi xong (try-with-resources).
- {{Files.newInputStream}}/{{newOutputStream}} trả stream chuẩn, dùng với NIO channel.

### Đọc file lớn (GB) không OOM
~~~java
// Cách 1: Files.lines + stream processing (line by line)
try (Stream<String> lines = Files.lines(Paths.get("huge.log"))) {
    lines.filter(s -> s.contains("ERROR"))
         .forEach(System.out::println);
}

// Cách 2: BufferedReader thủ công
try (var br = Files.newBufferedReader(path)) {
    String line;
    while ((line = br.readLine()) != null) { ... }
}
~~~
- Không bao giờ {{Files.readAllBytes}} hoặc {{readAllLines}} file lớn — load hết vào heap.

### Zero-copy transferTo
~~~java
try (var in = FileChannel.open(src, StandardOpenOption.READ);
     var out = FileChannel.open(dest, StandardOpenOption.CREATE, StandardOpenOption.WRITE)) {
    long transferred = in.transferTo(0, in.size(), out); // kernel copy, không qua user buffer
}
~~~
- {{transferTo}} nhờ OS copy trực tiếp giữa 2 file descriptor (sendfile trên Linux), nhanh hơn và không tiêu tốn heap.
- Yêu cầu: source là {{FileChannel}}, destination có thể là {{FileChannel}} hoặc {{SocketChannel}}.
- Java 9+: {{transferTo}} trả về số byte đã transfer; có thể gọi lặp nếu không transfer hết.

> Senior tip: với log processing lớn, dùng {{Files.lines}} + parallel stream (nếu CPU-bound) hoặc {{BufferedReader}} tuần tự (nếu I/O-bound). Với copy file lớn hoặc gửi file qua network, luôn ưu tiên {{transferTo}}. Tránh {{MappedByteBuffer}} cho file > 2GB trên 32-bit hoặc khi cần đóng gấp (unmap khó khăn, dùng {{Cleaner}} hoặc reflection hack).`,
  follow: [
    'Vì sao {{transferTo}} nhanh hơn đọc vào buffer rồi ghi ra?',
    'Khi nào dùng {{ByteBuffer.allocateDirect}} thay vì {{allocate}}?',
    '{{MappedByteBuffer}} có nhược điểm gì và làm sao unmap an toàn?'
  ],
  tags: ['NIO', 'Buffer', 'Channel', 'Files', 'transferTo', 'zero-copy'],
  refs: [
    { type: 'doc', title: 'Java Language Specification', url: 'https://docs.oracle.com/javase/specs/' }
  ]
},
{
  id: 'core-019',
  topic: 'core',
  level: 'senior',
  q: 'String concat bằng {{+}} sau Java 9 (invokedynamic), {{StringBuilder}} khi nào thực sự cần, {{String.format}} chậm ra sao?',
  a: `**Tóm tắt:** từ Java 9, {{+}} dùng {{invokedynamic}} + {{StringConcatFactory}} sinh bytecode tối ưu tại runtime, nhanh ngang {{StringBuilder}} cho các phép concat đơn giản; {{StringBuilder}} vẫn cần cho vòng lặp, concat có điều kiện, hoặc tùy chỉnh capacity; {{String.format}} chậm do parse format string và tạo {{Formatter}} mỗi lần.
 
### String concat sau Java 9 (JEP 280)
- Trước Java 9: {{a + b + c}} biên dịch thành chuỗi {{new StringBuilder().append(a).append(b).append(c).toString()}}.
- Java 9+: compiler sinh lời gọi {{invokedynamic}} bootstrap method {{StringConcatFactory.makeConcatWithConstants}}; runtime chọn chiến lược tối ưu ({{StringBuilder}}, {{String.join}}, {{Arrays.copyOf}}, thậm chí {{StringConcatHelper}}).
- Lợi ích: JIT có thể inline, tối ưu theo profile thực tế; không tạo {{StringBuilder}} trung gian trong bytecode tĩnh.
- Kết quả: {{s1 + s2 + s3}} nhanh như {{StringBuilder}} thủ công, code dễ đọc hơn.

### Khi nào vẫn cần StringBuilder
- **Vòng lặp**: concat trong loop tạo nhiều lời gọi {{invokedynamic}} riêng lẻ, không gộp được.
~~~java
// Chậm: mỗi vòng một invokedynamic
String s = "";
for (String part : parts) s += part; 

// Nhanh: một StringBuilder
StringBuilder sb = new StringBuilder(estimatedSize);
for (String part : parts) sb.append(part);
String s = sb.toString();
~~~
- **Concat có điều kiện/phân nhánh**: logic phức tạp mà bootstrap method không gộp được.
- **Cần kiểm soát capacity**: tránh resize nội bộ ({{new StringBuilder(1024)}}).
- **Thread-local buffer**: tái dùng {{StringBuilder}} trong hot path (cẩn thận thread-safety).

### String.format chậm ra sao
- Parse format string ({{%d}}, {{%s}}, {{%.2f}}...) mỗi lần gọi — regex/internal parser.
- Tạo {{Formatter}} object mới mỗi lần (allocation).
- Boxing/unboxing cho primitive argument.
- Locale handling mặc định.

~~~java
// Chậm
String msg = String.format("User %s has %d orders", name, count);

// Nhanh: concat đơn giản
String msg = "User " + name + " has " + count + " orders";

// Hoặc StringBuilder cho nhiều phần
String msg = new StringBuilder("User ").append(name).append(" has ").append(count).append(" orders").toString();
~~~

### Benchmark gợi ý (JMH)
- {{+}} / {{StringConcatFactory}}: ~1-2 ns/op cho 3-4 string ngắn.
- {{StringBuilder}} thủ công: ~1-2 ns/op (tương đương).
- {{String.format}}: ~50-100 ns/op (chậm 50-100x).
- {{MessageFormat}}: còn chậm hơn.

### Pitfall
- Concat trong log statement: {{log.info("Processing " + id + " for " + user)}} — chuỗi được tạo **trước** khi kiểm tra log level; dùng code block dưới (SLF4J placeholder) để lazy evaluation.
~~~java
log.info("Processing {} for {}", id, user);
~~~
- {{String.join}} cho collection: tiện nhưng tạo mảng trung gian nếu truyền varargs; dùng {{StringJoiner}} cho stream.

> Senior tip: mặc định viết {{+}} cho concat đơn giản (Java 9+), chỉ dùng {{StringBuilder}} khi có vòng lặp hoặc cần capacity. Bật {{-XX:+PrintStringConcat}} để xem chiến lược JIT chọn. Với logging, **luôn dùng placeholder SLF4J** — đây là lỗi performance hay gặp nhất trong production.`,
  follow: [
    'Vì sao {{invokedynamic}} giúp concat nhanh hơn bytecode tĩnh?',
    '{{String.join}} khác {{Collectors.joining}} ở điểm nào?',
    'Khi nào {{StringBuilder}} thread-local là ý tưởng tốt/hay?'
  ],
  tags: ['String', 'concat', 'invokedynamic', 'StringBuilder', 'String.format'],
  refs: [
    { type: 'doc', title: 'Java Language Specification', url: 'https://docs.oracle.com/javase/specs/' }
  ]
},
{
  id: 'core-020',
  topic: 'core',
  level: 'mid',
  q: 'Giải thích 4 tính chất OOP bằng ví dụ thật trong code nghiệp vụ bạn từng viết (không đọc định nghĩa). Tính chất nào bạn thấy hay bị dùng sai nhất?',
  a: `**Tóm tắt:** Encapsulation là giấu state và chỉ cho đổi qua method giữ được invariant (ví dụ {{Account.withdraw}} không cho số dư âm). Abstraction là caller chỉ biết "cái gì" qua interface ({{PaymentProcessor.pay}}), không biết "làm thế nào". Inheritance là tái sử dụng hành vi theo quan hệ "is-a" thật sự. Polymorphism là cùng một lời gọi chạy implementation khác nhau theo object thực tế, nhờ đó thêm cổng thanh toán mới không phải sửa if/else. Hay bị dùng sai nhất là inheritance: kế thừa chỉ để dùng lại code.

### Encapsulation: bảo vệ invariant, không phải "getter/setter cho mọi field"
~~~java
public class Account {
    private BigDecimal balance;                 // không ai sửa trực tiếp
    private final List<Txn> history = new ArrayList<>();

    public void withdraw(BigDecimal amount) {
        if (amount.signum() <= 0) throw new IllegalArgumentException("amount <= 0");
        if (balance.compareTo(amount) < 0) throw new InsufficientFundsException();
        balance = balance.subtract(amount);     // invariant: balance >= 0 luôn đúng
        history.add(Txn.debit(amount));         // state đổi cùng nhau, không lệch
    }
    public BigDecimal getBalance() { return balance; }   // không có setBalance
    public List<Txn> history() { return List.copyOf(history); } // không lộ list nội bộ
}
~~~
Vì sao quan trọng: nếu có {{setBalance}}, bất kỳ service nào cũng có thể ghi số dư âm hoặc quên ghi lịch sử. Rule nghiệp vụ nằm rải rác thì không ai kiểm soát được.

### Abstraction + Polymorphism: bỏ chuỗi if/else theo loại
~~~java
public interface PaymentProcessor {             // abstraction: chỉ nói "thanh toán"
    PaymentMethod method();
    PaymentResult pay(Order order);
}

@Service
public class CheckoutService {
    private final Map<PaymentMethod, PaymentProcessor> processors;

    public CheckoutService(List<PaymentProcessor> all) {  // Spring inject mọi bean
        this.processors = all.stream()
            .collect(Collectors.toMap(PaymentProcessor::method, p -> p));
    }
    public PaymentResult checkout(Order o) {
        return processors.get(o.method()).pay(o); // dynamic dispatch theo object thật
    }
}
~~~
Thêm VNPay, MoMo hay ZaloPay chỉ cần thêm một class {{@Component}} mới; {{CheckoutService}} không đổi (Open/Closed). Đó là lợi ích thật của polymorphism, đáng nói hơn ví dụ Dog/Cat.

### Inheritance: dùng khi có "is-a" và khung chung
Ví dụ hợp lý là template method: {{AbstractStatementExporter}} có method {{final export()}} gọi lần lượt {{header()}}, {{rows()}}, {{footer()}}; lớp con PDF và Excel chỉ override từng bước. Kế thừa sai là {{class OrderService extends BaseDao}} chỉ để gọi được {{save()}}: nó gắn chặt hai lớp, lộ method không mong muốn và vi phạm Liskov. Nên dùng composition (inject {{OrderRepository}}).

| Tính chất | Câu hỏi nó trả lời | Dấu hiệu dùng sai |
|---|---|---|
| Encapsulation | Ai được đổi state, theo rule nào? | Entity toàn setter public, rule nằm ở service |
| Abstraction | Caller cần biết gì tối thiểu? | Interface lộ chi tiết của provider (HTTP status, SQL) |
| Inheritance | Có thật là "is-a" không? | Kế thừa để dùng lại helper, cây sâu hơn 2–3 tầng |
| Polymorphism | Có thể thay implementation không? | {{instanceof}}/switch theo type rải khắp nơi |

### Câu trả lời sai phổ biến
- Đọc định nghĩa sách giáo khoa và lấy ví dụ Animal/Dog, không liên hệ được với code thật.
- Nhầm encapsulation với "field private + getter/setter đầy đủ". Có setter cho mọi field thì vẫn là phá encapsulation.
- Nhầm abstraction (thiết kế mức khái niệm, interface) với encapsulation (giấu dữ liệu và bảo vệ invariant).
- Chỉ nói đến runtime polymorphism (overriding) mà quên overloading là compile-time polymorphism.

> Senior tip: khi trả lời, chọn một ví dụ xuyên suốt (thanh toán, tài khoản) rồi chỉ ra trade-off: "tôi ưu tiên composition, chỉ kế thừa khi có khung template rõ ràng". Interviewer ngân hàng thường hỏi tiếp sang SOLID và Strategy pattern, nên chuẩn bị sẵn ví dụ {{Map<Type, Strategy>}} như trên.`,
  follow: [
    'Composition over inheritance: cho một ví dụ bạn đã refactor từ kế thừa sang composition.',
    'JPA entity cần no-arg constructor và setter thì làm sao vẫn giữ được encapsulation?',
    'Liskov Substitution Principle bị vi phạm trong ví dụ nào bạn từng gặp?'
  ],
  tags: ['OOP', 'encapsulation', 'polymorphism', 'inheritance', 'abstraction']
},
{
  id: 'core-021',
  topic: 'core',
  level: 'senior',
  q: 'Overloading vs overriding: quy tắc với {{static}}, {{private}}, {{final}}, kiểu trả về covariant và exception là gì? Dự đoán output khi gọi static method qua reference kiểu cha.',
  a: `**Tóm tắt:** Overloading là nhiều method cùng tên nhưng khác danh sách tham số; compiler chọn method lúc **compile time** dựa trên **kiểu khai báo** của argument. Overriding là lớp con định nghĩa lại method instance cùng chữ ký; JVM chọn lúc **runtime** dựa trên **object thật**. {{static}} method không override được mà chỉ bị **hiding**; {{private}} và {{final}} không override được.

### Bảng quy tắc
| Quy tắc | Overloading | Overriding |
|---|---|---|
| Khi nào chọn | Compile time, theo static type | Runtime, theo dynamic type (vtable) |
| Chữ ký | Cùng tên, khác parameter list | Cùng tên và parameter list |
| Return type | Tuỳ ý, nhưng không thể chỉ khác return type | Giống hệt, hoặc subtype (covariant) nếu là reference type |
| Access modifier | Tuỳ ý | Không được hẹp hơn (protected lên public được, ngược lại không) |
| Checked exception | Tuỳ ý | Không được ném checked exception mới hoặc rộng hơn; unchecked thì thoải mái |
| static / private / final | Overload được | Không override được (static thì hiding) |

### Dự đoán output: static hiding vs dynamic dispatch
~~~java
class Parent {
    static String who()  { return "Parent.static"; }
    String name()        { return "Parent.instance"; }
}
class Child extends Parent {
    static String who()  { return "Child.static"; }      // hiding
    @Override String name() { return "Child.instance"; } // overriding
}

Parent p = new Child();
System.out.println(p.who());   // Parent.static  (chọn theo kiểu khai báo Parent)
System.out.println(p.name());  // Child.instance (chọn theo object thật)
~~~
Vì sao: lời gọi static được compiler bind sẵn thành {{invokestatic Parent.who}}, nên object thật không liên quan. Method instance được compile thành {{invokevirtual}} và JVM tra bảng method của class thật lúc chạy.

### Dự đoán output: overload resolution
~~~java
static void print(Object o)  { System.out.println("Object"); }
static void print(String s)  { System.out.println("String"); }
static void print(long x)    { System.out.println("long"); }
static void print(Integer x) { System.out.println("Integer"); }

Object obj = "hello";
print(obj);   // Object: chọn theo static type, không phải runtime type
print("hi");  // String: method cụ thể nhất
print(5);     // long: widening (phase 1) thắng boxing (phase 2)
// print(null); -> lỗi compile "ambiguous": String và Integer ngang nhau
~~~
Compiler tìm theo 3 phase: (1) không boxing, không varargs; (2) cho phép boxing/unboxing; (3) cho phép varargs. Phase nào tìm thấy thì dừng, sau đó chọn method cụ thể nhất.

### private và final
- {{private}} method không được kế thừa. Lớp con viết method cùng tên là method **mới**; thêm {{@Override}} sẽ lỗi compile. Code trong lớp cha gọi method đó vẫn chạy bản của lớp cha.
- {{final}} method thì không cho override, dùng để khoá thuật toán (ví dụ bước kiểm tra chữ ký trong template method).

### Câu trả lời sai phổ biến
- "Chỉ khác return type cũng là overload": sai, lỗi compile.
- "Static method override được vì gọi được qua instance": sai, đó là hiding và gọi qua instance chỉ là cú pháp gây hiểu nhầm.
- "Overloading chọn theo object thật": sai, nó chọn theo kiểu khai báo.

### Pitfall production
- Viết {{public boolean equals(Account other)}}: đây là **overload**, không phải override {{equals(Object)}}. {{HashSet}} và {{List.contains}} gọi bản {{Object}} nên không bao giờ dùng method của bạn. Luôn gắn {{@Override}}.
- {{List<Integer>}} có {{remove(int index)}} và {{remove(Object o)}}: gọi {{list.remove(1)}} sẽ xoá phần tử ở **index 1**, không phải giá trị 1. Muốn xoá giá trị thì gọi {{list.remove(Integer.valueOf(1))}}.
- Hai overload {{f(List<String>)}} và {{f(List<Integer>)}} lỗi compile "name clash" vì sau type erasure có cùng chữ ký.

> Senior tip: bật cảnh báo thiếu {{@Override}} trong IDE/Sonar và coi đó là lỗi. Với API public, hạn chế overload có cùng số tham số mà kiểu dễ autobox lẫn nhau (int/Integer/long/Object), vì người gọi rất dễ trỏ nhầm method mà không hề biết.`,
  follow: [
    'Vì sao field không có polymorphism? {{p.field}} với {{p}} khai báo kiểu cha trả về giá trị nào?',
    'Gọi một method overridable trong constructor lớp cha thì nguy hiểm thế nào?',
    'Bridge method do compiler sinh ra khi override method generic là gì?'
  ],
  tags: ['overloading', 'overriding', 'method hiding', 'polymorphism', 'covariant return'],
  refs: [
    { type: 'doc', title: 'Java Language Specification', url: 'https://docs.oracle.com/javase/specs/' }
  ]
},
{
  id: 'core-022',
  topic: 'core',
  level: 'mid',
  q: 'Dự đoán output: so sánh {{==}} và {{equals}} với String literal, {{new String}}, chuỗi nối lúc runtime và {{Integer}}. Vì sao so sánh ID kiểu {{Long}} bằng {{==}} chạy đúng ở dev nhưng hỏng ở production?',
  a: `**Tóm tắt:** {{==}} so sánh **reference** (hai biến có trỏ cùng một object không), còn {{equals}} so sánh **nội dung**, với điều kiện class đã override nó. String literal và hằng số compile-time được đưa vào String pool nên {{==}} tình cờ ra true; chuỗi tạo lúc runtime thì không. {{Integer}}/{{Long}} cache từ -128 đến 127, nên {{==}} đúng với ID nhỏ ở môi trường dev và sai khi ID lớn hơn 127 trên production.

### Dự đoán output: String
~~~java
String a = "hello";
String b = "hello";
String c = new String("hello");
String d = "hel" + "lo";         // hằng compile-time: compiler gộp thành "hello"
String part = "hel";
String e = part + "lo";          // part không phải hằng: nối lúc runtime, object mới
final String fpart = "hel";
String f = fpart + "lo";         // fpart là constant variable: lại được gộp

System.out.println(a == b);          // true
System.out.println(a == c);          // false
System.out.println(a.equals(c));     // true
System.out.println(a == d);          // true
System.out.println(a == e);          // false
System.out.println(a == e.intern()); // true
System.out.println(a == f);          // true
~~~
Vì sao:
- Mọi literal giống nhau trong cùng JVM dùng chung một object trong String pool, nên {{a == b}}.
- {{new String(...)}} luôn tạo object mới trên heap, kể cả khi pool đã có "hello".
- {{"hel" + "lo"}} và {{fpart + "lo"}} là **constant expression** (JLS 15.29), được tính ngay lúc compile và intern như literal. Bỏ {{final}} đi thì {{part + "lo"}} chạy lúc runtime (qua {{StringConcatFactory}}) và tạo object mới.
- {{intern()}} trả về object trong pool có cùng nội dung.

### Dự đoán output: wrapper
~~~java
Integer x = 127, y = 127;
Integer m = 128, n = 128;
Long id = 127L;
System.out.println(x == y);         // true: cùng object trong cache
System.out.println(m == n);         // false: ngoài cache, 2 object khác nhau
System.out.println(m.equals(n));    // true
System.out.println(m == 128);       // true: m bị unbox, so sánh giá trị int
System.out.println(x.equals(127L)); // false: 127L box thành Long, khác class
System.out.println(id.equals(127)); // false: 127 box thành Integer
~~~
Kết quả trên đúng với cấu hình mặc định; cờ {{-XX:AutoBoxCacheMax}} có thể nới cache của {{Integer}}, nên càng không được dựa vào {{==}}.

### equals không phải lúc nào cũng so nội dung
{{Object.equals}} mặc định chính là {{==}}. {{StringBuilder}} **không** override {{equals}}, nên {{new StringBuilder("a").equals(new StringBuilder("a"))}} trả về false. Muốn so nội dung thì dùng {{sb1.compareTo(sb2) == 0}} (Java 11+) hoặc so {{toString()}}. {{BigDecimal.equals}} lại so cả scale: {{2.0}} khác {{2.00}}.

### Câu trả lời sai phổ biến
- "Với String thì {{==}} so sánh giá trị": nó chỉ đúng tình cờ khi cả hai cùng là literal.
- "{{equals}} luôn so sánh nội dung": chỉ đúng khi class override nó.
- Quên rằng {{Integer.equals(Long)}} luôn false dù cùng giá trị.

### Pitfall production
- {{if (order.getUserId() == currentUser.getId())}} với {{Long}}: test bằng user ID 1, 2, 3 đều pass; lên production ID 10 523 thì false, gây lỗi phân quyền "không phải chủ đơn hàng". Dùng {{Objects.equals(a, b)}} (an toàn với null) hoặc so primitive.
- {{status == "ACTIVE"}} với status đọc từ DB hoặc JSON: chuỗi được tạo runtime nên luôn false. Dùng {{"ACTIVE".equals(status)}} để tránh luôn NPE, hoặc tốt hơn là enum (enum so bằng {{==}} là đúng và nhanh).

> Senior tip: bật rule Sonar/ErrorProne "reference comparison of boxed types / strings" ở mức blocker. Bug {{Long ==}} là loại lỗi chỉ lộ ra khi dữ liệu đủ lớn, nên test unit với ID nhỏ không bao giờ bắt được; khi viết test hãy cố ý dùng ID lớn hơn 127.`,
  follow: [
    '{{new String("hello")}} tạo ra bao nhiêu object? Phụ thuộc vào điều gì?',
    'Vì sao enum so sánh bằng {{==}} lại an toàn, kể cả khi deserialize?',
    '{{switch}} trên String hoạt động thế nào bên trong ({{hashCode}} rồi {{equals}})?'
  ],
  tags: ['equals', 'String pool', 'Integer cache', 'predict output', 'wrapper']
},
{
  id: 'core-023',
  topic: 'core',
  level: 'senior',
  q: 'Dự đoán output: {{return}} trong {{try}} rồi sửa biến trong {{finally}}, {{return}} trong {{finally}}, exception trong {{finally}}, và {{System.exit}} trong {{try}}. Những tình huống này gây bug production thế nào?',
  a: `**Tóm tắt:** Khi {{try}} chạy {{return expr}}, giá trị của {{expr}} được tính và lưu tạm **trước** khi {{finally}} chạy; sửa biến primitive trong {{finally}} không đổi giá trị trả về, nhưng sửa object mà reference trỏ tới thì có. {{return}} hoặc {{throw}} trong {{finally}} **thay thế** kết quả của {{try}} và nuốt mất exception gốc. {{System.exit}} dừng JVM nên {{finally}} không chạy.

### 1. Thứ tự thực thi
~~~java
static int order() {
    try {
        System.out.println("try");
        return value("return-expr");   // biểu thức return được tính trước
    } finally {
        System.out.println("finally");
    }
}
static int value(String s) { System.out.println(s); return 1; }
// Output:
// try
// return-expr
// finally
~~~

### 2. Sửa biến trong finally
~~~java
static int primitive() {
    int x = 1;
    try {
        return x;          // giá trị 1 được copy vào một slot tạm
    } finally {
        x = 2;             // đổi biến local, không đổi slot tạm
    }
}                          // primitive() trả về 1

static StringBuilder reference() {
    StringBuilder sb = new StringBuilder("a");
    try {
        return sb;         // copy reference, cùng trỏ một object
    } finally {
        sb.append("b");    // sửa chính object đó
    }
}                          // reference() trả về "ab"
~~~
Vì sao: compiler sinh bytecode lưu giá trị return vào một biến local ẩn, chạy code {{finally}} (được nhân bản inline vào từng lối ra), rồi mới {{ireturn}}/{{areturn}} giá trị ẩn đó. Với reference, thứ được copy là con trỏ chứ không phải object.

### 3. return trong finally nuốt exception
~~~java
static int swallow() {
    try {
        throw new RuntimeException("boom");
    } finally {
        return 2;          // compiler chỉ cảnh báo: finally không kết thúc bình thường
    }
}                          // swallow() trả về 2, "boom" biến mất không dấu vết
~~~

### 4. Exception trong finally thay thế exception gốc
~~~java
try {
    try {
        throw new IllegalStateException("A");
    } finally {
        throw new RuntimeException("B");
    }
} catch (RuntimeException e) {
    System.out.println(e.getMessage() + " suppressed=" + e.getSuppressed().length);
}
// Output: B suppressed=0   -> "A" mất hẳn, không có trong suppressed
~~~
Chỉ try-with-resources mới tự gắn exception lúc đóng resource vào {{getSuppressed()}}; {{finally}} viết tay thì không.

### 5. System.exit
~~~java
try {
    System.out.println("try");
    System.exit(0);
} finally {
    System.out.println("finally");   // không bao giờ in
}
// Output: try
~~~
{{System.exit}} không return; JVM chạy shutdown hook rồi dừng. {{finally}} cũng không chạy khi gọi {{Runtime.halt}}, khi process bị {{kill -9}}, JVM crash, hay khi thread daemon đang dở mà JVM tắt.

### Câu trả lời sai phổ biến
- "finally chạy sau return nên giá trị trả về là 2": sai với primitive.
- "finally luôn luôn chạy": sai với {{System.exit}}, halt, kill -9.
- "Exception trong finally sẽ được nối vào exception cũ": sai, exception cũ mất hẳn.

### Pitfall production
- Gọi {{conn.close()}} trong {{finally}} mà {{close()}} ném lỗi sẽ che mất lỗi SQL thật, log chỉ còn "connection already closed". Dùng try-with-resources.
- {{return}} trong {{finally}} làm method báo thành công trong khi giao dịch đã lỗi, nên caller không rollback hay retry. Rất khó điều tra vì log sạch.
- Gọi {{System.exit}} trong code thư viện hoặc job Spring sẽ bỏ qua {{finally}} và có thể bỏ dở batch đang ghi dở dang.

> Senior tip: cấm {{return}}/{{throw}} trong {{finally}} bằng static analysis (Sonar có rule "jump statements should not occur in finally blocks"). Trong {{finally}} chỉ nên dọn dẹp, không xử lý nghiệp vụ; nếu dọn dẹp có thể lỗi thì bọc try/catch riêng và log lỗi đó, đừng để nó đè lên lỗi chính.`,
  follow: [
    'try-with-resources sinh ra bytecode thế nào để giữ được suppressed exception?',
    'Shutdown hook có chạy khi container bị SIGTERM không? Còn SIGKILL thì sao?',
    'Nếu {{catch}} cũng có {{return}} và {{finally}} cũng có {{return}} thì giá trị nào được trả về?'
  ],
  tags: ['finally', 'exception', 'predict output', 'System.exit', 'try-catch'],
  refs: [
    { type: 'doc', title: 'Java Language Specification', url: 'https://docs.oracle.com/javase/specs/' }
  ]
},
{
  id: 'core-024',
  topic: 'core',
  level: 'senior',
  q: 'Dự đoán output: thứ tự chạy static block, instance block, field initializer và constructor khi có kế thừa. Vì sao gọi method overridable trong constructor lớp cha lại nguy hiểm?',
  a: `**Tóm tắt:** Static block và static field chạy **một lần**, khi class được khởi tạo lần đầu, theo thứ tự cha trước con. Mỗi lần {{new}}: constructor con gọi {{super()}} trước; sau khi constructor cha xong mới chạy field initializer và instance block của lớp con (theo thứ tự xuất hiện trong code), rồi tới thân constructor con. Vì vậy method bị override mà được gọi từ constructor cha sẽ thấy field lớp con **chưa được gán** (null/0).

### Dự đoán output: cơ bản
~~~java
class Parent {
    static { System.out.println("Parent static"); }
    { System.out.println("Parent instance block"); }
    Parent() { System.out.println("Parent constructor"); }
}
class Child extends Parent {
    static { System.out.println("Child static"); }
    { System.out.println("Child instance block"); }
    Child() { System.out.println("Child constructor"); }
}
new Child();
new Child();
~~~
~~~text
Parent static
Child static
Parent instance block
Parent constructor
Child instance block
Child constructor
Parent instance block
Parent constructor
Child instance block
Child constructor
~~~
Vì sao: muốn khởi tạo {{Child}} thì JVM phải khởi tạo {{Parent}} trước (JLS 12.4). Lần {{new}} thứ hai class đã được khởi tạo nên không còn dòng static. Compiler chép field initializer và instance block vào **mỗi constructor**, ngay sau lệnh gọi {{super(...)}}, nên chúng luôn chạy sau constructor cha.

### Bẫy 1: method override gọi từ constructor cha
~~~java
class Base {
    Base() { init(); }                 // gọi method có thể bị override
    void init() { }
}
class Derived extends Base {
    private String name = "derived";   // chỉ được gán SAU khi Base() xong
    private final int size = 10;       // constant variable: compiler inline số 10
    @Override void init() {
        System.out.println(name + " " + size);
    }
}
new Derived();
// Output: null 10
~~~
{{name}} vẫn là giá trị mặc định null vì initializer của {{Derived}} chưa chạy. {{size}} in ra 10 vì nó là {{final}} primitive gán bằng hằng compile-time, nên mọi chỗ dùng đều được thay bằng số 10. Bỏ {{final}} thì sẽ in {{null 0}}.

### Bẫy 2: thứ tự static field
~~~java
class Config {
    static Config INSTANCE = new Config();   // chạy trước
    static int counter = 0;                  // chạy sau, ghi đè
    Config() { counter++; }
}
System.out.println(Config.counter);          // Output: 0
~~~
Khi khởi tạo class, mọi static field có giá trị mặc định (counter = 0). Dòng 1 tạo object và tăng counter lên 1, sau đó dòng 2 gán lại counter = 0. Đổi thứ tự hai dòng thì output là 1.

### Khi nào class được khởi tạo
- Lần đầu {{new}}, gọi static method, đọc/ghi static field (không phải hằng), {{Class.forName}}, hoặc khởi tạo lớp con.
- Đọc một {{static final}} hằng compile-time (ví dụ {{static final int MAX = 5}}) **không** kích hoạt static block, vì giá trị đã được inline vào class gọi.
- Đây là nền tảng của pattern Holder: {{static class Holder}} chứa instance singleton, được khởi tạo lazy và thread-safe nhờ JVM khoá quá trình class init.

### Câu trả lời sai phổ biến
- "Instance block chạy trước constructor cha": sai, nó chạy sau {{super()}}.
- "Static block chạy mỗi lần new": sai, chỉ một lần cho mỗi class loader.
- Cho rằng {{final}} field luôn có giá trị khi được gọi từ constructor cha: chỉ đúng với hằng compile-time.

### Pitfall production
- Lớp cha gọi {{init()}} hoặc {{validate()}} trong constructor, lớp con override và dùng field chưa gán, gây NPE khó hiểu. Effective Java khuyên: constructor không được gọi method overridable (trực tiếp hay gián tiếp).
- Exception trong static block làm lần đầu thấy {{ExceptionInInitializerError}}, các lần sau thấy {{NoClassDefFoundError}}. Ai chỉ đọc log mới nhất sẽ tưởng thiếu jar.
- Hai class có static init phụ thuộc vòng nhau và được khởi tạo từ hai thread khác nhau có thể deadlock ngay lúc khởi động.

> Senior tip: giữ static block thật mỏng (không gọi network/DB, không đọc config phức tạp). Trong Spring, dùng constructor injection và {{@PostConstruct}} thay vì logic trong static/instance block; khi gặp {{NoClassDefFoundError}} trên production, hãy tìm {{ExceptionInInitializerError}} đầu tiên trong log.`,
  follow: [
    'Vì sao static nested Holder là cách lazy singleton thread-safe mà không cần {{synchronized}}?',
    'Phân biệt {{ExceptionInInitializerError}} và {{NoClassDefFoundError}} khi điều tra lỗi khởi động.',
    'Record và enum có thứ tự khởi tạo đặc biệt gì không?'
  ],
  tags: ['initialization order', 'static block', 'constructor', 'predict output', 'class loading'],
  refs: [
    { type: 'doc', title: 'Java Language Specification', url: 'https://docs.oracle.com/javase/specs/' }
  ]
},
{
  id: 'core-025',
  topic: 'core',
  level: 'senior',
  q: 'Stack vs heap trong JVM: biến local, object, reference, static field và String pool nằm ở đâu? {{StackOverflowError}} xảy ra khi nào trên production và xử lý thế nào?',
  a: `**Tóm tắt:** Mỗi thread có một **JVM stack** riêng gồm các frame; mỗi lần gọi method sinh một frame chứa biến local (primitive và **reference**) và operand stack, method return thì frame bị huỷ. Mọi **object** (kể cả mảng và field bên trong object) nằm trên **heap** dùng chung, do GC quản lý. Static field nằm cùng đối tượng {{Class}} trên heap, metadata của class nằm ở Metaspace, String pool nằm trên heap từ Java 7. {{StackOverflowError}} xảy ra khi chuỗi lời gọi sâu vượt quá kích thước stack ({{-Xss}}), thường do đệ quy vô hạn.

### Ví dụ: cái gì nằm ở đâu
~~~java
class TransferService {
    static final Map<String, BigDecimal> LIMITS = new HashMap<>(); // reference trong Class mirror, map trên heap

    void transfer(Account from, long amount) {   // 'from': reference, nằm trong frame
        int fee = 1_000;                          // primitive local: nằm trong frame
        Receipt r = new Receipt(amount, fee);     // 'r' trong frame, object Receipt trên heap
        from.debit(amount + fee);                 // frame mới cho debit() được push
    }   // frame bị pop: fee và r biến mất; Receipt thành rác nếu không ai giữ reference
}
~~~
Lưu ý: field {{int}} của một object nằm trên **heap** cùng object đó, không phải trên stack.

### So sánh
| | Stack (mỗi thread) | Heap (dùng chung) |
|---|---|---|
| Chứa gì | Frame: biến local, reference, operand stack | Object, mảng, field của object, String pool |
| Vòng đời | Theo lời gọi method (LIFO) | Đến khi không còn reference và GC thu hồi |
| Kích thước | {{-Xss}} (Linux 64-bit mặc định khoảng 1 MB) | {{-Xms}}/{{-Xmx}} |
| Lỗi khi hết | {{StackOverflowError}} | {{OutOfMemoryError: Java heap space}} |
| Thread-safety | Biến local tự nhiên thread-confined | Cần đồng bộ khi chia sẻ |

### Vì sao thiết kế như vậy
- Stack cấp phát/giải phóng chỉ bằng dịch con trỏ, cực rẻ, và không cần GC; nhưng kích thước phải biết theo method và sống ngắn.
- Object có vòng đời không đoán trước (được trả về, lưu vào cache) nên phải nằm ở vùng chung có GC.
- JIT có **escape analysis**: object không thoát khỏi method có thể được scalar replacement (tách field thành biến local) nên không cấp phát trên heap. Đây là tối ưu, không phải đảm bảo.
- Virtual thread (Java 21): khi bị unmount, stack của nó được lưu thành các chunk object trên heap, nhờ vậy tạo hàng triệu virtual thread được.

### StackOverflowError trên production
- Entity JPA hai chiều ({{Order}} có list {{OrderItem}}, {{OrderItem}} trỏ ngược lại {{Order}}) dùng Lombok {{@Data}}: {{toString()}}/{{hashCode()}} gọi nhau vô hạn. Jackson serialize quan hệ hai chiều cũng vậy.
- Đệ quy trên dữ liệu do người dùng kiểm soát: cây danh mục sâu, JSON lồng nhau hàng nghìn tầng, regex có backtracking lớn.
- Xử lý: sửa thuật toán thành vòng lặp + {{ArrayDeque}} làm stack tường minh; loại field quan hệ khỏi {{toString}}/{{equals}}; dùng {{@JsonManagedReference}}/{{@JsonBackReference}} hoặc DTO; giới hạn độ sâu input. Tăng {{-Xss}} chỉ là giải pháp tạm và tốn bộ nhớ nhân với số thread.

### Câu trả lời sai phổ biến
- "Primitive luôn nằm trên stack": sai, primitive là field của object thì nằm trên heap.
- "Static nằm trên stack" hoặc "String pool nằm trong PermGen": PermGen đã bị bỏ từ Java 8, String pool chuyển lên heap từ Java 7.
- "Java truyền object theo reference": Java luôn pass-by-value; giá trị được copy là reference.

> Senior tip: khi thấy {{StackOverflowError}}, đọc stack trace để tìm đoạn lặp lại (thường là {{toString}} hoặc {{hashCode}} lặp xen kẽ giữa 2 class). Đừng bắt {{StackOverflowError}} để xử lý tiếp, vì trạng thái lúc đó có thể dở dang. Với {{OutOfMemoryError: unable to create native thread}}, nguyên nhân là quá nhiều thread (mỗi thread tốn stack riêng) chứ không phải thiếu heap.`,
  follow: [
    'Escape analysis và scalar replacement hoạt động thế nào? Làm sao biết nó có xảy ra?',
    'Metaspace khác PermGen ở đâu? Khi nào gặp {{OutOfMemoryError: Metaspace}}?',
    'Vì sao virtual thread vẫn có thể bị pin vào carrier thread trong Java 21?'
  ],
  tags: ['stack', 'heap', 'StackOverflowError', 'JVM memory', 'String pool'],
  refs: [
    { type: 'doc', title: 'Java Language Specification', url: 'https://docs.oracle.com/javase/specs/' }
  ]
},
{
  id: 'core-026',
  topic: 'core',
  level: 'lead',
  q: 'Access modifier: {{protected}} và package-private thực sự hoạt động thế nào (kể cả bẫy khi truy cập qua reference kiểu cha)? Vì sao field nên {{private}}, và bạn dùng visibility để giữ ranh giới module trong codebase lớn thế nào?',
  a: `**Tóm tắt:** Có 4 mức: {{private}} (chỉ trong class), package-private/không ghi gì (cùng package), {{protected}} (cùng package **cộng** lớp con ở package khác, nhưng lớp con chỉ truy cập được qua reference kiểu của chính nó), {{public}} (mọi nơi, nếu module export package). Field nên {{private}} để class tự giữ invariant và đổi được cách lưu trữ mà không làm vỡ code khác. Ở mức kiến trúc, package-private là công cụ rẻ nhất để giấu implementation của một module nghiệp vụ.

### Bảng truy cập
| Modifier | Cùng class | Cùng package | Lớp con khác package | Nơi khác |
|---|---|---|---|---|
| private | Có | Không | Không | Không |
| (package-private) | Có | Có | Không | Không |
| protected | Có | Có | Có (qua kiểu của chính lớp con) | Không |
| public | Có | Có | Có | Có |

Điều nhiều người không biết: {{protected}} **rộng hơn** package-private, vì nó bao gồm cả cùng package.

### Bẫy protected khi khác package (JLS 6.6.2)
~~~java
package com.bank.core;
public class Account {
    protected long balance;
    void audit() { }                         // package-private
}

package com.bank.saving;
public class SavingAccount extends Account {
    void applyInterest(Account other, SavingAccount same) {
        this.balance += 10;                  // OK: qua chính object này
        same.balance += 10;                  // OK: reference kiểu SavingAccount
        // other.balance += 10;              // LỖI compile: Account không phải kiểu của mình
        // audit();                          // LỖI compile: package-private, khác package
    }
}
~~~
Vì sao: {{protected}} nghĩa là "lớp con được dùng phần kế thừa **của chính nó**", không phải "được đọc protected field của mọi object kiểu cha". Nếu không, bất kỳ ai cũng có thể viết một lớp con giả để đọc state của object khác.

### Vì sao field nên private
- **Invariant**: chỉ method của class mới đổi được state, nên kiểm tra nằm một chỗ ({{balance >= 0}}).
- **Đổi representation**: đổi {{long cents}} sang {{BigDecimal}} mà caller không phải sửa.
- **Thread-safety**: class không thể đảm bảo đồng bộ hay visibility cho field mà ai cũng ghi trực tiếp được.
- **Hibernate proxy**: trong {{equals}} mà đọc {{other.id}} trực tiếp, nếu {{other}} là lazy proxy thì field của proxy là null; gọi {{other.getId()}} mới đúng. Đây là bug thật hay gặp khi so sánh entity.

### Dùng visibility làm ranh giới module (góc nhìn Lead)
- Tổ chức **package-by-feature** ({{payment}}, {{loan}}, {{customer}}) thay vì package-by-layer ({{controller}}, {{service}}, {{repository}}). Khi đó chỉ class facade/API là {{public}}, còn repository, mapper, helper để package-private, nên module khác không thể gọi tắt vào repository của bạn.
- Spring vẫn inject được bean package-private, và test đặt cùng package vẫn test được.
- Dùng ArchUnit (hoặc Spring Modulith) để viết test kiểm tra rule "module loan không được phụ thuộc vào package internal của payment" trong CI.
- Java 9 JPMS: {{public}} không còn nghĩa là ai cũng thấy; package phải được {{exports}} trong {{module-info.java}}. Từ Java 16/17, JDK chặn mặc định reflection vào API nội bộ (JEP 403), nên các thư viện cũ dùng {{setAccessible}} vào {{sun.*}} có thể lỗi khi nâng cấp.

### Câu trả lời sai phổ biến
- "protected chỉ dành cho lớp con": sai, cùng package cũng truy cập được.
- "Không ghi modifier thì mặc định là private" (nhầm với C#/C++ class member).
- "Field private + getter/setter public là đủ encapsulation": setter cho mọi field vẫn phá invariant.

### Pitfall trong Spring
- {{@Transactional}} hoặc {{@Cacheable}} đặt trên method {{private}} không bao giờ có hiệu lực, vì proxy không chặn được lời gọi đó; gọi nội bộ qua {{this}} cũng bỏ qua proxy. Từ Spring 6, proxy dạng class (CGLIB) hỗ trợ thêm method protected và package-private, nhưng private thì vẫn không.

> Senior tip: trong code review, mặc định mọi class mới là package-private và chỉ nâng lên {{public}} khi có lý do. Với monolith lớn đang tính tách microservice, việc siết visibility theo package-by-feature trước là bước rẻ nhất để lộ ra phụ thuộc chéo và chuẩn bị cắt module.`,
  follow: [
    'Package-by-feature và package-by-layer: bạn chọn cái nào và vì sao?',
    'Làm sao test method package-private mà không phải mở thành public?',
    'Spring Modulith hoặc ArchUnit giúp giữ ranh giới module như thế nào?'
  ],
  tags: ['access modifier', 'protected', 'package-private', 'encapsulation', 'modularity']
},
{
  id: 'collections-015',
  topic: 'collections',
  level: 'senior',
  q: 'So sánh {{HashMap}}, {{Hashtable}}, {{Collections.synchronizedMap}} và {{ConcurrentHashMap}}. Trong service xử lý đồng thời bạn chọn cái nào, và vì sao "đã thread-safe" vẫn có thể sai?',
  a: `**Tóm tắt:** {{HashMap}} không thread-safe, cho phép một key null và nhiều value null. {{Hashtable}} là class legacy từ Java 1.0, mọi method {{synchronized}} trên chính object, không cho null. {{synchronizedMap}} là wrapper bọc một map bất kỳ, khoá một mutex cho mọi thao tác; về bản chất giống {{Hashtable}}. {{ConcurrentHashMap}} khoá theo từng bin (CAS + {{synchronized}} trên node đầu), đọc không khoá, có thao tác nguyên tử {{compute}}/{{merge}}, không cho null. Trong code mới nên dùng {{ConcurrentHashMap}}; nhưng thread-safe từng method không có nghĩa là chuỗi thao tác check-then-act của bạn cũng an toàn.

### Bảng so sánh
| | HashMap | Hashtable | synchronizedMap | ConcurrentHashMap |
|---|---|---|---|---|
| Thread-safe | Không | Có (1 lock) | Có (1 lock) | Có (lock theo bin) |
| Null key/value | 1 key null, nhiều value null | Không | Theo map gốc | Không |
| Đọc đồng thời | Không an toàn | Bị khoá | Bị khoá | Không khoá |
| Iterator | Fail-fast | Enumeration/fail-fast | Fail-fast, phải tự synchronized | Weakly consistent, không ném CME |
| Thao tác nguyên tử | Không | Không (ngoài từng method) | Không | {{putIfAbsent}}, {{compute}}, {{merge}} |
| Ghi chú | Mặc định cho code đơn luồng | Legacy, tránh dùng | Bọc TreeMap/LinkedHashMap khi cần | Lựa chọn mặc định cho đa luồng |

### Vì sao HashMap dùng chung giữa thread là nguy hiểm
Hai thread cùng {{put}} có thể ghi đè node của nhau (mất dữ liệu), hoặc thấy {{size}} sai trong lúc resize. Ở Java 7, resize đồng thời còn có thể tạo vòng lặp trong linked list và làm CPU 100%. Java 8 đã đổi cách chuyển node nên không còn vòng lặp kiểu đó, nhưng vẫn mất dữ liệu.

### "Thread-safe" vẫn sai: compound action
~~~java
Map<String, Integer> counts = Collections.synchronizedMap(new HashMap<>());

// SAI: hai thread cùng thấy chưa có key, cùng put 1 -> mất một lần đếm
if (!counts.containsKey(user)) counts.put(user, 1);
else counts.put(user, counts.get(user) + 1);

// ĐÚNG: một thao tác nguyên tử trên ConcurrentHashMap
ConcurrentMap<String, Integer> safe = new ConcurrentHashMap<>();
safe.merge(user, 1, Integer::sum);

// Duyệt synchronizedMap: bắt buộc tự khoá trên chính wrapper
synchronized (counts) {
    for (var e : counts.entrySet()) { /* ... */ }
}
~~~
Mỗi method riêng lẻ có khoá, nhưng giữa {{containsKey}} và {{put}} thread khác vẫn chen vào được.

### Vì sao ConcurrentHashMap không cho null
Nếu {{get(k)}} trả về null, trong môi trường đồng thời ta không thể phân biệt "không có key" với "key có value null" (gọi thêm {{containsKey}} thì kết quả có thể đã thay đổi). Cấm null loại bỏ sự mơ hồ này.

### Câu trả lời sai phổ biến
- "ConcurrentHashMap chia 16 segment": đó là Java 7; từ Java 8 khoá theo bin.
- "synchronizedMap nhanh hơn Hashtable": cả hai đều một lock toàn cục, hiệu năng tương đương.
- "Dùng ConcurrentHashMap là hết race condition": vẫn sai nếu dùng {{get}} rồi {{put}} thay vì {{compute}}/{{merge}}.

### Pitfall production
- Gọi API ngoài hoặc query DB bên trong {{computeIfAbsent}}: bin bị khoá suốt thời gian đó, các thread khác ghi vào cùng bin bị chặn. Cache nặng nên dùng Caffeine.
- Trong hàm mapping của {{computeIfAbsent}} lại sửa chính map đó có thể ném {{IllegalStateException: Recursive update}} hoặc treo.
- {{size()}} chỉ là ước lượng khi đang ghi; dùng {{mappingCount()}} cho map lớn và đừng dựa vào nó để ra quyết định nghiệp vụ.

> Senior tip: khi review code thấy {{Collections.synchronizedMap}} hay {{Hashtable}} trong code mới, gần như luôn thay được bằng {{ConcurrentHashMap}} và {{merge}}/{{compute}}. Nếu cần map có thứ tự và đồng thời, dùng {{ConcurrentSkipListMap}} thay vì bọc {{TreeMap}} bằng một lock toàn cục.`,
  follow: [
    'Vì sao iterator của {{ConcurrentHashMap}} không ném {{ConcurrentModificationException}}? Nó thấy được dữ liệu nào?',
    'Khi nào {{ConcurrentHashMap}} vẫn chưa đủ và bạn cần lock bên ngoài hoặc cache như Caffeine?',
    'Đếm số request theo user ở throughput cao: {{merge}} hay {{LongAdder}} trong map?'
  ],
  tags: ['HashMap', 'Hashtable', 'ConcurrentHashMap', 'synchronizedMap', 'thread-safety'],
  refs: [
    { type: 'doc', title: 'Java Language Specification', url: 'https://docs.oracle.com/javase/specs/' },
    { type: 'doc', title: 'Java Object Specification', url: 'https://docs.oracle.com/javase/8/docs/api/java/lang/Object.html' }
  ]
},
{
  id: 'collections-016',
  topic: 'collections',
  level: 'senior',
  q: '{{HashSet}} hoạt động thế nào bên trong? Chuyện gì xảy ra nếu bạn sửa field tham gia {{hashCode}} của một object sau khi đã đưa nó vào {{HashSet}} hoặc làm key của {{HashMap}}?',
  a: `**Tóm tắt:** {{HashSet}} thực chất là một {{HashMap}} bên trong: phần tử là key, value là một object giả dùng chung ({{PRESENT}}). {{add}} trả về true khi {{map.put}} trả về null (key chưa có). Vì vậy mọi quy tắc của {{HashMap}} đều áp dụng: tìm bucket theo {{hashCode}}, xác nhận bằng {{equals}}. Nếu sửa field tham gia {{hashCode}} sau khi đã add, object bị "lạc" trong bucket cũ: {{contains}} và {{remove}} đều trả về false, add lại thì thành bản ghi trùng, và object cũ không bao giờ được xoá (memory leak).

### Bên trong
~~~java
// Rút gọn từ mã nguồn JDK
public class HashSet<E> {
    private transient HashMap<E, Object> map;
    private static final Object PRESENT = new Object();

    public boolean add(E e)      { return map.put(e, PRESENT) == null; }
    public boolean contains(Object o) { return map.containsKey(o); }
    public boolean remove(Object o)   { return map.remove(o) == PRESENT; }
}
~~~
- {{LinkedHashSet}} dựa trên {{LinkedHashMap}} nên giữ thứ tự chèn.
- {{TreeSet}} dựa trên {{TreeMap}}, so trùng bằng {{compareTo}}/{{Comparator}} chứ **không** dùng {{equals}}/{{hashCode}}. Ví dụ {{new BigDecimal("2.0")}} và {{new BigDecimal("2.00")}}: {{HashSet}} giữ 2 phần tử (equals so cả scale), {{TreeSet}} chỉ giữ 1 (compareTo bằng 0).

### Dự đoán output: key bị đổi sau khi add
~~~java
class Key {
    String no;
    Key(String no) { this.no = no; }
    @Override public boolean equals(Object o) { return o instanceof Key k && k.no.equals(no); }
    @Override public int hashCode() { return no.hashCode(); }
}

Set<Key> set = new HashSet<>();
Key a = new Key("001");
set.add(a);
a.no = "002";                                  // đổi field dùng trong hashCode

System.out.println(set.contains(a));           // false
System.out.println(set.contains(new Key("001"))); // false
System.out.println(set.remove(a));             // false
set.add(a);
System.out.println(set.size());                // 2
~~~
Vì sao: node trong bucket lưu **hash cũ** (tính từ "001"). Tìm {{a}} thì hash mới (từ "002") không khớp với node đó. Tìm {{new Key("001")}} thì đúng bucket và hash khớp, nhưng {{equals}} so "001" với field hiện tại "002" nên vẫn false. Object vẫn nằm trong set nhưng không ai tìm thấy, và add lại tạo node thứ hai trỏ cùng object.

### Tình huống thật hay gặp
- **JPA entity** có {{hashCode}} dựa trên id tự sinh: thêm entity mới (id null) vào {{Set<OrderItem>}}, sau {{persist}} id được gán, hash đổi, rồi {{remove}} không xoá được, orphanRemoval không chạy. Cách phổ biến: dùng business key bất biến, hoặc cho {{hashCode}} trả về hằng theo class và {{equals}} so id khi id khác null.
- Dùng {{List}} hay {{StringBuilder}} mutable làm key của cache: ai đó sửa list sau khi put là cache không bao giờ hit và phình to dần.
- Lombok {{@Data}} sinh {{hashCode}} theo mọi field: entity bị sửa field là lạc khỏi set.

### Cách phòng tránh
| Cách | Ghi chú |
|---|---|
| Key bất biến ({{record}}, String, field final) | Lựa chọn tốt nhất |
| {{hashCode}} chỉ dựa trên field không đổi | Ví dụ mã tài khoản, không dùng số dư |
| Muốn đổi key: remove, sửa, rồi add lại | Phải làm khi object chưa đổi |
| Defensive copy khi nhận key từ ngoài | {{List.copyOf}} trước khi dùng làm key |

### Câu trả lời sai phổ biến
- "HashSet dùng equals để kiểm tra trùng": chưa đủ, nó dùng {{hashCode}} chọn bucket trước, sau đó mới {{equals}}.
- "Sửa key thì set tự cập nhật": collection không biết object bị sửa.
- "TreeSet cũng dựa vào equals": sai, nó dựa vào compareTo.

> Senior tip: khi gặp bug "đã add vào set mà contains trả false" hoặc memory leak ở cache map, việc đầu tiên là kiểm tra key có bị sửa sau khi put không. Quy tắc team nên có: mọi class dùng làm key của Map/Set phải bất biến, tốt nhất là {{record}}.`,
  follow: [
    'Viết {{equals}}/{{hashCode}} cho JPA entity thế nào để an toàn với Set và Hibernate proxy?',
    'Vì sao {{TreeSet}} với comparator không nhất quán với {{equals}} lại vi phạm contract của {{Set}}?',
    'Nếu {{hashCode}} luôn trả về cùng một hằng số thì {{HashSet}} chạy thế nào từ Java 8?'
  ],
  tags: ['HashSet', 'hashCode', 'mutable key', 'HashMap', 'JPA entity'],
  refs: [
    { type: 'doc', title: 'Java Language Specification', url: 'https://docs.oracle.com/javase/specs/' },
    { type: 'doc', title: 'Java Object Specification', url: 'https://docs.oracle.com/javase/8/docs/api/java/lang/Object.html' }
  ]
},
{
  id: 'collections-017',
  topic: 'collections',
  level: 'mid',
  q: 'Bạn cần xoá các phần tử thoả điều kiện khỏi một {{ArrayList}} (hoặc {{Map}}) đang duyệt. For-each, {{Iterator.remove}}, {{removeIf}} và vòng for theo index khác nhau thế nào? Dự đoán output của vài trường hợp bẫy.',
  a: `**Tóm tắt:** Gọi {{list.remove}} trong vòng for-each thường ném {{ConcurrentModificationException}} vì iterator phát hiện {{modCount}} bị đổi ngoài nó. Cách đúng: {{Iterator.remove()}} khi cần logic phức tạp, {{removeIf}} (Java 8+) là ngắn gọn và nhanh nhất với {{ArrayList}}, còn map thì dùng {{map.entrySet().removeIf(...)}}. Vòng for theo index thì phải duyệt ngược hoặc chỉnh index cẩn thận.

### Vì sao for-each ném CME
For-each trên {{List}} được compiler dịch thành {{Iterator}}. {{ArrayList}} có biến {{modCount}} tăng mỗi lần thay đổi cấu trúc; iterator lưu {{expectedModCount}} khi tạo và so lại trong mỗi lần {{next()}}. Gọi {{list.remove}} trực tiếp làm {{modCount}} lệch, lần {{next()}} kế tiếp ném CME. Lỗi này xảy ra ngay cả với **một thread**.

### Dự đoán output: hai trường hợp bẫy
~~~java
List<String> l1 = new ArrayList<>(List.of("a", "b", "c"));
for (String s : l1) {
    if (s.equals("a")) l1.remove(s);
}
// Ném ConcurrentModificationException

List<String> l2 = new ArrayList<>(List.of("a", "b", "c"));
for (String s : l2) {
    if (s.equals("b")) l2.remove(s);
}
System.out.println(l2);
// Output: [a, c]   -> KHÔNG ném lỗi, và "c" không bao giờ được kiểm tra
~~~
Vì sao trường hợp 2 không lỗi: sau khi xoá "b", size còn 2, con trỏ {{cursor}} của iterator cũng là 2. {{hasNext()}} chỉ kiểm tra {{cursor != size}} nên trả về false và vòng lặp kết thúc trước khi {{next()}} kịp kiểm tra {{modCount}}. Code "chạy được" nhưng bỏ sót phần tử cuối, một bug im lặng nguy hiểm hơn cả CME.

### Các cách đúng
~~~java
// 1. Iterator.remove: xoá phần tử vừa next(), iterator tự cập nhật trạng thái
Iterator<Order> it = orders.iterator();
while (it.hasNext()) {
    Order o = it.next();
    if (o.isExpired()) {
        audit.log(o);            // cần logic thêm trước khi xoá
        it.remove();
    }
}

// 2. removeIf: gọn và O(n) với ArrayList
orders.removeIf(Order::isExpired);

// 3. Map: xoá trên view entrySet / values
balances.entrySet().removeIf(e -> e.getValue().signum() == 0);

// 4. Index: duyệt ngược để việc dịch phần tử không làm bỏ sót
for (int i = list.size() - 1; i >= 0; i--) {
    if (shouldRemove(list.get(i))) list.remove(i);
}
~~~

### So sánh
| Cách | Độ phức tạp với ArrayList | Ghi chú |
|---|---|---|
| for-each + list.remove | CME hoặc bỏ sót | Không bao giờ dùng |
| Iterator.remove | O(n) mỗi lần xoá, tổng có thể O(n^2) | Linh hoạt, dùng được với LinkedList (O(1)) |
| removeIf | O(n) tổng, dịch mảng một lần | Lựa chọn mặc định |
| for index xuôi + remove(i) | Bỏ sót phần tử kế tiếp nếu quên i-- | Dễ sai |
| stream().filter().toList() | O(n), tạo list mới | Khi muốn giữ list gốc |

### Câu trả lời sai phổ biến
- "CME chỉ xảy ra khi nhiều thread": sai, một thread vẫn bị.
- "Đổi sang {{CopyOnWriteArrayList}} là xong": nó không ném CME vì duyệt trên snapshot, nhưng mỗi lần remove copy toàn bộ mảng, và {{iterator().remove()}} của nó ném {{UnsupportedOperationException}}.
- "CME luôn được ném khi sửa": tài liệu JDK nói fail-fast chỉ là best-effort, như ví dụ "b" ở trên.

> Senior tip: trong code review, thấy {{remove}} bên trong for-each là chặn ngay. Với batch lớn (hàng trăm nghìn phần tử), chuyển từ vòng {{Iterator.remove}} sang {{removeIf}} có thể giảm thời gian từ vài giây xuống vài mili-giây vì tránh dịch mảng lặp lại.`,
  follow: [
    'Vì sao {{ConcurrentHashMap}} cho phép xoá trong lúc duyệt mà không ném CME?',
    'Sửa value (không đổi cấu trúc) trong lúc duyệt {{HashMap}} có ném CME không?',
    '{{removeIf}} của {{ArrayList}} được cài đặt thế nào để đạt O(n)?'
  ],
  tags: ['ConcurrentModificationException', 'Iterator', 'removeIf', 'ArrayList', 'predict output']
},
{
  id: 'collections-018',
  topic: 'collections',
  level: 'senior',
  q: '{{Arrays.asList}} có những bẫy gì (fixed-size, là view của mảng, mảng primitive)? Dự đoán output và cho biết bạn chọn gì thay thế trong từng tình huống.',
  a: `**Tóm tắt:** {{Arrays.asList}} không tạo {{java.util.ArrayList}} mà trả về một class nội bộ {{Arrays$ArrayList}} bọc **chính mảng gốc**. Vì vậy nó có kích thước cố định ({{add}}/{{remove}} ném {{UnsupportedOperationException}}), {{set}} ghi xuyên xuống mảng và ngược lại, và truyền vào mảng primitive thì nhận được list **một phần tử** là cả mảng. Cần list sửa được thì bọc {{new ArrayList<>(...)}}; cần bất biến thì dùng {{List.of}}/{{List.copyOf}}.

### Dự đoán output
~~~java
String[] arr = {"b", "a", "c"};
List<String> list = Arrays.asList(arr);

list.set(0, "z");
System.out.println(arr[0]);                 // z          (list ghi xuyên xuống mảng)
arr[1] = "y";
System.out.println(list);                   // [z, y, c]  (mảng đổi thì list thấy ngay)
Collections.sort(list);
System.out.println(Arrays.toString(arr));   // [c, y, z]  (sort list là sort mảng)
list.add("d");                              // UnsupportedOperationException

int[] nums = {1, 2, 3};
System.out.println(Arrays.asList(nums).size());    // 1 -> kiểu là List<int[]>
Integer[] boxed = {1, 2, 3};
System.out.println(Arrays.asList(boxed).size());   // 3
~~~

### Vì sao lại như vậy
- **View, không phải copy**: {{Arrays$ArrayList}} chỉ giữ reference tới mảng, nên tạo list là O(1) và không tốn bộ nhớ. Đổi lại, mảng không thể giãn ra, nên mọi thao tác đổi kích thước bị cấm. Class này kế thừa {{AbstractList}}, mà {{add}}/{{remove}} mặc định ở đó ném UOE; {{clear()}} hay {{removeIf}} khớp phần tử nào đó cũng ném UOE vì cuối cùng gọi {{remove}}.
- **Mảng primitive**: chữ ký là {{asList(T... a)}}; generic không nhận primitive, nên {{int[]}} không thể khớp thành {{T[]}} mà chính {{int[]}} trở thành một {{T}}. Kết quả là {{List<int[]>}} có 1 phần tử. Cần list số thì dùng {{Arrays.stream(nums).boxed().toList()}} hoặc khai báo {{Integer[]}}.
- **Null**: {{Arrays.asList}} chấp nhận null, còn {{List.of}} ném NPE khi tạo, và cả {{List.of(...).contains(null)}} cũng ném NPE.

### Chọn gì thay thế
| Nhu cầu | Dùng | Ghi chú |
|---|---|---|
| List sửa được, thêm/xoá | {{new ArrayList<>(Arrays.asList(arr))}} | Copy, tách khỏi mảng |
| List bất biến, không null | {{List.of(...)}} / {{List.copyOf(c)}} | Ném UOE với cả {{set}} |
| Xem mảng như list, có sort/set | {{Arrays.asList(arr)}} | Chấp nhận việc ghi xuyên |
| Từ mảng primitive | {{IntStream.of(...).boxed().toList()}} | Hoặc thư viện primitive collection |

### Câu trả lời sai phổ biến
- "Arrays.asList trả về ArrayList": đúng tên class nhưng là class lồng trong {{Arrays}}, không phải {{java.util.ArrayList}}.
- "Arrays.asList là immutable": sai, {{set}} và {{sort}} vẫn chạy và còn sửa luôn mảng gốc.
- "Arrays.asList(intArray) cho ra List<Integer>": sai, ra {{List<int[]>}}.

### Pitfall production
- Hàm A trả về {{Arrays.asList(...)}}, hàm B ở module khác nhận {{List}} và gọi {{add}}: test của A pass, lỗi chỉ xuất hiện ở luồng kết hợp trên production với {{UnsupportedOperationException}} rất khó hiểu.
- Truyền {{Arrays.asList(arr)}} cho một component rồi sau đó tái sử dụng hoặc sửa mảng {{arr}} (buffer dùng lại): component kia đột nhiên thấy dữ liệu thay đổi.
- Gán {{Arrays.asList(...)}} vào collection của JPA entity lúc khởi tạo, sau này code nghiệp vụ gọi {{getItems().add(...)}} thì vỡ. Khởi tạo collection của entity bằng {{new ArrayList<>()}}.

> Senior tip: quy ước API nội bộ: method public trả về {{List}} thì hoặc là bất biến rõ ràng ({{List.copyOf}}), hoặc ghi rõ trong Javadoc là caller được sửa. Đừng trả về {{Arrays.asList}} ra ngoài ranh giới module, vì nó là trạng thái "nửa sửa được" khó đoán nhất.`,
  follow: [
    '{{List.of}} khác {{Collections.unmodifiableList}} ở điểm nào khi list gốc thay đổi?',
    'Vì sao {{Arrays.asList(1, 2, 3).contains(1L)}} trả về false?',
    'Làm sao chuyển {{int[]}} sang {{List<Integer>}} hiệu quả với mảng vài triệu phần tử?'
  ],
  tags: ['Arrays.asList', 'UnsupportedOperationException', 'immutable', 'List.of', 'predict output'],
  refs: [
    { type: 'doc', title: 'Java Language Specification', url: 'https://docs.oracle.com/javase/specs/' }
  ]
},
{
  id: 'modern-011',
  topic: 'modern',
  level: 'senior',
  q: '{{Stream.toList()}} (Java 16) khác {{collect(Collectors.toList())}} và {{Collectors.toUnmodifiableList()}} thế nào về mutability, null và kiểu trả về? Thay hàng loạt bằng IDE có an toàn không?',
  a: `**Tóm tắt:** {{collect(Collectors.toList())}} (Java 8) trả về list mà spec **không hứa** gì về kiểu hay mutability (thực tế hiện nay là {{ArrayList}}, sửa được). {{Collectors.toUnmodifiableList()}} (Java 10) trả về list bất biến và **ném NPE nếu có null**. {{Stream.toList()}} (Java 16) trả về list bất biến nhưng **cho phép null**. Thay hàng loạt {{collect(toList())}} bằng {{toList()}} không an toàn: code nào sau đó {{add}}/{{sort}}/{{set}} trên list kết quả sẽ ném {{UnsupportedOperationException}} lúc runtime.

### Dự đoán output
~~~java
List<String> a = Stream.of("x", "y").collect(Collectors.toList());
a.add("z");                 // chạy được (đang là ArrayList), nhưng spec không đảm bảo

List<String> b = Stream.of("x", "y").toList();
b.add("z");                 // UnsupportedOperationException

List<String> c = Stream.of("x", null).toList();     // OK: [x, null]

List<String> d = Stream.of("x", null)
        .collect(Collectors.toUnmodifiableList());  // NullPointerException
~~~

### Bảng so sánh
| | collect(toList()) | toUnmodifiableList() | Stream.toList() |
|---|---|---|---|
| Từ phiên bản | Java 8 | Java 10 | Java 16 |
| Sửa được | Không đảm bảo (thực tế có) | Không | Không |
| Phần tử null | Cho phép | NPE | Cho phép |
| Suy luận kiểu | Theo target type | Theo target type | Cố định theo kiểu phần tử của stream |
| Độ dài code | Dài | Dài | Ngắn nhất |

### Khác biệt về kiểu trả về (bẫy khi migrate)
~~~java
// Compile được: T của collector được suy ra là Number từ target type
List<Number> ok = Stream.of(1, 2).collect(Collectors.toList());

// Lỗi compile: toList() của Stream<Integer> trả về đúng List<Integer>
// List<Number> err = Stream.of(1, 2).toList();
~~~
{{toList()}} là method của {{Stream<T>}} và trả về {{List<T>}}, nên không có chỗ cho compiler suy luận kiểu rộng hơn. Muốn vậy thì phải {{map}} sang kiểu cha hoặc dùng {{Stream.<Number>of(1, 2)}}.

### Vì sao Java thêm toList()
- Pattern {{collect(Collectors.toList())}} xuất hiện khắp nơi và dài dòng.
- Đa số trường hợp list kết quả chỉ để đọc; trả về bất biến giúp tránh bug chia sẻ state.
- Cho phép null để thay thế được phần lớn code cũ mà không vỡ ngay vì NPE (khác với {{toUnmodifiableList}}).

### Khi nào dùng cái nào
- Mặc định code mới: {{toList()}}.
- Cần list sửa được (sẽ sort, add tiếp): {{collect(Collectors.toCollection(ArrayList::new))}}, đảm bảo kiểu rõ ràng thay vì dựa vào hành vi ngầm của {{Collectors.toList()}}.
- Muốn phát hiện sớm dữ liệu null (ví dụ danh sách mã giao dịch không được null): {{toUnmodifiableList()}}.

### Câu trả lời sai phổ biến
- "toList() chỉ là cách viết tắt của collect(Collectors.toList())": sai, khác cả mutability lẫn suy luận kiểu.
- "toList() và toUnmodifiableList() giống hệt": khác ở chỗ xử lý null.
- "List bất biến thì phần tử cũng bất biến": sai, chỉ cấu trúc list bất biến; object bên trong vẫn sửa được.

### Pitfall production
- Sonar/IDE gợi ý "Replace with toList()", dev bấm áp dụng cho cả project; một service ở xa gọi {{result.sort(...)}} hoặc {{removeIf}} và nổ UOE trên production, vì test không cover nhánh đó.
- Trả list bất biến cho Jackson thì không sao, nhưng gán vào collection của JPA entity rồi để code khác gọi {{add}} thì lỗi.

> Senior tip: khi migrate, làm theo từng module và grep các chỗ list kết quả bị sửa ({{add}}, {{sort}}, {{remove}}, {{set}}) trước khi thay. Đưa vào coding convention: "list trả ra từ stream là bất biến; cần sửa thì dùng {{toCollection(ArrayList::new)}}" để ý đồ được thể hiện ngay trong code.`,
  follow: [
    'Vì sao {{Collectors.toList()}} không hứa trả về {{ArrayList}}? Điều đó ảnh hưởng gì khi nâng cấp JDK?',
    '{{Collectors.toMap}} và {{Collectors.toUnmodifiableMap}} xử lý duplicate key và null thế nào?',
    'Khi nào bạn chủ động muốn list chứa null bị chặn sớm thay vì cho qua?'
  ],
  tags: ['Stream.toList', 'Collectors', 'immutable', 'Java 16', 'migration'],
  refs: [
    { type: 'doc', title: 'Java Language Specification', url: 'https://docs.oracle.com/javase/specs/' }
  ]
},
{
  id: 'modern-012',
  topic: 'modern',
  level: 'lead',
  q: 'Service của bạn cần gọi API core banking/đối tác qua HTTP. {{java.net.http.HttpClient}} (Java 11+) dùng thế nào cho đúng (sync/async, timeout, HTTP/2)? So với RestTemplate, RestClient, WebClient bạn chọn gì và vì sao?',
  a: `**Tóm tắt:** {{HttpClient}} là HTTP client chuẩn của JDK từ Java 11: immutable, thread-safe, có connection pool bên trong nên **tạo một lần và dùng chung**; hỗ trợ HTTP/2 (tự fallback HTTP/1.1), {{send}} đồng bộ và {{sendAsync}} trả về {{CompletableFuture}}. Mặc định **không có timeout** nên phải đặt {{connectTimeout}} và {{timeout}} cho từng request. Trong ứng dụng Spring Boot 3.2+, tôi chọn {{RestClient}} (có thể chạy trên chính JDK HttpClient) để có message converter, xử lý lỗi và observability; dùng HttpClient trực tiếp cho thư viện hoặc tool không phụ thuộc Spring.

### Dùng HttpClient đúng cách
~~~java
private static final HttpClient CLIENT = HttpClient.newBuilder()
        .version(HttpClient.Version.HTTP_2)        // ưu tiên HTTP/2, server không hỗ trợ thì dùng 1.1
        .connectTimeout(Duration.ofSeconds(2))     // timeout mở kết nối TCP/TLS
        .build();                                  // immutable, thread-safe: dùng chung

HttpRequest req = HttpRequest.newBuilder(URI.create("https://core-bank.internal/api/accounts/123"))
        .timeout(Duration.ofSeconds(5))            // tối đa 5s chờ response, quá thì HttpTimeoutException
        .header("Accept", "application/json")
        .GET()
        .build();

// Sync: ném IOException, InterruptedException; rất hợp với virtual thread
HttpResponse<String> res = CLIENT.send(req, HttpResponse.BodyHandlers.ofString());
if (res.statusCode() >= 400) {                     // 4xx/5xx KHÔNG tự ném exception
    throw new UpstreamException(res.statusCode(), res.body());
}

// Async: không chặn thread gọi
CompletableFuture<String> body = CLIENT.sendAsync(req, HttpResponse.BodyHandlers.ofString())
        .thenApply(HttpResponse::body);
~~~

### Vì sao phải dùng chung một instance
Mỗi {{HttpClient}} có connection pool và thread quản lý selector riêng. Tạo mới cho mỗi request làm mất keep-alive (lại bắt tay TLS mỗi lần, tốn hàng chục ms) và có thể rò thread/kết nối. Từ Java 21, {{HttpClient}} implement {{AutoCloseable}} ({{close}}, {{shutdown}}) để giải phóng tài nguyên chủ động khi thật sự cần client ngắn hạn.

### So sánh lựa chọn
| | JDK HttpClient | RestTemplate | RestClient (Spring 6.1) | WebClient |
|---|---|---|---|---|
| Kiểu | Sync + async (CompletableFuture) | Sync | Sync, API fluent | Reactive |
| Phụ thuộc | Chỉ JDK | Spring | Spring | Spring WebFlux, Reactor |
| JSON mapping | Tự làm | Có | Có | Có |
| Lỗi 4xx/5xx | Tự kiểm tra status | Ném exception | {{retrieve()}} ném exception | Ném khi {{retrieve()}} |
| Observability | Tự làm | Có (Micrometer) | Có | Có |
| Tình trạng | Chuẩn JDK | Maintenance mode | Khuyến nghị cho code sync mới | Dùng khi đã reactive |

~~~java
RestClient client = RestClient.builder()
        .requestFactory(new JdkClientHttpRequestFactory(CLIENT)) // tái dùng JDK HttpClient
        .baseUrl("https://core-bank.internal")
        .build();

AccountDto dto = client.get().uri("/api/accounts/{id}", id)
        .retrieve()                                // 4xx/5xx -> RestClientResponseException
        .body(AccountDto.class);
~~~

### Tiêu chí chọn (góc nhìn Lead)
- Codebase Spring MVC, Java 21 + virtual thread: {{RestClient}} sync là đủ đơn giản và scale tốt; không cần kéo Reactor vào chỉ để gọi HTTP.
- Cần kiểm soát chi tiết connection pool (max per route, idle eviction): đặt Apache HttpClient 5 làm request factory, vì JDK HttpClient chỉ cấu hình pool qua system property như {{jdk.httpclient.keepalive.timeout}}.
- Thư viện SDK nội bộ dùng cho nhiều team: JDK HttpClient để không áp đặt phiên bản Spring.

### Câu trả lời sai phổ biến
- "HttpClient tự ném exception khi 500": sai, phải tự kiểm tra {{statusCode()}}.
- "connectTimeout là đủ": nó chỉ bao phần mở kết nối; server nhận kết nối rồi treo thì vẫn chờ mãi nếu không có request {{timeout}}.
- "Async thì nhanh hơn": async chỉ giải phóng thread gọi, không làm upstream trả lời nhanh hơn.

### Pitfall production
- Không có timeout: upstream treo làm cạn thread pool Tomcat và cả service chết theo (cascading failure).
- Retry mù quáng với lệnh chuyển tiền: phải có idempotency key và chỉ retry lỗi an toàn; bọc thêm circuit breaker (Resilience4j).
- Log nguyên body response chứa số tài khoản hoặc CCCD: phải mask.

> Senior tip: đặt timeout theo SLA của upstream (ví dụ p99 là 800 ms thì timeout khoảng 2 s) và tổng timeout của chuỗi gọi phải nhỏ hơn timeout mà client của bạn chờ bạn. Mọi client HTTP ra ngoài nên đi qua một bean dùng chung có sẵn timeout, tracing header và metric, thay vì để mỗi dev tự tạo client.`,
  follow: [
    'Bạn đặt connect timeout, read timeout và tổng deadline cho một chuỗi gọi 3 service thế nào?',
    'Retry một API chuyển tiền bị timeout: làm sao tránh trừ tiền hai lần?',
    'Khi chạy trên virtual thread, gọi HTTP đồng bộ có còn là vấn đề về scalability không?'
  ],
  tags: ['HttpClient', 'RestClient', 'WebClient', 'timeout', 'HTTP/2']
},
{
  id: 'modern-013',
  topic: 'modern',
  level: 'mid',
  q: 'Helpful NullPointerException và pattern matching cho {{instanceof}} giúp gì khi debug và viết code hằng ngày? Ngoài ra, những cải tiến nhỏ nào từ Java 9 đến 21 bạn thực sự dùng?',
  a: `**Tóm tắt:** Từ Java 14 (bật mặc định từ Java 15), NPE có thông báo chỉ rõ **biểu thức nào** bị null, ví dụ "because the return value of getAddress() is null", nên không còn phải đoán trong chuỗi gọi dài. Pattern matching cho {{instanceof}} (chính thức Java 16) vừa kiểm tra kiểu vừa khai báo biến đã ép kiểu, bỏ được bước cast thủ công. Cùng với đó là nhiều API nhỏ như {{List.of}}, {{String.isBlank}}, {{Files.readString}}, {{Stream.toList}} giúp code ngắn và ít lỗi hơn.

### Helpful NullPointerException
~~~java
String city = customer.getAddress().getCity().toUpperCase();
~~~
~~~text
// Java 8:
java.lang.NullPointerException
    at CustomerService.format(CustomerService.java:42)

// Java 17 (dạng thông báo):
java.lang.NullPointerException: Cannot invoke "Address.getCity()"
    because the return value of "Customer.getAddress()" is null
~~~
- JVM phân tích bytecode tại vị trí lỗi để biết giá trị null đến từ đâu (field, phần tử mảng, kết quả method, biến local).
- Tên biến local chỉ hiện nếu class được compile kèm thông tin debug ({{-g}}, Maven và Gradle mặc định có); nếu không sẽ thấy dạng {{<local4>}}.
- Thông báo chỉ được tính khi gọi {{getMessage()}}, nên không tốn chi phí cho NPE bị bắt và bỏ qua. Có thể tắt bằng {{-XX:-ShowCodeDetailsInExceptionMessages}} nếu lo lộ thông tin cấu trúc code.

### Pattern matching cho instanceof
~~~java
// Trước Java 16
if (event instanceof PaymentEvent) {
    PaymentEvent p = (PaymentEvent) event;      // cast lặp lại, dễ cast nhầm kiểu
    process(p.amount());
}

// Java 16+
if (event instanceof PaymentEvent p && p.amount().signum() > 0) {
    process(p.amount());                         // p chỉ tồn tại khi match
}

// Flow scoping: biến dùng được sau khi loại trường hợp không match
if (!(obj instanceof Account other)) return false;
return accountNo.equals(other.accountNo);        // hay dùng trong equals()
~~~
Biến pattern có phạm vi theo luồng điều khiển: dùng được ở nhánh mà compiler chắc chắn đã match. Dùng {{||}} thay vì {{&&}} thì không truy cập được {{p}} ở vế sau.

### Các cải tiến nhỏ đáng biết
| Phiên bản | Tính năng | Dùng khi nào |
|---|---|---|
| 9 | {{List.of}}, {{Set.of}}, {{Map.of}} | Hằng số, dữ liệu test |
| 9 | {{Optional.ifPresentOrElse}}, {{Optional.stream}}, {{Stream.takeWhile}} | Xử lý Optional, cắt stream theo điều kiện |
| 10 | {{var}}, {{List.copyOf}}, {{Optional.orElseThrow()}} | Biến local kiểu dài, defensive copy |
| 11 | {{String.isBlank}}, {{strip}}, {{lines}}, {{repeat}}; {{Files.readString}}; {{Predicate.not}} | Validate input, đọc file nhỏ |
| 12 | {{Collectors.teeing}} | Tính hai kết quả trong một lần duyệt |
| 14–16 | Switch expression, text block, record, {{Stream.toList}} | DTO, SQL/JSON nhiều dòng |
| 17 | Sealed class | Mô hình hoá trạng thái đóng |
| 21 | SequencedCollection, record pattern, virtual thread, {{Math.clamp}} | Lấy phần tử đầu/cuối, IO-bound |

### Câu trả lời sai phổ biến
- "Phải bật cờ mới có helpful NPE": từ Java 15 đã bật mặc định.
- "Pattern instanceof chỉ là cú pháp đẹp": nó còn loại bỏ lỗi cast nhầm kiểu, vì kiểm tra và ép kiểu là cùng một bước.
- Kể tính năng mà không nói đã dùng ở đâu: interviewer muốn nghe ví dụ thật.

### Pitfall
- Log chỉ ghi {{e.toString()}} hoặc custom message mà nuốt stack trace: thông báo hay đến đâu cũng thiếu dòng code; luôn log cả exception.
- Helpful NPE giúp tìm chỗ null, không thay được việc thiết kế để tránh null: validate ở biên (Bean Validation), dùng {{Optional}} cho giá trị trả về có thể vắng.

> Senior tip: khi kể "cải tiến hay dùng", hãy gắn với tác động: "sau khi lên 17, thời gian điều tra NPE từ log production giảm rõ vì thông báo chỉ thẳng getter nào trả null". Câu trả lời có kết quả đo được luôn ghi điểm hơn danh sách tính năng.`,
  follow: [
    'Vì sao helpful NPE ban đầu bị tắt mặc định ở Java 14?',
    'Pattern variable trong {{instanceof}} có thể là {{final}} không? Gán lại được không?',
    '{{Collectors.teeing}} giải quyết bài toán gì? Cho ví dụ tính min và max cùng lúc.'
  ],
  tags: ['helpful NPE', 'instanceof', 'pattern matching', 'Java 11', 'Java 17']
},
{
  id: 'modern-014',
  topic: 'modern',
  level: 'mid',
  q: '"Java 8 có gì mới và bạn dùng tính năng nào nhiều nhất?" Trả lời câu mở đầu kinh điển này thế nào cho ăn điểm, và interviewer thường vặn tiếp những gì?',
  a: `**Tóm tắt:** Java 8 đưa lập trình hàm vào Java: **lambda + functional interface + method reference**, **Stream API**, **Optional**, **default/static method trong interface**, **java.time** thay {{Date}}/{{Calendar}}, và **CompletableFuture**. Tôi dùng nhiều nhất là Stream để xử lý dữ liệu nghiệp vụ, java.time cho mọi logic ngày giờ (cut-off, kỳ hạn), và CompletableFuture để gọi song song nhiều service. Sau đó nêu luôn một ví dụ cụ thể và một điều bạn cẩn thận khi dùng.

### Cấu trúc câu trả lời ăn điểm
1. Liệt kê ngắn 5–6 nhóm tính năng (15 giây).
2. Chọn 2–3 cái bạn dùng thật, mỗi cái kèm một ví dụ nghiệp vụ.
3. Nói một trade-off hoặc pitfall, cho thấy bạn hiểu sâu chứ không chỉ biết dùng.
4. Nếu dự án đã lên 17/21, nhắc ngắn những gì bạn dùng thêm (record, switch expression, virtual thread).

### Ví dụ: Stream thay vòng lặp gom nhóm
~~~java
// Java 7: tổng tiền giao dịch thành công theo loại
Map<String, BigDecimal> totals = new HashMap<>();
for (Txn t : txns) {
    if (t.getStatus() == Status.SUCCESS) {
        BigDecimal cur = totals.get(t.getType());
        totals.put(t.getType(), cur == null ? t.getAmount() : cur.add(t.getAmount()));
    }
}

// Java 8: khai báo "muốn gì" thay vì "làm thế nào"
Map<String, BigDecimal> totals8 = txns.stream()
        .filter(t -> t.getStatus() == Status.SUCCESS)
        .collect(Collectors.groupingBy(Txn::getType,
                 Collectors.reducing(BigDecimal.ZERO, Txn::getAmount, BigDecimal::add)));
~~~

### Ví dụ: CompletableFuture gọi song song
~~~java
// Duyệt khoản vay cần hồ sơ khách hàng và điểm tín dụng từ 2 hệ thống
CompletableFuture<Profile> profile =
        CompletableFuture.supplyAsync(() -> profileApi.get(id), ioPool);
CompletableFuture<Score> score =
        CompletableFuture.supplyAsync(() -> creditApi.score(id), ioPool);
LoanOffer offer = profile.thenCombine(score, LoanOffer::of).join(); // ~max(t1, t2) thay vì t1 + t2
~~~
Truyền executor riêng ({{ioPool}}) vì mặc định {{supplyAsync}} dùng {{ForkJoinPool.commonPool()}}, vốn có số thread khoảng số core và dùng chung cả JVM; gọi IO chặn trên đó sẽ làm nghẽn các phần khác.

### Những câu interviewer hay vặn tiếp
| Câu hỏi | Ý chính cần nói |
|---|---|
| Vì sao cần default method? | Để thêm {{stream()}}, {{forEach}} vào {{Collection}}/{{Iterable}} mà không làm vỡ hàng triệu class đã implement interface đó |
| Lambda khác anonymous class? | Không tạo file .class riêng, dùng {{invokedynamic}}; {{this}} trỏ tới class bao ngoài; chỉ capture biến effectively final |
| Vì sao bỏ Date/SimpleDateFormat? | {{Date}} mutable, {{SimpleDateFormat}} không thread-safe; java.time bất biến và tách rõ {{Instant}}/{{LocalDate}}/{{ZonedDateTime}} |
| Optional dùng ở đâu? | Kiểu trả về có thể vắng; không dùng cho field, tham số, collection |
| Stream có nhanh hơn for? | Không mặc định nhanh hơn; lợi ích chính là dễ đọc và dễ compose |

Ngoài ra Java 8 còn có: {{HashMap}} treeify bucket khi nhiều collision, Metaspace thay PermGen, {{StringJoiner}}, {{Base64}}, {{Map.computeIfAbsent}}/{{merge}}.

### Câu trả lời sai phổ biến
- Kể nhầm tính năng của bản sau: {{var}} (Java 10), {{List.of}} (Java 9), record (Java 16), module (Java 9) đều **không** có ở Java 8.
- Chỉ liệt kê như đọc release note, không có ví dụ đã dùng.
- Nói "stream luôn nhanh hơn" hoặc "dùng parallel stream cho nhanh" mà không nói về chi phí.

### Pitfall khi dùng thực tế
- Stream lồng nhau dài 15 dòng, khó debug; tách thành method có tên rõ ràng.
- {{Optional.get()}} không kiểm tra, hoặc {{orElse(expensiveCall())}} luôn gọi hàm tốn kém ngay cả khi có giá trị (dùng {{orElseGet}}).
- {{CompletableFuture}} quên xử lý lỗi ({{exceptionally}}/{{handle}}) hoặc quên timeout ({{orTimeout}} có từ Java 9).

> Senior tip: chuẩn bị sẵn một câu chuyện "trước/sau": ví dụ "API tổng hợp thông tin khách hàng gọi tuần tự 3 service mất khoảng 900 ms, chuyển sang CompletableFuture song song còn khoảng 350 ms". Một con số thật từ dự án của bạn đáng giá hơn mọi định nghĩa.`,
  follow: [
    'Default method có gây diamond problem không? Java giải quyết thế nào?',
    'Vì sao {{SimpleDateFormat}} dùng làm biến static lại gây lỗi khi chạy đa luồng?',
    'CompletableFuture chạy trên thread nào nếu không truyền executor? Rủi ro gì?'
  ],
  tags: ['Java 8', 'lambda', 'Stream', 'Optional', 'CompletableFuture']
},
{
  id: 'modern-015',
  topic: 'modern',
  level: 'senior',
  q: 'Phân biệt {{map}} vs {{flatMap}}, {{reduce}} vs {{collect}}, và {{peek}} trong Stream. Cho ví dụ nghiệp vụ và những lỗi hay gặp, kể cả dự đoán output với {{peek}}.',
  a: `**Tóm tắt:** {{map}} biến mỗi phần tử thành **đúng một** phần tử; {{flatMap}} biến mỗi phần tử thành **một stream** rồi nối phẳng các stream đó lại (một thành nhiều hoặc không). {{reduce}} gộp các giá trị **bất biến** thành một (tổng, max), còn {{collect}} là mutable reduction, gom vào container như list, map. {{peek}} chỉ để debug: nó lazy và JVM được phép bỏ qua, nên không được dùng để thay đổi state.

### map vs flatMap
~~~java
// Stream<List<OrderItem>>: mỗi order thành một list, vẫn lồng nhau
List<List<OrderItem>> nested = orders.stream()
        .map(Order::getItems)
        .toList();

// Stream<OrderItem>: làm phẳng thành danh sách mọi item của mọi order
List<OrderItem> items = orders.stream()
        .flatMap(o -> o.getItems().stream())
        .toList();

// Optional: mapper đã trả về Optional thì dùng flatMap để tránh Optional<Optional<...>>
Optional<String> city = findCustomer(id)
        .flatMap(Customer::getAddress)       // getAddress() trả về Optional<Address>
        .map(Address::getCity);
~~~
Java 16 có thêm {{mapMulti}} để phát 0..n phần tử mà không phải tạo stream con, hữu ích khi mỗi phần tử chỉ sinh vài kết quả.

### reduce vs collect
~~~java
// reduce: đúng chỗ, gộp giá trị bất biến
BigDecimal total = txns.stream()
        .map(Txn::amount)
        .reduce(BigDecimal.ZERO, BigDecimal::add);   // ZERO là identity thật

// SAI: dùng reduce để gom vào container mutable
List<String> ids = txns.stream().reduce(new ArrayList<>(),
        (acc, t) -> { acc.add(t.id()); return acc; },
        (a, b) -> { a.addAll(b); return a; });       // parallel: nhiều thread cùng sửa một ArrayList

// ĐÚNG: collect tạo container riêng cho từng nhánh rồi mới gộp
List<String> ids2 = txns.stream().map(Txn::id).collect(Collectors.toList());
~~~
Vì sao: {{reduce}} giả định identity và các kết quả trung gian là giá trị bất biến; trong parallel stream, cùng một identity được dùng cho mọi nhánh. {{collect}} gọi supplier để tạo container **mới** cho mỗi nhánh, nên an toàn.

Thêm một bẫy: identity phải đúng là phần tử trung hoà. {{Stream.of(1, 2, 3).reduce(10, Integer::sum)}} trả về 16 khi chạy tuần tự, nhưng chạy {{parallel()}} có thể ra 36 vì 10 được cộng cho mỗi phần (tách 3 phần là cộng 3 lần).

### peek: dự đoán output
~~~java
long n = List.of("a", "b", "c").stream()
        .peek(s -> System.out.println("peek " + s))
        .count();
System.out.println(n);
// Java 9+: chỉ in "3", không có dòng "peek" nào
~~~
Từ Java 9, {{count()}} có thể tính thẳng từ kích thước của nguồn (SIZED) khi pipeline không có {{filter}}/{{flatMap}}, nên bỏ qua việc duyệt và {{peek}} không chạy. Ngoài ra không có terminal operation thì {{peek}} cũng không bao giờ chạy.

### Bảng tóm tắt
| Operation | Đầu vào → đầu ra | Dùng cho |
|---|---|---|
| map | 1 → 1 | Đổi kiểu, trích field |
| flatMap | 1 → 0..n (stream) | Làm phẳng quan hệ cha-con, Optional lồng nhau |
| reduce | n → 1 giá trị bất biến | Tổng, min/max, nối giá trị |
| collect | n → container | List, Map, groupingBy, joining |
| peek | Không đổi | Log debug, không side effect quan trọng |

### Câu trả lời sai phổ biến
- "flatMap dùng để làm phẳng Map": sai, nó làm phẳng stream lồng nhau.
- "reduce và collect như nhau": khác về mutability và tính an toàn khi parallel.
- "peek giống forEach nhưng không kết thúc stream": peek không đảm bảo chạy, còn forEach là terminal và luôn chạy.

### Pitfall production
- Dùng {{peek(o -> o.setStatus(PROCESSED))}} để cập nhật trạng thái đơn hàng: một ngày ai đó đổi terminal operation sang {{count()}} hoặc thêm {{limit}} và một phần đơn không được cập nhật.
- {{flatMap}} trên quan hệ lazy của JPA trong vòng lặp gây N+1 query; fetch join trước khi stream.

> Senior tip: quy ước team: lambda trong stream phải **không có side effect** (trừ {{forEach}} cuối cùng). Thấy {{peek}} chứa setter hoặc {{reduce}} với {{ArrayList}} trong code review là dấu hiệu cần viết lại ngay.`,
  follow: [
    '{{reduce}} có 3 tham số (identity, accumulator, combiner): combiner dùng khi nào?',
    'Khi nào nên dùng {{mapMulti}} thay vì {{flatMap}}?',
    'Vì sao lambda trong stream nên stateless? Cho ví dụ stateful lambda gây sai kết quả khi parallel.'
  ],
  tags: ['Stream', 'flatMap', 'reduce', 'collect', 'peek'],
  refs: [
    { type: 'doc', title: 'Java Language Specification', url: 'https://docs.oracle.com/javase/specs/' }
  ]
},
{
  id: 'modern-016',
  topic: 'modern',
  level: 'lead',
  q: 'Stream hay vòng for: so sánh hiệu năng, khả năng đọc và bảo trì. Khi nào bạn không dùng stream, và bạn đặt guideline gì cho team?',
  a: `**Tóm tắt:** Về hiệu năng, với phần lớn code nghiệp vụ (vài trăm đến vài nghìn phần tử, có gọi DB/network), khác biệt giữa stream và for là không đáng kể so với IO. Stream có chi phí cố định (tạo pipeline, lambda) và dễ dính boxing, nên trong vòng lặp nóng trên dữ liệu lớn thì for với primitive thường nhanh hơn hoặc ngang bằng; phải đo bằng JMH chứ không đoán. Lợi ích chính của stream là **dễ đọc** với các phép filter/map/group. Tôi dùng for khi cần break phức tạp, ném checked exception, cập nhật nhiều biến, hay làm việc theo index.

### Vì sao stream không "tự nhanh hơn"
- Mỗi pipeline tạo vài object (stage, spliterator, sink), và lambda có capture biến tạo object mỗi lần chạy. Với list 10 phần tử gọi hàng triệu lần/giây, chi phí cố định này chiếm phần lớn.
- {{Stream<Integer>}} phải box/unbox từng phần tử; {{IntStream}}/{{LongStream}} tránh được việc này.
- JIT tối ưu vòng for đơn giản rất tốt (loop unrolling, vector hoá). Pipeline stream nhiều tầng khó inline hết hơn; nhưng khi JIT inline được thì chênh lệch nhỏ.
- {{parallel()}} không miễn phí: chia việc, gộp kết quả, và chạy trên {{ForkJoinPool.commonPool()}} dùng chung cả JVM.

~~~java
// Ba cách tính tổng: khác biệt nằm ở boxing, không phải ở "stream hay for"
long s1 = 0;
for (long v : amounts) s1 += v;                       // primitive, nhanh nhất ổn định
long s2 = Arrays.stream(amounts).sum();               // LongStream: gần tương đương
long s3 = list.stream().reduce(0L, Long::sum);        // Stream<Long>: box từng phần tử
~~~

### Khi for rõ ràng hơn stream
~~~java
// Checked exception trong lambda: phải bọc, mất tính gọn
List<String> contents = paths.stream().map(p -> {
    try { return Files.readString(p); }
    catch (IOException e) { throw new UncheckedIOException(e); }
}).toList();

// Nhiều biến kết quả + dừng sớm theo điều kiện: for tự nhiên hơn
BigDecimal total = BigDecimal.ZERO;
int failed = 0;
for (Txn t : txns) {
    if (t.isCutOffMarker()) break;              // dừng sớm theo logic nghiệp vụ
    if (t.isFailed()) { failed++; continue; }
    total = total.add(t.amount());              // lambda không gán lại được biến local
}
~~~

### Bảng quyết định
| Tình huống | Chọn | Lý do |
|---|---|---|
| Lọc, biến đổi, gom nhóm dữ liệu nghiệp vụ | Stream | Ngắn, khai báo rõ ý định |
| Tìm phần tử đầu tiên / kiểm tra tồn tại | Stream ({{anyMatch}}, {{findFirst}}) | Có short-circuit |
| Vòng lặp nóng trên mảng primitive lớn | For (hoặc {{IntStream}}) | Tránh boxing và chi phí pipeline |
| Cần index, duyệt hai list song song | For | Stream không có index tự nhiên |
| Ném checked exception, break nhiều điều kiện | For | Lambda không hợp |
| Nhiều accumulator cùng lúc | For (hoặc collector riêng) | Lambda chỉ capture biến effectively final |
| Xử lý CPU-heavy, dữ liệu rất lớn, tách được | Cân nhắc parallel, có đo | Đừng dùng trong request handler |

### Câu trả lời sai phổ biến
- "Stream nhanh hơn vì chạy song song": stream mặc định là tuần tự.
- "Stream chậm, nên cấm dùng": với code có IO, khác biệt là nhiễu; cấm stream chỉ làm code dài và dễ lỗi hơn.
- "Dùng {{parallelStream}} cho API chậm": nếu chậm do gọi DB/HTTP thì parallel stream chỉ chiếm commonPool và làm nghẽn phần khác.

### Pitfall production
- {{parallelStream()}} gọi repository bên trong request handler: dưới tải cao commonPool bị chặn bởi IO, cả {{CompletableFuture}} mặc định cũng chậm theo.
- Pipeline dài 20 dòng với lambda nhiều tầng: stack trace khó đọc, debug khó; tách thành method có tên.
- Tái sử dụng một {{Stream}} đã được tiêu thụ sẽ ném {{IllegalStateException}}; stream không phải collection.

> Senior tip: guideline tôi hay đặt cho team: (1) stream là mặc định cho biến đổi dữ liệu, mỗi lambda ngắn, không side effect; (2) for cho logic điều khiển phức tạp và hot path đã được profiler chỉ ra; (3) cấm {{parallelStream}} trong code xử lý request nếu không có benchmark JMH và review riêng. Quy tắc "đo trước khi tối ưu" quan trọng hơn mọi tranh luận stream hay for.`,
  follow: [
    'Bạn sẽ viết benchmark JMH thế nào để so sánh stream và for cho đúng (warmup, dead-code elimination)?',
    'Parallel stream chia việc dựa trên gì? Vì sao {{LinkedList}} hay {{Stream.iterate}} chia việc kém?',
    'Lambda không capture biến thì có tạo object mới mỗi lần không?'
  ],
  tags: ['Stream', 'performance', 'for loop', 'parallel stream', 'JMH']
},
{
  id: 'core-027',
  topic: 'core',
  level: 'senior',
  q: 'Một record chứa {{List}} được dùng làm key trong cache: record có bảo đảm bất biến sâu và hash ổn định không? Bạn sẽ thiết kế value object cho domain thế nào?',
  a: `**Tóm tắt:** Record chỉ làm field component thành final và sinh equals/hashCode theo component; nó không biến object được tham chiếu thành bất biến. Nếu component là collection mutable, caller vẫn có thể đổi nội dung và làm key đổi hash sau khi đưa vào cache.

### Record bảo đảm điều gì
- Record là data carrier: component được lưu vào field final, accessor và equals/hashCode/toString được sinh theo header. Compact constructor cho phép validate và chuẩn hoá dữ liệu.
- Final reference không có nghĩa nội dung bất biến. {{List<String>}} có thể bị sửa; record giữ đúng reference đã nhận.
- Một record không thể extends class khác và tự động kế thừa {{java.lang.Record}}; hợp với value object đóng, không hợp với entity cần identity/vòng đời ORM.

~~~java
record OrderKey(String tenant, List<String> regions) {
    OrderKey {
        // Copy để caller không thể sửa list sau khi tạo key.
        regions = List.copyOf(regions);
    }
}
~~~

### Chọn record hay sealed hierarchy
- Dùng record cho giá trị nhỏ, có equality theo toàn bộ dữ liệu: tọa độ, money đã chuẩn hoá, command bất biến.
- Dùng sealed interface khi miền trạng thái có số biến thể hữu hạn, như {{PaymentResult}} gồm {{Accepted}}, {{Declined}}, {{Pending}}. Khi thêm biến thể, compiler giúp rà các switch exhaustiveness.
- Không ép mọi domain object vào record: entity thường cần identity ổn định theo vòng đời và ORM cần proxy/lazy loading; inheritance mapping với record cũng không phù hợp.

### Pitfall
- {{List.copyOf}} tạo collection không sửa được và snapshot cấu trúc, nhưng nếu phần tử mutable thì không tạo deep copy.
- Equality theo toàn bộ component có thể làm record key quá rộng; hai phiên bản logic giống nhau nhưng metadata khác sẽ thành key khác.
- Chuẩn hoá trước khi tạo record, chẳng hạn scale của tiền và chữ hoa/thường của mã; {{BigDecimal.equals}} phân biệt scale.

### Bên trong: record sinh ra gì
Với {{record Key(String tenant, List<String> tags)}}, compiler sinh field {{private final}}, accessor, constructor canonical, và {{equals}}/{{hashCode}}/{{toString}} dựa trên **giá trị hiện tại** của từng component ({{hashCode}} của record gọi {{tags.hashCode()}} mỗi lần). "final" chỉ khoá **reference** tới list, không khoá nội dung list. Nếu caller sửa list sau khi record đã làm key trong {{HashMap}}, hash thay đổi, entry nằm ở bucket cũ — {{get}} không tìm thấy, {{containsKey}} trả false, nhưng entry vẫn chiếm bộ nhớ (rò rỉ). Compact constructor với {{List.copyOf}} giải quyết: copy một lần, bất biến thật.

### Ví dụ đời thực
Cache kết quả tìm kiếm dùng {{record SearchKey(String query, List<String> filters)}}. Controller tái sử dụng một {{ArrayList}} filters cho nhiều bước xử lý và thêm filter mặc định **sau** khi đã đưa key vào cache → cache hit rate chỉ 12% thay vì kỳ vọng khoảng 60%, và heap tăng dần vì các entry "mất tích" không bao giờ bị lấy lại (cache không giới hạn kích thước). Sửa: compact constructor {{filters = List.copyOf(filters)}} và giới hạn cache bằng Caffeine. Hit rate lên 58%, heap ổn định.

### Trả lời mẫu khi phỏng vấn
"Record chỉ đảm bảo bất biến nông: các component là private final và equals, hashCode, toString được sinh theo giá trị hiện tại của component. Nếu một component là List mutable, caller vẫn có thể sửa nội dung list sau khi record được tạo, và khi record đó là key trong cache thì hashCode thay đổi, entry nằm sai bucket và không bao giờ tìm lại được, vừa mất cache hit vừa rò bộ nhớ. Vì vậy với value object trong domain, tôi dùng compact constructor để validate và copy: List.copyOf, hoặc dùng kiểu bất biến sẵn như String, LocalDate, BigDecimal. Tôi thích record cho value object vì ngắn gọn và equals theo giá trị, còn khi cần nhiều biến thể thì kết hợp sealed interface với các record."

> Senior tip: trước khi dùng value object làm map key, kiểm tra mọi component có bất biến sâu không và chạy thử tình huống caller sửa dữ liệu đầu vào. Với entity JPA, xác định equality theo identity nghiệp vụ trước, đừng để generated id null rồi đổi hash sau persist.`,
  follow: ['Vì sao record không tự phù hợp làm JPA entity?', 'Sealed interface có lợi gì khi model kết quả nghiệp vụ có tập trạng thái hữu hạn?'],
  tags: ['record', 'sealed', 'immutability', 'domain model']
},
{
  id: 'core-028',
  topic: 'core',
  level: 'lead',
  q: 'Một cache giữ hàng triệu String lặp lại và heap dump cho thấy nhiều mảng byte giống nhau. Bạn cân nhắc compact strings, String deduplication hay intern thế nào?',
  a: `**Tóm tắt:** Compact Strings giảm byte lưu cho nội dung Latin-1 ngay trong mỗi String; String deduplication của GC chia sẻ mảng byte giống nhau giữa các String khác object; {{intern()}} canonicalize cả object và có chi phí tra bảng. Chọn bằng heap profile và benchmark theo workload, không bật cả ba theo cảm tính.

### Ba cơ chế khác nhau
- Từ Java 9, {{String}} lưu nội dung bằng {{byte[]}} và coder: nội dung Latin-1 thường cần một byte mỗi ký tự, còn nội dung cần UTF-16 dùng hai byte. Đây là cách biểu diễn mặc định của String, không phải flag bật riêng.
- GC có thể tìm các String bằng nhau (đã sống qua vài lần GC) rồi cho chúng dùng chung backing array; các String object vẫn riêng. Bật bằng {{-XX:+UseStringDeduplication}}, mặc định tắt, có overhead CPU. JDK 17 chỉ hỗ trợ với G1 và Shenandoah; từ JDK 18 hỗ trợ thêm Serial, Parallel và ZGC.
- {{String.intern()}} trả về canonical instance từ string table. Mọi caller dùng đúng instance đó, nhưng tra và quản lý pool cũng tốn chi phí; với dữ liệu cardinality cao có thể biến thành nút tranh chấp và giữ thêm cấu trúc.

### Khi nào cân nhắc
1. Đo retained heap: nếu phần lớn dung lượng là nội dung Latin-1, compact strings vốn đã có tác dụng.
2. Nếu nhiều object String khác nhau cùng nội dung, thử dedup trên staging, đo CPU, pause và heap sau GC.
3. Chỉ dùng intern cho tập chuỗi nhỏ, lặp cao và có ranh giới rõ như tên schema; tránh với request id hoặc dữ liệu người dùng có cardinality lớn.

~~~bash
# JDK 17 + G1
-XX:+UseStringDeduplication -Xlog:gc+stringdedup=debug
# JDK 18+ (log tag mới)
-XX:+UseStringDeduplication -Xlog:stringdedup*=debug
jcmd <pid> GC.heap_info
~~~

Log dedup cho biết số chuỗi khảo sát, deduplicate và byte tiết kiệm; đối chiếu với throughput và p99 thay vì chỉ nhìn heap giảm.

### Bẫy vận hành
- Dedup không giảm số object String, chỉ chia sẻ mảng nội dung; nếu overhead object và reference chiếm phần lớn, lợi ích thấp.
- Chạy dedup có thể tăng CPU và làm GC thêm việc. Snapshot heap ở một thời điểm cũng dễ gây kết luận sai nếu workload chưa ổn định.
- Không dựa vào chi tiết triển khai layout object cố định giữa các bản JDK; compressed oops, alignment và header ảnh hưởng kích thước thực.

### Ví dụ đời thực
Một service gợi ý sản phẩm giữ 6 triệu object thuộc tính trong cache; heap dump cho thấy 2,3GB là {{byte[]}} của String, trong đó khoảng 70% trùng nội dung (tên màu, kích cỡ, thương hiệu). Thử ba cách trên môi trường tải giả lập:
- Bật {{-XX:+UseStringDeduplication}} (G1): heap sau GC giảm khoảng 1,1GB, CPU GC tăng khoảng 3%, không đổi code — nhưng chỉ áp dụng cho String đã sống qua vài lần GC (mặc định tuổi 3) nên giảm chậm sau mỗi lần nạp cache.
- {{intern()}} các trường thuộc tính khi parse: giảm khoảng 1,5GB vì gộp cả object String, nhưng thời gian nạp cache tăng 18% do tra StringTable.
- Chuẩn hoá bằng **một {{HashMap}} riêng** cho từng loại thuộc tính (tự canonicalize, có giới hạn): giảm khoảng 1,5GB, nạp nhanh hơn intern, và dễ đo.
Team chọn cách thứ ba cho dữ liệu đã biết, giữ String Deduplication làm lưới an toàn cho phần còn lại.

### Trả lời mẫu khi phỏng vấn
"Ba cơ chế giải quyết ba việc khác nhau. Compact Strings, mặc định từ Java 9, giảm một nửa bộ nhớ cho chuỗi Latin-1 vì mỗi ký tự chỉ một byte, không cần làm gì. String Deduplication của G1 cho các String khác object nhưng cùng nội dung dùng chung một mảng byte, chạy nền và không đổi code, nhưng tốn chút CPU GC và chỉ áp dụng cho chuỗi đã sống qua vài chu kỳ GC. intern gộp cả object String vào bảng chuẩn của JVM, giảm nhiều nhất nhưng tốn thời gian tra bảng và bảng có thể phình nếu dữ liệu không lặp. Tôi quyết định dựa trên heap dump và benchmark: đo bao nhiêu phần trăm là chuỗi trùng, chuỗi đó sống bao lâu. Thường tôi tự chuẩn hoá các trường đã biết khi parse, hoặc đổi sang enum, và để String Deduplication làm lưới an toàn."

> Senior tip: đặt mục tiêu đo được, ví dụ giảm retained heap 10% mà CPU tăng dưới ngưỡng đã thống nhất; thử với traffic đại diện và giữ phương án rollback bằng JVM flag.`,
  follow: ['String dedup chia sẻ điều gì nhưng không chia sẻ điều gì?', 'Vì sao intern không phải giải pháp cache chuỗi tổng quát?'],
  tags: ['String', 'compact strings', 'deduplication', 'intern', 'G1']
},
{
  id: 'core-029',
  topic: 'core',
  level: 'senior',
  q: 'Thiết kế equals/hashCode cho JPA entity có generated id thế nào để không làm entity biến mất khỏi HashSet sau persist?',
  a: `**Tóm tắt:** Equality của entity phải giữ ổn định qua vòng đời transient → managed → detached. Nếu hashCode dựa vào generated id đang null rồi đổi sau persist, entity đã nằm trong HashSet sẽ ở sai bucket; chọn business key bất biến hoặc chiến lược class-stable có cân nhắc va chạm.

### Hai chiến lược thường gặp
- **Business key**: dùng thuộc tính duy nhất, bất biến và có sẵn từ lúc tạo entity, như mã quốc gia. Equality ổn định nhưng không phải entity nào cũng có key như vậy.
- **Generated id**: dễ nghĩ tới nhưng id null trước persist. Nếu equals xem hai id null là bằng nhau hoặc hashCode đổi khi id được cấp, collection bị lỗi.
- Một số hệ thống dùng equality theo id chỉ khi id khác null, còn hashCode ổn định theo class. Cách này giữ bucket ổn định nhưng nhiều entity cùng class va chạm; đo trước khi coi đó là vấn đề.

### Hibernate proxy
- Lazy proxy của Hibernate là một **subclass** của entity (sinh bằng ByteBuddy). Vì vậy {{getClass() != o.getClass()}} sẽ coi proxy và entity thật của cùng một row là khác nhau; dùng {{instanceof}} hoặc {{Hibernate.getClass(o)}} (trả về class thật sau khi unwrap proxy).
- Trong equals, đọc id của đối tượng kia qua **getter** ({{other.getId()}}), không đọc field trực tiếp: field của proxy chưa được khởi tạo, chỉ getter mới được proxy chuyển tiếp.
- Tránh để domain thuần phụ thuộc API Hibernate nếu {{instanceof}} đã đủ.

~~~java
@Override public boolean equals(Object o) {
    if (this == o) return true;
    if (!(o instanceof Account other)) return false; // proxy là subclass nên vẫn match
    return id != null && id.equals(other.getId());   // id null (chưa persist) => chỉ bằng chính nó
}
@Override public int hashCode() {
    return Account.class.hashCode(); // hằng số: không đổi khi id được cấp
}                                     // (đừng dùng getClass(): proxy cho kết quả khác)
~~~
- Không đưa association/lazy collection vào equals/hashCode: dễ kích hoạt query bất ngờ, đệ quy hai chiều, hoặc N+1.

### Quyết định
Viết test cho entity mới, sau persist, proxy, detached và hai instance cùng id. Không dùng mutable field, timestamp hay toàn bộ object graph.

### Bên trong: vì sao entity "biến mất" khỏi HashSet
{{HashSet}} xếp object vào bucket theo {{hashCode()}} **tại thời điểm add**. Entity mới có {{id = null}} → nếu {{hashCode()}} dựa vào id thì hash là của null (ví dụ 0). Sau {{persist}} và flush, Hibernate gán id = 42 → {{hashCode()}} giờ khác, nhưng object vẫn nằm ở bucket cũ. {{set.contains(entity)}} tìm ở bucket mới → false; {{set.remove(entity)}} không xoá được. Với {{@OneToMany Set<Item>}}, Hibernate có thể thêm trùng hoặc không xoá được phần tử con. Cách phổ biến (theo hướng dẫn của Vlad Mihalcea): {{equals}} so id khi id khác null, {{hashCode()}} trả **hằng số theo class** ({{Account.class.hashCode()}}, không dùng {{getClass()}} vì proxy là subclass nên cho hash khác) — mọi entity cùng loại chung một bucket (chỉ chấp nhận được với collection nhỏ), đổi lại an toàn suốt vòng đời. Nếu có business key bất biến (mã đơn hàng, số tài khoản) thì dùng nó là tốt nhất.

### Ví dụ đời thực
Một đơn hàng có {{Set<OrderLine>}}; {{OrderLine}} dùng Lombok {{@Data}} (equals/hashCode theo mọi field, kể cả id và quan hệ). Thêm dòng mới rồi lưu: sau flush, hash đổi; gọi {{lines.remove(line)}} để xoá dòng vừa thêm không có tác dụng — khách bị tính tiền cho món đã bỏ khỏi giỏ (khoảng 90 đơn trong một ngày). Ngoài ra {{@Data}} gọi {{toString}} trên quan hệ hai chiều gây {{StackOverflowError}} khi log. Sửa: bỏ {{@Data}} khỏi entity, viết equals/hashCode theo mẫu "id + hằng số class", {{toString}} chỉ in id; thêm test persist → contains → remove.

### Trả lời mẫu khi phỏng vấn
"Vấn đề là entity mới có id null, và nếu hashCode dựa vào id thì sau khi persist, Hibernate gán id, hashCode thay đổi, trong khi HashSet đã đặt object ở bucket theo hash cũ, nên contains và remove không tìm thấy nữa. equals và hashCode của entity phải ổn định qua cả vòng đời transient, managed, detached. Nếu có business key bất biến như mã đơn hàng thì tôi dùng nó. Nếu không, tôi dùng mẫu phổ biến: equals so sánh id khi id khác null, còn hashCode trả về hằng số theo class, an toàn suốt vòng đời, đổi lại các entity cùng loại chung bucket nên chỉ hợp collection nhỏ. Cần cẩn thận với Hibernate proxy: so sánh class bằng getClass có thể sai với proxy, nên dùng instanceof hoặc lấy class thật. Và tuyệt đối không dùng @Data của Lombok trên entity."

> Senior tip: chọn quy tắc một lần cho toàn hệ thống và kiểm tra bằng test với HashSet trước/sau persist; equality của entity là quyết định identity, không chỉ là boilerplate.`,
  follow: ['Vì sao association lazy không nên nằm trong hashCode?', 'HashCode theo class ổn định có trade-off gì?'],
  tags: ['JPA', 'Hibernate', 'equals', 'hashCode', 'entity']
},
{
  id: 'core-030',
  topic: 'core',
  level: 'lead',
  q: 'Một domain có ba trạng thái kết quả hữu hạn và team muốn switch exhaustive. Bạn model bằng sealed interface/record ra sao, và giữ tương thích phiên bản thế nào?',
  a: `**Tóm tắt:** Sealed interface giới hạn trực tiếp các subtype được phép; record phù hợp làm từng variant dữ liệu bất biến. Sealed class chính thức từ Java 17, pattern matching for switch chính thức từ Java 21 (JEP 441), nên compiler kiểm tra switch exhaustive mà không cần nhánh {{default}}. Cái giá: thêm một variant là thay đổi phá vỡ với mọi consumer, cần quản lý như thay đổi API.

### Model
- Khai báo sealed interface với permits rõ ràng, rồi tạo record cho các kết quả như Accepted, Rejected và Pending.
- Consumer switch trên kiểu cha phải xử lý toàn bộ nhánh đã biết; compiler báo thiếu nhánh khi biên dịch lại.
- Record component cần immutable sâu nếu object được chia sẻ; record chỉ đảm bảo field reference final.

~~~java
sealed interface Result permits Accepted, Rejected {}
record Accepted(String id) implements Result {}
record Rejected(String reason) implements Result {}

String describe(Result r) {
    return switch (r) {              // không cần default: compiler biết đủ 2 nhánh
        case Accepted a -> "OK " + a.id();
        case Rejected x -> "Từ chối: " + x.reason();
    };
}
~~~

### Ranh giới module
- Mỗi subtype được permit phải khai báo {{final}}, {{sealed}} hoặc {{non-sealed}} (record mặc định là final). Nếu sealed interface nằm trong named module, các subtype phải cùng module; nếu ở unnamed module (classpath), chúng phải cùng package. {{permits}} có thể bỏ khi mọi subtype nằm cùng file.
- Khi thêm subtype, compile lại consumer để phát hiện switch thiếu nhánh. Consumer đã biên dịch với bản cũ vẫn chạy, nhưng khi gặp variant mới thì switch exhaustive ném {{MatchException}} lúc runtime; nếu protocol/version có thể mở rộng độc lập, thiết kế fallback (ví dụ variant {{Unknown}}).
- Java 21 pattern matching for switch là tính năng chuẩn; StructuredTaskScope ở Java 21 mới là preview. Không gộp hai mức ổn định này.

### Khi dùng
Hợp với algebraic data type có tập biến thể hữu hạn trong một bounded context. Không hợp khi plugin bên thứ ba cần tự thêm subtype hoặc hierarchy là API extension mở.

### Ví dụ đời thực
Kết quả thanh toán được mô hình bằng {{sealed interface PaymentResult permits Approved, Declined, Pending}} với ba record. Ở Java 21, controller dùng {{switch}} pattern matching không có {{default}}. Khi nghiệp vụ thêm {{RequiresOtp}}, compiler báo lỗi ở **11 chỗ** switch chưa xử lý trạng thái mới — team sửa đủ trước khi release. Trước đây với enum + {{default -> throw}}, lần thêm trạng thái tương tự chỉ lộ lỗi ở runtime (2 luồng ném exception trên production). Một bài học khác: service khác dùng thư viện client cũ chưa biết {{RequiresOtp}} — JSON chứa type mới làm deserialization thất bại; team thêm kiểu "Unknown" ở ranh giới API để client cũ không vỡ.

### Trả lời mẫu khi phỏng vấn
"Với một tập kết quả hữu hạn, tôi dùng sealed interface khai báo permits các variant, mỗi variant là một record bất biến mang đúng dữ liệu của nó, ví dụ Approved có mã giao dịch, Declined có lý do. Sealed có từ Java 17, pattern matching cho switch chính thức từ Java 21, nên switch trên sealed interface được compiler kiểm tra đầy đủ mà không cần default. Lợi ích lớn nhất là khi thêm variant mới, mọi switch chưa xử lý đều lỗi biên dịch, thay vì rơi vào default lúc runtime. Cái giá là phải đặt các variant trong cùng package hoặc module, và ở ranh giới hệ thống như JSON hay message, client cũ không biết variant mới, nên tôi thêm một biến thể unknown hoặc version hoá API. Trong lõi domain thì sealed với record là cách mô hình rõ ràng nhất."

> Senior tip: ghi rõ ai sở hữu tập biến thể và chính sách versioning. Exhaustive switch rất hữu ích trong codebase đồng bộ, nhưng message từ hệ thống ngoài vẫn cần xử lý giá trị chưa biết.`,
  follow: ['Thêm subtype mới ảnh hưởng consumer đã biên dịch ra sao?', 'Phân biệt feature chuẩn Java 21 và API preview bằng cách nào?'],
  tags: ['sealed', 'record', 'pattern matching', 'domain model']
},
{
  id: 'core-031',
  topic: 'core',
  level: 'senior',
  q: 'Một API trả List nhưng bên trong giữ mutable list của caller. Bạn thiết kế defensive copy và contract collection thế nào?',
  a: `**Tóm tắt:** Khi class giữ một {{List}} (danh sách) bên trong, nếu bạn nhận list từ bên ngoài rồi lưu thẳng tham chiếu, hoặc trả thẳng list nội bộ ra ngoài, caller (bên gọi) có thể sửa dữ liệu của bạn mà bạn không biết. Defensive copy (sao chép phòng thủ) nghĩa là: copy ở biên nhận vào để chặn caller sửa state nội bộ; copy hoặc trả snapshot bất biến (immutable - không đổi được) ở biên trả ra. Cần nhớ: copy nông (shallow copy) chỉ sao chép cấu trúc danh sách, không sao chép từng phần tử - nếu phần tử tự nó mutable thì vẫn bị sửa.

### Cái gì - vì sao cần - hoạt động thế nào
- **Bối cảnh:** trong thiết kế hướng đối tượng, object cần bảo toàn "bất biến" (invariant - điều luôn đúng về state của nó, ví dụ "danh sách id không chứa null"). Nếu state nội bộ bị sửa từ bên ngoài, invariant vỡ mà class không hay biết.
- **Copy ở đầu vào (constructor/setter):** khi nhận {{List}} từ caller, gọi {{List.copyOf(input)}} (Java 10+) để tạo snapshot riêng. Sau đó dù caller giữ tham chiếu cũ và {{add/remove}}, bản copy bên trong class bạn không đổi. {{List.copyOf}} cũng từ chối {{null}} (ném {{NullPointerException}}) nên giúp kiểm tra dữ liệu sớm.
- **Trả ở đầu ra (getter):** trả chính snapshot bất biến đó là đủ nếu phần tử immutable (như {{String}}, {{Long}}). Nếu phần tử mutable (ví dụ object {{Address}} có setter), phải cân nhắc deep copy (sao chép sâu - copy cả từng phần tử) hoặc dùng kiểu phần tử bất biến.
- **{{Collections.unmodifiableList}} khác gì?** Nó chỉ là "view" (lớp bọc) chặn sửa qua view đó, nhưng nếu ai đó còn giữ tham chiếu tới list gốc thì sửa gốc vẫn làm view đổi theo. Nó **không** phải bản sao độc lập.

### So sánh nhanh
| Cách | Chặn caller sửa input sau khi tạo? | Chặn caller sửa output? | Ghi chú |
|---|---|---|---|
| Lưu tham chiếu gốc | Không | Không | Nguy hiểm, dễ vỡ invariant |
| {{Collections.unmodifiableList}} (wrap gốc) | Không | Có (qua view) | Gốc vẫn sửa được → view đổi |
| {{List.copyOf}} ở constructor + trả nó | Có | Có | Snapshot bất biến, từ chối null |
| {{new ArrayList<>(input)}} + trả {{unmodifiable}} | Có | Có | Copy thật; phần tử vẫn có thể mutable |

### Ví dụ đời thực (production)
Giả định một service xử lý lô thanh toán (batch), mỗi batch ~5.000 {{paymentId}}. Constructor của {{PaymentBatch}} nhận {{List<String> ids}} từ controller và lưu thẳng: {{this.ids = ids;}}. Controller parse JSON thành list, truyền vào batch, rồi (do code tái sử dụng) tiếp tục {{ids.addAll(debugIds)}} để log - vô tình thêm 200 id rác vào batch thật. Batch được gửi sang worker xử lý: ~5.200 giao dịch thay vì 5.000, gây trùng/sai lệch ~40 giao dịch, mất ~2 giờ đối soát. Điều tra: trace cho thấy batch object thay đổi sau khi tạo; diff heap snapshot thấy cùng instance list được giữ ở 2 nơi. Cách sửa: {{this.ids = List.copyOf(ids);}} trong constructor và getter trả {{ids}} (đã immutable). Thêm test: tạo batch, sửa list gốc, khẳng định {{batch.ids().size()}} không đổi. Kết quả: không còn lệch số lượng, chi phí copy O(n) với 5.000 chuỗi là không đáng kể (< 1ms, vài trăm KB tạm).

~~~java
import java.util.List;
import java.util.Objects;

final class PaymentBatch {
    private final List<String> paymentIds; // snapshot bất biến

    PaymentBatch(List<String> paymentIds) {
        // copy + kiểm tra null phần tử; ném NPE nếu có null
        this.paymentIds = List.copyOf(Objects.requireNonNull(paymentIds));
    }

    List<String> paymentIds() {
        return paymentIds; // đã immutable, trả thẳng an toàn
    }
    // KHÔNG có setter -> state không đổi sau khi tạo
}
~~~

### Pitfall production
- **Shallow copy với phần tử mutable:** {{List.copyOf(listOfMutableOrder)}} copy danh sách nhưng mỗi {{Order}} vẫn là cùng object - caller sửa {{order.setAmount(...)}} vẫn ảnh hưởng. Cần phần tử bất biến hoặc deep copy có chủ đích.
- **Quên copy một chiều:** chỉ copy ở getter mà không copy ở constructor (hoặc ngược lại) → vẫn còn lỗ hổng.
- **Chi phí O(n):** với list rất lớn (hàng triệu phần tử) copy mỗi lần tốn bộ nhớ/CPU; cân nhắc "chuyển quyền sở hữu" (ownership transfer) bằng contract rõ ràng, hoặc trả stream/iterator chỉ đọc. Nhưng đừng hy sinh tính đúng để tránh copy nếu chưa đo.
- **{{List.copyOf}} và null:** nó từ chối phần tử {{null}}. Nếu nghiệp vụ cho phép null, dùng {{new ArrayList<>(input)}} rồi {{Collections.unmodifiableList(...)}} nhưng phải tự xử lý null.

### Trả lời mẫu khi phỏng vấn
"Với class giữ collection bên trong, tôi luôn coi biên vào và biên ra là ranh giới cần bảo vệ. Ở constructor tôi dùng List.copyOf để tạo một snapshot bất biến: như vậy caller sửa list gốc sau đó cũng không ảnh hưởng state nội bộ, và List.copyOf còn chặn phần tử null giúp mình phát hiện dữ liệu bẩn sớm. Ở getter tôi trả chính snapshot đó vì nó đã immutable. Điểm cần phân biệt là Collections.unmodifiableList chỉ là view bọc list gốc, nên nếu ai còn giữ tham chiếu gốc thì view vẫn đổi - nó không phải bản sao. Một cạm bẫy khác là shallow copy: copy danh sách nhưng phần tử bên trong vẫn mutable thì chưa an toàn, khi đó phải dùng phần tử bất biến hoặc deep copy. Về chi phí, copy là O(n), với vài nghìn phần tử thì không đáng kể; chỉ khi list rất lớn tôi mới cân nhắc chuyển quyền sở hữu với contract rõ, nhưng luôn ưu tiên tính đúng và bất biến trước."

> Senior tip: viết 2 test bắt buộc: (1) sửa list truyền vào constructor → state bên trong không đổi; (2) thử {{getter().add(...)}} → phải ném {{UnsupportedOperationException}}. Nếu phần tử mutable, thêm test sửa sâu (nested mutation). Defensive copy bảo vệ invariant, nhưng không thay thế transaction semantics - snapshot không đảm bảo nhiều field đọc cùng một thời điểm.`,
  follow: ['Unmodifiable view khác immutable snapshot thế nào?', 'Khi nào deep copy không đáng chi phí?'],
  tags: ['immutability', 'defensive copy', 'collections', 'API design']
},
{
  id: 'collections-019',
  topic: 'collections',
  level: 'mid',
  q: 'Bạn cần đếm số đơn hàng theo trạng thái và gom danh sách đơn theo khách hàng bằng {{HashMap}}. Bạn viết thế nào với {{getOrDefault}}, {{putIfAbsent}}, {{computeIfAbsent}} và {{merge}}? Mỗi hàm có bẫy gì?',
  a: `**Tóm tắt:** Đếm tần suất dùng {{map.merge(key, 1, Integer::sum)}}; gom nhóm dùng {{map.computeIfAbsent(key, k -> new ArrayList<>()).add(value)}}. Hai hàm này thay cho kiểu "get rồi kiểm tra null rồi put" vừa dài vừa dễ sai. Bẫy chính: {{merge}} xoá key khi hàm trả {{null}}, {{computeIfAbsent}} không lưu gì nếu hàm trả {{null}}, và {{HashMap}} ném {{ConcurrentModificationException}} nếu hàm tính toán lại sửa chính map đó.

### Hiểu nhanh
Hình dung một cuốn sổ ghi chép: mỗi trang là một khách hàng. Cách cũ là "mở sổ tìm trang, không có thì xé trang mới, rồi mới ghi". Java 8 cho bạn các lệnh gộp: "ghi vào trang của khách X, chưa có trang thì tự tạo" ({{computeIfAbsent}}), hoặc "cộng thêm 1 vào số đếm của X, chưa có thì bắt đầu từ 1" ({{merge}}).

### Thuật ngữ
- **getOrDefault(k, d)**: trả value nếu có mapping, ngược lại trả {{d}}; không ghi gì vào map.
- **putIfAbsent(k, v)**: chỉ put khi key chưa có (hoặc đang map tới null); luôn tạo sẵn {{v}} dù không dùng.
- **computeIfAbsent(k, f)**: key chưa có thì gọi {{f}} để tạo value, lưu lại và trả về value đó.
- **merge(k, v, f)**: key chưa có thì lưu {{v}}; đã có thì lưu {{f(cũ, v)}}.

### Cơ chế từng bước
~~~java
Map<Status, Integer> countByStatus = new EnumMap<>(Status.class);
Map<Long, List<Order>> byCustomer = new HashMap<>();
for (Order o : orders) {
    // 1. merge: lần đầu lưu 1, các lần sau gọi Integer.sum(cũ, 1)
    countByStatus.merge(o.status(), 1, Integer::sum);
    // 2. computeIfAbsent: chỉ tạo ArrayList khi khách chưa có list, rồi add
    byCustomer.computeIfAbsent(o.customerId(), k -> new ArrayList<>()).add(o);
}
int pending = countByStatus.getOrDefault(Status.PENDING, 0); // không có thì 0
~~~
1. {{merge}} tìm bucket theo hash của key **một lần**, vì vậy nhanh hơn cặp {{get}} + {{put}} (hai lần tìm).
2. {{computeIfAbsent}} chỉ gọi lambda khi thật sự thiếu key. Vì sao quan trọng: {{putIfAbsent(k, new ArrayList<>())}} tạo một list mới ở **mọi** vòng lặp rồi vứt đi, tốn rác cho GC.
3. Giá trị trả về của {{computeIfAbsent}} là value **đang nằm trong map**, nên gọi {{.add(o)}} ngay trên đó là ghi thẳng vào map.

### So sánh nhanh
| Hàm | Khi key chưa có | Khi key đã có | Dùng cho |
|---|---|---|---|
| getOrDefault | trả default, không ghi | trả value | đọc an toàn |
| putIfAbsent | put v | giữ nguyên | giá trị rẻ, có sẵn |
| computeIfAbsent | gọi f, lưu kết quả | giữ nguyên | gom nhóm, cache nhỏ |
| compute | gọi f(k, null) | gọi f(k, cũ) | logic cập nhật phức tạp |
| merge | lưu v | lưu f(cũ, v) | đếm, cộng dồn |

### Lỗi hay gặp
1. **merge trả null là xoá key**: {{map.merge(k, -1, (a, b) -> a + b == 0 ? null : a + b)}} sẽ xoá key khi về 0, có khi đúng ý, có khi làm mất dữ liệu. Ngoài ra truyền {{v = null}} vào {{merge}} ném NPE.
2. **getOrDefault không cứu được value null**: nếu key đang map tới {{null}}, hàm trả {{null}} chứ không trả default.
3. **Sửa chính map trong lambda**: từ Java 9, {{HashMap.computeIfAbsent}} phát hiện map bị đổi cấu trúc trong lúc tính và ném {{ConcurrentModificationException}} (ví dụ hàm đệ quy tính Fibonacci có memo bằng chính map đó).
4. **Nghĩ là thread-safe**: các hàm này trên {{HashMap}} không atomic giữa các thread; cần {{ConcurrentHashMap}}, và khi đó đừng làm I/O trong lambda vì nó chạy khi đang giữ lock của bin.

### Trả lời miệng 1 phút
"Đếm thì tôi dùng merge với Integer::sum, gom nhóm thì computeIfAbsent rồi add. Chúng chỉ tìm bucket một lần và tránh tạo object thừa như putIfAbsent. Cần nhớ ba bẫy: merge trả null là xoá key, getOrDefault vẫn trả null nếu value là null, và lambda không được sửa chính map. Nếu nhiều thread cùng ghi thì đổi sang ConcurrentHashMap, nơi các hàm này mới atomic theo key."

> Senior tip: nếu dữ liệu đã nằm trong một collection, {{Collectors.groupingBy(Order::customerId)}} và {{groupingBy(Order::status, counting())}} thường gọn hơn vòng for; còn khi đọc dữ liệu theo luồng (Kafka, file từng dòng) thì {{merge}}/{{computeIfAbsent}} là lựa chọn tự nhiên. Với key là enum, dùng {{EnumMap}} để vừa nhanh vừa in ra đúng thứ tự khai báo.`,
  follow: ['Vì sao putIfAbsent(k, new ArrayList<>()) tốn hơn computeIfAbsent trong vòng lặp lớn?', 'Trên ConcurrentHashMap, merge có atomic không và có rủi ro gì khi lambda chậm?', 'Viết lại đoạn đếm trên bằng Collectors.groupingBy thế nào?'],
  tags: ['HashMap', 'merge', 'computeIfAbsent', 'getOrDefault', 'Java 8']
},
{
  id: 'collections-020',
  topic: 'collections',
  level: 'mid',
  q: 'Class {{Employee}} cần được sắp xếp theo mã nhân viên ở hầu hết mọi nơi, nhưng màn hình báo cáo lại cần sắp theo lương giảm dần rồi theo tên. Bạn dùng {{Comparable}} hay {{Comparator}} cho từng nhu cầu, và viết {{compareTo}} thế nào cho đúng?',
  a: `**Tóm tắt:** {{Comparable}} định nghĩa **thứ tự tự nhiên** duy nhất, nằm trong chính class ({{compareTo}}), phù hợp cho mã nhân viên. {{Comparator}} là thứ tự **bên ngoài**, có thể có nhiều cái, phù hợp cho báo cáo "lương giảm dần rồi tên". Khi viết so sánh, dùng {{Integer.compare}}/{{Long.compare}} hoặc {{Comparator.comparing}}, tuyệt đối không dùng phép trừ vì có thể tràn số.

### Hiểu nhanh
{{Comparable}} giống quy ước "xếp hàng theo số báo danh" in sẵn trên thẻ học sinh: ai cũng hiểu, chỉ có một. {{Comparator}} giống tờ giấy cô giáo cầm tay: hôm nay xếp theo chiều cao, mai xếp theo điểm, mỗi tờ là một luật riêng và không phải sửa thẻ học sinh.

### Thuật ngữ
- **compareTo(o)**: trả số âm nếu this đứng trước o, 0 nếu bằng nhau, dương nếu đứng sau.
- **Natural ordering**: thứ tự mà {{TreeMap}}, {{TreeSet}}, {{Collections.sort(list)}} dùng khi không truyền comparator.
- **Consistent with equals**: {{compareTo == 0}} khi và chỉ khi {{equals}} là true.

### Cách viết
~~~java
record Employee(long id, String name, BigDecimal salary) implements Comparable<Employee> {
    @Override
    public int compareTo(Employee o) {
        return Long.compare(id, o.id);     // KHÔNG viết (int) (id - o.id)
    }
}
// Báo cáo: lương giảm dần, cùng lương thì theo tên A-Z
Comparator<Employee> report = Comparator
        .comparing(Employee::salary, Comparator.reverseOrder())
        .thenComparing(Employee::name);
list.sort(report);              // list.sort() không sửa class Employee
Collections.sort(list);          // dùng natural ordering: theo id
~~~
Từng bước khi {{list.sort(report)}} so sánh hai người: (1) lấy salary của cả hai, so sánh ngược; (2) nếu khác nhau, trả kết quả luôn; (3) nếu bằng (trả 0), mới chuyển sang {{thenComparing}} so tên. Vì sao chuỗi như vậy an toàn: mỗi bước chỉ chạy khi bước trước hòa.

### Vì sao phép trừ là bẫy
{{a - b}} với {{int}} có thể tràn: {{Integer.MIN_VALUE - 1}} thành {{Integer.MAX_VALUE}} (số dương), nghĩa là số nhỏ nhất lại bị xếp **sau**. Với {{long}} ép về {{int}} còn tệ hơn: {{(int) (5_000_000_000L - 0)}} ra một số âm. Bug này chỉ lộ với dữ liệu cực trị nên thường lọt qua test.

### Khi nào chọn cái nào
| Tình huống | Chọn |
|---|---|
| Class có một thứ tự hiển nhiên (id, ngày, số tiền) | Comparable |
| Nhiều cách sắp, tùy màn hình | Comparator |
| Class không sửa được (thư viện, class của team khác) | Comparator |
| Key của TreeMap/TreeSet | Comparable hoặc truyền Comparator vào constructor |

### Lỗi hay gặp
1. **compareTo không nhất quán với equals**: {{TreeSet}} coi hai object có {{compareTo == 0}} là trùng và **bỏ mất** một cái, dù {{equals}} khác nhau.
2. **Lỗi suy luận kiểu với reversed()**: {{Comparator.comparing(e -> e.salary()).reversed()}} không biên dịch vì lambda bị suy ra kiểu {{Object}}; dùng method reference {{Employee::salary}} hoặc ghi rõ kiểu {{(Employee e) -> ...}}.
3. **Quên null**: field null làm {{compareTo}} ném NPE; dùng {{Comparator.nullsLast(...)}}.

### Trả lời miệng 1 phút
"Comparable là thứ tự tự nhiên viết trong class, chỉ một cái, TreeMap và Collections.sort dùng mặc định; ở đây tôi cho Employee so sánh theo id bằng Long.compare. Comparator là thứ tự bên ngoài, dùng cho báo cáo: comparing salary reverseOrder rồi thenComparing name. Tôi không dùng phép trừ vì tràn số, và giữ compareTo nhất quán với equals để TreeSet không nuốt phần tử."

> Senior tip: đừng cho entity/DTO implement {{Comparable}} chỉ vì một màn hình cần sắp xếp; thứ tự nghiệp vụ thay đổi theo yêu cầu, nên để nó thành các hằng {{Comparator}} có tên ({{Employee.BY_SALARY_DESC}}) và viết unit test với dữ liệu trùng lương, null và giá trị cực trị.`,
  follow: ['Vì sao TreeSet có thể "mất" phần tử khi compareTo không nhất quán với equals?', 'Comparator.comparing(...).reversed() đảo cả chuỗi hay chỉ khoá đầu?', 'BigDecimal có compareTo nhất quán với equals không?'],
  tags: ['Comparable', 'Comparator', 'sorting', 'compareTo']
},
{
  id: 'collections-021',
  topic: 'collections',
  level: 'mid',
  q: 'Cho 5 bài toán: tra cứu sản phẩm theo mã, danh sách mã đã xử lý (không trùng), lịch sử thao tác theo thứ tự thời gian, bảng xếp hạng điểm luôn sắp xếp, hàng đợi việc cần làm. Bạn chọn collection nào cho từng bài và lý do là gì?',
  a: `**Tóm tắt:** Chọn collection bằng cách trả lời 3 câu hỏi: **tra cứu theo gì** (vị trí, key, hay chỉ "có hay không"), **có cho trùng không**, và **cần thứ tự gì** (không cần, thứ tự chèn, hay sắp xếp). Với 5 bài: {{HashMap}}, {{HashSet}}, {{ArrayList}}, {{TreeMap}}/{{TreeSet}}, {{ArrayDeque}} (hoặc {{PriorityQueue}} nếu có độ ưu tiên).

### Hiểu nhanh
Collection giống các loại tủ đồ: kệ sách đánh số ({{List}}, lấy theo vị trí), tủ có nhãn tên ({{Map}}, lấy theo key), túi đựng bi không cho bi trùng ({{Set}}), và ống xếp hàng ({{Queue}}/{{Deque}}, vào đầu này ra đầu kia). Chọn sai tủ thì vẫn cất được đồ, nhưng tìm lại rất chậm.

### Thuật ngữ
- **O(1)**: thời gian gần như không đổi dù dữ liệu lớn; **O(log n)**: tăng rất chậm (1 triệu phần tử chỉ khoảng 20 bước); **O(n)**: phải duyệt hết.
- **Insertion order**: duyệt ra đúng thứ tự đã thêm vào.
- **Sorted order**: duyệt ra theo thứ tự so sánh (Comparable/Comparator).

### Cây quyết định
~~~text
Lấy theo key?  ── có ──> Map: cần sorted? TreeMap : cần thứ tự chèn? LinkedHashMap : HashMap
      │ không
Chỉ hỏi "có/không", không trùng? ── có ──> Set: TreeSet / LinkedHashSet / HashSet
      │ không
Lấy/xoá ở hai đầu (FIFO/LIFO)? ── có ──> ArrayDeque (ưu tiên: PriorityQueue)
      │ không
Danh sách theo vị trí ──> ArrayList
~~~

### Áp dụng cho 5 bài
| Bài toán | Chọn | Vì sao |
|---|---|---|
| Tra sản phẩm theo mã | HashMap<String, Product> | get theo key O(1) trung bình |
| Mã đã xử lý | HashSet<String> | contains O(1), tự loại trùng |
| Lịch sử thao tác | ArrayList<Action> | thêm cuối O(1) khấu hao, giữ thứ tự |
| Bảng xếp hạng | TreeMap<Integer, List<Player>> | luôn sắp xếp, có firstKey, headMap, O(log n) |
| Hàng đợi việc | ArrayDeque<Job> (PriorityQueue nếu có ưu tiên) | offer/poll hai đầu O(1) |

Với bảng xếp hạng, dùng {{TreeMap}} theo điểm và value là list người chơi vì nhiều người có thể cùng điểm; nếu dùng {{TreeSet<Player>}} thì comparator phải phân định cả khi cùng điểm (thêm id), nếu không người cùng điểm bị coi là trùng và biến mất.

### Lỗi hay gặp
1. **Dùng List để kiểm tra tồn tại**: {{list.contains(x)}} là O(n); trong vòng lặp 100.000 phần tử thành 10 tỷ phép so sánh. Đổi sang {{HashSet}}.
2. **Dựa vào thứ tự duyệt của HashMap/HashSet**: thứ tự không được đảm bảo và có thể đổi khi map resize. Cần thứ tự chèn thì dùng {{LinkedHashMap}}/{{LinkedHashSet}}.
3. **Dùng Stack hoặc LinkedList làm hàng đợi** khi chỉ chạy một thread: {{ArrayDeque}} nhanh và ít rác hơn.
4. **Key của HashMap là object mutable** hoặc chưa override {{equals}}/{{hashCode}}: tra không ra dữ liệu.
5. **Dùng collection thường giữa nhiều thread**: cần {{ConcurrentHashMap}}, {{BlockingQueue}}... thay vì {{HashMap}}/{{ArrayDeque}}.

### Trả lời miệng 1 phút
"Tôi hỏi ba câu: tra theo gì, có trùng không, cần thứ tự gì. Tra theo mã dùng HashMap, tập mã đã xử lý dùng HashSet, lịch sử theo thời gian dùng ArrayList, bảng xếp hạng luôn sắp xếp dùng TreeMap theo điểm, hàng đợi dùng ArrayDeque hoặc PriorityQueue nếu có ưu tiên. Nếu nhiều thread cùng truy cập, tôi đổi sang bản concurrent tương ứng."

> Senior tip: khi review code, cứ thấy {{contains}}, {{indexOf}} hay {{remove(Object)}} trên {{List}} nằm trong vòng lặp là đáng nghi ngờ; một lần đổi sang {{Set}} từng giúp tôi giảm job đối soát từ hàng chục phút xuống vài giây. Còn với dữ liệu bảng xếp hạng thật sự lớn hoặc chia sẻ giữa nhiều instance, chuyển sang Redis Sorted Set thay vì giữ {{TreeMap}} trong heap.`,
  follow: ['Nếu bảng xếp hạng cần lấy top 10 rất thường xuyên nhưng cập nhật điểm liên tục, bạn chọn gì?', 'Khi nào LinkedHashMap tốt hơn TreeMap?', 'Khi nào chọn PriorityQueue thay vì TreeSet?'],
  tags: ['collections', 'HashMap', 'TreeMap', 'ArrayDeque', 'choosing collection']
},
{
  id: 'collections-022',
  topic: 'collections',
  level: 'mid',
  q: 'Job đối chiếu 100.000 giao dịch với 100.000 bản ghi ngân hàng chạy mất 40 phút, profiler chỉ vào {{ArrayList.contains}}. Bạn giải thích vì sao chậm và sửa thế nào? Nêu độ phức tạp các thao tác chính của ArrayList, LinkedList, HashMap, TreeMap.',
  a: `**Tóm tắt:** {{ArrayList.contains}} phải duyệt tuần tự và gọi {{equals}} từng phần tử, tức O(n). Gọi nó trong vòng lặp n lần thành O(n²): 100.000 × 100.000 = 10 tỷ lần so sánh. Sửa bằng cách đưa một phía vào {{HashSet}}/{{HashMap}} (O(1) trung bình), tổng còn O(n), thường chỉ mất dưới một giây.

### Hiểu nhanh
Tìm một cái tên trong danh sách lớp **không sắp xếp** thì phải đọc từ đầu tới cuối. Nếu phải tìm 100.000 cái tên như vậy, bạn đọc lại cả danh sách 100.000 lần. {{HashSet}} giống một tủ có nhãn chữ cái: biết tên là mở thẳng ngăn tương ứng, không cần đọc ngăn khác.

### Thuật ngữ
- **Big-O**: cách đo thời gian tăng thế nào khi dữ liệu tăng, bỏ qua hằng số.
- **Trung bình (average) vs xấu nhất (worst)**: {{HashMap.get}} trung bình O(1), xấu nhất O(log n) từ Java 8 khi bucket đã được treeify.
- **Khấu hao (amortized)**: {{ArrayList.add}} thỉnh thoảng phải copy mảng sang mảng lớn hơn, nhưng chia đều thì vẫn O(1).

### Cơ chế từng bước
~~~java
// Chậm: O(n * m)
List<String> bankIds = loadBankIds();          // ArrayList 100k phần tử
for (Txn t : txns) {                           // 100k vòng
    if (!bankIds.contains(t.ref())) missing.add(t);  // mỗi lần duyệt tới 100k
}
// Nhanh: O(n + m)
Set<String> bankSet = new HashSet<>(bankIds);  // build một lần: O(m)
for (Txn t : txns) {
    if (!bankSet.contains(t.ref())) missing.add(t);  // O(1) trung bình
}
~~~
1. {{new HashSet<>(bankIds)}} tính {{hashCode}} từng chuỗi và đặt vào bucket: 100.000 thao tác.
2. Mỗi {{contains}} tính hash của chuỗi cần tìm, nhảy thẳng tới bucket và chỉ so {{equals}} với vài phần tử trong bucket.
3. Tổng khoảng 200.000 thao tác thay vì 10 tỷ. Vì sao chênh lệch lớn vậy: n² tăng bùng nổ, nhân đôi dữ liệu thì O(n²) chậm gấp 4, còn O(n) chỉ chậm gấp 2.

### Bảng độ phức tạp
| Thao tác | ArrayList | LinkedList | HashMap/HashSet | TreeMap/TreeSet |
|---|---|---|---|---|
| get theo index | O(1) | O(n) | - | - |
| tìm theo giá trị/key | O(n) | O(n) | O(1) tb | O(log n) |
| thêm cuối | O(1) khấu hao | O(1) | O(1) tb | O(log n) |
| chèn/xoá ở giữa | O(n) dịch mảng | O(n) tìm vị trí + O(1) nối | - | - |
| duyệt có thứ tự | thứ tự chèn | thứ tự chèn | không đảm bảo | sắp xếp |

Lưu ý: {{LinkedList}} chỉ O(1) khi bạn **đã đứng sẵn** tại node (qua iterator); còn {{list.add(i, x)}} phải đi bộ tới vị trí i nên vẫn O(n).

### Lỗi hay gặp
1. **{{list.remove(Object)}} và {{indexOf}} trong vòng lặp**: cũng O(n) mỗi lần, dẫn tới O(n²) giống hệt.
2. **{{stream().filter(x -> other.contains(x))}}** với {{other}} là List: cùng bug, chỉ là viết đẹp hơn.
3. **Key thiếu {{equals}}/{{hashCode}}**: chuyển sang HashSet thì tra không ra; với object tự viết, dùng {{record}} hoặc override đúng cả hai.
4. **{{removeAll(list)}}**: {{ArrayList.removeAll}} gọi {{contains}} trên collection truyền vào, nên truyền {{HashSet}} thay vì List.

### Trả lời miệng 1 phút
"ArrayList.contains duyệt tuần tự O(n), gọi trong vòng lặp n lần thành O(n²), 10 tỷ phép so sánh. Tôi build một HashSet từ phía bản ghi ngân hàng một lần rồi tra O(1), tổng O(n), từ 40 phút xuống dưới một giây. Ngoài ra tôi nhớ bảng: ArrayList get theo index O(1) nhưng tìm O(n), HashMap tra O(1) trung bình, TreeMap O(log n) nhưng có thứ tự."

> Senior tip: khi đối soát dữ liệu lớn hơn nhiều so với heap (hàng chục triệu dòng), đừng nạp cả hai phía vào Java; đẩy việc so khớp xuống DB bằng {{JOIN}}/{{EXCEPT}} trên cột có index, hoặc sort hai file rồi merge tuần tự. Big-O đúng mà tràn heap thì vẫn là sự cố.`,
  follow: ['HashMap.get khi nào thoái hoá và Java 8 cải thiện gì?', 'Vì sao LinkedList.add(index, x) không phải O(1)?', 'Với 50 triệu bản ghi bạn đối soát thế nào?'],
  tags: ['Big-O', 'complexity', 'ArrayList', 'HashSet', 'performance']
},
{
  id: 'collections-023',
  topic: 'collections',
  level: 'mid',
  q: 'Unit test so sánh chuỗi JSON in ra từ một {{HashMap}} (hoặc từ {{Set.of}}) lúc pass lúc fail, và sau khi nâng JDK thì fail hẳn. Vì sao? Bạn duyệt Map thế nào cho đúng và hiệu quả?',
  a: `**Tóm tắt:** {{HashMap}}, {{HashSet}}, {{Set.of}}, {{Map.of}} **không đảm bảo thứ tự duyệt**. Thứ tự phụ thuộc hash, capacity hiện tại (đổi khi resize), phiên bản JDK, và riêng {{Set.of}}/{{Map.of}} còn được xáo theo một giá trị "salt" ngẫu nhiên nên có thể khác nhau giữa các lần chạy JVM. Test không được dựa vào thứ tự đó; cần thứ tự thì dùng {{LinkedHashMap}} (thứ tự chèn) hoặc {{TreeMap}} (sắp xếp). Khi duyệt cần cả key và value, dùng {{entrySet()}} hoặc {{forEach((k, v) -> ...)}}, không dùng {{keySet()}} rồi {{get(k)}}.

### Hiểu nhanh
{{HashMap}} giống bãi giữ xe chia ô theo biển số: xe nằm ở ô do công thức quyết định, không theo giờ vào. Khi bãi mở rộng (resize), công thức chia lại ô và xe đổi chỗ. Nếu bạn đi dọc bãi đọc biển số, thứ tự đọc được hôm nay khác hôm qua là bình thường.

### Thuật ngữ
- **Iteration order**: thứ tự mà vòng for-each trả phần tử.
- **Resize/rehash**: khi số phần tử vượt {{capacity × 0.75}}, HashMap gấp đôi mảng bucket và phân bổ lại phần tử.
- **Entry**: cặp key-value, kiểu {{Map.Entry<K, V>}}.

### Vì sao thứ tự thay đổi
1. Vị trí bucket = {{(hash ^ (hash >>> 16)) & (capacity - 1)}}. Capacity đổi từ 16 lên 32 thì phép {{&}} lấy thêm 1 bit, phần tử bị chia sang ô khác, nên thứ tự duyệt đổi.
2. Cài đặt {{hashCode}}/{{HashMap}} có thể khác giữa các bản JDK (Java 8 từng đổi cách xử lý bucket so với Java 7), nên nâng JDK là test lộ bug.
3. {{Set.of}}/{{Map.of}} (Java 9+) cố ý trộn thứ tự bằng một "salt" ngẫu nhiên (javadoc ghi rõ thứ tự duyệt là unspecified và có thể thay đổi) để chính bạn không vô tình phụ thuộc vào thứ tự. Kết quả: test pass/fail tùy lần chạy.

### Duyệt Map đúng cách
~~~java
Map<String, Integer> stock = new LinkedHashMap<>(); // cần thứ tự chèn ổn định
// Tốt: một lần duyệt, có sẵn key và value
for (Map.Entry<String, Integer> e : stock.entrySet()) {
    System.out.println(e.getKey() + "=" + e.getValue());
}
stock.forEach((sku, qty) -> System.out.println(sku + "=" + qty)); // gọn hơn
// Kém: mỗi vòng thêm một lần tra cứu; với TreeMap là O(log n) mỗi lần
for (String sku : stock.keySet()) {
    Integer qty = stock.get(sku);
}
~~~

### Cách sửa test
| Cách | Khi nào |
|---|---|
| So sánh object: {{assertEquals(expectedMap, actualMap)}} | {{Map.equals}} không quan tâm thứ tự |
| So sánh JSON theo ngữ nghĩa (JSONAssert, AssertJ {{containsExactlyInAnyOrderEntriesOf}}) | test API |
| Dùng LinkedHashMap/TreeMap trong code | khi thứ tự là yêu cầu nghiệp vụ thật |
| Jackson {{ORDER_MAP_ENTRIES_BY_KEYS}} | output JSON cần ổn định để so sánh, cache, ký số |

### Lỗi hay gặp
1. **Trả {{Set.of(...)}} hoặc {{HashSet}} ra API rồi frontend hiển thị theo thứ tự đó**: mỗi lần deploy thứ tự lại khác.
2. **Tạo chữ ký/hash từ việc nối các entry của HashMap**: hai server cho hai chữ ký khác nhau cho cùng dữ liệu.
3. **Lấy "phần tử đầu tiên" của HashSet** làm giá trị mặc định: kết quả không xác định.

### Trả lời miệng 1 phút
"HashMap và Set.of không đảm bảo thứ tự: nó phụ thuộc hash, capacity và bản JDK, còn Set.of cố ý xáo theo salt ngẫu nhiên nên có thể khác giữa các lần chạy, nên test lúc pass lúc fail. Tôi sửa test để so sánh theo nội dung, còn nếu nghiệp vụ cần thứ tự thì dùng LinkedHashMap hoặc TreeMap. Khi duyệt tôi dùng entrySet hoặc forEach thay vì keySet rồi get."

> Senior tip: test "flaky" kiểu này hay xuất hiện ngay sau khi nâng JDK hoặc đổi {{List}} sang {{Set}} cho nhanh; trước khi nâng version, grep các chỗ serialize {{HashMap}}/{{HashSet}} ra chuỗi để so sánh, ký HMAC hoặc làm cache key. Từ Java 21, {{LinkedHashMap}}/{{LinkedHashSet}} còn là {{SequencedMap}}/{{SequencedSet}} nên lấy phần tử đầu, cuối rất tiện.`,
  follow: ['Map.equals so sánh hai map khác class (HashMap và TreeMap) được không?', 'Vì sao Set.of cố ý xáo thứ tự?', 'Bạn sinh chữ ký HMAC cho một payload dạng Map thế nào để ổn định?'],
  tags: ['HashMap', 'iteration order', 'Set.of', 'LinkedHashMap', 'flaky test']
},
{
  id: 'collections-024',
  topic: 'collections',
  level: 'senior',
  q: 'Đồng nghiệp gọi {{map.keySet().remove(k)}}, sửa {{entry.setValue()}}, rồi trả {{bigList.subList(0, 10)}} cho cache. Sau đó dữ liệu gốc bị đổi bất ngờ và heap phình to. Collection "view" hoạt động thế nào và bạn xử lý ra sao?',
  a: `**Tóm tắt:** {{keySet()}}, {{values()}}, {{entrySet()}}, {{subList()}}, {{headMap()}}... không phải bản copy mà là **view**: một cửa sổ nhìn vào collection gốc. Sửa qua view là sửa gốc, sửa gốc thì view thấy ngay (hoặc hỏng với {{ConcurrentModificationException}}), và view giữ reference tới toàn bộ gốc nên {{subList}} 10 phần tử vẫn giữ cả list 1 triệu phần tử trong heap. Cần dữ liệu độc lập thì copy: {{new ArrayList<>(list.subList(0, 10))}} hoặc {{List.copyOf(...)}}.

### Hiểu nhanh
View giống cửa kính nhìn vào kho: bạn nhìn qua kính thấy hàng thật, thò tay qua cửa (nếu cửa cho phép) là lấy hàng thật ra khỏi kho. Copy thì giống chụp ảnh kho: ảnh không đổi khi kho đổi, nhưng tốn giấy in.

### Thuật ngữ
- **View**: object implement Collection/Map nhưng không có dữ liệu riêng, mọi thao tác chuyển tiếp xuống collection gốc.
- **Write-through**: thao tác ghi trên view ghi thẳng xuống gốc.
- **Structural modification**: thay đổi số phần tử (add/remove), khác với chỉ thay giá trị ({{set}}).

### Cơ chế từng bước
~~~java
Map<String, Integer> stock = new HashMap<>(Map.of("A", 1, "B", 0));
stock.values().removeIf(q -> q == 0);    // xoá luôn entry "B" khỏi map gốc
stock.keySet().remove("A");              // map gốc giờ rỗng
// stock.keySet().add("C");              // UnsupportedOperationException: view không biết value

List<Integer> big = new ArrayList<>(bigData);   // 1 triệu phần tử
List<Integer> top = big.subList(0, 10);         // giữ reference tới big
big.add(42);                                    // đổi cấu trúc gốc
top.get(0);                                     // ConcurrentModificationException
~~~
1. {{subList}} của {{ArrayList}} lưu {{parent}}, {{offset}}, {{size}} và {{modCount}} tại thời điểm tạo. Mỗi thao tác kiểm tra {{modCount}} của gốc; lệch là ném CME. Vì sao: sau khi gốc thêm/bớt, offset cũ không còn trỏ đúng phần tử.
2. Vì giữ {{parent}}, GC không thu hồi được list lớn: cache 10.000 subList nhỏ có thể giữ 10.000 list lớn.
3. {{entry.setValue(v)}} trên {{HashMap.entrySet()}} ghi thẳng vào node của map, an toàn trong lúc duyệt; còn {{Map.of(...)}} hay {{Map.entry(k, v)}} thì entry là bất biến và ném {{UnsupportedOperationException}}.
4. {{TreeMap.headMap(k)}}/{{subMap}} cũng là view có giới hạn khoảng: thêm key nằm ngoài khoảng qua view sẽ ném {{IllegalArgumentException}}.

### Mẹo hữu ích từ view
- Xoá một đoạn: {{list.subList(from, to).clear()}} nhanh hơn xoá từng phần tử bằng vòng lặp.
- Lọc map tại chỗ: {{map.entrySet().removeIf(e -> e.getValue() == 0)}}.

### Bảng so sánh
| | View | Copy |
|---|---|---|
| Chi phí tạo | O(1) | O(n) |
| Thấy thay đổi của gốc | có | không |
| Giữ gốc trong heap | có | không |
| An toàn để cache/trả qua API | không | có |

### Lỗi hay gặp
1. **Cache {{subList}}** hoặc trả nó ra khỏi method: rò bộ nhớ và CME khó tái hiện.
2. **Truyền {{map.keySet()}} cho code khác** rồi code đó {{removeAll}} làm mất dữ liệu map.
3. **Nghĩ {{Collections.unmodifiableList(list)}} là snapshot**: nó vẫn là view, gốc đổi thì nó đổi theo.
4. **Duyệt {{subList}} trong khi thread khác sửa gốc**: lỗi ngẫu nhiên.

### Trả lời miệng 1 phút
"keySet, values, entrySet, subList, headMap là view chứ không phải copy: ghi qua view là ghi vào gốc, gốc đổi cấu trúc thì subList ném CME, và view giữ reference tới gốc nên cache subList nhỏ vẫn giữ cả list lớn. Tôi dùng view cho thao tác tại chỗ như entrySet().removeIf hay subList().clear(), còn khi cần lưu hoặc trả ra ngoài thì copy bằng List.copyOf."

> Senior tip: một sự cố tôi từng gặp là heap dump cho thấy hàng nghìn {{ArrayList}} 200.000 phần tử bị giữ bởi {{ArrayList$SubList}} trong cache "top 20". Trong MAT, xem dominator tree, nếu thấy {{SubList}} hay {{KeySet}} giữ retained size lớn bất thường thì gần như chắc chắn ai đó cache view thay vì copy.`,
  follow: ['Vì sao keySet().add() bị cấm nhưng keySet().remove() lại được?', 'List.copyOf có copy lại nếu list đầu vào đã immutable không?', 'Làm sao phát hiện subList giữ bộ nhớ trong heap dump?'],
  tags: ['view', 'subList', 'keySet', 'entrySet', 'memory leak']
},
{
  id: 'collections-025',
  topic: 'collections',
  level: 'senior',
  q: 'Bạn biết trước sẽ nạp 100.000 phần tử vào {{HashMap}} và {{ArrayList}}. Có nên khai báo initial capacity không, tính thế nào cho đúng? Vì sao {{new HashMap<>(100_000)}} chưa chắc tránh được resize, và {{HashMap.newHashMap}} (Java 19) giải quyết gì?',
  a: `**Tóm tắt:** Nên khai báo khi biết trước kích thước và dữ liệu đủ lớn (hàng chục nghìn phần tử trở lên, hoặc code nóng chạy liên tục). Với {{ArrayList}}, {{new ArrayList<>(n)}} là đủ. Với {{HashMap}}, tham số constructor là **số bucket**, không phải số phần tử: map resize khi số phần tử vượt {{capacity × 0.75}}, nên phải truyền khoảng {{n / 0.75}}. Java 19 thêm {{HashMap.newHashMap(n)}}, {{HashSet.newHashSet(n)}}, {{LinkedHashMap.newLinkedHashMap(n)}} nhận thẳng **số phần tử dự kiến** và tự tính.

### Hiểu nhanh
Đặt bàn tiệc cho 100 khách: nhà hàng có quy định "bàn chỉ được lấp 75% chỗ cho thoáng". Nếu bạn đặt đúng 100 ghế thì đến khách thứ 76 họ phải dọn sang phòng lớn hơn (resize), xếp lại toàn bộ khách. Đặt sẵn khoảng 134 ghế thì không phải dọn.

### Thuật ngữ
- **Capacity**: số bucket (HashMap) hoặc độ dài mảng bên trong (ArrayList).
- **Load factor**: tỉ lệ lấp đầy cho phép trước khi resize, mặc định 0,75.
- **Threshold**: {{capacity × loadFactor}}; vượt ngưỡng này thì resize.

### Cơ chế từng bước
1. **ArrayList**: mặc định mảng rỗng, lần add đầu cấp 10, mỗi lần đầy tăng khoảng 1,5 lần ({{old + (old >> 1)}}) và copy toàn bộ sang mảng mới. Từ 10 lên 100.000 mất khoảng 23 lần copy, tổng số phần tử bị copy cỡ 2 lần n, tạo nhiều mảng rác.
2. **HashMap**: capacity luôn là lũy thừa của 2. {{new HashMap<>(100)}} làm tròn lên 128, threshold là 96, nên phần tử thứ 97 gây resize lên 256: mọi entry bị tính lại vị trí.
3. **newHashMap(100)**: tính {{ceil(100 / 0.75) = 134}}, làm tròn lên 256, threshold 192, chứa đủ 100 phần tử mà không resize.

~~~java
List<Order> orders = new ArrayList<>(rows.size());      // đúng ngay
Map<Long, Order> byId = HashMap.newHashMap(rows.size()); // Java 19+
// Java 17: tự tính, tránh resize
Map<Long, Order> byId17 = new HashMap<>((int) Math.ceil(rows.size() / 0.75));
// Hoặc dùng Guava: Maps.newHashMapWithExpectedSize(n)
~~~

### Số liệu minh hoạ
| Kích thước | Không khai báo | Khai báo đúng |
|---|---|---|
| ArrayList 100.000 | ~23 lần cấp mảng mới | 1 lần |
| HashMap 100.000 | resize 14 lần (16 → 32 → ... → 262.144) | 0 lần |

Mức lợi thực tế thường là vài đến vài chục phần trăm thời gian nạp và ít rác hơn, không phải gấp nhiều lần. Đáng làm ở code nóng hoặc batch lớn, không đáng làm cho map 5 phần tử.

### Khi nào không nên
- Không biết trước kích thước: đoán quá lớn thì phí bộ nhớ (mảng bucket rỗng vẫn chiếm chỗ).
- Collection nhỏ, tạo một lần: code thêm rối mà không đo được lợi.
- Đừng tăng load factor lên 1.0 để "tiết kiệm": nhiều va chạm hơn, tra chậm hơn.

### Lỗi hay gặp
1. **{{new HashMap<>(n)}} với n là số phần tử**: vẫn resize một lần như ví dụ trên.
2. **Nhầm {{new ArrayList<>(n)}} là list có n phần tử**: {{size()}} vẫn là 0, gọi {{set(5, x)}} ném {{IndexOutOfBoundsException}}.
3. **Khai báo capacity khổng lồ "cho chắc"** cho map tạo theo từng request: mỗi request cấp mảng lớn, GC chịu khổ.

### Trả lời miệng 1 phút
"ArrayList thì truyền n là đủ. HashMap thì tham số là số bucket, map resize khi vượt 75% nên phải truyền n chia 0,75; new HashMap(100) vẫn resize ở phần tử 97. Java 19 có HashMap.newHashMap(n) nhận số phần tử dự kiến. Tôi chỉ làm việc này ở batch lớn hoặc code nóng, có đo trước và sau."

> Senior tip: trong một job nạp 5 triệu entry vào {{HashMap}}, việc tính đúng capacity giảm đáng kể thời gian nạp và các đợt GC do cấp mảng lớn; nhưng lợi ích lớn hơn nhiều thường đến từ việc không giữ 5 triệu object boxed trong heap ngay từ đầu. Đo bằng JMH hoặc ít nhất bằng GC log trước khi kết luận.`,
  follow: ['Vì sao capacity của HashMap phải là lũy thừa của 2?', 'Tăng load factor lên 1.0 được gì, mất gì?', 'ArrayList.trimToSize dùng khi nào?'],
  tags: ['HashMap', 'ArrayList', 'initial capacity', 'load factor', 'Java 19']
},
{
  id: 'collections-026',
  topic: 'collections',
  level: 'lead',
  q: 'Bạn review code của một team và đặt guideline dùng collection cho cả dự án. Những anti-pattern nào về collection bạn hay thấy gây sự cố production, và bạn biến chúng thành quy tắc (kèm cách kiểm tra tự động) thế nào?',
  a: `**Tóm tắt:** Các sự cố collection hay gặp nhất không đến từ thuật toán phức tạp mà từ vài thói quen: **cache bằng static Map không giới hạn** (rò bộ nhớ), **nạp toàn bộ bảng vào List** (OOM), **O(n²) do contains trên List**, **chia sẻ collection không thread-safe**, **trả null thay vì collection rỗng**, và **lộ collection mutable nội bộ**. Guideline tốt nêu quy tắc ngắn, lý do, ví dụ đúng/sai, và được kiểm tra bằng công cụ (static analysis, ArchUnit, test tải) chứ không chỉ dựa vào trí nhớ người review.

### Hiểu nhanh
Collection giống thùng chứa trong nhà kho: lỗi hiếm khi là "chọn sai loại thùng", mà là "thùng không có nắp nên đầy tràn", "hai người cùng bốc một thùng", hoặc "đưa chìa khoá kho cho khách". Guideline là nội quy kho, còn công cụ tự động là camera.

### Thuật ngữ
- **Unbounded**: không có giới hạn kích thước, lớn dần theo thời gian chạy.
- **Static analysis**: công cụ đọc code tìm mẫu lỗi (Sonar, Error Prone, SpotBugs).
- **ArchUnit**: thư viện viết test kiểm tra quy tắc kiến trúc trong code Java.

### Bảng anti-pattern và quy tắc
| Anti-pattern | Hậu quả production | Quy tắc |
|---|---|---|
| {{static Map}} làm cache, không eviction | heap tăng dần, Full GC rồi OOM sau vài ngày | dùng Caffeine/Spring Cache có maximumSize và TTL |
| {{findAll()}} rồi lọc trong Java | OOM khi bảng lớn lên | phân trang, stream hoặc lọc ở SQL |
| {{list.contains}} trong vòng lặp | job chạy chậm theo n² | tra cứu dùng Set/Map |
| HashMap/ArrayList dùng chung giữa thread | mất dữ liệu, có thể treo CPU | dùng concurrent collection hoặc giữ bất biến |
| Trả {{null}} cho danh sách | NPE ở caller | trả {{List.of()}} |
| Getter trả field mutable | caller sửa trạng thái nội bộ | {{List.copyOf}} ở constructor |
| Key mutable hoặc thiếu equals/hashCode | tra không ra, "mất" phần tử | key là record/giá trị bất biến |
| Dựa vào thứ tự HashMap/Set.of | test flaky, output khác nhau giữa server | LinkedHashMap/TreeMap khi cần thứ tự |

### Quy trình đặt guideline (từng bước)
1. **Thu thập bằng chứng**: gom postmortem, heap dump, slow job của 6-12 tháng; chỉ đưa vào guideline những lỗi đã thực sự xảy ra. Vì sao: quy tắc có câu chuyện thật thì team tin và nhớ.
2. **Viết ngắn**: mỗi quy tắc một dòng, kèm ví dụ sai/đúng và link sự cố.
3. **Tự động hoá**: bật rule Sonar/Error Prone phù hợp; viết ArchUnit cấm field {{static}} kiểu {{Map}} không final trong package service; thêm test tải với dữ liệu cỡ production cho các job batch.
4. **Đo trong runtime**: metric kích thước cache ({{cache.size}}, hit ratio), alert heap sau Full GC tăng dần.
5. **Review lại định kỳ**: bỏ quy tắc không còn giá trị, thêm quy tắc từ sự cố mới.

~~~java
// Sai: cache không giới hạn, sống bằng vòng đời ứng dụng
private static final Map<String, Rate> RATES = new HashMap<>();
// Đúng: có giới hạn, có hết hạn, thread-safe (Caffeine)
private final Cache<String, Rate> rates = Caffeine.newBuilder()
        .maximumSize(10_000)
        .expireAfterWrite(Duration.ofMinutes(10))
        .recordStats()                      // để xuất hit ratio ra metric
        .build();
~~~

### Lỗi hay gặp khi làm guideline
1. **Quá dài, quá chung chung** ("dùng collection phù hợp"): không ai áp dụng được.
2. **Cấm tuyệt đối** (cấm LinkedList, cấm stream): gây tranh cãi vô ích; nên nêu "mặc định" và "ngoại lệ có lý do".
3. **Không có công cụ**: quy tắc chỉ sống trong đầu reviewer, nghỉ phép là lỗi quay lại.

### Trả lời miệng 1 phút
"Lỗi collection gây sự cố thường là cache static không giới hạn, findAll rồi lọc trong Java, contains trên List trong vòng lặp, chia sẻ HashMap giữa thread, trả null và lộ collection mutable. Tôi viết guideline ngắn dựa trên sự cố thật, mỗi quy tắc có ví dụ sai/đúng, rồi tự động hoá bằng Sonar, ArchUnit, test tải và metric kích thước cache, và rà lại định kỳ."

> Senior tip: quy tắc có giá trị nhất tôi từng đưa vào là "mọi Map dùng làm cache phải có giới hạn và metric". Một service thanh toán từng Full GC liên tục sau 5 ngày uptime chỉ vì {{static HashMap}} lưu token theo request; sau khi đổi sang Caffeine có {{maximumSize}} và dashboard hit ratio, heap phẳng và lỗi không tái diễn.`,
  follow: ['Bạn viết ArchUnit rule thế nào để cấm static mutable Map?', 'Làm sao phát hiện cache không giới hạn từ heap dump?', 'Khi nào static Map vẫn chấp nhận được?'],
  tags: ['code review', 'guideline', 'memory leak', 'Caffeine', 'anti-pattern']
},
{
  id: 'modern-017',
  topic: 'modern',
  level: 'mid',
  q: 'Bạn review đoạn code {{orders.stream().filter(...).forEach(o -> result.add(o.id()))}} và một chỗ khác dùng mảng một phần tử {{int[] total}} để cộng dồn trong lambda. Code này sai hoặc rủi ro ở đâu, và bạn viết lại thế nào cho đúng tinh thần Stream API?',
  a: `**Tóm tắt:** Lambda trong stream nên là **hàm thuần**: chỉ nhận input và trả output, không sửa biến bên ngoài (side-effect). Đổ kết quả vào {{result.add}} hay cộng vào {{total[0]}} chạy được ở stream tuần tự nhưng **sai khi chuyển sang parallel** (mất phần tử, tổng sai, có thể ném exception), khó đọc và khó test. Viết lại bằng các thao tác có sẵn: {{map(...).toList()}}, {{collect(...)}}, {{mapToLong(...).sum()}}, {{reduce}}.

### Hiểu nhanh
Stream giống dây chuyền nhà máy: mỗi trạm (filter, map) nhận sản phẩm, xử lý, chuyển tiếp; cuối dây có thùng gom hàng (collect). Side-effect giống công nhân ở giữa dây tự ý ôm sản phẩm bỏ vào túi riêng. Khi nhà máy chạy một dây thì còn tạm ổn; khi mở thêm nhiều dây song song (parallel), nhiều người cùng nhét vào một cái túi thì hàng rơi mất.

### Thuật ngữ
- **Side-effect**: lambda thay đổi trạng thái bên ngoài nó (thêm vào list, tăng biến đếm, ghi log, gọi DB).
- **Stateless / non-interfering**: yêu cầu của Stream API: lambda không phụ thuộc trạng thái thay đổi và không sửa nguồn dữ liệu đang duyệt.
- **Reduction**: gộp nhiều phần tử thành một kết quả (tổng, list, map) bằng {{reduce}}/{{collect}}.

### Vì sao side-effect nguy hiểm
1. {{ArrayList}} không thread-safe. Ở parallel stream, nhiều thread của ForkJoinPool cùng gọi {{add}}: hai thread ghi vào cùng một ô mảng, kết quả mất phần tử, có khi ném {{ArrayIndexOutOfBoundsException}} lúc mảng đang được mở rộng.
2. Mảng một phần tử {{int[] total = new int[1]}} là mẹo lách luật "effectively final" (biến mảng không đổi, nhưng phần tử thì đổi). Ở parallel, {{total[0] += x}} là đọc-cộng-ghi không atomic nên tổng bị thiếu.
3. Ngay cả khi tuần tự, người đọc phải tìm xem {{result}} được khai báo ở đâu, ai khác sửa nó. Còn {{collect}} cho thấy rõ "đầu ra là gì".
4. Stream lazy: nếu bạn quên terminal operation, lambda có side-effect **không bao giờ chạy**, nên logic "tranh thủ" ghi gì đó trong {{map}}/{{peek}} có thể biến mất.

### Viết lại
~~~java
// Trước: side-effect
List<Long> result = new ArrayList<>();
orders.stream().filter(o -> o.paid()).forEach(o -> result.add(o.id()));
// Sau: biểu thức trả về kết quả
List<Long> ids = orders.stream()
        .filter(Order::paid)
        .map(Order::id)
        .toList();                         // Java 16+, list không sửa được

long total = orders.stream()
        .filter(Order::paid)
        .mapToLong(Order::amountCents)     // tránh boxing Long
        .sum();                            // reduction an toàn kể cả parallel

Map<String, Long> countByCity = orders.stream()
        .collect(Collectors.groupingBy(Order::city, Collectors.counting()));
~~~

### Khi nào forEach vẫn đúng
{{forEach}} là terminal operation hợp lệ khi **mục đích chính** là hành động bên ngoài: gửi từng event, in log, ghi file. Khi đó viết rõ ràng, thậm chí vòng for thường còn dễ đọc hơn, và không được dùng parallel nếu đích ghi không thread-safe.

| Mục đích | Dùng |
|---|---|
| Tạo list/set/map mới | {{toList()}}, {{collect(...)}} |
| Tính tổng, đếm, min/max | {{sum}}, {{count}}, {{max}}, {{reduce}} |
| Gửi/ghi từng phần tử ra ngoài | {{forEach}} hoặc vòng for |

### Lỗi hay gặp
1. **Dùng {{peek}} để làm logic nghiệp vụ**: {{peek}} chỉ dành cho debug; JDK có thể bỏ qua nó (ví dụ {{count()}} trên nguồn biết trước size từ Java 9 không chạy pipeline).
2. **Sửa chính collection nguồn trong lambda** ({{list.stream().forEach(x -> list.remove(x))}}): {{ConcurrentModificationException}}.
3. **Dùng {{Collections.synchronizedList}} để "chữa" parallel**: chạy đúng nhưng mọi thread tranh nhau một lock, mất hết lợi ích song song; dùng {{collect}} thì mỗi thread gom riêng rồi mới gộp.

### Trả lời miệng 1 phút
"Lambda trong stream nên là hàm thuần. Đổ kết quả vào list bên ngoài hay cộng vào int[] chạy được ở stream tuần tự nhưng sai ở parallel vì ArrayList và phép cộng không thread-safe, và làm code khó đọc. Tôi viết lại bằng map rồi toList, mapToLong rồi sum, groupingBy với counting. forEach tôi chỉ dùng khi mục đích chính là hành động ra ngoài như gửi event."

> Senior tip: khi review, tôi tìm nhanh các mẫu {{forEach(x -> list.add}}, {{new int[1]}}, {{AtomicInteger}} trong lambda và {{peek(}}: phần lớn đều viết lại được bằng {{collect}}/{{reduce}} ngắn hơn. Sonar có rule cảnh báo một số mẫu này; bật nó để reviewer không phải nhắc lại mãi.`,
  follow: ['Vì sao collect an toàn ở parallel stream còn forEach + add thì không?', 'Khi nào JDK bỏ qua peek?', 'Dùng AtomicLong trong lambda có phải giải pháp tốt không?'],
  tags: ['Stream', 'side-effect', 'collect', 'parallel stream', 'forEach']
},
{
  id: 'modern-018',
  topic: 'modern',
  level: 'mid',
  q: 'Team đang dùng Lombok {{@Data}}, {{@Value}}, {{@Builder}} ở khắp nơi và có người đề xuất chuyển sang {{record}}. Với DTO request/response, value object (Money, Email), class cấu hình và JPA entity, bạn chọn record, Lombok hay class viết tay? Vì sao?',
  a: `**Tóm tắt:** {{record}} (Java 16) là lựa chọn mặc định cho dữ liệu **bất biến**: DTO, value object, class cấu hình ({{@ConfigurationProperties}}), projection. Lombok {{@Value}} gần giống record nhưng là thư viện ngoài; {{@Data}} sinh setter nên tạo object mutable, chỉ hợp khi framework cần setter. JPA entity giữ là **class thường** (có thể dùng vài annotation Lombok an toàn như {{@Getter}}), không dùng record và tránh {{@Data}}. {{@Builder}} vẫn hữu ích khi object có nhiều field tuỳ chọn.

### Hiểu nhanh
Record giống tờ hoá đơn đã in: ghi một lần, ai cũng đọc được, không ai sửa được, hai tờ cùng nội dung là bằng nhau. Lombok {{@Data}} giống tờ giấy nháp ghi bằng bút chì: tiện sửa, nhưng ai cầm cũng sửa được. Lombok là "máy in tự động" chạy lúc compile, còn record là tính năng có sẵn của ngôn ngữ.

### Thuật ngữ
- **Record**: class final, field {{private final}}, tự sinh constructor, accessor dạng {{name()}}, {{equals}}, {{hashCode}}, {{toString}}.
- **Lombok**: annotation processor can thiệp vào quá trình biên dịch để sinh code (getter, setter, builder...).
- **Value object**: object được nhận diện bằng giá trị (hai {{Money(100, VND)}} là như nhau), không có danh tính riêng.

### So sánh
| | record | Lombok @Value | Lombok @Data | Class viết tay |
|---|---|---|---|---|
| Bất biến | có | có | không (có setter) | tuỳ |
| Phụ thuộc ngoài | không | có (Lombok + plugin IDE) | có | không |
| Accessor | {{name()}} | {{getName()}} | {{getName()}}/{{setName()}} | tuỳ |
| Kế thừa class khác | không | không (final) | được | được |
| Builder | tự viết | thêm {{@Builder}} | thêm {{@Builder}} | tự viết |
| JPA entity | không | không | rủi ro | nên dùng |

### Chọn cho từng loại (từng bước)
1. **DTO request/response**: record. Jackson 2.12+ map được record, Bean Validation đặt annotation trên component ({{record CreateOrder(@NotBlank String sku, @Positive int qty)}}).
2. **Value object**: record + compact constructor để validate và chuẩn hoá. Vì sao: bất biến làm value object an toàn khi dùng làm key Map hoặc chia sẻ giữa thread.
3. **Class cấu hình**: record với {{@ConfigurationProperties}} (Spring Boot 3 binding qua constructor), không cần setter.
4. **JPA entity**: class thường. JPA cần constructor không tham số, field không final và Hibernate tạo proxy bằng cách kế thừa class; record là final nên không đáp ứng được. Tránh {{@Data}} trên entity vì {{equals}}/{{hashCode}} trên mọi field và {{toString}} chạm vào quan hệ lazy.

~~~java
// Value object bằng record: validate một lần, sau đó không ai sửa được
public record Email(String value) {
    public Email {                                  // compact constructor
        Objects.requireNonNull(value, "email");
        value = value.strip().toLowerCase();        // chuẩn hoá trước khi gán field
        if (!value.contains("@")) throw new IllegalArgumentException("email không hợp lệ");
    }
}
~~~

### Lỗi hay gặp
1. **Record chứa {{List}} mutable**: record chỉ "nông" bất biến; caller giữ list gốc vẫn sửa được. Dùng {{List.copyOf}} trong compact constructor.
2. **Chuyển {{@Data}} sang record rồi code gọi {{getName()}} vỡ**: accessor record tên là {{name()}}; một số thư viện cũ (JSP EL, BeanUtils đời cũ) chỉ hiểu getter kiểu JavaBean.
3. **Record có quá nhiều field (15+)**: constructor dài, dễ truyền nhầm vị trí; tách thành record con hoặc dùng builder.
4. **Trộn Lombok {{@Data}} với kế thừa**: {{equals}} sinh ra mặc định không gọi {{super.equals}}, kèm cảnh báo; dễ có hai object khác nhau bị coi là bằng.

### Trả lời miệng 1 phút
"Dữ liệu bất biến tôi dùng record: DTO, value object, cấu hình. Nó có sẵn trong ngôn ngữ, không phụ thuộc Lombok, bất biến và equals theo giá trị. Lombok @Data tạo object mutable nên tôi chỉ dùng khi framework cần setter. JPA entity giữ class thường vì cần no-arg constructor, field không final và proxy; trên entity tôi không dùng @Data. Builder thì vẫn dùng Lombok @Builder khi có nhiều field tuỳ chọn."

> Senior tip: đừng chuyển hàng loạt từ Lombok sang record trong một PR; đi theo từng module và bắt đầu ở DTO của API mới. Lombok vẫn là phụ thuộc compile-time cần theo kịp mỗi lần nâng JDK (các bản Lombok cũ từng vỡ khi lên Java 16+ do strong encapsulation), nên càng ít chỗ phụ thuộc vào nó thì nâng cấp càng nhẹ.`,
  follow: ['Record có implement interface và có static factory method được không?', 'Vì sao @Data trên JPA entity gây StackOverflowError hoặc LazyInitializationException?', 'Bạn thêm builder cho record thế nào khi không dùng Lombok?'],
  tags: ['record', 'Lombok', 'DTO', 'value object', 'Java 16']
},
{
  id: 'modern-019',
  topic: 'modern',
  level: 'mid',
  q: 'Form đăng ký nhận chuỗi người dùng dán vào có khoảng trắng lạ, xuống dòng, và bạn cần sinh nội dung email có định dạng. Bạn dùng các String API từ Java 11 trở đi ({{strip}}, {{isBlank}}, {{lines}}, {{repeat}}, {{formatted}}...) thế nào, và {{strip()}} khác {{trim()}} ra sao?',
  a: `**Tóm tắt:** {{trim()}} chỉ cắt các ký tự có mã nhỏ hơn hoặc bằng U+0020 (space và ký tự điều khiển ASCII), còn {{strip()}} (Java 11) cắt mọi ký tự mà {{Character.isWhitespace}} coi là khoảng trắng, kể cả khoảng trắng Unicode như U+3000 hay U+2003. {{isBlank()}} kiểm tra chuỗi rỗng hoặc toàn khoảng trắng, {{lines()}} tách dòng thành Stream, {{repeat(n)}} lặp chuỗi, {{formatted(...)}} (Java 15) là {{String.format}} viết gọn. Lưu ý: cả {{strip}} lẫn {{trim}} đều **không** cắt non-breaking space U+00A0.

### Hiểu nhanh
Người dùng copy từ Word, Excel hay web thường kéo theo "khoảng trắng tàng hình": nhìn như dấu cách nhưng là ký tự khác. {{trim()}} chỉ biết dấu cách kiểu máy chữ cũ; {{strip()}} biết thêm các dấu cách của bảng mã Unicode. Giống bảo vệ chỉ nhận diện đồng phục cũ so với bảo vệ có danh sách đồng phục mới.

### Thuật ngữ
- **Whitespace Unicode**: các ký tự khoảng trắng ngoài space thường, ví dụ em space (U+2003), ideographic space (U+3000).
- **NBSP (U+00A0)**: dấu cách "không ngắt dòng", hay gặp khi copy từ HTML; {{Character.isWhitespace}} trả false cho nó.
- **Line terminator**: {{\\n}}, {{\\r}}, {{\\r\\n}}; {{lines()}} hiểu cả ba.

### Các API đáng nhớ
| API | Từ | Dùng để |
|---|---|---|
| {{isBlank()}} | 11 | validate input rỗng hoặc toàn khoảng trắng |
| {{strip()}}, {{stripLeading()}}, {{stripTrailing()}} | 11 | cắt khoảng trắng Unicode |
| {{lines()}} | 11 | tách dòng thành Stream, không tạo mảng lớn |
| {{repeat(n)}} | 11 | lặp chuỗi (kẻ đường, padding) |
| {{indent(n)}}, {{transform(f)}} | 12 | thụt lề từng dòng, áp hàm lên chuỗi |
| {{formatted(...)}}, {{stripIndent()}} | 15 | format gọn, xử lý text block |
| {{String.join}}, {{chars()}} | 8 | nối có dấu phân cách, duyệt ký tự |

### Ví dụ xử lý input từng bước
~~~java
String raw = "\\u3000 Nguyễn Văn A\\u00A0\\n";
raw.trim();        // vẫn còn U+3000 ở đầu (mã > U+0020) và NBSP ở cuối
raw.strip();       // cắt U+3000 và \\n, nhưng NBSP vẫn còn
String name = raw.replace('\\u00A0', ' ').strip();   // xử lý NBSP trước rồi mới strip
if (name.isBlank()) throw new IllegalArgumentException("Tên trống");

long nonEmpty = csvText.lines().filter(l -> !l.isBlank()).count(); // đếm dòng có dữ liệu
String line = "-".repeat(40);
String body = "Xin chào %s, đơn %d đã giao.".formatted(name, orderId);
~~~
1. {{replace('\\u00A0', ' ')}} đổi NBSP thành space thường. Vì sao phải làm tay: {{strip}} dựa trên {{isWhitespace}}, mà hàm này cố ý loại trừ các dấu cách "không ngắt".
2. {{strip()}} cắt ở hai đầu, còn khoảng trắng giữa chữ giữ nguyên; muốn gộp nhiều space liên tiếp thì dùng {{replaceAll("\\\\s+", " ")}} (lưu ý {{\\s}} mặc định chỉ khớp ASCII).
3. {{lines()}} trả Stream lazy, hợp khi xử lý chuỗi nhiều dòng mà không muốn {{split("\\n")}} tạo cả mảng.

### Lỗi hay gặp
1. **Dùng {{trim()}} cho dữ liệu copy từ Excel/web**: so sánh tên, email bị lệch, tạo bản ghi trùng.
2. **Nghĩ {{strip()}} xử lý được mọi thứ**: NBSP và zero-width space (U+200B) vẫn lọt; cần chuẩn hoá riêng.
3. **{{isEmpty()}} thay cho {{isBlank()}}**: chuỗi "   " lọt validate.
4. **{{String.format}}/{{formatted}} trong vòng lặp nóng**: chậm hơn nối chuỗi nhiều lần vì phải parse pattern; dùng cho log/thông báo, không dùng cho xử lý hàng triệu dòng.
5. **Phụ thuộc locale**: {{toLowerCase()}} không truyền {{Locale.ROOT}} có thể cho kết quả khác trên máy cấu hình tiếng Thổ Nhĩ Kỳ (chữ I).

### Trả lời miệng 1 phút
"trim chỉ cắt ký tự có mã tới U+0020, strip từ Java 11 cắt khoảng trắng Unicode theo Character.isWhitespace, nhưng cả hai đều không cắt NBSP nên tôi thay NBSP trước. Validate dùng isBlank thay vì isEmpty. Tách dòng dùng lines, kẻ đường dùng repeat, sinh nội dung dùng formatted hoặc text block. Với input người dùng, tôi chuẩn hoá ở một chỗ duy nhất trước khi lưu."

> Senior tip: đặt một hàm chuẩn hoá chung (thay NBSP, zero-width, {{strip}}, Unicode {{Normalizer.normalize(s, Form.NFC)}} cho tiếng Việt) và gọi ở biên nhận dữ liệu. Tiếng Việt có thể ở dạng dựng sẵn (NFC) hoặc tổ hợp (NFD, hay gặp khi copy từ macOS): hai chuỗi trông giống hệt nhưng {{equals}} trả false, gây trùng khách hàng khi tìm theo tên.`,
  follow: ['Vì sao Character.isWhitespace không coi NBSP là khoảng trắng?', 'NFC và NFD khác nhau thế nào, ảnh hưởng gì tới tìm kiếm tiếng Việt?', 'Khi nào dùng StringBuilder thay vì formatted?'],
  tags: ['String', 'strip', 'isBlank', 'Unicode', 'Java 11']
},
{
  id: 'modern-020',
  topic: 'modern',
  level: 'mid',
  q: 'Bạn cần tính ngày đến hạn "sau 1 tháng", số ngày quá hạn, và nhắc lịch "cùng giờ ngày mai" cho khách ở nhiều múi giờ. Dùng {{Period}}, {{Duration}}, {{ChronoUnit}} thế nào? Các bẫy cuối tháng, DST và định dạng {{YYYY}} là gì, và bạn test code phụ thuộc thời gian ra sao?',
  a: `**Tóm tắt:** {{Period}} đo khoảng thời gian **theo lịch** (năm, tháng, ngày), {{Duration}} đo **thời lượng chính xác** (giây, nano). Cộng tháng dùng {{plusMonths}}/{{Period}} (31/1 + 1 tháng = 29/2 năm nhuận, tự kẹp về ngày cuối tháng); đếm ngày dùng {{ChronoUnit.DAYS.between}}. "Cùng giờ ngày mai" ở vùng có DST phải dùng {{plusDays(1)}} trên {{ZonedDateTime}}, không phải cộng 24 giờ. Định dạng năm dùng {{yyyy}}, không dùng {{YYYY}} (năm theo tuần). Code phụ thuộc "bây giờ" nhận {{Clock}} qua constructor để test cố định thời gian.

### Hiểu nhanh
{{Period}} giống lịch treo tường: "sau 1 tháng" là lật sang trang tháng sau, tháng 2 ngắn thì dừng ở ngày cuối. {{Duration}} giống đồng hồ bấm giờ: đúng 86.400 giây, không quan tâm hôm đó có đổi giờ mùa hè hay không.

### Thuật ngữ
- **DST (Daylight Saving Time)**: giờ mùa hè, một số nước vặn đồng hồ lên/xuống 1 giờ, tạo ra ngày dài 23 hoặc 25 giờ. Việt Nam không có DST, nhưng khách ở Mỹ, châu Âu thì có.
- **ChronoUnit**: đơn vị thời gian ({{DAYS}}, {{MONTHS}}...), có {{between(a, b)}} đếm số đơn vị trọn vẹn.
- **Week-based year**: năm tính theo tuần ISO; vài ngày cuối tháng 12 có thể thuộc "năm tuần" sau.

### Cơ chế từng bước
~~~java
LocalDate.of(2024, 1, 31).plusMonths(1);   // 2024-02-29: kẹp về ngày cuối tháng
LocalDate.of(2024, 1, 31).plusMonths(1).plusMonths(1); // 2024-03-29, KHÔNG phải 31/3
LocalDate.of(2024, 1, 31).plusMonths(2);   // 2024-03-31

long overdue = ChronoUnit.DAYS.between(dueDate, today);   // số ngày trọn vẹn

ZonedDateTime ny = ZonedDateTime.of(2024, 3, 9, 12, 0, 0, 0, ZoneId.of("America/New_York"));
ny.plusDays(1);                    // 2024-03-10T12:00-04:00: cùng giờ trên đồng hồ
ny.plus(Duration.ofHours(24));     // 2024-03-10T13:00-04:00: ngày 10/3 chỉ dài 23 giờ
~~~
1. {{plusMonths}} giữ nguyên ngày nếu được; tháng đích không có ngày đó thì lấy ngày cuối tháng. Vì vậy cộng hai lần một tháng khác với cộng một lần hai tháng: lịch trả góp phải luôn tính từ **ngày gốc** ({{start.plusMonths(i)}}), không cộng dồn từ kỳ trước.
2. {{plusDays}} trên {{ZonedDateTime}} làm việc trên giờ địa phương rồi mới quy về offset mới; {{plus(Duration)}} cộng trên timeline tuyệt đối. Vì sao khác: ngày 10/3/2024 ở New York đồng hồ nhảy từ 2:00 lên 3:00.
3. Với hạn chót tính theo giờ (token hết hạn sau 24h), dùng {{Instant.plus(Duration)}}, vì đó là thời lượng thật.

### Bảng chọn
| Nhu cầu | Dùng |
|---|---|
| Sau N tháng/năm (hợp đồng, trả góp) | {{LocalDate.plusMonths}}, {{Period}} |
| Hết hạn sau N giờ/phút (token, OTP) | {{Instant.plus(Duration)}} |
| Đếm ngày giữa hai ngày | {{ChronoUnit.DAYS.between}} |
| Nhắc lịch theo giờ địa phương của khách | {{ZonedDateTime.plusDays}} với ZoneId của khách |

### Lỗi hay gặp
1. **{{YYYY}} trong pattern**: {{DateTimeFormatter.ofPattern("YYYY-MM-dd")}} in ngày 30/12/2024 thành "2025-12-30" vì {{Y}} là năm theo tuần. Dùng {{yyyy}} (hoặc {{uuuu}}).
2. **{{hh}} thay vì {{HH}}**: {{hh}} là giờ 1-12, thiếu AM/PM thì 14:00 thành 02:00.
3. **Gọi {{LocalDate.now()}} rải rác**: phụ thuộc múi giờ mặc định của server (container thường là UTC), test không cố định được.
4. **Dùng {{SimpleDateFormat}} static chung**: không thread-safe; {{DateTimeFormatter}} bất biến nên dùng chung thoải mái.
5. **{{Period.between(a, b).getDays()}} để lấy tổng số ngày**: nó chỉ trả phần "ngày" sau khi đã trừ tháng (1 tháng 3 ngày thì ra 3).

### Test với Clock
~~~java
class DueService {
    private final Clock clock;                        // inject, không gọi now() trực tiếp
    DueService(Clock clock) { this.clock = clock; }
    boolean isOverdue(LocalDate due) { return LocalDate.now(clock).isAfter(due); }
}
var fixed = Clock.fixed(Instant.parse("2024-12-31T17:30:00Z"), ZoneId.of("Asia/Ho_Chi_Minh"));
new DueService(fixed).isOverdue(LocalDate.of(2024, 12, 31)); // true: ở VN đã là 1/1/2025
~~~

### Trả lời miệng 1 phút
"Period cho khoảng theo lịch như tháng, năm; Duration cho thời lượng chính xác như token 24 giờ; đếm ngày dùng ChronoUnit.DAYS.between. Cộng tháng sẽ kẹp về cuối tháng nên lịch trả góp luôn tính từ ngày gốc. Nhắc lịch cùng giờ ngày mai thì plusDays trên ZonedDateTime theo múi giờ khách, vì ngày đổi DST chỉ có 23 hoặc 25 giờ. Pattern dùng yyyy chứ không YYYY, và tôi inject Clock để test."

> Senior tip: bug {{YYYY}} thường chỉ lộ đúng tuần cuối tháng 12, khi cả team nghỉ lễ; thêm unit test với ngày 29-31/12 cho mọi pattern ngày tháng. Với Spring, khai báo một bean {{Clock}} ({{Clock.systemUTC()}}) và cho mọi service nhận qua constructor; test chỉ việc thay bằng {{Clock.fixed}}.`,
  follow: ['Lịch trả góp ngày 31 hàng tháng bạn tính thế nào cho đúng?', 'Instant, LocalDateTime và ZonedDateTime nên dùng ở tầng nào?', 'Khi một giờ địa phương không tồn tại do DST (2:30 sáng), ZonedDateTime xử lý ra sao?'],
  tags: ['java.time', 'Period', 'Duration', 'DST', 'Clock']
},
{
  id: 'modern-021',
  topic: 'modern',
  level: 'mid',
  q: 'Bạn cần truyền logic tuỳ biến (kiểm tra, chuyển đổi, tạo object) vào một method dùng chung. Khi nào dùng sẵn {{Function}}, {{Predicate}}, {{Supplier}}, {{Consumer}}, {{UnaryOperator}}, khi nào dùng bản primitive như {{IntPredicate}}, và ghép chúng bằng {{andThen}}, {{compose}}, {{Predicate.not}} thế nào? Khi nào nên tự định nghĩa interface?',
  a: `**Tóm tắt:** Gói {{java.util.function}} có sẵn các "hình dạng" hàm phổ biến: {{Function<T, R>}} (T vào, R ra), {{Predicate<T>}} (T vào, boolean ra), {{Supplier<T>}} (không vào, T ra), {{Consumer<T>}} (T vào, không ra), {{UnaryOperator<T>}}/{{BinaryOperator<T>}} (cùng kiểu vào ra). Bản primitive ({{IntPredicate}}, {{ToLongFunction}}...) tránh boxing ở code nóng. Ghép hàm bằng {{andThen}}/{{compose}}, ghép điều kiện bằng {{and}}/{{or}}/{{negate}}/{{Predicate.not}} (Java 11). Tự định nghĩa {{@FunctionalInterface}} khi cần **tên nghiệp vụ rõ nghĩa**, cần ném checked exception hoặc có nhiều hơn 2 tham số.

### Hiểu nhanh
Functional interface giống ổ cắm điện chuẩn: {{Predicate}} là ổ "cắm vào cho kết quả đúng/sai", {{Supplier}} là ổ "không cần đưa gì, trả ra một thứ". Lambda là phích cắm. Dùng ổ chuẩn thì phích nào cũng cắm được, không phải tự chế ổ riêng cho từng thiết bị.

### Thuật ngữ
- **Functional interface**: interface có đúng một method abstract, lambda có thể "đóng vai" nó.
- **Boxing**: đổi {{int}} thành {{Integer}} (object trên heap); xảy ra khi dùng {{Function<Integer, Integer>}}.
- **Composition**: ghép hàm nhỏ thành hàm lớn mà không viết lại logic.

### Bảng chọn
| Hình dạng | Interface | Ví dụ |
|---|---|---|
| T vào, R ra | {{Function<T, R>}} | {{Order::total}} |
| T vào, boolean ra | {{Predicate<T>}} | {{o -> o.paid()}} |
| không vào, T ra | {{Supplier<T>}} | {{() -> new ArrayList<>()}} |
| T vào, không ra | {{Consumer<T>}} | {{log::info}} |
| T, U vào, R ra | {{BiFunction<T, U, R>}} | {{(a, b) -> a.add(b)}} |
| T vào, T ra | {{UnaryOperator<T>}} | {{String::strip}} |
| int vào, boolean ra | {{IntPredicate}} | {{n -> n > 0}} (không boxing) |

### Ghép hàm từng bước
~~~java
Function<String, String> clean = String::strip;
Function<String, String> lower = s -> s.toLowerCase(Locale.ROOT);
Function<String, String> normalize = clean.andThen(lower);  // strip trước, lower sau
// compose ngược thứ tự: lower.compose(clean) cũng là strip trước rồi lower

Predicate<Order> paid = Order::paid;
Predicate<Order> bigPaid = paid.and(o -> o.totalCents() > 10_000_000);
List<String> nonBlank = names.stream()
        .filter(Predicate.not(String::isBlank))   // gọn hơn s -> !s.isBlank()
        .toList();

// Supplier: chỉ tạo giá trị khi thực sự cần (lazy)
String v = cache.getOrDefault(key, null);
String r = Optional.ofNullable(v).orElseGet(() -> loadFromDb(key));
~~~
1. {{f.andThen(g)}} nghĩa là "chạy f, lấy kết quả đưa cho g"; {{f.compose(g)}} là "chạy g trước rồi f". Vì sao cần nhớ: đọc nhầm thứ tự thì strip/lower đổi chỗ, thường vô hại, nhưng với "validate rồi mã hoá" thì sai nghiêm trọng.
2. {{Predicate.not(String::isBlank)}} tồn tại vì method reference không thể viết {{!String::isBlank}}.
3. {{Supplier}} trì hoãn việc tính toán: {{orElseGet(supplier)}} chỉ gọi DB khi không có giá trị, khác {{orElse(loadFromDb(key))}} luôn gọi.

### Khi nào tự định nghĩa interface
~~~java
@FunctionalInterface
interface FeeCalculator {                  // tên nghiệp vụ rõ hơn BiFunction<Order, Customer, BigDecimal>
    BigDecimal fee(Order order, Customer customer);
}
~~~
- Tên nói lên ý nghĩa, Javadoc được, IDE gợi ý tốt.
- Cần ném checked exception (các interface chuẩn không khai báo {{throws}}).
- Có từ 3 tham số trở lên (JDK không có {{TriFunction}}).

### Lỗi hay gặp
1. **{{Function<Integer, Integer>}} trong vòng lặp hàng triệu lần**: boxing tạo rác; dùng {{IntUnaryOperator}}.
2. **Chữ ký method nhận {{BiFunction<Map<String, Object>, List<Long>, Optional<Result>>}}**: không ai đọc nổi; đặt interface riêng.
3. **Lambda có trạng thái** (đếm số lần gọi bên trong): khó test, sai khi chạy song song.
4. **Nhầm thứ tự {{andThen}}/{{compose}}**.

### Trả lời miệng 1 phút
"Tôi chọn theo hình dạng: Function cho biến đổi, Predicate cho điều kiện, Supplier để tạo lười, Consumer cho hành động, UnaryOperator khi cùng kiểu vào ra. Code nóng với số nguyên thì dùng bản primitive để tránh boxing. Ghép bằng andThen, compose, and, or, Predicate.not. Khi chữ ký generic quá dài, cần checked exception hoặc nhiều tham số, tôi tự định nghĩa @FunctionalInterface có tên nghiệp vụ."

> Senior tip: trong code nghiệp vụ, interface tự đặt tên như {{FeeCalculator}}, {{DiscountRule}} giúp người mới đọc hiểu ngay và dễ biến thành bean Spring (mỗi rule một class) khi logic lớn dần. Interface chuẩn của JDK hợp nhất ở tầng tiện ích và trong stream pipeline.`,
  follow: ['Vì sao JDK không có TriFunction?', 'Lambda và method reference có khác nhau về hiệu năng không?', 'Bạn biến các rule viết bằng Predicate thành cấu hình được thế nào?'],
  tags: ['functional interface', 'Function', 'Predicate', 'Supplier', 'composition']
},
{
  id: 'modern-022',
  topic: 'modern',
  level: 'senior',
  q: 'Bạn có nhiều loại phương thức thanh toán (thẻ, ví, chuyển khoản). Khi nào bạn đặt logic vào method ghi đè trong từng class (đa hình), khi nào dùng sealed interface + record + {{switch}} pattern matching (Java 21) bên ngoài? Trade-off khi thêm loại mới và thêm thao tác mới là gì?',
  a: `**Tóm tắt:** Đây là bài toán kinh điển "thêm loại hay thêm thao tác". **Đa hình** (mỗi class tự cài method) dễ **thêm loại mới** (thêm class, không sửa code cũ) nhưng mỗi khi **thêm thao tác** phải sửa mọi class. **Sealed + switch pattern matching** thì ngược lại: thêm thao tác chỉ là viết thêm một method có {{switch}}, còn thêm loại mới bắt compiler chỉ ra mọi {{switch}} cần sửa. Chọn đa hình cho hành vi gắn chặt với đối tượng và tập loại mở; chọn sealed + switch khi tập loại **đóng, ổn định** và có nhiều thao tác khác nhau nằm ở các tầng khác nhau (tính phí, hiển thị, báo cáo, mapping).

### Hiểu nhanh
Đa hình giống mỗi nhân viên tự biết làm việc của mình: tuyển thêm người dễ, nhưng thêm một loại công việc mới thì phải đào tạo lại từng người. Sealed + switch giống bảng phân công treo tường: thêm một loại công việc chỉ cần thêm một bảng; tuyển thêm người thì mọi bảng phải có thêm một dòng, và compiler là người quản lý kiểm tra không bảng nào bị sót.

### Thuật ngữ
- **Sealed interface**: interface chỉ cho phép một danh sách class xác định implement ({{permits}}), từ Java 17.
- **Pattern matching for switch**: {{switch}} theo kiểu và tách dữ liệu ra biến, chính thức từ Java 21 (JEP 441).
- **Exhaustive**: switch phủ mọi trường hợp; với sealed type, compiler kiểm tra và không cần {{default}}.

### Hai cách viết
~~~java
// Cách 1: đa hình
interface Payment { BigDecimal fee(); }
record Card(BigDecimal amount) implements Payment {
    public BigDecimal fee() { return amount.multiply(new BigDecimal("0.02")); }
}
// Cách 2: sealed + record + switch (Java 21)
sealed interface Pay permits CardPay, WalletPay, BankPay {}
record CardPay(BigDecimal amount, String bin) implements Pay {}
record WalletPay(BigDecimal amount, String provider) implements Pay {}
record BankPay(BigDecimal amount) implements Pay {}

static BigDecimal fee(Pay p) {
    return switch (p) {                    // không có default: thiếu case là lỗi compile
        case CardPay c   -> c.amount().multiply(new BigDecimal("0.02"));
        case WalletPay w when w.provider().equals("MOMO") -> BigDecimal.ZERO;
        case WalletPay w -> new BigDecimal("1000");
        case BankPay b   -> new BigDecimal("3300");
    };
}
~~~

### Trade-off (từng bước khi hệ thống lớn lên)
1. **Thêm loại "Trả góp"**: đa hình chỉ cần class mới. Sealed: thêm vào {{permits}}, compiler báo lỗi ở mọi {{switch}} chưa có case mới. Vì sao đây là ưu điểm: bạn không thể quên sửa chỗ tính phí hay báo cáo.
2. **Thêm thao tác "xuất đối soát"**: đa hình phải thêm method vào interface và sửa mọi class (và class domain dính phụ thuộc vào tầng báo cáo). Sealed: viết một method mới ở module báo cáo, domain record không đổi.
3. **Plugin bên thứ ba thêm loại**: chỉ đa hình làm được; sealed cấm class ngoài danh sách.

| Tiêu chí | Đa hình | Sealed + switch |
|---|---|---|
| Thêm loại mới | dễ, không sửa code cũ | phải sửa mọi switch (compiler nhắc) |
| Thêm thao tác mới | sửa mọi class | thêm một method |
| Tập loại | mở, có plugin | đóng, ổn định |
| Dữ liệu và hành vi | gói chung | tách: record là dữ liệu, logic ở nơi dùng |

### Lỗi hay gặp
1. **Thêm {{default}} vào switch trên sealed type**: mất kiểm tra exhaustive, loại mới lọt vào nhánh default âm thầm.
2. **Thứ tự case sai**: case tổng quát ({{case WalletPay w}}) đặt trước case có guard cùng kiểu thì compiler báo lỗi vì case sau không bao giờ chạy tới (dominance).
3. **Dùng switch theo kiểu cho tập loại mở** (class không sealed): bắt buộc có {{default}}, mất lợi ích chính.
4. **Rải switch giống nhau ở 10 nơi**: nếu cùng một logic lặp lại, đó là dấu hiệu nên đưa về method của chính type.

### Trả lời miệng 1 phút
"Đa hình dễ thêm loại mới nhưng thêm thao tác thì phải sửa mọi class. Sealed cộng record cộng switch Java 21 thì ngược lại: thêm thao tác là một method mới, thêm loại thì compiler chỉ ra mọi switch cần sửa nhờ kiểm tra exhaustive. Tập loại đóng như phương thức thanh toán, trạng thái, kết quả xử lý mà nhiều tầng cần xử lý khác nhau thì tôi chọn sealed; tập mở có plugin thì chọn đa hình. Và tôi không đặt default trên switch của sealed type."

> Senior tip: hai cách không loại trừ nhau. Tôi hay để hành vi cốt lõi, bất biến của domain ở method trong type (ví dụ {{amount()}}), còn các thao tác "của tầng khác" như mapping DTO, hiển thị, đối soát thì viết bằng switch ở tầng đó. Nhớ rằng sealed chỉ có giá trị khi mọi module được biên dịch lại cùng nhau; với hợp đồng API giữa các service, vẫn cần xử lý giá trị lạ ở runtime.`,
  follow: ['Vì sao không nên đặt default trong switch trên sealed interface?', 'Sealed interface có dùng được qua ranh giới module/thư viện không?', 'Visitor pattern còn cần thiết khi đã có Java 21 không?'],
  tags: ['sealed', 'pattern matching', 'switch', 'polymorphism', 'Java 21'],
  refs: [
    { type: 'doc', title: 'JEP 441: Pattern Matching for switch', url: 'https://openjdk.org/jeps/441' },
    { type: 'doc', title: 'JEP 409: Sealed Classes', url: 'https://openjdk.org/jeps/409' }
  ]
},
{
  id: 'modern-023',
  topic: 'modern',
  level: 'senior',
  q: 'Trong stream, bạn gọi một method ném checked exception ({{Files.readString}}, gọi API trả {{IOException}}) và code không biên dịch. Bạn xử lý thế nào: bọc unchecked, sneaky throw, hay gom lỗi thành kết quả? Khi xử lý 10.000 file mà vài file lỗi thì nên làm gì?',
  a: `**Tóm tắt:** Các functional interface chuẩn ({{Function}}, {{Consumer}}...) không khai báo {{throws}}, nên lambda không được ném checked exception. Có ba hướng: (1) **bọc thành unchecked** ({{UncheckedIOException}}) khi một lỗi nghĩa là dừng cả lô; (2) **biến lỗi thành dữ liệu** (một record kết quả thành công/thất bại) khi cần xử lý tiếp các phần tử còn lại và báo cáo phần lỗi; (3) **quay về vòng for** khi logic lỗi phức tạp. Tránh "sneaky throw" vì nó lừa compiler và làm caller không biết phải bắt lỗi gì.

### Hiểu nhanh
Stream như dây chuyền đóng gói: nếu một hộp hỏng, có hai chính sách. "Dừng cả dây chuyền" (ném exception) hợp khi hộp hỏng nghĩa là cả lô có vấn đề. "Dán nhãn lỗi rồi để hộp đi tiếp" (lỗi thành dữ liệu) hợp khi bạn muốn đóng gói hết hộp tốt và gom hộp hỏng ra một thùng riêng để xem sau.

### Thuật ngữ
- **Checked exception**: exception compiler bắt phải khai báo hoặc bắt ({{IOException}}, {{SQLException}}).
- **UncheckedIOException**: lớp unchecked có sẵn từ Java 8 để bọc {{IOException}}.
- **Sneaky throw**: mẹo dùng generic để ném checked exception mà compiler không biết.

### Cách 1: bọc unchecked (fail fast)
~~~java
List<String> contents = paths.stream()
        .map(p -> {
            try {
                return Files.readString(p);
            } catch (IOException e) {
                throw new UncheckedIOException("Không đọc được " + p, e); // giữ cause và tên file
            }
        })
        .toList();
~~~
Từng bước: phần tử lỗi ném exception, stream dừng ngay, các phần tử sau không chạy. Vì sao hợp lý: ví dụ nạp file cấu hình, thiếu một file thì cả ứng dụng không nên khởi động.

### Cách 2: lỗi thành dữ liệu (xử lý tiếp)
~~~java
sealed interface Outcome permits Ok, Failed {}
record Ok(Path path, String content) implements Outcome {}
record Failed(Path path, String error) implements Outcome {}

static Outcome read(Path p) {
    try { return new Ok(p, Files.readString(p)); }
    catch (IOException e) { return new Failed(p, e.toString()); }
}
Map<Boolean, List<Outcome>> parts = paths.stream()
        .map(Main::read)
        .collect(Collectors.partitioningBy(o -> o instanceof Ok));
// parts.get(true): xử lý tiếp; parts.get(false): ghi báo cáo, retry, gửi cảnh báo
~~~
Với 10.000 file mà vài file lỗi: đi theo cách này, xử lý 9.99x file tốt, xuất danh sách lỗi kèm lý do, và đặt ngưỡng (ví dụ lỗi trên 1% thì đánh dấu job FAILED) để không âm thầm bỏ qua sự cố lớn.

### So sánh
| Cách | Ưu | Nhược | Dùng khi |
|---|---|---|---|
| Bọc unchecked | đơn giản, giữ stack trace | dừng cả lô | một lỗi = cả lô hỏng |
| Lỗi thành dữ liệu | xử lý được phần còn lại, có báo cáo | thêm kiểu dữ liệu | batch, import, đối soát |
| Vòng for + try/catch | rõ ràng, có retry, có continue | dài hơn | logic lỗi phức tạp |
| Sneaky throw | ngắn | caller không biết phải bắt gì | hầu như không nên |

### Lỗi hay gặp
1. **Nuốt lỗi**: bắt {{IOException}} rồi {{return null}}, sau đó {{filter(Objects::nonNull)}}: dữ liệu mất mà không ai biết.
2. **Bọc nhưng mất nguyên nhân**: {{new RuntimeException(e.getMessage())}} làm mất stack trace gốc; luôn truyền {{e}} làm cause.
3. **Bắt exception ở ngoài stream mong lấy phần đã xử lý**: khi stream ném, kết quả của {{toList()}} không tồn tại; phần đã chạy (nếu có side-effect) dở dang.
4. **Parallel stream + exception**: các phần tử khác có thể vẫn đang chạy hoặc đã chạy khi exception nổi lên; không giả định "chưa có gì xảy ra".

### Trả lời miệng 1 phút
"Function và Consumer không khai báo throws nên lambda không ném được checked exception. Nếu một lỗi nghĩa là dừng cả lô, tôi bọc thành UncheckedIOException và giữ cause. Nếu là batch nhiều file, tôi biến lỗi thành dữ liệu bằng record Ok/Failed, partitioningBy để xử lý phần tốt và báo cáo phần lỗi, kèm ngưỡng tỉ lệ lỗi. Logic phức tạp có retry thì tôi dùng vòng for. Tôi tránh sneaky throw."

> Senior tip: trong job import thật, "lỗi thành dữ liệu" còn giúp idempotent và chạy lại được: lưu danh sách {{Failed}} vào bảng hoặc file, lần sau chỉ chạy lại những phần tử đó thay vì chạy lại 10.000 file. Đặt metric số lỗi theo loại để phát hiện khi đối tác đổi định dạng file.`,
  follow: ['Vì sao sneaky throw bị coi là nguy hiểm?', 'Exception trong parallel stream được ném ra thế nào?', 'Bạn thiết kế retry cho phần tử lỗi trong batch ra sao?'],
  tags: ['checked exception', 'lambda', 'Stream', 'UncheckedIOException', 'error handling']
},
{
  id: 'modern-024',
  topic: 'modern',
  level: 'lead',
  q: 'Là tech lead, bạn đặt chính sách phiên bản Java cho hơn 20 service: chạy JDK nào (LTS hay bản 6 tháng), bản phân phối nào (Temurin, Corretto, Oracle...), có cho dùng preview feature không, và nâng cấp theo nhịp nào?',
  a: `**Tóm tắt:** Java ra bản mới mỗi 6 tháng (từ Java 10, năm 2018), và cứ 2 năm có một bản **LTS** (17 năm 2021, 21 năm 2023, 25 năm 2025). Production nên chạy **LTS** từ một bản phân phối OpenJDK có cam kết cập nhật bảo mật (Eclipse Temurin, Amazon Corretto, Microsoft Build of OpenJDK, Azul Zulu, hoặc Oracle JDK nếu chấp nhận điều khoản license của Oracle). **Không dùng preview feature** trong code production vì chúng có thể đổi hoặc bị bỏ, và class biên dịch với preview chỉ chạy trên đúng bản JDK đó. Nâng cấp theo nhịp: áp bản vá (patch) hằng quý, lên LTS mới trong khoảng 6-12 tháng sau khi phát hành khi framework chính đã hỗ trợ.

### Hiểu nhanh
LTS giống mẫu xe được hãng bảo hành nhiều năm; các bản 6 tháng giống xe trưng bày đời mới, chỉ được bảo dưỡng tới khi đời sau ra. Preview feature giống tính năng "thử nghiệm" trên xe trưng bày: lái thử thoải mái, nhưng không chở khách thật bằng nó.

### Thuật ngữ
- **LTS (Long-Term Support)**: bản được vendor vá lỗi, bảo mật nhiều năm.
- **Bản phân phối (distribution)**: bản build của OpenJDK do một nhà cung cấp đóng gói và vá; mã nguồn gần như giống nhau, khác ở thời hạn hỗ trợ, license và kênh hỗ trợ trả phí.
- **Preview feature**: tính năng ngôn ngữ/API hoàn chỉnh nhưng chưa chốt, phải bật {{--enable-preview}} khi biên dịch và khi chạy.
- **CPU (Critical Patch Update)**: đợt vá bảo mật theo quý (tháng 1, 4, 7, 10).

### Chính sách đề xuất (từng bước)
1. **Chuẩn hoá một LTS mục tiêu** cho toàn bộ service (ví dụ 21), có danh sách ngoại lệ có thời hạn. Vì sao: một base image, một bộ tuning GC, một quy trình vá.
2. **Chọn một bản phân phối** và dùng thống nhất trong base image Docker, CI và máy dev. Chạy trên AWS thường chọn Corretto; trung lập thì Temurin. Ghi rõ lý do license nếu dùng Oracle JDK.
3. **Vá theo quý**: base image tự rebuild khi có bản patch mới (ví dụ 21.0.x), pipeline chạy test rồi rollout dần. Vì sao: lỗ hổng TLS/crypto trong JDK là có thật, chậm vá là rủi ro.
4. **Lên LTS mới theo đợt**: chờ Spring Boot, Hibernate, agent APM, build tool hỗ trợ chính thức; thử trên 1-2 service ít rủi ro, đo GC và latency, rồi mở rộng. Có thể build bằng JDK mới nhưng giữ {{--release}} cũ trong giai đoạn chuyển tiếp.
5. **Preview**: cho phép trong spike, công cụ nội bộ, code thử; cấm trong code production bằng kiểm tra trong build (không có {{--enable-preview}} trong cấu hình).

~~~bash
# Kiểm tra JDK đang chạy trong container (cột vendor, version)
java -XshowSettings:properties -version 2>&1 | grep -E "java.vendor|java.version"
# Biên dịch nhắm đích LTS bất kể JDK dùng để build
javac --release 21 -d out $(find src -name "*.java")
~~~

### Bảng trade-off
| Lựa chọn | Lợi | Rủi ro |
|---|---|---|
| Chỉ dùng LTS | ổn định, hệ sinh thái hỗ trợ | chậm có tính năng mới |
| Theo bản 6 tháng | có tính năng, cải tiến GC sớm | phải nâng cấp mỗi 6 tháng, hết hỗ trợ nhanh |
| Dùng preview | thử tính năng mới | API đổi, bị khoá vào đúng bản JDK |
| Nhiều vendor khác nhau | team tự chọn | khó vá đồng bộ, khó tái hiện lỗi |

### Lỗi hay gặp
1. **Mỗi service một JDK, một vendor**: vá bảo mật không đồng bộ, bug chỉ tái hiện trên một máy.
2. **Image dùng tag trôi ({{latest}})**: sáng mai build ra JDK khác, hành vi GC hoặc TLS đổi mà không ai biết. Ghim version, cập nhật có chủ đích.
3. **Bật preview "cho vui" trong service production**: lần nâng JDK sau, code không biên dịch nữa.
4. **Quên đồng bộ JDK ở CI và runtime**: test xanh trên 21 nhưng production chạy 17, hoặc ngược lại.
5. **Bỏ qua license**: dùng Oracle JDK mà không đọc điều khoản, tới khi audit mới phát hiện.

### Trả lời miệng 1 phút
"Production tôi chạy LTS, hiện là 21 hoặc 25, từ một bản phân phối thống nhất như Temurin hoặc Corretto, ghim version trong base image và vá theo quý. Không dùng preview trong production vì nó có thể đổi và class bị khoá vào đúng bản JDK đó. Lên LTS mới theo đợt sau khi Spring Boot và các agent hỗ trợ, thử trên vài service trước, đo GC và latency rồi mở rộng."

> Senior tip: đặt một "golden base image" cho Java do platform team sở hữu, kèm dashboard đếm số service theo phiên bản JDK; chỉ một biểu đồ đó đã đủ để thuyết phục quản lý dành thời gian nâng cấp. Khi lên LTS mới, lợi ích hay thấy nhất không phải cú pháp mà là GC và hiệu năng tốt hơn với cùng cấu hình máy.`,
  follow: ['Vì sao class biên dịch với --enable-preview không chạy được trên JDK khác?', 'javac --release khác -source/-target thế nào?', 'Bạn thuyết phục quản lý dành thời gian nâng LTS thế nào?'],
  tags: ['LTS', 'JDK', 'preview feature', 'upgrade', 'governance']
},
{
  id: 'collections-027',
  topic: 'collections',
  level: 'senior',
  q: 'Key mutable trong HashMap/HashSet làm "mất" phần tử: cơ chế và cách phòng tránh?',
  a: `**Tóm tắt:** {{HashMap}} (bảng băm ánh xạ key→value) và {{HashSet}} (tập hợp không trùng, dùng {{HashMap}} bên trong) tìm phần tử bằng {{hashCode()}} để chọn bucket (ngăn) tại thời điểm {{put}}/{{add}}. Nếu bạn dùng key mutable (có thể thay đổi) rồi sửa một field tham gia {{hashCode}}/{{equals}} sau khi đã đưa vào, {{get}}/{{contains}}/{{remove}} sẽ tính hash mới, tìm sang bucket khác và "không thấy" entry cũ - dù entry vẫn còn nằm trong map (gây bug logic, thậm chí leak bộ nhớ). Cách phòng tránh đơn giản nhất: chỉ dùng key immutable.

### Cái gì - vì sao cần - hoạt động thế nào (từng bước)
- **Bước 1 - put:** {{map.put(key, value)}} gọi {{key.hashCode()}}, tính index bucket, rồi lưu entry (key, value) vào bucket đó. Ví dụ key có {{hashCode() = 42}} → vào bucket 42.
- **Bước 2 - mutate (sai lầm):** bạn sửa field của key (ví dụ {{key.setName("X")}}) và field đó được dùng trong {{hashCode}}. Bây giờ {{key.hashCode()}} có thể trả về {{99}}. Nhưng entry cũ **vẫn nằm im ở bucket 42** - {{HashMap}} không được thông báo về thay đổi này.
- **Bước 3 - get/remove:** {{map.get(key)}} tính lại hash → {{99}}, tìm trong bucket 99 → không có gì → trả {{null}}. Entry ở bucket 42 trở thành "mồ côi": không truy cập được bằng key, {{remove(key)}} cũng không xoá được nó. {{size()}} vẫn đếm nó; lặp {{entrySet()}} có thể vẫn thấy nó.
- **{{HashSet}}:** bản chất là {{HashMap<E, PRESENT>}}, nên y hệt vấn đề trên.

~~~java
import java.util.*;

class BadKey {            // mutable: có setter làm đổi hashCode
    String name;
    BadKey(String n) { this.name = n; }
    public int hashCode() { return Objects.hash(name); }
    public boolean equals(Object o) {
        return o instanceof BadKey k && Objects.equals(name, k.name);
    }
}

Map<BadKey, String> map = new HashMap<>();
BadKey k = new BadKey("A");
map.put(k, "value");          // entry vào bucket theo hash("A")
k.name = "B";                 // hashCode đổi -> hash("B")
System.out.println(map.get(k));    // null  (tìm bucket hash("B"))
System.out.println(map.size());    // 1     (entry mồ côi vẫn còn)
// Muốn sửa an toàn: remove TRƯỚC khi đổi field, rồi put lại
~~~

### Ví dụ đời thực (production)
Giả định một service cache quyền truy cập trong bộ nhớ: {{HashMap<UserKey, Permissions>}} với ~200.000 user, ~5.000 QPS kiểm tra quyền. {{UserKey}} ban đầu có {{department}} (phòng ban) tham gia {{hashCode}}/{{equals}}. Khi user chuyển phòng ban, luồng đồng bộ HR cập nhật {{userKey.setDepartment("Sales")}} trên chính object key đang nằm trong map (do giữ tham chiếu). Sau đó kiểm tra quyền {{map.get(userKey)}} trả {{null}} → hệ thống coi user "không có quyền", trả 403 hàng loạt cho ~300 request/phút của nhóm user chuyển phòng. Entry cũ vẫn chiếm bộ nhớ (không {{get}}/không {{remove}} được bằng key đã đổi), map phình dần ~15% sau vài tuần. Điều tra: dump heap thấy nhiều entry key trùng "ý nghĩa" nhưng hash rải rác; tái hiện bằng test mutate-key. Cách sửa: đổi {{UserKey}} thành một {{record UserKey(String userId)}} (immutable, chỉ dùng id ổn định, không dùng {{department}}); luồng HR khi đổi phòng ban thì {{remove}} key cũ rồi {{put}} key/permission mới. Kết quả: hết lỗi 403 giả, kích thước map ổn định.

### Khi nào dùng / không dùng
| Tình huống | Khuyến nghị |
|---|---|
| Key tra cứu trong {{HashMap}}/{{HashSet}} | Chỉ dùng immutable: {{String}}, {{Integer}}, {{Long}}, {{UUID}}, {{record}} có component immutable |
| JPA entity làm key | Rất cẩn thận: id tự sinh null trước persist, business key có thể đổi; thường tránh dùng entity làm key |
| Bắt buộc phải đổi key | {{remove()}} bằng trạng thái cũ → sửa field → {{put()}} lại. Nếu đã sửa rồi mới nhớ, {{remove(key)}} với trạng thái mới sẽ không tìm thấy |

### Pitfall production
- **JPA entity:** {{hashCode}} dùng id {{@GeneratedValue}} → id {{null}} khi transient; sau {{persist}} id có giá trị, hash đổi, entity "mất" khỏi {{HashSet}}. Dùng business key ổn định hoặc hash hằng theo class.
- **{{TreeMap}}/{{TreeSet}}:** cũng gặp vấn đề tương tự nếu thuộc tính dùng để so sánh bị đổi (cây mất thứ tự), dù cơ chế không phải bucket hash.
- **Nhầm rằng entry bị xoá:** entry không bị xoá - nó chỉ nằm sai bucket. Đây là leak logic khó phát hiện vì không ném exception.

### Trả lời mẫu khi phỏng vấn
"HashMap định vị phần tử bằng hashCode của key tại thời điểm put: nó tính hash, chọn bucket và lưu entry vào đó. Nếu key là object mutable và mình sửa một field tham gia hashCode hoặc equals sau khi put, thì hashCode mới sẽ khác, nên khi gọi get hay remove HashMap lại tính hash mới và tìm ở bucket khác - kết quả là trả về null dù entry cũ vẫn đang nằm trong map. Đây là kiểu bug rất khó chịu vì không có exception, phần tử chỉ âm thầm mất tích và còn gây leak bộ nhớ. Cách phòng tránh chuẩn là chỉ dùng key immutable như String, số, hoặc record với component immutable. Với JPA entity thì càng phải cẩn thận vì id tự sinh thay đổi sau khi persist, nên thường tránh dùng entity làm key hoặc dùng business key ổn định. Nếu thực sự phải thay đổi key, nguyên tắc là remove trước khi sửa, sửa xong mới put lại."

> Senior tip: coi đây là luật khi review: "mọi key đưa vào {{HashMap}}/{{HashSet}} phải immutable". Nếu thấy setter trên class dùng làm key, đó là code smell. Với entity, thêm test: {{set.add(entity); persist; assert set.contains(entity);}} - test này lật tẩy bug hashCode phụ thuộc id.`,
  follow: ['HashSet ảnh hưởng thế nào?', 'Tại sao entry vẫn tồn tại nhưng không tìm thấy?', 'JPA entity làm key có cạm bẫy gì?'],
  tags: ['HashMap', 'HashSet', 'mutable key']
},
{
  id: 'collections-028',
  topic: 'collections',
  level: 'lead',
  q: 'Chọn cấu trúc cho cache in-memory 1 triệu entry: HashMap vs ConcurrentHashMap vs LinkedHashMap(LRU) vs Caffeine. Trade-off và footprint?',
  a: `**Tóm tắt:** Khi thiết kế cache in-memory cần cân nhắc thread-safety (an toàn đồng bộ), chính sách loại bỏ (eviction) như LRU/W-TinyLFU, giới hạn dung lượng, TTL/refresh, và chi phí bộ nhớ (object overhead). Với cache production hiện nay, thư viện {{Caffeine}} thường là lựa chọn thực tế nhất vì đã xử lý nhiều cạm bẫy (eviction hiệu quả, tránh cache stampede, thống kê). Tuy nhiên không phải lúc nào cũng cần dùng thư viện - cần chọn đúng theo yêu cầu.

### So sánh
| Cấu trúc | Thread-safe | Eviction tự động | Ghi chú |
|---|---|---|---|
| {{HashMap}} | Không | Không | Chỉ dùng single-thread. Không phù hợp đa luồng. |
| {{ConcurrentHashMap}} | Có (concurrent) | Không tự động | Đọc/ghi đồng thời tốt, khóa mịn. Chỉ là map, không có chính sách loại bỏ theo dung lượng/thời gian. |
| {{LinkedHashMap}} ({{accessOrder}} = {{true}}) + {{removeEldestEntry()}} | Không | Có thể làm LRU đơn giản (theo thứ tự truy cập) | Dễ cài, nhưng toàn bộ map không thread-safe; eviction diễn ra đồng bộ khi put và dễ gây hiệu ứng phụ; không có TTL/refresh/statistics. |
| {{Caffeine}} | Có | Có (LRU, W-TinyLFU, TTL, tối đa kích thước, v.v.) | Thư viện ngoài JDK. Async eviction, xử lý tốt cache stampede, theo dõi thống kê, hiệu quả bộ nhớ cao hơn nhiều so với tự triển khai đơn giản. |

### Khi nào chọn
- **Chỉ cần map đồng thời, không giới hạn dung lượng**: {{ConcurrentHashMap}}.
- **Cần LRU đơn giản, single-thread hoặc tự đồng bộ hóa**: {{LinkedHashMap}} với {{removeEldestEntry()}} (chỉ phù hợp trường hợp rất đơn giản).
- **Cần cache production đa luồng, giới hạn dung lượng, eviction hiệu quả**: {{Caffeine}} (khuyến nghị).
- **Rất đơn giản, hoàn toàn single-thread**: {{HashMap}}.

### Lưu ý về footprint (kích thước bộ nhớ)
- Mỗi entry tốn overhead: key, value, tham chiếu node/hash/next. Với 1 triệu entry, overhead có thể đáng kể (hàng chục MB) tùy cấu trúc.
- {{ConcurrentHashMap}} có overhead node/phân đoạn (trong các phiên bản JDK cũ) nhưng vẫn là map thuần túy.
- {{Caffeine}} tối ưu kích thước entry hơn, và eviction giúp giữ footprint dưới ngưỡng thay vì để map phình vô hạn.
- Luôn **giới hạn dung lượng** cache để tránh OutOfMemoryError (OOM). Đừng để cache không giới hạn trong production.

### Bên trong: footprint thật của một entry
Ước lượng với compressed oops (heap dưới 32GB): một entry {{HashMap}} = Node (32 byte) + một ô trong mảng bucket (4 byte, nhân hệ số trống của load factor) + object key + object value. Key {{String}} 10 ký tự ≈ 56 byte (object String 24 + mảng byte 24+). Value là object 3 field ≈ 24–32 byte. Tổng khoảng 120–150 byte/entry → 1 triệu entry ≈ 120–150MB, chưa tính dữ liệu bên trong value. {{LinkedHashMap}} thêm 8 byte (hai reference before/after). Caffeine thêm metadata cho eviction và thống kê (khoảng vài chục byte/entry) — đổi lại có giới hạn kích thước và chính sách tốt hơn. Đo thật bằng JOL ({{GraphLayout.parseInstance(map).totalSize()}}) hoặc heap dump thay vì ước lượng.

### Ví dụ đời thực
Service định tuyến giữ bảng 1,2 triệu mã bưu chính → kho hàng trong {{ConcurrentHashMap<String, Warehouse>}}, nạp lại mỗi giờ bằng cách {{clear()}} rồi {{putAll}} — trong lúc nạp có vài giây map thiếu dữ liệu, khoảng 0,3% đơn bị định tuyến về kho mặc định. Đổi sang dựng map mới đầy đủ rồi **thay reference** (field volatile), đồng thời đổi key sang {{int}} (mã bưu chính là số) với map primitive: footprint từ 210MB xuống 45MB, không còn đơn định tuyến sai. Một cache khác (dữ liệu khách hàng, truy cập lệch, cần TTL) dùng Caffeine {{maximumSize(500_000)}} + {{expireAfterWrite(10 phút)}} với hit rate 94%.

### Trả lời mẫu khi phỏng vấn
"Tôi chọn theo ba câu hỏi: có nhiều thread truy cập không, có cần giới hạn kích thước hay hết hạn không, và bộ nhớ bao nhiêu. HashMap chỉ dùng khi một thread hoặc dữ liệu bất biến sau khi dựng. ConcurrentHashMap cho dữ liệu đọc nhiều dùng chung, không tự evict; với bảng tra cứu nạp lại định kỳ, tôi dựng map mới rồi thay reference thay vì clear và nạp lại tại chỗ. LinkedHashMap làm LRU chỉ hợp cache nhỏ một thread. Với cache thật cần giới hạn kích thước, TTL, thống kê, tôi dùng Caffeine với W-TinyLFU. Về bộ nhớ, mỗi entry HashMap với key String ngắn thường tốn khoảng 120 đến 150 byte, nên một triệu entry là hơn một trăm megabyte; tôi đo bằng JOL hoặc heap dump, và nếu key là số thì dùng map primitive để giảm mạnh footprint."

> Senior tip: Đừng tự viết cache phức tạp từ {{LinkedHashMap}} cho môi trường production đa luồng. Nếu cần eviction/LRU/TTL/statistics, {{Caffeine}} đã được chứng minh là giải pháp hiệu quả và an toàn hơn rất nhiều.`,
  follow: ['Tại sao Caffeine dùng W-TinyLFU thay vì chỉ LRU?', 'Cache stampede là gì và cách tránh?', 'Ước lượng footprint bộ nhớ cache thế nào?'],
  tags: ['cache', 'LRU', 'Caffeine', 'ConcurrentHashMap']
},
{
  id: 'modern-025',
  topic: 'modern',
  level: 'lead',
  q: 'Mô hình hoá domain bằng sealed interface + record + pattern matching switch (Java 21): tại sao tốt hơn enum/visitor?',
  a: `**Tóm tắt:** Để mô hình hoá domain (miền nghiệp vụ) có "một trong vài dạng, mỗi dạng mang dữ liệu khác nhau", Java hiện đại cho bộ ba: {{sealed interface}} (interface "niêm phong" - chỉ cho phép một tập subtype cố định kế thừa), {{record}} (class dữ liệu bất biến, tự sinh {{equals}}/{{hashCode}}/{{toString}}) và pattern matching trong {{switch}} (Java 21: switch có thể "mở" kiểu và trích field). Lợi ích lớn: compiler kiểm tra **exhaustive** (phủ hết mọi trường hợp) - thêm subtype mới mà quên xử lý ở switch sẽ **lỗi biên dịch**, không rơi vào bug runtime. So với {{enum}} (không gắn dữ liệu khác nhau linh hoạt) và Visitor pattern (nhiều boilerplate), cách này vừa ngắn gọn vừa an toàn kiểu.

### Cái gì - vì sao cần
- **ADT (Algebraic Data Type - kiểu dữ liệu đại số):** ý tưởng "giá trị này là A hoặc B hoặc C", và A/B/C mỗi loại có cấu trúc dữ liệu riêng. Ví dụ phương thức thanh toán: Thẻ (mang số thẻ, cvv) hoặc Ví điện tử (mang token) hoặc Chuyển khoản (mang IBAN) - chỉ một trong ba, không thể trộn.
- **Vấn đề trước đây:** dùng {{enum}} thì mọi hằng số cùng một "hình dạng", không gắn được cvv/token/iban riêng. Dùng class kế thừa tự do thì bất kỳ ai cũng thêm subtype mới, và {{switch/instanceof}} rải rác không ai nhắc bạn cập nhật khi có type mới.
- **{{sealed}} + {{permits}}:** "niêm phong" cây kế thừa - chỉ các subtype liệt kê (hoặc cùng file/module, tuỳ khai báo) mới được {{implements/extends}}. Compiler biết danh sách đóng.
- **{{record}}:** mỗi subtype là một record bất biến, khai báo gọn các field mang dữ liệu. Immutability giúp an toàn khi chia sẻ giữa luồng/tầng.
- **Pattern matching switch (Java 21):** {{case CreditCard(var num, var cvv) -> ...}} vừa kiểm tra kiểu vừa trích (deconstruct) field. Vì tập subtype đã đóng (sealed), bỏ {{default}} mà phủ hết case → compiler bắt buộc bạn cập nhật mọi switch khi thêm subtype mới.

### Cơ chế từng bước (code minh hoạ)
~~~java
// 1) Tập type ĐÓNG: chỉ 3 phương thức thanh toán hợp lệ
public sealed interface PaymentMethod
        permits CreditCard, Wallet, BankTransfer {}
public record CreditCard(String number, String cvv) implements PaymentMethod {}
public record Wallet(String provider, String token) implements PaymentMethod {}
public record BankTransfer(String iban) implements PaymentMethod {}

// 2) Xử lý: exhaustive - thiếu 1 case sẽ KHÔNG biên dịch được
static String describe(PaymentMethod pm) {
    return switch (pm) {                     // Java 21 pattern matching
        case CreditCard(var n, var c) -> "Card ****" + n.substring(n.length()-4);
        case Wallet(var p, var t)     -> "Wallet " + p;
        case BankTransfer(var iban)   -> "IBAN " + iban;
        // không cần default: compiler biết đã đủ 3 type
    };
}
// 3) Thêm type mới, ví dụ record Cash() implements PaymentMethod {}
//    -> mọi switch không có default sẽ báo lỗi biên dịch ngay.
~~~

### So sánh / trade-off
| Tiêu chí | {{enum}} | Visitor pattern | sealed + record + switch |
|---|---|---|---|
| Mỗi loại mang dữ liệu riêng | Khó/ép | Được | Tự nhiên (record) |
| Thêm **hành vi** mới (operation) | Sửa enum hoặc switch | Thêm method vào Visitor + mọi class | Thêm/sửa switch (gọn) |
| Thêm **type** mới | Sửa switch (dễ sót nếu có {{default}}) | Sửa interface Visitor + mọi visitor (nhiều boilerplate) | Compiler bắt cập nhật mọi exhaustive switch |
| Bất biến | Tuỳ | Tuỳ | Mặc định (record) |
| Độ dài code | Ngắn | Dài | Ngắn |

Quy tắc chọn: tập type **ổn định**, hay thêm hành vi → sealed+switch thuận tiện. Tập type thay đổi liên tục → cân nhắc lại thiết kế (hoặc chấp nhận sửa nhiều switch, nhưng compiler sẽ chỉ điểm).

### Ví dụ đời thực (production)
Giả định hệ thống thanh toán xử lý ~120.000 giao dịch/ngày với 3 phương thức (thẻ, ví, chuyển khoản) model bằng {{if (pm instanceof CreditCard) ...}} rải rác ở 6 service (tính phí, hiển thị, kiểm tra rủi ro, hoàn tiền, xuất báo cáo, gửi thông báo). Khi thêm phương thức "Buy Now Pay Later" (BNPL), team thêm class mới nhưng quên cập nhật luồng hoàn tiền - case rơi vào nhánh {{else}} chung, trả về "không hỗ trợ" im lặng. Hậu quả: ~1.800 yêu cầu hoàn tiền BNPL bị treo trong 3 ngày, khiếu nại tăng, chi phí xử lý thủ công ~12 giờ. Điều tra: grep không thấy chỗ nào xử lý {{BNPL}}; không có tín hiệu compile-time. Cách sửa: refactor sang {{sealed interface PaymentMethod permits CreditCard, Wallet, BankTransfer, BNPL}} + record cho từng loại, đổi các chuỗi {{if-instanceof}} thành exhaustive switch. Sau khi thêm {{record BNPL(...)}} vào {{permits}}, 6 switch đồng loạt lỗi biên dịch → dev buộc phải xử lý. Kết quả: thêm phương thức mới về sau không còn sót nhánh, thời gian review giảm vì compiler gánh việc kiểm tra.

### Pitfall production
- **Thêm {{default}} vô tội vạ:** {{default}} làm switch hết exhaustive → compiler không còn cảnh báo khi thêm subtype. Chỉ dùng {{default}} khi bạn thực sự muốn hành vi "bắt tất cả" và chấp nhận rủi ro.
- **Sealed không miễn nhiễm null:** switch trên tham chiếu {{null}} vẫn có thể ném {{NullPointerException}} nếu không có {{case null}} (Java 21). Cần quyết định: chặn null ở biên hay xử lý {{case null}}.
- **Nhầm {{record}} là entity:** record immutable, không có no-arg constructor - phù hợp value/DTO, không phù hợp JPA {{@Entity}}.

### Trả lời mẫu khi phỏng vấn
"Khi domain có một tập loại cố định nhưng mỗi loại mang dữ liệu khác nhau, tôi dùng sealed interface kết hợp record và pattern matching switch, kiểu ADT của Java hiện đại. Sealed interface niêm phong tập subtype nên compiler biết danh sách đóng; mỗi subtype là một record bất biến mang đúng field của nó; còn switch ở Java 21 có thể deconstruct record và kiểm tra exhaustive. Điểm mạnh nhất là an toàn tại compile-time: nếu thêm một subtype mới vào permits, mọi switch không có default sẽ báo lỗi biên dịch, nên mình không thể quên xử lý như kiểu if-instanceof rải rác. So với enum thì linh hoạt hơn vì mỗi loại có dữ liệu riêng; so với Visitor thì bớt boilerplate khi thêm hành vi mới. Tôi vẫn cẩn thận không lạm dụng default vì nó tắt cảnh báo exhaustive, và nhớ xử lý case null khi cần. Thực tế cách này giúp team thêm phương thức hay trạng thái mới mà tự tin hơn vì compiler đóng vai trò lưới an toàn."

> Senior tip: dùng sealed+record cho "closed world" (tập loại do bạn kiểm soát: trạng thái đơn hàng, kết quả xử lý, sự kiện domain). Đừng sealed những thứ cần mở rộng bởi plugin/bên thứ ba. Luôn cân nhắc: "thêm type hay thêm hành vi thường xuyên hơn?" - đó là chìa khóa chọn giữa switch và Visitor.`,
  follow: ['Khi nào dùng Visitor thay vì sealed+switch?', 'Exhaustiveness trong pattern matching switch là gì?', 'Tại sao record phù hợp để mô hình hóa ADT?'],
  tags: ['sealed', 'record', 'pattern matching', 'ADT']
},
{
  id: 'modern-026',
  topic: 'modern',
  level: 'lead',
  q: 'Record làm JPA entity / DTO / Map key: được gì, mất gì? Best practice?',
  a: `**Tóm tắt:** {{record}} là immutable (các component final, không setter), tự sinh {{equals()}}/{{hashCode()}}/{{toString()}} dựa trên components, không có no-arg constructor mặc định. Vì vậy nó **rất phù hợp** làm DTO, projection, value object và làm key trong {{Map}}/{{Set}}. Ngược lại, {{record}} **không phù hợp** làm JPA {{@Entity}} trong đa số trường hợp do yêu cầu của JPA/Hibernate.

### Phân tích theo trường hợp sử dụng
| Trường hợp | Khuyến nghị | Lý do |
|---|---|---|
| DTO/Request/Response | Rất tốt | Bất biến, ngắn gọn, an toàn khi truyền qua tầng. |
| JPA Projection (constructor expression, interface-based ít gặp hơn) | Thường tốt | Hibernate/JPA có thể map constructor của record cho projection query. |
| Value Object (domain) | Rất tốt | Phù hợp với immutability, {{equals}} theo giá trị. |
| Map key | Rất tốt | {{equals}}/{{hashCode}} bất biến → an toàn, không lo "mất" entry như key mutable. |
| Embeddable ({{@Embeddable}}) | Cẩn thận/Tùy provider | Một số provider hỗ trợ, nhưng không phổ biến và có giới hạn. Cần kiểm tra kỹ. |
| JPA Entity ({{@Entity}}) | Không khuyến khích | Xem chi tiết bên dưới. |

### Tại sao không phù hợp làm JPA Entity
- **Cần no-arg constructor**: JPA/Hibernate cần constructor không tham số để tạo instance khi hydrate entity. {{record}} không có no-arg constructor mặc định.
- **Bất biến vs dirty tracking**: Entity cần thay đổi trạng thái (update field) để Hibernate theo dõi thay đổi (dirty checking) và flush. {{record}} immutable không phù hợp mô hình này.
- **Proxy cho lazy loading**: Hibernate thường tạo proxy subclass để lazy load {{@ManyToOne}}/{{@OneToMany}}. {{record}} là {{final}} và không có constructor phù hợp để proxy hóa dễ dàng.
- **Lifecycle phức tạp**: Entity có lifecycle (managed/detached/removed) - immutable đi ngược lại với thiết kế đó.

### Best practice
- **Entity = stateful, có identity, lifecycle** (có thể mutable). Dùng class bình thường.
- **DTO/Record = data transfer, bất biến, không có identity nghiệp vụ phức tạp**.
- **Làm Map key**: chỉ dùng khi các component của record **toàn bộ immutable**.

### Bên trong: vì sao Hibernate cần class "mở"
Hibernate tạo entity bằng **constructor không tham số** rồi gán field bằng reflection; theo dõi thay đổi (dirty checking) bằng cách **so sánh snapshot** và **sửa field** khi merge/refresh; lazy loading cần tạo **proxy subclass** (ByteBuddy). Record vi phạm cả ba: không có constructor rỗng, field final không gán lại được, và class final không kế thừa được. Vì vậy record không làm entity được; nhưng từ Hibernate 6.2 record dùng được làm **{{@Embeddable}}** (giá trị nhúng, Hibernate gọi constructor canonical), và làm kết quả projection ({{select new com.x.OrderView(o.id, o.total) ...}}) hoặc projection của Spring Data.

### Ví dụ đời thực
Một team chuyển toàn bộ DTO sang record — tốt — nhưng cũng dùng record làm **key cache** có component {{BigDecimal amount}}. Hai request "100.0" và "100.00" (khác scale) tạo hai key khác nhau vì {{BigDecimal.equals}} so scale → cache hit rate thấp bất thường (31%). Sửa trong compact constructor: {{amount = amount.setScale(2, RoundingMode.HALF_UP)}}; hit rate lên 74%. Cùng đợt, projection JPQL trả record thay vì entity cho màn hình danh sách: bỏ được dirty checking và lazy loading thừa, p95 API danh sách giảm 40%.

### Trả lời mẫu khi phỏng vấn
"Record rất hợp làm DTO, projection, value object và key của Map: bất biến nông, equals và hashCode theo giá trị, ngắn gọn. Nhưng record không làm JPA entity được, vì Hibernate cần constructor không tham số để tạo object, cần gán lại field khi merge hay refresh, và cần tạo proxy subclass cho lazy loading, trong khi record có field final, không có constructor rỗng và là class final. Từ Hibernate 6.2, record dùng được làm Embeddable và làm kết quả projection bằng select new hoặc projection của Spring Data, rất tốt cho màn hình chỉ đọc vì bỏ được dirty checking. Khi dùng record làm key, tôi chuẩn hoá dữ liệu trong compact constructor, như copy list bằng List.copyOf hay chuẩn hoá scale của BigDecimal, để equals và hashCode ổn định."

> Senior tip: "Entity là về vòng đời và identity; DTO/ValueObject là về dữ liệu bất biến". Đừng ép record vào vai trò entity chỉ vì ngắn gọn - bạn sẽ đánh đổi khả năng lazy loading, proxy và dirty tracking.`,
  follow: ['Tại sao JPA cần no-arg constructor?', 'Record dùng làm projection được không?', 'Tại sao record tốt làm Map key?'],
  tags: ['record', 'JPA', 'DTO', 'projection']
},
{
  id: 'modern-027',
  topic: 'modern',
  level: 'lead',
  q: 'parallel stream trên production: khi nào chậm hơn, ForkJoinPool chung, side effect?',
  a: `**Tóm tắt:** {{Stream.parallel()}} biến stream tuần tự thành song song bằng cách chia dữ liệu cho nhiều thread chạy cùng lúc, và nó dùng chung {{ForkJoinPool.commonPool()}} (một thread pool dùng chung của toàn JVM - máy ảo Java). Nó **không phải lúc nào cũng nhanh hơn**: chỉ có lợi khi công việc nặng về CPU (CPU-bound - chủ yếu tính toán), dữ liệu đủ lớn và dễ chia, không chặn I/O (blocking I/O - chờ mạng/đĩa/DB), không có side effect (tác dụng phụ - sửa state bên ngoài). Dùng sai (đặc biệt với I/O blocking) có thể làm chậm hơn stream thường và còn làm nghẽn cả những phần khác của ứng dụng vì chung pool.

### Cái gì - vì sao cần - hoạt động thế nào
- **Song song để làm gì?** Với phép tính nặng trên tập dữ liệu lớn (lọc, map, tính tổng trên hàng triệu phần tử), chia việc cho nhiều lõi CPU chạy đồng thời có thể rút ngắn thời gian.
- **Fork/Join hoạt động ra sao?** {{parallel()}} yêu cầu nguồn dữ liệu cung cấp {{Spliterator}} (bộ chia iterator) để "fork" (tách) dữ liệu thành các mảnh. Mỗi mảnh được xử lý trên một worker thread của {{ForkJoinPool}} (thuật toán work-stealing: thread rảnh "ăn trộm" việc từ thread bận). Sau đó "join" (gộp) kết quả lại. Bước chia (split) và gộp (merge/combine) **tốn chi phí**.
- **{{commonPool}} là gì?** Mặc định {{ForkJoinPool.commonPool()}} có số thread xấp xỉ {{số lõi CPU - 1}}. Nó **dùng chung** cho toàn ứng dụng: {{parallel stream}}, {{CompletableFuture}} không chỉ định executor, và các API khác. Nghĩa là bạn cạnh tranh thread với phần còn lại của hệ thống.
- **CPU-bound vs I/O-bound:** CPU-bound là việc ngốn CPU liên tục (mã hoá, tính toán). I/O-bound là việc chủ yếu **chờ** (gọi HTTP, query DB) - lúc chờ, thread bị block và không làm gì hữu ích. Dùng thread pool nhỏ để chờ I/O là lãng phí và gây tắc.

### Khi nào chậm hơn (và vì sao)
| Nguyên nhân | Vì sao chậm hơn / nguy hiểm |
|---|---|
| Dữ liệu nhỏ (vài trăm/phần nghìn phần tử) | Chi phí split/fork/join + điều phối thread lớn hơn thời gian tính thực |
| Nguồn khó chia ({{LinkedList}}, {{iterate}}, {{Stream.generate}}) | Split kém → ít song song thực sự, overhead vẫn trả |
| I/O blocking (gọi DB/HTTP/file trong pipeline) | Block worker của {{commonPool}} → pool cạn → {{CompletableFuture}}/parallel stream khác trong app cũng bị treo (starvation - đói tài nguyên) |
| Stream có thứ tự (ordered) + {{forEachOrdered}}/{{limit}} | Phải giữ thứ tự, giảm lợi ích song song, thêm đồng bộ |
| Có side effect (ghi vào {{ArrayList}}/biến chia sẻ) | Race condition (tranh chấp dữ liệu), kết quả sai/thiếu phần tử; {{ArrayList}} không thread-safe |

### Ví dụ đời thực (production)
Giả định một API tổng hợp báo cáo: với mỗi trong ~50 ID, gọi HTTP tới service khác (latency trung bình 120ms) rồi ghép kết quả. Dev đổi {{ids.stream()}} thành {{ids.parallelStream().map(id -> httpClient.get(id))...}} kỳ vọng nhanh hơn. Trên máy 8 lõi, {{commonPool}} có ~7 thread. 7 request đầu chạy, 43 request còn lại xếp hàng chờ trong pool - nhưng tệ hơn: một luồng khác trong cùng ứng dụng dùng {{CompletableFuture.supplyAsync(...)}} (mặc định cũng ăn {{commonPool}}) để xử lý tác vụ nền. Kết quả: p99 của API báo cáo giảm nhẹ (từ ~6s xuống ~4,5s) nhưng p99 của các endpoint khác tăng đột biến từ 80ms lên 900ms trong giờ cao điểm, vì worker bị giữ để chờ HTTP. Điều tra: thread dump thấy mọi thread {{ForkJoinPool.commonPool-worker-*}} đều nằm trong socket read (trạng thái hiển thị là RUNNABLE vì đang chờ I/O trong native code, dễ bị đọc nhầm là "đang làm việc"). Cách sửa: bỏ {{parallelStream}} cho đường I/O; dùng {{CompletableFuture.supplyAsync(() -> httpClient.get(id), ioExecutor)}} với {{ioExecutor}} là {{Executors.newFixedThreadPool(32)}} (hoặc virtual threads ở Java 21) tách biệt, giới hạn concurrency. Kết quả: API báo cáo ~1,2s (32 request song song thực sự, không chặn pool chung), endpoint khác về p99 85ms.

~~~java
import java.util.List;
import java.util.concurrent.*;

// BAD: blocking I/O trên commonPool
List<Report> bad = ids.parallelStream()
        .map(id -> http.get("/r/" + id))   // block worker
        .toList();

// GOOD: I/O-bound -> executor riêng (hoặc virtual thread Java 21)
ExecutorService io = Executors.newFixedThreadPool(32);
try {
    List<Report> ok = ids.stream()
        .map(id -> CompletableFuture.supplyAsync(() -> http.get("/r/" + id), io))
        .toList().stream()                  // gom future
        .map(CompletableFuture::join)
        .toList();
} finally { io.shutdown(); }
// CPU-bound nặng, dữ liệu lớn, nguồn chia tốt (ArrayList) -> cân nhắc parallel
long sum = hugeArray.parallelStream().mapToLong(this::heavyCpu).sum();
~~~

### Pitfall production
- **Dùng chung pool mà không hay biết:** một chỗ chặn {{commonPool}} làm hỏng chỗ khác rất xa trong codebase - bug liên quan toàn hệ thống, khó truy vết.
- **Side effect ẩn:** {{parallelStream().forEach(list::add)}} trên {{ArrayList}} thường dùng → mất phần tử ngẫu nhiên. Dùng {{collect(Collectors.toList())}} (hoặc {{toList()}}) để collector gộp an toàn.
- **"Parallel" không tự động nhanh:** với N nhỏ hoặc mỗi phần tử xử lý rất nhẹ, overhead > lợi ích. Luôn đo (benchmark, ví dụ JMH) trước khi giữ.

### Trả lời mẫu khi phỏng vấn
"parallelStream chia dữ liệu qua Spliterator và chạy trên ForkJoinPool.commonPool dùng chung của toàn JVM. Nó chỉ thực sự nhanh khi bài toán là CPU-bound, tập dữ liệu đủ lớn, nguồn dễ chia như ArrayList, và pipeline không có side effect. Ngược lại, với dữ liệu nhỏ thì chi phí split và merge còn lớn hơn việc tính, còn với tác vụ I/O-bound như gọi HTTP hay DB thì thread worker bị block để chờ - mà commonPool lại ít thread và dùng chung, nên một chỗ lạm dụng có thể làm nghẽn cả CompletableFuture hay parallel stream ở chỗ khác. Tôi từng gặp case đổi sang parallelStream để gọi HTTP song song, p99 endpoint khác tăng vọt vì commonPool bị đói. Cách sửa là dùng CompletableFuture với executor riêng cho I/O, hoặc virtual thread ở Java 21. Nguyên tắc của tôi: mặc định dùng stream tuần tự, chỉ bật parallel khi đo benchmark cho thấy cải thiện rõ trên dữ liệu thực."

> Senior tip: coi {{ForkJoinPool.commonPool()}} là tài nguyên dùng chung nhạy cảm - **không bao giờ** đặt blocking I/O lên đó. Nếu cần "parallel cho I/O", dùng executor có kích thước phù hợp (hoặc virtual thread) và tách biệt. Trước khi merge code dùng {{parallel()}}, yêu cầu benchmark so với tuần tự trên kích thước dữ liệu production.`,
  follow: ['ForkJoinPool.commonPool có giới hạn như thế nào?', 'Tại sao blocking I/O nguy hiểm khi dùng parallel stream?', 'Khi nào dùng CompletableFuture thay thế parallel stream?'],
  tags: ['parallel stream', 'ForkJoinPool', 'completablefuture']
}
,
{
  id: 'core-032',
  topic: 'core',
  level: 'senior',
  q: '{{equals}}/{{hashCode}} với entity JPA và với kế thừa: dùng {{getClass()}} hay {{instanceof}}? Tại sao đưa entity vào {{HashSet}} trước khi {{persist}} là bug thật?',
  a: `**Tóm tắt:** Với entity JPA, equality phải giữ ổn định qua vòng đời transient → managed → detached. Nếu hashCode phụ thuộc vào id tự sinh (null trước persist), entity đã add vào HashSet sẽ bị "lạc" khi id được gán. Với kế thừa, dùng {{getClass()}} chặt chẽ hơn {{instanceof}} về tính đối xứng, nhưng cần cân nhắc proxy Hibernate.

### Vấn đề với id tự sinh
- Khi {{new Entity()}} thì id là null. Nếu hashCode dựa trên id và equals so id bằng {{Objects.equals}} (hai null coi là bằng), hai entity mới tạo khác nhau bị coi là trùng → HashSet chỉ giữ một.
- Sau {{persist}}, id được gán → hashCode đổi → entity nằm ở bucket cũ, {{contains()}} và {{remove()}} không tìm thấy.
- Đây là bug thật: add entity vào Set, persist, rồi remove → không xoá được, memory leak.

### Business key
- Dùng thuộc tính duy nhất, bất biến và có sẵn từ lúc tạo (mã quốc gia, email đã verify).
- Ví dụ: {{Country.equals}} so sánh {{code}} (ISO 3166), không cần persist.
- Không phải entity nào cũng có business key → khi đó cần chiến lược khác.

### getClass() vs instanceof
~~~java
// getClass(): chỉ bằng nhau nếu cùng class
@Override public boolean equals(Object o) {
    if (this == o) return true;
    if (o == null || getClass() != o.getClass()) return false;
    return Objects.equals(id, ((Entity) o).id);
}
// instanceof: cho phép proxy (subclass) so sánh được
if (!(o instanceof Entity e)) return false;
~~~
- {{getClass()}} đảm bảo tính đối xứng: nếu a.equals(b) thì b.equals(a) luôn. Với {{instanceof}} ở lớp cha, object lớp cha có thể equals object lớp con (vì lớp con instanceof lớp cha); nếu lớp con lại override equals thêm điều kiện riêng thì chiều ngược lại trả false → vi phạm đối xứng.
- Tuy nhiên Hibernate lazy proxy là subclass của entity → {{getClass()}} coi proxy và entity thật là khác nhau. Vì vậy cần {{instanceof}} hoặc {{Hibernate.getClass(o)}}.

### Strategy an toàn
~~~java
@Override public boolean equals(Object o) {
    if (this == o) return true;
    if (!(o instanceof Account e)) return false;
    return id != null && id.equals(e.getId());   // id null → chỉ bằng chính nó
}
@Override public int hashCode() {
    return Account.class.hashCode();   // ổn định, không đổi khi id được cấp
}
~~~
- Không đưa association/lazy collection vào equals/hashCode (kích hoạt query, recursion, N+1).
- Viết test: entity transient, managed, detached, proxy, hai instance cùng id.

### Pitfall
- Dùng {{@Data}} (Lombok) sinh hashCode theo mọi field, trong đó có id → entity bị mất khỏi Set sau persist.
- Đưa entity vào Set rồi gọi setter đổi field tham gia hashCode → hashCode đổi, entity lạc bucket.

### Ví dụ đời thực
Hệ thống bảo hiểm có {{Policy}} và lớp con {{LifePolicy extends Policy}}; {{equals}} của {{Policy}} dùng {{instanceof}} và so {{policyNumber}}, còn {{LifePolicy}} override {{equals}} so thêm {{beneficiary}}. Kết quả: {{policy.equals(lifePolicy)}} là true nhưng {{lifePolicy.equals(policy)}} là false — vi phạm tính đối xứng; một {{HashSet<Policy>}} dùng để loại trùng khi import lúc giữ, lúc bỏ hợp đồng tuỳ thứ tự đọc file, 1.300 hợp đồng bị nhân đôi trong báo cáo quý. Sửa: equality chỉ dựa trên business key {{policyNumber}} khai báo {{final}} ở lớp cha, lớp con không override equals. Với Hibernate proxy, so sánh bằng {{Hibernate.getClass(o)}} thay vì {{getClass()}} trực tiếp để proxy và entity thật vẫn bằng nhau.

### Trả lời mẫu khi phỏng vấn
"Với entity JPA, equality phải ổn định qua vòng đời: nếu hashCode dựa vào id tự sinh thì entity add vào HashSet trước khi persist sẽ bị lạc khi id được gán, vì nó vẫn nằm ở bucket theo hash cũ. Tôi ưu tiên business key bất biến; nếu không có thì so id khi khác null và để hashCode là hằng số theo class. Về kế thừa, getClass bảo đảm tính đối xứng vì hai object khác class không bao giờ bằng nhau, còn instanceof cho phép lớp con bằng lớp cha, dễ vi phạm đối xứng nếu lớp con override equals với thêm field. Nhưng với Hibernate, getClass của proxy khác class thật, nên tôi dùng Hibernate.getClass hoặc instanceof kèm equals final ở lớp cha. Quy tắc thực tế: equals dựa trên khoá, khai báo final, lớp con không override."

> Senior tip: chọn một quy tắc cho toàn hệ thống và kiểm tra bằng test với HashSet trước/sau persist. Equality của entity là quyết định identity, không chỉ là boilerplate.`,
  follow: ['Tại sao Hibernate khuyên dùng business key thay vì id trong equals/hashCode?', 'Dùng getClass() vs instanceof ảnh hưởng thế nào đến tính đối xứng của equals?', 'Nếu entity đã nằm trong HashSet trước khi persist và hashCode đổi, làm sao khắc phục?'],
  tags: ['equals', 'hashCode', 'JPA', 'entity', 'HashSet']
},
{
  id: 'core-033',
  topic: 'core',
  level: 'lead',
  q: 'Generics: PECS, type erasure, heap pollution, {{@SafeVarargs}} và ảnh hưởng khi viết thư viện/API thế nào?',
  a: `**Tóm tắt:** Generics chỉ kiểm tra lúc compile rồi bị xoá (type erasure) khỏi bytecode. PECS là quy tắc chọn wildcard: Producer Extends, Consumer Super. Heap pollution là khi một biến kiểu generic trỏ tới object không đúng kiểu đó (thường do raw type, unchecked cast hoặc varargs generic); lỗi chỉ nổ ra sau đó, ở chỗ đọc. {{@SafeVarargs}} chỉ đặt được trên constructor và method static/final/private (private từ Java 9), và là cam kết của người viết — compiler không kiểm tra được thân method.

### Type erasure
- {{List<String>}} và {{List<Integer>}} cùng là {{List}} trong bytecode; không thể {{new T()}}, {{instanceof T}}, hay overload chỉ khác type parameter.
- Compiler chèn cast và bridge method để giữ đa hình. Bridge method của {{Comparable}} là {{compareTo(Object)}} gọi {{compareTo(MyType)}}.
- Hệ quả: không thể kiểm tra generic runtime; reflection không có thông tin generic đầy đủ (nhưng metadata {{ParameterizedType}} vẫn còn nếu khai báo ở class/field/method — Jackson lợi dụng điều này).

### PECS: Producer Extends, Consumer Super
- Generic là invariant: {{List<Integer>}} không phải subtype của {{List<Number>}}. Nếu cho phép, ta có thể {{add(3.14)}} vào list Integer.
- {{? extends T}}: chỉ đọc được {{T}}, không ghi (trừ {{null}}) — dùng cho producer.
- {{? super T}}: ghi được {{T}}, đọc ra chỉ {{Object}} — dùng cho consumer.
- {{?}} = {{? extends Object}}: đọc {{Object}}, không ghi.
- Ví dụ kinh điển: {{Collections.copy(List<? super T> dest, List<? extends T> src)}}.

### Heap pollution
- Xảy ra khi một biến kiểu generic (hoặc mảng generic) trỏ tới object không đúng kiểu, nhưng do erasure nên runtime không phát hiện ngay.
- Ví dụ: {{List<String>[] arr = (List<String>[]) new List<?>[10];}} rồi qua một biến {{Object[]}} gán {{List.of(42)}} vào {{arr[0]}}: JVM **không** chặn (runtime chỉ thấy mảng {{List[]}}), đó chính là heap pollution; {{ClassCastException}} chỉ nổ khi sau này đọc {{arr[0].get(0)}} ra String.
- Dùng raw type ({{List}} không tham số) rồi add element generic vào: {{list.add(123)}} thành công vì raw type bỏ qua kiểm tra, nhưng {{list.get(0)}} sẽ nổ {{ClassCastException}} khi cast.
- {{@SafeVarargs}} là cam kết: chỉ cho static/final/private method; nếu method không final và có varargs của generic array, caller có thể ghi array khác và gây heap pollution sau này.

### Khi viết API
- Dùng wildcard ở input để người dùng truyền được nhiều loại hơn; output dùng type cụ thể.
- Không dùng raw type trong API mới; nó tắt kiểm tra compile và gây warning.
- Tránh varargs generic trong public method nếu không thể đảm bảo an toàn → dùng collection thay vì varargs.

### Ví dụ đời thực
Một thư viện tiện ích nội bộ có method {{static <T> List<T> listOf(T... items)}} đánh dấu {{@SafeVarargs}} nhưng bên trong **lưu mảng varargs vào một field** để tái sử dụng. Khi được gọi với kiểu generic ({{listOf(List.of(1), List.of(2))}}), mảng thực chất là {{Object[]}}; một chỗ khác ghi phần tử sai kiểu vào mảng đó (heap pollution) và {{ClassCastException}} nổ ở một service khác, xa chỗ gây lỗi, khiến team mất một ngày truy. Sửa: không giữ hay trả ra mảng varargs ({{List.copyOf(Arrays.asList(items))}}), chỉ đặt {{@SafeVarargs}} khi method chỉ **đọc** phần tử. Thêm {{-Xlint:unchecked -Werror}} vào build để mọi cảnh báo unchecked trở thành lỗi trong thư viện dùng chung.

### Trả lời mẫu khi phỏng vấn
"Generic chỉ được kiểm tra lúc biên dịch rồi bị xoá, nên runtime không biết List đó chứa gì. Khi viết API, tôi theo PECS: tham số chỉ để đọc dùng extends, chỉ để ghi dùng super, như Collections.copy, còn kiểu trả về thì cụ thể. Heap pollution là khi một biến generic trỏ tới object không đúng kiểu, thường do raw type hoặc varargs generic: varargs tạo mảng, mà mảng generic thực chất là mảng Object, nên ai đó có thể nhét phần tử sai kiểu vào và ClassCastException nổ ở chỗ khác. @SafeVarargs chỉ là lời cam kết của người viết rằng method không ghi vào mảng varargs và không để nó thoát ra ngoài; compiler không kiểm tra. Trong thư viện dùng chung tôi bật Xlint unchecked như lỗi và tránh raw type hoàn toàn."

> Senior tip: khi thiết kế thư viện, luôn dùng wildcard ở input (PECS) và type cụ thể ở output. {{@SafeVarargs}} chỉ là cam kết — đặt nó lên method có thể override (không final/static/private) là lỗi biên dịch. Không bao giờ tạo mảng generic {{new T[]}}; dùng {{List<List<T>>}} hoặc {{Array.newInstance}} + cast có kiểm soát.`,
  follow: ['Tại sao không thể tạo mảng generic new T[]?', 'Heap pollution xảy ra thế nào và phát hiện ra sao?', 'Khi nào dùng @SafeVarargs và tại sao chỉ cho static/final/private?'],
  tags: ['generics', 'type erasure', 'PECS', 'heap pollution', 'SafeVarargs']
},
{
  id: 'core-034',
  topic: 'core',
  level: 'lead',
  q: '{{BigDecimal}} cho tiền tệ: scale, precision, {{RoundingMode}}, {{equals}} vs {{compareTo}}, phép chia và bug "lệch 1 xu"?',
  a: `**Tóm tắt:** Tiền tệ bắt buộc dùng {{BigDecimal}} vì {{double}}/{{float}} không biểu diễn chính xác số thập phân (0.1 + 0.2 ≠ 0.3). {{equals}} so sánh cả scale và giá trị; {{compareTo}} chỉ so sánh giá trị số học. Phép chia không hết phải chỉ định scale và {{RoundingMode}}. Sai scale/rounding là nguyên nhân gây lệch 1 xu.

### Vì sao không dùng double
- {{double}} tuân theo IEEE 754 nhị phân: số thập phân hữu hạn (0.1, 19.99) thường thành số lặp vô hạn trong nhị phân ⇒ sai số tròn tích lũy.
- Ví dụ kinh điển: {{0.1 + 0.2 = 0.30000000000000004}}; tính lãi, chiết khấu sẽ lệch cent và cộng dồn qua nghìn giao dịch thành số lớn.
- Nghiệp vụ kế toán/ngân hàng yêu cầu số tiền khớp tuyệt đối tới đơn vị nhỏ nhất của tiền tệ (số chữ số thập phân của mỗi loại tiền theo ISO 4217: VND 0, USD 2, JPY 0); {{double}} không đáp ứng được.

### BigDecimal cơ bản
~~~java
// Tạo từ String — AN TOÀN
BigDecimal price = new BigDecimal("19.99");

// Tạo từ double — CẤM
BigDecimal bad = new BigDecimal(0.1);   // 0.10000000000000000555...
BigDecimal good = BigDecimal.valueOf(0.1); // dùng Double.toString -> "0.1"
~~~
- Luôn dùng constructor nhận {{String}} hoặc {{BigDecimal.valueOf(double)}}.
- {{scale}} = số chữ số sau dấu phẩy; scale âm nghĩa là giá trị = unscaledValue × 10^|scale| (ví dụ 1E+3 có scale -3).

### equals vs compareTo
~~~java
new BigDecimal("1.0").equals(new BigDecimal("1.00"));  // false (scale khác)
new BigDecimal("1.0").compareTo(new BigDecimal("1.00")); // 0 (giá trị bằng)
~~~
- {{equals}} so sánh cả scale và giá trị; {{compareTo}} chỉ so sánh giá trị số học.
- Dùng {{compareTo}} cho logic nghiệp vụ (so sánh giá, kiểm tra âm/dương); dùng {{equals}} chỉ khi cần biết chính xác định dạng (serial hóa).
- {{signum()}} trả -1/0/1 tiện cho điều kiện.

### Phép chia và bug "lệch 1 xu"
- {{divide(divisor)}} không chỉ định scale sẽ ném {{ArithmeticException}} nếu không chia hết (non-terminating decimal).
- {{divide(divisor, scale, RoundingMode.HALF_UP)}} luôn chỉ định scale và rounding mode.
- Bug "lệch 1 xu" xảy ra khi: dùng {{double}} trung gian, hoặc rounding mode không phù hợp (ví dụ dùng {{HALF_DOWN}} trong khi quy định là {{HALF_UP}}), hoặc scale khác nhau giữa các bước tính.
- Tính tổng nhiều khoản với tỷ lệ phần trăm: mỗi khoản round riêng rẽ → lệch tích luỹ. Cách đúng: tính tổng bằng {{BigDecimal}} rồi round một lần cuối; còn khi buộc phải chia một số tiền thành nhiều phần (chia hoá đơn, phân bổ phí), làm tròn từng phần rồi dồn phần dư vào một phần để tổng luôn khớp.

### Pitfall production
- Quên {{divide}} kèm scale + rounding ⇒ exception lúc runtime khi chia 10/3.
- Lưu DB: cột {{NUMERIC(19,4)}} hoặc {{DECIMAL}}; đừng dùng {{FLOAT}}/{{DOUBLE}}. Hibernate mapping {{@Column(precision = 19, scale = 4)}}.
- Tiền tệ đa ngoại tệ: luôn kèm {{Currency}} (ISO 4217), không cộng/trừ tiền tệ khác nhau.
- Tự viết {{Money}} wrapper (record {{Money(BigDecimal amount, Currency currency)}}) với validation ở constructor; tập trung logic làm tròn, chuyển đổi, so sánh vào một chỗ.
- {{BigDecimal}} làm key của {{HashMap}}/{{HashSet}}: {{1.0}} và {{1.00}} là hai key khác nhau vì equals xét scale. Chuẩn hoá scale ({{setScale}}) trước khi làm key, hoặc dùng {{TreeMap}} (dựa trên compareTo).

### Ví dụ đời thực
Một ví điện tử tính phí rút tiền 1,1% bằng {{double}} rồi {{Math.round}}: báo cáo đối soát cuối tháng lệch 1,8 triệu đồng trên 2,3 triệu giao dịch so với file của ngân hàng (ngân hàng làm tròn HALF_UP trên số thập phân chính xác). Ngoài ra, chức năng chia hoá đơn nhóm chia 100.000 đồng cho 3 người được 33.333 × 3 = 99.999. Sửa: toàn bộ tính tiền chuyển sang {{BigDecimal}} tạo từ String, phí làm tròn {{setScale(0, RoundingMode.HALF_UP)}} theo đúng hợp đồng với ngân hàng, chia hoá đơn dồn phần dư 1 đồng cho người đầu tiên; thêm test đối chiếu với file mẫu của ngân hàng. Tháng sau đối soát khớp 100%.

### Trả lời mẫu khi phỏng vấn
"Tiền tôi luôn dùng BigDecimal tạo từ String hoặc valueOf, không bao giờ từ double, vì double là số nhị phân nên 0,1 cộng 0,2 không ra 0,3. Ba điểm hay sai: thứ nhất, equals so cả scale nên 1.0 khác 1.00, logic nghiệp vụ phải dùng compareTo, và cẩn thận khi dùng BigDecimal làm key của HashMap. Thứ hai, phép chia không hết mà không truyền scale và RoundingMode sẽ ném ArithmeticException, nên mọi phép chia phải có scale và rounding mode rõ ràng. Thứ ba, chọn chế độ làm tròn theo hợp đồng nghiệp vụ, HALF_UP hay HALF_EVEN, và làm tròn ở đúng bước: tính tổng rồi làm tròn một lần; khi phải chia một khoản tiền thành nhiều phần thì dồn phần dư vào một phần để tổng luôn khớp. Tôi gom toàn bộ vào một value object Money có currency, để quy tắc làm tròn nằm ở một chỗ, và lưu DB bằng NUMERIC chứ không bao giờ FLOAT."

> Senior tip: viết wrapper {{Money}} với validation ở constructor; tập trung logic làm tròn, chuyển đổi, so sánh vào một chỗ để tránh rải rác {{RoundingMode.HALF_UP}} khắp codebase. Với báo cáo tài chính, {{RoundingMode.HALF_EVEN}} (banker's rounding) là chuẩn kế toán, nhưng phải đồng bộ toàn hệ thống.`,
  follow: ['Tại sao BigDecimal("1.00").equals(BigDecimal("1.0")) trả false?', 'Khi nào dùng RoundingMode.HALF_EVEN thay vì HALF_UP?', 'Làm sao tránh bug lệch 1 xu khi tính tổng nhiều khoản với tỷ lệ phần trăm?'],
  tags: ['BigDecimal', 'money', 'rounding', 'equals', 'compareTo']
},
{
  id: 'collections-029',
  topic: 'collections',
  level: 'senior',
  q: '{{Iterator}} fail-fast, {{ConcurrentModificationException}} trong đơn luồng, {{removeIf}} và {{CopyOnWriteArrayList}}: khi nào hợp?',
  a: `**Tóm tắt:** Fail-fast iterator kiểm tra {{modCount}} và ném {{ConcurrentModificationException}} nếu collection bị sửa ngoài iterator. Fail-safe (weakly consistent) như {{ConcurrentHashMap}} hay snapshot như {{CopyOnWriteArrayList}} thì không ném nhưng có thể thấy dữ liệu cũ/không đầy đủ.

### Fail-fast cơ chế
- {{ArrayList}}, {{HashMap}}, {{HashSet}}... có field {{modCount}} tăng mỗi lần thay đổi cấu trúc.
- Iterator lưu {{expectedModCount}}; mỗi {{next()}}/{{remove()}} so sánh, lệch thì ném CME ngay.
- Đây là **best-effort detection**, không phải cơ chế đồng bộ: không đảm bảo phát hiện mọi trường hợp, nhất là đa luồng.
- CME có thể xảy ra cả trong **một thread** khi vừa for-each vừa {{list.remove(x)}} hoặc {{map.put}}.

### Dự đoán output
~~~java
List<String> l1 = new ArrayList<>(List.of("a", "b", "c"));
for (String s : l1) {
    if (s.equals("a")) l1.remove(s);
}
// Ném ConcurrentModificationException

List<String> l2 = new ArrayList<>(List.of("a", "b", "c"));
for (String s : l2) {
    if (s.equals("b")) l2.remove(s);
}
System.out.println(l2);
// Output: [a, c]   -> KHÔNG ném lỗi, và "c" không bao giờ được kiểm tra
~~~
Vì sao trường hợp 2 không lỗi: sau khi xoá "b", size còn 2, con trỏ {{cursor}} của iterator cũng là 2. {{hasNext()}} chỉ kiểm tra {{cursor != size}} nên trả về false và vòng lặp kết thúc trước khi {{next()}} kịp kiểm tra {{modCount}}. Code "chạy được" nhưng bỏ sót phần tử cuối, một bug im lặng nguy hiểm hơn cả CME.

### removeIf — giải pháp chuẩn
~~~java
orders.removeIf(Order::isExpired);
balances.entrySet().removeIf(e -> e.getValue().signum() == 0);
~~~
- {{removeIf}} (Java 8+) là O(n) tổng, dịch mảng một lần, an toàn cả về mặt logic và hiệu năng.
- Iterator.remove() vẫn hợp lệ khi cần logic phức tạp (audit trước khi xoá), nhưng mỗi lần xoá O(n) với ArrayList, tổng có thể O(n²).

### CopyOnWriteArrayList
- Mọi thao tác ghi ({{add}}, {{set}}, {{remove}}) tạo mảng mới rồi thay reference {{volatile}}; đọc không lock.
- Iterator là **snapshot**: không ném CME, không {{remove}}; có thể thấy dữ liệu cũ.
- Chi phí ghi O(n) cả về thời gian và bộ nhớ; ghi liên tục ⇒ GC pressure rất lớn.
- Hợp: danh sách listener/observer ít thay đổi, cấu hình read-mostly. Không hợp: cache, queue, collection lớn cập nhật thường xuyên.

### Cách tránh
- Sửa qua iterator ({{it.remove()}}, {{it.set()}}).
- Dùng {{removeIf}}, {{replaceAll}}, {{computeIfPresent}}.
- Với map, dùng {{entrySet().removeIf}}, {{map.compute}} thay vì remove trong for-each.
- Đa luồng: dùng collection concurrent đúng loại, hoặc copy sang list mới trước khi duyệt nếu chỉ cần snapshot.

### Pitfall
- Bắt CME rồi bỏ qua là che bug; CME là tín hiệu logic sai, không phải lỗi tạm thời để retry.
- Duyệt {{subList}} rồi sửa list gốc cũng gây CME.
- Sửa collection trong {{forEach}} của chính nó cũng CME (trừ concurrent).

> Senior tip: trong code review, ưu tiên {{removeIf}}/{{computeIfAbsent}} vì vừa gọn vừa tránh CME; với CHM, đừng dựa vào {{size()}} để dừng vòng lặp trong môi trường đồng thời — dùng kết quả trả về của thao tác hoặc đếm cục bộ. Với batch lớn, chuyển từ vòng {{Iterator.remove}} sang {{removeIf}} có thể giảm thời gian từ vài giây xuống vài mili-giây.`,
  follow: ['Tại sao for-each có thể gây ConcurrentModificationException?', 'Iterator.remove() khác collection.remove() thế nào?', 'CopyOnWriteArrayList iterator tại sao không ném CME?'],
  tags: ['Iterator', 'fail-fast', 'ConcurrentModificationException', 'removeIf', 'CopyOnWriteArrayList']
},
{
  id: 'collections-030',
  topic: 'collections',
  level: 'senior',
  q: 'Sắp xếp/so sánh: {{Comparator}} chain, nullsFirst/nullsLast, {{consistent with equals}}, {{TreeMap}} "mất" phần tử khi comparator sai?',
  a: `**Tóm tắt:** {{TreeMap}}/{{TreeSet}} dùng {{compare()}} để định nghĩa thứ tự, không dùng {{equals}}/{{hashCode}}. Nếu comparator không consistent with equals (trả 0 khi equals false), map/set coi hai key khác nhau là một và mất dữ liệu âm thầm. Comparator phải symmetric, transitive và lý tưởng là consistent with equals.

### Comparator chain
~~~java
// Sắp xếp: status ASC, createdAt DESC, name ASC
Comparator<Order> cmp = Comparator
    .comparing(Order::getStatus)
    .thenComparing(Order::getCreatedAt, Comparator.reverseOrder())
    .thenComparing(Order::getName, Comparator.nullsFirst(String::compareTo));
orders.sort(cmp);
~~~
- {{comparing}}: key extractor + optional key comparator.
- {{thenComparing}}: chain thêm comparator cho tie-break.
- {{nullsFirst}}/{{nullsLast}}: wrapper cho comparator con, null coi là nhỏ/lớn nhất.
- {{comparingInt}}/{{comparingLong}}/{{comparingDouble}} tránh boxing.

### consistent with equals
- Quy tắc: {{compare(a, b) == 0}} khi và chỉ khi {{a.equals(b)}}.
- Nếu comparator trả 0 nhưng equals false, {{TreeMap}} coi là cùng một key: {{put(b, ...)}} ghi overwrite value của {{a}}, {{size()}} không tăng, {{get(b)}} trả value của a.
- Ví dụ kinh điển: {{new TreeSet<>(Comparator.comparing(String::length))}} — "ab" và "cd" cùng length 2 nên chỉ giữ một.
- {{BigDecimal}} là cái bẫy nổi tiếng: {{new BigDecimal("1.0").equals(new BigDecimal("1.00"))}} là false nhưng {{compareTo}} là 0 ⇒ dùng làm key TreeMap sẽ gộp.

### TreeMap "mất" phần tử
- {{TreeMap}} không dùng {{equals}}/{{hashCode}} để định danh key; nó dùng {{compare()}}.
- Nếu comparator không symmetric hoặc transitive, cây đỏ-đen vẫn cân bằng nhưng đặt và tìm phần tử sai chỗ: {{get}} trả null cho key vừa put, {{containsKey}} lúc đúng lúc sai.
- Null: {{TreeMap}} không cho key null trừ khi comparator xử lý null; natural ordering ném NPE.
- {{subMap}}, {{headMap}}, {{tailMap}} là view — thay đổi view ảnh hưởng map gốc.

### Pitfall
- Comparator dựa trên field nullable mà không xử lý null: {{a.getName().compareTo(b.getName())}} ném NPE hoặc vi phạm transitivity khi null xen vào.
- Logic so sánh phức tạp sai: {{(a, b) -> a.x < b.x ? -1 : 1}} (quên case bằng nhau trả 0).
- So sánh float/double với NaN: {{Double.compare}} xử lý NaN, nhưng tự viết {{a < b ? -1 : 1}} sai với NaN.
- {{Arrays.sort(int[])}} dùng Dual-Pivot Quicksort (không stable), nhưng với primitive thì stable không có ý nghĩa vì hai số bằng nhau không phân biệt được. Sắp xếp object ({{Arrays.sort(Object[])}}, {{List.sort}}) dùng TimSort và **stable**, nên sắp theo nhiều khoá bằng nhiều lần sort liên tiếp vẫn đúng.

### Bên trong: TimSort phát hiện comparator sai
{{List.sort}}/{{Arrays.sort}} cho object dùng TimSort, giả định comparator tuân thủ hợp đồng (đối xứng, bắc cầu). Khi phát hiện vi phạm trong lúc gộp các đoạn đã sắp xếp, nó ném {{IllegalArgumentException: Comparison method violates its general contract!}} — nhưng **chỉ khi dữ liệu đủ lớn và rơi đúng thứ tự** (thường từ vài chục phần tử trở lên), nên lỗi hay lọt qua test nhỏ. Nguồn vi phạm hay gặp: trừ hai số để so sánh ({{a - b}} tràn số với int lớn), comparator không xử lý null nhất quán, so sánh theo field có thể thay đổi trong lúc sắp xếp, so sánh double có NaN. Dùng {{Comparator.comparingInt}}, {{Integer.compare}}, {{Comparator.nullsLast(...)}} thay vì tự viết.

### Ví dụ đời thực
Báo cáo xếp hạng đại lý thỉnh thoảng lỗi 500 với thông báo "Comparison method violates its general contract!" — chỉ vào cuối tháng khi danh sách có khoảng 5.000 đại lý. Comparator tự viết là {{(a, b) -> (int)(a.revenue() - b.revenue())}} với doanh thu kiểu {{long}} (đơn vị đồng): hiệu số vượt phạm vi int nên ép kiểu ra dấu sai. Sửa thành {{Comparator.comparingLong(Agent::revenue).reversed().thenComparing(Agent::code)}} — thêm khoá phụ để thứ tự ổn định khi doanh thu bằng nhau. Test mới sinh ngẫu nhiên 10.000 phần tử với giá trị cực lớn để tái hiện.

### Trả lời mẫu khi phỏng vấn
"Comparator phải tuân thủ hợp đồng: đối xứng, bắc cầu và nhất quán. Tôi xây comparator bằng các factory như comparing, comparingLong, thenComparing, reversed, và nullsFirst hoặc nullsLast để xử lý null rõ ràng, thay vì tự viết phép trừ, vì trừ hai số lớn có thể tràn số và đổi dấu. Nếu comparator vi phạm hợp đồng, TimSort có thể ném IllegalArgumentException, nhưng chỉ khi dữ liệu đủ lớn nên lỗi hay lọt test. Với TreeMap và TreeSet thì nguy hiểm hơn: chúng dùng compare chứ không dùng equals, nên nếu compare trả về 0 cho hai phần tử khác nhau, phần tử sau ghi đè phần tử trước, mất dữ liệu âm thầm. Vì vậy tôi luôn thêm khoá phụ như id vào cuối chuỗi so sánh để chỉ trả 0 khi thật sự là cùng một phần tử."

> Senior tip: khi dùng comparator tùy biến, viết unit test khẳng định các key **khác nhau** vẫn là phần tử riêng biệt; đây là loại bug không ném exception, chỉ làm mất record và cực khó phát hiện. Với BigDecimal, luôn normalize ({{stripTrailingZeros}}) trước khi làm key. Với data lớn, dùng {{comparingInt}}/{{comparingLong}} để tránh boxing. Đừng tự viết logic so sánh phức tạp — chain các comparator có sẵn.`,
  follow: ['Comparable và Comparator khác nhau thế nào?', 'Tại sao TreeMap không dùng equals/hashCode?', 'Comparator không consistent with equals gây ra vấn đề gì?'],
  tags: ['Comparator', 'Comparable', 'TreeMap', 'TreeSet', 'sorting']
},
{
  id: 'modern-028',
  topic: 'modern',
  level: 'lead',
  q: 'Virtual threads (Java 21) cho service I/O-bound: khi nào dùng, chuyển đổi thế nào, pinning, {{ThreadLocal}}, giới hạn concurrency bằng {{Semaphore}}?',
  a: `**Tóm tắt:** Virtual thread (JEP 444, chính thức từ Java 21) là thread do JVM quản lý: rẻ tới mức tạo một thread cho mỗi request. Khi code block ở I/O, JVM "tháo" virtual thread khỏi carrier thread (một platform thread trong ForkJoinPool nội bộ) để carrier chạy việc khác. Dùng cho service **I/O-bound** có nhiều request đồng thời, viết code blocking bình thường mà vẫn scale. Ba điều phải canh: **pinning** (JDK 21–23: block bên trong {{synchronized}} giữ luôn carrier; JDK 24 đã sửa bằng JEP 491), **ThreadLocal** (mỗi virtual thread một bản, hàng triệu thread là hàng triệu bản), và **giới hạn đồng thời tới downstream** bằng {{Semaphore}} vì không còn thread pool nào chặn hộ bạn.

### Vì sao virtual thread scale được
| | Platform thread | Virtual thread |
|---|---|---|
| Ánh xạ | 1:1 với thread của OS | Nhiều virtual thread trên vài carrier (mặc định số carrier = số CPU) |
| Bộ nhớ | Stack cố định (thường 1 MB dự trữ) | Stack nằm trên heap, chỉ lớn bằng phần đang dùng |
| Khi block I/O | OS thread nằm chờ | Unmount, carrier rảnh để chạy virtual thread khác |
| Số lượng thực tế | Vài nghìn | Hàng trăm nghìn tới hàng triệu |

Với thread pool 200 thread, service gọi API mất 200 ms chỉ phục vụ tối đa khoảng 1.000 request/giây dù CPU rảnh (định luật Little: 200 / 0,2 s). Với virtual thread, giới hạn đó biến mất; giới hạn thật trở thành downstream (DB, API đối tác) và CPU.

### Chuyển đổi
~~~java
// Thay pool cố định bằng một virtual thread cho mỗi task
try (ExecutorService exec = Executors.newVirtualThreadPerTaskExecutor()) {
    List<Future<Quote>> fs = providers.stream()
        .map(p -> exec.submit(() -> p.quote(req)))   // code blocking bình thường
        .toList();
    // ... get() từng future có timeout
}   // close() chờ mọi task xong
~~~
- Spring Boot **3.2+**: {{spring.threads.virtual.enabled=true}} để Tomcat/Jetty xử lý request, {{@Async}}, scheduler và listener Kafka/Rabbit chạy trên virtual thread.
- **Không pool virtual thread**: tạo mới cho mỗi task là đúng thiết kế; pool 10 virtual thread chỉ tái tạo giới hạn cũ.
- CPU-bound (nén, mã hoá, tính toán) không được lợi gì: vẫn chỉ có số core đó.

### Pinning
Virtual thread bị **pin** khi không thể unmount, nên carrier bị giữ trong lúc nó block:
- JDK 21–23: block (I/O, {{sleep}}, {{wait}}) **bên trong {{synchronized}}**. Cách xử lý ở các bản này: đổi sang {{ReentrantLock}} ở chỗ có I/O trong vùng khoá, hoặc nâng thư viện (driver JDBC, HTTP client) lên bản đã bỏ synchronized quanh I/O.
- JDK 24+ (JEP 491): {{synchronized}} không còn pin nữa.
- Mọi phiên bản: đang ở trong native frame (JNI) hoặc một số thao tác file của OS.
- Phát hiện: JFR event {{jdk.VirtualThreadPinned}}; JDK 21–23 có thêm {{-Djdk.tracePinnedThreads=full}}. Triệu chứng: throughput không tăng, **CPU thấp** nhưng mọi carrier đều đang bị chiếm, p99 tăng theo số request đồng thời.

### ThreadLocal và ScopedValue
- Mỗi virtual thread có bản ThreadLocal riêng. Cache object đắt (buffer, {{SimpleDateFormat}}) trong ThreadLocal vốn để tái sử dụng giữa các request trên cùng thread pool, giờ mất tác dụng và tốn bộ nhớ gấp bội.
- Context nhỏ (traceId, user) trong ThreadLocal vẫn chạy đúng, nhớ {{remove()}}.
- {{ScopedValue}}: incubator ở Java 20, preview Java 21–24, **chính thức từ Java 25**; truyền context bất biến theo phạm vi, rẻ và không rò.

### Giới hạn đồng thời tới downstream
~~~java
private final Semaphore dbPermits = new Semaphore(20);   // bằng maximumPoolSize của HikariCP

Order load(long id) throws InterruptedException {
    if (!dbPermits.tryAcquire(500, TimeUnit.MILLISECONDS)) {
        throw new ServiceBusyException("DB busy");          // fail nhanh thay vì xếp hàng vô hạn
    }
    try { return repo.findById(id); }
    finally { dbPermits.release(); }
}
~~~
Không có semaphore, 10.000 virtual thread cùng chờ 20 connection: request xếp hàng trong pool connection tới timeout, p99 tăng vọt, và API đối tác bị dội gấp nhiều lần.

### Ví dụ đời thực
Service tổng hợp báo giá vận chuyển gọi 6 hãng (200–800 ms mỗi lời gọi), Tomcat 200 thread, peak 900 request/giây: thread pool cạn, p99 4,8 giây dù CPU chỉ 35%. Bật {{spring.threads.virtual.enabled=true}} trên JDK 21 lần đầu **không cải thiện**: JFR có hàng nghìn {{jdk.VirtualThreadPinned}} từ một HTTP client cũ dùng {{synchronized}} quanh việc đọc socket. Nâng client lên bản dùng ReentrantLock, thêm {{Semaphore}} 50 cho mỗi hãng theo hợp đồng rate limit. Kết quả: p99 còn 1,1 giây, CPU 60%, số thread OS giảm từ 260 xuống 40. Sau khi lên JDK 25, team bỏ được lo lắng về synchronized nhưng giữ nguyên semaphore.

### Trả lời mẫu khi phỏng vấn
"Virtual thread chính thức từ Java 21, rẻ tới mức tạo một thread cho mỗi request. Khi code block ở I/O, JVM tháo virtual thread khỏi carrier để carrier chạy việc khác, nên service I/O-bound phục vụ được nhiều request đồng thời hơn hẳn với code blocking bình thường, không cần reactive. Nó không giúp gì cho việc nặng CPU. Để chuyển đổi tôi dùng newVirtualThreadPerTaskExecutor hoặc spring.threads.virtual.enabled từ Spring Boot 3.2, và không pool virtual thread. Ba điểm tôi luôn kiểm tra: pinning, trên JDK 21 đến 23 là block bên trong synchronized, tôi đo bằng JFR event VirtualThreadPinned và thay bằng ReentrantLock hoặc nâng thư viện, còn JDK 24 đã sửa; ThreadLocal, vì mỗi virtual thread một bản nên không dùng ThreadLocal để cache object đắt; và giới hạn đồng thời, vì không còn thread pool chặn hộ, tôi dùng Semaphore khớp với connection pool hoặc rate limit của đối tác."

> Senior tip: lợi ích của virtual thread là **throughput khi nhiều request cùng chờ I/O**, không phải làm một request nhanh hơn. Trước khi bật, tôi đo ba thứ: số request đồng thời lúc peak, số thread OS và JFR pinning; sau khi bật, việc đầu tiên là đặt semaphore cho từng downstream, vì sự cố hay gặp nhất là chính service của mình dội sập DB hoặc đối tác bằng lượng đồng thời mà trước đây thread pool đã vô tình giới hạn.`,
  follow: ['Pinning là gì, khi nào xảy ra trên JDK 21 và JEP 491 ở JDK 24 thay đổi gì?', 'Vì sao vẫn phải giới hạn đồng thời bằng Semaphore dù virtual thread gần như miễn phí?', 'ThreadLocal dùng để cache object đắt có vấn đề gì khi chuyển sang virtual thread?'],
  tags: ['virtual thread', 'pinning', 'ThreadLocal', 'ScopedValue', 'Semaphore']
},
{
  id: 'modern-029',
  topic: 'modern',
  level: 'senior',
  q: '{{Optional}} đúng/sai cách, {{Stream}} anti-pattern trên production, {{peek}}, {{collect(toMap)}} trùng key?',
  a: `**Tóm tắt:** {{Optional}} là **kiểu trả về** để buộc caller xử lý "có thể không có"; không dùng làm field, tham số, hay phần tử collection. Stream anti-pattern chính là side-effect (đổ kết quả vào list bên ngoài, dùng {{peek}} làm nghiệp vụ). {{peek}} chỉ để debug, JVM có thể bỏ qua. {{collect(toMap)}} ném {{IllegalStateException}} khi key trùng nếu không chỉ định merge function.

### Optional đúng cách
- Method trả về có thể không có kết quả: {{Optional<User> findById(long id)}}.
- Chuỗi xử lý: {{optional.map(User::email).filter(s -> !s.isBlank()).orElse(DEFAULT)}}.
- {{orElseThrow(() -> new NotFoundException(...))}} để biến vắng mặt thành lỗi rõ ràng.
- {{ifPresent}}, {{ifPresentOrElse}} (Java 9), {{stream()}} (Java 9) để chuyển thành stream.

### Không nên dùng Optional
- **Field** của entity/DTO: không Serializable, khó map JPA/Jackson (cần module), tăng phức tạp; dùng null + validate.
- **Tham số method**: caller phải bọc {{Optional.of(...)}} vô ích; dùng overload hoặc validate null.
- **Collection**: {{List<Optional<T>}} thường là dấu hiệu nên lọc bỏ null; trả list rỗng thay vì Optional rỗng.
- **Primitive**: dùng {{OptionalInt}}/{{OptionalLong}}/{{OptionalDouble}} để tránh boxing.

### orElse vs orElseGet
~~~java
// orElse: tham số được tính NGAY, kể cả khi Optional có giá trị
User u1 = opt.orElse(loadFromDb());       // luôn gọi DB → lãng phí

// orElseGet: supplier chỉ gọi khi rỗng
User u2 = opt.orElseGet(() -> loadFromDb());
~~~
- {{orElse}} nhận giá trị đã có; nếu tạo object/đọc DB thì dùng {{orElseGet}}.
- {{orElseThrow()}} (Java 10) ném {{NoSuchElementException}}; bản có supplier cho exception tùy biến.

### Stream anti-pattern
- **Side-effect**: lambda thay đổi trạng thái bên ngoài (thêm vào list, tăng biến đếm, ghi log, gọi DB). Chạy được ở stream tuần tự nhưng **sai khi chuyển sang parallel** (mất phần tử, tổng sai, có thể ném exception).
- Dùng {{forEach(x -> list.add)}} hoặc mảng một phần tử {{int[] total}}: cả hai đều là side-effect.
- Viết lại bằng {{map(...).toList()}}, {{collect(...)}}, {{mapToLong(...).sum()}}, {{reduce}}.

### peek chỉ để debug
- {{peek}} là intermediate operation dùng để xem dữ liệu giữa pipeline; JVM được phép bỏ qua nó (ví dụ {{count()}} trên nguồn biết trước size từ Java 9 không chạy pipeline).
- Không dùng {{peek}} để làm logic nghiệp vụ (cập nhật trạng thái, ghi DB) — nếu terminal operation đổi, logic có thể biến mất.

### collect(toMap) và duplicate key
~~~java
// Sai: trùng key → IllegalStateException
Map<String, User> byEmail = users.stream()
    .collect(Collectors.toMap(User::email, u -> u));

// Đúng: chọn bản ghi thắng
Map<String, User> byEmail = users.stream()
    .collect(Collectors.toMap(
        User::email,
        u -> u,
        (a, b) -> b,              // hoặc merge theo updatedAt
        LinkedHashMap::new));     // giữ thứ tự nếu cần
~~~
- Key trùng: bản không có merge function ném {{IllegalStateException}} ("Duplicate key ...", từ Java 9 kèm cả hai value).
- Value null: **NPE** — bản 2 tham số kiểm tra {{requireNonNull(value)}}, bản có merge function dùng {{Map.merge}} vốn cấm value null; lọc bằng {{filter(Objects::nonNull)}} hoặc thay bằng sentinel.
- Key null: {{HashMap}} vẫn nhận (hash của null là 0) nhưng {{ConcurrentHashMap}} thì không; đừng dựa vào key null, hãy lọc hoặc đảm bảo key không null.

### Pitfall production
- Dùng {{Optional.get()}} không kiểm tra ⇒ {{NoSuchElementException}}, tương đương null nhưng khó debug hơn. Dùng {{orElseThrow}} với message.
- {{opt.isPresent()}} rồi {{get()}} là code null-check trá hình; ưu tiên {{map}}/{{ifPresent}}.
- So sánh {{opt == Optional.empty()}} sai; dùng {{isEmpty()}} (Java 11) hoặc {{isPresent()}}.
- {{Optional}} trong entity JPA gây lỗi mapping; trong Jackson cần {{Jdk8Module}}.
- Lạm dụng {{Optional}} cho mọi thứ làm code rối và chậm; đôi khi trả null có kiểm soát + {{@Nullable}} lại thực dụng hơn.

> Senior tip: dùng {{Optional}} ở tầng service/repository, còn ở tầng controller/DTO hãy chuyển về giá trị hoặc lỗi rõ ràng. Đừng bọc Optional quanh collection — trả {{List.of()}} rỗng để caller không phải xử lý hai tầng "không có". Khi stream, ưu tiên {{toList()}} cho kết quả bất biến, {{toCollection(ArrayList::new)}} khi cần sửa. Với toMap, luôn giả định key có thể trùng và value có thể null; viết merge function rõ ràng (ví dụ giữ bản mới nhất theo timestamp) thay vì để exception nổ ở production. Với báo cáo, dùng {{LinkedHashMap}}/{{TreeMap}} để thứ tự ổn định giữa các lần chạy.`,
  follow: ['Tại sao không nên dùng Optional làm field?', 'peek() có nên dùng để sửa object không, tại sao?', 'Collectors.toMap ném IllegalStateException khi nào và giải quyết thế nào?'],
  tags: ['Optional', 'Stream', 'peek', 'toMap', 'anti-pattern']
},
{
  id: 'modern-030',
  topic: 'modern',
  level: 'lead',
  q: 'Nâng cấp codebase Java 8 lên Java 21: {{Text blocks}}, {{var}}, {{switch expression}}, {{SequencedCollection}}, chú ý gì?',
  a: `**Tóm tắt:** Nâng cấp từ Java 8 lên Java 21 là một dự án có kế hoạch, không phải đổi version trong pom. Java 21 có text blocks, var, switch expression, pattern matching, virtual thread, SequencedCollection. Nâng cấp từng bước 8 → 11 → 17 → 21, chú ý module system, strong encapsulation, reflection, deprecated API.

### Text blocks (Java 15)
- Mở bằng ba dấu nháy kép + xuống dòng bắt buộc; đóng bằng ba dấu nháy kép.
- Incidental whitespace (indentation chung nhỏ nhất + whitespace cuối dòng) được bỏ; dùng semantics của {{stripIndent}}.
- Escape vẫn hoạt động; có {{ \\s }} để giữ space cuối; không cần escape dấu nháy kép đơn lẻ.
- Có {{formatted}} hoặc {{String.format}}; không có interpolation trực tiếp.
- Rất hợp SQL/JSON/HTML/XML; nhưng **đừng** ghép dữ liệu người dùng vào SQL text block — vẫn dùng PreparedStatement.

### var (Java 10)
- Suy luận kiểu lúc compile từ initializer; không phải dynamic typing, không có chi phí runtime.
- Chỉ dùng cho **biến local**, cả trong for/foreach, try-with-resources; không dùng cho field, tham số, return type.
- Không dùng khi không có initializer: {{var x;}} sai; {{var x = null;}} cũng sai.
- Nên dùng khi kiểu dài và lộ rõ từ vế phải: {{var users = new ArrayList<User>();}}.
- Không nên khi kiểu không rõ: {{var result = service.process();}} — người đọc phải nhảy vào method. Ưu tiên tên biến mô tả kiểu hoặc giữ kiểu tường minh.

### Switch expression (Java 14)
- Dùng {{->}} không fallthrough, không cần {{break}}; có thể dùng block + {{yield}}.
- Bắt buộc bao phủ hết (exhaustive) cho expression; enum/String phải có default nếu không đủ.
- Selector null: ném NPE nếu không có {{case null}} (với switch trên reference type).
- Có thể trả giá trị trực tiếp, giảm biến tạm và lỗi gán thiếu nhánh.
- Switch statement vẫn có thể dùng cú pháp cũ; nên chuyển dần sang arrow để tránh fallthrough.
- Với enum, thêm hằng số mới mà quên case sẽ lỗi compile ở switch expression — lợi ích lớn khi refactor.

### SequencedCollection (Java 21)
- {{getFirst()}} / {{getLast()}}: lấy phần tử đầu/cuối (ném {{NoSuchElementException}} nếu rỗng).
- {{addFirst(E)}} / {{addLast(E)}}: thêm đầu/cuối (optional, {{UnsupportedOperationException}} nếu immutable).
- {{removeFirst()}} / {{removeLast()}}: xoá đầu/cuối (optional).
- {{reversed()}}: trả **view** đảo ngược (read-only, không copy, thay đổi gốc ảnh hưởng view).
- Implementer chính: {{List}}, {{Deque}}, {{LinkedHashSet}}, {{LinkedHashMap}}, {{TreeSet}}, {{TreeMap}}.
- **Không implement**: {{HashSet}}, {{HashMap}}, {{ConcurrentHashMap}} (vì không đảm bảo thứ tự ổn định).

### Lộ trình migrate
1. **Đo baseline**: test suite, JMH, heap/GC log, dependency tree.
2. **8 → 11**: chạy {{jdeps --jdk-internals}}, thay API bị bỏ (JAXB, JAX-WS, CORBA, Nashorn), cập nhật TLS, xử lý {{--illegal-access}} (11 còn cho phép, 17 thì chặt).
3. **11 → 17**: dọn reflection vào JDK internals ({{--add-opens}}), nâng Spring Boot 3 nếu dùng, kiểm tra thư viện bytecode (Lombok, CGLIB, Mockito) tương thích.
4. **17 → 21**: tận dụng pattern matching/record, thử virtual thread ở nơi I/O-bound nhưng **đo lại** (pin carrier thread với synchronized trước Java 24; connection pool cần điều chỉnh).
5. **CI**: chạy song song JDK cũ/mới, test integration, smoke test trên staging với tải thật.
6. **Rollout**: container image mới, có thể blue-green; theo dõi GC, latency p99, memory.

### Pitfall
- Nhảy thẳng 8 → 21 làm gỡ lỗi khó hơn nhiều; đi từng LTS giúp khoanh vùng.
- Reflection/bytecode instrumentation (agent APM, Lombok cũ) là chỗ vỡ nhiều nhất.
- Thư viện cũ dùng {{sun.misc.Unsafe}}: vẫn chạy ở 17/21, nhưng các method truy cập bộ nhớ bị deprecate for removal từ Java 23 (JEP 471) và in cảnh báo runtime từ 24 (JEP 498); nên lên kế hoạch chuyển sang {{VarHandle}}/FFM API.
- Virtual thread không nhanh hơn cho CPU-bound; đừng thay toàn bộ thread pool.
- {{--add-opens}} là giải pháp tạm; hãy sửa code/thư viện.
- Kiểm tra TLS, chứng chỉ, và độ tương thích của driver DB.

> Senior tip: coi migrate JDK là dự án có kế hoạch, không phải đổi version trong pom. Bắt đầu bằng việc chạy test trên JDK mới trong CI **trước khi** đổi production; dùng jdeprscan để tìm API sắp bỏ và OpenRewrite để tự động hóa một phần. Đừng dùng preview feature trong production — chúng có thể đổi hoặc bị bỏ, và class biên dịch với preview chỉ chạy trên đúng bản JDK đó. Với text blocks, nhớ bỏ indentation theo {{stripIndent}}; với var, chỉ dùng khi vế phải đã nói rõ kiểu; với switch expression, thêm {{case null}} nếu dữ liệu có thể null; với SequencedCollection, {{reversed()}} là view không phải copy.`,
  follow: ['var có thay đổi kiểu runtime không?', 'switch expression khác switch statement thế nào?', 'Khi nào SequencedCollection hữu ích hơn get(0)/get(size-1)?'],
  tags: ['Java 21', 'text blocks', 'var', 'switch expression', 'SequencedCollection']
},
{
  id: 'modern-031',
  topic: 'modern',
  level: 'mid',
  q: 'Sequenced collections (Java 21) thêm gì so với List/Set cũ, và giải quyết vấn đề gì khi bạn viết code xử lý collection có thứ tự?',
  a: `**Tóm tắt:** Java 21 (JEP 431) thêm interface SequencedCollection (và SequencedSet/SequencedMap) chuẩn hoá thao tác đầu/cuối và đảo chiều: getFirst(), getLast(), addFirst/addLast, removeFirst/removeLast, reversed(); reversed() trả về **view** không copy.

### Bối cảnh: trước Java 21 mỗi collection một kiểu
- ArrayList: get(0), get(size()-1).
- ArrayDeque: peekFirst/peekLast, pollFirst/pollLast.
- LinkedHashSet/LinkedHashMap: trước đây không có cách lấy phần tử đầu/cuối trực tiếp (đầu phải dùng iterator().next(), cuối phải duyệt hết).
- Kết quả: code generic xử lý "collection có thứ tự" rất lộn xộn, phải instanceof và cast.

### Vì sao cần SequencedCollection
- Thống nhất API cho mọi collection có thứ tự (List, Deque, LinkedHashSet, SortedSet...).
- getFirst()/getLast() cùng một tên cho mọi loại, thay vì get(0), peekFirst(), iterator().next() tuỳ loại; với LinkedHashSet/LinkedHashMap, lấy phần tử cuối từ O(n) thành O(1).
- reversed() cho phép duyệt ngược mà không cấp phát list mới.

### Cách hoạt động
- SequencedCollection extends Collection, thêm getFirst/getLast/addFirst/addLast/removeFirst/removeLast/reversed.
- SequencedSet extends Set + SequencedCollection.
- SequencedMap extends Map với firstEntry, lastEntry, pollFirstEntry, putFirst/putLast, sequencedKeySet/sequencedValues/sequencedEntrySet, reversed.
- reversed() trả về **view** đảo thứ tự: thay đổi view phản ánh vào gốc và ngược lại; không copy.

### Ví dụ
~~~java
SequencedCollection<String> c = new ArrayList<>(List.of("a","b","c"));
System.out.println(c.getFirst());   // a
System.out.println(c.getLast());    // c
for (String s : c.reversed()) { // c, b, a (view)
    System.out.println(s);
}
c.addFirst("z");                // gốc thành [z,a,b,c]
~~~

### Trade-off / khi dùng
- Dùng reversed() để iterate ngược list lớn mà không tốn O(n) bộ nhớ.
- Nếu cần snapshot bất biến, copy: new ArrayList<>(c.reversed()).

### Pitfall production
- reversed() là view: sort/reverse view rồi mutate gốc sẽ ảnh hưởng collection gốc → bug khó tìm.
- Set không có index: không gọi get(i) trên SequencedSet.
- Concurrent modification: reversed() view cũng fail-fast như gốc.
- SequencedMap.reversed() đảo entry order; cẩn thận khi serialize JSON expecting insertion order.

> Senior tip: dùng SequencedCollection trong API nội bộ thay vì List khi cần first/last; reversed() là view nên nếu trả ra ngoài, copy để tránh caller mutate gốc. Trong code review, tìm get(size()-1) và thay bằng getLast().`,
  follow: ['reversed() có phải copy không, và rủi ro gì khi trả nó ra ngoài?', 'SequencedMap thêm những thao tác nào cho LinkedHashMap và TreeMap?'],
  tags: ['Java 21', 'SequencedCollection', 'collections']
},
{
  id: 'modern-032',
  topic: 'modern',
  level: 'senior',
  q: 'Record patterns và switch pattern exhaustiveness với sealed class hoạt động thế nào?',
  a: `**Tóm tắt:** Record pattern cho phép destructure record trực tiếp trong instanceof/switch; với sealed class, compiler kiểm tra exhaustiveness — thiếu case là lỗi compile, thêm subtype mới bắt buộc cập nhật switch.

### Bối cảnh: trước Java 21
- Phải instanceof + cast + gọi accessor: if (o instanceof Point p) { int x = p.x(); ... }.
- Switch trên enum/sealed không được kiểm tra đầy đủ → runtime default catch-all.

### Record pattern
- if (o instanceof Point(int x, int y)) { ... } destructure ngay.
- Lồng nhau: case Line(Point p1, Point p2) -> ...
- Guarded pattern: case Circle c when c.r() > 10 -> ...

### Sealed + exhaustiveness
- sealed interface Shape permits Circle, Rect, Triangle.
- switch (shape) { case Circle c -> ...; case Rect r -> ...; case Triangle t -> ...; } không cần default; compiler biết hết subtype.
- Nếu thêm subtype mới vào permits, mọi switch không default sẽ lỗi compile → refactor an toàn.

### Pitfall production
- Switch trên non-sealed type cần default (hoặc non-exhaustive).
- Record pattern chỉ áp dụng record, không phải mọi class.
- Pattern matching cho primitive còn hạn chế; null case phải xử lý (case null ->).
- Preview/instability: syntax ổn định từ Java 21.

### Khi nào dùng
- Mô hình domain với sealed hierarchy + record → algebraic data type style.
- Parser/AST/protocol message.

> Senior tip: kết hợp sealed + record + switch expression để compiler bắt sót case khi domain mở rộng; thêm case null nếu input có thể null; tránh default "silent" nuốt case mới.`,
  follow: ['Sealed class là gì?', 'Khi nào cần default trong switch?'],
  tags: ['Java 21', 'record patterns', 'sealed', 'pattern matching']
},
{
  id: 'modern-033',
  topic: 'modern',
  level: 'senior',
  q: 'String templates (JEP 430) hiện trạng ra sao? Có nên dùng trong production không?',
  a: `**Tóm tắt:** String templates là preview ở JDK 21 (JEP 430), preview lần hai ở JDK 22 (JEP 459), rồi bị rút lại và **gỡ bỏ hoàn toàn từ JDK 23** để thiết kế lại; hiện không có trong bất kỳ bản JDK nào. KHÔNG dùng trong production. Dùng text blocks + String.formatted/MessageFormat.

### Vì sao cần biết
- Nhiều tutorial cũ còn nhắc \\"\\"\\" là "string templates" — sai: đó là text blocks (Java 15).
- Trạng thái preview/withdrawn thay đổi giữa JDK; production chỉ dùng API stable.

### Làm an toàn
- Text blocks cho SQL/JSON nhiều dòng.
- String.formatted hoặc MessageFormat cho nội suy biến.
- Không bật --enable-preview trong production build.

### Pitfall
- Bật preview trong prod → class chỉ chạy trên JDK đúng version, deploy fail.
- Nhầm text block với string templates → kỳ vọng interpolation không có.
- Preview feature có thể đổi/bị bỏ giữa release.

### Khi nào preview OK
- Thử nghiệm local/CI; không commit vào main branch production.

> Senior tip: theo dõi JEP nhưng chỉ merge feature khi stable; ghi rõ java.version/target trong pom; review dependency preview.`,
  follow: ['Text block vs string templates?', 'Khi nào bật preview?'],
  tags: ['Java 21', 'string templates', 'preview', 'JEP']
},
{
  id: 'modern-034',
  topic: 'modern',
  level: 'senior',
  q: 'Scoped values và structured concurrency (preview) giải quyết vấn đề gì của ThreadLocal?',
  a: `**Tóm tắt:** ScopedValue là ThreadLocal bất biến với phạm vi lexical; StructuredTaskScope quản lý task con theo cấu trúc → dễ hủy, propagate exception. Cả hai còn preview ở JDK 21 (LTS). ScopedValue chính thức từ JDK 25 (JEP 506); StructuredTaskScope vẫn là preview và đã được thiết kế lại API ở JDK 25 (JEP 505).

### ThreadLocal vấn đề
- Mutable: bất kỳ code nào có thể set → khó truy vết.
- Dễ leak nếu không remove() trong finally.
- Không tự propagate sang thread con (trừ InheritableThreadLocal, vốn copy giá trị khi tạo thread); với virtual threads số lượng lớn → tốn bộ nhớ (mỗi VT có map ThreadLocal riêng).

### ScopedValue
- ScopedValue.where(KEY, val).run(() -> ...) → value chỉ tồn tại trong block; immutable.
- Child thread (structured) tự inherit; không leak ra ngoài scope.
- Phù hợp request context (userId, traceId) với virtual threads.

### StructuredTaskScope
- fork(Callable) tạo subtask; join() chờ; cancel khi một fail hoặc timeout.
- Exception propagate rõ ràng; lifecycle gắn với scope block.

### Pitfall
- Trên JDK 21 cả hai là preview (cần --enable-preview) → không dùng cho production; trên JDK 25 dùng được ScopedValue.
- StructuredTaskScope vẫn preview: API ở JDK 25 (StructuredTaskScope.open + Joiner) khác hẳn JDK 21.
- ThreadLocal vẫn cần cho thư viện chưa hỗ trợ ScopedValue.

> Senior tip: trên JDK 21, production vẫn dùng ThreadLocal + ExecutorService có remove() trong finally; khi lên JDK 25, chuyển context request (userId, traceId) sang ScopedValue. Khi migrate sang virtual thread, đo memory của ThreadLocal.`,
  follow: ['ThreadLocal leak ở đâu?', 'Virtual threads + ThreadLocal?'],
  tags: ['Java 21', 'scoped values', 'structured concurrency', 'preview']
},
{
  id: 'modern-035',
  topic: 'modern',
  level: 'senior',
  q: 'Generational ZGC (Java 21) cải thiện gì so với ZGC cũ?',
  a: `**Tóm tắt:** Generational ZGC thêm young/old generation → giảm CPU overhead và pause time cho workload có nhiều short-lived objects; bật bằng -XX:+UseZGC -XX:+ZGenerational (JDK 21); JDK 23+ mặc định generational.

### Vì sao cần
- ZGC cũ non-generational quét toàn heap mỗi cycle → CPU cao với object churn lớn.
- Weak generational hypothesis: đa số object chết trẻ → thu gom young gen thường xuyên, old gen ít.

### Cách bật
- JDK 21/22: -XX:+UseZGC -XX:+ZGenerational.
- JDK 23+: -XX:+UseZGC (generational mặc định).
- So sánh: G1 default an toàn; ZGC cho latency-sensitive (pause < 1ms); Shenandoah tương tự ZGC.

### Trade-off
- ZGC tốn CPU/heap overhead; pause thấp nhưng throughput có thể thấp hơn G1.
- Generational giảm overhead so với non-gen ZGC.

### Pitfall production
- Chọn GC theo workload: throughput vs latency; đo với tải thật.
- ZGC vẫn compact heap (di chuyển object đồng thời với ứng dụng), nên không phân mảnh; cái giá là CPU cho barrier và cần heap dư: nếu tốc độ cấp phát vượt tốc độ GC dọn, thread ứng dụng bị chặn (allocation stall), triệu chứng là latency tăng dù pause log vẫn dưới 1 ms.
- JDK 24 đã bỏ hẳn chế độ non-generational (JEP 490); cờ -XX:+ZGenerational không còn ý nghĩa.
- GC log (-Xlog:gc*) để phân tích; không đổi GC mà không đo.

> Senior tip: bắt đầu G1 default; chuyển ZGC chỉ khi p99 latency yêu cầu và có benchmark; generational ZGC là bước tiến nhưng vẫn cần tuning heap size và allocation rate.`,
  follow: ['So sánh G1 vs ZGC?', 'Khi nào dùng Shenandoah?'],
  tags: ['Java 21', 'ZGC', 'GC', 'performance']
},
{
  id: 'core-035',
  topic: 'core',
  level: 'senior',
  q: 'Lộ trình nâng cấp dự án Java 8/11 lên Java 21 gồm những bước nào? jdeps, --add-opens, thư viện cũ?',
  a: `**Tóm tắt:** Nâng Java 8/11 lên 21 có ba lớp việc: (1) **build và thư viện**: JDK 21 trong CI, nâng các plugin và thư viện dùng bytecode/reflection (Lombok, Mockito, ByteBuddy, APM agent) lên bản hỗ trợ class file 65; (2) **API và encapsulation**: tìm chỗ dùng API nội bộ JDK hoặc API đã bị xoá bằng {{jdeps}} và {{jdeprscan}}, xử lý lỗi {{InaccessibleObjectException}} do JDK 17 đã khoá chặt API nội bộ (JEP 403); (3) **runtime**: GC mặc định, cờ JVM đã bị bỏ, container awareness. Nếu đang ở Spring Boot 2 thì thường đi kèm nâng Spring Boot 3 (bắt buộc Java 17+, đổi javax sang jakarta), đó mới là phần tốn công nhất.

### Những gì thay đổi giữa 8 và 21
| Thay đổi | Từ bản | Ảnh hưởng thường gặp |
|---|---|---|
| Module system (JPMS) | 9 | Reflection vào {{sun.*}}, {{jdk.internal.*}} bị chặn dần |
| Xoá Java EE modules (JAXB, JAX-WS, javax.annotation) | 11 (JEP 320) | {{ClassNotFoundException: javax.xml.bind.JAXBContext}}: thêm dependency jakarta.xml.bind |
| Xoá Nashorn | 15 | Script engine JavaScript không còn |
| Strongly encapsulate JDK internals | 16 (JEP 396), 17 bỏ luôn cờ {{--illegal-access}} (JEP 403) | {{InaccessibleObjectException}} khi thư viện cũ reflection vào JDK |
| Xoá CMS GC | 14 | Cờ {{-XX:+UseConcMarkSweepGC}} làm JVM không khởi động |
| Biased locking bị tắt/bỏ | 15/18 | Gần như không ảnh hưởng, có thể thay đổi hiệu năng lock |
| {{SecurityManager}} deprecated for removal | 17 | Thư viện cũ gọi nó in cảnh báo |

### Lộ trình từng bước
1. **Kiểm kê**: chạy {{jdeps --jdk-internals --multi-release 21 -cp 'libs/*' app.jar}} để tìm code (của bạn và của thư viện) dùng API nội bộ; {{jdeprscan --release 21 app.jar}} tìm API deprecated for removal.
2. **Nâng build trước, chưa đổi bytecode**: chạy build trên JDK 21 nhưng vẫn {{--release 8}} hoặc {{--release 11}}. Nâng Maven/Gradle plugin, Lombok (từ 1.18.30 cho JDK 21), Mockito 5, ByteBuddy, JaCoCo (từ 0.8.11 cho JDK 21). Bước này tách lỗi "công cụ build" khỏi lỗi "code".
3. **Chạy test và ứng dụng trên runtime 21** với bytecode cũ: lộ ra lỗi reflection, cờ JVM đã bị bỏ, khác biệt hành vi.
4. **Xử lý encapsulation đúng cách**: nâng thư viện là cách chính. {{--add-opens java.base/java.lang=ALL-UNNAMED}} chỉ là băng cá nhân tạm thời; ghi lại từng dòng và có ticket gỡ.
5. **Đổi {{--release 21}}** rồi mới dần dùng tính năng mới (record, switch pattern, text block, virtual thread), không gộp vào cùng PR nâng cấp.
6. **Spring Boot 2 lên 3** (nếu có): đi qua 2.7 trước, sửa hết deprecation, rồi lên 3.x; dùng OpenRewrite recipe để đổi {{javax.*}} sang {{jakarta.*}} tự động; kiểm tra Hibernate 6 (thay đổi HQL, kiểu id, sequence).
7. **Runtime**: rà cờ JVM trong Dockerfile/Helm (bỏ CMS, {{PermSize}}, {{-XX:+UseCGroupMemoryLimitForHeap}}), dùng {{-XX:MaxRAMPercentage}}, đo lại GC (G1 trên 21 tốt hơn nhiều so với 8).

### Ví dụ lỗi và cách đọc
~~~text
java.lang.reflect.InaccessibleObjectException: Unable to make field private final
  byte[] java.lang.String.value accessible: module java.base does not "opens java.lang"
  to unnamed module @6d06d69c
~~~
Đọc: một thư viện (thường là bản cũ của serializer, mocking hoặc bytecode library) đang reflection vào field private của JDK. Cách sửa đúng là nâng thư viện; tạm thời có thể thêm {{--add-opens java.base/java.lang=ALL-UNNAMED}} để mở đúng package đó.

### Ví dụ đời thực
Một hệ thống core banking gồm 14 service Java 8 + Spring Boot 2.3. Team làm theo thứ tự: một service ít phụ thuộc làm thí điểm, build trên JDK 21 với {{--release 8}} trước. Lỗi đầu tiên không nằm ở code mà ở Lombok 1.18.12 và JaCoCo 0.8.5 không đọc được JDK mới; nâng xong là qua. Chạy runtime 21 lộ 3 chỗ {{InaccessibleObjectException}} từ một thư viện XML cũ và Kryo; nâng thư viện giải quyết 2, chỗ còn lại thêm {{--add-opens}} kèm ticket. Phần tốn công nhất là Spring Boot 3: 1.900 import javax được OpenRewrite đổi tự động, nhưng 40 câu HQL phải sửa tay vì Hibernate 6 chặt hơn. Sau khi lên production, G1 trên JDK 21 giảm p99 GC pause từ 180 ms xuống 45 ms và RAM mỗi pod giảm 15%. Cả 14 service mất 4 tháng, không có sự cố nào do nâng cấp.

### Trả lời mẫu khi phỏng vấn
"Tôi chia việc nâng Java 8 lên 21 thành ba lớp. Đầu tiên là build: chạy build trên JDK 21 nhưng vẫn giữ release 8, nâng plugin và các thư viện thao tác bytecode như Lombok, Mockito, JaCoCo, APM agent, vì đây là chỗ hỏng đầu tiên. Thứ hai là API: dùng jdeps với tùy chọn jdk-internals để tìm chỗ dùng API nội bộ, jdeprscan để tìm API sắp bị xoá; từ JDK 17 các API nội bộ bị khoá hẳn nên thư viện cũ reflection vào JDK sẽ ném InaccessibleObjectException, cách đúng là nâng thư viện, add-opens chỉ là tạm thời và phải có ticket gỡ. Các module Java EE như JAXB cũng đã bị xoá từ Java 11 nên phải thêm dependency. Thứ ba là runtime: bỏ cờ JVM cũ như CMS, đo lại GC và bộ nhớ. Nếu kèm Spring Boot 3 thì đi qua 2.7 trước, dùng OpenRewrite đổi javax sang jakarta. Tôi làm thí điểm một service trước, không trộn việc dùng tính năng ngôn ngữ mới vào cùng đợt nâng cấp."

> Senior tip: tách nâng cấp thành hai mốc rõ ràng: "chạy được trên JDK 21 với bytecode cũ" và "biên dịch release 21". Mốc đầu tiên giải quyết 80% rủi ro và có thể rollback chỉ bằng đổi base image. Và luôn chạy smoke test **có gắn APM agent**: agent cũ không hiểu class file mới là lý do số một khiến service không khởi động được sau nâng cấp.`,
  follow: ['Đọc output của jdeps --jdk-internals thế nào, và bạn xử lý từng loại phát hiện ra sao?', 'Vì sao --add-opens chỉ nên là giải pháp tạm, và làm sao để không quên gỡ nó?', 'Nâng Spring Boot 2 lên 3 cùng lúc với Java 21 hay tách hai đợt? Vì sao?'],
  tags: ['migration', 'Java 21', 'jdeps', 'upgrade']
},
{
  id: 'modern-037',
  topic: 'modern',
  level: 'mid',
  q: 'Text blocks trong SQL/JSON test giúp gì và lưu ý indentation?',
  a: `**Tóm tắt:** Text block (\"\"\") cho chuỗi nhiều dòng; indentation được strip theo dòng ít thụt nhất; \\s giữ trailing space; dùng cho SQL/JSON test readable.

### Vì sao cần
- Trước: nối chuỗi + escape quote rườm rà, khó đọc.
- Text block giữ format, dễ đọc SQL/JSON trong test.

### Cách hoạt động
- Dòng đầu sau \"\"\" phải là newline (hoặc \\).
- Indentation tối thiểu bị strip; closing \"\"\" thẳng hàng với code để strip đúng.
- Escape: \\\\ cho backslash; quote không cần escape trong block.
- \\s giữ trailing whitespace; \\ (line continuation) nối dòng.

### Ví dụ
~~~java
String sql = \"\"\"
    SELECT id, name
    FROM users
    WHERE active = true
    \"\"\";
~~~

### Pitfall
- Trailing whitespace bị strip trừ khi dùng \\s.
- Mixing indentation gây kết quả không như ý.
- Text block compile-time constant nếu content constant → có thể dùng trong annotation/switch.

### Khi dùng
- SQL/JSON trong test và repository; template email; documentation.

> Senior tip: đặt closing \"\"\" thẳng hàng với code để strip đúng; viết test snapshot so sánh; dùng \\s khi cần trailing space trong JSON.`,
  follow: ['Text block có phải compile-time constant?'],
  tags: ['Java 15', 'text blocks', 'SQL', 'JSON']
},
{
  id: 'modern-038',
  topic: 'modern',
  level: 'lead',
  q: '(Lead) Chính sách nâng LTS cho 30 service: làm thế nào để đồng bộ và an toàn?',
  a: `**Tóm tắt:** Nâng LTS (Long-Term Support - phiên bản Java được Oracle/OpenJDK hỗ trợ dài hạn, ví dụ 11/17/21) cho 30 service phải coi như một chương trình thay đổi có kiểm soát: đặt baseline JDK mục tiêu, quét tương thích tự động, nâng theo wave (từng đợt) với canary (triển khai một phần traffic nhỏ trước) và tiêu chí rollback rõ ràng, đồng thời đo metric trước/sau để chứng minh không có regression (thoái hóa hiệu năng/chức năng).

### Vì sao 30 service không thể nâng "một phát ăn ngay"
- Mỗi service có dependency (thư viện phụ thuộc), cách dùng reflection (gọi/lấy class/method lúc runtime), cấu hình GC (Garbage Collector - bộ dọn rác tự động của JVM), và mức độ quan trọng khác nhau. Một thư viện cũ có thể dùng API nội bộ bị đóng kín từ Java 16+ (strong encapsulation - đóng gói mạnh, ngăn truy cập gói nội bộ JDK).
- Nâng JDK đôi khi đổi hành vi ngầm: thuật toán GC mặc định khác, thứ tự ngẫu nhiên (randomization) khác, hoặc hiệu năng p99 latency (độ trễ ở ngưỡng 99% request chậm nhất) thay đổi. Nếu nâng 30 service cùng lúc, khi có sự cố bạn không biết nguyên nhân nằm ở service nào hay ở JDK.
- Ví dụ đời thường: giống như đổi toàn bộ đội xe buýt của thành phố sang loại nhiên liệu mới trong cùng một ngày - nếu hỏng, cả thành phố tê liệt; thay vào đó nên thử một tuyến nhỏ trước.

### Cách làm từng bước (từ chuẩn hóa đến rollout)
1. **Đặt baseline và RFC (Request for Comments - tài liệu đề xuất kỹ thuật):** chọn JDK mục tiêu (ví dụ Temurin 21.0.x), quy định toolchain (Maven {{maven-compiler-plugin}} / Gradle {{toolchain}}), và cấm dùng API nội bộ. Chốt "supported JDKs" trong CI (Continuous Integration - hệ thống build/test tự động).
2. **Quét tương thích tự động trên cả 30 repo:**
   - {{jdeps --jdk-internals}}: tìm chỗ gọi API nội bộ JDK.
   - {{jdeprscan}}: tìm API đã bị deprecated/loại bỏ.
   - Quét dependency bằng SCA (Software Composition Analysis - phân tích thành phần phần mềm) để phát hiện thư viện không hỗ trợ JDK mới hoặc có CVE (lỗ hổng bảo mật đã công bố).
3. **Chia wave theo rủi ro:**
| Wave | Đối tượng | Tiêu chí qua wave |
|---|---|---|
| 0 (pilot) | 1-2 service nội bộ, traffic thấp | build xanh, test pass, canary 24h không lỗi |
| 1 | service không critical, ít dependency lạ | p99 ±5%, error rate không tăng, GC pause không xấu hơn |
| 2 | service core (đơn hàng/thanh toán) | canary 5% → 25% → 100%, có rollback trong < 5 phút |
| 3 | phần còn lại | tái dùng playbook, xử lý ngoại lệ |
4. **Triển khai an toàn cho mỗi service:** build artifact với JDK 21, chạy toàn bộ test + contract test (kiểm tra "hợp đồng" API giữa các service), deploy staging, rồi canary 5% traffic. Theo dõi dashboard trước/sau ít nhất 24-48h.
5. **Metric phải so sánh có baseline:**
   - p50/p95/p99 latency, throughput (số request/giây).
   - GC pause time, allocation rate (tốc độ cấp phát bộ nhớ), heap usage.
   - Error rate (5xx), timeout, retry.
   - Thời gian khởi động (ảnh hưởng autoscaling).
6. **Kế hoạch thoát hiểm:** giữ khả năng rollback image JDK cũ; nếu buộc phải mở tạm {{--add-opens/--add-exports}} thì ghi ticket refactor có deadline, không để vĩnh viễn.

### Ví dụ checklist CI cho một service
~~~yaml
# Ý tưởng: build/test trên JDK mục tiêu và vẫn giữ JDK cũ một thời gian
jobs:
  build:
    strategy:
      matrix:
        java: [17, 21]   # chạy song song để phát hiện vỡ sớm
    steps:
      - run: ./mvnw -B -Djava.version=\${{ matrix.java }} verify
      - run: jdeps --jdk-internals target/app.jar || true  # ghi nhận, không chặn ngay
~~~

### Pitfall thực tế trên production
- **Không có rollback plan:** nâng xong mới phát hiện p99 tăng 40% do GC khác; nếu không giữ image cũ, team phải hotfix trong hoảng loạn.
- **Bỏ qua bytecode agent/annotation processor:** agent APM (Application Performance Monitoring - công cụ theo dõi hiệu năng), Mockito inline, hay thư viện sinh bytecode có thể chưa hỗ trợ JDK mới → lỗi runtime dù compile pass.
- **Chỉ test chức năng, quên hiệu năng:** GC, JIT (Just-In-Time compiler - trình biên dịch lúc chạy) warmup, và memory footprint đổi theo JDK.
- **{{--add-opens}} thành nợ kỹ thuật vĩnh viễn:** mở tạm để "qua ngày" rồi không ai dọn.
- **Dependency có CVE hoặc ngừng bảo trì:** nâng JDK là cơ hội bắt buộc nâng cả thư viện rủi ro.

> Senior tip: coi nâng LTS là "chương trình", không phải ticket. Thực tế hay dùng: 1 owner (platform/architect), playbook dùng chung, dashboard so sánh trước-sau cho mọi service, và quy tắc "wave sau chỉ bắt đầu khi wave trước qua 1 tuần production ổn định". Với 30 service, thường mất 2-4 tháng cho lộ trình 17→21 nếu kỷ luật; cố ép nhanh thường trả giá bằng incident.`,
  follow: [
    'Làm sao đo regression hiệu năng sau upgrade một cách đáng tin cậy (không bị nhiễu)?',
    'Khi một thư viện quan trọng chưa hỗ trợ JDK 21, bạn chọn phương án nào: chờ, thay thế, fork, hay cô lập?',
    'Strong encapsulation từ Java 16+ ảnh hưởng gì đến code dùng reflection/sun.misc?'
  ],
  tags: ['lead', 'upgrade', 'policy', 'LTS']
},
{
  id: 'core-036',
  topic: 'core',
  level: 'senior',
  q: 'Escape analysis và scalar replacement hoạt động thế nào trong JIT? Khi nào một object không bao giờ được cấp phát trên heap, và làm sao kiểm chứng trên JDK 17/21?',
  a: `**Tóm tắt:** khi biên dịch JIT (C2), JVM xét xem reference của một object có "thoát" ra ngoài method hay không. Nếu không thoát, nó **bỏ luôn lệnh cấp phát** và thay các field bằng giá trị nằm trong register/stack frame — đó là scalar replacement. HotSpot không "đặt object xuống stack" như lời đồn: nó xoá object khỏi chương trình. Vì vậy một vòng lặp toàn {{new}} vẫn có thể chạy với gần 0 byte allocation.

> Thuật ngữ: **JIT** (Just-In-Time compiler) là trình biên dịch chạy lúc chương trình đang chạy, biến bytecode "nóng" thành mã máy nhanh; **C2** là JIT tối ưu mạnh của HotSpot. **TLAB** (Thread-Local Allocation Buffer) là vùng heap riêng cho mỗi thread, giống "ngăn kéo riêng" để cấp phát nhanh mà không tranh chấp.

### Chuyện gì xảy ra, theo thứ tự
- {{new Point(3, 4)}} biên dịch thành {{new}}, {{dup}}, {{invokespecial <init>}}. Ở interpreter (chế độ chạy từng lệnh bytecode) và code C1 (JIT biên dịch nhanh, tối ưu vừa), object được cấp phát thật trên heap trong TLAB, chi phí chỉ là dịch một con trỏ.
- Khi method đủ nóng, C2 compile và chạy escape analysis trên đồ thị IR (biểu diễn trung gian của compiler): mỗi node cấp phát được phân loại theo mức thoát rồi mới quyết định giữ hay bỏ. **Inlining** (nhúng code method được gọi vào chỗ gọi) phải xảy ra trước, vì nếu chưa inline thì C2 không biết method đích có làm reference "thoát" hay không.

| Mức thoát | Nghĩa | Ví dụ | C2 làm gì |
|---|---|---|---|
| Không escape | reference chỉ sống trong method | tạo point rồi tính khoảng cách | xoá cấp phát, tách field thành scalar |
| Thoát qua tham số | truyền sang method chưa được inline | {{helper(new Config())}} | nếu inline được helper thì vẫn xoá |
| Thoát toàn cục | ra heap, static field, return, store vào field của object khác | {{cache.put(k, new Value())}} | cấp phát bình thường |

### Scalar replacement trông ra sao
~~~java
static int distSq(int dx, int dy) {
    Point p = new Point(dx, dy);   // Point: hai field int
    return p.x * p.x + p.y * p.y;
}
~~~
~~~text
Mã máy sau C2, về ý tưởng:
    imul  eax, eax      ; p.x * p.x  (dx đã nằm trong register)
    imul  edx, edx      ; p.y * p.y
    add   eax, edx      ; không có lệnh cấp phát, không object header, không có gì cho GC dọn
~~~
Nếu object escape thì phải thêm: cấp phát (header 12-16 byte + field), và mỗi lần đọc {{p.x}} là một lần load qua reference — một dependency chain mà CPU không prefetch được.

### Vì sao JDK chọn cách này
- Cấp phát trên heap vốn rẻ, nên mục tiêu chính của escape analysis **không phải tiết kiệm chỗ ghi** mà là loại bỏ load/store để giá trị nằm trong register (thanh ghi CPU, nơi tính toán nhanh nhất), và giảm số object GC phải dọn.
- Cái giá: phân tích chỉ chạy **sau khi inline**, và khi suy ra sai thì phải "materialize" (tái tạo) object trở lại. HotSpot chọn cách bảo thủ: không chắc thì cấp phát.
- Đây là tối ưu, không phải cam kết. JLS (Java Language Specification — đặc tả ngôn ngữ Java) không hứa gì về việc object có nằm trên heap hay không.

### Escape analysis thất bại khi nào (quan trọng hơn lúc nó thành công)
1. Method đích không được inline: quá lớn, hết ngân sách inline, hoặc gọi qua interface mà JVM thấy nhiều loại object (không **monomorphic** — tức không chỉ có một kiểu runtime duy nhất tại điểm gọi; ví dụ biến kiểu {{List}} đôi khi là {{ArrayList}}, đôi khi {{LinkedList}}).
2. Store vào field của object khác: {{holder.p = new Point(...)}} — holder sống lâu hơn method.
3. Đưa vào collection hoặc mảng, return ra ngoài, gán vào static field, truyền sang thread khác.
4. Quan sát danh tính object: {{getClass()}}, {{hashCode}}/identityHashCode mặc định, so sánh {{==}} giữa hai object local — JVM phải tạo object thật để trả lời đúng.
5. {{obj}} bị dùng trong các nhánh vòng lặp với hình dạng khác nhau tới mức C2 bỏ cuộc.
6. {{synchronized (obj)}}: **lock elision** (bỏ lệnh khoá khi object không thoát) từng được kỳ vọng nhưng HotSpot/C2 không áp dụng rộng rãi như một tối ưu đáng tin; đừng viết code dựa vào giả định lock sẽ bị loại bỏ. Biased locking (khoá thiên vị một thread) thì đã bị tắt mặc định từ JDK 15 và loại bỏ hẳn ở các bản sau.

### Cách kiểm chứng, không đoán
~~~bash
java -XX:+PrintFlagsFinal -version | grep -i escape    # DoEscapeAnalysis = true (mặc định)
java -XX:-DoEscapeAnalysis -jar bench.jar              # tắt đi rồi so sánh hai lần chạy
~~~
- Đáng tin nhất: JMH (Java Microbenchmark Harness — bộ công cụ benchmark chính thức của OpenJDK, giúp đo đúng khi JIT can thiệp) kèm gc profiler ({{java -jar benchmarks.jar -prof gc}}), nhìn cột byte mỗi operation. Vòng lặp chỉ tạo object local mà ra ~0 byte/op nghĩa là cấp phát đã bị xoá.
- Cách thứ hai đơn giản hơn: chạy benchmark hai lần, một lần thêm {{-XX:-DoEscapeAnalysis}}. Thời gian và số allocation nhảy lên chứng tỏ trước đó object không nằm trên heap.
- Chạy bằng interpreter hoặc {{-Xint}} luôn cấp phát — đừng kết luận từ một lần chạy chưa warmup (giai đoạn JVM "làm nóng" để JIT biên dịch code nóng).

### Trên production
- Triệu chứng hay gặp: CPU cao, {{jcmd <pid> GC.heap_info}} cho thấy heap dao động mạnh nhưng retained size (dung lượng object còn được tham chiếu, GC không thu hồi được) không đổi — rất nhiều object "chết ngay". JFR (Java Flight Recorder — công cụ ghi sự kiện hiệu năng tích hợp trong JDK) có event mẫu {{jdk.ObjectAllocationSample}} (JDK 16+) và {{jdk.ObjectAllocationInNewTLAB}} để biết loại object nào được tạo nhiều nhất.
- Hệ quả thiết kế: chia logic thành method nhỏ, giữ value object (record 2-3 field) local trong vòng lặp thường đủ để JIT dọn giúp bạn; ngược lại, một object đi vào map/list thì chi phí là thật.
- Pitfall: đừng hy sinh tính dễ đọc chỉ để tránh {{new}}, và cũng đừng tin kết luận "Java cấp phát miễn phí" — nó đúng với object không escape, sai với object escape qua field hoặc collection.

> Senior tip: câu trả lời ghi điểm là "object **không bị đưa xuống stack**; JIT **bỏ việc cấp phát** khi reference không thoát khỏi method, và chỉ làm vậy sau khi inline". Muốn kiểm chứng thì tắt {{-XX:-DoEscapeAnalysis}} và so sánh, hoặc đo byte/op bằng JMH — đừng trả lời bằng cảm giác.`,
  follow: [
    'Vì sao escape analysis phụ thuộc inlining, và một interface call polymorphic làm nó hỏng ra sao?',
    'Lock elision khác gì biased locking, và hiện trạng của từng cái ở JDK 17/21?',
    'Trong hot loop, nên đổi record/small object sang primitive hay tin vào JIT? Bạn đo thế nào để quyết định?'
  ],
  tags: ['escape analysis', 'scalar replacement', 'JIT', 'C2', 'allocation', 'JMH'],
  refs: [
    { type: 'article', title: 'HotSpot Escape Analysis (OpenJDK Wiki)', url: 'https://wiki.openjdk.org/display/HotSpot/EscapeAnalysis' }
  ]
},
{
  id: 'core-037',
  topic: 'core',
  level: 'lead',
  q: 'Lambda được tạo thế nào ở mức bytecode (invokedynamic + LambdaMetafactory)? So với anonymous class, MethodHandle và reflection thì chi phí ra sao?',
  a: `**Tóm tắt:** javac **không** sinh một file class riêng cho mỗi lambda. Nó chuyển thân lambda thành một method tổng hợp trong chính class ({{lambda$main$0}}) và để lại một lệnh {{invokedynamic}} (lệnh bytecode để "gắn" cách gọi tại runtime qua bootstrap) có bootstrap là {{LambdaMetafactory.metafactory}}. Lần chạy đầu của lệnh đó sinh một lớp ẩn implement functional interface; các lần sau chỉ đi qua một MethodHandle (tay cầm tham chiếu tới method, nhẹ hơn reflection) đã cố định, nên JIT inline được thân lambda như lời gọi trực tiếp. Đó là lý do lambda rẻ hơn anonymous class và rẻ hơn nhiều so với {{Method.invoke}} (gọi method qua reflection).

### Nhìn vào bytecode
~~~text
javap -p -c -v LambdaDemo.class
 0: invokedynamic #7, 0     // InvokeDynamic #0: apply
                             // descriptor: (String) -> Function

BootstrapMethods:
  0: LambdaMetafactory.metafactory(
       MethodHandles.lookup(),
       "apply",                                    // invokedName
       (String)Function,                          // invokedType
       (Object)Object,                            // samMethodType: sau type erasure
       MethodHandle LambdaDemo::lambda$main$0,    // implMethod: nơi logic thật nằm
       (String)String)                            // instantiatedMethodType: sau suy generic
~~~
- {{samMethodType}}: chữ ký erased (sau **type erasure** — Java xoá thông tin generic khỏi bytecode lúc biên dịch) của method trừu tượng trong interface, ví dụ {{Function.apply(Object)}} trả {{Object}}.
- {{implMethod}}: MethodHandle trỏ tới method thật — hoặc method tổng hợp {{lambda$0}}, hoặc chính method được tham chiếu trong {{String::length}}.
- {{instantiatedMethodType}}: chữ ký sau khi suy ra generic, nhờ đó lớp sinh ra có method trả {{String}} (bridge method — method cầu nối compiler chèn để giữ tính đa hình sau erasure) dù interface erased là {{Object}}.

### Lambda tồn tại qua 5 bước
1. javac tạo một private method chứa thân lambda ngay trong class gọi.
2. Tại vị trí biểu thức lambda, javac phát {{invokedynamic}}; descriptor nhận các biến capture làm tham số.
3. Lần chạy đầu, JVM gọi bootstrap: {{LambdaMetafactory}} dựng lớp implement interface, field là biến capture, method {{apply}} gọi {{implMethod}}. Từ JDK 15 (JEP 371 - Hidden Classes) lớp này là **hidden class** (lớp ẩn: không đăng ký tên trong ClassLoader, không tạo được bằng reflection tên thường, và có thể bị unload nên không phình **Metaspace** — vùng nhớ native giữ metadata class).
4. Bootstrap trả một {{CallSite}} (đối tượng giữ target method để invokedynamic gọi) có target là MethodHandle dạng "factory"; site đã init nên lần sau **không** chạy bootstrap nữa.
5. Vì target đó là hằng số, C2 coi lời gọi như direct call và inline được thân lambda.

### Capture và this
| Dạng | Tham số của invokedynamic | Hệ quả |
|---|---|---|
| {{s -> s.length()}} | không có | không field; site trả instance dùng lại, JIT có thể constant-fold (tính sẵn vì giá trị không đổi) |
| {{s -> s.length() + off}} | {{off}} | mỗi lần evaluate tạo object mang {{off}} (vòng lặp 1 triệu lần là 1 triệu object, nếu không escape thì escape analysis có thể xoá) |
| {{s -> prefix + s}} (dùng field instance) | {{this}} là tham số đầu | giữ reference tới enclosing instance — giống inner class, là nguồn memory leak thật (enclosing object bị giữ sống dù không còn dùng) |
| {{String::length}} | không có method tổng hợp | {{implMethod}} trỏ thẳng method thật, dễ inline nhất |
| anonymous class | một file class trên đĩa | luôn có class riêng, dispatch qua interface, profile theo class khó hơn |

### So sánh chi phí khi gọi cùng một logic
| Cách | Việc xảy ra mỗi lời gọi |
|---|---|
| Lời gọi trực tiếp | một lệnh invoke đã devirtualize (JIT xác định đúng implementation nên bỏ bước tra bảng ảo), inline thoải mái |
| Lambda / method reference (site đã init) | một lời gọi tới MethodHandle hằng số; sau inline thì như trên |
| {{MethodHandle.invoke}} | nếu chữ ký không khớp chính xác thì thêm bước type adaptation (chuyển đổi kiểu tham số/trả về); vẫn inline được khi handle nằm trong {{static final}} |
| {{Method.invoke}} | kiểm tra truy cập, đóng gói tham số vào {{Object[]}}, boxing (bọc primitive thành object, ví dụ {{int}} → {{Integer}}) — đắt nhất ở hot path (từ JDK 18 core reflection chạy trên MethodHandle nên khoảng cách hẹp lại) |
| Anonymous class | cấp phát object + interface dispatch (tra method qua bảng ảo/interface) |

### Trên production
- Stack trace: dòng {{at com.example.Foo.lambda$apply$0(Foo.java:57)}} là method tổng hợp chứa thân lambda, cho biết class và dòng. Frame của lớp ẩn ({{Foo$$Lambda/0x...}}) mặc định bị giấu, chỉ hiện khi bật {{-XX:+ShowHiddenFrames}}. Lớp ẩn không có file .class trên đĩa; muốn đọc code thì mở {{Foo.class}} bằng javap/IDE và xem method {{lambda$...}}.
- Lambda **không** serialize được nếu functional interface không kế thừa {{Serializable}}; kể cả khi serialize được thì dạng thức phụ thuộc triển khai nội bộ — đừng đưa lambda vào protocol hay file cấu hình.
- Lambda không có danh tính: {{a.equals(b)}}/{{a == b}} giữa hai lambda "giống nhau" là vô nghĩa, đừng dùng lambda làm key trong map.
- Đây là kỹ thuật các thư viện mapping dùng để thay {{Method.invoke}} ở hot path: compile getter/setter thành {{Function}} một lần bằng {{LambdaMetafactory}} rồi tái dùng nghìn lần.
- Flame graph (biểu đồ cột phẳng hoá từ sampling profiler, cho thấy hàm nào tốn nhiều CPU nhất) có nhiều frame {{java.lang.invoke.LambdaForm$}} nghĩa là đường đi qua MethodHandle chưa được fold thành direct call — thường do handle không phải hằng số.

> Senior tip: hai ý phân biệt senior thật với người chỉ biết viết lambda: (1) lambda **không sinh class cho mỗi lần chạy**, class chỉ được dựng một lần cho mỗi call site, và (2) method reference không phải "cú pháp đường tắt" — nó là {{implMethod}} trỏ thẳng tới method thật nên hay được inline tốt hơn lambda có method tổng hợp.`,
  follow: [
    'Vì sao method reference thường inline tốt hơn lambda tương đương, và khi nào khác biệt bằng 0?',
    'Hidden class (JEP 371) giải quyết vấn đề cụ thể nào của lớp lambda sinh lúc runtime?',
    'Bạn viết benchmark so sánh Method.invoke, MethodHandle và LambdaMetafactory bằng JMH thế nào để kết luận đáng tin?'
  ],
  tags: ['lambda', 'invokedynamic', 'LambdaMetafactory', 'MethodHandle', 'reflection', 'hidden class'],
  refs: [
    { type: 'doc', title: 'JEP 371: Hidden Classes', url: 'https://openjdk.org/jeps/371' },
    { type: 'doc', title: 'Java Language Specification', url: 'https://docs.oracle.com/javase/specs/' }
  ]
},
{
  id: 'core-038',
  topic: 'core',
  level: 'lead',
  q: 'Cơ chế khởi tạo class của JVM (static initializer) hoạt động thế nào, và vì sao hai class có static block gọi lẫn nhau có thể deadlock? Cách phát hiện và phá vòng?',
  a: `**Tóm tắt:** mỗi class được khởi tạo **đúng một lần, bởi một thread**, dưới một cái khoá riêng của class (initialization lock). Static block (khối {{static}} chạy khi class được nạp) và static field initializer (giá trị khởi tạo của field static) được compiler gom thành method {{<clinit>}}. Cái khoá đó vừa là thứ khiến singleton kiểu Holder thread-safe mà **không cần synchronized**, vừa là thứ gây deadlock (hai thread chờ nhau mãi) ngay lúc khởi động khi hai class khởi tạo vòng nhau từ hai thread.

> Thuật ngữ: **ClassLoader** là thành phần JVM nạp bytecode (.class) thành object {{Class}}. **constant pool** là bảng hằng trong file .class (chuỗi, số, tham chiếu method/field). **happens-before** (JMM — Java Memory Model) là quan hệ đảm bảo một thread thấy được kết quả ghi của thread khác khi có đồng bộ đúng cách.

### Ba giai đoạn sống của một class
1. **Loading**: class loader tìm bytecode, tạo object {{Class}}.
2. **Linking** (verification + preparation): preparation gán **giá trị mặc định** (0, null, false) cho static field; riêng hằng compile-time đã có giá trị trong constant pool nên đọc chúng không kích hoạt khởi tạo.
3. **Initialization**: chạy {{<clinit>}} — lúc static block và static field initializer chạy theo thứ tự xuất hiện trong file nguồn.

| Hành động | Có chạy {{<clinit>}}? |
|---|---|
| {{new X()}}, gọi static method của X, đọc/ghi static field không phải hằng | Có |
| Đọc {{static final int MAX = 5}} (hằng compile-time) | Không — giá trị đã được inline vào class gọi |
| {{Class.forName("X")}} và {{Class.forName("X", false, loader)}} | Có / Không (tham số initialize) |
| Khởi tạo class con | Có, cha trước, đệ quy |
| Lấy {{X.class}}, so sánh tên class | Không |
| Tạo mảng {{new X[3]}} | Không (mảng không khởi tạo phần tử) |

### Thuật toán khởi tạo (JLS 12.4.2, rút gọn)
1. Thread synchronize trên object {{Class}} của class cần init — HotSpot giữ một mutex per class.
2. Class đã Initialized? Thoát ngay. Đây là đường nhanh khiến static block không chạy lại ở lần {{new}} sau.
3. Class **đang** được khởi tạo bởi chính thread này? Cho qua (re-entrant) — nguồn của các bẫy giá trị default.
4. Class đang được thread khác khởi tạo? Chờ trên khoá đó.
5. Không ai khởi tạo: đánh dấu "đang init bởi thread này", khởi tạo class cha đệ quy, chạy {{<clinit>}}, đặt Initialized, release khoá.
- Quà kèm theo: mọi thread đọc static field sau khi class Initialized đều **thấy** giá trị do {{<clinit>}} ghi mà không cần {{volatile}}, vì JLS định nghĩa happens-before ở đây. Holder idiom an toàn là nhờ điều này.

### Deadlock hai thread
~~~java
class Alpha { static { Beta.prep(); } static int size = 1; static void prep() { } }
class Beta  { static { Alpha.prep(); } static int size = 1; static void prep() { } }
// T1 chạm Alpha.size trước; T2 chạm Beta.size trước
~~~
T1 cầm khoá init của Alpha rồi gọi {{Beta.prep}} → cần init Beta → chặn trên khoá mà T2 đang giữ. T2 cầm khoá Beta rồi gọi {{Alpha.prep}} → chặn trên khoá Alpha. Chu trình khoá **không nằm trong code của bạn** ở dạng một {{synchronized}} nào, nên không có object lock để grep.

Lưu ý khi đọc: trên nhiều bản JDK, thread đang chờ class init **không** hiện BLOCKED mà hiện RUNNABLE hoặc {{in Object.wait()}} với dòng chờ trên object {{java.lang.Class}}; các bản JDK mới in rõ tên class đang chờ khởi tạo.
~~~text
jstack excerpt (minh hoạ, câu chữ thay đổi theo bản JDK):
"pool-1-thread-1" BLOCKED
   - waiting for the initialization of class Beta ... held by "pool-1-thread-2"
"pool-1-thread-2" BLOCKED
   - waiting for the initialization of class Alpha ... held by "pool-1-thread-1"
~~~

### Bẫy thường gặp
- {{static final int X = compute();}} **không** là hằng compile-time nên vẫn trigger {{<clinit>}}; chỉ literal như {{= 5}} mới được inline.
- {{<clinit>}} ném lỗi: lần đầu thấy {{ExceptionInInitializerError}} (có cause), mọi lần sau thấy {{NoClassDefFoundError: Could not initialize class com.x.Foo}} **không còn cause**, và class ở trạng thái Failed cho tới khi ClassLoader đó chết — không "tự khỏi".
- Static block tạo thread mới mà thread đó chạm lại class của mình, rồi static block **chờ** thread đó ({{join()}}, {{Future.get()}}, latch): chắc chắn deadlock, vì thread mới chờ init xong còn init thì chờ thread mới.
- Enum constant được tạo ngay trong {{<clinit>}} của class enum, nên một enum có static block gọi sang class khác là mầm chu trình.

### Trên production
- Triệu chứng: app khởi động rồi treo, hoặc request đầu tiên đứng 20-30 giây (do {{<clinit>}} gọi DNS/DB/read file) trong khi các request sau nhanh bất thường.
- Điều tra: {{jstack <pid>}} (công cụ JDK in stack trace tất cả thread) hoặc {{jcmd <pid> Thread.print}} xem thread nào đang "waiting for the initialization of class"; {{-Xlog:class+load=info}} cho biết thứ tự và nguồn nạp class. Khi log chỉ còn {{NoClassDefFoundError}}, tìm {{ExceptionInInitializerError}} **đầu tiên** sau thời điểm deploy.
- Phá vòng: tách hằng/static chung sang class thứ ba để đồ thị thành DAG (đồ thị có hướng không chu trình); dùng Holder idiom cho lazy singleton; chuyển init nặng (driver, config, kết nối) sang {{@PostConstruct}}/{{InitializingBean}} (hook vòng đời Spring, chạy sau khi bean được tạo) hoặc supplier do ứng dụng kiểm soát; framework thì {{Class.forName(name, false, loader)}} để **không** init, rồi chủ động init theo thứ tự mong muốn.
- Phòng: một nguyên tắc review đủ — "static block không gọi sang class khác và không làm I/O". Compiler gom cả field initializer vào {{<clinit>}}, nên soi {{<clinit>}} là soi được cả hai.

> Senior tip: nếu chỉ trả lời được "static block chạy một lần" thì bạn ở mức mid. Câu hỏi này phân biệt senior ở ba điểm: khoá init là per-class và re-entrant theo thread, nó tạo happens-before cho static field, và khi {{<clinit>}} hỏng thì mọi lần sau chỉ còn {{NoClassDefFoundError}} không cause — chi tiết quyết định cách bạn đọc log sự cố khởi động.`,
  follow: [
    'Vì sao Holder idiom thread-safe mà không cần {{synchronized}}? Liên hệ happens-before của class init.',
    'Sau khi {{ExceptionInInitializerError}}, vì sao {{NoClassDefFoundError}} mất cause và khắc phục thế nào nếu không restart?',
    'Nhiều ClassLoader cùng nạp một tên class thì bài toán init/locking phức tạp ra sao?'
  ],
  tags: ['class initialization', 'clinit', 'static block', 'deadlock', 'class loader', 'NoClassDefFoundError'],
  refs: [
    { type: 'doc', title: 'Java Language Specification', url: 'https://docs.oracle.com/javase/specs/' }
  ]
},
{
  id: 'collections-031',
  topic: 'collections',
  level: 'senior',
  q: 'Resize của {{HashMap}} bên trong chạy thế nào? Vì sao capacity luôn là luỹ thừa của 2, vì sao Java 8 không tính lại hash khi chuyển bảng, và lo/hi split hoạt động ra sao?',
  a: `**Tóm tắt:** khi {{size}} vượt {{threshold = capacity × loadFactor}}, HashMap tạo mảng mới **gấp đôi** rồi chia mỗi bucket cũ thành hai danh sách: **lo** (bit mới của hash = 0) giữ nguyên chỉ số cũ, **hi** (bit mới = 1) sang chỉ số cũ + capacity cũ. Không cần gọi lại {{hashCode}}, vì index mới chỉ khác index cũ ở đúng một bit vừa được thêm vào mặt nạ.

> Thuật ngữ: **bucket** là một ô trong mảng {{table}} của HashMap, chứa chuỗi (list) hoặc cây các entry có cùng chỉ số. **hash collision** (va chạm băm) là khi hai key khác nhau cho ra cùng index bucket. **load factor** (hệ số tải, mặc định 0.75) là tỉ lệ {{size/capacity}} tối đa trước khi resize. **compressed oops** là chế độ JVM nén con trỏ object còn 4 byte (thay vì 8) trên heap nhỏ hơn ~32 GB.

### Vì sao capacity luôn là luỹ thừa của 2
- Index bucket = {{(n - 1) & hash}}. Khi {{n = 2^k}} thì {{n - 1}} là mặt nạ gồm k bit 1 thấp nhất, nên phép AND cho kết quả như phép modulo nhưng chỉ mất một lệnh CPU.
- Nếu {{n}} không phải luỹ thừa 2 thì nhiều bit cao của hash bị bỏ hẳn và collision tăng vọt. Cái giá phải trả: bảng không thể "vừa khít" — capacity nhảy 16, 32, 64…, và {{new HashMap<>(100)}} thật ra lấy bảng 128 vì {{tableSizeFor}} làm tròn lên.
- Hash spreading ({{h ^ (h >>> 16)}}) tồn tại để các bit cao cũng kịp ảnh hưởng khi bảng còn nhỏ — đây là lý do một hash tự chế chỉ dùng vài byte đầu của chuỗi rất dễ gây va chạm.

### Resize chạy từng bước
~~~java
// Ý tưởng trong Node[] resize() của Java 8+
for (int j = 0; j < oldCap; ++j) {
    Node<K,V> e = oldTab[j];
    if (e == null) continue;
    oldTab[j] = null;
    if (e.next == null) {
        newTab[e.hash & (newCap - 1)] = e;      // bucket một node: chỉ đổi chỗ
    } else if (e instanceof TreeNode) {
        // split: tách cây thành lo/hi; bên nào còn <= 6 node thì untreeify thành list
    } else {
        Node<K,V> loHead = null, loTail = null, hiHead = null, hiTail = null;
        for (Node<K,V> x = e; x != null; x = x.next) {
            if ((x.hash & oldCap) == 0) appendLo(x);   // bit mới 0 -> vẫn ở j
            else                         appendHi(x);  // bit mới 1 -> tới j + oldCap
        }
        newTab[j] = loHead;
        newTab[j + oldCap] = hiHead;
    }
}
~~~
- Điều kiện {{x.hash & oldCap}}: khi bảng tăng từ {{n}} lên {{2n}}, mặt nạ thêm đúng bit thứ {{log2(n)}}. Node có bit đó bằng 0 thì index không đổi, bằng 1 thì index dịch đúng {{oldCap}} ô. Đây là toàn bộ lý do **không cần tính lại hash**.
- Hai danh sách được append nên thứ tự tương đối trong từng danh sách được giữ — khác hẳn Java 7 (chèn đầu nên đảo ngược danh sách).
- Chi phí: một phép AND và vài lần gán con trỏ cho mỗi node, tổng O(size + capacity).

~~~text
capacity 8 -> 16, nhìn bucket index 3 (oldCap = 8, bit mới là bit 3)
oldTab[3]:  A(h=...00011) -> B(h=...00111) -> C(h=...10011) -> D(h=...10111)
newTab[3]:  A -> B            (bit mới = 0, thứ tự cũ)
newTab[11]: C -> D            (11 = 3 + 8)
~~~

### Java 7 và bài học resize
| | Java 7 | Java 8+ |
|---|---|---|
| Cách đặt node mới | tính lại index rồi chèn đầu danh sách (đảo thứ tự) | lo/hi split, append, không tính lại hash |
| Lỗi nổi tiếng | hai thread resize đồng thời tạo vòng lặp trong danh sách, {{get()}} chạy mãi và CPU 100% | hết vòng lặp, nhưng vẫn mất node vì {{put}} không atomic |
| Bucket dài | list thuần, O(n) khi collision | resize nếu capacity < 64, treeify nếu đã >= 64 |

### Load factor 0.75 đứng ở đâu trong phép tính
- {{threshold = capacity * 0.75}}. Muốn chứa N phần tử mà không resize, capacity phải là luỹ thừa 2 nhỏ nhất sao cho {{capacity * 0.75 >= N}}.
- Ví dụ 100.000 phần tử: 131072 × 0.75 = 98304 < 100000, nên bảng thật là 262144 slot ≈ 1 MB mảng reference (4 byte/slot với compressed oops). Với 8 triệu phần tử: 2^23 × 0.75 ≈ 6,3 triệu chưa đủ, nên capacity là 2^24 slot ≈ 64 MB **chỉ riêng mảng bảng**.
- Công thức capacity khởi tạo hay dùng: {{new HashMap<>((int)(N / 0.75f) + 1)}}; viết {{new HashMap<>(N)}} thì vẫn còn resize vì N chưa chia cho load factor. Từ Java 19 có sẵn {{HashMap.newHashMap(N)}} (và {{HashSet.newHashSet(N)}}) tính đúng giúp bạn.
- Javadoc của HashMap nói 0.75 là thoả hiệp time/space cho đa số trường hợp: giảm xuống 0.5 thì chuỗi ngắn hơn nhưng tốn bộ nhớ và cache hơn, chỉ đáng cân nhắc khi profiling chỉ vào {{HashMap.getNode}}.

### Trên production
- Triệu chứng: một thread chiếm CPU cao, flame graph có {{java.util.HashMap.resize}}, kèm spike cấp phát mảng lớn. Với G1, mảng table lớn hơn nửa region là **humongous allocation** (cấp phát "khổng lồ" — object quá lớn phải đặt riêng, GC xử lý kém hơn) — thấy rõ qua {{jcmd <pid> GC.heap_info}} và log {{-Xlog:gc*}}.
- Warm-up (giai đoạn khởi động): service nạp vài trăm nghìn entry lúc khởi động sẽ resize khoảng 14 lần liên tiếp (16 lên 262.144) nếu không đặt capacity; đặt đúng thường giảm rõ thời gian boot và số young GC (GC vùng nhớ trẻ, dọn object sống ngắn).
- Pitfall: resize **không** atomic; một thread resize trong khi thread khác ghi là mất dữ liệu và {{size}} lệch — Java 8 hết bug vòng lặp chứ không hết bug đồng bộ.
- Pitfall: nếu phân bố hash xấu thì resize không cứu được; dựng histogram bucket trên mẫu key trước khi đổ tiền vào capacity.

> Senior tip: câu hỏi này interviewer muốn nghe ba thứ: mặt nạ bit giải thích vì sao chỉ số dịch đúng oldCap, thứ tự được giữ nên không cần rehash, và bài học Java 7 để chứng minh bạn hiểu vì sao {{HashMap}} vẫn không thread-safe dù thuật toán đã an toàn hơn.`,
  follow: [
    'Điều kiện đúng để lo/hi split hoạt động mà không cần gọi lại hashCode là gì?',
    'Untreeify diễn ra khi nào trong resize, và vì sao không diễn ra khi remove thông thường?',
    'Bạn đặt initial capacity cho map 5 triệu entry thế nào và ảnh hưởng tới GC ra sao?'
  ],
  tags: ['HashMap', 'resize', 'power of two', 'load factor', 'treeify', 'JMH'],
  refs: [
    { type: 'doc', title: 'HashMap (Java SE 21 API Specification)', url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/HashMap.html' }
  ]
},
{
  id: 'collections-032',
  topic: 'collections',
  level: 'senior',
  q: 'Spliterator làm gì, và vì sao parallelStream trên LinkedList hoặc trên stream dựng từ Iterator lại không nhanh hơn (thậm chí chậm hơn)?',
  a: `**Tóm tắt:** {{Spliterator}} (split + iterator) là API chia đôi nguồn dữ liệu để ForkJoinPool (pool thread chia-nhỏ-việc kiểu work-stealing) làm song song. Mỗi nguồn mô tả đặc điểm bằng characteristics ({{SIZED}}, {{SUBSIZED}}, {{ORDERED}}, {{CONCURRENT}}, {{DISTINCT}}, {{NONNULL}}) và quyết định có chia được không trong {{trySplit()}}. {{ArrayList}} chia O(1) theo index; {{LinkedList}} và nguồn dựng từ {{Iterator}} không chia đôi được, nên {{trySplit}} chia **theo lô**: đi bộ tuần tự qua 1024 phần tử đầu (lần sau 2048, rồi tăng dần) để chép vào một mảng và giao mảng đó cho task khác. Việc đọc nguồn vẫn tuần tự qua các con trỏ rải rác (pointer chase — nhảy theo con trỏ, hay gây cache miss), nên chỉ phần xử lý sau đó mới song song.

### Stream song song chạy thế nào
1. {{stream.parallel()}} lấy {{spliterator()}} của nguồn.
2. Task gọi {{trySplit()}} để nhận một nửa công việc rồi giao cho task khác (work stealing trong {{ForkJoinPool.commonPool()}}); nửa còn lại tiếp tục chia tới khi mảnh đủ nhỏ.
3. Mỗi task tự {{tryAdvance}} trên mảnh của mình, rồi kết quả gộp bằng {{combine}}; với {{forEach}} thì không có gộp và cũng không có đảm bảo thứ tự.
- Tốc độ do đó phụ thuộc **ba** thứ: chi phí chia, chi phí gộp, và công việc thật trên mỗi phần tử. Nói "parallel = nhanh hơn n lần" là bỏ qua hai cái đầu.

### Chi phí chia của các nguồn quen
| Nguồn | trySplit làm gì | Chi phí chia | Characteristics tiêu biểu |
|---|---|---|---|
| {{ArrayList}}, mảng | cắt khoảng index [gốc, giữa) | O(1) mỗi mảnh | SIZED, SUBSIZED, ORDERED |
| {{HashMap}}, {{HashSet}} | chia theo dải chỉ số bucket | O(1), nhưng số phần tử mỗi mảnh không đều | SIZED (không SUBSIZED) |
| {{LinkedList}} | đi bộ chép một lô (1024, 2048...) node vào mảng | O(kích thước lô) mỗi lần, đọc tuần tự | SIZED, ORDERED |
| {{spliteratorUnknownSize(iterator, 0)}} | chép một lô phần tử từ iterator vào mảng | như trên, không biết tổng kích thước | không SIZED |
| {{Stream.iterate}}/{{generate}} | nguồn vô hạn, chia theo lô | parallel kèm {{limit}} trên stream ordered thường rất chậm | không SIZED |
| {{ConcurrentHashMap}} | chia theo dải bucket | rẻ, an toàn khi có thread khác ghi | CONCURRENT |

### Vì sao parallel trên LinkedList thường chậm hơn
- {{LinkedList}} không có cách nhảy tới giữa, nên mỗi lần chia là đi bộ qua cả một lô node (pointer chase) và **chép** chúng sang mảng; bước này chỉ một thread làm được.
- Lô tăng dần (1024, 2048, 3072...) nên các mảnh không đều: mảnh cuối có thể rất lớn hoặc rất nhỏ, work stealing kém hiệu quả.
- Một vòng {{for}} tuần tự chỉ duyệt list **một lần** và không phải chép gì. Parallel chỉ có lãi khi công việc trên mỗi phần tử đủ lớn so với chi phí đi bộ và chép, ví dụ 1 ms tính toán cho mỗi phần tử.
- Nguồn dựng từ {{Iterator}} (JDBC stream, {{Scanner}}) cũng chia theo lô như vậy, và việc đọc nguồn luôn tuần tự: với việc nhẹ trên mỗi phần tử, bật parallel chỉ thêm chi phí chép và quản lý task.

### Tự viết Spliterator đúng
~~~java
final class RangeSpliterator implements Spliterator.OfLong {
    private long from, to;                       // nửa đóng [from, to)
    RangeSpliterator(long from, long to) { this.from = from; this.to = to; }

    @Override public Spliterator.OfLong trySplit() {
        if (to - from < 1024) return null;       // dừng chia khi mảnh đã đủ nhỏ
        long mid = (from + to) >>> 1;
        long lo = from; from = mid;              // mình giữ nửa SAU
        return new RangeSpliterator(lo, mid);    // trả nửa ĐẦU
    }
    @Override public boolean tryAdvance(LongConsumer a) {
        if (from >= to) return false;
        a.accept(from++);
        return true;
    }
    @Override public long estimateSize() { return to - from; }
    @Override public int characteristics() { return SIZED | SUBSIZED | ORDERED | DISTINCT | NONNULL; }
}
~~~
- Hợp đồng hay bị làm sai nhất: {{trySplit}} phải trả **nửa đầu** — đúng phần mà spliterator gốc sẽ gặp tiếp theo — và giữ lại phần sau. Làm ngược thì thứ tự của stream ordered bị sai.
- Khai {{SIZED}}/{{SUBSIZED}} là lời hứa "estimateSize chính xác". Hứa sai thì thuật toán chia dừng sai chỗ: chia quá ít thì không song song, chia quá sâu thì hàng nghìn task rỗng việc.
- {{CONCURRENT}} chỉ được khai khi nguồn thật sự chịu được ghi đồng thời, vì stream dùng nó để quyết định có copy nguồn hay không.

### Trên production
- {{ForkJoinPool.commonPool()}} là pool của **cả JVM**: một {{parallelStream}} dài chạy trên request thread chiếm worker của {{CompletableFuture.supplyAsync}} mặc định. Xem mức bận bằng {{commonPool().getActiveThreadCount()}}, đổi mức song song bằng {{-Djava.util.concurrent.ForkJoinPool.common.parallelism}}.
- Trong container, số CPU khả dụng lấy theo limit; limit 1 CPU thì "parallel" chỉ thêm overhead và làm p99 của request khác xấu đi.
- Kiểm chứng nhanh: đổi {{.parallel()}} thành {{.sequential()}} rồi đo lại cùng dữ liệu — nếu nhanh hơn thì vấn đề nằm ở chia/gộp, không phải thiếu CPU.
- Pitfall: tích luỹ vào {{ArrayList}}/{{HashMap}} chia sẻ từ nhiều mảnh; phải dùng {{collect}} với supplier và combiner đúng.

> Senior tip: trước khi bật parallel, trả lời ba câu: nguồn có chia được không ({{trySplit}} của nó làm gì), mỗi phần tử đáng bao nhiêu việc, và bước gộp có tốn không. Với dữ liệu đã nằm trong bộ nhớ, {{ArrayList}} + vòng for tuần tự thường còn nhanh hơn parallel trên {{LinkedList}}; cần song song quy mô lớn thì tách executor riêng thay vì chiếm common pool.`,
  follow: ['Khai SIZED nhưng estimateSize không chính xác thì thuật toán chia hỏng thế nào?', 'Vì sao stream dựng từ Iterator/JDBC hiếm khi nhanh hơn khi bật parallel, dù trySplit vẫn chia theo lô?', 'Bạn thiết kế spliterator cho một nguồn chia đắt (range theo thời gian, dữ liệu phân trang) ra sao?'],
  tags: ['Spliterator', 'parallel stream', 'ForkJoinPool', 'LinkedList', 'trySplit'],
  refs: [
    { type: 'doc', title: 'Spliterator (Java SE 21 API Specification)', url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Spliterator.html' }
  ]
},
{
  id: 'collections-033',
  topic: 'collections',
  level: 'senior',
  q: 'Bên trong một bucket đã treeify của HashMap là gì? Vì sao treeify chỉ đảm bảo O(log n) khi key Comparable, và làm sao phát hiện map của bạn đang bị hash collision trên production?',
  a: `**Tóm tắt:** treeify biến bucket dạng danh sách thành cây đỏ-đen (red-black tree — cây nhị phân tự cân bằng, đảm bảo tìm/ chèn/xoá O(log n)) {{TreeNode}}, nhưng cây sắp theo **hash trước, key sau**. Vì vậy đảm bảo O(log n) chỉ chắc chắn khi key implements {{Comparable}} (interface so sánh thứ tự, {{compareTo}}); nếu hash bằng nhau mà key không Comparable, JVM dùng {{tieBreakOrder}} (dựa trên identityHashCode — mã định danh object, không phụ thuộc {{hashCode()}} override) để chèn, và khi tra nó có thể phải tìm ở cả hai nhánh — worst case vẫn là O(n). Treeify là lưới an toàn, không phải vắc-xin chống HashDoS (tấn công từ chối dịch vụ bằng cách gửi nhiều key gây va chạm băm).

### Cấu trúc thật của một bin
- {{HashMap.Node}}: hash, key, value, next (4 field, cỡ 32 byte với compressed oops).
- {{HashMap.TreeNode}} kế thừa {{LinkedHashMap.Entry}} (vốn đã là {{Node}}), thêm {{parent}}, {{left}}, {{right}}, {{prev}}, {{next}}, cờ {{red}} → cỡ 48-56 byte mỗi phần tử, tức bin dạng cây tốn gần gấp đôi bin dạng list.
- Con trỏ {{prev}}/{{next}} vẫn nối tất cả node trong bin thành danh sách, nên thứ tự duyệt không đổi và việc untreeify rất rẻ.

Thứ tự so sánh khi chèn và khi tra:
~~~text
1) hash khác nhau      : hash nhỏ hơn -> nhánh trái, lớn hơn -> nhánh phải
2) hash bằng, key Comparable   : compareTo quyết định hướng đi
3) hash bằng, không Comparable : tieBreakOrder(a, b) so theo System.identityHashCode
   -> bước 3 chỉ quyết định vị trí CHÈN, không trả lời "đã tìm thấy"
   -> khi tra, JVM phải thử thêm nhánh kia: có thể suy thành quét gần hết bin
~~~

### Ba ngưỡng và lý do của chúng
| Ngưỡng | Giá trị | Ý nghĩa | Khi nào không có hiệu lực |
|---|---|---|---|
| TREEIFY_THRESHOLD | 8 | list đủ dài thì cân nhắc chuyển sang cây | khi capacity < 64 |
| MIN_TREEIFY_CAPACITY | 64 | dưới ngưỡng này thì resize rẻ hơn và phân tán tốt hơn treeify | luôn nhường khi bảng còn nhỏ |
| UNTREEIFY_THRESHOLD | 6 | khi resize tách bin mà một bên còn <= 6 node thì trả về list | bin vẫn dài hơn 6 |
- Số 8 đến từ xác suất: với hash lý tưởng, số node trong mỗi bucket xấp xỉ phân bố Poisson, xác suất một bucket có từ 8 node là cỡ **6 × 10⁻⁸** (con số được ghi ngay trong comment mã nguồn HashMap). Nghĩa là với dữ liệu bình thường bạn **không bao giờ** thấy tree bin; treeify tồn tại để chịu đựng hash xấu.
- Hai ngưỡng khác nhau (8 và 6) để tránh việc thêm/xoá quanh một ngưỡng khiến JVM chuyển list qua tree liên tục (thrashing). Untreeify chỉ diễn ra **trong resize**, nên {{remove}} bình thường không trả bin về list.

### Khi nào cây không cứu bạn
1. Key có {{hashCode}} trả về hằng số (kẻ tấn công chọn chuỗi sao cho hash như nhau — với {{String.hashCode}} chỉ vài ký tự là dựng được chuỗi va chạm tuỳ ý). Khi chèn key mới, {{tieBreakOrder}} vẫn giúp cây tìm vị trí theo O(log n); nhưng khi tra ({{get}}/{{containsKey}}) key không Comparable và hash bằng nhau, JVM không thể dùng {{compareTo}} để xác định hướng đi duy nhất nên có thể phải dò thêm nhánh — cost có thể xấu đi đáng kể. Javadoc HashMap nói rõ đảm bảo O(log n) cần key Comparable.
2. Memory: nếu mọi bucket đều thành cây, heap của map gần gấp đôi so với list bin cho cùng số phần tử.
3. Java **không** randomize {{String.hashCode}} theo từng JVM (khác cơ chế chống HashDoS trong PHP/Perl), nên tấn công qua String key là rủi ro thật, không phải lý thuyết.
4. {{ConcurrentHashMap}} cũng treeify với ngưỡng tương tự, nhưng nó khoá trên node đầu bin: cây không giảm contention trên một hot key, và không biến {{computeIfAbsent}} đắt thành rẻ.

### Trên production: phát hiện và đo
- Không có metric chuẩn cho "độ dài bucket". Cách thực dụng: lấy mẫu key và dựng histogram bằng chính công thức của HashMap.
~~~java
int cap  = Integer.highestOneBit(Math.max(16, (int)(expected / 0.75f)) << 1);  // capacity luỹ thừa 2
int mask = cap - 1;
Map<Integer, Integer> byBucket = new HashMap<>();
for (String k : sampleKeys) {
    int h = k.hashCode();
    byBucket.merge((h ^ (h >>> 16)) & mask, 1, Integer::sum);   // đúng phép hash + mặt nạ của HashMap
}
int longest = byBucket.values().stream().mapToInt(Integer::intValue).max().orElse(0);
// so longest với sampleKeys.length / cap: lệch nhiều nghĩa là phân bố xấu, dễ treeify
~~~
- Dấu hiệu trên máy chủ: CPU cao mà GC không tăng, p99 lớn dần theo kích thước map dù "get là O(1)", flame graph chỉ vào {{HashMap.getNode}}, {{HashMap.TreeNode.findTreeNode}} và {{String.equals}}.
- Heap dump (Eclipse MAT, VisualVM): histogram class mà có nhiều {{java.util.HashMap$TreeNode}} là bằng chứng bin đã thành cây — mà treeify với dữ liệu thật thì gần như chắc chắn {{hashCode}} của bạn phân bố kém.
- Giảm thiểu theo thứ tự đáng tin: dùng key là id nội bộ ({{Long}}, {{UUID}}) thay vì chuỗi do user chọn; giới hạn số entry kèm eviction ({{LinkedHashMap}} với {{removeEldestEntry}}, hoặc cache chuyên dụng); sửa {{hashCode}} cho composite key (dùng record hoặc {{Objects.hash}} đúng cách); nếu bắt buộc dùng chuỗi từ input, băm lại một lần (ví dụ SHA-256 rồi lấy 8 byte) để phân bố đều và cắt khả năng chọn chuỗi chủ đích.

> Senior tip: câu hỏi này ăn điểm ở hai chi tiết ít người biết: **cây chỉ nhanh khi key Comparable**, và **treeify tốn gần gấp đôi bộ nhớ**. Vì thế đừng trả lời "Java 8 hết HashDoS"; hãy trả lời "Java 8 biến O(n) thành O(log n) với điều kiện, còn gốc của vấn đề là để input người dùng quyết định key của map không giới hạn".`,
  follow: [
    'Vì sao UNTREEIFY chỉ xảy ra trong resize mà không trong remove, và hệ quả gì với map hay xoá phần tử?',
    'TreeNode mang theo các con trỏ danh sách prev/next để làm gì?',
    'Bạn thiết kế key composite cho map 10 triệu entry để vừa nhanh vừa không treeify?'
  ],
  tags: ['HashMap', 'TreeNode', 'treeify', 'hash collision', 'HashDoS', 'Comparable'],
  refs: [
    { type: 'doc', title: 'HashMap (Java SE 21 API Specification)', url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/HashMap.html' }
  ]
},
{
  id: 'collections-034',
  topic: 'collections',
  level: 'senior',
  q: 'modCount và expectedModCount hoạt động thế nào bên trong iterator? Vì sao fail-fast có thể im lặng trong đa luồng, và thao tác nào thực sự không gây ConcurrentModificationException?',
  a: `**Tóm tắt:** {{modCount}} là một {{int}} **không volatile**, tăng khi có thay đổi cấu trúc; mỗi iterator giữ {{expectedModCount}} và so sánh ở từng bước. Hai điều ít người nói rõ: (1) phát hiện CME là best-effort nên trong môi trường đa luồng nó có thể **im lặng không ném** và bạn nhận kết quả sai thay vì lỗi; (2) không phải mọi sửa đổi đều là "thay đổi cấu trúc" — {{setValue}} hay {{put}} lên key đã có **không** tăng modCount nên không gây CME.

### Cơ chế ở mức field
~~~java
// ArrayList (rút gọn)
protected transient int modCount = 0;              // transient, KHÔNG volatile
public E set(int i, E e) { elementData[i] = e; }   // không đụng modCount
public boolean add(E e)  { modCount++; ... }
public E remove(int i)   { modCount++; ... }

// ArrayList.Itr
int cursor, lastRet = -1, expectedModCount = modCount;
public E next() {
    if (modCount != expectedModCount) throw new ConcurrentModificationException();
    ...
}
public void remove() {
    ...
    ArrayList.this.remove(lastRet);
    expectedModCount = modCount;                    // mấu chốt: iterator tự cập nhật bên mình
}
~~~
- Vì {{modCount}} được đọc và ghi từ nhiều thread mà không có đồng bộ, theo JMM đây là **data race**: một thread có thể mãi đọc giá trị cũ. Nên fail-fast vừa thừa (báo CME cho lỗi một luồng) vừa thiếu (không báo gì khi race thật). Javadoc của các collection chỉ hứa một câu: phát hiện fail-fast là "best effort".
- {{expectedModCount = modCount}} trong {{it.remove()}} là lý do "sửa qua iterator thì hợp lệ": iterator biết mình vừa làm gì.
- {{subList}} là view: sửa list gốc làm modCount của cả hai tăng, nên iterator của subList cũng fail.

### Thao tác nào không gây CME
| Thao tác trong lúc đang duyệt | Tăng modCount? | Kết quả |
|---|---|---|
| {{it.remove()}}, {{it.set()}} trên ListIterator | có nhưng iterator đồng bộ lại | hợp lệ |
| {{list.add(e)}}, {{list.remove(i)}}, {{list.clear()}} | có | CME ở bước next kế tiếp |
| {{map.put(existingKey, newValue)}} | không | không CME |
| {{map.put(newKey, v)}}, {{map.remove(k)}} | có | CME |
| {{e.setValue(v)}} trong {{entrySet()}}, {{map.replaceAll}}, {{map.computeIfPresent}} | không | hợp lệ |
| Vòng for theo index + {{list.remove(i)}} | có nhưng không ai kiểm tra | **không ném**, mà âm thầm bỏ sót phần tử |
- Dòng cuối là bẫy đáng sợ nhất: bug dạng này không để lại tín hiệu nào ngoài dữ liệu thiếu. Nó xảy ra vì index dịch sau khi xoá, còn CME chỉ được kiểm tra trong iterator.

### removeIf và forEach bên trong chạy thế nào
- {{ArrayList.removeIf}} không tạo iterator. Nó quét mảng, ghi các phần tử giữ vào vị trí mới, rồi xoá đuôi và tăng {{modCount}} **một lần**; vì vậy toàn bộ được coi là một thay đổi cấu trúc và không có CME. Muốn biết chi phí thật, nhớ rằng nó vẫn là một phép compaction kiểu arraycopy O(n).
- {{HashMap.forEach}}, {{replaceAll}}, {{computeIfPresent}} dùng cùng ý tưởng fail-fast nhưng kiểm tra bằng một hàm nội bộ ({{modCount != expectedModCount}} thì ném) — cũng chỉ best-effort.
- Nếu phải sửa trong lúc duyệt có kiểm soát: gom key cần sửa vào list tạm rồi sửa sau, hoặc dùng {{ConcurrentHashMap}} (iterator weakly consistent, không ném CME), hoặc copy snapshot rồi duyệt. Đừng bắt và nuốt CME.

### Trên production
- Triệu chứng 1: CME trong unit test một luồng — gần như luôn là for-each + remove, hoặc một getter được gọi lúc log/tuần tự hoá object mà bên trong nó tự nạp cache vào map (đọc kỹ stack trace để biết **ai** sửa, vì CME chỉ báo chỗ phát hiện).
- Triệu chứng 2, nguy hiểm hơn: **không** có CME nhưng kết quả sai trong app đa luồng dùng {{ArrayList}}/{{HashMap}}: mất node, {{size}} lệch, {{null}} xuất hiện trong mảng, thậm chí vòng lặp không bao giờ kết thúc. Đây chính là lúc fail-fast im lặng vì race.
- Kỹ thuật debug rẻ: wrap collection bằng một class ghi lại stack trace mỗi lần sửa cấu trúc (chỉ bật trong môi trường test), vì debugger chỉ cho bạn giá trị {{modCount}}, không cho biết ai vừa tăng nó.
- Guideline cho team: (1) không sửa collection đang duyệt, dùng {{removeIf}}/{{compute}}; (2) collection chia sẻ giữa thread phải là concurrent hoặc bất biến ({{List.copyOf}}, {{Set.of}}); (3) khi trả collection ra ngoài thì trả bản copy/unmodifiable; (4) không catch CME để retry — nó là tín hiệu logic sai.
- {{transient}} trên {{modCount}} cũng giải thích một hiện tượng nhỏ: map vừa deserialize có {{modCount}} = 0, nên debugger thấy 0 không có nghĩa là chưa ai sửa.

> Senior tip: CME không phải "lỗi đa luồng", nó là "có người sửa cấu trúc ngoài iterator". Cái đáng sợ thật là trường hợp ngược lại: race mà fail-fast không phát hiện, vì {{modCount}} không volatile và không có happens-before. Nên câu trả lời lead là: fail-fast chỉ là công cụ debug, còn tính đúng đắn đến từ {{synchronized}}, concurrent collection hoặc bất biến.`,
  follow: [
    'Vì sao modCount không volatile làm fail-fast không đáng tin trong đa luồng, và JMM nói gì về race này?',
    'removeIf khác vòng lặp + it.remove() ở số lần tăng modCount và chi phí arraycopy như thế nào?',
    'Khi nào bạn chấp nhận iterator weakly consistent của ConcurrentHashMap, khi nào bắt buộc phải snapshot?'
  ],
  tags: ['modCount', 'fail-fast', 'ConcurrentModificationException', 'iterator', 'removeIf', 'data race']
},
{
  id: 'collections-035',
  topic: 'collections',
  level: 'lead',
  q: 'Người ta nói ArrayList nhanh hơn LinkedList vì cache locality. Bạn ĐO điều đó thế nào bằng JMH, đọc kết quả ra sao, và những bẫy nào làm microbenchmark kết luận sai?',
  a: `**Tóm tắt:** Big-O chỉ đếm **số thao tác**, không đếm chi phí của mỗi thao tác. Duyệt {{ArrayList}} đi trên một mảng reference liên tục (một cache line 64 byte chứa 8-16 reference, prefetch được); duyệt {{LinkedList}} là chuỗi pointer chase qua các node rải trên heap, mỗi bước có thể một cache miss. Kết luận phải đến từ phép đo tử tế: JMH với đủ warmup, {{@Fork}}, Blackhole/kết quả được dùng, và {{-prof gc}} — vì đa số microbenchmark sai ở chỗ JIT xoá code hoặc so hai thao tác khác nhau.

### Ba lớp chi phí của một phép tính
- Số thao tác: điều Big-O mô tả.
- Chi phí mỗi thao tác: load từ L1 cỡ 1 ns, load từ RAM cỡ 80-100 ns — chênh ~100 lần.
- Bộ nhớ: cache line bị chiếm, object header, áp lực lên GC.

~~~text
ArrayList 10 phần tử (compressed oops):
  elementData: [ r0 r1 r2 r3 r4 r5 r6 r7 r8 r9 ]   40 byte, nằm trong 1 cache line
  -> duyệt tuần tự, CPU prefetch được; các object Integer vẫn nằm rải rác

LinkedList 10 phần tử:
  node0 [prev|item|next]  node1 [prev|item|next]  ...   mỗi node 24 byte (header 12 + 3 reference)
  -> được cấp phát theo thời gian nên vị trí trên heap gần như ngẫu nhiên
  -> mỗi bước duyệt là một lần đọc con trỏ không dự đoán được
~~~

### Benchmark tối thiểu
~~~java
@BenchmarkMode(Mode.AverageTime)
@OutputTimeUnit(TimeUnit.MICROSECONDS)
@State(Scope.Benchmark)
@Warmup(iterations = 5, time = 1)
@Measurement(iterations = 5, time = 1)
@Fork(2)
public class ListBench {
    @Param({"1000", "100000"}) int n;
    List<Integer> arr, link;

    @Setup(Level.Trial) public void init() {
        arr = new ArrayList<>(); link = new LinkedList<>();
        for (int i = 0; i < n; i++) { arr.add(i); link.add(i); }
    }

    @Benchmark public long sumArrayList()   { long s = 0; for (int x : arr)  s += x; return s; }
    @Benchmark public long sumLinkedList()  { long s = 0; for (int x : link) s += x; return s; }
    // Lưu ý: benchmark chèn/xoá giữa mà tự làm hỏng kích thước list cần @Setup(Level.Invocation) để khôi phục;
    // ví dụ dưới chỉ minh hoạ ý tưởng. Với phép đo thật, dùng @Setup(Level.Invocation) copy list mới mỗi lần.
    @Benchmark public long addMiddleArray(Blackhole bh) { ArrayList<Integer> a = new ArrayList<>(arr); a.add(n / 2, 7); return a.size(); }
    @Benchmark public long addMiddleLink(Blackhole bh)  { LinkedList<Integer> l = new LinkedList<>(link); l.add(n / 2, 7); return l.size(); }
}
~~~
- Chạy: tạo project từ archetype {{jmh-archetypes}}, rồi {{java -jar target/benchmarks.jar ListBench -p n=100000 -prof gc}}. {{-prof gc}} thêm cột byte cấp phát mỗi operation và số lần GC — cách chứng minh khác biệt đến từ **bộ nhớ/cache** chứ không phải số lệnh.
- Đọc kết quả: {{Score}} phải kèm {{Error}} và {{Cnt}}; hai điểm số chỉ đáng so khi khoảng tin cậy không chồng nhau.

### Số điển hình (minh hoạ — hãy tự đo trên máy và dữ liệu của bạn)
| Phép với n = 100.000 Integer | ArrayList | LinkedList |
|---|---|---|
| Duyệt lấy tổng | ~15-30 µs | ~120-250 µs |
| {{get(i)}} ngẫu nhiên | cỡ nano giây (phép tính index) | cỡ micro giây (đi bộ tới i) |
| Chèn vào giữa | memmove mảng reference, vài µs, không cấp phát object | tìm node O(n) + đổi 3 con trỏ + 1 object mới |
| Bộ nhớ riêng cho cấu trúc | 4 byte mỗi slot reference | 24 byte mỗi node (compressed oops), cộng dấu vết cấp phát |
- Điều ngược đời: {{add(index, e)}} của **cả hai** đều O(n) — ArrayList vì memmove, LinkedList vì phải **đi tới** vị trí. LinkedList chỉ rẻ khi bạn đã có {{ListIterator}} nằm đúng chỗ đó (ví dụ vừa {{next()}} xong rồi {{remove()}}).

### Bẫy làm số liệu sai
| Bẫy | Chuyện gì xảy ra | Cách tránh |
|---|---|---|
| Thiếu warmup | đo interpreter/C1, kết luận sai về inlining và escape analysis | {{@Warmup}} đủ, {{@Fork(2)}} (chạy benchmark ở JVM tiến trình riêng, tránh ảnh hưởng chéo), kiểm tra score đã ổn định |
| JIT xoá code vì kết quả không dùng | score ~0 ns, "benchmark nói list nhanh gấp 100 lần" | trả kết quả ra ngoài hoặc {{Blackhole.consume}} (Blackhole: API JMH "tiêu thụ" kết quả để JIT không được xoá code) |
| Constant folding (JIT tính sẵn hằng), tự làm hỏng dữ liệu | {{@Setup}} tính sẵn kết quả; chèn/xoá tích luỹ khiến n đổi theo iteration | input đổi thật sự, {{@Param}}, {{@Setup(Level.Invocation)}} khi cần khôi phục trạng thái mỗi lần gọi |
| So hai phép khác nhau | "add ở cuối" với "get theo index" | mỗi benchmark một thao tác, cùng dữ liệu, cùng n |
| GC chen vào | điểm số mang cả chi phí dọn rác | {{-prof gc}}; allocation bằng nhau thì khác biệt nằm ở cache |
| Máy có IDE đang chạy, CPU limit trong container | phương sai lớn, {{availableProcessors}} không phản ánh máy thật | nhiều fork, tắt việc nặng, khai báo CPU thật |

### Trên production
- JMH chạy như một job định kỳ (baseline rồi so sánh) khi đổi cấu trúc dữ liệu ở đường nóng, nhưng kết luận cuối vẫn phải đến từ profiling workload thật: async-profiler hoặc JFR event {{jdk.ObjectAllocationSample}}, flame graph chỉ vào {{ArrayList.contains}}.
- Case hay gặp trong review: {{orders.contains(x)}} trong vòng lặp 100k lần — thủ phạm là Big-O chứ không phải cache locality, vẫn cùng bài học: đo rồi hãy sửa.
- Khi nào đáng đo: đổi cấu trúc dữ liệu ở đường nóng, hoặc ai đó đề nghị {{LinkedList}}. Khi nào không: code chạy năm lần mỗi request.

> Senior tip: khác biệt senior/lead ở câu này không phải thuộc con số, mà là khả năng **thiết kế phép đo**: vì sao cần {{@Fork}}, Blackhole, {{-prof gc}}, và vì sao số đo trên 100k phần tử có thể vô nghĩa với workload 50 phần tử. Câu chốt: "{{LinkedList}} sai gần như mọi lúc — và tôi chứng minh được bằng JMH trên dữ liệu thật của chính hệ thống này."`,
  follow: [
    'Blackhole tồn tại để chặn điều gì, và nếu bỏ nó thì JIT "gian lận" ra sao?',
    '{{@Setup(Level.Invocation)}} làm benchmark sai theo hướng nào, và thay thế bằng gì?',
    'Bạn viết thêm benchmark nào để chứng minh ArrayDeque thắng LinkedList khi làm queue?'
  ],
  tags: ['JMH', 'microbenchmark', 'cache locality', 'ArrayList', 'LinkedList', 'Blackhole'],
  refs: [
    { type: 'doc', title: 'JMH README (OpenJDK)', url: 'https://github.com/openjdk/jmh' }
  ]
}
,
{
  id: 'modern-039',
  topic: 'modern',
  level: 'senior',
  q: 'Virtual threads (Java 21) khi migrate tu platform thread: ThreadLocal nang, JDBC pool nut that, semaphore gioi han dong thoi.',
  a: `**Tóm tắt:** Virtual thread (luồng ảo - thread nhẹ do JVM quản lý, chính thức từ Java 21/JEP 444) giúp xử lý rất nhiều tác vụ I/O chờ (gọi DB, HTTP) bằng code blocking quen thuộc, nhưng khi migrate từ platform thread (thread của hệ điều hành, nặng và ít) bạn sẽ đụng 3 nút thắt mới: {{ThreadLocal}} phình bộ nhớ, connection pool JDBC (bộ kết nối CSDL tái sử dụng) trở thành giới hạn thật, và phải dùng semaphore/bulkhead (cơ chế giới hạn số tác vụ chạy đồng thời) để bảo vệ tài nguyên hạ nguồn.

### Cái gì và vì sao virtual thread khác
- **Platform thread**: mỗi thread ánh xạ 1-1 với thread OS. Tạo tốn (stack thường ~1MB), số lượng thực tế chỉ vài nghìn → mô hình "thread-per-request" chạm trần khi nhiều request đang chờ I/O.
- **Virtual thread**: do JVM lập lịch lên một số ít **carrier thread** (thread OS mang). Khi virtual thread gặp blocking I/O (đọc socket, JDBC), JVM **unmount** (gỡ) nó khỏi carrier để carrier chạy việc khác; I/O xong thì **mount** lại. Nhờ vậy bạn có thể có hàng chục nghìn/hàng triệu virtual thread cùng "đang chờ" mà không tốn triệu thread OS.
- Ví dụ đời thường: platform thread giống mỗi khách hàng chiếm hẳn một nhân viên phục vụ kể cả lúc chờ món; virtual thread giống nhân viên phục vụ nhiều bàn, ai chờ món thì nhân viên chuyển sang bàn khác.

### Bước 1 - Migrate cách dùng thread (thường là phần dễ)
~~~java
// Trước: giới hạn bởi thread pool
ExecutorService exec = Executors.newFixedThreadPool(200);

// Sau (Java 21): mỗi task một virtual thread
try (ExecutorService exec = Executors.newVirtualThreadPerTaskExecutor()) {
    futures = tasks.stream().map(t -> exec.submit(t::run)).toList();
    // try-with-resources chờ tất cả task xong (structured-like)
}
~~~
- API gần như giữ nguyên ({{Runnable/Callable}}). Không cần đổi code blocking thành reactive.
- **Chỉ có lợi cho I/O-bound** (tác vụ chủ yếu chờ). CPU-bound (tính toán nặng) không nhanh hơn, thậm chí tệ hơn do overhead lập lịch.

### Bước 2 - ThreadLocal phình bộ nhớ
- {{ThreadLocal}} lưu một bản sao giá trị **cho mỗi thread**. Với 200 platform thread thì 200 bản; với 200.000 virtual thread thì 200.000 bản → memory bùng nổ (OOM - Out Of Memory).
- Hay gặp: filter gắn {{SecurityContext}}, {{MDC}} (Mapped Diagnostic Context - ngữ cảnh log) của logging, locale, transaction holder.
- Cách xử lý:
  - Luôn {{remove()}} trong {{finally}} (với virtual thread số lượng lớn, quên remove = rò rỉ theo vòng đời task).
  - Truyền dữ liệu qua tham số method thay vì ngầm qua ThreadLocal.
  - Cân nhắc **ScopedValue** (Java 21 preview, ổn định dần ở các bản sau): giá trị bất biến theo phạm vi (scope), kế thừa an toàn cho virtual thread con, không "nhân bản nặng" như ThreadLocal. Kiểm tra trạng thái preview/final theo đúng JDK bạn dùng.

### Bước 3 - JDBC pool là nút thắt thật
- Virtual thread cho phép 10.000 request đồng thời, nhưng database (CSDL) thường chỉ chịu vài chục đến vài trăm connection. {{HikariCP}} (pool JDBC phổ biến) mặc định nhỏ (thường 10). Kết quả: 9.990 virtual thread xếp hàng chờ connection → latency tăng, timeout dồn dập.
- **Giới hạn đồng thời ở tầng gọi DB** bằng semaphore (biến đếm giấy phép):
~~~java
// permits = số connection pool (hoặc nhỏ hơn) để không vượt DB
Semaphore dbPermits = new Semaphore(20);

try (ExecutorService exec = Executors.newVirtualThreadPerTaskExecutor()) {
    exec.submit(() -> {
        dbPermits.acquire();           // chờ lượt, không chiếm carrier khi dùng VT
        try {
            return queryDatabase();    // blocking JDBC
        } finally {
            dbPermits.release();       // trả lượt
        }
    });
}
~~~
- Đây là bulkhead (vách ngăn): cô lập để một hạ nguồn chậm không kéo sập toàn hệ thống. Đừng tăng pool JDBC vô tội vạ - giới hạn nằm ở DB.

### Bước 4 - Pinning (ghim carrier)
- Nếu virtual thread chạy mã trong khối {{synchronized}} hoặc gọi native method mà bị blocking, JVM có thể **không unmount** được → carrier thread bị "ghim", mất lợi ích mở rộng.
- Java 21 vẫn có pinning với {{synchronized}}; các bản mới hơn (đáng chú ý từ Java 24) đã cải thiện để {{synchronized}} không còn pin trong nhiều trường hợp. Kiểm tra đúng phiên bản JDK.
- Cách né: thay {{synchronized}} quanh I/O bằng {{ReentrantLock}}; giữ critical section (đoạn cần khóa) thật ngắn và không chứa I/O.
- Phát hiện: bật JFR (Java Flight Recorder - công cụ ghi sự kiện JVM) sự kiện {{jdk.VirtualThreadPinned}} hoặc dùng {{-Djdk.tracePinnedThreads=full}} khi debug.

### Pitfall thực tế trên production
- **Bật virtual thread nhưng không giới hạn hạ nguồn:** DB, dịch vụ ngoài, thread pool legacy bị quá tải → lỗi dây chuyền.
- **ThreadLocal + virtual thread = rò rỉ/OOM:** nhất là trong filter/logging.
- **Dùng virtual thread cho CPU-bound:** throughput giảm, p99 xấu đi; CPU-bound hãy dùng {{ForkJoinPool}}/parallelism cố định.
- **Pool thread cũ bọc trong virtual thread:** tạo virtual thread chỉ để {{submit}} vào {{fixedThreadPool(50)}} thì vẫn nghẽn ở pool 50.
- **Quan sát kém:** thread dump truyền thống khó đọc với hàng nghìn VT; cần JFR/metrics.

> Senior tip: virtual thread biến "chi phí tạo thread" gần như bằng 0, nhưng **không** biến tài nguyên hạ nguồn thành vô hạn. Công thức thực tế: VT cho fan-out I/O + semaphore = min(pool DB, giới hạn dịch vụ ngoài) + timeout + circuit breaker (ngắt mạch khi hạ nguồn lỗi liên tục). Đo p99 và error rate trước/sau; chỉ rollout khi có số liệu.`,
  follow: [
    'ThreadLocal khác ScopedValue thế nào, và ScopedValue giải quyết được gì cho virtual thread?',
    'Pinning xảy ra khi nào, ảnh hưởng ra sao, và làm sao phát hiện trên production?',
    'Khi nào KHÔNG nên dùng virtual thread?'
  ],
  tags: ['virtual threads', 'ThreadLocal', 'JDBC', 'semaphore', 'pinning'],
  refs: [{ type: 'doc', title: 'JEP 444: Virtual Threads', url: 'https://openjdk.org/jeps/444' }]
},
{
  id: 'modern-040',
  topic: 'modern',
  level: 'lead',
  q: 'Structured concurrency va ScopedValue (Java 21+): trang thai preview/final theo JDK, loi ich va cach dung dung.',
  a: `**Tóm tắt:** Java 21 giới thiệu (dạng preview - xem ghi chú) hai cơ chế đi kèm virtual thread (luồng ảo - thread nhẹ do JVM quản lý): **Structured Concurrency** qua {{StructuredTaskScope}} giúp chạy nhiều subtask (tác vụ con) như một đơn vị có vòng đời rõ ràng (bắt đầu cùng nhau, chờ cùng nhau, huỷ/lỗi thì dọn dẹp cùng nhau); và **ScopedValue** cho phép truyền dữ liệu bất biến theo "phạm vi" (scope) xuống các subtask/thread con an toàn, hiệu quả hơn {{ThreadLocal}} (biến gắn theo thread truyền thống). Lưu ý phiên bản: ở Java 21 chúng là **preview** (cần bật {{--enable-preview}}); {{ScopedValue}} đã thành final ở Java 25, còn {{StructuredTaskScope}} vẫn tiến hoá qua các JDK.

### Cái gì - vì sao cần
- **Vấn đề trước đây:** với {{ExecutorService}} + {{Future}}, bạn tự {{submit}} nhiều tác vụ, tự {{get}} từng cái, tự xử lý timeout/huỷ. Nếu một tác vụ lỗi, các tác vụ kia có thể vẫn chạy ngầm (rò rỉ công việc), thread cha có thể bị block chờ mãi, và stack trace/quan sát (observability) bị rời rạc - khó biết tác vụ con nào thuộc về yêu cầu nào.
- **Structured Concurrency (lập trình đồng thời có cấu trúc):** ý tưởng mượn từ "structured programming" (một khối vào - một khối ra). Các subtask được fork trong một scope; scope đảm bảo khi thoát khối (kể cả lỗi) thì mọi subtask đã hoàn thành hoặc bị huỷ. Vòng đời rõ ràng, không rò rỉ.
- **{{ThreadLocal}} vấn đề gì?** {{ThreadLocal}} gắn giá trị vào thread và phải tự {{set/remove}}; quên {{remove}} trên thread pool gây leak dữ liệu sang request khác. Với hàng triệu virtual thread, giữ bản sao mutable per-thread tốn kém và khó truyền xuống thread con tự động.
- **{{ScopedValue}}:** bind (gắn) một giá trị **bất biến** cho một scope; mọi code trong scope (kể cả virtual thread con tạo bên trong) đọc được; ra khỏi scope tự hết hiệu lực - không cần {{remove}}, không leak.

### Hoạt động thế nào (cơ chế từng bước)
~~~java
// StructuredTaskScope: gọi 2 dịch vụ song song, gộp kết quả
record Result(User u, Order o) {}

Result load(long id) throws Exception {
    // ShutdownOnFailure: 1 subtask lỗi -> huỷ các subtask còn lại
    try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
        var u = scope.fork(() -> fetchUser(id));   // subtask (thường chạy trên VT)
        var o = scope.fork(() -> fetchOrder(id));
        scope.join();            // chờ tất cả (hoặc bị huỷ)
        scope.throwIfFailed();   // ném lỗi nếu có subtask fail
        return new Result(u.get(), o.get()); // an toàn sau join + throwIfFailed
    } // thoát scope: đảm bảo không còn subtask chạy ngầm
}

// ScopedValue: truyền user hiện tại theo scope, không dùng ThreadLocal
static final ScopedValue<User> CURRENT_USER = ScopedValue.newInstance();
void handle(User user) {
    ScopedValue.where(CURRENT_USER, user).run(() -> service.process());
    // trong process() và subtask con: CURRENT_USER.get() trả về user
} // ra khỏi run -> binding tự hết
~~~
1. {{fork}} tạo subtask (thường trên virtual thread). {{join}} chờ; {{ShutdownOnFailure}} huỷ phần còn lại khi một task ném lỗi (fail-fast). {{ShutdownOnSuccess}} trả về kết quả đầu tiên thành công và huỷ phần còn lại.
2. {{ScopedValue.where(...).run/call}} tạo scope binding; giá trị **không đổi** trong scope. Đọc bằng {{CURRENT_USER.get()}} (ném nếu chưa bind) hoặc {{orElse}}.

### Ví dụ đời thực (production)
Giả định API chi tiết đơn hàng (p99 mục tiêu 300ms) cần gọi 3 dịch vụ: user (80ms), order (100ms), khuyến mãi (120ms) - tổng tuần tự ~300ms, sát giới hạn. Cách cũ dùng {{ExecutorService}} submit 3 {{Callable}}, {{future.get(250, ms)}}; khi dịch vụ khuyến mãi lỗi, 2 future kia vẫn có thể chạy xong rồi bị bỏ, và log không liên kết 3 cuộc gọi với cùng request. Đổi sang {{StructuredTaskScope.ShutdownOnFailure}} (trên JDK hỗ trợ preview): fork 3 subtask, {{join}} rồi {{throwIfFailed}}. Kết quả: thời gian ~120ms (chạy song song, lấy max); khi khuyến mãi lỗi, 2 subtask kia bị huỷ ngay, request trả lỗi trong ~90ms thay vì chờ đủ timeout; trace gom 3 subtask thành một cây dễ đọc. {{ScopedValue}} dùng để truyền {{requestId}}/{{tenantId}} bất biến xuống subtask mà không phải {{ThreadLocal.set/remove}} (tránh leak khi dùng pool). (Số liệu giả định, hợp lý cho kiến trúc microservice nội bộ.)

### Trạng thái phiên bản & trade-off
| Cơ chế | Java 21 | Java 22-24 | Java 25 |
|---|---|---|---|
| {{StructuredTaskScope}} | Preview (cần {{--enable-preview}}) | Preview (API có thể đổi) | Vẫn tiến hoá/kiểm tra JDK bạn dùng |
| {{ScopedValue}} | Preview | Preview | Final |

### Pitfall production
- **Preview = API có thể thay đổi:** giữa các JDK, tên method/hành vi của {{StructuredTaskScope}} từng thay đổi. Không dùng preview bừa trong production nếu chưa chấp nhận rủi ro nâng cấp; ghim phiên bản JDK và bật flag rõ ràng.
- **{{ScopedValue}} không cho mutable:** đừng bind một {{Map}} rồi sửa nó - mất tính an toàn. Chỉ bind dữ liệu bất biến (id, context readonly).
- **Timeout:** dùng {{joinUntil(deadline)}} hoặc cơ chế timeout phù hợp; {{join}} không tự hết hạn.
- **Không thay thế mọi thứ:** tác vụ nền sống dài, scheduling phức tạp vẫn cần {{ExecutorService}}/scheduler chuyên dụng.

### Trả lời mẫu khi phỏng vấn
"Structured Concurrency và ScopedValue là hai tính năng đi cùng virtual thread từ Java 21, hiện bắt đầu ở dạng preview nên cần chú ý trạng thái theo phiên bản JDK. StructuredTaskScope cho phép mình fork nhiều subtask trong một scope rồi join như một đơn vị: nếu một subtask lỗi thì có thể huỷ các subtask còn lại, và khi thoát scope thì đảm bảo không còn việc chạy ngầm - khác với ExecutorService nơi mình phải tự quản lý Future và rất dễ rò rỉ tác vụ. ScopedValue thì thay ThreadLocal cho dữ liệu bất biến theo phạm vi như requestId: nó bind trong scope, tự truyền xuống subtask con kể cả virtual thread, và tự hết hiệu lực khi ra khỏi scope nên không có nguy cơ quên remove gây leak như ThreadLocal trên pool. Thực tế tôi dùng pattern này để gọi song song vài dịch vụ và gộp kết quả, vừa giảm latency vừa làm lỗi và huỷ gọn gàng hơn. Khi áp dụng tôi luôn kiểm tra phiên bản JDK và bật enable-preview nếu còn preview, đồng thời chỉ dùng ScopedValue cho dữ liệu immutable."

> Senior tip: coi structured concurrency là "structured programming cho concurrency" - vòng đời subtask đi theo cấu trúc khối code. Trước khi dùng production: xác nhận trạng thái (preview/final) trên đúng JDK bạn chạy, vì {{StructuredTaskScope}} từng đổi API giữa các bản preview; {{ScopedValue}} đã ổn định hơn (final từ Java 25).`,
  follow: ['Vi sao ScopedValue hieu qua hon ThreadLocal?', 'ShutdownOnFailure khac ShutdownOnSuccess?', 'Khi nao van dung ExecutorService?'],
  tags: ['structured concurrency', 'ScopedValue', 'StructuredTaskScope', 'preview'],
  refs: [{ type: 'doc', title: 'JEP 453: Structured Concurrency', url: 'https://openjdk.org/jeps/453' }]
},
{
  id: 'modern-041',
  topic: 'modern',
  level: 'senior',
  q: 'Stream nang cao: tu viet Collector, gatherers (JDK 24) va vi sao parallel stream khong phai luc nao cung nhanh.',
  a: `**Tóm tắt:** Ba mảng nâng cao của Stream (luồng xử lý dữ liệu tuần tự trên collection): (1) tự viết {{Collector}} (bộ gom kết quả) để tuỳ biến cách thu thập - phải hiểu đúng hợp đồng {{supplier/accumulator/combiner/finisher}}; (2) **Gatherers** (JDK 24, {{Stream.gather}}) cho phép viết phép biến đổi trung gian (intermediate operation) tuỳ chỉnh, kiểu "lọc/nhóm/biến đổi" mà API cũ không có sẵn; (3) {{parallel stream}} không phải lúc nào cũng nhanh - nó chậm khi dữ liệu nhỏ, nguồn khó chia, có blocking I/O, hoặc công việc mỗi phần tử quá nhẹ so với chi phí chia/gộp. Luôn đo trước khi bật parallel.

### 1) Tự viết Collector - cái gì, vì sao, cơ chế
- **Cái gì:** {{Collector}} mô tả cách gom các phần tử của stream thành một kết quả (ví dụ {{toList}}, {{groupingBy}}). Khi API có sẵn không đủ, bạn tự viết.
- **Hợp đồng 4 thành phần ({{Collector.of(...)}}):**
  - {{supplier}}: tạo "thùng chứa" rỗng (gọi mỗi lần bắt đầu / mỗi phân vùng khi parallel).
  - {{accumulator}}: nhét một phần tử vào thùng ({{(container, element) -> ...}}).
  - {{combiner}}: gộp hai thùng thành một - **bắt buộc đúng** khi chạy parallel, vì mỗi thread gom một thùng riêng rồi combiner trộn lại.
  - {{finisher}}: (tuỳ chọn) biến thùng thành kết quả cuối; bỏ qua nếu thùng chính là kết quả ({{IDENTITY_FINISH}}).
- **Bẫy hay gặp:** accumulator sửa state chia sẻ bên ngoài (không thread-safe khi parallel); combiner gộp sai (mất phần tử, sai thứ tự) → kết quả sai chỉ lộ ra khi chạy parallel.

~~~java
import java.util.*;
import java.util.stream.*;

// Ví dụ: gom thành danh sách chỉ đọc, tự viết bằng Collector.of
Collector<String, ?, List<String>> toImmutable = Collector.of(
    ArrayList::new,                 // supplier: thùng rỗng
    ArrayList::add,                 // accumulator: thêm phần tử
    (left, right) -> { left.addAll(right); return left; }, // combiner
    List::copyOf                    // finisher: ra danh sách bất biến
);
List<String> res = Stream.of("a","b","c").collect(toImmutable);
~~~

### 2) Gatherers (JDK 24) - intermediate tuỳ chỉnh
- **Cái gì:** {{Stream.gather(Gatherer)}} (Java 24) cho phép tự định nghĩa phép biến đổi **trung gian** (trả về stream), lấp khoảng trống mà trước đây muốn làm phải dùng trick hoặc collector phức tạp.
- **Có sẵn trong {{java.util.stream.Gatherers}}:** {{windowFixed(n)}} (cắt thành cụm kích thước cố định), {{windowSliding(n)}} (cửa sổ trượt), {{fold}} (gộp có trạng thái thành 1 phần tử), {{scan}} (giống fold nhưng phát ra từng bước trung gian), {{mapConcurrent(maxConcurrency, fn)}} (map song song có giới hạn concurrency, hữu ích cho I/O nhẹ trong stream).
- **Khác collector:** collector là phép **kết thúc** (terminal) trả về một giá trị; gatherer là phép **trung gian** trả về stream để nối tiếp.

~~~java
import java.util.stream.Gatherers;
// Cửa sổ trượt kích thước 3
var windows = List.of(1,2,3,4,5).stream()
        .gather(Gatherers.windowSliding(3))
        .toList(); // [[1,2,3],[2,3,4],[3,4,5]]
~~~

### 3) Vì sao parallel stream không phải lúc nào cũng nhanh
- Dùng chung {{ForkJoinPool.commonPool}}; nếu pipeline có blocking I/O → worker bị giữ, gây đói tài nguyên (xem thêm modern-027).
- Chi phí **split** (chia nguồn) + **combine/merge** (gộp) có thật. Nguồn khó chia ({{LinkedList}}, {{Iterator}}, {{Stream.iterate}}, IO source) → gần như không song song nhưng vẫn trả overhead.
- Dữ liệu nhỏ hoặc công việc mỗi phần tử rất nhẹ (N * Q nhỏ, N: số phần tử, Q: chi phí mỗi phần tử) → overhead > lợi ích. Quy tắc ngón tay: chỉ đáng cân nhắc khi N*Q đủ lớn và đo được.
- Phải giữ tính đúng: {{combiner}} và collector phải an toàn; không side effect chia sẻ.

| Tình huống | Dùng | Lý do |
|---|---|---|
| Gom kết quả tuỳ biến | Tự viết {{Collector}} (terminal) | Hợp đồng rõ, hỗ trợ parallel nếu combiner đúng |
| Biến đổi trung gian tuỳ biến (JDK 24+) | {{Gatherer}} | API dành riêng cho intermediate |
| CPU-bound, dữ liệu lớn, nguồn chia tốt | Cân nhắc {{parallel()}} + **benchmark** | Tận dụng đa lõi |
| I/O-bound / dữ liệu nhỏ | Tuần tự hoặc {{CompletableFuture}}/virtual thread | Tránh block commonPool, tránh overhead |

### Ví dụ đời thực (production)
Giả định job tổng hợp log giao dịch: 2 triệu bản ghi, mỗi bản ghi cần parse + tính điểm rủi ro (CPU-bound thuần, ~5 micro giây/bản ghi) rồi gom thống kê theo nhóm. Bản đầu dùng {{parallelStream}} trên {{ArrayList}} (nguồn chia tốt) + collector tự viết; trên máy 8 lõi, thời gian từ ~10s (tuần tự) xuống ~2,8s, combiner được test kỹ nên kết quả khớp. Bản khác, dev áp dụng y hệt {{parallelStream}} cho 800 bản ghi cấu hình nhỏ, mỗi phần tử chỉ vài phép so sánh: thời gian tăng từ 3ms lên 12ms do overhead chia/gộp, và đôi lúc p99 nhảy vì tranh chấp {{commonPool}} với tác vụ khác. Cách sửa: đặt ngưỡng - chỉ bật parallel khi kích thước vượt ngưỡng (ví dụ > 50.000 phần tử) **và** có benchmark xác nhận; bộ nhỏ giữ tuần tự. Với nhu cầu "cửa sổ trượt 10 giao dịch" để phát hiện mẫu, trên JDK 24 dùng {{gather(Gatherers.windowSliding(10))}} thay vì tự quản lý buffer phức tạp.

### Pitfall production
- **Combiner sai chỉ lộ khi parallel:** unit test chạy tuần tự vẫn pass; phải test với {{parallelStream()}} hoặc dữ liệu đủ để framework song song hoá.
- **Dùng {{mapConcurrent}} gatherer cho blocking nặng:** nó giới hạn concurrency nhưng vẫn chạy trên hạ tầng stream - với blocking I/O lớn, cân nhắc tách sang executor/virtual thread rõ ràng.
- **Tối ưu sớm:** đo bằng benchmark (JMH) trên dữ liệu thật; "parallel" không phải công tắc thần kỳ.

### Trả lời mẫu khi phỏng vấn
"Với Stream nâng cao, tôi chia ba phần. Một là tự viết Collector khi cần tuỳ biến cách gom: phải nắm hợp đồng supplier tạo thùng, accumulator thêm phần tử, combiner gộp hai thùng - combiner đặc biệt quan trọng vì khi chạy parallel mỗi thread gom riêng rồi mới gộp, sai combiner là ra kết quả sai. Hai là từ JDK 24 có Gatherers cho phép viết intermediate operation tuỳ chỉnh như windowFixed, windowSliding hay mapConcurrent, thay vì phải lạm dụng collector hay trick. Ba là parallel stream không phải lúc nào cũng nhanh: nó dùng chung ForkJoinPool.commonPool, tốn chi phí chia và gộp, nên chỉ có lợi khi CPU-bound, dữ liệu lớn, nguồn dễ chia như ArrayList, và pipeline không blocking. Với I/O hay dữ liệu nhỏ, nó thường chậm hơn và còn gây tranh chấp pool. Nguyên tắc của tôi là mặc định tuần tự, chỉ bật parallel khi có benchmark chứng minh lợi ích trên dữ liệu thực tế."

> Senior tip: test {{Collector}} tự viết với cả {{stream()}} và {{parallelStream()}} - combiner sai là loại bug "âm thầm". Với gatherers, kiểm tra phiên bản JDK (cần 24+). Trước khi dùng {{parallel()}}, đo bằng JMH; đừng tin cảm giác. (Tham khảo: JEP 485 - Stream Gatherers.)`,
  follow: ['Combiner cua Collector can lam gi?', 'Gatherers.mapConcurrent khac parallel stream?', 'Lam sao do parallel stream?'],
  tags: ['Stream', 'Collector', 'gatherers', 'parallel', 'JDK 24'],
  refs: [{ type: 'doc', title: 'JEP 485: Stream Gatherers', url: 'https://openjdk.org/jeps/485' }]
},
{
  id: 'modern-042',
  topic: 'modern',
  level: 'lead',
  q: 'Text blocks, switch expression, var - pitfall khi review code.',
  a: `**Tóm tắt:** Ba cú pháp "tiện" của Java hiện đại đều có bẫy khi review: **text block** (chuỗi nhiều dòng, Java 15) tính thụt lề theo khoảng trắng chung nhỏ nhất và dễ dính lỗi xuống dòng cuối; **switch expression** (switch trả về giá trị, Java 14) buộc exhaustive (phủ hết trường hợp) và xử lý {{null}} khác switch cũ; **var** (suy luận kiểu cục bộ, Java 10) chỉ dùng cho biến local và làm code khó đọc nếu kiểu không rõ từ vế phải.

### 1) Text block - cái gì, vì sao cần, bẫy gì
- **Cái gì:** chuỗi nhiều dòng viết giữa ba dấu ngoặc kép {{""" ... """}}, tiện cho SQL/JSON/HTML nhúng trong code. Trình biên dịch tự xử lý xuống dòng và thụt lề.
- **Vì sao cần:** trước đây phải nối chuỗi {{\\n}} và escape ngoặc kép, rất khó đọc và dễ sai.
- **Cơ chế thụt lề (incidental whitespace):** Java tìm số khoảng trắng đầu dòng nhỏ nhất trong các dòng nội dung (xét cả vị trí dấu đóng {{"""}}) rồi cắt bỏ bấy nhiêu ở mỗi dòng. Vì vậy đặt dấu đóng lùi sâu hay nông sẽ đổi kết quả.
- **Bẫy xuống dòng cuối:** nếu đặt dấu đóng {{"""}} ở dòng riêng, text block có thêm một ký tự xuống dòng ở cuối. Muốn bỏ, dùng {{\\}} ở cuối dòng hoặc đặt dấu đóng sát nội dung (tùy trường hợp).
- **Bẫy escape:** text block vẫn là chuỗi Java - {{\\}} vẫn là escape. Cần dùng {{\\s}} khi muốn giữ khoảng trắng cuối dòng (trailing space), vì trình biên dịch thường loại bỏ trailing whitespace.

~~~java
String sql = """
        SELECT id, name
        FROM users
        WHERE active = true
        """; // dấu đóng thẳng hàng -> cắt hết thụt lề trái
// Cẩn thận: KHÔNG nối dữ liệu người dùng vào SQL text block
String bad = """
        SELECT * FROM users WHERE name = '""" + userInput + "'";
// -> SQL injection (chèn mã SQL độc hại). Dùng PreparedStatement.
~~~

### 2) Switch expression - exhaustive và null
- **Cái gì:** switch có thể trả về giá trị (expression) dùng {{->}} hoặc {{yield}}; compiler kiểm tra đã phủ hết nhánh chưa.
- **Exhaustive (phủ hết):** với {{enum}} hoặc sealed type, nếu liệt kê đủ mọi giá trị thì không cần {{default}}. Lợi ích: thêm giá trị enum mới → compile lỗi ở mọi switch thiếu nhánh, thay vì rơi vào {{default}} im lặng.
- **Bẫy {{null}}:** switch truyền thống trên {{String/enum}} ném {{NullPointerException}} (NPE - lỗi truy cập null) khi selector là {{null}}. Từ Java 21, pattern matching cho phép {{case null}} tường minh; nếu không có {{case null}} (và không có {{default}} bắt), {{null}} vẫn gây NPE. Khi review phải hỏi: "giá trị này có thể null không?".
- **Bẫy thứ tự pattern (Java 21):** pattern tổng quát đặt trước pattern cụ thể → nhánh sau bị "dominated" (không bao giờ chạy) và compiler báo lỗi.

~~~java
// Java 21: xử lý null rõ ràng
String label = switch (status) {       // status có thể null
    case null -> "UNKNOWN";            // bắt null tường minh
    case ACTIVE -> "Đang hoạt động";
    case LOCKED -> "Bị khóa";
}; // enum phủ hết -> không cần default
~~~

### 3) var - suy luận kiểu cục bộ
- **Cái gì:** {{var}} (Java 10) cho compiler tự suy ra kiểu biến local từ giá trị khởi tạo. Chỉ dùng cho **biến cục bộ** có initializer; **không** dùng cho field, tham số method, kiểu trả về.
- **Vì sao cần:** giảm lặp kiểu dài (ví dụ {{Map<String, List<Order>>}}). Nhưng chỉ đáng khi vế phải nói rõ kiểu.
- **Bẫy "kiểu không rõ":** {{var x = get();}} buộc người đọc phải đoán kiểu → review chậm, dễ hiểu sai.
- **Bẫy {{diamond}} + {{var}}:** {{var list = new ArrayList<>();}} suy ra {{ArrayList<Object>}} (không có thông tin kiểu), thường không phải ý bạn muốn.
- **Bẫy {{null}}:** {{var x = null;}} không biên dịch được vì không suy ra được kiểu.

| Tình huống | Nên dùng {{var}}? | Vì sao |
|---|---|---|
| {{var user = new User(name);}} | Có | vế phải rõ kiểu |
| {{var map = Map.of("a", 1);}} | Có | rõ ràng |
| {{var result = service.process(req);}} | Cân nhắc | phải nhìn chữ ký method |
| {{var list = new ArrayList<>();}} | Không | suy ra {{Object}} |

### Pitfall thực tế trên production
- Text block SQL ghép chuỗi dữ liệu → SQL injection (lỗ hổng nghiêm trọng). Luôn dùng bind parameter.
- Switch expression thêm {{default}} "cho chắc" trên enum → mất cảnh báo compile khi enum thêm giá trị mới.
- Review code đồng đội lạm dụng {{var}} khiến logic nghiệp vụ (tiền, trạng thái) bị hiểu nhầm kiểu.

> Senior tip: đặt convention (quy ước) trong team: {{var}} chỉ khi vế phải nói rõ kiểu trong cùng dòng; text block chỉ cho hằng chuỗi (không ghép dữ liệu động); switch trên enum/sealed ưu tiên exhaustive không {{default}} để compiler bắt hộ trường hợp mới. Khi review, ba câu hỏi nhanh: "text block có ghép input không?", "switch có thể nhận null không?", "{{var}} này người đọc có biết kiểu ngay không?".`,
  follow: [
    'Text block bỏ indentation (thụt lề) theo quy tắc nào, và dấu đóng {{"""}} ảnh hưởng ra sao?',
    'Switch expression xử lý {{null}} thế nào so với switch truyền thống?',
    'Khi nào dùng {{var}} làm code khó review hơn, và team nên quy ước ra sao?'
  ],
  tags: ['text block', 'switch expression', 'var', 'review', 'pitfall']
},
{
  id: 'modern-043',
  topic: 'modern',
  level: 'senior',
  q: 'Record: canonical/compact constructor, bat bien nong (shallow), equals/hashCode, DTO/JPA.',
  a: `**Tóm tắt:** {{record}} (Java 16) là lớp bất biến "mang dữ liệu", compiler tự sinh constructor, accessor, {{equals/hashCode/toString}}; **compact constructor** cho phép validate/chuẩn hóa tham số trước khi gán; nhưng tính bất biến chỉ là **nông (shallow)** - nếu component là {{List/Map}} có thể sửa được thì record vẫn bị thay đổi gián tiếp. Record rất hợp làm DTO (Data Transfer Object - đối tượng chuyển dữ liệu), **không** phù hợp làm JPA entity (thực thể ánh xạ bảng CSDL).

### Record là gì và vì sao cần
- **Vấn đề:** lớp "chỉ chứa dữ liệu" (POJO) thường phải viết lặp lại constructor, getter, {{equals}}, {{hashCode}}, {{toString}} - nhiều code, dễ quên cập nhật khi thêm field.
- **Record giải quyết:** khai báo {{record Order(String id, long amountCents)}} → compiler sinh tất cả. Mỗi component là {{private final}} và có accessor cùng tên ({{order.id()}}, không phải {{getId()}}).
- Ví dụ đời thường: thay vì tự điền mọi ô trong một biểu mẫu lặp đi lặp lại, bạn dùng một mẫu in sẵn - chỉ cần khai báo các trường.

### Canonical constructor vs Compact constructor
- **Canonical constructor:** constructor "đầy đủ" nhận đúng tất cả component theo thứ tự khai báo. Bạn có thể tự viết để validate, nhưng phải tự gán mọi field.
- **Compact constructor:** dạng rút gọn, **không** liệt kê tham số và **không** gán field thủ công. Bạn chỉ kiểm tra/chuẩn hóa; cuối compact constructor, compiler tự gán {{this.id = id}} (giá trị sau chuẩn hóa) cho mọi component.

~~~java
public record Order(String id, List<String> items) {
    // Compact constructor: validate + chuẩn hóa + defensive copy
    public Order {
        if (id == null || id.isBlank()) {
            throw new IllegalArgumentException("id trống");
        }
        id = id.trim();                         // chuẩn hóa -> compiler tự gán
        items = List.copyOf(items);             // defensive copy (sao chép phòng thủ)
        // KHÔNG viết this.items = ... ; compiler tự làm sau block này
    }
}
~~~

### Bất biến nông (shallow immutability) - bẫy quan trọng
- {{final}} chỉ ngăn gán lại **tham chiếu** {{items}} sang list khác; nó **không** ngăn sửa nội dung bên trong nếu list đó mutable (có thể thay đổi).
- Vì vậy {{record R(List<String> items)}} nhận {{new ArrayList<>()}} từ bên ngoài mà không copy → bên ngoài vẫn {{add/remove}} được → record "đột nhiên đổi".
- **Cách đúng:** dùng {{List.copyOf(items)}} (trả về bản sao bất biến, đồng thời chặn {{null}} phần tử). Với mảng, dùng {{array.clone()}} hoặc bọc bất biến.

### equals/hashCode/toString
- Sinh tự động dựa trên **tất cả** component, so sánh theo giá trị (value-based). Hai record cùng kiểu, cùng giá trị component → {{equals}} là {{true}}.
- **Cẩn thận:** nếu component là mảng ({{byte[]}}), {{equals}} của mảng so sánh tham chiếu, không so sánh nội dung → hai record chứa mảng giống nội dung vẫn có thể {{equals}} false. Tránh dùng mảng thô trong record; dùng {{List}} hoặc tự override (ít khi cần).

### Record làm DTO - rất hợp
- Ít boilerplate, bất biến, {{toString}} hữu ích khi log, dễ serialize/deserialize với Jackson (từ Jackson 2.12+ hỗ trợ record tốt) và dùng làm response/request object.
- Phù hợp: API response, message event, value object trong domain.

### Record làm JPA entity - KHÔNG nên
- **JPA/Hibernate (thư viện ORM - ánh xạ object ↔ bảng CSDL, Hibernate 6 dùng trong Spring Boot 3.x)** cần: constructor không tham số (no-arg), field có thể gán lại (mutable), và khả năng tạo **proxy** (lớp con sinh lúc chạy để lazy loading - nạp trễ).
- Record: không có no-arg constructor, component {{final}}, là {{final}} class (không cho kế thừa) → Hibernate không tạo proxy được, không gán field qua setter. Vì vậy **không dùng record làm {{@Entity}}**.
- **Có thể dùng:** record làm **projection** (kết quả truy vấn chỉ đọc), ví dụ {{select new com.app.UserDto(u.id, u.name) from User u}} trong JPQL, hoặc interface/DTO projection của Spring Data JPA.

### Pitfall thực tế trên production
- Nghĩ record "bất biến tuyệt đối" rồi nhét {{List}} mutable vào → state bị sửa từ nơi khác, bug khó truy vết.
- Dùng record làm entity → lỗi khởi động Hibernate hoặc hành vi lazy loading sai.
- Thêm logic nặng trong compact constructor (gọi DB/mạng) → constructor khó test, bất ngờ khi deserialize.
- Trộn accessor kiểu record {{id()}} với quy ước JavaBean {{getId()}} làm một số framework cũ không map được (hiếm, nhưng kiểm tra khi tích hợp).

> Senior tip: dùng record cho value object/DTO và kết quả truy vấn; luôn defensive-copy các component dạng collection/mảng trong compact constructor ({{List.copyOf}}, {{Map.copyOf}}). Với JPA, giữ entity là class thường và map sang record DTO ở tầng service/controller - vừa tận dụng bất biến, vừa không phá cơ chế proxy/lazy của Hibernate.`,
  follow: [
    'Vì sao Hibernate không tạo được proxy cho record, và điều đó ảnh hưởng lazy loading thế nào?',
    'Compact constructor khác canonical constructor ở điểm nào, khi nào nên dùng compact?',
    'Record pattern (Java 21, khử cấu trúc) giúp gì khi xử lý dữ liệu lồng nhau?'
  ],
  tags: ['record', 'compact constructor', 'DTO', 'JPA', 'shallow immutability']
},
{
  id: 'modern-044',
  topic: 'modern',
  level: 'lead',
  q: 'Sealed + pattern matching switch: exhaustiveness, compiler kiem tra, loi ich khi them subtype moi.',
  a: `**Tóm tắt:** {{sealed}} (Java 17) giới hạn chính xác tập lớp con được phép; kết hợp **pattern matching for switch** (Java 21) thì compiler có thể kiểm tra **exhaustive** (đã xử lý hết mọi kiểu con) ngay lúc biên dịch. Lợi ích lớn nhất: khi thêm subtype mới vào hierarchy, mọi {{switch}} expression thiếu nhánh sẽ **lỗi compile** - bạn được compiler "dẫn đi sửa" thay vì phát hiện bug ở runtime.

### Sealed là gì và vì sao cần
- **Vấn đề:** class/interface thường cho phép ai cũng kế thừa/implement → bạn không thể biết trước "có bao nhiêu loại" để xử lý. Thêm một loại mới dễ làm sót nhánh {{if-else/switch}}.
- **Sealed giải quyết:** {{sealed class Payment permits Card, Cash, Wallet}} khai báo danh sách con đóng. Mỗi lớp con trực tiếp phải chọn đúng một trong: {{final}} (không cho kế thừa tiếp), {{sealed}} (đóng tiếp một tầng), hoặc {{non-sealed}} (mở lại cho kế thừa tự do). Các lớp con thường phải cùng module hoặc cùng package (quy tắc Java).
- Ví dụ đời thường: phương thức thanh toán của cửa hàng chỉ gồm tiền mặt, thẻ, ví điện tử - danh sách cố định giúp quầy thu ngân biết phải xử lý đủ các loại.

### Exhaustiveness - compiler kiểm tra gì
- Với {{switch}} **expression** (trả giá trị) trên một sealed type, nếu bạn liệt kê đủ mọi subtype được phép thì **không cần {{default}}**. Compiler chứng minh "không còn trường hợp nào khác".
- Nếu thiếu một subtype → **lỗi biên dịch** (compile-time). Đây là khác biệt cốt lõi so với {{if-else}} chuỗi (chỉ kiểm tra runtime, sót nhánh thì im lặng).

~~~java
sealed interface Payment permits Card, Cash {}
record Card(String number) implements Payment {}
record Cash(long amountCents) implements Payment {}

String fee(Payment p) {
    return switch (p) {                     // switch expression
        case Card c -> "1.5%";             // xử lý Card
        case Cash c -> "0";                // xử lý Cash
    }; // đủ hết permits -> không cần default, compiler chấp nhận
}
// Nếu sau này thêm: record Wallet(...) implements Payment
// và cập nhật permits -> hàm fee() SẼ LỖI COMPILE vì thiếu case Wallet.
~~~

### Thêm subtype mới - tại sao đây là "lợi ích lead"
- Quy trình an toàn: (1) thêm {{Wallet}} và khai báo vào {{permits}}; (2) build → compiler liệt kê mọi {{switch}} chưa xử lý {{Wallet}}; (3) sửa từng chỗ. Không còn kiểu "quên một chỗ, 3 tháng sau mới nổ bug".
- So sánh với **visitor pattern** (mẫu thiết kế tách thuật toán khỏi cấu trúc đối tượng): visitor cũng ép cập nhật khi thêm type, nhưng cần nhiều boilerplate (interface visitor, method accept). Sealed + switch cho exhaustive check với code ngắn hơn, dispatch (chọn nhánh) rõ ràng ngay tại chỗ.

### {{non-sealed}} và đánh đổi
- Một nhánh {{non-sealed}} cho phép lớp con "không kiểm soát" bên ngoài → compiler **không** còn chứng minh được đã phủ hết (có thể có subtype lạ xuất hiện lúc runtime) → bạn **phải** có {{default}} hoặc nhánh kiểu cha. Vì vậy dùng {{non-sealed}} có chủ đích, khi bạn thật sự cần điểm mở rộng.

### Bẫy khi migrate và khi review
- **{{null}}:** pattern matching switch ném {{NullPointerException}} nếu selector là {{null}} và bạn không có {{case null}}. Luôn quyết định rõ: chấp nhận null ({{case null}}) hay chặn null trước switch.
- **Thứ tự case (dominance):** pattern tổng quát (ví dụ kiểu cha) đặt trước pattern cụ thể → nhánh cụ thể bị che và compiler báo lỗi. Đặt nhánh cụ thể trước.
- **Guard {{when}}:** {{case Card c when c.expired() -> ...}} thêm điều kiện; nhánh có guard chưa chắc phủ hết subtype đó → có thể vẫn cần nhánh "còn lại" cho cùng subtype.
- **Lạm dụng trên domain mở:** nếu kiểu con thay đổi thường xuyên bởi plugin bên ngoài, sealed gây sửa nhiều chỗ; hãy dùng interface thường + {{default}}.

| Cách tiếp cận | Khi thêm type mới | Boilerplate | Kiểm tra |
|---|---|---|---|
| {{if-else/instanceof}} cũ | Dễ quên, im lặng | Thấp | Runtime |
| Visitor pattern | Bị ép sửa | Cao | Compile (nếu đủ kỷ luật) |
| Sealed + switch pattern | Compiler báo mọi chỗ thiếu | Thấp | Compile |

> Senior tip: mô hình hóa domain "đóng" (trạng thái đơn hàng, loại sự kiện, kết quả xử lý) bằng {{sealed interface}} + {{record}} cho từng biến thể, rồi dùng switch expression exhaustive. Khi ai đó thêm biến thể mới, để compiler dẫn đường - đó là lợi ích thiết kế lớn hơn cả cú pháp. Chỉ dùng {{default}} khi bạn thật sự chấp nhận "loại chưa biết" (ví dụ đọc dữ liệu tương lai), và khi đó hãy log/cảnh báo thay vì nuốt im.`,
  follow: [
    'Vì sao switch pattern trên sealed type thường không cần {{default}}, và khi nào vẫn cần?',
    '{{non-sealed}} ảnh hưởng thế nào đến khả năng kiểm tra exhaustive của compiler?',
    'Switch pattern xử lý {{null}} khác switch truyền thống trên {{String/enum}} ra sao?'
  ],
  tags: ['sealed', 'pattern matching', 'switch', 'exhaustiveness', 'Java 21']
},
{
  id: 'modern-045',
  topic: 'modern',
  level: 'senior',
  q: 'Sealed class va pattern matching for switch (Java 21): exhaustiveness dam bao gi va pitfall khi migrate tu if-else/visitor.',
  a: `**Tóm tắt:** Từ Java 21, {{sealed}} (giới hạn tập lớp con) kết hợp pattern matching cho {{switch}} cho phép compiler kiểm tra exhaustive (phủ hết mọi trường hợp) ngay lúc biên dịch. Khi migrate từ chuỗi {{if-else instanceof}} hoặc từ visitor pattern, bạn được code gọn hơn và an toàn hơn khi thêm type mới, nhưng phải chú ý {{null}}, thứ tự case, và chỉ dùng cho domain thật sự "đóng".

### Cái gì và vì sao cần (bối cảnh migrate)
- **Cách cũ 1 - {{if-else}} + {{instanceof}}:** kiểm tra kiểu từng nhánh. Dễ quên một nhánh; thêm subtype mới không có cơ chế nào nhắc, bug chỉ lộ khi chạy đúng case đó.
- **Cách cũ 2 - visitor pattern (mẫu thiết kế "khách thăm"):** mỗi subtype có {{accept(visitor)}}, visitor khai báo một method cho từng subtype. Thêm subtype mới buộc sửa interface visitor → mọi visitor implementation lỗi compile. An toàn, nhưng nhiều boilerplate.
- **Cách mới (Java 21):** {{sealed interface}} + {{record}} cho biến thể + switch expression exhaustive. Bạn giữ được kiểm tra compile-time gần giống visitor, nhưng dispatch nằm gọn tại chỗ dùng, ít lớp phụ.

~~~java
// Trước: if-else dễ sót nhánh
String render(Shape s) {
    if (s instanceof Circle c) return "O r=" + c.r();
    else if (s instanceof Rect r) return "[] " + r.w() + "x" + r.h();
    return "?"; // thêm Triangle sau này vẫn trả "?" im lặng -> bug
}

// Sau (Java 21): sealed + switch exhaustive
sealed interface Shape permits Circle, Rect, Triangle {}
record Circle(double r) implements Shape {}
record Rect(double w, double h) implements Shape {}
record Triangle(double a, double b, double c) implements Shape {}

String render(Shape s) {
    return switch (s) {
        case Circle c -> "O r=" + c.r();
        case Rect r   -> "[] " + r.w() + "x" + r.h();
        case Triangle t -> "/\\";
    }; // thiếu Triangle -> LỖI COMPILE (compiler dẫn đi sửa)
}
~~~

### Exhaustiveness đảm bảo điều gì (và không đảm bảo điều gì)
- **Đảm bảo lúc biên dịch:** với {{switch}} expression trên sealed type, nếu hierarchy "đóng" hoàn toàn (không có nhánh {{non-sealed}} mở), compiler chứng minh mọi permits đã được xử lý. Thêm subtype mới → mọi switch thiếu nhánh lỗi compile.
- **Không tự xử lý {{null}}:** selector {{null}} gây {{NullPointerException}} trừ khi bạn có {{case null}} (Java 21) hoặc chặn trước. Đây là khác biệt hay gây crash khi migrate.
- **Không phủ điều kiện guard:** {{case Rect r when r.w() == 0 -> ...}} chỉ phủ một phần {{Rect}}; bạn vẫn cần nhánh {{case Rect r -> ...}} cho phần còn lại, nếu không sẽ không exhaustive.

### Pitfall khi migrate (thực tế hay gặp)
- **Giữ {{default}} thói quen:** thêm {{default -> throw ...}} để "cho yên tâm" trên sealed type kín → bạn vừa tự tắt lợi ích lớn nhất: compiler không còn báo khi thêm subtype mới. Chỉ dùng {{default}} khi hierarchy có {{non-sealed}} hoặc bạn cố ý chấp nhận loại chưa biết.
- **Thứ tự case sai (dominated pattern):** đặt {{case Shape s -> ...}} trước các nhánh con → nhánh con không bao giờ chạy, compiler báo lỗi. Quy tắc: cụ thể trước, tổng quát sau.
- **Nhầm trạng thái preview/final:** pattern matching cho switch hoàn thiện qua nhiều bản preview (Java 17-20) và **chính thức từ Java 21**. Code mẫu preview cũ có thể khác cú pháp/chi tiết; luôn kiểm tra đúng JDK dự án.
- **Migrate visitor nửa vời:** trộn visitor và switch rải rác làm logic phân tán. Chọn một hướng cho mỗi hierarchy.
- **Domain mở:** nếu plugin/đối tác được thêm subtype lúc runtime, sealed ép sửa code trung tâm → không phù hợp; dùng interface thường.

### Bảng quyết định nhanh
| Đặc điểm hierarchy | Gợi ý |
|---|---|
| Tập biến thể cố định, thuộc sở hữu team (trạng thái, event, kết quả) | {{sealed}} + {{record}} + switch exhaustive |
| Cần điểm mở rộng cho bên thứ ba | interface thường (cân nhắc {{non-sealed}} có kiểm soát) |
| Đang dùng visitor ổn định, team quen | không cần migrate vội; migrate khi thêm type mới gây đau |

> Senior tip: khi migrate, hãy bắt đầu từ hierarchy "nhỏ, đóng, nhiều {{instanceof}}" (ví dụ kết quả {{Success/Failure}}). Bước 1: biến thành {{sealed interface}} + {{record}}. Bước 2: thay {{if-else}} bằng switch expression **không {{default}}**. Bước 3: thêm {{case null}} nếu đầu vào có thể null. Lợi ích thực sự đến ở lần sau ai đó thêm subtype: compiler chỉ thẳng các điểm phải sửa - đó là thứ {{if-else}} không bao giờ làm được.`,
  follow: [
    'Vì sao visitor pattern kiểm tra tính đầy đủ chủ yếu dựa vào kỷ luật/compile ở interface, còn sealed+switch kiểm tra trực tiếp tại điểm dùng?',
    'Khi nào KHÔNG nên dùng {{sealed}} cho một hierarchy?',
    'Record pattern lồng nhau (deconstruction pattern, Java 21) hỗ trợ gì khi khử cấu trúc dữ liệu?'
  ],
  tags: ['sealed', 'pattern matching', 'switch', 'visitor', 'Java 21']
},
{
  id: 'modern-046',
  topic: 'modern',
  level: 'lead',
  q: 'Tu Java 8 len 21: lo trinh migrate va tinh nang dang gia nhat.',
  a: `**Tóm tắt:** Lộ trình an toàn nhất là đi theo các bản **LTS** (Long-Term Support - bản hỗ trợ dài hạn: 8→11→17→21), mỗi bước có baseline đo lường, quét tương thích tự động, chạy song song CI, và rollout có canary/rollback. Giá trị lớn nhất khi lên 21 không chỉ là cú pháp ({{record/sealed/pattern matching}}) mà còn ở runtime (GC hiện đại, **virtual thread** cho I/O) và bảo mật nền tảng (strong encapsulation).

### Vì sao đi từng LTS thay vì nhảy 8→21
- Mỗi cột mốc gỡ/bẻ một nhóm thứ: module/encapsulation, API bị loại bỏ, hành vi GC, yêu cầu thư viện (Spring Boot 3 đòi Java 17). Nhảy thẳng khiến lỗi trộn lẫn, khó khoanh vùng.
- Đi từng bước cho phép: (1) cô lập nguyên nhân, (2) nâng dependency tương thích ở đúng mốc, (3) giữ cửa rollback rõ.
- Ví dụ đời thường: nâng cấp một tòa nhà cũ - làm móng, rồi điện nước, rồi nội thất; làm tất cả cùng lúc thì không biết hỏng ở đâu.

### Những mốc thay đổi đáng giá (nhìn thực dụng)
| Bản | Đáng chú ý cho dự án thật | Ghi chú migrate |
|---|---|---|
| 9 | module system (JPMS), API collection {{List.of/Map.of}} | JPMS có thể bỏ qua lúc đầu, nhưng encapsulation mạnh dần |
| 10 | {{var}} cục bộ | thuần cú pháp, rủi ro thấp |
| 11 (LTS) | HTTP Client chuẩn, {{String}} API mới, TLS/cert cập nhật, chạy tốt hơn | nhiều thư viện bỏ hỗ trợ 8; kiểm tra {{javax.*}} → {{jakarta.*}} chưa bắt buộc ở đây |
| 14-16 | {{switch}} expression, text block, {{record}}, {{instanceof}} pattern | giảm boilerplate rõ rệt; build/test dễ hơn |
| 17 (LTS) | {{sealed}}, **strong encapsulation** mặc định (khó truy cập nội bộ JDK), randomization mặc định một số chỗ | Spring Boot 3.x yêu cầu Java 17; đây là "cửa ải" lớn |
| 21 (LTS) | **virtual thread** (JEP 444), pattern matching for {{switch}}, record pattern, sequenced collections | lợi ích lớn cho dịch vụ I/O-bound; vẫn cần đo |

### Lộ trình migrate từng bước (có thể áp dụng cho 1 service, nhân rộng ra nhiều service)
1. **Đo baseline trước khi đổi:** test xanh, p50/p95/p99 latency, throughput, GC pause, heap, thời gian khởi động. Không có baseline thì không chứng minh được "không thoái hóa".
2. **8→11:** nâng toolchain; chạy {{jdeps}} / {{jdeprscan}}; thay API bị gỡ ({{JAXB}}, {{javax.xml.bind}} nếu dùng phải thêm dependency); kiểm tra TLS/cipher; nâng driver DB/broker nếu cần. Giữ CI chạy song song 8 và 11 một thời gian ngắn.
3. **11→17 (cửa ải khó nhất thường gặp):** xử lý reflection/truy cập nội bộ ({{--add-opens}} chỉ là giải pháp tạm, phải có ticket dọn); nâng framework (Spring Boot 2.7 → 3.x kéo theo {{javax.*}} → {{jakarta.*}} namespace); kiểm tra agent/bytecode (Mockito, APM, Lombok) tương thích. Với Spring Boot 3.x + Hibernate 6 (ORM mặc định) hãy chạy kỹ migration test.
4. **17→21:** tận dụng {{record/sealed/pattern}} để giảm code lỗi; thử **virtual thread** cho workload I/O-bound (xem {{modern-039}}: giới hạn bằng semaphore, cẩn thận {{ThreadLocal}}/pinning) và **đo** trước khi bật rộng.
5. **CI song song và rollout:** matrix JDK (17,21) trong giai đoạn chuyển tiếp; staging smoke; deploy canary/blue-green; theo dõi metric 24-48h; rollback bằng image cũ.

~~~text
8 (LTS) --nâng deps/toolchain--> 11 (LTS) --encapsulation + jakarta--> 17 (LTS) --tận dụng VT/pattern--> 21 (LTS)
   | đo baseline tại mỗi mốc |  quét jdeps/jdeprscan  |  canary + rollback  |
~~~

### Pitfall thực tế trên production
- **Nhảy cóc 8→21:** lỗi do module encapsulation, {{jakarta.*}}, GC, và thư viện đổ dồn một lúc.
- **Reflection/agent vỡ im lặng:** code chạy nhưng hành vi khác (serialization, proxy). Phải có test tích hợp và kiểm tra log khởi động.
- **Virtual thread cho CPU-bound:** không nhanh hơn, đôi khi tệ hơn; VT chỉ giải quyết bài toán "nhiều việc đang chờ I/O".
- **Bỏ qua chi phí warmup/JIT:** so sánh hiệu năng "lạnh" sau deploy với "nóng" trước đó → kết luận sai.
- **Giữ {{--add-opens/--illegal-access}} mãi:** nợ kỹ thuật, có thể vỡ ở bản JDK sau.

> Senior tip: coi nâng LTS là dự án có owner, playbook và số liệu - không phải "bump version". Với hệ thống nhiều service, dùng wave (pilot → non-critical → core) như {{modern-038}}. Thứ tự ưu tiên giá trị: (1) an toàn/bảo trì (LTS, CVE, thư viện được hỗ trợ), (2) độ tin cậy runtime (GC, observability), (3) năng suất dev (record/sealed/pattern), (4) throughput I/O (virtual thread) - nhưng (4) chỉ "ăn tiền" khi bạn đo được và giới hạn đúng hạ nguồn.`,
  follow: [
    'Vì sao bước 11→17 thường khó hơn 8→11 trong hệ Spring?',
    'Virtual thread giải quyết và không giải quyết bài toán nào?',
    'Strong encapsulation từ Java 16/17 ảnh hưởng thế nào đến thư viện dùng reflection hoặc truy cập nội bộ JDK?'
  ],
  tags: ['Java 21', 'migration', 'LTS', 'virtual threads', 'lead']
}
);
