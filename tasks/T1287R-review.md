# T1287R — Fact-check nội dung mới của T1287

Status: DONE
Agent: opencode
Owns: `js/data/q-kotlin.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1287 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- `node --check js/data/q-kotlin.js` OK.
- `node scripts/validate.js` không còn lỗi nào thuộc `q-kotlin.js` (các lỗi còn lại trong output thuộc `q-system-design.js`, `lessons-testing.js` — ngoài phạm vi sở hữu của task này, không sửa).

### Lỗi đã sửa (theo id, chỉ nội dung mới của T1287 diff)
- `kotlin-022` (Data class Kotlin vs Java record trong JPA/Hibernate): sửa section ví dụ đời thực bị gán sai cơ chế/triệu chứng.
  - Bỏ `ConcurrentModificationException` khi "duyệt {{customer.orders}}" (không tự nhất quán với bối cảnh: CME khi sửa collection trong lúc iterate, còn ví dụ mô tả equals/hashCode/lazy/id/hashSet).
  - Sửa "mỗi lần thêm order mới vào {{HashSet}} phát sinh truy vấn ... cho các order cũ (N+1)": mô tả N+1 không đúng cơ chế `HashSet.add`/`equals/hashCode`; thay bằng giải thích đúng: equals/hashCode chạm `items` (lazy) khi thêm/so sánh phần tử, có thể phát sinh truy vấn/lỗi lazy ngoài session/transaction; vẫn giữ số liệu/symptom hợp lý và liên hệ N+1 ở mức truy vấn tăng, không khẳng định sai "query cho order cũ".
  - Chuẩn hóa heading: `### Ví dụ đời thực` → `### 6. Ví dụ đời thực`, `### Trả lời mẫu khi phỏng vấn` → `### 7. Trả lời mẫu khi phỏng vấn` (đồng bộ đánh số section với mục 5).
  - Cập nhật câu "Trả lời mẫu" để khớp cơ chế đã sửa (lỗi lazy ngoài ý muốn, không gán cứng N+1 sai ngữ cảnh).
- `kotlin-025` (Flow vs Project Reactor): sửa typo markup trong ví dụ đời thực — `{{Flow<Price>>}}` → `{{Flow<Price>}}` (thừa dấu `>` làm sai biểu diễn generic inline code).

### Xác nhận không sửa (đã rà soát, hợp lý kỹ thuật)
- `kotlin-021`: platform type/JSR-305/JSpecify, `-Xjsr305=strict`, `String?`/`String!`, `takeIf`, ví dụ ELK/Micrometer requestId/500 — phù hợp Kotlin 1.9/Spring Boot 3 context mô tả; số liệu có nhãn "ví dụ/khoảng", không bịa API cụ thể ngoài thực tế.
- `kotlin-023`: extension resolve compile-time, `@file:JvmName`, `javap -c`/Detekt — đúng.
- `kotlin-024`: `kotlin-spring`/`kotlin-jpa` (all-open/no-arg), CGLIB proxy, `@Transactional` bypass khi final/proxy, `logging.level.org.springframework.transaction=TRACE`, `LazyInitializationException` — đúng Spring Boot 3/Hibernate 6.
- `kotlin-025` (còn lại): Flow cold/collect, `asFlux()`/`asFlow()`, `StateFlow` conflation, `SharedFlow` buffer/overflow, SSE/WebFlux — đúng; bridge context gợi `kotlinx-coroutines-reactor` hợp lý.
- `kotlin-026`: chiến lược strangler fig, KSP/kapt, `-Xjsr305=strict`, `kotlin-spring`/`kotlin-jpa`, `jackson-module-kotlin`, `javaParameters`, `@JvmStatic/@JvmName/@JvmOverloads` — đúng, không bịa flag/API.
