# T2584R — Fact-check nội dung mới của T2584

Status: DONE
Agent: opencode
Owns: `js/data/quiz-design.js`

Đã review toàn bộ nội dung mới của T2584 (10 câu trắc nghiệm qz-architecture-041 → qz-architecture-050, topic architecture) trong `js/data/quiz-design.js`.

Kết quả review:
- Không có lỗi kiến thức kỹ thuật (CQRS, Event Sourcing, Saga, Clean Architecture, Modulith, ACL, ADR, Fitness Function… đều đúng chuẩn Java 17/21, Spring Boot 3.x, Jakarta EE).
- Không lỗi markup (không backtick, không `${` bên trong template literal, dùng `{{ }}` đúng quy ước).
- Không chỗ trộn chữ nước ngoài cần chỉnh (thuật ngữ kỹ thuật giữ tiếng Anh theo quy ước).
- Không thêm/xoá mục, không sửa nội dung đã có ở HEAD.

Chạy `node scripts/build-light-index.js` rồi `node scripts/validate.js` → in ra "OK — không có lỗi." (các cảnh báo còn lại là của file khác: concurrency-jvm.js, spring-data.js, path.js — không thuộc quyền sở hữu task này).

## Notes
Không có lỗi kiến thức, markup hay ngôn ngữ trong 10 câu mới (qz-architecture-041…050). Không cần sửa gì. Validate OK.
