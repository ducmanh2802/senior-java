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

Virtual thread gắn một Java Thread nhẹ với carrier khi chạy; khi blocking operation tương thích, JVM có thể unmount virtual thread và giải phóng carrier. Code vẫn đồng bộ, nhưng DB connection, HTTP connection, CPU và rate limit vẫn là tài nguyên hữu hạn. Ở JDK 21–23, blocking bên trong {{synchronized}} làm virtual thread bị **pin** vào carrier (không unmount được); JDK 24 (JEP 491) đã gỡ hạn chế này.

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

JPA provider cần khởi tạo entity theo chuẩn persistence và có thể tạo proxy cho lazy loading. Plugin {{kotlin-jpa}} là preset của no-arg: nó sinh constructor không tham số (synthetic, chỉ gọi được qua reflection) cho class có {{@Entity}}, {{@Embeddable}}, {{@MappedSuperclass}}. Theo truyền thống nó **không** mở class (việc tự mở entity chỉ có ở các phiên bản Kotlin rất mới, cần đối chiếu release notes của đúng phiên bản bạn dùng). Cách chắc chắn trên mọi phiên bản, cũng là cấu hình Spring Initializr sinh ra, là khai báo all-open tường minh cho các annotation JPA như ví dụ dưới. {{kotlin-spring}} chỉ mở class có annotation Spring, **không** mở entity. Spring Boot 3 dùng namespace {{jakarta.persistence}}, nên annotation trong cấu hình phải là {{jakarta.persistence.Entity}}, không phải {{javax}}.

~~~text
plugins {
    kotlin("jvm")
    kotlin("plugin.spring")   // mở @Component, @Service, @Configuration, @Transactional...
    kotlin("plugin.jpa")      // no-arg constructor cho @Entity/@Embeddable/@MappedSuperclass
}

allOpen {                     // mở entity để Hibernate tạo proxy lazy
    annotation("jakarta.persistence.Entity")
    annotation("jakarta.persistence.MappedSuperclass")
    annotation("jakarta.persistence.Embeddable")
}
~~~

### Entity Kotlin: cẩn trọng
- Entity thường là class mutable với constructor phù hợp; không biến mọi entity thành data class vì {{equals/hashCode/toString}} có thể chạm lazy association, đệ quy hai chiều hoặc đổi hash sau persist.
- Không đưa collection lazy vào {{toString()}} hoặc equality. Tải entity trong transaction rồi map sang DTO trước khi serialize response.
- Constructor synthetic của no-arg mặc định **không chạy** property initializer hay khối {{init}} (trừ khi bật {{invokeInitializers}}); Hibernate sau đó gán field từ ResultSet. Đừng đặt invariant quan trọng trong {{init}}, và nhớ rằng property non-null có thể tạm thời là null cho tới khi Hibernate gán xong.
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
Stream được tiêu thụ một lần, có terminal operation, hỗ trợ primitive stream và parallel mode; Kotlin Sequence không có parallel execution tích hợp như parallelStream. Java Stream từ resource (ví dụ {{Files.lines}}) phải đóng bằng try-with-resources; Kotlin {{Sequence}} không tự quản lý resource lifetime; với file hãy dùng {{File.useLines}}: hàm này nhận một lambda xử lý Sequence các dòng và đóng file khi lambda kết thúc. Không trả lazy pipeline ra ngoài phạm vi resource còn mở, vì khi được tiêu thụ thì file đã đóng.

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
},
{
  id: 'kotlin-011', topic: 'kotlin', level: 'mid',
  q: 'Khi nhận JSON vào DTO Kotlin, null-safety của compiler có bảo vệ bạn không? Bạn cấu hình Jackson và validation thế nào để không biến lỗi dữ liệu thành NPE trong service?',
  a: `**Tóm tắt:** Kotlin null-safety chỉ là ràng buộc compile-time; JSON đi qua Jackson bằng reflection nên null vẫn có thể lọt vào nếu thiếu cấu hình hoặc DTO khai báo sai. Hãy dùng jackson-module-kotlin, phân biệt rõ "thiếu field" với "null", validate ở biên và map sang domain type không nullable.

### Vì sao null-safety không tự động qua JSON
JVM không mang đầy đủ thông tin non-null trong bytecode mà Jackson có thể dùng mặc định. Với data class không có constructor rỗng, Jackson thiếu cách khởi tạo và thường báo {{InvalidDefinitionException}} nếu không có Kotlin module. Khi có module, Jackson dùng Kotlin reflection để gọi primary constructor và kiểm tra nullability của từng tham số.

Điều này khác với framework dùng reflection/field access: Hibernate, một số mapper hoặc code dùng {{Unsafe}} có thể gán null vào field Kotlin non-null. Vì vậy đừng coi null-safety là lớp bảo vệ runtime ở mọi biên.

~~~kotlin
data class CreateUserRequest(
    val email: String,              // bắt buộc: thiếu hoặc null đều lỗi
    val age: Int?,                  // cho phép thiếu -> null
    val newsletter: Boolean = false // thiếu -> dùng default
)
~~~

### Hành vi cần kiểm chứng
- Thiếu {{email}} hoặc gửi {{"email": null}} đều khiến jackson-module-kotlin ném {{MissingKotlinParameterException}} (lớp con của {{MismatchedInputException}}). Spring MVC bọc nó thành {{HttpMessageNotReadableException}} và mặc định trả 400; việc của bạn là trả thông báo lỗi có tên field rõ ràng (qua {{@RestControllerAdvice}}), không để lộ stack trace.
- {{age}} vắng mặt và {{age: null}} đều thành {{null}}: Kotlin không phân biệt được nếu chỉ dùng {{Int?}}. Với PATCH, cần wrapper như {{JsonNullable}}, {{Optional}} hoặc một kiểu {{FieldUpdate}} có trạng thái missing.
- {{newsletter}} vắng mặt nhận default; gửi null tường minh vẫn là lỗi vì kiểu không nullable.
- Spring Boot tự đăng ký {{jackson-module-kotlin}} khi có trên classpath, nhưng nếu tự tạo {{ObjectMapper}} thì phải đăng ký thủ công.

### Validation và DTO
Bean Validation trên property Kotlin cần đúng annotation target. Mặc định annotation có thể rơi vào constructor parameter, trong khi validator đọc field/getter:

~~~kotlin
data class CreateUserRequest(
    @field:NotBlank val email: String,
    @field:Min(0) val age: Int?
)
~~~

- {{@JsonProperty(required = true)}} không thay thế validation nghiệp vụ.
- Không dùng {{Double}} cho tiền; dùng {{Long}} đơn vị nhỏ nhất hoặc {{BigDecimal}} và cấu hình serializer rõ ràng.
- Cân nhắc {{FAIL_ON_UNKNOWN_PROPERTIES}}: bật để bắt typo, tắt để tương thích tiến hóa; chọn theo hợp đồng API và ghi vào tài liệu.
- Response nên dùng DTO tường minh, không serialize entity JPA vì lazy loading và vòng tham chiếu.

### Pitfall production
- DTO nullable lan xuống service rồi mọi nơi phải {{?.}}; hãy validate một lần ở controller và trả domain type chắc chắn.
- Dùng {{!!}} sau khi bind để "cho gọn" sẽ biến lỗi dữ liệu thành 500 mất context.
- Log payload có PII; chỉ log request id, mã lỗi và tên field lỗi.
- Test các tổ hợp: thiếu field, null, sai kiểu, default, unknown field; dùng JSON fixture thay vì tự dựng object.

> Senior tip: hãy coi JSON payload là untrusted input như form HTML. Một bộ contract test với fixture thật, bật fail-fast và thống nhất mã lỗi 400 giúp tránh phần lớn sự cố "NPE trong service" mà nguyên nhân thật nằm ở deserialization.`,
  follow: ['Sự khác nhau giữa field thiếu và field null ảnh hưởng API PATCH thế nào?', 'Vì sao {{@field:NotBlank}} cần thiết thay vì {{@NotBlank}}?', 'Bạn cấu hình Jackson fail-fast cho môi trường production ra sao?'],
  tags: ['null safety', 'Jackson', 'DTO', 'validation']
},
{
  id: 'kotlin-012', topic: 'kotlin', level: 'senior',
  q: 'Bạn dùng {{suspend fun}} trong controller Spring. Điều gì xảy ra với transaction, SecurityContext và MDC khi coroutine resume trên thread khác, và bạn xử lý thế nào?',
  a: `**Tóm tắt:** Spring MVC và WebFlux đều gọi được {{suspend fun}} trong controller, nhưng cơ chế khác nhau: MVC chạy trên servlet async, WebFlux chạy trên event loop với chuỗi non-blocking. Điểm nguy hiểm là state gắn với thread như {{@Transactional}} JDBC, {{SecurityContext}}, MDC và request attributes không tự theo coroutine khi nó resume ở thread khác.

### Spring chạy suspend function thế nào
Spring MVC từ Spring Framework 5.3 hỗ trợ method controller là suspend (WebFlux hỗ trợ từ 5.2): framework gọi qua cầu coroutine, trả về async result và giải phóng request thread tại điểm suspend. Nhưng nó không biến JDBC thành non-blocking; số request đồng thời vẫn bị giới hạn bởi Tomcat thread pool, DB connection pool và các tài nguyên khác.

WebFlux hỗ trợ {{suspend fun}} và {{Flow}}; {{kotlinx-coroutines-reactor}} chuyển đổi qua lại với {{Mono}}/{{Flux}}. Trên event loop, một lời gọi JDBC blocking có thể chặn toàn bộ luồng xử lý của nhiều request, nên phải chuyển sang {{Dispatchers.IO}} hoặc dùng driver reactive.

~~~kotlin
@RestController
class OrderController(private val service: OrderService) {
    @GetMapping("/orders/{id}")
    suspend fun get(@PathVariable id: Long): OrderDto =
        withContext(Dispatchers.IO) {   // chỉ bọc phần blocking
            service.load(id)
        }
}
~~~

### Transaction: chỗ dễ sai nhất
{{@Transactional}} của Spring với JDBC/JPA dựa trên transaction gắn với thread hiện tại ({{ThreadLocal}}). Khi coroutine suspend rồi resume trên thread khác, connection/transaction đang mở không tự đi theo. Spring chỉ hỗ trợ {{@Transactional}} trên {{suspend fun}} khi dùng **ReactiveTransactionManager** (ví dụ R2DBC), vì transaction được giữ trong Reactor Context chứ không trong ThreadLocal. Với JDBC/JPA, đừng suy ra là đúng chỉ vì code biên dịch được.

Cách an toàn:
- Viết integration test có rollback thật, cho method suspend đi qua proxy Spring, kiểm tra dữ liệu sau khi lỗi.
- Với JDBC, gói toàn bộ thao tác DB trong một suspend function chạy trên cùng dispatcher và dùng {{TransactionTemplate}} nếu cần kiểm soát biên.
- Không gọi {{runBlocking}} trong controller hay filter; nó giữ thread và dễ gây starvation.
- Với WebFlux + R2DBC, dùng {{TransactionalOperator}} và kiểm tra lifecycle của transaction qua suspension.

### Context propagation
- MDC: thêm {{MDCContext}} từ {{kotlinx-coroutines-slf4j}}, hoặc truyền request id tường minh trong context.
- Security: {{SecurityContextHolder}} mặc định là thread-local; sau khi resume ở thread khác có thể mất authentication. Dùng cơ chế context propagation của Spring 6/Micrometer hoặc capture/restore tường minh, và test endpoint yêu cầu quyền.
- Tenant, locale, request attributes cũng cùng vấn đề; đừng giả định chúng "tự nhiên" còn đó.

### Cancellation và lỗi
- WebFlux có thể cancel khi client ngắt kết nối; đừng nuốt {{CancellationException}}.
- {{withTimeout}} hủy coroutine nhưng không rollback side effect bên ngoài; cần idempotency hoặc compensation.
- Không dùng {{runCatching}} quanh suspend call mà không rethrow {{CancellationException}}.

### Chọn MVC hay WebFlux
- MVC + coroutine chủ yếu để code tuần tự dễ đọc, không phải để tăng throughput.
- WebFlux chỉ có lợi khi cả chuỗi non-blocking: WebClient, R2DBC, Kafka reactive; một JDBC call blocking có thể phá mô hình.
- Đo p95/p99, queue time và connection wait trước khi kết luận.

> Senior tip: sau khi thêm suspend, hãy chạy lại test bảo mật và test rollback; hai lỗi này thường không lộ ra ở unit test mà chỉ xuất hiện khi coroutine resume trên thread khác trong môi trường thật.`,
  follow: ['Vì sao {{@Transactional}} JDBC có thể mất transaction sau khi coroutine resume?', 'Bạn propagate SecurityContext và MDC qua dispatcher bằng cách nào?', 'Khi nào MVC + coroutine không giúp tăng throughput?'],
  tags: ['coroutines', 'Spring MVC', 'WebFlux', 'transaction', 'MDC']
},
{
  id: 'kotlin-013', topic: 'kotlin', level: 'lead',
  q: 'Bạn thiết kế tầng gọi song song nhiều dependency bằng coroutine. Structured concurrency, cancellation và {{Dispatchers.IO}} cần được giới hạn thế nào để không sập DB pool?',
  a: `**Tóm tắt:** Structured concurrency buộc mọi coroutine con nằm trong một scope có lifecycle rõ: cha chờ con, con lỗi thì cả nhóm bị hủy (trừ {{supervisorScope}}). {{Dispatchers.IO}} không phải pool vô hạn — mặc định khoảng 64 thread — nên phải giới hạn concurrency theo DB pool, HTTP client và rate limit của downstream.

### Cây scope và lan truyền lỗi
{{coroutineScope}} tạo scope con: nếu một nhánh ném lỗi, các nhánh anh em bị cancel và lỗi được ném ra ngoài. {{supervisorScope}} cô lập lỗi từng nhánh, phù hợp khi một widget lỗi không được làm hỏng cả dashboard.

~~~kotlin
suspend fun dashboard(userId: Long): Dashboard = coroutineScope {
    val profile = async { profileClient.fetch(userId) }
    val orders = async { orderClient.recent(userId) }
    Dashboard(profile.await(), orders.await()) // lỗi một nhánh -> hủy nhánh còn lại
}
~~~

Bên trong {{coroutineScope}}, coroutine con lỗi (dù tạo bằng {{launch}} hay {{async}}) sẽ **lập tức** hủy scope cha và các nhánh anh em; {{coroutineScope}} chờ mọi con kết thúc rồi ném lỗi ra ngoài. Khác biệt giữa hai builder chỉ rõ ở coroutine **gốc** hoặc trong {{supervisorScope}}: {{launch}} không có ai nhận kết quả nên exception đi tới {{CoroutineExceptionHandler}}, còn {{async}} giữ exception trong {{Deferred}} và ném ra khi {{await}}. Vì vậy trong {{supervisorScope}}, một {{async}} lỗi mà không ai {{await}} sẽ bị lặng lẽ bỏ qua.

### Cancellation là hợp tác
Coroutine chỉ dừng ở điểm suspend hoặc khi gọi {{ensureActive()}}; vòng lặp CPU chặt không tự dừng. Blocking JDBC cũng không bị cancel; {{runInterruptible}} chỉ hữu ích nếu driver tôn trọng interrupt. Dọn dẹp trong {{finally}} nên tránh suspend, hoặc bọc {{withContext(NonCancellable)}} cho phần cleanup bắt buộc.

Không bắt {{CancellationException}} rồi trả kết quả bình thường: điều đó phá vỡ structured concurrency và khiến request bị hủy vẫn tiếp tục ghi dữ liệu.

### Dispatchers.IO
{{Dispatchers.IO}} là pool elastic có giới hạn mặc định 64 thread (hoặc bằng số core nếu máy có hơn 64 core; đổi bằng system property {{kotlinx.coroutines.io.parallelism}}), không phải "bao nhiêu cũng được". Nếu DB pool có 20 connection mà mở 500 coroutine gọi DB, phần lớn sẽ chờ connection; latency tăng và timeout dây chuyền.

- Dùng {{Dispatchers.Default}} cho CPU, {{Dispatchers.IO}} cho blocking IO.
- Đặt bulkhead bằng {{Semaphore}} hoặc {{limitedParallelism}} cho từng dependency.
- Không tăng số thread IO để che DB chậm; hãy đo connection wait, pool saturation và p99.
- Mỗi lần chuyển dispatcher có chi phí; gom {{withContext}} một lần thay vì bọc từng lời gọi nhỏ.

### So với Java 21 StructuredTaskScope
{{StructuredTaskScope}} (preview từ JDK 21, cần {{--enable-preview}}; API còn thay đổi qua các bản JDK sau) cũng đảm bảo task con không sống lâu hơn scope cha, với chính sách như {{ShutdownOnFailure}}/{{ShutdownOnSuccess}} ở JDK 21. Coroutine có hệ sinh thái cancellation, Flow và tích hợp suspend rộng hơn; virtual thread + structured concurrency phù hợp code Java blocking.

Không trộn hai mô hình tùy tiện: nếu đã dùng coroutine, giữ scope xuyên suốt; nếu gọi API Java trả {{CompletableFuture}}, bridge bằng extension {{CompletableFuture.await()}} (package {{kotlinx.coroutines.future}}, nằm trong {{kotlinx-coroutines-core}} từ bản 1.7; trước đó là module {{kotlinx-coroutines-jdk8}}) thay vì tự tạo thread hay gọi {{get()}} chặn thread.

### Observability
Đặt {{CoroutineName}} theo request/job, bật {{-Dkotlinx.coroutines.debug}} ở staging để thread dump hiện tên coroutine, và log khi scope bị cancel. Thiếu tên và context là lý do phổ biến khiến debug coroutine khó hơn thread.

> Senior tip: concurrency limit nên là một con số được review cùng capacity của downstream, không phải giá trị mặc định của dispatcher. Một bulkhead 20 cho DB 20 connection thường ổn định hơn 64 thread IO tranh nhau vài connection.`,
  follow: ['Vì sao {{launch}} và {{async}} xử lý exception khác nhau?', 'Bạn đặt bulkhead cho từng dependency ở đâu trong code?', 'Cancellation của coroutine có rollback giao dịch bên ngoài không?'],
  tags: ['structured concurrency', 'Dispatchers.IO', 'cancellation', 'virtual threads']
},
{
  id: 'kotlin-014', topic: 'kotlin', level: 'senior',
  q: 'Vì sao không nên dùng {{data class}} làm JPA entity? Bạn thiết kế {{equals}}/{{hashCode}}/{{toString}} cho entity Kotlin thế nào để không phá {{HashSet}} và lazy loading?',
  a: `**Tóm tắt:** Không dùng {{data class}} làm JPA entity. Hàm {{equals}}/{{hashCode}} sinh tự động bao gồm mọi property trong primary constructor — kể cả id còn null trước khi persist và collection lazy — nên hash thay đổi sau khi insert, làm hỏng {{HashSet}}/{{HashMap}} và có thể kích hoạt truy vấn ngoài ý muốn. Hãy dùng class thường với business key bất biến hoặc id được xử lý cẩn thận.

### Cơ chế sinh equals/hashCode
{{data class}} sinh {{equals}}, {{hashCode}}, {{toString}}, {{copy}} từ các property khai báo trong primary constructor. Với entity mới, {{id}} thường null; hai entity khác nhau có thể bằng nhau nếu các field còn lại giống. Sau khi Hibernate gán id, {{hashCode}} đổi, nên object đã nằm trong {{Set}} không còn tìm thấy.

Collection lazy trong {{equals}} biến một phép so sánh thành truy vấn DB; quan hệ hai chiều có thể đệ quy vô hạn. {{toString}} còn tệ hơn: log một entity có thể kéo cả đồ thị object và làm lộ dữ liệu nhạy cảm.

{{copy()}} của data class tạo object mới cùng id nhưng state khác; Hibernate coi đó là detached/duplicate, dễ dẫn tới {{merge}} ngoài ý muốn.

### Vì sao entity phải "open"
Hibernate tạo proxy bằng subclass cho lazy loading. Class/method final chặn subclass, nên entity phải được mở bằng plugin all-open (hoặc khai báo {{open}} thủ công cả class và property); plugin {{kotlin-spring}} chỉ mở class có annotation Spring, không mở entity. Plugin {{kotlin-jpa}} sinh constructor không tham số; việc mở entity thì nên khai báo tường minh bằng khối {{allOpen}} chứa {{annotation("jakarta.persistence.Entity")}} trong build.gradle.kts thay vì dựa vào hành vi mặc định của từng phiên bản plugin.

Constructor không tham số do plugin sinh ra mặc định không chạy property initializer hay khối {{init}}: field ở giá trị mặc định của JVM (0/null) cho tới khi Hibernate gán từ ResultSet. Đừng đặt invariant quan trọng trong {{init}} và hy vọng Hibernate chạy nó.

### Cách làm an toàn
~~~kotlin
@Entity
open class Order protected constructor() {
    @Id
    var id: UUID? = null                    // gán trước khi save

    lateinit var code: String               // business key bất biến, unique

    constructor(code: String) : this() {
        this.code = code
        this.id = UUID.randomUUID()
    }

    override fun equals(other: Any?): Boolean =
        this === other || (other is Order && code == other.code)

    override fun hashCode(): Int = code.hashCode()

    override fun toString(): String = "Order(" + code + ")"
}
~~~

- Business key phải immutable, unique và có ý nghĩa nghiệp vụ; nếu không có, dùng id nhưng xử lý null nhất quán.
- Không đưa collection, quan hệ lazy, timestamp audit hay field thay đổi vào {{equals}}/{{hashCode}}.
- Proxy lazy là subclass của entity, nên {{other is Order}} vẫn đúng với proxy; còn {{javaClass == other.javaClass}} thì sai (class proxy khác class thật). Hãy đọc giá trị của {{other}} qua **property (getter)**, vì getter của proxy sẽ khởi tạo proxy và trả giá trị thật; nếu property bị final (quên all-open), Kotlin đọc thẳng field của proxy, vốn là null, và equals trả sai. Cần so class chính xác thì dùng {{Hibernate.getClass(other)}}.
- Với id do application gán, Spring Data thấy id khác null nên coi là entity cũ và gọi {{merge}} (SELECT trước). Cài {{Persistable}} với cờ {{isNew}} để {{save}} dùng {{persist}}.

### Pitfall production
- Test bằng cách thêm entity vào {{HashSet}}, flush, rồi {{contains}} lại; nếu hash đổi, test sẽ lộ ngay.
- {{equals}} dựa trên id: hai entity mới cùng null id có thể bị coi là bằng nhau; trả về false trừ khi cùng instance.
- Kế thừa entity: đừng so bằng {{getClass()}} vì proxy là subclass; dùng business key hoặc {{Hibernate.getClass}}.
- Đừng dùng data class cho entity chỉ để giảm boilerplate; chi phí debug lớn hơn nhiều.

> Senior tip: chọn identity trước khi viết entity. Nếu nghiệp vụ đã có mã đơn hàng/mã giao dịch bất biến, dùng nó làm business key và viết test hash ổn định sau persist; nếu không, dùng id với {{Persistable}} và chấp nhận rằng entity mới chưa có identity.`,
  follow: ['Business key nào phù hợp để tính {{equals}}/{{hashCode}}?', 'Vì sao {{toString}} trên entity lazy có thể gây N+1?', '{{Persistable}} giải quyết vấn đề gì khi id do application gán?'],
  tags: ['JPA', 'Hibernate', 'data class', 'equals', 'hashCode']
},
{
  id: 'kotlin-015', topic: 'kotlin', level: 'senior',
  q: 'Bạn mô hình hóa lỗi nghiệp vụ bằng sealed class. Làm sao map sang HTTP an toàn, serialize ổn định và không làm client cũ vỡ khi thêm nhánh mới?',
  a: `**Tóm tắt:** Dùng sealed hierarchy cho các kết quả nghiệp vụ hữu hạn (validation, not found, conflict) và để exception cho lỗi hạ tầng/bất ngờ. Sealed giúp {{when}} exhaustive trong module, nhưng đừng biến nó thành JSON contract công khai: thêm subtype có thể làm client đã compile sẵn ném {{NoWhenBranchMatchedException}} hoặc lỗi deserialize.

### Phân loại trước khi chọn kiểu
- Lỗi nghiệp vụ dự kiến: người gọi buộc phải xử lý, không nên dùng exception làm luồng điều khiển.
- Lỗi hạ tầng: DB timeout, mất mạng, bug — exception + boundary handler, retry/circuit breaker ở tầng ngoài.
- Lỗi lập trình: {{IllegalStateException}}, fail fast; không nuốt thành result.

Sealed phù hợp khi số nhánh nhỏ và ổn định. Nếu mỗi tuần thêm một mã lỗi HTTP, hierarchy sẽ phình và mọi consumer phải sửa.

~~~kotlin
sealed interface PaymentError {
    data class InvalidAmount(val amount: Long) : PaymentError
    data class InsufficientFunds(val available: Long) : PaymentError
    data class DuplicateRequest(val key: String) : PaymentError
    data class GatewayTimeout(val retryAfterSeconds: Long) : PaymentError
}

fun retryable(e: PaymentError): Boolean = when (e) {
    is PaymentError.GatewayTimeout -> true
    is PaymentError.InvalidAmount,
    is PaymentError.InsufficientFunds,
    is PaymentError.DuplicateRequest -> false
}
~~~

### Exhaustiveness và tiến hóa
{{when}} trên sealed không cần {{else}} nên compiler báo khi thiếu nhánh. Nhưng đừng dùng {{else}} trong code nghiệp vụ: nó vô hiệu hóa cảnh báo và âm thầm bỏ qua subtype mới.

Trong đa module, consumer đã compile với danh sách subtype cũ có thể nhận subtype mới từ provider và ném {{NoWhenBranchMatchedException}} ở runtime. Vì vậy: giữ sealed type {{internal}} trong module, hoặc nếu public thì luôn có nhánh fallback và test tương thích.

Subtype của sealed phải nằm cùng package và module (Kotlin 1.5+). Điều này hữu ích để giới hạn phạm vi nhưng cũng có nghĩa không thể mở rộng từ module khác.

### Serialization
- Jackson cần {{@JsonTypeInfo}} + {{@JsonSubTypes}} hoặc cấu hình tương đương; đừng để tên class nội bộ thành discriminator.
- Kotlin serialization hỗ trợ sealed với {{classDiscriminator}}; client phải biết trước các type.
- Tốt nhất là map sang DTO ổn định {{ErrorResponse}} với code/message/fields ở adapter; domain không phụ thuộc HTTP và client không thấy thay đổi nội bộ.
- Với API công khai, thêm subtype là thay đổi contract; cần version hoặc fallback.

### Map sang HTTP
Dùng {{@RestControllerAdvice}} trả {{ProblemDetail}} (RFC 9457) với type, title, status, detail và property mở rộng cho field errors. Map:
| Nhánh | HTTP |
|---|---|
| InvalidAmount | 400 |
| InsufficientFunds | 409 |
| DuplicateRequest | 409/200 idempotent |
| GatewayTimeout | 503 + Retry-After |

Log expected error ở mức info/warn kèm mã lỗi; unexpected mới log stack và alert.

### Pitfall
- {{runCatching}} bắt cả {{CancellationException}}; trong coroutine phải rethrow.
- Dùng {{Result}} của Kotlin cho lỗi nghiệp vụ sẽ mất kiểu lỗi; sealed riêng rõ hơn.
- Sealed type lồng quá sâu hoặc mang state mutable khiến so sánh/pattern matching khó.
- Trả thẳng exception message ra API làm lộ thông tin nội bộ.

> Senior tip: coi sealed result là hợp đồng nội bộ, còn mã lỗi công khai là hợp đồng với client. Giữ hai lớp này tách nhau, và có contract test cho từng nhánh sang HTTP; như vậy bạn có thể refactor domain mà không phá client.`,
  follow: ['Vì sao thêm subtype sealed có thể gây lỗi ở consumer đã compile?', 'Bạn serialize sealed type sang JSON ổn định bằng cách nào?', 'Khi nào nên dùng exception thay cho sealed result?'],
  tags: ['sealed classes', 'error handling', 'ProblemDetail', 'API evolution']
},
{
  id: 'kotlin-016', topic: 'kotlin', level: 'mid',
  q: 'Extension function rất tiện nhưng dễ bị lạm dụng. Bạn đặt quy ước nào để tránh "API ma", xung đột import và DSL khó đọc trong codebase Spring?',
  a: `**Tóm tắt:** Extension function là static dispatch, tiện cho helper thuần nhưng dễ tạo "API ma" trên type của người khác, che giấu dependency và đổi hành vi âm thầm khi thư viện thêm member cùng tên. Giới hạn chúng trong module, ưu tiên {{internal}}, và dùng {{@DslMarker}} khi viết DSL.

### Dispatch tĩnh và bẫy shadowing
Extension được biên dịch thành hàm static nhận receiver. Nó không override, không dispatch theo runtime type, và member thật luôn thắng nếu cùng tên/signature.

Hệ quả nguy hiểm: hôm nay bạn viết {{fun String.slugify()}}, mai thư viện thêm member {{slugify()}}; call site không đổi nhưng hành vi đổi. Vì vậy đừng đặt extension public lên type phổ biến như {{String}}, {{List}}, {{Any}} trong module dùng chung.

Hai module cùng định nghĩa một extension giống nhau có thể gây ambiguity khi import; IDE chọn một, người review khó thấy. Đặt tên cụ thể theo domain và tránh wildcard import.

### DSL và @DslMarker
Không có marker, lambda lồng nhau có thể truy cập nhầm receiver ngoài:

~~~kotlin
@DslMarker
annotation class RouteDsl

@RouteDsl
class RouteBuilder {
    fun get(path: String, block: RouteBuilder.() -> Unit) { /* ... */ }
}

fun routes(block: RouteBuilder.() -> Unit) = RouteBuilder().block()
~~~

Với {{@DslMarker}}, receiver cùng marker bị ẩn trong lambda con; muốn dùng receiver ngoài phải gọi rõ {{this@routes}}. Điều này ngăn cấu hình route con ghi nhầm vào route cha.

### Operator và infix
Chỉ overload operator khi nghĩa hiển nhiên: {{plus}}, {{get}}, {{contains}}, {{compareTo}}. {{invoke}} trên service làm code trông như gọi hàm nhưng che dependency; {{get}} trên thứ không phải collection gây khó hiểu. Infix như {{to}} ổn, nhưng đừng tạo ký hiệu mới khó tìm.

### Side effect và testability
Extension không có constructor nên không nhận dependency qua DI. Nếu extension đọc {{SecurityContext}}, gọi repository, mở transaction hoặc gửi HTTP, nó trở thành dependency ẩn, khó mock và khó thay policy. Hãy chuyển thành service/interface tường minh.

Extension property không có backing field; nếu dùng delegate như {{by lazy}}, delegate không gắn với từng receiver. Đừng dùng extension để cache state theo instance.

### Interop
Java thấy extension như static method trong facade class mang tên file, ví dụ file {{StringExt.kt}} thành {{StringExtKt.slugify(s)}}; đổi tên file là đổi binary API. Dùng {{@file:JvmName}} để ổn định, {{@JvmName}} khi có xung đột signature. Default parameter cần {{@JvmOverloads}} nếu muốn Java gọi overload.

### Quy ước review
- Helper thuần, ngắn, không IO, tên nói rõ domain.
- {{internal}} theo mặc định; public chỉ khi thật sự là API dùng chung.
- Không extension lên {{Any}}/{{Any?}}.
- Có test cho nullable receiver và trường hợp member trùng tên.

> Senior tip: nếu một extension cần mock, transaction hoặc cấu hình môi trường, nó không còn là extension — hãy biến nó thành bean. Quy tắc này giữ code dễ test và tránh tranh chấp tên khi nâng cấp thư viện.`,
  follow: ['Chuyện gì xảy ra nếu thư viện thêm member trùng tên extension?', '{{@DslMarker}} ngăn lỗi gì trong DSL lồng nhau?', 'Vì sao extension có side effect khó test hơn service?'],
  tags: ['extension functions', 'DSL', 'API design', 'readability']
},
{
  id: 'kotlin-017', topic: 'kotlin', level: 'senior',
  q: 'Bạn chọn {{Flow}} hay {{Flux}}/{{Mono}} cho pipeline streaming? So sánh backpressure, context propagation, interop và trường hợp nên giữ nguyên Reactor.',
  a: `**Tóm tắt:** {{Flow}} và {{Flux}}/{{Mono}} đều là stream lazy có backpressure, nhưng Flow dựa trên suspend và structured concurrency, còn Reactor dựa trên Reactive Streams với scheduler và {{Context}} riêng. Chọn theo stack end-to-end (WebFlux/R2DBC hay coroutine/JDBC), bridge ở adapter và đừng trộn context một cách ngầm hiểu.

### Mô hình chạy
{{flow}} builder với {{emit}} là cold: mỗi collector chạy lại nguồn. {{emit}} là suspend nên producer tự bị chặn khi consumer chậm — backpressure bằng suspension. Mặc định pipeline chạy tuần tự trong coroutine của collector; {{flowOn}} đổi dispatcher cho phía upstream, {{buffer}}/{{conflate}} tách tốc độ, {{collectLatest}} hủy xử lý cũ khi có phần tử mới.

{{Flux}}/{{Mono}} implement Reactive Streams: consumer request(n), operator trả demand; {{subscribeOn}} đặt nguồn, {{publishOn}} đổi scheduler cho downstream. Reactor có {{Context}} bất biến, {{Sinks}} cho hot stream, {{share}}/{{replay}}/{{cache}} để chia sẻ.

Cả hai đều cold mặc định; collect/subscribe nhiều lần sẽ chạy lại nguồn nếu không share.

~~~kotlin
fun prices(id: String): Flow<Price> = flow {
    while (true) {
        emit(client.fetch(id))   // suspend -> backpressure tự nhiên
        delay(1_000)
    }
}

@GetMapping("/prices/{id}", produces = [MediaType.TEXT_EVENT_STREAM_VALUE])
fun stream(@PathVariable id: String): Flow<Price> = service.prices(id)
~~~

### Backpressure và lỗi
- Flow: {{buffer(capacity)}}, {{conflate}}, {{collectLatest}}; buffer vô hạn chỉ che triệu chứng và có thể OOM.
- Reactor: {{onBackpressureBuffer}}/{{onBackpressureDrop}}/{{onBackpressureLatest}}, {{limitRate}}, {{flatMap}} có tham số concurrency (mặc định 256) — đặt tường minh theo downstream.
- Flow dùng {{catch}} cho upstream; lỗi ở downstream không được catch bởi operator đó. Reactor dùng {{onErrorResume}}, {{retryWhen}}, {{timeout}}.
- Cancellation: Flow hủy theo scope; Reactor hủy qua {{Disposable}}/subscription. Cả hai đều không tự rollback side effect.

### Context và interop
{{kotlinx-coroutines-reactive}}/{{kotlinx-coroutines-reactor}} cung cấp {{Flow.asFlux()}}, {{Publisher.asFlow()}}, {{awaitSingle()}}, {{awaitFirst()}} và {{ReactorContext}} để bridge context. Bridge không tự đồng bộ mọi {{ThreadLocal}}; MDC, security, tenant phải xử lý riêng.

Trong WebFlux, trả {{Flow}} từ controller được adapt sang {{Flux}}. Spring MVC (từ 5.3) cũng chấp nhận {{Flow}} làm kiểu trả về thông qua cơ chế reactive adapter (cần {{kotlinx-coroutines-reactor}} trên classpath) và stream kết quả bằng servlet async; tuy vậy mỗi kết nối streaming vẫn giữ tài nguyên servlet, nên với rất nhiều client SSE đồng thời WebFlux phù hợp hơn.

### Chọn cái nào
| Bối cảnh | Lựa chọn |
|---|---|
| WebFlux + R2DBC + WebClient | Reactor |
| Service Kotlin thuần, JDBC, suspend | Flow |
| Kafka | reactor-kafka hoặc consumer loop có kiểm soát |
| Cần backpressure phức tạp, hot stream | Reactor/Sinks |

Đừng convert qua lại nhiều lần trong hot path; chọn biên (adapter) và giữ một mô hình xuyên suốt.

### Pitfall
- Blocking trong {{map}} của Flow hoặc trên event loop của Reactor.
- Dùng {{GlobalScope}}/{{Sinks}} không lifecycle, gây leak.
- Test: {{runTest}} + Turbine cho Flow, {{StepVerifier}} + {{reactor-test}} cho Reactor; nhớ virtual time.
- Flow vô hạn không có cancellation sẽ treo test; luôn đặt timeout.

> Senior tip: đừng chọn Flow chỉ vì đang viết Kotlin. Nếu hệ sinh thái là WebFlux/R2DBC, Reactor cho bạn backpressure và tooling đồng bộ hơn; nếu team chủ yếu viết suspend service và JDBC, Flow dễ đọc hơn. Đo bằng load test thật và theo dõi lag của consumer.`,
  follow: ['{{flowOn}} ảnh hưởng phần nào của pipeline?', 'Bạn bridge Reactor Context và CoroutineContext thế nào?', 'Vì sao Flow vô hạn có thể treo test?'],
  tags: ['Flow', 'Reactor', 'backpressure', 'WebFlux']
},
{
  id: 'kotlin-018', topic: 'kotlin', level: 'lead',
  q: 'Bạn chuyển dần một hệ Spring Boot nhiều module từ Java sang Kotlin. Những điểm kỹ thuật nào trong build, annotation processing và biên API quyết định thành bại?',
  a: `**Tóm tắt:** Chuyển dần theo module/bounded context, giữ biên Java rõ ràng và ưu tiên module mới hoặc ít thay đổi. Phần khó không phải cú pháp Kotlin mà là build nhiều ngôn ngữ, annotation processing (kapt/KSP), proxy của Spring/JPA, nullability ở biên và binary compatibility của API công khai.

### Chiến lược module
- Chọn module lá hoặc module mới ít coupling; tránh vòng phụ thuộc Java ↔ Kotlin giữa các module.
- Trong cùng module, Kotlin compiler chạy trước và đọc được Java source; javac chạy sau, thấy class Kotlin. Java source do annotation processor sinh ra không tự xuất hiện cho Kotlin ở cùng vòng.
- Giữ package/API biên ổn định; expose facade Java-friendly nếu consumer là Java.
- Không rewrite service đang ổn chỉ để tăng tỷ lệ Kotlin; chọn theo mức độ thay đổi thực tế.

### Build và annotation processing
- kapt chạy Java annotation processor, sinh stub, làm chậm build và phá incremental; cần cho processor chưa hỗ trợ KSP.
- KSP nhanh hơn và Kotlin-first nhưng chỉ dùng được với processor hỗ trợ; kiểm tra MapStruct, Hibernate metamodel, Dagger/Hilt trước khi chuyển.
- Spring Framework 6.1 bỏ cơ chế đọc tên tham số từ debug info: code Java cần biên dịch với {{-parameters}}. Với Kotlin, Spring đọc tên tham số qua kotlin-reflect, nhưng vẫn nên bật {{javaParameters = true}} (Spring Boot Gradle plugin tự bật) để tránh lỗi bind {{@PathVariable}}/{{@RequestParam}} không có tên tường minh.
- Cấu hình {{kotlin("plugin.spring")}}, {{kotlin("plugin.jpa")}}, all-open/no-arg; kiểm tra version plugin khớp compiler.
- {{jvm-default}} phải nhất quán giữa các module; thay đổi nó ảnh hưởng interface default method khi Java gọi.
- Pin Kotlin stdlib, dùng BOM, đo build time trước/sau; kapt thường là chi phí lớn nhất.

### API biên Java ↔ Kotlin
- Tránh đưa default argument, suspend, inline/value class vào API public cho Java nếu không có bridge; Java không thấy default argument trừ {{@JvmOverloads}}.
- Dùng {{@JvmStatic}}, {{@JvmName}}, {{@Throws}} khi cần; checked exception của Java không tự xuất hiện trong Kotlin.
- Gắn {{@NullMarked}}/JSpecify cho package Java; nếu compiler Kotlin của bạn hỗ trợ JSpecify thì nullability được hiểu đúng, còn không vẫn là platform type — kiểm tra phiên bản.
- Kotlin {{List}} là read-only view, không đảm bảo immutable khi sang Java; đừng chia sẻ collection mutable qua biên.
- Giữ DTO/API trong module riêng nếu cả hai ngôn ngữ cùng dùng.

### Spring/JPA và test
- Entity cần open/no-arg đúng cách; {{@Transactional}} trên class final hoặc self-invocation vẫn bị bypass.
- Jackson cần Kotlin module; kiểm tra {{ObjectMapper}} tự tạo.
- Test integration thật cho proxy, rollback, lazy loading và serialization; đừng chỉ test gọi trực tiếp class.
- MockK hiểu Kotlin tốt hơn (final class, {{suspend}}, object, extension); Mockito 5 mock được final class nhờ inline mock maker nhưng kém tự nhiên với suspend. Dùng {{runTest}} thay {{runBlocking}} trong test coroutine.
- Đo APM/agent có hỗ trợ coroutine context không trước khi rollout.

### Vận hành và đội ngũ
- Coding convention, ktlint/detekt, review checklist cho interop; tránh "Kotlin viết như Java" và DSL quá thông minh.
- Pair programming, owner cho build plugin, tài liệu rollback.
- Đo lead time, defect escape, build time, p95; không đo bằng số dòng.
- Giữ khả năng quay lại: module mới có thể revert mà không ảnh hưởng module cũ.

### Pitfall
- Big-bang rewrite. Chạy cả kapt và KSP trong cùng module là được phép (thường gặp khi đang chuyển dần), nhưng nhân thời gian build và dễ nhầm processor nào sinh code nào; hãy có kế hoạch bỏ kapt.
- Quên {{javaParameters}} hoặc Kotlin module → lỗi runtime chỉ xuất hiện ở môi trường thật.
- Nâng Kotlin compiler nhưng quên plugin Spring/JPA; proxy và no-arg hỏng.
- Public API Kotlin đổi signature ngầm khi thêm default parameter hoặc đổi nullability.

> Senior tip: hãy chọn một bounded context có API rõ, chuyển nó cùng test và observability, rồi so sánh số liệu với baseline trước khi mở rộng. Đầu tư sớm vào build/annotation processing và quy ước biên Java sẽ rẻ hơn nhiều so với sửa lỗi proxy/deserialization rải rác về sau.`,
  follow: ['Vì sao Java source do annotation processor sinh ra khó thấy từ Kotlin trong cùng vòng?', 'Bạn chọn kapt hay KSP dựa trên tiêu chí nào?', 'Những construct Kotlin nào không nên xuất hiện trong API public cho Java?'],
  tags: ['migration', 'Gradle', 'kapt', 'KSP', 'Java interop']
}
);
