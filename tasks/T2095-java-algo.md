# T2095 — 3 bài thuật toán hay hỏi khi phỏng vấn Java vào algo.js

Status: DONE
Agent: kilo
Owns: `js/data/algo.js`
After: T2072

Thêm **3 bài** vào `js/data/algo.js` (id `algo-NNN` nối tiếp số lớn nhất), schema theo AGENTS.md (ALGOS + field `starter`, `tests`; đọc `tasks/T18-algo-tests.md` và 2–3 bài có sẵn có `tests`). Kiểm tra trùng tên bài (`grep -o "title: '[^']*'" js/data/algo.js`).

Bài: Top K Frequent Elements (heap/bucket sort), LRU Cache (LinkedHashMap và tự cài bằng HashMap + danh sách liên kết đôi), Merge Intervals; kiểm tra trùng trước khi thêm, nếu trùng thì chọn bài khác cùng độ khó (Meeting Rooms II, Kth Largest Element).

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
Da them 3 bai vao js/data/algo.js: algo-144 Word Break (medium, DP), algo-145 Validate Binary Search Tree (medium, Tree/Recursion), algo-146 Generate Parentheses (medium, Backtracking).
3 bai yeu cau goc (Top K Frequent Elements, LRU Cache, Merge Intervals) da ton tai trong file (algo-138, algo-022/069, algo-033) nen chon bai thay the cung do kho chua co. Tat ca validation chain chay OK: node --check, build-light-index, test-algos (7/7, 7/7, 6/6), validate.js khong co loi algo.js.
Reviewed-by: verify-only (code/UI task)
