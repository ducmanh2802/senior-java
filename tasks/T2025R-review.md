# T2025R — Fact-check nội dung mới của T2025

Status: DONE
Agent: opencode
Owns: `js/data/lessons-jpa.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2025 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

- lesson-jpa-012 (N+1): sửa số liệu vô căn cứ trong ví dụ production — N+1 là 1 query cha + N query con, nên 200 đơn hàng = 1 + 200 = 201 query (không phải 1 + 200x5 = 1001), điều chỉnh thời gian tương ứng (~200 ms thay vì 1 giay).
- lesson-jpa-012 (bài tập BatchFetcher): test chỉ tạo 6 id chờ (get 2..7) nhưng mong đợi `loaded == 3 && calls == 4` ("7 pending, 3 lot 3,3,1") — tham chiếu chưa bao giờ pass được. Thêm `f.get(8);` để có 7 id chờ, tham chiếu pass 5/5.
- lesson-jpa-013 (vòng đời entity): không có lỗi kỹ thuật; khởi tạo/tham chiếu passed 14/14 + 6/6, starter không pass hết như yêu cầu.
- validate.js: OK — không có lỗi. test-lessons.js lesson-jpa-012/013: toàn bộ bài tập pass. Lỗi lesson-concurrency-016#2 là bài không sở hữu, đã lỗi trước đó, không liên quan.
