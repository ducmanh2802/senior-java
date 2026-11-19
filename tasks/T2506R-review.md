# T2506R — Fact-check nội dung mới của T2506

Status: DONE
Agent: opencode
Owns: `js/data/q-english.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2506 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỉ cần kiến thức ĐÚC: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Fact-check T2506R — `js/data/q-english.js` (3 câu mới: english-220, english-221, english-222).

Đã sửa 3 lỗi kỹ thuật/markup:

- english-221: bảng trade-off dòng "Frontend bundle" ghi "giảm TTFB perceived" → không chính xác (TTFB là server-side, frontend bundle không giảm TTFB). Sửa thành "giảm thời gian tải/parse JS, time to interactive".
- english-221: `{{jfr}} start duration=60s filename=rec.jfr` → cú pháp JFR CLI sai. Đúng là `jfr start --duration 60s --filename rec.jfr`. Sửa theo cú pháp JDK 17+.
- english-221: "adding it cut p95 to one hundred twenty milliseconds" → mâu thuẫn với ví dụ đời thực (sau thêm index p95 còn 300ms, sau virtual scroll xuống 120ms). Sửa thành "cut p95 to three hundred milliseconds, and a virtual-scroll fix on the page brought it to one hundred twenty milliseconds" để nhất quán.

Các câu không có lỗi kiến thức/markup khác: english-220 (introduction fullstack LG CNS), english-222 (clarify requirements với PM/BA Hàn). Kiểm tra cú pháp JS OK, validate → OK — không có lỗi.
