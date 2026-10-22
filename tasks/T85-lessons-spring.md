# T85 — Bài học: Spring & Spring Boot

Status: TODO
Agent: opencode
Owns: `js/data/lessons-spring.js`

> **Ghi theo lô nhỏ:** viết **1 bài học mỗi lần edit** (bài dài). Sau mỗi bài chạy `node --check js/data/lessons-spring.js`, `node scripts/validate.js lessons-spring.js` và `node scripts/test-lessons.js` (biên dịch thật bằng JDK).

Đọc **AGENTS.md mục 12** và bài mẫu **`lesson-collections-001`** trong `js/data/lessons-collections.js` trước khi viết; viết theo đúng phong cách và độ kỹ của bài mẫu.

## Mục tiêu
Viết **5 bài học** cho track `spring`, `order` từ 1, ID `lesson-spring-001` trở đi:
1. IoC/DI: container làm gì — bài tập: tự viết MiniContainer đăng ký bean singleton, inject qua constructor, phát hiện vòng phụ thuộc
2. AOP và proxy: vì sao self-invocation bỏ qua @Transactional — bài tập: dùng java.lang.reflect.Proxy bọc một service để log/đo thời gian, chứng minh gọi nội bộ không đi qua proxy
3. @Transactional: propagation REQUIRED vs REQUIRES_NEW, rollback rules — bài tập: mô phỏng TransactionManager đơn giản với commit/rollback theo loại exception
4. Bean lifecycle và scope (singleton/prototype) — bài tập: mô phỏng scope và callback init/destroy theo đúng thứ tự
5. Spring MVC request flow, validation và ProblemDetail — bài tập: viết dispatcher nhỏ map URL → handler, validate input và trả lỗi theo cấu trúc ProblemDetail

## Yêu cầu
- `body` ≥ 2500 ký tự, dạy như cho người chưa biết: cơ chế bên trong **và vì sao**, ví dụ code ngắn có comment, bảng so sánh, lỗi production hay gặp, kết bằng `### Liên hệ phỏng vấn`.
- Mỗi bài 1–2 bài tập; test ≥ 3 case, có cả edge case; reference pass 100%; starter biên dịch được và trượt test.
- Đúng kỹ thuật Java 17/21 (Spring Boot 3.x, Hibernate 6 cho phần giải thích). Không bịa API/số liệu. Không viết lẫn ngôn ngữ khác (validator chặn).
- `related`: chỉ id câu hỏi có thật (tra trong `js/data/q-*.js`).

## Nghiệm thu
`node scripts/validate.js` → OK và `node scripts/test-lessons.js` → tất cả bài tập OK. Integrator sẽ fact-check.

## Notes
