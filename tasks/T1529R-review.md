# T1529R — Fact-check nội dung mới của T1529

Status: DONE
Agent: opencode
Owns: `js/data/lessons-sql.js`

Review xong nội dung mới của T1529 (bài học lesson-sql-008 "Window function với Java Streams" và lesson-sql-009 "Keyset pagination trên danh sách đã sắp xếp" do model free thêm vào cuộn js/data/lessons-sql.js).

Không tìm thấy lỗi kiến thức: ngữ pháp JS đúng (`node --check` OK), code Java tham khảo biên dịch JDK 17 và pass hết tests (`node scripts/test-lessons.js lesson-sql-008` 4/4, `lesson-sql-009` 4/4; toàn bộ suite 225/225), SQL đúng PG 15 (frame mặc định RANGE vs ROWS cho running total, RANK nhảy/DENSE_RANK không nhảy, ROW_NUMBER duy nhất cần tie-breaker, keyset cần tie-breaker duy nhất và chiều so sánh khớp ORDER BY, OFFSET chi phí tuyến tính + trùng/sót khi dữ liệu đổi). Markup `{{...}}`/`~~~sql` hợp lệ, không backtick, không `${` thô.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Không có lỗi (không sửa gì): lesson-sql-008, lesson-sql-009 đúng kỹ thuật. validate.js OK; test-lessons.js OK (225/225).