# T86 — Bài học: JPA / Hibernate

Status: DONE
Agent: opencode
Owns: `js/data/lessons-jpa.js`

> **Ghi theo lô nhỏ:** viết **1 bài học mỗi lần edit** (bài dài). Sau mỗi bài chạy `node --check js/data/lessons-jpa.js`, `node scripts/validate.js lessons-jpa.js` và `node scripts/test-lessons.js` (biên dịch thật bằng JDK).

Đọc **AGENTS.md mục 12** và bài mẫu **`lesson-collections-001`** trong `js/data/lessons-collections.js` trước khi viết; viết theo đúng phong cách và độ kỹ của bài mẫu.

## Mục tiêu
Viết **5 bài học** cho track `jpa`, `order` từ 1, ID `lesson-jpa-001` trở đi:
1. Persistence context và dirty checking — bài tập: mô phỏng first-level cache + snapshot để tự sinh câu UPDATE chỉ cho field thay đổi
2. N+1 query — bài tập: với một 'repository' đếm số query, viết lại cách tải đơn hàng + dòng hàng để từ N+1 về 2 query (batch theo id)
3. Optimistic locking với @Version — bài tập: mô phỏng update có điều kiện version và xử lý xung đột bằng retry
4. Fetch LAZY/EAGER và LazyInitializationException — bài tập: mô phỏng proxy lười tải, ném lỗi khi 'session' đã đóng
5. Batch insert và sinh ID (IDENTITY vs SEQUENCE pooled) — bài tập: mô phỏng bộ cấp ID pooled (allocationSize) và đếm số round-trip

## Yêu cầu
- `body` ≥ 2500 ký tự, dạy như cho người chưa biết: cơ chế bên trong **và vì sao**, ví dụ code ngắn có comment, bảng so sánh, lỗi production hay gặp, kết bằng `### Liên hệ phỏng vấn`.
- Mỗi bài 1–2 bài tập; test ≥ 3 case, có cả edge case; reference pass 100%; starter biên dịch được và trượt test.
- Đúng kỹ thuật Java 17/21 (Spring Boot 3.x, Hibernate 6 cho phần giải thích). Không bịa API/số liệu. Không viết lẫn ngôn ngữ khác (validator chặn).
- `related`: chỉ id câu hỏi có thật (tra trong `js/data/q-*.js`).

## Nghiệm thu
`node scripts/validate.js` → OK và `node scripts/test-lessons.js` → tất cả bài tập OK. Integrator sẽ fact-check.

## Notes

- Đã hoàn thành 5 bài `lesson-jpa-001`…`005`, mỗi bài có body ≥ 2500 ký tự, exercise Java 17 và check nhanh.
- `node --check js/data/lessons-jpa.js` thành công. Validator không báo lỗi cho lessons-jpa; toàn repo vẫn lỗi cú pháp có sẵn tại `js/data/lessons-modern.js:466` (dấu nháy thừa trong `explain`). Vì vậy `node scripts/validate.js` chưa thể in OK.
- `node scripts/test-lessons.js` cũng dừng khi require cùng file lessons-modern.js. Đã kiểm tra riêng cả 5 bài: reference biên dịch và qua toàn bộ test; starter của cả 5 bài biên dịch.
Reviewed-by: codex (T86R)
