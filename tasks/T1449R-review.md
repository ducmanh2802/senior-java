# T1449R — Fact-check nội dung mới của T1449

Status: DONE
Agent: opencode
Owns: `js/data/q-autotest.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1449 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Đã sửa 2 lỗi kỹ thuật trong q-autotest.js:
- autotest-032 (line 2051): Sửa `{{toBeVisible}}` (Playwright JS API) thành `{{assertThat(locator).isVisible()}}` (Playwright Java API) trong mục "Lỗi hay gặp".
- autotest-042 (line 3075): Sửa `{{expect(locator).toHaveText('CREATED')}}` (Playwright JS API) thành `{{assertThat(locator).hasText("CREATED")}}` (Playwright Java API) trong ví dụ đời thực.
Cả hai lỗi đều do dùng API Playwright JavaScript/TypeScript trong ngữ cảnh Playwright for Java. Validator không báo lỗi vì cú pháp markup hợp lệ, nhưng nội dung kỹ thuật sai. Đã sửa và validate OK.
