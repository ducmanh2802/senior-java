# T1707 — 3 bài thuật toán hay hỏi khi phỏng vấn Java vào algo.js

Status: DONE
Agent: kilo
Owns: `js/data/algo.js`
After: T1045

Thêm **3 bài** vào `js/data/algo.js` (id `algo-NNN` nối tiếp số lớn nhất), schema theo AGENTS.md (ALGOS + field `starter`, `tests`; đọc `tasks/T18-algo-tests.md` và 2–3 bài có sẵn có `tests`). Kiểm tra trùng tên bài (`grep -o "title: '[^']*'" js/data/algo.js`).

Bài: LRU Cache (LinkedHashMap và tự cài bằng HashMap + danh sách liên kết kép), Top K Frequent Elements (heap vs bucket sort), Merge Intervals — chỉ thêm bài nào CHƯA có; nếu đã có thì thay bằng bài cùng mức hay gặp khác (ví dụ Meeting Rooms II, Product of Array Except Self).

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
Đã thêm 3 bài thuật toán mới (algo-138, algo-139, algo-140) vì LRU Cache (algo-022), Merge Intervals (algo-033), Meeting Rooms II (algo-034) đã có sẵn:
- algo-138: Top K Frequent Elements (heap + bucket sort, medium)
- algo-139: Product of Array Except Self (prefix/suffix product, medium)
- algo-140: Longest Consecutive Sequence (HashSet O(n), medium)

Tất cả validation và test pass.
Reviewed-by: verify-only (code/UI task)
