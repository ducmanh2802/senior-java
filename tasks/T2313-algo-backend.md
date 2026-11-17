# T2313 — 3 bài thuật toán mới hay gặp ở phỏng vấn backend

Status: DONE
Notes: Added algo-150 (Merge Intervals), algo-151 (Rate Limiter Sliding Window Log), algo-152 (Top K Frequent Elements).
Agent: kilo
Owns: `js/data/algo.js`
After: T2278

Đọc AGENTS.md mục ALGOS + field `starter`/`tests` (tasks/T18-algo-tests.md). Grep `title:` trong `js/data/algo.js` để không trùng.
Thêm 3 bài (id `algo-NNN` tiếp số lớn nhất), mỗi bài có starter + tests (≥ 5 case, gồm biên): (1) Merge Intervals + Insert Interval kiểu lịch họp (medium), (2) Rate limiter sliding window log: `allow(userId, timestampMs)` (medium), (3) Top K frequent elements bằng heap và bucket sort, so sánh (medium). Solution Java có comment, complexity đúng, hints ≥ 3 tăng dần.

## Luật
AGENTS.md (đọc mục liên quan). Chỉ THÊM trước dòng `);` cuối file, không sửa mục cũ, không backtick, không ký hiệu đô-la + ngoặc nhọn. Không commit. Ghi số id trước/sau vào Notes (phải tăng đúng số đã thêm) — có task trước ghi đã thêm mà file không đổi.

## Nghiệm thu
`node --check js/data/algo.js`, `node scripts/build-light-index.js`, `node scripts/test-algos.js`, `node scripts/validate.js` → OK. Status: DONE + id mới vào Notes.

## Notes
Reviewed-by: verify-only (code/UI task)
