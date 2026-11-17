# T2366 — 1 bài học SQL: window function cho báo cáo giao dịch ngân hàng

Status: DONE
Agent: kilo
Owns: `js/data/lessons-sql.js`
After: T2258

Đọc AGENTS.md mục 12 + bài mẫu lesson-collections-001; grep title: để không trùng. Thêm ĐÚNG 1 bài (id lesson-sql-NNN tiếp số lớn nhất, order tiếp theo): ROW_NUMBER/RANK, SUM OVER (running balance), LAG để phát hiện giao dịch bất thường, PARTITION BY account, so với GROUP BY. Bài tập Java thuần: mô phỏng tính running balance và rank theo partition trên List<Txn> (không cần DB), test ≥ 3 case. Ví dụ SQL PostgreSQL đúng cú pháp trong body.

## Luật
AGENTS.md (đọc mục liên quan). Chỉ THÊM trước dòng `);` cuối file, không sửa/xoá mục cũ, id tiếp số LỚN NHẤT, không backtick, không ký hiệu đô-la + ngoặc nhọn. Không commit. Ghi số id trước/sau vào Notes (phải tăng đúng số đã thêm).

## Nghiệm thu
`node --check js/data/lessons-sql.js`, `node scripts/build-light-index.js`, `node scripts/test-lessons.js` (reference pass hết, starter không pass hết), `node scripts/validate.js` → OK. Status: DONE + id mới vào Notes.

## Notes
- lesson-sql trước: 13 bài (id lớn nhất `lesson-sql-013`, order 13). Sau: 14 bài, đã thêm `lesson-sql-014`, order 14, title "Window function cho báo cáo giao dịch ngân hàng: PARTITION BY, running balance, LAG và so với GROUP BY".
- Nội dung: PARTITION BY/ORDER BY/frame (ROWS vs RANGE), ROW_NUMBER vs RANK, SUM() OVER running balance, LAG phát hiện giao dịch bất thường (delta/cờ), so sánh với GROUP BY; ví dụ SQL PostgreSQL đúng cú pháp; body ≥ 2500 ký tự, goals/check/explain đầy đủ; có ví dụ đời thực và trả lời phỏng vấn.
- Bài tập Java thuần (không DB): `BankReport.rankByAmountDesc` (ROW_NUMBER theo partition amount desc, tie ổn định) và `runningBalance` (SUM OVER PARTITION BY account ORDER BY date/input-order, reset theo account), 5 test case deterministic, không sửa input.
- Kiểm tra: `node --check js/data/lessons-sql.js` OK; `node scripts/build-light-index.js` OK (ghi js/data/index-light.js; có warning cú pháp pre-existing ở q-scenario.js, quiz-ccao-2.js không thuộc file sở hữu); `node scripts/test-lessons.js` OK "Lesson exercises OK: 318/318 (283 bài học, 317 từ cache)".
- `node scripts/validate.js`: vẫn còn LỖI/CẢNH BÁO pre-existing ngoài phạm vi sở hữu (q-scenario.js, quiz-ccao-2.js, labs-thread.js lỗi cú pháp; related scenario-* thiếu trong bugs.js/projects.js/path.js; một số cảnh báo độ dài/lesson không trong PATH). Không sửa file không sở hữu theo luật 3. Phần liên quan `lessons-sql.js` và bài mới không phát sinh lỗi mới.
