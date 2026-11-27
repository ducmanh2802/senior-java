# T2819R — Fact-check nội dung mới của T2819

Status: DONE
Agent: opencode
Owns: `js/data/q-banking.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2819 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Không có lỗi kiến thức trong nội dung mới T2819 (banking-110 → banking-115). Đã fact-check từng mục:
- banking-110 (futures/spot, contract spec): multiplier, tick size, tick_value = tick_size×multiplier, lưu giá theo tick nguyên, PnL = (close−open)×multiplier — đúng.
- banking-111 (MTM/variation margin): ví dụ 3 ngày (2 HĐ, multiplier 1tr, ký quỹ 20tr/HĐ → 40→44→38→42tr) tính đúng; idempotent DELETE+INSERT theo trade_date, version settlement price — đúng.
- banking-112 (initial/maintenance margin, margin call, forced liquidation, single-writer theo tài khoản) — đúng.
- banking-113 (open interest vs volume, FIFO vs bình quân: (10×50+10×60)/20=55) — đúng.
- banking-114 (last trading day, rollover, physical vs cash, first notice day) + sơ đồ ~~~seq hợp lệ — đúng.
- banking-115 (linkage, UTC, trading calendar, FX effective-dated) — đúng.

Markup hợp lệ, không lẫn chữ nước ngoài (thuật ngữ tiếng Anh là chủ ý). node --check OK. node scripts/validate.js: KHÔNG có lỗi nào thuộc q-banking.js (các lỗi còn lại thuộc file của task khác: toeic-*, quiz-ops, quiz-ckad, lessons-*, q-frontend — không sửa theo luật 3). Không sửa nội dung cũ ở HEAD, không thêm/xoá mục.
