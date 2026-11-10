# T1307R — Fact-check nội dung mới của T1307

Status: DONE
Agent: opencode
Owns: `js/data/q-spring-data.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1307 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Không có lỗi. T1307 thêm "Ví dụ đời thực" và "Trả lời mẫu khi phỏng vấn" cho 6 câu hỏi:
- spring-018 (RestClient/WebClient/HTTP interface)
- spring-019 (@Valid vs @Validated)
- spring-020 (Spring Batch chunk/retry/partitioning)
- spring-021 (SPA Security - CORS/CSRF/OAuth2)
- jpa-010 (Fetch strategy - JOIN FETCH/EntityGraph/BatchSize/MultipleBagFetchException)
- jpa-011 (Pagination with EntityGraph - HHH90003004)
Tất cả đều đúng kỹ thuật (API, mặc định, cơ chế, số liệu), markup hợp lệ ({{}}, ###, >, ~~~java), không lẫn chữ nước ngoài.
