# T2398 — 1 bài học collections: LinkedHashMap LRU và PriorityQueue top-K

Status: DONE
Agent: kilo
Owns: `js/data/lessons-collections.js`
After: T2254

Đọc AGENTS.md mục 12 + bài mẫu lesson-collections-001; grep title: để không trùng. Thêm ĐÚNG 1 bài (id tiếp số lớn nhất, order tiếp theo), body ≥ 2500 ký tự dạy từ gốc, 1–2 bài tập Java thuần JDK 17 test ≥ 3 case xác định, check 2–4 câu. Chủ đề: LinkedHashMap accessOrder + removeEldestEntry làm LRU cache, PriorityQueue min-heap cho top-K, độ phức tạp. Bài tập LruCache và TopK.

## Luật
AGENTS.md. Chỉ THÊM trước dòng `);` cuối file, không sửa/xoá mục cũ, id tiếp số LỚN NHẤT, không backtick, không ký hiệu đô-la + ngoặc nhọn. KHÔNG sửa đặc tả file task này. Không commit. Ghi số id trước/sau vào Notes (phải tăng; không tăng thì chưa được DONE).

## Nghiệm thu
`node --check js/data/lessons-collections.js`, `node scripts/build-light-index.js`, `node scripts/test-lessons.js` (reference pass hết, starter không pass hết), `node scripts/validate.js` → OK. Status: DONE + id mới vào Notes.

## Notes
- ID trước: lesson-collections-009 (order 9). ID sau: lesson-collections-010 (order 10) — tăng.
- Đã thêm 1 bài `lesson-collections-010` ("LinkedHashMap LRU cache và PriorityQueue min-heap cho Top-K") vào cuối `js/data/lessons-collections.js` (trước `);`), không sửa/xoá bài cũ. Có body chi tiết (thuật ngữ, accessOrder, removeEldestEntry, min-heap, top-K, độ phức tạp, ví dụ, lỗi hay gặp, liên hệ phỏng vấn), 2 bài tập Java thuần JDK 17 (LruCache, TopK) mỗi bài test >= 3 case xác định, 3 câu check.
- Kiểm tra: `node --check js/data/lessons-collections.js` OK; `node scripts/build-light-index.js` OK (ghi js/data/index-light.js); `node scripts/test-lessons.js` OK (327/327, 290 bài học, 325 từ cache); `node scripts/validate.js` OK (không lỗi, chỉ cảnh báo sẵn có không liên quan). Không git commit, không mở trình duyệt, không kill process theo tên.
Reviewed-by: kilo (T2398R)
