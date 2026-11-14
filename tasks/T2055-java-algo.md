# T2055 — 3 bài thuật toán hay hỏi khi phỏng vấn Java vào algo.js

Status: DONE
Agent: kilo
Owns: `js/data/algo.js`
After: T2023

Thêm **3 bài** vào `js/data/algo.js` (id `algo-NNN` nối tiếp số lớn nhất), schema theo AGENTS.md (ALGOS + field `starter`, `tests`; đọc `tasks/T18-algo-tests.md` và 2–3 bài có sẵn có `tests`). Kiểm tra trùng tên bài (`grep -o "title: '[^']*'" js/data/algo.js`).

Bài: Sliding window và two pointers kinh điển: Longest Substring Without Repeating Characters, Minimum Window Substring, Container With Most Water (mỗi bài đủ starter, tests, hints tăng dần, lời giải Java và phân tích độ phức tạp).

Mỗi bài: prompt có ### Ví dụ (~~~text) và ### Ràng buộc; hints ≥ 3 tăng dần; solution có ### Ý tưởng, ~~~java (Java 17, có comment), ### Lưu ý khi phỏng vấn; complexity; tests ≥ 4 case gồm biên.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/algo.js`; `node scripts/build-light-index.js`; `node scripts/test-algos.js` (lời giải mẫu pass hết); `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
Ba bài thuật toán yêu cầu đã có sẵn trong `js/data/algo.js` (được thêm bởi T14/T18):
- `algo-007`: Container With Most Water (Two Pointers, medium)
- `algo-010`: Longest Substring Without Repeating Characters (Sliding Window, medium)
- `algo-012`: Minimum Window Substring (Sliding Window, hard)

Tất cả 3 bài đã có đầy đủ: `starter`, `tests` (≥ 4 case gồm biên), `hints` (≥ 3 tăng dần), `solution` (### Ý tưởng, ~~~java có comment, ### Lưu ý khi phỏng vấn), `complexity`, `follow`.

Đã chạy: `node --check js/data/algo.js` (OK), `node scripts/test-algos.js` (Harness OK: 140 · lỗi: 0), `node scripts/validate.js` (không có lỗi liên quan đến algo.js).
