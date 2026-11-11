# T285 — Thuật toán ByteByteGo (phần 4): bài có test Java tự chấm

Status: DONE
Agent: opencode
After: T284
Owns: `js/data/algo.js`

Đọc AGENTS.md mục 4 (ALGOS) + mục 9 (`starter`, `tests`) và `tasks/T18-algo-tests.md`; xem 3 bài có sẵn có `tests` để làm đúng format. Thêm vào cuối `window.ALGOS` các bài sau (id tiếp nối số lớn nhất). **Trước khi viết, liệt kê title có sẵn bằng node — bài nào đã có (cùng bài khác tên cũng tính) thì BỎ QUA** và ghi vào Notes. `pattern` dùng đúng tên chương in đậm bên dưới, `tags` thêm `'bytebytego'`.

- **Graphs (DFS/BFS):** Number of Islands; Clone Graph (lớp Node đơn giản); Course Schedule; Pacific Atlantic Water Flow; Rotten Oranges
- **Topological Sort:** Topological Sort of a Directed Graph; Course Schedule II; Alien Dictionary; Sequence Reconstruction
- **Tries:** Implement Trie; Word Search II; Replace Words; Search Suggestions System
- **Union Find:** Number of Connected Components; Graph Valid Tree; Accounts Merge; Redundant Connection
- **Bit Manipulation:** Single Number II; Missing Number; Counting Bits; Sum of Two Integers
- **Math + Geometry:** Rotate Image; Spiral Matrix; Valid Sudoku; Count Primes

Mỗi bài: prompt (### Ví dụ ~~~text, ### Ràng buộc), ≥ 3 hints tăng dần, solution (### Ý tưởng, ~~~java có comment, ### Lưu ý khi phỏng vấn), complexity, starter (class Solution + chữ ký), tests ≥ 4 case gồm edge case. `node scripts/test-algos.js` và `node scripts/validate.js` → OK, rồi `Status: DONE`.

## Notes

- Audit bằng `node`: tất cả 25 bài mục tiêu đã có sẵn trong `js/data/algo.js` (cùng bài khác tên cũng tính) → **không thêm mới**, bỏ qua.

- Đối chiếu với dữ liệu hiện có:
  - Graphs (DFS/BFS): Number of Islands (algo-028, algo-077), Clone Graph (algo-106), Course Schedule (algo-029, algo-073), Pacific Atlantic Water Flow (algo-107), Rotten Oranges (algo-108 — đúng bí danh Rotting Oranges).
  - Topological Sort: algo-109..112.
  - Tries: algo-113 (`Implement Trie (Prefix Tree)`), algo-114..116.
  - Union Find: algo-061 (Count Connected Components), algo-117..119.
  - Bit Manipulation: algo-120..123.
  - Math + Geometry: algo-124..127.

- Đã xác minh: mỗi bài trên có `starter` + `tests`; `node scripts/test-algos.js <id>` → `Harness OK` cho từng bài; `node scripts/validate.js` → `OK — không có lỗi.`Verify-failed: legacy — đã commit từ trước, autopilot bỏ qua
