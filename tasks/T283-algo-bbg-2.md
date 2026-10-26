# T283 — Thuật toán ByteByteGo (phần 2): bài có test Java tự chấm

Status: DONE
Agent: opencode
After: T282
Owns: `js/data/algo.js`

Đọc AGENTS.md mục 4 (ALGOS) + mục 9 (`starter`, `tests`) và `tasks/T18-algo-tests.md`; xem 3 bài có sẵn có `tests` để làm đúng format. Thêm vào cuối `window.ALGOS` các bài sau (id tiếp nối số lớn nhất). **Trước khi viết, liệt kê title có sẵn bằng node — bài nào đã có (cùng bài khác tên cũng tính) thì BỎ QUA** và ghi vào Notes. `pattern` dùng đúng tên chương in đậm bên dưới, `tags` thêm `'bytebytego'`.

- **Top K Elements:** Kth Largest Number in a Stream; Top K Frequent Numbers; K Closest Points to Origin; Kth Smallest Number in a Sorted Matrix; Frequency Sort
- **0/1 Knapsack (DP):** 0/1 Knapsack; Subset Sum; Equal Subset Sum Partition; Minimum Subset Sum Difference; Count of Subset Sum; Target Sum
- **Fibonacci Numbers (DP):** Staircase Problem; House Robber; House Robber II; Minimum Cost to Climb Stairs; Decode Ways

Mỗi bài: prompt (### Ví dụ ~~~text, ### Ràng buộc), ≥ 3 hints tăng dần, solution (### Ý tưởng, ~~~java có comment, ### Lưu ý khi phỏng vấn), complexity, starter (class Solution + chữ ký), tests ≥ 4 case gồm edge case. `node scripts/test-algos.js` và `node scripts/validate.js` → OK, rồi `Status: DONE`.

## Notes

- Liệt kê title sẵn có trước khi viết; **bỏ qua 2 bài đã có dưới tên khác**:
  - *Top K Frequent Numbers* ≈ algo-070 "Top K Frequent Integers" (cùng bài top-k theo tần suất).
  - *Staircase Problem* ≈ algo-035 "Climbing Stairs" (n bậc, đi 1 hoặc 2, đếm số cách).
- Thêm **14 bài** vào cuối `window.ALGOS` (id tiếp nối, `tags` gồm `'bytebytego'`):
  - `pattern: 'Top K Elements'`: algo-092 Kth Largest Number in a Stream (design min-heap, easy),
    algo-093 K Closest Points to Origin, algo-094 Kth Smallest Number in a Sorted Matrix (binary search trên giá trị),
    algo-095 Frequency Sort (heap; harness tự kiểm tra tính hợp lệ vì đáp án không duy nhất).
  - `pattern: '0/1 Knapsack (DP)'`: algo-096 0/1 Knapsack, algo-097 Subset Sum, algo-098 Equal Subset Sum Partition,
    algo-099 Minimum Subset Sum Difference, algo-100 Count of Subset Sum, algo-101 Target Sum (quy về subset sum qua P = (sum+target)/2).
  - `pattern: 'Fibonacci Numbers (DP)'`: algo-102 House Robber, algo-103 House Robber II (hai lượt tuyến tính),
    algo-104 Minimum Cost to Climb Stairs (easy), algo-105 Decode Ways.
- Mỗi bài đủ field: prompt (### Ví dụ ~~~text + ### Ràng buộc), ≥ 3 hints tăng dần, solution
  (### Ý tưởng + ~~~java comment ASCII + ### Lưu ý + > Senior tip), complexity, follow, starter (class Solution hoặc
  class thiết kế + chữ ký compile được), tests ≥ 5 case (edge: rỗng/không phân biệt hoa thường/không thể/0/đầu cuối)
  in `PASS/FAIL/RESULT`, Java 11-compatible (không record/text block/switch expression).
- Kỳểm chứng: `node scripts/test-algos.js <id>` từng bài mới đều pass (092:5/5, 093:6/6, 094:7/7, 095:8/8, 096:8/8,
  097:10/10, 098:7/7, 099:7/7, 100:7/7, 101:8/8, 102:8/8, 103:8/8, 104:7/7, 105:13/13);
  `node scripts/test-algos.js` → `Harness OK: 105 · lỗi: 0 · chưa có tests: 0`;
  `node scripts/validate.js` → **không còn lỗi nào của algo.js**.
- Trong lúc chạy có xuất hiện lỗi validate ở `js/data/lessons-devops.js` (placeholder `... exercises ...` khiến parse hỏng)
  và `path.js` (path-09 trỏ lesson-devops chưa tồn tại) — file thuộc task khác đang chỉnh sửa song song,
  **không thuộc ownership T283**, đã không động tới (tuân thủ luật 3 AGENTS.md).
