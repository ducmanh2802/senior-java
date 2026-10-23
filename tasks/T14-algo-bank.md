# T14 — Nội dung: Bài luyện thuật toán (coding interview)

Status: DONE
Agent: opencode
Owns: `js/data/algo.js`

## Mục tiêu
Viết **≥ 40 bài** coding interview kèm lời giải Java 17+, theo schema `ALGOS` ở `AGENTS.md` mục 4.
Trong file đã có `algo-001` (Two Sum) làm mẫu. Giữ nguyên bài đó và thêm từ `algo-002`.

Phân bổ độ khó khoảng 30% easy, 55% medium, 15% hard. Bao phủ **các pattern** sau, mỗi pattern 2–4 bài, ưu tiên những bài kinh điển hay gặp khi phỏng vấn:

| Pattern | Gợi ý bài |
|---|---|
| Two Pointers | Valid Palindrome, 3Sum, Container With Most Water |
| Sliding Window | Longest Substring Without Repeating Characters, Minimum Window Substring |
| Hash Map / Set | Group Anagrams, Longest Consecutive Sequence, Top K Frequent Elements |
| Stack / Monotonic Stack | Valid Parentheses, Daily Temperatures, Min Stack |
| Binary Search | Search in Rotated Sorted Array, Koko Eating Bananas |
| Linked List | Reverse Linked List, Merge K Sorted Lists, LRU Cache (thiết kế) |
| Tree / BFS / DFS | Level Order Traversal, Validate BST, Lowest Common Ancestor |
| Graph | Number of Islands, Course Schedule (topological sort), Dijkstra cơ bản |
| Heap / Priority Queue | Kth Largest Element, Merge Intervals, Meeting Rooms II |
| Dynamic Programming | Climbing Stairs, Coin Change, Longest Increasing Subsequence, House Robber |
| Backtracking | Subsets, Permutations, Combination Sum |
| Greedy / Intervals | Jump Game, Non-overlapping Intervals |
| **Thực tế (Java-flavored)** | Rate limiter (token bucket), thread-safe bounded blocking queue, đếm top-K từ log lớn với stream, đối soát (reconcile) hai danh sách giao dịch |

## Yêu cầu từng bài
- `prompt`: đề bài tiếng Việt (giữ thuật ngữ tiếng Anh), có `### Ví dụ` (block `~~~text`) và `### Ràng buộc`.
  **Tự viết lại đề bằng lời của mình, không copy nguyên văn LeetCode.**
- `hints`: 2–3 gợi ý **tăng dần**: hướng nghĩ → cấu trúc dữ liệu → mấu chốt cài đặt.
- `solution`: `### Ý tưởng`, code `~~~java` sạch, compile được, ≤ 40 dòng, dùng idiom Java hiện đại (Deque thay vì Stack…),
  có thể thêm cách brute force để so sánh, và `### Lưu ý khi phỏng vấn` (edge case, câu hỏi nên hỏi lại, overflow…).
- `complexity`: dạng `'Time O(n log n), Space O(n)'`.
- `follow`: 1–3 follow-up interviewer hay hỏi.
- Kiểm tra kỹ code đúng: tự chạy thử trong đầu với ví dụ. Nếu có `javac` trên máy thì có thể compile để kiểm tra (không commit file phụ).

Chạy `node scripts/validate.js` cho đến khi OK.

## Notes
- Đã thêm `algo-002` … `algo-048` (48 bài, giữ nguyên `algo-001`): 14 easy (29%), 28 medium (58%), 6 hard (13%).
- Bao phủ 13 pattern, mỗi pattern 2–4 bài: Hash Map, Two Pointers, Sliding Window, Stack, Binary Search,
  Linked List, Tree, Graph, Heap, Dynamic Programming, Backtracking, Greedy, Practical (Java/concurrency).
  Riêng nhóm thực tế gồm token bucket rate limiter, bounded blocking queue, đối soát giao dịch và top-K từ log.
- Đã kiểm tra code: `javac 17` compile thành công toàn bộ 48 snippet Java (tách từ `~~~java`), đồng thời chạy
  harness 85 assertion cho các bài then chốt (MinStack, LRU Cache, Dijkstra, Koko, bounded queue, reconcile, top-K) — pass hết.
- `node scripts/validate.js` toàn repo in ra `OK — không có lỗi.`
- Chỉ sửa `js/data/algo.js` và file task này; không commit.
Verify-failed: legacy — đã commit từ trước, autopilot bỏ qua
