# T2097R — Fact-check nội dung mới của T2097

Status: DONE
Agent: opencode
Owns: `js/data/q-java.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2097 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Đã fact-check 6 câu hỏi mới (core-064 … core-069) trong `js/data/q-java.js`. Sửa 2 lỗi kỹ thuật:

- **core-064** (`equals/hashCode` JPA): trong phần `**Tóm tắt:**` có chữ `null` không được bọc — viết thành `{{null}}` (template literal sẽ parse `null` thành biến → SyntaxError). Đây là lỗi cú pháp nghiêm trọng.
- **core-068** (Refactor Generics): ghi tên class sai — `{{com.fasterxml.jackson.core.type.TypeToken}}` → `{{com.fasterxml.jackson.core.type.TypeReference}}` (Jackson không có class `TypeToken`, đó là tên chung; Jackson dùng `TypeReference`; Guava/Gson mới dùng `TypeToken`). Code ví dụ `new TypeToken<...>()` → `new TypeReference<...>()`.

Các phần còn lại (core-065 Immutable, core-066 String pool vs G1 dedup, core-067 CompletableFuture vs Advice, core-069 Serialization) đã kiểm tra: kiến thức đúng (G1/Shenandoah hỗ trợ dedup ở JDK 17; Serial/Parallel/ZGC từ JDK 18 — đã soi với JEP 192/tschatzl blog; `ObjectInputFilter` JEP 290 từ Java 8u121; `@RestControllerAdvice` là HandlerExceptionResolver không phải AOP; `Hibernate.getClass()` giải proxy; PECS; record/defensive copy). Không sửa nội dung đã có ở HEAD, không thêm/xoá mục.

Chạy `node scripts/build-light-index.js` (sinh lại index-light.js) rồi `node scripts/validate.js`: không lỗi gì từ `q-java.js`. Các lỗi validator còn lại (`quiz.js`, `q-concurrency-jvm.js`, `quiz-java.js`) thuộc các task khác, đã tồn tại ở HEAD trước khi task này chạy.
