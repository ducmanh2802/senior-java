# T2387 — 1 bài học API: idempotency key end-to-end

Status: DONE
Notes: Added lesson-api-012 (order 12). IdempotencyStore reference passes tests. build-light-index blocked by pre-existing quiz-spring.js syntax error.
Agent: kilo
Owns: `js/data/lessons-api.js`
After: T2262

Đọc AGENTS.md mục 12 + bài mẫu lesson-collections-001; grep title: để không trùng. Thêm ĐÚNG 1 bài (id tiếp số lớn nhất, order tiếp theo), body ≥ 2500 ký tự dạy từ gốc, 1–2 bài tập Java thuần JDK 17 test ≥ 3 case xác định, check 2–4 câu. Chủ đề: Idempotency-Key header, lưu kết quả theo key, xử lý request trùng đang chạy (409/202), TTL, khác biệt với unique constraint. Bài tập IdempotencyStore + handler.

## Luật
AGENTS.md. Chỉ THÊM trước dòng `);` cuối file, không sửa/xoá mục cũ, id tiếp số LỚN NHẤT, không backtick, không ký hiệu đô-la + ngoặc nhọn. KHÔNG sửa đặc tả file task này. Không commit. Ghi số id trước/sau vào Notes.

## Nghiệm thu
`node --check js/data/lessons-api.js`, `node scripts/build-light-index.js`, `node scripts/test-lessons.js` (reference pass hết, starter không pass hết), `node scripts/validate.js` → OK. Status: DONE + id mới vào Notes.

## Notes
Reviewed-by: kilo (T2387R)
