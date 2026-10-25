# T283 — Thuật toán ByteByteGo (phần 2): bài có test Java tự chấm

Status: TODO
Agent: opencode
After: T282
Owns: `js/data/algo.js`

Đọc AGENTS.md mục 4 (ALGOS) + mục 9 (`starter`, `tests`) và `tasks/T18-algo-tests.md`; xem 3 bài có sẵn có `tests` để làm đúng format. Thêm vào cuối `window.ALGOS` các bài sau (id tiếp nối số lớn nhất). **Trước khi viết, liệt kê title có sẵn bằng node — bài nào đã có (cùng bài khác tên cũng tính) thì BỎ QUA** và ghi vào Notes. `pattern` dùng đúng tên chương in đậm bên dưới, `tags` thêm `'bytebytego'`.

- **Top K Elements:** Kth Largest Number in a Stream; Top K Frequent Numbers; K Closest Points to Origin; Kth Smallest Number in a Sorted Matrix; Frequency Sort
- **0/1 Knapsack (DP):** 0/1 Knapsack; Subset Sum; Equal Subset Sum Partition; Minimum Subset Sum Difference; Count of Subset Sum; Target Sum
- **Fibonacci Numbers (DP):** Staircase Problem; House Robber; House Robber II; Minimum Cost to Climb Stairs; Decode Ways

Mỗi bài: prompt (### Ví dụ ~~~text, ### Ràng buộc), ≥ 3 hints tăng dần, solution (### Ý tưởng, ~~~java có comment, ### Lưu ý khi phỏng vấn), complexity, starter (class Solution + chữ ký), tests ≥ 4 case gồm edge case. `node scripts/test-algos.js` và `node scripts/validate.js` → OK, rồi `Status: DONE`.

## Notes
