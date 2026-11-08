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

### Bên trong: compiler làm gì với platform type
Kiểu trả về từ Java không có annotation được Kotlin coi là {{String!}} (platform type): compiler **không bắt** bạn kiểm tra null và cũng **không chèn** kiểm tra nào khi bạn dùng nó như kiểu nullable. Khi bạn gán vào biến khai báo **non-null** ({{val name: String = javaObj.getName()}}), compiler chèn một lời gọi kiểm tra ngay tại chỗ gán ({{Intrinsics.checkNotNullExpressionValue}}) → nếu Java trả null, NPE nổ **tại ranh giới** với thông báo rõ tên biểu thức. Nếu bạn để kiểu suy luận ({{val name = javaObj.getName()}}) rồi truyền đi tiếp, null có thể đi sâu vào code Kotlin và nổ ở chỗ khác, khó tìm hơn. Annotation JSpecify, {{@Nullable}}/{{@NonNull}} của JetBrains, Jakarta, Spring ({{org.springframework.lang}}) được Kotlin đọc để biến platform type thành kiểu rõ ràng.

### Ví dụ đời thực
Một service Kotlin gọi SDK Java của cổng thanh toán: {{response.getFailureReason()}} không có annotation. Code viết {{if (response.getFailureReason().isEmpty())}} — chạy tốt trong mọi test vì dữ liệu mock luôn có lý do. Trên production, giao dịch **thành công** trả null cho trường này → NPE, khoảng 2% giao dịch thành công bị ghi nhận "lỗi" và hoàn tiền nhầm. Sửa: bọc SDK bằng một lớp adapter Kotlin nhỏ khai báo kiểu tường minh ({{val failureReason: String?}}), mọi code còn lại chỉ dùng adapter; bật {{-Xjsr305=strict}} để annotation JSR-305 của Spring được coi là kiểu thật.

### Trả lời mẫu khi phỏng vấn
"Null safety của Kotlin chỉ bảo vệ hoàn toàn trong code Kotlin. Giá trị đến từ Java không có annotation là platform type: compiler không bắt kiểm tra null và cũng không chèn kiểm tra, nên NPE vẫn xảy ra nếu tôi dùng nó như non-null. Cách tôi xử lý là chặn ở ranh giới: gán ngay vào biến có kiểu tường minh, nullable hoặc non-null, để nếu sai thì NPE nổ đúng chỗ ranh giới với thông báo rõ ràng. Với thư viện Java dùng nhiều, tôi bọc bằng một adapter Kotlin mỏng khai báo kiểu rõ ràng, phần còn lại của code chỉ dùng adapter. Phía Java thì thêm annotation như JSpecify hoặc của Spring, và bật jsr305 strict để Kotlin hiểu chúng như kiểu thật."

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

### Ví dụ đời thực
Một team chuyển DTO API sang Kotlin {{data class}} có giá trị mặc định: {{data class OrderRequest(val note: String = "", val qty: Int = 1)}}. Client gửi JSON thiếu {{qty}}: với jackson-module-kotlin, giá trị mặc định 1 được dùng — đúng ý. Nhưng một DTO khác dùng {{val qty: Int}} (không mặc định): client gửi thiếu trường → module Kotlin báo lỗi rõ ràng (tốt), còn trước đó bản Java gán 0 im lặng và tạo đơn số lượng 0. Ngược lại, một chỗ dùng {{copy()}} của data class để "sửa" entity JPA tạo ra object mới không được Hibernate quản lý → thay đổi không được lưu, mất 2 ngày tìm lỗi. Quy ước sau đó: data class cho DTO/value object, **không** cho entity; record Java giữ ở module Java dùng chung.

### Trả lời mẫu khi phỏng vấn
"Data class và record đều cho equals, hashCode, toString theo các thuộc tính chính, nhưng data class có thêm copy, componentN cho destructuring, thuộc tính var nếu muốn, và giá trị mặc định cho tham số, còn record bất biến hoàn toàn và là chuẩn của Java. Với DTO trong code Kotlin, tôi dùng data class với val, tận dụng giá trị mặc định và null safety, kết hợp jackson-module-kotlin để trường bắt buộc thiếu thì báo lỗi thay vì gán giá trị mặc định im lặng. Nếu DTO nằm trong module dùng chung với code Java, record thường dễ dùng hơn từ phía Java. Tôi không dùng data class cho JPA entity, vì equals, hashCode theo mọi thuộc tính phá vỡ Set và proxy của Hibernate, toString có thể kích hoạt lazy loading, và copy tạo object không được quản lý."

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

### Bên trong: extension function biên dịch thành gì
{{fun String.toSlug(): String}} trong file {{TextUtils.kt}} được biên dịch thành **phương thức static** {{TextUtilsKt.toSlug(String receiver)}}. Vì vậy extension **không** thực sự thêm method vào class, không truy cập được thành viên private, và được **chọn lúc biên dịch theo kiểu khai báo** (static dispatch): nếu biến khai báo là {{Animal}} thì extension của {{Animal}} được gọi dù object thật là {{Dog}}. Nếu class đã có member cùng chữ ký, **member luôn thắng** — extension bị "che" mà compiler chỉ cảnh báo. Từ Java, gọi bằng {{TextUtilsKt.toSlug(s)}} (đổi tên lớp bằng {{@file:JvmName}}).

### Ví dụ đời thực
Một codebase Spring có extension {{fun Order.isPaid() = status == "PAID"}} trong module chung. Sau này team thêm method thành viên {{isPaid()}} vào entity {{Order}} với logic mới (tính cả PARTIALLY_REFUNDED). Mọi lời gọi tự động chuyển sang member — đúng ý; nhưng một module khác import một extension **cùng tên** trong package riêng, gọi trên kiểu {{BaseOrder}} (lớp cha không có member) nên vẫn dùng logic cũ → báo cáo doanh thu lệch hai nguồn. Quy ước sau đó: extension cho tiện ích không phải nghiệp vụ (format, mapping), quy tắc nghiệp vụ nằm trong class/service; cấm trùng tên extension giữa các module (kiểm bằng detekt).

### Trả lời mẫu khi phỏng vấn
"Extension function cho tôi thêm hàm tiện ích vào một kiểu có sẵn mà không kế thừa hay sửa class, giúp code đọc tự nhiên, ví dụ chuyển đổi DTO hay format. Bên dưới, nó chỉ là một hàm static nhận đối tượng làm tham số đầu tiên, nên không truy cập được thành viên private, được chọn lúc biên dịch theo kiểu khai báo chứ không theo kiểu thật, và nếu class có member cùng chữ ký thì member luôn thắng. Trong codebase Spring tôi dùng extension cho mapping, format, tiện ích kiểm thử, đặt trong file theo chủ đề và package rõ ràng. Tôi không đặt quy tắc nghiệp vụ trong extension, vì người đọc tưởng đó là hành vi của class, và các extension trùng tên ở nhiều package dễ gây hành vi khác nhau tuỳ import."

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

### Ví dụ đời thực
Service tổng hợp hồ sơ khách hàng gọi 6 API nội bộ (mỗi cái 80–300ms), chạy trên Spring MVC với pool 200 thread. Phiên bản đầu gọi tuần tự: p95 1,2 giây. Team so sánh ba hướng trên cùng bài toán:
- **CompletableFuture** với executor riêng: p95 340ms, nhưng code lồng {{thenCombine}} khó đọc, lỗi dễ bị nuốt, timeout phải gắn thủ công từng future.
- **Kotlin coroutine** ({{coroutineScope}} + {{async}}) với WebClient suspend: p95 320ms, code tuần tự dễ đọc, huỷ tự động khi một nhánh lỗi — nhưng phải chuyển controller sang suspend và cẩn thận với JDBC blocking (phải dùng {{Dispatchers.IO}}).
- **Virtual thread** (Java 21, {{spring.threads.virtual.enabled=true}}) + {{StructuredTaskScope}} (preview ở Java 21) hoặc executor virtual thread: p95 330ms, giữ nguyên RestClient và JDBC blocking.
Team chọn virtual thread vì codebase chủ yếu Java và dùng JDBC; module Kotlin mới vẫn dùng coroutine nơi đã có sẵn WebClient.

### Trả lời mẫu khi phỏng vấn
"Cả ba đều giúp chạy nhiều việc I/O đồng thời, khác nhau ở mô hình lập trình. CompletableFuture có sẵn trong Java nhưng code dạng chuỗi callback khó đọc, xử lý lỗi và huỷ phải tự làm. Coroutine của Kotlin cho code tuần tự dễ đọc, có structured concurrency nên một nhánh lỗi thì các nhánh khác bị huỷ, nhưng cần toàn bộ đường đi là suspend, và gặp thư viện blocking như JDBC thì phải đẩy sang Dispatchers.IO. Virtual thread của Java 21 giữ nguyên code blocking quen thuộc, chỉ cần bật trong Spring Boot 3.2 trở lên, hợp với codebase Java dùng JDBC, cần chú ý pinning khi có synchronized quanh I/O trên Java 21. Tôi chọn theo codebase: chủ yếu Java và JDBC thì virtual thread; service Kotlin đã reactive hoặc dùng WebClient thì coroutine; CompletableFuture chỉ cho chỗ cần tương thích API cũ."

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

### Bên trong: when trên sealed class
Sealed class/interface giới hạn các lớp con **trong cùng module và package** (Kotlin 1.5+), nên compiler biết **toàn bộ** biến thể. Biểu thức {{when}} dùng làm giá trị (ví dụ {{return when (r)}} …) trên sealed type phải **phủ hết** biến thể, nếu không là lỗi biên dịch; từ Kotlin 1.7, {{when}} dạng câu lệnh trên sealed/enum/Boolean cũng bắt buộc phủ hết. Biến thể là {{data class}} (có dữ liệu) hoặc {{data object}} (không dữ liệu, Kotlin 1.9+, có toString đẹp).

~~~kotlin
sealed interface CreateOrderResult {
    data class Created(val orderId: Long) : CreateOrderResult
    data class Invalid(val errors: List<FieldError>) : CreateOrderResult
    data object OutOfStock : CreateOrderResult
}
fun toHttp(r: CreateOrderResult): ResponseEntity<Any> = when (r) {   // thiếu nhánh = lỗi biên dịch
    is CreateOrderResult.Created -> ResponseEntity.status(201).body(r)
    is CreateOrderResult.Invalid -> ResponseEntity.unprocessableEntity().body(r.errors)
    CreateOrderResult.OutOfStock -> ResponseEntity.status(409).build()
}
~~~

### Ví dụ đời thực
Service đặt hàng dùng exception cho mọi kết quả không thành công; thêm trạng thái "hết hàng tạm thời" thì 3 controller không bắt exception mới → trả 500 thay vì 409, app hiển thị "Lỗi hệ thống" cho khách. Chuyển sang sealed result như trên: lần thêm biến thể {{PaymentRequired}} sau đó, compiler báo đúng 5 chỗ cần xử lý trước khi merge. Exception chỉ còn dành cho lỗi hệ thống thật (DB down, timeout).

### Trả lời mẫu khi phỏng vấn
"Tôi mô hình kết quả nghiệp vụ bằng sealed interface với các biến thể: data class cho kết quả có dữ liệu như Created hay Invalid kèm danh sách lỗi, data object cho trạng thái không có dữ liệu như OutOfStock. Vì compiler biết toàn bộ biến thể, when dùng làm biểu thức phải phủ hết, nên khi thêm biến thể mới mọi chỗ chưa xử lý đều lỗi biên dịch, thay vì rơi vào nhánh mặc định lúc chạy. Kết quả nghiệp vụ dự kiến được thì trả bằng sealed result, còn lỗi hệ thống bất ngờ như DB lỗi thì vẫn dùng exception và xử lý tập trung. Giới hạn là các biến thể phải cùng module và package, và ở ranh giới JSON hay client cũ cần thêm biến thể unknown hoặc version hoá để không vỡ khi thêm biến thể."

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

### Ví dụ đời thực
Job xuất báo cáo đọc 2 triệu dòng giao dịch, lọc rồi lấy 100 dòng đầu thoả điều kiện. Bản Kotlin đầu tiên viết {{rows.filter(...).map(...).take(100)}} trên {{List}}: mỗi bước tạo một list trung gian 2 triệu phần tử → heap tăng 1,8GB, GC full liên tục, job mất 40 giây. Đổi sang {{rows.asSequence().filter(...).map(...).take(100).toList()}}: xử lý từng phần tử qua cả chuỗi và **dừng sớm** khi đủ 100 → 1,2 giây, gần như không cấp phát thêm. Nhưng một chỗ khác dùng {{Sequence}} trên kết quả {{useLines}} của file rồi trả sequence ra ngoài khối {{use}} → file đã đóng khi sequence được duyệt, lỗi "Stream closed" ở production. Quy tắc: sequence từ tài nguyên phải được duyệt xong **bên trong** khối quản lý tài nguyên.

### Trả lời mẫu khi phỏng vấn
"Collection của Kotlin như List mặc định là eager: mỗi phép filter hay map tạo ngay một danh sách trung gian đầy đủ. Sequence là lazy: từng phần tử đi qua cả chuỗi, chỉ tính khi có thao tác cuối như toList hay first, và dừng sớm được với take hay first. Với dữ liệu nhỏ, collection eager thường nhanh hơn vì ít overhead; với dữ liệu lớn, chuỗi nhiều bước hoặc cần dừng sớm thì Sequence tiết kiệm bộ nhớ hơn nhiều. Java Stream cũng lazy như Sequence nhưng chỉ dùng được một lần và có parallel, còn Sequence không có song song. Điều tôi cẩn thận nhất là vòng đời tài nguyên: sequence đọc từ file hay cursor DB phải được duyệt xong bên trong khối use, không trả nó ra ngoài."

> Senior tip: ưu tiên cách dễ đọc; benchmark bằng JMH hoặc load test có dữ liệu thực, đo allocation và GC chứ không chỉ elapsed time một lần. Tối ưu lớn thường đến từ paging/query plan hơn là đổi {{List}} thành {{Sequence}}.`,
  follow: ['Vì sao Sequence có thể chậm hơn collection với pipeline ngắn?', 'Bạn đóng stream đọc file thế nào khi có xử lý lazy?', 'Sequence có tương đương parallelStream không?'],
  tags: ['collections', 'Sequence', 'Stream', 'performance']
},
{
  id: 'kotlin-008', topic: 'kotlin', level: 'mid',
  q: 'Trong code review, bạn giải thích {{let}}, {{run}}, {{with}}, {{apply}} và {{also}} ra sao để team không biến scope function thành cú pháp khó đọc?',
  a: `**Tóm tắt:** Kotlin cung cấp năm hàm phạm vi (scope function) — let, run, with, apply, also — để gom một chuỗi thao tác ngắn trên một đối tượng vào một khối lambda. Chúng khác nhau ở hai trục: tên gọi đối tượng bên trong lambda (this hay it) và giá trị trả về (chính đối tượng hay kết quả của lambda). Dùng chúng cho khối ngắn, mục đích rõ; tránh lồng nhiều hàm vì this và it dễ bị nhầm lẫn.

### 1. Khái niệm cơ bản
Scope function là hàm mở rộng (extension function): nó cho phép gọi bằng cú pháp doiTuong.tenHam() mà không cần sửa hay kế thừa class gốc. Java dev hiểu đơn giản là static method nhận đối tượng làm tham số đầu, nhưng Kotlin cho cú pháp đẹp hơn. Hai điều cần ghi nhớ:
- this: lambda truy cập thành viên của đối tượng mà không cần viết tên đối tượng.
- it: lambda nhận đối tượng làm tham số đặt tên là it.
- Giá trị trả về: apply và also trả về chính đối tượng nhận gọi (dùng để chain); let, run, with trả về giá trị lambda tính toán được.

### 2. Bảng so sánh
| Hàm | Gọi đối tượng bằng | Trả về | Dùng khi nào |
|---|---|---|---|
| let | it | giá trị lambda | biến đổi giá trị, xử lý khi khác null |
| run | this | giá trị lambda | cấu hình rồi tính toán một kết quả |
| with(obj) | this | giá trị lambda | gọi nhiều thành viên của obj, obj không phải this của class xung quanh |
| apply | this | chính đối tượng | khởi tạo và thiết lập trường cho đối tượng mới |
| also | it | chính đối tượng | side effect nhẹ như log, validate, không làm gián đoạn luồng |

Ví dụ:
~~~kotlin
val request = Request().apply {
    id = incomingId
    source = "web"
}.also { logger.info("request {}", it.id) }

val length = nullableName?.let { it.trim().length }
~~~

apply trả về chính request nên ta có thể nối .also sau đó. also nhận request qua it để ghi log. let trên nullableName chỉ chạy lambda khi giá trị khác null, và trả về độ dài hoặc null.

### 3. Cách chọn trong code thực tế
- Đối tượng mới cần thiết lập vài trường trước khi dùng: apply.
- Muốn ghi log hoặc validate đối tượng mà không thay đổi giá trị luồng: also.
- Giá trị có thể null và muốn biến đổi khi có giá trị: let.
- Gọi nhiều thành viên của obj và lấy ra một kết quả tính toán: run hoặc with.
- run thường dùng như mở rộng của đối tượng (this ngầm), còn with(obj) là hàm thông thường nhận obj làm tham số.

### 4. Những điều cần tránh (pitfall)
- Lồng apply và let khiến this/it ngầm trỏ nhầm đối tượng; nếu không chắc, dùng biến trung gian có tên.
- also trông như hàm tinh tế nhưng thực ra có thể ghi database, gửi sự kiện — side effect cần hàm riêng và xử lý lỗi rõ ràng.
- let trên nullable không kiểm tra nội dung bên trong; null vẫn có thể đến từ kiểu Java (platform type) nếu bạn không kiểm tra ở ranh giới.
- Tránh chain dài các hàm phạm vi trong entity JPA, vì getter có thể kích hoạt lazy load vào cơ sở dữ liệu.

### 5. Trả lời mẫu khi phỏng vấn
"Năm hàm phạm vi của Kotlin — let, run, with, apply, also — khác nhau ở hai điểm: tên biến đại diện cho đối tượng bên trong lambda (this hay it) và giá trị trả về (đối tượng hay kết quả lambda). Tôi dùng apply khi khởi tạo đối tượng và thiết lập vài trường, dùng also để log hoặc validate mà không làm gián đoạn luồng, dùng let để xử lý giá trị có thể null. Tôi tránh lồng nhiều hàm phạm vi vì this và it dễ bị nhầm, và nếu lambda dài tôi sẽ tách thành biến có tên hoặc hàm riêng để code dễ đọc và debug hơn."

> Senior tip: trong code review, hãy hỏi “lambda trả về gì và ai là receiver?”. Nếu câu trả lời cần đọc lại toàn bộ chain, hãy thay bằng biến trung gian có tên; ít dòng hơn không phải luôn dễ bảo trì hơn.`,
  follow: ['{{apply}} và {{also}} trả về gì khác nhau?', 'Vì sao {{it}}/{{this}} lồng nhau làm review khó?', 'Bạn dùng {{let}} thay cho if-null trong trường hợp nào?'],
  tags: ['scope functions', 'let', 'apply', 'readability']
},
{
  id: 'kotlin-009', topic: 'kotlin', level: 'mid',
  q: 'Khi Kotlin cần khai báo singleton/factory mà Java caller cũng sử dụng, bạn chọn top-level declaration, object hay companion object? {{@JvmStatic}} thay đổi điều gì?',
  a: `**Tóm tắt:** Kotlin có ba cách khai báo thành phần dùng chung: hàm/property trên cao nhất file (top-level), object (đơn thể duy nhất trong ứng dụng), và companion object (đối tượng đồng hành gắn liền với một class, dùng cho factory và hằng số). Java caller thấy chúng khác nhau: top-level thành static method của class phụ sinh từ file, object là instance thường, companion cần @JvmStatic nếu muốn Java gọi như static method quen thuộc.

### 1. Ba cách khai báo
- Top-level function/property: khai báo ngoài cùng trong file .kt, biên dịch thành thành viên static của class phụ sinh (mặc định tên dựa trên tên file, ví dụ StringUtilsKt). Dùng cho hàm tiện ích không thuộc class nào, ví dụ parse, format, validation. Giữ file nhỏ, tên rõ.
- object: khai báo đơn thể, chỉ có một instance trong toàn ứng dụng. Dùng cho registry không trạng thái, strategy dùng chung. Lưu ý trạng thái có thể thay đổi (mutable state) thành trạng thái toàn cục, cần an toàn luồng.
- companion object: đối tượng đồng hành nằm trong class, dùng cho factory như User.from(dto) hoặc hằng số liên quan đến class. Đây là instance thông thường, không phải constructor.

Ví dụ:
~~~kotlin
class User private constructor(val id: Long) {
    companion object {
        @JvmStatic
        fun from(id: Long) = User(id)
    }
}
~~~

Kotlin gọi User.from(1). Nếu không có @JvmStatic, Java thường gọi User.Companion.from(1). @JvmStatic sinh thêm phương thức static cầu nối để Java gọi User.from(1), tương tự cho getter của property tương ứng.

### 2. Khi chọn cái nào
- Hàm tiện ích chung không thuộc class cụ thể: top-level.
- Cần duy nhất một instance, không trạng thái hay trạng thái được bảo vệ kín: object.
- Cần factory, hằng số, API tạo instance gắn liền với class: companion object.

### 3. Ranh giới Java interop
- Java thấy top-level API qua class phụ sinh của file; đổi tên file có thể đổi nhị phân API, trừ khi ổn định bằng @file:JvmName. Đừng tạo class phụ sinh chứa nhiều tiện ích không liên quan.
- const val phù hợp giá trị hằng số compile-time đơn giản; val trong companion không nhất thiết là hằng static final theo cách Java mong đợi. Giá trị hằng được nhúng vào code client có thể gây vấn đề khi đổi giá trị mà client chưa biên dịch lại.
- Đơn thể không nên giữ trạng thái của request hoặc người dùng; classloader, cách ly test và bộ sưu tập có thể thay đổi toàn cục dễ tạo rò rỉ giữa request hoặc giữa test.

### 4. Trả lời mẫu khi phỏng vấn
"Khi cần thành phần dùng chung mà Java cũng phải gọi, tôi chọn theo mục đích: hàm tiện ích chung thì khai báo top-level, cần duy nhất một instance thì dùng object, và cần factory hay hằng số gắn với class thì dùng companion object. Với Java caller, companion object thường gọi qua User.Companion.from(), nên tôi thêm @JvmStatic để Java gọi được như static method quen thuộc. Tôi cũng tránh để trạng thái có thể thay đổi trong object vì đó là trạng thái toàn cục, dễ gây rò rỉ giữa request."

> Senior tip: nếu API dùng rộng từ Java, viết một smoke test nhỏ bằng Java cho cách gọi thực tế và giữ tên class phụ sinh, chữ ký ổn định; Kotlin biên dịch thành công không đảm bảo API Java dễ dùng.`,
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

### Ví dụ đời thực
Một team 12 dev Java đề xuất chuyển 30 service sang Kotlin. Thay vì quyết định một lần, tech lead làm pilot 8 tuần trên **một** service mới (thông báo khách hàng) với 3 người tình nguyện, đo: thời gian build tăng 25% (kapt, sau đó chuyển sang KSP còn khoảng 10%), NPE trên production giảm từ 6 xuống 0 trong quý, số dòng code ít hơn khoảng 30%, thời gian review của người chưa biết Kotlin tăng gấp đôi trong 3 tuần đầu. Kết luận được duyệt: **service mới** được phép dùng Kotlin, service cũ giữ Java, có tài liệu quy ước (không dùng coroutine trong service JDBC, detekt + ktlint trong CI), 2 buổi đào tạo mỗi quý. Một năm sau, 9 service Kotlin chạy ổn; không ai phải viết lại service Java cũ.

### Trả lời mẫu khi phỏng vấn
"Tôi không quyết định chuyển sang Kotlin bằng cảm tính. Đầu tiên là đánh giá lợi ích cụ thể với team: null safety giảm NPE, code ngắn gọn hơn, data class, sealed class; so với chi phí: đào tạo, thời gian build, tuyển người, công cụ, và hai ngôn ngữ cùng tồn tại. Sau đó tôi làm pilot có thời hạn trên một service mới, với người tình nguyện, và đo những con số như thời gian build, lỗi production, thời gian review. Nếu kết quả tốt, tôi đề xuất áp dụng cho service mới trước, không viết lại service Java đang chạy ổn, kèm quy ước và lint trong CI. Tôi sẽ không chuyển nếu team đang chịu áp lực giao hàng lớn, nếu không ai trong team muốn học, hoặc nếu lợi ích chính mà mọi người mong muốn thực ra đã có trong Java 21 như record, sealed, pattern matching."

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

### Ví dụ đời thực
Một codebase có gần 400 extension function rải rác, nhiều cái trùng tên khác hành vi ({{String.toMoney()}} ở ba package: một cái làm tròn, một cái cắt bớt, một cái hiểu dấu phẩy là phần thập phân). Bug: báo cáo đối soát dùng nhầm import, lệch 0,4% tổng tiền. Team đặt quy ước: extension dùng chung chỉ nằm trong một module {{common-ext}} có README liệt kê; tên phải nói rõ hành vi ({{toMoneyRoundedHalfUp}}); cấm extension có side effect (gọi DB, HTTP) — những thứ đó phải là service inject được; detekt kiểm tra trùng tên. DSL cấu hình test dùng {{@DslMarker}} để không gọi nhầm hàm của scope bên ngoài. Sau 2 tháng còn khoảng 120 extension, không có trùng tên.

### Trả lời mẫu khi phỏng vấn
"Extension tiện nhưng vì được chọn lúc biên dịch theo import và kiểu khai báo, lạm dụng sẽ tạo ra API ma: người đọc tưởng đó là hành vi của class, hai extension trùng tên ở hai package cho kết quả khác nhau tuỳ import. Quy ước của tôi là: extension chỉ cho tiện ích thuần như format, mapping, không có side effect như gọi DB hay HTTP, vì những thứ đó cần inject và mock được; đặt extension dùng chung ở một module rõ ràng có tài liệu; tên phải nói rõ hành vi; không trùng tên với member hay với extension khác. Với DSL tôi dùng @DslMarker để tránh gọi nhầm hàm của scope ngoài, và hạn chế operator overloading hay infix tự chế. Detekt và review checklist giúp giữ quy ước này."

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
},
{
  id: 'kotlin-019',
  topic: 'kotlin',
  level: 'senior',
  q: 'Trong Spring Boot 3, coroutine Kotlin và Virtual Thread Java cùng hứa hẹn "code đồng bộ, throughput cao" — bạn chọn cái nào, khi nào?',
  a: `**Tóm tắt:** Trong Spring Boot 3, cả luồng ảo Java (Virtual Thread, Java 21) và coroutine Kotlin đều hứa hẹn viết mã đồng bộ nhưng xử lý nhiều tác vụ cùng lúc. Virtual Thread là cơ chế cấp JVM dùng cho mọi ngôn ngữ trên JVM, phù hợp khi giữ mã Java blocking và mở rộng số luồng. Coroutine là trừu tượng hóa cấp ngôn ngữ Kotlin, phù hợp khi codebase viết Kotlin và cần structured concurrency, hủy tác vụ (cancellation), kết hợp các lời gọi bất đồng bộ. Chọn theo stack và nhu cầu, không theo con số hiệu năng đơn lẻ.

### 1. Hai khái niệm khác nhau
- Virtual Thread (JEP 444): luồng thật của JVM nhưng rẻ như coroutine, gắn (mount) và tháo (unmount) khỏi luồng chở (carrier thread). Mã vẫn là blocking I/O thông thường như Thread.sleep, InputStream.read. Bạn không cần đổi cách viết mã, chỉ cần cấu hình JVM/Spring.
- Coroutine: hàm chờ (suspend function), compiler sinh ra máy trạng thái, không chiếm luồng khi chờ; cần runtime kotlinx-coroutines. Bạn viết mã trông đồng bộ nhưng thực ra coroutine nhường luồng tại mỗi điểm chờ.

### 2. Khi nào chọn Virtual Thread
- Codebase chủ yếu Java, hoặc Kotlin nhưng gọi API blocking như JDBC, RestTemplate, các thư viện cũ chỉ có API blocking.
- Muốn bật nhanh bằng spring.threads.virtual.enabled=true mà không đổi mã.
- Cần tương thích với công cụ observability, agent, profiler chạy trên luồng JVM thường.

### 3. Khi nào chọn coroutine
- Codebase Kotlin, muốn suspend, Flow, structured concurrency, hủy tác vụ tự động khi yêu cầu hủy.
- Cần kết hợp nhiều lời gọi bất đồng bộ (async/await) và truyền hủy tác vụ xuống các lời gọi con.
- Cần kết nối Reactor (coroutine có cầu nối với Reactor qua kotlinx-coroutines-reactor).

### 4. Bảng trade-off
| Tiêu chí | Virtual Thread | Coroutine |
|---|---|---|
| Ngôn ngữ | Java và Kotlin | Kotlin |
| Phong cách mã | blocking | suspend |
| Hủy tác vụ | thủ công | có cấu trúc tự động |
| Kết hợp bất đồng bộ | CompletableFuture | async/await, Flow |
| Thư viện | API blocking ổn | cần API nhận thức suspend |

### 5. Ví dụ Spring Boot 3
~~~kotlin
@GetMapping("/orders/{id}")
suspend fun get(@PathVariable id: Long): OrderDto =
    withContext(Dispatchers.IO) {
        service.load(id)
    }
~~~

{{withContext(Dispatchers.IO)}} chỉ bọc phần blocking truy cập cơ sở dữ liệu, không block toàn bộ luồng xử lý. Với Virtual Thread, bạn không cần {{withContext}} này, nhưng vẫn bị giới hạn bởi pool kết nối cơ sở dữ liệu.

### 6. Lỗi hay gặp
- Virtual Thread kết hợp synchronized có thể ghim luồng chở (pin carrier thread), làm mất lợi ích; hãy dùng ReentrantLock thay vì synchronized khi cần.
- Coroutine gọi mã blocking trực tiếp sẽ chiếm luồng dispatcher; hãy dùng withContext(Dispatchers.IO) cho phần blocking.
- Trộn cả hai trong cùng một yêu cầu làm ngữ cảnh khó theo dõi và debug.
- Virtual Thread không làm cho cơ sở dữ liệu nhanh hơn; pool kết nối và giới hạn downstream vẫn là nút thắt.

> Senior tip: bắt đầu với Virtual Thread nếu team còn viết Java nhiều; chuyển sang coroutine khi cần hủy tác vụ, kết hợp bất đồng bộ và codebase đã dùng Kotlin. Đo p99 và số luồng thực tế trước khi quyết định, không chỉ tin vào benchmark đơn lẻ.`,
  follow: ['Bạn đo pinning của Virtual Thread bằng cách nào?', 'withContext(Dispatchers.IO) khác gì Virtual Thread về tài nguyên?', 'Khi nào coroutine không đáng công migrate?'],
  tags: ['kotlin', 'coroutine', 'virtual-thread', 'spring-boot']
},
{
  id: 'kotlin-020',
  topic: 'kotlin',
  level: 'senior',
  q: 'Structured concurrency và cancellation trong coroutine Kotlin: coroutineScope, supervisorScope khác nhau thế nào, và vì sao cancellation cooperative?',
  a: `**Tóm tắt:** Structured concurrency (đồng thời có cấu trúc — mọi coroutine con đều gắn vào một scope cha có vòng đời rõ ràng) đảm bảo coroutine con không bao giờ bị rò rỉ: cha chờ con hoàn tất, hủy cha thì hủy toàn bộ cây con. coroutineScope hủy toàn bộ khi một con lỗi; supervisorScope để con lỗi độc lập. Hủy tác vụ là cooperative (phải hợp tác): coroutine chỉ dừng khi mã tự kiểm tra isActive hoặc gọi một hàm chờ (suspend function), nên việc đặt cờ hủy thôi chưa đủ.

### 1. Vấn đề coroutine "rò rỉ"
Nếu khởi chạy coroutine mà không gắn vào scope có vòng đời rõ, khi yêu cầu xong coroutine vẫn chạy → rò rỉ tài nguyên, khó debug. Mỗi coroutine phải thuộc một scope; scope cha chờ tất cả con, hủy scope cha thì hủy toàn bộ cây dưới nó. Ví dụ launch trong controller không gắn vào lifecycle của request sẽ tiếp tục chạy sau khi response đã trả về.

### 2. coroutineScope vs supervisorScope
- coroutineScope: nếu một con ném lỗi, hủy các con khác và truyền lỗi ra ngoài. Phù hợp khi tất cả nhánh phải thành công, ví dụ tổng hợp dữ liệu từ nhiều dịch vụ.
- supervisorScope: lỗi của một con không ảnh hưởng các con khác; lỗi lan qua Job của chính con đó. Phù hợp khi một thành phần lỗi không được làm hỏng toàn bộ trang, ví dụ dashboard nhiều widget độc lập.

Ví dụ:
~~~kotlin
suspend fun fetchAll() = coroutineScope {
    val a = async { fetchA() }
    val b = async { fetchB() }
    a.await() + b.await() // nếu a lỗi, b bị hủy
}
~~~

Nếu đổi thành supervisorScope, lỗi của fetchA không hủy fetchB, và lỗi chỉ ném ra khi bạn await Deferred của chính nhánh đó.

### 3. Hủy tác vụ là cooperative
Gọi job.cancel() chỉ đánh dấu cờ đã hủy; coroutine chỉ dừng khi gặp điểm chờ (suspend point) hoặc kiểm tra isActive. Vòng lặp xử lý CPU nặng phải tự gọi ensureActive(). Không bắt CancellationException rồi trả kết quả bình thường, điều đó phá vỡ structured concurrency và khiến yêu cầu bị hủy vẫn tiếp tục ghi dữ liệu.

Ví dụ kiểm tra trong vòng lặp:
~~~kotlin
while (items.hasNext()) {
    ensureActive() // ném CancellationException nếu bị hủy
    process(items.next())
}
~~~

### 4. Lỗi hay gặp
- Bỏ qua CancellationException → coroutine không dừng khi được yêu cầu.
- Dùng GlobalScope → mất structured concurrency, coroutine sống độc lập.
- Gọi mã blocking trực tiếp trong coroutine → không phản hồi hủy tác vụ.
- Dùng runBlocking trong controller hoặc filter → chiếm luồng và dễ gây hunger luồng.

### 5. Trả lời mẫu khi phỏng vấn
"Tôi dùng structured concurrency để đảm bảo coroutine con không rò rỉ: cha chờ con hoàn tất và hủy cha sẽ hủy toàn bộ cây con. coroutineScope phù hợp khi mọi nhánh phải thành công — một con lỗi thì hủy các con khác. supervisorScope phù hợp khi các con độc lập, ví dụ widget trên dashboard. Hủy tác vụ trong Kotlin là cooperative: job.cancel() chỉ đặt cờ, coroutine dừng ở điểm chờ tiếp theo, nên mã CPU-heavy phải kiểm tra isActive. Tôi không dùng GlobalScope và không bắt CancellationException lầm thành lỗi thông thường."

> Senior tip: coi hủy tác vụ như một hợp đồng — mọi hàm chờ nên phản hồi hủy tác vụ; hãy kiểm thử bằng cách hủy Job và kiểm tra tài nguyên được dọn dẹp.`,
  follow: ['ensureActive() đặt ở đâu trong vòng lặp CPU-heavy?', 'CancellationException có nên catch không?', 'Làm sao propagate cancellation sang blocking I/O?'],
  tags: ['kotlin', 'coroutine', 'cancellation', 'structured-concurrency']
},
{
  id: 'kotlin-021',
  topic: 'kotlin',
  level: 'mid',
  q: 'Null safety khi gọi code Java từ Kotlin: platform type là gì, và vì sao NPE vẫn có thể xảy ra?',
  a: `**Tóm tắt:** Khi gọi mã Java từ Kotlin, kiểu trả về của Java nếu không có chú thích nullability (thông tin cho biết giá trị có được phép null hay không) trở thành kiểu nền tảng (platform type, ví dụ {{String!}}), Kotlin không biết giá trị đó null hay không-null, nên compiler không bắt buộc kiểm tra. NPE (NullPointerException — lỗi truy cập null lúc chạy) vẫn xảy ra nếu Java trả null và mã Kotlin tham chiếu mà không kiểm tra. Ở ranh giới, hãy coi mọi giá trị từ Java là có thể null cho đến khi có chú thích đáng tin cậy, và chuyển sang kiểu Kotlin rõ ràng.

### 1. Kiểu nền tảng là gì
- Phương thức Java String getName() được Kotlin thấy là String! (có dấu than).
- Compiler cho phép gọi cả cách dùng nullable lẫn non-null trên kiểu này, không đưa ra cảnh báo.
- Chú thích {{@Nullable}}/{{@NotNull}} (JSR-305, JetBrains, Android, v.v.) có thể giúp Kotlin suy luận nullability, nhưng mức hỗ trợ phụ thuộc cấu hình trình biên dịch (ví dụ {{-Xjsr305}}) và phiên bản; JSpecify ({{org.jspecify.annotations}}) là hướng chuẩn hóa mới hơn — hãy kiểm tra phiên bản Kotlin, cấu hình và chú thích thực tế trong dự án.

### 2. Vì sao NPE vẫn xảy ra
- Mã Java trả null bất ngờ, ví dụ Map.get trả null khi khóa không có.
- Kotlin tin là non-null và gọi phương thức → NPE tại thời điểm chạy.
- Generic Java như List<String> có thể chứa phần tử null nếu không có chú thích type-use đáng tin cậy.

### 3. Cách phòng ngừa
- Thêm chú thích nullability vào mã Java (Spring thường dùng @Nullable/@NotNull).
- Ở ranh giới Kotlin, coi kiểu nền tảng là nullable và kiểm tra.
- Dùng Objects.requireNonNull hoặc requireNotNull ở ranh giới để fail fast rõ ràng.

Ví dụ:
~~~kotlin
val name: String? = javaObj.name // an toàn, coi là có thể null
val upper = name?.uppercase() // chỉ viết hoa khi khác null
val required = requireNotNull(javaObj.name) // thất bại ngay với thông báo rõ ràng
~~~

### 4. Những điều cần tránh
- Ép kiểu nền tảng sang non-null bằng !! → NPE nếu Java trả null.
- Bộ sưu tập từ Java có thể bị thay đổi và chứa phần tử null.
- Chú thích không được lan truyền qua reflection hay generic.
- Đừng để kiểu nền tảng lan sâu vào miền nghiệp vụ (domain); hãy chuyển ngay ở adapter.

### 5. Ví dụ đời thực
Một hệ thống đặt hàng gọi API legacy Java lấy mã khách hàng. DTO Kotlin ban đầu dùng String (non-null) cho trường mã khách hàng, nhưng Java trả null khi khách hàng là khách lẻ. Lỗi NPE chỉ phát hiện sau hai tuần production khi doanh thu giảm 15% tại check-out. Cách sửa: đổi thành String? ở DTO, dùng requireNotNull ở ranh giới dịch vụ, và hiển thị "Khách lẻ" khi null. Sau khi sửa, lỗi NPE về khách hàng giảm về không.

### 6. Trả lời mẫu khi phỏng vấn
"Kiểu nền tảng là cách Kotlin xử lý kiểu Java không có thông tin nullability, ví dụ String!; compiler không biết null hay không-null nên không bắt buộc kiểm tra. Nếu Java trả null và Kotlin tham chiếu, NPE xảy ra tại runtime. Tôi xử lý bằng cách coi mọi giá trị từ Java là nullable ở ranh giới, thêm chú thích nullability vào mã Java, và dùng requireNotNull hoặc toán tử an toàn ?. để chuyển sang kiểu Kotlin rõ ràng. Tôi tránh !! trừ khi invariant đã được chứng minh và lỗi phải fail fast."

> Senior tip: coi mọi giá trị từ Java là nullable cho đến khi có chú thích; viết lớp adapter ở ranh giới để chuyển sang kiểu Kotlin rõ ràng, ghi log có định danh yêu cầu nhưng không ghi dữ liệu nhạy cảm.`,
  follow: ['JSR-305 annotation có bị Kotlin honour mặc định không?', 'Làm sao enforce nullability ở biên Java?', 'Map.get trong Java trả platform type, xử lý thế nào?'],
  tags: ['kotlin', 'null-safety', 'platform-type', 'java-interop']
},
{
  id: 'kotlin-022',
  topic: 'kotlin',
  level: 'senior',
  q: 'Data class Kotlin vs Java record trong JPA/Hibernate: bạn chọn cái nào và vì sao entity thường không nên là data class?',
  a: `**Tóm tắt:** Data class Kotlin sinh equals, hashCode, toString, copy dựa trên tất cả property trong constructor chính; Java record tương tự nhưng bất biến. Entity JPA cần mutable, identity theo id, và có thể tạo proxy cho lazy loading, nên cả hai đều không phù hợp làm entity. Dùng class thường với var và equals theo id (hoặc identity mặc định). Data class và record phù hợp cho DTO, giá trị, read model.

### 1. Data class Kotlin
- Sinh constructor, getter, setter (nếu var), equals, hashCode, toString, copy.
- equals/hashCode dùng mọi property → vấn đề với liên kết lazy và proxy.
- copy() là shallow copy: đối tượng mutable bên trong vẫn dùng chung tham chiếu.

### 2. Java record
- Bất biến theo thiết kế, accessor tên thành phần (không có getter JavaBean mặc định), record là final.
- Không có setter nên Hibernate khó khởi tạo (cần constructor không tham số và truy cập trường); không phù hợp entity.

### 3. Vì sao entity không nên là data class
- Lazy loading: equals/hashCode chạm liên kết có thể gây N+1 hoặc LazyInitializationException.
- Proxy: Hibernate tạo subclass proxy cho lazy loading; data class final theo mặc định không thể được subclass (cần open hoặc plugin all-open).
- Identity: entity nhận biết qua id, không phải toàn bộ trạng thái; hai entity mới cùng id null có thể bị coi là bằng nhau nếu equals dựa trên các trường khác.
- Data class với collection mutable dễ gây lỗi aliasing.

### 4. Cách làm an toàn
~~~kotlin
@Entity
open class Order protected constructor() {
    @Id
    var id: UUID? = null

    lateinit var code: String

    constructor(code: String) : this() {
        this.code = code
        this.id = UUID.randomUUID()
    }

    override fun equals(other: Any?): Boolean =
        this === other || (other is Order && code == other.code)

    override fun hashCode(): Int = code.hashCode()

    override fun toString(): String = "Order(code=$code)"
}
~~~

- Business key phải bất biến, duy nhất và có ý nghĩa nghiệp vụ.
- Không đưa collection, liên kết lazy, timestamp đánh giá hay trường thay đổi vào equals/hashCode.
- Proxy là subclass của entity, nên other is Order vẫn đúng; nhưng javaClass == other.javaClass sai vì class proxy khác class thật. Đọc giá trị qua getter (property) để proxy khởi tạo và trả giá trị thật.
- Với id do ứng dụng gán, Spring Data thấy id khác null và coi là entity cũ, gọi merge; hãy cài Persistable với cờ isNew nếu muốn save dùng persist.

### 5. Lựa chọn
- Entity: class thường, open (hoặc all-open plugin), equals/hashCode theo id hoặc identity mặc định.
- DTO/read model: data class hoặc record (bất biến, value semantics).

### 6. Trả lời mẫu khi phỏng vấn
"Tôi không dùng data class làm entity JPA vì equals/hashCode sinh tự động dùng mọi property, bao gồm id chưa gán và liên kết lazy — điều này làm hash thay đổi sau khi persist, phá HashSet/HashMap và có thể kích hoạt truy vấn không mong muốn. Java record cũng không phù hợp vì bất biến và thiếu setter mà JPA cần. Tôi dùng class thường mở (open), equals/hashCode dựa trên business key bất biến hoặc id, và data class/record chỉ cho DTO và read model."

> Senior tip: quy ước entity = class mutable nhận biết qua id; DTO = data class/record bất biến. Code review nên kiểm tra equals/hashCode của entity và viết test thêm entity vào HashSet rồi kiểm tra contains sau khi persist.`,
  follow: ['Equals/hashCode entity theo id có vấn đề gì khi entity chưa persist?', 'all-open plugin cấu hình thế nào?', 'Khi nào dùng @Immutable của Hibernate?'],
  tags: ['kotlin', 'data-class', 'record', 'jpa', 'hibernate']
},
{
  id: 'kotlin-023',
  topic: 'kotlin',
  level: 'mid',
  q: 'Extension function Kotlin: cơ chế hoạt động thế nào, và rủi ro lạm dụng trong codebase lớn?',
  a: `**Tóm tắt:** Extension function (hàm mở rộng) là syntactic sugar (cú pháp rút gọn): compiler chuyển {{receiver.ext()}} thành phương thức tĩnh {{ExtKt.ext(receiver)}}. Không có đa hình lúc chạy (dynamic dispatch), không truy cập thành viên {{private}}, và không ghi đè (override) được. Lạm dụng dẫn đến API "ma" khó tìm định nghĩa và xung đột tên trong codebase lớn.

### 1. Cơ chế hoạt động
- fun String.isEmail(): Boolean biên dịch thành fun isEmail($receiver: String): Boolean.
- Gọi s.isEmail() thực ra gọi isEmail(s).
- Quy tắc phân trùng được quyết tại thời điểm biên dịch theo kiểu khai báo của receiver, không đa hình theo runtime type. Nếu subclass có phương thức thành viên cùng tên, phương thức thành viên luôn được ưu tiên.

### 2. Lợi ích
- Thêm phương thức cho class bạn không sở hữu (String, List, v.v.) mà không cần kế thừa.
- Xây dựng DSL, API kiểu builder.
- Extension property (getter/setter).

### 3. Rủi ro khi lạm dụng
- Phân trùng overload khó hiểu: extension so với thành viên của class, extension so với extension.
- "Hành động từ xa": phương thức xuất hiện bất ngờ từ một import nào đó.
- Tên chung như toDto ở nhiều module dẫn đến xung đột.
- Khó khám phá qua IDE nếu chưa có import.

### 4. Quy ước sử dụng
- Extension nên là hàm thuần khiết (pure function), không side effect.
- Đặt trong file rõ ràng, gói theo miền nghiệp vụ (domain).
- Tránh extension cho kiểu quá chung như Any, List<Any>.
- Nếu bạn sở hữu class, ưu tiên thành viên của class thay vì extension.

### 5. Java interop
- Java không thấy extension như phương thức, chỉ thấy static helper trong class phụ sinh của file (mặc định tên dựa trên tên file, ví dụ StringExtKt). Dùng @file:JvmName để ổn định tên class, @JvmName khi có xung đột chữ ký.
- Tham số mặc định cần @JvmOverloads nếu Java muốn gọi overload.

### 6. Ví dụ đời thực
Một team đặt fun String.toDto() trong module chung. Hai tháng sau, thư viện Java mới thêm phương thức getDto() và một module khác cũng khai báo extension toDto(). Code compile nhưng runtime gọi sai hàm, gây sai dữ liệu trong báo cáo tài chính. Cách sửa: đổi tên thành toOrderDto(), toInvoiceDto(), đặt trong gói riêng và gắn @file:JvmName("OrderDtoExt") để Java caller ổn định.

### 7. Lỗi hay gặp
- Extension không override: gọi nhầm khi có subclass.
- Extension property không có trường lưu trữ (backing field).

### 8. Trả lời mẫu khi phỏng vấn
"Extension function cho phép thêm phương thức vào class đã có mà không sửa class đó; compiler biên dịch thành hàm static nhận đối tượng làm tham số đầu. Tôi chỉ dùng extension cho hàm thuần, ngắn, tên rõ miền nghiệp vụ (domain), và tránh extension lên kiểu chung như {{Any}}. Nếu extension cần mock, gọi repository, hay lấy cấu hình, tôi chuyển thành bean rõ ràng thay vì để dependency ẩn. Với Java, extension xuất hiện dưới dạng static helper trong class phụ sinh, nên tôi giữ tên file và chữ ký ổn định."

> Senior tip: extension là công cụ tiện lợi, không phải cơ chế hướng đối tượng; nếu một extension cần mock, transaction hoặc cấu hình môi trường, nó không còn là extension — hãy biến nó thành bean.`,
  follow: ['Extension function và member function thứ tự ưu tiên?', 'Làm sao tổ chức extension trong multi-module?', 'Extension có thể truy cập private không?'],
  tags: ['kotlin', 'extension-function', 'api-design']
},
{
  id: 'kotlin-024',
  topic: 'kotlin',
  level: 'senior',
  q: 'Spring Boot + Kotlin: open class/all-open plugin, kotlin-spring, Jackson module — cấu hình tối thiểu và lỗi hay gặp?',
  a: `**Tóm tắt:** Kotlin làm cho class và phương thức final theo mặc định, nhưng Spring cần tạo subclass proxy cho AOP, @Transactional, @Async, còn JPA cần subclass proxy và constructor không tham số để khởi tạo entity. Plugin all-open (kotlin-spring) mở các class có chú thích Spring; plugin no-arg (kotlin-jpa) sinh constructor rỗng cho entity. Jackson module Kotlin xử lý data class, giá trị mặc định và nullability khi deserialize JSON.

### 1. Vấn đề với final
- Spring AOP tạo proxy subclass; class final khiến CGLIB không tạo proxy được, @Transactional không hoạt động và không rollback.
- JPA/Hibernate tạo proxy subclass cho lazy loading; entity cần mở (open).
- Lớp cấu hình @Configuration cần open hoặc đặt proxyBeanMethods = false.

### 2. kotlin-spring / all-open
- Plugin tự mở class và phương thức có chú thích @Component, @Service, @Transactional, @Async, @Cacheable, v.v.
- Cấu hình Gradle: id("org.jetbrains.kotlin.plugin.spring").
- Có thể mở thêm chú thích tuỳ chỉnh qua khối allOpen.

### 3. no-arg plugin
- Sinh constructor không tham số cho class có @Entity, @Embeddable, @MappedSuperclass, cần JPA khởi tạo entity.
- Constructor sinh ra mặc định không chạy khối khởi tạo hay initializer; Hibernate gán trường từ ResultSet sau đó.

### 4. Jackson module Kotlin
- jackson-module-kotlin hỗ trợ constructor chính, data class, giá trị mặc định và nullability.
- Spring Boot tự đăng ký nếu có dependency trên classpath; nếu tự tạo ObjectMapper, hãy đăng ký KotlinModule() thủ công.
- Dùng @field:NotBlank/@field:Min vì Bean Validation mặc định đọc trường/getter, không phải tham số constructor.

### 5. Ví dụ Gradle
~~~kotlin
plugins {
    kotlin("jvm")
    kotlin("plugin.spring")
    kotlin("plugin.jpa")
    kotlin("plugin.allopen")
}
~~~

### 6. Lỗi hay gặp
- Quên plugin → @Transactional dường như hoạt động nhưng không rollback vì không có proxy.
- Entity final → Hibernate không tạo proxy, lazy loading lỗi.
- Jackson không deserialize data class nếu thiếu module Kotlin.
- lateinit kết hợp constructor injection cần lưu ý thứ tự khởi tạo.

### 7. Ví dụ đời thực
Một service đặt đơn hàng và đánh dấu @Transactional. Do quên plugin kotlin-spring, class service là final, Spring không tạo proxy nên @Transactional bị bỏ qua. Khi lỗi xảy ra giữa chừng, dữ liệu đã ghi được một nửa nhưng không rollback, dẫn đến đơn hàng bị khuyết. Sau khi bật plugin và viết kiểm thử integration xác nhận rollback, sự cố không tái lập.

### 8. Trả lời mẫu khi phỏng vấn
"Kotlin class final theo mặc định, còn Spring cần subclass proxy cho @Transactional và JPA cần proxy cho lazy loading. Tôi dùng plugin kotlin-spring (all-open) để mở các class chú thích Spring, plugin kotlin-jpa (no-arg) để sinh constructor rỗng cho entity, và đăng ký jackson-module-kotlin để Jackson hiểu data class và nullability. Tôi cũng kiểm thử integration thực sự: rollback khi lỗi, lazy loading ngoài transaction và round-trip JSON."

> Senior tip: có checklist trong CI: kiểm thử @Transactional rollback thực sự, kiểm thử entity load liên kết lazy, và kiểm thử JSON round-trip. Không tin vào đơn giản là mã biên dịch được.`,
  follow: ['proxyBeanMethods=false khi nào dùng?', 'lateinit vs constructor injection?', 'KSP thay kapt trong Spring có được không?'],
  tags: ['kotlin', 'spring-boot', 'all-open', 'jackson', 'gradle']
},
{
  id: 'kotlin-025',
  topic: 'kotlin',
  level: 'senior',
  q: 'Flow Kotlin vs Project Reactor (Mono/Flux): khác nhau về cold/hot, backpressure, và khi nào chọn cái nào trong Spring WebFlux?',
  a: `**Tóm tắt:** Flow là dòng dữ liệu lạnh của Kotlin dựa trên coroutine, backpressure tự nhiên qua việc hàm chờ (suspend). Reactor (Mono/Flux) là thư viện reactive Java, dòng lạnh mặc định, backpressure qua cơ chế subscriber yêu cầu dữ liệu (request n). Trong Spring WebFlux (dựa trên Reactor), dùng Reactor ở ranh giới web, bridge sang Flow trong logic Kotlin bằng kotlinx-coroutines-reactor.

### 1. Cold và hot
- {{Flow}}: lạnh — mỗi lần {{collect}} chạy lại nguồn tạo dữ liệu. {{collect}} là hàm chờ (suspend), nên luồng thu nhận/đẩy dữ liệu tự nhiên theo nhịp consumer (backpressure).
- SharedFlow/StateFlow: nóng — phát tán cho nhiều thu nhận; StateFlow lưu lại giá trị mới nhất (replay 1).
- Mono/Flux: lạnh mặc định; nóng qua Sinks.

### 2. Backpressure
- Flow: tự nhiên — collect là hàm chờ, khi người dùng chậm, phía tạo dữ liệu cũng bị chờ (với buffer). Dùng buffer, confluent, collectLatest để điều khiển.
- Reactor: rõ ràng — người dùng yêu cầu n phần tử; các toán tử như limitRate, flatMap có tham số cùng lúc cần đặt theo năng lực downstream.

### 3. Thành phần
- {{Flow}}: toán tử là hàm chờ ({{map}}, {{filter}}, {{flatMapMerge}}, v.v.), vận hành trong ngữ cảnh coroutine/structured concurrency.
- Reactor: chuỗi toán tử, Scheduler để luân chuyển luồng.

### 4. Ví dụ bridge
~~~kotlin
@GetMapping("/prices/{id}", produces = [MediaType.TEXT_EVENT_STREAM_VALUE])
fun stream(@PathVariable id: String): Flow<Price> = service.prices(id)
~~~

Spring WebFlux thích ứng Flow thành Flux. Cầu nối ngược: flow.asFlux(), Publisher.asFlow(). Cầu nối ngữ cảnh: Dispatchers.Reactor, ReactorContext. Không tự đồng bộ mọi ThreadLocal; MDC, security, tenant phải xử lý riêng.

### 5. Chọn cái nào
| Bối cảnh | Lựa chọn |
|---|---|
| WebFlux + R2DBC + WebClient | Reactor |
| Logic Kotlin thuần, JDBC, hàm chờ | Flow |
| Cần tương thích hệ sinh thái Reactor (WebClient, R2DBC) | Reactor |

Không chuyển qua lại nhiều lần trên đường đi nóng; chọn ranh giới (adapter) và giữ một mô hình xuyên suốt.

### 6. Ví dụ đời thực
Một API giá cổ phiếu real-time dùng {{Flow}} để phát (emit) giá mỗi giây cho client qua SSE (Server-Sent Events — kênh đẩy dữ liệu một chiều từ server xuống trình duyệt qua HTTP). Vì một lỗi ở tầng tích hợp, luồng không được thu nhận (collect) đúng cách trong vòng đời xử lý yêu cầu, {{Flow}} là dòng lạnh nên không chạy và client không nhận được giá. Sau khi sửa để controller trả {{Flow}} (hoặc chuyển đúng sang {{Flux}}) và xử lý hủy khi client ngắt kết nối, dữ liệu cập nhật ổn định. Lỗi ngược lại: dùng {{SharedFlow}} với bộ đệm không giới hạn để phát cho nhiều subscriber nội bộ khi consumer chậm dẫn đến bộ nhớ tăng dần; chuyển sang {{StateFlow}} (chỉ giữ giá trị mới nhất, conflation) hoặc đặt giới hạn bộ đệm/hủy subscriber chậm giúp khống chế bộ nhớ.

### 7. Lỗi hay gặp
- Flow không có thu nhận thì không chạy (lạnh) — dễ quên collect.
- Trộn luồng điều khiển (dispatcher) làm mất ngữ cảnh.
- Dòng nóng không backpressure có thể gây thiếu bộ nhớ (OOM).

### 8. Trả lời mẫu khi phỏng vấn
"Flow là dòng dữ liệu lạnh Kotlin dựa trên coroutine, backpressure tự nhiên vì {{collect}} là hàm chờ. Reactor là thư viện reactive Java, backpressure rõ ràng qua {{request(n)}}. Trong Spring WebFlux, tôi giữ Reactor ở ranh giới web ({{Mono}}/{{Flux}} từ controller, {{WebClient}}, R2DBC), dùng {{Flow}} trong miền nghiệp vụ (domain) Kotlin, và chuyển bằng {{flow.asFlux()}} ở bộ điều khiển. Tôi không chuyển qua lại nhiều lần trên đường nóng và luôn kiểm thử backpressure bằng tải thực."

> Senior tip: ranh giới rõ — lớp web dùng Reactor, miền nghiệp vụ (domain) dùng {{Flow}}, chuyển ở bộ điều khiển. Đo bộ nhớ và chênh lệch người dùng (lag) bằng tải thực, không chỉ theo thời gian phản hồi một lần.`,
  follow: ['asFlux() có preserve context không?', 'SharedFlow vs Flux.share()?', 'Khi nào dùng StateFlow thay cache?'],
  tags: ['kotlin', 'flow', 'reactor', 'webflux', 'backpressure']
},
{
  id: 'kotlin-026',
  topic: 'kotlin',
  level: 'lead',
  q: '(Lead) Có nên chuyển codebase Java sang Kotlin không? Bạn sẽ quyết định và thực thi thế nào?',
  a: `**Tóm tắt:** Không viết lại toàn bộ codebase theo kiểu big-bang. Quyết định chuyển sang Kotlin dựa trên giá trị kinh doanh, kỹ năng team và khả năng tương thích. Dùng chiến lược strangler fig: module mới viết Kotlin, giữ ranh giới interop rõ ràng với Java, đo số liệu. Migration là dự án kéo dài nhiều quý, cần người chủ sở hữu và kế hoạch quay lại.

### 1. Khi nào nên chuyển
- Team đã quen Kotlin, codebase cần null safety, coroutine hay DSL.
- Miền nghiệp vụ (domain) mới, API rõ ràng, kiểm thử tốt.
- Công cụ build sẵn (Gradle, KSP).

### 2. Khi nào không nên chuyển
- Team chỉ biết Java, thời hạn gấp.
- Framework legacy không hỗ trợ Kotlin tốt.
- Code quan trọng hiệu năng phụ thuộc công cụ profiling, agent của Java.

### 3. Chiến lược strangler fig
- Module mới viết Kotlin; module cũ giữ Java.
- Ranh giới interop: gói/hợp đồng rõ, tránh đặc thù Kotlin trong API công khai dùng bởi Java.
- Chuyển dần khi chạm đến file (boy scout), không viết lại lớn.

### 4. Rủi ro và cách giảm thiểu
- Thời gian build tăng do kapt/KSP → ưu tiên KSP, dùng build cache.
- Codebase hỗn hợp phức tạp hơn → quy ước, ktlint/detekt, kiểm thử interop.
- Việc tuyển dụng và hòa nhập thành viên mới → tài liệu, lập trình đôi (pair programming).
- Tương thích nhị phân → cẩn thận thay đổi API công khai.

### 5. Số liệu để quyết định mở rộng
- Thời gian đưa ra thị trường (lead time), lỗi lọt qua kiểm thử (defect escape), thời gian build, p99.
- Khảo sát sự hài lòng của nhà phát triển.
- Khả năng quay lại: module có thể hoàn tác mà không ảnh hưởng module cũ.

### 6. Ví dụ đời thực
Một công ty logistics chuyển module quản lý đơn hàng từ Java sang Kotlin theo kiểu strangler: module mới viết Kotlin, gọi module Java cũ qua API REST. Hai tháng sau, build thời gian tăng 40% do kapt và team gặp lỗi serialize data class do thiếu Jackson module. Dùng KSP thay kapt, thêm jackson-module-kotlin, và giữ kiểm thử integration song song. Khi module Kotlin ổn định, mới chuyển tiếp module kế toán.

### 7. Lỗi hay gặp
- Viết lại toàn bộ cùng lúc → sai lầm về hồi quy, morale té.
- Viết Kotlin theo kiểu Java → không tận dụng lợi ích ngôn ngữ.
- Quên xử lý annotation processing → lỗi chỉ xuất hiện khi chạy thực tế.

### 8. Trả lời mẫu khi phỏng vấn
"Tôi không phê duyệt việc viết lại toàn bộ codebase. Tôi chọn một bounded context có API rõ, viết module mới bằng Kotlin cùng kiểm thử và quan sát, rồi so sánh số liệu với hệ thống Java hiện tại trước khi mở rộng. Ranh giới giữa Java và Kotlin phải rõ ràng, tránh đưa kiểu đặc thù Kotlin vào API công khai. Tôi ưu tiên KSP để build nhanh, giữ khả năng quay lại cho từng module, và không đo thành công bằng số dòng code."

> Senior tip: chọn một bounded context có API rõ, chuyển cùng kiểm thử và quan sát, so sánh số liệu với baseline trước khi quy mô mở rộng. Đầu tư sớm vào công cụ build và quy ước ranh giới Java sẽ rẻ hơn nhiều so với sửa lỗi proxy hay deserialize rải rác sau này.`,
  follow: ['Bạn sẽ chọn module đầu tiên để migrate thế nào?', 'Làm sao đo ROI của migration?', 'Khi nào nên dừng migration?'],
  tags: ['kotlin', 'migration', 'lead', 'strategy']
},
{
  id: 'kotlin-027',
  topic: 'kotlin',
  level: 'senior',
  q: 'Team muốn viết một microservice nhỏ bằng Kotlin và đang cân nhắc Ktor thay vì Spring Boot. Bạn so sánh hai lựa chọn theo những tiêu chí nào, và khi nào bạn chọn Ktor?',
  a: `**Tóm tắt:** **Ktor** là framework web của JetBrains viết cho Kotlin, dựa trên **coroutine**, rất nhẹ và **tường minh**: bạn tự cài từng plugin (serialization, auth, metrics), không có auto-configuration và không có DI sẵn. **Spring Boot** là hệ sinh thái đầy đủ: auto-config, DI, Spring Data, Security, Actuator, hàng nghìn tích hợp, nhưng nặng hơn và nhiều "phép màu". Tôi chọn Ktor cho service **nhỏ, I/O nhiều, team thành thạo Kotlin/coroutine**, ít cần tích hợp doanh nghiệp; chọn Spring Boot khi cần **hệ sinh thái, quy chuẩn chung của công ty** và team chủ yếu đến từ Java.

### Ktor hoạt động thế nào
- Ứng dụng là một hàm Kotlin cấu hình **engine** (Netty, CIO…) và cài **plugin**; route viết bằng DSL; mỗi handler là {{suspend}} function chạy trên coroutine.
- Không quét classpath, không proxy, không annotation magic → khởi động nhanh, dễ đọc đường đi của request.
- DI không có sẵn: truyền tay qua constructor hoặc dùng Koin.
~~~kotlin
fun main() {
    embeddedServer(Netty, port = 8080) {
        install(ContentNegotiation) { json() }          // kotlinx.serialization
        val repo = OrderRepository(dataSource())        // "DI" bằng tay
        routing {
            get("/orders/{id}") {
                val id = call.parameters["id"]?.toLongOrNull()
                    ?: return@get call.respond(HttpStatusCode.BadRequest)
                val order = repo.find(id)                // suspend: không chặn thread
                    ?: return@get call.respond(HttpStatusCode.NotFound)
                call.respond(order)
            }
        }
    }.start(wait = true)
}
~~~

### So sánh theo tiêu chí
| Tiêu chí | Ktor | Spring Boot (Kotlin) |
|---|---|---|
| Mô hình | Coroutine từ gốc | MVC blocking (+ virtual thread) hoặc WebFlux + coroutine |
| Khởi động, bộ nhớ | Nhẹ, nhanh | Nặng hơn (giảm được bằng CDS/AOT/native) |
| Tích hợp sẵn | Ít: tự chọn thư viện DB (Exposed, jOOQ, JDBC), security | Rất nhiều: Spring Data, Security, Kafka, Actuator, Cloud |
| Quy chuẩn trong công ty | Phải tự xây (logging, tracing, health) | Thường đã có starter nội bộ |
| Tuyển người, tài liệu | Ít hơn | Rất nhiều |
| Testing | testApplication chạy server trong bộ nhớ | Test slice, MockMvc, Testcontainers |
| Phù hợp | Service nhỏ, gateway, BFF, công cụ nội bộ | Hệ thống nghiệp vụ lớn, nhiều tích hợp |

### Câu hỏi quyết định
1. Công ty có **platform chuẩn** (starter Spring nội bộ cho logging, tracing, security, config) không? Có → chọn khác chuẩn nghĩa là tự xây lại tất cả cho một service.
2. Team có **thật sự thành thạo coroutine** (structured concurrency, cancellation, dispatcher) không? Ktor không cho "đường lui" blocking dễ dàng.
3. Service cần **tích hợp gì**: JPA phức tạp, Kafka, OAuth2 resource server… — Spring có sẵn, Ktor phải ráp.
4. Ràng buộc **tài nguyên/khởi động** có thật sự quan trọng (serverless, sidecar)?

### Ví dụ đời thực
Một team 4 người viết BFF (backend-for-frontend) gom dữ liệu từ 6 service cho app mobile bằng Ktor: mỗi request gọi song song 6 service bằng {{async}}, khởi động khoảng 1 giây, chạy với 256MB RAM. Kết quả tốt. Năm sau, team muốn viết service thanh toán cũng bằng Ktor; khi liệt kê yêu cầu (OAuth2 resource server, audit, outbox với Kafka, tracing theo chuẩn công ty), ước lượng tự ráp mất thêm khoảng 5 tuần so với dùng starter Spring nội bộ — họ chọn Spring Boot + Kotlin coroutine cho service đó. Cả hai quyết định đều đúng cho bối cảnh của nó.

### Pitfall
- Chọn Ktor vì "nhẹ và hiện đại" rồi tự viết lại security, health check, tracing kém hơn chuẩn công ty.
- Gọi JDBC blocking trực tiếp trong handler Ktor mà không chuyển sang {{Dispatchers.IO}} → chặn thread của event loop.
- Một công ty có quá nhiều framework → khó luân chuyển người giữa các team.
- Đánh giá Spring Boot "nặng" chỉ theo thời gian khởi động mà quên CDS, AOT hoặc native image.

### Trả lời mẫu khi phỏng vấn
"Ktor là framework của JetBrains viết cho Kotlin, dựa trên coroutine, rất nhẹ và tường minh: tôi tự cài từng plugin, route viết bằng DSL, không có auto-configuration và không có DI sẵn. Spring Boot thì là cả một hệ sinh thái với DI, Spring Data, Security, Actuator và rất nhiều tích hợp, đổi lại nặng hơn và nhiều phép màu hơn. Tôi chọn theo bốn câu hỏi: công ty đã có platform chuẩn dựa trên Spring chưa, team có thật sự thành thạo coroutine không, service cần tích hợp những gì, và tài nguyên hay thời gian khởi động có thật sự quan trọng không. Với BFF hay service nhỏ nhiều I/O, team giỏi Kotlin, Ktor rất hợp. Với service nghiệp vụ cần OAuth2, Kafka, audit, tracing theo chuẩn công ty, tôi chọn Spring Boot với Kotlin, vì tự ráp các phần đó trên Ktor tốn nhiều tuần và dễ kém chuẩn hơn."

> Senior tip: trước khi chọn framework khác chuẩn công ty, liệt kê mọi "yêu cầu phi chức năng" (auth, logging, tracing, metrics, config, secret, health) và ước lượng công tự xây. Con số đó thường quyết định nhanh hơn mọi benchmark.`,
  follow: [
    'Bạn làm DI trong Ktor thế nào khi service lớn dần?',
    'Gọi JDBC blocking trong Ktor cần lưu ý gì về dispatcher?',
    'Spring Boot với coroutine (suspend controller) khác Ktor ở điểm nào khi chạy?'
  ],
  tags: ['Kotlin', 'Ktor', 'Spring Boot', 'architecture']
},
{
  id: 'kotlin-028',
  topic: 'kotlin',
  level: 'mid',
  q: 'Bạn viết test cho backend Kotlin có suspend function và gọi service khác. Dùng MockK, runTest (kotlinx-coroutines-test) và test trong Spring Boot thế nào, và những lỗi nào làm test chậm hoặc flaky?',
  a: `**Tóm tắt:** Test backend Kotlin dùng ba công cụ chính: **MockK** (thư viện mock viết cho Kotlin: hiểu {{suspend}}, final class, object, extension), **runTest** của kotlinx-coroutines-test (chạy coroutine trong test với **thời gian ảo**, delay 10 giây xong ngay lập tức), và **springmockk** ({{@MockkBean}}) khi cần mock bean trong Spring context. Lỗi hay gặp: dùng {{runBlocking}} với delay thật (chậm), dùng Mockito với class Kotlin final (không mock được), và để coroutine chạy ngoài scope của test (flaky).

### Vì sao Mockito "khó chịu" với Kotlin
- Class Kotlin mặc định **final** → Mockito cổ điển không tạo subclass để mock (cần mockito-inline, nay là mặc định từ Mockito 5, nhưng vẫn vướng nhiều chỗ).
- {{suspend fun}} có tham số ẩn {{Continuation}} → stub bằng Mockito rất rườm rà.
- Cú pháp {{when}} trùng từ khoá Kotlin.
MockK giải quyết bằng DSL: {{every}}/{{coEvery}} để stub, {{verify}}/{{coVerify}} để kiểm tra.

### MockK + runTest
~~~kotlin
class OrderServiceTest {
    private val payment = mockk<PaymentClient>()          // mock "nghiêm": gọi chưa stub -> lỗi
    private val repo = mockk<OrderRepository>(relaxUnitFun = true)
    private val service = OrderService(payment, repo)

    @Test
    fun placesOrderAndRetriesOnce() = runTest {            // thời gian ảo
        coEvery { payment.charge(any()) } throws IOException() andThen ChargeResult.OK
        val order = service.place(OrderRequest(amount = 100_000))
        assertEquals(OrderStatus.PAID, order.status)
        coVerify(exactly = 2) { payment.charge(any()) }    // 1 lần lỗi + 1 lần retry
        // service dùng delay(2_000) trước khi retry -> runTest bỏ qua, test chạy trong mili giây
    }
}
~~~
- {{coEvery}}/{{coVerify}} dành cho suspend function; {{every}}/{{verify}} cho hàm thường.
- {{slot<T>()}} + {{capture}} để lấy đối số thực tế và assert chi tiết.
- {{mockkObject(SomeObject)}} cho {{object}} singleton, nhớ {{unmockkAll()}} sau test.

### Điều khiển coroutine trong test
- runTest dùng **TestDispatcher**: mọi {{delay}} được "tua" ngay; {{advanceUntilIdle()}} chạy hết việc đang chờ.
- Code tự tạo dispatcher cứng ({{Dispatchers.IO}}) sẽ **thoát khỏi** thời gian ảo → **inject dispatcher** qua constructor để test truyền {{StandardTestDispatcher(testScheduler)}}.
- Coroutine phóng bằng {{GlobalScope}} không được test chờ → flaky; dùng scope được inject.

### Trong Spring Boot
- {{@WebMvcTest}}/{{@WebFluxTest}} + {{@MockkBean}} (thư viện springmockk) thay cho {{@MockBean}}/{{@MockitoBean}} khi muốn dùng MockK.
- Controller {{suspend}} test bằng {{WebTestClient}} hoặc MockMvc (Spring hỗ trợ suspend controller trên cả MVC).
- Repository test với {{@DataJpaTest}} + Testcontainers như với Java.

### Ví dụ đời thực
Một service Kotlin có 400 test, chạy 7 phút. Nguyên nhân: test dùng {{runBlocking}} với logic retry có {{delay(1000..5000)}} thật, và 30% test dùng Mockito + {{open}} class chỉ để mock được. Chuyển sang runTest, inject dispatcher, dùng MockK, bỏ {{open}} khỏi class nghiệp vụ: suite còn 1 phút 40 giây; 6 test flaky do {{GlobalScope}} được sửa bằng scope inject.

### Pitfall
- Mock quá nhiều với {{relaxed = true}} → test xanh dù code gọi sai (mock trả giá trị mặc định cho mọi thứ).
- Quên {{unmockkAll()}}/{{clearMocks}} → mock rò giữa các test.
- Dispatcher cứng trong code → không kiểm soát được thời gian.
- Dùng {{Thread.sleep}} trong test coroutine.

### Trả lời mẫu khi phỏng vấn
"Với backend Kotlin tôi dùng MockK thay Mockito, vì class Kotlin mặc định final và suspend function có tham số Continuation ẩn, Mockito xử lý rất rườm rà. MockK có every và coEvery để stub, verify và coVerify để kiểm tra, slot để bắt đối số, và mock được cả object. Code coroutine tôi test bằng runTest của kotlinx-coroutines-test: nó chạy với thời gian ảo nên một delay vài giây trong logic retry xong ngay. Muốn vậy, code phải inject dispatcher và scope thay vì dùng Dispatchers.IO cứng hay GlobalScope, nếu không coroutine thoát khỏi thời gian ảo và test vừa chậm vừa flaky. Trong Spring, tôi dùng @MockkBean của springmockk với test slice, và Testcontainers cho repository như với Java. Ở một service trước, chuyển sang runTest và MockK đưa suite từ 7 phút xuống dưới 2 phút."

> Senior tip: đặt quy ước "mọi class dùng coroutine nhận CoroutineDispatcher hoặc CoroutineScope qua constructor". Quy ước nhỏ này quyết định code coroutine có test được một cách xác định hay không.`,
  follow: [
    'Mock relaxed khác mock nghiêm thế nào, khi nào dùng relaxed?',
    'StandardTestDispatcher và UnconfinedTestDispatcher khác nhau ra sao?',
    'Bạn test một Flow phát nhiều giá trị theo thời gian thế nào?'
  ],
  tags: ['Kotlin', 'testing', 'MockK', 'coroutines', 'runTest']
},
{
  id: 'kotlin-029',
  topic: 'kotlin',
  level: 'senior',
  q: 'Bạn muốn tránh lỗi truyền nhầm id (userId vào chỗ orderId) trong code Kotlin bằng value class. Cơ chế của @JvmInline value class là gì, và khi đưa nó qua JSON (Jackson / kotlinx.serialization), Spring và JPA cần lưu ý gì?',
  a: `**Tóm tắt:** {{@JvmInline value class OrderId(val value: Long)}} tạo một **kiểu riêng** ở thời điểm biên dịch — compiler báo lỗi nếu truyền {{UserId}} vào chỗ cần {{OrderId}} — nhưng ở runtime phần lớn trường hợp được **"mở hộp"** thành {{long}} thuần, gần như không tốn thêm bộ nhớ. Đổi lại, tên hàm nhận value class bị **mangle** (đổi tên trong bytecode) và hành vi qua reflection khác thường, nên các framework dựa trên reflection (Jackson, Hibernate, Spring binding) cần cấu hình hoặc chỉ dùng value class **trong tầng domain**, chuyển sang kiểu nguyên thuỷ ở ranh giới.

### Vấn đề value class giải quyết
~~~kotlin
fun refund(userId: Long, orderId: Long, amount: Long)   // ba tham số cùng kiểu Long
refund(order.id, user.id, 50_000)                         // đảo chỗ, compiler im lặng -> hoàn tiền sai đơn
~~~
Với value class:
~~~kotlin
@JvmInline value class UserId(val value: Long)
@JvmInline value class OrderId(val value: Long)
@JvmInline value class Vnd(val amount: Long) {
    init { require(amount >= 0) { "Số tiền không âm" } }  // kiểm tra bất biến ngay khi tạo
}
fun refund(userId: UserId, orderId: OrderId, amount: Vnd)
refund(order.id, user.id, Vnd(50_000))                    // LỖI BIÊN DỊCH: type mismatch
~~~

### Cơ chế ở runtime
- Khi dùng đúng kiểu tĩnh, compiler thay {{OrderId}} bằng {{long}} → không cấp phát object.
- Bị **box** (tạo object thật) khi dùng như kiểu chung: đưa vào {{List<OrderId>}}, kiểu nullable {{OrderId?}}, generic, hoặc qua interface.
- Hàm nhận value class có tên bị mangle (ví dụ {{refund-abc123}}) để tránh trùng chữ ký sau khi mở hộp → **Java gọi không được trực tiếp**; dùng {{@JvmName}} nếu cần gọi từ Java.

### Qua JSON
| Thư viện | Tình trạng |
|---|---|
| kotlinx.serialization | Hỗ trợ tốt: đánh dấu {{@Serializable}} cho value class, serialize thành giá trị bên trong (ví dụ số 42) |
| Jackson + jackson-module-kotlin | Các phiên bản gần đây hỗ trợ value class nhưng còn giới hạn (nhất là làm key của Map, nullable, generic); kiểm tra kỹ với phiên bản bạn dùng hoặc viết serializer riêng |
Spring Boot dùng Jackson mặc định; có thể chuyển sang kotlinx.serialization khi thư viện có trên classpath (Spring có HttpMessageConverter cho nó), nhưng phải thống nhất cả service.

### Với Spring và JPA
- **Path variable / request param**: Spring cần biết chuyển chuỗi "42" thành {{OrderId}} → đăng ký {{Converter<String, OrderId>}}, hoặc nhận {{Long}} ở controller rồi bọc lại.
- **JPA/Hibernate**: hỗ trợ value class làm cột hoặc id rất hạn chế do name mangling và reflection; cách an toàn là entity giữ {{Long}}, domain/service dùng {{OrderId}}, chuyển đổi ở repository hoặc mapper. Một số team dùng {{AttributeConverter}} cho cột thường (không dùng cho id).
- Nguyên tắc: **value class mạnh nhất ở tầng domain và API nội bộ**, ranh giới framework dùng kiểu nguyên thuỷ.

### Ví dụ đời thực
Một sự cố hoàn tiền: hàm {{refund(userId: Long, orderId: Long)}} bị gọi đảo tham số trong một lần refactor, 37 khoản hoàn tiền vào sai đơn trước khi đối soát phát hiện. Sau đó team đưa value class cho các id và số tiền trong module thanh toán; trong lúc chuyển đổi, compiler phát hiện thêm **4 chỗ** truyền nhầm kiểu đã tồn tại từ trước (may mắn chưa gây sự cố vì giá trị trùng hợp). JPA entity vẫn giữ Long; mapper chuyển đổi ở repository. Chi phí hiệu năng đo được không đáng kể.

### Pitfall
- Đưa value class thẳng vào entity JPA làm id → lỗi khó hiểu lúc khởi động hoặc truy vấn.
- Quên converter cho path variable → lỗi 400/500 không rõ ràng.
- Dùng value class trong collection lớn ở đường nóng → boxing, mất lợi thế hiệu năng.
- Gọi từ Java mà không có {{@JvmName}} → không thấy hàm.

### Trả lời mẫu khi phỏng vấn
"Value class với @JvmInline tạo một kiểu riêng ở thời điểm biên dịch, nên truyền UserId vào chỗ cần OrderId là lỗi biên dịch, nhưng ở runtime phần lớn trường hợp nó được mở hộp thành long thuần nên gần như không tốn thêm bộ nhớ. Nó vẫn bị box khi đưa vào collection, generic hay kiểu nullable. Ngoài ra tên hàm nhận value class bị mangle trong bytecode, nên Java không gọi trực tiếp được, và các framework dựa trên reflection cần chú ý. kotlinx.serialization hỗ trợ tốt; Jackson với module Kotlin hỗ trợ nhưng còn giới hạn, phải kiểm tra theo phiên bản. Với Spring, tôi đăng ký Converter cho path variable. Với JPA, tôi giữ entity dùng Long và chỉ dùng value class ở tầng domain, chuyển đổi trong mapper. Tôi từng thấy một lần đảo tham số userId và orderId gây hoàn tiền sai đơn; value class chặn được cả loại lỗi đó ngay lúc biên dịch."

> Senior tip: bắt đầu value class từ **các hàm có nhiều tham số cùng kiểu nguyên thuỷ trong luồng tiền** (id, số tiền, đơn vị tiền tệ). Đó là nơi lợi ích lớn nhất và chi phí chuyển đổi nhỏ nhất.`,
  follow: [
    'Khi nào value class bị boxing, và điều đó ảnh hưởng hiệu năng ra sao?',
    'Value class khác typealias thế nào?',
    'Bạn mô hình số tiền kèm đơn vị tiền tệ thì dùng value class hay data class?'
  ],
  tags: ['Kotlin', 'value class', 'type safety', 'Jackson', 'JPA']
},
);
