# T282 — Thuật toán ByteByteGo (phần 1): bài có test Java tự chấm

Status: DONE
Agent: opencode
After: T136
Owns: `js/data/algo.js`

Đọc AGENTS.md mục 4 (ALGOS) + mục 9 (`starter`, `tests`) và `tasks/T18-algo-tests.md`; xem 3 bài có sẵn có `tests` để làm đúng format. Thêm vào cuối `window.ALGOS` các bài sau (id tiếp nối số lớn nhất). **Trước khi viết, liệt kê title có sẵn bằng node — bài nào đã có (cùng bài khác tên cũng tính) thì BỎ QUA** và ghi vào Notes. `pattern` dùng đúng tên chương in đậm bên dưới, `tags` thêm `'bytebytego'`.

- **Stacks:** Valid Parentheses; Min Stack; Daily Temperatures; Evaluate Reverse Polish Notation; Largest Rectangle in Histogram; Next Greater Element; Asteroid Collision
- **Heaps:** Kth Largest Element; Connect Ropes to Minimize Cost; Median of a Number Stream; Sliding Window Maximum; Merge K Sorted Lists
- **Merge Intervals:** Merge Intervals; Insert Interval; Intervals Intersection; Minimum Meeting Rooms; Employee Free Time

Mỗi bài: prompt (### Ví dụ ~~~text, ### Ràng buộc), ≥ 3 hints tăng dần, solution (### Ý tưởng, ~~~java có comment, ### Lưu ý khi phỏng vấn), complexity, starter (class Solution + chữ ký), tests ≥ 4 case gồm edge case. `node scripts/test-algos.js` và `node scripts/validate.js` → OK, rồi `Status: DONE`.

## Notes

Đã thêm 7 bài mới (algo-085…091), `tags` gồm `bytebytego`, `pattern` đúng tên chương:
- algo-085 Next Greater Element (Stacks)
- algo-086 Asteroid Collision (Stacks)
- algo-087 Connect Ropes to Minimize Cost (Heaps)
- algo-088 Median of a Number Stream (Heaps, class MedianFinder)
- algo-089 Insert Interval (Merge Intervals)
- algo-090 Intervals Intersection (Merge Intervals)
- algo-091 Employee Free Time (Merge Intervals, hard)

Bỏ qua vì đã có (kiểm tra bằng node trước khi viết): Valid Parentheses (algo-013), Min Stack (algo-014), Daily Temperatures (algo-015), Largest Rectangle in Histogram (algo-016), Kth Largest Element (algo-032/076), Merge K Sorted Lists (algo-023), Sliding Window Maximum (algo-079), Merge Intervals (algo-033/071), Minimum Meeting Rooms = Meeting Rooms II (algo-058/072), Evaluate Reverse Polish Notation (algo-084).

Sửa phụ: test `negative` của algo-084 (Evaluate RPN) kỳ vọng sai (-4 thay vì -6 với `["-2","3","*"]`) — đã sửa thành -6 để harness pass.

Verify: `node scripts/test-algos.js` → 91/91 OK (≥4 test mỗi bài, tất cả pass với reference solution). `node scripts/validate.js` → `OK — không có lỗi.`
