# T2331 — 1 bài học JPA mới: mô phỏng N+1 và cách sửa bằng fetch join/batch

Status: DONE
Agent: kilo
Owns: `js/data/lessons-jpa.js`
After: T2250

Đọc AGENTS.md mục 12 và bài mẫu `lesson-collections-001`; grep `title:` trong file để không trùng. Thêm ĐÚNG 1 bài (id `lesson-<track>-NNN` + order tiếp theo), body ≥ 2500 ký tự dạy từ gốc, 1–2 bài tập Java thuần (JDK 17, không class public ngoài Main, test ≥ 3 case deterministic), check 2–4 câu. Chủ đề: N+1 với lazy loading, fetch join, @BatchSize, entity graph, DTO projection. Bài tập: repository giả đếm số query; viết loadOrdersWithItems sao cho số query = 1 (join) hoặc 1 + ceil(n/batch); test đếm query.

## Luật
AGENTS.md (đọc mục liên quan). Chỉ THÊM trước dòng `);` cuối file, không sửa/xoá mục cũ, id tiếp số LỚN NHẤT (không dùng lại số cũ), không backtick, không ký hiệu đô-la + ngoặc nhọn. Không commit. Ghi số id trước/sau vào Notes (phải tăng đúng số đã thêm).

## Nghiệm thu
`node --check js/data/lessons-jpa.js`, `node scripts/build-light-index.js`, `node scripts/test-lessons.js` (reference pass hết, starter không pass hết), `node scripts/validate.js` → OK. Status: DONE + id mới vào Notes.

## Notes
Đã thêm `lesson-jpa-016` (order 16) vào `js/data/lessons-jpa.js`. Trước đó lesson cuối là `lesson-jpa-015` (order 15). Bài học mới bao gồm: giải thích chi tiết N+1, fetch join (1 query), batch fetching (1 + ceil(N/batchSize) query), so sánh hai cách, bẫy phân trang fetch join, ví dụ thực tế 5000 đơn hàng, bài tập `loadOrdersWithItems(strategy)` với enum Strategy { FETCH_JOIN, BATCH } và repo đếm query để kiểm chứng cả hai chiến lược, 4 câu check trắc nghiệm.
