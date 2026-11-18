# T2404 — 1 bài học Claude: prompt caching và batch để giảm chi phí (bài tập tính tiền)

Status: DONE
Agent: kilo
Owns: `js/data/lessons-claude.js`
After: T2372

Đọc AGENTS.md mục 12 + bài mẫu lesson-collections-001; grep title: để không trùng (đã có ContextBudget). Thêm ĐÚNG 1 bài (id tiếp số lớn nhất, order tiếp): cache write vs cache read, TTL, đặt cache_control đúng chỗ (prefix ổn định), Batch API cho job không gấp, chọn model theo tác vụ. Bài tập CostEstimator tính chi phí theo usage (input, cache write, cache read, output) với bảng giá truyền vào (không hard-code giá), test ≥ 4 case.

## Luật
AGENTS.md. Chỉ THÊM trước dòng `);` cuối file, không sửa/xoá mục cũ, id tiếp số LỚN NHẤT, không backtick, không ký hiệu đô-la + ngoặc nhọn. KHÔNG sửa đặc tả file task này. Không commit. Ghi số id trước/sau vào Notes (phải tăng; không tăng thì chưa được DONE).

## Nghiệm thu
`node --check js/data/lessons-claude.js`, `node scripts/build-light-index.js`, `node scripts/test-lessons.js` (reference pass hết, starter không pass hết), `node scripts/validate.js` → OK. Status: DONE + id mới vào Notes.

## Notes
Trước: lesson-claude-013 (order 13). Sau: lesson-claude-014 (order 14). Đã chạy verify: syntax OK, build-light-index OK, test-lessons 328/328 pass, validate OK (chỉ lỗi bugs.js không liên quan).
Reviewed-by: kilo (T2404R)
