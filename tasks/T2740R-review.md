# T2740R — Fact-check nội dung mới của T2740

Status: DONE
Agent: opencode
Owns: `js/data/labs-gc.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2740 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

- lab-gc-032: chuyển backtick → {{code}} trong `answer` (Phòng ngừa: new SXSSFWorkbook(), ByteArrayOutputStream, humongous, Pause Full (Allocation Failure), jvm_g1_humongous_count, byte[], SXSSFWorkbook, byte[]/void/HttpServletResponse, PipedOutputStream); sửa chữ nước ngoài "default危險" → "default nguy hiểm" trong Senior tip.
- lab-gc-033: chuyển backtick → {{code}} trong scenario, questions, hints, answer, rubric. Sửa lỗi kỹ thuật: GroovyClassLoader KHÔNG có field `loadedClasses: Vector<Class<?>>` (thực tế là `classCache`); `ClassLoader.close()`/`GroovyClassLoader.close()` (JDK 9+) KHÔNG unload class — class chỉ unload khi ClassLoader bị GC (đóng Góp Fix 2, hint, rubric, Senior tip). Sửa mẫu code: `getClass()` trong static initializer không biên dịch được → `RuleEngineService.class.getClassLoader()`.
- node scripts/validate.js: labs-gc.js không lỗi. Các lỗi còn lại (quiz-ops.js, lessons-modern.js, lessons-jpa.js, q-concurrency-jvm.js, q-spring-data.js, q-soft.js, path.js) nằm trong file khác, không thuộc quyền sở hữu task này nên không sửa.
- node --check js/data/labs-gc.js: OK. Không sửa nội dung đã có ở HEAD; không thêm/xoá mục lab.
