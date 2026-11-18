# T2373 — 20 drill hỏi-đáp tiếng Anh: phỏng vấn vị trí trading/sàn giao dịch

Status: DONE
Agent: kilo
Owns: `js/data/drills-qa.js`
After: T2359

Định dạng qa ở comment đầu file; grep q: để không trùng. Thêm 20 drill (theme tech/design/project): giải thích order book, matching engine, độ trễ thấp trong Java, xử lý GC pause, đảm bảo không mất lệnh khi crash, market data feed, risk check trước khi khớp, xử lý sự cố sàn quá tải. sample 80–200 từ giọng Senior, có số liệu; phrases 3–6.

## Luật
AGENTS.md (đọc mục liên quan). Chỉ THÊM trước dòng `);` cuối file, không sửa/xoá mục cũ, id tiếp số LỚN NHẤT, không backtick, không ký hiệu đô-la + ngoặc nhọn. KHÔNG sửa phần đặc tả của file task này. Không commit. Ghi số id trước/sau vào Notes (phải tăng đúng số đã thêm).

## Nghiệm thu
`node --check js/data/drills-qa.js`, `node scripts/build-light-index.js`, `node scripts/validate.js` → OK. Status: DONE + id mới vào Notes.

## Notes

Added 20 drills with IDs drill-qa-222 through drill-qa-241 (previous max was drill-qa-221). Topics covered: order book data structures, matching engine design, ultra-low latency Java techniques, GC pause handling, write-ahead log for durability, market data feed processing, pre-trade risk checks, exchange overload protection, price-time priority, lock-free matching, latency measurement, JIT warm-up, off-heap memory, WAL + snapshots for recovery, market data normalization, derivatives risk checks, circuit breaker design, cancel-vs-market-order race, disaster recovery with Raft, and correctness/performance testing.
