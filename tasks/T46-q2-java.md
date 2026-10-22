# T46 — Nội dung: Core Java, Collections, Java 8 → 21 (đợt 2)

Status: DONE
Agent: opencode
Owns: `js/data/q-java.js`

> **Ghi theo lô nhỏ:** thêm **2 câu mỗi lần edit** (đáp án dài). Sau mỗi lô chạy `node --check <file>` và `node scripts/validate.js <file>`.

Đọc kỹ `AGENTS.md` mục 4–6 (schema, markup, **chuẩn chất lượng**) trước khi viết.

## Mục tiêu
Ngân hàng câu hỏi đã có sẵn câu ở các topic dưới đây. **Chỉ THÊM câu mới vào cuối mảng**, không sửa/xoá câu cũ.
ID tiếp nối số lớn nhất đang có trong topic (ví dụ đang có `core-011` thì bắt đầu từ `core-012`).
**Đọc lướt câu hỏi đã có trong file trước** để không viết trùng ý.

### topic `core`: thêm 8 câu (đang có 11 → mục tiêu ≥ 19)
- BigDecimal cho tiền tệ: scale, RoundingMode, {{equals}} vs {{compareTo}}, vì sao không dùng double; pitfall {{new BigDecimal(0.1)}}
- Date/Time API: {{Instant}} vs {{LocalDateTime}} vs {{ZonedDateTime}} vs {{OffsetDateTime}}; lưu thời gian trong DB và bug timezone lúc nửa đêm (cut-off ngân hàng)
- Autoboxing: Integer cache (-128..127), {{==}} trên wrapper, NPE khi unboxing, chi phí boxing trong vòng lặp nóng
- try-with-resources: thứ tự đóng, suppressed exception, viết {{AutoCloseable}} đúng
- enum nâng cao: {{EnumMap}}/{{EnumSet}}, enum singleton, enum làm state machine, vì sao không persist bằng {{ordinal()}}
- Interface default/static/private method, diamond problem, khi nào chọn abstract class
- Java I/O vs NIO: buffer, channel, {{Files}} API, đọc file lớn theo stream, zero-copy {{transferTo}}
- String concat bằng {{+}} sau Java 9 (invokedynamic), {{StringBuilder}} khi nào thực sự cần, {{String.format}} chậm ra sao

### topic `collections`: thêm 6 câu (đang có 8 → mục tiêu ≥ 14)
- {{PriorityQueue}}: heap bên trong, bài toán top-K trên stream dữ liệu lớn, độ phức tạp
- {{ArrayDeque}} vs {{Stack}}/{{LinkedList}} làm stack/queue; vì sao {{Stack}} bị khuyên tránh
- {{List.of}} vs {{Collections.unmodifiableList}} vs copy: immutable thật hay chỉ là view; null và NPE
- {{WeakHashMap}}, {{IdentityHashMap}}: cơ chế và use case thật (cache theo key class, graph traversal)
- Sort trong Java: TimSort ổn định, {{Comparator.comparing().thenComparing()}}, nullsFirst, lỗi "Comparison method violates its general contract"
- Hash collision và tấn công HashDoS; vì sao treeify giúp; thiết kế {{hashCode}} tốt cho composite key

### topic `modern`: thêm 6 câu (đang có 8 → mục tiêu ≥ 14)
- SequencedCollection / SequencedMap (Java 21): giải quyết vấn đề gì, {{getFirst}}/{{reversed}}
- Record patterns và nested deconstruction trong switch (Java 21), guard {{when}}
- {{Stream.toList()}} vs {{collect(Collectors.toList())}} vs {{toUnmodifiableList}}: khác biệt mutability
- {{java.net.http.HttpClient}} (Java 11+): sync/async, timeout, HTTP/2, so với RestTemplate/RestClient
- Helpful NullPointerException, {{instanceof}} pattern matching, các cải tiến nhỏ đáng biết từ 9 → 21
- Scoped values và structured concurrency (preview ở 21): khác ThreadLocal ở đâu, dùng với virtual threads

## Yêu cầu chất lượng (quan trọng nhất)
- Mỗi đáp án **1500–4000 ký tự**: `**Tóm tắt:**` trả lời miệng 30 giây, rồi các mục `###` giải thích cơ chế **và vì sao**, ví dụ code ngắn có comment, bảng trade-off, pitfall production, kết bằng `> Senior tip:`.
- Câu hỏi theo kiểu phỏng vấn thật (tình huống, so sánh, "bạn sẽ làm gì"), không hỏi định nghĩa suông. Bối cảnh ưu tiên ngân hàng, fintech, e-commerce Việt Nam.
- Đúng kỹ thuật với Java 17/21, Spring Boot 3.x, Hibernate 6. **Không bịa API, flag hay số liệu**; không chắc thì viết ít lại nhưng đúng.
- `follow`: 2–3 câu hỏi đào sâu. Level xen kẽ: khoảng 25% mid, 55% senior, 20% lead.

## Nghiệm thu
`node scripts/validate.js` → OK và số câu mỗi topic đạt mục tiêu. Integrator sẽ fact-check sau.

## Notes
- Hoàn thành bởi agent Claude (model free hết suất). modern dừng ở 16 vì scoped values/structured concurrency đã có ở topic concurrency.
