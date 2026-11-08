# T851R — Fact-check nội dung mới của T851

Status: DONE
Agent: opencode
Owns: `js/data/lessons-jpa.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T851 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
`js/data/lessons-jpa.js` đã `node --check` OK; 2 bài mới `lesson-jpa-008/009` load/parse OK (JPA track hiện 9 bài). `node scripts/test-lessons.js` → `Lesson exercises OK: 211/211 (188 bài học, 211 từ cache)`. `node scripts/validate.js` **vẫn báo LỖI toàn cục nhưng KHÔNG có lỗi nào thuộc `js/data/lessons-jpa.js`** (toàn bộ lỗi/cảnh báo đến từ file khác, pre-existing trên HEAD): `q-java.js` (syntax `Unexpected identifier 'follow'`), nhiều `related` id không tồn tại trong `lessons-collections/core/modern/microservices.js`, `path.js` tham chiếu question/lesson id không tồn tại, `index-light.js` cũ, và các cảnh báo đáp án ngắn ở `q-system-design/scenario/devops.js`. Các file đó không thuộc phạm vi sở hữu T851R nên không sửa.

## Notes
Đã review diff HEAD của `js/data/lessons-jpa.js` (chỉ thêm `lesson-jpa-008`, `lesson-jpa-009`). Không có backtick thô hay `${` (dùng `{{ }}` đúng chuẩn), schema/mục bài học đủ (goals/exercises/hints/tests/reference/check/tags/body có `Liên hệ phỏng vấn`), `starter` không có class public ngoài test harness, body ≥ 2500 ký tự, tests deterministic (RESULT/pass-fail).

Lỗi kỹ thuật/diễn đạt đã sửa:
- **lesson-jpa-008 (Dirty checking/@DynamicUpdate/bytecode enhancement)**:
  - Làm rõ "statement cache kém hơn" (dễ hiểu sai): diễn giải là JDBC/DB ít cơ hội tái dùng prepared statement hơn khi mỗi tổ hợp cột đổi sinh SQL khác; nhấn mạnh dirty check (so snapshot) **không biến mất** dù bật `@DynamicUpdate`. Thêm gợi ý đo bằng `{{hibernate.generate_statistics}}`/profiler (đúng Hibernate 6/Boot 3.x).
  - Bytecode enhancement: không nói chung chung "plugin Hibernate" — nêu rõ phải bật **tường minh trong build** (ví dụ plugin `{{hibernate-enhance-maven-plugin}}` của Hibernate ORM), làm rõ cơ chế chèn setter/getter để dirty tracking (đánh dấu field bẩn lúc gán). Bổ sung lưu ý tương tác bytecode (AOP, JaCoCo) và chỉ cân nhắc sau profiling; tránh ngụ ý project nào cũng có sẵn.
- **lesson-jpa-009 (ActionQueue/flush order)**:
  - Giải thích thuật ngữ lần đầu cho người mới: FK (foreign key — cột trỏ sang id bảng khác), transient (entity mới, chưa có trong DB/context). Chuẩn hóa tên state Hibernate (`new/transient, managed, removed/detached`) thay vì viết tắt dễ gây hiểu nhầm.
  - Mục "Thứ tự và FK": chỉnh lại cho kỹ thuật chính xác hơn — Hibernate **cố gắng** sắp xếp insert/delete theo phân tích quan hệ/cascade để tôn trọng FK, nhưng **không tự cứu được mọi trường hợp phức tạp** (quan hệ vòng, mapping tự quản); DB vẫn từ chối nếu mâu thuẫn rõ ràng. (Tránh khẳng định tuyệt đối "insert cha trước con" như quy tắc luôn đúng trong mọi mapping.)

Không phát hiện API/flag bịa, cơ chế ActionQueue nói ngược (vẫn đúng: flush insert → update → delete; cùng unique key delete+insert → INSERT chạy trước DELETE gây vi phạm), hay số liệu vô căn cứ. Không sửa nội dung đã có ở HEAD, không thêm/xoá mục. Không chạy `git`, không kill tiến trình, không mở trình duyệt.
