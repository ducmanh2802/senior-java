# T1383R — Fact-check nội dung mới của T1383

Status: DONE
Agent: opencode
Owns: `js/data/q-system-design.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1383 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Đã review 5 phần nội dung mới (architecture-032 → architecture-036). Kiểm tra: technical correctness, markup, refs, số liệu, thuật ngữ, đồng nhất metric/tên thread/key.

**Lỗi đã sửa (2):**
- architecture-033 (line 6160): typo "liên tụcáp dụng" → "liên tục ứng dụng" (góc điều tra).
- architecture-035 (line 6452): typo "follower chờđuổi kịp" → "follower phải chờ replica bắt kịp" (giải pháp read-your-writes).

**Kiểm tra kỹ, KHÔNG phát hiện lỗi kỹ thuật còn lại:**
- 5 câu đều có đủ 6 phần: Tóm tắt / Thuật ngữ nền / Vì sao / Ví dụ đời thực / Trả lời mẫu phỏng vấn / Senior tip.
- Số liệu, metric name, config key, timestamp, tên node/thread/key đồng nhất trong mỗi ví dụ và giữa ví dụ với đáp án.
- Markup hợp lệ: không backtick, không `${`, `~~~text`/`~~~java` đúng cú pháp, {{code}} dùng đúng.
- refs ≤5, title không có `[` `]`, url https, kiểm tra thực tế bằng `node scripts/check-links.mjs` (95 link, 0 hỏng).
- `node scripts/validate.js` → OK. Đã chạy `node scripts/build-light-index.js` để sinh lại index-light.js.
