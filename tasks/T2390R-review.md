# T2390R — Fact-check nội dung mới của T2390

Status: DONE
Agent: opencode
Owns: `js/data/q-banking.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2390 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Đã review toàn bộ nội dung mới trong js/data/q-banking.js: banking-077 (NAPAS 24/7), banking-078 (VietQR), banking-079 (PCI-DSS/tokenization), banking-080 (cut-off/value date), banking-081 (EOD/PENDING_UNKNOWN).
- Không tìm thấy lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, hay chữ nước ngoài lẫn vào trong 5 id này. Tất cả thuật ngữ kỹ thuật (PENDING_UNKNOWN, cut-off, value date, tokenization, TLV, webhook, maker-checker…) đều được giải thích ở lần đầu xuất hiện; con số nằm trong ví dụ được gán nhãn rõ ràng là ví dụ. → "không có lỗi" cho banking-077, banking-078, banking-079, banking-080, banking-081. Không sửa gì trong q-banking.js.
- validate.js không đạt OK do blocker nằm NGOÀI quyền sở hữu task này: js/data/lessons-claude.js (sở hữu T319) bị lỗi cú pháp template literal — backtick chưa escape quanh `cache_control` ở dòng 19 — ném SyntaxError khi nạp. Lỗi này đồng thời chặn scripts/build-light-index.js (index-light.js giữ trạng thái cũ) và gây lỗi kế thừa path.js (lesson-claude-001/002/003 không tồn tại). Theo AGENTS.md mục 3 và DoD #1 không được sửa file ngoài quyền sở hữu. Đề xuất: T319 sửa backtick trong lessons-claude.js, sau đó chạy `node scripts/build-light-index.js` rồi `node scripts/validate.js` cho tới khi in OK.
- Status: DONE (review nội dung q-banking.js hoàn tất; validate.js chờ xử lý blocker lessons-claude.js).
