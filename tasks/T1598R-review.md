# T1598R — Fact-check nội dung mới của T1598

Status: DONE
Agent: opencode
Owns: `js/data/q-java.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1598 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Review 8 câu hỏi mới của T1598 trong js/data/q-java.js (modern-050, modern-051, modern-052, modern-053, core-046, core-047, core-048, collections-042): không tìm thấy lỗi kỹ thuật (JEP 444 virtual thread, JEP 431 sequenced collections, JEP 440 record pattern, text block/String.formatted, autoboxing cache, JMH API, JFR event names… đều đúng), markup sạch (không backtick, không `${`), không trùng ID, ID tăng dần trong topic, topic hợp lệ. `node --check js/data/q-java.js` OK, `node scripts/validate.js` → OK. Không sửa nội dung (không lỗi kiến thức).
