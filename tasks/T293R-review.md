# T293R — Fact-check nội dung mới của T293

Status: DONE
Agent: opencode
Owns: `js/data/lessons-spring.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T293 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Đã review nội dung mới T293: `lesson-spring-012`, `lesson-spring-013` (phần thêm so với HEAD). Không sửa lesson-011/HEAD.
- `lesson-spring-012` (AOP interceptor/@Order/@Transactional vs @Retryable):
  - Sửa nội dung draft bị sai/không rõ và có ký tự rác padding (`X...`, `W/Z/Y...`), lẫn tiếng Anh thô trong body ("Actually retry...", câu hỏi mơ hồ). Viết lại body đúng kỹ thuật, giải thích từng bước cho người mới (AOP/proxy/interceptor/proceed/@Order), dùng thuật ngữ có giải thích ngắn.
  - Làm rõ quy tắc order: giá trị nhỏ hơn ưu tiên cao hơn/thường nằm ngoài; nhấn mạnh không dựa mặc định khi hành vi phụ thuộc thứ tự; hướng dẫn cấu hình order tường minh (`@EnableRetry(order=...)`, `@EnableTransactionManagement(order=...)`). Tránh khẳng định cứng một mặc định phiên bản cụ thể; mô tả đúng hai kịch bản "retry ngoài/tx trong" vs "tx ngoài/retry trong" và hệ quả rollback/transaction bẩn/rollback-only.
  - Thêm bẫy chuẩn: quên `proceed()`, self-invocation (`this...` bỏ qua proxy), retry trong transaction bẩn/rollback-only, nuốt exception, đoán order.
  - Sửa exercise không chạy được: starter/reference/tests dùng interface `Invocation`/`Interceptor` chưa nhất quán, reference dùng `Proxy` không import/thiếu unwrap, test không assert và thiếu type hỗ trợ. Thay bằng bài tập Java thuần (JDK reflect Proxy) biên dịch được: `Around`/`Invocation`/`Aop.wrap` + target `CounterOps`/`CounterImpl` có `failTimes`; tests kiểm tra thứ tự U-shape, retry gọi lại `proceed()` (target 3 lần), và "no proceed" không gọi target (3 case, deterministic).
  - Fix reference `Invocation.proceed()`: unwrap `InvocationTargetException` (`throw e.getCause()`) để retry interceptor bắt đúng `RuntimeException` gốc (nguyên nhân test fail ban đầu: `UndeclaredThrowableException`/wrapped).
- `lesson-spring-013` (vòng đời bean/BeanPostProcessor/proxy):
  - Xóa padding rác `W/Z/Y...` và đoạn lặp vô nghĩa trong body; viết lại đầy đủ, rõ thứ tự: instantiate → populate → Aware → BPP before → init (@PostConstruct/InitializingBean/init-method) → BPP after (proxy) → ready/destruction.
  - Khẳng định đúng kỹ thuật (Spring Boot 3.x/Java 17): BPP after có thể trả proxy (thay bean); `@PostConstruct` chạy bước init trước BPP after và self-invocation bỏ qua proxy → gọi `@Transactional/@Async` nội bộ từ init dễ không áp dụng; nêu JDK proxy/CGLIB đúng mức thận trọng.
  - Sửa exercise không biên dịch/không kiểm tra: thêm type hỗ trợ rõ ràng (`NamedAware`, `Init`, `BeanPostProcessor`, `Work`, `MyService`, `WrapBpp`), `MiniContainer.createBean(clazz, log)` ghi log đúng đặc tả; BPP after trả JDK proxy cho `Work`. Tests 3 case: proxy được dùng (`proxy>real:x:MyService` + `Proxy.isProxyClass`), đúng thứ tự lifecycle, không BPP vẫn chạy aware/init và trả bean thật.
- Kiểm tra/ghi nhận: `node --check js/data/lessons-spring.js` OK; `node scripts/test-lessons.js lesson-spring-012` OK (1/1); `node scripts/test-lessons.js lesson-spring-013` OK (1/1); `node scripts/validate.js` → kết thúc `OK — không có lỗi.` (còn warning/lỗi pre-existing ở file khác ngoài phạm vi sở hữu, không sửa). Không sửa nội dung HEAD ngoài phần join object mới; không git commit.
