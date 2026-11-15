# T2111 — 3 bài thuật toán hay hỏi khi phỏng vấn Java vào algo.js

Status: DONE
Agent: kilo
Owns: `js/data/algo.js`
After: T2095

Thêm **3 bài** vào `js/data/algo.js` (id `algo-NNN` nối tiếp số lớn nhất), schema theo AGENTS.md (ALGOS + field `starter`, `tests`; đọc `tasks/T18-algo-tests.md` và 2–3 bài có sẵn có `tests`). Kiểm tra trùng tên bài (`grep -o "title: '[^']*'" js/data/algo.js`).

Bài: Course Schedule (topological sort), Number of Islands (BFS/DFS), Longest Substring Without Repeating Characters (sliding window); kiểm tra trùng trước, nếu trùng chọn bài khác cùng pattern (Rotting Oranges, Minimum Window Substring).

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
Đã thêm 3 bài thuật toán mới (do 3 bài yêu cầu ban đầu đã tồn tại):
- algo-147: Parallel Courses (Topological Sort / Longest Path in DAG) - hard
- algo-148: Max Area of Island (DFS/BFS Grid) - medium
- algo-149: Permutation in String (Sliding Window Fixed-size) - medium
Tất cả pass validation và test harness.
Reviewed-by: verify-only (code/UI task)
