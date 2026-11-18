# T2370 — 1 bài học Java hiện đại: record + sealed + pattern matching cho mô hình giao dịch

Status: DONE
Agent: kilo
Owns: `js/data/lessons-modern.js`
After: T2257

Đọc AGENTS.md mục 12 + bài mẫu lesson-collections-001; grep title: để không trùng. Thêm ĐÚNG 1 bài (id lesson-modern-NNN tiếp số lớn nhất, order tiếp theo): mô hình hoá giao dịch bằng sealed interface Txn permits Deposit, Withdraw, Transfer (record), xử lý bằng switch pattern matching (dạy trong body là Java 21; BÀI TẬP phải biên dịch Java 17 nên dùng instanceof pattern + if/else). Bài tập: FeeCalculator theo loại giao dịch + validate record compact constructor; test ≥ 4 case.

## Luật
AGENTS.md (đọc mục liên quan). Chỉ THÊM trước dòng `);` cuối file, không sửa/xoá mục cũ, id tiếp số LỚN NHẤT, không backtick, không ký hiệu đô-la + ngoặc nhọn. Không commit. Ghi số id trước/sau vào Notes (phải tăng đúng số đã thêm).

## Nghiệm thu
`node --check js/data/lessons-modern.js`, `node scripts/build-light-index.js`, `node scripts/test-lessons.js` (reference pass hết, starter không pass hết), `node scripts/validate.js` → OK. Status: DONE + id mới vào Notes.

## Notes
- Đã thêm lesson-modern-008.
- Cảnh báo path.js trong validate.js: lesson-modern-008 chưa được thêm vào path.js.
