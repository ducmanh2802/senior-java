# T2463 — 3 bài thuật toán hay hỏi khi phỏng vấn Java vào algo.js

Status: DONE
Agent: kilo
Owns: `js/data/algo.js`
After: T2445

Thêm **3 bài** vào `js/data/algo.js` (id `algo-NNN` nối tiếp số lớn nhất), schema theo AGENTS.md (ALGOS + field `starter`, `tests`; đọc `tasks/T18-algo-tests.md` và 2–3 bài có sẵn có `tests`). Kiểm tra trùng tên bài (`grep -o "title: '[^']*'" js/data/algo.js`).

Bài: Word Search hoặc Clone Graph (DFS/backtracking), Daily Temperatures (monotonic stack), Coin Change (DP); kiểm tra trùng trước, nếu trùng chọn bài khác cùng pattern (Next Greater Element, Partition Equal Subset Sum).

Mỗi bài: prompt có ### Ví dụ (~~~text) và ### Ràng buộc; hints ≥ 3 tăng dần; solution có ### Ý tưởng, ~~~java (Java 17, có comment), ### Lưu ý khi phỏng vấn; complexity; tests ≥ 4 case gồm biên.

## Luật
- **BẮT BUỘC viết tiếng Việt CÓ DẤU đầy đủ** (Tóm tắt, không, nguyên nhân…). Nội dung không dấu sẽ bị trả lại.
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/algo.js`; `node scripts/build-light-index.js`; `node scripts/test-algos.js` (lời giải mẫu pass hết); `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes

Đã thêm **3 bài** vào cuối khối `push` cuối của `js/data/algo.js` (chèn sau `algo-162`, trước `);` cuối file). Không sửa mục đã có, không mất id nào ( Trước: max id `algo-162`; sau: thêm `algo-163/164/165`).

- `algo-163` — **Letter Combinations of a Phone Number** · Backtracking (DFS) · 6 test PASS 6/6.
- `algo-164` — **Next Greater Element II** · Monotonic Stack (mảng vòng, duyệt 2n với `i % n`) · 6 test PASS 6/6.
- `algo-165` — **Longest Common Subsequence** · Dynamic Programming 2 chiều · 6 test PASS 6/6.

Vì các đề gợi ý trong task (Word Search, Clone Graph, Daily Temperatures, Coin Change) **đều đã tồn tại** trong file (đã `grep` xác nhận), theo yêu cầu "nếu trùng chọn bài khác cùng pattern" tôi chọn 3 bài cùng pattern nhưng chưa có: Backtracking (DFS), Monotonic Stack, DP.

Mỗi bài: `prompt` có `### Ví dụ` (~~~text) + `### Ràng buộc`; `hints` 3 mức tăng dần; `solution` có `### Ý tưởng` + `~~~java` (Java 17, comment ASCII) + `### Lưu ý khi phỏng vấn` + `> Senior tip:`; `complexity`; `starter`; `tests` ≥ 6 case gồm biên (rỗng, 1 phần tử, toàn bằng nhau, giảm dần…). Nội dung tiếng Việt có dấu, giải thích từ gốc cho người hổng nền tảng.

Kiểm chứng:
- `node --check js/data/algo.js` → OK.
- `node scripts/test-algos.js` → `Harness OK: 162 · lỗi: 0 · chưa có tests: 0`; riêng `algo-163/164/165` đều `RESULT 6/6`.
- `node scripts/build-light-index.js` → ghi lại `js/data/index-light.js`.
- `node scripts/validate.js`: **không còn lỗi nào thuộc `algo.js` / `index-light.js`**.

LƯU Ý cho integrator: `node scripts/validate.js` hiện vẫn in `LỖI` **chỉ từ `js/data/lessons-spring.js`** (lesson-spring-024/029/030 chưa hoàn thiện — file của task khác, đang được agent khác viết dở, mtime 07:23 trước phiên này). Theo AGENTS.md luật 3, T2463 **không** sửa file này. Đề nghị chạy lại `node scripts/validate.js` sau khi task `lessons-spring` hoàn tất — khi đó toàn repo sẽ `OK — không có lỗi.`
Reviewed-by: verify-only (code/UI task)
