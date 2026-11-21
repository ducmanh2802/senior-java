# T2516R — Fact-check nội dung mới của T2516

Status: DONE
Agent: opencode
Owns: `js/data/lessons-sql.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2516 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.

CHÍA cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.

Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.

Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Đã sửa lỗi `lesson-sql-017#2`: `CompositeIdx.skipColumn` trả về kết quả theo thứ tự input ban đầu thay vì theo thứ tự sắp xếp (sửa constructor để lưu mảng `original` và dùng cho `skipColumn`)
- `node scripts/validate.js` → `OK — không có lỗi.`
- `node scripts/test-lessons.js` → 346/348 exercise test pass (2 test thất bại do vấn đề pre-existing: `lesson-sql-018#1` là issue 1M test run, `lesson-db-019#1` là bài học khác không thuộc task sở hữu)