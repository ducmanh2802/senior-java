# T119R — Fact-check nội dung mới của T119

Status: DONE
Agent: opencode
Owns: `js/data/algo.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T119 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
 - algo-069: LRU implementation and O(1) operations match the stated positive-capacity contract; no technical correction needed.
 - algo-070: Heap ordering and reverse extraction produce frequency-descending, value-ascending deterministic results; no correction needed.
 - algo-071: Inclusive interval merge condition matches the prompt; no correction needed.
 - algo-072: Reusing a room when end <= next start matches the explicitly stated boundary behavior; no correction needed.
 - algo-073: Kahn traversal correctly detects directed cycles, including self-cycles; no correction needed.
 - algo-074: Bottom-up unbounded coin DP is correct; no correction needed.
 - algo-075: Sliding window correctly handles repeats only when they are within the active window; UTF-16 behavior is documented.
 - algo-076: Size-k min-heap correctly includes duplicates as ranked elements; no correction needed.
 - algo-077: BFS counts four-direction connected components without mutating the input; no correction needed.
 - algo-078: Clarified the missing positive limit/window assumptions; fixed-window boundary and per-user monotonic-time requirements now agree with the implementation. Production caveats are explicitly stated.

Verification: `node --check js/data/algo.js` passed; `node scripts/validate.js` printed `OK — không có lỗi.`
