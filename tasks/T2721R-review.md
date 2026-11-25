# T2721R — Fact-check nội dung mới của T2721

Status: DONE
Agent: opencode
Owns: `js/data/q-scenario.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2721 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Đã sửa 3 câu hỏi mới (scenario-188, scenario-189, scenario-190):

**scenario-188 (Spring @Transactional self-invocation):**
- Xoá "Spring Modulith @ApplicationModule" khỏi danh sách cách khắc phục — Modulith dùng để verify module boundary (ArchUnit), KHÔNG fix self-invocation AOP.
- Sửa "@Transactional trên interface": chỉ hoạt động với JDK dynamic proxy (interface-based), KHÔNG hoạt động với CGLIB (class-based proxy mặc định).
- Sửa giải thích readOnly trên self-invocation: không mở transaction nào (auto-commit), readOnly vô hiệu; không phải "stale data" theo nghĩa repeatable read.
- Sửa ArchUnit rule: API đúng là `methodCalls().whereTargetIsAnnotatedWith(...)` chứ không phải `methods().that().areAnnotatedWith(...)`; thêm cảnh báo flag cả gọi từ method @Transactional khác trong cùng class.
- Đánh dấu rõ self-injection là hack, chỉ dùng hotfix.

**scenario-189 (Cache stampede / thundering herd):**
- Sửa Jitter TTL: `nextLong(-60, 60)` upper bound exclusive → đổi thành `nextLong(-60, 61)` cho đúng ±60s.
- Sửa single-flight code: `inflight.remove(k)` trong finally thay vì `inflight.remove(k, future)` (biến future trong lambda capture có race condition); thêm cleanup trong catch block.
- Sửa stale-while-revalidate: check `getExpire` trả về -2/-1 (key không tồn tại/không TTL) trước khi so sánh < 60.
- Sửa ví dụ đời thực: 6 pod single-flight → ~6 req/s tổng (không phải ~1/s); cache warming nạp key với TTL đè lên 600s.
- Ghi chú `waitAndRead` là placeholder cần implement.

**scenario-190 (Saga pattern):**
- Sửa câu hỏi: làm rõ Payment.fail SAU khi Inventory.reserve thành công (do Payment có 2 phase: reserve + charge async).
- Sửa ví dụ đời thực: Payment.charge fail (thẻ hết hạn), Payment.reserve đã void tự động → compensation chỉ cần Inventory.release + Order.cancel.
- Giữ nguyên logic compensation code (đã check `paymentId != null` trước khi refund/void).
