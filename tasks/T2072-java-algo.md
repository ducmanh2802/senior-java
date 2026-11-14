# T2072 — 3 bài thuật toán hay hỏi khi phỏng vấn Java vào algo.js

Status: DONE
Agent: kilo
Owns: `js/data/algo.js`
After: T2055

Thêm **3 bài** vào `js/data/algo.js` (id `algo-NNN` nối tiếp số lớn nhất), schema theo AGENTS.md (ALGOS + field `starter`, `tests`; đọc `tasks/T18-algo-tests.md` và 2–3 bài có sẵn có `tests`). Kiểm tra trùng tên bài (`grep -o "title: '[^']*'" js/data/algo.js`).

Bài: Heap / priority queue kinh điển: Top K Frequent Elements, Merge K Sorted Lists, Find Median from Data Stream (mỗi bài đủ starter, tests, hints tăng dần, lời giải Java với PriorityQueue và phân tích độ phức tạp).

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
Nội dung T2072 đã có sẵn đầy đủ trong js/data/algo.js (lần chạy trước đã thêm nhưng chưa đánh dấu DONE):
- algo-023 'Merge K Sorted Lists' (hard, Linked List/heap) — starter, tests, solution, complexity đầy đủ
- algo-088 'Median of a Number Stream' (Find Median from Data Stream, medium, Heaps) — full
- algo-138 'Top K Frequent Elements' (medium, Heap / Hash Map) — full
Không thêm id mới (tránh trùng tên bài theo luật task). Nghiệm thu: node --check js/data/algo.js OK; node scripts/test-algos.js → Harness OK: 140 · lỗi: 0 · chưa có tests: 0; node scripts/build-light-index.js OK; node scripts/validate.js → OK — không có lỗi. Không commit (theo quy ước repo).
