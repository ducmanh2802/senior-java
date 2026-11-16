# T2207R — Fact-check nội dung mới của T2207

Status: DONE
Agent: opencode
Owns: `js/data/lessons-core.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2207 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Không có lỗi kiến thức. Toàn bộ thay đổi của T2207 trong `js/data/lessons-core.js` chỉ bổ sung giải thích thuật ngữ (va chạm/collision, entry key–value, replay, async/bất đồng bộ, deep copy, middleware/boundary, buffer/flush, O(n), allocation, generic đọc) và đều đúng kỹ thuật; không có API/flag bịa, cơ chế nói ngược, số liệu vô căn cứ, lỗi markup hoặc chữ nước ngoài chưa giải thích. `node scripts/validate.js` → OK, `node scripts/test-lessons.js` → 300/300 pass.