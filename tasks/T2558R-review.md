# T2558R — Fact-check nội dung mới của T2558

Status: DONE
Agent: opencode
Owns: `js/data/quiz.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2558 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Review toàn bộ 10 câu trắc nghiệm mới (qz-db-911 → qz-db-920, topic db, MyBatis):
- qz-db-911 (L1 cache / LocalCacheScope), 912 (useGeneratedKeys), 913 (UPDATE động <set>/<trim>, multi), 914 (SqlSession do Spring/MyBatis-Spring quản lý), 915 (<sql>/<include>), 916 (fetchSize/ResultHandler), 917 (@Options useCache/flushCache, multi), 918 (StatementType), 919 (@Param), 920 (resultType vs resultMap): đúng kỹ thuật (Java 17/21, Spring Boot 3.x, MyBatis), id qz-db-9xx tăng dần, không trùng, multi có "(Chọn 2)" khớp answer.length, markup sạch (không backtick, không ${, không HTML thô).
- Sửa qz-db-916: từ lạ "bogging" → "làm đầy bộ nhớ RAM" trong q.
- Không chỉnh văn phong/độ dài/bố cục, không thêm/xoá mục, không sửa nội dung HEAD. Không thêm refs.
- Chạy `node scripts/build-light-index.js` rồi `node scripts/validate.js` → OK — không có lỗi. (Cảnh báo còn lại thuộc các file khác, không do task này.)
