# T1527R — Fact-check nội dung mới của T1527

Status: DONE
Agent: opencode
Owns: `js/data/q-system-design.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1527 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

- design-037 (SOLID): nội dung đúng, giải thích S/O/L/I/D bằng ví dụ service thanh toán. Không lỗi kiến thức.
- design-038 (Strategy): đúng, giải thích inject List<FeeStrategy> → Map, stateless, key trùng. Không lỗi.
- design-039 (Factory/Builder): đúng, bảng chọn constructor/static factory/builder, cảnh giác Lombok @Builder trên entity JPA. Không lỗi.
- design-040 (Observer/Spring event): đúng, phân biệt @EventListener và @TransactionalEventListener(AFTER_COMMIT), @Async, Transactional Outbox. Không lỗi.
- design-041 (Composition over inheritance): đúng, ví dụ PricingService ghép DiscountPolicy + ShippingPolicy. Không lỗi.
- design-042 (God class/Anemic Domain Model): đúng, cách refactor từng bước, không rich domain cực đoan. Không lỗi.

Không có lỗi markup (không có backtick, không có `${` trong template literal). Không có lỗi kỹ thuật.
