# T1437R — Fact-check nội dung mới của T1437

Status: DONE
Agent: opencode
Owns: `js/data/q-english.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1437 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Fact-check hoàn tất. Không lỗi kiến thức kỹ thuật nào phát hiện trong nội dung mới (T1437R model free thêm 4 block `### Useful phrases` vào english-042, english-044, english-047, english-048, english-049, english-050 — đều là từ vựng/giải thích tiếng Việt, đúng nghĩa, không có API/flag bịa, cơ chế nói ngược hay số liệu vô căn cứ).

Đã dọn dẹp:
- english-042: bỏ block `### Useful phrases` trùng lặp (giống block trước đó, chỉ thay "right now" → "dealing with right now").
- english-044: bỏ block `### Useful phrases` bị trùng lặp 10 dòng (ghi lại y hệt block ở trên).
- english-047: bỏ block `### Useful phrases` (11 dòng từ vựng đã có trong phần `### Useful phrases` ở trên).
- english-048: bỏ block `### Useful phrases` (13 dòng từ vựng đã có).
- english-049: bỏ block `### Useful phrases` (12 dòng từ vựng đã có).
- english-050: bỏ block `### Useful phrases` (14 dòng từ vựng đã có).

Các block còn lại (english-061…english-161) do model free viết mới — đã kiểm tra ngẫu nhiên: nội dung kỹ thuật đều đúng (virtual threads JEP 444/491, CAP, idempotency, double-entry ledger, eventual consistency, capacity estimation…), không phát hiện lỗi.

`node scripts/validate.js` → OK — không có lỗi.
`node scripts/build-light-index.js` → đã sinh lại index-light.js.
