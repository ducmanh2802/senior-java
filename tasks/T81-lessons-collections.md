# T81 — Bài học: Collections

Status: DONE
Agent: opencode
Owns: `js/data/lessons-collections.js`

> **Ghi theo lô nhỏ:** viết **1 bài học mỗi lần edit** (bài dài). Sau mỗi bài chạy `node --check js/data/lessons-collections.js`, `node scripts/validate.js lessons-collections.js` và `node scripts/test-lessons.js` (biên dịch thật bằng JDK).

Đọc **AGENTS.md mục 12** và bài mẫu **`lesson-collections-001`** trong `js/data/lessons-collections.js` trước khi viết; viết theo đúng phong cách và độ kỹ của bài mẫu.

## Mục tiêu
Viết **4 bài học** cho track `collections`, `order` từ 2, ID `lesson-collections-002` trở đi:
2. ArrayList bên trong: mảng động, grow 1.5 lần, độ phức tạp từng thao tác, vì sao remove giữa danh sách chậm — bài tập: viết MiniArrayList có add/get/remove và kiểm tra resize
3. ConcurrentHashMap: CAS + khoá theo bin, compute/merge nguyên tử, vì sao không cho null — bài tập: đếm tần suất từ bằng merge từ nhiều thread, so với HashMap bị mất cập nhật
4. TreeMap/NavigableMap và Comparator nhất quán với equals — bài tập: tra cứu biểu phí theo bậc số tiền bằng floorEntry
5. PriorityQueue/heap và Deque — bài tập: top-K giao dịch lớn nhất trong luồng dữ liệu, và sliding window bằng ArrayDeque

## Yêu cầu
- `body` ≥ 2500 ký tự, dạy như cho người chưa biết: cơ chế bên trong **và vì sao**, ví dụ code ngắn có comment, bảng so sánh, lỗi production hay gặp, kết bằng `### Liên hệ phỏng vấn`.
- Mỗi bài 1–2 bài tập; test ≥ 3 case, có cả edge case; reference pass 100%; starter biên dịch được và trượt test.
- Đúng kỹ thuật Java 17/21 (Spring Boot 3.x, Hibernate 6 cho phần giải thích). Không bịa API/số liệu. Không viết lẫn ngôn ngữ khác (validator chặn).
- `related`: chỉ id câu hỏi có thật (tra trong `js/data/q-*.js`).

## Nghiệm thu
`node scripts/validate.js` → OK và `node scripts/test-lessons.js` → tất cả bài tập OK. Integrator sẽ fact-check.

## Notes
- Hoàn thành bởi agent Claude: lesson-collections-002..005, 9/9 bài tập pass (chạy 3 lần, không flaky).
Verify-failed: legacy — đã commit từ trước, autopilot bỏ qua
