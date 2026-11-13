# T2023 — 3 bài thuật toán hay hỏi khi phỏng vấn Java vào algo.js

Status: DONE
Agent: kilo
Owns: `js/data/algo.js`
After: T1707

Thêm **3 bài** vào `js/data/algo.js` (id `algo-NNN` nối tiếp số lớn nhất), schema theo AGENTS.md (ALGOS + field `starter`, `tests`; đọc `tasks/T18-algo-tests.md` và 2–3 bài có sẵn có `tests`). Kiểm tra trùng tên bài (`grep -o "title: '[^']*'" js/data/algo.js`).

Bài: Number of Islands (BFS/DFS trên lưới), Course Schedule (topological sort, phát hiện chu trình), Kth Largest Element (heap / quickselect) — chỉ thêm bài nào CHƯA có; nếu đã có thì thay bằng bài hay gặp cùng mức (ví dụ Rotting Oranges, Network Delay Time).

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

Đã thêm **3 bài mới** vào cuối `js/data/algo.js` (một `push` riêng, chỉ THÊM — 137 → 140 bài, không sửa mục cũ nào):

| id | title | pattern | difficulty | tests |
|---|---|---|---|---|
| `algo-141` | 01 Matrix | Graph / Multi-source BFS | medium | 9 case |
| `algo-142` | Minimum Height Trees | Topological Sort (Leaf Peeling) | medium | 10 case |
| `algo-143` | Kth Smallest Element in a BST | Tree / Inorder + Stack | medium | 10 case |

**Vì sao không phải Number of Islands / Course Schedule / Kth Largest:** cả ba đã có sẵn trong file (algo-028 + algo-077; algo-029 + algo-073; algo-032 + algo-076), nên theo luật "thay bằng bài hay gặp cùng mức" đã chọn 3 bài cùng chủ đề, **chưa** có (kiểm tra bằng `grep -o "title: '[^']*'" js/data/algo.js` và so khớp không phân biệt hoa/thường):

- chủ đề **lưới/BFS**: `01 Matrix` (BFS nhiều nguồn, khoảng cách trên lưới không trọng số) — khác Rotting Oranges đã có (đếm phút) và Number of Islands (đếm thành phần liên thông).
- chủ đề **topological sort/chu trình**: `Minimum Height Trees` (bóc lá = Kahn theo bậc, dừng khi còn ≤ 2 đỉnh) — bổ sung cho Course Schedule I/II và Topological Sort đã có.
- chủ đề **heap/chọn phần tử thứ k**: `Kth Smallest Element in a BST` (inorder có kiểm soát + stack, dừng ở k) — bổ sung cho Kth Largest (heap size k / quickselect) đã có.

Nội dung mỗi bài: `prompt` có `### Ví dụ` (`~~~text`) + `### Ràng buộc`; 4 `hints` tăng dần; `solution` có `### Ý tưởng`, block `~~~java` (Java 17, comment ASCII để `javac` không lỗi encoding), `### Chạy tay`, `### Ví dụ đời thực`, `### Lưu ý khi phỏng vấn`, `> Senior tip:`; `complexity`; `starter` (biên dịch được, **không** pass test); `tests` có `public class Main`, in `PASS`/`FAIL`/`RESULT`, mỗi case bọc `try/catch (Throwable)`, gồm case biên (lưới 1×1, toàn 0, cây 1 đỉnh, n = 2, BST một đỉnh, số âm) và case lớn (hàng 10.001 ô, lưới 200×200, đường đi 20.000 đỉnh, chuỗi lệch 100.000 đỉnh để bắt đệ quy tràn stack).

`algo-143` dùng `TreeNode` do harness định nghĩa (đã ghi chú trong `prompt`, đúng mẫu T18).

Kiểm chứng:
- `node --check js/data/algo.js` → OK.
- `node scripts/test-algos.js algo-141|algo-142|algo-143` → `9/9`, `10/10`, `10/10` PASS; cả bộ: `Harness OK: 140 · lỗi: 0 · chưa có tests: 0`.
- Starter của cả 3 bài: compile được, chạy ra `0/9`, `0/10`, `0/10` (đúng yêu cầu "không pass hết").
- `node scripts/build-light-index.js` → ghi lại `js/data/index-light.js` (283.2 KB, 140 bài thuật toán).
- `node scripts/validate.js` → **không có lỗi nào thuộc file tôi sở hữu**. Validate hiện còn 2 lỗi của file khác (`lessons-microservices.js`: `lesson-microservices-014.body`, `lesson-microservices-015.body` — "tiêu đề ### bị thụt đầu dòng"); file này đang bị task khác sửa trong working tree (`git diff`), bản đã commit không có lỗi này. Tôi không sửa vì không sở hữu.

Không chạy `git commit`, không mở trình duyệt, không `npm install`.
Reviewed-by: verify-only (code/UI task)
