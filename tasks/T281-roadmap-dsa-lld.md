# T281 — Lộ trình 26 tuần: thêm mạch thuật toán (ByteByteGo) + LLD + system design theo tuần

Status: DONE
Agent: opencode
After: T280
Owns: `js/data/roadmap.js`

Người học theo sách **ByteByteGo Coding Patterns** (đã xong chương 1–7: Two Pointers, Hash Maps, Linked Lists, Fast/Slow, Sliding Window, Binary Search). Đọc `js/data/roadmap.js` (mỗi tuần có `id, title, topics, algo, tasks`). CHỈ sửa field `algo` và THÊM phần tử vào `tasks` (giữ tasks cũ, không đổi cấu trúc/id):
- `algo`: phân bổ chương ByteByteGo 8–22 theo thứ tự, 4–6 bài/tuần, ghi chương + tên bài + "luyện ở #/algo, lọc theo pattern". Thứ tự: Stacks → Heaps → Merge Intervals → Top K → DP Knapsack → DP Fibonacci → DP Palindromes → Greedy → Backtracking → Graphs → Topological Sort → Tries → Union Find → Bit Manipulation → Math/Geometry; tuần 21–24: CTCI Moderate/Hard chọn lọc (big tech) + ôn bài cần làm lại; tuần 25–26: ôn, không bài mới.
- `tasks` thêm: tuần 5–12 mỗi tuần 1 bài **LLD** ở `#/learn` track architecture (Parking Lot, Elevator, Notification, Vending Machine, Movie Booking, Splitwise, Logging, Undo/Redo); tuần 13–24 mỗi tuần 1 đề **#/sd** xen kẽ ngân hàng/big tech; tuần 17–24 "1 mock coding 45 phút + 1 mock SD"; tuần 21–24 "chuẩn bị 2 câu chuyện STAR + luyện nói #/speak 15 phút/ngày".
- Mốc kiểm tra (thêm vào tasks tuần 8, 16, 24): "giải medium trong 30 phút, giải thích happens-before + GC"; "tự trình bày 1 thiết kế 45 phút có trade-off"; "mock đạt 4/5 cả coding, design, behavioral".
- `node --check js/data/roadmap.js`, `node scripts/validate.js` → OK, rồi `Status: DONE`.

## Notes

## Notes
Đã cập nhật roadmap.js: algo theo ByteByteGo chương 8–22 (Stacks → Heaps → Merge Intervals → Top K → DP Knapsack → DP Fibonacci → DP Palindromes → Greedy → Backtracking → Graphs → Topological Sort → Tries → Union Find → Bit Manipulation → Math/Geometry), 4–6 bài/tuần, ghi "luyện ở #/algo lọc theo pattern". Tasks thêm: LLD #/learn track architecture các tuần 5–12 (Parking Lot, Elevator, Notification, Vending Machine, Movie Booking, Splitwise, Logging, Undo/Redo); #/sd xen kẽ ngân hàng/big tech các tuần 13–24; mock coding 45 phút + mock SD các tuần 17–24; 2 câu chuyện STAR + #/speak 15 phút/ngày các tuần 21–24; mốc kiểm tra tuần 8/16/24. node --check OK, validate OK.
