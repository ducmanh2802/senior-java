/*
 * Glossary (window.GLOSSARY): hard terms are auto-linked inside every .md block; click opens a modal (js/core/glossary.js).
 * { id: "idempotency-key",                 // kebab-case, unique across all glossary-*.js
 *   term: "Idempotency key",               // display name
 *   aliases: ["idempotency key", "idempotency-key"],   // lowercase phrases matched in text (2+ chars, longest wins)
 *   short: "1 câu giải thích dễ hiểu",       // tooltip / first line of the modal
 *   body: `markup (AGENTS.md mục 5): ### Ví dụ đời thường, ### Cơ chế, ~~~text sơ đồ ASCII ~~~, ### Khi nào dùng, ### Hay nhầm với`,
 *   refs: [{ type: "video"|"doc"|"article", title, url, note? }],   // 1-3, link THẬT, kiểm tra bằng node scripts/check-links.mjs
 *   related: ["retry", "payment-intent"] } // ids of other glossary entries
 */
(window.GLOSSARY = window.GLOSSARY || []).push(
  {
    id: 'happens-before',
    term: 'Happens-before',
    aliases: ['happens-before', 'happens before', 'quan hệ happens-before'],
    short: 'Quy tắc của Java Memory Model: nếu A happens-before B thì B chắc chắn thấy mọi thứ A đã ghi, ví dụ ghi biến volatile rồi luồng khác đọc biến đó.',
    body: `### Ví dụ đời thường
Bạn ghi một khoản nợ vào sổ rồi đưa sổ cho đồng nghiệp. Chỉ khi việc đưa sổ xảy ra trước việc họ đọc, họ mới thấy khoản nợ. Nếu hai người mỗi người giữ một cuốn sổ riêng thì không ai thấy phần của người kia.

### Cơ chế
Trong Java, happens-before là quan hệ do mô hình bộ nhớ Java (JMM) định nghĩa. Nếu thao tác A happens-before B thì mọi thay đổi bộ nhớ của A đều nhìn thấy được khi B chạy. Các nguồn tạo quan hệ này:
- Thứ tự chương trình trong cùng một luồng.
- Mở khóa monitor happens-before lần khóa lại cùng monitor đó.
- Ghi vào biến volatile happens-before lần đọc biến đó.
- Gọi Thread.start trước khi luồng mới chạy; luồng kết thúc trước khi Thread.join trả về.
- Ghi các trường final trong constructor, nếu không rò rỉ tham chiếu this.

Nếu không có quan hệ này, JIT và CPU được phép đổi thứ tự hoặc dùng bản sao trong cache, nên luồng khác có thể thấy giá trị cũ dù thời gian thực tế đã ghi trước.

~~~text
Luồng A                    Bộ nhớ chung              Luồng B
  x = 42
  flag = true (volatile) ---> [flag=true, x=42]
                              [flag=true, x=42] <--- đọc flag == true
                                                        đọc x ==> 42
~~~

### Khi nào dùng
Dùng làm công cụ suy luận khi thiết kế code đa luồng: chứng minh một luồng chỉ đọc dữ liệu sau khi luồng khác đã công bố xong. Đây là cơ sở để hiểu volatile, synchronized, Thread.join, executor và các collection concurrent.

### Hay nhầm với
Không phải "chạy trước theo đồng hồ thực". Hai thao tác có thể xảy ra theo thứ tự thời gian nhưng không có happens-before, khi đó vẫn có thể thấy dữ liệu cũ. Cũng khác **race condition**: happens-before nói về khả năng nhìn thấy dữ liệu, còn race condition nói về kết quả sai do xen kẽ thao tác.`,
    related: ['volatile', 'race-condition', 'deadlock'],
    refs: [{ type: 'doc', title: 'JLS 17.4 — Memory Model', url: 'https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html' }],
  },
  {
    id: 'volatile',
    term: 'Volatile',
    aliases: ['volatile', 'biến volatile', 'từ khóa volatile'],
    short: 'Từ khóa bảo đảm giá trị một luồng ghi vào biến được luồng khác thấy ngay và không bị đổi thứ tự, ví dụ cờ dừng vòng lặp.',
    body: `### Ví dụ đời thường
Một bảng thông báo treo ở hành lang công ty. Ai muốn biết tin mới phải ra đọc bảng, không được ghi nhớ riêng trong đầu rồi đoán. Khi có tin mới, người phụ trách cập nhật bảng ngay để người khác thấy.

### Cơ chế
Khi một trường được đánh dấu volatile:
- Mỗi lần đọc thấy được lần ghi mới nhất vào biến đó, không đọc một bản sao cũ mà JIT đã giữ trong register hay cache. (Đây là mô hình đơn giản hóa; về mặt chính xác, JMM định nghĩa bằng quan hệ happens-before.)
- Mỗi lần ghi, giá trị được đẩy ra bộ nhớ chung trước khi thao tác sau chạy.
- Trình biên dịch và CPU không được đổi thứ tự các truy cập volatile với các truy cập bộ nhớ xung quanh theo những hướng nguy hiểm.
- Ghi volatile happens-before lần đọc volatile cùng biến.

Volatile không tạo khóa. Hai luồng vẫn có thể cùng đọc rồi cùng ghi, nên phép tăng count++ vẫn sai vì gồm ba bước đọc, cộng, ghi.

~~~text
Luồng A                        Luồng B
  running = true                 while (running) { ... }
  ... làm việc ...                 |
  running = false  -------------> thoát vòng lặp
  (ghi xuyên bộ nhớ)              (đọc lại từ bộ nhớ)
~~~

### Khi nào dùng
Dùng cho cờ hiệu đơn giản: cờ dừng, cờ trạng thái đã khởi tạo, biến cấu hình ít ghi nhiều đọc, hoặc công bố một tham chiếu bất biến. Với phép đếm hoặc cập nhật phức tạp, dùng biến atomic hoặc khóa.

### Hay nhầm với
**Synchronized** vừa bảo đảm nhìn thấy dữ liệu vừa loại trừ lẫn nhau, còn volatile chỉ bảo đảm nhìn thấy dữ liệu. **AtomicInteger** dùng phép so sánh và đổi nguyên tử nên cộng trừ an toàn, còn volatile thì không.`,
    related: ['happens-before', 'cas', 'race-condition'],
    refs: [{ type: 'doc', title: 'JLS 8.3.1.4 — volatile Fields', url: 'https://docs.oracle.com/javase/specs/jls/se21/html/jls-8.html' }],
  },
  {
    id: 'cas',
    term: 'CAS (compare-and-swap)',
    aliases: ['cas', 'compare-and-swap', 'compare and swap', 'compare-and-set'],
    short: 'Lệnh nguyên tử của CPU: chỉ ghi giá trị mới nếu ô nhớ vẫn bằng giá trị đã đọc, nền tảng của AtomicInteger.',
    body: `### Ví dụ đời thường
Bạn muốn đổi chỗ ngồi từ ghế A sang ghế B. Lễ tân kiểm tra: nếu ghế của bạn vẫn đang là A thì đổi sang B, còn nếu ai đó đã đổi mất thì báo thất bại để bạn làm lại. Không cần khóa cả quầy.

### Cơ chế
CAS nhận ba giá trị: địa chỉ ô nhớ, giá trị mong đợi (expected) và giá trị mới. CPU thực hiện trong một lệnh nguyên tử: nếu ô nhớ đang bằng expected thì ghi giá trị mới và trả về thành công, ngược lại không ghi và trả về thất bại. Code thường lặp:
- Đọc giá trị hiện tại.
- Tính giá trị mới.
- Gọi CAS; nếu thất bại thì đọc lại và thử tiếp.

Vì không giữ khóa, nhiều luồng có thể tiến bộ song song. Nhược điểm là nghẽn khi tranh chấp cao và lỗi ABA: giá trị đổi A sang B rồi về A khiến CAS tưởng chưa ai đổi. AtomicStampedReference thêm số phiên bản để chống ABA.

~~~text
Luồng 1: đọc 5 ----> CAS(5 -> 6) ----> thành công
Luồng 2: đọc 5 ----> CAS(5 -> 6) ----> thất bại
                     đọc lại 6 ----> CAS(6 -> 7) ----> thành công
~~~

### Khi nào dùng
Dùng cho bộ đếm, cờ trạng thái, cấu trúc không khóa, hoặc nền tảng của ConcurrentHashMap, AtomicInteger, khóa tự xây. Rất hợp khi thao tác ngắn và tranh chấp vừa phải.

### Hay nhầm với
**Volatile** chỉ bảo đảm nhìn thấy giá trị, không bảo đảm đọc-tính-ghi là một khối. **Khóa** chặn các luồng khác trong khi CAS để chúng thử lại. CAS cũng khác **optimistic locking** ở tầng cơ sở dữ liệu, dù ý tưởng "chỉ ghi nếu chưa đổi" là giống nhau.`,
    related: ['volatile', 'optimistic-locking', 'race-condition'],
    refs: [{ type: 'doc', title: 'AtomicInteger — Java API', url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/atomic/AtomicInteger.html' }],
  },
  {
    id: 'race-condition',
    term: 'Race condition',
    aliases: ['race condition', 'race conditions', 'data race', 'tranh chấp dữ liệu'],
    short: 'Lỗi xảy ra khi kết quả phụ thuộc vào việc các luồng chạy nhanh chậm ra sao.',
    body: `### Ví dụ đời thường
Tài khoản có 100 nghìn. Hai đơn hàng cùng cần trừ 80 nghìn. Hai nhân viên cùng đọc số dư 100, cùng thấy đủ tiền, rồi cùng ghi số dư mới là 20. Kết quả cuối là 20, nhưng thực tế cả hai đơn trị giá 160 nghìn đều được duyệt. Nếu họ xếp hàng làm lần lượt thì đơn thứ hai đã bị từ chối.

### Cơ chế
Race condition xuất hiện khi nhiều luồng cùng truy cập dữ liệu chia sẻ mà không có đồng bộ, và ít nhất một luồng ghi. Ba dạng hay gặp:
- Kiểm tra rồi hành động (check-then-act): kiểm tra tồn kho, sau đó mới trừ.
- Đọc-sửa-ghi (read-modify-write): count++, cộng số dư.
- Hai lần ghi đè: hai luồng cùng ghi, luồng sau ghi đè kết quả luồng trước.

Kết quả phụ thuộc thứ tự xen kẽ do bộ lập lịch quyết định, nên lỗi có thể không tái hiện trên máy dev nhưng nổ trên production tải cao. Cách chữa: khóa đúng phạm vi, dùng biến atomic, dùng lệnh SQL có điều kiện, hoặc thiết kế bất biến và không chia sẻ trạng thái.

~~~text
Số dư = 100
Luồng A: đọc 100 ---> thấy đủ ---> ghi 20
Luồng B:      đọc 100 ---> thấy đủ ---> ghi 20
Kết quả: 20, nhưng hai đơn 80 đều được duyệt
~~~

### Khi nào dùng
Đây là thuật ngữ để nhận diện lỗi, không phải để "dùng". Hãy nghĩ tới nó mỗi khi thấy dữ liệu chia sẻ, bộ đếm, cache, hoặc luồng kiểm tra rồi cập nhật.

### Hay nhầm với
**Data race** là trường hợp hẹp: hai luồng truy cập cùng biến mà không có happens-before, hành vi có thể không xác định. **Deadlock** là các luồng chờ nhau mãi mãi, còn race condition là kết quả sai do thứ tự. **Livelock** là các luồng vẫn chạy nhưng không ai tiến bộ.`,
    related: ['happens-before', 'deadlock', 'cas'],
    refs: [{ type: 'doc', title: 'JLS 17 — Threads and Locks', url: 'https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html' }],
  },
  {
    id: 'deadlock',
    term: 'Deadlock',
    aliases: ['deadlock', 'deadlocks', 'khóa chết', 'bế tắc'],
    short: 'Hai hay nhiều luồng chờ khóa của nhau nên không bao giờ chạy tiếp.',
    body: `### Ví dụ đời thường
Hai người cùng vào một hành lang hẹp. Người A giữ cửa phòng 1 và chờ cửa phòng 2; người B giữ cửa phòng 2 và chờ cửa phòng 1. Cả hai đứng mãi vì không ai chịu nhả cửa mình đang giữ.

### Cơ chế
Deadlock xảy ra khi hội đủ bốn điều kiện: tài nguyên bị giữ độc quyền, một luồng giữ ít nhất một tài nguyên và chờ tài nguyên khác, không có cơ chế cưỡng bức thu hồi, và tồn tại chu trình chờ. Trong Java, nguyên nhân thường là hai khóa monitor hoặc hai hàng trong cơ sở dữ liệu được khóa theo thứ tự ngược nhau. JVM không tự phá vỡ deadlock; luồng chỉ chờ mãi. Ngược lại, cơ sở dữ liệu (PostgreSQL, MySQL InnoDB) tự phát hiện deadlock giữa các transaction và hủy một bên với lỗi deadlock detected, nên ứng dụng cần retry. Công cụ chẩn đoán là jstack, in ra "Found one Java-level deadlock" kèm chuỗi luồng và khóa.

Cách phòng: khóa theo một thứ tự toàn cục, dùng tryLock có timeout rồi nhả và thử lại, gộp về một khóa, hoặc giảm phạm vi khóa. Với cơ sở dữ liệu, giữ transaction ngắn và cập nhật bảng theo thứ tự cố định.

~~~text
Luồng A: giữ Lock1 ---> chờ Lock2
Luồng B: giữ Lock2 ---> chờ Lock1
            ^                    |
            |____________________|
              vòng chờ khép kín
~~~

### Khi nào dùng
Dùng khi phân tích sự cố treo, thread dump, hoặc thiết kế khóa trong hệ nhiều luồng và transaction. Luôn kiểm tra thứ tự khóa giữa các đoạn code.

### Hay nhầm với
**Starvation** là luồng không được cấp tài nguyên vì luồng khác liên tục giành trước, nhưng hệ vẫn tiến bộ. **Livelock** là các luồng vẫn chạy và nhường nhau nhưng không hoàn thành. **Deadlock** thì đứng yên hoàn toàn.`,
    related: ['race-condition', 'pessimistic-locking', 'thread-pool'],
    refs: [{ type: 'doc', title: 'Java Tutorial — Deadlock', url: 'https://docs.oracle.com/javase/tutorial/essential/concurrency/deadlock.html' }],
  },
  {
    id: 'thread-pool',
    term: 'Thread pool',
    aliases: ['thread pool', 'thread pools', 'threadpool', 'executor pool'],
    short: 'Một nhóm luồng được tái sử dụng để chạy nhiều việc thay vì tạo mới liên tục.',
    body: `### Ví dụ đời thường
Quán cà phê có bốn nhân viên pha chế. Khách xếp hàng, nhân viên rảnh thì nhận đơn kế tiếp. Không ai thuê một nhân viên mới cho từng ly rồi đuổi việc ngay, vì như vậy vừa chậm vừa tốn.

### Cơ chế
Thread pool giữ sẵn một số luồng và một hàng đợi công việc. Khi có task:
- Nếu số luồng đang chạy nhỏ hơn corePoolSize, tạo luồng mới.
- Nếu đã đủ core, đưa task vào queue.
- Nếu queue đầy và số luồng nhỏ hơn maxPoolSize, tạo thêm luồng.
- Nếu vẫn đầy, chạy rejection policy (báo lỗi, bỏ task, hoặc chạy ngay trên luồng gọi).

Luồng nhàn rỗi quá keepAliveTime sẽ bị thu hồi. Chọn queue có giới hạn để tránh giữ task mãi trong bộ nhớ. ThreadPoolExecutor cho phép cấu hình đủ các tham số này; Executors chỉ là helper.

~~~text
Task --> [Hàng đợi task]
                 |
     +-----------+-----------+
     |           |           |
  Worker 1    Worker 2    Worker 3  --> xử lý --> kết quả
~~~

### Khi nào dùng
Dùng khi số task lớn hơn số luồng nên và mỗi task ngắn hoặc chặn I/O vừa phải: xử lý request, gửi email, tính toán song song. Đặt tên luồng và metric để dễ debug.

### Hay nhầm với
**Connection pool** giữ kết nối cơ sở dữ liệu, không phải luồng. **Virtual thread** cho phép tạo rất nhiều luồng nhẹ thay vì giới hạn số luồng. **ForkJoinPool** là một dạng pool chia nhỏ task đệ quy, không phù hợp mọi loại task.`,
    related: ['virtual-thread', 'carrier-thread', 'connection-pool'],
    refs: [{ type: 'doc', title: 'ThreadPoolExecutor — Java API', url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ThreadPoolExecutor.html' }],
  },
  {
    id: 'virtual-thread',
    term: 'Virtual thread',
    aliases: ['virtual thread', 'virtual threads', 'luồng ảo', 'virtual-thread'],
    short: 'Luồng rất nhẹ do JVM quản lý, có thể tạo hàng triệu cái cho việc chờ I/O.',
    body: `### Ví dụ đời thường
Một tổng đài chỉ có vài điện thoại thật nhưng rất nhiều khách. Khi khách phải chờ bộ phận khác tra cứu, nhân viên tạm gác máy để người khác dùng đường dây, khi có kết quả thì quay lại. Nhờ vậy một đường dây phục vụ được nhiều khách đang chờ.

### Cơ chế
Virtual thread có từ Java 21 (JEP 444). Không giống luồng nền tảng gắn chặt với luồng hệ điều hành, virtual thread do JVM lập lịch và chạy trên một luồng nền tảng gọi là carrier. Khi virtual thread gọi thao tác chặn như đọc socket, ngủ, chờ lock ReentrantLock, JVM tháo nó khỏi carrier, cất stack vào heap, rồi dùng carrier đó chạy virtual thread khác. Khi dữ liệu sẵn sàng, nó được gắn lại và chạy tiếp.

Nhờ vậy chi phí tạo và chuyển rất thấp, bộ nhớ mỗi luồng nhỏ. Đổi lại, virtual thread không giúp tính toán nhanh hơn: nếu task chỉ dùng CPU thì tạo thêm luồng không ích gì.

~~~text
Carrier (platform thread)
   |
   +--> VT1 chạy --> gặp I/O --> tháo ra, cất stack
   +--> VT2 chạy --> gặp I/O --> tháo ra, cất stack
   +--> VT3 chạy --> I/O xong VT1 --> gắn VT1 vào chạy tiếp
~~~

### Khi nào dùng
Dùng cho ứng dụng nhiều I/O đồng thời: gọi HTTP, truy vấn cơ sở dữ liệu, đọc file, server nhận nhiều kết nối. Không dùng cho vòng lặp tính toán nặng. Đừng gộp virtual thread vào pool; hãy tạo mỗi task một virtual thread.

### Hay nhầm với
**Platform thread** là luồng hệ điều hành thật, đắt và số lượng hạn chế. **Thread pool** tái sử dụng một số luồng cố định. **Reactive** cũng xử lý bất đồng bộ nhưng đổi mô hình lập trình, còn virtual thread giữ code tuần tự dễ đọc.`,
    related: ['carrier-thread', 'pinning', 'thread-pool'],
    refs: [{ type: 'doc', title: 'JEP 444: Virtual Threads', url: 'https://openjdk.org/jeps/444' }],
  },
  {
    id: 'pinning',
    term: 'Pinning',
    aliases: ['pinning', 'thread pinning', 'pinned', 'ghim thread'],
    short: 'Tình huống luồng ảo bị dính chặt vào luồng thật nên không nhường được khi chờ.',
    body: `### Ví dụ đời thường
Nhân viên tổng đài đang giữ máy của khách nhưng lại bị yêu cầu đứng canh một căn phòng khóa. Trong lúc canh, anh ta không thể nhận cuộc gọi khác dù đường dây đang rảnh, vì đã bị ghim vào chỗ đó.

### Cơ chế
Virtual thread thường được tháo khỏi carrier khi chặn, nhưng có trường hợp JVM không tháo được:
- Đang giữ monitor bằng từ khóa synchronized (trên Java 21).
- Đang chạy trong khung native hoặc lời gọi native.
- Một số thao tác đặc biệt như Object.wait khi đang giữ monitor.

Khi bị pin, carrier bị giữ cho tới khi virtual thread rảnh. Nếu nhiều virtual thread bị pin và cùng chờ I/O, số carrier cạn dần, throughput tụt dù có tạo thêm bao nhiêu virtual thread. Trên JDK 24, JEP 491 sửa phần lớn trường hợp synchronized gây pin, nhưng code cũ vẫn cần kiểm tra.

Cách phát hiện: chạy với -Djdk.tracePinnedThreads=full để in stack khi pin. Cách sửa: thay synchronized bằng ReentrantLock trong đoạn có thể chặn, tránh giữ khóa khi gọi I/O.

~~~text
Carrier 1 --- VT A (giữ synchronized) --- chờ I/O
               ^ bị pin, carrier không chạy VT khác
Carrier 2 --- VT B --- chờ I/O ---> tháo, chạy VT C
~~~

### Khi nào dùng
Thuật ngữ dùng khi điều tra virtual thread chạy chậm bất thường, khi migrate code dùng synchronized sang virtual thread, hoặc khi đọc JFR và thread dump.

### Hay nhầm với
**Blocking** chỉ là việc phải chờ; virtual thread vẫn xử lý tốt nếu được tháo khỏi carrier. **Starvation** là thiếu tài nguyên nói chung. **Pinning** là nguyên nhân cụ thể khiến việc tháo không xảy ra.`,
    related: ['virtual-thread', 'carrier-thread', 'deadlock'],
    refs: [{ type: 'doc', title: 'JEP 444: Virtual Threads', url: 'https://openjdk.org/jeps/444' }, { type: 'doc', title: 'JEP 491: Synchronize Virtual Threads without Pinning', url: 'https://openjdk.org/jeps/491' }],
  },
  {
    id: 'carrier-thread',
    term: 'Carrier thread',
    aliases: ['carrier thread', 'carrier threads', 'carrier'],
    short: 'Luồng thật của hệ điều hành được JVM dùng để chạy các luồng ảo.',
    body: `### Ví dụ đời thường
Xe buýt là phương tiện thật, hành khách là người cần đi. Một xe có thể chở nhiều khách theo lượt; khách xuống chờ ở trạm thì xe đi đón khách khác. Xe buýt chính là phương tiện hữu hạn, còn khách thì rất đông.

### Cơ chế
Carrier thread là một platform thread do JVM tạo, thường thuộc ForkJoinPool mặc định của bộ lập lịch virtual thread. Số carrier mặc định bằng số lõi CPU khả dụng, có thể chỉnh bằng thuộc tính hệ thống jdk.virtualThreadScheduler.parallelism. Khi một virtual thread chạy, nó được gắn vào một carrier. Khi chặn và được tháo, carrier rảnh để chạy virtual thread khác. Stack của virtual thread được lưu ở heap, không chiếm stack hệ điều hành.

Vì carrier là luồng thật, các giới hạn của luồng thật vẫn áp lên nó: nếu carrier bị pin hoặc chạy code CPU nặng quá lâu, các virtual thread khác phải chờ.

~~~text
Bộ lập lịch virtual thread
   |
   +-- Carrier 1 --+-- VT A
   |               +-- VT B (khi A chờ)
   +-- Carrier 2 --+-- VT C
   +-- Carrier 3 --+-- VT D
~~~

### Khi nào dùng
Dùng khi cần hiểu hoặc tinh chỉnh hiệu năng virtual thread: đọc thread dump, chọn số carrier, phát hiện carrier bị chiếm. Thường không cần chỉnh nếu ứng dụng chủ yếu chờ I/O.

### Hay nhầm với
**Platform thread** là tên chung cho luồng hệ điều hành, carrier là platform thread đóng vai trò chạy virtual thread. **Worker thread** trong thread pool cũng là platform thread nhưng thuộc pool do ứng dụng tạo, không phải bộ lập lịch virtual thread.`,
    related: ['virtual-thread', 'pinning', 'thread-pool'],
    refs: [{ type: 'doc', title: 'JEP 444: Virtual Threads', url: 'https://openjdk.org/jeps/444' }],
  },
  {
    id: 'garbage-collector',
    term: 'Garbage collector',
    aliases: ['garbage collector', 'garbage collection', 'gc', 'bộ thu gom rác', 'thu gom rác'],
    short: 'Bộ phận tự tìm và thu hồi vùng nhớ của các đối tượng không còn ai dùng.',
    body: `### Ví dụ đời thường
Một tòa nhà có người dọn vệ sinh định kỳ. Họ đi kiểm tra phòng nào không còn người sử dụng, không còn đồ đạc được ai tham chiếu, thì dọn trống để người mới vào. Không ai phải tự tay xóa từng phòng.

### Cơ chế
Bộ thu gom rác bắt đầu từ các GC root: biến local trên stack, biến static, tham chiếu từ JNI, tham chiếu trong thread đang chạy. Nó duyệt theo đồ thị tham chiếu để đánh dấu đối tượng còn sống, phần còn lại là rác. Sau đó tùy thuật toán:
- Mark-sweep: đánh dấu rồi xóa, có thể để lại lỗ hổng.
- Mark-compact: đánh dấu rồi dồn đối tượng sống lại gần nhau.
- Copying: chép đối tượng sống sang vùng khác rồi xóa cả vùng cũ.

HotSpot dùng cách phân thế hệ. G1 là mặc định từ Java 9, chia heap thành vùng nhỏ và ưu tiên thu vùng nhiều rác. ZGC và Shenandoah nhắm tới pause rất ngắn. GC không quyết định đối tượng nào "hết hạn" theo thời gian, chỉ dựa vào khả năng truy cập được.

~~~text
GC root (stack, static)
   |
   +--> A --> B --> C        (còn sống)
   |
   +--> D                    (còn sống)
        E --> F              (E, F không có root: rác)
~~~

### Khi nào dùng
Dùng khi chọn và tinh chỉnh GC, đọc GC log, điều tra ứng dụng chậm do pause, hoặc tìm memory leak do giữ tham chiếu không cần thiết.

### Hay nhầm với
**Reference counting** đếm số tham chiếu và giải phóng khi về 0, không xử lý được chu trình. **Finalizer** là cơ chế chạy code trước khi thu hồi, không đảm bảo thời điểm, và đã bị đánh dấu deprecated để gỡ bỏ (JEP 421, Java 18); dùng try-with-resources hoặc Cleaner thay thế. **Metaspace** chứa metadata lớp, không phải nơi chứa object thông thường.`,
    related: ['stop-the-world', 'heap', 'generations', 'metaspace'],
    refs: [{ type: 'doc', title: 'Java Garbage Collection Tuning Guide', url: 'https://docs.oracle.com/en/java/javase/21/gctuning/' }],
  },
  {
    id: 'stop-the-world',
    term: 'Stop-the-world pause',
    aliases: ['stop-the-world', 'stop the world', 'stw', 'dừng toàn bộ'],
    short: 'Khoảng thời gian JVM tạm dừng mọi luồng ứng dụng để làm một việc nội bộ.',
    body: `### Ví dụ đời thường
Siêu thị tạm đóng cửa vài phút để kiểm kê hàng. Trong lúc đó không khách nào mua được, dù việc kiểm kê chỉ diễn ra ở kho. Thời gian đóng cửa càng dài thì càng nhiều khách phải chờ ngoài.

### Cơ chế
Stop-the-world xảy ra khi JVM cần một trạng thái nhất quán của toàn bộ heap hoặc metadata: thu gom rác, một số thao tác deoptimization, nạp lại class (class redefinition khi dùng agent), hoặc in thread dump. (Biased locking từng gây safepoint khi revoke, nhưng đã bị tắt mặc định từ JDK 15 và gỡ bỏ ở JDK 18, nên không còn trên Java 21.) JVM đưa các luồng tới safepoint, nơi chúng có thể dừng an toàn, rồi chờ tất cả vào trạng thái dừng. Chỉ sau đó công việc mới chạy.

GC hiện đại cố gắng giảm pause: G1 có các pause ngắn theo vùng, ZGC và Shenandoah dùng barrier và concurrent marking để phần lớn công việc chạy song song với ứng dụng. Tuy vậy vẫn có những pause nhỏ không tránh khỏi. Pause dài thường do heap quá lớn so với mục tiêu, cấp phát quá nhanh, hoặc GC cũ.

~~~text
Ứng dụng: chạy --> chạy --> [safepoint: dừng] --> chạy tiếp
GC:                          [mark | sweep | compact]
Thời gian:  -----------------|---- pause ----|---------->
~~~

### Khi nào dùng
Dùng khi đọc GC log, chọn mục tiêu độ trễ, hoặc giải thích vì sao p99 tăng vọt dù CPU thấp. Đặt -Xlog:gc để thấy pause.

### Hay nhầm với
**Context switch** là chuyển giữa luồng, rất ngắn và do hệ điều hành. **Pause của GC** là dừng có chủ đích toàn bộ luồng ứng dụng. **Safepoint** là điểm JVM có thể dừng, không phải bản thân khoảng dừng.`,
    related: ['garbage-collector', 'heap', 'virtual-thread'],
    refs: [{ type: 'doc', title: 'Java Garbage Collection Tuning Guide', url: 'https://docs.oracle.com/en/java/javase/21/gctuning/' }],
  },
  {
    id: 'heap',
    term: 'Heap',
    aliases: ['heap', 'java heap', 'heap memory', 'bộ nhớ heap'],
    short: 'Vùng nhớ dùng chung nơi mọi đối tượng Java được cấp phát.',
    body: `### Ví dụ đời thường
Một kho hàng chung của công ty. Ai cần chỗ chứa hàng thì lấy từ kho, khi không dùng nữa thì bộ phận dọn dẹp thu hồi. Kho có hạn, nếu lấy mãi mà không trả thì sẽ đầy.

### Cơ chế
Heap là vùng nhớ được tạo khi JVM khởi động, chia sẻ cho mọi luồng. Đối tượng tạo bằng từ khóa new và mảng nằm trên heap. Kích thước ban đầu và tối đa đặt bằng -Xms và -Xmx. Heap được chia thành các vùng để GC làm việc hiệu quả: young gồm Eden và các Survivor, old chứa đối tượng sống lâu. G1 chia thành nhiều region và gắn nhãn vai trò động.

Mỗi luồng có TLAB (Thread Local Allocation Buffer) để cấp phát nhanh mà không phải tranh chấp. Khi TLAB đầy, luồng lấy thêm vùng mới. Nếu heap đầy và GC không giải phóng đủ, JVM ném OutOfMemoryError: Java heap space. Heap không chứa metadata lớp (nằm ở metaspace) và không chứa stack của luồng.

~~~text
+---------------- Heap (-Xms .. -Xmx) ----------------+
|  Young: Eden | Survivor 0 | Survivor 1 |  Old       |
|  (object mới)                            (sống lâu) |
+-----------------------------------------------------+
        GC dọn young thường xuyên, old khi cần
~~~

### Khi nào dùng
Dùng khi đặt kích thước bộ nhớ, đọc heap dump, tìm memory leak, hoặc chọn GC. Theo dõi heap sau mỗi lần full GC để biết mức sống thật.

### Hay nhầm với
**Stack** là vùng nhớ riêng của từng luồng, chứa biến local và khung gọi hàm. **Metaspace** chứa metadata lớp. **Off-heap** là bộ nhớ native như DirectByteBuffer, không bị GC dọn theo cách thông thường.`,
    related: ['generations', 'garbage-collector', 'metaspace', 'stop-the-world'],
    refs: [{ type: 'doc', title: 'Java Garbage Collection Tuning Guide', url: 'https://docs.oracle.com/en/java/javase/21/gctuning/' }],
  },
  {
    id: 'generations',
    term: 'Young / old generation',
    aliases: ['young generation', 'old generation', 'young gen', 'old gen', 'thế hệ trẻ', 'thế hệ già', 'tenured'],
    short: 'Cách chia heap thành vùng cho đối tượng mới và đối tượng sống lâu.',
    body: `### Ví dụ đời thường
Trong một xưởng, nguyên liệu mới về được để ở khu tạm gần cửa. Món nào dùng xong nhanh thì dọn luôn; món nào còn dùng lâu mới được chuyển vào kho chính. Nhờ vậy không phải lục cả kho mỗi ngày.

### Cơ chế
Heap được chia theo giả thuyết thế hệ: phần lớn đối tượng chết rất sớm. Young generation gồm Eden và hai Survivor. Đối tượng mới sinh ở Eden; khi Eden đầy, một minor GC chép đối tượng sống sang Survivor và tăng tuổi. Sau vài lần sống sót, đối tượng được thăng cấp (promote) sang old generation. Khi old đầy, major hoặc full GC dọn old, thường tốn kém hơn nhiều.

Với G1, các vùng không cố định vai trò; G1 chọn tập region nhiều rác để thu, gọi là mixed GC. Tham số như -XX:NewRatio và -XX:MaxTenuringThreshold điều chỉnh tỉ lệ và ngưỡng tuổi. Nếu đối tượng sống quá lâu hoặc cache lớn, old phình to và pause tăng.

~~~text
new --> Eden --minor GC--> Survivor --đủ tuổi--> Old
          |                   |                   |
        chết                chết              full GC
~~~

### Khi nào dùng
Dùng khi đọc GC log, chỉnh kích thước young, hoặc giải thích vì sao minor GC nhiều mà old vẫn đầy. Ứng dụng tạo nhiều object tạm hưởng lợi từ young đủ lớn.

### Hay nhầm với
**Heap** là toàn bộ vùng nhớ, generation chỉ là cách chia bên trong. **Metaspace** không nằm trong heap và không có khái niệm thế hệ. **TLAB** là vùng cấp phát riêng của luồng, không phải một thế hệ.`,
    related: ['heap', 'garbage-collector', 'stop-the-world'],
    refs: [{ type: 'doc', title: 'Java Garbage Collection Tuning Guide', url: 'https://docs.oracle.com/en/java/javase/21/gctuning/' }],
  },
  {
    id: 'metaspace',
    term: 'Metaspace',
    aliases: ['metaspace', 'meta space', 'permgen', 'permanent generation'],
    short: 'Vùng nhớ native chứa thông tin mô tả các lớp đã được nạp.',
    body: `### Ví dụ đời thường
Một thư viện có kệ riêng để lưu hồ sơ mô tả từng loại sách: tên, tác giả, vị trí. Kệ này không chứa sách thật, chỉ chứa thông tin mô tả. Nếu thư viện nhập quá nhiều loại sách mà không bao giờ thanh lý hồ sơ cũ, kệ sẽ đầy.

### Cơ chế
Từ Java 8, metadata của lớp (tên, method, field, bytecode đã phân tích, constant pool) nằm trong metaspace, một vùng bộ nhớ native thay cho PermGen cũ. Metaspace được cấp phát theo nhu cầu từ bộ nhớ hệ điều hành và mặc định không có giới hạn cứng, nên có thể lớn dần tới khi hết RAM. Đặt -XX:MaxMetaspaceSize để chặn.

Metadata thuộc về một ClassLoader. Khi ClassLoader không còn reachable, các lớp của nó có thể bị dỡ và metaspace được giải phóng. Vì vậy rò rỉ ClassLoader (ví dụ hot deploy lại ứng dụng trên Tomcat mà ClassLoader cũ vẫn bị giữ, hoặc thư viện sinh lớp động liên tục) làm metaspace tăng mãi và cuối cùng ném OutOfMemoryError: Metaspace.

~~~text
ClassLoader A ---> metadata lớp A1, A2, A3  \
ClassLoader B ---> metadata lớp B1, B2       > Metaspace (native)
ClassLoader C ---> metadata lớp C1          /
ClassLoader không còn dùng --> có thể dỡ lớp --> trả nhớ
~~~

### Khi nào dùng
Dùng khi điều tra lỗi OutOfMemoryError liên quan lớp, khi chạy nhiều ứng dụng trên một máy, hoặc khi dùng framework sinh lớp động. Theo dõi bằng jcmd VM.metaspace.

### Hay nhầm với
**Heap** chứa object, không chứa metadata lớp. **PermGen** là vùng cũ đã bị bỏ từ Java 8, không còn tồn tại. **Code cache** chứa mã máy do JIT sinh ra, cũng là native memory nhưng khác mục đích.`,
    related: ['heap', 'garbage-collector', 'jit'],
    refs: [{ type: 'doc', title: 'JEP 122: Remove the Permanent Generation', url: 'https://openjdk.org/jeps/122' }],
  },
  {
    id: 'jit',
    term: 'JIT (just-in-time compiler)',
    aliases: ['jit', 'just-in-time', 'just in time compiler', 'jit compiler'],
    short: 'Bộ dịch trong JVM biến đoạn mã chạy nhiều thành mã máy tối ưu.',
    body: `### Ví dụ đời thường
Một phiên dịch viên mới vào công ty. Ban đầu dịch từng câu khi khách nói. Sau khi nghe một cụm từ lặp đi lặp lại nhiều lần, anh ta ghi sẵn cách dịch tốt nhất vào sổ để lần sau trả lời nhanh hơn.

### Cơ chế
JVM khởi đầu bằng cách diễn giải bytecode (interpreter) để chạy ngay, đồng thời đếm số lần gọi và số vòng lặp. Khi một method hoặc vòng lặp đủ nóng, JIT biên dịch nó thành mã máy. HotSpot dùng biên dịch phân tầng: C1 biên dịch nhanh với tối ưu vừa phải, C2 biên dịch chậm hơn nhưng tối ưu sâu dựa trên dữ liệu thu thập thực tế.

JIT có thể nội tuyến method nhỏ, loại bỏ kiểm tra null, đổi thứ tự lệnh, và deoptimize khi giả định không còn đúng. Nhờ đó mã Java sau khi ấm thường nhanh hơn nhiều. Nhược điểm là thời gian warm-up: vài giây đầu chậm hơn, nên benchmark phải khởi động đủ lâu.

~~~text
bytecode --> Interpreter --> đếm hot --> C1 --> C2
                 ^                        |      |
                 +------ deoptimize <-----+------+
                         (giả định sai)
~~~

### Khi nào dùng
Dùng khi hiểu hiệu năng Java, viết benchmark đúng, đọc JIT compilation log, hoặc điều tra vì sao đoạn code chạy nhanh sau vài phút. Có thể tham khảo AOT cho khởi động nhanh nhưng không thay thế hoàn toàn JIT.

### Hay nhầm với
**Interpreter** chạy bytecode từng lệnh, không sinh mã máy tối ưu. **AOT** biên dịch trước khi chạy, không dựa trên dữ liệu runtime. **GC** quản lý bộ nhớ, không liên quan biên dịch.`,
    related: ['escape-analysis', 'metaspace', 'heap'],
    refs: [{ type: 'doc', title: 'Java Virtual Machine Guide', url: 'https://docs.oracle.com/en/java/javase/21/vm/' }],
  },
  {
    id: 'escape-analysis',
    term: 'Escape analysis',
    aliases: ['escape analysis', 'escape-analysis', 'phân tích escape'],
    short: 'JIT kiểm tra object tạo trong method có bị lộ ra ngoài không; nếu không, có thể bỏ hẳn việc cấp phát nó trên heap.',
    body: `### Ví dụ đời thường
Bạn trộn nước sốt trong một cái bát nhỏ rồi dùng ngay trong bếp. Nếu nước sốt chỉ dùng một lần và không ai mang ra ngoài, bạn không cần đóng gói cẩn thận. Còn nếu phải giao cho khách, bạn buộc phải đóng hộp và dán nhãn.

### Cơ chế
Trước khi tối ưu, JIT xem một đối tượng được tạo trong method có "thoát" ra ngoài không:
- Không thoát: đối tượng chỉ dùng trong method, không trả về, không gán vào field, không truyền cho method khác có thể giữ lại.
- Thoát toàn cục: bị lưu vào field tĩnh hoặc trả về.
- Thoát theo luồng: được truyền cho luồng khác.

Nếu không thoát, JIT có thể tách các field thành biến riêng (scalar replacement), bỏ cấp phát đối tượng, và bỏ khóa không cần thiết (lock elision). HotSpot thường không thực sự đặt object lên stack, nhưng loại bỏ cấp phát đem lại lợi ích tương tự. Phân tích phụ thuộc vào việc nội tuyến method trước, nên code phức tạp có thể làm nó thất bại.

~~~text
Tạo object trong method
        |
        +-- chỉ dùng local ---> scalar replacement (không cấp phát)
        |
        +-- trả về / gán field ---> phải cấp phát trên heap
~~~

### Khi nào dùng
Dùng khi tối ưu vòng lặp nóng tạo nhiều object nhỏ, hoặc giải thích vì sao cùng đoạn code lúc đầu chậm sau nhanh. Đừng dựa vào nó để thiết kế API; hãy viết code rõ ràng trước.

### Hay nhầm với
**JIT** là bộ biên dịch, escape analysis là một phân tích bên trong nó. **GC** dọn object đã cấp phát, còn escape analysis tránh cấp phát ngay từ đầu. **Stack allocation** là cách nói dân gian, không phải lúc nào HotSpot cũng làm đúng nghĩa.`,
    related: ['jit', 'garbage-collector', 'heap'],
    refs: [{ type: 'article', title: 'HotSpot Escape Analysis (OpenJDK Wiki)', url: 'https://wiki.openjdk.org/display/HotSpot/EscapeAnalysis' }],
  },
  {
    id: 'bean',
    term: 'Bean',
    aliases: ['bean', 'beans', 'spring bean', 'spring beans'],
    short: 'Một object do khung Spring tạo, cấu hình và quản lý vòng đời thay cho bạn.',
    body: `### Ví dụ đời thường
Một nhân viên trong công ty không tự mở công ty riêng. Phòng nhân sự tuyển, ký hợp đồng, cấp thẻ và bố trí chỗ ngồi. Khi cần người làm việc, các phòng khác lấy đúng nhân viên đã được chuẩn bị sẵn.

### Cơ chế
Trong Spring, bean là object được container quản lý. Bạn khai báo bean bằng @Component, @Service, @Repository, @Controller hoặc @Bean trong lớp cấu hình. Container đọc khai báo, tạo BeanDefinition, rồi trong quá trình khởi động sẽ:
- Khởi tạo instance.
- Tiêm phụ thuộc.
- Gọi callback như @PostConstruct.
- Bọc proxy nếu cần AOP hoặc transaction.
- Đăng ký để tái sử dụng.

Bean có scope: singleton (mặc định, một instance cho cả container), prototype (mỗi lần lấy là instance mới), request, session, application. Vòng đời kết thúc bằng @PreDestroy khi container đóng. Vì là singleton, bean phải không giữ trạng thái riêng của từng request trong field.

~~~text
Container khởi động
   |-- đọc @Component / @Bean
   |-- tạo instance
   |-- tiêm dependency
   |-- @PostConstruct
   +-> sẵn sàng phục vụ (singleton)
        ...
   +-> @PreDestroy khi đóng
~~~

### Khi nào dùng
Dùng khi làm việc với Spring: service, repository, controller, cấu hình, client gọi dịch vụ ngoài. Hiểu scope và vòng đời giúp tránh lỗi trạng thái chia sẻ và lỗi khởi tạo vòng.

### Hay nhầm với
**POJO** chỉ là object Java bình thường, không được container quản lý. **Component** là annotation đánh dấu để Spring quét, bản thân nó tạo ra bean. **Entity** là object ánh xạ bảng cơ sở dữ liệu, do JPA quản lý chứ không phải Spring container, nên không phải là bean.`,
    related: ['dependency-injection', 'ioc-container', 'proxy'],
    refs: [{ type: 'doc', title: 'Spring Framework — The IoC Container', url: 'https://docs.spring.io/spring-framework/reference/core/beans.html' }],
  },
  {
    id: 'dependency-injection',
    term: 'Dependency injection',
    aliases: ['dependency injection', 'dependency injections', 'tiêm phụ thuộc', 'inject dependencies', 'inject dependency'],
    short: 'Cách đưa các thành phần cần dùng từ bên ngoài vào thay vì tự tạo bên trong.',
    body: `### Ví dụ đời thường
Một đầu bếp không tự trồng rau, nuôi cá rồi chế biến. Nhà cung cấp mang nguyên liệu tới tận bếp theo đơn. Đầu bếp chỉ cần nấu, và có thể đổi nhà cung cấp mà không phải viết lại công thức.

### Cơ chế
Thay vì để class tự gọi new cho các phụ thuộc, ta khai báo chúng ở constructor, setter hoặc field và để container cung cấp. Ba kiểu chính:
- Constructor injection: phụ thuộc bắt buộc, dễ test, class luôn ở trạng thái hợp lệ. Được khuyến nghị.
- Setter injection: phụ thuộc tùy chọn, có thể đổi sau khi tạo.
- Field injection: ngắn gọn nhưng khó test và che giấu phụ thuộc, không nên dùng trong code mới.

Spring tìm bean khớp kiểu, nếu có nhiều thì dùng @Qualifier hoặc @Primary. Ưu điểm là giảm gắn kết, dễ thay implementation khi test, và tập trung cấu hình một chỗ. Nhược điểm là lỗi thiếu bean chỉ lộ lúc khởi động, và lạm dụng có thể tạo đồ thị phụ thuộc rối.

~~~text
Không DI:  OrderService --new--> PaymentClient
Có DI:     Container --tạo--> PaymentClient
               |
               +--tiêm--> OrderService
OrderService chỉ biết interface PaymentClient
~~~

### Khi nào dùng
Dùng khi cần tách business logic khỏi hạ tầng, thay thế client thật bằng fake trong test, hoặc cấu hình theo môi trường. Constructor injection là lựa chọn mặc định.

### Hay nhầm với
**IoC** là nguyên lý rộng hơn: quyền điều khiển luồng được đảo cho framework. DI là một cách hiện thực hóa IoC. **Service locator** cũng lấy phụ thuộc nhưng giấu bên trong code, khó thấy và khó test hơn.`,
    related: ['ioc-container', 'bean', 'proxy'],
    refs: [{ type: 'doc', title: 'Spring — Dependency Injection', url: 'https://docs.spring.io/spring-framework/reference/core/beans/dependencies/factory-collaborators.html' }],
  },
  {
    id: 'ioc-container',
    term: 'IoC container',
    aliases: ['ioc', 'ioc container', 'inversion of control', 'đảo ngược điều khiển'],
    short: 'Bộ điều phối tạo object và gọi code của bạn theo cấu hình, thay vì bạn tự gọi.',
    body: `### Ví dụ đời thường
Một nhà hàng tự động: khách chọn món trên màn hình, hệ thống chuyển đơn tới bếp, bếp nấu, rồi hệ thống báo khách. Khách không tự vào bếp, không tự gọi từng đầu bếp. Quyền điều phối nằm ở hệ thống.

### Cơ chế
IoC đảo ngược chiều điều khiển: thay vì code của bạn chủ động tạo và gọi mọi thứ, framework gọi code của bạn tại thời điểm thích hợp. Spring ApplicationContext là một IoC container. Nó đọc cấu hình, tạo BeanDefinition, khởi tạo singleton, tiêm phụ thuộc, chạy BeanPostProcessor, công bố event, rồi giữ các bean sẵn sàng.

Container còn quản lý vòng đời, scope, lazy initialization, và phối hợp các module như AOP, transaction, MVC. Nhờ đó bạn tập trung vào logic, còn việc lắp ráp do container lo. Đổi lại, lỗi cấu hình đôi khi khó truy vì hành vi nằm trong framework.

~~~text
Cấu hình (@Component, @Bean)
        |
        v
+---------------- ApplicationContext ----------------+
|  BeanFactory -> tạo bean -> tiêm DI -> proxy AOP   |
|  quản lý vòng đời, scope, event                    |
+----------------------------------------------------+
        |
        v
   Ứng dụng nhận bean đã sẵn sàng
~~~

### Khi nào dùng
Dùng khi xây ứng dụng Spring hoặc framework tương tự, khi cần lắp ráp nhiều thành phần theo cấu hình, hoặc khi muốn thay implementation theo môi trường mà không sửa code nghiệp vụ.

### Hay nhầm với
**DI** là kỹ thuật cung cấp phụ thuộc, là một phần của container. **Factory** chỉ tạo object theo yêu cầu, không quản lý toàn bộ vòng đời và mạng phụ thuộc. **Service locator** là một registry để lấy object, nhưng code vẫn chủ động gọi nó.`,
    related: ['dependency-injection', 'bean', 'proxy'],
    refs: [{ type: 'doc', title: 'Spring Framework — The IoC Container', url: 'https://docs.spring.io/spring-framework/reference/core/beans.html' }],
  },
  {
    id: 'proxy',
    term: 'Proxy (JDK / CGLIB)',
    aliases: ['proxy', 'proxies', 'jdk dynamic proxy', 'dynamic proxy', 'cglib', 'cglib proxy'],
    short: 'Lớp bọc đứng giữa người gọi và object thật để chèn thêm xử lý.',
    body: `### Ví dụ đời thường
Công ty có lễ tân nhận cuộc gọi thay giám đốc. Người gọi tưởng đang nói chuyện với giám đốc, nhưng lễ tân có thể ghi âm, lọc cuộc gọi, hoặc chuyển tiếp. Giám đốc không cần biết ai đã gọi trước đó.

### Cơ chế
Proxy là object cùng kiểu với object thật, nhận lời gọi rồi chuyển tiếp, thêm logic trước hoặc sau. Trong Java có hai cách phổ biến:
- JDK dynamic proxy: tạo lớp động implements một hoặc nhiều interface, dùng InvocationHandler để xử lý lời gọi. Chỉ áp dụng cho interface.
- CGLIB: sinh lớp con của class thật và ghi đè method. Không dùng được với class final hoặc method final, private.

Spring dùng proxy để hiện thực AOP, @Transactional, @Cacheable, @Async, security. Spring Boot mặc định dùng CGLIB (spring.aop.proxy-target-class=true) kể cả khi class có interface. Với JDK proxy, bean chỉ inject được dưới dạng interface. Với CGLIB, bean là lớp con nên vẫn inject theo class được, nhưng getClass trả về lớp con chứ không phải lớp gốc. Proxy cũng có chi phí nhỏ mỗi lời gọi.

~~~text
Client --> Proxy --> (before) --> Object thật --> (after) --> Client
              |
              +-- ghi log, mở transaction, kiểm tra quyền
~~~

### Khi nào dùng
Dùng khi cần chèn hành vi xuyên suốt mà không sửa object thật: transaction, log, cache, bảo mật, lazy load. Hiểu proxy giúp giải thích self-invocation và lỗi @Transactional không chạy.

### Hay nhầm với
**Decorator** cũng bọc object nhưng thường được tạo thủ công và lồng nhiều lớp có chủ đích. **Adapter** đổi interface, không nhất thiết chuyển tiếp cùng kiểu. **AOP** là mô hình lập trình dùng proxy làm phương tiện.`,
    related: ['aop', 'self-invocation', 'transaction-propagation', 'bean'],
    refs: [{ type: 'doc', title: 'Spring AOP — Proxying Mechanisms', url: 'https://docs.spring.io/spring-framework/reference/core/aop/proxying.html' }],
  },
  {
    id: 'aop',
    term: 'AOP (aspect-oriented programming)',
    aliases: ['aop', 'aspect-oriented programming', 'aspect oriented programming', 'aspect', 'aspects'],
    short: 'Cách gom những việc lặp lại như log, bảo mật, transaction ra một chỗ (aspect) rồi áp cho nhiều method, ví dụ @Transactional.',
    body: `### Ví dụ đời thường
Một tòa nhà có quầy bảo vệ chung ở cổng. Mọi người ra vào đều đi qua đó để quẹt thẻ, không phòng nào phải tự lắp máy kiểm soát riêng. Việc kiểm soát được tách ra một chỗ và áp cho nhiều phòng.

### Cơ chế
AOP mô tả các mối quan tâm cắt ngang (cross-cutting concern) bằng aspect. Mỗi aspect gồm:
- Pointcut: biểu thức chọn nơi áp dụng, ví dụ mọi method trong package service.
- Advice: code chạy trước, sau, hoặc bao quanh (before, after, around).
- Join point: điểm cụ thể trong chương trình, thường là lời gọi method.

Spring AOP dựa trên proxy: khi client gọi bean, proxy chạy chuỗi advice rồi mới gọi method thật. Vì vậy chỉ áp dụng cho lời gọi đi qua proxy, không áp cho lời gọi nội bộ. AspectJ thì can thiệp sâu hơn vào bytecode, áp được cả self-invocation nhưng cần weave lúc build hoặc load.

~~~text
Client --> Proxy
             |-- @Before (log, auth)
             |-- @Around bắt đầu
             |     method thật
             |-- @After / @AfterReturning
             v
          kết quả
~~~

### Khi nào dùng
Dùng cho logging, transaction, caching, metrics, kiểm tra quyền, retry. Rất hợp khi cùng một hành vi lặp ở nhiều class và không muốn rải code khắp nơi.

### Hay nhầm với
**Filter** và **interceptor** chặn ở tầng HTTP, không phải mọi lời gọi method. **Decorator** là mẫu thiết kế bọc thủ công. **Middleware** thường nằm ở tầng hạ tầng hoặc message, không can thiệp method Java.`,
    related: ['proxy', 'self-invocation', 'transaction-propagation'],
    refs: [{ type: 'doc', title: 'Spring Framework — Aspect Oriented Programming', url: 'https://docs.spring.io/spring-framework/reference/core/aop.html' }],
  },
  {
    id: 'self-invocation',
    term: 'Self-invocation',
    aliases: ['self-invocation', 'self invocation', 'self-invoking', 'tự gọi'],
    short: 'Gọi method của chính mình bên trong class nên lớp bọc bên ngoài bị bỏ qua.',
    body: `### Ví dụ đời thường
Bạn muốn chuyển một yêu cầu qua lễ tân để được ghi nhận, nhưng bạn tự đi thẳng vào phòng làm việc và tự xử lý. Việc ghi nhận ở quầy lễ tân đã bị bỏ qua vì bạn không đi qua đó.

### Cơ chế
Khi Spring tạo bean có @Transactional hoặc @Cacheable, nó inject một proxy. Client bên ngoài gọi bean sẽ đi qua proxy, proxy mở transaction rồi mới gọi method thật. Nhưng bên trong method thật, lời gọi this.otherMethod() dùng tham chiếu this, không đi qua proxy. Vì vậy annotation trên otherMethod không có tác dụng.

Ví dụ: method A có @Transactional gọi method B cũng có @Transactional. Nếu B là public và gọi bằng this.B(), transaction của A vẫn đang mở, nhưng cấu hình riêng của B (REQUIRES_NEW, readOnly) không được áp. Với private method cũng không được proxy.

Cách sửa: tách B sang bean khác, inject chính proxy của mình (self-injection), dùng ApplicationContext, hoặc chuyển sang AspectJ. Cách sạch nhất thường là tách trách nhiệm sang service khác.

~~~text
Client --> [Proxy] --> A() --> this.B()
                         |        |
                         |        +-- không qua proxy
                         +-- transaction của A vẫn áp
~~~

### Khi nào dùng
Dùng khi debug vì sao @Transactional, @Cacheable, @Async, @PreAuthorize không chạy dù đã đánh dấu đúng. Kiểm tra xem lời gọi có đi qua proxy hay không.

### Hay nhầm với
**Private method** không thể bị proxy chặn vì proxy con không ghi đè được. **Propagation** nói về cách transaction tham gia, còn self-invocation là vấn đề lời gọi không tới proxy. **AOP** là cơ chế chung đứng sau.`,
    related: ['proxy', 'transaction-propagation', 'aop'],
    refs: [{ type: 'doc', title: 'Spring AOP — Proxying Mechanisms', url: 'https://docs.spring.io/spring-framework/reference/core/aop/proxying.html' }],
  },
  {
    id: 'transaction-propagation',
    term: 'Transaction propagation',
    aliases: ['transaction propagation', 'propagation behavior', 'propagation của transaction', 'requires_new', 'requiresnew', 'lan truyền transaction'],
    short: 'Quy tắc quyết định method được gọi sẽ dùng transaction có sẵn hay mở cái mới.',
    body: `### Ví dụ đời thường
Bạn đi ăn cùng nhóm và hóa đơn được ghi chung một bàn. Nếu bạn gọi thêm món, món đó vào chung hóa đơn. Nhưng nếu bạn muốn trả riêng, nhà hàng mở một hóa đơn khác cho bạn dù bạn vẫn ngồi cùng bàn.

### Cơ chế
Khi method có @Transactional được gọi, TransactionInterceptor hỏi transaction hiện tại đang gắn với luồng hay chưa, rồi áp propagation:
- REQUIRED (mặc định): dùng transaction hiện có, nếu chưa có thì tạo mới.
- REQUIRES_NEW: luôn tạo transaction mới, tạm treo transaction cũ.
- NESTED: tạo savepoint bên trong transaction hiện có; rollback về savepoint nếu lỗi.
- SUPPORTS: dùng nếu có, không có thì chạy không transaction.
- MANDATORY: bắt buộc phải có, nếu không thì ném lỗi.
- NOT_SUPPORTED: tạm treo transaction hiện có.
- NEVER: không được có transaction, nếu có thì ném lỗi.

Transaction gắn với luồng qua ThreadLocal, nên cùng một luồng mới thấy transaction hiện tại. Chạy sang luồng khác thì không tự lan truyền.

~~~text
Service A (@Transactional REQUIRED) --> tx mới T1
   |
   +--> Service B (REQUIRED)      --> dùng T1
   |
   +--> Service C (REQUIRES_NEW)  --> T2 (T1 tạm treo)
   |
   +--> Service D (NESTED)        --> savepoint trong T1
~~~

### Khi nào dùng
Dùng khi ghép nhiều service trong một use case, khi cần ghi log hoặc audit kể cả transaction chính rollback, hoặc khi muốn một phần lỗi không kéo cả transaction lớn rollback.

### Hay nhầm với
**Isolation level** nói về mức nhìn thấy dữ liệu giữa các transaction đồng thời (READ COMMITTED, REPEATABLE READ...). **Propagation** nói về việc dùng hay tạo transaction. **Self-invocation** khiến propagation không được áp vì không qua proxy.`,
    related: ['proxy', 'self-invocation', 'pessimistic-locking', 'optimistic-locking'],
    refs: [{ type: 'doc', title: 'Spring — Transaction Propagation', url: 'https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative/tx-propagation.html' }],
  },
  {
    id: 'persistence-context',
    term: 'Persistence context',
    aliases: ['persistence context', 'persistence contexts', 'entity manager', 'entitymanager'],
    short: 'Bộ nhớ đệm của EntityManager giữ các entity đang được quản lý; find cùng id hai lần trong một transaction chỉ query DB một lần.',
    body: `### Ví dụ đời thường
Thủ thư có một cuốn sổ tay ghi các cuốn sách đang được mượn trong ca trực. Khi cần kiểm tra, bà xem sổ trước; chỉ khi sổ không có mới ra kho tìm. Cuối ca, sổ được đối chiếu và cập nhật.

### Cơ chế
Persistence context là tập các entity instance đang ở trạng thái managed, gắn với một EntityManager. Nó hoạt động như first-level cache và identity map: trong cùng context, mỗi hàng dữ liệu chỉ ứng với một object. Khi bạn find cùng id hai lần, lần thứ hai lấy từ context, không query lại.

Khi gọi flush (hoặc transaction commit), Hibernate so sánh trạng thái hiện tại với snapshot, sinh UPDATE/INSERT/DELETE cần thiết, theo thứ tự để tôn trọng khóa ngoại. Context thường sống theo transaction; sau khi transaction kết thúc, entity trở thành detached. Ngoài ra có second-level cache dùng chung giữa các session, khác hoàn toàn.

~~~text
EntityManager (persistence context)
   |
   +-- entity A (managed, có snapshot)
   +-- entity B (managed)
   |
   find(A) --> trả từ context, không query DB
   flush() --> so sánh snapshot --> UPDATE
   close() --> các entity thành detached
~~~

### Khi nào dùng
Dùng khi làm việc với JPA/Hibernate, khi cần hiểu vì sao không thấy dữ liệu vừa sửa bằng câu SQL khác, hoặc khi debug lazy loading và dirty checking.

### Hay nhầm với
**Second-level cache** dùng chung giữa nhiều session và cần cấu hình riêng. **Session** là API gốc của Hibernate; từ Hibernate 5.2, Session kế thừa EntityManager nên có thể coi là cùng một thứ. **Connection** là kết nối vật lý tới DB, không giữ entity.`,
    related: ['dirty-checking', 'lazy-loading', 'entity-state'],
    refs: [{ type: 'doc', title: 'Hibernate ORM 6.6 User Guide', url: 'https://docs.jboss.org/hibernate/orm/6.6/userguide/html_single/Hibernate_User_Guide.html' }],
  },
  {
    id: 'dirty-checking',
    term: 'Dirty checking',
    aliases: ['dirty checking', 'dirty check', 'kiểm tra thay đổi'],
    short: 'Cơ chế tự phát hiện entity đã bị sửa để sinh câu cập nhật khi lưu.',
    body: `### Ví dụ đời thường
Trước khi rời khỏi khách sạn, nhân viên so phiếu lúc nhận phòng với tình trạng hiện tại. Chỉ mục nào thay đổi mới bị tính thêm tiền. Không cần bạn tự khai từng món.

### Cơ chế
Khi Hibernate nạp một entity vào persistence context, nó giữ một bản snapshot các giá trị ban đầu. Trong lúc entity còn managed, bạn chỉ cần gọi setter. Đến lúc flush, Hibernate so từng trường với snapshot:
- Nếu khác, đánh dấu dirty và sinh UPDATE.
- Nếu không khác, không làm gì.
- Nếu entity mới, sinh INSERT; nếu bị remove, sinh DELETE.

Mặc định Hibernate so sánh toàn bộ thuộc tính của mọi entity managed khi flush, nên context chứa hàng nghìn entity sẽ làm flush chậm. Mặc định câu UPDATE ghi lại mọi cột; có thể gắn @DynamicUpdate lên entity để chỉ đưa cột thay đổi vào câu SQL. Dirty checking giúp code gọn nhưng có thể gây bất ngờ: thay đổi ngoài transaction, hoặc câu bulk update không cập nhật snapshot, khiến context chứa dữ liệu cũ.

~~~text
Load entity --> snapshot(name=An, age=20)
setAge(21)
flush() --> so sánh:
   name: An == An   (bỏ qua)
   age : 21 != 20   (dirty)
--> UPDATE ... SET age=21 WHERE id=?
~~~

### Khi nào dùng
Dùng khi muốn cập nhật entity trong transaction mà không gọi save/merge, hoặc khi debug vì sao có UPDATE bất ngờ. Với bulk update, nhớ clear hoặc refresh context.

### Hay nhầm với
**Explicit update** là gọi save/merge hoặc viết câu SQL trực tiếp. **Second-level cache** lưu dữ liệu giữa các session, không liên quan so sánh snapshot. **Optimistic locking** kiểm tra phiên bản khi ghi, không phát hiện thay đổi trong bộ nhớ.`,
    related: ['persistence-context', 'entity-state', 'optimistic-locking'],
    refs: [{ type: 'doc', title: 'Hibernate ORM 6.6 User Guide', url: 'https://docs.jboss.org/hibernate/orm/6.6/userguide/html_single/Hibernate_User_Guide.html' }],
  },
  {
    id: 'lazy-loading',
    term: 'Lazy loading',
    aliases: ['lazy loading', 'lazy load', 'lazy fetch', 'tải lười'],
    short: 'Chỉ nạp dữ liệu liên quan khi thật sự cần dùng tới.',
    body: `### Ví dụ đời thường
Bạn đặt một bộ tủ lắp ghép. Nhà giao hàng chỉ mang đúng phần bạn cần lắp trước, phần còn lại để trong kho và giao khi bạn yêu cầu. Đỡ chật nhà, nhưng nếu cần gấp mà kho xa thì phải chờ.

### Cơ chế
Với JPA, mặc định @OneToMany và @ManyToMany là LAZY, còn @ManyToOne và @OneToOne là EAGER; nên khai báo fetch = FetchType.LAZY cho @ManyToOne để tránh nạp thừa. Hibernate không nạp dữ liệu ngay mà tạo proxy hoặc PersistentCollection. Khi bạn gọi getter hoặc duyệt collection lần đầu, Hibernate phát câu SQL để nạp, gọi là initialize.

Lazy loading giúp tránh đọc cả đồ thị lớn khi chỉ cần vài trường. Nhưng nếu entity đã detached (sau khi transaction đóng), việc nạp sẽ ném LazyInitializationException. Ngoài ra, duyệt collection của N entity trong vòng lặp sẽ tạo N+1 query. Cách xử lý: fetch join, @EntityGraph, batch size, hoặc DTO projection.

~~~text
Order (managed)
  |
  +-- items: PersistentCollection (chưa nạp)
        |
        getItems() lần đầu --> SELECT * FROM item WHERE order_id=?
        --> nạp vào collection --> các lần sau dùng cache
~~~

### Khi nào dùng
Dùng cho quan hệ lớn hoặc ít dùng, danh sách chi tiết không cần trong màn hình tổng hợp. Cân nhắc eager cho dữ liệu nhỏ luôn cần, nhưng coi chừng N+1 và đồ thị quá lớn.

### Hay nhầm với
**Eager loading** nạp ngay khi tải entity chính. **N+1 query** là hậu quả thường gặp của lazy khi duyệt vòng lặp. **Pagination in memory** là nạp hết rồi cắt, khác với lazy.`,
    related: ['n-plus-one', 'persistence-context', 'entity-state'],
    refs: [{ type: 'doc', title: 'Hibernate ORM 6.6 User Guide', url: 'https://docs.jboss.org/hibernate/orm/6.6/userguide/html_single/Hibernate_User_Guide.html' }],
  },
  {
    id: 'n-plus-one',
    term: 'N+1 query',
    aliases: ['n+1', 'n+1 query', 'n+1 queries', 'n + 1', 'n-plus-one', 'n+1 problem'],
    short: 'Lỗi tải danh sách N mục rồi phát thêm N câu truy vấn cho từng mục.',
    body: `### Ví dụ đời thường
Bạn hỏi quản lý danh sách 50 nhân viên. Quản lý đưa danh sách, nhưng với mỗi người bạn lại phải gọi điện hỏi phòng ban riêng. Tổng cộng 1 cuộc gọi lấy danh sách và 50 cuộc gọi lẻ, chậm và tốn công.

### Cơ chế
N+1 xảy ra khi code tải N entity cha bằng một query, sau đó truy cập quan hệ lazy của từng cha, khiến Hibernate phát thêm một query cho mỗi cha. Ví dụ:
- SELECT * FROM orders WHERE customer_id = ? (1 query).
- Vòng lặp qua 100 order, mỗi order gọi getItems() (100 query).
Tổng 101 query thay vì 2.

Vấn đề nặng hơn khi mỗi query lại có round-trip mạng tới DB. Cách chữa:
- JOIN FETCH quan hệ cần dùng trong một query.
- @EntityGraph để chỉ định đồ thị nạp.
- @BatchSize hoặc hibernate.default_batch_fetch_size để gom nhiều id vào một câu IN.
- DTO projection chỉ lấy cột cần.
Kiểm tra bằng cách bật show SQL hoặc đếm query trong test.

~~~text
1 query: lấy 100 đơn hàng
   |
   +--> order 1 --> 1 query items
   +--> order 2 --> 1 query items
   ...
   +--> order 100 --> 1 query items
Tổng: 1 + 100 = 101 query
~~~

### Khi nào dùng
Dùng khi điều tra API chậm bất thường khi số bản ghi tăng, hoặc khi review code có vòng lặp truy cập quan hệ lazy. Luôn đo số query, đừng chỉ nhìn thời gian.

### Hay nhầm với
**Lazy loading** là cơ chế gây ra N+1 nếu dùng sai, nhưng lazy vẫn hữu ích. **Cartesian product** xảy ra khi join fetch nhiều collection cùng lúc, tạo số dòng bùng nổ. **N+1** là nhiều query, không phải một query trả nhiều dòng.`,
    related: ['lazy-loading', 'persistence-context', 'connection-pool'],
    refs: [{ type: 'article', title: 'Vlad Mihalcea — The N+1 query problem', url: 'https://vladmihalcea.com/n-plus-1-query-problem/' }],
  },
  {
    id: 'optimistic-locking',
    term: 'Optimistic locking',
    aliases: ['optimistic locking', 'optimistic lock', 'optimistic', 'khóa lạc quan'],
    short: 'Cho phép đọc tự do nhưng khi ghi phải kiểm tra dữ liệu chưa bị người khác sửa.',
    body: `### Ví dụ đời thường
Bạn đặt chỗ qua ứng dụng. Ứng dụng cho nhiều người xem sơ đồ ghế cùng lúc, nhưng khi bạn bấm xác nhận, hệ thống kiểm tra ghế vẫn còn trống và đúng phiên bản bạn thấy. Nếu người khác vừa đặt, bạn được báo thử lại.

### Cơ chế
Cách phổ biến là thêm cột version vào bảng, ánh xạ bằng @Version. Khi đọc, entity mang version hiện tại. Khi UPDATE, Hibernate thêm điều kiện version = giá trị cũ và tăng version lên một. Nếu số dòng cập nhật bằng 0, nghĩa là ai đó đã sửa trước, Hibernate ném OptimisticLockException (hoặc StaleObjectStateException).

Không có khóa DB nào bị giữ trong lúc đọc, nên nhiều người đọc đồng thời rất tốt. Khi xung đột, ứng dụng cần retry hoặc báo người dùng tải lại. Có thể dùng timestamp thay version, nhưng timestamp có độ phân giải thấp và dễ trùng. Với cập nhật hàng loạt, phải tự tăng version trong câu SQL.

~~~text
User A đọc: id=1, version=3
User B đọc: id=1, version=3
A lưu: UPDATE ... SET ..., version=4 WHERE id=1 AND version=3  --> 1 dòng
B lưu: UPDATE ... SET ..., version=4 WHERE id=1 AND version=3  --> 0 dòng
       --> OptimisticLockException --> báo thử lại
~~~

### Khi nào dùng
Dùng cho ứng dụng web, tranh chấp thấp tới vừa, transaction ngắn, nơi giữ khóa lâu là không cần thiết. Rất hợp với form chỉnh sửa và API REST.

### Hay nhầm với
**Pessimistic locking** khóa dòng ngay khi đọc, chặn người khác. **CAS** là phép nguyên tử ở bộ nhớ, ý tưởng tương tự nhưng không qua DB. **Isolation level** điều khiển khả năng nhìn thấy dữ liệu, không giải quyết lost update theo cách này.`,
    related: ['pessimistic-locking', 'cas', 'transaction-propagation'],
    refs: [{ type: 'doc', title: 'Hibernate ORM 6.6 User Guide', url: 'https://docs.jboss.org/hibernate/orm/6.6/userguide/html_single/Hibernate_User_Guide.html' }],
  },
  {
    id: 'pessimistic-locking',
    term: 'Pessimistic locking',
    aliases: ['pessimistic locking', 'pessimistic lock', 'pessimistic', 'khóa bi quan'],
    short: 'Khóa dòng dữ liệu ngay khi đọc (SELECT ... FOR UPDATE) để transaction khác không sửa được cho tới khi bạn commit.',
    body: `### Ví dụ đời thường
Bạn đến quầy thuê xe và giữ chìa khóa chiếc xe duy nhất. Trong lúc bạn còn giữ, nhân viên không thể cho người khác thuê xe đó. Cách này chắc chắn nhưng người sau phải chờ.

### Cơ chế
Với JPA, dùng LockModeType.PESSIMISTIC_WRITE sẽ phát SELECT ... FOR UPDATE (tùy DB), khóa dòng cho tới khi transaction kết thúc. Transaction khác muốn UPDATE/DELETE hoặc cũng SELECT ... FOR UPDATE dòng đó sẽ phải chờ. Lưu ý: SELECT thường (không FOR UPDATE) trên PostgreSQL và MySQL InnoDB vẫn đọc được ngay nhờ MVCC, chỉ thấy bản đã commit trước đó. PESSIMISTIC_READ thường dùng khóa chia sẻ, cho phép nhiều người đọc nhưng chặn ghi.

Ưu điểm là ngăn lost update tuyệt đối, không cần retry. Nhược điểm là giảm throughput, dễ gây chờ lâu, và có thể deadlock nếu khóa nhiều bảng theo thứ tự khác nhau. Luôn đặt timeout và giữ transaction ngắn. Với DB như PostgreSQL, FOR UPDATE chỉ khóa dòng thực sự khớp điều kiện.

~~~text
Tx A: SELECT ... FOR UPDATE (khóa dòng 1)
Tx B: SELECT ... FOR UPDATE (chờ dòng 1)
Tx A: UPDATE ... ; COMMIT  --> nhả khóa
Tx B: được cấp khóa --> đọc dữ liệu mới --> UPDATE
~~~

### Khi nào dùng
Dùng khi tranh chấp cao và nghiệp vụ không cho phép thử lại: trừ tồn kho, giữ ghế, chuyển tiền trong cùng DB, hoặc khi cần đọc rồi quyết định ngay mà không muốn người khác chen vào.

### Hay nhầm với
**Optimistic locking** không khóa khi đọc, chỉ kiểm tra lúc ghi và có thể thất bại. **Isolation level** là mức cô lập chung của transaction, không phải lệnh khóa tường minh. **Deadlock** là rủi ro đi kèm khi khóa nhiều tài nguyên.`,
    related: ['optimistic-locking', 'deadlock', 'transaction-propagation'],
    refs: [{ type: 'doc', title: 'Hibernate ORM 6.6 User Guide', url: 'https://docs.jboss.org/hibernate/orm/6.6/userguide/html_single/Hibernate_User_Guide.html' }],
  },
  {
    id: 'entity-state',
    term: 'Entity state (transient / managed / detached)',
    aliases: ['entity state', 'entity states', 'trạng thái entity', 'detached', 'transient state', 'trạng thái transient', 'managed entity'],
    short: 'Vòng đời của entity JPA: transient (mới new), managed (Hibernate đang theo dõi), detached (đã rời persistence context), removed.',
    body: `### Ví dụ đời thường
Một nhân viên có thể ở ba trạng thái: mới nộp hồ sơ chưa vào hệ thống, đang làm việc và có mã số trong hệ thống, hoặc đã nghỉ và hồ sơ chỉ còn là bản sao. Mỗi trạng thái cho phép hành động khác nhau.

### Cơ chế
Với JPA/Hibernate, entity đi qua các trạng thái:
- Transient (new): object mới tạo bằng new, chưa gắn với persistence context. DB chưa biết. Gọi persist để chuyển sang managed.
- Managed (persistent): đang nằm trong persistence context, có id, mọi thay đổi được dirty checking phát hiện và flush.
- Detached: từng managed nhưng context đã đóng hoặc gọi detach/clear. Có id nhưng không còn được theo dõi. Gọi merge để đưa lại thành managed.
- Removed: đã đánh dấu xóa, sẽ bị DELETE khi flush.

Chuyển trạng thái sai gây lỗi quen thuộc: LazyInitializationException trên detached, hoặc gọi persist trên một entity detached gây lỗi "detached entity passed to persist". Hiểu vòng đời giúp chọn persist, merge, refresh, detach đúng chỗ.

~~~text
new --> transient --persist--> managed --detach/close--> detached
                                  |    ^                     |
                                  |    +------- merge -------+
                                  +--remove--> removed --flush--> DELETE
~~~

### Khi nào dùng
Dùng khi thao tác CRUD với JPA, khi làm việc với DTO và mapper, hoặc khi gặp lỗi entity không được cập nhật hay bị cập nhật ngoài ý muốn.

### Hay nhầm với
**DTO** là object vận chuyển dữ liệu, không được quản lý bởi persistence context. **Persistence context** là tập hợp chứa các entity managed. **Value object** không có danh tính riêng, thường bất biến và không ánh xạ thành entity riêng.`,
    related: ['persistence-context', 'dirty-checking', 'lazy-loading'],
    refs: [{ type: 'doc', title: 'Hibernate ORM 6.6 User Guide', url: 'https://docs.jboss.org/hibernate/orm/6.6/userguide/html_single/Hibernate_User_Guide.html' }],
  },
  {
    id: 'connection-pool',
    term: 'Connection pool',
    aliases: ['connection pool', 'connection pools', 'connection pooling', 'pool kết nối', 'hikaricp'],
    short: 'Tập kết nối cơ sở dữ liệu được mở sẵn và cho các luồng mượn dùng lại.',
    body: `### Ví dụ đời thường
Một bến taxi có sẵn mười xe. Khách đến thì lên xe đang rảnh; hết xe thì xếp hàng chờ. Không ai phải mua xe mới cho từng chuyến, và bến cũng không giữ quá nhiều xe gây tốn chỗ.

### Cơ chế
Mở kết nối tới DB rất tốn kém: bắt tay TCP, xác thực, khởi tạo session. Connection pool giữ sẵn một số kết nối vật lý. Khi code gọi DataSource.getConnection, pool cấp một kết nối đang rảnh; khi đóng, kết nối được trả lại chứ không đóng thật. Nếu tất cả đang bận, luồng xin kết nối sẽ chờ tới connectionTimeout rồi ném lỗi.

HikariCP là pool mặc định của Spring Boot, mặc định maximumPoolSize là 10. Kích thước pool không nên quá lớn: DB có giới hạn kết nối, và quá nhiều kết nối tranh CPU làm chậm. Công thức tham khảo: số core CPU nhân 2 cộng số đĩa hiệu dụng, nhưng phải đo thực tế. Cấu hình timeout, maxLifetime và leakDetectionThreshold để tránh kết nối treo.

~~~text
Ứng dụng                Connection pool              DB
  getConnection() ---> [conn1 rảnh] ------------> dùng
  getConnection() ---> [conn2 rảnh] ------------> dùng
  getConnection() ---> hết, chờ ...               |
  close() ----------> trả conn1 về pool           |
~~~

### Khi nào dùng
Dùng cho mọi ứng dụng nói chuyện với DB qua mạng. Cần theo dõi số kết nối đang dùng, thời gian chờ, và lỗi pool cạn khi tải cao.

### Hay nhầm với
**Thread pool** quản lý luồng chạy task, không phải kết nối DB. **DataSource** là interface cung cấp kết nối, pool là một implementation. **Connection pool exhaustion** là tình trạng tất cả kết nối bị giữ quá lâu, thường do query chậm hoặc rò rỉ kết nối.`,
    related: ['thread-pool', 'n-plus-one', 'pessimistic-locking'],
    refs: [{ type: 'doc', title: 'HikariCP', url: 'https://github.com/brettwooldridge/HikariCP' }],
  },
  {
    id: 'immutable-object',
    term: 'Immutable object',
    aliases: ['immutable', 'immutable object', 'immutable objects', 'bất biến', 'đối tượng bất biến'],
    short: 'Đối tượng không thể thay đổi sau khi tạo, nên chia sẻ giữa các luồng rất an toàn.',
    body: `### Ví dụ đời thường
Một hóa đơn đã in và đóng dấu thì không sửa được nữa. Muốn đổi, phải lập hóa đơn mới. Nhờ vậy ai cầm bản nào cũng biết nó không bị ai lén sửa.

### Cơ chế
Một class bất biến thường có:
- Các field final, thường private.
- Không có setter hoặc method thay đổi trạng thái.
- Class final hoặc constructor private để tránh lớp con phá vỡ.
- Nếu field là object tham chiếu, phải sao chép phòng thủ khi nhận và khi trả ra.
- Khởi tạo xong mới công bố tham chiếu.

Với các điều kiện này, trạng thái không đổi nên nhiều luồng đọc đồng thời mà không cần khóa. Final field còn có ngữ nghĩa công bố an toàn trong JMM: luồng khác thấy đúng giá trị sau khi constructor hoàn tất. String, Integer, LocalDate là ví dụ sẵn có. Bất biến cũng giúp dễ suy luận, dễ cache, và tránh lỗi do chia sẻ.

~~~text
Tạo: new Money(100, "USD") --> không đổi được
Chia sẻ cho luồng A, B, C --> tất cả đọc cùng giá trị
Muốn đổi --> tạo object mới --> object cũ vẫn nguyên
~~~

### Khi nào dùng
Dùng cho value object, cấu hình, khóa, DTO, event, và mọi dữ liệu chia sẻ giữa luồng. Trong functional style, ưu tiên cấu trúc bất biến để giảm lỗi.

### Hay nhầm với
**Final** chỉ ngăn gán lại biến, không ngăn object bên trong thay đổi. **Unmodifiable collection** là lớp bọc chặn sửa, nhưng collection gốc vẫn có thể bị sửa nếu còn tham chiếu. **Read-only** ở tầng DB là quyền truy cập, không phải tính bất biến của object.`,
    related: ['happens-before', 'functional-interface', 'race-condition'],
    refs: [{ type: 'doc', title: 'Java Tutorial — Immutable Objects', url: 'https://docs.oracle.com/javase/tutorial/essential/concurrency/immutable.html' }],
  },
  {
    id: 'functional-interface',
    term: 'Functional interface',
    aliases: ['functional interface', 'functional interfaces', 'giao diện chức năng', 'sam interface'],
    short: 'Interface chỉ có đúng một method trừu tượng, nên có thể thay bằng biểu thức lambda.',
    body: `### Ví dụ đời thường
Một chiếc điều khiển chỉ có một nút. Bạn có thể dán nhãn nút đó là "bật đèn", "mở cửa" hay "gọi thang máy", miễn là chỉ một hành động. Chính vì chỉ một nút nên thay nút khác rất dễ.

### Cơ chế
Functional interface có đúng một abstract method (SAM, single abstract method). Nó có thể có thêm default method, static method, và method của Object, vì những thứ đó không tính. Annotation @FunctionalInterface giúp compiler kiểm tra, nhưng không bắt buộc.

Nhờ đặc điểm này, lambda hoặc method reference có thể hiện thực interface mà không cần class ẩn danh. Ví dụ Runnable, Callable, Comparator, Function, Predicate, Supplier, Consumer. Compiler dùng invokedynamic và LambdaMetafactory để tạo instance nhẹ, không sinh file class riêng cho từng lambda như class ẩn danh cũ.

~~~text
@FunctionalInterface
interface Discount {
    int apply(int price);        // 1 abstract method
}

Discount d = p -> p * 90 / 100; // lambda hiện thực apply
int result = d.apply(1000);
~~~

### Khi nào dùng
Dùng khi viết API nhận hành vi làm tham số: stream, callback, chiến lược tính toán, xử lý sự kiện. Chọn interface có sẵn trong java.util.function thay vì tự tạo nếu khớp.

### Hay nhầm với
**Abstract class** có thể có nhiều method trừu tượng và trạng thái, không dùng lambda được. **Marker interface** không có method nào, dùng để đánh dấu. **Functional interface** vẫn có thể có nhiều default method, miễn chỉ một abstract method.`,
    related: ['immutable-object', 'type-erasure', 'checked-exception'],
    refs: [{ type: 'doc', title: 'java.util.function — Java API', url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/function/package-summary.html' }],
  },
  {
    id: 'checked-exception',
    term: 'Checked exception',
    aliases: ['checked exception', 'checked exceptions', 'ngoại lệ checked'],
    short: 'Loại lỗi mà compiler buộc bạn phải bắt hoặc khai báo là có thể ném ra.',
    body: `### Ví dụ đời thường
Khi gửi một gói hàng dễ vỡ, bưu điện yêu cầu bạn ký cam kết và ghi rõ cách xử lý nếu vỡ. Bạn không được im lặng bỏ qua; phải có phương án. Với gói thường thì không cần thủ tục đó.

### Cơ chế
Trong Java, Throwable chia thành Error, Exception. Exception lại chia:
- Checked: subclass của Exception nhưng không phải RuntimeException. Ví dụ IOException, SQLException. Compiler kiểm tra: method nào có thể ném phải khai báo throws, nơi gọi phải catch hoặc khai báo tiếp.
- Unchecked: RuntimeException và subclass, như NullPointerException, IllegalArgumentException. Compiler không bắt.

Checked exception thể hiện hợp đồng API: người gọi buộc phải xử lý tình huống có thể phục hồi. Nhược điểm là làm rối code khi dùng lambda, vì functional interface như Function không khai báo checked exception. Nhiều thư viện hiện đại có xu hướng dùng unchecked cho lỗi lập trình và checked cho lỗi I/O thực sự.

~~~text
void read() throws IOException   // khai báo
   |
   +-- nơi gọi: try { read(); } catch (IOException e) { ... }
   |             hoặc throws tiếp lên trên
   |
   +-- không bắt, không khai báo --> lỗi biên dịch
~~~

### Khi nào dùng
Dùng khi lỗi là một phần hợp đồng và người gọi có cách xử lý cụ thể: file không tồn tại, mạng đứt, xác thực thất bại. Tránh lạm dụng cho lỗi lập trình hoặc lỗi không thể phục hồi.

### Hay nhầm với
**Unchecked exception** không bị compiler kiểm tra, thường là lỗi lập trình. **Error** là lỗi nghiêm trọng của JVM như OutOfMemoryError, không nên bắt. **Try-with-resources** là cú pháp đóng tài nguyên, không phải loại exception.`,
    related: ['functional-interface', 'type-erasure'],
    refs: [{ type: 'doc', title: 'JLS 11 — Exceptions', url: 'https://docs.oracle.com/javase/specs/jls/se21/html/jls-11.html' }],
  },
  {
    id: 'type-erasure',
    term: 'Generics type erasure',
    aliases: ['type erasure', 'erasure', 'generic type erasure', 'xóa kiểu'],
    short: 'Compiler kiểm tra kiểu generic rồi xóa nó khỏi bytecode, nên lúc chạy List<String> và List<Integer> chỉ còn là List.',
    body: `### Ví dụ đời thường
Ở cổng sân bay, nhân viên kiểm tra vali có đúng quy định không rồi dán nhãn. Khi vali đã lên máy bay, nhãn chi tiết bị gỡ, khoang chứa chỉ còn một vali chung chung. Việc kiểm tra đã xong trước đó, nhưng bên trong khoang không còn phân biệt loại.

### Cơ chế
Java triển khai generic bằng type erasure để code và thư viện viết trước Java 5 (không có generic) vẫn chạy chung được:
- Tham số kiểu bị xóa, thay bằng bound hoặc Object. List<String> và List<Integer> cùng là List ở runtime.
- Compiler chèn ép kiểu (cast) ở nơi cần thiết và kiểm tra kiểu lúc biên dịch.
- Sinh bridge method để giữ tính đa hình khi lớp con override method generic.
- Không thể dùng new T(), new T[], instanceof List<String>, hay overload chỉ khác tham số generic vì cả hai xóa về cùng chữ ký.
- Nhìn vào một object List lúc runtime không biết phần tử kiểu gì. Chỉ chữ ký khai báo (kiểu của field, tham số method, lớp cha) còn giữ generic trong class file, và TypeToken khai thác điều này.

Muốn giữ thông tin kiểu, truyền Class<T> hoặc dùng TypeToken. Một số ngôn ngữ khác như C# reify generic, nghĩa là giữ kiểu tại runtime.

~~~text
Nguồn:  List<String> names
Biên dịch: kiểm tra names.add("An") hợp lệ
Runtime: List (không còn <String>)
         names.get(0) --> compiler chèn cast (String)
~~~

### Khi nào dùng
Dùng khi thiết kế API generic, khi gặp lỗi không tạo được mảng generic, hoặc khi thư viện serialization cần biết kiểu thật. Hiểu erasure giúp tránh thiết kế API không khả thi.

### Hay nhầm với
**Reified type** là kiểu còn tồn tại lúc runtime, Java generic không có. **Wildcard** (? extends, ? super) là cách biểu diễn biến thiên kiểu, không phải erasure. **Bridge method** là hệ quả của erasure, dùng để giữ override đúng.`,
    related: ['functional-interface', 'immutable-object'],
    refs: [{ type: 'doc', title: 'Java Tutorial — Type Erasure', url: 'https://docs.oracle.com/javase/tutorial/java/generics/erasure.html' }],
  }
);
