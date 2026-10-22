# T01 — Nội dung: Core Java, Collections, Java 8 → 21

Status: TODO
Agent: opencode
Owns: `js/data/q-java.js`

## Mục tiêu
Viết câu hỏi phỏng vấn kèm đáp án mẫu cho 3 topic `core`, `collections`, `modern`, theo **đúng** schema và chuẩn chất lượng trong `AGENTS.md` mục 4–6.
Trong file đã có sẵn `core-001` làm mẫu. Giữ nguyên câu đó và thêm các câu tiếp theo, bắt đầu từ `core-002`.

## Danh sách câu hỏi (bắt buộc bao phủ, được diễn đạt lại)
### core (≥ 10 câu)
- String immutability, String pool, {{intern()}}, vì sao String là final
- Java luôn pass-by-value: giải thích với object reference
- Checked vs unchecked exception, thiết kế exception hierarchy cho service; khi nào wrap
- {{final}} / {{finally}} / {{finalize}}; vì sao finalize bị deprecate, {{Cleaner}} & try-with-resources
- Generics, type erasure, wildcard và PECS ({{? extends}} / {{? super}})
- Immutable class: cách thiết kế, defensive copy
- {{static}} nested vs inner class, memory leak do inner class giữ outer reference
- Serialization: {{serialVersionUID}}, rủi ro bảo mật của Java deserialization, giải pháp thay thế
- Reflection & annotation processing: chi phí, dùng ở đâu (Spring, Lombok)
- {{Object}} methods, {{clone()}} vs copy constructor
### collections (≥ 8 câu)
- HashMap internals: hash spreading, bucket, resize, load factor, treeify (Java 8)
- ConcurrentHashMap Java 8: CAS + synchronized trên bin, {{size()}}, vì sao không cho null
- ArrayList vs LinkedList: cache locality, khi nào LinkedList thực sự thắng
- fail-fast vs fail-safe iterator, {{ConcurrentModificationException}}
- LinkedHashMap làm LRU cache ({{removeEldestEntry}}, access-order)
- TreeMap/NavigableMap & Comparator nhất quán với equals
- {{CopyOnWriteArrayList}}, {{BlockingQueue}} implementations và use case
- Chọn collection cho 10 triệu phần tử: memory footprint, boxing, primitive collections
### modern (≥ 8 câu)
- Stream: lazy evaluation, stateful vs stateless op, khi nào parallel stream có hại (common ForkJoinPool)
- {{Optional}}: dùng đúng/sai (field, parameter, {{get()}})
- Record: đặc điểm, compact constructor, record làm DTO/JPA entity được không
- Sealed class + pattern matching for switch (Java 21), exhaustiveness
- Những tính năng đáng giá nhất từ Java 8 → 21 khi nâng cấp hệ thống; lộ trình migrate 8 → 17/21
- {{var}}, text block, switch expression: lợi ích & pitfall
- Functional interface, lambda capture "effectively final", method reference
- {{Collectors.groupingBy}}/{{toMap}} pitfalls (duplicate key, null value)

## Notes
(agent ghi chú ở đây)
