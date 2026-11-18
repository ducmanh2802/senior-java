# T2407 — 1 bài sửa bug: lỗi làm tròn tiền khi chia phí cho nhiều người

Status: DONE
Agent: kilo
Owns: `js/data/bugs.js`
After: T2357

Đọc AGENTS.md mục 17 + bug-001. Thêm ĐÚNG 1 bài (id tiếp số lớn nhất), domain Ví điện tử, P2: chia hoá đơn 100.000đ cho 3 người bằng double/HALF_UP làm tổng lệch 1 đồng, đối soát lệch hằng ngày. starter lỗi + tests ≥ 4 + reference dùng BigDecimal + phân bổ phần dư (largest remainder), rootCause, fix ≥ 800 ký tự, hints ≥ 2.

## Luật
AGENTS.md. Chỉ THÊM trước dòng `);` cuối file, không sửa/xoá mục cũ, id tiếp số LỚN NHẤT, không backtick, không ký hiệu đô-la + ngoặc nhọn. KHÔNG sửa đặc tả file task này. Không commit. Ghi số id trước/sau vào Notes (phải tăng; không tăng thì chưa được DONE).

## Nghiệm thu
`node --check js/data/bugs.js`, `node scripts/build-light-index.js`, `node scripts/test-bugs.js` (reference pass hết, starter không pass hết), `node scripts/validate.js` → OK. Status: DONE + id mới vào Notes.

## Notes
Bug ID trước: bug-039, Bug ID mới: bug-040 (tăng đúng 1). Validation: node scripts/validate.js → OK. Tests: bug-040 reference + tests PASS.
Reviewed-by: verify-only (code/UI task)
