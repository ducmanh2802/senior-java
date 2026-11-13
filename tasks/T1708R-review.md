# T1708R — Fact-check nội dung mới của T1708

Status: DONE
Agent: opencode
Owns: `js/data/lessons-spring.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1708 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Đã review hai bài học mới: lesson-spring-014 (AOP proxy: chuỗi advisor, thứ tự, CGLIB) và lesson-spring-015 (BeanPostProcessor). Không tìm thấy lỗi kỹ thuật nào. Nội dung đúng chuẩn Spring Boot 3.x, Java 17/21:
- 014: Giải thích chính xác JDK proxy vs CGLIB, advisor order (nhỏ hơn = ngoài hơn), self-invocation, proxy tạo ở postProcessAfterInitialization. Exercise MiniAop mô phỏng đúng chuỗi advisor bằng JDK Proxy.
- 015: Phân biệt đúng BFPP vs BPP, hai hook before/after, thứ tự vòng đời bean đầy đủ, BPP sắp xếp theo PriorityOrdered/Ordered, inject bean vào BPP gây "not eligible", @Bean BPP nên static. Exercise MiniContainer mô phỏng đúng container DI với BPP chain, bean replacement, prototype, circular dependency, destroy.

Validation: `node scripts/validate.js` → OK (chỉ warning PATH về lesson-spring-014/015 thuộc roadmap.js do integrator sở hữu). Tests: `node scripts/test-lessons.js` pass toàn bộ bài học spring (255/256, 1 fail ở lesson-sql-010 không thuộc file này).
