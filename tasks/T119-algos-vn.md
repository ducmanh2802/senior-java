# T119 — Thêm 10 bài thuật toán hay gặp ở vòng coding công ty Việt Nam

Status: DONE
Agent: codex
Owns: `js/data/algo.js`

Đọc AGENTS.md mục 4 (ALGOS) + mục 9 (`starter`, `tests`) và `tasks/T18-algo-tests.md`. Thêm **10 bài** (id tiếp theo, không trùng tiêu đề có sẵn), ưu tiên medium: LRU Cache, Top K Frequent, Merge Intervals, Meeting Rooms II, Course Schedule (topo sort), Coin Change, Longest Substring Without Repeating, Kth Largest (heap), Number of Islands, Design Rate Limiter đơn giản. Mỗi bài có starter + tests (≥ 4 case gồm biên). `node scripts/test-algos.js` + `node scripts/validate.js` → OK.

## Notes

- Đã thêm algo-069–078 với prompt, lời giải, starter và 5 test/case cho mỗi bài; chủ đề được đặt biến thể để tránh trùng tiêu đề có sẵn.
- `node --check js/data/algo.js` và harness riêng cho cả 10 bài đều pass; `node scripts/validate.js` → OK.
- Harness toàn bộ hiện còn lỗi có sẵn ở algo-058: case `unordered` kỳ vọng 2 nhưng trả 1. Không sửa bài ngoài phần bổ sung của T119.Reviewed-by: codex (T119R)
