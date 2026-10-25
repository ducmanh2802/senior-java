# T284 — Thuật toán ByteByteGo (phần 3): bài có test Java tự chấm

Status: TODO
Agent: opencode
After: T283
Owns: `js/data/algo.js`

Đọc AGENTS.md mục 4 (ALGOS) + mục 9 (`starter`, `tests`) và `tasks/T18-algo-tests.md`; xem 3 bài có sẵn có `tests` để làm đúng format. Thêm vào cuối `window.ALGOS` các bài sau (id tiếp nối số lớn nhất). **Trước khi viết, liệt kê title có sẵn bằng node — bài nào đã có (cùng bài khác tên cũng tính) thì BỎ QUA** và ghi vào Notes. `pattern` dùng đúng tên chương in đậm bên dưới, `tags` thêm `'bytebytego'`.

- **Palindromes (DP):** Longest Palindromic Substring; Palindromic Substrings Count; Minimum Cuts for Palindrome Partitioning; Longest Palindromic Subsequence
- **Greedy:** Jump Game; Gas Station; Partition Labels; Minimum Number of Arrows to Burst Balloons; Non-overlapping Intervals
- **Backtracking:** Subsets; Permutations; Combination Sum; N-Queens; Word Search; Palindrome Partitioning

Mỗi bài: prompt (### Ví dụ ~~~text, ### Ràng buộc), ≥ 3 hints tăng dần, solution (### Ý tưởng, ~~~java có comment, ### Lưu ý khi phỏng vấn), complexity, starter (class Solution + chữ ký), tests ≥ 4 case gồm edge case. `node scripts/test-algos.js` và `node scripts/validate.js` → OK, rồi `Status: DONE`.

## Notes
