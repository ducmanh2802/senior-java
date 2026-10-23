/* Topic Kotlin cho dev Java. */
(window.QUESTIONS = window.QUESTIONS || []).push(
{
  id: 'kotlin-001', topic: 'kotlin', level: 'senior',
  q: 'Bạn đang gọi Java API từ Kotlin và nhận được platform type. Kotlin null safety có bảo vệ bạn hoàn toàn không, và bạn xử lý @Nullable/@NotNull ở ranh giới thế nào?',
  a: `**Tóm tắt:** Kotlin phân biệt {{String}} và {{String?}} ở compile time, nhưng Java type thiếu nullability annotation trở thành **platform type** ({{String!}}) nên compiler cho phép cả cách dùng nullable lẫn non-null. Hãy làm rõ contract tại biên Java bằng annotation có hỗ trợ, kiểm tra đầu vào và chuyển đổi sang kiểu Kotlin rõ ràng.

### Platform type đến từ đâu
Kotlin không thể suy ra một Java method có thể trả null hay không nếu bytecode không mang metadata. Với {{String!}}, compiler cho phép gán vào {{String}}; nếu Java trả null, lỗi xuất hiện khi dereference dưới dạng NPE lúc runtime. Đây là lỗ hổng chủ ý về tương thích, không phải một kiểu Kotlin mà ta nên truyền sâu trong ứng dụng.

~~~text
// Java không annotation: Kotlin nhìn thấy String!
val name: String = legacyUser.name  // có thể nổ nếu Java trả null

// Chuẩn hoá ở adapter
val name: String? = legacyUser.name
val display = name ?: "Anonymous"
~~~

### Annotation và ranh giới
- Dùng annotation nullability nhất quán trong Java API; Kotlin đọc được nhiều annotation phổ biến từ JSpecify, JetBrains, Android và các bộ annotation khác. Xác nhận compiler và thư viện đang dùng có hỗ trợ đúng bộ annotation đó.
- Một số annotation áp dụng package/default scope; kiểm tra nullability thực tế của method kế thừa và generic type, vì annotation thiếu hoặc không tương thích vẫn có thể thành platform type.
- Với dữ liệu ngoài (DB, JSON, Java legacy), validate một lần ở adapter/service boundary rồi chuyển thành domain type không nullable nếu dữ liệu bắt buộc.
- Dấu {{!!}} chỉ hợp lý khi invariant đã được chứng minh và lỗi phải fail fast; dùng tùy tiện biến NPE thành lỗi khó truy nguyên.

### Pitfall production
- Kotlin property có thể gọi Java getter; nhìn cú pháp như field không có nghĩa là an toàn null.
- Generic Java như {{List<String>}} có thể chứa null nếu không có type-use annotation đáng tin. Đừng giả định mọi phần tử đều hợp lệ.
- Với Spring/Jackson/Hibernate, constructor, reflection và proxy có thể bypass đường khởi tạo Kotlin mong đợi; kiểm tra cấu hình và dữ liệu thực tế.
- Test cả trường hợp Java trả null, gồm phần tử null trong collection, ở integration boundary.

> Senior tip: đặt rule review rằng platform type không được đi qua nhiều tầng; chuyển nó thành {{T?}} ở adapter, log context có định danh request nhưng không log dữ liệu nhạy cảm, rồi xử lý null một cách tường minh.`,
  follow: ['Kotlin phân tích nullability của generic Java thế nào nếu annotation chỉ đặt trên collection?', 'Bạn sẽ thiết kế DTO Kotlin nhận payload thiếu field ra sao?', 'Vì sao {{!!}} thường làm giảm chất lượng error handling?'],
  tags: ['null safety', 'platform types', 'Java interop', 'annotations']
},
{
  id: 'kotlin-002', topic: 'kotlin', level: 'mid',
  q: 'Khi chuyển DTO Java sang Kotlin, bạn chọn data class hay Java record? So sánh semantics, interop và các trường hợp không nên dùng data class.',
  a: `**Tóm tắt:** {{data class}} là lựa chọn tiện cho value object Kotlin: compiler sinh {{equals}}, {{hashCode}}, {{toString}}, {{copy}} và component destructuring dựa trên primary constructor. {{record}} là value carrier của Java với contract và API Java-native; chọn theo ngôn ngữ ở boundary, đừng coi hai loại là thay thế hoàn toàn.

### Semantics cần phân biệt
Data class yêu cầu ít nhất một tham số trong primary constructor; chỉ các property ở constructor tham gia hàm sinh tự động. Property khai báo trong thân class không tham gia equality/copy. Record components đều là state công khai theo thiết kế, accessor tên component (không có JavaBean getter mặc định), và record là final, nông bất biến.

~~~text
// Kotlin: id và name định nghĩa equality/copy
 data class UserDto(val id: Long, val name: String) {
    var cache: String? = null // không thuộc equals/copy
}

// Java: record là lựa chọn tự nhiên cho API Java
record UserDto(long id, String name) {}
~~~

### Chọn theo boundary
- Kotlin-first codebase: data class cho request/response DTO nhỏ, cấu hình immutable và kết quả truy vấn.
- Public API dùng từ Java nhiều: record có semantics rõ trong Java, nhưng kiểm tra serializer, framework và yêu cầu Java baseline.
- Cần mutable entity, identity theo database, lazy association hoặc lifecycle callback: không dùng data class như entity mặc định. Sinh equality trên mutable fields/association có thể phá Set/Map và kích hoạt truy vấn ngoài ý muốn.
- Kotlin data class {{copy}} là **shallow copy**; object mutable bên trong vẫn dùng chung reference.

### Interop và pitfall
Java nhìn data class như class thường: có getter, constructor, {{copy}} với tham số đầy đủ (default argument không tự tạo overload Java nếu không dùng {{@JvmOverloads}}). Record có accessor như {{id()}}, không phải {{getId()}}; framework cũ trông chờ JavaBean conventions có thể không tương thích.

Không đưa password/token vào {{toString()}} của DTO nhạy cảm; log data class vô tình làm lộ giá trị. Chọn constructor defaults có cân nhắc vì deserializer có thể phân biệt missing và null khác nhau.

> Senior tip: dùng immutable DTO ở biên và mapper tường minh sang domain; tránh để code sinh {{equals}} quyết định identity của JPA entity có quan hệ mutable.`,
  follow: ['Property khai báo ngoài primary constructor có ảnh hưởng {{copy()}} không?', 'Data class có phù hợp làm JPA entity không? Vì sao?', 'Java caller sử dụng default parameter của Kotlin thế nào?'],
  tags: ['data class', 'record', 'DTO', 'interop']
},
{
  id: 'kotlin-003', topic: 'kotlin', level: 'mid',
  q: 'Extension function trong Kotlin giải quyết vấn đề gì? Bạn sẽ dùng chúng trong codebase Java/Spring ra sao để tránh tạo API gây hiểu nhầm?',
  a: `**Tóm tắt:** Extension function cho phép gọi hàm bằng cú pháp {{receiver.function()}}, giúp bổ sung thao tác tiện dụng mà không sửa hay kế thừa class gốc. Đây là cú pháp được resolve tĩnh theo kiểu khai báo của receiver, không phải method mới gắn vào object và không cung cấp quyền truy cập private.

### Cơ chế và dispatch
Compiler biên dịch extension thành hàm static nhận receiver làm tham số đầu. Vì vậy overload được chọn theo kiểu compile-time, kể cả khi object runtime thuộc subtype khác; extension không override virtual method.

~~~text
fun String.maskEmail(): String =
    substringBefore('@').take(1) + "***@" + substringAfter('@')

val value: CharSequence = "sam@example.com"
// Chỉ gọi được nếu extension khai báo trên CharSequence
~~~

Extension có thể overload và import như hàm. Nếu member thật và extension cùng tên/signature, member luôn được ưu tiên. Cú pháp dễ khiến người đọc tưởng rằng thư viện gốc có API đó, nên package và tên phải thể hiện nguồn gốc.

### Dùng trong service thực tế
- Hợp cho chuyển đổi thuần, ngắn, có ngữ nghĩa ổn định: {{Instant.toUtcDateTime()}}, mapping nhỏ hoặc predicate domain.
- Đặt trong package gần module sở hữu; dùng tên rõ, tránh hàng chục extension tổng quát như {{toDto()}} không nói rõ loại đích.
- Không dùng để che side effect, truy cập repository, đọc SecurityContext hay thay dependency injection. Extension không nhận được dependency qua constructor một cách minh bạch.
- Với API cần polymorphism, contract plugin hoặc hành vi phụ thuộc runtime, dùng interface/member/decorator.

### Java interop và pitfalls
Java không gọi extension bằng cú pháp receiver; thường gọi hàm static trong file facade Kotlin (tên facade mặc định từ tên file, có thể đổi bằng {{@file:JvmName}}). Java overload generic/nullable có thể khó đọc hơn Kotlin.

Extension trên nullable receiver có thể hợp lệ, nhưng hãy xử lý null rõ ràng. Tránh extension có tên giống method Java phổ biến, vì import có thể khiến code review hiểu sai. Unit test nên gọi qua package thật để phát hiện xung đột import.

> Senior tip: giới hạn extension theo module và dùng chúng cho thao tác pure; nếu hàm cần mock dependency hoặc policy có thể thay đổi, một service/interface tường minh dễ maintain hơn.`,
  follow: ['Extension function có thể override member của subtype không?', 'Java gọi extension function Kotlin thế nào?', 'Khi nào một extension nên chuyển thành injected service?'],
  tags: ['extension functions', 'Java interop', 'API design']
},
{
  id: 'kotlin-004', topic: 'kotlin', level: 'lead',
  q: 'Một service Spring Boot có nhiều tác vụ blocking và cần xử lý đồng thời. Bạn so sánh Kotlin coroutines, Java virtual threads và CompletableFuture, rồi chọn hướng nào?',
  a: `**Tóm tắt:** Ba lựa chọn có mô hình khác nhau: {{CompletableFuture}} biểu diễn kết quả async bằng callback/composition; coroutines cho phép viết suspend theo kiểu tuần tự nhưng cần runtime/dispatcher phù hợp; virtual threads giữ blocking code dễ đọc với thread nhẹ của Java 21. Chọn theo stack thực tế, khả năng tích hợp và giới hạn tài nguyên, không chỉ theo benchmark đơn lẻ.

### Cơ chế
{{CompletableFuture}} biểu diễn kết quả hoàn tất; các method hậu tố {{Async}} thường submit tác vụ lên executor (nếu không truyền executor thì thường dùng common pool), còn continuation không có hậu tố {{Async}} có thể chạy ngay trên thread hoàn tất future. Nó hợp với fan-out/fan-in và pipeline Java, nhưng chuỗi {{thenCompose}} dài dễ phân tán xử lý lỗi, context và cancellation. Phải chọn executor tường minh cho blocking IO, đồng thời đặt timeout và giới hạn concurrency; không giả định mọi continuation đều chạy nền.

Coroutine suspend tại suspension point thì nhường thread cho dispatcher; continuation được tiếp tục sau đó. Nó giảm số thread bị giữ khi chờ IO, nhưng chỉ thư viện suspend/non-blocking hoặc bridge đúng cách mới tận dụng được. Gọi JDBC blocking trên dispatcher không biến JDBC thành non-blocking.

Virtual thread gắn một Java Thread nhẹ với carrier khi chạy; khi blocking operation tương thích, JVM có thể unmount virtual thread và giải phóng carrier. Code vẫn đồng bộ, nhưng DB connection, HTTP connection, CPU và rate limit vẫn là tài nguyên hữu hạn.

### Ma trận chọn
| Tiêu chí | Coroutines | Virtual threads | CompletableFuture |
|---|---|---|---|
| Ngôn ngữ | Kotlin | Java 21+ | Java 8+ |
| Phong cách | suspend tuần tự | blocking tuần tự | composition async |
| Ecosystem | cần API/bridge coroutine | tương thích blocking tốt dần theo thư viện | phổ biến trong Java API |
| Rủi ro | dispatcher/context sai | tưởng thread rẻ nghĩa là dependency vô hạn | callback, executor, lỗi khó đọc |

### Cách triển khai an toàn
Với Spring, xác nhận phiên bản framework, web stack, driver (JDBC hay R2DBC) và propagation của transaction/security context. Đặt semaphore/bulkhead theo pool downstream; timeout theo ngân sách request; đo queue, connection wait, p95/p99 và tỷ lệ timeout. Không chuyển toàn bộ code sang coroutine chỉ vì Kotlin hỗ trợ.

Pitfall: tăng concurrency có thể làm cạn DB pool trước khi CPU bận; cancellation không tự rollback mọi side effect bên ngoài. Structured concurrency và lifecycle phải giữ child task trong phạm vi request.

> Senior tip: tải thử bằng latency profile thật, ví dụ DB pool 40 kết nối thì không cho 2.000 request đồng thời cùng chờ transaction; concurrency phải khớp giới hạn dependency, dù virtual thread/coroutine có rẻ đến đâu.`,
  follow: ['Virtual thread có làm JDBC query non-blocking không?', 'Khi dùng coroutine trong Spring, bạn xác minh transaction context propagation thế nào?', 'Bạn đặt concurrency limit ở application hay connection pool?'],
  tags: ['coroutines', 'virtual threads', 'CompletableFuture', 'Spring']
},
{
  id: 'kotlin-005', topic: 'kotlin', level: 'senior',
  q: 'Bạn đưa Kotlin vào ứng dụng Spring Boot có JPA. Vai trò của kotlin-spring/all-open và no-arg plugin là gì, và những lỗi runtime nào cần kiểm soát?',
  a: `**Tóm tắt:** Kotlin mặc định class và method là final, còn Spring proxy thường cần subclassing; plugin {{kotlin-spring}} mở các class được đánh dấu Spring stereotype để proxy hoạt động. JPA cần constructor không tham số và entity có thể phải proxy, nên cấu hình {{kotlin-jpa}}/no-arg và open entity theo yêu cầu provider; plugin không thay thế việc hiểu lifecycle.

### Vì sao cần plugin
Spring AOP, transaction và một số proxy tạo subclass bằng CGLIB; class/method final cản việc override. Kotlin Spring plugin là preset của all-open, tự mở loại annotation Spring đã biết, chẳng hạn {{@Component}}, {{@Service}}, {{@Configuration}} và meta-annotation liên quan.

JPA provider cần khởi tạo entity theo chuẩn persistence và có thể tạo proxy cho lazy loading. Plugin no-arg sinh constructor synthetic cho entity annotation. Ở Kotlin plugin trước 2.3.20, {{kotlin-jpa}} cấu hình no-arg nhưng không tự mở entity; cần cấu hình all-open riêng hoặc khai báo entity open theo yêu cầu provider. Từ Kotlin 2.3.20, plugin JPA cũng bật all-open với preset JPA. Xác nhận plugin/version và annotation namespace Jakarta đang dùng (Spring Boot 3 dùng {{jakarta.persistence}}); {{kotlin-spring}} chỉ mở các lớp có annotation Spring, không mặc nhiên mở entity JPA.

~~~text
plugins {
    kotlin("jvm")
    kotlin("plugin.spring")
    kotlin("plugin.jpa")
}
~~~

### Entity Kotlin: cẩn trọng
- Entity thường là class mutable với constructor phù hợp; không biến mọi entity thành data class vì {{equals/hashCode/toString}} có thể chạm lazy association, đệ quy hai chiều hoặc đổi hash sau persist.
- Không đưa collection lazy vào {{toString()}} hoặc equality. Tải entity trong transaction rồi map sang DTO trước khi serialize response.
- No-arg constructor synthetic không có nghĩa mọi field được khởi tạo như constructor domain; kiểm tra nullability và defaults khi hydrate.
- Open class/method đúng chỗ cho proxy; không mở toàn bộ domain một cách mù quáng.

### Kiểm chứng production
Viết integration test dùng transaction thật: gọi method qua Spring bean để kiểm tra proxy/rollback; persist rồi reload entity và truy cập quan hệ theo fetch plan. Bật SQL logging ở test, không production mặc định. Kiểm tra schema validation, constructor mapping, Jackson và lazy loading ngoài transaction.

Lỗi thường thấy là {{@Transactional}} đặt trên final class/method hoặc self-invocation gọi method cùng bean khiến proxy bị bypass; Kotlin plugin không sửa self-invocation.

> Senior tip: pin plugin version theo Kotlin compiler, kiểm tra generated bytecode/test integration sau nâng cấp; một unit test gọi trực tiếp class không chứng minh Spring proxy đang hoạt động.`,
  follow: ['Vì sao self-invocation làm {{@Transactional}} không áp dụng?', 'Data class entity có thể gây lỗi gì với Hibernate proxy?', 'Bạn phân biệt lỗi cấu hình plugin với lỗi fetch lazy thế nào?'],
  tags: ['Spring Boot', 'JPA', 'all-open', 'no-arg', 'Hibernate']
},
{
  id: 'kotlin-006', topic: 'kotlin', level: 'senior',
  q: 'Bạn thiết kế mô hình kết quả cho API có success, validation error và system error bằng sealed class thế nào? {{when}} giúp gì và có giới hạn nào?',
  a: `**Tóm tắt:** Sealed hierarchy giới hạn tập subtype có thể biết trong module/package theo quy tắc của Kotlin, giúp {{when}} exhaustive và làm rõ các trạng thái hợp lệ. Dùng nó để mô hình hóa kết quả có số nhánh hữu hạn; vẫn cần quyết định mapping HTTP, serialization và tương thích khi thêm nhánh.

### Tư duy tập trạng thái
Thay vì một object có {{success}}, {{errorCode}}, {{payload}} nullable đồng thời, sealed type biểu diễn mỗi trạng thái riêng. Compiler kiểm tra nhánh còn thiếu khi {{when}} xử lý sealed hierarchy mà không có nhánh mặc định.

~~~text
sealed interface ApiResult<out T> {
    data class Success<T>(val value: T) : ApiResult<T>
    data class Invalid(val fields: List<String>) : ApiResult<Nothing>
    data class Failed(val code: String) : ApiResult<Nothing>
}

fun message(r: ApiResult<*>): String = when (r) {
    is ApiResult.Success -> "OK"
    is ApiResult.Invalid -> "Invalid input"
    is ApiResult.Failed -> "Try later"
}
~~~

### Vì sao hữu ích
- Mỗi nhánh mang đúng dữ liệu cần thiết; giảm trạng thái mâu thuẫn như {{success=true}} nhưng thiếu payload.
- Thêm subtype làm compiler chỉ ra các {{when}} cần cập nhật, có ích khi refactor trong cùng codebase.
- Generic covariance cho phép nhánh lỗi dùng {{Nothing}} vì nhánh đó không cung cấp {{T}}.

Sealed không phải thay thế exception cho mọi lỗi. Với lỗi hạ tầng không thể phục hồi hoặc cần stack/cause, exception và boundary handler thường thích hợp. Với nghiệp vụ expected (validation, not found), typed result có thể làm luồng rõ ràng hơn.

### Ranh giới và pitfall
Serialization framework cần cấu hình discriminator/subtype; tên subtype không nên vô tình thành public JSON contract. Với API phân tán, client cũ có thể nhận loại mới và không biết xử lý. Thêm nhánh vào sealed type là source-breaking cho exhaustive when consumer cần recompile.

Tránh nhồi mọi trường hợp toàn hệ thống vào một sealed interface khổng lồ. Chia theo bounded context, đặt tên mang nghĩa domain, và map sang HTTP ở adapter thay vì để domain phụ thuộc Spring.

> Senior tip: sealed result đặc biệt hữu ích cho state machine có 3–6 trạng thái rõ; nếu nhánh lỗi liên tục tăng theo mã HTTP/hạ tầng, hãy tách hierarchy và giữ exception boundary tập trung.`,
  follow: ['Khi nào dùng exception thay cho sealed result?', 'Thêm subtype sealed có ảnh hưởng binary/source compatibility thế nào?', 'Làm sao serialize sealed hierarchy thành JSON ổn định?'],
  tags: ['sealed classes', 'when', 'domain modeling', 'API']
},
{
  id: 'kotlin-007', topic: 'kotlin', level: 'senior',
  q: 'Khi chuyển pipeline xử lý dữ liệu từ Java Stream sang Kotlin collections hoặc Sequence, bạn đánh giá eager/lazy, hiệu năng và resource lifetime thế nào?',
  a: `**Tóm tắt:** Kotlin collection operators thường tạo collection trung gian và chạy eager; {{Sequence}} lazy, phù hợp chuỗi biến đổi lớn có thể dừng sớm, nhưng thêm overhead iterator/lambda và không mặc định nhanh hơn. Java Stream cũng lazy đến terminal operation, với pipeline và quy tắc resource riêng; chọn theo kích thước dữ liệu, số bước, short-circuit và khả năng đọc.

### Eager và lazy
Với {{list.filter(...).map(...)}}, Kotlin materialize kết quả filter rồi map. Với {{asSequence()}}, phần tử đi qua pipeline từng bước khi terminal operation tiêu thụ; {{first}} có thể dừng sớm mà không xử lý phần còn lại.

~~~text
val first = items.asSequence()
    .filter { it.enabled }
    .map { it.name.trim() }
    .firstOrNull()
~~~

Nếu pipeline chỉ có một phép biến đổi trên list nhỏ, Sequence có thể chậm hơn do abstraction/dispatch. Nếu nguồn lớn và nhiều bước hoặc terminal short-circuit, giảm allocations trung gian có thể đáng kể. Đo bằng workload đại diện.

### So với Java Stream
Stream được tiêu thụ một lần, có terminal operation, hỗ trợ primitive stream và parallel mode; Kotlin Sequence không có parallel execution tích hợp như parallelStream. Java Stream từ resource (ví dụ {{Files.lines}}) phải đóng bằng try-with-resources; Kotlin {{sequence}} thông thường không tự quản lý resource lifetime. Không giữ lazy pipeline vượt quá thời gian resource còn mở.

### Pitfall và lựa chọn
- Side effect trong lambda làm thứ tự/lần chạy phụ thuộc terminal operation; giữ pipeline pure.
- Nhiều lần iterate Sequence tạo lại công việc nguồn; nếu cần nhiều lần dùng kết quả, materialize thành list.
- Database/JPA: sequence xử lý object đã load, không thay thế paging hay streaming cursor đúng transaction. Đừng load triệu row vào memory rồi đổi API cho lazy.
- Với CPU parallel, dùng executor/parallel strategy có giới hạn rõ; không kỳ vọng Sequence tự song song.

> Senior tip: ưu tiên cách dễ đọc; benchmark bằng JMH hoặc load test có dữ liệu thực, đo allocation và GC chứ không chỉ elapsed time một lần. Tối ưu lớn thường đến từ paging/query plan hơn là đổi {{List}} thành {{Sequence}}.`,
  follow: ['Vì sao Sequence có thể chậm hơn collection với pipeline ngắn?', 'Bạn đóng stream đọc file thế nào khi có xử lý lazy?', 'Sequence có tương đương parallelStream không?'],
  tags: ['collections', 'Sequence', 'Stream', 'performance']
},
{
  id: 'kotlin-008', topic: 'kotlin', level: 'mid',
  q: 'Trong code review, bạn giải thích {{let}}, {{run}}, {{with}}, {{apply}} và {{also}} ra sao để team không biến scope function thành cú pháp khó đọc?',
  a: `**Tóm tắt:** Scope functions khác nhau ở hai trục: receiver là {{this}} hay argument là {{it}}, và kết quả trả về là object receiver hay giá trị lambda. Dùng chúng để gom thao tác ngắn có mục đích; tránh lồng nhiều scope vì tên {{this}}/{{it}} che khuất ngữ cảnh.

### Bảng nhớ nhanh
| Hàm | Trong lambda | Kết quả | Ý định hay gặp |
|---|---|---|---|
| let | it | giá trị lambda | null handling, transform |
| run | this | giá trị lambda | cấu hình rồi tính kết quả |
| with(obj) | this | giá trị lambda | nhiều thao tác trên object |
| apply | this | receiver | khởi tạo/cấu hình |
| also | it | receiver | side effect như log/validate |

~~~text
val request = Request().apply {
    id = incomingId
    source = "web"
}.also { logger.info("request {}", it.id) }

val length = nullableName?.let { it.trim().length }
~~~

### Chọn cú pháp theo ý định
{{apply}} hữu ích khi builder/mutable object cần cấu hình rồi trả lại chính nó. {{also}} phù hợp side effect nhỏ mà không đổi giá trị pipeline. {{let}} thường thể hiện biến đổi hoặc thực thi khi non-null. {{run}}/ {{with}} giúp truy cập nhiều member và trả kết quả tính toán.

Không chọn scope function chỉ để tiết kiệm vài ký tự. Nếu lambda dài, chứa nhiều nhánh hoặc có side effect quan trọng, dùng biến có tên và method riêng để người đọc thấy luồng.

### Pitfall production
- Lồng {{apply}}/{{let}} khiến {{this}} ngầm trỏ nhầm object; dùng receiver label hoặc tốt hơn là tách khối.
- {{also}} có thể khiến pipeline trông functional trong khi đang ghi DB/gửi event. Side effect cần tên method và xử lý lỗi rõ.
- {{let}} trên nullable không tự validate nội dung; null ở bên trong vẫn có thể đến từ platform type.
- Tránh chain scope function dài trong entity JPA, nơi getter có thể trigger lazy load.

> Senior tip: trong review, hỏi “lambda trả về gì và ai là receiver?” Nếu câu trả lời cần đọc lại cả chain, thay bằng biến trung gian có tên; dễ debug hơn vài dòng ngắn.`,
  follow: ['{{apply}} và {{also}} trả về gì khác nhau?', 'Vì sao {{it}}/{{this}} lồng nhau làm review khó?', 'Bạn dùng {{let}} thay cho if-null trong trường hợp nào?'],
  tags: ['scope functions', 'let', 'apply', 'readability']
},
{
  id: 'kotlin-009', topic: 'kotlin', level: 'mid',
  q: 'Khi Kotlin cần khai báo singleton/factory mà Java caller cũng sử dụng, bạn chọn top-level declaration, object hay companion object? {{@JvmStatic}} thay đổi điều gì?',
  a: `**Tóm tắt:** Kotlin top-level function/property được biên dịch thành static member của file facade; {{object}} tạo singleton; {{companion object}} là object gắn với class để đặt factory/constants liên quan class. {{@JvmStatic}} sinh thêm static bridge cho Java ergonomics, không biến companion thành static state theo đúng nghĩa JVM.

### Cách chọn
- Top-level: hàm tiện ích không thuộc một class cụ thể, ví dụ parse/format; giữ package nhỏ và file có tên rõ.
- {{object}}: một instance dùng chung, ví dụ stateless registry hoặc strategy; nhớ rằng mutable state là global state và cần thread safety.
- Companion: factory {{User.from(dto)}}, constants hoặc API tạo instance liên quan {{User}}. Đây là instance companion, không phải constructor.

~~~text
class User private constructor(val id: Long) {
    companion object {
        @JvmStatic
        fun from(id: Long) = User(id)
    }
}
~~~

Kotlin gọi {{User.from(1)}}. Không có {{@JvmStatic}}, Java thường gọi {{User.Companion.from(1)}}. Annotation tạo static bridge để Java gọi {{User.from(1)}}; có thể thêm bridge cho property getter tương ứng.

### Interop và pitfall
Top-level API Java thấy qua facade class (mặc định tên dựa trên file); đổi tên file có thể đổi binary API, trừ khi ổn định bằng {{@file:JvmName}}. Đừng tạo facade chứa nhiều tiện ích không liên quan.

{{const val}} phù hợp giá trị compile-time constant đơn giản; {{val}} trong companion không nhất thiết là JVM static final constant theo cách Java mong đợi. Public constant inline vào client có thể gây vấn đề khi đổi giá trị mà client chưa recompile.

Singleton không nên giữ request/user state; classloader, test isolation và mutable collection toàn cục dễ tạo rò rỉ giữa request hoặc test.

> Senior tip: nếu API dùng rộng từ Java, viết một smoke test Java nhỏ cho cách gọi thực tế và giữ facade/signature ổn định; Kotlin compile thành công không đảm bảo API Java dễ dùng.`,
  follow: ['Java gọi companion function không có {{@JvmStatic}} thế nào?', 'Khi nào top-level function thành API Java bất ổn?', 'Vì sao singleton mutable có thể gây rò rỉ dữ liệu giữa request?'],
  tags: ['companion object', '@JvmStatic', 'Java interop', 'singleton']
},
{
  id: 'kotlin-010', topic: 'kotlin', level: 'lead',
  q: 'Team Java Spring đang cân nhắc chuyển sang Kotlin. Bạn đề xuất quyết định và lộ trình thế nào để lợi ích ngôn ngữ không bị lấn át bởi chi phí vận hành?',
  a: `**Tóm tắt:** Không nên chuyển ngôn ngữ chỉ vì Kotlin ngắn hơn; quyết định dựa trên pain point, kỹ năng team, tương thích framework/thư viện, hiring và chi phí vận hành dài hạn. Với đa số hệ thống ổn định, thử nghiệm module mới hoặc bounded context nhỏ, đo chất lượng và tốc độ delivery rồi mới mở rộng thường ít rủi ro hơn rewrite.

### Đánh giá giá trị và chi phí
Kotlin mang null safety, data/sealed types, extension, coroutine syntax và giảm boilerplate. Nhưng giá trị đến khi team dùng các tính năng nhất quán; mixed Java/Kotlin thêm conventions, plugin/build complexity, debugging bytecode và đường cong học tập. Interop cũng có cạnh sắc: platform types, default parameters, checked exception khác biệt, property/accessor và annotation processing.

Lập bảng theo hệ thống: Spring Boot/Kotlin plugin versions, JPA/proxy, serialization, kapt/KSP, agent/APM, static analysis, test fixtures, build time và hỗ trợ IDE. Xác minh thư viện critical có Kotlin API chính thức hay chỉ Java API.

### Lộ trình có kiểm soát
1. Phỏng vấn team và xác định vấn đề đo được: lỗi null, tốc độ phát triển, onboarding, module boilerplate.
2. Chọn service nhỏ hoặc module mới ít coupling; đặt coding conventions, formatter, lint và hướng dẫn Java interop.
3. Chạy pilot qua CI, test integration, observability và release thật. So sánh lead time, defect, build duration, incident và effort review với baseline.
4. Mở rộng theo domain boundary nếu kết quả tốt; giữ Java/Kotlin interop tường minh. Không ép chuyển service đang ổn chỉ để đạt tỷ lệ Kotlin.

### Khi không nên chuyển
- Team không có thời gian đào tạo/maintain build plugins.
- Hệ thống legacy sắp sunset, lợi ích không hoàn vốn.
- Dependency/tooling quan trọng không tương thích hoặc debug production phụ thuộc agent chưa hỗ trợ.
- Động lực chỉ là giảm số dòng; code ngắn hơn nhưng abstraction khó hiểu làm review chậm.

Đo bằng metric vài release, không dùng số LOC. Có migration guide, owner cho build pipeline, pair programming và kế hoạch quay lại nếu pilot làm giảm độ tin cậy.

> Senior tip: tiêu chí thành công nên là defect escape, lead time và thời gian build/review. Một pilot 1–2 module qua vài release cho dữ liệu đáng tin hơn rewrite kéo dài không có đường lui.`,
  follow: ['Bạn chọn metric nào để đánh giá pilot Kotlin?', 'Làm sao giữ Java/Kotlin interop dễ bảo trì trong giai đoạn chuyển tiếp?', 'Khi nào bạn dừng pilot và quyết định không mở rộng?'],
  tags: ['migration', 'team leadership', 'Java', 'Kotlin']
}
);
