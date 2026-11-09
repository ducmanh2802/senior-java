# T1411R — Fact-check nội dung mới của T1411

Status: DONE
Agent: opencode
Owns: `js/data/lessons-spring.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1411 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Fact-check `git diff HEAD -- js/data/lessons-spring.js` (T1411): thay đổi ở `lesson-spring-001` (thêm "Cơ chế từng bước", "Lỗi hay gặp trên production", đổi "Liên hệ phỏng vấn" sang Q&A, +2 câu check) và `lesson-spring-002` (thêm "Cơ chế từng bước"/bảng self-invocation/4 bullet production, đổi "Liên hệ phỏng vấn" sang Q&A, +2 câu check). Không sửa nội dung HEAD ngoài vùng diff.
- Kiểm tra kỹ thuật: `@Autowired` không cần khi 1 constructor (Spring 4.3+) ✓; circular refs tắt mặc định từ Spring Boot 2.6 (`spring.main.allow-circular-references=false`) ✓; `NoUniqueBeanDefinitionException` extends `NoSuchBeanDefinitionException` ✓; `spring.aop.proxy-target-class` mặc định `true` từ Boot 2.0 (CGLIB) ✓; self-invocation/proxy bypass cho `@Transactional`/`@Async` ✓; `@Transactional` trên private không có hiệu lực (proxy không override) ✓; `new` object không được Spring proxy ✓. Markup dùng `{{}}`/template literal không có backtick hay `${` thô ✓.
- **Không có lỗi kỹ thuật** trong phần T1411 thêm mới; không chỉnh văn phong/bố cục/độ dài.
- `node --check js/data/lessons-spring.js` → OK. `node scripts/test-lessons.js` fail do lỗi không thuộc file sở hữu: `js/data/lessons-jpa.js` lỗi cú pháp `Unexpected identifier 'flush'` (khi nạp dữ liệu). `node scripts/validate.js` cũng fail vì `lessons-jpa.js` syntax + `projects.js`/`path.js` ref `lesson-jpa-*` + `index-light.js` cũ — đều ngoài `js/data/lessons-spring.js`. Không sửa file ngoài phạm vi (luật 3 AGENTS.md).
