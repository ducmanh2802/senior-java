# T2362 — 1 debug lab thread: GC pause làm độ trễ khớp lệnh p99 vọt lên

Status: DONE
Agent: kilo
Owns: `js/data/labs-thread.js`
After: T2325

Đã thêm lab-thread-021 vào js/data/labs-thread.js. Đã chạy validate thành công.
## Luật
AGENTS.md (đọc mục liên quan). Chỉ THÊM trước dòng `);` cuối file, không sửa/xoá mục cũ, id tiếp số LỚN NHẤT, không backtick, không ký hiệu đô-la + ngoặc nhọn. Không commit. Ghi số id trước/sau vào Notes (phải tăng đúng số đã thêm).

## Nghiệm thu
`node --check js/data/labs-thread.js`, `node scripts/build-light-index.js`, `node scripts/validate.js` → OK. Status: DONE + id mới vào Notes.

## Notes
