# T1713 — 12 câu trắc nghiệm (jpa) vào quiz-spring.js

Status: DONE
Agent: kilo
Owns: `js/data/quiz-spring.js`
After: T1485

Thêm **12 câu trắc nghiệm** vào `js/data/quiz-spring.js` (topic `jpa`; id `qz-jpa-NNN` nối tiếp số lớn nhất của topic trong mọi file quiz: `grep -ho "qz-jpa-[0-9]*" js/data/quiz*.js | sort -V | tail -1`).

Chủ đề: tình huống JPA/Hibernate: N+1, lazy loading, flush, dirty checking, optimistic lock, cascade/orphanRemoval, equals/hashCode của entity.

Theo AGENTS.md mục "Câu trắc nghiệm": dạng tình huống/đoạn code thật, không hỏi định nghĩa suông; khoảng 1/4 là `multi: true` (Chọn 2); đáp án đúng rải đều vị trí; `explain` giải thích vì sao đúng **và vì sao từng phương án sai** là sai.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/quiz-spring.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
- Đã THÊM 12 câu vào cuối `js/data/quiz-spring.js` (chèn trước `);` cuối, không sửa mục cũ): `qz-jpa-030` … `qz-jpa-041`.
- Max id trước khi làm là `qz-jpa-029` (đã grep toàn bộ `js/data/quiz*.js`); sau khi làm topic `jpa` có 41 câu trắc nghiệm (29 cũ + 12 mới).
- Chủ đề: N+1 (030, 037), readOnly/flush/dirty checking (031, 033), bulk update bỏ qua persistence context (032), LazyInitializationException (034), optimistic lock @Version (035), IDENTITY vs SEQUENCE/batching (036), cascade/orphanRemoval + owning side (038), khoá nóng/atomic UPDATE + Redis (039), HHH90003004 join fetch + Pageable (040), Lombok @Data equals/hashCode (041).
- 4/12 câu `multi: true` (qz-jpa-032 [0,1], qz-jpa-036 [3,4], qz-jpa-039 [3,4], qz-jpa-041 [2,3,4]); đáp án đúng rải đều: index 0 ×3, 1 ×4, 2 ×2, 3 ×5, 4 ×3.
- `explain` dài 1317–1680 ký tự, mỗi câu giải thích vì sao đáp án đúng **và** vì sao từng phương án sai là sai.
- Nghiệm thu: `node --check js/data/quiz-spring.js` OK; `node scripts/build-light-index.js` (đã chạy, index-light.js không còn stale); `node scripts/validate.js` → `OK — không có lỗi.` Chỉ còn cảnh báo cũ của `path.js` về bài học chưa nằm trong PATH (không thuộc phạm vi task này).
- Không dùng backtick/`${` trong template literal; không sửa file khác ngoài `js/data/index-light.js` (file sinh tự động, bắt buộc theo AGENTS.md mục 6).
- Không commit, không mở trình duyệt, không kill tiến trình.
Reviewed-by: kilo (T1713R)
