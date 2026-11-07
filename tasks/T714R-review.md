# T714R — Fact-check nội dung mới của T714

Status: DONE
Agent: opencode
Owns: `js/data/lessons-spring.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T714 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Đã fact-check toàn bộ `js/data/lessons-spring.js` (9 bài học, lesson-spring-001 → 009). Nội dung do model free viết ở HEAD (lesson-spring-008, lesson-spring-009) đã được kiểm tra kỹ lưỡng:

- **lesson-spring-008** (Auto-configuration và @Conditional): đúng về thứ tự đăng ký user-config trước auto-config, quy tắc `onProperty` (không phân biệt hoa thường vs "false"), `onPropertyValue` (so sánh chính xác, phân biệt hoa thường), `onMissingBean` (kiểm tra theo tên, tính tới lúc đó), và báo cáo `REGISTERED`/`SKIPPED` + mã lỗi. `explain` giải thích đúng ba quyết định Boot, các lỗi hay gặp (Set mất thứ order, equals thay equalsIgnoreCase, report cộng dồn). Các check question đều đúng kỹ thuật.
- **lesson-spring-009** (Spring Events và @TransactionalEventListener): đúng về IMMEDIATE chạy trong transaction, AFTER_COMMIT/AFTER_COMPLETION được xếp hàng, `fallbackExecution = false`, outbox. `explain` đúng ba quyết định, các lỗi hay gặp (queue chỉ lưu listener, forget clear, phase trộn). Các check question đều đúng.

**Lỗi đã sửa:**
- `lesson-spring-005` (line 440): `~~~ Giữ {{type}}...` — thiếu dòng kết thúc `~~~` riêng, làm parser nhầm code block vẫn đang mở. Đã thêm dòng `~~~` để kết thúc code block.

**Kiểm tra:** `node scripts/validate.js` → `OK — không có lỗi.` (chỉ còn cảnh báo đáp án ngắn ở file khác, không thuộc task). `node scripts/test-lessons.js` → `Lesson exercises OK: 158/158`. `node scripts/build-light-index.js` → ghi `js/data/index-light.js` thành công. Không thay đổi file core hay file của người khác.