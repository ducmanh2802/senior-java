# T2653R — Fact-check nội dung mới của T2653

Status: DONE
Agent: opencode
Owns: `js/data/q-english.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2653 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Fact-check hoàn tất cho 4 câu hỏi mới do T2653 thêm vào `js/data/q-english.js`:

- **english-243** (HashMap internals): nội dung kỹ thuật đúng — spread function, power-of-two capacity, load factor 0.75, treeification threshold 8, resize. Bảng trade-off HashMap/LinkedHashMap/TreeMap/ConcurrentHashMap chính xác. Không cần sửa.
- **english-244** (system architecture for stakeholder): đúng về B2B payment gateway, Kafka, PostgreSQL, Redis, 400 QPS, p99 180ms, two AZs, idempotent + append-only, per-merchant backpressure. Không cần sửa.
- **english-245** (deployment breaks production): đúng về rollback vs fix-forward, incident comms, read-only investigation, canary, postmortem. Không cần sửa.
- **english-246** (slow query optimization): đúng về EXPLAIN ANALYZE, composite index (merchant_id, created_at DESC), seq scan → index scan, 3.2s → 120ms, cursor pagination, 40% CPU reduction. Không cần lỗi.

Kiểm tra kỹ thuật đã thực hiện:
- `node --check js/data/q-english.js` → pass (không cú pháp, không backtick, không `${` trong template literal).
- `node scripts/build-light-index.js` → sinh lại index-light.js OK.
- `node scripts/validate.js` → `OK — không có lỗi.` (lỗi còn lại ở lessons-banking/lessons-architecture là của các task khác, không phải sở hữu của T2653R).

Không có lỗi kiến thức, markup hay chữ nước ngoài lẫn vào trong 4 câu hỏi mới.
