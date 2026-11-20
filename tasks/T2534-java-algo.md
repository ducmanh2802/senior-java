# T2534 — 3 bài thuật toán hay hỏi khi phỏng vấn Java vào algo.js

Status: DONE
Agent: kilo
Owns: `js/data/algo.js`
After: T2463

Thêm 3 bài vào `js/data/algo.js` (id nối tiếp số lớn nhất algo-165): algo-166 (Two Sum II — Input Array Is Sorted, Two Pointers), algo-167 (Find Pivot Index, Prefix Sum), algo-168 (Flood Fill, BFS/DFS). Mỗi bài có prompt (### Ví dụ, ### Ràng buộc), hints ≥ 3 tăng dần, solution (### Ý tưởng, ~~~java Java 17 có comment, ### Lưu ý khi phỏng vấn), complexity, tests ≥ 5 case (bao gồm biên/edge case và case lớn). Kiểm tra trùng tên: Valid Anagram (algo-003), Product of Array Except Self (algo-153), Rotting Oranges (algo-108) đã có → bỏ qua, chọn bài khác cùng pattern.

## Notes
- Đã thêm algo-166, algo-167, algo-168 vào cuộn js/data/algo.js (trước dòng `);` cuối cùng); không sửa mục cũ, không sửa file khác.
- node --check js/data/algo.js → OK.
- node scripts/build-light-index.js → OK (index-light.js regenerated).
- node scripts/test-algos.js algo-166/167/168 → tất cả pass (5/5, 6/6, 5/5).
- node scripts/validate.js → không có lỗi nào thuộc algo.js. Các LỖI còn lại nằm hoàn toàn trong js/data/bugs.js (bug-047, bug-048, bug-050) — file đó đã bị sửa trước khi task này bắt đầu (706 dòng, không do tác vụ này), thuộc nhiệm vụ T2532, nên không được sửa theo quy tắc 3 AGENTS.md.
Reviewed-by: verify-only (code/UI task)
