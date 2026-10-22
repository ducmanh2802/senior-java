# T83 — Bài học: Java 8 → 21

Status: TODO
Agent: opencode
Owns: `js/data/lessons-modern.js`

> **Ghi theo lô nhỏ:** viết **1 bài học mỗi lần edit** (bài dài). Sau mỗi bài chạy `node --check js/data/lessons-modern.js`, `node scripts/validate.js lessons-modern.js` và `node scripts/test-lessons.js` (biên dịch thật bằng JDK).

Đọc **AGENTS.md mục 12** và bài mẫu **`lesson-collections-001`** trong `js/data/lessons-collections.js` trước khi viết; viết theo đúng phong cách và độ kỹ của bài mẫu.

## Mục tiêu
Viết **5 bài học** cho track `modern`, `order` từ 1, ID `lesson-modern-001` trở đi:
1. Stream: lazy, stateless/stateful, collectors groupingBy/toMap/partitioningBy — bài tập: thống kê giao dịch theo khách hàng và tháng
2. Optional đúng cách — bài tập: refactor chuỗi null-check lồng nhau thành Optional mà không dùng get()
3. Record, sealed interface và pattern matching for switch (Java 21) — body dạy switch pattern của Java 21; **bài tập phải biên dịch với Java 17**: mô hình hoá lệnh thanh toán (Card/Transfer/Wallet) bằng sealed + record và tính phí bằng `instanceof` pattern (Java 16+)
4. Lambda, functional interface, method reference, compose — bài tập: pipeline kiểm tra hợp lệ bằng Predicate.and/or
5. java.time: Instant/LocalDate/ZonedDateTime, timezone, cut-off ngân hàng — bài tập: tính ngày giá trị (value date) bỏ qua cuối tuần và giờ cut-off 16:00 giờ Việt Nam

## Yêu cầu
- `body` ≥ 2500 ký tự, dạy như cho người chưa biết: cơ chế bên trong **và vì sao**, ví dụ code ngắn có comment, bảng so sánh, lỗi production hay gặp, kết bằng `### Liên hệ phỏng vấn`.
- Mỗi bài 1–2 bài tập; test ≥ 3 case, có cả edge case; reference pass 100%; starter biên dịch được và trượt test.
- Đúng kỹ thuật Java 17/21 (Spring Boot 3.x, Hibernate 6 cho phần giải thích). Không bịa API/số liệu. Không viết lẫn ngôn ngữ khác (validator chặn).
- `related`: chỉ id câu hỏi có thật (tra trong `js/data/q-*.js`).

## Nghiệm thu
`node scripts/validate.js` → OK và `node scripts/test-lessons.js` → tất cả bài tập OK. Integrator sẽ fact-check.

## Notes
