/*
 * English translation of js/data/lessons-collections.js — task T263. Format: js/core/i18n.js (content overlay).
 * ids: lesson-collections-003
 */
App.i18n.content({
  'lesson-collections-003': {
    title: 'ConcurrentHashMap: CAS, locks and atomic operations',
    goals: [
      'Explain how CAS works for a bin and why synchronized is only on the bin head',
      'Understand the difference between Java 7 Segment and Java 8 CAS + synchronized',
      'Describe why size() is not an exact count and why null is forbidden',
    ],
    body: `### Vấn đề: HashMap mất dữ liệu khi nhiều thread cùng ghi
{{HashMap}} không có bất kỳ đồng bộ nào. Hai thread cùng {{put}} vào một bucket trống có thể cùng thấy bucket là null và cùng ghi node của mình: node ghi sau đè node ghi trước, một entry biến mất. Hai thread cùng resize có thể làm hỏng cấu trúc bảng. Còn đếm bằng {{map.put(k, map.get(k) + 1)}} thì mất cập nhật gần như chắc chắn khi có tranh tập.

Cách cũ là bọc lại: {{Hashtable}} hay {{Collections.synchronizedMap}} dùng **một khoá cho cả map**, nên 32 thread cũng chỉ ghi được lần lượt từng thread một. {{ConcurrentHashMap}} giải quyết bằng cách **khoá nhỏ nhất có thể**.

### Java 8+: CAS cho bin trống, synchronized trên node đầu bin
Java 7 chia map thành 16 **Segment** (mỗi segment là một ReentrantLock). Java 8 viết lại hoàn toàn: chỉ còn một mảng {{Node[] table}} giống HashMap, và mỗi lệnh {{put}} đi theo các bước:

1. Tính hash (trộn bit như HashMap) và chỉ số bin. Bảng được tạo lười, cũng bằng CAS.
2. **Bin trống**: ghi node mới bằng **CAS** (compare-and-swap) lên ô của mảng, **không khoá gì cả**. Nếu CAS thua (thread khác vừa ghi), vòng lặp thử lại.
3. **Bin đang được chuyển khi resize** (node đầu là {{ForwardingNode}}, hash = MOVED): thread này **giúp** chuyển dữ liệu sang bảng mới rồi mới put. Resize được nhiều thread chia nhau làm, mỗi thread nhận một dải bin.
4. **Bin đã có node**: {{synchronized}} trên **node đầu của bin đó**, rồi duyệt danh sách (hoặc cây đỏ-đen nếu bin đã treeify, cùng ngưỡng 8/64 như HashMap) để ghi đè hoặc thêm node.
5. Tăng bộ đếm phần tử bằng CAS; khi tranh chấp cao thì đếm trên nhiều ô {{CounterCell}} (giống {{LongAdder}}).

~~~java
// Ý tưởng putVal (rút gọn từ JDK, không phải code đầy đủ)
if ((f = tabAt(tab, i)) == null) {
    if (casTabAt(tab, i, null, new Node<>(hash, key, value))) break;  // không khoá
} else if (f.hash == MOVED) {
    tab = helpTransfer(tab, f);                                     // giúp resize
} else {
    synchronized (f) { /* chỉ khoá bin i: các bin khác vẫn ghi song song */ }
}
~~~

**Vì sao thiết kế như vậy?** Với hash phân tán tốt, phần lớn bin có 0–1 node, nên đa số lệnh put rơi vào nhánh CAS rẻ. Hai thread chỉ chặn nhau khi ghi **cùng một bin**. Còn {{get}} **không khoá**: các trường {{val}} và {{next}} của Node là {{volatile}}, nên đọc luôn thấy dữ liệu đã được ghi đầy đủ.

### size() chỉ là ước lượng
{{size()}} cộng {{baseCount}} với mọi CounterCell. Trong lúc thread khác đang ghi, kết quả có thể đã cũ ngay khi trả về. Cần số lớn hơn {{Integer.MAX_VALUE}} thì dùng {{mappingCount()}}. Iterator là **weakly consistent**: không bao giờ ném {{ConcurrentModificationException}}, có thể thấy hoặc không thấy thay đổi xảy ra sau khi bắt đầu duyệt.

### Thao tác nguyên tử: đừng tự ghép get rồi put
Mỗi method đơn lẻ là thread-safe, nhưng **ghép hai lời gọi lại thì không**:

~~~java
// SAI: hai thread cùng đọc 5, cùng ghi 6 → mất một lần đếm
counts.put(word, counts.getOrDefault(word, 0L) + 1);
// ĐÚNG: đọc-sửa-ghi trong một thao tác, khoá bin trong lúc chạy hàm
counts.merge(word, 1L, Long::sum);

// SAI: check-then-act, hai thread cùng thấy "chưa có" → tạo 2 list, 1 bị mất
if (!byUser.containsKey(u)) byUser.put(u, new CopyOnWriteArrayList<>());
// ĐÚNG
byUser.computeIfAbsent(u, k -> new CopyOnWriteArrayList<>()).add(order);
~~~

| Method | Nguyên tử làm gì | Ghi chú |
|---|---|---|
| {{putIfAbsent(k, v)}} | thêm nếu chưa có | {{v}} luôn được tạo trước, kể cả khi không dùng |
| {{computeIfAbsent(k, f)}} | gọi {{f}} chỉ khi chưa có | dùng cho cache, multimap |
| {{compute(k, f)}} | đọc-sửa-ghi, {{f}} trả về null thì xoá key | linh hoạt nhất |
| {{merge(k, v, f)}} | chưa có thì đặt {{v}}, có rồi thì {{f(old, v)}} | đếm, cộng dồn |
| {{replace(k, old, new)}} / {{remove(k, v)}} | compare-and-set theo giá trị | optimistic update |

### Vì không cho null
{{ConcurrentHashMap}} ném {{NullPointerException}} với key hoặc value null. Lý do: nếu cho null thì {{get(k) == null}} có hai nghĩa ("không có key" hoặc "value là null"). Với HashMap bạn gọi thêm {{containsKey}} để phân biệt, nhưng trong môi trường đồng thời, giữa hai lời gọi đó thread khác có thể đã thêm hoặc xoá key, nên kết quả không còn tin được. Cấm null loại bỏ hẳn sự mơ hồ: null luôn nghĩa là "không có". Nhờ vậy {{compute}} cũng dùng được null với nghĩa "xoá key".

> Hiệu năng: ở Java 8, {{computeIfAbsent}} khoá bin ngay cả khi key đã có, nên cache "đọc nhiều" bị tranh chấp; JDK 9 đã thêm đường đi nhanh kiểm tra node đầu bin trước khi khoá. Trên Java 8, mẫu phổ biến là {{get}} trước, null mới {{computeIfAbsent}}.

### Liên hệ phỏng vấn
Interviewer hay hỏi: khác biệt Java 7 (Segment) và Java 8 (CAS + synchronized trên bin), vì sao {{get}} không cần khoá, vì sao {{size()}} không chính xác tuyệt đối, vì sao cấm null, và "code đếm này có thread-safe không" với một đoạn get-rồi-put trên ConcurrentHashMap. Câu trả lời senior luôn đi kèm: chọn đúng thao tác nguyên tử, giữ hàm trong compute ngắn, và dùng LongAdder cho key nóng.

> Lỗi production hay gặp:
- **Hàm trong {{compute}}/{{computeIfAbsent}} chạy khi đang giữ khoá bin**: gọi HTTP hay query DB trong đó sẽ chặn mọi thread khác ghi vào cùng bin. Tệ hơn, sửa **chính map đó** bên trong hàm (ví dụ computeIfAbsent lồng nhau) có thể ném {{IllegalStateException: Recursive update}} hoặc treo.
- **Một key cực nóng** (mọi thread cùng {{merge}} vào key "total") thì mọi thread xếp hàng trên một khoá. Dùng value là {{LongAdder}}: {{map.computeIfAbsent(k, x -> new LongAdder()).increment()}}.
- **Value mutable không thread-safe**: map an toàn không làm {{ArrayList}} nằm bên trong an toàn. Sửa value trong {{compute}}, hoặc dùng value thread-safe như {{ConcurrentHashMap.newKeySet()}}.
- Dựa vào {{size()}} hay {{isEmpty()}} để ra quyết định nghiệp vụ trong lúc map đang được ghi.

> Hiệu năng: ở Java 8, {{computeIfAbsent}} khoá bin ngay cả khi key đã có, nên cache "đọc nhiều" bị tranh chấp; JDK 9 đã thêm đường đi nhanh kiểm tra node đầu bin trước khi khoá. Trên Java 8, mẫu phổ biến là {{get}} trước, null mới {{computeIfAbsent}}.

> Liên hệ phỏng vấn: Interviewer hay hỏi: khác biệt Java 7 (Segment) và Java 8 (CAS + synchronized trên bin), vì sao {{get}} không cần khoá, vì sao {{size()}} không chính xác tuyệt đối, vì sao cấm null, và "code đếm này có thread-safe không" với một đoạn get-rồi-put trên ConcurrentHashMap. Câu trả lời senior luôn đi kèm: chọn đúng thao tác nguyên tử, giữ hàm trong compute ngắn, và dùng LongAdder cho key nóng.

> Lỗi production hay gặp:
- **Hàm trong {{compute}}/{{computeIfAbsent}} chạy khi đang giữ khoá bin**: gọi HTTP hay query DB trong đó sẽ chặn mọi thread khác ghi vào cùng bin. Tệ hơn, sửa **chính map đó** bên trong hàm (ví dụ computeIfAbsent lồng nhau) có thể ném {{IllegalStateException: Recursive update}} hoặc treo.
- **Một key cực nóng** (mọi thread cùng {{merge}} vào key "total") thì mọi thread xếp hàng trên một khoá. Dùng value là {{LongAdder}}: {{map.computeIfAbsent(k, x -> new LongAdder()).increment()}}.
- **Value mutable không thread-safe**: map an toàn không làm {{ArrayList}} nằm bên trong an toàn. Sửa value trong {{compute}}, hoặc dùng value thread-safe như {{ConcurrentHashMap.newKeySet()}}.
- Dựa vào {{size()}} hay {{isEmpty()}} để ra quyết định nghiệp vụ trong lúc map đang được ghi.

> Một số note thêm:
- Một số note thêm cho senior interview.

`exercises: []`,
  `check: []`,
  `related: ['collections-002', 'collections-004', 'concurrency-001']`,
  `tags: ['ConcurrentHashMap', 'CAS', 'merge', 'compute', 'thread-safety'],
},
`,
});