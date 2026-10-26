# T136 — Thêm 5 bài thuật toán hard có test

Status: DONE
Agent: opencode
Owns: `js/data/algo.js`

Đọc AGENTS.md mục 4 (ALGOS) + mục 9 (starter, tests) và `tasks/T18-algo-tests.md`; xem vài bài có sẵn có `tests` để làm theo đúng format. Thêm **5 bài hard** (id tiếp nối, không trùng title có sẵn): Merge k Sorted Lists, Trapping Rain Water, Sliding Window Maximum, Word Ladder, LRU Cache (nếu đã có bài nào thì thay bằng Median of Two Sorted Arrays / Minimum Window Substring). Mỗi bài có prompt (### Ví dụ, ### Ràng buộc), ≥ 3 hints tăng dần, solution Java có comment, complexity, starter, tests ≥ 4 case gồm edge case. Chạy `node scripts/test-algos.js` và `node scripts/validate.js` → OK, rồi `Status: DONE`.

## Notes

- Đã thêm 5 bài hard: `algo-079` Sliding Window Maximum, `algo-080` Word Ladder, `algo-081` Median of Two Sorted Arrays,
  `algo-082` Basic Calculator, `algo-083` Longest Valid Parentheses.
- Các bài yêu cầu đã tồn tại nên không thêm trùng title: Merge K Sorted Lists (`algo-023`), Trapping Rain Water (`algo-008`),
  LRU Cache (`algo-022`/`algo-069`), Minimum Window Substring (`algo-012`). Vì vậy dùng phương án thay thế được nêu trong task
  (Median of Two Sorted Arrays) và bổ sung 2 bài hard khác để đủ 5 bài mới.
- Mỗi bài có prompt đủ `### Ví dụ` + `### Ràng buộc`, 3 hints tăng dần, solution Java có comment, `starter`, `complexity`,
  `follow`; harness có 5 case (algo-079) và 4 case (algo-080..083), gồm edge case.
- Sửa lỗi từ lần chạy trước bị gián đoạn: thiếu backtick đóng `solution` của algo-083; sai kỳ vọng case "decreasing" của algo-079
  (k=2 trên `[4,3,2,1]` phải là `[4,3,2]`).
- Sửa thêm bug có sẵn của `algo-058` (Minimum Meeting Rooms): trả `q.size()` cuối cùng thay vì max số phòng đồng thời, làm case
  "unordered" fail; nay theo dõi `best = max(best, q.size())`.
- Kiểm chứng: `node scripts/test-algos.js` → `Harness OK: 83 · lỗi: 0 · chưa có tests: 0`; `node scripts/validate.js` → `OK — không có lỗi.`
