# T827R — Fact-check nội dung mới của T827

Status: DONE
Agent: opencode
Owns: `js/data/q-java.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T827 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Chỉ sửa `js/data/q-java.js` (phần mới của T827: core-036..038, collections-031..035) và chạy `node scripts/build-light-index.js` (yêu cầu khi sửa câu hỏi). Không sửa nội dung đã có ở HEAD, không thêm/xoá mục.
- `core-036`: thêm giải thích thuật ngữ lần đầu (JIT/C2/TLAB/interpreter/C1/IR/inlining/register/materialize/JLS/JMH/profiler/warmup/monomorphic/lock elision/biased locking/retained size/JFR). Làm rõ lock elision/biased locking: HotSpot/C2 không áp dụng rộng rãi như tối ưu đáng tin; biased locking tắt mặc định JDK 15, loại bỏ ở các bản sau (tránh phát biểu mơ hồ "có tồn tại trong thiết kế").
- `core-037`: giải thích `invokedynamic`/bootstrap/MethodHandle/`Method.invoke`/type erasure/bridge method/hidden class/Metaspace/CallSite/constant-fold/devirtualize/type adaptation/boxing/dispatch/flame graph. Nội dung kỹ thuật (LambdaMetafactory, JEP 371 hidden class JDK 15, reflection trên MethodHandle từ JDK 18) giữ nguyên, đúng hướng.
- `core-038`: **Sửa lỗi markup** gây validator fail: inline code `{{static { ... }}}` chứa `{}` lồng nhau → đổi thành mô tả `khối {{static}}...`. Thêm giải thích ClassLoader/constant pool/happens-before/JMM/jstack/DAG/`@PostConstruct`/`InitializingBean`. Nội dung JLS 12.4.2, re-entrant init lock, `ExceptionInInitializerError` rồi `NoClassDefFoundError` không cause: đúng.
- `collections-031`: thêm giải thích bucket/hash collision/load factor/compressed oops; giải thích humongous allocation, warm-up, young GC.
- `collections-032`: thêm giải thích Spliterator/ForkJoinPool work-stealing/pointer chase/cache miss.
- `collections-033`: **Làm rõ cơ chế lookup khi hash bằng nhau & key không Comparable**: chèn dùng `tieBreakOrder` O(log n), nhưng `get/containsKey` không dùng `compareTo` để xác định nhánh duy nhất nên có thể phải dò thêm nhánh (tránh phát biểu tuyệt đối "get phải quét O(n)" gây hiểu sai; vẫn nêu worst case xấu đi đáng kể, phù hợp Javadoc "đảm bảo O(log n) cần Comparable"). Thêm giải thích red-black tree/Comparable/identityHashCode/HashDoS.
- `collections-034`: nội dung kỹ thuật kiểm tra (modCount non-volatile, best-effort fail-fast, `set`/`put` existing key không tăng modCount, `entrySet().setValue`/`replaceAll`/`computeIfPresent`, `removeIf` tăng modCount 1 lần, for-index remove bỏ sót phần tử) — đúng. Không cần sửa logic.
- `collections-035`: **Sửa benchmark minh hoạ sai** `addMiddleArray/addMiddleLink` (tự làm hỏng `n`/trạng thái list qua các iteration) → đổi thành tạo copy list mới mỗi lần kèm chú thích `@Setup(Level.Invocation)` cho phép đo thật; thêm `Blackhole` param. Thêm giải thích `@Fork`/Blackhole/constant folding/`@Setup(Level.Invocation)`.
- Kiểm tra: `node --check js/data/q-java.js` OK; `node scripts/build-light-index.js` OK; `node scripts/validate.js` → `OK — không có lỗi.` (còn cảnh báo độ dài `core-035`, `modern-031..035/037/038` và các file khác không thuộc T827 phần mới/không thuộc quyền sở hữu — không sửa).
