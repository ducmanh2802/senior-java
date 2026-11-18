# T2397 — 1 bài học core: equals/hashCode/compareTo nhất quán với BigDecimal

Status: DONE
Agent: kilo
Owns: `js/data/lessons-core.js`
After: T2253

Đọc AGENTS.md mục 12 + bài mẫu lesson-collections-001; grep title: để không trùng. Thêm ĐÚNG 1 bài (id tiếp số lớn nhất, order tiếp theo), body ≥ 2500 ký tự dạy từ gốc, 1–2 bài tập Java thuần JDK 17 test ≥ 3 case xác định, check 2–4 câu. Chủ đề: BigDecimal equals vs compareTo (1.0 vs 1.00), HashSet/TreeSet hành xử khác nhau, làm tròn RoundingMode, tiền tệ. Bài tập Money record chuẩn hoá scale, equals/hashCode đúng.

## Luật
AGENTS.md. Chỉ THÊM trước dòng `);` cuối file, không sửa/xoá mục cũ, id tiếp số LỚN NHẤT, không backtick, không ký hiệu đô-la + ngoặc nhọn. KHÔNG sửa đặc tả file task này. Không commit. Ghi số id trước/sau vào Notes (phải tăng; không tăng thì chưa được DONE).

## Nghiệm thu
`node --check js/data/lessons-core.js`, `node scripts/build-light-index.js`, `node scripts/test-lessons.js` (reference pass hết, starter không pass hết), `node scripts/validate.js` → OK. Status: DONE + id mới vào Notes.

## Notes

Id truoc: lesson-core-013. Id sau: lesson-core-014 (da tang).
Reviewed-by: kilo (T2397R)
